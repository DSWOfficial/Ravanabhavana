export const defaultLiveSettings = {
  isLiveEnabled: false,
  youtubeVideoId: '',
  youtubeChannelUrl: '',
  youtubePlaylistId: '',
  sessionTitle: '',
  sessionDescription: '',
  sessionDateTime: '',
  showLiveChat: true,
  showSupportButton: false,
  supportButtonUrl: '',
  supportButtonText: 'Support',
  offlineMessage: 'ඊළඟ සජීවී වැඩසටහන ඉක්මනින් දැනුම් දෙනු ඇත.',
};

export const emptyLiveSession = {
  title: '',
  description: '',
  youtubeUrl: '',
  embedUrl: '',
  thumbnailUrl: '',
  status: 'draft',
  isVisible: false,
  startsAt: '',
  endsAt: '',
};

export function normalizeLiveSettings(data = {}) {
  return {
    ...defaultLiveSettings,
    ...data,
    isLiveEnabled: Boolean(data.isLiveEnabled),
    showLiveChat: data.showLiveChat ?? true,
    showSupportButton: Boolean(data.showSupportButton),
  };
}

export function sanitizeYouTubeVideoId(value = '') {
  const direct = String(value).trim();
  const extracted = direct.match(/[?&]v=([A-Za-z0-9_-]{6,20})/)?.[1]
    || direct.match(/youtu\.be\/([A-Za-z0-9_-]{6,20})/)?.[1]
    || direct.match(/\/live\/([A-Za-z0-9_-]{6,20})/)?.[1]
    || direct.match(/\/embed\/([A-Za-z0-9_-]{6,20})/)?.[1]
    || direct;
  return /^[A-Za-z0-9_-]{6,20}$/.test(extracted) ? extracted : '';
}

export function youtubeUrlToEmbedUrl(value = '') {
  const id = sanitizeYouTubeVideoId(value);
  return id ? `https://www.youtube.com/embed/${id}?autoplay=0&rel=0&modestbranding=1` : '';
}

export function normalizeLiveSession(data = {}, id = data.id) {
  const youtubeUrl = data.youtubeUrl || data.youtubeVideoId || data.recordingUrl || '';
  const videoId = sanitizeYouTubeVideoId(youtubeUrl);
  const status = data.status || (data.isLive ? 'live' : data.isEnded ? 'ended' : data.isPublished ? 'scheduled' : 'draft');
  return {
    ...emptyLiveSession,
    ...data,
    id,
    title: data.title || data.title_si || data.title_en || data.sessionTitle || 'Live Session',
    description: data.description || data.description_si || data.description_en || data.sessionDescription || '',
    youtubeUrl,
    youtubeVideoId: videoId,
    embedUrl: data.embedUrl || youtubeUrlToEmbedUrl(youtubeUrl),
    thumbnailUrl: data.thumbnailUrl || data.imageUrl || '',
    status,
    isVisible: data.isVisible ?? (status === 'live' ? true : Boolean(data.isPublished && data.isLive)),
    startsAt: data.startsAt || data.scheduledAt || data.sessionDateTime || null,
    endsAt: data.endsAt || null,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
}

export function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  if (value instanceof Date) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function dateInputValue(value) {
  const date = toDate(value);
  if (!date) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function getLiveStatus(settings) {
  if (settings.status) {
    if (settings.status === 'live' && settings.isVisible !== false && sanitizeYouTubeVideoId(settings.youtubeUrl || settings.youtubeVideoId)) return 'live';
    if (settings.status === 'scheduled') return 'upcoming';
    if (settings.status === 'ended' && sanitizeYouTubeVideoId(settings.youtubeUrl || settings.youtubeVideoId)) return 'replay';
    return 'offline';
  }
  const videoId = sanitizeYouTubeVideoId(settings.youtubeVideoId);
  const date = toDate(settings.sessionDateTime);
  if (settings.isLiveEnabled && videoId) return 'live';
  if (videoId) return 'replay';
  if (date && date.getTime() > Date.now()) return 'upcoming';
  return 'offline';
}

export function getCountdownParts(target) {
  const date = toDate(target);
  const diff = Math.max(0, (date?.getTime() || 0) - Date.now());
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}
