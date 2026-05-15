# Products Dropdown Mega-Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat «محصولات» nav entry in `SiteHeader` with a 3-tab mega-menu (categories / designs / collections) plus search input and pinned featured product, wired to live Payload data, accessible by keyboard, and shipped without scope creep into mobile or "see all" surfaces.

**Architecture:** New `ProductsMegaMenu.tsx` client component receives a `NavMeta` bundle as a prop. The bundle is fetched server-side in `(site)/layout.tsx` via a new `fetchNavMeta()` aggregator that issues 5 parallel Payload REST calls (categories, designs, featured collections, products-for-counting, featured product) and folds them into a typed payload. Hover-driven panel swap stays CSS-only (`:has()`), click-driven tab lock is React state via `data-*` attribute specificity overrides. Mobile menu stays a flat link list (deliberate scope cut).

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Tailwind v4, Payload 3 REST API, Vitest. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-05-16-products-dropdown-mega-menu-design.md`
**Visual baseline:** `apps/web/public/docs/products-dropdown-v2.html` (served at `http://80.240.31.146:3000/docs/products-dropdown-v2.html`)
**Closes:** `FU-2.2-a`, `FU-3.2-u`

---

## File structure

### Files created

| Path | Responsibility |
|---|---|
| `apps/web/src/components/layout/ProductsMegaMenu.tsx` | Client component. Owns trigger button, dropdown markup, tab/open state, ARIA, Esc/click-outside handlers. |
| `apps/web/src/components/layout/products-mega-menu.css` | Component-scoped CSS ported from v2 mockup. Imported by `ProductsMegaMenu.tsx`. |
| `apps/web/src/lib/__tests__/nav-meta.test.ts` | Vitest unit tests for the pure aggregation helper. |

### Files modified

| Path | Change |
|---|---|
| `apps/web/src/lib/payload.ts` | Add `NavMeta` + sub-types; add pure helper `bucketNavCounts()`; add `fetchNavMeta()`. |
| `apps/web/src/lib/products.ts` | Extend `parseSearchParams` with `q` and `design`. |
| `apps/web/src/lib/__tests__/products.test.ts` | Cover `q` + `design` parsing cases. |
| `apps/web/src/app/(site)/products/page.tsx` | Read `q`, `design` from URL params; pass to `fetchProducts`. |
| `apps/web/src/components/layout/SiteHeader.tsx` | Accept `navMeta` prop; render `<ProductsMegaMenu>` in place of the «محصولات» `<Link>`. |
| `apps/web/src/app/(site)/layout.tsx` | Call `fetchNavMeta()` (server); pass to `<SiteHeader navMeta={...} />`. |
| `docs/state.md` | Strike-through `FU-2.2-a` + `FU-3.2-u`; add session row. |

---

## Notes for the implementer

