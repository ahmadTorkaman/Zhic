/**
 * Leaf (product-listing) content for the /bedroom-furniture/[slug] redesign —
 * Phase 2. A leaf category (e.g. study-desk, nightstand) shows a uniform grid
 * of PRODUCT cards in the hub glass-tile language, with toman prices + struck
 * sale prices (same treatment as /bedroom-set/[slug]/[slug], the series hub).
 *
 * SEEDED here for the /lab preview with REAL study-desk products + locally
 * optimized photos. The live route maps Payload products → the same shape, so
 * wiring is a 1:1 swap of `getLeafContent` (prices via `priceStrings`, like
 * series-hub-content's `priceString`).
 */
import { formatMoney } from '@zhic/money';
import type { PayloadCategory, PayloadProduct } from './payload';

export type LeafProduct = {
  key: string;
  name: string;
  img?: string;
  href: string;
  /** Display price (sale if discounted, else base); «تماس بگیرید» if no price. */
  price: string;
  /** Struck original price (sale only); null = no discount. */
  originalPrice: string | null;
};

export type LeafContent = {
  slug: string;
  hero: { title: string; subtitle?: string; tagline?: string };
  /** Result-count + grid heading, e.g. «۱۴ میز تحریر». */
  heading: string;
  products: LeafProduct[];
};

const IMG = '/bedroom-furniture-mosaic/leaf';
const fmt = (r: number) => formatMoney(r, { digits: 'fa', suffix: 'toman' });

/** base/sale rials → display strings (mirrors series-hub-content.priceString). */
function priceStrings(base: number | null, sale: number | null): {
  price: string;
  originalPrice: string | null;
} {
  if (base == null) return { price: 'تماس بگیرید', originalPrice: null };
  if (sale != null && sale < base) return { price: fmt(sale), originalPrice: fmt(base) };
  return { price: fmt(base), originalPrice: null };
}

// Real study-desk catalog (base rials from the live box). Two carry a demo sale
// (live data has no salePriceRials yet) to show the struck-price treatment.
const STUDY_DESK: Array<{ slug: string; name: string; base: number; sale?: number }> = [
  { slug: 'verna-study-desk', name: 'میز تحریر ورنا', base: 473540000 },
  { slug: 'skate-study-desk', name: 'میز تحریر اسکیت', base: 503360000 },
  { slug: 'sento-study-desk', name: 'میز تحریر سنتو', base: 701300000, sale: 596000000 },
  { slug: 'parla-study-desk', name: 'میز تحریر پارلا', base: 439820000 },
  { slug: 'mocha-study-desk', name: 'میز تحریر موکا', base: 429920000 },
  { slug: 'lukaplus-study-desk', name: 'میز تحریر لوکاپلاس', base: 377090000 },
  { slug: 'lotus-study-desk', name: 'میز تحریر لوتوس', base: 287970000 },
  { slug: 'loof-study-desk', name: 'میز تحریر لوف', base: 484400000 },
  { slug: 'jacqueline-study-desk', name: 'میز تحریر ژاکلین', base: 606560000 },
  { slug: 'iron-study-desk', name: 'میز تحریر آیرون', base: 553410000 },
  { slug: 'elizabeth-study-desk', name: 'میز تحریر الیزابت', base: 590900000 },
  { slug: 'elegance-study-desk', name: 'میز تحریر الگانس', base: 445680000 },
  { slug: 'caroline-study-desk', name: 'میز تحریر کارولین', base: 709730000, sale: 612000000 },
  { slug: 'bw-study-desk', name: 'میز تحریر بلک‌اند‌وایت', base: 481460000 },
];

const SEED: Record<string, LeafContent> = {
  'study-desk': {
    slug: 'study-desk',
    hero: {
      title: 'میز تحریر',
      subtitle: 'فضایی منظم برای کار و مطالعه',
      tagline: 'با کیفیت ساخت و چوب گردو',
    },
    heading: 'همه‌ی میز تحریرها',
    products: STUDY_DESK.map((p) => {
      const { price, originalPrice } = priceStrings(p.base, p.sale ?? null);
      return {
        key: p.slug,
        name: p.name,
        img: `${IMG}/${p.slug}.jpg`,
        href: `/products/${p.slug}`,
        price,
        originalPrice,
      };
    }),
  },
};

export async function getLeafContent(slug: string): Promise<LeafContent | null> {
  return SEED[slug] ?? null;
}

export const SEEDED_LEAF_SLUGS = Object.keys(SEED);

/** Map live Payload products → LeafProduct cards (prices via priceStrings). */
function leafProductsFromPayload(products: PayloadProduct[]): LeafProduct[] {
  return products.map((p) => {
    const { price, originalPrice } = priceStrings(
      p.basePriceRials ?? null,
      p.salePriceRials ?? null,
    );
    return {
      key: String(p.id ?? p.slug),
      name: p.name,
      img: p.gallery?.[0]?.url ?? undefined,
      href: `/products/${p.slug}`,
      price,
      originalPrice,
    };
  });
}

/** Build live LeafContent from a Payload category + its products. */
export function leafContentFromPayload(
  category: PayloadCategory,
  products: PayloadProduct[],
  totalDocs: number,
): LeafContent {
  return {
    slug: category.slug,
    hero: {
      title: category.name,
      subtitle: category.tagline ?? undefined,
      tagline: category.description ?? undefined,
    },
    heading: `${totalDocs.toLocaleString('fa-IR')} ${category.name}`,
    products: leafProductsFromPayload(products),
  };
}
