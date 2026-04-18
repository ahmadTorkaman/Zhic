'use client';

import { useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

export type ImageRevealProps = {
  children: ReactNode;
  className?: string;
};

export function ImageReveal({ children, className }: ImageRevealProps) {
  const outerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!outerRef.current) return;

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (prefersReduced) {
      gsap.fromTo(
        outerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.01 },
      );
      return;
    }

    const inner = outerRef.current.querySelector('[data-image-inner]');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: outerRef.current,
        start: 'top 80%',
        once: true,
      },
    });

    tl.fromTo(
      outerRef.current,
      { clipPath: 'inset(100% 0 0 0)' },
      {
        clipPath: 'inset(0% 0 0 0)',
        duration: 0.72,
        ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    );

    if (inner) {
      tl.fromTo(
        inner,
        { scale: 1.08 },
        {
          scale: 1,
          duration: 0.72,
          ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
        },
        0,
      );
    }
  }, { scope: outerRef });

  return (
    <div
      ref={outerRef}
      className={className}
      style={{ clipPath: 'inset(100% 0 0 0)', overflow: 'hidden' }}
    >
      <div data-image-inner style={{ transform: 'scale(1.08)' }}>
        {children}
      </div>
    </div>
  );
}
