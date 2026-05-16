import { collection, getDocs, query, where } from 'firebase/firestore';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { signOut } from 'firebase/auth';
import { useAuth } from './AuthContext.jsx';
import { auth, db } from '../firebase.js';
import { getDeviceId } from '../lib/deviceId.js';

const BlockContext = createContext(null);

function matchesEmail(block, email) {
  return block.email && email && block.email.toLowerCase() === email.toLowerCase();
}

function BlockedScreen() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--theme-section)] p-4">
      <section className="surface max-w-lg rounded-lg p-8 text-center">
        <h1 className="text-3xl font-black text-[var(--theme-primary)]">Access Restricted</h1>
        <p className="mt-4 text-lg font-semibold text-[var(--theme-muted)]">Your access has been restricted.</p>
      </section>
    </main>
  );
}

export function BlockProvider({ children }) {
  const { user, loading } = useAuth();
  const [deviceId, setDeviceId] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const id = getDeviceId();
    setDeviceId(id);
    getDocs(query(collection(db, 'blockedUsers'), where('isActive', '==', true)))
      .then((snap) => setBlocks(snap.docs.map((item) => ({ id: item.id, ...item.data() }))))
      .catch((error) => {
        console.warn('[BlockProvider] block check skipped:', error.code || error.message);
        setBlocks([]);
      })
      .finally(() => setChecking(false));
  }, []);

  const activeBlock = useMemo(() => {
    const email = user?.email || '';
    return blocks.find((block) => matchesEmail(block, email) || (block.type === 'hardBlock' && (block.knownDeviceIds || []).includes(deviceId))) || null;
  }, [blocks, deviceId, user]);

  useEffect(() => {
    if (!loading && user && activeBlock) signOut(auth).catch(() => {});
  }, [activeBlock, loading, user]);

  const value = useMemo(() => ({
    activeBlock,
    blocked: Boolean(activeBlock),
    deviceId,
    checking: checking || loading,
    isBlockedContact(value) {
      const normalized = String(value || '').trim().toLowerCase();
      return Boolean(normalized && blocks.some((block) => block.isActive !== false && String(block.email || '').trim().toLowerCase() === normalized));
    },
  }), [activeBlock, blocks, checking, deviceId, loading]);

  if (activeBlock?.type === 'hardBlock') return <BlockedScreen />;
  return <BlockContext.Provider value={value}>{children}</BlockContext.Provider>;
}

export function useBlockStatus() {
  return useContext(BlockContext) || { blocked: false, activeBlock: null, isBlockedContact: () => false };
}
