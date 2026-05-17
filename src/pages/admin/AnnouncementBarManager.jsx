import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { RotateCcw, Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { AdminCard, BackToDashboard, PermissionError, Toast, cmsError, emptyToast } from '../../components/admin/adminHelpers.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { db } from '../../firebase.js';
import { announcementPresets, defaultAnnouncementBar, normalizeAnnouncement } from '../../lib/siteSettings.js';

export default function AnnouncementBarManager() {
  const { user } = useAuth();
  const [form, setForm] = useState(normalizeAnnouncement());
  const [toast, setToast] = useState(emptyToast);
  const [error, setError] = useState(null);
  const preview = useMemo(() => normalizeAnnouncement(form), [form]);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'siteSettings', 'announcementBar'));
        setForm(normalizeAnnouncement(snap.exists() ? snap.data() : {}));
      } catch (err) {
        console.error('[AnnouncementBar] load failed:', err);
        setError(cmsError(err, 'siteSettings/announcementBar'));
      }
    };
    load();
  }, []);

  const patch = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const patchColor = (field, value) => setForm((current) => ({ ...current, colors: { ...current.colors, [field]: value } }));
  const applyPreset = (key) => setForm((current) => normalizeAnnouncement({ ...current, ...announcementPresets[key], colors: { ...current.colors, ...(announcementPresets[key].colors || {}) } }));

  const save = async (event) => {
    event.preventDefault();
    try {
      await setDoc(doc(db, 'siteSettings', 'announcementBar'), { ...normalizeAnnouncement(form), updatedAt: serverTimestamp(), updatedBy: user?.email || '' }, { merge: true });
      setToast({ type: 'success', message: 'Announcement bar saved' });
    } catch (err) {
      console.error('[AnnouncementBar] save failed:', err);
      setError(cmsError(err, 'siteSettings/announcementBar'));
      setToast({ type: 'error', message: err.message });
    }
  };

  return (
    <AdminLayout title="Announcement Bar">
      <AdminCard title="Super Customizable Announcement Bar" actions={<BackToDashboard />}>
        <Toast toast={toast} />
        <PermissionError error={error} />
        <div className="mb-5 flex flex-wrap gap-2">
          <button className="btn btn-outline" type="button" onClick={() => applyPreset('live')}>Live Session</button>
          <button className="btn btn-outline" type="button" onClick={() => applyPreset('video')}>New Video</button>
          <button className="btn btn-outline" type="button" onClick={() => applyPreset('whatsapp')}>WhatsApp Guidance</button>
          <button className="btn btn-outline" type="button" onClick={() => applyPreset('donation')}>Donation Notice</button>
          <button className="btn btn-outline" type="button" onClick={() => applyPreset('custom')}>Custom Notice</button>
        </div>
        <form onSubmit={save} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="rounded-lg bg-[#fffaf0] p-3 font-bold"><input type="checkbox" checked={Boolean(form.enabled)} onChange={(event) => patch('enabled', event.target.checked)} /> Enabled</label>
            <label className="rounded-lg bg-[#fffaf0] p-3 font-bold"><input type="checkbox" checked={Boolean(form.dismissible)} onChange={(event) => patch('dismissible', event.target.checked)} /> Dismissible</label>
            <input className="input md:col-span-2" placeholder="Announcement message text" value={form.message} onChange={(event) => patch('message', event.target.value)} />
            <input className="input" placeholder="Sinhala message" value={form.messageSinhala} onChange={(event) => patch('messageSinhala', event.target.value)} />
            <input className="input" placeholder="English message" value={form.messageEnglish} onChange={(event) => patch('messageEnglish', event.target.value)} />
            <input className="input" placeholder="Button text" value={form.buttonText} onChange={(event) => patch('buttonText', event.target.value)} />
            <input className="input" placeholder="Button link" value={form.buttonLink} onChange={(event) => patch('buttonLink', event.target.value)} />
            <label className="rounded-lg bg-[#fffaf0] p-3 font-bold"><input type="checkbox" checked={Boolean(form.openInNewTab)} onChange={(event) => patch('openInNewTab', event.target.checked)} /> Open in new tab</label>
            <label className="rounded-lg bg-[#fffaf0] p-3 font-bold"><input type="checkbox" checked={Boolean(form.rememberDismissal)} onChange={(event) => patch('rememberDismissal', event.target.checked)} /> Remember dismissal</label>
            <select className="input" value={form.style} onChange={(event) => patch('style', event.target.value)}><option value="info">Info</option><option value="warning">Warning</option><option value="success">Success</option><option value="urgent">Urgent</option><option value="spiritual-gold">Spiritual / Gold</option><option value="custom">Custom</option></select>
            <select className="input" value={form.position} onChange={(event) => patch('position', event.target.value)}><option value="top">Top of website</option><option value="below-navbar">Below navbar</option><option value="bottom">Floating bottom bar</option></select>
            <select className="input" value={form.visibility} onChange={(event) => patch('visibility', event.target.value)}><option value="all">Show on all pages</option><option value="homepage">Homepage only</option><option value="videos">Videos page only</option><option value="custom">Custom selected pages</option></select>
            <select className="input" value={form.animation} onChange={(event) => patch('animation', event.target.value)}><option value="none">None</option><option value="slide-down">Slide down</option><option value="fade">Fade</option><option value="marquee">Marquee / scrolling text</option></select>
            <select className="input" value={form.icon} onChange={(event) => patch('icon', event.target.value)}><option value="none">No icon</option><option value="bell">Bell</option><option value="video">Video</option><option value="whatsapp">WhatsApp</option><option value="alert">Alert</option><option value="star">Star</option></select>
            <input className="input" type="datetime-local" value={form.startAt || ''} onChange={(event) => patch('startAt', event.target.value)} />
            <input className="input" type="datetime-local" value={form.endAt || ''} onChange={(event) => patch('endAt', event.target.value)} />
            {Object.entries(form.colors).map(([field, value]) => <label className="grid gap-1 text-sm font-bold text-[var(--theme-muted)]" key={field}>{field}<input className="input h-12" type="color" value={value} onChange={(event) => patchColor(field, event.target.value)} /></label>)}
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <button className="btn btn-primary"><Save size={18} />Save Announcement Bar</button>
              <button className="btn btn-outline" type="button" onClick={() => setForm(defaultAnnouncementBar)}><RotateCcw size={18} />Reset default style</button>
            </div>
          </div>
          <AnnouncementPreview config={preview} />
        </form>
      </AdminCard>
    </AdminLayout>
  );
}

function AnnouncementPreview({ config }) {
  return (
    <aside className="surface h-fit rounded-lg p-5">
      <p className="eyebrow">Live preview</p>
      <div className="mt-4 rounded-lg p-4" style={{ background: config.colors.background, color: config.colors.text }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <b>{config.messageSinhala || config.message || 'Announcement message'}</b>
          {config.buttonText && <span className="rounded-lg px-4 py-2 font-black" style={{ background: config.colors.buttonBackground, color: config.colors.buttonText }}>{config.buttonText}</span>}
        </div>
      </div>
    </aside>
  );
}
