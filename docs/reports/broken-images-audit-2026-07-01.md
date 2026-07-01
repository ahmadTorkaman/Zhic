# Broken / missing image audit — 2026-07-01

**Scope:** every `media` record in the `zhic` DB vs. the files actually on disk in
`services/api/media/`, plus every content reference (all ~50 media FKs).
**Method:** deterministic DB↔disk diff + FK trace back to the referencing content.
**Status:** Group 1 + Group 3 **fixed & applied** (below); Groups 2, 4–13 outstanding.

> Media files live **outside git** (`services/api/media/` is gitignored) and the rich
> content (iron design, galleries, …) lives **only in the DB** — `seed.ts` just plants
> placeholder covers. So DB fixes are captured here + as a re-runnable SQL script, not
> as committed data. The **prod DB is separate**: re-run the script on the box to apply.

---

## Headline numbers

| Metric | Count |
| --- | ---: |
| `media` records in DB | 1385 |
| Image files on disk | 732 |
| **`media` records whose file is MISSING** | **653** |
| Orphan files on disk (file, no record) | 0 |
| — of the 653, **referenced by live content** (render broken) | **46 files → 52 slots** |
| — of the 653, unreferenced orphan records | 607 |

The media `url` column always matches its `filename`; nothing is *mis-directed* —
every problem is a **missing file**. All 732 on-disk files are `.webp`; every one of
the 19 `.jpg` records is missing (never uploaded / never converted).

---

## Live breakages — 13 groups (where to fill in)

