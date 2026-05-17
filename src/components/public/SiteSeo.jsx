import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../../firebase.js';
import { normalizeSeo } from '../../lib/siteSettings.js';

function setMeta(selector, identity, content) {
  if (!content) return;
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    Object.entries(identity).forEach(([key, value]) => element.setAttribute(key, value));
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setLink(selector, rel, href) {
  if (!href) return;
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

export default function SiteSeo() {
  const [seo, setSeo] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'siteSettings', 'seo'), async (snap) => {
      if (snap.exists()) {
        setSeo(normalizeSeo(snap.data()));
        return;
      }
      try {
        const legacy = await getDoc(doc(db, 'seo', 'global'));
        setSeo(normalizeSeo(legacy.exists() ? legacy.data() : {}));
      } catch (error) {
        console.error('Failed to load SEO settings', error);
        setSeo(normalizeSeo({}));
      }
    }, (error) => {
      console.error('Failed to subscribe to SEO settings', error);
      setSeo(normalizeSeo({}));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const next = normalizeSeo(seo || {});
    document.title = next.siteTitle;
    setMeta('meta[name="description"]', { name: 'description' }, next.metaDescription);
    setMeta('meta[name="keywords"]', { name: 'keywords' }, next.keywords.join(', '));
    setMeta('meta[name="author"]', { name: 'author' }, next.author);
    setMeta('meta[name="robots"]', { name: 'robots' }, next.robots);
    setMeta('meta[property="og:title"]', { property: 'og:title' }, next.ogTitle || next.siteTitle);
    setMeta('meta[property="og:description"]', { property: 'og:description' }, next.ogDescription || next.metaDescription);
    setMeta('meta[property="og:image"]', { property: 'og:image' }, next.ogImage);
    setMeta('meta[property="og:type"]', { property: 'og:type' }, 'website');
    setMeta('meta[name="twitter:card"]', { name: 'twitter:card' }, next.twitterImage || next.ogImage ? 'summary_large_image' : 'summary');
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, next.twitterTitle || next.ogTitle || next.siteTitle);
    setMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, next.twitterDescription || next.ogDescription || next.metaDescription);
    setMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, next.twitterImage || next.ogImage);
    setLink('link[rel="canonical"]', 'canonical', next.canonicalUrl);
    setLink('link[rel="icon"]', 'icon', next.faviconUrl);
  }, [seo]);

  return null;
}
