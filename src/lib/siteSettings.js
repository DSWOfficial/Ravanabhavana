export const defaultHomepageSections = [
  { id: 'hero', label: 'Hero', enabled: true, order: 1, title: '', subtitle: '', layout: 'default' },
  { id: 'banners', label: 'Banners', enabled: true, order: 2, title: '', subtitle: '', layout: 'default' },
  { id: 'about', label: 'About', enabled: true, order: 3, title: '', subtitle: '', layout: 'default' },
  { id: 'services', label: 'Services', enabled: true, order: 4, title: '', subtitle: '', layout: 'default' },
  { id: 'videos', label: 'Videos', enabled: true, order: 5, title: '', subtitle: '', layout: 'default' },
  { id: 'live', label: 'Ravana Bhavana Live', enabled: true, order: 6, title: '', subtitle: '', layout: 'default' },
  { id: 'guidance', label: 'Anonymous Guidance', enabled: true, order: 7, title: '', subtitle: '', layout: 'default' },
  { id: 'weeklySession', label: 'Weekly Session', enabled: true, order: 8, title: '', subtitle: '', layout: 'default' },
  { id: 'support', label: 'Support', enabled: true, order: 9, title: '', subtitle: '', layout: 'default' },
  { id: 'contact', label: 'Contact', enabled: true, order: 10, title: '', subtitle: '', layout: 'default' },
  { id: 'faq', label: 'FAQ', enabled: false, order: 11, title: '', subtitle: '', layout: 'default' },
  { id: 'testimonials', label: 'Testimonials', enabled: false, order: 12, title: '', subtitle: '', layout: 'default' },
  { id: 'customHtml', label: 'Custom HTML / Custom Section', enabled: false, order: 13, title: '', subtitle: '', layout: 'default' },
];

export const defaultSeoSettings = {
  siteTitle: 'Ravana Bhavana | රාවණ භවණ',
  metaDescription: 'Free guidance, weekly sessions, videos, and social service from Ravana Bhavana.',
  keywords: ['spiritual guidance', 'counselling', 'Ravana Bhavana'],
  author: 'Ravana Bhavana',
  ogTitle: 'Ravana Bhavana | රාවණ භවණ',
  ogDescription: 'Free guidance, weekly sessions, videos, and social service from Ravana Bhavana.',
  ogImage: '',
  twitterTitle: 'Ravana Bhavana | රාවණ භවණ',
  twitterDescription: 'Free guidance, weekly sessions, videos, and social service from Ravana Bhavana.',
  twitterImage: '',
  canonicalUrl: '',
  robots: 'index, follow',
  faviconUrl: '',
};

export const defaultAnnouncementBar = {
  enabled: false,
  message: 'අද සජීවී වැඩසටහන රාත්‍රී 8.00ට',
  messageSinhala: '',
  messageEnglish: '',
  buttonText: 'Join Now',
  buttonLink: '',
  openInNewTab: true,
  style: 'spiritual-gold',
  position: 'top',
  visibility: 'all',
  selectedPages: [],
  startAt: '',
  endAt: '',
  dismissible: true,
  rememberDismissal: true,
  animation: 'slide-down',
  icon: 'bell',
  colors: {
    background: '#1f160b',
    text: '#fff6d6',
    buttonBackground: '#d6a84f',
    buttonText: '#1f160b',
  },
};

export const announcementPresets = {
  live: {
    message: 'අද සජීවී වැඩසටහන රාත්‍රී 8.00ට',
    buttonText: 'Join Session',
    style: 'urgent',
    icon: 'bell',
    colors: { background: '#3b0d10', text: '#fff6d6', buttonBackground: '#d6a84f', buttonText: '#1f160b' },
  },
  video: {
    message: 'නව වීඩියෝ පාඩමක් එක් කර ඇත',
    buttonText: 'Watch Now',
    style: 'info',
    icon: 'video',
    colors: { background: '#10233f', text: '#eef9ff', buttonBackground: '#63d7e8', buttonText: '#10233f' },
  },
  whatsapp: {
    message: 'ඔබේ ප්‍රශ්නය WhatsApp හරහා යොමු කරන්න',
    buttonText: 'Contact WhatsApp',
    style: 'success',
    icon: 'whatsapp',
    colors: { background: '#12372f', text: '#f3fff7', buttonBackground: '#8fd69d', buttonText: '#12372f' },
  },
  donation: {
    message: 'මෙම නොමිලේ සේවාවට සහය දක්වන්න',
    buttonText: 'Support',
    style: 'spiritual-gold',
    icon: 'star',
    colors: { background: '#1f160b', text: '#fff6d6', buttonBackground: '#d6a84f', buttonText: '#1f160b' },
  },
  custom: {
    message: '',
    buttonText: '',
    style: 'custom',
    icon: 'none',
    colors: { background: '#1f160b', text: '#fff6d6', buttonBackground: '#d6a84f', buttonText: '#1f160b' },
  },
};

export const defaultMediaFolders = [
  { id: 'thumbnails', name: 'Thumbnails', order: 1 },
  { id: 'banners', name: 'Banners', order: 2 },
  { id: 'profile-images', name: 'Profile Images', order: 3 },
  { id: 'study-materials', name: 'Study Materials', order: 4 },
  { id: 'pdfs', name: 'PDFs', order: 5 },
  { id: 'audio', name: 'Audio', order: 6 },
  { id: 'documents', name: 'Documents', order: 7 },
  { id: 'page-images', name: 'Page Images', order: 8 },
  { id: 'other', name: 'Other', order: 99 },
];

export function mergeHomepageSections(value) {
  const incoming = Array.isArray(value) ? value : [];
  const byId = Object.fromEntries(incoming.map((item) => [item.id, item]));
  const merged = defaultHomepageSections.map((section) => ({ ...section, ...(byId[section.id] || {}) }));
  incoming.forEach((item) => {
    if (item.id && !merged.some((section) => section.id === item.id)) merged.push(item);
  });
  return merged.sort((a, b) => Number(a.order || 999) - Number(b.order || 999));
}

export function normalizeSeo(value = {}) {
  return {
    ...defaultSeoSettings,
    ...value,
    keywords: Array.isArray(value.keywords) ? value.keywords : String(value.keywords || defaultSeoSettings.keywords.join(', ')).split(',').map((item) => item.trim()).filter(Boolean),
  };
}

export function normalizeAnnouncement(value = {}) {
  return {
    ...defaultAnnouncementBar,
    ...value,
    colors: { ...defaultAnnouncementBar.colors, ...(value.colors || {}) },
  };
}
