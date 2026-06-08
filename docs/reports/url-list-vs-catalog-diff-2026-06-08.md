# URL List vs Live Catalog — Reconciliation Report

**Date:** 2026-06-08
**Source A (URL plan):** `imports/zhicwood-url-list.xlsx` — Sheet1 = product URLs, Sheet2 = category URLs
**Source B (live catalog):** local Payload API (`localhost:3001`) on `feat/pre-import-refactors`
**Live snapshot:** 285 products · 36 categories · 26 designs · 226 product-variants

---

## Reconciliation progress (applied 2026-06-08)

Backup: `~/zhic-catalog-backups/2026-06-08-1517/` (all collections as JSON). Mutation scripts: `services/api/scripts/reconcile-0*.mts` (idempotent, `DRY=1` to preview).

- ✅ **Stage 1 — Mirror rename** applied: category `table-mirror`→`console-vanity-mirror`, 20 product slugs + 7 variant SKUs. Verified 0 stale.
- ✅ **Stage 2 — Bed merge** applied: 23 series merged single+double → one `{series}-bed` with `size=` axis (90–120 single / 140–180 double), category = union. 16 records deleted, 101 variants re-pointed, prices preserved exactly. Products 285→269. (Mixed-status note: baloot/loof/sento had one draft side; merged→published.)
- ⏸ **Stage 3 — 7 suffix SKUs:** NO catalog change needed — base products already carry the variant (e.g. `caroline-vanity` has `drawers=6`). Spec-side cleanup only. `iron-standing-mirror` has 2 unlabeled variants (the "regal" axis isn't encoded) — flag.
- ✅ **Stage 4 — Convertibles** applied: 8 `{series}-convertible-bed` → per-conversion products (`-teen`/`-sofa`), conversion moved from axis into slug, `finish` axis kept, names suffixed (نوجوان/کاناپه‌ای). caroline split into teen (new #579) + sofa (#326).
- ✅ **Stage 5 — bed-jack** created: draft skeleton #580 (price 0, size=100/120 variants, `bed-jack` category). Assigned to a new generic `general` design (no media → stays out of the /bedroom-set carousel). **Schema flag:** complement items are series-less but `Products.design` is required — decide later whether to make `design` optional for complements rather than lean on `general`.

### ✅ Convergence verified
After collapsing the 7 variant-suffix URLs, **spec product slugs (271) == live product slugs (271), zero diff either direction.** The catalog now matches the URL-list spec exactly.

### Remaining spec-doc (xlsx) errata — catalog already correct
The category tree in the catalog is already right; these are cleanups for the source spreadsheet `imports/zhicwood-url-list.xlsx` Sheet2 if it stays a living doc:
- Drop trailing slashes on `/bedroom-furniture/display/` and `/bedroom-furniture/complement/`.
- Add `/bedroom-furniture/bed/bunk` (category exists live as `bunk`).
- Drop the 7 collapsed product URLs (`*-6d`, `*-5d`, `*-1d`, `*-drawer`, `*-regal`) — they are variant axes, not URLs.
- `iron-standing-mirror` has 2 unlabeled variants; if "regal" is a real option, add a `style=` axis.

## TL;DR

The URL plan and the live catalog describe the **same inventory**. The raw slug diff is large (60 only-in-sheet, 67 only-in-live) but **collapses to one genuinely missing product** plus a set of naming/modeling decisions to ratify. Bedroom-set taxonomy is 100% aligned. The two decisions that gate everything else:

1. **`table-mirror` vs `console-vanity-mirror`** (affects 1 category + ~23 products)
2. **Bed modeling:** one PDP with `size=` attribute (sheet) vs split `{series}-single-bed` + `{series}-double-bed` products (live) — 23 series

---

## 1. Bedroom-set taxonomy — ✅ fully aligned (zero gaps)

- 26 sheet series == 26 live designs (no extras on either side)
- All 50 `/bedroom-set/{age}/{series}` leaf URLs are backed by live product occupancy data
- Ages match: `baby`, `teen`, `double`, `bunk`, `montessori`

> ⚠️ Caveat — **13 beds are still `draft`** and would 404 on a live series page that links to them:
> `baloot-double-bed`, `catherine-single/double-bed`, `classic-single/double-bed`, `eliza-single/double-bed`, `loof-double-bed`, `roco-single/double-bed`, `romantic-single/double-bed`, `sento-double-bed`.
> (122 of 285 products total are `draft`.)

## 2. Bedroom-furniture taxonomy — ⚠️ 2 issues (36 vs 36)

| Issue | Sheet2 | Live category | Resolution |
|---|---|---|---|
| Naming conflict | `/mirror/console-vanity-mirror` | `/mirror/`**`table-mirror`** | pick canonical (see Decision 1) |
| Missing from sheet | — | `/bed/`**`bunk`** exists live | add to URL list |

> Also: trailing-slash inconsistency in Sheet2 — `/bedroom-furniture/display/` and `/bedroom-furniture/complement/` carry trailing slashes; siblings don't. Normalize.

## 3. Products — 3 systematic naming/modeling divergences (NOT missing items)

These explain ~95% of the raw product diff. Same products, different slugs:

### 3a. `console-vanity-mirror` (sheet) ↔ `table-mirror` (live) — ~23 products
Same conflict as the category in §2. **Highest-impact decision** — touches one category and every series' table-mirror product. See Decision 1.

### 3b. `convertible-teen` / `convertible-sofa` (sheet) ↔ `convertible-bed` (live)
Sheet encodes the conversion target in the slug; live uses one slug + a `conversion=` attribute. Reconcile to the live single-slug model (keep `conversion=` as a variant axis), and ensure the URL list does not mint per-conversion URLs (per the no-per-variant-URL SEO rule).

### 3c. Beds: `{series}-bed` (sheet) ↔ `{series}-single-bed` + `{series}-double-bed` (live)
A real **data-modeling difference**, not a rename. Sheet collapses sizes onto one PDP with a `size=` attribute; the catalog ships separate single/double products. 23 series affected; several have only one side published. See Decision 2.

## 4. Genuinely missing / needs a call (8 spreadsheet-only slugs)

| Slug (sheet) | Live counterpart | Verdict |
|---|---|---|
| **`bed-jack`** | **NONE** | 🔴 **Real gap.** Category `/complement/bed-jack` + two SKUs (`size=100`, `size=120`) exist in the plan, but no product record. Create it. |
| `caroline-vanity-6d` | `caroline-vanity` | variant suffix (drawer count) — confirm collapse |
| `roco-vanity-5d` | `roco-vanity` | variant suffix — confirm collapse |
| `catherine-console-1d` | `catherine-console` | sheet lists a 5-drawer + a 1-drawer console; live has one — confirm |
| `gandom-file-6d` | `gandom-file` | variant suffix — confirm collapse |
| `sento-file-6d` | `sento-file` | variant suffix — confirm collapse |
| `skate-bookcase-drawer` | `skate-bookcase` | sheet lists both — confirm collapse |
| `iron-standing-mirror-regal` | `iron-standing-mirror` | "regal" variant — confirm |

Net real-product gap: **`bed-jack` only.** The other 7 are URL-suffix variants the catalog collapses to a base product — verify none are lost SKUs.

## 4b. /bedroom-set ?age= filter + media audit (task 5)

Two coupled data problems behind the mis-assigned age filters:

**Problem A — missing `occupancyMedia` posters.** Designs declare age tabs (`occupancies`) but lack the per-age poster image. Coverage matrix (✓ ok · = n/a, NEED = tab w/o poster):

| design | baby | teen | double | bunk |
|---|---|---|---|---|
| caroline | NEED | ✓ | ✓ | · |
| loof | ✓ | ✓ | · | · |
| lukaplus | · | ✓ | ✓ | · |
| parla | ✓ | ✓ | NEED | ✓ |
| **22 other designs** | — | — | — | — | (declared tabs, **zero posters**) |

Totals: **41 age-tabs missing a poster; only 2 designs (loof, lukaplus) fully covered.**

**Problem B — product occupancy over-tagging.** Whole series are blanket-tagged (every `sento-*` = baby+double+teen; every `parla-*` = all 4 ages). 89 products carry 3+ occupancies. Visually confirmed wrong against parla's set scenes: the **bunk** scene is only the bunk bed, the **baby** scene has no study desk, the **teen** scene adds the study desk — so `parla-study-desk` should be teen(+double), not baby/bunk.

**Method validated, but blocked on source media.** Occupancy is readable from the per-age **set-scene** image — which is also exactly the missing `occupancyMedia` poster. So A and B converge: obtaining the per-age set scene fixes both. **However**, those scenes exist for only **4 designs** (caroline, loof, lukaplus, parla — `bedroom-set-{design}-{age}-card.webp`); the other ~22 designs have **no set scenes anywhere** in the imports (`showrooms-zhic.zip` is plain showroom photos; the WordPress/other archives have none). → the visual audit can be completed now for those 4 designs; the remaining 22 are blocked on the 3D artist/client producing per-age set scenes.

### ✅ Applied 2026-06-08 (Stage 6)

- **Problem A (the 4 scened designs): already resolved.** All 9 set-scenes that exist are wired into `occupancyMedia`. The only remaining gaps among the 4 are **caroline/baby** and **parla/double** — and those scenes *do not exist as source media either*, so they are artist gaps, not wiring gaps. loof + lukaplus are 100% covered.
- **Problem B (re-tag): applied for the 4 designs** via `services/api/scripts/reconcile-06-occupancy-retag.mts` (idempotent, `DRY=1`). **45 products** re-tagged from blanket age sets to scene-accurate occupancies. Backup: `~/zhic-catalog-backups/2026-06-08-1657-pre-occupancy/`. Examples: `parla-bunk-bed` → `[bunk]` only; `parla-study-desk` → `[teen]`; every other `parla-*` lost the bogus `bunk` tag; vanity/mirror groups → the age whose scene shows them (caroline/lukaplus = double, loof = teen); `*-changing-*`, `*-bed-guard` → `[baby]`.
  - caroline/loof/lukaplus have a scene for **both** declared ages → fully adjudicated. parla is missing its `double` scene → only high-confidence calls applied; `double` left intact (no scene to disprove it).
  - ⚠️ **Latent, not user-visible:** `product.occupancies` has **no live consumer** — every age filter on the storefront (carousel tabs, `/bedroom-set/{age}` hubs, mega-menu counts, series-page badges) reads **`design.occupancies`/`occupancyMedia`**, which were already correct. This was a data-correctness pass that primes the (currently unwired) `ProductsQuery.occupancies` filter; no rendered page changed.
- **Step 2 (the 22 blocked designs): request list produced** → `docs/reports/bedroom-set-scene-requests-2026-06-08.md` (41 assets, the same set that fills the 41 poster gaps).

## 5. Decisions required

**Decision 1 — Mirror slug.** Canonical = `table-mirror` or `console-vanity-mirror`? Apply to the category and all ~23 products consistently. (Live currently uses `table-mirror`.)

**Decision 2 — Bed model.** One PDP + `size=` attribute (sheet), or split single/double products (live)? Determines whether 13 split-bed records get merged or the sheet gets expanded.

---

## Appendix — method

Reconciliation normalized known synonyms (`console-vanity-mirror`↔`table-mirror`, `convertible-teen`/`sofa`↔`convertible-bed`, drawer-count suffixes) and bed single/double splits before diffing. Live data pulled from `/api/products?limit=500&depth=1`, `/api/categories`, `/api/designs`. Bedroom-set leaf URLs validated against actual product `occupancies`.
