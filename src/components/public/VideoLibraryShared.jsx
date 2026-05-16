import { collection, deleteDoc, doc, getDoc, onSnapshot, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { Bookmark, CheckCircle2, Layers3, LogIn, NotebookPen, PlayCircle, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { db } from '../../firebase.js';
import { getPlaylistRoute, getPlaylistStyle, normalizePlaylist, normalizeVideo, searchMatchesVideo, sortByOrderThenNewest, toMillis, uncategorizedPlaylist } from '../../lib/videoLibrary.js';

export function useVideoLibraryData() {
  const [playlists, setPlaylists] = useState([]);
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let loadedPlaylists = false;
    let loadedVideos = false;
    const finish = () => setLoading(!(loadedPlaylists && loadedVideos));
    const unsubscribePlaylists = onSnapshot(collection(db, 'playlists'), (snap) => {
      loadedPlaylists = true;
      setPlaylists(sortByOrderThenNewest(snap.docs.map((item) => normalizePlaylist(item.data(), item.id)).filter((item) => item.isPublished)));
      finish();
    }, (err) => {
      console.error('Could not load playlists', err);
      loadedPlaylists = true;
      setError('Could not load videos. Please try again later.');
      setPlaylists([]);
      finish();
    });
    const unsubscribeVideos = onSnapshot(collection(db, 'videos'), (snap) => {
      loadedVideos = true;
      setVideos(sortByOrderThenNewest(snap.docs.map((item) => normalizeVideo(item.data(), item.id)).filter((item) => item.isPublished)));
      finish();
    }, (err) => {
      console.error('Could not load videos', err);
      loadedVideos = true;
      setError('Could not load videos. Please try again later.');
      setVideos([]);
      finish();
    });
    return () => {
      unsubscribePlaylists();
      unsubscribeVideos();
    };
  }, []);

  const playlistMap = useMemo(() => {
    const map = Object.fromEntries(playlists.map((playlist) => [playlist.id, playlist]));
    map.uncategorized = uncategorizedPlaylist;
    return map;
  }, [playlists]);

  const videosWithPlaylists = useMemo(() => videos.map((video) => {
    const playlist = playlistMap[video.playlistId] || playlists.find((item) => item.slug === video.playlistSlug) || uncategorizedPlaylist;
    return {
      ...video,
      playlistId: video.playlistId || playlist.id,
      playlistSlug: video.playlistSlug || playlist.slug,
      playlistTitle: video.playlistTitle || playlist.title,
      parentPlaylistId: video.parentPlaylistId || playlist.parentPlaylistId || null,
      playlistPath: video.playlistPath?.length ? video.playlistPath : [...(playlist.path || []), playlist.id].filter((id) => id !== 'uncategorized'),
      playlistPathSlugs: video.playlistPathSlugs?.length ? video.playlistPathSlugs : [...(playlist.pathSlugs || []), playlist.slug].filter((slug) => slug !== 'uncategorized'),
      playlist,
    };
  }), [playlistMap, playlists, videos]);

  const playlistsWithCounts = useMemo(() => {
    const counts = videosWithPlaylists.reduce((acc, video) => ({ ...acc, [video.playlist.id]: (acc[video.playlist.id] || 0) + 1 }), {});
    const childCounts = playlists.reduce((acc, playlist) => {
      if (!playlist.parentPlaylistId) return acc;
      return { ...acc, [playlist.parentPlaylistId]: (acc[playlist.parentPlaylistId] || 0) + 1 };
    }, {});
    const hasUncategorized = videosWithPlaylists.some((video) => video.playlist.id === 'uncategorized');
    return [...playlists, ...(hasUncategorized ? [uncategorizedPlaylist] : [])].map((playlist) => ({ ...playlist, videoCount: counts[playlist.id] || 0, subPlaylistCount: childCounts[playlist.id] || 0 }));
  }, [playlists, videosWithPlaylists]);

  return { loading, error, playlists: playlistsWithCounts, videos: videosWithPlaylists, playlistMap };
}

