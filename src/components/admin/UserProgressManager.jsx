import { useEffect, useMemo, useState } from 'react';
import { firebaseData } from '../../lib/firebaseData.js';
import { formatSinhalaDate } from '../../utils/dateTime.js';
import { AdminCard } from './adminHelpers.jsx';

export default function UserProgressManager() {
  const [profiles, setProfiles] = useState([]);
  const [progress, setProgress] = useState([]);
  const [joins, setJoins] = useState([]);
  const [donations, setDonations] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('mostActive');
  useEffect(() => { firebaseData.from('profiles').select('*').then(({ data }) => setProfiles(data || [])); firebaseData.from('user_video_progress').select('id,user_id,video_id,watched,completed,saved,watched_at,completed_at,saved_at,updated_at').then(({ data }) => setProgress(data || [])); firebaseData.from('user_session_joins').select('*').then(({ data }) => setJoins(data || [])); firebaseData.from('donation_submissions').select('*').then(({ data }) => setDonations(data || [])); }, []);
  const rows = useMemo(() => {
    const term = search.toLowerCase();
    return profiles.map((profile) => {
      const p = progress.filter((item) => item.user_id === profile.id);
      return { ...profile, watched: p.filter((x) => x.watched).length, completed: p.filter((x) => x.completed).length, saved: p.filter((x) => x.saved).length, joins: joins.filter((x) => x.user_id === profile.id).length, donations: donations.filter((x) => x.user_id === profile.id).length };
    }).filter((row) => row.email?.toLowerCase().includes(term) || row.full_name?.toLowerCase().includes(term))
      .sort((a, b) => sort === 'recent' ? new Date(b.created_at) - new Date(a.created_at) : sort === 'completed' ? b.completed - a.completed : (b.watched + b.completed + b.saved + b.joins + b.donations) - (a.watched + a.completed + a.saved + a.joins + a.donations));
  }, [profiles, progress, joins, donations, search, sort]);
  return (
    <AdminCard title="User Progress Manager">
      <div className="mb-4 grid gap-3 md:grid-cols-2"><input className="input" placeholder="Search by email/name" value={search} onChange={(e) => setSearch(e.target.value)} /><select className="input" value={sort} onChange={(e) => setSort(e.target.value)}><option value="mostActive">Sort by most active</option><option value="recent">Sort by recently joined</option><option value="completed">Sort by completed videos</option></select></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left"><thead><tr className="border-b text-sm text-[#6f4a31]"><th>Email</th><th>Name</th><th>Last login</th><th>Watched</th><th>Completed</th><th>Saved</th><th>Zoom</th><th>Donations</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-b border-[#b88934]/15"><td className="py-3 font-bold">{row.email}</td><td>{row.full_name}</td><td>{formatSinhalaDate(row.last_login_at)}</td><td>{row.watched}</td><td>{row.completed}</td><td>{row.saved}</td><td>{row.joins}</td><td>{row.donations}</td></tr>)}</tbody></table></div>
      <p className="mt-4 text-sm font-semibold text-[#6f4a31]">Private user notes are not selected or displayed here.</p>
    </AdminCard>
  );
}
