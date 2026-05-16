import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export const DEFAULT_LANGUAGE = 'si';
export const languages = { si: 'සිංහල', en: 'English' };

const translations = {
  si: {
    nav: { home: 'මුල් පිටුව', about: 'අප ගැන', services: 'සේවාවන්', videos: 'වීඩියෝ', weeklySession: 'සතිපතා වැඩසටහන', support: 'සහාය', contact: 'සම්බන්ධ වන්න', dashboard: 'පුවරුව', admin: 'පරිපාලක', logout: 'ඉවත් වන්න', login: 'පිවිසෙන්න', guest: 'අමුත්තෙකු ලෙස බලන්න' },
    common: { search: 'සොයන්න', save: 'සුරකින්න', saved: 'සුරකින ලදී', watch: 'නරඹන්න', done: 'සම්පූර්ණයි', watched: 'නරඹන ලදී', completed: 'සම්පූර්ණයි', cancel: 'අවලංගු කරන්න', close: 'වසන්න', loading: 'පූරණය වෙමින් පවතී...', back: 'ආපසු', featured: 'විශේෂ', all: 'සියල්ල' },
    hero: { eyebrow: 'හෙළ උරුමය · ආධ්‍යාත්මික ප්‍රඥාව', title: 'රාවණ භවණ', subtitle: 'මඟපෙන්වීම, ඉගෙනීම සහ අභ්‍යන්තර ශක්තිය සඳහා නොමිලේ සමාජ සේවාවක්', description: 'පැහැදිලිබව සහ ශක්තිය සොයන ඔබ වෙනුවෙන් ප්‍රායෝගික ආධ්‍යාත්මික මඟපෙන්වීම, උපදේශන සහාය, සතිපතා සැසි සහ අධ්‍යාපනික වීඩියෝ සම්පත්.', contactWhatsapp: 'WhatsApp හරහා සම්බන්ධ වන්න', watchVideos: 'වීඩියෝ නරඹන්න', loginProgress: 'ප්‍රගතිය බැලීමට පිවිසෙන්න', voice: 'ඔබගේ ප්‍රශ්නය WhatsApp හඬ පණිවිඩයක් ලෙස යවන්න.' },
    about: { eyebrow: 'අප ගැන', heading: 'වෘත්තීය උපදේශන සහ ආධ්‍යාත්මික මඟපෙන්වීම', counselling: 'වෘත්තීය උපදේශන සහාය', free: 'නොමිලේ සමාජ සේවාව', description: 'රාවණ භවණ උපදේශන අත්දැකීම්, සමාජ සේවාව සහ හෙළ උරුම දැනුම එකට එක්කරමින් වගකීමෙන් සහ කරුණාවෙන් නොමිලේ මඟපෙන්වීම ලබා දෙයි.' },
    services: { title: 'සේවාවන්', heading: 'නොමිලේ මඟපෙන්වීම සහ සහාය', intro: 'රාවණ භවණ හරහා ලබාගත හැකි සහාය ක්ෂේත්‍ර මෙහි දැක්වේ.', counselling: 'උපදේශන සහාය', counsellingDescription: 'මානසික ශක්තිය, පැහැදිලිබව සහ ජීවිතයේ ප්‍රායෝගික අභියෝග සඳහා මඟපෙන්වීම.', awakening: 'ආධ්‍යාත්මික අවදිවීම', awakeningDescription: 'භාවනා, ස්වයං අවබෝධය සහ පුද්ගලික වර්ධනය සඳහා සහාය.', heritage: 'හෙළ උරුමය', heritageDescription: 'දේශීය උරුමය, වටිනාකම් සහ සංස්කෘතික දැනුම මත පදනම් වූ ප්‍රඥාව.', protective: 'ආරක්ෂණ මඟපෙන්වීම', universal: 'විශ්ව දැනුම', energy: 'ශක්ති අභ්‍යාස' },
    video: { youtubeLibrary: 'YouTube වීඩියෝ පුස්තකාලය', library: 'වීඩියෝ පුස්තකාලය', librarySubtitle: 'වීඩියෝ එකතු, ඉගෙනුම් මාර්ග, සුරැකි වීඩියෝ සහ ඔබට ගැළපෙන මඟපෙන්වීමක් සමඟ ඉගෙනීම ආරම්භ කරන්න.', playlist: 'වීඩියෝ එකතුව', playlists: 'වීඩියෝ එකතු', subPlaylist: 'උප වීඩියෝ එකතුව', featuredPlaylists: 'විශේෂ වීඩියෝ එකතු', allVideos: 'සියලු වීඩියෝ', noVideos: 'තවම වීඩියෝ නැත', noPlaylists: 'තවම වීඩියෝ එකතු නැත', noFound: 'වීඩියෝ හමු නොවීය. වෙනත් සෙවීමක් උත්සාහ කරන්න.', loginToSave: 'වීඩියෝ සහ වීඩියෝ එකතු සුරැකීමට කරුණාකර පිවිසෙන්න.', nextInPlaylist: 'එකතුවේ ඊළඟ වීඩියෝව', relatedVideos: 'සම්බන්ධ වීඩියෝ', notes: 'සටහන්', publicNotes: 'පොදු සටහන්', privateNotebook: 'පුද්ගලික සටහන්', notesSoon: 'සටහන් ඉක්මනින් දිස්වනු ඇත.', smartTitle: 'බලන්න සුදුසු දේ තෝරාගන්න බැරිද?', smartEyebrow: 'බුද්ධිමත් නැරඹුම් මාර්ගය', learningPath: 'නිර්දේශිත ඉගෙනුම් මාර්ගය', learningPathEyebrow: 'ඉගෙනුම් මාර්ග සිතියම', startWatching: 'නැරඹීම ආරම්භ කරන්න', continueWatching: 'නරඹමින් සිටි වීඩියෝ', savedVideos: 'සුරැකි වීඩියෝ', savedPlaylists: 'සුරැකි වීඩියෝ එකතු', saveVideo: 'වීඩියෝව සුරකින්න', savePlaylist: 'වීඩියෝ එකතුව සුරකින්න', details: 'වැඩි විස්තර', backToLibrary: 'වීඩියෝ පුස්තකාලයට', backToPlaylist: 'වීඩියෝ එකතුවට ආපසු', folders: 'ෆෝල්ඩර', videos: 'වීඩියෝ' },
    guidance: { need: 'මඟපෙන්වීමක් අවශ්‍යද?', anonymous: 'අනන්‍යතාව රහසිගතයි', subtitle: 'ආධ්‍යාත්මික මඟපෙන්වීම, උපදේශන සහාය, ජීවිත උපදෙස් හෝ පුද්ගලික ගැටලු සඳහා රහසිගතව ප්‍රශ්නයක් යොමු කරන්න. ඔබගේ අනන්‍යතාව කිසිවිටෙකත් පොදුවේ පෙන්වන්නේ නැත.', submit: 'රහසිගතව යවන්න', library: 'මඟපෙන්වීම් පුස්තකාලය', empty: 'මඟපෙන්වීම් පිළිතුරු ඉක්මනින් මෙහි පෙන්වනු ඇත.', questionPlaceholder: 'ඔබගේ ප්‍රශ්නය රහසිගතව ලියන්න...', optionalName: 'නම අවශ්‍ය නම්', optionalWhatsapp: 'WhatsApp අංකය අවශ්‍ය නම්', privateReply: 'මට පුද්ගලික පිළිතුරක් අවශ්‍යයි', publishAllowed: 'අනෙකුත් අයට ප්‍රයෝජනවත් නම් මෙය අනන්‍යතාව රහිතව පළ කළ හැක' },
    weekly: { next: 'ඊළඟ සතිපතා වැඩසටහන', empty: 'ඊළඟ සතිපතා වැඩසටහන ඉක්මනින් දැනුම් දෙනු ඇත.', addCalendar: 'කැලැන්ඩරයට එක් කරන්න', join: 'වැඩසටහනට එක්වන්න', joinZoom: 'Zoom හරහා එක්වන්න', reminder: 'සිහිගැන්වීම', days: 'දින', hours: 'පැය', minutes: 'මිනිත්තු', seconds: 'තත්පර', live: 'වැඩසටහන දැන් සජීවීව පවතී' },
    support: { title: 'සහාය', donation: 'පරිත්‍යාග සහාය', organizationName: 'සංවිධානයේ නම', accountHolderName: 'ගිණුම් හිමියාගේ නම', bankName: 'බැංකුවේ නම', branch: 'ශාඛාව', accountNumber: 'ගිණුම් අංකය', name: 'නම', area: 'ප්‍රදේශය', amount: 'මුදල', phone: 'දුරකථන අංකය', extraNote: 'අමතර සටහන', sendWhatsapp: 'WhatsApp පණිවිඩය යවන්න' },
    contact: { title: 'සම්බන්ධ වන්න', whatsappDirect: 'WhatsApp සෘජු පණිවිඩය', whatsappGroup: 'WhatsApp සමූහය', youtube: 'YouTube නාලිකාව', facebook: 'Facebook පිටුව' },
    footer: { tagline: 'නොමිලේ සමාජ සේවා වේදිකාව', rights: 'සියලු හිමිකම් ඇවිරිණි' },
    dashboard: { title: 'පරිශීලක පුවරුව', overview: 'ප්‍රගති සාරාංශය', continueWatching: 'නරඹමින් සිටි වීඩියෝ', completedVideos: 'සම්පූර්ණ කළ වීඩියෝ', savedVideos: 'සුරැකි වීඩියෝ', personalNotes: 'පුද්ගලික සටහන්', joinedSessions: 'එක්වූ Zoom සැසි', donationHistory: 'පරිත්‍යාග ඉතිහාසය', badges: 'ලාංඡන', accountSettings: 'ගිණුම් සැකසුම්', watched: 'නරඹන ලදී', completed: 'සම්පූර්ණයි', firstStep: 'පළමු පියවර', consistentViewer: 'නිරන්තර නරඹන්නා', wisdomLearner: 'ප්‍රඥා ඉගෙනුම්කරු', sessionParticipant: 'සැසි සහභාගීවූවෙක්', supporter: 'සහාය දක්වන්නා' },
  },
  en: {
    nav: { home: 'Home', about: 'About', services: 'Services', videos: 'Videos', weeklySession: 'Weekly Session', support: 'Support', contact: 'Contact', dashboard: 'Dashboard', admin: 'Admin', logout: 'Logout', login: 'Login', guest: 'Continue as Guest' },
    common: { search: 'Search', save: 'Save', saved: 'Saved', watch: 'Watch', done: 'Done', watched: 'Watched', completed: 'Completed', cancel: 'Cancel', close: 'Close', loading: 'Loading...', back: 'Back', featured: 'Featured', all: 'All' },
    hero: { eyebrow: 'Hela Heritage · Spiritual Wisdom', title: 'Ravana Bhavana', subtitle: 'A free social service for guidance, learning, and inner strength', description: 'Practical spiritual guidance, counselling support, weekly sessions, and educational video resources for anyone seeking clarity and strength.', contactWhatsapp: 'Contact on WhatsApp', watchVideos: 'Watch Videos', loginProgress: 'Login to Track Progress', voice: 'Send your question as a WhatsApp voice message.' },
    about: { eyebrow: 'About', heading: 'Professional counselling and spiritual guidance', counselling: 'Professional counselling support', free: 'Free community service', description: 'Ravana Bhavana brings together counselling experience, community service, and Hela heritage knowledge to offer free guidance with care and responsibility.' },
    services: { title: 'Services', heading: 'Free Guidance and Support', intro: 'Explore the support areas available through Ravana Bhavana. These can be managed from the homepage CMS.', counselling: 'Counselling Support', counsellingDescription: 'Guidance for mental strength, clarity, and practical life challenges.', awakening: 'Spiritual Awakening', awakeningDescription: 'Support for meditation, self-awareness, and personal growth.', heritage: 'Hela Heritage', heritageDescription: 'Wisdom rooted in local heritage, values, and cultural knowledge.', protective: 'Protective Guidance', universal: 'Universal Knowledge', energy: 'Energy Practices' },
    video: { youtubeLibrary: 'YouTube Library', library: 'Video Library', librarySubtitle: 'Browse playlists, learning paths, saved videos, and guided recommendations for your next step.', playlist: 'Playlist', playlists: 'Playlists', subPlaylist: 'Sub Playlist', featuredPlaylists: 'Featured Playlists', allVideos: 'All Videos', noVideos: 'No videos yet', noPlaylists: 'No playlists yet', noFound: 'No videos found. Try another search.', loginToSave: 'Please log in to save videos and playlists.', nextInPlaylist: 'Next in playlist', relatedVideos: 'Related videos', notes: 'Notes', publicNotes: 'Public notes', privateNotebook: 'Private notebook', notesSoon: 'Notes coming soon.', smartTitle: 'Not sure what to watch?', smartEyebrow: 'Smart Watch Path', learningPath: 'Recommended Learning Path', learningPathEyebrow: 'Learning Path Map', startWatching: 'Start watching', continueWatching: 'Continue watching', savedVideos: 'Saved videos', savedPlaylists: 'Saved playlists', saveVideo: 'Save video', savePlaylist: 'Save playlist', details: 'More details', backToLibrary: 'Back to Video Library', backToPlaylist: 'Back to Playlist', folders: 'folders', videos: 'videos' },
    guidance: { need: 'Need Guidance?', anonymous: 'Anonymous & private', subtitle: 'Ask anonymously for spiritual guidance, counselling support, life advice, or personal help. Your identity is never shown publicly.', submit: 'Submit privately', library: 'Guidance Library', empty: 'Guidance answers will appear here soon.', questionPlaceholder: 'Write your question privately...', optionalName: 'Optional name', optionalWhatsapp: 'Optional WhatsApp number', privateReply: 'I want a private reply', publishAllowed: 'You may publish this anonymously if useful to others' },
    weekly: { next: 'Next Weekly Session', empty: 'Next weekly session will be announced soon.', addCalendar: 'Add to Calendar', join: 'Join Session', joinZoom: 'Join Zoom', reminder: 'Reminder', days: 'Days', hours: 'Hours', minutes: 'Minutes', seconds: 'Seconds', live: 'Session is live now' },
    support: { title: 'Support', donation: 'Donation Support', organizationName: 'Organization name', accountHolderName: 'Account holder name', bankName: 'Bank name', branch: 'Branch', accountNumber: 'Account number', name: 'Name', area: 'Area', amount: 'Amount', phone: 'Phone', extraNote: 'Extra note', sendWhatsapp: 'Send WhatsApp Message' },
    contact: { title: 'Contact', whatsappDirect: 'WhatsApp direct message', whatsappGroup: 'WhatsApp group', youtube: 'YouTube channel', facebook: 'Facebook page' },
    footer: { tagline: 'Free social service platform', rights: 'All rights reserved' },
    dashboard: { title: 'User dashboard', overview: 'Progress overview', continueWatching: 'Continue watching', completedVideos: 'Completed videos', savedVideos: 'Saved videos', personalNotes: 'Personal notes', joinedSessions: 'Joined Zoom sessions', donationHistory: 'Donation history', badges: 'Badges', accountSettings: 'Account settings', watched: 'Watched', completed: 'Completed', firstStep: 'First Step', consistentViewer: 'Consistent Viewer', wisdomLearner: 'Wisdom Learner', sessionParticipant: 'Session Participant', supporter: 'Supporter' },
  },
};

