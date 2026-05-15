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
    <header className="border-b border-[#b88934]/20 bg-[#fffaf0]/95 backdrop-blur">
      <div className="container-shell flex min-h-20 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button className="btn btn-outline lg:hidden" onClick={onMenu}><Menu size={18} /></button>
          <div><h1 className="text-2xl font-black text-[#3a2115]">{title}</h1><p className="text-sm font-semibold text-[#6f4a31]">{email}</p></div>
        </div>
        <div className="hidden gap-2 sm:flex">
          <a className="btn btn-outline" href="/" target="_blank" rel="noreferrer">View Public Site</a>
          <button className="btn btn-primary" onClick={logout}><LogOut size={18} />Logout</button>
        </div>
      </div>
    </header>
  );
}
