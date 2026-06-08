# Product media & tagging audit — 2026-06-08

**Scope:** all 271 products / 950 media / 26 designs on `feat/pre-import-refactors`.
**Method:** deterministic structural pass (whole catalog) + multi-agent visual sweep
(29 agents, **459 in-use images viewed**, every image judged against its product's
canonical `product_type` from `imports/zhicwood-url-list.xlsx` Sheet1).
**Status:** REPORT ONLY — nothing changed. Canonical reference = the xlsx.

---

## 0. Key convention discovered (reclassifies ~10 visual findings)

Every design carries a **`vanity`** product *and* a separate **`console-vanity-mirror`**
(and usually a **`standing-mirror`**). So this furniture line models a dressing table as
**two SKUs**:
- **`vanity`** = the **drawer-chest / dresser base** (no mirror, no kneehole).
- **`console-vanity-mirror`** = the **mirror** that pairs with it (a framed mirror).
- **`standing-mirror`** = the full-length floor mirror.

⇒ Visual-sweep flags of the form "vanity shows a chest of drawers, no mirror" and
"console-vanity-mirror shows just a mirror" are **correct depictions of the convention,
NOT wrong images.** They are listed in §4 (Likely-not-bugs) pending your confirmation.

---

## 1. Confirmed mistakes — structural (deterministic)

| # | Issue | Count | Detail / proposed fix |
|---|---|---|---|
| S1 | Product `sku` still `*-table-mirror` | **20** | Stage-1 mirror rename updated slugs + variant SKUs but missed the product-level `sku`. Canonical slug is `console-vanity-mirror` → rename SKUs to match. |
| S2 | Media filenames still `*-table-mirror*.webp` on `console-vanity-mirror` products | ~20 | Same root cause as S1. Cosmetic but inconsistent with canonical. |
| S3 | Product has 0 media but its image is orphaned | **6** | `loof-study-chair`, `iron-study-chair`, `caroline-study-chair`, `bw-study-chair` ← their own `*-study-chair-picture.webp`; (`skate-vanity`, `lukaplus-vanity-chair` fuzzy). Attach. |
| S4 | Garbage-named orphan import media | ~9 | `file 5 kesho.webp`, `console 2 kesho-1.webp`, etc. (spaces + "kesho"). Rename or delete. |

**Systematic gaps:**
- **`piece_type` empty on all 271 products** — but Sheet1 has canonical `product_type` for every slug → clean populate job.
- **Alt text empty on all 459 in-use images** — a11y + SEO (CLAUDE.md).

---

## 2. Confirmed mistakes — visual (genuine wrong/swapped/missing images)

