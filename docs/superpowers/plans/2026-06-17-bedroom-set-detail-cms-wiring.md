# Bedroom-set Detail Page — CMS Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the `/bedroom-set/[age]/[design]` detail page's four currently-`null` non-iron sections (intro, story, materials, design-details) a CMS home on the `Designs` collection, and map them in the page's data getter so they render the moment an editor adds content.

**Architecture:** Add seven fields to the Payload `Designs` collection (two editorial cards as dedicated fields; materials and design-details as self-contained per-design arrays), under a UI-only `collapsible`. A hand-written additive migration creates the columns/tables (mirroring the existing `designs_occupancy_media` array table). The web `PayloadDesign` type gains the fields, and `getSeriesHubContent`'s non-iron branch maps them into the existing `SeriesHubContent` shape — no component or type-shape changes. `iron` stays a static seed, untouched.

**Tech Stack:** Payload 3 (Postgres adapter), Next.js 16 / React 19 (App Router), TypeScript 5, Vitest, pnpm + Turborepo.

---

## Background the engineer needs

- The page renders from `apps/web/src/lib/series-hub-content.ts → getSeriesHubContent(slug, ageFilter)`. `iron` short-circuits to a static `IRON` seed; every other slug is mapped from Payload. Today the non-iron branch hard-codes `intro/materials/details/story` to `null`.
- The section components already hide gracefully: `SeriesHubBody.tsx` mounts a section only when its content is non-null, and the materials/details children also return `null` on an empty `items` array. **So this plan changes only data, never component logic.**
- Migrations in this repo are **hand-written and additive** — `migrate:create` hangs (exit 13) on the untracked `designs_occupancies` snapshot drift. The template to copy is `services/api/src/migrations/20260606_120000_add_bedroom_set_fields.ts`.
- Tests live in `__tests__/` dirs as `*.test.ts`; the payload fetch layer is mocked. The `@` → `src` alias is configured in `apps/web/vitest.config.ts`.
- **No Postgres is assumed in the dev environment.** Static checks (tsc/eslint/build) + the unit test verify the code; the migration is *applied* on the box as a deliberate operator step (Task 7).

---

## File structure

| File | Responsibility | Action |
| --- | --- | --- |
| `services/api/src/collections/Designs.ts` | Payload field definitions | Modify — add collapsible + 7 fields |
| `services/api/src/migrations/20260617_120000_add_design_detail_fields.ts` | Additive DDL | Create |
| `services/api/src/migrations/index.ts` | Migration registry | Modify — import + register |
| `services/api/src/payload-types.ts` | Generated types | Regenerate (best-effort) |
| `apps/web/src/lib/payload.ts` | `PayloadDesign` type | Modify — add 7 fields |
| `apps/web/src/lib/series-hub-content.ts` | Detail-page data getter | Modify — map the four sections |
| `apps/web/src/lib/__tests__/series-hub-content.test.ts` | Mapping unit tests | Create |
| `docs/spec/data-schemas.md` | Schema documentation | Modify — add `designs` section |
| `docs/state.md` | Status board | Modify — session row (Task 7) |

---

## Task 1: Add the schema fields to the Designs collection

**Files:**
- Modify: `services/api/src/collections/Designs.ts` (insert in the `fields` array, after the `gallery` field object and before the `featured` field object — currently the last two entries)

- [ ] **Step 1: Insert the collapsible block**

In `services/api/src/collections/Designs.ts`, the `fields` array ends with `gallery` then `featured`. Insert this block **between** the `gallery` field object (`{ name: 'gallery', ... }`) and the `featured` field object (`{ name: 'featured', ... }`):

