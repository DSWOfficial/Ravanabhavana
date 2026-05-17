import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { Copy, Edit3, FolderPlus, Search, Trash2, Upload } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { AdminCard, BackToDashboard, PermissionError, Toast, emptyToast } from '../../components/admin/adminHelpers.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { db } from '../../firebase.js';
import { defaultMediaFolders } from '../../lib/siteSettings.js';

export default function CmsMedia() {
  const [items, setItems] = useState([]);
  const [folders, setFolders] = useState(defaultMediaFolders);
  const [file, setFile] = useState(null);
  const [folderId, setFolderId] = useState('other');
  const [folderName, setFolderName] = useState('');
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ folder: 'all', type: 'all', search: '' });
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
      const [mediaSnap, folderSnap] = await Promise.all([
        getDocs(query(collection(db, 'media'), orderBy('createdAt', 'desc'))),
        getDocs(collection(db, 'mediaFolders')),
      ]);
      const customFolders = folderSnap.docs.map((item) => ({ id: item.id, ...item.data() }));
      const mergedFolders = mergeFolders(customFolders);
      setFolders(mergedFolders);
      setItems(mediaSnap.docs.map((item) => normalizeMedia({ id: item.id, ...item.data() })));
    } catch (error) {
      console.error('[CmsMedia] load failed:', error);
      setLoadError(error);
      setToast({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => items.filter((item) => {
    const search = filters.search.trim().toLowerCase();
    if (filters.folder !== 'all' && (item.folderId || 'other') !== filters.folder) return false;
    if (filters.type !== 'all' && item.type !== filters.type) return false;
    return !search || [item.title, item.fileName, item.filename, item.url].filter(Boolean).join(' ').toLowerCase().includes(search);
  }), [filters, items]);
  const fileTypes = useMemo(() => [...new Set(items.map((item) => item.type).filter(Boolean))].sort(), [items]);

  const upload = async (event) => {
    event.preventDefault();
    if (!file) return;
    if (!cloudName || !uploadPreset) return setToast({ type: 'error', message: 'Cloudinary env vars are missing: VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET' });
    setBusy(true);
    setProgress(0);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('upload_preset', uploadPreset);
      const cloudinary = await uploadToCloudinary(cloudName, body, setProgress);
      await addDoc(collection(db, 'media'), {
        title: file.name,
        fileName: file.name,
        filename: file.name,
        url: cloudinary.secure_url,
        publicId: cloudinary.public_id,
        type: inferType(file.name, file.type),
        folderId,
        size: file.size,
        width: cloudinary.width || null,
        height: cloudinary.height || null,
        format: cloudinary.format,
        createdAt: serverTimestamp(),
        uploadedAt: serverTimestamp(),
        uploadedBy: user?.email || '',
        altText: '',
        description: '',
      });
      setFile(null);
      setToast({ type: 'success', message: 'Media uploaded' });
      load();
    } catch (error) {
      console.error('[CmsMedia] upload failed:', error);
      setToast({ type: 'error', message: error.message });
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  const createFolder = async () => {
    const clean = folderName.trim();
    if (!clean) return;
    const id = slugify(clean);
    try {
      await setDoc(doc(db, 'mediaFolders', id), { name: clean, order: folders.length + 1, createdAt: serverTimestamp(), createdBy: user?.email || '' }, { merge: true });
      setFolderName('');
      setToast({ type: 'success', message: 'Folder saved' });
      load();
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    }
  };

  const renameFolder = async (folder) => {
    const name = window.prompt('Rename folder', folder.name);
    if (!name) return;
    await setDoc(doc(db, 'mediaFolders', folder.id), { ...folder, name, updatedAt: serverTimestamp(), updatedBy: user?.email || '' }, { merge: true });
    setToast({ type: 'success', message: 'Folder renamed' });
    load();
  };

  const removeFolder = async (folder) => {
    if (items.some((item) => (item.folderId || 'other') === folder.id)) return setToast({ type: 'error', message: 'Folder is not empty. Move files before deleting it.' });
    if (!window.confirm(`Delete folder ${folder.name}?`)) return;
    await deleteDoc(doc(db, 'mediaFolders', folder.id));
    setToast({ type: 'success', message: 'Folder deleted' });
    load();
  };

  const copy = async (url) => {
    await navigator.clipboard.writeText(url);
    setToast({ type: 'success', message: 'Media URL copied' });
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete ${item.fileName}? This removes only CMS metadata, not the Cloudinary file.`)) return;
    await deleteDoc(doc(db, 'media', item.id));
    setSelected(null);
    setToast({ type: 'success', message: 'Media deleted' });
    load();
  };

  const saveDetails = async () => {
    if (!selected) return;
    await updateDoc(doc(db, 'media', selected.id), {
      title: selected.title || '',
      altText: selected.altText || '',
      description: selected.description || '',
      folderId: selected.folderId || 'other',
      type: selected.type || 'other',
      updatedAt: serverTimestamp(),
      updatedBy: user?.email || '',
    });
    setToast({ type: 'success', message: 'Media details saved' });
    load();
  };

  return (
    <AdminLayout title="Media">
      <AdminCard title="Media Library" actions={<BackToDashboard />}>
        <Toast toast={toast} />
        <PermissionError error={loadError} />
        <p className="mb-4 rounded-lg bg-[var(--theme-section)] p-3 text-sm font-semibold text-[var(--theme-muted)]">Deleting media here removes only the Firestore media record. It does not delete the file from Cloudinary.</p>
        <form onSubmit={upload} className="surface mb-6 grid gap-3 rounded-lg p-4 lg:grid-cols-[minmax(0,1fr)_220px_auto] lg:items-center">
          <input className="input" type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          <select className="input" value={folderId} onChange={(event) => setFolderId(event.target.value)}>{folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select>
          <button className="btn btn-primary" disabled={!file || busy}><Upload size={18} />{busy ? 'Uploading...' : 'Upload'}</button>
          {busy && <div className="h-3 overflow-hidden rounded-full bg-[var(--theme-section)] lg:col-span-3"><div className="h-full bg-[var(--theme-accent)] transition-all" style={{ width: `${progress}%` }} /></div>}
        </form>

        <div className="mb-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
          <label className="relative"><Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--theme-muted)]" size={17} /><input className="input pl-11" placeholder="Search by file name or title" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} /></label>
          <select className="input" value={filters.folder} onChange={(event) => setFilters({ ...filters, folder: event.target.value })}><option value="all">All folders</option>{folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select>
          <select className="input" value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}><option value="all">All file types</option>{fileTypes.map((type) => <option key={type}>{type}</option>)}</select>
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <input className="input" placeholder="Create folder" value={folderName} onChange={(event) => setFolderName(event.target.value)} />
          <button className="btn btn-outline" type="button" onClick={createFolder}><FolderPlus size={17} />Create Folder</button>
        </div>
        <div className="mb-6 flex flex-wrap gap-2">{folders.map((folder) => <button className="btn btn-outline" type="button" key={folder.id} onDoubleClick={() => renameFolder(folder)} onClick={() => setFilters({ ...filters, folder: folder.id })}>{folder.name}{!defaultMediaFolders.some((item) => item.id === folder.id) && <span onClick={(event) => { event.stopPropagation(); removeFolder(folder); }}> ×</span>}</button>)}</div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => (
              <article className="surface overflow-hidden rounded-lg" key={item.id}>
                <MediaPreview item={item} />
                <div className="p-4">
                  <b className="block truncate text-[var(--theme-primary)]">{item.title || item.fileName}</b>
                  <p className="mt-1 truncate text-sm text-[var(--theme-muted)]">{folders.find((folder) => folder.id === item.folderId)?.name || 'Other'} / {item.type}</p>
                  <div className="mt-4 flex flex-wrap gap-2"><button className="btn btn-outline" onClick={() => copy(item.url)}><Copy size={16} />Copy URL</button><button className="btn btn-outline" onClick={() => setSelected(item)}><Edit3 size={16} />Details</button><button className="btn btn-primary" onClick={() => remove(item)}><Trash2 size={16} /></button></div>
                </div>
              </article>
            ))}
            {loading && <p className="text-[var(--theme-muted)]">Loading media...</p>}
            {!loading && !loadError && !filtered.length && <p className="text-[var(--theme-muted)]">No media found.</p>}
          </div>
          {selected && (
            <aside className="surface h-fit rounded-lg p-5">
              <MediaPreview item={selected} />
              <div className="mt-4 grid gap-3">
                <input className="input" placeholder="Title" value={selected.title || ''} onChange={(event) => setSelected({ ...selected, title: event.target.value })} />
                <input className="input" placeholder="Alt text" value={selected.altText || ''} onChange={(event) => setSelected({ ...selected, altText: event.target.value })} />
                <textarea className="input min-h-24" placeholder="Description" value={selected.description || ''} onChange={(event) => setSelected({ ...selected, description: event.target.value })} />
                <select className="input" value={selected.folderId || 'other'} onChange={(event) => setSelected({ ...selected, folderId: event.target.value })}>{folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select>
                <input className="input" value={selected.url} readOnly />
                <div className="flex flex-wrap gap-2"><button className="btn btn-outline" onClick={() => copy(selected.url)}>Copy URL</button><button className="btn btn-primary" onClick={saveDetails}>Save Details</button></div>
              </div>
            </aside>
          )}
        </div>
      </AdminCard>
    </AdminLayout>
  );
}

function normalizeMedia(item) {
  return {
    ...item,
    title: item.title || item.filename || item.fileName || item.name || '',
    fileName: item.fileName || item.filename || item.name || '',
    type: item.type || inferType(item.filename || item.fileName || item.url || '', item.format),
    folderId: item.folderId || 'other',
    uploadedAt: item.uploadedAt || item.createdAt || null,
  };
}

function mergeFolders(customFolders) {
  const byId = Object.fromEntries([...defaultMediaFolders, ...customFolders].map((folder) => [folder.id, folder]));
  return Object.values(byId).sort((a, b) => Number(a.order || 999) - Number(b.order || 999));
}

function inferType(name = '', mime = '') {
  const lower = `${name} ${mime}`.toLowerCase();
  if (lower.includes('pdf')) return 'pdf';
  if (lower.includes('audio') || /\.(mp3|wav|m4a|ogg)$/i.test(name)) return 'audio';
  if (lower.includes('video') || /\.(mp4|mov|webm)$/i.test(name)) return 'video';
  if (lower.includes('doc') || /\.(doc|docx|ppt|pptx|xls|xlsx)$/i.test(name)) return 'document';
  if (lower.includes('image') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name)) return 'image';
  return 'other';
}

function MediaPreview({ item }) {
  if (item.type === 'image') return <img src={item.url} alt={item.altText || item.fileName} className="aspect-video w-full object-cover" />;
  return <div className="grid aspect-video place-items-center bg-[var(--theme-section)] p-4 text-center font-bold text-[var(--theme-primary)]">{item.type}<br />{item.fileName}</div>;
}

function slugify(value = '') {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'folder';
}

function uploadToCloudinary(cloudName, body, onProgress) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`);
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
