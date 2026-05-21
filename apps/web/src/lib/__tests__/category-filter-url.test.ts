import { describe, expect, it } from 'vitest';
import { buildFilterHref } from '../category-filter-url';

describe('buildFilterHref', () => {
  const base = '/categories/wall-mirror';
  it('clears all when override is null on every key', () => {
    expect(buildFilterHref(base, { design: 'gandom', sort: 'price_asc' }, { design: null, material: null, size: null, sort: null }))
      .toBe('/categories/wall-mirror');
  });
  it('sets one key, preserves others', () => {
    expect(buildFilterHref(base, { sort: 'price_asc' }, { design: 'gandom' }))
      .toBe('/categories/wall-mirror?sort=price_asc&design=gandom');
  });
  it('removes the page param on any filter change', () => {
    expect(buildFilterHref(base, { page: '3', design: 'gandom' }, { design: 'baloot' }))
      .toBe('/categories/wall-mirror?design=baloot');
  });
  it('preserves the page param when only the override is page', () => {
    expect(buildFilterHref(base, { design: 'gandom' }, { page: 2 }))
      .toBe('/categories/wall-mirror?design=gandom&page=2');
  });
  it('drops the default sort=newest', () => {
    expect(buildFilterHref(base, {}, { sort: 'newest' }))
      .toBe('/categories/wall-mirror');
  });
});
