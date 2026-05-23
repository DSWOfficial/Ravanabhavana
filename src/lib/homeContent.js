import { collection, doc, getDocs, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase.js';

export const HOME_SECTIONS_COLLECTION = 'homeSections';
export const homeSectionPath = (id) => `${HOME_SECTIONS_COLLECTION}/${id}`;
export const homeSectionDoc = (id) => doc(db, HOME_SECTIONS_COLLECTION, id);

export function timestampCacheKey(value) {
  if (!value) return '';
  if (typeof value.toMillis === 'function') return String(value.toMillis());
  if (typeof value.toDate === 'function') return String(value.toDate().getTime());
  if (value instanceof Date) return String(value.getTime());
  if (typeof value === 'object' && Number.isFinite(value.seconds)) return `${value.seconds}${value.nanoseconds || 0}`;
  return String(value);
}

export function cacheBustedImageUrl(url, updatedAt) {
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) return url;
  const cacheKey = timestampCacheKey(updatedAt);
  if (!cacheKey) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${encodeURIComponent(cacheKey)}`;
}

export const defaultHomeSections = {
  hero: {
    eyebrow: 'හෙළ උරුමය · ආධ්‍යාත්මික ප්‍රඥාව',
    eyebrow_si: 'හෙළ උරුමය · ආධ්‍යාත්මික ප්‍රඥාව',
    eyebrow_en: 'Hela Heritage · Spiritual Wisdom',
    title: 'රාවණ භවණ',
    title_si: 'රාවණ භවණ',
    title_en: 'Ravana Bhavana',
    subtitle: 'මඟපෙන්වීම, ඉගෙනීම සහ අභ්‍යන්තර ශක්තිය සඳහා නොමිලේ සමාජ සේවාවක්',
    subtitle_si: 'මඟපෙන්වීම, ඉගෙනීම සහ අභ්‍යන්තර ශක්තිය සඳහා නොමිලේ සමාජ සේවාවක්',
    subtitle_en: 'A free social service for guidance, learning, and inner strength',
    description: 'පැහැදිලිබව සහ ශක්තිය සොයන ඔබ වෙනුවෙන් ප්‍රායෝගික ආධ්‍යාත්මික මඟපෙන්වීම, උපදේශන සහාය, සතිපතා සැසි සහ අධ්‍යාපනික වීඩියෝ සම්පත්.',
    description_si: 'පැහැදිලිබව සහ ශක්තිය සොයන ඔබ වෙනුවෙන් ප්‍රායෝගික ආධ්‍යාත්මික මඟපෙන්වීම, උපදේශන සහාය, සතිපතා සැසි සහ අධ්‍යාපනික වීඩියෝ සම්පත්.',
    description_en: 'Practical spiritual guidance, counselling support, weekly sessions, and educational video resources for anyone seeking clarity and strength.',
    primaryLabel: 'WhatsApp හරහා සම්බන්ධ වන්න',
    primaryLabel_si: 'WhatsApp හරහා සම්බන්ධ වන්න',
    primaryLabel_en: 'Contact on WhatsApp',
    primaryUrl: 'https://wa.me/94777193197',
    secondaryLabel: 'වීඩියෝ නරඹන්න',
    secondaryLabel_si: 'වීඩියෝ නරඹන්න',
    secondaryLabel_en: 'Watch Videos',
    secondaryUrl: '/videos',
    imageUrl: '/ravana-bhawana-logo.png',
    published: true,
  },
  about: {
    eyebrow: 'අප ගැන',
    eyebrow_si: 'අප ගැන',
    eyebrow_en: 'About',
    heading: 'S. Udara Sampath Rodrigo',
    subheading: 'වෘත්තීය උපදේශන සහ ආධ්‍යාත්මික මඟපෙන්වීම',
    subheading_si: 'වෘත්තීය උපදේශන සහ ආධ්‍යාත්මික මඟපෙන්වීම',
    subheading_en: 'Professional counselling and spiritual guidance',
    description: 'රාවණ භවණ උපදේශන අත්දැකීම්, සමාජ සේවාව සහ හෙළ උරුම දැනුම එකට එක්කරමින් වගකීමෙන් සහ කරුණාවෙන් නොමිලේ මඟපෙන්වීම ලබා දෙයි.',
    description_si: 'රාවණ භවණ උපදේශන අත්දැකීම්, සමාජ සේවාව සහ හෙළ උරුම දැනුම එකට එක්කරමින් වගකීමෙන් සහ කරුණාවෙන් නොමිලේ මඟපෙන්වීම ලබා දෙයි.',
    description_en: 'Ravana Bhavana brings together counselling experience, community service, and Hela heritage knowledge to offer free guidance with care and responsibility.',
    imageUrl: '/profilepic.png?v=2',
    features: ['වෘත්තීය උපදේශන සහාය', 'SLPPCA member', 'නොමිලේ සමාජ සේවාව'],
    published: true,
  },
  countdown: {
    title: 'ඊළඟ සජීවී වැඩසටහන',
    description: 'සතිපතා මඟපෙන්වීමේ සැසියක් සැලසුම් වූ විට මෙහි දැනුම් දෙනු ඇත.',
    eventDateTime: '',
    published: true,
  },
  contact: {
    heading: 'රාවණ භවණ සමඟ සම්බන්ධ වන්න',
    text: 'ඔබගේ ප්‍රශ්නය WhatsApp හඬ පණිවිඩයක් ලෙස යවන්න.',
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
    tagline: 'නොමිලේ සමාජ සේවා වේදිකාව',
    tagline_si: 'නොමිලේ සමාජ සේවා වේදිකාව',
    tagline_en: 'Free social service platform',
    copyrightText: `© ${new Date().getFullYear()} රාවණ භවණ. සියලු හිමිකම් ඇවිරිණි.`,
    copyrightText_si: `© ${new Date().getFullYear()} රාවණ භවණ. සියලු හිමිකම් ඇවිරිණි.`,
    copyrightText_en: `© ${new Date().getFullYear()} Ravana Bhavana. All rights reserved.`,
    published: true,
  },
};

export const defaultServices = [
  { title: 'උපදේශන සහාය', title_si: 'උපදේශන සහාය', title_en: 'Counselling Support', description: 'මානසික ශක්තිය, පැහැදිලිබව සහ ජීවිතයේ ප්‍රායෝගික අභියෝග සඳහා මඟපෙන්වීම.', description_si: 'මානසික ශක්තිය, පැහැදිලිබව සහ ජීවිතයේ ප්‍රායෝගික අභියෝග සඳහා මඟපෙන්වීම.', description_en: 'Guidance for mental strength, clarity, and practical life challenges.', icon: 'Brain', order: 1, published: true },
  { title: 'ආධ්‍යාත්මික අවදිවීම', title_si: 'ආධ්‍යාත්මික අවදිවීම', title_en: 'Spiritual Awakening', description: 'භාවනා, ස්වයං අවබෝධය සහ පුද්ගලික වර්ධනය සඳහා සහාය.', description_si: 'භාවනා, ස්වයං අවබෝධය සහ පුද්ගලික වර්ධනය සඳහා සහාය.', description_en: 'Support for meditation, self-awareness, and personal growth.', icon: 'Sun', order: 2, published: true },
  { title: 'හෙළ උරුමය', title_si: 'හෙළ උරුමය', title_en: 'Hela Heritage', description: 'දේශීය උරුමය, වටිනාකම් සහ සංස්කෘතික දැනුම මත පදනම් වූ ප්‍රඥාව.', description_si: 'දේශීය උරුමය, වටිනාකම් සහ සංස්කෘතික දැනුම මත පදනම් වූ ප්‍රඥාව.', description_en: 'Wisdom rooted in local heritage, values, and cultural knowledge.', icon: 'Landmark', order: 3, published: true },
  { title: 'ආරක්ෂණ මඟපෙන්වීම', title_si: 'ආරක්ෂණ මඟපෙන්වීම', title_en: 'Protective Guidance', description: 'නිවස, පුද්ගලික ජීවිතය සහ ආධ්‍යාත්මික ආරක්ෂාව සඳහා ප්‍රායෝගික මඟපෙන්වීම.', description_en: 'Practical guidance for home, personal, and spiritual protection.', icon: 'Shield', order: 4, published: true },
  { title: 'විශ්ව දැනුම', title_si: 'විශ්ව දැනුම', title_en: 'Universal Knowledge', description: 'ජ්‍යෝතිෂය, සුක්ෂම ශක්ති සහ ගැඹුරු දැනුම් පද්ධති පිළිබඳ අධ්‍යයනය.', description_en: 'Exploring astrology, subtle energies, and deeper knowledge systems.', icon: 'Stars', order: 5, published: true },
  { title: 'ශක්ති අභ්‍යාස', title_si: 'ශක්ති අභ්‍යාස', title_en: 'Energy Practices', description: 'ආරා ශුද්ධ කිරීම, ශක්ති සමබරතාව සහ අභ්‍යන්තර විනය සඳහා මඟපෙන්වීම.', description_en: 'Guidance for aura cleansing, energy balance, and inner discipline.', icon: 'Sparkles', order: 6, published: true },
];

export async function seedDefaultHomeContent(userEmail = '') {
  const writes = [
    ...Object.entries(defaultHomeSections).map(([id, data]) => [homeSectionPath(id), data]),
    ['donationSettings/main', {
      organizationName: 'රාවණ භවණ',
      accountHolderName: 'S. Udara Sampath Rodrigo',
      bankName: '',
      branch: '',
      accountNumber: '',
      heading: 'පරිත්‍යාග සහාය',
      heading_si: 'පරිත්‍යාග සහාය',
      heading_en: 'Support the Service',
      description: 'මෙම නොමිලේ සමාජ සේවාව දිගටම පවත්වාගෙන යාමට ඔබේ සහාය උපකාරී වේ.',
      description_en: 'Your support helps keep this free community service available.',
      ctaLabel: 'WhatsApp පණිවිඩය යවන්න',
      ctaLabel_en: 'Send donation details',
    }],
    ['seo/global', {
      siteTitle: 'Ravana Bhavana | රාවණ භවණ',
      metaDescription: 'රාවණ භවණ වෙතින් නොමිලේ මඟපෙන්වීම, සතිපතා වැඩසටහන්, වීඩියෝ සහ සමාජ සේවාව.',
      metaDescription_en: 'Free guidance, weekly sessions, videos, and social service from Ravana Bhavana.',
      canonicalUrl: '',
      openGraphImageUrl: '/ravana-bhawana-logo.png',
      publicReadable: true,
    }],
    ['navigation/main', {
      label: 'ප්‍රධාන මෙනුව',
      label_si: 'ප්‍රධාන මෙනුව',
      label_en: 'Main Navigation',
      url: '/',
      visible: false,
      order: 0,
      links: [
        { label: 'මුල් පිටුව', label_si: 'මුල් පිටුව', label_en: 'Home', url: '/', order: 1, visible: true },
        { label: 'සේවාවන්', label_si: 'සේවාවන්', label_en: 'Services', url: '/#services', order: 2, visible: true },
        { label: 'වීඩියෝ', label_si: 'වීඩියෝ', label_en: 'Videos', url: '/videos', order: 3, visible: true },
        { label: 'සම්බන්ධ වන්න', label_si: 'සම්බන්ධ වන්න', label_en: 'Contact', url: '/#contact', order: 4, visible: true },
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
