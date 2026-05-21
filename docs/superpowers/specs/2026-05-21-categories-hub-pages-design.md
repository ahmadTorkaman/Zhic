# Categories Hub Pages — Design Spec

**Date:** 2026-05-21
**Branch:** TBD — likely `feat/categories-hub-pages` (new series)
**Status:** spec — implementation plan to follow via `superpowers:writing-plans`
**Closes:** none directly. Sub-project D of the broader products-overhaul effort. Sub-projects A (schema), B (xlsx import), C (PDP variant picker), E (/products filter rework) are separate specs.

---

## 0. Why this spec

The `/categories/[slug]` route exists today but is thin — `CollectionHero` (eyebrow + title), one-line description paragraph, paginated grid, pagination. There is no editorial copy, no internal linking, no SEO surface beyond title + description. With the xlsx-driven catalog overhaul, the Categories collection grows from 4 records to ~39 (7 parent groupings + 32 piece-type leaves), each meant to rank for distinct Persian search queries — generic ("تخت چوبی") at the parent level, specific ("آینه دیواری گردو") at the leaf level.

This spec turns `/categories/[slug]` into a **proper hub page** that captures those queries: editorial intro, auto-derived discovery callouts, designs-with-this-type cross-linking, sibling-category navigation, and (on leaves) a delicate right-side filter sidebar plus a mobile bottom-sheet drawer.

The same template handles both parent and leaf — the middle section swaps between a product grid (leaf) and a child-categories tile grid (parent). Filters and pagination appear only on leaves.

It deliberately **does not** cover:

- The Categories tree restructure itself (adding 7 parents above the 32 leaves) — handled by the schema/import sub-projects (A + B).
- The `productVariants` model — covered by sub-project C (PDP variant picker). This page works regardless of whether variants exist; auto-derived "sizes" callouts gracefully omit when no variants are seeded.
- `/products` filter rework — sub-project E. This page's filter sidebar is a separate, more delicate UI; the `/products` pill pattern is left untouched.
- `/categories` (no slug) index page — there is no `/categories` index route. Discovery happens via the mega-menu and the homepage. Not a spec gap; a deliberate omission.

---

## 1. Visual reference

Two interactive mockups live in the repo:

- **Leaf view** (`/categories/wall-mirror`): `apps/web/public/docs/category-leaf-mockup.html`
  served at `http://80.240.31.146:3000/docs/category-leaf-mockup.html`
- **Parent view** (`/categories/mirrors`): `apps/web/public/docs/category-parent-mockup.html`
  served at `http://80.240.31.146:3000/docs/category-parent-mockup.html`

Breadcrumbs in the mockups link between the two so you can navigate parent ↔ leaf.

### 1.1 Page anatomy

Numbered the same in both views; ⑤ and ⑦ are leaf-only.

```
① breadcrumb
② full-bleed hero (cover image + eyebrow + h1 + tagline overlay bottom-left)
③ intro richText (operator copy, ~100 words)
④ auto-callout strip (4 metric blocks: big-number + uppercase-tracked label)
⑤ filter chips area (leaf only — result count + active-filter pills)
   ⤷ desktop: companion right-side filter SIDEBAR (sticky, 280px)
   ⤷ mobile:  fixed bottom-pill filter TRIGGER → opens bottom-sheet DRAWER
⑥ middle section
   ⤷ leaf:   ProductGrid (4-col xl, 3-col md, 2-col sm, 1-col mobile) of products in this category
   ⤷ parent: ChildCategoriesGrid (same column counts) of leaves whose .parent === this
⑦ pagination (leaf only)
⑧ "★ designs that have this type" — auto-derived from products in this category → distinct design IDs
⑨ sibling-categories strip
   ⤷ leaf:   other leaves under the same parent
   ⤷ parent: other parents
```

### 1.2 Visual language

- **Full-bleed hero**: 21:9 desktop, 4:5 mobile. Image edge-to-edge. Bottom scrim + film-grain overlay. Title + tagline overlaid bottom-left. Parent hero gets a slightly darker tone gradient to signal "department".
- **Quiet card**: product tiles and child-category tiles share a single card treatment — cream wash background (`linear-gradient(180deg, #FCFBF7 0%, #F6F2EB 100%)`), 1px sand border at 55% opacity, **1px white-6%-inset top-edge highlight** as the only v14 glass cue (no `backdrop-filter`). Hover: `translateY(-4px)` + soft shadow expand. No scale change. Designed for borderless WebP product imagery — image floats centered inside the card with consistent padding.
- **Section headers** (`.sec-head`): eyebrow in forest, h2 title with `-0.02em` tracking, optional sub on the inline-end (count or "see all →" link). Always preceded by a 1px sand border.
- **Design cards** (section ⑧): keep the dramatic gradient + scrim + name-overlay treatment — they are brand surfaces, not product cards.
- **Sibling cards** (section ⑨): same quiet-card treatment as product tiles for consistency. Aspect 16/10 instead of 4/5 (more landscape-y, signals "category nav" not "product").

### 1.3 Animation

Text blocks fade up on scroll-into-view, matching the existing `BlurInText` component pattern: opacity 0 → 1 and `translateY(16px) → 0` over **700ms** on `cubic-bezier(0.22, 1, 0.36, 1)`, triggered by `IntersectionObserver` with `threshold: 0.15` and `rootMargin: '0px 0px -10% 0px'`.

**Animated:** hero eyebrow → title → tagline (staggered 90/220/400ms), intro paragraphs (120ms stagger), four callout blocks (90ms per block), every section header (eyebrow → title → sub at 0/80/160ms).

