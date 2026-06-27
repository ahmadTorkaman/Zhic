# Iron bed occupancy split — design spec

**Date:** 2026-06-26
**Status:** Approved (pending spec review) — execute all changes in one batch later.
**Scope:** Iron design only (pilot). Establishes a provisional convention to refine
design-by-design across the catalog.

## Problem

`/bedroom-set/teen/iron` and `/bedroom-set/double/iron` must show occupancy-correct
content, and arriving at the bed from a given occupancy should show only that
occupancy's bed sizes:

- **(a)** Only teen pieces on the teen page / double pieces on the double page.
- **(b)** Only teen bed sizes (۹۰/۱۰۰/۱۲۰) on the teen bed PDP; only double sizes
  (۱۴۰/۱۶۰/۱۸۰) on the double bed PDP.

Today there is **one** bed product `iron-bed` (id 414) carrying all 6 sizes, and it
sits in both the teen and double curated lists. Every iron piece is tagged for both
`teen` and `double`, so the occupancy tag alone cannot differentiate the pages — the
only real teen/double difference for iron is the **bed size**.

## Chosen approach: split the bed into two products

Model the teen bed and the double bed as **separate products**, the way baby/bunk beds
are already modeled across the catalog (`تخت نوزاد`, `تخت دوطبقه`, `تخت نوزاد دومنظوره`)
and the way `parla` already splits `تخت نوجوان پارلا` / `تخت دو نفره پارلا`.

This solves (a) and (b) for the bed **purely through existing CMS curation** — no new
schema, no per-variant occupancy field, no `?occupancy=` URL param, no PDP filtering
logic, no canonical/SEO context handling. Each curated combo list points at its own bed
product, and each bed PDP renders only its own size variants. The rejected alternative
(one bed product + variant-level occupancy filter + context param) would have been the
inconsistent hybrid (baby/bunk as products, but teen/double filtered in-product).

**Convention adopted (provisional):**
- Teen bed name `تخت نوجوان {design}`, double bed name `تخت دو نفره {design}`.
- Explicit slugs `{design}-bed-teen` / `{design}-bed-double`; the legacy `{design}-bed`
  slug is retired and 301-redirected.

## Source data (current `iron-bed`, id 414)

| Field | Value |
|---|---|
| name / slug / sku | تخت آیرون / `iron-bed` / `iron-bed` |
| piece_type | bed |
| base_price_rials | 600,980,000 (= 60,098,000 تومان) |
| sale_price | none |
| availability | in_stock |
| lead_time_days / warranty / after_sales | 14 / 5 / 5 |
| dimensions (W×H×D cm) | 160 × 110 × 215 |
| tagline / short_desc / long_desc / specs | all empty / none |
| status / featured / inquiry_enabled | published / false / true |
| categoryIds | [20, 21] |
| tagIds | [2] |
| gallery (media ids, in order) | [503, 506, 507, 539, 541, 540] |
| materialIds | none |
| own pairsWith | [416 پاتختی آیرون] |
| own relatedProducts | [424, 416, 421, 420, 413, 415] |

Variants (size axis):

| Variant id | sku | label | Δ rials | img | display_order | → goes to |
|---|---|---|---|---|---|---|
| 317 | iron-bed-size-90 | اندازه: ۹۰ | 0 | 506 | 0 | **teen** |
| 315 | iron-bed-size-100 | اندازه: ۱۰۰ | 0 | 506 | 10 | **teen** |
| 316 | iron-bed-size-120 | اندازه: ۱۲۰ | 0 | 507 | 20 | **teen** |
| 311 | iron-bed-size-140 | اندازه: ۱۴۰ | 107,310,000 | 503 | 30 | **double** |
| 312 | iron-bed-size-160 | اندازه: ۱۶۰ | 107,310,000 | 503 | 40 | **double** |
| 313 | iron-bed-size-180 | اندازه: ۱۸۰ | 107,310,000 | 503 | 50 | **double** |

## The change-set (execute as one batch)

### C1 — Create `iron-bed-teen`
- name `تخت نوجوان آیرون`, slug `iron-bed-teen`, sku `iron-bed-teen`, piece_type `bed`.
- **occupancies: [teen]** (only).
- base_price_rials **600,980,000** (60,098,000 تومان).
- Copy from 414: availability, lead_time_days(14), warranty(5), after_sales(5),
  dimensions(160×110×215), status(published), inquiry_enabled(true), featured(false),
  categoryIds[20,21], tagIds[2], gallery[503,506,507,539,541,540], own pairsWith[416],
  own relatedProducts[424,416,421,420,413,415].
