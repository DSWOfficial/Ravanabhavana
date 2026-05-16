import { Brain, Sparkles, Shield, Sun, Stars, Landmark } from 'lucide-react';

const services = [
  ['මනෝවිද්‍යාව සහ උපදේශනය', Brain],
  ['විශ්ව විද්‍යාව සහ තාරකා ශාස්ත්‍රය', Stars],
  ['ගුප්ත විද්‍යාව සහ යන්ත්‍ර මන්ත්‍ර ශාස්ත්‍රය', Shield],
  ['ආධ්‍යාත්මික පිබිදීම', Sun],
  ['අධිමනෝවිද්‍යාව', Sparkles],
  ['හෙළ දර්ශනය', Landmark],
];

const help = [
  'මානසික ශක්තිය දියුණු කරමින් මනෝ උපදේශනය',
  'aura එක පිරිසිදු කිරීම සඳහා මගපෙන්වීම',
  'සුවපත් ජීවිතයක් කරා යොමු කරන උපකාර',
  'කුණ්ඩලීනී ශක්තීන් පිළිබඳ මගපෙන්වීම',
  'නිවෙස් ආරක්ෂාව සහ සර්ව ආරක්ෂාව',
  'සර්ව ආරක්ෂක යන්ත්‍රයක් පිළිබඳ මගපෙන්වීම',
];

export default function Services() {
  return (
    <section id="services" className="section bg-[var(--theme-section)]">
      <div className="container-shell">
        <p className="eyebrow">Services</p>
        <h2 className="mt-3 text-4xl font-black text-[var(--theme-primary)]">නොමිලේ ලබාදෙන සේවාවන්</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map(([title, Icon]) => (
            <article key={title} className="surface interactive-card rounded-lg p-6">
              <Icon className="text-[var(--theme-accent)]" size={28} />
              <h3 className="mt-4 text-xl font-black text-[var(--theme-primary)]">{title}</h3>
            </article>
          ))}
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {help.map((item, index) => (
            <div key={item} className="interactive-card rounded-lg border border-[color-mix(in_srgb,var(--theme-accent)_25%,transparent)] bg-[var(--theme-surface)] p-5 font-bold text-[var(--theme-text)]">
              <span className="text-[var(--theme-accent)]">{String(index + 1).padStart(2, '0')}</span> {item}
            </div>
          ))}
        </div>
        <p className="mt-8 rounded-lg border border-[color-mix(in_srgb,var(--theme-accent)_30%,transparent)] bg-[var(--theme-primary)] p-5 leading-7 text-[var(--theme-hero-text)]">
          මෙම සේවාව උපදේශන හා ආධ්‍යාත්මික මගපෙන්වීමක් ලෙස ලබාදේ. හදිසි වෛද්‍ය, මානසික සෞඛ්‍ය හෝ නීතිමය අවශ්‍යතාවක් ඇත්නම් සුදුසු වෘත්තීය සේවාවකට වහාම යොමුවන්න.
        </p>
      </div>
    </section>
  );
}
