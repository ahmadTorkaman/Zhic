# Category hub-mosaic tile customization — design

**Date:** 2026-06-27
**Status:** Approved design, pre-implementation
**Scope:** Give the operator CMS control over the *tile image* and *tile crop*
of each tile in the hub `CategoryMosaic` (the auto-generated mosaic on
parent-category pages under `/bedroom-furniture/[...slug]`).

---

## Problem

On a **hub page** (a parent category such as `bed`, `mirror`, `table`), the
`CategoryMosaic` is fully auto-derived from the category tree. The operator has
no CMS handle on it. Specifically, each tile's photo resolves through
`fetchChildTilePhotos` → `hubContentFromPayload` as:

```
img = child.cover?.url ?? firstProductGalleryPhotoInSubtree ?? undefined
```

and the crop is hard-coded to center (`50% 50%`) by `toTile` in
`bedroom-furniture-mosaic.ts`. So the only way to influence a tile today is to
change the child category's **hero `cover`** — which is the wrong lever, because
`cover` is the full-width hero at the top of that child's own page and is
*required* for parent categories. A hero crop is rarely the right mosaic-tile
crop.

The operator wants the **lightest possible** control that fits the existing
backend logic and introduces **no conflicts**: choose the tile photo and its
crop per category, with today's behavior preserved when left blank.

Out of scope (explicitly deferred): tile ordering, which-is-featured,
tile visibility/hiding, and the layout rhythm. These stay automatic.

---

## Precedent

This mirrors the existing `collectionTileImage` field on **Products**
(commit `2d71ae8`, `feat(cms): dedicated collectionTileImage field on Products`).
That field is a dedicated, nullable single upload used as a fallback-override
(`collectionTileImage ?? gallery[0]`), additive with no data migration, and not
rendered on the product page. We reproduce that shape for category hub tiles.

---

## Design

### New CMS fields on `Categories` (`services/api/src/collections/Categories.ts`)

Two new optional fields, added after `cover`:

1. **`mosaicTileImage`** — `type: 'upload'`, `relationTo: 'media'`, single,
   nullable.
   - Label: `«تصویر کاشی در دسته‌بندی والد»`
   - Description (fa): "تصویر این دسته در موزاییکِ صفحه‌ی دسته‌بندی والد. مستقل
     از «تصویر hero» است و فقط در کاشی‌های موزاییک استفاده می‌شود. اگر خالی
     بماند، «تصویر hero» و سپس اولین عکس محصولِ زیرمجموعه استفاده می‌شود."

2. **`mosaicTilePosition`** — `type: 'select'`, optional (no default; absence ==
   center).
   - Options: `بالا` → `top`, `وسط` → `center`, `پایین` → `bottom`.
   - Label: `«برش تصویر کاشی»`
   - Description (fa): "نقطه‌ی برش تصویر کاشی. پیش‌فرض وسط است."
   - The select stores the *semantic* value (`top`/`center`/`bottom`), not raw
     CSS, so the exact percentages can be retuned later in code without a data
     migration.

Both fields are independent of `cover`; the existing
`parent ⇒ cover required` validation in the `beforeValidate` hook is untouched.

### Web data layer

**`apps/web/src/lib/payload.ts`** — extend `PayloadCategory`:

```ts
mosaicTileImage?: PayloadMedia | null;
mosaicTilePosition?: 'top' | 'center' | 'bottom' | null;
```

**`apps/web/src/lib/category-hub-content.ts`** — in `hubContentFromPayload`,
extend the existing chain at the front and pass the crop through:

```ts
const POS = { top: '50% 0%', center: '50% 50%', bottom: '50% 100%' } as const;

const tiles: SimpleTile[] = children.map((c) => ({
  key: c.slug,
  name: c.name,
  img: c.mosaicTileImage?.url ?? c.cover?.url ?? photos.get(c.slug) ?? undefined,
  pos: c.mosaicTilePosition ? POS[c.mosaicTilePosition] : undefined,
  href: `${basePath}/${c.slug}`,
}));
```

`pos` flows through `SimpleTile` → `toTile`, which already falls back to
`'50% 50%'` when `pos` is undefined — so blank == today's behavior. The
photo-first sort and `buildMosaicRows` rhythm are **unchanged**.

> Note: `fetchChildTilePhotos` (the product-photo fallback) is **not** changed.
> `mosaicTileImage` lives on the inflated child category object that
> `hubContentFromPayload` already receives, so no new query is needed. The
> `cover` upload is already inflated on children via `fetchChildCategories`
> (`depth=2`); confirm `mosaicTileImage` inflates at that depth during
> implementation (depth=2 inflates one upload level, so it should).

### Generated types

**`services/api/src/payload-types.ts`** — add both fields to the `Category`
interface and to `CategoriesSelect`. Hand-edited (per repo convention:
`generate:types` writes nothing on the box).

### Migration

New additive, nullable migration
`services/api/src/migrations/20260627_HHMMSS_add_mosaic_tile_to_categories.ts`,
registered in `migrations/index.ts`. Combines the two established patterns:

- **FK upload column** — mirror
  `20260626_140000_add_collection_tile_image_to_products.ts`:
  `categories.mosaic_tile_image_id integer` + FK to `media(id)`
  `ON DELETE SET NULL` + btree index.
- **Enum select column** — mirror
  `20260626_130000_…`: `CREATE TYPE "enum_categories_mosaic_tile_position"
  AS ENUM('top','center','bottom')` then
  `ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "mosaic_tile_position"
  "enum_categories_mosaic_tile_position";` (nullable, **no** default).
- `down()` drops the index, FK, both columns, and the enum type.

Run under Node 22 (`~/.nvm/.../v22.22.2`), hand-written (do not rely on
`migrate:create`, which hangs on this DB).

### Docs

`docs/spec/data-schemas.md` — document `mosaicTileImage` + `mosaicTilePosition`
on the Categories collection, next to the existing `cover` entry.

---

## Files touched

| File | Change |
|---|---|
| `services/api/src/collections/Categories.ts` | +2 fields after `cover` |
| `services/api/src/payload-types.ts` | +2 fields on `Category` + `CategoriesSelect` |
| `services/api/src/migrations/20260627_*_add_mosaic_tile_to_categories.ts` | new |
| `services/api/src/migrations/index.ts` | register migration |
| `apps/web/src/lib/payload.ts` | +2 fields on `PayloadCategory` |
| `apps/web/src/lib/category-hub-content.ts` | image fallback + crop mapping |
| `docs/spec/data-schemas.md` | document fields |

No component files change — `CategoryMosaic.tsx` already consumes `tile.img`
and `tile.pos`.

---

## Behavior summary

- Leave both fields blank → **identical** to today (cover → product fallback,
  centered crop). No data migration of existing content.
- Set `mosaicTileImage` → that image is the tile, independent of the hero.
- Set `mosaicTilePosition` → tile crop shifts to top/center/bottom.
- No effect on the leaf `ProductMosaic` path, on `cover`/hero rendering, on the
  hand-built root `/bedroom-furniture` mosaic (its own static SEED), or on
  ordering/featured selection.

## Verification

- Type-check `apps/web` and `services/api`.
- Apply the migration under Node 22; confirm column + enum type exist and
  `down()` reverses cleanly on a scratch DB.
- In `/lab` (or the live hub route), confirm: blank fields render as before; a
  set tile image overrides; each crop option visibly shifts the tile.
