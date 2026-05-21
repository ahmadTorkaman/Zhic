'use client';

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type PropsWithChildren,
  createElement,
} from 'react';

export type FadeUpProps = PropsWithChildren<{
  /** Delay in ms before this element starts animating. Useful for stagger. */
  delay?: number;
  /** Forwarded to the wrapper. */
  className?: string;
  /** Wrapping HTML tag. Default 'div'. */
  as?: ElementType;
}>;

/**
 * Whole-block come-up fade-in. Triggered the first time the element
 * crosses 15% of viewport. Once revealed, observation is dropped.
 *
 * Reduced-motion users see the content instantly with no transition.
 * Match BlurInText's 700ms cubic-bezier(0.22, 1, 0.36, 1) curve for
 * site-wide consistency.
 */
export function FadeUp({
  children,
  delay = 0,
  className,
  as = 'div',
}: FadeUpProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  // Reduced-motion check at render time (effectively static for the session).
  // Reading matchMedia here is fine — it's not stateful from React's perspective.
  const prefersReduced =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReduced) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            io.unobserve(el);
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [prefersReduced]);

  const style: CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(16px)',
    transition: prefersReduced
      ? 'none'
      : 'opacity 700ms cubic-bezier(0.22, 1, 0.36, 1), transform 700ms cubic-bezier(0.22, 1, 0.36, 1)',
    transitionDelay: prefersReduced ? '0ms' : `${delay}ms`,
    willChange: visible ? 'auto' : 'opacity, transform',
  };

  return createElement(as, { ref, className, style }, children);
}
