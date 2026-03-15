import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { signSession, sessionCookieOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { email, password, nickname, city, guestUserId } = await req.json();

  if (!email || !password) return NextResponse.json({ error: 'Email i hasło są wymagane' }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: 'Hasło musi mieć min. 6 znaków' }, { status: 400 });

  const existing = await prisma.userProfile.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: 'Ten adres email jest już zajęty' }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);

  // If guest had an account already (same guestUserId), upgrade it; otherwise create new
  let profile = guestUserId
    ? await prisma.userProfile.findUnique({ where: { userId: guestUserId } })
    : null;

  if (profile) {
    // Upgrade guest account to full account
    profile = await prisma.userProfile.update({
      where: { userId: guestUserId },
      data: { email, passwordHash, nickname: nickname || profile.nickname, city: city || profile.city },
    });
  } else {
    const newUserId = crypto.randomUUID();
    profile = await prisma.userProfile.create({
      data: { userId: newUserId, email, passwordHash, nickname, city },
    });

    // Migrate guest discoveries to new account if guestUserId provided
    if (guestUserId) {
      await prisma.userDiscovery.updateMany({
        where: { userId: guestUserId },
        data: { userId: newUserId },
      });
    }
  }

  const token = await signSession({ userId: profile.userId, email: profile.email! });
  const res = NextResponse.json({ userId: profile.userId, email: profile.email, nickname: profile.nickname });
  res.cookies.set(sessionCookieOptions(token));
  return res;
}
