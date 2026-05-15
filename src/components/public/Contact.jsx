import { Phone, PlayCircle, Send, Share2, Users } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../../firebase.js';
import { createContactWhatsAppMessage, openWhatsApp } from '../../utils/whatsapp.js';

export default function Contact() {
  const [settings, setSettings] = useState({ displayWhatsappNumber: '+94 77 719 3197', whatsappNumber: '94777193197', phoneNumber: '+94 77 719 3197' });
  useEffect(() => onSnapshot(doc(db, 'siteSettings', 'main'), (snap) => snap.exists() && setSettings((s) => ({ ...s, ...snap.data() }))), []);
  return (
    <section id="contact" className="section bg-[#f8f0df]">
      <div className="container-shell">
        <p className="eyebrow">Contact</p><h2 className="mt-3 text-4xl font-black text-[#3a2115]">සම්බන්ධ වන්න</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button className="surface rounded-lg p-5 text-left" onClick={() => openWhatsApp(settings.whatsappNumber, createContactWhatsAppMessage())}><Send className="text-[#b88934]" /><b className="mt-3 block">WhatsApp direct message</b><span>{settings.displayWhatsappNumber}</span></button>
          <a className="surface rounded-lg p-5" href={settings.whatsappGroupUrl || '#'}><Users className="text-[#b88934]" /><b className="mt-3 block">WhatsApp group</b></a>
          <a className="surface rounded-lg p-5" href={settings.youtubeChannelUrl || '#'}><PlayCircle className="text-[#b88934]" /><b className="mt-3 block">YouTube channel</b></a>
          <a className="surface rounded-lg p-5" href={settings.facebookPageUrl || '#'}><Share2 className="text-[#b88934]" /><b className="mt-3 block">Facebook page</b></a>
        </div>
        <p className="mt-6 flex items-center gap-2 font-black text-[#3a2115]"><Phone size={18} />{settings.phoneNumber}</p>
      </div>
    </section>
  );
}
