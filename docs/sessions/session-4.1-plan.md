# Session 4.1 — Journal + Article Pages

## Context

Phase 3 shipped (3.4 completed 2026-04-15). Session 4.1 builds the journal/blog
editorial surface — the site's primary Persian-language SEO engine. All
dependencies are met: ArticleCard (2.3), Payload Articles/Categories/Tags (1.3),
richtext serializer (3.1), JSON-LD helpers (3.2–3.4).

The current `Articles` collection is skeletal compared to the spec. This session
extends it to spec §60, creates two missing collections (`Authors` §61,
`JournalCategories` §62), and builds four new routes.

## Authority

`package1-month1.md` → `docs/spec/sitemap.md` §2 (rows 62–65) →
`docs/spec/data-schemas.md` §60–62 → `docs/spec/seo.md` (Article JSON-LD).

## Entry state

- Phase 3 complete; main has all 3.x commits.
- `ArticleCard` in `@zhic/ui` accepts `readingTimeMinutes` (unused until now).
- `lib/richtext.tsx` handles basic Lexical nodes (paragraph, heading, text,
  link, list). No custom blocks.
- `lib/jsonld.ts` has `articlePageJsonLd` (basic — no author/image/inLanguage),
  `collectionPageJsonLd`, `breadcrumbJsonLd`.
- `lib/payload.ts` has `PayloadArticle` (text `author`, product-category
  `category`) and `fetchLatestArticles(limit)`.
- Seed has 1 article with minimal data.
- Pagination component exists at `components/products/Pagination.tsx`, coupled
  to `SearchParamsRecord` from `lib/products.ts`.
- `@payloadcms/richtext-lexical` is already the configured editor.

## Scope decisions

### In scope (spec-required, Package 1)

| Item | Justification |
|---|---|
| `Authors` collection per §61 | Article template requires author card with avatar, bio, social |
| `JournalCategories` collection per §62 | Separate from product categories; journal taxonomy is flat, product taxonomy is hierarchical |
| Articles: `relatedArticleIds`, `relatedProductIds`, `readingTimeMinutes`, `featured`, `status` | All in §60, no package boundary |
| Custom richText blocks: pull-quote, image-grid, video-embed | Content blocks, no external data dependency |
| Custom richText blocks: product-embed, material-ref | Data-fetching blocks — pre-extract IDs from AST, batch-fetch, pass as context |
| TOC with IntersectionObserver active heading | Integral to sticky TOC usability, not a motion concern |
| `reading_time_minutes` auto-compute (FU-3.1-j) | Spec §60, ArticleCard already supports it |

### Deferred (with justification)

| Item | Deferred to | Justification |
|---|---|---|
| §60.1 editorial workflow (reviewState, role transitions, notifications, audit) | Package 3 | Requires CRM roles + notification infra |
| `seo` group on Articles | Session 6.1 | Consolidated SEO pass per FU-3.2-f |
| Factor sample block | Package 2 | No invoice system yet |
| Promote richtext.tsx to `packages/richtext` | When 2nd consumer | YAGNI — only `apps/web` uses it (FU-3.1-c partial) |
| `generateStaticParams` on journal routes | Session 7.1 | Requires API available at build time |
| Author archive `/journal/author/[slug]` | Post-Month 1 | Not in Month 1 sitemap |

## Deliverables

### Step 1 — New `Authors` collection

**`services/api/src/collections/Authors.ts`** — NEW

Per §61: `name` (text, required), `slug` (text, unique, auto-slugify),
`bio` (richText), `avatarMediaId` (upload → media), `role` (text),
`social` (group: instagram, telegram, website).
Slug `'authors'`, labels `نویسنده / نویسندگان`.

### Step 2 — New `JournalCategories` collection

**`services/api/src/collections/JournalCategories.ts`** — NEW

Per §62: `name` (text, required), `slug` (text, unique, auto-slugify),
`description` (textarea).
Slug `'journal-categories'`, labels `دسته‌بندی ژورنال / دسته‌بندی‌های ژورنال`.
Flat (no `parent`) — distinct from hierarchical product `categories`.

