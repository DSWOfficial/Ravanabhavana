import { Edit3, FilePlus2, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { AdminCard, BackToDashboard, confirmDelete, PermissionError, Toast, emptyToast } from '../../components/admin/adminHelpers.jsx';
import { deletePage, listPages, savePage } from '../../lib/cms.js';

export default function CmsPagesList() {
  const [pages, setPages] = useState([]);
  const [toast, setToast] = useState(emptyToast);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const load = () => {
    setLoading(true);
    setLoadError(null);
    return listPages()
      .then(setPages)
      .catch((error) => { setLoadError(error); setToast({ type: 'error', message: error.message }); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);
  const toggle = async (page) => {
    try {
      await savePage(page.id, { status: page.published ? 'draft' : 'published' });
      setToast({ type: 'success', message: 'Page status updated' });
      load();
    } catch (error) {
      console.error('[CmsPagesList] status update failed:', error);
      setToast({ type: 'error', message: error.message });
    }
  };
  const remove = async (page) => {
    if (!confirmDelete(page.title || page.slug)) return;
    try {
      await deletePage(page.id);
      setToast({ type: 'success', message: 'Page deleted' });
      load();
    } catch (error) {
      console.error('[CmsPagesList] delete failed:', error);
      setToast({ type: 'error', message: error.message });
    }
  };
  return (
    <AdminLayout title="Pages">
      <AdminCard title="CMS Pages" actions={<div className="flex flex-wrap gap-2"><BackToDashboard /><Link className="btn btn-primary" to="/admin/pages/new"><FilePlus2 size={18} />New page</Link></div>}>
        <Toast toast={toast} />
        <PermissionError error={loadError} />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead><tr className="border-b text-sm text-[var(--theme-muted)]"><th>Title</th><th>Slug</th><th>Status</th><th>Last updated</th><th>Actions</th></tr></thead>
            <tbody>
              {pages.map((page) => (
                <tr className="border-b border-[color-mix(in_srgb,var(--theme-accent)_18%,transparent)]" key={page.id}>
                  <td className="py-3 font-bold">{page.title}</td>
                  <td>/{page.slug}</td>
                  <td><button className="btn btn-outline" onClick={() => toggle(page)}>{page.published ? 'Published' : 'Draft'}</button></td>
                  <td>{page.updatedAt?.toDate?.().toLocaleString?.() || page.updatedAt?.slice?.(0, 16) || '-'}</td>
                  <td><div className="flex gap-2"><Link className="btn btn-outline" to={`/admin/pages/${page.id}/edit`}><Edit3 size={16} /></Link><button className="btn btn-primary" onClick={() => remove(page)}><Trash2 size={16} /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <p className="py-6 text-[var(--theme-muted)]">Loading pages...</p>}
          {!loading && !loadError && !pages.length && <p className="py-6 text-[var(--theme-muted)]">No pages yet.</p>}
        </div>
      </AdminCard>
    </AdminLayout>
  );
}
