import { useLanguage } from '../../context/LanguageContext.jsx';
import { formatSinhalaDate } from '../../utils/dateTime.js';
import { History } from './UserDonationHistory.jsx';
import { useUserDashboardData } from './useUserDashboardData.js';

export default function UserSessionHistory() {
  const { sessions } = useUserDashboardData();
  const { t } = useLanguage();
  return <History title={t('dashboard.joinedSessions')} items={sessions.map((s) => `${s.sessionTitle || 'Zoom'} · ${s.sessionDate || ''} · ${formatSinhalaDate(s.joinedAt)}`)} empty={t('video.noVideos')} />;
}
