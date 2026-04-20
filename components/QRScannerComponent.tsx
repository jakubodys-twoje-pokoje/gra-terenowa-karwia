'use client';

import { useEffect, useRef, useState } from 'react';
import { X, RefreshCw, Camera } from 'lucide-react';

interface Props {
  onResult: (url: string) => void;
  onClose: () => void;
}

export default function QRScannerComponent({ onResult, onClose }: Props) {
  const [error, setError] = useState('');
  const [started, setStarted] = useState(false);
  const scannerRef = useRef<import('html5-qrcode').Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerId = 'qr-reader-container';

  const startScanner = async () => {
    setError('');
    setStarted(false);

    // Trigger browser permission dialog before html5-qrcode
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      stream.getTracks().forEach(t => t.stop());
    } catch {
      setError('Brak dostępu do kamery w przeglądarce.');
      return;
    }

    try {
      const { Html5Qrcode } = await import('html5-qrcode');

      const container = document.getElementById(containerId);
      if (!container) return;

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
      setError('Nie można uruchomić podglądu kamery.');
    }
  };

  const handleFileCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-file-scanner');
      const result = await scanner.scanFile(file, false);
      onResult(result);
    } catch {
      setError('Nie znaleziono kodu QR na zdjęciu. Spróbuj ponownie.');
    }
    // reset so same file can be picked again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    let cancelled = false;

    startScanner().then(() => {
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
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center">
      {/* hidden div required by html5-qrcode for file scanning */}
      <div id="qr-file-scanner" style={{ display: 'none' }} />

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

          {/* Fallback: native camera app via file input */}
          <label className="w-full flex items-center justify-center gap-2 bg-ocean-500 hover:bg-ocean-600 text-white rounded-2xl py-3 text-sm font-semibold transition cursor-pointer">
            <Camera size={16} />
            Zrób zdjęcie kodu QR
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileCapture}
            />
          </label>
          <p className="text-white/40 text-xs text-center">
            Otwiera aparat systemowy — nie wymaga uprawnień przeglądarki
          </p>
        </div>
      )}
    </div>
  );
}
