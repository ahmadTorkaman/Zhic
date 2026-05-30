# Seller Platform — L2: Order & Cart Model (Walk-in Builder + Customer Checkout)

**Status:** Design spec, awaiting review. Second sub-project of the **Zhic Seller
Platform**, following the L1 lead-pipeline spine
(`2026-05-25-branch-lead-pipeline-design.md`). Reviewed together with the other
layer specs before any implementation plan.

**Date:** 2026-05-25
**Mockups (flow reference — NOT final visual design, see §11):**
- Branch POS: `apps/web/public/docs/branch-walkin-order-mockup.html`
- Customer cart: `apps/web/public/docs/customer-cart-checkout-mockup.html`

> ⚠️ **Discovery-gated.** L2 introduces order/factor/stock/payment shapes that
> the roadmap explicitly locks against **Month-2 Discovery** ("data-model lock
> gates"). This spec defines the *shape* and the Discovery-independent surfaces;
> every gate-dependent part is marked **[provisional]** and must not be frozen
> until the inputs in §10 land.

---

## 1. Overview

L2 turns a **won lead into a sale** and gives the storefront a **buy** path.
One order/cart model, two faces:

- **Branch walk-in builder (POS)** — a seller assembles an order for a walk-in
  or phone customer: pick products/variants, quantities, attach customer, take a
  deposit, create the order. Continues straight from a `won` lead (L1 → L2).
  Replaces the legacy app's counter-order entry.
- **Customer cart + checkout** — the public storefront gains add-to-cart and a
  multi-step checkout (cart → address → delivery → payment). The Package-2
  commerce shell; flips the PDP from inquiry-mode to purchase-mode.

Both ride the **same order entity** (line items, totals, customer, branch,
channel, status), differing only in who drives it and the channel tag.

## 2. Goals / Non-goals

**Goals**
- A single order/cart data model serving walk-in and online channels.
- POS flow inside `/branch`, pre-seedable from a won lead.
- Storefront cart + checkout flow.
- Money strictly in rials (integer), displayed in toman — via `packages/money`.
- Clean seams so the Discovery-locked parts (lifecycle, factor, stock) slot in
  without reworking the model.

**Non-goals (this spec)**
- Lead pipeline (L1 — separate spec).
- Real stock ledger / inter-branch transfers (L4).
- Cross-branch analytics (L5).
- Promotions, gift cards, loyalty (Package 2 Shape C / Package 3).
- Courier/routing integration (delivery is manual metadata).

## 3. Architecture

- **POS** lives in the `(branch)` route group (`/branch/orders/new`,
  `/branch/orders/[id]`) — authed, `noindex`, branch-scoped, same chrome as L1.
- **Customer cart/checkout** lives in the public `(site)` group
  (`/cart`, `/checkout/*`) — but the cart/checkout steps are **dynamic + private**
  (per-session), so they sit behind the same caching discipline as other dynamic
  routes; the catalog stays static/ISR.
- **Shared order model** in `services/api` (Payload collections) + a typed
  client in `apps/web/src/lib`. All money math via `packages/money`; no money
  logic anywhere else.
- **Customer auth** for online checkout = phone + OTP (Package 2 customer
  accounts), the same mechanism chosen for branch staff in L1.

## 4. Shared data model

New Payload collections (Discovery-gated fields marked **[P]**):

**`orders`**
| Field | Type | Notes |
|---|---|---|
| `number` | text | Human order ref. **[P]** format from accountant (factor numbering) |
| `channel` | select: `walk_in` \| `online` | Drives which face created it |
| `branch` | rel → showrooms | Walk-in: seller's branch; online: fulfilling/nearest branch (rule TBD) |
| `customer` | rel → customers (nullable) | Online: the account; walk-in: created/attached at counter |
| `created_by` | rel → users (nullable) | The seller, for walk-in |
| `source_lead` | rel → inquiries (nullable) | The won lead this came from (L1→L2 link) |
| `lines` | array of order-line (below) | |
| `subtotal_rials` | number | Σ line totals |
| `total_rials` | number | subtotal − discount + shipping (Shape C/B parts later) |
| `deposit_rials` | number | بیعانه taken at counter / online partial **[P]** (deposit norms) |
| `status` | select | **[P]** lifecycle states from legacy-app workflow map |
| `notes` | textarea | |

**order-line** (array on `orders`)
| Field | Type | Notes |
|---|---|---|
| `product` | rel → products | |
| `productVariant` | rel → product-variants (nullable) | |
| `selectedAxes` | json | snapshot of the chosen axes |
| `unit_price_rials` | number | snapshot at add-time |
| `qty` | number | |
| `line_total_rials` | number | unit × qty |
| `note` | text (nullable) | per-line note |

**`carts`** (online, session/account-scoped) — same line shape as orders;
converts to an `order` at checkout. Walk-in skips the cart (the builder *is*
the cart, materialized directly into a draft order).

**`customers`** — phone (unique), name, addresses[] (Iranian address fields).
Shared by online accounts and walk-in attach. **[P]** exact address fields +
guest-vs-account rules from Discovery.

**Money:** every `*_rials` is integer rials; display converts to toman via
`packages/money`. **[P]** money model validated at accountant schema-walk.

## 5. Branch walk-in builder (POS) — flow

1. Entry: from a `won` lead's **"ساخت سفارش"** (pre-seeds customer + the
   product/variant they inquired about), or a blank `/branch/orders/new`.
