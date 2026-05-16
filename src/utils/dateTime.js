export function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  return new Date(value);
}

export function isSessionExpired(expiresAt) {
  const date = toDate(expiresAt);
  return Boolean(date && Date.now() > date.getTime());
}

export function calculateSessionExpiry(sessionDate, endTime) {
  const end = new Date(`${sessionDate}T${endTime || '23:59'}:00+05:30`);
  return new Date(end.getTime() + 24 * 60 * 60 * 1000);
}

export function getNextWeeklySession(schedule = {}) {
  const dayMap = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
  const targetDay = dayMap[schedule.day || 'Saturday'] ?? 6;
  const [hours = 20, minutes = 0] = (schedule.startTime || '20:00').split(':').map(Number);
  const next = new Date();
  next.setHours(hours, minutes, 0, 0);
  const diff = (targetDay + 7 - next.getDay()) % 7;
  next.setDate(next.getDate() + diff);
  if (next < new Date()) next.setDate(next.getDate() + 7);
  return next;
}

export function formatSinhalaDate(value) {
  const date = toDate(value);
  if (!date) return 'දිනය තවම යාවත්කාලීන කර නැත';
  return new Intl.DateTimeFormat('si-LK', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Colombo',
  }).format(date);
}

export function formatTime(time) {
  if (!time) return '-';
  const [hour, minute] = String(time).split(':').map(Number);
  const date = new Date();
  date.setHours(hour || 0, minute || 0, 0, 0);
  return new Intl.DateTimeFormat('si-LK', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Colombo',
  }).format(date);
}

export function getCountdown(value) {
  const parts = getCountdownParts(value);
  return `${parts.days} දින ${parts.hours} පැය ${parts.minutes} මිනිත්තු ${parts.seconds} තත්පර`;
}

export function getCountdownParts(value) {
  const date = toDate(value);
  if (!date) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false };
  const diff = Math.max(0, date.getTime() - Date.now());
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    isPast: diff === 0,
  };
}
