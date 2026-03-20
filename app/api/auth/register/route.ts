import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/mailer';
import { containsProfanity } from '@/lib/profanity';

function makeToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(req: NextRequest) {
  const { email, password, nickname, city, guestUserId } = await req.json();

  if (!email || !password) return NextResponse.json({ error: 'Email i hasło są wymagane' }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: 'Hasło musi mieć min. 6 znaków' }, { status: 400 });

  if (containsProfanity(email)) return NextResponse.json({ error: 'Adres email zawiera niedozwolone słowa.' }, { status: 400 });
  if (containsProfanity(nickname)) return NextResponse.json({ error: 'Pseudonim zawiera niedozwolone słowa.' }, { status: 400 });
  if (containsProfanity(city)) return NextResponse.json({ error: 'Miejscowość zawiera niedozwolone słowa.' }, { status: 400 });

  const existing = await prisma.userProfile.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: 'Ten adres email jest już zajęty' }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);
  const newUserId = crypto.randomUUID();

  // Create account — emailVerified: false, no session issued yet
  await prisma.userProfile.create({
    data: { userId: newUserId, email, passwordHash, nickname, city, emailVerified: false },
  });

  // Store guestUserId in token so discoveries migrate on verification
  const token = makeToken();
  await prisma.emailVerificationToken.deleteMany({ where: { userId: newUserId } });
  await prisma.emailVerificationToken.create({
    data: {
      userId: newUserId,
      guestUserId: guestUserId || null,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  try {
    await sendVerificationEmail(email, token);
  } catch (err) {
    console.error('Verification email failed:', err);
  }

  // No JWT — user stays guest until they verify email
  return NextResponse.json({ ok: true, message: 'Sprawdź skrzynkę email i kliknij link weryfikacyjny.' });
}
