# Session 6.2 — Motion + Scroll Effects

## Context

All pages, inquiry form, and SEO foundations are shipped (Phases 1–6.1).
The site is feature-complete but static — no scroll-driven animations,
reveal effects, or choreography. Session 6.2 adds the motion vocabulary
defined in design-system.md §6 to make the storefront feel like a luxury
furniture brand. Lenis + GSAP + ScrollTrigger infrastructure is already
wired via `SmoothScrollProvider`; this session builds the animation
primitives and applies them to the home page + reusable patterns.

## Authority

`docs/spec/design-system.md` §6 (motion) → `docs/spec/seo.md` §2.6
(performance) → `docs/sessions.md` §6.2.

## Entry state

- `SmoothScrollProvider` wired: Lenis + GSAP ticker sync, ScrollTrigger
  registered, `prefers-reduced-motion` guard (exits early).
- `useVideoScrub` hook exists (not yet consumed — no hero video asset).
- Motion tokens in CSS (`--dur-*`, `--ease-*`) and TS (`design-system/tokens/motion.ts`).
- Card hover lift uses `motion-safe:hover:-translate-y-0.5` (already done).
- `@gsap/react` 2.1.2 installed (provides `useGSAP` hook).
- Home page components are static RSCs: `HomeHero`, `HomeBrandStatement`,
  `HomeFeaturedDesigns`, `HomeShowroomsStrip`, `HomeJournalTeaser`,
  `HomeInquiryCta`.
- `/lab/motion` placeholder exists for testing.

## Scope decisions

### In scope

| Item | Justification |
|---|---|
| `BlockReveal` animation component (fade+slide on scroll) | §6.4.2, core pattern |
| `WordReveal` component (character-split H1 mask reveal) | §6.4.1, hero only |
| `ImageReveal` component (clip-path + scale) | §6.4.3, brand statement |
| Home page motion pass (all 6 blocks) | FU-3.1-a |
| Sticky header shadow on scroll | FU-2.2-g partial |
| GIF/media pause off-screen hook | FU-2.3-b |
| `prefers-reduced-motion` on all animations | §6.1.4, exit criterion |

### Deferred

| Item | Deferred to | Justification |
|---|---|---|
| Custom cursor (8px circle, mix-blend-difference) | 6.3 polish | Low priority, touch devices skip it |
| Page transition veil (ivory sweep) | Post-Month 1 | Needs Next.js route transition API |
| MarqueeBlock on home | Post-6.2 | Needs `Home.marquee_items` CMS schema (FU-3.1-g) |
| Gallery pinch-zoom + swipe gestures | Post-6.2 | Complex gesture library (FU-2.3-j) |
| Mobile overlay choreography | 6.3 | FU-2.2-h, lower priority |
| Back-to-top button + scroll progress bar | 6.3 | FU-2.2-g remainder, minor features |

## Deliverables

### Step 1 — Reusable animation components

All in `apps/web/src/components/motion/` — NEW directory.
All are `'use client'` components using `useGSAP` from `@gsap/react`.

**`BlockReveal.tsx`** — fade + 24px y-slide on scroll
- Wraps children in a `<div>` with initial `opacity: 0; translateY: 24px`
- ScrollTrigger fires at 20% viewport
- Duration: `--dur-slow` (720ms), easing: `--ease-out-soft`
- Props: `children`, `delay?: number`, `className?`
- `prefers-reduced-motion`: instant opacity fade, no transform
- Stagger variant: when wrapping multiple children, 80ms offset each

**`WordReveal.tsx`** — character-split mask reveal for H1
- Splits text into `<span>` per character, each wrapped in overflow-hidden
- Animates each span's y from 100% to 0
- Stagger: 32ms per character
- Duration: `--dur-glacial` (1200ms), easing: `--ease-expo-out`
- RTL: splits from right edge (natural for Persian)
- `prefers-reduced-motion`: simple opacity fade on the whole text
- Props: `children: string`, `as?: 'h1' | 'h2'`, `className?`

**`ImageReveal.tsx`** — clip-path inset reveal + scale
- Wraps an image/child in overflow-hidden container
- Animates `clipPath` from `inset(100% 0 0 0)` to `inset(0)`
- Inner element scales from 1.08 to 1.0 simultaneously
- Duration: `--dur-slow` (720ms), easing: `--ease-expo-out`
- ScrollTrigger at 20% viewport
- `prefers-reduced-motion`: instant opacity fade
- Props: `children`, `className?`

### Step 2 — `useMediaPause` hook

**`apps/web/src/hooks/useMediaPause.ts`** — NEW

IntersectionObserver hook for pausing GIFs/videos off-screen.
- Accepts a `ref` to a media element (`<video>` or container with `<img>`)
- Pauses video when out of viewport, resumes when visible
- For `<img>` GIFs: swaps `src` to empty and back (or uses a data attr)
- Closes FU-2.3-b

