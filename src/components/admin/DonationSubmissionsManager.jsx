import { MessageCircle, Phone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { copyToClipboard } from '../../utils/copy.js';
import { formatSinhalaDate } from '../../utils/dateTime.js';
import { createAdminWhatsAppMessage, openWhatsApp } from '../../utils/whatsapp.js';
import { AdminCard, emptyToast, fetchTable, Toast } from './adminHelpers.jsx';

export default function DonationSubmissionsManager() {
  const [items, setItems] = useState([]);
  const [toast, setToast] = useState(emptyToast);
  const load = async () => setItems(await fetchTable('donation_submissions'));
  useEffect(() => { load().catch((error) => setToast({ message: error.message, type: 'error' })); }, []);
  return (
    <AdminCard title="Donation Submissions Manager">
      <Toast toast={toast} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left"><thead><tr className="border-b text-sm text-[#6f4a31]"><th>Name</th><th>Guest/User</th><th>Country</th><th>Area</th><th>Amount</th><th>Phone</th><th>Purpose</th><th>Date</th><th>Note preview</th><th>Actions</th></tr></thead>
          <tbody>{items.map((item) => <tr key={item.id} className="border-b border-[#b88934]/15"><td className="py-3 font-bold">{item.name}</td><td>{item.is_guest ? 'Guest' : 'User'}</td><td>{item.country}</td><td>{item.area}</td><td>{item.amount}</td><td>{item.phone}</td><td>{item.purpose}</td><td>{formatSinhalaDate(item.created_at)}</td><td>{item.note?.slice(0, 80)}</td><td><div className="flex gap-2"><button className="btn btn-outline" onClick={() => copyToClipboard(item.phone)}><Phone size={16} /></button><button className="btn btn-primary" onClick={() => openWhatsApp(item.phone, createAdminWhatsAppMessage(item))}><MessageCircle size={16} /></button></div></td></tr>)}</tbody></table>
        {!items.length && <p className="py-6 text-[#6f4a31]">Donation submissions නැත.</p>}
      </div>
    </AdminCard>
  );
}
