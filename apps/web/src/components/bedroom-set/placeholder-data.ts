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
  cardSrc: string;
  logoSrc: string;
  occupancies: Occupancy[];
};
export type FeaturedTile = { src: string; alt: string };
export type FeaturedPage = { title: string; hero: FeaturedTile; row: FeaturedTile[] };
export type WritingContent = { heading: string; body: string };

const A = '/bedroom-set';

// occupancies are placeholder demo values (varied so the tabs visibly change
// as you swipe); SP1 replaces them with each design's real Payload occupancies.
export const DESIGNS: DesignCard[] = [
  { slug: 'lotus', name: 'لوتوس', cardSrc: `${A}/lotus.webp`, logoSrc: `${A}/lotus-logo.png`, occupancies: ['baby', 'teen', 'double'] },
  { slug: 'parla', name: 'پارلا', cardSrc: `${A}/parla.webp`, logoSrc: `${A}/parla-logo.png`, occupancies: ['baby', 'teen'] },
  { slug: 'caroline', name: 'کارولین', cardSrc: `${A}/caroline.webp`, logoSrc: `${A}/caroline-logo.png`, occupancies: ['teen', 'double'] },
  { slug: 'iron', name: 'آیرون', cardSrc: `${A}/iron.webp`, logoSrc: `${A}/iron-logo.png`, occupancies: ['baby', 'teen', 'double'] },
  { slug: 'jacqueline', name: 'ژاکلین', cardSrc: `${A}/jacqueline.webp`, logoSrc: `${A}/jacqueline-logo.png`, occupancies: ['double'] },
  { slug: 'lukaplus', name: 'لوکاپلاس', cardSrc: `${A}/lukaplus.webp`, logoSrc: `${A}/lukaplus-logo.png`, occupancies: ['baby', 'teen', 'double'] },
  { slug: 'loof', name: 'لوف', cardSrc: `${A}/loof.webp`, logoSrc: `${A}/loof-logo.png`, occupancies: ['baby', 'teen'] },
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
