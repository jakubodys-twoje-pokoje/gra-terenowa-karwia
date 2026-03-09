import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const buildings = [
  {
    name: 'Plaża Główna w Karwi',
    description:
      'Piaszczysta plaża ciągnąca się wzdłuż wybrzeża Bałtyku. Karwia słynie z szerokiej, czystej plaży z białym piaskiem i wspaniałymi zachodami słońca. Idealne miejsce na długie spacery i kąpiele w morzu.',
    address: 'ul. Morska, Karwia',
    lat: 54.7516,
    lng: 17.8685,
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    qrUrl: 'https://karwia.pl/qr/plaza-glowna',
    category: 'beach',
  },
  {
    name: 'Wejście na Plażę – Promenada',
    description:
      'Główne wejście na plażę z drewnianą promenadą. Tu zaczyna się większość plażowych przygód w Karwi. Tutejszy deptak to ulubione miejsce spacerów mieszkańców i turystów o każdej porze dnia.',
    address: 'Promenada Nadmorska, Karwia',
    lat: 54.7509,
    lng: 17.8670,
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    qrUrl: 'https://karwia.pl/qr/promenada',
    category: 'beach',
  },
  {
    name: 'Kościół pw. Matki Bożej Częstochowskiej',
    description:
      'Parafia w Karwi – serce lokalnej społeczności. Kościół jest chlubą mieszkańców i ważnym centrum życia religijnego na Kaszubach Nadmorskich. Jego wieża jest widoczna z daleka i stanowi punkt orientacyjny dla turystów.',
    address: 'ul. Kościelna 1, Karwia',
    lat: 54.7478,
    lng: 17.8625,
    imageUrl: 'https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=800',
    qrUrl: 'https://karwia.pl/qr/kosciol',
    category: 'landmark',
  },
  {
    name: 'Latarnia Morska Karwia',
    description:
      'Malownicza latarnia morska na klifie nad Bałtykiem. Od lat strzeże morskich szlaków. Z jej okolic rozciąga się przepiękny widok na morze i okoliczne klify. Miejsce obowiązkowe dla każdego turysty odwiedzającego Karwię.',
    address: 'Klif Karwia, Karwia',
    lat: 54.7535,
    lng: 17.8720,
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    qrUrl: 'https://karwia.pl/qr/latarnia',
    category: 'landmark',
  },
  {
    name: 'Centrum Informacji Turystycznej',
    description:
      'Tu dowiesz się wszystkiego o Karwi i okolicach! Centrum oferuje mapy, przewodniki i informacje o atrakcjach. Przyjaźni pracownicy pomogą zaplanować idealny wypoczynek na Kaszubach.',
    address: 'ul. Morska 10, Karwia',
    lat: 54.7490,
    lng: 17.8650,
    imageUrl: 'https://images.unsplash.com/photo-1553034197-0bbd73c7e9e2?w=800',
    qrUrl: 'https://karwia.pl/qr/cit',
    category: 'attraction',
  },
  {
    name: 'Port i Przystań Rybacka',
    description:
      'Urokliwy port rybacki, gdzie codziennie rano cumują łodzie wracające z połowów. Można tu obserwować pracę rybaków, a nawet kupić świeże ryby prosto z łodzi. To tu bije serce kaszubskiej tradycji morskiej.',
    address: 'Port Rybacki, Karwia',
    lat: 54.7528,
    lng: 17.8740,
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
    qrUrl: 'https://karwia.pl/qr/port',
    category: 'landmark',
  },
  {
    name: 'Restauracja Rybakówka',
    description:
      'Najlepsza restauracja rybna w Karwi! Serwuje świeże ryby prosto z Bałtyku. Specjalność zakładu to smażona flądra po kaszubsku i zupa rybna. Idealne miejsce na obiad po długim spacerze po plaży.',
    address: 'ul. Portowa 5, Karwia',
    lat: 54.7522,
    lng: 17.8695,
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
    qrUrl: 'https://karwia.pl/qr/rybakówka',
    category: 'food',
  },
  {
    name: 'Park Nadmorski',
    description:
      'Zielona oaza spokoju tuż przy plaży. Park jest idealnym miejscem na rodzinne pikniki, zabawy dzieci i odpoczynek w cieniu drzew. Latem odbywają się tu koncerty i imprezy kulturalne.',
    address: 'ul. Parkowa, Karwia',
    lat: 54.7498,
    lng: 17.8660,
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
    qrUrl: 'https://karwia.pl/qr/park',
    category: 'nature',
  },
  {
    name: 'Klif Karwiński',
    description:
      'Imponujący klif nad Bałtykiem – jeden z najpiękniejszych na polskim wybrzeżu. Wznosi się do 20 metrów nad poziomem morza. Z klifu rozciąga się zapierający dech widok na morze i plażę. Miejsce szczególnie malownicze o zachodzie słońca.',
    address: 'Klif, Karwia',
    lat: 54.7542,
    lng: 17.8755,
    imageUrl: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800',
    qrUrl: 'https://karwia.pl/qr/klif',
    category: 'nature',
  },
  {
    name: 'Sklep z Bursztynami',
    description:
      'Prawdziwy skarb Bałtyku w jednym miejscu! Karwia leży na trasie bursztynowego szlaku. W tym sklepie znajdziesz autentyczne bursztyny bałtyckie – od surowych kamieni po piękną biżuterię. Doskonała pamiątka z wakacji.',
    address: 'ul. Morska 23, Karwia',
    lat: 54.7486,
    lng: 17.8640,
    imageUrl: 'https://images.unsplash.com/photo-1515686360-b074b6ae18ea?w=800',
    qrUrl: 'https://karwia.pl/qr/bursztyny',
    category: 'attraction',
  },
];

async function main() {
  console.log('🌊 Seeding database with Karwia buildings...');

  for (const building of buildings) {
    const b = await prisma.building.upsert({
      where: { qrUrl: building.qrUrl },
      update: building,
      create: building,
    });
    console.log(`  ✓ ${b.name}`);
  }

  console.log(`\n✅ Seeded ${buildings.length} buildings successfully!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
