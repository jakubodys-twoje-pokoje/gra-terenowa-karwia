import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSession, clearCookieOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Brak sesji' }, { status: 401 });

  const { password } = await req.json();
  if (!password) return NextResponse.json({ error: 'Podaj hasło' }, { status: 400 });

  const profile = await prisma.userProfile.findUnique({ where: { userId: session.userId } });
  if (!profile?.passwordHash)
    return NextResponse.json({ error: 'Nie znaleziono konta' }, { status: 404 });

  const ok = await bcrypt.compare(password, profile.passwordHash);
  if (!ok) return NextResponse.json({ error: 'Nieprawidłowe hasło' }, { status: 400 });

  // Delete all user data
  await prisma.userDiscovery.deleteMany({ where: { userId: session.userId } });
  await prisma.emailVerificationToken.deleteMany({ where: { userId: session.userId } });
  await prisma.userProfile.delete({ where: { userId: session.userId } });

  // Clear session cookie
  const res = NextResponse.json({ ok: true });
  const opts = clearCookieOptions();
  (await cookies()).set(opts);
  return res;
}
