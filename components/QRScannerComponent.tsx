'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface Props {
  onResult: (url: string) => void;
  onClose: () => void;
}

export default function QRScannerComponent({ onResult, onClose }: Props) {
  const [error, setError] = useState('');
  const [started, setStarted] = useState(false);
  const scannerRef = useRef<import('html5-qrcode').Html5Qrcode | null>(null);
  const containerId = 'qr-reader-container';

  useEffect(() => {
    let active = true;

    const startScanner = async () => {
      const { Html5Qrcode } = await import('html5-qrcode');

      if (!active) return;

      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (active) {
              onResult(decodedText);
              scanner.stop().catch(() => {});
            }
          },
          undefined
        );
        if (active) setStarted(true);
      } catch (err) {
        if (active) {
          setError('Nie można uruchomić kamery. Sprawdź uprawnienia w przeglądarce.');
          console.error(err);
        }
      }
    };

    startScanner();

    return () => {
      active = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [onResult]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center">
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
        {/* Corner decorations */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-ocean-400 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-ocean-400 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-ocean-400 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-ocean-400 rounded-br-lg" />
      </div>

      {!started && !error && (
        <p className="text-white/60 text-sm mt-6 animate-pulse">Uruchamianie kamery…</p>
      )}

      {error && (
        <div className="mt-6 mx-4 bg-red-500/20 border border-red-400/40 text-red-200 rounded-2xl p-4 text-center text-sm max-w-xs">
          {error}
        </div>
      )}
    </div>
  );
}
