'use client';

import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SectionHeading from '@/components/ui/SectionHeading';
import ScrollReveal from '@/components/ui/ScrollReveal';

gsap.registerPlugin(ScrollTrigger);

export default function AboutSection() {
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = imageRef.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReduced) return;

    gsap.to(el, {
      y: -50,
      ease: 'none',
      scrollTrigger: {
        trigger: el,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
  }, []);

  return (
    <section id="about" className="relative py-28 md:py-40 px-6 md:px-10 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-cream" />
      <div className="absolute inset-0 dot-pattern opacity-[0.06]" />
      <div className="absolute top-[30%] -left-[10%] w-[300px] h-[300px] rounded-full bg-accent/[0.06] blur-[80px]" />

      <div className="max-w-6xl mx-auto relative">
        <ScrollReveal>
          <SectionHeading label="Our Philosophy" title="Our Story" />
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-start">
          {/* Image — spans 5 cols */}
          <div className="md:col-span-5">
            <div className="glass-card rounded-3xl p-1.5 overflow-hidden">
              <div className="overflow-hidden rounded-[20px] aspect-[3/4]">
                <div
                  ref={imageRef}
                  className="w-full h-[130%] bg-gradient-to-br from-sand/30 via-cream to-sand/20 flex items-center justify-center"
                >
                  <span className="font-serif text-5xl text-stone/15 select-none">Z</span>
                </div>
              </div>
            </div>
          </div>

          {/* Text — spans 7 cols */}
          <div className="md:col-span-7 md:pt-12">
            <ScrollReveal>
              <div className="space-y-7">
                <p className="text-charcoal/80 text-base md:text-lg font-light leading-[1.8]">
                  Born from a belief that the bedroom is the most important room in
                  any home, Zhic was founded to elevate the everyday ritual of rest.
                </p>
                <p className="text-charcoal/80 text-base md:text-lg font-light leading-[1.8]">
                  Every piece in our collection is designed in our New York atelier
                  and brought to life by master craftspeople who share our obsession
                  with material, proportion, and comfort.
                </p>
                <p className="text-charcoal/80 text-base md:text-lg font-light leading-[1.8]">
                  We source sustainably, build to last, and believe that luxury is
                  not about excess — it&apos;s about intention.
                </p>

                {/* Stats row */}
                <div className="pt-8 grid grid-cols-3 gap-5">
                  {[
                    { value: '12', label: 'Years' },
                    { value: '40+', label: 'Artisans' },
                    { value: '6k', label: 'Homes' },
                  ].map((stat) => (
                    <div key={stat.label} className="glass-card rounded-2xl p-5 text-center">
                      <span className="font-serif text-3xl md:text-4xl text-charcoal block">{stat.value}</span>
                      <p className="text-[9px] text-stone mt-2 tracking-[0.25em] uppercase font-medium">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
