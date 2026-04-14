# Design System

The Zhic design system. Persian-first, RTL from day one, dazzling but
restrained. Two visual vocabularies live in this document side by side:

- **Storefront vocabulary** — `apps/web`. Editorial, slow, motion-rich,
  the brand-defining surface. Persian display type, hairline-driven
  layouts, atelier mood.
- **Operator vocabulary** — `apps/crm`, `apps/erp`, `apps/mes`,
  `apps/factor`. Functional, dense, keyboard-friendly, tablet-aware.
  Same tokens, different defaults: smaller type, denser spacing,
  shorter motion durations, no decorative cursor, no page-veil
  transitions.

Both vocabularies share one design-token package
(`packages/design-system`). They diverge only at the component-default
and motion layer. There is no second token set, no second theme.

This document defines: brand voice, tokens, typography, color, grid,
spacing, iconography, imagery, motion, RTL rules, Persian-digit and
Jalali rendering rules, the component inventory with states, and the
operator-vocabulary diff.

---

## 1. Brand essence

### 1.1 Mood

Slow mornings, soft Tehran light through gauze curtains, walnut and
Belgian linen, the threshold between waking and dreaming. Iranian
hospitality without ornament. The opposite of glossy, neon, or busy.

### 1.2 Voice (Persian primary, English reference)

The site is written in Persian. The voice is **calm, grounded,
concrete**. Confident without selling.

Persian voice rules:

- **Use formal-but-warm register** — "شما" not "تو", but never
  bureaucratic. Never "محترم" stacking, never "گرامی" filler.
- **Short sentences.** Persian rewards rhythm; sentences over 20
  words tire the reader.
- **Concrete nouns.** "چوب گردو", "کتان بلژیکی" — not "متریال
  باکیفیت".
- **No marketing exclamations.** No "!!!", no "بهترین"، "بی‌نظیرترین"،
  no superlatives.
- **Pricing is presented quietly.** "۸٬۴۰۰٬۰۰۰ تومان" — never
  "فقط ۸٬۴۰۰٬۰۰۰ تومان!"
- **Headlines are statements**, not questions. "ساخته‌شده برای ماندن."
  not "آیا به‌دنبال یک تخت ماندگار هستید؟"
- **Avoid Arabic register words** when a common Persian alternative
  exists. Use "می‌توانید" not "قادرید"; "درباره‌ی" not "در خصوصِ".
- **Use ZWNJ (نیم‌فاصله, U+200C) consistently** — "می‌خواهید", not
  "میخواهید". The CMS pre-commit hook normalizes ZWNJ usage.
- **Persian digits in body copy** — ۰۱۲۳۴۵۶۷۸۹. ASCII digits only in
  SKUs, slugs, code, and machine-readable identifiers.
- **Persian quotation marks** — «...» not "..." in Persian text.
- **Persian comma** — ، not ,. Persian semicolon — ؛.
- **Honor mixed-script runs.** "محصول glTF" not "محصول جی‌ال‌تی‌اف".
  Wrap Latin runs in `<span dir="ltr">` so they don't break the
  bidi flow.

What we are not:

- Glossy, neon, playful, busy.
- "Bold and disruptive," startup-y, ironic.
- Bilingual marketing copy. There is no English mirror.

### 1.3 Voice for operator apps

Operator apps speak to staff, not customers. The register is:

- **Direct, functional, tool-like.** "ثبت سفارش" not "ثبت سفارش
  جدید برای مشتری گرامی".
- **Short labels, no decoration.** "موجودی"، "انتقال"، "فاکتور" —
  one or two words is the norm.
- **Numbers are first-class.** Operator screens display Persian
  digits but copy them to clipboard / forms as ASCII.
- **No emotional language.** No "عالی!" toasts. Confirmation is a
  green check and a quiet line of text.

---

## 2. Tokens

All tokens are exposed as CSS custom properties on `:root` in
`packages/design-system` and consumed by Tailwind v4 via `@theme`.
Token names are stable; values may change. Both `apps/web` and the
operator apps import the same token set.

### 2.1 Color

