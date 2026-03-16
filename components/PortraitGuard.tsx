'use client';

import { usePathname } from 'next/navigation';

export default function PortraitGuard() {
  const pathname = usePathname();
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return null;

  return (
    <>
      {/* Mobile landscape — obróć telefon */}
      <div className="mobile-landscape-guard fixed inset-0 z-[9999] bg-ocean-900 flex flex-col items-center justify-center text-white text-center px-8 hidden">
        <div className="text-6xl mb-4">📱</div>
        <h2 className="text-xl font-extrabold mb-2">Obróć telefon</h2>
        <p className="text-ocean-200 text-sm">Ta aplikacja działa tylko w trybie pionowym.</p>
      </div>

      {/* Desktop — strona dla telefonów */}
      <div className="desktop-guard fixed inset-0 z-[9999] bg-ocean-900 flex flex-col items-center justify-center text-white text-center px-8 hidden">
        <div className="text-6xl mb-4">📱</div>
        <h2 className="text-xl font-extrabold mb-2">Aplikacja mobilna</h2>
        <p className="text-ocean-200 text-sm leading-relaxed">
          Ta aplikacja jest przeznaczona dla urządzeń mobilnych.<br />
          Otwórz ją na telefonie, żeby odkrywać Karwię!
        </p>
      </div>
    </>
  );
}
