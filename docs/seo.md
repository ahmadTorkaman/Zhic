# SEO Playbook

The Zhic SEO bible. Two audiences read this:

1. The engineer building templates and the CMS — to know what fields,
   tags, and APIs must exist.
2. The marketer writing Persian content — to know how to create pages
   that actually rank in Google.ir and inside Iran.

If a recommendation here conflicts with the design system, the design
system wins for visual decisions but SEO wins for structural ones
(headings, semantics, URLs, metadata, language attributes).

This document covers `apps/web` (the Persian-first storefront). The
operator apps (`apps/crm`, `apps/erp`, `apps/mes`, `apps/factor`) are
behind authentication, fully `noindex`, and not part of SEO planning.

---

## 1. SEO posture

Zhic is a high-consideration Iranian furniture brand. The site is
**a real e-commerce storefront from Package 2 onward** — customers can
buy through it — but a meaningful share of conversions still happen in
showrooms via leads, walk-ins, and phone calls. SEO is graded by:

- **Qualified traffic to product pages** (impressions on Persian
  product queries, CTR, time on page).
- **Showroom appointments and inquiries** sourced from organic.
- **Online orders** sourced from organic (Package 2+).

We compete in Persian, on Google.ir, primarily for Iranian customers.
We do **not** compete on English queries, do not chase international
SEO, and do not maintain any English mirror.

We compete for:

- **Brand queries** ("ژیک", "ژیک تخت", "Zhic" Latin form) — must
  always rank #1.
- **Product queries** ("تخت‌خواب گردو", "تخت کینگ کتان") — must rank
  in the top 3 for hero models.
- **Editorial queries** ("نگهداری از کتان", "تفاوت گردو و بلوط",
  "چیدمان اتاق خواب کوچک") — won via the Persian journal, top 5 is
  the goal.
- **Local queries** ("شوروم تخت‌خواب تهران", "گالری مبلمان همدان")
  — won via per-showroom `LocalBusiness` schema, per-location pages,
  and Google Business Profile + Neshan / Balad listings.

We do not compete on price-comparison queries, generic "خرید مبلمان"
unbranded volume, or affiliate-style listicles.

---

## 2. Technical SEO baseline

These items must be present from Package 1 onward. They are
non-negotiable and enforced in CI.

### 2.1 Language & direction

- `<html lang="fa-IR" dir="rtl">` on every storefront page. The
  layout sets it once; no per-route override.
- Long Latin runs (brand mentions, SKUs, code samples) wrap in
  `<span lang="en" dir="ltr">` so screen readers and language
  detection both behave.
- No `hreflang` annotations — the site is single-locale. Schemas keep
  `(L)` markers for forward compatibility but no second locale ships.
- `inLanguage: "fa-IR"` on all JSON-LD that supports it (`Article`,
  `WebSite`, `Event`, `Product`).

### 2.2 Metadata

- Every route exports `generateMetadata` returning at minimum:
  `title`, `description`, `alternates.canonical`, `openGraph`,
  `twitter`, `robots`, `other: { 'og:locale': 'fa_IR' }`.
- A site-wide `metadataBase` is set in the root layout.
- Title template: `"%s — ژیک"` (configurable in
  `siteSettings.defaultMetaTitle`).
- Default OG image: 1200×630, generated per page where useful via
  `opengraph-image.tsx` (Next/OG). The image renders Persian text
  with the same self-hosted Persian face used on the site (Estedad /
  Vazirmatn) — never falls back to a Latin face for Persian copy.
- All meta titles and descriptions are written in Persian.
- ASCII-only slugs (see `sitemap.md` §1) so titles in SERPs read
  cleanly without percent-encoding.

### 2.3 URLs

See `sitemap.md` for the conventions. Enforced rules:

- Lowercase, hyphenated, ASCII slugs even on Persian content.
- No trailing slash, no query params in canonical.
- `?utm_*` and faceted filter params stripped from canonicals.
- Slug renames trigger automatic 301 redirects via the `redirects`
  collection (see `data-schemas.md` §4).
