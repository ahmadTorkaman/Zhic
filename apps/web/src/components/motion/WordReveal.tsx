'use client';

import { useRef, type ElementType } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

export type WordRevealProps = {
  children: string;
  as?: 'h1' | 'h2';
  className?: string;
};

export function WordReveal({
  children,
  as: Tag = 'h1',
  className,
}: WordRevealProps) {
  const ref = useRef<HTMLElement>(null);

  const chars = children.split('');

  useGSAP(() => {
    if (!ref.current) return;

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    const charEls = ref.current.querySelectorAll<HTMLElement>('[data-char]');
    if (charEls.length === 0) return;

    if (prefersReduced) {
      gsap.fromTo(
        ref.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.01 },
      );
      return;
    }

    gsap.fromTo(
      charEls,
      { yPercent: 110 },
      {
        yPercent: 0,
        duration: 1.2,
        stagger: 0.08,
        ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 80%',
          once: true,
        },
      },
    );
  }, { scope: ref });

  const Component = Tag as ElementType;

  return (
    <Component ref={ref} className={className} aria-label={children}>
      {chars.map((char, i) => (
        <span
          key={i}
          className="inline-block overflow-hidden"
          aria-hidden
        >
          <span data-char className="inline-block" style={{ transform: 'translateY(110%)' }}>
            {char === ' ' ? '\u00A0' : char}
          </span>
        </span>
      ))}
    </Component>
  );
}
