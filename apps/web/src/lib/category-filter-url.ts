// apps/web/src/lib/category-filter-url.ts

type SearchParams = Record<string, string | string[] | undefined>;
type Override = {
  design?: string | null;
  material?: string | null;
  size?: string | null;
  sort?: string | null;
  age?: string | null;
  page?: number | string | null;
};

const DEFAULT_SORT = 'newest';
const FILTER_KEYS = ['design', 'material', 'size', 'sort', 'age'] as const;

function pick(sp: SearchParams, key: string): string | undefined {
  const v = sp[key];
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

/**
 * Compute the new URL for the category page given the current searchParams
 * and an override (one or more filter keys to set/clear).
 *
 * Rules:
 *  - Any filter change resets `page` to 1 (omitted from the URL).
 *  - The `page` key can be changed independently — pass it in `override.page`
 *    and other params are preserved.
 *  - `sort=newest` is the default and is never emitted in the URL.
 *  - Setting a value to `null` in `override` REMOVES that key.
 *  - Setting a value to a string SETS that key.
 *  - Keys not in `override` are PRESERVED from the current searchParams.
 */
export function buildFilterHref(base: string, current: SearchParams, override: Override): string {
  const params = new URLSearchParams();

  // First pass: emit keys that exist in current (in their original order),
  // applying any override values on top.
  for (const key of FILTER_KEYS) {
    const inCurrent = pick(current, key) !== undefined;
    if (!inCurrent) continue;
    const overKey = override[key as keyof Override];
    let next: string | undefined;
    if (overKey === null) {
      next = undefined;       // explicit clear
    } else if (overKey !== undefined) {
      next = String(overKey);  // explicit set (override replaces current)
    } else {
      next = pick(current, key); // preserved
    }
    if (next && !(key === 'sort' && next === DEFAULT_SORT)) {
      params.set(key, next);
    }
  }

  // Second pass: emit override keys that were NOT already in current.
  for (const key of FILTER_KEYS) {
    const inCurrent = pick(current, key) !== undefined;
    if (inCurrent) continue; // already handled above
    const overKey = override[key as keyof Override];
    if (overKey === null || overKey === undefined) continue;
    const next = String(overKey);
    if (next && !(key === 'sort' && next === DEFAULT_SORT)) {
      params.set(key, next);
    }
  }

  // page: only set if override.page is given.
  let nextPage: number | null = null;
  if (override.page !== undefined && override.page !== null) {
    nextPage = Number(override.page);
  }
  if (nextPage && nextPage > 1) {
    params.set('page', String(nextPage));
  }

  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}
