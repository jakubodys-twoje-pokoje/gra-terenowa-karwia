'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ArrowLeft, MapPin, Navigation, Check, Lock, QrCode } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';
import type { MapBuilding } from '@/components/MapComponent';

const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false });

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  beach:      { label: '🏖️ Plaża',     color: 'bg-cyan-100 text-cyan-700' },
  landmark:   { label: '🏛️ Zabytek',   color: 'bg-blue-100 text-blue-700' },
  food:       { label: '🐟 Jedzenie',  color: 'bg-orange-100 text-orange-700' },
  hotel:      { label: '🏨 Nocleg',    color: 'bg-purple-100 text-purple-700' },
  attraction: { label: '⭐ Atrakcja',  color: 'bg-yellow-100 text-yellow-700' },
  nature:     { label: '🌿 Natura',    color: 'bg-green-100 text-green-700' },
};

interface BuildingImage { id: number; url: string; order: number; }

interface Building {
  id: number;
  name: string;
  description: string;
  address: string | null;
  lat: number;
  lng: number;
  imageUrl: string | null;
  outlineImageUrl: string | null;
  category: string;
  qrUrl: string;
  images: BuildingImage[];
}

interface NearbyBuilding {
  id: number;
  name: string;
  lat: number;
  lng: number;
  category: string;
  imageUrl: string | null;
  distanceKm: number;
}

function getUserId(): string {
  let id = localStorage.getItem('karwia_user_id');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('karwia_user_id', id); }
  return id;
}

