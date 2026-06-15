# Media Tagging Panel — M2 (Product-Occupancy Mode + `/bedroom-furniture` Age Filter) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** (a) Add a **product mode** to `/atelier/tag` that corrects per-product `products.occupancies` (today 224/270 over-broad "teen"), and (b) **wire the storefront** so product occupancy stops being latent — a single-value «گروه سنی» age filter on `/bedroom-furniture`.

**Architecture:** Reuse all of M1's foundation (auth gate, snapshot/apply/undo safety layer, dry-run preview, audit). **Generalize** the M1 tag code from designs-only to a collection-agnostic shape: `FieldChange.collection: 'designs' | 'products'`; `apply`/`undo` group/restore by collection; a new `buildProductDiff` + `loadProductState`; a `ProductMode` UI alongside `OccupancyMode` with a mode switcher. The storefront half is the minimal wiring the spec specifies: `FILTER_PARAM_KEYS` + parse `?age=` + pass to the **already-supported** `fetchProducts({occupancies})` + an age block in `CategoryFilterSidebar`, gated off promoted facet pages.

**Tech Stack:** Next 16 App Router / React 19 (`apps/web`); Payload 3.83 REST (`http://127.0.0.1:3001`); vitest 2.1.8. **Zero schema changes** (`products.occupancies` already exists). Ships with rebuild + pm2 restart.

**Spec:** `docs/superpowers/specs/2026-06-15-media-tagging-panel-design.md` (§5.2 product mode, §6 storefront wiring, M2 in §11).
**Builds on:** M1 (`docs/superpowers/plans/2026-06-15-media-tagging-panel-m1.md`, shipped commits `b1f2379…45bd2de`).

---

## Conventions (read once)

- **Test command:** `cd /home/ahmad/Zhic/apps/web && pnpm test -- <pattern>`. Logic tests mock `server-only`/`next/headers` (see M1 pattern in `auth.test.ts`).
- **Occupancy enum (reuse M1):** `Occupancy = 'baby'|'teen'|'double'|'bunk'`, `OCCUPANCIES`, `OCCUPANCY_FA = {baby:'نوزاد', teen:'نوجوان', double:'دونفره', bunk:'دوطبقه'}` — all already in `@/lib/tag/types`.
- **`products.occupancies`** is a hasMany select (`Products.ts:94`), values = the 4 occupancies. **`payloadPatch` already accepts `'products'`** (`payload-rest.ts`).
- **Storefront:** `ProductsQuery.occupancies` is **singular** (`payload.ts:544`), mapped to `where[occupancies][in]` (`payload.ts:873-876`) — already correct; do **not** widen to multi-select.
- **Build/ship:** `cd /home/ahmad/Zhic/apps/web && pnpm build && pm2 restart zhic-web --update-env`. Operator creds for smokes: `ahmadreza.torkaman@icloud.com` / `JesusChristDude`.
- **CATALOG-CLEAN RULE:** any change applied during a smoke MUST be reverted (undo endpoint or manual PATCH back to captured originals); verify clean at the end of every task that writes.

## File structure

**Modify (tag code — generalize):**
| File | Change |
|---|---|
| `lib/tag/types.ts` | `FieldChange.collection: 'designs'\|'products'`; add `ProductEdit`, `ProductState` |
| `lib/tag/ops.ts` | add `buildProductDiff` |
| `lib/tag/state.ts` | add `loadProductState` |
| `app/(internal)/api/tag/state/route.ts` | `?mode=product` branch |
| `app/(internal)/api/tag/preview/route.ts` | product-edits branch |
| `app/(internal)/api/tag/apply/route.ts` | group by collection (snapshot + patch + revalidate) |
| `app/(internal)/api/tag/undo/route.ts` | restore every collection file in the backup dir |
| `app/(internal)/atelier/tag/page.tsx` | mode switcher → OccupancyMode \| ProductMode |

**Create:**
| File | Responsibility |
|---|---|
| `app/(internal)/atelier/tag/ProductMode.tsx` | product occupancy UI + per-age count deltas |
| `app/(internal)/atelier/tag/ModeNav.tsx` | links: occupancy \| product |
| `lib/tag/__tests__/product-ops.test.ts` | `buildProductDiff` tests |

**Modify (storefront wiring):**
| File | Change |
|---|---|
| `app/(site)/bedroom-furniture/[...slug]/page.tsx` | `FILTER_PARAM_KEYS` + parse `age` + pass `occupancies` + sidebar prop, gated off facet pages |
| `lib/category-filter-url.ts` | `FILTER_KEYS` + `Override.age` |
| `lib/category-helpers.ts` | `FILTER_KEYS` (count `age`) |
| `components/category/CategoryFilterSidebar.tsx` | age filter group block |

---

## Task 1: Generalize `FieldChange` + add `buildProductDiff` (pure, TDD)

**Files:**
- Modify: `apps/web/src/lib/tag/types.ts`
- Modify: `apps/web/src/lib/tag/ops.ts`
- Test: `apps/web/src/lib/tag/__tests__/product-ops.test.ts`

- [ ] **Step 1: Generalize `FieldChange` and add product types in `types.ts`**

Replace the existing `FieldChange` (currently `collection: 'designs'`) and add product types. Find:
```ts
export type FieldChange = {
  collection: 'designs';
  id: number;
  field: 'occupancies' | 'occupancyMedia';
  before: unknown;
  after: unknown;
};
```
Replace with:
```ts
export type FieldChange = {
  collection: 'designs' | 'products';
  id: number;
  field: 'occupancies' | 'occupancyMedia';
  before: unknown;
  after: unknown;
};

/** The UI's intended occupancies for ONE product (product mode). */
export type ProductEdit = { productId: number; occupancies: Occupancy[] };
```
Then add (near the other state types):
```ts
export type ProductState = {
  productId: number;
  title: string;
  designSlug: string | null;
  designTitle: string | null;
  occupancies: Occupancy[];
};
```

