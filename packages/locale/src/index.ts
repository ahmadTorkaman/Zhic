/**
 * @zhic/locale — Persian/RTL locale primitives.
 *
 * The only place in the codebase where Persian-digit, ZWNJ, Jalali-date, and
 * Iranian-phone logic may live. All other packages and apps consume via this
 * barrel (no deep imports).
 *
 * Conventions (see CLAUDE.md + docs/spec/design-system.md §3):
 *   - Storage always ASCII digits + UTC ISO + E.164 phone
 *   - Display always Persian digits + Jalali calendar + spaced local phone
 */

export { DIGIT_MAP_FA, toPersianDigits, toAsciiDigits } from './digits';
export { ZWNJ, insertZwnj, hasZwnj } from './zwnj';
export {
  PERSIAN_THOUSANDS_SEP,
  PERSIAN_DECIMAL_SEP,
  formatNumber,
} from './number';
export type { FormatNumberOptions } from './number';
export {
  PERSIAN_MONTHS,
  PERSIAN_WEEKDAYS,
  formatDate,
  formatDateRange,
} from './date';
export type { FormatDateOptions } from './date';
export {
  IRAN_MOBILE_PREFIXES,
  normalizePhone,
  formatPhone,
  isIranianMobile,
  normalizeLandline,
  formatLandline,
  isIranianLandline,
  classifyPhone,
} from './phone';
export type { PhoneClassification } from './phone';
