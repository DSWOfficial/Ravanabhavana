import { collection, doc, onSnapshot, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { CalendarClock, Video } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { db } from '../../firebase.js';
import { formatSinhalaDate, getCountdown, getNextWeeklySession, isSessionExpired } from '../../utils/dateTime.js';

export default function WeeklySession() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [schedule, setSchedule] = useState({ day: 'Saturday', startTime: '20:00', endTime: '20:40', description: 'සතිපතා Zoom සැසිය', isActive: true });
  useEffect(() => onSnapshot(query(collection(db, 'sessions'), where('isActive', '==', true)), (snap) => setSessions(snap.docs.map((d) => ({ id: d.id, ...d.data() })))), []);
  useEffect(() => onSnapshot(doc(db, 'weeklySchedule', 'main'), (snap) => snap.exists() && setSchedule(snap.data())), []);
  const active = useMemo(() => sessions.find((s) => !isSessionExpired(s.expiresAt)), [sessions]);
  const next = active ? new Date(`${active.sessionDate}T${active.startTime || '20:00'}:00+05:30`) : getNextWeeklySession(schedule);
  const join = async () => {
    if (user && active) {
      await setDoc(doc(db, 'userSessionJoins', `${user.uid}_${active.id}`), {
        userId: user.uid, sessionId: active.id, joinedAt: serverTimestamp(), sessionTitle: active.title, sessionDate: active.sessionDate,
      }, { merge: true });
    }
    if (active?.zoomUrl) window.open(active.zoomUrl, '_blank', 'noopener,noreferrer');
  };
  return (
    <section id="session" className="section bg-[#f8f0df]">
      <div className="container-shell grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div><p className="eyebrow">Weekly Session</p><h2 className="mt-3 text-4xl font-black text-[#3a2115]">සතිපතා Zoom සැසිය</h2><p className="mt-4 leading-7 text-[#6f4a31]">{schedule.description}</p></div>
        <div className="surface rounded-lg p-7">
          <CalendarClock className="text-[#b88934]" size={32} />
          <h3 className="mt-4 text-2xl font-black text-[#3a2115]">{active?.title || 'ඉදිරි සජීවී සැසිය'}</h3>
          <p className="mt-2 text-[#6f4a31]">{active?.description || `${schedule.day} ${schedule.startTime} - ${schedule.endTime} Sri Lanka time`}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-[#fffaf0] p-4 font-bold">{formatSinhalaDate(next)}</div>
            <div className="rounded-lg bg-[#fffaf0] p-4 font-bold">ඉතිරි කාලය: {getCountdown(next)}</div>
          </div>
          {active ? <button className="btn btn-primary mt-6" onClick={join}><Video size={18} />Join Zoom</button> : <p className="mt-6 font-semibold text-[#6f4a31]">Zoom link එක ඉක්මනින් පළ කරනු ඇත.</p>}
        </div>
      </div>
    </section>
  );
}
