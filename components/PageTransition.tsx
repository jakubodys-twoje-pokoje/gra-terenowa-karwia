'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// Timings (ms)
const GROW_MS   = 320;  // circle expands to cover screen
const HOLD_MS   = 80;   // fully covered — new page is rendered underneath
const SHRINK_MS = 280;  // circle recedes revealing new page

// The fill: ocean gradient + wave texture baked as a static SVG background.
// The clip-path circle grow/shrink is the animation — no translateX at all.
const FILL_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"
       preserveAspectRatio="xMidYMid slice" viewBox="0 0 100 100">
    <defs>
      <radialGradient id="rg" cx="50%" cy="50%" r="70%">
        <stop offset="0%"   stop-color="#1A88C9"/>
        <stop offset="55%"  stop-color="#0F5F92"/>
        <stop offset="100%" stop-color="#07304F"/>
      </radialGradient>
    </defs>
    <rect width="100" height="100" fill="url(#rg)"/>
    <!-- soft wave shapes for depth -->
    <path d="M-10,60 C10,52 30,68 50,60 C70,52 90,68 110,60 L110,110 L-10,110 Z"
          fill="rgba(255,255,255,0.04)"/>
    <path d="M-10,70 C15,62 35,76 55,68 C75,60 95,74 115,66 L115,110 L-10,110 Z"
          fill="rgba(255,255,255,0.06)"/>
    <path d="M-10,80 C20,73 40,86 60,79 C80,72 100,84 120,77 L120,110 L-10,110 Z"
          fill="rgba(255,255,255,0.05)"/>
  </svg>
`;

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

    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];

    // ── Phase 1: set initial state, force layout, then grow ─────────────────
    el.style.display    = 'block';
    el.style.transition = 'none';
    el.style.clipPath   = 'circle(0% at 50% 50%)';

    // Force the browser to commit the initial state before starting transition
    void el.offsetHeight;

    el.style.transition = `clip-path ${GROW_MS}ms cubic-bezier(0.4, 0, 0.5, 1)`;
    el.style.clipPath   = 'circle(150% at 50% 50%)';

    // ── Phase 2: hold (freeze transition so new-page renders underneath) ────
    const t1 = setTimeout(() => {
      el.style.transition = 'none';
    }, GROW_MS);

    // ── Phase 3: shrink ──────────────────────────────────────────────────────
    const t2 = setTimeout(() => {
      el.style.transition = `clip-path ${SHRINK_MS}ms cubic-bezier(0.5, 0, 0.6, 1)`;
      el.style.clipPath   = 'circle(0% at 50% 50%)';
    }, GROW_MS + HOLD_MS);

    // ── Phase 4: hide ────────────────────────────────────────────────────────
    const t3 = setTimeout(() => {
      el.style.transition = 'none';
      el.style.display    = 'none';
    }, GROW_MS + HOLD_MS + SHRINK_MS + 50);

    timerRefs.current = [t1, t2, t3];
    return () => timerRefs.current.forEach(clearTimeout);
  }, [pathname]);

  return (
    <div
      ref={divRef}
      // z-[49] → BELOW Navigation bar (z-50) — tab bar stays visible throughout
      className="fixed inset-0 z-[49] pointer-events-none hidden overflow-hidden"
      style={{ clipPath: 'circle(0% at 50% 50%)' }}
      dangerouslySetInnerHTML={{ __html: FILL_SVG }}
    />
  );
}
