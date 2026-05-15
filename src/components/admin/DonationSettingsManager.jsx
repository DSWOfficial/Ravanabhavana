import { useEffect, useState } from 'react';
import { firebaseData } from '../../lib/firebaseData.js';
import { AdminCard, emptyToast, Toast } from './adminHelpers.jsx';

const purposes = [
  'පිළිකා රෝහලේ සහ ප්‍රතිකාර අවශ්‍ය රෝගීන් සඳහා',
  'රෝගී සහ හදිසි පිහිටක් අවශ්‍ය පුද්ගලයන් වෙනුවෙන්',
  'මූල්‍ය අපහසුතා ඇති පවුල් සහ පුද්ගලයන් වෙනුවෙන්',
  'දරුවන්ගේ අධ්‍යාපනික සහ මූලික අවශ්‍යතා සඳහා',
  'වැඩිහිටි නිවාස / අසරණ වැඩිහිටියන් වෙනුවෙන්',
  'ආගමික හා සමාජ පුණ්‍ය කටයුතු සඳහා',
  'රාවණ භවණ මඟින් සංවිධානය කරන සත්කාර වැඩසටහන් සඳහා',
  'වෙනත්',
];

const defaults = { id: 1, organization_name: 'රාවණ භවණ', account_holder_name: 'S. Udara Sampath Rodrigo', bank_name: "People's Bank", branch: 'Gampaha', account_number: '026-2-001-7-0030478', purposes };

export default function DonationSettingsManager() {
  const [form, setForm] = useState({ ...defaults, purposes_text: purposes.join('\n') });
  const [toast, setToast] = useState(emptyToast);
  useEffect(() => { firebaseData.from('donation_settings').select('*').limit(1).maybeSingle().then(({ data }) => data && setForm({ ...defaults, ...data, purposes_text: (data.purposes || purposes).join('\n') })); }, []);
  const save = async (event) => {
    event.preventDefault();
    const payload = { ...form, id: form.id || 1, purposes: form.purposes_text.split('\n').map((p) => p.trim()).filter(Boolean), updated_at: new Date().toISOString() };
    delete payload.purposes_text;
    const { error } = await firebaseData.from('donation_settings').upsert(payload);
    setToast(error ? { message: error.message, type: 'error' } : { message: 'Donation settings saved', type: 'success' });
  };
  return (
    <AdminCard title="Donation Settings Manager">
      <Toast toast={toast} />
      <form onSubmit={save} className="mt-4 grid gap-3 md:grid-cols-2">
        {['organization_name', 'account_holder_name', 'bank_name', 'branch', 'account_number'].map((field) => <input key={field} className="input" required placeholder={field} value={form[field] || ''} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />)}
        <textarea className="input min-h-60 md:col-span-2" value={form.purposes_text || ''} onChange={(e) => setForm({ ...form, purposes_text: e.target.value })} />
        <button className="btn btn-primary md:col-span-2">Save donation settings</button>
      </form>
    </AdminCard>
  );
}