```
--color-ivory       #FAFAF7   page background, canvas
--color-cream       #F5F0EB   panels, alt sections
--color-sand        #E8E0D8   dividers, hairlines, hover fills
--color-stone       #8C8279   secondary text, captions
--color-charcoal    #2C2825   primary text, headlines
--color-ink         #14110F   near-black, used sparingly for emphasis
--color-accent      #B8A898   brand neutral accent (warm taupe)
--color-saffron     #C68A2E   reserved for rare moments (rare!)
--color-rust        #8B4A2B   error / warning, muted
--color-moss        #5A6B4F   success, muted
--color-overlay     rgba(20, 17, 15, 0.6)   image overlays
```

Rules:

- The site lives in **ivory + charcoal**. Sand and cream are for
  separation and hairlines.
- **Saffron** is a once-per-page maximum on the storefront. Never on
  body text. Borrowed from saffron silk and Iranian miniatures, used
  the way the old spec used "gold."
- No pure black, no pure white anywhere.
- All text passes WCAG AA against its background. Charcoal on ivory:
  13.4:1. Stone on ivory: 4.6:1 (body-only, never headlines).
- **Dark mode is not in scope for v1.** Reconsidered after Package 3.
  Operator apps may want it first because staff use them all day.

### 2.2 Typography

The system pairs **one Persian face** and **one Latin face**. Both
are loaded via `next/font/local`, **not** `next/font/google` —
Google Fonts is intermittently blocked from Iran (we hit this in
the local `next build`), and self-hosted woff2 files are also faster
for everyone.

#### Persian display + body

- **Ayandeh** — self-hosted TTF, 4 weights: Light (300), Regular (400),
  Bold (700), Black (900). Used for both display and body. Display sizes
  use Black/Bold weights. Body uses Regular. Captions/secondary use Light.
  Track tight at large sizes (`-0.005em`) to keep the optical color even.
  Line height generous (1.7+) — Persian ascenders and descenders need
  more room than Latin.

Both faces are **subsetted at build time** to the actual Unicode
ranges in use (U+0600–U+06FF, U+200C–U+200D, U+FB50–U+FDFF, plus
ASCII). Subsetting cuts file size by ~70%.

#### Latin (used for SKUs, prices in numeric form, code, brand
mark, occasional editorial accents)

- **TBD** — Latin face not yet locked. Loaded as a self-hosted secondary
  family. The CSS rule `font-family: 'Ayandeh', '<Latin TBD>', system-ui,
  sans-serif` puts the Latin face as the **second** family so that Latin
  characters in mixed runs fall through to it without forcing
  Persian glyphs through the Latin substitution table.

Brand wordmark "Zhic" / "ژیک":

- The Persian wordmark "ژیک" is the primary mark on Persian pages.
- "Zhic" Latin form is used in: legal copy, code identifiers, the
  global navigation favicon, OG image fallback. Never side-by-side
  with the Persian mark in body copy.

Type scale (modular, ratio 1.25, base 16px). Sizes are the same
across Persian and Latin; line-height is **higher for Persian** to
accommodate the ascender/descender envelope.

| Token | px | rem | Family | Weight | Line height (fa) | Use |
| --- | --- | --- | --- | --- | --- | --- |
| `text-display` | 96 | 6 | Ayandeh | Black (900) | 1.15 | Hero headline (desktop) |
| `text-h1` | 64 | 4 | Ayandeh | Bold (700) | 1.2 | Page H1 |
| `text-h2` | 48 | 3 | Ayandeh | Bold (700) | 1.25 | Section heading |
| `text-h3` | 32 | 2 | Ayandeh | Bold (700) | 1.3 | Subsection |
| `text-h4` | 24 | 1.5 | Ayandeh | Bold (700) | 1.35 | Card title |
| `text-lead` | 20 | 1.25 | Ayandeh | Light (300) | 1.7 | Lead paragraph |
| `text-body` | 16 | 1 | Ayandeh | Regular (400) | 1.75 | Body |
| `text-small` | 14 | 0.875 | Ayandeh | Regular (400) | 1.7 | Captions, meta |
| `text-eyebrow` | 12 | 0.75 | Ayandeh | Bold (700) | 1.5 | Uppercase Latin only; for Persian, use small caps via opentype features if available, otherwise drop the eyebrow style entirely |

Mobile scale: `clamp()` everything. Display caps at 56px on mobile,
H1 at 40px.

Headings use `text-balance`. Body uses `text-pretty`. Persian text
also benefits from `word-spacing: 0.02em` at body sizes — tested in
`/lab/type` before each lock.

