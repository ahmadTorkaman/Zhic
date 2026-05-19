# Designs Index — Big Carousel Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the `/designs` carousel into the "Big Carousel" treatment — focused tile dominates (1.35× / 1.45× mobile), dim tiles recede (0.55× / 0.42×, 3px blur, 40% opacity), 45% media bleed past the focused tile's inline-end edge, big overlapping caption, infinite loop via clone tiles + silent jump. Plus operator-specific overrides: forest stroke only (no shadow), forest-tinted empty-state gradient, watermark «ژ» removed, per-tile name removed.

**Architecture:** Single component rewrite — `DesignsSlider.tsx` and `designs-slider.css` are tightly coupled (CSS classnames + data attributes) and ship as one bundled change. No new files, no new dependencies, no new fields. `page.tsx` is untouched. The clone-tile infinite loop uses an EXTENDED array `[tail clones, ...designs, head clones]` with silent-jump teardown via a transition-kill class + belt-and-suspenders inline `transition:none`. `prefers-reduced-motion: reduce` removes all transforms, transitions, and the pulse animation.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Tailwind v4 + design-system CSS tokens. No new packages.

**Spec:** `docs/superpowers/specs/2026-05-20-designs-big-carousel-design.md`
**Supersedes (visual treatment only):** `docs/superpowers/plans/2026-05-17-designs-index-page.md`

---

## File structure

### Files modified

| Path | Change |
|---|---|
| `apps/web/src/components/design/DesignsSlider.tsx` | Rewrite. Same `DesignsSliderProps` (no breaking change). Adds EXTENDED clone array, silent-jump effect, drops `<TilePlaceholder>` component, drops per-tile name. Three new constants (`N_CLONES`, `TRANSITION_MS`, `CAPTION_FADE_MS=220`). |
| `apps/web/src/components/design/designs-slider.css` | Rewrite. New CSS variable knobs (`--tile-scale-focused`, `--tile-scale-dim`, `--tile-opacity-dim`, `--tile-blur-dim`, `--spill-pct`). Pulse-dot `::after` + keyframes. `.is-jumping` transition-kill rule. Mobile media query overrides. |
| `docs/state.md` | Mark the 2026-05-17 "Designs index page" row as **revised**; add new "Designs index — Big Carousel" row; add follow-ups `FU-BC-a..e`. |

### Files explicitly NOT modified

- `apps/web/src/app/(site)/designs/page.tsx` — `<DesignsSlider designs={designs} />` call stays unchanged
- `apps/web/src/lib/payload.ts` — `fetchAllDesigns` and `PayloadDesign` shapes unchanged
- `apps/web/src/components/design/DesignHero.tsx`, `DesignMoodboard.tsx`, `DesignStory.tsx` — detail-page concerns, untouched
- `services/api/src/collections/Designs.ts` — schema unchanged
- `packages/design-system/*` — uses existing tokens (forest, ivory, cream, sand, stone, charcoal, ink, ease-out-soft, ease-out-quint, dur-hover)

---

## Notes for the implementer

- **The rewrite drops `<TilePlaceholder>`.** Tiles with no media now render the forest-tinted gradient background (defined in CSS on `.zh-tile-bg`). No «ژ» watermark anywhere.
- **The rewrite drops the per-tile name span** (`<span className="zh-tile-name">{design.name}</span>` in the current file). The focused design name appears ONLY in the big caption below the carousel. Screen readers still get the name via the `<Link>`'s `aria-label`. Removing this means the `.zh-tile-name` CSS rule and any mobile override for it can also be deleted.
- **Use `data-focused` not `.is-focused`.** The existing TSX uses `data-focused` as a data attribute; the new CSS keys off `[data-focused]`. Don't introduce a new convention.
- **Layout dimensions for centering math, NOT `getBoundingClientRect()`.** Use `tile0.offsetWidth` and `tile1.offsetLeft - tile0.offsetLeft`. The rect-based call would return scaled rects (focused tile at 1.35× would give a different slot than dim tiles at 0.55×) and break centering. This is explicitly called out in the existing code (line 79); preserve the choice.
- **Two-RAF re-arm pattern for the silent jump.** First RAF paints the jumped state, second RAF restores transitions. Don't simplify to one RAF — there's a real frame-ordering reason.
- **The pulse dot inherits tile opacity.** This is intentional: dim tiles fade their pulse dot along with the rest. Don't try to overpower it with a higher z-index opacity hack.
- **`fetchAllDesigns()` returns ALL designs unsorted by default** — the order in EXTENDED is whatever Payload returns. No sort change in this PR.
- **No `@testing-library/react`** in `apps/web` (per `state.md` `FU-2.1-a`). Same constraint as the mobile-menu work. Manual smoke + typecheck + build.

