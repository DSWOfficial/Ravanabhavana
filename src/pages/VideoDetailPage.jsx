import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bookmark, CheckCircle2 } from 'lucide-react';
import Header from '../components/public/Header.jsx';
import Footer from '../components/public/Footer.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { LibraryNotice, NotebookPen, SaveLoginHint, VideoCard, VideoNotesModal, YouTubeEmbed, useSavedLibrary, useVideoLibraryData, useVideoNotes } from '../components/public/VideoLibraryShared.jsx';
import { getPlaylistBreadcrumb, getPlaylistRoute } from '../lib/videoLibrary.js';

export default function VideoDetailPage() {
  const { slug } = useParams();
  const { loading, error, videos, playlistMap } = useVideoLibraryData();
  const saved = useSavedLibrary();
  const { getLocalized, t } = useLanguage();
  const video = videos.find((item) => item.slug === slug);
  const notes = useVideoNotes(video);
  const breadcrumbs = video?.playlist ? getPlaylistBreadcrumb(video.playlist, playlistMap) : [];
  const nextVideos = useMemo(() => {
    if (!video) return [];
    return videos.filter((item) => item.id !== video.id && item.playlist?.id === video.playlist?.id).slice(0, 4);
  }, [video, videos]);
  const related = useMemo(() => {
    if (!video) return [];
    const tags = new Set(video.tags || []);
    return videos.filter((item) => item.id !== video.id && item.tags?.some((tag) => tags.has(tag))).slice(0, 4);
  }, [video, videos]);

  return (
    <>
      <Header />
      <main className="bg-[var(--theme-page)]">
        <section className="section">
          <div className="container-shell">
            <LibraryNotice message={error || saved.message} />
            {loading && <p className="surface rounded-lg p-5">{t('common.loading')}</p>}
            {!loading && !video && <p className="surface rounded-lg p-5">{t('video.noVideos')}</p>}
            {video && (
              <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
                <div>
                  <YouTubeEmbed video={video} />
                  <div className="mt-5 surface rounded-lg p-6">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-[var(--theme-muted)]">
                      <Link to="/videos">{t('video.library')}</Link>
                      {breadcrumbs.map((item) => <span key={item.id}>/ <Link to={getPlaylistRoute(item)}>{getLocalized(item, 'title', item.title)}</Link></span>)}
                    </div>
                    <h1 className="mt-2 text-4xl font-black text-[var(--theme-primary)]">{getLocalized(video, 'title', video.title)}</h1>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {video.tags?.map((tag) => <span className="rounded-full bg-[var(--theme-section)] px-3 py-1 text-xs font-black text-[var(--theme-primary)]" key={tag}>{tag}</span>)}
                    </div>
                    <p className="mt-5 whitespace-pre-wrap leading-8 text-[var(--theme-text)]">{getLocalized(video, 'description', video.description)}</p>
                    <div className="mt-6 flex flex-wrap gap-2">
                      <button className="btn btn-outline" onClick={() => saved.toggleSavedVideo(video)}><Bookmark size={17} />{saved.savedVideos[video.id] ? t('common.saved') : t('common.save')}</button>
                      <button className="btn btn-outline" onClick={() => saved.markWatched(video)}><CheckCircle2 size={17} />{saved.progress[video.id]?.completed ? t('common.watched') : t('common.done')}</button>
                      <button className="btn btn-outline" onClick={notes.openNotes}><NotebookPen size={17} />{t('video.notes')}</button>
                      <Link className="btn btn-primary" to={getPlaylistRoute(video.playlist)}>{t('video.backToPlaylist')}</Link>
                    </div>
                  </div>
                </div>
                <aside className="grid content-start gap-4">
                  <div className="surface rounded-lg p-5">
                    <h2 className="text-xl font-black text-[var(--theme-primary)]">{t('video.nextInPlaylist')}</h2>
                    <div className="mt-4 grid gap-3">
                      {nextVideos.map((item) => <SmallVideoLink key={item.id} video={item} />)}
                      {!nextVideos.length && <p className="text-[var(--theme-muted)]">{t('video.noVideos')}</p>}
                    </div>
                  </div>
                  <div className="surface rounded-lg p-5">
                    <h2 className="text-xl font-black text-[var(--theme-primary)]">{t('video.relatedVideos')}</h2>
                    <div className="mt-4 grid gap-3">
                      {related.map((item) => <SmallVideoLink key={item.id} video={item} />)}
                      {!related.length && <p className="text-[var(--theme-muted)]">{t('video.noVideos')}</p>}
                    </div>
                  </div>
                </aside>
                {!!nextVideos.length && <div className="lg:col-span-2"><h2 className="text-2xl font-black text-[var(--theme-primary)]">{t('video.nextInPlaylist')}</h2><div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-4">{nextVideos.map((item) => <VideoCard key={item.id} video={item} saved={Boolean(saved.savedVideos[item.id])} completed={Boolean(saved.progress[item.id]?.completed)} onSave={saved.toggleSavedVideo} onWatched={saved.markWatched} />)}</div></div>}
              </div>
            )}
          </div>
        </section>
      </main>
      {notes.open && video && <VideoNotesModal video={video} publicNotes={notes.publicNotes} user={notes.user} note={notes.note} setNote={notes.setNote} onClose={notes.closeNotes} onSave={notes.saveNote} />}
      <SaveLoginHint message={saved.message} />
      <Footer />
    </>
  );
}

function SmallVideoLink({ video }) {
  const { getLocalized } = useLanguage();
  return (
    <Link className="grid grid-cols-[96px_1fr] gap-3 rounded-lg bg-[var(--theme-section)] p-2 transition hover:bg-[color-mix(in_srgb,var(--theme-accent)_14%,var(--theme-section))]" to={`/videos/${video.slug}`}>
      <img className="aspect-video rounded object-cover" src={video.thumbnailUrl} alt="" />
      <span className="text-sm font-black text-[var(--theme-primary)]">{getLocalized(video, 'title', video.title)}</span>
    </Link>
  );
}
