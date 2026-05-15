import { addDoc, collection, doc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Copy, Gift } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { db } from '../../firebase.js';
import { copyText } from '../../utils/copy.js';
import { createDonationWhatsAppMessage, openWhatsApp } from '../../utils/whatsapp.js';

const defaults = { organizationName: 'රාවණ භවණ', accountHolderName: '', bankName: '', branch: '', accountNumber: '', purposes: ['සමාජ මෙහෙවර', 'Zoom සහාය', 'අධ්‍යාපනික වැඩසටහන්'] };

export default function Support() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(defaults);
  const [form, setForm] = useState({ name: '', country: 'Sri Lanka', area: '', amount: '', phone: '', purpose: defaults.purposes[0], note: '' });
  useEffect(() => onSnapshot(doc(db, 'donationSettings', 'main'), (snap) => snap.exists() && setSettings({ ...defaults, ...snap.data() })), []);
  const submit = async (event) => {
    event.preventDefault();
    if (user) await addDoc(collection(db, 'donationSubmissions'), { ...form, userId: user.uid, isGuest: false, createdAt: serverTimestamp() });
    openWhatsApp('94777193197', createDonationWhatsAppMessage(form));
  };
  const bank = [['Organization name', settings.organizationName], ['Account holder name', settings.accountHolderName], ['Bank name', settings.bankName], ['Branch', settings.branch], ['Account number', settings.accountNumber]];
  return (
    <section id="support" className="section bg-[#fffaf0]">
      <div className="container-shell grid gap-8 lg:grid-cols-2">
        <div>
          <p className="eyebrow">Support</p><h2 className="mt-3 text-4xl font-black text-[#3a2115]">පරිත්‍යාග සහාය</h2>
          <div className="mt-6 grid gap-3">
            {bank.map(([label, value]) => <div key={label} className="surface flex items-center justify-between gap-3 rounded-lg p-4"><div><p className="text-sm font-bold text-[#6f4a31]">{label}</p><p className="font-black">{value || 'යාවත්කාලීන කිරීමට ඇත'}</p></div><button className="btn btn-outline" onClick={() => copyText(value)}><Copy size={17} /></button></div>)}
          </div>
        </div>
        <form onSubmit={submit} className="surface rounded-lg p-6">
          <Gift className="text-[#b88934]" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {['name', 'country', 'area', 'amount', 'phone'].map((field) => <input key={field} required={field === 'name'} className="input" placeholder={field} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />)}
            <select className="input" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })}>{(settings.purposes || []).map((p) => <option key={p}>{p}</option>)}</select>
          </div>
          <textarea className="input mt-3 min-h-28" placeholder="Extra note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <button className="btn btn-primary mt-4" type="submit">WhatsApp පණිවිඩය යවන්න</button>
        </form>
      </div>
    </section>
  );
}