- 404s served from a branded Persian page; never a Next default.

### 2.4 Sitemap & robots

- `app/sitemap.ts` generates from CMS data, including `lastmod` from
  each document's `updatedAt` and `priority` / `changefreq` per
  collection.
- Sitemap is split if it exceeds 10,000 URLs (sitemap index).
- `app/robots.ts` allows everything except `/admin`, `/api`,
  `/preview`, `/lab`, `/account/*`, `/checkout/*`, `/cart`,
  `/login*`, and `/order/*`. The cart, checkout, and account
  subtrees are explicitly disallowed because indexing them leaks
  signed tokens and confuses crawlers.
- The sitemap generator skips any route matching the same disallow
  list.
- `robots.txt` references the sitemap URL.
- Submitted to Google Search Console and Bing Webmaster Tools.

### 2.5 Structured data (JSON-LD)

Emitted server-side as `<script type="application/ld+json">` blocks.

| Page type | Schema |
| --- | --- |
| Site-wide root | `Organization`, `WebSite` (with `SearchAction` if `/search` ships post-Package-2) |
| Home | `Organization` (no `LocalBusiness` here — the homepage is brand-level) |
| Showroom index | `ItemList` of all `LocalBusiness` entries |
| Showroom detail | `LocalBusiness` (`FurnitureStore` subtype), `BreadcrumbList` |
| Product detail | `Product` with real `Offer` (Package 2+, see §2.5.1) or guidance pricing (Package 1), `BreadcrumbList`, optional `3DModel` |
| Product index | `CollectionPage`, `BreadcrumbList` |
| Article | `Article` (`inLanguage: "fa-IR"`), `BreadcrumbList` |
| Journal index / archives | `Blog`, `CollectionPage` |
| Event detail | `Event`, `BreadcrumbList`, `inLanguage: "fa-IR"` |
| FAQ block | `FAQPage` |
| About | `AboutPage` |
| Contact | `ContactPage` |
| Press page | `CollectionPage` |

Every JSON-LD payload is validated in CI against schema.org via
`structured-data-testing-tool` or equivalent. PRs fail on invalid
schema.

#### 2.5.1 `Product` JSON-LD across packages

The `Product` payload is the most-changed schema between packages:

- **Package 1 (inquiry mode):** `offers` is a single `Offer` with
  `priceCurrency: "IRR"`, `price: <basePriceRials>`,
  `priceValidUntil: null`, `availability` mapped from the
  `availability` enum, `url` pointing at the inquiry CTA. Marked
  `priceSpecification` only.
- **Package 2+ (real commerce):** `offers` is a real `Offer` (or
  `AggregateOffer` if variants vary in price) with `url` pointing
  at the canonical product page that has "افزودن به سبد", `seller`
  set to the `Organization`, `availability` mapped from the live
  `availability` field on the variant, and a real
  `priceValidUntil` if the price is on promotion.

`priceCurrency` is always `IRR`. Toman is a display unit only — the
schema uses the storage unit (rial). This is the one place in the
codebase where the rial value escapes to the outside world; it has
to match `commerce.products.basePriceRials` exactly.

### 2.6 Performance (Core Web Vitals)

Budgets enforced in CI via Lighthouse CI on `apps/web` only.
Operator apps have their own, more permissive budgets.

| Metric | Target | Hard fail |
| --- | --- | --- |
| LCP | ≤ 2.0s | > 2.5s |
| INP | ≤ 150ms | > 200ms |
| CLS | ≤ 0.05 | > 0.1 |
| TTFB | ≤ 600ms | > 800ms |
| Total page weight (homepage) | ≤ 1.5 MB | > 2 MB |
| JS on first load (homepage) | ≤ 180 kB | > 250 kB |

CWV is tested **from a non-Iranian PoP** in CI (GitHub Actions
runners are outside Iran). Real-user metrics from inside Iran are
gathered via Plausible's optional event measurement and reviewed
monthly — they will be slower than CI by a meaningful margin.

