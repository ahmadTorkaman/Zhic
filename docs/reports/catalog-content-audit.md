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
