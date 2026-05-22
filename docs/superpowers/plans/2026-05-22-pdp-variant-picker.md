# PDP Variant Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static PDP price+CTA sidebar with a sticky-bottom variant picker bar that displays all axes' chips inline, cross-fades the hero image when the selected variant has its own photo, and auto-picks the first variant on page load. New `productVariants` Payload collection feeds it.

**Architecture:** New Payload collection `productVariants` (flexible JSON axes per spec §13 modified) + variant resolution helpers + React Context that pairs the bar with the hero image. The bar uses the canonical `.glass-card` recipe (ivory 60% + 24px backdrop-blur + sand border) for visual unity with the site header chrome and /designs v14 pedestal. The existing `<ProductSidebar>` is repurposed from a purchase widget into an info-only stack (طرح callout, lead time, warranty, materials).

**Tech Stack:** Next 16 App Router + React 19 + TypeScript 5 + Tailwind v4 + Payload 3 + PostgreSQL + Vitest. Persian-first RTL with Ayandeh font (already shipped).

**Spec:** `docs/superpowers/specs/2026-05-22-pdp-variant-picker-design.md` — read sections 0–14 before starting.

**Visual mockup** (kept in sync with the implementation):
- `apps/web/public/docs/pdp-variant-picker-mockup.html`

---

## Phase 0: Pre-flight

Before starting Task 1, verify the working environment:

```bash
cd /home/ahmad/Zhic
git status                            # should be clean (no uncommitted work)
git log --oneline -3                  # confirm 1791dcc (spec commit) is HEAD
pnpm --filter @zhic/api migrate:status # all migrations applied
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/  # 200 = web up
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/api/categories  # 200 = API up
```

If any check fails, stop and report.

Create the working branch:

```bash
git checkout -b feat/pdp-variant-picker
```

---

## Phase 1: Schema foundation

Goal: new `productVariants` Payload collection + hand-written Postgres migration + applied to DB + seeded with 8 demo variants for the flagship product.

### Task 1: Create `ProductVariants` collection

**Files:**
- Create: `services/api/src/collections/ProductVariants.ts`
- Modify: `services/api/src/payload.config.ts` (register the collection)
- Test: `services/api/src/__tests__/product-variants.test.ts` (new)

- [ ] **Step 1: Read the existing collection patterns**

```bash
cat services/api/src/collections/Products.ts | head -40
cat services/api/src/collections/Materials.ts
```

Note the established structure: `slug`, `labels`, `admin.useAsTitle`, `admin.defaultColumns`, `admin.group`, `access: publishedContentAccess`, fields array.

- [ ] **Step 2: Write the failing test**

Create `services/api/src/__tests__/product-variants.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ProductVariants } from '../collections/ProductVariants';

describe('ProductVariants collection', () => {
  it('has slug "productVariants"', () => {
    expect(ProductVariants.slug).toBe('productVariants');
  });

  it('declares all required fields', () => {
    const fieldNames = (ProductVariants.fields ?? []).map((f) => (f as { name: string }).name);
    expect(fieldNames).toEqual(
      expect.arrayContaining(['product', 'sku', 'label', 'axes', 'priceDeltaRials', 'availability', 'image', 'displayOrder'])
    );
  });

  it('product field is a required relationship to products', () => {
    const product = (ProductVariants.fields ?? []).find((f) => (f as { name: string }).name === 'product') as never;
    expect(product.type).toBe('relationship');
    expect(product.relationTo).toBe('products');
    expect(product.required).toBe(true);
  });

  it('sku is required and unique', () => {
    const sku = (ProductVariants.fields ?? []).find((f) => (f as { name: string }).name === 'sku') as never;
    expect(sku.required).toBe(true);
    expect(sku.unique).toBe(true);
  });

  it('axes is an array field with key + value sub-fields', () => {
    const axes = (ProductVariants.fields ?? []).find((f) => (f as { name: string }).name === 'axes') as never;
    expect(axes.type).toBe('array');
    const subFieldNames = (axes.fields ?? []).map((f: { name: string }) => f.name);
    expect(subFieldNames).toEqual(['key', 'value']);
  });

  it('availability matches Product.availability enum values', () => {
    const availability = (ProductVariants.fields ?? []).find((f) => (f as { name: string }).name === 'availability') as never;
    expect(availability.type).toBe('select');
    const values = (availability.options ?? []).map((o: { value: string }) => o.value);
    expect(values).toEqual(['in_stock', 'made_to_order', 'backorder', 'discontinued']);
  });
});
```

- [ ] **Step 3: Run the test — expect failure**

```bash
pnpm --filter @zhic/api vitest run src/__tests__/product-variants.test.ts
```

