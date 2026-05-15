import { formatSinhalaDate } from '../../utils/dateTime.js';
import { useUserDashboardData } from './useUserDashboardData.js';

export default function UserDonationHistory() {
  const { donations } = useUserDashboardData();
  return <History title="Donation history" items={donations.map((d) => `${d.amount || '-'} · ${d.purpose || '-'} · ${formatSinhalaDate(d.createdAt)}`)} empty="Donation form history තවම නැත." />;
}

export function History({ title, items, empty }) {
  return <section className="surface rounded-lg p-6"><h2 className="text-2xl font-black">{title}</h2><div className="mt-4 grid gap-2">{items.map((item) => <p className="rounded-lg bg-[#fffaf0] p-3" key={item}>{item}</p>)}</div>{!items.length && <p className="mt-3 text-[#6f4a31]">{empty}</p>}</section>;
}
