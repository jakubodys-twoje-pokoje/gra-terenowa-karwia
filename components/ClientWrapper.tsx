'use client';

import { usePathname } from 'next/navigation';

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMap = pathname === '/';
  return (
    <main className={isMap ? 'flex-1 overflow-hidden min-h-0' : 'flex-1 overflow-auto min-h-0 pb-6'}>
      {children}
    </main>
  );
}
