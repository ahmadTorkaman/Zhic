# Seller Platform — L3: Order Lifecycle + Factor + Payments

**Status:** Design spec, awaiting review. Third sub-project of the **Zhic Seller
Platform**, on top of L2's order model
(`2026-05-25-branch-l2-order-cart-design.md`). Reviewed with the other layer
specs before any implementation plan.

**Date:** 2026-05-25
**Design status:** No mockups yet. The order desk (list/detail) and the factor
PDF layout still need a design pass — deferred, flagged in §11.

> ⚠️ **Most Discovery-gated layer.** L3 *is* the commerce machinery the roadmap
> locks against Month-2 Discovery (the accountant schema-walk + the order-signing
> workflow map). This spec defines the shape and the seams; the lifecycle, the
> factor, the tax model, and the gateway are all **[provisional]** until §10.

---

## 1. Overview

L2 *creates* an order. L3 *runs and bills* it:

- **Order lifecycle management** — the order desk: list/filter orders, order
  detail, move an order through its states, track fulfillment.
- **Factor (invoice) generation** — legal factor with numbering, tax fields, and
  a PDF template; immutable once issued, corrected via adjustment-factors.
- **Payments** — record deposits and online payments against an order, verify
  gateway callbacks, track balance/remaining; refunds gated to accountant/admin.

Coherence note: per the L0 decision, the **order desk lives in the custom app**
(`/branch/orders` for branch-scoped users, an HQ cross-branch view) — this
supersedes `admin-panels.md` §5.8's "Order Desk in Payload admin" assumption for
the seller-platform context. Payload admin remains for editors/accountant.

## 2. Goals / Non-goals

**Goals**
- A branch-scoped order desk (list + detail + status transitions) in the app.
- Factor generation wired to the client's numbering + legal template + tax.
- A payment ledger per order (deposit + online), with gateway verify.
- All gateway logic in `packages/payments`; all money in `packages/money`.

**Non-goals (this spec)**
- Order *creation* UI (L2 — POS builder + customer checkout).
- Stock decrement/reservation mechanics (L4) — L3 only *reads* availability.
- Promotions, gift cards, loyalty (Shape C / Pkg 3).
- Cross-branch analytics (L5).
- Courier/routing integration (delivery = manual metadata).

## 3. Architecture

- **Order desk** in `(branch)`: `/branch/orders` (branch-scoped list),
  `/branch/orders/[id]` (detail). HQ owner gets a cross-branch variant
  (`/branch/orders` unscoped, or an HQ overview) — same components, scope from role.
- **Factor service** in `services/api` — generates the factor record + PDF from
  an order; a Payload collection `factors` + a server render route for the PDF.
- **Payments** in `packages/payments` (new) — gateway adapter (verify/redirect);
  payment records on the order; no payment logic anywhere else (repo rule).
- **Customer-facing** (online): order confirmation page, `/account/orders`,
  `/account/invoices` (factor download) — *scope boundary, see §12 Q1.*

## 4. Order lifecycle management

- **List** (`/branch/orders`): columns — order #, customer, channel (walk-in/
  online), branch (HQ view only), total (toman), payment status, fulfillment
  status, date. Filters: status, payment status, channel, branch (HQ), date
  range. **Branch-scoped server-side** (a branch user sees only their branch's
  orders); HQ sees all.
- **Detail** (`/branch/orders/[id]`): lines, customer, payments, factor link,
  notes; **status transition controls** gated by role + current state.
- **`orders.status`** + **`fulfillment_status`** enums are **[provisional]** —
  driven by the Discovery order-lifecycle map (D-1). Transitions log to the
  order's activity trail (reuse L1's activity pattern).

## 5. Factor (invoice) generation

