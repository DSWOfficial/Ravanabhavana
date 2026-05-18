import { ExternalLink } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { getLiveStatus, sanitizeYouTubeVideoId } from '../../lib/youtubeLive.js';

export function LivePlayer({ videoId, title }) {
  const cleanId = sanitizeYouTubeVideoId(videoId);
  if (!cleanId) return null;
  return (
    <div className="youtube-live-player">
      <iframe
        src={`https://www.youtube.com/embed/${cleanId}?autoplay=0&rel=0&modestbranding=1`}
        title={title || 'Ravana Bhavana Live'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}

export function LiveChat({ videoId }) {
  const cleanId = sanitizeYouTubeVideoId(videoId);
  if (!cleanId || typeof window === 'undefined') return null;
  const domain = window.location.hostname;
  return (
    <div className="youtube-live-chat">
      <iframe
        src={`https://www.youtube.com/live_chat?v=${cleanId}&embed_domain=${domain}`}
        title="YouTube live chat"
        allow="clipboard-write"
      />
    </div>
  );
}

export function LiveStatusBadge({ settings }) {
  const { t } = useLanguage();
  const status = getLiveStatus(settings);
  const label = {
    live: t('live.liveNow'),
    upcoming: t('live.upcomingStatus'),
    offline: t('live.offlineStatus'),
    replay: t('live.replayAvailable'),
  }[status];
  return <span className={`youtube-live-status youtube-live-status-${status}`}>{label}</span>;
}

export function PastSessions({ settings, sessions = [] }) {
  const { getLocalized, t } = useLanguage();
  if (settings.youtubePlaylistId) {
    return (
      <section className="surface rounded-lg p-5">
        <h2 className="text-3xl font-black text-[var(--theme-primary)]">{t('live.recordings')}</h2>
        <div className="youtube-live-playlist mt-5">
          <iframe
            src={`https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(settings.youtubePlaylistId)}`}
            title="Past live sessions"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </section>
    );
  }
  const recordings = sessions.filter((session) => session.recordingPublished && session.recordingUrl);
  if (!recordings.length) return null;
  return (
    <section>
      <h2 className="text-3xl font-black text-[var(--theme-primary)]">{t('live.recordings')}</h2>
      <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {recordings.map((session) => (
          <article className="surface rounded-lg p-5" key={session.id}>
            <h3 className="text-xl font-black text-[var(--theme-primary)]">{getLocalized(session, 'title', session.title)}</h3>
            <p className="mt-2 text-sm text-[var(--theme-muted)]">{getLocalized(session, 'description', '')}</p>
            <a className="btn btn-primary mt-4" href={session.recordingUrl} target="_blank" rel="noreferrer"><ExternalLink size={17} />{t('live.watchRecording')}</a>
          </article>
        ))}
      </div>
    </section>
  );
}
