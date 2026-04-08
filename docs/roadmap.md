# Roadmap

A phased plan from today's single-page mockup to a full platform:
storefront, admin, CRM, ERP, MES, and the invoice (factor) viewer.

Phases are mostly sequential but two things run in parallel:

- **Discovery** runs alongside Phase 0 and blocks any work on the
  showroom / CRM surfaces until its outputs land in `discovery.md`.
- **Design system experimentation** runs inside `/lab` on the public
  repo and must close before any Phase 1 template work begins.

Nothing in a later phase should be started before its predecessor is
shipped and measured. "Shipped" means deployed, used by a real user,
and monitored — not merged to a branch.

---

## Phase 0 — Alignment (current phase)

**Goal:** Lock the platform scope, the architecture, the data model,
and the design system on paper before any app is built.

Deliverables:

- [x] `docs/` folder bootstrapped with the earlier single-site scope.
- [x] Platform pivot captured: `README.md`, `architecture.md`,
      `discovery.md`, `roadmap.md`.
- [ ] Persian-first rewrite of `design-system.md` (RTL, typography,
      Persian digits, motion language for operator apps).
- [ ] Persian-first rewrite of `sitemap.md` (URL conventions, templates,
      information architecture).
- [ ] Iran-aware rewrite of `seo.md` (Persian queries, local SEO
      strategy for Iranian showrooms, self-hosted analytics).
- [ ] E-commerce + Iran-aware rewrite of `data-schemas.md` (customers,
      orders, line items, stock locations, transfers, returns, deliveries,
      sales mode, payment records, invoices).
- [ ] Post-discovery rewrite of `admin-panels.md` (after
      `discovery.md` is filled in).
- [ ] Approved hosting verification: Hetzner account, TLS issuance path,
      object storage benchmark, Kavenegar account, payment gateway
      account.

Exit criteria: a stakeholder can read `docs/` and predict what the
finished platform looks and feels like, including which apps exist,
which users use which app, how data flows between them, and how they
deploy.

---

## Phase 0.5 — Discovery (runs in parallel with Phase 0)

**Goal:** Understand the existing business before replacing any of it.
This phase is the single most likely thing to prevent the project from
shipping a worse version of what the showroom managers already have.

Scope:

- Inventory the **existing showroom managers app**: every screen, every
  form, every report, every field. Screenshots, notes, data model
  reverse-engineered from the UI (or the API if it exists).
- Interview at least **2–3 actual showroom managers**: daily
  workflows, monthly workflows, the parts they avoid, the workarounds
  they have invented (Excel, WhatsApp, paper, phone calls). Workarounds
  are requirements the current system failed to meet.
- Inventory the **existing invoice (factor) process**: what the numbers
  look like today, who assigns them, on what stationery, through which
  accounting software, with which tax fields filled in.
- Inventory the **existing customer list**: format, field coverage,
  quality, whether it is in a spreadsheet, CRM, or paper notebook.
- Inventory the **existing stock tracking**: how the factory warehouse
  tracks finished goods, how showrooms track floor stock, how transfers
  are recorded today.
- Inventory the **existing order flow** end-to-end: the moment a customer
  walks into a showroom, picks a bed, pays a deposit, waits for
  production, takes delivery. Every step, who does it, on what
  system, with what paperwork.
- Draft a **migration plan**: what data comes across to the new
  platform, in what format, cleaned how, with what field mapping, on
  what day.
- Draft a **gap analysis**: what the new platform must do that the old
  one doesn't, and what the old one does that the new one must preserve.

Deliverables:

- [ ] A filled-in `discovery.md` — every section populated, not
      templated.
- [ ] An addendum in `admin-panels.md` and `data-schemas.md` updating
      collections, fields, and workflows based on what discovery found.
- [ ] A v1 / v1.5 / stretch breakdown for the showroom manager scope,
      phase-tagged so nothing is "deferred" without a home.

Exit criteria: the product owner can point to the discovery findings
and explain, per feature, "we're building this because the existing
app does X badly / the managers asked for Y / the workaround we saw
was Z."

**Do not start Phase 1 app work on the CRM or showroom surfaces until
this phase is complete.** The storefront and content work in Phase 1
may begin in parallel because it does not depend on discovery findings.

---

## Phase 1 — Monorepo foundations + storefront v1

**Goal:** Stand up the monorepo, rehome the current mockup as
`apps/web`, and ship a production-grade Persian-first storefront
with catalog browsing and a real inquiry flow. No checkout yet.

Scope:

- Monorepo skeleton per `architecture.md`: `apps/web`, `services/api`,
  and the initial packages (`db`, `auth`, `ui`, `design-system`,
  `locale`, `types`, `config`).
- `services/api` boots Payload 3 against a fresh Postgres, behind
  `api.zhic.ir`, with an empty catalog.
