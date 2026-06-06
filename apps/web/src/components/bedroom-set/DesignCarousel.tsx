'use client';

import * as React from 'react';
import Link from 'next/link';
import type { DesignCard, Occupancy } from './placeholder-data';
import { cardForOccupancy, OCCUPANCY_ORDER } from './placeholder-data';
import { CategoryTabs } from './CategoryTabs';
import { RotatingLogo } from './RotatingLogo';
import { CardImage } from './CardImage';
import {
  clampIndex, slot,
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
  // Selected room-type tab — drives which card variant each design shows.
  const [activeOccupancy, setActiveOccupancy] = React.useState<Occupancy | null>(
    () => OCCUPANCY_ORDER.find((o) => designs[0]?.occupancies.includes(o)) ?? null,
  );

  // DOM refs
  const stageRef = React.useRef<HTMLDivElement | null>(null);
  const cardRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  // engine state (never React state — written per frame via refs)
  const progressRef = React.useRef(0);
  const rafRef = React.useRef<number | null>(null);
  const slotRef = React.useRef(0);
  const lastNearRef = React.useRef(-1);
  const cardHidRef = React.useRef<boolean[]>([]);
  const cardBlurRef = React.useRef<number[]>([]);
  const interactedRef = React.useRef(false); // true once the user drags/wheels/keys — suppresses the one-time nudge
  const viewRef = React.useRef(view);
  React.useEffect(() => { viewRef.current = view; }, [view]);
  // Mirror the mockup's openFeatured(): cancel any in-flight snap when leaving the carousel view.
  React.useEffect(() => {
    if (view !== 'designs' && rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, [view]);

  // Keep the selected room-type valid as the focused design changes (persist if
  // the new design still offers it, else fall back to its first occupancy).
  React.useEffect(() => {
    const occs = designs[focused]?.occupancies ?? [];
    setActiveOccupancy((cur) => {
      const valid = OCCUPANCY_ORDER.filter((o) => occs.includes(o));
      return cur && valid.includes(cur) ? cur : valid[0] ?? null;
    });
  }, [focused, designs]);

  const computeSlot = React.useCallback(() => {
    const mob = window.matchMedia('(max-width:768px)').matches;
    return slot(window.innerHeight, mob);
  }, []);

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
    const near = clampIndex(Math.round(vp), N);
    if (near !== lastNearRef.current) {
      lastNearRef.current = near;
      setFocused(near);
    }
  }, [N, computeSlot]);

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
      interactedRef.current = true;
      dragging = true;
      sx = e.clientX; sy = e.clientY; sp = progressRef.current; axis = null;
      downCard = (e.target as HTMLElement).closest?.('.zh-bs-card') ?? null;
      if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging || viewRef.current !== 'designs') return;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      if (axis === null) {
        if (Math.abs(dx) > 6 || Math.abs(dy) > 6) axis = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
        else return;
        // Capture the pointer only once a horizontal drag actually begins. Capturing
        // on pointerdown (as the mockup did) retargets the ensuing click to the stage,
        // swallowing mouse clicks on the dots, room-type tabs, and cards underneath.
        if (axis === 'h' && e.pointerType === 'mouse') {
          try { stage.setPointerCapture(e.pointerId); } catch { /* noop */ }
        }
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
      interactedRef.current = true;
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
      if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) interactedRef.current = true;
      if (e.key === 'ArrowRight') { e.preventDefault(); go(Math.round(progressRef.current) + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(Math.round(progressRef.current) - 1); }
      else if (e.key === 'Enter') { onOpenDesign(designs[clampIndex(Math.round(progressRef.current), N)]!); }
      else if (e.key === 'Home') { e.preventDefault(); go(0); }
      else if (e.key === 'End') { e.preventDefault(); go(N - 1); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [N, go, designs, onOpenDesign]);

  // One-time "swipe me" nudge: gently glide the focused card toward the next
  // and settle back, revealing the peeking neighbour — skipped if the user has
  // already interacted or prefers reduced motion.
  React.useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const start = setTimeout(() => {
      if (interactedRef.current || viewRef.current !== 'designs') return;
      const peak = 0.26;
      const dur = 1150;
      const t0 = performance.now();
      const tick = (now: number) => {
        if (interactedRef.current) { progressRef.current = 0; render(); return; }
        const k = Math.min(1, (now - t0) / dur);
        progressRef.current = peak * Math.sin(k * Math.PI); // 0 → peak → 0
        render();
        if (k < 1) raf = requestAnimationFrame(tick);
        else { progressRef.current = 0; render(); }
      };
      raf = requestAnimationFrame(tick);
    }, 900);
    return () => { clearTimeout(start); if (raf) cancelAnimationFrame(raf); };
  }, [render]);

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
              {/* Every card reflects the room-type tabs: when the active occupancy
                  has a dedicated «-card» image the card dissolves to it, else it
                  stays on its base banner (cardForOccupancy falls back). */}
              <CardImage src={cardForOccupancy(d, activeOccupancy)} alt={d.name} />
            </div>
          ))}
        </div>
        <div className="zh-bs-focus">
          <div className="zh-bs-band" style={{ opacity: designs[focused]?.logoSrc ? 1 : 0 }} />
          <RotatingLogo src={designs[focused]?.logoSrc} />
        </div>
        {/* Preload the name-marks so RotatingLogo's slide-in never flashes a blank. */}
        <div aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
          {designs.map((d) =>
            d.logoSrc ? (
              /* eslint-disable-next-line @next/next/no-img-element -- preload only */
              <img key={d.slug} src={d.logoSrc} alt="" />
            ) : null,
          )}
        </div>
      </div>

      <CategoryTabs
        occupancies={designs[focused]?.occupancies ?? []}
        active={activeOccupancy}
        onSelect={setActiveOccupancy}
      />
    </div>
  );
}
