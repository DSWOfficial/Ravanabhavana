import { useEffect, useState } from 'react';
import { auth } from '../../firebase.js';
import AdminSidebar from './AdminSidebar.jsx';
import AdminTopbar from './AdminTopbar.jsx';

export default function AdminLayout({ children, activePage, setActivePage, title }) {
  const [email, setEmail] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setEmail(auth.currentUser?.email || '');
  }, []);

  return (
    <main className="min-h-screen bg-[#f8f0df] text-[#16110d]">
      <div className="lg:flex">
        <AdminSidebar activePage={activePage} setActivePage={setActivePage} open={sidebarOpen} setOpen={setSidebarOpen} />
        <section className="min-h-screen flex-1 lg:pl-72">
          <AdminTopbar title={title} email={email} onMenu={() => setSidebarOpen(true)} />
          <div className="container-shell py-6">{children}</div>
        </section>
      </div>
    </main>
  );
}