Tactics:

- Hero video has poster frame, lazy-loaded, `preload="none"` until
  in viewport, reduced-motion fallback.
- All images via `next/image` with explicit `width`/`height`,
  `sizes` attribute, AVIF/WebP, blur placeholder from
  `dominantColor`.
- **Fonts loaded via `next/font/local`** (subsetted to Persian +
  ASCII), `display: swap`, preloaded for the two used weights.
  `next/font/google` is forbidden because Google Fonts is
  intermittently blocked from Iran.
- GSAP imported per-component, not globally; tree-shaken.
- No client components above the fold unless interactive.
- Third-party scripts: there are none except self-hosted Plausible,
  which is a single ~1 KB script. No GA4, no Tag Manager, no GTM
  containers, no Facebook Pixel.
- The 3D viewer is **click-to-load**, not auto-loaded. It cannot
  become the LCP element.
- GIFs pause when off-screen via `IntersectionObserver`.

### 2.7 Indexability

- Drafts and previews always send `noindex, nofollow`.
- Faceted filter URLs (`/products?material=linen`) are
  `noindex, follow` and canonical to the unfiltered page.
- Pagination uses `rel="next"`/`rel="prev"` link tags and unique
  meta.
- `/search` pages are `noindex, follow` (post-Package-2).
- `/cart`, `/checkout/*`, `/account/*`, `/order/*`, `/login*` are
  `noindex, nofollow`.
- Legal pages are indexed but with `priority: 0.1` in the sitemap.

### 2.8 Mobile-first

The Iranian audience is overwhelmingly mobile, including over
in-app browsers (Telegram, Eitaa, Bale, Instagram). The storefront
is built mobile-first, tested in real Iranian mobile browsers, and
budgeted for slow networks.

- Tap targets ≥ 44px.
- No hover-only affordances; tap equivalents for everything.
- No font sizes below 14px.
- Test in: Chrome Android, Safari iOS, and at least one in-app
  browser per release.

---

## 3. Per-template SEO checklist

Every template ships with this checklist green before merge.

### Home

- [ ] H1 present, exactly one (Persian).
- [ ] Meta title ≤ 60 chars (Persian).
- [ ] Meta description ≤ 160 chars (Persian).
- [ ] OG image 1200×630, < 200 kB, Persian text rendered with the
      Persian web font.
- [ ] `Organization`, `WebSite` JSON-LD. **No `LocalBusiness`** — the
      homepage is brand-level, not location-level.
- [ ] LCP element identified and preloaded (hero text or image).
- [ ] At least one internal link to /products, /journal, and
      /showrooms.
- [ ] `lang="fa-IR"`, `dir="rtl"` set on `<html>`.

### Product detail

- [ ] H1 = product Persian name.
- [ ] Meta title `"{name} — {tagline} — ژیک"`, fallback if no
      tagline.
- [ ] Meta description = short Persian description, ≤ 160 chars.
- [ ] OG image = cover at 1200×630 (Next/OG composes Persian frame).
- [ ] `Product` JSON-LD with all required fields, real `Offer` from
      Package 2 onward (`priceCurrency: "IRR"`, `price:
      <basePriceRials>`, `seller: Organization`, `availability`).
- [ ] `BreadcrumbList` JSON-LD.
- [ ] Persian alt text on every gallery image, GIF, and 3D model.
- [ ] 3D viewer is **click-to-load**. Poster image is real, branded,
      eager.
- [ ] glTF is draco-compressed, ≤ 2 MB. USDZ ≤ 8 MB.
- [ ] GIFs have explicit width/height to avoid CLS, and only loop
      while in-viewport.
- [ ] At least 3 internal links: collection, related products,
      journal.
- [ ] Structured specs (dimensions, materials) in semantic `<dl>`.
- [ ] Price displayed in toman with Persian digits via
      `<MoneyDisplay>`. The `Product` JSON-LD price is rial integer.

