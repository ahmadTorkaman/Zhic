# Session 6.1 — SEO Foundations

## Context

All pages and the inquiry form are shipped (Phases 1–5). Session 6.1
consolidates the SEO surface: metadata standardization, missing JSON-LD,
sitemap/robots/manifest, and OG image generation. The site is feature-
complete for Month 1 — this session makes it search-engine-ready.

## Authority

`docs/spec/seo.md` (primary) → `package1-month1.md` §SEO foundations →
`docs/sessions.md` §6.1.

## Entry state

- All 26+ public routes have `generateMetadata` (static or dynamic).
  Missing: `alternates.canonical`, `robots`, `twitter` on all of them.
  Root layout has no `metadataBase`.
- Root layout uses `lang="fa"` — spec requires `lang="fa-IR"`.
- Home page emits no JSON-LD — needs Organization + WebSite (FU-3.1-d).
- All other JSON-LD types are rendered on correct pages.
- `lib/jsonld.ts` has 12 helpers. Missing: `websiteJsonLd`.
- No `sitemap.ts`, `robots.ts`, or `manifest.ts`.
- No OG image generation.
- Ayandeh font files in `apps/web/src/assets/fonts/`.

## Scope decisions

### In scope (Month 1 exit criteria)

| Item | Justification |
|---|---|
| `metadataBase` + `lang="fa-IR"` fix in root layout | seo.md §2.1, §2.2 |
| `sitemap.ts` with CMS data + priority/changefreq | seo.md §2.4, exit criteria |
| `robots.ts` with disallow list | seo.md §2.4, exit criteria |
| `manifest.ts` (PWA metadata) | sessions.md §6.1 deliverable |
| Organization + WebSite JSON-LD on home | FU-3.1-d, exit criteria |
| Standardize all `generateMetadata` (canonical, robots, twitter) | seo.md §2.2, exit criteria |
| OG image generation (home, product, article) | seo.md §2.2, exit criteria |

### Deferred

| Item | Deferred to | Justification |
|---|---|---|
| CMS `seo` group fields on collections | Post-6.1 | Schema change + per-route wiring; current computed metadata sufficient for Month 1; keep FU-1.3-b |
| Lighthouse CI thresholds | Session 7.1 | CI infrastructure concern |
| Structured data CI validation | Session 7.1 | CI infrastructure concern |
| `Event` JSON-LD on events page | Post-6.1 | Sitemap says "no Event JSON-LD" in Pkg 1 |
| Faceted filter canonical (noindex on `/products?material=x`) | Post-6.1 | Low priority pre-launch |
| `<span lang="en" dir="ltr">` wrapping for Latin text | 6.3 polish | Style-level concern |

## Deliverables

### Step 1 — Root layout metadata fix

**`apps/web/src/app/layout.tsx`** — MODIFY

- Change `lang="fa"` → `lang="fa-IR"`
- Add `metadataBase: new URL(SITE_URL)` to root metadata
- Add root-level `openGraph: { locale: 'fa_IR', siteName: 'ژیک' }`
- Add root-level `twitter: { card: 'summary_large_image' }`
- Title template: `{ template: '%s — ژیک', default: 'ژیک — مبلمان خواب دست‌ساز' }`

### Step 2 — `robots.ts`

**`apps/web/src/app/robots.ts`** — NEW

Per seo.md §2.4:
```
User-Agent: *
Allow: /
Disallow: /admin
Disallow: /api
Disallow: /preview
Disallow: /lab
Disallow: /account
Disallow: /checkout
Disallow: /cart
Disallow: /login
Disallow: /order
Sitemap: ${SITE_URL}/sitemap.xml
```

### Step 3 — `sitemap.ts`

**`apps/web/src/app/sitemap.ts`** — NEW

Generates entries from:
- Static routes (/, /products, /showrooms, /journal, /contact, /about,
  /atelier, /care, /faq, /events, /privacy, /terms, /returns,
  /shipping-and-delivery) with hardcoded priority/changefreq
- Dynamic routes from Payload API:
  - `/products/[slug]` — fetch product slugs
  - `/collections/[slug]` — fetch collection slugs
  - `/categories/[slug]` — fetch category slugs
  - `/showrooms/[slug]` — fetch showroom slugs
  - `/journal/[slug]` — fetch article slugs (status=published)
  - `/journal/category/[slug]` — fetch journal category slugs
  - `/journal/tag/[slug]` — fetch tag slugs

