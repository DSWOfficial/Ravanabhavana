import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useBlockStatus } from '../context/BlockContext.jsx';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const { blocked } = useBlockStatus();
  if (loading) return <div className="section container-shell">Loading...</div>;
  if (blocked) return <div className="section container-shell"><h1 className="text-3xl font-black text-[var(--theme-primary)]">Access Restricted</h1><p className="mt-3 text-[var(--theme-muted)]">Your access has been restricted.</p></div>;
  return user ? children : <Navigate to="/login" replace />;
}
