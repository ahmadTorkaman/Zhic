# Zhic — Platform Documentation

This folder is the single source of truth for the Zhic platform: storefront,
admin, CRM, ERP, MES, and the systems that connect them. It is written
before most of the code exists so that the design system, the data model,
the architecture, and the operations plan all stay in lockstep.

Zhic is an Iranian furniture business. It makes, sells, and showrooms
furniture (beds first, wider catalog later). The software scope is
therefore not "a website" — it is the set of systems a furniture company
actually runs on: a Persian-first public storefront, content and catalog
administration, a CRM for sales and showroom ops, an ERP for inventory
and finance, and eventually an MES on the factory floor. All of it in one
monorepo, all of it sharing one data model, all of it deployable as
independent Node processes.

---

## Documents

| File | Purpose |
| --- | --- |
| [`roadmap.md`](./roadmap.md) | Phased delivery plan from today's mockup to the full platform. |
| [`architecture.md`](./architecture.md) | Monorepo layout, apps, packages, services, deployment, auth, data flow. |
| [`discovery.md`](./discovery.md) | Template for reverse-engineering the existing showroom managers app and the existing workflow. |
| [`sitemap.md`](./sitemap.md) | Public URL structure, page templates, information architecture. **Pending Persian-first rewrite.** |
| [`design-system.md`](./design-system.md) | Brand tokens, typography, color, grid, motion, components. **Pending RTL / Persian rewrite.** |
| [`data-schemas.md`](./data-schemas.md) | Every collection, field, relation, validation rule. **Pending e-commerce + Iran-aware rewrite.** |
| [`admin-panels.md`](./admin-panels.md) | Admin UX, screens, roles, workflows. **Pending rewrite after Discovery.** |
| [`seo.md`](./seo.md) | SEO playbook: metadata, structured data, performance, content strategy. **Pending Persian / Iran rewrite.** |
| [`lab.md`](./lab.md) | The `/lab` experimentation surface — purpose, rules, robots policy. |

The files marked **pending** still carry a lot of the earlier "NY luxury
atelier" framing. They are being revised in sequence; see `roadmap.md` for
the order. The three files at the top of the table (`roadmap`,
`architecture`, `discovery`) are the ones that reflect the current scope
and should be read first.

---

## Operating principles

1. **Platform, not website.** We are building multiple cooperating apps
   on shared foundations, not a single website with an admin bolted on.
2. **One data model, many apps.** Storefront, admin, CRM, ERP, MES, and
   the factor (invoice) viewer all read and write the same Postgres via a
   shared schema package. Cross-cutting changes ship as one PR.
3. **Persian-first, RTL from day one.** The primary audience, the
   showroom managers, the accountants, and the factory workers are all
   Iranian. English is not on the roadmap.
4. **Content and data are structured, not freeform.** Editors and
   operators fill fields; templates render. No WYSIWYG free-for-all.
5. **Performance is a feature for the storefront.** Every kilobyte
   shipped to a customer loading the catalog is budgeted. CRM / ERP / MES
   get their own, more permissive budgets because their users are
   authenticated staff, not first-time visitors.
6. **Motion serves meaning.** Animation reveals hierarchy and rewards
   attention. It never blocks interaction or content.
7. **Reversibility first.** Slug changes auto-create redirects. Price
   changes are audited. Publishing is reversible. Destructive operations
   are soft-deletes with a recovery window.
8. **Discovery before build.** An existing showroom managers app is
   already in use. We inventory it, interview its users, and document
   gaps before we write code that replaces it. See `discovery.md`.
9. **Design first, code second.** No component is built before its
   tokens, states, motion, and RTL behavior are defined in
   `design-system.md`.

---

## Current state of the repo

- Next.js 16 (App Router), React 19, Tailwind v4, GSAP + Lenis.
- One static homepage at `src/app/page.tsx` composed of Hero, Video,
  Products, About, Contact sections.
- The content, copy, and visual language are a **mockup** from an earlier
  direction (NY-atelier-flavored, English, latin fonts, lead-gen).
  **None of it is confirmed.** It stays in the tree as a working surface
  for design experiments until `apps/web` replaces it.
- Products are hardcoded in `src/data/products.ts`.
- The only metadata is a single global `title` / `description` in
  `src/app/layout.tsx`.
- No CMS, no admin, no sitemap, no JSON-LD, no product detail pages, no
  blog, no checkout, no auth, no CRM/ERP/MES.

When the monorepo split happens (Phase 1), the current single Next.js
app becomes `apps/web` and everything else is added alongside it. There
is no "big bang" rewrite — the existing code is rehomed, not thrown away.

---

## Locked platform decisions

These are confirmed and drive everything else in this folder.

### Business & audience

- **Iranian business, Iranian operators, primarily Iranian customers.**
  All interfaces ship in Persian first. English is not planned.
