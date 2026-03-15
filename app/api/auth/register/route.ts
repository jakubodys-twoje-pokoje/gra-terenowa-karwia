import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { signSession, sessionCookieOptions } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/mailer';

function makeToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(req: NextRequest) {
  const { email, password, nickname, city, guestUserId } = await req.json();

  if (!email || !password) return NextResponse.json({ error: 'Email i hasło są wymagane' }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: 'Hasło musi mieć min. 6 znaków' }, { status: 400 });

  const existing = await prisma.userProfile.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: 'Ten adres email jest już zajęty' }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);

  let profile = guestUserId
    ? await prisma.userProfile.findUnique({ where: { userId: guestUserId } })
    : null;

  if (profile) {
    profile = await prisma.userProfile.update({
      where: { userId: guestUserId },
      data: { email, passwordHash, nickname: nickname || profile.nickname, city: city || profile.city, emailVerified: false },
    });
  } else {
    const newUserId = crypto.randomUUID();
    profile = await prisma.userProfile.create({
      data: { userId: newUserId, email, passwordHash, nickname, city, emailVerified: false },
    });
    if (guestUserId) {
      await prisma.userDiscovery.updateMany({
        where: { userId: guestUserId },
        data: { userId: newUserId },
      });
    }
  }

  // Send verification email
  const token = makeToken();
  await prisma.emailVerificationToken.deleteMany({ where: { userId: profile.userId } });
  await prisma.emailVerificationToken.create({
    data: { userId: profile.userId, token, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  });
  try {
    await sendVerificationEmail(email, token);
  } catch (err) {
    console.error('Verification email failed:', err);
    // Don't fail registration if email send fails — user can resend
  }

  // Issue session (but emailVerified: false — login will check this)
  const jwt = await signSession({ userId: profile.userId, email: profile.email! });
  const res = NextResponse.json({
    userId: profile.userId,
    email: profile.email,
    nickname: profile.nickname,
    emailVerified: false,
    message: 'Sprawdź skrzynkę email i kliknij link weryfikacyjny.',
  });
  res.cookies.set(sessionCookieOptions(jwt));
  return res;
}
