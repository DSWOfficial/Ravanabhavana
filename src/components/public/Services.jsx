import { Brain, Landmark, Shield, Sparkles, Stars, Sun } from 'lucide-react';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../../firebase.js';
import { defaultServices } from '../../lib/homeContent.js';

const icons = { Brain, Landmark, Shield, Sparkles, Stars, Sun };

export default function Services() {
  const [services, setServices] = useState(defaultServices);

  useEffect(() => onSnapshot(query(collection(db, 'services'), where('published', '==', true), orderBy('order', 'asc')), (snap) => {
    const items = snap.docs.map((item) => ({ id: item.id, ...item.data() }));
    if (items.length) setServices(items);
  }, (error) => {
    console.error('Failed to load public services from services', error);
  }), []);

  return (
    <section id="services" className="section bg-[var(--theme-section)]">
      <div className="container-shell">
        <p className="eyebrow">Services</p>
        <h2 className="mt-3 text-4xl font-black text-[var(--theme-primary)]">Free Guidance and Support</h2>
        <p className="mt-4 max-w-3xl text-[var(--theme-muted)]">Explore the support areas available through Ravana Bhavana. These can be managed from the homepage CMS.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = icons[service.icon] || Sparkles;
            return (
              <article key={service.id || service.title} className="surface interactive-card rounded-lg p-6">
                {service.imageUrl ? <img src={service.imageUrl} alt="" className="mb-4 aspect-video w-full rounded object-cover" /> : <Icon className="text-[var(--theme-accent)]" size={28} />}
                <h3 className="mt-4 text-xl font-black text-[var(--theme-primary)]">{service.title}</h3>
                <p className="mt-3 leading-7 text-[var(--theme-muted)]">{service.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
