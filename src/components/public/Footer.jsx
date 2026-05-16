import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Footer() {
  const { isAdmin } = useAuth();

  return (
    <footer className="bg-[var(--theme-hero)] py-10 text-[var(--theme-hero-text)]">
      <div className="container-shell flex flex-col justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-3">
          <img src="/ravana-bhawana-logo.png" alt="" className="h-12 w-12 rounded-full" />
          <div>
            <b>රාවණ භවණ</b>
            <p className="text-sm text-[var(--theme-accent)]">Free social service platform</p>
          </div>
        </div>
        {isAdmin && <Link className="text-sm text-[var(--theme-accent)] transition hover:text-[var(--theme-hero-text)]" to="/admin">Admin Dashboard</Link>}
      </div>
    </footer>
  );
}
