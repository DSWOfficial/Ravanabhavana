import { VideoList } from './ContinueWatching.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useUserDashboardData } from './useUserDashboardData.js';

export default function SavedVideos() {
  const { videos, byVideo } = useUserDashboardData();
  const { t } = useLanguage();
  return <VideoList title={t('dashboard.savedVideos')} list={videos.filter((v) => byVideo[v.id]?.saved)} empty={t('video.noVideos')} />;
}
