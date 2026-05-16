import AdminLayout from '../../components/admin/AdminLayout.jsx';
import VideoManager from '../../components/admin/VideoManager.jsx';
import { BackToDashboard } from '../../components/admin/adminHelpers.jsx';

export default function AdminVideos() {
  return (
    <AdminLayout title="Videos">
      <div className="mb-4 flex justify-end"><BackToDashboard /></div>
      <VideoManager />
    </AdminLayout>
  );
}
