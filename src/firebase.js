import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyD6hoHBMtG3Ep8j_OQl2WmhZiL1tR9uH_U',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'focusforge-8f346.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'focusforge-8f346',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '643546212329',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:643546212329:web:ec30fb61bf89fecfedcd78',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-T9QPBR1E98',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analyticsPromise = isSupported().then((supported) => (supported ? getAnalytics(app) : null));
