'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, MailOpen, RefreshCw } from 'lucide-react';
import { fetchMe } from '@/lib/useAuth';

function VerifyContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [resentError, setResentError] = useState('');

  const success = params.get('success') === '1';
  const error = params.get('error');

  useEffect(() => {
    if (success) {
      fetchMe().then(() => {
        setTimeout(() => router.push('/'), 2500);
      });
    }
  }, [success, router]);

  const resend = async () => {
    setResending(true);
    setResentError('');
    const res = await fetch('/api/auth/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      setResent(true);
    } else {
      const d = await res.json();
      setResentError(d.error ?? 'Błąd wysyłania');
    }
    setResending(false);
  };

  if (success) {
    return (
      <div className="text-center py-16 px-6">
        <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-extrabold text-ocean-900 mb-2">Email potwierdzony!</h1>
        <p className="text-gray-400 text-sm mb-2">Twoje konto jest aktywne. Zaraz przejdziesz do gry…</p>
        <div className="flex justify-center mt-4">
          <Loader2 size={20} className="animate-spin text-ocean-400" />
        </div>
      </div>
    );
  }

  if (error) {
    const messages: Record<string, string> = {
      wygasly: 'Link weryfikacyjny wygasł (ważny 24h). Wyślij nowy link.',
      brak_tokenu: 'Nieprawidłowy link weryfikacyjny.',
    };
    return (
      <div className="text-center py-16 px-6">
        <XCircle size={56} className="text-red-400 mx-auto mb-4" />
        <h1 className="text-xl font-extrabold text-ocean-900 mb-2">Link nieważny</h1>
        <p className="text-gray-400 text-sm mb-6">{messages[error] ?? 'Wystąpił błąd. Spróbuj ponownie.'}</p>
        <button
          onClick={resend}
          disabled={resending || resent}
          className="inline-flex items-center gap-2 bg-ocean-500 text-white px-6 py-3 rounded-2xl font-bold text-sm disabled:opacity-60"
        >
          <RefreshCw size={16} className={resending ? 'animate-spin' : ''} />
          {resent ? 'Wysłano!' : resending ? 'Wysyłam…' : 'Wyślij nowy link'}
        </button>
        {resentError && <p className="text-red-500 text-sm mt-3">{resentError}</p>}
      </div>
    );
  }

  // No params = page opened directly (e.g. after registration)
  return (
    <div className="text-center py-16 px-6">
      <MailOpen size={56} className="text-ocean-400 mx-auto mb-4" />
      <h1 className="text-xl font-extrabold text-ocean-900 mb-2">Sprawdź swoją skrzynkę</h1>
      <p className="text-gray-400 text-sm mb-6">
        Wysłaliśmy Ci link aktywacyjny. Kliknij go, aby potwierdzić email i aktywować konto.<br />
        Link jest ważny przez <strong>24 godziny</strong>.
      </p>
      {resent ? (
        <p className="text-green-600 font-semibold text-sm">Nowy link wysłany!</p>
      ) : (
        <button
          onClick={resend}
          disabled={resending}
          className="inline-flex items-center gap-2 text-ocean-500 bg-ocean-50 px-5 py-2.5 rounded-xl font-semibold text-sm"
        >
          <RefreshCw size={15} className={resending ? 'animate-spin' : ''} />
          {resending ? 'Wysyłam…' : 'Wyślij ponownie'}
        </button>
      )}
      {resentError && <p className="text-red-500 text-sm mt-3">{resentError}</p>}
    </div>
  );
}

export default function WeryfikacjaPage() {
  return <Suspense><VerifyContent /></Suspense>;
}
