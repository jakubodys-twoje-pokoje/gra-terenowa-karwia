'use client';

import { usePathname } from 'next/navigation';

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMap = pathname === '/';
  return (
    <main className={isMap ? 'h-dvh overflow-hidden' : 'pb-24 min-h-screen'}>
      {children}
    </main>
  );
}
