import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import { LockKeyhole, Send } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { db } from '../../firebase.js';
import { useBlockStatus } from '../../context/BlockContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

const categories = ['Spiritual Guidance', 'Stress / Mental Peace', 'Family Problem', 'Education / Studies', 'Bad Habits', 'Personal Problem', 'Other'];
const categoryLabels = {
  si: {
    'Spiritual Guidance': 'ආධ්‍යාත්මික මඟපෙන්වීම',
    'Stress / Mental Peace': 'මානසික පීඩනය / සාමය',
    'Family Problem': 'පවුල් ගැටලුව',
    'Education / Studies': 'අධ්‍යාපනය / ඉගෙනීම්',
    'Bad Habits': 'අහිතකර පුරුදු',
    'Personal Problem': 'පුද්ගලික ගැටලුව',
    Other: 'වෙනත්',
  },
  en: Object.fromEntries(categories.map((category) => [category, category])),
};
const emptyForm = { category: categories[0], question: '', optionalName: '', optionalWhatsapp: '', wantsPrivateReply: false, allowAnonymousPublish: false };

export default function AnonymousGuidance({ compact = false }) {
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [answers, setAnswers] = useState([]);
  const { isBlockedContact, blocked } = useBlockStatus();
  const { currentLanguage, t } = useLanguage();

  useEffect(() => {
    getDocs(query(collection(db, 'anonymousGuidance'), where('isPublished', '==', true), where('allowAnonymousPublish', '==', true)))
      .then((snap) => setAnswers(snap.docs.map((item) => ({ id: item.id, ...item.data() }))))
      .catch((error) => console.error('[AnonymousGuidance] library load failed:', error));
  }, []);

  const library = useMemo(() => answers.filter((item) => item.answer).sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)), [answers]);

  const submit = async (event) => {
    event.preventDefault();
    if (!form.question.trim()) {
      setStatus({ type: 'error', message: 'Please write your question before submitting.' });
      return;
    }
    if (blocked || isBlockedContact(form.optionalWhatsapp) || isBlockedContact(form.optionalName)) {
      setStatus({ type: 'error', message: 'Your access has been restricted.' });
      return;
    }
    try {
      await addDoc(collection(db, 'anonymousGuidance'), {
        ...form,
        status: 'new',
        answer: '',
        isPublished: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        answeredBy: null,
      });
      setForm(emptyForm);
      setStatus({ type: 'success', message: 'Your question was submitted privately. Thank you for trusting Ravana Bhavana.' });
    } catch (error) {
      console.error('[AnonymousGuidance] submit failed:', error);
      setStatus({ type: 'error', message: 'Could not submit right now. Please try again.' });
    }
  };

  return (
    <section id="guidance" className={`section ${compact ? 'bg-[var(--theme-section)]' : 'bg-[var(--theme-surface)]'}`}>
      <div className="container-shell grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--theme-section)] px-3 py-1 text-sm font-black text-[var(--theme-primary)]"><LockKeyhole size={16} />{t('guidance.anonymous')}</span>
          <h2 className="mt-4 text-4xl font-black text-[var(--theme-primary)]">{t('guidance.need')}</h2>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--theme-muted)]">{t('guidance.subtitle')}</p>
          <div className="mt-8">
            <h3 className="text-2xl font-black text-[var(--theme-primary)]">{t('guidance.library')}</h3>
            <div className="mt-4 grid gap-3">
              {library.map((item) => (
                <article className="surface rounded-lg p-4" key={item.id}>
                  <span className="text-xs font-black uppercase text-[var(--theme-accent)]">{item.category}</span>
                  <p className="mt-2 font-bold text-[var(--theme-primary)]">{item.question}</p>
                  <p className="mt-3 whitespace-pre-wrap leading-7 text-[var(--theme-muted)]">{item.answer}</p>
                </article>
              ))}
              {!library.length && <p className="rounded-lg bg-[var(--theme-section)] p-4 font-semibold text-[var(--theme-muted)]">{t('guidance.empty')}</p>}
            </div>
          </div>
        </div>
        <form onSubmit={submit} className="surface rounded-lg p-6">
          <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.map((category) => <option key={category} value={category}>{categoryLabels[currentLanguage]?.[category] || category}</option>)}</select>
          <textarea className="input mt-3 min-h-56 text-base" placeholder={t('guidance.questionPlaceholder')} value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input className="input" placeholder={t('guidance.optionalName')} value={form.optionalName} onChange={(e) => setForm({ ...form, optionalName: e.target.value })} />
            <input className="input" placeholder={t('guidance.optionalWhatsapp')} value={form.optionalWhatsapp} onChange={(e) => setForm({ ...form, optionalWhatsapp: e.target.value })} />
          </div>
          <label className="mt-4 flex gap-2 font-semibold text-[var(--theme-muted)]"><input type="checkbox" checked={form.wantsPrivateReply} onChange={(e) => setForm({ ...form, wantsPrivateReply: e.target.checked })} />{t('guidance.privateReply')}</label>
          <label className="mt-2 flex gap-2 font-semibold text-[var(--theme-muted)]"><input type="checkbox" checked={form.allowAnonymousPublish} onChange={(e) => setForm({ ...form, allowAnonymousPublish: e.target.checked })} />{t('guidance.publishAllowed')}</label>
          {status.message && <p className={`mt-4 rounded-lg p-3 font-bold ${status.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'}`}>{status.message}</p>}
          <button className="btn btn-primary mt-5 w-full"><Send size={18} />{t('guidance.submit')}</button>
        </form>
      </div>
    </section>
  );
}
