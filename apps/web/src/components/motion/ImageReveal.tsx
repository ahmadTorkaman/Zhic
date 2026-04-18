import type { ReactNode } from 'react';

export type ImageRevealProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Image reveal wrapper. Previously used GSAP + clipPath inset to
 * animate the image in from below with a 1.08→1.0 scale. The clipped
 * initial state hid the image until hydration; if the scroll trigger
 * didn't fire, images stayed invisible. Replaced with a plain
 * passthrough for now — the image renders normally and any reveal
 * motion can be reintroduced via CSS once the motion system is
 * redesigned to be progressive-enhancement.
 */
export function ImageReveal({ children, className }: ImageRevealProps) {
  return <div className={className}>{children}</div>;
}
