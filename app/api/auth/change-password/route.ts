import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Brak sesji' }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword)
    return NextResponse.json({ error: 'Wypełnij wszystkie pola' }, { status: 400 });
  if (newPassword.length < 6)
    return NextResponse.json({ error: 'Nowe hasło musi mieć min. 6 znaków' }, { status: 400 });

  const profile = await prisma.userProfile.findUnique({ where: { userId: session.userId } });
  if (!profile?.passwordHash)
    return NextResponse.json({ error: 'Nie znaleziono konta' }, { status: 404 });

  const ok = await bcrypt.compare(currentPassword, profile.passwordHash);
  if (!ok) return NextResponse.json({ error: 'Aktualne hasło jest nieprawidłowe' }, { status: 400 });

  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.userProfile.update({ where: { userId: session.userId }, data: { passwordHash: hash } });

  return NextResponse.json({ ok: true });
}
