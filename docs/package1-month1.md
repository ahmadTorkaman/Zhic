# Package 1 — Month 1 Detailed Roadmap

Design + Landing Page + Editorial Templates (Week 1–4)

**Goal:** Ship a production-grade Persian-first storefront on
`zhicwood.com` with catalog browsing, all editorial surface templates,
a working inquiry flow with city-based SMS routing, and a proven
admin-to-storefront pipeline.

---

## Infrastructure stack

| Layer | Choice |
| --- | --- |
| VPS | Pars Pack |
| CDN / DNS | Abr Arvan |
| Reverse proxy | Caddy (auto-TLS) |
| Object storage | Abr Arvan (S3-compatible) |
| Database | Postgres (self-managed on VPS) |
| CMS | Payload 3 (headless, inside Next.js app) |
| Git server | Gitea (self-hosted on VPS) |
| SMS | SMS.ir |
| Payment gateway | ZarinPal |
| Analytics | Plausible (self-hosted) |
| CI / CD | Gitea Actions (develop → staging, main → production) |

### Subdomains

| Subdomain | Purpose |
| --- | --- |
| `zhicwood.com` | Production storefront |
| `staging.zhicwood.com` | Preview / staging (password-protected) |
| `git.zhicwood.com` | Gitea |
| `api.zhicwood.com` | Payload CMS API |

### Deployment flow

```
Dev machines (3–4) ──push──> Gitea (git.zhicwood.com)
                                │
                                ├── develop branch ──> staging.zhicwood.com
                                │
                                └── main branch ──> zhicwood.com
```

---

## Design system

### Brand colors (derived from logo)

| Role | Color | Usage |
| --- | --- | --- |
| Primary | Deep forest green (from logo) | Navigation, headings, primary buttons, links |
| Accent | Warm gold/tan (from logo) | Highlights, CTAs, hover states, decorative elements |
| Background | Off-white / warm grey | Page backgrounds, cards |
| Text | Near-black | Body copy |

Exact hex values to be extracted from the logo PDF and finalized.

### Typography

| Role | Font | Weights |
| --- | --- | --- |
| Persian (display + body) | **Ayandeh** | Light, Regular, Bold, Black |
| Latin | TBD | — |

Ayandeh is self-hosted (TTF files in repo). Four weights provide enough
range for headings (Black/Bold), body (Regular), and captions/secondary
(Light).

### Core components (Week 1–2)

- Buttons (primary, secondary, ghost, icon)
- Form fields (text input, textarea, select/dropdown, checkbox, radio)
- Cards (product card, design card, article card, showroom card)
- Navigation bar (desktop + mobile hamburger, RTL)
- Footer (links, showrooms, contact, social)
- Modal / drawer
- Image gallery (product images, GIF support)
- Breadcrumbs
- Badges / tags (age group, material, category)

### Motion & interaction

Direction: geometric, clean, scroll-driven. References to collect from
Awwwards / Godly / luxury furniture brands (Poliform, Minotti, RH).

**Planned techniques:**
- Scroll-triggered video scrubbing (hero)
- Parallax image/GIF layers
- Reveal-on-scroll (content fades/slides into viewport)
- Sticky scroll sections
- `prefers-reduced-motion` fallback on everything

**Tech:** Framer Motion and/or GSAP ScrollTrigger. Lenis for smooth
scrolling. Final choice after motion references are collected.

---

## CMS collections (Payload 3)

### Designs

The parent concept — a product line grouped by age group.

| Field | Type | Notes |
| --- | --- | --- |
| name | text | Persian display name |
| slug | text | ASCII, auto-generated |
| age_group | select | TBD — exact age group names pending |
| description | richtext | Persian brand copy |
| gallery | media array | Mood images, lifestyle shots |
| featured | boolean | Show on home page |

### Products

Individual pieces within a design (bed, nightstand, closet, etc.).

| Field | Type | Notes |
| --- | --- | --- |
| name | text | Persian display name |
| slug | text | ASCII, auto-generated |
| design | relationship | → Designs collection |
| piece_type | select | bed, nightstand, closet, dresser, mirror, etc. |
| price | number | Toman, displayed in Persian digits |
| dimensions | group | width, height, depth (cm) |
| materials | text array | e.g. "چوب گردو", "کتان بلژیکی" |
| specs | richtext | Additional specifications |
| gallery | media array | Product photos, GIFs |
| inquiry_enabled | boolean | Show inquiry CTA (default true in Package 1) |

### Showrooms

| Field | Type | Notes |
| --- | --- | --- |
| name | text | Persian name |
| slug | text | ASCII |
| city | text | For SMS routing lookup |
| address | text | Full Persian address |
| phone | text | Public phone number |
| manager_name | text | Internal, not displayed |
| manager_phone | text | Internal — SMS routing target |
| hours | text | Working hours in Persian |
| gallery | media array | Showroom photos |
| coordinates | group | lat, lng — for Neshan/OSM map embed |
| is_central | boolean | true for Hamedan (fallback for SMS routing) |