Expected: "Cannot find module '../collections/ProductVariants'" (file doesn't exist yet).

- [ ] **Step 4: Implement the collection**

Create `services/api/src/collections/ProductVariants.ts`:

```ts
import type { CollectionConfig } from 'payload'
import { publishedContentAccess } from '../lib/access'

export const ProductVariants: CollectionConfig = {
  slug: 'productVariants',
  labels: { singular: 'واریانت محصول', plural: 'واریانت‌های محصول' },
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'product', 'sku', 'availability'],
    group: 'کاتالوگ',
  },
  access: publishedContentAccess,
  // No label auto-generation. The `label` field is operator-set; if left
  // blank, the FRONTEND derives display text at render time as
  // "<product.name> · <axisKey1>=<valueLabel1> · ..." using the AXIS_LABEL
  // / VALUE_LABEL maps in PickerBar.
  fields: [
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true,
      label: 'محصول',
      admin: { position: 'sidebar' },
    },
    {
      name: 'sku',
      type: 'text',
      required: true,
      unique: true,
      label: 'SKU',
      admin: {
        description: 'مثلاً GAN-BED-120-H. الزامی و یکتا.',
      },
    },
    {
      name: 'label',
      type: 'text',
      required: false,
      label: 'برچسب',
      admin: {
        description: 'متن نمایشی در سبد و فاکتورها. اگر خالی باشد، از نام محصول و محورهای واریانت خودکار ساخته می‌شود.',
      },
    },
    {
      name: 'axes',
      type: 'array',
      label: 'محورهای واریانت',
      admin: {
        description: 'هر سطر یک محور (مثلاً سایز=۱۲۰). کلیدها باید با allowed_axes دسته‌بندی محصول هم‌خوان باشند.',
      },
      fields: [
        {
          name: 'key',
          type: 'text',
          required: true,
          label: 'محور',
          admin: { description: 'مثل size, footboard, doors, drawers, glass, width, pieces' },
        },
        {
          name: 'value',
          type: 'text',
          required: true,
          label: 'مقدار',
          admin: { description: 'مثل 120, high, 3, true' },
        },
      ],
    },
    {
      name: 'priceDeltaRials',
      type: 'number',
      required: false,
      defaultValue: 0,
      label: 'تغییر قیمت (ریال)',
      admin: {
        description: 'به قیمت پایه‌ی محصول اضافه می‌شود. می‌تواند صفر، مثبت، یا منفی باشد.',
      },
    },
    {
      name: 'availability',
      type: 'select',
      required: false,
      label: 'وضعیت موجودی (override)',
      options: [
        { label: 'موجود', value: 'in_stock' },
        { label: 'ساخت به‌سفارش', value: 'made_to_order' },
        { label: 'در انتظار', value: 'backorder' },
        { label: 'ناموجود', value: 'discontinued' },
      ],
      admin: {
        description: 'در صورت تنظیم، جایگزین وضعیت محصول می‌شود. خالی = وضعیت محصول.',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: false,
      label: 'تصویر واریانت',
      admin: {
        description: 'اختیاری. در صورت تنظیم، با انتخاب این واریانت روی صفحه‌ی محصول cross-fade می‌شود.',
      },
    },
    {
      name: 'displayOrder',
      type: 'number',
      required: false,
      defaultValue: 0,
      label: 'ترتیب نمایش',
      admin: {
        position: 'sidebar',
        description: 'هرچه کمتر، اول. پیش‌فرض ۰. هنگام تساوی، مرتب‌سازی ثانویه بر اساس createdAt صعودی.',
      },
    },
  ],
}
```

- [ ] **Step 5: Register the collection in payload.config.ts**

Open `services/api/src/payload.config.ts`. Find the import block (around lines 10–24 where other collections are imported). Add after the `Products` import:

```ts
import { ProductVariants } from './collections/ProductVariants'
```

Find the `collections: [...]` array (around line 61). Add `ProductVariants` to the array, right after `Products`:

```ts
collections: [
  Users,
  Designs,
  Products,
  ProductVariants,   // ← add this
  Showrooms,
  // ... rest unchanged
],
```

- [ ] **Step 6: Run the test — expect pass**

```bash
pnpm --filter @zhic/api vitest run src/__tests__/product-variants.test.ts
```

Expected: 5 passed.

- [ ] **Step 7: Typecheck**

```bash
pnpm --filter @zhic/api typecheck
```

Expected: clean.

- [ ] **Step 8: Commit**

```bash
git add services/api/src/collections/ProductVariants.ts services/api/src/payload.config.ts services/api/src/__tests__/product-variants.test.ts
git commit -m "$(cat <<'EOF'
feat(variants): add ProductVariants Payload collection

Per-product variant rows with flexible JSON axes (size, footboard,
doors, drawers, glass, width, pieces — whatever the product's
category.allowed_axes declares). Fields: product (FK), sku (unique),
label (operator override; auto-derived in frontend if blank), axes
(array of key/value pairs), priceDeltaRials (added to base),
availability (optional override), image (optional per-variant photo),
displayOrder (auto-pick-first sort key).

Replaces spec §13's hardcoded size/finish/fabric enum fields with the
flexible axes pattern locked in the May-21 brainstorm.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Hand-write the migration

**Files:**
- Create: `services/api/src/migrations/20260522_150000_create_product_variants.ts`

- [ ] **Step 1: Confirm the timestamp is free**

```bash
ls services/api/src/migrations/ | grep 20260522
```

Expected: no output. If a migration already uses `20260522_150000`, bump to the next minute.

- [ ] **Step 2: Write the migration file**

Create `services/api/src/migrations/20260522_150000_create_product_variants.ts`:

```ts
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Create the productVariants table + its axes child table for sub-project
 * C of the products overhaul.
 *
 *   productVariants
 *     id, product_id (FK), sku (unique), label, price_delta_rials,
 *     availability (varchar nullable), image_id (FK → media), display_order
 *
 *   productVariants_axes (child table for the `axes` array field)
 *     id, _order, _parent_id (FK → productVariants), key, value
 *
 * Indexes: (product_id), (product_id, display_order), sku unique,
 * (parent_id, key) on the axes child table for fast variant lookup.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "productVariants" (
      "id" serial PRIMARY KEY NOT NULL,
      "product_id" integer NOT NULL,
      "sku" varchar NOT NULL,
      "label" varchar,
      "price_delta_rials" numeric DEFAULT 0,
      "availability" varchar,
      "image_id" integer,
      "display_order" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "productVariants"
        ADD CONSTRAINT "productVariants_sku_unique" UNIQUE ("sku");
    EXCEPTION WHEN duplicate_table THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "productVariants"
        ADD CONSTRAINT "productVariants_product_id_products_id_fk"
        FOREIGN KEY ("product_id") REFERENCES "products"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "productVariants"
        ADD CONSTRAINT "productVariants_image_id_media_id_fk"
        FOREIGN KEY ("image_id") REFERENCES "media"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "productVariants_product_id_idx"
      ON "productVariants" USING btree ("product_id");

    CREATE INDEX IF NOT EXISTS "productVariants_product_display_idx"
      ON "productVariants" USING btree ("product_id", "display_order");

    CREATE TABLE IF NOT EXISTS "productVariants_axes" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "key" varchar NOT NULL,
      "value" varchar NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "productVariants_axes"
        ADD CONSTRAINT "productVariants_axes_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "productVariants"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "productVariants_axes_order_idx"
      ON "productVariants_axes" USING btree ("_order");

    CREATE INDEX IF NOT EXISTS "productVariants_axes_parent_id_idx"
      ON "productVariants_axes" USING btree ("_parent_id");

    CREATE INDEX IF NOT EXISTS "productVariants_axes_parent_key_idx"
      ON "productVariants_axes" USING btree ("_parent_id", "key");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "productVariants_axes";
    DROP TABLE IF EXISTS "productVariants";
  `)
}
```

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter @zhic/api typecheck
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add services/api/src/migrations/20260522_150000_create_product_variants.ts
git commit -m "$(cat <<'EOF'
feat(variants): migration creates productVariants + axes child table

Two new tables: productVariants (the variant row) and
productVariants_axes (the hasMany child table for the axes array
field). FK from productVariants.product_id → products.id ON DELETE
CASCADE; FK from productVariants.image_id → media.id ON DELETE SET
NULL; FK from productVariants_axes._parent_id → productVariants.id
ON DELETE CASCADE.

Indexes for the picker's two access patterns: per-product list (by
display_order) and axis lookup (parent_id + key).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Register + apply migration + manual types update

**Files:**
- Modify: `services/api/src/migrations/index.ts`
- Modify: `services/api/src/payload-types.ts` (manual update — `pnpm generate:types` is broken on this machine)

- [ ] **Step 1: Register the migration**

Edit `services/api/src/migrations/index.ts`. Add the import at the END of the imports block:

```ts
import * as migration_20260522_150000_create_product_variants from './20260522_150000_create_product_variants';
```

Add the entry at the END of the `migrations` array (append, do not insert):

```ts
  {
    up: migration_20260522_150000_create_product_variants.up,
    down: migration_20260522_150000_create_product_variants.down,
    name: '20260522_150000_create_product_variants'
  },
```

- [ ] **Step 2: Apply the migration**

```bash
pnpm --filter @zhic/api migrate
```

Expected: log line `Migrated: 20260522_150000_create_product_variants (<ms>ms)`. Exit 0.

- [ ] **Step 3: Verify in the database via Node pg**

```bash
node -e "
const { Client } = require('/home/ahmad/Zhic/services/api/node_modules/pg');
const url = require('fs').readFileSync('/home/ahmad/Zhic/services/api/.env','utf8').match(/(?:DATABASE_URI|POSTGRES_URL)=(.*)/)[1].trim();
const c = new Client({ connectionString: url });
(async () => {
  await c.connect();
  const t = await c.query(\"SELECT table_name FROM information_schema.tables WHERE table_name IN ('productVariants','productVariants_axes')\");
  console.log('tables:', t.rows.map(r => r.table_name).sort());
  const cols = await c.query(\"SELECT column_name FROM information_schema.columns WHERE table_name = 'productVariants' ORDER BY ordinal_position\");
  console.log('productVariants cols:', cols.rows.map(r => r.column_name));
  await c.end();
})();
"
```

Expected: `tables: [ 'productVariants', 'productVariants_axes' ]` and cols include `id, product_id, sku, label, price_delta_rials, availability, image_id, display_order, updated_at, created_at`.

- [ ] **Step 4: Manually update payload-types.ts**

`pnpm --filter @zhic/api generate:types` is pre-existing broken on this machine (tsx + Node 24 ESM bug — confirmed during sub-project D Task 3). Update `services/api/src/payload-types.ts` by hand to add the new collection types.

Open the file. Find the existing `Product` interface block (search for `interface Product {`). After the closing `}` of `Product`, add the new `ProductVariant` interface. The shape matches what `pnpm generate:types` would produce:

```ts
export interface ProductVariant {
  id: number;
  product: number | Product;
  sku: string;
  label?: string | null;
  axes?:
    | {
        key: string;
        value: string;
        id?: string | null;
      }[]
    | null;
  priceDeltaRials?: number | null;
  availability?: ('in_stock' | 'made_to_order' | 'backorder' | 'discontinued') | null;
  image?: (number | null) | Media;
  displayOrder?: number | null;
  updatedAt: string;
  createdAt: string;
}
```

Also find the `Config` interface (it has a `collections` map). Add `productVariants: ProductVariant;` to the map.

Find the `CollectionsJoins` type if present (Payload 3 uses this for join fields). It may need updating — but only if Task 6 below uses `type: 'join'`. For now, leave it.

- [ ] **Step 5: Typecheck**

```bash
pnpm --filter @zhic/api typecheck
pnpm --filter @zhic/web typecheck
```

Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add services/api/src/migrations/index.ts services/api/src/payload-types.ts
git commit -m "$(cat <<'EOF'
chore(variants): register migration + manual payload-types update

generate:types remains broken (tsx + Node 24 ESM bug, pre-existing).
ProductVariant interface added by hand matching the migration's
column set. Reverts to auto-gen when the upstream tsx issue resolves.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Seed 8 demo variants for `gandom-bed`

**Files:**
- Modify: `services/api/src/seed.ts`

- [ ] **Step 1: Read the existing product seed structure**

```bash
grep -n "gandom-bed\|prodGandomBed\|upsertBySlug.*products" services/api/src/seed.ts | head -10
```

Identify the variable name the existing seed uses for the gandom-bed product (probably `prodGandomBed` or similar). Note the position in the file where products are upserted — variants must be created AFTER that.

If gandom-bed doesn't exist in the seed, pick an existing product whose slug includes a bed-like name (search `where[slug]\['equals'\]` patterns in seed.ts). For this task assume the variable is `prodGandomBed`; substitute as needed.

- [ ] **Step 2: Add the variant seed block**

In `services/api/src/seed.ts`, AFTER the products are upserted but BEFORE the final `console.log('Seed complete!')` line, add a new block. The pattern matches existing seed blocks (upsertBy* helpers exist in the file):

```ts
  // ── Variants for the gandom-bed flagship product (sub-project C demo) ──
  // 4 sizes × 2 footboards = 8 variants. Operator can extend or replace
  // these once sub-project B's xlsx import runs.
  const variantSpecs: Array<{
    sku: string;
    axes: { key: string; value: string }[];
    priceDelta: number;
    label: string;
    displayOrder: number;
  }> = [
    { sku: 'GAN-BED-120-H', axes: [{ key: 'size', value: '120' }, { key: 'footboard', value: 'high' }], priceDelta: 0,           label: 'تخت گندم · ۱۲۰ · بلند',  displayOrder: 0 },
    { sku: 'GAN-BED-120-L', axes: [{ key: 'size', value: '120' }, { key: 'footboard', value: 'low'  }], priceDelta: -6000000,    label: 'تخت گندم · ۱۲۰ · کوتاه', displayOrder: 1 },
    { sku: 'GAN-BED-140-H', axes: [{ key: 'size', value: '140' }, { key: 'footboard', value: 'high' }], priceDelta: 37000000,    label: 'تخت گندم · ۱۴۰ · بلند',  displayOrder: 2 },
    { sku: 'GAN-BED-140-L', axes: [{ key: 'size', value: '140' }, { key: 'footboard', value: 'low'  }], priceDelta: 31000000,    label: 'تخت گندم · ۱۴۰ · کوتاه', displayOrder: 3 },
    { sku: 'GAN-BED-160-H', axes: [{ key: 'size', value: '160' }, { key: 'footboard', value: 'high' }], priceDelta: 80000000,    label: 'تخت گندم · ۱۶۰ · بلند',  displayOrder: 4 },
    { sku: 'GAN-BED-160-L', axes: [{ key: 'size', value: '160' }, { key: 'footboard', value: 'low'  }], priceDelta: 74000000,    label: 'تخت گندم · ۱۶۰ · کوتاه', displayOrder: 5 },
    { sku: 'GAN-BED-180-H', axes: [{ key: 'size', value: '180' }, { key: 'footboard', value: 'high' }], priceDelta: 116000000,   label: 'تخت گندم · ۱۸۰ · بلند',  displayOrder: 6 },
    { sku: 'GAN-BED-180-L', axes: [{ key: 'size', value: '180' }, { key: 'footboard', value: 'low'  }], priceDelta: 110000000,   label: 'تخت گندم · ۱۸۰ · کوتاه', displayOrder: 7 },
  ];

  for (const v of variantSpecs) {
    // Try to find an existing variant with this SKU first; create if not present.
    const existing = await payload.find({
      collection: 'productVariants' as any,
      where: { sku: { equals: v.sku } },
      limit: 1,
    });

    const variantData = {
      product: prodGandomBed.id,
      sku: v.sku,
      label: v.label,
      axes: v.axes,
      priceDeltaRials: v.priceDelta,
      displayOrder: v.displayOrder,
      // availability + image left null on every demo variant
    };

    if (existing.docs.length > 0) {
      await payload.update({
        collection: 'productVariants' as any,
        id: existing.docs[0].id,
        data: variantData as any,
      });
    } else {
      await payload.create({
        collection: 'productVariants' as any,
        data: variantData as any,
      });
    }
  }
  console.log(`  Variants seeded: ${variantSpecs.length} for gandom-bed`);
```

Adjust `prodGandomBed.id` to whatever variable name the existing seed uses.

- [ ] **Step 3: Run the seed**

```bash
DATABASE_URI="$(grep -oP '(?<=DATABASE_URI=).*' services/api/.env)" node services/api/node_modules/.bin/tsx services/api/src/seed.ts 2>&1 | tail -10
```

(Replace with `pnpm --filter @zhic/api seed` if that command works in this environment — see sub-project D Task 4 for the workaround pattern.)

Expected: includes `Variants seeded: 8 for gandom-bed`.

- [ ] **Step 4: Verify rows in DB**

```bash
node -e "
const { Client } = require('/home/ahmad/Zhic/services/api/node_modules/pg');
const url = require('fs').readFileSync('/home/ahmad/Zhic/services/api/.env','utf8').match(/(?:DATABASE_URI|POSTGRES_URL)=(.*)/)[1].trim();
const c = new Client({ connectionString: url });
(async () => {
  await c.connect();
  const variants = await c.query(\"SELECT id, sku, label, price_delta_rials, display_order FROM \\\"productVariants\\\" ORDER BY display_order\");
  console.log('variants:', variants.rows);
  const axes = await c.query(\"SELECT v.sku, a.key, a.value FROM \\\"productVariants\\\" v JOIN \\\"productVariants_axes\\\" a ON a._parent_id = v.id ORDER BY v.display_order, a._order\");
  console.log('axes count:', axes.rows.length);
  await c.end();
})();
"
```

Expected: 8 variants, 16 axis rows (2 axes per variant).

If `axes count` is 0 despite the seed printing "Variants seeded: 8", the Payload `hasMany` array field on `axes` may have a known ORM persistence quirk (documented in sub-project D Task 4 for `allowed_axes`). Fix: insert the axes rows directly via Node pg after the variant create/update, mirroring sub-project D's workaround. Add this immediately after the `create`/`update` calls in Step 2:

```ts
// Workaround for Payload 3 hasMany text persistence quirk
const variantId = (existing.docs.length > 0 ? existing.docs[0].id : (await payload.find({
  collection: 'productVariants' as any,
  where: { sku: { equals: v.sku } },
  limit: 1,
})).docs[0].id);
// Delete existing axes rows, re-insert fresh
// (Implementation: use payload.db.drizzle or raw SQL via the connection
// that's already loaded in payload's runtime — see seed.ts for the
// existing pattern from sub-project D Task 4 line ~225.)
```

Document precise SQL workaround inline in the implementer's commit if needed.

- [ ] **Step 5: Commit**

```bash
git add services/api/src/seed.ts
git commit -m "$(cat <<'EOF'
feat(seed): 8 demo variants for gandom-bed (4 sizes × 2 footboards)

Demo data so the new PickerBar renders meaningfully out of the box.
Full xlsx-driven seed (~880 variant rows across 220 products) lives in
sub-project B.

Each variant has a label, sku, axes[], priceDelta. No images on
variants in this demo — operator decides per-variant.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 2: Inquiry collection extension

### Task 5: Extend `Inquiries` with `productVariant` + `selectedAxes`

**Files:**
- Modify: `services/api/src/collections/Inquiries.ts`
- Create: `services/api/src/migrations/20260522_153000_extend_inquiries_with_variant.ts`
- Modify: `services/api/src/migrations/index.ts`
- Modify: `services/api/src/payload-types.ts` (manual)

- [ ] **Step 1: Read the current Inquiries shape**

```bash
cat services/api/src/collections/Inquiries.ts
```

Note the existing fields. We're adding TWO new fields between `product` and `status`.

- [ ] **Step 2: Edit Inquiries.ts**

After the existing `product` field block in `services/api/src/collections/Inquiries.ts` (currently the relationship to products around line 74), insert:

```ts
    {
      name: 'productVariant',
      type: 'relationship',
      relationTo: 'productVariants',
      label: 'واریانت محصول',
      admin: {
        position: 'sidebar',
        description: 'واریانت دقیقی که کاربر در PDP انتخاب کرده. در صورت محصول تک‌SKU خالی است.',
      },
    },
    {
      name: 'selectedAxes',
      type: 'json',
      label: 'محورهای انتخاب‌شده',
      admin: {
        position: 'sidebar',
        description: 'snapshot کلید/مقدار از زمان ارسال. مثلاً {"size":"160","footboard":"high"}.',
      },
    },
```

- [ ] **Step 3: Write the migration**

Create `services/api/src/migrations/20260522_153000_extend_inquiries_with_variant.ts`:

```ts
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "inquiries"
      ADD COLUMN IF NOT EXISTS "product_variant_id" integer,
      ADD COLUMN IF NOT EXISTS "selected_axes" jsonb;

    DO $$ BEGIN
      ALTER TABLE "inquiries"
        ADD CONSTRAINT "inquiries_product_variant_id_fk"
        FOREIGN KEY ("product_variant_id") REFERENCES "productVariants"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "inquiries_product_variant_id_idx"
      ON "inquiries" USING btree ("product_variant_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "inquiries"
      DROP CONSTRAINT IF EXISTS "inquiries_product_variant_id_fk",
      DROP COLUMN IF EXISTS "product_variant_id",
      DROP COLUMN IF EXISTS "selected_axes";
  `)
}
```

- [ ] **Step 4: Register the migration**

In `services/api/src/migrations/index.ts`, add the import at the end and append the entry:

```ts
import * as migration_20260522_153000_extend_inquiries_with_variant from './20260522_153000_extend_inquiries_with_variant';

// ...

  {
    up: migration_20260522_153000_extend_inquiries_with_variant.up,
    down: migration_20260522_153000_extend_inquiries_with_variant.down,
    name: '20260522_153000_extend_inquiries_with_variant'
  },
```

- [ ] **Step 5: Apply the migration**

```bash
pnpm --filter @zhic/api migrate
```

Expected: log line for the new migration. Exit 0.

- [ ] **Step 6: Manually update payload-types.ts**

In `services/api/src/payload-types.ts`, find the `Inquiry` interface. Add the new fields (matching what auto-gen would produce):

```ts
  productVariant?: (number | null) | ProductVariant;
  selectedAxes?: Record<string, unknown> | null;
```

Place them between `product` and `status` to mirror the collection field order.

- [ ] **Step 7: Typecheck**

```bash
pnpm --filter @zhic/api typecheck
pnpm --filter @zhic/web typecheck
```

Expected: clean.

- [ ] **Step 8: Commit**

```bash
git add services/api/src/collections/Inquiries.ts services/api/src/migrations/20260522_153000_extend_inquiries_with_variant.ts services/api/src/migrations/index.ts services/api/src/payload-types.ts
git commit -m "$(cat <<'EOF'
feat(inquiries): track productVariant + selectedAxes on inquiry rows

Two new fields on the inquiries collection: productVariant
(relationship → productVariants, nullable, set null on variant
delete) and selectedAxes (jsonb snapshot of the user's chip
selections at submission time). Lets the operator answer "which
size + footboard did this customer want" without separately joining.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 3: Web types + variant helpers

### Task 6: Extend `PayloadProduct` with variants + add `PayloadProductVariant` type

**Files:**
- Modify: `apps/web/src/lib/payload.ts`

- [ ] **Step 1: Read existing PayloadProduct type**

```bash
grep -n "PayloadProduct\b\|PayloadProductVariant\|fetchProduct\b" apps/web/src/lib/payload.ts | head
```

Identify where `PayloadProduct` is declared and where `fetchProduct` lives.

- [ ] **Step 2: Add `PayloadProductVariant` type**

In `apps/web/src/lib/payload.ts`, just BEFORE the existing `export type PayloadProduct = {` declaration, add:

```ts
export type PayloadProductVariantAxis = { key: string; value: string };

export type PayloadProductVariant = {
  id: string | number;
  product: string | number | PayloadProduct;
  sku: string;
  label?: string | null;
  axes: PayloadProductVariantAxis[];
  priceDeltaRials?: number | null;
  availability?: 'in_stock' | 'made_to_order' | 'backorder' | 'discontinued' | null;
  image?: PayloadMedia | null;
  displayOrder?: number | null;
  updatedAt?: string;
  createdAt?: string;
};
```

- [ ] **Step 3: Extend `PayloadProduct` with `variants`**

Find the existing `PayloadProduct` type. Add this field anywhere among the existing fields (placement is cosmetic — alphabetical with other relation fields is fine):

```ts
  variants?: PayloadProductVariant[] | null;
```

- [ ] **Step 4: Extend `fetchProduct` to deep-populate variants**

Find `fetchProduct(slug)` (around line 811). Change its `depth` parameter from `'3'` to remain `'3'` (already depth=3) — that should reach `variants → image → media`. BUT we also need the `?` URL to request `variants` to be populated. In Payload 3, depth + `populate[productVariants][image]` query params control this. Modify the function to include `variants` in the populate by extending the URL:

Find these lines (around 814–818):

```ts
  const params = new URLSearchParams({
    'where[slug][equals]': slug,
    'where[status][equals]': 'published',
    depth: '3',
    limit: '1',
  });
```

Replace with:

```ts
  const params = new URLSearchParams({
    'where[slug][equals]': slug,
    'where[status][equals]': 'published',
    depth: '3',
    limit: '1',
  });
  // Variants live in a separate collection; Payload 3 doesn't auto-populate
  // reverse-relations even at depth=3. We do a second fetch after the product
  // lookup and merge the variants in. The two-fetch model mirrors what
  // sub-project D does for designs-for-category.
```

Right after the product is found (around line 821 where `result.docs[0]` is returned), refactor to:

```ts
  const result = await payloadFetch<PayloadPage<PayloadProduct>>(
    `/api/products?${params.toString()}`,
    'products',
  );
  const product = result?.docs[0] ?? null;
  if (!product) return null;

  // Fetch variants for this product. Sorted by displayOrder ASC, then
  // createdAt ASC for tie-breaks. depth=2 inflates the optional `image`
  // upload field to a PayloadMedia object.
  const variantParams = new URLSearchParams({
    'where[product][equals]': String(product.id),
    sort: 'displayOrder,createdAt',
    depth: '2',
    limit: '50',
  });
  const variantList = await payloadFetch<PayloadList<PayloadProductVariant>>(
    `/api/productVariants?${variantParams.toString()}`,
    'product-variants',
  );
  product.variants = variantList?.docs ?? [];

  return product;
```

- [ ] **Step 5: Typecheck**

```bash
pnpm --filter @zhic/web typecheck
```

Expected: clean.

- [ ] **Step 6: Smoke test**

```bash
curl -s "http://localhost:3001/api/productVariants?where[product][equals]=1&depth=2" | python3 -m json.tool | head -40
```

(Adjust `equals=1` to the actual gandom-bed product id — find via `psql` or another query.)

Expected: JSON listing 8 variants. If 0 returned, the seed didn't take — go back to Task 4.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/lib/payload.ts
git commit -m "$(cat <<'EOF'
feat(variants): web-side PayloadProductVariant type + fetchProduct refresh

PayloadProductVariant added with the same shape as the Payload
collection (axes array, priceDeltaRials, optional image, etc.).
PayloadProduct gains a `variants?: PayloadProductVariant[] | null`
field. fetchProduct does a follow-up call to /api/productVariants
keyed on productId and merges the list into the returned product
object (mirroring the two-step join from sub-project D's
fetchDesignsForCategory).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Pure variant-resolution helpers

**Files:**
- Create: `apps/web/src/lib/variant-helpers.ts`
- Test: `apps/web/src/lib/__tests__/variant-helpers.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `apps/web/src/lib/__tests__/variant-helpers.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  resolveVariant,
  deriveAxisOptions,
  sortVariants,
  variantPriceRials,
  buildAxisLabel,
  buildValueLabel,
} from '../variant-helpers';
import type { PayloadProductVariant } from '../payload';

const sample: PayloadProductVariant[] = [
  { id: 1, product: 10, sku: 'A-120-H', axes: [{ key: 'size', value: '120' }, { key: 'footboard', value: 'high' }], priceDeltaRials: 0, displayOrder: 0 },
  { id: 2, product: 10, sku: 'A-120-L', axes: [{ key: 'size', value: '120' }, { key: 'footboard', value: 'low' }], priceDeltaRials: -6000000, displayOrder: 1 },
  { id: 3, product: 10, sku: 'A-160-H', axes: [{ key: 'size', value: '160' }, { key: 'footboard', value: 'high' }], priceDeltaRials: 80000000, displayOrder: 2, availability: 'discontinued' },
];

describe('resolveVariant', () => {
  it('returns the matching variant for a complete axis selection', () => {
    expect(resolveVariant(sample, { size: '120', footboard: 'high' })?.sku).toBe('A-120-H');
  });
  it('returns null when no variant matches', () => {
    expect(resolveVariant(sample, { size: '999', footboard: 'high' })).toBeNull();
  });
  it('returns null when selection has wrong axis count', () => {
    expect(resolveVariant(sample, { size: '120' })).toBeNull();
  });
  it('returns the first match deterministically when duplicates exist', () => {
    const dup = [...sample, { id: 99, product: 10, sku: 'DUP', axes: [{ key: 'size', value: '120' }, { key: 'footboard', value: 'high' }], priceDeltaRials: 0, displayOrder: 99 }];
    expect(resolveVariant(dup, { size: '120', footboard: 'high' })?.sku).toBe('A-120-H');
  });
});

describe('deriveAxisOptions', () => {
  it('returns axis groups in the allowedAxes order with deduped values', () => {
    const out = deriveAxisOptions(sample, ['size', 'footboard']);
    expect(out.map((a) => a.key)).toEqual(['size', 'footboard']);
    expect(out[0].values).toEqual(['120', '160']);
    expect(out[1].values).toEqual(['high', 'low']);
  });
  it('drops axes not in allowedAxes', () => {
    const variants: PayloadProductVariant[] = [
      { id: 1, product: 10, sku: 'X', axes: [{ key: 'size', value: '120' }, { key: 'mystery', value: 'foo' }], displayOrder: 0 },
    ];
    const out = deriveAxisOptions(variants, ['size']);
    expect(out.map((a) => a.key)).toEqual(['size']);
  });
  it('returns empty array when allowedAxes is empty', () => {
    expect(deriveAxisOptions(sample, [])).toEqual([]);
  });
});

describe('sortVariants', () => {
  it('sorts by displayOrder ASC, then createdAt ASC', () => {
    const variants: PayloadProductVariant[] = [
      { id: 1, product: 10, sku: 'B', axes: [], displayOrder: 1, createdAt: '2026-01-02T00:00:00.000Z' },
      { id: 2, product: 10, sku: 'A', axes: [], displayOrder: 0, createdAt: '2026-01-03T00:00:00.000Z' },
      { id: 3, product: 10, sku: 'C', axes: [], displayOrder: 1, createdAt: '2026-01-01T00:00:00.000Z' },
    ];
    expect(sortVariants(variants).map((v) => v.sku)).toEqual(['A', 'C', 'B']);
  });
  it('treats null displayOrder as 0', () => {
    const variants: PayloadProductVariant[] = [
      { id: 1, product: 10, sku: 'B', axes: [], displayOrder: 1 },
      { id: 2, product: 10, sku: 'A', axes: [], displayOrder: null as never },
    ];
    expect(sortVariants(variants).map((v) => v.sku)).toEqual(['A', 'B']);
  });
});

describe('variantPriceRials', () => {
  it('adds priceDelta to product base', () => {
    expect(variantPriceRials(100000000, sample[1])).toBe(94000000);
  });
  it('treats null variant as base price', () => {
    expect(variantPriceRials(100000000, null)).toBe(100000000);
  });
  it('treats null priceDelta as 0', () => {
    expect(variantPriceRials(100000000, { ...sample[0], priceDeltaRials: null })).toBe(100000000);
  });
});

describe('buildAxisLabel', () => {
  it('returns the Persian label for known axes', () => {
    expect(buildAxisLabel('size')).toBe('سایز');
    expect(buildAxisLabel('footboard')).toBe('پاتختی');
    expect(buildAxisLabel('doors')).toBe('درب‌ها');
  });
  it('returns the raw key for unknown axes', () => {
    expect(buildAxisLabel('mystery')).toBe('mystery');
  });
});

describe('buildValueLabel', () => {
  it('returns Persian label for known string values', () => {
    expect(buildValueLabel('footboard', 'high')).toBe('بلند');
    expect(buildValueLabel('footboard', 'low')).toBe('کوتاه');
    expect(buildValueLabel('glass', 'true')).toBe('شیشه‌دار');
  });
  it('converts numeric values to Persian digits', () => {
    expect(buildValueLabel('size', '120')).toBe('۱۲۰');
    expect(buildValueLabel('drawers', '3')).toBe('۳');
  });
  it('returns the raw value for unknown axis+value combinations', () => {
    expect(buildValueLabel('mystery', 'foo')).toBe('foo');
  });
});
```

- [ ] **Step 2: Run the tests — expect failure**

```bash
pnpm --filter @zhic/web vitest run src/lib/__tests__/variant-helpers.test.ts
```

Expected: "Cannot find module '../variant-helpers'".

- [ ] **Step 3: Implement the helpers**

Create `apps/web/src/lib/variant-helpers.ts`:

```ts
import { toPersianDigits } from '@zhic/locale';
import type { PayloadProductVariant } from './payload';

type SelectedAxes = Record<string, string>;

/**
 * Persian display labels for known axis keys. Unknown axes fall back to
 * the raw key. The xlsx-import (sub-project B) must keep its `key` values
 * aligned with this map.
 */
const AXIS_LABEL: Record<string, string> = {
  size: 'سایز',
  footboard: 'پاتختی',
  doors: 'درب‌ها',
  drawers: 'کشوها',
  glass: 'شیشه',
  width: 'عرض',
  pieces: 'تعداد قطعه',
};

/**
 * Persian display labels for non-numeric axis values. Keyed by
 * `<axisKey>:<value>` so the same string ('high') can map differently in
 * a different axis. Numeric values are not listed here; they're rendered
 * via toPersianDigits().
 */
const VALUE_LABEL: Record<string, string> = {
  'footboard:high': 'بلند',
  'footboard:low': 'کوتاه',
  'glass:true': 'شیشه‌دار',
  'glass:false': 'بدون شیشه',
};

/**
 * Find the variant matching a complete axis selection. Returns null if
 * no variant matches OR if the selection has the wrong number of axes.
 */
export function resolveVariant(
  variants: PayloadProductVariant[],
  selectedAxes: SelectedAxes,
): PayloadProductVariant | null {
  const targetKeys = Object.keys(selectedAxes);
  return (
    variants.find((v) => {
      if (v.axes.length !== targetKeys.length) return false;
      return v.axes.every((a) => selectedAxes[a.key] === a.value);
    }) ?? null
  );
}

/**
 * Build the picker's axis groups. Order follows `allowedAxes` (which
 * comes from the product's category). Values are deduped from the
 * variant data and preserve their first-seen order.
 */
export function deriveAxisOptions(
  variants: PayloadProductVariant[],
  allowedAxes: string[],
): { key: string; values: string[] }[] {
  return allowedAxes.map((key) => ({
    key,
    values: dedupe(
      variants.flatMap((v) =>
        v.axes.filter((a) => a.key === key).map((a) => a.value),
      ),
    ),
  }));
}

function dedupe<T>(arr: T[]): T[] {
  const seen = new Set<T>();
  const out: T[] = [];
  for (const x of arr) {
    if (seen.has(x)) continue;
    seen.add(x);
    out.push(x);
  }
  return out;
}

/**
 * Stable sort by displayOrder ASC, breaking ties by createdAt ASC.
 * Null displayOrder is treated as 0. Returns a new array; does not
 * mutate the input.
 */
export function sortVariants(variants: PayloadProductVariant[]): PayloadProductVariant[] {
  return [...variants].sort((a, b) => {
    const aOrder = a.displayOrder ?? 0;
    const bOrder = b.displayOrder ?? 0;
    if (aOrder !== bOrder) return aOrder - bOrder;
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return aTime - bTime;
  });
}

/**
 * Compute the price in rials for a given product base + selected
 * variant. If variant is null, returns the base. priceDeltaRials null
 * is treated as 0.
 */
export function variantPriceRials(
  basePriceRials: number,
  variant: PayloadProductVariant | null,
): number {
  if (!variant) return basePriceRials;
  return basePriceRials + (variant.priceDeltaRials ?? 0);
}

/**
 * Persian label for an axis key. Falls back to the raw key.
 */
export function buildAxisLabel(key: string): string {
  return AXIS_LABEL[key] ?? key;
}

/**
 * Persian label for a value within an axis. Numeric values get
 * toPersianDigits; known string values get their VALUE_LABEL entry;
 * unknown strings fall back to themselves.
 */
export function buildValueLabel(axisKey: string, value: string): string {
  // Numeric (or numeric-string) values: render Persian digits.
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return toPersianDigits(value);
  }
  return VALUE_LABEL[`${axisKey}:${value}`] ?? value;
}
```

- [ ] **Step 4: Run the tests — expect pass**

```bash
pnpm --filter @zhic/web vitest run src/lib/__tests__/variant-helpers.test.ts
```

Expected: 17 passed.

- [ ] **Step 5: Typecheck**

```bash
pnpm --filter @zhic/web typecheck
```

Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/variant-helpers.ts apps/web/src/lib/__tests__/variant-helpers.test.ts
git commit -m "$(cat <<'EOF'
feat(variants): pure resolution + label helpers

Six pure functions in apps/web/src/lib/variant-helpers.ts:
  - resolveVariant(variants, selectedAxes): find the matching row
  - deriveAxisOptions(variants, allowedAxes): build picker groups
  - sortVariants(variants): displayOrder then createdAt, stable
  - variantPriceRials(base, variant): adds priceDelta to base
  - buildAxisLabel(key): Persian axis label with raw-key fallback
  - buildValueLabel(axisKey, value): Persian value label; numeric
    values render via toPersianDigits

17 vitest cases. AXIS_LABEL + VALUE_LABEL maps colocated for
single-point-of-update when sub-project B's xlsx adds new axes.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 4: State + small components

### Task 8: `<VariantSelectionContext>` + `useVariantSelection`

**Files:**
- Create: `apps/web/src/components/product/VariantSelectionContext.tsx`
- Test: `apps/web/src/components/product/__tests__/VariantSelectionContext.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/components/product/__tests__/VariantSelectionContext.test.tsx`:

```tsx
/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import {
  VariantSelectionProvider,
  useVariantSelection,
} from '../VariantSelectionContext';
import type { PayloadProductVariant } from '@/lib/payload';

const variants: PayloadProductVariant[] = [
  { id: 1, product: 10, sku: 'A-120', axes: [{ key: 'size', value: '120' }], displayOrder: 0 },
  { id: 2, product: 10, sku: 'A-160', axes: [{ key: 'size', value: '160' }], displayOrder: 1 },
];

function Probe({ onState }: { onState: (state: ReturnType<typeof useVariantSelection>) => void }) {
  const state = useVariantSelection();
  onState(state);
  return null;
}

describe('<VariantSelectionProvider>', () => {
  it('seeds selectedAxes from initialVariant.axes', () => {
    let captured: ReturnType<typeof useVariantSelection> | null = null;
    render(
      <VariantSelectionProvider variants={variants} initialVariant={variants[0]}>
        <Probe onState={(s) => (captured = s)} />
      </VariantSelectionProvider>,
    );
    expect(captured!.selectedAxes).toEqual({ size: '120' });
    expect(captured!.selectedVariant?.sku).toBe('A-120');
  });

  it('seeds empty selectedAxes when initialVariant is null', () => {
    let captured: ReturnType<typeof useVariantSelection> | null = null;
    render(
      <VariantSelectionProvider variants={variants} initialVariant={null}>
        <Probe onState={(s) => (captured = s)} />
      </VariantSelectionProvider>,
    );
    expect(captured!.selectedAxes).toEqual({});
    expect(captured!.selectedVariant).toBeNull();
  });

  it('useVariantSelection throws outside provider', () => {
    expect(() => render(<Probe onState={() => {}} />)).toThrow(/VariantSelectionProvider/);
  });
});
```

- [ ] **Step 2: Run the test — expect failure**

```bash
pnpm --filter @zhic/web vitest run src/components/product/__tests__/VariantSelectionContext.test.tsx
```

Expected: "Cannot find module '../VariantSelectionContext'".

- [ ] **Step 3: Implement the context**

Create `apps/web/src/components/product/VariantSelectionContext.tsx`:

```tsx
'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { resolveVariant } from '@/lib/variant-helpers';
import type { PayloadProductVariant } from '@/lib/payload';

type SelectedAxes = Record<string, string>;

type Ctx = {
  variants: PayloadProductVariant[];
  selectedAxes: SelectedAxes;
  selectedVariant: PayloadProductVariant | null;
  selectAxis: (key: string, value: string) => void;
};

const Context = createContext<Ctx | null>(null);

export function VariantSelectionProvider({
  variants,
  initialVariant,
  children,
}: {
  variants: PayloadProductVariant[];
  initialVariant: PayloadProductVariant | null;
  children: ReactNode;
}) {
  const [selectedAxes, setSelectedAxes] = useState<SelectedAxes>(() => {
    if (!initialVariant) return {};
    return Object.fromEntries(initialVariant.axes.map((a) => [a.key, a.value]));
  });

  const selectedVariant = useMemo(
    () => resolveVariant(variants, selectedAxes),
    [variants, selectedAxes],
  );

  const selectAxis = (key: string, value: string) =>
    setSelectedAxes((prev) => ({ ...prev, [key]: value }));

  return (
    <Context.Provider value={{ variants, selectedAxes, selectedVariant, selectAxis }}>
      {children}
    </Context.Provider>
  );
}

export function useVariantSelection() {
  const v = useContext(Context);
  if (!v) throw new Error('useVariantSelection must be used inside VariantSelectionProvider');
  return v;
}
```

- [ ] **Step 4: Run the test — expect pass**

```bash
pnpm --filter @zhic/web vitest run src/components/product/__tests__/VariantSelectionContext.test.tsx
```

Expected: 3 passed.

- [ ] **Step 5: Typecheck**

```bash
pnpm --filter @zhic/web typecheck
```

Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/product/VariantSelectionContext.tsx apps/web/src/components/product/__tests__/VariantSelectionContext.test.tsx
git commit -m "$(cat <<'EOF'
feat(variants): VariantSelectionProvider + useVariantSelection

Tiny React Context that pairs the PickerBar (writer) with HeroImage,
SpecsAccordion (readers). State seed = initialVariant.axes turned
into a record; selectedVariant is a useMemo around resolveVariant.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: `<InfoCard>` glasscard sidebar tile

**Files:**
- Create: `apps/web/src/components/product/InfoCard.tsx`
- Create: `apps/web/src/components/product/InfoCard.module.css`

- [ ] **Step 1: Write the CSS**

Create `apps/web/src/components/product/InfoCard.module.css`:

```css
/* Canonical .glass-card recipe — same tokens as
   packages/design-system/css/base.css .glass-card. Mirrored here as a
   CSS module so the component is colocated with its styles. */
.card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: 4px;
  padding-block: 18px;
  padding-inline: 20px;
  box-shadow: var(--shadow-subtle);
  transition:
    background var(--dur-hover) var(--ease-out-soft),
    box-shadow var(--dur-hover) var(--ease-out-soft),
    transform var(--dur-hover) var(--ease-out-soft);
}
.card:hover {
  background: rgba(250, 250, 247, 0.8);
  box-shadow: var(--shadow-card);
  transform: translateY(var(--hover-lift));
}
.card.forest { border-color: rgba(95, 119, 96, 0.28); }
.lbl {
  font-size: 11px;
  letter-spacing: 0.18em;
  color: var(--color-stone);
  text-transform: uppercase;
  font-weight: 700;
  margin-block-end: 6px;
}
.card.forest .lbl { color: var(--color-forest); }
.val {
  font-size: 15px;
  color: var(--color-ink);
  font-weight: 400;
  line-height: 1.5;
}
.val strong { font-weight: 700; }
```

- [ ] **Step 2: Implement the component**

Create `apps/web/src/components/product/InfoCard.tsx`:

```tsx
import type { ReactNode } from 'react';
import styles from './InfoCard.module.css';

export type InfoCardProps = {
  label: string;
  children: ReactNode;
  variant?: 'default' | 'forest';
};

export function InfoCard({ label, children, variant = 'default' }: InfoCardProps) {
  const cls = variant === 'forest' ? `${styles.card} ${styles.forest}` : styles.card;
  return (
    <div className={cls}>
      <div className={styles.lbl}>{label}</div>
      <div className={styles.val}>{children}</div>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter @zhic/web typecheck
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/product/InfoCard.tsx apps/web/src/components/product/InfoCard.module.css
git commit -m "$(cat <<'EOF'
feat(product): InfoCard — canonical glasscard sidebar tile

Mirrors packages/design-system/css/base.css .glass-card recipe as a
colocated CSS module: ivory 60% + 24px backdrop-blur + sand 50%
border + subtle shadow. Hover: ivory 80% + card shadow + 2px lift.
Forest variant tints the border + label toward forest.

Used by the repurposed ProductSidebar (طرح callout, زمان تحویل,
گارانتی, روکش).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 5: Hero + Picker UI

### Task 10: `<HeroImage>` cross-fading product image

**Files:**
- Create: `apps/web/src/components/product/HeroImage.tsx`
- Create: `apps/web/src/components/product/HeroImage.module.css`

- [ ] **Step 1: Write the CSS**

Create `apps/web/src/components/product/HeroImage.module.css`:

```css
/* Two stacked layers — base = product hero, overlay = variant image.
   Overlay cross-fades on opacity over 600ms when its src changes. */
.frame { position: relative; inline-size: 100%; block-size: 100%; }
.layer {
  position: absolute;
  inset: 0;
  transition: opacity 600ms cubic-bezier(0.22, 1, 0.36, 1);
}
.layer img { inline-size: 100%; block-size: 100%; object-fit: cover; display: block; }
.layer.base { opacity: 1; }
.layer.overlay { opacity: 0; }
.layer.overlay.visible { opacity: 1; }

@media (prefers-reduced-motion: reduce) {
  .layer { transition: none; }
}
```

- [ ] **Step 2: Implement the component**

Create `apps/web/src/components/product/HeroImage.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { PayloadImage } from '@/components/PayloadImage';
import { useVariantSelection } from './VariantSelectionContext';
import type { PayloadProduct } from '@/lib/payload';
import styles from './HeroImage.module.css';

export type HeroImageProps = {
  product: PayloadProduct;
};

export function HeroImage({ product }: HeroImageProps) {
  const { selectedVariant } = useVariantSelection();
  const cover = product.gallery?.[0] ?? null;
  const variantImage = selectedVariant?.image ?? null;
  const [overlayVisible, setOverlayVisible] = useState(false);

  // Toggle overlay visibility based on whether the selected variant has its
  // own image. When variantImage becomes null, fade overlay out; when it
  // becomes set, fade in.
  useEffect(() => {
    setOverlayVisible(Boolean(variantImage?.url));
  }, [variantImage?.url]);

  return (
    <div className={styles.frame}>
      <div className={`${styles.layer} ${styles.base}`} aria-hidden={overlayVisible || undefined}>
        {cover ? <PayloadImage media={cover} alt={product.name} loading="eager" fetchPriority="high" /> : null}
      </div>
      <div
        className={`${styles.layer} ${styles.overlay} ${overlayVisible ? styles.visible : ''}`}
        aria-hidden
      >
        {variantImage ? <PayloadImage media={variantImage} alt="" loading="eager" /> : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter @zhic/web typecheck
```

Expected: clean. If PayloadImage's props don't accept `fetchPriority`, drop that prop (older versions only have `loading`).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/product/HeroImage.tsx apps/web/src/components/product/HeroImage.module.css
git commit -m "$(cat <<'EOF'
feat(product): HeroImage with 600ms cross-fade to variant image

Two stacked PayloadImage layers — base is the product hero cover,
overlay is selectedVariant.image. Overlay's opacity is toggled by
the variant selection from VariantSelectionContext; transitions
600ms cubic-bezier(0.22, 1, 0.36, 1). When the selected variant has
no image, overlay fades back to 0 exposing the base.

ARIA: base carries the alt; overlay is aria-hidden (decorative).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: `<PickerBar>` — the sticky variant picker

**Files:**
- Create: `apps/web/src/components/product/PickerBar.tsx`
- Create: `apps/web/src/components/product/PickerBar.module.css`
- Test: `apps/web/src/components/product/__tests__/PickerBar.test.tsx`

- [ ] **Step 1: Write the CSS**

Create `apps/web/src/components/product/PickerBar.module.css`:

```css
/* Sticky bottom variant picker — glasscard recipe + ivory at 78%
   (more opaque than --glass-bg=60% because the bar sits over a
   constantly-changing hero image). 24px blur + saturate(1.05).
   Sand border. Soft shadow + top-edge highlight. Always-on-screen. */
.bar {
  position: fixed;
  inset-block-end: 16px;
  inset-inline: 16px;
  z-index: 90;
  background: rgba(250, 250, 247, 0.78);
  backdrop-filter: blur(var(--glass-blur)) saturate(1.05);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(1.05);
  color: var(--color-charcoal);
  border-radius: 8px;
  border: 1px solid var(--glass-border);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    0 12px 40px rgba(20, 17, 15, 0.08);
  padding-block: 14px;
  padding-inline: 18px;
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 18px;
  transform: translateY(120%);
  transition: transform 350ms cubic-bezier(0.16, 1, 0.3, 1);
}
.bar.in { transform: translateY(0); }

@media (max-width: 767px) {
  .bar {
    inset-block-end: 12px;
    inset-inline: 12px;
    padding-block: 12px;
    padding-inline: 14px;
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .bar { transition: none; transform: translateY(0); }
}

.axes {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
}
@media (max-width: 767px) { .axes { gap: 14px; } }

.axisGroup { display: flex; flex-direction: column; gap: 4px; }
.axisLabel {
  font-size: 10px;
  color: var(--color-stone);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-weight: 700;
}
.axisChips { display: flex; gap: 4px; flex-wrap: wrap; }

.chip {
  font-size: 13px;
  padding-block: 5px;
  padding-inline: 11px;
  border-radius: 9999px;
  background: rgba(232, 224, 216, 0.45);
  color: var(--color-charcoal);
  cursor: pointer;
  transition:
    background var(--dur-hover) var(--ease-out-soft),
    color var(--dur-hover) var(--ease-out-soft),
    opacity var(--dur-hover) var(--ease-out-soft);
  font-weight: 400;
  font-feature-settings: "tnum";
  user-select: none;
  border: 1px solid transparent;
}
.chip:hover { background: rgba(232, 224, 216, 0.7); color: var(--color-ink); }
.chip.active {
  background: var(--color-ink);
  color: var(--color-ivory);
  font-weight: 700;
  border-color: var(--color-ink);
}
.chip.disabled { opacity: 0.32; cursor: not-allowed; pointer-events: none; }

.right {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-inline-start: 8px;
  border-inline-start: 1px solid rgba(232, 224, 216, 0.7);
}
@media (max-width: 767px) {
  .right {
    padding-inline-start: 0;
    border-inline-start: 0;
    border-block-start: 1px solid rgba(232, 224, 216, 0.7);
    padding-block-start: 10px;
    justify-content: space-between;
  }
}

.price { display: flex; flex-direction: column; gap: 2px; }
.priceLbl {
  font-size: 9px;
  color: var(--color-stone);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-weight: 700;
}
.priceNum {
  font-size: 19px;
  font-weight: 700;
  color: var(--color-ink);
  font-feature-settings: "tnum";
  line-height: 1;
  transition: opacity 200ms var(--ease-out-soft);
}
.priceNum.flip { opacity: 0; }
.priceUnit {
  font-size: 11px;
  color: var(--color-stone);
  margin-inline-start: 4px;
  font-weight: 400;
}

.cta {
  background: var(--color-ink);
  color: var(--color-ivory);
  font-size: 14px;
  font-weight: 700;
  padding-block: 12px;
  padding-inline: 24px;
  border-radius: 6px;
  border: 1px solid var(--color-ink);
  transition:
    background var(--dur-hover) var(--ease-out-soft),
    color var(--dur-hover) var(--ease-out-soft),
    transform .15s var(--ease-out-soft);
  white-space: nowrap;
  position: relative;
  cursor: pointer;
}
.cta::after {
  content: '';
  position: absolute;
  inset-block-end: -1px;
  inset-inline: 6px;
  block-size: 2px;
  background: var(--color-gold);
  border-radius: 1px;
  transition: inset var(--dur-hover) var(--ease-out-soft);
}
.cta:hover { background: var(--color-charcoal); }
.cta:hover::after { inset-inline: 2px; }
.cta:active { transform: scale(0.98); }
```

- [ ] **Step 2: Write the failing test**

Create `apps/web/src/components/product/__tests__/PickerBar.test.tsx`:

```tsx
/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { VariantSelectionProvider } from '../VariantSelectionContext';
import { PickerBar } from '../PickerBar';
import type { PayloadProduct, PayloadProductVariant } from '@/lib/payload';

const product = {
  id: 10,
  slug: 'gandom-bed',
  name: 'تخت گندم',
  basePriceRials: 100000000,
} as PayloadProduct;

const variants: PayloadProductVariant[] = [
  { id: 1, product: 10, sku: 'A-120-H', axes: [{ key: 'size', value: '120' }, { key: 'footboard', value: 'high' }], priceDeltaRials: 0, displayOrder: 0 },
  { id: 2, product: 10, sku: 'A-120-L', axes: [{ key: 'size', value: '120' }, { key: 'footboard', value: 'low' }], priceDeltaRials: -6000000, displayOrder: 1 },
  { id: 3, product: 10, sku: 'A-160-H', axes: [{ key: 'size', value: '160' }, { key: 'footboard', value: 'high' }], priceDeltaRials: 80000000, displayOrder: 2 },
];

function Wrap({ children, initial = variants[0] }: { children: React.ReactNode; initial?: PayloadProductVariant | null }) {
  return (
    <VariantSelectionProvider variants={variants} initialVariant={initial}>
      {children}
    </VariantSelectionProvider>
  );
}

describe('<PickerBar>', () => {
  it('renders one radiogroup per allowed axis', () => {
    const { container } = render(
      <Wrap>
        <PickerBar product={product} variants={variants} allowedAxes={['size', 'footboard']} />
      </Wrap>,
    );
    const groups = container.querySelectorAll('[role="radiogroup"]');
    expect(groups.length).toBe(2);
  });

  it('marks the active chip with aria-checked="true"', () => {
    const { container } = render(
      <Wrap>
        <PickerBar product={product} variants={variants} allowedAxes={['size', 'footboard']} />
      </Wrap>,
    );
    const activeChips = container.querySelectorAll('[role="radio"][aria-checked="true"]');
    // 1 active chip per axis = 2 active chips total
    expect(activeChips.length).toBe(2);
  });

  it('renders 0 radiogroups when allowedAxes is empty (single-SKU products)', () => {
    const { container } = render(
      <Wrap>
        <PickerBar product={product} variants={[]} allowedAxes={[]} />
      </Wrap>,
    );
    expect(container.querySelectorAll('[role="radiogroup"]').length).toBe(0);
  });

  it('shows the CTA always (single-SKU and multi-variant products alike)', () => {
    const { container } = render(
      <Wrap initial={null}>
        <PickerBar product={product} variants={[]} allowedAxes={[]} />
      </Wrap>,
    );
    const cta = container.querySelector('button[type="button"]');
    expect(cta?.textContent).toContain('استعلام قیمت');
  });
});
```

- [ ] **Step 3: Run the test — expect failure**

```bash
pnpm --filter @zhic/web vitest run src/components/product/__tests__/PickerBar.test.tsx
```

Expected: "Cannot find module '../PickerBar'".

- [ ] **Step 4: Implement the component**

Create `apps/web/src/components/product/PickerBar.tsx`:

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { formatToman } from '@zhic/money';
import { useVariantSelection } from './VariantSelectionContext';
import {
  deriveAxisOptions,
  variantPriceRials,
  buildAxisLabel,
  buildValueLabel,
} from '@/lib/variant-helpers';
import type { PayloadProduct, PayloadProductVariant } from '@/lib/payload';
import styles from './PickerBar.module.css';

export type PickerBarProps = {
  product: PayloadProduct;
  variants: PayloadProductVariant[];
  allowedAxes: string[];
  onInquiry?: (payload: { productId: string | number; variantId: string | number | null; selectedAxes: Record<string, string> }) => void;
};

export function PickerBar({ product, variants, allowedAxes, onInquiry }: PickerBarProps) {
  const { selectedAxes, selectedVariant, selectAxis } = useVariantSelection();
  const [inView, setInView] = useState(false);
  const [priceFlip, setPriceFlip] = useState(false);
  const priceRef = useRef<HTMLSpanElement>(null);

  // Slide up on first paint
  useEffect(() => {
    const id = requestAnimationFrame(() => setInView(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Cross-fade the price on selection change
  const priceRials = variantPriceRials(product.basePriceRials ?? 0, selectedVariant);
  const priceDisplay = formatToman(priceRials);

  useEffect(() => {
    if (!priceRef.current) return;
    setPriceFlip(true);
    const t = window.setTimeout(() => setPriceFlip(false), 200);
    return () => window.clearTimeout(t);
  }, [priceDisplay]);

  const axisOptions = deriveAxisOptions(variants, allowedAxes);

  const handleInquiry = () => {
    onInquiry?.({
      productId: product.id,
      variantId: selectedVariant?.id ?? null,
      selectedAxes: { ...selectedAxes },
    });
  };

  return (
    <div className={`${styles.bar} ${inView ? styles.in : ''}`} role="region" aria-label="انتخاب واریانت">
      {axisOptions.length > 0 ? (
        <div className={styles.axes}>
          {axisOptions.map((axis) => {
            const labelId = `picker-axis-${axis.key}`;
            return (
              <div key={axis.key} className={styles.axisGroup}>
                <span id={labelId} className={styles.axisLabel}>{buildAxisLabel(axis.key)}</span>
                <div role="radiogroup" aria-labelledby={labelId} className={styles.axisChips}>
                  {axis.values.map((value) => {
                    const isActive = selectedAxes[axis.key] === value;
                    // Disable if NO variant exists for the current partial selection + this value.
                    const wouldSelect = { ...selectedAxes, [axis.key]: value };
                    const candidate = variants.find((v) =>
                      v.axes.length === Object.keys(wouldSelect).length &&
                      v.axes.every((a) => wouldSelect[a.key] === a.value),
                    );
                    const disabled = candidate?.availability === 'discontinued';
                    return (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        aria-label={`${buildAxisLabel(axis.key)}: ${buildValueLabel(axis.key, value)}`}
                        aria-disabled={disabled || undefined}
                        className={`${styles.chip} ${isActive ? styles.active : ''} ${disabled ? styles.disabled : ''}`}
                        onClick={() => !disabled && selectAxis(axis.key, value)}
                      >
                        {buildValueLabel(axis.key, value)}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Single-SKU product — render a quiet placeholder so the grid keeps shape
        <div className={styles.axes} aria-hidden />
      )}

      <div className={styles.right}>
        <div className={styles.price}>
          <span className={styles.priceLbl}>قیمت</span>
          <span>
            <span
              ref={priceRef}
              className={`${styles.priceNum} ${priceFlip ? styles.flip : ''}`}
            >
              {priceDisplay}
            </span>
            <span className={styles.priceUnit}>تومان</span>
          </span>
        </div>
        <button type="button" className={styles.cta} onClick={handleInquiry}>
          استعلام قیمت
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run the test — expect pass**

```bash
pnpm --filter @zhic/web vitest run src/components/product/__tests__/PickerBar.test.tsx
```

Expected: 4 passed.

- [ ] **Step 6: Typecheck**

```bash
pnpm --filter @zhic/web typecheck
```

Expected: clean. If `formatToman` is not the right export name from `@zhic/money`, check the package and substitute (e.g., `formatRialsAsToman`).

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/product/PickerBar.tsx apps/web/src/components/product/PickerBar.module.css apps/web/src/components/product/__tests__/PickerBar.test.tsx
git commit -m "$(cat <<'EOF'
feat(product): PickerBar — sticky bottom variant picker

Glasscard chrome (ivory 78% + 24px backdrop-blur + sand border).
Inline chip strips per allowed axis with radio semantics + aria
labels. Single ink-background CTA with a 2px gold accent line at the
bottom edge — "accent is earned" per operator memory. Auto-slides up
on first paint via requestAnimationFrame; price digits cross-fade
200ms on selection change.

Single-SKU products (no variants OR empty allowed_axes) render the
bar with no axes section — just price + CTA. CTA emits
{productId, variantId, selectedAxes} via the optional onInquiry
prop; the page wires that to the existing inquiry form.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 6: Refactors

### Task 12: Refactor `<ProductSidebar>` to info-only stack

**Files:**
- Modify: `apps/web/src/components/product/ProductSidebar.tsx`

- [ ] **Step 1: Read the current ProductSidebar**

```bash
cat apps/web/src/components/product/ProductSidebar.tsx
```

Note what it renders today (price, CTA, etc.). Plan the swap.

- [ ] **Step 2: Replace the implementation**

Replace the entire body of `apps/web/src/components/product/ProductSidebar.tsx` with:

```tsx
import Link from 'next/link';
import { InfoCard } from './InfoCard';
import { toPersianDigits } from '@zhic/locale';
import type { PayloadProduct } from '@/lib/payload';

export type ProductSidebarProps = {
  product: PayloadProduct;
};

/**
 * Info-only sidebar — price + CTA have moved to the sticky PickerBar.
 * This panel carries secondary specs the picker can't surface inline:
 * طرح callout (with link), زمان تحویل, گارانتی, روکش‌ها.
 */
export function ProductSidebar({ product }: ProductSidebarProps) {
  const designName = typeof product.design === 'object' && product.design ? product.design.name : null;
  const designSlug = typeof product.design === 'object' && product.design ? product.design.slug : null;
  const leadTimeDays = product.leadTimeDays ?? 56;
  const warrantyYears = product.warrantyYears ?? 5;
  const materials = (product.materialIds ?? []).map((m) => m.name).filter(Boolean);

  return (
    <div className="flex flex-col gap-4">
      {designName && designSlug ? (
        <InfoCard label="طرح" variant="forest">
          <Link href={`/designs/${designSlug}`} className="text-ink hover:text-forest">
            <strong>{designName}</strong>
          </Link>
        </InfoCard>
      ) : null}
      <InfoCard label="زمان تحویل">
        {toPersianDigits(leadTimeDays)} روز کاری
      </InfoCard>
      <InfoCard label="گارانتی">
        {toPersianDigits(warrantyYears)} سال ساختار
      </InfoCard>
      {materials.length > 0 ? (
        <InfoCard label="روکش‌ها">
          {materials.join(' · ')}
        </InfoCard>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter @zhic/web typecheck
```

Expected: clean. If `product.design` or `product.warrantyYears` types are different in the current `PayloadProduct`, adjust accordingly (it may need a `(product as any).warrantyYears` cast if the field hasn't been added yet — but spec §12 defines it; verify in `apps/web/src/lib/payload.ts`).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/product/ProductSidebar.tsx
git commit -m "$(cat <<'EOF'
refactor(product): ProductSidebar → info-only InfoCard stack

Price + inquiry CTA moved to the sticky PickerBar (Task 11). The
sidebar now carries 4 InfoCard panels: طرح (forest variant, links
to /designs/[slug]), زمان تحویل, گارانتی, روکش‌ها. Public API
(ProductSidebar({ product })) unchanged so the page doesn't need
updating yet.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 13: Refactor `<SpecsAccordion>` for variant-aware dimensions

**Files:**
- Modify: `apps/web/src/components/product/SpecsAccordion.tsx`

- [ ] **Step 1: Read the current SpecsAccordion**

```bash
cat apps/web/src/components/product/SpecsAccordion.tsx
```

The component currently receives `specs: { label, content }[]` and renders a `<details>`-based accordion. We need to make the "ابعاد" row's width reflect the selected variant's `size` axis.

- [ ] **Step 2: Add a variant-aware dimensions helper**

The simplest path is to compute `specs` at the page level (Task 14) using the selected variant — meaning SpecsAccordion stays unchanged from a code perspective. **No edit needed in this file.** Confirm by reading the existing implementation; if it already takes `specs` as a prop, the page can pass variant-derived specs.

If the existing accordion takes `product` directly and builds specs internally, refactor: change its prop from `product` to `specs: { label, content }[]` (matching what the page already passes per the current page.tsx).

Looking at current `apps/web/src/app/(site)/products/[slug]/page.tsx` line 113: `<SpecsAccordion specs={specs} />`. So SpecsAccordion already takes `specs`. **No change needed in this file.**

- [ ] **Step 3: Mark this task complete without code changes**

Document the decision with a one-liner commit so the task isn't silently skipped:

```bash
git commit --allow-empty -m "$(cat <<'EOF'
chore(specs): no SpecsAccordion refactor needed — page owns specs build

Confirmed during impl: SpecsAccordion already takes specs[] as a prop;
variant-aware dimensions ("ابعاد") are computed at the page level (Task
14) using the selected variant's size axis. The accordion is a pure
renderer and doesn't need to know about variants.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

If the existing accordion is found to build specs internally and the assumption above is wrong, file a refactor commit instead — make it take `specs: { label, content }[]` and compute the array in the page.

---

### Task 14: Rewrite `/products/[slug]/page.tsx`

**Files:**
- Modify: `apps/web/src/app/(site)/products/[slug]/page.tsx`

- [ ] **Step 1: Read the current page**

```bash
cat apps/web/src/app/(site)/products/[slug]/page.tsx
```

Note the existing layout: StickyBreadcrumb → CinematicHero → Container → 2-col content → Related row. We keep all of that; we add: `VariantSelectionProvider` wrapping the page; `HeroImage` replacing the inline `<PayloadImage>`; `<SpecsAccordion>` specs computed from `selectedVariant`; `PickerBar` mounted at the end inside the Provider.

- [ ] **Step 2: Write the new page**

Replace `apps/web/src/app/(site)/products/[slug]/page.tsx` with:

```tsx
import { notFound } from 'next/navigation';
import { Container } from '@zhic/ui';
import { StickyBreadcrumb } from '@/components/layout/StickyBreadcrumb';
import { CinematicHero } from '@/components/hero/CinematicHero';
import { ProductThumbnails } from '@/components/product/ProductThumbnails';
import { ProductSidebar } from '@/components/product/ProductSidebar';
import { SpecsAccordion } from '@/components/product/SpecsAccordion';
import { PayloadImage } from '@/components/PayloadImage';
import { Tile } from '@/components/tile/Tile';
import { RichText } from '@/lib/richtext';
import { fetchProduct, productPath } from '@/lib/payload';
import { buildMetadata } from '@/lib/seo';
import { VariantSelectionProvider } from '@/components/product/VariantSelectionContext';
import { HeroImage } from '@/components/product/HeroImage';
import { PickerBar } from '@/components/product/PickerBar';
import { sortVariants } from '@/lib/variant-helpers';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const product = await fetchProduct(slug);
  return buildMetadata({
    seo: product?.seo,
    title: product?.name ?? 'محصول',
    description: product?.shortDescription,
    path: `/products/${slug}`,
  });
}

export default async function ProductPage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const product = await fetchProduct(slug);
  if (!product) notFound();

  const crumbs = [
    { label: 'خانه', href: '/' },
    { label: 'محصولات', href: '/products' },
    { label: product.name },
  ];

  const gallery = product.gallery ?? [];
  const variants = sortVariants(product.variants ?? []);
  const firstVariant = variants[0] ?? null;
  const category = typeof product.categoryIds?.[0] === 'object' ? product.categoryIds[0] : null;
  const allowedAxes = category?.allowed_axes ?? [];

  // Specs are computed from product fields. The "ابعاد" row is left as
  // product-level; the picker handles the size axis. (If we want
  // selected-variant-aware dimensions on the spec row, we'd need a client
  // wrapper around the accordion — deferred to a follow-up.)
  const specs: { label: string; content: React.ReactNode }[] = [];

  if (product.dimensions) {
    const parts: string[] = [];
    if (product.dimensions.width) parts.push(`عرض: ${product.dimensions.width} سانتی‌متر`);
    if (product.dimensions.depth) parts.push(`عمق: ${product.dimensions.depth} سانتی‌متر`);
    if (product.dimensions.height) parts.push(`ارتفاع: ${product.dimensions.height} سانتی‌متر`);
    if (parts.length) {
      specs.push({ label: 'ابعاد', content: <span dir="ltr">{parts.join(' · ')}</span> });
    }
  }
  if (product.materialIds?.length) {
    specs.push({ label: 'متریال', content: product.materialIds.map((m) => m.name).join(' · ') });
  }
  if (product.specs) {
    specs.push({ label: 'مشخصات فنی', content: <RichText value={product.specs} /> });
  }

  return (
    <VariantSelectionProvider variants={variants} initialVariant={firstVariant}>
      <StickyBreadcrumb items={crumbs} />

      <CinematicHero image={<HeroImage product={product} />} />

      <Container>
        <div className="grid grid-cols-1 gap-[var(--space-8)] pb-9 lg:grid-cols-[1fr_320px]">
          <div>
            {gallery.length > 1 ? (
              <div className="mb-7">
                <ProductThumbnails images={gallery} activeIndex={0} />
              </div>
            ) : null}
            <h1 className="mb-4 text-h2 font-black text-ink">{product.name}</h1>
            {product.tagline ? <p className="mb-6 text-lead font-light text-stone">{product.tagline}</p> : null}
            {product.shortDescription ? (
              <p className="mb-7 max-w-[560px] text-body leading-[1.85] text-charcoal">{product.shortDescription}</p>
            ) : null}
            {product.longDescription ? (
              <div className="mb-7 max-w-[560px] text-body leading-[1.85] text-charcoal">
                <RichText value={product.longDescription} />
              </div>
            ) : null}
            {specs.length > 0 ? (
              <div className="mt-7 border-t border-sand pt-6">
                <h2 className="mb-5 text-h4 font-bold text-charcoal">مشخصات</h2>
                <SpecsAccordion specs={specs} />
              </div>
            ) : null}
          </div>
          <aside>
            <ProductSidebar product={product} />
          </aside>
        </div>

        {/* Related products */}
        {product.relatedProductIds && product.relatedProductIds.length > 0 ? (
          <section className="border-t border-sand py-9">
            <h2 className="mb-6 text-h3 font-bold text-ink">محصولات مرتبط</h2>
            <div className="grid grid-cols-2 gap-[var(--space-5)] md:grid-cols-4">
              {product.relatedProductIds.slice(0, 4).map((rp) => (
                <Tile
                  key={String(rp.id)}
                  href={productPath(rp.slug)}
                  image={<PayloadImage media={rp.gallery?.[0] ?? null} alt={rp.name} fallbackText="تصویر" />}
                  aspect="4/5"
                  title={rp.name}
                  price={rp.basePriceRials ?? undefined}
                  hover="full"
                />
              ))}
            </div>
          </section>
        ) : null}
      </Container>

      <div className="pb-[calc(var(--picker-h,76px)+24px)]" />

      <PickerBar product={product} variants={variants} allowedAxes={allowedAxes} />
    </VariantSelectionProvider>
  );
}
```

- [ ] **Step 3: Build + smoke**

```bash
pnpm --filter @zhic/web build 2>&1 | tail -10
pm2 restart zhic-web --update-env
until curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ | grep -q 200; do sleep 1; done; echo "ready"

curl -s -o /dev/null -w "/products/gandom-bed → %{http_code}\n" http://localhost:3000/products/gandom-bed
curl -s -o /dev/null -w "/products/nonexistent → %{http_code}\n" http://localhost:3000/products/nonexistent
```

Expected: `200` and `404`.

Verify the picker bar markup appears:

```bash
curl -s http://localhost:3000/products/gandom-bed | grep -c 'role="radio"'
```

Expected: ≥ 6 (4 size + 2 footboard chips = 6, but extras can come from disabled-state HTML).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/(site)/products/[slug]/page.tsx
git commit -m "$(cat <<'EOF'
feat(product): rewrite /products/[slug] for variant picker

Page is now wrapped in VariantSelectionProvider. CinematicHero gets
HeroImage as its image — the two-layer cross-fading component. The
existing sidebar still receives `product` but is now info-only via
the Task 12 refactor. PickerBar mounts at the bottom inside the
Provider; it reads category.allowed_axes to know what to render.

Bottom padding spacer prevents the sticky bar from covering the
last related-products row. No URL changes.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 7: Inquiry wiring

### Task 15: Wire `onInquiry` to the inquiry submission flow

**Files:**
- Modify: `apps/web/src/app/(site)/products/[slug]/page.tsx` (small — pass `onInquiry`)
- Likely modify: inquiry form / API route (depending on how it's wired today)

- [ ] **Step 1: Find the existing inquiry submission code**

```bash
grep -rn "inquiry\|استعلام\|/api/inquiries" apps/web/src/components apps/web/src/app/api 2>/dev/null | head -20
```

Identify how the current inquiry form submits (a React component? a Server Action? a `POST /api/inquiries` route?).

- [ ] **Step 2: Plan the integration**

Option A: If there's a CTA button somewhere that opens a modal/dialog with the inquiry form, refactor PickerBar's CTA to open the same flow + pass `variantId` and `selectedAxes` through a Context or URL fragment.

Option B (simpler): The PickerBar's `<button>` currently calls `onInquiry`. The page passes a Server Action `onInquiry` that opens a route like `/api/inquiries` with the payload + redirects to a "thanks" page.

If Option B is feasible, in the page:

```tsx
'use client'  // page becomes client OR we extract a small client wrapper
// ...
const handleInquiry = (payload) => {
  // POST to /api/inquiries with the payload + window.location.assign('/thank-you')
};
return (
  // ...
  <PickerBar product={product} variants={variants} allowedAxes={allowedAxes} onInquiry={handleInquiry} />
);
```

But the page is a SERVER component. Cleanest: extract a small `<InquiryHandler>` client component that wraps `<PickerBar>` (or is rendered as a sibling) and owns the click handler.

- [ ] **Step 3: Create the client wrapper**

Create `apps/web/src/components/product/InquiryHandler.tsx`:

```tsx
'use client';

import { PickerBar, type PickerBarProps } from './PickerBar';

type Props = Omit<PickerBarProps, 'onInquiry'> & { thankYouPath?: string };

export function InquiryHandler({ thankYouPath = '/thank-you', ...rest }: Props) {
  const submit = async (payload: Parameters<NonNullable<PickerBarProps['onInquiry']>>[0]) => {
    // Open the inquiry modal OR submit directly. For v1, redirect to the
    // contact page with prefilled product + variant query params; the
    // contact-form server action does the actual create.
    const params = new URLSearchParams();
    params.set('product', String(payload.productId));
    if (payload.variantId !== null) params.set('variant', String(payload.variantId));
    for (const [k, v] of Object.entries(payload.selectedAxes)) params.set(`axis_${k}`, v);
    window.location.assign(`/contact?${params.toString()}`);
  };

  return <PickerBar {...rest} onInquiry={submit} />;
}
```

(If the existing inquiry form uses a different pattern — a dialog overlay, a Slack-style command, etc. — adjust this wrapper to call into that pattern. The simplest v1 redirects to `/contact` with query params; the contact page's form pre-fills + submits.)

- [ ] **Step 4: Update the page to use InquiryHandler**

In `apps/web/src/app/(site)/products/[slug]/page.tsx`, change the import + usage:

```tsx
// REMOVE: import { PickerBar } from '@/components/product/PickerBar';
import { InquiryHandler } from '@/components/product/InquiryHandler';

// ... and change:
// FROM: <PickerBar product={product} variants={variants} allowedAxes={allowedAxes} />
// TO:   <InquiryHandler product={product} variants={variants} allowedAxes={allowedAxes} />
```

- [ ] **Step 5: Smoke test**

```bash
pnpm --filter @zhic/web build 2>&1 | tail -5
pm2 restart zhic-web --update-env
until curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ | grep -q 200; do sleep 1; done; echo "ready"
curl -s -o /dev/null -w "/products/gandom-bed → %{http_code}\n" http://localhost:3000/products/gandom-bed
```

Verify by clicking the CTA in the browser at `http://80.240.31.146:3000/products/gandom-bed`: should redirect to `/contact?product=<id>&variant=<id>&axis_size=120&axis_footboard=high`.

(The contact page is expected to read these query params + populate its form; that wiring is the operator's existing contact-page logic — `FU-PDV-k` if not already there.)

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/product/InquiryHandler.tsx apps/web/src/app/(site)/products/[slug]/page.tsx
git commit -m "$(cat <<'EOF'
feat(product): InquiryHandler wires PickerBar CTA → /contact with prefill

Thin client wrapper around PickerBar that intercepts the inquiry
click and redirects to /contact with product, variant, and axis
query params for the existing contact form to read.

If /contact doesn't yet read these params, that's FU-PDV-k —
documented in state.md as part of Task 16.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 8: Verification + ship

### Task 16: Smoke + visual sweep + state.md update

**Manual.** No new code unless a defect surfaces.

- [ ] **Step 1: Full smoke**

```bash
pnpm --filter @zhic/web build 2>&1 | tail -10
pm2 restart zhic-web --update-env
until curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ | grep -q 200; do sleep 1; done; echo "ready"

curl -s -o /dev/null -w "/products/gandom-bed                → %{http_code}\n" http://localhost:3000/products/gandom-bed
curl -s -o /dev/null -w "/products/nonexistent               → %{http_code}\n" http://localhost:3000/products/nonexistent
curl -s -o /dev/null -w "/products                           → %{http_code}\n" http://localhost:3000/products
curl -s -o /dev/null -w "/categories/mirrors                 → %{http_code}\n" http://localhost:3000/categories/mirrors
curl -s -o /dev/null -w "/categories/wall-mirror             → %{http_code}\n" http://localhost:3000/categories/wall-mirror
curl -s -o /dev/null -w "/designs                            → %{http_code}\n" http://localhost:3000/designs
curl -s -o /dev/null -w "/                                   → %{http_code}\n" http://localhost:3000/
```

Expected: all 200 except `/products/nonexistent` (404).

- [ ] **Step 2: Markup checks**

```bash
# 4 size chips + 2 footboard chips
curl -s http://localhost:3000/products/gandom-bed | grep -oE 'role="radio"' | wc -l
# Expected: 6

# CTA renders
curl -s http://localhost:3000/products/gandom-bed | grep -c 'استعلام قیمت'
# Expected: >= 1

# Glasscard recipe is in the picker bar (backdrop-filter blur in inline style or class)
curl -s http://localhost:3000/products/gandom-bed | grep -c 'backdrop-filter\|picker-bar\|PickerBar'
# Expected: >= 1 (CSS-module class names get hashed but the inline styles or class fragments still match)
```

- [ ] **Step 3: Browser verification (operator/manual)**

Open http://80.240.31.146:3000/products/gandom-bed and verify:

1. Hero image renders eagerly.
2. Sticky picker bar slides up from bottom on first paint.
3. Glass-look bar — visible through to the page content behind it.
4. First chip in each axis is active (auto-pick first via displayOrder).
5. Click a different chip → price changes (200ms fade).
6. Click multiple chips → variant resolves to a different sku.
7. CTA «استعلام قیمت» click → redirects to /contact with query params.
8. Resize to 375px width — bar stacks vertically; chips remain tappable.
9. Enable reduced-motion (DevTools Rendering panel) — animations are instant.
10. Sidebar shows 4 InfoCard panels with glasscard styling.

- [ ] **Step 4: Update state.md**

Edit `docs/state.md`. Add a Post-Phase row near the top (after the categories row added by sub-project D Task 18):

```
| 5.1 PDP variant picker | ✅ | _this branch HEAD_ | Full PDP variant-picker UX shipped. New productVariants Payload collection (axes JSON, priceDelta, optional per-variant image, displayOrder). Sticky bottom bar with inline-chip interaction (β density) using the canonical .glass-card recipe. Hero cross-fades 600ms to variant.image when set. Sidebar repurposed from purchase-widget to info-only InfoCard stack (طرح / lead time / warranty / materials). InquiryHandler wraps the bar; CTA redirects to /contact with product+variant+axes prefill. 17 vitest cases across helpers + components. Spec: docs/superpowers/specs/2026-05-22-pdp-variant-picker-design.md. Open FUs: PDV-a..k. |
```

Add the FU rows at the bottom of the follow-ups table:

```
| FU-PDV-a | AggregateOffer JSON-LD with lowPrice/highPrice across variants |
| FU-PDV-b | Admin-only variant-list <details> in the sidebar (?debug=1 flag) |
| FU-PDV-c | Variant inventory sync via MES (Package 4) |
| FU-PDV-d | Per-variant 3D model variants via gltfVariantName |
| FU-PDV-e | Shareable variant URLs (?v=<sku>) with canonical redirect |
| FU-PDV-f | Variant matrix admin UI for Cartesian-product auto-gen |
| FU-PDV-g | Color-swatch chip rendering for finish-type axes |
| FU-PDV-h | Animated number counter for price (deferred — luxury restraint) |
| FU-PDV-i | Per-axis disabled-combination logic (progressive disclosure) |
| FU-PDV-j | Mobile bar auto-collapse if axes wrap to 3+ lines |
| FU-PDV-k | /contact form to read product+variant+axes query params and prefill |
| FU-PDV-l | Variant-aware dimensions in SpecsAccordion's "ابعاد" row (per spec §11.7) — needs a small client wrapper that reads selectedVariant from Context |
```

- [ ] **Step 5: Commit**

```bash
git add docs/state.md
git commit -m "$(cat <<'EOF'
docs(state): PDP variant picker shipped; FU-PDV-* logged

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 17: Final gate — lint + typecheck + build + tests

- [ ] **Step 1: Run the full pipeline**

```bash
pnpm typecheck
pnpm --filter @zhic/web lint
pnpm --filter @zhic/web build
pnpm --filter @zhic/web test
pnpm --filter @zhic/api test
pnpm --filter @zhic/ui test
```

- [ ] **Step 2: Triage failures**

For each failure:
- **If pre-existing** (e.g., `@zhic/sms` typecheck — confirmed in sub-project D): document and exclude.
- **If introduced by this branch** (any `@zhic/web` / `@zhic/api` / `@zhic/ui` issue): fix and commit as `fix(pdp-variants): ...`.

- [ ] **Step 3: Report**

Report final SHA, total commit count, and any pre-existing issues left documented but unblocking.

---

## Self-Review Checklist

After all tasks, verify:

**Spec coverage:**
- §2 Schema → Tasks 1–5
- §3 Architecture (files added/modified) → Tasks 6–15 collectively
- §4 Page composition → Task 14
- §5 Component contracts → Tasks 8–11, 15
- §6 SEO → Task 14 (canonical unchanged; OG unchanged)
- §7 Animation → Tasks 10, 11
- §8 Mobile layout → Tasks 11, 14
- §9 Empty states → Tasks 11, 14
- §10 Tests → distributed (Tasks 1, 7, 8, 11)
- §11 Acceptance criteria → Tasks 16, 17

**Placeholder scan:** `grep -n "TBD\|TODO\|FIXME" docs/superpowers/plans/2026-05-22-pdp-variant-picker.md` should return 0.

**Type consistency:**
- `PayloadProductVariant` shape in Task 6 matches `ProductVariant` interface in Task 3.
- `SelectedAxes` type used in Tasks 7, 8, 11.
- `resolveVariant` / `deriveAxisOptions` / `sortVariants` signatures match across the helpers + their callers.
- `PickerBar.onInquiry` payload shape matches what `InquiryHandler.submit` consumes.

---

## Notes for the executing agent

- Each task is independent enough to be its own commit. Do NOT batch.
- If a step fails, STOP and report. Do not improvise.
- When restarting Next (`pm2 restart zhic-web`), always wait for the `200` from `curl http://localhost:3000/` before continuing.
- The mockup file (`apps/web/public/docs/pdp-variant-picker-mockup.html`) is the visual source-of-truth. If a component's rendered output diverges from the mockup AND you're confident the mockup represents operator intent, update the implementation to match the mockup. If unsure, STOP and ask.
- All Persian text used in this plan is from the mockup + spec — do not re-translate.
- The Payload 3 hasMany text persistence quirk (seed gymnastics from sub-project D Task 4) MAY appear again in Task 4 here. Mirror the workaround if needed; document inline if you do.
