# Designs Index — Big Carousel Polish Spec

**Date:** 2026-05-20
**Branch (planned):** `feat/designs-big-carousel`
**Status:** spec — implementation plan to follow via `superpowers:writing-plans`
**Supersedes (visual treatment only):** `docs/superpowers/specs/2026-05-17-designs-index-page-design.md`. The route, data layer, and behavior model defined there carry forward; this spec rewrites the visual treatment, motion model, and wrap behavior.

---

## 0. Why this spec

`/designs` shipped on 2026-05-17 as a single-focus carousel: 3 tiles visible at a time, focused tile in the center with a card + 22% media spill, dim side tiles. It works, but at the current dataset of 8 designs it has two visible rough edges:

1. **The focused tile doesn't dominate.** All three tiles are the same layout size; the focused one only differs via card chrome and dim-side opacity. The page reads as "a row with a highlighted center cell" rather than "one design at a time, the others as peripheral context".
2. **The boundary snaps.** Modulo wrap means navigating past the last design causes a visible jump back to the first. With 8 designs and a manual-only carousel, the user hits this often.

This spec polishes the carousel into the "Big Carousel" treatment: the focused tile **scales up beyond its layout slot** (1.35× desktop, 1.45× mobile) while side tiles **scale down** (0.55× / 0.42×) with blur and lower opacity, the caption grows large and overlaps the bottom of the focused card, and the boundary becomes a true infinite loop via clone tiles + silent jump.

The user also specifically asked for an **increased media spill** — 45% past the inline-end edge (up from 22% live and 26% in the mockup the user authored) — and **restrained card chrome**: stroke only (no shadow), with the stroke and the empty-state background fade both tinted forest-green.

This spec deliberately **does not** cover:

- Filter controls (age_group, etc.) — out per the original spec, still out
- Auto-play / pause-on-hover — explicitly out (manual nav only)
- GIF-to-video transcoding (`FU-2.3-a`)
- Layout changes to the breadcrumb, page title, or surrounding chrome
- New tiles, new fields, or schema changes — `PayloadDesign` is unchanged

---

## 1. Visual reference

ASCII summary (desktop, mid-slide):

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [floating-pill header]                                                  │
│                                                                          │
│  خانه / طرح‌ها                                                          │
│                                                                          │
│                              طرح‌ها                                     │
│                                                                          │
│  ←     ┌──┐         ┌──────────────────────────╗     ┌──┐     →          │
│ arrow  │  │         │                          ║     │  │   arrow        │
│        │GF│         │       [GIF media]        ║ GIF │  │                │
│        │  │         │                          ║ ────┼──┼─── 45%         │
│  0.55  └──┘         │     1.35× focused        ║ spill│  │   bleed       │
│  0.40  blur         │   1px forest stroke      ║     │  │                │
│  3px               │       no shadow          ║     │  │                │
│                     │                          ║     │  │                │
│                     │  (rounded inline-start,  ║     │  │                │
│                     │   open inline-end where  ║     │  │                │
│                     │   the media bleeds)      ║     │  │                │
│                     │                          ║     └──┘                │
│                     └──────────────────────────╝                          │
│                                                                          │
│                              گندم                                       │  ← 40-80px, weight 900,
│                       گرم، برای خواب کودکانه                            │     pulled UP via -margin-top
│                                                                          │     so it overlaps the bottom
│                                                                          │     of the focused tile
│                                                                          │
│                       · · ● · · · · · · · · · · ·                        │
│                              ۱ از ۸                                      │
└──────────────────────────────────────────────────────────────────────────┘
                                  [footer]