**Not animated:** product tiles, child-category tiles, sibling tiles, pagination, filter sidebar contents. Tiles already have hover lift; layering entrance animation is motion noise on a grid of identical units.

`prefers-reduced-motion: reduce` short-circuits all animation to instant-visible.

---

## 2. Schema changes — `services/api/src/collections/Categories.ts`

Add five new fields to the existing Categories collection. Position them after `description` and before `parent` so they read in editorial order in the admin UI.

```ts
{
  name: 'tagline',
  type: 'text',
  label: 'تک‌خطی شاعرانه',
  admin: {
    description: 'یک جمله کوتاه که زیر نام دسته‌بندی در hero نمایش داده می‌شود.',
  },
},
{
  name: 'cover',
  type: 'upload',
  relationTo: 'media',
  label: 'تصویر hero',
  admin: {
    description:
      'تصویر تمام‌عرض بالای صفحه. برای parent‌ها الزامی؛ برای leaf‌ها اختیاری — در صورت خالی بودن، اولین تصویر اولین محصول این دسته استفاده می‌شود.',
  },
  // Required validation enforced at hook level (see §2.2) because Payload's
  // built-in `required: true` can't be conditional on `parent === null`.
},
{
  name: 'intro',
  type: 'richText',
  label: 'مقدمه',
  admin: {
    description: '۲ تا ۳ پاراگراف کوتاه پس از hero. متن اصلی SEO صفحه. حدود ۱۰۰ کلمه.',
  },
},
{
  name: 'allowed_axes',
  type: 'text',
  hasMany: true,
  label: 'محورهای واریانت مجاز',
  admin: {
    description:
      'از xlsx برای leaf‌ها: size, footboard, doors, drawers, glass, width, pieces. برای parent‌ها خالی می‌ماند. مصرف اصلی این فیلد، ValidationDelay در ProductVariants است (سپک C) — این صفحه فقط callout‌ها را از آن استخراج می‌کند.',
  },
},
{
  name: 'rule',
  type: 'textarea',
  label: 'قواعد واریانت',
  admin: {
    description: 'از xlsx: یادداشت داخلی برای ادمین/seed درباره نحوه ساخت واریانت. روی صفحه‌ی عمومی نمایش داده نمی‌شود.',
  },
},
```

`seoFields` (already present) stays unchanged.

### 2.1 Migration

A new hand-written migration file: `services/api/src/migrations/<timestamp>_add_category_hub_fields.ts`. Five new columns on the `categories` table:

- `tagline` (varchar, nullable)
- `cover_id` (FK → media.id, nullable, `ON DELETE SET NULL`)
- `intro` (jsonb, nullable — Lexical document)
- `rule` (text, nullable)
- `allowed_axes` — Payload's `hasMany: true` text creates a child table `categories_allowed_axes` with `parent_id`, `order`, `value` columns. Migration adds that table.

Pattern mirrors `20260516_224611_add_design_editorial_fields.ts`. Follow the same workaround: hand-write the migration, register in `migrations/index.ts`, apply via direct pg, insert into `payload_migrations` table. `FU-7.1-c` (broken `pnpm migrate:create`) still applies.

`down()` drops the columns and the `categories_allowed_axes` table.

### 2.2 Parent-cover-required hook

Conditional required-on-parent enforcement lives in a `beforeValidate` hook on the Categories collection:

```ts
beforeValidate: [
  ({ data, operation }) => {
    if (operation === 'create' || operation === 'update') {
      const isParent = data?.parent == null;
      if (isParent && !data?.cover) {
        throw new ValidationError({
          collection: 'categories',
          errors: [{
            field: 'cover',
            message: 'برای دسته‌بندی parent، تصویر hero الزامی است.',
          }],
        });
      }
    }
    return data;
  },
],
```

Existing `beforeValidate` for `slugify(name)` stays — chain both hooks in the array.

### 2.3 Seed update

`services/api/src/seed.ts` extends each seeded category with the new fields. Sub-project B (xlsx import) writes the canonical seed; this spec only assumes seed populates `tagline`, `cover`, `intro` for AT LEAST the demo parent (`mirrors`) and the demo leaf (`wall-mirror`) so the new template renders meaningfully out of the box.

---

## 3. Architecture

### 3.1 Files added

| Path | Responsibility |
|---|---|
| `apps/web/src/app/(site)/categories/[slug]/page.tsx` | The route. Replaces the existing thin implementation. Async server component, branches on `category.parent === null` to render parent vs leaf composition. |
| `apps/web/src/components/category/CategoryHero.tsx` | Full-bleed hero with cover image, eyebrow, title, tagline overlay. Animation via `BlurInText` on the title + tagline. |
| `apps/web/src/components/category/CategoryIntro.tsx` | RichText renderer for `category.intro`. Constrained `max-w-[640px]` (leaf) or `max-w-[720px]` (parent — wider for longer copy). Thin wrapper around the existing rich-text serializer. |
| `apps/web/src/components/category/CategoryCallouts.tsx` | 4-block big-number + uppercase-label strip. Numbers derive from auto-fetched counts (see §3.3). Per-block fade-up via existing `BlurInText` or new `FadeUp` (see §5.6). |
| `apps/web/src/components/category/CategoryFilterSidebar.tsx` | Desktop right-side filter UI. Client component, owns URL-param state via `router.push`. Sections: sort, design, material, size (axes available for the category). |
| `apps/web/src/components/category/CategoryFilterTrigger.tsx` | Mobile bottom-fixed filter pill button with active-count badge. Opens `CategoryFilterSheet`. |
| `apps/web/src/components/category/CategoryFilterSheet.tsx` | Mobile bottom-sheet drawer. Same content as the sidebar, larger touch targets, reset/apply footer. Closes on backdrop tap, swipe-down, or Apply. |
| `apps/web/src/components/category/ChildCategoriesGrid.tsx` | Parent-view middle: grid of child-category tiles (cream-wash card + silhouette motif + name + count). |
| `apps/web/src/components/category/DesignsWithType.tsx` | Section ⑧. Renders 4 design cards with `DesignTile` from the existing design tile component (already shipped via `/designs/[slug]`). Empty-renders a single line if no designs found. |
| `apps/web/src/components/category/SiblingCategoriesStrip.tsx` | Section ⑨. 4 cards. Differs between parent and leaf only in what data is passed (parents-from-tree vs leaves-under-parent). |

