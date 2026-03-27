export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  condition: (discovered: number, total: number, categories?: string[]) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_step',
    name: 'Pierwszy krok',
    description: 'Zeskanuj swój pierwszy budynek w Karwi',
    icon: '👣',
    color: '#2A8EC9',
    condition: (d) => d >= 1,
  },
  {
    id: 'explorer_3',
    name: 'Odkrywca',
    description: 'Odkryj 3 miejsca w Karwi',
    icon: '🔭',
    color: '#0F5F92',
    condition: (d) => d >= 3,
  },
  {
    id: 'adventurer_5',
    name: 'Poszukiwacz przygód',
    description: 'Odwiedź 5 różnych miejsc',
    icon: '🗺️',
    color: '#F0A500',
    condition: (d) => d >= 5,
  },
  {
    id: 'expert_7',
    name: 'Znawca Karwi',
    description: 'Odkryj 7 miejsc i stań się prawdziwym znawcą',
    icon: '⭐',
    color: '#F0A500',
    condition: (d) => d >= 7,
  },
  {
    id: 'master',
    name: 'Mistrz Karwi',
    description: 'Odkryj wszystkie miejsca w Karwi!',
    icon: '👑',
    color: '#C27D00',
    condition: (d, total) => d >= total && total > 0,
  },
  {
    id: 'sea_lover',
    name: 'Człowiek morza',
    description: 'Odkryj 2 miejsca związane z morzem',
    icon: '🐟',
    color: '#06B6D4',
    condition: (_d, _t, cats) =>
      (cats ?? []).filter((c) => c === 'morze').length >= 2,
  },
  {
    id: 'nature_fan',
    name: 'Leśny duch',
    description: 'Odkryj obiekty związane z naturą w Karwi',
    icon: '🌲',
    color: '#2D6A4F',
    condition: (_d, _t, cats) =>
      (cats ?? []).filter((c) => c === 'natura').length >= 1,
  },
  {
    id: 'tavern_goer',
    name: 'Stały bywalec',
    description: 'Odwiedź karczmę lub gospodę w Karwi',
    icon: '🍺',
    color: '#F97316',
    condition: (_d, _t, cats) =>
      (cats ?? []).filter((c) => c === 'karczma').length >= 1,
  },
];

export function getUnlockedAchievements(
  discoveredCount: number,
  totalBuildings: number,
  discoveredCategories: string[]
) {
  return ACHIEVEMENTS.filter((a) =>
    a.condition(discoveredCount, totalBuildings, discoveredCategories)
  );
}
