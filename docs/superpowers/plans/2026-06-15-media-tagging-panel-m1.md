# Media Tagging Panel — M1 (Occupancy / Design-Poster Builder) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the standalone, login-gated `/atelier/tag` panel's **occupancy mode** end-to-end — per design (27) set `design.occupancies` + pick the per-age poster into `design.occupancyMedia` — through a dry-run + JSON-snapshot + reverse-apply-undo write layer, so the `/bedroom-set` age tabs become correct.

**Architecture:** New gated route group `apps/web/src/app/(internal)/` with a panel-local login (the `payload-token` cookie is on the `:3001` origin, unreachable from `:3000`, so the panel POSTs credentials to Payload `POST /api/users/login` server-side and sets its own HttpOnly `tag_session` cookie). Writes go through authenticated Payload **REST** (`PATCH /api/designs/:id`, forwarding `Authorization: JWT <token>`) — server-to-server, so no `Origin` header and the CSRF gate is bypassed; `marketingOrAbove` (admin/editor/marketing) already has update access. Every mutation is dry-run-previewed, JSON-snapshotted to `~/zhic-catalog-backups/`, applied idempotently, audited to `~/zhic-tag-audit.jsonl`, and reversible via reverse-apply.

**Tech Stack:** Next 16 App Router (RSC + route handlers) / React 19 in `apps/web`; Payload 3.83 REST at `http://127.0.0.1:3001`; `@zhic/ui` + `@zhic/locale` + `@zhic/design-system`; **vitest 2.1.8 + @testing-library/react** (already configured). No new runtime deps (no TanStack Query — use client `fetch` + local state).

**Spec:** `docs/superpowers/specs/2026-06-15-media-tagging-panel-design.md`

---

## Conventions (read once)

- **Test command (single file):** `cd /home/ahmad/Zhic/apps/web && pnpm test -- <pattern>` (runs `vitest run <pattern>`). Logic test files need no DOM; component tests start with `/** @vitest-environment jsdom */`.
- **Persian/RTL:** display digits via `toPersianDigits` from `@zhic/locale`; storage/ASCII unchanged. The `(internal)` group inherits the root `<html lang="fa-IR" dir="rtl">`.
- **Payload API base:** `http://127.0.0.1:3001` (server-side only). Define once (Task 4) as `PAYLOAD_API`.
- **Occupancy enum (verified):** `Designs.ts:63-76` `occupancies` hasMany select `[baby,teen,double,bunk]`; `Designs.ts:126-154` `occupancyMedia` array of `{ occupancy: select(required), image: upload→media(required) }`. `payload.ts:39` type `occupancyMedia: { occupancy: Occupancy; image?: PayloadMedia|null }[] | null`.
- **Build/ship:** prod-build box — `cd apps/web && pnpm build && pm2 restart zhic-web --update-env`. No migration (zero schema changes).
- **Auth header format (verified this session):** Payload accepts `Authorization: JWT <token>`; `POST /api/users/login` returns `{ token, user }`; `GET /api/users/me` returns `{ user }`.

## File structure (locked decomposition)

Create under `apps/web/src/`:

| File | Responsibility |
|---|---|
| `lib/tag/types.ts` | Shared types + `OCCUPANCIES`, `OCCUPANCY_FA`, `ALLOWED_ROLES` |
| `lib/tag/config.ts` | `PAYLOAD_API`, `SESSION_COOKIE`, `BACKUP_ROOT`, `AUDIT_PATH` |
| `lib/tag/ops.ts` | Pure: `buildDesignDiff`, `reverseChanges`, `makeConfirmToken` |
| `lib/tag/auth.ts` | `isAllowedRole`, `verifyToken`, `getTagUser`, `loginToPayload` |
| `lib/tag/payload-rest.ts` | `payloadGet`, `payloadPatch` (authed, no-cache, server-side) |
| `lib/tag/snapshot.ts` | `writeSnapshot`, `readSnapshot`, `appendAudit` |
| `lib/tag/state.ts` | `loadOccupancyState` (reads designs+media for occupancy mode) |
| `middleware.ts` | Cheap cookie-presence gate on `/atelier/tag` + `/api/tag/*` |
| `app/(internal)/layout.tsx` | RSC gate (role check) |
| `app/(internal)/atelier/tag/login/page.tsx` + `actions.ts` | Panel login |
| `app/(internal)/atelier/tag/page.tsx` | Mode shell (M1: occupancy) |
| `app/(internal)/atelier/tag/OccupancyMode.tsx` | `'use client'` occupancy UI |
| `app/(internal)/atelier/tag/Scoreboard.tsx` | `'use client'` done-ness strip |
| `app/(internal)/atelier/tag/tag-panel.css` | Panel styles |
| `app/(internal)/api/tag/state/route.ts` | `GET` occupancy state |
| `app/(internal)/api/tag/preview/route.ts` | `POST` dry-run diff |
| `app/(internal)/api/tag/apply/route.ts` | `POST` snapshot→PATCH→audit→revalidate |
| `app/(internal)/api/tag/undo/route.ts` | `POST` reverse-apply |
| `lib/tag/__tests__/*.test.ts` | Unit tests for pure logic + auth |

---

## Task 1: Shared types + occupancy diff logic (pure, TDD)

**Files:**
- Create: `apps/web/src/lib/tag/types.ts`
- Create: `apps/web/src/lib/tag/ops.ts`
- Test: `apps/web/src/lib/tag/__tests__/ops.test.ts`

- [ ] **Step 1: Write `types.ts`**

```ts
// apps/web/src/lib/tag/types.ts
export type Occupancy = 'baby' | 'teen' | 'double' | 'bunk';
export const OCCUPANCIES: Occupancy[] = ['baby', 'teen', 'double', 'bunk'];
export const OCCUPANCY_FA: Record<Occupancy, string> = {
  baby: 'نوزاد', teen: 'نوجوان', double: 'دونفره', bunk: 'دوطبقه',
};
export const ALLOWED_ROLES = ['admin', 'editor', 'marketing'] as const;
export type AllowedRole = (typeof ALLOWED_ROLES)[number];

export type TagUser = { id: number; email: string; role: string };

/** A poster pick for one age within one design. imageId null = clear the slot. */
export type DesignPoster = { occupancy: Occupancy; imageId: number | null };

/** The full intended state for ONE design, produced by the UI. */
export type DesignEdit = {
  designId: number;
  occupancies: Occupancy[];
  posters: DesignPoster[]; // one entry per asserted occupancy
};

/** A single field-level change for diff/snapshot/audit. */
export type FieldChange = {
  collection: 'designs';
  id: number;
  field: 'occupancies' | 'occupancyMedia';
  before: unknown;
  after: unknown;
};

export type PreviewResult = { changes: FieldChange[]; confirmToken: string };
export type ApplyResult = { applied: number; backupDir: string };
```

- [ ] **Step 2: Write the failing test for `buildDesignDiff` + `reverseChanges`**