```

The pulse-dot GIF hint (8px forest, slow 1.8s ring pulse) lives in the top inline-end corner of every tile's `.tile-bg`.

Source mockup: `apps/web/public/docs/designs-big-carousel-mockup.html`. Mockup is the layout/motion reference; the user-specific changes (45% spill, forest stroke, forest-tinted empty-state fade, no watermark) override the mockup where they conflict.

---

## 2. Architecture

### 2.1 Files modified

| Path | Change |
|---|---|
| `apps/web/src/components/design/DesignsSlider.tsx` | Rewrite. Same `DesignsSliderProps` (no breaking change). Adds clone-tile infinite loop + silent-jump logic. Drops `<TilePlaceholder>` (no more watermark fallback). Drops per-tile name span. |
| `apps/web/src/components/design/designs-slider.css` | Rewrite. New CSS variable knobs for scaling/opacity/blur/spill, new arrow + caption sizing, pulse-dot keyframes, `is-jumping` class for transition-kill during silent jump. |
| `apps/web/src/app/(site)/designs/page.tsx` | No change. |
| `docs/state.md` | Mark the 2026-05-17 "Designs index page" row as **revised** with a pointer to this spec; add a new "Designs index — Big Carousel" row. |

### 2.2 No new files

The whole change lives in the two existing component files. No new helpers, no new packages, no new hooks beyond what's already in `DesignsSlider.tsx`.

### 2.3 Files explicitly NOT modified

- `apps/web/src/lib/payload.ts` — `fetchAllDesigns` and `PayloadDesign` unchanged
- `apps/web/src/components/design/DesignHero.tsx`, `DesignMoodboard.tsx`, `DesignStory.tsx` — detail-page concerns, untouched
- `services/api/src/collections/Designs.ts` — schema unchanged (`sliderMedia`, `heroMedia`, `gallery` stay as-is)
- `packages/design-system/*` — uses existing tokens (`--color-forest`, `--color-ivory`, `--color-cream`, `--color-sand`, `--color-stone`, `--color-charcoal`, `--color-ink`, `--ease-out-soft`, `--ease-out-quint`, `--dur-hover`)

### 2.4 Data flow

```
(site)/designs/page.tsx (server)
       │
       │ fetchAllDesigns()  — unchanged
       ▼
<DesignsSlider designs={designs} />  — same prop
       │
       │ for length ≤ 1: existing empty / single-fallback paths
       │ for length ≥ 2: Slider with clones
       ▼
   <Slider designs={...} />
       │
       │ Builds EXTENDED = [tail clones, ...designs, head clones]
       │ focused: index into EXTENDED
       │ realIndex = ((focused - N_CLONES) % N + N) % N
       │ caption + dot indicator read realIndex
       │ track translate, focused class, tile click handlers read EXTENDED index
       ▼
   Render 3 (visible) + scale up focused 1.35× + scale down dim 0.55×
```

---

## 3. Component shape

### 3.1 Props

Unchanged:

```ts
export type DesignsSliderProps = {
  designs: PayloadDesign[];
};
```

### 3.2 Internal state

```ts
const N_CLONES = 4;
const TRANSITION_MS = 1000;  // 850ms track translate + 150ms safety buffer

const [focused, setFocused] = useState<number>(N_CLONES);  // starts on first real
const [captionChanging, setCaptionChanging] = useState(false);
const [isJumping, setIsJumping] = useState(false);  // drives .is-jumping class
const trackRef = useRef<HTMLDivElement>(null);
const viewportRef = useRef<HTMLDivElement>(null);
const jumpTimerRef = useRef<number | null>(null);
```

### 3.3 Derived values

```ts
const N = designs.length;
const EXTENDED = useMemo(() => {
  if (N < 2) return designs;  // empty / single — caller handles
  return [
    ...designs.slice(N - N_CLONES),
    ...designs,
    ...designs.slice(0, N_CLONES),
  ];
}, [designs]);

const realIndexOf = (ext: number) => ((ext - N_CLONES) % N + N) % N;
const isCloneIndex = (ext: number) => ext < N_CLONES || ext >= N_CLONES + N;
const focusedDesign = designs[realIndexOf(focused)]!;
```

For `N < N_CLONES + 1`, the clone-tile array degrades gracefully — some entries simply repeat themselves. The math still produces a valid centered position and the silent jump still lands on the matching real index. Sparse-data edge cases (N=2, N=3) work but show repeated tiles at the edges; this is acceptable given the production dataset is 8 and growing.

### 3.4 Effects

1. **Recenter on focused change + resize.** Apply `track.style.transform = translateX(...)` using *layout* dimensions (`offsetWidth`, `offsetLeft`) — NOT `getBoundingClientRect()`, which returns scaled dims and would mis-center the focused tile relative to the dim ones. Re-fires on `window.resize`.
2. **Caption cross-fade.** When `realIndexOf(focused)` changes (NOT on every `focused` change — the silent jump moves `focused` without changing the real index), set `captionChanging = true` for 220ms then back to false.
3. **Schedule silent jump.** When `focused` lands on a clone, attach a one-shot `transitionend` listener on the track (filtered to `propertyName === 'transform'`) AND a `setTimeout(TRANSITION_MS)` fallback. Whichever fires first calls `performSilentJump()`.
4. **Keyboard.** `ArrowLeft → go(+1)`, `ArrowRight → go(-1)`. Skip when target is `INPUT` or `TEXTAREA`.
5. **Drag-to-scrub via Pointer Events.** The track follows the pointer (touch / mouse / pen) in real time during the gesture, with the transition paused. On release, snap to the nearest slot, with a velocity bonus that advances one extra in the flick direction past 1.5 px/ms. Past an 8px dead-zone, the gesture is committed as a drag — page scroll is suppressed via `preventDefault` and the subsequent click is suppressed (dim tiles via early-return, focused tile's `<Link>` via `preventDefault`). Below the dead-zone, the gesture behaves as a normal click. See §6 for the full behavior matrix.

### 3.5 The silent jump

```ts
function performSilentJump() {
  if (!isCloneIndex(focused)) return;

  const realFocused = realIndexOf(focused) + N_CLONES;

  setIsJumping(true);             // adds .is-jumping → transition:none !important on subtree

  // Belt + suspenders: also null inline transition on track and every animatable child
  const track = trackRef.current!;
  track.style.transition = 'none';
  const animated = track.querySelectorAll<HTMLElement>('.zh-slider-tile, .zh-tile-bg');
  animated.forEach((el) => { el.style.transition = 'none'; });

  setFocused(realFocused);
  // The recenter effect runs synchronously inside React's commit, applying the
  // new transform without animation (transitions are off). Caption does NOT
  // change because realIndexOf is the same.

  // Force reflow so the no-transition state is committed before re-enabling
  void track.offsetWidth;

  // Two animation frames before re-enabling — first paints the jumped state,
  // second re-arms transitions.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setIsJumping(false);
      track.style.transition = '';
      animated.forEach((el) => { el.style.transition = ''; });
    });
  });
}
```

### 3.6 Edge cases

- `designs.length === 0` → render existing empty state ("به‌زودی طرح‌های ژیک به این صفحه اضافه می‌شوند.")
- `designs.length === 1` → render existing `SingleDesignFallback` component
- `designs.length === 2` → full Slider with clones (EXTENDED length = 10, repetition acceptable)
- All dim tiles get clicked → `setFocused(extIdx)` with whatever extIdx the tile has; if it's a clone, the silent jump cleans it up to the real-equivalent
- Multiple clicks while a transition is in flight → each call schedules a fresh jump; `clearTimeout(jumpTimerRef.current)` prevents stacking

---

## 4. Visual treatment

### 4.1 CSS variables (root, on `.zh-slider-section`)

```css
.zh-slider-section {
  --tile-scale-focused: 1.35;
  --tile-scale-dim:     0.55;
  --tile-opacity-dim:   0.40;
  --tile-blur-dim:      3px;
  --spill-pct:          45%;
}

@media (max-width: 768px) {
  .zh-slider-section {
    --tile-scale-focused: 1.45;
    --tile-scale-dim:     0.42;
    --tile-opacity-dim:   0.30;
    --spill-pct:          30%;
  }
}
```

### 4.2 Tile

| Property | Value |
|---|---|
| `flex` | `0 0 calc((100% - 2 * gap) / 3)` (1/3 of viewport minus two gaps) |
| `aspect-ratio` | `1 / 1` |
| `transform` | `scale(var(--tile-scale-dim))` (dim) or `scale(var(--tile-scale-focused))` (focused) |
| `opacity` | `var(--tile-opacity-dim)` (dim) or `1` (focused) |
| `filter` | `blur(var(--tile-blur-dim))` (dim) or `blur(0)` (focused) |
| `border` | none (dim) or `1px solid var(--color-forest)` (focused) |
| `border-radius` | `0` (dim) or `10px` (focused) |
| `box-shadow` | none |
| `overflow` | `visible` (so focused tile-bg can bleed) |
| `transform-origin` | `50% 50%` |
| `z-index` | `0` (dim) or `5` (focused) |
| `cursor` | `pointer` |

### 4.3 Tile-bg (the media container)

| Property | Value |
|---|---|
| `position` | `absolute; inset: 0` (dim) |
| Focused override | `right: calc(-1 * var(--spill-pct))` (45% bleed past inline-end) |
| Empty-state background | `linear-gradient(135deg, rgba(95, 119, 96, 0.04), rgba(95, 119, 96, 0.10))` |
| `border-radius` | `0` (dim) or `10px 0 0 10px` (focused — rounded only inline-start, open inline-end) |
| `overflow` | `hidden` |
| Pulse dot | `::after` pseudo-element, 8px forest, top inline-end corner, 1.8s box-shadow ring pulse |

Real media (image or video) renders inside `.zh-tile-bg` with `width: 100%; height: 100%; object-fit: cover`. The forest-tinted gradient only shows if no media is present, or behind transparent regions of media.

### 4.4 Removed elements

- `<TilePlaceholder>` component — deleted. Tiles without media render with just the gradient background.
- The watermark «ژ» — gone everywhere (including the fallback path).
- The per-tile name span (`<span className="zh-tile-name">{design.name}</span>`) — gone. The big caption is the only place the design name renders visually. Screen readers still get it via the `<Link>` `aria-label`.

### 4.5 Eyebrow («طرح»)

Kept on every tile, top inline-start corner. Small editorial marker.

```css
.zh-tile-eyebrow {
  position: absolute;
  inset-inline-start: 24px;
  inset-block-start: 22px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: var(--tracking-eye, 0.14em);
  color: var(--color-forest);
  font-weight: 700;
  z-index: 1;
}

@media (max-width: 768px) {
  .zh-tile-eyebrow { font-size: 9px; inset-inline-start: 14px; inset-block-start: 12px; }
}
```

### 4.6 Caption

| Property | Value |
|---|---|
| `text-align` | `center` |
| `position` | `relative` |
| `z-index` | `20` (above focused tile's `5`) |
| `margin-top` | `clamp(-160px, -10vw, -100px)` (pulls UP into the slider area) |
| `padding-block` | `0 12px` |
| `min-height` | `130px` (mobile: `100px`) |
| `pointer-events` | `none` (tile and arrow clicks pass through) |

```css
.zh-caption-name {
  font-size: clamp(40px, 6vw, 80px);
  font-weight: 900;
  color: var(--color-ink);
  line-height: 1.05;
  letter-spacing: -0.02em;
  margin-bottom: 10px;
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
.zh-slider-caption[data-changing] .zh-caption-tagline { opacity: 0.3; }

@media (max-width: 768px) {
  .zh-slider-caption  { padding-block: 28px 8px; min-height: 100px; margin-top: 0; }
  .zh-caption-name    { font-size: 30px; margin-bottom: 6px; }
  .zh-caption-tagline { font-size: 13px; }
}
```

On mobile, caption sits *below* the slider (no negative margin) because the scale is more aggressive and overlay would crowd the typography.

### 4.7 Arrows

| Property | Value |
|---|---|
| Size | `clamp(48px, 5vw, 64px)` square |
| `border-radius` | `50%` |
| Background | `var(--color-ivory)` |
| Border | `1px solid var(--color-sand)` |
| Box-shadow | `0 8px 22px rgba(20, 17, 15, 0.10)` |
| Position | `top: 50%; transform: translateY(-50%)` |
| Inline placement | `right: clamp(-4px, 0.5vw, 8px)` (prev), mirrored for next |
| Hover | bg `var(--color-cream)`, border `var(--color-stone)`, deeper shadow |
| `z-index` | `10` |
| Mobile (`≤ 768px`) | `display: none` — swipe + dots only |
| Icon | Existing chevron SVGs (`M9 6L15 12L9 18` / `M15 6L9 12L15 18`), 50% of button size |

### 4.8 Pulse dot

```css
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
}

@keyframes zh-tile-pulse {
  0%, 100% { box-shadow: 0 0 0 0  rgba(95, 119, 96, 0); }
  50%      { box-shadow: 0 0 0 8px rgba(95, 119, 96, 0.20); }
}
```

### 4.9 Indicator (dots + counter)

Unchanged from current implementation. Dot for the focused real index gets `background: var(--color-charcoal); transform: scale(1.5)`. Counter shows `<focused+1> از <N>` in Persian digits.

---

## 5. Motion

### 5.1 Timings

| Element | Property | Duration | Easing |
|---|---|---|---|
| Track | `transform` | `850ms` | `var(--ease-out-quint)` |
| Tile | `opacity`, `transform`, `filter` | `750ms` | `quint` / `soft` |
| Tile | `border`, `border-radius`, `box-shadow` | `650ms` | `var(--ease-out-soft)` |
| Tile-bg | `inset` (the spill) | `800ms` | `var(--ease-out-quint)` |
| Tile-bg | `border-radius` | `650ms` | `var(--ease-out-soft)` |
| Caption | `opacity` (`.is-changing`) | `750ms` (cross-fade with 220ms swap) | `var(--ease-out-soft)` |
| Pulse dot | `box-shadow` ring | `1.8s` infinite | `ease-in-out` |
| Arrows | `bg`, `border`, `shadow` (hover) | `var(--dur-hover)` (240ms) | default |

### 5.2 The `.is-jumping` override

```css
.zh-slider-section.is-jumping .zh-slider-track,
.zh-slider-section.is-jumping .zh-slider-tile,
.zh-slider-section.is-jumping .zh-tile-bg,
.zh-slider-section.is-jumping .zh-caption-name,
.zh-slider-section.is-jumping .zh-caption-tagline {
  transition: none !important;
}
```

Engaged for one render + two `requestAnimationFrame` ticks during silent jump.

### 5.3 `prefers-reduced-motion: reduce`

```css
@media (prefers-reduced-motion: reduce) {
  .zh-slider-track,
  .zh-slider-tile,
  .zh-tile-bg,
  .zh-caption-name,
  .zh-caption-tagline { transition: none; }

  .zh-slider-tile { transform: none; filter: none; }

  .zh-tile-bg::after { animation: none; }
}
```

Effect: every tile renders at uniform size (no scale, no blur), focused-state changes are instant (no fade), caption swap is instant, pulse dot is static. Carousel still works, just no animation.

---

## 6. Behavior matrix

| Trigger | Effect |
|---|---|
| Click prev arrow | `go(-1)` |
| Click next arrow | `go(+1)` |
| Click dim tile | `setFocused(extIdx)` for that tile |
| Click focused tile | Navigate to `/designs/<slug>` (existing `<Link>`) |
| Click dot | `setFocused(N_CLONES + realIdx)` (skip clones) |
| `ArrowLeft` | `go(+1)` (RTL — visually-next is lower x) |
| `ArrowRight` | `go(-1)` |
| Pointer drag on viewport, `\|dx\|` ≤ 8px, then release | Click event fires normally (tile-select or navigate) |
| Pointer drag on viewport, `\|dx\|` > 8px (drag committed) | Track follows pointer real-time; subsequent click suppressed |
| Drag release with `round(dx / slot) ≠ 0` | `go(slotsDragged + velocityBonus)`. `velocityBonus = ±1` if `\|velocity\|` > 1.5 px/ms |
| Drag release with `round(dx / slot) == 0` and no flick | `recenter()` snaps back to starting position |
| Window resize during active drag | Suppressed (`recenter` no-ops while `isDraggingRef.current === true`) |
| `focused` lands on clone after `go(...)` | After 850ms transition (or `transitionend`), silent jump to real-equivalent |
| Window resize | Recompute layout slot, re-apply transform without animation |
| Esc | No effect (carousel doesn't trap focus) |

`go(delta)`:

```ts
function go(delta: number) {
  setFocused((prev) => {
    let next = prev + delta;
    // Hard-wrap if user mashes past clone padding
    if (next < 0) next += N;
    else if (next >= EXTENDED.length) next -= N;
    return next;
  });
  // The recenter effect re-runs; the schedule-jump effect re-runs and arms
  // the silent jump if the new index is a clone.
}
```

---

## 7. Routes

No routing changes. `/designs` and `/designs/[slug]` both already exist.

---

## 8. Tests

### 8.1 Vitest

`apps/web` has no `@testing-library/react` (per `state.md` → `FU-2.1-a`). The existing `DesignsSlider` ships without component tests; this rewrite continues that.

A pure helper *could* be extracted (e.g. `extendedArrayFor(designs)` returning the EXTENDED array) and unit-tested. Optional — skip unless it makes the component cleaner.

### 8.2 Manual smoke

Walk through these on a mobile viewport (≤ 768px) and a desktop viewport (≥ 768px) after the rewrite ships:

1. Open `/designs` → 3 tiles visible, focused (index 0) centered and scaled up, side tiles scaled down + blurred + 40% opacity.
2. Focused tile shows: 1px forest stroke, 10px radius (rounded inline-start), 45% media bleed past inline-end, NO box-shadow, NO watermark.
3. Each tile shows a small forest pulse dot in the top inline-end corner of its media area. Dot pulses smoothly.
4. Big caption renders below: focused design name (40-80px, weight 900) overlapping the bottom of the focused tile, tagline below it.
5. Tap next arrow → carousel slides smoothly, focused class shifts, caption cross-fades (220ms).
6. Tap a dim tile → that tile becomes focused.
7. Tap focused tile → navigates to `/designs/<slug>`.
8. Click dots → jumps to that real index.
9. Press `ArrowLeft` / `ArrowRight` → carousel moves (RTL-correct direction).
10. Swipe left or right on mobile → carousel moves with the finger.
11. Navigate forward past the last design → 5th-6th-7th-8th-clone-clone smoothly, then silent jump (no visible snap) to real-equivalent. Caption doesn't blink during the jump.
12. Navigate backward past the first → mirror behavior.
13. Mash next arrow 10× rapidly → ends on a sensible focused state, no broken layout, no leftover `is-jumping` class.
14. Resize window → layout reflows, focused tile stays centered.
15. Enable `prefers-reduced-motion: reduce` (DevTools Rendering) → tile transforms disappear (uniform size), all transitions are instant, pulse dot frozen. Carousel still navigates.
16. Empty / 1-design fallbacks (mock data) still work — render the existing message and `SingleDesignFallback`.

### 8.3 Build / typecheck

- `pnpm --filter @zhic/web typecheck` clean
- `pnpm --filter @zhic/web build` clean
- `curl http://localhost:3000/designs` returns 200; HTML contains `aria-label="گالری طرح‌ها"` and at least `2 * N_CLONES + designs.length` tile elements

---

## 9. Acceptance criteria

The PR is done when **all** of the following are true:

1. `/designs` renders the live designs (currently 8) in a Big Carousel with focused tile scaled 1.35× (1.45× mobile) and dim tiles scaled 0.55× (0.42×) with 3px blur and 0.40 opacity (0.30 mobile).
2. Focused tile has 1px `var(--color-forest)` stroke + 10px radius + NO `box-shadow`. Inline-start corners rounded, inline-end corners open where the media bleeds.
3. Media bleeds 45% past the focused tile's inline-end edge on desktop, 30% on mobile.
4. Tile-bg's empty-state background is `linear-gradient(135deg, rgba(95,119,96,0.04), rgba(95,119,96,0.10))` (very subtle forest tint).
5. No `«ژ»` watermark renders anywhere. No `<TilePlaceholder>` component remains. No per-tile name span.
6. Eyebrow «طرح» renders on every tile in the top inline-start corner, forest color, small-cap tracked.
7. Caption renders the focused name at `clamp(40px, 6vw, 80px)` weight 900, pulled up via `margin-top: clamp(-160px, -10vw, -100px)` on desktop. Tagline at `clamp(13px, 1.3vw, 17px)`. Text-shadow paper-glow present.
8. Caption cross-fades on real-index changes only (NOT during silent jumps).
9. Arrows: `clamp(48px, 5vw, 64px)` circles, ivory bg, sand border, hover transition. Hidden on viewports `≤ 768px`.
10. Pulse dot present on every tile's `.tile-bg`, 8px forest, 1.8s ring pulse, top inline-end corner.
11. Navigating past the last real design continues smoothly into clones, then silent-jumps back to real-equivalent index. No visible snap. Caption stays put during the jump.
12. Mashing arrows fast doesn't break the layout, doesn't leave `is-jumping` class stuck, and doesn't desync caption from focused.
13. `prefers-reduced-motion: reduce` removes all transforms, transitions, and the pulse animation. Carousel still functions.
14. Resize re-centers the focused tile without animation.
15. `pnpm --filter @zhic/web typecheck` clean. `pnpm --filter @zhic/web build` clean.
16. Mobile (`≤ 768px`) doesn't introduce horizontal page scroll; 30% spill is contained within the viewport.
17. `docs/state.md` updated: the "Designs index page" row (2026-05-17) marked **revised** with a pointer to this spec; a new "Designs index — Big Carousel" row added.

---

## 10. Follow-ups (out of scope, capture for `state.md`)

| Id (proposed) | Item |
|---|---|
| `FU-BC-a` | Extract `extendedArrayFor(designs)` and `realIndexOf` as pure helpers in a separate module; add unit tests once `@testing-library/react` is wired into `apps/web` (`FU-2.1-a`). |
| `FU-BC-b` | Add an "On this design" hover preview — small pop-over from the focused tile showing 2-3 piece thumbnails. Out for now (clutter risk). |
| `FU-BC-c` | Make the spill amount and tile scales operator-tunable via `site-config` (now that the global exists). Out for now; CSS vars suffice. |
| `FU-BC-d` | Cross-fade media on dim → focused transition instead of just opacity + filter step. Out for now; current transitions read well. |
| `FU-BC-e` | "Latest" / "Most viewed" filter chips above the carousel. Explicitly out per original spec; flag here so it has a home if revived. |

---

## 11. References

- Mockup source: `apps/web/public/docs/designs-big-carousel-mockup.html` (May 18 — author = operator). This spec overrides the mockup on: (a) spill % (45% not 26%), (b) stroke color (forest not sand), (c) box-shadow (removed), (d) watermark (removed), (e) per-tile name (removed), (f) empty-state background (forest-tinted gradient, not cream-to-sand).
- Original `/designs` spec: `docs/superpowers/specs/2026-05-17-designs-index-page-design.md`
- Current implementation: `apps/web/src/components/design/DesignsSlider.tsx` + `designs-slider.css`
- Design tokens: `packages/design-system/`
- State board: `docs/state.md`
