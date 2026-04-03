'use client';

import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useVideoScrub } from '@/hooks/useVideoScrub';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { BREAKPOINTS } from '@/lib/constants';

gsap.registerPlugin(ScrollTrigger);

export default function VideoSection() {
  const { videoRef, containerRef } = useVideoScrub();
  const stickyRef = useRef<HTMLDivElement>(null);
  const text1 = useRef<HTMLDivElement>(null);
  const text2 = useRef<HTMLDivElement>(null);
  const text3 = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery(`(max-width: ${BREAKPOINTS.md - 1}px)`);

  // Text reveal animations — separate from video scrub
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReduced) {
      [text1, text2, text3].forEach((ref) => {
        if (ref.current) gsap.set(ref.current, { opacity: 1, y: 0 });
      });
      return;
    }

    const refs = [text1, text2, text3];
    const triggers: ScrollTrigger[] = [];

    refs.forEach((ref, i) => {
      const el = ref.current;
      if (!el) return;

      gsap.set(el, { opacity: 0, y: 50 });

      // Each text appears in its third of the scroll, stays briefly, then fades
      const segmentSize = 1 / refs.length;
      const enterStart = i * segmentSize;
      const enterEnd = enterStart + segmentSize * 0.35;
      const exitStart = enterStart + segmentSize * 0.65;
      const exitEnd = enterStart + segmentSize;

      // Fade in
      const fadeIn = ScrollTrigger.create({
        trigger: container,
        start: `${enterStart * 100}% top`,
        end: `${enterEnd * 100}% top`,
        scrub: 0.3,
        onUpdate: (self) => {
          gsap.set(el, { opacity: self.progress, y: 50 * (1 - self.progress) });
        },
      });
      triggers.push(fadeIn);

      // Fade out — last text stays
      if (i < refs.length - 1) {
        const fadeOut = ScrollTrigger.create({
          trigger: container,
          start: `${exitStart * 100}% top`,
          end: `${exitEnd * 100}% top`,
          scrub: 0.3,
          onUpdate: (self) => {
            gsap.set(el, { opacity: 1 - self.progress, y: -30 * self.progress });
          },
        });
        triggers.push(fadeOut);
      }
    });

    return () => triggers.forEach((t) => t.kill());
  }, [containerRef]);

  return (
    <section
      id="video"
      ref={containerRef}
      className="relative"
      style={{ height: isMobile ? '280vh' : '350vh' }}
    >
      <div ref={stickyRef} className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Full-bleed video — no frame, the bed rises from below */}
        <video
          ref={videoRef}
          className="absolute w-full pointer-events-none"
          style={{
            height: isMobile ? '130%' : '110%',
            bottom: isMobile ? '-15%' : '-5%',
            left: 0,
            objectFit: 'contain',
          }}
          muted
          playsInline
          preload="auto"
        />

        {/* Edge blends — ivory gradients so bed merges with page */}
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-ivory via-ivory/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-ivory via-ivory/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-ivory to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-ivory to-transparent z-10 pointer-events-none" />

        {/* Text layers */}
        <div className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center justify-end pb-20 md:pb-28">
          <div ref={text1} className="absolute inset-0 flex items-center justify-center opacity-0">
            <div className="text-center px-6">
              <p className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-charcoal/90 font-light leading-tight">
                Crafted for Rest
              </p>
              <div className="mt-4 mx-auto w-12 h-px bg-accent/50" />
            </div>
          </div>
          <div ref={text2} className="absolute inset-0 flex items-center justify-center opacity-0">
            <div className="text-center px-6">
              <p className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-charcoal/90 font-light leading-tight">
                Where Comfort<br />Meets Design
              </p>
              <div className="mt-4 mx-auto w-12 h-px bg-accent/50" />
            </div>
          </div>
          <div ref={text3} className="absolute inset-0 flex items-center justify-center opacity-0">
            <div className="text-center px-6">
              <p className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-charcoal/90 font-light leading-tight">
                Every Detail,<br />Intentional
              </p>
              <div className="mt-4 mx-auto w-12 h-px bg-accent/50" />
            </div>
          </div>
        </div>

        {/* Scroll hint — positioned at top, fades naturally */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30">
          <p className="text-[10px] tracking-[0.3em] uppercase text-stone/60">
            Scroll to experience
          </p>
        </div>
      </div>
    </section>
  );
}