- `apps/web` replaces the current `src/` app:
  - Persian-first, RTL, Jalali calendar, Persian digits in display.
  - Tokenized Tailwind theme from `design-system.md`.
  - Extracted layout primitives (`<Container>`, `<Grid>`, `<Stack>`,
    `<Section>`).
  - Home, catalog index, product detail, showroom index, showroom
    detail, about, contact, legal.
  - `generateMetadata` on every route.
  - `app/sitemap.ts`, `app/robots.ts`, `app/manifest.ts`.
  - `Organization` + `LocalBusiness` JSON-LD per showroom.
  - OG image generation (`opengraph-image.tsx`), Persian-safe.
  - Hero scrub video with poster frame and
    `prefers-reduced-motion` fallback.
  - Plausible self-hosted analytics behind a consent banner.
  - Core Web Vitals budgets in CI (Lighthouse CI).
- No checkout, no customer accounts, no cart. The product detail ends
  in "Inquire" and "Book a showroom visit" for Phase 1 — the real
  commerce flow lands in Phase 3.

Exit criteria: Lighthouse 95+ on mobile, all four CWV in the green,
valid Persian sitemap submitted to Search Console, and a non-developer
can see a Persian catalog with real products edited from Payload.

---

## Phase 2 — Content, catalog depth, showrooms

**Goal:** Give the storefront real, indexable content surface area in
Persian. This is the biggest SEO unlock.

Scope:

- `/products/[slug]` template with full PDP: still gallery, GIF loops,
  WebXR / 3D viewer (glTF + USDZ fallback), specs, materials, related.
- `/products` collection index with filtering (size, material, price
  band — stored in rial, displayed in toman).
- `/journal` and `/journal/[slug]` with the editorial sign-off
  workflow live (draft → in_review → approved → scheduled → published).
- `/journal/category/[slug]` and `/journal/tag/[slug]` archives.
- `/showrooms` index and `/showrooms/[slug]` per-location pages, each
  with its own `LocalBusiness` JSON-LD, hours (in Jalali-friendly
  display), map, and inquiry CTA.
- Breadcrumbs with `BreadcrumbList` JSON-LD.
- Per-page OG images composed from product/article data.
- The 3D viewer meets performance budgets: lazy-mounted on user intent
  (click-to-load), draco-compressed glTF, ≤ 2 MB per model.

Exit criteria: at least 6 product pages (each with GIFs and a working
WebXR model), 6 journal articles in Persian, and all showrooms indexed
with Search Console showing impressions for non-brand Persian queries.

---

## Phase 3 — Commerce: customers, orders, checkout, factor

**Goal:** Turn the storefront into a real shop. A customer can create
an account (phone + OTP), browse, add to cart, check out through an
Iranian payment gateway, and get a legal invoice (factor). Showroom
staff can place and fulfill orders from the admin.

Scope:

- `packages/auth`: phone + OTP via `packages/sms` (Kavenegar), session
  cookies scoped to the parent domain so `apps/web`, `apps/admin`, and
  the CRM all share login.
- `packages/money`: rial ↔ toman conversion, formatters, Persian digit
  rendering, rounding rules. Every price in every app goes through it.
- `packages/invoices`: factor number generator (using the client-
  provided format), PDF / HTML template, tax field support, national ID
  capture when required.
- `packages/payments`: provider-agnostic wrapper with ZarinPal / IDPay /
  Zibal adapters. Final provider chosen and wired.
- Collections: `customers`, `addresses`, `carts`, `orders`,
  `orderLineItems`, `payments`, `invoices`, `stockLocations`,
  `stockLevels`, `stockTransfers`, `deliveries`, `returns`. Full shape
  in the upcoming `data-schemas.md` rewrite.
- Storefront checkout: cart, address, delivery method, payment,
  confirmation. Persian throughout.
- Customer self-service: `/account`, `/account/orders`,
  `/account/addresses`, `/account/invoices`.
- Admin: order list, order detail, status transitions, refunds, manual
  order entry (for showroom walk-ins), stock adjustments.
- `apps/factor` standalone invoice viewer / printer (Phase 3 ships its
  minimum: a print-ready factor page that works on a phone and in a
  desktop browser; the full standalone app matures in Phase 6).

Exit criteria: a real test customer can complete a real rial payment
through the chosen gateway, receive an SMS with an order number,
download a valid factor, and have the order appear in the admin. A
showroom staff member can mark the order as delivered from the admin.

---

## Phase 4 — CRM + showroom operations (`apps/crm`)

**Goal:** Give sales and showroom staff a dedicated app that is not
"the admin." Everything discovered in Phase 0.5 lands here.

Scope:

