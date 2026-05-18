import { doc, onSnapshot } from 'firebase/firestore';
import { Bell, PlayCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LiveStatusBadge } from './YouTubeLive.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { db } from '../../firebase.js';
import { getCountdownParts, getLiveStatus, normalizeLiveSettings, sanitizeYouTubeVideoId, toDate } from '../../lib/youtubeLive.js';

export default function RavanaLiveSection() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState(normalizeLiveSettings());
  const [tick, setTick] = useState(Date.now());

  useEffect(() => onSnapshot(doc(db, 'siteSettings', 'liveSession'), (snap) => {
    setSettings(normalizeLiveSettings(snap.exists() ? snap.data() : {}));
  }, (error) => console.error('[RavanaLiveSection] load failed:', error)), []);

  useEffect(() => {
    const timer = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const status = getLiveStatus(settings);
  const cleanId = sanitizeYouTubeVideoId(settings.youtubeVideoId);
  const sessionDate = toDate(settings.sessionDateTime);
  const parts = getCountdownParts(settings.sessionDateTime);

  return (
    <section id="ravana-live" className="section bg-[var(--theme-section)]">
      <div className="container-shell">
        <article className="live-home-card">
          <div>
            <LiveStatusBadge settings={settings} />
            <h2 className="mt-4 text-4xl font-black">{t('live.title')}</h2>
            <h3 className="mt-3 text-2xl font-black text-[var(--theme-accent)]">{settings.sessionTitle || t('live.liveSessions')}</h3>
            <p className="mt-3 max-w-3xl leading-8 opacity-90">{settings.sessionDescription || settings.offlineMessage || t('live.empty')}</p>
            {status === 'upcoming' && sessionDate && <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{[[t('weekly.days'), parts.days], [t('weekly.hours'), parts.hours], [t('weekly.minutes'), parts.minutes], [t('weekly.seconds'), parts.seconds]].map(([label, value]) => <div className="rounded-lg bg-black/20 p-3 text-center" key={label}><b className="block text-2xl text-[var(--theme-accent)]">{String(value).padStart(2, '0')}</b><span className="text-xs font-bold">{label}</span></div>)}</div>}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link className="btn btn-gold" to="/live"><PlayCircle size={18} />{settings.isLiveEnabled && cleanId ? t('live.joinNow') : t('live.joinLive')}</Link>
              {settings.youtubeChannelUrl && <a className="btn btn-outline border-[var(--theme-accent)] text-[var(--theme-hero-text)]" href={settings.youtubeChannelUrl} target="_blank" rel="noreferrer">{t('live.subscribe')}</a>}
            </div>
          </div>
          <div className="live-home-placeholder"><Bell size={56} /><span>YouTube Live</span></div>
        </article>
      </div>
    </section>
  );
}
