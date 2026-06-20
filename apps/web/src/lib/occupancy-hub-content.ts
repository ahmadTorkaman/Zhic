/**
 * Content for the /bedroom-set/[occupancy] middle hubs (teen/double/baby/bunk),
 * rebuilt on the mosaic template (the same one used by /bedroom-furniture).
 *
 * Each design → a mosaic tile linking to /bedroom-set/[occupancy]/[design].
 * Covers are STATIC (heroMedia ?? gallery[0] ?? sliderMedia, image mime only) —
 * the animated sliderMedia GIFs are deferred per the prototype decision.
 * Designs with no cover are hidden (matches the nav/carousel sliderMedia filter).
 *
 * Self-contained so /lab can import it; the live route's occupancy.ts owns the
 * SEO branch + slug guards. Wire-up replaces only the route body, not these maps.
 */
import {
  fetchDesignsByOccupancy,
  fetchBedroomSetHeroes,
  mediaUrl,
  type PayloadDesign,
  type PayloadMedia,
} from '@/lib/payload';
import type { HeroContent } from '@/lib/bedroom-furniture';
import type { SimpleTile } from '@/lib/bedroom-furniture-mosaic';
import type { StripItem } from '@/components/bedroom-furniture-mosaic/MosaicStrip';

export const OCCUPANCY_HUB_SLUGS = ['teen', 'double', 'baby', 'bunk'] as const;
export type OccHubSlug = (typeof OCCUPANCY_HUB_SLUGS)[number];

/** Hero copy + cross-link short-name per occupancy (from occupancy.ts). */
const META: Record<OccHubSlug, { title: string; tagline: string; short: string; eyebrow: string }> = {
  teen: {
    title: 'سرویس خواب نوجوان',
    tagline: 'طرح‌هایی برای ۹ تا ۱۸ سال — تختی که با اتاق بزرگ می‌شود.',
    short: 'نوجوان',
    eyebrow: 'گروه سنی',
  },
  double: {
    title: 'سرویس خواب دونفره',
    tagline: 'برای اتاق مشترک — دو‌نفره‌ی استاندارد در ابعاد ۱۴۰، ۱۶۰، و ۱۸۰ سانتی‌متر.',
    short: 'دونفره',
    eyebrow: 'پیکربندی',
  },
  baby: {
    title: 'سرویس خواب نوزاد',
    tagline: 'طرح‌هایی برای نخستین اتاق — جایی برای رشد، نه برای بزرگ‌نمایی.',
    short: 'نوزاد',
    eyebrow: 'گروه سنی',
  },
  bunk: {
    title: 'سرویس خواب دوطبقه',
    tagline: 'دو کودک، یک اتاق — تخت‌های دوطبقه با حفاظ و نردبان ثابت.',
    short: 'دوطبقه',
    eyebrow: 'پیکربندی',
  },
};

const isImg = (m?: PayloadMedia | null): m is PayloadMedia =>
  !!m && (!m.mimeType || m.mimeType.startsWith('image/'));

/** The design's per-occupancy card image for THIS hub (e.g. the baby card on
 *  /bedroom-set/baby), if the artist made one. This is what keeps the baby hub
 *  showing baby imagery instead of the design's generic teen/adult scene. */
function occupancyCard(d: PayloadDesign, slug: OccHubSlug): PayloadMedia | null {
  const m = (d.occupancyMedia ?? []).find((o) => o.occupancy === slug)?.image;
  return isImg(m) ? m : null;
}

/** Tile cover: the per-occupancy card → else the design's generic static cover
 *  (heroMedia ?? gallery[0] ?? sliderMedia, image-mime only). */
function staticCover(d: PayloadDesign, slug: OccHubSlug): string | null {
  const pick = occupancyCard(d, slug) ?? [d.heroMedia, d.gallery?.[0], d.sliderMedia].find(isImg) ?? null;
  return mediaUrl(pick);
}

