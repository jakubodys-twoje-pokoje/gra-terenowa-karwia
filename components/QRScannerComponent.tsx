'use client';

import { useEffect, useRef, useState } from 'react';
import { X, RefreshCw } from 'lucide-react';

interface Props {
  onResult: (url: string) => void;
  onClose: () => void;
}

export default function QRScannerComponent({ onResult, onClose }: Props) {
  const [error, setError] = useState('');
  const [started, setStarted] = useState(false);
  const scannerRef = useRef<import('html5-qrcode').Html5Qrcode | null>(null);
  const containerId = 'qr-reader-container';

  const startScanner = async () => {
    setError('');
    setStarted(false);

    // First: explicitly request camera permission to trigger the browser dialog
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    } catch (err: unknown) {
      const name = (err as { name?: string }).name;
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setError('Brak dostępu do kamery. Wejdź w ustawienia przeglądarki i zezwól na kamerę dla tej strony.');
      } else {
        setError('Nie znaleziono kamery. Sprawdź czy urządzenie ma kamerę tylną.');
      }
      return;
    }
    // Stop manual stream — html5-qrcode will open its own
    stream.getTracks().forEach(t => t.stop());

    try {
      const { Html5Qrcode } = await import('html5-qrcode');

      const container = document.getElementById(containerId);
      if (!container) return;

      // Clean up any previous instance
      if (scannerRef.current) {
        try { await scannerRef.current.stop(); } catch { /* ignore */ }
        scannerRef.current = null;
      }

      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          onResult(decodedText);
          try { scanner.stop().catch(() => {}); } catch { /* ignore */ }
        },
        undefined
      );
      setStarted(true);
    } catch (err) {
      console.error(err);
      setError('Nie można uruchomić skanera. Spróbuj ponownie.');
    }
  };

  useEffect(() => {
    let cancelled = false;

    startScanner().then(() => {
      // if cancelled before scanner started, stop it
      if (cancelled && scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    });

    return () => {
      cancelled = true;
      if (scannerRef.current) {
        try { scannerRef.current.stop().catch(() => {}); } catch { /* ignore */ }
        scannerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[1100] bg-black/90 flex flex-col items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-3 rounded-full bg-white/20 text-white hover:bg-white/30 transition"
      >
        <X size={24} />
      </button>

      <div className="text-center mb-6 px-4">
        <p className="text-white text-lg font-semibold font-sans">Skieruj kamerę na kod QR</p>
        <p className="text-white/70 text-sm mt-1">przy budynkach w Karwi</p>
      </div>

      {/* Scanner area */}
      <div className="relative">
        <div
          id={containerId}
          className="w-[300px] h-[300px] overflow-hidden rounded-2xl"
          style={{ background: '#111' }}
        />
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-ocean-400 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-ocean-400 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-ocean-400 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-ocean-400 rounded-br-lg" />
      </div>

      {!started && !error && (
        <p className="text-white/60 text-sm mt-6 animate-pulse">Uruchamianie kamery…</p>
      )}

      {error && (
        <div className="mt-6 mx-4 max-w-xs space-y-3">
          <div className="bg-red-500/20 border border-red-400/40 text-red-200 rounded-2xl p-4 text-center text-sm">
            {error}
          </div>
          <button
            onClick={startScanner}
            className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-2xl py-3 text-sm font-semibold transition"
          >
            <RefreshCw size={16} />
            Spróbuj ponownie
          </button>
        </div>
      )}
    </div>
  );
}