2. **Attach customer** (from lead, lookup by phone, or create).
3. **Add products** — search-then-add from the catalog; pick variant/axes; qty.
   **[P]** optional branch-stock/availability hint when stock model exists (L4).
4. **Summary** — subtotal → total; **deposit (بیعانه)** input → remaining.
   **[P]** deposit norms + partial-payment handling.
5. **Create order** → draft order in the seller's branch, channel `walk_in`.
   **[P]** factor issuance happens on/after create per the accountant template.
6. Order detail `/branch/orders/[id]` — view/edit lines, record payment, advance
   status. **[P]** statuses + transitions.

## 6. Customer cart + checkout — flow

1. PDP gains **"افزودن به سبد"** (purchase-mode flip). Add product/variant → `cart`.
2. **`/cart`** — line items (image, variant chips, qty, line total), summary
   (subtotal; shipping deferred), **"ادامه و تکمیل آدرس"**.
3. **`/checkout`** steps: **address → delivery → payment**.
   - Address: phone+OTP account, saved Iranian addresses. **[P]** address fields.
   - Delivery: method + promised-date metadata (manual; no courier API).
     **[P]** shipping-cost model + lead-times-per-region.
   - Payment: **[P]** gateway — ZarinPal assumed, confirm the business's actual
     merchant account. Redirect → verify → order created (channel `online`).
4. Confirmation + factor PDF. **[P]** factor template/numbering/tax.

## 7. Payments

All gateway logic in `packages/payments` (repo rule — no payment logic
elsewhere). **[P]** gateway choice (ZarinPal / IDPay / Zibal — whichever the
business already has). Walk-in deposits and online payments both record against
the order's payment ledger (shape: amount_rials, method, at, ref).

## 8. Discovery-independent vs provisional

**Buildable now (shape is stable):**
- The order-line model + cart assembly UX (both faces).
- Won-lead → order hand-off.
- Product/variant/axes selection + price snapshotting.
- `packages/money` rial↔toman throughout.

**Provisional — do not freeze until Discovery (see §10):**
- `orders.status` lifecycle + transitions.
- Factor numbering, legal template, tax/VAT fields.
- Deposit / partial-payment norms.
- Stock reservation (online) + per-branch availability (POS).
- Shipping-cost model + region lead times.
- Payment gateway specifics.
- Guest-vs-account rules for walk-in customers.

## 9. Roles & access (reuses L1)

- **Branch seller / owner** — create/manage walk-in orders **for their branch
  only** (server-enforced scope). Owner sees all branch orders; seller sees own +
  branch per the L1 read rule.
