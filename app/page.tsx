'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { QrCode, MapPin, ChevronDown, ExternalLink } from 'lucide-react';
import type { MapBuilding } from '@/components/MapComponent';

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
}

const CATEGORY_LABELS: Record<string, string> = {
  beach: '🏖️ Plaża',
  landmark: '🏛️ Zabytek',
  food: '🐟 Jedzenie',
  hotel: '🏨 Nocleg',
  attraction: '⭐ Atrakcja',
  nature: '🌿 Natura',
};

function getUserId(): string {
  let id = localStorage.getItem('karwia_user_id');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('karwia_user_id', id); }
  return id;
}

export default function MapPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [discoveredIds, setDiscoveredIds] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<Building | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  // Close sheet on backdrop tap
  const handleBackdrop = (e: React.MouseEvent) => {
    if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
      closeSheet();
    }
  };

  const mapBuildings: MapBuilding[] = buildings.map((b) => ({
    id: b.id,
    name: b.name,
    lat: b.lat,
    lng: b.lng,
    discovered: discoveredIds.has(b.id),
    imageUrl: b.imageUrl,
    outlineImageUrl: b.outlineImageUrl,
  }));

  const isDiscovered = selected ? discoveredIds.has(selected.id) : false;

  return (
    <div className="relative h-full overflow-hidden">
      {/* Full-screen map */}
      <MapComponent
        buildings={mapBuildings}
        height="100%"
        zoom={15}
        showUserLocation
        onBuildingClick={handleBuildingClick}
      />

      {/* Floating scan button */}
      <button
        onClick={() => router.push('/skanuj')}
        className="absolute bottom-4 right-4 z-[500] w-14 h-14 bg-ocean-500 text-white rounded-full shadow-lg shadow-ocean-500/40 flex items-center justify-center active:bg-ocean-600 transition-colors"
        aria-label="Skanuj kod QR"
      >
        <QrCode size={24} />
      </button>

      {/* Stats pill */}
      {buildings.length > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-md flex items-center gap-2">
          <MapPin size={13} className="text-ocean-500" />
          <span className="text-xs font-bold text-ocean-900">
            {discoveredIds.size} / {buildings.length} odkrytych
          </span>
        </div>
      )}

      {/* Bottom sheet backdrop */}
      {sheetOpen && (
        <div
          className="absolute inset-0 z-[600]"
          onClick={handleBackdrop}
        >
          {/* Bottom sheet */}
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

                {/* Description / hint */}
                <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3">
                  {isDiscovered
                    ? selected.description
                    : '🔍 Znajdź ten obiekt w Karwi i zeskanuj kod QR, by go odkryć!'}
                </p>

                {/* Actions */}
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
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
