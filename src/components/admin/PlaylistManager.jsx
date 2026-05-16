import { addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { Edit3, Eye, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { db } from '../../firebase.js';
import { buildPlaylistOptions, cardStyles, defaultPlaylistTheme, getPlaylistRoute, getPlaylistStyle, normalizePlaylist, playlistEffects, playlistTopics, slugify, topicThemes } from '../../lib/videoLibrary.js';
import { AdminCard, confirmDelete, emptyToast, Toast } from './adminHelpers.jsx';

const empty = {
  title: '',
  title_si: '',
  title_en: '',
  slug: '',
  description: '',
  description_si: '',
  description_en: '',
  coverImageUrl: '',
  parentPlaylistId: '',
  topic: 'Spiritual Guidance',
  topic_si: '',
  topic_en: '',
  isPublished: true,
  order: 1,
  learningPathEnabled: false,
  learningPathOrder: 999,
  learningPathLabel: '',
  theme: defaultPlaylistTheme,
};

function adminError(error, path) {
  return `${path}: ${error.code || 'error'} - ${error.message}`;
}

export default function PlaylistManager() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState('');
  const [toast, setToast] = useState(emptyToast);
  const [loading, setLoading] = useState(true);
  const playlistOptions = useMemo(() => buildPlaylistOptions(playlists), [playlists]);
  const playlistMap = useMemo(() => Object.fromEntries(playlists.map((playlist) => [playlist.id, playlist])), [playlists]);

  const load = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'playlists'));
      setPlaylists(snap.docs.map((item) => normalizePlaylist(item.data(), item.id)).sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error('[PlaylistManager] load failed:', error);
      setToast({ type: 'error', message: adminError(error, 'playlists') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const preview = useMemo(() => normalizePlaylist(form, editingId || 'preview'), [form, editingId]);

  const reset = () => {
    setEditingId('');
    setForm(empty);
  };

  const patch = (field, value) => {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === 'title' && !editingId) next.slug = slugify(value);
      return next;
    });
  };

  const patchTheme = (field, value) => setForm((current) => ({ ...current, theme: { ...current.theme, [field]: value } }));

  const chooseTopic = (topic) => setForm((current) => ({
    ...current,
    topic,
    theme: { ...current.theme, ...(topicThemes[topic] || defaultPlaylistTheme) },
  }));

  const save = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      title: form.title_si || form.title,
      description: form.description_si || form.description,
      topic: form.topic_si || form.topic,
      parentPlaylistId: form.parentPlaylistId || null,
      slug: form.slug || slugify(form.title_en || form.title_si || form.title),
      order: Number(form.order || 999),
      learningPathOrder: Number(form.learningPathOrder || 999),
      updatedAt: serverTimestamp(),
      createdBy: user?.email || '',
    };
    const parent = form.parentPlaylistId ? playlistMap[form.parentPlaylistId] : null;
    payload.parentPlaylistSlug = parent?.slug || null;
    payload.depth = parent ? (parent.depth || 0) + 1 : 0;
    payload.path = parent ? [...(parent.path || []), parent.id] : [];
    payload.pathSlugs = parent ? [...(parent.pathSlugs || []), parent.slug] : [];
    try {
      if (editingId) await updateDoc(doc(db, 'playlists', editingId), payload);
      else await addDoc(collection(db, 'playlists'), { ...payload, createdAt: serverTimestamp() });
      setToast({ type: 'success', message: 'Playlist saved' });
      reset();
      await load();
    } catch (error) {
      console.error('[PlaylistManager] save failed:', error);
      setToast({ type: 'error', message: `Could not save playlist. ${adminError(error, editingId ? `playlists/${editingId}` : 'playlists')}` });
    }
  };

  const edit = (playlist) => {
    setEditingId(playlist.id);
    setForm({ ...empty, ...playlist, parentPlaylistId: playlist.parentPlaylistId || '', theme: { ...defaultPlaylistTheme, ...playlist.theme } });
  };

  const addSubPlaylist = (playlist) => {
    setEditingId('');
    setForm({
      ...empty,
      parentPlaylistId: playlist.id,
      topic: playlist.topic,
      theme: { ...defaultPlaylistTheme, ...playlist.theme },
      order: playlist.order + 1,
    });
  };

  const remove = async (playlist) => {
    const mode = window.prompt(`This playlist may contain sub-playlists or videos.\n\nType one option:\nEMPTY = Delete only if empty\nMOVE = Move videos/sub-playlists to Uncategorized\nDELETE = Delete playlist and sub-playlists\nCANCEL = Cancel`, 'EMPTY');
    if (!mode || mode.toUpperCase() === 'CANCEL') return;
    try {
      const normalizedMode = mode.toUpperCase();
      const descendants = getDescendants(playlist, playlists);
      const ids = [playlist.id, ...descendants.map((item) => item.id)];
      const videoDocs = await getVideosForPlaylistIds(ids);
      if (normalizedMode === 'EMPTY' && (descendants.length || videoDocs.length)) {
        setToast({ type: 'error', message: 'Playlist is not empty. Choose MOVE or DELETE if you want to reorganize it.' });
        return;
      }
      if (normalizedMode === 'MOVE') {
        await Promise.all([
          ...descendants.map((child) => updateDoc(doc(db, 'playlists', child.id), { parentPlaylistId: null, parentPlaylistSlug: null, depth: 0, path: [], pathSlugs: [], updatedAt: serverTimestamp() })),
          ...videoDocs.map((item) => updateDoc(item.ref, { playlistId: '', playlistSlug: '', playlistTitle: 'Uncategorized', parentPlaylistId: null, playlistPath: [], playlistPathSlugs: [], updatedAt: serverTimestamp() })),
        ]);
        await deleteDoc(doc(db, 'playlists', playlist.id));
      } else if (normalizedMode === 'DELETE') {
        await Promise.all([
          ...videoDocs.map((item) => updateDoc(item.ref, { playlistId: '', playlistSlug: '', playlistTitle: 'Uncategorized', parentPlaylistId: null, playlistPath: [], playlistPathSlugs: [], updatedAt: serverTimestamp() })),
          ...ids.map((id) => deleteDoc(doc(db, 'playlists', id))),
        ]);
      } else if (normalizedMode === 'EMPTY') {
        await deleteDoc(doc(db, 'playlists', playlist.id));
      } else {
        setToast({ type: 'error', message: 'Delete cancelled. Unknown option.' });
        return;
      }
      setToast({ type: 'success', message: 'Playlist deleted' });
      await load();
    } catch (error) {
      console.error('[PlaylistManager] delete failed:', error);
      setToast({ type: 'error', message: `Could not delete playlist. ${adminError(error, `playlists/${playlist.id}`)}` });
    }
  };

  const toggle = async (playlist) => {
    try {
      await updateDoc(doc(db, 'playlists', playlist.id), { isPublished: !playlist.isPublished, updatedAt: serverTimestamp() });
      await load();
    } catch (error) {
      console.error('[PlaylistManager] publish toggle failed:', error);
      setToast({ type: 'error', message: `Could not update playlist. ${adminError(error, `playlists/${playlist.id}`)}` });
    }
  };

  return (
    <AdminCard title="Playlist CMS" actions={<button className="btn btn-outline" type="button" onClick={reset}><Plus size={18} />New Main Playlist</button>}>
      <Toast toast={toast} />
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={save} className="grid gap-3 md:grid-cols-2">
          <input className="input" required placeholder="Title" value={form.title} onChange={(event) => patch('title', event.target.value)} />
          <input className="input" placeholder="Sinhala Title" value={form.title_si || ''} onChange={(event) => patch('title_si', event.target.value)} />
          <input className="input" placeholder="English Title" value={form.title_en || ''} onChange={(event) => patch('title_en', event.target.value)} />
          <input className="input" placeholder="Slug" value={form.slug} onChange={(event) => patch('slug', slugify(event.target.value))} />
          <textarea className="input min-h-28 md:col-span-2" placeholder="Description" value={form.description} onChange={(event) => patch('description', event.target.value)} />
          <textarea className="input min-h-24" placeholder="Sinhala Description" value={form.description_si || ''} onChange={(event) => patch('description_si', event.target.value)} />
          <textarea className="input min-h-24" placeholder="English Description" value={form.description_en || ''} onChange={(event) => patch('description_en', event.target.value)} />
          <input className="input md:col-span-2" placeholder="Cover image URL from Media Library" value={form.coverImageUrl} onChange={(event) => patch('coverImageUrl', event.target.value)} />
          <select className="input md:col-span-2" value={form.parentPlaylistId || ''} onChange={(event) => patch('parentPlaylistId', event.target.value)}>
            <option value="">Main playlist</option>
            {playlistOptions.filter((playlist) => playlist.id !== editingId && !playlist.path?.includes(editingId)).map((playlist) => <option key={playlist.id} value={playlist.id}>{`${'-- '.repeat(playlist.optionDepth || 0)}${playlist.title}`}</option>)}
          </select>
          <select className="input" value={form.topic} onChange={(event) => chooseTopic(event.target.value)}>{playlistTopics.map((topic) => <option key={topic}>{topic}</option>)}</select>
          <input className="input" placeholder="Sinhala Topic" value={form.topic_si || ''} onChange={(event) => patch('topic_si', event.target.value)} />
          <input className="input" placeholder="English Topic" value={form.topic_en || ''} onChange={(event) => patch('topic_en', event.target.value)} />
          <input className="input" type="number" min="1" placeholder="Order" value={form.order} onChange={(event) => patch('order', event.target.value)} />
          <label className="rounded-lg bg-[#fffaf0] p-3 font-bold"><input type="checkbox" checked={Boolean(form.isPublished)} onChange={(event) => patch('isPublished', event.target.checked)} /> Published</label>
          <label className="rounded-lg bg-[#fffaf0] p-3 font-bold"><input type="checkbox" checked={Boolean(form.learningPathEnabled)} onChange={(event) => patch('learningPathEnabled', event.target.checked)} /> Learning Path</label>
          <input className="input" type="number" min="1" placeholder="Learning path order" value={form.learningPathOrder} onChange={(event) => patch('learningPathOrder', event.target.value)} />
          <input className="input" placeholder="Learning path label" value={form.learningPathLabel} onChange={(event) => patch('learningPathLabel', event.target.value)} />
          <select className="input" value={form.theme.cardStyle} onChange={(event) => patchTheme('cardStyle', event.target.value)}>{cardStyles.map((style) => <option key={style} value={style}>{style}</option>)}</select>
          <select className="input" value={form.theme.effect} onChange={(event) => patchTheme('effect', event.target.value)}>{playlistEffects.map((effect) => <option key={effect} value={effect}>{effect}</option>)}</select>
          {['backgroundColor', 'textColor', 'accentColor', 'borderColor', 'gradientFrom', 'gradientTo'].map((field) => (
            <label className="grid gap-1 text-sm font-bold text-[var(--theme-muted)]" key={field}>
              {field}
              <input className="input h-12" type="color" value={form.theme[field]} onChange={(event) => patchTheme(field, event.target.value)} />
            </label>
          ))}
          <button className="btn btn-primary md:col-span-2">{editingId ? 'Update Playlist' : 'Create Playlist'}</button>
        </form>

        <div>
          <p className="mb-3 text-sm font-black uppercase text-[var(--theme-muted)]">Live preview</p>
          <PlaylistPreview playlist={preview} />
          <div className="mt-4 grid gap-3">
            {loading && <p>Loading playlists...</p>}
            {!loading && toast.type === 'error' && toast.message.includes('permission-denied') && (
              <p className="rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-800">
                Playlist access is blocked by Firestore rules. Deploy the updated firestore.rules file and make sure you are signed in as udarasampath@gmail.com.
              </p>
            )}
            {playlistOptions.map((playlist) => (
              <article className="surface rounded-lg p-4" key={playlist.id}>
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div style={{ paddingLeft: `${(playlist.optionDepth || 0) * 18}px` }}><b className="text-[var(--theme-primary)]">{playlist.optionDepth ? '└ ' : ''}{playlist.title}</b><p className="text-sm text-[var(--theme-muted)]">{playlist.topic} / depth {playlist.depth} / order {playlist.order}</p></div>
                  <div className="flex flex-wrap gap-2">
                    <button className="btn btn-outline" type="button" onClick={() => addSubPlaylist(playlist)}><Plus size={16} />Add Sub Playlist</button>
                    <Link className="btn btn-outline" to="/admin/videos">Add Video</Link>
                    <Link className="btn btn-outline" to={getPlaylistRoute(playlist)}>View Videos</Link>
                    <button className="btn btn-outline" type="button" onClick={() => toggle(playlist)}><Eye size={16} />{playlist.isPublished ? 'Published' : 'Hidden'}</button>
                    <button className="btn btn-outline" type="button" onClick={() => edit(playlist)}><Edit3 size={16} /></button>
                    <button className="btn btn-primary" type="button" onClick={() => remove(playlist)}><Trash2 size={16} /></button>
                  </div>
                </div>
              </article>
            ))}
            {!loading && !playlists.length && <p className="rounded-lg bg-[var(--theme-section)] p-4 text-[var(--theme-muted)]">No playlists yet.</p>}
          </div>
        </div>
      </div>
    </AdminCard>
  );
}

