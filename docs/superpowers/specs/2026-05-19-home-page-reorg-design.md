# Home Page & Site Chrome Reorg — Design Spec

**Date:** 2026-05-19
**Branch (current):** `staging`
**Mockup:** `apps/web/public/docs/hero-carousel-mockup.html` (served at `/docs/hero-carousel-mockup.html`)
**Status:** Brainstorm complete, awaiting user review of this spec before plan generation.

---

## 1. Context

The operator was given an externally-proposed reorg of the public storefront's home page and site chrome. The goal is **content reorganization** — not a rewrite of the underlying data model. Where possible, decisions extend existing collections rather than introducing new ones. New collections and globals are introduced only where the new IA genuinely needs them.

All visual decisions were validated section-by-section against a high-fidelity mockup that re-renders the live site chrome (Ayandeh font, `tokens.css` palette, RTL spacing, active-nav forest underline, etc.) so the operator could see the decision as it would ship.

## 2. Decisions

### 2.1 Navbar — split «محصولات» into two siblings

Replace the single `محصولات` mega-menu trigger with two sibling triggers:

| Trigger | Dropdown content | Destination route | Mobile (flat) |
| --- | --- | --- | --- |
| `سرویس خواب` | Lookbook tiles (sets as design hero shots) + featured-set aside | `/designs` (existing) | `/designs` |
| `تخت و وسایل اتاق خواب` | Piece-type grid (تخت، پاتختی، دراور… with counts) + featured-product aside | `/products` (existing) | `/products` |

**URLs are unchanged** — `/designs` and `/products` keep their slugs; only the navbar labels change. Each tile in the «سرویس خواب» dropdown leads to `/designs/[slug]`; each row in the «تخت و وسایل» dropdown leads to `/products?type=bed` (etc., filtering by `piece_type`).

The remaining nav items (`ژورنال`, `نمایشگاه‌ها`, `درباره‌ی ما`, `تماس`) stay as plain links.

**Implementation:** replace `ProductsMegaMenu` with `SetsMegaMenu` + `PiecesMegaMenu`, each owning its own panel. Optionally share a single absolutely-positioned panel that swaps body content based on which trigger is hovered/active — visually cleaner, more work to wire.

### 2.2 Hero — sliding curated media

- Image half of the existing split `HomeHero` becomes a **single full-image carousel** (one slide visible at a time, slides horizontally).
- **No card chrome, no eyebrow, no caption, no arrow buttons** — only dots at the bottom. Glass-morphic dots float over the image.
- **16:9 aspect ratio** for the entire hero on desktop (two 8:9 halves side-by-side). On mobile (stacked), the media half is 16:9 landscape on top, text stack below.
- **Top-right corner curved**: 140px desktop / 96px mobile (physical `border-top-right-radius` for RTL-agnostic placement).
- **Background = `--color-ivory`** — no contrasting colored panel; the media floats on the same page surface as the rest of the layout.
- The secondary CTA «ثبت استعلام» is removed. Only «مشاهده‌ی محصولات» remains.

**Data model:** new field on the `home` global — `heroSlides[]` — each entry `{ image (upload→media, required), alt (text), link (optional URL or relation) }`.

**Open implementation calls:** auto-rotate cadence (default 5s?), hover-to-pause on desktop, swipe gestures on phone, `prefers-reduced-motion` (no auto-rotate, no slide animation — display first slide statically).

### 2.3 Age categories — three editorial tiles under the hero

Three large editorial tiles added between the hero and the brand-statement, replacing nothing (this is a new section).

| Slug | Label | Persian | Linked route |
| --- | --- | --- | --- |
| `kid` | اتاق کودک | Child's bedroom | `/rooms/kid` |
| `teen` | اتاق نوجوان | Teen's bedroom | `/rooms/teen` |
| `adult` | اتاق بزرگسال | Adult's bedroom | `/rooms/adult` |

**Layout:** 3-up grid on desktop (4:5 portrait covers), stacked on phone (5:3 landscape covers each). Top-right corner curved (48px desktop / 28px phone). Eyebrow «دسته‌ی سنی» + Persian title + 1-paragraph sub + «مشاهده» CTA.

**Parallax:** the three cover images use the new `ParallaxImage` component (see §3.1) at 80% strength. As the user scrolls, the inner image drifts vertically within its fixed-aspect container. Honors `prefers-reduced-motion`.

