# Zhic Platform — Agent Instructions

This file is the root context for any AI agent (Claude Code, sub-agents, or
future custom agents) working in this repository. It is loaded automatically
at the start of every session.

---

## What is Zhic?

An Iranian furniture company. The software platform covers: a Persian-first
public storefront, catalog and content administration (Payload 3), a CRM for
sales/showroom ops (Package 3), an ERP for inventory/finance (Package 3+),
and eventually an MES for the factory floor (Package 4). All in one monorepo.

**Domain:** `zhicwood.com`

---

## Current phase

**Package 1, Month 1** — Design system + landing page + editorial templates.
The detailed plan lives in `docs/package1-month1.md` — that file is the
**single source of truth** for Month 1 scope, stack, and schedule. When any
other doc conflicts with it, `package1-month1.md` wins.

**Read `docs/state.md` at session start.** It is the live status board:
which sessions are shipped, which are unblocked next, what is deferred,
and what open decisions are gating work. **The last step of every
session is to update `docs/state.md`.** If the file is not updated, the
session is not complete.

---

## Locked stack decisions

These are confirmed. Do not propose alternatives unless explicitly asked.

| Layer | Choice |
| --- | --- |
| VPS | Pars Pack (Iranian domestic) |
| CDN / DNS | Abr Arvan |
| Reverse proxy | Caddy (auto-TLS via Let's Encrypt) |
| Object storage | Abr Arvan (S3-compatible) |
| Database | PostgreSQL (self-managed on VPS) |
| CMS | Payload 3 (headless, inside Next.js at `services/api`) |
| Git server | Gitea (self-hosted at `git.zhicwood.com`) |
| CI / CD | Gitea Actions (develop → staging, main → production) |
| SMS | SMS.ir |
| Payment gateway | ZarinPal (final choice in Package 2) |
| Analytics | Plausible (self-hosted) |
| Framework | Next.js 16 App Router, React 19, TypeScript 5 |
| Styling | Tailwind v4, tokenized RTL-aware theme from `packages/design-system` |
| Motion | GSAP + Lenis (storefront); Framer Motion for micro-interactions |
| Persian font | **Ayandeh** (self-hosted TTF, 4 weights: Light, Regular, Bold, Black) |
| Monorepo | Turborepo + pnpm workspaces |

### Iran constraints

The team is based in Iran. Most US-based SaaS (Vercel, AWS, Cloudflare,
Sentry, sometimes Google Fonts) restrict Iranian IPs. Every tool must be
administrable from inside Iran and every customer-facing page reachable
without VPN.

---

## Subdomains

| Subdomain | Purpose |
| --- | --- |
| `zhicwood.com` | Production storefront |
| `staging.zhicwood.com` | Preview (password-protected) |
| `git.zhicwood.com` | Gitea |
| `api.zhicwood.com` | Payload CMS API |

---

## Monorepo layout (target)

```
zhic/
├── apps/web/              # Public storefront (Persian-first, RTL)
├── services/api/          # Payload 3 + REST
├── packages/
│   ├── design-system/     # Tokens, theme, Tailwind preset
│   ├── ui/                # Shared components
│   ├── db/                # Postgres schema, migrations
│   ├── auth/              # Session, phone+OTP
│   ├── api-client/        # Typed client for services/api
│   ├── locale/            # Jalali dates, Persian digits, ZWNJ
│   ├── money/             # Rial/toman conversion
│   ├── sms/               # SMS.ir wrapper
│   ├── payments/          # ZarinPal wrapper
│   ├── types/             # Shared domain types
│   └── config/            # Shared tsconfig, eslint, tailwind presets
├── docs/                  # All documentation
└── turbo.json
```

The current `src/` is a mockup that will be rehomed into `apps/web/` during
the monorepo split. It is not thrown away.

---

## Coding conventions

### Persian / RTL rules

- `<html lang="fa" dir="rtl">` on every page.
- Use logical CSS properties (`margin-inline-start`, not `margin-left`).
- ZWNJ (U+200C) in all Persian text: "می‌خواهید" not "میخواهید".
- Persian digits (۰–۹) in UI display. ASCII digits only in slugs, SKUs, code.
- Jalali calendar for all date display. UTC ISO storage.
- Money stored in rials (integer). Displayed in toman with thousands separator.

### Code rules

- No component is built before its tokens are defined in `design-system.md`.
- No CMS collection field added without updating `data-schemas.md`.
- No money logic outside `packages/money`.
- No SMS logic outside `packages/sms`.
- No payment logic outside `packages/payments`.
- No Jalali/Persian-digit logic outside `packages/locale`.
- Design tokens are never bypassed — if a color doesn't exist, add it to
  `packages/design-system` first.
- Fonts are self-hosted via `next/font/local` (Google Fonts blocked from Iran).

### Sequencing rules

- `docs/package1-month1.md` is the source of truth for Month 1 scope.
- `docs/roadmap.md` is the source of truth for the full delivery plan.
- When docs conflict, the more specific doc wins (`package1-month1.md` >
  `roadmap.md` > `README.md`).

---

## Key documents

| File | Purpose |
| --- | --- |
| `docs/state.md` | **Live status board** — read first, update last. Session status, commits, follow-ups, open decisions |
| `docs/package1-month1.md` | **Month 1 source of truth** — week-by-week schedule, stack, pages, CMS collections, inquiry form, exit criteria |
| `docs/roadmap.md` | Full 4-package delivery plan with payment triggers |
| `docs/sessions.md` | Session-based execution plan for Month 1 |
| `docs/spec/architecture.md` | Monorepo layout, apps, services, deployment |
| `docs/spec/design-system.md` | Brand tokens, typography, color, grid, motion, components |
| `docs/spec/data-schemas.md` | Every collection, field, relation across all schemas |
| `docs/spec/sitemap.md` | Public URL structure, page templates |
| `docs/spec/seo.md` | SEO playbook, structured data, performance budgets |
| `docs/spec/admin-panels.md` | Admin UX, screens, roles, workflows |
| `docs/discovery/discovery.md` | Template for reverse-engineering the legacy system |

---

## Team

- **Operator (repo owner)** — solo on dev and design for Package 1.
- **3D artist** — client-side resource for product 3D assets.
- **SEO specialist** — client-side resource for Persian keyword research and content strategy.
