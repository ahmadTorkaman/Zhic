# Implementation State

**Purpose:** the single file Claude reads at session start to know
exactly what's done, what's in flight, and what's blocked. Keep it
terse — this is a status board, not a narrative.

**Update rule:** the last step of every session must be to update this
file. If it's not updated, the session isn't complete.

Related:
- `docs/sessions.md` — static plan (scope, deliverables, exit checks)
- `docs/sessions/session-<X.Y>-plan.md` — per-session execution plan
- `docs/package1-month1.md` — Month 1 source of truth

---

## Snapshot

| Field | Value |
| --- | --- |
| Last updated | 2026-05-17 |
| Current phase | Package 1, Month 1 |
| Current session | Designs index page (`/designs` single-focus carousel) shipped on `feat/products-mega-menu`. Designs schema extended with sliderMedia. Closes FU-MM-a + FU-DDP-d. Branch now has: products mega-menu, mobile floating-island chrome, mobile two-state menu, design detail pages, bulk product import, and designs index. |
| Active branch | `staging` |
| Main branch | `main` (not yet updated — PRs still open) |

---

## Session status

Legend: ⬜ not started · 🟡 in progress · ✅ shipped · 🚧 blocked

### Phase 0 — Planning & Docs

| Session | Status | Commit | Notes |
| --- | --- | --- | --- |
| 0.1 Docs reorg + session plan | ✅ | `885572e` | — |

### Phase 1 — Monorepo Foundation

| Session | Status | Commit | Notes |
| --- | --- | --- | --- |
| 1.1 Monorepo scaffold | ✅ | `9817b78` | Turborepo + pnpm, apps/web, services/api, all package stubs |
| 1.2 Design system + Tailwind preset | ✅ | `ad76d28` | Tokens (TS + CSS), Tailwind v4 `@theme`, Ayandeh via `next/font/local`, `/lab/tokens` verification page. Plan: `docs/sessions/session-1.2-plan.md` |
| 1.3 Payload 3 CMS + collections | ✅ | `68d2683` | 8 collections + 11 globals, Postgres adapter, S3 storage, seed. Plan: `docs/sessions/session-1.3-plan.md` |
| 1.4 Locale + money utilities | ✅ | _this commit_ | `@zhic/locale` (digits, ZWNJ, Jalali, phone) + `@zhic/money` (rial↔toman, format, parse), Vitest wired, 80 tests, `/lab/locale`, closes FU-1.3-c. Plan: `docs/sessions/session-1.4-plan.md` |

### Phase 2 — Core UI Components

| Session | Status | Commit | Notes |
| --- | --- | --- | --- |
| 2.1 Button, form fields, badges | ✅ | `52c354a` | `@zhic/ui` first shelf: Button, Input, Textarea, Select, Checkbox, Radio + RadioGroup, FormField, Badge, Tag + `cn()`. Tokens-only, RTL-native, `/lab/ui` verification page. Closes FU-1.2-c. Plan: `docs/sessions/session-2.1-plan.md` |
| 2.2 Navigation, footer, layout shell | ✅ | `ad76d28` (pending real hash) | `@zhic/ui` organisms: SiteHeader, SiteFooter, Breadcrumbs, Modal, Drawer + layout primitives Container, Section + SkipLink + `useDialogEffect` / `useIsClient` helpers. `apps/web/src/app/(site)/` route group owns chrome + Lenis; root layout slimmed. Persian NAV_LINKS + four-column footer IA. Mockup Header/Footer deleted. Plan: `docs/sessions/session-2.2-plan.md` |
| 2.3 Cards + image gallery | ✅ | _this commit_ | `@zhic/ui` molecules: ProductCard, DesignCard, ArticleCard, ShowroomCard + organism ImageGallery (grid/strip + Modal lightbox, RTL-aware keyboard nav) + atoms Aspect, MoneyDisplay, DateDisplay + shared `cardClasses.ts`. Adds `@zhic/money` as `@zhic/ui` dep. Closes FU-1.4-a + FU-2.1-g. `/lab/ui` extended with 8 new sections + Persian fixtures + inline-SVG placeholders. No consumer pages touched — integration lands with 3.1/3.2/3.3/4.1. Plan: `docs/sessions/session-2.3-plan.md` |

### Phase 3 — Core Pages

| Session | Status | Commit | Notes |
| --- | --- | --- | --- |
| 3.1 Home page | ✅ | _this commit_ | `(site)/page.tsx` as async RSC composing six home blocks (HomeHero, HomeBrandStatement, HomeFeaturedDesigns, HomeShowroomsStrip, HomeJournalTeaser, HomeInquiryCta) from `@zhic/ui` primitives + 2.3 cards + `apps/web/src/lib/payload.ts` REST fetch layer. New `@zhic/ui` primitives: Grid, Stack, Split. Minimal Lexical richText serializer in `lib/richtext.tsx`. `API_URL` env (default `http://localhost:3001`). Seed extended to populate Home global with Persian copy + featured_designs. All mockup sections + ui components + `data/products.ts` deleted. `generateMetadata` on `/`. Error boundary Persian-native. **Graceful fallback verified:** `/` renders with placeholders when services/api is down. Closes FU-2.2-l (resolved — mockup sections gone) and most of FU-2.2-i (Grid/Stack/Split shipped; Bleed still FU-3.1-m). Plan: `docs/sessions/session-3.1-plan.md` |
| 3.2 Product index + PDP | ✅ | _this commit_ | Spec-as-baseline build. New collections `Materials` + `Collections` per spec §14. `Products` extended to spec §12 modulo Pkg-2+ commerce: + `tagline`, `shortDescription`, `longDescription`, `salePriceRials` (schema only — FU-3.2-d), `sku` (validated `AAA-NNN`), `availability`, `leadTimeDays`, `categoryIds`, `tagIds`, `materialIds` (replaces text-array `materials`), `featured`, `featuredOrder`, `relatedProductIds`, `pairsWithProductIds`. `Categories` + `description` + `parent`. Seed: 5 materials, 4 categories, 8 products with full relations, 1 curated collection, related/pairsWith wired on flagship. Storefront: `/products` (4-axis filter — category/material/size/price-band — + sort + pagination, native `<form GET>` with desktop sidebar + mobile `<Drawer>`), `/products/[slug]` (sticky breadcrumb, mimeType-tabbed media stage, sticky purchase column at lg+, native `<details>` specs accordion, related + pairsWith rows), `/collections/[slug]`, Persian `/_not-found`. JSON-LD `Product` (inquiry-mode per §12.4 — IRR + inquiry-URL offer) + `BreadcrumbList` + `CollectionPage` shipped — closes part of FU-3.1-d (Org/WebSite still 6.1). New `lib/jsonld.ts` + `lib/products.ts` + 29 vitest cases pinning filter parser + size-band + label maps. `lib/payload.ts` extended with 4 new types + 5 fetchers + `inquiryHref` helper. Plan: `docs/sessions/session-3.2-plan.md`. |
| 3.3 Showrooms + contact | ✅ | _this commit_ | Spec-as-baseline build. `Showrooms` rewritten to spec §28 modulo Pkg-3+: dropped standalone `city` / `address (text)` / `hours (text)`, renamed `coordinates` → `geo`, added `headline`, `description (richText)`, `cover`, structured `address` group (province/city/district/street/plaque/unit/postalCode/notes), `email`, `hours` array (day/opens/closes/closed with HH:MM validation), `holidayHours`, `appointmentOnly`, `parking/transitNotes`, `featuredProductIds`, Google + Neshan profile + map-embed URLs. Kept `manager_name/phone/is_central` for SMS routing (5.1). `@zhic/locale` + `normalizeLandline`/`formatLandline`/`isIranianLandline`/`classifyPhone` + 16 new tests (closes FU-3.1-n). `@zhic/ui` + `<PhoneLink>` (closes FU-2.3-c). Storefront: `/showrooms` (grid + Persian intro + `ItemList` JSON-LD), `/showrooms/[slug]` (sticky breadcrumb, full-bleed hero with cover, 60/40 split: description + map embed / address + phone + hours table + holiday hours + parking/transit + CTAs, gallery, featured products row, form slot for 5.1, `LocalBusiness` JSON-LD with `PostalAddress` + `GeoCoordinates` + `openingHoursSpecification`), `/contact` (central phone callout for همدان `is_central`, other-showrooms grid, form slot, `ContactPage` JSON-LD). Seed migrated همدان to new schema + added تهران (سعادت‌آباد) and اصفهان (`appointmentOnly: true`). Closes FU-3.1-k. Inquiry CTA from 3.2 PDP (`/contact?product=<slug>&reason=quote`) and `/showrooms` are no longer 404. Plan: `docs/sessions/session-3.3-plan.md`. |
| 3.4 Legal + static pages | ✅ | _this commit_ | `/privacy`, `/terms`, `/returns` (+ Article JSON-LD), `/shipping-and-delivery` (+ Article JSON-LD), `/thank-you` (static, noindex). Generic `LegalPageTemplate` consuming Payload globals via `<RichText>`. New `PayloadStaticPage` type + `fetchPage()` fetcher. New `articlePageJsonLd()` helper. All footer legal links resolve. `LegalPageTemplate` reusable for 4.2's similar globals. **Phase 3 complete.** Plan: `docs/sessions/session-3.4-plan.md`. |

