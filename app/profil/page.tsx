'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { User, Save, Check, Camera, Loader2, LogOut, Lock, Mail, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth, logout } from '@/lib/useAuth';

// Generate a stable display number from UUID
function guestNumber(userId: string): string {
  const hex = userId.replace(/-/g, '').slice(-6);
  const num = parseInt(hex, 16) % 999999;
  return String(num).padStart(6, '0');
}

function getUserId(): string {
  let id = localStorage.getItem('karwia_user_id');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('karwia_user_id', id); }
  return id;
}

// ── GUEST VIEW ────────────────────────────────────────────────────────────────
function GuestView({ onRegister }: { onRegister: () => void }) {
  const [showPopup, setShowPopup] = useState(false);
  const [guestId, setGuestId] = useState('');

  useEffect(() => { setGuestId(getUserId()); }, []);

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center">
          <User size={22} className="text-gray-400" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-ocean-900">Profil</h1>
          <p className="text-gray-400 text-xs">Tryb gościa</p>
        </div>
      </div>

      {/* Guest avatar */}
      <div className="flex justify-center mb-6">
        <button onClick={() => setShowPopup(true)} className="relative">
          <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-gray-200 flex items-center justify-center">
            <User size={36} className="text-gray-300" />
          </div>
          <div className="absolute bottom-0 right-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center border-2 border-white">
            <Lock size={12} className="text-white" />
          </div>
        </button>
      </div>

      {/* Guest ID */}
      <div className="bg-gray-50 rounded-3xl p-5 mb-5 text-center">
        <p className="text-xs text-gray-400 mb-1">Twój numer gościa</p>
        <p className="text-3xl font-extrabold text-gray-700 tracking-widest">#{guestId ? guestNumber(guestId) : '…'}</p>
        <p className="text-xs text-gray-400 mt-2">Zarejestruj się, by wybrać własny pseudonim</p>
      </div>

      {/* Locked fields */}
      {['Pseudonim', 'Adres e-mail', 'Miejscowość'].map((label) => (
        <button key={label} onClick={() => setShowPopup(true)}
          className="w-full flex items-center gap-3 border border-gray-100 rounded-2xl px-4 py-3 mb-3 bg-gray-50 text-left">
          <Lock size={14} className="text-gray-300 shrink-0" />
          <span className="text-sm text-gray-300">{label}</span>
        </button>
      ))}

      <button onClick={onRegister}
        className="w-full mt-4 bg-ocean-500 text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-ocean-500/30 flex items-center justify-center gap-2">
        Zarejestruj się, by zapisać dane
      </button>

      {/* Twoje Pokoje branding */}
      <div className="mt-8 mb-4 flex flex-col items-center gap-2">
        <p className="text-[10px] uppercase tracking-widest text-gray-300 font-semibold">Partner projektu</p>
        <a href="https://www.twojepokoje.com.pl" target="_blank" rel="noopener noreferrer" className="opacity-50 hover:opacity-80 transition-opacity">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/twoje-pokoje-logo.png" alt="Twoje Pokoje" className="h-7 w-auto" />
        </a>
      </div>

      {/* Popup */}
      {showPopup && (
        <div className="fixed inset-0 z-[900] flex items-end justify-center p-4 bg-black/40"
          onClick={() => setShowPopup(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-ocean-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Lock size={24} className="text-ocean-500" />
              </div>
              <h2 className="font-extrabold text-ocean-900 text-lg">Zarejestruj się</h2>
              <p className="text-gray-400 text-sm mt-1">
                Dane profilu są dostępne tylko dla zarejestrowanych użytkowników. Twoje odkrycia zostaną przeniesione na nowe konto.
              </p>
            </div>
            <button onClick={onRegister}
              className="w-full bg-ocean-500 text-white py-3 rounded-2xl font-bold text-sm mb-2">
              Utwórz konto
            </button>
            <button onClick={() => setShowPopup(false)}
              className="w-full py-3 rounded-2xl text-gray-400 text-sm">
              Zostań gościem
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── UNVERIFIED VIEW ───────────────────────────────────────────────────────────
function UnverifiedView({ email }: { email: string }) {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState('');

  const resend = async () => {
    setResending(true); setError('');
    const res = await fetch('/api/auth/send-verification', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
    });
    if (res.ok) setResent(true);
    else { const d = await res.json(); setError(d.error ?? 'Błąd'); }
    setResending(false);
  };

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center">
          <Mail size={22} className="text-orange-500" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-ocean-900">Potwierdź email</h1>
          <p className="text-gray-400 text-xs">Konto nieaktywne</p>
        </div>
      </div>

      <div className="text-center py-8 px-4">
        <div className="text-6xl mb-4">📬</div>
        <h2 className="font-bold text-ocean-900 text-lg mb-2">Sprawdź swoją skrzynkę</h2>
        <p className="text-gray-400 text-sm mb-1">
          Wysłaliśmy link aktywacyjny na adres:
        </p>
        <p className="font-semibold text-ocean-700 text-sm mb-6">{email}</p>
        <p className="text-gray-400 text-xs mb-6">
          Kliknij link w emailu, aby aktywować konto i odblokować profil. Link jest ważny przez 24h.
        </p>

        {resent ? (
          <p className="text-green-600 font-semibold text-sm">Nowy link wysłany!</p>
        ) : (
          <button onClick={resend} disabled={resending}
            className="inline-flex items-center gap-2 text-ocean-500 bg-ocean-50 px-5 py-2.5 rounded-xl font-semibold text-sm">
            <RefreshCw size={15} className={resending ? 'animate-spin' : ''} />
            {resending ? 'Wysyłam…' : 'Wyślij link ponownie'}
          </button>
        )}
        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
      </div>
    </div>
  );
}

// ── VERIFIED VIEW ─────────────────────────────────────────────────────────────
function VerifiedView({ user, onLogout }: { user: { email: string; nickname: string | null; city: string | null; avatarUrl: string | null }, onLogout: () => void }) {
  const [form, setForm] = useState({ nickname: user.nickname ?? '', city: user.city ?? '' });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl ?? null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null); // null = not uploading
  const [uploadError, setUploadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadingAvatar = uploadProgress !== null;

  // Warn user before leaving while upload is in progress
  useEffect(() => {
    if (!uploadingAvatar) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [uploadingAvatar]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    const preview = URL.createObjectURL(file);
    setAvatarUrl(preview);
    setUploadProgress(0);
    const userId = getUserId();
    const fd = new FormData();
    fd.append('file', file);
    fd.append('userId', userId);

    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
    };
    xhr.onload = async () => {
      URL.revokeObjectURL(preview);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const { url, error: apiErr } = JSON.parse(xhr.responseText);
          if (apiErr || !url) {
            setUploadError(apiErr ?? 'Błąd serwera przy uploading');
            setAvatarUrl(user.avatarUrl ?? null);
          } else {
            setAvatarUrl(`${url}?t=${Date.now()}`);
            const saveRes = await fetch('/api/profil', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ avatarUrl: url, nickname: form.nickname, city: form.city }),
            });
            if (!saveRes.ok) {
              const d = await saveRes.json().catch(() => ({}));
              setUploadError(d.error ?? `Błąd zapisu profilu (${saveRes.status})`);
            }
          }
        } catch {
          setUploadError('Nieprawidłowa odpowiedź serwera');
          setAvatarUrl(user.avatarUrl ?? null);
        }
      } else {
        let msg = `Błąd uploadu (${xhr.status})`;
        try { const d = JSON.parse(xhr.responseText); msg = d.error ?? msg; } catch { /* ignore */ }
        setUploadError(msg);
        setAvatarUrl(user.avatarUrl ?? null);
      }
      setUploadProgress(null);
    };
    xhr.onerror = () => {
      URL.revokeObjectURL(preview);
      setAvatarUrl(user.avatarUrl ?? null);
      setUploadProgress(null);
      setUploadError('Błąd sieci — sprawdź połączenie');
    };
    xhr.open('POST', '/api/upload/avatar');
    xhr.send(fd);
    e.target.value = '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/profil', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, avatarUrl }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-ocean-100 flex items-center justify-center">
            <User size={22} className="text-ocean-500" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-ocean-900">Profil</h1>
            <p className="text-gray-500 text-xs">{user.email}</p>
          </div>
        </div>
        <button onClick={onLogout}
          className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-100 px-3 py-2 rounded-xl">
          <LogOut size={14} /> Wyloguj
        </button>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-6 gap-3">
        <button type="button" onClick={() => fileInputRef.current?.click()} className="relative group" disabled={uploadingAvatar}>
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-ocean-200 shadow-lg" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-ocean-100 border-4 border-ocean-200 shadow-lg flex items-center justify-center">
              <User size={36} className="text-ocean-300" />
            </div>
          )}
          <div className="absolute bottom-0 right-0 w-8 h-8 bg-ocean-500 rounded-full flex items-center justify-center shadow-md border-2 border-white">
            {uploadingAvatar ? <Loader2 size={14} className="text-white animate-spin" /> : <Camera size={14} className="text-white" />}
          </div>
        </button>

        {/* Upload progress */}
        {uploadProgress !== null && (
          <div className="w-full max-w-[220px]">
            <div className="flex justify-between text-xs text-ocean-500 font-semibold mb-1">
              <span>Wysyłanie zdjęcia…</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 bg-ocean-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-ocean-500 rounded-full transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-[11px] text-gray-400 text-center mt-1.5">Nie zamykaj tej strony</p>
          </div>
        )}

        {/* Upload error */}
        {uploadError && (
          <p className="text-red-500 text-xs text-center bg-red-50 px-3 py-2 rounded-xl max-w-[220px]">{uploadError}</p>
        )}

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 px-1">Pseudonim</label>
          <input type="text" placeholder="Jak chcesz być nazywany?"
            value={form.nickname} onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 px-1">Adres e-mail</label>
          <input type="email" value={user.email} disabled
            className="w-full border border-gray-100 rounded-2xl px-4 py-3 text-sm bg-gray-50 text-gray-400" />
          <p className="text-[11px] text-gray-400 px-1 mt-1">Email konta nie można zmienić tutaj.</p>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 px-1">Miejscowość</label>
          <input type="text" placeholder="Skąd jesteś?"
            value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400" />
        </div>
        <button type="submit" disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-ocean-500 text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-ocean-500/30 disabled:opacity-60">
          {saved ? <><Check size={16} /> Zapisano!</> : saving ? 'Zapisuję…' : <><Save size={16} /> Zapisz profil</>}
        </button>
      </form>

      {/* Twoje Pokoje branding */}
      <div className="mt-8 mb-4 flex flex-col items-center gap-2">
        <p className="text-[10px] uppercase tracking-widest text-gray-300 font-semibold">Partner projektu</p>
        <a href="https://www.twojepokoje.com.pl" target="_blank" rel="noopener noreferrer" className="opacity-50 hover:opacity-80 transition-opacity">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/twoje-pokoje-logo.png" alt="Twoje Pokoje" className="h-7 w-auto" />
        </a>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function ProfilPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    await logout();
    localStorage.removeItem('karwia_user_id');
    router.push('/');
  }, [router]);

  const handleRegister = useCallback(() => {
    const guestId = typeof window !== 'undefined' ? getUserId() : '';
    router.push(`/rejestracja?guest=${guestId}`);
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 size={28} className="animate-spin text-ocean-400" />
      </div>
    );
  }

  if (!user) return <GuestView onRegister={handleRegister} />;
  if (!user.emailVerified) return <UnverifiedView email={user.email} />;
  return <VerifiedView user={user} onLogout={handleLogout} />;
}
