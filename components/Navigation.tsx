'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, Trophy, Compass, BookOpen, QrCode } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { href: '/odkrycia', label: 'Odkrycia', Icon: Compass },
  { href: '/baza', label: 'Baza', Icon: BookOpen },
  { href: '/skanuj', label: 'Skanuj', Icon: QrCode, primary: true },
  { href: '/osiagniecia', label: 'Odznaki', Icon: Trophy },
  { href: '/', label: 'Mapa', Icon: Map },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-ocean-100 safe-area-pb">
      <div className="flex items-end justify-around px-2 py-1 max-w-lg mx-auto">
        {navItems.map(({ href, label, Icon, primary }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-all duration-200 min-w-[56px]',
                primary
                  ? 'bg-ocean-500 text-white -mt-4 shadow-lg shadow-ocean-500/40 px-4 py-3 rounded-3xl'
                  : isActive
                  ? 'text-ocean-500'
                  : 'text-gray-400 hover:text-ocean-400'
              )}
            >
              <Icon size={primary ? 26 : 22} strokeWidth={primary ? 2.5 : 1.8} />
              <span className={clsx('text-[10px] font-semibold', primary ? 'text-white' : '')}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
