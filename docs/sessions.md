# Month 1 — Session Execution Plan

Each session is a self-contained Claude Code conversation. Sessions are
sized to stay well within context limits (~80–120k tokens of working
room). Each one has a clear **entry state**, **deliverables**, and
**exit check** so you can verify completion before moving on.

Start each session by telling Claude Code:
> "We're starting session X.Y — read `docs/sessions.md` for context."

---

## Phase 0: Planning & Docs (current session)

### Session 0.1 — Docs reorganization + session plan
- **Entry:** Flat docs folder, no execution plan
- **Deliverables:** Reorganized docs/, this file, updated CLAUDE.md
- **Exit check:** `docs/` has subfolders, `sessions.md` exists

---

## Phase 1: Monorepo Foundation

### Session 1.1 — Monorepo scaffold
- **Entry:** Flat Next.js app in `src/`
- **Deliverables:**
  - Turborepo + pnpm workspaces initialized
  - `apps/web/` — Next.js 16 app (move existing `src/` here)
  - `services/api/` — Payload 3 skeleton (no collections yet)
  - Package stubs: `packages/design-system`, `packages/ui`,
    `packages/locale`, `packages/types`, `packages/config`,
    `packages/db`
  - Shared tsconfig, eslint config in `packages/config`
  - `turbo.json` with build/dev/lint pipelines
  - Root `package.json` with pnpm workspace definition
- **Exit check:** `pnpm dev` boots both `apps/web` and
  `services/api` without errors
- **Refs:** `docs/spec/architecture.md`

### Session 1.2 — Design system tokens + Tailwind preset
- **Entry:** Monorepo scaffold from 1.1
- **Deliverables:**
  - `packages/design-system/` fully built:
    - Color tokens extracted from logo (or placeholder hex values
      if logo PDF not yet processed)
    - Typography tokens (Ayandeh font family, 4 weights, scale)
    - Spacing scale, border-radius, shadows
    - Breakpoints + RTL-aware grid
    - Tailwind v4 preset that consumes all tokens
  - Ayandeh font files in `apps/web/` loaded via `next/font/local`
  - `apps/web` consumes the Tailwind preset — verify with a test page
- **Exit check:** `pnpm build` passes; a test page renders with
  correct font, colors, and RTL direction
- **Refs:** `docs/spec/design-system.md`

### Session 1.3 — Payload 3 CMS + collections
- **Entry:** Monorepo with `services/api` stub from 1.1
- **Deliverables:**
  - Payload 3 configured with Postgres adapter
  - All Month 1 collections created:
    - Designs, Products, Showrooms, Pages (globals/singletons),
      Articles, Categories, Tags, Media, Inquiries
  - S3 adapter configured for Abr Arvan Object Storage
  - Admin panel accessible at `/admin`
  - Seed script with sample data for 1–2 designs, products, showrooms
- **Exit check:** Can create/edit/delete documents in Payload admin;
  seed data visible
- **Refs:** `docs/spec/data-schemas.md`, `docs/package1-month1.md`
  (CMS collections section)

### Session 1.4 — Locale + utility packages
- **Entry:** Monorepo from 1.1
- **Deliverables:**
  - `packages/locale/`:
    - Persian digit converter (ASCII ↔ ۰–۹)
    - ZWNJ helper
    - Jalali date formatter (using a lightweight lib)
    - Phone number formatter (Iranian format)
  - `packages/money/`:
    - Rial ↔ toman conversion
    - Persian toman formatter with thousands separator
  - Unit tests for all utilities
- **Exit check:** All tests pass
- **Refs:** `docs/spec/design-system.md` (Persian/RTL rules)

> **Note:** Sessions 1.2, 1.3, and 1.4 can run in parallel after 1.1
> is complete — they don't depend on each other.

---

## Phase 2: Core UI Components

### Session 2.1 — Button, form fields, badges
- **Entry:** Design tokens from 1.2
- **Deliverables:**
  - `packages/ui/` components:
    - Button (primary, secondary, ghost, icon variants)
    - Text input, textarea, select/dropdown
    - Checkbox, radio
    - Badges / tags (age group, material, category)
  - All components use design-system tokens (no hardcoded colors)
  - RTL-correct (logical properties, correct text alignment)
- **Exit check:** Components render correctly in a test page with
  RTL layout
- **Refs:** `docs/spec/design-system.md` (components section)

### Session 2.2 — Navigation, footer, layout shell
- **Entry:** Design tokens from 1.2, button from 2.1
- **Deliverables:**
  - `packages/ui/` components:
    - Navigation bar (desktop + mobile hamburger, RTL)
    - Footer (links, showrooms, contact, social)
    - Breadcrumbs
    - Modal / drawer
  - `apps/web/` layout shell:
    - Root layout with `<html lang="fa" dir="rtl">`
    - Header + footer integrated
    - Smooth scroll (Lenis) provider
