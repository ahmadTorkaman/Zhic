# D5: Template Pages B1-B8 Implementation Plan

> **Compact plan.** Per `b-template-pages.html` mockup, 8 pages clustering into patterns. Executed directly to manage context budget.

**Goal:** Update 8 template pages to match the Phase B mockups in `.superpowers/b-template-pages.html`.

**Pattern clusters:**
1. **Editorial hero + centered prose** (B4 About, B5 Atelier, B8 Care) — new `EditorialPageTemplate.tsx` with full-bleed cover hero (forest eyebrow + h1 overlaid at bottom) + 680px centered prose body. Atelier (B5) gets an inline image grid mid-prose.
2. **Glass card index** (B1 Showrooms Index) — replace ShowroomCard grid with inline glass-card markup matching D1's HomeShowroomsStrip pattern but with hours summary.
3. **Hero + product grid** (B2 Collection) — Replace CollectionHeader's Split layout with the same hero-bleed pattern + editorial intro + product grid.
4. **Title + grid + see-all CTA** (B3 Category) — Drop text-display h1, use text-h2; add ghost "see all" CTA below the grid.
5. **Standalone prose+accordion** (B6 FAQ) — Centered 680px width, plus-icon accordion (already in FaqAccordion). Update title to text-h2.
6. **Standalone event list** (B7 Events) — Update EventCard to use Jalali day+month blocks. Centered 680px width.

**Branch:** `claude/plan-session-2-1-bUd75` (continuing from D4, latest `7bbdd1c`).

**D1+D2+D3+D4 lessons applied:** `fullBleed` Section, `--hover-lift-card` for cards, `color-mix` for token-tracking, no redundant `leading-[N]`, `aria-current` for active, glass-card utility for ivory glass, `bg-cream` for cream surfaces.

---

## Tasks

### Task 1: Editorial template — About, Atelier, Care (B4, B5, B8)

- Create `apps/web/src/components/legal/EditorialPageTemplate.tsx` — full-bleed cover (image or fallback) with bottom gradient overlay + forest eyebrow + h1 + centered 680px prose body
- Update `apps/web/src/app/(site)/about/page.tsx`, `atelier/page.tsx`, `care/page.tsx` to use EditorialPageTemplate
- Atelier (B5) gets an extra `imageGrid` slot for the inline 2-col image strip mid-prose (deferred for D5 — for now same as About/Care)
- Pages need cover image data — Payload pages support a `cover` field already (or fallback to "تصویر به‌زودی" placeholder)

### Task 2: FAQ + Events restyle (B6, B7)

- FAQ: drop `text-display` → `text-h2`, narrow content to 680px max-width centered
- Events: update EventCard to render Jalali day+month "date block" (cream bg, h3 day, eyebrow month). Use `formatJalaliDate` from `@zhic/locale` if available; otherwise extract day/month from the event date string

### Task 3: Showroom Index + Collection + Category (B1, B2, B3)

- B1 Showrooms Index: rewrite the Grid+ShowroomCard composition to inline `glass-card` blocks (city forest eyebrow + name + address lines + sand-bordered hours)
- B2 Collection: replace CollectionHeader's Split with a `hero-bleed` layout (full-bleed cover + h1 overlaid bottom) + editorial intro + product grid
- B3 Category: drop `text-display` h1 → `text-h2`, add ghost "مشاهده‌ی همه" CTA below grid (already exists as primary "secondary" Button — restyle to ghost)

### Task 4: QA + state.md

Smoke test all 8 routes, typecheck, mark D5 complete in state.md.
