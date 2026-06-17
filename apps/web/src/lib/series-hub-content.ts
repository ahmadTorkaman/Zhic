/**
 * Content for the /bedroom-set/[age]/[design] detail page (Figma 261:90).
 *
 * SEEDED for now — `iron` (آیرون) is the pixel-exact static seed with local
 * media under /public/bedroom-set/iron. Every OTHER design is mapped live from
 * Payload into the SAME shape, so the redesigned shared template renders for
 * all designs and wiring iron to the CMS later means editing only this getter.
 *
 * Comp zones → fields: hero (261:151-154), intro card (261:196),
 * collection «قطعات سرویس» (261:203), materials (261:175), details (261:155),
 * story (261:189), featured sibling band (261:238), sibling-slug links (261:233).
 */
import { fetchDesign, fetchProducts, mediaUrl, type PayloadProduct } from '@/lib/payload';
import { formatMoney } from '@zhic/money';

export type SeriesProductCard = {
  key: string;
  /** Piece name, e.g. «تخت ۱۰۰». */
  name: string;
  img: string | null;
  /** Display price string, e.g. «قیمت : ۱۲.۱۹۰». */
  price: string;
  /** Struck original price (sale only); null = no discount. */
  originalPrice: string | null;
  href: string;
};

export type SeriesMaterial = {
  key: string;
  /** e.g. «فلز». */
  name: string;
  /** Spec sub-line, e.g. «رنگ پودری الکترواستاتیک پوشش مات». */
  sub: string;
  img: string;
};

export type SeriesDetail = {
  key: string;
  /** e.g. «سر تخت کشویی». */
  label: string;
  desc: string;
  img: string;
  /** Relative tile width weight (the comp strip uses unequal widths). */
  span: number;
};

export type SeriesSibling = {
  key: string;
  /** Top line, e.g. «سرویس خواب دونفره». */
  kicker: string;
  /** Design name, e.g. «آیرون». */
  name: string;
  img: string | null;
  href: string;
};

export type SeriesEditorialCard = {
  title: string;
  body: string;
  href: string;
  img: string;
} | null;

export type SeriesHubContent = {
  hero: { img: string | null; alt: string };
  title: { name: string; subtitle: string | null };
  intro: SeriesEditorialCard;
  collection: { heading: string; items: SeriesProductCard[] };
  materials: { heading: string; items: SeriesMaterial[] } | null;
  details: { heading: string; items: SeriesDetail[] } | null;
  story: SeriesEditorialCard;
  /** Highlighted sage cross-link band (261:238). */
  featuredSibling: SeriesSibling | null;
  /** Frame-3 sibling-slug links (261:233) — treatment finalized with operator. */
  siblings: SeriesSibling[];
};

const IMG = '/bedroom-set/iron';

/** Iron (آیرون) — the pixel-exact seed for the comp. */
const IRON: SeriesHubContent = {
  hero: { img: `${IMG}/hero.jpg`, alt: 'اتاق خواب نوجوان با سرویس آیرون' },
  title: {
    name: 'آیرون',
    subtitle: 'برای اتاق هایی که کاربرد را انتخاب می‌کنند',
  },
  intro: {
    title: 'سرویس نوجوان و بزرگسال',
    body: 'توضیحات کوتاه سرویس خواب نوجوان آیرون',
    href: '#',
    img: `${IMG}/intro.jpg`,
  },
  collection: {
    heading: 'قطعات سرویس',
    // Stored right→left to match the comp (RTL grid: first item lands on the
    // right). Comp row = تخت۱۰۰ on the left, تخت۱۲۰ on the right.
    items: [
      { key: 'bed-120-a', name: 'تخت ۱۲۰', img: `${IMG}/bed-120-a.jpg`, price: 'قیمت : ۱۲.۱۹۰', originalPrice: 'قیمت : ۱۵.۲۵۰', href: '#' },
      { key: 'bed-100-a', name: 'تخت ۱۰۰', img: `${IMG}/bed-100-a.jpg`, price: 'قیمت : ۱۲.۱۹۰', originalPrice: 'قیمت : ۱۵.۲۵۰', href: '#' },
      { key: 'bed-120-b', name: 'تخت ۱۲۰', img: `${IMG}/bed-120-b.jpg`, price: 'قیمت : ۱۲.۱۹۰', originalPrice: 'قیمت : ۱۵.۲۵۰', href: '#' },
      { key: 'bed-100-b', name: 'تخت ۱۰۰', img: `${IMG}/bed-100-b.jpg`, price: 'قیمت : ۱۲.۱۹۰', originalPrice: 'قیمت : ۱۵.۲۵۰', href: '#' },
    ],
  },
  materials: {
    heading: 'متریال های استفاده شده',
    // Stored right→left to match the comp (RTL flex: first child sits on the right).
    items: [
      { key: 'metal', name: 'فلز', sub: 'رنگ پودری الکترواستاتیک پوشش مات', img: `${IMG}/mat-metal.jpg` },
      { key: 'mdf', name: 'MDF', sub: 'vispan ایتالیا', img: `${IMG}/mat-mdf.jpg` },
      { key: 'fabric', name: 'پارچه', sub: 'کتان مرغوب', img: `${IMG}/mat-fabric.jpg` },
    ],
  },
  details: {
    heading: 'جزئیات طراحی',
    // Right→left; `span` = the comp's unequal tile widths (R→L 83/117/75/118).
    items: [
      { key: 'headboard', label: 'سر تخت کشویی', desc: 'مکانیزم عملکرد کشویی سر تخت در هر دو سمت همراه با طبقه‌بندی', img: `${IMG}/detail-headboard.jpg`, span: 83 },
      { key: 'metal', label: 'استحکامات فلزی', desc: 'تمامی پایه‌ها و ستون‌ها قوطی فلز با اتصال جوش CO2', img: `${IMG}/detail-metal.jpg`, span: 117 },
      { key: 'pegboard', label: 'پگبورد', desc: 'پگبورد از جنس پلاستیک فشرده همراه با تمام اکسسوری‌ها', img: `${IMG}/detail-pegboard.jpg`, span: 75 },
      { key: 'personalize', label: 'فضای شخصی سازی', desc: '۳ پلتفرم ریلی با قابلیت شخصی‌سازی و تحمل وزن بالا', img: `${IMG}/detail-personalize.jpg`, span: 118 },
    ],
  },
  story: {
    title: 'داستان طراحی',
    body: 'این سرویس خواب با نگاهی به سبک صنعتی مدرن و نیازهای نسل امروز طراحی شده است؛ جایی که گرمای بافت چوب در کنار ظرافت خطوط فلزی، شخصیتی متفاوت و ماندگار خلق می‌کند. جزئیات کاربردی و فرم‌های ساده اما حساب‌شده، فضایی منظم و آرام را شکل می‌دهند',
    href: '#',
    img: `${IMG}/story.jpg`,
  },
  // Highlighted band — the SAME design in the «دونفره» occupancy (Figma 261:238).
  // Rendered last, after the other-design bands, to match the comp order.
  featuredSibling: {
    key: 'iron-double',
    kicker: 'سرویس خواب دونفره',
    name: 'آیرون',
    img: `${IMG}/featured.jpg`,
    href: '/bedroom-set/double/iron',
  },
  // Sibling-slug links (Frame 3) — OTHER نوجوان designs, each a full-width sage
  // band like 261:238 (operator decision 2026-06-17). Seeded with real teen
  // designs + their /public teen imagery; href = /bedroom-set/teen/<slug>.
  siblings: [
    { key: 'caroline', kicker: 'سرویس خواب نوجوان', name: 'کارولین', img: '/bedroom-set/caroline-teen.webp', href: '/bedroom-set/teen/caroline' },
    { key: 'loof', kicker: 'سرویس خواب نوجوان', name: 'لوف', img: '/bedroom-set/loof-teen.webp', href: '/bedroom-set/teen/loof' },
    { key: 'lukaplus', kicker: 'سرویس خواب نوجوان', name: 'لوکاپلاس', img: '/bedroom-set/lukaplus-teen.webp', href: '/bedroom-set/teen/lukaplus' },
    { key: 'parla', kicker: 'سرویس خواب نوجوان', name: 'پارلا', img: '/bedroom-set/parla-teen.webp', href: '/bedroom-set/teen/parla' },
  ],
};

