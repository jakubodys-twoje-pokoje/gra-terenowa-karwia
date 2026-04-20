'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, RefreshCw, Camera } from 'lucide-react';

interface Props {
  onResult: (url: string) => void;
  onClose: () => void;
}

declare global {
  interface Window {
    BarcodeDetector?: new (opts: { formats: string[] }) => {
      detect(source: HTMLVideoElement | HTMLCanvasElement): Promise<{ rawValue: string }[]>;
    };
  }
}

export default function QRScannerComponent({ onResult, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [started, setStarted] = useState(false);

  const stopCamera = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = 0; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setError('');
    setStarted(false);
    stopCamera();

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
    } catch (err: unknown) {
      const name = (err as { name?: string }).name ?? '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setError('Brak uprawnień do kamery. Odblokuj dostęp w ustawieniach przeglądarki.');
      } else if (name === 'NotFoundError') {
        setError('Nie znaleziono kamery tylnej.');
      } else {
        setError('Nie można uruchomić kamery. Spróbuj ponownie.');
      }
      return;
    }

    streamRef.current = stream;
    const video = videoRef.current;
    if (!video) { stopCamera(); return; }

    video.srcObject = stream;
    try { await video.play(); } catch { stopCamera(); return; }
    setStarted(true);

    // Prefer native BarcodeDetector (Chrome/Android)
    if (window.BarcodeDetector) {
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      const tick = async () => {
        if (!streamRef.current) return;
        try {
          const codes = await detector.detect(video);
          if (codes.length > 0) { stopCamera(); onResult(codes[0].rawValue); return; }
        } catch { /* no code in frame */ }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    // Fallback: draw frames to canvas → html5-qrcode scanFile
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let scanning = false;

    const tick = () => {
      if (!streamRef.current) return;
      if (!scanning && video.readyState >= 2) {
        scanning = true;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(async (blob) => {
          if (!blob || !streamRef.current) { scanning = false; rafRef.current = requestAnimationFrame(tick); return; }
          try {
            const { Html5Qrcode } = await import('html5-qrcode');
            const helper = new Html5Qrcode('qr-offscreen');
            const file = new File([blob], 'frame.jpg', { type: 'image/jpeg' });
            const result = await helper.scanFile(file, false);
            stopCamera();
            onResult(result);
            return;
          } catch { /* no QR in frame */ }
          scanning = false;
          rafRef.current = requestAnimationFrame(tick);
        }, 'image/jpeg', 0.85);
      } else if (!scanning) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [onResult, stopCamera]);

  const handleFileCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const helper = new Html5Qrcode('qr-offscreen');
      const result = await helper.scanFile(file, false);
      onResult(result);
    } catch {
      setError('Nie znaleziono kodu QR na zdjęciu. Spróbuj ponownie.');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
      {/* offscreen node for html5-qrcode fallback */}
      <div id="qr-offscreen" style={{ display: 'none' }} />

      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-3 rounded-full bg-white/20 text-white hover:bg-white/30 transition z-10"
      >
        <X size={24} />
      </button>

      <div className="text-center mb-4 px-4 z-10">
        <p className="text-white text-lg font-semibold">Skieruj kamerę na kod QR</p>
        <p className="text-white/70 text-sm mt-1">przy budynkach w Karwi</p>
      </div>

      {/* Video viewfinder */}
      <div className="relative w-[300px] h-[300px] z-10">
        <video
          ref={videoRef}
          muted
          playsInline
          className="w-full h-full object-cover rounded-2xl bg-gray-900"
        />
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-ocean-400 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-ocean-400 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-ocean-400 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-ocean-400 rounded-br-lg" />
      </div>

      {!started && !error && (
        <p className="text-white/60 text-sm mt-6 animate-pulse z-10">Uruchamianie kamery…</p>
      )}

      {error && (
        <div className="mt-4 mx-4 max-w-xs space-y-3 z-10">
          <div className="bg-red-500/20 border border-red-400/40 text-red-200 rounded-2xl p-4 text-center text-sm">
            {error}
            <p className="mt-2 text-red-300/70 text-xs">
              Sprawdź: Ustawienia Androida → Aplikacje → Vivaldi → Uprawnienia → Kamera
            </p>
          </div>
          <button
            onClick={startCamera}
            className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-2xl py-3 text-sm font-semibold transition"
          >
            <RefreshCw size={16} />
            Spróbuj ponownie
          </button>
        </div>
      )}

      {/* Always-visible fallback — works without browser camera permission */}
      <div className="mt-4 mx-4 max-w-xs z-10 pb-[calc(env(safe-area-inset-bottom,0px)+72px)]">
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
        <p className="text-white/30 text-xs text-center mt-2">Otwiera aparat systemowy</p>
      </div>
    </div>
  );
}
