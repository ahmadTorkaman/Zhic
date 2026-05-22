import { describe, expect, it } from 'vitest';
import { ProductVariants } from '../collections/ProductVariants';

describe('ProductVariants collection', () => {
  it('has slug "product-variants"', () => {
    expect(ProductVariants.slug).toBe('product-variants');
  });

  it('declares all required fields', () => {
    const fieldNames = (ProductVariants.fields ?? []).map((f) => (f as { name: string }).name);
    expect(fieldNames).toEqual(
      expect.arrayContaining(['product', 'sku', 'label', 'axes', 'priceDeltaRials', 'availability', 'image', 'displayOrder'])
    );
  });

  it('product field is a required relationship to products', () => {
    const product = (ProductVariants.fields ?? []).find((f) => (f as { name: string }).name === 'product') as any;
    expect(product.type).toBe('relationship');
    expect(product.relationTo).toBe('products');
    expect(product.required).toBe(true);
  });

  it('sku is required and unique', () => {
    const sku = (ProductVariants.fields ?? []).find((f) => (f as { name: string }).name === 'sku') as any;
    expect(sku.required).toBe(true);
    expect(sku.unique).toBe(true);
  });

  it('axes is an array field with key + value sub-fields', () => {
    const axes = (ProductVariants.fields ?? []).find((f) => (f as { name: string }).name === 'axes') as any;
    expect(axes.type).toBe('array');
    const subFieldNames = (axes.fields ?? []).map((f: { name: string }) => f.name);
    expect(subFieldNames).toEqual(['key', 'value']);
  });

  it('availability matches Product.availability enum values', () => {
    const availability = (ProductVariants.fields ?? []).find((f) => (f as { name: string }).name === 'availability') as any;
    expect(availability.type).toBe('select');
    const values = (availability.options ?? []).map((o: { value: string }) => o.value);
    expect(values).toEqual(['in_stock', 'made_to_order', 'backorder', 'discontinued']);
  });
});
