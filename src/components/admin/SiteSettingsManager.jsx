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
  theme_page_background: '#f6f4ee',
  theme_section_background: '#e8f2ef',
  theme_surface_background: '#fffdf7',
  theme_text_color: '#17211f',
  theme_muted_color: '#49645d',
  theme_primary_color: '#183a37',
  theme_primary_hover_color: '#102927',
  theme_accent_color: '#e0a458',
  theme_secondary_accent_color: '#c85a3d',
  theme_hero_background: '#132321',
  theme_hero_text_color: '#fff9ed',
};

const contentFields = Object.keys(defaults).filter((field) => field !== 'id' && !field.startsWith('theme_'));

const themeFields = [
  ['theme_page_background', 'Page background'],
  ['theme_section_background', 'Alternate section background'],
  ['theme_surface_background', 'Cards and inputs'],
  ['theme_text_color', 'Main text'],
  ['theme_muted_color', 'Muted text'],
  ['theme_primary_color', 'Primary buttons and headings'],
  ['theme_primary_hover_color', 'Primary hover'],
  ['theme_accent_color', 'Accent'],
  ['theme_secondary_accent_color', 'Second accent'],
  ['theme_hero_background', 'Hero and footer background'],
  ['theme_hero_text_color', 'Hero and footer text'],
];

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
      <form onSubmit={save} className="mt-4 grid gap-6">
        <div className="grid gap-3 md:grid-cols-2">
          {contentFields.map((field) => field.includes('description') || field.includes('text')
            ? <textarea key={field} className="input min-h-24 md:col-span-2" placeholder={field} value={form[field] || ''} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />
            : <input key={field} className="input" placeholder={field} value={form[field] || ''} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />)}
        </div>

        <section className="rounded-lg border border-[color-mix(in_srgb,var(--theme-accent)_25%,transparent)] bg-[color-mix(in_srgb,var(--theme-surface)_70%,white)] p-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-xl font-black text-[var(--theme-primary)]">Customize Site Colors</h3>
              <p className="mt-1 text-sm font-semibold text-[var(--theme-muted)]">These colors update the public site theme after saving.</p>
            </div>
            <button type="button" className="btn btn-outline" onClick={() => setForm({ ...form, ...Object.fromEntries(themeFields.map(([field]) => [field, defaults[field]])) })}>Reset colors</button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {themeFields.map(([field, label]) => (
              <label key={field} className="surface grid gap-2 rounded-lg p-3">
                <span className="text-sm font-bold text-[var(--theme-muted)]">{label}</span>
                <div className="flex items-center gap-2">
                  <input
                    className="h-11 w-14 cursor-pointer rounded border border-black/10 bg-transparent p-1"
                    type="color"
                    value={form[field] || defaults[field]}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  />
                  <input
                    className="input"
                    value={form[field] || ''}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  />
                </div>
              </label>
            ))}
          </div>
        </section>

        <button className="btn btn-primary md:col-span-2">Save site settings</button>
      </form>
    </AdminCard>
  );
}
