import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/public/Header.jsx';
import Footer from '../components/public/Footer.jsx';
import { LibraryNotice, PlaylistBadge, SaveLoginHint, SearchBox, SectionTitle, VideoCard, filterVideos, useSavedLibrary, useVideoLibraryData } from '../components/public/VideoLibraryShared.jsx';
import { getPlaylistStyle, uncategorizedPlaylist } from '../lib/videoLibrary.js';

export default function PlaylistDetailPage() {
  const { slug } = useParams();
  const { loading, error, playlists, videos } = useVideoLibraryData();
  const saved = useSavedLibrary();
  const [search, setSearch] = useState('');
  const playlist = playlists.find((item) => item.slug === slug) || (slug === 'uncategorized' ? uncategorizedPlaylist : null);
  const playlistVideos = useMemo(() => {
    if (!playlist) return [];
    return filterVideos(videos.filter((video) => (video.playlistSlug || video.playlist?.slug) === playlist.slug || (playlist.id === 'uncategorized' && video.playlist?.id === 'uncategorized')), playlists, { search });
  }, [playlist, playlists, search, videos]);

  return (
    <>
      <Header />
      <main className="bg-[var(--theme-page)]">
        <section className="py-14" style={playlist ? getPlaylistStyle(playlist) : undefined}>
          <div className="container-shell grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
            <img className="aspect-video w-full rounded-lg object-cover shadow-2xl" src={playlist?.coverImageUrl || '/ravana-bhawana-logo.png'} alt="" />
            <div>
              <PlaylistBadge>{playlist?.topic || 'Playlist'}</PlaylistBadge>
              <h1 className="mt-4 text-5xl font-black">{playlist?.title || (loading ? 'Loading playlist...' : 'Playlist not found')}</h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 opacity-90">{playlist?.description || 'Videos in this playlist will appear here.'}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {playlist && <button className="btn btn-gold" onClick={() => saved.toggleSavedPlaylist(playlist)}>{saved.savedPlaylists[playlist.id] ? 'Saved Playlist' : 'Save Playlist'}</button>}
                <Link className="btn btn-outline border-white/30 text-inherit" to="/videos">Back to Video Library</Link>
              </div>
            </div>
          </div>
        </section>
        <section className="section">
          <div className="container-shell">
            <LibraryNotice message={error || saved.message} />
            <SectionTitle eyebrow={`${playlistVideos.length} videos`} title="Playlist Videos">
              <div className="w-full max-w-md"><SearchBox value={search} onChange={setSearch} placeholder="Search within playlist..." /></div>
            </SectionTitle>
            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {playlistVideos.map((video) => <VideoCard key={video.id} video={video} saved={Boolean(saved.savedVideos[video.id])} completed={Boolean(saved.progress[video.id]?.completed)} onSave={saved.toggleSavedVideo} onWatched={saved.markWatched} />)}
            </div>
            {!loading && !playlistVideos.length && <p className="mt-6 rounded-lg bg-[var(--theme-section)] p-5 text-[var(--theme-muted)]">No videos in this playlist yet.</p>}
          </div>
        </section>
      </main>
      <SaveLoginHint message={saved.message} />
      <Footer />
    </>
  );
}