- **URL parameter naming gotcha:** The actual `/products` page reads `sp.cat` and `sp.mat` (short forms), bypassing the `parseSearchParams` helper which reads `category`/`material`. This plan **extends both** for consistency but the menu's links must use `cat` (not `category`) to actually filter. A follow-up to converge the two is noted at the end.
- **Featured-product image:** `PayloadProduct.gallery` is an array of `PayloadMedia`. With `depth=1` the first item's `url` is populated; use `product.gallery?.[0]?.url ?? null`.
- **Design subtitle:** Persian map for `age_group` → `infant: 'نوزاد'`, `child: 'کودک'`, `teen: 'نوجوان'`, `adult: 'بزرگسال'`.
- **Collection subtitle:** Walk the Lexical richText, concatenate text nodes, trim, slice to 60 chars. Existing helper does not exist yet — extract inline (don't promote prematurely).
- **No new dependencies.** Don't reach for `@testing-library/react` — it's not installed and this PR is too small to add it.

---

## Task 1: Branch + baseline check

**Files:**
- None modified

- [ ] **Step 1: Cut a feature branch from staging**

```bash
git checkout staging
git pull --ff-only origin staging || true
git checkout -b feat/products-mega-menu
```

- [ ] **Step 2: Verify baseline tests pass**

```bash
pnpm --filter @zhic/web test
```

Expected: all existing tests pass (`apps/web` has 29 tests per `state.md`). If any fail before changes, stop and investigate — don't proceed.

- [ ] **Step 3: Verify baseline typecheck passes**

```bash
pnpm --filter @zhic/web typecheck
```

Expected: 0 new errors. (Baseline may show pre-existing errors in `packages/ui/src/Tabs.tsx`, `Tooltip.tsx` — those are noted in `state.md` D7 row as 4 baseline errors. Anything beyond that is new.)

---

## Task 2: Extend `parseSearchParams` with `q` and `design`

**Files:**
- Modify: `apps/web/src/lib/products.ts`
- Modify: `apps/web/src/lib/__tests__/products.test.ts`
- Modify: `apps/web/src/lib/payload.ts` (the `ProductsQuery` type)

- [ ] **Step 1: Extend the `ProductsQuery` type**

Edit `apps/web/src/lib/payload.ts`, find the existing `ProductsQuery` (around line 262):

```ts
export type ProductsQuery = {
  category?: string;
  materials?: string[];
  price?: 'lt5' | '5to15' | '15to30' | 'gt30';
  size?: 'small' | 'medium' | 'large';
  sort?: 'newest' | 'name' | 'priceAsc' | 'priceDesc';
  page?: number;
};
```

Replace with:

```ts
export type ProductsQuery = {
  category?: string;
  materials?: string[];
  price?: 'lt5' | '5to15' | '15to30' | 'gt30';
  size?: 'small' | 'medium' | 'large';
  sort?: 'newest' | 'name' | 'priceAsc' | 'priceDesc';
  page?: number;
  /** Title/tagline/shortDescription substring search. */
  q?: string;
  /** Filter to a single design by slug. */
  design?: string;
};
```

- [ ] **Step 2: Write failing tests for `q` and `design` parsing**

Edit `apps/web/src/lib/__tests__/products.test.ts`. Find the `describe('parseSearchParams', () => {` block and add these tests inside it, before the closing `})`:

```ts
  it('reads q as a single trimmed string', () => {
    expect(parseSearchParams({ q: '  تخت  ' }).q).toBe('تخت');
  });

  it('drops an empty q', () => {
    expect(parseSearchParams({ q: '   ' }).q).toBeUndefined();
    expect(parseSearchParams({ q: '' }).q).toBeUndefined();
    expect(parseSearchParams({}).q).toBeUndefined();
  });

  it('reads design slug as a single string', () => {
    expect(parseSearchParams({ design: 'aramesh' }).design).toBe('aramesh');
  });

  it('drops an empty design slug', () => {
    expect(parseSearchParams({ design: '' }).design).toBeUndefined();
    expect(parseSearchParams({}).design).toBeUndefined();
  });
```

Also update the "safe defaults" assertion to include the new keys:

```ts
  it('returns safe defaults for an empty input', () => {
    expect(parseSearchParams({})).toEqual({
      category: undefined,
      materials: undefined,
      price: undefined,
      size: undefined,
      sort: 'newest',
      page: 1,
      q: undefined,
      design: undefined,
    });
  });
```

- [ ] **Step 3: Run tests to verify the new ones fail**

```bash
pnpm --filter @zhic/web test -- products.test.ts
```

Expected: 4 new `parseSearchParams` cases fail (q/design properties undefined, missing keys in defaults). Existing 8+ pass.

- [ ] **Step 4: Implement `q` and `design` parsing**

Edit `apps/web/src/lib/products.ts`. Find the `parseSearchParams` function and modify it:

```ts
export function parseSearchParams(sp: SearchParamsRecord): ProductsQuery {
  const sortRaw = pickFirst(sp.sort);
  const priceRaw = pickFirst(sp.price);
  const sizeRaw = pickFirst(sp.size);
  const pageRaw = pickFirst(sp.page);

  const category = pickFirst(sp.category);
  const materials = pickAll(sp.material);
  const qRaw = pickFirst(sp.q);
  const designRaw = pickFirst(sp.design);

  const sort: Sort = (SORTS as readonly string[]).includes(sortRaw ?? '')
    ? (sortRaw as Sort)
    : 'newest';
  const price = (PRICES as readonly string[]).includes(priceRaw ?? '')
    ? (priceRaw as Price)
    : undefined;
  const size = (SIZES as readonly string[]).includes(sizeRaw ?? '')
    ? (sizeRaw as Size)
    : undefined;

  let page = 1;
  if (pageRaw) {
    const parsed = Number.parseInt(pageRaw, 10);
    if (Number.isFinite(parsed) && parsed > 0) page = parsed;
  }

  const qTrimmed = qRaw?.trim() ?? '';
  const designTrimmed = designRaw?.trim() ?? '';

  return {
    category: category && category.length > 0 ? category : undefined,
    materials: materials.length > 0 ? materials : undefined,
    price,
    size,
    sort,
    page,
    q: qTrimmed.length > 0 ? qTrimmed : undefined,
    design: designTrimmed.length > 0 ? designTrimmed : undefined,
  };
}
```

- [ ] **Step 5: Run tests to verify all pass**

```bash
pnpm --filter @zhic/web test -- products.test.ts
```

Expected: all `parseSearchParams` cases pass (12+).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/products.ts apps/web/src/lib/__tests__/products.test.ts apps/web/src/lib/payload.ts
git commit -m "feat(web/nav): extend ProductsQuery + parseSearchParams with q and design"
```

---

## Task 3: Add `NavMeta` types in `lib/payload.ts`

**Files:**
- Modify: `apps/web/src/lib/payload.ts`

- [ ] **Step 1: Add the type declarations**

Edit `apps/web/src/lib/payload.ts`. Append the following after the existing `PayloadCollection` type (after line ~255, before the `ProductsQuery` type):

```ts
// --- Nav meta (mega-menu data bundle) ---------------------------------------

export type NavCategory = {
  id: string | number;
  name: string;
  slug: string;
  productCount: number;
};

export type NavDesign = {
  id: string | number;
  name: string;
  slug: string;
  /** Persian label derived from age_group; null if unset. */
  subtitle: string | null;
  productCount: number;
};

export type NavCollection = {
  id: string | number;
  name: string;
  slug: string;
  /** First plain-text line of description (≤60 chars); null if empty. */
  subtitle: string | null;
  productCount: number;
};

export type NavFeaturedProduct = {
  id: string | number;
  slug: string;
  name: string;
  tagline: string | null;
  basePriceRials: number;
  coverImageUrl: string | null;
};

export type NavMeta = {
  categories: NavCategory[];
  designs: NavDesign[];
  collections: NavCollection[];
  featuredProduct: NavFeaturedProduct | null;
};
```

- [ ] **Step 2: Verify typecheck still clean**

```bash
pnpm --filter @zhic/web typecheck
```

Expected: 0 new errors (the types are unused at this point, which is fine).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/payload.ts
git commit -m "feat(web/payload): NavMeta types for mega-menu data bundle"
```

---

## Task 4: Pure aggregation helper + tests

**Files:**
- Create: `apps/web/src/lib/__tests__/nav-meta.test.ts`
- Modify: `apps/web/src/lib/payload.ts`

- [ ] **Step 1: Write failing tests for `bucketNavCounts`**

Create `apps/web/src/lib/__tests__/nav-meta.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  bucketNavCounts,
  designSubtitle,
  collectionSubtitle,
  type PayloadCategory,
  type PayloadDesign,
  type PayloadCollection,
  type PayloadProduct,
} from '../payload';

const cat = (id: number, slug: string): PayloadCategory => ({ id, name: slug, slug });
const design = (id: number, slug: string, age?: PayloadDesign['age_group']): PayloadDesign => ({
  id,
  name: slug,
  slug,
  age_group: age ?? null,
});
const coll = (id: number, slug: string, productCount = 0): PayloadCollection => ({
  id,
  name: slug,
  slug,
  products: Array.from({ length: productCount }, (_, i) => ({
    id: 100 + i,
    name: `p${i}`,
    slug: `p-${i}`,
  })) as PayloadProduct[],
});
const product = (overrides: Partial<PayloadProduct>): PayloadProduct => ({
  id: 0,
  name: 'x',
  slug: 'x',
  ...overrides,
});

describe('bucketNavCounts', () => {
  it('counts products per category by categoryIds membership', () => {
    const cats = [cat(1, 'beds'), cat(2, 'nightstands')];
    const products = [
      product({ id: 10, categoryIds: [cats[0]] }),
      product({ id: 11, categoryIds: [cats[0], cats[1]] }),
      product({ id: 12, categoryIds: [cats[1]] }),
    ];
    const result = bucketNavCounts(cats, [], [], products);
    expect(result.categories.find((c) => c.slug === 'beds')?.productCount).toBe(2);
    expect(result.categories.find((c) => c.slug === 'nightstands')?.productCount).toBe(2);
  });

  it('counts products per design by single design relation', () => {
    const designs = [design(1, 'aramesh'), design(2, 'bahar')];
    const products = [
      product({ id: 10, design: { id: 1, name: 'aramesh', slug: 'aramesh' } }),
      product({ id: 11, design: { id: 1, name: 'aramesh', slug: 'aramesh' } }),
      product({ id: 12, design: { id: 2, name: 'bahar', slug: 'bahar' } }),
    ];
    const result = bucketNavCounts([], designs, [], products);
    expect(result.designs.find((d) => d.slug === 'aramesh')?.productCount).toBe(2);
    expect(result.designs.find((d) => d.slug === 'bahar')?.productCount).toBe(1);
  });

  it('reads collection productCount from products[].length directly', () => {
    const collections = [coll(1, 'spring', 5), coll(2, 'fall', 2)];
    const result = bucketNavCounts([], [], collections, []);
    expect(result.collections.find((c) => c.slug === 'spring')?.productCount).toBe(5);
    expect(result.collections.find((c) => c.slug === 'fall')?.productCount).toBe(2);
  });

  it('returns zero counts when no products match', () => {
    const cats = [cat(1, 'beds')];
    const result = bucketNavCounts(cats, [], [], []);
    expect(result.categories[0]?.productCount).toBe(0);
  });

  it('skips products with no design relation when counting designs', () => {
    const designs = [design(1, 'aramesh')];
    const products = [product({ id: 10 }), product({ id: 11, design: null })];
    const result = bucketNavCounts([], designs, [], products);
    expect(result.designs[0]?.productCount).toBe(0);
  });
});

describe('designSubtitle', () => {
  it('maps age_group values to Persian labels', () => {
    expect(designSubtitle({ age_group: 'infant' } as PayloadDesign)).toBe('نوزاد');
    expect(designSubtitle({ age_group: 'child' } as PayloadDesign)).toBe('کودک');
    expect(designSubtitle({ age_group: 'teen' } as PayloadDesign)).toBe('نوجوان');
    expect(designSubtitle({ age_group: 'adult' } as PayloadDesign)).toBe('بزرگسال');
  });

  it('returns null when age_group is unset', () => {
    expect(designSubtitle({ age_group: null } as PayloadDesign)).toBeNull();
    expect(designSubtitle({} as PayloadDesign)).toBeNull();
  });
});

describe('collectionSubtitle', () => {
  it('returns null when description is null', () => {
    expect(collectionSubtitle({ description: null } as PayloadCollection)).toBeNull();
  });

  it('extracts plain text from the first paragraph and truncates to 60 chars', () => {
    const description = {
      root: {
        type: 'root',
        version: 1,
        children: [
          {
            type: 'paragraph',
            version: 1,
            children: [{ type: 'text', text: 'مجموعه‌ای از قطعات گرم و خانگی برای فضای داخلی شما' }],
          },
        ],
      },
    } as PayloadCollection['description'];
    expect(collectionSubtitle({ description } as PayloadCollection)).toBe(
      'مجموعه‌ای از قطعات گرم و خانگی برای فضای داخلی شما',
    );
  });

  it('truncates text longer than 60 chars with an ellipsis', () => {
    const long = 'الف'.repeat(40); // 80 chars
    const description = {
      root: {
        type: 'root',
        version: 1,
        children: [
          {
            type: 'paragraph',
            version: 1,
            children: [{ type: 'text', text: long }],
          },
        ],
      },
    } as PayloadCollection['description'];
    const result = collectionSubtitle({ description } as PayloadCollection);
    expect(result?.length).toBeLessThanOrEqual(61); // 60 + 1 for ellipsis
    expect(result?.endsWith('…')).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm --filter @zhic/web test -- nav-meta.test.ts
```

Expected: all 8 cases fail with `bucketNavCounts is not a function` (and similar for the subtitle helpers).

- [ ] **Step 3: Implement the helpers in `lib/payload.ts`**

Append to `apps/web/src/lib/payload.ts` (after the `NavMeta` types, before the `ProductsQuery` block):

```ts
const AGE_GROUP_PERSIAN: Record<NonNullable<PayloadDesign['age_group']>, string> = {
  infant: 'نوزاد',
  child: 'کودک',
  teen: 'نوجوان',
  adult: 'بزرگسال',
};

export function designSubtitle(design: PayloadDesign): string | null {
  if (!design.age_group) return null;
  return AGE_GROUP_PERSIAN[design.age_group] ?? null;
}

function lexicalPlainText(root: LexicalRoot | null | undefined): string {
  if (!root) return '';
  const out: string[] = [];
  const walk = (node: any): void => {
    if (!node) return;
    if (typeof node.text === 'string') {
      out.push(node.text);
    }
    if (Array.isArray(node.children)) {
      node.children.forEach(walk);
    }
  };
  walk(root.root);
  return out.join('').trim();
}

export function collectionSubtitle(collection: PayloadCollection): string | null {
  const text = lexicalPlainText(collection.description ?? null);
  if (!text) return null;
  if (text.length <= 60) return text;
  return text.slice(0, 60).trimEnd() + '…';
}

export function bucketNavCounts(
  categories: PayloadCategory[],
  designs: PayloadDesign[],
  collections: PayloadCollection[],
  products: Pick<PayloadProduct, 'categoryIds' | 'design'>[],
): {
  categories: NavCategory[];
  designs: NavDesign[];
  collections: NavCollection[];
} {
  const categoryCount = new Map<string, number>();
  const designCount = new Map<string, number>();

  for (const product of products) {
    for (const cat of product.categoryIds ?? []) {
      if (!cat?.slug) continue;
      categoryCount.set(cat.slug, (categoryCount.get(cat.slug) ?? 0) + 1);
    }
    if (product.design?.slug) {
      designCount.set(
        product.design.slug,
        (designCount.get(product.design.slug) ?? 0) + 1,
      );
    }
  }

  return {
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      productCount: categoryCount.get(c.slug) ?? 0,
    })),
    designs: designs.map((d) => ({
      id: d.id,
      name: d.name,
      slug: d.slug,
      subtitle: designSubtitle(d),
      productCount: designCount.get(d.slug) ?? 0,
    })),
    collections: collections.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      subtitle: collectionSubtitle(c),
      productCount: (c.products ?? []).length,
    })),
  };
}
```

- [ ] **Step 4: Run tests to verify all pass**

```bash
pnpm --filter @zhic/web test -- nav-meta.test.ts
```

Expected: all 8 cases pass.

- [ ] **Step 5: Run full test suite to verify no regressions**

```bash
pnpm --filter @zhic/web test
```

Expected: pre-existing 29 tests still pass; new 8 cases pass.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/payload.ts apps/web/src/lib/__tests__/nav-meta.test.ts
git commit -m "feat(web/payload): bucketNavCounts + design/collection subtitle helpers"
```

---

## Task 5: `fetchNavMeta()` implementation

**Files:**
- Modify: `apps/web/src/lib/payload.ts`

- [ ] **Step 1: Implement `fetchNavMeta()`**

Append to `apps/web/src/lib/payload.ts` (after `fetchMaterials`, at the very bottom before the path helpers):

```ts
async function fetchNavCategories(): Promise<PayloadCategory[]> {
  const res = await payloadFetch<PayloadList<PayloadCategory>>(
    '/api/categories?limit=50&sort=name',
    'nav-categories',
  );
  return res?.docs ?? [];
}

async function fetchNavDesigns(): Promise<PayloadDesign[]> {
  const featured = await payloadFetch<PayloadList<PayloadDesign>>(
    '/api/designs?limit=20&where[featured][equals]=true&sort=name',
    'nav-designs',
  );
  if (featured?.docs.length) return featured.docs;
  // Fallback: an empty featured set is worse than showing all designs in the menu.
  const all = await payloadFetch<PayloadList<PayloadDesign>>(
    '/api/designs?limit=20&sort=name',
    'nav-designs',
  );
  return all?.docs ?? [];
}

async function fetchNavCollections(): Promise<PayloadCollection[]> {
  const res = await payloadFetch<PayloadList<PayloadCollection>>(
    '/api/collections?limit=20&where[featured][equals]=true&sort=name&depth=0',
    'nav-collections',
  );
  return res?.docs ?? [];
}

async function fetchNavCountingProducts(): Promise<
  Pick<PayloadProduct, 'categoryIds' | 'design'>[]
> {
  // depth=1 inflates categoryIds and design into objects so we can read .slug.
  // No `select` — Payload 3 REST `select` syntax is finicky and the 100-product
  // payload is small enough at depth=1 (~200-500KB) for a 5-min cached call.
  // Switch to denormalized productCount fields if this gets heavy (FU-MM-f).
  const res = await payloadFetch<PayloadList<PayloadProduct>>(
    '/api/products?limit=100&depth=1&where[status][equals]=published',
    'nav-products',
  );
  return (res?.docs ?? []).map((p) => ({
    categoryIds: p.categoryIds ?? null,
    design: p.design ?? null,
  }));
}

async function fetchNavFeaturedProduct(): Promise<NavFeaturedProduct | null> {
  const res = await payloadFetch<PayloadList<PayloadProduct>>(
    '/api/products?limit=1&depth=1&where[featured][equals]=true&where[status][equals]=published&sort=featuredOrder',
    'nav-featured-product',
  );
  const product = res?.docs[0];
  if (!product) return null;
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    tagline: product.tagline ?? null,
    basePriceRials: product.basePriceRials ?? 0,
    coverImageUrl: product.gallery?.[0]?.url ?? null,
  };
}

