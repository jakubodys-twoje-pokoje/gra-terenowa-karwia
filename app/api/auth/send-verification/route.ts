import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/mailer';
import { getSession } from '@/lib/auth';

function makeToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(req: NextRequest) {
  // Allow passing userId directly (from register) or use session
  const body = await req.json().catch(() => ({}));
  let userId: string | null = body.userId ?? null;

  if (!userId) {
    const session = await getSession();
    userId = session?.userId ?? null;
  }
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  if (!profile?.email) return NextResponse.json({ error: 'Brak adresu email' }, { status: 400 });
  if (profile.emailVerified) return NextResponse.json({ error: 'Email już potwierdzony' }, { status: 400 });

  // Rate-limit: max 1 email per 2 minutes
  const recent = await prisma.emailVerificationToken.findFirst({
    where: { userId, createdAt: { gt: new Date(Date.now() - 2 * 60 * 1000) } },
  });
  if (recent) return NextResponse.json({ error: 'Poczekaj chwilę przed ponownym wysłaniem' }, { status: 429 });

  // Invalidate old tokens for this user
  await prisma.emailVerificationToken.deleteMany({ where: { userId } });

  const token = makeToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.emailVerificationToken.create({ data: { userId, token, expiresAt } });

  try {
    await sendVerificationEmail(profile.email, token, req.headers.get('origin') ?? undefined);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Email send error:', err);
    return NextResponse.json({ error: 'Błąd wysyłania emaila. Spróbuj ponownie.' }, { status: 500 });
  }
}
