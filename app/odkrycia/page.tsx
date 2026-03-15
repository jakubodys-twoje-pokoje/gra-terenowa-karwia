'use client';

import { useEffect, useState, useCallback } from 'react';
import { Compass, Trophy, Medal, MapPin, Clock, Crown } from 'lucide-react';
import Link from 'next/link';
import AchievementBadge from '@/components/AchievementBadge';
import { ACHIEVEMENTS, getUnlockedAchievements } from '@/lib/achievements';

interface Discovery {
  discoveredAt: string;
  building: { id: number; category: string };
}

interface RankEntry {
  rank: number;
  userId: string;
  nickname: string | null;
  city: string | null;
  avatarUrl: string | null;
  discoveryCount: number;
  isCurrentUser: boolean;
}

function getUserId(): string {
  let id = localStorage.getItem('karwia_user_id');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('karwia_user_id', id); }
  return id;
}

function formatDuration(from: Date, to: Date) {
  const diffMs = to.getTime() - from.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return 'dziś';
  if (days === 1) return '1 dzień';
  if (days < 7) return `${days} dni`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return '1 tydzień';
  if (weeks < 4) return `${weeks} tygodnie`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 miesiąc' : `${months} miesięcy`;
}

function displayName(entry: RankEntry) {
  if (entry.nickname) return entry.nickname;
  return `Odkrywca #${entry.userId.slice(-4).toUpperCase()}`;
}

