import type { CSSProperties, ReactNode } from 'react';

export type BlockRevealProps = {
  children: ReactNode;
  /** Animation delay in seconds. Converted to ms for the CSS variable. */
  delay?: number;
  className?: string;
};

/**
 * Content reveal wrapper. Content renders visible by default and
 * animates in via a pure CSS keyframe (`reveal-up` in base.css). If
 * CSS or JS fail to load, content stays readable — the previous
 * GSAP-based implementation left content permanently hidden when
 * hydration or the scroll trigger failed.
 *
 * Respects `prefers-reduced-motion` via the CSS rule.
 */
export function BlockReveal({ children, delay = 0, className }: BlockRevealProps) {
  const classes = className ? `block-reveal ${className}` : 'block-reveal';
  const style: CSSProperties | undefined =
    delay > 0 ? { ['--reveal-delay' as string]: `${Math.round(delay * 1000)}ms` } : undefined;
  return (
    <div className={classes} style={style}>
      {children}
    </div>
  );
}
