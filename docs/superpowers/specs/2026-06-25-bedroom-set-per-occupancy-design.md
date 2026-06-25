# Per-occupancy bedroom-set pages — design

**Date:** 2026-06-25
**Status:** Approved design → ready for implementation plan
**Route family:** `/bedroom-set/[occupancy]/[series]` (e.g. `/bedroom-set/teen/iron`)

---

## Problem

Every occupancy view of a series renders the **same page**. `/bedroom-set/teen/iron`
and `/bedroom-set/double/iron` are byte-identical: same products, same hero, same
copy, same materials. Concretely, in `getSeriesHubContent`:

- products come from `fetchProducts({ design: slug })` with **no occupancy filter**,
  even though `Products.occupancies` exists and goes unused here;
- every other zone (hero, intro, story, materials, details) reads `design.*`;
- `ageFilter` only changes the subtitle and which sibling links are hidden;
- sibling cards are **auto-generated** (`img: null`, hard-coded hrefs) — not editable,
  no media;
- the occupancy pages canonicalize to the bare `/bedroom-set/[series]` URL and are
  treated as non-indexed facets.

The operator needs each `(series × occupancy)` to be its **own page** with a
**dedicated CMS panel**: its own curated products and content, plus **editable
series-sibling cards** (links + attached media), all in the same template.

This duplication affects **every series**, not just `iron`.

---

## Decisions (locked with operator, 2026-06-25)

1. **Fully independent per `(design × occupancy)`**, with **inherit-by-default**:
   a blank override field falls back to the `Designs` base. Shared things
   (materials, story, hero) stay shared unless deliberately overridden. "Be reasonable."
2. **SEO — auto-promote when differentiated.** A combo becomes its own
   indexable, self-canonical, sitemap-listed page **only once it is published and
   differentiated** (has ≥1 curated product or any content override). Otherwise it is
   `noindex` and absent from the sitemap.
3. **Products — manual curation only.** Each combo explicitly lists + orders its
   own products (the «قطعات سرویس» row). No auto-by-tag filtering.
4. **Bare `/bedroom-set/[series]` page removed.** It 301-redirects to the design's
   first occupancy combo — defined as the **first entry in the design's `occupancies[]`
   array** — or to the `/bedroom-set` hub if the design has no occupancy.
5. **Un-authored combos degrade gracefully.** Until a panel is published, the combo
   URL still renders, inheriting the design's base content (hero/intro/story/materials)
   with an **empty product section**, marked `noindex` and kept out of the sitemap. The
   occupancy hub links it normally; it **auto-upgrades** to a full indexable page once a
   panel is published. Nothing 404s on cutover.
