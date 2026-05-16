import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { AdminCard, BackToDashboard, PermissionError, Toast, emptyToast } from '../../components/admin/adminHelpers.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { db } from '../../firebase.js';

const defaults = {
  siteTitle: '',
  canonicalUrl: '',
  openGraphImageUrl: '',
  metaDescription: '',
  publicReadable: true,
};

export default function CmsSeo() {
  const [form, setForm] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [toast, setToast] = useState(emptyToast);
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;
    getDoc(doc(db, 'seo', 'global'))
      .then((snap) => {
        if (mounted && snap.exists()) setForm({ ...defaults, ...snap.data() });
      })
      .catch((error) => {
        console.error('[CmsSeo] load failed:', error);
        if (mounted) {
          setLoadError(error);
          setToast({ type: 'error', message: error.message });
        }
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const save = async (event) => {
    event.preventDefault();
    try {
      await setDoc(doc(db, 'seo', 'global'), { ...form, updatedAt: serverTimestamp(), updatedBy: user?.email || '' }, { merge: true });
      setToast({ type: 'success', message: 'SEO settings saved' });
    } catch (error) {
      console.error('[CmsSeo] save failed:', error);
      setToast({ type: 'error', message: error.message });
    }
  };

  return (
    <AdminLayout title="SEO Settings">
      <AdminCard title="SEO Settings" actions={<BackToDashboard />}>
        <Toast toast={toast} />
        <PermissionError error={loadError} />
        {loading ? <p className="text-[var(--theme-muted)]">Loading SEO settings...</p> : (
          <form onSubmit={save} className="grid gap-3 md:grid-cols-2">
            <input className="input" placeholder="Site title" value={form.siteTitle} onChange={(e) => setForm({ ...form, siteTitle: e.target.value })} />
            <input className="input" placeholder="Canonical URL" value={form.canonicalUrl} onChange={(e) => setForm({ ...form, canonicalUrl: e.target.value })} />
            <input className="input md:col-span-2" placeholder="Open Graph image URL" value={form.openGraphImageUrl} onChange={(e) => setForm({ ...form, openGraphImageUrl: e.target.value })} />
            <textarea className="input min-h-32 md:col-span-2" placeholder="Meta description" value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} />
            <label className="rounded-lg bg-[var(--theme-surface)] p-3 font-bold"><input type="checkbox" checked={form.publicReadable} onChange={(e) => setForm({ ...form, publicReadable: e.target.checked })} /> Public readable</label>
            <button className="btn btn-primary md:col-span-2"><Save size={18} />Save SEO settings</button>
          </form>
        )}
      </AdminCard>
    </AdminLayout>
  );
}
