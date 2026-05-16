import { LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase.js';

export default function AdminTopbar({ title, email, onMenu }) {
  const navigate = useNavigate();
  const logout = async () => {
    await signOut(auth);
    navigate('/admin/login');
  };
  return (
    <header className="border-b border-[color-mix(in_srgb,var(--theme-accent)_24%,transparent)] bg-[color-mix(in_srgb,var(--theme-surface)_94%,transparent)] backdrop-blur">
      <div className="container-shell flex min-h-20 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button className="btn btn-outline lg:hidden" onClick={onMenu}><Menu size={18} /></button>
          <div><h1 className="text-2xl font-black text-[var(--theme-primary)]">{title}</h1><p className="text-sm font-semibold text-[var(--theme-muted)]">{email}</p></div>
        </div>
        <div className="hidden gap-2 sm:flex">
          <a className="btn btn-outline" href="/" target="_blank" rel="noreferrer">View Public Site</a>
          <button className="btn btn-primary" onClick={logout}><LogOut size={18} />Logout</button>
        </div>
      </div>
    </header>
  );
}
