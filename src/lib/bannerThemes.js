export const bannerTopics = ['Notice', 'New Video', 'Weekly Session', 'Donation', 'Emergency Update'];

export const bannerThemeDefaults = {
  Notice: {
    backgroundColor: '#e8f6f4',
    textColor: '#123b3a',
    accentColor: '#0f9f95',
    borderColor: '#7fd8cf',
  },
  'New Video': {
    backgroundColor: '#f7e9ff',
    textColor: '#2f123f',
    accentColor: '#c026d3',
    borderColor: '#f0abfc',
  },
  'Weekly Session': {
    backgroundColor: '#eef8df',
    textColor: '#263817',
    accentColor: '#c29a17',
    borderColor: '#d7b94f',
  },
  Donation: {
    backgroundColor: '#fff4df',
    textColor: '#3f270b',
    accentColor: '#d97706',
    borderColor: '#f4b860',
  },
  'Emergency Update': {
    backgroundColor: '#2a0909',
    textColor: '#fff7ed',
    accentColor: '#ef4444',
    borderColor: '#f97316',
  },
};

export function themeForTopic(topic) {
  return bannerThemeDefaults[topic] || bannerThemeDefaults.Notice;
}

export function normalizeBanner(data = {}, id = '') {
  const topic = data.topic || data.type || 'Notice';
  const theme = { ...themeForTopic(topic), ...(data.theme || {}) };
  return {
    id,
    title: data.title || '',
    message: data.message || '',
    topic,
    imageUrl: data.imageUrl || '',
    buttonText: data.buttonText || data.button_text || '',
    buttonUrl: data.buttonUrl || data.button_url || '',
    isActive: data.isActive ?? data.is_active ?? true,
    startAt: data.startAt || data.start_date || null,
    endAt: data.endAt || data.end_date || null,
    theme,
    priority: Number(data.priority ?? 0),
    createdAt: data.createdAt || data.created_at || null,
    updatedAt: data.updatedAt || data.updated_at || null,
    createdBy: data.createdBy || '',
  };
}
