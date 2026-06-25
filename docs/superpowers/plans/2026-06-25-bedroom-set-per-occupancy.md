# Per-occupancy bedroom-set pages — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every `/bedroom-set/[occupancy]/[series]` page (e.g. `teen/iron` vs `double/iron`) its own CMS-editable page — curated products, content overrides that inherit from the design, and editable sibling cards with media — instead of identical clones.

**Architecture:** A new Payload collection `series-occupancies` holds one document per `(design × occupancy)`; the document *is* the page. The storefront resolver overlays the combo doc onto the design base (blank ⇒ inherit) and maps it into the existing `SeriesHubContent` shape, so the rendered template and all section components are unchanged except one conditional. Un-authored combos render the inherited design base (noindex); a combo auto-promotes to an indexable, sitemap-listed page once published with its own products or overrides. The bare `/bedroom-set/[series]` page is removed (301 → first occupancy).

**Tech Stack:** Payload 3 (Postgres adapter), Next.js 16 App Router (RSC), TypeScript 5, Vitest, pnpm workspaces. Design ref: [`docs/superpowers/specs/2026-06-25-bedroom-set-per-occupancy-design.md`](../specs/2026-06-25-bedroom-set-per-occupancy-design.md).

---

## File map

**Create**
- `services/api/src/collections/SeriesOccupancies.ts` — the collection config.
- `services/api/src/migrations/<ts>_create_series_occupancies.ts` — generated migration.
- `apps/web/src/lib/__tests__/series-occupancy.test.ts` — tests for the pure helpers.

**Modify**
- `services/api/src/payload.config.ts` — register the collection.
- `services/api/src/payload-types.ts` — regenerated (do not hand-edit).
- `apps/web/src/lib/payload.ts` — `PayloadSeriesOccupancy` type, fetchers, 3 pure helpers.
- `apps/web/src/lib/series-hub-content.ts` — replace `getSeriesHubContent` with `getSeriesOccupancyContent`.
- `apps/web/src/lib/__tests__/series-hub-content.test.ts` — retarget tests at the new getter.
- `apps/web/src/components/series-hub/SeriesHubBody.tsx` — hide «قطعات سرویس» when empty.
- `apps/web/src/app/(site)/bedroom-set/[slug]/series-hub.tsx` — new `SeriesHub` / `seriesOccupancyMetadata` signatures.
- `apps/web/src/app/(site)/bedroom-set/[slug]/[series]/page.tsx` — use new getter; canonical + index/noindex.
- `apps/web/src/app/(site)/bedroom-set/[slug]/page.tsx` — remove bare-series branch → redirect.
- `apps/web/src/app/sitemap.ts` — emit published-differentiated combo URLs, drop bare series.
- `docs/spec/data-schemas.md`, `docs/state.md` — document + status.

---

## Task 1: `SeriesOccupancies` collection

**Files:**
- Create: `services/api/src/collections/SeriesOccupancies.ts`
- Modify: `services/api/src/payload.config.ts`
- Modify: `services/api/src/payload-types.ts` (generated)

- [ ] **Step 1: Write the collection config**

Create `services/api/src/collections/SeriesOccupancies.ts`:

