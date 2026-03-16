import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navigation from '@/components/Navigation';
import PortraitGuard from '@/components/PortraitGuard';
import ClientWrapper from '@/components/ClientWrapper';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? 'https://karwia.app'),
  title: 'Karwia – Gra Terenowa',
  description: 'Odkryj tajemnice nadmorskiej Karwi! Skanuj kody QR przy budynkach i zbieraj odznaki odkrywcy.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
  openGraph: {
    title: 'Karwia – Gra Terenowa',
    description: 'Odkryj tajemnice nadmorskiej Karwi! Skanuj kody QR przy budynkach i zbieraj odznaki odkrywcy.',
    type: 'website',
    locale: 'pl_PL',
    images: [{ url: '/icons/icon-512.png', width: 512, height: 512, alt: 'Karwia Gra Terenowa' }],
  },
  twitter: {
    card: 'summary',
    title: 'Karwia – Gra Terenowa',
    description: 'Odkryj tajemnice nadmorskiej Karwi!',
    images: ['/icons/icon-512.png'],
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
        <ClientWrapper>{children}</ClientWrapper>
        <Navigation />
        <PortraitGuard />
      </body>
    </html>
  );
}
