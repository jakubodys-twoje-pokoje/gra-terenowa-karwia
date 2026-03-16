'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// Inline SVG wave shape — the RIGHT edge of the overlay is the organic ocean wave.
// When the overlay translates left→right across screen, this edge is the "breaking wave".
// viewBox is 110 wide so the wavy edge (80-110) is clearly visible on screen.
const WAVE_SVG = (
  <svg
    viewBox="0 0 110 100"
    preserveAspectRatio="none"
    className="absolute inset-0 w-full h-full"
    aria-hidden
  >
    <defs>
      <linearGradient id="wg" x1="0%" y1="20%" x2="100%" y2="80%">
        <stop offset="0%"   stopColor="#07304F" />
        <stop offset="50%"  stopColor="#0F5F92" />
        <stop offset="100%" stopColor="#1A88C9" />
      </linearGradient>
      {/* Foam / highlight strip along the wave edge */}
      <linearGradient id="foam" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stopColor="rgba(255,255,255,0)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0.55)" />
      </linearGradient>
    </defs>

    {/* Main ocean body */}
    <path
      d="M0,0 L78,0
         C 84,7   93,13  82,21
         C 71,29  90,36  81,44
         C 72,52  94,59  83,67
         C 72,75  91,83  80,91
         C 72,97  78,100 78,100
         L 0,100 Z"
      fill="url(#wg)"
    />

    {/* Lighter secondary wave — depth illusion */}
    <path
      d="M0,0 L72,0
         C 78,8   88,14  76,22
         C 64,30  84,37  74,46
         C 64,55  87,61  75,69
         C 63,77  83,84  71,93
         L 70,100 L 0,100 Z"
      fill="rgba(255,255,255,0.06)"
    />

    {/* Foam strip at the wave edge — makes it look organic */}
    <path
      d="M78,0
         C 84,7   93,13  82,21
         C 71,29  90,36  81,44
         C 72,52  94,59  83,67
         C 72,75  91,83  80,91
         C 72,97  78,100 78,100
         L 84,100
         C 86,93  96,86  84,79
         C 72,72  94,65  86,57
         C 78,49  98,41  87,33
         C 76,25  93,18  86,10
         C 81,4   84,0   84,0 Z"
      fill="url(#foam)"
    />
  </svg>
);

// Duration constants (ms)
const ENTER_MS = 340;  // wave slides in
const HOLD_MS  = 90;   // brief pause fully covering screen
const EXIT_MS  = 300;  // wave slides out

export default function PageTransition() {
  const pathname  = usePathname();
  const prevRef   = useRef(pathname);
  const divRef    = useRef<HTMLDivElement>(null);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (pathname === prevRef.current) return;
    prevRef.current = pathname;

    const el = divRef.current;
    if (!el) return;

    // Clear any running timers
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];

    // ── Phase 1: slide IN from left ──────────────────────────────────────────
    el.style.transition = `transform ${ENTER_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    el.style.transform  = 'translateX(0%)';
    el.style.display    = 'block';

    // ── Phase 2: hold ────────────────────────────────────────────────────────
    const t1 = setTimeout(() => {
      el.style.transition = 'none';
    }, ENTER_MS);

    // ── Phase 3: slide OUT to right ──────────────────────────────────────────
    const t2 = setTimeout(() => {
      el.style.transition = `transform ${EXIT_MS}ms cubic-bezier(0.4, 0, 0.8, 1)`;
      el.style.transform  = 'translateX(110%)';
    }, ENTER_MS + HOLD_MS);

    // ── Phase 4: hide (back to standby) ─────────────────────────────────────
    const t3 = setTimeout(() => {
      el.style.transition = 'none';
      el.style.transform  = 'translateX(-110%)';
      el.style.display    = 'none';
    }, ENTER_MS + HOLD_MS + EXIT_MS + 50);

    timerRefs.current = [t1, t2, t3];
    return () => timerRefs.current.forEach(clearTimeout);
  }, [pathname]);

  return (
    <div
      ref={divRef}
      // z-[49]: BELOW Navigation (z-50) so the tab bar stays visible during transition
      className="fixed inset-0 z-[49] pointer-events-none hidden overflow-hidden"
      style={{ transform: 'translateX(-110%)' }}
    >
      {WAVE_SVG}
    </div>
  );
}