### Pages (singletons)

Each managed as a singleton in Payload:

- **Home** — hero video/media, featured designs, brand statement,
  showrooms strip, journal teaser, inquiry CTA
- **About** — brand story
- **Atelier** — craft, process, photographs
- **Contact** — phone, address, showrooms list
- **FAQ** — question/answer pairs (array of {question, answer})
- **Care** — materials & care guide
- **Events** — static event listings (array of {title, description,
  date, location})
- **Privacy** — legal
- **Terms** — legal
- **Returns** — legal
- **Shipping** — logistics, lead times

### Articles (journal)

| Field | Type | Notes |
| --- | --- | --- |
| title | text | Persian |
| slug | text | ASCII |
| body | richtext | Long-form with TOC support |
| excerpt | text | Short summary for index/cards |
| cover | media | Cover image |
| category | relationship | → Categories |
| tags | relationship (many) | → Tags |
| published_at | date | Jalali display, ISO storage |
| author | text | Author name |

### Categories & Tags

Simple taxonomy collections for journal and product filtering.

### Media

Payload built-in. Stored on Abr Arvan Object Storage (S3 adapter).
Supports images, videos, GIFs.

### Inquiries

| Field | Type | Notes |
| --- | --- | --- |
| name | text | Customer name |
| phone | text | Customer phone |
| city | text | From dropdown |
| reason | select | "استعلام قیمت" / "رزرو بازدید از شوروم" |
| preferred_date | text | Free-text, shown when reason = showroom visit |
| message | text | Optional message |
| routed_to | relationship | → Showrooms (auto-set by routing logic) |
| product | relationship | → Products (if submitted from PDP) |
| status | select | new / contacted / closed |
| created_at | date | Auto-set |

---

## Pages — full list

### Core pages (Week 3–4)

| Path | Template | Data source | Notes |
| --- | --- | --- | --- |
| `/` | `HomePage` | `pages.home` singleton | Hero video, featured designs, brand statement, showrooms strip, journal teaser, inquiry CTA |
| `/products` | `ProductIndex` | `products` collection | Filterable grid: category, material, size, price band (toman) |
| `/products/[slug]` | `ProductDetail` | `products` doc | Gallery + GIFs + specs. CTA is "استعلام قیمت" / "رزرو بازدید" in Package 1 |
| `/collections/[slug]` | `CollectionPage` | `collections` doc | Curated product groupings |
| `/showrooms` | `ShowroomIndex` | `showrooms` collection | All showrooms with Neshan/OSM map |
| `/showrooms/[slug]` | `ShowroomDetail` | `showrooms` doc | Hours, address, phone, gallery, inquiry CTA |
| `/contact` | `ContactPage` | `pages.contact` singleton | Form + phone + showrooms list |
| `/privacy` | `Page` | `pages` doc | Legal — privacy policy |
| `/terms` | `Page` | `pages` doc | Legal — terms of service |
| `/returns` | `Page` | `pages` doc | Legal — returns placeholder |
| `/shipping-and-delivery` | `Page` | `pages` doc | Logistics, lead times per region |
| `/thank-you` | `ThankYouPage` | static | Post-inquiry redirect |

### Editorial templates (Week 3–4)

| Path | Template | Data source | Notes |
| --- | --- | --- | --- |
| `/journal` | `JournalIndex` | `articles` collection | Persian editorial archive |
| `/journal/[slug]` | `Article` | `articles` doc | Long-form with TOC; also pillar pages |
| `/journal/category/[slug]` | `JournalArchive` | `articles` filtered | Category filtered |
| `/journal/tag/[slug]` | `JournalArchive` | `articles` filtered | Tag filtered |
| `/categories/[slug]` | `CategoryPage` | `categories` doc | Per-product-category editorial landing |
| `/faq` | `FaqPage` | `pages.faq` singleton | Persian Q&A with `FAQPage` JSON-LD |
| `/care` | `Page` | `pages` doc | Care & materials guide |
| `/about` | `AboutPage` | `pages.about` singleton | Brand story, atelier |
| `/atelier` | `Page` | `pages` doc | Craft, process, photographs |
| `/events` | `EventsPage` | `pages` doc | Static event listings |

---

## Inquiry form — unified

One form used on PDP, showroom detail, and contact pages.

### Fields

1. **Name** (text, required)
2. **Phone** (text, required, Iranian phone validation)
3. **City** (dropdown, required) — list of showroom cities + "سایر شهرها"
4. **Reason** (dropdown, required) — "استعلام قیمت" / "رزرو بازدید از شوروم"
5. **Preferred date window** (text, optional) — shown when reason = showroom visit
6. **Message** (textarea, optional)

### SMS routing logic

1. Customer selects a city
2. Lookup city in `showrooms` collection
3. **Match found** → SMS sent to that showroom's `manager_phone`
4. **No match / "سایر شهرها"** → SMS sent to central showroom
   (Hamedan, `is_central = true`)

### Post-submit flow