function getDescendants(playlist, playlists) {
  const children = playlists.filter((item) => item.parentPlaylistId === playlist.id);
  return children.flatMap((child) => [child, ...getDescendants(child, playlists)]);
}

async function getVideosForPlaylistIds(ids) {
  const chunks = [];
  for (let index = 0; index < ids.length; index += 10) chunks.push(ids.slice(index, index + 10));
  const snaps = await Promise.all(chunks.map((chunk) => getDocs(query(collection(db, 'videos'), where('playlistId', 'in', chunk)))));
  return snaps.flatMap((snap) => snap.docs);
}

function PlaylistPreview({ playlist }) {
  const theme = playlist.theme || defaultPlaylistTheme;
  return (
    <article className={`playlist-card playlist-effect-${theme.effect} rounded-lg border-2 p-5`} style={getPlaylistStyle(playlist)}>
      {playlist.coverImageUrl && <img className="mb-4 aspect-video w-full rounded-lg object-cover" src={playlist.coverImageUrl} alt="" />}
      <span className="rounded-full px-3 py-1 text-xs font-black uppercase" style={{ backgroundColor: theme.accentColor, color: theme.backgroundColor }}>{playlist.topic}</span>
      <h3 className="mt-4 text-2xl font-black">{playlist.title || 'Playlist title'}</h3>
      <p className="mt-2 leading-7 opacity-90">{playlist.description || 'Playlist description preview.'}</p>
    </article>
  );
}
