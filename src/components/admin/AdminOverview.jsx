import { Bell, Gift, PlaySquare, Users, Video } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { firebaseData } from '../../lib/firebaseData.js';
import { calculateActiveBanners, calculateActiveVideos, calculateTotalVideos } from '../../utils/adminStats.js';
import { isSessionExpired } from '../../utils/dateTime.js';
import { AdminCard } from './adminHelpers.jsx';

export default function AdminOverview({ setActivePage }) {
  const [data, setData] = useState({ videos: [], sessions: [], banners: [], profiles: [], donations: [], progress: [], settings: null });
  useEffect(() => {
    Promise.all([
      firebaseData.from('videos').select('*'),
      firebaseData.from('sessions').select('*'),
      firebaseData.from('banners').select('*'),
      firebaseData.from('profiles').select('*'),
      firebaseData.from('donation_submissions').select('*'),
      firebaseData.from('user_video_progress').select('id,completed'),
      firebaseData.from('site_settings').select('*').limit(1).maybeSingle(),
    ]).then(([videos, sessions, banners, profiles, donations, progress, settings]) => setData({
      videos: videos.data || [], sessions: sessions.data || [], banners: banners.data || [], profiles: profiles.data || [], donations: donations.data || [], progress: progress.data || [], settings: settings.data,
    }));
  }, []);
  const latest = data.videos.find((v) => v.is_latest);
  const activeSession = data.sessions.find((s) => s.is_active && !isSessionExpired(s.expires_at));
  const stats = [
    ['Total videos', calculateTotalVideos(data.videos), PlaySquare],
    ['Active videos', calculateActiveVideos(data.videos), PlaySquare],
    ['Active Zoom session', activeSession ? 1 : 0, Video],
    ['Active banners', calculateActiveBanners(data.banners), Bell],
    ['Registered users', data.profiles.length, Users],
    ['Donation submissions', data.donations.length, Gift],
    ['Completed video actions', data.progress.filter((p) => p.completed).length, PlaySquare],
  ];
  const actions = [['Add Video', 'videos'], ['Add Zoom Session', 'sessions'], ['Add Banner', 'banners'], ['Edit Site Settings', 'site']];
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label, value, Icon]) => <article className="surface rounded-xl p-5" key={label}><Icon className="text-[#b88934]" /><p className="mt-3 text-sm font-bold text-[#6f4a31]">{label}</p><b className="text-3xl">{value}</b></article>)}</div>
      <AdminCard title="Currently Live On Website">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-lg bg-[#fffaf0] p-4">{latest?.thumbnail_url && <img className="aspect-video w-full rounded-lg object-cover" src={latest.thumbnail_url} alt="" />}<b className="mt-3 block">Latest video: {latest?.title || 'None'}</b></div>
          <div className="grid gap-3">
            <p><b>Active Zoom:</b> {activeSession ? `${activeSession.title} · ${activeSession.session_date} ${activeSession.start_time}` : 'None'}</p>
            <p><b>Active banners:</b> {calculateActiveBanners(data.banners)}</p>
            <p><b>WhatsApp:</b> {data.settings?.display_whatsapp_number || '+94 77 719 3197'}</p>
            <p><b>YouTube:</b> {data.settings?.youtube_channel_url || '-'}</p>
            <p><b>Facebook:</b> {data.settings?.facebook_page_url || '-'}</p>
          </div>
        </div>
      </AdminCard>
      <AdminCard title="Quick Actions">
        <div className="flex flex-wrap gap-3">{actions.map(([label, page]) => <button className="btn btn-primary" key={page} onClick={() => setActivePage(page)}>{label}</button>)}</div>
      </AdminCard>
    </div>
  );
}
