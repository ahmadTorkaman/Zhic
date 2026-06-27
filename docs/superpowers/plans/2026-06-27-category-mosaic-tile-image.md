# Category Hub-Mosaic Tile Customization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the operator set a dedicated mosaic tile image and a top/center/bottom crop per category, controlling the auto-generated hub `CategoryMosaic`, while leaving today's behavior intact when the fields are blank.

**Architecture:** Two additive, nullable fields on the Payload `Categories` collection (`mosaicTileImage` upload + `mosaicTilePosition` select), mirroring the existing `collectionTileImage` pattern on Products. The web `hubContentFromPayload` extends its image fallback chain at the front and maps the crop select to a CSS `object-position`. No component changes; no data migration of existing content.

**Tech Stack:** Payload 3 (Postgres adapter), Next.js 16 / React 19, TypeScript 5, Vitest.

---

## Canonical names (use these EXACTLY everywhere)

| Concern | Value |
|---|---|
| Upload field | `mosaicTileImage` |
| Select field | `mosaicTilePosition` (values: `'top' \| 'center' \| 'bottom'`) |
| DB column (image) | `mosaic_tile_image_id` (integer FK → `media.id`) |
| DB column (position) | `mosaic_tile_position` |
| Postgres enum type | `enum_categories_mosaic_tile_position` |
| FK constraint | `categories_mosaic_tile_image_id_media_id_fk` |
| Index | `categories_mosaic_tile_image_idx` |
| Crop map | `top → '50% 0%'`, `center → '50% 50%'`, `bottom → '50% 100%'` |
| Migration file | `services/api/src/migrations/20260627_120000_add_mosaic_tile_to_categories.ts` |

> **Node version:** all Payload migrate commands run under Node 22:
> `~/.nvm/versions/node/v22.22.2/bin/node`. The box default (Node 24) breaks the
> Payload CLI. `generate:types` writes nothing on this box — `payload-types.ts`
> is hand-edited (Task 3).

---

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `services/api/src/collections/Categories.ts` | CMS field definitions | 1 |
| `services/api/src/migrations/20260627_120000_add_mosaic_tile_to_categories.ts` | DB columns + enum | 2 |
| `services/api/src/migrations/index.ts` | register migration | 2 |
| `services/api/src/payload-types.ts` | generated types (hand-edited) | 3 |
| `apps/web/src/lib/payload.ts` | `PayloadCategory` shape | 4 |
| `apps/web/src/lib/category-hub-content.ts` | image fallback + crop mapping | 4 |
| `apps/web/src/lib/__tests__/category-hub-content.test.ts` | unit test (new) | 4 |
| `docs/spec/data-schemas.md` | document the fields | 5 |

---

## Task 1: Add CMS fields to the Categories collection

**Files:**
- Modify: `services/api/src/collections/Categories.ts` (insert after the `cover` field, which ends at line 75 — before the `intro` field)

- [ ] **Step 1: Insert the two fields after `cover`**

In `services/api/src/collections/Categories.ts`, immediately after the closing
`},` of the `cover` field (line 75) and before the `intro` field (line 76),
insert:

```ts
    {
      name: 'mosaicTileImage',
      type: 'upload',
      relationTo: 'media',
      label: 'تصویر کاشی در دسته‌بندی والد',
      admin: {
        description:
          'تصویر این دسته در موزاییکِ صفحه‌ی دسته‌بندی والد. مستقل از «تصویر hero» است و فقط در کاشی‌های موزاییک استفاده می‌شود. اگر خالی بماند، «تصویر hero» و سپس اولین عکس محصولِ زیرمجموعه استفاده می‌شود.',
      },
    },
    {
      name: 'mosaicTilePosition',
      type: 'select',
      label: 'برش تصویر کاشی',
      options: [
        { label: 'بالا', value: 'top' },
        { label: 'وسط', value: 'center' },
        { label: 'پایین', value: 'bottom' },
      ],
      admin: {
        description: 'نقطه‌ی برش تصویر کاشی در موزاییک. پیش‌فرض وسط است.',
      },
    },
```

- [ ] **Step 2: Type-check the API package**

Run: `cd /home/ahmad/Zhic && pnpm -C services/api exec tsc --noEmit`
Expected: PASS (no new errors). The select/upload field shapes are standard
Payload config; `payload-types.ts` is updated in Task 3, so a `Category`
type error there is expected only if Task 3 is skipped — at this point the
collection config compiles on its own.

- [ ] **Step 3: Commit**

