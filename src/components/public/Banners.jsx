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
    <section className="bg-[#fffaf0] py-6">
      <div className="container-shell grid gap-3">
        {banners.map((banner) => (
          <article key={banner.id} className="surface flex flex-col gap-4 rounded-lg p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <Megaphone className="mt-1 text-[#b88934]" />
              <div><h2 className="font-black text-[#3a2115]">{banner.title}</h2><p className="mt-1 text-[#6f4a31]">{banner.message}</p></div>
            </div>
            {banner.buttonUrl && <a className="btn btn-primary" href={banner.buttonUrl} target="_blank" rel="noreferrer">{banner.buttonText || 'Open'}</a>}
          </article>
        ))}
      </div>
    </section>
  );
}
