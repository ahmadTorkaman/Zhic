/**
 * @zhic/money — the only place rial↔toman math lives.
 *
 * Storage convention (see docs/spec/data-schemas.md §0.2):
 *   - All money is stored as integer rials.
 *   - Field names end with the suffix `Rials` (e.g. `basePriceRials`).
 *
 * Display convention:
 *   - Default display is toman, Persian digits, "٬" separator, "تومان" suffix.
 *   - `formatMoney(rials)` is the single source of truth.
 */

export { RIAL_PER_TOMAN, rialsToToman, tomanToRials } from './conversion';
export { formatMoney, formatMoneyCompact } from './format';
export type { FormatMoneyOptions } from './format';
export { parseMoneyInput } from './parse';
export type { ParseMoneyOptions } from './parse';
