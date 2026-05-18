'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@zhic/ui';
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

const DEFAULT_EYEBROW = 'کلکسیون بهار ۱۴۰۵';
const DEFAULT_HEADING = 'ساخته‌شده\nبرای ماندن';
const DEFAULT_SUB =
  'مبلمان دست‌ساز از چوب گردوی ایرانی، برای خانه‌هایی که آرامش را می‌فهمند.';

export function HomeHeroCarousel({
  eyebrow = DEFAULT_EYEBROW,
  heading = DEFAULT_HEADING,
  subheading = DEFAULT_SUB,
  slides,
  intervalMs = 5000,
}: HomeHeroCarouselProps) {
  const [idx, setIdx] = useState(0);
  const total = slides.length;
  const pausedRef = useRef(false);

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
        <div className="zh-hhc__eyebrow">{eyebrow}</div>
        <h1 className="zh-hhc__heading">{heading}</h1>
        <p className="zh-hhc__sub">{subheading}</p>
        <div className="zh-hhc__cta-row">
          <Button as="a" href="/products" variant="primary" size="lg">
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
        <div className="zh-hhc__viewport">
          <div
            className="zh-hhc__track"
            style={{ transform: `translateX(${idx * 100}%)` }}
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
