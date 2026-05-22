import { toPersianDigits } from '@zhic/locale';
import type { PayloadProductVariant } from './payload';

type SelectedAxes = Record<string, string>;

/**
 * Persian display labels for known axis keys. Unknown axes fall back to
 * the raw key. The xlsx-import (sub-project B) must keep its `key` values
 * aligned with this map.
 */
const AXIS_LABEL: Record<string, string> = {
  size: 'سایز',
  footboard: 'پاتختی',
  doors: 'درب‌ها',
  drawers: 'کشوها',
  glass: 'شیشه',
  width: 'عرض',
  pieces: 'تعداد قطعه',
};

/**
 * Persian display labels for non-numeric axis values. Keyed by
 * `<axisKey>:<value>` so the same string ('high') can map differently in
 * a different axis. Numeric values are not listed here; they're rendered
 * via toPersianDigits().
 */
const VALUE_LABEL: Record<string, string> = {
  'footboard:high': 'بلند',
  'footboard:low': 'کوتاه',
  'glass:true': 'شیشه‌دار',
  'glass:false': 'بدون شیشه',
};

/**
 * Find the variant matching a complete axis selection. Returns null if
 * no variant matches OR if the selection has the wrong number of axes.
 */
export function resolveVariant(
  variants: PayloadProductVariant[],
  selectedAxes: SelectedAxes,
): PayloadProductVariant | null {
  const targetKeys = Object.keys(selectedAxes);
  return (
    variants.find((v) => {
      if (v.axes.length !== targetKeys.length) return false;
      return v.axes.every((a) => selectedAxes[a.key] === a.value);
    }) ?? null
  );
}

/**
 * Build the picker's axis groups. Order follows `allowedAxes` (which
 * comes from the product's category). Values are deduped from the
 * variant data and preserve their first-seen order.
 */
export function deriveAxisOptions(
  variants: PayloadProductVariant[],
  allowedAxes: string[],
): { key: string; values: string[] }[] {
  return allowedAxes.map((key) => ({
    key,
    values: dedupe(
      variants.flatMap((v) =>
        v.axes.filter((a) => a.key === key).map((a) => a.value),
      ),
    ),
  }));
}

function dedupe<T>(arr: T[]): T[] {
  const seen = new Set<T>();
  const out: T[] = [];
  for (const x of arr) {
    if (seen.has(x)) continue;
    seen.add(x);
    out.push(x);
  }
  return out;
}

/**
 * Stable sort by displayOrder ASC, breaking ties by createdAt ASC.
 * Null displayOrder is treated as 0. Returns a new array; does not
 * mutate the input.
 */
export function sortVariants(variants: PayloadProductVariant[]): PayloadProductVariant[] {
  return [...variants].sort((a, b) => {
    const aOrder = a.displayOrder ?? 0;
    const bOrder = b.displayOrder ?? 0;
    if (aOrder !== bOrder) return aOrder - bOrder;
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return aTime - bTime;
  });
}

/**
 * Compute the price in rials for a given product base + selected
 * variant. If variant is null, returns the base. priceDeltaRials null
 * is treated as 0.
 */
export function variantPriceRials(
  basePriceRials: number,
  variant: PayloadProductVariant | null,
): number {
  if (!variant) return basePriceRials;
  return basePriceRials + (variant.priceDeltaRials ?? 0);
}

/**
 * Persian label for an axis key. Falls back to the raw key.
 */
export function buildAxisLabel(key: string): string {
  return AXIS_LABEL[key] ?? key;
}

/**
 * Persian label for a value within an axis. Numeric values get
 * toPersianDigits; known string values get their VALUE_LABEL entry;
 * unknown strings fall back to themselves.
 */
export function buildValueLabel(axisKey: string, value: string): string {
  // Numeric (or numeric-string) values: render Persian digits.
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return toPersianDigits(value);
  }
  return VALUE_LABEL[`${axisKey}:${value}`] ?? value;
}
