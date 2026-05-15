export function formatPhoneForWhatsApp(number = '') {
  return number.replace(/[^\d]/g, '').replace(/^0/, '94');
}

export function createDonationWhatsAppMessage(formData) {
  return [
    'රාවණ භවණ පරිත්‍යාග තොරතුරු',
    `නම: ${formData.name || '-'}`,
    `රට: ${formData.country || '-'}`,
    `ප්‍රදේශය: ${formData.area || '-'}`,
    `මුදල: ${formData.amount || '-'}`,
    `දුරකථන: ${formData.phone || '-'}`,
    `අරමුණ: ${formData.purpose || '-'}`,
    `සටහන: ${formData.note || '-'}`,
  ].join('\n');
}

export function createContactWhatsAppMessage(message) {
  return `රාවණ භවණ වෙත පණිවිඩයක්:\n${message || 'මට උපදෙස් අවශ්‍යයි.'}`;
}

export function openWhatsApp(number, message) {
  const phone = formatPhoneForWhatsApp(number);
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
}

export function createAdminWhatsAppMessage(data = {}) {
  return [
    'රාවණ භවණ පරිත්‍යාග සම්බන්ධයෙන්',
    `ආයුබෝවන් ${data.name || ''},`,
    `ඔබගේ ${data.purpose || 'පරිත්‍යාග'} පණිවිඩය ලැබුණි.`,
  ].join('\n');
}
