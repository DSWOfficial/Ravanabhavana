import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { AdminCard, Toast, emptyToast } from '../../components/admin/adminHelpers.jsx';
import { createPage, emptyPage, slugify } from '../../lib/cms.js';

export default function CmsPageNew() {
  const [form, setForm] = useState(emptyPage);
  const [toast, setToast] = useState(emptyToast);
  const navigate = useNavigate();
  const save = async (event) => {
    event.preventDefault();
    try {
      const id = await createPage({ ...form, sections: [] });
      navigate(`/admin/pages/${id}/edit`);
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    }
  };
  return (
    <AdminLayout title="Create Page">
      <AdminCard title="New CMS Page">
        <Toast toast={toast} />
        <form onSubmit={save} className="grid gap-3 md:grid-cols-2">
          <input className="input" required placeholder="Page title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || slugify(e.target.value) })} />
          <input className="input" required placeholder="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} />
          <input className="input" placeholder="SEO title" value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} />
          <input className="input" placeholder="Open Graph image URL" value={form.ogImage} onChange={(e) => setForm({ ...form, ogImage: e.target.value })} />
          <textarea className="input min-h-28 md:col-span-2" placeholder="SEO description" value={form.seoDescription} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })} />
          <label className="rounded-lg bg-[var(--theme-surface)] p-3 font-bold"><input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} /> Published</label>
          <button className="btn btn-primary md:col-span-2">Save page</button>
        </form>
      </AdminCard>
    </AdminLayout>
  );
}