- **Exit check:** `apps/web` renders with nav, footer, and correct
  RTL layout on desktop + mobile viewport

### Session 2.3 — Cards + image gallery
- **Entry:** Design tokens, badges from 2.1
- **Deliverables:**
  - `packages/ui/` components:
    - Product card
    - Design card
    - Article card
    - Showroom card
    - Image gallery (multi-image, GIF support)
  - Cards use locale package for Persian digits in prices
- **Exit check:** Cards render with sample data, gallery cycles images

> **Note:** Sessions 2.1, 2.2, and 2.3 can partially overlap — 2.2 and
> 2.3 only need the tokens from 1.2 and minimal components from 2.1.

---

## Phase 3: Core Pages

### Session 3.1 — Home page
- **Entry:** Layout shell (2.2), cards (2.3), Payload collections (1.3)
- **Deliverables:**
  - `apps/web/` home page (`/`):
    - Hero section (video scrub with poster frame +
      `prefers-reduced-motion` fallback)
    - Featured designs grid
    - Brand statement section
    - Showrooms strip
    - Journal teaser
    - Inquiry CTA
  - Data fetched from Payload API (or mock data if API not wired)
- **Exit check:** Home page renders all sections with sample content
- **Refs:** `docs/package1-month1.md` (home page section)

### Session 3.2 — Product index + product detail (PDP)
- **Entry:** Cards (2.3), Payload Products/Designs collections (1.3),
  locale (1.4)
- **Deliverables:**
  - `/products` — filterable grid (category, material, price band)
  - `/products/[slug]` — gallery, specs, dimensions, materials,
    inquiry CTA
  - `/collections/[slug]` — curated product groupings
  - Prices displayed in toman with Persian digits
  - Breadcrumbs on inner pages
- **Exit check:** Can browse products, filter, click into detail,
  see specs and gallery

### Session 3.3 — Showroom pages + contact
- **Entry:** Cards (2.3), Payload Showrooms collection (1.3)
- **Deliverables:**
  - `/showrooms` — all showrooms with map placeholder (Neshan/OSM)
  - `/showrooms/[slug]` — hours, address, phone, gallery, inquiry CTA
  - `/contact` — form + phone + showrooms list
- **Exit check:** Showroom pages render with sample data

### Session 3.4 — Legal + static pages
- **Entry:** Layout shell (2.2), Payload Pages singletons (1.3)
- **Deliverables:**
  - `/privacy`, `/terms`, `/returns`, `/shipping-and-delivery`
  - Generic `Page` template that renders Payload richtext
  - Thank-you page (`/thank-you`) — static
- **Exit check:** All legal pages render from CMS content

> **Note:** Sessions 3.2, 3.3, and 3.4 can run in parallel after 3.1.

---

## Phase 4: Editorial Pages

### Session 4.1 — Journal + article pages
- **Entry:** Article cards (2.3), Payload Articles/Categories/Tags (1.3)
- **Deliverables:**
  - `/journal` — article index with pagination
  - `/journal/[slug]` — long-form article with TOC
  - `/journal/category/[slug]` — filtered archive
  - `/journal/tag/[slug]` — filtered archive
- **Exit check:** Journal pages render, category/tag filtering works

### Session 4.2 — FAQ, About, Atelier, Care, Events, Categories
- **Entry:** Layout shell (2.2), Payload Pages singletons (1.3)
- **Deliverables:**
  - `/faq` — Q&A accordion from Payload
  - `/about` — brand story page
  - `/atelier` — craft & process page
  - `/care` — materials & care guide
  - `/events` — static event listings
  - `/categories/[slug]` — per-category editorial landing
- **Exit check:** All editorial pages render with sample content

---

## Phase 5: Inquiry Flow + SMS

### Session 5.1 — Inquiry form + SMS routing
- **Entry:** Payload Inquiries collection (1.3), showroom data,
  `packages/sms` (to be created)
- **Deliverables:**
  - `packages/sms/` — SMS.ir wrapper (send SMS function)
  - Unified inquiry form component (name, phone, city dropdown,
    reason, preferred date, message)
  - Iranian phone validation
  - City-based SMS routing logic:
    - City matches showroom → SMS to that manager
    - No match / "سایر شهرها" → SMS to central (Hamedan)
  - Form submission → save to Payload Inquiries + fire SMS
  - Inquiry form integrated on PDP, showroom detail, contact page
  - `/thank-you` redirect after submission
