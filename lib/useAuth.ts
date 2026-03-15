'use client';

import { useEffect, useState, useCallback } from 'react';

export interface AuthUser {
  userId: string;
  email: string;
  nickname: string | null;
  city: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
}

let cache: AuthUser | null | undefined = undefined; // undefined = not fetched yet
const listeners = new Set<(u: AuthUser | null) => void>();

function notify(u: AuthUser | null) {
  cache = u;
  listeners.forEach((fn) => fn(u));
}

export async function fetchMe(): Promise<AuthUser | null> {
  const res = await fetch('/api/auth/me');
  const data = res.ok ? await res.json() : null;
  notify(data);
  return data;
}

export async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  // Update localStorage so getUserId() picks up a fresh guest id
  localStorage.removeItem('karwia_session_user_id');
  notify(null);
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null | undefined>(cache);

  useEffect(() => {
    listeners.add(setUser);
    if (cache === undefined) {
      fetchMe().then(setUser);
    }
    return () => { listeners.delete(setUser); };
  }, []);

  const refresh = useCallback(() => fetchMe(), []);

  return { user, loading: user === undefined, refresh };
}
