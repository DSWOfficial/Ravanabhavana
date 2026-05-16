import { doc, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { db } from '../../firebase.js';
import { defaultHomeSections } from '../../lib/homeContent.js';

export default function Footer() {
  const { isAdmin } = useAuth();
  const { getLocalized, t } = useLanguage();
  const [footer, setFooter] = useState(defaultHomeSections.footer);
  useEffect(() => onSnapshot(doc(db, 'homeSections', 'footer'), (snap) => {
    if (snap.exists()) setFooter({ ...defaultHomeSections.footer, ...snap.data() });
  }, (error) => {
    console.error('Failed to load footer settings from homeSections/footer', error);
  }), []);

  return (
    <footer className="bg-[var(--theme-hero)] py-10 text-[var(--theme-hero-text)]">
      <div className="container-shell flex flex-col justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-3">
          <img src={footer.logoUrl || '/ravana-bhawana-logo.png'} alt="" className="h-12 w-12 rounded-full" />
          <div>
            <b>Ravana Bhavana</b>
            <p className="text-sm text-[var(--theme-accent)]">{getLocalized(footer, 'tagline', t('footer.tagline'))}</p>
            <p className="mt-1 text-xs text-[var(--theme-muted)]">{getLocalized(footer, 'copyrightText', `© ${new Date().getFullYear()} Ravana Bhavana. ${t('footer.rights')}`)}</p>
          </div>
        </div>
        {isAdmin && <Link className="text-sm text-[var(--theme-accent)] transition hover:text-[var(--theme-hero-text)]" to="/admin">{t('nav.admin')} {t('nav.dashboard')}</Link>}
      </div>
    </footer>
  );
}
