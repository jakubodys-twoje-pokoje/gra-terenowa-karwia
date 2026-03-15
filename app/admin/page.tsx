'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Plus, Trash2, Edit3, Check, X, Images, Users, Building2, CheckCircle, XCircle, Lock } from 'lucide-react';
import clsx from 'clsx';

const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false });

interface BuildingImage {
  id: number;
  url: string;
  order: number;
}

interface Building {
  id: number;
  name: string;
  description: string;
  address?: string;
  lat: number;
  lng: number;
  imageUrl?: string;
  outlineImageUrl?: string;
  qrUrl: string;
  category: string;
  images: BuildingImage[];
}

const CATEGORIES = [
  { value: 'beach',      label: '🏖️ Plaża' },
  { value: 'landmark',   label: '🏛️ Zabytek' },
  { value: 'food',       label: '🐟 Jedzenie' },
  { value: 'hotel',      label: '🏨 Nocleg' },
  { value: 'attraction', label: '⭐ Atrakcja' },
  { value: 'nature',     label: '🌿 Natura' },
];

const EMPTY_FORM = {
  name: '', description: '', address: '',
  lat: '54.7505', lng: '17.8670',
  imageUrl: '', outlineImageUrl: '', qrUrl: '', category: 'landmark',
};

interface UserEntry {
  userId: string;
  nickname: string | null;
  email: string | null;
  city: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  registeredAt: string;
  discoveryCount: number;
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<'budynki' | 'uzytkownicy'>('budynki');
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [guestCount, setGuestCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [gallery, setGallery] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [pickingCoords, setPickingCoords] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const loadBuildings = useCallback(async (pwd: string) => {
    setLoading(true);
    const res = await fetch('/api/budynki', { headers: { 'x-admin-password': pwd } });
    if (res.ok) setBuildings(await res.json());
    setLoading(false);
  }, []);

  const loadUsers = useCallback(async (pwd: string) => {
    const res = await fetch('/api/admin/users', { headers: { 'x-admin-password': pwd } });
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
      setGuestCount(data.guestCount);
    }
  }, []);