export type OccupancyHubContent = {
  slug: OccHubSlug;
  /** Clean occupancy word for the breadcrumb (e.g. «نوجوان»). */
  shortName: string;
  /** Full-bleed photo hero (BedroomHero shape, like /bedroom-furniture). */
  hero: HeroContent;
  heading: string;
  tiles: SimpleTile[];
  /** Cross-links to the other occupancy hubs. */
  others: StripItem[];
  othersSeeAll: { label: string; href: string };
};

/** Per-occupancy uploaded hero override (CMS) — image + optional copy.
 *  Empty until the operator populates the bedroom-set global; the hero then
 *  falls back to the featured design's cover. */
export type OccupancyHeroOverride = { image?: string | null; title?: string | null; tagline?: string | null };

export async function getOccupancyHubContent(
  slug: OccHubSlug,
  heroOverride?: OccupancyHeroOverride,
): Promise<OccupancyHubContent> {
  const meta = META[slug];
  const [designs, heroes] = await Promise.all([
    fetchDesignsByOccupancy(slug),
    fetchBedroomSetHeroes(),
  ]);

  // Operator-uploaded hero image for this occupancy (bedroom-set global), if any.
  const cmsHeroMedia =
    slug === 'teen'
      ? heroes?.heroTeenMedia
      : slug === 'double'
        ? heroes?.heroDoubleMedia
        : slug === 'baby'
          ? heroes?.heroBabyMedia
          : heroes?.heroBunkMedia;
  const cmsHeroImg = mediaUrl(cmsHeroMedia ?? null) ?? undefined;

  // Every design of the age (operator: show image-less ones too, as «به‌زودی»
  // sand tiles). Ordered: designs with a per-occupancy card first (so the
  // featured tile + hero land on age-appropriate imagery — e.g. a baby card on
  // /bedroom-set/baby, not the design's teen scene), then designs with only a
  // generic cover, then the photo-less «به‌زودی» tiles.
  const withOccCard: SimpleTile[] = [];
  const withCover: SimpleTile[] = [];
  const withoutCover: SimpleTile[] = [];
  for (const d of designs) {
    const img = staticCover(d, slug) ?? undefined;
    const tile: SimpleTile = {
      key: d.slug,
      name: d.name,
      href: `/bedroom-set/${slug}/${d.slug}`,
      ...(img ? { img } : { comingSoon: true }),
    };
    if (!img) withoutCover.push(tile);
    else if (occupancyCard(d, slug)) withOccCard.push(tile);
    else withCover.push(tile);
  }
  const tiles = [...withOccCard, ...withCover, ...withoutCover];

  const others: StripItem[] = OCCUPANCY_HUB_SLUGS.filter((o) => o !== slug).map((o) => ({
    key: o,
    name: META[o].short,
    eyebrow: META[o].eyebrow,
    href: `/bedroom-set/${o}`,
  }));

  // Hero image: operator-uploaded override → else the featured design's cover
  // (the first photo tile). 2-line title splits the last word onto its own line
  // (like the comp «مُبلمان / اتاق خواب»). No subtitle — the «گروه سنی · N طرح»
  // count line is intentionally dropped.
  const hero: HeroContent = {
    title: heroOverride?.title || meta.title.replace(/ (\S+)$/, '\n$1'),
    subtitle: '',
    tagline: heroOverride?.tagline || meta.tagline,
    ctaLabel: 'مشاهده',
    ctaHref: '#hub-designs',
    img: heroOverride?.image ?? cmsHeroImg ?? withOccCard[0]?.img ?? withCover[0]?.img,
    imgAlt: meta.title,
  };

  return {
    slug,
    shortName: meta.short,
    hero,
    heading: 'طرح‌ها',
    tiles,
    others,
    othersSeeAll: { label: 'همه‌ی طرح‌ها', href: '/bedroom-set' },
  };
}
