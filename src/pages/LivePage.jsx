import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Bell, PlayCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import Footer from '../components/public/Footer.jsx';
import Header from '../components/public/Header.jsx';
import { LiveChat, LivePlayer, LiveStatusBadge } from '../components/public/YouTubeLive.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { db } from '../firebase.js';
import { normalizeLiveSession, sanitizeYouTubeVideoId, toDate } from '../lib/youtubeLive.js';

export default function LivePage() {
  const { t } = useLanguage();
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'liveSessions'), where('status', '==', 'live'), where('isVisible', '==', true));
    return onSnapshot(q, (snap) => {
      const liveSessions = snap.docs.map((item) => normalizeLiveSession(item.data(), item.id));
      setSession(liveSessions[0] || null);
      setLoading(false);
    }, (err) => {
      console.error('[LivePage] active live session load failed:', err);
      setError('Could not load live session. Please try again later.');
      setLoading(false);
    });
  }, []);

  const cleanVideoId = sanitizeYouTubeVideoId(session?.youtubeUrl);
  const title = session?.title || t('live.title');

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
          <div className="container-shell">
            {loading && <p className="surface rounded-lg p-5 font-bold text-[var(--theme-muted)]">{t('common.loading')}</p>}
            {error && <p className="surface rounded-lg p-5 font-bold text-[var(--theme-muted)]">{error}</p>}
            {!loading && !error && !session && <EmptyLiveState />}
            {session && (
              <article className="youtube-live-shell youtube-live-shell-premium">
                <div className="youtube-live-header">
                  <div>
                    <LiveStatusBadge settings={session} />
                    <h2 className="mt-4 text-4xl font-black text-[var(--theme-primary)]">{title}</h2>
                    <p className="mt-3 max-w-3xl whitespace-pre-wrap leading-8 text-[var(--theme-muted)]">{session.description}</p>
                    {toDate(session.startsAt) && <p className="mt-3 font-black text-[var(--theme-primary)]">{toDate(session.startsAt).toLocaleString()}</p>}
                  </div>
                  {session.thumbnailUrl && <img className="hidden max-h-44 rounded-lg object-cover lg:block" src={session.thumbnailUrl} alt="" />}
                </div>

                {cleanVideoId ? (
                  <>
                    <div className="youtube-live-grid">
                      <LivePlayer videoId={cleanVideoId} title={title} />
                      <LiveChat videoId={cleanVideoId} />
                    </div>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <a className="btn btn-primary" href={`https://www.youtube.com/watch?v=${cleanVideoId}`} target="_blank" rel="noreferrer"><PlayCircle size={18} />{t('live.watchYoutube')}</a>
                    </div>
                  </>
                ) : <EmptyLiveState compact />}
              </article>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function EmptyLiveState({ compact = false }) {
  return (
    <div className={`youtube-live-empty ${compact ? '' : 'surface'}`}>
      <Bell className="text-[var(--theme-accent)]" size={42} />
      <h2 className="mt-4 text-3xl font-black text-[var(--theme-primary)]">No live session is active right now.</h2>
      <p className="mt-3 text-[var(--theme-muted)]">Please check back for the next weekly session.</p>
    </div>
  );
}
