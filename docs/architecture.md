# Architecture

This document describes the shape of the Zhic platform: how the monorepo
is organized, which apps exist, what they run on, how they share code
and data, how auth and sessions work across them, and how they deploy.

It is the technical counterpart to `README.md` (scope, principles) and
`roadmap.md` (sequencing). Where this doc disagrees with either of those,
this doc is wrong and should be updated — the scope and the sequencing
are the upstream decisions.

Nothing here describes code that exists yet. Today the repo is a single
Next.js 16 app at the root (`src/app/page.tsx` and friends). The target
state below is what Phase 1 stands up and every later phase extends. The
existing mockup becomes `apps/web` during the Phase 1 monorepo split; no
code is thrown away.

---

## 1. Shape at a glance

```
zhic/
├── apps/
│   ├── web/            # Public storefront — Persian-first, RTL, SEO-tuned
│   ├── crm/            # Sales + showroom operations (Phase 4)
│   ├── erp/            # Inventory, finance, procurement, HR-lite (Phase 5)
│   ├── mes/            # Factory floor, work orders, production (Phase 6)
│   └── factor/         # Standalone invoice (فاکتور) viewer / printer (Phase 3+)
│
├── services/
│   ├── api/            # Payload 3 + REST + built-in admin UI (Phase 1–4)
│   └── factory-api/    # Hono/Fastify + Drizzle for MES (Phase 6)
│
├── packages/
│   ├── design-system/  # Tokens, theme, Tailwind preset, RTL-aware
│   ├── ui/             # Shared components (buttons, inputs, tables, modals)
│   ├── db/             # Postgres schema, migrations, shared client
│   ├── auth/           # Session, cookies, phone+OTP helpers, role checks
│   ├── api-client/     # Typed client every app uses to talk to services/api
│   ├── locale/         # Jalali dates, Persian digits, number/currency format
│   ├── money/          # rial ↔ toman conversion, formatters, rounding rules
│   ├── sms/            # Provider-agnostic wrapper (Kavenegar first)
│   ├── payments/       # Provider-agnostic wrapper (ZarinPal / IDPay / Zibal)
│   ├── invoices/       # Factor number generation, PDF/HTML templates
│   ├── types/          # Shared domain types (re-exported by api-client)
│   └── config/         # Shared tsconfig, eslint, prettier, tailwind presets
│
├── docs/               # This folder
├── turbo.json
├── pnpm-workspace.yaml
└── package.json        # Workspace root
```

Every `apps/*` and `services/*` directory is an independently deployable
Node process. Every `packages/*` directory is a workspace package consumed
via the workspace protocol (`"zhic/ui": "workspace:*"`). There is no
publishing step: packages are linked, not installed from a registry.

```
                                           ┌────────────────────────┐
zhic.ir           ──────── web ─────────▶  │                        │
admin.zhic.ir     ─ Payload admin UI ───▶  │                        │
api.zhic.ir       ───── services/api ───▶  │    one Postgres        │
crm.zhic.ir       ──────── crm ─────────▶  │    (public, commerce,  │
erp.zhic.ir       ──────── erp ─────────▶  │     crm, erp, mes      │
mes.zhic.ir       ──────── mes ─────────▶  │     schemas)           │
factor.zhic.ir    ──── factor (later) ──▶  │                        │
                                           └────────────────────────┘
```

All subdomains terminate at a single Caddy (preferred) or Nginx reverse
proxy on a Hetzner VPS. Caddy routes each subdomain to the Node process
listening on its own localhost port. Postgres runs on the same host until
traffic or isolation concerns justify moving it off.

---

## 2. Monorepo mechanics

### Package manager & orchestrator

- **pnpm workspaces** are the only dependency graph. `pnpm-workspace.yaml`
  lists `apps/*`, `services/*`, and `packages/*`. Every dependency between
  workspace packages uses `"workspace:*"`. `npm` and `yarn` are not used.
- **Turborepo** runs tasks (`build`, `dev`, `lint`, `typecheck`, `test`)
  across the graph with caching. `turbo.json` declares each task's inputs
  and outputs so only what changed is rebuilt. Turborepo is a local build
  orchestrator; it is **not** tied to Vercel and works fine on the
  self-hosted VPS and in GitHub Actions.
