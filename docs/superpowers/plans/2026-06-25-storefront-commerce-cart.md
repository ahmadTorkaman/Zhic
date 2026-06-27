# Storefront Commerce — Plan 1: Cart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fully working, client-side shopping cart to the Zhic storefront — add-to-cart on the PDP, a header cart icon with count, a slide-over drawer, a `/cart` page with empty state, and `localStorage` persistence — with no backend.

**Architecture:** Cart state lives in a client React Context (`CartProvider`) backed by `localStorage` (key `zhic-cart-v1`), mounted once in the `(site)` layout so the header, drawer, and pages all share it. Cart lines are *snapshots* built from the already-fetched real Payload product/variant (name, variant label, unit price in rials, thumbnail, lead time). All money math stays in integer rials and is formatted to toman via `@zhic/money`. Pure cart math is isolated in a tested helper module; the Payload/`@zhic/auth`/`@zhic/payments` swap in later plans only touches the checkout/account getters, never this cart core.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, `@zhic/money` (`formatMoney`), `@zhic/locale` (`toPersianDigits`), Vitest 2 + @testing-library/react (jsdom per-file), CSS Modules with `cqw` units in the 430 column.

**Plan series:** This is **Plan 1 of 5** (Cart → Auth gate → Checkout → Payment+confirmation → Account). It produces working, testable software on its own. Forward references: the `/cart` "تسویه حساب" CTA links to `/checkout`, which arrives in Plan 3; until then it 404s by design (the cart itself is fully functional).

**Locked product decisions carried in:** add-to-cart primary + inquiry secondary on PDP (الف); full payment, no deposit (پ) — no deposit UI anywhere; VAT excluded from customer totals (handled at the factor stage, Discovery-gated). Per-item lead time shown on each cart line. Shipping deferred to checkout (cart total = subtotal).

---

## File Structure

**Create (cart core — `apps/web/src/lib/cart/`):**
- `types.ts` — the `CartLine` type (one responsibility: the shape of a cart line).
- `cart-math.ts` — pure functions: `lineKey`, `addLine`, `setQty`, `removeLine`, `cartCount`, `cartSubtotalRials`. No React, fully unit-tested.
- `from-product.ts` — `buildCartLine(product, variant, qty)`: snapshots a Payload product+variant into a `CartLine`.
- `CartContext.tsx` — `CartProvider` + `useCart` hook + `localStorage` persistence + drawer open state.
- `__tests__/cart-math.test.ts`, `__tests__/from-product.test.ts`, `__tests__/CartContext.test.tsx`.

**Create (cart UI — `apps/web/src/components/cart/`):**
- `CartLineRow.tsx` + `CartLineRow.module.css` — one cart line (thumb, name, variant, lead time, qty stepper, line total, remove). Shared by drawer + page.
- `CartDrawer.tsx` + `CartDrawer.module.css` — slide-over panel, mounted once globally.
- `CartPageBody.tsx` + `CartPageBody.module.css` — `/cart` body + empty state.
- `HeaderCartButton.tsx` — header icon + count badge.
- `__tests__/HeaderCartButton.test.tsx`, `__tests__/CartPageBody.test.tsx`.

**Create (routes):**
- `apps/web/src/app/(site)/cart/page.tsx` — the real `/cart` route.
- `apps/web/src/app/lab/cart/page.tsx` — seeded `/lab/cart` preview (noindex).

**Modify:**
- `apps/web/src/components/product/PickerBar.tsx` (+ `PickerBar.module.css`) — add primary «افزودن به سبد خرید» button, demote «استعلام قیمت» to secondary, add `onAddToCart` prop.
- `apps/web/src/components/product/InquiryHandler.tsx` — wire `useCart().addItem` via `buildCartLine`.
- `apps/web/src/components/product/__tests__/PickerBar.test.tsx` — cover the new button.
- `apps/web/src/components/layout/SiteHeader.tsx` — render `<HeaderCartButton/>` in the icons column.
- `apps/web/src/app/(site)/layout.tsx` — wrap the shell in `<CartProvider>` and mount `<CartDrawer/>`.
- `apps/web/src/app/lab/site-header/page.tsx` — wrap the preview in `<CartProvider>` (header now consumes cart context).
- `docs/state.md` — session log entry (final task).

**Commands (run from repo root):**
- Single test file: `pnpm -C apps/web test -- <path>`
- All web tests: `pnpm -C apps/web test`
- Typecheck: `pnpm -C apps/web typecheck`
- Lint: `pnpm -C apps/web lint`
- Gotcha: after `.tsx` edits in dev, restart `next dev` + `rm -rf apps/web/.next/cache` (Turbopack serves stale JSX). Not needed for Vitest runs.

---

## Task 1: Cart line type + pure cart math

**Files:**
- Create: `apps/web/src/lib/cart/types.ts`
- Create: `apps/web/src/lib/cart/cart-math.ts`
- Test: `apps/web/src/lib/cart/__tests__/cart-math.test.ts`

- [ ] **Step 1: Write the type**

Create `apps/web/src/lib/cart/types.ts`:

```ts
export type CartLine = {
  /** Stable de-dup id: `${productId}:${variantId ?? 'base'}`. */
  key: string;
  productId: string | number;
  slug: string;
  name: string;
  variantId: string | number | null;
  /** Human label, e.g. "سایز ۱۶۰ · روکش وکیوم". Null for single-SKU products. */
  variantLabel: string | null;
  sku: string | null;
  /** Unit price in integer rials, snapshotted at add time. */
  unitPriceRials: number;
  qty: number;
  thumbnailUrl: string | null;
  thumbnailAlt: string | null;
  leadTimeDays: number | null;
};
```

- [ ] **Step 2: Write the failing test**

