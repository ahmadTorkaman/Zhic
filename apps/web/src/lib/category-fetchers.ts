import { payloadFetch } from './payload-internal';
import type {
  PayloadCategory,
  PayloadDesign,
  PayloadMaterial,
  PayloadMedia,
  PayloadList,
} from './payload';

// type alias for clarity
type Id = string | number;

export async function fetchChildCategories(parentId: Id): Promise<PayloadCategory[]> {
  const res = await payloadFetch<PayloadList<PayloadCategory>>(
    `/api/categories?where[parent][equals]=${encodeURIComponent(String(parentId))}&depth=2&limit=50&sort=name`,
    'categories',
  );
  return res?.docs ?? [];
}

export async function fetchSiblingCategories(
  parentId: Id,
  excludeId: Id,
): Promise<PayloadCategory[]> {
  const res = await payloadFetch<PayloadList<PayloadCategory>>(
    `/api/categories?where[parent][equals]=${encodeURIComponent(String(parentId))}&where[id][not_equals]=${encodeURIComponent(String(excludeId))}&depth=1&limit=4&sort=name`,
    'categories',
  );
  return res?.docs ?? [];
}

export async function fetchSiblingParents(excludeId: Id): Promise<PayloadCategory[]> {
  const res = await payloadFetch<PayloadList<PayloadCategory>>(
    `/api/categories?where[parent][exists]=false&where[id][not_equals]=${encodeURIComponent(String(excludeId))}&depth=1&limit=4&sort=name`,
    'categories',
  );
  return res?.docs ?? [];
}

/**
 * Representative tile photo for each child category, for the hub mosaic.
 * Resolution per child: `cover` (set in CMS) wins; else the first published
 * product photo found in the child's SUBTREE (so a pure-parent child such as
 * `baby` borrows a photo from a descendant like `convertible`). Children with
 * no cover and no product fall out of the map → the tile renders a sand
 * fallback. Returns slug → image URL.
 */
export async function fetchChildTilePhotos(
  children: PayloadCategory[],
): Promise<Map<string, string>> {
  const photos = new Map<string, string>();
  if (!children.length) return photos;

  // covers first (no query needed — already inflated on the children).
  for (const c of children) {
    const url = c.cover?.url;
    if (url) photos.set(c.slug, url);
  }

  // grandchildren → map each descendant slug up to its top child slug.
  const childIds = children.map((c) => String(c.id));
  const gc = await payloadFetch<PayloadList<PayloadCategory>>(
    `/api/categories?where[parent][in]=${encodeURIComponent(childIds.join(','))}&depth=1&limit=200`,
    'categories',
  );
  const topBySlug = new Map<string, string>();
  for (const c of children) topBySlug.set(c.slug, c.slug);
  for (const g of gc?.docs ?? []) {
    const p = g.parent;
    const pslug = p && typeof p === 'object' ? p.slug : null;
    if (pslug) topBySlug.set(g.slug, pslug);
  }

  // one product query over the whole subtree; first photo per top child wins.
  const needPhoto = children.some((c) => !photos.has(c.slug));
  if (needPhoto) {
    const allSlugs = Array.from(topBySlug.keys());
    const prods = await payloadFetch<
      PayloadList<{ categories?: PayloadCategory[] | null; gallery?: PayloadMedia[] | null }>
    >(
      `/api/products?where[categories.slug][in]=${encodeURIComponent(allSlugs.join(','))}&where[status][equals]=published&depth=1&limit=500`,
      'products',
    );
    for (const p of prods?.docs ?? []) {
      const url = p.gallery?.[0]?.url;
      if (!url) continue;
      for (const c of p.categories ?? []) {
        const top = topBySlug.get(c.slug);
        if (top && !photos.has(top)) photos.set(top, url);
      }
    }
  }
  return photos;
}

/**
 * Two-round-trip join: products in category → distinct design IDs → designs.
 * Custom REST endpoint is FU-CAT-a; this version is fine at 5-min revalidate.
 */
export async function fetchDesignsForCategory(categorySlug: string): Promise<PayloadDesign[]> {
  // Step 1: products in this category (paginated to 200 — enough for any leaf)
  const products = await payloadFetch<PayloadList<{ design?: { id: Id } | Id | null }>>(
    `/api/products?where[categories.slug][equals]=${encodeURIComponent(categorySlug)}&where[status][equals]=published&depth=1&limit=200`,
    'products',
  );
  if (!products?.docs?.length) return [];

  // Extract distinct design ids
  const designIds = Array.from(
    new Set(
      products.docs
        .map((p) =>
          typeof p.design === 'object' && p.design
            ? String(p.design.id)
            : p.design
              ? String(p.design)
              : null,
        )
        .filter((id): id is string => id != null),
    ),
  );
  if (!designIds.length) return [];

  // Step 2: fetch those designs
  const designs = await payloadFetch<PayloadList<PayloadDesign>>(
    `/api/designs?where[id][in]=${encodeURIComponent(designIds.join(','))}&depth=2&limit=${designIds.length}&sort=name&where[status][equals]=published`,
    'designs',
  );
  return designs?.docs ?? [];
}

