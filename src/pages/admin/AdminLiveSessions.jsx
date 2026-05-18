import { collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import LiveSessionAdminForm from '../../components/admin/LiveSessionAdminForm.jsx';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { AdminCard, BackToDashboard, PermissionError, Toast, cmsError, emptyToast } from '../../components/admin/adminHelpers.jsx';
import { LivePlayer, LiveStatusBadge } from '../../components/public/YouTubeLive.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { db, firebaseConfig } from '../../firebase.js';
import { normalizeLiveSettings, sanitizeYouTubeVideoId } from '../../lib/youtubeLive.js';
import { normalizeLiveSession } from '../../lib/liveSessions.js';

export default function AdminLiveSessions() {
  const { user } = useAuth();
  const [form, setForm] = useState(normalizeLiveSettings());
  const [manualSessions, setManualSessions] = useState([]);
  const [toast, setToast] = useState(emptyToast);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setError(null);
    try {
      const snap = await getDoc(doc(db, 'siteSettings', 'liveSession'));
      setForm(normalizeLiveSettings(snap.exists() ? snap.data() : {}));
    } catch (err) {
      const next = enrichAdminError(cmsError(err, 'siteSettings/liveSession'), user?.email);
      setError(next);
      setToast({ type: 'error', message: next.message });
    }
    try {
      const sessionSnap = await getDocs(query(collection(db, 'liveSessions'), orderBy('scheduledAt', 'desc')));
      setManualSessions(sessionSnap.docs.map((item) => normalizeLiveSession(item.data(), item.id)));
    } catch (err) {
      const next = enrichAdminError(cmsError(err, 'liveSessions'), user?.email);
      setError(next);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'siteSettings', 'liveSession'), {
        ...normalizeLiveSettings(form),
        youtubeVideoId: sanitizeYouTubeVideoId(form.youtubeVideoId) || form.youtubeVideoId,
        sessionDateTime: form.sessionDateTime ? new Date(form.sessionDateTime) : null,
        updatedAt: serverTimestamp(),
        updatedBy: user?.email || '',
      }, { merge: true });
      setToast({ type: 'success', message: 'Live settings saved' });
      await load();
    } catch (err) {
      const next = enrichAdminError(cmsError(err, 'siteSettings/liveSession'), user?.email);
      setError(next);
      setToast({ type: 'error', message: next.message });
    } finally {
      setSaving(false);
    }
  };

  const cleanId = sanitizeYouTubeVideoId(form.youtubeVideoId);

  return (
    <AdminLayout title="Live Session Manager">
      <div className="grid gap-6">
        <AdminCard title="Live Session Manager" actions={<BackToDashboard />}>
          <Toast toast={toast} />
          <PermissionError error={error} />
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <LiveSessionAdminForm form={form} setForm={setForm} onSave={save} saving={saving} />
            <aside className="surface h-fit rounded-lg p-5">
              <p className="eyebrow">Preview</p>
              <LiveStatusBadge settings={form} />
              <h3 className="mt-3 text-2xl font-black text-[var(--theme-primary)]">{form.sessionTitle || 'Ravana Bhavana Live'}</h3>
              <p className="mt-2 text-sm text-[var(--theme-muted)]">{form.sessionDescription || form.offlineMessage}</p>
              {cleanId && <div className="mt-4"><LivePlayer videoId={cleanId} title={form.sessionTitle} /></div>}
            </aside>
          </div>
        </AdminCard>

        <AdminCard title="Manual Past Recording Cards">
          <p className="mb-4 text-sm font-semibold text-[var(--theme-muted)]">If no YouTube playlist ID is set, public Past Sessions can use old live session documents with published recording URLs.</p>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {manualSessions.filter((item) => item.recordingPublished && item.recordingUrl).map((item) => (
              <article className="surface rounded-lg p-4" key={item.id}>
                <b className="text-[var(--theme-primary)]">{item.title_si || item.title_en}</b>
                <p className="mt-2 break-all text-sm text-[var(--theme-muted)]">{item.recordingUrl}</p>
              </article>
            ))}
          </div>
        </AdminCard>
      </div>
    </AdminLayout>
  );
}

function enrichAdminError(error, signedInEmail) {
  error.signedInEmail = signedInEmail || 'not signed in';
  error.projectId = firebaseConfig.projectId;
  return error;
}
