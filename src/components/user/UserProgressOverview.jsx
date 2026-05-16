import { useLanguage } from '../../context/LanguageContext.jsx';
import { calculateProgress } from '../../utils/progress.js';
import { useUserDashboardData } from './useUserDashboardData.js';

export default function UserProgressOverview() {
  const { videos, progress } = useUserDashboardData();
  const { t } = useLanguage();
  const completed = progress.filter((p) => p.completed).length;
  const watched = progress.filter((p) => p.watched).length;
  const percent = calculateProgress(completed, videos.length);
  return (
    <section className="surface rounded-lg p-6">
      <h2 className="text-2xl font-black">{t('dashboard.overview')}</h2>
      <p className="mt-2 font-bold text-[var(--theme-muted)]">{t('dashboard.completed')}: {completed}</p>
      <div className="mt-4 h-3 rounded-full bg-[color-mix(in_srgb,var(--theme-accent)_20%,var(--theme-surface))]"><div className="h-3 rounded-full bg-[var(--theme-accent)]" style={{ width: `${percent}%` }} /></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <b>{percent}%</b><b>{t('dashboard.watched')}: {watched}</b><b>{t('dashboard.completed')}: {completed}</b>
      </div>
    </section>
  );
}
