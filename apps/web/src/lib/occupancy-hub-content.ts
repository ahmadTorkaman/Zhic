/**
 * Content for the /bedroom-set/[occupancy] middle hubs (teen/double/baby/bunk).
 *
 * Each hub is editable as one document in the `bedroom-set-hubs` collection
 * (fetchBedroomSetHub). This getter maps that doc onto the page's existing
 * sections — hero / intro band / design-tiles mosaic / SEO content / cross-links
 * — and falls back to the built-in `META` copy field-by-field, so an empty or
 * missing doc never breaks the page. Tile imagery still comes from each design's
 * occupancyMedia; the doc adds tile CONTROL (featured / order / hide).
 *
 * Self-contained so /lab can import it; the live route's occupancy.ts owns the
 * SEO branch + slug guards.
 */
import {
  fetchDesignsByOccupancy,
  fetchBedroomSetHeroes,
  fetchBedroomSetHub,
  mediaUrl,
  type PayloadDesign,
  type PayloadDesignRef,
  type PayloadMedia,
  type LexicalRoot,
} from '@/lib/payload';
import type { HeroContent } from '@/lib/bedroom-furniture';
import type { SimpleTile } from '@/lib/bedroom-furniture-mosaic';
import type { StripItem } from '@/components/bedroom-furniture-mosaic/MosaicStrip';

export const OCCUPANCY_HUB_SLUGS = ['teen', 'double', 'baby', 'bunk'] as const;
export type OccHubSlug = (typeof OCCUPANCY_HUB_SLUGS)[number];

/** Hero copy + cross-link short-name per occupancy — the fallback when the hub
 *  doc (or a given field) is empty. */
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

/** Normalize a relationship value (populated doc or bare id) to a string id. */
const relId = (x?: PayloadDesignRef | null): string | null =>
  x == null ? null : typeof x === 'object' ? String(x.id) : String(x);

/** The design's per-occupancy card image for THIS hub (the baby card on
 *  /bedroom-set/baby), if the artist made one. */
function occupancyCard(d: PayloadDesign, slug: OccHubSlug): PayloadMedia | null {
  const m = (d.occupancyMedia ?? []).find((o) => o.occupancy === slug)?.image;
  return isImg(m) ? m : null;
}

/** Tile cover: the per-occupancy card → else the design's generic static cover. */
function staticCover(d: PayloadDesign, slug: OccHubSlug): string | null {
  const pick = occupancyCard(d, slug) ?? [d.heroMedia, d.gallery?.[0], d.sliderMedia].find(isImg) ?? null;
  return mediaUrl(pick);
}

export type OccupancyHubContent = {
  slug: OccHubSlug;
  /** Clean occupancy word for the breadcrumb (e.g. «نوجوان»). */
  shortName: string;
  /** Full-bleed photo hero (BedroomHero shape). */
  hero: HeroContent;
  /** Intro band under the hero (CMS) — null when unset. */
  intro: { heading: string; body: string } | null;
  /** Design-tiles section heading. */
  heading: string;
  tiles: SimpleTile[];
  /** Long-form SEO content (rich text) below the tiles — null when unset. */
  contentBody: LexicalRoot | null;
  /** «گروه‌های دیگر» strip heading. */
  crossHeading: string;
  /** Cross-links to the other occupancy hubs. */
  others: StripItem[];
  othersSeeAll: { label: string; href: string };
  /** SEO meta for the page (generateMetadata) — null when no doc. */
  seo: { title?: string; description?: string; image?: string } | null;
};

/** @deprecated kept for /lab call-sites; the bedroom-set-hubs doc supersedes it. */
export type OccupancyHeroOverride = { image?: string | null; title?: string | null; tagline?: string | null };

