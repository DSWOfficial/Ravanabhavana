import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { ArrowLeft, LogIn } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase.js';
import { useBlockStatus } from '../context/BlockContext.jsx';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const { isBlockedContact } = useBlockStatus();
  const navigate = useNavigate();
  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      if (isBlockedContact(form.email)) {
        setError('Your access has been restricted.');
        return;
      }
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
        if (form.name) await updateProfile(cred.user, { displayName: form.name });
      } else {
        await signInWithEmailAndPassword(auth, form.email, form.password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--theme-section)] p-4">
      <form onSubmit={submit} className="surface w-full max-w-md rounded-lg p-7">
        <img src="/ravana-bhawana-logo.png" alt="රාවණ භවණ" className="mx-auto h-24 w-24 rounded-full object-cover" />
        <h1 className="mt-5 text-center text-3xl font-black text-[var(--theme-primary)]">{mode === 'login' ? 'Login' : 'Create account'}</h1>
        {mode === 'signup' && <input className="input mt-5" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}
        <input className="input mt-3" type="email" required placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input mt-3" type="password" required minLength={6} placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button className="btn btn-primary mt-5 w-full" type="submit"><LogIn size={18} />{mode === 'login' ? 'Login' : 'Signup'}</button>
        <button type="button" className="btn btn-outline mt-3 w-full" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>{mode === 'login' ? 'Create new account' : 'Already have an account'}</button>
        <Link className="btn btn-outline mt-3 w-full" to="/"><ArrowLeft size={18} />Continue as guest</Link>
      </form>
    </main>
  );
}