- [ ] **Step 2: Write the failing test `__tests__/product-ops.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { buildProductDiff } from '../ops';
import type { ProductEdit } from '../types';

describe('buildProductDiff', () => {
  const current = { productId: 7, occupancies: ['teen', 'double'] as const };

  it('emits no change when occupancies match (order-insensitive)', () => {
    const edit: ProductEdit = { productId: 7, occupancies: ['double', 'teen'] };
    expect(buildProductDiff(current, edit)).toEqual([]);
  });

  it('emits one products.occupancies change when the set differs', () => {
    const edit: ProductEdit = { productId: 7, occupancies: ['teen'] };
    const changes = buildProductDiff(current, edit);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ collection: 'products', id: 7, field: 'occupancies' });
    expect([...(changes[0].before as string[])].sort()).toEqual(['double', 'teen']);
    expect(changes[0].after).toEqual(['teen']);
  });

  it('emits a change to empty when all occupancies removed', () => {
    const edit: ProductEdit = { productId: 7, occupancies: [] };
    const changes = buildProductDiff(current, edit);
    expect(changes).toHaveLength(1);
    expect(changes[0].after).toEqual([]);
  });
});
```

- [ ] **Step 3: Run it — expect FAIL** (`buildProductDiff` not exported)

Run: `cd /home/ahmad/Zhic/apps/web && pnpm test -- product-ops.test`

- [ ] **Step 4: Implement `buildProductDiff` in `ops.ts`**

Add after `buildDesignDiff` (reuse the existing `sameSet` helper already in the file):
```ts
import type { /* existing imports */ ProductEdit } from './types';
// ^ add ProductEdit to the existing `import type { ... } from './types'` line.

export type ProductCurrent = { productId: number; occupancies: readonly Occupancy[] };

/** Build the field-level change for a product's occupancies (set-diff, order-insensitive). */
export function buildProductDiff(current: ProductCurrent, edit: ProductEdit): FieldChange[] {
  if (sameSet(current.occupancies, edit.occupancies)) return [];
  return [{ collection: 'products', id: edit.productId, field: 'occupancies', before: [...current.occupancies], after: [...edit.occupancies] }];
}
```
(`sameSet`, `FieldChange`, `Occupancy` are already in scope in `ops.ts`.)

- [ ] **Step 5: Run tests — expect PASS** (3) and confirm the existing `ops.test.ts` still passes (FieldChange widening is backward-compatible):

Run: `cd /home/ahmad/Zhic/apps/web && pnpm test -- "lib/tag"` → all pass (ops, product-ops, auth, snapshot).

- [ ] **Step 6: Typecheck** (FieldChange widening must not break apply/undo/preview which already reference it):

Run: `cd /home/ahmad/Zhic/apps/web && pnpm exec tsc --noEmit -p tsconfig.json 2>&1 | grep -E "lib/tag|api/tag" || echo CLEAN` → expect CLEAN.

- [ ] **Step 7: Commit**

```bash
cd /home/ahmad/Zhic && git add apps/web/src/lib/tag/types.ts apps/web/src/lib/tag/ops.ts apps/web/src/lib/tag/__tests__/product-ops.test.ts
git commit -m "feat(tag): generalize FieldChange to products + buildProductDiff (M2 t1)"
```

---

## Task 2: `loadProductState` + `GET /api/tag/state?mode=product`

**Files:**
- Modify: `apps/web/src/lib/tag/state.ts`
- Modify: `apps/web/src/app/(internal)/api/tag/state/route.ts`

- [ ] **Step 1: Add `loadProductState` to `state.ts`**

```ts
import type { Occupancy, ProductState } from './types';
// ^ add ProductState to the existing type import.

type PayloadProductOccRaw = {
  id: number; name?: string | null; title?: string | null;
  occupancies?: Occupancy[] | null;
  design?: { slug?: string | null; name?: string | null; title?: string | null } | number | null;
};

/** Load product-mode state: every product with its occupancies + parent design label. */
export async function loadProductState(token: string): Promise<ProductState[]> {
  const products = await payloadGet<{ docs: PayloadProductOccRaw[] }>(`/api/products?limit=500&depth=1`, token);
  return products.docs.map((p) => {
    const d = p.design && typeof p.design === 'object' ? p.design : null;
    return {
      productId: p.id,
      title: (p.name ?? p.title ?? `#${p.id}`) as string,
      designSlug: d?.slug ?? null,
      designTitle: (d?.name ?? d?.title ?? null) as string | null,
      occupancies: p.occupancies ?? [],
    };
  });
}
```
> NOTE: products may use `name` or `title` for their human label — the map prefers `name` then `title` (designs use `name`, confirmed in M1). If the live smoke (Task 8) shows `#<id>` labels, adjust the preferred field after reading `services/api/src/collections/Products.ts`.

- [ ] **Step 2: Branch the state route on `?mode`**

