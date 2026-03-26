'use client';

import { X } from 'lucide-react';

export interface EasterEggData {
  id: number;
  title: string;
  description?: string | null;
  mediaType: string;
  mediaUrl?: string | null;
}

interface Props {
  egg: EasterEggData;
  onClose: () => void;
}

export default function EasterEggPopup({ egg, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-[900] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'eggPop 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}
      >
        {/* Header strip */}
        <div className="bg-gradient-to-r from-amber-400 to-orange-400 px-5 py-3 flex items-center gap-2">
          <span className="text-2xl">🥚</span>
          <span className="text-white font-extrabold text-sm tracking-wide uppercase">Easter Egg!</span>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-2.5 right-3 text-white/80 hover:text-white"
        >
          <X size={20} />
        </button>

        {/* Media */}
        {egg.mediaUrl && egg.mediaType === 'image' && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={egg.mediaUrl} alt={egg.title} className="w-full object-cover max-h-56" />
        )}
        {egg.mediaUrl && egg.mediaType === 'video' && (
          <video
            src={egg.mediaUrl}
            controls
            autoPlay
            playsInline
            className="w-full max-h-56 bg-black"
          />
        )}
        {egg.mediaUrl && egg.mediaType === 'audio' && (
          <div className="px-5 pt-4">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <audio src={egg.mediaUrl} controls autoPlay className="w-full" />
          </div>
        )}

        {/* Text */}
        <div className="px-5 py-4">
          <h2 className="text-lg font-extrabold text-ocean-900 leading-tight mb-1">{egg.title}</h2>
          {egg.description && (
            <p className="text-gray-500 text-sm leading-relaxed">{egg.description}</p>
          )}
          <button
            onClick={onClose}
            className="mt-4 w-full bg-ocean-500 text-white py-3 rounded-2xl font-bold text-sm active:scale-95 transition-transform"
          >
            Super!
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes eggPop {
          from { transform: scale(0.7); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}