1. Inquiry saved to `Inquiries` collection in Payload (status = "new")
2. SMS fires to routed showroom manager via SMS.ir
3. Customer redirected to `/thank-you`

---

## SEO foundations

- `generateMetadata` on every route
- `sitemap.ts`, `robots.ts`, `manifest.ts`
- `Organization` JSON-LD on home page
- `LocalBusiness` (`FurnitureStore`) JSON-LD per showroom
- `Product` JSON-LD on PDP (inquiry mode — no `Offer` until Package 2)
- `FAQPage` JSON-LD on FAQ page
- `Article` JSON-LD on journal articles
- `BreadcrumbList` JSON-LD on all inner pages
- OG image generation (Persian-safe, Ayandeh font)
- `<html lang="fa" dir="rtl">` on every page

---

## Week-by-week schedule

### Week 1: Technical foundation + design system start

- Pars Pack VPS provisioned and configured
- Caddy installed, TLS configured
- Postgres installed
- Gitea installed at `git.zhicwood.com`
- Gitea Actions runner configured
- Abr Arvan DNS pointed, CDN configured
- Abr Arvan Object Storage bucket created
- Plausible self-hosted instance running
- SMS.ir account configured and tested
- Monorepo skeleton: `apps/web`, `services/api`, packages
  (`db`, `auth`, `ui`, `design-system`, `locale`, `types`, `config`)
- Payload 3 booted against Postgres at `api.zhicwood.com`
- Initial CMS collections created (Designs, Products, Showrooms,
  Pages, Articles, Media, Inquiries)
- Deploy pipeline working: push develop → staging, push main → production
- Design system tokens: colors extracted from logo, typography
  (Ayandeh) configured, spacing scale, grid, breakpoints
- Core components started: buttons, inputs, cards, navigation
- Agent infrastructure: root `CLAUDE.md` with locked decisions and
  conventions; per-package `CLAUDE.md` files added as each workspace
  comes online (`apps/web`, `services/api`, `packages/design-system`,
  `packages/ui`, `packages/locale`)

### Week 2: Design system complete + first pages

- All core components built and documented
- Motion vocabulary defined (after collecting scroll-driven references)
- Hero scrub video with poster frame + `prefers-reduced-motion`
- RTL implementation complete: bidi rules, ZWNJ, Persian digits, Jalali
- Home page built
- Product index + product detail page built
- Designs page built (browse by design/age group)

### Week 3: Remaining pages + inquiry flow

- All remaining core pages built (showrooms, contact, legal pages)
- All editorial templates built (journal, FAQ, about, atelier, care,
  events, category pages)
- Unified inquiry form built with SMS routing via SMS.ir
- Thank-you page
- Form tested: submission → SMS delivery to correct showroom manager

### Week 4: Polish + admin pipeline + go-live

- Admin-to-storefront pipeline confirmed: edit product in Payload →
  live on `zhicwood.com` within 10 minutes
- SEO foundations: all metadata, JSON-LD, sitemap, robots, OG images
- Cross-browser QA (Chrome, Firefox, Safari on mobile + desktop)
- Test on real Iranian ISPs (no VPN)
- Staging password protection confirmed
- Sample content populated for client demo
- **Month 1 exit criteria verified**

---

## Month 1 exit criteria

- [ ] `zhicwood.com` is live with all core pages and editorial templates
- [ ] Design system tokens and core components in `packages/design-system`
      and `packages/ui`
- [ ] Inquiry form submits successfully; SMS reaches correct showroom
      manager (city-based routing confirmed)
- [ ] A non-developer can add/edit a product in Payload admin and see it
      live on `zhicwood.com` within 10 minutes
- [ ] Hosting infrastructure confirmed and running (Pars Pack VPS, TLS
      via Caddy, Abr Arvan CDN + Object Storage, Plausible, SMS.ir)
- [ ] Staging environment at `staging.zhicwood.com` (password-protected)
- [ ] Gitea + Gitea Actions deploy pipeline working

---

## Open decisions (to be resolved)

| # | Decision | Status | Notes |
| --- | --- | --- | --- |
| 1 | **Exact brand color hex values** | Pending | Extract from logo PDF |
| 2 | **Latin typeface** | Pending | For English runs (URLs, SKUs, brand name) |
| 3 | **Age group names** | Pending | Exact Persian names for design categories |
| 4 | **Non-age-based product categories** | Pending | Are there products outside the age model? |
| 5 | **Motion/interaction references** | Pending | Collect from Awwwards/Godly, pick scroll-driven effects |
| 6 | **Motion tech choice** | Pending | Framer Motion vs GSAP ScrollTrigger (or both) |
| 7 | **npm mirror configuration** | Pending | Mirror links exist, need to configure on VPS + Gitea Actions |
| 8 | **Home page section order & content** | Pending | Hero, featured designs, brand statement, showrooms, journal, CTA — final order TBD |
| 9 | **Page content structure** (per-page detail) | Pending | To be decided during actual design work |
| 10 | **Hero video/media content** | Pending | Tied to visual/motion decisions |