#### Persian-specific typography rules

- **Always set `direction: rtl`** at the `<html>` level. Embedded
  Latin runs (SKUs, prices, brand words) get a wrapping
  `<span dir="ltr" class="ltr-run">`.
- **Persian digits everywhere by default.** A `packages/locale`
  helper `formatNumber(value, { digits: 'fa' })` is the only correct
  way to render a number in Persian text. Storage is always ASCII.
- **No `ltr-only` font features** like Latin small caps in Persian
  copy.
- **`hyphens: none`** for Persian — Persian does not hyphenate.
- **`text-align: start`** instead of `right` so that any embedded
  English block falls back to its natural alignment.
- **No italic.** Persian has no italic; the closest tradition is
  nasta'liq, which is a different family entirely. Never apply
  `font-style: italic` to Persian text.
- **No all-caps Persian.** Persian has no case. Never apply
  `text-transform: uppercase` to Persian text. Latin runs may use
  uppercase for eyebrows.

### 2.3 Spacing

8-point base. Same tokens for both vocabularies; operator apps just
default to a smaller scale step.

```
--space-1   4px
--space-2   8px
--space-3   12px
--space-4   16px
--space-5   24px
--space-6   32px
--space-7   48px
--space-8   64px
--space-9   96px
--space-10  128px
--space-11  192px
--space-12  256px
```

- **Storefront section vertical rhythm:** `--space-11` desktop,
  `--space-9` mobile.
- **Operator app section rhythm:** `--space-7` desktop, `--space-5`
  mobile. Density matters — operators scan, they don't read.
- **Container max width:** 1440px storefront, 1600px operator (more
  table real estate).
- **Gutter:** `--space-6` desktop, `--space-4` mobile.

### 2.4 Grid

12-column on desktop, 6 on tablet, 4 on mobile. Gutter scales with
spacing tokens. Editorial layouts on the storefront may break the
grid intentionally — only hero, gallery, and split blocks are allowed
to do so. Operator apps never break the grid.

#### Logical properties for RTL

All custom CSS in this repo uses **logical properties**, not physical:

- `margin-inline-start` / `margin-inline-end`, never `margin-left` /
  `margin-right`.
- `padding-inline-*`, `border-inline-*`, `inset-inline-*`.
- `text-align: start` / `end`, never `left` / `right`.
- Tailwind v4 utilities have logical equivalents (`ms-4`, `me-4`,
  `ps-4`, `pe-4`); use those, not `ml-4`/`mr-4`.

Physical properties are only allowed where the visual is genuinely
direction-independent (e.g., a centered overlay, a decorative dot
position).

### 2.5 Radii

```
--radius-none  0
--radius-sm    2px   inputs, chips
--radius-md    4px   cards, buttons
--radius-lg    8px   modals
--radius-pill  999px round buttons, tags
```

Most surfaces are square. Roundness is rare and meaningful.

### 2.6 Borders & hairlines

- 1px solid `--color-sand` is the standard hairline.
- Hairlines are preferred over shadows.
- No drop shadows on cards. Only on modals
  (`0 24px 64px -24px rgba(20,17,15,.18)`).

### 2.7 Z-index

```
--z-base       0
--z-raised     10
--z-sticky     100
--z-header     200
--z-overlay    900
--z-modal      1000
--z-toast      1100
```

### 2.8 Breakpoints

```
sm   640
md   768
lg   1024
xl   1440
2xl  1920
```

Mobile-first. Storefront designs are produced at 390 (mobile),
1024 (tablet), 1440 (desktop), 1920 (showroom screen). Operator apps
are designed at 1024 (tablet, used on the showroom floor) and 1440
(desktop) — phone layouts are not a goal for `apps/crm`/`apps/erp`.

---

## 3. Numbers, dates, money — display rules

These rules belong to the design system because they touch every
visible label, table, and form. The implementations live in
`packages/locale` and `packages/money`, but no component is allowed
to format these on its own.

### 3.1 Numbers

- Display digits: Persian (۰–۹) by default in Persian copy.
- Storage digits: ASCII (0–9) always.
- Thousands separator: `٬` (U+066C, Persian thousands separator)
  in Persian display, `,` in Latin/code contexts.
- Decimal separator: `٫` (U+066B) in Persian display. Most product
  prices have no decimals.
- Negative sign goes **before** the Persian digit run, not after.

