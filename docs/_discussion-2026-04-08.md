# Discussion notes — 2026-04-08

**Status:** working notes, not canonical. This file exists so the
conversation about commercial scope, master roadmap shape, and the
unilateral decisions Claude made during the doc rewrites can be
picked up on a different machine. Delete or fold into the real
roadmap once decisions are made.

**Working agreement (set 2026-04-08):** the entire discussion is
captured in *this* file as it happens — questions, answers, decisions,
rejected options, all of it. No edits to other docs during the
discussion. Once this file is complete, a **separate fresh Claude
session** will be opened with the sole job of reading this file and
applying the resulting decisions to the real docs (`roadmap.md`,
`data-schemas.md`, `architecture.md`, `design-system.md`, etc.). So
write decisions in this file in a form that's unambiguous for a
future Claude with no conversation memory.

---

## Things Claude decided unilaterally that have real consequences

Each decision is marked:
- 🔴 needs your call
- 🟡 reasonable default but reversible
- 🟢 follows from a locked decision in README

### A. Locale & content rules

1. **🔴 ASCII slugs over Persian content.** Defended as a UX/SEO
   tradeoff (in-app browsers mangle Persian URLs, percent-encoded
   slugs hurt CTR). Counter-argument: Persian slugs are the modern
   Persian-web norm and Google.ir handles them fine now. **Brand-
   perception call as much as a technical one.** If Zhic's audience
   is primarily 35+ on instant messengers → ASCII wins. If primarily
   25–35 native-mobile-Persian → Persian slugs may feel more native.
2. **🔴 Persian font choice: Estedad / Vazirmatn (free, self-hosted).**
   Picked free Persian faces because they work, self-host cleanly,
   and avoid licensing risk. A paid Persian face (IRANSans, Sahel,
   Yekan Bakh, custom) would cost money and need a license check
   but might be a brand differentiator. **Budget question for the
   deal.**
3. **🟡 Persian voice rules** (formal-but-warm "شما", ZWNJ everywhere,
   no Arabic register, Persian quotation marks). Real editorial style
   decision. Zhic's existing copy and Instagram captions are the
   source of truth Claude doesn't have. Don't lock until we read the
   brand's actual voice.
4. **🟡 Saffron `#C68A2E` to replace "gold" as the rare-accent color.**
   Pure invention. A grounded, Iran-referencing pick — but the brand
   may already have its own accent color in its logo / showroom
   signage that we should match.
5. **🟢 RTL with logical properties everywhere.** Follows from
   Persian-first.

### B. Data-model commitments (most expensive to change later)

6. **🔴 Multi-schema Postgres split** (`public`/`commerce`/`crm`/`erp`/
   `mes`/`content`). Real architectural commitment. The alternative
   is one flat schema. Multi-schema is cleaner long-term but harder
   for operators who eventually need to write SQL ad-hoc. **Worth
   discussing because it constrains how migrations work and how the
   team thinks about ownership.**
7. **🔴 Money stored as integer rials with `Rials` suffix, displayed
   as toman.** Right answer technically, but training implications:
   every developer, every accountant looking at the database, every
   CSV export will see rials. Toman-in-display is a strict discipline.
   **The accountant we'll work with in Phase 5 may push back** — if
   the existing accounting software exports toman, we'll need a
   translation layer.
8. **🟡 Phone-as-customer-PK; merging two customers is admin-only
   manual.** The "merging" rule matters: in real businesses, the
   same person walks into two showrooms over five years and ends up
   as two customer records. Without an automated merge UX, that
   becomes painful. We should plan this UX.
9. **🔴 Order lifecycle states:** `draft → placed → confirmed →
   in_production → ready → out_for_delivery → delivered`. Made up.
   **Discovery should overwrite this.** Whatever the existing
   showroom managers app calls these states is what we should match,
   because that's the staff vocabulary. Currently sitting in
   `data-schemas.md` as if it's locked.
10. **🟡 Factor immutability + adjustment-factor pattern.** Legally
    correct for Iran's tax framework as Claude understands it, but
    not a tax lawyer. **The accountant has to confirm this is how
    their existing process works.** If they currently edit invoices
    in place, our model will feel alien.
11. **🟡 Per-showroom factor numbering (`HAM-1404-0001`).** Assumed
    showroom-scoped sequences. The business may use a single global
    sequence, or year-scoped, or something weirder. **Client must
    provide.** Noted as `siteSettings.invoiceNumberFormat` reserved-
    but-empty, which is right.
12. **🔴 Stock transfers two-phase confirm (dispatched → received).**
    Reasonable, but adds friction. The existing app might use
    single-step transfers and the staff might find two-phase
    annoying. Discovery decides.
13. **🟡 Iranian address fields** (province/city/district/street/
    plaque/unit/postal). Standard, but courier APIs (Tipax, Snapp
    Box, regional couriers) have their own field shapes — we may
    need to match theirs to reduce delivery integration friction.

### C. Operator-screen scope (admin vs apps/crm)

14. **🔴 What lives in Payload admin vs what graduates to `apps/crm`.**
    Order desk, factor desk, stock manager, walk-in workflow placed
    in Payload admin (Phases 1–4); anything deeper waits for
    Discovery. **Single biggest scope question for the deal.** If
    the contract says "we deliver a CRM," the client expects
    `apps/crm`. If we plan to do half of CRM as Payload custom views,
    we have to be honest about what feels different.
15. **🟡 2FA required for `accountant` role.** Reasonable, but adds
    friction for an accountant who's used to just-a-password.