### 3.2 Files modified

| Path | Change |
|---|---|
| `services/api/src/collections/Categories.ts` | Add the five new fields. Extend `beforeValidate` array with the parent-cover-required hook. |
| `services/api/src/migrations/index.ts` | Register the new migration. |
| `services/api/src/seed.ts` | Populate new fields on at least `mirrors` (parent) + `wall-mirror` (leaf). Full population is sub-project B. |
| `apps/web/src/lib/payload.ts` | Extend `PayloadCategory` type with `tagline?`, `cover?`, `intro?`, `allowed_axes?`, `rule?`. Add `fetchChildCategories`, `fetchSiblingCategories`, `fetchSiblingParents`, `fetchDesignsForCategory`. Existing `fetchCategory` extended with `depth: 2` so cover + parent inflate. |
| `apps/web/src/app/sitemap.ts` | Add per-category entries (parents and leaves) with `priority: 0.7, changefreq: monthly`. |
| `apps/web/src/app/(site)/categories/[slug]/page.tsx` | Total rewrite (existing version was the thin template). |
| `apps/web/public/docs/category-leaf-mockup.html` | Already shipped (this PR). Keep updated as the visual source-of-truth — if the design changes mid-implementation, the mockup updates too. |
| `apps/web/public/docs/category-parent-mockup.html` | Same as above. |
| `docs/state.md` | New Post-Phase row. Follow-ups `FU-CAT-*` logged (see §13). |

### 3.3 Data flow

```
/categories/<slug> request
  ├── fetchCategory(slug)  ─── depth: 2; inflates cover, parent, seo
  │   │
  │   └─ if not found → notFound()
  │
  └── after we know parent | leaf, parallel:
      ├── IF LEAF:
      │   ├── fetchProducts({ category: slug, page, design?, material?, size?, sort? })
      │   ├── fetchDesignsForCategory(slug)   ── two-step: products-in-category → distinct design IDs
      │   ├── fetchSiblingCategories(parentId, excludeId)
      │   ├── fetchAvailableDesigns(slug)     ── for filter sidebar options
      │   └── fetchAvailableMaterials(slug)   ── for filter sidebar options
      └── IF PARENT:
          ├── fetchChildCategories(this.id)
          ├── fetchDesignsForParentCategory(slug)
          └── fetchSiblingParents(excludeId)
```

All bundled in `Promise.all` after the initial `fetchCategory`. Total: **2 sequential round-trips** to Payload (`fetchCategory` → `Promise.all([...])`).

Caching: `payloadFetch`'s `next: { revalidate: 300, tags: ['categories', 'products', 'designs'] }` — same TTL as other catalog fetchers. On category update in Payload admin, hooks revalidate the `'categories'` tag.

**Designs-for-category** is the only nontrivial query — Payload REST can't do the join in one call. Two-step it in v1; defer the custom endpoint as `FU-CAT-a`. Cost: ~80ms extra latency on cold load. Acceptable given ISR.

---

## 4. Page composition — `apps/web/src/app/(site)/categories/[slug]/page.tsx`

### 4.1 Behavior

```ts
type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const sp = await searchParams;

  const category = await fetchCategory(slug);
  if (!category) notFound();

  const isLeaf = category.parent != null;
  const page = Number(sp.page) > 0 ? Number(sp.page) : 1;
  const design = typeof sp.design === 'string' ? sp.design : undefined;
  const material = typeof sp.material === 'string' ? sp.material : undefined;
  const size = typeof sp.size === 'string' ? sp.size : undefined;
  const sort = isValidSort(sp.sort) ? sp.sort : 'newest';

  const sideloads = isLeaf
    ? await Promise.all([
        fetchProducts({ category: slug, design, material, size, sort, page }),
        fetchDesignsForCategory(slug),
        fetchSiblingCategories(category.parent.id, category.id),
        fetchAvailableDesigns(slug),
        fetchAvailableMaterials(slug),
      ])
    : await Promise.all([
        fetchChildCategories(category.id),
        fetchDesignsForParentCategory(slug),
        fetchSiblingParents(category.id),
      ]);

  return (
    <>
      <CategoryHero category={category} />

      <div className="shell">
        <Breadcrumbs items={buildCrumbs(category)} />

        <div className={isLeaf ? 'layout layout--leaf' : 'layout layout--parent'}>
          <main className="main">
            <CategoryIntro intro={category.intro} variant={isLeaf ? 'leaf' : 'parent'} />
            <CategoryCallouts category={category} isLeaf={isLeaf} sideloads={sideloads} />

            {isLeaf ? (
              <LeafBody
                category={category}
                productsPage={sideloads[0]}
                availableDesigns={sideloads[3]}
                availableMaterials={sideloads[4]}
                designs={sideloads[1]}
                siblings={sideloads[2]}
                searchParams={sp}
              />
            ) : (
              <ParentBody
                children={sideloads[0]}
                designs={sideloads[1]}
                siblings={sideloads[2]}
              />
            )}
          </main>

          {isLeaf && (
            <aside className="sidebar">
              <CategoryFilterSidebar … />
            </aside>
          )}
        </div>
      </div>

      {isLeaf && <CategoryFilterTrigger activeCount={countActive(sp)} />}
      {isLeaf && <CategoryFilterSheet … />}
    </>
  );
}
```