### 3.2 Dates

- Display: Jalali calendar, Persian month names, Persian digits.
  Format `۸ فروردین ۱۴۰۵`.
- Storage: UTC ISO 8601 always.
- Conversion goes through `packages/locale` (`formatDate(value,
  'jalali-long')`).
- Operator apps may show ISO + Jalali side by side in tables when
  staff need both.

### 3.3 Money

- Storage: rial as integer minor units.
- Display: toman (rial ÷ 10), Persian digits, `٬` thousands separator,
  unit suffix "تومان".
- Example: storage `84000000` → display `۸٬۴۰۰٬۰۰۰ تومان`.
- Conversion goes through `packages/money` (`formatMoney(rials,
  { unit: 'toman', digits: 'fa' })`). No component multiplies or
  divides by 10 anywhere else.
- Sign-on-the-right convention: the unit suffix comes after the
  number visually, but because the run is RTL, the unit ends up
  reading naturally: "تومان ۸٬۴۰۰٬۰۰۰".

### 3.4 Phone numbers

- Display: spaced Persian-digit local form: `۰۹۱۲ ۳۴۵ ۶۷۸۹`.
- Storage: E.164 ASCII: `+989123456789`.
- Inputs accept either, normalize to E.164 on submit, validate
  against Iranian mobile prefixes via `packages/locale`.

### 3.5 Addresses

- Persian address fields, free-form for street/plaque/unit because
  Iranian addresses don't fit a rigid schema.
- Province dropdown is the canonical 31-province Iranian list,
  Persian names, ASCII slug values.
- Postal code: 10 digits, Persian-display, ASCII storage, validated
  per the Iranian postal-code spec.

---

## 4. Iconography

- Stroke icons, 1.25px stroke at 24px size.
- Family: custom-drawn or Phosphor "thin" weight.
- Never filled.
- Never colored — always inherit `currentColor`.
- 24px is the default size; 16px for inline; 32px for empty states.
- **Directional icons (chevrons, arrows) flip under RTL.** A "next"
  arrow on a Persian page points **left**, not right. Wrap them in a
  `<RtlAwareIcon>` helper that applies `transform: scaleX(-1)` when
  `dir="rtl"`. Non-directional icons (search, user, cart) do not
  flip.

---

## 5. Imagery

- **Photography style:** natural light, neutral palette, close crops
  on fabric and grain, occasional wide editorial shots, never staged
  with models smiling at the camera. Iranian context where it
  matters (Hamedan workshop, Tehran showroom, Persian textiles).
- **Aspect ratios:** product cards 4:5, hero 16:9 or 21:9, journal
  cover 3:2, gallery free.
- **All images are AVIF + WebP** via Next/Image. Originals stored in
  Abr Arvan Object Storage (S3-compatible, see `README.md` stack
  decisions).
- **Alt text is required.** Admin will not allow image upload
  without it. Persian alt text by default; Latin alt text only on
  the few English-mirror surfaces (none ship in v1).
- **No stock imagery.** Ever.

Video:

- Hero scrub video must be ≤ 8 MB, ≤ 12 seconds, and have a poster
  frame.
- Always paired with a `prefers-reduced-motion: reduce` fallback
  (still image).

GIFs:

- The brand provides GIFs for product detail pages. They are
  allowed despite being inefficient because the brand has the
  source files. Editors are warned that mp4/webm is preferred for
  loops > 1 s.
- Loop only while in viewport (IntersectionObserver).
- Explicit width/height to avoid CLS.

3D:

- glTF/GLB primary, USDZ secondary. See `data-schemas.md` §1.2 and
  `architecture.md` §4 (`packages/ui` + 3D viewer rules).
- Click-to-load on the storefront. No auto-load.

---

## 6. Motion language

Motion is the brand's secret weapon on the storefront. **Subtle,
slow, choreographed.** Operator apps use a reduced motion vocabulary
— function over flourish.

### 6.1 Storefront principles

1. **Slowness reads as luxury.** Default duration is 600ms, not 200.
2. **Easing is custom**, never linear, never the framework default.
3. **Stagger reveals hierarchy.** Children animate at 60–80ms offsets.
4. **Motion respects `prefers-reduced-motion`.** All transforms
   become opacity-only fades when set.
5. **Nothing animates on hover that wasn't designed to.** No
   accidental transitions.
