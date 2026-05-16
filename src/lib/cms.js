import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase.js';

export const sectionTypes = [
  'hero',
  'text',
  'textImage',
  'gallery',
  'video',
  'quote',
  'cards',
  'faq',
  'cta',
  'contact',
];

export const emptyPage = {
  title: '',
  slug: '',
  seoTitle: '',
  seoDescription: '',
  ogImage: '',
  published: false,
  sections: [],
};

export function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function createSection(type = 'text') {
  const base = { id: crypto.randomUUID(), type };
  const presets = {
    hero: { eyebrow: '', title: 'New hero', subtitle: '', body: '', image: '', primaryLabel: '', primaryUrl: '', secondaryLabel: '', secondaryUrl: '' },
    text: { title: 'Text section', body: '' },
    textImage: { title: 'Text and image', body: '', image: '', imageAlt: '', imagePosition: 'right' },
    gallery: { title: 'Gallery', images: [] },
    video: { title: 'Video', body: '', videoUrl: '' },
    quote: { quote: '', author: '' },
    cards: { title: 'Cards', cards: [{ title: '', body: '', image: '', url: '' }] },
    faq: { title: 'FAQ', items: [{ question: '', answer: '' }] },
    cta: { title: 'Call to action', body: '', buttonLabel: '', buttonUrl: '' },
    contact: { title: 'Contact', body: '', phone: '', email: '', whatsapp: '' },
  };
  return { ...base, ...(presets[type] || presets.text) };
}

export function normalizePage(data = {}, id = '') {
  return {
    id,
    ...emptyPage,
    ...data,
    sections: Array.isArray(data.sections) ? data.sections : [],
  };
}

export async function listPages() {
  const snap = await getDocs(query(collection(db, 'pages'), orderBy('updatedAt', 'desc')));
  return snap.docs.map((item) => normalizePage(item.data(), item.id));
}

export async function getPage(id) {
  const snap = await getDoc(doc(db, 'pages', id));
  return snap.exists() ? normalizePage(snap.data(), snap.id) : null;
}

export async function getPageBySlug(slug) {
  const snap = await getDocs(query(collection(db, 'pages'), where('slug', '==', slug)));
  return snap.docs[0] ? normalizePage(snap.docs[0].data(), snap.docs[0].id) : null;
}

export async function getPublishedPageBySlug(slug) {
  const snap = await getDocs(query(collection(db, 'pages'), where('slug', '==', slug), where('published', '==', true)));
  return snap.docs[0] ? normalizePage(snap.docs[0].data(), snap.docs[0].id) : null;
}

export async function createPage(payload) {
  const docRef = await addDoc(collection(db, 'pages'), {
    ...emptyPage,
    ...payload,
    slug: slugify(payload.slug || payload.title),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function savePage(id, payload) {
  const clean = { ...payload };
  if (payload.slug || payload.title) clean.slug = slugify(payload.slug || payload.title);
  await updateDoc(doc(db, 'pages', id), {
    ...clean,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePage(id) {
  await deleteDoc(doc(db, 'pages', id));
}

export async function listNavigation() {
  const snap = await getDocs(query(collection(db, 'navigation'), orderBy('order', 'asc')));
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function saveNavigationItem(item) {
  const payload = {
    label: item.label || '',
    url: item.url || '',
    order: Number(item.order) || 0,
    visible: Boolean(item.visible),
    updatedAt: serverTimestamp(),
  };
  if (item.id) return updateDoc(doc(db, 'navigation', item.id), payload);
  return addDoc(collection(db, 'navigation'), { ...payload, createdAt: serverTimestamp() });
}

export async function deleteNavigationItem(id) {
  await deleteDoc(doc(db, 'navigation', id));
}

export async function saveMediaRecord(payload) {
  return addDoc(collection(db, 'media'), {
    ...payload,
    createdAt: serverTimestamp(),
  });
}
