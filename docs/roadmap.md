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
- [x] Locked product decisions: lead-gen, EN-only, several showrooms,
      editorial sign-off, GIFs + glTF per product, Payload in-process.
- [ ] Brand spec hand-off from the company (typography, color, voice, logo
      usage, photography rules) → folded into `design-system.md`.
- [ ] Design system experimentation phase: a sandbox app where we can
      iterate on motion, type, color, and 3D viewer choices and measure
      both aesthetic and Core Web Vitals impact. **The design system must
      be signed off before Phase 1 starts.**
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

## Phase 2 — Product detail pages, Journal, Showrooms

**Goal:** Give the site real, indexable content surface area. This is the
single biggest SEO unlock.

Scope:

- `/products/[slug]` template with full PDP: still gallery, **GIF loops**,
  **WebXR / 3D viewer** (glTF + USDZ fallback for iOS Quick Look), specs,
  materials, related, JSON-LD `Product`. The CTA is "Inquire," not "Add to
  cart" (lead-gen).
- `/products` collection index with filtering (size, material, price band).
- `/journal` and `/journal/[slug]` MDX-rendered articles, with the
  **editorial sign-off** workflow live (draft → review → publish).
- `/journal/category/[slug]` and `/journal/tag/[slug]` archive pages.
- `/showrooms` index and `/showrooms/[slug]` per-location pages, each
  with its own `LocalBusiness` JSON-LD, hours, map, and inquiry CTA.
- Internal linking blocks: "Related products," "From the journal," "Pairs
  with."
- Breadcrumbs with `BreadcrumbList` JSON-LD.
- Per-page OG images generated from product/article data.
- The 3D viewer must meet performance budgets: lazy-mounted on user
  intent (click-to-load), draco-compressed glTF, ≤ 2 MB per model.

Exit criteria: at least 6 product pages (each with GIFs and a working
WebXR model), 6 journal articles, and all showrooms indexed, with Search
Console showing impressions for non-brand queries.

---

## Phase 3 — Admin platform (Payload)

**Goal:** Hand the keys to marketing. Editors can change prices, write
articles, add products, and post events without a developer.

Scope:

- Payload 3 mounted **in the same Next.js app** at `/admin`. Shared
  TypeScript types, shared Postgres, single deploy.
- All collections from `data-schemas.md`.
- Migration script that moves the static `content/` and `products` data into
  Postgres.
- Roles: `admin`, `editor`, `marketing`, `viewer` (see `admin-panels.md`).
- **Editorial sign-off workflow**: marketing creates and edits drafts;
  only `editor` and `admin` can publish. The "Submit for review" button
  routes the document into a review queue surfaced on the dashboard.
- Audit log on price, slug, publish, and review events.
- Media library with alt-text enforcement, image/video/GIF size guards,
  and a dedicated 3D-asset uploader (glTF/GLB/USDZ) with model preview
  and polycount/file-size budgets.
- Bulk price editor screen (custom Payload view).
- Showroom manager (multi-location, hours, contact, gallery).
- Redirects collection auto-populated on slug change.
- Draft / preview / scheduled publish for every content collection.

Exit criteria: a non-developer can add a new product (with stills, GIFs,
3D model, variants, SEO fields, JSON-LD), submit it for review, get it
approved, and publish it — all from the admin.

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

## Phase 5 — Scale & polish

**Goal:** Tighten everything for the long run. The site stays English-only
and lead-gen-only by decision; this phase is about depth, not new
business models.

Scope:

- Search (Typesense or Meilisearch) over products + journal, surfaced as
  `/search`.
- WebXR upgrades: per-product variant materials swappable in 3D, optional
  room-scale AR placement.
- A/B testing harness for hero copy, CTAs, and 3D viewer placement.
- Cross-showroom analytics (which location drives which inquiries).
- Optional: lightweight CRM bridge so the sales team sees inquiries in
  HubSpot / Pipedrive instead of (or alongside) the admin inbox.
- Performance hardening pass on the 3D viewer and the hero video.

Exit criteria: search is live, the 3D viewer is interaction-tested with
real users, CWV remain green at scale.

> Note: internationalization and e-commerce checkout are explicitly out of
> scope. Schemas keep their `(L)` localization fields and price/SKU
> structure so we are not painted into a corner if business strategy
> changes, but no implementation work is planned.

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
