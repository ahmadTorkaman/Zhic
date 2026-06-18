'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { DotsIndicator } from '@zhic/ui';
import type { ShowcaseSlide } from '@/lib/bedroom-furniture';
import { BrandDivider } from './BrandDivider';
import styles from './CategoryShowcase.module.css';

export type CategoryShowcaseProps = {
  slides: ShowcaseSlide[];
  lorem: string;
  /** Slide centered on first render. */
  initialActive?: number;
  /** Section heading; defaults to the comp value. */
  heading?: string;
};

/**
 * Category showcase (Figma 191:217) — a swipeable coverflow of arched product
 * thumbnails with the active slide featured at center. Drag left/right, tap a
 * side arch to bring it to center, or use the dots; the centered arch links to
 * its category.
 */
export function CategoryShowcase({ slides, lorem, initialActive = 0, heading }: CategoryShowcaseProps) {
  const n = slides.length;
  const [active, setActive] = useState(initialActive);
  const dragStart = useRef<number | null>(null);
  const didDrag = useRef(false);

  const go = (dir: number) => setActive((a) => (a + dir + n) % n);

  const onPointerDown = (e: React.PointerEvent) => {
    dragStart.current = e.clientX;
    didDrag.current = false;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragStart.current != null && Math.abs(e.clientX - dragStart.current) > 8) {
      didDrag.current = true;
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (dragStart.current == null) return;
    const dx = e.clientX - dragStart.current;
    dragStart.current = null;
    if (Math.abs(dx) > 30) go(dx < 0 ? 1 : -1); // drag left → next, right → prev
  };

  // Position of slide i relative to the active one (with wrap-around).
  const roleOf = (i: number): 'center' | 'left' | 'right' | 'hidden' => {
    const raw = (i - active + n) % n;
    if (raw === 0) return 'center';
    if (raw === 1) return 'right';
    if (raw === n - 1) return 'left';
    return 'hidden';
  };

  return (
    <section className={styles.card} aria-label="دسته‌بندی محصولات">
      <BrandDivider />
      <h2 className={styles.heading}>{heading ?? 'دسته بندی محصولات'}</h2>

      <div
        className={styles.coverflow}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {slides.map((s, i) => {
          const role = roleOf(i);
          return (
            <a
              key={s.key}
              href={s.href}
              className={`${styles.item} ${styles[role]}`}
              aria-hidden={role === 'hidden'}
              tabIndex={role === 'hidden' ? -1 : 0}
              draggable={false}
              onClick={(e) => {
                if (didDrag.current) {
                  e.preventDefault();
                  return;
                }
                if (role !== 'center') {
                  e.preventDefault();
                  setActive(i);
                }
              }}
            >
              <div className={styles.arch}>
                <Image src={s.img} alt={s.label} fill sizes="(max-width: 480px) 50vw, 240px" draggable={false} />
              </div>
              <div className={styles.pill}>
                <span className={styles.pillLabel}>{s.label}</span>
              </div>
            </a>
          );
        })}
      </div>

      <DotsIndicator count={n} active={active} className={styles.dots} onSelect={setActive} />
      <p className={styles.drag}>به چپ و راست بکشید</p>

      <div className={styles.lorem}>
        <p className={styles.loremText}>{lorem}</p>
      </div>
    </section>
  );
}
