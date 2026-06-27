# Lotus bed occupancy split — design spec

**Date:** 2026-06-26
**Status:** Approved (pending spec review) — batch with the iron split, execute all at once later.
**Scope:** Lotus design only. Second instance of the teen/double bed-split convention.
**Convention & rationale:** identical to
[2026-06-26-iron-bed-occupancy-split-design.md](2026-06-26-iron-bed-occupancy-split-design.md)
— split the merged bed into `…-bed-teen` / `…-bed-double` products, curate each combo to
its own bed, retire+redirect the legacy slug. This doc lists only lotus's concrete values.

## Why lotus needs it (same shape as iron)

- One merged bed `lotus-bed` (id 461) carries all 5 sizes and sits in **both** combos.
- All 11 lotus pieces are tagged for **both** `teen` and `double` → occupancy tag can't
  differentiate the pages; the bed size is the only real teen/double difference.
- Size split confirmed by the price-delta jump: **teen 90/100/120** (Δ0), **double
  140/160** (Δ +51,390,000). Same boundary as iron, only 2 double sizes (no ۱۸۰).

## Source data (current `lotus-bed`, id 461)

| Field | Value |
|---|---|
| name / slug / sku | تخت لوتوس / `lotus-bed` / `lotus-bed` |
| piece_type | bed |
| base_price_rials | 468,930,000 (= 46,893,000 تومان) |
| sale_price | none |
| availability | in_stock |
| lead_time_days / warranty / after_sales | 14 / 5 / 5 |
| dimensions (W×H×D cm) | 160 × 110 × 215 |
| tagline / short_desc / long_desc / specs | all empty / none |
| status / featured / inquiry_enabled | published / false / true |
| categoryIds | [21, 20] |
| tagIds | [2] |
| gallery (media ids, in order) | [690, 694, 733, 734, 692] |
| materialIds | none |
| own pairsWith | [463 nightstand, 459 bed-guard] |
| own relatedProducts | [459, 470, 463, 467, 466, 460] |

Variants (size axis):

| Variant id | sku | label | Δ rials | img | order | → goes to |
|---|---|---|---|---|---|---|
| 355 | lotus-bed-size-90 | اندازه: ۹۰ | 0 | 694 | 0 | **teen** |
| 353 | lotus-bed-size-100 | اندازه: ۱۰۰ | 0 | 694 | 10 | **teen** |
| 354 | lotus-bed-size-120 | اندازه: ۱۲۰ | 0 | 733 | 20 | **teen** |
| 350 | lotus-bed-size-140 | اندازه: ۱۴۰ | 51,390,000 | 690 | 30 | **double** |
| 351 | lotus-bed-size-160 | اندازه: ۱۶۰ | 51,390,000 | 690 | 40 | **double** |

## The change-set (execute as one batch, after the iron batch or alongside)

### C1 — Create `lotus-bed-teen`
- name `تخت نوجوان لوتوس`, slug `lotus-bed-teen`, sku `lotus-bed-teen`, piece_type `bed`.
- **occupancies: [teen]**.
- base_price_rials **468,930,000** (46,893,000 تومان).
- Copy from 461: availability(in_stock), lead(14), warranty(5), after_sales(5),
  dimensions(160×110×215), status(published), inquiry(true), featured(false),
  categoryIds[21,20], tagIds[2], gallery[690,694,733,734,692],
  own pairsWith[463,459], own relatedProducts[459,470,463,467,466,460].
- Variants (Δ from the 468,930,000 base, all 0):
  - `lotus-bed-teen-size-90` (اندازه: ۹۰, img 694, order 0)
  - `lotus-bed-teen-size-100` (اندازه: ۱۰۰, img 694, order 10)
  - `lotus-bed-teen-size-120` (اندازه: ۱۲۰, img 733, order 20)

### C2 — Create `lotus-bed-double`
- name `تخت دو نفره لوتوس`, slug `lotus-bed-double`, sku `lotus-bed-double`, piece_type `bed`.
- **occupancies: [double]**.
- base_price_rials **520,320,000** (52,032,000 تومان = 468,930,000 + 51,390,000).
- Copy the same shared fields/relations from 461 as C1.
- Variants (Δ from the 520,320,000 base, all 0):
  - `lotus-bed-double-size-140` (اندازه: ۱۴۰, img 690, order 0)
  - `lotus-bed-double-size-160` (اندازه: ۱۶۰, img 690, order 10)

### C3 — Repoint the 12 incoming references (461 → both new beds)
Replace product 461 with **both** `lotus-bed-teen` and `lotus-bed-double` in:
- `pairsWithProductIds` of: 459 (bed-guard), 463 (nightstand)
- `relatedProductIds` of: 459, 460, 462, 463, 465, 466, 467, 468, 469, 470 (10 pieces)

### C4 — Update the two curated combo lists
- teen/lotus (id 19): swap `lotus-bed` (461) → `lotus-bed-teen`, keep list position.
- double/lotus (id 18): swap `lotus-bed` (461) → `lotus-bed-double`, keep list position.
- The other 7 pieces stay shared in both.

### C5 — Delete old product + add redirect
- Delete product `lotus-bed` (461) and its 5 variants (after C3/C4).
- Add to `apps/web/next.config.ts` `redirects()`:
  `{ source: '/products/lotus-bed', destination: '/products/lotus-bed-double', permanent: true }`.

### C6 — No other frontend changes
Series grids render curated lists; each PDP renders its own variants. `stripDesignName`
renders the cards as «تخت نوجوان» / «تخت دو نفره».

## Mechanism

Same as iron: fold C1–C5 into the one-off Payload Local API migration script (run under
Node 22), add the redirect line, then build + restart + verify. Can share a single script
with iron (`split-occupancy-beds.mts`) iterating a per-design config, or a sibling script.

## Verification

- `/products/lotus-bed-teen` → sizes ۹۰/۱۰۰/۱۲۰ only, base 46,893,000 تومان.
- `/products/lotus-bed-double` → sizes ۱۴۰/۱۶۰ only, base 52,032,000 تومان.
- `/products/lotus-bed` → 301 → `/products/lotus-bed-double`.
- `/bedroom-set/teen/lotus` bed card reads «تخت نوجوان»; `/bedroom-set/double/lotus` reads «تخت دو نفره».
- No product/series ref points at id 461 anymore. Other 7 combo pieces unchanged.

## Deferred (same as iron)

- Importer not updated (re-import would recreate `lotus-bed`).
- Non-bed teen/double differentiation left for the per-design refinement pass (lotus combos
  currently share the same 8 pieces).
- Lotus pieces outside the combos (bed-guard, wall-mirror, wall-shelf) untouched.
