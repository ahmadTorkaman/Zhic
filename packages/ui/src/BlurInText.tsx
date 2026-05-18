'use client';

import { createElement, useEffect, useMemo, useRef, useState, type CSSProperties, type ElementType } from 'react';
import { splitIntoWords } from './text-split';

export type BlurInTextProps = {
  /** The text to animate. */
  children: string;
  /** Delay per word index in ms. Default 90. */
  stagger?: number;
  /** Transition duration per word in ms. Default 700. */
  duration?: number;
  /** Wrapping HTML tag. Default 'span'. */
  as?: ElementType;
  /** Forwarded to the wrapper. */
  className?: string;
};

/**
 * Word-by-word blur-in reveal triggered on first scroll-into-view.
 *
 * The text is split once on mount and each word is wrapped in an inline-block
 * span with a transition-delay derived from its word index. Whitespace is
 * preserved as plain text nodes between word spans, so Persian glyph shaping
 * stays intact within each word.
 *
 * @remarks
 * The component assumes `children` is static — the wrapped pieces are keyed
 * by array index. If `children` changes after mount, the existing word spans
 * will be reused under the same keys and the per-word animation state may
 * become stale. For dynamic text, remount the component (e.g. via a `key`
 * prop on the parent) instead of mutating `children`.
 */
export function BlurInText({
  children,
  stagger = 90,
  duration = 700,
  as = 'span',
  className,
}: BlurInTextProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const pieces = useMemo(() => splitIntoWords(children), [children]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
  }, []);

  let wordIdx = 0;
  const wordSpans = pieces.map((piece, i) => {
    if (piece.type === 'whitespace') {
      return <span key={i}>{piece.value}</span>;
    }
    const idx = wordIdx++;
    const style: CSSProperties = {
      display: 'inline-block',
      opacity: visible ? 1 : 0,
      filter: visible ? 'blur(0)' : 'blur(18px)',
      transition: `opacity ${duration}ms cubic-bezier(0.22, 1, 0.36, 1), filter ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`,
      transitionDelay: `${idx * stagger}ms`,
      willChange: visible ? 'auto' : 'opacity, filter',
    };
    return (
      <span key={i} style={style}>
        {piece.value}
      </span>
    );
  });

  // Use createElement so the polymorphic `as` prop typechecks cleanly with a ref.
  return createElement(as, { ref, className }, wordSpans);
}
