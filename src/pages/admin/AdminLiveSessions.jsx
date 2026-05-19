import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore';
import { Copy, Edit3, EyeOff, PlayCircle, Radio, Save, Square, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { AdminCard, BackToDashboard, PermissionError, StatusBadge, Toast, cmsError, confirmDelete, emptyToast } from '../../components/admin/adminHelpers.jsx';
import { LivePlayer, LiveStatusBadge } from '../../components/public/YouTubeLive.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { db, firebaseConfig } from '../../firebase.js';
import { dateInputValue, emptyLiveSession, normalizeLiveSession, sanitizeYouTubeVideoId, youtubeUrlToEmbedUrl } from '../../lib/youtubeLive.js';

export default function AdminLiveSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState(emptyLiveSession);
  const [editingId, setEditingId] = useState('');
  const [toast, setToast] = useState(emptyToast);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const sorted = useMemo(() => [...sessions].sort((a, b) => (toMillis(b.createdAt) || 0) - (toMillis(a.createdAt) || 0)), [sessions]);
  const cleanVideoId = sanitizeYouTubeVideoId(form.youtubeUrl);

  const load = async () => {
    setError(null);
    try {
      const snap = await getDocs(query(collection(db, 'liveSessions'), orderBy('createdAt', 'desc')));
      setSessions(snap.docs.map((item) => normalizeLiveSession(item.data(), item.id)));
    } catch (err) {
      const next = enrichAdminError(cmsError(err, 'liveSessions'), user?.email);
      setError(next);
      setToast({ type: 'error', message: next.message });
    }
  };

  useEffect(() => { load(); }, []);

  const patch = (field, value) => setForm((current) => {
    const next = { ...current, [field]: value };
    if (field === 'youtubeUrl') next.embedUrl = youtubeUrlToEmbedUrl(value);
    return next;
  });

  const reset = () => {
    setEditingId('');
    setForm(emptyLiveSession);
  };

  const save = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) return setToast({ type: 'error', message: 'Please add a live session title.' });
    if (form.youtubeUrl && !sanitizeYouTubeVideoId(form.youtubeUrl)) return setToast({ type: 'error', message: 'Please use a valid YouTube live URL.' });
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      youtubeUrl: form.youtubeUrl.trim(),
      embedUrl: youtubeUrlToEmbedUrl(form.youtubeUrl),
      thumbnailUrl: form.thumbnailUrl.trim(),
      status: form.status || 'draft',
      isVisible: Boolean(form.isVisible),
      startsAt: form.startsAt ? new Date(form.startsAt) : null,
      endsAt: form.endsAt ? new Date(form.endsAt) : null,
      updatedAt: serverTimestamp(),
      updatedBy: user?.email || '',
    };
    try {
      if (editingId) await updateDoc(doc(db, 'liveSessions', editingId), payload);
      else await addDoc(collection(db, 'liveSessions'), { ...payload, createdAt: serverTimestamp(), createdBy: user?.email || '' });
      setToast({ type: 'success', message: 'Live session saved' });
      reset();
      await load();
    } catch (err) {
      const next = enrichAdminError(cmsError(err, editingId ? `liveSessions/${editingId}` : 'liveSessions'), user?.email);
      setError(next);
      setToast({ type: 'error', message: next.message });
    } finally {
      setSaving(false);
    }
  };

  const edit = (session) => {
    setEditingId(session.id);
    setForm({
      ...emptyLiveSession,
      ...session,
      startsAt: dateInputValue(session.startsAt),
      endsAt: dateInputValue(session.endsAt),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (session) => {
    if (!confirmDelete(session.title)) return;
    try {
      await deleteDoc(doc(db, 'liveSessions', session.id));
      setToast({ type: 'success', message: 'Live session deleted' });
      await load();
    } catch (err) {
      const next = enrichAdminError(cmsError(err, `liveSessions/${session.id}`), user?.email);
      setError(next);
      setToast({ type: 'error', message: next.message });
    }
  };

  const startLive = async (session) => {
    try {
      const batch = writeBatch(db);
      sessions.forEach((item) => {
        batch.update(doc(db, 'liveSessions', item.id), {
          status: item.id === session.id ? 'live' : 'ended',
          isVisible: item.id === session.id,
          updatedAt: serverTimestamp(),
          updatedBy: user?.email || '',
        });
      });
      await batch.commit();
      setToast({ type: 'success', message: 'Live session started. Other sessions were hidden.' });
      await load();
    } catch (err) {
      const next = enrichAdminError(cmsError(err, 'liveSessions/start-live'), user?.email);
      setError(next);
      setToast({ type: 'error', message: next.message });
    }
  };

  const quickUpdate = async (session, payload, message) => {
    try {
      await updateDoc(doc(db, 'liveSessions', session.id), { ...payload, updatedAt: serverTimestamp(), updatedBy: user?.email || '' });
      setToast({ type: 'success', message });
      await load();
    } catch (err) {
      const next = enrichAdminError(cmsError(err, `liveSessions/${session.id}`), user?.email);
      setError(next);
      setToast({ type: 'error', message: next.message });
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/live`);
    setToast({ type: 'success', message: 'Public live page link copied' });
  };

  return (
    <AdminLayout title="Live Sessions">
      <div className="grid gap-6">
        <AdminCard title={editingId ? 'Edit Live Session' : 'Create Live Session'} actions={<BackToDashboard />}>
          <Toast toast={toast} />
          <PermissionError error={error} />
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
              <input className="input md:col-span-2" required placeholder="Title" value={form.title} onChange={(event) => patch('title', event.target.value)} />
              <textarea className="input min-h-28 md:col-span-2" placeholder="Description" value={form.description} onChange={(event) => patch('description', event.target.value)} />
              <input className="input md:col-span-2" placeholder="YouTube live URL" value={form.youtubeUrl} onChange={(event) => patch('youtubeUrl', event.target.value)} />
              <input className="input md:col-span-2" placeholder="Optional custom thumbnail URL" value={form.thumbnailUrl} onChange={(event) => patch('thumbnailUrl', event.target.value)} />
              <input className="input" type="datetime-local" value={form.startsAt} onChange={(event) => patch('startsAt', event.target.value)} />
              <input className="input" type="datetime-local" value={form.endsAt} onChange={(event) => patch('endsAt', event.target.value)} />
              <select className="input" value={form.status} onChange={(event) => patch('status', event.target.value)}>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="live">Live</option>
                <option value="ended">Ended</option>
              </select>
              <label className="rounded-lg bg-[#fffaf0] p-3 font-bold"><input type="checkbox" checked={Boolean(form.isVisible)} onChange={(event) => patch('isVisible', event.target.checked)} /> Visible on public site</label>
              {form.youtubeUrl && !cleanVideoId && <p className="rounded-lg bg-red-50 p-3 font-bold text-red-700 md:col-span-2">This does not look like a supported YouTube URL.</p>}
              <div className="flex flex-wrap gap-2 md:col-span-2">
                <button className="btn btn-primary" disabled={saving}><Save size={18} />{saving ? 'Saving...' : 'Save Session'}</button>
                <button className="btn btn-outline" type="button" onClick={reset}>New Session</button>
              </div>
            </form>
            <aside className="surface h-fit rounded-lg p-5">
              <p className="eyebrow">Preview</p>
              <LiveStatusBadge settings={form} />
              <h3 className="mt-3 text-2xl font-black text-[var(--theme-primary)]">{form.title || 'Live Session'}</h3>
              <p className="mt-2 text-sm text-[var(--theme-muted)]">{form.description || 'Session description preview.'}</p>
              {form.thumbnailUrl && <img className="mt-4 aspect-video w-full rounded-lg object-cover" src={form.thumbnailUrl} alt="" />}
              {cleanVideoId && <div className="mt-4"><LivePlayer videoId={cleanVideoId} title={form.title} /></div>}
            </aside>
          </div>
        </AdminCard>

        <AdminCard title="Existing Live Sessions" actions={<button className="btn btn-outline" type="button" onClick={copyLink}><Copy size={16} />Copy Public Link</button>}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left">
              <thead><tr className="border-b text-sm text-[var(--theme-muted)]"><th>Title</th><th>Status</th><th>Visible</th><th>Starts</th><th>YouTube</th><th>Actions</th></tr></thead>
              <tbody>{sorted.map((session) => (
                <tr className="border-b" key={session.id}>
                  <td className="py-3 font-bold">{session.title}</td>
                  <td><StatusBadge active={session.status === 'live'} label={session.status} /></td>
                  <td>{session.isVisible ? 'Yes' : 'No'}</td>
                  <td>{dateInputValue(session.startsAt)}</td>
                  <td className="max-w-xs truncate">{session.youtubeUrl}</td>
                  <td><div className="flex flex-wrap gap-2">
                    <button className="btn btn-outline" type="button" onClick={() => edit(session)}><Edit3 size={16} />Edit</button>
                    <button className="btn btn-outline" type="button" onClick={() => startLive(session)}><Radio size={16} />Start Live</button>
                    <button className="btn btn-outline" type="button" onClick={() => quickUpdate(session, { status: 'ended', isVisible: false }, 'Live session ended')}><Square size={16} />End Live</button>
                    <button className="btn btn-outline" type="button" onClick={() => quickUpdate(session, { isVisible: false }, 'Live session hidden')}><EyeOff size={16} />Hide</button>
                    <button className="btn btn-primary" type="button" onClick={() => remove(session)}><Trash2 size={16} /></button>
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
            {!sorted.length && <p className="py-5 text-[var(--theme-muted)]">No live sessions yet.</p>}
          </div>
        </AdminCard>
      </div>
    </AdminLayout>
  );
}

function toMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.toDate === 'function') return value.toDate().getTime();
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function enrichAdminError(error, signedInEmail) {
  error.signedInEmail = signedInEmail || 'not signed in';
  error.projectId = firebaseConfig.projectId;
  return error;
}
