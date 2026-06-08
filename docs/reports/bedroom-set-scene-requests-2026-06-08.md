# Bedroom-set per-age scene requests — 3D artist

**Date:** 2026-06-08
**Owner:** operator → 3D artist (client-side resource)
**Context:** `docs/reports/url-list-vs-catalog-diff-2026-06-08.md` §4b · [[project_zhic_url_list_reconciliation]]

## What is needed

One **per-age set-scene render** for every (design × age) cell listed below — **41 assets**.
Each asset is a collage/scene of *that age's* bedroom configuration for *that design*
(the same style as the existing `bedroom-set-parla-baby-card.webp` etc.).

**File name:** `bedroom-set-{design}-{age}-card.webp`
(ages: `baby`, `teen`, `double`, `bunk` — ASCII, lower-case).
**Aspect:** portrait, 1200 × 1707 (matches the 9 existing scenes).

Each asset does **double duty**:
1. It becomes the design's `occupancyMedia` poster for that age tab on
   `/bedroom-set` (fixes the 41 missing-poster gaps — Problem A).
2. It is the **ground truth** we read product occupancy from — each scene must
   show *only the furniture that belongs to that age's set*, because that is how
   we re-tag which products appear under each age (Problem B).
   ⇒ **Important:** stage each scene with the correct pieces only. e.g. the baby
   scene must NOT include a study desk; the bunk scene shows only the bunk bed
   set; the double scene shows the double-bed configuration.

## Already done (reference scenes — match this look)

These 9 exist and are wired; **do not re-request.** loof and lukaplus are 100% covered.

| design | scenes that exist |
|---|---|
| caroline | double, teen |
| loof | baby, teen ✅ complete |
| lukaplus | double, teen ✅ complete |
| parla | baby, bunk, teen |

## Request list — 41 assets

### Priority 1 — finish the 2 partially-covered designs (2 assets)
These designs are live with most posters; one age tab each currently has no art.

| design | age | filename |
|---|---|---|
| caroline | baby | `bedroom-set-caroline-baby-card.webp` |
| parla | double | `bedroom-set-parla-double-card.webp` |

### Priority 2 — 3-age designs (4 designs × 3 = 12 assets)

| design | ages | filenames |
|---|---|---|
| baloot | baby, teen, double | `bedroom-set-baloot-{baby,teen,double}-card.webp` |
| catherine | baby, teen, double | `bedroom-set-catherine-{baby,teen,double}-card.webp` |
| elizabeth | baby, teen, double | `bedroom-set-elizabeth-{baby,teen,double}-card.webp` |
| sento | baby, teen, double | `bedroom-set-sento-{baby,teen,double}-card.webp` |

### Priority 3 — 2-age designs (9 designs = 18 assets)

| design | ages |
|---|---|
| classic | teen, double |
| eliza | teen, double |
| iron | teen, double |
| jacqueline | teen, double |
| lotus | teen, double |
| roco | teen, double |
| romantic | teen, double |
| verna | teen, double |
| skate | baby, teen |

### Priority 4 — single-age designs (9 designs = 9 assets)

| design | age |
|---|---|
| adrian | bunk |
| nikan | bunk |
| bw | teen |
| elegance | teen |
| mocha | teen |
| gandom | baby |
| celine | double |
| lorena | double |
| shaylin | double |

**Total: 2 + 12 + 18 + 9 = 41 assets.**

## After delivery — wiring steps (operator)

1. Upload each `bedroom-set-{design}-{age}-card.webp` to Media.
2. Wire into `designs.occupancyMedia[]` (occupancy → image) — extend
   `reconcile-06`'s pattern or a small upload script.
3. Re-tag that design's products from the new scene (same method as
   `services/api/scripts/reconcile-06-occupancy-retag.mts`): a product's
   `occupancies` = the ages whose scene it appears in.
4. Verify the `?age=` tab on `/bedroom-set` cross-dissolves to the new poster.

---

## Addendum — per-product photo requests (from media audit 2026-06-08)

Separate from the per-age set scenes above. Source: `docs/reports/product-media-audit-2026-06-08.md`.
These are wrong/missing single-product images that need a correct render:

| product | needed | current (wrong) |
|---|---|---|
| `parla-bed-box` | the **under-bed storage drawer/box** (باکس تخت) | crib + cabinet shots (none correct) |
| `loof-bed-box` | the under-bed storage box | storage-shelf cabinet / crib |
| `caroline-bed-box` | the under-bed storage box | a small nightstand-like cabinet |
| `skate-study-desk` | the **actual desk** | only a wall hutch is shown |
| `celine-console-vanity-mirror` | a proper console+mirror shot | a tight corner crop (poor quality) |
| `elegance-standing-mirror` | a real **full-length floor mirror** | currently a round wall mirror (which belongs to `elegance-wall-mirror`) — see audit F5 |
