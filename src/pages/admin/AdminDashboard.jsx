import { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import AdminOverview from '../../components/admin/AdminOverview.jsx';
import VideoManager from '../../components/admin/VideoManager.jsx';
import PlaylistManager from '../../components/admin/PlaylistManager.jsx';
import SessionManager from '../../components/admin/SessionManager.jsx';
import WeeklyScheduleManager from '../../components/admin/WeeklyScheduleManager.jsx';
import BannerManager from '../../components/admin/BannerManager.jsx';
import UserProgressManager from '../../components/admin/UserProgressManager.jsx';
import DonationSubmissionsManager from '../../components/admin/DonationSubmissionsManager.jsx';
import SiteSettingsManager from '../../components/admin/SiteSettingsManager.jsx';
import DonationSettingsManager from '../../components/admin/DonationSettingsManager.jsx';
import PublicPreview from '../../components/admin/PublicPreview.jsx';

const pageMap = {
  overview: ['Overview', AdminOverview],
  playlists: ['Playlists', PlaylistManager],
  videos: ['Videos', VideoManager],
  sessions: ['Zoom Sessions', SessionManager],
  schedule: ['Weekly Schedule', WeeklyScheduleManager],
  banners: ['Banners', BannerManager],
  users: ['Users', UserProgressManager],
  donations: ['Donations', DonationSubmissionsManager],
  site: ['Site Settings', SiteSettingsManager],
  donationSettings: ['Donation Settings', DonationSettingsManager],
  preview: ['Public Preview', PublicPreview],
};

export default function AdminDashboard() {
  const [activePage, setActivePage] = useState('overview');
  const [title, Component] = pageMap[activePage];
  return (
    <AdminLayout activePage={activePage} setActivePage={setActivePage} title={title}>
      <div className="admin-fade">
        <Component setActivePage={setActivePage} />
      </div>
    </AdminLayout>
  );
}
