import { signOut } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import AdminErrorBoundary from '../components/admin/AdminErrorBoundary.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { auth } from '../firebase.js';
import { isAdminUser } from '../lib/adminAuth.js';

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const [adminState, setAdminState] = useState({ loading: true, isAdmin: false, error: '' });

  useEffect(() => {
    let mounted = true;
    async function check() {
      if (loading) return;
      if (!user?.email) {
        if (mounted) setAdminState({ loading: false, isAdmin: false, error: '' });
        return;
      }
      try {
        const isAdmin = isAdminUser(user);
        if (!isAdmin) {
          await signOut(auth);
          if (mounted) setAdminState({ loading: false, isAdmin: false, error: '' });
          return;
        }
        if (mounted) setAdminState({ loading: false, isAdmin: true, error: '' });
      } catch (error) {
        console.error('[AdminRoute] admin check failed:', error);
        if (mounted) setAdminState({ loading: false, isAdmin: false, error: error.message });
      }
    }
    check();
    return () => { mounted = false; };
  }, [user, loading]);

  if (loading || adminState.loading) return <div className="section container-shell">Checking admin access...</div>;
  if (adminState.error) {
    return (
      <div className="section container-shell">
        <h1 className="text-3xl font-bold">Admin check failed</h1>
        <p className="mt-3 rounded-lg bg-red-50 p-4 font-semibold text-red-700">{adminState.error}</p>
        <Link className="btn btn-primary mt-5" to="/admin/login">Admin login</Link>
      </div>
    );
  }
  if (!user || !adminState.isAdmin) return <Navigate to="/admin/login" replace />;
  return <AdminErrorBoundary>{children}</AdminErrorBoundary>;
}
