import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { Download } from 'lucide-react';
import { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { AdminCard, BackToDashboard, PermissionError, Toast, cmsError, emptyToast } from '../../components/admin/adminHelpers.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { db } from '../../firebase.js';

const exportGroups = [
  ['settings', 'Settings', ['siteSettings', 'seo', 'navigation']],
  ['pages', 'Pages', ['pages']],
  ['videos', 'Videos', ['videos']],
  ['playlists', 'Playlists', ['playlists']],
  ['media', 'Media Metadata', ['media', 'mediaFolders']],
  ['banners', 'Banners', ['banners']],
  ['weeklySessions', 'Weekly Sessions', ['weeklySessions', 'weeklySchedule', 'sessions']],
  ['guidance', 'Guidance Content', ['anonymousGuidance']],
];

export default function BackupExport() {
  const { user } = useAuth();
  const [toast, setToast] = useState(emptyToast);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const exportCollections = async (collections, label, format = 'json') => {
    setBusy(true);
    setError(null);
    try {
      const data = {};
      for (const name of collections) data[name] = await readCollection(name);
      if (format === 'csv' && collections.length === 1) downloadText(`${label}-${today()}.csv`, toCsv(data[collections[0]]));
      else downloadJson(`ravana-bhavana-${label}-${today()}.json`, buildBackup(data, user?.email || ''));
      await setDoc(doc(db, 'siteSettings', 'lastExport'), { label, exportedAt: serverTimestamp(), exportedBy: user?.email || '' }, { merge: true });
      setToast({ type: 'success', message: 'Export created successfully' });
    } catch (err) {
      console.error('[BackupExport] export failed:', err);
      setError(cmsError(err, collections.join(',')));
      setToast({ type: 'error', message: err.message });
    } finally {
      setBusy(false);
    }
  };

  const exportFull = () => exportCollections([...new Set(exportGroups.flatMap(([, , collections]) => collections))], 'backup', 'json');

  return (
    <AdminLayout title="Backup / Export">
      <AdminCard title="Backup / Export CMS Data" actions={<BackToDashboard />}>
        <Toast toast={toast} />
        <PermissionError error={error} />
        <p className="mb-5 rounded-lg bg-amber-50 p-4 font-semibold text-amber-800">Keep this backup file safe. It may contain website content and internal CMS data. Passwords, secrets, and private authentication credentials are not exported.</p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <button className="btn btn-primary justify-center p-5 text-lg" type="button" disabled={busy} onClick={exportFull}><Download size={20} />Export Full Backup</button>
          {exportGroups.map(([key, label, collections]) => (
            <article className="surface rounded-lg p-4" key={key}>
              <h3 className="font-black text-[var(--theme-primary)]">{label}</h3>
              <p className="mt-1 text-sm text-[var(--theme-muted)]">{collections.join(', ')}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="btn btn-outline" type="button" disabled={busy} onClick={() => exportCollections(collections, key, 'json')}>JSON</button>
                {collections.length === 1 && <button className="btn btn-outline" type="button" disabled={busy} onClick={() => exportCollections(collections, key, 'csv')}>CSV</button>}
              </div>
            </article>
          ))}
        </div>
      </AdminCard>
    </AdminLayout>
  );
}

async function readCollection(name) {
  const snap = await getDocs(collection(db, name));
  return snap.docs.map((item) => sanitize({ id: item.id, ...item.data() }));
}

function buildBackup(data, exportedBy) {
  return {
    meta: {
      websiteName: 'Ravana Bhavana',
      exportedAt: new Date().toISOString(),
      exportedBy,
      version: '1.0',
    },
    ...data,
  };
}

function sanitize(value) {
  return JSON.parse(JSON.stringify(value, (key, item) => {
    if (['password', 'apiKey', 'secret', 'token', 'privateKey'].includes(key)) return undefined;
    if (item && typeof item.toDate === 'function') return item.toDate().toISOString();
    return item;
  }));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function downloadJson(filename, value) {
  downloadText(filename, JSON.stringify(value, null, 2));
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows = []) {
  const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const escape = (value) => `"${String(typeof value === 'object' ? JSON.stringify(value) : value ?? '').replace(/"/g, '""')}"`;
  return [keys.join(','), ...rows.map((row) => keys.map((key) => escape(row[key])).join(','))].join('\n');
}