**Schema:** new `rooms` collection with three seeded entries:
- `name` (text, e.g. «اتاق کودک»)
- `slug` (text: `kid`/`teen`/`adult`)
- `cover` (upload → media)
- `tagline` (text, the line under the title)
- `longDescription` (richText, for the landing page)
- `seoFields` (standard)

**Route:** new dynamic `/rooms/[slug]` page. Initially renders cover + tagline + longDescription. **v2 deferred:** add an `age` field on `products` (or `rooms.relatedProducts[]`) so the landing page can surface relevant catalog items.

**Test-media minimum dimensions** (operator FYI): 1080 × 2400 px tall portrait minimum (covers 2× retina + 80% parallax stretch). 1280 × 2880 recommended.

### 2.4 Brand statement — animated counters

The existing `HomeBrandStatement.tsx` keeps its layout (split: stats column / brand text column) but:

1. **Background** changes from `bg-ink` to the new `--color-forest-dark` token (§3.5). Same token is used by the footer — about-us and contact-us share the chrome.
2. **Stat values animate from 0** when the section first scrolls into view, using the new `CountUp` component (§3.2). Persian digits per frame via `toPersianDigits`. One-shot — does not re-trigger on subsequent scrolls.

**Schema shift in `HomeBrandStatement.tsx`:**

```ts
// Before
type BrandStat = { value: string; label: string }
const DEFAULT_STATS = [{ value: '۲۵+', label: 'سال تجربه...' }, ...]

// After
type BrandStat = { value: number; suffix?: string; label: string }
const DEFAULT_STATS = [{ value: 25, suffix: '+', label: 'سال تجربه...' }, ...]
```

Optional: mirror as `home.brandStats[]` on the home global if the operator wants to edit values from Payload.

### 2.5 Home journal — three-row scroll parallax

