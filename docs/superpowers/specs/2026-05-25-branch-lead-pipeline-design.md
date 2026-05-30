# Branch App — Lead Pipeline Spine (L0 + L1)

**Status:** Design spec, awaiting review. Part of the **Zhic Seller Platform**
(the branch-facing app). This is the first sub-project ("the spine"); other
layers (L2+ below) get their own specs and the operator reviews them together
before any implementation plan is written.

**Date:** 2026-05-25
**Mockup (visual source of truth):** `apps/web/public/docs/branch-leads-kanban-mockup.html`

---

## 1. Overview

Turn the storefront into a role-aware app: when branch staff log in, the site
becomes their **workspace**. This first sub-project delivers the **foundation**
(auth + roles + the `/branch` shell — "L0") and the **lead pipeline** ("L1") —
the lowest-friction, highest-value, Discovery-independent slice.

Today a public inquiry is saved to the `inquiries` collection and fires one SMS
to the branch manager — then it's invisible to the people who must act on it.
This sub-project makes those leads **workable inside the app**: a branch logs
in, sees its leads on a Kanban board, claims them from a shared queue, works
them through a reason-split funnel, and marks them won/lost.

## 2. Goals / Non-goals

**Goals**
- Branch staff sign in and see only their branch's leads.
- A claimable shared queue + per-seller assignment.
- A reason-split pipeline (price vs visit) with activity logging and follow-up
  reminders.
- Owner sees the whole branch board and can reassign; HQ sees all branches.
- Zero performance/SEO cost to the public storefront.

**Non-goals (this spec)**
- Real orders / carts / checkout (L2).
- Factors, payments, stock, transfers (L3/L4 — Discovery-gated).
- Appointment-scheduling *engine* with availability/calendars (Package 3).
- Cross-branch analytics beyond a simple branch overview (L5).
- Customer-facing accounts/auth (Package 2, separate track).

## 3. Architecture

**Same-site authenticated route group** in `apps/web` — chosen so the site
literally *becomes* the app, with no separate deploy and full reuse of
`@zhic/ui` + tokens + Ayandeh + the API client.

- New route group `(branch)` → routes under `/branch/*`.
- These routes are **dynamic, `noindex`, never cached**; the public `(site)`
  routes stay static/ISR and CDN-cached exactly as today.
- **Code-splitting** means a public visitor never downloads any `/branch` JS.
- **Middleware** scoped to `/branch/*` only (matcher) gates access; public
  routes keep their static behaviour — no global middleware overhead.
- The public layout must stay free of any authed/heavy client code (no bleed).

**Extraction escape hatch:** if the branch tooling later grows heavy or needs
isolation, the `(branch)` group lifts out into its own app cheaply. Starting
same-site costs nothing and keeps that option open.

## 4. Roles & access

Company-owned branches. Roles reuse `admin-panels.md` §2:

| Role | Maps to | Scope | In the lead spine |
|---|---|---|---|
| **Branch seller** | `showroom_staff` | one branch | Work the shared queue + own leads; claim; log activity; move stages; won/lost |
| **Branch owner** | `showroom_manager` | one branch | Everything a seller does **+** see/assign/reassign all branch leads, branch overview |
| **HQ owner** | `admin` (or curated `owner`) | all branches | Cross-branch visibility + management |

**Branch scoping is the safety rule:** each branch user has a `showroom`
(their branch). The **server enforces** `lead.routed_to == user.showroom` on
every read and write — a branch user cannot read or write another branch's
data. HQ owner is the only cross-branch role.

**Within a branch:** any branch user may **read** all their branch's leads;
a seller may **write** only unclaimed leads (by claiming) or leads assigned to
them; the owner may write/reassign any lead in their branch.

## 5. Authentication

- **Phone + OTP via SMS.ir**, long-lived sessions (default 30 days; re-OTP on
  expiry). Mobile/tablet-friendly, reuses `@zhic/sms`, unifies with the Pkg-2
  customer auth.
- Branch users are Payload `users` extended with: `phone` (unique, login
  identifier), `role`, and `showroom` (relationship → their branch).
- Session is httpOnly-cookie based; middleware validates it on `/branch/*`.
- Login screen at `/branch/login` (phone → OTP code → workspace).

## 6. Data model — extend `inquiries` into a workable lead

`inquiries` already has: `name`, `phone`, `city`, `reason`
(`price_inquiry` | `showroom_visit`), `preferred_date`, `message`,
**`routed_to`** (→ showrooms, set at submit by city routing), `product`,
`productVariant`, `selectedAxes`, and a 3-value `status`.

**Add:**

