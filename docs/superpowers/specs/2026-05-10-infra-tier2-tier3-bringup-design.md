# Infra bringup — Tier 2 (zhic.ir) + Tier 3 (zhicwood.com/.co) + Abr Arvan media — Design Spec

**Date:** 2026-05-10
**Branch:** to be cut from `staging` once work begins (suggested: `infra/tier2-tier3-bringup`)
**Status:** spec — implementation plan to follow via `superpowers:writing-plans` after user provisions vendors
**Replaces:** the "7.1 remainder" punch-list at the bottom of `state.md`

---

## 0. Why this spec

`state.md` describes Phase 7.1 as "🟡 in progress." That's accurate — admin works on the workspace VPS — but it understates what's missing:

- The owners cannot see the work because `zhic.ir` doesn't resolve.
- The site cannot be reviewed cleanly because the workspace is bare HTTP behind some kind of proxy that injects `<style>` tags and strips `Sec-Fetch-Site` headers (FU-7.1-c).
- Real product imagery is local-disk only. Half the catalog renders the cream "تصویر به‌زودی" placeholder.
- There is no production environment, full stop.

This spec covers the three things that close those gaps in one bringup:

| | Item | Outcome |
|---|---|---|
| A.2 | Tier 2 VPS — `zhic.ir` review environment | Owners can review at HTTPS, fully `noindex`'d |
| A.3 | Tier 3 VPS — `zhicwood.com` + `zhicwood.co` production | Public brand, indexed, real |
| B | Abr Arvan S3 + media pipeline | Real images on Payload, working `<Image>` migration |

It deliberately **does not** cover:

- Gitea + Gitea Actions auto-deploy (Item C — separate spec when DNS for `git.zhicwood.com` is decided)
- Production build automation beyond the manual `deploy-prod.sh` script (Item D)
- Monitoring, Plausible, error tracking, Postgres replication (Item E)

Those depend on Items A + B existing first.

---

## 1. Topology — committed reference

```
┌──────────────────────────────────────────────────────────────────────┐
│  Tier 1 — WORKSPACE                                                  │
│  Vendor: Pars Pack (existing). IP: 80.240.31.146.                    │
│  No DNS points here. No Caddy. SSH-only access.                      │
│  Hostname: workspace (internal).                                     │
│  Continues exactly as today.                                         │
└────────────────────┬─────────────────────────────────────────────────┘
                     │ operator-typed deploy command
                     ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Tier 2 — CLIENT REVIEW                                              │
│  Vendor: Net Afraz. New VPS.                                         │
│  Domains: zhic.ir, www.zhic.ir.                                      │
│  Site-wide noindex (3-layer). HTTPS via Caddy + Let's Encrypt.       │
│  Hostname: review (internal). Bucket prefix: review/.                │
└────────────────────┬─────────────────────────────────────────────────┘
                     │ operator-typed deploy command (after owner signoff)
                     ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Tier 3 — PRODUCTION                                                 │
│  Vendor: Net Afraz. New VPS (separate from Tier 2).                  │
│  Domains: zhicwood.com (canonical), www.zhicwood.com,                │
│           zhicwood.co (301 → zhicwood.com), www.zhicwood.co.         │
│  Indexed. HTTPS via Caddy + Let's Encrypt.                           │
│  Hostname: prod (internal). Bucket prefix: prod/.                    │
└──────────────────────────────────────────────────────────────────────┘
```

Each tier is a complete, isolated environment: own VPS, own Docker network, own Postgres, own Payload secret, own SMS.ir credentials, own bucket prefix. Nothing shared.

