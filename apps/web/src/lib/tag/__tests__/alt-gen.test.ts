// apps/web/src/lib/tag/__tests__/alt-gen.test.ts
import { describe, it, expect } from 'vitest';
import { altFromContext } from '../alt-gen';

describe('altFromContext', () => {
  it('base = piece_type + design when no productName; qualifiers from filename', () => {
    expect(altFromContext({ filename: 'verna-closet-2-doors-cream.webp', pieceType: 'closet', designName: 'ورنا', productSlug: 'verna-closet' }))
      .toBe('کمد ورنا — دو درب، رنگ کرم');
  });
  it('uses productName as base when present', () => {
    expect(altFromContext({ filename: 'x-4-drawers.webp', pieceType: 'vanity', productName: 'میز آرایش پارلا', productSlug: 'x' }))
      .toBe('میز آرایش پارلا — چهار کشو');
  });
  it('unknown piece_type falls back to محصول', () => {
    expect(altFromContext({ filename: 'foo.webp', pieceType: 'unknown', designName: '' })).toBe('محصول');
  });
  it('open beats picture for the view marker', () => {
    expect(altFromContext({ filename: 'p-open-picture.webp', pieceType: 'bed', designName: 'لوف', productSlug: 'p' }))
      .toBe('تخت لوف — نمای داخلی');
  });
  it('size token rendered with Persian digits', () => {
    expect(altFromContext({ filename: 'p-160.webp', pieceType: 'bed', designName: 'لوف', productSlug: 'p' }))
      .toBe('تخت لوف — سایز ۱۶۰');
  });
});