Priority map: home=1.0, products/journal=0.9, showrooms/categories=0.8,
editorial=0.6, legal=0.1.
Skip: /thank-you, /lab/*.

### Step 4 — `manifest.ts`

**`apps/web/src/app/manifest.ts`** — NEW

PWA manifest: name "ژیک", short_name "ژیک", description, theme_color
from design tokens, background_color, display "standalone", start_url "/",
icons placeholder.

### Step 5 — Home page Organization + WebSite JSON-LD

**`apps/web/src/lib/jsonld.ts`** — MODIFY
- New `websiteJsonLd({ name, url })` helper

**`apps/web/src/app/(site)/page.tsx`** — MODIFY
- Import and render `organizationJsonLd` + `websiteJsonLd` as script tags
- Closes FU-3.1-d

### Step 6 — Standardize all `generateMetadata`

Update every route's metadata to include:
- `alternates: { canonical: '${SITE_URL}/path' }`
- `twitter: { card: 'summary_large_image' }` (inherited from root for
  most; explicit where OG image differs)

With `metadataBase` set in root, the title template handles `%s — ژیک`,
so individual routes only need the page-specific title (not ` — ژیک`
suffix). Update all routes that currently append the suffix manually.

Routes to update: `/` (home), `/products`, `/products/[slug]`,
`/collections/[slug]`, `/showrooms`, `/showrooms/[slug]`, `/journal`,
`/journal/[slug]`, `/journal/category/[slug]`, `/journal/tag/[slug]`,
`/categories/[slug]`, `/about`, `/atelier`, `/care`, `/contact`, `/faq`,
`/events`, `/privacy`, `/terms`, `/returns`, `/shipping-and-delivery`,
`/thank-you`.

For `/thank-you`: ensure `robots: { index: false, follow: false }` (noindex).

### Step 7 — OG image generation

**`apps/web/src/lib/og.tsx`** — NEW

Shared OG image utility:
- `createOgImage({ title, subtitle? })` → `ImageResponse` (1200×630)
- Loads Ayandeh Bold font from `assets/fonts/Ayandeh Bold.ttf`
- Renders: brand-colored background + Persian title + optional subtitle
- Brand: dark background (#1C1917 charcoal) + ivory text + accent stripe

Route-level OG files:
- **`apps/web/src/app/(site)/opengraph-image.tsx`** — home OG: brand tagline
- **`apps/web/src/app/(site)/products/[slug]/opengraph-image.tsx`** — product
  name + tagline
- **`apps/web/src/app/(site)/journal/[slug]/opengraph-image.tsx`** — article
  title + category

### Step 8 — Update state.md

- Mark 6.1 ✅
- Close FU-3.1-d (Organization + WebSite on home)
- Note FU-1.3-b, FU-3.2-f, FU-3.3-i remain open (CMS seo group deferred)
- Log new follow-ups

## Exit check

- [ ] `pnpm --filter @zhic/web typecheck` passes
- [ ] `pnpm --filter @zhic/web lint` passes (0 errors)
- [ ] `pnpm --filter @zhic/web test` passes
- [ ] `pnpm --filter @zhic/web build` passes
- [ ] Root layout has `lang="fa-IR"` + `metadataBase`
- [ ] `/robots.txt` renders with correct disallow list
- [ ] `/sitemap.xml` renders with static + dynamic routes
- [ ] `/manifest.webmanifest` renders
- [ ] Home page emits Organization + WebSite JSON-LD
- [ ] All routes have `alternates.canonical`
- [ ] Title template works (pages show "PageTitle — ژیک")
- [ ] OG images render at 1200×630 with Persian text
- [ ] `docs/state.md` updated: 6.1 ✅, FU-3.1-d closed

## Critical files

| File | Action |
|---|---|
| `apps/web/src/app/layout.tsx` | Fix lang, add metadataBase + root OG |
| `apps/web/src/app/robots.ts` | New |
| `apps/web/src/app/sitemap.ts` | New |
| `apps/web/src/app/manifest.ts` | New |
| `apps/web/src/app/(site)/page.tsx` | Add Organization + WebSite JSON-LD |
| `apps/web/src/lib/jsonld.ts` | New websiteJsonLd helper |
| `apps/web/src/lib/og.tsx` | New — shared OG image utility |
| `apps/web/src/app/(site)/opengraph-image.tsx` | New — home OG |
| `apps/web/src/app/(site)/products/[slug]/opengraph-image.tsx` | New — product OG |
| `apps/web/src/app/(site)/journal/[slug]/opengraph-image.tsx` | New — article OG |
| All 21 route `page.tsx` files | Standardize metadata (canonical, title template) |

## Verification

1. `pnpm --filter @zhic/web typecheck && pnpm --filter @zhic/web lint`
2. `pnpm --filter @zhic/web test`
3. `pnpm --filter @zhic/web build` — check route map + sitemap/robots in output
4. Local dev server: inspect `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`
5. View source on any page: verify `<html lang="fa-IR">`, meta tags, JSON-LD
6. Google Rich Results Test on home/PDP/article pages (requires deployed URL)