```ts
import type { CollectionConfig } from 'payload'
import { publishedContentAccess, isEditorField } from '../lib/access'
import { seoFields } from '../fields/seoFields'

const OCCUPANCY_OPTIONS = [
  { label: 'سرویس خواب نوزاد', value: 'baby' },
  { label: 'سرویس خواب نوجوان', value: 'teen' },
  { label: 'سرویس خواب دونفره', value: 'double' },
  { label: 'سرویس خواب دوطبقه', value: 'bunk' },
]

/**
 * One document per (design × occupancy). The document IS the page rendered at
 * /bedroom-set/{occupancy}/{design.slug}. Blank override fields inherit from the
 * parent Design; `products` is a fully-manual curated list (the «قطعات سرویس»
 * row). See docs/superpowers/specs/2026-06-25-bedroom-set-per-occupancy-design.md.
 */
export const SeriesOccupancies: CollectionConfig = {
  slug: 'series-occupancies',
  labels: { singular: 'سرویس خواب (طرح × گروه)', plural: 'سرویس‌های خواب (طرح × گروه)' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'design', 'occupancy', 'status'],
    group: 'کاتالوگ',
  },
  access: publishedContentAccess,
  hooks: {
    beforeValidate: [
      async ({ data, req, originalDoc }) => {
        if (!data) return data
        const design = data.design ?? originalDoc?.design
        const occupancy = data.occupancy ?? originalDoc?.occupancy
        // One page per (design, occupancy).
        if (design && occupancy && req?.payload) {
          const existing = await req.payload.find({
            collection: 'series-occupancies',
            where: { and: [{ design: { equals: design } }, { occupancy: { equals: occupancy } }] },
            limit: 1,
            depth: 0,
          })
          const clash = existing.docs.find((d) => d.id !== originalDoc?.id)
          if (clash) throw new Error('برای این طرح و این گروه سرویس، یک صفحه از قبل وجود دارد.')
        }
        return data
      },
    ],
    beforeChange: [
      async ({ data, req }) => {
        // Compute the admin list title «{design} — {occupancy}».
        if (data?.design && data?.occupancy && req?.payload) {
          const d = await req.payload
            .findByID({ collection: 'designs', id: data.design, depth: 0 })
            .catch(() => null)
          const occLabel = OCCUPANCY_OPTIONS.find((o) => o.value === data.occupancy)?.label ?? data.occupancy
          if (d?.name) data.title = `${d.name} — ${occLabel}`
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', label: 'عنوان', admin: { hidden: true } },
    { name: 'design', type: 'relationship', relationTo: 'designs', required: true, label: 'طرح' },
    { name: 'occupancy', type: 'select', required: true, label: 'گروه سرویس', options: OCCUPANCY_OPTIONS },
    {
      name: 'products',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      label: 'قطعات سرویس (محصولات)',
      admin: {
        description:
          'محصولات این صفحه را به ترتیب دلخواه انتخاب کنید. این فهرست کاملاً دستی است و خودکار با تگ گروه سنی پر نمی‌شود.',
      },
    },
    {
      name: 'heroMedia',
      type: 'upload',
      relationTo: 'media',
      label: 'تصویر اصلی صفحه (override)',
      admin: { description: 'اگر خالی بماند، از تصویر اصلی طرح ارث می‌برد.' },
    },
    { name: 'subtitle', type: 'text', label: 'زیرعنوان (override)', admin: { description: 'اگر خالی بماند، از شعار طرح ارث می‌برد.' } },
    {
      type: 'collapsible',
      label: 'محتوای اختصاصی این گروه (هر فیلد خالی از طرح ارث می‌برد)',
      admin: { initCollapsed: true },
      fields: [
        { name: 'introTitle', type: 'text', label: 'عنوان کارت معرفی' },
        { name: 'introBody', type: 'textarea', label: 'متن کارت معرفی' },
        { name: 'introMedia', type: 'upload', relationTo: 'media', label: 'تصویر کارت معرفی' },
        { name: 'storyBody', type: 'textarea', label: 'متن داستان طراحی' },
        { name: 'storyMedia', type: 'upload', relationTo: 'media', label: 'تصویر داستان طراحی' },
        {
          name: 'materialCallouts',
          type: 'array',
          label: 'متریال‌ها (override)',
          labels: { singular: 'متریال', plural: 'متریال‌ها' },
          admin: { description: 'اگر خالی بماند، متریال‌های طرح نشان داده می‌شود.' },
          fields: [
            { name: 'image', type: 'upload', relationTo: 'media', required: true, label: 'تصویر دایره‌ای' },
            { name: 'label', type: 'text', required: true, label: 'نام' },
            { name: 'sub', type: 'text', label: 'زیرنویس' },
          ],
        },
        {
          name: 'designDetails',
          type: 'array',
          label: 'جزئیات طراحی (override)',
          labels: { singular: 'کاشی جزئیات', plural: 'جزئیات طراحی' },
          admin: { description: 'اگر خالی بماند، جزئیات طراحی طرح نشان داده می‌شود.' },
          fields: [
            { name: 'image', type: 'upload', relationTo: 'media', required: true, label: 'تصویر کاشی' },
            { name: 'label', type: 'text', required: true, label: 'عنوان' },
            { name: 'description', type: 'textarea', label: 'توضیح کوتاه' },
            { name: 'span', type: 'number', defaultValue: 100, min: 1, label: 'وزن عرض کاشی' },
          ],
        },
      ],
    },
    {
      name: 'siblings',
      type: 'array',
      label: 'کارت‌های طرح‌های مرتبط',
      labels: { singular: 'کارت', plural: 'کارت‌ها' },
      admin: { description: 'کارت‌های پایین صفحه. اگر خالی بماند، خودکار از سایر گروه‌های همین طرح ساخته می‌شود.' },
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', label: 'تصویر' },
        { name: 'kicker', type: 'text', label: 'عنوان بالا (مثلاً سرویس خواب دونفره)' },
        { name: 'name', type: 'text', label: 'نام طرح' },
        { name: 'link', type: 'text', label: 'لینک' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      required: true,
      label: 'وضعیت',
      options: [
        { label: 'پیش‌نویس', value: 'draft' },
        { label: 'منتشرشده', value: 'published' },
      ],
      admin: { position: 'sidebar', description: 'فقط صفحات منتشرشده روی سایت دیده می‌شوند. فقط ویراستار می‌تواند منتشر کند.' },
      access: { update: isEditorField },
    },
    { name: 'publishedAt', type: 'date', label: 'تاریخ انتشار', admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly' } } },
    seoFields,
  ],
}
```

- [ ] **Step 2: Register the collection**

In `services/api/src/payload.config.ts`, add the import next to the other collection imports (near line 11–12):

```ts
import { SeriesOccupancies } from './collections/SeriesOccupancies'
```

And add it to the `collections: [ … ]` array immediately after `Products` (near line 79):

```ts
    Designs,
    Products,
    SeriesOccupancies,
```

- [ ] **Step 3: Regenerate Payload types**

Run: `pnpm -C services/api generate:types`
Expected: exits 0; `services/api/src/payload-types.ts` now contains a `SeriesOccupancy` interface and `series-occupancies` in the `Config['collections']` map.

- [ ] **Step 4: Typecheck the API package**

Run: `pnpm -C services/api typecheck`
Expected: exits 0, no errors.

- [ ] **Step 5: Commit**

```bash
git add services/api/src/collections/SeriesOccupancies.ts services/api/src/payload.config.ts services/api/src/payload-types.ts
git commit -m "feat(cms): add series-occupancies collection (design × occupancy pages)"
```

---

## Task 2: Database migration

**Files:**
- Create: `services/api/src/migrations/<timestamp>_create_series_occupancies.ts`
- Modify: `services/api/src/migrations/index.ts` (auto-updated by the tool)

> Requires the local Postgres to be running and reachable via the API package's
> env (`migrate:create` diffs the live schema). The repo's migrations use the
> Postgres adapter; `hasMany` select/array child tables use bare `parent_id`/`order`
> (no leading underscore) — see `20260530_220000_add_products_occupancies.ts`. The
> generator handles this for you; do not hand-write the SQL.

- [ ] **Step 1: Generate the migration**

