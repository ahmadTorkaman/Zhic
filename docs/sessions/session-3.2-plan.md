# Session 3.2 — Product Index + PDP + Curated Collection

## Goal

Ship the **catalog**: `/products` (filterable, sorted, paginated grid),
`/products/[slug]` (PDP with tabbed media stage, sticky purchase
column, specs accordion, long description, related + pairs-with rows,
and inquiry-mode `Product` JSON-LD), and `/collections/[slug]`
(curated grouping per `sitemap.md` row §3). Along the way, bring the
Payload schema for the catalog up to spec: extend `Products` to the
§12 shape (minus Pkg-2+ commerce fields), introduce `Materials` and
`Collections` collections per §14, extend `Categories` with
`description` + `parentId`, and migrate `Products.materials` from a
free-text array to a `materialIds` relation. Seed grows enough to
exercise four filter axes (category / material / size / price band)
plus sort plus pagination plus a curated collection.

This session is the **heart of the storefront** in Pkg 1 — every
later session leans on its data layer (3.3 reuses `lib/payload.ts`
extensions; 4.1 reuses the page-composition pattern; 5.1 reads the
inquiry CTA's query params; 6.1 layers JSON-LD `Organization` /
`WebSite` on top of the PDP `Product` JSON-LD that lands here; 6.2
adds motion to surfaces that ship static here).

Authority: `docs/sessions.md` §3.2,
`docs/package1-month1.md` §Products, §Pages, §SEO foundations,
§Week 2,
`docs/spec/sitemap.md` §3 ProductIndex / ProductDetail / CollectionPage,
§1 URL conventions, §4 IA rules, §5 nav,
`docs/spec/data-schemas.md` §12 products, §14 collections /
categories / tags / materials, §12.4 JSON-LD Product (inquiry mode).

