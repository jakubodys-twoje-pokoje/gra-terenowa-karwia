/* eslint-disable @next/next/no-img-element */

interface Props {
  logoHeight?: string; // tailwind h-* class, e.g. 'h-8'
}

export default function PartnerLogos({ logoHeight = 'h-8' }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <p className="text-[10px] uppercase tracking-widest text-gray-300 font-semibold">
        Partnerzy projektu
      </p>

      <div className="flex items-center justify-center gap-6 flex-wrap">
        <a href="https://karwia.pl" target="_blank" rel="noopener noreferrer"
          className="hover:opacity-75 transition-opacity">
          <img src="/icons/karwia-pl-logo.webp" alt="karwia.pl"
            className={`${logoHeight} w-auto object-contain`} />
        </a>

        <a href="https://www.twojepokoje.com.pl" target="_blank" rel="noopener noreferrer"
          className="hover:opacity-75 transition-opacity">
          <img src="/icons/twoje-pokoje-logo.webp" alt="Twoje Pokoje"
            className={`${logoHeight} w-auto object-contain`} />
        </a>

        <a href="https://www.wladyslawowo.pl" target="_blank" rel="noopener noreferrer"
          className="hover:opacity-75 transition-opacity">
          <img src="/icons/wladyslawowo-logo.png" alt="Gmina Władysławowo"
            className={`${logoHeight} w-auto object-contain`} />
        </a>
      </div>

      <p className="text-[11px] text-gray-400 text-center leading-snug px-4">
        Zadanie jest finansowane ze środków gminy Władysławowo.
      </p>
    </div>
  );
}