```ts
    {
      type: 'collapsible',
      label: 'محتوای صفحه‌ی جزئیات طرح',
      admin: { initCollapsed: true },
      fields: [
        { name: 'introTitle', type: 'text', label: 'عنوان کارت معرفی' },
        { name: 'introBody', type: 'textarea', label: 'متن کوتاه کارت معرفی' },
        {
          name: 'introMedia',
          type: 'upload',
          relationTo: 'media',
          label: 'تصویر کارت معرفی',
          admin: { description: 'بدون این تصویر، کارت معرفی نمایش داده نمی‌شود.' },
        },
        { name: 'storyBody', type: 'textarea', label: 'متن داستان طراحی' },
        {
          name: 'storyMedia',
          type: 'upload',
          relationTo: 'media',
          label: 'تصویر داستان طراحی',
          admin: { description: 'بدون این تصویر، کارت داستان نمایش داده نمی‌شود.' },
        },
        {
          name: 'materialCallouts',
          type: 'array',
          label: 'متریال‌های استفاده‌شده',
          labels: { singular: 'متریال', plural: 'متریال‌ها' },
          admin: {
            description: 'متریال‌های شاخص کارت «متریال‌های استفاده‌شده». ترتیب از راست به چپ. هر ردیف به یک تصویر دایره‌ای نیاز دارد.',
          },
          fields: [
            { name: 'image', type: 'upload', relationTo: 'media', required: true, label: 'تصویر دایره‌ای' },
            { name: 'label', type: 'text', required: true, label: 'نام (مثلاً فلز)' },
            { name: 'sub', type: 'text', label: 'زیرنویس (مثلاً رنگ پودری الکترواستاتیک پوشش مات)' },
          ],
        },
        {
          name: 'designDetails',
          type: 'array',
          label: 'جزئیات طراحی',
          labels: { singular: 'جزئیات', plural: 'جزئیات طراحی' },
          admin: {
            description: 'کاشی‌های تصویری نوار «جزئیات طراحی». ترتیب از راست به چپ. هر ردیف به یک تصویر نیاز دارد.',
          },
          fields: [
            { name: 'image', type: 'upload', relationTo: 'media', required: true, label: 'تصویر کاشی' },
            { name: 'label', type: 'text', required: true, label: 'عنوان' },
            { name: 'description', type: 'textarea', label: 'توضیح کوتاه' },
            {
              name: 'span',
              type: 'number',
              defaultValue: 100,
              label: 'وزن عرض کاشی',
              admin: { description: 'عرض نسبی کاشی در نوار. پیش‌فرض ۱۰۰ = عرض برابر.' },
            },
          ],
        },
      ],
    },
```

- [ ] **Step 2: Typecheck + lint the api package**

Run: `pnpm --filter @zhic/api typecheck && pnpm --filter @zhic/api lint`
Expected: exit 0, no errors.

- [ ] **Step 3: Commit**

```bash
git add services/api/src/collections/Designs.ts
git commit -m "feat(designs): add detail-page content fields (intro/story/materials/details)"
```

---

## Task 2: Hand-write and register the additive migration

**Files:**
- Create: `services/api/src/migrations/20260617_120000_add_design_detail_fields.ts`
- Modify: `services/api/src/migrations/index.ts`

- [ ] **Step 1: Create the migration file**

Create `services/api/src/migrations/20260617_120000_add_design_detail_fields.ts` with exactly:

