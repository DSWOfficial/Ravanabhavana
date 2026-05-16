import { Copy, Eye, GripVertical, Plus, Save, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { AdminCard, BackToDashboard, PermissionError, Toast, emptyToast } from '../../components/admin/adminHelpers.jsx';
import PageRenderer from '../../components/public/PageRenderer.jsx';
import { createSection, getPage, getPageBySlug, savePage, sectionTypes, slugify } from '../../lib/cms.js';

function TextInput({ label, value, onChange, textarea = false }) {
  const Field = textarea ? 'textarea' : 'input';
  return <label className="grid gap-1 text-sm font-bold text-[var(--theme-muted)]">{label}<Field className={`input ${textarea ? 'min-h-24' : ''}`} value={value || ''} onChange={(e) => onChange(e.target.value)} /></label>;
}

function ListEditor({ label, items = [], emptyItem, renderItem, onChange }) {
  const update = (index, patch) => onChange(items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  const remove = (index) => onChange(items.filter((_, itemIndex) => itemIndex !== index));
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <b className="text-[var(--theme-primary)]">{label}</b>
        <button type="button" className="btn btn-outline" onClick={() => onChange([...items, emptyItem])}><Plus size={16} />Add</button>
      </div>
      {items.map((item, index) => <div className="rounded-lg border border-[color-mix(in_srgb,var(--theme-accent)_25%,transparent)] p-3" key={index}>{renderItem(item, (patch) => update(index, patch))}<button type="button" className="btn btn-outline mt-3" onClick={() => remove(index)}><Trash2 size={16} />Remove</button></div>)}
    </div>
  );
}

function SectionFields({ section, onChange }) {
  const set = (patch) => onChange({ ...section, ...patch });
  if (section.type === 'html') return <div className="md:col-span-2"><TextInput label="HTML" textarea value={section.html} onChange={(v) => set({ html: v })} /></div>;
  if (section.type === 'hero') return <><TextInput label="Eyebrow" value={section.eyebrow} onChange={(v) => set({ eyebrow: v })} /><TextInput label="Title" value={section.title} onChange={(v) => set({ title: v })} /><TextInput label="Subtitle" value={section.subtitle} onChange={(v) => set({ subtitle: v })} /><TextInput label="Body" textarea value={section.body} onChange={(v) => set({ body: v })} /><TextInput label="Image URL" value={section.image} onChange={(v) => set({ image: v })} /><TextInput label="Primary button label" value={section.primaryLabel} onChange={(v) => set({ primaryLabel: v })} /><TextInput label="Primary button URL" value={section.primaryUrl} onChange={(v) => set({ primaryUrl: v })} /><TextInput label="Secondary button label" value={section.secondaryLabel} onChange={(v) => set({ secondaryLabel: v })} /><TextInput label="Secondary button URL" value={section.secondaryUrl} onChange={(v) => set({ secondaryUrl: v })} /></>;
  if (section.type === 'text') return <><TextInput label="Title" value={section.title} onChange={(v) => set({ title: v })} /><TextInput label="Body" textarea value={section.body} onChange={(v) => set({ body: v })} /></>;
  if (section.type === 'textImage') return <><TextInput label="Title" value={section.title} onChange={(v) => set({ title: v })} /><TextInput label="Body" textarea value={section.body} onChange={(v) => set({ body: v })} /><TextInput label="Image URL" value={section.image} onChange={(v) => set({ image: v })} /><TextInput label="Image alt text" value={section.imageAlt} onChange={(v) => set({ imageAlt: v })} /><label className="grid gap-1 text-sm font-bold text-[var(--theme-muted)]">Image position<select className="input" value={section.imagePosition || 'right'} onChange={(e) => set({ imagePosition: e.target.value })}><option value="right">Right</option><option value="left">Left</option></select></label></>;
  if (section.type === 'gallery') return <><TextInput label="Title" value={section.title} onChange={(v) => set({ title: v })} /><ListEditor label="Images" items={section.images || []} emptyItem={{ url: '', alt: '' }} onChange={(images) => set({ images })} renderItem={(image, update) => <div className="grid gap-2 md:grid-cols-2"><TextInput label="Image URL" value={image.url} onChange={(v) => update({ url: v })} /><TextInput label="Alt text" value={image.alt} onChange={(v) => update({ alt: v })} /></div>} /></>;
  if (section.type === 'video') return <><TextInput label="Title" value={section.title} onChange={(v) => set({ title: v })} /><TextInput label="Body" textarea value={section.body} onChange={(v) => set({ body: v })} /><TextInput label="Video URL" value={section.videoUrl} onChange={(v) => set({ videoUrl: v })} /></>;
  if (section.type === 'quote') return <><TextInput label="Quote" textarea value={section.quote} onChange={(v) => set({ quote: v })} /><TextInput label="Author" value={section.author} onChange={(v) => set({ author: v })} /></>;
  if (section.type === 'cards') return <><TextInput label="Title" value={section.title} onChange={(v) => set({ title: v })} /><ListEditor label="Cards" items={section.cards || []} emptyItem={{ title: '', body: '', image: '', url: '' }} onChange={(cards) => set({ cards })} renderItem={(card, update) => <div className="grid gap-2 md:grid-cols-2"><TextInput label="Title" value={card.title} onChange={(v) => update({ title: v })} /><TextInput label="Image URL" value={card.image} onChange={(v) => update({ image: v })} /><TextInput label="URL" value={card.url} onChange={(v) => update({ url: v })} /><TextInput label="Body" textarea value={card.body} onChange={(v) => update({ body: v })} /></div>} /></>;
  if (section.type === 'faq') return <><TextInput label="Title" value={section.title} onChange={(v) => set({ title: v })} /><ListEditor label="Questions" items={section.items || []} emptyItem={{ question: '', answer: '' }} onChange={(items) => set({ items })} renderItem={(item, update) => <div className="grid gap-2"><TextInput label="Question" value={item.question} onChange={(v) => update({ question: v })} /><TextInput label="Answer" textarea value={item.answer} onChange={(v) => update({ answer: v })} /></div>} /></>;
  if (section.type === 'cta') return <><TextInput label="Title" value={section.title} onChange={(v) => set({ title: v })} /><TextInput label="Body" textarea value={section.body} onChange={(v) => set({ body: v })} /><TextInput label="Button label" value={section.buttonLabel} onChange={(v) => set({ buttonLabel: v })} /><TextInput label="Button URL" value={section.buttonUrl} onChange={(v) => set({ buttonUrl: v })} /></>;
  if (section.type === 'contact') return <><TextInput label="Title" value={section.title} onChange={(v) => set({ title: v })} /><TextInput label="Body" textarea value={section.body} onChange={(v) => set({ body: v })} /><TextInput label="Phone" value={section.phone} onChange={(v) => set({ phone: v })} /><TextInput label="Email" value={section.email} onChange={(v) => set({ email: v })} /><TextInput label="WhatsApp number" value={section.whatsapp} onChange={(v) => set({ whatsapp: v })} /></>;
  return null;
}

export default function CmsPageEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(null);
  const [preview, setPreview] = useState(false);
  const [toast, setToast] = useState(emptyToast);
  const [loadError, setLoadError] = useState(null);
  const [newType, setNewType] = useState('text');

  useEffect(() => {
    let mounted = true;
    async function load() {
      let found = await getPage(id);
      if (!found) found = await getPageBySlug(id);
      if (id === 'home') navigate('/admin/homepage', { replace: true });
      if (mounted) setPage(found);
    }
    load().catch((error) => { setLoadError(error); setToast({ type: 'error', message: error.message }); });
    return () => { mounted = false; };
  }, [id, navigate]);

  const updateSection = (index, section) => setPage({ ...page, sections: page.sections.map((item, itemIndex) => (itemIndex === index ? section : item)) });
  const move = (index, direction) => {
    const next = [...page.sections];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setPage({ ...page, sections: next });
  };
  const duplicate = (index) => setPage({ ...page, sections: [...page.sections.slice(0, index + 1), { ...page.sections[index], id: crypto.randomUUID() }, ...page.sections.slice(index + 1)] });
  const remove = (index) => setPage({ ...page, sections: page.sections.filter((_, itemIndex) => itemIndex !== index) });
  const add = () => setPage({ ...page, sections: [...page.sections, createSection(newType)] });
  const save = async () => {
    try {
      await savePage(page.id, { ...page, slug: slugify(page.slug || page.title) });
      setToast({ type: 'success', message: 'Page saved' });
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    }
  };

  if (!page) return <AdminLayout title="Edit Page"><AdminCard title="Loading" actions={<BackToDashboard />}><Toast toast={toast} /><PermissionError error={loadError} /><p>Loading page...</p></AdminCard></AdminLayout>;

  return (
    <AdminLayout title={`Edit: ${page.title || page.slug}`}>
      <div className="grid gap-6">
        <AdminCard title="Page Settings" actions={<div className="flex flex-wrap gap-2"><BackToDashboard /><button className="btn btn-outline" onClick={() => setPreview(!preview)}><Eye size={18} />{preview ? 'Edit mode' : 'Preview'}</button><button className="btn btn-primary" onClick={save}><Save size={18} />Save</button></div>}>
          <Toast toast={toast} />
          {preview ? <div className="overflow-hidden rounded-lg border"><PageRenderer page={page} /></div> : (
            <div className="grid gap-3 md:grid-cols-2">
              <TextInput label="Page title" value={page.title} onChange={(v) => setPage({ ...page, title: v })} />
              <TextInput label="Slug" value={page.slug} onChange={(v) => setPage({ ...page, slug: slugify(v) })} />
              <TextInput label="SEO title" value={page.seoTitle} onChange={(v) => setPage({ ...page, seoTitle: v })} />
              <TextInput label="Open Graph image URL" value={page.openGraphImageUrl || page.ogImage} onChange={(v) => setPage({ ...page, openGraphImageUrl: v, ogImage: v })} />
              <TextInput label="SEO description" textarea value={page.seoDescription} onChange={(v) => setPage({ ...page, seoDescription: v })} />
              <label className="grid gap-1 text-sm font-bold text-[var(--theme-muted)]">Status<select className="input" value={page.status || (page.published ? 'published' : 'draft')} onChange={(e) => setPage({ ...page, status: e.target.value, published: e.target.value === 'published' })}><option value="draft">Draft</option><option value="published">Published</option></select></label>
              <TextInput label="Full page HTML content" textarea value={page.content} onChange={(v) => setPage({ ...page, content: v })} />
            </div>
          )}
        </AdminCard>
        {!preview && (
          <AdminCard title="Page Builder" actions={<div className="flex gap-2"><select className="input" value={newType} onChange={(e) => setNewType(e.target.value)}>{sectionTypes.map((type) => <option key={type}>{type}</option>)}</select><button className="btn btn-primary" onClick={add}><Plus size={18} />Add section</button></div>}>
            <div className="grid gap-4">
              {page.sections.map((section, index) => (
                <article className="surface rounded-lg p-4" key={section.id || index}>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <b className="flex items-center gap-2 text-[var(--theme-primary)]"><GripVertical size={18} />{index + 1}. {section.type}</b>
                    <div className="flex flex-wrap gap-2"><button className="btn btn-outline" onClick={() => move(index, -1)}>Up</button><button className="btn btn-outline" onClick={() => move(index, 1)}>Down</button><button className="btn btn-outline" onClick={() => duplicate(index)}><Copy size={16} />Duplicate</button><button className="btn btn-primary" onClick={() => remove(index)}><Trash2 size={16} />Delete</button></div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2"><SectionFields section={section} onChange={(next) => updateSection(index, next)} /></div>
                </article>
              ))}
              {!page.sections.length && <p className="text-[var(--theme-muted)]">No sections yet. Add a section to start building this page.</p>}
            </div>
          </AdminCard>
        )}
      </div>
    </AdminLayout>
  );
}