Replace `apps/web/src/app/(internal)/api/tag/state/route.ts` GET body so it serves both modes:
```ts
import { NextRequest, NextResponse } from 'next/server';
import { getTagUser, getTagToken } from '@/lib/tag/auth';
import { loadOccupancyState, loadProductState } from '@/lib/tag/state';
import { OCCUPANCIES } from '@/lib/tag/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await getTagUser();
  const token = await getTagToken();
  if (!user || !token) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const mode = req.nextUrl.searchParams.get('mode') ?? 'occupancy';

  if (mode === 'product') {
    const products = await loadProductState(token);
    const distribution = Object.fromEntries(
      OCCUPANCIES.map((o) => [o, products.filter((p) => p.occupancies.includes(o)).length]),
    );
    return NextResponse.json({ products, scoreboard: { productsTotal: products.length, distribution } });
  }

  const designs = await loadOccupancyState(token);
  const complete = designs.filter((d) => d.occupancies.length > 0 && d.occupancies.every((o) => d.posters.some((p) => p.occupancy === o))).length;
  return NextResponse.json({ designs, scoreboard: { designsComplete: complete, designsTotal: designs.length } });
}
```

- [ ] **Step 3: Build + authenticated smoke (both modes)**

```bash
cd /home/ahmad/Zhic/apps/web && pnpm build 2>&1 | tail -4 && pm2 restart zhic-web --update-env >/dev/null 2>&1 && sleep 4
TOKEN=$(curl -s -X POST http://127.0.0.1:3001/api/users/login -H 'Content-Type: application/json' -d '{"email":"ahmadreza.torkaman@icloud.com","password":"JesusChristDude"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
echo "--- product mode ---"; curl -s "http://localhost:3000/api/tag/state?mode=product" -H "Cookie: tag_session=$TOKEN" | python3 -c "import sys,json;d=json.load(sys.stdin);print('products',len(d['products']),'dist',d['scoreboard']['distribution']);print('sample',d['products'][0])"
echo "--- occupancy mode (regression) ---"; curl -s "http://localhost:3000/api/tag/state?mode=occupancy" -H "Cookie: tag_session=$TOKEN" | python3 -c "import sys,json;d=json.load(sys.stdin);print('designs',len(d['designs']),d['scoreboard'])"
```
Expected: product mode → ~271 products, distribution shows `teen` high (~224); each product has title + designSlug + occupancies. Occupancy mode unchanged (27 designs). Unauthenticated → 401.

- [ ] **Step 4: Commit**

```bash
cd /home/ahmad/Zhic && git add apps/web/src/lib/tag/state.ts "apps/web/src/app/(internal)/api/tag/state"
git commit -m "feat(tag): loadProductState + GET /api/tag/state?mode=product (M2 t2)"
```

---

## Task 3: Product-edits branch in `POST /api/tag/preview`

**Files:**
- Modify: `apps/web/src/app/(internal)/api/tag/preview/route.ts`

- [ ] **Step 1: Generalize preview to accept product edits**

Replace the route body so it branches on `mode`:
```ts
import { NextRequest, NextResponse } from 'next/server';
import { getTagUser, getTagToken } from '@/lib/tag/auth';
import { loadOccupancyState, loadProductState } from '@/lib/tag/state';
import { buildDesignDiff, buildProductDiff, makeConfirmToken } from '@/lib/tag/ops';
import type { DesignEdit, ProductEdit, FieldChange } from '@/lib/tag/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const user = await getTagUser();
  const token = await getTagToken();
  if (!user || !token) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { mode?: 'occupancy' | 'product'; edits?: unknown[] } | null;
  const mode = body?.mode ?? 'occupancy';
  const edits = body?.edits ?? [];
  if (!edits.length) return NextResponse.json({ changes: [], confirmToken: makeConfirmToken([], 'empty') });

  const changes: FieldChange[] = [];
  if (mode === 'product') {
    const state = await loadProductState(token);
    const byId = new Map(state.map((p) => [p.productId, p]));
    for (const edit of edits as ProductEdit[]) {
      const cur = byId.get(edit.productId);
      if (!cur) continue;
      changes.push(...buildProductDiff({ productId: cur.productId, occupancies: cur.occupancies }, edit));
    }
  } else {
    const state = await loadOccupancyState(token);
    const byId = new Map(state.map((d) => [d.designId, d]));
    for (const edit of edits as DesignEdit[]) {
      const cur = byId.get(edit.designId);
      if (!cur) continue;
      changes.push(...buildDesignDiff(
        { designId: cur.designId, occupancies: cur.occupancies, occupancyMedia: cur.posters.map((p) => ({ occupancy: p.occupancy, image: p.imageId })) },
        edit,
      ));
    }
  }
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  return NextResponse.json({ changes, confirmToken: makeConfirmToken(changes, stamp) });
}
```
> The M1 occupancy UI sends `{ edits: [...] }` with no `mode`; the `?? 'occupancy'` default keeps it working unchanged.

- [ ] **Step 2: Build + smoke (product preview) + regression (occupancy preview)**