```ts
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Bedroom-set detail page — CMS wiring (2026-06-17):
 *
 *   designs.intro_title / intro_body / intro_media_id  → intro editorial card.
 *   designs.story_body / story_media_id                → design-story card.
 *   designs_material_callouts table                    → 3 circular material
 *                                                        swatches { image, label, sub }.
 *   designs_design_details table                       → 4 design-detail tiles
 *                                                        { image, label, description, span }.
 *
 * Hand-written rather than `migrate:create`d (the auto-diff hangs on the
 * untracked designs_occupancies snapshot drift — see
 * 20260606_120000_add_bedroom_set_fields.ts). Additive only; mirrors the
 * designs_occupancy_media array-table conventions. Never touches designs_occupancies.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- 1) Designs intro/story scalar + media fields
    ALTER TABLE "designs" ADD COLUMN IF NOT EXISTS "intro_title" varchar;
    ALTER TABLE "designs" ADD COLUMN IF NOT EXISTS "intro_body" varchar;
    ALTER TABLE "designs" ADD COLUMN IF NOT EXISTS "intro_media_id" integer;
    ALTER TABLE "designs" ADD COLUMN IF NOT EXISTS "story_body" varchar;
    ALTER TABLE "designs" ADD COLUMN IF NOT EXISTS "story_media_id" integer;

    DO $$ BEGIN
      ALTER TABLE "designs"
        ADD CONSTRAINT "designs_intro_media_id_media_id_fk"
        FOREIGN KEY ("intro_media_id") REFERENCES "media"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "designs"
        ADD CONSTRAINT "designs_story_media_id_media_id_fk"
        FOREIGN KEY ("story_media_id") REFERENCES "media"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    -- 2) Designs.materialCallouts (array of { image(upload), label(text), sub(text) })
    CREATE TABLE IF NOT EXISTS "designs_material_callouts" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "image_id" integer,
      "label" varchar,
      "sub" varchar
    );

    DO $$ BEGIN
      ALTER TABLE "designs_material_callouts"
        ADD CONSTRAINT "designs_material_callouts_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "designs"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "designs_material_callouts"
        ADD CONSTRAINT "designs_material_callouts_image_id_media_id_fk"
        FOREIGN KEY ("image_id") REFERENCES "media"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "designs_material_callouts_order_idx"
      ON "designs_material_callouts" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "designs_material_callouts_parent_id_idx"
      ON "designs_material_callouts" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "designs_material_callouts_image_idx"
      ON "designs_material_callouts" USING btree ("image_id");

    -- 3) Designs.designDetails (array of { image(upload), label(text), description(textarea), span(number) })
    CREATE TABLE IF NOT EXISTS "designs_design_details" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "image_id" integer,
      "label" varchar,
      "description" varchar,
      "span" numeric
    );

    DO $$ BEGIN
      ALTER TABLE "designs_design_details"
        ADD CONSTRAINT "designs_design_details_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "designs"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "designs_design_details"
        ADD CONSTRAINT "designs_design_details_image_id_media_id_fk"
        FOREIGN KEY ("image_id") REFERENCES "media"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "designs_design_details_order_idx"
      ON "designs_design_details" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "designs_design_details_parent_id_idx"
      ON "designs_design_details" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "designs_design_details_image_idx"
      ON "designs_design_details" USING btree ("image_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "designs_material_callouts";
    DROP TABLE IF EXISTS "designs_design_details";
    ALTER TABLE "designs"
      DROP CONSTRAINT IF EXISTS "designs_intro_media_id_media_id_fk",
      DROP CONSTRAINT IF EXISTS "designs_story_media_id_media_id_fk",
      DROP COLUMN IF EXISTS "intro_title",
      DROP COLUMN IF EXISTS "intro_body",
      DROP COLUMN IF EXISTS "intro_media_id",
      DROP COLUMN IF EXISTS "story_body",
      DROP COLUMN IF EXISTS "story_media_id";
  `)
}
```

- [ ] **Step 2: Register the migration in `index.ts`**

In `services/api/src/migrations/index.ts`, add this import immediately after the `migration_20260615_120000_add_bedroom_set_intros` import line (currently line 19):

```ts
import * as migration_20260617_120000_add_design_detail_fields from './20260617_120000_add_design_detail_fields';
```

And add this object as the **last** entry of the `migrations` array (after the `20260615_120000_add_bedroom_set_intros` block, before the closing `];`):

```ts
  {
    up: migration_20260617_120000_add_design_detail_fields.up,
    down: migration_20260617_120000_add_design_detail_fields.down,
    name: '20260617_120000_add_design_detail_fields'
  },
