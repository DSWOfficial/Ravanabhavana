import { VideoList } from './ContinueWatching.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useUserDashboardData } from './useUserDashboardData.js';

export default function CompletedVideos() {
  const { videos, byVideo } = useUserDashboardData();
  const { t } = useLanguage();
  return <VideoList title={t('dashboard.completedVideos')} list={videos.filter((v) => byVideo[v.id]?.completed)} empty={t('video.noVideos')} />;
}
