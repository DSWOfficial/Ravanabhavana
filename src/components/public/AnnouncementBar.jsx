import { doc, onSnapshot } from 'firebase/firestore';
import { AlertTriangle, Bell, Star, Video, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { db } from '../../firebase.js';
import { normalizeAnnouncement } from '../../lib/siteSettings.js';

const icons = {
  bell: Bell,
  video: Video,
  alert: AlertTriangle,
  star: Star,
  whatsapp: Bell,
  none: null,
};

export default function AnnouncementBar() {
  const [settings, setSettings] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const location = useLocation();
  const { currentLanguage } = useLanguage();

  useEffect(() => onSnapshot(doc(db, 'siteSettings', 'announcementBar'), (snap) => {
    setSettings(normalizeAnnouncement(snap.exists() ? snap.data() : {}));
  }, (error) => {
    console.error('Failed to load announcement bar', error);
    setSettings(normalizeAnnouncement({}));
  }), []);

  const config = useMemo(() => normalizeAnnouncement(settings || {}), [settings]);
  const storageKey = `rb-announcement-dismissed-${config.updatedAt?.seconds || config.message || 'default'}`;

  useEffect(() => {
    setDismissed(config.rememberDismissal && localStorage.getItem(storageKey) === 'true');
  }, [config.rememberDismissal, storageKey]);

  if (!shouldShowAnnouncement(config, location.pathname) || dismissed) return null;

  const Icon = icons[config.icon] || null;
  const message = currentLanguage === 'en'
    ? (config.messageEnglish || config.message || config.messageSinhala)
    : (config.messageSinhala || config.message || config.messageEnglish);
  const className = `announcement-bar announcement-${config.position} announcement-${config.animation}`;

  const close = () => {
    if (config.rememberDismissal) localStorage.setItem(storageKey, 'true');
    setDismissed(true);
  };

  return (
    <div className={className} style={{ '--announcement-bg': config.colors.background, '--announcement-text': config.colors.text, '--announcement-button-bg': config.colors.buttonBackground, '--announcement-button-text': config.colors.buttonText }}>
      <div className="announcement-inner">
        {Icon && <Icon size={18} />}
        <p className={config.animation === 'marquee' ? 'announcement-marquee' : ''}>{message}</p>
        {config.buttonText && config.buttonLink && <a className="announcement-button" href={config.buttonLink} target={config.openInNewTab ? '_blank' : undefined} rel={config.openInNewTab ? 'noreferrer' : undefined}>{config.buttonText}</a>}
        {config.dismissible && <button className="announcement-close" type="button" onClick={close} aria-label="Close announcement"><X size={16} /></button>}
      </div>
    </div>
  );
}

export function shouldShowAnnouncement(config, pathname = '/') {
  if (!config.enabled) return false;
  const now = Date.now();
  const start = parseDate(config.startAt);
  const end = parseDate(config.endAt);
  if (start && now < start) return false;
  if (end && now > end) return false;
  if (config.visibility === 'homepage' && pathname !== '/') return false;
  if (config.visibility === 'videos' && !pathname.startsWith('/videos')) return false;
  if (config.visibility === 'custom' && Array.isArray(config.selectedPages) && config.selectedPages.length) {
    return config.selectedPages.some((page) => pathname.startsWith(page));
  }
  return true;
}

function parseDate(value) {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.toDate === 'function') return value.toDate().getTime();
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}
