import { doc, onSnapshot } from 'firebase/firestore';
import { LogIn, MessageCircle, PlayCircle, Video } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../firebase.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { defaultHomeSections } from '../../lib/homeContent.js';
import { createContactWhatsAppMessage, openWhatsApp } from '../../utils/whatsapp.js';

export default function Hero() {
  const [hero, setHero] = useState(defaultHomeSections.hero);
  const [settings, setSettings] = useState({ whatsappNumber: '94777193197', displayWhatsappNumber: '+94 77 719 3197' });
  const { getLocalized, t } = useLanguage();

  useEffect(() => onSnapshot(doc(db, 'homeSections', 'hero'), (snap) => {
    if (snap.exists()) setHero({ ...defaultHomeSections.hero, ...snap.data() });
  }, (error) => {
    console.error('Failed to load hero content from homeSections/hero', error);
  }), []);

  useEffect(() => onSnapshot(doc(db, 'siteSettings', 'main'), (snap) => {
    if (snap.exists()) setSettings((current) => ({ ...current, ...snap.data() }));
  }, (error) => {
    console.error('Failed to load hero contact settings from siteSettings/main', error);
  }), []);

  return (
    <section id="home" className="relative overflow-hidden bg-[var(--theme-hero)] text-[var(--theme-hero-text)]">
      <div className="container-shell grid min-h-[680px] items-center gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="text-sm font-bold text-[var(--theme-accent)]">{hero.eyebrow}</p>
          <h1 className="mt-4 text-5xl font-black leading-tight sm:text-7xl">{getLocalized(hero, 'title', hero.title)}</h1>
          <p className="mt-3 text-2xl font-bold text-[color-mix(in_srgb,var(--theme-accent)_76%,white)]">{getLocalized(hero, 'subtitle', hero.subtitle)}</p>
          <p className="mt-6 max-w-2xl whitespace-pre-wrap text-lg leading-8 text-[color-mix(in_srgb,var(--theme-hero-text)_84%,var(--theme-accent))]">{getLocalized(hero, 'description', hero.description)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button className="btn btn-gold" onClick={() => openWhatsApp(settings.whatsappNumber, createContactWhatsAppMessage())}><MessageCircle size={19} />{getLocalized(hero, 'primaryLabel', hero.primaryLabel)}</button>
            <a className="btn btn-outline border-[color-mix(in_srgb,var(--theme-accent)_55%,transparent)] text-[var(--theme-hero-text)]" href={hero.secondaryUrl || '/videos'}><PlayCircle size={19} />{getLocalized(hero, 'secondaryLabel', hero.secondaryLabel)}</a>
            <a className="btn btn-outline border-[color-mix(in_srgb,var(--theme-accent)_55%,transparent)] text-[var(--theme-hero-text)]" href="#session"><Video size={19} />{t('nav.weeklySession')}</a>
            <Link className="btn btn-outline border-[color-mix(in_srgb,var(--theme-accent)_55%,transparent)] text-[var(--theme-hero-text)]" to="/login"><LogIn size={19} />{t('hero.loginProgress')}</Link>
          </div>
        </div>
        <div className="flex justify-center">
          <img src={hero.imageUrl || '/ravana-bhawana-logo.png'} alt={getLocalized(hero, 'title', 'Ravana Bhavana')} className="w-full max-w-[500px] rounded-full border border-[color-mix(in_srgb,var(--theme-accent)_40%,transparent)] shadow-2xl transition duration-300 hover:scale-[1.025]" />
        </div>
      </div>
      <div className="border-y border-[color-mix(in_srgb,var(--theme-accent)_26%,transparent)] bg-[color-mix(in_srgb,var(--theme-hero)_82%,var(--theme-primary))] py-4">
        <div className="container-shell flex flex-col gap-2 text-sm font-bold sm:flex-row sm:items-center sm:justify-between">
          <span>{t('hero.voice')}</span>
          <span className="text-[var(--theme-accent)]">{settings.displayWhatsappNumber}</span>
        </div>
      </div>
    </section>
  );
}
