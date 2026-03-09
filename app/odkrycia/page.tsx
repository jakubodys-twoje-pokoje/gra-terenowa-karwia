'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Compass, QrCode } from 'lucide-react';
import Link from 'next/link';
import BuildingCard from '@/components/BuildingCard';
import type { MapBuilding } from '@/components/MapComponent';

const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false });

interface Discovery {
  id: number;
  discoveredAt: string;
  building: {
    id: number;
    name: string;
    description: string;
    lat: number;
    lng: number;
    imageUrl: string | null;
    category: string;
    address: string | null;
  };
}

function getUserId(): string {
  let id = localStorage.getItem('karwia_user_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('karwia_user_id', id);
  }
  return id;
}

export default function OdkryciaPage() {
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const userId = getUserId();
    const res = await fetch(`/api/odkrycia?userId=${userId}`);
    if (res.ok) setDiscoveries(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const mapBuildings: MapBuilding[] = discoveries.map((d) => ({
    id: d.building.id,
    name: d.building.name,
    lat: d.building.lat,
    lng: d.building.lng,
    discovered: true,
  }));

  return (
    <div className="px-4 pt-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-ocean-100 flex items-center justify-center">
          <Compass size={22} className="text-ocean-500" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-ocean-900">Moje Odkrycia</h1>
          <p className="text-gray-500 text-xs">
            {loading ? '…' : `${discoveries.length} odkrytych miejsc`}
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-3 border-ocean-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && discoveries.length === 0 && (
        <div className="text-center py-16 px-4">
          <div className="text-6xl mb-4">🗺️</div>
          <h2 className="text-ocean-900 font-bold text-lg mb-2">Nic tu jeszcze nie ma!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Zacznij swoją przygodę – znajdź kod QR przy budynku w Karwi i go zeskanuj.
          </p>
          <Link href="/skanuj">
            <button className="inline-flex items-center gap-2 bg-ocean-500 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg shadow-ocean-500/30">
              <QrCode size={18} />
              Skanuj pierwszy kod QR
            </button>
          </Link>
        </div>
      )}

      {!loading && discoveries.length > 0 && (
        <>
          {/* Map of discovered places */}
          <div className="mb-5 rounded-3xl overflow-hidden shadow-card">
            <MapComponent
              buildings={mapBuildings}
              center={[54.7505, 17.8670]}
              zoom={14}
              height="220px"
            />
          </div>

          {/* List */}
          <div className="grid grid-cols-1 gap-4">
            {discoveries.map((d) => (
              <BuildingCard
                key={d.id}
                id={d.building.id}
                name={d.building.name}
                description={d.building.description}
                imageUrl={d.building.imageUrl}
                category={d.building.category}
                discovered
                discoveredAt={d.discoveredAt}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
