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
  /** Short lead sentence shown under the design name on /designs/<slug>. */
  tagline?: string | null;
  /** Hero image for /designs/<slug>. Falls back to gallery[0] if null. */
  heroMedia?: PayloadMedia | null;
  /** Long-form editorial story with embedded media blocks. */
  storyBlocks?: LexicalRoot | null;
  /** Slider tile media on /designs (ideally a GIF). Falls back to heroMedia / gallery[0]. */
  sliderMedia?: PayloadMedia | null;
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

export type PayloadHomeSlide = {
  id?: string | number;
  image?: PayloadMedia | null;
  alt?: string | null;
  link?: string | null;
};

export type PayloadHome = {
  hero_heading?: string | null;
  hero_subheading?: string | null;
  hero_media?: PayloadMedia | null;
  heroSlides?: PayloadHomeSlide[] | null;
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

export type PieceTypeValue =
  | 'bed'
  | 'nightstand'
  | 'closet'
  | 'dresser'
  | 'mirror'
  | 'desk'
  | 'bookcase'
  | 'display_cabinet'
  | 'vanity'
  | 'chair'
  | 'console'
  | 'changing_table'
  | 'bracket'
  | 'sofa';

/** @deprecated Use PieceTypeValue */
export type ProductPieceType = PieceTypeValue;

export type PayloadProduct = {
  id: string | number;
  name: string;
  slug: string;
  tagline?: string | null;
  shortDescription?: string | null;
  longDescription?: LexicalRoot | null;
  design?: { id: string | number; name: string; slug: string } | null;
  piece_type?: PieceTypeValue | null;
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
  coverUrl: string | null;
};

export type NavFeaturedDesign = {
  id: string | number;
  slug: string;
  name: string;
  tagline: string | null;
  coverUrl: string | null;
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
  featuredDesign: NavFeaturedDesign | null;
  pieceCounts: Partial<Record<PieceTypeValue, number>>;
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
  products: Pick<PayloadProduct, 'categoryIds' | 'design' | 'piece_type'>[],
): {
  categories: NavCategory[];
  designs: NavDesign[];
  collections: NavCollection[];
  pieceCounts: Partial<Record<PieceTypeValue, number>>;
} {
  const categoryCount = new Map<string, number>();
  const designCount = new Map<string, number>();
  const pieceCount = new Map<string, number>();

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
    if (product.piece_type) {
      pieceCount.set(product.piece_type, (pieceCount.get(product.piece_type) ?? 0) + 1);
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
      coverUrl: d.heroMedia?.url ?? d.sliderMedia?.url ?? d.gallery?.[0]?.url ?? null,
    })),
    collections: collections.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      subtitle: collectionSubtitle(c),
      productCount: (c.products ?? []).length,
    })),
    pieceCounts: Object.fromEntries(pieceCount) as Partial<Record<PieceTypeValue, number>>,
  };
}

export type PayloadStaticPage = {
  title?: string | null;
  body?: LexicalRoot | null;
};

export type PayloadRoom = {
  id: string | number;
  name: string;
  slug: string;
  cover?: PayloadMedia | null;
  tagline?: string | null;
  longDescription?: LexicalRoot | null;
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

export type PayloadSiteConfig = {
  contactPhone?: string | null;
  contactEmail?: string | null;
  address?: LexicalRoot | null;
  hours?: string | null;
  socials?: Array<{
    platform: 'instagram' | 'telegram' | 'whatsapp' | 'aparat' | 'youtube' | 'linkedin' | 'pinterest';
    url: string;
  }> | null;
};

export async function fetchSiteConfig(): Promise<PayloadSiteConfig | null> {
  return payloadFetch<PayloadSiteConfig>('/api/globals/site-config?depth=2', 'site-config');
}

export async function fetchRoom(slug: string): Promise<PayloadRoom | null> {
  const list = await payloadFetch<PayloadList<PayloadRoom>>(
    `/api/rooms?where[slug][equals]=${encodeURIComponent(slug)}&limit=1&depth=2`,
    `room:${slug}`,
  );
  return list?.docs?.[0] ?? null;
}

export async function fetchRooms(): Promise<PayloadRoom[]> {
  const list = await payloadFetch<PayloadList<PayloadRoom>>(
    `/api/rooms?limit=10&depth=2&sort=slug`,
    'rooms',
  );
  return list?.docs ?? [];
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

export async function fetchDesign(
  slug: string,
): Promise<PayloadDesign | null> {
  const params = new URLSearchParams({
    'where[slug][equals]': slug,
    depth: '2',
    limit: '1',
  });
  const res = await payloadFetch<PayloadList<PayloadDesign>>(
    `/api/designs?${params.toString()}`,
    'design',
  );
  return res?.docs[0] ?? null;
}

export async function fetchAllDesigns(): Promise<PayloadDesign[]> {
  const res = await payloadFetch<PayloadList<PayloadDesign>>(
    '/api/designs?limit=100&sort=name&depth=2',
    'designs',
  );
  return res?.docs ?? [];
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
  // Show all designs in the mega-menu's طرح‌ها panel (sorted alphabetically).
  // The `featured` flag on designs is a soft hint for other surfaces but no
  // longer gates inclusion here — operator feedback was that filtering hid
  // the bulk of the catalog when only a couple of designs are flagged.
  // depth=2 ensures heroMedia / sliderMedia / gallery docs are inflated with a
  // `url` field so SetsMegaMenu can display cover images for each tile.
  const res = await payloadFetch<PayloadList<PayloadDesign>>(
    '/api/designs?limit=30&sort=name&depth=2',
    'nav-designs',
  );
  if (!res) console.error('[fetchNavMeta] nav-designs: payloadFetch returned null');
  return res?.docs ?? [];
}

async function fetchNavFeaturedDesign(): Promise<NavFeaturedDesign | null> {
  // Fetch the design flagged as `featured=true`, sorted by most-recently
  // published. If no design carries the featured flag, the aside is omitted.
  // PayloadDesign.featured is a boolean field confirmed in the type at line ~19.
  const res = await payloadFetch<PayloadList<PayloadDesign>>(
    '/api/designs?where[featured][equals]=true&limit=1&depth=2&sort=-updatedAt',
    'nav-featured-design',
  );
  if (!res) {
    console.error('[fetchNavMeta] nav-featured-design: payloadFetch returned null');
    return null;
  }
  const d = res.docs?.[0];
  if (!d) return null;
  return {
    id: d.id,
    slug: d.slug,
    name: d.name,
    tagline: d.tagline ?? null,
    coverUrl: d.heroMedia?.url ?? d.sliderMedia?.url ?? d.gallery?.[0]?.url ?? null,
  };
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
  Pick<PayloadProduct, 'categoryIds' | 'design' | 'piece_type'>[]
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
    piece_type: p.piece_type ?? null,
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
    const [categories, designs, collections, countingProducts, featuredProduct, featuredDesign] =
      await Promise.all([
        fetchNavCategories(),
        fetchNavDesigns(),
        fetchNavCollections(),
        fetchNavCountingProducts(),
        fetchNavFeaturedProduct(),
        fetchNavFeaturedDesign(),
      ]);

    const counts = bucketNavCounts(categories, designs, collections, countingProducts);

    return {
      categories: counts.categories,
      designs: counts.designs,
      collections: counts.collections,
      featuredProduct,
      featuredDesign,
      pieceCounts: counts.pieceCounts,
    };
  },
  ['nav-meta'],
  { revalidate: 300, tags: ['nav', 'nav-categories', 'nav-designs', 'nav-collections', 'nav-products-featured', 'nav-designs-featured'] },
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
