# Bedroom-Set Landing — Frontend Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the finished `bedroom-set-v2` mockup into the real Next.js `/bedroom-set` route with 1:1 fidelity (every component, gesture, timing, and pixel identical), driven by placeholder data shaped like the future Payload types.

**Architecture:** The RSC `page.tsx` imports a placeholder data module and renders a `'use client'` orchestrator (`BedroomSetLanding`) that owns view state + cross-cutting gestures. Child islands (`DesignCarousel`, `CategoryTabs`, `WritingSection`, `FeaturedOverlay`, `RotatingHeadline`, `Toast`) mirror the mockup's imperative RAF/pointer logic via refs — the same pattern the existing `DesignsSlider` uses. Pure carousel math and the headline word-split are extracted into testable modules. All content is server-rendered for SEO; the featured overlay's content lives in the DOM behind the swipe.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Vitest 2 + @testing-library/react (jsdom), Tailwind v4 + `@zhic/design-system` tokens, `@zhic/locale` (Persian digits), self-hosted Ayandeh font.

**Source of truth:** `apps/web/public/mockups/bedroom-set-v2/index.html`. **Spec:** `docs/superpowers/specs/2026-06-05-bedroom-set-frontend-port.md`. When in doubt, the mockup wins.

---

## File Structure

**New — component island + logic (`apps/web/src/components/bedroom-set/`)**
- `placeholder-data.ts` — types (mirror future Payload) + `DESIGNS`, `FEATURED_PAGES`, `WRITING`.
- `carousel-math.ts` — pure carousel/flip math (testable).
- `headline.ts` — `splitTitleWords` (testable).
- `bedroom-set.css` — the ported stylesheet (tokens, `zh-bs-` prefixed selectors).
- `Toast.tsx` — presentational toast (controlled).
- `CategoryTabs.tsx` — the نوزاد/نوجوان/دونفره stub.
- `WritingSection.tsx` — writing panel + up-cue.
- `RotatingHeadline.tsx` — word-by-word replace headline (imperative-in-effect).
- `FeaturedOverlay.tsx` — fixed swipe-up overlay (+ internal `FeaturedGrid`).
- `DesignCarousel.tsx` — the carousel stage (RAF engine, flip-logo, dots, counter, tabs).
- `BedroomSetLanding.tsx` — client orchestrator (view state, toast, swipe-up-at-bottom).
- `__tests__/` — co-located `*.test.ts(x)`.

**New — assets (`apps/web/public/bedroom-set/`)**
- 7 design `.webp` + 7 `-logo.png` + `lotus-banner.png` + `luka-plus-banner.png` + `rect51.png` + `rect53/55/56.webp`.

**Modify**
- `apps/web/src/app/(site)/bedroom-set/page.tsx` — render `BedroomSetLanding` with placeholder data (keep existing `metadata`).
- `packages/design-system/css/tokens.css` — add `--ease-spring`.
- `packages/design-system/src/tokens/motion.ts` — add `spring` easing.

**Untouched:** `DesignsSlider.tsx` (no longer used by this route; retiring it is out of scope), `bedroom-set/[slug]/`, the site shell.

**Naming note:** every selector is prefixed `zh-bs-` to avoid colliding with global styles. Component colors that aren't brand tokens (the cat-pill shades `#F4F1ED/#EFE9E1/#ECE5DA`, the fback bg `rgba(250,250,247,.82)`, the glass band `rgba(12,9,7,.32)`) stay as **literal hexes/rgba — do not tokenize them**, they're bespoke to the mockup and parity is the rule.

---

## Task 1: Add the `--ease-spring` motion token

The rotating headline's overshoot spring (`cubic-bezier(.34,1.45,.5,1)`) must become a design-system token (repo rule: tokens are never bypassed). CSS var + TS token are **hand-synced** (no generator) — add both.

**Files:**
- Modify: `packages/design-system/css/tokens.css` (after the easing block, ~line 128)
- Modify: `packages/design-system/src/tokens/motion.ts` (the `easing` object)
- Test: `apps/web/src/lib/__tests__/design-tokens.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/lib/__tests__/design-tokens.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { easing } from '@zhic/design-system';

describe('design-system motion tokens', () => {
  it('exposes the spring-overshoot easing used by the bedroom-set rotating headline', () => {
    expect(easing.spring).toBe('cubic-bezier(0.34, 1.45, 0.5, 1)');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/ahmad/Zhic/apps/web && npx vitest run src/lib/__tests__/design-tokens.test.ts`
Expected: FAIL — `easing.spring` is `undefined` (`expected undefined to be 'cubic-bezier(0.34, 1.45, 0.5, 1)'`).

- [ ] **Step 3: Add the TS token**

In `packages/design-system/src/tokens/motion.ts`, add `spring` to the `easing` object (keep the existing entries):

```typescript
export const easing = {
  outSoft: 'cubic-bezier(0.22, 1, 0.36, 1)',
  inSoft: 'cubic-bezier(0.64, 0, 0.78, 0)',
  inOutSoft: 'cubic-bezier(0.65, 0, 0.35, 1)',
  expoOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
  spring: 'cubic-bezier(0.34, 1.45, 0.5, 1)',
} as const;
```

- [ ] **Step 4: Add the CSS var (kept in sync)**

In `packages/design-system/css/tokens.css`, immediately after the `--ease-expo-out:` line (end of the easing group, ~line 128), add:

```css
--ease-spring:      cubic-bezier(0.34, 1.45, 0.5, 1);
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd /home/ahmad/Zhic/apps/web && npx vitest run src/lib/__tests__/design-tokens.test.ts`
Expected: PASS (1 test).

- [ ] **Step 6: Commit**

```bash
cd /home/ahmad/Zhic
git add packages/design-system/css/tokens.css packages/design-system/src/tokens/motion.ts apps/web/src/lib/__tests__/design-tokens.test.ts
git commit -m "feat(design-system): add --ease-spring overshoot easing token"
```

---

## Task 2: Copy placeholder image assets into `public/bedroom-set/`

Real Next assets (no base64). Sources: the mockup's `assets/` dir + the original banners/rect51 in `/home/ahmad/imports`.

**Files:**
- Create: `apps/web/public/bedroom-set/` (20 image files)

- [ ] **Step 1: Copy the assets**

```bash
DST=/home/ahmad/Zhic/apps/web/public/bedroom-set
SRC=/home/ahmad/Zhic/apps/web/public/mockups/bedroom-set-v2/assets
mkdir -p "$DST"
cp "$SRC"/{lotus,parla,caroline,iron,jacqueline,lukaplus,loof}.webp "$DST"/
cp "$SRC"/{lotus,parla,caroline,iron,jacqueline,lukaplus,loof}-logo.png "$DST"/
cp "$SRC"/featured/rect53.webp "$SRC"/featured/rect55.webp "$SRC"/featured/rect56.webp "$DST"/
cp "/home/ahmad/imports/new-batch/Rectangle 51.png" "$DST"/rect51.png
cp "/home/ahmad/imports/journals-media/journals-media/lotus-banner.png" "$DST"/lotus-banner.png
cp "/home/ahmad/imports/journals-media/journals-media/luka-plus-banner.png" "$DST"/luka-plus-banner.png
```

- [ ] **Step 2: Verify all 20 files exist**

Run: `ls -1 /home/ahmad/Zhic/apps/web/public/bedroom-set/ | wc -l && ls -1 /home/ahmad/Zhic/apps/web/public/bedroom-set/`
Expected: `20`, and the list contains `lotus.webp … loof.webp` (7), `lotus-logo.png … loof-logo.png` (7), `rect51.png`, `rect53.webp`, `rect55.webp`, `rect56.webp`, `lotus-banner.png`, `luka-plus-banner.png`.

- [ ] **Step 3: Commit**

```bash
cd /home/ahmad/Zhic
git add apps/web/public/bedroom-set
git commit -m "chore(web): add bedroom-set placeholder image assets"
```

---

## Task 3: Placeholder data module

Types mirror the future Payload shape so SP1 (data wiring) is a swap. Asset paths are strings (like a future `media.url`).

