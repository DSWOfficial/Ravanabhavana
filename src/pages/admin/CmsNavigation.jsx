import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { AdminCard, Toast, emptyToast } from '../../components/admin/adminHelpers.jsx';
import { deleteNavigationItem, listNavigation, saveNavigationItem } from '../../lib/cms.js';

const emptyItem = { label: '', url: '', order: 0, visible: true };

export default function CmsNavigation() {
  const [items, setItems] = useState([]);
  const [toast, setToast] = useState(emptyToast);
  const load = () => listNavigation().then(setItems).catch((error) => setToast({ type: 'error', message: error.message }));
  useEffect(load, []);
  const update = (index, patch) => setItems(items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  const saveAll = async () => {
    try {
      await Promise.all(items.map(saveNavigationItem));
      setToast({ type: 'success', message: 'Navigation saved' });
      load();
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    }
  };
  const remove = async (item, index) => {
    if (item.id) await deleteNavigationItem(item.id);
    setItems(items.filter((_, itemIndex) => itemIndex !== index));
  };
  return (
    <AdminLayout title="Navigation">
      <AdminCard title="Navbar Links" actions={<button className="btn btn-primary" onClick={() => setItems([...items, { ...emptyItem, order: items.length + 1 }])}><Plus size={18} />Add link</button>}>
        <Toast toast={toast} />
        <div className="grid gap-3">
          {items.map((item, index) => (
            <article className="surface grid gap-3 rounded-lg p-4 md:grid-cols-[1fr_1.2fr_0.5fr_auto_auto]" key={item.id || index}>
              <input className="input" placeholder="Label" value={item.label} onChange={(e) => update(index, { label: e.target.value })} />
              <input className="input" placeholder="URL" value={item.url} onChange={(e) => update(index, { url: e.target.value })} />
              <input className="input" type="number" placeholder="Order" value={item.order} onChange={(e) => update(index, { order: e.target.value })} />
              <label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={Boolean(item.visible)} onChange={(e) => update(index, { visible: e.target.checked })} />Visible</label>
              <button className="btn btn-outline" onClick={() => remove(item, index)}><Trash2 size={16} /></button>
            </article>
          ))}
          {!items.length && <p className="text-[var(--theme-muted)]">No navigation links yet. The public site will use fallback links until you add links here.</p>}
        </div>
        <button className="btn btn-primary mt-5" onClick={saveAll}>Save navigation</button>
      </AdminCard>
    </AdminLayout>
  );
}