6. **No parallax for parallax's sake.** Only when it serves the
   narrative.
7. **RTL changes direction, not duration.** A reveal that slides from
   the "leading edge" slides from the right under RTL. Translation
   tokens use logical sign (`--reveal-x: 24px` becomes `-24px` under
   RTL via a single `[dir="rtl"]` override in the design-system
   stylesheet).

### 6.2 Operator-app principles

1. **Fast.** Default duration is 180ms.
2. **Functional only.** State changes (loading, success, error)
   animate; decoration does not.
3. **No marquees, no scrubbed video, no custom cursor, no page
   veil.** Operator apps feel like tools, not editorial pages.
4. **Same `prefers-reduced-motion` story.** Honored equally.

### 6.3 Tokens

```
/* Storefront-default durations */
--dur-instant    100ms   focus rings, micro state
--dur-fast       240ms   small UI
--dur-base       480ms   most things
--dur-slow       720ms   reveals, hero
--dur-glacial   1200ms   hero text mask reveals

/* Operator-default durations */
--dur-op-fast    120ms   buttons, tabs
--dur-op-base    180ms   modals, drawers
--dur-op-slow    280ms   table rows expanding

/* Easings (shared) */
--ease-out-soft     cubic-bezier(0.22, 1, 0.36, 1)    default reveal
--ease-in-soft      cubic-bezier(0.64, 0, 0.78, 0)    exits
--ease-in-out-soft  cubic-bezier(0.65, 0, 0.35, 1)    state changes
--ease-expo-out     cubic-bezier(0.16, 1, 0.3, 1)     hero entrances
```

### 6.4 Storefront patterns

- **Word reveal:** characters split, mask up, 32ms stagger,
  `--dur-glacial`, `--ease-expo-out`. Used on H1 only. RTL splits
  from the right edge.
- **Block reveal:** 24px y-offset + opacity, `--dur-slow`,
  `--ease-out-soft`, triggered when 20% in viewport.
- **Image reveal:** clip-path inset from 100% to 0%, `--dur-slow`,
  `--ease-expo-out`, paired with 1.08 → 1.0 scale on inner img. Clip
  direction respects RTL.
- **Hover lift (cards):** `translateY(-2px)`, 240ms,
  `--ease-out-soft`, hairline color shifts from sand to charcoal.
- **Marquee:** infinite scroll at 40s/loop, **right → left under
  RTL**, pauses on hover.
- **Cursor:** custom 8px circle that grows to 32px with
  `mix-blend-difference` on interactive elements. Storefront only.
  Disabled on touch and on operator apps.
- **Page transition:** ivory veil sweeps up, 600ms,
  `--ease-in-out-soft`. Storefront only.
- **Scroll-scrubbed video:** GSAP + Lenis. Storefront only.

### 6.5 Forbidden motion

- Bouncy springs on anything except micro-interactions (toast,
  toggle).
- Continuous looping animations on body content (distracting).
- Auto-rotating carousels.
- Pop-in scale-from-zero entrances.
- Any motion exceeding 1.2s outside of the hero.
- Marquees scrolling left → right on RTL pages (always wrong).

---

## 7. Layout primitives

These are the only layout components allowed in pages. If a layout
cannot be expressed with them, the design system is wrong, not the
page. They live in `packages/ui` and use logical properties throughout.

| Primitive | Purpose |
| --- | --- |
| `<Container>` | Max-width 1440 (storefront) / 1600 (operator), gutters, centered. |
| `<Section>` | Vertical rhythm wrapper, optional background token. |
| `<Grid>` | 12/6/4 responsive grid with gap props. RTL-aware column starts. |
| `<Stack>` | Vertical or horizontal flex with spacing token. Direction respects logical properties. |
| `<Split>` | Two-column 50/50 or 60/40 editorial split. |
| `<Bleed>` | Full-bleed escape hatch (hero, gallery). |
| `<Aspect>` | Aspect-ratio box for media. |
| `<LtrRun>` | Wraps Latin/numeric content inside Persian text with `dir="ltr"`. |
| `<MoneyDisplay>` | Formats rials → toman via `packages/money`. The only permitted way to render a price. |
| `<DateDisplay>` | Formats UTC → Jalali via `packages/locale`. The only permitted way to render a date. |

---

## 8. Component inventory

