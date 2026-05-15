import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { db } from '../../firebase.js';
import { sortVideosByOrder } from '../../utils/progress.js';

export function useUserDashboardData() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [progress, setProgress] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [donations, setDonations] = useState([]);
  const [notes, setNotes] = useState([]);

  useEffect(() => onSnapshot(query(collection(db, 'videos'), where('isActive', '==', true)), (snap) => setVideos(sortVideosByOrder(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))), []);
  useEffect(() => {
    if (!user) return;
    const unsubProgress = onSnapshot(query(collection(db, 'userVideoProgress'), where('userId', '==', user.uid)), (snap) => setProgress(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    const unsubNotes = onSnapshot(query(collection(db, 'userPrivateNotes'), where('userId', '==', user.uid)), (snap) => setNotes(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    const unsubSessions = onSnapshot(query(collection(db, 'userSessionJoins'), where('userId', '==', user.uid)), (snap) => setSessions(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    const unsubDonations = onSnapshot(query(collection(db, 'donationSubmissions'), where('userId', '==', user.uid)), (snap) => setDonations(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => { unsubProgress(); unsubNotes(); unsubSessions(); unsubDonations(); };
  }, [user]);

  const byVideo = useMemo(() => Object.fromEntries(progress.map((item) => [item.videoDocId, item])), [progress]);
  return { videos, progress, sessions, donations, notes, byVideo };
}
