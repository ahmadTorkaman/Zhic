# Session 4.2 — FAQ, About, Atelier, Care, Events, Categories

## Context

Session 4.1 just shipped (journal pages). Session 4.2 completes Phase 4 by
building the remaining editorial pages. Most of these are simple singleton-
backed pages that reuse `LegalPageTemplate` from 3.4. Two need custom
templates (FAQ accordion, events listing), and one is a dynamic route
(category editorial landing).

## Authority

`package1-month1.md` §Pages → `docs/spec/sitemap.md` §2 (rows 62–76) →
`docs/spec/data-schemas.md` §63–64.

## Entry state

- Phase 4.1 shipped: journal pages, extended richtext, all JSON-LD helpers.
- Five Payload globals exist from 1.3: `About` (title + body), `Faq`
  (title + items[]), `Atelier` (title + body), `Care` (title + body),
  `Events` (title + items[]).
- `LegalPageTemplate` from 3.4 handles title + body + breadcrumbs + JSON-LD
  slot. Session 3.4 note: "reusable for 4.2's `/care`, `/about`, `/atelier`."
- `fetchPage(slug)` fetches static page globals but only accepts
  `'privacy' | 'terms' | 'returns' | 'shipping'`.
- `PayloadCategory` type + `fetchCategories()` exist. No `fetchCategory(slug)`.
- `fetchProducts({ category: slug })` already works for product filtering.
- `collectionPageJsonLd`, `breadcrumbJsonLd`, `articlePageJsonLd` all exist.

## Scope decisions

### In scope

| Item | Justification |
|---|---|
| `/faq` with FAQPage JSON-LD (rich result eligible) | Sitemap row, Month 1 page |
| `/about` with AboutPage JSON-LD | Sitemap row, Month 1 page |
| `/about` Organization JSON-LD | Explicitly listed on `/about` in sitemap |
| `/atelier` with Place JSON-LD | Sitemap row, Month 1 page |
| `/care` with Article JSON-LD | Sitemap row, Month 1 page |
| `/events` static listing (no Event JSON-LD) | Sitemap says "static content only in Package 1" |
| `/categories/[slug]` editorial landing with product showcase | Sitemap row, Month 1 page |
| Seed data for all 5 globals | Sample content for rendering |

### Deferred

| Item | Deferred to | Justification |
|---|---|---|
| Full `pages` collection with polymorphic blocks (§63.1) | Package 2+ | Month 1 spec says singletons with simple shapes |
| Full `events` collection (§64) with RSVP, capacity, location group | Package 2+ | Month 1 says "static event listings" |
| `Event` JSON-LD on individual events | Package 2+ | Sitemap: "No Event JSON-LD with bookable slots" |
| `seo` group on globals | Session 6.1 | FU-3.2-f |

## Deliverables

### Step 1 — Extend `fetchPage` + new fetchers

**`apps/web/src/lib/payload.ts`** — MODIFY

Widen `fetchPage` slug union:
```
'privacy' | 'terms' | 'returns' | 'shipping' | 'about' | 'atelier' | 'care'
```

New types:
- `PayloadFaqItem` — `{ question: string; answer: LexicalRoot | null }`
- `PayloadFaq` — `{ title?: string | null; items?: PayloadFaqItem[] | null }`
- `PayloadEventItem` — `{ title: string; description?: LexicalRoot | null; date?: string | null; location?: string | null }`
- `PayloadEvents` — `{ title?: string | null; items?: PayloadEventItem[] | null }`

New fetchers:
- `fetchFaq()` → `PayloadFaq | null`
- `fetchEvents()` → `PayloadEvents | null`
- `fetchCategory(slug)` → `PayloadCategory | null` (single by slug)

Path helper:
- `categoryPath(slug)` → `/categories/${slug}`

### Step 2 — New JSON-LD helpers

**`apps/web/src/lib/jsonld.ts`** — MODIFY

- `faqPageJsonLd(items: { question: string; answer: string }[])` →
  `FAQPage` with `mainEntity` array of `Question` + `acceptedAnswer`
  (rich-result eligible per Google specs)
- `aboutPageJsonLd({ name, url, description })` → `@type: "AboutPage"`
- `organizationJsonLd({ name, url, description })` → `@type: "Organization"`
  with basic brand info (name: "Zhic", url)
- `placeJsonLd({ name, url, description })` → `@type: "Place"` for atelier

### Step 3 — Seed data for globals

**`services/api/src/seed.ts`** — MODIFY