```bash
cd /home/ahmad/Zhic/apps/web && pnpm build 2>&1 | tail -3 && pm2 restart zhic-web --update-env >/dev/null 2>&1 && sleep 4
TOKEN=$(curl -s -X POST http://127.0.0.1:3001/api/users/login -H 'Content-Type: application/json' -d '{"email":"ahmadreza.torkaman@icloud.com","password":"JesusChristDude"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
# product: pick a product id from state, preview narrowing its occupancies to ['teen']
PID=$(curl -s "http://localhost:3000/api/tag/state?mode=product" -H "Cookie: tag_session=$TOKEN" | python3 -c "import sys,json;print(json.load(sys.stdin)['products'][0]['productId'])")
curl -s -X POST "http://localhost:3000/api/tag/preview" -H "Cookie: tag_session=$TOKEN" -H 'Content-Type: application/json' -d "{\"mode\":\"product\",\"edits\":[{\"productId\":$PID,\"occupancies\":[\"teen\"]}]}" | python3 -c "import sys,json;d=json.load(sys.stdin);print('changes',d['changes']);print('token',d['confirmToken'][:16])"
# occupancy regression: empty body still returns empty
curl -s -X POST "http://localhost:3000/api/tag/preview" -H "Cookie: tag_session=$TOKEN" -H 'Content-Type: application/json' -d '{}' | python3 -c "import sys,json;d=json.load(sys.stdin);print('empty ->',len(d['changes']))"
```
Expected: product preview returns a `products.occupancies` change (or `[]` if the product already is exactly `['teen']` — pick one that isn't) + token; empty body → 0 changes.

- [ ] **Step 3: Commit**

```bash
cd /home/ahmad/Zhic && git add "apps/web/src/app/(internal)/api/tag/preview"
git commit -m "feat(tag): product-edits branch in /api/tag/preview (M2 t3)"
```

---

## Task 4: Generalize `POST /api/tag/apply` to group by collection

**Files:**
- Modify: `apps/web/src/app/(internal)/api/tag/apply/route.ts`

- [ ] **Step 1: Replace the snapshot + patch loops to be collection-aware**

Keep the gate, the confirm-token guard, and `revalidateTag` import. Replace the section from after the confirm-token guard through the return with:
```ts
  // Group changes by collection, then by id.
  const collections = [...new Set(changes.map((c) => c.collection))] as ('designs' | 'products')[];

  // 1) Snapshot the CURRENT docs about to change, per collection (hard-fail aborts apply).
  const label = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14) + '-tag';
  let backupDir: string;
  try {
    const byCollection: Record<string, unknown[]> = {};
    for (const col of collections) {
      const ids = [...new Set(changes.filter((c) => c.collection === col).map((c) => c.id))];
      byCollection[col] = await Promise.all(
        ids.map((id) => payloadGet<Record<string, unknown>>(`/api/${col}/${id}?depth=0`, token)),
      );
    }
    backupDir = writeSnapshot(label, byCollection);
  } catch (e) {
    return NextResponse.json({ error: `snapshot-failed: ${(e as Error).message}` }, { status: 500 });
  }

  // 2) Apply: group changed fields by (collection,id), PATCH each doc once.
  const byDoc = new Map<string, { collection: 'designs' | 'products'; id: number; data: Record<string, unknown> }>();
  for (const c of changes) {
    const key = `${c.collection}:${c.id}`;
    const entry = byDoc.get(key) ?? { collection: c.collection, id: c.id, data: {} };
    entry.data[c.field] = c.after;
    byDoc.set(key, entry);
  }
  let applied = 0;
  for (const { collection, id, data } of byDoc.values()) {
    await payloadPatch(collection, id, data, token);
    applied++;
    for (const c of changes.filter((x) => x.collection === collection && x.id === id)) {
      try {
        appendAudit({ ts: new Date().toISOString(), user_id: user.id, mode: collection === 'products' ? 'product' : 'occupancy', op: `set-${c.field}`, target_id: id, collection, before: c.before, after: c.after, backup_dir: backupDir });
      } catch (e) {
        console.error('tag-apply: audit write failed', (e as Error).message);
      }
    }
  }

  for (const col of collections) revalidateTag(col, { expire: 0 });
  return NextResponse.json({ applied, backupDir });
```
> This preserves M1's design path (a designs-only change set produces the identical snapshot `{designs:[...]}` + `revalidateTag('designs')`) while adding products.

- [ ] **Step 2: Build + SAFE smoke (product apply → verify persisted → restore original)**

Same safe pattern as M1 t9. Pick a product D, capture ORIGINAL occupancies, preview a narrowing edit, apply, GET `/api/products/D?depth=0` to confirm `occupancies` changed, then PATCH D back to original (manual restore), verify. Also re-verify a DESIGN apply still works (regression) and restores. Confirm backup dir has the right per-collection file (`products.json` or `designs.json`) and audit lines carry `collection`.
```bash
TOKEN=$(curl -s -X POST http://127.0.0.1:3001/api/users/login -H 'Content-Type: application/json' -d '{"email":"ahmadreza.torkaman@icloud.com","password":"JesusChristDude"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
# product apply+restore — fill PID + ORIG occupancies from /api/products/PID?depth=0
PV=$(curl -s -X POST http://localhost:3000/api/tag/preview -H "Cookie: tag_session=$TOKEN" -H 'Content-Type: application/json' -d '{"mode":"product","edits":[{"productId":PID,"occupancies":["teen"]}]}')
AP=$(curl -s -X POST http://localhost:3000/api/tag/apply -H "Cookie: tag_session=$TOKEN" -H 'Content-Type: application/json' -d "$PV"); echo "$AP"
curl -s "http://127.0.0.1:3001/api/products/PID?depth=0" -H "Authorization: JWT $TOKEN" | python3 -c "import sys,json;print('after',json.load(sys.stdin)['occupancies'])"
# RESTORE to ORIG, then verify:
curl -s -X PATCH "http://127.0.0.1:3001/api/products/PID" -H "Authorization: JWT $TOKEN" -H 'Content-Type: application/json' -d '{"occupancies":[ORIG...]}'
curl -s "http://127.0.0.1:3001/api/products/PID?depth=0" -H "Authorization: JWT $TOKEN" | python3 -c "import sys,json;print('restored',json.load(sys.stdin)['occupancies'])"
ls "$(echo "$AP" | python3 -c "import sys,json;print(json.load(sys.stdin)['backupDir'])")"
```
Expected: apply `{applied:1}`; GET shows `["teen"]`; restore shows ORIG; backup dir contains `products.json`. **Leave catalog clean.** Stale token → 409; unauth → 401 (re-confirm).

- [ ] **Step 3: Commit**

```bash
cd /home/ahmad/Zhic && git add "apps/web/src/app/(internal)/api/tag/apply"
git commit -m "feat(tag): apply groups by collection (designs+products) (M2 t4)"
```

---

## Task 5: Generalize `POST /api/tag/undo` to restore every collection in the backup

**Files:**
- Modify: `apps/web/src/app/(internal)/api/tag/undo/route.ts`
- Modify: `apps/web/src/lib/tag/snapshot.ts` (add a tiny `listSnapshotCollections` helper)

- [ ] **Step 1: Add `listSnapshotCollections` to `snapshot.ts`**

```ts
import fs from 'node:fs';
// (fs already imported)

/** Collections present in a snapshot dir (e.g. ['designs','products']) by reading *.json filenames. */
export function listSnapshotCollections(dir: string): string[] {
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));
}
```

- [ ] **Step 2: Rewrite undo to restore each collection's saved docs**

Keep the gate, the `backupDir` → `BACKUP_ROOT` path guard, and the 400/404 handling. Replace the restore loop:
```ts
import { revalidateTag } from 'next/cache';
import { getTagUser, getTagToken } from '@/lib/tag/auth';
import { payloadPatch } from '@/lib/tag/payload-rest';
import { readSnapshot, appendAudit, listSnapshotCollections } from '@/lib/tag/snapshot';
// ... (gate + path guard unchanged, producing `resolved`) ...

  let collections: string[];
  try {
    collections = listSnapshotCollections(resolved);
  } catch (e) {
    return NextResponse.json({ error: `snapshot-read-failed: ${(e as Error).message}` }, { status: 404 });
  }

  let restored = 0;
  for (const col of collections) {
    const snap = readSnapshot(resolved, col);
    for (const doc of snap.docs) {
      const id = doc.id as number;
      const data: Record<string, unknown> = { occupancies: doc.occupancies ?? [] };
      if (col === 'designs') {
        data.occupancyMedia = ((doc.occupancyMedia as { occupancy: string; image: number | { id: number } }[] | null) ?? [])
          .map((m) => ({ occupancy: m.occupancy, image: typeof m.image === 'number' ? m.image : m.image?.id }));
      }
      await payloadPatch(col as 'designs' | 'products', id, data, token);
      restored++;
      try {
        appendAudit({ ts: new Date().toISOString(), user_id: user.id, mode: 'undo', op: 'undo', collection: col, target_id: id, backup_dir: resolved });
      } catch (e) { console.error('tag-undo: audit write failed', (e as Error).message); }
    }
  }
  for (const col of collections) revalidateTag(col, { expire: 0 });
  return NextResponse.json({ restored });
```
> Designs restore both `occupancies` + `occupancyMedia`; products restore `occupancies` only. Backward-compatible with M1 design-only backups (the dir has only `designs.json`).

- [ ] **Step 3: Build + smoke (product apply → undo → verify restored; + design regression)**

```bash
TOKEN=$(curl -s -X POST http://127.0.0.1:3001/api/users/login -H 'Content-Type: application/json' -d '{"email":"ahmadreza.torkaman@icloud.com","password":"JesusChristDude"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
# product: capture ORIG, apply narrow, UNDO via backupDir, verify == ORIG (no manual restore needed if undo works)
```
Apply a product occupancy change, undo with the returned `backupDir`, confirm the product's occupancies return to ORIGINAL (order-insensitive). Re-run the M1 design apply→undo too (regression). Confirm bogus backupDir → 404, `/etc` → 400. **Leave catalog clean.**

- [ ] **Step 4: Commit**

```bash
cd /home/ahmad/Zhic && git add apps/web/src/lib/tag/snapshot.ts "apps/web/src/app/(internal)/api/tag/undo"
git commit -m "feat(tag): undo restores every collection in the backup (M2 t5)"
```

---

## Task 6: Product mode UI + mode switcher

**Files:**
- Create: `apps/web/src/app/(internal)/atelier/tag/ProductMode.tsx`
- Create: `apps/web/src/app/(internal)/atelier/tag/ModeNav.tsx`
- Modify: `apps/web/src/app/(internal)/atelier/tag/page.tsx`
- Modify: `apps/web/src/app/(internal)/atelier/tag/tag-panel.css` (append product-mode styles)

- [ ] **Step 1: `ModeNav.tsx` (links between modes)**

```tsx
// apps/web/src/app/(internal)/atelier/tag/ModeNav.tsx
'use client';
import Link from 'next/link';

export function ModeNav({ active }: { active: 'occupancy' | 'product' }) {
  return (
    <nav className="zh-tag-nav">
      <Link href="/atelier/tag?mode=occupancy" className={active === 'occupancy' ? 'is-active' : ''}>اشغال طرح‌ها</Link>
      <Link href="/atelier/tag?mode=product" className={active === 'product' ? 'is-active' : ''}>اشغال محصولات</Link>
    </nav>
  );
}
```

- [ ] **Step 2: `ProductMode.tsx` (occupancies multi-select per product + live per-age distribution)**

```tsx
// apps/web/src/app/(internal)/atelier/tag/ProductMode.tsx
'use client';
import { useCallback, useEffect, useState } from 'react';
import { OCCUPANCIES, OCCUPANCY_FA, type Occupancy } from '@/lib/tag/types';
import { toPersianDigits } from '@zhic/locale';
import { ModeNav } from './ModeNav';

type ProductRow = { productId: number; title: string; designSlug: string | null; designTitle: string | null; occupancies: Occupancy[] };

export function ProductMode() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [focus, setFocus] = useState(0);
  const [lastBackupDir, setLastBackupDir] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  const load = useCallback(async () => {
    const res = await fetch('/api/tag/state?mode=product', { cache: 'no-store' });
    const data = await res.json();
    setProducts(data.products);
  }, []);
  useEffect(() => { load(); }, [load]);

  const cur = products[focus];
  // Live per-age distribution from the in-memory (possibly-edited) product list — the "224 → N" deltas.
  const dist = (o: Occupancy) => products.filter((p) => p.occupancies.includes(o)).length;

  const toggle = (o: Occupancy) => setProducts((ps) => ps.map((p, i) => i !== focus ? p : {
    ...p, occupancies: p.occupancies.includes(o) ? p.occupancies.filter((x) => x !== o) : [...p.occupancies, o],
  }));

  const save = useCallback(async () => {
    if (!cur) return;
    setStatus('در حال ذخیره…');
    try {
      const pvRes = await fetch('/api/tag/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'product', edits: [{ productId: cur.productId, occupancies: cur.occupancies }] }) });
      const pv = await pvRes.json();
      if (!pvRes.ok) { setStatus(`خطا: ${pv.error ?? pvRes.status}`); return; }
      if (!pv.changes?.length) { setStatus('تغییری نیست'); return; }
      const apRes = await fetch('/api/tag/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pv) });
      const ap = await apRes.json();
      if (apRes.ok && ap.applied) { setLastBackupDir(ap.backupDir); setStatus(`ذخیره شد (${ap.backupDir.split('/').pop()})`); }
      else { setStatus(`خطا: ${ap.error ?? apRes.status}`); }
      await load();
    } catch { setStatus('خطا در ذخیره‌سازی'); }
  }, [cur, load]);

  const undo = useCallback(async () => {
    if (!lastBackupDir) { setStatus('چیزی برای بازگردانی نیست'); return; }
    setStatus('در حال بازگردانی…');
    try {
      const res = await fetch('/api/tag/undo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ backupDir: lastBackupDir }) });
      const data = await res.json();
      setStatus(res.ok ? `بازگردانی شد (${data.restored})` : `خطا: ${data.error ?? ''}`);
      setLastBackupDir(null);
      await load();
    } catch { setStatus('خطا در بازگردانی'); }
  }, [lastBackupDir, load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setFocus((f) => Math.min(f + 1, products.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setFocus((f) => Math.max(f - 1, 0)); }
      else if (['1', '2', '3', '4'].includes(e.key)) { const o = OCCUPANCIES[Number(e.key) - 1]; if (o) toggle(o); }
      else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
      else if (e.key === 'Z' || e.key === 'z') { undo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [products.length, save, undo]);

  if (!cur) return <main className="zh-tag"><ModeNav active="product" /><p>در حال بارگذاری…</p></main>;

  return (
    <main className="zh-tag">
      <ModeNav active="product" />
      <div className="zh-tag-score" role="status">
        {OCCUPANCIES.map((o) => <span key={o} className="zh-tag-score__chip">{OCCUPANCY_FA[o]}: {toPersianDigits(dist(o))}</span>)}
        <span className="zh-tag-score__chip">کل: {toPersianDigits(products.length)} محصول</span>
      </div>
      <div className="zh-tag__cols">
        <ul className="zh-tag__list">
          {products.map((p, i) => (
            <li key={p.productId} aria-current={i === focus} className={`zh-tag__row${i === focus ? ' is-focus' : ''}`} onClick={() => setFocus(i)}>
              <span>{p.title}{p.designTitle ? ` — ${p.designTitle}` : ''}</span>
              <span className="zh-tag__dots">{OCCUPANCIES.map((o) => <i key={o} className={`zh-tag__dot${p.occupancies.includes(o) ? ' is-set' : ''}`} title={OCCUPANCY_FA[o]} />)}</span>
            </li>
          ))}
        </ul>
        <section className="zh-tag__center">
          <h2>{cur.title}</h2>
          {cur.designTitle ? <p className="zh-tag__status">طرح: {cur.designTitle}</p> : null}
          <div className="zh-tag__ages">
            {OCCUPANCIES.map((o, idx) => (
              <button key={o} className={`zh-tag__age${cur.occupancies.includes(o) ? ' is-on' : ''}`} onClick={() => toggle(o)}>
                {OCCUPANCY_FA[o]} <kbd>{idx + 1}</kbd>
              </button>
            ))}
          </div>
          <div className="zh-tag__actions">
            <button className="zh-tag__age" onClick={save}>ذخیره <kbd>⌘S</kbd></button>
            <button className="zh-tag__age" onClick={undo} disabled={!lastBackupDir}>بازگردانی <kbd>Z</kbd></button>
          </div>
          <p className="zh-tag__status" role="status">{status}</p>
        </section>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Mode dispatch in `page.tsx`**

Replace the page body:
```tsx
import { redirect } from 'next/navigation';
import { getTagUser } from '@/lib/tag/auth';
import { OccupancyMode } from './OccupancyMode';
import { ProductMode } from './ProductMode';
import './tag-panel.css';

export const dynamic = 'force-dynamic';

export default async function TagPanelPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const user = await getTagUser();
  if (!user) redirect('/atelier/tag/login');
  const { mode = 'occupancy' } = await searchParams;
  if (mode === 'product') return <ProductMode />;
  return <OccupancyMode userEmail={user.email} initialMode={mode} />;
}
```
Also add `<ModeNav active="occupancy" />` to `OccupancyMode.tsx`'s returned `<main>` (import it) so both modes show the switcher. Add it right after `<main className="zh-tag" ...>` opens, before `<Scoreboard …>`.

- [ ] **Step 4: Append product-mode CSS to `tag-panel.css`**

```css
.zh-tag-nav { display: flex; gap: 0.75rem; padding: 0.5rem 0; }
.zh-tag-nav a { padding: 0.3rem 0.8rem; border-radius: 6px; text-decoration: none; color: var(--color-ink); border: 1px solid var(--color-cream); }
.zh-tag-nav a.is-active { background: var(--color-forest); color: var(--color-ivory); border-color: var(--color-forest); }
.zh-tag-score { display: flex; gap: 0.75rem; flex-wrap: wrap; }
.zh-tag__actions { display: flex; gap: 0.5rem; margin: 0.75rem 0; }
```

- [ ] **Step 5: Build + ship + gate check**

Run: `cd /home/ahmad/Zhic/apps/web && pnpm build 2>&1 | tail -5 && pm2 restart zhic-web --update-env >/dev/null 2>&1 && sleep 4 && curl -s -o /dev/null -w "product-mode HTTP %{http_code}\n" "http://localhost:3000/atelier/tag?mode=product"`
Expected: build succeeds; unauthenticated → 307 (gate). (Full UI verified in Task 8.)

- [ ] **Step 6: Commit**

```bash
cd /home/ahmad/Zhic && git add "apps/web/src/app/(internal)/atelier/tag/ProductMode.tsx" "apps/web/src/app/(internal)/atelier/tag/ModeNav.tsx" "apps/web/src/app/(internal)/atelier/tag/page.tsx" "apps/web/src/app/(internal)/atelier/tag/OccupancyMode.tsx" "apps/web/src/app/(internal)/atelier/tag/tag-panel.css"
git commit -m "feat(tag): product-occupancy mode UI + mode switcher (M2 t6)"
```

---

## Task 7: Storefront `/bedroom-furniture` age filter wiring

**Files:**
- Modify: `apps/web/src/lib/category-filter-url.ts`
- Modify: `apps/web/src/lib/category-helpers.ts`
- Modify: `apps/web/src/app/(site)/bedroom-furniture/[...slug]/page.tsx`
- Modify: `apps/web/src/components/category/CategoryFilterSidebar.tsx`

- [ ] **Step 1: Add `age` to the filter-URL machinery**

In `apps/web/src/lib/category-filter-url.ts`: add `'age'` to the `FILTER_KEYS` tuple (line ~13) and add `age?: string | null;` to the `Override` type. In `apps/web/src/lib/category-helpers.ts`: add `'age'` to its `FILTER_KEYS` tuple (line ~53) so `countActiveFilters` counts it.

Read both files first and make the minimal additions matching the existing tuple style. Verify: `cd /home/ahmad/Zhic/apps/web && pnpm exec tsc --noEmit -p tsconfig.json 2>&1 | grep -E "category-filter-url|category-helpers" || echo CLEAN`.

- [ ] **Step 2: Wire the page — `FILTER_PARAM_KEYS`, parse `age`, pass to `fetchProducts`, gate off facets**

In `apps/web/src/app/(site)/bedroom-furniture/[...slug]/page.tsx`:
- Line 41: `const FILTER_PARAM_KEYS = ['design', 'material', 'size', 'sort', 'page', 'age'] as const;`
- In the searchParams parse block (~line 145), add:
```ts
const ageRaw = typeof sp.age === 'string' ? sp.age : undefined;
const age: 'baby' | 'teen' | 'double' | 'bunk' | undefined =
  ageRaw === 'baby' || ageRaw === 'teen' || ageRaw === 'double' || ageRaw === 'bunk' ? ageRaw : undefined;