New collection **`factors`** (Discovery-gated marked **[P]**):
| Field | Type | Notes |
|---|---|---|
| `number` | text (unique) | **[P]** numbering format — accountant |
| `order` | rel → orders | one factor per order (+ adjustment factors, below) |
| `issued_at` | date | |
| `kind` | select: `factor` \| `adjustment` | **[P]** adjustment-factor pattern (decision #10) |
| `parent_factor` | rel → factors (nullable) | adjustment → original |
| `line_snapshot` | json | immutable snapshot at issue time |
| `tax_fields` | group | **[P]** VAT + legal fields — accountant |
| `totals_rials` | group | subtotal/tax/total, integer rials |
| `pdf` | upload (generated) | rendered PDF |

- **Immutability:** once issued, a factor is never edited; corrections create an
  **adjustment-factor** referencing the original. **[P]** exact rule = decision
  #10, validated at the accountant schema-walk.
- **PDF** rendered server-side from `line_snapshot` + `tax_fields` via the
  client-provided legal template. **[P]** template.

## 6. Payments

- **`payments`** (array on order or own collection): `amount_rials`, `method`
  (cash/card/gateway/deposit), `at`, `gateway_ref` (nullable), `status`.
- **Walk-in deposit** (بیعانه from L2) records as a payment; balance = total −
  Σ payments.
- **Online**: `packages/payments` adapter does redirect → callback → **verify**
  → mark payment captured → advance order. **[P]** gateway (ZarinPal/IDPay/Zibal
  — D-9).
- **Refunds**: issuance gated to `accountant`/`admin`; ties to an
  adjustment-factor. **[P]** reconciliation/refund flow (D-15). (Full returns
  workflow is Shape B — out of this spec.)

## 7. Customer-facing order experience (boundary — see §12 Q1)

If included in L3: order confirmation, `/account/orders` (status), and
`/account/invoices` (factor PDF download). **Delivery-step SMS** (order
confirmed/dispatched/delivered) is Shape C and depends on the fulfillment states
(D-16) — proposed **out of L3**, into a later slice.

## 8. Roles & access (reuses L1/L2)

- **Branch seller** — view/manage **their branch's** orders; record payments;
  advance status within allowed transitions. Cannot issue refunds.
- **Branch owner** — all branch orders + reassign + approvals.
- **HQ owner** — cross-branch order desk.
- **Refund / adjustment-factor issuance** — `accountant`/`admin` only.
- Server enforces branch scope on every order read/write.

## 9. Discovery-independent vs provisional

**Buildable now (stable shape):**
- The order-desk list/detail UI shell + filters (data-light).
- The payment-ledger shape (amount/method/ref/status) + balance math via
  `packages/money`.
- The `packages/payments` adapter interface (concrete gateway swapped in later).
- Factor *record* shape + PDF render *pipeline* (template slotted in later).

**Provisional — freeze only after Discovery (§10):**
- `orders.status` + `fulfillment_status` enums and transitions.
- Factor numbering, legal template, tax/VAT fields, immutability + adjustment rule.
- Payment reconciliation + refund flow.
- Delivery/fulfillment states + SMS triggers.
- Concrete payment gateway.

## 10. Discovery dependencies (extends the L2 list)

Carries forward **D-1..D-13** from the L2 spec, and adds:

| # | Discovery item | Needed for | Source / when |
|---|---|---|---|
| D-14 | **Factor immutability + adjustment-factor pattern** (decision #10) — can a factor be voided/edited, or only corrected via adjustment? | `factors.kind`, immutability rule | Accountant schema-walk — Discovery W4 |
| D-15 | **Payment reconciliation + refund issuance flow** — how refunds tie to adjustment factors + the money trail | refunds, payment ledger | Accountant — Discovery W4 |
| D-16 | **Fulfillment/delivery lifecycle states + which transitions notify the customer** (Shape C delivery SMS) | `fulfillment_status`, SMS triggers | Legacy-app + owner — Discovery W2 |
| D-17 | **Post-issue order rules** — can a factored order be edited/cancelled? what voids it? | order edit/cancel guards | Accountant + legacy-app — Discovery W2/W4 |

*(D-2 factor numbering, D-3 factor template/tax, D-4 money model, D-9 gateway,
D-13 returns/adjustment seam are the L2 items L3 leans on most heavily.)*

## 11. Design status (open work)

The **order desk** (list + detail) and the **factor PDF** layout need a design
pass — no mockups yet. The desk should match the branch-app chrome (L1/L2); the
factor must satisfy the accountant's legal template (D-3). Deferred, named.

## 12. Open questions (for the joint review)

1. **L3 scope boundary:** does L3 include the **customer-facing** order/invoice
   self-service (`/account/orders`, `/account/invoices`) + delivery SMS, or is
   L3 strictly the back-office (desk + factor + payments) with customer
   self-service as its own slice? (Proposed: back-office only; self-service +
   delivery SMS deferred.)
2. **Order desk home:** confirm it lives in the **custom app** (`/branch` + HQ
   view) per L0, not Payload admin — overriding `admin-panels.md` §5.8 for this
   context.
3. **One factor per order** vs partial/multiple factors (e.g. deposit receipt vs
   final factor)? (Ties to D-5 deposit norms + D-14.)
4. **Payment status model** — derive from the payment ledger (sum vs total), or
   an explicit `payment_status` field kept in sync?

## 13. References

- Roadmap Package 2 Shape A (factor generation, order desk, payment wiring) +
  decision #10 + data-model lock gates: `docs/roadmap.md`
- Order desk baseline + refund gating: `docs/spec/admin-panels.md` §5.8
- L2 order model + Discovery list D-1..D-13:
  `docs/superpowers/specs/2026-05-25-branch-l2-order-cart-design.md`
- L1 activity-trail pattern:
  `docs/superpowers/specs/2026-05-25-branch-lead-pipeline-design.md`
- Money / payments rules: `packages/money`, `packages/payments` (new), roadmap
  "Sequencing rules"
