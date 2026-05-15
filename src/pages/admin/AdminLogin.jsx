import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase.js';

export default function AdminLogin() {
  const [form, setForm] = useState({ email: 'udarasampath@gmail.com', password: '' });
  const [status, setStatus] = useState({ loading: false, error: '' });
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: '' });
    try {
      const credential = await signInWithEmailAndPassword(auth, form.email, form.password);
      const email = credential.user.email;
      const adminPath = `admins/${email}`;
      console.log('[AdminLogin] logged-in email:', email);
      console.log('[AdminLogin] admin document path:', adminPath);
      const adminSnap = await getDoc(doc(db, 'admins', email));
      const adminData = adminSnap.exists() ? adminSnap.data() : null;
      const isAdmin = adminSnap.exists() && adminData?.role === 'admin';
      console.log('[AdminLogin] admin doc exists:', adminSnap.exists());
      console.log('[AdminLogin] redirect decision:', isAdmin ? 'redirect:/admin/dashboard' : 'access-denied');
      if (!isAdmin) {
        await signOut(auth);
        setStatus({ loading: false, error: 'Access denied' });
        return;
      }
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('[AdminLogin] Firestore/Auth check failed:', error);
      setStatus({ loading: false, error: error.message });
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#3a2115_0%,#1a110d_48%,#120b08_100%)] p-4">
      <form onSubmit={submit} className="surface animate-rise w-full max-w-md rounded-2xl p-7">
        <img src="/ravana-bhawana-logo.png" alt="Ravana Bhawana" className="mx-auto h-24 w-24 rounded-2xl object-cover shadow-xl" />
        <ShieldCheck className="mx-auto mt-5 text-[#b88934]" size={36} />
        <h1 className="mt-4 text-center text-3xl font-black text-[#3a2115]">Admin Login</h1>
        <p className="mt-2 text-center text-sm font-semibold text-[#6f4a31]">පරිපාලක පිවිසුම</p>
        <input className="input mt-5" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input mt-3" type="password" required placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {status.error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{status.error}</p>}
        <button className="btn btn-primary mt-5 w-full" disabled={status.loading}>{status.loading ? 'Checking...' : 'Login'}</button>
        <Link className="btn btn-outline mt-3 w-full" to="/">View public site</Link>
      </form>
    </main>
  );
}