export async function fetchNavMeta(): Promise<NavMeta> {
  const [categories, designs, collections, countingProducts, featuredProduct] =
    await Promise.all([
      fetchNavCategories(),
      fetchNavDesigns(),
      fetchNavCollections(),
      fetchNavCountingProducts(),
      fetchNavFeaturedProduct(),
    ]);

  const counts = bucketNavCounts(categories, designs, collections, countingProducts);

  return {
    categories: counts.categories,
    designs: counts.designs,
    collections: counts.collections,
    featuredProduct,
  };
}
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm --filter @zhic/web typecheck
```

Expected: 0 new errors.

- [ ] **Step 3: Smoke-test the underlying Payload endpoints directly**

Verify the 5 endpoints fetchNavMeta calls actually return data. End-to-end of the bundled fetcher is exercised in Task 9 once the layout fetches it.

```bash
echo "categories:"  && curl -s "http://localhost:3001/api/categories?limit=50&sort=name"                                                                  | head -c 200; echo
echo "designs:"     && curl -s "http://localhost:3001/api/designs?limit=20&sort=name"                                                                      | head -c 200; echo
echo "collections:" && curl -s "http://localhost:3001/api/collections?limit=20&where%5Bfeatured%5D%5Bequals%5D=true&sort=name&depth=0"                    | head -c 200; echo
echo "products:"    && curl -s "http://localhost:3001/api/products?limit=100&depth=1&where%5Bstatus%5D%5Bequals%5D=published"                              | head -c 200; echo
echo "featured:"    && curl -s "http://localhost:3001/api/products?limit=1&depth=1&where%5Bfeatured%5D%5Bequals%5D=true&where%5Bstatus%5D%5Bequals%5D=published&sort=featuredOrder" | head -c 200; echo
```

Expected: each prefix prints a JSON object that starts with `{"docs":[...]`. If a `400` is returned for any, the query syntax needs adjusting before moving on. If `docs` arrays are empty, verify Payload is seeded.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/payload.ts
git commit -m "feat(web/payload): fetchNavMeta — bundle categories/designs/collections/featured for mega-menu"
```

---

## Task 6: Apply `q` + `design` filters in `/products` page and `fetchProducts`

**Files:**
- Modify: `apps/web/src/lib/payload.ts`
- Modify: `apps/web/src/app/(site)/products/page.tsx`

- [ ] **Step 1: Extend `fetchProducts` to apply `q` and `design`**

Edit `apps/web/src/lib/payload.ts`. Find the `fetchProducts` function (around line 543). Inside the `params` builder, after the existing `if (query.price) { … }` block, add:

```ts
  if (query.q) {
    // Substring search across name / tagline / shortDescription.
    // Payload's Postgres adapter compiles `contains` to ILIKE %…%.
    params.append('where[or][0][name][contains]', query.q);
    params.append('where[or][1][tagline][contains]', query.q);
    params.append('where[or][2][shortDescription][contains]', query.q);
  }
  if (query.design) {
    params.set('where[design.slug][equals]', query.design);
  }
```

- [ ] **Step 2: Read `q` and `design` from URL params in the page**

Edit `apps/web/src/app/(site)/products/page.tsx`. Find the `ProductsIndexPage` function (line 35). After the existing line:

```ts
  const material = typeof sp.mat === 'string' ? sp.mat : undefined;
```

Add:

```ts
  const qParam = typeof sp.q === 'string' ? sp.q.trim() : '';
  const q = qParam.length > 0 ? qParam : undefined;
  const design = typeof sp.design === 'string' && sp.design.length > 0 ? sp.design : undefined;
```

Then update the `fetchProducts` call to pass them:

```ts
  const [productsPage, categories, materials] = await Promise.all([
    fetchProducts({
      page,
      category,
      materials: material ? [material] : undefined,
      sort,
      q,
      design,
    }),
    fetchCategories(),
    fetchMaterials(),
  ]);
```

Also update `buildHref` to preserve `q` and `design` across navigation. Find the function (line 51) and add inside the `params` builder, after `if (nextSort !== 'newest') params.set('sort', nextSort);`:

```ts
    if (q) params.set('q', q);
    if (design) params.set('design', design);
```

- [ ] **Step 3: Verify typecheck + build**

```bash
pnpm --filter @zhic/web typecheck
pnpm --filter @zhic/web build
```

Expected: 0 new errors. Build succeeds.

- [ ] **Step 4: Smoke-test `q` filter against live `/products`**

```bash
curl -s -o /dev/null -w "/products?q=تخت → %{http_code}\n" "http://localhost:3000/products?q=%D8%AA%D8%AE%D8%AA"
curl -s "http://localhost:3000/products?q=%D8%AA%D8%AE%D8%AA" | grep -oE 'class="[^"]*product-grid' | head -1 || echo "no grid match (page renders but no products grid markup matched — verify in browser)"
```

Expected: HTTP 200. The page should render. Manual verify in a browser: filter results actually narrow.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/payload.ts "apps/web/src/app/(site)/products/page.tsx"
git commit -m "feat(web/products): q (title substring) + design slug filters on /products"
```

---

## Task 7: `ProductsMegaMenu` component skeleton + CSS

**Files:**
- Create: `apps/web/src/components/layout/ProductsMegaMenu.tsx`
- Create: `apps/web/src/components/layout/products-mega-menu.css`

- [ ] **Step 1: Create the CSS file**

Create `apps/web/src/components/layout/products-mega-menu.css`:

```css
/* Mega-menu — see docs/superpowers/specs/2026-05-16-products-dropdown-mega-menu-design.md §4 */

/* Trigger wrapper — `position: static` so the absolutely-positioned panel can span the header width */
.zh-mega-wrap { position: static; }

.zh-mega-trigger {
  font-family: inherit;
  font-size: inherit;
  color: var(--color-stone);
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  transition: color var(--dur-hover) var(--ease-out-soft);
}

.zh-mega-trigger:hover,
.zh-mega-wrap:hover .zh-mega-trigger,
.zh-mega-wrap:focus-within .zh-mega-trigger {
  color: var(--color-charcoal);
}

.zh-mega-trigger[aria-expanded="true"] {
  color: var(--color-charcoal);
}

.zh-mega-trigger .zh-chev {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-left: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
  transform: rotate(-45deg) translateY(-1px);
  transition: transform var(--dur-hover) var(--ease-out-soft);
}

.zh-mega-wrap:hover .zh-chev,
.zh-mega-trigger[aria-expanded="true"] .zh-chev {
  transform: rotate(135deg) translateY(-1px);
}

/* Panel */
.zh-mega {
  position: absolute;
  inset-inline: 0;
  top: 100%;
  background: var(--color-ivory);
  border-top: 1px solid var(--color-sand);
  border-bottom: 1px solid var(--color-sand);
  box-shadow: 0 16px 32px rgba(20, 17, 15, 0.06);
  opacity: 0;
  transform: translateY(-8px);
  pointer-events: none;
  transition: opacity var(--dur-mega) var(--ease-out-soft),
              transform var(--dur-mega) var(--ease-out-soft);
}

.zh-mega-wrap:hover .zh-mega,
.zh-mega-wrap:focus-within .zh-mega,
.zh-mega[data-open="true"],
.zh-mega:hover {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

/* Head row */
.zh-mega-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  padding-block: 1.5rem;
  border-bottom: 1px solid var(--color-sand);
}

.zh-mega-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.zh-mega-tab {
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-stone);
  background: transparent;
  border: 1px solid transparent;
  padding: 0.6rem 1.25rem;
  border-radius: 9999px;
  cursor: pointer;
  transition: color var(--dur-hover) var(--ease-out-soft),
              border-color var(--dur-hover) var(--ease-out-soft),
              background-color var(--dur-hover) var(--ease-out-soft);
}

