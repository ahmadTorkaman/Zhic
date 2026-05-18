import { toPersianDigits } from '@zhic/locale';

/** Standard ease-out cubic curve: f(t) = 1 - (1-t)^3. */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Format a count-up value: round to integer, convert to Persian digits,
 * append the suffix verbatim.
 */
export function formatCountUpValue(value: number, suffix: string): string {
  return toPersianDigits(Math.round(value)) + suffix;
}