| Field | Type | Purpose |
|---|---|---|
| `assigned_to` | relationship → users (nullable) | Empty = in the shared queue; set = claimed/assigned |
| `stage` | select (reason-split, see §7) | Replaces the thin 3-value `status`; `status` is migrated into `stage` |
| `activity` | array of { author→users, type (note/call/stage_change/system), body, at } | The timeline — calls, notes, stage moves |
| `next_action_at` | date (nullable) + `next_action_note` text | Follow-up reminder; drives the "due" chip |
| `outcome` | select (won/lost, set when entering a terminal stage) | Won/lost marker |
| `lost_reason` | text (shown when outcome=lost) | Why it was lost |
| `quoted_amount_rials` | number (nullable) | Lightweight value for the "Quote sent" stage (NOT a factor) |

`routed_to` and the existing **SMS-on-submit** routing are unchanged. A
`beforeChange` hook appends a `stage_change` activity entry whenever `stage`
moves, and stamps `assigned_to` when a queued lead leaves `new`.

**Activity as an embedded array** (not a separate collection) for v1 — leads
are low-volume per branch and the timeline is always read with the lead. Revisit
if volume or cross-lead activity queries appear.

## 7. Pipeline — reason-split funnel

A lead's `reason` selects its lane. Both lanes share `new` (the shared queue)
and `contacted`, and both end at `won`/`lost`; they diverge in the middle.

- **استعلام قیمت (`price_inquiry`):** `new → contacted → quote → won | lost`
- **بازدید شوروم (`showroom_visit`):** `new → contacted → booked → visited → won | lost`

`quote` / `booked` / `visited` are stage markers only — no commerce system
behind them. `won` is an outcome marker that **later** (L2/L3) can link to a
real order; in this spec it is just a terminal stage + optional
`quoted_amount_rials`.

## 8. Screens (`/branch`)

1. **`/branch/login`** — phone → OTP → workspace.
2. **`/branch/leads`** — the Kanban board (per the mockup):
   - **Reason tabs** switch between the price board and the visit board (cards
     can't cross reasons).
   - Columns = stages; the **`new` column is the gold-tinted shared queue**;
     unclaimed cards are dashed with a **«برداشتن» (claim)** button.
   - Cards show: name, reason badge, the product/variant asked about, phone
     (LTR), assignee chip, next-action chip (terracotta when due).
   - **Drag** a card between stages (same reason) to advance it; leaving the
     queue auto-claims to the current user.
   - **Owner ↔ Seller view:** owner sees all sellers' cards + reassign; seller
     view focuses the shared queue + their own (others dimmed).
3. **`/branch/leads/[id]`** — lead detail: full context (product/variant/axes,
   message, preferred date), tap-to-call, **activity timeline**, log note / set
   next action, stage controls, claim/assign, won/lost (+ lost reason).
4. **`/branch` (owner) overview** — counts per stage, unclaimed count, per-seller
   load. Deliberately small; it is the seed of the L5 dashboards.

## 9. Notifications

- **Keep** the existing manager SMS on new-lead submit (unchanged).
- **In-app new-lead indicator** on the board (simple refetch/poll for v1; no
  realtime infra).
- **Next-action-due reminder** to the assigned seller (in-app; SMS reminder is
  a later enhancement, not v1).
- No customer-facing SMS in this spine (that's Pkg-2 order SMS territory).

## 10. Discovery independence

This entire spine is buildable **now**, ahead of Month-2 Discovery, because it
introduces **no factor, order, stock, or payment shapes**. `quote`/`won` are
markers; `quoted_amount_rials` is a free number, not an invoice. When L2/L3
land, a `won` lead can be linked to a real order without reworking this model.

## 11. Open questions (for the joint spec review)

1. **HQ owner role:** reuse full `admin`, or add a curated `owner` role with
   cross-branch visibility + management but without dangerous admin powers
   (user/role management, catalog deletion)?
2. **Session length** default (proposed 30 days) — acceptable for shared
   showroom devices, or shorter with device trust?
3. **Seller read scope:** confirm sellers may *read* all branch leads (proposed)
   vs only queue + own.
4. **In-app new-lead delivery:** poll/refetch (proposed v1) vs add realtime
   later.

## 12. References

- Roles/screens baseline: `docs/spec/admin-panels.md` §2, §5.8
- Existing data: `services/api/src/collections/Inquiries.ts`,
  `services/api/src/collections/Showrooms.ts`
- Submit/routing: `apps/web/src/app/actions/submitInquiry.ts`,
  `services/api/` SMS routing (Session 5.1)
- Capability tree + package context: `docs/roadmap.md`, `docs/state.md`
  §"Package 1 — remaining to deliver"
- Mockup: `apps/web/public/docs/branch-leads-kanban-mockup.html`