6. **Sibling cards are editable** — an array of `{ image, kicker, name, link }` per
   combo. When left blank, they **auto-generate** from this design's other occupancies
   (today's behavior, now with optional art).

---

## Architecture

### New collection — `SeriesOccupancies`

- **slug:** `series-occupancies`
- **label:** «سرویس خواب (طرح × گروه)» / plural «سرویس‌های خواب (طرح × گروه)» *(renameable)*
- **admin group:** «کاتالوگ»
- **access:** `publishedContentAccess` (same as Designs/Products)
- **the document *is* the page** — one row per `(design, occupancy)` the operator builds.

**Identity / behavior**

| Field | Type | Notes |
|---|---|---|
| `design` | relationship → `designs` **(required)** | which series |
| `occupancy` | select `baby/teen/double/bunk` **(required)** | which occupancy |
| `status` | select `draft/published` (default `draft`) | gates publishing + index (editor-only update, mirrors Products) |
| `publishedAt` | date | sidebar |

A `beforeValidate`/`beforeChange` hook **enforces uniqueness of the `(design, occupancy)`
pair** and sets a virtual admin title «{design.name} — {occupancyLabel}» (via
`admin.useAsTitle` on a computed `title` text field populated in the hook, or a custom
`admin.components` cell — implementation detail for the plan).

**Products (manual curation)**

| Field | Type | Notes |
|---|---|---|
| `products` | relationship → `products`, `hasMany`, **ordered** | the «قطعات سرویس» row, in operator order |

**Content overrides — all optional; blank ⇒ inherit from `Designs`**

| Field | Type | Inherits from (when blank) |
|---|---|---|
| `heroMedia` | upload | `design.heroMedia ?? sliderMedia ?? gallery[0]` |
| `subtitle` | text | `design.tagline` |
| `introTitle` | text | `design.introTitle` |
| `introBody` | textarea | `design.introBody` |
| `introMedia` | upload | `design.introMedia` |
| `storyBody` | textarea | `design.storyBody` |
| `storyMedia` | upload | `design.storyMedia` |
| `materialCallouts` | array `{ image, label, sub }` | `design.materialCallouts` (← "materials are the same" default) |
| `designDetails` | array `{ image, label, description, span }` | `design.designDetails` |

> Override semantics: a field is "overridden" only when **non-empty**. Empty array =
> inherit; empty text = inherit. This keeps the operator from re-entering shared content.

**Sibling cards (editable)**

| Field | Type | Notes |
|---|---|---|
| `siblings` | array `{ image(upload), kicker(text), name(text), link(text) }` | editable cross-link bands. **Blank array ⇒ auto-generate** from this design's other occupancies, as today (now with optional media) |

**SEO**

- Reuse the shared `seoFields` group (optional metaTitle/description/ogImage/canonical/noindex),
  consistent with Products/Articles/Categories.

---

### Resolution / inheritance rules

A single resolver `resolveSeriesOccupancy(combo, design, products)` overlays the combo
doc onto the design base and produces the existing **`SeriesHubContent`** shape, so the
template + all section components (`SeriesDetailHero`, `SeriesCollection`,
`SeriesMaterials`, `SeriesDesignDetails`, `SeriesSiblings`, `SeriesLinkCard`) render
unchanged.

- **hero** = `combo.heroMedia` ?? design hero chain
- **title.subtitle** = `combo.subtitle` ?? `design.tagline` ?? occupancy label
- **intro / story / materials / details** = combo field if non-empty, else design field
- **collection.items** = `combo.products` (ordered, curated). Empty ⇒ the
  `SeriesCollection` section is **hidden** (new conditional in `SeriesHubBody`)
- **siblings** = `combo.siblings` if non-empty, else auto-generated from the design's
  other occupancies (current logic, retained)

**Differentiated** (drives SEO) := `status === 'published'` **and**
(`combo.products.length > 0` **or** any content-override field is non-empty).

---

### Route + web changes

- **`apps/web/src/lib/payload.ts`**
  - `PayloadSeriesOccupancy` type.
  - `fetchSeriesOccupancy(occupancy, series)` — the `(occupancy, design.slug)` doc, depth 2.
  - `fetchPublishedSeriesOccupancies()` — published+differentiated docs, for the sitemap.
- **`apps/web/src/lib/series-hub-content.ts`**
  - New `getSeriesOccupancyContent({ occupancy, series })` returning
    `{ content: SeriesHubContent; differentiated: boolean } | null`. Reuses the existing
    mappers; products now come from the curated list (empty when un-authored); siblings
    from the combo or the auto-default. Old `getSeriesHubContent(slug, ageFilter)` is
    retired/refactored into this.
- **`apps/web/src/app/(site)/bedroom-set/[slug]/[series]/page.tsx`**
  - Resolve `(occupancy=[slug], series=[series])` → render via the new getter.
  - Metadata: **self-canonical + `index`** when `differentiated`, else `noindex`
    (canonical self). Drops the "canonical → bare series" behavior.
- **`apps/web/src/app/(site)/bedroom-set/[slug]/page.tsx`**
  - Occupancy-hub branch: **unchanged**.
  - Bare-series branch (non-occupancy slug): **removed** → 301 to the design's first
    occupancy combo, else `/bedroom-set`. Legacy `?age=` redirect retained.
- **`apps/web/src/components/series-hub/SeriesHubBody.tsx`**
  - Render `SeriesCollection` only when `collection.items.length > 0`.
- **`apps/web/src/app/sitemap.ts`**
  - Replace the `/bedroom-set/{design.slug}` loop with one emitting
    `/bedroom-set/{occupancy}/{design.slug}` for every published+differentiated combo
    (priority ~0.75). Bare series URLs no longer emitted.
- **Occupancy hub content** (`lib/occupancy-hub-content.ts`): **unchanged** — graceful
  fallback means every linked combo renders.

### CMS / data

- Register `SeriesOccupancies` in `services/api/src/payload.config.ts`.
- **Migration** under `services/api/src/migrations/` — create the table + join/array
  tables (products m2m, `siblings`/`materialCallouts`/`designDetails` arrays, upload
  FKs, `occupancy` select). Heed the documented **Payload 3 hasMany persistence quirk**
  for select/array fields (handoff-2026-05-23).
- Regenerate `services/api/src/payload-types.ts` (`payload generate:types`).
- Document the collection in `docs/spec/data-schemas.md`.

---

## Non-goals / out of scope

- No change to the `Products.occupancies` tag field (left as-is; unused by this route now).
- No change to the occupancy-hub template or its roster source.
- No data backfill of existing content into combos — inheritance makes that unnecessary;
  the operator authors combos incrementally.
- Cart/commerce work (separate in-flight plan) is untouched.

## Rollout

1. Ship schema + migration + graceful-fallback rendering. Live site keeps working;
   all combos render inherited base content (noindex), bare series redirects.
2. Operator authors combos one at a time (curate products + overrides + siblings,
   publish). Each publish auto-promotes that combo to an indexable, sitemap-listed page.

## Verification

- `pnpm -C services/api generate:types` clean; migration applies on a scratch DB.
- `/lab` preview of an authored vs un-authored combo.
- Build (`pnpm -C apps/web build`) passes; sitemap shows combo URLs, no bare-series URLs.
- Spot-check: `teen/iron` ≠ `double/iron` once both authored; metadata `index` only when
  differentiated; bare `/bedroom-set/iron` redirects.

## Open items

- Final collection name/label (default `series-occupancies` / «سرویس خواب (طرح × گروه)»).
