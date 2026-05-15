import { useEffect, useState } from 'react';
import { firebaseData } from '../../lib/firebaseData.js';
import { AdminCard, emptyToast, Toast } from './adminHelpers.jsx';

const defaults = {
  id: 1,
  whatsapp_number: '94777193197',
  display_whatsapp_number: '+94 77 719 3197',
  whatsapp_group_url: '',
  youtube_channel_url: '',
  facebook_page_url: '',
  phone_number: '+94 77 719 3197',
  hero_title: 'රාවණ භවණ',
  hero_subtitle: 'හෙළ උරුමයේ අභිමානය',
  hero_description: 'රාවණ භවණ යනු සියලු දෙනා දුකින් මුදවා ගැනීමේ අරමුණින් පවත්වාගෙන යන සමාජ මෙහෙවරකි.',
  zoom_fallback_text: 'Zoom link එක ඉක්මනින් පළ කරනු ඇත.',
};

export default function SiteSettingsManager() {
  const [form, setForm] = useState(defaults);
  const [toast, setToast] = useState(emptyToast);
  useEffect(() => { firebaseData.from('site_settings').select('*').limit(1).maybeSingle().then(({ data }) => data && setForm({ ...defaults, ...data })); }, []);
  const save = async (event) => {
    event.preventDefault();
    const { error } = await firebaseData.from('site_settings').upsert({ ...form, id: form.id || 1, updated_at: new Date().toISOString() });
    setToast(error ? { message: error.message, type: 'error' } : { message: 'Site settings saved', type: 'success' });
  };
  return (
    <AdminCard title="Site Settings Manager">
      <Toast toast={toast} />
      <form onSubmit={save} className="mt-4 grid gap-3 md:grid-cols-2">
        {Object.keys(defaults).filter((field) => field !== 'id').map((field) => field.includes('description') || field.includes('text')
          ? <textarea key={field} className="input min-h-24 md:col-span-2" placeholder={field} value={form[field] || ''} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />
          : <input key={field} className="input" placeholder={field} value={form[field] || ''} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />)}
        <button className="btn btn-primary md:col-span-2">Save site settings</button>
      </form>
    </AdminCard>
  );
}