Every component must define: variants, sizes, states (default,
hover, focus-visible, active, disabled, loading, error, empty for
lists), motion, accessibility notes, and **RTL behavior** (does it
mirror, partially mirror, or stay fixed). The exhaustive spec lives
in Figma and is mirrored as Storybook stories from Package 1 onward.

### Atoms

- Button (primary, secondary, ghost, link; sm/md/lg)
- IconButton (chevrons flip under RTL)
- Link (inline, standalone)
- Input (text, email, search, textarea) — all RTL by default
- PhoneInput — Iranian-mobile aware, normalizes to E.164
- OtpInput — six-digit segmented input for `/login/verify`
- Select / Combobox
- Checkbox, Radio, Toggle
- Tag / Chip
- Tooltip (anchored on the inline-start by default)
- Badge
- Divider (hairline, thick)
- Eyebrow label (Latin only)
- PriceLabel (uses `<MoneyDisplay>`)
- DateLabel (uses `<DateDisplay>`)
- Spinner / progress
- Skeleton

### Molecules

- FormField (label + input + help + error) — labels above on
  storefront, beside-the-input on operator apps for density
- NewsletterForm (phone-first, email optional)
- SearchBar
- Pagination (chevrons RTL-aware)
- Breadcrumbs (separator chevrons RTL-aware)
- Accordion
- Tabs
- ImageWithCaption
- VideoPlayer (poster, controls, reduced-motion fallback)
- ProductCard (existing, will be tokenized in Package 1)
- ArticleCard
- ShowroomCard
- TestimonialCard
- AddressCard (Iranian address shape)
- FactorRow (operator + storefront, used in factor template and
  order details)
- PressLogoStrip

### Organisms

- Header (transparent → solid on scroll, RTL nav)
- Footer
- HeroBlock
- MarqueeBlock (RTL direction)
- FeaturedProductsBlock
- EditorialSplitBlock
- JournalTeaserBlock
- TestimonialsBlock
- ContactBlock
- NewsletterBlock
- GalleryBlock
- SpecsAccordion
- VariantPicker (size, finish, fabric)
- RelatedProducts
- TableOfContents
- BookingForm (Package 3)
- CartLineItems (Package 2)
- CheckoutForm (Package 2, multi-step)
- OtpFlow (Package 2, the login → verify pair)
- FactorDocument (Package 2, used by `packages/invoices`)
- PromotionBanner (Package 2 — Shape C, sitewide promo strip)
- GiftCardBalance (Package 2 — Shape C, mini balance-check widget)

### Templates

See `sitemap.md` for the full storefront list. Operator-app
templates are documented in `admin-panels.md`.

#### Generous-only template archetypes (Package 1)

These templates ship in Package 1 at Generous scope (R12). They
reuse the existing design-system primitives — no new tokens. Content
comes from the SEO specialist and client (see `seo.md` §4.5 and
`roadmap.md` content-ownership table).

- **Pillar page** — long-form editorial template for the highest-
  value Persian search terms. Layout: hero image + H1 + dek, auto-
  generated TOC (sticky on desktop), MDX body with product embeds,
  pull quotes, and image grids. Structurally identical to `Article`
  but surfaced as a distinct content type in the CMS so pillar
  content can be managed separately from the journal.

- **Category editorial page** (`/categories/[slug]`) — a real
  editorial landing for product categories, not just a filtered
  catalog list. Layout: hero section with category name + editorial
  intro (Persian), curated product grid below, optional editorial
  blocks (material stories, care tips). The editorial framing is
  what makes it Generous — without it the page is just a filter.

- **Events page** (`/events`) — static content page listing
  workshops, open-house events, showroom visit windows. Layout:
  `<Section>` stacking event cards (date in Jalali, title, brief
  description, showroom link, optional image). No `Event` JSON-LD
  with bookable slots in Package 1 — static content only.

- **Showroom-visit intake form** — embedded within `/showrooms/[slug]`
  and reachable from `/contact`. Layout: `<FormField>` composition
  with: name, phone (PhoneInput), preferred showroom (Select),
  preferred date window (free-text textarea), message. Submissions
  land as leads. No calendar, no availability check, no staff
  assignment — Package 3 territory.

### States checklist

For every interactive component, design and implement:

- Default
- Hover (desktop only)
- Focus-visible (keyboard) — always a 2px offset ring in
  `--color-charcoal`
