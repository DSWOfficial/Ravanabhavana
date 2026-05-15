import AdminLayout from '../components/admin/AdminLayout.jsx';
import AdminOverview from '../components/admin/AdminOverview.jsx';
import VideoManager from '../components/admin/VideoManager.jsx';
import SessionManager from '../components/admin/SessionManager.jsx';
import WeeklyScheduleManager from '../components/admin/WeeklyScheduleManager.jsx';
import BannerManager from '../components/admin/BannerManager.jsx';
import UserProgressManager from '../components/admin/UserProgressManager.jsx';
import SiteSettingsManager from '../components/admin/SiteSettingsManager.jsx';
import DonationSettingsManager from '../components/admin/DonationSettingsManager.jsx';

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <AdminOverview />
      <VideoManager />
      <SessionManager />
      <WeeklyScheduleManager />
      <BannerManager />
      <UserProgressManager />
      <SiteSettingsManager />
      <DonationSettingsManager />
    </AdminLayout>
  );
}
