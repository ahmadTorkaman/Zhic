# Session 6.3 — QA + Final Polish

## Context

All features are shipped (Phases 1–6.2). This is the final code session
before deployment (7.1). Session 6.3 is about polish, not features: extend
motion to secondary pages, add a back-to-top button, audit RTL/typography/
accessibility, and prepare a QA checklist for the user to run locally
(cross-browser, Lighthouse, Payload admin pipeline).

The Claude Code sandbox can't run browsers, Lighthouse, or Postgres — so
this session focuses on code-level polish that compiles clean, then
produces a verification checklist the user executes locally.

## Authority

`docs/sessions.md` §6.3 → `package1-month1.md` §Exit criteria.

## Entry state

- All 26+ public routes built and rendering.
- Motion primitives (BlockReveal, WordReveal, ImageReveal) applied to home.
- SEO: sitemap, robots, manifest, OG images, standardized metadata.
- Inquiry form + SMS routing live.
- No TODOs, FIXMEs, or @ts-ignore in codebase.
- Persian 404 + error boundary exist.
- `/lab/*` properly noindex'd.

## Scope decisions

### In scope (code-level polish)

| Item | Justification |
|---|---|
| Block reveals on secondary pages (PDP, showroom, article, category) | FU-6.2-f — consistency with home |
| Back-to-top button | FU-6.2-g — standard UX affordance |
| RTL logical property audit + fixes | 6.3 deliverable |
| Persian typography pass (ZWNJ spot-check) | 6.3 deliverable |
| QA checklist document for local verification | Exit criteria depend on local testing |

### Deferred (needs visual testing or is low-priority)

| Item | Deferred to | Justification |
|---|---|---|
| Custom cursor (FU-6.2-a) | Post-launch | Complex, touch devices skip, needs visual tuning |
| Mobile overlay choreography (FU-6.2-e) | Post-launch | Needs mobile device testing |
| Scroll progress bar | Post-launch | Minor feature, low priority |
| Replace fictional showroom data (FU-3.3-n) | Pre-demo (user task) | User provides real addresses |

## Deliverables

### Step 1 — Block reveals on secondary pages

Apply `BlockReveal` to key sections on non-home pages for scroll
consistency. Light touch — wrap existing section headings and content
blocks, not every element.

**PDP (`products/[slug]/page.tsx`):** Wrap product detail sections
(specs accordion, related products heading) in BlockReveal.

**Showroom detail (`showrooms/[slug]/page.tsx`):** Wrap description,
hours, gallery heading, featured products heading in BlockReveal.

**Article detail (`journal/[slug]/page.tsx`):** Wrap related products
and related articles sections in BlockReveal.

**Category landing (`categories/[slug]/page.tsx`):** Wrap description
and product grid in BlockReveal.

### Step 2 — Back-to-top button

**`apps/web/src/components/motion/BackToTop.tsx`** — NEW

`'use client'` component:
- Renders a fixed-position button (bottom-right, RTL-aware: bottom-left)
- Shows when `scrollY > 400px`, hides otherwise
- Smooth scroll to top on click via `window.scrollTo({ top: 0, behavior: 'smooth' })`
- Aria label "بازگشت به بالا"
- Respects `prefers-reduced-motion` (instant scroll)
- Uses motion tokens for show/hide transition

**`apps/web/src/app/(site)/layout.tsx`** — MODIFY
- Import and render `BackToTop` inside the site layout (after footer)

### Step 3 — RTL logical property audit

Grep for hardcoded directional CSS that should use logical equivalents:
- `margin-left` / `margin-right` → `margin-inline-start/end`
- `padding-left` / `padding-right` → `padding-inline-start/end`
- `text-align: left/right` → `text-align: start/end`
- `float: left/right` → check if needed
- `left:` / `right:` in positioning → `inset-inline-start/end`

Fix any violations found. Likely few since the project has been RTL-aware
from session 1.

### Step 4 — Typography spot-check

Quick audit of Persian text quality:
- Check ZWNJ usage in hardcoded strings (می‌ not می)
- Check Persian digits in UI display (۱۲۳ not 123)
- Check Jalali dates render correctly
- Verify no ASCII digits leak into user-facing text

### Step 5 — QA checklist document

**`docs/sessions/session-6.3-qa-checklist.md`** — NEW

A runnable checklist for the user to execute locally with Postgres + dev
server. Covers:

**Cross-browser:**
- [ ] Chrome desktop + Android
- [ ] Firefox desktop
- [ ] Safari desktop + iOS
- [ ] Telegram in-app browser
- [ ] Eitaa in-app browser

**Lighthouse (per seo.md §2.6):**
- [ ] LCP ≤ 2.0s on home, PDP, article
- [ ] INP ≤ 150ms
- [ ] CLS ≤ 0.05
- [ ] TTFB ≤ 600ms
- [ ] Page weight ≤ 1.5 MB, JS ≤ 180 kB

**Functional:**
- [ ] Submit inquiry form → Payload shows entry + SMS received
- [ ] Add product in Payload admin → visible on `/products` within 10 min
- [ ] Add article in Payload admin → visible on `/journal` within 10 min
- [ ] All footer links resolve (no 404s)
- [ ] `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest` load correctly

**JSON-LD validation:**
- [ ] Home: Organization + WebSite
- [ ] PDP: Product + BreadcrumbList
- [ ] Showroom: LocalBusiness + BreadcrumbList
- [ ] Article: Article + BreadcrumbList
- [ ] FAQ: FAQPage + BreadcrumbList

**Motion:**
- [ ] Home scroll reveals play smoothly
- [ ] `prefers-reduced-motion: reduce` → no transforms, instant fades
- [ ] Header shadow appears on scroll

**Mobile:**
- [ ] Tap targets ≥ 44px
- [ ] No font < 14px
- [ ] Mobile nav opens/closes correctly
- [ ] Inquiry form usable on mobile

### Step 6 — Update state.md

- Mark 6.3 ✅, Phase 6 complete
- Close FU-6.2-f, FU-6.2-g
- Note remaining FUs as post-Month-1 / Package 2+

## Exit check

- [ ] `pnpm --filter @zhic/web typecheck` passes
- [ ] `pnpm --filter @zhic/web lint` passes (0 errors)
- [ ] `pnpm --filter @zhic/web test` passes
- [ ] `pnpm --filter @zhic/web build` passes
- [ ] Secondary pages have BlockReveal on key sections
- [ ] Back-to-top button visible on scroll, smooth-scrolls to top
- [ ] No hardcoded directional CSS found (or all fixed)
- [ ] QA checklist document produced
- [ ] `docs/state.md` updated: 6.3 ✅, Phase 6 complete

## Critical files

| File | Action |
|---|---|
| `apps/web/src/components/motion/BackToTop.tsx` | New |
| `apps/web/src/app/(site)/layout.tsx` | Add BackToTop |
| `apps/web/src/app/(site)/products/[slug]/page.tsx` | Add BlockReveal |
| `apps/web/src/app/(site)/showrooms/[slug]/page.tsx` | Add BlockReveal |
| `apps/web/src/app/(site)/journal/[slug]/page.tsx` | Add BlockReveal |
| `apps/web/src/app/(site)/categories/[slug]/page.tsx` | Add BlockReveal |
| `docs/sessions/session-6.3-qa-checklist.md` | New |

## Verification

1. `pnpm --filter @zhic/web typecheck && pnpm --filter @zhic/web lint`
2. `pnpm --filter @zhic/web test`
3. `pnpm --filter @zhic/web build`
4. User runs QA checklist locally with `docker compose up postgres` + dev server