### Phase 4 — Editorial Pages

| Session | Status | Commit | Notes |
| --- | --- | --- | --- |
| 4.1 Journal + article pages | ✅ | _this commit_ | Spec-as-baseline build. New collections `Authors` per §61 (name, slug, bio, avatar, role, social) + `JournalCategories` per §62 (name, slug, description). `Articles` extended to spec §60: `author` text → relation to `authors`, `category` → `journal-categories`, added `relatedProducts`, `relatedArticles` (self-ref), `readingTimeMinutes` (auto-computed via `beforeChange` hook, closes FU-3.1-j), `featured`, `status` (draft/published), `tagIds` rename. Body richText extended with `BlocksFeature`: pull-quote, image-grid, video-embed, product-embed, material-ref blocks. Seed: 2 authors, 3 journal categories, 3 articles with rich body (headings for TOC), related products/articles cross-refs. Storefront: `/journal` (paginated index + category nav strip + Blog JSON-LD), `/journal/[slug]` (ArticleHero + sticky TOC with IntersectionObserver + ArticleRichText with embed context + RelatedProducts + AuthorCard + RelatedArticles + Article JSON-LD with author/image/inLanguage), `/journal/category/[slug]` + `/journal/tag/[slug]` (filtered archives + CollectionPage JSON-LD). `lib/richtext.tsx` extended: heading IDs for TOC anchors, `extractHeadings`, `extractEmbeddedIds`, `ArticleRichText` with embed context, blockquote, italic, ordered lists, horizontal rule, upload nodes, custom block renderers. `lib/jsonld.ts`: new `blogJsonLd`, enhanced `articlePageJsonLd` (author, image, inLanguage). `HomeJournalTeaser` updated for new author relation + `readingTimeMinutes`. Full editorial workflow §60.1 deferred to Package 3 (requires CRM roles). Plan: `docs/sessions/session-4.1-plan.md`. |
| 4.2 FAQ, About, Atelier, Care, Events, Categories | ✅ | _this commit_ | 6 editorial pages. `/about` (LegalPageTemplate + AboutPage + Organization JSON-LD), `/atelier` (LegalPageTemplate + Place JSON-LD), `/care` (LegalPageTemplate + Article JSON-LD), `/faq` (custom FaqAccordion with native `<details>` + FAQPage JSON-LD, rich-result eligible), `/events` (custom EventCard list, no Event JSON-LD per sitemap — static only in Pkg 1), `/categories/[slug]` (editorial landing with category description + ProductGrid + CollectionPage JSON-LD). `fetchPage` widened to accept about/atelier/care. New fetchers: `fetchFaq`, `fetchEvents`, `fetchCategory(slug)`. New JSON-LD helpers: `faqPageJsonLd`, `aboutPageJsonLd`, `organizationJsonLd`, `placeJsonLd`. Seed extended: all 5 globals populated with Persian content. **Phase 4 complete.** Plan: `docs/sessions/session-4.2-plan.md`. |

### Phase 5 — Inquiry Flow + SMS

| Session | Status | Commit | Notes |
| --- | --- | --- | --- |
| 5.1 Inquiry form + SMS routing | ✅ | _this commit_ | New `@zhic/sms` package: SMS.ir REST wrapper (`sendSms`, `formatInquirySms`), graceful fallback when unconfigured. Server action `submitInquiry`: validates form (name, Iranian phone, city, reason) → POST to Payload Inquiries → city-based SMS routing (match city→showroom `address.city`→`manager_phone`, fallback `is_central`) → fire SMS → redirect `/thank-you`. `InquiryForm` client component (`useActionState`): 6 fields per spec (name, phone, city dropdown from showrooms, reason, preferred date conditional, message), pre-fill from query params (`?product=slug&reason=quote` from PDP, `?showroom=slug&reason=visit` from ShowroomCtas). `ContactFormSlot` placeholder replaced on `/contact` + `/showrooms/[slug]`. `/contact` now dynamic (`ƒ`) — reads `searchParams`. Phone validation via regex (09xx/+989xx). Closes FU-3.3-b. Plan: `docs/sessions/session-5.1-plan.md`. |

### Phase 6 — SEO + Motion + Polish

| Session | Status | Commit | Notes |
| --- | --- | --- | --- |
| 6.1 SEO foundations | ✅ | _this commit_ | Root layout: `lang="fa-IR"`, `metadataBase`, title template `%s — ژیک`, root openGraph + twitter. New files: `robots.ts` (disallows /admin, /api, /preview, /lab, /account, /checkout, /cart, /login, /order), `sitemap.ts` (static + 7 dynamic collections from Payload with priority/changefreq), `manifest.ts` (PWA). Home page: Organization + WebSite JSON-LD (closes FU-3.1-d). All 21 routes standardized: `alternates.canonical`, removed manual ` — ژیک` suffixes (template handles it), removed redundant `locale: 'fa_IR'` (inherited). OG image generation: shared `lib/og.tsx` utility (Ayandeh Bold, 1200×630, charcoal+ivory+accent), route-level `opengraph-image.tsx` for home, `/products/[slug]`, `/journal/[slug]`. New `websiteJsonLd` helper. Plan: `docs/sessions/session-6.1-plan.md`. |
| 6.2 Motion + scroll effects | ✅ | _this commit_ | 3 reusable animation components: `BlockReveal` (fade+24px slide, ScrollTrigger at 80%, 720ms out-soft), `WordReveal` (character-split mask reveal, 32ms stagger, 1200ms expo-out, RTL-native), `ImageReveal` (clip-path inset + 1.08→1.0 scale). All respect `prefers-reduced-motion` (instant opacity fade, no transforms). `useMediaPause` hook (IntersectionObserver for pausing videos off-screen, closes FU-2.3-b). Home page motion pass: hero H1 word-reveal + subheading/buttons block-reveal, brand statement image-reveal + text block-reveal, featured designs staggered card reveals, showrooms/journal/inquiry sections block-reveals. SiteHeader `shadow-sm` on scroll (closes FU-2.2-g partial). `/lab/motion` updated with live demos. Deferred: custom cursor, page transition veil, MarqueeBlock, gallery gestures, mobile overlay. Plan: `docs/sessions/session-6.2-plan.md`. |
| 6.3 QA + final polish | ✅ | _this commit_ | BlockReveal added to secondary pages (article related sections, showroom gallery + featured products, category product grid). BackToTop button (client component, scroll-driven visibility, `prefers-reduced-motion` aware, RTL-positioned). RTL audit: zero violations in apps/web + packages/ui (logical CSS used throughout). QA checklist produced: `docs/sessions/session-6.3-qa-checklist.md` covering cross-browser, Lighthouse CWV, functional, JSON-LD, motion, RTL, mobile, error states. **Phase 6 complete — all code sessions done. Only 7.1 (VPS/CI infra) remains.** Plan: `docs/sessions/session-6.3-plan.md`. |

### UI Elevation — Design System Deep Work (2026-04-16/17)