export async function getOccupancyHubContent(
  slug: OccHubSlug,
  heroOverride?: OccupancyHeroOverride,
): Promise<OccupancyHubContent> {
  const meta = META[slug];
  const [designs, heroes, hub] = await Promise.all([
    fetchDesignsByOccupancy(slug),
    fetchBedroomSetHeroes(),
    fetchBedroomSetHub(slug),
  ]);

  // Legacy bedroom-set-global hero image (still honored as a fallback below the doc).
  const legacyHeroMedia =
    slug === 'teen'
      ? heroes?.heroTeenMedia
      : slug === 'double'
        ? heroes?.heroDoubleMedia
        : slug === 'baby'
          ? heroes?.heroBabyMedia
          : heroes?.heroBunkMedia;

  // ── Tiles (with operator control: hidden filtered, featured/order pulled up) ──
  const hiddenIds = new Set((hub?.hiddenDesigns ?? []).map(relId).filter(Boolean) as string[]);
  const priorityIds = [relId(hub?.featuredDesign ?? null), ...(hub?.tileOrder ?? []).map(relId)].filter(
    Boolean,
  ) as string[];

  // Default order (matches the prior behavior): per-occupancy-card designs, then
  // generic-cover designs, then photo-less «به‌زودی» tiles.
  const withOccCard: { id: string; tile: SimpleTile }[] = [];
  const withCover: { id: string; tile: SimpleTile }[] = [];
  const withoutCover: { id: string; tile: SimpleTile }[] = [];
  for (const d of designs) {
    if (hiddenIds.has(String(d.id))) continue;
    const img = staticCover(d, slug) ?? undefined;
    const tile: SimpleTile = {
      key: d.slug,
      name: d.name,
      href: `/bedroom-set/${slug}/${d.slug}`,
      ...(img ? { img } : { comingSoon: true }),
    };
    const entry = { id: String(d.id), tile };
    if (!img) withoutCover.push(entry);
    else if (occupancyCard(d, slug)) withOccCard.push(entry);
    else withCover.push(entry);
  }
  let ordered = [...withOccCard, ...withCover, ...withoutCover];

  // Operator override: featured + explicit order first (in that order), rest after.
  if (priorityIds.length) {
    const byId = new Map(ordered.map((e) => [e.id, e]));
    const prioritySet = new Set(priorityIds);
    const head = priorityIds.map((id) => byId.get(id)).filter(Boolean) as typeof ordered;
    const tail = ordered.filter((e) => !prioritySet.has(e.id));
    ordered = [...head, ...tail];
  }
  const tiles = ordered.map((e) => e.tile);
  const firstPhoto = ordered.find((e) => e.tile.img)?.tile.img;

  // ── Hero (doc → legacy global image → first photo tile; copy → doc → META) ──
  const hero: HeroContent = {
    title: hub?.heroTitle || heroOverride?.title || meta.title.replace(/ (\S+)$/, '\n$1'),
    subtitle: '',
    tagline: hub?.heroTagline || heroOverride?.tagline || meta.tagline,
    ctaLabel: hub?.heroCtaLabel || 'مشاهده',
    ctaHref: hub?.heroCtaHref || '#hub-designs',
    img:
      mediaUrl(hub?.heroImage ?? null) ??
      heroOverride?.image ??
      mediaUrl(legacyHeroMedia ?? null) ??
      firstPhoto,
    imgAlt: hub?.heroTitle || meta.title,
  };

  const intro =
    hub?.introHeading || hub?.introBody
      ? { heading: hub.introHeading ?? '', body: hub.introBody ?? '' }
      : null;

  const others: StripItem[] = OCCUPANCY_HUB_SLUGS.filter((o) => o !== slug).map((o) => ({
    key: o,
    name: META[o].short,
    eyebrow: META[o].eyebrow,
    href: `/bedroom-set/${o}`,
  }));

  const seo = hub
    ? {
        title: hub.seo?.metaTitle ?? undefined,
        description: hub.seo?.metaDescription ?? undefined,
        image: mediaUrl(hub.seo?.ogImage ?? null) ?? undefined,
      }
    : null;

  return {
    slug,
    shortName: meta.short,
    hero,
    intro,
    heading: hub?.designsHeading || 'طرح‌ها',
    tiles,
    contentBody: hub?.contentBody ?? null,
    crossHeading: hub?.crossLinksHeading || 'گروه‌های دیگر',
    others,
    othersSeeAll: { label: 'همه‌ی طرح‌ها', href: '/bedroom-set' },
    seo,
  };
}
