export const playlistTopics = [
  'Spiritual Guidance',
  'Psychology',
  'Meditation',
  'Life Advice',
  'Weekly Session',
  'Emergency / Important',
];

export const cardStyles = ['classic', 'glow', 'glass', 'minimal', 'cinematic'];
export const playlistEffects = ['none', 'softGlow', 'goldBorder', 'pulse', 'spotlight'];
export const videoLevels = ['Beginner', 'Intermediate', 'Advanced'];

export const defaultPlaylistTheme = {
  backgroundColor: '#102927',
  textColor: '#fff9ed',
  accentColor: '#d9a441',
  borderColor: '#d9a441',
  gradientFrom: '#102927',
  gradientTo: '#1f453f',
  cardStyle: 'classic',
  effect: 'softGlow',
};

export const topicThemes = {
  'Spiritual Guidance': {
    backgroundColor: '#102927',
    textColor: '#fff9ed',
    accentColor: '#d9a441',
    borderColor: '#d9a441',
    gradientFrom: '#102927',
    gradientTo: '#1f453f',
    cardStyle: 'classic',
    effect: 'softGlow',
  },
  Psychology: {
    backgroundColor: '#10233f',
    textColor: '#fff8ea',
    accentColor: '#63d7e8',
    borderColor: '#4aaabd',
    gradientFrom: '#10233f',
    gradientTo: '#17465b',
    cardStyle: 'glass',
    effect: 'spotlight',
  },
  Meditation: {
    backgroundColor: '#2c194f',
    textColor: '#f7ecff',
    accentColor: '#e2c46d',
    borderColor: '#b99bf5',
    gradientFrom: '#2c194f',
    gradientTo: '#5a3d86',
    cardStyle: 'glow',
    effect: 'softGlow',
  },
  'Life Advice': {
    backgroundColor: '#4b2d1e',
    textColor: '#fff5e1',
    accentColor: '#e18a3b',
    borderColor: '#d6ad61',
    gradientFrom: '#4b2d1e',
    gradientTo: '#82512d',
    cardStyle: 'classic',
    effect: 'goldBorder',
  },
  'Weekly Session': {
    backgroundColor: '#17382f',
    textColor: '#fff9ed',
    accentColor: '#e2b84d',
    borderColor: '#8fbf78',
    gradientFrom: '#17382f',
    gradientTo: '#315f3c',
    cardStyle: 'cinematic',
    effect: 'softGlow',
  },
  'Emergency / Important': {
    backgroundColor: '#3b0d10',
    textColor: '#fff1e8',
    accentColor: '#ff4949',
    borderColor: '#ff7979',
    gradientFrom: '#3b0d10',
    gradientTo: '#7a161b',
    cardStyle: 'cinematic',
    effect: 'pulse',
  },
};

export const uncategorizedPlaylist = {
  id: 'uncategorized',
  title: 'Uncategorized',
  slug: 'uncategorized',
  description: 'Videos that are not assigned to a playlist yet.',
  coverImageUrl: '/ravana-bhawana-logo.png',
  topic: 'Spiritual Guidance',
  isPublished: true,
  order: 9999,
  theme: defaultPlaylistTheme,
};

export function slugify(value = '') {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'untitled';
}

export function tagsFromText(value = '') {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value).split(',').map((item) => item.trim()).filter(Boolean);
}

export function normalizePlaylist(data = {}, id = data.id) {
  const theme = { ...defaultPlaylistTheme, ...(data.theme || {}) };
  return {
    ...data,
    id,
    title: data.title || 'Untitled playlist',
    slug: data.slug || slugify(data.title || id || 'playlist'),
    description: data.description || '',
    coverImageUrl: data.coverImageUrl || data.imageUrl || '/ravana-bhawana-logo.png',
    topic: data.topic || 'Spiritual Guidance',
    isPublished: data.isPublished ?? data.published ?? true,
    order: Number(data.order ?? data.display_order ?? 999),
    theme,
  };
}

