import {
  fetchAllDesigns,
  mediaUrl,
  payloadFetch,
  type PayloadDesign,
  type PayloadProduct,
} from '@/lib/payload';
import {
  OCCUPANCY_ORDER,
  type DesignCard,
  type FeaturedPage,
  type FeaturedTile,
  type Occupancy,
  type WritingContent,
} from './placeholder-data';

// Map a Payload design → the carousel's DesignCard. Base card = the design's
// first room-type poster (occupancyMedia, in OCCUPANCY_ORDER) — the whole-set
// media (sliderMedia) belongs to the /bedroom-set/<design> page, not the
// carousel — falling back to sliderMedia ?? heroMedia ?? gallery[0] for
// designs without card art yet. Logo = logoMedia (optional → logo-less card).
function toCard(d: PayloadDesign): DesignCard | null {
  const cardByOccupancy: Partial<Record<Occupancy, string>> = {};
  for (const om of d.occupancyMedia ?? []) {
    const url = mediaUrl(om?.image);
    if (om?.occupancy && url) cardByOccupancy[om.occupancy] = url;
  }

  const firstPoster = OCCUPANCY_ORDER.map((o) => cardByOccupancy[o]).find(Boolean);
  const cardSrc =
    firstPoster ?? mediaUrl(d.sliderMedia) ?? mediaUrl(d.heroMedia) ?? mediaUrl(d.gallery?.[0]);
  if (!cardSrc) return null;

  return {
    slug: d.slug,
    name: d.name,
    cardSrc,
    logoSrc: mediaUrl(d.logoMedia) ?? undefined,
    occupancies: (d.occupancies ?? []) as Occupancy[],
    cardByOccupancy: Object.keys(cardByOccupancy).length ? cardByOccupancy : undefined,
  };
}

/** All designs that have a card image → DesignCard[], name-marked designs first. */
export async function fetchBedroomSetDesigns(): Promise<DesignCard[]> {
  const cards = (await fetchAllDesigns())
    .map(toCard)
    .filter((c): c is DesignCard => c !== null);
  return cards.sort(
    (a, b) => Number(Boolean(b.logoSrc)) - Number(Boolean(a.logoSrc)) || a.name.localeCompare(b.name, 'fa'),
  );
}

// Map a list of products → one featured overlay page (hero + up to two row tiles).
function toPage(title: string, products: PayloadProduct[]): FeaturedPage | null {
  const tiles: FeaturedTile[] = [];
  for (const p of products) {
    const src = mediaUrl(p.gallery?.[0]);
    if (src) tiles.push({ src, alt: p.gallery?.[0]?.alt ?? p.name, href: `/products/${p.slug}` });
  }
  if (tiles.length === 0) return null;
  const [hero, ...row] = tiles;
  return { title, hero: hero!, row: row.slice(0, 2) };
}

/** Best-sellers (Products.featured, by featuredOrder) + newest (-createdAt) → the overlay pages. */
export async function fetchBedroomSetFeatured(): Promise<FeaturedPage[]> {
  const [best, newest] = await Promise.all([
    payloadFetch<{ docs: PayloadProduct[] }>(
      '/api/products?where[featured][equals]=true&sort=featuredOrder&limit=3&depth=2',
      'bedroom-set-bestsellers',
    ),
    payloadFetch<{ docs: PayloadProduct[] }>(
      '/api/products?sort=-createdAt&limit=3&depth=2',
      'bedroom-set-newest',
    ),
  ]);
  return [
    toPage('پرفروش‌ترین محصولات', best?.docs ?? []),
    toPage('جدیدترین محصولات', newest?.docs ?? []),
  ].filter((p): p is FeaturedPage => p !== null);
}

/** The «درباره‌ی این سرویس‌ها» writing-section copy from the bedroom-set global. */
export async function fetchBedroomSetCopy(): Promise<WritingContent | null> {
  const g = await payloadFetch<{ writingHeading?: string | null; writingBody?: string | null }>(
    '/api/globals/bedroom-set?depth=0',
    'bedroom-set',
  );
  if (!g || (!g.writingHeading && !g.writingBody)) return null;
  return { heading: g.writingHeading ?? '', body: g.writingBody ?? '' };
}
