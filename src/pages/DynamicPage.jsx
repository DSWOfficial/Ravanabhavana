import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Footer from '../components/public/Footer.jsx';
import Header from '../components/public/Header.jsx';
import PageRenderer from '../components/public/PageRenderer.jsx';
import { getPublishedPageBySlug } from '../lib/cms.js';

function setMeta(selector, attrs) {
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement('meta');
    Object.entries(attrs.identity).forEach(([key, value]) => tag.setAttribute(key, value));
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', attrs.content || '');
}

export default function DynamicPage({ slug: forcedSlug }) {
  const params = useParams();
  const slug = forcedSlug || params.slug || 'home';
  const [state, setState] = useState({ loading: true, page: null });

  useEffect(() => {
    let mounted = true;
    setState({ loading: true, page: null });
    getPublishedPageBySlug(slug)
      .then((page) => {
        if (!mounted) return;
        setState({ loading: false, page });
        if (page) {
          document.title = page.seoTitle || page.title || 'රාවණ භවණ';
          setMeta('meta[name="description"]', { identity: { name: 'description' }, content: page.seoDescription });
          setMeta('meta[property="og:title"]', { identity: { property: 'og:title' }, content: page.seoTitle || page.title });
          setMeta('meta[property="og:description"]', { identity: { property: 'og:description' }, content: page.seoDescription });
          setMeta('meta[property="og:image"]', { identity: { property: 'og:image' }, content: page.ogImage });
        }
      })
      .catch(() => mounted && setState({ loading: false, page: null }));
    return () => { mounted = false; };
  }, [slug]);

  return (
    <>
      <Header />
      <main>
        {state.loading && <section className="section bg-[var(--theme-section)]"><div className="container-shell">Loading...</div></section>}
        {!state.loading && !state.page && <section className="section bg-[var(--theme-section)]"><div className="container-shell"><h1 className="text-4xl font-black text-[var(--theme-primary)]">Page not found</h1></div></section>}
        <PageRenderer page={state.page} />
      </main>
      <Footer />
    </>
  );
}
