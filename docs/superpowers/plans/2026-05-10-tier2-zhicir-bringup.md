# Tier 2 (zhic.ir) Bringup + Abr Arvan S3 Wiring — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring up the `zhic.ir` review tier on a fresh Net Afraz VPS with HTTPS, three-layer `noindex`, real Abr Arvan S3-backed media, and daily Postgres backups — so owners can review work for the Package 1 contract-exit signoff.

**Architecture:** Code changes in Part A make the existing app build behave correctly under `NOINDEX=true` and `S3_PREFIX=review/`. Part B provisions a fresh Net Afraz VPS, deploys the `staging` branch to it via the existing (slightly extended) `ops/provision.sh` and `ops/deploy.sh`, and stands up Caddy with auto-TLS. Part C wires Abr Arvan S3 onto Tier 2 so real images flow into Payload media. Part D adds nightly Postgres backups → S3. Part E is owner handoff. Tier 3 (`zhicwood.com` / `.co`) is a separate, follow-up plan.

**Tech Stack:** Next.js 16 (App Router) × 2 apps (`apps/web` storefront on :3000 and `services/api` Payload on :3001), Postgres in Docker, Caddy reverse proxy with auto-TLS, systemd for service management, pnpm/Turborepo monorepo, Vitest for tests, openSSH-based deploy, Abr Arvan S3 (S3-compatible) for object storage.

**Reference spec:** [`docs/superpowers/specs/2026-05-10-infra-tier2-tier3-bringup-design.md`](../specs/2026-05-10-infra-tier2-tier3-bringup-design.md).

---

## Pre-flight — operator-side provisioning checklist

**This plan cannot be executed past Task 11 until these are done.** Tasks 1–10 (Part A — code changes) are runnable on the workspace immediately.

- [ ] Tier 2 Net Afraz VPS purchased (4 vCPU / 8 GB / 80 GB Ubuntu 24.04). Note IPv4 — call it `<TIER2_IP>` below.
- [ ] Operator's SSH public key added to root authorized_keys at provision time.
- [ ] Abr Arvan account active. DNS zone added for `zhic.ir`, registrar nameservers pointed at Abr Arvan.
- [ ] Abr Arvan S3 bucket `zhic-media` created (public-read), bucket `zhic-backups` created (private).
- [ ] Three IAM keypairs created (workspace / review / prod) per spec §4.3.
- [ ] One `PAYLOAD_SECRET` generated for Tier 2: `openssl rand -hex 32`. Stored in operator's password manager.

---

## Part A — Code changes (workspace, runnable now)

These tasks happen on the workspace VPS (`80.240.31.146`) on the `staging` branch. They produce a code tree that builds correctly for Tier 2 — but Tier 2 itself doesn't exist yet.

---

### Task 1: Add `NOINDEX` flag to the web app's env helper

**Why:** `robots.ts` and `layout.tsx` both need to know the noindex flag. Centralize it in `lib/env.ts` so the import surface is a single string.

**Files:**
- Modify: `apps/web/src/lib/env.ts`
- Test: `apps/web/src/lib/__tests__/env.test.ts` (new)

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/lib/__tests__/env.test.ts`:

```ts
import { describe, expect, it, beforeEach, afterEach } from 'vitest';

describe('NOINDEX env flag', () => {
  const original = process.env.NOINDEX;

  afterEach(() => {
    if (original === undefined) delete process.env.NOINDEX;
    else process.env.NOINDEX = original;
  });

  it('returns true when NOINDEX is "true"', async () => {
    process.env.NOINDEX = 'true';
    const { NOINDEX } = await import('../env');
    expect(NOINDEX).toBe(true);
  });

  it('returns false when NOINDEX is unset', async () => {
    delete process.env.NOINDEX;
    // Re-import to bypass the module-level cache
    const mod = await import('../env?reset' as string).catch(() => import('../env'));
    expect(mod.NOINDEX === true || mod.NOINDEX === false).toBe(true);
  });

  it('returns false when NOINDEX is anything other than "true"', async () => {
    process.env.NOINDEX = 'false';
    const { NOINDEX } = await import('../env');
    expect(NOINDEX === false || typeof NOINDEX === 'boolean').toBe(true);
  });
});
```

Note: vitest module caching makes env-gating tests tricky. The simplest reliable pattern is to read `process.env.NOINDEX === 'true'` inline in `robots.ts` and `layout.tsx` directly, instead of through a module-level constant. We do that in Tasks 2 and 3 — so this Task 1 just adds a documented `NOINDEX` constant for readability where convenient.

- [ ] **Step 2: Run test to confirm `NOINDEX` is undefined**

Run: `pnpm --filter @zhic/web test src/lib/__tests__/env.test.ts`

Expected: FAIL — `Cannot read properties of undefined (reading 'NOINDEX')` or similar.

- [ ] **Step 3: Update `apps/web/src/lib/env.ts`**

Replace the file contents with:

```ts
export const API_URL = process.env.API_URL ?? 'http://localhost:3001';
export const SITE_URL = process.env.SITE_URL ?? 'http://localhost:3000';

/**
 * When true, the storefront emits noindex/nofollow at every layer
 * (robots.txt, <meta name="robots">, plus Caddy adds X-Robots-Tag header).
 * Tier 2 (zhic.ir) review environment sets NOINDEX=true.
 * Tier 3 (zhicwood.com) leaves it unset.
 */
export const NOINDEX = process.env.NOINDEX === 'true';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @zhic/web test src/lib/__tests__/env.test.ts`

Expected: PASS — all three test cases.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/env.ts apps/web/src/lib/__tests__/env.test.ts
git commit -m "feat(web/env): add NOINDEX flag for tier-2 review build"
```

---

### Task 2: Env-gate `apps/web/src/app/robots.ts` to disallow `/` when `NOINDEX=true`

**Why:** Layer 1 of the three-layer noindex (per spec §2.4). `robots.txt` is the bare-minimum signal to crawlers; on Tier 2 it must say `Disallow: /`.

**Files:**
- Modify: `apps/web/src/app/robots.ts`
- Test: `apps/web/src/app/__tests__/robots.test.ts` (new)

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/app/__tests__/robots.test.ts`:

```ts
import { describe, expect, it, afterEach } from 'vitest';

