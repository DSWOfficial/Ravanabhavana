import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/public/Header.jsx';
import Footer from '../components/public/Footer.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { LibraryNotice, PlaylistBadge, PlaylistCard, SaveLoginHint, SearchBox, SectionTitle, VideoCard, filterVideos, useSavedLibrary, useVideoLibraryData } from '../components/public/VideoLibraryShared.jsx';
import { getPlaylistBreadcrumb, getPlaylistRoute, getPlaylistStyle, uncategorizedPlaylist } from '../lib/videoLibrary.js';

export default function PlaylistDetailPage() {
  const params = useParams();
  const slugPath = params['*'] || 'uncategorized';
  const pathParts = slugPath.split('/').filter(Boolean);
  const { loading, error, playlists, videos } = useVideoLibraryData();
  const saved = useSavedLibrary();
  const { getLocalized, t } = useLanguage();
  const [search, setSearch] = useState('');
  const playlistMap = useMemo(() => Object.fromEntries(playlists.map((item) => [item.id, item])), [playlists]);
  const playlist = playlists.find((item) => [...(item.pathSlugs || []), item.slug].join('/') === slugPath)
    || playlists.find((item) => item.slug === pathParts.at(-1))
    || (slugPath === 'uncategorized' ? uncategorizedPlaylist : null);
  const breadcrumbs = playlist ? getPlaylistBreadcrumb(playlist, playlistMap) : [];
  const subPlaylists = useMemo(() => playlists.filter((item) => item.parentPlaylistId === playlist?.id), [playlist?.id, playlists]);
  const playlistVideos = useMemo(() => {
    if (!playlist) return [];
    return filterVideos(videos.filter((video) => video.playlist?.id === playlist.id || (playlist.id === 'uncategorized' && video.playlist?.id === 'uncategorized')), playlists, { search });
  }, [playlist, playlists, search, videos]);
  const completedCount = playlistVideos.filter((video) => saved.progress[video.id]?.completed).length;
  const progressPercent = playlistVideos.length ? Math.round((completedCount / playlistVideos.length) * 100) : 0;
  const continueVideo = playlistVideos.find((video) => !saved.progress[video.id]?.completed) || playlistVideos[0];

  return (
    <>
      <Header />
      <main className="bg-[var(--theme-page)]">
        <section className="py-14" style={playlist ? getPlaylistStyle(playlist) : undefined}>
          <div className="container-shell grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
            <img className="aspect-video w-full rounded-lg object-cover shadow-2xl" src={playlist?.coverImageUrl || '/ravana-bhawana-logo.png'} alt="" />
            <div>
              <PlaylistBadge>{playlist?.topic || 'Playlist'}</PlaylistBadge>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-bold opacity-90">
                <Link to="/videos">{t('video.library')}</Link>
                {breadcrumbs.map((item) => <span key={item.id}>/ <Link to={getPlaylistRoute(item)}>{getLocalized(item, 'title', item.title)}</Link></span>)}
              </div>
              <h1 className="mt-4 text-5xl font-black">{playlist ? getLocalized(playlist, 'title', playlist.title) : (loading ? t('common.loading') : t('video.noPlaylists'))}</h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 opacity-90">{playlist ? getLocalized(playlist, 'description', playlist.description) : t('video.noVideos')}</p>
              <p className="mt-3 text-sm font-black opacity-80">{subPlaylists.length} {t('video.folders')} / {playlistVideos.length} {t('video.videos')}</p>
              {playlist?.courseMode && (
                <div className="mt-5 rounded-lg bg-black/15 p-4">
                  <div className="flex flex-wrap justify-between gap-3 text-sm font-black">
                    <span>{playlistVideos.length} lessons</span>
                    {saved.user && <span>{completedCount} completed / {progressPercent}%</span>}
                  </div>
                  {saved.user && <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/20"><span className="block h-full rounded-full bg-[var(--theme-accent)]" style={{ width: `${progressPercent}%` }} /></div>}
                  {continueVideo && <Link className="btn btn-gold mt-4" to={`/videos/${continueVideo.slug}`}>Continue watching</Link>}
                </div>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                {playlist && <button className="btn btn-gold" onClick={() => saved.toggleSavedPlaylist(playlist)}>{saved.savedPlaylists[playlist.id] ? t('common.saved') : t('common.save')}</button>}
                <Link className="btn btn-outline border-white/30 text-inherit" to="/videos">{t('video.backToLibrary')}</Link>
              </div>
            </div>
          </div>
        </section>
        <section className="section">
          <div className="container-shell">
            <LibraryNotice message={error || saved.message} />
            {!!subPlaylists.length && (
              <section className="mb-10">
                <SectionTitle eyebrow={`${subPlaylists.length} ${t('video.folders')}`} title={t('video.subPlaylist')} />
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  {subPlaylists.map((item) => <PlaylistCard key={item.id} playlist={item} saved={Boolean(saved.savedPlaylists[item.id])} onSave={saved.toggleSavedPlaylist} />)}
                </div>
              </section>
            )}
            <SectionTitle eyebrow={`${playlistVideos.length} ${t('video.videos')}`} title={t('video.videos')}>
              <div className="w-full max-w-md"><SearchBox value={search} onChange={setSearch} placeholder="Search within playlist..." /></div>
            </SectionTitle>
            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {playlistVideos.map((video, index) => (
                <div key={video.id}>
                  {playlist?.courseMode && <p className="mb-2 font-black text-[var(--theme-primary)]">Lesson {index + 1}</p>}
                  <VideoCard video={video} saved={Boolean(saved.savedVideos[video.id])} completed={Boolean(saved.progress[video.id]?.completed)} onSave={saved.toggleSavedVideo} onWatched={saved.markWatched} />
                </div>
              ))}
            </div>
            {!loading && !playlistVideos.length && <p className="mt-6 rounded-lg bg-[var(--theme-section)] p-5 text-[var(--theme-muted)]">{t('video.noVideos')}</p>}
          </div>
        </section>
      </main>
      <SaveLoginHint message={saved.message} />
      <Footer />
    </>
  );
}
