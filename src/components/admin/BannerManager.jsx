import { Edit3, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { firebaseData } from '../../lib/firebaseData.js';
import { AdminCard, confirmDelete, emptyToast, fetchTable, StatusBadge, Toast } from './adminHelpers.jsx';

const empty = { title: '', message: '', type: 'Notice', button_text: '', button_url: '', start_date: '', end_date: '', is_active: true };
const types = ['Notice', 'New Video', 'Weekly Session', 'Donation', 'Emergency Update'];

export default function BannerManager() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState(emptyToast);
  const load = async () => setItems(await fetchTable('banners'));
  useEffect(() => { load().catch((error) => setToast({ message: error.message, type: 'error' })); }, []);
  const save = async (event) => {
    event.preventDefault();
    const payload = { ...form, updated_at: new Date().toISOString() };
    const { error } = editingId ? await firebaseData.from('banners').update(payload).eq('id', editingId) : await firebaseData.from('banners').insert(payload);
    setToast(error ? { message: error.message, type: 'error' } : { message: 'Banner saved', type: 'success' });
    if (!error) { setForm(empty); setEditingId(null); await load(); }
  };
  const remove = async (item) => { if (confirmDelete(item.title)) { await firebaseData.from('banners').delete().eq('id', item.id); await load(); } };
  return (
    <AdminCard title="Banner Manager">
      <Toast toast={toast} />
      <form onSubmit={save} className="mt-4 grid gap-3 md:grid-cols-2">
        <input className="input" required placeholder="Title" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <select className="input" value={form.type || 'Notice'} onChange={(e) => setForm({ ...form, type: e.target.value })}>{types.map((type) => <option key={type}>{type}</option>)}</select>
        <input className="input" placeholder="Button text" value={form.button_text || ''} onChange={(e) => setForm({ ...form, button_text: e.target.value })} />
        <input className="input" placeholder="Button URL" value={form.button_url || ''} onChange={(e) => setForm({ ...form, button_url: e.target.value })} />
        <input className="input" type="date" value={form.start_date || ''} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
        <input className="input" type="date" value={form.end_date || ''} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
        <label className="rounded-lg bg-[#fffaf0] p-3 font-bold"><input type="checkbox" checked={Boolean(form.is_active)} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
        <textarea className="input min-h-24 md:col-span-2" required placeholder="Message" value={form.message || ''} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        <button className="btn btn-primary md:col-span-2">{editingId ? 'Update banner' : 'Add banner'}</button>
      </form>
      <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead><tr className="border-b text-sm text-[#6f4a31]"><th>Title</th><th>Type</th><th>Status</th><th>Start</th><th>End</th><th>Actions</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-b border-[#b88934]/15"><td className="py-3 font-bold">{item.title}</td><td>{item.type}</td><td><StatusBadge active={item.is_active} /></td><td>{item.start_date}</td><td>{item.end_date}</td><td><div className="flex gap-2"><button className="btn btn-outline" onClick={() => { setForm(item); setEditingId(item.id); }}><Edit3 size={16} /></button><button className="btn btn-primary" onClick={() => remove(item)}><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div>
    </AdminCard>
  );
}
