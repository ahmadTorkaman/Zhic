# Seller Platform — Discovery Dependency Checklist

**Purpose.** A living, single-place list of the **specific answers** the Zhic
Seller Platform specs depend on before their Discovery-gated shapes can be
**locked**. Each item is a question that must be resolved in **Month-2
Discovery** (per the roadmap's "data-model lock gates"). This is the *checklist*;
the *findings* land in the formal deliverable `docs/discovery/discovery.md`
(and feed its §6 workflow maps + the accountant schema-walk).

**How to use.** Work each item during Discovery; record the answer here (Status
→ ✅ + a one-line answer + a link to the relevant `discovery.md` section), and
only then unfreeze the matching **[provisional]** shape in the spec.

**Provenance.** L1 (lead pipeline) is Discovery-independent — no items. L2
(orders/cart) introduced **D-1…D-13**. L3 (orders/factors/payments) added
**D-14…D-17**. L5 (dashboards) added **D-18…D-20** (CRM specialist + the existing
Power BI sales panel). Later layers (L4 stock, …) will append more (see §"Growing").

**Status legend:** 🔲 open · 🟡 partial · ✅ answered

---

## A. From the legacy-app workflow map  ·  Discovery W2 (P0: order-signing flow)

| ID | Question (what we need to know) | Unblocks | `discovery.md` ref | Status |
|---|---|---|---|---|
| **D-1** | Full **order lifecycle states + transitions** — draft → … → delivered/cancelled, and who may move what | `orders.status`, order desk (L2/L3) | §6.1, §6.5 | 🔲 |
| **D-5** | **Deposit (بیعانه) norms** — do counters take deposits? how is the remaining tracked/refunded? | `deposit_rials`, POS summary, payment ledger | §6.1 | 🔲 |
| **D-6** | **Walk-in / counter-order workflow today** — who places, what's mandatory, how it's signed | POS flow, required fields (L2) | §6.1 | 🔲 |
| **D-7** | **Stock reservation window** (online) + **per-branch availability** (POS) | reservation logic, branch-stock hint | §6.3, §6.4 | 🔲 |
| **D-8** | **Stock transfer flow** — one-step vs two-phase; can a branch sell another branch's stock? | order fulfillment, L4 seam | §6.4 | 🔲 |
| **D-16** | **Fulfillment/delivery lifecycle states** + which transitions notify the customer (Shape C delivery SMS) | `fulfillment_status`, SMS triggers (L3) | §6.6 | 🔲 |
| **D-17** | **Post-issue order rules** — can a factored order be edited/cancelled? what voids it? | order edit/cancel guards (L3) | §6.5, §6.7 | 🔲 |

## B. From the accountant schema-walk  ·  Discovery W4

| ID | Question | Unblocks | `discovery.md` ref | Status |
|---|---|---|---|---|
| **D-2** | **Factor (invoice) numbering format** | `orders.number`, `factors.number` | §6.5 | 🔲 |
| **D-3** | **Factor legal template + tax/VAT fields** | factor PDF, totals | §6.5 | 🔲 |
| **D-4** | **Rial-stored / toman-displayed money model** (validate decision #7) | all `*_rials`, `packages/money` | §6.5 | 🔲 |
| **D-13** | **Returns / adjustment-factor pattern** (seam, so the model doesn't paint into a corner) | order/payment model seams | §6.7 | 🔲 |
| **D-14** | **Factor immutability + adjustment-factor rule** (decision #10) — void/edit vs correct-via-adjustment | `factors.kind`, immutability (L3) | §6.5, §6.7 | 🔲 |
| **D-15** | **Payment reconciliation + refund issuance flow** — how refunds tie to adjustment factors + the money trail | refunds, payment ledger (L3) | §6.7 | 🔲 |

## C. From the owner  ·  pre-build confirmation

| ID | Question | Unblocks | `discovery.md` ref | Status |
|---|---|---|---|---|
| **D-9** | **Which payment gateway** the business already has a merchant account with (ZarinPal / IDPay / Zibal) | `packages/payments` adapter | §6.5 | 🔲 |
| **D-12** | **Per-showroom pricing?** — roadmap says one price list; confirm the legacy app doesn't vary it | price snapshotting, POS | §6.1 | 🔲 |

## D. Discovery + legal

| ID | Question | Unblocks | `discovery.md` ref | Status |
|---|---|---|---|---|
| **D-10** | **Shipping/delivery model** — methods, lead-times per region, cost computation | checkout delivery step, totals (L2) | §6.6 | 🔲 |
| **D-11** | **Customer identity rules** — phone+OTP accounts; guest vs forced-account for walk-ins; Iranian address fields | `customers`, checkout address step (L2) | §6.1, §6.2 | 🔲 |

---

## E. From the CRM specialist + the existing Power BI sales panel  ·  L5 dashboards

L5 is **co-designed with the CRM specialist** (a client-side resource), who has
**already built a Power BI sales panel** intended to be the **live sales
dashboard**. The in-app mockup
(`apps/web/public/docs/branch-dashboard-mockup.html`) is a first pass only — the
real requirements come from the items below.

| ID | Question / task | Unblocks | Source | Status |
|---|---|---|---|---|
| **D-18** | **CRM specialist's full feature/KPI list** — what, beyond the roadmap's named metrics, must the dashboard show? | L5 KPI set + screens | CRM specialist | 🔲 |
| **D-19** | **Review the existing Power BI panel (`.pbix`)** — extract its data sources (Power Query / M), tables + fields + measures, and the visuals/KPIs per page; treat as the requirements baseline for the live sales dashboard | L5 data model, KPI parity, data-source wiring | CRM specialist's `.pbix` (to be provided) | 🟡 awaiting file |
| **D-20** | **Live-dashboard architecture** — is the live sales dashboard the **Power BI panel embedded** (publish-to-web / embed token), a **native in-app build** (parity with the BI), or **hybrid** (native operational view + embedded BI for sales analytics)? | L5 architecture, build-vs-embed effort | Operator + CRM specialist | 🔲 |

> The **CRM specialist** is a team resource not yet listed in `docs/roadmap.md`
> §Team (which names operator + 3D artist + SEO specialist). Worth adding there.

---

## Growing

This checklist grows as later layers are specced:
- **L4 (stock):** expect inventory-valuation method, cycle-count cadence,
  shrinkage handling, factory→showroom intake (`discovery.md` §6.3) — will add
  D-21+.

## Sources of truth

- Formal Discovery deliverable + workflow maps: `docs/discovery/discovery.md`
- Roadmap "data-model lock gates" + decisions #7 (money) / #10 (factor): `docs/roadmap.md`
- Specs that raised these items:
  - L2 — `docs/superpowers/specs/2026-05-25-branch-l2-order-cart-design.md`
  - L3 — `docs/superpowers/specs/2026-05-25-branch-l3-orders-factors-payments-design.md`