export default function BudynekPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [building, setBuilding] = useState<Building | null>(null);
  const [nearby, setNearby] = useState<NearbyBuilding[]>([]);
  const [discovered, setDiscovered] = useState(false);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showAchievementToast, setShowAchievementToast] = useState(false);

  const load = useCallback(async () => {
    const userId = getUserId();
    const isScan = searchParams.get('scan') === '1';

    // If arriving from QR scan, mark as discovered first
    if (isScan) {
      await fetch('/api/odkrycia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, buildingId: Number(id) }),
      });
    }

    // Fetch building, nearby, and verify discovery status server-side in parallel
    const [bRes, nRes, discRes] = await Promise.all([
      fetch(`/api/budynki/${id}`),
      fetch(`/api/budynki/${id}/najblizsze`),
      fetch(`/api/odkrycia?userId=${userId}`),
    ]);

    if (!bRes.ok) { setNotFound(true); setLoading(false); return; }

    const b: Building = await bRes.json();
    const n: NearbyBuilding[] = nRes.ok ? await nRes.json() : [];
    const discoveries: { building: { id: number } }[] = discRes.ok ? await discRes.json() : [];

    // Ground-truth discovery check from server — cannot be spoofed via localStorage
    const isDiscovered = discoveries.some((d) => d.building.id === Number(id));

    setBuilding(b);
    setNearby(n);
    setDiscovered(isDiscovered);
    setLoading(false);

    // If not discovered, stop here — locked view will be shown
    if (!isDiscovered) return;

    // Toasts and achievements only on a fresh scan
    if (!isScan) return;

    const celebratedKey = `karwia_celebrated_${id}`;
    if (localStorage.getItem(celebratedKey)) return;
    localStorage.setItem(celebratedKey, '1');

    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);

    // Check for newly unlocked achievements
    const allBuildings = await fetch('/api/budynki').then((r) => r.json());
    const { getUnlockedAchievements } = await import('@/lib/achievements');
    const cats = discoveries.map((d) => (d as unknown as { building: { category: string } }).building.category);
    const prevCount = discoveries.length - 1;
    const prevUnlocked = new Set(
      getUnlockedAchievements(prevCount, allBuildings.length, cats).map((a) => a.id)
    );
    const justUnlocked = getUnlockedAchievements(discoveries.length, allBuildings.length, cats)
      .filter((a) => !prevUnlocked.has(a.id));

    if (justUnlocked.length === 0) return;
    setNewAchievements(justUnlocked.map((a) => a.name));

    setTimeout(async () => {
      setShowAchievementToast(true);
      const confetti = (await import('canvas-confetti')).default;
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: ['#F5A623', '#0F5F92', '#ffffff', '#FFD700'] });
      setTimeout(() => confetti({ particleCount: 60, spread: 120, origin: { y: 0.5 }, angle: 60,  colors: ['#F5A623', '#0F5F92', '#ffffff'] }), 300);
      setTimeout(() => confetti({ particleCount: 60, spread: 120, origin: { y: 0.5 }, angle: 120, colors: ['#F5A623', '#0F5F92', '#ffffff'] }), 450);
    }, 800);
  }, [id, searchParams]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-ocean-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center gap-4">
        <div className="text-6xl">🔍</div>
        <h2 className="text-xl font-extrabold text-ocean-900">Nie znaleziono miejsca</h2>
        <p className="text-gray-400 text-sm">Ten kod QR nie jest jeszcze zarejestrowany w grze lub budynek został usunięty.</p>
        <button onClick={() => router.push('/')} className="bg-ocean-500 text-white px-6 py-3 rounded-2xl font-bold mt-2">
          Wróć do mapy
        </button>
      </div>
    );
  }

  if (!building) return null;

  // ── LOCKED VIEW ─────────────────────────────────────────────────────────────
  if (!discovered) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Back button */}
        <div className="fixed top-4 left-4 z-30">
          <button onClick={() => router.back()} className="bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-md">
            <ArrowLeft size={20} className="text-ocean-700" />
          </button>
        </div>

        {/* Blurred / grayscale hero */}
        <div className="relative h-64 overflow-hidden bg-gray-200">
          {(building.outlineImageUrl ?? building.imageUrl) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={(building.outlineImageUrl ?? building.imageUrl) ?? ''}
              alt=""
              className="w-full h-full object-cover grayscale blur-sm scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <Lock size={48} className="text-gray-300" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Lock size={52} className="text-white/90 drop-shadow-lg" />
          </div>
          <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-white to-transparent" />
        </div>

        {/* Content */}
        <div className="px-4 -mt-6 relative z-10 flex-1 flex flex-col">
          <span className={clsx('text-xs font-semibold px-2.5 py-1 rounded-full', CATEGORY_LABELS[building.category]?.color ?? 'bg-gray-100 text-gray-600')}>
            {CATEGORY_LABELS[building.category]?.label ?? building.category}
          </span>
          <h1 className="text-2xl font-extrabold text-ocean-900 mt-2 leading-tight">???</h1>
          <p className="text-gray-400 text-sm mt-1">Lokalizacja nieznana</p>

          <div className="bg-ocean-50 border border-ocean-100 rounded-3xl p-5 mt-4 text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-ocean-100 flex items-center justify-center">
              <QrCode size={28} className="text-ocean-500" />
            </div>
            <p className="font-bold text-ocean-900">To miejsce jest jeszcze nieodkryte</p>
            <p className="text-gray-400 text-sm leading-relaxed">
              Znajdź to miejsce w Karwi i zeskanuj kod QR, żeby odblokować pełne informacje.
            </p>
            <button
              onClick={() => router.push('/skanuj')}
              className="mt-1 bg-ocean-500 text-white px-6 py-3 rounded-2xl font-bold text-sm w-full"
            >
              Skanuj kod QR
            </button>
            <button
              onClick={() => router.push('/')}
              className="text-ocean-400 text-sm font-semibold"
            >
              Wróć do mapy
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── DISCOVERED VIEW ──────────────────────────────────────────────────────────
  const cat = CATEGORY_LABELS[building.category] ?? { label: building.category, color: 'bg-gray-100 text-gray-600' };
  const mapBuildings: MapBuilding[] = [
    { id: building.id, name: building.name, lat: building.lat, lng: building.lng, discovered: true, isActive: true },
    ...nearby.map((n) => ({ id: n.id, name: n.name, lat: n.lat, lng: n.lng, discovered: false })),
  ];

  return (
    <div className="min-h-screen">
      {/* Back button */}
      <div className="fixed top-4 left-4 z-30">
        <button onClick={() => router.back()} className="bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-md">
          <ArrowLeft size={20} className="text-ocean-700" />
        </button>
      </div>

      {/* Hero image */}
      <div className="relative h-64 bg-gradient-to-br from-ocean-300 to-ocean-600 overflow-hidden">
        {building.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={building.imageUrl} alt={building.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl">🏛️</div>
        )}
        <div className="absolute top-4 right-4 bg-ocean-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
          <Check size={12} strokeWidth={3} />
          Odkryto!
        </div>
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </div>

      {/* Content */}
      <div className="px-4 -mt-6 relative z-10">
        <span className={clsx('text-xs font-semibold px-2.5 py-1 rounded-full', cat.color)}>{cat.label}</span>
        <h1 className="text-2xl font-extrabold text-ocean-900 mt-2 leading-tight">{building.name}</h1>
        {building.address && (
          <p className="flex items-center gap-1.5 text-gray-400 text-sm mt-1">
            <MapPin size={14} />
            {building.address}
          </p>
        )}

        <div className="bg-white rounded-3xl p-5 mt-4 shadow-card">
          <p className="text-gray-600 text-sm leading-relaxed">{building.description}</p>
        </div>

        {building.images.length > 0 && (
          <div className="mt-4">
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
              {building.images.map((img) => (
                <div key={img.id} className="shrink-0 w-64 h-44 rounded-2xl overflow-hidden shadow-card snap-start">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={building.name} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 rounded-3xl overflow-hidden shadow-card">
          <MapComponent buildings={mapBuildings} center={[building.lat, building.lng]} zoom={16} height="180px" />
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">⚓ – aktualne miejsce · · · najbliższe budynki</p>

        {nearby.length > 0 && (
          <div className="mt-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-ocean-500 mb-3 flex items-center gap-2">
              <Navigation size={14} />
              Najbliższe budynki
            </h2>
            <div className="space-y-3">
              {nearby.map((n) => (
                <Link key={n.id} href={`/budynek/${n.id}`}>
                  <div className="bg-white rounded-2xl p-4 shadow-card flex items-center gap-3 hover:shadow-card-hover transition-all">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-ocean-100 shrink-0">
                      {n.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={n.imageUrl} alt={n.name} className="w-full h-full object-cover grayscale" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Lock size={18} className="text-gray-300" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ocean-900 text-sm truncate">???</p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        {n.distanceKm < 1 ? `${Math.round(n.distanceKm * 1000)} m` : `${n.distanceKm.toFixed(1)} km`} stąd
                      </p>
                    </div>
                    <span className="text-ocean-300">›</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="pb-8" />
      </div>

      {/* Toast – discovered */}
      {showToast && (
        <div className="fixed top-16 inset-x-4 z-50 bg-ocean-600 text-white px-5 py-4 rounded-3xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top-4">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="font-bold text-sm">Miejsce odkryte!</p>
            <p className="text-ocean-200 text-xs">{building.name} zostało dodane do Twoich odkryć</p>
          </div>
        </div>
      )}

      {/* Achievement popup */}
      {showAchievementToast && (
        <div className="fixed inset-x-6 top-1/2 -translate-y-1/2 z-50 animate-in zoom-in-90 slide-in-from-bottom-8 duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-amber-400 to-yellow-300 px-6 pt-7 pb-5 text-center">
              <div className="text-7xl leading-none mb-2">🏆</div>
              <p className="text-amber-900 font-extrabold text-xs uppercase tracking-widest">Nowa odznaka odblokowana!</p>
            </div>
            <div className="px-6 py-5 text-center">
              <p className="text-ocean-900 font-extrabold text-xl leading-tight">{newAchievements.join(' & ')}</p>
              <p className="text-gray-400 text-sm mt-2">Świetna robota! Kontynuuj eksplorację Karwi.</p>
              <button
                onClick={() => setShowAchievementToast(false)}
                className="mt-5 w-full bg-ocean-500 text-white py-3 rounded-2xl font-bold text-sm hover:bg-ocean-600 transition"
              >
                Hurra! 🎉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