### Step 3 — Extend `Articles` collection

**`services/api/src/collections/Articles.ts`** — MODIFY

- `author` text → `author` relationship to `'authors'` (required)
- `category` rel → `categories` → `category` rel → `'journal-categories'` (required)
- Rename `tags` → `tagIds` (consistency with Products convention)
- Add `relatedProducts` (relationship[] → `'products'`)
- Add `relatedArticles` (relationship[] → `'articles'`, self-ref)
- Add `reading_time_minutes` (number, admin readOnly, auto-computed)
- Add `featured` (checkbox, sidebar, default false)
- Add `status` (select: `draft` / `published`, sidebar, default `draft`)
- Make `excerpt` required, maxLength 280
- Make `cover` required
- Rename `published_at` → `publishedAt` (camelCase convention)
- Add `beforeChange` hook for reading time (FU-3.1-j):
  walk body AST → count words → divide by 200 → ceil → set field

### Step 4 — Custom richText blocks on Article body

**`services/api/src/collections/Articles.ts`** — body field MODIFY

Configure `lexicalEditor` with `BlocksFeature` for:
- **pull-quote**: `quote` (text, required), `attribution` (text)
- **image-grid**: `images` (array of upload → media), `columns` (select: 2/3)
- **video-embed**: `url` (text, required), `caption` (text)
- **product-embed**: `product` (relationship → products)
- **material-ref**: `material` (relationship → materials)

Import `BlocksFeature` from `@payloadcms/richtext-lexical`.

### Step 5 — Register collections + extend seed

**`services/api/src/payload.config.ts`** — MODIFY
- Import and add `Authors`, `JournalCategories` to `collections` array.

**`services/api/src/seed.ts`** — MODIFY
- Add 2 authors: "تیم ژیک" (role: "تحریریه"), "سارا احمدی" (role: "نویسنده",
  with bio + social).
- Add 3 journal categories: "متریال‌شناسی" (materials-guide), "سبک زندگی"
  (lifestyle), "مراقبت و نگهداری" (care-maintenance).
- Migrate existing article to new schema (authorId, categoryId, status: published).
- Add 2 more articles with richer body (multiple H2/H3 for TOC), different
  categories, related products, related articles cross-refs.

### Step 6 — Extend types + fetchers

**`apps/web/src/lib/payload.ts`** — MODIFY

New types:
- `PayloadAuthor` — id, name, slug, bio?, avatar?, role?, social?
- `PayloadJournalCategory` — id, name, slug, description?
- Update `PayloadArticle`: `author` → `PayloadAuthor | null`, `category` →
  `PayloadJournalCategory | null`, add `readingTimeMinutes`, `featured`,
  `status`, `relatedProducts` (PayloadProduct[]), `relatedArticles`
  (PayloadArticle[]), rename `tags` → `tagIds` (PayloadTag[])

New constants:
- `ARTICLES_PER_PAGE = 12`

New fetchers:
- `fetchArticles(query: { category?; tag?; page? })` → paginated, status=published
- `fetchArticle(slug)` → single, depth=3
- `fetchJournalCategories()` → all categories
- `fetchJournalCategory(slug)` → single category
- `fetchTag(slug)` → single tag (for archive title)

Update `fetchLatestArticles` to filter `status=published`.

Path helpers: `articlePath(slug)`, `journalCategoryPath(slug)`,
`journalTagPath(slug)`.

### Step 7 — Extend richtext serializer

**`apps/web/src/lib/richtext.tsx`** — MODIFY

New node types:
- `blockquote` → `<blockquote>` with accent `border-inline-start`
- Italic text (FORMAT_ITALIC = 2) — currently missing
- Ordered list (`listType === 'number'`) → `<ol>`
- `horizontalrule` → `<hr>`

Heading IDs: generate deterministic `id` from heading text for TOC anchors.

New `extractHeadings(root)` export: returns `{ id, text, level }[]`.

New `extractEmbeddedIds(root)` export: walks AST, collects product/material
IDs from block nodes.

New `ArticleRichText` component: accepts `embeds: { products?: Map, materials?: Map }`
context for data-aware block rendering.

