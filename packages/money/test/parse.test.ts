import { describe, expect, it } from 'vitest';
import { parseMoneyInput } from '../src/parse';

describe('parseMoneyInput — defaults (toman)', () => {
  it('parses plain ASCII toman', () => {
    expect(parseMoneyInput('8400000')).toBe(84_000_000n);
  });

  it('parses ASCII toman with comma separators', () => {
    expect(parseMoneyInput('8,400,000')).toBe(84_000_000n);
  });

  it('parses Persian toman with the Persian separator', () => {
    expect(parseMoneyInput('۸٬۴۰۰٬۰۰۰')).toBe(84_000_000n);
  });

  it('strips a tailing "تومان" label', () => {
    expect(parseMoneyInput('۸٬۴۰۰٬۰۰۰ تومان')).toBe(84_000_000n);
  });

  it('handles zero', () => {
    expect(parseMoneyInput('0')).toBe(0n);
  });
});

describe('parseMoneyInput — unit:rial', () => {
  it('returns the value unchanged as rials', () => {
    expect(parseMoneyInput('۸۴٬۰۰۰٬۰۰۰', { unit: 'rial' })).toBe(84_000_000n);
  });

  it('strips a trailing "ریال" label', () => {
    expect(parseMoneyInput('84000000 ریال', { unit: 'rial' })).toBe(84_000_000n);
  });
});

describe('parseMoneyInput — rejections', () => {
  it('throws on garbage', () => {
    expect(() => parseMoneyInput('abc')).toThrow(RangeError);
  });

  it('throws on empty', () => {
    expect(() => parseMoneyInput('')).toThrow(RangeError);
  });
});
