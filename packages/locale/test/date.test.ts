import { describe, expect, it } from 'vitest';
import {
  PERSIAN_MONTHS,
  PERSIAN_WEEKDAYS,
  formatDate,
  formatDateRange,
  formatJalaliNumeric,
} from '../src/date';

describe('Persian calendar tables', () => {
  it('has 12 Persian months starting at Farvardin', () => {
    expect(PERSIAN_MONTHS.length).toBe(12);
    expect(PERSIAN_MONTHS[0]).toBe('فروردین');
    expect(PERSIAN_MONTHS[11]).toBe('اسفند');
  });

  it('has 7 Persian weekdays starting at Saturday', () => {
    expect(PERSIAN_WEEKDAYS.length).toBe(7);
    expect(PERSIAN_WEEKDAYS[0]).toBe('شنبه');
    expect(PERSIAN_WEEKDAYS[6]).toBe('جمعه');
  });
});

describe('formatDate', () => {
  it('renders Nowruz 1405 correctly', () => {
    expect(formatDate('2026-03-21T00:00:00Z')).toBe('۱ فروردین ۱۴۰۵');
  });

  it('renders today (2026-04-15) as the expected Jalali date', () => {
    // 2026-04-15 Gregorian = 26 Farvardin 1405 Jalali
    expect(formatDate('2026-04-15T00:00:00Z')).toBe('۲۶ فروردین ۱۴۰۵');
  });

  it('is stable across the UTC day boundary', () => {
    // Both map to the same UTC date → same Jalali day.
    expect(formatDate('2026-03-21T00:00:00Z')).toBe(formatDate('2026-03-21T23:59:59Z'));
  });

  it('supports ASCII digits', () => {
    expect(formatDate('2026-03-21T00:00:00Z', { digits: 'en' })).toBe('1 فروردین 1405');
  });

  it('prepends the Persian weekday when requested', () => {
    // 2026-03-21 is a Saturday → شنبه (index 0).
    expect(formatDate('2026-03-21T00:00:00Z', { withWeekday: true }))
      .toBe('شنبه\u060C ۱ فروردین ۱۴۰۵');
  });

  it('accepts a Date instance', () => {
    const d = new Date('2026-03-21T00:00:00Z');
    expect(formatDate(d)).toBe('۱ فروردین ۱۴۰۵');
  });

  it('throws on invalid input', () => {
    expect(() => formatDate('not-a-date')).toThrow(RangeError);
  });
});

describe('formatJalaliNumeric', () => {
  it('formats Nowruz 1405 (2026-03-21) as 1405/01/01', () => {
    expect(formatJalaliNumeric('2026-03-21', { digits: 'en' })).toBe('1405/01/01');
  });
  it('zero-pads month and day (2026-03-30 → 1405/01/10)', () => {
    expect(formatJalaliNumeric('2026-03-30', { digits: 'en' })).toBe('1405/01/10');
  });
  it('uses Persian digits by default', () => {
    expect(formatJalaliNumeric('2026-03-21')).toBe('۱۴۰۵/۰۱/۰۱');
  });
});

describe('formatDateRange', () => {
  it('collapses same year and month', () => {
    expect(formatDateRange('2026-03-21T00:00:00Z', '2026-03-25T00:00:00Z'))
      .toBe('۱ تا ۵ فروردین ۱۴۰۵');
  });

  it('handles same year, different months', () => {
    // 2026-03-21 = 1 Farvardin 1405, 2026-04-21 = 1 Ordibehesht 1405
    expect(formatDateRange('2026-03-21T00:00:00Z', '2026-04-21T00:00:00Z'))
      .toBe('۱ فروردین تا ۱ اردیبهشت ۱۴۰۵');
  });

  it('falls back to both fully qualified for different years', () => {
    const r = formatDateRange('2025-03-21T00:00:00Z', '2026-03-21T00:00:00Z');
    expect(r).toContain('۱۴۰۴');
    expect(r).toContain('۱۴۰۵');
    expect(r).toContain('تا');
  });
});