The existing `HomeJournalTeaser` (3-up static grid) is replaced by a **three-row horizontal scroll parallax**, ported from the [framer.university](https://framer.university) landing page's `Row 1 / Row 2 / Row 3` Illustration.

- Three rows of compact article cards (340px wide × 16:9 cover, category eyebrow, 2-line title, no excerpt).
- Each row drifts horizontally at a different rate as the user scrolls vertically through the section:
  - **Row 1**: drifts right @ 0.35× (max 300px displacement)
  - **Row 2**: drifts **left** @ 0.55× (opposite direction)
  - **Row 3**: drifts right @ 0.75×
- Driven by a single `requestAnimationFrame` loop on the scroll listener. Maps section progress (0 when top hits viewport bottom, 1 when bottom hits viewport top) → translateX per row.
- **Mobile**: same 3-row parallax, narrower cards (200px × 16:9), dampened max displacement (140px).

**Home query shifts** from `featured:true limit 3` to `published limit 15`, distributed round-robin into three rows of five cards. No collection schema changes.

**Component:** new `packages/ui/HomeJournalRows.tsx`. Honors `prefers-reduced-motion` (rows render static, no transform).

### 2.6 Showrooms teaser

New section between the journal and the footer. Compact 3-up card grid:

- Header row: eyebrow «شوروم‌ها» + heading «ما را در شهر خودتان ببینید» + «فهرست کامل» CTA on the end.
- Three cards: each = cover (3:2, top-right curve 20px) + city name (e.g. «همدان · شوروم مرکزی») + address line + phone (Latin digits, ltr direction).
- Mobile: stacked rows with 96×96 thumbnail on the right + city/address text on the left.

**Schema:** no new fields. Auto-populates from the existing `showrooms` collection, ordered by `is_central` first then `name`, limit 3.

**Component:** new `packages/ui/HomeShowroomsTeaser.tsx`.

### 2.7 Footer redesign — «در تماس باشیم» hero strip

Add a prominent contact strip at the top of the footer, **above** the existing 4 link columns. Background matches the brand-statement (`--color-forest-dark`).

**Strip structure:**

| Block | Content |
| --- | --- |
| Heading | Eyebrow «در تماس باشیم» + h2 «هر سؤال، هر سفارش — یک پیام فاصله» + lead paragraph |
| Card 1 — inline form | name + phone + textarea + submit. Submits via existing `submitInquiry` server action (reuse `InquiryFormSlim`, styled for dark bg). |
| Card 2 — contact info | Phone + email + Hamedan address. Reads from `siteConfig` global. |
| Card 3 — newsletter + socials | Email-only signup posting to `POST /api/newsletter`; 4 social icons (Instagram / Telegram / WhatsApp / Aparat). |

**Then below the strip:** the existing 4 link columns (محصولات / درباره‌ی ما / شوروم‌ها / خدمات), then the legal line.

**Schema additions:**

- **`siteConfig` global** (new, or extend an existing one if present): `contactPhone` (text), `contactEmail` (text), `address` (richText), `hours` (text), `socials[]` (array of `{ platform: 'instagram' | 'telegram' | 'whatsapp' | 'aparat'; url: text }`).
- **New `subscribers` collection**: `email` (text, unique), `subscribedAt` (date, auto), `source` (text, optional — e.g. «footer»).
- **New API route** `POST /api/newsletter` that validates the email and writes a subscriber. **Mail provider integration deferred to Package 2.**

### 2.8 Blur-in text reveal — word-by-word

All visible text on the home page (header, hero text, age tiles, brand statement, journal heading/CTA, showrooms text, footer contact strip) reveals via a per-word blur-in transition when the containing element first scrolls into view.

- CSS rest state: `opacity:0; filter:blur(18px)`.
- Visible state: `opacity:1; filter:blur(0)`.
- Transition: 700ms ease-out-soft, delay = `--bi × 90ms` (per word index within element).
- JS splits text-node contents into per-word `<span class="blur-piece">` at runtime, preserving whitespace as text nodes (so word spacing is natural) and keeping any existing inline children (e.g. arrow icons) as single pieces. **Each word stays a single text run, so Persian glyph shaping is preserved.**
- `IntersectionObserver` triggers once per element on first scroll-into-view; then `io.unobserve(el)`.
- `prefers-reduced-motion`: no transition, all text renders at final state immediately.
- Elements containing `data-count-up` are skipped from the splitter (they animate at the element level, because count-up rewrites `textContent` per frame).

**Component:** new utility `packages/ui/BlurInText.tsx` (client component + CSS). Or implement as a CSS class + a single page-level hook — both are viable; pick during implementation.

## 3. New shared components & tokens

### 3.1 `packages/ui/ParallaxImage`

Scroll-tied vertical parallax. Port of [framer.com/m/ParallaxImage-prod-3M0qB4.js](https://framer.com/m/ParallaxImage-prod-3M0qB4.js), reimplemented as a local React component to avoid an Iran-blocked external CDN and to integrate with the design system.

**Props:** `src` (string), `alt` (string), `verticalAmount` (number 0-100, default 80), `borderRadius` (number, px), `className`.

**Behavior:**
- Image is positioned absolutely inside an `overflow:hidden` container, extended beyond bounds by `verticalAmount / 2` on top & bottom.
- On scroll, computes `progress = clamp((vh - rect.top) / (vh + containerHeight), 0, 1)`.
- Applies `transform: translate3d(0, yOffset, 0)` where `yOffset = (progress - 0.5) × (verticalAmount / 100) × containerHeight`.
- `requestAnimationFrame` + passive scroll/resize listeners.
- `prefers-reduced-motion`: image renders centered, no transform.

Used by the three age-category tiles (§2.3).

### 3.2 `packages/ui/CountUp`

Animated number ticker. ~40 lines.

**Props:** `value` (number), `suffix?` (string, e.g. «+»), `duration?` (ms, default 1500), `className`.

**Behavior:**
- `IntersectionObserver` triggers once on first scroll-into-view (one-shot, then `io.unobserve(el)`).
- `requestAnimationFrame` animates 0 → `value` with ease-out cubic.
- Each frame: `el.textContent = toPersianDigits(currentValue) + suffix`.
- `prefers-reduced-motion`: render final value immediately.

Used by the three stats in `HomeBrandStatement` (§2.4). **Why not Magic UI's `number-ticker`?** Registry not configured in the project, would require adding `motion` as a runtime dependency, and renders Latin digits — wrong for a Persian-first storefront. Porting locally is ~40 lines and integrates with `@zhic/locale`.

### 3.3 `packages/ui/BlurInText`

See §2.8.

### 3.4 New section components (Home)

- `packages/ui/HomeHeroCarousel` — wraps the existing `HomeHero` text half + the new image-carousel right half.
- `packages/ui/HomeRoomsTiles` — three age-category tiles, each using `ParallaxImage`.
- `packages/ui/HomeJournalRows` — three-row scroll-parallax journal teaser.
- `packages/ui/HomeShowroomsTeaser` — compact 3-up showrooms card grid.
- `SiteFooter` extended with the new `FooterContactStrip` sub-component.

### 3.5 New design token

```css
:root {
  --color-forest:      #5F7760;
  --color-forest-dark: #2D3A2E;  /* NEW — about-us + contact-us section bg */
  …
}
```

Add to `packages/design-system/css/tokens.css` alongside the existing forest accent.

## 4. Schema changes (summary)

| Layer | Change |
| --- | --- |
| `home` global | Add `heroSlides[]` (image + alt + optional link). Optionally `brandStats[]` if operator wants to edit values. |
| `rooms` collection | **New.** 3 seeded entries (kid/teen/adult): name, slug, cover, tagline, longDescription, seoFields. |
| `siteConfig` global | Extend (or create): `contactPhone`, `contactEmail`, `address` (richText), `hours`, `socials[]`. |
| `subscribers` collection | **New.** email, subscribedAt, source. |
| `BrandStat` type | Shift from `{ value: string }` to `{ value: number; suffix?: string }`. |
| All other collections | Unchanged. `products`, `designs`, `articles`, `showrooms`, etc. — same fields, same routes. |

## 5. Route changes

| Route | Status |
| --- | --- |
| `/designs`, `/designs/[slug]` | Unchanged. Surfaced via «سرویس خواب» nav. |
| `/products`, `/products/[slug]`, `/products?type=…` | Unchanged. Surfaced via «تخت و وسایل» nav. |
| `/rooms/[slug]` | **New.** Per-age landing page. |
| `/api/newsletter` | **New.** `POST` email → subscriber record. |
| All other public routes | Unchanged. |

## 6. Mockup

The complete brainstorm mockup lives at:

- File: `apps/web/public/docs/hero-carousel-mockup.html`
- URL (workspace VPS): `http://80.240.31.146:3000/docs/hero-carousel-mockup.html`

It re-renders the live site chrome (Ayandeh font from `/fonts/`, `tokens.css` palette inlined, `products-mega-menu.css` styles for the trigger and dropdown panel, RTL layout, `bg-charcoal`/`bg-forest-dark` sections) with every decision applied in both desktop and phone variants. All animations (carousel, parallax, count-up, blur-in, journal rows) run inline so the operator can preview the actual behavior.

Test media for the parallax/carousel placeholders is at `apps/web/public/docs/test-media/` (8 Unsplash interior shots, ~150-500 KB each).

**Mockup-only scaffolding — not part of production:** the mockup file additionally contains a `<header class="doc-head">` block at the top («Schema reorg · brainstorm») and a `<section class="doc-section">` mapping panel at the bottom that documents the decisions inline. These are explainer chrome for the brainstorm — they do **not** correspond to any production page section and should be ignored by implementation. Likewise, the desktop and phone stages are wrapped in `.stage` and `.phone-stage` frames for side-by-side preview — production pages do not have these wrappers.

## 7. Out of scope

- Mail provider for newsletter (deferred to Package 2).
- `age` field on `products` collection (deferred — `/rooms/[slug]` initially renders content-only).
- Replacing the existing `submitInquiry` server action — the footer form reuses it.
- Auto-rotate, swipe gestures, and `prefers-reduced-motion` polish for the hero carousel — implementation notes, not a separate spec.
- ZarinPal / payments / showroom booking flows — owned by other specs.

## 8. Open implementation calls

These are intentionally deferred until the plan/implementation phase:

1. Hero carousel auto-rotate cadence (suggest 5s).
2. Hero carousel: shared panel that swaps content on hover, vs two separate panels.
3. Newsletter form: client-side validation + server-side rate limiting (per-IP).
4. Footer form: does it post via the same `useActionState` pattern as the existing slim inquiry form, or AJAX-only?
5. Whether to add `age: 'kid' | 'teen' | 'adult'` enum to `products` now (cheap) or defer entirely (cleaner). My instinct: defer, see what the rooms landing pages actually need.

## 9. Acceptance checks

A successful implementation will:

- [ ] Render `/` with all sections from §2 in the order: header → hero → age tiles → brand-statement → journal rows → showrooms teaser → footer.
- [ ] Pass the existing cross-route smoke (22 paths, all expected codes) without regression.
- [ ] Match the mockup's chrome at `/docs/hero-carousel-mockup.html` (typography weights, spacing, top-right curve radii, `--color-forest-dark` shared bg).
- [ ] Animate the count-up once per session per stat.
- [ ] Animate the parallax + journal rows on scroll (verify `prefers-reduced-motion` disables both).
- [ ] Submit the footer inquiry form via `submitInquiry` (same path as the existing `/contact` form).
- [ ] Persist a newsletter signup to the new `subscribers` collection.
- [ ] Render `/rooms/kid`, `/rooms/teen`, `/rooms/adult` with the seeded content.