### Showroom detail

- [ ] H1 = showroom Persian name.
- [ ] `LocalBusiness` (or `FurnitureStore`) JSON-LD with `name`,
      `image`, `address` (Iranian fields, Persian and Latin
      transliteration both acceptable), `geo`, `telephone` (E.164),
      `openingHoursSpecification`, `url`, `sameAs` (Google Business
      Profile + Neshan / Balad if listed).
- [ ] `BreadcrumbList` JSON-LD.
- [ ] NAP (name / address / phone) consistent with the matching
      Google Business Profile.
- [ ] Embedded map (Neshan or Google Maps).
- [ ] Inquiry CTA + appointment CTA.
- [ ] Internal link to nearest related products / featured products.
- [ ] Hours displayed in Persian digits with Persian day names.

### Article

- [ ] H1 = title (Persian).
- [ ] Meta description = excerpt.
- [ ] OG image = cover image with Persian title overlay.
- [ ] `Article` JSON-LD with `headline`, `author`, `datePublished`,
      `dateModified`, `image`, `publisher`, `inLanguage: "fa-IR"`.
- [ ] `BreadcrumbList`.
- [ ] Auto TOC from H2/H3.
- [ ] At least 2 internal links to products or other articles.
- [ ] All images have Persian alt text.
- [ ] Reading time computed from Persian word count (not character
      count).

### Event

- [ ] `Event` JSON-LD complete with `inLanguage: "fa-IR"`.
- [ ] Date / time displayed in Jalali. ISO 8601 in machine-readable
      attributes.
- [ ] Location with map.

### FAQ block

- [ ] `FAQPage` JSON-LD emitted.
- [ ] Each Q is `<h3>` or `<dt>`.
- [ ] Each A is plain Persian prose, no nested headings.

---

## 4. Content strategy

### 4.1 Pillar topics for the Persian journal

The journal exists to win Persian editorial queries that lead to
product discovery. Initial pillar topics:

1. **مواد و متریال** — کتان، گردو، بلوط، مخمل، پارچه ایرانی.
   Sourcing stories, care, comparisons.
2. **ساخت و کارگاه** — atelier process, joinery, finishing,
   hand-tied details, the Hamedan workshop.
3. **چیدمان** — bedroom design principles, color palettes, lighting,
   small-apartment Iranian solutions.
4. **داستان برند** — origin stories, philosophy, design diary.
5. **خواب و آرامش** — slow mornings, light, mattresses, rituals.

Each pillar gets a category page, a cornerstone long-form article,
and a cluster of 3–5 supporting articles linking back. This is a
textbook hub-and-spoke, in Persian.

### 4.2 Article anatomy

- 1,200–2,500 words for cornerstone articles, 600–1,200 for
  supporting. Persian word count, not character count.
- Cover image, dek, table of contents, 3+ internal links, 1+
  outbound link to a credible source (Iranian or international
  design publication).
- "Featured product" embed where natural, never forced.
- Author bio + related articles at the bottom.
- Updated date (Jalali) on every article; "آخرین به‌روزرسانی"
  surfaces if > 90 days old.

### 4.3 Editorial cadence

- Package 1 launch: 6 articles (2 cornerstones + 4 supporting), all
  Persian. Content authored by the SEO specialist (see §4.5).
- Package 2 onward: 2 articles/month minimum, 1 cornerstone/quarter.
- Calendar lives in admin (see `admin-panels.md` §4).

### 4.4 Persian keyword research

Lightweight: marketing maintains a Google Sheet (or a doc in the
admin once Package 3 lands) linked from the SEO dashboard. Sources:

- Google Search Console (Persian queries with impressions).
- Google Trends (Iran region).
- "People also ask" boxes on Persian SERPs.
- Manual review of top-ranking Persian competitors per query.

Each article's CMS record has a `keywords` array (not rendered)
plus `metaTitle` / `metaDescription` written for the primary Persian
keyword. Search Console performance is reviewed monthly.