---

## Task 1: Branch baseline

**Files:** None modified.

- [ ] **Step 1: Confirm branch + clean tree**

```bash
git -C /home/ahmad/Zhic branch --show-current
git -C /home/ahmad/Zhic status --short
git -C /home/ahmad/Zhic log --oneline -3
```

Expected:
- Current branch: `staging` (or `feat/designs-big-carousel` if the operator created it). Either is acceptable for this plan.
- `git status --short` may show untracked mockup files in `apps/web/public/docs/`. These belong to other work; do not stage them.
- Top commit on the branch should be `5ece70a docs(spec): designs index — Big Carousel polish` (or a later commit if the operator added anything).

If on a different branch, stop and confirm with the operator before proceeding.

- [ ] **Step 2: Run baseline typecheck**

```bash
pnpm --filter @zhic/web typecheck
```

Expected: clean. If it's not clean before the rewrite, fix or surface the pre-existing failure before continuing.

- [ ] **Step 3: No commit — this task verifies state only.**

---

## Task 2: Rewrite `designs-slider.css` + `DesignsSlider.tsx`

**Files:**
- Modify: `apps/web/src/components/design/designs-slider.css` (full rewrite)
- Modify: `apps/web/src/components/design/DesignsSlider.tsx` (full rewrite)

Bundled because the CSS and TSX classnames/data-attributes are coupled. Splitting would leave the live page in an inconsistent state (CSS targeting a class the TSX doesn't emit, or vice-versa) between commits.

- [ ] **Step 1: Replace `designs-slider.css` with the Big Carousel version**

Replace the entire contents of `/home/ahmad/Zhic/apps/web/src/components/design/designs-slider.css` with:

```css
/* Designs slider — see docs/superpowers/specs/2026-05-20-designs-big-carousel-design.md */

.zh-slider-section {
  position: relative;
  padding-block: 36px 16px;
  user-select: none;
  min-height: 60vh;

  --tile-scale-focused: 1.35;
  --tile-scale-dim:     0.55;
  --tile-opacity-dim:   0.40;
  --tile-blur-dim:      3px;
  --spill-pct:          45%;
}

.zh-slider-empty {
  text-align: center;
  color: var(--color-stone);
  padding-block: 64px;
}

.zh-slider-viewport {
  position: relative;
  overflow: visible;
  margin-inline: clamp(16px, 3vw, 40px);
}

.zh-slider-track {
  display: flex;
  gap: clamp(8px, 1.2vw, 18px);
  transition: transform 850ms var(--ease-out-quint);
  will-change: transform;
}

.zh-slider-tile {
  flex: 0 0 calc((100% - 2 * clamp(8px, 1.2vw, 18px)) / 3);
  aspect-ratio: 1 / 1;
  position: relative;
  cursor: pointer;
  opacity: var(--tile-opacity-dim);
  background: transparent;
  border: 0;
  border-radius: 0;
  overflow: visible;
  transform: scale(var(--tile-scale-dim));
  filter: blur(var(--tile-blur-dim));
  transform-origin: 50% 50%;
  text-decoration: none;
  color: var(--color-charcoal);
  transition:
    opacity        750ms var(--ease-out-soft),
    transform      750ms var(--ease-out-quint),
    filter         750ms var(--ease-out-soft),
    border-color   650ms var(--ease-out-soft),
    border-radius  650ms var(--ease-out-soft);
}

.zh-slider-tile[data-focused] {
  opacity: 1;
  z-index: 5;
  border: 1px solid var(--color-forest);
  border-radius: 10px;
  transform: scale(var(--tile-scale-focused));
  filter: blur(0);
}

.zh-tile-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 0;
  background: linear-gradient(135deg, rgba(95, 119, 96, 0.04), rgba(95, 119, 96, 0.10));
  transition:
    inset         800ms var(--ease-out-quint),
    border-radius 650ms var(--ease-out-soft);
}

.zh-tile-bg > img,
.zh-tile-bg > video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.zh-tile-bg::after {
  content: '';
  position: absolute;
  inset-block-start: 18px;
  inset-inline-end: 18px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-forest);
  box-shadow: 0 0 0 0 rgba(95, 119, 96, 0.5);
  animation: zh-tile-pulse 1.8s ease-in-out infinite;
  z-index: 1;
}

@keyframes zh-tile-pulse {
  0%, 100% { box-shadow: 0 0 0 0  rgba(95, 119, 96, 0); }
  50%      { box-shadow: 0 0 0 8px rgba(95, 119, 96, 0.20); }
}

.zh-slider-tile[data-focused] .zh-tile-bg {
  right: calc(-1 * var(--spill-pct));
  border-radius: 10px 0 0 10px;
}

.zh-tile-eyebrow {
  position: absolute;
  inset-inline-start: 24px;
  inset-block-start: 22px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--color-forest);
  font-weight: 700;
  z-index: 1;
}

.zh-slider-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: clamp(48px, 5vw, 64px);
  height: clamp(48px, 5vw, 64px);
  border-radius: 50%;
  background: var(--color-ivory);
  border: 1px solid var(--color-sand);
  box-shadow: 0 8px 22px rgba(20, 17, 15, 0.10);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  z-index: 10;
  color: var(--color-charcoal);
  transition:
    background-color var(--dur-hover),
    border-color     var(--dur-hover),
    box-shadow       var(--dur-hover);
}

.zh-slider-arrow:hover {
  background: var(--color-cream);
  border-color: var(--color-stone);
  box-shadow: 0 10px 26px rgba(20, 17, 15, 0.14);
}

.zh-slider-arrow.zh-prev { right: clamp(-4px, 0.5vw, 8px); }
.zh-slider-arrow.zh-next { left:  clamp(-4px, 0.5vw, 8px); }
.zh-slider-arrow svg { width: 50%; height: 50%; }

.zh-slider-caption {
  text-align: center;
  position: relative;
  z-index: 20;
  margin-top: clamp(-160px, -10vw, -100px);
  padding-block: 0 12px;
  min-height: 130px;
  pointer-events: none;
}

.zh-caption-name {
  font-size: clamp(40px, 6vw, 80px);
  font-weight: 900;
  color: var(--color-ink);
  line-height: 1.05;
  margin-bottom: 10px;
  letter-spacing: -0.02em;
  text-shadow:
    0 1px 0  rgba(250, 250, 247, 0.7),
    0 2px 24px rgba(250, 250, 247, 0.85);
  transition: opacity 750ms var(--ease-out-soft);
}

.zh-caption-tagline {
  font-size: clamp(13px, 1.3vw, 17px);
  color: var(--color-stone);
  font-weight: 300;
  line-height: 1.6;
  text-shadow: 0 1px 0 rgba(250, 250, 247, 0.8);
  transition: opacity 750ms var(--ease-out-soft);
}

.zh-slider-caption[data-changing] .zh-caption-name,
.zh-slider-caption[data-changing] .zh-caption-tagline {
  opacity: 0.3;
}

.zh-slider-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding-block: 12px 40px;
}

.zh-slider-dots {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  max-width: 480px;
  justify-content: center;
}

.zh-slider-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-sand);
  cursor: pointer;
  border: 0;
  padding: 0;
  transition: background-color var(--dur-hover), transform var(--dur-hover);
}

.zh-slider-dot:hover { background: var(--color-stone); }
.zh-slider-dot[aria-selected="true"] {
  background: var(--color-charcoal);
  transform: scale(1.5);
}

.zh-slider-counter {
  font-size: 12px;
  color: var(--color-stone);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.08em;
}

@media (max-width: 768px) {
  .zh-slider-section {
    --tile-scale-focused: 1.45;
    --tile-scale-dim:     0.42;
    --tile-opacity-dim:   0.30;
    --spill-pct:          30%;
    padding-block: 12px 8px;
    min-height: 0;
  }
  .zh-slider-viewport { margin-inline: 0; }
  .zh-slider-track { gap: 6px; }
  .zh-slider-arrow { display: none; }
  .zh-tile-eyebrow {
    font-size: 9px;
    inset-inline-start: 14px;
    inset-block-start: 12px;
  }
  .zh-slider-caption {
    margin-top: 0;
    padding-block: 28px 8px;
    min-height: 100px;
  }
  .zh-caption-name { font-size: 30px; margin-bottom: 6px; }
  .zh-caption-tagline { font-size: 13px; }
  .zh-slider-indicator { padding-block: 8px 28px; }
}

.zh-slider-section.is-jumping .zh-slider-track,
.zh-slider-section.is-jumping .zh-slider-tile,
.zh-slider-section.is-jumping .zh-tile-bg,
.zh-slider-section.is-jumping .zh-caption-name,
.zh-slider-section.is-jumping .zh-caption-tagline {
  transition: none !important;
}

@media (prefers-reduced-motion: reduce) {
  .zh-slider-track,
  .zh-slider-tile,
  .zh-tile-bg,
  .zh-caption-name,
  .zh-caption-tagline { transition: none; }

  .zh-slider-tile { transform: none; filter: none; }
  .zh-slider-tile[data-focused] { transform: none; }

  .zh-tile-bg::after { animation: none; }
}
```

- [ ] **Step 2: Replace `DesignsSlider.tsx` with the Big Carousel version**

Replace the entire contents of `/home/ahmad/Zhic/apps/web/src/components/design/DesignsSlider.tsx` with:

```tsx
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
```

- [ ] **Step 3: Run typecheck**

```bash
pnpm --filter @zhic/web typecheck
```

Expected: clean, zero errors. If errors appear, the most likely cause is a `PayloadMedia` shape mismatch — verify the import line and the `TileMedia` body against `apps/web/src/lib/payload.ts`.

- [ ] **Step 4: Run build**

```bash
pnpm --filter @zhic/web build
```

Expected: build succeeds. The `/designs` route should appear in the route summary at the end.

- [ ] **Step 5: Commit**

```bash
git -C /home/ahmad/Zhic add apps/web/src/components/design/DesignsSlider.tsx apps/web/src/components/design/designs-slider.css
git -C /home/ahmad/Zhic commit -m "$(cat <<'EOF'
feat(designs): Big Carousel polish — scale, spill, infinite loop

Polishes the /designs carousel into the Big Carousel treatment:

- Focused tile scales 1.35× (1.45× mobile); dim tiles scale 0.55×
  (0.42×) with 3px blur and 40% opacity (30% mobile).
- Media bleed = 45% past the inline-end edge on desktop, 30% mobile.
- Card chrome = stroke only — 1px forest border + 10px radius. No
  box-shadow. Inline-start corners rounded, inline-end open.
- Empty-state tile-bg background = forest-tinted gradient
  (rgba(95,119,96,0.04) → 0.10) replacing cream-to-sand.
- Watermark «ژ» removed entirely (no TilePlaceholder fallback).
- Per-tile name removed; big caption is the only place the design
  name appears visually.
- Big overlapping caption (40-80px name pulled UP via -margin-top on
  desktop; sits below the slider on mobile).
- Ivory arrow buttons (48-64px) hidden on mobile.
- Pulse-dot GIF hint (8px forest, 1.8s ring) on every tile's media.
- Infinite loop via EXTENDED clone array + silent jump (.is-jumping
  transition-kill class + inline transition:none + transitionend
  listener with setTimeout fallback + two-RAF re-arm).

Spec: docs/superpowers/specs/2026-05-20-designs-big-carousel-design.md
Plan: docs/superpowers/plans/2026-05-20-designs-big-carousel.md
EOF
)"
```

---

## Task 3: Manual smoke check

**Files:** None modified.

This task verifies the rewrite against acceptance criteria 1-14 of the spec. Two complementary verification paths — pick whichever fits the session:

### 3a — Automated (curl + HTML inspection)

Most of the spec is structural (correct classes, correct count of tiles, presence of pulse dot, etc.) and can be checked without a browser.

- [ ] **Step 1: Restart zhic-web so the new build is served**

```bash
pm2 restart zhic-web
until curl -sf http://localhost:3000/ -o /dev/null; do sleep 1; done
echo "ready"
```

Expected: server back up.

- [ ] **Step 2: Verify the rendered HTML structure**

```bash
curl -s http://localhost:3000/designs | python3 -c "
import sys, re
html = sys.stdin.read()
# Section
m = re.search(r'<section[^>]*aria-roledescription=\"carousel\"[^>]*>', html)
print('section with aria-roledescription:', 'present' if m else 'MISSING')

# Tile count — for N=8 designs + 4 clones each side, should be 16
tiles = re.findall(r'<(?:a|div)[^>]*class=\"zh-slider-tile\"', html)
print(f'tile count: {len(tiles)} (expected 16 for N=8)')

# Exactly one focused tile
focused = re.findall(r'<(?:a|div)[^>]*data-focused', html)
print(f'focused tiles: {len(focused)} (expected 1)')

# No watermark
print(f'«ژ» watermark: {\"PRESENT (BAD)\" if \"zh-tile-watermark\" in html else \"absent\"}')

# No per-tile name span
name_spans = re.findall(r'<span[^>]*class=\"zh-tile-name\"', html)
print(f'zh-tile-name spans: {len(name_spans)} (expected 0)')

# Eyebrow present on every tile (16 eyebrows for 16 tiles)
eyebrows = re.findall(r'<span[^>]*class=\"zh-tile-eyebrow\"', html)
print(f'zh-tile-eyebrow count: {len(eyebrows)} (expected matches tile count)')

# Arrows
print(f'prev arrow: {\"present\" if \"zh-slider-arrow zh-prev\" in html else \"MISSING\"}')
print(f'next arrow: {\"present\" if \"zh-slider-arrow zh-next\" in html else \"MISSING\"}')

# Dots — one per real design (not per clone)
dots = re.findall(r'<button[^>]*class=\"zh-slider-dot\"', html)
print(f'dot count: {len(dots)} (expected matches design count, e.g. 8)')

# Caption
print(f'caption block: {\"present\" if \"zh-slider-caption\" in html else \"MISSING\"}')
"
```

Expected output:
- `section with aria-roledescription: present`
- `tile count: 16 (expected 16 for N=8)` — adjust if dataset has changed
- `focused tiles: 1 (expected 1)`
- `«ژ» watermark: absent`
- `zh-tile-name spans: 0 (expected 0)`
- `zh-tile-eyebrow count: 16` (matches tile count)
- `prev arrow: present`, `next arrow: present`
- `dot count: 8` (matches design count)
- `caption block: present`

- [ ] **Step 3: Verify CSS variables are correctly declared**

```bash
curl -s http://localhost:3000/_next/static/css/$(curl -s http://localhost:3000/designs | grep -oE '_next/static/css/[a-f0-9]+\.css' | head -1 | cut -d/ -f4) 2>/dev/null | grep -oE '\-\-tile-scale-focused: [0-9.]+|\-\-spill-pct: [0-9]+%' | head -8
```

Expected: lines including `--tile-scale-focused: 1.35`, `--spill-pct: 45%`, plus the mobile overrides `--tile-scale-focused: 1.45` and `--spill-pct: 30%`.

(This step is best-effort — Tailwind/Next CSS extraction varies. If the CSS file lookup fails, skip and rely on the visual smoke in 3b.)

### 3b — Visual (eyes-on, mandatory for sign-off)

Some properties can't be confirmed from HTML/CSS alone:

- [ ] **Step 4: Eyeball on desktop viewport**

Open `http://80.240.31.146:3000/designs` (or `http://localhost:3000/designs` locally) in a desktop browser. Verify:
- Three tiles visible: focused (center) at large size, two dim side tiles at small size with blur.
- Focused tile: thin forest stroke (no shadow), 10px radius on inline-start corners, media bleeds visibly past the inline-end edge (~45% of tile width).
- Pulse dot in top inline-end corner of every tile's media, pulsing slowly.
- Large caption below ("design name" 40-80px, weight 900) overlapping the bottom edge of the focused tile.
- Eyebrow «طرح» in forest, top inline-start corner of every tile.
- Big circular arrow buttons on the page edges.

- [ ] **Step 5: Eyeball navigation**

- Click next arrow several times → carousel slides smoothly, focused tile shifts, caption cross-fades.
- Click a dim tile → that tile becomes focused without scrolling.
- Click focused tile → navigates to `/designs/<slug>`.
- Press ArrowLeft / ArrowRight on keyboard → carousel moves (RTL-correct direction).
- Navigate forward past the last real design → carousel keeps moving smoothly (no visible snap), then silently jumps back to the real-equivalent index. **Caption stays put during the jump** (key visual proof the silent jump worked).

- [ ] **Step 6: Eyeball mobile viewport**

Resize to ≤ 768px (DevTools mobile preset, e.g. iPhone 13). Verify:
- Arrows are hidden.
- Focused tile larger (1.45×), dim tiles smaller (0.42×).
- Caption sits BELOW the slider (not overlapping).
- Swipe left/right works.
- 30% spill stays inside the viewport (no horizontal page scroll).

- [ ] **Step 7: Eyeball `prefers-reduced-motion`**

In DevTools → Rendering panel → enable "Emulate CSS media feature `prefers-reduced-motion: reduce`":
- Every tile renders at uniform size (no scale, no blur).
- Pulse dots are frozen.
- Navigation jump-cuts between states (no fade or slide).

- [ ] **Step 8: No commit — smoke verifies state only.**

If any step fails, fix the rewrite and amend (or follow-up commit) Task 2 before proceeding to Task 4.

---

## Task 4: Update `docs/state.md`

**Files:**
- Modify: `docs/state.md`

- [ ] **Step 1: Anchor edits**

```bash
grep -n "Designs index page\|FU-DDP-d\|FU-MM-a\|FU-CN-d" /home/ahmad/Zhic/docs/state.md | head -20
```

Expected: a row near line 119 ("Designs index page") in the shipped/current table; struck-through `~~FU-DDP-d~~` and `~~FU-MM-a~~` entries near lines 281, 303. Line numbers approximate — adjust to actual.

- [ ] **Step 2: Mark the 2026-05-17 "Designs index page" row as revised**

Find the row (near line 119) that begins `| Designs index page | ✅ | (PR HEAD) |`. Replace its description (the 4th column) so the row reads:

```
| Designs index page | ✅ revised | (PR HEAD) | Original `/designs` single-focus carousel (dim sides, focused with card + 22% right spill). **Revised 2026-05-20** by the Big Carousel polish — see row below. Schema-level work (Designs.sliderMedia field) carries forward. Original spec: `docs/superpowers/specs/2026-05-17-designs-index-page-design.md`. Original plan: `docs/superpowers/plans/2026-05-17-designs-index-page.md`. |
```

The status changes from `✅` to `✅ revised`. The other columns stay as they were.

- [ ] **Step 3: Add a new "Designs index — Big Carousel" row**

Insert this row immediately *after* the row from Step 2:

```
| Designs index — Big Carousel | ✅ | (PR HEAD) | `/designs` carousel polished into the Big Carousel treatment — focused tile scales 1.35× (1.45× mobile), dim tiles 0.55× (0.42×) with 3px blur and 40% opacity. 45% media bleed past inline-end edge (30% mobile). Forest stroke only (no shadow). Forest-tinted empty-state gradient. Watermark «ژ» removed. Per-tile name removed. Big overlapping caption (40-80px). Ivory 48-64px arrows hidden on mobile. Pulse-dot GIF hint on every tile. Infinite loop via clone tiles + silent jump. Spec: `docs/superpowers/specs/2026-05-20-designs-big-carousel-design.md`. Plan: `docs/superpowers/plans/2026-05-20-designs-big-carousel.md`. |
```

- [ ] **Step 4: Add new follow-up rows `FU-BC-a..e`**

Append these rows to the follow-ups table. Find a sensible insertion point — at the end of the table, or grouped with related items. For each row:

```
| FU-BC-a | DES | Optional: extract `extendedArrayFor(designs)` and `realIndexOf` from `DesignsSlider.tsx` into a pure-helper module; add unit tests once `@testing-library/react` (or comparable) is wired into `apps/web` (per `FU-2.1-a`). |
| FU-BC-b | DES | Optional: hover-preview pop-over from focused tile showing 2-3 piece thumbnails. Out for now (clutter risk on top of media). |
| FU-BC-c | DES | Optional: operator-tunable scale + spill via `site-config` global (now that it exists). Out for now — CSS vars cover ad-hoc tuning. |
| FU-BC-d | DES | Optional: cross-fade media between dim-and-focused transitions instead of opacity + filter step. Out for now — current transitions read well. |
| FU-BC-e | DES | Optional: "Latest" / "Most viewed" filter chips above the carousel. Explicitly out per original 2026-05-17 spec; capture here so it has a home if revived. |
```

- [ ] **Step 5: Verify Markdown integrity**

Open `docs/state.md` in a Markdown previewer (VSCode preview pane, GitHub blob view, or any other). Skim the affected sections:
- The shipped/current table renders without broken columns.
- The follow-ups table renders without broken columns.
- "✅ revised" status renders cleanly.

No automated check — eyeball it.

- [ ] **Step 6: Commit**

```bash
git -C /home/ahmad/Zhic add docs/state.md
git -C /home/ahmad/Zhic commit -m "$(cat <<'EOF'
docs(state): mark Designs index Big Carousel shipped

The 2026-05-17 "Designs index page" row marked ✅ revised. New "Designs
index — Big Carousel" row added. FU-BC-a..e follow-ups appended from the
Big Carousel spec.

Spec: docs/superpowers/specs/2026-05-20-designs-big-carousel-design.md
Plan: docs/superpowers/plans/2026-05-20-designs-big-carousel.md
EOF
)"
```

---

## Task 5: Final verification

**Files:** None modified.

- [ ] **Step 1: Final typecheck + build**

```bash
pnpm --filter @zhic/web typecheck
pnpm --filter @zhic/web build
```

Expected: both clean.

- [ ] **Step 2: Verify the commit log**

```bash
git -C /home/ahmad/Zhic log --oneline -5
```

Expected (top to bottom):
1. `docs(state): mark Designs index Big Carousel shipped`
2. `feat(designs): Big Carousel polish — scale, spill, infinite loop`
3. `docs(spec): designs index — Big Carousel polish` (the spec commit, already in place — `5ece70a`)
4. … (prior commits)

- [ ] **Step 3: Verify clean tree**

```bash
git -C /home/ahmad/Zhic status --short
```

Expected: no modified files in `apps/web/src/components/design/` or `docs/`. Untracked mockup files from earlier work may still be present — they belong to other branches/PRs and are not in scope here.

- [ ] **Step 4: No commit — final verification only.**

---

## Acceptance criteria (lifted from the spec)

Cross-referenced for the implementer; do not skip any:

1. `/designs` renders 6+ designs in a horizontal carousel; focused tile scaled 1.35× (1.45× mobile), side tiles 0.55× (0.42×) with 3px blur and 40% opacity (30% mobile). **Task 3 step 4, step 6.**
2. Focused tile media bleeds 45% past inline-end edge (30% mobile). **Task 3 step 4.**
3. Focused tile: 1px forest stroke + 10px radius + NO box-shadow. **Task 3 step 4.**
4. Empty-state tile-bg = forest-tinted gradient `rgba(95,119,96,0.04) → 0.10`. **Task 2 step 1 (CSS); visually visible only on tiles without media — not in production smoke.**
5. No `«ژ»` watermark anywhere; no `<TilePlaceholder>` in the code; no per-tile name span. **Task 2 step 2 (TSX); Task 3 step 2 (HTML scan).**
6. Eyebrow «طرح» on every tile, forest, top inline-start corner. **Task 3 step 4.**
7. Caption: name `clamp(40px, 6vw, 80px)` w/900, pulled UP via `margin-top: clamp(-160px, -10vw, -100px)`; tagline `clamp(13px, 1.3vw, 17px)`; paper-glow text-shadow. **Task 3 step 4.**
8. Caption cross-fades on real-index change only, not during silent jumps. **Task 3 step 5 (visual proof).**
9. Arrows: `clamp(48px, 5vw, 64px)` ivory circles, sand border, hover transition; hidden on ≤ 768px. **Task 3 steps 4 + 6.**
10. Pulse dot on every tile, 8px forest, 1.8s ring loop. **Task 3 step 4.**
11. Infinite loop works — navigating past the last design continues smoothly into clones, then silent jump to real-equivalent without visible snap. **Task 3 step 5.**
12. Mashing arrows fast doesn't break layout, doesn't leave `is-jumping` stuck, doesn't desync caption from focused. **Task 3 step 5.**
13. `prefers-reduced-motion: reduce` removes transforms, transitions, pulse animation; carousel still functions. **Task 3 step 7.**
14. Resize re-centers focused tile without animation. **Task 3 step 4 (implicit).**
15. `pnpm --filter @zhic/web typecheck` clean. **Task 2 step 3; Task 5 step 1.**
16. `pnpm --filter @zhic/web build` clean. **Task 2 step 4; Task 5 step 1.**
17. Mobile ≤ 768px doesn't introduce horizontal page scroll. **Task 3 step 6.**
18. `state.md` updated: old row marked ✅ revised, new row added, FU-BC-a..e appended. **Task 4.**

---

## References

- Spec: `docs/superpowers/specs/2026-05-20-designs-big-carousel-design.md`
- Mockup source: `apps/web/public/docs/designs-big-carousel-mockup.html`
- Predecessor spec: `docs/superpowers/specs/2026-05-17-designs-index-page-design.md`
- Predecessor plan: `docs/superpowers/plans/2026-05-17-designs-index-page.md`
- Current implementation: `apps/web/src/components/design/DesignsSlider.tsx` + `designs-slider.css` (pre-rewrite)
- Design tokens: `packages/design-system/`
- State board: `docs/state.md`