16. **🔴 Showroom-scoped visibility** (a `showroom_manager` sees
    only their showroom's data). Security boundary asserted without
    confirmation. The owner / HQ may want managers to see each
    other's data to encourage healthy competition or shared
    accountability. **Cultural/management question, not technical.**

### D. Iran-specific stack picks

17. **🟡 Kavenegar as first SMS provider.** Already in README. Fine.
18. **🟡 Neshan and Balad as Iranian map services.** Real, but the
    brand may prefer Google Maps embeds (works with VPN) or have an
    existing Neshan business listing already.
19. **🔴 Tipax mentioned as a delivery carrier enum value.** Pure
    assumption. The business probably has its own delivery contracts
    or in-house drivers. Discovery.
20. **🟡 No Google Fonts ever — self-hosted Persian + Latin only.**
    Locked in README. Good.
21. **🟡 Telegram / Eitaa / Bale as in-app browsers to test.**
    Reasonable list for Iran in 2026.
22. **🔴 Persian / Arabic character normalization at write-time.**
    Real opinion. Cost: every Payload field hook runs a normalization.
    Benefit: search consistency, no `ي` vs `ی` bugs in customer
    search. Worth doing, but worth budgeting time for.

### E. Phasing assumptions

23. **🟡 PDP CTA flip "استعلام قیمت" → "افزودن به سبد" at Phase 3.**
    Implied by README; made concrete. Worth discussing because it
    has UX implications: in Phase 1–2, the PDP is essentially a
    brochure. In Phase 3, it becomes a real shop. The visual design
    should accommodate both modes from day one.
24. **🟡 Plausible only, no consent banner needed for Iranian users
    (only EU).** Defensible. But a consent banner is also good
    practice if the team is in EU jurisdictions ever.
25. **🟡 Editor sign-off workflow stays exactly as-is from the
    previous spec.** Locked in README. Fine.

---

## What we should discuss (in order)

### Thread 1: The commercial shape of the deal

Before we touch the master roadmap, understand the deal mechanics:

- **Is this fixed-price-per-phase, time-and-materials, or a retainer
  + milestone hybrid?** The roadmap shape changes massively depending.
- **Who owns Discovery — you, or a client team member alongside
  you?** If it's just you, Discovery is a billable milestone in
  itself. If the client has someone, it's a joint deliverable on a
  shared timeline.
- **Does the client expect a "launch date" they can announce
  externally?** That changes whether the storefront launches at end
  of Phase 1 (bare-bones, no checkout) or end of Phase 3 (real shop).
  Both are defensible — but you can only promise one publicly.
- **Is the business already running today, generating revenue, or
  is this also their first "real" online presence?** If they have
  an existing customer flow, we have to keep it running while we
  build. If they're starting fresh, we have more room.
- **What's the team size on your side?** Solo, with a designer,
  with a 3D artist, with another dev? The roadmap and the workpackage
  shape depend on this.

### Thread 2: Master roadmap as commercial milestones, not technical phases

**Opinion: the existing `roadmap.md` has 8 technical phases. That's
the wrong shape for a client contract.** Clients don't pay against
"Phase 0 — Alignment." They pay against deliverables they can see.

Collapse the 8 phases into 4–5 **commercial milestones**, each
containing multiple internal technical phases, each with:

- A user-visible deliverable
- A defined acceptance test (so the client can sign off and you
  can invoice)
- A list of out-of-scope items (so scope creep is contractual,
  not informal)
- A duration estimate (rough, with a buffer band, not a date)
- A payment trigger

Rough sketch (refine together):

| Milestone | What the client sees | Acceptance test | Roughly equivalent to |
| --- | --- | --- | --- |
| **M1 — Foundations & Discovery** | Filled-in `discovery.md`, locked design system in Persian, locked data schemas, monorepo skeleton, hosting stood up, all "Phase 0 verification" items confirmed (Hetzner, TLS, SMS, payments) | Stakeholder reads the docs and the Figma + can describe what they're getting; staging VPS reachable; one test SMS delivered; one test rial payment captured against staging | Phases 0 + 0.5 |
| **M2 — Storefront live (Persian, lead-gen)** | Real Persian storefront on `zhic.ir` with catalog, journal, showrooms, contact, inquiry flow. No checkout. | A non-developer edits a product in admin, it appears live within 10 minutes; Lighthouse 95+; Search Console submitted; first organic Persian impressions captured | Phases 1 + 2 |
| **M3 — Real shop (commerce + factors)** | Customers can register, place orders, pay through an Iranian gateway, receive a legal factor; showroom staff can place walk-in orders from admin; accountant can issue and adjust factors | One real test customer completes an end-to-end order with a real rial payment, gets the SMS, gets a printable factor; a showroom staff member places one walk-in order; the accountant signs off on the factor format | Phase 3 |
| **M4 — Operator app (`apps/crm`)** | Showroom managers and sales staff use a dedicated app for their daily workflow, sized to what Discovery surfaced | A showroom manager uses `apps/crm` for one full week without falling back to Excel / WhatsApp for the workflows the existing app handled | Phase 4 |
| **M5 — ERP & MES** | Accountant closes a month from `apps/erp`; factory runs a batch from `apps/mes` | The accountant signs off on a real month-end close; one production batch runs end-to-end | Phases 5 + 6 |

Each milestone becomes its own detail-tree roadmap document. Inside
M3, you have sub-roadmaps for `packages/auth`, `packages/payments`,
`packages/invoices`, the checkout flow, the order desk, etc. Each
sub-roadmap has its own checklist, its own dependencies, and
(importantly) its own "what does done look like" section.

**Strong opinion: the deal should not commit beyond M3 in the first
contract.** M4–M5 should be in the master plan but explicitly
out-of-scope for the first contract, scoped as a follow-on. Reasons:

- M4 (CRM) depends on Discovery findings you can't see yet. You
  don't know what you're building.
- M5 (ERP/MES) depends on the accountant relationship and the
  factory relationship that probably haven't started yet.
- Committing to a fixed-price M5 today is how consultants go bankrupt.

### Thread 3: The risks we should price in

Things to name in the contract as "risks the client owns" or
"buffers we're keeping":

- Hetzner / TLS / payments / SMS verification all working from
  inside Iran (Phase 0 must close all of these or M1 doesn't pass)
- The existing showroom managers app may have no export. Migration
  may be manual.
- The factor numbering format and tax fields may take longer than
  expected to finalize because the accountant is busy.
- Core Web Vitals from inside Iran will be worse than
  Lighthouse-from-CI shows. We need real-user data before we promise
  specific numbers to the client.
- Discovery may surface workflows nobody mentioned that would push
  M4 scope significantly.

### Thread 4: The "what's the MVP of M2 / M3" question

Inside each milestone, there are sub-decisions about how minimal
"minimal" really is. For M2 (storefront), minimal could be:

- **Skinny:** home, catalog, one PDP template, contact, three
  showrooms, no journal, no events.
- **Standard:** what `roadmap.md` Phase 1+2 currently describes.
- **Generous:** includes the journal pillar pages, FAQ, care,
  atelier — all the editorial surfaces.

Skinny ships in half the time but feels half-built. Generous takes
a quarter longer and feels complete. **Pick a target per milestone
before signing.** Default: "Standard" but with the caveat that any
item the client wants to keep can be cut to Skinny if the schedule
slips.

---

## Resolved decisions (for the fresh-session Claude to apply)

This section is the actual deliverable of this discussion file. Each
entry is written so a Claude with no memory of the conversation can
act on it. Order is the order decisions were made, not priority.

### R1 — Pricing model: hybrid, milestone-by-milestone fixed price

**Decision.** The deal is structured as a **master agreement** that
names M1–M5 as the shape of the work, plus a **per-milestone fixed-
price addendum** signed before each milestone begins. Only the *next*
milestone is ever firmly priced.

- M1 is fixed-price up front (includes Discovery).
- M2 is fixed-priced after M1 closes, using Discovery findings.
- M3 is fixed-priced after M2 closes.
- **M4 and M5 are deliberately un-priced in the master agreement.**
  They appear as named milestones with scope sketches but no number.
  They are scoped and priced only after M3 closes.
- The master agreement may include **non-binding budget bands** for
  M2–M5 ("M2 expected in the range X–Y, to be confirmed after M1")
  so the client has rough financial planning visibility without us
  committing to a number we can't honor.

**Why.** Pure fixed-price punishes us for every Discovery surprise
(forces 40% padding or a death-march). Pure T&M punishes the client
(no ceiling, no predictability). Hybrid gives the client a ceiling
per milestone and gives us an exit ramp every milestone. It also
makes Discovery the thing that unlocks the next price, which is the
correct incentive.

**How a future Claude should apply this.**
- `roadmap.md` should describe milestones as **commercial milestones
  with acceptance tests and payment triggers**, not as open-ended
  technical phases.
- Each milestone doc should have an explicit "what's needed to price
  the next milestone" section, because that's the gating artifact.
- Do not write fixed scopes for M4/M5 in `roadmap.md`. Write them as
  "scope sketch, to be detailed after M3 closes."
- The contract template (if we ever write one in `docs/`) follows
  this structure: master agreement + per-milestone addendum.

### R2 — Discovery ownership: solo lead, with a likely client counterpart; full DB access confirmed

**Decision.** The dev side of Discovery is **led solo** (the operator
of this repo runs it). The client side is **likely Case B**: a
designated counterpart on the client's side — described as "the
nephew or similar," meaning a non-technical but trusted intermediary
with informal authority — *may* be available to coordinate access to
showroom managers, the accountant, and the factory.

**Critical confirmed fact.** The operator has been promised **both
UI and database access** to the existing showroom managers app. This
removes the single biggest Discovery risk (reverse-engineering the
app from screenshots only).

**Why this matters for the roadmap.**
- M1 is sized assuming **a focused database-dump + schema-analysis
  pass** is feasible, not a screen-by-screen UI reconstruction. M1
  budget can stay tight (closer to 3–4 weeks of Discovery work, not
  6).
- The "client Discovery lead" is **soft, not contractually committed
  yet**. The contract should still include cooperation clauses that
  bind the client regardless of whether the counterpart materializes
  (interview-hour commitments, response-time SLAs on Discovery
  questions).
- If the counterpart materializes and is real, get their name into
  the M1 addendum as the "client Discovery lead."

**How a future Claude should apply this.**
- `discovery.md` should be rewritten assuming **DB access is
  available from day one**. Add a top-level Discovery task: "obtain
  read-only credentials + schema dump of the existing showroom
  managers app within the first 5 working days of M1." This is the
  Discovery critical path.
- `discovery.md` should keep a UI-walkthrough track in parallel for
  workflows that aren't visible in the schema (printing, exports,
  daily rituals) — schema tells you data, UI tells you process.
- The roadmap's M1 section should call out the cooperation clauses
  the contract must include (named counterpart if available;
  interview-hour commitment; response-time SLA on Discovery questions;
  who introduces the operator to the accountant and on what date).
- Do not assume the counterpart will exist. Plan as if Case A and
  treat Case B as upside.

### R3 — Public launch posture: M2 ships internally, loud launch likely at M3 (quiet remains a fallback)

**Decision.** The build is treated as **internal until end of M3**.
M2 is *not* publicly announced. The site can be reachable on
`zhic.ir` during M2 (so the client and staff can use it, indexing
can warm up, real-user performance data can be collected from inside
Iran), but **no marketing push, no Instagram announcement, no
showroom signage pointing to it during M2**.

The loud public launch is **planned for end of M3**, when there is
real online ordering to announce. The framing is "you can now buy
Zhic online," which is genuine news. The client has the assets to
amplify it: established **showroom foot-traffic**, an **Instagram
audience**, and a **competent advertising lead** on their side.

A **quiet launch at M3** remains an explicitly allowed fallback if
M3 closes in a state where the team is not confident enough for the
amplification spend (e.g. payments stable but not battle-tested,
inventory accuracy unproven, factor flow still being refined with
the accountant). The decision between loud and quiet is made *at M3
acceptance*, not now.

The "two-launch" pattern (M2 as brand-site launch + M3 as shop
launch) is **rejected** for this deal: the client's preference is
internal-until-real-shop, and splitting the marketing moment dilutes
the M3 announcement without a clear payoff.

**Why.** Furniture is a high-consideration purchase; the M3
announcement is the one that actually changes the customer's behavior
("I can buy from my phone now"). Burning marketing oxygen on an M2
brand-site launch would compete with that. The client's marketing
muscle (Instagram, ad lead, foot-traffic) is the asset we're saving
for the moment that matters most.

**How a future Claude should apply this.**
- `roadmap.md` M2 acceptance criteria must include "site is
  reachable on `zhic.ir` and indexable" but **must not** include any
  marketing-launch deliverable, press-style copy, or announcement
  assets. M2 acceptance is **internal sign-off only**.
- M2 should still ship the **inquiry flow / "استعلام قیمت" CTA**
  cleanly enough that a customer who finds the site organically
  during the M2 → M3 gap has a working path to convert. Organic
  discovery during the internal phase is allowed, just not amplified.
- M3 acceptance criteria must include a **launch-readiness checklist**
  (payments dry-run with real rials, factor sign-off from the
  accountant, an inventory accuracy spot-check, a Persian-RUM
  performance pass from inside Iran on the top customer ISPs) and
  the launch decision (loud vs. quiet) is made against that checklist
  *at M3 close*, not committed in advance.
- The M3 milestone doc should include a **"launch artifacts" sub-
  scope** the client's ad lead owns: announcement copy, Instagram
  asset, in-showroom signage. This is a *client deliverable*, not
  ours, but it must be named in the addendum so we don't end up
  responsible for it.
- The CTA flip at M3 (decision #23 in the unilateral list) is
  confirmed: the PDP runs in **inquiry mode** through M2 and flips
  to **purchase mode** at M3 cutover. The visual design must
  accommodate both modes from day one — see future Section A
  resolutions.

### R4 — Existing business state: thriving brand, daily-use legacy app, "dead-and-leaking" digital side

**Decision (current understanding, to be sharpened in Discovery).**
The business itself is **strong and growing** — described as a
"pumping brand" with active showrooms, real foot-traffic, and a real
operational tempo. The **digital side is in poor health**: the
existing showroom managers app is described as "dead and leaking"
*as a system* (under-invested, decaying, not a source of truth for
everything) but is in **daily use** for at least one critical
workflow — **getting orders signed**. The app's full feature scope
is **not yet known** and is itself a Discovery deliverable.

This is a **World A / World B hybrid**: business reality is World A
(busy, can't be disrupted), digital reality is World B (informal,
partial, habits live outside the app).

**Implications that lock in now.**

1. **No flag-day cutover.** The old app cannot be turned off on a
   single date. Order-signing flows through it daily, and "stop
   signing orders for a week while we migrate" is not a real option
   for a thriving showroom business. Cutover must be **staged and
   parallel-run** for at least one critical workflow (order signing)
   for a defined overlap period.
2. **Discovery must produce a feature inventory of the existing
   app, not just a schema dump.** Schema tells us what data exists.
   The "what does this app actually let staff do day-to-day, and how
   often" inventory is a separate Discovery deliverable and is the
   one that gates M3 scope, because M3 has to *match or exceed* the
   workflows the legacy app currently provides — otherwise staff
   will refuse to switch.
3. **The order-signing flow is a P0 Discovery target.** It is the
   one workflow we *know* is load-bearing today. Map it before
   anything else: who signs, on what device, in what physical
   context (in-showroom on a shared tablet? on the manager's
   personal phone? on a desktop in the back office?), what triggers
   the signing event, and what happens to the signed order
   afterwards (printed? exported? handed to the factory?).
4. **Migration is a real line item, not a footnote.** The contract
   should treat data + workflow migration from the legacy app as a
   **named scope inside M3** (or possibly straddling M2 → M3), with
   its own acceptance test ("for two consecutive weeks, every order
   that is signed in the legacy app is also reflected correctly in
   the new system, and at the end of that period the legacy app is
   read-only").
5. **The brand strength is an asset to protect, not a problem to
   solve.** Marketing momentum already exists (Instagram, ad lead,
   foot-traffic). The platform's job is to **not break that
   momentum** during the build. Anything we ship publicly during M2
   or M3 must meet the brand's existing quality bar — a half-built
   site that goes live early would damage a brand that's currently
   doing fine without us. This reinforces R3 (internal until M3).
6. **"Dead and leaking" reframed as opportunity.** The existing
   digital tool is unloved, which means **staff are unlikely to
   defend it emotionally**. Migration resistance will not come from
   "we love the old tool" — it will come from "we don't want to
   learn anything new while we're busy." That's a training problem,
   not a politics problem. Plan training time, not stakeholder
   management time.

**How a future Claude should apply this.**
- `discovery.md` must add an explicit section on **legacy-app
  feature inventory**, separate from schema analysis. The deliverable
  is a list of every workflow the existing app supports, ranked by
  how often staff use it, with at least one observed example per
  workflow.
- `roadmap.md` M1 (Discovery) deliverables must include the
  order-signing flow as a P0 mapped workflow before M1 can close.
- `roadmap.md` M3 must include a **parallel-running / staged-cutover
  sub-scope** for the order-signing flow (and any other workflows
  Discovery surfaces as load-bearing) with an explicit overlap
  period and an explicit "legacy app goes read-only" date.
- `roadmap.md` M3 must include **staff training as a named
  deliverable**, not an afterthought. Even if it's small (one
  on-site session per showroom, plus a Persian-language quick-start
  doc), it has to be in the addendum so the time is paid for.
- The brand-quality bar is now an explicit constraint on every
  customer-facing surface during M2 and M3: nothing ships publicly
  that would embarrass a brand the client describes as "pumping."

### R5 — Team shape: solo dev + solo designer (same person), with a 3D artist and an SEO specialist on call

**Decision.** The team is:

- **Operator (this repo's owner) — solo on dev, solo on design.**
  Self-described as "the aesthetic guy as much as the technical
  guy," meaning visual / brand / UI work stays in-house with the
  same person doing the build. **No external designer is to be
  budgeted.** Future Claude must not propose hiring a designer or
  treating design as a subcontracted gap.
- **3D artist — available, described as "good."** Not on the dev
  team, but reachable as a specialist for product 3D. This is a
  meaningful asset for a furniture brand and should be used.
- **SEO specialist — available.** Not on the dev team, but reachable
  as a specialist counterpart for everything in `seo.md`. This means
  SEO work has an external owner who can be coordinated with, not
  just a checklist for the operator to execute.

**What this unlocks.**

1. **Design coherence is not a risk.** The single-person dev/design
   model is the *fastest* way to get a coherent visual language out
   the door — there's no handoff, no Figma-to-code drift, no "the
   designer drew it but it's not implementable" loop. The
   `design-system.md` becomes the operator's own working document,
   not a contract between two roles.
2. **3D becomes a real option for PDPs.** With a competent 3D artist
   already in the picture, **3D product views on PDPs move from
   stretch goal to "in scope, decide which products."** Not every
   product needs 3D — pick the hero / signature pieces per
   collection, treat 3D as a feature of high-margin lines, keep
   long-tail SKUs on photography. This needs a real conversation
   about pipeline (glTF? Polycam? Blender → web export?), file
   sizes (Iranian mobile bandwidth is the constraint, not desktop),
   and *who owns the 3D-to-web pipeline* (probably the operator,
   not the 3D artist).
3. **SEO has a counterpart, not just a checklist.** The work in
   `seo.md` (Persian keyword research, URL strategy, schema markup,
   internal linking) can be **co-owned** with the SEO specialist
   instead of being one more thing the operator does alone.
   Specifically: keyword research, content strategy for the journal
   pillar pages, and competitive analysis are SEO-specialist work;
   technical SEO (sitemap, schema, performance, canonical tags,
   hreflang if it ever appears) stays with the operator because it
   lives in the code.
4. **Bus-factor risk concentrates on the operator.** With dev +
   design + technical SEO + integrations all on one person, the
   contract needs an explicit "operator unavailability" clause:
   if the operator is out for more than ~2 weeks, milestone dates
   extend by the same period, and the client is notified within 48
   hours. This is not pessimism — it's the only honest way to
   single-person a 12-month build.
5. **The 3D artist and SEO specialist are client-side resources, to
   be confirmed.** It is not yet locked whether they are paid by
   the client directly, paid through the operator and rebilled, or
   subcontracted independently. The contract structure has to name
   this (separate line items vs. pass-through vs. out-of-scope).

**How a future Claude should apply this.**
- `roadmap.md` should describe the team as "operator (dev + design),
  with 3D artist and SEO specialist as named external collaborators."
  It should not describe a fictional team.
- `design-system.md` is the operator's working document — it should
  be written in a tone consistent with that, not as a handoff doc
  for an outside designer. Decisions can be more opinionated and
  less explained, because there's no second person who needs to be
  convinced.
- `roadmap.md` should add **3D PDP views** to M2 or M3 as an
  in-scope feature for hero / signature products, not as a stretch
  goal. The exact phasing (M2 brochure-PDPs without 3D vs. M3
  shop-PDPs with 3D) is open and should be resolved when we work
  through Thread 2.
- `seo.md` should be rewritten with two clear ownership tracks:
  **content/strategy SEO (specialist)** and **technical SEO
  (operator/in-code)**. Anything that requires Persian keyword
  research or competitive analysis is specialist work and should
  not be written into the operator's task list.
- `roadmap.md` (or the contract template, if we ever draft one)
  must include the **"operator unavailability" clause** described
  above.
- The status of the 3D artist and SEO specialist (client resource
  vs. operator subcontractor vs. independent) is an **open question
  for the contract conversation** and should be flagged in the M1
  addendum checklist, not assumed.

### R6 — Discovery deliverable shape: "medium + schema-walk"

**Decision.** Discovery (M1's substance) is "done" when **all three**
of the following exist and are signed off:

1. **A fully populated `discovery.md`** covering schema dump,
   legacy-app feature inventory, P0 workflow maps (order signing
   first, then whatever else Discovery surfaces as load-bearing),
   accountant interview notes, factory walk notes, showroom-by-
   showroom usage reality check.
2. **A first-draft new-system schema sketch** (the multi-schema
   Postgres split per decision #6, with the actual table shapes,
   not just schema names). The sketch must **round-trip against a
   sample of legacy data** — i.e. the operator can show that every
   field in the legacy DB has a home in the new sketch (or is
   explicitly marked "dropped — reason X"), and at least one
   sample export from the legacy app loads cleanly into the sketch
   without losing fields.
3. **A one-day "schema-walk" with the accountant.** After the
   schema sketch is drafted, the operator sits with the accountant
   for one focused day and walks them through the **factor-related
   tables specifically**. Every objection is captured. Decisions
   #7 (rials-stored / toman-displayed) and #10 (factor immutability
   + adjustment-factor pattern) are validated or revised at this
   meeting. Output: a short "accountant sign-off note" appended to
   `discovery.md`.

The lightweight option (doc only) was rejected as too easy to fool
yourself with. The heavyweight option (full vertical slice through
one workflow end-to-end) was rejected as the right *engineering*
answer but the wrong *commercial* shape for M1, because it inflates
the only firm-priced milestone the client sees on day one and
blurs the boundary between Discovery and M2.

**Why "medium + schema-walk" specifically.** The schema sketch is
the forcing function that proves the operator metabolized Discovery
rather than just transcribing it. The accountant schema-walk catches
the single worst class of M1 surprises (factor + money model) before
they become M3 disasters, at a cost of exactly one day.

**How a future Claude should apply this.**
- `roadmap.md` M1 acceptance criteria are exactly the three
  artifacts above. Not "Discovery doc looks reasonable" — three
  named, signable artifacts.
- `discovery.md` should be reorganized so its top-level structure
  matches deliverable #1 (schema dump section, feature inventory
  section, P0 workflow maps section, interview notes section,
  showroom usage reality section).
- `data-schemas.md` should mark its current contents as **"draft,
  to be replaced by the M1 schema sketch grounded in real legacy
  data."** It should not be treated as authoritative until the
  schema-walk has happened. Specifically the order lifecycle states
  (decision #9), the rials/toman model (decision #7), and the
  factor immutability pattern (decision #10) are all marked
  "pending accountant schema-walk" until M1 closes.
- `roadmap.md` M1 should include the accountant schema-walk as a
  named, scheduled event with a date placeholder, not as a
  "happens whenever" item. The contract should require the client
  to make the accountant available for one full day inside the M1
  window.
- The schema sketch from M1 is a **versioned artifact** — it's
  allowed to be wrong, and M2/M3 are allowed to revise it, but
  the M1 version is the one that's signed off as "this is what
  Discovery concluded."

### R7 — Discovery timebox: 4 weeks + 1 named buffer week, post-signing, with explicit overrun rules

**Decision.** Discovery (the substance of M1) is timeboxed at
**4 working weeks of focused effort, with up to 1 additional
buffer week named explicitly in the M1 addendum**. The contract
states "M1 Discovery: 4 weeks, with up to 1 week of slack reserved
for accountant / staff scheduling." The buffer is **named, not
hidden** — the client sees both numbers.

**Internal week-by-week target shape** (operator's plan, not a
client-facing schedule):

| Week | Focus | End-of-week artifact |
|---|---|---|
| **W1** | Access & inventory: DB credentials, schema dump, UI access, first read-through of legacy app, list every screen | Raw "what's in the legacy app" inventory |
| **W2** | Workflow mapping: order signing first (P0), then other load-bearing flows; two showroom visits, one factory walk | Workflow maps for the top 3–5 flows |
| **W3** | New schema sketch: multi-schema split drafted, sample legacy data round-tripped into it | Schema sketch + round-trip evidence |
| **W4** | Accountant schema-walk (one focused day) + writeup, feedback incorporation, sign-off | Signed Discovery deliverable |
| **W5 (buffer)** | Absorbs slipped weeks (most often W2 — staff are busy, interviews reschedule) | — |

**Discovery happens after the M1 addendum is signed, not before.**
The "Discovery-zero" pre-contract reconnaissance pattern was
**considered and rejected**. Discovery is in-scope work that begins
when M1 starts.

**Implication of rejecting Discovery-zero.** The operator is
committing to a fixed M1 price **before having seen the legacy DB
firsthand**. This means:
- The M1 price must include enough buffer to absorb being wrong by
  20–30% on the size of Discovery, because the operator can't
  validate the estimate before quoting.
- The operator should still ask the client for **at least a verbal
  walkthrough of the legacy app** during the contract conversation,
  even if no DB access is granted yet — pure verbal description is
  not Discovery-zero, it's just due diligence on the quote.
- The buffer week (W5) becomes more important, not less, because
  it's the only slack inside M1 once the price is locked.

**Overrun rules.**

1. **Operator-side slip — operator eats it.** If Discovery isn't
   done at end of W5 because the operator under-estimated the work,
   M1 is **not re-priced**. The operator absorbs the overrun.
   That's the cost of being solo and quoting before seeing the DB.
2. **Client-side slip — clock pauses, contract extends.** If
   Discovery isn't done at end of W5 because the client could not
   make the accountant, staff, or database available within
   reasonable notice, the M1 milestone **pauses the clock** (not
   the calendar — the working-day clock), and the addendum extends
   by the same number of working days the client was unavailable.
   This rule must be **explicit in the M1 addendum** or it becomes
   a fight later. The contract should also define "reasonable
   notice" (suggested: 3 working days for an interview request, 5
   working days for DB credentials).
3. **Scope is frozen during overrun.** If new things surface at
   W4 / W5 that the operator wants to investigate, they go on a
   **"Discovery follow-ups" list** and are scoped into M2's
   budget, not absorbed into M1's overrun. Otherwise Discovery
   becomes a sponge that absorbs every interesting thread the
   operator notices.

**How a future Claude should apply this.**
- `roadmap.md` M1 must show the **4 + 1 week structure** with the
  buffer named, not hidden. Don't write "M1 takes ~5 weeks" — write
  "M1 is 4 working weeks of Discovery work plus up to 1 reserved
  buffer week for client-side scheduling."
- `roadmap.md` M1 must include the **three overrun rules** as
  contract requirements (operator-side eat, client-side extension
  with defined notice windows, scope freeze with follow-ups list).
- `discovery.md` should add a top-level **"Discovery follow-ups"
  appendix section** that's empty by default — it's where W4 / W5
  surprises get parked instead of expanding M1.
- The contract template (if we ever write one) must include the
  "reasonable notice" definition (3 working days for interviews,
  5 working days for credentials) so the client-side-slip rule has
  teeth.
- M1 pricing must include a **20–30% internal buffer** on the
  Discovery effort estimate, because the operator is quoting M1
  without firsthand DB access. This buffer is not visible to the
  client as a separate line — it's absorbed into the M1 number.
- The contract conversation should request a **verbal walkthrough
  of the legacy app** before the M1 addendum is signed, as due
  diligence on the quote. This is not Discovery and not billed.

### R8 — Discovery sign-off: three separate signers, three separate sessions, wet-ink on printed PDF

**Decision.** Discovery is signed off by **three named stakeholders
in three separate sessions**, not a single combined readout. Each
signer attests only to the parts of the Discovery deliverable they
have authority over.

**Signers and what each one attests to.**

1. **The owner.** Signs the overall Discovery deliverable as
   "this represents the business I run." The owner's signature
   covers the high-level scope: business goals, showroom list,
   product categories, brand constraints, and the overall shape
   of the schema sketch. The owner is **not** the right person
   to sign workflow accuracy or accounting details — those go
   to the relevant specialists.
2. **The accountant.** Signs the **schema-walk note** appended to
   `discovery.md` (the artifact from R6 deliverable #3) as "this
   represents the factor and money flow I'm responsible for, and
   decisions #7 (rials-stored / toman-displayed) and #10 (factor
   immutability + adjustment-factor pattern) are correct as
   described, or revised as noted." The accountant's signature is
   the protection against M3-stage "but that's not how factors
   work" surprises.
3. **At least one showroom manager** — specifically the one whose
   showroom is **the most active in the legacy app** (this is
   determinable from the schema dump in W1 of Discovery). Signs
   the **order-signing workflow map** as "this is how my showroom
   actually works." Order signing is the P0 workflow from R4, so
   the operator needs an actual current user of that flow on the
   record before M3 builds the replacement.

**Three separate sessions, not a combined readout.** The "sign-off
by demonstration" pattern (one 60-minute readout with all three in
the room) was considered and **rejected** in favor of three separate
sign-offs. The operator goes to each signer individually with the
relevant section of the deliverable, walks them through it, and
captures their signature on the spot. This is slower than a single
session but realistic for an Iranian SMB context where getting the
owner, accountant, and a showroom manager in the same room at the
same time is itself a logistics problem that could slip a week.

**The likely Case-B counterpart from R2 ("the nephew or similar")
is a facilitator, not a signer.** Their job is to open doors,
schedule the three sessions, and translate when needed. They do
**not** sign anything. A counterpart with informal authority has
zero contractual weight on workflows they don't personally operate.

**Sign-off mechanism: wet-ink on printed PDF.** For each session:
- The relevant section of `discovery.md` (or the schema-walk note,
  or the workflow map) is printed.
- The signer adds wet-ink signature, name, role, and date on the
  printed copy.
- The operator photographs the signed page on the spot.
- Photos are committed to a `docs/m1-signoffs/` folder in this
  repo, named by signer and section.

The point of this mechanism is **not legal weight** — it's the act
of asking a stakeholder to physically commit to "yes, this is
right." That act is what surfaces "wait, actually…" moments before
M2 starts, which is the entire purpose of Discovery.

**M1 cannot close until all three signatures are committed to the
repo.** This is a hard gate, not a soft milestone. If the showroom
manager session keeps slipping, M1 stays open and the client-side-
slip rule from R7 applies (clock pauses, contract extends).

**How a future Claude should apply this.**
- `roadmap.md` M1 acceptance criteria must list **three named
  signatures in `docs/m1-signoffs/`** as a hard gate, alongside
  the three R6 artifacts.
- `discovery.md` should add a **"Sign-off log" section** at the
  end that the operator updates as each signature is collected.
- The contract / M1 addendum must commit the client to making
  all three signers available within the M1 window. If the client
  cannot identify which showroom manager is "the most active in
  the legacy app" up front, the operator selects after W1 (the
  schema dump answers it).
- The Case-B counterpart, if they exist, should be **named in
  the addendum as the "client coordinator for M1 sign-off
  scheduling"** — that frames their role correctly without
  granting them signing authority they don't have.
- Create an empty `docs/m1-signoffs/` directory placeholder when
  the docs are reorganized so the location is reserved.

### R9 — Discovery scope fence: explicit out-of-scope list + operator MES-curiosity handling

**Decision.** The M1 addendum names an explicit **"out of Discovery
scope"** list. Anything on the list, if it comes up during Discovery,
is parked as an M2-or-later scope conversation rather than absorbed
into M1. The list exists so the operator can graceful-no without
brushing the client off — "that's a great Discovery follow-up,
let's add it to the M2 scope conversation" is the standard reply.

**Out of Discovery scope (eight named items):**

1. **Supplier / vendor integrations.** Discovery maps Zhic's
   internal systems only. No supplier portals, raw-material
   tracking systems, vendor APIs. Any of those, if they exist,
   are M5 / ERP territory.
2. **Social media operational flows.** Instagram DMs, Telegram
   orders, WhatsApp customer service are acknowledged as customer-
   acquisition channels but **not** mapped as operational workflows
   and **not** committed to as integration targets. They become
   an M2 "is the inquiry flow enough or do we need DM ingestion?"
   conversation.
3. **Factory QC, production scheduling, deep MES details.**
   Discovery does **one factory walk** for context, not a deep
   audit. QC checklists, batch tracking, machine integration,
   production scheduling are M5/M6 territory and explicitly
   deferred. (See operator-curiosity carve-out below.)
4. **HR / payroll / staff management.** Even if the legacy
   managers app has staff records, Discovery does not investigate
   HR flows. Out of scope, full stop, no follow-up. Not Zhic
   platform territory.
5. **Marketing analytics beyond Plausible.** No Google Analytics,
   Meta Pixel, ad attribution, marketing measurement stack
   investigation. The SEO specialist (per R5) owns that conversation
   separately.
6. **Existing website / content audit & migration.** If any
   current Zhic web presence exists, Discovery does **not** audit
   it as a content source or migration target. Clean-break
   assumption. Old-content migration, if requested, is a separate
   M2 scope item to be priced.
7. **Competitor analysis.** Tempting but bottomless. Discovery is
   about Zhic, not the market. Competitor work belongs to the
   SEO specialist and the marketing lead.
8. **Product photography / 3D asset creation.** Discovery does
   not produce, audit, or commission product photos or 3D models.
   The 3D artist (per R5) owns that workflow separately.

**Pricing strategy: deferred to M3.** Discovery will *see* the
current price list (it's in the legacy schema) and capture it as
data, but it does **not** investigate how prices are set, discount
structures, dealer pricing, or special-customer deals. That goes
to M3 when the commerce flows are real. If M3 surfaces that pricing
logic is more complex than the schema reveals, it becomes an M3
scope adjustment, not a Discovery overrun.

---

**Operator MES-curiosity carve-out (the "pumping-curiosity rule").**

The operator is **passionate about MES** and has flagged that they
are likely to "look into it once in a while" during Discovery. This
is a real scope-creep risk — and the dangerous kind, because the
creep is operator-driven against the operator's own contract, not
client-driven. "I'll just stay disciplined" is not a strategy. The
following structure handles it instead.

1. **Create `docs/_mes-notebook.md`.** A personal R&D notebook,
   underscore-prefixed like this discussion file to mark it
   non-canonical. Anything MES-related the operator observes,
   intuits, sketches, or wants to capture goes there. It is
   personal, not a deliverable, not signed off, not billable, not
   part of M1.
2. **Time cap, not topic ban.** A topic ban doesn't work for
   genuine passion. The cap is **up to ~2 hours per week of
   MES-curiosity work, logged in `_mes-notebook.md`, taken from
   personal time not Discovery time.** The cap exists so the
   operator notices when they've blown past it, not as a bright
   line.
3. **Factory walk discipline.** The one Discovery factory walk
   has a **narrow, written agenda decided before the visit**,
   covering only what M1 needs: how an order goes from "signed
   in showroom" → "queued for production" → "ready for delivery."
   That's the entire Discovery brief at the factory. Anything
   MES-curious the operator notices during the walk goes into
   `_mes-notebook.md` **after leaving the factory, not during the
   visit**. If the operator finds themselves wanting a second
   factory visit just for MES, that visit happens on **personal
   time, not billed, not part of Discovery**, and is logged in
   the notebook.
4. **The notebook feeds M5 later, not earlier.** When M3 closes
   and M5/M6 finally get scoped, `_mes-notebook.md` becomes the
   **seed document for the M5 scoping conversation**. Months of
   accumulated curiosity become structured value at exactly the
   right moment. The notebook is fenced off until that moment.
5. **Fresh-Claude rule (critical).** When the future fresh-Claude
   session reads this discussion file and updates the real docs,
   it must **not pull anything from `_mes-notebook.md` into
   `roadmap.md`, `data-schemas.md`, `architecture.md`, or any
   M1–M3 deliverable.** The notebook is operator-personal and
   M5-deferred. Any future Claude that helpfully integrates
   notebook contents into earlier milestones is breaking this
   rule. The notebook only becomes input when M5 scoping is
   formally opened.

**Why this framing.** This is not Claude policing the operator's
curiosity. It's Claude *preserving* the operator's curiosity from
being eaten by M1 logistics. The notebook makes the MES interest
**more productive over time**, not less, because it accumulates
into a real M5 input instead of dissipating into Discovery
distractions.

**How a future Claude should apply this.**
- `roadmap.md` M1 must include the **eight out-of-scope items**
  as a named addendum-level list, not buried in prose. The
  operator needs to be able to point at it during a client
  conversation.
- `roadmap.md` M1 should also note the **pricing-strategy
  deferral** explicitly: "Discovery captures the current price
  list as data; it does not investigate pricing logic. Pricing
  logic is an M3 scope item."
- `discovery.md` should add a **"Discovery follow-ups" appendix**
  (already required by R7) and a **"Out of scope (parked for M2+
  scoping)"** appendix where items raised by the client during
  Discovery get parked instead of absorbed.
- Create `docs/_mes-notebook.md` as a stub file with a header
  explaining its purpose, its time cap, the factory-walk
  discipline rule, and the fresh-Claude rule. Mark it clearly
  as **operator-personal, non-canonical, not for fresh-Claude
  integration into M1–M3 docs**.
- The fresh-Claude session that applies this discussion file to
  the real docs **must read R9 and respect the MES carve-out**.
  If the fresh Claude touches `_mes-notebook.md` for anything
  other than creating the stub file, it has misread this rule.

### R10 — Discovery runs in parallel with landing page and commerce build

**Decision.** Discovery is **not a gate** that blocks the storefront or
commerce build from starting. Discovery and the landing-page + commerce
build run **in parallel from day one**. The operator begins both
workstreams at the same time as soon as the first contract is signed.

**Dependency map (what is and isn't parallel).**

1. **Landing page (catalog browsing, showroom pages, content, journal,
   inquiry / "استعلام قیمت" CTA, contact) — zero dependency on
   Discovery.** None of it touches the legacy app, the accountant, or
   the order flow. Safe to build fully in parallel with Discovery from
   day one.
2. **Commerce build — starts in parallel, but the data shapes for
   factors, orders, and stock wait on specific Discovery outputs
   before being locked.** The build proceeds on cart / checkout /
   customer accounts / addresses / payment-gateway wiring freely.
   The parts that wait are:
   - **Factor (invoice) numbering format** — from the accountant.
   - **Factor legal template + tax fields** — from the accountant.
   - **Order lifecycle states** — matched to the staff's existing
     vocabulary from the legacy app (Discovery workflow map), not
     invented. Overrides the made-up states in decision #9.
   - **Rial-stored / toman-displayed money model (decision #7)** —
     validated at the accountant schema-walk (R6 deliverable #3)
     before being frozen in the commerce data model.
   - **Stock transfer flow (decision #12)** — one-step vs. two-phase
     decided from the legacy app's actual behavior, not invented.
3. **Discovery inputs to commerce are cheap in calendar terms:** the
   accountant schema-walk is one focused day (R6), and the
   order-signing workflow map is roughly one week of Discovery effort
   (R7 W2). So the commerce build can start in full parallel; the
   factor / order / stock shapes just defer their "locked" status
   until those two inputs land, typically early in Discovery W4.

**Why parallel, not sequential.**
- The client's mental model is "landing page first, commerce second,"
  not "research for a month, then build." Running Discovery as a
  gate in front of any visible work reads as stalling to a client who
  is paying for progress they can see.
- The landing page genuinely has no Discovery dependency, so blocking
  it on Discovery is pure calendar waste.
- Commerce has real Discovery dependencies, but they are narrow and
  time-bounded, and the build has plenty of non-dependent work
  (cart, checkout shell, payment-gateway wiring, customer accounts)
  that can run in parallel until the narrow dependencies resolve.
- Running in parallel compresses the total schedule without
  sacrificing the Discovery insurance that R4 / R6 / R8 exist to buy.

**What this overrides.** This decision **overrides** the sequencing
rule in the pre-pivot `roadmap.md` that said "Phase 1 app work on the
CRM or showroom surfaces is blocked until Discovery is complete." The
new rule is narrower: **only the factor / order-lifecycle / stock-flow
data shapes wait on Discovery, not the build itself.**

**Conflict with R1 (milestone-by-milestone pricing) that must be
resolved next.** R1 says "each milestone is fixed-priced only after
the previous one closes, so Discovery findings inform the next
price." Running Discovery in parallel with landing + commerce breaks
that gating. The master agreement's pricing structure has to be
re-shaped to handle parallel workstreams instead of strictly
sequential milestones. **This is the next open question in Thread 2
and must be resolved before the contract can be drafted.** Options
to be evaluated in the next session turn:
- **Combined M1+M2+M3 price up front** (simpler for client, riskier
  for operator because Discovery surprises land mid-build).
- **M1 priced up front, M2+M3 priced at a defined checkpoint inside
  the parallel run** (e.g. end of Discovery W4 when accountant
  schema-walk lands — that becomes the "re-price commerce" moment).
- **Time-and-materials for Discovery + fixed-price for landing +
  fixed-price for commerce, all running concurrently** (three parallel
  pricing tracks instead of sequential milestones).

**How a future Claude should apply this.**
- `roadmap.md` must be rewritten so the master roadmap shows
  Discovery, landing page, and commerce as **parallel workstreams
  from day one**, not a sequential M1 → M2 → M3 chain. Use a
  two-track or three-track diagram, not a linear list.
- `roadmap.md` must keep the three narrow Discovery-to-commerce
  dependencies named in this R10 as **explicit "data-model lock
  gates"** inside the commerce workstream — commerce starts in
  parallel but the factor / order / stock shapes are marked
  "pending Discovery input" until those inputs land.
- `roadmap.md` must drop any language that implies Discovery is a
  hard gate in front of the build. Replace with "Discovery runs in
  parallel; specific data-model shapes wait on specific Discovery
  outputs."
- `data-schemas.md` must mark the factor / order-lifecycle / stock-
  transfer sections as **"pending Discovery lock"** until W4 of the
  parallel Discovery run. These sections can be drafted on paper
  but must not be implemented in the commerce codebase until the
  schema-walk and workflow map resolve them.
- `architecture.md` and the commerce sub-roadmap must be written so
  the commerce build can advance on cart / checkout / customer /
  payment shell without the factor / order / stock shapes frozen —
  i.e. those shapes live behind a package boundary (`packages/
  invoices`, `packages/orders-core`) that can be filled in last.
- The R1 pricing conflict flagged above must be resolved in the
  next discussion turn and captured as R11 before any contract
  template is drafted.

### R11 — Pricing shape for parallel execution: two fixed-price packages with a mid-run commerce checkpoint

**Decision.** The master agreement carries **two fixed-price packages**,
not one and not three. Running Discovery + landing + commerce in
parallel (per R10) makes strict sequential per-milestone pricing
(R1's original shape) unworkable, and a single all-in upfront number
would force a 30–40% unknown-unknowns buffer the client would pay
whether or not it was used. Two packages is the minimum honest shape.

**Package 1 — Foundations (fixed-price, signed up front).** Covers:
- Discovery in full (R6 deliverables, R7 timebox, R8 sign-offs, R9
  scope fence).
- The entire landing-page workstream (Persian storefront, catalog,
  showroom pages, journal, inquiry / "استعلام قیمت" CTA, contact,
  legal). The landing page has **zero Discovery dependency (R10)**,
  so it is safe to fix-price on day one without waiting for Discovery
  findings.
- Monorepo skeleton, hosting stand-up, all "Phase 0 verification"
  items (Hetzner, TLS, Kavenegar, object storage, payment-gateway
  account confirmation).
- The commerce *shell* work that is also Discovery-independent: cart,
  checkout flow, customer accounts (phone + OTP), addresses, payment
  gateway wiring. **Built, but not wired to the factor / order /
  stock data shapes yet** — those wait on Package 2.

**Package 2 — Commerce lock & launch (fixed-price, signed at the
Commerce Pricing Checkpoint).** Covers:
- The factor / order-lifecycle / stock-transfer data shapes
  (the three R10 dependencies), implemented against the Discovery
  outputs that landed during Package 1.
- Wiring the commerce shell (built in Package 1) into those data
  shapes, producing a working end-to-end shop.
- The staged parallel-run migration from the legacy showroom
  managers app (R4), including the overlap period and the "legacy
  app goes read-only" date.
- Staff training (R4 — named deliverable, not afterthought).
- Launch-readiness checklist (R3) and the loud-vs-quiet launch
  decision at Package 2 close.

**Package 1 is the only firm number at master-agreement signing.**
Package 2 is scoped as a sketch in the master agreement (what it
covers, what its acceptance test looks like) but **no number** until
the Commerce Pricing Checkpoint.

**The Commerce Pricing Checkpoint.** A **named, scheduled event**
inside Package 1, not a renegotiation. Triggered by three specific
artifacts landing:
1. The accountant schema-walk note (R6 deliverable #3, signed by
   the accountant per R8).
2. The order-signing workflow map (R4 / R8 — signed by the most
   active showroom manager).
3. The first-draft new-system schema sketch (R6 deliverable #2),
   round-tripped against legacy data.

Timing: **expected at the end of Discovery Week 4 (R7 W4)**, which
is also roughly when the landing page reaches visible usability
inside Package 1. The checkpoint produces the Package 2 addendum,
which the client countersigns before commerce data-model lock-in
begins. The checkpoint does **not** pause the parallel build —
Package 1 work continues during the Package 2 scoping conversation,
which should take no more than one week.

**What the client sees on day one of the master agreement:**
- Package 1 fixed price (firm).
- Package 2 **non-binding budget band** ("expected in the range
  X–Y, to be confirmed at the Commerce Pricing Checkpoint"). The
  band gives the client rough financial planning visibility without
  committing the operator to a number before the Discovery outputs
  land.
- A named date placeholder for the Commerce Pricing Checkpoint
  (roughly "week 4 after start," adjusted if R7's buffer week is
  consumed).

**Payment triggers.** Package 1 splits into installments tied to
visible checkpoints, not calendar dates:
- **25% at signing** (unlocks the work).
- **25% when the landing page is reachable internally on `zhic.ir`**
  with catalog, showrooms, contact, and inquiry flow usable by the
  client's staff on staging. This is the first visible proof-of-life.
- **25% at the Commerce Pricing Checkpoint** (Discovery deliverables
  signed by owner/accountant/showroom manager per R8 + schema
  sketch landed). This is the Package 1 mid-milestone payment and
  also the trigger for Package 2 to be priced and signed.
- **25% at Package 1 close** (landing page internally accepted,
  commerce shell built, hosting stood up, all "Phase 0
  verification" items confirmed).

Package 2 payment triggers are defined in its own addendum at the
Commerce Pricing Checkpoint, not in the master agreement.

**What this overrides in R1.** R1's "each milestone is fixed-priced
only after the previous one closes" rule is **replaced** by "each
package is fixed-priced at a defined pricing moment, which may be
contract signing (Package 1) or a named mid-run checkpoint (Package
2+)." R1's underlying principle — that fixed prices are only set
when the operator has enough information to honor them — is
preserved. The sequential framing is what changes, not the
principle.

**What this means for M4 / M5 (CRM / ERP / MES).** R1 said M4 and M5
are deliberately un-priced in the master agreement, named as scope
sketches only, and scoped after M3 closes. **R11 does not change
that.** Package 3 (CRM / operator app) and Package 4 (ERP + MES) are
still un-priced scope sketches in the master agreement, still
scoped after Package 2 closes, still explicitly out of scope for
the first contract. The master agreement names them so the client
understands the total shape of the work, but commits to nothing
beyond Package 2.

**Why two packages and not three (Discovery + landing + commerce).**
Splitting Discovery from landing in the pricing would create a
third contract moment for work that shares a start date and a team
(the operator runs both). It would also force the client into a
pricing conversation on day one about a deliverable they don't care
about as a product (Discovery is internal) — clients pay more
happily for "landing page + research that makes commerce safer" as
one package than for "research first, then landing page." The
operator's incentive is also right: bundling Discovery and landing
into one fixed price makes the operator own Discovery overruns that
don't hit the critical path, which is the same operator-side-slip
rule R7 already sets.

**Risks of R11 to name in the contract (Thread 3 preview).**
- **Commerce pricing checkpoint misses its window.** If Discovery
  slips into the R7 buffer week (W5), the Commerce Pricing
  Checkpoint slips too, but Package 1 work continues, so this is
  calendar friction not scope friction. Named as a risk in the
  master agreement; no contract action beyond disclosure.
- **Package 2 number comes in above the budget band.** If Discovery
  surfaces something genuinely large (e.g. the legacy factor format
  requires a custom tax-reporting integration), the Package 2 price
  may exceed the upper end of the band. Contract must state: "If
  Package 2 exceeds the upper band, the client may decline Package
  2 and retain all Package 1 deliverables, including the commerce
  shell; the operator then has the option to offer a scope-reduced
  Package 2 at a lower price." This is the exit ramp that makes the
  checkpoint honest.
- **Mid-run pricing feels like a renegotiation even though it
  isn't.** Mitigation is framing: the checkpoint is a **named
  scheduled event** in the master agreement, not a surprise. The
  contract language must use "Commerce Pricing Checkpoint" or
  equivalent Persian term consistently from day one so the client
  sees it as a project phase, not an ask.

**How a future Claude should apply this.**
- `roadmap.md` must describe the work as **Package 1 (Foundations)
  + Package 2 (Commerce lock & launch)**, not as M1–M3. The
  "milestone" vocabulary from earlier R-entries can remain as
  internal technical-phase language, but the **contract-facing
  vocabulary is packages**. A future Claude writing client-facing
  docs must use "Package" consistently and not confuse it with
  internal technical phases.
- `roadmap.md` must show the Commerce Pricing Checkpoint as a
  named, scheduled event on the parallel-run diagram, sitting
  roughly at the end of Discovery Week 4 / Package 1 mid-point.
- `roadmap.md` must show the Package 1 payment installment
  structure (25 / 25 / 25 / 25 with the triggers listed above).
- `roadmap.md` must describe Package 3 (CRM) and Package 4 (ERP +
  MES) as **named but un-priced**, with scope sketches only,
  explicitly deferred to after Package 2 closes. The single-vs-split
  question for Package 4 stays open (per R10's note about M5).
- `discovery.md` must add a **"Commerce Pricing Checkpoint inputs"**
  section that tracks the three triggering artifacts (accountant
  schema-walk note, order-signing workflow map, schema sketch) as
  hard deliverables. Package 2 cannot be priced until all three are
  landed and the first two are signed per R8.
- The contract template (when it is drafted) must name the Commerce
  Pricing Checkpoint as a project phase from day one and must
  include the "Package 2 exceeds band" exit-ramp clause.
- `data-schemas.md` sections that R10 marked "pending Discovery
  lock" (factor / order-lifecycle / stock-transfer) are also
  **"pending Package 2 signing"** — no implementation work on those
  shapes starts until Package 2's addendum is countersigned,
  regardless of when Discovery outputs land.

### R12 — Landing page depth in Package 1: Generous

**Decision.** The landing-page workstream inside Package 1 ships at
the **Generous** level, not Skinny and not Standard. This is the
operator's call against Claude's Shape-2 recommendation, made
because the brand's real context (a "pumping" business with strong
Instagram traffic per R4, plus a named SEO specialist per R5) makes
the extra editorial and landing surface worth the weight.

**What ships in Package 1 — landing-page scope:**

*Core commerce-adjacent pages (would have been in Skinny):*
- Home
- Catalog index (`/products` or equivalent) with filtering
- Product detail page template (`/products/[slug]`) — **inquiry mode
  only in Package 1, flips to purchase mode at Package 2 cutover per
  decision #23 / R3**
- Showrooms index + per-showroom pages
- Contact
- Legal (privacy, terms, returns placeholder)

*Editorial surfaces (would have been in Standard):*
- Journal index + journal-article template
- Journal category and tag archives
- FAQ page
- Care / materials guide
- About / atelier story page

*Generous-only additions (what makes this R12 and not Shape 2):*
- **Pillar content pages** — long-form Persian content pages for the
  biggest target search terms (structure comes from the SEO
  specialist per R5; template work is operator).
- **Per-product-category landing pages** with editorial framing, not
  just filtered catalog lists. These are the pages that win category
  Persian queries ("تخت خواب دو نفره چوبی" etc.) and they are
  different from `/products?category=…` because they carry real
  content, not just a filter state.
- **Events / showroom-visits page** — a static page listing any
  workshops, open-house events, or showroom visit windows. Static
  content only in Package 1 (no booking mechanics, no calendar
  integration, no RSVP database — those stay deferred).
- **Showroom-visit intake form** — see scope fence below. Ships in
  Package 1 as a **lead-capture form only**, deliberately not as a
  real appointment-booking system.

**Scope fence — what Generous does NOT include in Package 1** (so
the boundary to Package 2 / Package 3 stays clean):

1. **No real appointment-booking engine.** The showroom-visit intake
   form captures: name, phone, preferred showroom, preferred date
   window (free-text, not calendar-bound), message. Submissions land
   as leads in the same inbox the general inquiry form uses. **No
   calendar, no availability check, no staff assignment, no
   confirmation workflow.** That entire mechanism belongs in Package
   3 (CRM / operator app). The intake form is explicitly a lead-gen
   input, not a booking system.
2. **Events page is static content, not an events database.** Events
   are edited in the admin as regular content blocks. No `Event`
   JSON-LD with bookable slots, no RSVP, no ticketing. If the client
   wants a real events system later, that is a separate scope
   conversation.
3. **Pillar and category pages are editorial, not programmatic.**
   They are designed and filled like journal articles, not generated
   from catalog data. Programmatic category pages (auto-generated
   from product taxonomy) stay in Package 2 where they make more
   sense alongside the purchase-mode PDP.
4. **No booking-form automation.** Form submissions trigger a basic
   SMS notification to the showroom manager (via `packages/sms`
   Kavenegar wrapper) and nothing else. No round-robin assignment,
   no SLA tracking, no auto-reply workflows. Those are Package 3
   territory.
5. **No deep search.** Package 1 ships the journal and catalog with
   basic filtering, not a real search engine. Typesense /
   Meilisearch stays deferred to the post-Package-2 phases where
   the README currently puts it.

**Content responsibility (this is the single biggest risk of
Generous over Standard).** Generous only wins if content actually
fills the extra surfaces. Ownership split:
- **Pillar content, category-page editorial, journal article topics
  and drafts:** owned by the **SEO specialist** (R5), not the
  operator. This is confirmed as SEO-specialist work, not operator
  work. Specifically, the SEO specialist delivers Persian keyword
  research and the content briefs + drafts; the operator only builds
  the templates and places the content.
- **FAQ, care guide, atelier story:** owned by the **client's
  marketing side** (internal brand copy). These are brand-voice
  pages that cannot be ghostwritten by the SEO specialist without
  approval, and the client already has Instagram captions and
  showroom materials as source copy to draw from.
- **Events page content:** owned by the client directly (showroom
  managers know what events are happening).
- **If content doesn't arrive on time:** Package 1 acceptance does
  **not** require every editorial page to be full. The template
  must exist and render gracefully with placeholder content, but
  "every pillar page is populated" is a client deliverable, not an
  operator deliverable. This split must be explicit in the Package
  1 addendum or the operator absorbs a content dependency they
  don't control.

**Pricing implication for Package 1.** Generous raises Package 1
cost meaningfully over Standard. Rough shape (exact numbers to be
set when the master agreement is drafted):
- Skinny ≈ baseline.
- Standard ≈ baseline + ~20–30% (extra templates, extra polish).
- **Generous ≈ baseline + ~50–70%** (all Standard additions, plus
  pillar pages, category pages, events page, intake form, and the
  extra design/template work to keep it cohesive at Generous scale).

The operator must price Package 1 at the Generous level **with the
content-ownership split above made explicit to the client**, so the
price reflects what the operator is actually delivering (templates
and design) vs. what the client + SEO specialist are delivering
(content to fill those templates). If the content-ownership split
is fuzzy at signing, Generous becomes a trap — the operator ships
beautiful empty templates and the client blames them for a site
that "feels empty."

**How a future Claude should apply this.**
- `roadmap.md` Package 1 landing-page scope must list every page
  category above, clearly separated into Core / Editorial / Generous-
  only, with the Generous-only scope fence (the five "does NOT
  include" items) as an explicit out-of-scope list inside Package 1.
- `roadmap.md` must show the content-ownership split (operator =
  templates, SEO specialist = pillar/category/journal, client
  marketing = FAQ/care/atelier/events) as a named section in the
  Package 1 description, not buried in prose.
- `roadmap.md` must state that Package 1 acceptance does **not**
  require every editorial page to be populated — template existence
  + placeholder rendering is the operator's deliverable; content
  is the client / SEO specialist's deliverable.
- `sitemap.md` must be rewritten to show the Package 1 page
  inventory at the Generous level, marked per-page as Package 1 /
  Package 2 / later, so the boundary is visible in the sitemap.
- `design-system.md` must include the extra page templates Generous
  requires: pillar-page layout, editorial category-page layout,
  events-page layout, intake-form layout. These are new page
  archetypes the Shape-2 decision would not have produced.
- `seo.md` must be rewritten so the SEO specialist's content-
  production responsibility (pillar pages, category pages, journal
  topic strategy) is a named workstream tracked against Package 1,
  not a general "future" item. The SEO specialist's work is on the
  Package 1 critical path for populated launch, even if not for
  operator-side acceptance.
- The Package 1 addendum must carry the **content-ownership split
  as a contract clause**, not a note. The client and the SEO
  specialist agree in writing that they own the editorial content;
  the operator owns templates + design. This is the single most
  important protection against Generous becoming a trap.
- The intake form's scope fence (lead-capture only, no booking
  engine) must be repeated in the Package 1 addendum because it's
  the clearest boundary to Package 3 (CRM / booking workflow) and
  the most likely thing to be confused at signing.

### R13 — Package 2 commerce depth: Full shop (Shape C), priced accordingly

**Decision.** Package 2 ships at the **Full shop (Shape C)** level,
not the "Shop shell" minimum (A) and not the "Real shop" middle
ground (B). The operator's call, against Claude's Shape-B
recommendation, with the operator's explicit acknowledgment that
Shape C's extra features are charged for — i.e. Package 2 carries a
visibly higher number than Shape B would, and this is by choice,
not by accident.

**What ships in Package 2 — commerce scope at Shape C level:**

*Shape-A baseline (the shop shell):*
- Customer accounts via phone + OTP (Kavenegar through
  `packages/sms`).
- Cart + checkout flow, Persian throughout.
- One working Iranian payment gateway (ZarinPal / IDPay / Zibal —
  final choice locked when the client confirms which merchant
  account already exists; see the operator MES-curiosity carve-out
  principle: pick the one the client already has a relationship
  with).
- Legal factor generation + PDF template, with the
  client-provided factor numbering format (`siteSettings.
  invoiceNumberFormat`, currently reserved empty) wired in.
- Admin order list / detail / status transitions (against the
  order lifecycle states that Discovery confirms — decision #9 is
  still "pending Discovery lock" per R10).
- Manual walk-in order entry from the admin so showroom staff
  can place counter orders in the new system.
- Parallel-run migration of the order-signing flow from the legacy
  showroom managers app (R4), including the staged overlap period
  and the "legacy app goes read-only" cutover date.
- Staff training as a named Package 2 deliverable (R4), not an
  afterthought.

*Shape-B additions (what makes it a real shop, not a shell):*
- **Real stock tracking per location** (showrooms + Hamedan
  warehouse). Stock-on-hand, stock adjustments, inter-showroom
  transfers. The two-phase transfer confirm from decision #12 is
  still "pending Discovery lock" per R10 — the legacy app's
  actual behavior decides.
- **Delivery scheduling** (promised delivery date + status, not
  routing). Courier integration is not in scope; delivery method
  is metadata the staff update manually.
- **Returns workflow.** Customer-initiated return requests;
  admin-handled refund issuance; integration with the factor
  model via the adjustment-factor pattern (decision #10, pending
  accountant sign-off at the schema-walk).
- **Customer self-service:** `/account` + `/account/orders` +
  `/account/invoices` + `/account/addresses` at usable depth,
  including invoice / factor download.
- **Per-showroom product availability overrides** — at minimum,
  which products are available at which showroom. Per-showroom
  pricing is a stretch question parked as an R13 follow-up
  (see below).

*Shape-C additions (the full-shop layer):*
- **Promotion / discount engine, rules-based.** Rule types at
  minimum: percent-off, fixed-amount-off, buy-X-get-Y,
  product-scoped, category-scoped, customer-scoped, time-windowed.
  Rules are admin-editable, not hard-coded. **Scope fence:** no
  dynamic pricing, no user-behavior-triggered discounts, no A/B-
  tested promotions. Those are post-launch experiments, not
  Package 2 scope.
- **Gift cards / store credit.** Issuable from admin, redeemable
  at checkout, balance-tracked per customer. **This requires
  accountant sign-off at the schema-walk** because gift cards
  have tax-treatment implications under Iranian VAT rules that
  the operator is not competent to decide alone. Flag as a
  schema-walk agenda item.
- **Simple SMS follow-up automation** — scoped narrowly as
  **delivery-step notifications only**. The customer receives SMS
  at each meaningful transition in the fulfillment pipeline
  (examples: "order confirmed," "dispatched from warehouse,"
  "out for delivery today," "delivered"). Transitions are keyed
  to the order lifecycle states that Discovery confirms
  (decision #9, still pending lock). **This is the operator's
  explicit narrowing of Shape C's "loyalty" line at R13 decision
  time**: the word "loyalty" in the Shape-C menu was read
  narrowly to mean "keep the customer informed through delivery,"
  not "abandoned cart / birthday / post-purchase marketing" and
  not "points / tiers." **Scope fence — explicitly excluded from
  Package 2:**
  - No abandoned-cart reminder SMS.
  - No birthday SMS.
  - No post-purchase marketing / thank-you follow-up SMS.
  - No points system.
  - No tiers or status levels.
  - No broadcast campaigns.
  - No segmentation.
  - No drip-campaign builder.
  Anything on this excluded list is Package 3 (CRM) territory if
  the client asks for it.
- **Multi-address shipping** — customers can ship one order to
  one address but maintain multiple saved addresses in their
  account. **Split deliveries (one order to multiple addresses)
  are explicitly out of scope for Package 2** because they
  complicate the factor model significantly and add testing
  surface without matching a real furniture-business workflow.
- **Real-time stock reservation during checkout.** When a customer
  adds an in-stock item to cart and proceeds to checkout, the
  stock is reserved for a defined window (default 15 minutes,
  configurable in site settings). Reservation expires, item returns
  to available pool. Prevents double-selling of the last-unit
  items. Requires the stock-transfer flow (Shape B) to be live
  first.

**Package 2 / Package 3 boundary — the Shape C scope fence.**
Shape C's promotion/loyalty/SMS items are the ones most likely to
bleed into Package 3 (CRM / operator app) territory. The boundary
is drawn as follows, and must be repeated in the Package 2 addendum:

1. **SMS follow-up automation in Package 2 is narrowly scoped to
   delivery-step notifications only.** See the Shape-C SMS bullet
   above for the full excluded list. The short version for the
   Package 2 addendum: **Package 2 SMS = "where is my order" only.
   Package 3 SMS = everything else.** This is the single cleanest
   way to state the boundary in one sentence.
2. **Promotion rules are per-promotion, not per-segment.** The
   admin creates "10% off the Hamedan showroom's floor stock for
   one week." The admin does **not** build customer segments like
   "customers who bought in the last 90 days and live in Tehran
   province" for targeted discounts. Segmentation is Package 3.
3. **Gift cards are issuable and redeemable in Package 2.
   Issuance *workflows* (how a sales rep decides to issue one,
   under what approval, tied to what customer milestone) are
   Package 3.** Package 2 gives the tool; Package 3 gives the
   workflow that uses the tool.
4. **Customer self-service in Package 2 stops at the order and
   invoice level.** It does not include preference management
   beyond opt-in/out of SMS follow-ups, loyalty tier display
   (there is no loyalty tier system in Package 2), or
   relationship history ("you last visited Hamedan showroom on
   X") — those are Package 3.
5. **Loyalty tier systems, points accrual, rewards redemption
   are NOT in Package 2, even at Shape C.** The Shape C
   description above uses "loyalty" loosely to mean "SMS
   follow-up automation" — the word should be read that way,
   not as a points/tiers system. If the client asks for points/
   tiers during Package 2 scoping, it is a Package 3 conversation.

**Per-showroom pricing: confirmed out of scope — all showrooms
share one price list.** The operator confirmed at R13 decision
time that "the prices are all the same" across showrooms. Package
2 therefore ships a **single global price list**, with
per-showroom *availability* overrides (Shape B layer) but **no
per-showroom price variation**. The `priceHistory` audit and
factor generation flow operate against one canonical price per
product. If Discovery later surfaces that the legacy app actually
does vary prices per showroom despite this stated understanding,
the discrepancy is a **Discovery finding to raise with the owner**,
not a default-to-match behavior. In that case the operator brings
it back to a scoping conversation rather than silently
implementing per-showroom prices — because the owner's explicit
word at R13 time overrides what the legacy app may do by accident.

**Dependencies on Discovery that Shape C adds beyond R10.**
Shape C introduces two new "pending Discovery lock" items on top of
R10's three (factor / order-lifecycle / stock-transfer):

6. **Gift card tax treatment under Iranian VAT** — accountant
   schema-walk agenda item. Must be resolved before Package 2's
   factor model can include gift-card redemptions cleanly.
7. **Stock reservation window default** (15 minutes assumed) —
   the legacy app may already have a reservation concept; if so,
   the window should match staff expectations rather than be
   invented. Discovery workflow map agenda item.

**Pricing implication for Package 2.** Shape C raises the Package 2
non-binding budget band meaningfully over Shape B. Rough shape:
- Shape A ≈ Package 2 baseline.
- Shape B ≈ baseline + ~30–50% (stock management and returns are
  the big additions).
- **Shape C ≈ baseline + ~70–100%** (promotion engine, gift cards,
  SMS automation, reservation logic, and the testing burden on
  top of Shape B's stock model).

The master agreement's **non-binding budget band for Package 2
reflects Shape C scope**, not Shape B. The band must be wide enough
to honor the Discovery dependencies still open (factor format, tax
treatment of gift cards, stock reservation behavior) without
committing to a number that will embarrass the operator at the
Commerce Pricing Checkpoint. The operator's acknowledgment at R13
decision time — "these generous choices will be charged for of
course" — is the contract principle to surface explicitly in the
Package 2 addendum conversation: Shape C is the operator's price
to charge, not a cost to absorb.

**Operator unavailability clause (R5) hits harder at Shape C.**
Shape C is a significantly bigger solo-operator commitment than
Shape B. The R5 "operator unavailable >2 weeks extends the
milestone" clause is still the right shape, but the band of "how
late is too late" for Package 2 tightens at Shape C — the client
should be warned at contract time that Shape C specifically has
no parallel engineering capacity to absorb operator illness or
burnout, and the timeline is honest about that.

**How a future Claude should apply this.**
- `roadmap.md` Package 2 scope must list every Shape A / Shape B /
  Shape C bullet above as a named deliverable, grouped by layer
  so the client sees what each layer adds.
- `roadmap.md` Package 2 must carry the **five scope-fence clauses**
  (Package 2 / Package 3 boundary) as an explicit out-of-scope
  list. The word "loyalty" in particular must be defined in-doc
  so it cannot be read as "points and tiers system."
- `roadmap.md` Package 2 must carry the **parked follow-up on
  per-showroom pricing**, flagged as "decided at accountant
  schema-walk based on legacy-app behavior, default out-of-scope
  if legacy app does not already do it."
- `roadmap.md` Package 2 must add **gift-card tax treatment** and
  **stock-reservation window** to the list of "pending Discovery
  lock" items, alongside the three from R10.
- `roadmap.md` must show Package 2's non-binding budget band as
  **visibly wider than Shape A / Shape B would imply**, and the
  master agreement's Package-2-sketch section must explicitly name
  "Shape C / Full shop" as the scope the band is sized for.
- `data-schemas.md` must add **gift card / store credit**
  collections, **promotion rule** collection, and **stock
  reservation** model as Package-2 schemas, all flagged "pending
  Package 2 signing" per R10 / R11.
- `admin-panels.md` Package 2 chapter must add: promotion rule
  editor, gift card issuance screen, SMS automation editor
  (rule-based, NOT campaign-builder — reinforce the scope fence),
  and the stock reservation debug view.
- `architecture.md` must reserve `packages/promotions`,
  `packages/gift-cards`, and the SMS automation responsibility
  inside `packages/sms` (not a new package) as Package-2 scope.
- The Package 2 addendum (when drafted after the Commerce Pricing
  Checkpoint) must list the scope fence clauses verbatim. They are
  the single biggest client-misunderstanding risk of Shape C.

### R14 — Master agreement sketch depth for Package 3 + Package 4: Shape Z with explicit revisable-sketch framing

**Decision.** The master agreement describes **Package 3 (CRM /
operator app)** and **Package 4 (ERP + MES)** at **Shape Z** level
— a bulleted indicative module list per package — **but with a
single binding contract clause that marks the list as a non-
binding sketch, revisable in detail after Package 2 closes based
on Discovery findings and Package 2 learnings**. This is the
operator's call, with the operator's explicit acknowledgment that
"that whole thing will be planned and detailed out later as we go
through Discovery." The framing clause is what makes Shape Z
safe; without it, Shape Z is the consultant-trap I warned against.

**The revisable-sketch clause (exact contract language to adapt).**
The master agreement must carry this clause verbatim or in close
Persian equivalent:

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

This clause is **non-negotiable at contract signing**. If the
client refuses this framing and insists on the module list being
binding, Shape Z becomes unsafe and the operator must fall back
to Shape Y (one-paragraph sketches, no list). The operator must
not sign Shape Z without the framing clause.

**Package 3 — CRM / operator app. Indicative module sketch
(non-binding).**

*What problem it solves.* The storefront admin from Package 1/2
is Payload-as-admin — it lets a small number of power users edit
content, catalog, and orders. Package 3 adds a **dedicated
operator app** for the day-to-day workflows of showroom managers,
sales staff, and inside-sales coordinators, sized against what
Discovery finds the legacy showroom-managers app actually does
today.

*Who uses it.* Showroom managers (one per showroom), showroom
sales staff (multiple per showroom), inside-sales coordinators at
HQ, and the owner in a reporting capacity. **Not** the accountant,
**not** the factory floor — those get their own surfaces in
Package 4.

*Indicative module list (revisable per the framing clause above).*
- **Customer 360.** Unified view of a customer: all orders, all
  prior interactions, notes, preferences, assigned sales staff,
  relationship history across showrooms.
- **Pipeline management.** Leads from the storefront inquiry form
  and the Package-1 showroom-visit intake form flow into a
  pipeline with stages, assigned staff, next-action reminders,
  and SLA tracking.
- **Appointment scheduling.** A real appointment system — the
  thing Package 1 deliberately did not build. Calendar with
  per-showroom and per-staff availability, customer-facing
  booking flow, staff-side confirm/reschedule/no-show handling,
  reminder SMS via `packages/sms`. Feeds the `Event` JSON-LD
  on public showroom pages if the SEO specialist wants that.
- **Manager dashboards.** Per-showroom KPIs (inquiries → orders
  conversion rate, average time to close, top-selling products
  this month, staff performance summaries). Cross-showroom
  dashboards for the owner.
- **Mobile / tablet-friendly showroom-floor UI.** Staff use
  tablets or phones on the showroom floor — the CRM's core
  workflows (look up a customer, show an order, take a deposit,
  schedule a follow-up) must work cleanly on that form factor,
  not just on desktop.
- **Broadcast and segmented SMS.** The Package 2 / Package 3
  boundary in R13 reserved broadcast SMS, segmented SMS,
  campaign-builder functionality, and drip campaigns for Package
  3. They live here.
- **Loyalty program mechanics.** Points or tiers if the client
  ever wants them (explicitly excluded from Package 2 per R13).
  Designed only if Discovery and Package 2 learnings confirm a
  real business case — the indicative list does not guarantee
  this ships even in Package 3.
- **Gift card issuance workflows.** Package 2 provides the gift
  card tool (issue, redeem, track balance); Package 3 provides
  the *workflows* around that tool — who can issue, under what
  approval, tied to what customer milestone, with what
  audit trail.
- **Showroom-operations modules.** Floor stock display per
  showroom, today's deliveries, today's appointments, today's
  walk-ins — the "showroom manager opens this every morning"
  dashboard.

*Indicative rough-size indication (non-binding).* **Expected to
be comparable in total effort to Package 1 at Generous scale.**
Possibly larger if Discovery surfaces workflows not visible in
the legacy app today. The CRM is the Package where
solo-operator bus-factor risk (R5) is most likely to force a
conversation about augmenting the team.

**Package 4 — ERP + MES. Indicative module sketch (non-binding).**

*What problem it solves.* Moves inventory valuation, purchasing,
accounting, payroll export, factory work orders, BOMs, and
production scheduling out of spreadsheets and off the factory
floor whiteboard, and into shared systems the accountant and the
factory supervisor trust. This is the package where the multi-
schema Postgres split (decision #6, still pending) pays off —
`erp` and `mes` schemas get their own surfaces here.

*Who uses it.* The **accountant** (ERP side), the **owner**
(cross-cutting financial and production reporting), the **factory
supervisor and production staff** (MES side), and — eventually —
**HR admin** for the payroll-export slice. Not showroom sales
staff, not front-of-house. Operator-focused, not customer-facing.

*Indicative module list (revisable per the framing clause above),
ERP side:*
- **Inventory ledger.** Stock-on-hand per location, valuation
  method (to be picked with the accountant), inter-location
  transfers, cycle counts, shrinkage handling.
- **Purchasing.** Supplier records, purchase orders, goods-
  received notes, 3-way matching against supplier invoices.
- **Accounts.** The chart of accounts the business's accountant
  already uses, journal entries, trial balance, P&L, VAT
  reporting aligned to Iranian tax requirements.
- **Payroll export.** Staff records, hours/salaries, payroll
  *export* for whatever payroll software the business already
  uses — not in-app payroll processing.
- **Factor lifecycle completion.** The legal factor numbering
  format, tax fields, and templates finalized at the Package 1
  accountant schema-walk are **adopted across the business**
  here: the factor becomes the canonical document for finance,
  not just for storefront orders.

*Indicative module list (revisable per the framing clause above),
MES side:*
- **Work orders.** Production work orders linked to customer
  orders, with routing through the factory's real processing
  steps.
- **BOMs.** Bill-of-materials per product, versioned, with
  material-substitution rules.
- **Routings.** Which stations a work order passes through in
  what order, with estimated and actual times at each station.
- **Production scheduling.** Basic capacity-aware scheduling
  (not full APS — just "here is what we need to build this week,
  here is our capacity, here is the plan").
- **Shop-floor UI / kiosks.** Touch-friendly screens at each
  station where factory staff update work order state (started,
  paused, completed, flagged for QC).
- **Barcode / QR scan support.** Each work order and each
  finished unit gets a scannable identifier used throughout the
  factory.
- **QC gates.** Quality-control checkpoints between stations,
  with pass/fail/rework outcomes and a defect-reason taxonomy.

*Indicative rough-size indication (non-binding).* **Expected to
be larger than Package 3, possibly significantly.** ERP and MES
are two distinct systems with two distinct user populations,
and the R10 note that Package 4 "may split into Package 4 +
Package 5" is preserved — the master agreement states that the
single-or-split decision for ERP/MES is itself deferred to the
end-of-Package-2 scoping conversation. If the discussion in
this file earlier labeled this as "M5" (single) vs. "M5+M6"
(split), the package-language equivalent is "Package 4" (single)
vs. "Package 4 + Package 5" (split).

**How the master agreement presents all of this.** Three
sections, in order:

1. **"What this contract covers."** Package 1 + Package 2 in
   full, with firm acceptance tests and the pricing structure
   from R11 (Package 1 fixed up front; Package 2 priced at the
   Commerce Pricing Checkpoint).
2. **"What this contract does not cover, but that the platform
   will eventually include."** Package 3 and Package 4, each
   with the indicative module sketch above, each preceded by
   the revisable-sketch clause verbatim.
3. **"Scoping the follow-on packages."** A short paragraph
   explaining that Package 3 will be scoped + priced after
   Package 2 closes, and Package 4 will be scoped + priced
   after Package 3 closes, each in a follow-on agreement that
   cites this master agreement but re-opens scope completely.

This structure lets the client see the whole journey without
committing the operator to anything post-Package-2. The
revisable-sketch clause is the protection.

**Why Shape Z instead of Shape Y.** Shape Y (one paragraph each)
was Claude's recommendation because Shape Z without the framing
clause is a trap. With the framing clause in place, Shape Z is
actually better than Shape Y for this specific client context:
- The client is described as high-trust but digital-weak (R4).
  A bulleted list is easier for a non-technical owner to read
  and react to than dense prose. "Yes we need this / no we
  don't care about that" is a productive conversation Shape Z
  enables and Shape Y makes clumsy.
- The operator's acknowledgment that "that whole thing will be
  planned and detailed out later as we go through Discovery"
  is itself the framing clause in natural form. The operator
  already holds the right mental model; the contract just has
  to match it.
- Shape Z gives the client real material to react to, which
  surfaces scope disagreements **before** signing. If the
  client reads the Package 3 list and says "we don't need a
  loyalty program, ever," that is valuable signal for Package
  2's scope fence (R13) and should be captured now, not
  discovered during Package 3 scoping a year later.

**How a future Claude should apply this.**
- `roadmap.md` must describe Package 3 and Package 4 at the
  Shape Z level, using the indicative module lists above,
  **preceded by the revisable-sketch clause verbatim**. The
  clause is non-optional and must appear before both lists.
- `roadmap.md` must also state that Package 4 may be split
  into Package 4 + Package 5 (ERP + MES), with the single-or-
  split decision deferred to end-of-Package-2 scoping.
- The contract template (when drafted) must carry the
  revisable-sketch clause in Section 2 of the master agreement,
  and must name Section 2 as "not covered by this contract."
- `admin-panels.md` and the future CRM / ERP / MES docs must
  treat these module lists as **working drafts** that get
  revised as Discovery and Package 2 findings arrive, not as
  spec commitments. Any future Claude rewriting those docs
  must preserve the non-binding framing.
- If, during Package 1 Discovery, the operator finds that a
  specific Package 3 module (e.g. appointment scheduling)
  actually needs to exist earlier than Package 3 to keep the
  legacy-app migration viable, the right move is a **Package 2
  scope-addition conversation at the Commerce Pricing
  Checkpoint**, not silent absorption into Package 2. Shape Z's
  framing clause makes those conversations straightforward
  because nothing on the Package 3 list is locked.

### R15 — Acceptance tests: scripted user journeys the owner performs themselves (Shape R)

**Decision.** Package 1 and Package 2 acceptance is established by
the **owner personally performing a fixed set of scripted end-to-end
user journeys** in a scheduled sign-off session with the operator,
not by a written checklist the owner ticks through (Shape P) and
not by a demonstration the owner watches (Shape Q). The owner does
every step. The operator observes, does not touch the device, and
captures the result per journey. This is the contractual acceptance
gate that triggers the Package 1 closing payment and Package 2's
closing payment / launch-readiness decision respectively.

**Why Shape R and not a checklist.** A checklist feels like a
handoff — the owner ticks boxes without investment and the
sign-off carries no weight of personal experience. Performed
journeys make the owner the author of the sign-off, which is the
strongest form of "yes, this is ready" available in this deal
shape. The additional benefit is that Shape R is itself the first
training iteration — the owner walking through the journeys is the
first real user test, which compounds with the staff-training
deliverable in R4.

**Structure of a Shape-R sign-off session.**

1. **Scheduled in advance, not ad-hoc.** The session is named in
   the Package addendum as a concrete event (date placeholder
   until the package is closing, then pinned). One operator, one
   owner, 1–2 hours for Package 1, 2–3 hours for Package 2. The
   owner is asked to block the time a week in advance.
2. **Held in a quiet location with a real device.** Owner's own
   phone (the primary device for an Iranian customer scenario),
   plus a laptop or tablet for admin-side journeys. **Inside
   Iran, on real ISPs, not on VPN.** This is the single most
   important logistics point: Package 1's performance and
   reachability claims only mean something when tested from the
   owner's actual network, not through a tunnel. If the session
   is run over VPN the sign-off is invalid.
3. **The operator provides a printed journey card.** For each
   journey, one page in Persian describing what the owner does
   ("open zhic.ir, find the Hamedan showroom page, submit the
   visit form…"), what the owner should see at each step, and a
   checkbox the operator marks as pass / issue / fail. The card
   is the permanent artifact of acceptance — photographed after
   the session and committed to `docs/package-signoffs/` in the
   same spirit as `docs/m1-signoffs/` (R8).
4. **The operator is silent during the journey.** The operator's
   job is to observe, not to coach. If the owner gets stuck, the
   operator writes the stuck point as the journey's pass/issue/
   fail result and the session moves on. The stuck point is a
   bug to fix before final sign-off, not a failure of the owner.
5. **At the end of the session, the operator summarizes.** Pass
   count, issue count, fail count, with the operator's
   recommendation of "sign off now" / "fix these and reconvene"
   / "significant rework needed." The owner either signs the
   summary page or states a blocking objection in the operator's
   hearing. Signature is wet-ink on the printed summary,
   photographed, committed to the signoffs folder.

**Package 1 acceptance journeys (revisable, indicative).** The
actual list is finalized during Package 1 wrap-up so the journeys
cover what was built at the Generous level (R12). Sketch:

1. **Customer browses the catalog on a phone inside Iran.** Owner
   opens zhic.ir on their phone without VPN, browses the product
   catalog, opens at least three product detail pages, scrolls
   through the journal index, and opens at least two journal
   articles. Observable: page loads feel fast, Persian renders
   correctly, RTL is clean, nothing breaks.
2. **Customer submits a product inquiry.** Owner, acting as a
   customer interested in a specific bed, uses the "استعلام
   قیمت" button on a product page, fills in the inquiry form,
   submits it, and observes the confirmation screen. Within 60
   seconds the owner should also see a notification SMS on the
   showroom manager's phone (requires coordinating with a
   showroom manager for the session). Observable: the form
   works, the inquiry lands somewhere the staff can see it, and
   the notification loop functions.
3. **Customer books a showroom visit via the intake form.**
   Owner opens a showroom page, uses the "Book a visit" intake
   form (R12's deliberately-lightweight version), fills in a
   date-window preference, submits, and observes the confirmation
   screen. The operator then opens the admin and shows the owner
   where the submission landed as a lead. Observable: the
   intake-form-as-lead-capture flow from R12 works end-to-end.
4. **Owner edits a product in the admin and sees the change
   on the public site.** Owner logs into the Package 1 admin,
   edits the title of one product, saves, then refreshes the
   public product detail page. Within 10 minutes the new title
   appears. Observable: content editing works, the
   admin-to-storefront pipeline works, non-developer editing is
   viable.
5. **Owner navigates the journal, category, and pillar pages.**
   Owner visits the journal index, opens at least two articles,
   navigates to a product-category editorial page, and opens at
   least one pillar content page. Observable: the Generous
   editorial surfaces from R12 exist, render, and hang together.
6. **Owner tests the site from the perspective of a competitor
   or skeptical friend.** 10 minutes of unscripted exploration.
   Owner clicks around freely, tries to find things, reads copy,
   judges whether this feels like the Zhic brand. Any friction
   observed becomes an "issue" line in the session summary — not
   a failure, but visible for the final polish pass before the
   closing payment is released.

**Package 2 acceptance journeys (revisable, indicative).**
Finalized during Package 2 wrap-up. Sketch:

1. **Customer completes a real rial payment end to end.** Owner,
   acting as a customer, creates an account with phone + OTP,
   adds a product to cart, checks out, pays a small real rial
   amount through the chosen Iranian gateway, receives the
   confirmation screen, receives the delivery-step SMS chain
   starting with "order confirmed" (R13 narrow scope), and
   downloads the generated factor PDF. Observable: the
   end-to-end shop works on real money with the real gateway,
   not a test account. This is the Package 2 centerpiece.
2. **Showroom staff member places a walk-in order from admin.**
   Coordinated with a showroom manager. They open the admin on
   a tablet on the showroom floor, create a new order for a
   walk-in customer, adds line items, picks stock from the
   right showroom's location, generates the factor, and marks
   the deposit received. Observable: the walk-in workflow
   replaces the legacy-app equivalent and feels comparable or
   better in daily-use speed.
3. **Customer returns an order and the refund completes.**
   Owner, acting as the earlier test customer, initiates a
   return from `/account/orders`, the operator (acting as
   admin) approves it, issues the refund, and the owner
   observes both the refund status in their account and the
   adjustment factor PDF generated by the adjustment-factor
   pattern (decision #10 as confirmed at the accountant
   schema-walk). Observable: returns and adjustment factors
   work against the accountant-approved model.
4. **Owner uses the promotion engine to create a real
   promotion.** Owner logs into admin, creates a
   percent-off-for-one-week promotion scoped to one product,
   then visits the public site and confirms the discounted
   price displays. Observable: Shape C's promotion engine is
   editable by a non-developer, which is the whole point.
5. **Owner issues a gift card and redeems it.** Owner creates a
   gift card in admin, the operator uses it at checkout as the
   earlier test customer, and the owner observes the balance
   decrementing correctly and the redemption reflected in the
   factor. Observable: Shape C's gift-card feature works and
   the tax-treatment decisions from the schema-walk hold up in
   practice.
6. **Delivery-step SMS sequence fires at each transition.** The
   earlier test customer's order is walked through its
   lifecycle states (confirmed → dispatched → out for delivery
   → delivered) by the operator, and the owner observes an SMS
   arriving at each transition. Observable: R13's narrow SMS
   scope is live and wired to real state transitions.
7. **The parallel-run migration from the legacy app is working
   for one full day's orders.** This journey is coordinated
   with a showroom: for one real business day, every order
   signed in the legacy app is also reflected in the new
   system, and at end of day the two systems reconcile. Owner
   reviews the reconciliation report with the operator.
   Observable: R4's migration contract is delivering.
8. **Owner tries to break the site.** 15 minutes of unscripted
   exploration in "skeptical owner" mode, same spirit as
   Package 1 journey #6.

**Failure handling.** Not every session will be a clean sign-off.
Three outcomes are possible:

- **Clean pass:** owner signs the summary on the spot, the
  closing payment for that package is released per R11's
  trigger structure, and the package closes.
- **Pass-with-issues:** the journeys work but there are minor
  issues (copy typos, minor visual inconsistencies, slow page
  here and there). The operator fixes them within a named
  window (suggested: 5 working days) and sends a short written
  confirmation to the owner, at which point the package closes
  and the closing payment releases. **The issues list is
  capped** — if more than N issues (suggested N = 10 for
  Package 1, 15 for Package 2), the session is treated as
  rework instead of pass-with-issues.
- **Rework needed:** one or more journeys fail at a level that
  requires significant work, or the issues list exceeds the cap.
  The operator fixes the problems, schedules a second session
  within a named window (suggested: 10 working days), and the
  second session runs the **failed journeys only**, not the
  whole set. Previously-passed journeys are not re-run. If the
  second session still fails, the contract's dispute-resolution
  clause kicks in (to be defined in the contract template —
  default: one more iteration, then mediated conversation).

The **issues cap** is important. Without it, "pass with issues"
becomes a bucket large enough to hide a second package in, and
the operator ends up doing Package 1.5 for free. With the cap,
the cap is itself the trigger for a harder conversation about
what was actually built versus what was promised.

**Relationship to R11 payment triggers.** R15 slots into R11's
four-part Package 1 payment structure at the **fourth installment
(25% at Package 1 close)**. The Shape-R session is the event that
releases that installment. For Package 2, whose payment triggers
live in the Package 2 addendum (not in the master agreement), the
Shape-R session is similarly the final-closing event, and the
Package 2 addendum must name it explicitly.

**Relationship to R8 three-signer sign-off.** R8 requires three
signatures (owner, accountant, most-active showroom manager) on
Discovery deliverables inside Package 1. **R15 is a separate and
additional event** — the owner signs once for Discovery per R8,
and again at the end of Package 1 for R15 acceptance. These are
not the same session, not the same artifact, and not at the same
time. R8's signature is for the research; R15's is for the built
product. Both are required for Package 1 to close.

Package 2 acceptance reuses R8's three-signer model lightly: the
accountant signs the gift-card tax handling (if Shape C gift-cards
prove to work as the schema-walk predicted, that's a one-page
confirmation, not a full session) and the showroom manager signs
the walk-in workflow after journey #2 above. The owner's R15
session is the umbrella event; the accountant and showroom-manager
sign-offs are short confirmations inside it.

**How a future Claude should apply this.**
- `roadmap.md` must describe Package 1 and Package 2 acceptance
  as **scripted user journeys performed by the owner in a
  scheduled sign-off session**, not as a checklist or a demo.
  The journey sketches above become the starting draft for each
  package's journey list — they are revisable before the session
  is run, but the *shape* (owner performs, operator observes,
  real device, real ISP, real money for Package 2) is locked.
- `roadmap.md` must state that the Shape-R session is held
  **inside Iran on real ISPs, without VPN**, and that sessions
  run over VPN produce invalid sign-offs. This is a
  non-negotiable contract element given R3 / R4.
- `roadmap.md` must carry the **failure-handling rules**:
  clean pass / pass-with-issues / rework, with the issues cap
  (10 for Package 1, 15 for Package 2 as the indicative
  defaults) and the second-session rule (failed journeys only).
- A `docs/package-signoffs/` directory placeholder should be
  reserved, parallel to `docs/m1-signoffs/` from R8. Each Shape-
  R session produces a photographed summary page committed
  there.
- The contract template must carry the Shape-R acceptance
  language and must reference both R8 (Discovery sign-offs)
  and R15 (package acceptance sign-offs) as distinct events.
  The client needs to understand at signing that Package 1 has
  **two sign-off moments**, not one.
- The journey sketches above should be rewritten into the
  operator's own Persian-language "journey cards" close to each
  package's closing date — they are not frozen now. What is
  frozen now is the Shape-R structure, the session logistics,
  the failure handling, and the relationship to R8 + R11.

### R16 — Thread 2 closed: invoicing rhythm and operator-unavailability clarifications, remaining unilaterals deferred

**Decision.** Thread 2 (master milestone shape) is treated as
**closed** at R15. The two remaining Thread 2 sub-questions
(invoicing rhythm inside parallel execution, operator-unavailability
escalation at Shape C scale) are resolved as **clarifications**
below rather than new standalone R-entries, and the remaining
🔴 unilateral decisions in sections A–E are **defaulted or
deferred** rather than resolved live, to allow the operator to
pivot from decision-making to canonical-doc revision within this
session.

**Clarification 1 — Invoicing rhythm inside parallel execution.**
R11's Package 1 payment-trigger structure (25/25/25/25 tied to
visible checkpoints: signing, landing-page internal, Commerce
Pricing Checkpoint, Package 1 acceptance) is the full invoicing
rhythm for Package 1. **There is no separate "inter-workstream
gap rule" because the workstreams do not have gaps in parallel
execution** — Discovery, landing page, and commerce shell all run
concurrently, and the payment triggers pin to shared observable
events (not to per-workstream completion). The operator invoices
against R11's four triggers, full stop. If Package 1 slips on
calendar, the triggers slip too, because they are
event-triggered not date-triggered. Package 2's invoicing rhythm
is defined in the Package 2 addendum at the Commerce Pricing
Checkpoint, following the same event-triggered pattern.

**Clarification 2 — Operator-unavailability escalation at Shape C
scale.** R5's general rule ("operator out >2 weeks extends the
milestone") holds, with two Shape-C-specific tightenings:

- **Shape C Package 2 specifically has no parallel engineering
  capacity** to absorb extended operator absence. The client must
  be warned at contract signing that any operator unavailability
  beyond the R5 two-week window inside Package 2 will extend
  Package 2's calendar one-for-one, and the Commerce Pricing
  Checkpoint will itself slip by the same period if the absence
  falls inside Package 1.
- **At ~3 weeks of continuous operator absence**, the contract
  triggers a mandatory status conversation with the client,
  regardless of package. The conversation covers: projected
  return date, impact on the current package's acceptance
  window, whether an R15 Shape-R session needs rescheduling, and
  whether the client wants to take any action (e.g. pausing the
  package formally vs. continuing to accrue the extension).
  **This is not a renegotiation trigger, it is a transparency
  trigger.** The master agreement must name it as a "mandatory
  3-week status check," and it must be initiated by the operator
  within the first 48 hours of the 3-week mark.
- **At ~6 weeks of continuous operator absence**, the client
  gains a **unilateral exit option** from the current package
  (not the master agreement): the client can close the current
  package early, pay a pro-rated amount based on the visible
  deliverables in place, and walk away from the remaining scope
  of that package. The operator retains no obligation to
  complete scope beyond the pro-rata point. This is the honest
  shape of solo-operator bus-factor risk, and the client should
  see it in the contract on day one rather than discover it
  during a crisis.

**Remaining 🔴 unilateral decisions — status at R16 close.**

| # | Item | R16 status |
|---|---|---|
| 1 | ASCII vs Persian slugs | **Deferred.** Default in the revised docs is ASCII slugs per the existing unilateral choice, flagged as "operator to revisit before Package 1 template work begins." |
| 2 | Persian font (free Vazirmatn/Estedad vs paid) | **Deferred.** Default is the free Vazirmatn + Estedad pair, flagged as "budget question — can be revisited if the client wants a paid face as brand differentiator." |
| 6 | Multi-schema Postgres split | **Defaulted.** Multi-schema split stays as the architecture decision. Reversible in practice if early Discovery reveals operator pain. |
| 9 | Order lifecycle states | **Already handled** — marked "pending Discovery lock" per R10. No action in R16. |
| 11 | Factor numbering format | **Already handled** — client-provided placeholder, reserved empty per README. No action in R16. |
| 14 | Payload admin vs apps/crm split | **Resolved implicitly by R13 + R14.** Payload owns admin for Packages 1 and 2 (content, catalog, orders, promotions, gift cards, stock, delivery-step SMS rules). `apps/crm` is a Package 3 deliverable. This is the same split the existing unilateral proposed, now with package-language authority behind it. |
| 16 | Showroom-scoped visibility | **Deferred.** Default in the revised docs is "showroom managers see only their showroom's data, owner sees cross-showroom," flagged as "cultural/management question — revisit with the owner before Package 3 scoping." |
| 19 | Tipax as delivery carrier | **Defaulted.** Tipax remains as an assumption, marked "pending Discovery confirmation" — the actual delivery-carrier enum is populated from whatever Discovery finds the business uses. |

**What deferred means in practice.** The revised canonical docs
apply the defaults above as working assumptions. Each deferred
item is tracked in a **"Deferred operator decisions" appendix at
the end of `roadmap.md`** so they are visible and picked up
before the relevant package begins, rather than silently buried.
The fresh-Claude rule from R9 also applies to R16 deferrals:
future Claude sessions must not silently change these defaults
— only the operator can upgrade a deferral to a decision.

**Thread 3 — risks.** Thread 3 (a summary pass on contract-level
risks) is **not run as a dedicated discussion turn**. Risks
already identified across R3, R4, R5, R7, R10, R11, R13, R14, R15
are consolidated into a **"Risks named in the contract"** section
inside the revised `roadmap.md`, not as a separate document or
R-entry. The canonical risks to carry forward:

- Hetzner / TLS / payments / SMS verification from inside Iran
  (R10, Package 1 closes these).
- Legacy-app export / migration may be manual (R4, R13, Package
  2 parallel-run).
- Factor format and tax fields may take longer than expected to
  finalize (R4, R6, Package 1 schema-walk).
- Core Web Vitals from inside Iran may be worse than CI shows
  (R15 Shape-R session on real ISPs is the mitigation).
- Discovery may surface workflows pushing Package 3 scope
  significantly (R14 revisable-sketch clause is the mitigation).
- Shape C content dependency: Generous templates without
  Persian content from the SEO specialist become a trap (R12
  content-ownership clause is the mitigation).
- Solo-operator bus-factor risk at Shape C scale (R16
  Clarification 2 three-week/six-week rules are the mitigation).
- Package 2 number exceeding the non-binding budget band (R11
  exit-ramp clause is the mitigation).
- Commerce Pricing Checkpoint feeling like a renegotiation (R11
  naming-as-scheduled-event is the mitigation).
- Client-side scheduling slips on Discovery interviews (R7
  client-side-slip rule is the mitigation).

**Thread 2 closed.** Canonical doc revision begins in the same
session, against R1–R16.

**How a future Claude should apply this.**
- R16 is not a new set of scope decisions. It is the **close of
  the decision phase** for this contract conversation. Any
  future Claude opening this file should treat R1–R16 as the
  authoritative decision set for the revised docs.
- The "Deferred operator decisions" appendix in `roadmap.md`
  is the one place future Claudes may surface the R16-deferred
  items back to the operator. They must not silently resolve
  them.
- The "Risks named in the contract" section inside `roadmap.md`
  is the Thread-3 deliverable. Future Claudes should not create
  a separate `risks.md`; the risks live inside the roadmap
  where they are commercially readable.

---

## Session progress / resume marker

**Last touched:** 2026-04-11, discussion phase closed at R16.
Canonical doc revision began in the same session.

**Threads completed:**
- ✅ **Thread 1 — Deal mechanics** (R1–R5)
- ✅ **Thread 4 — Discovery scope** (R6–R9)
- ✅ **Thread 2 — Master milestone shape** (R10–R16)
- ✅ **Thread 3 — Risks** — consolidated into R16 and into the
  "Risks named in the contract" section of the revised `roadmap.md`.

**🔴 unilateral decisions status:** defaulted or deferred per R16.
Tracked in the "Deferred operator decisions" appendix in the revised
`roadmap.md`.

**This file's role going forward.** This file is now the **frozen
record** of the decisions that produced the revised canonical docs.
Do not edit R1–R16; if new decisions are needed, start a new
discussion file with a new date and add new R-entries there. A
fresh-Claude session that reads this file should treat R1–R16 as
authoritative and look to the revised canonical docs (`roadmap.md`,
`discovery.md`, `data-schemas.md`, `architecture.md`, etc.) for the
working spec.

**Working style for the resume session (operator-endorsed,
2026-04-08):** dialogue mode, one focused sub-question at a time,
each question presented with Claude's own opinion / recommendation
clearly stated, the operator answers, the resolved decision is
written into this file in the "Resolved decisions" section in a
form a future fresh-Claude can act on without conversation memory.
Do not batch questions. Do not skip the recommendation. Do not
start a new thread until the current one is fully resolved.

**Where Thread 2 will pick up:** Q1 will confirm the M1–M5 count
and shape (vs. recutting to M1–M4 or M1–M6) in light of R1–R9.
Subsequent questions cover M2 scope depth ("Standard" vs. recut),
M3 scope including the R4 parallel-running migration sub-scope,
how to write M4 as a deliberate scope sketch without overcommitting,
payment-trigger structure across milestones, acceptance tests
phrased so a non-technical owner can verify them, and the
inter-milestone gap rules (operator clock, client review window,
invoicing rhythm).

---

## Where to start (open question for next session)

Pick one:

1. **Deal mechanics (Thread 1).** Claude has no idea what the
   contract structure looks like and it changes everything
   downstream. **First-choice question.**
2. **Master milestone shape (Thread 2).** If the deal is already
   fixed-price-per-phase, work on the milestone breakdown directly.
3. **The unilateral decisions in section A–E above.** Pick a row
   number (e.g. #6, #14, #19). The 🔴 ones are the ones Claude most
   wants a second opinion on.
4. **Discovery scope.** The single biggest information-gap blocker.
   How to actually run Discovery so it produces signable evidence
   in a defined timebox, instead of becoming an open-ended research
   project.