export function useSavedLibrary() {
  const { user } = useAuth();
  const [savedVideos, setSavedVideos] = useState({});
  const [savedPlaylists, setSavedPlaylists] = useState({});
  const [progress, setProgress] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) {
      setSavedVideos({});
      setSavedPlaylists({});
      setProgress({});
      return undefined;
    }
    const unsubscribers = [
      onSnapshot(query(collection(db, 'savedVideos'), where('userId', '==', user.uid)), (snap) => {
        setSavedVideos(Object.fromEntries(snap.docs.map((item) => [item.data().videoId, item.id])));
      }, (error) => console.error('Could not load saved videos', error)),
      onSnapshot(query(collection(db, 'savedPlaylists'), where('userId', '==', user.uid)), (snap) => {
        setSavedPlaylists(Object.fromEntries(snap.docs.map((item) => [item.data().playlistId, item.id])));
      }, (error) => console.error('Could not load saved playlists', error)),
      onSnapshot(query(collection(db, 'videoProgress'), where('userId', '==', user.uid)), (snap) => {
        setProgress(Object.fromEntries(snap.docs.map((item) => [item.data().videoId, { id: item.id, ...item.data() }])));
      }, (error) => console.error('Could not load video progress', error)),
    ];
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [user]);

  const show = (text) => {
    setMessage(text);
    window.setTimeout(() => setMessage(''), 2600);
  };

  const requireLogin = () => show('Please log in to save videos and playlists.');

  const toggleSavedVideo = async (video) => {
    if (!user) return requireLogin();
    try {
      const existingId = savedVideos[video.id];
      if (existingId) await deleteDoc(doc(db, 'savedVideos', existingId));
      else await setDoc(doc(db, 'savedVideos', `${user.uid}_${video.id}`), { userId: user.uid, videoId: video.id, createdAt: serverTimestamp() });
      show(existingId ? 'Removed from saved videos.' : 'Video saved.');
    } catch (error) {
      console.error('Could not save video', error);
      show('Could not save video. Please try again.');
    }
  };

  const toggleSavedPlaylist = async (playlist) => {
    if (!user) return requireLogin();
    try {
      const existingId = savedPlaylists[playlist.id];
      if (existingId) await deleteDoc(doc(db, 'savedPlaylists', existingId));
      else await setDoc(doc(db, 'savedPlaylists', `${user.uid}_${playlist.id}`), { userId: user.uid, playlistId: playlist.id, createdAt: serverTimestamp() });
      show(existingId ? 'Removed from saved playlists.' : 'Playlist saved.');
    } catch (error) {
      console.error('Could not save playlist', error);
      show('Could not save playlist. Please try again.');
    }
  };

  const markWatched = async (video) => {
    if (!user) return requireLogin();
    try {
      await setDoc(doc(db, 'videoProgress', `${user.uid}_${video.id}`), {
        userId: user.uid,
        videoId: video.id,
        playlistId: video.playlistId || '',
        watchedSeconds: progress[video.id]?.watchedSeconds || 0,
        completed: true,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      show('Marked as watched.');
    } catch (error) {
      console.error('Could not save video progress', error);
      show('Could not save progress. Please try again.');
    }
  };

  return { user, savedVideos, savedPlaylists, progress, message, show, toggleSavedVideo, toggleSavedPlaylist, markWatched };
}

export function PlaylistCard({ playlist, onSave, saved }) {
  const theme = playlist.theme;
  const { getLocalized, t } = useLanguage();
  return (
    <article className={`playlist-card playlist-effect-${theme.effect} interactive-card overflow-hidden rounded-lg border-2`} style={getPlaylistStyle(playlist)}>
      <Link to={getPlaylistRoute(playlist)} className="block">
        <img src={playlist.coverImageUrl || '/ravana-bhawana-logo.png'} alt="" className="aspect-video w-full object-cover opacity-90" />
        <div className="p-5">
          <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-black uppercase" style={{ backgroundColor: theme.accentColor, color: theme.backgroundColor }}>{getLocalized(playlist, 'topic', playlist.topic)}</span>
          <h3 className="mt-4 text-2xl font-black">{getLocalized(playlist, 'title', playlist.title)}</h3>
          <p className="mt-2 line-clamp-3 leading-7 opacity-90">{getLocalized(playlist, 'description', playlist.description)}</p>
          <p className="mt-4 text-sm font-black opacity-80">{playlist.subPlaylistCount || 0} {t('video.folders')} / {playlist.videoCount || 0} {t('video.videos')}</p>
        </div>
      </Link>
      <div className="flex flex-wrap gap-2 px-5 pb-5">
        <Link className="btn btn-gold" to={getPlaylistRoute(playlist)}><PlayCircle size={17} />{t('video.playlist')}</Link>
        <button className="btn btn-outline border-white/30 text-inherit" type="button" onClick={() => onSave(playlist)} title={t('common.save')} aria-label={`${t('common.save')} ${getLocalized(playlist, 'title', playlist.title)}`}><Bookmark size={17} />{saved ? t('common.saved') : t('common.save')}</button>
      </div>
    </article>
  );
}

export function VideoCard({ video, onSave, onWatched, saved, completed }) {
  const { getLocalized, t } = useLanguage();
  return (
    <article className="surface interactive-card overflow-hidden rounded-lg">
      <Link to={`/videos/${video.slug}`} className="block">
        <div className="relative">
          <img src={video.thumbnailUrl || '/ravana-bhawana-logo.png'} alt={video.title} className="aspect-video w-full bg-[var(--theme-hero)] object-cover" />
          {video.duration && <span className="absolute bottom-3 right-3 rounded bg-black/75 px-2 py-1 text-xs font-black text-white">{video.duration}</span>}
        </div>
        <div className="p-5">
          <div className="flex flex-wrap gap-2">
            {video.featured && <span className="rounded-full bg-[var(--theme-accent)] px-3 py-1 text-xs font-black text-[#1b120d]">{t('common.featured')}</span>}
            <span className="rounded-full bg-[var(--theme-section)] px-3 py-1 text-xs font-black text-[var(--theme-primary)]">{video.level}</span>
          </div>
          <h3 className="mt-3 text-xl font-black text-[var(--theme-primary)]">{getLocalized(video, 'title', video.title)}</h3>
          <p className="mt-1 text-sm font-bold text-[var(--theme-muted)]">{getLocalized(video.playlist, 'title', video.playlist?.title || 'Uncategorized')}</p>
          <p className="mt-3 line-clamp-3 leading-6 text-[var(--theme-text)]">{getLocalized(video, 'description', video.description)}</p>
        </div>
      </Link>
      <div className="flex flex-wrap gap-2 px-5 pb-5">
        <Link className="btn btn-primary" to={`/videos/${video.slug}`} title={t('common.watch')}><PlayCircle size={17} />{t('common.watch')}</Link>
        <button className="btn btn-outline" type="button" onClick={() => onSave(video)} title={t('common.save')} aria-label={`${t('common.save')} ${getLocalized(video, 'title', video.title)}`}><Bookmark size={17} />{saved ? t('common.saved') : t('common.save')}</button>
        <button className="btn btn-outline" type="button" onClick={() => onWatched(video)} title={t('common.watched')} aria-label={`${t('common.watched')} ${getLocalized(video, 'title', video.title)}`}><CheckCircle2 size={17} />{completed ? t('common.watched') : t('common.done')}</button>
      </div>
    </article>
  );
}

export function LibraryNotice({ message }) {
  if (!message) return null;
  return <div className="rounded-lg bg-[var(--theme-section)] p-4 font-bold text-[var(--theme-primary)]">{message}</div>;
}

export function SearchBox({ value, onChange, placeholder = 'Search videos and playlists...' }) {
  const { t } = useLanguage();
  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[var(--theme-muted)]" size={18} />
      <input className="input video-library-search-input" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder === 'Search videos and playlists...' ? t('common.search') : placeholder} />
    </label>
  );
}

