# Catalog content audit — rolling

Per-design data/content audit, completed as we walk through all 27 designs. Each
design gets a section: what was **fixed** in-session, what **decisions** were
made (so we don't re-litigate them), and the **deferred** worklist with an owner.

**Owners:** 🧑‍💼 Operator · ✍️ SEO specialist · 🎨 3D artist

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