- **Exit check:** Submit form → inquiry appears in Payload admin +
  SMS delivered to correct number (test with SMS.ir sandbox)

---

## Phase 6: SEO + Motion + Polish

### Session 6.1 — SEO foundations
- **Entry:** All pages built (Phases 3–4)
- **Deliverables:**
  - `generateMetadata` on every route
  - `sitemap.ts`, `robots.ts`, `manifest.ts`
  - JSON-LD schemas:
    - `Organization` on home
    - `LocalBusiness` (`FurnitureStore`) per showroom
    - `Product` on PDP (inquiry mode, no `Offer`)
    - `FAQPage` on FAQ
    - `Article` on journal articles
    - `BreadcrumbList` on all inner pages
  - OG image generation (Persian-safe with Ayandeh font)
- **Exit check:** Lighthouse SEO score ≥ 90; structured data
  validates in Google Rich Results Test
- **Refs:** `docs/spec/seo.md`

### Session 6.2 — Motion + scroll effects
- **Entry:** All pages built, design tokens in place
- **Deliverables:**
  - GSAP ScrollTrigger / Framer Motion setup
  - Hero scroll-driven video scrubbing
  - Reveal-on-scroll animations (fade/slide)
  - Parallax image layers where appropriate
  - Sticky scroll sections
  - `prefers-reduced-motion` fallback on all animations
- **Exit check:** Animations play smoothly on Chrome + Firefox;
  reduced-motion respects user preference
- **Refs:** `docs/spec/design-system.md` (motion section)

### Session 6.3 — QA + final polish
- **Entry:** Everything built
- **Deliverables:**
  - Cross-browser QA (Chrome, Firefox, Safari — mobile + desktop)
  - RTL polish pass (logical properties, text alignment, icons)
  - Persian typography check (ZWNJ, digits, Jalali dates)
  - Performance audit (Lighthouse CWV)
  - Sample content populated for client demo
  - Admin → storefront pipeline verified (edit in Payload → live
    within 10 minutes)
- **Exit check:** All Month 1 exit criteria from
  `docs/package1-month1.md` verified

---

## Phase 7: Infrastructure & Deployment

### Session 7.1 — VPS + CI/CD setup
- **Entry:** Working app locally
- **Deliverables:**
  - Pars Pack VPS provisioned
  - Caddy configured with auto-TLS
  - Postgres installed and configured
  - Gitea at `git.zhicwood.com`
  - Gitea Actions runner
  - Abr Arvan DNS/CDN configured
  - Abr Arvan Object Storage bucket
  - Plausible self-hosted instance
  - SMS.ir account configured
  - Deploy pipeline: develop → staging, main → production
  - Staging password protection
- **Exit check:** Push to develop → staging site loads; push to
  main → production site loads

> **Note:** Session 7.1 can start as early as Phase 1 completion.
> It's server-side work and doesn't depend on UI sessions. However,
> it involves SSH/server work rather than Claude Code, so it may be
> a manual session.

---

## Session dependency graph

```
0.1 (this session)
 │
 ▼
1.1 Monorepo scaffold
 │
 ├──────────┬──────────┐
 ▼          ▼          ▼
1.2 Tokens  1.3 CMS    1.4 Locale
 │          │          │
 ▼          │          │
2.1 Forms   │          │
2.2 Layout  │          │
2.3 Cards   │          │
 │          │          │
 ├──────────┘──────────┘
 ▼
3.1 Home page
 │
 ├──────────┬──────────┐
 ▼          ▼          ▼
3.2 PDP    3.3 Showrm  3.4 Legal
 │          │
 ▼          ▼
4.1 Journal 4.2 Editorial
 │          │
 ├──────────┘
 ▼
5.1 Inquiry + SMS
 │
 ├──────────┬──────────┐
 ▼          ▼          ▼
6.1 SEO    6.2 Motion  6.3 QA
                        │
                        ▼
                    7.1 Deploy
```

---

## Session count summary

| Phase | Sessions | Parallel? |
| --- | --- | --- |
| 0 — Planning | 1 | — |
| 1 — Foundation | 4 | 1.2, 1.3, 1.4 parallel after 1.1 |
| 2 — Components | 3 | 2.1–2.3 partially parallel |
| 3 — Core pages | 4 | 3.2–3.4 parallel after 3.1 |
| 4 — Editorial | 2 | 4.1, 4.2 parallel |
| 5 — Inquiry | 1 | — |
| 6 — Polish | 3 | 6.1, 6.2 parallel; 6.3 last |
| 7 — Deploy | 1 | Can start after Phase 1 |
| **Total** | **19** | |

Estimated: ~15 effective sessions if you parallelize where marked.
Each session ≈ 1 focused Claude Code conversation.
