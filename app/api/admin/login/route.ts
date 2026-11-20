import { NextRequest, NextResponse } from 'next/server';
import { checkAdminPassword } from '@/lib/adminAuth';

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const attempts = new Map<string, { count: number; resetAt: number }>();

export async function POST(req: NextRequest) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Brak ADMIN_PASSWORD w konfiguracji serwera (.env)' }, { status: 500 });
  }

  const ip = req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  const now = Date.now();
  const entry = attempts.get(ip);
  if (entry && entry.resetAt > now && entry.count >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: 'Za dużo prób — spróbuj ponownie za kilka minut' }, { status: 429 });
  }

  const { password } = await req.json().catch(() => ({ password: null }));
  if (typeof password === 'string' && checkAdminPassword(password)) {
    attempts.delete(ip);
    return NextResponse.json({ ok: true });
  }

  if (!entry || entry.resetAt <= now) attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  else entry.count++;
  return NextResponse.json({ error: 'Nieprawidłowe hasło' }, { status: 401 });
}
