import { unstable_cache } from 'next/cache';
import { API_URL } from './env';
import { payloadFetch } from './payload-internal';
export { payloadFetch } from './payload-internal';

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
  /** Phase 1 (2026-05-23) — which /bedroom-set/{slug} occupancy hub pages should
   *  list this series. A series can belong to multiple (parla → all four). */
  occupancies?: ('baby' | 'teen' | 'double' | 'bunk')[] | null;
  description?: LexicalRoot | null;
  gallery?: PayloadMedia[] | null;
  featured?: boolean | null;
  basePriceRials?: number | null;
  /** Short lead sentence shown under the design name on /bedroom-set/<slug>. */
  tagline?: string | null;
  /** Per-design caption shown under the carousel room-type tabs on the /bedroom-set hub. */
  hubIntro?: string | null;
  /** Hero image for /bedroom-set/<slug>. Falls back to gallery[0] if null. */
  heroMedia?: PayloadMedia | null;
  /** Long-form editorial story with embedded media blocks. */
  storyBlocks?: LexicalRoot | null;
  /** Slider tile media on /bedroom-set (ideally a GIF). Falls back to heroMedia / gallery[0]. */
  sliderMedia?: PayloadMedia | null;
  /** Name-mark shown in the /bedroom-set carousel glass band (SP1). Card is logo-less if null. */
  logoMedia?: PayloadMedia | null;
  /** Per-room-type card variants — the carousel cross-dissolves to one when its tab is tapped (SP1). */
  occupancyMedia?: { occupancy: 'baby' | 'teen' | 'double' | 'bunk'; image?: PayloadMedia | null }[] | null;
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
  about_media?: PayloadMedia | null;
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
  // NEW fields (sub-project D):
  tagline?: string | null;
  cover?: PayloadMedia | null;
  intro?: LexicalRoot | null;
  allowed_axes?: string[] | null;
  rule?: string | null;
  // Phase 1 (2026-05-23) — facet-page auto-filter. When set, the category
  // page pre-filters its product query by this axis/value pair. Used for
  // the 5 SEO-promoted facet sub-leaves (bed/baby/convertible + 4 wardrobe
  // door-counts).
  axis_filter?: { axis: string; value: string | number } | null;
  // existing:
  parent?: PayloadCategory | string | number | null;
  seo?: PayloadSeo | null;
  updatedAt?: string;
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
  warrantyYears?: number | null;
  afterSalesYears?: number | null;
  /** Which age groups this piece serves. Drives the ?age=… filter on
   *  /bedroom-set/[design-slug]. Null/empty = unaffected by the filter.
   *  Plural name mirrors the auto-generated `products_occupancies` join table. */
  occupancies?: ('baby' | 'teen' | 'double' | 'bunk')[] | null;
  dimensions?: { width?: number; height?: number; depth?: number } | null;
  gallery?: PayloadMedia[] | null;
  inquiry_enabled?: boolean | null;
  featured?: boolean | null;
  featuredOrder?: number | null;
  relatedProductIds?: PayloadProduct[] | null;
  pairsWithProductIds?: PayloadProduct[] | null;
  variants?: PayloadProductVariant[] | null;
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

/** Per-occupancy summary used by the SetsMegaMenu hover hero.
 *  Designs + pieces counted from designs.occupancies[]; both can be 0. */
export type NavOccupancyStats = {
  designs: number;
  pieces: number;
};

export type NavMeta = {
  categories: NavCategory[];
  designs: NavDesign[];
  collections: NavCollection[];
  featuredProduct: NavFeaturedProduct | null;
  featuredDesign: NavFeaturedDesign | null;
  pieceCounts: Partial<Record<PieceTypeValue, number>>;
  /** Aggregated stats per occupancy hub (baby/teen/double/bunk). */
  occupancyCounts: Record<'baby' | 'teen' | 'double' | 'bunk', NavOccupancyStats>;
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
  occupancyCounts: Record<'baby' | 'teen' | 'double' | 'bunk', NavOccupancyStats>;
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
    occupancyCounts: bucketOccupancyCounts(designs, designCount),
  };
}

/** Count distinct designs per occupancy + sum their product counts.
 *  designs come pre-filtered to those with sliderMedia (nav-designs query). */
