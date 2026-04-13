# Roadmap

The Zhic platform roadmap. Structured as **commercial packages** with
defined acceptance tests, payment triggers, and scope fences — not as
open-ended technical phases.

Two things define this roadmap's shape:

1. **Parallel execution.** Discovery, the landing page, and the
   commerce shell run concurrently from day one (R10). This is not a
   sequential pipeline where research finishes before building starts.
2. **Package-based pricing.** Each package is fixed-price at a defined
   pricing moment — contract signing for Package 1, the Commerce
   Pricing Checkpoint for Package 2 (R11). Packages 3 and 4 are
   indicative sketches only, scoped and priced after Package 2 closes.

---

## Team

- **Operator (this repo's owner) — solo on dev and design.** The
  operator is both the technical and the aesthetic lead. No external
  designer is budgeted. `design-system.md` is the operator's working
  document, not a handoff doc for an outside designer.
- **3D artist — available, client-side resource.** Not on the dev
  team, but reachable as a specialist for product 3D assets (glTF,
  USDZ). Owns the Blender-to-web export pipeline; the operator
  validates and integrates.
- **SEO specialist — available, client-side resource.** Not on the
  dev team, but reachable for Persian keyword research, content
  strategy, competitive analysis, and journal topic planning. Owns
  content/strategy SEO; the operator owns technical SEO (sitemap,
  schema, performance, canonical tags).

Whether the 3D artist and SEO specialist are paid by the client
directly, paid through the operator and rebilled, or subcontracted
independently is an **open question for the contract conversation**
and must be named in the Package 1 addendum.

The operator builds Package 1 solo. Hiring is re-evaluated at the
Commerce Pricing Checkpoint for Package 2.

---

## Parallel workstream diagram

```
Week  1   2   3   4   5   6   7   8   9  10  11  12
      ├───────────────────────────────────────────────┤
      │            PACKAGE 1 — Foundations             │
      ├───────────────────────────────────────────────┤
      │                                               │
      │  ┌─ Discovery ──────────────┐                 │
      │  │  W1 Access & inventory   │                 │
      │  │  W2 Workflow mapping     │                 │
      │  │  W3 Schema sketch        │                 │
      │  │  W4 Accountant walk + ✎  │                 │
      │  │  W5 (buffer)             │                 │
      │  └──────────────────────────┘                 │
      │           ▼                                   │
      │     Commerce Pricing                          │
      │     Checkpoint (≈ W4)                         │
      │           │                                   │
      │  ┌─ Landing page ────────────────────────┐    │
      │  │  (zero Discovery dependency)          │    │
      │  │  Storefront, catalog, showrooms,      │    │
      │  │  journal, pillar pages, editorial,    │    │
      │  │  inquiry CTA, contact, legal          │    │
      │  └───────────────────────────────────────┘    │
      │                                               │
      │  ┌─ Commerce shell ──────────────────────┐    │
      │  │  Cart, checkout, customer accounts,   │    │
      │  │  payment gateway wiring               │    │
      │  │  (factor/order/stock shapes WAIT on   │    │
      │  │   Discovery — see "data-model lock    │    │
      │  │   gates" below)                       │    │
      │  └───────────────────────────────────────┘    │
      │                                               │
      ├───────────────────────────────────────────────┤
      │  Package 1 acceptance (R15 Shape-R session)   │
      └───────────────────────────────────────────────┘
                        │
                        ▼
      ┌───────────────────────────────────────────────┐
      │         PACKAGE 2 — Commerce lock & launch    │
      │  (priced at the Commerce Pricing Checkpoint)  │
      │                                               │
      │  Factor / order / stock shapes locked against │
      │  Discovery outputs. Full shop wired end to    │
      │  end. Parallel-run migration. Staff training. │
      │  Launch-readiness checklist.                  │
      │                                               │
      │  Package 2 acceptance (R15 Shape-R session)   │
      └───────────────────────────────────────────────┘
```

---

## Data-model lock gates

Discovery runs in parallel with the build, but five specific data
shapes **wait on specific Discovery outputs** before being locked in
the commerce codebase. These shapes can be drafted on paper and built
behind package boundaries (`packages/invoices`, `packages/orders-core`)
but must not be frozen until the inputs land.

| Data shape | Waits on | Expected timing |
| --- | --- | --- |
| Factor (invoice) numbering format | Accountant (schema-walk, R6 deliverable #3) | Discovery W4 |
| Factor legal template + tax fields | Accountant (schema-walk) | Discovery W4 |
| Order lifecycle states | Legacy-app workflow map (overrides decision #9) | Discovery W2 |
| Rial-stored / toman-displayed money model | Accountant schema-walk validation | Discovery W4 |
| Stock transfer flow (one-step vs two-phase) | Legacy-app actual behavior | Discovery W2 |

Shape C (R13) adds two more:

| Data shape | Waits on | Expected timing |
| --- | --- | --- |
| Gift card tax treatment under Iranian VAT | Accountant schema-walk agenda item | Discovery W4 |
| Stock reservation window default | Legacy-app behavior (if reservation concept exists) | Discovery W2 |

Commerce starts in full parallel. These shapes defer their "locked"
status until the inputs land, typically early in Discovery W4.

---

## Package 1 — Foundations

**Fixed-price, signed up front.** Covers Discovery in full, the entire
landing-page workstream at Generous depth, the commerce shell, monorepo
skeleton, hosting stand-up, and all infrastructure verification.

### Discovery workstream (4 + 1 weeks)

**Goal:** Understand the existing business before replacing any of it.
Discovery is timeboxed at **4 working weeks of focused effort, with up
to 1 additional buffer week named explicitly in the Package 1
addendum.** The contract states "Package 1 Discovery: 4 weeks, with up
to 1 week of slack reserved for accountant / staff scheduling." The
buffer is named, not hidden — the client sees both numbers.

Discovery happens **after the Package 1 addendum is signed, not
before.** No pre-contract reconnaissance.

**Critical confirmed fact.** The operator has been promised **both UI
and database access** to the existing showroom managers app. This
removes the single biggest Discovery risk. `discovery.md` assumes a
DB-access-first approach: schema dump + analysis pass in W1, not
screen-by-screen UI reconstruction.

#### Internal week-by-week target shape

| Week | Focus | End-of-week artifact |
| --- | --- | --- |
| **W1** | Access & inventory: DB credentials, schema dump, UI access, first read-through of legacy app, list every screen | Raw "what's in the legacy app" inventory |
| **W2** | Workflow mapping: order signing first (P0), then other load-bearing flows; two showroom visits, one factory walk | Workflow maps for the top 3–5 flows |
| **W3** | New schema sketch: multi-schema split drafted, sample legacy data round-tripped into it | Schema sketch + round-trip evidence |
| **W4** | Accountant schema-walk (one focused day) + writeup, feedback incorporation, sign-off | Signed Discovery deliverable |
| **W5 (buffer)** | Absorbs slipped weeks (most often W2 — staff are busy, interviews reschedule) | — |

#### Discovery deliverables (M1 acceptance requires all three)

1. **A fully populated `discovery.md`** — schema dump, legacy-app
   feature inventory, P0 workflow maps (order signing first), accountant
   interview notes, factory walk notes, showroom-by-showroom usage
   reality check.
2. **A first-draft new-system schema sketch** — the multi-schema
   Postgres split with actual table shapes, round-tripped against a
   sample of legacy data. Every legacy field has a home in the new
   sketch or is explicitly marked "dropped — reason X."
3. **A one-day accountant schema-walk note** — the operator walks the
   accountant through factor-related tables. Decisions #7
   (rials-stored / toman-displayed) and #10 (factor immutability +
   adjustment-factor) are validated or revised. Output appended to
   `discovery.md`.

#### Three-signer sign-off (hard gate)

Package 1 **cannot close** until three named signatures are committed
to `docs/m1-signoffs/`:

1. **The owner** — signs the overall Discovery deliverable as "this
   represents the business I run." Covers business goals, showroom
   list, product categories, brand constraints, overall schema shape.
2. **The accountant** — signs the schema-walk note as "this represents
   the factor and money flow I'm responsible for." Validates or
   revises decisions #7 and #10.
3. **At least one showroom manager** — the most active in the legacy
   app (determinable from W1 schema dump). Signs the order-signing
   workflow map as "this is how my showroom actually works."

Three **separate sessions**, not a combined readout. The operator goes
to each signer individually. The likely Case-B counterpart ("the nephew
or similar") is a facilitator, not a signer. Sign-off is **wet-ink on
printed PDF**, photographed, committed to `docs/m1-signoffs/`.

#### Discovery overrun rules

1. **Operator-side slip — operator eats it.** Discovery not done at
   end of W5 because the operator under-estimated → M1 is not
   re-priced.
2. **Client-side slip — clock pauses, contract extends.** Client
   could not make accountant/staff/database available within
   reasonable notice → working-day clock pauses, addendum extends by
   the same number of working days. "Reasonable notice": 3 working
   days for an interview request, 5 working days for DB credentials.
3. **Scope is frozen during overrun.** New things surfaced at W4/W5
   go on a "Discovery follow-ups" list and are scoped into Package 2,
   not absorbed into Package 1.

#### Discovery cooperation clauses (contract must include)

- Named client counterpart if available (facilitator, not signer).
- Interview-hour commitment from showroom managers.
- Response-time SLA on Discovery questions (3 working days for
  interviews, 5 working days for credentials).
- Client introduces operator to the accountant with a date commitment.
- Client makes all three signers available within the Package 1 window.

#### Discovery out-of-scope (eight named items)

The Package 1 addendum names these explicitly. If they come up during
Discovery, they are parked as M2-or-later scope:

1. **Supplier / vendor integrations.** M5 / ERP territory.
2. **Social media operational flows.** Instagram DMs, Telegram orders,
   WhatsApp customer service — acknowledged as acquisition channels,
   not mapped as operational workflows.
3. **Factory QC, production scheduling, deep MES details.** One
   factory walk for context, not a deep audit. M5/M6 territory.
4. **HR / payroll / staff management.** Out of scope, full stop.
5. **Marketing analytics beyond Plausible.** No Google Analytics, Meta
   Pixel, ad attribution. SEO specialist owns that separately.
6. **Existing website / content audit & migration.** Clean-break
   assumption. Old-content migration is a separate Package 2 scope
   item if requested.
7. **Competitor analysis.** SEO specialist and marketing lead's work.
8. **Product photography / 3D asset creation.** 3D artist owns that
   workflow separately.

**Pricing strategy: deferred to Package 2.** Discovery captures the
current price list as data; it does not investigate pricing logic,
discount structures, dealer pricing, or special-customer deals. If
Package 2 surfaces that pricing logic is more complex than the schema
reveals, it becomes a Package 2 scope adjustment, not a Discovery
overrun.

### Landing-page workstream (Generous depth)

**Goal:** Ship a production-grade Persian-first storefront with
catalog browsing, editorial surfaces, and a real inquiry flow. No
checkout yet. Zero dependency on Discovery — safe to build fully in
parallel from day one.

#### Core pages (would have been in Skinny)

- Home
- Catalog index (`/products`) with filtering
- Product detail page template (`/products/[slug]`) — **inquiry mode
  only in Package 1** ("استعلام قیمت" / "رزرو بازدید از شوروم"),
  flips to purchase mode at Package 2 cutover
- Showrooms index + per-showroom pages
- Contact
- Legal (privacy, terms, returns placeholder)

#### Editorial surfaces (would have been in Standard)

- Journal index + journal-article template
- Journal category and tag archives
- FAQ page
- Care / materials guide
- About / atelier story page

#### Generous-only additions

- **Pillar content pages** — long-form Persian content pages for the
  biggest target search terms. Structure from the SEO specialist;
  template work is operator.
- **Per-product-category landing pages** with editorial framing — not
  just filtered catalog lists. These win category Persian queries
  ("تخت خواب دو نفره چوبی" etc.) and carry real content, not just
  filter state.
- **Events / showroom-visits page** — static content listing workshops,
  open-house events, or showroom visit windows. Static only in
  Package 1: no booking mechanics, no calendar integration, no RSVP.
- **Showroom-visit intake form** — lead-capture form only: name, phone,
  preferred showroom, preferred date window (free-text), message.
  Submissions land as leads in the same inbox the general inquiry form
  uses.

#### Generous scope fence (what Package 1 does NOT include)

1. **No real appointment-booking engine.** The intake form is lead-gen
   input, not a booking system. No calendar, no availability check, no
   staff assignment, no confirmation workflow. That belongs in
   Package 3.
2. **Events page is static content, not an events database.** No
   `Event` JSON-LD with bookable slots, no RSVP, no ticketing.
3. **Pillar and category pages are editorial, not programmatic.** They
   are designed and filled like journal articles, not generated from
   catalog data. Programmatic category pages stay in Package 2.
4. **No booking-form automation.** Submissions trigger a basic SMS
   notification to the showroom manager via `packages/sms` and nothing
   else. No round-robin assignment, no SLA tracking, no auto-reply.
   Package 3 territory.
5. **No deep search.** Basic filtering only. Typesense / Meilisearch
   stays deferred to post-Package-2 phases.

#### Content ownership split

Package 1 Generous only wins if content fills the extra surfaces.
This split **must be explicit in the Package 1 addendum as a contract
clause**, not a note:

| Content type | Owner | Notes |
| --- | --- | --- |
| Pillar content, category-page editorial, journal article topics + drafts | **SEO specialist** | Persian keyword research + content briefs + drafts. Operator only builds templates and places the content. |
| FAQ, care guide, atelier story | **Client marketing** | Brand-voice pages, drawn from existing Instagram captions and showroom materials. |
| Events page content | **Client directly** | Showroom managers know what events are happening. |
| Templates, design, integration | **Operator** | All technical work. |

**Package 1 acceptance does NOT require every editorial page to be
populated.** Template existence + graceful placeholder rendering is
the operator's deliverable. Content is the client / SEO specialist's
deliverable.

#### Technical foundations (also in Package 1)

- Monorepo skeleton per `architecture.md`: `apps/web`, `services/api`,
  initial packages (`db`, `auth`, `ui`, `design-system`, `locale`,
  `types`, `config`).
- `services/api` boots Payload 3 against a fresh Postgres, behind
  `api.zhic.ir`, with an empty catalog.
- `apps/web` replaces the current `src/` app: Persian-first, RTL,
  Jalali calendar, Persian digits, tokenized Tailwind theme.
- `generateMetadata` on every route, `sitemap.ts`, `robots.ts`,
  `manifest.ts`.
- `Organization` + `LocalBusiness` JSON-LD per showroom.
- OG image generation (Persian-safe).
- Hero scrub video with poster frame and `prefers-reduced-motion`
  fallback.
- Self-hosted Plausible analytics.
- Core Web Vitals budgets in CI (Lighthouse CI).
- Hosting stood up: Hetzner (or domestic Iranian VPS), TLS, object
  storage, Kavenegar account, payment gateway account confirmed.

### Commerce shell workstream (Discovery-independent parts)

Built in parallel with Discovery and landing page. The parts that
**do not** depend on Discovery:

- Cart + checkout flow (UI and logic).
- Customer accounts: phone + OTP via `packages/auth` (Kavenegar).
- Address management (Iranian address fields).
- Payment gateway wiring (`packages/payments` — ZarinPal / IDPay /
  Zibal adapter, whichever the business already has a merchant
  account with).

The parts that **wait on Discovery** (factor / order / stock shapes)
are built behind package boundaries but not frozen until the data-model
lock gates above resolve.

### Commerce Pricing Checkpoint

A **named, scheduled event** inside Package 1 — not a renegotiation.
Triggered by three specific artifacts landing:

1. The accountant schema-walk note (signed per three-signer sign-off).
2. The order-signing workflow map (signed by the most active showroom
   manager).
3. The first-draft new-system schema sketch, round-tripped against
   legacy data.

**Timing:** expected at the end of Discovery Week 4.

At the checkpoint, the operator produces the **Package 2 addendum**
with a firm price. The client countersigns before commerce data-model
lock-in begins. The checkpoint does not pause the parallel build —
Package 1 work continues during the Package 2 scoping conversation
(should take no more than one week).

### Package 1 acceptance (Shape-R session)

Package 1 acceptance is established by the **owner personally
performing scripted end-to-end user journeys** in a scheduled sign-off
session with the operator. The owner does every step. The operator
observes, does not touch the device, and captures the result per
journey.

**Session logistics:**

- Scheduled in advance, 1–2 hours. One operator, one owner.
- Held **inside Iran, on real ISPs, not on VPN.** Sessions run over
  VPN produce invalid sign-offs.
- The operator provides a **printed Persian journey card** per journey.
- The operator is **silent during the journey.** Stuck points are
  recorded as issues, not coached through.

**Indicative Package 1 journeys** (revisable before the session):

1. **Customer browses the catalog on a phone inside Iran.** Opens
   zhic.ir without VPN, browses products, opens 3+ PDPs, scrolls
   the journal, opens 2+ articles. Observable: fast loads, correct
   Persian, clean RTL.
2. **Customer submits a product inquiry.** Uses "استعلام قیمت" on a
   PDP, fills the form, submits. Within 60 seconds the showroom
   manager's phone receives an SMS notification. Observable: form
   works, inquiry lands, notification loop functions.
3. **Customer books a showroom visit via the intake form.** Opens a
   showroom page, uses the intake form, submits. Operator shows the
   owner where the submission landed as a lead in admin. Observable:
   intake-as-lead-capture works end-to-end.
4. **Owner edits a product in admin and sees the change live.** Logs
   in, edits a product title, saves, refreshes the public page.
   Within 10 minutes the new title appears. Observable: content
   editing works, admin-to-storefront pipeline works.
5. **Owner navigates journal, category, and pillar pages.** Visits
   the journal index, 2+ articles, a category editorial page, a
   pillar page. Observable: Generous editorial surfaces exist and
   hang together.
6. **Owner explores freely for 10 minutes.** Unscripted "skeptical
   friend" exploration. Friction becomes an issue line, not a failure.

**Failure handling:**

- **Clean pass:** owner signs the summary on the spot. Closing payment
  releases. Package closes.
- **Pass-with-issues (≤ 10 issues):** operator fixes within 5 working
  days, sends written confirmation, package closes.
- **Rework needed (> 10 issues or journey failures):** operator fixes,
  schedules a second session within 10 working days. Second session
  runs **failed journeys only**. If the second session still fails,
  the contract's dispute-resolution clause kicks in.

The Shape-R session is **separate from the R8 three-signer sign-off.**
The owner signs once for Discovery (R8) and again for the built
product (R15). Both are required for Package 1 to close.

### Package 1 payment triggers (25 / 25 / 25 / 25)

| Installment | Trigger |
| --- | --- |
| **25% at signing** | Unlocks the work. |
| **25% at landing-page internal** | Landing page reachable on `zhic.ir` with catalog, showrooms, contact, inquiry flow usable by client staff on staging. First visible proof-of-life. |
| **25% at Commerce Pricing Checkpoint** | Discovery deliverables signed (R8) + schema sketch landed. Also triggers Package 2 pricing. |
| **25% at Package 1 close** | Shape-R acceptance session passed. Landing page internally accepted, commerce shell built, hosting stood up, all infrastructure verification confirmed. |

Triggers are **event-driven, not date-driven.** If Package 1 slips on
calendar, triggers slip too.

### Package 1 exit criteria summary

- Three Discovery signatures committed to `docs/m1-signoffs/`.
- Schema sketch round-tripped against legacy data.
- Landing page live on `zhic.ir` (internally, not publicly announced
  per R3).
- Lighthouse 95+ on mobile, all four CWV in the green.
- Valid Persian sitemap submitted to Search Console.
- A non-developer can edit a product in admin and see it live within
  10 minutes.
- Commerce shell built (cart, checkout, customer accounts, payment
  wiring) — not yet wired to factor / order / stock shapes.
- All infrastructure verification items confirmed (Hetzner/VPS, TLS,
  SMS, payment gateway account, object storage).
- Shape-R acceptance session passed.

---

## Package 2 — Commerce lock & launch

**Fixed-price, signed at the Commerce Pricing Checkpoint.** Covers
wiring the commerce shell into Discovery-validated data shapes,
producing a working end-to-end shop at **Shape C (Full shop)** depth.

The site is treated as **internal until end of Package 2** (R3). No
public marketing push during Package 1. The loud public launch is
**planned for end of Package 2** — "you can now buy Zhic online." A
quiet launch at Package 2 close remains an explicitly allowed fallback.

### Shape A — baseline (the shop shell)

- Customer accounts via phone + OTP (Kavenegar).
- Cart + checkout flow, Persian throughout.
- One working Iranian payment gateway (the one the client already has
  a merchant account with).
- Legal factor generation + PDF template, with the client-provided
  factor numbering format wired in.
- Admin order list / detail / status transitions (against the order
  lifecycle states Discovery confirmed).
- Manual walk-in order entry from admin (showroom staff can place
  counter orders).
- Parallel-run migration of the order-signing flow from the legacy app,
  including the staged overlap period and the "legacy app goes
  read-only" cutover date.
- Staff training as a named deliverable, not an afterthought.

### Shape B — real shop additions

- **Real stock tracking per location** (showrooms + Hamedan warehouse).
  Stock-on-hand, adjustments, inter-showroom transfers. One-step vs
  two-phase confirm decided by Discovery.
- **Delivery scheduling** (promised date + status, not routing).
  Courier integration not in scope; delivery method is metadata
  updated manually.
- **Returns workflow.** Customer-initiated return requests; admin
  refund issuance; integration with factor model via adjustment-factor
  pattern (validated at accountant schema-walk).
- **Customer self-service:** `/account` + `/account/orders` +
  `/account/invoices` + `/account/addresses` at usable depth.
- **Per-showroom product availability overrides** — which products are
  available at which showroom.

### Shape C — full shop additions

- **Promotion / discount engine, rules-based.** Rule types: percent-off,
  fixed-amount-off, buy-X-get-Y, product-scoped, category-scoped,
  customer-scoped, time-windowed. Admin-editable, not hard-coded.
  **Scope fence:** no dynamic pricing, no user-behavior-triggered
  discounts, no A/B-tested promotions.
- **Gift cards / store credit.** Issuable from admin, redeemable at
  checkout, balance-tracked per customer. **Requires accountant
  sign-off** at the schema-walk for tax-treatment under Iranian VAT.
- **Simple SMS follow-up automation — delivery-step notifications
  only.** Customer receives SMS at each meaningful fulfillment
  transition (order confirmed, dispatched, out for delivery,
  delivered). Keyed to the Discovery-confirmed order lifecycle states.
- **Multi-address shipping** — customers maintain multiple saved
  addresses. **Split deliveries (one order to multiple addresses)
  are explicitly out of scope.**
- **Real-time stock reservation during checkout.** In-stock items
  reserved for a defined window (default 15 minutes, configurable).
  Reservation expires, item returns to pool.

### Package 2 / Package 3 boundary (scope fence)

These five clauses must be repeated in the Package 2 addendum:

1. **Package 2 SMS = "where is my order" only. Package 3 SMS =
   everything else.** No abandoned-cart, birthday, post-purchase
   marketing, broadcast campaigns, segmentation, drip-campaign
   builder.
2. **Promotion rules are per-promotion, not per-segment.** Admin
   creates "10% off Hamedan floor stock for one week." Admin does not
   build customer segments for targeted discounts. Segmentation is
   Package 3.
3. **Gift cards are issuable and redeemable in Package 2. Issuance
   *workflows* are Package 3.** Package 2 gives the tool; Package 3
   gives the workflow (who issues, under what approval, tied to what
   milestone).
4. **Customer self-service stops at order and invoice level.** No
   preference management beyond opt-in/out of SMS, no loyalty tier
   display, no relationship history. Package 3.
5. **Loyalty tier systems, points, rewards are NOT in Package 2.**
   "Loyalty" in this context means delivery-step SMS automation, not
   points/tiers.

### Per-showroom pricing

Confirmed out of scope — **all showrooms share one price list.** If
Discovery surfaces that the legacy app varies prices per showroom,
that discrepancy is raised with the owner as a scoping conversation,
not silently implemented.

### Package 2 acceptance (Shape-R session)

Same structure as Package 1, but 2–3 hours.

**Indicative Package 2 journeys** (revisable):

1. **Customer completes a real rial payment end to end.** Creates
   account with phone + OTP, adds product to cart, checks out, pays
   real rials through the chosen gateway, receives confirmation +
   delivery-step SMS, downloads factor PDF. Observable: end-to-end
   shop works on real money.
2. **Showroom staff places a walk-in order from admin.** On a tablet
   on the showroom floor, creates order, picks stock from the right
   location, generates factor, marks deposit. Observable: walk-in
   workflow replaces legacy-app equivalent.
3. **Customer returns an order and refund completes.** Initiates
   return from `/account/orders`, admin approves, refund issues,
   adjustment factor PDF generated. Observable: returns and
   adjustment factors work.
4. **Owner creates a real promotion.** Percent-off-for-one-week scoped
   to one product, then confirms discounted price on public site.
   Observable: promotion engine editable by non-developer.
5. **Owner issues a gift card and redeems it.** Creates gift card in
   admin, redeems at checkout, observes balance decrement and
   redemption on factor. Observable: gift-card feature works, tax
   treatment holds.
6. **Delivery-step SMS sequence fires.** Test order walked through
   lifecycle states, owner observes SMS at each transition.
   Observable: narrow SMS scope is live.
7. **Parallel-run migration for one full day.** Every order signed in
   legacy app is also reflected in new system. Owner reviews
   reconciliation report. Observable: migration contract is delivering.
8. **Owner tries to break the site.** 15 minutes unscripted.

**Failure handling:** same as Package 1 but issues cap is 15 (not 10).

**Package 2 sub-sign-offs:** the accountant confirms gift-card tax
handling works as the schema-walk predicted (one-page confirmation).
The showroom manager confirms the walk-in workflow after journey #2.
These are short confirmations inside the owner's R15 session.

### Launch-readiness checklist (at Package 2 close)

The loud-vs-quiet launch decision is made **at Package 2 acceptance**,
not in advance:

- [ ] Payments dry-run with real rials.
- [ ] Factor sign-off from the accountant.
- [ ] Inventory accuracy spot-check.
- [ ] Persian-RUM performance pass from inside Iran on top customer
      ISPs.
- [ ] Launch artifacts ready (client deliverable): announcement copy,
      Instagram asset, in-showroom signage.

### Package 2 payment triggers

Defined in the Package 2 addendum at the Commerce Pricing Checkpoint,
not in the master agreement. Same event-triggered pattern as Package 1.

### Package 2 commercial section

**Non-binding budget band in master agreement: 500–800M toman** for
Shape C scope. Firm number set at the Commerce Pricing Checkpoint.

If the firm number exceeds the top of the band, the client may decline
Package 2, retain all Package 1 deliverables including the commerce
shell, and the engagement ends there. The operator may then offer a
scope-reduced Package 2 at a lower price.

---

## Package 3 — CRM / operator app (indicative sketch, non-binding)

> The module lists below for Package 3 (CRM / operator app) and
> Package 4 (ERP + MES) are **indicative sketches**, provided so
> the client can see the total shape of the platform journey.
> They are **not deliverable commitments** and **no item on
> either list is guaranteed to ship as described**. Each package
> will be scoped, specified, and priced in full only after the
> previous package closes, using what Discovery and the preceding
> package have taught us. The operator may revise, merge, remove,
> or re-order any item on these lists before Package 3 / Package
> 4 scoping begins. The client's reliance on any specific item
> on these lists creates no contractual obligation on the
> operator until that item appears in a signed package addendum.

**What problem it solves.** The storefront admin from Packages 1/2 is
Payload-as-admin. Package 3 adds a **dedicated operator app**
(`apps/crm` at `crm.zhic.ir`) for the day-to-day workflows of
showroom managers, sales staff, and inside-sales coordinators, sized
against what Discovery finds the legacy app actually does.

**Who uses it.** Showroom managers, showroom sales staff, inside-sales
coordinators at HQ, and the owner in a reporting capacity. Not the
accountant, not the factory floor.

**Indicative module list (revisable):**

- **Customer 360.** Unified view: all orders, interactions, notes,
  preferences, assigned staff, relationship history across showrooms.
- **Pipeline management.** Leads from inquiry form and intake form
  flow into a pipeline with stages, assigned staff, next-action
  reminders, SLA tracking.
- **Appointment scheduling.** Real appointment system (the thing
  Package 1 deliberately did not build). Calendar with per-showroom
  and per-staff availability, customer-facing booking, staff-side
  confirm/reschedule/no-show, reminder SMS.
- **Manager dashboards.** Per-showroom KPIs (inquiries → orders
  conversion, time to close, top products, staff performance).
  Cross-showroom dashboards for the owner.
- **Mobile / tablet-friendly showroom-floor UI.** Core CRM workflows
  on tablets and phones.
- **Broadcast and segmented SMS.** Everything Package 2's scope fence
  reserved for Package 3: broadcast, segmented, campaign-builder,
  drip campaigns.
- **Loyalty program mechanics.** Points or tiers if the client wants
  them. Designed only if Discovery and Package 2 learnings confirm
  a real business case.
- **Gift card issuance workflows.** Who can issue, under what approval,
  tied to what milestone, with what audit trail.
- **Showroom-operations modules.** Floor stock, today's deliveries,
  today's appointments, today's walk-ins — the morning dashboard.

**Indicative rough size.** Expected to be comparable in total effort
to Package 1 at Generous scale. Possibly larger if Discovery surfaces
workflows not visible in the legacy app. The CRM is where
solo-operator bus-factor risk is most likely to force a team
conversation.

---

## Package 4 — ERP + MES (indicative sketch, non-binding)

> *(Same revisable-sketch clause as Package 3 above applies.)*

**What problem it solves.** Moves inventory valuation, purchasing,
accounting, payroll export, factory work orders, BOMs, and production
scheduling into shared systems.

**Who uses it.** Accountant (ERP), owner (cross-cutting reporting),
factory supervisor and production staff (MES), HR admin (payroll
export). Not showroom sales staff.

**May split into Package 4 + Package 5 (ERP + MES separately).** The
single-or-split decision is deferred to end-of-Package-2 scoping.

**Indicative module list — ERP side (revisable):**

- **Inventory ledger.** Stock-on-hand per location, valuation method,
  inter-location transfers, cycle counts, shrinkage.
- **Purchasing.** Supplier records, purchase orders, goods-received
  notes, 3-way matching.
- **Accounts.** Chart of accounts, journal entries, trial balance,
  P&L, VAT reporting (Iranian tax requirements).
- **Payroll export.** Staff records, hours/salaries, export for
  existing payroll software — not in-app payroll.
- **Factor lifecycle completion.** Factor numbering, tax fields, and
  templates from Package 1 adopted across the business.

**Indicative module list — MES side (revisable):**

- **Work orders.** Production work orders linked to customer orders.
- **BOMs.** Bill-of-materials per product, versioned, with
  material-substitution rules.
- **Routings.** Station sequence with estimated and actual times.
- **Production scheduling.** Basic capacity-aware scheduling (not
  full APS).
- **Shop-floor UI / kiosks.** Touch-friendly screens for work order
  state updates.
- **Barcode / QR scan support.** Scannable identifiers for work
  orders and finished units.
- **QC gates.** Quality-control checkpoints with pass/fail/rework
  outcomes.

**Indicative rough size.** Expected to be larger than Package 3,
possibly significantly.

---

## Sequencing rules

- **Discovery runs in parallel with landing and commerce** — it is not
  a gate in front of the build. Only specific data-model shapes wait
  on specific Discovery outputs (see "Data-model lock gates" above).
- **Design tokens are never bypassed.** If a component needs a color
  that does not exist in `design-system.md`, the token is added there
  first.
- **Schemas are never bypassed.** If a collection needs a field that
  is not in `data-schemas.md`, that doc is updated and reviewed first.
- **No content is created in code after Package 1 template work.**
  Once Payload is live, all copy lives in the database.
- **No money logic lives outside `packages/money`.** Ever.
- **No SMS logic lives outside `packages/sms`.** Ever.
- **No payment logic lives outside `packages/payments`.** Ever.
- **No Jalali / Persian-digit logic outside `packages/locale`.** Ever.

---

## Risks named in the contract

| Risk | Mitigation |
| --- | --- |
| Hetzner / TLS / payments / SMS verification from inside Iran | Package 1 closes all of these before build depends on them. |
| Legacy-app export / migration may be manual | R4 parallel-run migration in Package 2. |
| Factor format and tax fields may take longer than expected | R6 schema-walk, one focused day in Discovery W4. |
| Core Web Vitals from inside Iran may be worse than CI shows | R15 Shape-R session on real ISPs inside Iran. |
| Discovery may surface workflows pushing Package 3 scope significantly | R14 revisable-sketch clause. |
| Shape C content dependency: Generous templates without Persian content | R12 content-ownership clause in Package 1 addendum. |
| Solo-operator bus-factor at Shape C scale | R16 Clarification 2: 3-week transparency check, 6-week client exit option. |
| Package 2 number exceeds non-binding budget band | R11 exit-ramp clause: client may decline Package 2 and retain Package 1. |
| Commerce Pricing Checkpoint feels like a renegotiation | R11 naming-as-scheduled-event from day one. |
| Client-side scheduling slips on Discovery interviews | R7 client-side-slip rule with defined notice windows. |

### Operator unavailability rules

- **> 2 weeks continuous absence:** milestone dates extend by the same
  period. Client notified within 48 hours.
- **~3 weeks:** mandatory status conversation with the client
  (transparency trigger, not renegotiation trigger). Covers projected
  return, impact on acceptance window, whether Shape-R session needs
  rescheduling.
- **~6 weeks:** client gains unilateral exit option from the current
  package. Client closes the package early, pays pro-rated based on
  visible deliverables, walks away from remaining scope.

Shape C Package 2 specifically has no parallel engineering capacity to
absorb extended absence. The client must be warned at contract signing.

---

## Deferred operator decisions

These are working defaults, not locked decisions. Each will be revisited
before the relevant package begins. Only the operator can upgrade a
deferral to a decision — future Claude sessions must not silently
resolve them.

| # | Item | Default | Revisit when |
| --- | --- | --- | --- |
| 1 | ASCII vs Persian slugs | ASCII slugs (current unilateral) | Before Package 1 template work begins |
| 2 | Persian font (free Vazirmatn/Estedad vs paid) | Free Vazirmatn + Estedad pair | Budget question — revisit if client wants a paid face as brand differentiator |
| 6 | Multi-schema Postgres split | Multi-schema stays | Reversible if early Discovery reveals operator pain |
| 16 | Showroom-scoped visibility | Managers see only their showroom, owner sees cross-showroom | Cultural/management question — revisit with owner before Package 3 scoping |
| 19 | Tipax as delivery carrier | Tipax as assumed carrier enum value | Populated from whatever Discovery finds the business uses |

---

## Operator-facing commercial section

> **This section is operator negotiation posture, not client-facing
> contract text.** A future Claude drafting the master agreement must
> not expose these numbers to the client document.

### Package 1 fee targets (R18, supersedes R17)

- **Target:** 320–340M toman.
- **Floor:** 260M toman. Below this, the engagement is not sustainable
  at Shape C scope with solo bus-factor after tooling costs.
- **Tactical opening:** 360M toman. Gives room to negotiate down to
  target without touching the floor.
- **Fallback target:** 280–300M toman (R17 original) if the operator
  deliberately absorbs Claude Code cost (~56M toman over 3 months).

These numbers are effort-priced on ~17 effort-weeks at Generous scope
plus solo-operator risk premium. They are not USD-linked.

If the client can only carry 100–150M toman, the honest move is to
renegotiate Package 1 **scope** (e.g. drop from Generous to Standard),
not the fee.

### Package 2 non-binding budget band

- **500–800M toman** for Shape C scope.
- If operator hires for Package 2: firm number likely 650–800M.
- If solo: firm number likely 500–650M.
- Decision made at the Commerce Pricing Checkpoint.

### Infrastructure pass-through (client-facing, at cost)

Infrastructure is **pass-through at cost**, not bundled into the fee.
The single exception is object storage, which may be bundled for
convenience.

| Item | Cost (Package 1 window, 3 months) | Notes |
| --- | --- | --- |
| Domain `zhicwood.com` (one-time) | ~93M toman ($620 USD × ~150k toman/USD) | Client-owned asset, registered in client's name. Re-verify price at purchase. |
| VPS — Hetzner path | ~11M toman (3 × ~3.75M) | CPX31, post-April 2026 pricing. Hetzner signup from Iran is an open verification item. |
| VPS — ParsVDS domestic path | ~8–12M toman | Priced in IRR directly. |
| VPS — ArvanCloud path | ~40M toman | Materially more expensive. |
| Object storage | ~1–1.5M toman | Hetzner Object Storage EU or domestic S3. |
| Kavenegar SMS credits | ~1M toman one-time | Launch-volume pre-paid bundle. |
| Payment gateway setup | Typically zero | Per-transaction cut from customer payments. |
| **Total (Hetzner path)** | **~108–113M toman** | Dominated by the domain (~80–90% of total). |

Claude Code ($125 USD/month) is **baked into the fee**, never a
pass-through line. It is operator-side tooling.

### Operator action items before signing

1. Re-verify `zhicwood.com` price; register under client's name.
2. Confirm Hetzner signup from Iran or commit to domestic VPS path.
3. Confirm Kavenegar account + test SMS flow.
4. Confirm which payment gateway the business already has.
5. Choose VPS path and write it as a named row with monthly toman
   figure in the client-facing pass-through schedule.

---

## How to change this document

- Small clarifications: edit and ship.
- New packages, new scope, changes to acceptance tests, changes to
  payment triggers, changes to the parallel-workstream structure:
  these need a PR that also updates `README.md` and any downstream
  docs.
- Anything that contradicts `README.md`'s "Locked platform decisions"
  section needs that section updated first.
- Decisions R1–R18 in `_discussion-2026-04-08.md` are the authority
  behind this document. Do not contradict them without a new
  discussion entry.
