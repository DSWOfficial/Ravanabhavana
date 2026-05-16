import { addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { Edit3, EyeOff, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { db } from '../../firebase.js';
import { buildPlaylistOptions, getPlaylistBreadcrumb, normalizePlaylist, normalizeVideo, slugify, tagsFromText, uncategorizedPlaylist, videoLevels } from '../../lib/videoLibrary.js';
import { extractYouTubeId, getYouTubeThumbnail } from '../../utils/youtube.js';
import { AdminCard, confirmDelete, emptyToast, StatusBadge, Toast } from './adminHelpers.jsx';

const empty = {
  title: '',
  title_si: '',
  title_en: '',
  slug: '',
  description: '',
  description_si: '',
  description_en: '',
  videoUrl: '',
  thumbnailUrl: '',
  playlistId: '',
  duration: '',
  tagsText: '',
  tagsText_si: '',
  tagsText_en: '',
  level: 'Beginner',
  featured: false,
  isPublished: true,
  order: 1,
};
const emptyNote = { title: '', content: '', isPublished: true };

function normalizeNote(note) {
  return {
    ...note,
    title: note.title || '',
    content: note.content || note.body || '',
    isPublished: note.isPublished ?? note.published ?? false,
  };
}

function adminError(error, path) {
  return `${path}: ${error.code || 'error'} - ${error.message}`;
}

export default function VideoManager() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState(emptyToast);
  const [notes, setNotes] = useState([]);
  const [noteForm, setNoteForm] = useState(emptyNote);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [playlistFilter, setPlaylistFilter] = useState('all');

  const videoId = extractYouTubeId(form.videoUrl);
  const thumbnail = form.thumbnailUrl || getYouTubeThumbnail(videoId);
  const playlistMap = useMemo(() => Object.fromEntries(playlists.map((playlist) => [playlist.id, playlist])), [playlists]);
  const playlistOptions = useMemo(() => buildPlaylistOptions(playlists), [playlists]);
  const selectedPlaylist = playlistMap[form.playlistId] || null;
  const filteredVideos = useMemo(() => (
    playlistFilter === 'all' ? videos : videos.filter((video) => (video.playlistId || '') === playlistFilter)
  ), [playlistFilter, videos]);

  const loadPlaylists = async () => {
    try {
      const playlistSnap = await getDocs(collection(db, 'playlists'));
      const items = playlistSnap.docs.map((item) => normalizePlaylist(item.data(), item.id)).sort((a, b) => a.order - b.order);
      setPlaylists(items);
      return items;
    } catch (error) {
      console.error('[VideoManager] playlist load failed:', error);
      setPlaylists([]);
      setToast({ message: adminError(error, 'playlists'), type: 'error' });
      return [];
    }
  };

  const loadVideos = async () => {
    try {
      const videoSnap = await getDocs(collection(db, 'videos'));
      setVideos(videoSnap.docs.map((item) => normalizeVideo(item.data(), item.id)).sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error('[VideoManager] video load failed:', error);
      setVideos([]);
      setToast({ message: adminError(error, 'videos'), type: 'error' });
    }
  };

  const load = async () => {
    await Promise.all([loadPlaylists(), loadVideos()]);
  };

  useEffect(() => { load(); }, []);

  const loadNotes = async (videoDocId) => {
    if (!videoDocId) return setNotes([]);
    const snap = await getDocs(query(collection(db, 'videoNotes'), where('videoId', '==', videoDocId)));
    setNotes(snap.docs.map((item) => normalizeNote({ id: item.id, ...item.data() })).sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)));
  };

  const reset = () => {
    setForm(empty);
    setEditingId(null);
    setNotes([]);
    setNoteForm(emptyNote);
    setEditingNoteId(null);
  };

  const patch = (field, value) => {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === 'title' && !editingId) next.slug = slugify(value);
      return next;
    });
  };

  const save = async (event) => {
    event.preventDefault();
    const youtubeId = extractYouTubeId(form.videoUrl);
    if (!youtubeId) return setToast({ message: 'Invalid YouTube URL', type: 'error' });
    const playlist = playlists.find((item) => item.id === form.playlistId);
    const breadcrumb = playlist ? getPlaylistBreadcrumb(playlist, playlistMap) : [];
    const payload = {
      title: (form.title_si || form.title).trim(),
      title_si: form.title_si,
      title_en: form.title_en,
      slug: form.slug || slugify(form.title_en || form.title_si || form.title),
      description: form.description_si || form.description,
      description_si: form.description_si,
      description_en: form.description_en,
      videoUrl: form.videoUrl,
      youtubeUrl: form.videoUrl,
      youtubeId,
      videoId: youtubeId,
      thumbnailUrl: thumbnail,
      playlistId: playlist?.id || '',
      playlistSlug: playlist?.slug || '',
      playlistTitle: playlist?.title || 'Uncategorized',
      parentPlaylistId: playlist?.parentPlaylistId || null,
      playlistPath: playlist ? breadcrumb.map((item) => item.id) : [],
      playlistPathSlugs: playlist ? breadcrumb.map((item) => item.slug) : [],
      duration: form.duration,
      tags: tagsFromText(form.tagsText),
      tags_si: tagsFromText(form.tagsText_si),
      tags_en: tagsFromText(form.tagsText_en),
      level: form.level,
      featured: Boolean(form.featured),
      isPublished: Boolean(form.isPublished),
      isActive: Boolean(form.isPublished),
      order: Number(form.order || 999),
      updatedAt: serverTimestamp(),
      createdBy: user?.email || '',
    };
    try {
      if (editingId) await updateDoc(doc(db, 'videos', editingId), payload);
      else await addDoc(collection(db, 'videos'), { ...payload, createdAt: serverTimestamp() });
      setToast({ message: 'Video saved', type: 'success' });
      reset();
      await load();
    } catch (error) {
      console.error('[VideoManager] save failed:', error);
      setToast({ message: `Could not save video. ${adminError(error, editingId ? `videos/${editingId}` : 'videos')}`, type: 'error' });
    }
  };

  const edit = (video) => {
    const normalized = normalizeVideo(video);
    setEditingId(video.id);
    setForm({
      ...empty,
      ...normalized,
      videoUrl: normalized.videoUrl,
      thumbnailUrl: normalized.thumbnailUrl,
      playlistId: normalized.playlistId || '',
      tagsText: (normalized.tags || []).join(', '),
      tagsText_si: (normalized.tags_si || []).join(', '),
      tagsText_en: (normalized.tags_en || []).join(', '),
      isPublished: normalized.isPublished,
      order: normalized.order,
    });
    setNoteForm(emptyNote);
    setEditingNoteId(null);
    loadNotes(video.id).catch((error) => setToast({ message: adminError(error, 'videoNotes'), type: 'error' }));
  };

  const toggle = async (video) => {
    try {
      await updateDoc(doc(db, 'videos', video.id), { isPublished: !video.isPublished, isActive: !video.isPublished, updatedAt: serverTimestamp() });
      await load();
    } catch (error) {
      console.error('[VideoManager] publish toggle failed:', error);
      setToast({ message: adminError(error, `videos/${video.id}`), type: 'error' });
    }
  };

  const remove = async (video) => {
    if (!confirmDelete(video.title)) return;
    try {
      await deleteDoc(doc(db, 'videos', video.id));
      await load();
    } catch (error) {
      console.error('[VideoManager] delete failed:', error);
      setToast({ message: adminError(error, `videos/${video.id}`), type: 'error' });
    }
  };

  const saveNote = async (event) => {
    event.preventDefault();
    if (!editingId) return setToast({ message: 'Select or save a video before adding notes', type: 'error' });
    try {
      const cleanContent = noteForm.content.trim();
      const isPublished = Boolean(noteForm.isPublished);
      const payload = {
        title: noteForm.title.trim(),
        content: cleanContent,
        body: cleanContent,
        isPublished,
        published: isPublished,
        videoId: editingId,
        updatedAt: serverTimestamp(),
      };
      if (editingNoteId) await updateDoc(doc(db, 'videoNotes', editingNoteId), payload);
      else await addDoc(collection(db, 'videoNotes'), { ...payload, createdAt: serverTimestamp(), createdBy: user?.email || '' });
      setToast({ message: 'Video note saved', type: 'success' });
      setNoteForm(emptyNote);
      setEditingNoteId(null);
      await loadNotes(editingId);
    } catch (error) {
      console.error('[VideoManager] note save failed:', error);
      setToast({ message: adminError(error, editingNoteId ? `videoNotes/${editingNoteId}` : 'videoNotes'), type: 'error' });
    }
  };

  const editNote = (note) => { setEditingNoteId(note.id); setNoteForm(normalizeNote(note)); };
  const removeNote = async (note) => {
    if (!confirmDelete(note.title || 'this note')) return;
    try {
      await deleteDoc(doc(db, 'videoNotes', note.id));
      await loadNotes(editingId);
    } catch (error) {
      console.error('[VideoManager] note delete failed:', error);
      setToast({ message: adminError(error, `videoNotes/${note.id}`), type: 'error' });
    }
  };

  return (
    <AdminCard title="Video Manager" actions={<button className="btn btn-outline" onClick={reset}><Plus size={18} />New</button>}>
      <Toast toast={toast} />
      <form onSubmit={save} className="mt-4 grid gap-3 lg:grid-cols-2">
        <input className="input" required placeholder="Title" value={form.title || ''} onChange={(event) => patch('title', event.target.value)} />
        <input className="input" placeholder="Sinhala Title" value={form.title_si || ''} onChange={(event) => patch('title_si', event.target.value)} />
        <input className="input" placeholder="English Title" value={form.title_en || ''} onChange={(event) => patch('title_en', event.target.value)} />
        <input className="input" placeholder="Slug" value={form.slug || ''} onChange={(event) => patch('slug', slugify(event.target.value))} />
        <input className="input" required placeholder="YouTube / video URL" value={form.videoUrl || ''} onChange={(event) => patch('videoUrl', event.target.value)} />
        <input className="input" placeholder="Thumbnail URL from Media Library" value={form.thumbnailUrl || ''} onChange={(event) => patch('thumbnailUrl', event.target.value)} />
        <select className="input" value={form.playlistId || ''} onChange={(event) => patch('playlistId', event.target.value)}>
          <option value="">Uncategorized</option>
          {playlistOptions.map((playlist) => <option key={playlist.id} value={playlist.id}>{`${'-- '.repeat(playlist.optionDepth || 0)}${playlist.title}`}</option>)}
        </select>
        <select className="input" value={form.level} onChange={(event) => patch('level', event.target.value)}>{videoLevels.map((level) => <option key={level}>{level}</option>)}</select>
        <input className="input" placeholder="Duration, example 12:30" value={form.duration || ''} onChange={(event) => patch('duration', event.target.value)} />
        <input className="input" type="number" min="1" placeholder="Order" value={form.order || ''} onChange={(event) => patch('order', event.target.value)} />
        <input className="input lg:col-span-2" placeholder="Tags, comma separated" value={form.tagsText || ''} onChange={(event) => patch('tagsText', event.target.value)} />
        <input className="input" placeholder="Sinhala Tags, comma separated" value={form.tagsText_si || ''} onChange={(event) => patch('tagsText_si', event.target.value)} />
        <input className="input" placeholder="English Tags, comma separated" value={form.tagsText_en || ''} onChange={(event) => patch('tagsText_en', event.target.value)} />
        <textarea className="input min-h-28 lg:col-span-2" placeholder="Description" value={form.description || ''} onChange={(event) => patch('description', event.target.value)} />
        <textarea className="input min-h-24" placeholder="Sinhala Description" value={form.description_si || ''} onChange={(event) => patch('description_si', event.target.value)} />
        <textarea className="input min-h-24" placeholder="English Description" value={form.description_en || ''} onChange={(event) => patch('description_en', event.target.value)} />
        <div className="flex flex-wrap gap-5 rounded-lg bg-[#fffaf0] p-3 font-bold">
          <label><input type="checkbox" checked={Boolean(form.featured)} onChange={(event) => patch('featured', event.target.checked)} /> Featured</label>
          <label><input type="checkbox" checked={Boolean(form.isPublished)} onChange={(event) => patch('isPublished', event.target.checked)} /> Published</label>
        </div>
        {thumbnail && <img className="aspect-video w-full max-w-sm rounded-lg object-cover" src={thumbnail} alt="Video thumbnail preview" />}
        <p className="rounded-lg bg-[var(--theme-section)] p-3 text-sm font-bold text-[var(--theme-muted)] lg:col-span-2">
          Selected playlist: {selectedPlaylist ? getPlaylistBreadcrumb(selectedPlaylist, playlistMap).map((item) => item.title).join(' > ') : 'Uncategorized'}
        </p>
        <button className="btn btn-primary lg:col-span-2">{editingId ? 'Update video' : 'Add video'}</button>
      </form>

      {editingId && (
        <section className="mt-6 rounded-lg border border-[color-mix(in_srgb,var(--theme-accent)_25%,transparent)] p-4">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <h3 className="text-xl font-black text-[var(--theme-primary)]">Video Notes</h3>
            <button className="btn btn-outline" type="button" onClick={() => { setNoteForm(emptyNote); setEditingNoteId(null); }}><Plus size={16} />New note</button>
          </div>
          <form onSubmit={saveNote} className="mt-4 grid gap-3 md:grid-cols-2">
            <input className="input" required placeholder="Note title" value={noteForm.title} onChange={(event) => setNoteForm({ ...noteForm, title: event.target.value })} />
            <label className="rounded-lg bg-[#fffaf0] p-3 font-bold"><input type="checkbox" checked={Boolean(noteForm.isPublished)} onChange={(event) => setNoteForm({ ...noteForm, isPublished: event.target.checked })} /> Published</label>
            <textarea className="input min-h-24 md:col-span-2" required placeholder="Note text" value={noteForm.content} onChange={(event) => setNoteForm({ ...noteForm, content: event.target.value })} />
            <button className="btn btn-primary md:col-span-2">{editingNoteId ? 'Update note' : 'Add note'}</button>
          </form>
          <div className="mt-4 grid gap-3">
            {notes.map((note) => (
              <article className="surface rounded-lg p-4" key={note.id}>
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div><b className="text-[var(--theme-primary)]">{note.title}</b><p className="mt-2 whitespace-pre-wrap text-sm text-[var(--theme-muted)]">{note.content}</p>{note.isPublished && <span className="mt-2 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-800">Published</span>}</div>
                  <div className="flex gap-2"><button className="btn btn-outline" type="button" onClick={() => editNote(note)}><Edit3 size={16} /></button><button className="btn btn-primary" type="button" onClick={() => removeNote(note)}><Trash2 size={16} /></button></div>
                </div>
              </article>
            ))}
            {!notes.length && <p className="text-[var(--theme-muted)]">No notes for this video yet.</p>}
          </div>
        </section>
      )}

      <div className="mt-6 overflow-x-auto">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-black text-[var(--theme-primary)]">Videos</h3>
          <select className="input w-auto min-w-64" value={playlistFilter} onChange={(event) => setPlaylistFilter(event.target.value)}>
            <option value="all">All playlists</option>
            <option value="">Uncategorized</option>
            {playlistOptions.map((playlist) => <option key={playlist.id} value={playlist.id}>{`${'-- '.repeat(playlist.optionDepth || 0)}${playlist.title}`}</option>)}
          </select>
        </div>
        <table className="w-full min-w-[900px] text-left">
          <thead><tr className="border-b text-sm text-[#6f4a31]"><th>Thumbnail</th><th>Title</th><th>Playlist Path</th><th>Level</th><th>Featured</th><th>Status</th><th>Order</th><th>Actions</th></tr></thead>
          <tbody>{filteredVideos.map((video) => {
            const playlist = playlistMap[video.playlistId] || (video.playlistTitle ? { ...uncategorizedPlaylist, title: video.playlistTitle } : uncategorizedPlaylist);
            const path = playlist.id === 'uncategorized' ? 'Uncategorized' : getPlaylistBreadcrumb(playlist, playlistMap).map((item) => item.title).join(' > ');
            return (
              <tr className="border-b border-[#b88934]/15" key={video.id}>
                <td className="py-3"><img className="h-14 w-24 rounded object-cover" src={video.thumbnailUrl} alt="" /></td>
                <td className="font-bold">{video.title}</td>
                <td>{path}</td>
                <td>{video.level}</td>
                <td>{video.featured && <span className="rounded-full bg-[#b88934] px-3 py-1 text-xs font-black">Featured</span>}</td>
                <td><StatusBadge active={video.isPublished} label={video.isPublished ? 'Published' : 'Draft'} /></td>
                <td>{video.order}</td>
                <td><div className="flex gap-2"><button className="btn btn-outline" type="button" onClick={() => edit(video)}><Edit3 size={16} /></button><button className="btn btn-outline" type="button" onClick={() => toggle(video)}><EyeOff size={16} /></button><button className="btn btn-primary" type="button" onClick={() => remove(video)}><Trash2 size={16} /></button></div></td>
              </tr>
            );
          })}</tbody>
        </table>
        {!filteredVideos.length && <p className="py-6 text-[#6f4a31]">No videos yet.</p>}
      </div>
    </AdminCard>
  );
}