```ts
// apps/web/src/lib/tag/__tests__/ops.test.ts
import { describe, it, expect } from 'vitest';
import { buildDesignDiff, reverseChanges } from '../ops';
import type { DesignEdit } from '../types';

const current = {
  designId: 24,
  occupancies: ['teen', 'double'] as const,
  occupancyMedia: [
    { occupancy: 'teen', image: 101 },
    { occupancy: 'double', image: 102 },
  ],
};

describe('buildDesignDiff', () => {
  it('emits no changes when edit matches current', () => {
    const edit: DesignEdit = {
      designId: 24,
      occupancies: ['teen', 'double'],
      posters: [{ occupancy: 'teen', imageId: 101 }, { occupancy: 'double', imageId: 102 }],
    };
    expect(buildDesignDiff(current, edit)).toEqual([]);
  });

  it('detects occupancy add + poster change, order-insensitive for occupancies', () => {
    const edit: DesignEdit = {
      designId: 24,
      occupancies: ['double', 'teen', 'baby'],
      posters: [{ occupancy: 'teen', imageId: 999 }, { occupancy: 'double', imageId: 102 }, { occupancy: 'baby', imageId: 500 }],
    };
    const changes = buildDesignDiff(current, edit);
    const occ = changes.find((c) => c.field === 'occupancies')!;
    expect([...(occ.after as string[])].sort()).toEqual(['baby', 'double', 'teen']);
    const media = changes.find((c) => c.field === 'occupancyMedia')!;
    expect(media.after).toEqual([
      { occupancy: 'teen', image: 999 },
      { occupancy: 'double', image: 102 },
      { occupancy: 'baby', image: 500 },
    ]);
  });

  it('drops posters whose occupancy is no longer asserted', () => {
    const edit: DesignEdit = {
      designId: 24,
      occupancies: ['teen'],
      posters: [{ occupancy: 'teen', imageId: 101 }],
    };
    const changes = buildDesignDiff(current, edit);
    expect((changes.find((c) => c.field === 'occupancyMedia')!.after as unknown[]).length).toBe(1);
  });
});

describe('reverseChanges', () => {
  it('swaps before/after so applying it restores prior state', () => {
    const changes = [{ collection: 'designs' as const, id: 24, field: 'occupancies' as const, before: ['teen'], after: ['teen', 'baby'] }];
    expect(reverseChanges(changes)).toEqual([{ collection: 'designs', id: 24, field: 'occupancies', before: ['teen', 'baby'], after: ['teen'] }]);
  });
});
```

- [ ] **Step 3: Run it — expect FAIL (module not found)**

Run: `cd /home/ahmad/Zhic/apps/web && pnpm test -- ops.test`
Expected: FAIL — `Cannot find module '../ops'`.

- [ ] **Step 4: Implement `ops.ts`**

```ts
// apps/web/src/lib/tag/ops.ts
import type { DesignEdit, FieldChange, Occupancy } from './types';

/** Current persisted shape of a design's occupancy data (image as numeric id). */
export type DesignCurrent = {
  designId: number;
  occupancies: readonly Occupancy[];
  occupancyMedia: { occupancy: Occupancy; image: number | null }[];
};

const sameSet = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|');

/** Build field-level changes from current state -> the UI's intended edit. */
export function buildDesignDiff(current: DesignCurrent, edit: DesignEdit): FieldChange[] {
  const changes: FieldChange[] = [];

  if (!sameSet(current.occupancies, edit.occupancies)) {
    changes.push({ collection: 'designs', id: edit.designId, field: 'occupancies', before: [...current.occupancies], after: [...edit.occupancies] });
  }

  // occupancyMedia: keep only posters whose occupancy is still asserted, preserve edit order.
  const asserted = new Set(edit.occupancies);
  const nextMedia = edit.posters
    .filter((p) => asserted.has(p.occupancy) && p.imageId != null)
    .map((p) => ({ occupancy: p.occupancy, image: p.imageId as number }));
  const curMedia = current.occupancyMedia.map((m) => ({ occupancy: m.occupancy, image: m.image }));

  if (JSON.stringify(nextMedia) !== JSON.stringify(curMedia)) {
    changes.push({ collection: 'designs', id: edit.designId, field: 'occupancyMedia', before: curMedia, after: nextMedia });
  }
  return changes;
}

/** Reverse a change list so applying it restores the prior values (for undo). */
export function reverseChanges(changes: FieldChange[]): FieldChange[] {
  return changes.map((c) => ({ ...c, before: c.after, after: c.before }));
}

/** Deterministic-enough confirm token from the change set (guards apply against stale preview). */
export function makeConfirmToken(changes: FieldChange[], stamp: string): string {
  const body = JSON.stringify(changes.map((c) => [c.collection, c.id, c.field, c.after]));
  let h = 0;
  for (let i = 0; i < body.length; i++) h = (h * 31 + body.charCodeAt(i)) | 0;
  return `${stamp}.${(h >>> 0).toString(36)}`;
}
```

- [ ] **Step 5: Run tests — expect PASS**

Run: `cd /home/ahmad/Zhic/apps/web && pnpm test -- ops.test`
Expected: PASS (3 in `buildDesignDiff`, 1 in `reverseChanges`).

- [ ] **Step 6: Commit**

```bash
cd /home/ahmad/Zhic && git add apps/web/src/lib/tag/types.ts apps/web/src/lib/tag/ops.ts apps/web/src/lib/tag/__tests__/ops.test.ts
git commit -m "feat(tag): occupancy types + pure diff/reverse logic (M1 t1)"
```

---

## Task 2: Config + authenticated Payload REST helpers

**Files:**
- Create: `apps/web/src/lib/tag/config.ts`
- Create: `apps/web/src/lib/tag/payload-rest.ts`

- [ ] **Step 1: Write `config.ts`**

```ts
// apps/web/src/lib/tag/config.ts
import os from 'node:os';
import path from 'node:path';

// Server-side internal base for Payload (NOT the public :3000 origin).
export const PAYLOAD_API = process.env.PAYLOAD_INTERNAL_URL ?? 'http://127.0.0.1:3001';
export const SESSION_COOKIE = 'tag_session';
export const BACKUP_ROOT = process.env.ZHIC_BACKUP_ROOT ?? path.join(os.homedir(), 'zhic-catalog-backups');
export const AUDIT_PATH = process.env.ZHIC_TAG_AUDIT ?? path.join(os.homedir(), 'zhic-tag-audit.jsonl');
```

- [ ] **Step 2: Write `payload-rest.ts`**

```ts
// apps/web/src/lib/tag/payload-rest.ts
import 'server-only';
import { PAYLOAD_API } from './config';

/** Authenticated GET against Payload REST. token = the operator's JWT. */
export async function payloadGet<T>(pathAndQuery: string, token: string): Promise<T> {
  const res = await fetch(`${PAYLOAD_API}${pathAndQuery}`, {
    headers: { Authorization: `JWT ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`payloadGet ${pathAndQuery} -> ${res.status}`);
  return res.json() as Promise<T>;
}

