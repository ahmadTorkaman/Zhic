import { API_URL } from './env';
import { unstable_cache } from 'next/cache';

export type PayloadMedia = {
  id: string | number;
  url?: string | null;
  alt?: string | null;
  filename?: string | null;
  mimeType?: string | null;
};

export type PayloadDesign = {
  id: string | number;
  name: string;
  slug: string;
  age_group?: 'infant' | 'child' | 'teen' | 'adult' | null;
  description?: LexicalRoot | null;
  gallery?: PayloadMedia[] | null;
  featured?: boolean | null;
  basePriceRials?: number | null;
};

export type PayloadAddress = {
  province?: string | null;
  city?: string | null;
  district?: string | null;
  street?: string | null;
  plaque?: string | null;
  unit?: string | null;
  postalCode?: string | null;
  notes?: string | null;
};

export type PayloadGeo = {
  lat?: number | null;
  lng?: number | null;
};

export type ShowroomDay =
  | 'sat'
  | 'sun'
  | 'mon'
  | 'tue'
  | 'wed'
  | 'thu'
  | 'fri';

export type ShowroomHourEntry = {
  day: ShowroomDay;
  opens?: string | null;
  closes?: string | null;
  closed?: boolean | null;
};

export type ShowroomHolidayEntry = {
  name: string;
  date?: string | null;
  opens?: string | null;
  closes?: string | null;
  closed?: boolean | null;
};

export type PayloadShowroom = {
  id: string | number;
  name: string;
  slug: string;
  headline?: string | null;
  description?: LexicalRoot | null;
  cover?: PayloadMedia | null;
  gallery?: PayloadMedia[] | null;
  address?: PayloadAddress | null;
  geo?: PayloadGeo | null;
  phone?: string | null;
  email?: string | null;
  hours?: ShowroomHourEntry[] | null;
  holidayHours?: ShowroomHolidayEntry[] | null;
  appointmentOnly?: boolean | null;
  parkingNotes?: string | null;
  transitNotes?: string | null;
  featuredProductIds?: PayloadProduct[] | null;
  googleBusinessProfileUrl?: string | null;
  neshanProfileUrl?: string | null;
  mapEmbedUrl?: string | null;
  manager_name?: string | null;
  manager_phone?: string | null;
  is_central?: boolean | null;
};

export type PayloadContact = {
  title?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  body?: LexicalRoot | null;
};

export type PayloadAuthor = {
  id: string | number;
  name: string;
  slug: string;
  bio?: LexicalRoot | null;
  avatar?: PayloadMedia | null;
  role?: string | null;
  social?: {
    instagram?: string | null;
    telegram?: string | null;
    website?: string | null;
  } | null;
};

export type PayloadJournalCategory = {
  id: string | number;
  name: string;
  slug: string;
  description?: string | null;
  seo?: PayloadSeo | null;
};

/**
 * Shared SEO field group — lives on Products, Articles, Categories,
 * JournalCategories, Collections. Every field is optional; the storefront
 * falls back to primary title/excerpt/cover when a field is blank.
 */
export type PayloadSeo = {
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: PayloadMedia | null;
  canonicalUrl?: string | null;
  noindex?: boolean | null;
};

export type PayloadArticle = {
  id: string | number;
  title: string;
  slug: string;
  excerpt?: string | null;
  cover?: PayloadMedia | null;
  category?: PayloadJournalCategory | null;
  author?: PayloadAuthor | null;
  publishedAt?: string | null;
  body?: LexicalRoot | null;
  tagIds?: PayloadTag[] | null;
  relatedProducts?: PayloadProduct[] | null;
  relatedArticles?: PayloadArticle[] | null;
  readingTimeMinutes?: number | null;
  featured?: boolean | null;
  status?: 'draft' | 'published' | null;
  seo?: PayloadSeo | null;
};

export type PayloadHome = {
  hero_heading?: string | null;
  hero_subheading?: string | null;
  hero_media?: PayloadMedia | null;
  brand_statement?: LexicalRoot | null;
  featured_designs?: PayloadDesign[] | null;
  journal_teaser_heading?: string | null;
  inquiry_cta_heading?: string | null;
};

