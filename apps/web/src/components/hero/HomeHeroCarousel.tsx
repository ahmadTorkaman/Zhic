'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BlurInText, Button } from '@zhic/ui';
import './home-hero-carousel.css';

export type HeroSlide = {
  src: string;
  alt: string;
  link?: string;
};

export type HomeHeroCarouselProps = {
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  slides: HeroSlide[];
  /** Auto-rotate interval in ms. 0 disables. Default 5000. */
  intervalMs?: number;
};

const DEFAULT_HEADING = 'ساخته‌شده\nبرای ماندن';

export function HomeHeroCarousel({
  heading = DEFAULT_HEADING,
  slides,
  intervalMs = 5000,
}: HomeHeroCarouselProps) {
  const [idx, setIdx] = useState(0);
  const total = slides.length;
  const pausedRef = useRef(false);

  // Swipe state — dragX is the live finger offset in px while dragging.
  const [dragX, setDragX] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; moved: boolean; pointerId: number } | null>(null);
  const justDraggedRef = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    if (total <= 1) return;
    dragRef.current = { startX: e.clientX, moved: false, pointerId: e.pointerId };
    pausedRef.current = true;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    // Dead zone so taps/clicks on slide links still work untouched.
    if (!d.moved && Math.abs(dx) < 8) return;
    if (!d.moved) {
      d.moved = true;
      e.currentTarget.setPointerCapture(d.pointerId);
    }
    setDragX(dx);
  };

  const onPointerEnd = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    dragRef.current = null;
    // Mouse pointers stay paused — the cursor is still hovering the media
    // and onMouseLeave owns the unpause. Touch has no hover, release here.
    if (e.pointerType !== 'mouse') pausedRef.current = false;
    if (d.moved) {
      justDraggedRef.current = true;
      const w = viewportRef.current?.clientWidth ?? 1;
      const dx = e.clientX - d.startX;
      if (Math.abs(dx) > Math.min(80, w * 0.15)) {
        // RTL: the track translates RIGHT (+) as idx grows, so a rightward
        // drag pulls the NEXT slide (sitting to the left) into view.
        setIdx((i) => (dx > 0 ? Math.min(i + 1, total - 1) : Math.max(i - 1, 0)));
      }
    }
    setDragX(0);
  };

  const onClickCapture = (e: React.MouseEvent) => {
    // Swallow the click that follows a completed swipe so slide links
    // don't navigate.
    if (justDraggedRef.current) {
      justDraggedRef.current = false;
      e.preventDefault();
      e.stopPropagation();
    }
  };

  useEffect(() => {
    if (!intervalMs || total <= 1) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const id = setInterval(() => {
      if (!pausedRef.current) setIdx((i) => (i + 1) % total);
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, total]);

  return (
    <section
      className="zh-hhc"
      role="region"
      aria-roledescription="carousel"
      aria-label="کارویسل هیرو"
    >
      {/* Text half — order-2 on mobile, order-1 on desktop (RTL-start) */}
      <div className="zh-hhc__text">
        {/* Persian commas are rendered outside BlurInText (string-only) so
            they can carry the gold accent. */}
        <h1 className="zh-hhc__heading">
          {heading.split('،').map((seg, i, arr) => (
            <Fragment key={i}>
              <BlurInText as="span">{seg}</BlurInText>
              {i < arr.length - 1 && <span className="zh-hhc__comma">،</span>}
            </Fragment>
          ))}
        </h1>
        <div className="zh-hhc__cta-row">
          <Button as="a" href="/bedroom-set" variant="primary" size="lg" className="zh-hhc__cta">
            مشاهده‌ی محصولات
          </Button>
        </div>
      </div>

      {/* Media half — single-image carousel, dots only */}
      <div
        className="zh-hhc__media"
        onMouseEnter={() => (pausedRef.current = true)}
        onMouseLeave={() => (pausedRef.current = false)}
      >
        <div
          ref={viewportRef}
          className="zh-hhc__viewport"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onClickCapture={onClickCapture}
        >
          <div
            className={`zh-hhc__track${dragX !== 0 ? ' is-dragging' : ''}`}
            // RTL: flex children flow visually right-to-left, so slide N sits
            // to the LEFT of slide 0. To bring it into view we translate the
            // track to the RIGHT (positive translateX), not left.
            style={{ transform: `translateX(calc(${idx * 100}% + ${dragX}px))` }}
          >
            {slides.map((s, i) => {
              const inner = (
                <img
                  src={s.src}
                  alt={s.alt}
                  className="zh-hhc__slide-img"
                  loading={i === 0 ? 'eager' : 'lazy'}
                  fetchPriority={i === 0 ? 'high' : 'auto'}
                  draggable={false}
                />
              );
              return (
                <div className="zh-hhc__slide" key={i} aria-hidden={i !== idx}>
                  {s.link ? (
                    <Link href={s.link} className="zh-hhc__slide-link">
                      {inner}
                    </Link>
                  ) : (
                    inner
                  )}
                </div>
              );
            })}
          </div>

          {total > 1 && (
            <div className="zh-hhc__dots" role="tablist" aria-label="انتخاب اسلاید">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === idx}
                  aria-label={`اسلاید ${i + 1}`}
                  className={`zh-hhc__dot${i === idx ? ' is-active' : ''}`}
                  onClick={() => setIdx(i)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
