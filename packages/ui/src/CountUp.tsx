'use client';

import { useEffect, useRef } from 'react';
import { easeOutCubic, formatCountUpValue } from './count-up-math';
import { cn } from './cn';

export type CountUpProps = {
  /** Numeric target. The ticker animates 0 → value. */
  value: number;
  /** Appended verbatim after the formatted value (e.g. '+'). Default ''. */
  suffix?: string;
  /** Total animation time in ms. Default 1500. */
  duration?: number;
  className?: string;
};

export function CountUp({ value, suffix = '', duration = 1500, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      el.textContent = formatCountUpValue(value, suffix);
      return;
    }

    el.textContent = formatCountUpValue(0, suffix);

    let rafId: number | null = null;
    let started: number | null = null;

    const step = (now: number) => {
      if (started === null) started = now;
      const t = Math.min(1, (now - started) / duration);
      const v = value * easeOutCubic(t);
      el.textContent = formatCountUpValue(v, suffix);
      if (t < 1) rafId = requestAnimationFrame(step);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            rafId = requestAnimationFrame(step);
            io.unobserve(el);
          }
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [value, suffix, duration]);

  return <span ref={ref} className={cn('tabular-nums', className)} aria-label={`${value}${suffix}`} />;
}
