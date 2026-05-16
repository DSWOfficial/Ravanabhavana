import { useLanguage } from '../../context/LanguageContext.jsx';
import { formatSinhalaDate } from '../../utils/dateTime.js';
import { useUserDashboardData } from './useUserDashboardData.js';

export default function UserDonationHistory() {
  const { donations } = useUserDashboardData();
  const { t } = useLanguage();
  return <History title={t('dashboard.donationHistory')} items={donations.map((d) => `${d.amount || '-'} · ${d.purpose || '-'} · ${formatSinhalaDate(d.createdAt)}`)} empty={t('video.noVideos')} />;
}

export function History({ title, items, empty }) {
  return <section className="surface rounded-lg p-6"><h2 className="text-2xl font-black text-[var(--theme-primary)]">{title}</h2><div className="mt-4 grid gap-2">{items.map((item) => <p className="rounded-lg bg-[var(--theme-surface)] p-3" key={item}>{item}</p>)}</div>{!items.length && <p className="mt-3 text-[var(--theme-muted)]">{empty}</p>}</section>;
}