Block renderers:
- `pull-quote` → styled blockquote with attribution
- `image-grid` → responsive image grid (2–3 columns)
- `video-embed` → responsive iframe container
- `product-embed` → compact product card from context map
- `material-ref` → styled callout box

### Step 8 — Extend JSON-LD

**`apps/web/src/lib/jsonld.ts`** — MODIFY

- New `blogJsonLd({ name, url, description })` → `@type: "Blog"` with
  `inLanguage: "fa-IR"`, publisher
- Extend `articlePageJsonLd` with: `image` (cover URL), `author`
  (`{ @type: "Person", name }`), `inLanguage: "fa-IR"`

### Step 9 — Page components

**`apps/web/src/components/journal/`** — NEW directory

| File | Purpose |
|---|---|
| `ArticleHero.tsx` | Cover image + title (h1) + excerpt + author (avatar+name) + Jalali date + reading time + category badge |
| `TableOfContents.tsx` | `'use client'`. Sticky sidebar on lg+, hidden/collapsible on mobile. IntersectionObserver for active heading. Receives `{ id, text, level }[]` |
| `AuthorCard.tsx` | Avatar + name + role + bio excerpt + social links (Instagram, Telegram, website) |
| `RelatedProducts.tsx` | "محصولات معرفی‌شده" row with ProductCards |
| `RelatedArticles.tsx` | "ادامه مطالعه" row with 3 ArticleCards |
| `JournalGrid.tsx` | ArticleCard grid, reuses `ArticleCover` helper pattern from HomeJournalTeaser |
| `JournalCategoryNav.tsx` | Horizontal category link strip. "همه" → `/journal`, per-category → `/journal/category/[slug]`. Active slug highlighted. Scrollable on mobile |
| `extractHeadings.ts` | Utility: `extractHeadings(root)` returns heading list for TOC |

### Step 10 — Route files

**`apps/web/src/app/(site)/journal/page.tsx`** — NEW
- Fetch `fetchArticles({ page })` + `fetchJournalCategories()`
- Breadcrumbs, h1 "ژورنال", JournalCategoryNav, JournalGrid, Pagination
- JSON-LD: `blogJsonLd` + `breadcrumbJsonLd`
- `generateMetadata`: "ژورنال — ژیک"

**`apps/web/src/app/(site)/journal/[slug]/page.tsx`** — NEW
- Fetch `fetchArticle(slug)` → 404 if not found or draft
- Extract headings for TOC, extract embedded IDs, batch-fetch embeds
- Split layout: sticky TOC sidebar (lg+) + article body
- ArticleHero, ArticleRichText (with embeds), RelatedProducts, AuthorCard,
  RelatedArticles
- JSON-LD: enhanced `articlePageJsonLd` + `breadcrumbJsonLd`
- `generateMetadata`: dynamic from title + excerpt

**`apps/web/src/app/(site)/journal/category/[slug]/page.tsx`** — NEW
- Fetch category + filtered articles + all categories (for nav)
- Breadcrumbs, h1 = category name, description, JournalCategoryNav
  (activeSlug), JournalGrid, Pagination
- JSON-LD: `collectionPageJsonLd` + `breadcrumbJsonLd`

**`apps/web/src/app/(site)/journal/tag/[slug]/page.tsx`** — NEW
- Fetch tag + filtered articles
- Breadcrumbs, h1 = "تگ: {name}", JournalGrid, Pagination
- No JournalCategoryNav (tags ≠ categories)
- JSON-LD: `collectionPageJsonLd` + `breadcrumbJsonLd`

### Step 11 — Pagination reuse

The existing `Pagination` component (`components/products/Pagination.tsx`) uses
`buildQueryString(searchParams, { page })` from `lib/products.ts`. For journal:
- Create a minimal `buildJournalQuery` helper or pass a compatible
  `SearchParamsRecord` with just the page param.
- Move `Pagination` to a shared location or import cross-directory.
  Alternatively, extract the core `Pagination` UI into `@zhic/ui` or a shared
  `components/shared/` directory.

