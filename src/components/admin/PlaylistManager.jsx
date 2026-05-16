import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Edit3, Eye, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { db } from '../../firebase.js';
import { cardStyles, defaultPlaylistTheme, getPlaylistStyle, normalizePlaylist, playlistEffects, playlistTopics, slugify, topicThemes } from '../../lib/videoLibrary.js';
import { AdminCard, confirmDelete, emptyToast, Toast } from './adminHelpers.jsx';

const empty = {
  title: '',
  slug: '',
  description: '',
  coverImageUrl: '',
  topic: 'Spiritual Guidance',
  isPublished: true,
  order: 1,
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
      slug: form.slug || slugify(form.title),
      order: Number(form.order || 999),
      updatedAt: serverTimestamp(),
      createdBy: user?.email || '',
    };
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
    setForm({ ...empty, ...playlist, theme: { ...defaultPlaylistTheme, ...playlist.theme } });
  };

  const remove = async (playlist) => {
    if (!confirmDelete(playlist.title)) return;
    try {
      await deleteDoc(doc(db, 'playlists', playlist.id));
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
    <AdminCard title="Playlist CMS" actions={<button className="btn btn-outline" type="button" onClick={reset}><Plus size={18} />New Playlist</button>}>
      <Toast toast={toast} />
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={save} className="grid gap-3 md:grid-cols-2">
          <input className="input" required placeholder="Title" value={form.title} onChange={(event) => patch('title', event.target.value)} />
          <input className="input" placeholder="Slug" value={form.slug} onChange={(event) => patch('slug', slugify(event.target.value))} />
          <textarea className="input min-h-28 md:col-span-2" placeholder="Description" value={form.description} onChange={(event) => patch('description', event.target.value)} />
          <input className="input md:col-span-2" placeholder="Cover image URL from Media Library" value={form.coverImageUrl} onChange={(event) => patch('coverImageUrl', event.target.value)} />
          <select className="input" value={form.topic} onChange={(event) => chooseTopic(event.target.value)}>{playlistTopics.map((topic) => <option key={topic}>{topic}</option>)}</select>
          <input className="input" type="number" min="1" placeholder="Order" value={form.order} onChange={(event) => patch('order', event.target.value)} />
          <label className="rounded-lg bg-[#fffaf0] p-3 font-bold"><input type="checkbox" checked={Boolean(form.isPublished)} onChange={(event) => patch('isPublished', event.target.checked)} /> Published</label>
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
            {playlists.map((playlist) => (
              <article className="surface rounded-lg p-4" key={playlist.id}>
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div><b className="text-[var(--theme-primary)]">{playlist.title}</b><p className="text-sm text-[var(--theme-muted)]">{playlist.topic} / order {playlist.order}</p></div>
                  <div className="flex flex-wrap gap-2">
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
