import { describe, it, expect } from 'vitest';
import { buildProductDiff } from '../ops';
import type { ProductEdit } from '../types';

describe('buildProductDiff', () => {
  const current = { productId: 7, occupancies: ['teen', 'double'] as const };

  it('emits no change when occupancies match (order-insensitive)', () => {
    const edit: ProductEdit = { productId: 7, occupancies: ['double', 'teen'] };
    expect(buildProductDiff(current, edit)).toEqual([]);
  });

  it('emits one products.occupancies change when the set differs', () => {
    const edit: ProductEdit = { productId: 7, occupancies: ['teen'] };
    const changes = buildProductDiff(current, edit);
    expect(changes).toHaveLength(1);
    const c = changes[0]!;
    expect(c).toMatchObject({ collection: 'products', id: 7, field: 'occupancies' });
    expect([...(c.before as string[])].sort()).toEqual(['double', 'teen']);
    expect(c.after).toEqual(['teen']);
  });

  it('emits a change to empty when all occupancies removed', () => {
    const edit: ProductEdit = { productId: 7, occupancies: [] };
    const changes = buildProductDiff(current, edit);
    expect(changes).toHaveLength(1);
    expect(changes[0]!.after).toEqual([]);
  });
});
