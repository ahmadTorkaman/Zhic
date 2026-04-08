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

---

## Session progress / resume marker

**Last touched:** 2026-04-08, mid-discussion pause requested by operator.

**Threads completed:**
- ✅ **Thread 1 — Deal mechanics** (R1–R5)
- ✅ **Thread 4 — Discovery scope** (R6–R9)

**Threads remaining:**
- ⏳ **Thread 2 — Master milestone shape** (not started; ~5–7 sub-questions planned)
- ⏳ **Section A–E 🔴 unilateral decisions** (not started; pick by row number)
- ⏳ **Thread 3 — Risks** (final summary pass)

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
