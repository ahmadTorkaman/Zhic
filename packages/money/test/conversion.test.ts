import { describe, expect, it } from 'vitest';
import { RIAL_PER_TOMAN, rialsToToman, tomanToRials } from '../src/conversion';

describe('RIAL_PER_TOMAN', () => {
  it('is 10n', () => {
    expect(RIAL_PER_TOMAN).toBe(10n);
  });
});

describe('rialsToToman', () => {
  it('divides rials by 10', () => {
    expect(rialsToToman(84_000_000n)).toBe(8_400_000n);
  });

  it('accepts a plain number input', () => {
    expect(rialsToToman(84_000_000)).toBe(8_400_000n);
  });

  it('handles zero', () => {
    expect(rialsToToman(0n)).toBe(0n);
  });

  it('supports negative rials (refunds)', () => {
    expect(rialsToToman(-100n)).toBe(-10n);
  });

  it('preserves very large bigints', () => {
    expect(rialsToToman(10n ** 15n)).toBe(10n ** 14n);
  });

  it('throws when rial value is not divisible by 10', () => {
    expect(() => rialsToToman(5n)).toThrow(RangeError);
    expect(() => rialsToToman(84_000_001n)).toThrow(RangeError);
  });

  it('throws on non-integer number input', () => {
    expect(() => rialsToToman(1.5)).toThrow(TypeError);
  });
});

describe('tomanToRials', () => {
  it('multiplies toman by 10', () => {
    expect(tomanToRials(8_400_000n)).toBe(84_000_000n);
  });

  it('handles zero', () => {
    expect(tomanToRials(0n)).toBe(0n);
  });

  it('round-trips with rialsToToman', () => {
    const rials = 123_450_000n;
    expect(tomanToRials(rialsToToman(rials))).toBe(rials);
  });
});
