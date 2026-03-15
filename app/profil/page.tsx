'use client';

import { useEffect, useState, useCallback } from 'react';
import { User, Save, Check } from 'lucide-react';

interface Profile {
  userId: string;
  nickname: string | null;
  email: string | null;
  city: string | null;
  avatarUrl: string | null;
}

function getUserId(): string {
  let id = localStorage.getItem('karwia_user_id');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('karwia_user_id', id); }
  return id;
}

export default function ProfilPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ nickname: '', email: '', city: '', avatarUrl: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const userId = getUserId();
    const res = await fetch(`/api/profil?userId=${userId}`);
    if (res.ok) {
      const data: Profile = await res.json();
      setProfile(data);
      setForm({
        nickname: data.nickname ?? '',
        email: data.email ?? '',
        city: data.city ?? '',
        avatarUrl: data.avatarUrl ?? '',
      });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const userId = getUserId();
    await fetch('/api/profil', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...form }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const userId = typeof window !== 'undefined' ? getUserId() : '';

  return (
    <div className="px-4 pt-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-ocean-100 flex items-center justify-center">
          <User size={22} className="text-ocean-500" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-ocean-900">Profil</h1>
          <p className="text-gray-500 text-xs">Twoje dane w grze</p>
        </div>
      </div>

      {/* Avatar preview */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          {form.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-ocean-200 shadow-lg" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-ocean-100 border-4 border-ocean-200 shadow-lg flex items-center justify-center">
              <User size={36} className="text-ocean-300" />
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 px-1">Pseudonim</label>
          <input
            type="text"
            placeholder="Jak chcesz być nazywany?"
            value={form.nickname}
            onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 px-1">Adres e-mail</label>
          <input
            type="email"
            placeholder="twoj@email.pl"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 px-1">Miejscowość</label>
          <input
            type="text"
            placeholder="Skąd jesteś?"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 px-1">URL zdjęcia profilowego</label>
          <input
            type="url"
            placeholder="https://…"
            value={form.avatarUrl}
            onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-ocean-500 text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-ocean-500/30 disabled:opacity-60 transition-all"
        >
          {saved ? <><Check size={16} /> Zapisano!</> : saving ? 'Zapisuję…' : <><Save size={16} /> Zapisz profil</>}
        </button>
      </form>

      {/* User ID info */}
      {profile !== null && (
        <div className="mt-6 bg-gray-50 rounded-2xl p-4">
          <p className="text-xs font-semibold text-gray-500 mb-1">ID gracza</p>
          <p className="text-xs text-gray-400 font-mono break-all">{userId}</p>
          <p className="text-[10px] text-gray-300 mt-1">
            Twój unikalny identyfikator — zapisz go, by zachować postępy po zmianie urządzenia.
          </p>
        </div>
      )}
    </div>
  );
}