**Files:**
- Create: `apps/web/src/components/bedroom-set/placeholder-data.ts`
- Test: `apps/web/src/components/bedroom-set/__tests__/placeholder-data.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/components/bedroom-set/__tests__/placeholder-data.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { DESIGNS, FEATURED_PAGES, WRITING } from '../placeholder-data';

describe('bedroom-set placeholder data', () => {
  it('has the 7 mockup designs in order', () => {
    expect(DESIGNS.map((d) => d.slug)).toEqual([
      'lotus', 'parla', 'caroline', 'iron', 'jacqueline', 'lukaplus', 'loof',
    ]);
    expect(DESIGNS[0]).toMatchObject({
      name: 'لوتوس',
      cardSrc: '/bedroom-set/lotus.webp',
      logoSrc: '/bedroom-set/lotus-logo.png',
    });
  });

  it('has the 2 featured pages with hero + 2 row tiles each', () => {
    expect(FEATURED_PAGES).toHaveLength(2);
    expect(FEATURED_PAGES[0]!.title).toBe('پرفروش‌ترین محصولات');
    expect(FEATURED_PAGES[1]!.title).toBe('جدیدترین محصولات');
    expect(FEATURED_PAGES[0]!.row).toHaveLength(2);
    expect(FEATURED_PAGES[0]!.hero.src).toBe('/bedroom-set/lotus-banner.png');
  });

  it('has the writing heading + a non-empty body', () => {
    expect(WRITING.heading).toBe('درباره‌ی این سرویس‌ها');
    expect(WRITING.body.length).toBeGreaterThan(40);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/ahmad/Zhic/apps/web && npx vitest run src/components/bedroom-set/__tests__/placeholder-data.test.ts`
Expected: FAIL — cannot resolve `../placeholder-data`.

- [ ] **Step 3: Create the data module**

Create `apps/web/src/components/bedroom-set/placeholder-data.ts`:

```typescript
// Placeholder data for the bedroom-set landing (SP2). Shapes mirror the
// future Payload types so SP1 (data wiring) is a swap, not a rewrite:
//   DesignCard.cardSrc  → design.sliderMedia ?? heroMedia (.url)
//   DesignCard.logoSrc  → design.logoMedia (.url)   ← new field added in SP1
//   FeaturedTile.src    → product/collection media (.url)
//   WritingContent      → a richText field
export type DesignCard = {
  slug: string;
  name: string;
  cardSrc: string;
  logoSrc: string;
};
export type FeaturedTile = { src: string; alt: string };
export type FeaturedPage = { title: string; hero: FeaturedTile; row: FeaturedTile[] };
export type WritingContent = { heading: string; body: string };

const A = '/bedroom-set';

export const DESIGNS: DesignCard[] = [
  { slug: 'lotus', name: 'لوتوس', cardSrc: `${A}/lotus.webp`, logoSrc: `${A}/lotus-logo.png` },
  { slug: 'parla', name: 'پارلا', cardSrc: `${A}/parla.webp`, logoSrc: `${A}/parla-logo.png` },
  { slug: 'caroline', name: 'کارولین', cardSrc: `${A}/caroline.webp`, logoSrc: `${A}/caroline-logo.png` },
  { slug: 'iron', name: 'آیرون', cardSrc: `${A}/iron.webp`, logoSrc: `${A}/iron-logo.png` },
  { slug: 'jacqueline', name: 'ژاکلین', cardSrc: `${A}/jacqueline.webp`, logoSrc: `${A}/jacqueline-logo.png` },
  { slug: 'lukaplus', name: 'لوکاپلاس', cardSrc: `${A}/lukaplus.webp`, logoSrc: `${A}/lukaplus-logo.png` },
  { slug: 'loof', name: 'لوف', cardSrc: `${A}/loof.webp`, logoSrc: `${A}/loof-logo.png` },
];

// Decorative marketing imagery — alt is '' for now (SP1 supplies real alts).
export const FEATURED_PAGES: FeaturedPage[] = [
  {
    title: 'پرفروش‌ترین محصولات',
    hero: { src: `${A}/lotus-banner.png`, alt: '' },
    row: [{ src: `${A}/rect55.webp`, alt: '' }, { src: `${A}/rect56.webp`, alt: '' }],
  },
  {
    title: 'جدیدترین محصولات',
    hero: { src: `${A}/luka-plus-banner.png`, alt: '' },
    row: [{ src: `${A}/rect51.png`, alt: '' }, { src: `${A}/rect53.webp`, alt: '' }],
  },
];

export const WRITING: WritingContent = {
  heading: 'درباره‌ی این سرویس‌ها',
  body:
    'هر سرویس خواب ژیک از چوب گردوی ایرانی و با وسواس در جزئیات ساخته می‌شود؛ ' +
    'خطوطی آرام، رنگ‌هایی که با گذر سال‌ها همراه‌تان می‌مانند، و قطعاتی که از میز ' +
    'تحریر تا کتاب‌خانه کنار هم هماهنگ‌اند. این مجموعه برای آرامشی بلندمدت طراحی ' +
    'شده — جایی که کیفیت خواب، از کیفیت فضا آغاز می‌شود.',
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /home/ahmad/Zhic/apps/web && npx vitest run src/components/bedroom-set/__tests__/placeholder-data.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
cd /home/ahmad/Zhic
git add apps/web/src/components/bedroom-set/placeholder-data.ts apps/web/src/components/bedroom-set/__tests__/placeholder-data.test.ts
git commit -m "feat(bedroom-set): add placeholder data module (future-Payload shape)"
```

---

## Task 4: Carousel math (pure, testable)

Extract the mockup's exact carousel/flip math from `index.html` (`slot`, `updateGlass`, `render`, `snapTo`) into pure functions. **Values are the mockup's, not the DesignsSlider's** (different constants).

**Files:**
- Create: `apps/web/src/components/bedroom-set/carousel-math.ts`
- Test: `apps/web/src/components/bedroom-set/__tests__/carousel-math.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/components/bedroom-set/__tests__/carousel-math.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import {
  clampIndex, slot, flipAngle, activeLogoIndex,
  bandOpacity, bandBlurPx, flipOpacity,
  cardScale, cardOpacity, cardBlurPx, cardZIndex, isCulled,
  snapDuration, easeOutQuart,
} from '../carousel-math';

describe('clampIndex', () => {
  it('clamps to [0, n-1]', () => {
    expect(clampIndex(-2, 7)).toBe(0);
    expect(clampIndex(9, 7)).toBe(6);
    expect(clampIndex(3, 7)).toBe(3);
  });
});

describe('slot', () => {
  it('desktop: cardW(0.68) + innerWidth*0.07', () => {
    // 800*0.68*0.703 + 1200*0.07 = 382.432 + 84 = 466.432
    expect(slot(1200, 800, false)).toBeCloseTo(466.432, 2);
  });
  it('mobile: cardW(0.58) + innerWidth*0.10', () => {
    // 844*0.58*0.703 + 390*0.10 = 344.13256 + 39
    expect(slot(390, 844, true)).toBeCloseTo(344.13256 + 39, 2);
  });
});

describe('flipAngle (half-flip, never past ±90)', () => {
  it('tilts out 0→90 then in -90→0', () => {
    expect(flipAngle(0)).toBe(0);
    expect(flipAngle(0.25)).toBe(45);
    expect(flipAngle(0.5)).toBe(-90); // mockup uses `frac < 0.5`; exactly 0.5 takes the else branch → -90 (edge-on, visually identical to +90)
    expect(flipAngle(0.75)).toBe(-45);
    expect(flipAngle(1)).toBe(0);
  });
});

describe('activeLogoIndex', () => {
  it('lower logo while tilting out, upper while tilting in', () => {
    expect(activeLogoIndex(2, 3, 0.3)).toBe(2);
    expect(activeLogoIndex(2, 3, 0.5)).toBe(3);
    expect(activeLogoIndex(2, 3, 0.7)).toBe(3);
  });
});

describe('glass crossfade', () => {
  it('band/flip blur+fade peak at the crossover (frac=0.5)', () => {
    expect(bandOpacity(0)).toBeCloseTo(1, 5);
    expect(bandOpacity(0.5)).toBeCloseTo(1 - 0.82, 5); // sin(pi/2)=1
    expect(bandBlurPx(0.5)).toBe(12);
    expect(bandBlurPx(0)).toBe(0);
    expect(flipOpacity(0.5)).toBeCloseTo(1 - 0.9, 5);
  });
});

describe('card transforms', () => {
  it('scale/opacity/blur/z by absolute distance, with floors + cull', () => {
    expect(cardScale(0)).toBe(1);
    expect(cardScale(2)).toBe(0.5); // max(0.5, 1-0.52)
    expect(cardOpacity(0)).toBe(1);
    expect(cardOpacity(3)).toBe(0.14); // max(0.14, 1-1.2)
    expect(cardBlurPx(1)).toBe(7);
    expect(cardBlurPx(10)).toBe(16); // min(16, 70)
    expect(cardZIndex(0)).toBe(100);
    expect(cardZIndex(1)).toBe(90);
    expect(isCulled(2.2)).toBe(false);
    expect(isCulled(2.3)).toBe(true);
  });
});

describe('snapDuration', () => {
  it('clamps to [280, 640] around |dist|*440', () => {
    expect(snapDuration(0.1)).toBe(280);
    expect(snapDuration(1)).toBe(440);
    expect(snapDuration(2)).toBe(640);
  });
});

describe('easeOutQuart', () => {
  it('1-(1-t)^4', () => {
    expect(easeOutQuart(0)).toBe(0);
    expect(easeOutQuart(1)).toBe(1);
    expect(easeOutQuart(0.5)).toBeCloseTo(0.9375, 5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/ahmad/Zhic/apps/web && npx vitest run src/components/bedroom-set/__tests__/carousel-math.test.ts`
