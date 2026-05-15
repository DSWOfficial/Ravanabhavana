import { Award, HeartHandshake } from 'lucide-react';

export default function About() {
  return (
    <section id="about" className="section bg-[#fffaf0]">
      <div className="container-shell grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
        <div>
          <p className="eyebrow">මා ගැන</p>
          <h2 className="mt-3 text-4xl font-black text-[#3a2115]">උදාර සම්පත්</h2>
          <p className="mt-1 text-xl font-bold text-[#6f4a31]">S. Udara Sampath Rodrigo</p>
        </div>
        <div className="surface rounded-lg p-7">
          <div className="flex flex-wrap gap-3">
            <span className="btn btn-outline"><HeartHandshake size={18} />වෘත්තීය මනෝ උපදේශක</span>
            <span className="btn btn-outline"><Award size={18} />SLPPCA Member</span>
          </div>
          <p className="mt-6 text-lg leading-8 text-[#3a2115]">
            ගම්පහ ප්‍රසිද්ධ පාසලක ගුරුවරයෙකු ලෙස කටයුතු කරන මම, ශ්‍රී ලංකා වෘත්තීය මනෝවිද්‍යා උපදේශකවරුන්ගේ සංගමයේ (SLPPCA) ලියාපදිංචි සාමාජිකයෙකු ලෙස වසර ගණනාවක අත්දැකීම් සහිතව මෙම සේවාව මෙහෙයවනු ලබමි.
          </p>
        </div>
      </div>
    </section>
  );
}
