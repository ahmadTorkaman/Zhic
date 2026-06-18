/**
 * Content for the /bedroom-furniture page (Figma 191:207).
 *
 * SEEDED for now — static data + local media under /public/bedroom-furniture.
 * To wire Payload later, replace only the body of `getBedroomFurnitureContent`
 * with a CMS query that returns the same shape (the components stay untouched).
 */

import { fetchBedroomFurniture, mediaUrl, categoryPath } from '@/lib/payload';

export type ShowcaseSlide = {
  key: string;
  /** Pill label (e.g. «تخت خواب»). */
  label: string;
  /** Image URL (local seed path now; Payload media URL later). */
  img: string;
  href: string;
};

export type RoomCard = {
  key: string;
  /** Plain occupancy word — used for the accessible label / alt. */
  name: string;
  /** Kashida-stretched display form (Figma); falls back to `name`. */
  display?: string;
  img: string;
  href: string;
};

export type HeroContent = {
  title?: string;
  subtitle?: string;
  tagline?: string;
  ctaLabel?: string;
  ctaHref?: string;
  img?: string;
  imgAlt?: string;
};

export type BedroomFurnitureContent = {
  showcase: ShowcaseSlide[];
  /** Slide centered on first render (the comp features تخت خواب). */
  showcaseInitial: number;
  rooms: RoomCard[];
  lorem: string;
  /** Hero copy/image override; when unset, BedroomHero renders its defaults. */
  hero?: HeroContent;
  /** Showcase section heading; when unset, CategoryShowcase uses its default. */
  showcaseHeading?: string;
};

const SEED: BedroomFurnitureContent = {
  showcase: [
    { key: 'nightstand', label: 'پا تختی', img: '/bedroom-furniture/arch-nightstand.jpg', href: '/bedroom-furniture/nightstand' },
    { key: 'bed', label: 'تخت خواب', img: '/bedroom-furniture/arch-bed.jpg', href: '/bedroom-furniture/bed' },
    { key: 'desk', label: 'میز تحریر', img: '/bedroom-furniture/arch-desk.jpg', href: '/bedroom-furniture/table' },
  ],
  showcaseInitial: 1,
  rooms: [
    { key: 'adult', name: 'بزرگسال', display: 'بزرگــســــال', img: '/bedroom-furniture/room-adult.jpg', href: '/bedroom-furniture/adult' },
    { key: 'teen', name: 'نوجوان', display: 'نـــــــوجوان', img: '/bedroom-furniture/room-teen.jpg', href: '/bedroom-furniture/teen' },
    { key: 'infant', name: 'نوزاد', display: 'نــــــــــــــوزاد', img: '/bedroom-furniture/room-infant.jpg', href: '/bedroom-furniture/infant' },
    { key: 'bunk', name: 'دو طبقه', display: 'دو طــــــبقه', img: '/bedroom-furniture/room-bunk.jpg', href: '/bedroom-furniture/bunk' },
  ],
  lorem:
    'لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ و با استفاده از طراحان گرافیک است. چاپگرها و متون بلکه روزنامه و مجله در ستون و سطرآنچنان که لازم است و برای شرایط فعلی تکنولوژی مورد نیاز و کاربردهای متنوع با هدف بهبود ابزارهای کاربردی می باشد.',
};

/**
 * Returns the page content. Fetches the bedroom-furniture global from Payload
 * and maps it to the page shape. Falls back to SEED when unconfigured.
 */
export async function getBedroomFurnitureContent(): Promise<BedroomFurnitureContent> {
  const g = await fetchBedroomFurniture();
  if (!g || !g.showcase || g.showcase.length === 0) return SEED;

  const showcase: ShowcaseSlide[] = g.showcase
    .map((s): ShowcaseSlide | null => {
      const slug = s.category?.slug;
      const img = mediaUrl(s.archImage);
      if (!slug || !img) return null;
      return { key: slug, label: s.category?.name ?? '', img, href: categoryPath(slug) };
    })
    .filter((x): x is ShowcaseSlide => x !== null);
  if (showcase.length === 0) return SEED;

  const rooms: RoomCard[] = (g.rooms ?? [])
    .map((r, i): RoomCard | null => {
      const img = mediaUrl(r.image);
      if (!img) return null;
      return { key: `r${i}`, name: r.name ?? '', display: r.display ?? undefined, img, href: r.href ?? '#' };
    })
    .filter((x): x is RoomCard => x !== null);

  // hero is built when any hero field is set; heroCtaHref is intentionally not a
  // trigger (it's only meaningful alongside a label).
  const hero: HeroContent | undefined =
    g.heroTitle || g.heroSubtitle || g.heroTagline || g.heroCtaLabel || g.heroMedia
      ? {
          title: g.heroTitle ?? undefined,
          subtitle: g.heroSubtitle ?? undefined,
          tagline: g.heroTagline ?? undefined,
          ctaLabel: g.heroCtaLabel ?? undefined,
          ctaHref: g.heroCtaHref ?? undefined,
          img: mediaUrl(g.heroMedia) ?? undefined,
          imgAlt: g.heroMedia?.alt ?? undefined,
        }
      : undefined;

  return {
    showcase,
    showcaseInitial: Math.max(0, Math.min(g.showcaseInitial ?? Math.floor(showcase.length / 2), showcase.length - 1)),
    rooms: rooms.length ? rooms : SEED.rooms,
    lorem: g.showcaseBody ?? SEED.lorem,
    hero,
    showcaseHeading: g.showcaseHeading ?? undefined,
  };
}