- `apps/crm` as its own Next.js app, deployed at `crm.zhic.ir`,
  sharing auth with the rest of the platform.
- Customer 360: all orders, all follow-ups, all notes, all stock
  reservations, all appointments.
- Pipeline: leads from the storefront, walk-ins from each showroom,
  statuses, assigned staff, follow-up reminders (SMS via
  `packages/sms`).
- Showroom dashboard: floor stock, pending orders, delivery schedule,
  staff roster, per-showroom KPIs.
- Appointment scheduling with `Event` JSON-LD on the public
  `/showrooms/[slug]/book` page.
- Manager reports: inquiries → orders conversion, average time-to-
  close, top-selling products per location, staff performance.
- Mobile / tablet-friendly layout for showroom floor use.

Exit criteria: a showroom manager uses `apps/crm` for a full week
without falling back to Excel or WhatsApp for the workflows that the
old app handled.

---

## Phase 5 — ERP (`apps/erp`)

**Goal:** Move inventory, finance, procurement, and HR out of
spreadsheets and into a shared system the accountant and managers
actually trust.

Scope:

- `apps/erp` as its own Next.js app at `erp.zhic.ir`.
- Inventory ledger: stock-on-hand per location, valuation, transfers
  between showrooms and the Hamedan warehouse, cycle counts.
- Purchasing: supplier records, purchase orders, goods-received notes,
  3-way match with invoices.
- Accounts: the chart of accounts the business already uses, journal
  entries, trial balance, basic P&L, VAT reporting.
- HR-lite: staff records, payroll export (not in-app payroll).
- Factor numbering, tax fields, and legal templates are finalized here
  and adopted everywhere.

Exit criteria: the company's accountant can close a month end-to-end
from `apps/erp` without re-keying anything from another system.

---

## Phase 6 — MES (`apps/mes`) + factor viewer polish (`apps/factor`)

**Goal:** Bring the factory floor onto the platform and finalize the
standalone factor viewer.

Scope:

- `services/factory-api` introduced: Hono (or Fastify) + Drizzle,
  reading and writing the `mes` schema on the same Postgres. Payload
  does not touch `mes` tables.
- `apps/mes`: work orders, BOMs, routings, production scheduling, QC
  gates, shop-floor kiosks, barcode / QR scan support.
- `apps/factor`: standalone, print-first, phone-friendly factor
  viewer and printer. Primary surface for finance and any external
  party (customers, auditors) who only need to see an invoice.
- Integration: completed work orders update stock in the `commerce`
  schema via a documented event contract between `services/api` and
  `services/factory-api`.

Exit criteria: the factory runs a production batch end-to-end in
`apps/mes`, the finished goods appear in inventory without manual
data entry, and the generated factor is the one legal / finance use.

---

## Phase 7 — Scale & polish

**Goal:** Tighten everything for the long run.

Scope:

- Search (Typesense or Meilisearch) over products + journal, surfaced
  as `/search`.
- WebXR upgrades: per-product variant materials swappable in 3D,
  optional room-scale AR placement.
- A/B testing harness for hero copy, CTAs, and 3D viewer placement.
- Cross-showroom analytics (which location drives which conversions).
- Performance hardening pass on the 3D viewer and hero video.
- Consolidation: retire any spreadsheets, WhatsApp groups, and paper
  workflows still in use, and move their scope into the appropriate app.

Exit criteria: no business-critical workflow lives outside the
platform.

---

## Phase 8 — Continuous ops

**Goal:** Treat everything as a recurring operation, not a launch.

Scope:

- Monthly content calendar managed in admin.
- Search Console dashboards embedded in admin home.
- Broken-link and 404 monitor.
- Schema validation in CI (every PR runs structured-data tests).
- Keyword tracking notes per article.
- Quarterly business reviews: inventory accuracy, CRM adoption, ERP
  close time, factory throughput.

Exit criteria: the team has a repeatable monthly cadence and a KPI
dashboard that spans the whole platform.

---

## Sequencing rules

- **Never start Phase N before Phase N−1 is in production.** The
  temptation with admin / ERP work is to build it before the schema
  and discovery are ready; resist.
- **Discovery gates showroom and CRM work.** No Phase 4 feature ships
  before `discovery.md` is filled in.
- **Design tokens are never bypassed.** If a Phase 2 component needs a
  color that does not exist in `design-system.md`, the token is added
  there first.
- **Schemas are never bypassed.** If a Phase 3 collection needs a field
  that is not in `data-schemas.md`, that doc is updated and reviewed
  first.
- **No content is created in code after Phase 1.** Once Payload is
  live, all copy lives in the database.
- **No money logic lives outside `packages/money`.** Ever.
- **No SMS logic lives outside `packages/sms`.** Ever.
- **No payment logic lives outside `packages/payments`.** Ever.
