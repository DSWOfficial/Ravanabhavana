import { addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { Edit3, EyeOff, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { db } from '../../firebase.js';
import { firebaseData } from '../../lib/firebaseData.js';
import { extractYouTubeId, getYouTubeThumbnail } from '../../utils/youtube.js';
import { AdminCard, confirmDelete, emptyToast, fetchTable, StatusBadge, Toast } from './adminHelpers.jsx';

const empty = { youtube_url: '', title: '', subtitle: '', description: '', video_number: '', display_order: 1, is_latest: false, is_active: true };
const emptyNote = { title: '', content: '', isPublished: true };

function normalizeNote(note) {
  return {
    ...note,
    title: note.title || '',
    content: note.content || note.body || '',
    isPublished: note.isPublished ?? note.published ?? false,
  };
}

export default function VideoManager() {
  const [videos, setVideos] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState(emptyToast);
  const [notes, setNotes] = useState([]);
  const [noteForm, setNoteForm] = useState(emptyNote);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const videoId = extractYouTubeId(form.youtube_url);
  const thumbnail = getYouTubeThumbnail(videoId);

  const load = async () => setVideos(await fetchTable('videos', 'display_order'));
  useEffect(() => { load().catch((error) => setToast({ message: error.message, type: 'error' })); }, []);

  const loadNotes = async (videoDocId) => {
    if (!videoDocId) return setNotes([]);
    const snap = await getDocs(query(collection(db, 'videoNotes'), where('videoId', '==', videoDocId)));
    setNotes(snap.docs.map((item) => normalizeNote({ id: item.id, ...item.data() })).sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)));
  };

  const reset = () => { setForm(empty); setEditingId(null); setNotes([]); setNoteForm(emptyNote); setEditingNoteId(null); };
  const save = async (event) => {
    event.preventDefault();
    if (!videoId) return setToast({ message: 'Invalid YouTube URL', type: 'error' });
    const payload = { ...form, video_id: videoId, thumbnail_url: thumbnail, display_order: Number(form.display_order || 1), updated_at: new Date().toISOString() };
    try {
      if (payload.is_latest) await firebaseData.from('videos').update({ is_latest: false }).neq('id', editingId || '');
      if (editingId) await firebaseData.from('videos').update(payload).eq('id', editingId).throwOnError();
      else await firebaseData.from('videos').insert(payload).throwOnError();
      setToast({ message: 'Video saved', type: 'success' });
      reset();
      await load();
    } catch (error) {
      setToast({ message: error.message, type: 'error' });
    }
  };

  const edit = (video) => { setEditingId(video.id); setForm(video); setNoteForm(emptyNote); setEditingNoteId(null); loadNotes(video.id).catch((error) => setToast({ message: error.message, type: 'error' })); };
  const toggle = async (video) => { await firebaseData.from('videos').update({ is_active: !video.is_active, updated_at: new Date().toISOString() }).eq('id', video.id); await load(); };
  const remove = async (video) => { if (confirmDelete(video.title)) { await firebaseData.from('videos').delete().eq('id', video.id); await load(); } };
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
      else await addDoc(collection(db, 'videoNotes'), { ...payload, createdAt: serverTimestamp() });
      setToast({ message: 'Video note saved', type: 'success' });
      setNoteForm(emptyNote);
      setEditingNoteId(null);
      await loadNotes(editingId);
    } catch (error) {
      setToast({ message: error.message, type: 'error' });
    }
  };
  const editNote = (note) => { setEditingNoteId(note.id); setNoteForm(normalizeNote(note)); };
  const removeNote = async (note) => {
    if (!confirmDelete(note.title || 'this note')) return;
    await deleteDoc(doc(db, 'videoNotes', note.id));
    await loadNotes(editingId);
  };

  return (
    <AdminCard title="Video Manager" actions={<button className="btn btn-outline" onClick={reset}><Plus size={18} />New</button>}>
      <Toast toast={toast} />
      <form onSubmit={save} className="mt-4 grid gap-3 lg:grid-cols-2">
        <input className="input" required placeholder="YouTube URL" value={form.youtube_url || ''} onChange={(e) => setForm({ ...form, youtube_url: e.target.value })} />
        <input className="input" required placeholder="Sinhala title" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input className="input" placeholder="Subtitle" value={form.subtitle || ''} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
        <input className="input" required placeholder="Video number, example No01" value={form.video_number || ''} onChange={(e) => setForm({ ...form, video_number: e.target.value })} />
        <input className="input" type="number" min="1" placeholder="Display order" value={form.display_order || ''} onChange={(e) => setForm({ ...form, display_order: e.target.value })} />
        <div className="flex gap-5 rounded-lg bg-[#fffaf0] p-3 font-bold"><label><input type="checkbox" checked={Boolean(form.is_latest)} onChange={(e) => setForm({ ...form, is_latest: e.target.checked })} /> Latest</label><label><input type="checkbox" checked={Boolean(form.is_active)} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active</label></div>
        <textarea className="input min-h-28 lg:col-span-2" placeholder="Description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        {thumbnail && <img className="aspect-video w-full max-w-sm rounded-lg object-cover" src={thumbnail} alt="YouTube thumbnail preview" />}
        <button className="btn btn-primary lg:col-span-2">{editingId ? 'Update video' : 'Add video'}</button>
      </form>
      {editingId && (
        <section className="mt-6 rounded-lg border border-[color-mix(in_srgb,var(--theme-accent)_25%,transparent)] p-4">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <h3 className="text-xl font-black text-[var(--theme-primary)]">Video Notes</h3>
            <button className="btn btn-outline" type="button" onClick={() => { setNoteForm(emptyNote); setEditingNoteId(null); }}><Plus size={16} />New note</button>
          </div>
          <form onSubmit={saveNote} className="mt-4 grid gap-3 md:grid-cols-2">
            <input className="input" required placeholder="Note title" value={noteForm.title} onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })} />
            <label className="rounded-lg bg-[#fffaf0] p-3 font-bold"><input type="checkbox" checked={Boolean(noteForm.isPublished)} onChange={(e) => setNoteForm({ ...noteForm, isPublished: e.target.checked })} /> Published</label>
            <textarea className="input min-h-24 md:col-span-2" required placeholder="Note text" value={noteForm.content} onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })} />
            <button className="btn btn-primary md:col-span-2">{editingNoteId ? 'Update note' : 'Add note'}</button>
          </form>
          <div className="mt-4 grid gap-3">
            {notes.map((note) => (
              <article className="surface rounded-lg p-4" key={note.id}>
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div><b className="text-[var(--theme-primary)]">{note.title}</b><p className="mt-2 whitespace-pre-wrap text-sm text-[var(--theme-muted)]">{note.content}</p>{note.isPublished && <span className="mt-2 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-800">Published</span>}</div>
                  <div className="flex gap-2"><button className="btn btn-outline" onClick={() => editNote(note)}><Edit3 size={16} /></button><button className="btn btn-primary" onClick={() => removeNote(note)}><Trash2 size={16} /></button></div>
                </div>
              </article>
            ))}
            {!notes.length && <p className="text-[var(--theme-muted)]">No notes for this video yet.</p>}
          </div>
        </section>
      )}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[900px] text-left">
          <thead><tr className="border-b text-sm text-[#6f4a31]"><th>Thumbnail</th><th>No</th><th>Title</th><th>Latest</th><th>Status</th><th>Order</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>{videos.map((video) => <tr className="border-b border-[#b88934]/15" key={video.id}><td className="py-3"><img className="h-14 w-24 rounded object-cover" src={video.thumbnail_url} alt="" /></td><td>{video.video_number}</td><td className="font-bold">{video.title}</td><td>{video.is_latest && <span className="rounded-full bg-[#b88934] px-3 py-1 text-xs font-black">Latest</span>}</td><td><StatusBadge active={video.is_active} /></td><td>{video.display_order}</td><td>{video.created_at?.slice(0, 10)}</td><td><div className="flex gap-2"><button className="btn btn-outline" onClick={() => edit(video)}><Edit3 size={16} /></button><button className="btn btn-outline" onClick={() => toggle(video)}><EyeOff size={16} /></button><button className="btn btn-primary" onClick={() => remove(video)}><Trash2 size={16} /></button></div></td></tr>)}</tbody>
        </table>
        {!videos.length && <p className="py-6 text-[#6f4a31]">No videos yet.</p>}
      </div>
    </AdminCard>
  );
}
