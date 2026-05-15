import { useEffect, useState } from 'react';
import { firebaseData } from '../../lib/firebaseData.js';
import { isSessionExpired } from '../../utils/dateTime.js';
import { AdminCard } from './adminHelpers.jsx';

export default function PublicPreview() {
  const [data, setData] = useState({ settings: null, donation: null, latest: null, session: null, banners: [] });
  useEffect(() => {
    Promise.all([
      firebaseData.from('site_settings').select('*').limit(1).maybeSingle(),
      firebaseData.from('donation_settings').select('*').limit(1).maybeSingle(),
      firebaseData.from('videos').select('*').eq('is_latest', true).eq('is_active', true).limit(1).maybeSingle(),
      firebaseData.from('sessions').select('*').eq('is_active', true),
      firebaseData.from('banners').select('*').eq('is_active', true),
    ]).then(([settings, donation, latest, sessions, banners]) => setData({
      settings: settings.data, donation: donation.data, latest: latest.data, session: (sessions.data || []).find((s) => !isSessionExpired(s.expires_at)), banners: banners.data || [],
    }));
  }, []);
  return (
    <AdminCard title="Public Preview" actions={<a className="btn btn-primary" href="/" target="_blank" rel="noreferrer">Open Public Website</a>}>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg bg-[#fffaf0] p-5"><p className="eyebrow">Hero</p><h3 className="text-3xl font-black">{data.settings?.hero_title || 'රාවණ භවණ'}</h3><p className="mt-2 font-bold text-[#6f4a31]">{data.settings?.hero_subtitle}</p><p className="mt-3">{data.settings?.hero_description}</p></div>
        <div className="rounded-lg bg-[#fffaf0] p-5"><p className="eyebrow">Latest Video</p>{data.latest?.thumbnail_url && <img className="mt-2 aspect-video rounded-lg object-cover" src={data.latest.thumbnail_url} alt="" />}<b className="mt-3 block">{data.latest?.title || 'None'}</b></div>
        <div className="rounded-lg bg-[#fffaf0] p-5"><p className="eyebrow">Zoom</p><b>{data.session?.title || 'No active session'}</b><p>{data.session?.session_date} {data.session?.start_time}</p></div>
        <div className="rounded-lg bg-[#fffaf0] p-5"><p className="eyebrow">Donation</p><b>{data.donation?.account_holder_name}</b><p>{data.donation?.bank_name} · {data.donation?.branch}</p><p>{data.donation?.account_number}</p></div>
        <div className="rounded-lg bg-[#fffaf0] p-5 lg:col-span-2"><p className="eyebrow">Contact</p><p>{data.settings?.display_whatsapp_number || '+94 77 719 3197'}</p><p>{data.settings?.youtube_channel_url}</p><p>{data.settings?.facebook_page_url}</p></div>
      </div>
    </AdminCard>
  );
}