Add `payload.updateGlobal()` calls for:
- `about` — Persian brand story (2-3 paragraphs about Zhic's origin, craft, mission)
- `faq` — 4-5 Q&A items (shipping, ordering, materials, lead times, returns)
- `atelier` — Persian text about the workshop, craft process
- `care` — care guide content (wood maintenance, fabric care)
- `events` — 2-3 sample events (workshop, open house, showroom event)

### Step 4 — Route files (6 pages)

**`apps/web/src/app/(site)/about/page.tsx`** — NEW
- Fetch `fetchPage('about')`
- Reuse `LegalPageTemplate` (title + body + breadcrumb)
- JSON-LD: `aboutPageJsonLd` + `organizationJsonLd` + `breadcrumbJsonLd`
- Metadata: from title

**`apps/web/src/app/(site)/atelier/page.tsx`** — NEW
- Fetch `fetchPage('atelier')`
- Reuse `LegalPageTemplate`
- JSON-LD: `placeJsonLd` + `breadcrumbJsonLd`
- Metadata: from title

**`apps/web/src/app/(site)/care/page.tsx`** — NEW
- Fetch `fetchPage('care')`
- Reuse `LegalPageTemplate`
- JSON-LD: `articlePageJsonLd` + `breadcrumbJsonLd`
- Metadata: from title

**`apps/web/src/app/(site)/faq/page.tsx`** — NEW
- Fetch `fetchFaq()`
- Custom template: h1 + FAQ accordion
- Accordion uses native `<details>/<summary>` (progressive enhancement,
  no JS required). Each answer rendered with `<RichText>`.
- JSON-LD: `faqPageJsonLd` (mainEntity array) + `breadcrumbJsonLd`
- Metadata: from title

**`apps/web/src/app/(site)/events/page.tsx`** — NEW
- Fetch `fetchEvents()`
- Custom template: h1 + event cards list
- Each event: title, Jalali date, location, richText description
- No JSON-LD (per sitemap: "no Event JSON-LD" in Package 1)
- JSON-LD: `breadcrumbJsonLd` only
- Metadata: from title

**`apps/web/src/app/(site)/categories/[slug]/page.tsx`** — NEW
- Fetch `fetchCategory(slug)` + `fetchProducts({ category: slug })`
- 404 if category not found
- Template: breadcrumbs + h1 (category name) + description + product grid
  (reuse `ProductGrid` from `components/products/`) + link to full
  `/products?category=slug` catalog
- JSON-LD: `collectionPageJsonLd` + `breadcrumbJsonLd`
- `generateMetadata`: from category name + description

### Step 5 — Custom components

**`apps/web/src/components/faq/FaqAccordion.tsx`** — NEW
- Props: `{ items: PayloadFaqItem[] }`
- Renders `<details>` elements with `<summary>` for question and
  `<RichText>` for answer
- Styling: border-bottom dividers, smooth open/close via CSS,
  chevron indicator, Persian text

**`apps/web/src/components/events/EventCard.tsx`** — NEW
- Props: `{ event: PayloadEventItem }`
- Renders: date badge (Jalali), title, location, description excerpt
- Card styling consistent with design system

### Step 6 — Update state.md

- Mark 4.2 ✅, Phase 4 complete
- Log any new follow-ups

## Exit check

- [ ] `pnpm --filter @zhic/api typecheck` passes
- [ ] `pnpm --filter @zhic/web typecheck` passes
- [ ] `pnpm --filter @zhic/web lint` passes (0 errors, expected `<img>` warnings)
- [ ] `pnpm --filter @zhic/web test` passes (29 existing tests)
- [ ] `pnpm --filter @zhic/web build` passes; route map shows `/faq`, `/about`,
      `/atelier`, `/care`, `/events`, `/categories/[slug]`
- [ ] `/faq` renders accordion with Q&A items + `FAQPage` JSON-LD
- [ ] `/about` renders brand story + `AboutPage` + `Organization` JSON-LD
- [ ] `/atelier` renders workshop content + `Place` JSON-LD
- [ ] `/care` renders care guide + `Article` JSON-LD
- [ ] `/events` renders event listings with Jalali dates
- [ ] `/categories/[slug]` renders category editorial landing with product grid
- [ ] All pages have breadcrumbs and `generateMetadata`
- [ ] `docs/state.md` updated: 4.2 ✅, Phase 4 complete

## Critical files

| File | Action |
|---|---|
| `apps/web/src/lib/payload.ts` | Widen fetchPage + new fetchers |
| `apps/web/src/lib/jsonld.ts` | FAQPage, AboutPage, Organization, Place |
| `services/api/src/seed.ts` | Seed 5 globals |
| `apps/web/src/app/(site)/faq/page.tsx` | New route |
| `apps/web/src/app/(site)/about/page.tsx` | New route |
| `apps/web/src/app/(site)/atelier/page.tsx` | New route |
| `apps/web/src/app/(site)/care/page.tsx` | New route |
| `apps/web/src/app/(site)/events/page.tsx` | New route |
| `apps/web/src/app/(site)/categories/[slug]/page.tsx` | New route |
| `apps/web/src/components/faq/FaqAccordion.tsx` | New component |
| `apps/web/src/components/events/EventCard.tsx` | New component |

## Verification

1. `pnpm --filter @zhic/api typecheck && pnpm --filter @zhic/web typecheck`
2. `pnpm --filter @zhic/web lint`
3. `pnpm --filter @zhic/web test`
4. `pnpm --filter @zhic/web build` — check route map
5. Local Postgres for populated render (same constraint as prior sessions)