Per CLAUDE.md sequencing rule: when `package1-month1.md` and
`sitemap.md` agree on something they are both authoritative; when
they disagree `package1-month1.md` wins. Where the PDP spec in
`sitemap.md` §3 calls for variant pickers / cart CTAs / 3D viewer /
reviews, those are explicitly Pkg 2+ per their own spec sections
(§13 productVariants Pkg 2; §12.4 §12.1 model3d "From Pkg 2
onward"; §26 reviews Pkg 3+). Logged as FUs, not deferred silently.

## Entry state

- 3.1 just shipped: `(site)/page.tsx` is async RSC composing six home
  blocks; `apps/web/src/lib/payload.ts` exposes `payloadFetch<T>`,
  `fetchHome`, `fetchShowrooms`, `fetchLatestArticles`, `mediaUrl`;
  `lib/richtext.tsx` exposes `<RichText>` + `plainTextFromRichText`;
  `lib/env.ts` exposes `API_URL` with localhost fallback. All inline
  in `apps/web` — no `packages/api-client` / `packages/richtext` yet.
- `@zhic/ui` ships through 2.3 + 3.1: `Button`, `Input`, `Textarea`,
  `Select`, `Checkbox`, `Radio` + `RadioGroup`, `FormField`, `Badge`,
  `Tag`, `SkipLink`, `Container`, `Section` (with `bg` /  `padY` /
  `fullBleed` props), `Breadcrumbs`, `Modal`, `Drawer`, `SiteHeader`,
  `SiteFooter`, `FooterNewsletter`, `Aspect`, `MoneyDisplay`,
  `DateDisplay`, `ProductCard`, `DesignCard`, `ArticleCard`,
  `ShowroomCard`, `ImageGallery`, `Grid`, `Stack`, `Split`. 2.3's
  `<ProductCard>` already supports `availability` badge +
  `leadTimeDays` + `materials[]` chips + `priceRials` via
  `MoneyDisplay`; 3.2 is its first real consumer.
- `Products` collection (today, in `services/api/src/collections/Products.ts`):
  `name`, `slug`, `design (rel)`, `piece_type` (enum: bed / nightstand
  / closet / dresser / mirror / desk / bookcase / display_cabinet),
  `basePriceRials` (number, integer rials), `dimensions {width, height,
  depth}`, `materials [{material: text}]`, `specs (richText)`,
  `gallery (upload[])`, `inquiry_enabled`. **Missing** vs spec §12:
  `tagline`, `shortDescription`, `longDescription`, `salePriceRials`,
  `sku`, `availability`, `leadTimeDays`, `categoryIds`, `tagIds`,
  `materialIds`, `coverMediaId`, `gifMediaIds`, `videoMediaIds`,
  `model3d`, `featured`, `featuredOrder`, `relatedProductIds`,
  `pairsWithProductIds`, `careInstructions`, `weightKg`,
  `warrantyYears`, `seo`, `status`, `publishedAt`.
- `Categories` (today): `name`, `slug` only. Used by Articles, not by
  Products.
- `Tags` (today): `name`, `slug` only. Used by Articles, not by
  Products.
- `Materials` (today): does not exist.
- `Collections` (today): does not exist.
- Seed (today): 1 category (`bedroom = اتاق خواب`), 2 tags, 2 designs
  (آرامش, بهار), 2 products (تخت دو نفره آرامش, کمد بهار) — both
  with no gallery, no `categoryIds`, no `materialIds`, no `tagIds`
  (none of those fields exist yet); 1 showroom; 1 article; Home
  global populated with Persian copy + brand_statement Lexical doc +
  featured_designs.
- `apps/web/src/app/(site)/` route group owns the chrome (SkipLink +
  SiteHeader + SiteFooter + SmoothScrollProvider via
  `(site)/layout.tsx`); `(site)/page.tsx` is the home; `(site)/error.tsx`
  is the Persian error boundary. **No** `(site)/not-found.tsx` yet —
  Next's default 404 page renders for unknown routes.
- No RSC page in the project reads `searchParams` yet. Home is
  parameter-less.
- Storefront env: `apps/web/.env.example` documents `API_URL`. Default
  `http://localhost:3001` is the localhost dev value.
- Payload seed is currently broken in the Claude Code sandbox by the
  pre-existing `loadEnvConfig` issue (FU-3.1-o); my schema + seed
  changes will compile + typecheck but cannot be exercised
  end-to-end here. User runs `pnpm --filter @zhic/api seed` locally
  to verify. Same dev-loop limitation as 3.1 (FU-3.1-q).
- 3.1 follow-ups carrying forward into 3.2: FU-2.3-a (GIF→video),
  FU-2.3-b (IO pause), FU-2.3-d (sale price), FU-2.3-f (ProductCard
  variants), FU-2.3-g (Next/Image), FU-2.3-h (MoneyDisplay sale + range),
  FU-3.1-b (api-client promotion), FU-3.1-c (richtext promotion),
  FU-3.1-d (Org / WebSite JSON-LD — *partially closed* here by Product
  + BreadcrumbList + CollectionPage JSON-LD; Org / WebSite remains
  6.1), FU-3.1-l (Next/Image), FU-3.1-m (Bleed).

## Key decisions

| Decision | Choice |
|---|---|
| Spec coverage | **Bring `Products` to spec §12 modulo Pkg-2+ fields.** Add `tagline`, `shortDescription`, `longDescription`, `salePriceRials` (schema only — not rendered), `sku`, `availability`, `leadTimeDays`, `categoryIds`, `tagIds`, `materialIds`, `featured`, `featuredOrder`, `relatedProductIds`, `pairsWithProductIds`. Skip `model3d` (Pkg 2 per §12.4), `coverMediaId` / `gifMediaIds` / `videoMediaIds` (the `gallery` array + mimeType partition covers PDP needs without three parallel media fields), `weightKg` / `careInstructions` / `warrantyYears` (no PDP surface for them today — log FU), `seo` (6.1), `status` / `publishedAt` (FU-1.3-a — no draft workflow needed in Month 1). |
| Materials migration | Drop `Products.materials: array{material:text}`. Add `Products.materialIds: relation[] → materials, hasMany`. Create `Materials` collection per spec §14: `name`, `slug`, `description (richText)`, `imageMediaId (upload)`, `origin`, `careNotes (richText)`, `relatedArticleIds (rel[]→articles, hasMany)`. **Breaking change** — there is no production data; seed is the only consumer; we drop the column outright rather than running a soft migration. Seed gains 5 materials (walnut, beech, oak, belgian-linen, velvet) populated with `name` + `slug` + `origin`. Other §14 fields stay empty until client provides content (FU-3.2-r). |
| Categories shape | Extend per spec §14: add `description (textarea)` + `parentId (relation→categories)`. The existing `(name, slug)` rows survive. Seed expands from 1 row to 4 flat rows: `beds = تخت‌خواب`, `wardrobes = کمد`, `dressers = دراور`, `mirrors = آینه`. (`bedroom = اتاق خواب` from the article seed remains; not assigned to products.) `parentId` left null on all four — tree depth >1 ships in 4.2 when `/categories/[slug]` lands. |
| `piece_type` retained | Keep `piece_type` enum on Products **alongside** `categoryIds`. They aren't redundant: `piece_type` is the manufacturing primitive (admin's title-bar discriminator since 1.3) and stays. `categoryIds` is the merchandising taxonomy used by the storefront for browse / filter / future `/categories/[slug]`. The category filter on `/products` filters by `categoryIds`, not by `piece_type` — categories may include multiple piece types (e.g. کمد category includes closets and wardrobes if the brand later distinguishes). |
| Filter axes | **Four per spec:** category / material / size / price band. Plus sort. Plus pagination. All server-side via Next's `searchParams` API on the RSC page. |
| Size filter (no schema delta) | Computed from `Products.dimensions.width` (cm). Bands: کوچک (`width < 120`), متوسط (`120 ≤ width ≤ 180`), بزرگ (`width > 180`). The choice avoids a schema field for size — furniture "size" is a ladder (single / queen / king) that only makes sense per piece-type, and that ladder lives in `productVariants` (§13, Pkg 2). The dimension-band approach is pragmatic, doesn't lie (it derives from a real datum), and gracefully degrades when `dimensions.width` is unset (product is excluded from any size-filtered view, included in the unfiltered view). Filter is applied **after** the Payload query (RSC-side post-fetch over the page's results) — Payload's `where` API on group subfields with `gt` / `lt` works in Postgres but the post-fetch path keeps the implementation portable and honest about the band thresholds being a UI concern. |
| Price band filter | Bands (toman in display, rial integer in storage / query): `<5M` (basePriceRials < 50_000_000), `5–15M` (50M ≤ < 150M), `15–30M` (150M ≤ < 300M), `>30M` (≥ 300M). Filter applied via `where[basePriceRials][gte]` + `[lt]` on the Payload query. Persian band labels: «تا ۵ میلیون», «۵ تا ۱۵ میلیون», «۱۵ تا ۳۰ میلیون», «بیش از ۳۰ میلیون». Live entirely in `apps/web/src/lib/products.ts` (FU-3.2-p promotes to `@zhic/locale` if a 2nd consumer appears). |
| Material filter | Multi-select via `?material=walnut&material=oak` (URLSearchParams `getAll`). Maps to Payload `where[materialIds.slug][in]=[…]` (depth=2 query supports nested-relation slug filtering on Postgres). |
| Category filter | Single-select via `?category=beds`. Maps to `where[categoryIds.slug][equals]=beds`. Multi-select would also work but UX is one-at-a-time on storefront catalogs by convention — keep simple. |
| Sort | `<Select name="sort">` in toolbar above the grid (logical-end side under RTL). Options: `جدیدترین` (default = `-createdAt`), `نام` (= `name`), `ارزان‌ترین` (= `basePriceRials`), `گران‌ترین` (= `-basePriceRials`). |
| Pagination | 12 per page (3 columns × 4 rows on desktop, density per spec catalog feel). `?page=N` ASCII per `sitemap.md` §1. Persian-digit display via `toPersianDigits`. Prev / Next buttons RTL-aware (next chevron points left). Numbered pages 1, 2, …, last with truncation when > 7 (`1, 2, 3, …, 12`). Implementation lives in `components/products/Pagination.tsx`. |
| Filter form pattern | **Native `<form method="GET" action="/products">`** with `<select>` / `<input type="checkbox">` / `<button type="submit">`. Submission is a real navigation, no JS needed. Reset link to `/products`. Submit on each change is **opt-out** (intentionally no `onChange` autosubmit) — Apply button is explicit. Persists `sort` + `page` as hidden inputs when re-submitting from the filter panel (page resets to 1 on filter change; sort persists). |
| Filter UI placement | **Sidebar (sticky, logical-start side under RTL = right) on `md+`, Drawer (uses 2.2 `<Drawer>`) on `< md`.** Drawer trigger is a `<Button variant="secondary">` labeled «فیلترها» on mobile; drawer body is the same `<form>` as the desktop sidebar. |
| Empty filter result | Persian message «موردی با این فیلترها یافت نشد. می‌توانید فیلترها را پاک کنید و دوباره امتحان کنید.» + reset `<a href="/products">پاک کردن فیلترها</a>`. |
| PDP layout | Spec §3 ProductDetail: media stage on logical-start (right under RTL) at 60%, purchase column on logical-end (left under RTL) at 40%. Use `<Split ratio="60/40">` — its grid respects RTL natively. Mobile collapses to vertical with media first. |
| Sticky breadcrumb on PDP | `<div className="sticky top-0 z-10 bg-ivory/90 backdrop-blur border-b border-sand/40">` wrapper around `<Breadcrumbs>` at PDP top. The header from 2.2 is **not** sticky (verified — `(site)/layout.tsx` doesn't apply sticky positioning), so `top-0` is correct; if 2.2's header is ever made sticky, breadcrumb's `top` becomes `var(--header-height)` (FU). |
| Tabbed media stage | Partition `gallery[]` by mimeType: `image/jpeg|png|webp` → "تصاویر" tab, `image/gif|video/*` → "حرکت" tab. If only one group is non-empty → render flat (no tabs). Tabs are a lightweight `<button role="tab">` group with `aria-selected` + `aria-controls` (no JS-heavy tab control needed; managed via React `useState` in a small `'use client'` component `MediaStageTabs`). Underlying renderer per tab is `<ImageGallery>`. **No 3D tab** — `model3d` is Pkg 2 per §12.4; logged as FU-3.2-a. |
| Purchase column composition | h1 (`text-display font-bold`), tagline (`text-lead text-stone`), `<MoneyDisplay rials={basePriceRials}>` (rendered larger via wrapper), availability badge (reuses ProductCard's mapping: in_stock → success / made_to_order → neutral / backorder → warning / discontinued → neutral, Persian labels), lead-time line («تحویل {n} روز کاری» where n = `toPersianDigits(leadTimeDays)`), primary CTA `<Button as="a" href={inquiryHref(product)}>استعلام قیمت</Button>`, secondary CTA `<Button as="a" variant="secondary" href="/showrooms">رزرو بازدید از شوروم</Button>`, SKU line («SKU: {sku}») in `text-small text-stone` with `dir="ltr"`. **Sticky on `lg+`**: `lg:sticky lg:top-8 lg:self-start` so it stays visible while user scrolls long descriptions. |
| Primary CTA target | `inquiryHref(product) = '/contact?product=' + slug + '&reason=quote'`. `/contact` ships in 3.3; the inquiry form ships in 5.1 and reads these query params. Until 3.3 lands the link 404s — acknowledged. |
| Secondary CTA target | `/showrooms` — also ships in 3.3. 404s until then. |
| Specs accordion | Native `<details>` / `<summary>` (no JS). Sections in order: ابعاد (`dimensions.width × depth × height` cm), متریال (chips of material `name`s from `materialIds`), زمان تحویل («{n} روز کاری»), مشخصات فنی (`<RichText value={specs}>` if non-empty). Each `<details open>` by default on desktop (`md+`), closed on mobile via `[open]:max-md:hidden` no — actually Tailwind can't toggle `open` per breakpoint with native `<details>`; **revised**: all sections `<details open>` on every viewport. Mobile collapse can be `<details>` (closed by default) only if the section is heavy; for now keep all open since each section is short. |
| Long description | `<RichText value={product.longDescription}>` — uses existing `lib/richtext.tsx`. Same node set the home `brand_statement` uses. Renders below the split, full container width. |
| Related rows | Two rows below the long description: «محصولات مرتبط» = `relatedProductIds`; «در کنار آن خوب است» = `pairsWithProductIds`. Each renders `<Grid columns={4} gap="md">` of `<ProductCard>`. Hidden when the relation is empty. **No fallback to "more from this design"** — spec is explicit (curator-set). Seed populates both relations on at least one product so the rows render in demo. |
| ProductCard reuse | Reuse 2.3's `<ProductCard>` as-is on `/products`, `/collections/[slug]`, related rows, pairs-with rows. Does not re-open FU-2.3-f (compact / hero variants) — 4-up at standard size on `lg+` is the natural compact form (cards reflow gracefully). |
| JSON-LD on PDP | `Product` (inquiry-mode per spec §12.4) + `BreadcrumbList`. Rendered via `<script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(...)}}>` in the page body. New helper file `apps/web/src/lib/jsonld.ts` exports `productJsonLd(product, baseUrl)`, `breadcrumbJsonLd(items, baseUrl)`, `collectionPageJsonLd({name, url, description})`. **Scope of `Product` JSON-LD this session:** `@type: Product`, `name`, `image` (absolute media URLs from `gallery`), `description` (= `shortDescription`), `sku`, `brand: {@type: Brand, name: 'Zhic'}`, `material` (comma-joined material names), `offers: {@type: Offer, priceCurrency: 'IRR', price: basePriceRials, url: <site>/contact?…&reason=quote, availability: <schema URL mapped per §12.4>}`. `availability` map: `in_stock` → `https://schema.org/InStock`, `made_to_order` → `https://schema.org/PreOrder`, `backorder` → `https://schema.org/BackOrder`, `discontinued` → `https://schema.org/Discontinued`. Note: `price` is **rials** (integer) per spec, not toman — schema.org `price` is currency-agnostic and IRR is the storage unit. |
| JSON-LD on `/products` + `/collections/[slug]` | `CollectionPage` + `BreadcrumbList`. `CollectionPage` payload: `@type: CollectionPage`, `name`, `url`, `description`. Lightweight — no enumerated `hasPart` of every product (would explode with pagination). |
| Site base URL for JSON-LD | `process.env.SITE_URL` with localhost fallback `http://localhost:3000` for dev. Document in `.env.example`. Production wiring in 7.1. |
| `/products` data fetch | Three queries via `Promise.all`: products (`/api/products?where=<filters>&sort=<sort>&page=<n>&limit=12&depth=2`), categories (`/api/categories?limit=100`), materials (`/api/materials?limit=100`). Each cached with their own tag (`products`, `categories`, `materials`) at `revalidate: 300`. Categories + materials lists power the filter sidebar; products fills the grid. |
| `/products/[slug]` data fetch | One query: `/api/products?where[slug][equals]=<slug>&depth=3&limit=1` — `depth=3` resolves nested `categoryIds.name`, `materialIds.name`, `relatedProductIds.gallery[0]`, `pairsWithProductIds.gallery[0]`. Returns `null` on empty / fetch failure → page calls `notFound()`. |
| `/collections/[slug]` data fetch | One query: `/api/collections?where[slug][equals]=<slug>&depth=2&limit=1`. The collection doc has `products: PayloadProduct[]` resolved via depth=2 (each product carries `gallery[0]` + `materialIds[0..n].name`). 404 via `notFound()` on miss. |
| Caching | Per-resource tags: `products`, `collections`, `materials`, `categories`. 5-minute revalidate window. Tag-based purge wires in 7.1 (FU-3.1-e — single webhook handles all of these). |
| Loading state | `apps/web/src/app/(site)/products/loading.tsx` — skeleton: filter sidebar shape (cream blocks) + 12 ghost product cards (cream `<Aspect ratio="4/5">` + 2 lines of placeholder text). PDP + collection page share the route group `error.tsx` from 3.1; no per-route loading file (the data is small enough that the Suspense boundary isn't visually obtrusive). |
| Persian 404 | Add `apps/web/src/app/(site)/not-found.tsx` per `sitemap.md` §4. Branded Persian copy: «صفحه‌ای که دنبالش بودید پیدا نشد» + three navigation tiles: «بازگشت به خانه» → `/`, «شوروم‌ها» → `/showrooms`, «ژورنال» → `/journal`. Search tile omitted until Pkg 2+ (FU-3.2-n). |
| `lib/payload.ts` extensions | Add types: `PayloadCategory`, `PayloadMaterial`, `PayloadProduct`, `PayloadCollection`. Add fetchers: `fetchProducts(query: ProductsQuery): Promise<PayloadList<PayloadProduct>>`, `fetchProduct(slug): Promise<PayloadProduct \| null>`, `fetchCollection(slug): Promise<PayloadCollection \| null>`, `fetchCategories(): Promise<PayloadCategory[]>`, `fetchMaterials(): Promise<PayloadMaterial[]>`. Add helpers: `productPath(slug)`, `collectionPath(slug)`, `inquiryHref(product)`. Total addition ≈ 120–160 lines. |
| `ProductsQuery` shape | `{ category?: string; materials?: string[]; size?: 'small'\|'medium'\|'large'; price?: 'lt5'\|'5to15'\|'15to30'\|'gt30'; sort?: 'newest'\|'name'\|'priceAsc'\|'priceDesc'; page?: number; }` — typed at the API of `fetchProducts`. URL-param parsing is its own helper in `lib/products.ts`. |
| `lib/products.ts` (new) | Page-specific helpers: `parseSearchParams(sp): ProductsQuery`, `priceBandLabel(band): string`, `sizeBandFromDimensions(dims): 'small'\|'medium'\|'large'\|null`, `sizeBandLabel(band): string`, `sortLabel(sort): string`, `applyClientSizeBand(products, band)` (RSC-side post-fetch filter). Lives in `apps/web/src/lib/` since it's storefront-specific transformation logic; promote to `@zhic/locale` if a 2nd consumer appears (FU-3.2-p). |
| `lib/jsonld.ts` (new) | Pure functions returning JSON-serializable objects. No React. No request-context. Safe to call from RSC bodies + future operator pages. |
| api-client promotion | **Defer FU-3.1-b — updated rationale.** Every consumer is inside `apps/web` (3.2 / 3.3 / 4.1 are all storefront pages). The package boundary buys nothing today. Promote when an operator app outside `apps/web` first imports the helpers (Pkg 3+). The size of `lib/payload.ts` after this session (~250 lines including types) is still well under the threshold where one-file-per-consumer becomes unwieldy. |
| richtext promotion | **Defer FU-3.1-c.** PDP `longDescription` + `specs` use the same Lexical node set the existing serializer covers (paragraph / heading / text / link / list / linebreak). Articles in 4.1 are when pull-quotes / image-grids / product-embeds force the package boundary. |
| `<Bleed>` primitive | **Skip FU-3.1-m.** PDP gallery lives inside the 60/40 split, container-bounded. 4.1 articles are likely the first consumer that needs nested full-bleed escape. |
| New `@zhic/ui` primitives | **None.** PDP needs nothing reusable beyond what 2.x + 3.1 already shipped. The media-stage tab control is a page-specific composition; promote to `<Tabs>` when a 2nd consumer appears (FU-3.2-o, likely 4.2 atelier / care). |
| Page-specific block location | `apps/web/src/components/products/` and `apps/web/src/components/collection/`. Same boundary as 3.1's `components/home/` — page compositions live in the consumer app, not in `@zhic/ui`. |
| Motion | **Zero motion this session.** Sticky purchase column is layout, not motion. All reveal / scroll / tab-transition choreography is 6.2. Tab switching is an instant `setState` toggle — no transition. |
| Images | Raw `<img>` per 2.3 / 3.1 pattern. FU-3.1-l + FU-2.3-g own Next/Image migration. Fall back to `<Aspect>` cream placeholders for products with empty `gallery`. |
| Seed scope | Materials (5: walnut / beech / oak / belgian-linen / velvet), Categories (4 flat: beds / wardrobes / dressers / mirrors), Products (8 spanning 3 piece_types and 4 categories with full relations populated — `categoryIds`, `materialIds`, `tagIds`, `tagline`, `shortDescription`, `longDescription` (3-paragraph Lexical), `availability`, `leadTimeDays`, `sku` deterministic), Collections (1: «مجموعه‌ی شب آرام» — 3 products, Persian description). Skip media uploads (FU-3.1-f / FU-3.2-q). One product gets `relatedProductIds` set to 2 others + `pairsWithProductIds` set to 1 other so PDP rows render. |
| Verification | Visual at every URL combination listed in Exit check. Build: `pnpm --filter @zhic/web build` shows `/products` as `ƒ (Dynamic)` (depends on `searchParams`), `/products/[slug]` + `/collections/[slug]` as `● (SSG)` if `generateStaticParams` is wired, else `ƒ (Dynamic)` — both acceptable. |
| `generateStaticParams` | **Skip on `/products/[slug]` and `/collections/[slug]` for now.** Static gen requires a build-time fetch from Payload, which means `services/api` must be running during `pnpm build`. That's a CI / infra concern that lands in 7.1. Until then, dynamic SSR with 5-minute revalidate. Logged as FU-3.2-s. |
| Testing | No new unit tests for blocks (compositions). `lib/products.ts` helpers (`sizeBandFromDimensions`, `priceBandLabel`, `parseSearchParams`) get a Vitest file at `apps/web/src/lib/__tests__/products.test.ts` — these are pure functions with branchy logic, worth pinning. (Storefront app's first test file; wire `pnpm --filter @zhic/web test` script if not already present — Vitest config already exists at the workspace level via 1.4.) |
| Sandbox limitation | Same as 3.1: no Postgres → seed can't run end-to-end here, only `services/api` typecheck verifies the schema is well-formed. User runs full local verification. Document in Implementation notes. |

## Deliverables

### `services/api/src/collections/Materials.ts` — NEW

```ts
import type { CollectionConfig } from 'payload'
import { slugify } from '../lib/slugify'

export const Materials: CollectionConfig = {
  slug: 'materials',
  labels: { singular: 'متریال', plural: 'متریال‌ها' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'origin'] },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data?.name && !data?.slug) data.slug = slugify(data.name as string)
        return data
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true, label: 'نام متریال' },
    {
      name: 'slug', type: 'text', unique: true, label: 'اسلاگ',
      admin: { position: 'sidebar', description: 'Auto-generated from name' },
    },
    { name: 'description', type: 'richText', label: 'توضیحات' },
    { name: 'image', type: 'upload', relationTo: 'media', label: 'تصویر' },
    { name: 'origin', type: 'text', label: 'مبدأ' },
    { name: 'careNotes', type: 'richText', label: 'نکات مراقبت' },
    {
      name: 'relatedArticles', type: 'relationship',
      relationTo: 'articles', hasMany: true, label: 'مقاله‌های مرتبط',
    },
  ],
}
```

Spec §14 fields: `name`, `slug`, `description`, `imageMediaId`,
`origin`, `careNotes`, `relatedArticleIds` — all present. Field
naming follows existing collection conventions (Payload's relationship
field accepts singular `relatedArticles`; the `Ids` suffix in spec is
a documentation convention, not a required Payload field name).

### `services/api/src/collections/Collections.ts` — NEW

```ts
import type { CollectionConfig } from 'payload'
import { slugify } from '../lib/slugify'

export const Collections: CollectionConfig = {
  slug: 'collections',
  labels: { singular: 'مجموعه', plural: 'مجموعه‌ها' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'featured'] },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data?.name && !data?.slug) data.slug = slugify(data.name as string)
        return data
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true, label: 'نام مجموعه' },
    {
      name: 'slug', type: 'text', unique: true, label: 'اسلاگ',
      admin: { position: 'sidebar', description: 'Auto-generated from name' },
    },
    { name: 'description', type: 'richText', label: 'توضیحات' },
    { name: 'cover', type: 'upload', relationTo: 'media', label: 'تصویر شاخص' },
    {
      name: 'products', type: 'relationship',
      relationTo: 'products', hasMany: true, required: true, label: 'محصولات',
    },
    {
      name: 'featured', type: 'checkbox', defaultValue: false,
      admin: { position: 'sidebar' }, label: 'نمایش در منوی ناوبری',
    },
  ],
}
```

Spec §14 fields: `name`, `slug`, `description`, `coverMediaId`,
`productIds`, `featured`, plus `seo` + `status`. `seo` + `status`
deferred to 6.1 / FU-3.2-f.

### `services/api/src/collections/Categories.ts` — MODIFY

Add `description` (textarea) + `parent` (relationship → categories,
self-ref). Existing `name` + `slug` fields preserved.

```ts
fields: [
  { name: 'name', /* unchanged */ },
  { name: 'slug', /* unchanged */ },
  { name: 'description', type: 'textarea', label: 'توضیحات' },
  {
    name: 'parent', type: 'relationship', relationTo: 'categories',
    label: 'دسته‌بندی والد',
    admin: { position: 'sidebar', description: 'برای ساخت ساختار درختی' },
  },
],
```

### `services/api/src/collections/Products.ts` — MODIFY

Final field order (per spec §12 with naming aligned to existing
conventions where they don't conflict):

| Field | Type | Notes |
|---|---|---|
| `name` | text required | Persian display name (existing) |
| `slug` | text unique | (existing) |
| `tagline` | text | One-line poetic descriptor (Persian) — NEW |
| `shortDescription` | textarea | ≤ 200 chars, used on cards — NEW |
| `longDescription` | richText | MDX-compatible blocks — NEW |
| `design` | rel→designs required | (existing) |
| `piece_type` | select | bed/nightstand/closet/dresser/mirror/desk/bookcase/display_cabinet — (existing, retained) |
| `categoryIds` | rel[]→categories hasMany | NEW |
| `tagIds` | rel[]→tags hasMany | NEW (Articles already use Tags; same collection now multi-purpose) |
| `materialIds` | rel[]→materials hasMany required | NEW (replaces `materials` array) |
| `sku` | text unique required | NEW |
| `basePriceRials` | number | (existing — integer rials, validated) |
| `salePriceRials` | number | NEW (validated same as base; not rendered until Pkg 2 — FU-3.2-d) |
| `availability` | select required | NEW: in_stock / made_to_order / backorder / discontinued; default `made_to_order` (matches today's "everything is built-to-order" reality of an Iranian furniture atelier) |
| `leadTimeDays` | number required | NEW; default 56 per spec |
| `dimensions` | group | width / height / depth (existing) |
| `gallery` | upload[] | (existing) |
| `inquiry_enabled` | checkbox sidebar | (existing) |
| `featured` | checkbox sidebar | NEW |
| `featuredOrder` | number sidebar | NEW |
| `relatedProductIds` | rel[]→products hasMany | NEW |
| `pairsWithProductIds` | rel[]→products hasMany | NEW |
| `specs` | richText | (existing — admin-facing technical specs) |

**Removed:** `materials` (the free-text array — its data migrates to
`materialIds`).

Naming choice: spec uses `categoryIds` / `materialIds` / etc. with the
`Ids` suffix; Payload itself doesn't require it. Following spec
exactly here keeps the `lib/payload.ts` types lining up 1:1 with the
spec field names so there's no translation step. The existing
snake_case fields (`basePriceRials`, `inquiry_enabled`, `piece_type`)
keep their names — they were chosen for Payload-admin readability in
1.3 and are not worth churning.

SKU validation: `/^[A-Z]{2,4}-\d{3,5}$/` (e.g., `BED-001`, `WRD-024`).

### `services/api/src/payload.config.ts` — MODIFY

Register the two new collections:

```ts
import { Materials } from './collections/Materials'
import { Collections } from './collections/Collections'
// ...
collections: [
  Designs, Products, Showrooms, Articles, Categories, Tags,
  Materials,    // NEW
  Collections,  // NEW
  Media, Inquiries,
],
```

### `services/api/src/seed.ts` — MODIFY

Order of operations (must respect FK dependencies):

1. Categories — 4 rows (`beds`, `wardrobes`, `dressers`, `mirrors`).
   `bedroom` from existing seed kept, used by Articles.
2. Tags — existing 2 + 2 more (`storage`, `linen`) for product tags.
3. Materials — 5 rows.
4. Designs — existing 2 (آرامش / بهار).
5. Products — 8 rows. Each has all required fields populated:
   `tagline`, `shortDescription` (Persian, ≤ 200 chars),
   `longDescription` (3-paragraph Lexical doc constructed via the
   `paragraph()` helper from 3.1's seed), `categoryIds` (1–2),
   `materialIds` (1–3), `tagIds` (0–2), `sku` (deterministic, e.g.
   `BED-001`), `availability`, `leadTimeDays`, `dimensions`. Two
   products get `relatedProductIds` + `pairsWithProductIds` set so
   PDP rows render in demo. `gallery` left empty (FU-3.2-q).
6. Showrooms — existing 1 (همدان) unchanged.
7. Articles — existing 1 unchanged.
8. Collections — 1 row («مجموعه‌ی شب آرام»), `products` references 3
   of the 8 products by ID, `description` is a small Lexical doc.
9. Home global — existing block unchanged.

Idempotency pattern (find-by-slug → upsert) extends to all new
entities. Materials' `slug` carries the lookup key.

Approximate seed file growth: ~130 → ~280 lines.

### `apps/web/src/lib/payload.ts` — EXTEND

New types (added after existing types):

```ts
export type PayloadCategory = {
  id: string | number; name: string; slug: string;
  description?: string | null;
  parent?: PayloadCategory | string | number | null;
};

export type PayloadMaterial = {
  id: string | number; name: string; slug: string;
  origin?: string | null;
  description?: LexicalRoot | null;
  careNotes?: LexicalRoot | null;
};

export type PayloadProduct = {
  id: string | number;
  name: string; slug: string;
  tagline?: string | null;
  shortDescription?: string | null;
  longDescription?: LexicalRoot | null;
  design?: { id: string | number; name: string; slug: string } | null;
  piece_type?:
    | 'bed' | 'nightstand' | 'closet' | 'dresser'
    | 'mirror' | 'desk' | 'bookcase' | 'display_cabinet' | null;
  categoryIds?: PayloadCategory[] | null;
  tagIds?: { id: string | number; name: string; slug: string }[] | null;
  materialIds?: PayloadMaterial[] | null;
  sku?: string | null;
  basePriceRials?: number | null;
  salePriceRials?: number | null;
  availability?: 'in_stock' | 'made_to_order' | 'backorder' | 'discontinued' | null;
  leadTimeDays?: number | null;
  dimensions?: { width?: number; height?: number; depth?: number } | null;
  gallery?: PayloadMedia[] | null;
  inquiry_enabled?: boolean | null;
  featured?: boolean | null;
  featuredOrder?: number | null;
  relatedProductIds?: PayloadProduct[] | null;
  pairsWithProductIds?: PayloadProduct[] | null;
  specs?: LexicalRoot | null;
  createdAt?: string | null;
};

export type PayloadCollection = {
  id: string | number;
  name: string; slug: string;
  description?: LexicalRoot | null;
  cover?: PayloadMedia | null;
  products?: PayloadProduct[] | null;
  featured?: boolean | null;
};

export type ProductsQuery = {
  category?: string;
  materials?: string[];
  price?: 'lt5' | '5to15' | '15to30' | 'gt30';
  size?: 'small' | 'medium' | 'large';
  sort?: 'newest' | 'name' | 'priceAsc' | 'priceDesc';
  page?: number;
};
```

New fetchers + helpers:

```ts
const PRODUCTS_PER_PAGE = 12;

export async function fetchProducts(
  query: ProductsQuery,
): Promise<{ docs: PayloadProduct[]; totalDocs: number; totalPages: number; page: number; }> {
  const params = new URLSearchParams();
  params.set('limit', String(PRODUCTS_PER_PAGE));
  params.set('page', String(query.page ?? 1));
  params.set('depth', '2');
  params.set('sort', sortToPayload(query.sort));
  if (query.category) params.set('where[categoryIds.slug][equals]', query.category);
  if (query.materials?.length) {
    for (const m of query.materials) params.append('where[materialIds.slug][in]', m);
  }
  if (query.price) {
    const [gte, lt] = priceBandRange(query.price);
    if (gte !== null) params.set('where[basePriceRials][gte]', String(gte));
    if (lt !== null) params.set('where[basePriceRials][lt]', String(lt));
  }
  // size band is RSC-side post-fetch — Payload's group-subfield filtering
  // is dialect-dependent and the band thresholds are a UI concern.
  return (await payloadFetch(`/api/products?${params.toString()}`, 'products')) ?? {
    docs: [], totalDocs: 0, totalPages: 0, page: 1,
  };
}

export async function fetchProduct(slug: string): Promise<PayloadProduct | null> {
  const params = new URLSearchParams({
    'where[slug][equals]': slug, depth: '3', limit: '1',
  });
  const res = await payloadFetch<{ docs: PayloadProduct[] }>(
    `/api/products?${params.toString()}`, 'products',
  );
  return res?.docs[0] ?? null;
}

export async function fetchCollection(slug: string): Promise<PayloadCollection | null> {
  const params = new URLSearchParams({
    'where[slug][equals]': slug, depth: '2', limit: '1',
  });
  const res = await payloadFetch<{ docs: PayloadCollection[] }>(
    `/api/collections?${params.toString()}`, 'collections',
  );
  return res?.docs[0] ?? null;
}

export async function fetchCategories(): Promise<PayloadCategory[]> {
  const res = await payloadFetch<{ docs: PayloadCategory[] }>(
    '/api/categories?limit=100&sort=name', 'categories',
  );
  return res?.docs ?? [];
}

export async function fetchMaterials(): Promise<PayloadMaterial[]> {
  const res = await payloadFetch<{ docs: PayloadMaterial[] }>(
    '/api/materials?limit=100&sort=name', 'materials',
  );
  return res?.docs ?? [];
}

export function productPath(slug: string) { return `/products/${slug}`; }
export function collectionPath(slug: string) { return `/collections/${slug}`; }
export function inquiryHref(product: Pick<PayloadProduct, 'slug'>) {
  return `/contact?product=${encodeURIComponent(product.slug)}&reason=quote`;
}
```

`sortToPayload` + `priceBandRange` defined locally; `PRODUCTS_PER_PAGE`
exported for the Pagination component.

### `apps/web/src/lib/products.ts` — NEW

```ts
import type { PayloadProduct, ProductsQuery } from './payload';

export function parseSearchParams(
  sp: Record<string, string | string[] | undefined>,
): ProductsQuery {
  const get = (k: string) => Array.isArray(sp[k]) ? sp[k][0] : sp[k];
  const getAll = (k: string) =>
    Array.isArray(sp[k]) ? sp[k] : sp[k] ? [sp[k]] : [];
  const sortRaw = get('sort');
  const priceRaw = get('price');
  const sizeRaw = get('size');
  const pageRaw = get('page');
  return {
    category: get('category') || undefined,
    materials: getAll('material').filter(Boolean) as string[],
    price: (['lt5','5to15','15to30','gt30'].includes(priceRaw as string) ? priceRaw : undefined) as ProductsQuery['price'],
    size: (['small','medium','large'].includes(sizeRaw as string) ? sizeRaw : undefined) as ProductsQuery['size'],
    sort: (['newest','name','priceAsc','priceDesc'].includes(sortRaw as string) ? sortRaw : 'newest') as ProductsQuery['sort'],
    page: pageRaw ? Math.max(1, Number.parseInt(pageRaw, 10) || 1) : 1,
  };
}

export function sizeBandFromDimensions(
  dims?: { width?: number } | null,
): 'small' | 'medium' | 'large' | null {
  const w = dims?.width;
  if (typeof w !== 'number') return null;
  if (w < 120) return 'small';
  if (w <= 180) return 'medium';
  return 'large';
}

export function applyClientSizeBand(
  products: PayloadProduct[],
  band: ProductsQuery['size'],
): PayloadProduct[] {
  if (!band) return products;
  return products.filter((p) => sizeBandFromDimensions(p.dimensions) === band);
}

export const PRICE_BAND_LABEL = {
  lt5: 'تا ۵ میلیون تومان',
  '5to15': '۵ تا ۱۵ میلیون تومان',
  '15to30': '۱۵ تا ۳۰ میلیون تومان',
  gt30: 'بیش از ۳۰ میلیون تومان',
} as const;

export const SIZE_BAND_LABEL = {
  small: 'کوچک',
  medium: 'متوسط',
  large: 'بزرگ',
} as const;

export const SORT_LABEL = {
  newest: 'جدیدترین',
  name: 'نام',
  priceAsc: 'ارزان‌ترین',
  priceDesc: 'گران‌ترین',
} as const;
```

### `apps/web/src/lib/__tests__/products.test.ts` — NEW

Vitest file pinning the branchy logic in `lib/products.ts`. Test
cases: `parseSearchParams` happy paths + each invalid input falling
back to safe defaults, `sizeBandFromDimensions` boundaries (119 /
120 / 180 / 181), `applyClientSizeBand` filter behavior + null-band
pass-through. ≥ 15 cases.

If `apps/web` doesn't already have a `test` script, add it:

```json
"scripts": {
  "test": "vitest run"
}
```

Vitest already exists in `packages/locale` + `packages/money` from
1.4 — same config style. New devDep on `apps/web`: `vitest`.

### `apps/web/src/lib/jsonld.ts` — NEW

```ts
import type { PayloadProduct, PayloadCollection } from './payload';
import { mediaUrl } from './payload';
import { plainTextFromRichText } from './richtext';

const AVAILABILITY_SCHEMA: Record<string, string> = {
  in_stock: 'https://schema.org/InStock',
  made_to_order: 'https://schema.org/PreOrder',
  backorder: 'https://schema.org/BackOrder',
  discontinued: 'https://schema.org/Discontinued',
};

export function productJsonLd(product: PayloadProduct, baseUrl: string) {
  const images = (product.gallery ?? [])
    .map((m) => mediaUrl(m))
    .filter((u): u is string => Boolean(u))
    .map((u) => (u.startsWith('http') ? u : `${baseUrl}${u}`));
  const materials = (product.materialIds ?? []).map((m) => m.name).join(', ');
  const inquiryUrl = `${baseUrl}/contact?product=${encodeURIComponent(product.slug)}&reason=quote`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: images.length > 0 ? images : undefined,
    description:
      product.shortDescription ??
      plainTextFromRichText(product.longDescription) ??
      undefined,
    sku: product.sku ?? undefined,
    brand: { '@type': 'Brand', name: 'Zhic' },
    material: materials || undefined,
    offers: product.basePriceRials != null
      ? {
          '@type': 'Offer',
          priceCurrency: 'IRR',
          price: product.basePriceRials,
          url: inquiryUrl,
          availability: product.availability
            ? AVAILABILITY_SCHEMA[product.availability]
            : undefined,
        }
      : undefined,
  };
}

export function breadcrumbJsonLd(
  items: { name: string; url: string }[],
  baseUrl: string,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: it.name,
      item: it.url.startsWith('http') ? it.url : `${baseUrl}${it.url}`,
    })),
  };
}

export function collectionPageJsonLd(args: {
  name: string; url: string; description?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: args.name,
    url: args.url,
    description: args.description,
  };
}
```

### `apps/web/src/lib/env.ts` — EXTEND

```ts
export const API_URL = process.env.API_URL ?? 'http://localhost:3001';
export const SITE_URL = process.env.SITE_URL ?? 'http://localhost:3000';
```

`apps/web/.env.example` documents both.

### `apps/web/src/components/products/`

```
ProductFilters.tsx          # form-based filter UI (sidebar + drawer body)
ProductGrid.tsx             # RSC wrapper around <Grid> + <ProductCard> map
Pagination.tsx              # Persian-digit pager with RTL-aware arrows
ProductIndexToolbar.tsx     # sort <Select> + count + mobile filter trigger
ProductMediaStage.tsx       # tabs for stills/motion (small 'use client')
ProductPurchasePanel.tsx    # sticky purchase column for PDP
ProductSpecsAccordion.tsx   # native <details> sections
ProductRelatedRow.tsx       # "محصولات مرتبط" — Grid columns=4
ProductPairsWithRow.tsx     # "در کنار آن خوب است" — Grid columns=4
ProductIndexEmpty.tsx       # empty filter result with reset link
```

### `apps/web/src/components/collection/`

```
CollectionHeader.tsx        # cover image + name + description
```

### `apps/web/src/app/(site)/products/page.tsx` — NEW

```ts
export default async function ProductsIndex({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const query = parseSearchParams(sp);
  const [page, categories, materials] = await Promise.all([
    fetchProducts(query),
    fetchCategories(),
    fetchMaterials(),
  ]);
  const filtered = applyClientSizeBand(page.docs, query.size);
  // ... compose: Section > Container > breadcrumb > toolbar > Split[sidebar | grid+pagination]
  // empty state when filtered.length === 0
  // JSON-LD: collectionPageJsonLd + breadcrumbJsonLd
}
```

`generateMetadata`:
- Title: «محصولات — ژیک»
- Description: «مجموعه مبلمان دست‌ساز ژیک — تخت‌خواب، کمد، دراور و آینه با چوب گردو، بلوط و راش.» (CMS-driven if a future `pages.products` singleton ships; static today)

### `apps/web/src/app/(site)/products/loading.tsx` — NEW

12 ghost cards in a `<Grid columns={3}>`, each with `<Aspect ratio="4/5" className="bg-cream animate-pulse">` and 2 placeholder lines.

### `apps/web/src/app/(site)/products/[slug]/page.tsx` — NEW

```ts
export default async function ProductDetail({ params }: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  const product = await fetchProduct(slug);
  if (!product) notFound();
  // breadcrumb (sticky) → Split[60/40 media | purchase] → specs accordion
  // → long description → related row → pairsWith row → JSON-LD scripts
}

export async function generateMetadata({ params }: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProduct(slug);
  if (!product) return { title: 'محصول یافت نشد — ژیک' };
  const description =
    product.shortDescription ??
    plainTextFromRichText(product.longDescription) ??
    'مبلمان دست‌ساز ژیک';
  return {
    title: `${product.name} — ژیک`,
    description,
    openGraph: { locale: 'fa_IR', type: 'website' },
  };
}
```

### `apps/web/src/app/(site)/collections/[slug]/page.tsx` — NEW

Similar shape: fetch by slug → 404 on miss → render `<CollectionHeader>` + `<Grid columns={3}>` of products + JSON-LD `CollectionPage` + `BreadcrumbList`.

### `apps/web/src/app/(site)/not-found.tsx` — NEW

```tsx
export default function NotFound() {
  return (
    <Section padY="xl">
      <Stack gap="lg" align="center">
        <h1 className="text-display font-bold">صفحه‌ای که دنبالش بودید پیدا نشد</h1>
        <p className="text-lead text-stone text-center max-w-prose">
          ممکن است نشانی را اشتباه وارد کرده باشید یا این صفحه جابه‌جا شده باشد.
        </p>
        <Grid columns={3} gap="md">
          <Tile href="/" label="بازگشت به خانه" />
          <Tile href="/showrooms" label="شوروم‌ها" />
          <Tile href="/journal" label="ژورنال" />
        </Grid>
      </Stack>
    </Section>
  );
}
```

`Tile` is a small inline component (cream card with logical-end chevron).

### Component contracts (concise)

- **`ProductFilters`** — props: `{ categories, materials, query, action: '/products' | '/collections/[slug]' }`. Renders `<form method="GET" action={action}>` with: category `<select>`, material checkboxes, size `<select>`, price band `<select>`, hidden `<input type="hidden" name="sort">` carrying current sort, `<button type="submit">اعمال فیلترها</button>` + `<a href={action}>پاک کردن</a>`. On `< md` lives inside `<Drawer>` triggered by toolbar.

- **`ProductIndexToolbar`** — props: `{ totalDocs, query }`. Left: count «{n} محصول». Right: sort `<Select name="sort">` inside its own tiny `<form>` (or hoisted into the filter form — implementation detail). Mobile-only: «فیلترها» trigger button.

- **`ProductGrid`** — props: `{ products }`. `<Grid columns={3} gap="lg">` of `<ProductCard href={productPath(p.slug)} name={p.name} tagline={p.tagline} priceRials={p.basePriceRials} availability={p.availability} leadTimeDays={p.leadTimeDays} materials={p.materialIds?.map(m=>m.name)} image={<img …>} />`.

- **`Pagination`** — props: `{ currentPage, totalPages, basePath, query }`. Builds links that preserve all `query` keys except `page`. Persian digits, RTL-aware arrow direction. Hidden when `totalPages ≤ 1`.

- **`ProductMediaStage`** (`'use client'`) — props: `{ items: GalleryItem[] }`. Partitions by `kind` (passed in by the page from mimeType detection). Renders tab buttons + active `<ImageGallery layout="grid" columns={2} cellRatio="4/5">`. Tabs hidden if only one group.

- **`ProductPurchasePanel`** — props: `{ product }`. Sticky on `lg+`. Composes `<Stack gap="md">` with name (h1), tagline, MoneyDisplay (large), availability `<Badge>`, lead-time line, primary CTA, secondary CTA, SKU line.

- **`ProductSpecsAccordion`** — props: `{ product }`. Native `<details><summary>` blocks for ابعاد / متریال / زمان تحویل / مشخصات فنی. Each shown only if data is present.

- **`ProductRelatedRow`** + **`ProductPairsWithRow`** — props: `{ products: PayloadProduct[], heading: string }`. Hidden if `products.length === 0`. Renders heading + `<Grid columns={4}>` of ProductCards.

- **`ProductIndexEmpty`** — props: `{ resetHref: '/products' }`. Friendly Persian copy + `<Button as="a" variant="secondary" href={resetHref}>پاک کردن فیلترها</Button>`.

- **`CollectionHeader`** — props: `{ collection: PayloadCollection }`. `<Section bg="cream" padY="xl">` → `<Container>` → `<Split ratio="40/60">` with cover (when present, else cream `<Aspect>`) on logical-start and `<Stack>` of name (h1) + `<RichText>` description on logical-end.

## Exit check

- [ ] `pnpm install` clean (one new devDep on `apps/web`: `vitest`).
- [ ] `pnpm --filter @zhic/api typecheck` passes.
- [ ] `pnpm --filter @zhic/api lint` passes.
- [ ] `pnpm --filter @zhic/web typecheck` passes.
- [ ] `pnpm --filter @zhic/web lint` passes (existing `<img>` warnings expected).
- [ ] `pnpm --filter @zhic/web test` passes (`lib/products.ts` Vitest file ≥ 15 cases).
- [ ] `pnpm --filter @zhic/api seed` runs clean against a dev DB (verified locally by user — sandbox limitation per FU-3.1-o).
- [ ] Payload admin shows: 4 categories, 5 materials, 8 products with all relations populated, 1 collection with 3 products.
- [ ] `pnpm --filter @zhic/web build` passes; route map shows `/products` as `ƒ (Dynamic)`, `/products/[slug]` + `/collections/[slug]` as `ƒ (Dynamic)` (no `generateStaticParams` this session — FU-3.2-s).
- [ ] With `services/api` running on port 3001:
  - `/products` shows 8 products in a 3-column grid, default sort newest, page 1 of 1.
  - `/products?category=beds` filters to bed products only.
  - `/products?material=walnut` filters to walnut products only.
  - `/products?material=walnut&material=oak` includes walnut OR oak.
  - `/products?size=large` filters to width > 180cm products only.
  - `/products?price=15to30` filters to 15M–30M toman products only.
  - `/products?category=beds&material=walnut&size=medium` combines all three.
  - `/products?sort=priceAsc` sorts ascending price.
  - `/products?page=2` paginates correctly when seed has ≥13 products (otherwise shows last page).
  - `/products?category=mirrors&size=large` (likely empty combo) renders `ProductIndexEmpty` with reset link.
  - `/products/takht-aramesh` (or any seeded slug) renders PDP: sticky breadcrumb, tabbed media stage (or flat if `gallery` empty — current state until FU-3.2-q), purchase column with name + tagline + price + availability badge + CTAs, specs accordion, long description, related row (if populated on this product), pairs-with row (if populated).
  - `/products/no-such-slug` → renders Persian 404 page.
  - `/collections/majmoo-shab-aram` (or seeded slug) renders collection header + 3-product grid.
  - `/collections/no-such-slug` → renders Persian 404 page.
- [ ] PDP CTA `<a>` href is `/contact?product=<slug>&reason=quote` and `/showrooms` (verified via DevTools — both 404 today, will work after 3.3).
- [ ] PDP `<script type="application/ld+json">` blocks contain valid JSON for `Product` (with `offers.priceCurrency: "IRR"`, `offers.url` pointing at `/contact?…&reason=quote`, `availability` schema URL) and `BreadcrumbList`.
- [ ] `/products` page contains `CollectionPage` + `BreadcrumbList` JSON-LD scripts.
- [ ] `/collections/[slug]` page contains `CollectionPage` + `BreadcrumbList` JSON-LD scripts.
- [ ] With `services/api` stopped: `/products` renders empty grid + Persian fail-state copy (graceful), `/products/[slug]` renders the Persian 404 page (since `fetchProduct` returns null → `notFound()`), `/collections/[slug]` same.
- [ ] Keyboard: Tab from cold `/products` lands SkipLink → header → toolbar sort → mobile filter trigger (only `< md`) → first product card → … → footer. Filter form inputs are reachable in DOM order.
- [ ] No physical-direction Tailwind utilities anywhere in `apps/web/src/components/products/**` or `apps/web/src/components/collection/**` — `grep -RE '\b(m\|p\|text\|border)-(l\|r)-' apps/web/src/components/{products,collection}` → empty.
- [ ] No raw hex / rgb in those dirs.
- [ ] `apps/web/.env.example` documents `API_URL` + `SITE_URL`.
- [ ] `docs/state.md` updated: 3.2 ✅ with this commit hash; 3.3 / 3.4 / 4.1 entry notes updated to reflect available data layer + new collections; partial closures noted (FU-3.1-d partial — Product + BreadcrumbList + CollectionPage JSON-LD shipped; Org / WebSite remain 6.1); FU-2.3-d remains open (sale-price field exists in schema, not rendered); FU-3.1-b carries forward with updated rationale; FU-3.1-c carries forward; FU-3.1-m carries forward.
- [ ] Existing exit-check greps from 3.1 still pass.

## Follow-ups to log

- **FU-3.2-a** 3D media tab + `model3d` group on Products + `<model-viewer>` integration — Pkg 2+ per spec §12.4. PDP tabs gain a third option «سه‌بعدی».
- **FU-3.2-b** `productVariants` collection per spec §13 + variant picker in PurchasePanel — Pkg 2.
- **FU-3.2-c** "افزودن به سبد" CTA flip on `availability=in_stock` items — Pkg 2 commerce.
- **FU-3.2-d** Sale-price rendering on cards + PDP (`salePriceRials` field exists from this session, render not implemented). Carries forward FU-2.3-d + FU-2.3-h. Pkg 2.
- **FU-3.2-e** `weightKg` / `careInstructions` / `warrantyYears` on Products schema + PDP specs accordion sections. Add when CMS editors ask or care-page (4.2) needs cross-references.
- **FU-3.2-f** `seo` group on Products + Collections + Categories — Session 6.1.
- **FU-3.2-g** `status` / `publishedAt` / scheduling workflow on Products + Collections — carries forward FU-1.3-a; ships when a draft / preview workflow is needed.
- **FU-3.2-h** `categoryIds` tree expansion via `parentId` for nested category navigation in mega-menu (carries forward FU-2.2-a) and `/categories/[slug]` (4.2).
- **FU-3.2-i** `tagIds` filter facet on `/products`. Skipped this session (4 axes is enough); add when SEO tag landing pages need it.
- **FU-3.2-j** `reviews` collection per spec §26 + PDP reviews block — Pkg 3+.
- **FU-3.2-k** "در کارگاه" atelier imagery section on PDP — needs schema field for atelier media (separate from main `gallery`) or convention to draw atelier shots from a tagged subset. Add when atelier image library exists.
- **FU-3.2-l** Stock signal per nearest showroom on PDP — needs `commerce.stockLevels` collection (Pkg 3 per `data-schemas.md` §21).
- **FU-3.2-m** Lead-time text formatted as Jalali date («تحویل از ۱۵ اردیبهشت ۱۴۰۵») instead of «{n} روز کاری». Needs `addJalaliDays(today, leadTimeDays)` helper in `@zhic/locale`. Add when product is okay with the more-precise format.
- **FU-3.2-n** Persian 404 — extended once `/search` ships (Pkg 2+) to include search tile per `sitemap.md` §4.
- **FU-3.2-o** Promote PDP media-stage tab control to `<Tabs>` in `@zhic/ui` when a 2nd consumer appears (likely 4.2 atelier / care).
- **FU-3.2-p** Promote `priceBandLabel` + `sizeBandFromDimensions` + `parseSearchParams` from `apps/web/src/lib/products.ts` to `@zhic/locale` (or a new `@zhic/catalog` package) if a 2nd consumer (e.g. operator catalog UI) appears.
- **FU-3.2-q** Real product imagery + media uploads via Payload seed. Carries forward FU-3.1-f / FU-2.3-l.
- **FU-3.2-r** Materials data fully populated per spec §14 (`description`, `imageMediaId`, `careNotes`, `relatedArticleIds`). Today seed populates `name` + `slug` + `origin`; richer fields when client provides material content for material-detail pages (Pkg 2+ surface).
- **FU-3.2-s** `generateStaticParams` on `/products/[slug]` + `/collections/[slug]` — requires `services/api` running during `pnpm build`. CI / infra concern; lands with 7.1.
- **FU-3.2-t** Filter UI live-update (`onChange` autosubmit, debounced) + URL-only browser-history transitions. Today is explicit Apply button; live-update is a 6.2 polish concern.
- **FU-3.2-u** Mega-menu on «محصولات» wired to `categories` + `featured` collections. Carries forward FU-2.2-a.

## Deferred

- All FU-3.2-* listed above.
- FU-3.1-a (motion) → 6.2.
- FU-3.1-b (api-client promotion) → operator app outside `apps/web`.
- FU-3.1-c (richtext promotion) → 4.1 articles.
- FU-3.1-d (Org / WebSite JSON-LD) → 6.1 — **partially closed here** by Product + BreadcrumbList + CollectionPage JSON-LD.
- FU-3.1-e (revalidateTag webhook) → 7.1.
- FU-3.1-f (hero media seeding) → first real asset (carried by FU-3.2-q for product imagery).
- FU-3.1-l (Next/Image migration) → 7.1 + post-7.1 wiring.
- FU-3.1-m (`<Bleed>` primitive) → 4.1 articles likely.
- FU-3.1-q (sandbox no-postgres) — same constraint applies to 3.2 verification.

## Implementation notes (post-execution)

To be filled in after the session lands. Anticipated themes (based
on 3.1 retro):

- Sandbox limitation: seed not exercised end-to-end here; user
  verifies locally.
- Schema migration: `Products.materials` array dropped, replaced by
  `materialIds` relation. Any non-seed data would need a manual
  migration; today there's no such data.
- Possible Payload `where[group.subfield][operator]` quirks on the
  Postgres adapter (price-band gte/lt on `basePriceRials` is a
  scalar field so should be safe; categoryIds.slug / materialIds.slug
  filters are nested-relation queries that work in Postgres but may
  need empirical confirmation).
- JSON-LD validates locally via Google Rich Results Test; Bing /
  Yandex spot-check optional.
