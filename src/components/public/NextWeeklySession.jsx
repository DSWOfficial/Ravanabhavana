import { collection, getDocs, query, where } from 'firebase/firestore';
import { Bell, CalendarPlus, Video } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { db } from '../../firebase.js';
import { getCountdownParts } from '../../utils/dateTime.js';

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  if (value instanceof Date) return value;
  return new Date(value);
}

function calendarUrl(session, start) {
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const fmt = (date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const details = `${session.description || ''}${session.joinUrl ? `\n\nJoin: ${session.joinUrl}` : ''}`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(session.title)}&details=${encodeURIComponent(details)}&dates=${fmt(start)}/${fmt(end)}`;
}

export default function NextWeeklySession() {
  const [sessions, setSessions] = useState([]);
  const [tick, setTick] = useState(Date.now());

  useEffect(() => {
    getDocs(query(collection(db, 'weeklySessions'), where('isPublished', '==', true), where('isActive', '==', true)))
      .then((snap) => setSessions(snap.docs.map((item) => ({ id: item.id, ...item.data() }))))
      .catch((error) => console.error('[NextWeeklySession] load failed:', error));
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const next = useMemo(() => sessions.map((session) => ({ ...session, date: toDate(session.sessionDateTime) })).filter((session) => session.date && session.date.getTime() >= tick - 1000).sort((a, b) => a.date - b.date)[0], [sessions, tick]);

  if (!next) {
    return (
      <section id="weekly-sessions" className="section bg-[var(--theme-section)]">
        <div className="container-shell"><div className="surface rounded-lg p-8 text-center"><h2 className="text-3xl font-black text-[var(--theme-primary)]">Next Weekly Session</h2><p className="mt-3 text-[var(--theme-muted)]">Next weekly session will be announced soon.</p></div></div>
      </section>
    );
  }

  const parts = getCountdownParts(next.date);
  const live = parts.isPast;
  const reminder = next.whatsappReminderText || 'I want to get a reminder for the next Ravana Bhavana weekly session.';

  return (
    <section id="weekly-sessions" className="section bg-[var(--theme-section)]">
      <div className="container-shell">
        <article className="overflow-hidden rounded-lg bg-[var(--theme-hero)] text-[var(--theme-hero-text)] shadow-2xl lg:grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-7 sm:p-9">
            <p className="text-sm font-black uppercase text-[var(--theme-accent)]">Next Weekly Session</p>
            <h2 className="mt-3 text-4xl font-black">{next.title}</h2>
            <p className="mt-2 text-xl font-bold text-[var(--theme-accent)]">{next.topic}</p>
            <p className="mt-4 whitespace-pre-wrap leading-8 opacity-90">{next.description}</p>
            <p className="mt-4 font-bold">Host: {next.hostName || 'Ravana Bhavana'}</p>
            <p className="mt-2 font-bold">{next.date.toLocaleString()}</p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {live ? <div className="col-span-full rounded-lg bg-[var(--theme-accent)] p-4 text-center font-black text-[var(--theme-hero)]">Session is live now</div> : [['Days', parts.days], ['Hours', parts.hours], ['Minutes', parts.minutes], ['Seconds', parts.seconds]].map(([label, value]) => <div className="rounded-lg bg-black/25 p-4 text-center" key={label}><b className="block text-3xl text-[var(--theme-accent)]">{String(value).padStart(2, '0')}</b><span className="text-xs font-bold uppercase">{label}</span></div>)}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {next.joinUrl && <a className="btn btn-primary" href={next.joinUrl} target="_blank" rel="noreferrer"><Video size={18} />{live ? 'Join now' : 'Join link'}</a>}
              <a className="btn btn-outline border-[var(--theme-accent)] text-[var(--theme-hero-text)]" href={`https://wa.me/?text=${encodeURIComponent(reminder)}`} target="_blank" rel="noreferrer"><Bell size={18} />WhatsApp reminder</a>
              <a className="btn btn-outline border-[var(--theme-accent)] text-[var(--theme-hero-text)]" href={calendarUrl(next, next.date)} target="_blank" rel="noreferrer"><CalendarPlus size={18} />Add to Calendar</a>
            </div>
          </div>
          {next.imageUrl && <img src={next.imageUrl} alt="" className="h-full min-h-72 w-full object-cover" />}
        </article>
      </div>
    </section>
  );
}