/** Authenticated PATCH (single document) against Payload REST. */
export async function payloadPatch(collection: 'designs' | 'products' | 'media', id: number, data: Record<string, unknown>, token: string): Promise<void> {
  const res = await fetch(`${PAYLOAD_API}/api/${collection}/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `JWT ${token}`, 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`payloadPatch ${collection}/${id} -> ${res.status} ${text.slice(0, 200)}`);
  }
}
```

- [ ] **Step 3: Typecheck**

Run: `cd /home/ahmad/Zhic/apps/web && pnpm exec tsc --noEmit -p tsconfig.json 2>&1 | grep -E "tag/(config|payload-rest)" || echo "no type errors in tag/config|payload-rest"`
Expected: `no type errors in tag/config|payload-rest`.

- [ ] **Step 4: Commit**

```bash
cd /home/ahmad/Zhic && git add apps/web/src/lib/tag/config.ts apps/web/src/lib/tag/payload-rest.ts
git commit -m "feat(tag): config + authenticated Payload REST helpers (M1 t2)"
```

---

## Task 3: Auth (role check + token verify + login), TDD the pure part

**Files:**
- Create: `apps/web/src/lib/tag/auth.ts`
- Test: `apps/web/src/lib/tag/__tests__/auth.test.ts`

- [ ] **Step 1: Write the failing test (role gate + verifyToken via mocked fetch)**

```ts
// apps/web/src/lib/tag/__tests__/auth.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { isAllowedRole, verifyToken } from '../auth';

afterEach(() => vi.unstubAllGlobals());

describe('isAllowedRole', () => {
  it('accepts admin/editor/marketing, rejects others', () => {
    expect(isAllowedRole('admin')).toBe(true);
    expect(isAllowedRole('marketing')).toBe(true);
    expect(isAllowedRole('viewer')).toBe(false);
    expect(isAllowedRole(undefined)).toBe(false);
  });
});

describe('verifyToken', () => {
  it('returns the user when /me ok + role allowed', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ user: { id: 6, email: 'a@b.c', role: 'admin' } }), { status: 200 })));
    expect(await verifyToken('tok')).toEqual({ id: 6, email: 'a@b.c', role: 'admin' });
  });
  it('returns null on disallowed role', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ user: { id: 7, email: 'x@y.z', role: 'customer' } }), { status: 200 })));
    expect(await verifyToken('tok')).toBeNull();
  });
  it('returns null on 401', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 401 })));
    expect(await verifyToken('bad')).toBeNull();
  });
});
```

- [ ] **Step 2: Run it — expect FAIL**

Run: `cd /home/ahmad/Zhic/apps/web && pnpm test -- auth.test`
Expected: FAIL — `Cannot find module '../auth'`.

- [ ] **Step 3: Implement `auth.ts`**

```ts
// apps/web/src/lib/tag/auth.ts
import 'server-only';
import { cookies } from 'next/headers';
import { ALLOWED_ROLES, type TagUser } from './types';
import { PAYLOAD_API, SESSION_COOKIE } from './config';

export function isAllowedRole(role: string | null | undefined): boolean {
  return !!role && (ALLOWED_ROLES as readonly string[]).includes(role);
}

/** Verify a JWT against Payload /api/users/me and gate on role. Returns user or null. */
export async function verifyToken(token: string): Promise<TagUser | null> {
  let res: Response;
  try {
    res = await fetch(`${PAYLOAD_API}/api/users/me`, { headers: { Authorization: `JWT ${token}` }, cache: 'no-store' });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const data = (await res.json().catch(() => null)) as { user?: { id: number; email: string; role: string } | null } | null;
  const user = data?.user;
  if (!user || !isAllowedRole(user.role)) return null;
  return { id: user.id, email: user.email, role: user.role };
}

/** Read the panel session cookie and verify it. */
export async function getTagUser(): Promise<TagUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getTagToken(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

/** Exchange credentials for a JWT via Payload login (server-side). */
export async function loginToPayload(email: string, password: string): Promise<{ token: string; role: string } | null> {
  let res: Response;
  try {
    res = await fetch(`${PAYLOAD_API}/api/users/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store',
      body: JSON.stringify({ email, password }),
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const data = (await res.json().catch(() => null)) as { token?: string; user?: { role?: string } } | null;
  if (!data?.token || !isAllowedRole(data.user?.role)) return null;
  return { token: data.token, role: data.user!.role! };
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `cd /home/ahmad/Zhic/apps/web && pnpm test -- auth.test`
Expected: PASS (1 + 3).

- [ ] **Step 5: Commit**

```bash
cd /home/ahmad/Zhic && git add apps/web/src/lib/tag/auth.ts apps/web/src/lib/tag/__tests__/auth.test.ts
git commit -m "feat(tag): panel auth — role gate, token verify, payload login (M1 t3)"
```

---

## Task 4: Middleware + `(internal)` layout gate

**Files:**
- Create: `apps/web/src/middleware.ts`
- Create: `apps/web/src/app/(internal)/layout.tsx`

- [ ] **Step 1: Write `middleware.ts` (cheap cookie-presence gate)**

```ts
// apps/web/src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'tag_session';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Allow the login page + its action through unauthenticated.
  if (pathname.startsWith('/atelier/tag/login')) return NextResponse.next();
  const hasSession = req.cookies.has(SESSION_COOKIE);
  if (hasSession) return NextResponse.next();
  if (pathname.startsWith('/api/tag')) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = '/atelier/tag/login';
  return NextResponse.redirect(url);
}

export const config = { matcher: ['/atelier/tag', '/atelier/tag/:path*', '/api/tag/:path*'] };
```

- [ ] **Step 2: Write the `(internal)` layout (real role verification)**

```tsx
// apps/web/src/app/(internal)/layout.tsx
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getTagUser } from '@/lib/tag/auth';
import '../globals.css';

export const dynamic = 'force-dynamic'; // never cache an authed surface

export default async function InternalLayout({ children }: { children: React.ReactNode }) {
  // Login page renders its own minimal tree; skip the gate there.
  const pathname = (await headers()).get('x-invoke-path') ?? (await headers()).get('next-url') ?? '';
  if (!pathname.includes('/atelier/tag/login')) {
    const user = await getTagUser();
    if (!user) redirect('/atelier/tag/login');
  }
  return <div className="zh-tag-root" data-internal>{children}</div>;
}
```

> Note: header-based path detection is a belt-and-suspenders fallback; the login page additionally lives OUTSIDE the gate by checking the user inside each protected page (Task 6/7 pages call `getTagUser()` too). If `headers()` exposes no usable path key at runtime, the login `page.tsx` (Task 5) calls `redirect('/atelier/tag')` when already authed, and protected pages call `getTagUser()` → `redirect('/atelier/tag/login')` when not — so the gate holds regardless.

- [ ] **Step 3: Build to confirm the route group + middleware compile**

Run: `cd /home/ahmad/Zhic/apps/web && pnpm build 2>&1 | tail -5`
Expected: build succeeds; output lists `ƒ Middleware` and the `(internal)` routes once Task 5 adds a page (for now, an empty group may warn "no page" — acceptable until Task 5; if build fails on empty group, proceed to Task 5 first, then build).

- [ ] **Step 4: Commit**

```bash
cd /home/ahmad/Zhic && git add apps/web/src/middleware.ts "apps/web/src/app/(internal)/layout.tsx"
git commit -m "feat(tag): middleware cookie gate + (internal) role-gated layout (M1 t4)"
```

---

## Task 5: Login page + action (panel-local session)

**Files:**
- Create: `apps/web/src/app/(internal)/atelier/tag/login/page.tsx`
- Create: `apps/web/src/app/(internal)/atelier/tag/login/actions.ts`

- [ ] **Step 1: Write the login server action**

```ts
// apps/web/src/app/(internal)/atelier/tag/login/actions.ts
'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { loginToPayload } from '@/lib/tag/auth';
import { SESSION_COOKIE } from '@/lib/tag/config';

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!email || !password) return { error: 'ایمیل و رمز عبور لازم است.' };
  const result = await loginToPayload(email, password);
  if (!result) return { error: 'ورود ناموفق بود یا دسترسی ندارید.' };
  (await cookies()).set(SESSION_COOKIE, result.token, {
    httpOnly: true, sameSite: 'lax', secure: false, // :3000 over http on the review VPS
    path: '/', maxAge: 60 * 60 * 24 * 7, // 7d, matches Payload token expiry
  });
  redirect('/atelier/tag');
}
```

- [ ] **Step 2: Write the login page**

```tsx
// apps/web/src/app/(internal)/atelier/tag/login/page.tsx
'use client';
import { useActionState } from 'react';
import { Button, FormField, Input } from '@zhic/ui';
import { loginAction, type LoginState } from './actions';

const INITIAL: LoginState = {};

export default function TagLoginPage() {
  const [state, action, pending] = useActionState(loginAction, INITIAL);
  return (
    <main style={{ maxWidth: 360, margin: '12vh auto', padding: '0 1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem' }}>ورود به پنل برچسب‌گذاری</h1>
      <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <FormField label="ایمیل"><Input name="email" type="email" autoComplete="username" required /></FormField>
        <FormField label="رمز عبور"><Input name="password" type="password" autoComplete="current-password" required /></FormField>
        {state.error ? <p role="alert" style={{ color: 'var(--color-danger, #b00)' }}>{state.error}</p> : null}
        <Button type="submit" variant="primary" size="md" disabled={pending}>{pending ? 'در حال ورود…' : 'ورود'}</Button>
      </form>
    </main>
  );
}
```

- [ ] **Step 3: Build**

Run: `cd /home/ahmad/Zhic/apps/web && pnpm build 2>&1 | tail -6`
Expected: build succeeds; `/atelier/tag/login` appears in the route list.

- [ ] **Step 4: Commit**

```bash
cd /home/ahmad/Zhic && git add "apps/web/src/app/(internal)/atelier/tag/login"
git commit -m "feat(tag): panel-local login page + action (M1 t5)"
```

---

## Task 6: Snapshot + audit + undo helpers

**Files:**
- Create: `apps/web/src/lib/tag/snapshot.ts`
- Test: `apps/web/src/lib/tag/__tests__/snapshot.test.ts`

- [ ] **Step 1: Write the failing test (snapshot round-trip + audit append, using a temp BACKUP_ROOT)**

```ts
// apps/web/src/lib/tag/__tests__/snapshot.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let tmp: string;
beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tagtest-'));
  process.env.ZHIC_BACKUP_ROOT = path.join(tmp, 'backups');
  process.env.ZHIC_TAG_AUDIT = path.join(tmp, 'audit.jsonl');
});
afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }));

it('writeSnapshot writes {docs:[...]} per collection and returns the dir', async () => {
  const { writeSnapshot } = await import('../snapshot');
  const dir = writeSnapshot('20260615-1200-test', { designs: [{ id: 24, occupancies: ['teen'] }] });
  expect(fs.existsSync(path.join(dir, 'designs.json'))).toBe(true);
  const parsed = JSON.parse(fs.readFileSync(path.join(dir, 'designs.json'), 'utf8'));
  expect(parsed.docs[0].id).toBe(24);
});

it('appendAudit appends one JSONL line per call', async () => {
  const { appendAudit } = await import('../snapshot');
  appendAudit({ ts: 't1', user_id: 6, mode: 'occupancy', op: 'set-design-occupancies', target_id: 24 });
  appendAudit({ ts: 't2', user_id: 6, mode: 'occupancy', op: 'set-design-poster', target_id: 24 });
  const lines = fs.readFileSync(process.env.ZHIC_TAG_AUDIT!, 'utf8').trim().split('\n');
  expect(lines.length).toBe(2);
  expect(JSON.parse(lines[0]).ts).toBe('t1');
});
```

> Because `config.ts` reads env at import time, the test sets `ZHIC_BACKUP_ROOT`/`ZHIC_TAG_AUDIT` **before** the dynamic `import('../snapshot')`. Keep the dynamic import inside each test.

- [ ] **Step 2: Run it — expect FAIL**

Run: `cd /home/ahmad/Zhic/apps/web && pnpm test -- snapshot.test`
Expected: FAIL — `Cannot find module '../snapshot'`.

- [ ] **Step 3: Implement `snapshot.ts`**

```ts
// apps/web/src/lib/tag/snapshot.ts
import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { BACKUP_ROOT, AUDIT_PATH } from './config';

/** Write a per-collection JSON snapshot in Payload's {docs:[...]} envelope. Returns the dir. */
export function writeSnapshot(label: string, byCollection: Record<string, unknown[]>): string {
  const dir = path.join(BACKUP_ROOT, `tag-${label}`);
  fs.mkdirSync(dir, { recursive: true });
  for (const [collection, docs] of Object.entries(byCollection)) {
    fs.writeFileSync(path.join(dir, `${collection}.json`), JSON.stringify({ docs, totalDocs: docs.length }, null, 2), 'utf8');
  }
  return dir;
}

export function readSnapshot(dir: string, collection: string): { docs: Record<string, unknown>[] } {
  return JSON.parse(fs.readFileSync(path.join(dir, `${collection}.json`), 'utf8'));
}

export function appendAudit(entry: Record<string, unknown>): void {
  fs.mkdirSync(path.dirname(AUDIT_PATH), { recursive: true });
  fs.appendFileSync(AUDIT_PATH, JSON.stringify(entry) + '\n', 'utf8');
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `cd /home/ahmad/Zhic/apps/web && pnpm test -- snapshot.test`
Expected: PASS (2).

- [ ] **Step 5: Commit**

```bash
cd /home/ahmad/Zhic && git add apps/web/src/lib/tag/snapshot.ts apps/web/src/lib/tag/__tests__/snapshot.test.ts
git commit -m "feat(tag): JSON snapshot backup + audit-log helpers (M1 t6)"
```

---

## Task 7: Occupancy state loader + `GET /api/tag/state`

**Files:**
- Create: `apps/web/src/lib/tag/state.ts`
- Create: `apps/web/src/app/(internal)/api/tag/state/route.ts`

- [ ] **Step 1: Implement `state.ts` (read all designs + their candidate images)**

```ts
// apps/web/src/lib/tag/state.ts
import 'server-only';
import { payloadGet } from './payload-rest';
import type { Occupancy } from './types';

export type CandidateImage = { id: number; url: string; alt: string | null; filename: string };
export type DesignState = {
  designId: number;
  slug: string;
  title: string;
  occupancies: Occupancy[];
  posters: { occupancy: Occupancy; imageId: number }[];
  candidates: CandidateImage[]; // gallery + slider + hero images for this design
};

type PayloadDesignRaw = {
  id: number; slug: string; title: string;
  occupancies?: Occupancy[] | null;
  occupancyMedia?: { occupancy: Occupancy; image?: { id: number } | number | null }[] | null;
  heroMedia?: { id: number; url: string; alt?: string | null; filename: string } | number | null;
  sliderMedia?: { id: number; url: string; alt?: string | null; filename: string } | number | null;
};
type PayloadProductRaw = { id: number; design?: { id: number } | number | null; gallery?: { id: number; url: string; alt?: string | null; filename: string }[] | null };

const idOf = (v: { id: number } | number | null | undefined): number | null =>
  v == null ? null : typeof v === 'number' ? v : v.id;

/** Load occupancy-mode state for ALL designs. depth=1 hydrates upload + relation docs. */
export async function loadOccupancyState(token: string): Promise<DesignState[]> {
  const designs = await payloadGet<{ docs: PayloadDesignRaw[] }>(`/api/designs?limit=200&depth=1`, token);
  // Products carry the gallery images; group candidate images by design.
  const products = await payloadGet<{ docs: PayloadProductRaw[] }>(`/api/products?limit=500&depth=1`, token);
  const galleryByDesign = new Map<number, CandidateImage[]>();
  for (const p of products.docs) {
    const did = idOf(p.design ?? null);
    if (did == null) continue;
    const arr = galleryByDesign.get(did) ?? [];
    for (const g of p.gallery ?? []) {
      if (g && typeof g === 'object') arr.push({ id: g.id, url: g.url, alt: g.alt ?? null, filename: g.filename });
    }
    galleryByDesign.set(did, arr);
  }

  return designs.docs.map((d) => {
    const candidates = new Map<number, CandidateImage>();
    for (const c of galleryByDesign.get(d.id) ?? []) candidates.set(c.id, c);
    for (const key of ['heroMedia', 'sliderMedia'] as const) {
      const m = d[key];
      if (m && typeof m === 'object') candidates.set(m.id, { id: m.id, url: m.url, alt: m.alt ?? null, filename: m.filename });
    }
    const posters = (d.occupancyMedia ?? [])
      .map((om) => ({ occupancy: om.occupancy, imageId: idOf(om.image ?? null) }))
      .filter((p): p is { occupancy: Occupancy; imageId: number } => p.imageId != null);
    return {
      designId: d.id, slug: d.slug, title: d.title,
      occupancies: d.occupancies ?? [],
      posters,
      candidates: [...candidates.values()],
    };
  });
}
```

- [ ] **Step 2: Implement the route**

```ts
// apps/web/src/app/(internal)/api/tag/state/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getTagUser, getTagToken } from '@/lib/tag/auth';
import { loadOccupancyState } from '@/lib/tag/state';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const user = await getTagUser();
  const token = await getTagToken();
  if (!user || !token) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const designs = await loadOccupancyState(token);
  const complete = designs.filter((d) => d.occupancies.length > 0 && d.occupancies.every((o) => d.posters.some((p) => p.occupancy === o))).length;
  return NextResponse.json({ designs, scoreboard: { designsComplete: complete, designsTotal: designs.length } });
}
```

- [ ] **Step 3: Build + manual smoke (authenticated)**

Run: `cd /home/ahmad/Zhic/apps/web && pnpm build 2>&1 | tail -4 && pm2 restart zhic-web --update-env >/dev/null 2>&1 && sleep 4`
Then (server-to-server token, reusing the verified login flow):
```bash
TOKEN=$(curl -s -X POST http://127.0.0.1:3001/api/users/login -H 'Content-Type: application/json' -d '{"email":"ahmadreza.torkaman@icloud.com","password":"JesusChristDude"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
curl -s "http://localhost:3000/api/tag/state" -H "Cookie: tag_session=$TOKEN" | python3 -c "import sys,json;d=json.load(sys.stdin);print('designs',len(d['designs']),'complete',d['scoreboard'])"
```
Expected: prints `designs 27 complete {...}` (and `designsComplete` ~4).

- [ ] **Step 4: Commit**

```bash
cd /home/ahmad/Zhic && git add apps/web/src/lib/tag/state.ts "apps/web/src/app/(internal)/api/tag/state"
git commit -m "feat(tag): occupancy state loader + GET /api/tag/state (M1 t7)"
```

---

## Task 8: `POST /api/tag/preview` (dry-run diff)

**Files:**
- Create: `apps/web/src/app/(internal)/api/tag/preview/route.ts`

- [ ] **Step 1: Implement the route**

```ts
// apps/web/src/app/(internal)/api/tag/preview/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getTagUser, getTagToken } from '@/lib/tag/auth';
import { loadOccupancyState } from '@/lib/tag/state';
import { buildDesignDiff, makeConfirmToken } from '@/lib/tag/ops';
import type { DesignEdit, FieldChange } from '@/lib/tag/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const user = await getTagUser();
  const token = await getTagToken();
  if (!user || !token) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { edits?: DesignEdit[] } | null;
  if (!body?.edits?.length) return NextResponse.json({ changes: [], confirmToken: makeConfirmToken([], 'empty') });

  const state = await loadOccupancyState(token);
  const byId = new Map(state.map((d) => [d.designId, d]));
  const changes: FieldChange[] = [];
  for (const edit of body.edits) {
    const cur = byId.get(edit.designId);
    if (!cur) continue;
    changes.push(...buildDesignDiff(
      { designId: cur.designId, occupancies: cur.occupancies, occupancyMedia: cur.posters.map((p) => ({ occupancy: p.occupancy, image: p.imageId })) },
      edit,
    ));
  }
  // Static stamp (Date.now is fine in a route handler, unlike workflow scripts).
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  return NextResponse.json({ changes, confirmToken: makeConfirmToken(changes, stamp) });
}
```

- [ ] **Step 2: Build + commit**

Run: `cd /home/ahmad/Zhic/apps/web && pnpm build 2>&1 | tail -3`
Expected: build succeeds.

```bash
cd /home/ahmad/Zhic && git add "apps/web/src/app/(internal)/api/tag/preview"
git commit -m "feat(tag): POST /api/tag/preview dry-run diff (M1 t8)"
```

---

## Task 9: `POST /api/tag/apply` (snapshot → PATCH → audit → revalidate)

**Files:**
- Create: `apps/web/src/app/(internal)/api/tag/apply/route.ts`

- [ ] **Step 1: Implement the route**

```ts
// apps/web/src/app/(internal)/api/tag/apply/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getTagUser, getTagToken } from '@/lib/tag/auth';
import { payloadGet, payloadPatch } from '@/lib/tag/payload-rest';
import { writeSnapshot, appendAudit } from '@/lib/tag/snapshot';
import { makeConfirmToken } from '@/lib/tag/ops';
import type { FieldChange } from '@/lib/tag/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const user = await getTagUser();
  const token = await getTagToken();
  if (!user || !token) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { changes?: FieldChange[]; confirmToken?: string } | null;
  const changes = body?.changes ?? [];
  if (!changes.length) return NextResponse.json({ applied: 0, backupDir: '' });

  // Guard: the token must match the change set (rejects stale/forged previews).
  const stamp = (body!.confirmToken ?? '').split('.')[0] || '';
  if (makeConfirmToken(changes, stamp) !== body!.confirmToken) {
    return NextResponse.json({ error: 'stale-or-invalid-confirm-token' }, { status: 409 });
  }

  // 1) Snapshot the CURRENT designs about to change (hard-fail aborts apply).
  const ids = [...new Set(changes.map((c) => c.id))];
  const snapDocs: Record<string, unknown>[] = [];
  for (const id of ids) {
    const doc = await payloadGet<Record<string, unknown>>(`/api/designs/${id}?depth=0`, token);
    snapDocs.push(doc);
  }
  const label = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14) + '-occupancy';
  let backupDir: string;
  try {
    backupDir = writeSnapshot(label, { designs: snapDocs });
  } catch (e) {
    return NextResponse.json({ error: `snapshot-failed: ${(e as Error).message}` }, { status: 500 });
  }

  // 2) Apply per-design (idempotent: PATCH the field to its `after` value). occupancyMedia
  //    `after` is [{occupancy, image:<id>}] — Payload accepts the numeric id for the upload rel.
  const byId = new Map<number, Record<string, unknown>>();
  for (const c of changes) {
    const cur = byId.get(c.id) ?? {};
    cur[c.field] = c.after;
    byId.set(c.id, cur);
  }
  let applied = 0;
  for (const [id, data] of byId) {
    await payloadPatch('designs', id, data, token);
    applied++;
    for (const c of changes.filter((x) => x.id === id)) {
      appendAudit({ ts: new Date().toISOString(), user_id: user.id, mode: 'occupancy', op: `set-${c.field}`, target_id: id, before: c.before, after: c.after, backup_dir: backupDir });
    }
  }

  revalidateTag('designs');
  return NextResponse.json({ applied, backupDir });
}
```

> **Verify before relying on it:** confirm Payload accepts `occupancyMedia: [{occupancy, image: <numericId>}]` on PATCH (upload relations accept the id). The Task 11 smoke test exercises exactly this; if Payload rejects the bare id, send `{ image: id }` unchanged (it already is) or `relationTo`-less id per Payload upload-field semantics. Adjust `payloadPatch` payload shape if the smoke PATCH returns 400.

- [ ] **Step 2: Build + commit**

Run: `cd /home/ahmad/Zhic/apps/web && pnpm build 2>&1 | tail -3`
Expected: build succeeds.

```bash
cd /home/ahmad/Zhic && git add "apps/web/src/app/(internal)/api/tag/apply"
git commit -m "feat(tag): POST /api/tag/apply — snapshot+patch+audit+revalidate (M1 t9)"
```

---

## Task 10: `POST /api/tag/undo` (reverse-apply)

**Files:**
- Create: `apps/web/src/app/(internal)/api/tag/undo/route.ts`

- [ ] **Step 1: Implement the route**

```ts
// apps/web/src/app/(internal)/api/tag/undo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getTagUser, getTagToken } from '@/lib/tag/auth';
import { payloadPatch } from '@/lib/tag/payload-rest';
import { readSnapshot, appendAudit } from '@/lib/tag/snapshot';

