'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function SkanujError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Skanuj error:', error);
  }, [error]);

  return (
    <div className="px-4 pt-6 flex flex-col items-center gap-5">
      <div className="w-16 h-16 rounded-3xl bg-red-50 flex items-center justify-center">
        <AlertCircle size={32} className="text-red-400" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-extrabold text-ocean-900">Problem ze skanerem</h2>
        <p className="text-gray-400 text-sm mt-1">
          Nie udało się załadować skanera QR. Sprawdź uprawnienia przeglądarki lub spróbuj ponownie.
        </p>
      </div>
      <button
        onClick={reset}
        className="flex items-center gap-2 bg-ocean-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-ocean-500/30"
      >
        <RefreshCw size={16} />
        Spróbuj ponownie
      </button>
    </div>
  );
}