ZWNJ matters for Persian keyword matching. "میخواهم" and "می‌خواهم"
are different tokens to many search engines — the editorial
guideline (see `design-system.md` §1.2) is to use ZWNJ consistently.

### 4.5 SEO ownership split (two-track model)

SEO work on Zhic divides into two tracks with separate owners
(per R5 team structure and R12 content-ownership clause):

| Track | Owner | Scope |
| --- | --- | --- |
| **Technical SEO** | **Operator (dev)** | Sitemap generation, JSON-LD, canonical tags, performance budgets, CI checks, structured data, Core Web Vitals, indexability rules, robots/sitemap config, OG image generation, `generateMetadata` wiring, RTL/bidi correctness. |
| **Content / strategy SEO** | **SEO specialist (client-side resource)** | Persian keyword research, content briefs, pillar-page content, journal article topics + drafts, category-page editorial framing, meta title/description copywriting, editorial calendar, quarterly keyword refresh. |

The operator builds templates and places content; the SEO specialist
provides the content and the strategy. This split **must be explicit
in the Package 1 addendum as a contract clause** — if the SEO
specialist does not deliver content on time, the templates ship empty
and the Generous scope's SEO value is unrealised. The operator is not
responsible for writing Persian editorial content.

Additional content owners (per `roadmap.md` content-ownership table):

- **Events page content** → client directly (showroom managers know
  what events are happening).
- **Product copy, showroom details, brand-story editorial** → client
  directly.

---

## 5. Local SEO (Iran)

Zhic operates **several Iranian showrooms**. Each one is a distinct
local entity in Google's eyes and must be treated as such.

- One `showrooms` document per location → one `/showrooms/[slug]`
  page → one `LocalBusiness` (or `FurnitureStore`) JSON-LD block.
- One **Google Business Profile** per location, claimed and managed
  by marketing. NAP consistent between admin, page, and GBP.
  Verification may require a non-Iranian phone number for some
  steps; plan ahead and keep records of the verification artefacts.
- One **Neshan** listing per location (`neshan.org`). Neshan is the
  most-used Iranian map service; it has its own business listings
  and review system.
- Optional **Balad** listing where relevant (another Iranian map
  service).
- `/showrooms` index page emits an `ItemList` referencing every
  location and renders a multi-pin map (Neshan embed preferred,
  Google Maps as fallback).
- Every showroom page includes: address (Persian + auto-Latin
  transliteration for the geo block), map embed, hours, holiday
  hours (Iranian holidays — Nowruz, Sizdah Bedar, etc.), parking,
  transit notes, appointment CTA, inquiry CTA, gallery, optional
  featured products.
- Encourage Google + Neshan reviews via post-appointment SMS (via
  `packages/sms`, Package 3), per location.
- Internal linking: the homepage's footer "شوروم‌ها" column lists
  all showrooms; the contact page links to the showrooms index;
  the journal bio block links to the nearest showroom when an
  article is location-tagged.

> The homepage itself is brand-level, not location-level. It does
> **not** emit `LocalBusiness` schema — that lives on the showroom
> pages where it's accurate. The homepage emits `Organization` only.

We do **not** create per-city doorway pages
(`/tehran-furniture-store`, etc.). Local SEO is handled via real
showroom pages with real `LocalBusiness` schema, not thin landing
pages.

---

## 6. Off-page SEO

Out of scope for the build but documented for marketing:

- PR-driven backlinks (Iranian design publications, lifestyle
  magazines, architecture blogs).
- **Instagram** as the primary discovery channel — every product
  page has an Instagram-share affordance. Iran-friendly: Instagram
  works in Iran via VPN, and the Iranian audience is heavily
  Instagram-active.
- **Telegram** channels — the brand may run a Persian Telegram
  channel. Every article and product page is shareable to Telegram
  with a clean OG image.
- **Pinterest** as a secondary discovery channel where applicable.
- Avoid link-buy schemes and reciprocal-link networks. They poison
  authority.