```

- [ ] **Step 3: Typecheck the api package**

Run: `pnpm --filter @zhic/api typecheck`
Expected: exit 0, no errors. (Do **not** run `migrate` here — no DB assumed; it runs on the box in Task 7.)

- [ ] **Step 4: Commit**

```bash
git add services/api/src/migrations/20260617_120000_add_design_detail_fields.ts services/api/src/migrations/index.ts
git commit -m "feat(designs): additive migration for detail-page content fields"
```

---

## Task 3: Regenerate Payload types (best-effort)

**Files:**
- Regenerate: `services/api/src/payload-types.ts`

- [ ] **Step 1: Attempt regeneration**

Run: `pnpm --filter @zhic/api generate:types`
Expected: regenerates `payload-types.ts` with the new fields on the `Design` interface.

**If it fails** (known Node-24 Payload boot issue): skip — do NOT hand-fabricate the generated file. A stale `payload-types.ts` does **not** break `typecheck` (no code references the new generated fields; the web side uses its own `PayloadDesign`). Regenerate on the box after the migration in Task 7. Note the skip in the commit / Task 7 notes.

- [ ] **Step 2: If regeneration succeeded, typecheck + commit**

Run: `pnpm --filter @zhic/api typecheck`
Expected: exit 0.

```bash
git add services/api/src/payload-types.ts
git commit -m "chore(api): regenerate payload-types for detail-page fields"
```

(If skipped, no commit — proceed to Task 4.)

---

## Task 4: Extend the `PayloadDesign` type (web)

**Files:**
- Modify: `apps/web/src/lib/payload.ts` (the `PayloadDesign` type, currently lines 14–40)

- [ ] **Step 1: Add the fields**

In `apps/web/src/lib/payload.ts`, inside the `PayloadDesign` type, add these lines after the `occupancyMedia?: ...` field (currently line 39) and before the closing `};` of the type:

```ts
  /** Intro editorial card (detail page). Card renders only when introMedia is set. */
  introTitle?: string | null;
  introBody?: string | null;
  introMedia?: PayloadMedia | null;
  /** Design-story editorial card (detail page). Renders only when storyMedia + storyBody are set. */
  storyBody?: string | null;
  storyMedia?: PayloadMedia | null;
  /** 3 circular material swatches (detail page «متریال های استفاده شده»). */
  materialCallouts?: { image?: PayloadMedia | null; label?: string | null; sub?: string | null }[] | null;
  /** 4 design-detail tiles (detail page «جزئیات طراحی»). */
  designDetails?: { image?: PayloadMedia | null; label?: string | null; description?: string | null; span?: number | null }[] | null;
```

- [ ] **Step 2: Typecheck the web package**

Run: `pnpm --filter @zhic/web typecheck`
Expected: exit 0, no errors. (Adding optional fields with no consumer yet is safe.)

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/payload.ts
git commit -m "feat(web): add detail-page fields to PayloadDesign type"
```

---

## Task 5: Map the four sections in the getter (TDD)