export function SaveLoginHint({ message }) {
  const { t } = useLanguage();
  if (!message) return null;
  if (message === 'Please log in to save videos and playlists.') {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4">
        <div className="surface max-w-md rounded-lg p-6 text-center">
          <LogIn className="mx-auto text-[var(--theme-accent)]" size={32} />
          <h3 className="mt-3 text-2xl font-black text-[var(--theme-primary)]">{t('video.loginToSave')}</h3>
          <p className="mt-2 text-[var(--theme-muted)]">Log in to save videos, playlists, and watch progress.</p>
          <Link className="btn btn-primary mt-5" to="/login">Login</Link>
        </div>
      </div>
    );
  }
  return <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-[#102927] px-5 py-3 font-bold text-[#fff9ed] shadow-2xl">{message}</div>;
}

export function VideoNotesModal({ video, publicNotes, user, note, setNote, onClose, onSave }) {
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

export function useVideoNotes(video) {
  const { user } = useAuth();
  const [publicNotes, setPublicNotes] = useState([]);
  const [note, setNote] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!video?.id) return undefined;
    const notes = new Map();
    const publish = () => setPublicNotes([...notes.values()].filter((item) => item.isPublished));
    const normalize = (item) => ({ ...item, content: item.content || item.body || '', isPublished: item.isPublished ?? item.published ?? false });
    const handler = (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === 'removed') notes.delete(change.doc.id);
        else notes.set(change.doc.id, normalize({ id: change.doc.id, ...change.doc.data() }));
      });
      publish();
    };
    const onError = (error) => console.error('Failed to load video notes', error);
    const unsub1 = onSnapshot(query(collection(db, 'videoNotes'), where('videoId', '==', video.id), where('isPublished', '==', true)), handler, onError);
    const unsub2 = onSnapshot(query(collection(db, 'videoNotes'), where('videoId', '==', video.id), where('published', '==', true)), handler, onError);
    return () => { unsub1(); unsub2(); };
  }, [video?.id]);

  const openNotes = async () => {
    setOpen(true);
    if (!user || !video?.id) return;
    try {
      const snap = await getDoc(doc(db, 'userPrivateNotes', `${user.uid}_${video.id}`));
      setNote(snap.data()?.note || '');
    } catch (error) {
      console.error('Failed to load private video note', error);
    }
  };

  const saveNote = async () => {
    if (!user || !video?.id) return;
    try {
      await setDoc(doc(db, 'userPrivateNotes', `${user.uid}_${video.id}`), { userId: user.uid, videoId: video.id, note, updatedAt: serverTimestamp() }, { merge: true });
      setOpen(false);
    } catch (error) {
      console.error('Failed to save private video note', error);
    }
  };

  return { user, publicNotes, note, setNote, open, openNotes, closeNotes: () => setOpen(false), saveNote };
}

