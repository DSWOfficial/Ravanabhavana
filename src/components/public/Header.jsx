import { Link } from 'react-router-dom';
import { LogOut, Menu, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { languages, useLanguage } from '../../context/LanguageContext.jsx';
import { listNavigation } from '../../lib/cms.js';

const fallbackLinks = [
  ['nav.home', '/#home'],
  ['nav.about', '/#about'],
  ['nav.services', '/#services'],
  ['nav.videos', '/videos'],
  ['nav.weeklySession', '/#session'],
  ['nav.support', '/#support'],
  ['nav.contact', '/#contact'],
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [navItems, setNavItems] = useState([]);
  const { user, isAdmin, logout } = useAuth();
  const { currentLanguage, setLanguage, t, getLocalized } = useLanguage();

  useEffect(() => {
    let mounted = true;
    listNavigation()
      .then((items) => mounted && setNavItems(items.filter((item) => item.visible)))
      .catch(() => mounted && setNavItems([]));
    return () => { mounted = false; };
  }, []);

  const links = navItems.length ? navItems.map((item) => [getLocalized(item, 'label', item.label), item.url]) : fallbackLinks.map(([key, href]) => [t(key), href]);
  const languageToggle = (
    <div className="relative">
      <button className="language-toggle" type="button" onClick={() => setLanguageOpen((value) => !value)} aria-label="Change language">
        {languages[currentLanguage]} <span>▾</span>
      </button>
      {languageOpen && (
        <div className="language-menu">
          {Object.entries(languages).map(([code, label]) => (
            <button key={code} type="button" onClick={() => { setLanguage(code); setLanguageOpen(false); }}>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-[color-mix(in_srgb,var(--theme-accent)_24%,transparent)] bg-[color-mix(in_srgb,var(--theme-surface)_94%,transparent)] backdrop-blur">
      <div className="container-shell flex min-h-20 items-center justify-between gap-3">
        <a href="/#home" className="header-brand flex items-center gap-3 font-black text-[var(--theme-primary)]">
          <img src="/ravana-bhawana-logo.png" alt="රාවණ භවණ" className="h-12 w-12 rounded-full object-cover" />
          <span className="text-xl">රාවණ භවණ</span>
        </a>

        <nav className="header-desktop-nav items-center gap-3 text-xs font-semibold text-[var(--theme-muted)] xl:gap-5 xl:text-sm">
          {links.map(([label, href]) => <a key={href} className="rounded-md px-1.5 py-2 transition hover:bg-[color-mix(in_srgb,var(--theme-accent)_14%,transparent)] hover:text-[var(--theme-primary)]" href={href}>{label}</a>)}
        </nav>

        <div className="header-desktop-actions items-center gap-2">
          {user ? (
            <>
              {languageToggle}
              <Link className="btn btn-outline header-action-btn" to="/dashboard"><UserRound size={18} />{t('nav.dashboard')}</Link>
              {isAdmin && <Link className="btn btn-outline header-action-btn" to="/admin">{t('nav.admin')}</Link>}
              <button className="btn btn-primary header-action-btn" onClick={logout}><LogOut size={18} />{t('nav.logout')}</button>
            </>
          ) : (
            <>
              {languageToggle}
              <Link className="btn btn-outline header-action-btn" to="/login">{t('nav.login')}</Link>
              <Link className="btn btn-primary header-action-btn" to="/videos">{t('nav.guest')}</Link>
            </>
          )}
        </div>

        <button className="btn btn-outline header-menu-button" onClick={() => setOpen(!open)} aria-label="Menu">
          <Menu size={20} />
        </button>
      </div>

      {open && (
        <div className="container-shell header-mobile-panel grid gap-3 pb-5">
          {links.map(([label, href]) => (
            <a key={href} className="rounded-md py-2 font-semibold text-[var(--theme-muted)] transition hover:bg-[color-mix(in_srgb,var(--theme-accent)_14%,transparent)] hover:text-[var(--theme-primary)]" href={href} onClick={() => setOpen(false)}>{label}</a>
          ))}
          {user ? (
            <>
              <div className="justify-self-start">{languageToggle}</div>
              <Link className="btn btn-primary" to="/dashboard">{t('nav.dashboard')}</Link>
              {isAdmin && <Link className="btn btn-outline" to="/admin">{t('nav.admin')}</Link>}
            </>
          ) : <><div className="justify-self-start">{languageToggle}</div><Link className="btn btn-primary" to="/login">{t('nav.login')}</Link></>}
        </div>
      )}
    </header>
  );
}
