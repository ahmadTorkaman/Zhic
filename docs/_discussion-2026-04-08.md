# Discussion notes — 2026-04-08

**Status:** working notes, not canonical. This file exists so the
conversation about commercial scope, master roadmap shape, and the
unilateral decisions Claude made during the doc rewrites can be
picked up on a different machine. Delete or fold into the real
roadmap once decisions are made.

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
