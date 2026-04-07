# Roadmap

A phased plan from the current single-page static site to a full content +
commerce-adjacent platform with a custom admin. Phases are sequential; nothing
in a later phase should be started before its predecessor is shipped and
measured.

---

## Phase 0 — Discovery & alignment (current phase)

**Goal:** Lock the brand, the data model, and the design system on paper so
that no implementation work has to be redone.

Deliverables:

- [x] `docs/` folder with roadmap, sitemap, design system, schemas, admin
      spec, SEO playbook.
- [ ] Brand spec sign-off from the company (typography, color, voice, logo
      usage, photography rules).
- [ ] Confirmed answers to the open questions in `README.md` (e-commerce vs
      lead-gen, locales, showroom count, editor team size).
- [ ] Approved design tokens and motion language.
- [ ] Approved data schemas.

Exit criteria: a stakeholder can read this folder and predict exactly what the
finished product will look and feel like.

---

## Phase 1 — Foundations

**Goal:** Make the existing homepage production-grade and SEO-ready, without
yet introducing a CMS. This unblocks marketing immediately and gives us a
performance baseline.

Scope:

- Tokenize the Tailwind theme from `design-system.md`.
- Extract layout primitives (`<Container>`, `<Grid>`, `<Stack>`, `<Section>`).
- Replace ad-hoc copies with a `content/` directory of typed TS/MDX files
  (still developer-edited, but structurally identical to what the CMS will
  later provide).
- Add `generateMetadata` to every route, even if there is only one.
- Add `app/sitemap.ts`, `app/robots.ts`, `app/manifest.ts`.
- Add `Organization` + `LocalBusiness` JSON-LD to the root layout.
- Add OG image generation (`opengraph-image.tsx`).
- Add a poster frame + `prefers-reduced-motion` fallback for the hero video.
- Wire GA4 + Plausible behind a consent banner.
- Set Core Web Vitals budgets in CI (Lighthouse CI or `@next/bundle-analyzer`).

Exit criteria: Lighthouse 95+ on mobile, all four CWV in the green, valid
sitemap submitted to Search Console.

---

## Phase 2 — Product detail pages & Journal

**Goal:** Give the site real, indexable content surface area. This is the
single biggest SEO unlock.

Scope:

- `/products/[slug]` template with full PDP (gallery, specs, materials,
  related, JSON-LD `Product`).
- `/products` collection index with filtering (size, material, price band).
- `/journal` and `/journal/[slug]` MDX-rendered articles.
- `/journal/category/[slug]` and `/journal/tag/[slug]` archive pages.
- Internal linking blocks: "Related products," "From the journal," "Pairs
  with."
- Breadcrumbs with `BreadcrumbList` JSON-LD.
- Per-page OG images generated from product/article data.

Exit criteria: at least 6 product pages and 6 journal articles indexed, with
Search Console showing impressions for non-brand queries.

---

## Phase 3 — Admin platform (Payload)

**Goal:** Hand the keys to marketing. Editors can change prices, write
articles, add products, and post events without a developer.

Scope:

- Payload 3 mounted at `/admin`, sharing the Next app or running as a
  sibling service (decision in Phase 1).
- All collections from `data-schemas.md`.
- Migration script that moves the static `content/` and `products` data into
  Postgres.
- Roles: `admin`, `editor`, `marketing`, `viewer` (see `admin-panels.md`).
- Audit log on price, slug, and publish events.
- Media library with alt-text enforcement and image/video size guards.
- Bulk price editor screen (custom Payload view).
- Redirects collection auto-populated on slug change.
- Draft / preview / scheduled publish for every content collection.

Exit criteria: a non-developer can add a new product (with images, variants,
SEO fields, JSON-LD) end-to-end, see it on a preview URL, and publish it.

---

## Phase 4 — Marketing surface

**Goal:** Tools for campaigns and conversion.

Scope:

- Landing page builder (block-based) for ad campaigns.
- Promotions / discount banner system with scheduling.
- Newsletter signup integrated with Klaviyo, double opt-in.
- Lead inbox: contact form + trade-program form submissions queryable in
  admin, exportable, forwarded to email.
- Reviews / testimonials collection with moderation and `Review` JSON-LD.
- Showroom appointment booking + `Event` JSON-LD for in-store events.

Exit criteria: marketing can launch a campaign landing page, run an email
capture, and read leads — all without a developer.

---

## Phase 5 — Internationalization & scale

**Goal:** Open the brand beyond a single locale and prepare for inventory /
checkout if the business decides to sell online.

Scope:

- `next-intl` (or Payload-native localization) with `en`, plus one more
  locale TBD.
- `hreflang` tags and per-locale sitemaps.
- Currency display per locale.
- Optional: Stripe-backed checkout, inventory sync, order management.
- Optional: search (Typesense) over products + journal.

Exit criteria: a second locale is live with parity, or — if the business
stays lead-gen — the data model already supports it without refactor.

---

## Phase 6 — Continuous SEO & content ops

**Goal:** Treat SEO as a recurring operation, not a launch task.

Scope:

- Monthly content calendar managed in admin.
- Search Console + GA4 dashboards embedded in admin home.
- Broken-link and 404 monitor.
- Schema validation in CI (every PR runs structured-data tests).
- A/B testing harness for hero copy and CTAs.
- Keyword tracking notes per article.

Exit criteria: marketing has a repeatable monthly cadence and KPI dashboard.

---

## Sequencing rules

- **Never start Phase N before Phase N−1 is in production.** The temptation
  with admin work is to build it before the design system is ready; resist.
- **Design tokens are never bypassed.** If a Phase 2 component needs a color
  that does not exist in `design-system.md`, the token is added there first.
- **Schemas are never bypassed.** If a Phase 3 collection needs a field that
  is not in `data-schemas.md`, that doc is updated and reviewed first.
- **No content is created in code after Phase 3.** Once the CMS is live, all
  copy lives in the database.
