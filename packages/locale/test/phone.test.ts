import { describe, expect, it } from 'vitest';
import {
  IRAN_MOBILE_PREFIXES,
  classifyPhone,
  formatLandline,
  formatPhone,
  isIranianLandline,
  isIranianMobile,
  normalizeLandline,
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

describe('normalizeLandline', () => {
  it('accepts local hyphenated form 081-38123456', () => {
    expect(normalizeLandline('081-38123456')).toBe('+988138123456');
  });

  it('accepts local non-hyphenated form 08138123456', () => {
    expect(normalizeLandline('08138123456')).toBe('+988138123456');
  });

  it('accepts E.164 form with +', () => {
    expect(normalizeLandline('+988138123456')).toBe('+988138123456');
  });

  it('accepts 0098 international prefix', () => {
    expect(normalizeLandline('00988138123456')).toBe('+988138123456');
  });

  it('accepts 8XXXXXXXXX (no leading zero)', () => {
    expect(normalizeLandline('2112345678')).toBe('+982112345678');
  });

  it('accepts Persian digits + spaces / parens', () => {
    expect(normalizeLandline('۰۲۱ ۱۲۳۴۵۶۷۸')).toBe('+982112345678');
    expect(normalizeLandline('+98 (21) 1234-5678')).toBe('+982112345678');
  });

  it('rejects mobile prefix (091)', () => {
    expect(() => normalizeLandline('09123456789')).toThrow(RangeError);
  });

  it('rejects too-short / too-long', () => {
    expect(() => normalizeLandline('081123')).toThrow(RangeError);
    expect(() => normalizeLandline('081123456789012')).toThrow(RangeError);
  });

  it('rejects bogus input', () => {
    expect(() => normalizeLandline('xyz')).toThrow(RangeError);
  });
});

describe('formatLandline', () => {
  it('renders the canonical spaced Persian-digit form', () => {
    expect(formatLandline('+988138123456')).toBe('۰۸۱ ۳۸۱۲۳۴۵۶');
    expect(formatLandline('+982112345678')).toBe('۰۲۱ ۱۲۳۴۵۶۷۸');
  });

  it('throws on non-E.164 input', () => {
    expect(() => formatLandline('08138123456')).toThrow(RangeError);
    expect(() => formatLandline('+989123456789')).toThrow(RangeError);
  });
});

describe('isIranianLandline', () => {
  it('accepts well-formed landlines', () => {
    expect(isIranianLandline('081-38123456')).toBe(true);
    expect(isIranianLandline('+982112345678')).toBe(true);
  });

  it('rejects mobiles and garbage', () => {
    expect(isIranianLandline('09123456789')).toBe(false);
    expect(isIranianLandline('')).toBe(false);
    expect(isIranianLandline('foo')).toBe(false);
  });
});

describe('classifyPhone', () => {
  it('classifies mobile inputs', () => {
    const c = classifyPhone('09123456789');
    expect(c?.kind).toBe('mobile');
    expect(c?.e164).toBe('+989123456789');
    expect(c?.display).toBe('۰۹۱۲ ۳۴۵ ۶۷۸۹');
  });

  it('classifies landline inputs', () => {
    const c = classifyPhone('081-38123456');
    expect(c?.kind).toBe('landline');
    expect(c?.e164).toBe('+988138123456');
    expect(c?.display).toBe('۰۸۱ ۳۸۱۲۳۴۵۶');
  });

  it('returns null for unrecognized input', () => {
    expect(classifyPhone('hello world')).toBeNull();
    expect(classifyPhone('')).toBeNull();
  });
});
