import { addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, updateDoc, where, writeBatch } from 'firebase/firestore';
import { CheckCircle2, Edit3, EyeOff, GripVertical, PlayCircle, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { db } from '../../firebase.js';
import { buildPlaylistOptions, getPlaylistBreadcrumb, normalizePlaylist, normalizeVideo, slugify, tagsFromText, uncategorizedPlaylist, videoLevels } from '../../lib/videoLibrary.js';
import { extractYouTubeId } from '../../utils/youtube.js';
import { AdminCard, confirmDelete, emptyToast, StatusBadge, Toast } from './adminHelpers.jsx';

const empty = {
  title: '',
  title_si: '',
  title_en: '',
  slug: '',
  description: '',
  description_si: '',
  description_en: '',
  lessonNotes: '',
  videoUrl: '',
  thumbnailUrl: '',
  playlistId: '',
  tagsText: '',
  tagsText_si: '',
  tagsText_en: '',
  level: 'Beginner',
  featured: false,
  isPublished: true,
  order: 1,
  materials: [],
};
const emptyNote = { title: '', content: '', isPublished: true };
const emptyMaterial = { title: '', type: 'external', url: '', mediaId: '', description: '', downloadable: true };
const materialTypes = ['pdf', 'image', 'audio', 'video file', 'document', 'external link', 'YouTube/resource link'];

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

function getDefaultThumbnail(videoId) {
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';
}

function inferMaterialType(value = '') {
  const lower = String(value).toLowerCase();
  if (lower.includes('youtube') || lower.includes('youtu.be')) return 'YouTube/resource link';
  if (lower.endsWith('.pdf') || lower === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].some((ext) => lower.endsWith(`.${ext}`) || lower === ext)) return 'image';
  if (['mp3', 'wav', 'm4a', 'ogg'].some((ext) => lower.endsWith(`.${ext}`) || lower === ext)) return 'audio';
  if (['mp4', 'mov', 'webm'].some((ext) => lower.endsWith(`.${ext}`) || lower === ext)) return 'video file';
  if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].some((ext) => lower.endsWith(`.${ext}`) || lower === ext)) return 'document';
  return 'external link';
}