export function normalizeVideo(data = {}, id = data.id) {
  const youtubeId = data.youtubeId || data.videoId || data.video_id || '';
  const videoUrl = data.videoUrl || data.youtubeUrl || data.youtube_url || (youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : '');
  return {
    ...data,
    id,
    title: data.title || 'Untitled video',
    slug: data.slug || slugify(data.title || id || 'video'),
    description: data.description || '',
    videoUrl,
    youtubeId,
    thumbnailUrl: data.thumbnailUrl || data.thumbnail_url || (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : '/ravana-bhawana-logo.png'),
    playlistId: data.playlistId || '',
    playlistSlug: data.playlistSlug || '',
    duration: data.duration || '',
    tags: tagsFromText(data.tags),
    level: data.level || 'Beginner',
    isPublished: data.isPublished ?? data.published ?? data.isActive ?? data.is_active ?? true,
    featured: Boolean(data.featured || data.isLatest || data.is_latest),
    order: Number(data.order ?? data.display_order ?? 999),
    createdAt: data.createdAt || data.created_at || null,
  };
}

export function sortByOrderThenNewest(items = []) {
  return [...items].sort((a, b) => (a.order - b.order) || ((toMillis(b.createdAt) || 0) - (toMillis(a.createdAt) || 0)));
}

export function toMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.toDate === 'function') return value.toDate().getTime();
  if (value instanceof Date) return value.getTime();
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

export function searchMatchesVideo(video, playlist, term) {
  const needle = term.trim().toLowerCase();
  if (!needle) return true;
  return [
    video.title,
    video.description,
    video.level,
    ...(video.tags || []),
    playlist?.title,
    playlist?.topic,
  ].filter(Boolean).join(' ').toLowerCase().includes(needle);
}

export function getPlaylistStyle(playlist) {
  const theme = normalizePlaylist(playlist).theme;
  return {
    background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
    color: theme.textColor,
    borderColor: theme.borderColor,
    boxShadow: theme.effect === 'softGlow' || theme.effect === 'spotlight'
      ? `0 24px 70px color-mix(in srgb, ${theme.accentColor} 26%, transparent)`
      : undefined,
  };
}

export const watchPathOptions = [
  { key: 'peace', label: 'I need peace', terms: ['meditation', 'peace', 'stress', 'calm', 'Psychology'] },
  { key: 'stress', label: 'I feel stressed', terms: ['stress', 'psychology', 'mental', 'peace'] },
  { key: 'motivation', label: 'I need motivation', terms: ['motivation', 'life advice', 'Life Advice'] },
  { key: 'spiritual', label: 'I want spiritual knowledge', terms: ['spiritual', 'Spiritual Guidance', 'knowledge'] },
  { key: 'weekly', label: 'I want to join weekly learning', terms: ['weekly', 'Weekly Session', 'session'] },
  { key: 'new', label: 'I am new here', terms: ['beginner', 'featured'] },
];

export function getSmartRecommendations(goalKey, playlists, videos) {
  const option = watchPathOptions.find((item) => item.key === goalKey) || watchPathOptions[0];
  const terms = option.terms.map((item) => item.toLowerCase());
  const scoreVideo = (video) => {
    const haystack = [video.title, video.description, video.level, ...(video.tags || [])].join(' ').toLowerCase();
    let score = terms.reduce((total, term) => total + (haystack.includes(term.toLowerCase()) ? 3 : 0), 0);
    if (goalKey === 'new' && video.level === 'Beginner') score += 5;
    if (video.featured) score += 2;
    return score;
  };
  const scorePlaylist = (playlist) => {
    const haystack = [playlist.title, playlist.description, playlist.topic].join(' ').toLowerCase();
    return terms.reduce((total, term) => total + (haystack.includes(term.toLowerCase()) ? 4 : 0), 0);
  };
  const recommendedVideos = [...videos].map((video) => [scoreVideo(video), video]).filter(([score]) => score > 0).sort((a, b) => b[0] - a[0]).map(([, video]) => video).slice(0, 3);
  const recommendedPlaylist = [...playlists].map((playlist) => [scorePlaylist(playlist), playlist]).sort((a, b) => b[0] - a[0]).map(([, playlist]) => playlist)[0] || playlists[0] || uncategorizedPlaylist;
  return { option, recommendedPlaylist, recommendedVideos };
}
