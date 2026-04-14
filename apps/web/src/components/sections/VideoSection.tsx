'use client';

import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { BREAKPOINTS } from '@/lib/constants';

gsap.registerPlugin(ScrollTrigger);

export default function VideoSection() {
  const containerRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const textSectionRef = useRef<HTMLDivElement>(null);
  const text1 = useRef<HTMLDivElement>(null);
  const text2 = useRef<HTMLDivElement>(null);
  const text3 = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery(`(max-width: ${BREAKPOINTS.md - 1}px)`);

  // Text reveal animations — triggered after the gif has scrolled out
  useEffect(() => {
    const textSection = textSectionRef.current;
    if (!textSection) return;

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

      const fadeIn = ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        end: 'top 50%',
        scrub: 0.3,
        onUpdate: (self) => {
          gsap.set(el, { opacity: self.progress, y: 50 * (1 - self.progress) });
        },
      });
      triggers.push(fadeIn);

      // Fade out — last text stays
      if (i < refs.length - 1) {
        const fadeOut = ScrollTrigger.create({
          trigger: el,
          start: 'top 20%',
          end: 'top 0%',
          scrub: 0.3,
          onUpdate: (self) => {
            gsap.set(el, { opacity: 1 - self.progress, y: -30 * self.progress });
          },
        });
        triggers.push(fadeOut);
      }
    });

    return () => triggers.forEach((t) => t.kill());
  }, []);

  return (
    <>
      {/* GIF section — sticky while scrolling through */}
      <section
        id="video"
        ref={containerRef}
        className="relative"
        style={{ height: isMobile ? '200vh' : '250vh' }}
      >
        <div ref={stickyRef} className="sticky top-0 h-screen w-full overflow-hidden">
          {/* Full-bleed GIF — transparent background */}
          <img
            src="/55_bal4.gif"
            alt="Product showcase"
            className="absolute w-full pointer-events-none"
            style={{
              height: isMobile ? '130%' : '110%',
              bottom: isMobile ? '-15%' : '-5%',
              left: 0,
              objectFit: 'contain',
            }}
          />

          {/* Edge blends — ivory gradients so image merges with page */}
          <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-ivory via-ivory/80 to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-ivory via-ivory/80 to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-ivory to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-ivory to-transparent z-10 pointer-events-none" />

          {/* Scroll hint */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30">
            <p className="text-[10px] tracking-[0.3em] uppercase text-stone/60">
              Scroll to experience
            </p>
          </div>
        </div>
      </section>

      {/* Text section — appears after gif scrolls out */}
      <section ref={textSectionRef} className="relative bg-ivory">
        <div className="min-h-screen flex flex-col items-center justify-center py-20 md:py-28 gap-24 md:gap-32">
          <div ref={text1} className="opacity-0">
            <div className="text-center px-6">
              <p className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-charcoal/90 font-light leading-tight">
                Crafted for Rest
              </p>
              <div className="mt-4 mx-auto w-12 h-px bg-accent/50" />
            </div>
          </div>
          <div ref={text2} className="opacity-0">
            <div className="text-center px-6">
              <p className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-charcoal/90 font-light leading-tight">
                Where Comfort<br />Meets Design
              </p>
              <div className="mt-4 mx-auto w-12 h-px bg-accent/50" />
            </div>
          </div>
          <div ref={text3} className="opacity-0">
            <div className="text-center px-6">
              <p className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-charcoal/90 font-light leading-tight">
                Every Detail,<br />Intentional
              </p>
              <div className="mt-4 mx-auto w-12 h-px bg-accent/50" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
