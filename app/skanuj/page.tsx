'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { QrCode, AlertCircle } from 'lucide-react';

const QRScannerComponent = dynamic(() => import('@/components/QRScannerComponent'), { ssr: false });

export default function SkanujPage() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResult = useCallback(
    async (url: string) => {
      setScanning(false);
      setLoading(true);
      setError('');

      try {
        // Try direct match in our DB
        const res = await fetch(`/api/budynki/qr?url=${encodeURIComponent(url)}`);

        if (res.ok) {
          const { id } = await res.json();
          router.push(`/budynek/${id}`);
          return;
        }

        // Maybe the scanned URL is already a /budynek/ path
        try {
          const parsed = new URL(url);
          const match = parsed.pathname.match(/^\/budynek\/(\d+)$/);
          if (match) {
            router.push(`/budynek/${match[1]}`);
            return;
          }
        } catch {
          // not a URL
        }

        setError('Ten kod QR nie należy do gry terenowej w Karwi.');
      } catch {
        setError('Błąd połączenia. Sprawdź internet i spróbuj ponownie.');
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  return (
    <div className="px-4 pt-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-ocean-100 flex items-center justify-center">
          <QrCode size={22} className="text-ocean-500" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-ocean-900">Skanuj kod QR</h1>
          <p className="text-gray-500 text-xs">Znajdź kody przy budynkach w Karwi</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 mb-4 text-sm">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Nie rozpoznano kodu QR</p>
            <p className="text-red-500 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="w-10 h-10 border-4 border-ocean-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-ocean-500 font-medium text-sm">Wyszukiwanie budynku…</p>
        </div>
      )}

      {!scanning && !loading && (
        <div className="space-y-5">
          {/* Big scan button */}
          <div
            className="bg-white rounded-3xl p-8 shadow-card flex flex-col items-center gap-5 cursor-pointer hover:shadow-card-hover transition-all"
            onClick={() => { setError(''); setScanning(true); }}
          >
            <div className="w-24 h-24 rounded-3xl bg-ocean-50 flex items-center justify-center">
              <QrCode size={52} className="text-ocean-400" strokeWidth={1.2} />
            </div>
            <div className="text-center">
              <h2 className="font-bold text-ocean-900 text-lg">Zeskanuj kod QR</h2>
              <p className="text-gray-400 text-sm mt-1">
                Naciśnij, aby otworzyć kamerę
              </p>
            </div>
            <button className="bg-ocean-500 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-ocean-500/30 hover:bg-ocean-600 transition-colors">
              Otwórz kamerę
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-3xl p-5 shadow-card">
            <h3 className="font-bold text-ocean-800 mb-3 text-sm">Jak to działa?</h3>
            <ol className="space-y-3 text-sm text-gray-500">
              {[
                { icon: '📍', text: 'Znajdź kod QR na budynku w Karwi' },
                { icon: '📷', text: 'Naciśnij przycisk i skieruj kamerę na kod' },
                { icon: '🏛️', text: 'Dowiedz się więcej o tym miejscu' },
                { icon: '🗺️', text: 'Budynek pojawi się na Twojej mapie odkryć' },
                { icon: '🏆', text: 'Zbieraj odznaki za odkryte miejsca' },
              ].map(({ icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <span className="text-base">{icon}</span>
                  <span>{text}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* QR Scanner overlay */}
      {scanning && (
        <QRScannerComponent
          onResult={handleResult}
          onClose={() => setScanning(false)}
        />
      )}
    </div>
  );
}
