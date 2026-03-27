'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { QrCode, MapPin, ChevronDown, ExternalLink, Navigation, Crosshair } from 'lucide-react';
import type { MapBuilding, MapHandle } from '@/components/MapComponent';
import { useAuth } from '@/lib/useAuth';

const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false });

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
  hidden: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  checza:    '🛖 Chëcza',
  zagroda:   '🏡 Zagroda',
  karczma:   '🍺 Karczma',
  pensjonat: '🏨 Pensjonat',
  sakralny:  '⛪ Sakralny',
  natura:    '🌲 Natura',
  morze:     '🐟 Morze',
  historia:  '🏛️ Historia',
};

function getUserId(): string {
  let id = localStorage.getItem('karwia_user_id');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('karwia_user_id', id); }
  return id;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function MapPage() {
  const [buildings, setBuildings]         = useState<Building[]>([]);
  const [discoveredIds, setDiscoveredIds] = useState<Set<number>>(new Set());
  const [selected, setSelected]           = useState<Building | null>(null);
  const [sheetOpen, setSheetOpen]         = useState(false);
  const [nearestToast, setNearestToast]   = useState('');
  const [nearestLoading, setNearestLoading] = useState(false);
  const sheetRef       = useRef<HTMLDivElement>(null);
  const mapHandle      = useRef<MapHandle | null>(null);
  const userPosRef     = useRef<[number, number] | null>(null);
  const geoWatchIdRef  = useRef<number | null>(null);
  const router         = useRouter();
  const { user }       = useAuth();

  // Clean up GPS watch when component unmounts
  useEffect(() => {
    return () => {
      if (geoWatchIdRef.current !== null) {
        navigator.geolocation?.clearWatch(geoWatchIdRef.current);
      }
    };
  }, []);

  const load = useCallback(async () => {
    const userId = getUserId();
    const [bRes, dRes] = await Promise.all([
      fetch('/api/budynki'),
      fetch(`/api/odkrycia?userId=${userId}`),
    ]);
    const allBuildings: Building[] = bRes.ok ? await bRes.json() : [];
    const discoveries = dRes.ok ? await dRes.json() : [];
    setBuildings(allBuildings);
    setDiscoveredIds(new Set(discoveries.map((d: { building: { id: number } }) => d.building.id)));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleBuildingClick = useCallback((id: number) => {
    const b = buildings.find((x) => x.id === id);
    if (!b) return;
    setSelected(b);
    setSheetOpen(true);
  }, [buildings]);

  const closeSheet = () => setSheetOpen(false);

  const handleBackdrop = (e: React.MouseEvent) => {
    if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
      closeSheet();
    }
  };

  // ── Center on user ────────────────────────────────────────────────────────
  // watchPosition is called DIRECTLY inside the onClick handler so iOS Safari
  // treats it as a user gesture and shows the location-permission dialog.
  // Any indirection through refs or async chains breaks this on iOS 13+.
  const handleCenterOnUser = () => {
    if (!navigator.geolocation) return;

    // Start watching if not already (direct call = iOS user-gesture context)
    if (geoWatchIdRef.current === null) {
      const avatarUrl = user?.avatarUrl ?? null;
      geoWatchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          userPosRef.current = [latitude, longitude];
          mapHandle.current?.updateUserMarker(latitude, longitude, avatarUrl);
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
      );
    }

    // Pan to last known position instantly; first-fix centering handled in MapComponent
    if (userPosRef.current) {
      mapHandle.current?.panTo(userPosRef.current[0], userPosRef.current[1], 17);
    }
  };

  // ── Nearest building — uses cached position, no GPS cold-start ───────────
  const handleNearest = () => {
    if (buildings.length === 0) return;

    const doFind = (latitude: number, longitude: number) => {
      const pool = buildings.filter((b) => !discoveredIds.has(b.id));
      const candidates = pool.length > 0 ? pool : buildings;

      let nearest = candidates[0];
      let minDist = haversineKm(latitude, longitude, nearest.lat, nearest.lng);
      candidates.forEach((b) => {
        const d = haversineKm(latitude, longitude, b.lat, b.lng);
        if (d < minDist) { minDist = d; nearest = b; }
      });

      mapHandle.current?.panTo(nearest.lat, nearest.lng, 19);
      setSelected(nearest);
      setSheetOpen(true);
      setNearestLoading(false);

      const distLabel = minDist < 1
        ? `${Math.round(minDist * 1000)} m`
        : `${minDist.toFixed(1)} km`;
      setNearestToast(
        pool.length === 0
          ? `📍 ${nearest.name} – ${distLabel} stąd (wszystkie odkryte!)`
          : `🔍 Najbliższy nieodkryty – ${distLabel} stąd`,
      );
      setTimeout(() => setNearestToast(''), 4000);
    };

    // If we already have a cached position — instant
    if (userPosRef.current) {
      doFind(userPosRef.current[0], userPosRef.current[1]);
      return;
    }

    if (!navigator.geolocation) {
      setNearestToast('Twoja przeglądarka nie obsługuje GPS');
      setTimeout(() => setNearestToast(''), 3000);
      return;
    }

    setNearestLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        userPosRef.current = [latitude, longitude];
        doFind(latitude, longitude);
      },
      () => {
        setNearestLoading(false);
        setNearestToast('Nie udało się pobrać lokalizacji — sprawdź uprawnienia GPS');
        setTimeout(() => setNearestToast(''), 4000);
      },
      { timeout: 10000, maximumAge: 0, enableHighAccuracy: true },
    );
  };

  const mapBuildings: MapBuilding[] = buildings
    .filter((b) => !b.hidden || discoveredIds.has(b.id))
    .map((b) => ({
      id: b.id, name: b.name, lat: b.lat, lng: b.lng,
      discovered: discoveredIds.has(b.id),
      imageUrl: b.imageUrl, outlineImageUrl: b.outlineImageUrl,
    }));

  const isDiscovered = selected ? discoveredIds.has(selected.id) : false;

  return (
    <div className="relative h-full overflow-hidden">
      {/* Full-screen map */}
      <MapComponent
        buildings={mapBuildings}
        height="100%"
        zoom={19}
        showUserLocation
        userAvatarUrl={user?.avatarUrl}
        onBuildingClick={handleBuildingClick}
        onMapReady={(h) => { mapHandle.current = h; }}
      />

      {/* Stats pill */}
      {buildings.length > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-md flex items-center gap-2">
          <MapPin size={13} className="text-ocean-500" />
          <span className="text-xs font-bold text-ocean-900">
            {discoveredIds.size} / {buildings.length} odkrytych
          </span>
        </div>
      )}

      {/* ── Map controls — inline row ── */}
      <div className="absolute bottom-24 right-4 z-[500] flex flex-row items-center gap-2">
        {/* Nearest undiscovered building */}
        <button
          onClick={handleNearest}
          disabled={nearestLoading || buildings.length === 0}
          className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg px-3.5 py-3 flex items-center gap-2 hover:bg-white active:scale-95 transition-all disabled:opacity-50"
          title="Najbliższy nieodkryty obiekt"
        >
          <Navigation size={18} className={`text-ocean-500 ${nearestLoading ? 'animate-pulse' : ''}`} />
          <span className="text-xs font-bold text-ocean-800 leading-none">Najbliżej</span>
        </button>

        {/* Center on user — small square pill */}
        <button
          onClick={handleCenterOnUser}
          className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-3 flex items-center justify-center hover:bg-white active:scale-95 transition-all"
          title="Moja lokalizacja"
        >
          <Crosshair size={18} className="text-ocean-500" />
        </button>
      </div>

      {/* Nearest toast */}
      {nearestToast && (
        <div className="absolute top-16 inset-x-4 z-[550] bg-ocean-700 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl animate-in slide-in-from-top-4">
          {nearestToast}
        </div>
      )}

      {/* Bottom sheet backdrop */}
      {sheetOpen && (
        <div className="absolute inset-0 z-[600]" onClick={handleBackdrop}>
          <div
            ref={sheetRef}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl"
            style={{ animation: 'slideUp 0.25s ease-out' }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {selected && (
              <div className="px-5 pb-6">
                {/* Photo + info row */}
                <div className="flex gap-4 items-start mb-4">
                  {(isDiscovered ? selected.imageUrl : selected.outlineImageUrl ?? selected.imageUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={(isDiscovered ? selected.imageUrl : selected.outlineImageUrl ?? selected.imageUrl) ?? ''}
                      alt={selected.name}
                      className={`w-20 h-20 rounded-2xl object-cover shrink-0 ${!isDiscovered ? 'grayscale opacity-60' : ''}`}
                    />
                  ) : (
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl shrink-0 ${isDiscovered ? 'bg-ocean-100' : 'bg-gray-100'}`}>
                      {isDiscovered ? '📍' : '❓'}
                    </div>
                  )}

                  <div className="flex-1 min-w-0 pt-1">
                    <span className="text-xs font-semibold text-ocean-500 bg-ocean-50 px-2 py-0.5 rounded-full">
                      {CATEGORY_LABELS[selected.category] ?? selected.category}
                    </span>
                    <h2 className="text-base font-extrabold text-ocean-900 mt-1 leading-tight">
                      {isDiscovered ? selected.name : '???'}
                    </h2>
                    {selected.address && isDiscovered && (
                      <p className="text-gray-400 text-xs mt-0.5 truncate">{selected.address}</p>
                    )}
                  </div>
                </div>

                <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3">
                  {isDiscovered
                    ? selected.description
                    : '🔍 Znajdź ten obiekt w Karwi i zeskanuj kod QR, by go odkryć!'}
                </p>

                <div className="flex gap-3">
                  {isDiscovered ? (
                    <button
                      onClick={() => { closeSheet(); router.push(`/budynek/${selected.id}`); }}
                      className="flex-1 flex items-center justify-center gap-2 bg-ocean-500 text-white py-3 rounded-2xl font-bold text-sm"
                    >
                      <ExternalLink size={16} />
                      Zobacz szczegóły
                    </button>
                  ) : (
                    <button
                      onClick={() => { closeSheet(); router.push('/skanuj'); }}
                      className="flex-1 flex items-center justify-center gap-2 bg-ocean-500 text-white py-3 rounded-2xl font-bold text-sm"
                    >
                      <QrCode size={16} />
                      Skanuj kod QR
                    </button>
                  )}
                  <button
                    onClick={closeSheet}
                    className="w-12 flex items-center justify-center bg-gray-100 rounded-2xl text-gray-400"
                  >
                    <ChevronDown size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
