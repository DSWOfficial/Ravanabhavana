import { firebaseData } from '../../lib/firebaseData.js';

export const emptyToast = { message: '', type: 'success' };

export function Toast({ toast }) {
  if (!toast.message) return null;
  return <div className={`rounded-lg p-3 text-sm font-bold ${toast.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'}`}>{toast.message}</div>;
}

export function AdminCard({ children, title, actions }) {
  return (
    <section className="surface rounded-xl p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h2 className="text-2xl font-black text-[#3a2115]">{title}</h2>
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
