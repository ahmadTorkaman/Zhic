# Discovery

The Zhic platform replaces real systems that real people already use.
Before we build, we understand what exists, why it was built that way,
what works, what doesn't, and what the people using it have quietly
invented to make up for its gaps. This document is where those findings
live.

**This file starts as a template and ends as a report.** Every section
begins with a description of what to capture and a `_pending_` marker.
As discovery progresses, the markers are replaced with real findings,
screenshots, quotes, tables, and links. The file is done when no
`_pending_` markers remain and a product owner can defend every
decision in `admin-panels.md` and `data-schemas.md` by pointing at a
section here.

> **Rule of thumb.** The workarounds are gold. Every Excel sheet,
> every WhatsApp group, every paper notebook, every sticky note on a
> monitor is a requirement the current system failed to meet. Capture
> them. A good discovery report has more quotes from users than
> screenshots of the app.

---

## 1. Purpose, scope, and non-goals

### 1.1 Purpose

- Understand the **existing showroom managers app** deeply enough to
  replace it without regression.
- Understand the **existing order, factor, stock, and customer flows**
  end-to-end, across every system the business already uses.
- Surface the workarounds the team has invented, so we encode them as
  first-class features instead of re-building the same gaps.
- Produce a **migration plan** for the data that must come across.
- Produce a **gap analysis** that feeds into `admin-panels.md`,
  `data-schemas.md`, and the CRM / ERP scope.

### 1.2 In scope

- The showroom managers app (whatever it is called, whoever built it,
  whatever state it is in).
- Every showroom (all locations, including Hamedan).
- The Hamedan factory + warehouse workflow for finished goods.
- Any accounting software currently used for factor generation.
- Any spreadsheet, messaging app, or paper system that holds business-
  critical state (customers, orders, stock, deliveries).
- The current customer database, wherever it lives.
- The current product catalog, wherever it lives.

### 1.3 Out of scope (eight named items per R9)

These are named in the Package 1 addendum. If they come up during
Discovery, they are parked in the "Out of scope (parked for Package 2+
scoping)" appendix (section 15) rather than absorbed into Package 1.

1. **Supplier / vendor integrations.** Discovery maps Zhic's internal
   systems only. No supplier portals, raw-material tracking, vendor
   APIs. Package 4 / ERP territory.
2. **Social media operational flows.** Instagram DMs, Telegram orders,
   WhatsApp customer service are acknowledged as acquisition channels
   but not mapped as operational workflows and not committed to as
   integration targets.
3. **Factory QC, production scheduling, deep MES details.** Discovery
   does one factory walk for context, not a deep audit. QC checklists,
   batch tracking, machine integration, production scheduling are
   Package 4 / MES territory. (See `_mes-notebook.md` for the
   operator's personal R&D notes.)
4. **HR / payroll / staff management.** Out of scope, full stop. Not
   Zhic platform territory even if the legacy app has staff records.
5. **Marketing analytics beyond Plausible.** No Google Analytics, Meta
   Pixel, ad attribution, marketing measurement stack. The SEO
   specialist owns that conversation separately.
6. **Existing website / content audit & migration.** Clean-break
   assumption. Old-content migration, if requested, is a separate
   Package 2 scope item to be priced.
7. **Competitor analysis.** Tempting but bottomless. Discovery is about
   Zhic. Competitor work belongs to the SEO specialist and marketing
   lead.
8. **Product photography / 3D asset creation.** Discovery does not
   produce, audit, or commission photos or 3D models. The 3D artist
   owns that workflow separately.

**Pricing strategy: deferred to Package 2.** Discovery captures the
current price list as data but does not investigate how prices are set,
discount structures, dealer pricing, or special-customer deals.

### 1.4 Exit criteria (R6 — three named artifacts + R8 — three signatures)

Discovery is done when **all three** of the following artifacts exist
**and** all three signatures are committed to `docs/m1-signoffs/`:

**Artifacts:**

1. **A fully populated `discovery.md`** — every section below has real
   content, not `_pending_`. Covers: schema dump, legacy-app feature
   inventory (section 3.3b), P0 workflow maps (order signing first),
   accountant interview notes, factory walk notes, showroom-by-showroom
   usage reality check.
2. **A first-draft new-system schema sketch** — the multi-schema
   Postgres split with actual table shapes (not just schema names),
   round-tripped against a sample of legacy data. Every field in the
   legacy DB has a home in the new sketch or is explicitly marked
   "dropped — reason X." At least one sample export from the legacy
   app loads cleanly into the sketch.
3. **A one-day accountant schema-walk note** — the operator walks the
   accountant through factor-related tables specifically. Decisions #7
   (rials-stored / toman-displayed) and #10 (factor immutability +
   adjustment-factor) are validated or revised. Output appended to
   section 13 of this document.