Create `apps/web/src/lib/cart/__tests__/cart-math.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  addLine,
  cartCount,
  cartSubtotalRials,
  lineKey,
  removeLine,
  setQty,
} from '../cart-math';
import type { CartLine } from '../types';

const line = (over: Partial<CartLine> = {}): CartLine => ({
  key: 'p1:base',
  productId: 1,
  slug: 's',
  name: 'n',
  variantId: null,
  variantLabel: null,
  sku: null,
  unitPriceRials: 10_000_000,
  qty: 1,
  thumbnailUrl: null,
  thumbnailAlt: null,
  leadTimeDays: null,
  ...over,
});

describe('cart-math', () => {
  it('lineKey uses base sentinel when no variant', () => {
    expect(lineKey(7, null)).toBe('7:base');
    expect(lineKey(7, 99)).toBe('7:99');
  });

  it('addLine appends a new line', () => {
    const result = addLine([], line());
    expect(result).toHaveLength(1);
  });

  it('addLine merges quantities for the same key', () => {
    const a = line({ key: 'k', qty: 1 });
    const b = line({ key: 'k', qty: 2 });
    const result = addLine([a], b);
    expect(result).toHaveLength(1);
    expect(result[0]!.qty).toBe(3);
  });

  it('setQty changes quantity', () => {
    const result = setQty([line({ key: 'k', qty: 1 })], 'k', 4);
    expect(result[0]!.qty).toBe(4);
  });

  it('setQty to zero removes the line', () => {
    const result = setQty([line({ key: 'k', qty: 1 })], 'k', 0);
    expect(result).toHaveLength(0);
  });

  it('removeLine drops the matching key only', () => {
    const result = removeLine([line({ key: 'a' }), line({ key: 'b' })], 'a');
    expect(result.map((l) => l.key)).toEqual(['b']);
  });

  it('cartCount sums quantities', () => {
    expect(cartCount([line({ key: 'a', qty: 1 }), line({ key: 'b', qty: 2 })])).toBe(3);
  });

  it('cartSubtotalRials sums unitPrice * qty', () => {
    const lines = [
      line({ key: 'a', unitPriceRials: 385_000_000, qty: 1 }),
      line({ key: 'b', unitPriceRials: 92_000_000, qty: 2 }),
    ];
    expect(cartSubtotalRials(lines)).toBe(569_000_000);
  });
});
```

- [ ] **Step 3: Run the test, verify it fails**

Run: `pnpm -C apps/web test -- src/lib/cart/__tests__/cart-math.test.ts`
Expected: FAIL — `Cannot find module '../cart-math'`.

- [ ] **Step 4: Implement cart-math**

Create `apps/web/src/lib/cart/cart-math.ts`:

```ts
import type { CartLine } from './types';

export function lineKey(
  productId: string | number,
  variantId: string | number | null,
): string {
  return `${productId}:${variantId ?? 'base'}`;
}

export function addLine(lines: CartLine[], incoming: CartLine): CartLine[] {
  const idx = lines.findIndex((l) => l.key === incoming.key);
  if (idx === -1) return [...lines, incoming];
  const next = lines.slice();
  next[idx] = { ...next[idx]!, qty: next[idx]!.qty + incoming.qty };
  return next;
}

export function setQty(lines: CartLine[], key: string, qty: number): CartLine[] {
  if (qty <= 0) return removeLine(lines, key);
  return lines.map((l) => (l.key === key ? { ...l, qty } : l));
}

export function removeLine(lines: CartLine[], key: string): CartLine[] {
  return lines.filter((l) => l.key !== key);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.qty, 0);
}

export function cartSubtotalRials(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.unitPriceRials * l.qty, 0);
}
```

- [ ] **Step 5: Run the test, verify it passes**

Run: `pnpm -C apps/web test -- src/lib/cart/__tests__/cart-math.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/cart/types.ts apps/web/src/lib/cart/cart-math.ts apps/web/src/lib/cart/__tests__/cart-math.test.ts
git commit -m "feat(cart): cart line type + pure cart math helpers"
```

---

## Task 2: buildCartLine — snapshot a product+variant into a cart line

**Files:**
- Create: `apps/web/src/lib/cart/from-product.ts`
- Test: `apps/web/src/lib/cart/__tests__/from-product.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/lib/cart/__tests__/from-product.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildCartLine } from '../from-product';
import type { PayloadProduct, PayloadProductVariant } from '@/lib/payload';

const product = {
  id: 10,
  slug: 'iron-bed',
  name: 'تخت‌خواب آیرون',
  basePriceRials: 300_000_000,
  sku: 'IRON-BED',
  leadTimeDays: 56,
  gallery: [{ id: 1, url: '/img/iron.webp', alt: 'آیرون' }],
} as PayloadProduct;

const variant: PayloadProductVariant = {
  id: 99,
  product: 10,
  sku: 'IRON-BED-160',
  label: null,
  axes: [
    { key: 'size', value: '۱۶۰' },
    { key: 'finish', value: 'روکش وکیوم' },
  ],
  priceDeltaRials: 85_000_000,
};

describe('buildCartLine', () => {
  it('snapshots base + variant delta as unit price', () => {
    const ln = buildCartLine(product, variant, 1);
    expect(ln.unitPriceRials).toBe(385_000_000);
  });

  it('builds a stable key from product + variant id', () => {
    expect(buildCartLine(product, variant).key).toBe('10:99');
    expect(buildCartLine(product, null).key).toBe('10:base');
  });

  it('composes a variant label from axis values when label is absent', () => {
    expect(buildCartLine(product, variant).variantLabel).toBe('۱۶۰ · روکش وکیوم');
  });

  it('prefers the variant explicit label when present', () => {
    const labelled = { ...variant, label: 'برچسب دستی' };
    expect(buildCartLine(product, labelled).variantLabel).toBe('برچسب دستی');
  });

  it('falls back to product price/sku/gallery for single-SKU products', () => {
    const ln = buildCartLine(product, null);
    expect(ln.unitPriceRials).toBe(300_000_000);
    expect(ln.sku).toBe('IRON-BED');
    expect(ln.thumbnailUrl).toBe('/img/iron.webp');
    expect(ln.variantLabel).toBeNull();
  });

  it('carries qty and lead time', () => {
    const ln = buildCartLine(product, variant, 3);
    expect(ln.qty).toBe(3);
    expect(ln.leadTimeDays).toBe(56);
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `pnpm -C apps/web test -- src/lib/cart/__tests__/from-product.test.ts`
Expected: FAIL — `Cannot find module '../from-product'`.

- [ ] **Step 3: Implement buildCartLine**

Create `apps/web/src/lib/cart/from-product.ts`:

```ts
import type { PayloadProduct, PayloadProductVariant } from '@/lib/payload';
import { variantPriceRials } from '@/lib/variant-helpers';
import { lineKey } from './cart-math';
import type { CartLine } from './types';

