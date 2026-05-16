import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ADMIN_EMAIL, useAuth } from '../context/AuthContext.jsx';

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const [adminState, setAdminState] = useState({ loading: true, isAdmin: false, error: '' });

  useEffect(() => {
    let mounted = true;
    async function check() {
      if (loading) return;
      if (!user?.email) {
        console.log('[AdminRoute] logged-in email:', null);
        console.log('[AdminRoute] redirect decision:', 'redirect:/admin/login');
        setAdminState({ loading: false, isAdmin: false, error: '' });
        return;
      }
      console.log('[AdminRoute] logged-in email:', user.email);
      try {
        const isAdmin = user.email?.toLowerCase() === ADMIN_EMAIL;
        console.log('[AdminRoute] redirect decision:', isAdmin ? 'render:/admin' : 'access-denied');
        if (mounted) setAdminState({ loading: false, isAdmin, error: '' });
      } catch (error) {
        console.error('[AdminRoute] Firestore admin check failed:', error);
        console.log('[AdminRoute] admin doc exists:', false);
        console.log('[AdminRoute] redirect decision:', 'error');
        if (mounted) setAdminState({ loading: false, isAdmin: false, error: error.message });
      }
    }
    check();
    return () => { mounted = false; };
  }, [user, loading]);

  if (loading || adminState.loading) return <div className="section container-shell">Loading admin...</div>;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (adminState.error) {
    return (
      <div className="section container-shell">
        <h1 className="text-3xl font-bold">Admin check failed</h1>
        <p className="mt-3 rounded-lg bg-red-50 p-4 font-semibold text-red-700">{adminState.error}</p>
        <Link className="btn btn-primary mt-5" to="/admin/login">Admin login</Link>
      </div>
    );
  }
  if (!adminState.isAdmin) {
    return (
      <div className="section container-shell">
        <h1 className="text-3xl font-bold">Access denied</h1>
        <p className="mt-3">මෙම පිටුව පරිපාලකයින් සඳහා පමණි.</p>
        <Link className="btn btn-primary mt-5" to="/admin/login">Admin login</Link>
      </div>
    );
  }
  return children;
}
