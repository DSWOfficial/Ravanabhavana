import { VideoList } from './ContinueWatching.jsx';
import { useUserDashboardData } from './useUserDashboardData.js';

export default function CompletedVideos() {
  const { videos, byVideo } = useUserDashboardData();
  return <VideoList title="Completed videos" list={videos.filter((v) => byVideo[v.id]?.completed)} empty="සම්පූර්ණ කළ වීඩියෝ තවම නැත." />;
}