```bash
git add services/api/src/collections/Categories.ts
git commit -m "feat(cms): mosaicTileImage + mosaicTilePosition fields on Categories

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Database migration

**Files:**
- Create: `services/api/src/migrations/20260627_120000_add_mosaic_tile_to_categories.ts`
- Modify: `services/api/src/migrations/index.ts` (add import + array entry)

- [ ] **Step 1: Write the migration file**

Create `services/api/src/migrations/20260627_120000_add_mosaic_tile_to_categories.ts`:

```ts
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Add hub-mosaic tile controls on `categories`:
 *  - `mosaic_tile_image_id` FK → media (single upload), nullable. Mirrors
 *    products.collection_tile_image_id (20260626_140000). Independent of
 *    `cover`; the frontend falls back cover → first product photo when null.
 *  - `mosaic_tile_position` enum (top/center/bottom), nullable. Null == center.
 *
 * Additive, nullable — existing categories keep working unchanged.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "mosaic_tile_image_id" integer;

    DO $$ BEGIN
      ALTER TABLE "categories"
        ADD CONSTRAINT "categories_mosaic_tile_image_id_media_id_fk"
        FOREIGN KEY ("mosaic_tile_image_id")
        REFERENCES "media"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "categories_mosaic_tile_image_idx"
      ON "categories" USING btree ("mosaic_tile_image_id");

    DO $$ BEGIN
      CREATE TYPE "public"."enum_categories_mosaic_tile_position"
        AS ENUM('top', 'center', 'bottom');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "mosaic_tile_position"
      "enum_categories_mosaic_tile_position";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "categories_mosaic_tile_image_idx";
    ALTER TABLE "categories"
      DROP CONSTRAINT IF EXISTS "categories_mosaic_tile_image_id_media_id_fk",
      DROP COLUMN IF EXISTS "mosaic_tile_image_id",
      DROP COLUMN IF EXISTS "mosaic_tile_position";
    DROP TYPE IF EXISTS "public"."enum_categories_mosaic_tile_position";
  `)
}
```

- [ ] **Step 2: Register the migration in `index.ts`**

In `services/api/src/migrations/index.ts`, add the import after the
`20260626_140000` import line (line 30):

```ts
import * as migration_20260627_120000_add_mosaic_tile_to_categories from './20260627_120000_add_mosaic_tile_to_categories';
```

Then add this object as the LAST entry of the exported `migrations` array
(after the `20260626_140000_add_collection_tile_image_to_products` entry, before
the closing `];`):

```ts
  {
    up: migration_20260627_120000_add_mosaic_tile_to_categories.up,
    down: migration_20260627_120000_add_mosaic_tile_to_categories.down,
    name: '20260627_120000_add_mosaic_tile_to_categories'
  },
```

- [ ] **Step 3: Run the migration under Node 22**

Run:
```bash
cd /home/ahmad/Zhic/services/api && PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH" pnpm payload migrate
```
Expected: the new migration applies; output names
`20260627_120000_add_mosaic_tile_to_categories` as run. No errors.

- [ ] **Step 4: Verify the columns + enum exist**

Run (psql; adjust connection to match `services/api/.env` `DATABASE_URI`):
```bash
cd /home/ahmad/Zhic/services/api && PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH" pnpm payload migrate:status
```
Expected: the migration shows as applied (batch present, no pending). If a
direct DB check is preferred, confirm `categories.mosaic_tile_image_id`,
`categories.mosaic_tile_position`, and type
`enum_categories_mosaic_tile_position` exist.

- [ ] **Step 5: Commit**

```bash
git add services/api/src/migrations/20260627_120000_add_mosaic_tile_to_categories.ts services/api/src/migrations/index.ts
git commit -m "feat(cms): migration for categories mosaic tile image + position

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Hand-edit generated Payload types

**Files:**
- Modify: `services/api/src/payload-types.ts` (`Category` interface ~line 544; `CategoriesSelect` ~line 1608)

- [ ] **Step 1: Add fields to the `Category` interface**

In `services/api/src/payload-types.ts`, in `interface Category`, immediately
after the `cover?: (number | null) | Media;` line (line 544), insert:

```ts
  /**
   * تصویر این دسته در موزاییکِ صفحه‌ی دسته‌بندی والد. مستقل از «تصویر hero» است و فقط در کاشی‌های موزاییک استفاده می‌شود. اگر خالی بماند، «تصویر hero» و سپس اولین عکس محصولِ زیرمجموعه استفاده می‌شود.
   */
  mosaicTileImage?: (number | null) | Media;
  /**
   * نقطه‌ی برش تصویر کاشی در موزاییک. پیش‌فرض وسط است.
   */
  mosaicTilePosition?: ('top' | 'center' | 'bottom') | null;
