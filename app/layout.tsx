import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import './globals.css';
import Navigation from '@/components/Navigation';
import PortraitGuard from '@/components/PortraitGuard';
import ClientWrapper from '@/components/ClientWrapper';
import WelcomeModal from '@/components/WelcomeModal';
import PageTransition from '@/components/PageTransition';
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';
import InstallPrompt from '@/components/InstallPrompt';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? 'https://karwia.app'),
  title: 'Karwia – Gra Terenowa',
  description: 'Odkryj tajemnice nadmorskiej Karwi! Skanuj kody QR przy budynkach i zbieraj odznaki odkrywcy.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/icon-192.png',
    shortcut: '/favicon.ico',
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Kanit:wght@600;700;800&family=Nunito:wght@400;500;600;700&display=swap" />
      </head>
      <body className="max-w-lg mx-auto relative">
        <ClientWrapper>{children}</ClientWrapper>
        <PageTransition />
        <Navigation />
        <PortraitGuard />
        <Suspense><WelcomeModal /></Suspense>
        <InstallPrompt />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
