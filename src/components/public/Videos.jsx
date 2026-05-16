import { collection, doc, getDoc, onSnapshot, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { Bookmark, CheckCircle2, Eye, LogIn, NotebookPen, PlayCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { db } from '../../firebase.js';
import { sortVideosByOrder } from '../../utils/progress.js';

export default function Videos() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [progress, setProgress] = useState({});
  const [noteFor, setNoteFor] = useState(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => onSnapshot(query(collection(db, 'videos'), where('isActive', '==', true)), (snap) => {
    setVideos(sortVideosByOrder(snap.docs.map((d) => normalizeVideo({ id: d.id, ...d.data() }))));
  }), []);

  useEffect(() => {
    if (!user) return setProgress({});
    return onSnapshot(query(collection(db, 'userVideoProgress'), where('userId', '==', user.uid)), (snap) => {
      setProgress(Object.fromEntries(snap.docs.map((d) => [d.data().videoDocId, { id: d.id, ...d.data() }])));
    });
  }, [user]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    window.setTimeout(() => setMessage({ type: '', text: '' }), 3200);
  };

  const saveProgress = async (video, patch, successText) => {
    if (!user) return;
    const id = `${user.uid}_${video.id}`;
    setSaving(id);
    try {
      await setDoc(doc(db, 'userVideoProgress', id), {
        userId: user.uid,
        videoDocId: video.id,
        videoId: video.videoId || video.id,
        updatedAt: serverTimestamp(),
        ...patch,
      }, { merge: true });
      showMessage('success', successText);
    } catch (error) {
      console.error('[Videos] progress save failed:', error);
      showMessage('error', error.message);
    } finally {
      setSaving('');
    }
  };

  const cards = useMemo(() => videos, [videos]);

  return (
    <section id="videos" className="section bg-[var(--theme-surface)]">
      <div className="container-shell">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="eyebrow">YouTube Library</p><h2 className="mt-3 text-4xl font-black text-[var(--theme-primary)]">වීඩියෝ පුස්තකාලය</h2></div>
          {!user && <p className="rounded-lg bg-[var(--theme-section)] px-4 py-3 font-semibold text-[var(--theme-muted)]">Login වුවහොත් ඔබේ ප්‍රගතිය save කරගත හැක.</p>}
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {message.text && (
            <div className={`md:col-span-2 lg:col-span-3 rounded-lg p-4 font-bold ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'}`}>
              {message.text}
            </div>
          )}
          {cards.map((video) => {
            const item = progress[video.id] || {};
            const busy = saving === `${user?.uid}_${video.id}`;
            return (
              <article key={video.id} className="surface interactive-card overflow-hidden rounded-lg">
                <img src={video.thumbnailUrl || '/ravana-bhawana-logo.png'} alt={video.title} className="aspect-video w-full bg-[var(--theme-hero)] object-cover" />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-xl font-black text-[var(--theme-primary)]">{video.title}</h3>
                    {item.completed && <span className="rounded-full bg-[var(--theme-accent)] px-3 py-1 text-xs font-black">Done</span>}
                  </div>
                  <p className="mt-1 font-semibold text-[var(--theme-muted)]">{video.subtitle}</p>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--theme-text)]">{video.description}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <a className="btn btn-primary" href={video.youtubeUrl} target="_blank" rel="noreferrer"><PlayCircle size={17} />Watch</a>
                    {user ? (
                      <>
                        <button className="btn btn-outline" disabled={busy} title="Mark as watched" onClick={() => saveProgress(video, { watched: true, watchedAt: serverTimestamp() }, 'Watched ලෙස save කළා.')}><Eye size={17} /></button>
                        <button className="btn btn-outline" disabled={busy} title="Mark as completed" onClick={() => saveProgress(video, { completed: true, completedAt: serverTimestamp(), watched: true, watchedAt: item.watchedAt || serverTimestamp() }, 'Completed ලෙස save කළා.')}><CheckCircle2 size={17} /></button>
                        <button className={`btn btn-outline ${item.saved ? 'bg-[color-mix(in_srgb,var(--theme-accent)_24%,var(--theme-surface))]' : ''}`} disabled={busy} title="Save video" onClick={() => saveProgress(video, { saved: !item.saved, savedAt: !item.saved ? serverTimestamp() : null }, item.saved ? 'Saved list එකෙන් ඉවත් කළා.' : 'Video එක save කළා.')}><Bookmark size={17} /></button>
                        <button className="btn btn-outline" disabled={busy} title="Personal note" onClick={async () => {
                          try {
                            const snap = await getDoc(doc(db, 'userPrivateNotes', `${user.uid}_${video.id}`));
                            setNoteFor(video);
                            setNote(snap.data()?.note || '');
                          } catch (error) {
                            console.error('[Videos] note load failed:', error);
                            showMessage('error', error.message);
                          }
                        }}><NotebookPen size={17} /></button>
                      </>
                    ) : <Link className="btn btn-outline" to="/login"><LogIn size={17} />Login to track progress</Link>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        {!cards.length && <p className="mt-8 rounded-lg bg-[var(--theme-section)] p-5 text-[var(--theme-text)]">වීඩියෝ තවම එක් කර නැත.</p>}
      </div>
      {noteFor && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
          <div className="surface w-full max-w-lg rounded-lg p-6">
            <h3 className="text-2xl font-black">Personal note</h3>
            <textarea className="input mt-4 min-h-36" value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn btn-outline" onClick={() => setNoteFor(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={async () => {
                try {
                  await setDoc(doc(db, 'userPrivateNotes', `${user.uid}_${noteFor.id}`), {
                    userId: user.uid,
                    videoDocId: noteFor.id,
                    videoId: noteFor.videoId || noteFor.id,
                    note,
                    updatedAt: serverTimestamp(),
                  }, { merge: true });
                  setNoteFor(null);
                  showMessage('success', 'Personal note එක save කළා.');
                } catch (error) {
                  console.error('[Videos] note save failed:', error);
                  showMessage('error', error.message);
                }
              }}>Save note</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function normalizeVideo(video) {
  return {
    ...video,
    title: video.title || '',
    subtitle: video.subtitle || '',
    description: video.description || '',
    youtubeUrl: video.youtubeUrl || video.youtube_url || '',
    videoId: video.videoId || video.video_id || '',
    thumbnailUrl: video.thumbnailUrl || video.thumbnail_url || '',
    videoNumber: video.videoNumber || video.video_number || '',
    isLatest: video.isLatest ?? video.is_latest ?? false,
    isActive: video.isActive ?? video.is_active ?? true,
    order: video.order ?? video.display_order ?? 999,
  };
}