/**
 * Like fetchDesignsForCategory but joins through ALL child categories of a parent.
 * Used on parent hub pages (section ⑧).
 */
export async function fetchDesignsForParentCategory(parentSlug: string): Promise<PayloadDesign[]> {
  // Step 0: parent → its children's slugs
  const parentLookup = await payloadFetch<PayloadList<PayloadCategory>>(
    `/api/categories?where[slug][equals]=${encodeURIComponent(parentSlug)}&depth=0&limit=1`,
    'categories',
  );
  const parent = parentLookup?.docs?.[0];
  if (!parent) return [];

  const childCats = await fetchChildCategories(parent.id);
  if (!childCats.length) return [];

  const childSlugs = childCats.map((c) => c.slug);

  // Step 1: products in any child category
  const products = await payloadFetch<PayloadList<{ design?: { id: Id } | Id | null }>>(
    `/api/products?where[categories.slug][in]=${encodeURIComponent(childSlugs.join(','))}&where[status][equals]=published&depth=1&limit=500`,
    'products',
  );
  if (!products?.docs?.length) return [];

  const designIds = Array.from(
    new Set(
      products.docs
        .map((p) =>
          typeof p.design === 'object' && p.design
            ? String(p.design.id)
            : p.design
              ? String(p.design)
              : null,
        )
        .filter((id): id is string => id != null),
    ),
  );
  if (!designIds.length) return [];

  const designs = await payloadFetch<PayloadList<PayloadDesign>>(
    `/api/designs?where[id][in]=${encodeURIComponent(designIds.join(','))}&depth=2&limit=${designIds.length}&sort=name&where[status][equals]=published`,
    'designs',
  );
  return designs?.docs ?? [];
}

/**
 * Distinct designs that have ≥1 product in this category, with PRODUCT COUNTS
 * per design. Used by the filter sidebar to render "گندم (۳)".
 *
 * Reuses the step-1 data from fetchDesignsForCategory; if the caller already
 * has that result, prefer passing it in to avoid the duplicate query. The v1
 * default does the fetch from scratch — optimize as `FU-CAT-a`.
 */
export async function fetchAvailableDesigns(
  categorySlug: string,
): Promise<{ slug: string; name: string; count: number }[]> {
  const products = await payloadFetch<PayloadList<{ design?: PayloadDesign | Id | null }>>(
    `/api/products?where[categories.slug][equals]=${encodeURIComponent(categorySlug)}&where[status][equals]=published&depth=1&limit=500`,
    'products',
  );
  if (!products?.docs?.length) return [];

  const counts = new Map<string, { slug: string; name: string; count: number }>();
  for (const p of products.docs) {
    if (!p.design || typeof p.design !== 'object') continue;
    const slug = (p.design as PayloadDesign).slug;
    const name = (p.design as PayloadDesign).name;
    const prev = counts.get(slug);
    if (prev) prev.count += 1;
    else counts.set(slug, { slug, name, count: 1 });
  }
  return Array.from(counts.values()).sort((a, b) => b.count - a.count);
}

/**
 * Same shape as fetchAvailableDesigns but for materials. A product can have
 * multiple materials, so a single product contributes 1 to EACH of its
 * material counts.
 */
export async function fetchAvailableMaterials(
  categorySlug: string,
): Promise<{ slug: string; name: string; count: number }[]> {
  const products = await payloadFetch<PayloadList<{ materials?: PayloadMaterial[] | null }>>(
    `/api/products?where[categories.slug][equals]=${encodeURIComponent(categorySlug)}&where[status][equals]=published&depth=1&limit=500`,
    'products',
  );
  if (!products?.docs?.length) return [];

  const counts = new Map<string, { slug: string; name: string; count: number }>();
  for (const p of products.docs) {
    if (!p.materials?.length) continue;
    for (const m of p.materials) {
      const slug = m.slug;
      const name = m.name;
      const prev = counts.get(slug);
      if (prev) prev.count += 1;
      else counts.set(slug, { slug, name, count: 1 });
    }
  }
  return Array.from(counts.values()).sort((a, b) => b.count - a.count);
}
