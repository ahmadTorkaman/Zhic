import type { ElementType } from 'react';

export type WordRevealProps = {
  children: string;
  as?: 'h1' | 'h2';
  className?: string;
};

/**
 * Heading reveal. Previously split the text into characters and
 * animated each via GSAP — the initial state of `translateY(110%)`
 * left content invisible on SSR and indefinitely if hydration or
 * the scroll trigger failed. Replaced with a plain opacity fade
 * (`.word-reveal` in base.css) that respects prefers-reduced-motion.
 */
export function WordReveal({
  children,
  as: Tag = 'h1',
  className,
}: WordRevealProps) {
  const Component = Tag as ElementType;
  const classes = className ? `word-reveal ${className}` : 'word-reveal';
  return <Component className={classes}>{children}</Component>;
}