```
- In the `fetchProducts({...})` call (~line 239), add: `occupancies: age,`
- Compute whether to show the age filter (NOT on promoted facet pages, per SEO): the page already has `const isFacet = category.axis_filter != null && typeof category.axis_filter === 'object';` (~line 166). Pass `availableAges={isFacet ? undefined : AGE_OPTIONS}` to the sidebar (see step 3) — i.e. only offer the age filter on non-facet leaf/hybrid pages.
- Define the fixed options near the top of the file (the 4 ages are a known set; no count query — keep it cheap and consistent with the single-select link pattern):
```ts
const AGE_OPTIONS = [
  { slug: 'baby', name: 'نوزاد' },
  { slug: 'teen', name: 'نوجوان' },
  { slug: 'double', name: 'دونفره' },
  { slug: 'bunk', name: 'دوطبقه' },
] as const;
```
> Labels match the panel's `OCCUPANCY_FA` and the `/bedroom-set` age wording. If `/bedroom-set` (series-hub) exposes a shared label constant, import that instead to keep one source of truth; otherwise these literals are correct.

- [ ] **Step 3: Add the age filter block to `CategoryFilterSidebar.tsx`**

Read `apps/web/src/components/category/CategoryFilterSidebar.tsx` — it renders design/material/size groups with an identical `.group` → `.label` → `.list` → `.opt`/`.check`/`.active` pattern, building hrefs with `buildFilterHref(basePath, searchParams, { <key>: isActive ? null : value })`. Add:
- A new prop `availableAges?: { slug: string; name: string }[];` to the component's props type.
- A new filter group block (mirroring the design block exactly) that, when `availableAges` is provided, renders each age as a single-select link: active when `pickStr(searchParams, 'age') === slug`, href = `buildFilterHref(basePath, searchParams, { age: isActive ? null : slug, page: null })` (reset page on filter change, matching the other facets). Label header «گروه سنی».

Match the existing block's markup/classes exactly (no new CSS). Because `CategoryFilterSheet` wraps `CategoryFilterSidebar`, the mobile sheet picks this up automatically — pass `availableAges` through `CategoryFilterSheet` too if it has an explicit prop list (read it; if it spreads/forwards props, nothing to do).

- [ ] **Step 4: Build + smoke the storefront filter**

```bash
cd /home/ahmad/Zhic/apps/web && pnpm build 2>&1 | tail -4 && pm2 restart zhic-web --update-env >/dev/null 2>&1 && sleep 4
# unfiltered vs ?age=teen on the bedroom-furniture root (or a known leaf): product counts should differ
curl -s "http://localhost:3000/bedroom-furniture" -o /dev/null -w "root HTTP %{http_code}\n"
curl -s "http://localhost:3000/bedroom-furniture?age=teen" -o /dev/null -w "age=teen HTTP %{http_code}\n"
```
Then verify with the headless browser (or by inspecting rendered product count / the «گروه سنی» block presence): on a non-facet leaf page the age block renders and selecting an age narrows the grid; on a promoted facet page the age block is absent. Confirm `?age=teen` yields `robots: noindex` (hasFilterParams) and the canonical points to the unfiltered URL.

- [ ] **Step 5: Commit**

```bash
cd /home/ahmad/Zhic && git add apps/web/src/lib/category-filter-url.ts apps/web/src/lib/category-helpers.ts "apps/web/src/app/(site)/bedroom-furniture/[...slug]/page.tsx" apps/web/src/components/category/CategoryFilterSidebar.tsx
git commit -m "feat(web): /bedroom-furniture age (occupancy) filter wired to products.occupancies (M2 t7)"
```

---

## Task 8: End-to-end verification + ship

**Files:** none (verification).

- [ ] **Step 1: Full suite green** — `cd /home/ahmad/Zhic/apps/web && pnpm test` → all pass (incl. ops/product-ops/auth/snapshot). Report counts.

- [ ] **Step 2: Headless — product mode round-trip (mutate→save→Z-undo→clean).** Use the M1 headless recipe. Login; `/atelier/tag?mode=product`; assert the mode nav, the per-age distribution chips (e.g. «نوجوان: ۲۲۴»), and a product list render. Capture a product's original occupancies via API; in the UI toggle an age off and save (status «ذخیره شد»); press `Z` (status «بازگردانی شد»); verify via API the product's occupancies == original. Screenshot `/tmp/tag-product.png`.

- [ ] **Step 3: Storefront effect (mutate→check→undo→clean).** Via API: narrow a product's occupancies to exclude `teen`; load `http://localhost:3000/bedroom-furniture?age=teen` and confirm that product is absent, then `?age=<an age it still has>` shows it; undo; confirm it reappears under `teen`. (revalidateTag fires on apply/undo.) Leave the product clean.

