import { describe, expect, it } from 'vitest';
import {
  applyClientSizeBand,
  buildQueryString,
  parseSearchParams,
  PRICE_BAND_LABEL,
  SIZE_BAND_LABEL,
  SORT_LABEL,
  sizeBandFromDimensions,
} from '../products';
import type { PayloadProduct } from '../payload';

const product = (overrides: Partial<PayloadProduct>): PayloadProduct => ({
  id: 1,
  name: 'x',
  slug: 'x',
  ...overrides,
});

describe('parseSearchParams', () => {
  it('returns safe defaults for an empty input', () => {
    expect(parseSearchParams({})).toEqual({
      category: undefined,
      materials: undefined,
      price: undefined,
      size: undefined,
      sort: 'newest',
      page: 1,
    });
  });

  it('reads single-string params', () => {
    const out = parseSearchParams({
      category: 'beds',
      sort: 'priceAsc',
      price: '5to15',
      size: 'medium',
      page: '3',
    });
    expect(out.category).toBe('beds');
    expect(out.sort).toBe('priceAsc');
    expect(out.price).toBe('5to15');
    expect(out.size).toBe('medium');
    expect(out.page).toBe(3);
  });

  it('reads array params (multi-material)', () => {
    expect(parseSearchParams({ material: ['walnut', 'oak'] }).materials).toEqual([
      'walnut',
      'oak',
    ]);
  });

  it('reads single-string material as a one-element array', () => {
    expect(parseSearchParams({ material: 'walnut' }).materials).toEqual(['walnut']);
  });

  it('falls back to "newest" sort for invalid values', () => {
    expect(parseSearchParams({ sort: 'bogus' }).sort).toBe('newest');
  });

  it('drops invalid price band silently', () => {
    expect(parseSearchParams({ price: 'free' }).price).toBeUndefined();
  });

  it('drops invalid size silently', () => {
    expect(parseSearchParams({ size: 'huge' }).size).toBeUndefined();
  });

  it('clamps invalid page values to 1', () => {
    expect(parseSearchParams({ page: '-2' }).page).toBe(1);
    expect(parseSearchParams({ page: 'abc' }).page).toBe(1);
    expect(parseSearchParams({ page: '0' }).page).toBe(1);
  });

  it('treats empty-string category as absent', () => {
    expect(parseSearchParams({ category: '' }).category).toBeUndefined();
  });

  it('drops empty-string material entries when array', () => {
    expect(parseSearchParams({ material: ['', 'walnut'] }).materials).toEqual([
      'walnut',
    ]);
  });
});

describe('sizeBandFromDimensions', () => {
  it('returns null when dims is absent', () => {
    expect(sizeBandFromDimensions(undefined)).toBeNull();
    expect(sizeBandFromDimensions(null)).toBeNull();
    expect(sizeBandFromDimensions({})).toBeNull();
  });

  it('classifies width below 120 as small', () => {
    expect(sizeBandFromDimensions({ width: 100 })).toBe('small');
    expect(sizeBandFromDimensions({ width: 119 })).toBe('small');
  });

  it('classifies width 120–180 (inclusive) as medium', () => {
    expect(sizeBandFromDimensions({ width: 120 })).toBe('medium');
    expect(sizeBandFromDimensions({ width: 150 })).toBe('medium');
    expect(sizeBandFromDimensions({ width: 180 })).toBe('medium');
  });

  it('classifies width above 180 as large', () => {
    expect(sizeBandFromDimensions({ width: 181 })).toBe('large');
    expect(sizeBandFromDimensions({ width: 240 })).toBe('large');
  });

  it('returns null for non-finite width', () => {
    expect(sizeBandFromDimensions({ width: NaN })).toBeNull();
    expect(sizeBandFromDimensions({ width: Infinity })).toBeNull();
  });
});

describe('applyClientSizeBand', () => {
  const products = [
    product({ id: 1, slug: 'a', dimensions: { width: 100 } }),
    product({ id: 2, slug: 'b', dimensions: { width: 150 } }),
    product({ id: 3, slug: 'c', dimensions: { width: 200 } }),
    product({ id: 4, slug: 'd' /* no dims */ }),
  ];

  it('passes through when band is undefined', () => {
    expect(applyClientSizeBand(products, undefined)).toBe(products);
  });

  it('filters to small only', () => {
    expect(applyClientSizeBand(products, 'small').map((p) => p.slug)).toEqual([
      'a',
    ]);
  });

  it('filters to medium only', () => {
    expect(applyClientSizeBand(products, 'medium').map((p) => p.slug)).toEqual([
      'b',
    ]);
  });

  it('filters to large only', () => {
    expect(applyClientSizeBand(products, 'large').map((p) => p.slug)).toEqual([
      'c',
    ]);
  });

  it('excludes products without dimensions from any band', () => {
    expect(
      applyClientSizeBand(products, 'small').find((p) => p.slug === 'd'),
    ).toBeUndefined();
  });
});

describe('label maps cover all valid values', () => {
  it('PRICE_BAND_LABEL has Persian copy for every band', () => {
    expect(PRICE_BAND_LABEL.lt5).toMatch(/تومان$/);
    expect(PRICE_BAND_LABEL['5to15']).toMatch(/تومان$/);
    expect(PRICE_BAND_LABEL['15to30']).toMatch(/تومان$/);
    expect(PRICE_BAND_LABEL.gt30).toMatch(/تومان$/);
  });

  it('SIZE_BAND_LABEL has Persian copy for every band', () => {
    expect(SIZE_BAND_LABEL.small).toBe('کوچک');
    expect(SIZE_BAND_LABEL.medium).toBe('متوسط');
    expect(SIZE_BAND_LABEL.large).toBe('بزرگ');
  });

  it('SORT_LABEL has Persian copy for every option', () => {
    expect(SORT_LABEL.newest).toBe('جدیدترین');
    expect(SORT_LABEL.name).toBeTruthy();
    expect(SORT_LABEL.priceAsc).toBeTruthy();
    expect(SORT_LABEL.priceDesc).toBeTruthy();
  });
});

describe('buildQueryString', () => {
  it('returns empty string for no params', () => {
    expect(buildQueryString({}, {})).toBe('');
  });

  it('preserves existing params and applies overrides', () => {
    const out = buildQueryString(
      { category: 'beds', sort: 'newest' },
      { page: 3 },
    );
    expect(out).toContain('category=beds');
    expect(out).toContain('sort=newest');
    expect(out).toContain('page=3');
    expect(out.startsWith('?')).toBe(true);
  });

  it('overrides existing key when supplied', () => {
    const out = buildQueryString({ sort: 'newest' }, { sort: 'priceAsc' });
    expect(out).toBe('?sort=priceAsc');
  });

  it('removes a key when override is null', () => {
    const out = buildQueryString({ page: '5', sort: 'newest' }, { page: null });
    expect(out).toContain('sort=newest');
    expect(out).not.toContain('page=');
  });

  it('handles array values from current params', () => {
    const out = buildQueryString({ material: ['walnut', 'oak'] }, {});
    expect(out).toBe('?material=walnut&material=oak');
  });

  it('handles array overrides', () => {
    const out = buildQueryString({}, { material: ['walnut', 'oak'] });
    expect(out).toBe('?material=walnut&material=oak');
  });
});
