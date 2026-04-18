import type { PayloadProduct, ProductsQuery } from './payload';

const SORTS = ['newest', 'name', 'priceAsc', 'priceDesc'] as const;
const PRICES = ['lt5', '5to15', '15to30', 'gt30'] as const;
const SIZES = ['small', 'medium', 'large'] as const;

type Sort = (typeof SORTS)[number];
type Price = (typeof PRICES)[number];
type Size = (typeof SIZES)[number];

export type SearchParamsRecord = Record<string, string | string[] | undefined>;

function pickFirst(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function pickAll(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => !!v);
  if (typeof value === 'string' && value.length > 0) return [value];
  return [];
}

export function parseSearchParams(sp: SearchParamsRecord): ProductsQuery {
  const sortRaw = pickFirst(sp.sort);
  const priceRaw = pickFirst(sp.price);
  const sizeRaw = pickFirst(sp.size);
  const pageRaw = pickFirst(sp.page);

  const category = pickFirst(sp.category);
  const materials = pickAll(sp.material);

  const sort: Sort = (SORTS as readonly string[]).includes(sortRaw ?? '')
    ? (sortRaw as Sort)
    : 'newest';
  const price = (PRICES as readonly string[]).includes(priceRaw ?? '')
    ? (priceRaw as Price)
    : undefined;
  const size = (SIZES as readonly string[]).includes(sizeRaw ?? '')
    ? (sizeRaw as Size)
    : undefined;

  let page = 1;
  if (pageRaw) {
    const parsed = Number.parseInt(pageRaw, 10);
    if (Number.isFinite(parsed) && parsed > 0) page = parsed;
  }

  return {
    category: category && category.length > 0 ? category : undefined,
    materials: materials.length > 0 ? materials : undefined,
    price,
    size,
    sort,
    page,
  };
}

export function sizeBandFromDimensions(
  dims?: { width?: number } | null,
): Size | null {
  const w = dims?.width;
  if (typeof w !== 'number' || !Number.isFinite(w)) return null;
  if (w < 120) return 'small';
  if (w <= 180) return 'medium';
  return 'large';
}

export function applyClientSizeBand(
  products: PayloadProduct[],
  band: ProductsQuery['size'],
): PayloadProduct[] {
  if (!band) return products;
  return products.filter((p) => sizeBandFromDimensions(p.dimensions) === band);
}

export const PRICE_BAND_LABEL: Record<Price, string> = {
  lt5: 'تا ۵ میلیون تومان',
  '5to15': '۵ تا ۱۵ میلیون تومان',
  '15to30': '۱۵ تا ۳۰ میلیون تومان',
  gt30: 'بیش از ۳۰ میلیون تومان',
};

export const SIZE_BAND_LABEL: Record<Size, string> = {
  small: 'کوچک',
  medium: 'متوسط',
  large: 'بزرگ',
};

export const SORT_LABEL: Record<Sort, string> = {
  newest: 'جدیدترین',
  name: 'بر اساس نام',
  priceAsc: 'ارزان‌ترین',
  priceDesc: 'گران‌ترین',
};

export const AVAILABILITY_LABEL: Record<
  NonNullable<PayloadProduct['availability']>,
  string
> = {
  in_stock: 'موجود',
  made_to_order: 'ساخت به‌سفارش',
  backorder: 'در انتظار',
  discontinued: 'ناموجود',
};

/**
 * Build a URL search-string preserving the current query, with one or more keys
 * overridden. Used by Pagination + sort form to keep filter context across links.
 */
export function buildQueryString(
  current: SearchParamsRecord,
  overrides: Record<string, string | number | string[] | undefined | null>,
): string {
  const params = new URLSearchParams();
  // Preserve current params
  for (const [key, value] of Object.entries(current)) {
    if (key in overrides) continue;
    if (Array.isArray(value)) {
      for (const v of value) if (v) params.append(key, v);
    } else if (typeof value === 'string' && value.length > 0) {
      params.set(key, value);
    }
  }
  // Apply overrides
  for (const [key, value] of Object.entries(overrides)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const v of value) if (v) params.append(key, v);
    } else {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}
