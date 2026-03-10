'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-6">
      <div className="text-6xl">🔐</div>
      <div>
        <h1 className="text-2xl font-extrabold text-ocean-900">Logowanie</h1>
        <p className="text-gray-400 text-sm mt-2">
          Rejestracja i logowanie będą dostępne wkrótce.<br />
          Na razie gra działa w trybie gościa.
        </p>
      </div>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 bg-ocean-500 text-white px-6 py-3 rounded-2xl font-bold"
      >
        <ArrowLeft size={16} />
        Wróć
      </button>
    </div>
  );
}