export function buildCartLine(
  product: PayloadProduct,
  variant: PayloadProductVariant | null,
  qty = 1,
): CartLine {
  const variantId = variant?.id ?? null;
  const unitPriceRials = variantPriceRials(product.basePriceRials ?? 0, variant);
  const thumb = variant?.image ?? product.gallery?.[0] ?? null;
  const variantLabel =
    variant?.label ??
    (variant && variant.axes.length > 0
      ? variant.axes.map((a) => a.value).join(' · ')
      : null);

  return {
    key: lineKey(product.id, variantId),
    productId: product.id,
    slug: product.slug,
    name: product.name,
    variantId,
    variantLabel,
    sku: variant?.sku ?? product.sku ?? null,
    unitPriceRials,
    qty,
    thumbnailUrl: thumb?.url ?? null,
    thumbnailAlt: thumb?.alt ?? product.name,
    leadTimeDays: product.leadTimeDays ?? null,
  };
}
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `pnpm -C apps/web test -- src/lib/cart/__tests__/from-product.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/cart/from-product.ts apps/web/src/lib/cart/__tests__/from-product.test.ts
git commit -m "feat(cart): buildCartLine snapshot helper"
```

---

## Task 3: CartProvider + useCart + localStorage persistence

**Files:**
- Create: `apps/web/src/lib/cart/CartContext.tsx`
- Test: `apps/web/src/lib/cart/__tests__/CartContext.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/lib/cart/__tests__/CartContext.test.tsx`:

```tsx
/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from 'vitest';
import { act, render } from '@testing-library/react';
import { CartProvider, useCart } from '../CartContext';
import type { CartLine } from '../types';

const line = (over: Partial<CartLine> = {}): CartLine => ({
  key: 'p1:base',
  productId: 1,
  slug: 's',
  name: 'تخت',
  variantId: null,
  variantLabel: null,
  sku: null,
  unitPriceRials: 10_000_000,
  qty: 1,
  thumbnailUrl: null,
  thumbnailAlt: null,
  leadTimeDays: null,
  ...over,
});

let api: ReturnType<typeof useCart>;
function Probe() {
  api = useCart();
  return null;
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('CartProvider', () => {
  it('starts empty with no seed', () => {
    render(
      <CartProvider>
        <Probe />
      </CartProvider>,
    );
    expect(api.count).toBe(0);
    expect(api.subtotalRials).toBe(0);
  });

  it('addItem adds, opens the drawer, and updates derived totals', () => {
    render(
      <CartProvider>
        <Probe />
      </CartProvider>,
    );
    act(() => api.addItem(line({ unitPriceRials: 385_000_000 })));
    expect(api.count).toBe(1);
    expect(api.subtotalRials).toBe(385_000_000);
    expect(api.isOpen).toBe(true);
  });

  it('persists lines to localStorage', () => {
    render(
      <CartProvider>
        <Probe />
      </CartProvider>,
    );
    act(() => api.addItem(line()));
    const raw = window.localStorage.getItem('zhic-cart-v1');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!)).toHaveLength(1);
  });

  it('updateQty and removeItem work', () => {
    render(
      <CartProvider>
        <Probe />
      </CartProvider>,
    );
    act(() => api.addItem(line({ key: 'k' })));
    act(() => api.updateQty('k', 5));
    expect(api.count).toBe(5);
    act(() => api.removeItem('k'));
    expect(api.count).toBe(0);
  });

  it('seeds from initialItems and does not read storage', () => {
    window.localStorage.setItem('zhic-cart-v1', JSON.stringify([line({ key: 'stored' })]));
    render(
      <CartProvider initialItems={[line({ key: 'seed', qty: 2 })]}>
        <Probe />
      </CartProvider>,
    );
    expect(api.count).toBe(2);
    expect(api.lines[0]!.key).toBe('seed');
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `pnpm -C apps/web test -- src/lib/cart/__tests__/CartContext.test.tsx`
Expected: FAIL — `Cannot find module '../CartContext'`.

- [ ] **Step 3: Implement CartProvider**

Create `apps/web/src/lib/cart/CartContext.tsx`:

```tsx
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { CartLine } from './types';
import {
  addLine,
  cartCount,
  cartSubtotalRials,
  removeLine,
  setQty,
} from './cart-math';

const STORAGE_KEY = 'zhic-cart-v1';