`LeafBody` and `ParentBody` are colocated components in the same file; they're not exported anywhere else. They each render: middle section + (leaf only) pagination + designs section + siblings strip.

### 4.2 Breadcrumb chain

`buildCrumbs(category)` returns:

| Where | Crumb chain |
|---|---|
| Parent (e.g. `/categories/mirrors`) | خانه / محصولات / **آینه‌ها** |
| Leaf (e.g. `/categories/wall-mirror`) | خانه / محصولات / آینه‌ها / **آینه دیواری** |

The "محصولات" segment always links to `/products`. The parent segment on a leaf is clickable (`/categories/<parent.slug>`). Current segment is text, not a link.

`BreadcrumbList` JSON-LD emits the same chain — see §7.

### 4.3 generateMetadata

```ts
export async function generateMetadata({ params, searchParams }: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const sp = await searchParams;

  const category = await fetchCategory(slug);
  if (!category) return { title: 'یافت نشد' };

  // Filtered URLs are noindex; canonical always points to the unfiltered base.
  const filterParams = ['design', 'material', 'size', 'sort', 'page'];
  const hasFilters = filterParams.some(k => sp[k] !== undefined && sp[k] !== '');

  return buildMetadata({
    seo: category.seo,
    title: category.name,
    description: category.tagline ?? deriveDescriptionFromIntro(category.intro) ?? `${category.name} — مبلمان دست‌ساز ژیک`,
    path: `/categories/${slug}`,
    canonical: `/categories/${slug}`,  // always base, regardless of query params
    robots: hasFilters ? { index: false, follow: true } : undefined,
    openGraph: {
      title: category.name,
      description: category.tagline ?? undefined,
      images: category.cover?.url ? [{ url: category.cover.url }] : undefined,
    },
  });
}
```

Next 16 passes `searchParams` to `generateMetadata` the same way it does to the page component — as a `Promise` to await. No additional wiring needed.

### 4.4 JSON-LD

```jsonc
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "<category.name>",
  "description": "<tagline or intro snippet>",
  "url": "https://zhicwood.com/categories/<slug>",
  "image": "<cover.url>",
  "isPartOf": { "@type": "WebSite", "name": "ژیک", "url": "https://zhicwood.com" },
  "breadcrumb": { /* BreadcrumbList — see §7 */ }
}
```

Emit inline `<script type="application/ld+json">` from the page component. No external library required — match the pattern used in `/products/[slug]`.

---

## 5. Component contracts

### 5.1 `<CategoryHero>`

```ts
type CategoryHeroProps = {
  category: PayloadCategory;  // depth: 2, so cover is inflated
};
```

Renders:
- Full-bleed `<section.hero>` with the cover image as a CSS `background-image` (object-fit: cover) plus the bottom-scrim gradient and SVG film-grain overlay.
- Bottom-left text block: eyebrow (`دسته‌بندی`), optional parent-chain eyebrow on leaves (`آینه‌ها` for `wall-mirror`), `<h1>` for `category.name`, `<p>` for `category.tagline`.
- Eyebrow + title + tagline wrapped in `<BlurInText>` with staggered delays (`90 / 220 / 400` ms), so the hero animates on initial render.
- Mobile aspect 4:5; desktop 21:9.
- Cover fallback chain: `category.cover` → (on leaves only) first product's first gallery image → placeholder cream-to-sand gradient with «ژ» watermark.

### 5.2 `<CategoryIntro>`

```ts
type CategoryIntroProps = {
  intro: LexicalRoot | null;
  variant: 'leaf' | 'parent';
};
```

- `null` → returns `null` (whole section omitted from DOM).
- Leaf: `max-w-[640px]` body, 16px text size, line-height 1.85.
- Parent: `max-w-[720px]` body, 17px text size, line-height 1.9, **drop cap on first letter of first paragraph** (`::first-letter` rule, 1.8em + black weight).
- RichText serializer reuses `apps/web/src/lib/richtext.tsx` — same as the journal article body.
- Each paragraph wrapped in `<BlurInText>` for the come-up fade-in.

### 5.3 `<CategoryCallouts>`

```ts
type CategoryCalloutsProps = {
  category: PayloadCategory;
  isLeaf: boolean;
  sideloads: LeafSideloads | ParentSideloads;
};
```

Renders 4 callout blocks (big-number + uppercase-tracked label) with top + bottom 1px sand border. Counts come from sideloads — no separate query:

| Position | Leaf | Parent |
|---|---|---|
| 1 | `sideloads[0].totalDocs` (products) — label «محصول» | `sideloads[0].length` (children) — label «زیرنوع» |
| 2 | `sideloads[3].length` (available designs) — «طرح» | derived total products across children — «محصول» |
| 3 | derived from variant data (count of distinct size axis values for products in this category) — «اندازه» — **omits if no variant data** | derived designs count — «طرح» |
| 4 | `sideloads[4].length` (available materials) — «روکش چوب» | derived materials count — «روکش چوب» |

The "اندازه" callout on leaves depends on sub-project C (variants). If variants aren't seeded yet, the position-3 callout renders the count of materials instead (sliding down) — graceful degradation, no broken UI.

Each callout block wrapped in `<BlurInText>` with 90ms stagger.

### 5.4 `<CategoryFilterSidebar>`

