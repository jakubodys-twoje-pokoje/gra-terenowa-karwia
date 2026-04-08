import Link from 'next/link';
import { MapPin, Check, Lock } from 'lucide-react';
import clsx from 'clsx';

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  checza:    { label: '🛖 Chëcza',    color: 'bg-amber-100 text-amber-800' },
  zagroda:   { label: '🏡 Zagroda',   color: 'bg-yellow-100 text-yellow-800' },
  karczma:   { label: '🍺 Karczma',   color: 'bg-orange-100 text-orange-700' },
  pensjonat: { label: '🛏️ Pensjonat', color: 'bg-purple-100 text-purple-700' },
  sakralny:  { label: '⛪ Sakralny',  color: 'bg-blue-100 text-blue-700' },
  natura:    { label: '🌲 Natura',    color: 'bg-green-100 text-green-700' },
  morze:     { label: '🐟 Morze',     color: 'bg-cyan-100 text-cyan-700' },
  historia:  { label: '🏛️ Historia',  color: 'bg-stone-100 text-stone-700' },
};

interface Props {
  id: number;
  number?: number | null;
  name: string;
  description: string;
  imageUrl?: string | null;
  outlineImageUrl?: string | null;
  category: string;
  discovered?: boolean;
  discoveredAt?: string;
  showLink?: boolean;
}

export default function BuildingCard({
  id, number, name, description, imageUrl, outlineImageUrl, category, discovered, discoveredAt, showLink = true,
}: Props) {
  const cat = CATEGORY_LABELS[category] ?? { label: category, color: 'bg-gray-100 text-gray-600' };
  const undiscoveredSrc = outlineImageUrl ?? imageUrl;

  const card = (
    <div
      className={clsx(
        'relative bg-white rounded-3xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-200',
        discovered && 'ring-2 ring-ocean-400'
      )}
    >
      {/* Image */}
      <div className="relative h-40 bg-gradient-to-br from-ocean-200 to-ocean-400 overflow-hidden">
        {discovered ? (
          imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">🏠</div>
          )
        ) : undiscoveredSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={undiscoveredSrc} alt="" className="w-full h-full object-cover grayscale" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gray-100">
            <Lock size={32} className="text-gray-400" />
            <span className="text-xs text-gray-400 font-semibold">Nieodkryte</span>
          </div>
        )}
        {discovered && (
          <div className="absolute top-3 right-3 bg-ocean-500 text-white rounded-full p-1.5 shadow-md">
            <Check size={14} strokeWidth={3} />
          </div>
        )}
        {discovered && <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-white to-transparent" />}
      </div>

      {/* Content */}
      <div className="p-4 pt-2">
        <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full', cat.color)}>
          {cat.label}
        </span>
        <h3 className="font-bold text-ocean-800 mt-2 leading-snug line-clamp-1">
          {number != null ? `${number}. ${name}` : name}
        </h3>
        {discovered ? (
          <p className="text-gray-500 text-sm mt-1 line-clamp-2">{description.replace(/<[^>]*>/g, '').trim()}</p>
        ) : (
          <p className="text-gray-400 text-sm mt-1 italic">
            🔍 Znajdź to miejsce i zeskanuj kod QR, by je odkryć.
          </p>
        )}
        {discoveredAt && discovered && (
          <p className="text-ocean-400 text-xs mt-2 flex items-center gap-1">
            <MapPin size={12} />
            Odkryto {new Date(discoveredAt).toLocaleDateString('pl-PL')}
          </p>
        )}
      </div>
    </div>
  );

  if (!showLink) return card;

  return (
    <Link href={`/budynek/${id}`} className="block">
      {card}
    </Link>
  );
}
