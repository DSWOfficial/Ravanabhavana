import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/public/Header.jsx';
import Footer from '../components/public/Footer.jsx';
import { LibraryNotice, PlaylistCard, SaveLoginHint, SearchBox, SectionTitle, VideoCard, filterVideos, useSavedLibrary, useVideoLibraryData } from '../components/public/VideoLibraryShared.jsx';
import { getSmartRecommendations, videoLevels, watchPathOptions } from '../lib/videoLibrary.js';

export default function VideoLibraryPage() {
  const { loading, error, playlists, videos } = useVideoLibraryData();
  const saved = useSavedLibrary();
  const [search, setSearch] = useState('');
  const [playlistId, setPlaylistId] = useState('all');
  const [level, setLevel] = useState('all');
  const [tag, setTag] = useState('all');
  const [sort, setSort] = useState('order');
  const [goal, setGoal] = useState('peace');

  const tags = useMemo(() => [...new Set(videos.flatMap((video) => video.tags || []))].sort(), [videos]);
  const filtered = useMemo(() => filterVideos(videos, playlists, { search, playlistId, level, tag, sort }), [level, playlistId, playlists, search, sort, tag, videos]);
  const featuredPlaylists = playlists.filter((playlist) => playlist.videoCount > 0).slice(0, 4);
  const featuredVideos = videos.filter((video) => video.featured).slice(0, 6);
  const continueWatching = videos.filter((video) => saved.progress[video.id] && !saved.progress[video.id].completed).slice(0, 4);
  const savedVideoList = videos.filter((video) => saved.savedVideos[video.id]).slice(0, 4);
  const savedPlaylistList = playlists.filter((playlist) => saved.savedPlaylists[playlist.id]).slice(0, 4);
  const smart = getSmartRecommendations(goal, playlists, videos);

  return (
    <>
      <Header />
      <main className="bg-[var(--theme-page)]">
        <section className="bg-[var(--theme-hero)] py-16 text-[var(--theme-hero-text)]">
          <div className="container-shell">
            <p className="text-sm font-black uppercase text-[var(--theme-accent)]">Ravana Bhavana</p>
            <h1 className="mt-3 text-5xl font-black">Video Library</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[color-mix(in_srgb,var(--theme-hero-text)_82%,var(--theme-accent))]">Browse playlists, continue learning, save what matters, and choose a guided watch path when you are not sure where to begin.</p>
            <div className="mt-8 max-w-3xl"><SearchBox value={search} onChange={setSearch} /></div>
          </div>
        </section>

        <section className="section">
          <div className="container-shell grid gap-8">
            <LibraryNotice message={error || saved.message} />
            {loading && <p className="surface rounded-lg p-5 font-bold text-[var(--theme-muted)]">Loading video library...</p>}

            <section>
              <SectionTitle eyebrow="Playlists" title="Featured Playlists" />
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                {featuredPlaylists.map((playlist) => <PlaylistCard key={playlist.id} playlist={playlist} saved={Boolean(saved.savedPlaylists[playlist.id])} onSave={saved.toggleSavedPlaylist} />)}
                {!loading && !featuredPlaylists.length && <p className="rounded-lg bg-[var(--theme-section)] p-5 text-[var(--theme-muted)]">No playlists yet.</p>}
              </div>
            </section>

            <section className="surface rounded-lg p-6">
              <SectionTitle eyebrow="Smart Watch Path" title="Not sure what to watch?" />
              <div className="mt-5 flex flex-wrap gap-2">
                {watchPathOptions.map((option) => <button key={option.key} className={`btn ${goal === option.key ? 'btn-primary' : 'btn-outline'}`} type="button" onClick={() => setGoal(option.key)}>{option.label}</button>)}
              </div>
              <div className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-lg bg-[var(--theme-section)] p-5">
                  <p className="eyebrow">Recommended playlist</p>
                  <h3 className="mt-2 text-2xl font-black text-[var(--theme-primary)]">{smart.recommendedPlaylist.title}</h3>
                  <p className="mt-2 text-[var(--theme-muted)]">{smart.recommendedPlaylist.description}</p>
                  <Link className="btn btn-primary mt-4" to={`/videos/playlist/${smart.recommendedPlaylist.slug}`}>Start watching</Link>
                </div>
                <div className="grid gap-3">
                  {smart.recommendedVideos.map((video) => <Link className="rounded-lg border border-[color-mix(in_srgb,var(--theme-accent)_25%,transparent)] bg-[var(--theme-surface)] p-4 font-bold text-[var(--theme-primary)]" key={video.id} to={`/videos/${video.slug}`}>{video.title}</Link>)}
                  {!smart.recommendedVideos.length && <p className="rounded-lg bg-[var(--theme-section)] p-4 text-[var(--theme-muted)]">Recommended videos will appear when more videos are published.</p>}
                </div>
              </div>
            </section>

            {saved.user && (!!continueWatching.length || !!savedVideoList.length || !!savedPlaylistList.length) && (
              <section>
                <SectionTitle eyebrow="Your Library" title="Saved and Continue Watching" />
                {!!continueWatching.length && <VideoRow title="Continue watching" videos={continueWatching} saved={saved} />}
                {!!savedVideoList.length && <VideoRow title="Saved videos" videos={savedVideoList} saved={saved} />}
                {!!savedPlaylistList.length && <div className="mt-5 grid gap-4 md:grid-cols-2">{savedPlaylistList.map((playlist) => <PlaylistCard key={playlist.id} playlist={playlist} saved onSave={saved.toggleSavedPlaylist} />)}</div>}
              </section>
            )}

            {!!featuredVideos.length && <VideoRow title="Featured videos" videos={featuredVideos} saved={saved} />}

            <section>
              <SectionTitle eyebrow="Browse" title="All Videos">
                <div className="flex flex-wrap gap-2">
                  <select className="input w-auto min-w-40" value={playlistId} onChange={(event) => setPlaylistId(event.target.value)}>
                    <option value="all">All playlists</option>
                    {playlists.map((playlist) => <option key={playlist.id} value={playlist.id}>{playlist.title}</option>)}
                  </select>
                  <select className="input w-auto min-w-36" value={level} onChange={(event) => setLevel(event.target.value)}><option value="all">All levels</option>{videoLevels.map((item) => <option key={item}>{item}</option>)}</select>
                  <select className="input w-auto min-w-32" value={tag} onChange={(event) => setTag(event.target.value)}><option value="all">All tags</option>{tags.map((item) => <option key={item}>{item}</option>)}</select>
                  <select className="input w-auto min-w-36" value={sort} onChange={(event) => setSort(event.target.value)}><option value="order">Playlist order</option><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="featured">Featured</option></select>
                </div>
              </SectionTitle>
              <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((video) => <VideoCard key={video.id} video={video} saved={Boolean(saved.savedVideos[video.id])} completed={Boolean(saved.progress[video.id]?.completed)} onSave={saved.toggleSavedVideo} onWatched={saved.markWatched} />)}
              </div>
              {!loading && !filtered.length && <p className="mt-6 rounded-lg bg-[var(--theme-section)] p-5 text-[var(--theme-muted)]">No videos found. Try another search.</p>}
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