```ts
type CategoryFilterSidebarProps = {
  categorySlug: string;
  activeFilters: { design?: string; material?: string; size?: string; sort: SortKey };
  availableDesigns: { name: string; slug: string; count: number }[];
  availableMaterials: { name: string; slug: string; count: number }[];
  availableSizes?: { value: string; label: string; count: number }[];  // from variants; optional
};
```

**Server component.** Owns no internal state — filters live in URL params. Each `<label.filter-opt>` renders as a `<Link>` whose `href` is the current URL with one query param mutated. Sort group is mutually exclusive (radio semantic); design/material/size groups support a single selection each in v1 (multi-select per group is `FU-CAT-d`). Active-state classes derive from comparing the current `searchParams` to each option's slug — no `useState` needed.

Section structure: sidebar-head (title + clear-all) + four `filter-group`s (sort / design / material / size). Slim custom scrollbar on overflow. Sticky positioning at `top: var(--header-height) + 24px`. Visible from `lg:` breakpoint (`>= 1024px`) up.

Reset behavior: "پاک کردن همه" navigates to `/categories/<slug>` (no query params).

### 5.5 `<CategoryFilterTrigger>` + `<CategoryFilterSheet>`

```ts
type CategoryFilterTriggerProps = { activeCount: number };
type CategoryFilterSheetProps = { /* same as CategoryFilterSidebar */ };
```

**Client components** (`'use client'`). Mobile-only (`< 1024px`) — hidden via media query at lg+. Trigger is fixed at `bottom: 16px`, centered, dark ink pill with forest active-count badge. The pair shares an `open` state via a small client-side store (Zustand-shape or a simple Context — implementation plan picks). On tap, the trigger sets `open: true` and the sheet's `transform` animates in.

Sheet behavior:
- Fixed full-width, anchored to `bottom: 0`, max-height `88vh`, slides up via `transform: translateY(100%) → 0` on `transform 350ms cubic-bezier(0.16, 1, 0.3, 1)`.
- Grip handle (44×4px sand-colored bar) centered at top.
- Head: title «فیلتر و مرتب‌سازی» + close ×.
- Body: same `filter-group` blocks as sidebar but larger touch targets (`padding: 11px 0`, `font-size: 15px`, check 20×20px).
- Foot: 2-col grid — `reset` (outline button, full-width on its column) + `apply` (filled ink button). `apply` closes the sheet but doesn't reset filters; the URL is already updated as the user toggles inside.
- Backdrop: dark 50% + blur(2px), tap to dismiss.
- `body.overflow: hidden` while open.

Swipe-down to dismiss (`FU-CAT-b`) — deferred. v1 dismisses via close button, backdrop tap, or apply.

### 5.6 `<BlurInText>` reuse + the come-up fade-up pattern

The mockup uses a vanilla CSS+JS port of `BlurInText`'s pattern (700ms cubic-bezier, IntersectionObserver, threshold 0.15). In implementation:

- **For Persian text blocks** that should reveal word-by-word (hero title, hero tagline, intro paragraphs): use `<BlurInText>` as-is. It splits on word boundaries internally.
- **For non-text DOM blocks** that need the same entrance (callout blocks, section headers as units): a new tiny `FadeUp` wrapper component:

```ts
// packages/ui/src/FadeUp.tsx
'use client';
import { useEffect, useRef, useState, type CSSProperties, type PropsWithChildren } from 'react';

export type FadeUpProps = PropsWithChildren<{
  delay?: number;
  className?: string;
  as?: 'div' | 'span' | 'section' | 'article';
}>;

export function FadeUp({ children, delay = 0, className, as: Tag = 'div' }: FadeUpProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { setVisible(true); io.unobserve(el); } }),
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const style: CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(16px)',
    transition: 'opacity 700ms cubic-bezier(0.22, 1, 0.36, 1), transform 700ms cubic-bezier(0.22, 1, 0.36, 1)',
    transitionDelay: `${delay}ms`,
    willChange: visible ? 'auto' : 'opacity, transform',
  };
  return <Tag ref={ref as never} className={className} style={style}>{children}</Tag>;
}
```

Export from `packages/ui/src/index.ts` alongside `BlurInText`. Used by `CategoryCallouts` (each callout block) and section header wrappers (eyebrow + title + sub). **NOT used on product tiles, child-category tiles, sibling tiles, or design cards** — see §1.3.

### 5.7 `<ChildCategoriesGrid>`

```ts
type ChildCategoriesGridProps = {
  children: PayloadCategory[];  // pre-fetched leaves whose .parent === this
};
```

Server-renderable. Grid `repeat(2,1fr)` mobile, `(3,1fr)` md, `(4,1fr)` xl. Each tile is a `<Link>` to `/categories/<child.slug>` with the quiet-card treatment (cream wash + 1px sand border + top-edge highlight) and a CSS-rendered silhouette motif keyed off the child's slug or a `category.silhouette` enum field (deferred — for v1 just use a default mirror-arch silhouette; `FU-CAT-e` adds per-child silhouettes).

Hover: card `translateY(-4px)` + shadow expand. No tile fade-up entrance (see §1.3).

Meta below the card: name (15px, 700) + count (11px stone) + arrow chevron. Count comes from a separate light query or is precomputed; v1 can fetch counts in a single `count by parent_id` GROUP BY query (sub-project A may already provide this — coordinate).

### 5.8 `<DesignsWithType>`

```ts
type DesignsWithTypeProps = {
  designs: PayloadDesign[];   // pre-fetched designs that have ≥1 product in this category
  contextLabel: string;        // "آینه دیواری" or "آینه" — used in section title
};
```