**Signatures (three separate sessions, not a combined readout):**

1. **The owner** — signs the overall Discovery deliverable as "this
   represents the business I run."
2. **The accountant** — signs the schema-walk note (artifact #3) as
   "this represents the factor and money flow I'm responsible for."
3. **At least one showroom manager** — the most active in the legacy
   app (determinable from the W1 schema dump). Signs the order-signing
   workflow map as "this is how my showroom actually works."

Sign-off is wet-ink on printed PDF, photographed, committed to
`docs/m1-signoffs/`. Package 1 cannot close until all three signatures
are committed.

**Additional exit conditions:**

4. A v1 / v1.5 / stretch breakdown for the showroom manager scope
   (section 9) is approved by the product owner.
5. A migration plan (section 10) exists for every data source that
   must carry forward, with a named owner per source.

### 1.5 Critical access assumption (R2)

The operator has been promised **both UI and database access** to the
existing showroom managers app. This removes the single biggest
Discovery risk (reverse-engineering from screenshots only).

**Top-level Discovery task:** obtain read-only credentials + schema
dump of the existing showroom managers app within the first 5 working
days of Package 1. This is the Discovery critical path.

A UI-walkthrough track runs in parallel for workflows that aren't
visible in the schema (printing, exports, daily rituals) — schema
tells you data, UI tells you process.

---

## 2. Methodology

### 2.1 How to run discovery

1. **Get access.** Ask for real credentials on the existing showroom
   managers app, read-only if possible. If the app has different views
   per showroom, get access to at least two (Hamedan plus one other).
2. **Inventory before you interview.** Walk every screen yourself
   first. Take screenshots. Write down every field. You want to arrive
   at interviews already knowing the vocabulary.
3. **Interview users in their environment.** Not over a call.
   Physically at the showroom, sitting next to the manager while they
   use the system. Ask them to walk you through a real day. Shut up
   and watch.
4. **Follow the paper trail.** Every time a user says "and then I
   write it here," ask where "here" is. Notebook? Excel? WhatsApp to
   HQ? Follow every hop until you hit either the final system of
   record or a dead end.
5. **Don't design.** Resist the urge to say "oh, we'll fix that."
   Discovery is listening, not selling. Promising features in the
   room poisons the data — the manager will start telling you what
   you want to hear.
6. **Capture verbatim.** Write down what users actually say, in their
   own words, in Persian. Quotes go into the findings. Translated
   paraphrases lose half the signal.

### 2.2 What to capture per interaction

For every screen, form, report, or workflow:

- **What it is:** name, location in the nav, purpose in one sentence.
- **Who uses it:** role, frequency (daily / weekly / rarely).
- **What it contains:** fields, columns, actions, links out.
- **What works:** the specific things users volunteer as "good."
- **What doesn't:** slowness, friction, confusing labels, missing
  filters, broken exports.
- **Workarounds:** what they do instead. Spreadsheets, WhatsApp,
  paper, phone calls.
- **Quotes:** the exact words users used.

### 2.3 Tools

- **Screenshots** of every unique screen in every app. Stored in
  `docs/discovery/screenshots/` (to be created) with descriptive names
  like `old-showroom-app__orders-list.png`.
- **Audio or notes** from interviews, with the user's permission.
  Notes are sufficient if audio is uncomfortable.
- **Raw exports** from any CSV / Excel / database we can get our
  hands on, stored in `docs/discovery/raw/` (gitignored; raw data
  must not end up in the public repo).
- **A shared index** — this file — linking to everything above.

---

## 3. The existing showroom managers app

### 3.1 Identification

Basic facts about the app itself, before any workflow.

| Field | Value |
| --- | --- |
| Official name | _pending_ |
| Internal / slang name users actually use | _pending_ |
| Vendor / agency / developer | _pending_ |
| When was it built | _pending_ |
| Who maintains it now | _pending_ |
| Technology (web, desktop, mobile, Telegram bot, ...) | _pending_ |
| Languages available | _pending_ |
| Hosting location | _pending_ |
| Last time it was updated | _pending_ |
| Has an API? | _pending_ |
| Has an export? | _pending_ |
| Who owns the data it holds | _pending_ |
| Cost per month / year | _pending_ |

### 3.2 Access

| Field | Value |
| --- | --- |
| URL | _pending_ |
| Test account (role) | _pending_ |
| Test account (showroom) | _pending_ |
| Who granted access | _pending_ |
| Notes on login flow (SMS, password, weirdness) | _pending_ |

### 3.3 Screen inventory

One row per unique screen. Fill in as you walk the app. Screenshots
live alongside this doc under `docs/discovery/screenshots/`.

| Screen | Purpose | Main data | Actions | Role(s) | Daily / weekly / rarely | Screenshot |
| --- | --- | --- | --- | --- | --- | --- |
| _pending_ | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ |

### 3.3b Legacy-app feature inventory (R4 — separate from schema)

Schema tells us what data exists. This section tells us **what the app
actually lets staff do day-to-day, and how often.** This inventory is
a separate Discovery deliverable from the schema analysis and is the
one that gates Package 2 scope, because Package 2 has to match or
exceed the workflows the legacy app currently provides — otherwise
staff will refuse to switch.

For every workflow the existing app supports:

| Workflow | Description | Frequency (daily/weekly/rarely) | Who does it | Observed example | Notes |
| --- | --- | --- | --- | --- | --- |
| _pending_ | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ |

**P0 workflow — order signing.** This is the one workflow known to be
load-bearing today. Map it before anything else:

- Who signs: _pending_
- On what device: _pending_ (in-showroom shared tablet? manager's
  personal phone? desktop in the back office?)
- In what physical context: _pending_
- What triggers the signing event: _pending_
- What happens to the signed order afterwards: _pending_ (printed?
  exported? handed to the factory?)

### 3.4 Data model (reverse-engineered)

What entities appear to exist, what fields they have, what relations
can be inferred from the UI. If an API is available, dump its schema
here instead of inferring.

```
entity: _pending_
fields:
  - _pending_
relations:
  - _pending_
notes:
  - _pending_
```

Repeat for every entity.

### 3.5 What works

Things users actively defend about the current app. These are
**requirements the new app must preserve**, not just nice-to-haves.

- _pending_

### 3.6 What doesn't work

The friction, the gaps, the slowness, the bugs, the confusing labels,
the missing features users asked for and never got. Cite quotes where
possible.

- _pending_

### 3.7 Reported bugs and known issues

Things the business already knows are broken but lives with.

- _pending_

---

## 4. Workarounds (the gold)

The single most important section of this document. Every workaround
is a requirement the existing system failed to meet. If we ignore
them, we rebuild the same gaps.

### 4.1 Excel / Google Sheets workbooks in active use

| Workbook | Owner | Lives where | What it tracks | Why it exists (what the app can't do) |
| --- | --- | --- | --- | --- |
| _pending_ | _pending_ | _pending_ | _pending_ | _pending_ |

### 4.2 WhatsApp / Telegram / Eitaa groups in active use

| Group | Members | Purpose | What gets decided here | What should be in a system instead |
| --- | --- | --- | --- | --- |
| _pending_ | _pending_ | _pending_ | _pending_ | _pending_ |

### 4.3 Paper notebooks, receipts, sticky notes

- _pending_

### 4.4 Phone calls as coordination

What is currently communicated by calling someone because no system
supports it.

- _pending_

### 4.5 "The one person who knows"

Any workflow that depends on one specific human remembering how
something works because it is not documented anywhere.

- _pending_

---

## 5. Interviews

At least **2–3 showroom managers** plus **one HQ stakeholder**. More
is better. Prefer managers from different showrooms so we catch
location-specific variation.

### 5.1 Interview template (re-use per interview)

```
Interview: [manager name], [showroom], [date]
Interviewer: [your name]
Format: [in-person / call / written]

Background
  - How long in the role?
  - What did you do before this?
  - What systems have you used in previous jobs?

A day in the role
  - Walk me through yesterday, from the moment you unlocked the door
    until you locked up.
  - Which parts were normal, which were exceptional?

The app
  - Which screens do you use every day?
  - Which do you avoid?
  - What do you wish worked differently?
  - What have you stopped using entirely, and why?
  - Show me the last order / customer / delivery you handled. Walk me
    through every click, every copy-paste, every switch to another
    app, sheet, or notebook.

Workarounds
  - Where do you keep information the app doesn't hold?
  - When you need to share something with HQ or another showroom, how?
  - What do you wish the app did that you currently do by hand?

Customers
  - How do you identify a repeat customer?
  - How do you remember what a customer was interested in last time?
  - How do you follow up after a delivery?

Stock
  - Do you know, right now, how many of product X are on the floor?
  - Do you know what's been reserved vs. what's free?
  - When HQ transfers stock in, how does it show up?

Deliveries
  - How do you schedule a delivery?
  - How do you know it arrived?
  - What happens when it doesn't?

Problems
  - What's the most frustrating thing about your current tools?
  - If you could wave a wand and fix one thing, what would it be?
  - If we replaced the current app tomorrow, what would you miss?

Wrap-up
  - Anything I should have asked but didn't?
  - Who else should I talk to?
```

### 5.2 Findings per interview

| Interview | Key quotes | Top 3 pains | Top 3 loved-features | Requirements implied |
| --- | --- | --- | --- | --- |
| _pending_ | _pending_ | _pending_ | _pending_ | _pending_ |

### 5.3 Cross-interview themes

Once you've done 2+ interviews, look for patterns. A theme is any
pain, workaround, or wish that shows up independently in more than
one conversation.

- _pending_

---

## 6. Business workflows (end-to-end)

The goal here is to describe each real workflow step-by-step, with
every hop between systems. Not as "the app supports ordering" but as
"the manager takes the customer's phone number, writes it on a paper
slip, then later types it into the app, then sends a WhatsApp voice
note to HQ."

### 6.1 Customer walks into a showroom and buys a bed

Start at "customer opens the door," end at "bed is installed at
customer's home and the money is settled."

Step-by-step:

1. _pending_

Systems touched (in order): _pending_

Paperwork produced: _pending_

Who does what at each step: _pending_

Handoffs that break or get lost: _pending_

### 6.2 Customer inquires remotely (phone, Instagram DM, website form)

Start at "inquiry arrives," end at "customer is a real lead in the
pipeline with a responsible owner."

1. _pending_

### 6.3 Stock moves from factory to showroom

Start at "finished bed leaves the production line in Hamedan," end at
"bed is on the showroom floor and visible to the manager as available
stock."

1. _pending_

Special case: Hamedan showroom. The warehouse and the showroom are
co-located but separate entities. How does a bed cross from the
warehouse into the showroom today?

- _pending_

### 6.4 Stock moves between showrooms

Start at "a customer at showroom A wants a bed that's on the floor at
showroom B," end at "the customer has the bed."

1. _pending_

### 6.5 Factor (invoice) generation and issuance

Start at "order is confirmed and paid," end at "customer has a legal
factor with a real number, and the accountant has the matching
record."

1. _pending_

Number format observed in real factors: _pending_

Who assigns the number: _pending_

Which accounting software (if any) is the system of record: _pending_

Legal fields captured (buyer tax ID, economic code, VAT, etc.):
_pending_

### 6.6 Delivery scheduling and confirmation

Start at "order is paid and ready," end at "customer has the bed and
the delivery team is paid / reconciled."

1. _pending_

### 6.7 Returns and exchanges

Start at "customer has a problem," end at "return / exchange is
resolved, stock is adjusted, factor is amended."

1. _pending_

### 6.8 Post-sale follow-up

Does any exist today? If yes, how? If no, what does "good" look like
for the business?

- _pending_

---

## 7. Data sources inventory

Every system that currently holds business-critical state. One row
per system, no matter how small.

| System | Kind | Owner | Holds | Export format | Auth | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Existing showroom managers app | web app | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ |
| Accounting software | _pending_ | _pending_ | factors, ledger | _pending_ | _pending_ | _pending_ |
| Shared Google / Excel workbook(s) | spreadsheet | _pending_ | _pending_ | xlsx | _pending_ | _pending_ |
| WhatsApp / Telegram groups | messaging | _pending_ | coordination state | n/a | _pending_ | _pending_ |
| Paper notebooks | paper | _pending_ | _pending_ | n/a | _pending_ | _pending_ |
| Website form submissions | web | _pending_ | leads | _pending_ | _pending_ | _pending_ |
| Instagram DMs | social | _pending_ | leads | n/a | _pending_ | _pending_ |
| POS terminal (if any) | hardware | _pending_ | payments | _pending_ | _pending_ | _pending_ |
| Bank account statements | bank | _pending_ | payments | _pending_ | _pending_ | _pending_ |

---

## 8. Gap analysis

### 8.1 What the old app does that the new platform must preserve

Preserved requirements from sections 3.5 and 5.

- _pending_

### 8.2 What the old app does badly that the new platform must fix

From sections 3.6, 4, and 5.

- _pending_

### 8.3 What the old app doesn't do at all that the business needs

From sections 4 and 5. These are the workarounds — features the
managers have been faking with Excel, WhatsApp, and paper.

- _pending_

### 8.4 What the old app does that we deliberately will not port

Features that exist but no one uses, or that actively harm the
workflow. Call out each one explicitly so the decision is auditable.

- _pending_

### 8.5 Risks

Things discovery surfaced that could threaten the migration.

- _pending_

---

## 9. Scope breakdown for the new showroom manager surface

Translate findings into a phased scope. Every item must be traceable
back to a section above — if it isn't, it's speculation, not
discovery.

### 9.1 v1 (must ship with the first showroom-manager surface)

- _pending_ — traces to: _section X_

### 9.2 v1.5 (ships within the first follow-up release)

- _pending_ — traces to: _section X_

### 9.3 Stretch (explicitly phased, not "deferred")

- _pending_ — traces to: _section X_

### 9.4 Explicitly out of scope

With the reason.

- _pending_ — reason: _pending_

---

## 10. Migration plan

For every data source in section 7 that must carry forward into the
new platform, one entry here.

### 10.1 Source → target mapping

| Source | Target collection | Fields mapped | Cleaning required | Owner | Scheduled for |
| --- | --- | --- | --- | --- | --- |
| _pending_ | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ |

### 10.2 Data quality notes

What's broken in the source data that we need to handle on import.
Duplicate customers? Inconsistent phone formats? Missing national
IDs? Prices in toman vs. rial?

- _pending_

### 10.3 Cutover strategy

How do we switch from the old system to the new one without losing
business hours?

- _pending_

### 10.4 Fallback

If the cutover goes wrong, how do we go back?

- _pending_

---

## 11. Feedback into the other docs

Once a finding is confirmed, it must land in the relevant canonical
doc. This section is the routing table.

| Finding type | Where it lands |
| --- | --- |
| New collection or field | `data-schemas.md` |
| New admin screen or workflow | `admin-panels.md` |
| New role or permission | `admin-panels.md` §2 |
| New public URL or template | `sitemap.md` |
| New business rule about money / tax / factor | `data-schemas.md` + `README.md` locked decisions |
| New Persian copy convention | `design-system.md` §1 brand voice |
| New integration (SMS, payments, accounting) | `architecture.md` + `packages/*` |

When a finding is added to another doc, reference it here so we don't
lose the trail:

| Finding | Landed in | Date |
| --- | --- | --- |
| _pending_ | _pending_ | _pending_ |

---

## 12. Open questions

Things discovery raised that aren't answered yet. Each question gets
an owner and a deadline. If a question stays open for more than two
weeks, it either gets answered or gets promoted to a "decide and
move on" moment.

| Question | Raised by | Owner | Deadline | Status |
| --- | --- | --- | --- | --- |
| _pending_ | _pending_ | _pending_ | _pending_ | _pending_ |

---

## 13. Accountant schema-walk note

This section is populated after the one-day schema-walk with the
accountant (Discovery W4). It is the third R6 deliverable and must be
signed by the accountant per R8.

### 13.1 Attendees and date

- Date: _pending_
- Accountant name: _pending_
- Operator: _pending_

### 13.2 Factor-related tables reviewed

_pending_

### 13.3 Decision #7 — rials-stored / toman-displayed

Validated / revised: _pending_

Accountant's objections or confirmations: _pending_

### 13.4 Decision #10 — factor immutability + adjustment-factor pattern

Validated / revised: _pending_

Accountant's objections or confirmations: _pending_

### 13.5 Gift card tax treatment under Iranian VAT (R13 Shape C item)

_pending_

### 13.6 Factor numbering format confirmed

Format: _pending_

Per-showroom vs global sequence: _pending_

Year-scoped reset: _pending_

### 13.7 Other accountant feedback

_pending_

---

## 14. Status

A rolling log of where discovery is. Update at the end of each
working session so a new reader knows what's fresh and what's stale.

| Date | Who | What happened | Next |
| --- | --- | --- | --- |
| _pending_ | _pending_ | _pending_ | _pending_ |

---

## 15. Out of scope (parked for Package 2+ scoping)

Items raised by the client during Discovery that fall outside the
eight named out-of-scope items (section 1.3) but are still not
Discovery work. Each item gets a suggested home package.

| Item | Raised by | Suggested package | Notes |
| --- | --- | --- | --- |
| _pending_ | _pending_ | _pending_ | _pending_ |

---

## 16. Discovery follow-ups

Things surfaced at W4/W5 that the operator wants to investigate but
that are frozen per R7's overrun rule #3. These feed into Package 2's
budget, not Package 1's.

| Follow-up | Surfaced when | Relevant to | Notes |
| --- | --- | --- | --- |
| _pending_ | _pending_ | _pending_ | _pending_ |

---

## 17. Commerce Pricing Checkpoint inputs

Package 2 cannot be priced until all three of these artifacts are
landed and the first two are signed per R8.

| Artifact | Status | Signed by | Date |
| --- | --- | --- | --- |
| Accountant schema-walk note (section 13) | _pending_ | Accountant | _pending_ |
| Order-signing workflow map (section 6.1 / 3.3b P0) | _pending_ | Most active showroom manager | _pending_ |
| First-draft new-system schema sketch (R6 deliverable #2) | _pending_ | — | _pending_ |

---

## 18. Sign-off log

Updated as each R8 signature is collected.

| Signer | Role | Section signed | Date | Photo committed to `docs/m1-signoffs/` |
| --- | --- | --- | --- | --- |
| _pending_ | Owner | Overall Discovery deliverable | _pending_ | _pending_ |
| _pending_ | Accountant | Schema-walk note (section 13) | _pending_ | _pending_ |
| _pending_ | Showroom manager | Order-signing workflow map | _pending_ | _pending_ |