Expected: FAIL — cannot resolve `../carousel-math`.

- [ ] **Step 3: Implement the math module**

Create `apps/web/src/components/bedroom-set/carousel-math.ts`:

```typescript
// Pure carousel/flip math — ported verbatim from the bedroom-set-v2 mockup
// (index.html: slot/updateGlass/render/snapTo). Constants are the mockup's.

export const clampIndex = (p: number, n: number): number =>
  Math.max(0, Math.min(n - 1, p));

/** Per-card horizontal spacing. `mobile` = matchMedia('(max-width:768px)'). */
export function slot(innerWidth: number, innerHeight: number, mobile: boolean): number {
  const cardW = innerHeight * (mobile ? 0.58 : 0.68) * 0.703;
  return cardW + innerWidth * (mobile ? 0.1 : 0.07);
}

// Half-flip: tilt OUT to 90° (edge-on), swap the visible logo, tilt back IN.
// Angle never leaves ±90°, so a logo can never be seen upside-down.
export const flipAngle = (frac: number): number =>
  frac < 0.5 ? frac * 180 : frac * 180 - 180;

export const activeLogoIndex = (lo: number, hi: number, frac: number): number =>
  frac < 0.5 ? lo : hi;

// Glass band + flip crossfade — 0 at a card, peaks at the crossover (frac=0.5).
const crossfadeMid = (frac: number): number => Math.sin(frac * Math.PI);
export const bandOpacity = (frac: number): number => 1 - crossfadeMid(frac) * 0.82;
export const bandBlurPx = (frac: number): number => Math.round(crossfadeMid(frac) * 12);
export const flipOpacity = (frac: number): number => 1 - crossfadeMid(frac) * 0.9;

// Per-card transforms by absolute distance from the focused index.
export const cardScale = (absDist: number): number => Math.max(0.5, 1 - absDist * 0.26);
export const cardOpacity = (absDist: number): number => Math.max(0.14, 1 - absDist * 0.4);
export const cardBlurPx = (absDist: number): number => Math.min(16, Math.round(absDist * 7));
export const cardZIndex = (absDist: number): number => Math.round(100 - absDist * 10);
export const isCulled = (absDist: number): boolean => absDist > 2.2;

// Snap animation: duration clamped to [280, 640]; ease-out-quart.
export const snapDuration = (distance: number): number =>
  Math.min(640, Math.max(280, Math.abs(distance) * 440));
export const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /home/ahmad/Zhic/apps/web && npx vitest run src/components/bedroom-set/__tests__/carousel-math.test.ts`
Expected: PASS (8 describe blocks, all green).

- [ ] **Step 5: Commit**

```bash
cd /home/ahmad/Zhic
git add apps/web/src/components/bedroom-set/carousel-math.ts apps/web/src/components/bedroom-set/__tests__/carousel-math.test.ts
git commit -m "feat(bedroom-set): pure carousel/flip math (ported from mockup)"
```

---

## Task 5: Headline word-split (pure, testable)

The rotating headline splits on space, treating each whole word as one animated unit so Persian cursive joins (and the ZWNJ inside «پرفروش‌ترین») stay intact.

**Files:**
- Create: `apps/web/src/components/bedroom-set/headline.ts`
- Test: `apps/web/src/components/bedroom-set/__tests__/headline.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/components/bedroom-set/__tests__/headline.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { splitTitleWords } from '../headline';

describe('splitTitleWords', () => {
  it('splits on spaces, keeping intra-word ZWNJ intact', () => {
    expect(splitTitleWords('پرفروش‌ترین محصولات')).toEqual(['پرفروش‌ترین', 'محصولات']);
  });
  it('returns a single element for a one-word title', () => {
    expect(splitTitleWords('محصولات')).toEqual(['محصولات']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/ahmad/Zhic/apps/web && npx vitest run src/components/bedroom-set/__tests__/headline.test.ts`
Expected: FAIL — cannot resolve `../headline`.

- [ ] **Step 3: Implement**

Create `apps/web/src/components/bedroom-set/headline.ts`:

```typescript
// Split a headline into whole words. Each word becomes one animated unit so
// Persian cursive joins (and intra-word ZWNJ) are never broken mid-glyph.
export const splitTitleWords = (title: string): string[] => title.split(' ');
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /home/ahmad/Zhic/apps/web && npx vitest run src/components/bedroom-set/__tests__/headline.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
cd /home/ahmad/Zhic
git add apps/web/src/components/bedroom-set/headline.ts apps/web/src/components/bedroom-set/__tests__/headline.test.ts
git commit -m "feat(bedroom-set): headline word-split helper"
```

---

## Task 6: Ported stylesheet (`bedroom-set.css`)

The mockup's `<style>` block (index.html lines 12–85), with: `:root`/`@font-face` deleted, brand colors → tokens (identical values), easings → token names (`--ease` → `--ease-out-soft`, `--ease-q` → `--ease-expo-out`, `--rt-spring` → `--ease-spring`), all selectors `zh-bs-` prefixed, `--card-h/--card-w` scoped to the stage, and the header-height offset added (the one shell reconciliation). Bespoke non-token colors stay literal. **No unit test — CSS parity is verified in Task 15.**

**Files:**
- Create: `apps/web/src/components/bedroom-set/bedroom-set.css`

- [ ] **Step 1: Write the stylesheet**

Create `apps/web/src/components/bedroom-set/bedroom-set.css` with exactly:

