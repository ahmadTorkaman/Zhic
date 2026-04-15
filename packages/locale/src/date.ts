/**
 * Jalali (Solar Hijri) date formatting.
 *
 * Storage is always UTC ISO 8601. Display in Persian copy is always Jalali
 * with Persian month names and digits. Uses UTC getters to avoid
 * server-timezone drift — two hosts in different timezones must render the
 * same day for the same ISO input.
 */

import { toJalaali } from 'jalaali-js';
import { toPersianDigits } from './digits';

export const PERSIAN_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
] as const;

// Persian week starts Saturday. Day-0 = Saturday.
export const PERSIAN_WEEKDAYS = [
  'شنبه',
  'یک\u200Cشنبه',
  'دوشنبه',
  'سه\u200Cشنبه',
  'چهارشنبه',
  'پنج\u200Cشنبه',
  'جمعه',
] as const;

export interface FormatDateOptions {
  withWeekday?: boolean;
  digits?: 'fa' | 'en';
}

function asDate(input: string | Date): Date {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) {
    throw new RangeError(`formatDate: invalid date input: ${String(input)}`);
  }
  return d;
}

/**
 * Convert a JS Date (or ISO string) to Jalali parts using UTC calendar fields.
 */
function toJalaliUtc(d: Date): { jy: number; jm: number; jd: number; weekday: number } {
  const j = toJalaali(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  // Persian weekday index: Saturday = 0 ... Friday = 6. JS getUTCDay(): Sun=0.
  // Map: Sat(6)->0, Sun(0)->1, Mon(1)->2, Tue(2)->3, Wed(3)->4, Thu(4)->5, Fri(5)->6
  const jsDay = d.getUTCDay();
  const weekday = (jsDay + 1) % 7;
  return { jy: j.jy, jm: j.jm, jd: j.jd, weekday };
}

/**
 * Format an ISO / Date as Jalali long form: "۸ فروردین ۱۴۰۵"
 * With `withWeekday`: "شنبه، ۸ فروردین ۱۴۰۵"
 */
export function formatDate(iso: string | Date, opts: FormatDateOptions = {}): string {
  const { withWeekday = false, digits = 'fa' } = opts;
  const { jy, jm, jd, weekday } = toJalaliUtc(asDate(iso));

  const month = PERSIAN_MONTHS[jm - 1]!;
  const dayStr = digits === 'fa' ? toPersianDigits(jd) : String(jd);
  const yearStr = digits === 'fa' ? toPersianDigits(jy) : String(jy);
  const core = `${dayStr} ${month} ${yearStr}`;

  return withWeekday ? `${PERSIAN_WEEKDAYS[weekday]!}\u060C ${core}` : core;
}

/**
 * Format a date range. If year and month match, collapse: "۸ تا ۱۲ فروردین ۱۴۰۵".
 * If only year matches: "۲۸ اسفند تا ۳ فروردین ۱۴۰۵".
 * Else both fully qualified.
 */
export function formatDateRange(
  startIso: string | Date,
  endIso: string | Date,
  opts: FormatDateOptions = {},
): string {
  const { digits = 'fa' } = opts;
  const s = toJalaliUtc(asDate(startIso));
  const e = toJalaliUtc(asDate(endIso));

  const fmtDay = (n: number) => (digits === 'fa' ? toPersianDigits(n) : String(n));
  const fmtYear = (n: number) => (digits === 'fa' ? toPersianDigits(n) : String(n));

  if (s.jy === e.jy && s.jm === e.jm) {
    return `${fmtDay(s.jd)} تا ${fmtDay(e.jd)} ${PERSIAN_MONTHS[s.jm - 1]!} ${fmtYear(s.jy)}`;
  }
  if (s.jy === e.jy) {
    return `${fmtDay(s.jd)} ${PERSIAN_MONTHS[s.jm - 1]!} تا ${fmtDay(e.jd)} ${PERSIAN_MONTHS[e.jm - 1]!} ${fmtYear(s.jy)}`;
  }
  return `${formatDate(startIso, opts)} تا ${formatDate(endIso, opts)}`;
}
