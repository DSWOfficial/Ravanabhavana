import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bookmark, CheckCircle2, Download, ExternalLink, FileImage, FileMusic, FileText, FileVideo, Link as LinkIcon } from 'lucide-react';
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
  const playlistVideos = useMemo(() => video ? videos.filter((item) => item.playlist?.id === video.playlist?.id) : [], [video, videos]);
  const lessonNumber = video ? playlistVideos.findIndex((item) => item.id === video.id) + 1 : 0;
  const completedCount = playlistVideos.filter((item) => saved.progress[item.id]?.completed).length;
  const progressPercent = playlistVideos.length ? Math.round((completedCount / playlistVideos.length) * 100) : 0;
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
                    {video.playlist?.courseMode && (
                      <div className="mt-4 rounded-lg bg-[var(--theme-section)] p-4">
                        <div className="flex flex-wrap justify-between gap-3 font-black text-[var(--theme-primary)]">
                          <span>Lesson {lessonNumber}: {getLocalized(video, 'title', video.title)}</span>
                          {saved.user && <span>{completedCount}/{playlistVideos.length} completed · {progressPercent}%</span>}
                        </div>
                        {saved.user && <div className="mt-3 h-3 overflow-hidden rounded-full bg-white"><span className="block h-full rounded-full bg-[var(--theme-accent)]" style={{ width: `${progressPercent}%` }} /></div>}
                      </div>
                    )}
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
                  {video.lessonNotes && (
                    <section className="mt-5 surface rounded-lg p-6">
                      <h2 className="text-2xl font-black text-[var(--theme-primary)]">Lesson Notes</h2>
                      <div className="prose-notes mt-4 leading-8 text-[var(--theme-text)]" dangerouslySetInnerHTML={{ __html: renderLessonNotes(video.lessonNotes) }} />
                    </section>
                  )}
                  {!!video.materials?.length && (
                    <section className="mt-5 surface rounded-lg p-6">
                      <h2 className="text-2xl font-black text-[var(--theme-primary)]">Study Materials</h2>
                      <div className="mt-4 grid gap-3">
                        {video.materials.map((material) => <MaterialCard material={material} key={material.id} />)}
                      </div>
                    </section>
                  )}
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

function renderLessonNotes(value = '') {
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(value);
  if (looksLikeHtml) return value;
  return value
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split('\n');
      if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
        return `<ul>${lines.map((line) => `<li>${inlineMarkdown(line.replace(/^\s*[-*]\s+/, ''))}</li>`).join('')}</ul>`;
      }
      return `<p>${inlineMarkdown(lines.join('<br />'))}</p>`;
    })
    .join('');
}

function inlineMarkdown(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noreferrer">$1</a>');
}

function MaterialCard({ material }) {
  const Icon = getMaterialIcon(material.type);
  return (
    <article className="flex flex-col justify-between gap-3 rounded-lg border border-[color-mix(in_srgb,var(--theme-accent)_24%,transparent)] bg-[var(--theme-section)] p-4 sm:flex-row sm:items-center">
      <div className="flex items-start gap-3">
        <Icon className="mt-1 text-[var(--theme-accent)]" size={24} />
        <div>
          <h3 className="font-black text-[var(--theme-primary)]">{material.title}</h3>
          {material.description && <p className="mt-1 text-sm text-[var(--theme-muted)]">{material.description}</p>}
          <span className="mt-2 inline-flex rounded-full bg-white px-3 py-1 text-xs font-black uppercase text-[var(--theme-primary)]">{material.type}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <a className="btn btn-outline" href={material.url} target="_blank" rel="noreferrer"><ExternalLink size={16} />Open</a>
        {material.downloadable && <a className="btn btn-primary" href={material.url} download target="_blank" rel="noreferrer"><Download size={16} />Download</a>}
      </div>
    </article>
  );
}

function getMaterialIcon(type = '') {
  const value = type.toLowerCase();
  if (value.includes('pdf') || value.includes('document')) return FileText;
  if (value.includes('image')) return FileImage;
  if (value.includes('audio')) return FileMusic;
  if (value.includes('video')) return FileVideo;
  return LinkIcon;
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