export default function OdkryciaPage() {
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [totalBuildings, setTotalBuildings] = useState(0);
  const [ranking, setRanking] = useState<RankEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<RankEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'odznaki' | 'ranking'>('stats');

  const load = useCallback(async () => {
    const userId = getUserId();
    const [discRes, allRes, rankRes] = await Promise.all([
      fetch(`/api/odkrycia?userId=${userId}`),
      fetch('/api/budynki'),
      fetch(`/api/ranking?userId=${userId}`),
    ]);
    const disc: Discovery[] = discRes.ok ? await discRes.json() : [];
    const all = allRes.ok ? await allRes.json() : [];
    const rankData = rankRes.ok ? await rankRes.json() : { ranking: [], currentUser: null };
    setDiscoveries(disc);
    setTotalBuildings(all.length);
    setRanking(rankData.ranking ?? []);
    setCurrentUser(rankData.currentUser ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const count = discoveries.length;
  const pct = totalBuildings > 0 ? Math.round((count / totalBuildings) * 100) : 0;
  const categories = discoveries.map((d) => d.building.category);
  const unlockedAchievements = getUnlockedAchievements(count, totalBuildings, categories);
  const unlockedIds = new Set(unlockedAchievements.map((a) => a.id));

  const firstDiscovery = discoveries.length > 0
    ? new Date(Math.min(...discoveries.map((d) => new Date(d.discoveredAt).getTime())))
    : null;
  const lastDiscovery = discoveries.length > 0
    ? new Date(Math.max(...discoveries.map((d) => new Date(d.discoveredAt).getTime())))
    : null;

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
            {loading ? '…' : `${count} z ${totalBuildings} miejsc`}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-2xl p-1 mb-5 gap-1">
        {(['stats', 'odznaki', 'ranking'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all capitalize ${
              activeTab === tab ? 'bg-white text-ocean-600 shadow-sm' : 'text-gray-400'
            }`}
          >
            {tab === 'stats' ? 'Statystyki' : tab === 'odznaki' ? 'Odznaki' : 'Ranking'}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-3 border-ocean-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* STATS TAB */}
      {!loading && activeTab === 'stats' && (
        <div className="space-y-4">
          {/* Progress */}
          <div className="bg-white rounded-3xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-gray-600 flex items-center gap-1.5">
                <MapPin size={14} className="text-ocean-500" />
                Odkryte miejsca
              </span>
              <span className="font-extrabold text-ocean-600">{count} / {totalBuildings}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden mb-1">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-ocean-400 to-ocean-600 transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 text-right">{pct}% ukończone</p>
          </div>

          {/* Badges progress */}
          <div className="bg-white rounded-3xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-gray-600 flex items-center gap-1.5">
                <Trophy size={14} className="text-sand-500" />
                Odznaki
              </span>
              <span className="font-extrabold text-sand-600">{unlockedIds.size} / {ACHIEVEMENTS.length}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-sand-400 to-sand-600 transition-all duration-700"
                style={{ width: `${ACHIEVEMENTS.length > 0 ? (unlockedIds.size / ACHIEVEMENTS.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Time stats */}
          {firstDiscovery && (
            <div className="bg-white rounded-3xl p-5 shadow-card">
              <h3 className="text-sm font-semibold text-gray-600 flex items-center gap-1.5 mb-3">
                <Clock size={14} className="text-ocean-400" />
                Czas przygody
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-ocean-50 rounded-2xl p-3 text-center">
                  <p className="text-xl font-extrabold text-ocean-700">
                    {formatDuration(firstDiscovery, lastDiscovery ?? new Date())}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">od pierwszego odkrycia</p>
                </div>
                <div className="bg-sand-50 rounded-2xl p-3 text-center">
                  <p className="text-xl font-extrabold text-sand-700">
                    {count > 0 && firstDiscovery
                      ? (count / Math.max(1, Math.ceil((Date.now() - firstDiscovery.getTime()) / (1000 * 60 * 60 * 24)))).toFixed(1)
                      : '—'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">odkryć / dzień</p>
                </div>
              </div>
            </div>
          )}

          {count === 0 && (
            <div className="text-center py-10 px-4">
              <div className="text-5xl mb-3">🗺️</div>
              <p className="text-ocean-900 font-bold mb-2">Zacznij eksplorować!</p>
              <p className="text-gray-400 text-sm mb-4">Znajdź kod QR przy budynku w Karwi i go zeskanuj.</p>
              <Link href="/skanuj">
                <button className="bg-ocean-500 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-ocean-500/30">
                  Skanuj pierwszy kod QR
                </button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ODZNAKI TAB */}
      {!loading && activeTab === 'odznaki' && (
        <div className="grid grid-cols-2 gap-3 pb-4">
          {ACHIEVEMENTS.map((a) => (
            <AchievementBadge
              key={a.id}
              icon={a.icon}
              name={a.name}
              description={a.description}
              color={a.color}
              unlocked={unlockedIds.has(a.id)}
            />
          ))}
        </div>
      )}

      {/* RANKING TAB */}
      {!loading && activeTab === 'ranking' && (
        <div className="pb-4 space-y-2">
          {/* Current user highlight (if not in top list) */}
          {currentUser && !ranking.some((r) => r.isCurrentUser) && (
            <div className="bg-ocean-50 border-2 border-ocean-200 rounded-2xl p-3 mb-4">
              <p className="text-xs text-ocean-500 font-semibold mb-1">Twoje miejsce</p>
              <div className="flex items-center gap-3">
                <span className="text-lg font-extrabold text-ocean-700 w-8 text-center">#{currentUser.rank}</span>
                <div className="flex-1">
                  <p className="font-bold text-ocean-900 text-sm">{displayName(currentUser)}</p>
                  {currentUser.city && <p className="text-xs text-gray-400">{currentUser.city}</p>}
                </div>
                <span className="text-sm font-extrabold text-ocean-600">{currentUser.discoveryCount} 📍</span>
              </div>
            </div>
          )}

          {ranking.length === 0 && (
            <div className="text-center py-10">
              <div className="text-4xl mb-2">🏆</div>
              <p className="text-gray-400 text-sm">Nikt jeszcze nie odkrył żadnego miejsca. Bądź pierwszy!</p>
            </div>
          )}

          {ranking.map((entry, i) => {
            const crown = i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
            return (
              <div
                key={entry.userId}
                className={`flex items-center gap-3 rounded-2xl p-3 ${
                  entry.isCurrentUser
                    ? 'bg-ocean-50 border-2 border-ocean-300'
                    : 'bg-white shadow-card'
                }`}
              >
                <div className="w-8 text-center">
                  {crown
                    ? <span className="text-lg">{crown}</span>
                    : <span className="text-sm font-bold text-gray-400">#{entry.rank}</span>
                  }
                </div>
                {entry.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={entry.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-ocean-100 flex items-center justify-center shrink-0">
                    <Medal size={16} className="text-ocean-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm truncate ${entry.isCurrentUser ? 'text-ocean-700' : 'text-ocean-900'}`}>
                    {displayName(entry)}
                    {entry.isCurrentUser && <span className="text-xs font-normal text-ocean-400 ml-1">(Ty)</span>}
                  </p>
                  {entry.city && <p className="text-xs text-gray-400 truncate">{entry.city}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-extrabold text-ocean-600 text-sm">{entry.discoveryCount}</p>
                  <p className="text-[10px] text-gray-400">odkryć</p>
                </div>
              </div>
            );
          })}

          {ranking.length > 0 && !currentUser && (
            <div className="text-center py-4 px-4 bg-gray-50 rounded-2xl mt-2">
              <Crown size={20} className="text-gray-300 mx-auto mb-1" />
              <p className="text-xs text-gray-400">
                Zeskanuj swoje pierwsze miejsce, by pojawić się w rankingu!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
