import { BarChart3, FileText, Home, Images, Link as LinkIcon, LogOut, Menu, Search, X } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase.js';

const items = [
  ['/admin', 'Dashboard', BarChart3],
  ['/admin/pages', 'Pages', FileText],
  ['/admin/media', 'Media', Images],
  ['/admin/navigation', 'Navigation', LinkIcon],
  ['/admin/pages/new', 'Create Page', FileText],
  ['/admin/pages/home/edit', 'SEO Settings', Search],
];

export default function AdminSidebar({ open, setOpen }) {
  const navigate = useNavigate();
  const logout = async () => {
    await signOut(auth);
    navigate('/admin/login');
  };
  const content = (
    <div className="flex h-full flex-col bg-[#24150f] p-5 text-[#fffaf0]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/ravana-bhawana-logo.png" alt="" className="h-12 w-12 rounded-xl object-cover" />
          <div><b>රාවණ භවණ</b><p className="text-xs text-[#d6ad61]">Admin Panel</p></div>
        </div>
        <button className="lg:hidden" onClick={() => setOpen(false)}><X /></button>
      </div>
      <nav className="mt-8 grid gap-2">
        {items.map(([to, label, Icon]) => (
          <NavLink key={to} to={to} end={to === '/admin'} onClick={() => setOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-4 py-3 text-left font-bold transition ${isActive ? 'bg-[var(--theme-accent)] text-[var(--theme-hero)]' : 'hover:bg-white/10'}`}>
            <Icon size={18} />{label}
          </NavLink>
        ))}
        <a className="flex items-center gap-3 rounded-lg px-4 py-3 font-bold hover:bg-white/10" href="/" target="_blank" rel="noreferrer"><Home size={18} />Public Preview</a>
      </nav>
      <button className="mt-auto flex items-center gap-3 rounded-lg px-4 py-3 font-bold hover:bg-white/10" onClick={logout}><LogOut size={18} />Logout</button>
    </div>
  );
  return (
    <>
      <button className="fixed left-4 top-4 z-40 rounded-lg bg-[#24150f] p-3 text-white lg:hidden" onClick={() => setOpen(true)}><Menu /></button>
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 lg:block">{content}</aside>
      {open && <aside className="fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} /><div className="relative h-full w-72">{content}</div></aside>}
    </>
  );
}
