// Placeholder data for the bedroom-set landing (SP2). Shapes mirror the
// future Payload types so SP1 (data wiring) is a swap, not a rewrite:
//   DesignCard.cardSrc  → design.sliderMedia ?? heroMedia (.url)
//   DesignCard.logoSrc  → design.logoMedia (.url)   ← new field added in SP1
//   FeaturedTile.src    → product/collection media (.url)
//   WritingContent      → a richText field
export type DesignCard = {
  slug: string;
  name: string;
  cardSrc: string;
  logoSrc: string;
};
export type FeaturedTile = { src: string; alt: string };
export type FeaturedPage = { title: string; hero: FeaturedTile; row: FeaturedTile[] };
export type WritingContent = { heading: string; body: string };

const A = '/bedroom-set';

export const DESIGNS: DesignCard[] = [
  { slug: 'lotus', name: 'لوتوس', cardSrc: `${A}/lotus.webp`, logoSrc: `${A}/lotus-logo.png` },
  { slug: 'parla', name: 'پارلا', cardSrc: `${A}/parla.webp`, logoSrc: `${A}/parla-logo.png` },
  { slug: 'caroline', name: 'کارولین', cardSrc: `${A}/caroline.webp`, logoSrc: `${A}/caroline-logo.png` },
  { slug: 'iron', name: 'آیرون', cardSrc: `${A}/iron.webp`, logoSrc: `${A}/iron-logo.png` },
  { slug: 'jacqueline', name: 'ژاکلین', cardSrc: `${A}/jacqueline.webp`, logoSrc: `${A}/jacqueline-logo.png` },
  { slug: 'lukaplus', name: 'لوکاپلاس', cardSrc: `${A}/lukaplus.webp`, logoSrc: `${A}/lukaplus-logo.png` },
  { slug: 'loof', name: 'لوف', cardSrc: `${A}/loof.webp`, logoSrc: `${A}/loof-logo.png` },
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
