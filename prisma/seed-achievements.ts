import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: './prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

const achievements = [
  // ── Time-based ──────────────────────────────────────────────────────────────
  {
    name: 'Dobry początek',
    description: 'Ukończ grę odkrywając wszystkie budynki w ciągu jednego dnia',
    icon: '🎯', color: '#E67E22',
    conditionType: 'all_in_one_day', conditionValue: 1, conditionCategory: null, buildingIds: null, order: 100,
  },
  {
    name: 'Weekendowy odkrywca',
    description: 'Odwiedź punkty w 2 różne dni',
    icon: '📅', color: '#8E44AD',
    conditionType: 'days_active', conditionValue: 2, conditionCategory: null, buildingIds: null, order: 101,
  },
  {
    name: 'Wytrwały spacerowicz',
    description: 'Bądź aktywny przez 3 dni',
    icon: '🚶', color: '#8E44AD',
    conditionType: 'days_active', conditionValue: 3, conditionCategory: null, buildingIds: null, order: 102,
  },
  {
    name: 'Systematyczny eksplorator',
    description: 'Bądź aktywny przez 7 dni',
    icon: '🗺️', color: '#8E44AD',
    conditionType: 'days_active', conditionValue: 7, conditionCategory: null, buildingIds: null, order: 103,
  },
  {
    name: 'Powrót do Karwi',
    description: 'Wróć do gry po przerwie (7+ dni)',
    icon: '🔄', color: '#1A7F4B',
    conditionType: 'return_after_break', conditionValue: 1, conditionCategory: null, buildingIds: null, order: 104,
  },
  // ── Building-based ──────────────────────────────────────────────────────────
  {
    name: 'Kamień węgielny',
    description: 'Zeskanuj pierwszy murowany dom w Karwi (dom i karczma Wilhelma Senklera z 1880)',
    icon: '🧱', color: '#0F5F92',
    conditionType: 'building_set', conditionValue: 1,
    conditionCategory: null, buildingIds: JSON.stringify([43]), order: 10,
  },
  {
    name: 'Ocaleni z pożaru',
    description: 'Zeskanuj 3 budynki, które spłonęły lub zostały odbudowane po pożarze',
    icon: '🔥', color: '#C0392B',
    conditionType: 'building_set', conditionValue: 3,
    conditionCategory: null, buildingIds: JSON.stringify([15,25,49,66,69,11]), order: 20,
  },
  {
    name: 'Leśniczy',
    description: 'Zeskanuj zabudowania dawnej leśniczówki (Fersztereji)',
    icon: '🌲', color: '#1A7F4B',
    conditionType: 'building_set', conditionValue: 1,
    conditionCategory: null, buildingIds: JSON.stringify([41]), order: 30,
  },
  {
    name: 'Archeolog',
    description: 'Zeskanuj 3 budynki sprzed 1800 roku',
    icon: '⏳', color: '#7D6608',
    conditionType: 'building_set', conditionValue: 3,
    conditionCategory: null, buildingIds: JSON.stringify([45,31,57,54,40,52,49,55,46]), order: 40,
  },
  {
    name: 'Międzywojnie',
    description: 'Zeskanuj 10 budynków z dwudziestolecia międzywojennego (1918–1939)',
    icon: '🏗️', color: '#5D6D7E',
    conditionType: 'building_set', conditionValue: 10,
    conditionCategory: null, buildingIds: JSON.stringify([20,39,22,32,27,12,23,65,53,29,30,28,36,17,56,16,58,14,24,33,18,35,21,19,70,64,62,38,61,66,42]), order: 50,
  },
  {
    name: 'Duchy przeszłości',
    description: 'Zeskanuj 10 budynków, które już nie istnieją',
    icon: '👻', color: '#6C3483',
    conditionType: 'building_set', conditionValue: 10,
    conditionCategory: null, buildingIds: JSON.stringify([2,13,26,27,40,45,47,49,50,55,57,59,60,61,63,64,68,11,12,21,38,46,31]), order: 60,
  },
  {
    name: 'Dynastia Bizewskich',
    description: 'Zeskanuj wszystkie budynki związane z rodziną Bizewskich',
    icon: '📜', color: '#0F5F92',
    conditionType: 'building_set', conditionValue: 9,
    conditionCategory: null, buildingIds: JSON.stringify([11,12,21,38,46,49,50,51,53]), order: 70,
  },
  {
    name: 'Gbùrowie z Karwi',
    description: 'Zeskanuj wszystkie budynki rodziny Voelknerow zwanych Gburami',
    icon: '🐂', color: '#0F5F92',
    conditionType: 'building_set', conditionValue: 5,
    conditionCategory: null, buildingIds: JSON.stringify([32,25,58,62,63]), order: 80,
  },
  {
    name: 'Ślad Rettigów',
    description: 'Zeskanuj wszystkie budynki związane z rodziną Rettigów',
    icon: '⚓', color: '#0F5F92',
    conditionType: 'building_set', conditionValue: 5,
    conditionCategory: null, buildingIds: JSON.stringify([21,45,47,48,49]), order: 90,
  },
  {
    name: 'Letnik',
    description: 'Zeskanuj 3 pensjonaty',
    icon: '🏨', color: '#2A9D8F',
    conditionType: 'building_set', conditionValue: 3,
    conditionCategory: null, buildingIds: JSON.stringify([12,14,18,19,24,27,32,33,48]), order: 110,
  },
  {
    name: 'Tropiciel chëczy',
    description: 'Zeskanuj 5 starych chat kaszubskich (chëczy)',
    icon: '🛖', color: '#7D6608',
    conditionType: 'building_set', conditionValue: 5,
    conditionCategory: null, buildingIds: JSON.stringify([2,11,13,25,31,40,45,52,54,57,59,63,64,66,21,12,58,60,49]), order: 120,
  },
  {
    name: 'Gbùr',
    description: 'Zeskanuj 3 zagrody jednobudynkowe wzorowane na zabudowaniach z Karwieńskich Błot',
    icon: '🏠', color: '#7D6608',
    conditionType: 'building_set', conditionValue: 3,
    conditionCategory: null, buildingIds: JSON.stringify([46,49,51,55,68,69]), order: 130,
  },
  {
    name: 'Bywałec',
    description: 'Zeskanuj wszystkie dawne karczmy i gospody',
    icon: '🍺', color: '#F0A500',
    conditionType: 'building_set', conditionValue: 4,
    conditionCategory: null, buildingIds: JSON.stringify([43,46,47,52]), order: 140,
  },
  {
    name: 'Pilny uczeń',
    description: 'Zeskanuj starą szkołę z 1892 roku',
    icon: '🏫', color: '#0F5F92',
    conditionType: 'building_set', conditionValue: 1,
    conditionCategory: null, buildingIds: JSON.stringify([44]), order: 150,
  },
  {
    name: 'Pielgrzym',
    description: 'Zeskanuj kościół pw. św. Antoniego Padewskiego i kapliczki',
    icon: '⛪', color: '#0F5F92',
    conditionType: 'building_set', conditionValue: 3,
    conditionCategory: null, buildingIds: JSON.stringify([67,62,51]), order: 160,
  },
  {
    name: 'Rybak',
    description: 'Odkryj chatę rybacką lub budynek związany z morzem',
    icon: '🐟', color: '#2A9D8F',
    conditionType: 'building_set', conditionValue: 1,
    conditionCategory: null, buildingIds: JSON.stringify([42,31]), order: 170,
  },
];

async function main() {
  console.log('Deleting existing achievements…');
  await prisma.achievement.deleteMany({});

  console.log(`Inserting ${achievements.length} achievements…`);
  await prisma.achievement.createMany({ data: achievements });

  const count = await prisma.achievement.count();
  console.log(`Done. Total achievements in DB: ${count}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
