import { prisma } from '@/lib/db';
import BuildingCard from '@/components/BuildingCard';
import { BookOpen } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  beach:      '🏖️ Plaża',
  landmark:   '🏛️ Zabytki',
  food:       '🐟 Jedzenie',
  hotel:      '🏨 Noclegi',
  attraction: '⭐ Atrakcje',
  nature:     '🌿 Natura',
};

export const revalidate = 60;

export default async function BazaPage() {
  const buildings = await prisma.building.findMany({
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, description: true, imageUrl: true, category: true },
  });

  const grouped = buildings.reduce<Record<string, typeof buildings>>((acc, b) => {
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
          <p className="text-gray-500 text-xs">{buildings.length} miejsc do odkrycia</p>
        </div>
      </div>

      <p className="text-gray-400 text-xs mb-5">
        Zeskanuj kody QR przy budynkach, by odkryć ich lokalizację na mapie.
      </p>

      {Object.entries(grouped).map(([category, items]) => (
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
                showLink={true}
              />
            ))}
          </div>
        </div>
      ))}

      {buildings.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🏗️</div>
          <p>Baza jest jeszcze pusta. Wróć wkrótce!</p>
        </div>
      )}
    </div>
  );
}
