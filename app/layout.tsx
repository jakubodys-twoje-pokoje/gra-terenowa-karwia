import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navigation from '@/components/Navigation';
import PortraitGuard from '@/components/PortraitGuard';

export const metadata: Metadata = {
  title: 'Karwia – Gra Terenowa',
  description: 'Odkryj tajemnice nadmorskiej Karwi! Skanuj kody QR przy budynkach i zbieraj odznaki odkrywcy.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0F5F92',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className="max-w-lg mx-auto relative">
        <main className="pb-24 min-h-screen">
          {children}
        </main>
        <Navigation />
        <PortraitGuard />
      </body>
    </html>
  );
}
