import { BarChart3, Bell, CalendarClock, Eye, Gift, Home, LogOut, Menu, PlaySquare, Settings, Users, Video, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase.js';

const items = [
  ['overview', 'Overview', BarChart3],
  ['videos', 'Videos', PlaySquare],
  ['sessions', 'Zoom Sessions', Video],
  ['schedule', 'Weekly Schedule', CalendarClock],
  ['banners', 'Banners', Bell],
  ['users', 'Users', Users],
  ['donations', 'Donations', Gift],
  ['site', 'Site Settings', Settings],
  ['donationSettings', 'Donation Settings', Gift],
  ['preview', 'Public Preview', Eye],
];

export default function AdminSidebar({ activePage, setActivePage, open, setOpen }) {
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
        {items.map(([key, label, Icon]) => (
          <button key={key} onClick={() => { setActivePage(key); setOpen(false); }} className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left font-bold transition ${activePage === key ? 'bg-[#b88934] text-[#1a110d]' : 'hover:bg-white/10'}`}>
            <Icon size={18} />{label}
          </button>
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