Renders section header (eyebrow «★ این نوع در» or «★ این دسته در» on parent variant + dynamic h2 «طرح‌هایی که <contextLabel> دارند») plus a 4-col strip of design cards. Each design card reuses the existing pattern from `apps/web/src/components/design/...` (already shipped via `/designs/[slug]`) — gradient + scrim + name overlay. Click → `/designs/<slug>`.

Empty state (0 designs): omit the entire section. Don't render a "no designs found" message — that surfaces a data problem and is noise.

### 5.9 `<SiblingCategoriesStrip>`

```ts
type SiblingCategoriesStripProps = {
  siblings: PayloadCategory[];
  variant: 'leaf' | 'parent';  // affects section header copy + sibling count formatting
};
```

4 sibling cards in a `repeat(4, 1fr)` grid (`repeat(2, 1fr)` on mobile). Quiet-card aspect 16/10. Each card: `<Link>` to `/categories/<sibling.slug>` with a category-name + count line below. Hover: same `translateY(-2px)` as product tiles.

Section header eyebrow: leaf → «دیگر <parent.name>» (e.g., «دیگر آینه‌ها»); parent → «دیگر دسته‌بندی‌ها». Optional sub link "همه‌ی <parent.name> ←" pointing to `/categories/<parent.slug>` (leaf only, since parent already shows all children in section ⑥).

Empty state: section omitted (no siblings = stand-alone parent or sole leaf under a parent — both rare).

---

## 6. SiteHeader rework (piggyback change)

**Cross-cutting change.** The mockup's pill header looks better than the live `apps/web/src/components/layout/SiteHeader.tsx` and the operator wants it adopted site-wide.

### 6.1 Grid change

Change `grid-template-columns` from `auto 1fr auto` to **`1fr auto 1fr`** with `justify-self: start / center / end` on brand / nav / icons respectively. Result: nav text sits at the mathematical center of the bar regardless of brand or icons widths.

### 6.2 SVG icons replace emoji

Replace any 🔍 / ♡ / similar emoji in the header with **stroke SVG icons** (`stroke-width: 1.5`, rounded line-caps, 18×18 viewBox 24×24). Wrap in 36×36 circular hover buttons that pick up a soft `rgba(232, 224, 216, 0.4)` background on hover and shift color from stone → ink.

Recommended icon set (inlined, not from a library): search (circle + diagonal line) and heart (closed outline). Adding more icons later requires hand-drawing them — no `lucide-react` etc. introduced in this PR.

### 6.3 Sticky logo underline

Keep the existing «ژیک» logo with a 2px forest underline at `bottom: -3px` extending `inset-inline: 4px`. Already matches the operator's locked memory (`feedback_zhic_mockups_match_live_site`).

### 6.4 Affected pages

ALL pages using `<SiteHeader>` — that's every public page. This change is **wider-blast-radius than this spec's nominal scope** and must be verified visually across home, /products, /products/[slug], /designs, /designs/[slug], /journal, /showrooms, /about. Acceptance criteria for the PR include "no visual regression on the other site pages."

---

## 7. SEO

### 7.1 Title + description

- Title: `<category.name>` (root layout appends « — ژیک»).
- Description: `category.tagline` → fallback `deriveDescriptionFromIntro(category.intro)` (first ~160 chars of plaintext from intro Lexical doc) → fallback `${category.name} — مبلمان دست‌ساز ژیک`.

### 7.2 Canonical

`alternates.canonical: /categories/<slug>` ALWAYS. Filtered URLs (`?design=...&material=...`) point canonical to the unfiltered base.

### 7.3 robots

- Base URL (no query params): default index + follow.
- Any URL with at least one filter query param (`design`, `material`, `size`, `sort`, `page > 1`): `<meta name="robots" content="noindex,follow">`.
- Page-only param: emitted by `generateMetadata` (Next 16 reads searchParams there) OR via a `<HeadInjection>` component in the body when that's simpler.

### 7.4 OG

`og:title` = name. `og:description` = tagline. `og:image` = `cover.url` (full URL via the existing `mediaUrl` helper). `og:type` = `website`. Inherit root site OG.

### 7.5 Structured data

Two JSON-LD `<script>` blocks emitted from the page body:

1. **`CollectionPage`** — schema.org type with `name`, `description`, `url`, `image`, `isPartOf` (WebSite).
2. **`BreadcrumbList`** — full breadcrumb chain (home → products → [parent] → [current]) with `itemListElement` array.

No `ItemList` of products in v1 — Google handles this fine without one for category pages, and it bloats payload. Add as `FU-CAT-c` if SEO research signals a benefit.

### 7.6 Sitemap

`apps/web/src/app/sitemap.ts` extends to include all categories (parents AND leaves):

```ts
const categories = await fetchAllCategories();  // new fetcher
const entries: MetadataRoute.Sitemap = categories.map(c => ({
  url: `${BASE}/categories/${c.slug}`,
  priority: c.parent ? 0.7 : 0.75,  // parents marginally higher than leaves
  changeFrequency: 'monthly',
  lastModified: c.updatedAt ? new Date(c.updatedAt) : undefined,
}));
```

Tagged `revalidate` so the sitemap re-renders when a category is added/published.

### 7.7 Persian + RTL hygiene (already enforced by CLAUDE.md)

- `<html lang="fa" dir="rtl">` — root layout already sets this.
- ZWNJ (U+200C) in all Persian display text — operator's responsibility on copy entry; spec doesn't enforce.
- ASCII slugs only — already enforced by the existing `slugify` hook.

---

## 8. Mobile layout

### 8.1 Breakpoints