```css
/* Bedroom-set landing — ported 1:1 from public/mockups/bedroom-set-v2/index.html.
   Tokens replace the mockup's :root hexes (identical values); selectors are
   zh-bs- prefixed; the stage gets a --header-height top offset (the only shell
   reconciliation). Bespoke non-brand colors are kept literal for exact parity. */

.zh-bs-stage {
  --card-h: 68vh;
  --card-w: calc(var(--card-h) * 0.703);
  box-sizing: border-box;
  position: relative;
  width: 100%;
  height: 100svh;
  overflow: hidden;
  display: grid;
  grid-template-rows: auto 1fr auto;
  align-items: center;
  padding-block-start: calc(var(--header-height) + var(--space-4));
  cursor: grab;
  touch-action: pan-y;
  user-select: none;
  -webkit-user-select: none;
  background: var(--color-ivory);
  color: var(--color-charcoal);
  font-family: var(--font-ayandeh), Tahoma, sans-serif;
}
@media (min-width: 768px) {
  .zh-bs-stage { padding-block-start: calc(var(--header-height) + var(--space-5)); }
}
.zh-bs-stage:active { cursor: grabbing; }
.zh-bs-stage::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  opacity: 0.06;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  background-size: 240px 240px;
}
.zh-bs-stage > * { position: relative; z-index: 2; }

.zh-bs-top {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: clamp(12px, 3vw, 32px);
  padding: 18px clamp(16px, 4vw, 48px) 0;
  max-width: 1480px;
  margin-inline: auto;
  width: 100%;
  font-size: 12px;
  color: var(--color-stone);
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.zh-bs-crumb { justify-self: start; text-transform: none; letter-spacing: 0; }
.zh-bs-crumb a { color: inherit; text-decoration: none; }
.zh-bs-crumb a:hover { color: var(--color-charcoal); }
.zh-bs-dots { justify-self: center; display: flex; gap: 8px; align-items: center; }
.zh-bs-dot {
  width: 7px; height: 7px; border-radius: 999px; background: var(--color-sand);
  border: 0; padding: 0; cursor: pointer;
  transition: width 0.35s var(--ease-expo-out), background-color 0.24s var(--ease-out-soft);
}
.zh-bs-dot:hover { background: var(--color-stone); }
.zh-bs-dot.on { background: var(--color-charcoal); width: 20px; }

.zh-bs-strip { position: relative; width: 100%; height: 100%; }
.zh-bs-track { position: absolute; inset: 0; }
.zh-bs-card {
  position: absolute; top: 50%; left: 50%;
  width: var(--card-w); height: var(--card-h);
  transform-origin: 50% 50%; will-change: transform, opacity, filter;
}
.zh-bs-card img {
  width: 100%; height: 100%; object-fit: contain; display: block;
  filter: drop-shadow(0 26px 46px rgba(20, 17, 15, 0.2)); pointer-events: none;
}

.zh-bs-focus {
  position: absolute; top: 50%; left: 50%;
  width: var(--card-w); height: var(--card-h);
  transform: translate(-50%, -50%); z-index: 130; pointer-events: none;
  display: flex; align-items: center; justify-content: center; perspective: 1400px;
}
.zh-bs-band {
  position: absolute; left: 0; top: 50%; transform: translateY(-50%);
  width: 100%; height: 33.3%; border-radius: 6px;
  -webkit-backdrop-filter: blur(8px) saturate(1.08);
  backdrop-filter: blur(8px) saturate(1.08);
  background: rgba(12, 9, 7, 0.32); border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 14px 36px -14px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  will-change: opacity, filter;
}
.zh-bs-flip {
  position: relative; z-index: 1; width: 62%; height: 22%;
  transform: rotateX(0deg); will-change: transform, opacity;
}
.zh-bs-lg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; opacity: 0; }

.zh-bs-prompt {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  padding-bottom: 14px; color: var(--color-stone); font-size: 10px;
  letter-spacing: 0.14em; text-transform: uppercase; opacity: 0.7;
}
.zh-bs-prompt svg { width: 18px; height: 18px; animation: zh-bs-nudge 1.7s var(--ease-out-soft) infinite; }
@keyframes zh-bs-nudge {
  0%, 100% { transform: translateX(0); opacity: 0.55; }
  50% { transform: translateX(7px); opacity: 1; }
}

.zh-bs-toast {
  position: fixed; left: 50%; bottom: 18%; transform: translate(-50%, 8px);
  z-index: 400; font-size: 12px; font-weight: 700; letter-spacing: 0.05em;
  color: var(--color-ivory); background: rgba(20, 17, 15, 0.86);
  padding: 9px 18px; border-radius: 999px; opacity: 0; pointer-events: none;
  transition: opacity 0.25s, transform 0.35s var(--ease-out-soft);
}
.zh-bs-toast.show { opacity: 1; transform: translate(-50%, 0); }

@media (max-width: 768px) {
  .zh-bs-stage { --card-h: 58vh; }
  .zh-bs-top { padding-top: 12px; }
  .zh-bs-crumb { display: none; }
  .zh-bs-dots { grid-column: 1 / -1; }
  .zh-bs-featured { padding: 44px 0px 14px; }
  .zh-bs-grid { max-width: none; --g: 2px; }
}
@media (prefers-reduced-motion: reduce) {
  .zh-bs-prompt svg, .zh-bs-upcue svg { animation: none; }
  .zh-bs-tile, .zh-bs-fhead .zh-bs-rt-el { transition: none; }
}

.zh-bs-featured {
  position: fixed; inset: 0; z-index: 300; background: var(--color-ivory);
  display: flex; flex-direction: column; align-items: center; justify-content: safe center;
  padding: clamp(56px, 9vh, 104px) 0px clamp(28px, 5vh, 52px);
  opacity: 0; visibility: hidden; transform: translateY(10px); touch-action: none;
  transition: opacity 0.42s var(--ease-out-soft), transform 0.42s var(--ease-out-soft), visibility 0s linear 0.42s;
}
.zh-bs-featured.show {
  opacity: 1; visibility: visible; transform: none;
  transition: opacity 0.42s var(--ease-out-soft), transform 0.42s var(--ease-out-soft), visibility 0s;
}
.zh-bs-fhead {
  flex: 0 0 auto; display: flex; flex-wrap: wrap; justify-content: center;
  max-width: 92vw; white-space: pre-wrap; font-weight: 900;
  font-size: clamp(22px, 5.6vw, 38px); line-height: 1.5; color: var(--color-charcoal);
  padding-block: clamp(12px, 2.4vh, 24px); margin-bottom: clamp(20px, 4vh, 42px);
}
.zh-bs-rt-word {
  display: inline-flex; overflow: hidden;
  padding-block: 0.42em 0.34em; margin-block: -0.42em -0.34em;
}
.zh-bs-rt-el {
  display: inline-block; transform: translateY(115%); opacity: 0;
  transition: transform 0.6s var(--ease-spring), opacity 0.42s ease; will-change: transform;
}
.zh-bs-rt-el.in { transform: translateY(0); opacity: 1; }
.zh-bs-rt-el.out {
  transform: translateY(-120%); opacity: 0;
  transition: transform 0.45s var(--ease-out-soft), opacity 0.32s ease;
}
.zh-bs-rt-space { white-space: pre; }

.zh-bs-grid {
  width: 100%; max-width: 800px; flex: 0 1 auto; min-height: 0; overflow: hidden;
  --g: 2px; --inset: clamp(18px, 5.5vw, 42px); padding-inline: var(--inset);
  display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--g); justify-items: stretch;
}
.zh-bs-tile {
  position: relative; width: 100%; border: 0; padding: 0; background: none; cursor: pointer;
  opacity: 0; transform: translateY(44px);
  transition: transform 0.55s var(--ease-out-soft), opacity 0.55s var(--ease-out-soft);
}
.zh-bs-tile.hero { grid-column: 1 / -1; overflow: hidden; }
.zh-bs-tile.hero::before { content: ''; display: block; padding-bottom: 43.5%; }
.zh-bs-tile.hero img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.zh-bs-tile.in { opacity: 1; transform: none; }
.zh-bs-tile img { width: 100%; height: auto; display: block; pointer-events: none; }
.zh-bs-fdots {
  position: absolute; bottom: clamp(16px, 3.4vh, 30px); left: 50%;
  transform: translateX(-50%); z-index: 2; display: flex; gap: 8px;
}
.zh-bs-fdot { width: 7px; height: 7px; border-radius: 999px; background: var(--color-sand); transition: background-color 0.3s, width 0.3s; }
.zh-bs-fdot.on { background: var(--color-charcoal); width: 20px; }
.zh-bs-fback {
  position: absolute; top: 14px; left: 50%; transform: translateX(-50%); z-index: 2;
  width: 40px; height: 40px; border-radius: 999px; border: 1px solid var(--color-sand);
  background: rgba(250, 250, 247, 0.82); color: var(--color-stone); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
  transition: color 0.24s, border-color 0.24s;
}
.zh-bs-fback:hover { color: var(--color-charcoal); border-color: var(--color-stone); }
.zh-bs-fback svg { width: 18px; height: 18px; }
.zh-bs-upcue {
  display: flex; flex-direction: column; align-items: center; gap: 5px; width: fit-content;
  margin: clamp(34px, 6vh, 64px) auto 0; border: 0; background: none; color: var(--color-stone);
  cursor: pointer; font-family: inherit; font-size: 10px; letter-spacing: 0.14em;
  text-transform: uppercase; transition: color 0.24s;
}
.zh-bs-upcue:hover { color: var(--color-charcoal); }
.zh-bs-upcue svg { width: 22px; height: 22px; animation: zh-bs-bob 1.8s var(--ease-out-soft) infinite; }
@keyframes zh-bs-bob {
  0%, 100% { transform: translateY(0); opacity: 0.5; }
  50% { transform: translateY(-5px); opacity: 1; }
}

.zh-bs-cats {
  position: absolute; left: 50%; bottom: clamp(84px, 12vh, 106px);
  transform: translateX(-50%); z-index: 9; display: flex; gap: 6px;
}
.zh-bs-cat {
  font-family: inherit; font-weight: 700; font-size: clamp(13px, 3.4vw, 16px); line-height: 1;
  color: var(--color-charcoal); background: #F4F1ED; border: 1.5px solid var(--color-gold);
  border-radius: 0; padding: 9px 18px; cursor: pointer; white-space: nowrap;
  transition: background-color 0.22s var(--ease-out-soft), color 0.22s var(--ease-out-soft);
}
.zh-bs-cat:first-child { border-top-right-radius: 22px; }
.zh-bs-cat:last-child { border-bottom-left-radius: 22px; }
.zh-bs-cat:hover { background: #EFE9E1; }
.zh-bs-cat.on { background: #ECE5DA; }

.zh-bs-writing {
  max-width: 680px; margin: 0 auto;
  padding: clamp(54px, 9vh, 100px) clamp(22px, 6vw, 48px) clamp(72px, 12vh, 130px);
  text-align: center;
}
.zh-bs-weyebrow {
  font-family: inherit; font-weight: 900; font-size: clamp(22px, 5.6vw, 34px);
  line-height: 1.35; color: var(--color-charcoal); margin: 0 0 clamp(18px, 3.4vh, 30px);
}
.zh-bs-wbody { font-size: clamp(14px, 3.9vw, 17px); line-height: 2.05; color: var(--color-stone); margin: 0; }
.zh-bs-wpanel {
  position: relative; border-radius: 0 18px 18px 0;
  padding: clamp(24px, 4.6vh, 42px) clamp(20px, 5vw, 38px);
}
.zh-bs-wpanel::before {
  content: ''; position: absolute; inset: 0; border-radius: inherit; padding: 1.5px;
  background: linear-gradient(to bottom, var(--color-forest), var(--color-forest) 22%, transparent 92%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none;
}
```

