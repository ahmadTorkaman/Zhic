import { describe, expect, it } from 'vitest';
import {
  deriveDescriptionFromIntro,
  buildCrumbs,
  countActiveFilters,
} from '../category-helpers';
import type { PayloadCategory } from '../payload';

describe('deriveDescriptionFromIntro', () => {
  it('returns null when intro is null', () => {
    expect(deriveDescriptionFromIntro(null)).toBeNull();
  });
  it('extracts plain text from the first paragraph', () => {
    const intro = {
      root: {
        type: 'root', version: 1,
        children: [
          { type: 'paragraph', version: 1, children: [{ type: 'text', text: 'سلام دنیا.' }] },
          { type: 'paragraph', version: 1, children: [{ type: 'text', text: 'پاراگراف دوم.' }] },
        ],
      },
    };
    expect(deriveDescriptionFromIntro(intro as never)).toBe('سلام دنیا.');
  });
  it('truncates at 160 chars with ellipsis', () => {
    const longText = 'الف'.repeat(200);
    const intro = {
      root: {
        type: 'root', version: 1,
        children: [{ type: 'paragraph', version: 1, children: [{ type: 'text', text: longText }] }],
      },
    };
    const out = deriveDescriptionFromIntro(intro as never);
    expect(out).not.toBeNull();
    expect(out!.length).toBeLessThanOrEqual(161);
    expect(out!.endsWith('…')).toBe(true);
  });
});

describe('buildCrumbs', () => {
  it('returns 3-item chain for parent categories', () => {
    const cat: Partial<PayloadCategory> = { name: 'آینه‌ها', slug: 'mirrors', parent: null };
    const crumbs = buildCrumbs(cat as PayloadCategory);
    expect(crumbs).toHaveLength(3);
    expect(crumbs[0]).toEqual({ label: 'خانه', href: '/' });
    expect(crumbs[1]).toEqual({ label: 'محصولات', href: '/products' });
    expect(crumbs[2]).toEqual({ label: 'آینه‌ها' });
  });
  it('returns 4-item chain for leaves', () => {
    const cat: Partial<PayloadCategory> = {
      name: 'آینه دیواری',
      slug: 'wall-mirror',
      parent: { id: 1, name: 'آینه‌ها', slug: 'mirrors' } as PayloadCategory,
    };
    const crumbs = buildCrumbs(cat as PayloadCategory);
    expect(crumbs).toHaveLength(4);
    expect(crumbs[2]).toEqual({ label: 'آینه‌ها', href: '/categories/mirrors' });
    expect(crumbs[3]).toEqual({ label: 'آینه دیواری' });
  });
});

describe('countActiveFilters', () => {
  it('returns 0 for no filter params', () => {
    expect(countActiveFilters({})).toBe(0);
    expect(countActiveFilters({ page: '2' })).toBe(0); // page is not a filter
    expect(countActiveFilters({ sort: 'newest' })).toBe(0); // default sort is not a filter
  });
  it('counts non-default sort + design + material + size', () => {
    expect(countActiveFilters({ sort: 'price_asc', design: 'gandom', material: 'walnut' })).toBe(3);
  });
});
