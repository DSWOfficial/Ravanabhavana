import { useUserDashboardData } from './useUserDashboardData.js';

export default function UserNotes() {
  const { notes, videos } = useUserDashboardData();
  const titles = Object.fromEntries(videos.map((v) => [v.id, v.title]));
  return (
    <section className="surface rounded-lg p-6">
      <h2 className="text-2xl font-black">Personal notes</h2>
      <div className="mt-4 grid gap-3">
        {notes.map((item) => <article className="rounded-lg bg-[var(--theme-surface)] p-4" key={item.id}><b className="text-[var(--theme-primary)]">{titles[item.videoDocId] || item.videoId}</b><p className="mt-2 whitespace-pre-wrap text-[var(--theme-text)]">{item.note}</p></article>)}
      </div>
      {!notes.length && <p className="mt-3 text-[var(--theme-muted)]">ඔබගේ private notes තවම නැත.</p>}
    </section>
  );
}