- [ ] **Step 2: Verify it's valid CSS the build accepts (typecheck is a no-op for CSS; lint the dir)**

Run: `cd /home/ahmad/Zhic/apps/web && npx eslint src/components/bedroom-set/ || true`
Expected: no errors about the `.css` (ESLint ignores CSS; this just confirms nothing else broke). The real check is the build in Task 14.

- [ ] **Step 3: Commit**

```bash
cd /home/ahmad/Zhic
git add apps/web/src/components/bedroom-set/bedroom-set.css
git commit -m "feat(bedroom-set): ported stylesheet (tokens + zh-bs- prefix)"
```

---

## Task 7: Toast component

Controlled presentational toast (state lives in the orchestrator).

**Files:**
- Create: `apps/web/src/components/bedroom-set/Toast.tsx`

- [ ] **Step 1: Implement (no behavior to unit-test — covered by the landing test in Task 13)**

Create `apps/web/src/components/bedroom-set/Toast.tsx`:

```tsx
export function Toast({ text, show }: { text: string; show: boolean }) {
  return <div className={`zh-bs-toast${show ? ' show' : ''}`}>{text}</div>;
}
```

- [ ] **Step 2: Typecheck**

Run: `cd /home/ahmad/Zhic/apps/web && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
cd /home/ahmad/Zhic
git add apps/web/src/components/bedroom-set/Toast.tsx
git commit -m "feat(bedroom-set): Toast component"
```

---

## Task 8: CategoryTabs (stub)

Three pills; clicking toggles the active recess. Stub only — real occupancy filtering/linking is SP1 (out of scope).

**Files:**
- Create: `apps/web/src/components/bedroom-set/CategoryTabs.tsx`
- Test: `apps/web/src/components/bedroom-set/__tests__/CategoryTabs.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/components/bedroom-set/__tests__/CategoryTabs.test.tsx`:

```tsx
/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { CategoryTabs } from '../CategoryTabs';

describe('<CategoryTabs>', () => {
  it('renders the three kashida-stretched room pills, first active', () => {
    const { container } = render(<CategoryTabs />);
    const pills = container.querySelectorAll('.zh-bs-cat');
    expect(pills.length).toBe(3);
    expect(pills[0]!.textContent).toBe('نـــــوزاد');
    expect(pills[0]!.className).toContain('on');
    expect(pills[1]!.className).not.toContain('on');
  });

  it('moves the active recess to a clicked pill', () => {
    const { container } = render(<CategoryTabs />);
    const pills = container.querySelectorAll<HTMLButtonElement>('.zh-bs-cat');
    pills[2]!.click();
    expect(pills[2]!.className).toContain('on');
    expect(pills[0]!.className).not.toContain('on');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/ahmad/Zhic/apps/web && npx vitest run src/components/bedroom-set/__tests__/CategoryTabs.test.tsx`
Expected: FAIL — cannot resolve `../CategoryTabs`.

- [ ] **Step 3: Implement**

Create `apps/web/src/components/bedroom-set/CategoryTabs.tsx`:

```tsx
'use client';

import * as React from 'react';

// Stub: toggles the active pill only. Real occupancy filtering/linking is SP1.
const CATS = [
  { key: 'newborn', label: 'نـــــوزاد' },
  { key: 'teen', label: 'نـــــوجوان' },
  { key: 'couple', label: 'دونـــــفره' },
] as const;

export function CategoryTabs() {
  const [active, setActive] = React.useState<string>('newborn');
  return (
    <nav className="zh-bs-cats" aria-label="دسته‌بندی اتاق">
      {CATS.map((c) => (
        <button
          key={c.key}
          type="button"
          data-cat={c.key}
          className={`zh-bs-cat${active === c.key ? ' on' : ''}`}
          onClick={() => setActive(c.key)}
        >
          {c.label}
        </button>
      ))}
    </nav>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /home/ahmad/Zhic/apps/web && npx vitest run src/components/bedroom-set/__tests__/CategoryTabs.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
cd /home/ahmad/Zhic
git add apps/web/src/components/bedroom-set/CategoryTabs.tsx apps/web/src/components/bedroom-set/__tests__/CategoryTabs.test.tsx
git commit -m "feat(bedroom-set): CategoryTabs stub"
```

---

## Task 9: WritingSection

Static panel (heading + body + the fading green border via CSS) plus the up-cue button. No entrance animation (the mockup has none). Covered structurally by the Task 13 landing test.

**Files:**
- Create: `apps/web/src/components/bedroom-set/WritingSection.tsx`

- [ ] **Step 1: Implement**

Create `apps/web/src/components/bedroom-set/WritingSection.tsx`:

```tsx
import type { WritingContent } from './placeholder-data';

export function WritingSection({
  content,
  onOpenFeatured,
}: {
  content: WritingContent;
  onOpenFeatured: () => void;
}) {
  return (
    <section className="zh-bs-writing">
      <div className="zh-bs-wpanel">
        <h2 className="zh-bs-weyebrow">{content.heading}</h2>
        <p className="zh-bs-wbody">{content.body}</p>
      </div>
      <button className="zh-bs-upcue" type="button" aria-label="پرفروش‌ترین محصولات" onClick={onOpenFeatured}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M6 15 L12 9 L18 15" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>پرفروش‌ترین محصولات</span>
      </button>
    </section>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd /home/ahmad/Zhic/apps/web && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
cd /home/ahmad/Zhic
git add apps/web/src/components/bedroom-set/WritingSection.tsx
git commit -m "feat(bedroom-set): WritingSection"
```

---

## Task 10: RotatingHeadline

Word-by-word reveal with the AnimatePresence-"wait" replace effect. Ported imperatively from the mockup's `buildHeadline`/`setHeadline` into a single effect that owns the container's children (React renders an empty div — the D3-in-React pattern). Exact timings: enter delay `i*70ms` on double-rAF; exit delay `i*55ms`, swap after `430ms`.

**Files:**
- Create: `apps/web/src/components/bedroom-set/RotatingHeadline.tsx`
- Test: `apps/web/src/components/bedroom-set/__tests__/RotatingHeadline.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/components/bedroom-set/__tests__/RotatingHeadline.test.tsx`:

```tsx
/** @vitest-environment jsdom */
import { beforeAll, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { RotatingHeadline } from '../RotatingHeadline';

beforeAll(() => {
  // Run rAF synchronously so the build effect's word spans materialise.
  Object.defineProperty(window, 'requestAnimationFrame', {
    writable: true, configurable: true,
    value: (cb: FrameRequestCallback) => { cb(0); return 0; },
  });
  Object.defineProperty(window, 'cancelAnimationFrame', {
    writable: true, configurable: true, value: () => {},
  });
});

describe('<RotatingHeadline>', () => {
  it('builds one .zh-bs-rt-el per word with the title as aria-label', () => {
    const { container } = render(<RotatingHeadline title="پرفروش‌ترین محصولات" />);
    const head = container.querySelector('.zh-bs-fhead')!;
    expect(head.getAttribute('aria-label')).toBe('پرفروش‌ترین محصولات');
    const els = head.querySelectorAll('.zh-bs-rt-el');
    expect(els.length).toBe(2);
    expect(els[0]!.textContent).toBe('پرفروش‌ترین');
    expect(els[1]!.textContent).toBe('محصولات');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/ahmad/Zhic/apps/web && npx vitest run src/components/bedroom-set/__tests__/RotatingHeadline.test.tsx`
Expected: FAIL — cannot resolve `../RotatingHeadline`.

- [ ] **Step 3: Implement**

Create `apps/web/src/components/bedroom-set/RotatingHeadline.tsx`:

