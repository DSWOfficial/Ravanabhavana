import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Maximize2 } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { db } from '../../firebase.js';

export default function LiveMeetingRoom({ session, roomName, userName, userEmail, isAdminHost = false }) {
  const frameRef = useRef(null);
  const { user } = useAuth();
  const { t } = useLanguage();
  const safeRoom = encodeURIComponent(roomName || session?.roomName || 'ravana-bhawana-live');
  const displayName = encodeURIComponent(userName || user?.displayName || userEmail || user?.email || 'Guest');
  const jitsiUrl = useMemo(() => {
    const muted = isAdminHost ? 'false' : 'true';
    return `https://meet.jit.si/${safeRoom}#config.startWithAudioMuted=${muted}&config.startWithVideoMuted=${muted}&config.prejoinPageEnabled=true&config.disableDeepLinking=true&userInfo.displayName="${displayName}"`;
  }, [displayName, isAdminHost, safeRoom]);

  useEffect(() => {
    if (!user || !session?.id) return undefined;
    const id = `${user.uid}_${session.id}`;
    setDoc(doc(db, 'liveSessionAttendance', id), {
      userId: user.uid,
      userEmail: user.email || '',
      sessionId: session.id,
      sessionSlug: session.slug,
      joinedAt: serverTimestamp(),
      displayName: user.displayName || user.email || '',
    }, { merge: true }).catch((error) => console.error('Live attendance tracking failed', error));
    return () => {
      setDoc(doc(db, 'liveSessionAttendance', id), { leftAt: serverTimestamp() }, { merge: true }).catch((error) => console.error('Live attendance leave update failed', error));
    };
  }, [session?.id, session?.slug, user]);

  const fullscreen = () => frameRef.current?.requestFullscreen?.();

  return (
    <section className="live-meeting-card grid gap-4">
      <div className="rounded-lg bg-[var(--theme-section)] p-4">
        <p className="font-black text-[var(--theme-primary)]">{t('live.meetingFeatures')}</p>
        <p className="mt-2 font-semibold text-[var(--theme-muted)]">{t('live.meetingEtiquette')}</p>
      </div>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="font-bold text-[var(--theme-muted)]">{t('live.meetingNotice')}</p>
        <button className="btn btn-outline" type="button" onClick={fullscreen}><Maximize2 size={17} />Fullscreen</button>
      </div>
      <iframe
        ref={frameRef}
        className="live-meeting-frame"
        src={jitsiUrl}
        title={session?.title_en || session?.title_si || 'Ravana Bhavana Live'}
        allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
      />
    </section>
  );
}