export function YouTubeEmbed({ video }) {
  if (!video?.youtubeId) {
    return <div className="grid aspect-video place-items-center rounded-lg bg-[var(--theme-hero)] text-[var(--theme-hero-text)]">Video unavailable</div>;
  }
  return (
    <iframe
      className="aspect-video w-full rounded-lg bg-black"
      src={`https://www.youtube.com/embed/${video.youtubeId}`}
      title={video.title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  );
}

export function filterVideos(videos, playlists, { search = '', playlistId = 'all', level = 'all', tag = 'all', sort = 'order' }) {
  const playlistMap = Object.fromEntries(playlists.map((playlist) => [playlist.id, playlist]));
  let list = videos.filter((video) => searchMatchesVideo(video, playlistMap[video.playlistId] || video.playlist, search));
  if (playlistId !== 'all') list = list.filter((video) => (video.playlistId || 'uncategorized') === playlistId);
  if (level !== 'all') list = list.filter((video) => video.level === level);
  if (tag !== 'all') list = list.filter((video) => (video.tags || []).includes(tag));
  if (sort === 'newest') list = [...list].sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
  else if (sort === 'oldest') list = [...list].sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));
  else if (sort === 'featured') list = [...list].sort((a, b) => Number(b.featured) - Number(a.featured) || a.order - b.order);
  else list = sortByOrderThenNewest(list);
  return list;
}

export function SectionTitle({ eyebrow, title, children }) {
  return (
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div><p className="eyebrow">{eyebrow}</p><h2 className="mt-3 text-4xl font-black text-[var(--theme-primary)]">{title}</h2></div>
      {children}
    </div>
  );
}

export function PlaylistBadge({ children }) {
  return <span className="inline-flex items-center gap-2 rounded-full bg-[var(--theme-section)] px-3 py-1 text-xs font-black uppercase text-[var(--theme-primary)]"><Layers3 size={14} />{children}</span>;
}

export { NotebookPen };
