import { collection, doc, onSnapshot } from 'firebase/firestore';
import { Bell, PlayCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import Footer from '../components/public/Footer.jsx';
import Header from '../components/public/Header.jsx';
import { LiveChat, LivePlayer, LiveStatusBadge, PastSessions } from '../components/public/YouTubeLive.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { db } from '../firebase.js';
import { getCountdownParts, getLiveStatus, normalizeLiveSettings, sanitizeYouTubeVideoId, toDate } from '../lib/youtubeLive.js';
import { normalizeLiveSession } from '../lib/liveSessions.js';

export default function LivePage() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState(normalizeLiveSettings());
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(Date.now());

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, 'siteSettings', 'liveSession'), (snap) => {
      setSettings(normalizeLiveSettings(snap.exists() ? snap.data() : {}));
      setLoading(false);
    }, (err) => {
      console.error('[LivePage] settings load failed:', err);
      setError('Could not load live session. Please try again later.');
      setLoading(false);
    });
    const unsubSessions = onSnapshot(collection(db, 'liveSessions'), (snap) => {
      setSessions(snap.docs.map((item) => normalizeLiveSession(item.data(), item.id)));
    }, (err) => console.error('[LivePage] manual recordings load failed:', err));
    return () => { unsubSettings(); unsubSessions(); };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const cleanVideoId = sanitizeYouTubeVideoId(settings.youtubeVideoId);
  const status = getLiveStatus(settings);
  const sessionDate = toDate(settings.sessionDateTime);
  const parts = getCountdownParts(settings.sessionDateTime);
  const title = settings.sessionTitle || t('live.title');
  const description = settings.sessionDescription || settings.offlineMessage || t('live.empty');

  return (
    <>
      <Header />
      <main className="bg-[var(--theme-page)]">
        <section className="bg-[var(--theme-hero)] py-14 text-[var(--theme-hero-text)]">
          <div className="container-shell">
            <p className="text-sm font-black uppercase text-[var(--theme-accent)]">YouTube Live</p>
            <h1 className="mt-3 text-5xl font-black">{t('live.title')}</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[color-mix(in_srgb,var(--theme-hero-text)_82%,var(--theme-accent))]">{t('live.subtitle')}</p>
          </div>
        </section>

        <section className="section">
          <div className="container-shell grid gap-8">
            {loading && <p className="surface rounded-lg p-5 font-bold text-[var(--theme-muted)]">{t('common.loading')}</p>}
            {error && <p className="surface rounded-lg p-5 font-bold text-[var(--theme-muted)]">{error}</p>}

            <article className="youtube-live-shell">
              <div className="youtube-live-header">
                <div>
                  <LiveStatusBadge settings={settings} />
                  <h2 className="mt-4 text-4xl font-black text-[var(--theme-primary)]">{title}</h2>
                  <p className="mt-3 max-w-3xl whitespace-pre-wrap leading-8 text-[var(--theme-muted)]">{description}</p>
                  {sessionDate && <p className="mt-3 font-black text-[var(--theme-primary)]">{sessionDate.toLocaleString()}</p>}
                </div>
                {status === 'upcoming' && <Countdown parts={parts} />}
              </div>

              {cleanVideoId ? (
                <>
                  <div className={`youtube-live-grid ${settings.showLiveChat ? '' : 'youtube-live-grid-video-only'}`}>
                    <LivePlayer videoId={cleanVideoId} title={title} />
                    {settings.showLiveChat && <LiveChat videoId={cleanVideoId} />}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <a className="btn btn-primary" href={`https://www.youtube.com/watch?v=${cleanVideoId}`} target="_blank" rel="noreferrer"><PlayCircle size={18} />{t('live.watchYoutube')}</a>
                    {settings.youtubeChannelUrl && <a className="btn btn-outline" href={settings.youtubeChannelUrl} target="_blank" rel="noreferrer">{t('live.subscribe')}</a>}
                    {settings.showSupportButton && settings.supportButtonUrl && <a className="btn btn-outline" href={settings.supportButtonUrl} target="_blank" rel="noreferrer">{settings.supportButtonText || 'Support'}</a>}
                  </div>
                </>
              ) : (
                <div className="youtube-live-empty">
                  <Bell className="text-[var(--theme-accent)]" size={42} />
                  <h2 className="mt-4 text-3xl font-black text-[var(--theme-primary)]">{t('live.empty')}</h2>
                  {sessionDate && <Countdown parts={parts} />}
                  <p className="mt-4 text-[var(--theme-muted)]">{settings.offlineMessage}</p>
                  {settings.youtubeChannelUrl && <a className="btn btn-primary mt-5" href={settings.youtubeChannelUrl} target="_blank" rel="noreferrer">{t('live.subscribe')}</a>}
                </div>
              )}
            </article>

            <PastSessions settings={settings} sessions={sessions} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Countdown({ parts }) {
  const { t } = useLanguage();
  return (
    <div className="grid grid-cols-4 gap-2">
      {[[t('weekly.days'), parts.days], [t('weekly.hours'), parts.hours], [t('weekly.minutes'), parts.minutes], [t('weekly.seconds'), parts.seconds]].map(([label, value]) => (
        <div className="rounded-lg bg-[var(--theme-section)] p-3 text-center" key={label}>
          <b className="block text-2xl text-[var(--theme-primary)]">{String(value).padStart(2, '0')}</b>
          <span className="text-xs font-bold uppercase text-[var(--theme-muted)]">{label}</span>
        </div>
      ))}
    </div>
  );
}