export type LexicalNode = {
  type: string;
  children?: LexicalNode[];
  text?: string;
  format?: number | string;
  tag?: string;
  url?: string;
  fields?: { url?: string; newTab?: boolean };
  [key: string]: unknown;
};

export type LexicalRoot = {
  root: LexicalNode;
};

export type PayloadCategory = {
  id: string | number;
  name: string;
  slug: string;
  description?: string | null;
  parent?: PayloadCategory | string | number | null;
  seo?: PayloadSeo | null;
};

export type PayloadTag = {
  id: string | number;
  name: string;
  slug: string;
};

export type PayloadMaterial = {
  id: string | number;
  name: string;
  slug: string;
  origin?: string | null;
  description?: LexicalRoot | null;
  careNotes?: LexicalRoot | null;
};

export type ProductAvailability =
  | 'in_stock'
  | 'made_to_order'
  | 'backorder'
  | 'discontinued';

export type ProductPieceType =
  | 'bed'
  | 'nightstand'
  | 'closet'
  | 'dresser'
  | 'mirror'
  | 'desk'
  | 'bookcase'
  | 'display_cabinet';

export type PayloadProduct = {
  id: string | number;
  name: string;
  slug: string;
  tagline?: string | null;
  shortDescription?: string | null;
  longDescription?: LexicalRoot | null;
  design?: { id: string | number; name: string; slug: string } | null;
  piece_type?: ProductPieceType | null;
  categoryIds?: PayloadCategory[] | null;
  tagIds?: PayloadTag[] | null;
  materialIds?: PayloadMaterial[] | null;
  sku?: string | null;
  basePriceRials?: number | null;
  salePriceRials?: number | null;
  availability?: ProductAvailability | null;
  leadTimeDays?: number | null;
  dimensions?: { width?: number; height?: number; depth?: number } | null;
  gallery?: PayloadMedia[] | null;
  inquiry_enabled?: boolean | null;
  featured?: boolean | null;
  featuredOrder?: number | null;
  relatedProductIds?: PayloadProduct[] | null;
  pairsWithProductIds?: PayloadProduct[] | null;
  specs?: LexicalRoot | null;
  createdAt?: string | null;
  status?: 'draft' | 'published' | null;
  publishedAt?: string | null;
  seo?: PayloadSeo | null;
};

export type PayloadCollection = {
  id: string | number;
  name: string;
  slug: string;
  description?: LexicalRoot | null;
  cover?: PayloadMedia | null;
  products?: PayloadProduct[] | null;
  featured?: boolean | null;
  seo?: PayloadSeo | null;
};

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
  /** Plain-text extract of description (≤60 chars, paragraph boundaries collapsed); null if empty. */
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

// --- Nav meta pure helpers --------------------------------------------------

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

const COLLECTION_SUBTITLE_MAX_LENGTH = 60;

