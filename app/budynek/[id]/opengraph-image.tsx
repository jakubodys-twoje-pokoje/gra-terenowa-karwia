import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/db';

export const runtime     = 'nodejs';
export const size        = { width: 1200, height: 630 };
export const contentType = 'image/png';

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://karwia.app';

export default async function Image({ params }: { params: { id: string } }) {
  const building = await prisma.building.findUnique({
    where: { id: Number(params.id) },
    select: { name: true, imageUrl: true },
  });

  // Resolve absolute image URL and fetch as base64 for ImageResponse
  let imgData: string | null = null;
  const rawUrl = building?.imageUrl;
  if (rawUrl) {
    const absoluteUrl = rawUrl.startsWith('http') ? rawUrl : `${BASE}${rawUrl}`;
    try {
      const res  = await fetch(absoluteUrl, { cache: 'force-cache' });
      const buf  = await res.arrayBuffer();
      const mime = res.headers.get('content-type') ?? 'image/jpeg';
      imgData = `data:${mime};base64,${Buffer.from(buf).toString('base64')}`;
    } catch { /* no image — use gradient only */ }
  }

  const name = building?.name ?? 'to miejsce';

  return new ImageResponse(
    (
      <div
        style={{
          display:         'flex',
          width:           '100%',
          height:          '100%',
          position:        'relative',
          backgroundColor: '#0F5F92',
        }}
      >
        {/* Building photo */}
        {imgData && (
          <img
            src={imgData}
            style={{
              position:   'absolute',
              inset:       0,
              width:       '100%',
              height:      '100%',
              objectFit:   'cover',
              opacity:     0.45,
            }}
          />
        )}

        {/* Gradient overlay */}
        <div
          style={{
            position:   'absolute',
            inset:       0,
            background: 'linear-gradient(135deg, rgba(15,95,146,0.90) 0%, rgba(15,95,146,0.45) 45%, rgba(0,0,0,0.75) 100%)',
            display:    'flex',
          }}
        />

        {/* Text content */}
        <div
          style={{
            position:      'absolute',
            display:       'flex',
            flexDirection: 'column',
            bottom:        70,
            left:          80,
            right:         80,
          }}
        >
          <div
            style={{
              color:         '#7EC8E3',
              fontSize:       26,
              fontWeight:     600,
              letterSpacing:  4,
              marginBottom:   20,
              display:        'flex',
              textTransform: 'uppercase',
            }}
          >
            Odkrywca Karwii
          </div>

          <div
            style={{
              color:      'white',
              fontSize:    56,
              fontWeight:  900,
              lineHeight:  1.15,
              display:    'flex',
              flexWrap:   'wrap',
            }}
          >
            Właśnie odkryłem {name}!
          </div>

          <div
            style={{
              color:       '#a0d4ef',
              fontSize:     30,
              marginTop:    22,
              display:     'flex',
            }}
          >
            Dołącz do gry terenowej w Karwii →
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
