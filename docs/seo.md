# SEO Playbook

The Zhic SEO bible. Two audiences read this:

1. The engineer building templates and the CMS — to know what fields,
   tags, and APIs must exist.
2. The marketer writing content — to know how to create pages that
   actually rank.

If a recommendation here conflicts with the design system, the design
system wins for visual decisions but SEO wins for structural ones
(headings, semantics, URLs, metadata).

---

## 1. SEO posture

Zhic is a high-consideration, low-volume luxury brand. The site is
**lead-gen, not e-commerce** — every conversion goal ends in an inquiry,
showroom appointment, or trade application, never a checkout. SEO is
graded by qualified inquiries, not orders.

We compete for:

- **Brand queries** ("zhic", "zhic bed") — must always rank #1.
- **Product queries** ("aurora bed", "linen platform bed") — must rank in
  top 3 for hero models.
- **Editorial queries** ("how to style a linen bed", "oak vs walnut bed
  frame") — won via the journal, top 5 is the goal.
- **Local queries** ("luxury bed showroom new york", "boutique bedroom
  furniture {city}") — won via per-showroom `LocalBusiness` schema and
  per-location Google Business Profiles. Zhic operates **several
  showrooms**, each with its own `/showrooms/[slug]` page and its own
  `LocalBusiness` JSON-LD.

We do not compete on price, generic mattress queries, or affiliate-style
listicles.

---

## 2. Technical SEO baseline

These items must be present from Phase 1 onward. They are non-negotiable
and must be enforced in CI.

### 2.1 Metadata

- Every route exports `generateMetadata` returning at minimum:
  `title`, `description`, `alternates.canonical`, `openGraph`,
  `twitter`, `robots`.
- A site-wide `metadataBase` is set in the root layout.
- Title template: `"%s — Zhic"` (configurable in `siteSettings`).
- Default OG image: 1200×630, generated per page where useful via
  `opengraph-image.tsx` (Next/OG).
- `<html lang="en">` always set; `lang` updates with locale in Phase 5.

### 2.2 URLs

See `sitemap.md` for the conventions. Enforced rules:

- Lowercase, hyphenated, no trailing slash, no query params in canonical.
- `?utm_*` stripped from canonicals.
- Slug renames trigger automatic 301 redirects.
- 404s served from a branded page; never a Next default.

### 2.3 Sitemap & robots

- `app/sitemap.ts` generates from CMS data, including `lastmod` from each
  document's `updatedAt` and `priority`/`changefreq` per collection.
- Sitemap is split if it exceeds 10,000 URLs (sitemap index).
- `app/robots.ts` allows everything except `/admin`, `/api`, `/preview`,
  and `/lab`. Even though Payload, the API surface, and the lab also set
  `noindex` at the layout level, robots.txt is the belt-and-braces
  guarantee that crawlers never enter those subtrees in the first place.
- The sitemap generator skips any route matching `^/(admin|api|preview|lab)(/|$)`.
- robots.txt references the sitemap URL.
- Submitted to Google Search Console and Bing Webmaster.

### 2.4 Structured data (JSON-LD)

Emitted server-side as `<script type="application/ld+json">` blocks.

| Page type | Schema |
| --- | --- |
| Site-wide root | `Organization`, `WebSite` (with `SearchAction` if /search ships) |
| Home | `Organization` (no `LocalBusiness` here — homepage is brand-level, not location-level) |
| Showroom index | `ItemList` of all `LocalBusiness` entries |
| Showroom detail | `LocalBusiness` (or `FurnitureStore`), `BreadcrumbList` |
| Product detail | `Product` with guidance pricing only, no checkout `offers` (+ `AggregateRating` if reviews exist), `BreadcrumbList`, optional `3DModel` |
| Product index | `CollectionPage`, `BreadcrumbList` |
| Article | `Article`, `BreadcrumbList` |
| Journal index / archives | `Blog`, `CollectionPage` |
| Event detail | `Event`, `BreadcrumbList` |
| FAQ block | `FAQPage` |
| About | `AboutPage` |
| Contact | `ContactPage` |
| Press page | `CollectionPage` |

Every JSON-LD payload is validated in CI against schema.org via
`structured-data-testing-tool` or equivalent. PR fails on invalid schema.

### 2.5 Performance (Core Web Vitals)

Budgets enforced in CI via Lighthouse CI:

| Metric | Target | Hard fail |
| --- | --- | --- |
| LCP | ≤ 2.0s | > 2.5s |
| INP | ≤ 150ms | > 200ms |
| CLS | ≤ 0.05 | > 0.1 |
| TTFB | ≤ 600ms | > 800ms |
| Total page weight (homepage) | ≤ 1.5 MB | > 2 MB |
| JS on first load (homepage) | ≤ 180 kB | > 250 kB |

Tactics:

- Hero video has poster frame, lazy-loaded, `preload="none"` until in
  viewport, reduced-motion fallback.
- All images via `next/image` with explicit `width`/`height`,
  `sizes` attribute, AVIF/WebP, blur placeholder from `dominantColor`.
- Fonts loaded via `next/font` (already in place), `display: swap`,
  preloaded for the two used weights.
- GSAP imported per-component, not globally; tree-shaken.
- No client components above the fold unless interactive.
- Third-party scripts (GA4) loaded with `next/script strategy="lazyOnload"`,
  after consent.

### 2.6 Indexability

- Drafts and previews always send `noindex, nofollow`.
- Faceted filter URLs (`?material=linen`) are `noindex, follow` and
  canonical to the unfiltered page.
- Pagination uses `rel="next"`/`rel="prev"` link tags and unique meta.
- `/search` pages are `noindex, follow`.
- Legal pages are indexed but `priority: 0.1` in sitemap.

### 2.7 Internationalization

Out of scope. Site is English-only by decision. Schemas keep `(L)` fields
for forward-compatibility but no `hreflang`, no locale prefix, no
per-locale sitemap. Revisit only if business strategy changes.

---

## 3. Per-template SEO checklist

Every template ships with this checklist green before merge.

### Home

- [ ] H1 present, exactly one.
- [ ] Meta title ≤ 60 chars.
- [ ] Meta description ≤ 160 chars.
- [ ] OG image 1200×630, < 200 kB.
- [ ] `Organization`, `LocalBusiness`, `WebSite` JSON-LD.
- [ ] LCP element identified and preloaded (hero text or image).
- [ ] At least one internal link to /products and /journal.

### Product detail

- [ ] H1 = product name.
- [ ] Meta title `"{name} — {tagline} — Zhic"`, fall back if no tagline.
- [ ] Meta description = short description, ≤ 160 chars.
- [ ] OG image = cover image at 1200×630 (Next/OG composes brand frame).
- [ ] `Product` JSON-LD with all required fields. **No checkout `offers`**
      — pricing is guidance, the URL points to the inquiry CTA.
- [ ] `BreadcrumbList` JSON-LD.
- [ ] Image alt text on every gallery image, GIF, and 3D model.
- [ ] 3D viewer is **click-to-load** (not auto-loaded) so it never
      becomes the LCP element. Poster image is real, branded, eager.
- [ ] glTF is draco-compressed, ≤ 2 MB. USDZ ≤ 8 MB.
- [ ] GIFs have explicit width/height to avoid CLS, and only loop while
      in-viewport (use `IntersectionObserver` to pause off-screen).
- [ ] At least 3 internal links: collection, related products, journal.
- [ ] Structured specs (dimensions, materials) in semantic `<dl>`.

### Showroom detail

- [ ] H1 = showroom name.
- [ ] `LocalBusiness` JSON-LD with name, image, address, geo, telephone,
      `openingHoursSpecification`, url, sameAs (Google Business Profile).
- [ ] `BreadcrumbList` JSON-LD.
- [ ] NAP (name/address/phone) consistent with the matching Google
      Business Profile.
- [ ] Embedded map.
- [ ] Inquiry CTA + appointment CTA.
- [ ] Internal link to nearest related products / featured products.

### Article

- [ ] H1 = title.
- [ ] Meta description = excerpt.
- [ ] OG image = cover image.
- [ ] `Article` JSON-LD with `headline`, `author`, `datePublished`,
      `dateModified`, `image`, `publisher`.
- [ ] `BreadcrumbList`.
- [ ] Auto TOC from H2/H3.
- [ ] At least 2 internal links to products or other articles.
- [ ] All images have alt text.
- [ ] Reading time computed and displayed.

### Event

- [ ] `Event` JSON-LD complete.
- [ ] Date / time displayed in user's timezone.
- [ ] Location with map.

### FAQ block

- [ ] `FAQPage` JSON-LD emitted.
- [ ] Each Q is `<h3>` or `<dt>`.
- [ ] Each A is plain prose, no nested headings.

---

## 4. Content strategy

### 4.1 Pillar topics for the journal

The journal exists to win editorial queries that lead to product
discovery. Initial pillar topics:

1. **Materials** — linen, oak, walnut, boucle, brass. Sourcing stories,
   care, comparisons.
2. **Craft** — atelier process, joinery, finishing, hand-tied details.
3. **Style** — bedroom design principles, color palettes, lighting,
   layering linens.
4. **Founder voice** — origin stories, philosophy, design diary.
5. **Sleep & ritual** — slow mornings, light, mattresses, scent.

Each pillar gets a category page, a cornerstone long-form article, and a
cluster of 3–5 supporting articles linking back. This is a textbook hub
and spoke.

### 4.2 Article anatomy

- 1,200–2,500 words for cornerstone, 600–1,200 for supporting.
- Cover image, dek, table of contents, 3+ internal links, 1+ outbound
  link to a credible source.
- "Featured product" embed where natural, never forced.
- Author bio + related articles at the bottom.
- Updated date on every article; "Last updated" surfaces if > 90 days
  old.

### 4.3 Editorial cadence

- Phase 2 launch: 6 articles (2 cornerstones + 4 supporting).
- Phase 3 onward: 2 articles/month minimum, 1 cornerstone/quarter.
- Calendar lives in admin (see `admin-panels.md` §4).

### 4.4 Keyword research

Lightweight: marketing maintains a Google Sheet linked from the SEO
dashboard. Each article's CMS record has a `keywords` array (not rendered)
plus `metaTitle` / `metaDescription` written for the primary keyword.
Search Console performance is reviewed monthly.

---

## 5. Local SEO

Zhic operates **several showrooms**. Each one is a distinct local entity
in Google's eyes and must be treated as such.

- One `showrooms` document per location → one `/showrooms/[slug]` page
  → one `LocalBusiness` JSON-LD block.
- One Google Business Profile per location, claimed and managed by
  marketing. NAP consistent between admin, page, and GBP.
- `/showrooms` index page emits an `ItemList` referencing every location
  and renders a multi-pin map.
- Every showroom page includes: address, map embed, hours, holiday
  hours, parking, transit notes, appointment CTA, inquiry CTA, gallery,
  optional featured products.
- Encourage Google reviews via post-appointment email (Phase 4), per
  location.
- Internal linking: the homepage's footer "Visit" column lists all
  showrooms; the contact page links to the showrooms index; the journal
  bio block links to the nearest showroom when an article is location-
  tagged.

> The homepage itself is brand-level, not location-level. It does **not**
> emit `LocalBusiness` schema — that lives on the showroom pages where
> it's accurate. The homepage emits `Organization` only.

---

## 6. Off-page SEO

Out of scope for the build but documented for marketing:

- PR-driven backlinks (interior design publications, design blogs).
- Pinterest as a discovery channel — every product page has a Pinterest
  share button with a clean OG image.
- Instagram → link in bio routed via UTM-tagged short links managed in
  the redirects collection.
- Avoid link-buy schemes and reciprocal-link networks. They poison
  authority for luxury brands.

---

## 7. Analytics & monitoring

The team is in Iran, which makes US-based analytics SaaS unreliable.
The stack is therefore self-hosted wherever possible.

- **Plausible (self-hosted on Hetzner)** is the only behavioral
  analytics tool. No GA4 — it is intermittently blocked from Iran, adds
  GDPR friction, and is not worth the redundancy for a quiet luxury
  brand. Plausible's lightweight script also wins on CWV.
- **Search Console** for indexation, clicks, impressions, CWV field data.
  Verification may require a non-Iranian phone number for some flows;
  plan ahead.
- **Bing Webmaster Tools** for completeness.
- **Glitchtip (self-hosted, Sentry-compatible)** for client-side errors
  that might indicate broken pages.
- All wired in Phase 1 behind a consent banner. The consent banner is
  still needed because Plausible, even self-hosted, must respect user
  preference under EU rules for EU visitors.

KPI dashboard surfaces:

- Organic sessions, week-over-week and year-over-year.
- Branded vs non-branded query share.
- Top 10 landing pages.
- Top 10 queries.
- CWV pass rate.
- Indexation coverage (indexed vs submitted).

---

## 8. Anti-patterns (forbidden)

- Hidden text or keyword stuffing.
- AI-generated articles without human editing.
- Doorway pages.
- Cloaking based on user agent.
- Duplicate product descriptions across pages.
- Infinite-scroll without paginated fallbacks.
- Lazy-loading the LCP image.
- Client-rendered content pages (the HTML must contain the words you want
  to rank for).
- Modal popups on first paint.

---

## 9. CI checks (must pass on every PR)

- Lighthouse CI: thresholds in §2.5.
- HTML validation: `html-validate` on rendered output.
- Structured data validation on every public route.
- Broken-link check (internal links).
- Image alt-text presence on rendered HTML.
- Meta title / description length sanity (≤ 60 / ≤ 160 chars warning).
- Bundle size budgets.

---

## 10. Quarterly SEO ritual

Marketing + engineering meet quarterly to:

1. Review Search Console queries and identify content gaps.
2. Refresh top 5 most-trafficked articles with updated info.
3. Audit broken links and 404s.
4. Audit Core Web Vitals trend.
5. Audit competitor SERPs for the top 10 target queries.
6. Update the keyword sheet and the upcoming editorial calendar.
