import AdminLayout from '../../components/admin/AdminLayout.jsx';
import BannerManager from '../../components/admin/BannerManager.jsx';
import { BackToDashboard } from '../../components/admin/adminHelpers.jsx';

export default function AdminBanners() {
  return (
    <AdminLayout title="Banners">
      <div className="mb-4 flex justify-end"><BackToDashboard /></div>
      <BannerManager />
    </AdminLayout>
  );
}