type CartCtx = {
  lines: CartLine[];
  count: number;
  subtotalRials: number;
  isOpen: boolean;
  addItem: (line: CartLine) => void;
  updateQty: (key: string, qty: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
};

const Context = createContext<CartCtx | null>(null);

function readStorage(): CartLine[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartLine[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({
  children,
  initialItems,
}: {
  children: ReactNode;
  initialItems?: CartLine[];
}) {
  const [lines, setLines] = useState<CartLine[]>(initialItems ?? []);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(Boolean(initialItems));

  // Hydrate from localStorage on mount, unless explicitly seeded (lab/tests).
  useEffect(() => {
    if (initialItems) return;
    setLines(readStorage());
    setHydrated(true);
  }, [initialItems]);

  // Persist only after hydration so the initial empty render never clobbers
  // stored lines before they are read.
  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* storage disabled or over quota — cart still works in-memory */
    }
  }, [lines, hydrated]);

  const value = useMemo<CartCtx>(
    () => ({
      lines,
      count: cartCount(lines),
      subtotalRials: cartSubtotalRials(lines),
      isOpen,
      addItem: (line) => {
        setLines((prev) => addLine(prev, line));
        setIsOpen(true);
      },
      updateQty: (key, qty) => setLines((prev) => setQty(prev, key, qty)),
      removeItem: (key) => setLines((prev) => removeLine(prev, key)),
      clear: () => setLines([]),
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
    }),
    [lines, isOpen],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useCart(): CartCtx {
  const v = useContext(Context);
  if (!v) throw new Error('useCart must be used inside CartProvider');
  return v;
}
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `pnpm -C apps/web test -- src/lib/cart/__tests__/CartContext.test.tsx`
Expected: PASS (5 tests). Note: with the `initialItems` seed, `hydrated` starts `true` so the seed persists and storage is not read — matching the last test.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/cart/CartContext.tsx apps/web/src/lib/cart/__tests__/CartContext.test.tsx
git commit -m "feat(cart): CartProvider with localStorage persistence + drawer state"
```

---

## Task 4: Shared CartLineRow component

**Files:**
- Create: `apps/web/src/components/cart/CartLineRow.tsx`
- Create: `apps/web/src/components/cart/CartLineRow.module.css`

- [ ] **Step 1: Write the component**

Create `apps/web/src/components/cart/CartLineRow.tsx`:

```tsx
'use client';

import Image from 'next/image';
import { formatMoney } from '@zhic/money';
import { toPersianDigits } from '@zhic/locale';
import { useCart } from '@/lib/cart/CartContext';
import type { CartLine } from '@/lib/cart/types';
import styles from './CartLineRow.module.css';

export function CartLineRow({ line }: { line: CartLine }) {
  const { updateQty, removeItem } = useCart();

  return (
    <div className={styles.row}>
      <div className={styles.thumb}>
        {line.thumbnailUrl ? (
          <Image src={line.thumbnailUrl} alt={line.thumbnailAlt ?? ''} fill sizes="72px" />
        ) : null}
      </div>

      <div className={styles.main}>
        <p className={styles.name}>{line.name}</p>
        {line.variantLabel ? <p className={styles.variant}>{line.variantLabel}</p> : null}
        {line.leadTimeDays ? (
          <p className={styles.lead}>{toPersianDigits(line.leadTimeDays)} روز کاری تا تحویل</p>
        ) : null}

        <div className={styles.bottom}>
          <div className={styles.qty}>
            <button type="button" aria-label="کاهش" onClick={() => updateQty(line.key, line.qty - 1)}>
              −
            </button>
            <span>{toPersianDigits(line.qty)}</span>
            <button type="button" aria-label="افزایش" onClick={() => updateQty(line.key, line.qty + 1)}>
              +
            </button>
          </div>
          <span className={styles.price} dir="ltr">
            {formatMoney(line.unitPriceRials * line.qty, { suffix: 'toman' })}
          </span>
        </div>
      </div>

      <button
        type="button"
        className={styles.del}
        aria-label="حذف"
        onClick={() => removeItem(line.key)}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
        </svg>
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Write the styles**

Create `apps/web/src/components/cart/CartLineRow.module.css`:

```css
.row {
  display: flex;
  gap: 2.8cqw;
  padding: 2.8cqw 0;
  border-bottom: 1px solid var(--color-divider-ink);
}

.thumb {
  position: relative;
  flex: none;
  width: 16.7cqw;
  height: 16.7cqw;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-cream);
}

.main {
  flex: 1;
  min-width: 0;
}

.name {
  margin: 0 0 0.4cqw;
  font-weight: 700;
  font-size: 3.3cqw;
  color: var(--color-ink);
}

.variant {
  margin: 0 0 1.2cqw;
  font-size: 2.8cqw;
  color: var(--color-stone);
}

.lead {
  margin: 0 0 2cqw;
  font-size: 2.7cqw;
  color: var(--color-forest);
}

.bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2cqw;
}

.qty {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--color-sand);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.qty button {
  width: 7cqw;
  height: 7cqw;
  border: none;
  background: transparent;
  font-size: 3.6cqw;
  color: var(--color-ink);
  cursor: pointer;
}

.qty span {
  min-width: 7cqw;
  text-align: center;
  font-size: 3.1cqw;
  font-weight: 700;
}

.price {
  font-size: 3.2cqw;
  font-weight: 700;
  white-space: nowrap;
  color: var(--color-ink);
}

.del {
  flex: none;
  align-self: flex-start;
  border: none;
  background: transparent;
  color: var(--color-stone);
  cursor: pointer;
  padding: 0.5cqw;
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm -C apps/web typecheck`
Expected: PASS (no errors in the new files).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/cart/CartLineRow.tsx apps/web/src/components/cart/CartLineRow.module.css
git commit -m "feat(cart): shared CartLineRow (thumb, variant, lead time, qty, remove)"
```

---

## Task 5: CartPageBody + empty state (with render test)

**Files:**
- Create: `apps/web/src/components/cart/CartPageBody.tsx`
- Create: `apps/web/src/components/cart/CartPageBody.module.css`
- Test: `apps/web/src/components/cart/__tests__/CartPageBody.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/components/cart/__tests__/CartPageBody.test.tsx`:

```tsx
/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { CartProvider } from '@/lib/cart/CartContext';
import { CartPageBody } from '../CartPageBody';
import type { CartLine } from '@/lib/cart/types';

const seed: CartLine[] = [
  {
    key: '1:10',
    productId: 1,
    slug: 'iron-bed',
    name: 'تخت‌خواب آیرون',
    variantId: 10,
    variantLabel: 'سایز ۱۶۰',
    sku: 'IRON-160',
    unitPriceRials: 385_000_000,
    qty: 1,
    thumbnailUrl: null,
    thumbnailAlt: null,
    leadTimeDays: 56,
  },
];

describe('<CartPageBody>', () => {
  it('renders the empty state when there are no lines', () => {
    const { container } = render(
      <CartProvider initialItems={[]}>
        <CartPageBody />
      </CartProvider>,
    );
    expect(container.textContent).toContain('سبد خرید شما خالی است');
  });

  it('renders one row per line and a checkout CTA when populated', () => {
    const { container } = render(
      <CartProvider initialItems={seed}>
        <CartPageBody />
      </CartProvider>,
    );
    expect(container.textContent).toContain('تخت‌خواب آیرون');
    const cta = container.querySelector('a[href="/checkout"]');
    expect(cta?.textContent).toContain('ادامه و تسویه حساب');
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `pnpm -C apps/web test -- src/components/cart/__tests__/CartPageBody.test.tsx`
Expected: FAIL — `Cannot find module '../CartPageBody'`.

- [ ] **Step 3: Implement CartPageBody**

Create `apps/web/src/components/cart/CartPageBody.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { formatMoney } from '@zhic/money';
import { toPersianDigits } from '@zhic/locale';
import { useCart } from '@/lib/cart/CartContext';
import { CartLineRow } from './CartLineRow';
import styles from './CartPageBody.module.css';

export function CartPageBody() {
  const { lines, count, subtotalRials } = useCart();

  if (count === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>سبد خرید شما خالی است</p>
        <Link href="/bedroom-furniture" className={styles.emptyCta}>
          مشاهده‌ی محصولات
        </Link>
      </div>
    );
  }

  const total = formatMoney(subtotalRials, { suffix: 'toman' });

  return (
    <div className={styles.wrap}>
      <header className={styles.head}>
        <span className={styles.title}>سبد خرید</span>
        <span className={styles.count}>{toPersianDigits(count)} کالا</span>
      </header>

      <div className={styles.list}>
        {lines.map((l) => (
          <CartLineRow key={l.key} line={l} />
        ))}
      </div>

      <div className={styles.summary}>
        <div className={styles.row}>
          <span>جمع جزء ({toPersianDigits(count)} کالا)</span>
          <b dir="ltr">{total}</b>
        </div>
        <div className={styles.row}>
          <span>هزینه‌ی ارسال</span>
          <span className={styles.muted}>در مرحله‌ی بعد محاسبه می‌شود</span>
        </div>
        <div className={`${styles.row} ${styles.total}`}>
          <span>جمع کل</span>
          <b dir="ltr">{total}</b>
        </div>
        <Link href="/checkout" className={styles.cta}>
          ادامه و تسویه حساب
        </Link>
        <p className={styles.note}>ابتدا با شماره‌ی موبایل وارد می‌شوید</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Write the styles**

Create `apps/web/src/components/cart/CartPageBody.module.css`:

```css
.wrap {
  width: 100%;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2cqw;
}

.title {
  font-weight: 900;
  font-size: 4.2cqw;
  color: var(--color-ink);
}

.count {
  font-size: 2.8cqw;
  color: var(--color-stone);
}

.list {
  margin-bottom: 3cqw;
}

.summary {
  background: var(--color-cream);
  border-radius: var(--radius-card);
  padding: 3.2cqw;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 3cqw;
  color: var(--color-stone);
  margin-bottom: 2.1cqw;
}

.muted {
  color: var(--color-stone);
}

.total {
  margin: 0.7cqw 0 0;
  padding-top: 2.6cqw;
  border-top: 1px solid var(--color-sand);
  font-size: 3.5cqw;
  color: var(--color-ink);
}

.total b {
  font-size: 3.7cqw;
}

.cta {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 3.2cqw;
  padding: 3cqw;
  border-radius: var(--radius-md);
  background: var(--color-forest);
  color: var(--color-ivory);
  font-weight: 700;
  font-size: 3.4cqw;
  text-decoration: none;
}

.note {
  margin: 2.4cqw 0 0;
  text-align: center;
  font-size: 2.7cqw;
  color: var(--color-stone);
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4cqw;
  padding: 18cqw 0;
  text-align: center;
}

.emptyTitle {
  margin: 0;
  font-size: 3.6cqw;
  color: var(--color-stone);
}

.emptyCta {
  padding: 2.6cqw 6cqw;
  border-radius: var(--radius-md);
  background: var(--color-forest);
  color: var(--color-ivory);
  font-weight: 700;
  font-size: 3.2cqw;
  text-decoration: none;
}
```

- [ ] **Step 5: Run the test, verify it passes**

Run: `pnpm -C apps/web test -- src/components/cart/__tests__/CartPageBody.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/cart/CartPageBody.tsx apps/web/src/components/cart/CartPageBody.module.css apps/web/src/components/cart/__tests__/CartPageBody.test.tsx
git commit -m "feat(cart): /cart page body with empty state"
```

---

## Task 6: CartDrawer (slide-over)

**Files:**
- Create: `apps/web/src/components/cart/CartDrawer.tsx`
- Create: `apps/web/src/components/cart/CartDrawer.module.css`

- [ ] **Step 1: Write the component**

Create `apps/web/src/components/cart/CartDrawer.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { formatMoney } from '@zhic/money';
import { useCart } from '@/lib/cart/CartContext';
import { CartLineRow } from './CartLineRow';
import styles from './CartDrawer.module.css';

export function CartDrawer() {
  const { lines, count, subtotalRials, isOpen, closeCart } = useCart();

  return (
    <div className={`${styles.root} ${isOpen ? styles.open : ''}`} aria-hidden={!isOpen}>
      <button type="button" className={styles.scrim} aria-label="بستن سبد خرید" tabIndex={isOpen ? 0 : -1} onClick={closeCart} />
      <aside className={styles.panel} role="dialog" aria-modal="true" aria-label="سبد خرید">
        <header className={styles.head}>
          <span className={styles.title}>سبد خرید</span>
          <button type="button" className={styles.close} aria-label="بستن" onClick={closeCart}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        {count === 0 ? (
          <div className={styles.empty}>سبد خرید شما خالی است</div>
        ) : (
          <>
            <div className={styles.list}>
              {lines.map((l) => (
                <CartLineRow key={l.key} line={l} />
              ))}
            </div>
            <footer className={styles.foot}>
              <div className={styles.sub}>
                <span>جمع جزء</span>
                <b dir="ltr">{formatMoney(subtotalRials, { suffix: 'toman' })}</b>
              </div>
              <Link href="/cart" className={styles.cta} onClick={closeCart}>
                مشاهده‌ی سبد و تسویه
              </Link>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
```

- [ ] **Step 2: Write the styles**

Create `apps/web/src/components/cart/CartDrawer.module.css`. Note: this overlay is viewport-fixed (not inside the 430 column), so use px/rem, not `cqw`.

```css
.root {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal, 60);
  pointer-events: none;
}

.scrim {
  position: absolute;
  inset: 0;
  border: none;
  padding: 0;
  background: var(--color-overlay);
  opacity: 0;
  transition: opacity var(--dur-hover, 200ms) ease;
}

.panel {
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  width: min(420px, 90vw);
  display: flex;
  flex-direction: column;
  background: var(--color-ivory);
  box-shadow: var(--shadow-modal);
  transform: translateX(-100%);
  transition: transform var(--dur-panel, 280ms) ease;
}

.root.open {
  pointer-events: auto;
}

.root.open .scrim {
  opacity: 1;
}

.root.open .panel {
  transform: translateX(0);
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid var(--color-divider-ink);
}

.title {
  font-weight: 700;
  font-size: 16px;
  color: var(--color-ink);
}

.close {
  border: none;
  background: transparent;
  color: var(--color-stone);
  cursor: pointer;
}

.list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 18px;
}

.foot {
  border-top: 1px solid var(--color-divider-ink);
  padding: 16px 18px;
}

.sub {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  color: var(--color-stone);
  margin-bottom: 12px;
}

.sub b {
  color: var(--color-ink);
}

.cta {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 13px;
  border-radius: var(--radius-md);
  background: var(--color-forest);
  color: var(--color-ivory);
  font-weight: 700;
  font-size: 14px;
  text-decoration: none;
}

.empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 18px;
  color: var(--color-stone);
  font-size: 14px;
}
```

> The drawer `inset-inline-start: 0` + `translateX(-100%)` resolves, in RTL, to a panel anchored on the visual right that slides in from the right edge.

- [ ] **Step 3: Typecheck**

Run: `pnpm -C apps/web typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/cart/CartDrawer.tsx apps/web/src/components/cart/CartDrawer.module.css
git commit -m "feat(cart): slide-over CartDrawer"
```

---

## Task 7: HeaderCartButton + render test

**Files:**
- Create: `apps/web/src/components/cart/HeaderCartButton.tsx`
- Test: `apps/web/src/components/cart/__tests__/HeaderCartButton.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/components/cart/__tests__/HeaderCartButton.test.tsx`:

```tsx
/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { CartProvider } from '@/lib/cart/CartContext';
import { HeaderCartButton } from '../HeaderCartButton';
import type { CartLine } from '@/lib/cart/types';

const line = (qty: number): CartLine => ({
  key: 'k',
  productId: 1,
  slug: 's',
  name: 'n',
  variantId: null,
  variantLabel: null,
  sku: null,
  unitPriceRials: 10_000_000,
  qty,
  thumbnailUrl: null,
  thumbnailAlt: null,
  leadTimeDays: null,
});

describe('<HeaderCartButton>', () => {
  it('hides the badge when the cart is empty', () => {
    const { container } = render(
      <CartProvider initialItems={[]}>
        <HeaderCartButton />
      </CartProvider>,
    );
    expect(container.querySelector('[data-cart-badge]')).toBeNull();
  });

  it('shows the Persian-digit count when populated', () => {
    const { container } = render(
      <CartProvider initialItems={[line(3)]}>
        <HeaderCartButton />
      </CartProvider>,
    );
    const badge = container.querySelector('[data-cart-badge]');
    expect(badge?.textContent).toBe('۳');
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `pnpm -C apps/web test -- src/components/cart/__tests__/HeaderCartButton.test.tsx`
Expected: FAIL — `Cannot find module '../HeaderCartButton'`.

- [ ] **Step 3: Implement HeaderCartButton**

Create `apps/web/src/components/cart/HeaderCartButton.tsx`:

```tsx
'use client';

import { toPersianDigits } from '@zhic/locale';
import { useCart } from '@/lib/cart/CartContext';

export function HeaderCartButton() {
  const { count, openCart } = useCart();

  return (
    <button
      type="button"
      aria-label="سبد خرید"
      onClick={openCart}
      className="relative inline-flex h-7 w-7 items-center justify-center rounded-full text-stone transition-colors duration-[var(--dur-hover)] hover:bg-sand/40 hover:text-ink md:h-8 md:w-8"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className="h-[18px] w-[18px]"
      >
        <circle cx="9" cy="20" r="1.4" />
        <circle cx="18" cy="20" r="1.4" />
        <path d="M2.5 3.5h2l2.2 11.2a1.5 1.5 0 0 0 1.5 1.2h8.2a1.5 1.5 0 0 0 1.5-1.2L21 7H6" />
      </svg>
      {count > 0 ? (
        <span
          data-cart-badge
          className="absolute -top-1 -end-1 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-forest px-[3px] text-[10px] font-bold leading-none text-ivory"
        >
          {toPersianDigits(count)}
        </span>
      ) : null}
    </button>
  );
}
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `pnpm -C apps/web test -- src/components/cart/__tests__/HeaderCartButton.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/cart/HeaderCartButton.tsx apps/web/src/components/cart/__tests__/HeaderCartButton.test.tsx
git commit -m "feat(cart): header cart button with count badge"
```

---

## Task 8: Add-to-cart on the PDP (PickerBar + InquiryHandler)

**Files:**
- Modify: `apps/web/src/components/product/PickerBar.tsx`
- Modify: `apps/web/src/components/product/PickerBar.module.css`
- Modify: `apps/web/src/components/product/InquiryHandler.tsx`
- Modify: `apps/web/src/components/product/__tests__/PickerBar.test.tsx`

- [ ] **Step 1: Write the failing test (extend PickerBar tests)**

Add these imports and tests to `apps/web/src/components/product/__tests__/PickerBar.test.tsx`. Add `fireEvent` and `vi` to the existing imports from their packages:

```tsx
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
```

Append inside the existing `describe('<PickerBar>', () => { ... })` block:

```tsx
  it('renders the primary add-to-cart button', () => {
    const { container } = render(
      <Wrap>
        <PickerBar product={product} variants={variants} allowedAxes={['size', 'footboard']} />
      </Wrap>,
    );
    const buttons = Array.from(container.querySelectorAll('button[type="button"]'));
    const addBtn = buttons.find((b) => b.textContent?.includes('افزودن به سبد خرید'));
    expect(addBtn).toBeTruthy();
  });

  it('calls onAddToCart with the selected variant', () => {
    const onAddToCart = vi.fn();
    const { container } = render(
      <Wrap initial={variants[2]!}>
        <PickerBar
          product={product}
          variants={variants}
          allowedAxes={['size', 'footboard']}
          onAddToCart={onAddToCart}
        />
      </Wrap>,
    );
    const buttons = Array.from(container.querySelectorAll('button[type="button"]'));
    const addBtn = buttons.find((b) => b.textContent?.includes('افزودن به سبد خرید'))!;
    fireEvent.click(addBtn);
    expect(onAddToCart).toHaveBeenCalledTimes(1);
    expect(onAddToCart.mock.calls[0]![0]).toEqual({ variant: variants[2] });
  });
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `pnpm -C apps/web test -- src/components/product/__tests__/PickerBar.test.tsx`
Expected: FAIL — the add-to-cart button does not exist yet.

- [ ] **Step 3: Add the prop + handler + button to PickerBar**

In `apps/web/src/components/product/PickerBar.tsx`:

(a) Extend `PickerBarProps` (after the existing `onInquiry` field):

```tsx
  onAddToCart?: (payload: { variant: PayloadProductVariant | null }) => void;
```

(b) Add the handler next to the existing `handleInquiry` (around line 113):

```tsx
  const handleAddToCart = () => {
    onAddToCart?.({ variant: selectedVariant });
  };
```

(c) Ensure `onAddToCart` is destructured from props alongside `onInquiry`.

(d) Replace the single CTA button (lines ~195–197) inside `.right` with both buttons, primary first:

```tsx
<div className={styles.ctas}>
  <button type="button" className={styles.ctaPrimary} onClick={handleAddToCart}>
    افزودن به سبد خرید
  </button>
  <button type="button" className={styles.ctaSecondary} onClick={handleInquiry}>
    استعلام قیمت
  </button>
</div>
```

- [ ] **Step 4: Add CTA styles**

In `apps/web/src/components/product/PickerBar.module.css`, add (and keep the old `.cta` rules as a base if `ctaSecondary` reuses them — otherwise duplicate the needed properties):

```css
.ctas {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

.ctaPrimary {
  border: none;
  border-radius: var(--radius-md);
  background: var(--color-forest);
  color: var(--color-ivory);
  font-weight: 700;
  font-size: 14px;
  padding: 0 18px;
  min-height: 40px;
  cursor: pointer;
  white-space: nowrap;
}

.ctaSecondary {
  border: 1px solid var(--color-sand);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-charcoal);
  font-weight: 400;
  font-size: 13px;
  padding: 0 14px;
  min-height: 40px;
  cursor: pointer;
  white-space: nowrap;
}
```

- [ ] **Step 5: Wire the cart in InquiryHandler**

Replace `apps/web/src/components/product/InquiryHandler.tsx` with:

```tsx
'use client';

import { PickerBar, type PickerBarProps } from './PickerBar';
import { useCart } from '@/lib/cart/CartContext';
import { buildCartLine } from '@/lib/cart/from-product';

type Props = Omit<PickerBarProps, 'onInquiry' | 'onAddToCart'> & { thankYouPath?: string };

export function InquiryHandler({ thankYouPath: _thankYouPath = '/thank-you', product, variants, allowedAxes }: Props) {
  const { addItem } = useCart();

  const submitInquiry: NonNullable<PickerBarProps['onInquiry']> = async (payload) => {
    const params = new URLSearchParams();
    params.set('product', String(payload.productId));
    if (payload.variantId !== null) params.set('variant', String(payload.variantId));
    for (const [k, v] of Object.entries(payload.selectedAxes)) params.set(`axis_${k}`, v);
    window.location.assign(`/contact?${params.toString()}`);
  };

  const handleAddToCart: NonNullable<PickerBarProps['onAddToCart']> = ({ variant }) => {
    addItem(buildCartLine(product, variant, 1));
  };

  return (
    <PickerBar
      product={product}
      variants={variants}
      allowedAxes={allowedAxes}
      onInquiry={submitInquiry}
      onAddToCart={handleAddToCart}
    />
  );
}
```

- [ ] **Step 6: Run PickerBar tests + typecheck**

Run: `pnpm -C apps/web test -- src/components/product/__tests__/PickerBar.test.tsx`
Expected: PASS (original 4 tests + 2 new). The pre-existing "shows the CTA always … استعلام قیمت" test still passes because the secondary button keeps that label.

Run: `pnpm -C apps/web typecheck`
Expected: PASS. (`InquiryHandler` now uses `useCart`, which requires a `CartProvider` ancestor at runtime — provided by the `(site)` layout in Task 9.)

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/product/PickerBar.tsx apps/web/src/components/product/PickerBar.module.css apps/web/src/components/product/InquiryHandler.tsx apps/web/src/components/product/__tests__/PickerBar.test.tsx
git commit -m "feat(cart): add-to-cart primary CTA on PDP, inquiry secondary"
```

---

## Task 9: Mount CartProvider + CartDrawer in the (site) layout

**Files:**
- Modify: `apps/web/src/app/(site)/layout.tsx`
- Modify: `apps/web/src/components/layout/SiteHeader.tsx`

- [ ] **Step 1: Wrap the shell in CartProvider and mount the drawer**

Replace the body of `apps/web/src/app/(site)/layout.tsx` so the fragment is wrapped (header, main, footer, drawer all inside one provider):

```tsx
import { SkipLink } from '@zhic/ui';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { IntroSplash } from '@/components/layout/IntroSplash';
import { CartProvider } from '@/lib/cart/CartContext';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { fetchNavMeta, fetchSiteConfig } from '@/lib/payload';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [navMeta, siteConfig] = await Promise.all([fetchNavMeta(), fetchSiteConfig()]);
  return (
    <CartProvider>
      <IntroSplash />
      <SkipLink />
      <SiteHeader navMeta={navMeta} socials={siteConfig?.socials ?? undefined} />
      <main id="main">{children}</main>
      <SiteFooter siteConfig={siteConfig} />
      <CartDrawer />
    </CartProvider>
  );
}
```

- [ ] **Step 2: Add the cart button to SiteHeader**

In `apps/web/src/components/layout/SiteHeader.tsx`:

(a) Add the import near the other component imports:

```tsx
import { HeaderCartButton } from '@/components/cart/HeaderCartButton';
```

(b) In the column-3 icons div (`<div className="flex items-center gap-1 justify-self-end">`), render the cart button before the search button:

```tsx
<div className="flex items-center gap-1 justify-self-end">
  <HeaderCartButton />
  {/* existing search button stays here, unchanged */}
```

- [ ] **Step 3: Build to verify the wiring**

Run: `pnpm -C apps/web typecheck`
Expected: PASS.

Run: `pnpm -C apps/web lint`
Expected: PASS (no new lint errors in touched files).

- [ ] **Step 4: Commit**

```bash
git add "apps/web/src/app/(site)/layout.tsx" apps/web/src/components/layout/SiteHeader.tsx
git commit -m "feat(cart): mount CartProvider + drawer in site layout, header cart icon"
```

---

## Task 10: The /cart route

**Files:**
- Create: `apps/web/src/app/(site)/cart/page.tsx`

- [ ] **Step 1: Create the route**

Create `apps/web/src/app/(site)/cart/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { CartPageBody } from '@/components/cart/CartPageBody';

export const metadata: Metadata = {
  title: 'سبد خرید',
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <div className="mx-auto w-full max-w-[430px]" style={{ containerType: 'inline-size' }}>
      <div className="px-4 pb-12 pt-[calc(var(--header-height)+var(--space-5))]">
        <CartPageBody />
      </div>
    </div>
  );
}
```

> `robots: noindex` matches the existing `robots.ts` disallow of `/cart`.

- [ ] **Step 2: Typecheck**

Run: `pnpm -C apps/web typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add "apps/web/src/app/(site)/cart/page.tsx"
git commit -m "feat(cart): /cart route"
```

---

## Task 11: /lab/cart preview + fix /lab/site-header

**Files:**
- Create: `apps/web/src/app/lab/cart/page.tsx`
- Modify: `apps/web/src/app/lab/site-header/page.tsx`

- [ ] **Step 1: Create the lab preview**

Create `apps/web/src/app/lab/cart/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { CartProvider } from '@/lib/cart/CartContext';
import { CartPageBody } from '@/components/cart/CartPageBody';
import { CartDrawer } from '@/components/cart/CartDrawer';
import type { CartLine } from '@/lib/cart/types';

export const metadata: Metadata = {
  title: 'Lab — cart',
  robots: { index: false, follow: false },
};

const SEED: CartLine[] = [
  {
    key: '1:10',
    productId: 1,
    slug: 'iron-bed',
    name: 'تخت‌خواب آیرون',
    variantId: 10,
    variantLabel: 'سایز ۱۶۰ · روکش وکیوم',
    sku: 'IRON-BED-160',
    unitPriceRials: 385_000_000,
    qty: 1,
    thumbnailUrl: null,
    thumbnailAlt: 'تخت‌خواب آیرون',
    leadTimeDays: 56,
  },
  {
    key: '2:20',
    productId: 2,
    slug: 'iron-nightstand',
    name: 'پاتختی آیرون',
    variantId: 20,
    variantLabel: 'روکش وکیوم',
    sku: 'IRON-NS',
    unitPriceRials: 92_000_000,
    qty: 2,
    thumbnailUrl: null,
    thumbnailAlt: 'پاتختی آیرون',
    leadTimeDays: 56,
  },
];

export default function LabCartPage() {
  return (
    <main className="min-h-screen bg-ivory">
      <div className="mx-auto w-full max-w-[430px]" style={{ containerType: 'inline-size' }}>
        <CartProvider initialItems={SEED}>
          <div className="px-4 pb-12 pt-6">
            <CartPageBody />
          </div>
          <CartDrawer />
        </CartProvider>
      </div>
    </main>
  );
}
```

> Seed prices are in rials (toman ×10): 385,000,000 rials = ۳۸٬۵۰۰٬۰۰۰ تومان; nightstand ×2 = ۱۸٬۴۰۰٬۰۰۰; subtotal = ۵۶٬۹۰۰٬۰۰۰ تومان — matching the approved mockup.

- [ ] **Step 2: Wrap /lab/site-header in CartProvider**

`SiteHeader` now renders `<HeaderCartButton/>`, which calls `useCart()` and throws without a provider. Update `apps/web/src/app/lab/site-header/page.tsx` to wrap the rendered `<SiteHeader .../>` in `<CartProvider>`:

```tsx
import { CartProvider } from '@/lib/cart/CartContext';
```

Wrap the existing `<SiteHeader ... />` element:

```tsx
<CartProvider>
  <SiteHeader /* existing props unchanged */ />
</CartProvider>
```

- [ ] **Step 3: Typecheck + run full web test suite**

Run: `pnpm -C apps/web typecheck`
Expected: PASS.

Run: `pnpm -C apps/web test`
Expected: PASS for all new cart tests + updated PickerBar tests. (Pre-existing unrelated failures noted in `docs/state.md`, e.g. a lone `StatBlock` test, are not caused by this work — confirm any failure predates these changes before treating it as a regression.)

- [ ] **Step 4: Manual visual check (optional but recommended)**

```bash
rm -rf apps/web/.next/cache
pnpm -C apps/web dev
```
Open `/lab/cart` — confirm two line items, qty steppers change totals, remove works, the «مشاهده‌ی سبد و تسویه» / «ادامه و تسویه حساب» CTAs render, and the empty state shows after removing all items. On a real PDP (`/products/<slug>`), confirm «افزودن به سبد خرید» adds an item, the drawer slides in, and the header badge increments.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/lab/cart/page.tsx apps/web/src/app/lab/site-header/page.tsx
git commit -m "feat(cart): /lab/cart preview; wrap /lab/site-header in CartProvider"
```

---

## Task 12: Update the status board

**Files:**
- Modify: `docs/state.md`

- [ ] **Step 1: Add a session entry**

Add a dated row to the session log in `docs/state.md` summarizing: Plan 1 (Cart) of the storefront-commerce front-end-first series shipped on branch `feat/journal-rebuild` (or the active branch) — `CartProvider` (localStorage `zhic-cart-v1`), header cart icon, add-to-cart on PDP (primary; inquiry secondary), slide-over drawer, `/cart` page + empty state, `/lab/cart` preview; no backend (cart is client-only, orders/checkout not yet built). Note the plan path `docs/superpowers/plans/2026-06-25-storefront-commerce-cart.md` and that Plans 2–5 (auth gate, checkout, payment, account) remain. Reaffirm that this is ahead of the Package-1 phase but built front-end-first per operator decision 2026-06-25.

- [ ] **Step 2: Commit**

```bash
git add docs/state.md
git commit -m "docs(state): log cart (commerce plan 1) shipped"
```

---

## Self-Review

**Spec coverage (approved mockups → tasks):**
- Header cart icon + count → Task 7, Task 9. ✓
- Add-to-cart on PDP, «افزودن به سبد خرید» primary + «استعلام قیمت» secondary (decision الف) → Task 8. ✓
- Cart line: thumb, variant label, **per-item lead time**, qty stepper, line total, remove → Task 4. ✓
- Cart drawer (slide-over) → Task 6, mounted Task 9. ✓
- `/cart` page + order summary (shipping deferred, no VAT line, full total) + empty state → Task 5, Task 10. ✓
- Persistence across reloads → Task 3 (localStorage). ✓
- `/lab` preview per the project workflow → Task 11. ✓
- No deposit / no VAT in customer totals (decisions پ + VAT-deferred) → no such UI anywhere. ✓

**Placeholder scan:** No "TBD"/"add error handling"/"write tests for the above". Every code step shows complete code; every test step shows the assertions. ✓

**Type consistency:** `CartLine` shape is identical across `types.ts`, `cart-math`, `from-product`, `CartContext`, and all seeds/tests. `useCart()` returns the `CartCtx` used by `CartLineRow`, `CartDrawer`, `CartPageBody`, `HeaderCartButton`. `buildCartLine(product, variant, qty)` signature matches its call in `InquiryHandler`. `onAddToCart: ({ variant }) => void` matches PickerBar's `handleAddToCart` and the test's `{ variant: variants[2] }` assertion. ✓

**Known forward references (intentional, not gaps):** `/cart` → `/checkout` link 404s until Plan 3; the cart is fully functional without it.