- **E-commerce, not just lead-gen.** The storefront supports real orders,
  with customer accounts, a cart, checkout, payment via an Iranian
  gateway (see below), invoice generation, and post-sale follow-up
  through the CRM. "Inquire" flows still exist for high-ticket / made-
  to-order items but are a subset of the storefront, not the whole thing.
- **Showrooms are first-class.** Multiple physical showrooms, each with
  its own manager, staff, stock, and operations. Hamedan is both a
  showroom and a co-located warehouse (modeled as two separate entities
  at the same physical address; see `data-schemas.md`).
- **An existing showroom managers app is in use.** We do not greenfield
  the replacement. Discovery runs before build (`discovery.md`).

### Locale, money, identity

- **Persian-first, RTL, Jalali calendar.** All dates are stored as UTC
  but displayed in Jalali. Persian digits for display, ASCII digits for
  storage.
- **Rial storage, Toman display.** Money is always stored in rials as
  integers. The UI shows Toman (rials ÷ 10) with thousands separators.
  Conversion is centralized in `packages/money`.
- **Customers are keyed by phone number.** Phone number is the natural
  unique identifier in Iran. National ID (کد ملی) is optional on the
  customer record but required on any document that produces a
  tax-compliant invoice.
- **Kavenegar for SMS (tentative).** The `packages/sms` abstraction is
  provider-agnostic so Kavenegar can be swapped for MelliPayamak, Ghasedak,
  or anything else without touching call sites.
- **Payment gateway:** ZarinPal / IDPay / Zibal evaluated in Phase 3.
  Abstracted behind `packages/payments`. Final choice TBD once the legal
  and fee analysis is done.
- **Invoice (فاکتور) numbering format:** TBD by the business. The field
  `siteSettings.invoiceNumberFormat` is reserved but deliberately empty
  until the client provides the convention they already use.

### Architecture

- **Monorepo, multiple Next.js apps, NOT a monolith.** The earlier
  "Payload mounted at /admin in the same Next.js process" decision is
  dead. See `architecture.md` for the replacement.
- **Turborepo + pnpm workspaces.** Turborepo is a build orchestrator,
  not tied to Vercel. Works fine on our self-hosted Hetzner-class VPS.
- **One Postgres, multiple schemas.** `public`, `commerce`, `crm`,
  `erp`, `mes`. Cross-schema foreign keys allowed. One connection pool,
  one backup, one migration story.
- **Payload 3 is the backend for Phases 1–4.** It owns content,
  catalog, media, leads, customers, orders, showrooms, and stock. It
  runs as its own Next.js app (`services/api`) exposing REST / local
  APIs that the other apps consume via `packages/api-client`.
- **Phase 5+ carves out `services/factory-api`** (Hono or Fastify +
  Drizzle on the same Postgres) when MES outgrows Payload's collection
  model. Payload keeps owning content/catalog; the factory service
  owns BOMs, work orders, routings, and production scheduling.
- **Subdomain routing** is the preferred model:
  `zhic.ir`, `admin.zhic.ir`, `crm.zhic.ir`, `erp.zhic.ir`,
  `mes.zhic.ir`, `api.zhic.ir`. Path-based (`panel.zhic.ir/crm`, etc.)
  is the fallback if TLS issuance for multiple subdomains turns out to
  be painful from Iran.

### Editorial & workflow

- **Content still needs editorial sign-off.** Marketing drafts,
  editors review, editors publish. The `marketing` role can never push
  a draft live. This survives the pivot unchanged.
- **Price changes are audited.** Any price edit writes to `priceHistory`
  and the global `auditLog`. Applies to both storefront list price and
  per-showroom invoice overrides (once showroom pricing is modeled).

---

## Stack decisions (Iran-aware)

The team is **based in Iran**, which constrains hosting and SaaS choices
because most US-based providers (Vercel, Netlify, Cloudflare R2, AWS,
Resend, Sentry, sometimes Google Fonts and GA4) restrict access from
Iranian IPs or exclude Iran in their terms of service. The stack is
chosen so that:

- The team can administer every system reliably from inside Iran.
- The customer-facing storefront is reachable without degraded
  experience inside Iran.
- We avoid any vendor whose ToS would put the project at risk of being
  shut off.

Stack:

- **Framework:** Next.js 16 App Router across all customer-facing and
  operator-facing apps. `services/api` also runs as a Next.js app for
  Phases 1–4 because that is how Payload 3 ships. Phase 5+ may add a
  non-Next service (`services/factory-api`) in Hono or Fastify.
- **Styling:** Tailwind v4 with a tokenized, RTL-aware theme layer
  exported from `packages/design-system`.
- **Motion:** GSAP + Lenis on the storefront; Framer Motion for
  component micro-interactions. The operator apps (admin, crm, erp,
  mes) use a reduced motion vocabulary — function over flourish.
