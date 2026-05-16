import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect } from 'react';
import { db } from '../../firebase.js';

const cssVars = {
  theme_page_background: '--theme-page',
  theme_section_background: '--theme-section',
  theme_surface_background: '--theme-surface',
  theme_text_color: '--theme-text',
  theme_muted_color: '--theme-muted',
  theme_primary_color: '--theme-primary',
  theme_primary_hover_color: '--theme-primary-hover',
  theme_accent_color: '--theme-accent',
  theme_secondary_accent_color: '--theme-accent-2',
  theme_hero_background: '--theme-hero',
  theme_hero_text_color: '--theme-hero-text',
};

function applyTheme(settings = {}) {
  Object.entries(cssVars).forEach(([field, variable]) => {
    const value = settings[field];
    if (typeof value === 'string' && value.trim()) {
      document.documentElement.style.setProperty(variable, value.trim());
    }
  });
}

export default function SiteTheme() {
  useEffect(() => {
    return onSnapshot(doc(db, 'siteSettings', 'main'), (snap) => {
      if (snap.exists()) applyTheme(snap.data());
    }, (error) => {
      console.error('Failed to load site theme from siteSettings/main', error);
    });
  }, []);

  return null;
}