function bucketOccupancyCounts(
  designs: PayloadDesign[],
  designCount: Map<string, number>,
): Record<'baby' | 'teen' | 'double' | 'bunk', NavOccupancyStats> {
  const stats: Record<'baby' | 'teen' | 'double' | 'bunk', NavOccupancyStats> = {
    baby:   { designs: 0, pieces: 0 },
    teen:   { designs: 0, pieces: 0 },
    double: { designs: 0, pieces: 0 },
    bunk:   { designs: 0, pieces: 0 },
  };
  for (const d of designs) {
    const occs = d.occupancies ?? [];
    const piecesForDesign = designCount.get(d.slug) ?? 0;
    for (const occ of occs) {
      if (occ in stats) {
        stats[occ].designs += 1;
        stats[occ].pieces  += piecesForDesign;
      }
    }
  }
  return stats;
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
  /** Filter to a single occupancy / age group. Driven by /bedroom-set/[slug]?age=. */
  occupancies?: 'baby' | 'teen' | 'double' | 'bunk';
  /** Restrict to a specific set of product IDs. Used by facet-page renderer
   *  to AND the category filter with "products whose variant axes match". */
  productIds?: Array<string | number>;
};

export const PRODUCTS_PER_PAGE = 12;

export type PayloadList<T> = { docs: T[]; totalDocs?: number };
type PayloadPage<T> = {
  docs: T[];
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
};

export async function fetchHome(): Promise<PayloadHome | null> {
  return payloadFetch<PayloadHome>('/api/globals/home?depth=2', 'home');
}

export type PayloadJournalGlobal = {
  introTitle?: string | null;
  fullListHeading?: string | null;
  quoteText?: string | null;
  ctaTitle?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  ctaImage?: PayloadMedia | null;
  featuredArticle?: PayloadArticle | null;
  listArticles?: PayloadArticle[] | null;
  cardArticles?: PayloadArticle[] | null;
  categoryTabs?: PayloadJournalCategory[] | null;
};

/** /journal index config global. depth=2 populates each slot's Article + its
 *  cover/category, the categoryTabs, and the CTA image. */
export async function fetchJournal(): Promise<PayloadJournalGlobal | null> {
  return payloadFetch<PayloadJournalGlobal>('/api/globals/journal?depth=2', 'journal');
}

export type PayloadBedroomFurniture = {
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  heroTagline?: string | null;
  heroCtaLabel?: string | null;
  heroCtaHref?: string | null;
  heroMedia?: PayloadMedia | null;
  showcaseHeading?: string | null;
  showcaseBody?: string | null;
  showcaseInitial?: number | null;
  showcase?: { category?: PayloadCategory | null; archImage?: PayloadMedia | null }[] | null;
  rooms?: { name?: string | null; display?: string | null; image?: PayloadMedia | null; href?: string | null }[] | null;
};

/** /bedroom-furniture root config global. depth=2 populates each showcase
 *  card's category + archImage, each room's image, and the hero image. */
export async function fetchBedroomFurniture(): Promise<PayloadBedroomFurniture | null> {
  return payloadFetch<PayloadBedroomFurniture>('/api/globals/bedroom-furniture?depth=2', 'bedroom-furniture');
}

export type PayloadBedroomSetHeroes = {
  heroTeenMedia?: PayloadMedia | null;
  heroDoubleMedia?: PayloadMedia | null;
  heroBabyMedia?: PayloadMedia | null;
  heroBunkMedia?: PayloadMedia | null;
};

/** Per-occupancy uploaded hero images for the /bedroom-set/{occupancy} hubs
 *  (bedroom-set global). depth=2 inflates each media url. Returns nulls until
 *  the operator uploads them (and the migration is applied on the box). */
export async function fetchBedroomSetHeroes(): Promise<PayloadBedroomSetHeroes | null> {
  return payloadFetch<PayloadBedroomSetHeroes>('/api/globals/bedroom-set?depth=2', 'bedroom-set');
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
    // depth=3 so the catch-all route in /bedroom-furniture/[...slug] can
    // walk parent.parent.parent for path validation on 3-segment URLs
    // (the deepest in the canonical tree, e.g., /bed/baby/convertible).
    depth: '3',
    limit: '1',
  });
  const res = await payloadFetch<PayloadList<PayloadCategory>>(
    `/api/categories?${params.toString()}`,
    'categories',
  );
  return res?.docs[0] ?? null;
}

