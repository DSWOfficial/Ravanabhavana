import { onSnapshot } from 'firebase/firestore';
import { Award, HeartHandshake } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { cacheBustedImageUrl, defaultHomeSections, homeSectionDoc, homeSectionPath } from '../../lib/homeContent.js';

export default function About() {
  const [about, setAbout] = useState(null);
  const { getLocalized, t } = useLanguage();
  useEffect(() => onSnapshot(homeSectionDoc('about'), (snap) => {
    setAbout(snap.exists() ? snap.data() : defaultHomeSections.about);
  }, (error) => {
    console.error(`Failed to load about content from ${homeSectionPath('about')}`, error);
  }), []);

  if (!about) {
    return (
      <section id="about" className="section bg-[var(--theme-surface)]" aria-busy="true">
        <div className="container-shell">{t('common.loading')}</div>
      </section>
    );
  }

  return (
    <section id="about" className="section bg-[var(--theme-surface)]">
      <div className="container-shell grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div className="flex flex-col items-start">
          <p className="eyebrow">{getLocalized(about, 'eyebrow', about.eyebrow)}</p>
          <h2 className="mt-3 text-4xl font-black text-[var(--theme-primary)]">{getLocalized(about, 'heading', about.heading)}</h2>
          <p className="mt-1 text-xl font-bold text-[var(--theme-muted)]">{getLocalized(about, 'subheading', about.subheading)}</p>
          <div className="mt-7 w-full max-w-sm overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--theme-accent)_35%,transparent)] bg-[var(--theme-hero)] p-2 shadow-2xl transition duration-300 hover:-translate-y-1">
            <img src={cacheBustedImageUrl(about.imageUrl || '/profilepic.png?v=2', about.updatedAt)} alt={getLocalized(about, 'heading', about.heading)} className="aspect-[4/5] w-full rounded-lg object-cover" />
          </div>
        </div>
        <div className="surface rounded-lg p-7">
          <div className="flex flex-wrap gap-3">
            {(about.features || []).map((feature, index) => (
              <span className="btn btn-outline" key={feature}>{index % 2 ? <Award size={18} /> : <HeartHandshake size={18} />}{feature === 'Professional counselling support' ? t('about.counselling') : feature === 'Free community service' ? t('about.free') : feature}</span>
            ))}
          </div>
          <p className="mt-6 whitespace-pre-wrap text-lg leading-8 text-[var(--theme-text)]">{getLocalized(about, 'description', about.description)}</p>
        </div>
      </div>
    </section>
  );
}
