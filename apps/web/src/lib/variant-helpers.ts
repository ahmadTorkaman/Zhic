import { toPersianDigits } from '@zhic/locale';
import type { PayloadProductVariant } from './payload';

type SelectedAxes = Record<string, string>;

/**
 * Persian display labels for known axis keys. Aligned with the xlsx-
 * import (sub-project B) Persian-names phase: matches the strings that
 * `import-catalog.mts --persian-names` writes to product_variants.label.
 * Unknown axes fall back to the raw key.
 *
 * Note: `footboard` was previously mapped to "پاتختی" (= nightstand)
 * which was a typo — corrected to "تاج" (= headboard / footboard). And
 * `size` was previously "سایز" (loanword); promoted to "اندازه" to
 * match the rest of the Persian copy.
 */
const AXIS_LABEL: Record<string, string> = {
  bunk_configuration: 'پیکربندی',
  conversion: 'تبدیل',
  door_material: 'جنس درب',
  doors: 'تعداد درب',
  drawers: 'تعداد کشو',
  finish: 'روکش',
  footboard: 'تاج',
  glass: 'شیشه',
  headboard_style: 'سبک تاج',
  pieces: 'تعداد قطعه',
  shape: 'شکل',
  size: 'اندازه',
  width: 'عرض',
};

/**
 * Persian display labels for non-numeric axis values. Keyed by
 * `<axisKey>:<value>` so the same string ('high') can map differently in
 * a different axis. Numeric values are not listed here; they're rendered
 * via toPersianDigits().
 */
const VALUE_LABEL: Record<string, string> = {
  // bunk_configuration
  'bunk_configuration:bunk_with_trundle': 'دوطبقه با کشوی پایینی',
  'bunk_configuration:full_bunk': 'دوطبقه کامل',
  'bunk_configuration:lower_bed': 'تخت پایینی',
  // conversion
  'conversion:sofa': 'نیمکت',
  'conversion:teen': 'نوجوان',
  // door_material
  'door_material:glass': 'شیشه',
  'door_material:mdf': 'ام‌دی‌اف',
  // finish
  'finish:cream': 'کرم',
  'finish:gray': 'خاکستری',
  'finish:green': 'سبز',
  'finish:two-stage': 'دومرحله‌ای',
  // footboard
  'footboard:high': 'بلند',
  'footboard:low': 'کوتاه',
  // glass (legacy boolean axis, kept for compatibility)
  'glass:true': 'شیشه‌دار',
  'glass:false': 'بدون شیشه',
  // headboard_style
  'headboard_style:new': 'جدید',
  'headboard_style:prime': 'پرایم',
  // shape
  'shape:oval': 'بیضی',
  'shape:round': 'گرد',
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
 * Build the picker's axis groups. Returns only axes that present a real
 * CHOICE — i.e., have two or more distinct values. Order follows
 * `allowedAxes` first (the canonical order from the category), then
 * appends any axis keys the variants ACTUALLY use that aren't in
 * allowedAxes.
 *
 * Why filter to ≥2 values:
 *
 *  - 166 of 285 catalog products have 0 variants (single-SKU). Picker
 *    is hidden entirely for these — no axisOptions[] entries at all.
 *
 *  - 56 catalog products have exactly 1 variant with one or more axes
 *    (e.g., `baloot-vanity` with axes=[{drawers:4}]). The product IS
 *    that single configuration — there's no choice to make. Rendering
 *    an "اندازه: ۱۴۰" chip with no siblings looks like a broken picker.
 *
 *  - For multi-variant products, an axis where every variant shares the
 *    same value (e.g., all 3 variants are finish:cream) is similarly
 *    not a choice — surface it in the spec accordion if needed, not
 *    here.
 *
 * Net result: the picker bar only shows axis groups the user can
 * actually interact with. Single-fixed-configuration products show a
 * picker bar with just price + CTA (still useful chrome).
 *
 * Tolerates drift cases:
 *  (a) Variant has an axis (e.g. `finish` derived by D4) that the
 *      category's allowed_axes didn't list. Show it anyway IF ≥2
 *      values across variants.
 *  (b) allowedAxes lists an axis (e.g. `footboard`) but no variant
 *      provides a value for it. Drop the empty group.
 *
 * Values per axis are deduped and preserve first-seen order.
 */
export function deriveAxisOptions(
  variants: PayloadProductVariant[],
  allowedAxes: string[],
): { key: string; values: string[] }[] {
  const variantKeys = new Set<string>();
  for (const v of variants) for (const a of v.axes) variantKeys.add(a.key);

  const orderedKeys: string[] = [...allowedAxes];
  for (const key of variantKeys) {
    if (!orderedKeys.includes(key)) orderedKeys.push(key);
  }

  return orderedKeys
    .map((key) => ({
      key,
      values: dedupe(
        variants.flatMap((v) =>
          v.axes.filter((a) => a.key === key).map((a) => a.value),
        ),
      ),
    }))
    .filter((group) => group.values.length >= 2);
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
  // Width-with-unit (e.g. "2m") → "۲ متر".
  if (axisKey === 'width' && /^\d+(\.\d+)?m$/.test(value)) {
    return `${toPersianDigits(value.slice(0, -1))} متر`;
  }
  return VALUE_LABEL[`${axisKey}:${value}`] ?? value;
}
