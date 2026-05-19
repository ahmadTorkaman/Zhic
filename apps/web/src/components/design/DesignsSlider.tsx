'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
const CAPTION_FADE_MS = 220;
const N_CLONES = 4;
const TRANSITION_MS = 1000; // 850ms track translate + 150ms safety buffer

export function DesignsSlider({ designs }: DesignsSliderProps) {
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
  return <Slider designs={designs} />;
}

function SingleDesignFallback({ design }: { design: PayloadDesign }) {
  return (
    <section className="zh-slider-section" aria-label="گالری طرح‌ها">
      <div
        className="zh-slider-viewport"
        style={{ marginInline: 'clamp(36px, 8vw, 100px)' }}
      >
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

function Slider({ designs }: { designs: PayloadDesign[] }) {
  const N = designs.length;
  const EXTENDED = useMemo(
    () => [
      ...designs.slice(N - N_CLONES),
      ...designs,
      ...designs.slice(0, N_CLONES),
    ],
    [designs, N],
  );

  const [focused, setFocused] = useState<number>(N_CLONES);
  const [captionChanging, setCaptionChanging] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const jumpTimerRef = useRef<number | null>(null);

  const realIndex = ((focused - N_CLONES) % N + N) % N;
  const focusedDesign = designs[realIndex]!;

  const isCloneIndex = useCallback(
    (ext: number) => ext < N_CLONES || ext >= N_CLONES + N,
    [N],
  );

  // Center the focused tile in the viewport using LAYOUT dimensions, NOT
  // getBoundingClientRect (which returns the scaled rect). offsetWidth /
  // offsetLeft give the un-scaled layout dims so the slot stays the same
  // regardless of which tile is currently focused.
  const recenter = useCallback(() => {
    const track = trackRef.current;
    const viewport = viewportRef.current;
    if (!track || !viewport || track.children.length < 2) return;
    const tile0 = track.children[0] as HTMLElement;
    const tile1 = track.children[1] as HTMLElement;
    const tileWidth = tile0.offsetWidth;
    const slot = Math.abs(tile1.offsetLeft - tile0.offsetLeft);
    const viewportWidth = viewport.offsetWidth;
    const shift = focused * slot - (viewportWidth - tileWidth) / 2;
    track.style.transform = `translateX(${shift}px)`;
  }, [focused]);

  useEffect(() => {
    recenter();
    window.addEventListener('resize', recenter);
    return () => window.removeEventListener('resize', recenter);
  }, [recenter]);

  // Caption cross-fade fires on REAL-INDEX change only. Silent jumps move
  // `focused` between equivalent clone/real positions; realIndex doesn't
  // change, so this effect doesn't re-run and the caption stays put.
  useEffect(() => {
    setCaptionChanging(true);
    const t = window.setTimeout(() => setCaptionChanging(false), CAPTION_FADE_MS);
    return () => window.clearTimeout(t);
  }, [realIndex]);

  // Schedule silent jump when focused lands on a clone. Listen for the
  // track's transform transitionend (most reliable) with a setTimeout
  // fallback in case the event doesn't fire (interrupted by another click,
  // slow tab, etc.).
  useEffect(() => {
    if (!isCloneIndex(focused)) return;
    const track = trackRef.current;
    if (!track) return;

    let fired = false;
    const fire = () => {
      if (fired) return;
      fired = true;
      track.removeEventListener('transitionend', onEnd);
      if (jumpTimerRef.current !== null) {
        window.clearTimeout(jumpTimerRef.current);
        jumpTimerRef.current = null;
      }
      performSilentJump();
    };
    const onEnd = (e: TransitionEvent) => {
      if (e.target !== track) return;
      if (e.propertyName !== 'transform') return;
      fire();
    };
    track.addEventListener('transitionend', onEnd);
    jumpTimerRef.current = window.setTimeout(fire, TRANSITION_MS);

    return () => {
      track.removeEventListener('transitionend', onEnd);
      if (jumpTimerRef.current !== null) {
        window.clearTimeout(jumpTimerRef.current);
        jumpTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- performSilentJump
    // is recreated each render and captures the current `focused` via closure;
    // including it in deps would cause an infinite re-schedule loop.
  }, [focused, isCloneIndex]);

  function performSilentJump() {
    const realFocused = (((focused - N_CLONES) % N) + N) % N + N_CLONES;
    setIsJumping(true);
    const track = trackRef.current;
    if (track) {
      track.style.transition = 'none';
      track.querySelectorAll<HTMLElement>('.zh-slider-tile, .zh-tile-bg').forEach((el) => {
        el.style.transition = 'none';
      });
    }
    setFocused(realFocused);

    // Force reflow so the no-transition state is committed before re-enabling.
    if (track) void track.offsetWidth;

    // Two animation frames before re-enabling — first paints the jumped state,
    // second re-arms transitions.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsJumping(false);
        const t = trackRef.current;
        if (t) {
          t.style.transition = '';
          t.querySelectorAll<HTMLElement>('.zh-slider-tile, .zh-tile-bg').forEach((el) => {
            el.style.transition = '';
          });
        }
      });
    });
  }

  const go = useCallback(
    (delta: number) => {
      setFocused((prev) => {
        let next = prev + delta;
        // Hard-wrap if user mashes past the clone padding.
        if (next < 0) next += N;
        else if (next >= EXTENDED.length) next -= N;
        return next;
      });
    },
    [N, EXTENDED.length],
  );

  // Keyboard arrows — RTL: ArrowLeft = next, ArrowRight = prev
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

  // Touch swipe — cards follow finger
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
      go(dx < 0 ? -1 : +1);
    };
    vp.addEventListener('touchstart', onStart, { passive: true });
    vp.addEventListener('touchend', onEnd);
    return () => {
      vp.removeEventListener('touchstart', onStart);
      vp.removeEventListener('touchend', onEnd);
    };
  }, [go]);

  return (
    <section
      className={`zh-slider-section${isJumping ? ' is-jumping' : ''}`}
      aria-roledescription="carousel"
      aria-label="گالری طرح‌ها"
    >
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
          {EXTENDED.map((d, extIdx) => (
            <DesignTile
              key={`${d.id}-${extIdx}`}
              design={d}
              isFocused={extIdx === focused}
              onClick={() => {
                if (extIdx === focused) return;
                setFocused(extIdx);
              }}
            />
          ))}
        </div>
      </div>

      <div
        className="zh-slider-caption"
        data-changing={captionChanging || undefined}
        aria-live="polite"
      >
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
              aria-selected={i === realIndex}
              aria-label={`طرح ${d.name}`}
              onClick={() => setFocused(N_CLONES + i)}
            />
          ))}
        </div>
        <div className="zh-slider-counter" role="status">
          {toPersianDigits(realIndex + 1)} از {toPersianDigits(N)}
        </div>
      </div>
    </section>
  );
}

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
    </>
  );

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
  if (!media?.url) return null;
  if (media.mimeType?.startsWith('video/')) {
    return <video src={media.url} autoPlay loop muted playsInline preload="metadata" />;
  }
  return <img src={media.url} alt="" />;
}
