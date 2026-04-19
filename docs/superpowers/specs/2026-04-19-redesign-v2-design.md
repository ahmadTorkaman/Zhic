# Redesign v2 — Design Spec

**Date:** 2026-04-19
**Branch:** new branch `claude/redesign-v2` cut from `claude/plan-session-2-1-bUd75` (the parent branch carries the monorepo scaffold, Payload setup, `@zhic/locale` / `@zhic/money` / `@zhic/sms` packages, lib helpers, fonts — infra `main` doesn't have. The wipe scope below applies only to the design layer; infra is preserved by virtue of the parent branch state.)
**Status:** spec — implementation plan to follow via `superpowers:writing-plans`

---

## 0. Why v2

Phase D (D1–D6, branch `claude/plan-session-2-1-bUd75`) attempted to restyle existing components in place. It shipped 19+ commits that nominally matched mockup class names but the rendered pages bore no resemblance to the mockups — content hidden behind GSAP opacity wrappers, sections rendering null when data was empty, abstractions stacked over abstractions. The work was never visually verified before being declared done.

v2 is a wholesale restart with three rules baked in:

1. **The mockups are the only design source of truth.** Read them, derive everything from them. Forget what's already in the codebase.
2. **Unified component vocabulary.** Identify shared patterns across mockups, build them once, reuse. Don't rebuild every variant per page.
3. **Per-component visual checkpoint.** No component is "done" until viewed in a browser side-by-side with its mockup at 1440×900 desktop and 375px mobile. The user is the gate.

---

## 1. Scope

### Wipe (single opening commit on `claude/redesign-v2`)

```
DELETE:
  packages/design-system/css/{tokens,theme,base}.css
  packages/ui/src/*    (every file except cn.ts)
  apps/web/src/components/**
  apps/web/src/app/(site)/**
  apps/web/src/app/lab/**
  apps/web/src/app/{layout.tsx, globals.css}    (rewritten content, same paths)

KEEP (data/server/infra — not design):
  apps/web/src/lib/{payload,jsonld,env,richtext}.ts
  apps/web/src/app/actions/submitInquiry.ts
  apps/web/src/assets/fonts/*    (Ayandeh weights)
  apps/web/{vitest.config.ts, next.config.ts, postcss.config.mjs, tsconfig.json, package.json}
  packages/locale/   (Persian digit/date/phone — pure)
  packages/money/    (rial/toman math — pure)
  packages/sms/      (SMS.ir — pure)
  services/api/      (Payload CMS, collections, seed — unchanged)
  docs/              (preserved for reference)
  .superpowers/      (mockups + this spec — preserved)
```

`packages/ui` package scaffold kept (for the monorepo split per `CLAUDE.md`) but its contents are rebuilt from scratch.

---

## 2. Foundation tokens

### `packages/design-system/css/tokens.css` — full canonical content

```css
:root {
  /* ── Surface colors (mockup verbatim) ── */
  --color-ivory:    #FAFAF7;
  --color-cream:    #F5F0EB;
  --color-sand:     #E8E0D8;
  --color-stone:    #8C8279;
  --color-charcoal: #2C2825;
  --color-ink:      #14110F;

  /* ── Accent colors (mockup verbatim) ── */
  --color-forest:   #5F7760;
  --color-gold:     #C49A6C;
  --color-overlay:  rgba(20, 17, 15, 0.6);

  /* ── Functional (app infra — not in mockups) ── */
  --color-rust:     #8B4A2B;   /* form-error state only */

  /* ── Typography sizes (mockup verbatim) ── */
  --text-h1:        clamp(2.5rem, 4vw + 1rem, 4rem);
  --text-h2:        clamp(2rem, 3vw + 0.75rem, 3rem);
  --text-h3:        clamp(1.5rem, 2vw + 0.5rem, 2rem);
  --text-h4:        1.5rem;
  --text-lead:      1.25rem;
  --text-body:      1rem;
  --text-small:     0.875rem;
  --text-eyebrow:   0.75rem;

  /* ── Line heights (paired) ── */
  --leading-h1:     1.2;
  --leading-h2:     1.25;
  --leading-h3:     1.3;
  --leading-h4:     1.35;
  --leading-lead:   1.7;
  --leading-body:   1.75;
  --leading-small:  1.7;
  --leading-eyebrow: 1.5;

  /* ── Eyebrow tracking (unified to two values) ── */
  --tracking-eyebrow:      0.08em;   /* default — tile/glass meta */
  --tracking-eyebrow-wide: 0.12em;   /* display — heroes/section */

  /* ── Font (app infra) ── */
  --font-sans: var(--font-ayandeh), 'Tahoma', sans-serif;

  /* ── Spacing scale ── */
  --space-1:  0.25rem;
  --space-2:  0.5rem;
  --space-3:  0.75rem;
  --space-4:  1rem;
  --space-5:  1.5rem;
  --space-6:  2rem;
  --space-7:  3rem;
  --space-8:  4rem;
  --space-9:  6rem;
  --space-10: 8rem;
  --space-11: 12rem;
  --space-12: 16rem;

  /* ── Radii (mockup) ── */
  --radius-md:   4px;
  --radius-lg:   8px;
  --radius-pill: 999px;

  /* ── Shadows (mockup) ── */
  --shadow-subtle:   0 2px  8px rgba(20, 17, 15, 0.03);
  --shadow-card:     0 8px 32px rgba(20, 17, 15, 0.04);
  --shadow-elevated: 0 12px 40px rgba(20, 17, 15, 0.08);
  --shadow-modal:    0 24px 64px -24px rgba(20, 17, 15, 0.18);

  /* ── Glass surfaces (mockup + dark extension) ── */
  --glass-bg:           rgba(250, 250, 247, 0.6);
  --glass-border:       rgba(232, 224, 216, 0.5);
  --glass-blur:         24px;
  --glass-bg-dark:      rgba(250, 250, 247, 0.03);
  --glass-border-dark:  rgba(250, 250, 247, 0.06);

  /* ── Motion (mockup) ── */
  --dur-hover:   720ms;
  --dur-dialog:  600ms;
  --dur-appear:  720ms;
  --ease-out-soft: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in-soft:  cubic-bezier(0.64, 0, 0.78, 0);

  /* ── Interaction (mockup) ── */
  --hover-lift:        -2px;
  --hover-lift-card:   -3px;
  --focus-ring-width:  2px;
  --focus-ring-color:  rgba(95, 119, 96, 0.3);

  /* ── Z-index stack (app infra) ── */
  --z-base:    0;
  --z-raised:  10;
  --z-sticky:  100;
  --z-header:  200;
  --z-overlay: 900;
  --z-modal:   1000;
  --z-toast:   1100;

  /* ── Container (app infra) ── */
  --container-storefront: 1440px;
}
```

**Gone vs the prior file:** `--color-accent` (legacy beige), alternate motion scale (`--dur-instant/fast/base/slow/glacial`), `--radius-none/sm`, font-weight named tokens (Tailwind handles inline), `--tracking-*` generic tracking tokens, `--container-operator` (no operator app yet), `--reveal-x` (no reveal animations).

### `packages/design-system/css/theme.css`

Tailwind v4 `@theme inline` binding mapping every token above into a Tailwind utility namespace. Mechanical, no design decisions. Maps:

- `--color-*` → `bg-*` / `text-*` / `border-*`
- `--text-*` + paired `--leading-*` → `text-*` size utilities (font-size + line-height)
- `--space-*` → `--spacing-*` (then `gap-*`, `p-*`, `m-*`, etc.)
- `--radius-*` → `rounded-*`
- `--shadow-*` → `shadow-*`
- Breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1440px`, `2xl: 1920px`
- `--container-storefront` → `max-w-container-storefront`
- `--font-sans` → `font-sans`

### `packages/design-system/css/base.css`

Hand-written rules (not utilities):

- CSS reset (box-sizing, margin/padding, antialiasing)
- Persian rules: `:lang(fa)` no hyphens, word-spacing 0.02em, `em/i` non-italic
- `html`/`body` defaults (ivory bg, Ayandeh font, charcoal text, `--leading-body`)
- Global `:focus-visible` ring (forest @ 30% opacity, 2px outline, 2px offset)
- `.focus-ring-invert` for dark surfaces (ivory @ 40% opacity)
- `.glass-card` (light frosted glass + hover lift -2px + bg brighten)
- `.glass-card-dark` (dark frosted glass + hover border brighten, no lift)
- `.fade-in` keyframe + utility (used by hero watermark)
- Dialog `data-state="open"|"closing"` keyframes (modal backdrop fade, content slide; drawer slide-in/out per side)
- `@media (prefers-reduced-motion: reduce)` neutralizer for all animations
- `.dot-pattern` decorative utility (if any consumer needs it)

**Crucially: no inline `opacity:0` defaults anywhere.** No JS-required reveal animations. Content visible by default; hover states are CSS transitions.

### `apps/web/src/app/globals.css`

Single entry point that imports tokens → theme → base → tailwind:
```css
@import "@zhic/design-system/css/tokens.css";
@import "@zhic/design-system/css/theme.css";
@import "tailwindcss";
@import "@zhic/design-system/css/base.css";
```

---

## 3. Component inventory

### `packages/ui/src/` — 15 reusable primitives

| Component | API summary |
|---|---|
| `Button` | `variant: 'primary' | 'accent' | 'ghost' | 'on-dark' | 'link'`, `size: 'sm' | 'md' | 'lg'`, `as: 'button' | 'a'` |
| `Input` | `tone: 'light' | 'dark'`, native `<input>` props |
| `Textarea` | `tone: 'light' | 'dark'` |
| `Select` | `tone: 'light' | 'dark'` |
| `FormField` | Wrapper for label + input + error + help text. `aria-describedby` wiring |
| `Badge` | `variant: 'status' | 'meta'`, small inline labels |
| `Pill` | `active: boolean`, `as: 'button' | 'a'` — used by filter bars + category nav |
| `Breadcrumbs` | `items: { label, href? }[]`, RTL-aware separator (`‹`) |
| `Pagination` | `current: number`, `total: number`, `basePath`, `searchParams` |
| `Container` | `max-w-container-storefront` + RTL-safe `px-4 lg:px-6` gutter |
| `Section` | `bg`, `padY`, `fullBleed` (opts out of auto-Container) |
| `SkipLink` | a11y skip-to-main |
| `PhoneLink` | `<a href="tel:...">` with Persian formatted display |
| `MoneyDisplay` | rial → toman LTR formatted output |
| `DateDisplay` | Jalali date formatter |
| `Aspect` | aspect-ratio box wrapper |
| `PayloadImage` | media → `<img>` with lazy loading + alt fallback |

### `apps/web/src/components/` — page patterns

```
components/
  layout/
    SiteHeader.tsx       — sticky, transparent → blur-on-scroll, RTL nav, mobile hamburger
    SiteFooter.tsx       — 4-col link grid on charcoal, Payload-driven
    MobileMenu.tsx       — full-screen overlay (data-state CSS keyframe)
    StickyBreadcrumb.tsx — wrapper around <Breadcrumbs> for PDP/article/showroom

  hero/
    HomeHero.tsx          — split-screen + 'ژ' watermark (.fade-in on watermark)
    CinematicHero.tsx     — 21:9 cover + bottom gradient (PDP)
    ArticleHero.tsx       — full-bleed cover + bottom-pinned <HeroOverlayText>
    CollectionHero.tsx    — full-bleed cover + bottom-pinned <HeroOverlayText> ('مجموعه' eyebrow)
    EditorialHero.tsx     — cream surface (or cover) + bottom-pinned <HeroOverlayText>
    GlassOverlayHero.tsx  — photo + dark scrim + centered <GlassCard> overlay (showroom)
    DarkSplitHero.tsx     — ink bg + text-col + form-col, variant: 'page' | 'section'
    HeroOverlayText.tsx   — internal helper: absolute-positioned bottom text container, shared by Article/Collection/Editorial
    PageHeader.tsx        — h1 + optional subtitle, no hero image (for Showroom Index, Category, FAQ, Events)

  tile/
    Tile.tsx              — vertical image+body. Props: image, aspect, eyebrow?, title, titleSize, meta?, price?, badge?, hover ('full'|'soft'), href
    HorizontalTile.tsx    — horizontal image+body. Props: image, imageWidth (px), eyebrow?, title, meta?, price?, hover ('soft'), href

  home/
    HomeBrandStatement.tsx     — dark 2fr/3fr + StatBlock cluster
    HomeFeaturedDesigns.tsx    — asymmetric grid using <Tile>
    HomeShowroomsStrip.tsx     — 3-col GlassCards
    HomeJournalTeaser.tsx      — asymmetric editorial using <Tile> + <HorizontalTile>
    HomeInquiryCta.tsx         — uses <DarkSplitHero variant="section"> + <InquiryFormSlim>
    StatBlock.tsx              — gold-bordered number + label (used inside HomeBrandStatement)

  product/
    ProductIndexHero.tsx       — featured Tile + 3 HorizontalTiles
    ProductFilterPills.tsx     — pill row using <Pill>
    ProductIndexToolbar.tsx    — count + sort + mobile drawer trigger
    ProductGrid.tsx            — grid of <Tile aspect="4/5">
    ProductSidebar.tsx         — cream sticky purchase panel (price, badges, CTAs, lead-time, SKU)
    ProductThumbnails.tsx      — 80×80 strip
    SpecsAccordion.tsx         — <details> per section, chevron rotation (product-spec-shape-aware)

  journal/
    JournalFeaturedArticle.tsx — 2-col image+text, image RTL-end
    JournalGrid.tsx            — 3-col of <Tile aspect="3/2">
    AuthorCard.tsx             — avatar + name + role + bio
    ArticleProse.tsx           — 680px centered column wrapper around RichText

  showroom/
    ShowroomInfoCards.tsx      — 3 GlassCards in a row (address+map / hours / phone+CTAs)
    ShowroomIndexGrid.tsx      — 3-col GlassCards
    ShowroomHoursTable.tsx     — Persian day rows + LTR time ranges
    ShowroomAddressBlock.tsx   — district/street/plaque/postal-code formatted
    ShowroomMapEmbed.tsx       — iframe wrapper or fallback link

  contact/
    (uses <DarkSplitHero variant="page"> + <InquiryForm>)

  inquiry/
    InquiryForm.tsx            — full 5-field dark glass form (name, phone, city, reason, message; conditional preferred-date)
    InquiryFormSlim.tsx        — 3-field (name, phone, message), hidden defaults city='سایر شهرها' + reason='price_inquiry'

  faq/
    FaqAccordion.tsx           — <details> with plus→× icon rotation

  events/
    EventCard.tsx              — Jalali date block (cream bg) + body

  editorial/
    EditorialPage.tsx          — about/atelier/care template: <EditorialHero> + <ArticleProse>
    LegalPage.tsx              — privacy/terms/returns/shipping: title + updated date + 680px body

  shared/
    GlassCard.tsx              — text-only frosted card. Props: tone ('light' | 'dark'), href?, children
```

**~44 page components total** (4 layout + 9 hero + 2 tile + 6 home + 7 product + 4 journal + 5 showroom + 2 inquiry + 1 faq + 1 events + 2 editorial + 1 shared). Each is a single small file built from `@zhic/ui` primitives + `<Tile>`/`<HorizontalTile>`/`<GlassCard>` composables + Tailwind utilities + `.glass-card`/`.glass-card-dark` CSS surface classes.

---

## 4. Routes (page composition)

```
apps/web/src/app/
  layout.tsx                          — root: html lang="fa-IR" dir="rtl", Ayandeh font, globals.css
  globals.css                         — imports tokens/theme/tailwind/base
  manifest.ts, robots.ts, sitemap.ts, opengraph-image.tsx — preserved from existing
  actions/submitInquiry.ts            — preserved unchanged
  (site)/
    layout.tsx                        — chrome: <SiteHeader> + main + <SiteFooter>
    page.tsx                          — Homepage — composes Home* components
    products/
      page.tsx                        — Product Index
      [slug]/page.tsx                 — PDP
      loading.tsx                     — preserved
    journal/
      page.tsx                        — Journal Index
      [slug]/page.tsx                 — Article
      category/[slug]/page.tsx        — Category archive
      tag/[slug]/page.tsx             — Tag archive
    showrooms/
      page.tsx                        — Showrooms Index
      [slug]/page.tsx                 — Showroom Detail
    contact/page.tsx                  — Contact (uses <DarkSplitHero variant="page">)
    about/page.tsx                    — uses <EditorialPage>
    atelier/page.tsx                  — uses <EditorialPage>
    care/page.tsx                     — uses <EditorialPage>
    faq/page.tsx                      — uses <PageHeader> + <FaqAccordion>
    events/page.tsx                   — uses <PageHeader> + <EventCard>s
    privacy/page.tsx, terms/page.tsx, returns/page.tsx, shipping-and-delivery/page.tsx — use <LegalPage>
    thank-you/page.tsx                — preserved
    collections/[slug]/page.tsx       — uses <CollectionHero> + grid
    categories/[slug]/page.tsx        — uses <PageHeader> + grid + ghost CTA
    error.tsx, not-found.tsx          — preserved
    opengraph-image.tsx               — preserved
  lab/
    page.tsx                          — single component gallery (every component, every prop combo)
```

---

## 5. Verification methodology (the gate)

### Per-component checkpoint

1. Build component in isolation (just markup, props, styles)
2. Add/update its entry on the `/lab` page with all prop variations
3. Restart dev server (or rely on HMR) — server already binds `0.0.0.0:8765` per `next start -p 8765 -H 0.0.0.0`
4. Surface URL to user: "Component X is on `http://0.0.0.0:8765/lab` — please compare with mockup at `http://80.240.31.146:9090/.superpowers/<file>.html`"
5. User says "ship" → commit; "fix" → list specific deltas, fix, re-checkpoint
6. No batching for the first ~5 components. Once we're aligned on quality bar, can batch 3-5 components per checkpoint

### Target fidelity

**Pixel-level match at 1440×900 desktop** (primary). Same aspects, colors, spacing, hover behavior. Mobile responsive verified separately at 375px.

### Tooling

- **Mockups:** served at `http://80.240.31.146:9090/.superpowers/` (already running)
- **Live site:** `http://0.0.0.0:8765/` (already running)
- **Lab page:** `http://0.0.0.0:8765/lab/`
- **Side-by-side:** two browser tabs, manual eyeball
- **Screenshot diffing (optional):** Playwright headless if system deps installed (`sudo apt-get install libatk1.0-0 libatk-bridge2.0-0 libcups2 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libxkbcommon0 libpango-1.0-0 libcairo2`). Without this, eyeball-only.

### Build order

1. **Foundation** — `tokens.css`, `theme.css`, `base.css`, `globals.css`, root `layout.tsx`. Verify with a single test page rendering tokens.
2. **`@zhic/ui` primitives** — Button, Input, Pill, Container, Section first. Each verified on `/lab`.
3. **Tile + HorizontalTile + GlassCard** — verified on `/lab` with 5+ prop combos each.
4. **Hero components** — one per checkpoint.
5. **Page components** — per page, in order: Homepage → Products Index → PDP → Journal Index → Article → Showrooms Index → Showroom Detail → Contact → About/Atelier/Care → FAQ → Events → Legal × 4 → Collection → Category.
6. **Routes** — wired to use the page components, with sticky breadcrumbs and chrome.
7. **Cross-page QA** — full smoke test, all routes, both viewports.

Each step is an opportunity to checkpoint. We pause between steps for user review.

### Site chrome decisions (derived from mockups, not asked)

These are settled by the mockups and don't need user input:

- **Header:** sticky, fully transparent at scroll-y=0, on scroll-past-60px adds `bg-ivory/85 + backdrop-blur + border-b border-sand + shadow-subtle`
- **Mobile header:** 3-col grid (hamburger inline-start, brand centered, empty inline-end)
- **Mobile menu:** full-screen `<dialog>` overlay, opacity fade via `data-state` keyframe, close button inline-start, brand centered, vertical nav links
- **Active nav link:** forest 1.5px underline + bold + charcoal text
- **Footer:** `bg-charcoal text-ivory`, 4-col link grid (collapses to 2 then 1), bottom row with copyright + privacy/terms link, link content from Payload SiteFooter global

---

## 6. Open infra prerequisites

These need user action before implementation can complete:

1. **Postgres for Payload** — currently down. Either:
   - User runs `sudo docker run -d --name zhic-pg --rm -p 5432:5432 -e POSTGRES_PASSWORD=password -e POSTGRES_USER=postgres -e POSTGRES_DB=zhic postgres:16-alpine`
   - User starts Postgres via existing setup
   - User confirms it's OK to proceed without data (pages render fallback states)
2. **`services/api/.env`** — needs `DATABASE_URI=postgresql://postgres:password@localhost:5432/zhic` and `PAYLOAD_SECRET=<any-string>`
3. **Seed run** — `pnpm --filter @zhic/api seed` after Postgres is up
4. **(Optional) Playwright deps** — `sudo apt-get install libatk1.0-0 libatk-bridge2.0-0 libcups2 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libxkbcommon0 libpango-1.0-0 libcairo2` for automated screenshot diffing. Without this, verification is eyeball-only.

---

## 7. What this spec deliberately doesn't decide

- **Icons** — extracted as inline SVG per component as needed; no icon library. Mockups use inline SVGs throughout.
- **Animation library** — none. CSS-only motion. No GSAP, no Framer Motion, no Lenis (smooth-scroll deferred).
- **Tests** — visual verification is the test. No vitest for components in v2 unless a specific component has logic worth testing in isolation.
- **A11y deep audit** — basics from the start (semantic HTML, focus rings, aria-current, role="dialog", form labels). Deeper audit (e.g., screen-reader walkthrough) is a follow-up after the design lands.
- **Performance** — `loading="eager"+fetchPriority="high"` on hero images; `loading="lazy"` on below-fold. No further perf work in v2.
- **i18n** — Persian-only. No English fallbacks.

---

## 8. Success criteria

v2 is complete when:

- [ ] All routes from §4 render at `0.0.0.0:8765`
- [ ] Each route matches its mockup at 1440×900 desktop, eyeball-confirmed by user
- [ ] Each route renders correctly at 375px mobile
- [ ] No content invisible by default (no `opacity:0` waiting for JS)
- [ ] No motion library; CSS-only animations
- [ ] `pnpm --filter @zhic/web typecheck` is clean
- [ ] `pnpm --filter @zhic/web build` succeeds
- [ ] Production server runs on `0.0.0.0:8765` serving the new pages
- [ ] `docs/state.md` updated with redesign-v2 commit range