- **Node version** is pinned via `.nvmrc` and `engines.node`. CI and the
  VPS both use the same version. Upgrades are their own PR.

### Shared config

Every app and service extends the same base configs from `packages/config`:

- `tsconfig.base.json` — strict, ESM, moduleResolution `bundler`, path
  aliases left to each consumer.
- `eslint.config.mjs` — flat config, one rule set across the whole repo.
- `tailwind-preset.js` — consumed by `apps/*` that use Tailwind. The
  tokens themselves live in `packages/design-system` and are imported by
  the preset.
- `prettier.config.cjs` — unified formatting.

Consumers never re-declare rules that exist in `packages/config`; they
only extend.

### The workspace root is thin

The root `package.json` holds:

- pnpm + turborepo + typescript + eslint + prettier (dev only).
- Turborepo scripts (`pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm test`,
  `pnpm typecheck`) that fan out to every workspace package.
- No application code. No src/ at the root.

When the monorepo split happens in Phase 1, the existing `src/` and
`public/` at the repo root move wholesale into `apps/web/` and the root
is slimmed to the layout above.

---

## 3. Apps

Each app is a Next.js 16 App Router project, owns its own `package.json`,
and has its own deployment target. Apps never import each other. Cross-
app communication goes through `services/api` via `packages/api-client`.

### `apps/web` — Public storefront

- **Audience:** first-time and returning customers, mostly Iranian,
  mostly mobile, Persian as default.
- **What it shows:** homepage, catalog, product detail with GIFs and
  WebXR 3D, journal, showrooms, about, contact, legal, account area.
- **What it does not do:** business logic. It reads through
  `api-client` and writes through authenticated mutations guarded by
  `packages/auth`. It does not talk to Postgres directly.
- **Performance posture:** the most aggressive in the repo. Bundle
  size, LCP, INP, and CLS are budgeted in CI. It ships no CRM / ERP
  / MES code, ever. This is the whole reason the apps are split.
- **Rendering:** server components by default, `"use client"` only
  for motion, form interactivity, and the 3D viewer.
- **SEO:** `generateMetadata` on every route, JSON-LD via
  `app/layout.tsx` and per-route helpers, `sitemap.ts`, `robots.ts`,
  `manifest.ts`, per-showroom `LocalBusiness` schema.
- **Analytics:** self-hosted Plausible behind a consent banner.
- **Current state:** the existing root `src/` is the placeholder
  for this app.

### `apps/crm` — Sales + showroom operations (Phase 4)

- **Audience:** showroom managers, showroom sales staff, HQ sales.
- **What it shows:** customer 360°, leads pipeline, follow-ups,
  appointments, per-showroom dashboards, floor stock, delivery
  schedule, KPIs, manager reports.
- **Design language:** functional, high-density, tablet-friendly. Not
  atelier-luxury. Uses `packages/ui` components tuned for operator work.
- **Scope comes from Discovery.** Nothing in this app is built until
  `discovery.md` is filled in. See `roadmap.md` Phase 0.5.
- **Whether a separate `apps/showroom` app is spun out from `apps/crm`**
  is a decision held open until Discovery tells us whether HQ sales and
  showroom managers need different apps or just different roles in one.

### `apps/erp` — Inventory, finance, procurement, HR-lite (Phase 5)

- **Audience:** accountants, purchasing, HR admin, HQ ops.
- **What it shows:** inventory ledger with valuation and transfers,
  purchasing with supplier records and POs, chart of accounts, journal
  entries, trial balance, VAT reporting, staff records, payroll export.
- **Design language:** dense tables, keyboard-first, printable reports.
- **Scope** is researched with the business's actual accountant before
  any collections are defined. Iran-specific fiscal rules and the
  existing accounting software exports drive the chart of accounts.

### `apps/mes` — Factory floor (Phase 6)

- **Audience:** production planners, floor supervisors, line workers.
- **What it shows:** work orders, BOMs, routings, production
  scheduling, QC gates, kiosks for scanning and status updates.
- **Runtime posture:** possibly partly offline-capable; touch-first;
  barcode / QR-aware. Styled with the operator vocabulary, not the
  storefront vocabulary.
- **Backed by `services/factory-api`, not `services/api`.** Payload
  does not touch the `mes` schema. See §5.

### `apps/factor` — Standalone invoice (فاکتور) viewer / printer

