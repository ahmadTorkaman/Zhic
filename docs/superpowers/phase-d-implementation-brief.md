# Phase D Implementation Brief

**Purpose:** This document provides full context for implementing all approved page designs into the live Next.js site. Read this at the start of the implementation session.

---

## Project Overview

**Zhic** (`/home/ahmad/Zhic`) is an Iranian furniture brand's monorepo. The storefront is at `apps/web/` (Next.js 16 App Router, React 19, Tailwind v4). The shared component library is at `packages/ui/` (82 exports). The design system tokens are at `packages/design-system/`.

**Current branch:** `claude/plan-session-2-1-bUd75`

**What was done in the previous session (2026-04-16 to 2026-04-18):**

### Pass 1: Foundation (17 commits)
- Palette renamed: `saffron` → `gold` (#C49A6C), `moss` → `forest` (#5F7760)
- New tokens: glass surface (`--glass-bg`, `--glass-border`, `--glass-blur`), shadow scale (`--shadow-subtle`, `--shadow-card`, `--shadow-elevated`), interaction (`--dur-hover: 720ms`, `--hover-lift`, `--focus-ring-color`)
- Glass system in `base.css` rewritten to use tokens
- Container gutter aligned to spec (px-4 mobile, px-6 desktop)
- 5 bug fixes (BackToTop, TableOfContents, ShowroomHolidayHours, ShowroomHoursTable, SiteHeader)
- Lab pages `/lab/color` and `/lab/type` fully rewritten with Persian content

### Pass 2: Interaction Language (15 commits)
- Global focus ring system: `:focus-visible` with `--focus-ring-color` (forest green at 30% opacity)
- All components updated with 720ms transitions (`--dur-hover` + `--ease-out-soft`)
- Interaction language: light shift (cream→ivory on hover) + subtle elevation (translateY + shadow)
- Button: charcoal primary, forest accent, ghost border transition, link decoration transition
- Cards: two-layer hover choreography — 720ms lift + 1200ms image zoom
- Inputs: hover `border-stone`, focus `border-forest` with shadow ring
- Modal: open/close CSS animation (backdrop fade + content slide, 600ms)
- Drawer: side-aware slide animation with `data-state` lifecycle
- Focus ring stripped from 15 files, replaced with global rule + `.focus-ring-invert` for dark backgrounds
- BlockReveal duration increased to 900ms, WordReveal stagger to 80ms
- New `PageReveal` component for staggered page entrance

### Pass 3: Component Expansion (16 commits)
- 12 new components in `@zhic/ui`: IconButton, Spinner, Link, Divider, Skeleton, Toggle, Tooltip, Accordion, Tabs, FilterNav, Pagination, PayloadImage
- CloseButton extracted from Modal/Drawer into shared internal module
- 6 cover image duplications refactored to use PayloadImage
- Minor fixes: ProductPurchasePanel text token, PhoneLink bidi, SiteFooter dynamic cols, ShowroomCard digits, FormField fieldset mode
- Barrel: 82 exports total

---

## Design Decisions

### Brand Visual Language
- **Color philosophy:** Neutrals carry 95%. Forest (#5F7760) and gold (#C49A6C) appear only at designated accent moments.
- **Accent moments:** Eyebrow labels, single accent CTA per page, input focus states, dark-section hover rewards, active nav underline, stat borders.
- **Motion personality:** "Slow and confident" — 720ms transitions with ease-out-soft curves. Things glide, never snap.
- **Texture:** Frosted glass + light — warm translucency, depth through layering and opacity.
- **Interaction:** Light shift (luminosity change) + subtle elevation (translateY + shadow deepening).

### Page Design Pattern
Two patterns emerged from the mockup process:

**Pattern C (Asymmetric)** — for catalog/product pages where visual hierarchy matters:
- Split-screen or asymmetric grid compositions
- Featured item displayed prominently with smaller items alongside
- Used on: Homepage, Product Index, PDP

**Pattern B (Immersive/Dramatic)** — for editorial/location/conversion pages where atmosphere matters:
- Full-bleed hero images with gradient fades
- Glass card overlays
- Dark sections with gold accents
- Used on: Journal Index, Article, Showroom Detail, Contact

---

## Approved Page Designs

All mockups are HTML files in `.superpowers/` and can be viewed at `http://80.240.31.146:9090/.superpowers/`. Each mockup file has a tab switcher showing 2-3 options — the **chosen option** is listed below.

### Homepage — Option C "Asymmetric Luxury"
**Mockup:** `.superpowers/homepage-c-full.html`
**Components:** `apps/web/src/components/home/HomeHero.tsx`, `HomeBrandStatement.tsx`, `HomeFeaturedDesigns.tsx`, `HomeShowroomsStrip.tsx`, `HomeJournalTeaser.tsx`, `HomeInquiryCta.tsx`

| Section | Background | Layout |
|---|---|---|
| Hero | ivory / cream→sand gradient | Split-screen: text RTL-start, 'ژ' watermark RTL-end. Full viewport. |
| Brand story | ink (dark) | 2/3 grid: gold-bordered stats RTL-start, editorial text RTL-end. Radial gold glow. |
| Featured designs | ivory | Asymmetric grid: 1 large card (3/4 aspect, spans 2 rows) + 2 standard cards. |
| Showrooms | cream | 3-col glass cards (`--glass-bg`, `--glass-border`, `--glass-blur`). City in forest eyebrow. |
| Journal | ivory | Asymmetric editorial: featured article (3/4) + 2 small thumbnail articles. |
| Contact CTA | ink (dark) | Two-column: gold-line + text RTL-start, frosted glass form RTL-end. Forest submit. |

**Mobile:** Hero stacks (image top, text below). Logo centered, hamburger left. Brand stats horizontal scroll. Product grid collapses. Glass cards stack. CTA stacks with centered text.

### A1: Product Index — Option C "Asymmetric Hero"
**Mockup:** `.superpowers/a1-product-index.html` (click Option C tab)
**Components:** `apps/web/src/app/(site)/products/page.tsx`, `ProductGrid.tsx`, `ProductFilters.tsx`, `ProductIndexToolbar.tsx`, `MobileFilterTrigger.tsx`, `Pagination.tsx`

- Featured product displayed large (3:4) with 3 mini-cards stacked beside it
- Pill filter bar below (category + material groups separated by dividers)
- 4-column product grid for remaining products
- Mobile: featured full-width, mini-cards horizontal scroll, grid 2-col then 1-col

### A2: PDP — Option C "Immersive + Side Panel"
**Mockup:** `.superpowers/a2-pdp.html` (click Option C tab)
**Components:** `apps/web/src/app/(site)/products/[slug]/page.tsx`, `ProductMediaStage.tsx`, `ProductPurchasePanel.tsx`, `ProductSpecsAccordion.tsx`, `ProductRelatedRow.tsx`

- Cinematic 21:9 hero image spanning full width with gradient fade at bottom
- Thumbnail strip below hero
- Text content (title, tagline, description) on the left
- Compact cream sidebar (price, badges, CTAs, lead time, SKU) sticky on the right
- Specs accordion inline below description
- Mobile: hero becomes 4:5, sidebar drops below full-width, thumbnails horizontal scroll

### A3: Journal Index — Option B "Magazine Editorial"
**Mockup:** `.superpowers/a3-journal-index.html` (click Option B tab)
**Components:** `apps/web/src/app/(site)/journal/page.tsx`, `JournalGrid.tsx`, `JournalCategoryNav.tsx`

- Featured article takes half viewport: large 4:5 image on one side, title + excerpt + meta on the other
- Sand divider
- Remaining articles in standard 3-column grid below
- Category pills above
- Mobile: featured stacks (image 16:9 above text), grid 2-col then 1-col

### A4: Article Page — Option B "Full-Bleed Hero"
**Mockup:** `.superpowers/a4-article.html` (click Option B tab)
**Components:** `apps/web/src/app/(site)/journal/[slug]/page.tsx`, `ArticleHero.tsx`, `TableOfContents.tsx`, `AuthorCard.tsx`, `RelatedArticles.tsx`

- Full-width cover image with gradient fade to ivory at bottom
- Title and author meta overlay the bottom edge
- Single centered prose column (max-width 680px) with NO TOC sidebar
- Pull quotes with gold right-border
- Author card and related articles below
- Mobile: cover becomes 3:2

**Important change from current:** The current implementation has a TOC sidebar. Option B removes it for a cleaner reading experience. The TOC component still exists but won't be used on this page.

### A5: Showroom Detail — Option B "Glass Card Overlay"
**Mockup:** `.superpowers/a5-showroom.html` (click Option B tab)
**Components:** `apps/web/src/app/(site)/showrooms/[slug]/page.tsx`, `ShowroomHero.tsx`, `ShowroomAddressBlock.tsx`, `ShowroomCtas.tsx`, `ShowroomMapEmbed.tsx`, `ShowroomHoursTable.tsx`

- Photo hero with centered frosted glass card (city in forest eyebrow, name, headline, single CTA)
- Below: 3 glass info cards in a row — address + inline map, hours table, phone + CTAs
- Gallery strip below
- Mobile: glass cards stack vertically

**Major restructure from current:** Current uses a 60/40 Split with sidebar. New design centers everything with glass cards.

### A6: Contact — Option B "Dark Hero + Frosted Form"
**Mockup:** `.superpowers/a6-contact.html` (click Option B tab)
**Components:** `apps/web/src/app/(site)/contact/page.tsx`, `InquiryForm.tsx`

- Dark ink hero with gold accent line + contact info (phone, email, hours) on the right
- Frosted glass form card on the left
- Showroom glass cards below on ivory
- Mobile: stacks vertically, form below text

### Phase B Template Pages
**Mockup:** `.superpowers/b-template-pages.html` (tab switcher for all 8)

| Page | Route | Inherits from | Key treatment |
|---|---|---|---|
| B1 Showroom Index | `/showrooms` | Homepage showrooms | Glass cards with forest city eyebrow, 3-col grid |
| B2 Collection | `/collections/[slug]` | Product Index (C) | Full-bleed hero with gradient, editorial intro, product grid |
| B3 Category | `/categories/[slug]` | Product Index (C) | Title + lead + product grid + "see all" CTA |
| B4 About | `/about` | Article (B) | Full-bleed hero, forest eyebrow, centered prose |
| B5 Atelier | `/atelier` | Article (B) | Taller hero, prose + inline image grid |
| B6 FAQ | `/faq` | Standalone | Centered prose-width, plus-icon accordion |
| B7 Events | `/events` | Standalone | Date block cards (Jalali day + month) |
| B8 Care | `/care` | Article (B) | Full-bleed hero, care guide as prose |

### Phase C Legal Template
**Mockup:** `.superpowers/c-legal-template.html`
**Routes:** `/privacy`, `/terms`, `/returns`, `/shipping-and-delivery`

Simple prose: title + updated date + section headings + body text. Max-width 680px. No hero image, no visual drama — just clear, readable legal text.

---

## Implementation Approach

Phase D should be executed as a series of implementation tasks:

1. **D1: Homepage** — Rewrite all 6 home components to match `homepage-c-full.html`
2. **D2: Product pages** — Rewrite Product Index + PDP to match A1-C and A2-C mockups
3. **D3: Journal pages** — Rewrite Journal Index + Article to match A3-B and A4-B mockups
4. **D4: Showroom + Contact** — Rewrite Showroom Detail + Contact to match A5-B and A6-B mockups
5. **D5: Template pages** — Update B1-B8 pages to match mockups
6. **D6: Legal template** — Refine LegalPageTemplate to match Phase C mockup
7. **D7: Cross-page QA** — Full visual walkthrough on dev server
8. **D8: Documentation** — Finalize design system spec with all implemented layouts

Each step should be planned (using the writing-plans skill) and executed (using subagent-driven-development) with spec review after each task.

---

## Key Files Reference

### Design System
- `packages/design-system/css/tokens.css` — all CSS custom properties
- `packages/design-system/css/theme.css` — Tailwind v4 `@theme inline` bindings
- `packages/design-system/css/base.css` — glass system, focus ring, dialog animations, skeleton shimmer, page reveal

### Component Library
- `packages/ui/src/index.ts` — barrel exports (82 total)
- `packages/ui/src/cardClasses.ts` — `CARD_BASE`, `CARD_INTERACTIVE`, `CARD_IMAGE_ZOOM`
- `packages/ui/src/controlClasses.ts` — `CONTROL_BASE`, `CONTROL_SIZE`

### Homepage Components
- `apps/web/src/components/home/HomeHero.tsx`
- `apps/web/src/components/home/HomeBrandStatement.tsx`
- `apps/web/src/components/home/HomeFeaturedDesigns.tsx`
- `apps/web/src/components/home/HomeShowroomsStrip.tsx`
- `apps/web/src/components/home/HomeJournalTeaser.tsx`
- `apps/web/src/components/home/HomeInquiryCta.tsx`

### Product Components
- `apps/web/src/components/products/ProductGrid.tsx`
- `apps/web/src/components/products/ProductFilters.tsx`
- `apps/web/src/components/products/ProductMediaStage.tsx`
- `apps/web/src/components/products/ProductPurchasePanel.tsx`
- `apps/web/src/components/products/ProductSpecsAccordion.tsx`
- `apps/web/src/components/products/ProductRelatedRow.tsx`
- `apps/web/src/components/products/Pagination.tsx` (app-layer, uses `buildQueryString`)

### Journal Components
- `apps/web/src/components/journal/JournalGrid.tsx`
- `apps/web/src/components/journal/JournalCategoryNav.tsx`
- `apps/web/src/components/journal/ArticleHero.tsx`
- `apps/web/src/components/journal/TableOfContents.tsx`
- `apps/web/src/components/journal/AuthorCard.tsx`

### Showroom Components
- `apps/web/src/components/showrooms/ShowroomHero.tsx`
- `apps/web/src/components/showrooms/ShowroomAddressBlock.tsx`
- `apps/web/src/components/showrooms/ShowroomCtas.tsx`
- `apps/web/src/components/showrooms/ShowroomMapEmbed.tsx`
- `apps/web/src/components/showrooms/ShowroomHoursTable.tsx`
- `apps/web/src/components/showrooms/ShowroomHolidayHours.tsx`

### Shared
- `apps/web/src/components/PayloadImage.tsx` — shared cover image component
- `apps/web/src/components/motion/BlockReveal.tsx`, `WordReveal.tsx`, `PageReveal.tsx`, `ImageReveal.tsx`, `BackToTop.tsx`
- `apps/web/src/lib/payload.ts` — REST fetchers, `mediaUrl`, types
- `apps/web/src/lib/richtext.tsx` — Lexical JSON → React serializer

---

## Design System Spec
Full spec at `docs/spec/design-system.md` — sections 8 (Templates) contains all page layout documentation including homepage, product index, PDP, journal, article, showroom, and contact layouts with section orders, backgrounds, mobile behavior, and token usage.

## Roadmap
Full roadmap at `docs/superpowers/specs/2026-04-17-page-design-roadmap.md` — shows Phase A-C as complete, Phase D ready to start.

## Existing Plans
- Pass 1 plan: `docs/superpowers/plans/2026-04-16-pass1-foundation.md`
- Pass 3 plan: `docs/superpowers/plans/2026-04-16-pass3-expansion.md`
- UI elevation spec: `docs/superpowers/specs/2026-04-16-ui-elevation-design.md`
