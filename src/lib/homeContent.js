import { collection, doc, getDocs, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase.js';

export const defaultHomeSections = {
  hero: {
    eyebrow: 'Hela Heritage · Spiritual Wisdom',
    title: 'Ravana Bhavana',
    subtitle: 'A free social service for guidance, learning, and inner strength',
    description: 'Practical spiritual guidance, counselling support, weekly sessions, and educational video resources for anyone seeking clarity and strength.',
    primaryLabel: 'Contact on WhatsApp',
    primaryUrl: 'https://wa.me/94777193197',
    secondaryLabel: 'Watch Videos',
    secondaryUrl: '#videos',
    imageUrl: '/ravana-bhawana-logo.png',
    published: true,
  },
  about: {
    eyebrow: 'About',
    heading: 'S. Udara Sampath Rodrigo',
    subheading: 'Professional counselling and spiritual guidance',
    description: 'Ravana Bhavana brings together counselling experience, community service, and Hela heritage knowledge to offer free guidance with care and responsibility.',
    imageUrl: '/profilepic.png?v=2',
    features: ['Professional counselling support', 'SLPPCA member', 'Free community service'],
    published: true,
  },
  countdown: {
    title: 'Next Live Session',
    description: 'Join the next guided weekly session when the schedule is available.',
    eventDateTime: '',
    published: true,
  },
  contact: {
    heading: 'Contact Ravana Bhavana',
    text: 'Send your question as a WhatsApp voice message or contact us through the available social channels.',
    phone: '+94 77 719 3197',
    email: '',
    address: 'Sri Lanka',
    whatsappNumber: '94777193197',
    whatsappGroupUrl: '',
    youtubeChannelUrl: '',
    facebookPageUrl: '',
    published: true,
  },
  footer: {
    logoUrl: '/ravana-bhawana-logo.png',
    tagline: 'Free social service platform',
    copyrightText: `© ${new Date().getFullYear()} Ravana Bhavana. All rights reserved.`,
    published: true,
  },
};

export const defaultServices = [
  { title: 'Counselling Support', description: 'Guidance for mental strength, clarity, and practical life challenges.', icon: 'Brain', order: 1, published: true },
  { title: 'Spiritual Awakening', description: 'Support for meditation, self-awareness, and personal growth.', icon: 'Sun', order: 2, published: true },
  { title: 'Hela Heritage', description: 'Wisdom rooted in local heritage, values, and cultural knowledge.', icon: 'Landmark', order: 3, published: true },
  { title: 'Protective Guidance', description: 'Practical guidance for home, personal, and spiritual protection.', icon: 'Shield', order: 4, published: true },
  { title: 'Universal Knowledge', description: 'Exploring astrology, subtle energies, and deeper knowledge systems.', icon: 'Stars', order: 5, published: true },
  { title: 'Energy Practices', description: 'Guidance for aura cleansing, energy balance, and inner discipline.', icon: 'Sparkles', order: 6, published: true },
];

export async function seedDefaultHomeContent(userEmail = '') {
  const writes = [
    ...Object.entries(defaultHomeSections).map(([id, data]) => [`homeSections/${id}`, data]),
    ['donationSettings/main', {
      organizationName: 'Ravana Bhavana',
      accountHolderName: 'S. Udara Sampath Rodrigo',
      bankName: '',
      branch: '',
      accountNumber: '',
      heading: 'Support the Service',
      description: 'Your support helps keep this free community service available.',
      ctaLabel: 'Send donation details',
    }],
    ['seo/global', {
      siteTitle: 'Ravana Bhavana | රාවණ භවණ',
      metaDescription: 'Free guidance, weekly sessions, videos, and social service from Ravana Bhavana.',
      canonicalUrl: '',
      openGraphImageUrl: '/ravana-bhawana-logo.png',
      publicReadable: true,
    }],
    ['navigation/main', {
      label: 'Main Navigation',
      url: '/',
      visible: false,
      order: 0,
      links: [
        { label: 'Home', url: '/', order: 1, visible: true },
        { label: 'Services', url: '/#services', order: 2, visible: true },
        { label: 'Videos', url: '/#videos', order: 3, visible: true },
        { label: 'Contact', url: '/#contact', order: 4, visible: true },
      ],
    }],
  ];

  for (const [path, data] of writes) {
    try {
      const [collectionName, id] = path.split('/');
      await setDoc(doc(db, collectionName, id), { ...data, updatedAt: serverTimestamp(), updatedBy: userEmail }, { merge: true });
    } catch (error) {
      const next = new Error(`${path}: ${error.code ? `${error.code} - ` : ''}${error.message}`);
      next.code = error.code;
      next.path = path;
      next.collectionName = path.split('/')[0];
      throw next;
    }
  }
}

export async function listServices() {
  const snap = await getDocs(query(collection(db, 'services'), orderBy('order', 'asc')));
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
}
