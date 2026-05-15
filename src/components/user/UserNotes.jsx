import { useUserDashboardData } from './useUserDashboardData.js';

export default function UserNotes() {
  const { notes, videos } = useUserDashboardData();
  const titles = Object.fromEntries(videos.map((v) => [v.id, v.title]));
  return (
    <section className="surface rounded-lg p-6">
      <h2 className="text-2xl font-black">Personal notes</h2>
      <div className="mt-4 grid gap-3">
        {notes.map((item) => <article className="rounded-lg bg-[#fffaf0] p-4" key={item.id}><b>{titles[item.videoDocId] || item.videoId}</b><p className="mt-2 whitespace-pre-wrap text-[#4b3123]">{item.note}</p></article>)}
      </div>
      {!notes.length && <p className="mt-3 text-[#6f4a31]">ඔබගේ private notes තවම නැත.</p>}
    </section>
  );
}
