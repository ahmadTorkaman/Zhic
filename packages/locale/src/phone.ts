/**
 * Iranian mobile phone normalization and display.
 *
 * Storage: E.164 ASCII, e.g. "+989123456789".
 * Display: Persian digits, spaced local form, e.g. "۰۹۱۲ ۳۴۵ ۶۷۸۹".
 */

import { toAsciiDigits, toPersianDigits } from './digits';

/**
 * Mobile prefixes assigned to Iranian mobile operators (local form, without +98).
 * Iran's mobile range is 9xx, so local-prefix form is 09x.
 */
export const IRAN_MOBILE_PREFIXES = ['090', '091', '092', '093', '094', '099'] as const;

/**
 * Normalize raw user input into E.164 ("+989XXXXXXXXX").
 * Accepts: +989…, 00989…, 09… (local), 9… (no leading zero), Persian digits,
 * and any surrounding whitespace or punctuation. Throws RangeError on invalid.
 */
export function normalizePhone(input: string): string {
  const ascii = toAsciiDigits(input);
  // Keep digits only, noting whether a leading '+' existed.
  const hadPlus = ascii.trim().startsWith('+');
  const digits = ascii.replace(/\D+/g, '');

  let local: string;
  if (hadPlus && digits.startsWith('98')) {
    local = '0' + digits.slice(2);
  } else if (digits.startsWith('0098')) {
    local = '0' + digits.slice(4);
  } else if (digits.startsWith('98') && digits.length === 12) {
    local = '0' + digits.slice(2);
  } else if (digits.startsWith('0')) {
    local = digits;
  } else if (digits.length === 10 && digits.startsWith('9')) {
    local = '0' + digits;
  } else {
    throw new RangeError(`normalizePhone: unrecognized format: ${input}`);
  }

  if (local.length !== 11 || !local.startsWith('09')) {
    throw new RangeError(`normalizePhone: not an Iranian mobile: ${input}`);
  }

  const prefix = local.slice(0, 3);
  if (!IRAN_MOBILE_PREFIXES.includes(prefix as (typeof IRAN_MOBILE_PREFIXES)[number])) {
    throw new RangeError(`normalizePhone: unknown mobile prefix ${prefix}`);
  }

  return '+98' + local.slice(1);
}

/**
 * Format a normalized E.164 number for Persian display: "۰۹۱۲ ۳۴۵ ۶۷۸۹".
 */
export function formatPhone(e164: string): string {
  if (!/^\+989\d{9}$/.test(e164)) {
    throw new RangeError(`formatPhone: not an E.164 Iranian mobile: ${e164}`);
  }
  const local = '0' + e164.slice(3); // 11 digits, leading 0
  const spaced = `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
  return toPersianDigits(spaced);
}

/**
 * True if the input parses as a valid Iranian mobile number.
 */
export function isIranianMobile(input: string): boolean {
  try {
    normalizePhone(input);
    return true;
  } catch {
    return false;
  }
}
