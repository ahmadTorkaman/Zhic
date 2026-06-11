'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { computeParallaxOffset } from './parallax-math';
import { cn } from './cn';

export type ParallaxImageProps = {
  src: string;
  alt: string;
  /**
   * Vertical parallax strength as a percentage. 80 = inner image is 80%
   * taller than the container, drifting ±40% of the container height at
   * full progress. Practical range 0-150; values above 100 produce a more
   * dramatic effect at the cost of more cropped image visible area.
   * Default 80.
   */
  verticalAmount?: number;
  /** Container border-radius in px (applied to the visual container only). */
  borderRadius?: number;
  /** Container border-top-right-radius in px (overrides borderRadius for that corner). */
  topRightRadius?: number;
  /**
   * Shifts the image content upward inside the frame by this % of container
   * height (the visible window moves down the source image). The extra
   * height is added ABOVE the frame only, so the parallax range can never
   * expose a gap at either edge. Default 0.
   */
  shiftUp?: number;
  className?: string;
};

export function ParallaxImage({
  src,
  alt,
  verticalAmount = 80,
  borderRadius,
  topRightRadius,
  shiftUp = 0,
  className,
}: ParallaxImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let rafId: number | null = null;
    let ticking = false;

    const update = () => {
      const rect = container.getBoundingClientRect();
      const y = computeParallaxOffset(
        {
          rectTop: rect.top,
          containerHeight: container.offsetHeight,
          viewportHeight: window.innerHeight,
        },
        verticalAmount,
      );
      inner.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      rafId = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [verticalAmount]);

  const overflowPct = Math.abs(verticalAmount) / 2;
  const innerStyle: CSSProperties = {
    position: 'absolute',
    insetInlineStart: 0,
    insetInlineEnd: 0,
    top: `-${overflowPct + shiftUp}%`,
    bottom: `-${overflowPct}%`,
    width: '100%',
    height: `calc(100% + ${Math.abs(verticalAmount) + shiftUp}%)`,
    objectFit: 'cover',
    willChange: 'transform',
    backfaceVisibility: 'hidden',
    userSelect: 'none',
    pointerEvents: 'none',
  };
  const containerStyle: CSSProperties = {
    borderRadius: borderRadius != null ? `${borderRadius}px` : undefined,
    borderTopRightRadius: topRightRadius != null ? `${topRightRadius}px` : undefined,
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      style={containerStyle}
    >
      <img ref={innerRef} src={src} alt={alt} style={innerStyle} draggable={false} />
    </div>
  );
}