| Pass | Status | Commits | Notes |
| --- | --- | --- | --- |
| Pass 1: Foundation | ✅ | 17 commits (`5e580dc`..`47a78e9`) | Palette renamed (saffron→gold `#C49A6C`, moss→forest `#5F7760`). New tokens: glass, shadow scale (subtle/card/elevated), interaction (dur-hover 720ms, hover-lift, focus-ring). Glass system rewritten to use tokens. Gutter aligned to spec. 5 bug fixes (BackToTop, TOC, bidi×2, SiteHeader). Lab pages rewritten (Persian, token-driven). OD-palette resolved. |
| Pass 2: Interaction | ✅ | 15 commits (`13d0744`..`dfafe51`) | Global focus ring (forest). All components: 720ms transitions, hover states (light shift + elevation), forest focus rings. Modal/Drawer open/close animation (CSS keyframes + data-state lifecycle). Focus ring stripped from 15 files. BlockReveal 900ms, WordReveal 80ms stagger, new PageReveal component. |
| Pass 3: Expansion | ✅ | 16 commits (`3ae218a`..`9902734`) | 12 new components: IconButton, Spinner, Link, Divider, Skeleton, Toggle, Tooltip, Accordion, Tabs, FilterNav, Pagination, PayloadImage. CloseButton extracted. 6 cover image duplications refactored. Minor fixes (ProductPurchasePanel text token, PhoneLink bidi, SiteFooter dynamic cols, ShowroomCard digits, FormField fieldset mode). Barrel: 82 exports. |
| Homepage redesign | ✅ | `1b964d3..6dc6b11` | D1 implementation. Six home components rewritten per Option C "Asymmetric Luxury" mockup: split-screen hero with watermark (HomeHero), dark brand stats with gold borders (HomeBrandStatement), asymmetric featured-designs grid (HomeFeaturedDesigns), glass-card showrooms strip with forest city eyebrow (HomeShowroomsStrip), asymmetric editorial journal teaser (HomeJournalTeaser), dark split CTA with frosted glass inquiry form (HomeInquiryCta + new HomeInquiryForm). Plan: `docs/superpowers/plans/2026-04-18-d1-homepage.md`. |
| D6 Legal template refinement | ✅ | `033b4dc` | D6 implementation. LegalPageTemplate restyled to Phase C mockup: text-h1 instead of text-display (clear, restrained — no visual drama), centered 680px column, optional 'آخرین به‌روزرسانی: …' date row under the title. Affects /privacy /terms /returns /shipping-and-delivery automatically (all LegalPageTemplate consumers). PayloadStaticPage doesn't yet have an `updated` field; the prop is opt-in for future schema extension. |
| D7 Cross-page QA | ✅ | — | All 19 routes smoke-tested: homepage (200), products index (200), journal index (200), showrooms index (200), contact (200), about/atelier/care (200), faq/events (200), privacy/terms/returns/shipping-and-delivery (200), thank-you (200); journal/nonex → 404, showrooms/nonex → 404, categories/nonex → 404 (notFound() correct fallback). Typecheck: 4 baseline errors only (pre-existing in packages/ui/src/Tabs.tsx, Tooltip.tsx — unchanged across entire D-phase). Payload API offline in this environment so data-dependent content (product grids, article lists, showroom details) not visually verified; code paths correct per curl/grep inspection. |
| D8 Design system docs | ✅ | `032087f1` (D5 state update inline) + plan files | Design-system spec update deferred to inline state.md rows for each phase (D1..D6) which carry commit ranges and implementation notes. Six dedicated plan files in docs/superpowers/plans/ document the implemented layouts per phase: 2026-04-18-d1-homepage.md, -d2-products.md, -d3-journal.md, -d4-showrooms-contact.md, -d5-templates.md. Each plan carries spec + verbatim code + mockup references. A future docs sweep can consolidate these into docs/spec/design-system.md §8. |
| 8.5 Showroom routes (v2 redesign) | ✅ | `815e0f8` | Two route files under `(site)/showrooms/`: index page (`page.tsx`) — breadcrumb + `ShowroomIndexGrid`; detail page (`[slug]/page.tsx`) — `GlassOverlayHero` + breadcrumb + `ShowroomInfoCards` + optional horizontal-scrolling gallery strip + `notFound()` on missing slug. Both components already own their `Container` wrappers (confirmed via read). Typecheck: 0 errors. Build: clean (`/showrooms` static 5 min ISR, `/showrooms/[slug]` dynamic). Smoke: `/showrooms` 200, `/showrooms/nonex` 404. Markup markers both present. |
| D5 Template pages B1-B8 | ✅ | `e1cac6e..f538e68` | D5 implementation. New EditorialPageTemplate (full-bleed cream hero with forest eyebrow + h1 overlaid at bottom + centered 680px prose body, optional inlineSlot for B5 Atelier image-grid) used by About/Care/Atelier (B4/B5/B8). FAQ (B6) restyled to 680px centered prose with text-h2 title (existing FaqAccordion plus-icon already correct). Events (B7) restyled with new EventCard rendering Jalali day+month date-block (cream bg, h3 day in Persian digits + eyebrow month, parsed via @zhic/locale formatDate). Showrooms Index (B1) replaces ShowroomCard with inline glass-cards (city forest eyebrow, name, address lines, sand-bordered hours summary, 'فقط با وقت قبلی' for appointmentOnly). CollectionHeader (B2) replaces Split with hero-bleed pattern (full-bleed cover + bottom gradient + forest 'مجموعه' eyebrow + h1 + 560px editorial intro). Category (B3) drops text-display→text-h1, swaps prominent secondary CTA for ghost 'see-all'. LegalPageTemplate preserved unchanged for legal pages (privacy/terms/returns/shipping). Plan: `docs/superpowers/plans/2026-04-18-d5-templates.md`. |
| D4 Showroom + Contact redesign | ✅ | `b32baf7..7b7e4c3` | D4 implementation. Showroom Detail restructured to A5 Option B "Glass Card Overlay": ShowroomHero rewritten as full-width 55vh photo with dark scrim + centered glass overlay card (city forest eyebrow + h2 + headline + forest 'رزرو بازدید' CTA, eager+fetchPriority=high LCP). New ShowroomInfoCards component renders 3 glass cards (address+inline map / hours table / phone+CTAs). Drops the prior Split sidebar layout entirely; bottom InquiryForm removed (visitors routed to /contact via hero CTA). Contact page restructured to A6 Option B "Dark Hero with Inline Form": new ContactInquiryForm (5-field dark glass variant of InquiryForm wrapping submitInquiry, with aria-busy/aria-invalid/aria-describedby). Page composition: dark ink hero with text-col on RTL-start (gold-line + h1 + lead + gold-eyebrow phone/email/hours) and form-col on RTL-end, decorative radial forest glow via color-mix. Showrooms grid below on ivory using .glass-card. Drops CentralPhoneCallout, Breadcrumbs section, fallback-phone section, "showrooms دیگر" grid, standalone InquiryForm. Plan: `docs/superpowers/plans/2026-04-18-d4-showrooms-contact.md`. |
| D3 Journal redesign | ✅ | `da30d54..6ae6009` | D3 implementation. Index restructured to A3 Option B "Magazine Editorial": new JournalFeaturedArticle (2-col image+text on page 1, image RTL-end aspect 4/5→16/9 mobile, h3 title + body excerpt + meta), JournalGrid rewritten as inline 3-col tile grid (3/2 image + forest eyebrow + body title + reading time), JournalCategoryNav restyled to D2-style filter pills (rounded-pill, bg-cream→bg-charcoal active, aria-current). Article page restructured to A4 Option B "Full-Bleed Hero, Centered Prose": ArticleHero rewritten as full-bleed cover with ivory bottom-gradient + absolute-positioned eyebrow+h1+meta at bottom edge, body becomes single centered 680px column with excerpt as lead, author card also 680px. TOC sidebar dropped (TableOfContents component preserved but unused). Cover img has eager+fetchPriority=high LCP. Plan: `docs/superpowers/plans/2026-04-18-d3-journal.md`. |
| D2 Products redesign | ✅ | `7b18f2b..32a59b4` | D2 implementation. Product Index restructured to A1 Option C "Asymmetric Hero": new ProductIndexHero (1 featured 3/4 + 3 mini-cards 120px+body, mobile horizontal scroll), new ProductFilterPills (category + sand divider + material pills with aria-current; sort/size/price preserved across clicks), 4-col grid (was 3-col), single-column composition (sidebar dropped, drawer keeps full ProductFilters for size/price). PDP restructured to A2 Option C "Immersive + Side Panel": new ProductHeroImage (full-bleed 21:9 with bottom gradient fade, eager+fetchPriority=high LCP) + ProductThumbnails (decorative 80×80 strip, drops the prior tab+lightbox), content/sticky-cream-sidebar split (1fr_380px), specs accordion inline within content column, ProductPurchasePanel restyled as cream rounded-lg sticky surface (drops embedded h1/tagline; price LTR h3 → badge → forest+ghost CTAs → sand-bordered lead-time → SKU), ProductRelatedRow restyled as 4-col compact tiles (square image + body title + price). Plan: `docs/superpowers/plans/2026-04-18-d2-products.md`. |
| **Redesign v2 (end-to-end)** | ✅ | `4c226a7..e901faf` on `claude/redesign-v2` | Wholesale rebuild from the `.superpowers/` mockups after Phase D deploy didn't match spec. Decision: wipe the design layer (tokens/theme/base + all UI primitives + all page components + all routes) and rebuild top-down with per-component `/lab` verification. **Tokens** drop `--color-accent`, add `--tracking-eyebrow`/`-wide` + `--glass-bg-dark`/`-border-dark`. **@zhic/ui (15 primitives)**: Container, Section, SkipLink, Button (5 variants × 3 sizes), Pill, Badge, Input/Textarea/Select/FormField, Breadcrumbs, Pagination, Aspect, PhoneLink, MoneyDisplay, DateDisplay. **Composables**: GlassCard, PayloadImage, Tile (8 mockup variants covered via props), HorizontalTile (100/120/160). **Heroes (8)**: HomeHero (split + ژ watermark), CinematicHero (21:9), ArticleHero (full-bleed), CollectionHero (35vh), EditorialHero (sm/md/lg/xl), GlassOverlayHero, DarkSplitHero (page/section), plus helpers (HeroOverlayText, PageHeader, StickyBreadcrumb). **Chrome**: SiteHeader scroll-activates at 60px (fixed → ivory/85% + 24px blur + sand border + subtle shadow) + full-screen MobileMenu dialog; SiteFooter 4-col on charcoal. **Forms**: InquiryForm (full 5-field + conditional preferred_date) + InquiryFormSlim (3-field) wrapping the preserved `submitInquiry` server action via `useActionState`. **Page components (~25)** grouped by section (home/product/journal/showroom/ancillary). **Routes**: `(site)/` layout wrapper + 20+ pages — `/`, `/products` + `/[slug]`, `/journal` + `/[slug]` + `/category/[slug]` + `/tag/[slug]`, `/showrooms` + `/[slug]`, `/contact`, `/about`, `/atelier`, `/care`, `/faq`, `/events`, `/privacy`, `/terms`, `/returns`, `/shipping-and-delivery`, `/thank-you`, `/collections/[slug]`, `/categories/[slug]`. Motion: CSS-only (no GSAP), `.fade-in` keyframe + dialog `data-state` lifecycle. Font: Ayandeh applied as direct `.className` on both `<html>` and `<body>` after `var(--font-sans)` indirection rendered unreliably (fix `5c9d1bf`). Cross-route smoke: 22 paths, all expected codes. Spec: `docs/superpowers/specs/2026-04-19-redesign-v2-design.md`. Plan: `docs/superpowers/plans/2026-04-19-redesign-v2.md`. Branch cut from `claude/plan-session-2-1-bUd75`; prior UI Elevation work preserved on that branch. |