```tsx
'use client';

import * as React from 'react';
import { splitTitleWords } from './headline';

// Ported from the mockup's buildHeadline/setHeadline. React renders an empty
// container; this effect owns its children entirely (it never conflicts with
// React reconciliation because the JSX has no children).
export function RotatingHeadline({ title }: { title: string }) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    const fhead = ref.current;
    if (!fhead) return;

    const build = (t: string) => {
      fhead.textContent = '';
      fhead.setAttribute('aria-label', t);
      const els: HTMLSpanElement[] = [];
      const words = splitTitleWords(t);
      words.forEach((w, wi) => {
        const wo = document.createElement('span');
        wo.className = 'zh-bs-rt-word'; // whole word = one unit → Persian joins intact
        const e = document.createElement('span');
        e.className = 'zh-bs-rt-el';
        e.textContent = w;
        wo.appendChild(e);
        els.push(e);
        fhead.appendChild(wo);
        if (wi < words.length - 1) {
          const sp = document.createElement('span');
          sp.className = 'zh-bs-rt-space';
          sp.textContent = ' ';
          fhead.appendChild(sp);
        }
      });
      els.forEach((e, idx) => { e.style.transitionDelay = `${idx * 70}ms`; });
      requestAnimationFrame(() =>
        requestAnimationFrame(() => els.forEach((e) => e.classList.add('in'))),
      );
    };

    const old = Array.from(fhead.querySelectorAll<HTMLSpanElement>('.zh-bs-rt-el'));
    if (old.length) {
      // Replace: exit current words upward, then build the next.
      old.forEach((e, idx) => {
        e.style.transitionDelay = `${idx * 55}ms`;
        e.classList.remove('in');
        e.classList.add('out');
      });
      timerRef.current = setTimeout(() => build(title), 430);
    } else {
      build(title);
    }

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [title]);

  return <div ref={ref} className="zh-bs-fhead" aria-label={title} />;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /home/ahmad/Zhic/apps/web && npx vitest run src/components/bedroom-set/__tests__/RotatingHeadline.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
cd /home/ahmad/Zhic
git add apps/web/src/components/bedroom-set/RotatingHeadline.tsx apps/web/src/components/bedroom-set/__tests__/RotatingHeadline.test.tsx
git commit -m "feat(bedroom-set): RotatingHeadline (word-by-word replace)"
```

---

## Task 11: FeaturedOverlay

