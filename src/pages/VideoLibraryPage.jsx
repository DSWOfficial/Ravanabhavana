import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/public/Header.jsx';
import Footer from '../components/public/Footer.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { LibraryNotice, PlaylistCard, SaveLoginHint, SearchBox, SectionTitle, VideoCard, filterVideos, useSavedLibrary, useVideoLibraryData } from '../components/public/VideoLibraryShared.jsx';
import { getPlaylistRoute, getSmartRecommendations, videoLevels, watchPathOptions } from '../lib/videoLibrary.js';

export default function VideoLibraryPage() {
  const { loading, error, playlists, videos } = useVideoLibraryData();
  const saved = useSavedLibrary();
  const { getLocalized, t } = useLanguage();
  const [search, setSearch] = useState('');
  const [playlistId, setPlaylistId] = useState('all');
  const [subPlaylistId, setSubPlaylistId] = useState('all');
  const [level, setLevel] = useState('all');
  const [tag, setTag] = useState('all');
  const [sort, setSort] = useState('order');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [latestOnly, setLatestOnly] = useState(false);
  const [goal, setGoal] = useState('peace');

  const tags = useMemo(() => [...new Set(videos.flatMap((video) => video.tags || []))].sort(), [videos]);
  const filtered = useMemo(() => filterVideos(videos, playlists, { search, playlistId, subPlaylistId, level, tag, sort, featuredOnly, latestOnly }), [featuredOnly, latestOnly, level, playlistId, playlists, search, sort, subPlaylistId, tag, videos]);
  const mainPlaylists = playlists.filter((playlist) => !playlist.parentPlaylistId);
  const subPlaylistOptions = playlists.filter((playlist) => playlist.parentPlaylistId && (playlistId === 'all' || playlist.parentPlaylistId === playlistId));
  const featuredPlaylists = mainPlaylists.filter((playlist) => playlist.videoCount > 0 || playlist.subPlaylistCount > 0).slice(0, 4);
  const featuredVideos = videos.filter((video) => video.featured).slice(0, 6);
  const continueWatching = videos.filter((video) => saved.progress[video.id] && !saved.progress[video.id].completed).slice(0, 4);
  const savedVideoList = videos.filter((video) => saved.savedVideos[video.id]).slice(0, 4);
  const savedPlaylistList = playlists.filter((playlist) => saved.savedPlaylists[playlist.id]).slice(0, 4);
  const smart = getSmartRecommendations(goal, playlists, videos);
  const learningPath = playlists.filter((playlist) => playlist.learningPathEnabled).sort((a, b) => a.learningPathOrder - b.learningPathOrder);

  return (
    <>
      <Header />
      <main className="bg-[var(--theme-page)]">
        <section className="bg-[var(--theme-hero)] py-16 text-[var(--theme-hero-text)]">
          <div className="container-shell">
            <p className="text-sm font-black uppercase text-[var(--theme-accent)]">Ravana Bhavana</p>
            <h1 className="mt-3 text-5xl font-black">{t('video.library')}</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[color-mix(in_srgb,var(--theme-hero-text)_82%,var(--theme-accent))]">{t('video.librarySubtitle')}</p>
            <div className="mt-8 max-w-3xl"><SearchBox value={search} onChange={setSearch} /></div>
          </div>
        </section>

        <section className="section">
          <div className="container-shell grid gap-8">
            <LibraryNotice message={error || saved.message} />
            {loading && <p className="surface rounded-lg p-5 font-bold text-[var(--theme-muted)]">{t('common.loading')}</p>}

            <section>
              <SectionTitle eyebrow={t('video.playlists')} title={t('video.featuredPlaylists')} />
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                {featuredPlaylists.map((playlist) => <PlaylistCard key={playlist.id} playlist={playlist} saved={Boolean(saved.savedPlaylists[playlist.id])} onSave={saved.toggleSavedPlaylist} />)}
                {!loading && !featuredPlaylists.length && <p className="rounded-lg bg-[var(--theme-section)] p-5 text-[var(--theme-muted)]">{t('video.noPlaylists')}</p>}
              </div>
            </section>

            {!!learningPath.length && (
              <section className="surface rounded-lg p-6">
                <SectionTitle eyebrow={t('video.learningPathEyebrow')} title={t('video.learningPath')} />
                <div className="learning-path-map mt-6">
                  {learningPath.map((playlist, index) => (
                    <Link className="learning-path-step" to={getPlaylistRoute(playlist)} key={playlist.id}>
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <b>{getLocalized(playlist, 'learningPathLabel', playlist.learningPathLabel || playlist.title)}</b>
                      <small>{getLocalized(playlist, 'title', playlist.title)}</small>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section className="surface rounded-lg p-6">
              <SectionTitle eyebrow={t('video.smartEyebrow')} title={t('video.smartTitle')} />
              <div className="mt-5 flex flex-wrap gap-2">
                {watchPathOptions.map((option) => <button key={option.key} className={`btn ${goal === option.key ? 'btn-primary' : 'btn-outline'}`} type="button" onClick={() => setGoal(option.key)}>{option.label}</button>)}
              </div>
              <div className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-lg bg-[var(--theme-section)] p-5">
                  <p className="eyebrow">{t('video.playlist')}</p>
                  <h3 className="mt-2 text-2xl font-black text-[var(--theme-primary)]">{getLocalized(smart.recommendedPlaylist, 'title', smart.recommendedPlaylist.title)}</h3>
                  <p className="mt-2 text-[var(--theme-muted)]">{getLocalized(smart.recommendedPlaylist, 'description', smart.recommendedPlaylist.description)}</p>
                  <Link className="btn btn-primary mt-4" to={getPlaylistRoute(smart.recommendedPlaylist)}>{t('video.startWatching')}</Link>
                </div>
                <div className="grid gap-3">
                  {smart.recommendedVideos.map((video) => <Link className="rounded-lg border border-[color-mix(in_srgb,var(--theme-accent)_25%,transparent)] bg-[var(--theme-surface)] p-4 font-bold text-[var(--theme-primary)]" key={video.id} to={`/videos/${video.slug}`}>{getLocalized(video, 'title', video.title)}</Link>)}
                  {!smart.recommendedVideos.length && <p className="rounded-lg bg-[var(--theme-section)] p-4 text-[var(--theme-muted)]">Recommended videos will appear when more videos are published.</p>}
                </div>
              </div>
            </section>

            {saved.user && (!!continueWatching.length || !!savedVideoList.length || !!savedPlaylistList.length) && (
              <section>
                <SectionTitle eyebrow={t('nav.dashboard')} title={`${t('video.savedVideos')} / ${t('video.continueWatching')}`} />
                {!!continueWatching.length && <VideoRow title={t('video.continueWatching')} videos={continueWatching} saved={saved} />}
                {!!savedVideoList.length && <VideoRow title={t('video.savedVideos')} videos={savedVideoList} saved={saved} />}
                {!!savedPlaylistList.length && <div className="mt-5 grid gap-4 md:grid-cols-2">{savedPlaylistList.map((playlist) => <PlaylistCard key={playlist.id} playlist={playlist} saved onSave={saved.toggleSavedPlaylist} />)}</div>}
              </section>
            )}

            {!!featuredVideos.length && <VideoRow title={t('common.featured')} videos={featuredVideos} saved={saved} />}

            <section>
              <SectionTitle eyebrow={t('common.search')} title={t('video.allVideos')}>
                <div className="flex flex-wrap gap-2">
                  <select className="input w-auto min-w-40" value={playlistId} onChange={(event) => setPlaylistId(event.target.value)}>
                    <option value="all">{t('video.playlists')}</option>
                    {mainPlaylists.map((playlist) => <option key={playlist.id} value={playlist.id}>{playlist.title}</option>)}
                  </select>
                  <select className="input w-auto min-w-40" value={subPlaylistId} onChange={(event) => setSubPlaylistId(event.target.value)}>
                    <option value="all">{t('video.subPlaylist')}</option>
                    {subPlaylistOptions.map((playlist) => <option key={playlist.id} value={playlist.id}>{`${'— '.repeat(playlist.depth || 0)}${playlist.title}`}</option>)}
                  </select>
                  <select className="input w-auto min-w-36" value={level} onChange={(event) => setLevel(event.target.value)}><option value="all">{t('common.all')}</option>{videoLevels.map((item) => <option key={item}>{item}</option>)}</select>
                  <select className="input w-auto min-w-32" value={tag} onChange={(event) => setTag(event.target.value)}><option value="all">{t('common.all')}</option>{tags.map((item) => <option key={item}>{item}</option>)}</select>
                  <select className="input w-auto min-w-36" value={sort} onChange={(event) => setSort(event.target.value)}><option value="order">{t('video.playlist')}</option><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="mostWatched">Most watched</option><option value="recommended">Recommended</option><option value="featured">{t('common.featured')}</option></select>
                  <label className="inline-flex items-center gap-2 rounded-lg bg-[var(--theme-section)] px-4 py-3 font-bold text-[var(--theme-primary)]"><input type="checkbox" checked={featuredOnly} onChange={(event) => setFeaturedOnly(event.target.checked)} /> Featured videos</label>
                  <label className="inline-flex items-center gap-2 rounded-lg bg-[var(--theme-section)] px-4 py-3 font-bold text-[var(--theme-primary)]"><input type="checkbox" checked={latestOnly} onChange={(event) => setLatestOnly(event.target.checked)} /> Latest videos</label>
                </div>
              </SectionTitle>
              <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((video) => <VideoCard key={video.id} video={video} saved={Boolean(saved.savedVideos[video.id])} completed={Boolean(saved.progress[video.id]?.completed)} onSave={saved.toggleSavedVideo} onWatched={saved.markWatched} />)}
              </div>
              {!loading && !filtered.length && <p className="mt-6 rounded-lg bg-[var(--theme-section)] p-5 text-[var(--theme-muted)]">{t('video.noFound')}</p>}
            </section>
          </div>
        </section>
      </main>
      <SaveLoginHint message={saved.message} />
      <Footer />
    </>
  );
}

function VideoRow({ title, videos, saved }) {
  return (
    <div className="mt-5">
      <h3 className="text-2xl font-black text-[var(--theme-primary)]">{title}</h3>
      <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {videos.map((video) => <VideoCard key={video.id} video={video} saved={Boolean(saved.savedVideos[video.id])} completed={Boolean(saved.progress[video.id]?.completed)} onSave={saved.toggleSavedVideo} onWatched={saved.markWatched} />)}
      </div>
    </div>
  );
}
