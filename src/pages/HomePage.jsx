import About from '../components/public/About.jsx';
import Banners from '../components/public/Banners.jsx';
import Contact from '../components/public/Contact.jsx';
import AnonymousGuidance from '../components/public/AnonymousGuidance.jsx';
import Hero from '../components/public/Hero.jsx';
import NextWeeklySession from '../components/public/NextWeeklySession.jsx';
import Services from '../components/public/Services.jsx';
import Support from '../components/public/Support.jsx';
import Videos from '../components/public/Videos.jsx';
import WeeklySession from '../components/public/WeeklySession.jsx';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { db } from '../firebase.js';
import { mergeHomepageSections } from '../lib/siteSettings.js';

export default function HomePage() {
  const [sections, setSections] = useState(mergeHomepageSections());
  useEffect(() => onSnapshot(doc(db, 'siteSettings', 'homepageSections'), (snap) => {
    setSections(mergeHomepageSections(snap.exists() ? snap.data().sections : []));
  }, (error) => {
    console.error('Failed to load homepage section settings', error);
    setSections(mergeHomepageSections());
  }), []);

  const sectionMap = useMemo(() => ({
    hero: <Hero />,
    banners: <Banners />,
    about: <About />,
    services: <Services />,
    videos: <Videos />,
    guidance: <AnonymousGuidance compact />,
    weeklySession: <><NextWeeklySession /><WeeklySession /></>,
    support: <Support />,
    contact: <Contact />,
    faq: <OptionalSection title="FAQ" />,
    testimonials: <OptionalSection title="Testimonials" />,
    customHtml: <OptionalSection title="Custom Section" />,
  }), []);

  return (
    <>
      {sections.filter((section) => section.enabled).map((section) => (
        <section key={section.id} id={section.id}>
          {(section.title || section.subtitle) && ['faq', 'testimonials', 'customHtml'].includes(section.id) ? (
            <OptionalSection title={section.title || section.label} subtitle={section.subtitle} />
          ) : sectionMap[section.id] || null}
        </section>
      ))}
    </>
  );
}

function OptionalSection({ title, subtitle }) {
  if (!title && !subtitle) return null;
  return (
    <section className="section">
      <div className="container-shell surface rounded-lg p-6">
        {title && <h2 className="text-3xl font-black text-[var(--theme-primary)]">{title}</h2>}
        {subtitle && <p className="mt-3 text-[var(--theme-muted)]">{subtitle}</p>}
      </div>
    </section>
  );
}
