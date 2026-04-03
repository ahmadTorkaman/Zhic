'use client';

import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import Button from '@/components/ui/Button';

export default function HeroSection() {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReduced) return;

    const children = el.querySelectorAll('[data-hero-anim]');
    gsap.set(children, { opacity: 0, y: 40 });
    gsap.to(children, {
      opacity: 1,
      y: 0,
      duration: 1.2,
      stagger: 0.12,
      ease: 'power3.out',
      delay: 0.2,
    });

    // Floating orbs subtle animation
    const orbs = el.querySelectorAll('[data-orb]');
    orbs.forEach((orb, i) => {
      gsap.to(orb, {
        y: i % 2 === 0 ? -20 : 20,
        x: i % 2 === 0 ? 10 : -10,
        duration: 6 + i * 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    });
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center overflow-hidden"
    >
      {/* Layered gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-warm-white via-ivory to-cream" />

      {/* Floating decorative orbs */}
      <div data-orb className="absolute top-[15%] left-[10%] w-[300px] h-[300px] rounded-full bg-accent/[0.06] blur-[80px]" />
      <div data-orb className="absolute bottom-[20%] right-[8%] w-[400px] h-[400px] rounded-full bg-sand/[0.15] blur-[100px]" />
      <div data-orb className="absolute top-[60%] left-[50%] w-[200px] h-[200px] rounded-full bg-accent/[0.04] blur-[60px]" />

      {/* Dot pattern overlay — very subtle texture */}
      <div className="absolute inset-0 dot-pattern opacity-[0.15]" />

      {/* Content */}
      <div className="relative z-10">
        <div data-hero-anim className="mb-8">
          <span className="inline-flex items-center gap-3 text-[10px] tracking-[0.5em] uppercase text-accent font-medium">
            <span className="w-8 h-px bg-accent/50" />
            Bedroom Atelier
            <span className="w-8 h-px bg-accent/50" />
          </span>
        </div>

        <h1
          data-hero-anim
          className="font-serif text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] font-light text-charcoal tracking-[0.12em] leading-none"
        >
          ZHIC
        </h1>

        <p
          data-hero-anim
          className="mt-8 text-stone text-sm md:text-base font-light max-w-sm mx-auto leading-relaxed tracking-wide"
        >
          Where rest becomes ritual. Handcrafted beds for those
          who appreciate the art of slowing down.
        </p>

        <div data-hero-anim className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            onClick={() =>
              document.getElementById('video')?.scrollIntoView({ behavior: 'smooth' })
            }
          >
            Explore
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })
            }
          >
            The Collection
          </Button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        data-hero-anim
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[9px] tracking-[0.4em] uppercase text-stone/50">
          Scroll
        </span>
        <div className="relative w-px h-10">
          <div className="absolute inset-0 bg-sand/30" />
          <div className="absolute top-0 left-0 w-full h-1/3 bg-accent/60 animate-[slideDown_2s_ease-in-out_infinite]" />
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          0% { transform: translateY(0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(200%); opacity: 0; }
        }
      `}</style>
    </section>
  );
}