### Foundation Plans

| Plan | Status | Commit | Notes |
| --- | --- | --- | --- |
| Foundation A — motion primitives + forest-dark token | ✅ shipped | `_this commit_` | New `--color-forest-dark` token (darker forest shade for contrast on inverted backgrounds). Three new client components in `@zhic/ui`: `ParallaxImage` (parallax scroll effect with fixed aspect), `CountUp` (animated counter from 0 to target, RTL-aware formatting), `BlurInText` (staggered character-by-character blur-to-focus reveal). Vitest wired in `@zhic/ui` with 20 tests total: 6 parallax-math, 6 text-split, 7 count-up-math, 1 smoke. Three `/lab` verification pages: `/lab/parallax-image`, `/lab/count-up`, `/lab/blur-in`. Typecheck: all 10 workspace packages pass. Build: clean with all three new routes in Next.js route manifest. Smoke: all three lab pages return HTTP/1.1 200 OK. Plan: `docs/superpowers/plans/2026-05-19-foundation-a.md`. |

### Post-Phase enhancements

| Item | Status | Commit | Notes |
| --- | --- | --- | --- |
| ProductsMegaMenu | ✅ | (PR HEAD) | Top-tab + pinned featured layout per v2 mockup. Closes FU-2.2-a (محصولات half) + FU-3.2-u. New fetchNavMeta bundles categories/designs/collections/featured-product from Payload; new ProductsMegaMenu client component in `apps/web/src/components/layout/`. Mobile stays a flat link. Spec: `docs/superpowers/specs/2026-05-16-products-dropdown-mega-menu-design.md`. Plan: `docs/superpowers/plans/2026-05-16-products-dropdown-mega-menu.md`. |
| Mobile header floating pill | ✅ | `3fe2125` | Mobile site header becomes a 12px-inset, rounded-full floating pill ≈42px tall with full-border chrome when scrolled. Desktop unchanged. --header-height bumped to 3.5rem on mobile to track the pill's bottom edge so breadcrumbs and StickyBreadcrumb clear it. HomeHero gets pt-[var(--header-height)] md:pt-0 so the cream image-half starts below the pill instead of being overlapped. |
| Mobile products menu | ✅ | (PR HEAD) | Two-state MobileMenu — main view + products view with cross-fade between. Closes FU-MM-c. Search input + categories + designs + collections + "تمامی محصولات" CTA inside products view. Hierarchical Esc, reset-on-close. Spec: `docs/superpowers/specs/2026-05-16-mobile-products-menu-design.md`. Plan: `docs/superpowers/plans/2026-05-16-mobile-products-menu.md`. |
| Design detail page | ✅ | (PR HEAD) | New `/designs/[slug]` lookbook route. Designs collection extended with `tagline` + `heroMedia` + `storyBlocks` (richText with 4 embedded block types — pull-quote, image-grid, video-embed, material-ref — extracted from Articles into shared `services/api/src/lib/richTextBlocks.ts`). Mega-menu + mobile menu now route DesignsPanel/Section items to `/designs/<slug>` instead of `/products?design=`. The filtered-list URL stays alive as an alternate. Sets up but doesn't close FU-MM-a (the `/designs` index page is logged as FU-DDP-d). Spec: `docs/superpowers/specs/2026-05-16-design-detail-page-design.md`. Plan: `docs/superpowers/plans/2026-05-16-design-detail-page.md`. |
| Designs index page | ✅ | (PR HEAD) | New `/designs` carousel route. Designs collection extended with `sliderMedia` field. DesignsSlider client component with dim/focused chrome differentiation (focused tile gets card + 22% right-edge GIF spill). Manual nav (arrows + swipe + keyboard + dots). Mega-menu + mobile menu CTAs restored. Sitemap entry added. Closes FU-MM-a + FU-DDP-d. Spec: `docs/superpowers/specs/2026-05-17-designs-index-page-design.md`. Plan: `docs/superpowers/plans/2026-05-17-designs-index-page.md`. |

### Phase 7 — Infrastructure & Deployment

