'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { PayloadDesign, PayloadMedia } from '@/lib/payload';
import './designs-slider.css';

export type DesignsSliderProps = {
  designs: PayloadDesign[];
};

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const toPersianDigits = (n: number) =>
  String(n).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d);

const SWIPE_THRESHOLD_PX = 40;
const CAPTION_FADE_MS = 200;

export function DesignsSlider({ designs }: DesignsSliderProps) {
  // ── Empty / sparse fallbacks ────────────────────────────────────────────
  if (designs.length === 0) {
    return (
      <section className="zh-slider-section">
        <p className="zh-slider-empty">به‌زودی طرح‌های ژیک به این صفحه اضافه می‌شوند.</p>
      </section>
    );
  }
  if (designs.length === 1) {
    return <SingleDesignFallback design={designs[0]!} />;
  }
  // ≥ 2 designs use the full slider

  return <Slider designs={designs} />;
}

// ─────────────────────────── Single-design fallback ───────────────────────

function SingleDesignFallback({ design }: { design: PayloadDesign }) {
  return (
    <section className="zh-slider-section" aria-label="گالری طرح‌ها">
      <div className="zh-slider-viewport" style={{ marginInline: 'clamp(36px, 8vw, 100px)' }}>
        <div className="zh-slider-track">
          <DesignTile design={design} isFocused />
        </div>
      </div>
      <div className="zh-slider-caption">
        <div className="zh-caption-name">{design.name}</div>
        {design.tagline ? <div className="zh-caption-tagline">{design.tagline}</div> : null}
      </div>
    </section>
  );
}

// ─────────────────────────── Main slider ─────────────────────────────────

function Slider({ designs }: { designs: PayloadDesign[] }) {
  const [focused, setFocused] = useState(0);
  const [captionChanging, setCaptionChanging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Center the focused tile in the viewport by transforming the track.
  // In RTL flex, positive translateX moves the track right, revealing items further along.
  useEffect(() => {
    const track = trackRef.current;
    if (!track || track.children.length === 0) return;
    const firstTile = track.children[0] as HTMLElement;
    const secondTile = track.children[1] as HTMLElement | undefined;
    const tileWidth = firstTile.getBoundingClientRect().width;
    const gap = secondTile
      ? Math.abs(secondTile.offsetLeft - firstTile.offsetLeft) - tileWidth
      : 0;
    const slot = tileWidth + gap;
    const shift = (focused - 1) * slot;
    track.style.transform = `translateX(${shift}px)`;
  }, [focused, designs.length]);

  // Cross-fade the caption when focused changes
  useEffect(() => {
    setCaptionChanging(true);
    const t = setTimeout(() => setCaptionChanging(false), CAPTION_FADE_MS);
    return () => clearTimeout(t);
  }, [focused]);

  const go = useCallback(
    (delta: number) => {
      setFocused((prev) => (prev + delta + designs.length) % designs.length);
    },
    [designs.length],
  );

  // Keyboard arrow keys (RTL: ArrowLeft = next, ArrowRight = prev)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.key === 'ArrowLeft') go(+1);
      else if (e.key === 'ArrowRight') go(-1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [go]);

  // Touch swipe
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    let startX = 0;
    const onStart = (e: TouchEvent) => {
      startX = e.changedTouches[0]?.clientX ?? 0;
    };
    const onEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0]?.clientX ?? 0;
      const dx = endX - startX;
      if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
      // RTL: swipe LEFT (negative dx) = next; swipe RIGHT (positive dx) = prev
      go(dx < 0 ? +1 : -1);
    };
    vp.addEventListener('touchstart', onStart, { passive: true });
    vp.addEventListener('touchend', onEnd);
    return () => {
      vp.removeEventListener('touchstart', onStart);
      vp.removeEventListener('touchend', onEnd);
    };
  }, [go]);

  const focusedDesign = designs[focused]!;

  return (
    <section className="zh-slider-section" aria-roledescription="carousel" aria-label="گالری طرح‌ها">
      <button
        type="button"
        className="zh-slider-arrow zh-prev"
        aria-label="طرح قبلی"
        onClick={() => go(-1)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M9 6L15 12L9 18" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        className="zh-slider-arrow zh-next"
        aria-label="طرح بعدی"
        onClick={() => go(+1)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M15 6L9 12L15 18" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div ref={viewportRef} className="zh-slider-viewport">
        <div ref={trackRef} className="zh-slider-track" role="list">
          {designs.map((d, i) => (
            <DesignTile
              key={d.id}
              design={d}
              isFocused={i === focused}
              onClick={() => {
                if (i === focused) return; // center click handled by inner <Link>
                setFocused(i);
              }}
            />
          ))}
        </div>
      </div>

      <div className="zh-slider-caption" data-changing={captionChanging || undefined} aria-live="polite">
        <div className="zh-caption-name">{focusedDesign.name}</div>
        {focusedDesign.tagline ? (
          <div className="zh-caption-tagline">{focusedDesign.tagline}</div>
        ) : null}
      </div>

      <div className="zh-slider-indicator">
        <div className="zh-slider-dots" role="tablist" aria-label="گزینش طرح">
          {designs.map((d, i) => (
            <button
              key={d.id}
              type="button"
              className="zh-slider-dot"
              role="tab"
              aria-selected={i === focused}
              aria-label={`طرح ${d.name}`}
              onClick={() => setFocused(i)}
            />
          ))}
        </div>
        <div className="zh-slider-counter" role="status">
          {toPersianDigits(focused + 1)} از {toPersianDigits(designs.length)}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────── Tile + helpers ──────────────────────────────

function DesignTile({
  design,
  isFocused,
  onClick,
}: {
  design: PayloadDesign;
  isFocused: boolean;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <div className="zh-tile-bg">
        <TileMedia design={design} />
      </div>
      <span className="zh-tile-eyebrow">طرح</span>
      <span className="zh-tile-name">{design.name}</span>
    </>
  );

  // Focused tile is a Link (click navigates). Dim tile is a div (click selects).
  if (isFocused) {
    return (
      <Link
        href={`/designs/${encodeURIComponent(design.slug)}`}
        className="zh-slider-tile"
        data-focused
        role="listitem"
        aria-label={`طرح ${design.name} (انتخاب‌شده، رفتن به صفحه‌ی طرح)`}
      >
        {inner}
      </Link>
    );
  }
  return (
    <div
      className="zh-slider-tile"
      role="listitem"
      onClick={onClick}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      aria-label={`طرح ${design.name} (انتخاب کنید برای دیدن)`}
    >
      {inner}
    </div>
  );
}

function TileMedia({ design }: { design: PayloadDesign }) {
  const media: PayloadMedia | null =
    design.sliderMedia ?? design.heroMedia ?? design.gallery?.[0] ?? null;
  if (!media?.url) return <TilePlaceholder />;
  if (media.mimeType?.startsWith('video/')) {
    return (
      <video src={media.url} autoPlay loop muted playsInline preload="metadata" />
    );
  }
  // image/* including image/gif — GIFs animate naturally in <img>
  return <img src={media.url} alt="" />;
}

function TilePlaceholder() {
  return <span className="zh-tile-watermark" aria-hidden>ژ</span>;
}
