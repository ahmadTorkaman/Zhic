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
| [`lab.md`](./lab.md) | The `/lab` experimentation surface — purpose, rules, robots policy. |

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

## Locked product decisions

These are confirmed and drive everything else in this folder:

- **Business model:** lead generation, not e-commerce. Every product page
  ends in an "Inquire" CTA, never an "Add to cart." No Stripe, no checkout,
  no inventory sync. Prices are displayed as guidance.
- **Locales:** English only. Schemas keep their localization fields for
  optional future use, but no second locale is on the roadmap.
- **Showrooms:** several. Each showroom is its own document with its own
  `LocalBusiness` schema and its own `/showrooms/[slug]` page.
- **Editorial workflow:** every article requires editorial sign-off before
  publish. Marketing drafts → editor reviews → editor publishes.
- **Product media:** every product carries (a) a still image gallery,
  (b) one or more **GIFs** (atelier loops, fabric drape, light play), and
  (c) one or more **3D models in glTF / GLB** (with optional USDZ for
  iOS Quick Look) for **WebXR** product viewing.
- **Brand specs:** the company is providing typography, color, logo, and
  photography rules. The design system in `design-system.md` is a working
  draft until those land — placeholder values get replaced, the structure
  stays.
- **Admin hosting:** Payload 3 mounted in the same Next.js process at
  `/admin`. One deploy, one Postgres, shared TypeScript types.

## Stack decisions

- **Framework:** Next.js 16 App Router (already in place).
- **Styling:** Tailwind v4 with a tokenized theme layer (see design system).
- **Motion:** GSAP + Lenis (already in place) + Framer Motion for component
  micro-interactions.
- **CMS / Admin:** Payload 3, mounted in the same Next.js app at `/admin`.
- **Database:** PostgreSQL (Payload-managed schema).
- **Media:** S3-compatible bucket (Cloudflare R2 or AWS S3) for stills,
  GIFs, video, and 3D assets. Stills served via Next/Image; 3D served via
  `<model-viewer>` or react-three-fiber for WebXR.
- **3D / WebXR:** glTF/GLB primary, USDZ secondary for iOS Quick Look.
  Rendering via Google's `<model-viewer>` web component (zero-config AR on
  Android + iOS) or react-three-fiber for fully custom scenes.
- **Search (later):** Typesense or Meilisearch. Out of scope until Phase 5.
- **Analytics:** GA4 + Plausible (privacy-friendly redundancy) + Search
  Console.
- **Email / forms:** Resend for transactional, Klaviyo for marketing.
- **Hosting:** Vercel for the Next app (which includes Payload), managed
  Postgres on Neon or Supabase, S3-compatible storage on Cloudflare R2.