Branch model (from the just-completed cleanup):
- `feature/*` → workspace at 80.240.31.146 (any branch you're hacking on)
- `staging` → review at zhic.ir
- `main` → prod at zhicwood.com / .co

---

## 2. Item A.2 — Tier 2 (`zhic.ir`) bringup

### 2.1 Net Afraz VPS — what to buy

| Field | Value | Reasoning |
|---|---|---|
| Plan | 4 vCPU / 8 GB RAM / 80 GB SSD | Headroom for Postgres + Payload + Next.js + Docker overhead |
| Region | Tehran (any Net Afraz Tehran DC) | Iranian-domestic, low latency to client + admin |
| OS | Ubuntu 24.04 LTS | Matches workspace; LTS until 2029 |
| Network | Public IPv4 (static) | Required for DNS A record + LE certificate validation |
| Bandwidth | 5 TB/mo or unmetered | Owner-review traffic only — never saturated |
| Backups | Provider snapshots: weekly | Fallback if our pg_dump pipeline fails |

**Cost target:** ~₸600,000–900,000 / month (rial-pricing varies by Net Afraz plan; confirm at purchase).

### 2.2 DNS — Abr Arvan records

Records to create in Abr Arvan DNS panel:

| Type | Name | Value | TTL |
|---|---|---|---|
| A | `zhic.ir` | `<Tier 2 VPS IP>` | 300 (raise to 3600 once stable) |
| A | `www.zhic.ir` | `<Tier 2 VPS IP>` | 300 |
| CAA | `zhic.ir` | `0 issue "letsencrypt.org"` | 3600 |
| TXT | `_acme-challenge.zhic.ir` | (set by Caddy automatically via DNS-01 if needed) | 60 |

The CAA record is a hardening step: only Let's Encrypt is allowed to issue certs for the zone. Prevents a hostile CA from issuing a cert someone else's request. Skip if Net Afraz/Abr Arvan don't support CAA — not blocking.

### 2.3 Caddyfile — `zhic.ir`

Location on Tier 2 VPS: `/etc/caddy/Caddyfile`

```caddyfile
{
  email ops@zhicwood.com
  # Servers in Iran can hit LE without VPN; if it ever fails, switch to ZeroSSL
}

# Canonical: redirect www → apex
www.zhic.ir {
  redir https://zhic.ir{uri} permanent
}

# Apex
zhic.ir {
  encode zstd gzip

  # Layer 3 of three-layer noindex — header on every response
  header X-Robots-Tag "noindex, nofollow, noarchive"

  # Standard hardening
  header Strict-Transport-Security "max-age=31536000; includeSubDomains"
  header X-Content-Type-Options "nosniff"
  header X-Frame-Options "DENY"
  header Referrer-Policy "strict-origin-when-cross-origin"
  header Permissions-Policy "camera=(), microphone=(), geolocation=()"

  # Strip server identifier
  header -Server

  # Reverse-proxy to the Next.js + Payload app on localhost:3001
  reverse_proxy 127.0.0.1:3001 {
    header_up Host {host}
    header_up X-Real-IP {remote_host}
    header_up X-Forwarded-For {remote_host}
    header_up X-Forwarded-Proto {scheme}
  }
}
```

The `header_up` lines fix FU-7.1-c — Caddy passes through the request headers cleanly so Payload's `Origin`/`Sec-Fetch-Site` checks see real values, not stripped ones. The three pnpm patches under `patches/` may become unnecessary after this lands; verify via FU-7.1-b and remove patches that are no longer load-bearing.

### 2.4 Three-layer `noindex`

Belt + suspenders + buckle. Each layer can fail silently — together they cannot.

**Layer 1 — `apps/web/src/app/robots.ts`** (currently allows everything except `/admin`, `/api`, etc):

```ts
import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  // Tier 2 (zhic.ir) sets NEXT_PUBLIC_NOINDEX=true.
  // Tier 3 (zhicwood.com) leaves it unset.
  const noindex = process.env.NEXT_PUBLIC_NOINDEX === 'true';

  if (noindex) {
    return {
      rules: { userAgent: '*', disallow: '/' },
      // Intentionally no sitemap reference — don't help crawlers index us
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

**Layer 2 — root layout `metadata.robots`** in `apps/web/src/app/layout.tsx` (additive — current root metadata stays):

```ts
export const metadata: Metadata = {
  // ... existing fields
  robots: process.env.NEXT_PUBLIC_NOINDEX === 'true'
    ? { index: false, follow: false, nocache: true }
    : undefined, // default = indexed
};
```

This emits `<meta name="robots" content="noindex, nofollow, noarchive">` in HTML head when the env flag is on.

**Layer 3 — Caddy `X-Robots-Tag` header** (already shown in §2.3). Sent on every HTTP response, including non-HTML (RSS, sitemap, JSON-LD endpoints).

**Verify post-deploy:**

```bash
# Header check
curl -sI https://zhic.ir/ | grep -i x-robots-tag
# Expect: x-robots-tag: noindex, nofollow, noarchive

# HTML meta check
curl -s https://zhic.ir/ | grep -E '<meta name="robots"'
# Expect: <meta name="robots" content="noindex,nofollow,nocache"/>

# robots.txt check
curl -s https://zhic.ir/robots.txt
# Expect: Disallow: /
```

All three must pass. If any fails, fix before announcing the URL to owners.

### 2.5 App stack on Tier 2

Mirrors the workspace exactly, with the env flag set:

| Component | Spec |
|---|---|
| Postgres | Docker (`zhic-pg-review`), db `zhic_review`, user `zhic_review`. Volume mount on host disk |
| Node | 24.x via fnm or nvm (matches workspace) |
| Process manager | pm2, app name `zhic-api-review`, port `127.0.0.1:3001` (localhost-only — Caddy fronts) |
| Build artifact | `services/api` running `next start` (Payload mounts at `/admin`, REST at `/api`) |
| Migrations | `pnpm migrate` against tier-2 DB |
| Seed | NOT run on tier 2 — content comes from real Payload editing or migration from workspace |
| Env file | `/home/ahmad/zhic/.env.review` (out of git, mode 600) |

**Required env vars on Tier 2:**

```bash
# App identity
NODE_ENV=production
NEXT_PUBLIC_NOINDEX=true                          # ← noindex flag
NEXT_PUBLIC_SITE_URL=https://zhic.ir
PAYLOAD_PUBLIC_SERVER_URL=https://zhic.ir
SERVER_URL=https://zhic.ir

# Database
DATABASE_URL=postgres://zhic_review:<pw>@127.0.0.1:5432/zhic_review

# Payload
PAYLOAD_SECRET=<32-byte hex, fresh per tier — DON'T copy from workspace>

# Object storage (Item B)
S3_ENDPOINT=https://<abr-arvan-s3-endpoint>
S3_ACCESS_KEY_ID=<tier-2 key>
S3_SECRET_ACCESS_KEY=<tier-2 secret>
S3_BUCKET=zhic-media
S3_PREFIX=review/
S3_PUBLIC_URL=https://<abr-arvan-cdn-or-bucket-public-url>/review/

# SMS (sandbox or muted on review tier — owners shouldn't trigger real SMS)
SMS_IR_API_KEY=<sandbox key or unset>
SMS_IR_LINE_NUMBER=<sandbox or unset>
SMS_DRY_RUN=true                                  # gate in @zhic/sms — to add as FU-7.1-d
```

`SMS_DRY_RUN=true` is a **new gate** to add to `packages/sms` so review-tier inquiries don't text real showroom managers. Implementation note: in `sendSms()`, early-return after logging if `SMS_DRY_RUN === 'true'`. This is a small follow-up logged in §10.

### 2.6 Provisioning script — `ops/provision.sh` (extend existing)

The repo already has `/home/ahmad/Zhic/ops/provision.sh`. Extend it (or create `provision-tier.sh` taking `--tier=review|prod` arg) to install on a fresh Net Afraz Ubuntu 24.04 box:

1. Update apt, install: docker, docker-compose, fnm, caddy (via official repo), pnpm (via corepack)
2. Create `ahmad` user, copy authorized_keys
3. Disable root SSH login, password auth — keys only
4. UFW firewall: allow 22, 80, 443; deny everything else inbound
5. Bring up Postgres via docker-compose
6. Clone repo (read-only deploy key), checkout target branch (`staging` for tier 2, `main` for tier 3)
7. `pnpm install`, `pnpm build`, `pnpm migrate`
8. Write env file from template + interactive prompt for secrets (or accept envfile via stdin)
9. pm2 start, pm2 save, pm2 startup
10. Place Caddyfile, `systemctl reload caddy`

Two scripts: `ops/provision-tier.sh` (one-shot bringup) + `ops/deploy-tier.sh` (subsequent deploys: pull, install, build, migrate, restart pm2). Both take `--tier=review|prod` and read tier-specific config from `ops/tiers/{review,prod}.env`.

### 2.7 Backups — Tier 2

Daily Postgres dump + S3 upload, cron under `ahmad` user:

```cron
0 3 * * * /home/ahmad/zhic/ops/backup.sh review >> /var/log/zhic-backup.log 2>&1
```

`ops/backup.sh` (new):
- `pg_dump` to `/var/backups/zhic_review_$(date +%Y%m%d).sql.gz`
- Upload to `s3://zhic-backups/review/`
- Prune local backups older than 14 days
- Prune S3 backups older than 90 days (lifecycle rule on bucket if Abr Arvan supports it)

---

## 3. Item A.3 — Tier 3 (`zhicwood.com` + `zhicwood.co`) bringup

Mirrors Tier 2 with these deltas:

### 3.1 VPS specs

| Field | Value | Reasoning vs Tier 2 |
|---|---|---|
| Plan | 4 vCPU / 8 GB RAM / 80 GB SSD | Same as Tier 2 — Pkg-1 traffic is small |
| Backups | Provider snapshots: daily (not weekly) | Real users, real risk |

Optional upgrade later: vertical-scale to 8 vCPU / 16 GB if traffic warrants. Net Afraz vertical scaling is fast.

### 3.2 DNS records

| Type | Name | Value | TTL |
|---|---|---|---|
| A | `zhicwood.com` | `<Tier 3 VPS IP>` | 300 → 3600 |
| A | `www.zhicwood.com` | `<Tier 3 VPS IP>` | 300 → 3600 |
| A | `zhicwood.co` | `<Tier 3 VPS IP>` | 300 → 3600 |
| A | `www.zhicwood.co` | `<Tier 3 VPS IP>` | 300 → 3600 |
| CAA | `zhicwood.com` | `0 issue "letsencrypt.org"` | 3600 |
| CAA | `zhicwood.co` | `0 issue "letsencrypt.org"` | 3600 |

### 3.3 Caddyfile — Tier 3

```caddyfile
{
  email ops@zhicwood.com
}

# Canonical = zhicwood.com. Everything else 301s to it.
www.zhicwood.com, zhicwood.co, www.zhicwood.co {
  redir https://zhicwood.com{uri} permanent
}

zhicwood.com {
  encode zstd gzip

  # NO X-Robots-Tag header — production is indexed.

  header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
  header X-Content-Type-Options "nosniff"
  header X-Frame-Options "DENY"
  header Referrer-Policy "strict-origin-when-cross-origin"
  header Permissions-Policy "camera=(), microphone=(), geolocation=()"
  header -Server

  reverse_proxy 127.0.0.1:3001 {
    header_up Host {host}
    header_up X-Real-IP {remote_host}
    header_up X-Forwarded-For {remote_host}
    header_up X-Forwarded-Proto {scheme}
  }
}
```

Note `preload` directive on HSTS. Once the site is stable, submit to [hstspreload.org](https://hstspreload.org/) so browsers refuse HTTP from the very first visit. **Do not add `preload` to Tier 2** — it's hard to reverse, and the review tier is short-term traffic.

### 3.4 Tier 3 env

Same as §2.5 with these flips:

```bash
NEXT_PUBLIC_NOINDEX=                              # unset, NOT "false" (let robots.ts fall through to default)
NEXT_PUBLIC_SITE_URL=https://zhicwood.com
PAYLOAD_PUBLIC_SERVER_URL=https://zhicwood.com
SERVER_URL=https://zhicwood.com
DATABASE_URL=postgres://zhic_prod:<pw>@127.0.0.1:5432/zhic_prod
PAYLOAD_SECRET=<32-byte hex, FRESH — never reused from review or workspace>
S3_PREFIX=prod/
S3_PUBLIC_URL=https://<abr-arvan-cdn-or-bucket-public-url>/prod/
SMS_IR_API_KEY=<real key>
SMS_IR_LINE_NUMBER=<real line>
SMS_DRY_RUN=                                      # unset — production sends real SMS
```

### 3.5 Tier 3 backups

Same pattern as Tier 2, but **twice daily** (every 12h) and longer retention:

```cron
0 3,15 * * * /home/ahmad/zhic/ops/backup.sh prod >> /var/log/zhic-backup.log 2>&1
```

Retention: 30 days local, 365 days S3.

---

## 4. Item B — Abr Arvan S3 + media pipeline

### 4.1 Bucket layout

**Single bucket, prefixed by tier.** Simpler IAM than three buckets, and it makes promotions ("copy review/ to prod/") tractable.

```
zhic-media/
├── review/
│   ├── products/
│   ├── designs/
│   ├── showrooms/
│   ├── articles/
│   └── home/
└── prod/
    ├── products/
    ├── designs/
    ├── showrooms/
    ├── articles/
    └── home/

zhic-backups/   (separate bucket — different access pattern, longer retention)
├── review/
└── prod/
```

### 4.2 Bucket permissions

- `zhic-media` — public read (`GetObject`), authenticated write
- `zhic-backups` — fully private, authenticated read + write

CORS on `zhic-media` (allow Next.js Image proxy + Payload admin to load):

```json
[{
  "AllowedOrigins": [
    "https://zhic.ir",
    "https://zhicwood.com",
    "https://zhicwood.co",
    "http://80.240.31.146:3001"
  ],
  "AllowedMethods": ["GET", "HEAD"],
  "AllowedHeaders": ["*"],
  "MaxAgeSeconds": 3600
}]
```

### 4.3 IAM — three keypairs

| Tier | Keypair | Permissions |
|---|---|---|
| Workspace | `zhic-workspace-rw` | RW on `zhic-media/*` (no prefix restriction — workspace tests against all) |
| Review | `zhic-review-rw` | RW on `zhic-media/review/*` only; RW on `zhic-backups/review/*` |
| Prod | `zhic-prod-rw` | RW on `zhic-media/prod/*` only; RW on `zhic-backups/prod/*` |

If Abr Arvan IAM doesn't support per-prefix policies, fall back to one bucket per tier (3 buckets total). Verify capability at signup.

### 4.4 Payload S3 plugin wiring

`services/api/src/payload.config.ts` — extend `Media` collection upload config (the plugin is likely already imported per state.md but env-driven):

```ts
import { s3Storage } from '@payloadcms/storage-s3'

// in plugins:
s3Storage({
  collections: {
    media: {
      prefix: process.env.S3_PREFIX, // "review/" or "prod/" or "" on workspace
    },
  },
  bucket: process.env.S3_BUCKET!,
  config: {
    endpoint: process.env.S3_ENDPOINT,
    region: 'ir-central-1', // Abr Arvan
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true, // typical for non-AWS S3
  },
})
```

Verify exact import path against current `@payloadcms/storage-s3` version in package.json before implementation.

### 4.5 Next.js `remotePatterns`

`apps/web/next.config.ts` — add:

```ts
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '<abr-arvan-bucket-host>',
      pathname: '/zhic-media/**',
    },
    // If using Abr Arvan CDN front:
    {
      protocol: 'https',
      hostname: '<abr-arvan-cdn-host>',
      pathname: '/**',
    },
  ],
},
```

This unblocks FU-2.3-g (Next/Image migration) and FU-3.1-l (home block images).

### 4.6 Migration of existing local media

Workspace has been operating on local-disk uploads. To populate review/prod with seed media:

1. Operator uploads target images via Payload admin on workspace → land at `s3://zhic-media/{empty-prefix}/...` (workspace has no prefix).
2. **Manual copy** to `s3://zhic-media/review/...` via `aws s3 sync` (or `rclone`).
3. Update Payload media DB rows on review tier to point at the `review/` prefix (one-shot SQL UPDATE on `media.url` column, scripted in `ops/migrate-media.sh`).

Alternative: re-upload everything via review tier's own admin UI. Cleaner but more manual work for the operator. Pick at execution time.

---

## 5. Cost estimate (rough, monthly)

| Line item | Estimate (rial) | Notes |
|---|---|---|
| Tier 2 VPS (Net Afraz, 4×8×80) | 700K | Confirm at purchase |
| Tier 3 VPS (Net Afraz, 4×8×80) | 700K | Same plan as Tier 2 |
| Abr Arvan DNS (3 zones) | 50K | Often included free with hosting |
| Abr Arvan S3 (≤50 GB media + backups) | 200K | Pay-per-use; rises with catalog growth |
| Abr Arvan CDN (optional) | 150K | Only if §4.5 uses CDN front |
| Domains (zhic.ir, zhicwood.com, zhicwood.co — annual / 12) | ~50K | One-time peaks at renewal |
| **Total monthly** | **~1.85M rial** | Workspace stays at current ~Pars Pack cost on top |

These are guesses; confirm with actual Net Afraz / Abr Arvan quotes at signup. The ratio of `zhic.ir` traffic to `zhicwood.com` traffic in Pkg 1 will be tiny — almost no review-tier load — so the Tier 2 plan can be scaled down to 2×4×40 if budget pressure exists. Tier 3 stays at 4×8×80 minimum.

---

## 6. Provisioning checklist (operator, before I touch anything)

Order matters: domain registration → DNS → VPS → S3.

- [ ] **Domains**
  - [ ] Register/confirm `zhic.ir` (likely already owned)
  - [ ] Register `zhicwood.com`
  - [ ] Register `zhicwood.co`
  - [ ] Confirm registrar transfer-lock is on for all three
- [ ] **Net Afraz**
  - [ ] Create account, complete identity verification
  - [ ] Buy Tier 2 VPS — note IPv4
  - [ ] Buy Tier 3 VPS — note IPv4
  - [ ] Add operator's SSH public key to both at provision time
- [ ] **Abr Arvan**
  - [ ] Create account
  - [ ] DNS: add zone for `zhic.ir`, point nameservers from registrar to Abr Arvan
  - [ ] DNS: add zone for `zhicwood.com`, point nameservers
  - [ ] DNS: add zone for `zhicwood.co`, point nameservers
  - [ ] S3: create `zhic-media` bucket (public-read), `zhic-backups` bucket (private)
  - [ ] S3: confirm per-prefix IAM is supported; if not, switch to 3 buckets per §4.3
  - [ ] S3: create three keypairs (workspace / review / prod)
  - [ ] CDN: decide whether to front S3 with CDN (yes if available)
- [ ] **Hand to operator (me)**
  - [ ] Tier 2 VPS: IP, root SSH, Net Afraz panel link
  - [ ] Tier 3 VPS: IP, root SSH, Net Afraz panel link
  - [ ] Abr Arvan: API token (or admin login for one-time DNS work)
  - [ ] S3 keypairs + endpoint URL + bucket public URL pattern
  - [ ] PAYLOAD_SECRET for each tier (32-byte hex; generate via `openssl rand -hex 32` and store in your password manager — once set on a tier, NEVER change without DB migration)

After this list is fully checked, the implementation plan (next document, written via `superpowers:writing-plans`) becomes runnable.

---

## 7. Implementation order (after provisioning)

Each step has a verification gate. Don't proceed until the previous gate passes.

1. **Tier 2 VPS bringup** (§2.6 provision script on the new box)
   - **Gate:** SSH works, UFW correct, Docker up, Postgres up, Caddy responds with 502 on `https://<IP>` (no app yet)
2. **DNS for zhic.ir + www.zhic.ir → Tier 2 IP**
   - **Gate:** `dig zhic.ir +short` returns Tier 2 IP. Wait for TTL propagation.
3. **Caddy + Let's Encrypt cert issuance**
   - **Gate:** `curl -I https://zhic.ir/` returns 502 (app not deployed) over valid TLS, no cert warning
4. **Code changes for noindex env-gating** (§2.4 layers 1+2)
   - On `staging` branch, then push
   - **Gate:** `pnpm typecheck` clean, `pnpm test` clean, on workspace `NEXT_PUBLIC_NOINDEX=true pnpm dev` shows `<meta name="robots" content="noindex,...">` in HTML
5. **Tier 2 app deploy** (clone, build, migrate, pm2 start)
   - **Gate:** `https://zhic.ir/` returns 200 with full Persian home page; `curl -sI` shows `X-Robots-Tag` header; `curl -s ... | grep robots` shows the meta; `curl -s zhic.ir/robots.txt` shows `Disallow: /`
6. **Abr Arvan S3 wiring on Tier 2** (§4.4)
   - Update env, restart pm2
   - Upload one image via Payload admin → confirm it lands at `s3://zhic-media/review/...` and renders on the page
   - **Gate:** at least one product detail page shows a real image, not the cream placeholder
7. **Backups for Tier 2** (§2.7)
   - **Gate:** `ops/backup.sh review` runs manually, produces a dump file, uploads to S3, file appears in Abr Arvan S3 console
8. **— OWNER REVIEW HAPPENS HERE —**
9. **Tier 3 VPS bringup** (mirror of step 1)
10. **DNS for zhicwood.com + .co → Tier 3 IP**
11. **Caddy + LE for prod (4 domains)**
12. **Tier 3 app deploy with prod env**
13. **Verify .co → .com 301 chain**
14. **Tier 3 backups**
15. **Submit zhicwood.com to Google Search Console + sitemap** (only after launch is intentional)

The first 8 steps unblock the contract-exit review on Pkg 1. Steps 9-15 are post-Pkg-1 work; they don't have to happen in this same session.

---

## 8. Verification gates — concrete commands

For each tier, post-deploy smoke:

```bash
# DNS
dig +short zhic.ir
dig +short www.zhic.ir
# Both must return the Tier 2 VPS IP.

# TLS chain
curl -I https://zhic.ir/ 2>&1 | head -10
# Must show valid LE cert, HTTP 200 (or 502 if app not yet deployed).

# Three-layer noindex (Tier 2 only)
curl -sI https://zhic.ir/ | grep -i x-robots-tag
curl -s https://zhic.ir/ | grep -E '<meta\s+name="robots"'
curl -s https://zhic.ir/robots.txt | head -5

# App health
curl -sI https://zhic.ir/ | grep -E "HTTP/|content-type"
curl -s https://zhic.ir/admin | head -5    # Should redirect to /admin/login or render

# 4 critical pages
for p in / /products /journal /showrooms /contact; do
  echo -n "$p: "
  curl -s -o /dev/null -w "%{http_code}\n" https://zhic.ir$p
done
# All 200.

# Image pipeline (Tier 2 only — only after step 6)
curl -sI <known-product-image-URL-on-Abr-Arvan>
# Must be 200 with image/* content-type. Run after uploading one real product image.
```

For Tier 3, repeat with `zhicwood.com` and verify the 301 chain:

```bash
for d in www.zhicwood.com zhicwood.co www.zhicwood.co; do
  echo -n "$d → "
  curl -sI https://$d/ | grep -i location
done
# All three must Location: https://zhicwood.com/...

curl -sI https://zhicwood.com/ | grep -i x-robots-tag
# MUST RETURN NOTHING — production is indexed.
```

---

## 9. Out of scope (deferred to follow-up specs)

| Item | Why deferred | Where it lives |
|---|---|---|
| Gitea + Actions auto-deploy (Item C) | Needs `git.zhicwood.com` DNS decision + self-hosted runner config + GHA secrets pattern. Spec separately once Tier 3 DNS is up | New spec, post-§7 |
| Production build automation (Item D) | The `ops/deploy-tier.sh` script in §2.6 covers manual deploy; full CI build matrix is post-Gitea | Same spec as Item C |
| Self-hosted Plausible analytics | Locked-stack decision (CLAUDE.md). Lives on its own subdomain, likely workspace-VPS-as-ops-host | New spec, post-launch |
| Error tracking | No vendor decided (Sentry blocked from Iran per CLAUDE.md). Could be self-hosted Sentry or Glitchtip — research first | New spec |
| Email service for inquiries (cc team) | Currently SMS-only. Tag for Pkg 3 CRM | FU-5.1-b in state.md |
| Postgres replication | Two-VPS topology has no replication; pg_dump backups are the recovery story for Pkg 1. Replication when traffic warrants | Pkg 3+ |
| Production-grade observability (logs, metrics, traces) | Pm2 logs + journalctl + cron emails are enough for Pkg 1 | Post-launch |

---

## 10. Open questions / new follow-ups

| Id | Question | Blocking? |
|---|---|---|
| OQ-A | Net Afraz CAA + per-prefix S3 IAM support — confirm at signup | Per-prefix is nice-to-have; CAA is hardening only. Both fall back gracefully (one-bucket-per-tier; skip CAA). |
| OQ-B | Abr Arvan CDN in front of S3 — exists? what's the URL pattern? | Affects §4.5 `remotePatterns`. If no CDN, S3 endpoint is the public URL. |
| OQ-C | Where does Gitea live? Workspace VPS, or its own micro-VPS, or Tier-3 prod box? | Blocks Item C, not this spec. Note: keeping it on workspace means `git.zhicwood.com` DNS points to workspace's public IP — which conflicts with §1's "no DNS at workspace." Will need a fourth tier or a re-think. |
| OQ-D | Domain canonical: confirmed `.com` is canonical, `.co` 301s in. If owner expectation differs, reverse §3.3. | Cosmetic, easy to flip. |
| OQ-E | Does the SEO specialist want `Disallow: /` AND `X-Robots-Tag` AND `<meta robots>`, or do any of the three suffice? Worth a quick confirmation before shipping. | Default to all three. The cost of belt-and-suspenders is zero; the cost of premature indexing is real. |
| FU-7.1-d (new) | Add `SMS_DRY_RUN` env gate to `packages/sms` — review tier must not text real showroom managers. Trivial change — early-return in `sendSms()` after logging the would-have-sent payload. | Add to state.md follow-up table. |
| FU-7.1-e (new) | Once Tier 2 has Caddy + TLS, retest whether the three pnpm patches under `patches/` are still needed. Per FU-7.1-b, the Sec-Fetch-Site and style-injection patches were workarounds for a transparent proxy that doesn't exist past Caddy. | Add to state.md. |

---

## 11. Sequencing guarantee

This spec assumes all work happens in this order:

1. User completes §6 provisioning checklist (afternoon of vendor signups)
2. Operator (me) writes the implementation plan via `superpowers:writing-plans` against this spec
3. Operator executes the plan, gated by the §8 verification commands at every step
4. After step 8 of §7, owners review the site at `https://zhic.ir`
5. After owner sign-off, steps 9-15 run to bring up `zhicwood.com`/`.co`

If the user wants to compress step 4-5 into a single execution session, that's fine — but each tier's verification gates still hold. No skipping.

---

**End of spec.**
