import { useLanguage } from '../../context/LanguageContext.jsx';
import { getContinueWatchingVideos } from '../../utils/progress.js';
import { useUserDashboardData } from './useUserDashboardData.js';

export default function ContinueWatching() {
  const { videos, progress } = useUserDashboardData();
  const { t } = useLanguage();
  const list = getContinueWatchingVideos(videos, progress);
  return <VideoList title={t('dashboard.continueWatching')} list={list} empty={t('video.noVideos')} />;
}

export function VideoList({ title, list, empty }) {
  return (
    <section className="surface rounded-lg p-6">
      <h2 className="text-2xl font-black">{title}</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {list.map((video) => <a key={video.id} href={video.youtubeUrl || video.videoUrl} target="_blank" rel="noreferrer" className="interactive-card rounded-lg bg-[var(--theme-surface)] p-3"><img className="aspect-video w-full rounded object-cover" src={video.thumbnailUrl} alt={video.title} /><b className="mt-3 block text-[var(--theme-primary)]">{video.title}</b></a>)}
      </div>
      {!list.length && <p className="mt-3 text-[var(--theme-muted)]">{empty}</p>}
    </section>
  );
}
