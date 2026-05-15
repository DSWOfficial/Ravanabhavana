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

  useEffect(() => onSnapshot(query(collection(db, 'videos'), where('isActive', '==', true)), (snap) => {
    setVideos(sortVideosByOrder(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }), []);

  useEffect(() => {
    if (!user) return setProgress({});
    return onSnapshot(query(collection(db, 'userVideoProgress'), where('userId', '==', user.uid)), (snap) => {
      setProgress(Object.fromEntries(snap.docs.map((d) => [d.data().videoDocId, { id: d.id, ...d.data() }])));
    });
  }, [user]);

  const saveProgress = async (video, patch) => {
    if (!user) return;
    const id = `${user.uid}_${video.id}`;
    await setDoc(doc(db, 'userVideoProgress', id), {
      userId: user.uid,
      videoDocId: video.id,
      videoId: video.videoId,
      updatedAt: serverTimestamp(),
      ...patch,
    }, { merge: true });
  };

  const cards = useMemo(() => videos, [videos]);

  return (
    <section id="videos" className="section bg-[#fffaf0]">
      <div className="container-shell">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="eyebrow">YouTube Library</p><h2 className="mt-3 text-4xl font-black text-[#3a2115]">වීඩියෝ පුස්තකාලය</h2></div>
          {!user && <p className="rounded-lg bg-[#f8f0df] px-4 py-3 font-semibold text-[#6f4a31]">Login වුවහොත් ඔබේ ප්‍රගතිය save කරගත හැක.</p>}
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((video) => {
            const item = progress[video.id] || {};
            return (
              <article key={video.id} className="surface overflow-hidden rounded-lg">
                <img src={video.thumbnailUrl} alt={video.title} className="aspect-video w-full bg-[#2d1b12] object-cover" />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-xl font-black text-[#3a2115]">{video.title}</h3>
                    {item.completed && <span className="rounded-full bg-[#b88934] px-3 py-1 text-xs font-black">Done</span>}
                  </div>
                  <p className="mt-1 font-semibold text-[#6f4a31]">{video.subtitle}</p>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#4b3123]">{video.description}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <a className="btn btn-primary" href={video.youtubeUrl} target="_blank" rel="noreferrer"><PlayCircle size={17} />Watch</a>
                    {user ? (
                      <>
                        <button className="btn btn-outline" onClick={() => saveProgress(video, { watched: true, watchedAt: serverTimestamp() })}><Eye size={17} /></button>
                        <button className="btn btn-outline" onClick={() => saveProgress(video, { completed: true, completedAt: serverTimestamp(), watched: true })}><CheckCircle2 size={17} /></button>
                        <button className="btn btn-outline" onClick={() => saveProgress(video, { saved: !item.saved, savedAt: serverTimestamp() })}><Bookmark size={17} /></button>
                        <button className="btn btn-outline" onClick={async () => { const snap = await getDoc(doc(db, 'userPrivateNotes', `${user.uid}_${video.id}`)); setNoteFor(video); setNote(snap.data()?.note || ''); }}><NotebookPen size={17} /></button>
                      </>
                    ) : <Link className="btn btn-outline" to="/login"><LogIn size={17} />Login to track progress</Link>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        {!cards.length && <p className="mt-8 rounded-lg bg-[#f8f0df] p-5">වීඩියෝ තවම එක් කර නැත.</p>}
      </div>
      {noteFor && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
          <div className="surface w-full max-w-lg rounded-lg p-6">
            <h3 className="text-2xl font-black">Personal note</h3>
            <textarea className="input mt-4 min-h-36" value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn btn-outline" onClick={() => setNoteFor(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={async () => { await setDoc(doc(db, 'userPrivateNotes', `${user.uid}_${noteFor.id}`), { userId: user.uid, videoDocId: noteFor.id, videoId: noteFor.videoId, note, updatedAt: serverTimestamp() }, { merge: true }); setNoteFor(null); }}>Save note</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
