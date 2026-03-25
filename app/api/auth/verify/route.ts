import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { signSession, sessionCookieOptions } from '@/lib/auth';

const BASE_URL = process.env.APP_BASE_URL ?? 'https://odkrywca.karwia.pl';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.redirect(`${BASE_URL}/weryfikacja?error=brak_tokenu`);

  const record = await prisma.emailVerificationToken.findUnique({ where: { token } });

  if (!record || record.expiresAt < new Date()) {
    await prisma.emailVerificationToken.deleteMany({ where: { token } });
    return NextResponse.redirect(`${BASE_URL}/weryfikacja?error=wygasly`);
  }

  // Migrate guest discoveries now that email is verified
  if (record.guestUserId) {
    await prisma.userDiscovery.updateMany({
      where: { userId: record.guestUserId },
      data: { userId: record.userId },
    }).catch(() => null); // ignore duplicate conflicts
  }

  const profile = await prisma.userProfile.update({
    where: { userId: record.userId },
    data: { emailVerified: true },
  });

  await prisma.emailVerificationToken.delete({ where: { token } });

  // Issue JWT only NOW — after verification
  const jwt = await signSession({ userId: profile.userId, email: profile.email! });
  const res = NextResponse.redirect(`${BASE_URL}/weryfikacja?success=1`);
  res.cookies.set(sessionCookieOptions(jwt));
  return res;
}