- `< 768px` (mobile): hero aspect 4:5, 2-col grids (product, child, sibling) collapse to 1 or 2 cols depending on grid, no sidebar, bottom filter trigger visible.
- `768–1023px` (tablet): hero aspect 21:9, 3-col grids, **still no sidebar**, still bottom filter trigger. The sidebar appears only at `1024px+` (lg).
- `≥ 1024px` (desktop): two-column layout with `grid-template-columns: 1fr 280px`, sidebar sticky, bottom trigger hidden.

### 8.2 Filter sheet specifics

- Slides in over `350ms` with `cubic-bezier(0.16, 1, 0.3, 1)` (the same out-quint as v14).
- Body of underlying page gets `overflow: hidden` while open to prevent scroll bleed.
- Tapping a filter option in the sheet **immediately updates the URL** (and so the underlying page query/grid). The Apply button just closes the sheet — there's no "pending" state.
- Grip handle is decorative in v1; swipe-down gesture is `FU-CAT-b`.

### 8.3 Hero text scaling

- Title `clamp(40px, 6vw, 76px)` on leaves, `clamp(44px, 7vw, 88px)` on parents (bigger — signals department).
- Tagline `clamp(16px, 1.6vw, 20px)`.
- Hero text block sits at `bottom: clamp(24px, 6vw, 56px)` from the hero bottom edge.

---

## 9. Empty states + edge cases

| Case | Behavior |
|---|---|
| Category not found | `notFound()` → Next's app-router 404 boundary (existing Persian `/_not-found` page). |
| Leaf with 0 products | Render section ⑥ as a single-line «به‌زودی محصولات این دسته اضافه می‌شوند» centered, no grid, no pagination. Designs-section and siblings still render if data exists. |
| Parent with 0 children | Render section ⑥ as «به‌زودی زیرنوع‌ها افزوده می‌شوند». Should be rare — seed enforces children exist. |
| 0 designs found for category | Omit section ⑧ entirely (no header, no card row). |
| 0 sibling categories | Omit section ⑨. |
| Cover missing on leaf | Fallback chain (see §5.1): operator cover → first product's first gallery image → placeholder gradient + «ژ» watermark. |
| Cover missing on parent | Hook in §2.2 prevents publish; if somehow null in DB (manual SQL), placeholder gradient + «ژ». |
| Intro empty | `<CategoryIntro>` returns null; section omitted. |
| Tagline empty | Omit the `<p class="hero-tagline">` from the hero. Eyebrow + title still render. |
| `allowed_axes` empty | Position-3 callout (sizes) hides on leaves; the 4-callout strip falls back to 3 callouts. |
| Filter combination yields 0 products | Grid renders «هیچ محصولی با این فیلترها یافت نشد» + a "پاک کردن فیلترها" link (clears all params). Pagination omitted. |
| `?page=N` where N > totalPages | Redirect to `/categories/<slug>` (page 1, same other filters). Avoid 404 on pagination overshoot. |

---

## 10. Tests

### 10.1 Unit (Vitest)

- `fetchCategory`: shape assertion (new fields appear when populated; default to null when absent).
- `fetchDesignsForCategory`: two-step join produces distinct design IDs; mocks for `products` then `designs` queries.
- `fetchChildCategories`: filters by `parent.id`.
- `deriveDescriptionFromIntro`: extracts first 160 plain-text chars from a Lexical root; handles ZWNJ correctly.
- `buildCrumbs`: produces 3-item array for parents, 4-item array for leaves.
- `<CategoryIntro>` returns null for null/empty intro; renders drop cap on parent variant.
- `<CategoryCallouts>` graceful degradation when `availableSizes` is undefined.

### 10.2 Manual

- Open `/categories/mirrors` (parent) on desktop + mobile. Verify hero, intro with drop cap, 4 callouts, child grid, designs section, siblings (other parents), no filter UI.
- Open `/categories/wall-mirror` (leaf) on desktop. Verify everything plus the right-side filter sidebar. Toggle filters and confirm URL updates AND the grid re-fetches (server-side via `router.push`).
- Open the same leaf on mobile. Verify bottom-pill trigger with active count, tap → sheet slides up, toggle filter → URL updates + sheet stays open, close via backdrop / × / apply.
- Verify breadcrumb chain links: leaf's parent crumb → parent page; parent's products crumb → /products.
- Verify cover fallback by temporarily removing `cover` on a leaf — placeholder should render.
- Verify SEO meta in page source: title, description, canonical, robots, OG image, JSON-LD CollectionPage + BreadcrumbList.
- Verify `prefers-reduced-motion: reduce` — all `<BlurInText>` and `<FadeUp>` content visible instantly.
- Visual regression across other site pages — header still looks right on /, /products, /products/[slug], /designs, /journal, /showrooms, /about.

### 10.3 Smoke

```bash
curl -s -o /dev/null -w "/categories/mirrors → %{http_code}\n" http://localhost:3000/categories/mirrors
curl -s -o /dev/null -w "/categories/wall-mirror → %{http_code}\n" http://localhost:3000/categories/wall-mirror
curl -s -o /dev/null -w "/categories/wall-mirror?design=gandom → %{http_code}\n" "http://localhost:3000/categories/wall-mirror?design=gandom"
curl -s -o /dev/null -w "/categories/nonexistent → %{http_code}\n" http://localhost:3000/categories/nonexistent
curl -s -i "http://localhost:3000/categories/wall-mirror?design=gandom" | grep -i 'x-robots\|<meta name="robots"' | head
```

Expected: `200`, `200`, `200`, `404`, and a robots noindex on the filtered URL.

---

## 11. Acceptance criteria

The PR is done when all of these are true:

