'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { User, Save, Check, Camera, Loader2 } from 'lucide-react';

interface Profile {
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
  const [form, setForm] = useState({ nickname: '', email: '', city: '' });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const userId = getUserId();
    const res = await fetch(`/api/profil?userId=${userId}`);
    if (res.ok) {
      const data: Profile = await res.json();
      setForm({
        nickname: data.nickname ?? '',
        email: data.email ?? '',
        city: data.city ?? '',
      });
      setAvatarUrl(data.avatarUrl ?? null);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const userId = getUserId();
    const fd = new FormData();
    fd.append('file', file);
    fd.append('userId', userId);
    const res = await fetch('/api/upload/avatar', { method: 'POST', body: fd });
    if (res.ok) {
      const { url } = await res.json();
      setAvatarUrl(url);
      // Auto-save avatar immediately
      await fetch('/api/profil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, avatarUrl: url, ...form }),
      });
    }
    setUploadingAvatar(false);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const userId = getUserId();
    await fetch('/api/profil', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...form, avatarUrl }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

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

      {/* Avatar upload */}
      <div className="flex justify-center mb-6">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative group"
          disabled={uploadingAvatar}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-24 h-24 rounded-full object-cover border-4 border-ocean-200 shadow-lg group-active:opacity-80 transition-opacity"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-ocean-100 border-4 border-ocean-200 shadow-lg flex items-center justify-center">
              <User size={36} className="text-ocean-300" />
            </div>
          )}
          <div className="absolute bottom-0 right-0 w-8 h-8 bg-ocean-500 rounded-full flex items-center justify-center shadow-md border-2 border-white">
            {uploadingAvatar
              ? <Loader2 size={14} className="text-white animate-spin" />
              : <Camera size={14} className="text-white" />
            }
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={handleAvatarChange}
        />
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

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-ocean-500 text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-ocean-500/30 disabled:opacity-60 transition-all"
        >
          {saved ? <><Check size={16} /> Zapisano!</> : saving ? 'Zapisuję…' : <><Save size={16} /> Zapisz profil</>}
        </button>
      </form>
    </div>
  );
}
