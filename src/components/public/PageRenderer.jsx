import { Mail, MessageCircle, Phone, PlayCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';

function SectionShell({ children, alt = false }) {
  return <section className={`section ${alt ? 'bg-[var(--theme-section)]' : 'bg-[var(--theme-surface)]'}`}><div className="container-shell">{children}</div></section>;
}

function LinkButton({ label, url, variant = 'primary' }) {
  if (!label || !url) return null;
  return <a className={`btn ${variant === 'outline' ? 'btn-outline' : 'btn-primary'}`} href={url}>{label}</a>;
}

function renderSection(section, index, t, getLocalized) {
  if (section.type === 'html') {
    return (
      <div
        key={section.id || index}
        className="cms-html-section"
        dangerouslySetInnerHTML={{ __html: section.html || '' }}
      />
    );
  }

  if (section.type === 'hero') {
    return (
      <section key={section.id || index} className="relative overflow-hidden bg-[var(--theme-hero)] text-[var(--theme-hero-text)]">
        <div className="container-shell grid min-h-[560px] items-center gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            {section.eyebrow && <p className="text-sm font-bold text-[var(--theme-accent)]">{getLocalized(section, 'eyebrow', section.eyebrow)}</p>}
            <h1 className="mt-4 text-5xl font-black leading-tight sm:text-7xl">{getLocalized(section, 'title', section.title)}</h1>
            {section.subtitle && <p className="mt-3 text-2xl font-bold text-[color-mix(in_srgb,var(--theme-accent)_76%,white)]">{getLocalized(section, 'subtitle', section.subtitle)}</p>}
            {section.body && <p className="mt-6 max-w-2xl whitespace-pre-wrap text-lg leading-8 text-[color-mix(in_srgb,var(--theme-hero-text)_84%,var(--theme-accent))]">{getLocalized(section, 'body', section.body)}</p>}
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton label={section.primaryLabel} url={section.primaryUrl} />
              <LinkButton label={section.secondaryLabel} url={section.secondaryUrl} variant="outline" />
            </div>
          </div>
          {section.image && <img src={section.image} alt={section.title || ''} className="mx-auto w-full max-w-[500px] rounded-lg border border-[color-mix(in_srgb,var(--theme-accent)_35%,transparent)] object-cover shadow-2xl" />}
        </div>
      </section>
    );
  }

  if (section.type === 'text') {
    return <SectionShell key={section.id || index} alt={index % 2 === 1}><div className="max-w-3xl"><h2 className="text-4xl font-black text-[var(--theme-primary)]">{section.title}</h2><p className="mt-5 whitespace-pre-wrap text-lg leading-8 text-[var(--theme-text)]">{section.body}</p></div></SectionShell>;
  }

  if (section.type === 'textImage') {
    const image = section.image && <img src={section.image} alt={section.imageAlt || section.title || ''} className="w-full rounded-lg object-cover shadow-xl" />;
    const text = <div><h2 className="text-4xl font-black text-[var(--theme-primary)]">{section.title}</h2><p className="mt-5 whitespace-pre-wrap text-lg leading-8 text-[var(--theme-text)]">{section.body}</p></div>;
    return <SectionShell key={section.id || index} alt={index % 2 === 1}><div className="grid gap-8 lg:grid-cols-2 lg:items-center">{section.imagePosition === 'left' ? <>{image}{text}</> : <>{text}{image}</>}</div></SectionShell>;
  }

  if (section.type === 'gallery') {
    return <SectionShell key={section.id || index} alt={index % 2 === 1}><h2 className="text-4xl font-black text-[var(--theme-primary)]">{section.title}</h2><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{(section.images || []).map((image) => <img key={image.url || image} src={image.url || image} alt={image.alt || section.title || ''} className="aspect-[4/3] w-full rounded-lg object-cover shadow-lg" />)}</div></SectionShell>;
  }

  if (section.type === 'video') {
    return <SectionShell key={section.id || index} alt={index % 2 === 1}><div className="surface rounded-lg p-6"><PlayCircle className="text-[var(--theme-accent)]" /><h2 className="mt-3 text-3xl font-black text-[var(--theme-primary)]">{getLocalized(section, 'title', section.title)}</h2><p className="mt-3 text-[var(--theme-muted)]">{getLocalized(section, 'body', section.body)}</p><a className="btn btn-primary mt-5" href={section.videoUrl} target="_blank" rel="noreferrer">{t('common.watch')}</a></div></SectionShell>;
  }

  if (section.type === 'quote') {
    return <SectionShell key={section.id || index} alt={index % 2 === 1}><blockquote className="surface rounded-lg p-8"><p className="text-3xl font-black leading-tight text-[var(--theme-primary)]">"{section.quote}"</p>{section.author && <footer className="mt-4 bg-transparent p-0 text-[var(--theme-muted)]">{section.author}</footer>}</blockquote></SectionShell>;
  }

  if (section.type === 'cards') {
    return <SectionShell key={section.id || index} alt={index % 2 === 1}><h2 className="text-4xl font-black text-[var(--theme-primary)]">{section.title}</h2><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{(section.cards || []).map((card, cardIndex) => <article className="surface interactive-card rounded-lg p-5" key={`${card.title}-${cardIndex}`}>{card.image && <img className="mb-4 aspect-video w-full rounded object-cover" src={card.image} alt={card.title || ''} />}<h3 className="text-xl font-black text-[var(--theme-primary)]">{card.title}</h3><p className="mt-2 text-[var(--theme-muted)]">{card.body}</p>{card.url && <a className="btn btn-outline mt-4" href={card.url}>Open</a>}</article>)}</div></SectionShell>;
  }

  if (section.type === 'faq') {
    return <SectionShell key={section.id || index} alt={index % 2 === 1}><h2 className="text-4xl font-black text-[var(--theme-primary)]">{section.title}</h2><div className="mt-6 grid gap-3">{(section.items || []).map((item, itemIndex) => <details className="surface rounded-lg p-5" key={`${item.question}-${itemIndex}`}><summary className="cursor-pointer font-black text-[var(--theme-primary)]">{item.question}</summary><p className="mt-3 text-[var(--theme-muted)]">{item.answer}</p></details>)}</div></SectionShell>;
  }

  if (section.type === 'cta') {
    return <SectionShell key={section.id || index} alt={index % 2 === 1}><div className="rounded-lg bg-[var(--theme-primary)] p-8 text-[var(--theme-hero-text)]"><h2 className="text-4xl font-black">{section.title}</h2><p className="mt-3 max-w-3xl text-lg">{section.body}</p><LinkButton label={section.buttonLabel} url={section.buttonUrl} /></div></SectionShell>;
  }

  if (section.type === 'contact') {
    return <SectionShell key={section.id || index} alt={index % 2 === 1}><h2 className="text-4xl font-black text-[var(--theme-primary)]">{section.title}</h2><p className="mt-3 text-[var(--theme-muted)]">{section.body}</p><div className="mt-6 flex flex-wrap gap-3">{section.phone && <a className="btn btn-outline" href={`tel:${section.phone}`}><Phone size={18} />{section.phone}</a>}{section.email && <a className="btn btn-outline" href={`mailto:${section.email}`}><Mail size={18} />{section.email}</a>}{section.whatsapp && <a className="btn btn-primary" href={`https://wa.me/${section.whatsapp}`}><MessageCircle size={18} />WhatsApp</a>}</div></SectionShell>;
  }

  return null;
}

export default function PageRenderer({ page }) {
  const { t, getLocalized } = useLanguage();
  if (!page) return null;
  if (page.content && !(page.sections || []).length) {
    return <div className="cms-html-section" dangerouslySetInnerHTML={{ __html: page.content }} />;
  }
  return <>{(page.sections || []).map((section, index) => renderSection(section, index, t, getLocalized))}</>;
}
