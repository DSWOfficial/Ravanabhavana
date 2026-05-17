import { useEffect, useState } from 'react';
import { auth } from '../../firebase.js';
import AdminSidebar from './AdminSidebar.jsx';
import AdminTopbar from './AdminTopbar.jsx';

export default function AdminLayout({ children, title, activePage, setActivePage }) {
  const [email, setEmail] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    setEmail(auth.currentUser?.email || '');
  }, []);

  return (
    <main className="admin-layout bg-[var(--theme-section)] text-[var(--theme-text)]">
      <div className="w-full">
        <AdminSidebar open={sidebarOpen} setOpen={setSidebarOpen} collapsed={sidebarCollapsed} activePage={activePage} setActivePage={setActivePage} />
        <section className={`admin-main transition-[margin,width] ${sidebarCollapsed ? 'admin-main-expanded' : ''}`}>
          <AdminTopbar title={title} email={email} onMenu={() => {
            if (window.matchMedia('(min-width: 1024px)').matches) setSidebarCollapsed((value) => !value);
            else setSidebarOpen(true);
          }} />
          <div className="admin-content">{children}</div>
        </section>
      </div>
    </main>
  );
}
