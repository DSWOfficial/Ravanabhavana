import AdminLayout from '../../components/admin/AdminLayout.jsx';
import PlaylistManager from '../../components/admin/PlaylistManager.jsx';

export default function AdminPlaylists() {
  return (
    <AdminLayout title="Playlists">
      <PlaylistManager />
    </AdminLayout>
  );
}
