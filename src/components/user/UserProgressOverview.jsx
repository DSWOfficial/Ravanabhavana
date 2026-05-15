import { calculateProgress } from '../../utils/progress.js';
import { useUserDashboardData } from './useUserDashboardData.js';

export default function UserProgressOverview() {
  const { videos, progress } = useUserDashboardData();
  const completed = progress.filter((p) => p.completed).length;
  const watched = progress.filter((p) => p.watched).length;
  const percent = calculateProgress(completed, videos.length);
  return (
    <section className="surface rounded-lg p-6">
      <h2 className="text-2xl font-black">Progress overview</h2>
      <p className="mt-2 font-bold text-[#6f4a31]">ඔබ වීඩියෝ {completed}ක් සම්පූර්ණ කර ඇත</p>
      <div className="mt-4 h-3 rounded-full bg-[#eadfc9]"><div className="h-3 rounded-full bg-[#b88934]" style={{ width: `${percent}%` }} /></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <b>මුළු ප්‍රගතිය: {percent}%</b><b>Watched: {watched}</b><b>Completed: {completed}</b>
      </div>
    </section>
  );
}
