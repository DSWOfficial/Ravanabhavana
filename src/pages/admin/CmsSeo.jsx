import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { AdminCard, BackToDashboard, PermissionError, Toast, cmsError, emptyToast } from '../../components/admin/adminHelpers.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { db } from '../../firebase.js';
import { normalizeSeo } from '../../lib/siteSettings.js';

export default function CmsSeo() {
  const { user } = useAuth();
  const [form, setForm] = useState(normalizeSeo());
  const [toast, setToast] = useState(emptyToast);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'siteSettings', 'seo'));
        if (snap.exists()) setForm(normalizeSeo(snap.data()));
        else {
          const legacy = await getDoc(doc(db, 'seo', 'global'));
          setForm(normalizeSeo(legacy.exists() ? legacy.data() : {}));
        }
      } catch (err) {
        console.error('[CmsSeo] load failed:', err);
        setError(cmsError(err, 'siteSettings/seo'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const patch = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const save = async (event) => {
    event.preventDefault();
    const payload = normalizeSeo(form);
    try {
      await Promise.all([
        setDoc(doc(db, 'siteSettings', 'seo'), { ...payload, updatedAt: serverTimestamp(), updatedBy: user?.email || '' }, { merge: true }),
        setDoc(doc(db, 'seo', 'global'), { ...payload, publicReadable: true, updatedAt: serverTimestamp(), updatedBy: user?.email || '' }, { merge: true }),
      ]);
      setToast({ type: 'success', message: 'SEO settings saved' });
    } catch (err) {
      console.error('[CmsSeo] save failed:', err);
      setError(cmsError(err, 'siteSettings/seo'));
      setToast({ type: 'error', message: err.message });
    }
  };

  return (
    <AdminLayout title="SEO Settings">
      <AdminCard title="SEO Manager" actions={<BackToDashboard />}>
        <Toast toast={toast} />
        <PermissionError error={error} />
        {loading && <p>Loading SEO settings...</p>}
        <form onSubmit={save} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="grid gap-3 md:grid-cols-2">
            <input className="input" placeholder="Site title" value={form.siteTitle} onChange={(event) => patch('siteTitle', event.target.value)} />
            <input className="input" placeholder="Site author" value={form.author} onChange={(event) => patch('author', event.target.value)} />
            <textarea className="input min-h-28 md:col-span-2" placeholder="Default meta description" value={form.metaDescription} onChange={(event) => patch('metaDescription', event.target.value)} />
            <input className="input md:col-span-2" placeholder="Keywords, comma separated" value={Array.isArray(form.keywords) ? form.keywords.join(', ') : form.keywords} onChange={(event) => patch('keywords', event.target.value)} />
            <input className="input" placeholder="Open Graph title" value={form.ogTitle} onChange={(event) => patch('ogTitle', event.target.value)} />
            <input className="input" placeholder="Open Graph image URL" value={form.ogImage} onChange={(event) => patch('ogImage', event.target.value)} />
            <textarea className="input min-h-24 md:col-span-2" placeholder="Open Graph description" value={form.ogDescription} onChange={(event) => patch('ogDescription', event.target.value)} />
            <input className="input" placeholder="Twitter/X preview title" value={form.twitterTitle} onChange={(event) => patch('twitterTitle', event.target.value)} />
            <input className="input" placeholder="Twitter/X image URL" value={form.twitterImage} onChange={(event) => patch('twitterImage', event.target.value)} />
            <textarea className="input min-h-24 md:col-span-2" placeholder="Twitter/X preview description" value={form.twitterDescription} onChange={(event) => patch('twitterDescription', event.target.value)} />
            <input className="input" placeholder="Canonical site URL" value={form.canonicalUrl} onChange={(event) => patch('canonicalUrl', event.target.value)} />
            <input className="input" placeholder="Favicon URL optional" value={form.faviconUrl} onChange={(event) => patch('faviconUrl', event.target.value)} />
            <select className="input" value={form.robots} onChange={(event) => patch('robots', event.target.value)}>
              <option value="index, follow">index, follow</option>
              <option value="noindex, nofollow">noindex, nofollow</option>
            </select>
            <button className="btn btn-primary md:col-span-2"><Save size={18} />Save SEO Settings</button>
          </div>
          <SocialPreview seo={normalizeSeo(form)} />
        </form>
      </AdminCard>
    </AdminLayout>
  );
}

function SocialPreview({ seo }) {
  return (
    <aside className="surface h-fit overflow-hidden rounded-lg">
      {seo.ogImage && <img className="aspect-video w-full object-cover" src={seo.ogImage} alt="" />}
      <div className="p-5">
        <p className="text-xs font-black uppercase text-[var(--theme-muted)]">{seo.canonicalUrl || 'ravana bhavana'}</p>
        <h3 className="mt-2 text-xl font-black text-[var(--theme-primary)]">{seo.ogTitle || seo.siteTitle}</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--theme-muted)]">{seo.ogDescription || seo.metaDescription}</p>
      </div>
    </aside>
  );
}
