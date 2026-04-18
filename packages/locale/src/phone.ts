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

// --- Landline ---------------------------------------------------------------

/**
 * Iranian landline area codes are 2-digit (with leading 0 → 3-char prefix
 * starting with `0` in local form). `02` Tehran, `03` Esfahan / Karaj zone,
 * `04` west, `05` east, `06` south, `07` Fars, `08` west, `09` is reserved
 * for mobiles. We detect by structure (11-digit local with leading 0:
 * `0` + 2-digit area code [2-8] + 8-digit local) rather than enumerating
 * the full list.
 */
const LANDLINE_LOCAL_RE = /^0[2-8]\d{9}$/;

/**
 * Normalize an Iranian landline into E.164 ("+98XXXXXXXXXX", 10 digits after
 * the country code). Accepts: `+98XXXXXXXXXX`, `0098XXXXXXXXXX`, `0XXXXXXXXXX`
 * (local form), Persian digits, and any surrounding whitespace or punctuation
 * (spaces, dashes, parens). Throws RangeError on invalid input.
 */
export function normalizeLandline(input: string): string {
  const ascii = toAsciiDigits(input);
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
  } else if (digits.length === 10 && /^[2-8]/.test(digits)) {
    local = '0' + digits;
  } else {
    throw new RangeError(`normalizeLandline: unrecognized format: ${input}`);
  }

  if (!LANDLINE_LOCAL_RE.test(local)) {
    throw new RangeError(`normalizeLandline: not an Iranian landline: ${input}`);
  }

  return '+98' + local.slice(1);
}

/**
 * Format a normalized E.164 landline for Persian display: "۰۸۱ ۳۸۱۲۳۴۵۶".
 * Outputs the local form (3-digit area code + 8-digit local), space-separated.
 */
export function formatLandline(e164: string): string {
  if (!/^\+98[2-8]\d{9}$/.test(e164)) {
    throw new RangeError(`formatLandline: not an E.164 Iranian landline: ${e164}`);
  }
  const local = '0' + e164.slice(3); // 11 digits, leading 0
  const spaced = `${local.slice(0, 3)} ${local.slice(3)}`;
  return toPersianDigits(spaced);
}

/**
 * True if the input parses as a valid Iranian landline number.
 */
export function isIranianLandline(input: string): boolean {
  try {
    normalizeLandline(input);
    return true;
  } catch {
    return false;
  }
}

/**
 * Try mobile then landline. Returns `{ kind, e164, display }` for the first
 * format that parses, or `null` if neither works. Useful at storefront edges
 * where the field could be either kind (e.g. showroom phone).
 */
export type PhoneClassification =
  | { kind: 'mobile'; e164: string; display: string }
  | { kind: 'landline'; e164: string; display: string };

export function classifyPhone(input: string): PhoneClassification | null {
  if (isIranianMobile(input)) {
    const e164 = normalizePhone(input);
    return { kind: 'mobile', e164, display: formatPhone(e164) };
  }
  if (isIranianLandline(input)) {
    const e164 = normalizeLandline(input);
    return { kind: 'landline', e164, display: formatLandline(e164) };
  }
  return null;
}