**Files:**
- Create: `apps/web/src/lib/__tests__/series-hub-content.test.ts`
- Modify: `apps/web/src/lib/series-hub-content.ts` (non-iron branch, currently lines 187–225)
- Test: `apps/web/src/lib/__tests__/series-hub-content.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/lib/__tests__/series-hub-content.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock the Payload fetch layer BEFORE importing the module under test.
const mockFetchDesign = vi.fn();
const mockFetchProducts = vi.fn();
vi.mock('@/lib/payload', () => ({
  fetchDesign: (...a: unknown[]) => mockFetchDesign(...a),
  fetchProducts: (...a: unknown[]) => mockFetchProducts(...a),
  // simple stub: relative media → a /media/<filename> url, null when absent
  mediaUrl: (m: { url?: string | null; filename?: string | null } | null | undefined) =>
    m ? (m.url ?? `/media/${m.filename ?? 'x'}`) : null,
}));

import { getSeriesHubContent } from '../series-hub-content';

const baseDesign = {
  id: 7,
  name: 'کارولین',
  slug: 'caroline',
  occupancies: ['teen', 'double'],
};

beforeEach(() => {
  mockFetchDesign.mockReset();
  mockFetchProducts.mockReset();
  mockFetchProducts.mockResolvedValue({ docs: [] });
});

describe('getSeriesHubContent — non-iron Payload mapping', () => {
  it('maps materialCallouts (rows with an image) into the materials section', async () => {
    mockFetchDesign.mockResolvedValueOnce({
      ...baseDesign,
      materialCallouts: [
        { image: { filename: 'metal.jpg' }, label: 'فلز', sub: 'پوشش مات' },
        { image: { filename: 'mdf.jpg' }, label: 'MDF', sub: 'vispan' },
        { image: null, label: 'بی‌تصویر', sub: 'حذف می‌شود' }, // dropped (no image)
      ],
    });
    const content = await getSeriesHubContent('caroline', 'teen');
    expect(content?.materials).not.toBeNull();
    expect(content?.materials?.heading).toBe('متریال های استفاده شده');
    expect(content?.materials?.items).toHaveLength(2);
    expect(content?.materials?.items[0]).toMatchObject({ name: 'فلز', sub: 'پوشش مات', img: '/media/metal.jpg' });
  });

  it('maps designDetails and defaults span to 100 when absent', async () => {
    mockFetchDesign.mockResolvedValueOnce({
      ...baseDesign,
      designDetails: [
        { image: { filename: 'a.jpg' }, label: 'سر تخت', description: 'کشویی', span: 83 },
        { image: { filename: 'b.jpg' }, label: 'پگبورد' }, // no span, no description
      ],
    });
    const content = await getSeriesHubContent('caroline', 'teen');
    expect(content?.details?.items).toHaveLength(2);
    expect(content?.details?.items[0]).toMatchObject({ label: 'سر تخت', desc: 'کشویی', span: 83, img: '/media/a.jpg' });
    expect(content?.details?.items[1]).toMatchObject({ label: 'پگبورد', desc: '', span: 100 });
  });

  it('builds the intro card (title falls back to occupancy) and the story card', async () => {
    mockFetchDesign.mockResolvedValueOnce({
      ...baseDesign,
      introBody: 'معرفی کوتاه',
      introMedia: { filename: 'intro.jpg' },
      storyBody: 'داستان این طرح',
      storyMedia: { filename: 'story.jpg' },
    });
    const content = await getSeriesHubContent('caroline', 'teen');
    expect(content?.intro).toMatchObject({ title: 'سرویس خواب نوجوان', body: 'معرفی کوتاه', img: '/media/intro.jpg' });
    expect(content?.story).toMatchObject({ title: 'داستان طراحی', body: 'داستان این طرح', img: '/media/story.jpg' });
  });

  it('leaves all four sections null when the design has no detail content', async () => {
    mockFetchDesign.mockResolvedValueOnce({ ...baseDesign });
    const content = await getSeriesHubContent('caroline', 'teen');
    expect(content?.materials).toBeNull();
    expect(content?.details).toBeNull();
    expect(content?.intro).toBeNull();
    expect(content?.story).toBeNull();
  });

  it('omits the story card when storyMedia is set but storyBody is empty', async () => {
    mockFetchDesign.mockResolvedValueOnce({ ...baseDesign, storyMedia: { filename: 'story.jpg' } });
    const content = await getSeriesHubContent('caroline', 'teen');
    expect(content?.story).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @zhic/web test -- series-hub-content`
Expected: FAIL — the four sections are still hard-coded `null`, so the materials/details/intro/story assertions fail.

- [ ] **Step 3: Implement the mapping**

In `apps/web/src/lib/series-hub-content.ts`, in the non-iron branch, insert this block **after** the `siblings` constant (currently ends line 210) and **before** the `return {` (line 212):

```ts
  const materialItems: SeriesMaterial[] = (design.materialCallouts ?? [])
    .map((m, i): SeriesMaterial | null => {
      const img = mediaUrl(m.image);
      return img ? { key: `m-${i}`, name: m.label ?? '', sub: m.sub ?? '', img } : null;
    })
    .filter((x): x is SeriesMaterial => x !== null);
  const materials = materialItems.length
    ? { heading: 'متریال های استفاده شده', items: materialItems }
    : null;

  const detailItems: SeriesDetail[] = (design.designDetails ?? [])
    .map((d, i): SeriesDetail | null => {
      const img = mediaUrl(d.image);
      return img
        ? { key: `d-${i}`, label: d.label ?? '', desc: d.description ?? '', img, span: d.span ?? 100 }
        : null;
    })
    .filter((x): x is SeriesDetail => x !== null);
  const details = detailItems.length
    ? { heading: 'جزئیات طراحی', items: detailItems }
    : null;

  const introImg = mediaUrl(design.introMedia);
  const intro: SeriesEditorialCard = introImg
    ? { title: design.introTitle ?? ageTitle ?? design.name, body: design.introBody ?? '', href: '#', img: introImg }
    : null;

  const storyImg = mediaUrl(design.storyMedia);
  const story: SeriesEditorialCard =
    storyImg && design.storyBody
      ? { title: 'داستان طراحی', body: design.storyBody, href: '#', img: storyImg }
      : null;
```

