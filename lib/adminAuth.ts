import { createHash, timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';

const digest = (s: string) => createHash('sha256').update(s).digest();

export function checkAdminPassword(given: string | null | undefined): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !given) return false;
  return timingSafeEqual(digest(given), digest(expected));
}

// The client URI-encodes the header because HTTP headers cannot carry non-Latin1 characters.
export function isAdmin(req: Request): boolean {
  const raw = req.headers.get('x-admin-password');
  if (!raw) return false;
  try {
    return checkAdminPassword(decodeURIComponent(raw));
  } catch {
    return false;
  }
}

export function unauthorized() {
  return NextResponse.json({ error: 'Nieprawidłowe hasło administratora — zaloguj się ponownie' }, { status: 401 });
}
