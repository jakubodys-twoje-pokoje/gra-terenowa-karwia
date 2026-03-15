'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { fetchMe } from '@/lib/useAuth';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ nickname: '', email: '', password: '', city: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const guestUserId = searchParams.get('guest') ?? '';

  useEffect(() => {
    // Pre-fill email if guest had a profile
    if (guestUserId) {
      fetch(`/api/profil?userId=${guestUserId}`).then(async (r) => {
        if (r.ok) {
          const p = await r.json();
          setForm((f) => ({
            ...f,
            nickname: p.nickname ?? '',
            email: p.email ?? '',
            city: p.city ?? '',
          }));
        }
      });
    }
  }, [guestUserId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Hasło musi mieć min. 6 znaków'); return; }
    setLoading(true);

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, guestUserId }),
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('karwia_user_id', data.userId);
      await fetchMe();
      router.push('/');
    } else {
      const err = await res.json();
      setError(err.error ?? 'Błąd rejestracji');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col px-6 pt-12">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 mb-8 self-start">
        <ArrowLeft size={18} /> Wróć
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-ocean-900">Utwórz konto</h1>
        <p className="text-gray-400 text-sm mt-1">
          {guestUserId ? 'Twoje odkrycia zostaną przeniesione na nowe konto.' : 'Dołącz do gry i zapisz postępy.'}
        </p>
      </div>

      {guestUserId && (
        <div className="bg-ocean-50 border border-ocean-200 rounded-2xl px-4 py-3 mb-4 text-sm text-ocean-700">
          ✓ Twoje odkrycia z gry gościa zostaną automatycznie przeniesione.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Pseudonim (widoczny w rankingu)"
          value={form.nickname}
          onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
          autoComplete="nickname"
          className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400"
        />
        <input
          type="email"
          placeholder="Adres e-mail"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          autoComplete="email"
          required
          className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400"
        />
        <div className="relative">
          <input
            type={showPass ? 'text' : 'password'}
            placeholder="Hasło (min. 6 znaków)"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            autoComplete="new-password"
            required
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400 pr-10"
          />
          <button type="button" onClick={() => setShowPass((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <input
          type="text"
          placeholder="Miejscowość (opcjonalnie)"
          value={form.city}
          onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400"
        />

        {error && <p className="text-red-500 text-sm px-1">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-ocean-500 text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-ocean-500/30 disabled:opacity-60 mt-2"
        >
          <UserPlus size={16} />
          {loading ? 'Tworzę konto…' : 'Zarejestruj się'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-400 mt-6">
        Masz już konto?{' '}
        <Link href="/login" className="text-ocean-500 font-semibold">Zaloguj się</Link>
      </p>
    </div>
  );
}

export default function Rejestracja() {
  return <Suspense><RegisterForm /></Suspense>;
}