| # | Product | Problem | Sev | Fix |
|---|---|---|---|---|
| V1 | **elegance-standing-mirror** | Image is a round **wall** mirror, not a floor standing mirror. elegance is the only design with a separate `wall-mirror` product → likely the two mirror images are **swapped**. | high | swap with `elegance-wall-mirror` |
| V2 | **elegance-nightstand** | Primary image is a **vanity+mirror**, not a nightstand. `elegance-nightstand-v2.webp` is the correct nightstand. | high | drop/replace primary |
| V3 | **skate-study-desk** | Only image is a wall **hutch** (`...-hutch.webp`), no actual desk shown. | high | source/attach the desk photo |
| V4 | **sento-vanity** | `-with-mirror` and plain `-3-drawers` images are **swapped** (the plain one shows the mirror, the with-mirror one doesn't). | med | swap filenames/order |
| V5 | **parla-bed-box** | 4 images are internally inconsistent: 2 show a baby **crib**, 2 show a **cabinet/chest** — none is a clear bed-box. | high | see Q (bed-box convention) |
| V6 | **loof-bed-box** | Studio shots show a **storage-shelf cabinet**; scene shots show the **crib**. Inconsistent. | high | see Q |
| V7 | **caroline-bed-box** | Shows a small **nightstand-like cabinet**, not a bed box. | low | see Q |
| V8 | **shaylin-loveseat** | Shows a backless **bench/ottoman**, not a loveseat (2-seat sofa). | high | see Q (loveseat) |

## 3. Variant-label mismatches (filename/attribute vs image)

| Product | Claim | Actual |
|---|---|---|
| jacqueline-wardrobe | `2-doors` | shows **3 doors** (both studio + open) |
| jacqueline-vanity | `3-drawers` | shows **4 drawers** |
| baloot-vanity (v2) | `4-drawers` | shows **6 drawers** |
| caroline-vanity (6-drawers) | — | wide 6-drawer dresser (vanity base; OK per convention) |
| lukaplus-vanity | `4-drawers` | looks like **3** (ambiguous) |
| **loof colorway block** | `-cream` | lifestyle shots show the **green/sage** colorway: `loof-wardrobe` (×3), `loof-vanity`, `loof-nightstand` (×2), `loof-display-cabinet` (×2), `loof-cream-kid-…-wardrobe` |
| loof-console-vanity-mirror | `-green` | frame is plain oak, **no green** |
| loof-changing-top | `-green` | tray is plain wood, no green |
| bw-wardrobe | `-mdf` | scene shows **glass** doors, not white MDF |

→ Recommend reconciling these against the actual `product-variants` axes (the filename token is
often just lifestyle styling; the variant axis is the source of truth). Mostly low user-impact.

## 4. Likely-NOT-bugs (convention §0) — confirm to dismiss

These were flagged `wrong_piece`/`uncertain` but match the vanity/mirror convention:
- **vanity shows a drawer-chest, no mirror:** `verna-vanity`, `mocha-vanity`, `baloot-vanity`,
  `elizabeth-vanity`, `elegance-vanity`, `caroline-vanity-6-drawers`.
- **console-vanity-mirror shows just a framed mirror:** `loof`, `jacqueline`, `caroline`,
  `baloot`, `celine` console-vanity-mirrors. (Real issue here is only the `table-mirror`
  naming, S1/S2.) `celine`'s is a tight crop (poor_quality) — reshoot candidate.
- **parla-standing-mirror** shows a mirror-fronted **shelving cabinet** (both colorways,
  internally consistent) — contradicts the canonical `standing-mirror` label. Either the
  product really is a mirror-cabinet (canonical name is loose) or the asset is wrong → confirm.

## 5. Verified clean
- `design.occupancies` == canonical Sheet2 **exactly** (0 diffs).
- No gallery image carries a foreign **design** prefix (no cross-design misfiling).
- No **published** product lacks media; every product has categories.
- All design-level media (hero/slider/logo/occupancyMedia) correctly named.

---

## Rulings (operator, 2026-06-08)
1. **Vanity model = TWO SKUs confirmed.** vanity = drawer-chest base, console-vanity-mirror = the mirror. → **§4 dismissed (not bugs).**
2. **`table-mirror` → `console-vanity-mirror`: rename SKUs *and* media filenames** to canonical. → S1 + S2 approved.
3. **`bed-box` = under-bed storage drawer/box.** → V5–V7 are **confirmed wrong images** (cribs/cabinets); need correct under-bed-box art (artist).
4. **`shaylin-loveseat`: piece IS a bench, image is right.** → V8 dismissed as an image bug; instead the canonical `loveseat` label is off (3 `loveseat` products) — spec/naming note, low priority.

## Net action list

**A. Data-only fixes — APPLIED 2026-06-08** (scripts `reconcile-07-media-tagging.mts`, `reconcile-08-media-filename-rename.mts`; backup `~/zhic-catalog-backups/2026-06-08-1906-pre-media-tagging/`):
- ✅ F1. Renamed 20 product `sku` `*-table-mirror` → `*-console-vanity-mirror`. 0 left.
- ✅ F2. Renamed 15 media files `*-table-mirror*` → `*-console-vanity-mirror*` (disk + `filename` + `url`). 0 left; images serve 200; galleries resolve.
- ✅ F3. Attached orphaned `*-picture` images to 5 products: `bw/caroline/iron/loof-study-chair`, `lukaplus-vanity-chair`. **`skate-vanity` EXCLUDED** (matched orphans are vanity-*chair* images — verified a chair; no `skate-vanity-chair` product → 4 orphans homeless, see Held).
- ✅ F6. `elegance-nightstand`: dropped #452 (verified vanity+mirror unit, wrong piece); kept #451 (correct nightstand); stays published.
- ⏸ F4. **HELD** — `* kesho*.webp` are **real renders** (5-drawer chest, 2-door console — verified) but badly named with **no clear product home**. Not deleted. Q: which series/product is "kesho"?
- ⏸ F5. **HELD** — elegance mirror tangle: published `elegance-standing-mirror` holds a **round wall mirror** (belongs to empty `elegance-wall-mirror`); homeless #452 is a vanity+mirror unit; standing-mirror then needs a real floor-mirror render. Can't fix without blanking a published product / new art.
- ⏸ F7. **HELD** — `sento-vanity` filename labels swapped; cosmetic (internal), deferred.
- ⏸ Also homeless: 4 `skate-vanity-chair-picture*.webp` (no `skate-vanity-chair` product — create product or reassign?).

**B. Needs new art (artist request — append to the scene-request doc):**
- `bed-box` under-bed-box shots: parla, loof, caroline.
- `skate-study-desk`: an actual desk photo (current = hutch only).
- `celine-console-vanity-mirror`: reshoot (tight crop).

**C. Naming/spec notes (low priority):**
- `loveseat` → bench label (3 products) — reconcile with canonical spec.
- Variant count labels vs `product-variants` axes: jacqueline-wardrobe `2-doors`→3, jacqueline-vanity `3-drawers`→4, baloot-vanity `4-drawers`→6, loof `-cream` lifestyle shots show green, bw-wardrobe `mdf` shows glass.
- ✅ Populate `piece_type` (271) from Sheet1 `product_type` — **DONE 2026-06-08** (`reconcile-09-piece-type.mts`; coarse 14-value enum, 0 nulls; backup `…/2026-06-08-1917-pre-piecetype/`).
- ✅ Generate alt text for in-use images — **DONE 2026-06-08** (`reconcile-10-alt-text.mts`; per-image differentiated Persian alt = product name + variant/view qualifiers; 471 set, 0 empty; backup `…/2026-06-08-1950-pre-alt/`). Inherits filename colorway labels → regenerate after §3 colorway fixes.
