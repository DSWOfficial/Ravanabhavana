import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { Copy, Trash2, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { AdminCard, BackToDashboard, PermissionError, Toast, emptyToast } from '../../components/admin/adminHelpers.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { db } from '../../firebase.js';

export default function CmsMedia() {
  const [items, setItems] = useState([]);
  const [file, setFile] = useState(null);
  const [toast, setToast] = useState(emptyToast);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const { user } = useAuth();
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const snap = await getDocs(query(collection(db, 'media'), orderBy('createdAt', 'desc')));
      setItems(snap.docs.map((item) => ({ id: item.id, ...item.data() })));
    } catch (error) {
      console.error('[CmsMedia] load failed:', error);
      setLoadError(error);
      setToast({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  const upload = async (event) => {
    event.preventDefault();
    if (!file) return;
    if (!cloudName || !uploadPreset) {
      setToast({ type: 'error', message: 'Cloudinary env vars are missing: VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET' });
      return;
    }
    setBusy(true);
    setProgress(0);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('upload_preset', uploadPreset);
      const cloudinary = await uploadToCloudinary(cloudName, body, setProgress);
      await addDoc(collection(db, 'media'), {
        url: cloudinary.secure_url,
        publicId: cloudinary.public_id,
        filename: file.name,
        size: file.size,
        width: cloudinary.width,
        height: cloudinary.height,
        format: cloudinary.format,
        createdAt: serverTimestamp(),
        uploadedBy: user?.email || '',
      });
      setFile(null);
      setToast({ type: 'success', message: 'Image uploaded' });
      load();
    } catch (error) {
      console.error('[CmsMedia] upload failed:', error);
      setToast({ type: 'error', message: error.message });
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };
  const copy = async (url) => {
    await navigator.clipboard.writeText(url);
    setToast({ type: 'success', message: 'Image URL copied' });
  };
  const remove = async (item) => {
    try {
      await deleteDoc(doc(db, 'media', item.id));
      setToast({ type: 'success', message: 'Media deleted' });
      load();
    } catch (error) {
      console.error('[CmsMedia] delete failed:', error);
      setToast({ type: 'error', message: error.message });
    }
  };
  return (
    <AdminLayout title="Media">
      <AdminCard title="Media Library" actions={<BackToDashboard />}>
        <Toast toast={toast} />
        <PermissionError error={loadError} />
        <p className="mb-4 rounded-lg bg-[var(--theme-section)] p-3 text-sm font-semibold text-[var(--theme-muted)]">Deleting media here removes only the Firestore media record. It does not delete the image from Cloudinary.</p>
        <form onSubmit={upload} className="surface mb-6 flex flex-col gap-3 rounded-lg p-4 sm:flex-row sm:items-center">
          <input className="input" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <button className="btn btn-primary" disabled={!file || busy}><Upload size={18} />{busy ? 'Uploading...' : 'Upload image'}</button>
          {busy && <div className="h-3 overflow-hidden rounded-full bg-[var(--theme-section)] sm:w-48"><div className="h-full bg-[var(--theme-accent)] transition-all" style={{ width: `${progress}%` }} /></div>}
        </form>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article className="surface overflow-hidden rounded-lg" key={item.id}>
              <img src={item.url} alt={item.filename || item.name} className="aspect-video w-full object-cover" />
              <div className="p-4">
                <b className="block truncate text-[var(--theme-primary)]">{item.filename || item.name}</b>
                <p className="mt-1 truncate text-sm text-[var(--theme-muted)]">{item.url}</p>
                <p className="mt-1 text-xs text-[var(--theme-muted)]">{item.width || '-'} x {item.height || '-'} {item.format ? `.${item.format}` : ''}</p>
                <p className="mt-1 truncate text-xs text-[var(--theme-muted)]">Uploaded by {item.uploadedBy || '-'}</p>
                <div className="mt-4 flex gap-2"><button className="btn btn-outline" onClick={() => copy(item.url)}><Copy size={16} />Copy URL</button><button className="btn btn-primary" onClick={() => remove(item)}><Trash2 size={16} /></button></div>
              </div>
            </article>
          ))}
        </div>
        {loading && <p className="text-[var(--theme-muted)]">Loading media...</p>}
        {!loading && !loadError && !items.length && <p className="text-[var(--theme-muted)]">No uploaded media yet.</p>}
      </AdminCard>
    </AdminLayout>
  );
}

function uploadToCloudinary(cloudName, body, onProgress) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => {
      let payload = null;
      try {
        payload = JSON.parse(request.responseText);
      } catch {
        reject(new Error('Cloudinary returned an invalid response'));
        return;
      }
      if (request.status >= 200 && request.status < 300) resolve(payload);
      else reject(new Error(payload?.error?.message || `Cloudinary upload failed (${request.status})`));
    };
    request.onerror = () => reject(new Error('Cloudinary upload failed. Check your network and upload preset.'));
    request.send(body);
  });
}
