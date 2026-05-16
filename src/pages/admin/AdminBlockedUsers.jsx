import { arrayUnion, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { Edit3, ShieldAlert, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { AdminCard, BackToDashboard, PermissionError, Toast, cmsError, confirmDelete, emptyToast } from '../../components/admin/adminHelpers.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { db } from '../../firebase.js';

const empty = { email: '', type: 'block', reason: '', isActive: true, knownUid: '', knownDeviceIds: '' };

export default function AdminBlockedUsers() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(emptyToast);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const load = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'blockedUsers'), orderBy('createdAt', 'desc')));
      setItems(snap.docs.map((item) => ({ id: item.id, ...item.data() })));
      setError(null);
    } catch (err) {
      const next = cmsError(err, 'blockedUsers');
      setError(next);
      setToast({ type: 'error', message: next.message });
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return items.filter((item) => !term || item.email?.toLowerCase().includes(term) || item.reason?.toLowerCase().includes(term));
  }, [items, search]);

  const save = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        email: form.email.trim().toLowerCase(),
        type: form.type,
        reason: form.reason,
        isActive: Boolean(form.isActive),
        knownUid: form.knownUid || '',
        knownDeviceIds: form.knownDeviceIds.split('\n').map((item) => item.trim()).filter(Boolean),
        updatedAt: serverTimestamp(),
      };
      if (editingId) await updateDoc(doc(db, 'blockedUsers', editingId), payload);
      else await setDoc(doc(db, 'blockedUsers', payload.email), { ...payload, createdAt: serverTimestamp(), createdBy: user?.email || '' }, { merge: true });
      setToast({ type: 'success', message: 'Blocked user saved' });
      setForm(empty);
      setEditingId(null);
      await load();
    } catch (err) {
      const next = cmsError(err, editingId ? `blockedUsers/${editingId}` : 'blockedUsers');
      setError(next);
      setToast({ type: 'error', message: next.message });
    }
  };

  const edit = (item) => {
    setEditingId(item.id);
    setForm({ ...empty, ...item, knownDeviceIds: (item.knownDeviceIds || []).join('\n') });
  };

  const remove = async (item) => {
    if (!confirmDelete(item.email || 'this block record')) return;
    await deleteDoc(doc(db, 'blockedUsers', item.id));
    await load();
  };

  const toggle = async (item) => {
    await updateDoc(doc(db, 'blockedUsers', item.id), { isActive: !item.isActive, updatedAt: serverTimestamp() });
    await load();
  };

  const addCurrentDevice = async (item) => {
    const deviceId = window.localStorage.getItem('ravana_bhawana_device_id');
    if (!deviceId) return setToast({ type: 'error', message: 'No local device ID found in this browser yet.' });
    await updateDoc(doc(db, 'blockedUsers', item.id), { knownDeviceIds: arrayUnion(deviceId), updatedAt: serverTimestamp() });
    await load();
  };

  return (
    <AdminLayout title="Blocked Users">
      <div className="grid gap-6">
        <AdminCard title="Blocked Users" actions={<BackToDashboard />}>
          <Toast toast={toast} />
          <PermissionError error={error} />
          <div className="rounded-lg bg-amber-50 p-4 text-sm font-semibold text-amber-900">
            Hard block works for known accounts/devices. Anonymous visitors using a new device, VPN, or cleared browser data may not be identifiable without server-side firewall/IP controls.
          </div>
          <form onSubmit={save} className="mt-5 grid gap-3 md:grid-cols-2">
            <input className="input" type="email" required placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="block">Block</option><option value="hardBlock">Hard Block</option></select>
            <input className="input" placeholder="Known UID" value={form.knownUid} onChange={(e) => setForm({ ...form, knownUid: e.target.value })} />
            <label className="rounded-lg bg-[var(--theme-surface)] p-3 font-bold"><input type="checkbox" checked={Boolean(form.isActive)} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
            <textarea className="input min-h-24 md:col-span-2" placeholder="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            <textarea className="input min-h-24 md:col-span-2" placeholder="Known device IDs, one per line" value={form.knownDeviceIds} onChange={(e) => setForm({ ...form, knownDeviceIds: e.target.value })} />
            <button className="btn btn-primary md:col-span-2"><ShieldAlert size={18} />{editingId ? 'Update block' : 'Add blocked email'}</button>
          </form>
        </AdminCard>
        <AdminCard title="Records">
          <input className="input mb-4" placeholder="Search blocked users" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="overflow-x-auto"><table className="w-full min-w-[920px] text-left"><thead><tr className="border-b text-sm text-[var(--theme-muted)]"><th>Email</th><th>Type</th><th>Status</th><th>Reason</th><th>Created</th><th>Created By</th><th>Actions</th></tr></thead><tbody>{filtered.map((item) => <tr className="border-b" key={item.id}><td className="py-3 font-bold">{item.email}</td><td>{item.type}</td><td><button className="btn btn-outline" onClick={() => toggle(item)}>{item.isActive ? 'Active' : 'Inactive'}</button></td><td>{item.reason}</td><td>{item.createdAt?.toDate?.().toLocaleString?.() || '-'}</td><td>{item.createdBy || '-'}</td><td><div className="flex flex-wrap gap-2"><button className="btn btn-outline" onClick={() => edit(item)}><Edit3 size={16} /></button><button className="btn btn-outline" onClick={() => addCurrentDevice(item)}>Add this device</button><button className="btn btn-primary" onClick={() => remove(item)}><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div>
        </AdminCard>
      </div>
    </AdminLayout>
  );
}