/** Static seeds keyed by design slug. Only iron is built so far. */
const SEEDS: Record<string, SeriesHubContent> = { iron: IRON };

const OCCUPANCY_TITLE: Record<string, string> = {
  baby: 'سرویس خواب نوزاد',
  teen: 'سرویس خواب نوجوان',
  double: 'سرویس خواب دونفره',
  bunk: 'سرویس خواب دوطبقه',
};

function priceString(p: PayloadProduct): { price: string; originalPrice: string | null } {
  const base = p.basePriceRials ?? null;
  const sale = p.salePriceRials ?? null;
  if (base == null) return { price: 'تماس بگیرید', originalPrice: null };
  const fmt = (r: number) => formatMoney(r, { digits: 'fa', suffix: 'toman' });
  if (sale != null && sale < base) return { price: fmt(sale), originalPrice: fmt(base) };
  return { price: fmt(base), originalPrice: null };
}

/**
 * Returns the detail-page content for a design slug. Iron → exact static seed.
 * Any other slug → mapped from Payload into the same shape (rich materials/
 * details sections stay null until they get a CMS home). Returns null when the
 * design doesn't exist (→ notFound()).
 */
export async function getSeriesHubContent(
  slug: string,
  ageFilter?: string,
): Promise<SeriesHubContent | null> {
  const seed = SEEDS[slug];
  if (seed) return seed;

  const [design, productsPage] = await Promise.all([
    fetchDesign(slug),
    fetchProducts({ design: slug, page: 1 }),
  ]);
  if (!design) return null;

  const heroMedia = design.heroMedia ?? design.sliderMedia ?? design.gallery?.[0] ?? null;
  const ageTitle = ageFilter ? OCCUPANCY_TITLE[ageFilter] : undefined;

  const items: SeriesProductCard[] = productsPage.docs.map((p) => {
    const { price, originalPrice } = priceString(p);
    return {
      key: String(p.id),
      name: p.name,
      img: mediaUrl(p.gallery?.[0]) ?? null,
      price,
      originalPrice,
      href: `/products/${p.slug}`,
    };
  });

  const siblings: SeriesSibling[] = (design.occupancies ?? [])
    .filter((o) => o !== ageFilter)
    .map((o) => ({
      key: o,
      kicker: OCCUPANCY_TITLE[o] ?? 'سرویس خواب',
      name: design.name,
      img: null,
      href: `/bedroom-set/${o}/${design.slug}`,
    }));

  return {
    hero: { img: mediaUrl(heroMedia), alt: design.name },
    title: {
      name: design.name,
      subtitle: design.tagline ?? (ageTitle ? `${ageTitle} ${design.name}` : null),
    },
    intro: null,
    collection: { heading: 'قطعات سرویس', items },
    materials: null,
    details: null,
    story: null,
    featuredSibling: siblings[0] ?? null,
    siblings: siblings.slice(1),
  };
}
