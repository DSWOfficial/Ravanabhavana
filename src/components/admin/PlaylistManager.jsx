import { addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, updateDoc, where, writeBatch } from 'firebase/firestore';
import { Edit3, Eye, GripVertical, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { db } from '../../firebase.js';
import { buildPlaylistOptions, cardStyles, defaultPlaylistTheme, getPlaylistRoute, getPlaylistStyle, normalizePlaylist, playlistEffects, playlistTopics, slugify, topicThemes } from '../../lib/videoLibrary.js';
import { AdminCard, emptyToast, Toast } from './adminHelpers.jsx';

const empty = {
  title: '',
  sinhalaTitle: '',
  title_si: '',
  title_en: '',
  slug: '',
  description: '',
  coverImageUrl: '',
  parentPlaylistId: '',
  topic: 'Spiritual Guidance',
  isPublished: true,
  courseMode: false,
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
  const [draggedId, setDraggedId] = useState('');

  const playlistOptions = useMemo(() => buildPlaylistOptions(playlists), [playlists]);
  const playlistMap = useMemo(() => Object.fromEntries(playlists.map((playlist) => [playlist.id, playlist])), [playlists]);
  const preview = useMemo(() => normalizePlaylist({ ...form, title_si: form.sinhalaTitle || form.title_si }, editingId || 'preview'), [form, editingId]);

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

  const reset = () => {
    setEditingId('');
    setForm(empty);
  };

  const patch = (field, value) => {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === 'title' && !editingId) next.slug = slugify(value);
      if (field === 'sinhalaTitle') next.title_si = value;
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
    const parent = form.parentPlaylistId ? playlistMap[form.parentPlaylistId] : null;
    const siblingCount = playlists.filter((item) => (item.parentPlaylistId || '') === (form.parentPlaylistId || '') && item.id !== editingId).length;
    const title = form.title.trim();
    const sinhalaTitle = (form.sinhalaTitle || form.title_si || '').trim();
    const payload = {
      ...form,
      title,
      sinhalaTitle,
      title_si: sinhalaTitle,
      description: form.description.trim(),
      slug: form.slug || slugify(title || sinhalaTitle),
      parentPlaylistId: form.parentPlaylistId || null,
      parentPlaylistSlug: parent?.slug || null,
      depth: parent ? (parent.depth || 0) + 1 : 0,
      path: parent ? [...(parent.path || []), parent.id] : [],
      pathSlugs: parent ? [...(parent.pathSlugs || []), parent.slug] : [],
      isPublished: Boolean(form.isPublished),
      published: Boolean(form.isPublished),
      courseMode: Boolean(form.courseMode),
      order: Number(form.order ?? siblingCount + 1),
      updatedAt: serverTimestamp(),
      createdBy: user?.email || '',
    };
    try {
      if (editingId) await updateDoc(doc(db, 'playlists', editingId), payload);
      else await addDoc(collection(db, 'playlists'), { ...payload, order: siblingCount + 1, createdAt: serverTimestamp() });
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
    setForm({
      ...empty,
      ...playlist,
      sinhalaTitle: playlist.sinhalaTitle || playlist.title_si || '',
      parentPlaylistId: playlist.parentPlaylistId || '',
      isPublished: playlist.isPublished,
      courseMode: Boolean(playlist.courseMode),
      theme: { ...defaultPlaylistTheme, ...playlist.theme },
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addSubPlaylist = (playlist) => {
    setEditingId('');
    setForm({
      ...empty,
      parentPlaylistId: playlist.id,
      topic: playlist.topic,
      theme: { ...defaultPlaylistTheme, ...playlist.theme },
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggle = async (playlist) => {
    try {
      await updateDoc(doc(db, 'playlists', playlist.id), { isPublished: !playlist.isPublished, published: !playlist.isPublished, updatedAt: serverTimestamp() });
      await load();
    } catch (error) {
      console.error('[PlaylistManager] publish toggle failed:', error);
      setToast({ type: 'error', message: `Could not update playlist. ${adminError(error, `playlists/${playlist.id}`)}` });
    }
  };

  const remove = async (playlist) => {
    const mode = window.prompt('This playlist may contain sub-playlists or videos.\n\nType EMPTY to delete only if empty, MOVE to move children/videos to Uncategorized, DELETE to remove playlist folders, or CANCEL.', 'EMPTY');
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
          deleteDoc(doc(db, 'playlists', playlist.id)),
        ]);
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

  const updateSiblingOrder = async (sourceId, targetId) => {
    if (!sourceId || sourceId === targetId) return;
    const source = playlists.find((item) => item.id === sourceId);
    const target = playlists.find((item) => item.id === targetId);
    if (!source || !target || (source.parentPlaylistId || '') !== (target.parentPlaylistId || '')) {
      setToast({ type: 'error', message: 'Only playlists under the same parent can be reordered.' });
      return;
    }
    const siblings = playlists.filter((item) => (item.parentPlaylistId || '') === (source.parentPlaylistId || '')).sort((a, b) => a.order - b.order);
    const reordered = [...siblings];
    const from = reordered.findIndex((item) => item.id === sourceId);
    const to = reordered.findIndex((item) => item.id === targetId);
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    try {
      const batch = writeBatch(db);
      reordered.forEach((item, index) => batch.update(doc(db, 'playlists', item.id), { order: index + 1, updatedAt: serverTimestamp() }));
      await batch.commit();
      setToast({ type: 'success', message: 'Order updated successfully.' });
      await load();
    } catch (error) {
      console.error('[PlaylistManager] order update failed:', error);
      setToast({ type: 'error', message: adminError(error, 'playlists order') });
    } finally {
      setDraggedId('');
    }
  };

  return (
    <AdminCard title="Playlist Manager" actions={<button className="btn btn-primary" type="button" onClick={reset}><Plus size={18} />Create Playlist</button>}>
      <Toast toast={toast} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)]">
        <form onSubmit={save} className="surface grid gap-4 rounded-lg p-5">
          <label className="grid gap-2 font-bold text-[var(--theme-primary)]">Playlist Name
            <input className="input" required value={form.title} onChange={(event) => patch('title', event.target.value)} />
          </label>
          <label className="grid gap-2 font-bold text-[var(--theme-primary)]">Sinhala Name
            <input className="input" value={form.sinhalaTitle || ''} onChange={(event) => patch('sinhalaTitle', event.target.value)} />
          </label>
          <label className="grid gap-2 font-bold text-[var(--theme-primary)]">Parent Playlist optional
            <select className="input" value={form.parentPlaylistId || ''} onChange={(event) => patch('parentPlaylistId', event.target.value)}>
              <option value="">Main playlist</option>
              {playlistOptions.filter((playlist) => playlist.id !== editingId && !playlist.path?.includes(editingId)).map((playlist) => (
                <option key={playlist.id} value={playlist.id}>{`${'— '.repeat(playlist.optionDepth || 0)}${playlist.title}`}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 font-bold text-[var(--theme-primary)]">Description
            <textarea className="input min-h-28" value={form.description} onChange={(event) => patch('description', event.target.value)} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="rounded-lg bg-[#fffaf0] p-3 font-bold"><input type="checkbox" checked={Boolean(form.isPublished)} onChange={(event) => patch('isPublished', event.target.checked)} /> Published</label>
            <label className="rounded-lg bg-[#fffaf0] p-3 font-bold"><input type="checkbox" checked={Boolean(form.courseMode)} onChange={(event) => patch('courseMode', event.target.checked)} /> Enable course mode</label>
          </div>
          <details className="rounded-lg border border-[color-mix(in_srgb,var(--theme-accent)_28%,transparent)] p-4">
            <summary className="cursor-pointer font-black text-[var(--theme-primary)]">Advanced style and learning path</summary>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input className="input" placeholder="Slug" value={form.slug} onChange={(event) => patch('slug', slugify(event.target.value))} />
              <input className="input" placeholder="Cover image URL" value={form.coverImageUrl || ''} onChange={(event) => patch('coverImageUrl', event.target.value)} />
              <select className="input" value={form.topic} onChange={(event) => chooseTopic(event.target.value)}>{playlistTopics.map((topic) => <option key={topic}>{topic}</option>)}</select>
              <label className="rounded-lg bg-[#fffaf0] p-3 font-bold"><input type="checkbox" checked={Boolean(form.learningPathEnabled)} onChange={(event) => patch('learningPathEnabled', event.target.checked)} /> Learning Path Map</label>
              <input className="input" type="number" min="1" placeholder="Learning path order" value={form.learningPathOrder} onChange={(event) => patch('learningPathOrder', event.target.value)} />
              <input className="input" placeholder="Learning path label" value={form.learningPathLabel} onChange={(event) => patch('learningPathLabel', event.target.value)} />
              <select className="input" value={form.theme.cardStyle} onChange={(event) => patchTheme('cardStyle', event.target.value)}>{cardStyles.map((style) => <option key={style}>{style}</option>)}</select>
              <select className="input" value={form.theme.effect} onChange={(event) => patchTheme('effect', event.target.value)}>{playlistEffects.map((effect) => <option key={effect}>{effect}</option>)}</select>
            </div>
          </details>
          <button className="btn btn-primary w-full">{editingId ? 'Update Playlist' : 'Create Playlist'}</button>
        </form>

        <div className="grid content-start gap-4">
          <PlaylistPreview playlist={preview} />
          {loading && <p>Loading playlists...</p>}
          <div className="grid gap-3">
            {playlistOptions.map((playlist) => (
              <article
                className="surface rounded-lg p-4"
                draggable
                key={playlist.id}
                onDragStart={() => setDraggedId(playlist.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => updateSiblingOrder(draggedId, playlist.id)}
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div className="flex items-start gap-3" style={{ paddingLeft: `${(playlist.optionDepth || 0) * 18}px` }}>
                    <GripVertical className="mt-1 shrink-0 cursor-grab text-[var(--theme-muted)]" size={18} />
                    <div>
                      <b className="text-[var(--theme-primary)]">{playlist.optionDepth ? '— ' : ''}{playlist.title}</b>
                      <p className="text-sm text-[var(--theme-muted)]">{playlist.parentPlaylistId ? 'Sub playlist' : 'Main playlist'} / order {playlist.order}{playlist.courseMode ? ' / course mode' : ''}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className="btn btn-outline" type="button" onClick={() => addSubPlaylist(playlist)}><Plus size={16} />Sub</button>
                    <Link className="btn btn-outline" to="/admin/videos">Add Video</Link>
                    <Link className="btn btn-outline" to={getPlaylistRoute(playlist)}>View</Link>
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