- **Audience:** finance, auditors, customers who only need the invoice,
  external parties who should not have an account in the rest of the
  platform.
- **What it shows:** one thing — a factor. Fast, printable, phone-safe,
  minimal chrome. Deep-linkable via signed URL.
- **Phasing:** Phase 3 ships the minimum (a print-ready route reachable
  from `apps/web` and the admin). Phase 6 matures it into its own
  subdomain with signed access tokens for external recipients.

### The "admin app" question

There is no `apps/admin` in the initial layout. The reason:

- Payload 3 ships with a capable built-in admin UI. For Phase 1–4 that
  UI is the admin, served from `services/api` and exposed publicly at
  `admin.zhic.ir` via a reverse-proxy rewrite (Caddy maps the subdomain
  to the `/admin` path on `services/api`'s internal port).
- Spinning up a parallel `apps/admin` before we know what Payload's
  admin can't handle would be premature. The only custom admin screens
  we expect to need (bulk order ops, showroom-scoped dashboards,
  specialized reports) can be built as Payload custom views first, and
  only graduate to their own app if that becomes painful.
- This decision is **held open** in `README.md` under "What is
  deliberately not decided yet," explicitly because Discovery may
  change the answer. If showroom managers need an app that looks
  nothing like Payload's admin, it becomes `apps/crm` or `apps/showroom`
  from day one — not a custom Payload view.

---

## 4. Packages

Each package has one owner problem. If a package grows past one problem,
it is split. Packages never import apps; apps import packages.

| Package | Problem it owns | Notes |
| --- | --- | --- |
| `design-system` | Design tokens, Tailwind preset, typography stack, color system, spacing scale, motion language, RTL rules. | Consumed by every app's Tailwind config. Tokens are the source of truth; components build on top. |
| `ui` | Reusable React components that wrap design tokens into real elements: buttons, inputs, tables, modals, toasts, dialogs, navs. | Never hard-codes a color or spacing — everything goes through `design-system` tokens. |
| `db` | The Postgres schema (collections + migrations), a shared Postgres client, seed scripts. | In Phase 1–4 the schema is *declared* via Payload collections in `services/api`; `db` holds generated types and low-level helpers. In Phase 5+ when `services/factory-api` ships, `db` also declares the `mes` schema via Drizzle. |
| `auth` | Sessions, cookies, phone+OTP helpers, role checks, domain-scoped cookie helpers so login works across subdomains. | Session cookie is scoped to `.zhic.ir` (parent domain) so `web`, `crm`, `erp`, `mes` all share it. |
| `api-client` | A typed client that every app imports to read/write through `services/api`. | Generated from Payload collection types. No app talks to Payload over raw `fetch`. |
| `locale` | Jalali ↔ Gregorian conversion, Persian digit rendering, Persian-aware number formatting, pluralization, RTL helpers, date-fns-jalali wrappers. | The only place the platform knows about Jalali. Every display date goes through it. |
| `money` | Rial ↔ toman conversion, formatters, rounding rules, Persian-digit rendering for prices. | Every price in every app goes through it. No raw multiplications by 10 anywhere else. |
| `sms` | Provider-agnostic SMS sender. Kavenegar is the first adapter; MelliPayamak / Ghasedak / others can be added without touching call sites. | Enforces rate limits, templated messages, delivery logging. |
| `payments` | Provider-agnostic payment gateway wrapper. ZarinPal / IDPay / Zibal are the candidate adapters. One is chosen in Phase 3. | Exposes the same interface regardless of provider: `createPayment`, `verifyPayment`, `refund`. |
| `invoices` | Factor number generation (using the client-provided format), HTML and PDF templates, tax-field handling, national ID capture, signed shareable URLs for `apps/factor`. | The `siteSettings.invoiceNumberFormat` field is the single source of truth for numbering. |
| `types` | Shared TypeScript types across the repo. | Mostly re-exports from `api-client` and `db` so there is one import path. |
| `config` | Shared tsconfig, eslint, prettier, tailwind preset. | Not domain code. Pure tooling. |

### Invariants

- **No money logic outside `packages/money`.** Ever. If you see a `* 10`
  or `/ 10` anywhere else, that is a bug.
- **No SMS outside `packages/sms`.** Ever.
- **No payment logic outside `packages/payments`.** Ever.
- **No Jalali / Persian-digit logic outside `packages/locale`.** Ever.
- **No direct Postgres access from apps.** Apps talk to `services/api`
  via `packages/api-client`, or (Phase 6+) to `services/factory-api` via
  a similar typed client. The only code that imports the raw Postgres
  client is `services/api`, `services/factory-api`, and `packages/db`'s
  migration runner.

These rules exist to keep the platform coherent as it grows. Every rule
has a failure mode behind it: the last one, for example, prevents an
app from silently writing past a Payload access-control hook and
corrupting audit trails.

---

## 5. Services

### `services/api` — Payload 3

- **Runtime:** Next.js 16 (because that's how Payload 3 ships). Owns
  its own port on the VPS. Exposed publicly at `api.zhic.ir`.
- **Admin UI:** Payload's built-in admin at `api.zhic.ir/admin`, also
  reachable at `admin.zhic.ir` via a reverse-proxy rewrite.
- **Database:** Postgres, adapter `@payloadcms/db-postgres`. Owns the
  `public`, `commerce`, and `crm` schemas in Phase 1–4. Shares read
  access with `erp` and `mes` once those schemas exist.
- **Collections:** content (pages, journal, media), catalog (products,
  categories, variants), commerce (customers, carts, orders, line items,
  payments, invoices, stock locations, stock levels, transfers, returns,
  deliveries), showrooms, leads, site settings. Full list lands in the
  upcoming `data-schemas.md` rewrite.
- **How other apps talk to it:** via `packages/api-client`, which is
  typed from Payload's generated types. Every request carries the shared
  session cookie (via `packages/auth`) and Payload's access control
  decides what that session can see.
- **Local API usage:** anything running inside `services/api` (hooks,
  cron jobs, custom endpoints) uses Payload's Local API, not HTTP. This
  is faster and doesn't need auth plumbing.

### `services/factory-api` — Hono/Fastify + Drizzle (Phase 6)

- **Why a second service?** Payload's collection model is excellent for
  content and catalog, but real MES needs production scheduling, BOM
  explosions, routings with alternate operations, and financial
  invariants that are painful to express as Payload hooks. A dedicated
  service keeps that complexity out of Payload.
- **Shape:** Hono (preferred) or Fastify on Node, Drizzle ORM against
  the `mes` schema on the same Postgres instance.
- **Boundary with `services/api`:** an event contract, not a shared
  ORM. When a work order completes in `services/factory-api`, it emits
  an event that `services/api` consumes to update `commerce` stock.
  The two services never share an in-process import.
- **Not built before it is needed.** Phase 6. Until then the `mes`
  schema does not exist and this service does not exist.

---

## 6. Data model

### One Postgres, many schemas

- **One Postgres instance**, one connection pool per service, one backup,
  one migration story. Managed Postgres providers (Neon, Supabase) are
  unreliable from Iran and are off the table; the database runs on the
  VPS.
- **Multiple schemas** inside that database:
  - `public` — auth, users, audit log, site settings, anything cross-
    cutting.
  - `commerce` — products, customers, carts, orders, payments, invoices,
    stock, deliveries, returns.
  - `crm` — leads, follow-ups, appointments, pipeline, notes.
  - `erp` — suppliers, purchase orders, chart of accounts, journal
    entries, HR records.
  - `mes` — work orders, BOMs, routings, production schedule, QC.
- **Cross-schema foreign keys are allowed.** Postgres handles them
  natively. Example: `crm.leads.customerId` references
  `commerce.customers.id`. This is how we get "separate databases for
  organizational sanity" without actually running multiple databases.
- **Who writes each schema:**
  - `services/api` writes `public`, `commerce`, `crm` (and in Phase 5
    assists with `erp` unless ERP is carved out).
  - `services/factory-api` writes `mes` (Phase 6).
  - No other process writes to any schema directly. Apps read via
    `api-client`, not by touching tables.

### Money, identity, dates

- **Money** is stored in rials as integer minor units, displayed in
  toman via `packages/money`. The `money` package is the only code in
  the repo that knows the rial/toman ratio.
- **Customers** are keyed by phone number (the natural unique ID in
  Iran). National ID is optional but captured when the customer requests
  a tax-compliant invoice.
- **Dates** are stored as UTC timestamps. Display is Jalali via
  `packages/locale`. Storage never sees a Jalali string.

### Audit & reversibility

- Every destructive operation is a soft delete with a recovery window
  (tracked as `deletedAt` + a nightly purge job).
- Price changes write to `priceHistory` and to the global `auditLog`.
- Slug changes auto-create redirects (handled by a Payload hook on the
  relevant collections).
- Invoices, once issued with a factor number, are immutable. Corrections
  are issued as adjustment invoices, not edits.

### Schemas are the source of truth

Everything else in the repo — types, api-client, UI forms, reports —
derives from the Postgres schema via Payload's generated types and
Drizzle's inferred types. If a field doesn't exist in the schema, it
cannot exist anywhere else. `data-schemas.md` is the human-readable
mirror of what's in the database.

---

## 7. Auth model

### Single identity, cross-app sessions

- **One user table in `public.users`**, owned by `services/api`, used by
  every app. Roles are enum fields on the user: `admin`, `editor`,
  `marketing`, `sales`, `showroom_manager`, `showroom_staff`,
  `accountant`, `factory_supervisor`, `factory_worker`, `customer`.
- **Phone + OTP login.** Users receive a one-time code via
  `packages/sms` and exchange it for a session. Passwords are not the
  primary flow; they exist for admin bootstrap only.
- **Session cookies** are issued by `packages/auth` and scoped to the
  parent domain (`Domain=.zhic.ir; Secure; HttpOnly; SameSite=Lax`).
  This lets a single login work across `web`, `crm`, `erp`, `mes`,
  `admin`, and `factor` without re-auth per subdomain.
- **Role gating** happens in two places:
  - **Payload access control** on every collection, every operation.
    This is the ultimate source of truth.
  - **App-level guards** using `packages/auth` for UI affordances
    (hiding menu items a role can't use). These are a UX layer, not a
    security layer — the security layer is always Payload.

### Customers vs. staff

- **Customers** authenticate via phone + OTP, have no admin access,
  and see only their own data. They use `apps/web` (and later,
  `apps/factor` via signed URLs that don't require login).
- **Staff** authenticate the same way but their role unlocks access to
  operator apps. A staff user is also a `public.users` row; there is
  no parallel user table.

### Cross-service auth (Phase 6+)

When `services/factory-api` comes online, it validates sessions by
calling `services/api`'s auth endpoint (or by reading the shared
session store, if we move sessions to Redis by then). It does not
re-implement auth. There is exactly one auth implementation in the
whole platform — `packages/auth` — and exactly one owner of the
session store — `services/api`.

---

## 8. Data flow

```
 apps/web ──────┐
 apps/crm ──────┤                ┌─── Postgres.public
 apps/erp ──────┼── api-client ─▶│    Postgres.commerce
 apps/mes ──────┤      (HTTP)    │    Postgres.crm
 apps/factor ───┘                │    Postgres.erp
                                  └─── Postgres.mes (Phase 6+)
                      ▲
                      │
                services/api (Payload)
                      │
                      ▼
                services/factory-api  ──── Postgres.mes (Phase 6+)
```

### Rules

1. Apps never import `packages/db` directly. They import
   `packages/api-client`.
2. `packages/api-client` is code-generated against `services/api`'s
   Payload types. A schema change triggers a regen in CI.
3. `services/api` is the only service that imports `packages/db` for
   Payload's Postgres adapter configuration.
4. In Phase 6+, `services/factory-api` imports `packages/db` for its
   own Drizzle connection. It does not import anything from Payload.
5. Cross-service communication (Payload ↔ factory-api) uses a documented
   event contract, not shared database transactions.

### Why HTTP between apps and Payload even though they're on the same VPS

- Keeps apps unaware of Payload internals, which means apps can later
  point at a different backend without a rewrite.
- Keeps Payload's access-control layer in the request path, which means
  a misconfigured app can't accidentally bypass a hook.
- HTTP over localhost on the same VPS costs ~0.1 ms. The isolation is
  worth it.

---

## 9. Deployment

### Target environment

- **One Hetzner Cloud VPS** (CPX31-class to start: 4 vCPU, 8 GB RAM,
  Germany). Upgraded or split across multiple machines when metrics
  justify it, not before.
- Optional fallback: a domestic Iranian VPS if inside-Iran latency
  benchmarks make Hetzner unworkable. The deployment topology is
  identical — the host just changes.

### Process topology

- Each app and service runs as a **systemd unit** (preferred over Docker
  for simplicity; Docker Compose is the fallback if process isolation
  becomes painful).
- Each unit listens on its own localhost port (e.g. `127.0.0.1:3001`
  for `web`, `3002` for `services/api`, and so on).
- **Caddy** listens on 80/443 and routes subdomains to localhost ports.
  Automatic TLS via Let's Encrypt; ZeroSSL as fallback if Let's Encrypt
  rate limits bite.
- **Postgres** runs as a system service on the same host, data directory
  on a dedicated volume.
- **Plausible** and **Glitchtip** run alongside as their own systemd
  units (or Docker, depending on how painful their native setup is).

### Subdomains

| Subdomain | App / service | Phase |
| --- | --- | --- |
| `zhic.ir` | `apps/web` | 1 |
| `api.zhic.ir` | `services/api` | 1 |
| `admin.zhic.ir` | `services/api` (rewritten to `/admin`) | 1 |
| `crm.zhic.ir` | `apps/crm` | 4 |
| `erp.zhic.ir` | `apps/erp` | 5 |
| `mes.zhic.ir` | `apps/mes` | 6 |
| `factor.zhic.ir` | `apps/factor` | 6 polish |
| `plausible.zhic.ir` | Plausible (internal) | 1 |
| `errors.zhic.ir` | Glitchtip (internal) | 1 |

Path-based routing (`panel.zhic.ir/crm`, etc.) is the fallback model
only if multi-subdomain TLS issuance turns out to be painful from Iran.

### Environments

- **`local`** — each developer runs the apps via `pnpm dev`, with a
  shared local Postgres. `.env.local` files are gitignored; a template
  `.env.example` ships.
- **`staging`** — a second VPS (or a separate set of systemd units on
  the same VPS, bound to `staging.*.zhic.ir`) that mirrors production
  for any change that touches schemas, auth, payments, or SMS.
- **`production`** — the main VPS. Only GitHub Actions deploys here,
  never a developer directly.

### Deploys

- **CI:** GitHub Actions, runners outside Iran (so `pnpm install` and
  `next build` actually work against npm, Google Fonts fallbacks, etc.).
- **Flow:** push → lint → typecheck → test → build → deploy over SSH
  to the VPS. The Action tars the built app directory, `rsync`s it to
  the VPS, swaps the symlink (`/srv/zhic/apps/web → releases/<sha>`),
  and signals systemd to reload the unit. Rollback is `ln -sfn` to the
  previous release.
- **Per-package affected builds:** Turborepo's `affected` semantics
  (via `turbo run build --filter=...[HEAD^1]`) so pushing a change to
  `apps/web` doesn't rebuild `apps/erp`.
- **Zero-downtime:** systemd unit reload + brief Caddy hold. For
  Payload with running migrations, the deploy runs migrations first,
  then cuts over.

### Secrets

- **Source of truth:** `.env.production` files on the VPS, owned by the
  deploy user, 0600, never committed.
- **In CI:** GitHub Actions secrets, injected into the build only for
  values that must exist at build time (public keys, site URL).
  Everything secret at runtime is read from the VPS env, not baked in.
- **Rotation:** documented per-secret. Kavenegar, payment gateway, and
  Payload's secret key all have explicit rotation runbooks.

### Backups

- **Postgres:** `pg_dump` nightly to Hetzner Object Storage (EU,
  encrypted at rest), retained 30 days. Weekly full + daily incremental
  WAL archive via `pgbackrest` once traffic justifies it.
- **Media:** already on Hetzner Object Storage; versioned bucket with
  30-day recovery.
- **Config:** systemd units, Caddyfile, and non-secret env are in a
  separate git repo (`zhic/ops`) and deployed the same way as the apps.
- **Restore drill:** quarterly. If restore takes more than an hour, the
  drill failed and the process gets tightened.

### Observability

- **Error monitoring:** Glitchtip (self-hosted, Sentry-compatible).
  Every app and service sends via `@sentry/*` SDKs pointed at Glitchtip.
- **Analytics:** Plausible (self-hosted) on the storefront only. Operator
  apps are not publicly tracked.
- **Logs:** structured JSON to stdout → systemd journal → optional
  log shipper (Vector) to a self-hosted Loki instance later.
- **Uptime:** external uptime checks from a provider that pings from
  multiple regions including Iran, if any such provider can be found;
  otherwise multiple Hetzner regions.

---

## 10. Local development

### Prerequisites

- Node (version pinned in `.nvmrc`), pnpm, Docker (for local Postgres).
- A running local Postgres via `docker compose -f ops/dev/docker-compose.yml up`,
  which also brings up an ephemeral S3-compatible MinIO for local media.

### Running everything

- `pnpm install` at the root.
- `pnpm dev` launches every app and service concurrently via Turborepo.
  Most developers will want `pnpm --filter apps/web dev` or
  `pnpm --filter services/api dev` to scope to what they're changing.
- `pnpm --filter services/api migrate` runs migrations.
- `pnpm --filter services/api seed` seeds demo content for working on
  `apps/web` without hitting an empty catalog.

### Hot paths across packages

Turborepo watches package outputs and triggers dependent rebuilds, so a
change in `packages/design-system` live-reloads every consuming app
without manual rebuilds.

### Lint / typecheck / test discipline

- `pnpm lint`, `pnpm typecheck`, `pnpm test` all run at the repo root
  and fan out via Turborepo.
- A failing lint, typecheck, or test blocks merge. CI re-runs the same
  commands — there are no CI-only checks and no local-only checks.

---

## 11. CI / CD summary

- **PR checks:** install → lint → typecheck → test → build for
  affected workspaces only, via Turborepo filters.
- **Main branch:** same checks plus structured-data validation for
  `apps/web` (Phase 2+), Lighthouse CI budget enforcement for
  `apps/web` (Phase 1+), and a smoke test against staging.
- **Deploy:** triggered on tag push (`v*` for production,
  `staging-*` for staging). No deploy-on-merge-to-main unless we
  explicitly opt a unit in.
- **Artifact retention:** CI stores built artifacts for 14 days so
  rollback can re-deploy a previous build without rebuilding.

---

## 12. Open architectural questions

These are held open on purpose. They will move into the relevant
section above once decided, usually after Discovery or Phase 0
verification.

- **`apps/admin` vs. Payload-as-admin.** Start with Payload's built-in
  admin at `admin.zhic.ir`. Revisit after Discovery: if showroom
  managers clearly need a non-Payload UX, their app (`apps/crm` or a
  separate `apps/showroom`) is spun up instead of a custom admin.
- **`apps/showroom` as a standalone app.** Or is it just a role inside
  `apps/crm`? Discovery decides. Until then, assume it's a role.
- **Hetzner account creation from Iran.** Verified in Phase 0 before
  architecture is frozen. If it's blocked, we either set up via a
  collaborator and transfer, or switch to a domestic Iranian VPS and
  re-benchmark.
- **TLS issuance for multiple subdomains from the VPS.** Caddy +
  Let's Encrypt is the default. If rate limits or network issues
  from the VPS make this unreliable, ZeroSSL is the fallback.
- **Object storage host.** Hetzner Object Storage (EU) is the default.
  A domestic Iranian S3-compatible store is evaluated in parallel; if
  inside-Iran latency benchmarks show a clear win, media moves
  domestic and Hetzner becomes the offsite backup.
- **Session store.** In-memory (Payload default) for Phase 1. Redis on
  the same VPS once `services/factory-api` ships in Phase 6, because at
  that point two services need to share sessions.
- **Per-package versioning & release tags.** Not needed while every
  package is internal. Revisit only if we ever publish one externally.
- **Whether `services/api` stays a Next.js app or moves to a leaner
  Payload runtime** once Payload supports it. Not urgent; Payload's
  Next.js coupling is fine for Phases 1–4.

---

## 13. How to change this document

- Small clarifications: edit and ship.
- New apps, new services, new packages, new subdomains, changes to
  auth, changes to the data-flow rules, changes to the deploy topology:
  these need a PR that also updates `README.md` (if a locked decision
  changes) and `roadmap.md` (if sequencing changes).
- Anything that contradicts `README.md`'s "Locked platform decisions"
  section needs that section updated first. This doc implements those
  decisions; it does not override them.
