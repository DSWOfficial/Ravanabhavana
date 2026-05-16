import { collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { ImageIcon, Save, Wand2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { AdminCard, BackToDashboard, PermissionError, Toast, cmsError, emptyToast } from '../../components/admin/adminHelpers.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { db } from '../../firebase.js';
import { defaultHomeSections, seedDefaultHomeContent } from '../../lib/homeContent.js';

const sectionIds = ['hero', 'about', 'countdown', 'contact', 'footer'];

function Field({ label, value, onChange, textarea = false }) {
  const Component = textarea ? 'textarea' : 'input';
  return <label className="grid gap-1 text-sm font-bold text-[var(--theme-muted)]">{label}<Component className={`input ${textarea ? 'min-h-28' : ''}`} value={value || ''} onChange={(event) => onChange(event.target.value)} /></label>;
}

function MediaChooser({ media, onSelect }) {
  return (
    <div className="md:col-span-2 rounded-lg border border-[color-mix(in_srgb,var(--theme-accent)_25%,transparent)] p-3">
      <b className="flex items-center gap-2 text-[var(--theme-primary)]"><ImageIcon size={17} />Choose from Media Library</b>
      <div className="mt-3 grid max-h-56 gap-2 overflow-auto sm:grid-cols-2 lg:grid-cols-3">
        {media.map((item) => <button className="flex items-center gap-3 rounded-lg p-2 text-left hover:bg-[var(--theme-section)]" type="button" key={item.id} onClick={() => onSelect(item.url)}><img src={item.url} alt="" className="h-12 w-16 rounded object-cover" /><span className="truncate text-sm">{item.filename || item.url}</span></button>)}
        {!media.length && <p className="text-sm text-[var(--theme-muted)]">Upload images in Media, then choose them here.</p>}
      </div>
    </div>
  );
}

function ImagePreview({ url }) {
  if (!url) return null;
  return <img src={url} alt="" className="max-h-48 w-full rounded-lg object-cover md:col-span-2" />;
}

function SectionForm({ id, value, onChange, media }) {
  const update = (field, next) => onChange({ ...value, [field]: next });
  if (id === 'hero') return <><Field label="Eyebrow" value={value.eyebrow} onChange={(v) => update('eyebrow', v)} /><Field label="Title" value={value.title} onChange={(v) => update('title', v)} /><Field label="Subtitle" value={value.subtitle} onChange={(v) => update('subtitle', v)} /><Field label="Description" textarea value={value.description} onChange={(v) => update('description', v)} /><Field label="Primary button label" value={value.primaryLabel} onChange={(v) => update('primaryLabel', v)} /><Field label="Primary button URL" value={value.primaryUrl} onChange={(v) => update('primaryUrl', v)} /><Field label="Secondary button label" value={value.secondaryLabel} onChange={(v) => update('secondaryLabel', v)} /><Field label="Secondary button URL" value={value.secondaryUrl} onChange={(v) => update('secondaryUrl', v)} /><Field label="Hero image URL" value={value.imageUrl} onChange={(v) => update('imageUrl', v)} /><ImagePreview url={value.imageUrl} /><MediaChooser media={media} onSelect={(url) => update('imageUrl', url)} /></>;
  if (id === 'about') return <><Field label="Eyebrow" value={value.eyebrow} onChange={(v) => update('eyebrow', v)} /><Field label="Heading" value={value.heading} onChange={(v) => update('heading', v)} /><Field label="Subheading" value={value.subheading} onChange={(v) => update('subheading', v)} /><Field label="Image URL" value={value.imageUrl} onChange={(v) => update('imageUrl', v)} /><ImagePreview url={value.imageUrl} /><MediaChooser media={media} onSelect={(url) => update('imageUrl', url)} /><Field label="Description" textarea value={value.description} onChange={(v) => update('description', v)} /><Field label="Feature points, one per line" textarea value={(value.features || []).join('\n')} onChange={(v) => update('features', v.split('\n').map((item) => item.trim()).filter(Boolean))} /></>;
  if (id === 'countdown') return <><Field label="Event title" value={value.title} onChange={(v) => update('title', v)} /><Field label="Event date/time, example 2026-06-01T20:00:00+05:30" value={value.eventDateTime} onChange={(v) => update('eventDateTime', v)} /><Field label="Description" textarea value={value.description} onChange={(v) => update('description', v)} /></>;
  if (id === 'contact') return <><Field label="Heading" value={value.heading} onChange={(v) => update('heading', v)} /><Field label="Phone" value={value.phone} onChange={(v) => update('phone', v)} /><Field label="Email" value={value.email} onChange={(v) => update('email', v)} /><Field label="Address" value={value.address} onChange={(v) => update('address', v)} /><Field label="WhatsApp number" value={value.whatsappNumber} onChange={(v) => update('whatsappNumber', v)} /><Field label="YouTube URL" value={value.youtubeChannelUrl} onChange={(v) => update('youtubeChannelUrl', v)} /><Field label="Facebook URL" value={value.facebookPageUrl} onChange={(v) => update('facebookPageUrl', v)} /><Field label="Contact text" textarea value={value.text} onChange={(v) => update('text', v)} /></>;
  return <><Field label="Logo URL" value={value.logoUrl} onChange={(v) => update('logoUrl', v)} /><ImagePreview url={value.logoUrl} /><MediaChooser media={media} onSelect={(url) => update('logoUrl', url)} /><Field label="Tagline" value={value.tagline} onChange={(v) => update('tagline', v)} /><Field label="Copyright text" value={value.copyrightText} onChange={(v) => update('copyrightText', v)} /></>;
}

export default function HomepageEditor() {
  const [sections, setSections] = useState(defaultHomeSections);
  const [toast, setToast] = useState(emptyToast);
  const [loadError, setLoadError] = useState(null);
  const [media, setMedia] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    Promise.all(sectionIds.map((id) => getDoc(doc(db, 'homeSections', id)).then((snap) => [id, snap.exists() ? snap.data() : defaultHomeSections[id]]).catch((error) => { throw cmsError(error, `homeSections/${id}`); })))
      .then((entries) => setSections(Object.fromEntries(entries)))
      .catch((error) => { console.error('[HomepageEditor] load failed:', error); setLoadError(error); setToast({ type: 'error', message: error.message }); });
    getDocs(query(collection(db, 'media'), orderBy('createdAt', 'desc')))
      .then((snap) => setMedia(snap.docs.map((item) => ({ id: item.id, ...item.data() }))))
      .catch((error) => { const next = cmsError(error, 'media'); console.error('[HomepageEditor] media load failed:', next); setLoadError(next); });
  }, []);

  const saveSection = async (id) => {
    try {
      const imageUrl = sections[id]?.imageUrl || sections[id]?.logoUrl || '';
      if (imageUrl && !/^https?:\/\/.+/i.test(imageUrl) && !imageUrl.startsWith('/')) {
        setToast({ type: 'error', message: `${id}: image URL must be a public URL or local / asset path` });
        return;
      }
      await setDoc(doc(db, 'homeSections', id), { ...sections[id], updatedAt: serverTimestamp(), updatedBy: user?.email || '' }, { merge: true });
      setToast({ type: 'success', message: `${id} saved` });
    } catch (error) {
      const next = cmsError(error, `homeSections/${id}`);
      console.error('[HomepageEditor] save failed:', next);
      setLoadError(next);
      setToast({ type: 'error', message: next.message });
    }
  };

  const seed = async () => {
    try {
      await seedDefaultHomeContent(user?.email || '');
      setSections(defaultHomeSections);
      setToast({ type: 'success', message: 'Default homepage content seeded' });
    } catch (error) {
      console.error('[HomepageEditor] seed failed:', error);
      setLoadError(error);
      setToast({ type: 'error', message: error.message });
    }
  };

  return (
    <AdminLayout title="Homepage CMS">
      <div className="grid gap-6">
        <AdminCard title="Homepage Content" actions={<div className="flex flex-wrap gap-2"><BackToDashboard /><button className="btn btn-primary" onClick={seed}><Wand2 size={18} />Seed default content</button></div>}>
          <Toast toast={toast} />
          <PermissionError error={loadError} />
          <p className="text-[var(--theme-muted)]">This editor controls the real homepage. Extra CMS pages stay separate under Pages.</p>
        </AdminCard>
        {sectionIds.map((id) => (
          <AdminCard key={id} title={`${id[0].toUpperCase()}${id.slice(1)} Section`} actions={<button className="btn btn-primary" onClick={() => saveSection(id)}><Save size={18} />Save</button>}>
            <div className="grid gap-3 md:grid-cols-2"><SectionForm id={id} value={sections[id] || {}} media={media} onChange={(value) => setSections({ ...sections, [id]: value })} /></div>
          </AdminCard>
        ))}
      </div>
    </AdminLayout>
  );
}
