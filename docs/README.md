# Zhic — Product Documentation

This folder is the single source of truth for the Zhic website, admin platform,
and brand system. It is intentionally written before any of the admin or CMS
code is built so that the design system, data model, and SEO posture all stay
in lockstep.

Zhic is a New York atelier producing handcrafted, luxury bedroom furniture.
The website must feel like the brand: dazzling but minimal, graphic, calm,
with rich, subtle motion. It must also be a serious lead-generation and SEO
asset — every architectural decision is graded against both bars.

## Documents

| File | Purpose |
| --- | --- |
| [`roadmap.md`](./roadmap.md) | Phased delivery plan from current static site to full platform. |
| [`sitemap.md`](./sitemap.md) | Public URL structure, page templates, and information architecture. |
| [`design-system.md`](./design-system.md) | Brand tokens, typography, color, grid, motion, components. |
| [`data-schemas.md`](./data-schemas.md) | Every collection, field, relation, and validation rule. |
| [`admin-panels.md`](./admin-panels.md) | Admin UX, screens, roles, and workflow specs. |
| [`seo.md`](./seo.md) | SEO playbook: metadata, structured data, performance, content strategy. |

## Operating principles

1. **Content is structured, not freeform.** Editors fill fields; templates
   render. No WYSIWYG free-for-all that can break the design system.
2. **Every public URL is indexable, fast, and rich.** No client-only routes
   for content pages. SSR / SSG only.
3. **Speed is a feature.** Performance budget enforced at upload time
   (image/video size caps), at build time (bundle budgets), and at runtime
   (Core Web Vitals monitoring).
4. **Motion serves meaning.** Animation reveals hierarchy and rewards
   attention. It never blocks interaction or content.
5. **Editors edit safely.** Slug changes auto-create redirects. Price changes
   are audited. Publishing is reversible.
6. **Design first, code second.** No component is built before its tokens,
   states, and motion are defined in `design-system.md`.

## Current state of the repo

- Next.js 16 (App Router), React 19, Tailwind v4, GSAP + Lenis.
- One static homepage at `src/app/page.tsx` composed of Hero, Video, Products,
  About, Contact sections.
- Products are hardcoded in `src/data/products.ts`.
- The only metadata is a single global `title` / `description` in
  `src/app/layout.tsx`.
- No CMS, no admin, no sitemap, no JSON-LD, no product detail pages, no blog.

## Stack decisions (proposed, see roadmap)

- **Framework:** Next.js 16 App Router (already in place).
- **Styling:** Tailwind v4 with a tokenized theme layer (see design system).
- **Motion:** GSAP + Lenis (already in place) + Framer Motion for component
  micro-interactions.
- **CMS / Admin:** Payload 3 (self-hosted, Next-native, TypeScript).
- **Database:** PostgreSQL (Payload-managed schema).
- **Media:** S3-compatible bucket (Cloudflare R2 or AWS S3) with on-the-fly
  resizing via Next/Image.
- **Search (later):** Typesense or Meilisearch.
- **Analytics:** GA4 + Plausible (privacy-friendly redundancy) + Search Console.
- **Email / forms:** Resend for transactional, Klaviyo for marketing.
- **Hosting:** Vercel for the Next app, Railway/Fly for Payload + Postgres,
  or a single self-hosted node — to be decided in Phase 1.
