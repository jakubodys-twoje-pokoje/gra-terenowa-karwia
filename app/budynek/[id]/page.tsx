import { Suspense } from 'react';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import BudynekPageClient from './BudynekPageClient';

export async function generateMetadata(
  { params }: { params: { id: string } },
): Promise<Metadata> {
  const building = await prisma.building.findUnique({
    where: { id: Number(params.id) },
    select: { name: true, description: true, imageUrl: true },
  });

  if (!building) return {};

  const title       = `Właśnie odkryłem ${building.name}! Dołącz do gry w Karwi 🗺️`;
  const description = (building.description ?? '').slice(0, 160)
    || 'Odkrywaj Karwię, skanuj kody QR przy budynkach i zdobywaj odznaki odkrywcy!';

  // Use the building's own image — metadataBase in layout.tsx resolves relative URLs
  const images = building.imageUrl
    ? [{ url: building.imageUrl, width: 1200, height: 630, alt: building.name }]
    : [{ url: '/icons/icon-512.png', width: 512, height: 512, alt: 'Odkrywca Karwi' }];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type:     'website',
      siteName: 'Odkrywca Karwi',
      locale:   'pl_PL',
      images,
    },
    twitter: {
      card:        'summary_large_image',
      title,
      description,
      images:      images.map((i) => i.url),
    },
  };
}

export default function Page() {
  return (
    <Suspense>
      <BudynekPageClient />
    </Suspense>
  );
}
