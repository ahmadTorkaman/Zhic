import { describe, expect, it } from 'vitest';
import { DIGIT_MAP_FA, toAsciiDigits, toPersianDigits } from '../src/digits';

describe('DIGIT_MAP_FA', () => {
  it('is the full 0-9 Persian set', () => {
    expect(DIGIT_MAP_FA).toEqual(['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']);
  });
});

describe('toPersianDigits', () => {
  it('converts every ASCII digit', () => {
    expect(toPersianDigits('0123456789')).toBe('۰۱۲۳۴۵۶۷۸۹');
  });

  it('accepts numbers', () => {
    expect(toPersianDigits(1234567)).toBe('۱۲۳۴۵۶۷');
    expect(toPersianDigits(0)).toBe('۰');
  });

  it('preserves non-digit characters including ZWNJ and spaces', () => {
    expect(toPersianDigits('A1\u200C2 B')).toBe('A۱\u200C۲ B');
  });

  it('handles the empty string', () => {
    expect(toPersianDigits('')).toBe('');
  });
});

describe('toAsciiDigits', () => {
  it('converts Persian digits', () => {
    expect(toAsciiDigits('۰۱۲۳۴۵۶۷۸۹')).toBe('0123456789');
  });

  it('converts Arabic-Indic digits', () => {
    expect(toAsciiDigits('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789');
  });

  it('round-trips with toPersianDigits', () => {
    const src = '۰۹۱۲۳۴۵۶۷۸۹';
    expect(toPersianDigits(toAsciiDigits(src))).toBe(src);
  });

  it('preserves non-digit characters', () => {
    expect(toAsciiDigits('قیمت ۸٬۴۰۰٬۰۰۰ تومان')).toBe('قیمت 8٬400٬000 تومان');
  });
});