.zh-mega-tab:hover {
  color: var(--color-charcoal);
  border-color: var(--color-sand);
}

.zh-mega-tab[aria-selected="true"] {
  color: var(--color-ivory);
  background: var(--color-charcoal);
  border-color: var(--color-charcoal);
}

/* Search */
.zh-mega-search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 0 1 340px;
  background: var(--color-cream);
  border: 1px solid var(--color-sand);
  border-radius: 9999px;
  padding: 0.55rem 1rem;
  transition: border-color var(--dur-hover) var(--ease-out-soft),
              background-color var(--dur-hover) var(--ease-out-soft);
}

.zh-mega-search:focus-within {
  border-color: var(--color-forest);
  background: var(--color-ivory);
}

.zh-mega-search__icon {
  color: var(--color-stone);
  display: inline-flex;
  flex-shrink: 0;
}

.zh-mega-search input {
  font-family: inherit;
  font-size: 0.95rem;
  color: var(--color-charcoal);
  background: transparent;
  border: 0;
  outline: 0;
  flex: 1;
  min-width: 0;
}

.zh-mega-search input::placeholder { color: var(--color-stone); }

/* Body: panels grid + featured aside */
.zh-mega-body {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 3.5rem;
  padding-block: 2.5rem 3rem;
  align-items: start;
}