1. `/categories/mirrors` (parent) renders 200 with hero, intro (drop cap), 4 callouts, child-category grid, designs-with-this-type section, parent-siblings strip. No filter UI.
2. `/categories/wall-mirror` (leaf) renders 200 with hero, intro, 4 callouts, filter chips + active filter pills (if any), product grid, pagination, designs-with-this-type section, sibling-leaves strip. Right-side filter sidebar visible at ≥1024px.
3. `/categories/nonexistent` returns 404 via `notFound()`.
4. Filter URL params (`?design=`, `?material=`, `?size=`, `?sort=`, `?page=`) re-fetch and re-render the grid via server-side navigation. Active filter pills appear in the result bar.
5. Filtered URLs emit `<meta name="robots" content="noindex,follow">`; base URLs do not.
6. `alternates.canonical` always points to `/categories/<slug>` regardless of query params.
7. Mobile (< 1024px) shows the bottom filter trigger pill with active-count badge. Tapping it slides up the sheet. Toggling filters updates the URL.
8. Cover fallback works on leaves (operator cover → first product image → placeholder).
9. SiteHeader nav is mathematically centered (1fr / auto / 1fr grid). SVG icons in place of any emoji. No visual regression on /, /products, /products/[slug], /designs, /designs/[slug], /journal, /showrooms, /about.
10. Schema migration applies cleanly. New fields (`tagline`, `cover`, `intro`, `allowed_axes`, `rule`) editable in Payload admin. Parent-cover-required hook fires correctly.
11. Seed populates new fields on `mirrors` parent + `wall-mirror` leaf at minimum.
12. `BlurInText` + new `FadeUp` animate hero text, intro paragraphs, callout blocks, section headers. Reduced-motion respected.
13. JSON-LD `CollectionPage` + `BreadcrumbList` emit valid schema.org markup. Google Rich Results Test passes both.
14. Sitemap includes per-category entries (parents `priority: 0.75`, leaves `0.7`).
15. Typecheck, lint, build all clean.
16. `docs/state.md` updated; follow-ups `FU-CAT-*` logged.

---

## 12. Open decisions to confirm before implementation

Numbered so the implementation plan can ack each.

1. **Custom designs-for-category endpoint** — defer to `FU-CAT-a`, or build in v1? Recommendation: defer. Two-round-trip is fine at 5-min revalidate.
2. **Multi-select filter axes** — single-select per group in v1 (one design, one material); multi-select tracked as `FU-CAT-d`. OK?
3. **Per-child silhouettes** — v1 uses one default mirror-arch silhouette for all child cards; per-child SVG silhouettes tracked as `FU-CAT-e`. OK?
4. **Mobile sheet swipe-down dismiss** — defer to `FU-CAT-b`. OK?
5. **Robots meta source** — emit from `generateMetadata` (uses Next 16's searchParams) or from a `<HeadInject>` component inline. Pick during implementation; both work.

---

## 13. Follow-ups (out of scope, captured for `state.md`)

| Id | Item |
|---|---|
| `FU-CAT-a` | Custom Payload REST endpoint for designs-with-category join (`/api/categories/:slug/designs`). Replaces the two-step fetch with one round-trip. |
| `FU-CAT-b` | Mobile filter sheet swipe-down-to-dismiss gesture. |
| `FU-CAT-c` | `ItemList` JSON-LD inside `CollectionPage` if SEO research signals benefit. |
| `FU-CAT-d` | Multi-select filter axes (multiple designs, multiple materials) — needs URL-param schema rework (`?design=a,b,c`). |
| `FU-CAT-e` | Per-child SVG silhouettes on the parent ChildCategoriesGrid — `category.silhouette` enum field + SVG component map. |
| `FU-CAT-f` | Cover-image hero variant pick — admin can choose between "image-led", "asymmetric", or "centered" per category (`heroLayout` enum). Useful for categories where the cover photo lends itself to different compositions. |
| `FU-CAT-g` | Saved-filter URLs / shareable filter states with `<meta name="robots" content="index">` enabled per-combination after SEO research validates which combos warrant indexing. |
| `FU-CAT-h` | `prefetch` strategy for sibling-category cards — prefetch on hover, since users often navigate sibling → sibling. |
| `FU-CAT-i` | Parent page "featured product" strip — operator picks 4 hero products that cut across children. Was Option P2 from brainstorming; deferred to keep v1 lean. |

---

## 14. References

- Visual mockups (this PR):
  `apps/web/public/docs/category-leaf-mockup.html`
  `apps/web/public/docs/category-parent-mockup.html`
- Existing site header to be reworked: `apps/web/src/components/layout/SiteHeader.tsx`
- Animation component to reuse: `packages/ui/src/BlurInText.tsx`
- Sibling lookbook spec (pattern reference for editorial hub):
  `docs/superpowers/specs/2026-05-16-design-detail-page-design.md`
- Designs index spec (pattern reference for hub with sticky chrome):
  `docs/superpowers/specs/2026-05-17-designs-index-page-design.md`
- Categories collection today: `services/api/src/collections/Categories.ts`
- Categories page today: `apps/web/src/app/(site)/categories/[slug]/page.tsx`
- Spec context (data schemas):
  `docs/spec/data-schemas.md` §14 `categories`
  `docs/spec/sitemap.md` (URL templates)
  `docs/spec/seo.md` (structured data conventions)
- Operator memory:
  - `feedback_zhic_seo_priority` — SEO is top constraint
  - `project_zhic_products_overhaul` — locked architectural decisions for the products overhaul (this is sub-project D)
  - `feedback_zhic_luxury_restraint` — neutrals carry 95%; accent is earned
  - `feedback_zhic_mockups_match_live_site` — read live components first
- State board entry: `docs/state.md` — append Post-Phase row + FU-CAT-* follow-ups.
