'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RegulamPage() {
  const router = useRouter();
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/content?key=regulamin')
      .then((r) => r.json())
      .then((d) => setHtml(d.html ?? ''));
  }, []);

  return (
    <div className="min-h-screen flex flex-col px-5 pt-10 pb-16">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 mb-8 self-start text-sm">
        <ArrowLeft size={16} /> Wróć
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-ocean-100 flex items-center justify-center shrink-0">
          <FileText size={20} className="text-ocean-500" />
        </div>
        <h1 className="text-2xl font-extrabold text-ocean-900">Regulamin</h1>
      </div>

      {html === null ? (
        <div className="flex-1 flex items-center justify-center text-gray-300 text-sm">Ładowanie…</div>
      ) : html === '' ? (
        <div className="flex-1 flex items-center justify-center text-gray-300 text-sm">Treść niedostępna.</div>
      ) : (
        <div
          className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  );
}