- **HQ owner** — cross-branch order visibility.
- **Customer** — own cart + own orders only.
- Refund/adjustment issuance gated to `accountant`/`admin` (per
  `admin-panels.md` §5.8) — refunds themselves are Shape B, out of this spec.

## 10. Discovery dependencies — the list

These must be answered in **Month-2 Discovery** before the matching shapes lock.
Each maps to a roadmap "data-model lock gate" where noted.

| # | Discovery item | Needed for | Source / when |
|---|---|---|---|
| D-1 | **Order lifecycle states + transitions** (the full state machine: draft → … → delivered/cancelled, who can move what) | `orders.status`, both faces, order detail | Legacy-app workflow map — Discovery W2 (P0: order-signing flow) |
| D-2 | **Factor (invoice) numbering format** | `orders.number`, factor PDF | Accountant schema-walk — Discovery W4 |
| D-3 | **Factor legal template + tax/VAT fields** | factor generation, totals | Accountant — Discovery W4 |
| D-4 | **Rial-stored / toman-displayed money model** (validation of decision #7) | all `*_rials`, `packages/money` | Accountant — Discovery W4 |
| D-5 | **Deposit / partial-payment norms** (do counters take بیعانه? how is remaining tracked, refunded?) | `deposit_rials`, payment ledger, POS summary | Legacy-app + owner — Discovery W2 |
| D-6 | **Walk-in / counter-order workflow today** (who places, what's mandatory, signing) | POS flow §5, required fields | Legacy-app workflow map — Discovery W2 (P0) |
| D-7 | **Stock reservation window** (online checkout) + **per-branch availability** (POS) | reservation logic, branch-stock hint | Legacy-app behavior — Discovery W2 (Shape B/C) |
| D-8 | **Stock transfer flow** (one-step vs two-phase) — affects whether POS can sell from another branch's stock | order fulfillment, L4 seam | Legacy-app — Discovery W2 |
| D-9 | **Payment gateway** the business already has a merchant account with | `packages/payments` adapter | Owner — pre-build confirm |
| D-10 | **Shipping/delivery model** — methods, lead-times per region, cost computation | checkout delivery step, totals | Discovery + owner |
| D-11 | **Customer identity rules** — phone+OTP accounts; guest vs forced-account for walk-ins; Iranian address fields | `customers`, checkout address step | Discovery + accountant (legal) |
| D-12 | **Per-showroom pricing?** (roadmap says one price list; confirm legacy app doesn't vary) | price snapshotting, POS | Discovery; raise with owner if it differs |
| D-13 | **Returns / adjustment-factor pattern** (forward-looking; affects order/payment shape so we don't paint into a corner) | order/payment model seams | Accountant schema-walk — Discovery W4 |

## 11. Design status (open work)

The two mockups are **flow/interaction references, not final visual designs.**
A dedicated **design pass** for the POS builder and the cart/checkout pages is
still owed (matching the storefront's luxury aesthetic + the branch-app chrome,
per the UI-unification token pass). Acknowledged and deferred — fine for now;
not a blocker to writing this spec, but it is a named task before/within
implementation.

## 12. Open questions (for the joint review)

1. **Online order → branch attribution:** which branch "owns" an online order
   (nearest by city? a central e-commerce branch? unassigned?) — affects
   dashboards + fulfillment.
2. **Cart persistence:** session-only until login, then merge to account (as the
   roadmap's commerce shell suggests) — confirm.
3. **Walk-in customer creation:** always create a `customers` record, or allow a
   nameless quick-sale? (ties to D-11.)
4. **Shipping estimate in cart** vs deferred to address step (mockup defers it).

## 13. References

- Roadmap commerce scope + data-model lock gates: `docs/roadmap.md`
  (Package 2 Shape A/B/C; "Data-model lock gates")
- Roles / order desk: `docs/spec/admin-panels.md` §2, §5.8
- L1 spec (lead → order hand-off): `docs/superpowers/specs/2026-05-25-branch-lead-pipeline-design.md`
- Money rules: `packages/money`, roadmap "Sequencing rules"
- Mockups: `branch-walkin-order-mockup.html`, `customer-cart-checkout-mockup.html`
