import { useEffect, useState } from 'react';
import { firebaseData } from '../../lib/firebaseData.js';
import { formatTime } from '../../utils/dateTime.js';
import { AdminCard, emptyToast, Toast } from './adminHelpers.jsx';

const defaults = { day: 'Saturday', start_time: '20:00', end_time: '20:40', description: 'සතිපතා Zoom සැසිය', is_active: true };
const sinhalaDays = { Saturday: 'සෙනසුරාදා', Sunday: 'ඉරිදා', Monday: 'සඳුදා', Tuesday: 'අඟහරුවාදා', Wednesday: 'බදාදා', Thursday: 'බ්‍රහස්පතින්දා', Friday: 'සිකුරාදා' };

export default function WeeklyScheduleManager() {
  const [form, setForm] = useState(defaults);
  const [toast, setToast] = useState(emptyToast);
  useEffect(() => { firebaseData.from('weekly_schedule').select('*').limit(1).maybeSingle().then(({ data }) => data && setForm(data)); }, []);
  const save = async (event) => {
    event.preventDefault();
    const payload = { ...form, id: form.id || 1, updated_at: new Date().toISOString() };
    const { error } = await firebaseData.from('weekly_schedule').upsert(payload);
    setToast(error ? { message: error.message, type: 'error' } : { message: 'Weekly schedule saved', type: 'success' });
  };
  return (
    <AdminCard title="Weekly Schedule Manager">
      <Toast toast={toast} />
      <form onSubmit={save} className="mt-4 grid gap-3 md:grid-cols-2">
        <select className="input" value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}>{Object.keys(sinhalaDays).map((d) => <option key={d}>{d}</option>)}</select>
        <label className="rounded-lg bg-[#fffaf0] p-3 font-bold"><input type="checkbox" checked={Boolean(form.is_active)} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
        <input className="input" type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
        <input className="input" type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
        <textarea className="input min-h-24 md:col-span-2" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <p className="rounded-lg bg-[#fffaf0] p-4 font-black md:col-span-2">සෑම {sinhalaDays[form.day]} {formatTime(form.start_time)} සිට {formatTime(form.end_time)} දක්වා</p>
        <button className="btn btn-primary md:col-span-2">Save schedule</button>
      </form>
    </AdminCard>
  );
}
