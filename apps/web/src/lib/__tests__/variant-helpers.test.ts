import { describe, expect, it } from 'vitest';
import {
  resolveVariant,
  deriveAxisOptions,
  sortVariants,
  variantPriceRials,
  buildAxisLabel,
  buildValueLabel,
} from '../variant-helpers';
import type { PayloadProductVariant } from '../payload';

const sample: PayloadProductVariant[] = [
  { id: 1, product: 10, sku: 'A-120-H', axes: [{ key: 'size', value: '120' }, { key: 'footboard', value: 'high' }], priceDeltaRials: 0, displayOrder: 0 },
  { id: 2, product: 10, sku: 'A-120-L', axes: [{ key: 'size', value: '120' }, { key: 'footboard', value: 'low' }], priceDeltaRials: -6000000, displayOrder: 1 },
  { id: 3, product: 10, sku: 'A-160-H', axes: [{ key: 'size', value: '160' }, { key: 'footboard', value: 'high' }], priceDeltaRials: 80000000, displayOrder: 2, availability: 'discontinued' },
];

describe('resolveVariant', () => {
  it('returns the matching variant for a complete axis selection', () => {
    expect(resolveVariant(sample, { size: '120', footboard: 'high' })?.sku).toBe('A-120-H');
  });
  it('returns null when no variant matches', () => {
    expect(resolveVariant(sample, { size: '999', footboard: 'high' })).toBeNull();
  });
  it('partial selection returns the first variant matching the selected keys', () => {
    // Updated 2026-05-23: relaxed from exact-count match to "every selected
    // key matches" — handles real-world heterogeneous variant axis sets
    // (e.g. parla-double-bed has size:140 with 1 axis + size:160+finish
    // with 2 axes).
    const out = resolveVariant(sample, { size: '120' });
    expect(out?.sku).toBe('A-120-H'); // first variant matching size:120
  });
  it('returns the first match deterministically when duplicates exist', () => {
    const dup = [...sample, { id: 99, product: 10, sku: 'DUP', axes: [{ key: 'size', value: '120' }, { key: 'footboard', value: 'high' }], priceDeltaRials: 0, displayOrder: 99 }];
    expect(resolveVariant(dup, { size: '120', footboard: 'high' })?.sku).toBe('A-120-H');
  });
});

describe('deriveAxisOptions', () => {
  it('returns axis groups in the allowedAxes order with deduped values', () => {
    const out = deriveAxisOptions(sample, ['size', 'footboard']);
    expect(out.map((a) => a.key)).toEqual(['size', 'footboard']);
    expect(out[0]!.values).toEqual(['120', '160']);
    expect(out[1]!.values).toEqual(['high', 'low']);
  });
  it('includes variant axes not in allowedAxes (appended after allowed order)', () => {
    // Updated 2026-05-23: deriveAxisOptions now UNIONS allowedAxes with the
    // axes variants actually have. This tolerates real-world data drift
    // (D4 finish heuristic adding `finish` to variants whose category's
    // allowed_axes didn't list it).
    //
    // NB: requires ≥2 distinct values per axis to pass the picker filter,
    // so this test uses 2 variants with different values per axis.
    const variants: PayloadProductVariant[] = [
      { id: 1, product: 10, sku: 'X', axes: [{ key: 'size', value: '120' }, { key: 'mystery', value: 'foo' }], displayOrder: 0 },
      { id: 2, product: 10, sku: 'Y', axes: [{ key: 'size', value: '140' }, { key: 'mystery', value: 'bar' }], displayOrder: 1 },
    ];
    const out = deriveAxisOptions(variants, ['size']);
    expect(out.map((a) => a.key)).toEqual(['size', 'mystery']);
  });
  it('falls back to variant axes when allowedAxes is empty', () => {
    // Same reason as above — variants drive the UI when category is unhelpful.
    expect(deriveAxisOptions(sample, []).map((a) => a.key)).toEqual(['size', 'footboard']);
  });
  it('drops axis groups that have zero values', () => {
    // allowedAxes lists `footboard` but no variant has a footboard axis →
    // render only the size group. Without this filter the picker would
    // show a label with no chips beneath it (broken-looking).
    const variants: PayloadProductVariant[] = [
      { id: 1, product: 10, sku: 'X', axes: [{ key: 'size', value: '140' }], displayOrder: 0 },
      { id: 2, product: 10, sku: 'Y', axes: [{ key: 'size', value: '160' }], displayOrder: 1 },
    ];
    const out = deriveAxisOptions(variants, ['size', 'footboard']);
    expect(out.map((a) => a.key)).toEqual(['size']);
  });
  it('drops axis groups with only one value (single-choice — not a real picker)', () => {
    // Catalog reality: 56 of 285 products have exactly 1 variant. Each
    // axis on that single variant shows up with one value. Without this
    // filter the picker renders "اندازه: ۱۴۰" with no siblings — looks
    // like a broken UI. Filtering ≥2 means the picker only renders axes
    // where the user actually has a choice to make.
    const variants: PayloadProductVariant[] = [
      { id: 1, product: 10, sku: 'X', axes: [{ key: 'size', value: '140' }, { key: 'finish', value: 'cream' }], displayOrder: 0 },
      { id: 2, product: 10, sku: 'Y', axes: [{ key: 'size', value: '160' }, { key: 'finish', value: 'cream' }], displayOrder: 1 },
    ];
    const out = deriveAxisOptions(variants, ['size', 'finish']);
    expect(out.map((a) => a.key)).toEqual(['size']); // finish has only 'cream' across both variants
  });
});

