import { firebaseData } from '../../lib/firebaseData.js';
import { Link } from 'react-router-dom';

export const emptyToast = { message: '', type: 'success' };

export function Toast({ toast }) {
  if (!toast.message) return null;
  return <div className={`rounded-lg p-3 text-sm font-bold ${toast.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'}`}>{toast.message}</div>;
}

export function PermissionError({ error }) {
  if (!error) return null;
  return (
    <div className="rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-700">
      {error.path && <p className="mb-2 text-red-900">Firestore path: {error.path}</p>}
      {error.collectionName && <p className="mb-2 text-red-900">Collection: {error.collectionName}</p>}
      {error.code && <p className="mb-2 text-red-900">Code: {error.code}</p>}
      <p>{error.message || String(error)}</p>
      <p className="mt-2">If this says "Missing or insufficient permissions", deploy the updated Firestore rules and confirm the signed-in admin email is udarasampath@gmail.com.</p>
    </div>
  );
}

export function cmsError(error, path = '') {
  const next = new Error(`${path ? `${path}: ` : ''}${error.code ? `${error.code} - ` : ''}${error.message || String(error)}`);
  next.code = error.code;
  next.path = path;
  next.collectionName = path.split('/')[0] || '';
  return next;
}

export function BackToDashboard() {
  return <Link className="btn btn-outline" to="/admin">Back to Admin Home</Link>;
}

export function AdminCard({ children, title, actions }) {
  return (
    <section className="surface rounded-xl p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h2 className="text-2xl font-black text-[var(--theme-primary)]">{title}</h2>
        {actions}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export async function fetchTable(table, order = 'created_at') {
  const query = firebaseData.from(table).select('*');
  if (order) query.order(order, { ascending: false });
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export function confirmDelete(label = 'this item') {
  return window.confirm(`Delete ${label}? This cannot be undone.`);
}

export function StatusBadge({ active, label }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-black ${active ? 'bg-green-100 text-green-800' : 'bg-stone-200 text-stone-700'}`}>{label || (active ? 'Active' : 'Hidden')}</span>;
}