- [ ] **Step 4: Regression — design occupancy mode still works.** `/atelier/tag?mode=occupancy`: confirm the 27-design builder still loads, and an apply→undo on one design round-trips clean (M1 path intact through the generalized apply/undo).

- [ ] **Step 5: Cleanliness + ship.** Verify every touched product/design == original (GET depth=0). `git status --short` clean. `git log --oneline -10`. Final marker commit: `git commit -m "chore(tag): M2 product mode + bedroom-furniture age filter verified" --allow-empty`. Then push: `git push`.

- [ ] **Step 6: Report** the verification transcript + confirm "CATALOG LEFT CLEAN".

---

## Self-review checklist (run before handoff)

- **Spec coverage (M2):** product mode (t1–t6) ✓; storefront age filter on /bedroom-furniture (t7) ✓; reuses M1 safety layer (snapshot/apply/undo/audit, generalized) ✓; in-panel per-age count deltas (ProductMode dist) ✓; single-value age, no facet-page leakage, noindex on filter (t7) ✓; zero schema changes ✓.
- **Type consistency:** `FieldChange.collection: 'designs'|'products'`, `ProductEdit{productId,occupancies}`, `ProductState`, `buildProductDiff(ProductCurrent,ProductEdit)`, `loadProductState`, preview `{mode,edits}`, apply group-by-collection, undo `listSnapshotCollections`+per-collection restore, `revalidateTag(col,{expire:0})`. Names used identically across tasks.
- **Regression safety:** the design (occupancy) path must keep working through every generalized route — t2/t3/t4/t5/t8 each re-verify it. The M1 occupancy UI sends no `mode` → preview defaults to `'occupancy'`.
- **No placeholders:** every code step has full code; every run step has an exact command + expected output. The two "read the file and match the existing block" steps (t7 s1/s3) are deliberate (match in-repo style) but specify exactly what to add.
- **Carried minors (from M1, still acceptable):** `secure:false` cookie (HTTP VPS); `OccupancyMode.save()` already hardened; `backupDir` guarded.

## Open items (not blocking)
- Age filter options show no per-age counts (the 4 ages are a fixed set; counts would add queries). Add counts later if desired (mirror `fetchAvailableMaterials`).
- If a shared storefront occupancy-label constant exists (`/bedroom-set` series-hub), import it in t7 instead of the inline `AGE_OPTIONS` labels for a single source of truth.
