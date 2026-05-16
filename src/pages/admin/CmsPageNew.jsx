import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { AdminCard, BackToDashboard, Toast, emptyToast } from '../../components/admin/adminHelpers.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { createPage, emptyPage, slugify } from '../../lib/cms.js';

export default function CmsPageNew() {
  const [form, setForm] = useState(emptyPage);
  const [toast, setToast] = useState(emptyToast);
  const navigate = useNavigate();
  const { user } = useAuth();
  const save = async (event) => {
    event.preventDefault();
    try {
      const nextSlug = slugify(form.slug || form.title);
      if (nextSlug === 'home') {
        setToast({ type: 'error', message: 'The home slug is reserved. Use Homepage Editor for the main homepage.' });
        return;
      }
      await createPage({
        ...form,
        slug: nextSlug,
        status: form.status || (form.published ? 'published' : 'draft'),
        createdBy: user?.email || '',
        sections: form.content ? [] : [],
      });
      setToast({ type: 'success', message: 'Page created' });
      navigate('/admin/pages');
    } catch (error) {
      console.error('[CmsPageNew] save failed:', error);
      setToast({ type: 'error', message: error.message });
    }
  };
  return (
    <AdminLayout title="Create Page">
      <AdminCard title="New CMS Page" actions={<BackToDashboard />}>
        <Toast toast={toast} />
        <form onSubmit={save} className="grid gap-3 md:grid-cols-2">
          <input className="input" required placeholder="Page title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || slugify(e.target.value) })} />
          <input className="input" placeholder="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} />
          <input className="input" placeholder="SEO title" value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} />
          <input className="input" placeholder="Open Graph image URL" value={form.openGraphImageUrl || form.ogImage} onChange={(e) => setForm({ ...form, openGraphImageUrl: e.target.value, ogImage: e.target.value })} />
          <textarea className="input min-h-28 md:col-span-2" placeholder="SEO description" value={form.seoDescription} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })} />
          <textarea className="input min-h-64 md:col-span-2 font-mono text-sm" placeholder="Full page HTML content" value={form.content || ''} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          <label className="grid gap-1 text-sm font-bold text-[var(--theme-muted)]">Status<select className="input" value={form.status || 'draft'} onChange={(e) => setForm({ ...form, status: e.target.value, published: e.target.value === 'published' })}><option value="draft">Draft</option><option value="published">Published</option></select></label>
          <button className="btn btn-primary md:col-span-2">Save page</button>
        </form>
      </AdminCard>
    </AdminLayout>
  );
}
