export function getUserBadges(progress = [], sessions = [], donations = []) {
  const completed = progress.filter((item) => item.completed).length;
  return [
    { name: 'First Step', label: 'පළමු පියවර', unlocked: completed >= 1 },
    { name: 'Consistent Viewer', label: 'නිරන්තර නරඹන්නා', unlocked: completed >= 5 },
    { name: 'Wisdom Learner', label: 'ප්‍රඥා ඉගෙනුම්කරු', unlocked: completed >= 10 },
    { name: 'Session Participant', label: 'සැසි සහභාගීවූවෙක්', unlocked: sessions.length >= 1 },
    { name: 'Supporter', label: 'සේවාවට සහාය වූවෙක්', unlocked: donations.length >= 1 },
  ];
}
