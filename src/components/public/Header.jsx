import { Link } from 'react-router-dom';
import { LogOut, Menu, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

const links = [
  ['Home', '#home'], ['About', '#about'], ['Services', '#services'], ['Videos', '#videos'],
  ['Weekly Session', '#session'], ['Support', '#support'], ['Contact', '#contact'],
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-[#b88934]/20 bg-[#fffaf0]/95 backdrop-blur">
      <div className="container-shell flex min-h-20 items-center justify-between gap-4">
        <a href="/#home" className="flex items-center gap-3 font-black text-[#3a2115]">
          <img src="/ravana-bhawana-logo.png" alt="රාවණ භවණ" className="h-12 w-12 rounded-full object-cover" />
          <span className="text-xl">රාවණ භවණ</span>
        </a>
        <nav className="hidden items-center gap-5 text-sm font-semibold text-[#4b3123] lg:flex">
          {links.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              <Link className="btn btn-outline" to="/dashboard"><UserRound size={18} />Dashboard</Link>
              <button className="btn btn-primary" onClick={logout}><LogOut size={18} />Logout</button>
            </>
          ) : (
            <>
              <Link className="btn btn-outline" to="/login">Login</Link>
              <a className="btn btn-primary" href="#videos">Continue as Guest</a>
            </>
          )}
        </div>
        <button className="btn btn-outline lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu"><Menu size={20} /></button>
      </div>
      {open && (
        <div className="container-shell grid gap-3 pb-5 lg:hidden">
          {links.map(([label, href]) => <a key={href} className="py-1 font-semibold" href={href} onClick={() => setOpen(false)}>{label}</a>)}
          {user ? <Link className="btn btn-primary" to="/dashboard">Dashboard</Link> : <Link className="btn btn-primary" to="/login">Login</Link>}
        </div>
      )}
    </header>
  );
}
