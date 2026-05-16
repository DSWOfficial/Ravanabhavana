import { signInWithEmailAndPassword } from 'firebase/auth';
import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase.js';

export default function AdminLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--theme-hero)] p-4">
      <form onSubmit={submit} className="surface w-full max-w-md rounded-lg p-7">
        <ShieldCheck className="mx-auto text-[var(--theme-accent)]" size={42} />
        <h1 className="mt-5 text-center text-3xl font-black text-[var(--theme-primary)]">Admin Login</h1>
        <input className="input mt-5" type="email" required placeholder="Admin email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input mt-3" type="password" required placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button className="btn btn-primary mt-5 w-full" type="submit">Login</button>
        <Link className="btn btn-outline mt-3 w-full" to="/">Back to public site</Link>
      </form>
    </main>
  );
}