---

## 7. Analytics & monitoring

The team is in Iran, which makes US-based analytics SaaS unreliable.
The stack is therefore **self-hosted exclusively**.

- **Plausible (self-hosted on Hetzner)** is the only behavioral
  analytics tool. **No GA4** — it is intermittently blocked from
  Iran, adds GDPR friction, and provides no upside for a privacy-
  respecting Iranian brand. Plausible's lightweight script also
  wins on CWV.
- **No Google Tag Manager, no Facebook Pixel, no any third-party
  marketing tag.** Every script we run, we run from our own
  infrastructure.
- **Search Console** for indexation, clicks, impressions, CWV field
  data. Verification may require a non-Iranian phone number for
  some flows; plan ahead.
- **Bing Webmaster Tools** for completeness — Bing is sometimes
  more reliable than Google inside Iran.
- **Glitchtip (self-hosted, Sentry-compatible)** for client-side
  errors that might indicate broken pages.
- All wired in Package 1 behind a consent banner. The consent banner
  is required for EU visitors (Plausible is privacy-friendly but
  the consent UX is still expected) and is good practice for
  Iranian users too.

KPI dashboard surfaces (Package 1+):

- Organic sessions, week-over-week and year-over-year.
- Branded vs non-branded query share (Persian queries).
- Top 10 landing pages.
- Top 10 Persian queries.
- CWV pass rate.
- Indexation coverage (indexed vs submitted).
- **From Package 2:** organic-attributed orders, organic-attributed
  showroom appointments.

---

## 8. Anti-patterns (forbidden)

- Hidden text or keyword stuffing.
- AI-generated articles without human Persian editing.
- Doorway pages, including per-city landing pages.
- Cloaking based on user agent.
- Duplicate product descriptions across pages or across products.
- Infinite-scroll without paginated fallbacks.
- Lazy-loading the LCP image.
- Client-rendered content pages (the HTML must contain the Persian
  words you want to rank for — Googlebot still struggles with
  Persian-rendered-by-JS).
- Modal popups on first paint.
- **Mixing Persian and Arabic characters** — `ي` (Arabic yeh,
  U+064A) instead of `ی` (Persian yeh, U+06CC), or `ك` (Arabic kaf,
  U+0643) instead of `ک` (Persian kaf, U+06A9). The CMS pre-commit
  hook normalizes these. They are different code points, they
  affect search matching, and they look subtly wrong to Persian
  readers.
- **Persian digits in URLs.** ASCII only.
- **Embedding Latin characters in Persian display text without
  `dir="ltr"` wrapping** — bidi mangling kills SERP CTR.
- Any third-party script that loads from a US CDN without
  fallback. Fonts, analytics, embeds — all self-hosted or
  Iran-friendly.

---

## 9. CI checks (must pass on every PR that touches `apps/web`)

- Lighthouse CI: thresholds in §2.6.
- HTML validation: `html-validate` on rendered output.
- Structured data validation on every public route.
- Broken-link check (internal links).
- Image alt-text presence on rendered HTML, with a Persian-content
  warning if alt is suspiciously short or all-Latin.
- Meta title / description length sanity (≤ 60 / ≤ 160 chars
  warning).
- Bundle size budgets.
- `lang="fa-IR"` and `dir="rtl"` on `<html>`.
- Persian/Arabic character normalization on all text fields read
  from the CMS (catches Arabic yeh/kaf at request time).

---

## 10. Quarterly SEO ritual

Marketing + engineering meet quarterly to:

1. Review Search Console Persian queries and identify content gaps.
2. Refresh top 5 most-trafficked articles with updated Persian
   copy.
3. Audit broken links and 404s.
4. Audit Core Web Vitals trend, especially from inside-Iran RUM.
5. Audit competitor SERPs for the top 10 target Persian queries.
6. Update the keyword sheet and the upcoming editorial calendar.
7. Audit each showroom's Google Business Profile + Neshan listing
   for accuracy, hours, recent reviews.
