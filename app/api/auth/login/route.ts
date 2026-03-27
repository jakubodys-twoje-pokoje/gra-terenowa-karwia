import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { signSession, sessionCookieOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { email: rawEmail, password } = await req.json();
  const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : rawEmail;

  if (!email || !password) return NextResponse.json({ error: 'Uzupełnij email i hasło' }, { status: 400 });

  const profile = await prisma.userProfile.findUnique({ where: { email } });
  if (!profile?.passwordHash) return NextResponse.json({ error: 'Nieprawidłowy email lub hasło' }, { status: 401 });

  const ok = await bcrypt.compare(password, profile.passwordHash);
  if (!ok) return NextResponse.json({ error: 'Nieprawidłowy email lub hasło' }, { status: 401 });

  if (!profile.emailVerified) {
    return NextResponse.json(
      { error: 'Potwierdź swój adres email przed zalogowaniem. Sprawdź skrzynkę pocztową.', needsVerification: true },
      { status: 403 }
    );
  }

  const token = await signSession({ userId: profile.userId, email: profile.email! });
  const res = NextResponse.json({ userId: profile.userId, email: profile.email, nickname: profile.nickname });
  res.cookies.set(sessionCookieOptions(token));
  return res;
}
