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

The team is **based in Iran**, which constrains hosting and SaaS choices
because most US-based providers (Vercel, Netlify, Cloudflare R2, AWS,
Resend, Sentry, sometimes Google Fonts and GA4) restrict access from
Iranian IPs or exclude Iran in their terms of service. The stack below
is chosen so that:

- The team can administer the site reliably from inside Iran.
- The public site is reachable globally with no degraded experience for
  US/EU visitors (the brand's primary market).
- We avoid any vendor whose ToS would put the project at risk of being
  shut off.

Stack:

- **Framework:** Next.js 16 App Router (already in place).
- **Styling:** Tailwind v4 with a tokenized theme layer (see design system).
- **Motion:** GSAP + Lenis (already in place) + Framer Motion for component
  micro-interactions.
- **CMS / Admin:** Payload 3, mounted in the same Next.js app at `/admin`.
- **Database:** PostgreSQL, self-hosted alongside the app on the same VPS
  (managed Postgres providers like Neon and Supabase are unreliable from
  Iran).
- **Media:** S3-compatible object storage. **Hetzner Object Storage**
  (EU) is the primary choice. Backblaze B2 is the fallback (need to
  re-verify ToS for Iran). Cloudflare R2 and AWS S3 are explicitly off
  the table.
- **3D / WebXR:** glTF/GLB primary, USDZ secondary for iOS Quick Look.
  Rendering via Google's `<model-viewer>` web component (zero-config AR on
  Android + iOS). Asset preparation happens in **Blender** with a
  documented export preset; the admin only validates uploads.
- **Fonts:** **self-hosted via `next/font/local`**, not `next/font/google`.
  Google Fonts is intermittently blocked from Iran (and we already hit
  this in the local `next build`), and self-hosted fonts are also faster
  for everyone.
- **Search (later):** Typesense or Meilisearch, self-hosted. Out of scope
  until Phase 5.
- **Analytics:** **Plausible, self-hosted** on the same VPS. No GA4 — it
  is unreliable from Iran and adds GDPR overhead for no upside on a
  privacy-respecting brand. Search Console for indexation data only.
- **Email / forms:** **Postmark** (or Mailgun EU) for transactional;
  newsletter delivery via a self-hosted Listmonk instance or Mailerlite
  (EU). Klaviyo and Resend are off the table.
- **Error monitoring:** **Glitchtip** (self-hosted, Sentry-compatible).
- **Hosting:** **Hetzner Cloud (Germany)**, single VPS to start
  (CPX21 / CPX31 class), running the Next + Payload app, Postgres,
  Plausible, and Glitchtip side by side via Docker Compose or systemd.
  EU jurisdiction, reachable from Iran without a VPN, reachable from
  the world. We can split services to multiple VPSes once traffic
  justifies it.
- **CDN (optional, Phase 4):** Bunny CDN (EU-based, Iran-friendly) in
  front of the Hetzner origin for static assets and image delivery.
- **CI / CD:** GitHub Actions runs from outside Iran so npm installs and
  builds work. Deployment to Hetzner via SSH from the Action runner.
- **Domain & DNS:** registrar that accepts Iranian customers (e.g. Gandi,
  Hetzner DNS). Avoid GoDaddy / Namecheap if they block Iranian payment
  methods.

Open verification items before Phase 1 starts:

- Confirm Hetzner account creation works from Iran (or set up via a
  collaborator, then transfer).
- Verify Backblaze B2 ToS for Iranian customers (may not be needed if
  Hetzner Object Storage is sufficient).
- Verify Postmark accepts signups from Iran; otherwise fall back to
  Mailgun EU.
- Confirm a workable Search Console + Google Business Profile
  verification path (may need a non-Iranian phone number for SMS
  verification on GBP).
