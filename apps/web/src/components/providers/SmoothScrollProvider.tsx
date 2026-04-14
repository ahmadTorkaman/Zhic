'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { SCROLL_CONFIG, BREAKPOINTS } from '@/lib/constants';

gsap.registerPlugin(ScrollTrigger);

export default function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const lenisRef = useRef<Lenis | null>(null);
  const isMobile = useMediaQuery(`(max-width: ${BREAKPOINTS.md - 1}px)`);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReduced) return;

    const lenis = new Lenis({
      autoRaf: false,
      lerp: isMobile ? undefined : SCROLL_CONFIG.desktop.lerp,
      syncTouch: isMobile ? SCROLL_CONFIG.mobile.syncTouch : undefined,
      syncTouchLerp: isMobile
        ? SCROLL_CONFIG.mobile.syncTouchLerp
        : undefined,
      wheelMultiplier: isMobile
        ? undefined
        : SCROLL_CONFIG.desktop.wheelMultiplier,
      touchMultiplier: isMobile
        ? SCROLL_CONFIG.mobile.touchMultiplier
        : undefined,
    });

    lenisRef.current = lenis;

    // Sync Lenis with GSAP's ticker for a single unified loop
    const update = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(update);

    // Connect Lenis scroll events to ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // Let ScrollTrigger know about Lenis's scroller proxy
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(update);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [isMobile]);

  return <>{children}</>;
}
