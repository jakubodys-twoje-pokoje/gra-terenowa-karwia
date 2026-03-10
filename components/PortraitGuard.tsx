'use client';

export default function PortraitGuard() {
  return (
    <div className="portrait-guard fixed inset-0 z-[9999] bg-ocean-900 flex flex-col items-center justify-center text-white text-center px-8 hidden">
      <div className="text-6xl mb-4">📱</div>
      <h2 className="text-xl font-extrabold mb-2">Obróć telefon</h2>
      <p className="text-ocean-200 text-sm">Ta aplikacja działa tylko w trybie pionowym.</p>
    </div>
  );
}