Run: `pnpm -C services/api migrate:create create_series_occupancies`
Expected: a new file `services/api/src/migrations/<timestamp>_create_series_occupancies.ts` appears, and `migrations/index.ts` gains its import + array entry. The `up()` creates `series_occupancies` (+ child tables `series_occupancies_material_callouts`, `series_occupancies_design_details`, `series_occupancies_siblings`, the `series_occupancies_rels` relationship table for `products`) and registers `series_occupancies_id` on `payload_locked_documents_rels`.

- [ ] **Step 2: Sanity-check the generated SQL**

Open the new migration. Confirm it CREATEs `series_occupancies` and its child/rels tables, and ALTERs `payload_locked_documents_rels` (mirrors `20260522_150000_create_product_variants.ts`). If the `products` relationship table is missing, the relationship field wasn't picked up — re-run after confirming Step 1 of Task 1 saved.

- [ ] **Step 3: Apply the migration**

Run: `pnpm -C services/api migrate`
Expected: logs the new migration as applied, exits 0.

- [ ] **Step 4: Verify status**

Run: `pnpm -C services/api migrate:status`
Expected: `create_series_occupancies` row shows as applied (✓).

- [ ] **Step 5: Commit**

```bash
git add services/api/src/migrations/
git commit -m "feat(cms): migration for series-occupancies collection"
```

---

## Task 3: Web types, fetchers, and pure helpers

**Files:**
- Modify: `apps/web/src/lib/payload.ts`
- Create: `apps/web/src/lib/__tests__/series-occupancy.test.ts`

- [ ] **Step 1: Add the `PayloadSeriesOccupancy` type**

In `apps/web/src/lib/payload.ts`, after the `PayloadProduct` type (ends ~line 330), add:

```ts
export type PayloadSeriesOccupancy = {
  id: string | number;
  title?: string | null;
  /** Relationship → designs. Object at depth ≥ 1. */
  design?: { id: string | number; name: string; slug: string } | string | number | null;
  occupancy: 'baby' | 'teen' | 'double' | 'bunk';
  /** Curated, ordered «قطعات سرویس». Inflated to objects at depth ≥ 1. */
  products?: PayloadProduct[] | null;
  heroMedia?: PayloadMedia | null;
  subtitle?: string | null;
  introTitle?: string | null;
  introBody?: string | null;
  introMedia?: PayloadMedia | null;
  storyBody?: string | null;
  storyMedia?: PayloadMedia | null;
  materialCallouts?: { image?: PayloadMedia | null; label?: string | null; sub?: string | null }[] | null;
  designDetails?: { image?: PayloadMedia | null; label?: string | null; description?: string | null; span?: number | null }[] | null;
  siblings?: { image?: PayloadMedia | null; kicker?: string | null; name?: string | null; link?: string | null }[] | null;
  status?: 'draft' | 'published' | null;
  publishedAt?: string | null;
  seo?: PayloadSeo | null;
  updatedAt?: string;
};
```

- [ ] **Step 2: Add the pure helpers (write the failing test first)**

Create `apps/web/src/lib/__tests__/series-occupancy.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  isSeriesOccupancyDifferentiated,
  bareSeriesRedirectTarget,
  seriesOccupancySitemapEntries,
  type PayloadSeriesOccupancy,
} from '../payload';

const base = (over: Partial<PayloadSeriesOccupancy> = {}): PayloadSeriesOccupancy => ({
  id: 1,
  occupancy: 'teen',
  design: { id: 9, name: 'آیرون', slug: 'iron' },
  ...over,
});

describe('isSeriesOccupancyDifferentiated', () => {
  it('is true when at least one product is curated', () => {
    expect(isSeriesOccupancyDifferentiated(base({ products: [{ id: 1 } as never] }))).toBe(true);
  });
  it('is true when any content override is set', () => {
    expect(isSeriesOccupancyDifferentiated(base({ subtitle: 'یک خط' }))).toBe(true);
    expect(isSeriesOccupancyDifferentiated(base({ materialCallouts: [{ label: 'فلز' }] }))).toBe(true);
  });
  it('is false when nothing is curated or overridden', () => {
    expect(isSeriesOccupancyDifferentiated(base())).toBe(false);
    expect(isSeriesOccupancyDifferentiated(base({ products: [] }))).toBe(false);
  });
});

describe('bareSeriesRedirectTarget', () => {
  it('points at the first occupancy combo', () => {
    expect(bareSeriesRedirectTarget({ slug: 'iron', occupancies: ['double', 'teen'] })).toBe('/bedroom-set/double/iron');
  });
  it('falls back to the hub when the design has no occupancy', () => {
    expect(bareSeriesRedirectTarget({ slug: 'iron', occupancies: [] })).toBe('/bedroom-set');
    expect(bareSeriesRedirectTarget({ slug: 'iron' })).toBe('/bedroom-set');
  });
});

describe('seriesOccupancySitemapEntries', () => {
  it('emits only differentiated combos with a resolvable design slug', () => {
    const combos: PayloadSeriesOccupancy[] = [
      base({ id: 1, occupancy: 'teen', products: [{ id: 1 } as never] }),       // kept
      base({ id: 2, occupancy: 'double' }),                                      // dropped (not differentiated)
      base({ id: 3, occupancy: 'baby', subtitle: 'x', design: 7 as never }),     // dropped (design not inflated)
    ];
    const out = seriesOccupancySitemapEntries(combos, 'https://zhicwood.com');
    expect(out).toEqual([{ url: 'https://zhicwood.com/bedroom-set/teen/iron', priority: 0.75 }]);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm -C apps/web test src/lib/__tests__/series-occupancy.test.ts`
Expected: FAIL — `isSeriesOccupancyDifferentiated is not a function` (helpers not exported yet).

- [ ] **Step 4: Implement the helpers**

In `apps/web/src/lib/payload.ts`, near the path helpers at the bottom (after `inquiryHref`, ~line 1264), add:

