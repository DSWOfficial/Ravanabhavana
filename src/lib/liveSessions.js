export const defaultLiveSession = {
  title_si: '',
  title_en: '',
  slug: '',
  description_si: '',
  description_en: '',
  hostName: 'Ravana Bhavana',
  scheduledAt: '',
  durationMinutes: 90,
  roomName: '',
  imageUrl: '',
  requireLogin: false,
  isPublished: true,
  isLive: false,
  isEnded: false,
  featured: false,
  resources: [],
  recordingMethod: 'obs',
  recordingUrl: '',
  recordingPublished: false,
  recordingNote_si: '',
  recordingNote_en: '',
};

export function slugify(value = '') {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'live-session';
}

export function randomCode() {
  return Math.random().toString(36).slice(2, 7);
}

export function generateRoomName(slug) {
  return `ravana-bhawana-${slugify(slug)}-${randomCode()}`;
}

export function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function dateInputValue(value) {
  const date = toDate(value);
  if (!date) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function normalizeLiveSession(data = {}, id = data.id) {
  const title = data.title_si || data.title || data.title_en || 'Live Session';
  const slug = data.slug || slugify(data.title_en || title);
  return {
    ...defaultLiveSession,
    ...data,
    id,
    title: data.title || title,
    title_si: data.title_si || data.title || '',
    title_en: data.title_en || data.title || '',
    slug,
    description_si: data.description_si || data.description || '',
    description_en: data.description_en || data.description || '',
    scheduledAt: data.scheduledAt || null,
    durationMinutes: Number(data.durationMinutes || 90),
    roomName: data.roomName || generateRoomName(slug),
    resources: Array.isArray(data.resources) ? data.resources : [],
    recordingMethod: data.recordingMethod || 'obs',
    requireLogin: Boolean(data.requireLogin),
    isPublished: data.isPublished ?? data.published ?? true,
    isLive: Boolean(data.isLive),
    isEnded: Boolean(data.isEnded),
    featured: Boolean(data.featured),
    recordingPublished: Boolean(data.recordingPublished),
  };
}

export function sortLiveSessions(items = []) {
  return [...items].sort((a, b) => {
    if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
    return (toDate(a.scheduledAt)?.getTime() || 0) - (toDate(b.scheduledAt)?.getTime() || 0);
  });
}

export function getCountdownParts(target) {
  const date = toDate(target);
  const diff = Math.max(0, (date?.getTime() || 0) - Date.now());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds, isPast: diff <= 0 };
}

export function googleCalendarUrl(session) {
  const start = toDate(session.scheduledAt) || new Date();
  const end = new Date(start.getTime() + Number(session.durationMinutes || 90) * 60000);
  const fmt = (date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const details = `${session.description_en || session.description_si || ''}\n\n${window.location.origin}/live/${session.slug}`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(session.title_en || session.title_si || session.title)}&details=${encodeURIComponent(details)}&dates=${fmt(start)}/${fmt(end)}`;
}
