import Link from 'next/link';
import Image from 'next/image';
import { Compass, Trophy, BookOpen } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <div
        className="relative h-72 flex flex-col items-center justify-center overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #073655 0%, #0F5F92 50%, #2A8EC9 100%)',
        }}
      >
        {/* Wave SVG */}
        <svg
          className="absolute bottom-0 inset-x-0 w-full"
          viewBox="0 0 375 60"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 30 Q60 0 120 30 T240 30 T375 30 V60 H0Z"
            fill="#F0F6FB"
          />
        </svg>

        {/* Decorative circles — behind content */}
        <div className="absolute top-4 right-8 w-32 h-32 rounded-full bg-white/5 -z-10" />
        <div className="absolute -top-6 -left-6 w-40 h-40 rounded-full bg-white/5 -z-10" />

        <div className="relative z-10 text-center px-6 mb-8">
          <Image
            src="https://karwia.pl/wp-content/uploads/2024/12/Karwia_logo.webp"
            alt="Karwia"
            width={200}
            height={100}
            className="mx-auto mb-2 drop-shadow-lg"
            unoptimized
          />
          <p className="text-ocean-100 text-sm font-medium">
            Gra Terenowa · Odkryj nadmorskie skarby
          </p>
        </div>
      </div>

      {/* Main options */}
      <div className="flex-1 px-4 pt-4 pb-6 space-y-4">
        <p className="text-center text-ocean-600 font-semibold text-xs uppercase tracking-widest mb-2">
          Co chcesz zrobić?
        </p>

        <Link href="/odkrycia">
          <div className="group bg-white rounded-3xl p-5 shadow-card hover:shadow-card-hover transition-all duration-200 flex items-center gap-4 hover:-translate-y-0.5">
            <div className="w-14 h-14 rounded-2xl bg-ocean-50 flex items-center justify-center group-hover:bg-ocean-100 transition-colors">
              <Compass size={30} className="text-ocean-500" strokeWidth={1.8} />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-ocean-900 text-base">Moje Odkrycia</h2>
              <p className="text-gray-500 text-sm mt-0.5">
                Budynki, które już odkryłeś
              </p>
            </div>
            <span className="text-ocean-300 text-lg">›</span>
          </div>
        </Link>

        <Link href="/osiagniecia">
          <div className="group bg-white rounded-3xl p-5 shadow-card hover:shadow-card-hover transition-all duration-200 flex items-center gap-4 hover:-translate-y-0.5">
            <div className="w-14 h-14 rounded-2xl bg-sand-50 flex items-center justify-center group-hover:bg-sand-100 transition-colors">
              <Trophy size={30} className="text-sand-500" strokeWidth={1.8} />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-ocean-900 text-base">Moje Osiągnięcia</h2>
              <p className="text-gray-500 text-sm mt-0.5">
                Odznaki i nagrody odkrywcy
              </p>
            </div>
            <span className="text-ocean-300 text-lg">›</span>
          </div>
        </Link>

        <Link href="/baza">
          <div className="group bg-white rounded-3xl p-5 shadow-card hover:shadow-card-hover transition-all duration-200 flex items-center gap-4 hover:-translate-y-0.5">
            <div className="w-14 h-14 rounded-2xl bg-cyan-50 flex items-center justify-center group-hover:bg-cyan-100 transition-colors">
              <BookOpen size={30} className="text-cyan-600" strokeWidth={1.8} />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-ocean-900 text-base">Baza Budynków</h2>
              <p className="text-gray-500 text-sm mt-0.5">
                Wszystkie miejsca w Karwi
              </p>
            </div>
            <span className="text-ocean-300 text-lg">›</span>
          </div>
        </Link>

        {/* Scan CTA */}
        <div className="pt-2">
          <Link href="/skanuj">
            <button className="w-full py-4 rounded-3xl bg-gradient-to-r from-ocean-500 to-ocean-400 text-white font-bold text-base shadow-lg shadow-ocean-500/30 hover:shadow-ocean-500/50 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-3">
              <span className="text-xl">📷</span>
              Skanuj kod QR
            </button>
          </Link>
          <p className="text-center text-gray-400 text-xs mt-2">
            Znajdź kody QR przy budynkach w Karwi
          </p>
        </div>

        {/* Footer */}
        <div className="text-center pt-4">
          <a
            href="https://www.karwia.pl"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ocean-400 text-xs hover:text-ocean-500 underline underline-offset-2"
          >
            🌊 Karwia · morze radości od 750 lat
          </a>
        </div>
      </div>
    </div>
  );
}
