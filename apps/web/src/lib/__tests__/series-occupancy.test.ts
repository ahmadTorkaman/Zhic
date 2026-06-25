import { describe, expect, it } from 'vitest';
import {
  isSeriesOccupancyDifferentiated,
  bareSeriesRedirectTarget,
  seriesOccupancySitemapEntries,
  type PayloadSeriesOccupancy,
} from '../payload';

const base = (over: Partial<PayloadSeriesOccupancy> = {}): PayloadSeriesOccupancy => ({
  id: 1,
  occupancy: 'teen',
  design: { id: 9, name: 'آیرون', slug: 'iron' },
  ...over,
});

describe('isSeriesOccupancyDifferentiated', () => {
  it('is true when at least one product is curated', () => {
    expect(isSeriesOccupancyDifferentiated(base({ products: [{ id: 1 } as never] }))).toBe(true);
  });
  it('is true when any content override is set', () => {
    expect(isSeriesOccupancyDifferentiated(base({ subtitle: 'یک خط' }))).toBe(true);
    expect(isSeriesOccupancyDifferentiated(base({ materialCallouts: [{ label: 'فلز' }] }))).toBe(true);
  });
  it('is false when nothing is curated or overridden', () => {
    expect(isSeriesOccupancyDifferentiated(base())).toBe(false);
    expect(isSeriesOccupancyDifferentiated(base({ products: [] }))).toBe(false);
  });
});

describe('bareSeriesRedirectTarget', () => {
  it('points at the first occupancy combo', () => {
    expect(bareSeriesRedirectTarget({ slug: 'iron', occupancies: ['double', 'teen'] })).toBe('/bedroom-set/double/iron');
  });
  it('falls back to the hub when the design has no occupancy', () => {
    expect(bareSeriesRedirectTarget({ slug: 'iron', occupancies: [] })).toBe('/bedroom-set');
    expect(bareSeriesRedirectTarget({ slug: 'iron' })).toBe('/bedroom-set');
  });
});

describe('seriesOccupancySitemapEntries', () => {
  it('emits only differentiated combos with a resolvable design slug', () => {
    const combos: PayloadSeriesOccupancy[] = [
      base({ id: 1, occupancy: 'teen', products: [{ id: 1 } as never] }),       // kept
      base({ id: 2, occupancy: 'double' }),                                      // dropped (not differentiated)
      base({ id: 3, occupancy: 'baby', subtitle: 'x', design: 7 as never }),     // dropped (design not inflated)
    ];
    const out = seriesOccupancySitemapEntries(combos, 'https://zhicwood.com');
    expect(out).toEqual([{ url: 'https://zhicwood.com/bedroom-set/teen/iron', priority: 0.75 }]);
  });
});
