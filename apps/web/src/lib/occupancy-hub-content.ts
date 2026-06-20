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
  mediaUrl,
  type PayloadDesign,
  type PayloadMedia,
} from '@/lib/payload';
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

/** First image-mime cover (skip animated sliderMedia for the static prototype). */
function staticCover(d: PayloadDesign): string | null {
  const isImg = (m?: PayloadMedia | null): m is PayloadMedia =>
    !!m && (!m.mimeType || m.mimeType.startsWith('image/'));
  const pick = [d.heroMedia, d.gallery?.[0], d.sliderMedia].find(isImg);
  return mediaUrl(pick ?? null);
}

export type OccupancyHubContent = {
  slug: OccHubSlug;
  hero: { title: string; tagline: string };
  heading: string;
  tiles: SimpleTile[];
  /** Cross-links to the other occupancy hubs. */
  others: StripItem[];
};

export async function getOccupancyHubContent(slug: OccHubSlug): Promise<OccupancyHubContent> {
  const meta = META[slug];
  const designs = await fetchDesignsByOccupancy(slug);

  const tiles: SimpleTile[] = designs
    .map((d) => ({ d, img: staticCover(d) }))
    .filter((x): x is { d: PayloadDesign; img: string } => x.img != null)
    .map(({ d, img }) => ({
      key: d.slug,
      name: d.name,
      img,
      href: `/bedroom-set/${slug}/${d.slug}`,
    }));

  const others: StripItem[] = OCCUPANCY_HUB_SLUGS.filter((o) => o !== slug).map((o) => ({
    key: o,
    name: META[o].short,
    eyebrow: META[o].eyebrow,
    href: `/bedroom-set/${o}`,
  }));

  return { slug, hero: { title: meta.title, tagline: meta.tagline }, heading: 'طرح‌ها', tiles, others };
}
