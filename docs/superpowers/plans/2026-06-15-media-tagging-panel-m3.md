# Media Tagging Panel — M3 (Alt-Text / Caption / Decorative Queue) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A paginated **images mode** at `/atelier/tag?mode=images` to fast-fill the **429 empty `media.alt`** (+ `caption`, `decorative`) across all ~950 media, with a **[Regenerate]** button that derives Persian alt from the parent product's `piece_type` + design + filename qualifiers — the proven `reconcile-10-alt-text` logic, ported to a pure client-callable function.

**Architecture:** Extend the now-collection-agnostic M1/M2 tag layer to a third collection: widen `FieldChange` to `media` + fields `alt|caption|decorative`; extend the M2 apply allow-list and undo per-collection restore; add `buildMediaDiff`, a paginated `loadImagesState` (with per-media owner context + in-use/orphan flag), a preview `images` branch, and an `ImagesMode` UI. The alt generator is a **pure function** (`altFromContext`) ported verbatim from `reconcile-10-alt-text.mts` (the web app can't import the script), so [Regenerate] runs client-side with no API call. **Zero schema changes** (`media.alt/caption/decorative` already exist).

**Tech Stack:** Next 16 / React 19 (`apps/web`); Payload 3.83 REST; vitest 2.1.8. Ships with rebuild + pm2 restart.

**Spec:** `docs/superpowers/specs/2026-06-15-media-tagging-panel-design.md` (§5.3 images mode, M3 in §11).
**Builds on:** M1 (`b1f2379…45bd2de`) + M2 (`fa36483…d30a06f`).

---

## Conventions (read once)

- **Test command:** `cd /home/ahmad/Zhic/apps/web && pnpm test -- <pattern>`. Logic tests mock `server-only`/`next/headers` (M1 pattern). Keep touched test files tsc-clean (use `x[0]!` guards under `noUncheckedIndexedAccess`).
- **Occupancy/labels:** reuse `@/lib/tag/types` (`OCCUPANCIES`, `OCCUPANCY_FA`). No new label maps except the alt-gen Persian maps (ported below).
- **`media` is the Payload uploads collection** (slug `media`); `payloadPatch` already accepts `'media'`. Fields `alt` (text), `caption` (text), `decorative` (checkbox, default false) — all optional at DB level. Media docs carry `url`, `thumbnailURL`, `filename`, `mimeType`.
- **In-use (M2 decision):** a media is in-use if referenced by a product **gallery**, a **product-variant** image, or a **design** field (`hero/slider/logo/gallery/occupancyMedia`). SEO-og-only references are **orphan-eligible** (excluded from in-use).
- **Pagination:** `/api/media?limit=50&page=N&depth=0` (1-indexed); response has `docs`, `totalDocs`, `totalPages`, `hasNextPage`.
- **Build/ship:** `cd /home/ahmad/Zhic/apps/web && pnpm build && pm2 restart zhic-web --update-env`. Operator creds for smokes: `ahmadreza.torkaman@icloud.com` / `JesusChristDude`. **CATALOG-CLEAN RULE:** revert every smoke mutation; verify clean.

## File structure

**Create:**
| File | Responsibility |
|---|---|
| `lib/tag/alt-gen.ts` | Pure Persian alt generator ported from `reconcile-10` |
| `lib/tag/__tests__/alt-gen.test.ts` | alt-gen tests |
| `lib/tag/__tests__/media-ops.test.ts` | `buildMediaDiff` tests |
| `app/(internal)/atelier/tag/ImagesMode.tsx` | paginated alt/caption/decorative queue UI |

**Modify:**
| File | Change |
|---|---|
| `lib/tag/types.ts` | `FieldChange.collection +'media'`, `field +'alt'/'caption'/'decorative'`; add `MediaEdit`, `MediaState` |
| `lib/tag/ops.ts` | add `buildMediaDiff` |
| `lib/tag/state.ts` | add `loadImagesState` |
| `app/(internal)/api/tag/state/route.ts` | `?mode=images` branch (paginated) |
| `app/(internal)/api/tag/preview/route.ts` | `images` branch |
| `app/(internal)/api/tag/apply/route.ts` | allow-list `+media` + `alt/caption/decorative` |
| `app/(internal)/api/tag/undo/route.ts` | allow-list `+media`; media restore branch |
| `app/(internal)/atelier/tag/ModeNav.tsx` | add images link |
| `app/(internal)/atelier/tag/page.tsx` | dispatch `mode=images` → `ImagesMode` |
| `app/(internal)/atelier/tag/tag-panel.css` | append queue/thumbnail styles |

---

## Task 1: Pure alt generator + media diff (TDD)

**Files:**
- Create: `apps/web/src/lib/tag/alt-gen.ts`
- Modify: `apps/web/src/lib/tag/types.ts`, `apps/web/src/lib/tag/ops.ts`
- Test: `apps/web/src/lib/tag/__tests__/alt-gen.test.ts`, `apps/web/src/lib/tag/__tests__/media-ops.test.ts`

- [ ] **Step 1: widen `FieldChange` + add media types in `types.ts`**

Change `FieldChange`:
```ts
export type FieldChange = {
  collection: 'designs' | 'products' | 'media';
  id: number;
  field: 'occupancies' | 'occupancyMedia' | 'alt' | 'caption' | 'decorative';
  before: unknown;
  after: unknown;
};
```
Add:
```ts
/** The UI's intended per-image text fields. */
export type MediaEdit = { mediaId: number; alt: string | null; caption: string | null; decorative: boolean };

export type MediaState = {
  id: number;
  url: string;
  thumbnailURL: string | null;
  filename: string;
  alt: string | null;
  caption: string | null;
  decorative: boolean;
  inUse: boolean;
  ctx: { pieceType: string | null; designName: string | null; productName: string | null; productSlug: string | null } | null;
};
```

- [ ] **Step 2: write `alt-gen.ts` (ported verbatim from `reconcile-10-alt-text.mts`)**

```ts
// apps/web/src/lib/tag/alt-gen.ts
// Persian alt generator — ported verbatim from services/api/scripts/reconcile-10-alt-text.mts
// (the web app cannot import the script). Pure: derives alt from filename + parent context.

const PIECE_FA: Record<string, string> = {
  bed: 'تخت', nightstand: 'پاتختی', closet: 'کمد', dresser: 'دراور', mirror: 'آینه',
  desk: 'میز تحریر', bookcase: 'کتابخانه', display_cabinet: 'ویترین', vanity: 'میز آرایش',
  chair: 'صندلی', console: 'کنسول', changing_table: 'میز تعویض', bracket: 'براکت', sofa: 'مبل',
};
const NUM_FA = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش'];
const COLOR_FA: Record<string, string> = {
  cream: 'کرم', green: 'سبز', gray: 'خاکستری', grey: 'خاکستری', white: 'سفید',
  black: 'مشکی', walnut: 'گردویی', oak: 'بلوط',
};

const faDigits = (s: string) => s.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]);

function qualifiers(rest: string[]): string[] {
  const q: string[] = [];
  for (let i = 0; i < rest.length - 1; i++) {
    const n = Number(rest[i]);
    if (n >= 1 && n <= 6 && rest[i + 1] === 'doors') q.push(`${NUM_FA[n]} درب`);
    if (n >= 1 && n <= 6 && rest[i + 1] === 'drawers') q.push(`${NUM_FA[n]} کشو`);
  }
  if (rest.includes('mdf')) q.push('ام‌دی‌اف');
  if (rest.includes('glass')) q.push('شیشه‌ای');
  if (rest.includes('pieces')) {
    const i = rest.indexOf('pieces'); const n = Number(rest[i - 1]);
    if (n >= 1 && n <= 6) q.push(`ست ${NUM_FA[n]}‌تکه`);
  }
  for (const t of rest) if (COLOR_FA[t]) { q.push(`رنگ ${COLOR_FA[t]}`); break; }
  for (const t of rest) if (/^\d{2,3}$/.test(t)) { q.push(`سایز ${faDigits(t)}`); break; }
  if (rest.includes('open')) q.push('نمای داخلی');
  else if (rest.includes('picture')) q.push('نمای محیطی');
  return q;
}

export type AltContext = {
  filename: string;
  pieceType?: string | null;
  designName?: string | null;
  productName?: string | null;
  productSlug?: string | null;
};

/** Generate Persian alt text from filename qualifiers + parent context. Pure. */
export function altFromContext(ctx: AltContext): string {
  const base = (ctx.productName?.trim() || `${PIECE_FA[ctx.pieceType ?? ''] ?? 'محصول'} ${ctx.designName ?? ''}`.trim());
  const name = ctx.filename.replace(/\.[a-z0-9]+$/i, '');
  const slug = ctx.productSlug ?? '';
  const rest = (slug && name.startsWith(slug + '-') ? name.slice(slug.length + 1) : name).split('-');
  const q = qualifiers(rest);
  return q.length ? `${base} — ${q.join('، ')}` : base;
}
```

- [ ] **Step 3: write the failing alt-gen test**

```ts
// apps/web/src/lib/tag/__tests__/alt-gen.test.ts
import { describe, it, expect } from 'vitest';
import { altFromContext } from '../alt-gen';

describe('altFromContext', () => {
  it('base = piece_type + design when no productName; qualifiers from filename', () => {
    expect(altFromContext({ filename: 'verna-closet-2-doors-cream.webp', pieceType: 'closet', designName: 'ورنا', productSlug: 'verna-closet' }))
      .toBe('کمد ورنا — دو درب، رنگ کرم');
  });
  it('uses productName as base when present', () => {
    expect(altFromContext({ filename: 'x-4-drawers.webp', pieceType: 'vanity', productName: 'میز آرایش پارلا', productSlug: 'x' }))
      .toBe('میز آرایش پارلا — چهار کشو');
  });
  it('unknown piece_type falls back to محصول', () => {
    expect(altFromContext({ filename: 'foo.webp', pieceType: 'unknown', designName: '' })).toBe('محصول');
  });
  it('open beats picture for the view marker', () => {
    expect(altFromContext({ filename: 'p-open-picture.webp', pieceType: 'bed', designName: 'لوف', productSlug: 'p' }))
      .toBe('تخت لوف — نمای داخلی');
  });
  it('size token rendered with Persian digits', () => {
    expect(altFromContext({ filename: 'p-160.webp', pieceType: 'bed', designName: 'لوف', productSlug: 'p' }))
      .toBe('تخت لوف — سایز ۱۶۰');
  });
});
```

- [ ] **Step 4: run — expect FAIL, then PASS after Step 2 file exists**

Run: `cd /home/ahmad/Zhic/apps/web && pnpm test -- alt-gen.test` → PASS (5). (If a case differs from the real `reconcile-10` output, the script logic is authoritative — re-read `reconcile-10-alt-text.mts` and reconcile the test expectation, NOT the ported logic.)

- [ ] **Step 5: add `buildMediaDiff` to `ops.ts`**

Add `MediaEdit` to the `import type` line. Append:
```ts
export type MediaCurrent = { mediaId: number; alt: string | null; caption: string | null; decorative: boolean };

/** Field-level diff for a media's text fields (null and '' treated equal). */
export function buildMediaDiff(current: MediaCurrent, edit: MediaEdit): FieldChange[] {
  const changes: FieldChange[] = [];
  const norm = (s: string | null) => (s ?? '').trim();
  if (norm(current.alt) !== norm(edit.alt)) changes.push({ collection: 'media', id: edit.mediaId, field: 'alt', before: current.alt ?? '', after: (edit.alt ?? '').trim() });
  if (norm(current.caption) !== norm(edit.caption)) changes.push({ collection: 'media', id: edit.mediaId, field: 'caption', before: current.caption ?? '', after: (edit.caption ?? '').trim() });
  if (Boolean(current.decorative) !== Boolean(edit.decorative)) changes.push({ collection: 'media', id: edit.mediaId, field: 'decorative', before: current.decorative, after: edit.decorative });
  return changes;
}
```

- [ ] **Step 6: write `media-ops.test.ts`**

```ts
// apps/web/src/lib/tag/__tests__/media-ops.test.ts
import { describe, it, expect } from 'vitest';
import { buildMediaDiff } from '../ops';
import type { MediaEdit } from '../types';

const current = { mediaId: 5, alt: null, caption: null, decorative: false };

describe('buildMediaDiff', () => {
  it('no change when alt empty↔null, caption empty, decorative false', () => {
    const edit: MediaEdit = { mediaId: 5, alt: '', caption: '', decorative: false };
    expect(buildMediaDiff(current, edit)).toEqual([]);
  });
  it('alt-only change', () => {
    const edit: MediaEdit = { mediaId: 5, alt: 'کمد ورنا', caption: null, decorative: false };
    const c = buildMediaDiff(current, edit);
    expect(c).toHaveLength(1);
    expect(c[0]!).toMatchObject({ collection: 'media', id: 5, field: 'alt', after: 'کمد ورنا' });
  });
  it('all three change', () => {
    const edit: MediaEdit = { mediaId: 5, alt: 'x', caption: 'y', decorative: true };
    expect(buildMediaDiff(current, edit).map((c) => c.field).sort()).toEqual(['alt', 'caption', 'decorative']);
  });
});
```

- [ ] **Step 7: run tag tests + tsc**

Run: `cd /home/ahmad/Zhic/apps/web && pnpm test -- "lib/tag"` → all pass (incl. alt-gen 5, media-ops 3). Then `pnpm exec tsc --noEmit -p tsconfig.json 2>&1 | grep "lib/tag" || echo CLEAN` → CLEAN.

- [ ] **Step 8: commit**

```bash
cd /home/ahmad/Zhic && git add apps/web/src/lib/tag/alt-gen.ts apps/web/src/lib/tag/types.ts apps/web/src/lib/tag/ops.ts apps/web/src/lib/tag/__tests__/alt-gen.test.ts apps/web/src/lib/tag/__tests__/media-ops.test.ts
git commit -m "feat(tag): ported Persian alt generator + buildMediaDiff + media FieldChange (M3 t1)"
```

---

## Task 2: `loadImagesState` + `GET /api/tag/state?mode=images`

**Files:**
- Modify: `apps/web/src/lib/tag/state.ts`, `apps/web/src/app/(internal)/api/tag/state/route.ts`

- [ ] **Step 1: add `loadImagesState` to `state.ts`**

Add `MediaState` to the type import. Reuse the existing `idOf` helper. Append:
```ts
type PayloadMediaRaw = { id: number; url: string; thumbnailURL?: string | null; filename: string; alt?: string | null; caption?: string | null; decorative?: boolean | null };

/** Build the in-use set + per-media owner context from products/variants/designs, then page media. */
export async function loadImagesState(
  token: string,
  opts: { page: number; limit: number; needsAlt: boolean },
): Promise<{ images: MediaState[]; total: number; totalPages: number; page: number }> {
  const [products, variants, designs] = await Promise.all([
    payloadGet<{ docs: { id: number; name?: string | null; slug?: string | null; piece_type?: string | null; design?: { name?: string | null } | number | null; gallery?: ({ id: number } | number)[] | null }[] }>(`/api/products?limit=500&depth=1`, token),
    payloadGet<{ docs: { id: number; image?: { id: number } | number | null }[] }>(`/api/product-variants?limit=500&depth=0`, token),
    payloadGet<{ docs: Record<string, unknown>[] }>(`/api/designs?limit=200&depth=1`, token),
  ]);

  const inUse = new Set<number>();
  const owner = new Map<number, MediaState['ctx']>();
  for (const p of products.docs) {
    const designName = p.design && typeof p.design === 'object' ? (p.design.name ?? null) : null;
    for (const g of p.gallery ?? []) {
      const id = idOf(g);
      if (id == null) continue;
      inUse.add(id);
      if (!owner.has(id)) owner.set(id, { pieceType: p.piece_type ?? null, designName, productName: p.name ?? null, productSlug: p.slug ?? null });
    }
  }
  for (const v of variants.docs) { const id = idOf(v.image ?? null); if (id != null) inUse.add(id); }
  for (const d of designs.docs) {
    for (const k of ['heroMedia', 'sliderMedia', 'logoMedia'] as const) { const id = idOf((d[k] as { id: number } | number | null) ?? null); if (id != null) inUse.add(id); }
    for (const g of (d.gallery as ({ id: number } | number)[] | null) ?? []) { const id = idOf(g); if (id != null) inUse.add(id); }
    for (const om of (d.occupancyMedia as { image?: { id: number } | number | null }[] | null) ?? []) { const id = idOf(om.image ?? null); if (id != null) inUse.add(id); }
  }

  const where = opts.needsAlt ? '&where[alt][exists]=false' : '';
  const media = await payloadGet<{ docs: PayloadMediaRaw[]; totalDocs: number; totalPages: number }>(
    `/api/media?limit=${opts.limit}&page=${opts.page}&depth=0${where}`, token,
  );
  const images: MediaState[] = media.docs.map((m) => ({
    id: m.id, url: m.url, thumbnailURL: m.thumbnailURL ?? null, filename: m.filename,
    alt: m.alt ?? null, caption: m.caption ?? null, decorative: !!m.decorative,
    inUse: inUse.has(m.id), ctx: owner.get(m.id) ?? null,
  }));
  return { images, total: media.totalDocs, totalPages: media.totalPages, page: opts.page };
}
```
> Verify the product-variants REST slug: the plan assumes `/api/product-variants`. If the collection slug differs (read `services/api/src/collections/ProductVariants.ts` `slug`), use the real one. If a 4xx occurs on that fetch, fix the slug; variants-in-use is a minor refinement (a wrong slug there only mis-flags ~102 variant images as orphan — fix it, don't skip silently).

- [ ] **Step 2: add the `images` branch to the state route**

In `state/route.ts` add an `images` branch before the occupancy default:
```ts
import { loadImagesState } from '@/lib/tag/state'; // add to the existing state import

  if (mode === 'images') {
    const sp = req.nextUrl.searchParams;
    const page = Math.max(1, Number(sp.get('page')) || 1);
    const needsAlt = sp.get('filter') === 'needs-alt';
    const data = await loadImagesState(token, { page, limit: 50, needsAlt });
    return NextResponse.json(data);
  }
```

- [ ] **Step 3: build + smoke**

```bash
cd /home/ahmad/Zhic/apps/web && pnpm build 2>&1 | tail -4 && pm2 restart zhic-web --update-env >/dev/null 2>&1 && sleep 4
TOKEN=$(curl -s -X POST http://127.0.0.1:3001/api/users/login -H 'Content-Type: application/json' -d '{"email":"ahmadreza.torkaman@icloud.com","password":"JesusChristDude"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
echo "--- page 1 ---"; curl -s "http://localhost:3000/api/tag/state?mode=images&page=1" -H "Cookie: tag_session=$TOKEN" | python3 -c "import sys,json;d=json.load(sys.stdin);print('total',d['total'],'pages',d['totalPages'],'n',len(d['images']));i=d['images'][0];print('sample',{k:i[k] for k in ['id','filename','alt','inUse','ctx']})"
echo "--- needs-alt ---"; curl -s "http://localhost:3000/api/tag/state?mode=images&page=1&filter=needs-alt" -H "Cookie: tag_session=$TOKEN" | python3 -c "import sys,json;d=json.load(sys.stdin);print('needs-alt total',d['total'])"
echo "--- 401 ---"; curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/api/tag/state?mode=images"
```
Expected: total ~950, ~19 pages, 50 images on page 1; a sample shows `inUse` true/false + `ctx` (non-null for gallery images, null for orphans); needs-alt total ~429; 401 without cookie. Confirm an in-use gallery image has a non-null `ctx` with `pieceType`+`productSlug`.

- [ ] **Step 4: commit**

```bash
cd /home/ahmad/Zhic && git add apps/web/src/lib/tag/state.ts "apps/web/src/app/(internal)/api/tag/state"
git commit -m "feat(tag): loadImagesState (owner ctx + in-use) + state ?mode=images (M3 t2)"
```

---

## Task 3: Extend preview / apply / undo for media

**Files:**
- Modify: `apps/web/src/app/(internal)/api/tag/preview/route.ts`, `apply/route.ts`, `undo/route.ts`

- [ ] **Step 1: preview `images` branch**

In `preview/route.ts`: import `loadImagesState` + `buildMediaDiff` + `MediaEdit`. Widen the body `mode` type to include `'images'`. Add a branch (mirrors the product branch):
```ts
  if (mode === 'images') {
    // For diffing we need current values for the edited media ids only — load page-agnostic by
    // matching ids against a full scan is wasteful; instead trust the edit's mediaId and fetch each current doc.
    const ids = (edits as MediaEdit[]).map((e) => e.mediaId);
    const current = new Map<number, { alt: string | null; caption: string | null; decorative: boolean }>();
    await Promise.all(ids.map(async (id) => {
      const m = await payloadGet<{ id: number; alt?: string | null; caption?: string | null; decorative?: boolean | null }>(`/api/media/${id}?depth=0`, token);
      current.set(id, { alt: m.alt ?? null, caption: m.caption ?? null, decorative: !!m.decorative });
    }));
    for (const edit of edits as MediaEdit[]) {
      const cur = current.get(edit.mediaId);
      if (!cur) continue;
      changes.push(...buildMediaDiff({ mediaId: edit.mediaId, ...cur }, edit));
    }
  } else if (mode === 'product') {
    // ...existing...
```
(Add `import { payloadGet } from '@/lib/tag/payload-rest';` if not already imported in preview.) Keep the `occupancy`/`product` branches unchanged.

- [ ] **Step 2: apply allow-list — add media + fields**

In `apply/route.ts` extend the M2 allow-list sets:
```ts
  const VALID_COLLECTIONS = new Set(['designs', 'products', 'media']);
  const VALID_FIELDS = new Set(['occupancies', 'occupancyMedia', 'alt', 'caption', 'decorative']);
```
No other apply change — the `byDoc` grouping + per-collection snapshot/patch/revalidate already handle `media` generically (`payloadPatch('media', id, {alt, caption, decorative})`, snapshot `media.json`, `revalidateTag('media')`).

- [ ] **Step 3: undo — allow `media` + restore branch**

In `undo/route.ts`: extend the collection allow-list filter to include `'media'`, and add a media restore branch:
```ts
    collections = collections.filter((c) => c === 'designs' || c === 'products' || c === 'media');
```
In the per-doc restore loop, after the `designs` branch add:
```ts
      } else if (col === 'media') {
        data.alt = (doc.alt as string | null) ?? null;
        data.caption = (doc.caption as string | null) ?? null;
        data.decorative = Boolean(doc.decorative);
      }
```
But the current loop seeds `data = { occupancies: doc.occupancies ?? [] }` for every collection — that's wrong for media (media has no occupancies). Restructure the loop so the base `data` is built per-collection:
```ts
    for (const doc of snap.docs) {
      const id = doc.id as number;
      let data: Record<string, unknown>;
      if (col === 'media') {
        data = { alt: (doc.alt as string | null) ?? null, caption: (doc.caption as string | null) ?? null, decorative: Boolean(doc.decorative) };
      } else {
        data = { occupancies: doc.occupancies ?? [] };
        if (col === 'designs') {
          data.occupancyMedia = ((doc.occupancyMedia as { occupancy: string; image: number | { id: number } }[] | null) ?? [])
            .map((m) => ({ occupancy: m.occupancy, image: typeof m.image === 'number' ? m.image : m.image?.id }));
        }
      }
      await payloadPatch(col as 'designs' | 'products' | 'media', id, data, token);
      restored++;
      // ...existing audit try/catch...
    }
```

- [ ] **Step 4: build + smoke (media apply→verify→undo, + design/product regression). LEAVE CLEAN.**

```bash
cd /home/ahmad/Zhic/apps/web && pnpm build 2>&1 | tail -4 && pm2 restart zhic-web --update-env >/dev/null 2>&1 && sleep 4
TOKEN=$(curl -s -X POST http://127.0.0.1:3001/api/users/login -H 'Content-Type: application/json' -d '{"email":"ahmadreza.torkaman@icloud.com","password":"JesusChristDude"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
# pick a media id WITH empty alt; capture ORIGINAL alt/caption/decorative
MID=$(curl -s "http://localhost:3000/api/tag/state?mode=images&page=1&filter=needs-alt" -H "Cookie: tag_session=$TOKEN" | python3 -c "import sys,json;print(json.load(sys.stdin)['images'][0]['id'])")
curl -s "http://127.0.0.1:3001/api/media/$MID?depth=0" -H "Authorization: JWT $TOKEN" | python3 -c "import sys,json;d=json.load(sys.stdin);print('ORIG',{'alt':d.get('alt'),'caption':d.get('caption'),'decorative':d.get('decorative')})"
# preview a test alt, apply, verify, undo, verify restored
PV=$(curl -s -X POST http://localhost:3000/api/tag/preview -H "Cookie: tag_session=$TOKEN" -H 'Content-Type: application/json' -d "{\"mode\":\"images\",\"edits\":[{\"mediaId\":$MID,\"alt\":\"تست الت\",\"caption\":null,\"decorative\":false}]}")
echo "PREVIEW: $PV"
AP=$(curl -s -X POST http://localhost:3000/api/tag/apply -H "Cookie: tag_session=$TOKEN" -H 'Content-Type: application/json' -d "$PV"); echo "APPLY: $AP"
curl -s "http://127.0.0.1:3001/api/media/$MID?depth=0" -H "Authorization: JWT $TOKEN" | python3 -c "import sys,json;print('AFTER alt',json.load(sys.stdin).get('alt'))"
DIR=$(echo "$AP" | python3 -c "import sys,json;print(json.load(sys.stdin)['backupDir'])"); ls "$DIR"
UN=$(curl -s -X POST http://localhost:3000/api/tag/undo -H "Cookie: tag_session=$TOKEN" -H 'Content-Type: application/json' -d "{\"backupDir\":\"$DIR\"}"); echo "UNDO: $UN"
curl -s "http://127.0.0.1:3001/api/media/$MID?depth=0" -H "Authorization: JWT $TOKEN" | python3 -c "import sys,json;print('RESTORED alt',json.load(sys.stdin).get('alt'))"
```
Expected: preview → 1 `media/alt` change + token; apply `{applied:1, backupDir}` with `media.json` in the dir; AFTER alt == "تست الت"; undo `{restored:1}`; RESTORED alt == ORIGINAL (null/empty). Also re-run a quick DESIGN apply→undo (regression, M2 path). Confirm apply with `field:'kind'` (invalid) → 400 (allow-list). **Leave catalog clean.**

- [ ] **Step 5: commit**

```bash
cd /home/ahmad/Zhic && git add "apps/web/src/app/(internal)/api/tag/preview" "apps/web/src/app/(internal)/api/tag/apply" "apps/web/src/app/(internal)/api/tag/undo"
git commit -m "feat(tag): media branch in preview + apply/undo allow-list & restore (M3 t3)"
```

---

## Task 4: Images mode UI + nav + page dispatch

**Files:**
- Create: `apps/web/src/app/(internal)/atelier/tag/ImagesMode.tsx`
- Modify: `apps/web/src/app/(internal)/atelier/tag/ModeNav.tsx`, `page.tsx`, `tag-panel.css`

- [ ] **Step 1: ModeNav — add images link**

Widen `active` to `'occupancy' | 'product' | 'images'` and add a third link:
```tsx
      <Link href="/atelier/tag?mode=images" className={active === 'images' ? 'is-active' : ''}>برچسب تصاویر</Link>
```

- [ ] **Step 2: page.tsx dispatch**

```tsx
import { ImagesMode } from './ImagesMode';
// ...
  if (mode === 'product') return <ProductMode />;
  if (mode === 'images') return <ImagesMode />;
  return <OccupancyMode userEmail={user.email} initialMode={mode} />;
```

- [ ] **Step 3: ImagesMode.tsx**

```tsx
// apps/web/src/app/(internal)/atelier/tag/ImagesMode.tsx
'use client';
import { useCallback, useEffect, useState } from 'react';
import { toPersianDigits } from '@zhic/locale';
import { altFromContext } from '@/lib/tag/alt-gen';
import { ModeNav } from './ModeNav';

type Img = {
  id: number; url: string; thumbnailURL: string | null; filename: string;
  alt: string | null; caption: string | null; decorative: boolean;
  inUse: boolean; ctx: { pieceType: string | null; designName: string | null; productName: string | null; productSlug: string | null } | null;
};

export function ImagesMode() {
  const [images, setImages] = useState<Img[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [needsAlt, setNeedsAlt] = useState(true);
  const [focus, setFocus] = useState(0);
  const [status, setStatus] = useState('');
  const [lastBackupDir, setLastBackupDir] = useState<string | null>(null);

  const load = useCallback(async (p: number, filterNeedsAlt: boolean) => {
    const q = `?mode=images&page=${p}${filterNeedsAlt ? '&filter=needs-alt' : ''}`;
    const res = await fetch(`/api/tag/state${q}`, { cache: 'no-store' });
    const d = await res.json();
    setImages(d.images); setTotal(d.total); setTotalPages(d.totalPages); setPage(d.page); setFocus(0);
  }, []);
  useEffect(() => { load(page, needsAlt); }, [load, page, needsAlt]);

  const cur = images[focus];

  const patch = (id: number, fields: Partial<Pick<Img, 'alt' | 'caption' | 'decorative'>>) =>
    setImages((xs) => xs.map((x) => x.id === id ? { ...x, ...fields } : x));

  const regenerate = (img: Img) => {
    if (!img.ctx) { setStatus('بدون محصول مرجع — تولید خودکار ممکن نیست'); return; }
    patch(img.id, { alt: altFromContext({ filename: img.filename, ...img.ctx }) });
  };

  const save = useCallback(async (img: Img) => {
    setStatus('در حال ذخیره…');
    try {
      const pvRes = await fetch('/api/tag/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'images', edits: [{ mediaId: img.id, alt: img.alt, caption: img.caption, decorative: img.decorative }] }) });
      const pv = await pvRes.json();
      if (!pvRes.ok) { setStatus(`خطا: ${pv.error ?? pvRes.status}`); return; }
      if (!pv.changes?.length) { setStatus('تغییری نیست'); return; }
      const apRes = await fetch('/api/tag/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pv) });
      const ap = await apRes.json();
      if (apRes.ok && ap.applied) { setLastBackupDir(ap.backupDir); setStatus(`ذخیره شد (${ap.backupDir.split('/').pop()})`); }
      else setStatus(`خطا: ${ap.error ?? apRes.status}`);
    } catch { setStatus('خطا در ذخیره‌سازی'); }
  }, []);

  const undo = useCallback(async () => {
    if (!lastBackupDir) { setStatus('چیزی برای بازگردانی نیست'); return; }
    try {
      const res = await fetch('/api/tag/undo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ backupDir: lastBackupDir }) });
      const d = await res.json();
      setStatus(res.ok ? `بازگردانی شد (${d.restored})` : `خطا: ${d.error ?? ''}`);
      setLastBackupDir(null); await load(page, needsAlt);
    } catch { setStatus('خطا در بازگردانی'); }
  }, [lastBackupDir, load, page, needsAlt]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === 'TEXTAREA' || tag === 'INPUT';
      if (e.key === 'ArrowDown' && !typing) { e.preventDefault(); setFocus((f) => Math.min(f + 1, images.length - 1)); }
      else if (e.key === 'ArrowUp' && !typing) { e.preventDefault(); setFocus((f) => Math.max(f - 1, 0)); }
      else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); if (cur) save(cur); }
      else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'r') { e.preventDefault(); if (cur) regenerate(cur); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [images.length, cur, save]);

  return (
    <main className="zh-tag">
      <ModeNav active="images" />
      <div className="zh-tag-score" role="status">
        <span className="zh-tag-score__chip">{needsAlt ? 'بدون الت' : 'همه'}: {toPersianDigits(total)} تصویر</span>
        <label className="zh-tag-score__chip"><input type="checkbox" checked={needsAlt} onChange={(e) => { setNeedsAlt(e.target.checked); setPage(1); }} /> فقط بدون الت</label>
        <span className="zh-tag-score__chip">صفحه {toPersianDigits(page)}/{toPersianDigits(totalPages)}</span>
        <button className="zh-tag__age" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>قبلی</button>
        <button className="zh-tag__age" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>بعدی</button>
        <button className="zh-tag__age" disabled={!lastBackupDir} onClick={undo}>بازگردانی</button>
      </div>
      <ul className="zh-tag__imglist">
        {images.map((img, i) => {
          const border = img.decorative || (img.alt ?? '').trim() ? 'is-set' : (img.inUse ? 'is-empty' : 'is-orphan');
          return (
            <li key={img.id} className={`zh-tag__img ${border}${i === focus ? ' is-focus' : ''}`} onClick={() => setFocus(i)}>
              <img className="zh-tag__thumb" src={img.thumbnailURL || img.url} alt="" loading="lazy" />
              <div className="zh-tag__imgfields">
                <div className="zh-tag__imgmeta">{img.filename}{!img.inUse ? ' · بدون مرجع' : ''}</div>
                <textarea className="zh-tag__alt" rows={2} placeholder="الت…" value={img.alt ?? ''} onChange={(e) => patch(img.id, { alt: e.target.value })} />
                <input className="zh-tag__caption" placeholder="کپشن…" value={img.caption ?? ''} onChange={(e) => patch(img.id, { caption: e.target.value })} />
                <div className="zh-tag__imgactions">
                  <label><input type="checkbox" checked={img.decorative} onChange={(e) => patch(img.id, { decorative: e.target.checked })} /> تزئینی</label>
                  <button className="zh-tag__age" onClick={() => regenerate(img)} disabled={!img.ctx}>تولید الت <kbd>⌘R</kbd></button>
                  <button className="zh-tag__age" onClick={() => save(img)}>ذخیره <kbd>⌘S</kbd></button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="zh-tag__status" role="status">{status}</p>
    </main>
  );
}
```
> Save is per-image (one click/⌘S per row) for M1/M2 parity and safe snapshots. The keyboard ⌘S/⌘R act on the focused row even while typing in its textarea.

- [ ] **Step 4: append CSS to `tag-panel.css`**

```css
.zh-tag__imglist { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.zh-tag__img { display: flex; gap: 0.75rem; padding: 0.5rem; border-radius: 6px; border-inline-start: 4px solid transparent; background: var(--color-ivory); }
.zh-tag__img.is-set { border-inline-start-color: var(--color-forest); }
.zh-tag__img.is-empty { border-inline-start-color: var(--color-gold); }
.zh-tag__img.is-orphan { border-inline-start-color: #b8b2a8; opacity: 0.85; }
.zh-tag__img.is-focus { background: var(--color-cream); }
.zh-tag__thumb { width: 120px; height: 90px; object-fit: cover; border-radius: 4px; flex: 0 0 auto; }
.zh-tag__imgfields { display: flex; flex-direction: column; gap: 0.3rem; flex: 1 1 auto; }
.zh-tag__imgmeta { font-size: 0.75rem; color: var(--color-stone); direction: ltr; text-align: start; }
.zh-tag__alt, .zh-tag__caption { width: 100%; font: inherit; padding: 0.3rem 0.5rem; border: 1px solid var(--color-cream); border-radius: 4px; }
.zh-tag__imgactions { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
```

- [ ] **Step 5: build + ship + gate check**

Run: `cd /home/ahmad/Zhic/apps/web && pnpm build 2>&1 | tail -5 && pm2 restart zhic-web --update-env >/dev/null 2>&1 && sleep 4 && curl -s -o /dev/null -w "images %{http_code}\n" "http://localhost:3000/atelier/tag?mode=images"`
Expected: build succeeds; `?mode=images` → 307 (gate). Full UI verified in Task 5.

- [ ] **Step 6: commit**

```bash
cd /home/ahmad/Zhic && git add "apps/web/src/app/(internal)/atelier/tag/ImagesMode.tsx" "apps/web/src/app/(internal)/atelier/tag/ModeNav.tsx" "apps/web/src/app/(internal)/atelier/tag/page.tsx" "apps/web/src/app/(internal)/atelier/tag/tag-panel.css"
git commit -m "feat(tag): images mode UI (alt/caption/decorative queue + regenerate) (M3 t4)"
```

---

## Task 5: End-to-end verification + ship

**Files:** none (verification).

- [ ] **Step 1: full suite** — `cd /home/ahmad/Zhic/apps/web && pnpm test` → all pass (incl. alt-gen, media-ops). Report counts.

- [ ] **Step 2: headless images round-trip (mutate→save→undo→clean).** Use the M1 headless recipe. Login; `/atelier/tag?mode=images`; assert ModeNav (3 links), the «بدون الت: N تصویر» chip, pagination controls, and ≥1 `.zh-tag__img` row with a thumbnail + alt textarea. Capture a needs-alt image's original alt (API). In the UI: click **تولید الت** (regenerate) on an in-use row → assert the alt textarea fills with Persian text; click ذخیره → «ذخیره شد»; click بازگردانی → «بازگردانی شد»; GET the media via API and assert alt == original (null). Screenshot `/tmp/tag-images.png`.

- [ ] **Step 3: regenerate correctness spot-check.** For one in-use gallery image, compare the UI-regenerated alt to `altFromContext` run on the same `{filename, ctx}` — they must match (same pure function). Confirm an orphan row's **تولید الت** button is disabled (no ctx).

- [ ] **Step 4: regression.** `?mode=occupancy` (27 designs) and `?mode=product` still load + an apply→undo round-trips clean on each. The generalized apply/undo must not have broken M1/M2.

- [ ] **Step 5: cleanliness + ship.** Verify every touched media/design/product == original (GET depth=0). `git status --short` clean. `git log --oneline -10`. Marker commit `git commit -m "chore(tag): M3 alt/caption/decorative queue verified" --allow-empty`. Then `git push`.

- [ ] **Step 6: report** the verification transcript + "CATALOG LEFT CLEAN".

---

## Self-review checklist (run before handoff)

- **Spec coverage (M3):** paginated alt/caption/decorative queue (t2,t4) ✓; green/amber/gray borders (t4) ✓; RTL alt textarea + decorative + caption (t4) ✓; **[Regenerate] reusing reconcile-10 templating** — ported verbatim as a pure tested function (t1) ✓; preview/apply/undo extended for media with the shared safety layer (t3) ✓.
- **Regression safety:** the design/product paths must keep working through the extended apply/undo/preview — t3/t5 re-verify. The apply allow-list now includes media+3 fields; undo restructured so media doesn't get an `occupancies` key.
- **Deliberate simplifications (vs spec, noted):** queue uses a **needs-alt filter** (`where[alt][exists]=false`) + per-row in-use/orphan border instead of a global in-use-first sort (sorting 950 across pagination is costly; the filter is the productivity lever). `where[alt][exists]=false` catches null alt (the 429 empties); empty-string alt would not be caught (none expected). Per-image save (not bulk) for safe snapshots.
- **Type consistency:** `FieldChange.collection +media`, `field +alt/caption/decorative`; `MediaEdit{mediaId,alt,caption,decorative}`, `MediaState`, `MediaCurrent`, `buildMediaDiff`, `altFromContext(AltContext)`, `loadImagesState({page,limit,needsAlt})`. Names used identically across tasks.
- **No placeholders:** every code step has full code; every run step exact command + expected output. The one "verify the product-variants slug" note (t2) is a deliberate runtime confirmation, not a placeholder.

## Open items (not blocking)
- `loadImagesState` rebuilds the owner/in-use maps (products+variants+designs bulk fetch) on every media page load — fine for a solo operator; cache later if needed (carries the M1/M2 `limit=500/200` note).
- Alt-gen size detection is tuned for bed widths (2–3 digit tokens); other piece types rarely have standalone numeric size tokens — acceptable, matches `reconcile-10`.
- `where[alt][exists]=false` misses empty-string (not null) alt; if any exist, a follow-up could add `where[or][...]`.