  const handleDeleteUser = async (userId: string, email: string | null) => {
    if (!confirm(`Usunąć użytkownika "${email ?? userId}"? Zostaną usunięte też jego odkrycia.`)) return;
    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      setUsers((u) => u.filter((x) => x.userId !== userId));
      setSuccess('Użytkownik usunięty');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem('admin_pass', password);
    setAuthed(true);
    loadBuildings(password);
    loadUsers(password);
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (pickingCoords) {
      setForm((f) => ({ ...f, lat: lat.toFixed(6), lng: lng.toFixed(6) }));
      setPickingCoords(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const body = {
      ...form,
      lat: parseFloat(form.lat),
      lng: parseFloat(form.lng),
      outlineImageUrl: form.outlineImageUrl || null,
      gallery: gallery.filter((u) => u.trim()),
    };

    const url = editingId ? `/api/budynki/${editingId}` : '/api/budynki';
    const method = editingId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setSuccess(editingId ? 'Budynek zaktualizowany!' : 'Budynek dodany!');
      setForm(EMPTY_FORM);
      setGallery([]);
      setEditingId(null);
      setShowForm(false);
      setTimeout(() => setSuccess(''), 3000);
      loadBuildings(password);
    } else {
      const err = await res.json();
      setFormError(err.error || 'Błąd zapisu');
    }
  };

  const handleEdit = (b: Building) => {
    setForm({
      name: b.name, description: b.description, address: b.address ?? '',
      lat: String(b.lat), lng: String(b.lng),
      imageUrl: b.imageUrl ?? '', outlineImageUrl: b.outlineImageUrl ?? '', qrUrl: b.qrUrl, category: b.category,
    });
    setGallery(b.images.map((img) => img.url));
    setEditingId(b.id);
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Usunąć "${name}"?`)) return;
    const res = await fetch(`/api/budynki/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-password': password },
    });
    if (res.ok) {
      setBuildings((b) => b.filter((x) => x.id !== id));
      setSuccess('Usunięto!');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const cancelForm = () => {
    setForm(EMPTY_FORM);
    setGallery([]);
    setEditingId(null);
    setShowForm(false);
    setFormError('');
  };

  const addGalleryUrl = () => setGallery((g) => [...g, '']);
  const updateGalleryUrl = (i: number, val: string) =>
    setGallery((g) => g.map((u, idx) => (idx === i ? val : u)));
  const removeGalleryUrl = (i: number) =>
    setGallery((g) => g.filter((_, idx) => idx !== i));

  useEffect(() => {
    const stored = sessionStorage.getItem('admin_pass');
    if (stored) { setPassword(stored); setAuthed(true); loadBuildings(stored); loadUsers(stored); }
  }, [loadBuildings, loadUsers]);

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-card p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <Lock size={32} className="text-ocean-500 mx-auto mb-2" />
            <h1 className="font-extrabold text-ocean-900 text-xl">Panel Administracyjny</h1>
            <p className="text-gray-400 text-sm mt-1">Karwia – Gra Terenowa</p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <input
              type="password"
              placeholder="Hasło administratora"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400"
            />
            {authError && <p className="text-red-500 text-sm">{authError}</p>}
            <button
              type="submit"
              className="w-full bg-ocean-500 text-white py-3 rounded-2xl font-bold hover:bg-ocean-600 transition"
            >
              Zaloguj
            </button>
          </form>
        </div>
      </div>
    );
  }

  const mapBuildings = buildings.map((b) => ({
    id: b.id, name: b.name, lat: b.lat, lng: b.lng, discovered: true,
  }));

  return (
    <div className="px-4 pt-6 pb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-extrabold text-ocean-900">Panel Admina</h1>
          <p className="text-gray-400 text-xs">{buildings.length} budynków · {users.length} kont · {guestCount} gości</p>
        </div>
        {activeTab === 'budynki' && (
          <button
            onClick={() => { cancelForm(); setShowForm(true); }}
            className="flex items-center gap-2 bg-ocean-500 text-white px-4 py-2 rounded-2xl text-sm font-bold shadow-lg shadow-ocean-500/30"
          >
            <Plus size={16} />
            Dodaj
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-2xl p-1 mb-5 gap-1">
        <button onClick={() => setActiveTab('budynki')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'budynki' ? 'bg-white text-ocean-600 shadow-sm' : 'text-gray-400'}`}>
          <Building2 size={13} /> Budynki
        </button>
        <button onClick={() => setActiveTab('uzytkownicy')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'uzytkownicy' ? 'bg-white text-ocean-600 shadow-sm' : 'text-gray-400'}`}>
          <Users size={13} /> Użytkownicy
        </button>
      </div>

      {/* Success toast */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-2xl p-3 mb-4 text-sm flex items-center gap-2">
          <Check size={16} />
          {success}
        </div>
      )}

      {/* Map overview */}
      <div className="mb-5 rounded-3xl overflow-hidden shadow-card">
        <MapComponent
          buildings={mapBuildings}
          center={[54.7505, 17.8670]}
          zoom={14}
          height="200px"
          onMapClick={handleMapClick}
        />
      </div>

      {/* Form */}
      {showForm && (
        <div ref={formRef} className="bg-white rounded-3xl shadow-card p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-ocean-900">
              {editingId ? 'Edytuj budynek' : 'Nowy budynek'}
            </h2>
            <button onClick={cancelForm} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              required
              placeholder="Nazwa budynku"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400"
            />
            <textarea
              required
              placeholder="Opis (widoczny po odkryciu)"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400 resize-none"
            />
            <input
              placeholder="Adres (opcjonalnie)"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400"
            />

            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-2">
              <input
                required
                placeholder="Szerokość (lat)"
                value={form.lat}
                onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
                className="border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400"
              />
              <input
                required
                placeholder="Długość (lng)"
                value={form.lng}
                onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
                className="border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400"
              />
            </div>

            <button
              type="button"
              onClick={() => setPickingCoords(true)}
              className={clsx(
                'w-full py-2 rounded-2xl text-sm font-semibold border-2 transition',
                pickingCoords
                  ? 'bg-ocean-500 text-white border-ocean-500'
                  : 'border-dashed border-ocean-300 text-ocean-500 hover:border-ocean-500'
              )}
            >
              {pickingCoords ? '📍 Kliknij na mapie powyżej…' : '🗺️ Wybierz lokalizację na mapie'}
            </button>

            <input
              required
              placeholder="URL kodu QR (np. https://karwia.pl/qr/budynek-1)"
              value={form.qrUrl}
              onChange={(e) => setForm((f) => ({ ...f, qrUrl: e.target.value }))}
              className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400"
            />
            <p className="text-xs text-gray-400 mt-1 px-1">
              💡 Zeskanuj swój istniejący kod QR telefonem — otworzony adres URL wklej tutaj. Aplikacja będzie go rozpoznawać automatycznie.
            </p>

            <input
              placeholder="URL zdjęcia okładkowego (opcjonalnie)"
              value={form.imageUrl}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
              className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400"
            />
            <input
              placeholder="URL zdjęcia obrysu / sylwetki (nieodkryte — opcjonalnie)"
              value={form.outlineImageUrl}
              onChange={(e) => setForm((f) => ({ ...f, outlineImageUrl: e.target.value }))}
              className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400"
            />

            {/* Gallery */}
            <div className="border border-gray-200 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-ocean-800">
                  <Images size={15} />
                  Galeria zdjęć
                  {gallery.length > 0 && (
                    <span className="bg-ocean-100 text-ocean-600 text-xs px-1.5 py-0.5 rounded-full">
                      {gallery.length}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={addGalleryUrl}
                  className="flex items-center gap-1 text-xs text-ocean-500 font-semibold hover:text-ocean-700"
                >
                  <Plus size={13} />
                  Dodaj zdjęcie
                </button>
              </div>

              {gallery.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-1">
                  Brak zdjęć w galerii — kliknij &quot;Dodaj zdjęcie&quot;
                </p>
              )}

              {gallery.map((url, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    placeholder={`URL zdjęcia ${i + 1}`}
                    value={url}
                    onChange={(e) => updateGalleryUrl(i, e.target.value)}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ocean-400"
                  />
                  <button
                    type="button"
                    onClick={() => removeGalleryUrl(i)}
                    className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 shrink-0"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>

            {formError && <p className="text-red-500 text-sm">{formError}</p>}

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 bg-ocean-500 text-white py-3 rounded-2xl font-bold text-sm hover:bg-ocean-600 transition"
              >
                {editingId ? 'Zapisz zmiany' : 'Dodaj budynek'}
              </button>
              <button type="button" onClick={cancelForm} className="px-4 py-3 rounded-2xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50">
                Anuluj
              </button>
            </div>
          </form>
        </div>
      )}

      {/* BUDYNKI TAB */}
      {activeTab === 'budynki' && (
        loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-3 border-ocean-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {buildings.map((b) => (
              <div key={b.id} className="bg-white rounded-2xl shadow-card p-4">
                <div className="flex items-start gap-3">
                  {b.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.imageUrl} alt={b.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-ocean-900 text-sm">{b.name}</h3>
                    <p className="text-gray-400 text-xs mt-0.5 truncate">{b.qrUrl}</p>
                    <p className="text-gray-300 text-xs">{b.lat.toFixed(4)}, {b.lng.toFixed(4)}</p>
                    {b.images.length > 0 && (
                      <p className="text-ocean-400 text-xs mt-0.5">
                        <Images size={10} className="inline mr-0.5" />
                        {b.images.length} zdjęć w galerii
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(b)} className="p-2 rounded-xl bg-ocean-50 text-ocean-500 hover:bg-ocean-100">
                      <Edit3 size={15} />
                    </button>
                    <button onClick={() => handleDelete(b.id, b.name)} className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* UŻYTKOWNICY TAB */}
      {activeTab === 'uzytkownicy' && (
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-2xl px-4 py-2.5 text-xs text-gray-500 flex gap-4">
            <span><strong className="text-ocean-700">{users.length}</strong> zarejestrowanych</span>
            <span><strong className="text-green-600">{users.filter(u => u.emailVerified).length}</strong> zweryfikowanych</span>
            <span><strong className="text-gray-400">{guestCount}</strong> gości</span>
          </div>

          {users.map((u) => (
            <div key={u.userId} className="bg-white rounded-2xl shadow-card p-4">
              <div className="flex items-center gap-3">
                {u.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-ocean-100 flex items-center justify-center shrink-0">
                    <Users size={16} className="text-ocean-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-ocean-900 text-sm truncate">
                      {u.nickname ?? <span className="text-gray-400 font-normal italic">Bez pseudonimu</span>}
                    </p>
                    {u.emailVerified
                      ? <CheckCircle size={13} className="text-green-500 shrink-0" />
                      : <XCircle size={13} className="text-orange-400 shrink-0" />
                    }
                  </div>
                  <p className="text-gray-400 text-xs truncate">{u.email ?? '—'}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {u.city && <span className="text-gray-300 text-xs">{u.city}</span>}
                    <span className="text-ocean-500 text-xs font-semibold">{u.discoveryCount} odkryć</span>
                    <span className="text-gray-300 text-xs">{new Date(u.registeredAt).toLocaleDateString('pl')}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteUser(u.userId, u.email)}
                  className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">Brak zarejestrowanych użytkowników</div>
          )}
        </div>
      )}
    </div>
  );
}
