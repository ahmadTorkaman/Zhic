'use client';

import { useEffect, useRef, useState } from 'react';
import { PayloadImage } from '@/components/PayloadImage';
import type { PayloadMedia } from '@/lib/payload';

export type HoverGalleryProps = {
  images: PayloadMedia[];
  alt: string;
  /** Applied to each <img>. */
  className?: string;
  fallbackText?: string;
};

/** ms per image while cycling on hover. */
const CYCLE_MS = 900;

/**
 * Stacked-image preview that cycles through a product's gallery while the
 * user hovers. Touch devices (no hover) see the cover only — taps navigate
 * via the parent link to the PDP where the full gallery lives.
 *
 * The cycling driver lives on this element's own mouseenter/leave (the
 * image area). If the user hovers over the title/meta below the image and
 * leaves the image, the cycle pauses and resets to the cover — that's a
 * reasonable "rest" behavior; the visible image is always the cover when
 * the cursor isn't over the gallery itself.
 */
export function HoverGallery({ images, alt, className, fallbackText }: HoverGalleryProps) {
  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Cycle through images while hovered; teardown clears the interval.
  useEffect(() => {
    if (!hovering || images.length < 2) return;
    timerRef.current = window.setInterval(() => {
      setActive((i) => (i + 1) % images.length);
    }, CYCLE_MS);
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [hovering, images.length]);

  // Snap back to the cover when hover ends so cards "rest" on their primary.
  useEffect(() => {
    if (!hovering) setActive(0);
  }, [hovering]);

  if (images.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-cream text-small text-stone">
        {fallbackText ?? 'تصویر به‌زودی'}
      </div>
    );
  }

  return (
    <div
      className="relative h-full w-full"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {images.map((m, i) => (
        <div
          key={m.id ?? i}
          className="absolute inset-0 transition-opacity duration-[var(--dur-base)] ease-[var(--ease-out-soft)]"
          style={{ opacity: i === active ? 1 : 0 }}
          aria-hidden={i !== active}
        >
          <PayloadImage
            media={m}
            alt={i === 0 ? alt : ''}
            className={className}
            loading={i === 0 ? 'eager' : 'lazy'}
          />
        </div>
      ))}
    </div>
  );
}