```

- [ ] **Step 2: Add fields to `CategoriesSelect`**

In the same file, in `interface CategoriesSelect<T extends boolean = true>`,
after the `cover?: T;` line (line 1608), insert:

```ts
  mosaicTileImage?: T;
  mosaicTilePosition?: T;
```

- [ ] **Step 3: Type-check the API package**

Run: `cd /home/ahmad/Zhic && pnpm -C services/api exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add services/api/src/payload-types.ts
git commit -m "chore(cms): payload-types for categories mosaic tile fields

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Web data layer — type, fallback logic, crop mapping (TDD)

**Files:**
- Modify: `apps/web/src/lib/payload.ts` (`PayloadCategory`, ~line 231)
- Modify: `apps/web/src/lib/category-hub-content.ts` (`hubContentFromPayload`, lines 110-135)
- Create: `apps/web/src/lib/__tests__/category-hub-content.test.ts`

- [ ] **Step 1: Extend the `PayloadCategory` type**

In `apps/web/src/lib/payload.ts`, inside `export type PayloadCategory`, after
the `cover?: PayloadMedia | null;` line (line 231), insert:

```ts
  mosaicTileImage?: PayloadMedia | null;
  mosaicTilePosition?: 'top' | 'center' | 'bottom' | null;
```

- [ ] **Step 2: Write the failing test**

Create `apps/web/src/lib/__tests__/category-hub-content.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { hubContentFromPayload } from '../category-hub-content';
import type { PayloadCategory } from '../payload';

function cat(partial: Partial<PayloadCategory> & { slug: string }): PayloadCategory {
  return { id: partial.slug, name: partial.slug, ...partial } as PayloadCategory;
}

describe('hubContentFromPayload — tile image fallback', () => {
  const parent = cat({ slug: 'bed', name: 'تخت' });

  it('prefers mosaicTileImage over cover and product photo', () => {
    const child = cat({
      slug: 'single',
      mosaicTileImage: { url: '/tile.jpg' } as PayloadCategory['mosaicTileImage'],
      cover: { url: '/cover.jpg' } as PayloadCategory['cover'],
    });
    const photos = new Map([['single', '/product.jpg']]);
    const { tiles } = hubContentFromPayload(parent, [child], photos, '/bedroom-furniture/bed');
    expect(tiles[0]!.img).toBe('/tile.jpg');
  });

  it('falls back to cover when mosaicTileImage is absent', () => {
    const child = cat({ slug: 'single', cover: { url: '/cover.jpg' } as PayloadCategory['cover'] });
    const photos = new Map([['single', '/product.jpg']]);
    const { tiles } = hubContentFromPayload(parent, [child], photos, '/bedroom-furniture/bed');
    expect(tiles[0]!.img).toBe('/cover.jpg');
  });

  it('falls back to the product photo when neither image is set', () => {
    const child = cat({ slug: 'single' });
    const photos = new Map([['single', '/product.jpg']]);
    const { tiles } = hubContentFromPayload(parent, [child], photos, '/bedroom-furniture/bed');
    expect(tiles[0]!.img).toBe('/product.jpg');
  });
});

describe('hubContentFromPayload — crop position', () => {
  const parent = cat({ slug: 'bed' });
  const photos = new Map<string, string>();

  it('maps top/center/bottom to object-position strings', () => {
    const children = [
      cat({ slug: 'a', mosaicTilePosition: 'top', cover: { url: '/a.jpg' } as PayloadCategory['cover'] }),
      cat({ slug: 'b', mosaicTilePosition: 'center', cover: { url: '/b.jpg' } as PayloadCategory['cover'] }),
      cat({ slug: 'c', mosaicTilePosition: 'bottom', cover: { url: '/c.jpg' } as PayloadCategory['cover'] }),
    ];
    const byKey = Object.fromEntries(
      hubContentFromPayload(parent, children, photos, '/x').tiles.map((t) => [t.key, t.pos]),
    );
    expect(byKey.a).toBe('50% 0%');
    expect(byKey.b).toBe('50% 50%');
    expect(byKey.c).toBe('50% 100%');
  });

  it('leaves pos undefined when no position is set (toTile defaults to center)', () => {
    const child = cat({ slug: 'a', cover: { url: '/a.jpg' } as PayloadCategory['cover'] });
    const { tiles } = hubContentFromPayload(parent, [child], photos, '/x');
    expect(tiles[0]!.pos).toBeUndefined();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd /home/ahmad/Zhic && pnpm -C apps/web exec vitest run src/lib/__tests__/category-hub-content.test.ts`