```ts
/** A combo "earns" its own indexable page once it has a curated product or any
 *  content override. Drives canonical/robots on the page and sitemap inclusion. */
export function isSeriesOccupancyDifferentiated(combo: PayloadSeriesOccupancy): boolean {
  const productCount = (combo.products ?? []).length;
  const hasOverride = Boolean(
    combo.heroMedia ||
      combo.subtitle ||
      combo.introTitle ||
      combo.introBody ||
      combo.introMedia ||
      combo.storyBody ||
      combo.storyMedia ||
      combo.materialCallouts?.length ||
      combo.designDetails?.length ||
      combo.siblings?.length,
  );
  return productCount > 0 || hasOverride;
}

/** Where the removed bare /bedroom-set/[series] URL sends visitors: the design's
 *  first occupancy combo, or the hub if it belongs to no occupancy. */
export function bareSeriesRedirectTarget(
  design: { slug: string; occupancies?: ('baby' | 'teen' | 'double' | 'bunk')[] | null },
): string {
  const first = design.occupancies?.[0];
  return first ? `/bedroom-set/${first}/${design.slug}` : '/bedroom-set';
}

/** Sitemap entries for published+differentiated combos. `design` must be inflated
 *  (depth ≥ 1) so we can read its slug; non-inflated rows are skipped. */
export function seriesOccupancySitemapEntries(
  combos: PayloadSeriesOccupancy[],
  siteUrl: string,
): { url: string; priority: number }[] {
  const out: { url: string; priority: number }[] = [];
  for (const c of combos) {
    if (!isSeriesOccupancyDifferentiated(c)) continue;
    const slug = typeof c.design === 'object' && c.design ? c.design.slug : undefined;
    if (!slug || !c.occupancy) continue;
    out.push({ url: `${siteUrl}/bedroom-set/${c.occupancy}/${slug}`, priority: 0.75 });
  }
  return out;
}
```

- [ ] **Step 5: Add the fetchers**

In `apps/web/src/lib/payload.ts`, after `fetchDesignsByOccupancy` (~line 1051), add:

```ts
/** The published (design × occupancy) page doc. depth=2 inflates the curated
 *  products (+ their gallery), hero/intro/story media, and the callout/detail/
 *  sibling images. Returns null when no published doc exists for the pair. */
export async function fetchSeriesOccupancy(
  occupancy: string,
  series: string,
): Promise<PayloadSeriesOccupancy | null> {
  const params = new URLSearchParams({
    'where[occupancy][equals]': occupancy,
    'where[design.slug][equals]': series,
    'where[status][equals]': 'published',
    depth: '2',
    limit: '1',
  });
  const res = await payloadFetch<PayloadList<PayloadSeriesOccupancy>>(
    `/api/series-occupancies?${params.toString()}`,
    'series-occupancies',
  );
  return res?.docs[0] ?? null;
}

/** All published combos, for the sitemap. depth=1 inflates design (→ slug) and
 *  products (→ count) without pulling every nested media object. */
export async function fetchPublishedSeriesOccupancies(): Promise<PayloadSeriesOccupancy[]> {
  const params = new URLSearchParams({
    'where[status][equals]': 'published',
    depth: '1',
    limit: '500',
  });
  const res = await payloadFetch<PayloadList<PayloadSeriesOccupancy>>(
    `/api/series-occupancies?${params.toString()}`,
    'series-occupancies',
  );
  return res?.docs ?? [];
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm -C apps/web test src/lib/__tests__/series-occupancy.test.ts`
Expected: PASS (all three describe blocks green).

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/lib/payload.ts apps/web/src/lib/__tests__/series-occupancy.test.ts
git commit -m "feat(web): series-occupancy type, fetchers, and SEO/redirect helpers"
```

---

## Task 4: `getSeriesOccupancyContent` resolver

**Files:**
- Modify: `apps/web/src/lib/series-hub-content.ts`
- Modify: `apps/web/src/lib/__tests__/series-hub-content.test.ts`

- [ ] **Step 1: Rewrite the test to target the new getter**

Replace the entire contents of `apps/web/src/lib/__tests__/series-hub-content.test.ts` with:

```ts
import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockFetchDesign = vi.fn();
const mockFetchSeriesOccupancy = vi.fn();
vi.mock('@/lib/payload', () => ({
  fetchDesign: (...a: unknown[]) => mockFetchDesign(...a),
  fetchSeriesOccupancy: (...a: unknown[]) => mockFetchSeriesOccupancy(...a),
  mediaUrl: (m: { url?: string | null; filename?: string | null } | null | undefined) =>
    m ? (m.url ?? `/media/${m.filename ?? 'x'}`) : null,
}));

import { getSeriesOccupancyContent } from '../series-hub-content';

const baseDesign = {
  id: 7,
  name: 'کارولین',
  slug: 'caroline',
  occupancies: ['teen', 'double'],
  materialCallouts: [{ image: { filename: 'wood.jpg' }, label: 'چوب', sub: 'بلوط' }],
};

beforeEach(() => {
  mockFetchDesign.mockReset();
  mockFetchSeriesOccupancy.mockReset();
  mockFetchDesign.mockResolvedValue({ ...baseDesign });
  mockFetchSeriesOccupancy.mockResolvedValue(null);
});

