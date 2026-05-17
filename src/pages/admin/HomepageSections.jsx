import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { GripVertical, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { AdminCard, BackToDashboard, PermissionError, Toast, cmsError, emptyToast } from '../../components/admin/adminHelpers.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { db } from '../../firebase.js';
import { mergeHomepageSections } from '../../lib/siteSettings.js';

export default function HomepageSections() {
  const { user } = useAuth();
  const [sections, setSections] = useState(mergeHomepageSections());
  const [toast, setToast] = useState(emptyToast);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [draggedId, setDraggedId] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const snap = await getDoc(doc(db, 'siteSettings', 'homepageSections'));
      setSections(mergeHomepageSections(snap.exists() ? snap.data().sections : []));
    } catch (err) {
      console.error('[HomepageSections] load failed:', err);
      setError(cmsError(err, 'siteSettings/homepageSections'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const patch = (id, field, value) => setSections((current) => current.map((section) => section.id === id ? { ...section, [field]: value } : section));

  const reorder = (sourceId, targetId) => {
    if (!sourceId || sourceId === targetId) return;
    setSections((current) => {
      const next = [...current];
      const from = next.findIndex((item) => item.id === sourceId);
      const to = next.findIndex((item) => item.id === targetId);
      if (from < 0 || to < 0) return current;
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next.map((section, index) => ({ ...section, order: index + 1 }));
    });
    setDraggedId('');
  };

  const save = async () => {
    try {
      await setDoc(doc(db, 'siteSettings', 'homepageSections'), { sections, updatedAt: serverTimestamp(), updatedBy: user?.email || '' }, { merge: true });
      setToast({ type: 'success', message: 'Homepage sections saved' });
    } catch (err) {
      console.error('[HomepageSections] save failed:', err);
      setError(cmsError(err, 'siteSettings/homepageSections'));
      setToast({ type: 'error', message: err.message });
    }
  };

  return (
    <AdminLayout title="Homepage Sections">
      <AdminCard title="Homepage Section Manager" actions={<BackToDashboard />}>
        <Toast toast={toast} />
        <PermissionError error={error} />
        <p className="mb-5 rounded-lg bg-[var(--theme-section)] p-4 text-sm font-semibold text-[var(--theme-muted)]">Drag sections to change homepage order. Disabled sections will be hidden on the public homepage.</p>
        {loading && <p>Loading sections...</p>}
        <div className="grid gap-3">
          {sections.map((section) => (
            <article
              className="surface rounded-lg p-4"
              draggable
              key={section.id}
              onDragStart={() => setDraggedId(section.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => reorder(draggedId, section.id)}
            >
              <div className="grid gap-3 lg:grid-cols-[32px_1fr_160px_1fr_1fr_150px] lg:items-center">
                <GripVertical className="cursor-grab text-[var(--theme-muted)]" size={18} />
                <input className="input" value={section.label} onChange={(event) => patch(section.id, 'label', event.target.value)} />
                <label className="rounded-lg bg-[#fffaf0] p-3 font-bold"><input type="checkbox" checked={Boolean(section.enabled)} onChange={(event) => patch(section.id, 'enabled', event.target.checked)} /> Enabled</label>
                <input className="input" placeholder="Optional section title" value={section.title || ''} onChange={(event) => patch(section.id, 'title', event.target.value)} />
                <input className="input" placeholder="Optional subtitle" value={section.subtitle || ''} onChange={(event) => patch(section.id, 'subtitle', event.target.value)} />
                <select className="input" value={section.layout || 'default'} onChange={(event) => patch(section.id, 'layout', event.target.value)}>
                  <option value="default">Default</option>
                  <option value="compact">Compact</option>
                  <option value="wide">Wide</option>
                  <option value="featured">Featured</option>
                </select>
              </div>
            </article>
          ))}
        </div>
        <button className="btn btn-primary mt-5 w-full sm:w-auto" type="button" onClick={save}><Save size={18} />Save Changes</button>
      </AdminCard>
    </AdminLayout>
  );
}
