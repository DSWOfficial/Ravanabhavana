import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Megaphone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { db } from '../../firebase.js';
import { toDate } from '../../utils/dateTime.js';

export default function Banners() {
  const [banners, setBanners] = useState([]);
  useEffect(() => {
    return onSnapshot(query(collection(db, 'banners'), where('isActive', '==', true)), (snap) => {
      const now = Date.now();
      setBanners(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })).filter((banner) => {
        const start = toDate(banner.startDate)?.getTime() ?? 0;
        const end = toDate(banner.endDate)?.getTime() ?? Infinity;
        return start <= now && now <= end;
      }));
    });
  }, []);
  if (!banners.length) return null;
  return (
    <section className="bg-[var(--theme-surface)] py-6">
      <div className="container-shell grid gap-3">
        {banners.map((banner) => (
          <article key={banner.id} className="surface interactive-card flex flex-col gap-4 rounded-lg p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <Megaphone className="mt-1 text-[var(--theme-accent)]" />
              <div><h2 className="font-black text-[var(--theme-primary)]">{banner.title}</h2><p className="mt-1 text-[var(--theme-muted)]">{banner.message}</p></div>
            </div>
            {banner.buttonUrl && <a className="btn btn-primary" href={banner.buttonUrl} target="_blank" rel="noreferrer">{banner.buttonText || 'Open'}</a>}
          </article>
        ))}
      </div>
    </section>
  );
}
