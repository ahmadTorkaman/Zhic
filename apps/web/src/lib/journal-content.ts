/**
 * Content for the /journal index redesign (Figma 227:478 "/journals").
 *
 * Fetches the `journal` global from Payload at depth=2 and maps each curated
 * Article slot into the JournalArticle shape. Falls back to SEED when the
 * global is unconfigured (no featuredArticle), so the page never breaks.
 */

import { fetchJournal, fetchJournalCategories, mediaUrl, type PayloadArticle } from '@/lib/payload';
import { formatJalaliNumeric } from '@zhic/locale';

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
  /** Page headline override; when unset, JournalIntro renders its default bicolor. */
  intro?: string;
  /** «فهرست کامل» section heading. */
  fullListHeading?: string;
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
  fullListHeading: 'فهرست کامل',
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

/** Returns the journal index content — live from Payload, or SEED as fallback. */
export async function getJournalContent(): Promise<JournalContent> {
  const g = await fetchJournal();
  if (!g || !g.featuredArticle) return SEED;

  const cats =
    g.categoryTabs && g.categoryTabs.length ? g.categoryTabs : await fetchJournalCategories();
  const tabs: JournalCategoryTab[] = [
    { key: 'all', label: 'همه', href: '/journal' },
    ...cats.map((cat) => ({ key: cat.slug, label: cat.name, href: `/journal/category/${cat.slug}` })),
  ];

  return {
    tabs,
    activeTab: 'all',
    intro: g.introTitle ?? undefined,
    featured: mapArticle(g.featuredArticle, 'featured'),
    topList: (g.listArticles ?? []).map((a, i) => mapArticle(a, `t${i}`)),
    quote: g.quoteText ?? SEED.quote,
    fullListHeading: g.fullListHeading ?? SEED.fullListHeading,
    cards: (g.cardArticles ?? []).map((a, i) => mapArticle(a, `c${i}`)),
    productCta: {
      title: g.ctaTitle ?? SEED.productCta.title,
      cta: g.ctaLabel ?? SEED.productCta.cta,
      href: g.ctaHref ?? SEED.productCta.href,
      img: mediaUrl(g.ctaImage) ?? SEED.productCta.img,
    },
  };
}

function mapArticle(a: PayloadArticle, key: string): JournalArticle {
  return {
    key,
    title: a.title,
    excerpt: a.excerpt ?? undefined,
    category: a.category?.name ?? '',
    img: mediaUrl(a.cover) ?? '',
    readingMinutes: a.readingTimeMinutes ?? 0,
    date: a.publishedAt ? formatJalaliNumeric(a.publishedAt) : undefined,
    href: `/journal/${a.slug}`,
  };
}
