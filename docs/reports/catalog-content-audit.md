# Catalog content audit — rolling

Per-design data/content audit, completed as we walk through all 27 designs. Each
design gets a section: what was **fixed** in-session, what **decisions** were
made (so we don't re-litigate them), and the **deferred** worklist with an owner.

**Owners:** 🧑‍💼 Operator · ✍️ SEO specialist · 🎨 3D artist

## On hold — intentionally draft (operator decision, 2026-06-22)

These 7 designs are **deliberately kept unpublished** for now — **do not run the standard
publish pass on them** until the operator makes a launch decision:

- Fully-draft series: **catherine** (14), **roco** (11), **romantic** (10), **eliza** (9), **classic** (9)
- Draft singletons: **general** (1), **adrian** (1)

When one is ready to launch, the path is the same as nikan: confirm the CMS media is
uploaded + wired, then publish + standard pass + audit. **20 of 27 designs are reconciled;**
these 7 are the remainder, held by choice (not incomplete review).

## Conventions (don't re-flag these as bugs)

- **0 variants is normal.** 167 of 272 products have no variants — under the
  inquiry model a product needs no variant to be valid. Only flag *duplicate*
  defaults or a *declared option that genuinely exists but isn't represented*.
- **`piece_type=closet`** is the canonical enum value for کمد (all wardrobes use it).
- **The picker renders variant axes even when not in the category's `allowed_axes`**
  (`deriveAxisOptions` appends them) — so an axis "missing from allowed_axes" is
  cosmetic, not a functional break.
- **Materials collection** currently has: walnut, oak, beech, velvet, belgian-linen.
  Metal (فلز) and MDF do **not** exist yet — designs built from them can't be
  wired to materials until those records are created.

---

## آیرون (iron) — reviewed 2026-06-21 · 12 products

### Fixed this session
- **Wardrobe variant matrix** — added missing `doors=1 / door_material=mdf`
  variant (image #515 was orphaned). `reconcile-11-iron-variants.mts`
- **Standing-mirror dedup** — removed duplicate default variant #319. `reconcile-11`
- **Published** the draft trio (#419 study-chair, #421 vanity, #422 vanity-chair).
- **Tags** — `modern` on all 12; `storage` on wardrobe/file/nightstand/vanity.
- **SEO ogImage** — seeded from each product's first gallery image (all 12).
- **Cross-sell** — `pairsWith` (bed↔nightstand, desk↔chair, vanity↔vanity-chair);
  `relatedProductIds` same-series (6 each; mirrors lead with the other mirrors).
- **iron-bed placeholder images** — sizes 90/140/180 had none; assigned the closest
  existing photo within class (90→100, 140→160, 180→160). `reconcile-12-iron-content.mts`

### Decisions recorded
- **Occupancy `double, teen`** is correct for iron-bed — no change. (Its
  `{single, double}` categories reflect the 90–180 size span; orthogonal to occupancy.)
- **`iron-file` piece_type = `dresser`** — accepted (no `file` value in the enum).
- **Draft trio prices** — left at `basePriceRials=0` for now (published anyway).
- **Bed sizes** — left as-is (no variant changes).

### Deferred worklist
- [ ] ✍️ **SEO meta title + description** — empty on all 12 (ogImage already seeded).
- [ ] 🧑‍💼 **Editorial copy** — tagline / shortDescription / longDescription / specs empty on all 12.
- [ ] 🧑‍💼 **Materials** — wire metal (فلز) + MDF + linen on all 12. **Blocked:** فلز and
      MDF material records don't exist yet — create them first, then relate.
- [ ] 🧑‍💼 **Draft-trio prices** — set real `basePriceRials` for #419/#421/#422 (currently 0).
- [ ] 🎨 **iron-bed per-size photos** — replace the closest-size placeholders on sizes
      90 / 140 / 180 with real shots.
- [ ] 🧑‍💼 **footboard axis** — the bed's category declares a `footboard` axis that isn't
      offered. Confirm whether iron beds have a footboard option; if yes, add variants.
- [ ] 🧑‍💼 / 🎨 **iron-standing-mirror-regal** — empty dimensions; and define what "رگال"
      differentiates from the base standing-mirror (identical 305,820,000 price).
- [ ] 🧑‍💼 **iron-vanity-chair dimensions** — width=100 is copy-pasted from the vanity;
      needs real seat dimensions.
- [ ] ✍️ / 🧑‍💼 **Hub #29 (آیرون)** — `introBody` is placeholder scaffolding
      ("توضیحات کوتاه سرویس خواب نوجوان آیرون"); story is bed-only; `occupancyMedia`
      and `description` empty.
- [ ] 🧑‍💼 *(optional curation)* — vanity↔mirror pairing not wired.

---

## ورنا (verna) — reviewed 2026-06-21 · 7 products

### Fixed this session
- **Tags** — `modern` on all 7; `storage` on wardrobe/nightstand/vanity.
- **SEO ogImage** — seeded from first gallery image (6; the mirror has no gallery → skipped).
- **Cross-sell** — `pairsWith` (bed↔nightstand, vanity↔console-mirror, desk↔bookcase);
  `relatedProductIds` same-series (6 each).
- **Published** verna-vanity (#577); price left 0.
- **verna-bed placeholder images** — sizes 90/100 → the 120 single shot, size 140 → the
  160 double shot (TEMP). `reconcile-13-verna-content.mts`

### Decisions recorded
- **verna-console-vanity-mirror (#576) NOT published** — 0 gallery images; publishing
  would render blank. Held pending a 3D asset.
- **verna-vanity (#577)** published with `basePriceRials=0` (its only variant #439 also
  has `priceDeltaRials=null`) — real price pending.
- **`storage` tag NOT applied to verna-bookcase** (open shelving) — `modern` only.

### Deferred worklist
- [ ] 🎨 **verna-console-vanity-mirror** — needs gallery images, then publish (held). It's
      priced + in_stock but draft & imageless.
- [ ] 🧑‍💼 **verna-vanity price** — base + variant #439 delta both null/0; enter a real price.
- [ ] 🎨 **verna-bed per-size photos** — replace placeholders on sizes 90 / 100 / 140
      (140 is a *priced* tier with no real shot).
- [ ] 🧑‍💼 **verna-bed price buckets** — confirm 90/100/120 = 419,690,000 vs 140/160 =
      528,650,000 are intentional; encode single/double in structured data (today only in filenames).
- [ ] 🧑‍💼 **verna-bed dimensions** — stored width 160 applies to all sizes; make variant-aware.
- [ ] 🧑‍💼 **verna-study-desk filenames** — `verna-study-deskwebp.webp` (missing dot),
      `verna-study-desk-detial.webp` (typo) — rename.
- [ ] 🧑‍💼 **verna-wardrobe materials** → MDF (alt text + filename say MDF). Blocked: MDF
      material record doesn't exist (see conventions).
- [ ] ✍️ **SEO meta title + description** — all 7.
- [ ] 🧑‍💼 **Editorial copy** — tagline/short/long/specs empty on all 7.
- [ ] 🧑‍💼 **Materials** — all 7 (blocked on missing فلز/MDF records as above).
- [ ] ✍️ / 🧑‍💼 **Hub designs/40 (ورنا)** — near-empty shell: description, tagline, hubIntro,
      intro/story copy+media, hero/logo art, gallery, materialCallouts all empty;
      `occupancyMedia` empty though it declares `double, teen`.
- [ ] 🧑‍💼 **publishedAt null** on some published items (housekeeping).

---

## پارلا (parla) — reviewed 2026-06-22 · 19 products

### Fixed this session
- **Tags** — `modern` on all 19; `storage` on wardrobe, combined-wardrobe,
  sliding-wardrobe, nightstand, vanity, changing-table, display-cabinet, bed-box.
- **SEO ogImage** — seeded on the 14 with galleries (5 image-less drafts skipped).
- **Cross-sell** — `pairsWith` (bed↔nightstand, bunk-bed↔bed-guard, vanity↔vanity-chair,
  vanity↔console-mirror, study-desk↔study-chair, study-desk↔bookcase) +
  `relatedProductIds` same-series (6 each).
- **Published** parla-convertible-teen (#504); price left 0.
- **parla-bed placeholder images** — finish-less variants: size 90 → 100-cream (#826),
  sizes 140 & 180 → 160-cream (#823). TEMP. `reconcile-14-parla-content.mts`

### Decisions recorded
- **5 image-less drafts HELD** (not published): bed-guard, console-vanity-mirror,
  sliding-wardrobe, study-chair, vanity-chair.
- **`storage` applied to display-cabinet + bed-box** too (operator call). Tagging is
  data-only (a `products_rels` row) — **no schema change**.
- **Bed placeholder finish** = cream for the finish-less 90/140/180 variants.

### Deferred worklist
- [ ] 🎨 **5 image-less drafts → need gallery images**, then publish: bed-guard,
      console-vanity-mirror, sliding-wardrobe, study-chair, vanity-chair.
- [ ] 🧑‍💼 **Contradictory draft trio** — sliding-wardrobe (135,993,000﷼), study-chair,
      vanity-chair are `in_stock` + priced but `draft` + image-less. Resolve once imaged.
- [ ] 🧑‍💼 **Dimension copy-pastes** — vanity-chair=vanity (100×78×45), bed-guard=bed-box
      (120×110×210), wardrobe=combined-wardrobe (120×220×60, confirm if legit). Need real dims.
- [ ] 🎨 **parla-bed photos** — real shots for sizes 90 / 140 / 180 (cream placeholders now).
- [ ] 🧑‍💼 **Prices** — bed-guard / console-vanity-mirror / convertible-teen are 0/made_to_order
      (convertible-teen now published at 0).
- [ ] ✍️ **SEO meta title + description** — all 19.
- [ ] 🧑‍💼 **Editorial copy** — all 19.
- [ ] 🧑‍💼 **Materials** — all 19 (blocked on missing material records).
- [ ] ✍️ / 🧑‍💼 **Hub designs/36 (پارلا)** — has hero/slider/logo + 3 occupancyMedia, but
      tagline, description, hubIntro, intro/story copy, gallery, materialCallouts, and
      designDetails are all empty; declares 4 occupancies (baby/bunk/double/teen) vs 3 media.

---

## لوف (loof) — reviewed 2026-06-22 · 17 products

### Fixed this session
- **Tags** — `modern` ×17; `storage` on wardrobe/nightstand/vanity/changing-table/display-cabinet/bed-box.
- **SEO ogImage** — seeded on the 15 with galleries.
- **Cross-sell** — `pairsWith` (bed↔nightstand, convertible-teen↔bed-guard, vanity↔vanity-chair,
  vanity↔console-mirror, study-desk↔study-chair, study-desk↔bookcase, changing-table↔changing-top)
  + `relatedProductIds` (6 each).
- **Published** bed-box, study-chair, vanity (price 0).
- **loof-bed placeholders** — sizes 90/100/140 → single-120-cream (#625).
- **Finish variants (decision A)** — created cream+green `finish` variants for the 7 products that
  showed both finishes in-gallery but had no variant (so green was unselectable): bookcase,
  changing-table, display-cabinet, nightstand, standing-mirror, study-desk, wall-shelf. Each
  mapped to its existing cream/green image, delta 0. `reconcile-15-loof-content.mts`

### Decisions recorded
- **2 image-less drafts HELD**: bed-guard, vanity-chair.
- **loof-bed size 140** (a double) given the single-120-cream shot as a **stopgap** (operator
  call) — flagged for a real double-bed photo.

### Deferred worklist
- [ ] 🎨 **2 image-less drafts** → bed-guard (also price 0) and vanity-chair (draft but in_stock +
      163,930,000﷼ — contradictory) need images, then publish/fix availability.
- [ ] 🧑‍💼 **loof-bed finish modeling** — cream/green offered **only on size 120**; extend to all
      sizes or drop the split. Also its declared axis is `footboard`, not `finish`.
- [ ] 🎨 **loof-bed real photos** for sizes 90/100/140 (single-120 stopgap now; 140 is a double).
- [ ] 🎨 **Green-only galleries** — changing-top & console-vanity-mirror have only a green image
      (cream missing); add the cream lead shot.
- [ ] 🧑‍💼 **Dimension copy-pastes** — bed-guard = bed-box (120×110×210), vanity-chair = vanity
      (100×78×45). Need real dims.
- [ ] 🧑‍💼 **loof-bed classification** — filed under `تخت دونفره` (double) despite baby/teen ≤140; confirm.
- [ ] 🧑‍💼 **loof-convertible-teen** — single cream-only variant; `size`/conversion axis unmodeled.
- [ ] 🧑‍💼 **loof-wardrobe filenames** — `loof-cream-kid-loof-wardrobe-…` / `loof-cream-teen-…` (doubled prefix); rename.
- [ ] 🧑‍💼 **loof-display-cabinet occupancy** — baby-only vs baby+teen siblings; confirm.
- [ ] ✍️ SEO meta title/description · 🧑‍💼 editorial copy · 🧑‍💼 materials — all 17 (materials blocked on missing records).
- [ ] ✍️ / 🧑‍💼 **Hub designs/31** — empty copy (tagline/description/hubIntro/intro/story), null alt on all
      16 gallery images, empty materialCallouts/designDetails. (Deep audit: identical on jacqueline #30 & lorena #32.)

---

## کارولین (caroline) — reviewed 2026-06-22 · 16 products

### Fixed this session
- **Tags** — `modern` ×16; `storage` on wardrobe/nightstand/vanity/file/bed-box.
- **SEO ogImage** — seeded on all 16.
- **Cross-sell** — `pairsWith` (bed↔nightstand, vanity↔vanity-chair, vanity↔console-mirror,
  study-desk↔study-chair, study-desk↔bookcase) + `relatedProductIds` (6 each).
- **Published all 5 drafts** (price 0): changing-top, convertible-sofa, convertible-teen,
  study-chair, vanity-chair.
- **caroline-bed placeholders** — size 90 → single-100 (#410); sizes 140 & 180 → double-160 (#407).
- **Bonus** — surfaced the existing double-160 photo (#407) in the bed gallery. `reconcile-16-caroline-content.mts`

### Decisions recorded
- **No image-less products & no finish-variant gap** — all 5 drafts published outright.
- Bed placeholders clean (a real double-160 image existed, unlike loof).

### Deferred worklist
- [ ] 🧑‍💼 **Prices** — 4 drafts published at 0 (changing-top, convertible-sofa, convertible-teen, study-chair).
- [ ] 🧑‍💼 **Dimension copy-pastes** — convertible-sofa = convertible-teen (90×105×195),
      vanity-chair = vanity (100×78×45). Need real dims.
- [ ] 🎨 **caroline-bed photos** — real shots for sizes 90/140/180 (placeholders now); gallery is thin.
- [ ] 🧑‍💼 **Convertibles** — convertible-sofa & convertible-teen have single no-axis variants; model the conversion/size.
- [ ] ✍️ SEO meta title/description · 🧑‍💼 editorial copy · 🧑‍💼 materials — all 16 (materials blocked on missing records).
- [ ] ✍️ / 🧑‍💼 **Hub designs/24** — empty editorial (description/tagline/hubIntro/intro/story/materialCallouts/designDetails);
      `occupancyMedia` missing the baby card though it declares baby/double/teen.

---

## الیزابت (elizabeth) — reviewed 2026-06-22 · 15 products

### Fixed this session
- **Tags** — `modern` ×15; `storage` on wardrobe/nightstand/vanity/file/console.
- **SEO ogImage** — seeded on the 14 with galleries.
- **Cross-sell** — `pairsWith` (bed↔nightstand, vanity↔vanity-chair, vanity↔console-mirror,
  study-desk↔study-chair, study-desk↔bookcase) + `relatedProductIds` (6 each).
- **Published** console, vanity, vanity-chair (price 0).
- **elizabeth-bed** size-180 (finish-less, image-less) → double-160-cream (#462).
- **Colour variants (decision A)** — `finish`=cream/gray for bookcase, nightstand,
  standing-mirror, study-desk, wall-shelf; `fabric`=cream/gray for loveseat (added `fabric`
  axis + value labels to `apps/web/src/lib/variant-helpers.ts`). 12 variants. `reconcile-17-elizabeth-content.mts`

### Decisions recorded
- **HELD study-chair** (image-less; in_stock + priced + draft contradiction).
- **console-vanity-mirror EXCLUDED from colour variants** — its category allows only `size`;
  the cream/gray are frame photos. Modeling finish there would need a shared-category change.

### Deferred worklist
- [ ] 🎨 **study-chair** → needs images, then publish + resolve the draft/in_stock/price contradiction.
- [ ] 🧑‍💼 **elizabeth-bed size-180** — missing its cream/gray finish split (every other size has it).
- [ ] 🧑‍💼 **elizabeth-console** — gallery shows **3 drawers** (`elizabeth-console-3-drawes-cream.webp`,
      also a filename typo) but its variant is **2 drawers**; reconcile + rename.
- [ ] 🧑‍💼 **elizabeth-vanity** — drawers/finish matrix gap (drawers=2 cream/gray images exist with no matching variant).
- [ ] 🧑‍💼 **console-vanity-mirror finish** — decide: add `finish` to the (shared) category, or leave size-only.
- [ ] 🧑‍💼 **vanity = vanity-chair copied dims** (100×78×45).
- [ ] 🧑‍💼 **`baby` occupancy over-tag** on bed/bookcase (design declares only double/teen).
- [ ] 🧑‍💼 draft prices; `publishedAt` null on published items (housekeeping).
- [ ] ✍️ SEO meta title/description · 🧑‍💼 editorial copy · 🧑‍💼 materials — all 15.
- [ ] ✍️ / 🧑‍💼 **Hub designs/27** — empty shell (only name/slug/occupancies/heroMedia populated).

---

## بلوط (baloot) — reviewed 2026-06-22 · 15 products

### Fixed this session
- **Tags** — `modern` ×15; `storage` on wardrobe/nightstand/vanity/console.
- **SEO ogImage** — seeded on the 12 with galleries.
- **Cross-sell** — `pairsWith` (bed↔nightstand, vanity↔vanity-chair, vanity↔console-mirror,
  study-desk↔study-chair, study-desk↔bookcase) + `relatedProductIds` (6 each).
- **Published** vanity (price 0).
- **baloot-bed** — attached the existing `double-160-180` shots to the two image-less 160
  variants (160/high → #994, 160/low → #995); image-only update, no new variant/axis. `reconcile-18-baloot-content.mts`

### Decisions recorded
- **HELD 3 image-less drafts** (changing-top, loveseat, wall-shelf) — all in_stock + priced + draft.
- **No finish-variant gap** (no decision A) — baloot pieces are single-finish.

### Deferred worklist
- [ ] 🎨 **3 image-less drafts → need images**, then publish/fix availability: changing-top
      (135,030,000﷼), loveseat (203,420,000﷼), wall-shelf (176,740,000﷼).
- [ ] 🎨 **baloot-bed correct per-size photos** — the 160 pair currently shares the `160-180`
      double shot; real per-size images to be added later (operator).
- [ ] 🧑‍💼 **baloot-vanity** — gallery shows a 5-drawer image but the only variant is `drawers=4`; reconcile.
- [ ] 🧑‍💼 **vanity = vanity-chair copied dims** (100×78×45).
- [ ] 🧑‍💼 **Materials = oak** — baloot is بلوط (oak) and the `oak` material record **exists** (NOT
      blocked, unlike iron/loof): wire `oak` on the wood pieces (loveseat/chairs are fabric → per-product).
- [ ] 🧑‍💼 **Occupancies** uncurated — all 15 carry baby/double/teen with no per-product curation.
- [ ] 🧑‍💼 draft prices; `publishedAt`/`occupancy` housekeeping.
- [ ] ✍️ SEO meta title/description — all 15.
- [ ] 🧑‍💼 editorial copy — all 15.
- [ ] ✍️ / 🧑‍💼 **Hub designs/22** — completely empty shell (every editorial/media field null/empty).

---

_Six series done together (`reconcile-19-six-series.mts`), all deep-audited. Per design: `modern` on all + `storage` on closed-storage pieces, `seo.ogImage` seeded, cross-sell wired (pairs + 6 related), imaged drafts published (price 0), bed placeholders. None had a finish-variant gap._

## لوکاپلاس (lukaplus) — reviewed 2026-06-22 · 12 products
### Fixed this session
- Published vanity, vanity-chair (price 0); bed placeholders 90/100→single-120 (#768), 140→double-160 (#766); tags/og/cross-sell.
### Deferred worklist
- [ ] 🎨 image-less drafts → images, then publish: **bed-guard, study-chair**.
- [ ] 🎨 lukaplus-bed real per-size photos (90/100/140 are placeholders).
- [ ] 🧑‍💼 copied dims: **bed-guard** = bed footprint; **vanity-chair** = vanity (100×78×45).
- [ ] 🧑‍💼 real prices for the 2 drafts published at 0.
- [ ] ✍️ SEO meta title/description — all 12.
- [ ] 🧑‍💼 editorial copy — all 12.
- [ ] 🧑‍💼 materials — all 12 (operator to assign per-product).
- [ ] ✍️ / 🧑‍💼 hub designs/34 — placeholder/empty shell.

## بلک‌اند‌وایت (bw) — reviewed 2026-06-22 · 12 products
### Fixed this session
- Published console-mirror, study-chair, vanity (price 0); **bw-wardrobe rebuilt into a clean 2×2** doors×door_material (added door_material=mdf to the two bare variants; created the missing 1-door/glass on #367); tags/og/cross-sell.
### Deferred worklist
- [ ] 🎨 image-less draft → images, then publish: **vanity-chair**.
- [ ] 🧑‍💼 copied dims: **vanity-chair** = vanity (100×78×45).
- [ ] 🧑‍💼 real prices for the 3 drafts published at 0.
- [ ] ✍️ SEO meta title/description — all 12.
- [ ] 🧑‍💼 editorial copy — all 12.
- [ ] 🧑‍💼 materials — all 12 (operator to assign per-product).
- [ ] ✍️ / 🧑‍💼 hub designs/23 — placeholder/empty shell.

## اسکیت (skate) — reviewed 2026-06-22 · 11 products
### Fixed this session
- Published vanity (price 0); bed placeholders 90/120→single-100 (#890); tags/og/cross-sell.
### Deferred worklist
- [ ] 🎨 image-less drafts → images, then publish/fix availability: **convertible-sofa, standing-mirror, study-chair, wall-shelf** (last three are draft+in_stock+priced contradictions).
- [ ] 🎨 skate-bed real photos for 90/120; skate-convertible-sofa has no image.
- [ ] 🧑‍💼 real price for the draft published at 0.
- [ ] ✍️ SEO meta title/description — all 11.
- [ ] 🧑‍💼 editorial copy — all 11.
- [ ] 🧑‍💼 materials — all 11 (operator to assign per-product).
- [ ] ✍️ / 🧑‍💼 hub designs/39 — placeholder/empty shell.

## موکا (mocha) — reviewed 2026-06-22 · 11 products
### Fixed this session
- Published vanity-chair (price 0); bed placeholder 100→single-120 (#802); tags/og/cross-sell.
### Deferred worklist
- [ ] 🎨 image-less draft → images, then publish: **console** (draft+in_stock contradiction).
- [ ] 🧑‍💼 copied dims: **vanity-chair** = vanity (100×78×45).
- [ ] 🎨 mocha-bed real photo for size 100.
- [ ] 🧑‍💼 real price for the draft published at 0.
- [ ] ✍️ SEO meta title/description — all 11.
- [ ] 🧑‍💼 editorial copy — all 11.
- [ ] 🧑‍💼 materials — all 11 (operator to assign per-product).
- [ ] ✍️ / 🧑‍💼 hub designs/35 — placeholder/empty shell.

## لوتوس (lotus) — reviewed 2026-06-22 · 11 products
### Fixed this session
- Bed placeholders 90→single-100 (#694), 140→double-160 (#690); tags/og/cross-sell. (No publishable drafts.)
### Deferred worklist
- [ ] 🎨 image-less drafts → images, then publish/fix availability: **bed-guard, wall-mirror, wall-shelf** (wall-mirror/shelf are draft+in_stock+priced contradictions).
- [ ] 🧑‍💼 copied dims: **bed-guard** = bed footprint.
- [ ] 🧑‍💼 lotus-wardrobe single-finish (mdf) — category allows `finish` but only one finish exists, so no variant needed (noted, not a gap).
- [ ] 🎨 lotus-bed real photos for 90/140.
- [ ] ✍️ SEO meta title/description — all 11.
- [ ] 🧑‍💼 editorial copy — all 11.
- [ ] 🧑‍💼 materials — all 11 (operator to assign per-product).
- [ ] ✍️ / 🧑‍💼 hub designs/33 — placeholder/empty shell.

## الگانس (elegance) — reviewed 2026-06-22 · 11 products
### Fixed this session
- Published vanity, wall-mirror (price 0); bed placeholder 120→single-100 (#453); tags/og/cross-sell.
### Deferred worklist
- [ ] 🎨 image-less drafts → images, then publish: **console, console-vanity-mirror, study-chair**.
- [ ] 🧑‍💼 **elegance-vanity `basePriceRials=0`** — a real error (every sibling is priced); needs a real price (published at 0 for now).
- [ ] 🎨 elegance-bed real photo for size 120.
- [ ] 🧑‍💼 real prices for the 2 drafts published at 0.
- [ ] ✍️ SEO meta title/description — all 11.
- [ ] 🧑‍💼 editorial copy — all 11.
- [ ] 🧑‍💼 materials — all 11 (operator to assign per-product).
- [ ] ✍️ / 🧑‍💼 hub designs/26 — placeholder/empty shell.

---

## شایلین (shaylin) — reviewed 2026-06-22 · 8 products
### Fixed this session
- `modern`×8; `storage` on file/nightstand/vanity; ogImage×8; cross-sell; bed placeholder size-180→double-160 (#878). No drafts. `reconcile-20-six-more.mts`
### Deferred worklist
- [ ] 🎨 shaylin-bed real photo for size 180 (placeholder now).
- [ ] 🧑‍💼 copied dims: **vanity-chair** = vanity (100×78×45).
- [ ] ✍️ SEO meta title/description — all 8.
- [ ] 🧑‍💼 editorial copy — all 8.
- [ ] 🧑‍💼 materials — all 8 (operator to assign per-product).
- [ ] ✍️ / 🧑‍💼 hub designs/38 — placeholder/empty shell.

## سنتو (sento) — reviewed 2026-06-22 · 10 products
### Fixed this session
- `modern`×10; `storage` on file/nightstand/vanity/wardrobe; ogImage×9; cross-sell; bed placeholder size-90→single-100 (#862). `reconcile-20-six-more.mts`
### Deferred worklist
- [ ] 🎨 image-less draft → images, then publish: **nightstand**.
- [ ] 🎨 sento-bed double sizes (140/160/180) have **no double image** — need real double-bed photos (left image-less, not stopgapped with a single shot).
- [ ] ✍️ SEO meta title/description — all 10.
- [ ] 🧑‍💼 editorial copy — all 10.
- [ ] 🧑‍💼 materials — all 10 (operator to assign per-product).
- [ ] ✍️ / 🧑‍💼 hub designs/37 — placeholder/empty shell.

## ژاکلین (jacqueline) — reviewed 2026-06-22 · 9 products
### Fixed this session
- `modern`×9; `storage` on file/nightstand/vanity/wardrobe; ogImage×8; cross-sell; published vanity (price 0); bed placeholders 90→single-100 (#554), 140/180→double-160 (#551). `reconcile-20-six-more.mts`
### Deferred worklist
- [ ] 🎨 image-less draft → images, then publish: **convertible-teen**.
- [ ] 🎨 jacqueline-bed real photos for 90/140/180; convertible-teen has no image.
- [ ] 🧑‍💼 real price for vanity (published at 0).
- [ ] ✍️ SEO meta title/description — all 9.
- [ ] 🧑‍💼 editorial copy — all 9.
- [ ] 🧑‍💼 materials — all 9 (operator to assign per-product).
- [ ] ✍️ / 🧑‍💼 hub designs/30 — placeholder/empty shell.

## سلین (celine) — reviewed 2026-06-22 · 7 products
### Fixed this session
- `modern`×7; `storage` on file/nightstand/vanity; ogImage×6; cross-sell; bed placeholder size-180→double-160 (#423). `reconcile-20-six-more.mts`
### Deferred worklist
- [ ] 🎨 image-less draft → images, then publish: **standing-mirror**.
- [ ] 🎨 celine-bed real photo for size 180.
- [ ] 🧑‍💼 copied dims: **vanity-chair** = vanity (100×78×45).
- [ ] ✍️ SEO meta title/description — all 7.
- [ ] 🧑‍💼 editorial copy — all 7.
- [ ] 🧑‍💼 materials — all 7 (operator to assign per-product).
- [ ] ✍️ / 🧑‍💼 hub designs/25 — placeholder/empty shell.

## لورنا (lorena) — reviewed 2026-06-22 · 6 products
### Fixed this session
- `modern`×6; `storage` on console/nightstand; ogImage×6; cross-sell; published vanity-chair (price 0); bed placeholder size-180→double-160 (#679). `reconcile-20-six-more.mts`
### Deferred worklist
- [ ] 🎨 lorena-bed real photo for size 180.
- [ ] 🧑‍💼 real price for vanity-chair (published at 0).
- [ ] ✍️ SEO meta title/description — all 6.
- [ ] 🧑‍💼 editorial copy — all 6.
- [ ] 🧑‍💼 materials — all 6 (operator to assign per-product).
- [ ] ✍️ / 🧑‍💼 hub designs/32 — placeholder/empty shell.

## گندم (gandom) — reviewed 2026-06-22 · 5 products
### Fixed this session
- `modern`×5; `storage` on file/wardrobe; ogImage×4; related wired (no functional pairs in this small set). `reconcile-20-six-more.mts`
### Deferred worklist
- [ ] 🎨 image-less draft → images, then publish: **display-cabinet**.
- [ ] ✍️ SEO meta title/description — all 5.
- [ ] 🧑‍💼 editorial copy — all 5.
- [ ] 🧑‍💼 materials — all 5 (operator to assign per-product).
- [ ] ✍️ / 🧑‍💼 hub designs/28 — placeholder/empty shell.

---

## نیکان (nikan) — reviewed 2026-06-22 · 3 products
### Fixed this session
- Media was uploaded via the CMS and already wired (full galleries). **Published all 3**
  (bunk-bed, study-desk, wardrobe — each with a real price + variants); `modern`×3,
  `storage` on wardrobe; ogImage×3; cross-sell related. `reconcile-21-nikan.mts`
### Decisions recorded
- All 3 products complete (images + variants + real prices) — published outright (not price-0).
- No functional cross-sell pairs in this 3-piece set (related links the full roster).
- **No 3D work needed** — products are fully imaged.
### Deferred worklist
- [ ] ✍️ SEO meta title/description — all 3 (ogImage already set).
- [ ] 🧑‍💼 editorial copy — all 3.
- [ ] 🧑‍💼 materials — all 3 (operator to assign per-product).
- [ ] ✍️ / 🧑‍💼 **Hub designs/45** — no editorial copy at all (description/tagline/hubIntro/intro/story
      all empty) and `occupancyMedia`/`materialCallouts`/`designDetails` empty; renders hero + 9-image gallery but zero words.
