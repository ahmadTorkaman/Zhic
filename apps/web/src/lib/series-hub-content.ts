/**
 * Content for the /bedroom-set/[age]/[design] detail page (Figma 261:90).
 *
 * Every design — including `iron` (آیرون), the original pixel-exact reference —
 * is mapped live from Payload into the shared SeriesHubContent shape, so the
 * redesigned template renders identically for all designs straight from the CMS.
 * (iron's rich intro/materials/story/details were ported into its design fields
 * via scripts/seed-iron-detail-cms.py; see docs/state.md 2026-06-20.)
 *
 * Comp zones → fields: hero (261:151-154), intro card (261:196),
 * collection «قطعات سرویس» (261:203), materials (261:175), details (261:155),
 * story (261:189), featured sibling band (261:238), sibling-slug links (261:233).
 */
import { fetchDesign, fetchProducts, mediaUrl, type PayloadProduct } from '@/lib/payload';
import { formatMoney } from '@zhic/money';

export type SeriesProductCard = {
  key: string;
  /** Piece name, e.g. «تخت ۱۰۰». */
  name: string;
  img: string | null;
  /** Display price string, e.g. «قیمت : ۱۲.۱۹۰». */
  price: string;
  /** Struck original price (sale only); null = no discount. */
  originalPrice: string | null;
  href: string;
};

export type SeriesMaterial = {
  key: string;
  /** e.g. «فلز». */
  name: string;
  /** Spec sub-line, e.g. «رنگ پودری الکترواستاتیک پوشش مات». */
  sub: string;
  img: string;
};

export type SeriesDetail = {
  key: string;
  /** e.g. «سر تخت کشویی». */
  label: string;
  desc: string;
  img: string;
  /** Relative tile width weight (the comp strip uses unequal widths). */
  span: number;
};

export type SeriesSibling = {
  key: string;
  /** Top line, e.g. «سرویس خواب دونفره». */
  kicker: string;
  /** Design name, e.g. «آیرون». */
  name: string;
  img: string | null;
  href: string;
};

export type SeriesEditorialCard = {
  title: string;
  body: string;
  href: string;
  img: string;
} | null;

export type SeriesHubContent = {
  hero: { img: string | null; alt: string };
  title: { name: string; subtitle: string | null };
  intro: SeriesEditorialCard;
  collection: { heading: string; items: SeriesProductCard[] };
  materials: { heading: string; items: SeriesMaterial[] } | null;
  details: { heading: string; items: SeriesDetail[] } | null;
  story: SeriesEditorialCard;
  /** Highlighted sage cross-link band (261:238). */
  featuredSibling: SeriesSibling | null;
  /** Frame-3 sibling-slug links (261:233) — treatment finalized with operator. */
  siblings: SeriesSibling[];
};

const OCCUPANCY_TITLE: Record<string, string> = {
  baby: 'سرویس خواب نوزاد',
  teen: 'سرویس خواب نوجوان',
  double: 'سرویس خواب دونفره',
  bunk: 'سرویس خواب دوطبقه',
};

function priceString(p: PayloadProduct): { price: string; originalPrice: string | null } {
  const base = p.basePriceRials ?? null;
  const sale = p.salePriceRials ?? null;
  if (base == null) return { price: 'تماس بگیرید', originalPrice: null };
  const fmt = (r: number) => formatMoney(r, { digits: 'fa', suffix: 'toman' });
  if (sale != null && sale < base) return { price: fmt(sale), originalPrice: fmt(base) };
  return { price: fmt(base), originalPrice: null };
}

/**
 * Returns the detail-page content for a design slug, mapped from Payload into
 * the shared shape (rich intro/materials/story/details render when those CMS
 * fields are populated). Returns null when the design doesn't exist (→ notFound()).
 */
export async function getSeriesHubContent(
  slug: string,
  ageFilter?: string,
): Promise<SeriesHubContent | null> {
  const [design, productsPage] = await Promise.all([
    fetchDesign(slug),
    fetchProducts({ design: slug, page: 1 }),
  ]);
  if (!design) return null;

  const heroMedia = design.heroMedia ?? design.sliderMedia ?? design.gallery?.[0] ?? null;
  const ageTitle = ageFilter ? OCCUPANCY_TITLE[ageFilter] : undefined;

  const items: SeriesProductCard[] = productsPage.docs.map((p) => {
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

  const siblings: SeriesSibling[] = (design.occupancies ?? [])
    .filter((o) => o !== ageFilter)
    .map((o) => ({
      key: o,
      kicker: OCCUPANCY_TITLE[o] ?? 'سرویس خواب',
      name: design.name,
      img: null,
      href: `/bedroom-set/${o}/${design.slug}`,
    }));

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

  return {
    hero: { img: mediaUrl(heroMedia), alt: design.name },
    title: {
      name: design.name,
      subtitle: design.tagline ?? (ageTitle ? `${ageTitle} ${design.name}` : null),
    },
    intro,
    collection: { heading: 'قطعات سرویس', items },
    materials,
    details,
    story,
    featuredSibling: siblings[0] ?? null,
    siblings: siblings.slice(1),
  };
}
