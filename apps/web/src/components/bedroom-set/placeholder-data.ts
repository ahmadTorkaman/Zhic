// Placeholder data for the bedroom-set landing (SP2). Shapes mirror the
// future Payload types so SP1 (data wiring) is a swap, not a rewrite:
//   DesignCard.cardSrc      → design.sliderMedia ?? heroMedia (.url)
//   DesignCard.logoSrc      → design.logoMedia (.url)   ← new field added in SP1
//   DesignCard.occupancies  → design.occupancies (baby | teen | double | bunk)
//   FeaturedTile.src        → product/collection media (.url)
//   WritingContent          → a richText field

// Room-type occupancies a design supports. The category tabs render only the
// ones the focused design contains (placeholder values here; SP1 reads them
// from Payload's Designs.occupancies).
export type Occupancy = 'baby' | 'teen' | 'double' | 'bunk';

// Canonical render order + the kashida-stretched Persian labels.
export const OCCUPANCY_ORDER: Occupancy[] = ['baby', 'teen', 'double', 'bunk'];
export const OCCUPANCY_LABELS: Record<Occupancy, string> = {
  baby: 'نـــــوزاد',
  teen: 'نـــــوجوان',
  double: 'دونـــــفره',
  bunk: 'دوطـــــبقه',
};

export type DesignCard = {
  slug: string;
  name: string;
  cardSrc: string; // the default/base card shown for the design
  logoSrc: string;
  occupancies: Occupancy[];
  // Room-type-specific cards: when a category tab is selected, the carousel
  // shows cardByOccupancy[occ] if present, else falls back to cardSrc.
  cardByOccupancy?: Partial<Record<Occupancy, string>>;
};

/** The card a design shows for the selected room-type tab (falls back to base). */
export function cardForOccupancy(d: DesignCard, occ: Occupancy | null): string {
  return (occ && d.cardByOccupancy?.[occ]) || d.cardSrc;
}
export type FeaturedTile = { src: string; alt: string };
export type FeaturedPage = { title: string; hero: FeaturedTile; row: FeaturedTile[] };
export type WritingContent = { heading: string; body: string };

const A = '/bedroom-set';

// The 7 designs with full room-scene card art + bilingual name-mark logos (the
// 2026-06-05 asset drop, converted to webp). names/slugs/occupancies are the
// real Payload values; cardByOccupancy holds the room-type card variants
// (kid/teen/double…) that the category tabs swap between. SP1 swaps this whole
// module for a fetchAllDesigns() call against Payload.
export const DESIGNS: DesignCard[] = [
  { slug: 'lotus', name: 'لوتوس', cardSrc: `${A}/lotus.webp`, logoSrc: `${A}/lotus-logo.webp`, occupancies: ['double', 'teen'] },
  {
    slug: 'parla', name: 'پارلا', cardSrc: `${A}/parla.webp`, logoSrc: `${A}/parla-logo.webp`,
    occupancies: ['baby', 'teen', 'double', 'bunk'],
    cardByOccupancy: { baby: `${A}/parla-baby.webp`, bunk: `${A}/parla-bunk.webp` },
  },
  {
    slug: 'caroline', name: 'کارولین', cardSrc: `${A}/caroline.webp`, logoSrc: `${A}/caroline-logo.webp`,
    occupancies: ['baby', 'double', 'teen'],
    cardByOccupancy: { double: `${A}/caroline-double.webp`, teen: `${A}/caroline-teen.webp` },
  },
  { slug: 'iron', name: 'آیرون', cardSrc: `${A}/iron.webp`, logoSrc: `${A}/iron-logo.webp`, occupancies: ['double', 'teen'] },
  { slug: 'jacqueline', name: 'ژاکلین', cardSrc: `${A}/jacqueline.webp`, logoSrc: `${A}/jacqueline-logo.webp`, occupancies: ['double', 'teen'] },
  {
    slug: 'lukaplus', name: 'لوکاپلاس', cardSrc: `${A}/lukaplus.webp`, logoSrc: `${A}/lukaplus-logo.webp`,
    occupancies: ['double', 'teen'],
    cardByOccupancy: { double: `${A}/lukaplus-double.webp` },
  },
  {
    slug: 'loof', name: 'لوف', cardSrc: `${A}/loof.webp`, logoSrc: `${A}/loof-logo.webp`,
    occupancies: ['baby', 'teen'],
    cardByOccupancy: { baby: `${A}/loof-baby.webp` },
  },
];

// Decorative marketing imagery — alt is '' for now (SP1 supplies real alts).
export const FEATURED_PAGES: FeaturedPage[] = [
  {
    title: 'پرفروش‌ترین محصولات',
    hero: { src: `${A}/lotus-banner.png`, alt: '' },
    row: [{ src: `${A}/rect55.webp`, alt: '' }, { src: `${A}/rect56.webp`, alt: '' }],
  },
  {
    title: 'جدیدترین محصولات',
    hero: { src: `${A}/luka-plus-banner.png`, alt: '' },
    row: [{ src: `${A}/rect51.png`, alt: '' }, { src: `${A}/rect53.webp`, alt: '' }],
  },
];

export const WRITING: WritingContent = {
  heading: 'درباره‌ی این سرویس‌ها',
  body:
    'هر سرویس خواب ژیک از چوب گردوی ایرانی و با وسواس در جزئیات ساخته می‌شود؛ ' +
    'خطوطی آرام، رنگ‌هایی که با گذر سال‌ها همراه‌تان می‌مانند، و قطعاتی که از میز ' +
    'تحریر تا کتاب‌خانه کنار هم هماهنگ‌اند. این مجموعه برای آرامشی بلندمدت طراحی ' +
    'شده — جایی که کیفیت خواب، از کیفیت فضا آغاز می‌شود.',
};
