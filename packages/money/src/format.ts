/**
 * Money display formatter.
 *
 * Default: toman display, Persian digits, "٬" thousands separator, "تومان"
 * suffix. All digit and separator rendering is delegated to @zhic/locale.
 */

import { formatNumber } from '@zhic/locale';
import { rialsToToman } from './conversion';

export interface FormatMoneyOptions {
  /** Persian (default) or ASCII digits */
  digits?: 'fa' | 'en';
  /** Unit suffix to append. Default matches `unit`. */
  suffix?: 'toman' | 'rial' | 'none';
  /** Display unit — controls div-by-10 from storage rials. Default 'toman'. */
  unit?: 'toman' | 'rial';
}

const SUFFIX_LABEL: Record<'toman' | 'rial', string> = {
  toman: 'تومان',
  rial: 'ریال',
};

/**
 * Format a rial-denominated amount (storage value) as a Persian toman string.
 *
 *   formatMoney(84_000_000n) → "۸٬۴۰۰٬۰۰۰ تومان"
 */
export function formatMoney(
  rials: bigint | number,
  opts: FormatMoneyOptions = {},
): string {
  const { digits = 'fa', unit = 'toman' } = opts;
  const suffix = opts.suffix ?? unit;

  const displayValue = unit === 'toman' ? rialsToToman(rials) : BigInt(rials as number);
  const numberPart = formatNumber(displayValue, { digits });

  if (suffix === 'none') return numberPart;
  return `${numberPart} ${SUFFIX_LABEL[suffix]}`;
}

/**
 * Compact form for tight UI. Stub returns the long form; real compact-scale
 * words (هزار / میلیون / میلیارد) land with B2B pricing UI (FU-1.4-b).
 */
export function formatMoneyCompact(
  rials: bigint | number,
  opts: FormatMoneyOptions = {},
): string {
  return formatMoney(rials, opts);
}
