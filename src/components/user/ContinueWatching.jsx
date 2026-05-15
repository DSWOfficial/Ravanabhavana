import { getContinueWatchingVideos } from '../../utils/progress.js';
import { useUserDashboardData } from './useUserDashboardData.js';

export default function ContinueWatching() {
  const { videos, progress } = useUserDashboardData();
  const list = getContinueWatchingVideos(videos, progress);
  return <VideoList title="Continue watching" list={list} empty="තවම වීඩියෝ නොමැත." />;
}

export function VideoList({ title, list, empty }) {
  return (
    <section className="surface rounded-lg p-6">
      <h2 className="text-2xl font-black">{title}</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {list.map((video) => <a key={video.id} href={video.youtubeUrl} target="_blank" rel="noreferrer" className="rounded-lg bg-[#fffaf0] p-3"><img className="aspect-video w-full rounded object-cover" src={video.thumbnailUrl} alt={video.title} /><b className="mt-3 block">{video.title}</b></a>)}
      </div>
      {!list.length && <p className="mt-3 text-[#6f4a31]">{empty}</p>}
    </section>
  );
}