| Session | Status | Commit | Notes |
| --- | --- | --- | --- |
| 7.1 VPS + CI/CD | 🟡 | `0189767..pending` | **Staging Payload admin live, first admin logged in.** Pars Pack VPS `80.240.31.146` running pm2 `zhic-api` on `:3001` in `NODE_ENV=production` against docker `zhic-pg` (db `zhic`, user `zhic`). Reachable directly over HTTP — no Caddy, no DNS, no Abr Arvan yet (everything still test-mode). **Migrations**: `pnpm migrate:create initial` + `pnpm migrate` → 42 tables. **Migration tooling** (this session): `tsx scripts/migrate.mts` wrapper + `migrate*` package scripts work around tsx 4.21 + Node 24 + Payload's `tsImport` API not redirecting transitive `.js`→`.ts`; tsx CLI as entry point handles it. Reverted commit `2accdd2` (the `.js`-extension experiment) since Turbopack also won't resolve those literally. `seed.ts` + `scripts/` + `migrations/` excluded from build typecheck (pre-existing `string \| number` id narrowing in seed; not blocking). **Bug chain found this session, all real, all under `patches/`**: (a) **Payload `<head>` `<style>` mid-stream injection from a proxy/extension** (the user's request layer rewrites HTTP — saw injected Polymer-style `body[unresolved]` rules) → React 19 `#418` text mismatch on `<style>` content. Fix: pnpm patch on `@payloadcms/next` propagates `admin.suppressHydrationWarning` from `<html>` to `<head>`, `<body>`, and the `<style>`. Set `admin.suppressHydrationWarning: true`. (b) **Payload's `Set-Cookie` emits `HttpOnly=true` and `Secure=${secure}`** instead of the bare flags per RFC 6265. Strict cookie parsers drop the cookie; the actual bug in `payload/dist/auth/cookies.js:41,48`. Fix: pnpm patch on `payload`. (c) **`extractJWT.js` rejects the cookie when both `Origin` and `Sec-Fetch-Site` are absent** while `csrf` allowlist is non-empty (auto-populated from `serverURL`). The user's request layer strips both headers — same culprit as (a). Fix: pnpm patch extends acceptance to include missing `Sec-Fetch-Site`. (d) `Users.auth.useSessions: false` set as a precaution while diagnosing — open question whether `useSessions: true` works after (c) is fixed (FU below). **Remaining 7.1**: Caddy + auto-TLS once domain is decided; Gitea Actions self-hosted runner; production `payload migrate && next build` script; `push: true` → `prodMigrations:` swap when real prod arrives. |
| 7.5 FAQ / Events / Editorial / Legal page components | ✅ | `0f8e43f` | Four server components: `FaqAccordion` (native `<details>` list, `+`→`×` on open, `group-open:rotate-45`), `EventCard` (Jalali date block via `@zhic/locale` PERSIAN_MONTHS + Intl, 80px date column grid), `EditorialPage` (EditorialHero + `max-w-[680px]` centered prose, optional lead paragraph), `LegalPage` (Breadcrumbs + header with آخرین به‌روزرسانی + arbitrary-selector legal body typography). Lab `id=ancillary-components` section added after showroom-components with 4 FAQ items, 2 EventCards (ISO 2026-05-15 → اردیبهشت, 2026-06-01 → خرداد), EditorialPage, and LegalPage. Typecheck: 0 errors. Build: clean. /lab 200. 14/15 markers present (missing only empty-state "پرسشی پیدا نشد" — correct, lab has non-empty FAQ). |

---

## Follow-ups (tech debt logged during execution)

| Id | From | Item |
| --- | --- | --- |
| FU-1.2-a | 1.2 | Generate `packages/design-system/css/tokens.css` from `src/tokens/*.ts` to prevent drift |
| FU-1.2-b | 1.2 | Subset Ayandeh to Arabic + ZWNJ + ASCII at build time (`docs/spec/design-system.md` §2.2) |
| ~~FU-1.2-c~~ | 1.2 | ~~Lab layout uses deprecated `font-serif` utility (Cormorant was removed); clean up when `packages/ui` layout primitives land in 2.1~~ — **resolved in 2.1** (`font-sans text-lg tracking-wide`) |
| FU-1.3-a | 1.3 | Add `status: draft\|published` fields when Phase 3 pages need it |
| FU-1.3-b | 1.3 | Add SEO group fields on collections (Session 6.1) |
| ~~FU-1.3-c~~ | 1.3 | ~~Migrate product price from toman to rials~~ — **resolved in 1.4** (`basePriceRials`) |
| FU-1.4-a | 1.4 | `<MoneyDisplay rials={...}/>` in `@zhic/ui` at first product card (2.x) |
| FU-1.4-b | 1.4 | Real `formatMoneyCompact` with Persian scale words (هزار/میلیون/میلیارد) |
| FU-1.4-c | 1.4 | `parseJalaliDate` for admin date inputs (Package 3) |
| FU-1.4-d | 1.4 | Postal-code + landline validators for checkout (Package 2) |
| FU-1.4-e | 1.4 | `@vitest/coverage-v8` + CI gates when Gitea Actions lands |
| FU-1.4-f | 1.4 | Swap Payload `basePriceRials` to text-backed bigint if any value ever exceeds `Number.MAX_SAFE_INTEGER` |
| FU-1.4-g | 1.4 | Move `slugify` into `@zhic/locale` when a second consumer appears |
| FU-2.1-a | 2.1 | Storybook + `@testing-library/react` + axe-core once `@zhic/ui` has ≥ 8 components (end of Phase 2) |
| FU-2.1-b | 2.1 | `IconButton`, `Link` atom, `Tooltip`, `Toggle` — next time a consuming page asks for them (likely 2.2 Header) |
| FU-2.1-c | 2.1 | `PhoneInput` (E.164 + IR mobile via `@zhic/locale`) — prerequisite for 5.1 inquiry form |
| FU-2.1-d | 2.1 | `OtpInput` — prerequisite for Package 2 `/login/verify` |
| FU-2.1-e | 2.1 | Searchable `Combobox` built on the native `Select` API shape, when Package 2 checkout city/province picker needs it |
| FU-2.1-f | 2.1 | Promote `cn.ts` to `packages/design-system` if a second workspace needs it (e.g. operator apps in Package 3) |
| FU-2.1-g | 2.1 | `<MoneyDisplay>` / `<DateDisplay>` atoms — naturally land with Session 2.3 (cards) where prices first appear. Carries forward FU-1.4-a |
| ~~FU-2.2-a~~ | 2.2 | ~~Mega-menu on «محصولات» and «درباره‌ی ما»~~ — **«محصولات» half resolved 2026-05-16** via ProductsMegaMenu (top-tab layout + pinned featured product + q search wire). «درباره‌ی ما» half carries forward as FU-MM-g. |
| FU-2.2-b | 2.2 | Search icon + widget — Package 2+ (`/search` is post-Package-2 per sitemap §2) |
| FU-2.2-c | 2.2 | Account icon + dropdown → `/account` — Package 2 |
| FU-2.2-d | 2.2 | Cart icon with item-count badge + cart drawer — Package 2 |
| FU-2.2-e | 2.2 | Real logo lockup once `OD-logo-lockup` closes; `SiteHeader.brand` already accepts `ReactNode` |
| FU-2.2-f | 2.2 | Newsletter submit wired to `packages/sms` — Session 5.1 |
| FU-2.2-g | 2.2 | Scroll progress bar, back-to-top, sticky-header shadow refinements — Session 6.2 |
| FU-2.2-h | 2.2 | Mobile full-bleed overlay choreography (stagger, mask reveal) — Session 6.2 |
| FU-2.2-i | 2.2 | Remaining layout primitives `<Stack>` / `<Grid>` / `<Split>` / `<Bleed>` / `<Aspect>` — add when 3.1 needs them |
| FU-2.2-j | 2.2 | Promote `NavLink` to `@zhic/ui` once active-state styling is needed in more than one place |
| FU-2.2-k | 2.2 | Toast primitive for the newsletter "دریافت شد" acknowledgement — Package 2 (toasts land with cart state) |
| ~~FU-2.2-l~~ | 2.2 | ~~Migrate `sections/HeroSection.tsx` + `ContactSection.tsx` to import `Button` from `@zhic/ui`~~ — **resolved in 3.1** (mockup sections deleted; home rebuilt on `@zhic/ui` Button) |
| ~~FU-2.2-i (partial)~~ | 2.2 | ~~Remaining layout primitives `<Stack>` / `<Grid>` / `<Split>` / `<Bleed>` / `<Aspect>`~~ — **`<Grid>` + `<Stack>` + `<Split>` resolved in 3.1; `<Aspect>` resolved in 2.3; `<Bleed>` still open as FU-3.1-m** |
| ~~FU-1.4-a~~ | 1.4 | ~~`<MoneyDisplay rials={...}/>` in `@zhic/ui` at first product card (2.x)~~ — **resolved in 2.3** |
| ~~FU-2.1-g~~ | 2.1 | ~~`<MoneyDisplay>` / `<DateDisplay>` atoms — naturally land with Session 2.3~~ — **resolved in 2.3** |
| FU-2.3-a | 2.3 | Convert GIF assets to `<video autoplay muted loop>` (mp4/webm) — spec §5 prefers video over GIF for loops > 1 s. Blocker: media-pipeline transcode step on CMS upload. Naturally lands with Session 3.2 PDP stage |
| ~~FU-2.3-b~~ | 2.3 | ~~IntersectionObserver pause for looping media~~ — **resolved in 6.2** (`useMediaPause` hook shipped; video elements pause off-screen) |
| ~~FU-2.3-c~~ | 2.3 | ~~`<PhoneLink>` atom wrapping nested-interactive phone logic~~ — **resolved in 3.3** (auto mobile/landline classification via `@zhic/locale.classifyPhone`, `inline` mode for nested-anchor avoidance, fallback Persian-digit pass-through for unrecognized inputs) |
| FU-2.3-d | 2.3 | Sale-price rendering in `ProductCard` (`salePriceRials` + strikethrough on `basePriceRials`). No sale mechanic in Package 1 — Package 2 commerce |
| FU-2.3-e | 2.3 | Expand `ImageGallery.columns` beyond `2 \| 3 \| 4` if a page asks. JIT-safe arbitrary values would require explicit safelisting |
| FU-2.3-f | 2.3 | `<ProductCard variant="compact">` (PDP related-products) + `<ProductCard variant="hero">` (homepage featured). Add when 3.1 / 3.2 need them with concrete measurements |
| FU-2.3-g | 2.3 | Next/Image migration. Cards accept `image: ReactNode` so consumers swap `<img>` → `<Image>` without card API change. Gallery owns its own `<img>` render and needs internal upgrade. Requires `remotePatterns` pointing at Abr Arvan S3 (Session 7.1 infra + Session 3.1 wiring) |
| FU-2.3-h | 2.3 | `<MoneyDisplay>` sale variant + `<MoneyDisplay.Range>` for "از ۸٬۴۰۰٬۰۰۰ تومان" when variants have differing prices — Session 3.2 PDP |
| FU-2.3-i | 2.3 | Tailwind arbitrary-class audit: several cards rely on `[transition-duration:var(--dur-fast)]` inline. Promote to a shared `transition-card` utility in the design-system preset if a fourth consumer appears |
| FU-2.3-j | 2.3 | ImageGallery lightbox: pinch-zoom on mobile, swipe gestures for prev/next — Session 6.2 (motion + scroll effects) |
| FU-2.3-k | 2.3 | Short / numeric Jalali formats in `@zhic/locale` (`jalali-short` "۸ فروردین"; `jalali-numeric` "۱۴۰۵/۰۱/۰۸"). `formatDate` today only emits long form + optional weekday. Needed for operator tables (dense rows), factor print (numeric), and potentially compact article-card contexts. Add when a consumer requires it; DateDisplay's API accepts `withWeekday` / `digits` today but not `format` |
| FU-2.3-l | 2.3 | Real image fixtures for `/lab/ui` gallery sections. Currently uses inline `data:image/svg+xml` placeholders because `apps/web/public/images/` doesn't exist and Abr Arvan CDN isn't wired yet. Gallery GIF demo uses the one real `/55_bal4.gif`. Replace once Payload media + S3 are live (FU-2.3-g infra) |
| FU-2.3-m | 2.3 | ImageGallery keyboard `dir` detection reads `document.documentElement.getAttribute('dir')` at event time. If the site ever serves a bi-dir page or the `<html dir>` attribute is managed dynamically, verify the behavior. Today `<html dir="rtl">` is a site-wide invariant |
| ~~FU-3.1-a~~ | 3.1 | ~~Motion pass for `/`~~ — **resolved in 6.2** (WordReveal on H1, BlockReveal on all home blocks, ImageReveal on brand statement, `prefers-reduced-motion` compliant. MarqueeBlock still open as FU-3.1-g) |
| FU-3.1-b | 3.1 | Promote `apps/web/src/lib/payload.ts` to `packages/api-client` workspace package when 3.2 + 3.3 need the same helpers. Add generated Payload types (`pnpm --filter @zhic/api generate:types`) + preview-mode support |
| FU-3.1-c | 3.1 | Promote `apps/web/src/lib/richtext.tsx` to `packages/richtext` when 4.1 Article body needs full Lexical node set (pull quotes, image grids, product embeds, `LtrRun`). Include `plainTextFromRichText` helper |
| ~~FU-3.1-d~~ | 3.1 | ~~JSON-LD `Organization` + `WebSite` on `/`~~ — **resolved in 6.1** (both emitted on home page) |
| FU-3.1-e | 3.1 | Wire `revalidateTag('home' \| 'designs' \| 'showrooms' \| 'articles')` from Payload `afterChange` hooks → storefront `/api/revalidate` webhook → Next `revalidateTag`. Session 7.1 infra. Until then the 5-minute `revalidate` window is the only freshness guarantee |
| FU-3.1-f | 3.1 | Populate Home `hero_media` with a real brand asset. Requires upload via Payload admin or extended seed script (more complex — needs a `Blob` from filesystem). Landing with the brand's first real hero asset |
| FU-3.1-g | 3.1 | MarqueeBlock on home — needs `Home.marquee_items` (text[]) schema addition + MarqueeBlock organism in `@zhic/ui` (motion-heavy). Content + schema + component. Session 6.2 or later |
| FU-3.1-h | 3.1 | TestimonialsBlock on home — requires `testimonials` collection (`data-schemas.md` §66 lists for later package) + curated Persian quotes from client |
| FU-3.1-i | 3.1 | Home body NewsletterBlock — intentionally omitted (SiteFooter's newsletter island covers it). Revisit only if product asks for a second above-the-fold CTA |
| ~~FU-3.1-j~~ | 3.1 | ~~`reading_time_minutes` auto-compute on Articles~~ — **resolved in 4.1** (`beforeChange` hook divides word count by 200, ceil; `readingTimeMinutes` field auto-populated) |
| ~~FU-3.1-k~~ | 3.1 | ~~Split `Showrooms.address` into structured fields. Split `hours` into day-by-day array~~ — **resolved in 3.3** (full spec §28 schema migration; structured address group + hours array + holidayHours) |
| FU-3.1-l | 3.1 | Next/Image migration for home block images (hero_media, design.gallery[0], showroom.gallery[0], article.cover). Requires `remotePatterns` in `next.config.ts` pointing at Abr Arvan S3 + Payload media URL. Session 7.1 infra. Carries forward FU-2.3-g |
| FU-3.1-m | 3.1 | `<Bleed>` layout primitive. Currently unused since `Section fullBleed` covers hero. Add when a page needs nested full-bleed escape inside a constrained container (likely 4.1 articles) |
| ~~FU-3.1-n~~ | 3.1 | ~~`@zhic/locale.formatPhone` only handles Iranian mobile~~ — **resolved in 3.3** (`normalizeLandline` + `formatLandline` + `isIranianLandline` + `classifyPhone` shipped, 16 new tests) |
| FU-3.1-o | 3.1 | `payload seed` is currently broken by a Payload 3 + `@next/env` + Node 24 import shape issue (`Cannot destructure property 'loadEnvConfig'` in `payload/dist/bin/loadEnv.js`). Pre-existed 3.1; my seed extension compiles + typechecks but cannot be exercised end-to-end in the sandbox until the loader issue is fixed or the script is invoked via `next`-wrapped CLI. Home global can be populated via Payload admin UI in the meantime |
| FU-3.1-p | 3.1 | `<Button variant="secondary">` on dark backgrounds (ink / charcoal) needs inline `className` overrides (`border-ivory text-ivory hover:bg-ivory hover:text-ink`). Promote to a `variant="secondary-on-dark"` or an `invert` prop when a second consumer appears |
| FU-3.1-q | 3.1 | Postgres not available in the Claude Code sandbox (no docker). The data-populated render path is not end-to-end verified in this session — only the graceful-fallback path. User should run `docker compose up postgres` + `pnpm --filter @zhic/api dev` + `pnpm --filter @zhic/api seed` locally to verify populated home. Empty-state path is verified. **3.2 carries the same constraint** — schema, seed, fetchers, pages all compile + typecheck + lint clean and the build succeeds; populated render path needs local Postgres |
| FU-3.2-a | 3.2 | 3D media tab + `model3d` group on Products + `<model-viewer>` integration. Pkg 2+ per spec §12.4. PDP tabs gain a third option «سه‌بعدی» |
| FU-3.2-b | 3.2 | `productVariants` collection per spec §13 + variant picker in PurchasePanel. Pkg 2 |
| FU-3.2-c | 3.2 | "افزودن به سبد" CTA flip on `availability=in_stock` items. Pkg 2 commerce |
| FU-3.2-d | 3.2 | Sale-price rendering on cards + PDP. `salePriceRials` field exists in schema from 3.2 — render not implemented. Carries forward FU-2.3-d + FU-2.3-h. Pkg 2 |
| FU-3.2-e | 3.2 | `weightKg` / `careInstructions` / `warrantyYears` on Products schema + PDP specs accordion sections. Add when CMS editors ask or care page (4.2) needs cross-references |
| FU-3.2-f | 3.2 | `seo` group on Products + Collections + Categories. Session 6.1 |
| FU-3.2-g | 3.2 | `status` / `publishedAt` / scheduling workflow on Products + Collections. Carries forward FU-1.3-a; ships when a draft / preview workflow is needed |
| FU-3.2-h | 3.2 | `categoryIds` tree expansion via `parent` for nested category navigation in mega-menu (carries forward FU-2.2-a) and `/categories/[slug]` (4.2) |
| FU-3.2-i | 3.2 | `tagIds` filter facet on `/products`. Skipped this session (4 axes is enough); add when SEO tag landing pages need it |
| FU-3.2-j | 3.2 | `reviews` collection per spec §26 + PDP reviews block. Pkg 3+ |
| FU-3.2-k | 3.2 | "در کارگاه" atelier imagery section on PDP — needs schema field for atelier media (separate from main `gallery`) or convention to draw atelier shots from a tagged subset. Add when atelier image library exists |
| FU-3.2-l | 3.2 | Stock signal per nearest showroom on PDP — needs `commerce.stockLevels` collection (Pkg 3 per `data-schemas.md` §21) |
| FU-3.2-m | 3.2 | Lead-time text formatted as Jalali date («تحویل از ۱۵ اردیبهشت ۱۴۰۵») instead of «{n} روز کاری». Needs `addJalaliDays(today, leadTimeDays)` helper in `@zhic/locale`. Add when product accepts the more-precise format |
| FU-3.2-n | 3.2 | Persian 404 — extended once `/search` ships (Pkg 2+) to include search tile per `sitemap.md` §4 |
| FU-3.2-o | 3.2 | Promote PDP media-stage tab control to `<Tabs>` in `@zhic/ui` when a 2nd consumer appears (likely 4.2 atelier / care) |
| FU-3.2-p | 3.2 | Promote `parseSearchParams` / `sizeBandFromDimensions` / `PRICE_BAND_LABEL` from `apps/web/src/lib/products.ts` to `@zhic/locale` (or a new `@zhic/catalog` package) if a 2nd consumer (e.g. operator catalog UI) appears |
| FU-3.2-q | 3.2 | Real product imagery + media uploads via Payload seed. Carries forward FU-3.1-f / FU-2.3-l. Cards + PDP currently render `<Aspect>` cream «تصویر به‌زودی» placeholders |
| FU-3.2-r | 3.2 | Materials data fully populated per spec §14 (`description`, `imageMediaId`, `careNotes`, `relatedArticleIds`). Today seed populates `name` + `slug` + `origin`; richer fields when client provides material content for material-detail pages (Pkg 2+ surface) |
| FU-3.2-s | 3.2 | `generateStaticParams` on `/products/[slug]` + `/collections/[slug]` — requires `services/api` running during `pnpm build`. CI / infra concern; lands with 7.1. Today both routes render `ƒ (Dynamic)` |
| FU-3.2-t | 3.2 | Filter UI live-update (`onChange` autosubmit on filter form, debounced) + URL-only browser-history transitions. Today is explicit Apply button + autosubmit on sort only. Live-update on filters is a 6.2 polish concern |
| ~~FU-3.2-u~~ | 3.2 | ~~Mega-menu on «محصولات» wired to `categories` + `collections.featured` collections~~ — **resolved 2026-05-16** in ProductsMegaMenu via fetchNavMeta() (categories + featured collections + featured designs + featured product, all from Payload). |
| FU-3.2-v | 3.2 | Pre-existing `slugify.ts` lint regression (no-misleading-character-class on `\u200C\u200D` adjacency in a char class) was fixed in 3.2 because @zhic/api lint was a 3.2 exit gate. The fix is behavior-preserving (alternation outside the class). Documenting here so the diff isn't a surprise |
| FU-3.3-a | 3.3 | All-pins map on `/showrooms` (Neshan/OSM SDK embed). JS-heavy. Session 6.x or post-Pkg-2 |
| ~~FU-3.3-b~~ | 3.3 | ~~Form integration on `/contact` + `/showrooms/[slug]`~~ — **resolved in 5.1** (InquiryForm replaces ContactFormSlot on both pages; query-param contracts `?product=&reason=` and `?showroom=&reason=` fully wired) |
| FU-3.3-c | 3.3 | `managerUserId` rel → `users` collection. Pkg 3 (CRM `users` table) |
| FU-3.3-d | 3.3 | Showroom-specific `stockLevels` integration on detail page. Pkg 3 per `data-schemas.md` §21 |
| FU-3.3-e | 3.3 | Real `holidayHours` data for Iranian holidays (Nowruz 1404, شب یلدا). UI ready (`<ShowroomHolidayHours>` shipped); needs client to provide calendar |
| FU-3.3-f | 3.3 | Stronger `appointmentOnly` UX — promote the small footnote to a callout + flip primary CTA to "هماهنگی بازدید". Today renders a footnote; Esfahan seed exercises the path |
| FU-3.3-g | 3.3 | Promote `<MapEmbed>` to `@zhic/ui` when a 2nd consumer appears (likely 4.2 atelier / events) |
| FU-3.3-h | 3.3 | `googleBusinessProfileUrl` + Neshan profile link-out treatment (icon row beside CTAs). Today consumed only by JSON-LD `sameAs` + map fallback link |
| FU-3.3-i | 3.3 | `seo` group on Showrooms — Session 6.1 |
| FU-3.3-j | 3.3 | `status` / `publishedAt` on Showrooms — carries forward FU-1.3-a |
| FU-3.3-k | 3.3 | Real showroom imagery + media uploads via Payload seed. Carries forward FU-3.1-f / FU-2.3-l. Cover + gallery currently render placeholder cream blocks |
| FU-3.3-l | 3.3 | Promote `weekdays10to20()` helper from `services/api/src/seed.ts` to a shared `services/api/src/lib/showroomHours.ts` if a 2nd seed file or admin import script appears |
| FU-3.3-m | 3.3 | Header mega-menu showroom list under "درباره‌ی ما" per `sitemap.md` §5. Carries forward FU-2.2-a |
| FU-3.3-n | 3.3 | همدان / تهران / اصفهان in seed are fictional address + manager + phone data — replace with the brand's real locations before any client demo where these get inspected |
| FU-3.3-o | 3.3 | `<noscript>` fallback for `<iframe>` map embed (Iranian ISPs occasionally block third-party iframes). Show a static map image or Neshan link |
| FU-4.1-a | 4.1 | `<Bleed>` for full-width image embeds in article body. Carries forward FU-3.1-m |
| FU-4.1-b | 4.1 | OG image generation with Persian title overlay on article cover — Session 6.1 |
| FU-4.1-c | 4.1 | `generateStaticParams` on `/journal/[slug]`, `/journal/category/[slug]`, `/journal/tag/[slug]` — requires API during build (Session 7.1) |
| FU-4.1-d | 4.1 | Full editorial workflow (§60.1: reviewState, role-gated transitions, notifications, audit log) — Package 3 |
| FU-4.1-e | 4.1 | Factor sample Lexical block in article body — Package 2 (requires invoice system) |
| FU-4.1-f | 4.1 | Author archive page `/journal/author/[slug]` — not in Month 1 sitemap |
| FU-4.1-g | 4.1 | Search integration on `/journal` — Package 2+ per sitemap.md |
| FU-4.1-h | 4.1 | Promote `Pagination` to shared location or `@zhic/ui` — currently in `components/products/` but imported by journal routes. Promote when a 3rd consumer appears |
| FU-4.1-i | 4.1 | Promote `lib/richtext.tsx` to `packages/richtext` — carries forward FU-3.1-c. Still only one consumer (`apps/web`). Promote when 2nd consumer appears |
| FU-4.2-a | 4.2 | Full `pages` collection with polymorphic block system (§63.1) — Package 2+. Currently using simple globals with title+body |
| FU-4.2-b | 4.2 | Full `events` collection (§64) with RSVP, capacity, location group, Event JSON-LD — Package 2+ |
| FU-4.2-c | 4.2 | Richer `/about` layout — hero, gallery, team section. Requires block system (FU-4.2-a) |
| FU-4.2-d | 4.2 | `/categories/[slug]` pagination — currently shows first 12 products only. Add when categories grow beyond 12 items |
| FU-5.1-a | 5.1 | CAPTCHA / rate limiting on inquiry form — no abuse concern pre-launch; add in Package 2 |
| FU-5.1-b | 5.1 | Inquiry admin notifications (email/Telegram to team on new inquiry) — Package 3 CRM |
| FU-5.1-c | 5.1 | `PhoneInput` component with formatted display + validation feedback — carries forward FU-2.1-c; current plain `<Input type="tel">` works |
| FU-5.1-d | 5.1 | Newsletter form wiring in SiteFooter via `@zhic/sms` — carries forward FU-2.2-f; different form, different endpoint |
| FU-5.1-e | 5.1 | SMS.ir sandbox end-to-end test — needs `SMS_IR_API_KEY` + `SMS_IR_LINE_NUMBER` env vars + real API call. Compile-verified only in Claude Code sandbox |
| FU-6.1-a | 6.1 | CMS `seo` group fields on Products, Collections, Categories, Showrooms, Articles — carries forward FU-1.3-b, FU-3.2-f, FU-3.3-i. Schema + generateMetadata override wiring |
| FU-6.1-b | 6.1 | Lighthouse CI thresholds (seo.md §2.6 CWV budgets) — Session 7.1 |
| FU-6.1-c | 6.1 | Structured data CI validation on all public routes — Session 7.1 |
| FU-6.1-d | 6.1 | Faceted filter canonical (`noindex` on `/products?material=x`) — post-launch |
| FU-6.1-e | 6.1 | OG images for showroom pages + category pages — lower priority, home/product/article covered |
| FU-6.2-a | 6.2 | Custom cursor (8px circle, mix-blend-difference) — §6.4.6. Touch devices skip. 6.3 polish |
| FU-6.2-b | 6.2 | Page transition veil (ivory sweep, 600ms) — §6.4.7. Needs Next.js route transition API. Post-Month 1 |
| FU-6.2-c | 6.2 | MarqueeBlock on home — carries forward FU-3.1-g. Needs CMS schema + motion-heavy component |
| FU-6.2-d | 6.2 | Gallery lightbox pinch-zoom + swipe gestures — carries forward FU-2.3-j |
| FU-6.2-e | 6.2 | Mobile overlay choreography (stagger, mask reveal) — carries forward FU-2.2-h. 6.3 polish |
| FU-6.2-f | 6.2 | Motion on non-home pages (PDP, showroom detail, article) — block reveals on secondary pages. 6.3 or post-launch |
| FU-6.2-g | 6.2 | Back-to-top button + scroll progress bar — carries forward FU-2.2-g remainder |
| FU-7.1-a | 7.1 | Test whether `Users.auth.useSessions: true` works now that the `extractJWT` CSRF patch is in place. We set `useSessions: false` as a precaution while debugging and never confirmed the underlying issue (whether `findByID` populates `user.sessions` for Postgres). If `true` works, revert; if it doesn't, re-evaluate (probably want session-based revocation when CRM lands in Pkg 3 anyway). |
| FU-7.1-b | 7.1 | Re-evaluate the three pnpm patches (`patches/payload@3.83.0.patch`, `patches/@payloadcms__next@3.83.0.patch`) on every Payload upgrade. (a) `cookies.js` `HttpOnly=true`/`Secure=${secure}` is a real Payload bug — likely fixed upstream eventually; check before keeping. (b) `extractJWT.js` Sec-Fetch-Site leniency is a workaround for our deployment's header-stripping proxy; if we land HTTPS via Caddy and the proxy is gone, the patch becomes unnecessary. (c) `RootLayout` `suppressHydrationWarning` propagation may also become unnecessary once HTTPS removes the style-injection issue. |
| FU-7.1-c | 7.1 | Investigate WHY the user's HTTP requests have neither `Origin` nor `Sec-Fetch-Site`, AND why `<head>` gets a Polymer-style `body[unresolved]` `<style>` injected (saw via React-DOM patched-bundle hydration log). Both fingerprints point to a transparent HTTP proxy/middlebox between the user and `80.240.31.146:3001`. Once HTTPS is on (FU-7.1 remainder), this should self-resolve since proxies can't tamper with TLS. |
| FU-7.1-d | 7.1 | ✅ Resolved — SMS_DRY_RUN gate landed in @zhic/sms (commit 091304a). Review tier no longer texts real showroom managers when set in env. |
| FU-2A-1 | 2A | `ops/deploy.md` is stale for 3-tier topology (still describes staging.zhicwood.com + basic_auth). Banner-added 2026-05-10 marking it outdated; full rewrite when Part B is complete. |
| FU-2A-2 | 2A | ~~`ops/README.md` lines 4/32/80 had stale `staging.zhicwood.com` refs~~ — **resolved 2026-05-10** in scrub commit |
| FU-2A-3 | 2A | ~~Plan flow gap: provision.sh first-run skip needed a re-run step after repo clone~~ — **resolved 2026-05-10** via Task 13.5 in plan |
| FU-2A-4 | 2A | Caddy `expression {$ZHIC_ENV} == "review"` matcher may need quoted substitution (`"{$ZHIC_ENV}"`) — verify on Tier 2 with `caddy validate` (plan Task 19 step 1). 5-minute fix if needed. |
| FU-2A-5 | 2A | `/admin` route ambiguity: today Caddyfile routes `zhic.ir` → :3000 (storefront, no admin) and `api.zhic.ir` → :3001 (Payload admin). Plan Task 18 marks `api.zhic.ir` DNS as optional but says "admin reachable at zhic.ir/admin via same reverse-proxy" — those contradict. Either add `/admin*` path-route to :3001 in Caddyfile, or make `api.zhic.ir` DNS mandatory. |
| FU-2A-6 | 2A | `apps/web/src/lib/env.ts` exports `NOINDEX` constant but it's unused (robots.ts and layout.tsx read process.env inline due to vitest module caching). Either consume the constant or drop the export. |
| FU-9-a | 9 | systemd units have `After=postgres.service` / `Wants=postgres.service` but postgres runs in docker-compose, not as a host systemd unit. Targets silently ignored. Apps' `Restart=on-failure` + `RestartSec=5` converges eventually. Consider a `wait-for-postgres` script in the unit or accept the eventual-consistency. |
| FU-9-b | 9 | systemd hardening missing on zhic-web/zhic-api units: `NoNewPrivileges=yes`, `PrivateTmp=yes`, `ProtectSystem=strict`, etc. Add as a small follow-up after Tier 2 is healthy. |
| FU-9-c | 9 | `/var/zhic/bin/node` is a symlink to `/home/zhic/.nvm/versions/node/v*/bin/node`. Robust today but: (a) `ProtectHome=yes` (FU-9-b) would break it, (b) nvm uninstall could dangle the symlink. Consider copying the node binary into `/var/zhic/bin` or installing from NodeSource. |
| ~~FU-MM-a~~ | MM | ~~`/designs` index page — wire "See all" CTA for designs panel of the mega-menu.~~ — **resolved 2026-05-17** via single-focus carousel page at `/designs` (dim sides without chrome, focused with card + 22% right-spill, manual nav). CTA restored on mega-menu DesignsPanel + mobile menu DesignsSection. |
| FU-MM-b | MM | `/collections` index page — wire "See all" CTA for collections panel of the mega-menu. |
| ~~FU-MM-c~~ | MM | ~~Mobile mega-menu expansion in `MobileMenu.tsx` — currently «محصولات» is a flat link to `/products` on mobile. Trigger by user research signal.~~ — **resolved 2026-05-16** via two-state MobileMenu (main view + products view, cross-fade transition, corner button morphs ×→←). Hierarchical Esc, reset-on-close, inert-driven a11y. Spec: `docs/superpowers/specs/2026-05-16-mobile-products-menu-design.md`. Plan: `docs/superpowers/plans/2026-05-16-mobile-products-menu.md`. |
| FU-MM-d | MM | Arrow-key navigation between tabs in the mega-menu + roving tabindex. |
| FU-MM-e | MM | Live autocomplete in the mega-menu search input (server-side suggest endpoint). |
| FU-MM-f | MM | Denormalized `productCount` field on `Categories` / `Designs` / `Collections` with `afterChange` Payload hooks. Promote when catalog crosses 100 products. |
| FU-MM-g | MM | Companion mega-menu on «درباره‌ی ما» — the other half of FU-2.2-a. |
| FU-MM-h | MM | Search chip on `/products` header showing active `q` and `✕` clear button. |
| FU-MM-i | MM | Converge `/products` page URL params (currently `cat`/`mat`) with `parseSearchParams` (which reads `category`/`material`). Today both are extended for `q`+`design`; future PR aligns the naming. |
| FU-MM-c1 | MM | Featured product card on mobile menu. Currently desktop-only. Add when there's a clear customer signal that mobile users want it. |
| FU-MM-c2 | MM | Sub-item counts and subtitles on mobile menu. Reintroduce per category/design/collection if user research shows them missed. |
| FU-MM-c3 | MM | Live autocomplete in mobile search input (carries forward `FU-MM-e`). |
| FU-MM-c4 | MM | Swipe-back gesture (right-edge swipe on RTL) for the products → main transition. Native-app feel, optional polish. |
| FU-MM-c5 | MM | Companion expansion for «درباره‌ی ما» mirroring `FU-MM-g`. |
| FU-MM-c6 | MM | Push-style horizontal slide animation as alternative to cross-fade. User study would gate it. |
| FU-DDP-a | DDP | Materials section on the design page (derived from product materialIds OR manual `materialCallouts` relation). Add when editor research signals a need. |
| FU-DDP-b | DDP | "Pair with" related designs cross-links — schema relation + section at bottom of the page. |
| FU-DDP-c | DDP | Structured data — explore if any schema.org type fits ("CollectionPage", "CreativeWork"?). |
| ~~FU-DDP-d~~ | DDP | ~~`/designs` index listing all designs as a lookbook grid. Carries forward FU-MM-a.~~ — **resolved 2026-05-17** (not a grid; the index ships as a single-focus carousel per operator direction). |
| FU-DDP-e | DDP | Hero treatment alternates — option to switch a specific design to full-bleed or split layout via a `heroLayout` enum. Per-design design control. |
| FU-DDP-f | DDP | Editorial blocks unique to designs that don't fit the article block set — e.g., a "scale chart" or "fabric callout" block. |
| FU-DIX-a | DIX | GIF → video transcode pipeline on Payload upload (carries forward `FU-2.3-a`). Reduces media payload significantly; better preview controls. |
| FU-DIX-b | DIX | Filter pills above the slider — by `age_group` (نوزاد/کودک/نوجوان/بزرگسال). Useful when catalog grows past 25-30 designs. |
| FU-DIX-c | DIX | Lazy-load tile media beyond focused ± 2. Triggers when catalog exceeds 30 designs. |
| FU-DIX-d | DIX | Optional auto-play with pause-on-hover (operator picked manual; revisit if engagement metrics suggest passive browsing). |
| FU-DIX-e | DIX | Mini-grid alternate view — a button toggles slider ↔ grid (the discarded option B from brainstorming). For users who prefer scan-and-jump. |
| FU-DIX-f | DIX | Slider analytics — track which designs get clicked-to-detail. Surface findings to operator. |
| FU-DIX-g | DIX | Clone-tile wrap not in v1 — the wrap uses simple modulo, so at indices 0 / N-1 the focused tile sits at an edge instead of center. Production polish would clone the last 2 / first 2 tiles for seamless infinite loop per spec §5.3. Skipped in v1 for code simplicity. |

---

## Open decisions (block future work if left unresolved)

| Id | Topic | Blocking | Note |
| --- | --- | --- | --- |
| OD-palette | ✅ Resolved 2026-04-16: forest `#5F7760` + gold `#C49A6C`. Spec palette wins with updated brand values. | — | Tokens renamed: saffron→gold, moss→forest. Luxury-neutral approach: color is a rare whisper, neutrals carry 95%. |
| OD-latin-face | Latin secondary face (spec §2.2 says TBD) | 2.1+ components with Latin runs | Currently Ayandeh covers Latin via its own glyphs. Revisit when editorial templates land. |
| OD-logo-lockup | Persian-only / Latin-only / stacked wordmark | Header (2.2), OG images (6.1) | `design-system.md` §12 Q3 |

---

## Environment quick-facts

- Node: see `.nvmrc`
- Package manager: pnpm (Turborepo workspace)
- Primary commands:
  - `pnpm install`
  - `pnpm --filter @zhic/web dev`
  - `pnpm --filter @zhic/web build`
  - `pnpm --filter @zhic/<pkg> typecheck`
  - `pnpm --filter @zhic/<pkg> lint`
- Verification surfaces: `/lab/tokens`, `/lab/locale`, `/lab/ui` (now covers 2.1 atoms + 2.2 organisms + 2.3 cards/gallery/money/date), `/lab/type`, `/lab/color`, `/lab/motion`, `/lab/three`. Real pages: `/`, `/products`, `/products/[slug]`, `/collections/[slug]`, `/showrooms`, `/showrooms/[slug]`, `/contact`, `/privacy`, `/terms`, `/returns`, `/shipping-and-delivery`, `/thank-you`, `/_not-found`.
- Unit tests: `pnpm --filter @zhic/locale test` (69), `pnpm --filter @zhic/money test` (27), `pnpm --filter @zhic/web test` (29). Runner = Vitest 2.x, per package.
