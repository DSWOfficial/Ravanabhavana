import { Award, HeartHandshake } from 'lucide-react';

export default function About() {
  return (
    <section id="about" className="section bg-[var(--theme-surface)]">
      <div className="container-shell grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div className="flex flex-col items-start">
          <p className="eyebrow">මා ගැන</p>
          <h2 className="mt-3 text-4xl font-black text-[var(--theme-primary)]">උදාර සම්පත්</h2>
          <p className="mt-1 text-xl font-bold text-[var(--theme-muted)]">S. Udara Sampath Rodrigo</p>

          <div className="mt-7 w-full max-w-sm overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--theme-accent)_35%,transparent)] bg-[var(--theme-hero)] p-2 shadow-2xl transition duration-300 hover:-translate-y-1">
            <img
              src="/profilepic.png?v=2"
              alt="S. Udara Sampath Rodrigo"
              className="aspect-[4/5] w-full rounded-lg object-cover"
            />
          </div>
        </div>

        <div className="surface rounded-lg p-7">
          <div className="flex flex-wrap gap-3">
            <span className="btn btn-outline"><HeartHandshake size={18} />වෘත්තීය මනෝ උපදේශක</span>
            <span className="btn btn-outline"><Award size={18} />SLPPCA Member</span>
          </div>
          <p className="mt-6 text-lg leading-8 text-[var(--theme-text)]">
            ගම්පහ ප්‍රසිද්ධ පාසලක ගුරුවරයෙකු ලෙස කටයුතු කරන මම, ශ්‍රී ලංකා වෘත්තීය මනෝවිද්‍යා උපදේශකවරුන්ගේ සංගමයේ (SLPPCA) ලියාපදිංචි සාමාජිකයෙකු ලෙස වසර ගණනාවක අත්දැකීම් සහිතව මෙම සේවාව මෙහෙයවනු ලබමි.
          </p>
        </div>
      </div>
    </section>
  );
}