export const dynamic = 'force-dynamic';

/** Restore the snapshotted designs by re-PATCHing their saved occupancies + occupancyMedia. */
export async function POST(req: NextRequest) {
  const user = await getTagUser();
  const token = await getTagToken();
  if (!user || !token) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { backupDir?: string } | null;
  if (!body?.backupDir) return NextResponse.json({ error: 'backupDir required' }, { status: 400 });

  let snap: { docs: Record<string, unknown>[] };
  try {
    snap = readSnapshot(body.backupDir, 'designs');
  } catch (e) {
    return NextResponse.json({ error: `snapshot-read-failed: ${(e as Error).message}` }, { status: 404 });
  }

  let restored = 0;
  for (const doc of snap.docs) {
    const id = doc.id as number;
    const occupancyMedia = (doc.occupancyMedia as { occupancy: string; image: number | { id: number } }[] | null ?? [])
      .map((m) => ({ occupancy: m.occupancy, image: typeof m.image === 'number' ? m.image : m.image?.id }));
    await payloadPatch('designs', id, { occupancies: doc.occupancies ?? [], occupancyMedia }, token);
    restored++;
    appendAudit({ ts: new Date().toISOString(), user_id: user.id, mode: 'occupancy', op: 'undo', target_id: id, backup_dir: body.backupDir });
  }
  revalidateTag('designs');
  return NextResponse.json({ restored });
}
```

- [ ] **Step 2: Build + commit**

Run: `cd /home/ahmad/Zhic/apps/web && pnpm build 2>&1 | tail -3`
Expected: build succeeds.

```bash
cd /home/ahmad/Zhic && git add "apps/web/src/app/(internal)/api/tag/undo"
git commit -m "feat(tag): POST /api/tag/undo reverse-apply from snapshot (M1 t10)"
```

---

## Task 11: Occupancy mode UI + page shell + scoreboard

**Files:**
- Create: `apps/web/src/app/(internal)/atelier/tag/page.tsx`
- Create: `apps/web/src/app/(internal)/atelier/tag/OccupancyMode.tsx`
- Create: `apps/web/src/app/(internal)/atelier/tag/Scoreboard.tsx`
- Create: `apps/web/src/app/(internal)/atelier/tag/tag-panel.css`

- [ ] **Step 1: Page shell (RSC, re-checks auth, default mode = occupancy)**

```tsx
// apps/web/src/app/(internal)/atelier/tag/page.tsx
import { redirect } from 'next/navigation';
import { getTagUser } from '@/lib/tag/auth';
import { OccupancyMode } from './OccupancyMode';
import './tag-panel.css';

