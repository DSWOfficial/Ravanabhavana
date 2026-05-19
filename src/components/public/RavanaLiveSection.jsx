import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Bell, PlayCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LiveStatusBadge } from './YouTubeLive.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { db } from '../../firebase.js';
import { normalizeLiveSession, sanitizeYouTubeVideoId } from '../../lib/youtubeLive.js';

export default function RavanaLiveSection() {
  const { t } = useLanguage();
  const [session, setSession] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'liveSessions'), where('status', '==', 'live'), where('isVisible', '==', true));
    return onSnapshot(q, (snap) => {
      setSession(snap.docs.map((item) => normalizeLiveSession(item.data(), item.id))[0] || null);
      setLoaded(true);
    }, (error) => {
      console.error('[RavanaLiveSection] active live load failed:', error);
      setLoaded(true);
    });
  }, []);

  if (loaded && !session) {
    return (
      <section id="ravana-live" className="section bg-[var(--theme-section)]">
        <div className="container-shell">
          <article className="live-home-mini">
            <Bell className="text-[var(--theme-accent)]" size={26} />
            <div>
              <h2 className="text-2xl font-black text-[var(--theme-primary)]">{t('live.title')}</h2>
              <p className="mt-1 text-[var(--theme-muted)]">No live session is active right now. Please check back for the next weekly session.</p>
            </div>
          </article>
        </div>
      </section>
    );
  }

  if (!session) return null;
  const hasVideo = Boolean(sanitizeYouTubeVideoId(session.youtubeUrl));

  return (
    <section id="ravana-live" className="section bg-[var(--theme-section)]">
      <div className="container-shell">
        <article className="live-home-card live-home-card-active">
          <div>
            <LiveStatusBadge settings={session} />
            <h2 className="mt-4 text-4xl font-black">{t('live.title')}</h2>
            <h3 className="mt-3 text-2xl font-black text-[var(--theme-accent)]">{session.title}</h3>
            <p className="mt-3 max-w-3xl leading-8 opacity-90">{session.description}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link className="btn btn-gold" to="/live"><PlayCircle size={18} />{hasVideo ? t('live.joinNow') : t('live.joinLive')}</Link>
            </div>
          </div>
          {session.thumbnailUrl ? <img src={session.thumbnailUrl} alt="" className="live-home-image" /> : <div className="live-home-placeholder"><Bell size={56} /><span>YouTube Live</span></div>}
        </article>
      </div>
    </section>
  );
}
