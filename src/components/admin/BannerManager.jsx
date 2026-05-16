import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Copy, Edit3, Eye, ImageIcon, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { db } from '../../firebase.js';
import { bannerTopics, normalizeBanner, themeForTopic } from '../../lib/bannerThemes.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { AdminCard, cmsError, confirmDelete, emptyToast, PermissionError, StatusBadge, Toast } from './adminHelpers.jsx';

const empty = {
  title: '',
  message: '',
  topic: 'Notice',
  imageUrl: '',
  buttonText: '',
  buttonUrl: '',
  isActive: true,
  startAt: '',
  endAt: '',
  theme: themeForTopic('Notice'),
  priority: 0,
};

function dateValue(value) {
  if (!value) return '';
  if (typeof value.toDate === 'function') return value.toDate().toISOString().slice(0, 16);
  if (typeof value === 'string') return value.slice(0, 16);
  return '';
}

function BannerPreview({ banner }) {
  const preview = normalizeBanner(banner);
  return (
    <article className="overflow-hidden rounded-lg border-2" style={{ background: preview.theme.backgroundColor, color: preview.theme.textColor, borderColor: preview.theme.borderColor, boxShadow: `0 18px 44px color-mix(in srgb, ${preview.theme.accentColor} 24%, transparent)` }}>
      <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
        <div className="p-5">
          <span className="inline-flex rounded-full px-3 py-1 text-xs font-black uppercase" style={{ backgroundColor: preview.theme.accentColor, color: preview.theme.backgroundColor }}>{preview.topic}</span>
          <h3 className="mt-4 text-2xl font-black">{preview.title || 'Banner title'}</h3>
          <p className="mt-2 whitespace-pre-wrap opacity-90">{preview.message || 'Banner message preview'}</p>
          {preview.buttonText && <span className="btn mt-4 border-0" style={{ backgroundColor: preview.theme.accentColor, color: preview.theme.backgroundColor }}>{preview.buttonText}</span>}
        </div>
        {preview.imageUrl && <img src={preview.imageUrl} alt="" className="h-full min-h-44 w-full object-cover" />}
      </div>
    </article>
  );
}