export const dynamic = 'force-dynamic';

export default async function TagPanelPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const user = await getTagUser();
  if (!user) redirect('/atelier/tag/login');
  const { mode = 'occupancy' } = await searchParams;
  // M1 ships occupancy only; other modes land in M2–M4.
  return <OccupancyMode userEmail={user.email} initialMode={mode} />;
}
```

- [ ] **Step 2: Scoreboard component**

```tsx
// apps/web/src/app/(internal)/atelier/tag/Scoreboard.tsx
'use client';
import { toPersianDigits } from '@zhic/locale';

export function Scoreboard({ complete, total }: { complete: number; total: number }) {
  return (
    <div className="zh-tag-score" role="status">
      <span className="zh-tag-score__chip">
        تکمیل اشغال: {toPersianDigits(complete)}/{toPersianDigits(total)} طرح
      </span>
    </div>
  );
}
```

- [ ] **Step 3: Occupancy mode (client, keyboard-driven)**

```tsx
// apps/web/src/app/(internal)/atelier/tag/OccupancyMode.tsx
'use client';
import { useCallback, useEffect, useState } from 'react';
import { OCCUPANCIES, OCCUPANCY_FA, type Occupancy } from '@/lib/tag/types';
import { Scoreboard } from './Scoreboard';

type Candidate = { id: number; url: string; alt: string | null; filename: string };
type DesignState = {
  designId: number; slug: string; title: string;
  occupancies: Occupancy[];
  posters: { occupancy: Occupancy; imageId: number }[];
  candidates: Candidate[];
};

