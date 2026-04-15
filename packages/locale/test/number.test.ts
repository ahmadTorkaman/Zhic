import { describe, expect, it } from 'vitest';
import {
  PERSIAN_DECIMAL_SEP,
  PERSIAN_THOUSANDS_SEP,
  formatNumber,
} from '../src/number';

describe('Persian separator constants', () => {
  it('uses U+066C for thousands and U+066B for decimal', () => {
    expect(PERSIAN_THOUSANDS_SEP).toBe('\u066C');
    expect(PERSIAN_DECIMAL_SEP).toBe('\u066B');
  });
});

describe('formatNumber — Persian default', () => {
  it('groups thousands with the Persian separator', () => {
    expect(formatNumber(1234567)).toBe('۱٬۲۳۴٬۵۶۷');
  });

  it('renders small numbers without a separator', () => {
    expect(formatNumber(42)).toBe('۴۲');
    expect(formatNumber(0)).toBe('۰');
  });

  it('handles negatives with a leading minus', () => {
    expect(formatNumber(-1234)).toBe('-۱٬۲۳۴');
  });
});

describe('formatNumber — ASCII digits', () => {
  it('uses commas and ASCII digits when digits:en', () => {
    expect(formatNumber(1234567, { digits: 'en' })).toBe('1,234,567');
  });

  it('skips separators when thousands:false', () => {
    expect(formatNumber(1234567, { digits: 'en', thousands: false })).toBe('1234567');
    expect(formatNumber(1234567, { thousands: false })).toBe('۱۲۳۴۵۶۷');
  });
});

describe('formatNumber — bigint', () => {
  it('formats very large bigints without loss', () => {
    expect(formatNumber(10n ** 18n)).toBe(
      '۱' +
        '٬۰۰۰'.repeat(6),
    );
  });

  it('handles negative bigints', () => {
    expect(formatNumber(-(10n ** 6n), { digits: 'en' })).toBe('-1,000,000');
  });
});