- Variants (Δ from the 600,980,000 base, all 0):
  - `iron-bed-teen-size-90` (اندازه: ۹۰, img 506, order 0)
  - `iron-bed-teen-size-100` (اندازه: ۱۰۰, img 506, order 10)
  - `iron-bed-teen-size-120` (اندازه: ۱۲۰, img 507, order 20)

### C2 — Create `iron-bed-double`
- name `تخت دو نفره آیرون`, slug `iron-bed-double`, sku `iron-bed-double`, piece_type `bed`.
- **occupancies: [double]** (only).
- base_price_rials **708,290,000** (70,829,000 تومان = the old ۱۴۰ price, 600,980,000 + 107,310,000).
- Copy the same shared fields/relations from 414 as C1.
- Variants (Δ from the 708,290,000 base, all 0):
  - `iron-bed-double-size-140` (اندازه: ۱۴۰, img 503, order 0)
  - `iron-bed-double-size-160` (اندازه: ۱۶۰, img 503, order 10)
  - `iron-bed-double-size-180` (اندازه: ۱۸۰, img 503, order 20)

### C3 — Repoint the 12 incoming references (414 → both new beds)
Replace product 414 with **both** `iron-bed-teen` and `iron-bed-double` in:
- `iron-nightstand` (416) `pairsWithProductIds`
- `relatedProductIds` of: 424, 416, 421, 420, 413, 415, 418, 423, 419, 422, 581 (11 pieces)

(Each affected list grows by one entry; the PDP "related" row shows the first 4, which is
acceptable. The old bed became two beds, so anything that referenced "the iron bed" now
references both.)

### C4 — Update the two curated combo lists
- `series-occupancies` teen/iron (id 13): swap `iron-bed` (414) → `iron-bed-teen`,
  keeping its list position. The other 11 pieces stay.
- `series-occupancies` double/iron (id 12): swap `iron-bed` (414) → `iron-bed-double`,
  keeping its list position. The other 11 pieces stay.

### C5 — Delete the old product + add the redirect
- Delete product `iron-bed` (414) and its 6 variants (after C3/C4 repointing).
- Add to `apps/web/next.config.ts` `redirects()`:
  `{ source: '/products/iron-bed', destination: '/products/iron-bed-double', permanent: true }`.

### C6 — No other frontend changes
Series grids render curated lists; each PDP renders its own variants — (a)/(b) resolve
from data. `stripDesignName` already renders the cards as «تخت نوجوان» / «تخت دو نفره».

## Mechanism

- Apply C1–C4 via a one-off Payload Local API script
  `services/api/scripts/split-iron-bed.mts` (mirrors existing `reconcile-*.mts`), run
  under **Node 22** (`~/.nvm/.../v22.x`; box default Node 24 breaks Payload scripts).
- C5 redirect is a code edit; C5 deletion can be in the same script (run after repointing).
- Then `pnpm -C apps/web build` + `pm2 restart zhic-web` (needed for the redirect; ISR
  series/PDP pages then reflect the new data — re-poll to bust any stale ISR entry).

## Verification (after batch execution)

- `/products/iron-bed-teen` → shows sizes ۹۰/۱۰۰/۱۲۰ only, base 60,098,000 تومان.
- `/products/iron-bed-double` → shows sizes ۱۴۰/۱۶۰/۱۸۰ only, base 70,829,000 تومان.
- `/products/iron-bed` → 301 → `/products/iron-bed-double`.
- `/bedroom-set/teen/iron` «قطعات سرویس» → bed card reads «تخت نوجوان» (not the double).
- `/bedroom-set/double/iron` «قطعات سرویس» → bed card reads «تخت دو نفره».
- No product references id 414 anymore (products_rels, series_occupancies_rels = 0 rows).
- No dangling/404 pages; the other 11 iron pieces unchanged on both combo pages.

## Deferred (flagged, not silently dropped)

- **Importer** [`services/api/scripts/import-catalog.mts`](../../../services/api/scripts/import-catalog.mts)
  still models one merged bed; a full re-import would recreate `iron-bed`. Updating the
  importer to the split convention belongs to the catalog-wide rollout, not this pilot.
- **`آینه قدی رگال آیرون` (581)** duplicate-mirror oddity stays untouched.
- **Non-bed teen/double differentiation** (if any iron piece should be teen-only or
  double-only beyond the bed) is left for the per-design refinement pass.
- **`parla`'s half-finished split** (`تخت دو نفره پارلا` has no slug/variants) is out of
  scope here; fix it during rollout.

## Risks

- Deleting 414 before repointing would orphan 12 relations → C3/C4 must run before C5.
- New SKUs (`iron-bed-teen`, `iron-bed-double`, and variant SKUs) must be unique; the old
  `iron-bed*` SKUs free up on deletion, so no collision.
- Redirect only takes effect after rebuild+restart.