export function collectionSubtitle(collection: PayloadCollection): string | null {
  const text = lexicalPlainText(collection.description ?? null);
  if (!text) return null;
  if (text.length <= COLLECTION_SUBTITLE_MAX_LENGTH) return text;
  return text.slice(0, COLLECTION_SUBTITLE_MAX_LENGTH).trimEnd() + '…';
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

export type PayloadStaticPage = {
  title?: string | null;
  body?: LexicalRoot | null;
};

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

export const PRODUCTS_PER_PAGE = 12;

type PayloadList<T> = { docs: T[]; totalDocs?: number };
type PayloadPage<T> = {
  docs: T[];
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
};

async function payloadFetch<T>(path: string, tag: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      next: { revalidate: 300, tags: [tag] },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchHome(): Promise<PayloadHome | null> {
  return payloadFetch<PayloadHome>('/api/globals/home?depth=2', 'home');
}

export async function fetchShowrooms(limit = 4): Promise<PayloadShowroom[]> {
  const list = await payloadFetch<PayloadList<PayloadShowroom>>(
    `/api/showrooms?limit=${limit}&depth=2&sort=-is_central`,
    'showrooms',
  );
  return list?.docs ?? [];
}

export async function fetchAllShowrooms(): Promise<PayloadShowroom[]> {
  const list = await payloadFetch<PayloadList<PayloadShowroom>>(
    `/api/showrooms?limit=100&depth=2&sort=-is_central`,
    'showrooms',
  );
  return list?.docs ?? [];
}

export async function fetchShowroom(
  slug: string,
): Promise<PayloadShowroom | null> {
  const params = new URLSearchParams({
    'where[slug][equals]': slug,
    depth: '3',
    limit: '1',
  });
  const res = await payloadFetch<PayloadList<PayloadShowroom>>(
    `/api/showrooms?${params.toString()}`,
    'showrooms',
  );
  return res?.docs[0] ?? null;
}

export async function fetchContact(): Promise<PayloadContact | null> {
  return payloadFetch<PayloadContact>('/api/globals/contact?depth=1', 'contact');
}

export function showroomPath(slug: string): string {
  return `/showrooms/${slug}`;
}

// --- Static / editorial pages (3.4, 4.2) ------------------------------------

export async function fetchPage(
  slug: 'privacy' | 'terms' | 'returns' | 'shipping' | 'about' | 'atelier' | 'care',
): Promise<PayloadStaticPage | null> {
  return payloadFetch<PayloadStaticPage>(`/api/globals/${slug}?depth=1`, slug);
}

export type PayloadFaqItem = {
  question: string;
  answer: LexicalRoot | null;
};

export type PayloadFaq = {
  title?: string | null;
  items?: PayloadFaqItem[] | null;
};

export async function fetchFaq(): Promise<PayloadFaq | null> {
  return payloadFetch<PayloadFaq>('/api/globals/faq?depth=1', 'faq');
}

export type PayloadEventItem = {
  title: string;
  description?: LexicalRoot | null;
  date?: string | null;
  location?: string | null;
};

export type PayloadEvents = {
  title?: string | null;
  items?: PayloadEventItem[] | null;
};

export async function fetchEvents(): Promise<PayloadEvents | null> {
  return payloadFetch<PayloadEvents>('/api/globals/events?depth=1', 'events');
}

export async function fetchCategory(
  slug: string,
): Promise<PayloadCategory | null> {
  const params = new URLSearchParams({
    'where[slug][equals]': slug,
    depth: '1',
    limit: '1',
  });
  const res = await payloadFetch<PayloadList<PayloadCategory>>(
    `/api/categories?${params.toString()}`,
    'categories',
  );
  return res?.docs[0] ?? null;
}

export function categoryPath(slug: string): string {
  return `/categories/${slug}`;
}

export async function fetchLatestArticles(limit = 3): Promise<PayloadArticle[]> {
  const list = await payloadFetch<PayloadList<PayloadArticle>>(
    `/api/articles?limit=${limit}&depth=2&sort=-publishedAt&where[status][equals]=published`,
    'articles',
  );
  return list?.docs ?? [];
}

// --- Journal (4.1) ----------------------------------------------------------

export const ARTICLES_PER_PAGE = 12;

export type ArticlesQuery = {
  category?: string;
  tag?: string;
  page?: number;
};

export async function fetchArticles(
  query: ArticlesQuery = {},
): Promise<PayloadPage<PayloadArticle>> {
  const params = new URLSearchParams();
  params.set('limit', String(ARTICLES_PER_PAGE));
  params.set('page', String(query.page ?? 1));
  params.set('depth', '2');
  params.set('sort', '-publishedAt');
  params.set('where[status][equals]', 'published');
  if (query.category) {
    params.set('where[category.slug][equals]', query.category);
  }
  if (query.tag) {
    params.set('where[tagIds.slug][in]', query.tag);
  }
  const fallback: PayloadPage<PayloadArticle> = {
    docs: [],
    totalDocs: 0,
    totalPages: 0,
    page: 1,
    limit: ARTICLES_PER_PAGE,
  };
  const result = await payloadFetch<PayloadPage<PayloadArticle>>(
    `/api/articles?${params.toString()}`,
    'articles',
  );
  return result ?? fallback;
}

export async function fetchArticle(
  slug: string,
): Promise<PayloadArticle | null> {
  const params = new URLSearchParams({
    'where[slug][equals]': slug,
    'where[status][equals]': 'published',
    depth: '3',
    limit: '1',
  });
  const res = await payloadFetch<PayloadList<PayloadArticle>>(
    `/api/articles?${params.toString()}`,
    'articles',
  );
  return res?.docs[0] ?? null;
}

export async function fetchJournalCategories(): Promise<PayloadJournalCategory[]> {
  const res = await payloadFetch<PayloadList<PayloadJournalCategory>>(
    '/api/journal-categories?limit=100&sort=name',
    'journal-categories',
  );
  return res?.docs ?? [];
}

export async function fetchJournalCategory(
  slug: string,
): Promise<PayloadJournalCategory | null> {
  const params = new URLSearchParams({
    'where[slug][equals]': slug,
    limit: '1',
  });
  const res = await payloadFetch<PayloadList<PayloadJournalCategory>>(
    `/api/journal-categories?${params.toString()}`,
    'journal-categories',
  );
  return res?.docs[0] ?? null;
}

export async function fetchTag(
  slug: string,
): Promise<PayloadTag | null> {
  const params = new URLSearchParams({
    'where[slug][equals]': slug,
    limit: '1',
  });
  const res = await payloadFetch<PayloadList<PayloadTag>>(
    `/api/tags?${params.toString()}`,
    'tags',
  );
  return res?.docs[0] ?? null;
}

export function articlePath(slug: string): string {
  return `/journal/${slug}`;
}

export function journalCategoryPath(slug: string): string {
  return `/journal/category/${slug}`;
}

export function journalTagPath(slug: string): string {
  return `/journal/tag/${slug}`;
}

export function mediaUrl(media: PayloadMedia | null | undefined): string | null {
  if (!media) return null;
  if (media.url) {
    if (media.url.startsWith('http')) return media.url;
    return `${API_URL}${media.url}`;
  }
  return null;
}

// --- Catalog (3.2) ----------------------------------------------------------

const PRICE_BAND_RANGE: Record<
  NonNullable<ProductsQuery['price']>,
  [number | null, number | null]
> = {
  lt5: [null, 50_000_000],
  '5to15': [50_000_000, 150_000_000],
  '15to30': [150_000_000, 300_000_000],
  gt30: [300_000_000, null],
};

const SORT_TO_PAYLOAD: Record<NonNullable<ProductsQuery['sort']>, string> = {
  newest: '-createdAt',
  name: 'name',
  priceAsc: 'basePriceRials',
  priceDesc: '-basePriceRials',
};

export function priceBandRange(
  band: NonNullable<ProductsQuery['price']>,
): [number | null, number | null] {
  return PRICE_BAND_RANGE[band];
}

export function sortToPayload(sort: ProductsQuery['sort']): string {
  return SORT_TO_PAYLOAD[sort ?? 'newest'];
}

export async function fetchProducts(
  query: ProductsQuery,
): Promise<PayloadPage<PayloadProduct>> {
  const params = new URLSearchParams();
  params.set('limit', String(PRODUCTS_PER_PAGE));
  params.set('page', String(query.page ?? 1));
  params.set('depth', '2');
  params.set('sort', sortToPayload(query.sort));
  params.set('where[status][equals]', 'published');
  if (query.category) {
    params.set('where[categoryIds.slug][equals]', query.category);
  }
  if (query.materials?.length) {
    for (const m of query.materials) {
      params.append('where[materialIds.slug][in]', m);
    }
  }
  if (query.price) {
    const [gte, lt] = priceBandRange(query.price);
    if (gte !== null) params.set('where[basePriceRials][greater_than_equal]', String(gte));
    if (lt !== null) params.set('where[basePriceRials][less_than]', String(lt));
  }
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
  // Size band is RSC-side post-fetch — handled by applyClientSizeBand in lib/products.
  const fallback: PayloadPage<PayloadProduct> = {
    docs: [],
    totalDocs: 0,
    totalPages: 0,
    page: 1,
    limit: PRODUCTS_PER_PAGE,
  };
  const result = await payloadFetch<PayloadPage<PayloadProduct>>(
    `/api/products?${params.toString()}`,
    'products',
  );
  return result ?? fallback;
}

export async function fetchProduct(
  slug: string,
): Promise<PayloadProduct | null> {
  const params = new URLSearchParams({
    'where[slug][equals]': slug,
    'where[status][equals]': 'published',
    depth: '3',
    limit: '1',
  });
  const res = await payloadFetch<PayloadList<PayloadProduct>>(
    `/api/products?${params.toString()}`,
    'products',
  );
  return res?.docs[0] ?? null;
}

export async function fetchCollection(
  slug: string,
): Promise<PayloadCollection | null> {
  const params = new URLSearchParams({
    'where[slug][equals]': slug,
    depth: '2',
    limit: '1',
  });
  const res = await payloadFetch<PayloadList<PayloadCollection>>(
    `/api/collections?${params.toString()}`,
    'collections',
  );
  return res?.docs[0] ?? null;
}

export async function fetchCategories(): Promise<PayloadCategory[]> {
  const res = await payloadFetch<PayloadList<PayloadCategory>>(
    '/api/categories?limit=100&sort=name',
    'categories',
  );
  return res?.docs ?? [];
}

export async function fetchMaterials(): Promise<PayloadMaterial[]> {
  const res = await payloadFetch<PayloadList<PayloadMaterial>>(
    '/api/materials?limit=100&sort=name',
    'materials',
  );
  return res?.docs ?? [];
}

// --- fetchNavMeta sub-fetchers (§3.3) ----------------------------------------

async function fetchNavCategories(): Promise<PayloadCategory[]> {
  const res = await payloadFetch<PayloadList<PayloadCategory>>(
    '/api/categories?limit=50&sort=name',
    'nav-categories',
  );
  if (!res) console.error('[fetchNavMeta] nav-categories: payloadFetch returned null');
  return res?.docs ?? [];
}

async function fetchNavDesigns(): Promise<PayloadDesign[]> {
  const featured = await payloadFetch<PayloadList<PayloadDesign>>(
    '/api/designs?limit=20&where[featured][equals]=true&sort=name',
    'nav-designs',
  );
  // NOTE: if no featured designs exist, this falls back to a second sequential call.
  // In Package 1 with a sparse catalog this may be the common path. If measured p99
  // latency becomes a concern, flip to default-all-and-filter-client-side.
  if (featured?.docs?.length) return featured.docs;
  // Fallback: an empty featured set is worse than showing all designs in the menu.
  const all = await payloadFetch<PayloadList<PayloadDesign>>(
    '/api/designs?limit=20&sort=name',
    'nav-designs',
  );
  if (!all) console.error('[fetchNavMeta] nav-designs: payloadFetch returned null (fallback)');
  return all?.docs ?? [];
}

async function fetchNavCollections(): Promise<PayloadCollection[]> {
  const res = await payloadFetch<PayloadList<PayloadCollection>>(
    '/api/collections?limit=20&where[featured][equals]=true&sort=name&depth=0',
    'nav-collections',
  );
  if (!res) console.error('[fetchNavMeta] nav-collections: payloadFetch returned null');
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
  if (!res) console.error('[fetchNavMeta] nav-products: payloadFetch returned null');
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
  if (!res) console.error('[fetchNavMeta] nav-featured-product: payloadFetch returned null');
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

export const fetchNavMeta = unstable_cache(
  async (): Promise<NavMeta> => {
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
  },
  ['nav-meta'],
  { revalidate: 300, tags: ['nav', 'nav-categories', 'nav-designs', 'nav-collections', 'nav-products-featured'] },
);

export function productPath(slug: string): string {
  return `/products/${slug}`;
}

export function collectionPath(slug: string): string {
  return `/collections/${slug}`;
}

export function inquiryHref(product: Pick<PayloadProduct, 'slug'>): string {
  return `/contact?product=${encodeURIComponent(product.slug)}&reason=quote`;
}
