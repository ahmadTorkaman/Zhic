# Implementation State

**Purpose:** the single file Claude reads at session start to know
exactly what's done, what's in flight, and what's blocked. Keep it
terse — this is a status board, not a narrative.

**Update rule:** the last step of every session must be to update this
file. If it's not updated, the session isn't complete.

Related:
- `docs/sessions.md` — static plan (scope, deliverables, exit checks)
- `docs/sessions/session-<X.Y>-plan.md` — per-session execution plan
- `docs/package1-month1.md` — Month 1 source of truth

---

## Snapshot

| Field | Value |
| --- | --- |
| Last updated | 2026-04-15 |
| Current phase | Package 1, Month 1 |
| Current session | 1.4 shipped; next is 2.1 (components) |
| Active branch | `claude/session-1.4-locale-money` |
| Main branch | `main` (not yet updated — PRs still open) |

---

## Session status

Legend: ⬜ not started · 🟡 in progress · ✅ shipped · 🚧 blocked

### Phase 0 — Planning & Docs

| Session | Status | Commit | Notes |
| --- | --- | --- | --- |
| 0.1 Docs reorg + session plan | ✅ | `885572e` | — |

### Phase 1 — Monorepo Foundation

| Session | Status | Commit | Notes |
| --- | --- | --- | --- |
| 1.1 Monorepo scaffold | ✅ | `9817b78` | Turborepo + pnpm, apps/web, services/api, all package stubs |
| 1.2 Design system + Tailwind preset | ✅ | `ad76d28` | Tokens (TS + CSS), Tailwind v4 `@theme`, Ayandeh via `next/font/local`, `/lab/tokens` verification page. Plan: `docs/sessions/session-1.2-plan.md` |
| 1.3 Payload 3 CMS + collections | ✅ | `68d2683` | 8 collections + 11 globals, Postgres adapter, S3 storage, seed. Plan: `docs/sessions/session-1.3-plan.md` |
| 1.4 Locale + money utilities | ✅ | _this commit_ | `@zhic/locale` (digits, ZWNJ, Jalali, phone) + `@zhic/money` (rial↔toman, format, parse), Vitest wired, 80 tests, `/lab/locale`, closes FU-1.3-c. Plan: `docs/sessions/session-1.4-plan.md` |

### Phase 2 — Core UI Components

| Session | Status | Commit | Notes |
| --- | --- | --- | --- |
| 2.1 Button, form fields, badges | ⬜ | — | Blocked on 1.2 → now unblocked |
| 2.2 Navigation, footer, layout shell | ⬜ | — | Blocked on 1.2 + 2.1 |
| 2.3 Cards + image gallery | ⬜ | — | Blocked on 1.2 + 2.1 |

### Phase 3 — Core Pages

| Session | Status | Commit | Notes |
| --- | --- | --- | --- |
| 3.1 Home page | ⬜ | — | Blocked on 2.2, 2.3, 1.3 |
| 3.2 Product index + PDP | ⬜ | — | Blocked on 3.1 |
| 3.3 Showrooms + contact | ⬜ | — | Blocked on 3.1 |
| 3.4 Legal + static pages | ⬜ | — | Blocked on 3.1 |

### Phase 4 — Editorial Pages

| Session | Status | Commit | Notes |
| --- | --- | --- | --- |
| 4.1 Journal + article pages | ⬜ | — | Blocked on 2.3, 1.3 |
| 4.2 FAQ, About, Atelier, Care, Events, Categories | ⬜ | — | Blocked on 2.2, 1.3 |

### Phase 5 — Inquiry Flow + SMS

| Session | Status | Commit | Notes |
| --- | --- | --- | --- |
| 5.1 Inquiry form + SMS routing | ⬜ | — | Blocked on 1.3, showroom data |

### Phase 6 — SEO + Motion + Polish

| Session | Status | Commit | Notes |
| --- | --- | --- | --- |
| 6.1 SEO foundations | ⬜ | — | Blocked on Phases 3–4 |
| 6.2 Motion + scroll effects | ⬜ | — | Blocked on Phases 3–4 |
| 6.3 QA + final polish | ⬜ | — | Last session of Month 1 |

### Phase 7 — Infrastructure & Deployment

| Session | Status | Commit | Notes |
| --- | --- | --- | --- |
| 7.1 VPS + CI/CD | ⬜ | — | Can start after Phase 1 (manual SSH work) |

---

## Follow-ups (tech debt logged during execution)

| Id | From | Item |
| --- | --- | --- |
| FU-1.2-a | 1.2 | Generate `packages/design-system/css/tokens.css` from `src/tokens/*.ts` to prevent drift |
| FU-1.2-b | 1.2 | Subset Ayandeh to Arabic + ZWNJ + ASCII at build time (`docs/spec/design-system.md` §2.2) |
| FU-1.2-c | 1.2 | Lab layout uses deprecated `font-serif` utility (Cormorant was removed); clean up when `packages/ui` layout primitives land in 2.1 |
| FU-1.3-a | 1.3 | Add `status: draft\|published` fields when Phase 3 pages need it |
| FU-1.3-b | 1.3 | Add SEO group fields on collections (Session 6.1) |
| ~~FU-1.3-c~~ | 1.3 | ~~Migrate product price from toman to rials~~ — **resolved in 1.4** (`basePriceRials`) |
| FU-1.4-a | 1.4 | `<MoneyDisplay rials={...}/>` in `@zhic/ui` at first product card (2.x) |
| FU-1.4-b | 1.4 | Real `formatMoneyCompact` with Persian scale words (هزار/میلیون/میلیارد) |
| FU-1.4-c | 1.4 | `parseJalaliDate` for admin date inputs (Package 3) |
| FU-1.4-d | 1.4 | Postal-code + landline validators for checkout (Package 2) |
| FU-1.4-e | 1.4 | `@vitest/coverage-v8` + CI gates when Gitea Actions lands |
| FU-1.4-f | 1.4 | Swap Payload `basePriceRials` to text-backed bigint if any value ever exceeds `Number.MAX_SAFE_INTEGER` |
| FU-1.4-g | 1.4 | Move `slugify` into `@zhic/locale` when a second consumer appears |

---

## Open decisions (block future work if left unresolved)

| Id | Topic | Blocking | Note |
| --- | --- | --- | --- |
| OD-palette | Logo-derived palette (forest green + gold) vs spec palette (ivory + charcoal + saffron) | All visual work | Spec wins per `CLAUDE.md`. Flagged in `ad76d28` commit body. Needs brand sign-off before contradicting. |
| OD-latin-face | Latin secondary face (spec §2.2 says TBD) | 2.1+ components with Latin runs | Currently Ayandeh covers Latin via its own glyphs. Revisit when editorial templates land. |
| OD-logo-lockup | Persian-only / Latin-only / stacked wordmark | Header (2.2), OG images (6.1) | `design-system.md` §12 Q3 |

---

## Environment quick-facts

- Node: see `.nvmrc`
- Package manager: pnpm (Turborepo workspace)
- Primary commands:
  - `pnpm install`
  - `pnpm --filter @zhic/web dev`
  - `pnpm --filter @zhic/web build`
  - `pnpm --filter @zhic/<pkg> typecheck`
  - `pnpm --filter @zhic/<pkg> lint`
- Verification surfaces: `/lab/tokens`, `/lab/locale`, `/lab/type`, `/lab/color`, `/lab/motion`, `/lab/three`
- Unit tests: `pnpm --filter @zhic/locale test` (53), `pnpm --filter @zhic/money test` (27). Runner = Vitest 2.x, per package.