describe('getSeriesOccupancyContent — inheritance + curation', () => {
  it('returns null when the design does not exist', async () => {
    mockFetchDesign.mockResolvedValueOnce(null);
    expect(await getSeriesOccupancyContent('teen', 'missing')).toBeNull();
  });

  it('un-authored combo: inherits design materials, empty products, not differentiated', async () => {
    const res = await getSeriesOccupancyContent('teen', 'caroline');
    expect(res).not.toBeNull();
    expect(res!.differentiated).toBe(false);
    expect(res!.content.collection.items).toHaveLength(0);
    // materials inherit from the design
    expect(res!.content.materials?.items[0]).toMatchObject({ name: 'چوب', img: '/media/wood.jpg' });
    // siblings auto-generate from the OTHER occupancy (double)
    expect(res!.content.featuredSibling).toMatchObject({ href: '/bedroom-set/double/caroline' });
  });

  it('authored combo: curated products map into the collection and mark it differentiated', async () => {
    mockFetchSeriesOccupancy.mockResolvedValueOnce({
      id: 1,
      occupancy: 'teen',
      products: [
        { id: 11, name: 'تخت ۱۰۰', slug: 'bed-100', gallery: [{ filename: 'b.jpg' }], basePriceRials: 120000000 },
      ],
    });
    const res = await getSeriesOccupancyContent('teen', 'caroline');
    expect(res!.differentiated).toBe(true);
    expect(res!.content.collection.items).toHaveLength(1);
    expect(res!.content.collection.items[0]).toMatchObject({ name: 'تخت ۱۰۰', href: '/products/bed-100', img: '/media/b.jpg' });
  });

  it('combo override wins over the design (subtitle + materials)', async () => {
    mockFetchSeriesOccupancy.mockResolvedValueOnce({
      id: 1,
      occupancy: 'teen',
      subtitle: 'نسخه‌ی نوجوان',
      materialCallouts: [{ image: { filename: 'metal.jpg' }, label: 'فلز', sub: 'مات' }],
    });
    const res = await getSeriesOccupancyContent('teen', 'caroline');
    expect(res!.content.title.subtitle).toBe('نسخه‌ی نوجوان');
    expect(res!.content.materials?.items[0]).toMatchObject({ name: 'فلز', img: '/media/metal.jpg' });
  });

  it('authored siblings (with media + link) replace the auto-generated ones', async () => {
    mockFetchSeriesOccupancy.mockResolvedValueOnce({
      id: 1,
      occupancy: 'teen',
      siblings: [{ image: { filename: 's.jpg' }, kicker: 'سرویس دونفره', name: 'آیرون', link: '/bedroom-set/double/iron' }],
    });
    const res = await getSeriesOccupancyContent('teen', 'caroline');
    expect(res!.content.featuredSibling).toMatchObject({ kicker: 'سرویس دونفره', img: '/media/s.jpg', href: '/bedroom-set/double/iron' });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm -C apps/web test src/lib/__tests__/series-hub-content.test.ts`
Expected: FAIL — `getSeriesOccupancyContent` is not exported.

- [ ] **Step 3: Rewrite the getter**

In `apps/web/src/lib/series-hub-content.ts`: change the import line and replace `getSeriesHubContent` with `getSeriesOccupancyContent`. New import (replace the existing `@/lib/payload` import):

```ts
import {
  fetchDesign,
  fetchSeriesOccupancy,
  mediaUrl,
  type PayloadProduct,
  type PayloadSeriesOccupancy,
} from '@/lib/payload';
```

Then replace the whole `getSeriesHubContent` function (from its doc-comment through its closing brace) with:

```ts
export type OccupancyContentResult = { content: SeriesHubContent; differentiated: boolean };

type CalloutRow = NonNullable<PayloadSeriesOccupancy['materialCallouts']>[number];
type DetailRow = NonNullable<PayloadSeriesOccupancy['designDetails']>[number];

function mapMaterials(rows: CalloutRow[]): SeriesMaterial[] {
  return rows
    .map((m, i): SeriesMaterial | null => {
      const img = mediaUrl(m.image);
      return img ? { key: `m-${i}`, name: m.label ?? '', sub: m.sub ?? '', img } : null;
    })
    .filter((x): x is SeriesMaterial => x !== null);
}

function mapDetails(rows: DetailRow[]): SeriesDetail[] {
  return rows
    .map((d, i): SeriesDetail | null => {
      const img = mediaUrl(d.image);
      return img ? { key: `d-${i}`, label: d.label ?? '', desc: d.description ?? '', img, span: d.span ?? 100 } : null;
    })
    .filter((x): x is SeriesDetail => x !== null);
}

/**
 * Resolves the /bedroom-set/{occupancy}/{series} page. Overlays the published
 * combo doc onto the design base (blank ⇒ inherit). Products are the combo's
 * curated list only (empty for un-authored combos). Returns `differentiated`
 * (drives canonical/index) alongside the rendered content. Null when the design
 * doesn't exist (→ notFound()). Spec: docs/superpowers/specs/2026-06-25-…-design.md.
 */
export async function getSeriesOccupancyContent(
  occupancy: string,
  series: string,
): Promise<OccupancyContentResult | null> {
  const [design, combo] = await Promise.all([fetchDesign(series), fetchSeriesOccupancy(occupancy, series)]);
  if (!design) return null;

  const ageTitle = OCCUPANCY_TITLE[occupancy];

  // Products: curated from the published combo only (manual curation; no auto-tag).
  const items: SeriesProductCard[] = (combo?.products ?? []).map((p) => {
    const { price, originalPrice } = priceString(p);
    return {
      key: String(p.id),
      name: p.name,
      img: mediaUrl(p.gallery?.[0]) ?? null,
      price,
      originalPrice,
      href: `/products/${p.slug}`,
    };
  });

  // Hero: combo override → design chain.
  const heroMedia = combo?.heroMedia ?? design.heroMedia ?? design.sliderMedia ?? design.gallery?.[0] ?? null;

  // Materials / details: combo override if non-empty, else the design's.
  const materialItems = mapMaterials(
    combo?.materialCallouts?.length ? combo.materialCallouts : (design.materialCallouts ?? []),
  );
  const materials = materialItems.length ? { heading: 'متریال های استفاده شده', items: materialItems } : null;

  const detailItems = mapDetails(combo?.designDetails?.length ? combo.designDetails : (design.designDetails ?? []));
  const details = detailItems.length ? { heading: 'جزئیات طراحی', items: detailItems } : null;

  // Intro: combo override else design.
  const introMedia = combo?.introMedia ?? design.introMedia;
  const introImg = mediaUrl(introMedia);
  const intro: SeriesEditorialCard = introImg
    ? {
        title: combo?.introTitle ?? design.introTitle ?? ageTitle ?? design.name,
        body: combo?.introBody ?? design.introBody ?? '',
        href: '#',
        img: introImg,
      }
    : null;

  // Story: combo override else design.
  const storyBody = combo?.storyBody ?? design.storyBody;
  const storyMedia = combo?.storyMedia ?? design.storyMedia;
  const storyImg = mediaUrl(storyMedia);
  const story: SeriesEditorialCard =
    storyImg && storyBody ? { title: 'داستان طراحی', body: storyBody, href: '#', img: storyImg } : null;

  // Siblings: authored cards (with media) win; else auto-generate from the design's
  // other occupancies (today's behavior).
  const siblings: SeriesSibling[] = combo?.siblings?.length
    ? combo.siblings.map((s, i) => ({
        key: `s-${i}`,
        kicker: s.kicker ?? '',
        name: s.name ?? design.name,
        img: mediaUrl(s.image) ?? null,
        href: s.link ?? '#',
      }))
    : (design.occupancies ?? [])
        .filter((o) => o !== occupancy)
        .map((o) => ({
          key: o,
          kicker: OCCUPANCY_TITLE[o] ?? 'سرویس خواب',
          name: design.name,
          img: null,
          href: `/bedroom-set/${o}/${design.slug}`,
        }));

  const subtitle = combo?.subtitle ?? design.tagline ?? (ageTitle ? `${ageTitle} ${design.name}` : null);

  const content: SeriesHubContent = {
    hero: { img: mediaUrl(heroMedia), alt: design.name },
    title: { name: design.name, subtitle },
    intro,
    collection: { heading: 'قطعات سرویس', items },
    materials,
    details,
    story,
    featuredSibling: siblings[0] ?? null,
    siblings: siblings.slice(1),
  };

  const differentiated = Boolean(combo) && (items.length > 0 || hasComboOverride(combo!));
  return { content, differentiated };
}

function hasComboOverride(combo: PayloadSeriesOccupancy): boolean {
  return Boolean(
    combo.heroMedia ||
      combo.subtitle ||
      combo.introTitle ||
      combo.introBody ||
      combo.introMedia ||
      combo.storyBody ||
      combo.storyMedia ||
      combo.materialCallouts?.length ||
      combo.designDetails?.length ||
      combo.siblings?.length,
  );
}
```

> Note: `fetchProducts` is no longer used by this file — remove it from the import if it's now unused (the typecheck/lint step will flag it).

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm -C apps/web test src/lib/__tests__/series-hub-content.test.ts`
Expected: PASS (all 5 cases).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/series-hub-content.ts apps/web/src/lib/__tests__/series-hub-content.test.ts
git commit -m "feat(web): resolve series-occupancy content with inherit-by-default overrides"
```

---

## Task 5: Hide «قطعات سرویس» when empty

**Files:**
- Modify: `apps/web/src/components/series-hub/SeriesHubBody.tsx`

- [ ] **Step 1: Guard the collection section**

In `apps/web/src/components/series-hub/SeriesHubBody.tsx`, replace the unconditional collection line:

```tsx
      <SeriesCollection heading={collection.heading} items={collection.items} />
```

with:

```tsx
      {collection.items.length > 0 ? (
        <SeriesCollection heading={collection.heading} items={collection.items} />
      ) : null}
```

(Behavior is covered by Task 4's "empty products" case, which asserts `collection.items` is `[]` for un-authored combos; this guard keeps the bare heading from rendering.)

- [ ] **Step 2: Typecheck**

Run: `pnpm -C apps/web typecheck`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/series-hub/SeriesHubBody.tsx
git commit -m "feat(web): hide «قطعات سرویس» section when a combo has no curated products"
```

---

## Task 6: Combo route — render + canonical/index

**Files:**
- Modify: `apps/web/src/app/(site)/bedroom-set/[slug]/series-hub.tsx`
- Modify: `apps/web/src/app/(site)/bedroom-set/[slug]/[series]/page.tsx`

- [ ] **Step 1: Update `SeriesHub` + metadata to the occupancy/series signature**

Replace the contents of `apps/web/src/app/(site)/bedroom-set/[slug]/series-hub.tsx` with:

```tsx
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@zhic/ui';
import { getSeriesOccupancyContent } from '@/lib/series-hub-content';
import { SeriesHubBody } from '@/components/series-hub/SeriesHubBody';
import type { OccupancySlug } from './occupancy';

/** Metadata for /bedroom-set/{occupancy}/{series}. The page is SELF-canonical and
 *  indexable once the combo is differentiated (published with its own products or
 *  overrides); otherwise it's noindex,follow. Title/description/OG come from the
 *  same resolver the page renders, so they never disagree. */
export async function seriesOccupancyMetadata(occupancy: OccupancySlug, series: string): Promise<Metadata> {
  const result = await getSeriesOccupancyContent(occupancy, series);
  if (!result) return { title: 'یافت نشد' };
  const { content, differentiated } = result;
  const canonical = `/bedroom-set/${occupancy}/${series}`;
  return {
    title: content.title.name,
    description: content.title.subtitle ?? `طرح ${content.title.name} — مبلمان دست‌ساز ژیک`,
    alternates: { canonical },
    robots: differentiated ? undefined : { index: false, follow: true },
    openGraph: {
      title: content.title.name,
      description: content.title.subtitle ?? undefined,
      images: content.hero.img ? [{ url: content.hero.img }] : undefined,
    },
  };
}

/**
 * Design-detail page for one (occupancy × series), rebuilt from the Kaveh @430
 * comp (Figma 261:90). Content is resolved from the published series-occupancies
 * doc overlaid on the design base; un-authored combos render the inherited base.
 */
export async function SeriesHub({ occupancy, series }: { occupancy: OccupancySlug; series: string }) {
  const result = await getSeriesOccupancyContent(occupancy, series);
  if (!result) notFound();
  const { content } = result;

  return (
    <div className="mx-auto w-full max-w-[430px]" style={{ containerType: 'inline-size' }}>
      <div className="px-[12px] pb-2 pt-[calc(var(--header-height)+var(--space-5))]">
        <Breadcrumbs
          items={[
            { label: 'خانه', href: '/' },
            { label: 'سرویس خواب', href: '/bedroom-set' },
            { label: content.title.name },
          ]}
        />
      </div>
      <SeriesHubBody content={content} />
    </div>
  );
}
```

- [ ] **Step 2: Update the `[series]` route to the new API**

Replace the contents of `apps/web/src/app/(site)/bedroom-set/[slug]/[series]/page.tsx` with:

```tsx
import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import { isOccupancySlug, type OccupancySlug } from '../occupancy';
import { SeriesHub, seriesOccupancyMetadata } from '../series-hub';

/** /bedroom-set/[occupancy]/[series] — the canonical detail page. Age-FIRST per
 *  the IA spec (e.g. /bedroom-set/teen/iron). */
type PageProps = { params: Promise<{ slug: string; series: string }> };

function parse(rawSlug: string, rawSeries: string) {
  const occupancy = decodeURIComponent(rawSlug);
  const series = decodeURIComponent(rawSeries);
  if (isOccupancySlug(occupancy) && !isOccupancySlug(series)) {
    return { occupancy: occupancy as OccupancySlug, series } as const;
  }
  return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, series } = await params;
  const parsed = parse(slug, series);
  if (!parsed) return { title: 'یافت نشد' };
  return seriesOccupancyMetadata(parsed.occupancy, parsed.series);
}

export default async function BedroomSetOccupancySeriesPage({ params }: PageProps) {
  const { slug, series } = await params;
  const parsed = parse(slug, series);

  if (!parsed) {
    // Legacy series-first shape (/bedroom-set/iron/teen) → flip to age-first.
    const a = decodeURIComponent(slug);
    const b = decodeURIComponent(series);
    if (!isOccupancySlug(a) && isOccupancySlug(b)) {
      permanentRedirect(`/bedroom-set/${b}/${encodeURIComponent(a)}`);
    }
    notFound();
  }

  return <SeriesHub occupancy={parsed.occupancy} series={parsed.series} />;
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm -C apps/web typecheck`
Expected: exits 0. (If it flags `seriesHubMetadata` still imported in `[slug]/page.tsx`, that's fixed in Task 7.)

- [ ] **Step 4: Commit**

```bash
git add "apps/web/src/app/(site)/bedroom-set/[slug]/series-hub.tsx" "apps/web/src/app/(site)/bedroom-set/[slug]/[series]/page.tsx"
git commit -m "feat(web): render occupancy×series combo page with self-canonical + auto-index"
```

---

## Task 7: Remove the bare `/bedroom-set/[series]` page

**Files:**
- Modify: `apps/web/src/app/(site)/bedroom-set/[slug]/page.tsx`

- [ ] **Step 1: Replace the series-hub branch with a redirect**

In `apps/web/src/app/(site)/bedroom-set/[slug]/page.tsx`:

1. Update the imports — remove `SeriesHub, seriesHubMetadata`; add `fetchDesign` + `bareSeriesRedirectTarget`:

```ts
import { permanentRedirect, notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@zhic/ui';
import { OCCUPANCY_PERSIAN, isOccupancySlug } from './occupancy';
import { buildMosaicRows } from '@/lib/bedroom-furniture-mosaic';
import { getOccupancyHubContent } from '@/lib/occupancy-hub-content';
import { fetchDesign, bareSeriesRedirectTarget } from '@/lib/payload';
import { BedroomHero } from '@/components/bedroom-furniture/BedroomHero';
import { CategoryMosaic } from '@/components/bedroom-furniture-mosaic/CategoryMosaic';
import { MosaicStrip } from '@/components/bedroom-furniture-mosaic/MosaicStrip';
```

2. In `generateMetadata`, keep the occupancy-hub branch; replace the trailing `return seriesHubMetadata(slug);` with a minimal placeholder (the page redirects anyway):

```ts
  // Bare series URL is removed (page redirects); metadata is moot.
  return { title: 'سرویس خواب', robots: { index: false, follow: true } };
```

3. In the default export, replace the final `return <SeriesHub slug={slug} />;` block (everything after the occupancy-hub branch) with:

```ts
  // ═══════════════════════════════════════════════════════════════════════════
  // SERIES SLUG — bare /bedroom-set/[series] page removed. Redirect age-first if
  // a legacy ?age= is present, else to the design's first occupancy combo.
  // ═══════════════════════════════════════════════════════════════════════════
  if (ageRaw && isOccupancySlug(ageRaw)) {
    permanentRedirect(`/bedroom-set/${ageRaw}/${encodeURIComponent(slug)}`);
  }
  const design = await fetchDesign(slug);
  if (!design) notFound();
  permanentRedirect(bareSeriesRedirectTarget(design));
```

- [ ] **Step 2: Typecheck**

Run: `pnpm -C apps/web typecheck`
Expected: exits 0 (no more `SeriesHub`/`seriesHubMetadata` references anywhere).

- [ ] **Step 3: Lint (catch unused imports)**

Run: `pnpm -C apps/web lint`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add "apps/web/src/app/(site)/bedroom-set/[slug]/page.tsx"
git commit -m "feat(web): remove bare /bedroom-set/[series] page, redirect to first occupancy"
```

---

## Task 8: Sitemap — emit combo URLs, drop bare series

**Files:**
- Modify: `apps/web/src/app/sitemap.ts`

- [ ] **Step 1: Fetch published combos and swap the bare-series loop**

In `apps/web/src/app/sitemap.ts`:

1. Replace the import on line 4:

```ts
import { fetchAllCategories } from '@/lib/payload';
```

with:

```ts
import { fetchAllCategories, fetchPublishedSeriesOccupancies, seriesOccupancySitemapEntries } from '@/lib/payload';
```

2. Replace the `Promise.all` destructure (lines ~24–34) — `designs` is only used by the bare-series loop, so rename that slot in place:

```ts
  const [products, collections, designs, showrooms, articles, journalCategories, tags, allCategories] =
    await Promise.all([
      fetchSlugs('products'),
      fetchSlugs('collections'),
      fetchSlugs('designs'),
      fetchSlugs('showrooms'),
      fetchSlugs('articles', '&where[status][equals]=published'),
      fetchSlugs('journal-categories'),
      fetchSlugs('tags'),
      fetchAllCategories(),
    ]);
```

with:

```ts
  const [products, collections, seriesOccupancies, showrooms, articles, journalCategories, tags, allCategories] =
    await Promise.all([
      fetchSlugs('products'),
      fetchSlugs('collections'),
      fetchPublishedSeriesOccupancies(),
      fetchSlugs('showrooms'),
      fetchSlugs('articles', '&where[status][equals]=published'),
      fetchSlugs('journal-categories'),
      fetchSlugs('tags'),
      fetchAllCategories(),
    ]);
```

3. Replace the bare-series loop (lines ~74–81):

```ts
  for (const d of designs) {
    entries.push({
      url: `${SITE_URL}/bedroom-set/${d.slug}`,
      lastModified: d.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  }
```

with:

```ts
  for (const e of seriesOccupancySitemapEntries(seriesOccupancies, SITE_URL)) {
    entries.push({ url: e.url, changeFrequency: 'monthly', priority: e.priority });
  }
```

- [ ] **Step 2: Typecheck + lint**

Run: `pnpm -C apps/web typecheck && pnpm -C apps/web lint`
Expected: both exit 0.

- [ ] **Step 3: Run the full web test suite**

Run: `pnpm -C apps/web test`
Expected: PASS — including `robots.test.ts` and the two new/updated test files.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/sitemap.ts
git commit -m "feat(seo): sitemap emits published occupancy×series pages, not bare series"
```

---

## Task 9: Docs

**Files:**
- Modify: `docs/spec/data-schemas.md`
- Modify: `docs/state.md`

- [ ] **Step 1: Document the collection**

In `docs/spec/data-schemas.md`, after the Designs section (the `/bedroom-set/[age]/[design]` block around line 484–498), add a `### SeriesOccupancies` subsection: slug `series-occupancies`; one doc per `(design, occupancy)`; fields `design`, `occupancy`, `products` (manual «قطعات سرویس»), the override fields (`heroMedia/subtitle/introTitle/introBody/introMedia/storyBody/storyMedia/materialCallouts/designDetails` — blank ⇒ inherit from the design), `siblings` (editable cards `{image,kicker,name,link}`, blank ⇒ auto from other occupancies), `status`, `seo`. Note: the doc IS the page; differentiated (published + curated products or any override) ⇒ self-canonical + indexable + in sitemap, else noindex; the bare `/bedroom-set/[series]` page is removed.

- [ ] **Step 2: Update the status board**

In `docs/state.md`, add a shipped-session entry summarizing this work (new `series-occupancies` collection + migration; per-occupancy resolver with inherit-by-default; bare series removed; sitemap/canonical changes) and note the follow-up: **operator must author + publish combo docs (curate products) for the series they want indexed** — until then those combos render inherited base content and are noindex.

- [ ] **Step 3: Commit**

```bash
git add docs/spec/data-schemas.md docs/state.md
git commit -m "docs: document series-occupancies collection + update status board"
```

---

## Final verification

- [ ] `pnpm -C services/api typecheck && pnpm -C services/api test` → green.
- [ ] `pnpm -C apps/web typecheck && pnpm -C apps/web lint && pnpm -C apps/web test` → green.
- [ ] `pnpm -C apps/web build` → succeeds (sitemap + routes compile).
- [ ] Manual (dev API + web, or /lab): in the admin, create a `series-occupancies` doc for `(iron, teen)`, curate 2 products, publish. Visit `/bedroom-set/teen/iron` (curated products, `index`) vs `/bedroom-set/double/iron` (inherited base, empty «قطعات سرویس» hidden, `noindex`). Confirm `/bedroom-set/iron` 301s to `/bedroom-set/<first-occupancy>/iron`. Confirm `<link rel="canonical">` is self on the authored page.

## Spec-coverage check

- Dedicated per-combo CMS panel → Task 1 (collection).
- Manual product curation → Task 1 (`products` relationship) + Task 4 (curated mapping).
- Inherit-by-default overrides incl. shared materials → Task 4 (resolver).
- Editable sibling cards + media + links → Task 1 (`siblings`) + Task 4 (mapping) — renders via existing `SeriesSiblings` (already supports `img`).
- Auto-promote-when-differentiated SEO → Task 3 (`isSeriesOccupancyDifferentiated`) + Task 6 (canonical/robots) + Task 8 (sitemap).
- Graceful fallback for un-authored combos → Task 4 (inherited content, empty products) + Task 5 (hide empty collection).
- Bare series page removed → Task 7 (redirect) + Task 8 (sitemap).
- Template unchanged → Tasks 5–6 reuse `SeriesHubBody` + section components; only the empty-collection guard differs.