Each line = **field → missing file (media #id)**. ✅ = fixed 2026-07-01.

### ✅ Group 1 — Home (global) · 1 slot — DONE
- ✅ `aboutBackground` → was `factory-homepage-aboutus.jpg`; wired the `.webp`
  (from `ops/media-incoming/zhic-media-copy/`) into `services/api/media/` and
  repointed media **#1101** onto `factory-homepage-aboutus.webp` (image/webp).

### Group 2 — Categories · 3 slots
- [ ] **آینه دیواری** (`wall-mirror`) — mosaicTileImage → `wall-mirror-mosaic-tile.jpg` (#1377)
- [ ] **صفحه میز تعویض** (`changing-top`) — mosaicTileImage → `changing-top-mosaic-tile.jpg` (#1378)
- [ ] **میز** (`table`) — cover → `room-parla-study-desk-v2-green.webp` (#1313)

### ✅ Group 3 — Design «آیرون / iron» (designs.id 29) · 6 slots — DONE
- ✅ intro_media → **`iron-scene-all-picture-v2.webp`** (#528) — opaque iron room
- ✅ story_media → **`room-iron-scene-half-picture.webp`** (#1085) — opaque iron room
- ✅ detail «سر تخت کشویی» (headboard) → **`iron-single-bed-120-picture-v3.webp`** (#540)
- ✅ detail «پگبورد» (pegboard) → **`iron-desk-pegboard-picture.webp`** (#521)
- ✅ detail «فضای شخصی‌سازی» (personalize) → **`iron-bookcase-picture-v3.webp`** (#519)
- ✅ detail «استحکامات فلزی» (metal) → **removed** per operator (`_order` renumbered 1–3)

### Group 4 — Design «لوتوس / lotus» gallery · 8 slots
- [ ] `lotus-factor-picture-v0.webp` (#708) · `lotus-scene-all-picture-v2.webp` (#716)
- [ ] `lotus-scene-half-2-picture.webp` (#719) · `lotus-scene-half-3-picture.webp` (#721)
- [ ] `lotus-scene-half-4-picture-v2.webp` (#722) · `lotus-scene-half-6-picture-v2.webp` (#725)
- [ ] `lotus-scene-rim-light-picture.webp` (#732) · `lotus-takht2-picture-v2.webp` (#742)

### Group 5 — Design «لوف / loof» gallery · 4 slots
- [ ] `loof-cream-kid-loof-scene-half-picture-cream.webp` (#612)
- [ ] `loof-scene-sun-light-picture-cream.webp` (#615)
- [ ] `loof-scene-all-picture-v2-cream.webp` (#639)
- [ ] `loof-cream-teen-loof-scene-half-picture-v2-cream.webp` (#642)

### Group 6 — Design «بلک‌اند‌وایت / bw» gallery · 3 slots
- [ ] `bw-scene-all-picture.webp` (#377) · `bw-scene-half-3-picture-v2.webp` (#379) · `bw-scene-half-3-picture.webp` (#381)

### Group 7 — Products · لوتوس / Lotus · 9 slots
- [ ] **آینه قدی لوتوس** (`lotus-standing-mirror`) → `lotus-standing-mirror-picture-v4.webp` (#736), `lotus-standing-mirror-picture.webp` (#737)
- [ ] **تخت دو نفره لوتوس** (`lotus-bed-double`) → `lotus-single-bed-120-picture-v2.webp` (#733)
- [ ] **تخت نوجوان لوتوس** (`lotus-bed-teen`) → `lotus-single-bed-120-picture-v2.webp` (#733) *(same file)*
- [ ] **میز آرایش لوتوس** (`lotus-vanity`) → `lotus-vanity-3-drawers-picture-v4.webp` (#746)
- [ ] **میز تحریر لوتوس** (`lotus-study-desk`) → `lotus-study-desk-picture-v4.webp` (#740)
- [ ] **پاتختی لوتوس** (`lotus-nightstand`) → `lotus-nightstand-picture-v4.webp` (#713)
- [ ] **کتابخانه لوتوس** (`lotus-bookcase`) → `lotus-bookcase-picture-v2.webp` (#706)
- [ ] **کمد لوتوس** (`lotus-wardrobe`) → `lotus-wardrobe-2-doors-mdf-picture-v4.webp` (#750)

### Group 8 — Products · لوف / Loof · 4 slots
- [ ] **آینه قدی لوف** (`loof-standing-mirror`) → `loof-standing-mirror-picture-v2-cream.webp` (#647)
- [ ] **تخت لوف** (`loof-bed`) → `loof-single-bed-120-picture-v2-cream.webp` (#645)
- [ ] **تخت نوزاد دومنظوره لوف (نوجوان)** (`loof-convertible-teen`) → `loof-convertible-bed-teen-picture-cream.webp` (#608)
- [ ] **ویترین لوف** (`loof-display-cabinet`) → `loof-display-cabinet-picture-cream.webp` (#610)

### Group 9 — Products · بلک‌اند‌وایت / BW · 2 slots
- [ ] **تخت بلک‌اند‌وایت** (`bw-bed`) → `bw-single-bed-120-picture-v2.webp` (#387)
- [ ] **میز آرایش بلک‌اند‌وایت** (`bw-vanity`) → `bw-vanity-3-drawers-picture-v2.webp` (#392)

### Group 10 — Products · آیرون / Iron · 2 slots
- [ ] **پاتختی آیرون** (`iron-nightstand`) → `iron-nightstand-picture.webp` (#527)
- [ ] **کتابخانه آیرون** (`iron-bookcase`) → `iron-bookcase-picture.webp` (#520)

### Group 11 — Products · لوکاپلاس / Lukaplus · 3 slots
- [ ] **پاتختی لوکاپلاس** (`lukaplus-nightstand`) → `lukaplus-couple-lukaplus-nightstand-picture-v2.webp` (#756), `lukaplus-teen-lukaplus-nightstand-picture.webp` (#783)
- [ ] **کتابخانه لوکاپلاس** (`lukaplus-bookcase`) → `lukaplus-bookcase-picture-v2.webp` (#777)

### Group 12 — Products · الیزابت / Elizabeth · 3 slots
- [ ] **شلف دیواری الیزابت** (`elizabeth-wall-shelf`) — gallery → `elizabeth-wall-shelf-cream.webp` (#474), `elizabeth-wall-shelf-gray.webp` (#491); seoOgImage → `elizabeth-wall-shelf-cream.webp` (#474)

### Group 13 — Product variants · 4 slots (each reuses a product file above)
- [ ] **تخت بلک‌اند‌وایت** — SKU `bw-bed-size-120` → #387 *(= Group 9)*
- [ ] **تخت نوجوان لوتوس** — SKU `lotus-bed-teen-size-120` → #733 *(= Group 7)*
- [ ] **شلف دیواری الیزابت** — SKU `…-finish-cream` → #474 · SKU `…-finish-gray` → #491 *(= Group 12)*

---

## Fixes applied — 2026-07-01

**Script:** `services/api/scripts/reconcile-11-fix-broken-images-2026-07-01.sql`
(idempotent, transactional). **Backup:** `~/zhic-catalog-backups/2026-07-01-134647-pre-broken-image-fix/zhic.sql`.

- **Group 1** — copied `factory-homepage-aboutus.webp` into `services/api/media/`;
  repointed media #1101 filename/url/mime/filesize onto it.
- **Group 3** — repointed iron intro/story + 3 design details (headboard/pegboard/
  personalize) to existing on-disk media; deleted the metal design-detail row and
  renumbered `_order` to 1–3.

**Verification:** all 6 references now resolve to files present on disk. Total
broken-media-records **653 → 652** (only #1101 resolved onto a now-present file;
the 6 old iron records — #1031/1032/1036/1037/1038/1039 — remain as **unreferenced**
broken orphans, safe to purge later). Live breakages **52 → 45 slots**.

## Remaining
- Groups 2, 4–13 (45 slots) — need real files sourced/rendered, then repointed the same way.
- 607 unreferenced broken records — candidate for a bulk cleanup pass (full list in the audit run).
- Newly-orphaned iron `.jpg`/detail records from this pass fold into that cleanup.