- Active / pressed
- Disabled
- Loading
- Error
- Empty (for lists)
- **RTL mirror check** (does the visual still read correctly with
  `dir="rtl"`?)

---

## 9. Accessibility

- WCAG 2.2 AA minimum.
- All interactive elements reachable by keyboard.
- Focus order matches visual order **under RTL**, which means tab
  order moves right → left. Tested in `/lab` with a Persian
  speaker, not just inferred.
- Skip-to-content link in the header.
- All motion respects `prefers-reduced-motion`.
- All form fields have visible labels (no placeholder-as-label).
- All images have alt text or `alt=""` for decorative.
- Color is never the sole carrier of meaning.
- Semantic HTML always: `<nav>`, `<main>`, `<article>`, `<section>`
  with headings.
- `lang="fa"` on `<html>`. Inline `<span lang="en">` on Latin runs
  longer than a word so screen readers switch voice.
- Operator apps additionally support keyboard shortcuts for the
  most-frequent flows; shortcuts are listed in
  `admin-panels.md` once Discovery determines them.

---

## 10. RTL acceptance checklist

Every PR that touches a visual component runs through this list. CI
enforces the easy items (logical properties only); a human reviews
the rest in `/lab`.

- [ ] No `margin-left` / `margin-right` / `padding-left` / `padding-right`
      / `left` / `right` / `text-align: left|right` in custom CSS.
      Use logical properties or Tailwind logical utilities.
- [ ] All directional icons (chevrons, arrows, carets) flip under
      `dir="rtl"`.
- [ ] All layout-mirror components (cards, splits, breadcrumbs) read
      correctly when reversed.
- [ ] Focus order under keyboard navigation moves right → left.
- [ ] No Persian text inside `text-transform: uppercase`.
- [ ] No `font-style: italic` on Persian runs.
- [ ] Persian digits in display, ASCII digits in inputs/storage.
- [ ] Money via `<MoneyDisplay>`, dates via `<DateDisplay>`.
- [ ] Latin runs wrapped in `<LtrRun>` (or a `<span dir="ltr">`).
- [ ] Test in Chrome, Safari, Firefox, and at least one Iranian
      mobile browser (in-app browsers from instant messengers count).

---

## 11. Tooling

- **Figma** is the source of visual truth until Storybook is set up
  in Package 1. The Figma file uses RTL layouts as the canonical
  artboards; LTR mirror artboards are reference-only.
- **Storybook** holds every component with all states **and an RTL
  toggle**, used by both design and engineering.
- **Tokens** are exported from Figma via Tokens Studio → JSON →
  consumed by Tailwind v4 `@theme`.
- **Visual regression:** Chromatic on every PR after Package 1, with
  RTL captures as a separate baseline.
- **Lab:** `/lab/type`, `/lab/motion`, `/lab/color` are where new
  Persian type pairings, motion patterns, and color treatments are
  tried before they enter the design system. See `lab.md`.

---

## 12. Open design questions

These need answers before Package 1 design closes:

1. ~~**Persian type lock.**~~ **LOCKED — Ayandeh** (4 weights: Light,
   Regular, Bold, Black). Self-hosted TTF files in repo. One family
   covers both display and body roles.
2. ~~**Persian display vs body face.**~~ **RESOLVED — single family.**
   Ayandeh Black/Bold for display, Regular for body, Light for
   captions/secondary.
3. **Logo lockup.** Persian-only "ژیک" wordmark, Latin-only "Zhic",
   or stacked. Stamps and printed factors need a clear answer.
4. **Photography sourcing.** In-house photographer in Hamedan vs
   commission per collection. Discovery should surface what the
   business already does.
5. **Custom cursor.** Keep on storefront only? Drop entirely as an
   accessibility risk? `/lab` test with a Persian-speaker focus
   group.
6. **Page transitions.** Full-page veil (current default) or
   in-place content swap. RTL veil direction (top-down works the
   same; left-right mirrors).
7. **Saffron vs gold.** Saffron (`#C68A2E`) is the current pick to
   ground the palette in an Iranian visual reference. Brand sign-off
   pending.
8. **Operator-app theme.** Do operator apps stay on ivory + charcoal,
   or do they get a slightly cooler / higher-contrast variant for
   long working sessions? Decision after Package 3 user testing.
