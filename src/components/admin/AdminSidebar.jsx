import { Banknote, BarChart3, Bell, CalendarClock, Download, Eye, FileText, Gift, HeartHandshake, Home, Images, Layers3, Link as LinkIcon, LogOut, Menu, Palette, PlaySquare, Radio, Search, Settings2, ShieldAlert, Users, Video, X } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase.js';

const managerItems = [
  ['overview', 'Dashboard', BarChart3],
  ['playlists', 'Playlists', Layers3],
  ['videos', 'Videos', PlaySquare],
  ['sessions', 'Zoom Sessions', Video],
  ['schedule', 'Weekly Schedule', CalendarClock],
  ['banners', 'Banners / Notices', Bell],
  ['users', 'Users', Users],
  ['donations', 'Donations', Gift],
  ['site', 'Text, Links & Colors', Palette],
  ['donationSettings', 'Account Details', Banknote],
  ['preview', 'Public Preview', Eye],
];

const cmsItems = [
  ['/admin/cms', 'CMS Dashboard', BarChart3],
  ['/admin/homepage', 'Homepage Editor', Home],
  ['/admin/homepage-sections', 'Homepage Sections', Settings2],
  ['/admin/announcement-bar', 'Announcement Bar', Bell],
  ['/admin/banners', 'Banners', Bell],
  ['/admin/guidance', 'Guidance', HeartHandshake],
  ['/admin/weekly-sessions', 'Weekly Sessions', CalendarClock],
  ['/admin/live-sessions', 'Live Sessions / සජීවී වැඩසටහන්', Radio],
  ['/admin/blocked-users', 'Blocked Users', ShieldAlert],
  ['/admin/playlists', 'Playlists', Layers3],
  ['/admin/videos', 'Video Editor', PlaySquare],
  ['/admin/pages', 'Pages', FileText],
  ['/admin/pages/new', 'Create Page', FileText],
  ['/admin/media', 'Media', Images],
  ['/admin/navigation', 'Navigation', LinkIcon],
  ['/admin/seo', 'SEO Settings', Search],
  ['/admin/backup-export', 'Backup / Export', Download],
];

export default function AdminSidebar({ open, setOpen, collapsed = false, activePage, setActivePage }) {
  const navigate = useNavigate();
  const logout = async () => {
    await signOut(auth);
    navigate('/admin/login');
  };
  const content = (
    <div className="admin-sidebar-inner flex min-h-full flex-col bg-[#24150f] p-5 text-[#fffaf0]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/ravana-bhawana-logo.png" alt="" className="h-12 w-12 rounded-xl object-cover" />
          <div><b>රාවණ භවණ</b><p className="text-xs text-[#d6ad61]">Admin Panel</p></div>
        </div>
        <button className="lg:hidden" onClick={() => setOpen(false)}><X /></button>
      </div>
      <nav className="mt-8 grid gap-2">
        <Link className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-3 font-bold hover:bg-white/15" to="/"><Home size={18} />Back to Website</Link>
        <Link className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-3 font-bold hover:bg-white/15" to="/admin"><BarChart3 size={18} />Back to Admin Home</Link>
        {setActivePage && (
          <>
            <p className="px-4 pt-2 text-xs font-black uppercase tracking-wide text-[#d6ad61]">Manage Website</p>
            {managerItems.map(([page, label, Icon]) => (
              <button
                key={page}
                type="button"
                onClick={() => { setActivePage(page); setOpen(false); navigate('/admin'); }}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left font-bold transition ${activePage === page ? 'bg-[var(--theme-accent)] text-[var(--theme-hero)]' : 'hover:bg-white/10'}`}
              >
                <Icon size={18} />{label}
              </button>
            ))}
          </>
        )}
        <p className="px-4 pt-4 text-xs font-black uppercase tracking-wide text-[#d6ad61]">Pages & HTML</p>
        {cmsItems.map(([to, label, Icon]) => (
          <NavLink key={to} to={to} end={to === '/admin/cms'} onClick={() => setOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-4 py-3 text-left font-bold transition ${isActive ? 'bg-[var(--theme-accent)] text-[var(--theme-hero)]' : 'hover:bg-white/10'}`}>
            <Icon size={18} />{label}
          </NavLink>
        ))}
        <Link className="flex items-center gap-3 rounded-lg px-4 py-3 font-bold hover:bg-white/10" to="/"><Home size={18} />Public Preview</Link>
      </nav>
      <button className="mt-6 flex items-center gap-3 rounded-lg px-4 py-3 font-bold hover:bg-white/10" onClick={logout}><LogOut size={18} />Logout</button>
    </div>
  );
  return (
    <>
      <button className="fixed left-4 top-4 z-40 rounded-lg bg-[#24150f] p-3 text-white lg:hidden" onClick={() => setOpen(true)}><Menu /></button>
      <aside className={`admin-sidebar hidden transition-transform lg:block ${collapsed ? 'lg:-translate-x-full' : 'lg:translate-x-0'}`}>{content}</aside>
      {open && <aside className="fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} /><div className="admin-sidebar admin-sidebar-mobile open relative h-full w-72">{content}</div></aside>}
    </>
  );
}
