'use client';

import { useEffect, useState, useCallback } from 'react';
import { BookOpen } from 'lucide-react';
import BuildingCard from '@/components/BuildingCard';

interface Building {
  id: number;
  name: string;
  description: string;
  imageUrl: string | null;
  category: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  beach:      '🏖️ Plaża',
  landmark:   '🏛️ Zabytki',
  food:       '🐟 Jedzenie',
  hotel:      '🏨 Noclegi',
  attraction: '⭐ Atrakcje',
  nature:     '🌿 Natura',
};

type Filter = 'all' | 'discovered' | 'undiscovered';

function getUserId(): string {
  let id = localStorage.getItem('karwia_user_id');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('karwia_user_id', id); }
  return id;
}

export default function BazaPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [discoveredIds, setDiscoveredIds] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const userId = getUserId();
    const [bRes, dRes] = await Promise.all([
      fetch('/api/budynki'),
      fetch(`/api/odkrycia?userId=${userId}`),
    ]);
    const all: Building[] = bRes.ok ? await bRes.json() : [];
    const discoveries = dRes.ok ? await dRes.json() : [];
    setBuildings(all);
    setDiscoveredIds(new Set(discoveries.map((d: { building: { id: number } }) => d.building.id)));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = buildings.filter((b) => {
    if (filter === 'discovered') return discoveredIds.has(b.id);
    if (filter === 'undiscovered') return !discoveredIds.has(b.id);
    return true;
  });

  const grouped = filtered.reduce<Record<string, Building[]>>((acc, b) => {
    if (!acc[b.category]) acc[b.category] = [];
    acc[b.category].push(b);
    return acc;
  }, {});

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl bg-cyan-100 flex items-center justify-center">
          <BookOpen size={22} className="text-cyan-600" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-ocean-900">Baza Budynków</h1>
          <p className="text-gray-500 text-xs">
            {loading ? '…' : `${discoveredIds.size} / ${buildings.length} odkrytych`}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex bg-gray-100 rounded-2xl p-1 mb-5 gap-1 mt-4">
        {([['all', 'Wszystkie'], ['discovered', 'Odkryte'], ['undiscovered', 'Nieodkryte']] as [Filter, string][]).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === val ? 'bg-white text-ocean-600 shadow-sm' : 'text-gray-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-3 border-ocean-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">
            {filter === 'discovered' ? '🗺️' : filter === 'undiscovered' ? '🎉' : '🏗️'}
          </div>
          <p>
            {filter === 'discovered' ? 'Nie masz jeszcze odkryć.' : filter === 'undiscovered' ? 'Odkryłeś wszystkie miejsca!' : 'Baza jest pusta. Wróć wkrótce!'}
          </p>
        </div>
      )}

      {!loading && Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-ocean-500 mb-3">
            {CATEGORY_LABELS[category] ?? category}
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {items.map((b) => (
              <BuildingCard
                key={b.id}
                id={b.id}
                name={b.name}
                description={b.description}
                imageUrl={b.imageUrl}
                category={b.category}
                discovered={discoveredIds.has(b.id)}
                showLink
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
