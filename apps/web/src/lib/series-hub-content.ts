/**
 * Content for the /bedroom-set/[occupancy]/[series] detail page (Figma 261:90).
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
import {
  fetchDesign,
  fetchSeriesOccupancy,
  mediaUrl,
  type PayloadProduct,
  type PayloadSeriesOccupancy,
} from '@/lib/payload';
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
        // `||` not `??`: a blank («») CMS field should inherit the design's,
        // per the spec's "empty ⇒ inherit" rule (?? would treat «» as set).
        title: combo?.introTitle || design.introTitle || ageTitle || design.name,
        body: combo?.introBody || design.introBody || '',
        href: '#',
        img: introImg,
      }
    : null;

  // Story: combo override else design. `||` so a blank combo field inherits.
  const storyBody = combo?.storyBody || design.storyBody;
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
        name: s.name || design.name,
        img: mediaUrl(s.image) ?? null,
        href: s.link || '#',
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

  const subtitle = combo?.subtitle || design.tagline || (ageTitle ? `${ageTitle} ${design.name}` : null);

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
