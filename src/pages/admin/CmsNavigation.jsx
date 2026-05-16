import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { AdminCard, BackToDashboard, PermissionError, Toast, emptyToast } from '../../components/admin/adminHelpers.jsx';
import { deleteNavigationItem, listNavigation, saveNavigationItem } from '../../lib/cms.js';

const emptyItem = { label: '', url: '', order: 0, visible: true };

export default function CmsNavigation() {
  const [items, setItems] = useState([]);
  const [toast, setToast] = useState(emptyToast);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const load = () => {
    setLoading(true);
    setLoadError(null);
    return listNavigation({ includeHidden: true })
      .then(setItems)
      .catch((error) => { console.error('[CmsNavigation] load failed:', error); setLoadError(error); setToast({ type: 'error', message: error.message }); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);
  const update = (index, patch) => setItems(items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  const move = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next.map((item, itemIndex) => ({ ...item, order: itemIndex + 1 })));
  };
  const saveAll = async () => {
    try {
      await Promise.all(items.map((item, index) => saveNavigationItem({ ...item, order: Number(item.order || index + 1) })));
      setToast({ type: 'success', message: 'Navigation saved' });
      load();
    } catch (error) {
      console.error('[CmsNavigation] save failed:', error);
      setToast({ type: 'error', message: error.message });
    }
  };
  const remove = async (item, index) => {
    try {
      if (item.id) await deleteNavigationItem(item.id);
      setItems(items.filter((_, itemIndex) => itemIndex !== index));
      setToast({ type: 'success', message: 'Navigation link deleted' });
    } catch (error) {
      console.error('[CmsNavigation] delete failed:', error);
      setToast({ type: 'error', message: error.message });
    }
  };
  return (
    <AdminLayout title="Navigation">
      <AdminCard title="Navbar Links" actions={<div className="flex flex-wrap gap-2"><BackToDashboard /><button className="btn btn-primary" onClick={() => setItems([...items, { ...emptyItem, order: items.length + 1 }])}><Plus size={18} />Add link</button></div>}>
        <Toast toast={toast} />
        <PermissionError error={loadError} />
        <div className="grid gap-3">
          {items.map((item, index) => (
            <article className="surface grid gap-3 rounded-lg p-4 md:grid-cols-[1fr_1.2fr_0.5fr_auto_auto_auto]" key={item.id || index}>
              <input className="input" placeholder="Label" value={item.label} onChange={(e) => update(index, { label: e.target.value })} />
              <input className="input" placeholder="URL" value={item.url} onChange={(e) => update(index, { url: e.target.value })} />
              <input className="input" type="number" placeholder="Order" value={item.order} onChange={(e) => update(index, { order: e.target.value })} />
              <label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={Boolean(item.visible)} onChange={(e) => update(index, { visible: e.target.checked })} />Visible</label>
              <div className="flex gap-2"><button className="btn btn-outline" type="button" onClick={() => move(index, -1)}><ArrowUp size={16} /></button><button className="btn btn-outline" type="button" onClick={() => move(index, 1)}><ArrowDown size={16} /></button></div>
              <button className="btn btn-outline" type="button" onClick={() => remove(item, index)}><Trash2 size={16} /></button>
            </article>
          ))}
          {loading && <p className="text-[var(--theme-muted)]">Loading navigation...</p>}
          {!loading && !loadError && !items.length && <p className="text-[var(--theme-muted)]">No navigation links yet. The public site will use fallback links until you add links here.</p>}
        </div>
        <button className="btn btn-primary mt-5" onClick={saveAll}>Save navigation</button>
      </AdminCard>
    </AdminLayout>
  );
}
