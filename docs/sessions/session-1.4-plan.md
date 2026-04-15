# Session 1.4 — Locale + Money Packages

## Goal

Turn `packages/locale` from a stub into Persian-first locale primitives and
build `packages/money` from scratch so every consumer in the monorepo
converts and formats through a single, tested surface. Wire the first
unit-test runner into the monorepo, ship a `/lab/locale` verification
surface in `apps/web`, and close **FU-1.3-c** by migrating
`Products.price` → `basePriceRials`.

Authority: `docs/sessions.md` §1.4, `docs/spec/design-system.md` §3,
`docs/spec/data-schemas.md` §0.2 + §12.

## Entry state

- `packages/locale/` is a scaffolded stub; `@zhic/locale` already a
  workspace dep of `apps/web`.
- `packages/money/` does not exist. Root `tsconfig.json` does not
  reference it.
- No test runner wired in the monorepo. `turbo.json` declares a `test`
  task no package runs.
- `services/api/src/collections/Products.ts` stores `price: number`
  (toman label) with a migration TODO pointing at 1.4.
- `packages/types/src/index.ts` mirrors the same.

## Key decisions

| Decision | Choice |
|---|---|
| Jalali library | `jalaali-js` (zero-dep pure JS) |
| Price migration | Full rename `price` → `basePriceRials` per data-schemas.md §12 |
| Payload field type | `number` with `validate` + `min: 0` — Payload 3 has no bigint; number is safe to ~9e15 |
| `@zhic/money` boundary | Accept `bigint \| number`, return `bigint` from math |
| `@zhic/types.basePriceRials` | `number` — JSON-safe, matches Payload emitter |
| Test runner | Vitest 2.x, per-package, `node` env |
| `formatNumber` home | `@zhic/locale` — generic (dimensions, counts); money depends on it |
| Barrel | One shallow `src/index.ts` per package; deep imports disallowed |

## Deliverables

### `packages/locale/`

```
src/
├── digits.ts    # toPersianDigits, toAsciiDigits, DIGIT_MAP_FA
├── zwnj.ts      # ZWNJ, insertZwnj, hasZwnj
├── number.ts    # formatNumber, PERSIAN_THOUSANDS_SEP (٬), PERSIAN_DECIMAL_SEP (٫)
├── date.ts      # formatDate, formatDateRange, PERSIAN_MONTHS, PERSIAN_WEEKDAYS
├── phone.ts     # normalizePhone, formatPhone, isIranianMobile, IRAN_MOBILE_PREFIXES
└── index.ts     # barrel
test/            # one .test.ts per source module — 53 tests
```

Only `date.ts` has a runtime dep (`jalaali-js`). `date.ts` uses UTC getters
so two hosts in different timezones render identical days. Arabic-Indic
digits accepted alongside Persian on the input side.

### `packages/money/`

```
src/
├── conversion.ts   # RIAL_PER_TOMAN (10n), rialsToToman, tomanToRials
├── format.ts       # formatMoney, formatMoneyCompact (stub → formatMoney)
├── parse.ts        # parseMoneyInput
└── index.ts        # barrel
test/               # 3 test files, 27 tests
```

`rialsToToman` throws if the rial value is not divisible by 10 —
fractional toman does not exist in this schema. All digit/separator
rendering is delegated to `@zhic/locale.formatNumber`.

### Test wiring

- Each package adds `"test": "vitest run"` + `vitest@^2.1.8` devDep +
  `vitest.config.ts` (`environment: 'node'`, `include: test/**/*.test.ts`).
- Tests use explicit imports (no Vitest globals).
- `turbo.json` `test` task unchanged — already wired.

### FU-1.3-c migration

- `Products.ts`: `price` → `basePriceRials`, label "قیمت پایه (ریال)",
  `min: 0`, `validate` hook rejecting non-integer / negative.
- `seed.ts`: rename key on both product objects (values already in rials).
- `packages/types`: rename field + update JSDoc to point at `@zhic/money`.
- Root `tsconfig.json`: add `{ "path": "packages/money" }` reference.
- `apps/web/package.json`: add `@zhic/money: workspace:*`.

### `/lab/locale`

`apps/web/src/app/lab/locale/page.tsx` — a single table that renders one
row per formatter (digits, number, Jalali date + range, phone round-trip,
money under 3 option sets, rials→toman bigint proof, ZWNJ sample). Added
to lab nav in `layout.tsx` and to `page.tsx` experiments grid; `tokens`
added to both alongside (pre-existing drift from 1.2, swept up here).

## Exit check

- [x] `pnpm --filter @zhic/locale test` — 53 tests green
- [x] `pnpm --filter @zhic/money test` — 27 tests green
- [ ] `pnpm --filter @zhic/api generate:types` shows `basePriceRials` (run by operator after DB reset)
- [ ] `pnpm --filter @zhic/api seed` clean against a fresh `products` table (operator)
- [ ] `pnpm --filter @zhic/web build` passes (run at root below)
- [ ] Visit `/lab/locale` — every row renders correctly
- [ ] Payload admin shows "قیمت پایه (ریال)" label

## Follow-ups logged

- **FU-1.4-a** `<MoneyDisplay rials={...}/>` in `@zhic/ui` at first product card (2.x)
- **FU-1.4-b** Real `formatMoneyCompact` with Persian scale words (هزار/میلیون/میلیارد)
- **FU-1.4-c** `parseJalaliDate` for admin date inputs (Package 3)
- **FU-1.4-d** Postal-code + landline validators for checkout (Package 2)
- **FU-1.4-e** `@vitest/coverage-v8` + CI gates when Gitea Actions lands
- **FU-1.4-f** Swap Payload `basePriceRials` to text-backed bigint if any value ever exceeds `Number.MAX_SAFE_INTEGER`
- **FU-1.4-g** Move `slugify` into `@zhic/locale` when a second consumer appears

## Deferred

- `<MoneyDisplay>` React component
- Address / postal-code / landline / per-province validators
- Real compact-scale money words
- `parseJalaliDate` for UI date inputs
- `apps/web/src/data/products.ts` USD-mock migration
- Move of `services/api/src/lib/slugify.ts` into `@zhic/locale`
- Coverage reporting (`@vitest/coverage-v8`)
- i18n framework integration
