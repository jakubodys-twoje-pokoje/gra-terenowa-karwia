'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { UserPlus, LogIn, ArrowRight, MapPin, Trophy, Smartphone } from 'lucide-react';

const STORAGE_KEY = 'karwia_welcomed';

const BENEFITS = [
  { icon: Smartphone, text: 'Zachowaj postęp na każdym urządzeniu' },
  { icon: Trophy,     text: 'Dołącz do rankingu odkrywców Karwii' },
  { icon: MapPin,     text: 'Zbieraj odznaki i śledź trasę odkryć' },
];

export default function WelcomeModal() {
  const { user, loading } = useAuth();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const router       = useRouter();

  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  // Never show on admin or mid-scan redirect
  const skip =
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    searchParams.get('scan') === '1';

  useEffect(() => {
    if (skip) return;
    if (loading) return;       // wait for auth check
    if (user) return;          // logged in — no popup

    const seen = sessionStorage.getItem(STORAGE_KEY);
    if (seen) return;          // already shown this session

    // Small delay so the map/page renders first
    const t = setTimeout(() => {
      setVisible(true);
      requestAnimationFrame(() => setAnimateIn(true));
    }, 600);
    return () => clearTimeout(t);
  }, [loading, user, skip]);

  const dismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, '1');
    setAnimateIn(false);
    setTimeout(() => setVisible(false), 320);
  };

  const go = (path: string) => {
    dismiss();
    router.push(path);
  };

  const goRegister = () => {
    const guestId = typeof window !== 'undefined' ? (localStorage.getItem('karwia_user_id') ?? '') : '';
    go(`/rejestracja?guest=${guestId}`);
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={dismiss}
        className="fixed inset-0 z-[800] bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: animateIn ? 1 : 0 }}
      />

      {/* Sheet / card */}
      <div
        className={[
          // mobile: bottom sheet
          'fixed bottom-0 inset-x-0 z-[801] bg-white rounded-t-[2rem] shadow-2xl',
          // desktop: centered card
          'md:inset-x-auto md:left-1/2 md:bottom-auto md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[420px] md:rounded-[2rem]',
          // animation
          'transition-all duration-300 ease-out',
          animateIn
            ? 'translate-y-0 md:scale-100 opacity-100'
            : 'translate-y-full md:translate-y-0 md:scale-95 opacity-0',
        ].join(' ')}
      >
        {/* Handle (mobile) */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Hero */}
        <div className="bg-gradient-to-br from-ocean-500 to-ocean-700 mx-4 mt-2 md:mt-4 rounded-2xl px-6 py-5 text-white text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/karwia-logo.webp" alt="Karwia" className="w-20 h-auto mx-auto mb-1 drop-shadow-md" />
          <h2 className="text-xl font-extrabold leading-tight">Witaj w Karwi!</h2>
          <p className="text-ocean-200 text-sm mt-1">Gra terenowa nad morzem</p>
        </div>

        {/* Body */}
        <div className="px-6 pt-4 pb-2">
          <p className="text-gray-500 text-sm text-center leading-relaxed">
            Odkrywaj miejsca, skanuj kody QR i zbieraj odznaki.<br />
            Zarejestruj się, żeby nic nie stracić:
          </p>

          <ul className="mt-4 space-y-2.5">
            {BENEFITS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-gray-600">
                <span className="w-8 h-8 rounded-xl bg-ocean-50 flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-ocean-500" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="px-6 pt-4 pb-4 space-y-2.5">
          <button
            onClick={goRegister}
            className="w-full bg-ocean-500 hover:bg-ocean-600 text-white py-3.5 rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2"
          >
            <UserPlus size={16} />
            Zarejestruj się
          </button>

          <button
            onClick={() => go('/login')}
            className="w-full bg-ocean-50 hover:bg-ocean-100 text-ocean-700 py-3.5 rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2"
          >
            <LogIn size={16} />
            Zaloguj się
          </button>

          <button
            onClick={dismiss}
            className="w-full py-3 text-gray-400 text-sm font-semibold hover:text-gray-600 transition flex items-center justify-center gap-1.5"
          >
            Kontynuuj jako gość
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Twoje Pokoje branding */}
        <div className="flex justify-center pb-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/twoje-pokoje-logo.png" alt="Twoje Pokoje" className="h-5 w-auto opacity-35" />
        </div>
      </div>
    </>
  );
}