export function categoryPath(slug: string): string {
  return `/bedroom-furniture/${slug}`;
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
  if (query.occupancies) {
    // hasMany SELECT field — `in` semantics match "contains this value".
    params.set('where[occupancies][in]', query.occupancies);
  }
  if (query.design) {
    params.set('where[design.slug][equals]', query.design);
  }
  if (query.productIds?.length) {
    params.set('where[id][in]', query.productIds.join(','));
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
  // Variants live in a separate collection; Payload 3 doesn't auto-populate
  // reverse-relations even at depth=3. We do a second fetch and merge.
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
    `/api/product-variants?${variantParams.toString()}`,
    'product-variants',
  );
  product.variants = variantList?.docs ?? [];

  return product;
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
  // The /bedroom-set carousel only shows designs that have a slider image
  // ready. Designs without sliderMedia (and without heroMedia or gallery
  // fallback) would render as a generic SVG placeholder — operator wants
  // them hidden from the carousel until real imagery is uploaded.
  //
  // The `sliderMedia` exists filter handles 13 of 26 designs currently
  // without imagery. When the operator adds a sliderMedia image for one,
  // it appears in the carousel automatically (5-min revalidate).
  const res = await payloadFetch<PayloadList<PayloadDesign>>(
    '/api/designs?limit=100&sort=name&depth=2&where[sliderMedia][exists]=true',
    'designs',
  );
  return res?.docs ?? [];
}

/**
 * Designs that should appear on the `/bedroom-set/{occupancy}` hub.
 * `occupancy` is one of: baby, teen, double, bunk.
 * Backed by the `designs.occupancies` array field added in Phase 1
 * (migration 20260523_120000). Sorted by name.
 */
export async function fetchDesignsByOccupancy(
  occupancy: 'baby' | 'teen' | 'double' | 'bunk',
): Promise<PayloadDesign[]> {
  const params = new URLSearchParams({
    'where[occupancies][contains]': occupancy,
    limit: '100',
    sort: 'name',
    depth: '2',
  });
  const res = await payloadFetch<PayloadList<PayloadDesign>>(
    `/api/designs?${params.toString()}`,
    'designs',
  );
  return res?.docs ?? [];
}

/**
 * Returns the product IDs whose `productVariants.axes` contains a matching
 * (key, value) pair. Used to AND with a category filter on the facet pages
 * (e.g., `/bedroom-furniture/storage/wardrobe/double-door` shows wardrobes
 * that have at least one variant with axis "doors" = "2").
 *
 * Two-round-trip cost (variants → products) is fine at the 5-min revalidate
 * window; promote to a custom REST endpoint if/when traffic warrants.
 */
export async function fetchProductIdsByAxis(
  axisKey: string,
  axisValue: string | number,
): Promise<Array<string | number>> {
  const params = new URLSearchParams({
    'where[axes.key][equals]': axisKey,
    'where[axes.value][equals]': String(axisValue),
    depth: '0',
    limit: '500',
  });
  const res = await payloadFetch<PayloadList<{ product?: { id: string | number } | string | number | null }>>(
    `/api/product-variants?${params.toString()}`,
    'product-variants',
  );
  if (!res?.docs?.length) return [];
  const ids = new Set<string | number>();
  for (const v of res.docs) {
    if (v.product == null) continue;
    if (typeof v.product === 'object') ids.add(v.product.id);
    else ids.add(v.product);
  }
  return Array.from(ids);
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

export async function fetchAllCategories(): Promise<PayloadCategory[]> {
  const res = await payloadFetch<PayloadList<PayloadCategory>>(
    '/api/categories?limit=500&depth=1&sort=name',
    'all-categories',
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
  // Show designs in the mega-menu's طرح‌ها panel — same filter as the
  // /bedroom-set carousel: only designs that have a slider image ready.
  // Operator-requested 2026-05-23: hide the 13 designs without sliderMedia
  // from this surface too, so the SetsMegaMenu doesn't expose them in the
  // header dropdown. They'll surface automatically when a slider image
  // is uploaded (or `--bedroom-set-media --apply` linker is re-run).
  //
  // depth=2 ensures heroMedia / sliderMedia / gallery docs are inflated
  // with a `url` field so SetsMegaMenu can display cover images per tile.
  const res = await payloadFetch<PayloadList<PayloadDesign>>(
    '/api/designs?limit=30&sort=name&depth=2&where[sliderMedia][exists]=true',
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
  // No `select` — Payload 3 REST `select` syntax is finicky and the payload
  // at depth=1 (~1-2MB at 500 products) is small enough for a 5-min cached
  // call. Limit set above the post-xlsx-import ceiling (~220 products) with
  // headroom; switch to denormalized productCount fields if this gets heavy
  // (FU-MM-f).
  const res = await payloadFetch<PayloadList<PayloadProduct>>(
    '/api/products?limit=500&depth=1&where[status][equals]=published',
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
      occupancyCounts: counts.occupancyCounts,
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