Fixed swipe-up overlay: fback, rotating headline, grid (hero + 2 rows with rise-in stagger), fdots. Two pages; `prevPage` on page 0 closes. Touch/wheel/keyboard paging guarded by `view`. Content renders even when closed (SSR'd / `aria-hidden`).

**Files:**
- Create: `apps/web/src/components/bedroom-set/FeaturedOverlay.tsx`
- Test: `apps/web/src/components/bedroom-set/__tests__/FeaturedOverlay.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/components/bedroom-set/__tests__/FeaturedOverlay.test.tsx`:

```tsx
/** @vitest-environment jsdom */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { FeaturedOverlay } from '../FeaturedOverlay';
import { FEATURED_PAGES } from '../placeholder-data';

beforeAll(() => {
  Object.defineProperty(window, 'requestAnimationFrame', {
    writable: true, configurable: true,
    value: (cb: FrameRequestCallback) => { cb(0); return 0; },
  });
  Object.defineProperty(window, 'cancelAnimationFrame', {
    writable: true, configurable: true, value: () => {},
  });
});

describe('<FeaturedOverlay>', () => {
  it('SSRs page-0 content (hero + 2 tiles + 2 page dots) even while closed', () => {
    const { container } = render(
      <FeaturedOverlay pages={FEATURED_PAGES} view="designs" onClose={() => {}} onOpenProduct={() => {}} />,
    );
    const root = container.querySelector('.zh-bs-featured')!;
    expect(root.getAttribute('aria-hidden')).toBe('true'); // closed but present
    expect(root.className).not.toContain('show');
    expect(container.querySelectorAll('.zh-bs-tile').length).toBe(3); // hero + 2 rows
    expect(container.querySelector('.zh-bs-tile.hero img')!.getAttribute('src')).toBe('/bedroom-set/lotus-banner.png');
    expect(container.querySelectorAll('.zh-bs-fdot').length).toBe(2);
    expect(container.querySelector('.zh-bs-fhead')!.getAttribute('aria-label')).toBe('پرفروش‌ترین محصولات');
  });

  it('shows when view=featured', () => {
    const { container } = render(
      <FeaturedOverlay pages={FEATURED_PAGES} view="featured" onClose={() => {}} onOpenProduct={() => {}} />,
    );
    const root = container.querySelector('.zh-bs-featured')!;
    expect(root.className).toContain('show');
    expect(root.getAttribute('aria-hidden')).toBe('false');
  });

  it('fires onOpenProduct when a tile is clicked', () => {
    const onOpenProduct = vi.fn();
    const { container } = render(
      <FeaturedOverlay pages={FEATURED_PAGES} view="featured" onClose={() => {}} onOpenProduct={onOpenProduct} />,
    );
    container.querySelector<HTMLButtonElement>('.zh-bs-tile')!.click();
    expect(onOpenProduct).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/ahmad/Zhic/apps/web && npx vitest run src/components/bedroom-set/__tests__/FeaturedOverlay.test.tsx`
Expected: FAIL — cannot resolve `../FeaturedOverlay`.

- [ ] **Step 3: Implement**

Create `apps/web/src/components/bedroom-set/FeaturedOverlay.tsx`:

```tsx
'use client';

import * as React from 'react';
import type { FeaturedPage } from './placeholder-data';
import { RotatingHeadline } from './RotatingHeadline';

type View = 'designs' | 'featured';

function FeaturedGrid({ page, onOpenProduct }: { page: FeaturedPage; onOpenProduct: () => void }) {
  const tiles = [{ tile: page.hero, hero: true }, ...page.row.map((t) => ({ tile: t, hero: false }))];
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);

  React.useEffect(() => {
    const els = refs.current.filter(Boolean) as HTMLButtonElement[];
    els.forEach((el, idx) => { el.style.transitionDelay = `${idx * 90}ms`; });
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => els.forEach((el) => el.classList.add('in'))),
    );
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="zh-bs-grid">
      {tiles.map(({ tile, hero }, idx) => (
        <button
          key={idx}
          type="button"
          className={`zh-bs-tile${hero ? ' hero' : ''}`}
          ref={(el) => { refs.current[idx] = el; }}
          onClick={onOpenProduct}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- 1:1 parity; SP1 swaps to PayloadImage */}
          <img src={tile.src} alt={tile.alt} />
        </button>
      ))}
    </div>
  );
}

export function FeaturedOverlay({
  pages,
  view,
  onClose,
  onOpenProduct,
}: {
  pages: FeaturedPage[];
  view: View;
  onClose: () => void;
  onOpenProduct: () => void;
}) {
  const rootRef = React.useRef<HTMLElement | null>(null);
  const viewRef = React.useRef(view);
  const [page, setPage] = React.useState(0);
  const open = view === 'featured';

  React.useEffect(() => { viewRef.current = view; }, [view]);
  React.useEffect(() => { if (open) setPage(0); }, [open]);

  const next = React.useCallback(() => setPage((p) => Math.min(pages.length - 1, p + 1)), [pages.length]);
  const prev = React.useCallback(() => {
    setPage((p) => {
      if (p > 0) return p - 1;
      onClose();
      return p;
    });
  }, [onClose]);

  // touch paging
  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let tY = 0;
    const onStart = (e: TouchEvent) => { tY = e.touches[0]?.clientY ?? 0; };
    const onEnd = (e: TouchEvent) => {
      const dy = (e.changedTouches[0]?.clientY ?? 0) - tY;
      if (dy < -50) next();
      else if (dy > 50) prev();
    };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchend', onEnd);
    };
  }, [next, prev]);

  // wheel paging (debounced)
  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let fw: ReturnType<typeof setTimeout> | null = null;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (fw || Math.abs(e.deltaY) < 12) return;
      if (e.deltaY > 0) next();
      else prev();
      fw = setTimeout(() => { fw = null; }, 480);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      if (fw) clearTimeout(fw);
    };
  }, [next, prev]);

  // keyboard (featured view only)
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (viewRef.current !== 'featured') return;
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      else if (['ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); next(); }
      else if (['ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); prev(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [next, prev, onClose]);

  const cur = pages[page]!;

  return (
    <section
      className={`zh-bs-featured${open ? ' show' : ''}`}
      aria-hidden={!open}
      ref={rootRef}
    >
      <button className="zh-bs-fback" type="button" aria-label="بازگشت به طرح‌ها" onClick={prev}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M6 9 L12 15 L18 9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <RotatingHeadline title={cur.title} />
      {/* key={page} remounts the grid so the rise-in stagger replays per page */}
      <FeaturedGrid key={page} page={cur} onOpenProduct={onOpenProduct} />
      <div className="zh-bs-fdots" aria-hidden="true">
        {pages.map((_, i) => (
          <span key={i} className={`zh-bs-fdot${i === page ? ' on' : ''}`} />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /home/ahmad/Zhic/apps/web && npx vitest run src/components/bedroom-set/__tests__/FeaturedOverlay.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
cd /home/ahmad/Zhic
git add apps/web/src/components/bedroom-set/FeaturedOverlay.tsx apps/web/src/components/bedroom-set/__tests__/FeaturedOverlay.test.tsx
git commit -m "feat(bedroom-set): FeaturedOverlay (2-page swipe, SSR'd content)"
```

---

## Task 12: DesignCarousel

The carousel stage: top bar (crumb + dots), track of cards, focus band + 3D flip-logo layers, counter, and the category tabs. RAF engine + pointer/wheel/keyboard gestures, all ported from the mockup with the exact math from Task 4. Mirrors the `DesignsSlider` ref/effect pattern (DOM writes via refs, never per-frame React state).

**Files:**
- Create: `apps/web/src/components/bedroom-set/DesignCarousel.tsx`
- Test: `apps/web/src/components/bedroom-set/__tests__/DesignCarousel.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/components/bedroom-set/__tests__/DesignCarousel.test.tsx`:

```tsx
/** @vitest-environment jsdom */
import { beforeAll, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { DesignCarousel } from '../DesignCarousel';
import { DESIGNS } from '../placeholder-data';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true, configurable: true,
    value: (query: string) => ({
      matches: false, media: query, onchange: null,
      addListener: () => {}, removeListener: () => {},
      addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
    }),
  });
  Object.defineProperty(window, 'requestAnimationFrame', {
    writable: true, configurable: true,
    value: (cb: FrameRequestCallback) => { cb(0); return 0; },
  });
  Object.defineProperty(window, 'cancelAnimationFrame', {
    writable: true, configurable: true, value: () => {},
  });
});

describe('<DesignCarousel>', () => {
  it('renders one card, one dot, and one logo layer per design', () => {
    const { container } = render(
      <DesignCarousel designs={DESIGNS} view="designs" onOpenDesign={() => {}} />,
    );
    expect(container.querySelectorAll('.zh-bs-card').length).toBe(DESIGNS.length);
    expect(container.querySelectorAll('.zh-bs-dot').length).toBe(DESIGNS.length);
    expect(container.querySelectorAll('.zh-bs-lg').length).toBe(DESIGNS.length);
  });

  it('shows the Persian counter «طرح ۱ از ۷» and marks the first dot active', () => {
    const { container } = render(
      <DesignCarousel designs={DESIGNS} view="designs" onOpenDesign={() => {}} />,
    );
    expect(container.querySelector('.zh-bs-prompt span')!.textContent).toBe('طرح ۱ از ۷');
    expect(container.querySelectorAll('.zh-bs-dot')[0]!.className).toContain('on');
  });

  it('embeds the category tabs', () => {
    const { container } = render(
      <DesignCarousel designs={DESIGNS} view="designs" onOpenDesign={() => {}} />,
    );
    expect(container.querySelectorAll('.zh-bs-cat').length).toBe(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/ahmad/Zhic/apps/web && npx vitest run src/components/bedroom-set/__tests__/DesignCarousel.test.tsx`
Expected: FAIL — cannot resolve `../DesignCarousel`.

- [ ] **Step 3: Implement**

Create `apps/web/src/components/bedroom-set/DesignCarousel.tsx`:

```tsx
'use client';

import * as React from 'react';
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
          <a href="/">خانه</a> / طرح‌ها
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /home/ahmad/Zhic/apps/web && npx vitest run src/components/bedroom-set/__tests__/DesignCarousel.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
cd /home/ahmad/Zhic
git add apps/web/src/components/bedroom-set/DesignCarousel.tsx apps/web/src/components/bedroom-set/__tests__/DesignCarousel.test.tsx
git commit -m "feat(bedroom-set): DesignCarousel (RAF engine + flip-logo + gestures)"
```

---

## Task 13: BedroomSetLanding (orchestrator)

Owns `view` state, the toast, the window-level swipe-up-at-bottom trigger; imports the stylesheet; renders the stage + writing + featured overlay + toast.

**Files:**
- Create: `apps/web/src/components/bedroom-set/BedroomSetLanding.tsx`
- Test: `apps/web/src/components/bedroom-set/__tests__/BedroomSetLanding.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/components/bedroom-set/__tests__/BedroomSetLanding.test.tsx`:

```tsx
/** @vitest-environment jsdom */
import { beforeAll, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { BedroomSetLanding } from '../BedroomSetLanding';
import { DESIGNS, FEATURED_PAGES, WRITING } from '../placeholder-data';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true, configurable: true,
    value: (query: string) => ({
      matches: false, media: query, onchange: null,
      addListener: () => {}, removeListener: () => {},
      addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
    }),
  });
  Object.defineProperty(window, 'requestAnimationFrame', {
    writable: true, configurable: true,
    value: (cb: FrameRequestCallback) => { cb(0); return 0; },
  });
  Object.defineProperty(window, 'cancelAnimationFrame', {
    writable: true, configurable: true, value: () => {},
  });
});

describe('<BedroomSetLanding>', () => {
  it('renders the stage, writing section, featured overlay, and toast together', () => {
    const { container } = render(
      <BedroomSetLanding designs={DESIGNS} pages={FEATURED_PAGES} writing={WRITING} />,
    );
    expect(container.querySelector('.zh-bs-stage')).not.toBeNull();
    expect(container.querySelector('.zh-bs-writing')).not.toBeNull();
    expect(container.querySelector('.zh-bs-featured')).not.toBeNull();
    expect(container.querySelector('.zh-bs-toast')).not.toBeNull();
    expect(container.querySelector('.zh-bs-weyebrow')!.textContent).toBe('درباره‌ی این سرویس‌ها');
    expect(container.querySelector('.zh-bs-upcue span')!.textContent).toBe('پرفروش‌ترین محصولات');
  });

  it('opens the featured overlay when the up-cue is clicked', () => {
    const { container } = render(
      <BedroomSetLanding designs={DESIGNS} pages={FEATURED_PAGES} writing={WRITING} />,
    );
    const featured = container.querySelector('.zh-bs-featured')!;
    expect(featured.className).not.toContain('show');
    container.querySelector<HTMLButtonElement>('.zh-bs-upcue')!.click();
    expect(featured.className).toContain('show');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/ahmad/Zhic/apps/web && npx vitest run src/components/bedroom-set/__tests__/BedroomSetLanding.test.tsx`
Expected: FAIL — cannot resolve `../BedroomSetLanding`.

- [ ] **Step 3: Implement**

Create `apps/web/src/components/bedroom-set/BedroomSetLanding.tsx`:

```tsx
'use client';

import * as React from 'react';
import type { DesignCard, FeaturedPage, WritingContent } from './placeholder-data';
import { DesignCarousel } from './DesignCarousel';
import { WritingSection } from './WritingSection';
import { FeaturedOverlay } from './FeaturedOverlay';
import { Toast } from './Toast';
import './bedroom-set.css';

type View = 'designs' | 'featured';

export function BedroomSetLanding({
  designs,
  pages,
  writing,
}: {
  designs: DesignCard[];
  pages: FeaturedPage[];
  writing: WritingContent;
}) {
  const [view, setView] = React.useState<View>('designs');
  const [toast, setToast] = React.useState({ text: '', show: false });
  const toastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewRef = React.useRef(view);
  React.useEffect(() => { viewRef.current = view; }, [view]);

  const showToast = React.useCallback((text: string) => {
    setToast({ text, show: true });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 1300);
  }, []);

  const openFeatured = React.useCallback(() => setView('featured'), []);
  const closeFeatured = React.useCallback(() => setView('designs'), []);
  const onOpenDesign = React.useCallback(
    (d: DesignCard) => showToast(`باز کردن طرح ${d.name} →`),
    [showToast],
  );
  const onOpenProduct = React.useCallback(() => showToast('مشاهده →'), [showToast]);

  // Swipe up once scrolled to the bottom (the writing section) → open featured.
  React.useEffect(() => {
    let wY = 0;
    const onStart = (e: TouchEvent) => { wY = e.touches[0]?.clientY ?? 0; };
    const onEnd = (e: TouchEvent) => {
      if (viewRef.current !== 'designs') return;
      const dy = (e.changedTouches[0]?.clientY ?? 0) - wY;
      const atBottom =
        Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 4;
      if (dy < -48 && atBottom) openFeatured();
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchend', onEnd);
    };
  }, [openFeatured]);

  React.useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  return (
    <>
      <DesignCarousel designs={designs} view={view} onOpenDesign={onOpenDesign} />
      <WritingSection content={writing} onOpenFeatured={openFeatured} />
      <FeaturedOverlay pages={pages} view={view} onClose={closeFeatured} onOpenProduct={onOpenProduct} />
      <Toast text={toast.text} show={toast.show} />
    </>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /home/ahmad/Zhic/apps/web && npx vitest run src/components/bedroom-set/__tests__/BedroomSetLanding.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
cd /home/ahmad/Zhic
git add apps/web/src/components/bedroom-set/BedroomSetLanding.tsx apps/web/src/components/bedroom-set/__tests__/BedroomSetLanding.test.tsx
git commit -m "feat(bedroom-set): BedroomSetLanding orchestrator"
```

---

## Task 14: Wire the route + full build

Swap the page body to render `BedroomSetLanding` with placeholder data; keep the existing metadata (indexed). Then run the full test suite, typecheck, lint, and a production build.

**Files:**
- Modify: `apps/web/src/app/(site)/bedroom-set/page.tsx`

- [ ] **Step 1: Replace the page body**

Overwrite `apps/web/src/app/(site)/bedroom-set/page.tsx` with:

```tsx
import { BedroomSetLanding } from '@/components/bedroom-set/BedroomSetLanding';
import { DESIGNS, FEATURED_PAGES, WRITING } from '@/components/bedroom-set/placeholder-data';

export const metadata = {
  title: 'طرح‌ها',
  description: 'گالری طرح‌های ژیک — هر طرح یک زبان طراحی برای فضای زندگی شما.',
  alternates: { canonical: '/bedroom-set' },
};

export default function BedroomSetPage() {
  return <BedroomSetLanding designs={DESIGNS} pages={FEATURED_PAGES} writing={WRITING} />;
}
```

- [ ] **Step 2: Run the full bedroom-set test suite**

Run: `cd /home/ahmad/Zhic/apps/web && npx vitest run src/components/bedroom-set src/lib/__tests__/design-tokens.test.ts`
Expected: PASS — all bedroom-set tests + the token test green.

- [ ] **Step 3: Typecheck + lint**

Run: `cd /home/ahmad/Zhic/apps/web && npx tsc --noEmit && npx eslint src/components/bedroom-set src/app/\(site\)/bedroom-set/page.tsx`
Expected: no errors.

- [ ] **Step 4: Production build (catches RSC/client boundary + asset issues)**

Run: `cd /home/ahmad/Zhic/apps/web && npm run build`
Expected: build succeeds; `/bedroom-set` compiles. (If the box is resource-constrained, `pnpm --filter @zhic/web build` is equivalent.)

- [ ] **Step 5: Commit**

```bash
cd /home/ahmad/Zhic
git add apps/web/src/app/\(site\)/bedroom-set/page.tsx
git commit -m "feat(bedroom-set): wire ported landing into /bedroom-set route"
```

---

## Task 15: Visual + behavioral parity verification

Prove the port matches the mockup using the headless-Chromium recipe (`docs`/memory `reference-zhic-headless-browser`). This is the integration check for everything CSS/gesture that unit tests can't cover. **No code changes unless a discrepancy is found — then fix toward the mockup and re-verify.**

**Files:**
- Create (scratch, not committed): `/tmp/bs-parity.mjs`

- [ ] **Step 1: Serve the built app**

Ensure the production build runs locally on `:3000` (per `local_dev_box_ops`: `pm2 restart zhic-web` after `npm run build`, or `npx next start` in `apps/web`). Confirm the route loads:
Run: `curl -sI http://80.240.31.146:3000/bedroom-set | head -1`
Expected: `HTTP/1.1 200 OK`.

- [ ] **Step 2: Confirm SSR'd content for SEO (no JS)**

Run: `curl -s http://80.240.31.146:3000/bedroom-set | grep -o 'پرفروش‌ترین محصولات\|درباره‌ی این سرویس‌ها\|طرح ۱ از ۷' | sort -u`
Expected: all three strings present in the raw HTML (the featured title, the writing heading, and the carousel counter are server-rendered).

- [ ] **Step 3: Screenshot both pages in matching states**

Create `/tmp/bs-parity.mjs` (adapt the launch block from the headless recipe). Capture, at viewport 390×844 (dSF 2) and 1280×800, for BOTH `…/mockups/bedroom-set-v2/index.html` and `…/bedroom-set`:
1. carousel at rest,
2. carousel mid-swipe — drive the engine to a half-step to catch the flip edge-on + glass blur-out (mockup: `window.go`/set `progress`; port: dispatch a pointer drag or call the exposed nothing — use a pointer drag of ~half a slot),
3. writing section scrolled into view,
4. featured page 0 (mockup: `window.openFeatured()`; port: click `.zh-bs-upcue`),
5. featured page 1 (mockup: `window.nextPage()`; port: dispatch a wheel/`ArrowDown`).

Save pairs to `/tmp/bs-*-mock.png` and `/tmp/bs-*-port.png`.

- [ ] **Step 4: Compare + measure**

- View each pair side by side; they must be visually identical (layout, type, colors, the flip mid-swipe, the glass blur, the green fading border, the asymmetric tab corners).
- Prove alignment with `getBoundingClientRect()`: the featured grid's hero and the two row tiles share identical left/right edges; the carousel dots are centered on phone (`center ≈ innerWidth/2`).
- Confirm gestures on the port: horizontal swipe switches design (counter «طرح ۱ از ۷» → «۲ از ۷») without vertical scroll; vertical scroll reveals the writing section; swipe-up-at-bottom (or up-cue) opens featured; in featured, wheel/swipe pages and `Esc`/swipe-down-at-top closes.

- [ ] **Step 5: Reconcile any drift**

For any mismatch, fix the relevant component/CSS toward the mockup (the source of truth) and re-run Steps 3–4. Commit fixes individually:

```bash
cd /home/ahmad/Zhic
git add -A
git commit -m "fix(bedroom-set): <specific parity fix> to match mockup"
```

- [ ] **Step 6: Record the result**

Note the verified states in the PR / `docs/state.md` (per CLAUDE.md: update `state.md` at session end). The scratch `/tmp/bs-parity.mjs` and screenshots are not committed.

---

## Self-Review

**1. Spec coverage** (spec §): §4 component tree → Tasks 7–13. §5.1 carousel → Tasks 4, 12. §5.2 top bar/dots → Task 12. §5.3 counter → Task 12 (`toPersianDigits`). §5.4 tabs → Task 8. §5.5 writing + green border → Tasks 6, 9. §5.6 featured + rotating headline → Tasks 5, 10, 11. §5.7 gestures → Tasks 11, 12, 13. §5.8 grain → Task 6. §6 shell reconciliation (header offset) → Task 6 CSS. §7 SSR/indexed → Tasks 13/14 + verified Task 15 Step 2. §8 placeholder data → Task 3. §9 styling/tokens → Tasks 1, 6. §10 a11y/reduced-motion → Tasks 6 (CSS), 8/11/12 (aria). §11 verification → Task 15. §12 file manifest → all. §13 out-of-scope respected (no Payload, no nav, tabs stub, DesignsSlider untouched). All covered.

**2. Placeholder scan:** No "TBD/TODO/handle edge cases" — every code step has complete code; the only "stub" is the intentional CategoryTabs behavior (spec §5.4) and the toast/openProduct stubs (mockup parity), both explicitly scoped.

**3. Type consistency:** `DesignCard{slug,name,cardSrc,logoSrc}`, `FeaturedTile{src,alt}`, `FeaturedPage{title,hero,row}`, `WritingContent{heading,body}` — defined in Task 3, consumed identically in Tasks 9/11/12/13. `View = 'designs'|'featured'` consistent across DesignCarousel/FeaturedOverlay/BedroomSetLanding. Callback names (`onOpenDesign`, `onOpenProduct`, `onOpenFeatured`, `onClose`) match across producer/consumer. carousel-math exports match imports in Task 12. `easing.spring` (Task 1) ↔ `--ease-spring` (Tasks 1, 6).

**4. Known cross-browser note carried from the mockup:** the featured hero uses `::before{padding-bottom:43.5%}` (NOT `aspect-ratio`) — Task 6 preserves this; Task 15 Step 4 re-verifies edge alignment.
