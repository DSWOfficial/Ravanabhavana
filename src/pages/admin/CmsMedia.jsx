import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { Copy, Trash2, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { AdminCard, Toast, emptyToast } from '../../components/admin/adminHelpers.jsx';
import { db, storage } from '../../firebase.js';

export default function CmsMedia() {
  const [items, setItems] = useState([]);
  const [file, setFile] = useState(null);
  const [toast, setToast] = useState(emptyToast);
  const [busy, setBusy] = useState(false);
  const load = async () => {
    const snap = await getDocs(query(collection(db, 'media'), orderBy('createdAt', 'desc')));
    setItems(snap.docs.map((item) => ({ id: item.id, ...item.data() })));
  };
  useEffect(() => { load().catch((error) => setToast({ type: 'error', message: error.message })); }, []);
  const upload = async (event) => {
    event.preventDefault();
    if (!file) return;
    setBusy(true);
    try {
      const path = `cms/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await addDoc(collection(db, 'media'), { name: file.name, url, path, type: file.type, createdAt: serverTimestamp() });
      setFile(null);
      setToast({ type: 'success', message: 'Image uploaded' });
      load();
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    } finally {
      setBusy(false);
    }
  };
  const copy = async (url) => {
    await navigator.clipboard.writeText(url);
    setToast({ type: 'success', message: 'Image URL copied' });
  };
  const remove = async (item) => {
    await deleteDoc(doc(db, 'media', item.id));
    if (item.path) await deleteObject(ref(storage, item.path)).catch(() => {});
    load();
  };
  return (
    <AdminLayout title="Media">
      <AdminCard title="Media Library">
        <Toast toast={toast} />
        <form onSubmit={upload} className="surface mb-6 flex flex-col gap-3 rounded-lg p-4 sm:flex-row sm:items-center">
          <input className="input" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <button className="btn btn-primary" disabled={!file || busy}><Upload size={18} />{busy ? 'Uploading...' : 'Upload image'}</button>
        </form>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article className="surface overflow-hidden rounded-lg" key={item.id}>
              <img src={item.url} alt={item.name} className="aspect-video w-full object-cover" />
              <div className="p-4">
                <b className="block truncate text-[var(--theme-primary)]">{item.name}</b>
                <p className="mt-1 truncate text-sm text-[var(--theme-muted)]">{item.url}</p>
                <div className="mt-4 flex gap-2"><button className="btn btn-outline" onClick={() => copy(item.url)}><Copy size={16} />Copy URL</button><button className="btn btn-primary" onClick={() => remove(item)}><Trash2 size={16} /></button></div>
              </div>
            </article>
          ))}
        </div>
        {!items.length && <p className="text-[var(--theme-muted)]">No uploaded media yet.</p>}
      </AdminCard>
    </AdminLayout>
  );
}