Recommended: keep Pagination where it is and import it from journal routes.
Pass `searchParams: {}` and `basePath: '/journal'` (or appropriate archive path).
The `buildQueryString` function handles `page` correctly with empty base params.

### Step 12 — Update HomeJournalTeaser

**`apps/web/src/components/home/HomeJournalTeaser.tsx`** — MODIFY

- Pass `readingTimeMinutes={article.readingTimeMinutes}` to ArticleCard
- Update `author` prop: `article.author?.name` (was `article.author`, now
  it's a relation object)
- Verify `categoryLabel` path still works with `PayloadJournalCategory`

### Step 13 — Update state.md

Last step per CLAUDE.md:
- Mark 4.1 ✅ in session status
- Close FU-3.1-j
- Log new follow-ups

## Exit check

- [ ] `pnpm --filter @zhic/api typecheck` passes
- [ ] `pnpm --filter @zhic/api lint` passes
- [ ] `pnpm --filter @zhic/web typecheck` passes
- [ ] `pnpm --filter @zhic/web lint` passes
- [ ] `pnpm --filter @zhic/web test` passes (existing 29 + new tests)
- [ ] `pnpm --filter @zhic/web build` passes; route map shows `/journal`,
      `/journal/[slug]`, `/journal/category/[slug]`, `/journal/tag/[slug]`
- [ ] `/journal` renders article grid with category nav and pagination
      (graceful fallback when API is down)
- [ ] `/journal/[slug]` renders hero, sticky TOC with heading anchors,
      richtext body with custom blocks, related products, author card,
      related articles
- [ ] `/journal/category/[slug]` renders filtered archive with category h1
- [ ] `/journal/tag/[slug]` renders filtered archive with tag h1
- [ ] JSON-LD: `Blog` + `BreadcrumbList` on `/journal`;
      `Article` (with author, image, inLanguage) + `BreadcrumbList` on
      `/journal/[slug]`; `CollectionPage` + `BreadcrumbList` on archives
- [ ] HomeJournalTeaser passes `readingTimeMinutes` + author name correctly
- [ ] `docs/state.md` updated: 4.1 ✅, FU-3.1-j closed

## Expected follow-ups

- FU-4.1-a: `<Bleed>` for full-width image embeds in article body (carries FU-3.1-m)
- FU-4.1-b: OG image generation with Persian title on cover — Session 6.1
- FU-4.1-c: `generateStaticParams` on journal routes — Session 7.1
- FU-4.1-d: Full editorial workflow (§60.1) — Package 3
- FU-4.1-e: Factor sample Lexical block — Package 2
- FU-4.1-f: Author archive `/journal/author/[slug]` — post-Month 1
- FU-4.1-g: Search on `/journal` — Package 2+

## Critical files

| File | Action |
|---|---|
| `services/api/src/collections/Articles.ts` | Extend (schema + hook) |
| `services/api/src/collections/Authors.ts` | New |
| `services/api/src/collections/JournalCategories.ts` | New |
| `services/api/src/payload.config.ts` | Register collections |
| `services/api/src/seed.ts` | Extend |
| `apps/web/src/lib/payload.ts` | Types + fetchers |
| `apps/web/src/lib/richtext.tsx` | New nodes + blocks + heading IDs |
| `apps/web/src/lib/jsonld.ts` | Blog + enhanced Article |
| `apps/web/src/components/journal/*.tsx` | 8 new components |
| `apps/web/src/app/(site)/journal/**/*.tsx` | 4 route files |
| `apps/web/src/components/home/HomeJournalTeaser.tsx` | Update for new types |

## Verification

1. `pnpm --filter @zhic/api typecheck && pnpm --filter @zhic/web typecheck`
2. `pnpm --filter @zhic/web lint`
3. `pnpm --filter @zhic/web test`
4. `pnpm --filter @zhic/web build` — check route map
5. Local Postgres required for populated render (same constraint as 3.2–3.4):
   `docker compose up postgres` → `pnpm --filter @zhic/api dev` →
   `pnpm --filter @zhic/api seed` → navigate journal routes