describe('sortVariants', () => {
  it('sorts by displayOrder ASC, then createdAt ASC', () => {
    const variants: PayloadProductVariant[] = [
      { id: 1, product: 10, sku: 'B', axes: [], displayOrder: 1, createdAt: '2026-01-02T00:00:00.000Z' },
      { id: 2, product: 10, sku: 'A', axes: [], displayOrder: 0, createdAt: '2026-01-03T00:00:00.000Z' },
      { id: 3, product: 10, sku: 'C', axes: [], displayOrder: 1, createdAt: '2026-01-01T00:00:00.000Z' },
    ];
    expect(sortVariants(variants).map((v) => v.sku)).toEqual(['A', 'C', 'B']);
  });
  it('treats null displayOrder as 0', () => {
    const variants: PayloadProductVariant[] = [
      { id: 1, product: 10, sku: 'B', axes: [], displayOrder: 1 },
      { id: 2, product: 10, sku: 'A', axes: [], displayOrder: null as never },
    ];
    expect(sortVariants(variants).map((v) => v.sku)).toEqual(['A', 'B']);
  });
});

describe('variantPriceRials', () => {
  it('adds priceDelta to product base', () => {
    expect(variantPriceRials(100000000, sample[1]!)).toBe(94000000);
  });
  it('treats null variant as base price', () => {
    expect(variantPriceRials(100000000, null)).toBe(100000000);
  });
  it('treats null priceDelta as 0', () => {
    expect(variantPriceRials(100000000, { ...sample[0], priceDeltaRials: null } as PayloadProductVariant)).toBe(100000000);
  });
});

describe('buildAxisLabel', () => {
  it('returns the Persian label for known axes', () => {
    // Updated 2026-05-23 to match the Persian-names import phase
    // (services/api/scripts/import-catalog.mts AXIS_KEY_PERSIAN).
    expect(buildAxisLabel('size')).toBe('اندازه');
    expect(buildAxisLabel('footboard')).toBe('تاج');
    expect(buildAxisLabel('doors')).toBe('تعداد درب');
    expect(buildAxisLabel('finish')).toBe('روکش');
    expect(buildAxisLabel('conversion')).toBe('تبدیل');
  });
  it('returns the raw key for unknown axes', () => {
    expect(buildAxisLabel('mystery')).toBe('mystery');
  });
});

describe('buildValueLabel', () => {
  it('returns Persian label for known string values', () => {
    expect(buildValueLabel('footboard', 'high')).toBe('بلند');
    expect(buildValueLabel('footboard', 'low')).toBe('کوتاه');
    expect(buildValueLabel('glass', 'true')).toBe('شیشه‌دار');
  });
  it('converts numeric values to Persian digits', () => {
    expect(buildValueLabel('size', '120')).toBe('۱۲۰');
    expect(buildValueLabel('drawers', '3')).toBe('۳');
  });
  it('returns the raw value for unknown axis+value combinations', () => {
    expect(buildValueLabel('mystery', 'foo')).toBe('foo');
  });
});