export default function VideoManager() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState(emptyToast);
  const [playlistFilter, setPlaylistFilter] = useState('all');
  const [notes, setNotes] = useState([]);
  const [noteForm, setNoteForm] = useState(emptyNote);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [mediaItems, setMediaItems] = useState([]);
  const [materialForm, setMaterialForm] = useState(emptyMaterial);
  const [draggedVideoId, setDraggedVideoId] = useState('');
  const [draggedMaterialId, setDraggedMaterialId] = useState('');

  const videoId = extractYouTubeId(form.videoUrl);
  const defaultThumbnail = getDefaultThumbnail(videoId);
  const thumbnail = form.thumbnailUrl || defaultThumbnail;
  const playlistMap = useMemo(() => Object.fromEntries(playlists.map((playlist) => [playlist.id, playlist])), [playlists]);
  const playlistOptions = useMemo(() => buildPlaylistOptions(playlists), [playlists]);
  const selectedPlaylist = playlistMap[form.playlistId] || null;
  const filteredVideos = useMemo(() => (
    playlistFilter === 'all' ? videos : videos.filter((video) => (video.playlistId || '') === playlistFilter)
  ), [playlistFilter, videos]);

  const load = async () => {
    try {
      const [playlistSnap, videoSnap, mediaSnap] = await Promise.all([getDocs(collection(db, 'playlists')), getDocs(collection(db, 'videos')), getDocs(collection(db, 'media'))]);
      setPlaylists(playlistSnap.docs.map((item) => normalizePlaylist(item.data(), item.id)).sort((a, b) => a.order - b.order));
      setVideos(videoSnap.docs.map((item) => normalizeVideo(item.data(), item.id)).sort((a, b) => a.order - b.order));
      setMediaItems(mediaSnap.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)));
    } catch (error) {
      console.error('[VideoManager] load failed:', error);
      setToast({ message: adminError(error, 'videos/playlists'), type: 'error' });
    }
  };

  useEffect(() => { load(); }, []);

  const reset = () => {
    setEditingId(null);
    setForm(empty);
    setToast(emptyToast);
    setNotes([]);
    setNoteForm(emptyNote);
    setEditingNoteId(null);
  };

  const loadNotes = async (videoDocId) => {
    if (!videoDocId) return setNotes([]);
    try {
      const snap = await getDocs(query(collection(db, 'videoNotes'), where('videoId', '==', videoDocId)));
      setNotes(snap.docs.map((item) => normalizeNote({ id: item.id, ...item.data() })).sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)));
    } catch (error) {
      console.error('[VideoManager] notes load failed:', error);
      setToast({ message: adminError(error, 'videoNotes'), type: 'error' });
    }
  };

  const patch = (field, value) => {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === 'title') next.slug = current.slug || slugify(value);
      if (field === 'videoUrl') {
        const nextVideoId = extractYouTubeId(value);
        if (nextVideoId && !current.thumbnailUrl) next.thumbnailUrl = '';
      }
      return next;
    });
  };

  const save = async (event) => {
    event.preventDefault();
    const youtubeId = extractYouTubeId(form.videoUrl);
    if (!youtubeId) return setToast({ message: 'Please paste a valid YouTube URL before saving.', type: 'error' });
    if (!form.title.trim()) return setToast({ message: 'Please add a video title before saving.', type: 'error' });

    const playlist = playlists.find((item) => item.id === form.playlistId);
    const breadcrumb = playlist ? getPlaylistBreadcrumb(playlist, playlistMap) : [];
    const siblingCount = videos.filter((item) => (item.playlistId || '') === (form.playlistId || '') && item.id !== editingId).length;
    const payload = {
      title: (form.title_si || form.title).trim(),
      title_si: form.title_si,
      title_en: form.title_en,
      slug: form.slug || slugify(form.title_en || form.title_si || form.title),
      description: form.description_si || form.description,
      description_si: form.description_si,
      description_en: form.description_en,
      lessonNotes: form.lessonNotes,
      videoUrl: form.videoUrl,
      youtubeUrl: form.videoUrl,
      youtubeId,
      videoId: youtubeId,
      thumbnailUrl: form.thumbnailUrl || getDefaultThumbnail(youtubeId),
      playlistId: playlist?.id || '',
      playlistSlug: playlist?.slug || '',
      playlistTitle: playlist?.title || 'Uncategorized',
      parentPlaylistId: playlist?.parentPlaylistId || null,
      playlistPath: playlist ? breadcrumb.map((item) => item.id) : [],
      playlistPathSlugs: playlist ? breadcrumb.map((item) => item.slug) : [],
      tags: tagsFromText(form.tagsText),
      tags_si: tagsFromText(form.tagsText_si),
      tags_en: tagsFromText(form.tagsText_en),
      level: form.level,
      featured: Boolean(form.featured),
      isPublished: Boolean(form.isPublished),
      isActive: Boolean(form.isPublished),
      order: editingId ? Number(form.order || 999) : siblingCount + 1,
      materials: (form.materials || []).map((material, index) => ({ ...material, order: index + 1 })),
      updatedAt: serverTimestamp(),
      createdBy: user?.email || '',
    };

    try {
      if (editingId) await updateDoc(doc(db, 'videos', editingId), payload);
      else await addDoc(collection(db, 'videos'), { ...payload, createdAt: serverTimestamp() });
      setToast({ message: editingId ? 'Video updated successfully.' : 'Video added successfully.', type: 'success' });
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
      title: normalized.title,
      videoUrl: normalized.videoUrl,
      thumbnailUrl: video.thumbnailUrl?.includes('img.youtube.com') ? '' : normalized.thumbnailUrl,
      playlistId: normalized.playlistId || '',
      tagsText: (normalized.tags || []).join(', '),
      tagsText_si: (normalized.tags_si || []).join(', '),
      tagsText_en: (normalized.tags_en || []).join(', '),
      isPublished: normalized.isPublished,
      order: normalized.order,
      materials: normalized.materials || [],
      lessonNotes: normalized.lessonNotes || '',
    });
    setNoteForm(emptyNote);
    setEditingNoteId(null);
    loadNotes(video.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggle = async (video) => {
    try {
      await updateDoc(doc(db, 'videos', video.id), { isPublished: !video.isPublished, isActive: !video.isPublished, updatedAt: serverTimestamp() });
      await load();
    } catch (error) {
      setToast({ message: adminError(error, `videos/${video.id}`), type: 'error' });
    }
  };

  const remove = async (video) => {
    if (!confirmDelete(video.title)) return;
    try {
      await deleteDoc(doc(db, 'videos', video.id));
      await load();
    } catch (error) {
      setToast({ message: adminError(error, `videos/${video.id}`), type: 'error' });
    }
  };

  const updateVideoOrder = async (sourceId, targetId) => {
    if (!sourceId || sourceId === targetId) return;
    const visible = filteredVideos;
    const from = visible.findIndex((item) => item.id === sourceId);
    const to = visible.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const reordered = [...visible];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    try {
      const batch = writeBatch(db);
      reordered.forEach((item, index) => batch.update(doc(db, 'videos', item.id), { order: index + 1, updatedAt: serverTimestamp() }));
      await batch.commit();
      setToast({ type: 'success', message: 'Order updated successfully.' });
      await load();
    } catch (error) {
      console.error('[VideoManager] order update failed:', error);
      setToast({ type: 'error', message: adminError(error, 'videos order') });
    } finally {
      setDraggedVideoId('');
    }
  };

  const selectMediaMaterial = (mediaId) => {
    const item = mediaItems.find((media) => media.id === mediaId);
    if (!item) return setMaterialForm((current) => ({ ...current, mediaId: '', url: '' }));
    setMaterialForm((current) => ({
      ...current,
      mediaId: item.id,
      url: item.url || '',
      title: current.title || item.filename || 'Media resource',
      type: inferMaterialType(item.format || item.filename || item.url),
    }));
  };

  const addMaterial = () => {
    if (!materialForm.title.trim() || !materialForm.url.trim()) {
      setToast({ type: 'error', message: 'Add a material title and URL first.' });
      return;
    }
    setForm((current) => ({
      ...current,
      materials: [
        ...(current.materials || []),
        { ...materialForm, id: `material-${Date.now()}`, title: materialForm.title.trim(), url: materialForm.url.trim(), order: (current.materials || []).length + 1 },
      ],
    }));
    setMaterialForm(emptyMaterial);
  };

  const removeMaterial = (materialId) => {
    setForm((current) => ({ ...current, materials: (current.materials || []).filter((material) => material.id !== materialId).map((material, index) => ({ ...material, order: index + 1 })) }));
  };

  const reorderMaterial = (sourceId, targetId) => {
    if (!sourceId || sourceId === targetId) return;
    setForm((current) => {
      const reordered = [...(current.materials || [])];
      const from = reordered.findIndex((item) => item.id === sourceId);
      const to = reordered.findIndex((item) => item.id === targetId);
      if (from < 0 || to < 0) return current;
      const [moved] = reordered.splice(from, 1);
      reordered.splice(to, 0, moved);
      return { ...current, materials: reordered.map((material, index) => ({ ...material, order: index + 1 })) };
    });
    setDraggedMaterialId('');
  };

  const saveNote = async (event) => {
    event.preventDefault();
    if (!editingId) return setToast({ message: 'Select a saved video before adding notes.', type: 'error' });
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
      setToast({ message: 'Video note saved successfully.', type: 'success' });
      setNoteForm(emptyNote);
      setEditingNoteId(null);
      await loadNotes(editingId);
    } catch (error) {
      console.error('[VideoManager] note save failed:', error);
      setToast({ message: adminError(error, editingNoteId ? `videoNotes/${editingNoteId}` : 'videoNotes'), type: 'error' });
    }
  };

  const editNote = (note) => {
    setEditingNoteId(note.id);
    setNoteForm(normalizeNote(note));
  };

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
    <div className="grid gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-3xl font-black text-[var(--theme-primary)]">Videos</h2>
          <p className="mt-2 text-[var(--theme-muted)]">Add and manage YouTube videos for the public website.</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={reset}><Plus size={18} />Add New Video</button>
      </div>

      <AdminCard title={editingId ? 'Edit Video' : 'Add Video'} actions={videoId && <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-sm font-bold text-green-800"><CheckCircle2 size={16} />Video ID: {videoId}</span>}>
        <Toast toast={toast} />
        <form onSubmit={save} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="grid gap-4">
            <label className="grid gap-2 font-bold text-[var(--theme-primary)]">YouTube URL
              <input className="input text-lg" required placeholder="https://www.youtube.com/watch?v=..." value={form.videoUrl} onChange={(event) => patch('videoUrl', event.target.value)} />
            </label>
            {form.videoUrl && !videoId && <p className="rounded-lg bg-red-50 p-3 font-semibold text-red-700">This does not look like a valid YouTube URL.</p>}
            {videoId && <p className="rounded-lg bg-[var(--theme-section)] p-3 text-sm font-bold text-[var(--theme-muted)]">Copy from YouTube URL complete. Default YouTube thumbnail will be used if no custom thumbnail is added.</p>}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 font-bold text-[var(--theme-primary)]">Video Title
                <input className="input" required placeholder="Video title" value={form.title} onChange={(event) => patch('title', event.target.value)} />
              </label>
              <label className="grid gap-2 font-bold text-[var(--theme-primary)]">Playlist/category
                <select className="input" value={form.playlistId || ''} onChange={(event) => patch('playlistId', event.target.value)}>
                  <option value="">Uncategorized</option>
                  {playlistOptions.map((playlist) => <option key={playlist.id} value={playlist.id}>{`${'-- '.repeat(playlist.optionDepth || 0)}${playlist.title}`}</option>)}
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 font-bold text-[var(--theme-primary)]">Level
                <select className="input" value={form.level} onChange={(event) => patch('level', event.target.value)}>{videoLevels.map((level) => <option key={level}>{level}</option>)}</select>
              </label>
              <label className="grid gap-2 font-bold text-[var(--theme-primary)]">Custom thumbnail URL (optional)
                <input className="input" placeholder="https://..." value={form.thumbnailUrl} onChange={(event) => patch('thumbnailUrl', event.target.value)} />
              </label>
            </div>

            <label className="grid gap-2 font-bold text-[var(--theme-primary)]">Short description
              <textarea className="input min-h-28" placeholder="Short description" value={form.description} onChange={(event) => patch('description', event.target.value)} />
            </label>

            <label className="grid gap-2 font-bold text-[var(--theme-primary)]">Lesson Notes
              <textarea className="input min-h-36" placeholder="Use paragraphs, bullet points, **bold text**, or paste links/instructions for this lesson." value={form.lessonNotes || ''} onChange={(event) => patch('lessonNotes', event.target.value)} />
            </label>

            <section className="rounded-lg border border-[color-mix(in_srgb,var(--theme-accent)_30%,transparent)] bg-[var(--theme-surface)] p-4">
              <h3 className="font-black text-[var(--theme-primary)]">Study Materials</h3>
              <p className="mt-1 text-sm text-[var(--theme-muted)]">Attach files from Media Library or add external resource links. Removing here does not delete media files.</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input className="input" placeholder="Material title" value={materialForm.title} onChange={(event) => setMaterialForm({ ...materialForm, title: event.target.value })} />
                <select className="input" value={materialForm.type} onChange={(event) => setMaterialForm({ ...materialForm, type: event.target.value })}>{materialTypes.map((type) => <option key={type}>{type}</option>)}</select>
                <select className="input" value={materialForm.mediaId} onChange={(event) => selectMediaMaterial(event.target.value)}>
                  <option value="">Select from Media Library</option>
                  {mediaItems.map((item) => <option key={item.id} value={item.id}>{item.filename || item.url}</option>)}
                </select>
                <input className="input" placeholder="External or media URL" value={materialForm.url} onChange={(event) => setMaterialForm({ ...materialForm, url: event.target.value })} />
                <textarea className="input min-h-20 md:col-span-2" placeholder="Description optional" value={materialForm.description} onChange={(event) => setMaterialForm({ ...materialForm, description: event.target.value })} />
                <label className="rounded-lg bg-[#fffaf0] p-3 font-bold"><input type="checkbox" checked={Boolean(materialForm.downloadable)} onChange={(event) => setMaterialForm({ ...materialForm, downloadable: event.target.checked })} /> Downloadable</label>
                <button className="btn btn-outline" type="button" onClick={addMaterial}><Plus size={16} />Add Material</button>
              </div>
              {!!form.materials?.length && (
                <div className="mt-4 grid gap-2">
                  {form.materials.map((material) => (
                    <article
                      className="flex flex-col justify-between gap-3 rounded-lg bg-[var(--theme-section)] p-3 sm:flex-row sm:items-center"
                      draggable
                      key={material.id}
                      onDragStart={() => setDraggedMaterialId(material.id)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => reorderMaterial(draggedMaterialId, material.id)}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="mt-1 cursor-grab text-[var(--theme-muted)]" size={17} />
                        <div>
                          <b className="text-[var(--theme-primary)]">{material.title}</b>
                          <p className="break-all text-sm text-[var(--theme-muted)]">{material.type} / {material.url}</p>
                        </div>
                      </div>
                      <button className="btn btn-primary" type="button" onClick={() => removeMaterial(material.id)}><Trash2 size={16} /></button>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <label className="inline-flex items-center gap-2 rounded-lg bg-[#fffaf0] p-3 font-bold"><input type="checkbox" checked={Boolean(form.isPublished)} onChange={(event) => patch('isPublished', event.target.checked)} /> Published</label>

            <details className="rounded-lg border border-[color-mix(in_srgb,var(--theme-accent)_30%,transparent)] bg-[var(--theme-surface)] p-4">
              <summary className="cursor-pointer font-black text-[var(--theme-primary)]">Advanced Details</summary>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <input className="input" placeholder="Sinhala title" value={form.title_si || ''} onChange={(event) => patch('title_si', event.target.value)} />
                <input className="input" placeholder="English title" value={form.title_en || ''} onChange={(event) => patch('title_en', event.target.value)} />
                <input className="input" placeholder="Slug" value={form.slug || ''} onChange={(event) => patch('slug', slugify(event.target.value))} />
                <input className="input" placeholder="Tags" value={form.tagsText || ''} onChange={(event) => patch('tagsText', event.target.value)} />
                <input className="input" placeholder="Sinhala tags" value={form.tagsText_si || ''} onChange={(event) => patch('tagsText_si', event.target.value)} />
                <input className="input" placeholder="English tags" value={form.tagsText_en || ''} onChange={(event) => patch('tagsText_en', event.target.value)} />
                <label className="inline-flex items-center gap-2 rounded-lg bg-[#fffaf0] p-3 font-bold"><input type="checkbox" checked={Boolean(form.featured)} onChange={(event) => patch('featured', event.target.checked)} /> Featured</label>
                <textarea className="input min-h-24 md:col-span-2" placeholder="Sinhala description" value={form.description_si || ''} onChange={(event) => patch('description_si', event.target.value)} />
                <textarea className="input min-h-24 md:col-span-2" placeholder="English description" value={form.description_en || ''} onChange={(event) => patch('description_en', event.target.value)} />
              </div>
            </details>

            <p className="rounded-lg bg-[var(--theme-section)] p-3 text-sm font-bold text-[var(--theme-muted)]">
              Selected playlist: {selectedPlaylist ? getPlaylistBreadcrumb(selectedPlaylist, playlistMap).map((item) => item.title).join(' > ') : 'Uncategorized'}
            </p>

            <button className="btn btn-primary w-full text-lg" type="submit">{editingId ? 'Update Video' : 'Save Video'}</button>
          </div>

          <aside className="grid content-start gap-4">
            <div className="surface rounded-lg p-4">
              <h3 className="font-black text-[var(--theme-primary)]">Thumbnail Preview</h3>
              {thumbnail ? <img className="mt-3 aspect-video w-full rounded-lg object-cover" src={thumbnail} alt="Video thumbnail preview" /> : <div className="mt-3 grid aspect-video place-items-center rounded-lg bg-[var(--theme-section)] text-[var(--theme-muted)]">Paste a YouTube URL</div>}
              <p className="mt-3 text-sm font-bold text-[var(--theme-muted)]">{form.thumbnailUrl ? 'Using custom thumbnail' : 'Using default YouTube thumbnail'}</p>
            </div>
            <div className="surface rounded-lg p-4">
              <h3 className="font-black text-[var(--theme-primary)]">Video Preview</h3>
              {videoId ? <iframe className="mt-3 aspect-video w-full rounded-lg bg-black" src={`https://www.youtube.com/embed/${videoId}`} title="Video preview" allowFullScreen /> : <div className="mt-3 grid aspect-video place-items-center rounded-lg bg-[var(--theme-section)] text-[var(--theme-muted)]"><PlayCircle size={42} /></div>}
            </div>
          </aside>
        </form>
      </AdminCard>

      {editingId && (
        <AdminCard title="Public Video Notes" actions={<button className="btn btn-outline" type="button" onClick={() => { setNoteForm(emptyNote); setEditingNoteId(null); }}><Plus size={16} />New Note</button>}>
          <form onSubmit={saveNote} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
            <input className="input" required placeholder="Note title" value={noteForm.title} onChange={(event) => setNoteForm({ ...noteForm, title: event.target.value })} />
            <label className="inline-flex items-center gap-2 rounded-lg bg-[#fffaf0] p-3 font-bold"><input type="checkbox" checked={Boolean(noteForm.isPublished)} onChange={(event) => setNoteForm({ ...noteForm, isPublished: event.target.checked })} /> Published</label>
            <textarea className="input min-h-24 md:col-span-2" required placeholder="Note content" value={noteForm.content} onChange={(event) => setNoteForm({ ...noteForm, content: event.target.value })} />
            <button className="btn btn-primary md:col-span-2" type="submit">{editingNoteId ? 'Update Note' : 'Add Note'}</button>
          </form>
          <div className="mt-4 grid gap-3">
            {notes.map((note) => (
              <article className="surface rounded-lg p-4" key={note.id}>
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <b className="text-[var(--theme-primary)]">{note.title}</b>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--theme-muted)]">{note.content}</p>
                    <StatusBadge active={note.isPublished} label={note.isPublished ? 'Published' : 'Draft'} />
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-outline" type="button" onClick={() => editNote(note)}><Edit3 size={16} /></button>
                    <button className="btn btn-primary" type="button" onClick={() => removeNote(note)}><Trash2 size={16} /></button>
                  </div>
                </div>
              </article>
            ))}
            {!notes.length && <p className="text-[var(--theme-muted)]">No public notes for this video yet.</p>}
          </div>
        </AdminCard>
      )}

      <AdminCard title="Existing Videos" actions={<select className="input w-auto min-w-64" value={playlistFilter} onChange={(event) => setPlaylistFilter(event.target.value)}><option value="all">All playlists</option><option value="">Uncategorized</option>{playlistOptions.map((playlist) => <option key={playlist.id} value={playlist.id}>{`${'-- '.repeat(playlist.optionDepth || 0)}${playlist.title}`}</option>)}</select>}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead><tr className="border-b text-sm text-[#6f4a31]"><th></th><th>Thumbnail</th><th>Title</th><th>Playlist</th><th>Status</th><th>Order</th><th>Actions</th></tr></thead>
            <tbody>{filteredVideos.map((video) => {
              const playlist = playlistMap[video.playlistId] || (video.playlistTitle ? { ...uncategorizedPlaylist, title: video.playlistTitle } : uncategorizedPlaylist);
              const path = playlist.id === 'uncategorized' ? 'Uncategorized' : getPlaylistBreadcrumb(playlist, playlistMap).map((item) => item.title).join(' > ');
              return (
                <tr
                  className="border-b border-[#b88934]/15"
                  draggable
                  key={video.id}
                  onDragStart={() => setDraggedVideoId(video.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => updateVideoOrder(draggedVideoId, video.id)}
                >
                  <td className="py-3"><GripVertical className="cursor-grab text-[var(--theme-muted)]" size={18} /></td>
                  <td className="py-3"><img className="h-14 w-24 rounded object-cover" src={video.thumbnailUrl} alt="" /></td>
                  <td className="font-bold">{video.title}</td>
                  <td>{path}</td>
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
    </div>
  );
}
