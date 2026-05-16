import { FilePlus2, Images, Link as LinkIcon, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { AdminCard } from '../../components/admin/adminHelpers.jsx';
import { listPages } from '../../lib/cms.js';

export default function AdminCmsDashboard() {
  const [pages, setPages] = useState([]);
  useEffect(() => { listPages().then(setPages).catch(console.error); }, []);
  const stats = useMemo(() => {
    const published = pages.filter((page) => page.published).length;
    return [
      ['Total pages', pages.length],
      ['Published pages', published],
      ['Draft pages', pages.length - published],
      ['Recent updates', pages.slice(0, 5).length],
    ];
  }, [pages]);
  const actions = [
    ['Create new page', '/admin/pages/new', FilePlus2],
    ['Edit homepage', '/admin/pages/home/edit', FilePlus2],
    ['Manage gallery', '/admin/media', Images],
    ['Manage navigation', '/admin/navigation', LinkIcon],
    ['SEO settings', '/admin/pages/home/edit', Search],
  ];
  return (
    <AdminLayout title="CMS Dashboard">
      <div className="grid gap-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(([label, value]) => <article className="surface interactive-card rounded-lg p-5" key={label}><p className="text-sm font-bold text-[var(--theme-muted)]">{label}</p><b className="mt-2 block text-4xl text-[var(--theme-primary)]">{value}</b></article>)}
        </div>
        <AdminCard title="Quick Actions">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {actions.map(([label, to, Icon]) => <Link className="btn btn-outline justify-start" to={to} key={label}><Icon size={18} />{label}</Link>)}
          </div>
        </AdminCard>
        <AdminCard title="Recent Updates">
          <div className="grid gap-2">
            {pages.slice(0, 5).map((page) => <Link className="rounded-lg bg-[var(--theme-surface)] p-3 font-bold text-[var(--theme-primary)]" to={`/admin/pages/${page.id}/edit`} key={page.id}>{page.title || page.slug}<span className="ml-2 text-sm text-[var(--theme-muted)]">{page.published ? 'Published' : 'Draft'}</span></Link>)}
            {!pages.length && <p className="text-[var(--theme-muted)]">No CMS pages yet.</p>}
          </div>
        </AdminCard>
      </div>
    </AdminLayout>
  );
}
