import { Link } from 'react-router-dom';
import { LogOut, Menu, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { listNavigation } from '../../lib/cms.js';

const fallbackLinks = [
  ['Home', '/#home'],
  ['About', '/#about'],
  ['Services', '/#services'],
  ['Videos', '/videos'],
  ['Weekly Session', '/#session'],
  ['Support', '/#support'],
  ['Contact', '/#contact'],
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [navItems, setNavItems] = useState([]);
  const { user, isAdmin, logout } = useAuth();

  useEffect(() => {
    let mounted = true;
    listNavigation()
      .then((items) => mounted && setNavItems(items.filter((item) => item.visible)))
      .catch(() => mounted && setNavItems([]));
    return () => { mounted = false; };
  }, []);

  const links = navItems.length ? navItems.map((item) => [item.label, item.url]) : fallbackLinks;

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
              <Link className="btn btn-outline header-action-btn" to="/dashboard"><UserRound size={18} />Dashboard</Link>
              {isAdmin && <Link className="btn btn-outline header-action-btn" to="/admin">Admin</Link>}
              <button className="btn btn-primary header-action-btn" onClick={logout}><LogOut size={18} />Logout</button>
            </>
          ) : (
            <>
              <Link className="btn btn-outline header-action-btn" to="/login">Login</Link>
              <Link className="btn btn-primary header-action-btn" to="/videos">Continue as Guest</Link>
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
              <Link className="btn btn-primary" to="/dashboard">Dashboard</Link>
              {isAdmin && <Link className="btn btn-outline" to="/admin">Admin</Link>}
            </>
          ) : <Link className="btn btn-primary" to="/login">Login</Link>}
        </div>
      )}
    </header>
  );
}