const LanguageContext = createContext(null);

const legacySinhala = {
  'Hela Heritage · Spiritual Wisdom': 'හෙළ උරුමය · ආධ්‍යාත්මික ප්‍රඥාව',
  'Hela Heritage Â· Spiritual Wisdom': 'හෙළ උරුමය · ආධ්‍යාත්මික ප්‍රඥාව',
  'Ravana Bhavana': 'රාවණ භවණ',
  'A free social service for guidance, learning, and inner strength': 'මඟපෙන්වීම, ඉගෙනීම සහ අභ්‍යන්තර ශක්තිය සඳහා නොමිලේ සමාජ සේවාවක්',
  'Practical spiritual guidance, counselling support, weekly sessions, and educational video resources for anyone seeking clarity and strength.': 'පැහැදිලිබව සහ ශක්තිය සොයන ඔබ වෙනුවෙන් ප්‍රායෝගික ආධ්‍යාත්මික මඟපෙන්වීම, උපදේශන සහාය, සතිපතා සැසි සහ අධ්‍යාපනික වීඩියෝ සම්පත්.',
  'Contact on WhatsApp': 'WhatsApp හරහා සම්බන්ධ වන්න',
  'Watch Videos': 'වීඩියෝ නරඹන්න',
  About: 'අප ගැන',
  Services: 'සේවාවන්',
  Support: 'සහාය',
  Contact: 'සම්බන්ධ වන්න',
  'Professional counselling and spiritual guidance': 'වෘත්තීය උපදේශන සහ ආධ්‍යාත්මික මඟපෙන්වීම',
  'Professional counselling support': 'වෘත්තීය උපදේශන සහාය',
  'Free community service': 'නොමිලේ සමාජ සේවාව',
  'Ravana Bhavana brings together counselling experience, community service, and Hela heritage knowledge to offer free guidance with care and responsibility.': 'රාවණ භවණ උපදේශන අත්දැකීම්, සමාජ සේවාව සහ හෙළ උරුම දැනුම එකට එක්කරමින් වගකීමෙන් සහ කරුණාවෙන් නොමිලේ මඟපෙන්වීම ලබා දෙයි.',
  'Free social service platform': 'නොමිලේ සමාජ සේවා වේදිකාව',
  'Counselling Support': 'උපදේශන සහාය',
  'Spiritual Awakening': 'ආධ්‍යාත්මික අවදිවීම',
  'Hela Heritage': 'හෙළ උරුමය',
  'Protective Guidance': 'ආරක්ෂණ මඟපෙන්වීම',
  'Universal Knowledge': 'විශ්ව දැනුම',
  'Energy Practices': 'ශක්ති අභ්‍යාස',
  'Guidance for mental strength, clarity, and practical life challenges.': 'මානසික ශක්තිය, පැහැදිලිබව සහ ජීවිතයේ ප්‍රායෝගික අභියෝග සඳහා මඟපෙන්වීම.',
  'Support for meditation, self-awareness, and personal growth.': 'භාවනා, ස්වයං අවබෝධය සහ පුද්ගලික වර්ධනය සඳහා සහාය.',
  'Wisdom rooted in local heritage, values, and cultural knowledge.': 'දේශීය උරුමය, වටිනාකම් සහ සංස්කෘතික දැනුම මත පදනම් වූ ප්‍රඥාව.',
};

