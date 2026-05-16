import { collection, doc, onSnapshot, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { CalendarClock, Video } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { db } from '../../firebase.js';
import { formatSinhalaDate, getCountdownParts, getNextWeeklySession, isSessionExpired } from '../../utils/dateTime.js';

function LiveCountdown({ targetDate }) {
  const [parts, setParts] = useState(() => getCountdownParts(targetDate));

  useEffect(() => {
    setParts(getCountdownParts(targetDate));
    const timer = window.setInterval(() => {
      setParts(getCountdownParts(targetDate));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [targetDate]);

  const items = [
    ['දින', parts.days],
    ['පැය', parts.hours],
    ['මිනිත්තු', parts.minutes],
    ['තත්පර', parts.seconds],
  ];

  return (
    <div className="live-countdown rounded-lg bg-[var(--theme-surface)] p-4">
      <p className="text-xs font-black uppercase text-[var(--theme-muted)]">සජීවී ඉතිරි කාලය</p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {items.map(([label, value]) => (
          <div className="countdown-tile rounded-lg border border-[color-mix(in_srgb,var(--theme-accent)_30%,transparent)] bg-[var(--theme-hero)] px-3 py-4 text-center text-[var(--theme-hero-text)]" key={label}>
            <span className="countdown-number block text-3xl font-black leading-none text-[var(--theme-accent)]">
              {String(value).padStart(2, '0')}
            </span>
            <span className="mt-2 block text-xs font-bold text-[var(--theme-hero-text)]">{label}</span>
          </div>
        ))}
      </div>
      {parts.isPast && <p className="mt-3 text-sm font-bold text-[var(--theme-muted)]">සැසි කාලය ආරම්භ වී ඇත.</p>}
    </div>
  );
}

export default function WeeklySession() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [schedule, setSchedule] = useState({
    day: 'Saturday',
    startTime: '20:00',
    endTime: '20:40',
    description: 'සතිපතා Zoom සැසිය',
    isActive: true,
  });

  useEffect(() => onSnapshot(query(collection(db, 'sessions'), where('isActive', '==', true)), (snap) => {
    setSessions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }), []);

  useEffect(() => onSnapshot(doc(db, 'weeklySchedule', 'main'), (snap) => {
    if (snap.exists()) setSchedule(snap.data());
  }), []);

  const active = useMemo(() => sessions.find((s) => !isSessionExpired(s.expiresAt)), [sessions]);
  const next = useMemo(() => (
    active
      ? new Date(`${active.sessionDate}T${active.startTime || '20:00'}:00+05:30`)
      : getNextWeeklySession(schedule)
  ), [active, schedule]);

  const join = async () => {
    if (user && active) {
      await setDoc(doc(db, 'userSessionJoins', `${user.uid}_${active.id}`), {
        userId: user.uid,
        sessionId: active.id,
        joinedAt: serverTimestamp(),
        sessionTitle: active.title,
        sessionDate: active.sessionDate,
      }, { merge: true });
    }
    if (active?.zoomUrl) window.open(active.zoomUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <section id="session" className="section bg-[var(--theme-section)]">
      <div className="container-shell grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="eyebrow">Weekly Session</p>
          <h2 className="mt-3 text-4xl font-black text-[var(--theme-primary)]">සතිපතා Zoom සැසිය</h2>
          <p className="mt-4 leading-7 text-[var(--theme-muted)]">{schedule.description}</p>
        </div>

        <div className="surface rounded-lg p-7">
          <CalendarClock className="text-[var(--theme-accent)]" size={32} />
          <h3 className="mt-4 text-2xl font-black text-[var(--theme-primary)]">{active?.title || 'ඉදිරි සජීවී සැසිය'}</h3>
          <p className="mt-2 text-[var(--theme-muted)]">
            {active?.description || `${schedule.day} ${schedule.startTime} - ${schedule.endTime} Sri Lanka time`}
          </p>

          <div className="mt-5 grid gap-3">
            <div className="rounded-lg bg-[var(--theme-surface)] p-4 font-bold text-[var(--theme-text)]">{formatSinhalaDate(next)}</div>
            <LiveCountdown targetDate={next} />
          </div>

          {active ? (
            <button className="btn btn-primary mt-6" onClick={join}>
              <Video size={18} />Join Zoom
            </button>
          ) : (
            <p className="mt-6 font-semibold text-[var(--theme-muted)]">Zoom link එක ඉක්මනින් පළ කරනු ඇත.</p>
          )}
        </div>
      </div>
    </section>
  );
}
