import { FormEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { acceptInvite, getUser, handleAuthCallback, login, logout, onAuthChange, requestPasswordRecovery, signup, updateUser } from '@netlify/identity';
import type { CallbackResult, User } from '@netlify/identity';

export function AuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup' | 'recovery' | 'password' | 'invite'>('login');
  const [invite, setInvite] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const callbackPromise = useRef<Promise<CallbackResult | null> | null>(null);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthChange((event, current) => {
      if (!active) return;
      if (event === 'recovery') setMode('password');
      setUser(current);
    });
    const initialize = async () => {
      try {
        callbackPromise.current ??= handleAuthCallback();
        const callback = await callbackPromise.current;
        if (!active) return;
        if (callback?.type === 'invite' && callback.token) {
          setInvite(callback.token); setMode('invite');
        } else if (callback?.type === 'recovery') setMode('password');
        const current = await getUser();
        if (active) setUser(current);
      } catch {
        if (active) setError('Gagal membuka sesi. Gunakan tautan email terbaru atau coba masuk kembali.');
      } finally { if (active) setLoading(false); }
    };
    void initialize();
    return () => { active = false; unsubscribe(); };
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(''); setMessage('');
    try {
      if (mode === 'signup') {
        await signup(email.trim(), password);
        const current = await getUser();
        setUser(current);
        if (!current) { setMessage('Akun dibuat. Periksa email untuk konfirmasi, lalu masuk.'); setMode('login'); }
      } else if (mode === 'recovery') {
        await requestPasswordRecovery(email.trim());
        setMessage('Periksa email untuk tautan penggantian kata sandi.'); setMode('login');
      } else if (mode === 'password') {
        setUser(await updateUser({ password })); setMode('login');
      } else if (mode === 'invite') {
        setUser(await acceptInvite(invite, password)); setInvite(''); setMode('login');
      } else setUser(await login(email.trim(), password));
      setPassword('');
    } catch {
      setError(mode === 'login' ? 'Gagal masuk. Periksa email, kata sandi, dan konfirmasi email.' : 'Permintaan gagal. Periksa koneksi atau pengaturan akun dan coba lagi.');
    } finally { setBusy(false); }
  };

  if (loading) return <div className="mx-auto mt-16 max-w-md animate-pulse space-y-3" role="status" aria-label="Memuat sesi"><div className="h-8 rounded-xl bg-slate-200" /><div className="h-36 rounded-2xl bg-slate-200" /></div>;

  if (user && mode !== 'password') return (
    <div key={user.id}>
      <div className="flex items-center justify-end gap-3 px-4 py-2 text-xs text-slate-500">
        <span>Data customer pribadi</span>
        <button className="btn-ghost" disabled={busy} onClick={async () => {
          setBusy(true);
          try { await logout(); setUser(null); setError(''); }
          catch { setError('Gagal keluar. Coba lagi.'); }
          finally { setBusy(false); }
        }}>Keluar</button>
      </div>
      {error && <p role="alert" className="px-4 text-sm text-red-600">{error}</p>}
      {children}
    </div>
  );

  const changeMode = (next: 'login' | 'signup' | 'recovery') => { setMode(next); setError(''); setMessage(''); setPassword(''); };
  const settingPassword = mode === 'password' || mode === 'invite';
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
      <section className="card w-full space-y-4 !p-6">
        <div><p className="mb-1 text-sm font-medium text-teal-700">Customer Follow-Up</p>
          <h1 className="text-2xl font-bold">{mode === 'signup' ? 'Buat Akun' : mode === 'recovery' ? 'Lupa Kata Sandi' : settingPassword ? 'Atur Kata Sandi' : 'Masuk'}</h1>
          <p className="mt-2 text-sm text-slate-500">Data customer dan kendaraan tersimpan privat pada akun Anda.</p></div>
        {message && <p role="status" className="text-sm text-teal-700">{message}</p>}
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <form className="space-y-4" onSubmit={submit}>
          {!settingPassword && <div><label className="label" htmlFor="auth-email">Email</label><input id="auth-email" className="input" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>}
          {mode !== 'recovery' && <div><label className="label" htmlFor="auth-password">Kata Sandi</label><input id="auth-password" className="input" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'login' ? 1 : 8} required value={password} onChange={(event) => setPassword(event.target.value)} /></div>}
          <button className="btn-primary w-full" disabled={busy} type="submit">{busy ? 'Memproses…' : mode === 'signup' ? 'Daftar' : mode === 'recovery' ? 'Kirim Tautan' : settingPassword ? 'Simpan Kata Sandi' : 'Masuk'}</button>
        </form>
        {!settingPassword && <div className="flex flex-wrap gap-3 text-sm">
          <button className="text-teal-700 underline" disabled={busy} onClick={() => changeMode(mode === 'signup' ? 'login' : 'signup')}>{mode === 'signup' ? 'Sudah punya akun? Masuk' : 'Buat akun'}</button>
          <button className="text-slate-600 underline" disabled={busy} onClick={() => changeMode(mode === 'recovery' ? 'login' : 'recovery')}>{mode === 'recovery' ? 'Kembali masuk' : 'Lupa kata sandi'}</button>
        </div>}
      </section>
    </main>
  );
}
