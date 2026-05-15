import { formatSinhalaDate } from '../../utils/dateTime.js';
import { History } from './UserDonationHistory.jsx';
import { useUserDashboardData } from './useUserDashboardData.js';

export default function UserSessionHistory() {
  const { sessions } = useUserDashboardData();
  return <History title="Joined Zoom sessions" items={sessions.map((s) => `${s.sessionTitle || 'Zoom'} · ${s.sessionDate || ''} · ${formatSinhalaDate(s.joinedAt)}`)} empty="Joined sessions තවම නැත." />;
}
