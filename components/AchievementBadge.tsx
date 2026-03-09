import clsx from 'clsx';

interface Props {
  icon: string;
  name: string;
  description: string;
  color: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export default function AchievementBadge({ icon, name, description, color, unlocked, unlockedAt }: Props) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center p-4 rounded-3xl border-2 transition-all duration-300',
        unlocked
          ? 'bg-white border-transparent shadow-card'
          : 'bg-gray-50 border-dashed border-gray-200 opacity-60 grayscale'
      )}
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3 shadow-inner"
        style={{ background: unlocked ? `${color}22` : '#e5e7eb' }}
      >
        <span className={clsx(!unlocked && 'opacity-30')}>{icon}</span>
      </div>
      <h3
        className="font-bold text-center text-sm leading-tight"
        style={{ color: unlocked ? color : '#9ca3af' }}
      >
        {name}
      </h3>
      <p className="text-gray-400 text-xs text-center mt-1 leading-snug">{description}</p>
      {unlocked && unlockedAt && (
        <p className="text-ocean-400 text-xs mt-2">
          {new Date(unlockedAt).toLocaleDateString('pl-PL')}
        </p>
      )}
      {!unlocked && (
        <p className="text-gray-400 text-xs mt-2">🔒 Zablokowana</p>
      )}
    </div>
  );
}
