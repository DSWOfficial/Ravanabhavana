import { getUserBadges } from '../../utils/badges.js';
import { useUserDashboardData } from './useUserDashboardData.js';

export default function UserBadges() {
  const { progress, sessions, donations } = useUserDashboardData();
  const badges = getUserBadges(progress, sessions, donations);
  return (
    <section className="surface rounded-lg p-6">
      <h2 className="text-2xl font-black">Badges</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {badges.map((badge) => <div className={`interactive-card rounded-lg p-4 font-black ${badge.unlocked ? 'bg-[var(--theme-accent)] text-[var(--theme-hero)]' : 'bg-[var(--theme-surface)] text-[var(--theme-muted)]'}`} key={badge.name}>{badge.label}<span className="block text-xs">{badge.name}</span></div>)}
      </div>
    </section>
  );
}
