/**
 * Content for the /journal index redesign (Figma 227:478 "/journals").
 *
 * SEEDED for now — static data + local media under /public/journal. To wire
 * Payload later, replace the body of `getJournalContent` with a CMS query
 * (fetchArticles / fetchJournalCategories) mapped to this shape; components
 * stay untouched. Types mirror PayloadArticle / PayloadJournalCategory.
 */

export type JournalCategoryTab = {
  key: string;
  label: string;
  href: string;
};

export type JournalArticle = {
  key: string;
  /** Plain title (a11y / alt). */
  title: string;
  /** Optional kashida-stretched display title (cards); falls back to title. */
  displayTitle?: string;
  excerpt?: string;
  category: string;
  img: string;
  readingMinutes: number;
  /** Jalali display string, e.g. «۱۴۰۵/۰۵/۱۰». */
  date?: string;
  href: string;
};

export type JournalContent = {
  tabs: JournalCategoryTab[];
  /** Active tab key (همه by default). */
  activeTab: string;
  featured: JournalArticle;
  /** Numbered top list (rendered 02..N; featured is #01). */
  topList: JournalArticle[];
  quote: string;
  /** Two editorial cards. */
  cards: JournalArticle[];
  productCta: { title: string; cta: string; href: string; img: string };
};

const SEED: JournalContent = {
  tabs: [
    { key: 'all', label: 'همه', href: '/journal' },
    { key: 'lifestyle', label: 'سبک زندگی', href: '/journal/category/lifestyle' },
    { key: 'buying-guide', label: 'راهنمای خرید', href: '/journal/category/buying-guide' },
    { key: 'trends', label: 'ترند ها', href: '/journal/category/trends' },
    { key: 'kids-room', label: 'اتاق کودک', href: '/journal/category/kids-room' },
  ],
  activeTab: 'all',
  featured: {
    key: 'featured',
    title: 'چگونه یک اتاق خواب آرامش‌بخش طراحی کنیم؟',
    excerpt: 'راهنمای کامل طراحی اتاق خواب که هر روز با آن انرژی بیشتری بگیرید.',
    category: 'سبک زندگی',
    img: '/journal/featured.jpg',
    readingMinutes: 5,
    date: '۱۴۰۵/۰۵/۱۰',
    href: '/journal/relaxing-bedroom',
  },
  topList: [
    { key: 't2', title: 'رنگ های ترند اتاق خواب در سال ۱۴۰۵.', category: 'سبک زندگی', img: '/journal/list-1.jpg', readingMinutes: 4, href: '/journal/bedroom-color-trends' },
    { key: 't3', title: 'راهنمای خرید میز آرایش مناسب فضای شما', category: 'راهنمای خرید', img: '/journal/list-2.jpg', readingMinutes: 10, href: '/journal/vanity-buying-guide' },
    { key: 't4', title: 'ایده های خلاقانه برای اتاق کودک دخترانه', category: 'اتاق کودک', img: '/journal/list-3.jpg', readingMinutes: 5, href: '/journal/girls-room-ideas' },
    { key: 't5', title: 'بهترین میز تحریر ها در ۱۴۰۵', category: 'ترند ها', img: '/journal/list-2.jpg', readingMinutes: 5, href: '/journal/best-desks' },
  ],
  quote: 'زیبایی زمانی ماندگار می‌شود که آرامش ایجاد کند.',
  cards: [
    { key: 'workspace', title: 'فضای کاری در خانه', displayTitle: 'فضای کاری\nدر خـــانه', excerpt: 'ایده های برای تمرکز بیشتر برای اتاق شما', category: 'سبک زندگی', img: '/journal/card-1.jpg', readingMinutes: 7, href: '/journal/home-workspace' },
    { key: 'nightstand', title: 'بهترین پا تختی', displayTitle: 'بهترین\nپا تـــختی', category: 'راهنمای خرید', img: '/journal/card-2.jpg', readingMinutes: 9, href: '/journal/best-nightstands' },
  ],
  productCta: {
    title: 'ساخته شده برای ماندن',
    cta: 'مشاهده محصولات',
    href: '/bedroom-furniture',
    img: '/journal/product-cta.jpg',
  },
};

/** Returns the journal index content. Async so the Payload swap is seamless. */
export async function getJournalContent(): Promise<JournalContent> {
  return SEED;
}