export function getNestedTranslation(language, key) {
  return key.split('.').reduce((value, part) => value?.[part], translations[language]) || key;
}

export function getLocalized(data = {}, field, language = DEFAULT_LANGUAGE, fallback = '') {
  const primary = language === 'en' ? `${field}_en` : `${field}_si`;
  const secondary = language === 'en' ? `${field}_si` : `${field}_en`;
  const value = data?.[primary] || data?.[field] || data?.[secondary] || fallback;
  return language === 'si' ? (legacySinhala[value] || value) : value;
}

export function localizedArray(data = {}, field, language = DEFAULT_LANGUAGE) {
  const value = getLocalized(data, field, language, []);
  if (Array.isArray(value)) return value;
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
}

export function LanguageProvider({ children }) {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    const saved = localStorage.getItem('ravana-language');
    if (saved === 'si' || saved === 'en') return saved;
    localStorage.setItem('ravana-language', DEFAULT_LANGUAGE);
    return DEFAULT_LANGUAGE;
  });

  const setLanguage = (language) => {
    const next = languages[language] ? language : DEFAULT_LANGUAGE;
    localStorage.setItem('ravana-language', next);
    setCurrentLanguage(next);
  };

  useEffect(() => {
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  const value = useMemo(() => ({
    currentLanguage,
    setLanguage,
    t: (key) => getNestedTranslation(currentLanguage, key),
    getLocalized: (data, field, fallback = '') => getLocalized(data, field, currentLanguage, fallback),
  }), [currentLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