Then in the `return { ... }` object, replace the four hard-coded `null` lines:

```ts
    intro: null,
```
→
```ts
    intro,
```
and
```ts
    materials: null,
    details: null,
    story: null,
```
→
```ts
    materials,
    details,
    story,
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @zhic/web test -- series-hub-content`
Expected: PASS — all 5 cases green.

- [ ] **Step 5: Typecheck the web package**

Run: `pnpm --filter @zhic/web typecheck`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/series-hub-content.ts apps/web/src/lib/__tests__/series-hub-content.test.ts
git commit -m "feat(web): map intro/story/materials/details from Payload on non-iron designs"
```

---

## Task 6: Document the `designs` collection in `data-schemas.md`

**Files:**
- Modify: `docs/spec/data-schemas.md`

- [ ] **Step 1: Add a `designs` collection section**

`designs` is currently undocumented in `docs/spec/data-schemas.md`. Open the file, find the `materials` collection block (§14, the catalog collections — it sits near `collections` and `categories`). Match the **same heading level** the neighbouring collection blocks use, and add a new `designs` section immediately after `materials`:

````markdown
### `designs` (§14)

Bedroom-set series. Drives `/bedroom-set/<slug>` hubs and `/bedroom-set/[age]/[design]` detail pages.

| Field | Type | Notes |
| --- | --- | --- |
| `name` (L) | text (req) | نام طرح |
| `slug` | text (unique) | auto-slugified from name |
| `age_group` | select | infant / child / teen / adult (pending OD-3) |
| `occupancies` | select[] | baby / teen / double / bunk — which hub pages list the design |
| `description` (L) | richText | — |
| `tagline` | text | lead sentence under the design name |
| `hubIntro` | textarea | caption under the hub carousel room-type tabs |
| `heroMedia` | upload → media | detail-page hero (falls back to gallery[0]) |
| `sliderMedia` | upload → media | `/designs` slider card (GIF/video) |
| `logoMedia` | upload → media | bilingual name-mark for the hub glass band |
| `occupancyMedia` | array `{ occupancy(select), image(upload) }` | per-room-type card variants |
| `storyBlocks` | richText (+ blocks) | long-form story with embedded media blocks |
| `gallery` | upload[] → media | — |
| `featured` | checkbox | show on home |
| **`introTitle`** | text | detail-page intro card title |
| **`introBody`** | textarea | detail-page intro card body |
| **`introMedia`** | upload → media | detail-page intro card photo (card hidden if empty) |
| **`storyBody`** | textarea | detail-page story card paragraph (title is the constant «داستان طراحی») |
| **`storyMedia`** | upload → media | detail-page story card photo (card hidden if empty) |
| **`materialCallouts`** | array `{ image(upload,req), label(text,req), sub(text) }` | 3 circular material swatches |
| **`designDetails`** | array `{ image(upload,req), label(text,req), description(textarea), span(number,def 100) }` | 4 design-detail tiles (span = relative width) |

The **bold** fields back the detail page's intro / story / materials / design-details sections (added 2026-06-17). `(L)` = localized.
````

- [ ] **Step 2: Commit**

```bash
git add docs/spec/data-schemas.md
git commit -m "docs(schemas): document the designs collection incl. detail-page fields"
```

---

## Task 7: Final verification + state board + operator handoff

**Files:**
- Modify: `docs/state.md`

- [ ] **Step 1: Full static verification**

Run each and confirm exit 0:
```bash
pnpm --filter @zhic/api typecheck && pnpm --filter @zhic/api lint
pnpm --filter @zhic/web typecheck && pnpm --filter @zhic/web lint
pnpm --filter @zhic/web test
pnpm --filter @zhic/web build
```
Expected: all green. **Known pre-existing failure to ignore:** `apps/web` `PickerBar.test.tsx` (4 cases, matchMedia setup) fails on `main` too — unrelated to this work. The new `series-hub-content` tests (5) must pass.

- [ ] **Step 2: Update the state board**

In `docs/state.md`, add a dated session row near the top snapshot rows (most-recent-first ordering), e.g.:

```markdown
| 2026-06-17 (cont. 2) | **`/bedroom-set/[age]/[design]` detail page — intro/story/materials/design-details wired to Payload.** New `Designs` fields under a collapsible «محتوای صفحه‌ی جزئیات طرح»: `introTitle`/`introBody`/`introMedia`, `storyBody`/`storyMedia`, `materialCallouts[]` ({image,label,sub}), `designDetails[]` ({image,label,description,span}). Hand-written additive migration `20260617_120000_add_design_detail_fields` (mirrors `designs_occupancy_media`; **run `pnpm -C services/api migrate` on the box**). `getSeriesHubContent` non-iron branch now maps all four sections (was hard `null`); iron stays a static seed. `PayloadDesign` extended; `data-schemas.md` gains a `designs` section; 5 new vitest cases. tsc/eslint/web build clean. Spec `docs/superpowers/specs/2026-06-17-bedroom-set-detail-cms-wiring-design.md`, plan `docs/superpowers/plans/2026-06-17-bedroom-set-detail-cms-wiring.md`. **`FU-SHD-a` (unhide-empty-sections audit) still open.** Media/copy for the ~25 non-iron designs is an operator upload task. |
```

Leave `FU-SHD-a` in the Follow-ups table as-is (still open).

- [ ] **Step 3: Commit**

```bash
git add docs/state.md
git commit -m "docs(state): log bedroom-set detail CMS wiring session"
```

- [ ] **Step 4: Operator handoff (manual — not run by the implementing agent)**

On the box, in order:
1. `pnpm -C services/api migrate` — applies the additive migration (reversible via `migrate:down`).
2. `pnpm --filter @zhic/api generate:types` if Task 3 was skipped, then restart the API (`pm2 restart zhic-api`).
3. Add sample content to one non-iron design via the admin (an `introMedia` + `introBody`, a `storyMedia` + `storyBody`, a couple of `materialCallouts`, a couple of `designDetails`), then verify the sections render on `/bedroom-set/teen/<that-design>` (and confirm `/bedroom-set/teen/iron` is unchanged).
4. `pm2 restart zhic-web` if needed for ISR/fresh data.

---

## Self-review

**Spec coverage:**
- Schema fields (spec §4) → Task 1. ✅
- Migration (spec §5) → Task 2. ✅
- `PayloadDesign` type (spec §6.1) → Task 4. ✅
- Getter mapping (spec §6.2) → Task 5. ✅
- `payload-types` regen (spec §8.2 / §10.3) → Task 3 (best-effort) + Task 7 operator step. ✅
- `data-schemas.md` (spec §7) → Task 6. ✅
- Verification (spec §8) → Task 5 (unit) + Task 7 (full). ✅
- Migration apply (spec §8.3) → Task 7 operator step. ✅
- iron untouched (spec §3) → no task edits the `IRON` seed or `SEEDS`. ✅
- `FU-SHD-a` audit (spec §9) → out of scope this plan (kept open in state board, Task 7). ✅

**Placeholder scan:** No TBD/TODO; every code step shows full code; every command has expected output. ✅

**Type consistency:** `materialCallouts` rows `{ image, label, sub }` and `designDetails` rows `{ image, label, description, span }` are identical across Task 1 (collection), Task 2 (DDL columns `label`/`sub` and `label`/`description`/`span`), Task 4 (`PayloadDesign`), and Task 5 (getter reads `m.label`/`m.sub`/`m.image`, `d.label`/`d.description`/`d.span`/`d.image`). The getter maps array field `description` → `SeriesDetail.desc` (the web type uses `desc`; the CMS field is `description` to avoid the SQL reserved word). `span ?? 100` default matches the collection `defaultValue: 100`. Section headings «متریال های استفاده شده» / «جزئیات طراحی» / «داستان طراحی» match the iron seed. ✅
