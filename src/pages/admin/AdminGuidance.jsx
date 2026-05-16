import { collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Archive, Copy, Save, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { AdminCard, BackToDashboard, PermissionError, Toast, cmsError, confirmDelete, emptyToast } from '../../components/admin/adminHelpers.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { db } from '../../firebase.js';

const statuses = ['all', 'new', 'reviewing', 'answered', 'archived'];
const categories = ['all', 'Spiritual Guidance', 'Stress / Mental Peace', 'Family Problem', 'Education / Studies', 'Bad Habits', 'Personal Problem', 'Other'];

export default function AdminGuidance() {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [toast, setToast] = useState(emptyToast);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const load = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'anonymousGuidance'), orderBy('createdAt', 'desc')));
      setItems(snap.docs.map((item) => ({ id: item.id, ...item.data() })));
      setError(null);
    } catch (err) {
      const next = cmsError(err, 'anonymousGuidance');
      console.error('[AdminGuidance] load failed:', next);
      setError(next);
      setToast({ type: 'error', message: next.message });
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => items.filter((item) => (statusFilter === 'all' || item.status === statusFilter) && (categoryFilter === 'all' || item.category === categoryFilter)), [items, statusFilter, categoryFilter]);
  const selected = active || filtered[0] || null;

  const patch = async (item, payload) => {
    try {
      await updateDoc(doc(db, 'anonymousGuidance', item.id), { ...payload, updatedAt: serverTimestamp() });
      setToast({ type: 'success', message: 'Guidance updated' });
      setActive(null);
      await load();
    } catch (err) {
      const next = cmsError(err, `anonymousGuidance/${item.id}`);
      setError(next);
      setToast({ type: 'error', message: next.message });
    }
  };

  const remove = async (item) => {
    if (!confirmDelete('this guidance request')) return;
    await deleteDoc(doc(db, 'anonymousGuidance', item.id));
    setActive(null);
    await load();
  };

  return (
    <AdminLayout title="Guidance">
      <div className="grid gap-6">
        <AdminCard title="Anonymous Guidance" actions={<BackToDashboard />}>
          <Toast toast={toast} />
          <PermissionError error={error} />
          <div className="grid gap-3 sm:grid-cols-2">
            <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>{statuses.map((item) => <option key={item}>{item}</option>)}</select>
            <select className="input" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select>
          </div>
        </AdminCard>
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <AdminCard title="Submissions">
            <div className="grid gap-2">
              {filtered.map((item) => <button className={`rounded-lg p-3 text-left ${selected?.id === item.id ? 'bg-[var(--theme-accent)] text-[var(--theme-hero)]' : 'bg-[var(--theme-surface)]'}`} key={item.id} onClick={() => setActive(item)}><b>{item.category}</b><p className="line-clamp-2 text-sm">{item.question}</p><span className="text-xs font-bold">{item.status}</span></button>)}
              {!filtered.length && <p className="text-[var(--theme-muted)]">No guidance submissions found.</p>}
            </div>
          </AdminCard>
          <AdminCard title="Answer">
            {selected ? <GuidanceEditor item={selected} onSave={patch} onDelete={remove} userEmail={user?.email || ''} /> : <p className="text-[var(--theme-muted)]">Select a submission to answer.</p>}
          </AdminCard>
        </div>
      </div>
    </AdminLayout>
  );
}

function GuidanceEditor({ item, onSave, onDelete, userEmail }) {
  const [draft, setDraft] = useState(item);
  useEffect(() => setDraft(item), [item]);
  return (
    <div className="grid gap-3">
      <p className="rounded-lg bg-[var(--theme-section)] p-4 whitespace-pre-wrap">{item.question}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <p><b>Status:</b> {item.status}</p>
        <p><b>Private reply:</b> {item.wantsPrivateReply ? 'Yes' : 'No'}</p>
        <p><b>Can publish:</b> {item.allowAnonymousPublish ? 'Yes' : 'No'}</p>
        <p><b>WhatsApp:</b> {item.optionalWhatsapp || '-'}</p>
      </div>
      {item.optionalWhatsapp && <button className="btn btn-outline justify-self-start" onClick={() => navigator.clipboard.writeText(item.optionalWhatsapp)}><Copy size={16} />Copy WhatsApp</button>}
      <select className="input" value={draft.status || 'new'} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>{statuses.filter((item) => item !== 'all').map((status) => <option key={status}>{status}</option>)}</select>
      <textarea className="input min-h-48" placeholder="Answer" value={draft.answer || ''} onChange={(e) => setDraft({ ...draft, answer: e.target.value })} />
      <label className="font-bold"><input type="checkbox" checked={Boolean(draft.isPublished)} onChange={(e) => setDraft({ ...draft, isPublished: e.target.checked })} /> Publish anonymously</label>
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary" onClick={() => onSave(item, { answer: draft.answer || '', status: draft.answer ? 'answered' : draft.status, isPublished: Boolean(draft.isPublished), answeredBy: userEmail })}><Save size={16} />Save answer</button>
        <button className="btn btn-outline" onClick={() => onSave(item, { status: 'archived', isPublished: false })}><Archive size={16} />Archive</button>
        <button className="btn btn-primary" onClick={() => onDelete(item)}><Trash2 size={16} />Delete</button>
      </div>
    </div>
  );
}
