import { describe, expect, it } from 'vitest';
import { DESIGNS, FEATURED_PAGES, WRITING } from '../placeholder-data';

describe('bedroom-set placeholder data', () => {
  it('has the catalog designs in order with real occupancies', () => {
    expect(DESIGNS.map((d) => d.slug)).toEqual([
      'lotus', 'parla', 'caroline', 'iron', 'jacqueline', 'lukaplus', 'loof',
      'elegance', 'elizabeth', 'gandom', 'mocha', 'skate',
    ]);
    expect(DESIGNS[0]).toMatchObject({
      name: 'لوتوس',
      cardSrc: '/bedroom-set/lotus.webp',
      logoSrc: '/bedroom-set/lotus-logo.png',
      occupancies: ['double', 'teen'],
    });
  });

  it('gives every design at least one occupancy (drives the category tabs)', () => {
    expect(DESIGNS.every((d) => d.occupancies.length > 0)).toBe(true);
  });

  it('has the 2 featured pages with hero + 2 row tiles each', () => {
    expect(FEATURED_PAGES).toHaveLength(2);
    expect(FEATURED_PAGES[0]!.title).toBe('پرفروش‌ترین محصولات');
    expect(FEATURED_PAGES[1]!.title).toBe('جدیدترین محصولات');
    expect(FEATURED_PAGES[0]!.row).toHaveLength(2);
    expect(FEATURED_PAGES[0]!.hero.src).toBe('/bedroom-set/lotus-banner.png');
  });

  it('has the writing heading + a non-empty body', () => {
    expect(WRITING.heading).toBe('درباره‌ی این سرویس‌ها');
    expect(WRITING.body.length).toBeGreaterThan(40);
  });
});
