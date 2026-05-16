import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase.js';

const AuthContext = createContext(null);
export const ADMIN_EMAIL = 'udarasampath@gmail.com';

async function checkAdmin(email) {
  return email?.toLowerCase() === ADMIN_EMAIL;
}

async function syncUserProfile(firebaseUser) {
  try {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef).catch(() => null);
    await setDoc(userRef, {
      uid: firebaseUser.uid,
      displayName: firebaseUser.displayName || userSnap?.data()?.displayName || '',
      email: firebaseUser.email,
      photoURL: firebaseUser.photoURL || '',
      role: 'user',
      createdAt: userSnap?.exists?.() ? userSnap.data().createdAt : serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.warn('User profile sync skipped:', error.code || error.message);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, async (firebaseUser) => {
    setLoading(true);
    try {
      if (!firebaseUser) {
        setUser(null);
        setIsAdmin(false);
        return;
      }

      const admin = await checkAdmin(firebaseUser.email);
      await syncUserProfile(firebaseUser);
      setUser(firebaseUser);
      setIsAdmin(admin);
    } catch (error) {
      console.error('Auth state failed:', error);
      setUser(firebaseUser || null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }), []);

  const value = useMemo(() => ({
    user,
    isAdmin,
    loading,
    logout: () => signOut(auth),
  }), [user, isAdmin, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
