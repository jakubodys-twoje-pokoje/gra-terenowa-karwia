import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { path, userId, sessionId } = await req.json();
    const isShortString = (v: unknown, max: number) => typeof v === 'string' && v.length > 0 && v.length <= max;
    if (!isShortString(path, 200) || !isShortString(sessionId, 64) || (userId != null && !isShortString(userId, 64))) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // Skip admin and API paths
    if (path.startsWith('/admin') || path.startsWith('/api')) {
      return NextResponse.json({ ok: true });
    }

    await prisma.pageView.create({
      data: { path, userId: userId ?? null, sessionId },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
