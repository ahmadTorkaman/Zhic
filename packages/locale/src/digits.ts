/**
 * Persian (Arabic-Indic) digit conversion.
 *
 * Storage is always ASCII. Display in Persian copy is always Persian digits.
 * No component should convert digits outside @zhic/locale.
 */

export const DIGIT_MAP_FA = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'] as const;

const FA_TO_EN: Record<string, string> = {
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  // Arabic-Indic (sometimes pasted instead of Persian):
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
};

/** Convert any ASCII digits in the input to Persian digits. Non-digits pass through. */
export function toPersianDigits(input: string | number): string {
  const s = typeof input === 'number' ? String(input) : input;
  return s.replace(/[0-9]/g, (d) => DIGIT_MAP_FA[Number(d)]!);
}

/** Convert any Persian (or Arabic-Indic) digits in the input to ASCII digits. */
export function toAsciiDigits(input: string): string {
  return input.replace(/[۰-۹٠-٩]/g, (d) => FA_TO_EN[d] ?? d);
}
