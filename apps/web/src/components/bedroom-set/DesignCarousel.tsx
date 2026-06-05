'use client';

import * as React from 'react';
import Link from 'next/link';
import { toPersianDigits } from '@zhic/locale';
import type { DesignCard } from './placeholder-data';
import { CategoryTabs } from './CategoryTabs';
import {
  clampIndex, slot, flipAngle, activeLogoIndex,
  bandOpacity, bandBlurPx, flipOpacity,
  cardScale, cardOpacity, cardBlurPx, cardZIndex, isCulled,
  snapDuration, easeOutQuart,
} from './carousel-math';

type View = 'designs' | 'featured';

export function DesignCarousel({
  designs,
  view,
  onOpenDesign,
}: {
  designs: DesignCard[];
  view: View;
  onOpenDesign: (d: DesignCard) => void;
}) {
  const N = designs.length;
  const [focused, setFocused] = React.useState(0);

  // DOM refs
  const stageRef = React.useRef<HTMLDivElement | null>(null);
  const cardRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const logoRefs = React.useRef<(HTMLImageElement | null)[]>([]);
  const bandRef = React.useRef<HTMLDivElement | null>(null);
  const flipRef = React.useRef<HTMLDivElement | null>(null);

  // engine state (never React state — written per frame via refs)
  const progressRef = React.useRef(0);
  const rafRef = React.useRef<number | null>(null);
  const slotRef = React.useRef(0);
  const curLogoRef = React.useRef(0);
  const lastNearRef = React.useRef(-1);
  const cardHidRef = React.useRef<boolean[]>([]);
  const cardBlurRef = React.useRef<number[]>([]);
  const bandBlurRef = React.useRef(-1);
  const viewRef = React.useRef(view);
  React.useEffect(() => { viewRef.current = view; }, [view]);

  const computeSlot = React.useCallback(() => {
    const mob = window.matchMedia('(max-width:768px)').matches;
    return slot(window.innerWidth, window.innerHeight, mob);
  }, []);

  const updateGlass = React.useCallback(() => {
    const p = clampIndex(progressRef.current, N);
    const lo = Math.floor(p);
    const hi = Math.min(lo + 1, N - 1);
    const frac = p - lo;
    const active = activeLogoIndex(lo, hi, frac);
    if (active !== curLogoRef.current) {
      const prevLogo = logoRefs.current[curLogoRef.current];
      const nextLogo = logoRefs.current[active];
      if (prevLogo) prevLogo.style.opacity = '0';
      if (nextLogo) nextLogo.style.opacity = '1';
      curLogoRef.current = active;
    }
    const flip = flipRef.current;
    if (flip) {
      flip.style.transform = `rotateX(${flipAngle(frac).toFixed(2)}deg)`;
      flip.style.opacity = flipOpacity(frac).toFixed(3);
    }
    const band = bandRef.current;
    if (band) {
      band.style.opacity = bandOpacity(frac).toFixed(3);
      const bb = bandBlurPx(frac);
      if (bandBlurRef.current !== bb) {
        bandBlurRef.current = bb;
        band.style.filter = `blur(${bb}px)`;
      }
    }
  }, [N]);

  const render = React.useCallback(() => {
    if (slotRef.current === 0) slotRef.current = computeSlot();
    const s = slotRef.current;
    const vp = progressRef.current;
    for (let i = 0; i < N; i++) {
      const c = cardRefs.current[i];
      if (!c) continue;
      const d = i - vp;
      const ad = Math.abs(d);
      if (isCulled(ad)) {
        if (cardHidRef.current[i] !== true) {
          cardHidRef.current[i] = true;
          c.style.visibility = 'hidden';
          c.style.opacity = '0';
          c.style.filter = 'none';
        }
        continue;
      }
      if (cardHidRef.current[i]) {
        cardHidRef.current[i] = false;
        c.style.visibility = 'visible';
      }
      c.style.transform = `translate(-50%,-50%) translateX(${(-d * s).toFixed(1)}px) scale(${cardScale(ad).toFixed(3)})`;
      c.style.opacity = cardOpacity(ad).toFixed(3);
      const bl = cardBlurPx(ad);
      if (cardBlurRef.current[i] !== bl) {
        cardBlurRef.current[i] = bl;
        c.style.filter = `blur(${bl}px)`;
      }
      c.style.zIndex = String(cardZIndex(ad));
    }
    updateGlass();
    const near = clampIndex(Math.round(vp), N);
    if (near !== lastNearRef.current) {
      lastNearRef.current = near;
      setFocused(near);
    }
  }, [N, computeSlot, updateGlass]);

  const snapTo = React.useCallback((target: number) => {
    const t = clampIndex(Math.round(target), N);
    if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    const from = progressRef.current;
    const dist = t - from;
    if (Math.abs(dist) < 1e-3) { progressRef.current = t; render(); return; }
    const dur = snapDuration(dist);
    const t0 = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      progressRef.current = from + dist * easeOutQuart(k);
      render();
      if (k < 1) rafRef.current = requestAnimationFrame(tick);
      else { progressRef.current = t; render(); rafRef.current = null; }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [N, render]);

  const go = React.useCallback((i: number) => snapTo(i), [snapTo]);

  // initial layout + resize
  React.useLayoutEffect(() => {
    slotRef.current = computeSlot();
    render();
    const onResize = () => { slotRef.current = computeSlot(); render(); };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [computeSlot, render]);

  // pointer drag — capture for mouse only so touch vertical-pan scrolls natively
  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let dragging = false;
    let sx = 0, sy = 0, sp = 0;
    let axis: 'h' | 'v' | null = null;
    let downCard: HTMLElement | null = null;

    const onDown = (e: PointerEvent) => {
      if (viewRef.current !== 'designs') return;
      dragging = true;
      sx = e.clientX; sy = e.clientY; sp = progressRef.current; axis = null;
      downCard = (e.target as HTMLElement).closest?.('.zh-bs-card') ?? null;
      if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      if (e.pointerType === 'mouse') { try { stage.setPointerCapture(e.pointerId); } catch { /* noop */ } }
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging || viewRef.current !== 'designs') return;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      if (axis === null) {
        if (Math.abs(dx) > 6 || Math.abs(dy) > 6) axis = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
        else return;
      }
      if (axis === 'h') {
        progressRef.current = clampIndex(sp + dx / (slotRef.current || computeSlot()), N);
        render();
      }
    };
    const endDrag = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      if (viewRef.current !== 'designs') return;
      if (axis === 'h') { snapTo(Math.round(progressRef.current)); return; }
      if (axis === 'v') return;
      const cardEl = ((e.target as HTMLElement).closest?.('.zh-bs-card') as HTMLElement | null) ?? downCard;
      if (cardEl) {
        const i = Number(cardEl.dataset.i);
        if (i === Math.round(progressRef.current)) onOpenDesign(designs[i]!);
        else snapTo(i);
      } else {
        snapTo(Math.round(progressRef.current));
      }
    };
    const onCancel = () => {
      if (!dragging) return;
      dragging = false;
      if (viewRef.current === 'designs') snapTo(Math.round(progressRef.current));
    };

    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', onCancel);
    return () => {
      stage.removeEventListener('pointerdown', onDown);
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerup', endDrag);
      stage.removeEventListener('pointercancel', onCancel);
    };
  }, [N, computeSlot, render, snapTo, designs, onOpenDesign]);

  // wheel — horizontal only drives the carousel; vertical scrolls the page
  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let idle: ReturnType<typeof setTimeout> | null = null;
    const onWheel = (e: WheelEvent) => {
      if (viewRef.current !== 'designs' || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      progressRef.current = clampIndex(progressRef.current + e.deltaX / 700, N);
      render();
      if (idle) clearTimeout(idle);
      idle = setTimeout(() => snapTo(Math.round(progressRef.current)), 130);
    };
    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => { stage.removeEventListener('wheel', onWheel); if (idle) clearTimeout(idle); };
  }, [N, render, snapTo]);

  // keyboard (designs view only)
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (viewRef.current !== 'designs') return;
      if (e.key === 'ArrowRight') { e.preventDefault(); go(Math.round(progressRef.current) + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(Math.round(progressRef.current) - 1); }
      else if (e.key === 'Enter') { onOpenDesign(designs[clampIndex(Math.round(progressRef.current), N)]!); }
      else if (e.key === 'Home') { e.preventDefault(); go(0); }
      else if (e.key === 'End') { e.preventDefault(); go(N - 1); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [N, go, designs, onOpenDesign]);

  return (
    <div className="zh-bs-stage" ref={stageRef}>
      <header className="zh-bs-top">
        <nav className="zh-bs-crumb">
          <Link href="/">خانه</Link> / طرح‌ها
        </nav>
        <div className="zh-bs-dots" role="tablist" aria-label="گزینش طرح">
          {designs.map((d, i) => (
            <button
              key={d.slug}
              type="button"
              role="tab"
              aria-label={d.name}
              aria-selected={i === focused}
              className={`zh-bs-dot${i === focused ? ' on' : ''}`}
              onClick={() => go(i)}
            />
          ))}
        </div>
      </header>

      <div className="zh-bs-strip">
        <div className="zh-bs-track">
          {designs.map((d, i) => (
            <div
              key={d.slug}
              className="zh-bs-card"
              data-i={i}
              ref={(el) => { cardRefs.current[i] = el; }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- 1:1 parity; SP1 swaps to PayloadImage */}
              <img src={d.cardSrc} alt={d.name} />
            </div>
          ))}
        </div>
        <div className="zh-bs-focus">
          <div className="zh-bs-band" ref={bandRef} />
          <div className="zh-bs-flip" ref={flipRef}>
            {designs.map((d, i) => (
              /* eslint-disable-next-line @next/next/no-img-element -- pre-decoded logo layers */
              <img
                key={d.slug}
                className="zh-bs-lg"
                alt={d.name}
                src={d.logoSrc}
                style={{ opacity: i === 0 ? 1 : 0 }}
                ref={(el) => { logoRefs.current[i] = el; }}
              />
            ))}
          </div>
        </div>
      </div>

      <footer className="zh-bs-prompt">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M9 6 L15 12 L9 18" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>{`طرح ${toPersianDigits(focused + 1)} از ${toPersianDigits(N)}`}</span>
      </footer>

      <CategoryTabs />
    </div>
  );
}
