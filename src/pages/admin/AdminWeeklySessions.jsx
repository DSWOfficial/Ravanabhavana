import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Edit3, ImageIcon, Save, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { AdminCard, BackToDashboard, PermissionError, Toast, cmsError, confirmDelete, emptyToast } from '../../components/admin/adminHelpers.jsx';
import NextWeeklySession from '../../components/public/NextWeeklySession.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { db } from '../../firebase.js';

const empty = { title: '', topic: '', description: '', hostName: 'Ravana Bhavana', sessionDateTime: '', joinUrl: '', whatsappReminderText: 'I want to get a reminder for the next Ravana Bhavana weekly session.', imageUrl: '', isActive: true, isPublished: true };

function dateValue(value) {
  if (!value) return '';
  if (typeof value.toDate === 'function') return value.toDate().toISOString().slice(0, 16);
  if (typeof value === 'string') return value.slice(0, 16);
  return '';
}

export default function AdminWeeklySessions() {
  const [items, setItems] = useState([]);
  const [media, setMedia] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState(emptyToast);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const sorted = useMemo(() => [...items].sort((a, b) => (a.sessionDateTime?.toMillis?.() || 0) - (b.sessionDateTime?.toMillis?.() || 0)), [items]);

  const load = async () => {
    try {
      const [sessionSnap, mediaSnap] = await Promise.all([
        getDocs(query(collection(db, 'weeklySessions'), orderBy('sessionDateTime', 'asc'))),
        getDocs(query(collection(db, 'media'), orderBy('createdAt', 'desc'))),
      ]);
      setItems(sessionSnap.docs.map((item) => ({ id: item.id, ...item.data() })));
      setMedia(mediaSnap.docs.map((item) => ({ id: item.id, ...item.data() })));
    } catch (err) {
      const next = cmsError(err, 'weeklySessions/media');
      setError(next);
      setToast({ type: 'error', message: next.message });
    }
  };

  useEffect(() => { load(); }, []);

  const save = async (event) => {
    event.preventDefault();
    try {
      const payload = { ...form, sessionDateTime: form.sessionDateTime ? new Date(form.sessionDateTime) : null, updatedAt: serverTimestamp() };
      if (editingId) await updateDoc(doc(db, 'weeklySessions', editingId), payload);
      else await addDoc(collection(db, 'weeklySessions'), { ...payload, createdAt: serverTimestamp(), createdBy: user?.email || '' });
      setToast({ type: 'success', message: 'Weekly session saved' });
      setForm(empty);
      setEditingId(null);
      await load();
    } catch (err) {
      const next = cmsError(err, editingId ? `weeklySessions/${editingId}` : 'weeklySessions');
      setError(next);
      setToast({ type: 'error', message: next.message });
    }
  };

  const edit = (item) => {
    setEditingId(item.id);
    setForm({ ...empty, ...item, sessionDateTime: dateValue(item.sessionDateTime) });
  };

  const remove = async (item) => {
    if (!confirmDelete(item.title)) return;
    await deleteDoc(doc(db, 'weeklySessions', item.id));
    await load();
  };

  return (
    <AdminLayout title="Weekly Sessions">
      <div className="grid gap-6">
        <AdminCard title="Weekly Sessions" actions={<BackToDashboard />}>
          <Toast toast={toast} />
          <PermissionError error={error} />
          <form onSubmit={save} className="grid gap-3 md:grid-cols-2">
            <input className="input" required placeholder="Session title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input className="input" placeholder="Topic" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
            <input className="input" placeholder="Host name" value={form.hostName} onChange={(e) => setForm({ ...form, hostName: e.target.value })} />
            <input className="input" required type="datetime-local" value={form.sessionDateTime} onChange={(e) => setForm({ ...form, sessionDateTime: e.target.value })} />
            <input className="input" placeholder="Join URL" value={form.joinUrl} onChange={(e) => setForm({ ...form, joinUrl: e.target.value })} />
            <input className="input" placeholder="Image URL" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
            <textarea className="input min-h-28 md:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <textarea className="input min-h-20 md:col-span-2" placeholder="WhatsApp reminder text" value={form.whatsappReminderText} onChange={(e) => setForm({ ...form, whatsappReminderText: e.target.value })} />
            <label className="font-bold"><input type="checkbox" checked={Boolean(form.isActive)} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
            <label className="font-bold"><input type="checkbox" checked={Boolean(form.isPublished)} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} /> Published</label>
            {form.imageUrl && <img src={form.imageUrl} alt="" className="max-h-52 rounded-lg object-cover md:col-span-2" />}
            <div className="md:col-span-2 rounded-lg border border-[color-mix(in_srgb,var(--theme-accent)_25%,transparent)] p-3">
              <b className="flex items-center gap-2 text-[var(--theme-primary)]"><ImageIcon size={17} />Choose from Media Library</b>
              <div className="mt-3 grid max-h-52 gap-2 overflow-auto sm:grid-cols-2 lg:grid-cols-3">{media.map((item) => <button className="flex items-center gap-3 rounded-lg p-2 text-left hover:bg-[var(--theme-section)]" type="button" key={item.id} onClick={() => setForm({ ...form, imageUrl: item.url })}><img src={item.url} alt="" className="h-12 w-16 rounded object-cover" /><span className="truncate text-sm">{item.filename || item.url}</span></button>)}</div>
            </div>
            <button className="btn btn-primary md:col-span-2"><Save size={18} />{editingId ? 'Update session' : 'Create session'}</button>
          </form>
        </AdminCard>
        <AdminCard title="Preview"><NextWeeklySession /></AdminCard>
        <AdminCard title="Existing Sessions">
          <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left"><thead><tr className="border-b text-sm text-[var(--theme-muted)]"><th>Title</th><th>Date</th><th>Published</th><th>Active</th><th>Actions</th></tr></thead><tbody>{sorted.map((item) => <tr className="border-b" key={item.id}><td className="py-3 font-bold">{item.title}</td><td>{dateValue(item.sessionDateTime)}</td><td>{item.isPublished ? 'Yes' : 'No'}</td><td>{item.isActive ? 'Yes' : 'No'}</td><td><div className="flex gap-2"><button className="btn btn-outline" onClick={() => edit(item)}><Edit3 size={16} /></button><button className="btn btn-primary" onClick={() => remove(item)}><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div>
        </AdminCard>
      </div>
    </AdminLayout>
  );
}
