import { collection, doc, getDoc, onSnapshot, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { Bookmark, CheckCircle2, Eye, LogIn, NotebookPen, PlayCircle, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { db } from '../../firebase.js';
import { sortVideosByOrder } from '../../utils/progress.js';

export default function Videos() {
  const { user } = useAuth();
  const { getLocalized, t } = useLanguage();
  const [videos, setVideos] = useState([]);
  const [progress, setProgress] = useState({});
  const [videoNotes, setVideoNotes] = useState({});
  const [noteFor, setNoteFor] = useState(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => onSnapshot(collection(db, 'videos'), (snap) => {
    const activeVideos = snap.docs
      .map((d) => normalizeVideo({ id: d.id, ...d.data() }))
      .filter((video) => video.isActive !== false);
    setVideos(sortVideosByOrder(activeVideos));
  }, (error) => {
    console.error('Failed to load videos', error);
    setVideos([]);
  }), []);

  useEffect(() => {
    const notesById = new Map();
    const publish = () => {
      const grouped = {};
      notesById.forEach((noteItem) => {
        if (!noteItem.videoId || !noteItem.isPublished) return;
        grouped[noteItem.videoId] = [...(grouped[noteItem.videoId] || []), noteItem];
      });
      setVideoNotes(grouped);
    };
    const handleSnapshot = (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === 'removed') notesById.delete(change.doc.id);
        else notesById.set(change.doc.id, normalizePublicNote({ id: change.doc.id, ...change.doc.data() }));
      });
      publish();
    };
    const handleError = (error) => {
      console.error('Failed to load video notes', error);
      setVideoNotes({});
    };
    const unsubscribeIsPublished = onSnapshot(query(collection(db, 'videoNotes'), where('isPublished', '==', true)), handleSnapshot, handleError);
    const unsubscribePublished = onSnapshot(query(collection(db, 'videoNotes'), where('published', '==', true)), handleSnapshot, handleError);
    return () => {
      unsubscribeIsPublished();
      unsubscribePublished();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setProgress({});
      return undefined;
    }
    return onSnapshot(query(collection(db, 'userVideoProgress'), where('userId', '==', user.uid)), (snap) => {
      setProgress(Object.fromEntries(snap.docs.map((d) => [d.data().videoDocId, { id: d.id, ...d.data() }])));
    }, (error) => {
      console.error('Failed to load user video progress', error);
      setProgress({});
    });
  }, [user]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    window.setTimeout(() => setMessage({ type: '', text: '' }), 3200);
  };

  const requireLogin = () => showMessage('error', 'Please log in first.');

  const saveProgress = async (video, patch, successText) => {
    if (!user) return requireLogin();
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
      console.error('Failed to save video progress', error);
      showMessage('error', 'Could not save progress. Please try again.');
    } finally {
      setSaving('');
    }
  };

  const openNotes = async (video) => {
    setNoteFor(video);
    setNote('');
    if (!user) return;
    try {
      const snap = await getDoc(doc(db, 'userPrivateNotes', `${user.uid}_${video.id}`));
      setNote(snap.data()?.note || '');
    } catch (error) {
      console.error('Failed to load private video note', error);
      setNote('');
      showMessage('error', 'Could not load your private note. Please try again.');
    }
  };

  const savePrivateNote = async () => {
    if (!user) return requireLogin();
    try {
      await setDoc(doc(db, 'userPrivateNotes', `${user.uid}_${noteFor.id}`), {
        userId: user.uid,
        videoId: noteFor.id,
        note,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setNoteFor(null);
      showMessage('success', 'Saved successfully.');
    } catch (error) {
      console.error('Failed to save private video note', error);
      showMessage('error', 'Could not save note. Please try again.');
    }
  };

  const cards = useMemo(() => videos, [videos]);

  return (
    <section id="videos" className="section bg-[var(--theme-surface)]">
      <div className="container-shell">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="eyebrow">{t('video.youtubeLibrary')}</p><h2 className="mt-3 text-4xl font-black text-[var(--theme-primary)]">{t('video.library')}</h2></div>
          {!user && <p className="rounded-lg bg-[var(--theme-section)] px-4 py-3 font-semibold text-[var(--theme-muted)]">Log in to save progress, bookmarks, and private notes.</p>}
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {message.text && <div className={`md:col-span-2 lg:col-span-3 rounded-lg p-4 font-bold ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'}`}>{message.text}</div>}
          {cards.map((video) => {
            const item = progress[video.id] || {};
            const busy = saving === `${user?.uid}_${video.id}`;
            const publicNotes = videoNotes[video.id] || [];
            return (
              <article key={video.id} className="surface interactive-card overflow-hidden rounded-lg">
                <img src={video.thumbnailUrl || '/ravana-bhawana-logo.png'} alt={getLocalized(video, 'title', video.title)} className="aspect-video w-full bg-[var(--theme-hero)] object-cover" />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-xl font-black text-[var(--theme-primary)]">{getLocalized(video, 'title', video.title)}</h3>
                    {item.completed && <span className="rounded-full bg-[var(--theme-accent)] px-3 py-1 text-xs font-black">Done</span>}
                  </div>
                  <p className="mt-1 font-semibold text-[var(--theme-muted)]">{getLocalized(video, 'subtitle', video.subtitle)}</p>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--theme-text)]">{getLocalized(video, 'description', video.description)}</p>
                  {!!publicNotes.length && <p className="mt-4 rounded-lg bg-[var(--theme-section)] p-3 text-sm font-bold text-[var(--theme-primary)]">{publicNotes.length} public note{publicNotes.length === 1 ? '' : 's'} available</p>}
                  <div className="mt-5 flex flex-wrap gap-2">
                    <a className="btn btn-primary" href={video.youtubeUrl} target="_blank" rel="noreferrer" title={t('common.watch')} aria-label={`${t('common.watch')} ${getLocalized(video, 'title', video.title)}`}><PlayCircle size={17} />{t('common.watch')}</a>
                    <button className="btn btn-outline" title={t('video.details')} aria-label={`${t('video.details')} ${getLocalized(video, 'title', video.title)}`} onClick={() => openNotes(video)}><Eye size={17} /></button>
                    <button className="btn btn-outline" disabled={busy} title={t('common.watched')} aria-label={`${t('common.watched')} ${getLocalized(video, 'title', video.title)}`} onClick={() => saveProgress(video, { watched: true, watchedAt: serverTimestamp() }, t('common.watched'))}><CheckCircle2 size={17} /></button>
                    <button className={`btn btn-outline ${item.saved ? 'bg-[color-mix(in_srgb,var(--theme-accent)_24%,var(--theme-surface))]' : ''}`} disabled={busy} title={t('video.saveVideo')} aria-label={`${t('common.save')} ${getLocalized(video, 'title', video.title)}`} onClick={() => saveProgress(video, { saved: !item.saved, savedAt: !item.saved ? serverTimestamp() : null }, item.saved ? t('common.saved') : t('common.save'))}><Bookmark size={17} /></button>
                    <button className="btn btn-outline" disabled={busy} title={t('video.notes')} aria-label={`${t('video.notes')} ${getLocalized(video, 'title', video.title)}`} onClick={() => openNotes(video)}><NotebookPen size={17} /></button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        {!cards.length && <p className="mt-8 rounded-lg bg-[var(--theme-section)] p-5 text-[var(--theme-text)]">{t('video.noVideos')}</p>}
      </div>
      {noteFor && <NotesModal video={noteFor} publicNotes={videoNotes[noteFor.id] || []} user={user} note={note} setNote={setNote} onClose={() => setNoteFor(null)} onSave={savePrivateNote} />}
    </section>
  );
}

function NotesModal({ video, publicNotes, user, note, setNote, onClose, onSave }) {
  const { getLocalized, t } = useLanguage();
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
      <div className="surface max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg p-6">
        <div className="flex items-start justify-between gap-3">
          <div><h3 className="text-2xl font-black text-[var(--theme-primary)]">{getLocalized(video, 'title', video.title)}</h3><p className="text-sm text-[var(--theme-muted)]">{t('video.publicNotes')} / {t('video.privateNotebook')}</p></div>
          <button className="btn btn-outline" onClick={onClose} aria-label="Close notes"><X size={18} /></button>
        </div>
        <section className="mt-5">
          <h4 className="font-black text-[var(--theme-primary)]">{t('video.publicNotes')}</h4>
          <div className="mt-3 grid gap-3">
            {publicNotes.map((item) => <article className="rounded-lg bg-[var(--theme-section)] p-4" key={item.id}><b className="text-[var(--theme-primary)]">{item.title || 'Note'}</b><p className="mt-2 whitespace-pre-wrap leading-7 text-[var(--theme-muted)]">{item.content}</p></article>)}
            {!publicNotes.length && <p className="rounded-lg bg-[var(--theme-section)] p-4 text-[var(--theme-muted)]">{t('video.notesSoon')}</p>}
          </div>
        </section>
        <section className="mt-5">
          <h4 className="font-black text-[var(--theme-primary)]">{t('video.privateNotebook')}</h4>
          {!user ? <p className="mt-3 rounded-lg bg-amber-50 p-4 font-semibold text-amber-800">{t('video.loginToSave')}</p> : <>
            <textarea className="input mt-3 min-h-40" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Write your private note..." />
            <button className="btn btn-primary mt-3" onClick={onSave}>{t('common.save')}</button>
          </>}
        </section>
      </div>
    </div>
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

function normalizePublicNote(note) {
  return {
    ...note,
    videoId: note.videoId || note.videoDocId || '',
    title: note.title || '',
    content: note.content || note.body || '',
    isPublished: note.isPublished ?? note.published ?? false,
  };
}
