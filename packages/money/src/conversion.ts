/**
 * Rial ↔ toman conversion.
 *
 * All money in Zhic's data layer is stored as integer rials. Toman is a
 * display-only unit (1 toman = 10 rials). This module is the only place in
 * the monorepo that multiplies or divides by 10 for money.
 */

export const RIAL_PER_TOMAN = 10n;

function toBigIntStrict(value: bigint | number): bigint {
  if (typeof value === 'bigint') return value;
  if (!Number.isInteger(value)) {
    throw new TypeError(`money: expected integer, got ${value}`);
  }
  return BigInt(value);
}

/**
 * Convert integer rials to integer toman. Throws if the rial value is not
 * divisible by 10 — fractional toman does not exist in our schema.
 */
export function rialsToToman(rials: bigint | number): bigint {
  const r = toBigIntStrict(rials);
  if (r % RIAL_PER_TOMAN !== 0n) {
    throw new RangeError(`rialsToToman: ${r} is not divisible by 10`);
  }
  return r / RIAL_PER_TOMAN;
}

/** Convert integer toman to integer rials. */
export function tomanToRials(toman: bigint | number): bigint {
  return toBigIntStrict(toman) * RIAL_PER_TOMAN;
}
