import { VideoList } from './ContinueWatching.jsx';
import { useUserDashboardData } from './useUserDashboardData.js';

export default function SavedVideos() {
  const { videos, byVideo } = useUserDashboardData();
  return <VideoList title="Saved videos" list={videos.filter((v) => byVideo[v.id]?.saved)} empty="සුරැකි වීඩියෝ තවම නැත." />;
}