Expected: FAIL — the `mosaicTileImage` precedence and `pos` mapping assertions
fail because `hubContentFromPayload` does not yet read the new fields.

- [ ] **Step 4: Implement the fallback + crop mapping**

In `apps/web/src/lib/category-hub-content.ts`, replace the `tiles` construction
inside `hubContentFromPayload` (lines 116-121) with:

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

(The existing photo-first `tiles.sort(...)` line directly below stays unchanged.)

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd /home/ahmad/Zhic && pnpm -C apps/web exec vitest run src/lib/__tests__/category-hub-content.test.ts`
Expected: PASS (all 5 tests).

- [ ] **Step 6: Type-check the web package**

Run: `cd /home/ahmad/Zhic && pnpm -C apps/web exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/lib/payload.ts apps/web/src/lib/category-hub-content.ts apps/web/src/lib/__tests__/category-hub-content.test.ts
git commit -m "feat(web): hub mosaic uses category mosaicTileImage + crop position

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Document the fields

**Files:**
- Modify: `docs/spec/data-schemas.md` (Categories collection section — near the existing `cover` field entry)

- [ ] **Step 1: Find the Categories `cover` entry**

Run: `cd /home/ahmad/Zhic && grep -n "cover" docs/spec/data-schemas.md | head`
Locate the Categories collection's field list (the row/line documenting `cover`).

- [ ] **Step 2: Add documentation for the two fields**

Immediately after the Categories `cover` field documentation, add entries
matching the surrounding format (table row or bullet — match what's there):

```markdown
- `mosaicTileImage` (upload → media, optional) — dedicated image for this
  category's tile in the parent hub `CategoryMosaic`. Independent of `cover`.
  Falls back to `cover`, then the first product photo in the subtree, when blank.
- `mosaicTilePosition` (select: top/center/bottom, optional) — crop anchor for
  the mosaic tile. Blank == center (`50% 50%`).
```

- [ ] **Step 3: Commit**

```bash
git add docs/spec/data-schemas.md
git commit -m "docs(schema): document categories mosaicTileImage + mosaicTilePosition

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Final verification (after all tasks)

- [ ] **Full web test suite:** `cd /home/ahmad/Zhic && pnpm -C apps/web test` → PASS.
- [ ] **Both type-checks:** `pnpm -C apps/web exec tsc --noEmit` and `pnpm -C services/api exec tsc --noEmit` → PASS.
- [ ] **Migration down/up round-trip (scratch or staging DB only):** under Node 22, `pnpm payload migrate:down` then `pnpm payload migrate` → both succeed, confirming `down()` reverses cleanly.
- [ ] **Inflation sanity check:** confirm `fetchChildCategories` (depth=2) inflates `mosaicTileImage` to a `Media` object on child categories — i.e. `c.mosaicTileImage?.url` is populated on a hub page after setting a tile image in admin. `cover` (also a single upload) already inflates at depth=2, so this should require no fetcher change; if `mosaicTileImage` comes back as a bare id, bump the relevant fetch depth or select the field explicitly.
- [ ] **Visual check:** in the live hub route (e.g. `/bedroom-furniture/bed`) or `/lab/category-hub`: blank fields render identically to before; a set `mosaicTileImage` overrides the tile; each `mosaicTilePosition` visibly shifts the crop.

---

## Notes / risk register

- **No component changes.** `CategoryMosaic.tsx` already consumes `tile.img` and
  `tile.pos`; `toTile` defaults `pos` to `'50% 50%'` when undefined, so a blank
  position is byte-identical to today.
- **Out of scope (deferred):** tile ordering, which-tile-is-featured, hiding
  empty children, layout rhythm. All remain automatic.
- **Crop percentages** are stored semantically (`top`/`center`/`bottom`) and
  mapped to CSS in one place (`POS` in `category-hub-content.ts`), so they can be
  retuned (e.g. `top → '50% 20%'`) later with no data migration.
- **Seed path unaffected:** the static `SEED` / `getHubContent` and the
  hand-built root `/bedroom-furniture` mosaic (`bedroom-furniture-mosaic.ts`
  `SEED`) are not touched; only the live `hubContentFromPayload` path changes.
