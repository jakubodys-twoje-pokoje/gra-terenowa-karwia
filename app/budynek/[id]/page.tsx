import { Suspense } from 'react';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import BudynekPageClient from './BudynekPageClient';

export async function generateMetadata(
  { params }: { params: { id: string } },
): Promise<Metadata> {
  const building = await prisma.building.findUnique({
    where: { id: Number(params.id) },
    select: { name: true, description: true },
  });

  if (!building) return {};

  const title       = `Właśnie odkryłem ${building.name}! Dołącz do gry w Karwii 🗺️`;
  const description = (building.description ?? '').slice(0, 160)
    || 'Odkrywaj Karwię, skanuj kody QR przy budynkach i zdobywaj odznaki odkrywcy!';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type:     'website',
      siteName: 'Odkrywca Karwii',
      locale:   'pl_PL',
    },
    twitter: {
      card:        'summary_large_image',
      title,
      description,
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
