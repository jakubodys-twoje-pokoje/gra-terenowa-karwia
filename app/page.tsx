import Link from 'next/link';
import Image from 'next/image';
import { Compass, Trophy, BookOpen, User } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero — max 1/3 ekranu */}
      <div
        className="relative h-[30vh] min-h-[180px] flex flex-col items-center justify-center overflow-hidden"
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

        <div className="relative z-10 text-center px-6 pb-10">
          <Image
            src="https://karwia.pl/wp-content/uploads/2024/12/Karwia_logo.webp"
            alt="Karwia"
            width={140}
            height={70}
            className="mx-auto drop-shadow-lg"
            unoptimized
          />
          <p className="text-ocean-100 text-sm font-medium mt-4">
            Gra Terenowa · Odkryj nadmorskie skarby
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 px-4 pt-4 pb-6 flex flex-col gap-[14px]">

        {/* User info */}
        <div className="bg-white rounded-3xl p-4 shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-ocean-100 flex items-center justify-center shrink-0">
            <User size={22} className="text-ocean-400" strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-ocean-900 text-sm leading-tight">Gość</p>
            <p className="text-gray-400 text-xs mt-0.5 truncate">Zaloguj się, aby zapisać postępy</p>
          </div>
          <Link
            href="/login"
            className="text-xs text-ocean-500 font-semibold bg-ocean-50 px-3 py-1.5 rounded-xl shrink-0 active:bg-ocean-100 transition-colors"
          >
            Zaloguj
          </Link>
        </div>

        <p className="text-center text-ocean-600 font-semibold text-xs uppercase tracking-widest">
          Co chcesz zrobić?
        </p>

        <Link href="/odkrycia" className="block">
          <div className="group bg-white rounded-3xl p-5 shadow-card transition-all duration-200 flex items-center gap-4 active:scale-[0.98]">
            <div className="w-14 h-14 rounded-2xl bg-ocean-50 flex items-center justify-center group-hover:bg-ocean-100 transition-colors shrink-0">
              <Compass size={28} className="text-ocean-500" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-ocean-900 text-base">Moje Odkrycia</h2>
              <p className="text-gray-500 text-sm mt-0.5">Budynki, które już odkryłeś</p>
            </div>
            <span className="text-ocean-300 text-lg shrink-0">›</span>
          </div>
        </Link>

        <Link href="/osiagniecia" className="block">
          <div className="group bg-white rounded-3xl p-5 shadow-card transition-all duration-200 flex items-center gap-4 active:scale-[0.98]">
            <div className="w-14 h-14 rounded-2xl bg-sand-50 flex items-center justify-center group-hover:bg-sand-100 transition-colors shrink-0">
              <Trophy size={28} className="text-sand-500" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-ocean-900 text-base">Moje Osiągnięcia</h2>
              <p className="text-gray-500 text-sm mt-0.5">Odznaki i nagrody odkrywcy</p>
            </div>
            <span className="text-ocean-300 text-lg shrink-0">›</span>
          </div>
        </Link>

        <Link href="/baza" className="block">
          <div className="group bg-white rounded-3xl p-5 shadow-card transition-all duration-200 flex items-center gap-4 active:scale-[0.98]">
            <div className="w-14 h-14 rounded-2xl bg-cyan-50 flex items-center justify-center group-hover:bg-cyan-100 transition-colors shrink-0">
              <BookOpen size={28} className="text-cyan-600" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-ocean-900 text-base">Baza Budynków</h2>
              <p className="text-gray-500 text-sm mt-0.5">Wszystkie miejsca w Karwi</p>
            </div>
            <span className="text-ocean-300 text-lg shrink-0">›</span>
          </div>
        </Link>

        {/* Footer */}
        <div className="text-center pt-2">
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
