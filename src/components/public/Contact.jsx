import { doc, onSnapshot } from 'firebase/firestore';
import { Phone, PlayCircle, Send, Share2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { db } from '../../firebase.js';
import { createContactWhatsAppMessage, openWhatsApp } from '../../utils/whatsapp.js';

export default function Contact() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState({ displayWhatsappNumber: '+94 77 719 3197', whatsappNumber: '94777193197', phoneNumber: '+94 77 719 3197' });
  useEffect(() => onSnapshot(doc(db, 'siteSettings', 'main'), (snap) => snap.exists() && setSettings((s) => ({ ...s, ...snap.data() })), (error) => {
    console.error('Failed to load contact settings from siteSettings/main', error);
  }), []);
  return (
    <section id="contact" className="section bg-[var(--theme-section)]">
      <div className="container-shell">
        <p className="eyebrow">{t('contact.title')}</p>
        <h2 className="mt-3 text-4xl font-black text-[var(--theme-primary)]">{t('contact.title')}</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button className="surface rounded-lg p-5 text-left" onClick={() => openWhatsApp(settings.whatsappNumber, createContactWhatsAppMessage())}><Send className="text-[var(--theme-accent)]" /><b className="mt-3 block text-[var(--theme-primary)]">{t('contact.whatsappDirect')}</b><span>{settings.displayWhatsappNumber}</span></button>
          <a className="surface rounded-lg p-5" href={settings.whatsappGroupUrl || '#'}><Users className="text-[var(--theme-accent)]" /><b className="mt-3 block text-[var(--theme-primary)]">{t('contact.whatsappGroup')}</b></a>
          <a className="surface rounded-lg p-5" href={settings.youtubeChannelUrl || '#'}><PlayCircle className="text-[var(--theme-accent)]" /><b className="mt-3 block text-[var(--theme-primary)]">{t('contact.youtube')}</b></a>
          <a className="surface rounded-lg p-5" href={settings.facebookPageUrl || '#'}><Share2 className="text-[var(--theme-accent)]" /><b className="mt-3 block text-[var(--theme-primary)]">{t('contact.facebook')}</b></a>
        </div>
        <p className="mt-6 flex items-center gap-2 font-black text-[var(--theme-primary)]"><Phone size={18} />{settings.phoneNumber}</p>
      </div>
    </section>
  );
}