### Step 3 — Header scroll shadow

**`packages/ui/src/SiteHeader.tsx`** — MODIFY (or new client wrapper)

Add scroll-driven shadow: when `scrollY > 0`, apply
`shadow-sm border-b-sand/60` transition. Two approaches:
- **Option A**: Small `'use client'` wrapper `HeaderScrollShadow` that
  uses `useEffect` + scroll listener to toggle a class.
- **Option B**: CSS `@supports (animation-timeline: scroll())` for
  pure-CSS scroll-driven animation (progressive enhancement).

Recommended: Option A for broad support. The SiteHeader already has
`sticky top-0` and `transition-colors`. Add a scroll state that toggles
`bg-ivory/90 backdrop-blur shadow-sm` classes.

Closes FU-2.2-g partial (shadow only; progress bar + back-to-top deferred).

### Step 4 — Home page motion pass

**`apps/web/src/components/home/HomeHero.tsx`** — MODIFY
- Wrap H1 in `<WordReveal>` component
- Wrap subheading + buttons in `<BlockReveal delay={0.3}>`
- Background image gets `<ImageReveal>` if CMS media present

**`apps/web/src/components/home/HomeBrandStatement.tsx`** — MODIFY
- Wrap the left `<Aspect>` in `<ImageReveal>`
- Wrap the right text stack in `<BlockReveal>`

**`apps/web/src/components/home/HomeFeaturedDesigns.tsx`** — MODIFY
- Wrap heading + description in `<BlockReveal>`
- Each `<DesignCard>` wrapped in `<BlockReveal delay={idx * 0.08}>` for stagger

**`apps/web/src/components/home/HomeShowroomsStrip.tsx`** — MODIFY
- Wrap heading in `<BlockReveal>`
- Cards staggered with `<BlockReveal delay={idx * 0.08}>`

**`apps/web/src/components/home/HomeJournalTeaser.tsx`** — MODIFY
- Wrap heading in `<BlockReveal>`
- Cards staggered

**`apps/web/src/components/home/HomeInquiryCta.tsx`** — MODIFY
- Wrap content in `<BlockReveal>`

### Step 5 — Update `/lab/motion` page

**`apps/web/src/app/lab/motion/page.tsx`** — MODIFY

Replace placeholder with live demo sections:
- Word reveal demo
- Block reveal demo (single + staggered)
- Image reveal demo
- Reduced-motion test note

### Step 6 — Update state.md

- Mark 6.2 ✅
- Close FU-3.1-a, FU-2.2-g (partial), FU-2.3-b
- Log new follow-ups

## Exit check

- [ ] `pnpm --filter @zhic/web typecheck` passes
- [ ] `pnpm --filter @zhic/web lint` passes (0 errors)
- [ ] `pnpm --filter @zhic/web test` passes
- [ ] `pnpm --filter @zhic/web build` passes
- [ ] Home page: H1 word-reveal plays on load, blocks fade+slide on scroll
- [ ] Brand statement: image clip-path reveal + text block-reveal on scroll
- [ ] Featured designs: staggered card reveals
- [ ] `prefers-reduced-motion: reduce` → all animations become instant
  opacity fade, no transforms, no Lenis smooth scroll
- [ ] Header gains subtle shadow on scroll, removes on scroll-to-top
- [ ] `/lab/motion` shows all animation patterns
- [ ] `docs/state.md` updated

## Critical files

| File | Action |
|---|---|
| `apps/web/src/components/motion/BlockReveal.tsx` | New |
| `apps/web/src/components/motion/WordReveal.tsx` | New |
| `apps/web/src/components/motion/ImageReveal.tsx` | New |
| `apps/web/src/hooks/useMediaPause.ts` | New |
| `apps/web/src/components/home/HomeHero.tsx` | Add WordReveal + BlockReveal |
| `apps/web/src/components/home/HomeBrandStatement.tsx` | Add ImageReveal + BlockReveal |
| `apps/web/src/components/home/HomeFeaturedDesigns.tsx` | Add staggered BlockReveal |
| `apps/web/src/components/home/HomeShowroomsStrip.tsx` | Add staggered BlockReveal |
| `apps/web/src/components/home/HomeJournalTeaser.tsx` | Add staggered BlockReveal |
| `apps/web/src/components/home/HomeInquiryCta.tsx` | Add BlockReveal |
| `apps/web/src/app/lab/motion/page.tsx` | Live demos |

## Verification

1. `pnpm --filter @zhic/web typecheck && pnpm --filter @zhic/web lint`
2. `pnpm --filter @zhic/web test`
3. `pnpm --filter @zhic/web build`
4. Local dev server: scroll home page — verify reveal animations fire
5. Enable `prefers-reduced-motion: reduce` in browser DevTools → verify
   all animations become instant fades
6. Check `/lab/motion` for isolated demos
