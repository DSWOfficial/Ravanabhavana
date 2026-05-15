import { LogIn, PlayCircle, Video, MessageCircle } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../firebase.js';
import { createContactWhatsAppMessage, openWhatsApp } from '../../utils/whatsapp.js';

export default function Hero() {
  const [settings, setSettings] = useState({
    heroTitle: 'රාවණ භවණ',
    heroSubtitle: 'හෙළ උරුමයේ අභිමානය',
    heroDescription: 'රාවණ භවණ යනු සියලු දෙනා දුකින් මුදවා ගැනීමේ අරමුණින් පවත්වාගෙන යන සමාජ මෙහෙවරකි. අප ආවරණය කරන සියලු ක්ෂේත්‍රවල නොමිලේ ලබාදෙන සේවාවන් ඔබගේ ජීවිතයට ප්‍රායෝගික ශක්තියක් වේවි.',
    whatsappNumber: '94777193197',
  });
  useEffect(() => onSnapshot(doc(db, 'siteSettings', 'main'), (snap) => snap.exists() && setSettings((s) => ({ ...s, ...snap.data() }))), []);
  return (
    <section id="home" className="relative overflow-hidden bg-[#1a110d] text-[#fffaf0]">
      <div className="container-shell grid min-h-[680px] items-center gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="text-sm font-bold text-[#d6ad61]">Hela Heritage · Spiritual Wisdom</p>
          <h1 className="mt-4 text-5xl font-black leading-tight sm:text-7xl">{settings.heroTitle}</h1>
          <p className="mt-3 text-2xl font-bold text-[#e3c27f]">{settings.heroSubtitle}</p>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#f4e8ce]">
            {settings.heroDescription}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button className="btn btn-gold" onClick={() => openWhatsApp(settings.whatsappNumber, createContactWhatsAppMessage('මට උපදේශන සහාය අවශ්‍යයි.'))}><MessageCircle size={19} />WhatsApp කරන්න</button>
            <a className="btn btn-outline border-[#d6ad61]/50 text-[#fffaf0]" href="#videos"><PlayCircle size={19} />YouTube බලන්න</a>
            <a className="btn btn-outline border-[#d6ad61]/50 text-[#fffaf0]" href="#session"><Video size={19} />සජීවී Zoom සැසිය</a>
            <Link className="btn btn-outline border-[#d6ad61]/50 text-[#fffaf0]" to="/login"><LogIn size={19} />Login to Track Progress</Link>
          </div>
        </div>
        <div className="flex justify-center">
          <img src="/ravana-bhawana-logo.png" alt="රාවණ භවණ ලාංඡනය" className="w-full max-w-[500px] rounded-full border border-[#d6ad61]/35 shadow-2xl" />
        </div>
      </div>
      <div className="border-y border-[#d6ad61]/25 bg-[#2d1b12] py-4">
        <div className="container-shell flex flex-col gap-2 text-sm font-bold sm:flex-row sm:items-center sm:justify-between">
          <span>ඔබේ ඕනෑම ප්‍රශ්නයකට විසඳුම් — ප්‍රශ්නය voice message එකක් ලෙස WhatsApp කරන්න.</span>
          <span className="text-[#e3c27f]">+94 77 719 3197</span>
        </div>
      </div>
    </section>
  );
}