.zh-mega-panels {
  position: relative;
  min-height: 280px;
}

.zh-mega-panel {
  display: none;
  animation: zh-mega-fade var(--dur-mega) var(--ease-out-soft);
}

/* Active panel is the one whose data-panel matches the menu's data-active-tab */
.zh-mega[data-active-tab="categories"] .zh-mega-panel[data-panel="categories"],
.zh-mega[data-active-tab="designs"] .zh-mega-panel[data-panel="designs"],
.zh-mega[data-active-tab="collections"] .zh-mega-panel[data-panel="collections"] {
  display: block;
}

/* Hover overrides the click-locked tab — unless data-locked="true" */
.zh-mega:not([data-locked="true"]):has(.zh-mega-tab[data-tab="designs"]:hover) .zh-mega-panel[data-panel="categories"],
.zh-mega:not([data-locked="true"]):has(.zh-mega-tab[data-tab="collections"]:hover) .zh-mega-panel[data-panel="categories"] {
  display: none;
}
.zh-mega:not([data-locked="true"]):has(.zh-mega-tab[data-tab="designs"]:hover) .zh-mega-panel[data-panel="designs"] {
  display: block;
}
.zh-mega:not([data-locked="true"]):has(.zh-mega-tab[data-tab="collections"]:hover) .zh-mega-panel[data-panel="collections"] {
  display: block;
}

