import { describe, expect, it } from 'vitest';
import {
  IRAN_MOBILE_PREFIXES,
  formatPhone,
  isIranianMobile,
  normalizePhone,
} from '../src/phone';

describe('normalizePhone', () => {
  it('accepts local form 09XXXXXXXXX', () => {
    expect(normalizePhone('09123456789')).toBe('+989123456789');
  });

  it('accepts E.164 form with +', () => {
    expect(normalizePhone('+989123456789')).toBe('+989123456789');
  });

  it('accepts 0098 international prefix', () => {
    expect(normalizePhone('00989123456789')).toBe('+989123456789');
  });

  it('accepts 9XXXXXXXXX (no leading zero)', () => {
    expect(normalizePhone('9123456789')).toBe('+989123456789');
  });

  it('accepts Persian digits', () => {
    expect(normalizePhone('۰۹۱۲۳۴۵۶۷۸۹')).toBe('+989123456789');
  });

  it('strips spaces, dashes, and parens', () => {
    expect(normalizePhone('+98 (912) 345-6789')).toBe('+989123456789');
    expect(normalizePhone('0912 345 6789')).toBe('+989123456789');
  });

  it('rejects a landline prefix (081)', () => {
    expect(() => normalizePhone('08123456789')).toThrow(RangeError);
  });

  it('rejects a too-short number', () => {
    expect(() => normalizePhone('0912345')).toThrow(RangeError);
  });

  it('rejects a too-long number', () => {
    expect(() => normalizePhone('091234567890')).toThrow(RangeError);
  });

  it('rejects obviously bogus input', () => {
    expect(() => normalizePhone('hello')).toThrow(RangeError);
  });
});

describe('formatPhone', () => {
  it('renders the canonical spaced Persian-digit form', () => {
    expect(formatPhone('+989123456789')).toBe('۰۹۱۲ ۳۴۵ ۶۷۸۹');
  });

  it('throws on non-E.164 input', () => {
    expect(() => formatPhone('09123456789')).toThrow(RangeError);
  });
});

describe('isIranianMobile', () => {
  it.each(IRAN_MOBILE_PREFIXES.map((p) => `${p}12345678`))(
    'accepts prefix %s',
    (local) => {
      expect(isIranianMobile(local)).toBe(true);
    },
  );

  it('rejects non-mobile and garbage', () => {
    expect(isIranianMobile('08123456789')).toBe(false);
    expect(isIranianMobile('')).toBe(false);
    expect(isIranianMobile('abc')).toBe(false);
  });
});