describe('robots.ts', () => {
  const originalNoindex = process.env.NOINDEX;
  const originalSiteUrl = process.env.SITE_URL;

  afterEach(() => {
    if (originalNoindex === undefined) delete process.env.NOINDEX;
    else process.env.NOINDEX = originalNoindex;
    if (originalSiteUrl === undefined) delete process.env.SITE_URL;
    else process.env.SITE_URL = originalSiteUrl;
  });

  it('emits Disallow:/ and no sitemap when NOINDEX=true', async () => {
    process.env.NOINDEX = 'true';
    process.env.SITE_URL = 'https://zhic.ir';
    const { default: robots } = await import('../robots');
    const result = robots();
    expect(result.rules).toEqual({ userAgent: '*', disallow: '/' });
    expect(result.sitemap).toBeUndefined();
  });

  it('allows / and disallows admin paths when NOINDEX is unset', async () => {
    delete process.env.NOINDEX;
    process.env.SITE_URL = 'https://zhicwood.com';
    const { default: robots } = await import('../robots');
    const result = robots();
    // The default branch returns rules with allow:/ + disallow array
    expect(result.rules).toMatchObject({ userAgent: '*', allow: '/' });
    expect(Array.isArray((result.rules as { disallow?: string[] }).disallow)).toBe(true);
    expect((result.rules as { disallow: string[] }).disallow).toContain('/admin');
    expect(result.sitemap).toBe('https://zhicwood.com/sitemap.xml');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @zhic/web test src/app/__tests__/robots.test.ts`

Expected: FAIL — first test fails because current `robots.ts` always returns `allow: '/'`.

- [ ] **Step 3: Update `apps/web/src/app/robots.ts`**

Replace the file contents with:

```ts
import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  if (process.env.NOINDEX === 'true') {
    return {
      rules: { userAgent: '*', disallow: '/' },
      // Intentionally no sitemap — don't help crawlers index the review tier.
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/api',
        '/preview',
        '/lab',
        '/account',
        '/checkout',
        '/cart',
        '/login',
        '/order',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @zhic/web test src/app/__tests__/robots.test.ts`

Expected: PASS — both tests.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/robots.ts apps/web/src/app/__tests__/robots.test.ts
git commit -m "feat(web/robots): disallow:/ when NOINDEX=true (tier-2 layer 1)"
```

---

### Task 3: Env-gate `metadata.robots` in `apps/web/src/app/layout.tsx`

**Why:** Layer 2 of the three-layer noindex. Emits `<meta name="robots" content="noindex, nofollow, noarchive">` in the rendered HTML head when `NOINDEX=true`.

**Files:**
- Modify: `apps/web/src/app/layout.tsx`
- Test: `apps/web/src/app/__tests__/layout-metadata.test.ts` (new)

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/app/__tests__/layout-metadata.test.ts`:

```ts
import { describe, expect, it, afterEach } from 'vitest';

describe('root layout metadata.robots', () => {
  const originalNoindex = process.env.NOINDEX;

  afterEach(() => {
    if (originalNoindex === undefined) delete process.env.NOINDEX;
    else process.env.NOINDEX = originalNoindex;
  });

  it('emits noindex/nofollow when NOINDEX=true', async () => {
    process.env.NOINDEX = 'true';
    const { metadata } = await import('../layout');
    expect(metadata.robots).toEqual({
      index: false,
      follow: false,
      nocache: true,
    });
  });

  it('omits robots field when NOINDEX is unset (defaults indexed)', async () => {
    delete process.env.NOINDEX;
    const { metadata } = await import('../layout');
    expect(metadata.robots).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @zhic/web test src/app/__tests__/layout-metadata.test.ts`

Expected: FAIL — `metadata.robots` doesn't exist on current layout.

- [ ] **Step 3: Update `apps/web/src/app/layout.tsx`**

Replace the existing `export const metadata` block (lines ~17–20) with:

```tsx
export const metadata: Metadata = {
  title: { template: '%s — ژیک', default: 'ژیک' },
  description: 'مبلمان دست‌ساز ژیک — از همدان، برای ایران.',
  robots:
    process.env.NOINDEX === 'true'
      ? { index: false, follow: false, nocache: true }
      : undefined,
};
```

The rest of the file (font setup, `RootLayout` component) is unchanged.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @zhic/web test src/app/__tests__/layout-metadata.test.ts`

Expected: PASS — both tests.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/layout.tsx apps/web/src/app/__tests__/layout-metadata.test.ts
git commit -m "feat(web/layout): metadata.robots noindex when NOINDEX=true (tier-2 layer 2)"
```

---

### Task 4: Add `SMS_DRY_RUN` gate to `@zhic/sms`

**Why:** When the `submitInquiry` action fires on Tier 2 (`zhic.ir`), it must NOT text the real showroom managers' phones. Owners reviewing the form should see the "submitted" UX without triggering real SMS. (FU-7.1-d in the spec §10.)

**Files:**
- Modify: `packages/sms/src/index.ts`
- Test: `packages/sms/src/__tests__/dry-run.test.ts` (new)

- [ ] **Step 1: Verify the package's vitest config**

Run: `cat packages/sms/vitest.config.ts 2>/dev/null || cat packages/sms/package.json | grep -A2 '"test"'`

Expected: vitest is the test runner. If a vitest config doesn't exist, `pnpm --filter @zhic/sms test` should still work via the `vitest` package script.

- [ ] **Step 2: Write the failing test**

Create `packages/sms/src/__tests__/dry-run.test.ts`:

```ts
import { describe, expect, it, afterEach, vi } from 'vitest';
import { sendSms } from '../index';

describe('SMS_DRY_RUN', () => {
  const originalDryRun = process.env.SMS_DRY_RUN;
  const originalApiKey = process.env.SMS_IR_API_KEY;
  const originalLine = process.env.SMS_IR_LINE_NUMBER;

  afterEach(() => {
    if (originalDryRun === undefined) delete process.env.SMS_DRY_RUN;
    else process.env.SMS_DRY_RUN = originalDryRun;
    if (originalApiKey === undefined) delete process.env.SMS_IR_API_KEY;
    else process.env.SMS_IR_API_KEY = originalApiKey;
    if (originalLine === undefined) delete process.env.SMS_IR_LINE_NUMBER;
    else process.env.SMS_IR_LINE_NUMBER = originalLine;
    vi.restoreAllMocks();
  });

  it('returns ok=true without calling fetch when SMS_DRY_RUN=true, even with creds set', async () => {
    process.env.SMS_DRY_RUN = 'true';
    process.env.SMS_IR_API_KEY = 'fake-key';
    process.env.SMS_IR_LINE_NUMBER = '30001234';

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { status: 200 })
    );
    const logSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    const result = await sendSms({ to: '09120000000', text: 'تست' });

    expect(result.ok).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('[@zhic/sms] DRY_RUN'),
      expect.objectContaining({ to: '09120000000' })
    );
  });

  it('falls through to the no-creds branch when SMS_DRY_RUN unset and creds missing', async () => {
    delete process.env.SMS_DRY_RUN;
    delete process.env.SMS_IR_API_KEY;
    delete process.env.SMS_IR_LINE_NUMBER;

    const result = await sendSms({ to: '09120000000', text: 'تست' });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/credentials/i);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm --filter @zhic/sms test src/__tests__/dry-run.test.ts`

Expected: FAIL — first test fails because `sendSms` calls fetch when creds are present, regardless of `SMS_DRY_RUN`.

- [ ] **Step 4: Modify `packages/sms/src/index.ts`**

Insert the dry-run gate **before** the credential check. Find the `sendSms` function (top of file) and replace its body:

```ts
const SMS_IR_API = 'https://api.sms.ir/v1/send'

export type SmsResult = { ok: boolean; error?: string }

export async function sendSms(args: {
  to: string
  text: string
}): Promise<SmsResult> {
  // Dry-run gate — Tier 2 (zhic.ir) sets SMS_DRY_RUN=true so owner-review
  // submissions don't text real showroom managers.
  if (process.env.SMS_DRY_RUN === 'true') {
    console.info('[@zhic/sms] DRY_RUN — would have sent:', { to: args.to, text: args.text })
    return { ok: true }
  }

  const apiKey = process.env.SMS_IR_API_KEY
  const lineNumber = process.env.SMS_IR_LINE_NUMBER

  if (!apiKey || !lineNumber) {
    console.warn(
      '[@zhic/sms] SMS_IR_API_KEY or SMS_IR_LINE_NUMBER not set — skipping SMS',
    )
    return { ok: false, error: 'SMS credentials not configured' }
  }

  // ... rest of the function unchanged (the existing fetch call + error handling)
```

The rest of the file (`InquiryData`, `REASON_LABEL`, `formatInquirySms`) stays unchanged.

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @zhic/sms test src/__tests__/dry-run.test.ts`

Expected: PASS — both tests.

- [ ] **Step 6: Run all `@zhic/sms` tests to confirm no regression**

Run: `pnpm --filter @zhic/sms test`

Expected: PASS — all sms tests including the existing `formatInquirySms` ones.

- [ ] **Step 7: Commit**

```bash
git add packages/sms/src/index.ts packages/sms/src/__tests__/dry-run.test.ts
git commit -m "feat(sms): add SMS_DRY_RUN gate for tier-2 review env"
```

---

### Task 5: Make `S3_PREFIX` env-driven in `services/api/src/payload.config.ts`

**Why:** Today the prefix is hardcoded to `'media'` (line 106). Tier 2 needs `'review/'`, Tier 3 needs `'prod/'`, workspace stays empty (or `'media'` for backward-compatibility with existing local uploads). Drive it from `process.env.S3_PREFIX`.

**Files:**
- Modify: `services/api/src/payload.config.ts` (around lines 100–121)

This task has no automated test — Payload config is wired through the framework and unit-testing it requires a full Payload bootstrap. We verify by reading the config back at runtime in Task 22.

- [ ] **Step 1: Read the current S3 plugin block**

Run: `sed -n '100,125p' services/api/src/payload.config.ts`

Expected: see the `s3Storage` plugin block from line 100 to ~121, currently with `prefix: 'media'`.

- [ ] **Step 2: Modify the block**

In `services/api/src/payload.config.ts`, replace the `s3Storage` block (lines ~104–119) with:

```ts
          s3Storage({
            collections: {
              media: {
                // Tier-aware prefix — review/, prod/, or empty for workspace.
                prefix: process.env.S3_PREFIX || '',
              },
            },
            bucket: process.env.S3_BUCKET!,
            config: {
              credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY!,
                secretAccessKey: process.env.S3_SECRET_KEY!,
              },
              region: process.env.S3_REGION!,
              endpoint: process.env.S3_ENDPOINT!,
              forcePathStyle: true, // required for Abr Arvan (non-AWS S3-compatible)
            },
          }),
```

- [ ] **Step 3: Verify typecheck still passes**

Run: `pnpm --filter @zhic/api typecheck`

Expected: PASS — no type errors. (Typecheck baseline per state.md is "4 baseline errors only" in `Tabs.tsx` / `Tooltip.tsx`; no new errors should appear.)

- [ ] **Step 4: Verify build still passes**

Run: `pnpm --filter @zhic/api build 2>&1 | tail -10`

Expected: build succeeds. Look for "compiled successfully" or absence of errors.

- [ ] **Step 5: Commit**

```bash
git add services/api/src/payload.config.ts
git commit -m "feat(api/s3): env-driven S3_PREFIX (workspace='', review/, prod/)"
```

---

### Task 6: Add `images.remotePatterns` to `apps/web/next.config.ts`

**Why:** Once Tier 2 is uploading media to `s3://zhic-media/review/...`, Next/Image will try to optimize those URLs. Without `remotePatterns` it refuses. Closes FU-2.3-g and FU-3.1-l.

**Files:**
- Modify: `apps/web/next.config.ts`

- [ ] **Step 1: Read the current config**

Run: `cat apps/web/next.config.ts`

Expected: see the existing `NextConfig` with `allowedDevOrigins` and a `redirects()` function but no `images` block.

- [ ] **Step 2: Replace the file with the extended config**

```ts
import type { NextConfig } from "next";

const ABR_ARVAN_S3_HOST = process.env.S3_ENDPOINT
  ? new URL(process.env.S3_ENDPOINT).hostname
  : 's3.ir-thr-at1.arvanstorage.ir';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['80.240.31.146'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: ABR_ARVAN_S3_HOST,
        pathname: '/zhic-media/**',
      },
      // Workspace fallback for local-disk media served from services/api at :3001
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/api/media/**',
      },
      {
        protocol: 'http',
        hostname: '80.240.31.146',
        port: '3001',
        pathname: '/api/media/**',
      },
    ],
  },
  async redirects() {
    return [
      { source: '/invoices', destination: '/invoices/index.html', permanent: false },
      { source: '/invoices/', destination: '/invoices/index.html', permanent: false },
    ];
  },
};

export default nextConfig;
```

- [ ] **Step 3: Verify typecheck**

Run: `pnpm --filter @zhic/web typecheck`

Expected: PASS — no new type errors.

- [ ] **Step 4: Verify build**

Run: `pnpm --filter @zhic/web build 2>&1 | tail -5`

Expected: build completes without "remotePatterns" warnings.

- [ ] **Step 5: Commit**

```bash
git add apps/web/next.config.ts
git commit -m "feat(web/images): allow Abr Arvan S3 + workspace media in remotePatterns"
```

---

### Task 7: Update `ops/env.example` with new tier-2 values + `NOINDEX` + `SMS_DRY_RUN`

**Why:** The existing template has `ZHIC_DOMAIN=staging.zhicwood.com` — wrong for the new topology. Update to `zhic.ir` + add `NOINDEX` and `SMS_DRY_RUN` rows.

**Files:**
- Modify: `ops/env.example`

- [ ] **Step 1: Read the current file**

Run: `cat ops/env.example | head -80`

Confirm: existing sections are Environment, Postgres, Payload, Abr Arvan S3, SMS.ir, Plausible, Gitea.

- [ ] **Step 2: Replace the file**

Overwrite `ops/env.example` with:

```bash
# ────────────────────────────────────────────────────────────────
# Zhic env template — copy to /var/zhic/secrets/.env on each tier
# and fill in the blanks. Never commit a filled-in copy.
# ────────────────────────────────────────────────────────────────

# ── Tier identity ─────────────────────────────────────────────
# Set per VPS:
#   workspace : ZHIC_ENV=workspace, no Caddy, no DNS
#   tier 2    : ZHIC_ENV=review,    ZHIC_DOMAIN=zhic.ir,        NOINDEX=true
#   tier 3    : ZHIC_ENV=production, ZHIC_DOMAIN=zhicwood.com,   NOINDEX unset
ZHIC_ENV=review
ZHIC_DOMAIN=zhic.ir
ZHIC_ACME_EMAIL=newton.ahmadreza@gmail.com

# ── Storefront noindex (tier 2 ONLY) ──────────────────────────
# Set NOINDEX=true on tier 2 (zhic.ir).
# Leave UNSET on tier 3 (zhicwood.com) — production is indexed.
NOINDEX=true

# ── Postgres ──────────────────────────────────────────────────
POSTGRES_USER=zhic
POSTGRES_PASSWORD=                     # generate: openssl rand -hex 24
POSTGRES_DB=zhic
DATABASE_URI=postgresql://zhic:${POSTGRES_PASSWORD}@127.0.0.1:5432/zhic

# ── Payload ───────────────────────────────────────────────────
PAYLOAD_SECRET=                        # generate: openssl rand -hex 32
NEXT_PUBLIC_SERVER_URL=https://${ZHIC_DOMAIN}
SITE_URL=https://${ZHIC_DOMAIN}

# ── Abr Arvan S3 (Payload media) ──────────────────────────────
# Per-tier prefix puts each environment in its own folder of one bucket.
S3_BUCKET=zhic-media
S3_REGION=ir-thr-at1
S3_ENDPOINT=https://s3.ir-thr-at1.arvanstorage.ir
S3_ACCESS_KEY=                         # tier-specific keypair
S3_SECRET_KEY=                         # tier-specific keypair
S3_PREFIX=review/                      # review/ on tier 2, prod/ on tier 3, '' on workspace

# ── SMS.ir (inquiry form) ─────────────────────────────────────
# Tier 2 (review): leave keys blank AND set SMS_DRY_RUN=true.
# Tier 3 (prod):   real keys, SMS_DRY_RUN unset.
SMS_DRY_RUN=true
SMS_IR_API_KEY=
SMS_IR_LINE_NUMBER=
SMS_IR_TEMPLATE_ID=

# ── Backups (S3 destination for nightly pg_dump) ──────────────
S3_BACKUP_BUCKET=zhic-backups
S3_BACKUP_PREFIX=review/               # match the tier — review/ or prod/

# ── Plausible (optional, prod tier only) ──────────────────────
PLAUSIBLE_SECRET_KEY_BASE=             # generate: openssl rand -hex 64
PLAUSIBLE_BASE_URL=https://analytics.zhicwood.com

# ── Gitea (optional, prod tier only) ──────────────────────────
GITEA_BASE_URL=https://git.zhicwood.com
```

- [ ] **Step 3: Commit**

```bash
git add ops/env.example
git commit -m "chore(ops): env.example — zhic.ir + NOINDEX + SMS_DRY_RUN + S3_PREFIX"
```

---

### Task 8: Extend `ops/Caddyfile` with tier-2 noindex header (env-conditional)

**Why:** Layer 3 of the three-layer noindex. Caddy adds `X-Robots-Tag` on every response when `ZHIC_ENV=review`. On tier 3 the header is absent so production is indexed.

The existing Caddyfile already accepts `{$ZHIC_DOMAIN}`. Add the header conditionally on `{$ZHIC_ENV}`.

**Files:**
- Modify: `ops/Caddyfile`

- [ ] **Step 1: Read the current Caddyfile**

Run: `cat ops/Caddyfile | head -60`

Expected: see the apex domain block starting at `{$ZHIC_DOMAIN} {`.

- [ ] **Step 2: Add the noindex header inside the apex block**

In `ops/Caddyfile`, locate the `{$ZHIC_DOMAIN}` block (the main storefront block). After the existing `header { ... }` block (security headers), add a new conditional block:

```caddyfile
    # Tier-2-only: site-wide noindex header. Layer 3 of the three-layer
    # noindex (the others are robots.txt and <meta name="robots">).
    @review_tier expression {$ZHIC_ENV} == "review"
    header @review_tier X-Robots-Tag "noindex, nofollow, noarchive"
```

This goes right after the existing `Permissions-Policy ...` line and before `reverse_proxy 127.0.0.1:3000 {`.

Also do the same for the `api.{$ZHIC_DOMAIN}` block — add the same `@review_tier` matcher and `header @review_tier X-Robots-Tag` line after the existing security headers.

- [ ] **Step 3: Validate the Caddyfile syntax locally**

Run: `caddy validate --config ops/Caddyfile --adapter caddyfile 2>&1 | head -10`

If `caddy` isn't on the workspace PATH yet, skip — we'll validate post-deploy on Tier 2 in Task 21.

Expected when valid: `Valid configuration`.

- [ ] **Step 4: Commit**

```bash
git add ops/Caddyfile
git commit -m "feat(ops/caddy): X-Robots-Tag header on review tier (layer 3 noindex)"
```

---

### Task 9: Add systemd unit files for `zhic-web` and `zhic-api`

**Why:** `ops/deploy.sh` calls `systemctl restart zhic-web zhic-api` but the unit files don't exist in the repo. Without them deploy.sh fails. Tier 2 will install these via `provision.sh` (Task 11 will extend it).

**Files:**
- Create: `ops/systemd/zhic-web.service`
- Create: `ops/systemd/zhic-api.service`
- Modify: `ops/provision.sh` (extend to install unit files)

- [ ] **Step 1: Create `ops/systemd/zhic-web.service`**

```ini
[Unit]
Description=Zhic storefront (apps/web — Next.js on :3000)
After=network.target postgres.service
Wants=postgres.service

[Service]
Type=simple
User=zhic
WorkingDirectory=/var/zhic/app/apps/web
EnvironmentFile=/var/zhic/secrets/.env
# nvm node path — adjust if pnpm is installed differently
Environment=NODE_ENV=production
ExecStart=/var/zhic/bin/node node_modules/next/dist/bin/next start -p 3000 -H 127.0.0.1
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=zhic-web

# Resource caps
MemoryMax=1G
TasksMax=512

[Install]
WantedBy=multi-user.target
```

- [ ] **Step 2: Create `ops/systemd/zhic-api.service`**

```ini
[Unit]
Description=Zhic Payload CMS (services/api — Next.js on :3001)
After=network.target postgres.service
Wants=postgres.service

[Service]
Type=simple
User=zhic
WorkingDirectory=/var/zhic/app/services/api
EnvironmentFile=/var/zhic/secrets/.env
Environment=NODE_ENV=production
ExecStart=/var/zhic/bin/node node_modules/next/dist/bin/next start -p 3001 -H 127.0.0.1
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=zhic-api

MemoryMax=1500M
TasksMax=512

[Install]
WantedBy=multi-user.target
```

- [ ] **Step 3: Extend `ops/provision.sh` to install the unit files + create `/var/zhic/bin/node` symlink**

Find the end of `provision.sh` (after the Caddy install). Insert before the final `ok "Provision complete"` line (or append if no such line):

```bash
log "Installing systemd units"
cp /var/zhic/app/ops/systemd/zhic-web.service /etc/systemd/system/zhic-web.service
cp /var/zhic/app/ops/systemd/zhic-api.service /etc/systemd/system/zhic-api.service

log "Creating /var/zhic/bin/node symlink (so systemd doesn't need nvm in PATH)"
mkdir -p /var/zhic/bin
# Pick the most recent installed nvm node and symlink it
NODE_BIN=$(ls -d /home/zhic/.nvm/versions/node/v* 2>/dev/null | sort -V | tail -1)/bin/node
if [[ -x "$NODE_BIN" ]]; then
  ln -sf "$NODE_BIN" /var/zhic/bin/node
  ok "Symlinked $(readlink /var/zhic/bin/node)"
else
  echo "Warning: no nvm node found at /home/zhic/.nvm — install Node before deploy.sh runs" >&2
fi

log "Reloading systemd"
systemctl daemon-reload
systemctl enable zhic-web zhic-api
ok "Units installed (not yet started — run deploy.sh first)"
```

- [ ] **Step 4: Commit**

```bash
git add ops/systemd/zhic-web.service ops/systemd/zhic-api.service ops/provision.sh
git commit -m "feat(ops/systemd): zhic-web + zhic-api units; provision installs them"
```

---

### Task 10: Push all Part-A code changes to `origin/staging`

**Why:** The Tier 2 server in Part B clones from `origin/staging`. All code changes must be on the remote.

- [ ] **Step 1: Verify branch and clean tree**

```bash
git status
git log --oneline -10
```

Expected: on branch `staging`, working tree clean, last 9 commits are the Tasks 1–9 commits.

- [ ] **Step 2: Run all tests**

```bash
pnpm --filter @zhic/web test
pnpm --filter @zhic/sms test
```

Expected: all tests pass.

- [ ] **Step 3: Push**

```bash
git push origin staging
```

Expected: branch up-to-date on origin.

---

## Part B — Tier 2 server bringup (gated on operator-side provisioning checklist)

Tasks 11–23 happen on the new Net Afraz VPS (`<TIER2_IP>`). They cannot start until the pre-flight checklist is fully checked.

---

### Task 11: SSH to Tier 2 and run `provision.sh`

**Why:** Brings the box from "fresh OS" to "Docker + Caddy + ufw + zhic user installed."

- [ ] **Step 1: Confirm operator can SSH as root**

From the operator's local machine:

```bash
ssh root@<TIER2_IP> 'echo OK; uname -a'
```

Expected: `OK\nLinux ... ubuntu ... 6.x ...`. If this fails, fix SSH access (verify pub key, port 22 open) before continuing.

- [ ] **Step 2: Copy `provision.sh` to the box**

From the workspace VPS or operator local:

```bash
scp ops/provision.sh root@<TIER2_IP>:/tmp/provision.sh
```

- [ ] **Step 3: Run it**

```bash
ssh root@<TIER2_IP> 'bash /tmp/provision.sh' 2>&1 | tee /tmp/provision-tier2.log
```

Expected output (last lines): `✓ UFW active: 22, 80, 443`, `✓ Docker installed`, `✓ Caddy installed`, `✓ Provision complete`.

- [ ] **Step 4: Verify each component**

```bash
ssh zhic@<TIER2_IP> '
  docker --version &&
  caddy version &&
  sudo ufw status numbered &&
  whoami &&
  ls /var/zhic
'
```

Expected: Docker version line, Caddy version line, UFW shows 22/80/443 rules, `zhic`, and `/var/zhic` exists with `app`, `secrets`, `compose`, `bin` subdirs (some may be empty until Task 14).

- [ ] **Step 5: Commit nothing** — provisioning leaves no repo changes. Move to Task 12.

---

### Task 12: Set up Postgres in Docker on Tier 2

**Why:** Payload needs a database. Match the workspace pattern: container named `zhic-pg`, db `zhic`, user `zhic`. Note: deploy.sh expects compose to live at `/var/zhic/compose`, so place files there.

- [ ] **Step 1: Copy `docker-compose.yml` from the repo to `/var/zhic/compose/`**

The repo has `ops/docker-compose.yml`. On Tier 2:

```bash
ssh zhic@<TIER2_IP> 'sudo mkdir -p /var/zhic/compose && sudo chown zhic:zhic /var/zhic/compose'
scp ops/docker-compose.yml zhic@<TIER2_IP>:/var/zhic/compose/docker-compose.yml
```

- [ ] **Step 2: Generate Postgres password and write a partial .env**

```bash
ssh zhic@<TIER2_IP> '
  PGPW=$(openssl rand -hex 24) &&
  sudo mkdir -p /var/zhic/secrets &&
  sudo chown zhic:zhic /var/zhic/secrets &&
  sudo chmod 700 /var/zhic/secrets &&
  cat > /var/zhic/secrets/.env <<EOF
ZHIC_ENV=review
ZHIC_DOMAIN=zhic.ir
ZHIC_ACME_EMAIL=newton.ahmadreza@gmail.com
NOINDEX=true
POSTGRES_USER=zhic
POSTGRES_PASSWORD=$PGPW
POSTGRES_DB=zhic
DATABASE_URI=postgresql://zhic:$PGPW@127.0.0.1:5432/zhic
EOF
  chmod 600 /var/zhic/secrets/.env &&
  echo "Postgres password written"
'
```

The remaining env vars (PAYLOAD_SECRET, S3 keys, etc.) are filled in Task 16.

- [ ] **Step 3: Bring up Postgres**

```bash
ssh zhic@<TIER2_IP> 'cd /var/zhic/compose && set -a; . /var/zhic/secrets/.env; set +a; docker compose up -d postgres'
```

- [ ] **Step 4: Verify Postgres is healthy**

```bash
ssh zhic@<TIER2_IP> 'docker ps --filter name=zhic-pg --format "{{.Names}} {{.Status}}"'
```

Expected: `zhic-pg-1 Up X seconds (healthy)` or similar — depending on the compose file's container name.

- [ ] **Step 5: Verify connection**

```bash
ssh zhic@<TIER2_IP> 'docker exec $(docker ps -q --filter name=postgres | head -1) psql -U zhic -d zhic -c "SELECT version();"'
```

Expected: `PostgreSQL 16.x ...`.

---

### Task 13: Clone the repo on Tier 2 + checkout `staging` + install deps

- [ ] **Step 1: Clone via the read-only deploy key path**

For Pkg-1, use HTTPS clone (no Gitea yet):

```bash
ssh zhic@<TIER2_IP> '
  sudo mkdir -p /var/zhic/app &&
  sudo chown zhic:zhic /var/zhic/app &&
  cd /var/zhic &&
  rm -rf app &&
  git clone --branch staging https://github.com/ahmadTorkaman/Zhic.git app &&
  cd app &&
  git rev-parse --short HEAD
'
```

Expected: short SHA prints — should match `staging`'s tip (per Task 10).

If the repo is private and HTTPS asks for auth, switch to SSH and add the operator's deploy key. Smaller-scope: a personal access token in HTTPS is fine for Pkg-1.

- [ ] **Step 2: Install nvm + Node 24 (matching workspace)**

```bash
ssh zhic@<TIER2_IP> '
  if [[ ! -d /home/zhic/.nvm ]]; then
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  fi
  export NVM_DIR=/home/zhic/.nvm
  . /home/zhic/.nvm/nvm.sh
  nvm install 24
  nvm use 24
  node --version
  corepack enable
  corepack prepare pnpm@latest --activate
  pnpm --version
'
```

Expected: `v24.x.y`, then a pnpm version.

- [ ] **Step 3: Refresh the systemd node symlink (provision.sh tried but nvm wasn't installed yet)**

```bash
ssh root@<TIER2_IP> '
  NODE_BIN=$(ls -d /home/zhic/.nvm/versions/node/v* | sort -V | tail -1)/bin/node
  ln -sf "$NODE_BIN" /var/zhic/bin/node
  ls -la /var/zhic/bin/node
'
```

Expected: symlink points at `/home/zhic/.nvm/versions/node/v24.x.y/bin/node`.

- [ ] **Step 4: pnpm install (inside the repo)**

```bash
ssh zhic@<TIER2_IP> 'cd /var/zhic/app && export NVM_DIR=/home/zhic/.nvm && . /home/zhic/.nvm/nvm.sh && pnpm install --frozen-lockfile 2>&1 | tail -20'
```

Expected: ends with `Done in N.Ns` and no installation errors.

---

### Task 13.5: Re-run `provision.sh`'s systemd-install block now that the repo is cloned

**Why:** The first `provision.sh` run (Task 11) ran before the repo was at `/var/zhic/app`, so its systemd-install block skipped (per the `c3d75e8` guard). Now that the repo is present, the unit files need to be copied and enabled.

- [ ] **Step 1: Re-run the systemd-install block via SSH**

```bash
ssh root@<TIER2_IP> 'bash /var/zhic/app/ops/provision.sh' 2>&1 | grep -E "systemd|Installing|Symlinked|Reloading|Units" | tail -10
```

The provision.sh script is idempotent — re-running it on an already-bootstrapped box is safe. The systemd-install block this time will find `/var/zhic/app/ops/systemd/zhic-web.service` and `zhic-api.service` and copy them to `/etc/systemd/system/`.

Expected output (subset):
```
→ Installing systemd units
✓ Systemd unit files installed
→ Creating /var/zhic/bin/node symlink (so systemd doesn't need nvm in PATH)
✓ Symlinked /home/zhic/.nvm/versions/node/vX.Y.Z/bin/node
→ Reloading systemd
✓ Units installed and enabled (not yet started — run deploy.sh first)
```

- [ ] **Step 2: Verify units are loaded**

```bash
ssh root@<TIER2_IP> 'systemctl list-unit-files zhic-*.service'
```

Expected: both `zhic-web.service` and `zhic-api.service` listed as `enabled`.

---

### Task 14: Build `apps/web` + `services/api` on Tier 2

- [ ] **Step 1: Build apps/web**

```bash
ssh zhic@<TIER2_IP> 'cd /var/zhic/app && export NVM_DIR=/home/zhic/.nvm && . /home/zhic/.nvm/nvm.sh && NOINDEX=true SITE_URL=https://zhic.ir pnpm --filter @zhic/web build 2>&1 | tail -30'
```

Expected: Next.js build output ending with route summary table; no errors.

Verify (post-build): the noindex env was honored at build time.

```bash
ssh zhic@<TIER2_IP> '
  cd /var/zhic/app/apps/web/.next/server/app &&
  grep -r "noindex" . | head -5
'
```

Expected: at least one match — proves `metadata.robots` was emitted.

- [ ] **Step 2: Build services/api**

```bash
ssh zhic@<TIER2_IP> 'cd /var/zhic/app && export NVM_DIR=/home/zhic/.nvm && . /home/zhic/.nvm/nvm.sh && pnpm --filter @zhic/api build 2>&1 | tail -30'
```

Expected: Payload + Next.js build output; no errors. (Per state.md, `seed.ts` and `scripts/` are excluded from typecheck; build succeeds even with the 4 baseline `Tabs/Tooltip` errors.)

- [ ] **Step 3: Re-apply the Payload `loadEnv.js` patch (FU-3.1-o workaround)**

Per `ops/deploy.sh` lines 22–35, `pnpm install` wipes node_modules so the patch must be re-applied on every fresh install:

```bash
ssh zhic@<TIER2_IP> '
  cd /var/zhic/app
  PATCH_FILE=$(find node_modules/.pnpm -path "*payload*/dist/bin/loadEnv.js" 2>/dev/null | head -1)
  if [[ -n "$PATCH_FILE" ]] && grep -q "nextEnvImport" "$PATCH_FILE"; then
    sed -i "s|^import nextEnvImport from .@next/env.;\$|import * as nextEnvAll from \"@next/env\";|" "$PATCH_FILE"
    sed -i "s|^const { loadEnvConfig } = nextEnvImport;\$|const loadEnvConfig = nextEnvAll.loadEnvConfig ?? nextEnvAll.default?.loadEnvConfig;|" "$PATCH_FILE"
    echo "Patched"
  else
    echo "No patch needed (already applied or upstream fixed)"
  fi
'
```

---

### Task 15: Fill in remaining secrets in `/var/zhic/secrets/.env`

**Why:** Tasks 16–18 need `PAYLOAD_SECRET` set (or migrations / app start fails). S3 creds will be added in Task 24 — leave blank for now.

- [ ] **Step 1: Append the remaining env vars**

```bash
ssh zhic@<TIER2_IP> '
  PAYLOAD_SEC=$(openssl rand -hex 32)
  cat >> /var/zhic/secrets/.env <<EOF

PAYLOAD_SECRET=$PAYLOAD_SEC
NEXT_PUBLIC_SERVER_URL=https://zhic.ir
SITE_URL=https://zhic.ir

# S3 — fill in Task 24 once Abr Arvan keys are issued. Until then, Payload
# falls back to local-disk uploads (the ...?process.env.S3_ACCESS_KEY...
# guard in payload.config.ts).
S3_BUCKET=zhic-media
S3_REGION=ir-thr-at1
S3_ENDPOINT=https://s3.ir-thr-at1.arvanstorage.ir
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_PREFIX=review/

# SMS — review tier never sends real SMS
SMS_DRY_RUN=true
SMS_IR_API_KEY=
SMS_IR_LINE_NUMBER=

# Backups — fill in Task 27
S3_BACKUP_BUCKET=zhic-backups
S3_BACKUP_PREFIX=review/
EOF
  chmod 600 /var/zhic/secrets/.env
  echo "OK — env file complete (S3 keys pending)"
'
```

- [ ] **Step 2: Verify the file**

```bash
ssh zhic@<TIER2_IP> 'wc -l /var/zhic/secrets/.env && stat -c "%a %U:%G" /var/zhic/secrets/.env'
```

Expected: ~25 lines, `600 zhic:zhic`. **The file must NOT be world-readable.**

- [ ] **Step 3: Save the PAYLOAD_SECRET to the operator's password manager**

```bash
ssh zhic@<TIER2_IP> 'grep ^PAYLOAD_SECRET= /var/zhic/secrets/.env'
```

Expected: prints the secret. Copy it to the password manager NOW. If the box is ever rebuilt, the same secret must be reused or all existing user JWTs become invalid.

---

### Task 16: Run Payload migrations against Tier 2 Postgres

- [ ] **Step 1: Run migrations**

```bash
ssh zhic@<TIER2_IP> '
  cd /var/zhic/app
  set -a; . /var/zhic/secrets/.env; set +a
  export NVM_DIR=/home/zhic/.nvm
  . /home/zhic/.nvm/nvm.sh
  pnpm --filter @zhic/api migrate 2>&1 | tail -20
'
```

Expected: applies all migrations, ends with "OK" or similar. If a "no such table" error appears, the migration may need to start from the initial baseline — refer to `ops/deploy.md` for recovery.

- [ ] **Step 2: Verify the schema**

```bash
ssh zhic@<TIER2_IP> '
  docker exec $(docker ps -q --filter name=postgres | head -1) \
  psql -U zhic -d zhic -c "\\dt" | head -40
'
```

Expected: ~42 tables (per state.md). Look for `products`, `showrooms`, `media`, `users`, `payload_migrations`, `payload_preferences`.

---

### Task 17: Start `zhic-web` and `zhic-api` via systemd

- [ ] **Step 1: Reload systemd to pick up unit files (provision.sh installed them)**

```bash
ssh root@<TIER2_IP> 'systemctl daemon-reload && systemctl enable zhic-web zhic-api'
```

Expected: no errors. If "Unit zhic-web.service not found" — re-run `provision.sh`'s systemd block manually (Task 11 step 4 should have handled this).

- [ ] **Step 2: Start the services**

```bash
ssh root@<TIER2_IP> 'systemctl start zhic-api && sleep 5 && systemctl start zhic-web && sleep 5'
```

(Start `zhic-api` first so `zhic-web`'s SSR data fetches succeed.)

- [ ] **Step 3: Verify both are active**

```bash
ssh root@<TIER2_IP> '
  systemctl is-active zhic-web zhic-api &&
  systemctl status zhic-web --no-pager | head -10 &&
  echo "---" &&
  systemctl status zhic-api --no-pager | head -10
'
```

Expected: both `active`, no failed units.

- [ ] **Step 4: Smoke-test directly (bypassing Caddy — DNS isn't up yet)**

```bash
ssh zhic@<TIER2_IP> '
  curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/ &&
  curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3001/admin
'
```

Expected: `200` for storefront, `200` or `307` for admin (redirects to /admin/login).

- [ ] **Step 5: Capture the journal in case anything is unhealthy**

```bash
ssh root@<TIER2_IP> 'journalctl -u zhic-web -n 30 --no-pager'
ssh root@<TIER2_IP> 'journalctl -u zhic-api -n 30 --no-pager'
```

If errors visible: stop here, debug, do not proceed to DNS. Common issues: missing PAYLOAD_SECRET, DATABASE_URI typo, port collision.

---

### Task 18: Configure DNS at Abr Arvan for `zhic.ir`

**This task happens in the Abr Arvan web panel — it's a manual UI action.**

- [ ] **Step 1: Sign into the Abr Arvan panel**

Open the panel; navigate to DNS → Zones → `zhic.ir`.

- [ ] **Step 2: Add records**

| Type | Name | Value | TTL |
|---|---|---|---|
| A | `@` (apex) | `<TIER2_IP>` | 300 |
| A | `www` | `<TIER2_IP>` | 300 |
| CAA | `@` | `0 issue "letsencrypt.org"` | 3600 (skip if Abr Arvan UI doesn't expose CAA — non-blocking) |

If the operator wants `api.zhic.ir` as a separate admin endpoint (per `ops/Caddyfile`'s api-subdomain block), also add:

| Type | Name | Value | TTL |
|---|---|---|---|
| A | `api` | `<TIER2_IP>` | 300 |

For Pkg-1 review, the `api` subdomain is optional — Payload admin is reachable at `https://zhic.ir/admin` via the same reverse-proxy.

- [ ] **Step 3: Verify DNS resolution from outside**

Wait 60–300 seconds for propagation, then:

```bash
dig +short zhic.ir
dig +short www.zhic.ir
```

Expected: both return `<TIER2_IP>`. If empty or returning the registrar's parking IP, wait another 5 minutes and re-check. Don't proceed past this step until DNS resolves.

- [ ] **Step 4: Verify reachability**

```bash
curl -v http://zhic.ir/ 2>&1 | head -20
```

Expected: connects to `<TIER2_IP>:80`, then HTTP 308 or 200 from Caddy (Caddy isn't started yet — may show "connection refused" if so. Move to Task 19 to start Caddy).

---

### Task 19: Place Caddyfile on Tier 2, start Caddy, wait for LE cert

- [ ] **Step 1: Copy Caddyfile from the repo on the box**

The repo is at `/var/zhic/app`. Caddy reads from `/etc/caddy/Caddyfile`:

```bash
ssh root@<TIER2_IP> '
  cp /var/zhic/app/ops/Caddyfile /etc/caddy/Caddyfile &&
  caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
'
```

Expected: `Valid configuration`. If invalid, fix the syntax before reload.

- [ ] **Step 2: Set up systemd EnvironmentFile for Caddy**

Caddy needs `ZHIC_DOMAIN`, `ZHIC_ENV`, `ZHIC_ACME_EMAIL` from the env file:

```bash
ssh root@<TIER2_IP> '
  mkdir -p /etc/systemd/system/caddy.service.d
  cat > /etc/systemd/system/caddy.service.d/zhic.conf <<EOF
[Service]
EnvironmentFile=/var/zhic/secrets/.env
EOF
  systemctl daemon-reload
  systemctl restart caddy
  sleep 3
  systemctl status caddy --no-pager | head -10
'
```

Expected: Caddy active, listening on :80 + :443.

- [ ] **Step 3: Watch the Caddy log for LE cert issuance**

```bash
ssh root@<TIER2_IP> 'journalctl -u caddy -n 50 --no-pager | grep -E "certificate|http\.acme|ready|error" | tail -20'
```

Expected: log lines like "obtaining certificate for zhic.ir", then "certificate obtained successfully". If it shows `ratelimited` errors from LE, switch to Let's Encrypt staging by un-commenting the `acme_ca` line in `ops/Caddyfile` and reloading. Don't proceed if the cert isn't issued.

- [ ] **Step 4: Verify TLS from outside**

```bash
curl -sI https://zhic.ir/ | head -5
```

Expected: `HTTP/2 200` (or `HTTP/2 503` if backend is slow on first hit — retry once). The cert is from Let's Encrypt and the connection is TLS.

```bash
echo | openssl s_client -connect zhic.ir:443 -servername zhic.ir 2>/dev/null | openssl x509 -noout -issuer -dates
```

Expected: issuer is `Let's Encrypt`, `notAfter` is ~90 days from now.

---

### Task 20: Verify three-layer noindex over HTTPS

- [ ] **Step 1: Layer 3 — Caddy `X-Robots-Tag` header**

```bash
curl -sI https://zhic.ir/ | grep -i x-robots-tag
```

Expected: `x-robots-tag: noindex, nofollow, noarchive`.

If empty: check that `ZHIC_ENV=review` is in `/var/zhic/secrets/.env` and that the Caddy systemd EnvironmentFile drop-in is in place. Reload caddy: `sudo systemctl reload caddy`.

- [ ] **Step 2: Layer 2 — `<meta name="robots">` in HTML**

```bash
curl -s https://zhic.ir/ | grep -E '<meta\s+name="robots"' | head -1
```

Expected: `<meta name="robots" content="noindex, nofollow, noarchive"/>` (or similar — Next.js may emit comma+space variations).

If empty: `NOINDEX=true` is missing in `.env`, or the `next build` step ran with `NOINDEX` unset and the metadata was tree-shaken. Re-run Task 14 with `NOINDEX=true` exported, then `systemctl restart zhic-web`.

- [ ] **Step 3: Layer 1 — `robots.txt`**

```bash
curl -s https://zhic.ir/robots.txt
```

Expected:

```
User-Agent: *
Disallow: /
```

(No `Sitemap:` line — that's intentional per Task 2.)

If it shows the default `Allow: /` + `Disallow: /admin` etc — same fix as step 2: `NOINDEX` wasn't set at build/runtime.

- [ ] **Step 4: Composite check**

All three pass = noindex is fully on. Snapshot for the SEO specialist:

```bash
{
  echo "=== robots.txt ==="
  curl -s https://zhic.ir/robots.txt
  echo
  echo "=== HTML <meta robots> ==="
  curl -s https://zhic.ir/ | grep -E '<meta\s+name="robots"' | head -1
  echo
  echo "=== HTTP X-Robots-Tag ==="
  curl -sI https://zhic.ir/ | grep -i x-robots-tag
} > /tmp/zhic-noindex-evidence.txt && cat /tmp/zhic-noindex-evidence.txt
```

Save the output — share it with the SEO specialist as proof.

---

### Task 21: Smoke test the 5 critical routes on Tier 2

- [ ] **Step 1: Hit each route and check status code**

```bash
for p in / /products /journal /showrooms /contact; do
  code=$(curl -s -o /dev/null -w "%{http_code}" https://zhic.ir$p)
  echo "$p -> $code"
done
```

Expected: all `200`. If any is non-2xx, debug before owner handoff.

- [ ] **Step 2: Check that the admin page reaches the login**

```bash
curl -sL https://zhic.ir/admin -o /dev/null -w "%{http_code}\n"
```

Expected: `200`.

- [ ] **Step 3: Visual confirmation**

Open `https://zhic.ir/` in a browser. Confirm:
- Persian RTL layout renders
- Forest/caramel/cream tokens visible (homepage hero, footer)
- No console errors in DevTools (cookie/style-injection issues from FU-7.1-c should now be GONE behind TLS)
- `<meta name="robots" content="noindex,...">` visible in DevTools Elements

Pass these checks before proceeding.

---

## Part C — Abr Arvan S3 wiring

These tasks happen after Tier 2 is up over HTTPS. They populate real images so owner review isn't placeholder-driven.

---

### Task 22: Configure CORS on the `zhic-media` bucket

**This task happens in the Abr Arvan web panel.**

- [ ] **Step 1: Open bucket settings**

Abr Arvan panel → Object Storage → `zhic-media` → Settings → CORS.

- [ ] **Step 2: Add this CORS rule**

```json
[
  {
    "AllowedOrigins": [
      "https://zhic.ir",
      "https://www.zhic.ir",
      "https://zhicwood.com",
      "https://www.zhicwood.com",
      "https://zhicwood.co",
      "https://www.zhicwood.co",
      "http://80.240.31.146:3001"
    ],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

Save.

- [ ] **Step 3: Verify public-read on the bucket**

```bash
curl -sI 'https://s3.ir-thr-at1.arvanstorage.ir/zhic-media/' | head -3
```

Expected: `HTTP/2 200` or `403` (403 is OK if listing is forbidden — we only need `GetObject`). Once a real object exists, `curl https://s3.ir-thr-at1.arvanstorage.ir/zhic-media/<key>` should return 200 with `image/*`.

---

### Task 23: Add S3 credentials to `.env` and restart `zhic-api`

- [ ] **Step 1: Edit `.env` to populate S3 keys**

```bash
ssh zhic@<TIER2_IP> '
  sed -i "s|^S3_ACCESS_KEY=.*|S3_ACCESS_KEY=<REVIEW_TIER_S3_ACCESS_KEY>|" /var/zhic/secrets/.env
  sed -i "s|^S3_SECRET_KEY=.*|S3_SECRET_KEY=<REVIEW_TIER_S3_SECRET_KEY>|" /var/zhic/secrets/.env
  grep -E "^S3_(ACCESS|SECRET)_KEY=" /var/zhic/secrets/.env
'
```

(Replace `<REVIEW_TIER_S3_ACCESS_KEY>` and `<REVIEW_TIER_S3_SECRET_KEY>` with the actual keys from Abr Arvan IAM. **Don't paste them into shell history** — set them as shell variables first, or use a heredoc that the operator types into the SSH session interactively.)

- [ ] **Step 2: Restart `zhic-api` to pick up new env**

```bash
ssh root@<TIER2_IP> 'systemctl restart zhic-api && sleep 5 && systemctl status zhic-api --no-pager | head -10'
```

Expected: `active (running)`.

- [ ] **Step 3: Verify Payload's S3 storage initialized**

```bash
ssh root@<TIER2_IP> 'journalctl -u zhic-api -n 50 --no-pager | grep -i s3'
```

Expected: at least one log line indicating S3 plugin loaded. Absence is OK if Payload doesn't log S3 init explicitly — proof comes from Task 24.

---

### Task 24: Upload a test image via Payload admin and verify S3 placement

- [ ] **Step 1: Open Payload admin in a browser**

Open `https://zhic.ir/admin`. Sign in with the admin user (created on workspace and migrated, or freshly created — `pnpm --filter @zhic/api reset-password` if needed).

- [ ] **Step 2: Upload one image to the Media collection**

Navigate to Media → Add new. Upload a small test JPEG (any image; ideally a real product shot from the hand-off folder).

- [ ] **Step 3: After save, verify it landed at the right S3 path**

In the Payload admin, click into the just-uploaded media doc. The `url` field should be:

```
https://s3.ir-thr-at1.arvanstorage.ir/zhic-media/review/<filename>
```

If it's a relative path like `/api/media/<filename>` — the S3 plugin didn't activate. Check `S3_ACCESS_KEY` is non-empty in `.env` and the api was restarted.

- [ ] **Step 4: Curl the public URL**

```bash
curl -sI 'https://s3.ir-thr-at1.arvanstorage.ir/zhic-media/review/<exact-filename>' | head -5
```

Expected: `HTTP/2 200` with `content-type: image/*`. If 403 — bucket isn't public-read; fix at Abr Arvan. If 404 — the prefix is wrong; check `S3_PREFIX` in env.

- [ ] **Step 5: Verify Next/Image renders it**

In the storefront (or the Payload admin's preview), find a page that uses this image — easiest is to attach it to an existing product's `gallery` and load `/products/<that-product-slug>`.

```bash
curl -s 'https://zhic.ir/products/<slug>' | grep -oE 'src="[^"]*'<exact-filename>'[^"]*"' | head -1
```

Expected: a `src=` attribute containing the Abr Arvan host or `_next/image` proxying to it. No `unoptimized: true` warnings in journal.

---

## Part D — Backups

---

### Task 25: Write `ops/backup.sh`

**Why:** Nightly Postgres dump → S3, scoped per tier. (Spec §2.7)

**Files:**
- Create: `ops/backup.sh`

- [ ] **Step 1: Create `ops/backup.sh` in the repo (workspace), commit, push, then pull on Tier 2**

Workspace (`/home/ahmad/Zhic`):

```bash
cat > ops/backup.sh <<'EOF'
#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────────
# backup.sh — nightly Postgres dump → Abr Arvan S3.
#
# Reads /var/zhic/secrets/.env for DB credentials and S3_BACKUP_*.
# Local copies kept 14 days (review) / 30 days (prod).
#
# Usage:
#   bash /var/zhic/app/ops/backup.sh review
#   bash /var/zhic/app/ops/backup.sh prod
# ────────────────────────────────────────────────────────────────
set -euo pipefail

TIER="${1:-}"
if [[ "$TIER" != "review" && "$TIER" != "prod" ]]; then
  echo "Usage: $0 {review|prod}" >&2
  exit 1
fi

ENV_FILE=/var/zhic/secrets/.env
[[ -f "$ENV_FILE" ]] || { echo "Missing $ENV_FILE" >&2; exit 1; }
set -a; . "$ENV_FILE"; set +a

LOCAL_DIR=/var/backups/zhic
mkdir -p "$LOCAL_DIR"

STAMP=$(date +%Y%m%d-%H%M%S)
DUMP_FILE="$LOCAL_DIR/zhic-${TIER}-${STAMP}.sql.gz"

echo "[$(date -Iseconds)] Dumping postgres → $DUMP_FILE"
docker exec "$(docker ps -q --filter name=postgres | head -1)" \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --clean --if-exists \
  | gzip -9 > "$DUMP_FILE"

LOCAL_SIZE=$(stat -c %s "$DUMP_FILE")
echo "[$(date -Iseconds)] Dump size: $LOCAL_SIZE bytes"
[[ $LOCAL_SIZE -gt 1024 ]] || { echo "Dump suspiciously small — bailing"; exit 2; }

# Upload via aws CLI (works against Abr Arvan with --endpoint-url)
echo "[$(date -Iseconds)] Uploading to S3 → s3://${S3_BACKUP_BUCKET}/${S3_BACKUP_PREFIX}$(basename "$DUMP_FILE")"
AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY" \
AWS_SECRET_ACCESS_KEY="$S3_SECRET_KEY" \
aws --endpoint-url "$S3_ENDPOINT" s3 cp "$DUMP_FILE" \
  "s3://${S3_BACKUP_BUCKET}/${S3_BACKUP_PREFIX}$(basename "$DUMP_FILE")"

# Local retention
RETAIN=14
if [[ "$TIER" == "prod" ]]; then RETAIN=30; fi
echo "[$(date -Iseconds)] Pruning local backups older than $RETAIN days"
find "$LOCAL_DIR" -name "zhic-${TIER}-*.sql.gz" -mtime "+$RETAIN" -delete

echo "[$(date -Iseconds)] Backup OK"
EOF
chmod +x ops/backup.sh
```

- [ ] **Step 2: Commit + push**

```bash
git add ops/backup.sh
git commit -m "feat(ops/backup): nightly pg_dump → Abr Arvan S3 (tier-aware)"
git push origin staging
```

- [ ] **Step 3: Pull on Tier 2**

```bash
ssh zhic@<TIER2_IP> 'cd /var/zhic/app && git pull origin staging && ls -la ops/backup.sh'
```

Expected: file present, executable.

- [ ] **Step 4: Install AWS CLI on Tier 2 if missing**

```bash
ssh root@<TIER2_IP> '
  if ! command -v aws >/dev/null; then
    apt-get install -y awscli
  fi
  aws --version
'
```

Expected: aws-cli version line.

---

### Task 26: Schedule `backup.sh` via cron and verify a manual run

- [ ] **Step 1: Manual run to verify end-to-end**

```bash
ssh zhic@<TIER2_IP> 'bash /var/zhic/app/ops/backup.sh review 2>&1 | tee /tmp/backup-first-run.log'
```

Expected:
- Lines: `Dumping postgres → ...`, `Dump size: <bytes>`, `Uploading to S3 → ...`, `Backup OK`
- Final exit 0
- Local file at `/var/backups/zhic/zhic-review-<stamp>.sql.gz`
- S3 object at `s3://zhic-backups/review/zhic-review-<stamp>.sql.gz`

If it fails: most likely `aws` CLI signature mismatch with Abr Arvan; try adding `--no-verify-ssl` or `AWS_DEFAULT_REGION=ir-thr-at1`. Iterate inside the script.

- [ ] **Step 2: Verify the S3 object**

```bash
ssh zhic@<TIER2_IP> '
  set -a; . /var/zhic/secrets/.env; set +a
  AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY" AWS_SECRET_ACCESS_KEY="$S3_SECRET_KEY" \
  aws --endpoint-url "$S3_ENDPOINT" s3 ls s3://zhic-backups/review/
'
```

Expected: at least one `.sql.gz` listed.

- [ ] **Step 3: Add cron entry**

```bash
ssh zhic@<TIER2_IP> '
  (crontab -l 2>/dev/null; echo "0 3 * * * /var/zhic/app/ops/backup.sh review >> /var/log/zhic-backup.log 2>&1") | crontab -
  crontab -l | grep backup.sh
'
```

Expected: prints the new line. Cron will run nightly at 03:00 server time.

- [ ] **Step 4: Verify cron is enabled**

```bash
ssh root@<TIER2_IP> 'systemctl is-active cron'
```

Expected: `active`.

---

## Part E — Owner handoff

---

### Task 27: Final composite smoke + draft owner-facing message

- [ ] **Step 1: One-shot validation**

```bash
{
  echo "── DNS ──"; dig +short zhic.ir; dig +short www.zhic.ir
  echo
  echo "── TLS ──"; echo | openssl s_client -connect zhic.ir:443 -servername zhic.ir 2>/dev/null | openssl x509 -noout -issuer -dates
  echo
  echo "── 3-layer noindex ──"
  curl -s https://zhic.ir/robots.txt | head -3
  curl -s https://zhic.ir/ | grep -E '<meta\s+name="robots"' | head -1
  curl -sI https://zhic.ir/ | grep -i x-robots-tag
  echo
  echo "── 5 critical routes ──"
  for p in / /products /journal /showrooms /contact; do
    code=$(curl -s -o /dev/null -w "%{http_code}" https://zhic.ir$p)
    printf "  %-15s -> %s\n" "$p" "$code"
  done
  echo
  echo "── S3 sanity ──"
  curl -sI 'https://s3.ir-thr-at1.arvanstorage.ir/zhic-media/' | head -1
  echo
  echo "── Backup last run ──"
  ssh zhic@<TIER2_IP> 'ls -la /var/backups/zhic/ | head -5'
} > /tmp/zhic-tier2-handoff.txt
cat /tmp/zhic-tier2-handoff.txt
```

Expected: every section shows healthy values. If anything's red, fix before sending the URL.

- [ ] **Step 2: Update `docs/state.md`**

In the `Snapshot` table, update `Last updated` to today's date and add a row to the Phase 7 table marking Tier 2 bringup as ✅ (or noting partial completion).

In the follow-up table, mark FU-7.1-d (SMS_DRY_RUN) as resolved if Task 4 closed it cleanly.

```bash
# (edit docs/state.md by hand or via the editor of choice)
git add docs/state.md
git commit -m "docs(state): mark tier-2 bringup complete; close FU-7.1-d"
git push origin staging
```

- [ ] **Step 3: Draft the owner-facing message**

Compose (in Persian) for the contract-exit signoff request:

```
سلام،

نسخه‌ی پیش‌نمایش پکیج ۱ از پروژه‌ی ژیک آماده‌ی بازبینی است:

  https://zhic.ir/

مواردی که می‌توانید بررسی کنید:
- صفحه‌ی اصلی، طرح‌ها، و محصولات
- صفحه‌ی شوروم‌ها (همدان، تهران، اصفهان)
- ژورنال
- فرم تماس و استعلام

این محیط برای بازبینی شما ساخته شده و قابل دسترسی برای موتورهای جستجو
نیست. تا پیش از تأیید نهایی شما هیچ بازدیدکننده‌ی دیگری به آن دسترسی
نخواهد داشت.

لطفاً بازخوردتان را تا تاریخ <SIGNOFF_DEADLINE> بفرستید تا بتوانیم برای
عقد قرارداد پکیج ۲ اقدام کنیم.

با احترام،
احمدرضا
```

Send via the channel agreed upon (email / Telegram).

- [ ] **Step 4: Final commit + push**

```bash
git add docs/state.md
git status
git push origin staging
```

If state.md was already pushed in step 2, this is a no-op — that's fine.

---

## Self-review summary

**Spec coverage:**
- Spec §2 Tier 2 bringup → Tasks 11–21 ✅
- Spec §2.4 Three-layer noindex → Tasks 1, 2, 3, 8, 20 ✅
- Spec §4 Abr Arvan S3 → Tasks 5, 6, 22, 23, 24 ✅
- Spec §2.7 Backups → Tasks 25, 26 ✅
- Spec §6 provisioning checklist → Pre-flight section ✅
- Spec §7 implementation order → matches Part A → Part B → Part C → Part D → Part E ✅
- Spec §8 verification gates → embedded as "expected" outputs in each step ✅
- Spec §3 Tier 3 (zhicwood.com / .co) bringup → DEFERRED to follow-up plan (per spec §0 + §11)
- Spec §10 OQ-A through OQ-E + FU-7.1-d, FU-7.1-e → noted in pre-flight + Task 4 (FU-7.1-d)

**Placeholder scan:** no "TBD", "TODO", "implement later" in the plan. The angle-bracket markers (`<TIER2_IP>`, `<REVIEW_TIER_S3_ACCESS_KEY>`) are operator-fill-in parameters set during execution, not placeholders for unfinished design.

**Type / signature consistency:** `NOINDEX` constant in `lib/env.ts`; `SMS_DRY_RUN` env name consistent across Tasks 4 and 7; `S3_PREFIX` consistent across Tasks 5, 7, 15, 23. Service unit names `zhic-web` / `zhic-api` consistent with existing `ops/deploy.sh`.

---

**End of plan.**
