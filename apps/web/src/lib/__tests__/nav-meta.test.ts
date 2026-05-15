import { describe, expect, it } from 'vitest';
import {
  bucketNavCounts,
  designSubtitle,
  collectionSubtitle,
  type PayloadCategory,
  type PayloadDesign,
  type PayloadCollection,
  type PayloadProduct,
} from '../payload';

const cat = (id: number, slug: string): PayloadCategory => ({ id, name: slug, slug });
const design = (id: number, slug: string, age?: PayloadDesign['age_group']): PayloadDesign => ({
  id,
  name: slug,
  slug,
  age_group: age ?? null,
});
const coll = (id: number, slug: string, productCount = 0): PayloadCollection => ({
  id,
  name: slug,
  slug,
  products: Array.from({ length: productCount }, (_, i) => ({
    id: 100 + i,
    name: `p${i}`,
    slug: `p-${i}`,
  })) as PayloadProduct[],
});
const product = (overrides: Partial<PayloadProduct>): PayloadProduct => ({
  id: 0,
  name: 'x',
  slug: 'x',
  ...overrides,
});

describe('bucketNavCounts', () => {
  it('counts products per category by categoryIds membership', () => {
    const cats = [cat(1, 'beds'), cat(2, 'nightstands')];
    const products = [
      product({ id: 10, categoryIds: [cats[0]!] }),
      product({ id: 11, categoryIds: [cats[0]!, cats[1]!] }),
      product({ id: 12, categoryIds: [cats[1]!] }),
    ];
    const result = bucketNavCounts(cats, [], [], products);
    expect(result.categories.find((c) => c.slug === 'beds')?.productCount).toBe(2);
    expect(result.categories.find((c) => c.slug === 'nightstands')?.productCount).toBe(2);
  });

  it('counts products per design by single design relation', () => {
    const designs = [design(1, 'aramesh'), design(2, 'bahar')];
    const products = [
      product({ id: 10, design: { id: 1, name: 'aramesh', slug: 'aramesh' } }),
      product({ id: 11, design: { id: 1, name: 'aramesh', slug: 'aramesh' } }),
      product({ id: 12, design: { id: 2, name: 'bahar', slug: 'bahar' } }),
    ];
    const result = bucketNavCounts([], designs, [], products);
    expect(result.designs.find((d) => d.slug === 'aramesh')?.productCount).toBe(2);
    expect(result.designs.find((d) => d.slug === 'bahar')?.productCount).toBe(1);
  });

  it('reads collection productCount from products[].length directly', () => {
    const collections = [coll(1, 'spring', 5), coll(2, 'fall', 2)];
    const result = bucketNavCounts([], [], collections, []);
    expect(result.collections.find((c) => c.slug === 'spring')?.productCount).toBe(5);
    expect(result.collections.find((c) => c.slug === 'fall')?.productCount).toBe(2);
  });

  it('returns zero counts when no products match', () => {
    const cats = [cat(1, 'beds')];
    const result = bucketNavCounts(cats, [], [], []);
    expect(result.categories[0]?.productCount).toBe(0);
  });

  it('skips products with no design relation when counting designs', () => {
    const designs = [design(1, 'aramesh')];
    const products = [product({ id: 10 }), product({ id: 11, design: null })];
    const result = bucketNavCounts([], designs, [], products);
    expect(result.designs[0]?.productCount).toBe(0);
  });
});

describe('designSubtitle', () => {
  it('maps age_group values to Persian labels', () => {
    expect(designSubtitle({ age_group: 'infant' } as PayloadDesign)).toBe('نوزاد');
    expect(designSubtitle({ age_group: 'child' } as PayloadDesign)).toBe('کودک');
    expect(designSubtitle({ age_group: 'teen' } as PayloadDesign)).toBe('نوجوان');
    expect(designSubtitle({ age_group: 'adult' } as PayloadDesign)).toBe('بزرگسال');
  });

  it('returns null when age_group is unset', () => {
    expect(designSubtitle({ age_group: null } as PayloadDesign)).toBeNull();
    expect(designSubtitle({} as PayloadDesign)).toBeNull();
  });
});

describe('collectionSubtitle', () => {
  it('returns null when description is null', () => {
    expect(collectionSubtitle({ description: null } as PayloadCollection)).toBeNull();
  });

  it('extracts plain text from the first paragraph and truncates to 60 chars', () => {
    const description = {
      root: {
        type: 'root',
        version: 1,
        children: [
          {
            type: 'paragraph',
            version: 1,
            children: [{ type: 'text', text: 'مجموعه‌ای از قطعات گرم و خانگی برای فضای داخلی شما' }],
          },
        ],
      },
    } as PayloadCollection['description'];
    expect(collectionSubtitle({ description } as PayloadCollection)).toBe(
      'مجموعه‌ای از قطعات گرم و خانگی برای فضای داخلی شما',
    );
  });

  it('truncates text longer than 60 chars with an ellipsis', () => {
    const long = 'الف'.repeat(40); // 120 code units
    const description = {
      root: {
        type: 'root',
        version: 1,
        children: [
          {
            type: 'paragraph',
            version: 1,
            children: [{ type: 'text', text: long }],
          },
        ],
      },
    } as PayloadCollection['description'];
    const result = collectionSubtitle({ description } as PayloadCollection);
    expect(result?.length).toBeLessThanOrEqual(61); // 60 + 1 for ellipsis
    expect(result?.endsWith('…')).toBe(true);
  });
});
