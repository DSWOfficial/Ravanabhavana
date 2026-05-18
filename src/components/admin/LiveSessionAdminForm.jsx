import { Save } from 'lucide-react';
import { dateInputValue, sanitizeYouTubeVideoId } from '../../lib/youtubeLive.js';

export default function LiveSessionAdminForm({ form, setForm, onSave, saving }) {
  const patch = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const cleanId = sanitizeYouTubeVideoId(form.youtubeVideoId);
  return (
    <form onSubmit={onSave} className="grid gap-4 lg:grid-cols-2">
      <label className="rounded-lg bg-[#fffaf0] p-3 font-bold"><input type="checkbox" checked={Boolean(form.isLiveEnabled)} onChange={(event) => patch('isLiveEnabled', event.target.checked)} /> Live is enabled now</label>
      <label className="rounded-lg bg-[#fffaf0] p-3 font-bold"><input type="checkbox" checked={Boolean(form.showLiveChat)} onChange={(event) => patch('showLiveChat', event.target.checked)} /> Show YouTube live chat</label>
      <input className="input" placeholder="YouTube Video ID or URL" value={form.youtubeVideoId} onChange={(event) => patch('youtubeVideoId', event.target.value)} />
      <input className="input" placeholder="YouTube channel URL" value={form.youtubeChannelUrl} onChange={(event) => patch('youtubeChannelUrl', event.target.value)} />
      <input className="input" placeholder="YouTube playlist ID for past recordings" value={form.youtubePlaylistId} onChange={(event) => patch('youtubePlaylistId', event.target.value)} />
      <input className="input" type="datetime-local" value={dateInputValue(form.sessionDateTime)} onChange={(event) => patch('sessionDateTime', event.target.value)} />
      <input className="input lg:col-span-2" placeholder="Session title" value={form.sessionTitle} onChange={(event) => patch('sessionTitle', event.target.value)} />
      <textarea className="input min-h-28 lg:col-span-2" placeholder="Session description" value={form.sessionDescription} onChange={(event) => patch('sessionDescription', event.target.value)} />
      <textarea className="input min-h-24 lg:col-span-2" placeholder="Offline message" value={form.offlineMessage} onChange={(event) => patch('offlineMessage', event.target.value)} />
      <label className="rounded-lg bg-[#fffaf0] p-3 font-bold"><input type="checkbox" checked={Boolean(form.showSupportButton)} onChange={(event) => patch('showSupportButton', event.target.checked)} /> Show support button</label>
      <input className="input" placeholder="Support button text" value={form.supportButtonText} onChange={(event) => patch('supportButtonText', event.target.value)} />
      <input className="input lg:col-span-2" placeholder="Support button URL" value={form.supportButtonUrl} onChange={(event) => patch('supportButtonUrl', event.target.value)} />
      {form.youtubeVideoId && !cleanId && <p className="rounded-lg bg-red-50 p-3 font-bold text-red-700 lg:col-span-2">This does not look like a valid YouTube video ID or URL.</p>}
      <button className="btn btn-primary lg:col-span-2" disabled={saving}><Save size={18} />{saving ? 'Saving...' : 'Save Live Settings'}</button>
    </form>
  );
}