@keyframes zh-mega-fade {
  from { opacity: 0; transform: translateY(2px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Grid lists */
.zh-mega-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem 2rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.zh-mega-grid li { list-style: none; }

.zh-mega-grid a {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 1rem;
  color: var(--color-charcoal);
  padding-block: 0.45rem;
  border-bottom: 1px solid transparent;
  text-decoration: none;
  transition: color var(--dur-hover) var(--ease-out-soft),
              border-color var(--dur-hover) var(--ease-out-soft);
}

.zh-mega-grid a:hover {
  color: var(--color-forest);
  border-bottom-color: var(--color-forest);
}

.zh-mega-grid .zh-count {
  font-size: 0.75rem;
  color: var(--color-stone);
  font-variant-numeric: tabular-nums;
}

.zh-mega-grid--rich { gap: 1.5rem 2rem; }
.zh-mega-grid--rich a {
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  padding-block: 0.75rem;
}

.zh-mega-grid__title { font-weight: 700; font-size: 1.05rem; }
.zh-mega-grid__sub { font-size: 0.85rem; color: var(--color-stone); }
.zh-mega-grid--rich .zh-count { margin-top: 0.25rem; }

.zh-mega-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  color: var(--color-charcoal);
  margin-top: 1.5rem;
  border-bottom: 1px solid var(--color-charcoal);
  padding-bottom: 2px;
  text-decoration: none;
  transition: color var(--dur-hover), border-color var(--dur-hover);
}

.zh-mega-cta:hover {
  color: var(--color-forest);
  border-bottom-color: var(--color-forest);
}

/* Featured aside */
.zh-mega-featured {
  border-inline-start: 1px solid var(--color-sand);
  padding-inline-start: 3rem;
}

.zh-mega-eyebrow {
  font-size: 0.75rem;
  color: var(--color-forest);
  text-transform: uppercase;
  letter-spacing: var(--tracking-eyebrow-wide, 0.12em);
  margin-bottom: 1.25rem;
  font-weight: 700;
}

.zh-mega-feature {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.zh-mega-feature__media {
  aspect-ratio: 4 / 3;
  background: linear-gradient(135deg, var(--color-cream), var(--color-sand));
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.zh-mega-feature__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.zh-mega-feature__title {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.25;
  color: var(--color-charcoal);
  margin: 0;
}

.zh-mega-feature__tagline {
  color: var(--color-stone);
  font-size: 0.95rem;
  margin: 0;
}

.zh-mega-feature__price {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  margin-top: 0.5rem;
  color: var(--color-charcoal);
}

.zh-mega-feature__price .num {
  font-size: 1.25rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.zh-mega-feature__price .unit {
  font-size: 0.85rem;
  color: var(--color-stone);
}

/* Hide on mobile (< 768px) — mega-menu is desktop only */
@media (max-width: 767px) {
  .zh-mega-wrap { display: none; }
}
```

- [ ] **Step 2: Create the component**

Create `apps/web/src/components/layout/ProductsMegaMenu.tsx`:

```tsx
'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { Container, MoneyDisplay } from '@zhic/ui';
import type { NavMeta } from '@/lib/payload';
import './products-mega-menu.css';

type Tab = 'categories' | 'designs' | 'collections';

export type ProductsMegaMenuProps = {
  data: NavMeta;
  /** Pathname for active-link styling on the trigger. */
  pathname: string | null;
};

export function ProductsMegaMenu({ data, pathname }: ProductsMegaMenuProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('categories');
  const [locked, setLocked] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const active = pathname?.startsWith('/products') ?? false;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setLocked(false);
        triggerRef.current?.focus();
      }
    };
    const onClickOutside = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setLocked(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [open]);

  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab);
    setLocked(true);
  };

  return (
    <div
      ref={wrapRef}
      className="zh-mega-wrap"
      onMouseLeave={() => setLocked(false)}
    >
      <button
        ref={triggerRef}
        type="button"
        className="zh-mega-trigger"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        aria-current={active ? 'page' : undefined}
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
      >
        محصولات
        <span className="zh-chev" aria-hidden />
      </button>

      <div
        id={menuId}
        className="zh-mega"
        role="menu"
        aria-label="منوی محصولات"
        data-open={open ? 'true' : undefined}
        data-active-tab={activeTab}
        data-locked={locked ? 'true' : undefined}
      >
        <Container>
          <div className="zh-mega-head">
            <div role="tablist" aria-label="فیلتر منوی محصولات" className="zh-mega-tabs">
              <TabButton tab="categories" label="دسته‌بندی‌ها" activeTab={activeTab} onClick={handleTabClick} />
              <TabButton tab="designs" label="طرح‌ها" activeTab={activeTab} onClick={handleTabClick} />
              <TabButton tab="collections" label="مجموعه‌ها" activeTab={activeTab} onClick={handleTabClick} />
            </div>

            <form className="zh-mega-search" action="/products" method="get" role="search">
              <span className="zh-mega-search__icon" aria-hidden>
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="7" cy="7" r="5" />
                  <path d="M11 11l3 3" strokeLinecap="round" />
                </svg>
              </span>
              <input
                type="search"
                name="q"
                placeholder="جستجوی محصول، طرح یا مجموعه…"
                aria-label="جستجو در محصولات"
              />
            </form>
          </div>

          <div className="zh-mega-body">
            <div className="zh-mega-panels">
              <CategoriesPanel items={data.categories} />
              <DesignsPanel items={data.designs} />
              <CollectionsPanel items={data.collections} />
            </div>

            {data.featuredProduct ? (
              <FeaturedAside product={data.featuredProduct} />
            ) : (
              <div aria-hidden /> /* empty cell keeps the grid 2-col */
            )}
          </div>
        </Container>
      </div>
    </div>
  );
}

function TabButton({
  tab,
  label,
  activeTab,
  onClick,
}: {
  tab: Tab;
  label: string;
  activeTab: Tab;
  onClick: (tab: Tab) => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      data-tab={tab}
      className="zh-mega-tab"
      aria-selected={activeTab === tab}
      aria-controls={`panel-${tab}`}
      onClick={() => onClick(tab)}
    >
      {label}
    </button>
  );
}

function CategoriesPanel({ items }: { items: NavMeta['categories'] }) {
  return (
    <div className="zh-mega-panel" data-panel="categories" role="tabpanel" id="panel-categories" aria-label="دسته‌بندی‌ها">
      {items.length === 0 ? (
        <p className="zh-mega-empty">هیچ دسته‌بندی پیدا نشد.</p>
      ) : (
        <>
          <ul className="zh-mega-grid">
            {items.map((c) => (
              <li key={c.id}>
                <Link href={`/products?cat=${encodeURIComponent(c.slug)}`}>
                  <span>{c.name}</span>
                  <span className="zh-count">{toPersianDigits(c.productCount)}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/products" className="zh-mega-cta">
            همه‌ی محصولات <Arrow />
          </Link>
        </>
      )}
    </div>
  );
}

function DesignsPanel({ items }: { items: NavMeta['designs'] }) {
  return (
    <div className="zh-mega-panel" data-panel="designs" role="tabpanel" id="panel-designs" aria-label="طرح‌ها">
      {items.length === 0 ? (
        <p className="zh-mega-empty">هیچ طرحی پیدا نشد.</p>
      ) : (
        <ul className="zh-mega-grid zh-mega-grid--rich">
          {items.map((d) => (
            <li key={d.id}>
              <Link href={`/products?design=${encodeURIComponent(d.slug)}`}>
                <span className="zh-mega-grid__title">{d.name}</span>
                {d.subtitle ? <span className="zh-mega-grid__sub">{d.subtitle}</span> : null}
                <span className="zh-count">{toPersianDigits(d.productCount)} محصول</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CollectionsPanel({ items }: { items: NavMeta['collections'] }) {
  return (
    <div className="zh-mega-panel" data-panel="collections" role="tabpanel" id="panel-collections" aria-label="مجموعه‌ها">
      {items.length === 0 ? (
        <p className="zh-mega-empty">هیچ مجموعه‌ای پیدا نشد.</p>
      ) : (
        <ul className="zh-mega-grid zh-mega-grid--rich">
          {items.map((c) => (
            <li key={c.id}>
              <Link href={`/collections/${encodeURIComponent(c.slug)}`}>
                <span className="zh-mega-grid__title">{c.name}</span>
                {c.subtitle ? <span className="zh-mega-grid__sub">{c.subtitle}</span> : null}
                <span className="zh-count">{toPersianDigits(c.productCount)} محصول</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FeaturedAside({ product }: { product: NonNullable<NavMeta['featuredProduct']> }) {
  return (
    <aside className="zh-mega-featured" aria-label="محصول شاخص ماه">
      <p className="zh-mega-eyebrow">محصول شاخص ماه</p>
      <div className="zh-mega-feature">
        <div className="zh-mega-feature__media">
          {product.coverImageUrl ? (
            <img src={product.coverImageUrl} alt="" loading="lazy" />
          ) : (
            <span style={{ position: 'absolute', insetInlineEnd: '8%', insetBlockStart: '6%', fontSize: '5rem', lineHeight: 1, color: 'var(--color-ivory)', opacity: 0.65, fontWeight: 900 }} aria-hidden>ژ</span>
          )}
        </div>
        <h3 className="zh-mega-feature__title">{product.name}</h3>
        {product.tagline ? <p className="zh-mega-feature__tagline">{product.tagline}</p> : null}
        <div className="zh-mega-feature__price">
          <MoneyDisplay rials={product.basePriceRials} />
        </div>
        <Link href={`/products/${encodeURIComponent(product.slug)}`} className="zh-mega-cta">
          مشاهده محصول <Arrow />
        </Link>
      </div>
    </aside>
  );
}

function Arrow() {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: '1rem',
        height: '1px',
        background: 'currentColor',
        position: 'relative',
      }}
    >
      <span
        style={{
          content: '""',
          position: 'absolute',
          insetInlineStart: '-2px',
          top: '-3px',
          width: '7px',
          height: '7px',
          borderLeft: '1.5px solid currentColor',
          borderBottom: '1.5px solid currentColor',
          transform: 'rotate(45deg)',
          display: 'block',
        }}
      />
    </span>
  );
}

function toPersianDigits(n: number): string {
  return String(n).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
}
```

- [ ] **Step 3: Verify typecheck**

```bash
pnpm --filter @zhic/web typecheck
```

Expected: 0 new errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/layout/ProductsMegaMenu.tsx apps/web/src/components/layout/products-mega-menu.css
git commit -m "feat(web/nav): ProductsMegaMenu component + scoped CSS"
```

---

## Task 8: Wire `ProductsMegaMenu` into `SiteHeader`

**Files:**
- Modify: `apps/web/src/components/layout/SiteHeader.tsx`

- [ ] **Step 1: Update `SiteHeader` to accept `navMeta` and render the mega-menu**

Replace the contents of `apps/web/src/components/layout/SiteHeader.tsx` with:

```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container } from '@zhic/ui';
import { NAV_LINKS, isNavActive } from './navLinks';
import { MobileMenu } from './MobileMenu';
import { ProductsMegaMenu } from './ProductsMegaMenu';
import type { NavMeta } from '@/lib/payload';

export type SiteHeaderProps = {
  navMeta: NavMeta;
};

const PRODUCTS_HREF = '/products';

export function SiteHeader({ navMeta }: SiteHeaderProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const chromeClass = scrolled
    ? 'site-header-chrome'
    : 'bg-transparent border-b border-transparent';

  // Desktop nav excludes محصولات because ProductsMegaMenu owns that entry.
  const desktopNavLinks = NAV_LINKS.filter((item) => item.href !== PRODUCTS_HREF);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[var(--z-header)] py-2 md:py-4 transition-all duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] ${chromeClass}`}
      >
        <Container>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center md:flex md:justify-between">
            {/* Mobile: hamburger (start). Desktop: brand first. */}
            <button
              type="button"
              aria-label="منو"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center justify-self-start text-charcoal transition-colors duration-[var(--dur-hover)] hover:text-ink md:hidden"
            >
              <svg viewBox="0 0 16 16" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <path d="M2 4H14M2 8H14M2 12H14" strokeLinecap="round" />
              </svg>
            </button>

            <Link
              href="/"
              className="justify-self-center text-body font-black text-charcoal transition-opacity duration-[var(--dur-hover)] hover:opacity-80 md:justify-self-auto md:text-h4"
            >
              ژیک
            </Link>

            <nav aria-label="اصلی" className="hidden items-center gap-7 text-small text-stone md:flex">
              <ProductsMegaMenu data={navMeta} pathname={pathname} />
              {desktopNavLinks.map((item) => {
                const active = isNavActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={
                      active
                        ? 'border-b-[1.5px] border-forest pb-[2px] font-bold text-charcoal'
                        : 'transition-colors duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] hover:text-charcoal'
                    }
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <span aria-hidden className="md:hidden" />
          </div>
        </Container>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} pathname={pathname} />
    </>
  );
}
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm --filter @zhic/web typecheck
```

Expected: 1 new error in `(site)/layout.tsx` complaining that `<SiteHeader />` is missing the `navMeta` prop. That's fixed in Task 9.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/layout/SiteHeader.tsx
git commit -m "feat(web/nav): SiteHeader renders ProductsMegaMenu in place of flat محصولات link"
```

---

## Task 9: Fetch nav meta in `(site)/layout.tsx` and pass to `SiteHeader`

**Files:**
- Modify: `apps/web/src/app/(site)/layout.tsx`

- [ ] **Step 1: Update the layout to be async and fetch `navMeta`**

Replace the contents of `apps/web/src/app/(site)/layout.tsx` with:

```tsx
import { SkipLink } from '@zhic/ui';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { fetchNavMeta } from '@/lib/payload';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const navMeta = await fetchNavMeta();
  return (
    <>
      <SkipLink />
      <SiteHeader navMeta={navMeta} />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}
```

- [ ] **Step 2: Verify typecheck + build**

```bash
pnpm --filter @zhic/web typecheck
pnpm --filter @zhic/web build
```

Expected: 0 new errors. Build succeeds.

- [ ] **Step 3: Rebuild and restart so the layout change is picked up**

The workspace runs `next start` (production mode) via pm2 — source changes only take effect after rebuild + restart.

```bash
pnpm --filter @zhic/web build
pm2 restart zhic-web
until curl -sf -o /dev/null http://localhost:3000/; do sleep 0.5; done
curl -s -o /dev/null -w "/ → %{http_code}\n" http://localhost:3000/
curl -s -o /dev/null -w "/products → %{http_code}\n" http://localhost:3000/products
curl -s -o /dev/null -w "/products?q=تخت → %{http_code}\n" "http://localhost:3000/products?q=%D8%AA%D8%AE%D8%AA"
```

Expected: all three return 200.

- [ ] **Step 4: Visual verification (manual)**

Open `http://80.240.31.146:3000/` in a browser. Confirm:

1. Hover «محصولات» in the top nav → mega-menu opens.
2. Default panel is Categories with a grid of category names and Persian-digit counts.
3. Hovering «طرح‌ها» tab → panel swaps to designs (rich cards with subtitle).
4. Hovering «مجموعه‌ها» tab → panel swaps to collections (rich cards).
5. Featured product card visible on the end side throughout.
6. Search input accepts Persian text. Submitting it lands on `/products?q=…` and the results filter.
7. Esc closes the menu. Click outside closes.
8. Mobile viewport (resize browser ≤ 767px): «محصولات» is hidden from the top nav (it's mobile-flat via MobileMenu).

- [ ] **Step 5: Commit**

```bash
git add "apps/web/src/app/(site)/layout.tsx"
git commit -m "feat(web/layout): fetch NavMeta in (site)/layout and pass into SiteHeader"
```

---

## Task 10: Update `state.md`

**Files:**
- Modify: `docs/state.md`

- [ ] **Step 1: Read the current Follow-ups table**

```bash
grep -n "FU-2.2-a\|FU-3.2-u" docs/state.md
```

Note the line numbers and the original wording of each row.

- [ ] **Step 2: Mark `FU-2.2-a` resolved**

Find the row matching `| FU-2.2-a | 2.2 | Mega-menu on «محصولات» and «درباره‌ی ما» — needs categories data (3.2) + showroom list (3.3) |`.

Replace with:

```markdown
| ~~FU-2.2-a~~ | 2.2 | ~~Mega-menu on «محصولات» and «درباره‌ی ما»~~ — **«محصولات» half resolved 2026-05-16** via ProductsMegaMenu (top-tab layout + pinned featured product + q search wire). «درباره‌ی ما» half carries forward as FU-MM-g. |
```

- [ ] **Step 3: Mark `FU-3.2-u` resolved**

Find the row matching `| FU-3.2-u | 3.2 | Mega-menu on «محصولات» wired to `categories` + `collections.featured` collections. Carries forward FU-2.2-a |`.

Replace with:

```markdown
| ~~FU-3.2-u~~ | 3.2 | ~~Mega-menu on «محصولات» wired to `categories` + `collections.featured` collections~~ — **resolved 2026-05-16** in ProductsMegaMenu via fetchNavMeta() (categories + featured collections + featured designs + featured product, all from Payload). |
```

- [ ] **Step 4: Add new follow-ups FU-MM-a through FU-MM-h**

Append to the Follow-ups table (before the closing of the table, after the last existing FU row):

```markdown
| FU-MM-a | MM | `/designs` index page — wire "See all" CTA for designs panel of the mega-menu. |
| FU-MM-b | MM | `/collections` index page — wire "See all" CTA for collections panel of the mega-menu. |
| FU-MM-c | MM | Mobile mega-menu expansion in `MobileMenu.tsx` — currently «محصولات» is a flat link to `/products` on mobile. Trigger by user research signal. |
| FU-MM-d | MM | Arrow-key navigation between tabs in the mega-menu + roving tabindex. |
| FU-MM-e | MM | Live autocomplete in the mega-menu search input (server-side suggest endpoint). |
| FU-MM-f | MM | Denormalized `productCount` field on `Categories` / `Designs` / `Collections` with `afterChange` Payload hooks. Promote when catalog crosses 100 products. |
| FU-MM-g | MM | Companion mega-menu on «درباره‌ی ما» — the other half of FU-2.2-a. |
| FU-MM-h | MM | Search chip on `/products` header showing active `q` and `✕` clear button. |
| FU-MM-i | MM | Converge `/products` page URL params (currently `cat`/`mat`) with `parseSearchParams` (which reads `category`/`material`). Today both are extended for `q`+`design`; future PR aligns the naming. |
```

- [ ] **Step 5: Update Session status table**

Find the `### Phase 2 — Core UI Components` or appropriate section and add a new row, or — if there isn't a clean home — add a row under a new "### Post-Phase enhancements" heading after the redesign-v2 row (search for `Redesign v2 (end-to-end)`):

```markdown
### Post-Phase enhancements

| Item | Status | Commit | Notes |
| --- | --- | --- | --- |
| ProductsMegaMenu | ✅ | (PR HEAD) | Top-tab + pinned featured layout per v2 mockup. Closes FU-2.2-a (محصولات half) + FU-3.2-u. New fetchNavMeta bundles categories/designs/collections/featured-product from Payload; new ProductsMegaMenu client component in `apps/web/src/components/layout/`. Mobile stays a flat link. Spec: `docs/superpowers/specs/2026-05-16-products-dropdown-mega-menu-design.md`. Plan: `docs/superpowers/plans/2026-05-16-products-dropdown-mega-menu.md`. |
```

- [ ] **Step 6: Update the Snapshot table at the top**

Find:

```
| Last updated | 2026-05-10 |
```

Replace with:

```
| Last updated | 2026-05-16 |
```

And update `Current session` to:

```
| Current session | ProductsMegaMenu shipped on `feat/products-mega-menu`. Closes FU-2.2-a (محصولات half) + FU-3.2-u. Tier 2 Part B still waiting on operator Net Afraz provisioning. |
```

- [ ] **Step 7: Commit**

```bash
git add docs/state.md
git commit -m "docs(state): ProductsMegaMenu shipped — close FU-2.2-a (محصولات half) + FU-3.2-u + 9 follow-ups"
```

---

## Task 11: Open a PR

**Files:**
- None.

- [ ] **Step 1: Confirm working tree is clean**

```bash
git status
```

Expected: `working tree clean` on `feat/products-mega-menu`.

- [ ] **Step 2: Push the branch**

```bash
git push -u origin feat/products-mega-menu
```

Expected: branch creates on origin.

- [ ] **Step 3: Ask the user for permission to open a PR**

The pattern in this repo is that the operator opens PRs themselves. Stop here and tell the user the branch is pushed and ready for PR review. Don't `gh pr create` without explicit go-ahead.

---

## Spec coverage matrix

For the reviewer's confidence — each spec requirement maps to a task:

| Spec § | Requirement | Task |
|---|---|---|
| §2.1 | `ProductsMegaMenu.tsx` created | Task 7 |
| §2.1 | `fetchNavMeta()` in `lib/payload.ts` | Tasks 3-5 |
| §2.1 | `parseSearchParams` extended for `q` | Task 2 |
| §2.2 | `SiteHeader.tsx` accepts `navMeta` prop | Task 8 |
| §2.2 | `(site)/layout.tsx` fetches and passes | Task 9 |
| §2.3 | Server → client data flow | Tasks 5 + 9 |
| §3.1 | NavMeta + sub-types | Task 3 |
| §3.2 | 5 parallel calls | Task 5 |
| §3.2 | Designs fallback (all if zero featured) | Task 5 |
| §3.2 | Bucketing via pure helper | Task 4 |
| §3.3 | Caching via `next: { revalidate: 300, tags }` | Task 5 (uses existing `payloadFetch` wrapper) |
| §4.1-4.4 | Component props, state, ARIA, behavior | Task 7 |
| §4.5 | Hover via `:has()`, click-lock via data-attr | Task 7 (CSS + component) |
| §5.1 | `parseSearchParams` extended for `q` | Task 2 |
| §5.2 | `/products` page applies `q` | Task 6 |
| §5.3 | Search chip deferred to FU-MM-h | Task 10 (FU captured) |
| §6 | Categories CTA kept, Designs/Collections cut | Task 7 (only `CategoriesPanel` renders a `zh-mega-cta`) |
| §6 | Per-item links use `cat`/`design`/`/collections/[slug]` | Task 7 |
| §7 | Mobile stays flat | Task 7 (CSS `@media (max-width: 767px) { display: none }`) + Task 8 (NAV_LINKS preserved for MobileMenu) |
| §8 | Unit tests for `parseSearchParams` | Task 2 |
| §8 | Unit tests for bucketing + subtitles | Task 4 |
| §9.1-9.10 | Acceptance criteria | Tasks 7-9 + manual verify in Task 9 step 4 |
| §9.11 | Typecheck/lint/build clean | Tasks 5, 6, 8, 9 |
| §9.12 | `state.md` updated | Task 10 |

---

## Out of scope (captured as FU-MM-* in `state.md`)

- `/designs` index page → `FU-MM-a`
- `/collections` index page → `FU-MM-b`
- Mobile mega-menu → `FU-MM-c`
- Arrow-key nav within tabs → `FU-MM-d`
- Live autocomplete → `FU-MM-e`
- Denormalized `productCount` fields → `FU-MM-f`
- «درباره‌ی ما» companion menu → `FU-MM-g`
- Search chip on `/products` → `FU-MM-h`
- Converge `cat`/`mat` vs `category`/`material` URL params → `FU-MM-i`