- **CMS / backend for Phases 1–4:** Payload 3, running as its own app
  at `services/api` behind `api.zhic.ir`.
- **Database:** PostgreSQL, self-hosted on the same VPS as the apps.
  Managed Postgres providers (Neon, Supabase) are unreliable from Iran
  and are off the table.
- **Media:** S3-compatible object storage. **Hetzner Object Storage**
  (EU) is the primary choice; a domestic Iranian object store is a
  candidate for Phase 1 if latency inside Iran matters more than
  global reach. Cloudflare R2 and AWS S3 are explicitly off the table.
- **3D / WebXR:** glTF/GLB primary, USDZ secondary for iOS Quick Look.
  Rendering via Google's `<model-viewer>` web component. Asset prep in
  **Blender** with a documented export preset; the admin only
  validates uploads.
- **Fonts:** **self-hosted via `next/font/local`**, not
  `next/font/google`. Google Fonts is intermittently blocked from Iran
  (we already hit this in the local `next build`), and self-hosted
  woff2 files are also faster for everyone. Latin and Persian faces
  both self-hosted; see `design-system.md`.
- **Search (later):** Typesense or Meilisearch, self-hosted. Out of
  scope until Phase 5.
- **Analytics:** **Plausible, self-hosted**. No GA4 — unreliable from
  Iran, adds GDPR overhead, provides no upside for a privacy-
  respecting Iranian brand. Search Console for indexation data only.
- **Email / forms:** Transactional via a provider that accepts Iranian
  signups (Mailgun EU if Postmark refuses; final choice verified in
  Phase 1). Newsletter delivery via self-hosted Listmonk.
- **SMS:** Kavenegar via `packages/sms` (provider-agnostic wrapper).
- **Payments:** ZarinPal / IDPay / Zibal behind `packages/payments`
  (provider-agnostic wrapper). Final choice in Phase 3.
- **Error monitoring:** **Glitchtip** (self-hosted, Sentry-compatible).
- **Hosting:** **Hetzner Cloud (Germany)** as the default, with a
  domestic Iranian VPS as a candidate if inside-Iran latency becomes a
  problem. A single CPX31-class machine runs every app, Postgres,
  Plausible, and Glitchtip side by side via Docker Compose or systemd.
  We split services to multiple VPSes once traffic justifies it.
- **Reverse proxy:** Caddy (preferred, automatic TLS) or Nginx,
  routing subdomains to each app's Node process.
- **CDN (optional, Phase 4):** Bunny CDN (EU-based, Iran-friendly) in
  front of the Hetzner origin for static assets and image delivery.
- **CI / CD:** GitHub Actions runs from outside Iran so npm installs
  and builds work. Deployment to the VPS via SSH from the Action runner.
- **Domain & DNS:** registrar that accepts Iranian customers (e.g.
  Gandi, Hetzner DNS). `.ir` and `.com` both registered; primary TBD.

Open verification items before Phase 1 starts:

- Confirm Hetzner account creation works from Iran (or set up via a
  collaborator, then transfer).
- Confirm TLS certificate issuance for multiple subdomains (via Caddy
  + Let's Encrypt, or ZeroSSL if Let's Encrypt rate limits hit).
- Pick a domestic object store candidate and benchmark it against
  Hetzner Object Storage from inside Iran.
- Confirm Kavenegar credentials and a test SMS flow.
- Confirm which payment gateway the business already has a merchant
  account with (if any) — that one wins by default.
- Confirm the legal invoice format expected by Iranian tax authorities
  and any ERP export conventions the accountant already uses.

---

## What is deliberately not decided yet

These are held open on purpose because committing too early would lock
us into the wrong shape.

- The full e-commerce schema (orders, line items, stock locations,
  transfers, returns, deliveries, sales mode, fulfillment states,
  payment records). This is the next big documentation pass after the
  architectural reframe lands. See `roadmap.md` Phase 1.
- The showroom manager v1 / v1.5 / stretch breakdown. This depends on
  discovery findings from the existing app. See `discovery.md`.
- The CRM pipeline stages, lead scoring, and customer-360 definition.
  Drafted after the showroom discovery is done.
- The ERP chart of accounts, inventory valuation method, and BOM
  structure. Researched with the business's accountant before any code.
- The MES shape — factory floor workflows, work order states, QC gates.
  Researched in Phase 5 with actual factory staff, not before.
- The invoice (فاکتور) numbering format and the legal template.
  Provided by the client.
- The final payment gateway choice.
- Whether the admin app also hosts the showroom manager UI, or whether
  the showroom manager gets its own app (`apps/showroom`) from day one.
  Deferred to after discovery.

Everything here will move into the relevant doc once it is decided.
Nothing is locked by being in this list.
