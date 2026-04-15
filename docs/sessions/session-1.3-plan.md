# Session 1.3 — Payload 3 CMS + Collections

## Goal

Turn `services/api` from a bare Next.js 16 stub into a working Payload 3 CMS
with all Month 1 collections, Postgres adapter, S3-compatible media storage,
an admin panel at `/admin`, and seed data.

## Entry state

- Monorepo scaffolded (Session 1.1)
- `services/api/` is a Next.js 16 shell on port 3001, no Payload
- `packages/db/` and `packages/types/` are stubs

## Key decisions

| Decision | Choice |
|---|---|
| Singleton pages | Payload **Globals** (not a collection) |
| Money on Products | `number` in toman — migrate to rials when `packages/money` lands |
| S3 in dev | Optional — fallback to local disk if S3 env vars absent |
| Users | Payload's built-in default (email + password) |
| Draft/publish | Deferred — not needed until Phase 3 pages render |

## Deliverables

### Collections (8)
- `designs` — name, slug, age_group, description, gallery, featured
- `products` — name, slug, design (rel), piece_type, price, dimensions, materials, gallery, inquiry_enabled
- `showrooms` — name, slug, city, address, phone, manager_name/phone, hours, gallery, coordinates, is_central
- `articles` — title, slug, body, excerpt, cover, category (rel), tags (rel), published_at, author
- `categories` — name, slug
- `tags` — name, slug
- `media` — upload + alt, caption, decorative
- `inquiries` — name, phone, city, reason, preferred_date, message, routed_to, product, status

### Globals (11)
Home, About, Atelier, Contact, FAQ, Care, Events, Privacy, Terms, Returns, Shipping

### Infrastructure
- `payload.config.ts` — Postgres adapter, Lexical editor, S3 storage (optional)
- `(payload)` route group — admin pages + API routes
- `next.config.ts` — `withPayload()` wrapper
- `.env.example` — all required env vars
- `docker-compose.yml` — local Postgres
- Seed script with sample designs, products, showroom, article

### Package updates
- `packages/db` — updated comment (Payload manages its own tables)
- `packages/types` — hand-written consumer interfaces for Month 1
- `turbo.json` — `generate:types` and `seed` tasks

## Exit check

- [ ] `pnpm --filter @zhic/api dev` starts without errors
- [ ] Admin panel at `http://localhost:3001/admin` loads
- [ ] Can create/edit/delete documents in all collections
- [ ] All globals editable in admin
- [ ] Seed data visible after running `pnpm --filter @zhic/api seed`
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` passes

## Follow-ups logged

- FU-1.3-a: Add `status: draft|published` fields when Phase 3 pages need it
- FU-1.3-b: Add SEO group fields on collections (Session 6.1)
- FU-1.3-c: Migrate product price from toman (number) to rials (bigint) when `packages/money` lands

## Deferred

- Draft/publish workflow
- SEO fields on collections
- Access control beyond admin-only
- `auditLog`, `redirects`, `siteSettings` globals
- Full `users` schema (roles, phone OTP)
- `productVariants`
- Webhook/revalidation hooks
- Payload email config
