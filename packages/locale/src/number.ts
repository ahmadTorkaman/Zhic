/**
 * Number formatting for Persian-first display.
 *
 * Persian uses distinct separators:
 *   U+066C (٬) thousands
 *   U+066B (٫) decimal
 * All money logic lives in @zhic/money; formatNumber is generic (dimensions,
 * counts, etc.) and is the only place thousands-grouping is implemented.
 */

import { toPersianDigits } from './digits';

export const PERSIAN_THOUSANDS_SEP = '\u066C'; // ٬
export const PERSIAN_DECIMAL_SEP = '\u066B'; // ٫

export interface FormatNumberOptions {
  /** 'fa' for Persian digits (default), 'en' for ASCII */
  digits?: 'fa' | 'en';
  /** Insert thousands separators (default true) */
  thousands?: boolean;
}

/**
 * Format a number or bigint with locale-appropriate separators and digits.
 * Integers only — decimals are not yet needed in Month 1.
 */
export function formatNumber(
  value: number | bigint,
  opts: FormatNumberOptions = {},
): string {
  const { digits = 'fa', thousands = true } = opts;

  const negative = typeof value === 'bigint' ? value < 0n : value < 0;
  const abs = typeof value === 'bigint'
    ? (value < 0n ? -value : value)
    : Math.abs(value);
  const raw = typeof abs === 'bigint' ? abs.toString() : String(Math.trunc(abs));

  let grouped = raw;
  if (thousands && raw.length > 3) {
    const sep = digits === 'fa' ? PERSIAN_THOUSANDS_SEP : ',';
    // Group from the right in 3s.
    const groups: string[] = [];
    for (let i = raw.length; i > 0; i -= 3) {
      groups.unshift(raw.slice(Math.max(0, i - 3), i));
    }
    grouped = groups.join(sep);
  }

  const out = digits === 'fa' ? toPersianDigits(grouped) : grouped;
  return negative ? '-' + out : out;
}