export default function BannerManager() {
  const [items, setItems] = useState([]);
  const [media, setMedia] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState(emptyToast);
  const [loadError, setLoadError] = useState(null);
  const { user } = useAuth();

  const sortedItems = useMemo(() => items.sort((a, b) => (b.priority - a.priority) || ((b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))), [items]);

  const load = async () => {
    try {
      const [bannerSnap, mediaSnap] = await Promise.all([
        getDocs(query(collection(db, 'banners'), orderBy('priority', 'desc'))),
        getDocs(query(collection(db, 'media'), orderBy('createdAt', 'desc'))),
      ]);
      setItems(bannerSnap.docs.map((item) => normalizeBanner(item.data(), item.id)));
      setMedia(mediaSnap.docs.map((item) => ({ id: item.id, ...item.data() })));
      setLoadError(null);
    } catch (error) {
      const next = cmsError(error, 'banners/media');
      console.error('[BannerManager] load failed:', next);
      setLoadError(next);
      setToast({ type: 'error', message: next.message });
    }
  };

  useEffect(() => { load(); }, []);

  const updateTopic = (topic) => setForm({ ...form, topic, theme: themeForTopic(topic) });
  const updateTheme = (field, value) => setForm({ ...form, theme: { ...form.theme, [field]: value } });

  const save = async (event) => {
    event.preventDefault();
    if (form.imageUrl && !/^https?:\/\/.+/i.test(form.imageUrl)) {
      setToast({ type: 'error', message: 'Image URL must be a valid http or https URL' });
      return;
    }
    try {
      const payload = {
        ...form,
        priority: Number(form.priority || 0),
        startAt: form.startAt ? new Date(form.startAt) : null,
        endAt: form.endAt ? new Date(form.endAt) : null,
        updatedAt: serverTimestamp(),
      };
      if (editingId) await updateDoc(doc(db, 'banners', editingId), payload);
      else await addDoc(collection(db, 'banners'), { ...payload, createdAt: serverTimestamp(), createdBy: user?.email || '' });
      setToast({ type: 'success', message: 'Banner saved' });
      setForm(empty);
      setEditingId(null);
      await load();
    } catch (error) {
      const next = cmsError(error, editingId ? `banners/${editingId}` : 'banners');
      console.error('[BannerManager] save failed:', next);
      setLoadError(next);
      setToast({ type: 'error', message: next.message });
    }
  };

  const edit = (item) => {
    setEditingId(item.id);
    setForm({ ...item, startAt: dateValue(item.startAt), endAt: dateValue(item.endAt), theme: { ...themeForTopic(item.topic), ...item.theme } });
  };

  const remove = async (item) => {
    if (!confirmDelete(item.title)) return;
    try {
      await deleteDoc(doc(db, 'banners', item.id));
      setToast({ type: 'success', message: 'Banner deleted' });
      await load();
    } catch (error) {
      const next = cmsError(error, `banners/${item.id}`);
      console.error('[BannerManager] delete failed:', next);
      setLoadError(next);
      setToast({ type: 'error', message: next.message });
    }
  };

  const toggle = async (item) => {
    try {
      await updateDoc(doc(db, 'banners', item.id), { isActive: !item.isActive, updatedAt: serverTimestamp() });
      await load();
    } catch (error) {
      const next = cmsError(error, `banners/${item.id}`);
      setLoadError(next);
      setToast({ type: 'error', message: next.message });
    }
  };

  return (
    <AdminCard title="Banner Manager" actions={<button className="btn btn-outline" onClick={() => { setForm(empty); setEditingId(null); }}>New banner</button>}>
      <Toast toast={toast} />
      <PermissionError error={loadError} />
      <form onSubmit={save} className="mt-4 grid gap-5 xl:grid-cols-[1fr_0.85fr]">
        <div className="grid gap-3 md:grid-cols-2">
          <input className="input" required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <select className="input" value={form.topic} onChange={(e) => updateTopic(e.target.value)}>{bannerTopics.map((topic) => <option key={topic}>{topic}</option>)}</select>
          <input className="input" placeholder="Button text" value={form.buttonText} onChange={(e) => setForm({ ...form, buttonText: e.target.value })} />
          <input className="input" placeholder="Button URL" value={form.buttonUrl} onChange={(e) => setForm({ ...form, buttonUrl: e.target.value })} />
          <input className="input" placeholder="Image URL" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
          <input className="input" type="number" placeholder="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
          <input className="input" type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} />
          <input className="input" type="datetime-local" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} />
          <label className="rounded-lg bg-[var(--theme-surface)] p-3 font-bold"><input type="checkbox" checked={Boolean(form.isActive)} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
          <textarea className="input min-h-28 md:col-span-2" required placeholder="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          {['backgroundColor', 'textColor', 'accentColor', 'borderColor'].map((field) => <label className="grid gap-1 text-sm font-bold text-[var(--theme-muted)]" key={field}>{field}<input className="h-11 w-full rounded border p-1" type="color" value={form.theme[field]} onChange={(e) => updateTheme(field, e.target.value)} /></label>)}
          <button className="btn btn-primary md:col-span-2">{editingId ? 'Update banner' : 'Create banner'}</button>
        </div>
        <div className="grid gap-4">
          <BannerPreview banner={form} />
          <div className="rounded-lg border border-[color-mix(in_srgb,var(--theme-accent)_25%,transparent)] p-3">
            <b className="flex items-center gap-2 text-[var(--theme-primary)]"><ImageIcon size={17} />Choose from Media Library</b>
            <div className="mt-3 grid max-h-72 gap-2 overflow-auto">
              {media.map((item) => <button className="flex items-center gap-3 rounded-lg p-2 text-left hover:bg-[var(--theme-section)]" type="button" key={item.id} onClick={() => setForm({ ...form, imageUrl: item.url })}><img src={item.url} alt="" className="h-12 w-16 rounded object-cover" /><span className="truncate text-sm">{item.filename || item.url}</span></button>)}
              {!media.length && <p className="text-sm text-[var(--theme-muted)]">Upload images in Media, then choose them here.</p>}
            </div>
          </div>
        </div>
      </form>
      <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[860px] text-left"><thead><tr className="border-b text-sm text-[var(--theme-muted)]"><th>Title</th><th>Topic</th><th>Status</th><th>Priority</th><th>Actions</th></tr></thead><tbody>{sortedItems.map((item) => <tr key={item.id} className="border-b border-[color-mix(in_srgb,var(--theme-accent)_18%,transparent)]"><td className="py-3 font-bold">{item.title}</td><td>{item.topic}</td><td><button className="btn btn-outline" onClick={() => toggle(item)}><StatusBadge active={item.isActive} /></button></td><td>{item.priority}</td><td><div className="flex gap-2"><button className="btn btn-outline" onClick={() => edit(item)}><Edit3 size={16} /></button><a className="btn btn-outline" href="/" target="_blank" rel="noreferrer"><Eye size={16} /></a><button className="btn btn-outline" onClick={() => navigator.clipboard.writeText(item.buttonUrl || item.imageUrl || '')}><Copy size={16} /></button><button className="btn btn-primary" onClick={() => remove(item)}><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div>
    </AdminCard>
  );
}
