/**
 * Parse free-form user money input into integer rials.
 *
 * Accepts: ASCII and Persian digits, Persian (٬) and Latin (,) thousands
 * separators, surrounding whitespace or unit words (تومان / ریال). Rejects
 * anything else.
 */

import { toAsciiDigits } from '@zhic/locale';
import { RIAL_PER_TOMAN } from './conversion';

export interface ParseMoneyOptions {
  /** Unit the input is expressed in. Default 'toman'. */
  unit?: 'toman' | 'rial';
}

/**
 * Parse user input (e.g. "۸٬۴۰۰٬۰۰۰" or "8,400,000 تومان") and return rials.
 */
export function parseMoneyInput(
  input: string,
  opts: ParseMoneyOptions = {},
): bigint {
  const { unit = 'toman' } = opts;

  const ascii = toAsciiDigits(input);
  const digits = ascii.replace(/[\s,\u066C\u066B]/g, '').replace(/تومان|ریال/g, '');

  if (!/^-?\d+$/.test(digits)) {
    throw new RangeError(`parseMoneyInput: unparsable input: ${input}`);
  }

  const n = BigInt(digits);
  return unit === 'toman' ? n * RIAL_PER_TOMAN : n;
}