export function OccupancyMode({ userEmail }: { userEmail: string; initialMode?: string }) {
  const [designs, setDesigns] = useState<DesignState[]>([]);
  const [score, setScore] = useState({ complete: 0, total: 0 });
  const [focus, setFocus] = useState(0);
  const [pickerOcc, setPickerOcc] = useState<Occupancy | null>(null);
  const [status, setStatus] = useState('');

  const load = useCallback(async () => {
    const res = await fetch('/api/tag/state', { cache: 'no-store' });
    const data = await res.json();
    setDesigns(data.designs);
    setScore({ complete: data.scoreboard.designsComplete, total: data.scoreboard.designsTotal });
  }, []);
  useEffect(() => { load(); }, [load]);

  const cur = designs[focus];

  const toggleOcc = (o: Occupancy) => setDesigns((ds) => ds.map((d, i) => i !== focus ? d : {
    ...d, occupancies: d.occupancies.includes(o) ? d.occupancies.filter((x) => x !== o) : [...d.occupancies, o],
  }));
  const setPoster = (o: Occupancy, imageId: number) => setDesigns((ds) => ds.map((d, i) => i !== focus ? d : {
    ...d, posters: [...d.posters.filter((p) => p.occupancy !== o), { occupancy: o, imageId }],
  }));

  const save = useCallback(async () => {
    if (!cur) return;
    setStatus('در حال پیش‌نمایش…');
    const pv = await fetch('/api/tag/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ edits: [{ designId: cur.designId, occupancies: cur.occupancies, posters: cur.posters.map((p) => ({ occupancy: p.occupancy, imageId: p.imageId })) }] }) }).then((r) => r.json());
    if (!pv.changes.length) { setStatus('تغییری نیست'); return; }
    const ap = await fetch('/api/tag/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pv) }).then((r) => r.json());
    setStatus(ap.applied ? `ذخیره شد (نسخه‌ی پشتیبان: ${ap.backupDir.split('/').pop()})` : `خطا: ${ap.error ?? ''}`);
    await load();
  }, [cur, load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (pickerOcc) { if (e.key === 'Escape') setPickerOcc(null); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setFocus((f) => Math.min(f + 1, designs.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setFocus((f) => Math.max(f - 1, 0)); }
      else if (['1', '2', '3', '4'].includes(e.key)) { const o = OCCUPANCIES[Number(e.key) - 1]; if (e.shiftKey) setPickerOcc(o); else toggleOcc(o); }
      else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [designs.length, pickerOcc, save]); // toggleOcc/save close over focus via state setters

  if (!cur) return <main className="zh-tag"><p>در حال بارگذاری…</p></main>;

  return (
    <main className="zh-tag" data-user={userEmail}>
      <Scoreboard complete={score.complete} total={score.total} />
      <div className="zh-tag__cols">
        <ul className="zh-tag__list">
          {designs.map((d, i) => {
            const done = d.occupancies.length > 0 && d.occupancies.every((o) => d.posters.some((p) => p.occupancy === o));
            return (
              <li key={d.designId} aria-current={i === focus} className={`zh-tag__row${i === focus ? ' is-focus' : ''}`} onClick={() => setFocus(i)}>
                <span>{d.title}</span>
                <span className="zh-tag__dots">{OCCUPANCIES.map((o) => (
                  <i key={o} className={`zh-tag__dot${d.occupancies.includes(o) ? (d.posters.some((p) => p.occupancy === o) ? ' is-set' : ' is-needs-poster') : ''}`} title={OCCUPANCY_FA[o]} />
                ))}{done ? ' ✓' : ''}</span>
              </li>
            );
          })}
        </ul>

        <section className="zh-tag__center">
          <h2>{cur.title}</h2>
          <div className="zh-tag__ages">
            {OCCUPANCIES.map((o, idx) => (
              <button key={o} className={`zh-tag__age${cur.occupancies.includes(o) ? ' is-on' : ''}`} onClick={() => toggleOcc(o)}>
                {OCCUPANCY_FA[o]} <kbd>{idx + 1}</kbd>
              </button>
            ))}
          </div>
          <div className="zh-tag__posters">
            {cur.occupancies.map((o) => {
              const p = cur.posters.find((x) => x.occupancy === o);
              const img = p ? cur.candidates.find((c) => c.id === p.imageId) : undefined;
              return (
                <div key={o} className="zh-tag__poster" onClick={() => setPickerOcc(o)}>
                  <span>{OCCUPANCY_FA[o]}</span>
                  {img ? <img src={img.url} alt={img.alt ?? ''} /> : <em>انتخاب پوستر…</em>}
                </div>
              );
            })}
          </div>
          <p className="zh-tag__status" role="status">{status}</p>
        </section>

        {pickerOcc ? (
          <aside className="zh-tag__picker">
            <header>پوستر «{OCCUPANCY_FA[pickerOcc]}» — Esc برای بستن</header>
            <div className="zh-tag__grid">
              {cur.candidates.map((c) => (
                <button key={c.id} onClick={() => { setPoster(pickerOcc, c.id); setPickerOcc(null); }}>
                  <img src={c.url} alt={c.alt ?? c.filename} />
                </button>
              ))}
            </div>
          </aside>
        ) : null}
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Panel CSS**

```css
/* apps/web/src/app/(internal)/atelier/tag/tag-panel.css */
.zh-tag { padding: 1rem; }
.zh-tag-score { position: sticky; top: 0; background: var(--color-ivory); padding: 0.5rem 0; z-index: 5; }
.zh-tag-score__chip { font-weight: 700; }
.zh-tag__cols { display: grid; grid-template-columns: 260px 1fr 320px; gap: 1rem; align-items: start; }
.zh-tag__list { list-style: none; margin: 0; padding: 0; max-height: 80vh; overflow: auto; }
.zh-tag__row { display: flex; justify-content: space-between; gap: 0.5rem; padding: 0.4rem 0.5rem; border-radius: 4px; cursor: pointer; }
.zh-tag__row.is-focus { background: var(--color-cream); }
.zh-tag__dots { display: inline-flex; gap: 3px; align-items: center; }
.zh-tag__dot { width: 8px; height: 8px; border-radius: 50%; background: #d8d2c8; display: inline-block; }
.zh-tag__dot.is-needs-poster { background: var(--color-gold); }
.zh-tag__dot.is-set { background: var(--color-forest); }
.zh-tag__ages { display: flex; gap: 0.5rem; margin: 0.5rem 0; flex-wrap: wrap; }
.zh-tag__age { padding: 0.35rem 0.7rem; border: 1px solid var(--color-forest); border-radius: 6px; background: transparent; cursor: pointer; }
.zh-tag__age.is-on { background: var(--color-forest); color: var(--color-ivory); }
.zh-tag__posters { display: flex; gap: 0.75rem; flex-wrap: wrap; }
.zh-tag__poster { width: 140px; cursor: pointer; }
.zh-tag__poster img { width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 4px; }
.zh-tag__picker { border: 1px solid var(--color-cream); border-radius: 8px; padding: 0.5rem; max-height: 80vh; overflow: auto; }
.zh-tag__grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }
.zh-tag__grid img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 4px; cursor: pointer; }
.zh-tag__status { min-height: 1.4em; color: var(--color-forest); }
```

- [ ] **Step 5: Build + ship**

Run: `cd /home/ahmad/Zhic/apps/web && pnpm build 2>&1 | tail -4 && pm2 restart zhic-web --update-env >/dev/null 2>&1 && sleep 4 && curl -s -o /dev/null -w "tag HTTP %{http_code}\n" http://localhost:3000/atelier/tag`
Expected: build succeeds; `/atelier/tag` returns 307/302 (redirect to login when unauthenticated) — that proves the gate works.

- [ ] **Step 6: Commit**

```bash
cd /home/ahmad/Zhic && git add "apps/web/src/app/(internal)/atelier/tag/page.tsx" "apps/web/src/app/(internal)/atelier/tag/OccupancyMode.tsx" "apps/web/src/app/(internal)/atelier/tag/Scoreboard.tsx" "apps/web/src/app/(internal)/atelier/tag/tag-panel.css"
git commit -m "feat(tag): occupancy mode UI + scoreboard + page shell (M1 t11)"
```

---

## Task 12: End-to-end verification (login → edit → apply → undo) + ship

**Files:** none (verification only)

- [ ] **Step 1: Full unit suite green**

Run: `cd /home/ahmad/Zhic/apps/web && pnpm test -- tag/`
Expected: all `lib/tag/__tests__/*` pass.

- [ ] **Step 2: Headless browser smoke (login + render)**

Use the box's headless Chromium recipe (see `~/.claude` memory `reference_zhic_headless_browser`): navigate to `http://localhost:3000/atelier/tag`, confirm redirect to `/atelier/tag/login`; submit the operator credentials; confirm the 27-design list renders and the scoreboard shows `…/۲۷`.

- [ ] **Step 3: Apply + undo on ONE design via API (idempotency + reverse-apply proof)**

```bash
TOKEN=$(curl -s -X POST http://127.0.0.1:3001/api/users/login -H 'Content-Type: application/json' -d '{"email":"ahmadreza.torkaman@icloud.com","password":"JesusChristDude"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
# preview a no-op edit for one design (replace 24 with a real design id from /state)
PV=$(curl -s -X POST http://localhost:3000/api/tag/preview -H "Cookie: tag_session=$TOKEN" -H 'Content-Type: application/json' -d '{"edits":[{"designId":24,"occupancies":["teen","double"],"posters":[]}]}')
echo "$PV" | python3 -c "import sys,json;d=json.load(sys.stdin);print('changes',len(d['changes']))"
# apply, capture backupDir, then undo
AP=$(curl -s -X POST http://localhost:3000/api/tag/apply -H "Cookie: tag_session=$TOKEN" -H 'Content-Type: application/json' -d "$PV")
echo "$AP"
DIR=$(echo "$AP" | python3 -c "import sys,json;print(json.load(sys.stdin).get('backupDir',''))")
[ -n "$DIR" ] && curl -s -X POST http://localhost:3000/api/tag/undo -H "Cookie: tag_session=$TOKEN" -H 'Content-Type: application/json' -d "{\"backupDir\":\"$DIR\"}"
```
Expected: preview reports changes (or 0 if already matching); apply returns `{applied,backupDir}`; the snapshot dir exists under `~/zhic-catalog-backups/tag-*`; undo returns `{restored:1}`; `~/zhic-tag-audit.jsonl` has new lines. **If the apply PATCH 400s on `occupancyMedia`, adjust the payload shape per the Task 9 note and re-run.**

- [ ] **Step 4: Storefront effect check**

Pick a design you actually changed in the UI; load `http://localhost:3000/bedroom-set/<slug>` and confirm the age tabs/posters reflect the new occupancy. (ISR: `revalidateTag('designs')` fires on apply; if stale, wait one request cycle.)

- [ ] **Step 5: Final commit (docs/state)**

```bash
cd /home/ahmad/Zhic && git add -A && git commit -m "chore(tag): M1 occupancy builder verified end-to-end" --allow-empty
```

---

## Self-review checklist (run before handoff)

- **Spec coverage (M1 slice):** auth gate ✓(t3–t5), occupancy mode ✓(t7,t11), dry-run ✓(t8), snapshot+undo ✓(t6,t9,t10), audit ✓(t6,t9), revalidate ✓(t9), scoreboard ✓(t11), zero schema changes ✓ (only `designs.occupancies`/`occupancyMedia` PATCH). M2–M5 (product mode + storefront age filter, alt queue, orphan triage + reconcile-11, full scoreboard/docs) are **out of M1** — separate plans.
- **Type consistency:** `Occupancy`, `DesignEdit`, `FieldChange`, `DesignState`, `makeConfirmToken(changes,stamp)`, `writeSnapshot(label,byCollection)→dir`, `readSnapshot(dir,collection)`, `appendAudit(entry)`, `payloadGet/payloadPatch(...,token)`, `getTagUser()/getTagToken()` — names used identically across tasks.
- **No placeholders:** every code step has full code; every run step has an exact command + expected output.
- **Known runtime checks flagged inline:** (a) Payload `occupancyMedia` PATCH id shape (t9/t12 note); (b) `headers()` path key fallback in the layout (t4 note) — protected pages independently call `getTagUser()`.

## Open items carried from spec §13 (not blocking M1)

- HOLD list filenames (M4), `reconcile-11` archive prefix (M4) — orphan triage milestone only.
