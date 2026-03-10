'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ArrowLeft, MapPin, Navigation, Check } from 'lucide-react';
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

interface BuildingImage {
  id: number;
  url: string;
  order: number;
}

interface Building {
  id: number;
  name: string;
  description: string;
  address: string | null;
  lat: number;
  lng: number;
  imageUrl: string | null;
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
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('karwia_user_id', id);
  }
  return id;
}

export default function BudynekPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [building, setBuilding] = useState<Building | null>(null);
  const [nearby, setNearby] = useState<NearbyBuilding[]>([]);
  const [discovered, setDiscovered] = useState(false);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);

  const load = useCallback(async () => {
    const [bRes, nRes] = await Promise.all([
      fetch(`/api/budynki/${id}`),
      fetch(`/api/budynki/${id}/najblizsze`),
    ]);

    if (!bRes.ok) { router.push('/'); return; }

    const b: Building = await bRes.json();
    const n: NearbyBuilding[] = nRes.ok ? await nRes.json() : [];
    setBuilding(b);
    setNearby(n);

    // Mark as discovered
    const userId = getUserId();
    const discRes = await fetch('/api/odkrycia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, buildingId: Number(id) }),
    });

    if (discRes.ok) {
      setDiscovered(true);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      // Check achievements
      const [allDiscoveries, allBuildings] = await Promise.all([
        fetch(`/api/odkrycia?userId=${userId}`).then((r) => r.json()),
        fetch('/api/budynki').then((r) => r.json()),
      ]);

      const { getUnlockedAchievements } = await import('@/lib/achievements');
      const cats = allDiscoveries.map((d: { building: { category: string } }) => d.building.category);
      const prevCount = allDiscoveries.length - 1;
      const prevUnlocked = new Set(
        getUnlockedAchievements(prevCount, allBuildings.length, cats).map((a) => a.id)
      );
      const newUnlocked = getUnlockedAchievements(allDiscoveries.length, allBuildings.length, cats);
      const justUnlocked = newUnlocked.filter((a) => !prevUnlocked.has(a.id));
      if (justUnlocked.length > 0) setNewAchievements(justUnlocked.map((a) => a.name));
    }

    setLoading(false);
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-ocean-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!building) return null;

  const cat = CATEGORY_LABELS[building.category] ?? { label: building.category, color: 'bg-gray-100 text-gray-600' };

  const mapBuildings: MapBuilding[] = [
    { id: building.id, name: building.name, lat: building.lat, lng: building.lng, discovered: true, isActive: true },
    ...nearby.map((n) => ({ id: n.id, name: n.name, lat: n.lat, lng: n.lng, discovered: false })),
  ];

  return (
    <div className="min-h-screen">
      {/* Back button */}
      <div className="fixed top-4 left-4 z-30">
        <button
          onClick={() => router.back()}
          className="bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-md"
        >
          <ArrowLeft size={20} className="text-ocean-700" />
        </button>
      </div>

      {/* Hero image */}
      <div className="relative h-64 bg-gradient-to-br from-ocean-300 to-ocean-600 overflow-hidden">
        {building.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={building.imageUrl}
            alt={building.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl">🏛️</div>
        )}

        {/* Discovered badge */}
        {discovered && (
          <div className="absolute top-4 right-4 bg-ocean-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
            <Check size={12} strokeWidth={3} />
            Odkryto!
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </div>

      {/* Content */}
      <div className="px-4 -mt-6 relative z-10">
        {/* Category + name */}
        <span className={clsx('text-xs font-semibold px-2.5 py-1 rounded-full', cat.color)}>
          {cat.label}
        </span>
        <h1 className="text-2xl font-extrabold text-ocean-900 mt-2 leading-tight">{building.name}</h1>

        {building.address && (
          <p className="flex items-center gap-1.5 text-gray-400 text-sm mt-1">
            <MapPin size={14} />
            {building.address}
          </p>
        )}

        {/* Description */}
        <div className="bg-white rounded-3xl p-5 mt-4 shadow-card">
          <p className="text-gray-600 text-sm leading-relaxed">{building.description}</p>
        </div>

        {/* Gallery */}
        {building.images.length > 0 && (
          <div className="mt-4">
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
              {building.images.map((img) => (
                <div
                  key={img.id}
                  className="shrink-0 w-64 h-44 rounded-2xl overflow-hidden shadow-card snap-start"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={building.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Map */}
        <div className="mt-4 rounded-3xl overflow-hidden shadow-card">
          <MapComponent
            buildings={mapBuildings}
            center={[building.lat, building.lng]}
            zoom={15}
            height="240px"
          />
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">
          ⚓ – aktualne miejsce · · · najbliższe budynki
        </p>

        {/* Nearby buildings */}
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
                        <img src={n.imageUrl} alt={n.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">🏠</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ocean-900 text-sm truncate">{n.name}</p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        {n.distanceKm < 1
                          ? `${Math.round(n.distanceKm * 1000)} m`
                          : `${n.distanceKm.toFixed(1)} km`} stąd
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

      {/* Toast – new achievements */}
      {newAchievements.length > 0 && (
        <div className="fixed top-32 inset-x-4 z-50 bg-sand-500 text-white px-5 py-4 rounded-3xl shadow-xl flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <div>
            <p className="font-bold text-sm">Nowa odznaka!</p>
            <p className="text-sand-100 text-xs">{newAchievements.join(', ')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
