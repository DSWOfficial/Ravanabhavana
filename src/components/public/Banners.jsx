import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { AlertTriangle, Megaphone, PlayCircle, Video, Gift, CalendarClock } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { db } from '../../firebase.js';
import { normalizeBanner } from '../../lib/bannerThemes.js';
import { toDate } from '../../utils/dateTime.js';

const icons = {
  Notice: Megaphone,
  'New Video': PlayCircle,
  'Weekly Session': CalendarClock,
  Donation: Gift,
  'Emergency Update': AlertTriangle,
};

export default function Banners() {
  const [banners, setBanners] = useState([]);
  const { getLocalized } = useLanguage();

  useEffect(() => onSnapshot(query(collection(db, 'banners'), where('isActive', '==', true)), (snap) => {
    setBanners(snap.docs.map((item) => normalizeBanner(item.data(), item.id)));
  }, (error) => {
    console.error('Failed to load active banners from banners', error);
    setBanners([]);
  }), []);

  const active = useMemo(() => {
    const now = Date.now();
    return banners
      .filter((banner) => {
        const start = toDate(banner.startAt)?.getTime() ?? 0;
        const end = toDate(banner.endAt)?.getTime() ?? Infinity;
        return banner.isActive && start <= now && now <= end;
      })
      .sort((a, b) => (b.priority - a.priority) || ((toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0)))[0];
  }, [banners]);

  if (!active) return null;
  const Icon = icons[active.topic] || Video;
  const emergency = active.topic === 'Emergency Update';
  const style = {
    background: active.theme.backgroundColor,
    color: active.theme.textColor,
    borderColor: active.theme.borderColor,
    boxShadow: `0 22px 60px color-mix(in srgb, ${active.theme.accentColor} 26%, transparent)`,
  };

  return (
    <section className="bg-[var(--theme-surface)] py-6">
      <div className="container-shell">
        <article className={`overflow-hidden rounded-lg border-2 ${emergency ? 'animate-pulse' : ''}`} style={style}>
          <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="p-6 sm:p-8">
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide" style={{ backgroundColor: active.theme.accentColor, color: active.theme.backgroundColor }}>
                <Icon size={15} />{active.topic}
              </span>
              <h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">{getLocalized(active, 'title', active.title)}</h2>
              <p className="mt-3 max-w-3xl whitespace-pre-wrap text-lg leading-8 opacity-90">{getLocalized(active, 'message', active.message)}</p>
              {getLocalized(active, 'buttonText', active.buttonText) && active.buttonUrl && <a className="btn mt-6 border-0 font-black" style={{ backgroundColor: active.theme.accentColor, color: active.theme.backgroundColor }} href={active.buttonUrl}>{getLocalized(active, 'buttonText', active.buttonText)}</a>}
            </div>
            {active.imageUrl && <img src={active.imageUrl} alt="" className="h-full min-h-56 w-full object-cover" />}
          </div>
        </article>
      </div>
    </section>
  );
}
