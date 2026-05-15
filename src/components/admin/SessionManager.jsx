import { Edit3, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { firebaseData } from '../../lib/firebaseData.js';
import { calculateSessionExpiry, isSessionExpired } from '../../utils/dateTime.js';
import { AdminCard, confirmDelete, emptyToast, fetchTable, StatusBadge, Toast } from './adminHelpers.jsx';

const empty = { title: '', zoom_url: '', session_date: '', start_time: '20:00', end_time: '20:40', description: '', is_active: true };

export default function SessionManager() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState(emptyToast);
  const load = async () => setItems(await fetchTable('sessions'));
  useEffect(() => { load().catch((error) => setToast({ message: error.message, type: 'error' })); }, []);

  const save = async (event) => {
    event.preventDefault();
    if (!form.zoom_url.startsWith('http')) return setToast({ message: 'Invalid Zoom URL', type: 'error' });
    const payload = { ...form, expires_at: calculateSessionExpiry(form.session_date, form.end_time).toISOString(), updated_at: new Date().toISOString() };
    try {
      if (editingId) await firebaseData.from('sessions').update(payload).eq('id', editingId).throwOnError();
      else await firebaseData.from('sessions').insert(payload).throwOnError();
      setToast({ message: 'Session saved', type: 'success' });
      setForm(empty); setEditingId(null); await load();
    } catch (error) { setToast({ message: error.message, type: 'error' }); }
  };
  const remove = async (item) => { if (confirmDelete(item.title)) { await firebaseData.from('sessions').delete().eq('id', item.id); await load(); } };
  const toggle = async (item) => { await firebaseData.from('sessions').update({ is_active: !item.is_active }).eq('id', item.id); await load(); };

  return (
    <AdminCard title="Zoom Session Manager">
      <Toast toast={toast} />
      <form onSubmit={save} className="mt-4 grid gap-3 md:grid-cols-2">
        {['title', 'zoom_url'].map((field) => <input key={field} className="input" required placeholder={field} value={form[field] || ''} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />)}
        <input className="input" type="date" required value={form.session_date || ''} onChange={(e) => setForm({ ...form, session_date: e.target.value })} />
        <input className="input" type="time" required value={form.start_time || ''} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
        <input className="input" type="time" required value={form.end_time || ''} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
        <label className="rounded-lg bg-[#fffaf0] p-3 font-bold"><input type="checkbox" checked={Boolean(form.is_active)} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
        <textarea className="input min-h-24 md:col-span-2" placeholder="Sinhala description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <button className="btn btn-primary md:col-span-2">{editingId ? 'Update session' : 'Add session'}</button>
      </form>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left"><thead><tr className="border-b text-sm text-[#6f4a31]"><th>Title</th><th>Date</th><th>Time</th><th>Status</th><th>Expires at</th><th>Actions</th></tr></thead>
          <tbody>{items.map((item) => <tr key={item.id} className="border-b border-[#b88934]/15"><td className="py-3 font-bold">{item.title}</td><td>{item.session_date}</td><td>{item.start_time} - {item.end_time}</td><td className="flex gap-2 py-3"><StatusBadge active={item.is_active} />{isSessionExpired(item.expires_at) && <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">Expired</span>}</td><td>{item.expires_at?.slice(0, 16).replace('T', ' ')}</td><td><div className="flex gap-2"><button className="btn btn-outline" onClick={() => { setForm(item); setEditingId(item.id); }}><Edit3 size={16} /></button><button className="btn btn-outline" onClick={() => toggle(item)}>Enable</button><button className="btn btn-primary" onClick={() => remove(item)}><Trash2 size={16} /></button></div></td></tr>)}</tbody></table>
      </div>
    </AdminCard>
  );
}
