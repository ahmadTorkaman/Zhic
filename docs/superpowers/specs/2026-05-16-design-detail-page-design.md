# Design Detail Page — Design Spec

**Date:** 2026-05-16
**Branch:** `feat/products-mega-menu` (continues — same series as the mega-menu, mobile chrome, and mobile menu work)
**Status:** spec — implementation plan to follow via `superpowers:writing-plans`
**Closes:** none directly. **Sets up but does not close** `FU-MM-a` (which is the separate `/designs` index page — out of scope for this spec).

---

## 0. Why this spec

The mega-menu (desktop and mobile) currently routes every «طرح» click to `/products?design=<slug>` — a filtered product grid. That works as a finder but treats designs as flat catalog filters. A design like گندم is more than "the products tagged with `design.slug=gandom`": it's a story, a silhouette philosophy, a chosen material, a target room. The operator wants a dedicated **lookbook page per design** — a proper introduction, with embedded animations and the full curated set — accessible at `/designs/<slug>`.

This spec covers the new `/designs/<slug>` route, the schema extensions on the `Designs` collection that support editorial content, and the mega-menu / mobile-menu link updates that point users at the new destination.

It deliberately **does not** cover:

- `/designs` index page — the listing of all designs. That stays as `FU-MM-a`.
- Materials section (derived or manual) — keeping the first ship lean. Materials already show in each product tile's meta line, and the story richText can reference them inline. Adding a dedicated row is `FU-DDP-a` (below).
- "Pair with" related designs cross-links — `FU-DDP-b`.
- Video / GIF carousel components beyond what the existing article `image-grid` and `video-embed` blocks already provide.
- Changes to the existing `/products?design=<slug>` filtered-list route — that route stays alive as an alternate URL. SEO canonical resolution and crawler hints are noted in §8 but no rewrite/redirect ships in v1.

---

## 1. Visual reference

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [site header chrome]                                                      │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│                    ┌───────────────────────────┐                          │
│                    │                            │                          │
│                    │      heroMedia (3/4)       │                          │
│                    │                            │                          │
│                    └───────────────────────────┘                          │
│                                                                            │
│                          طرح (eyebrow)                                    │
│                                                                            │
│                          گندم                                              │
│                                                                            │
│                  گرم، برای خواب کودکانه                                  │
│                                                                            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│           ┌──────────────────────────────────────┐                         │
│           │                                       │                         │
│           │   storyBlocks richText with inline    │                         │
│           │   image-grid / video-embed / pull-    │                         │
│           │   quote / material-ref blocks.        │                         │
│           │                                       │                         │
│           │   GIFs render as <img> with their     │                         │
│           │   own animation; "scrolling" through  │                         │
│           │   the story reveals them in turn.     │                         │
│           │                                       │                         │
│           └──────────────────────────────────────┘                         │
│                                                                            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│                          مجموعه (eyebrow)                                  │
│                                                                            │
│            ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                         │
│            │ p1   │  │ p2   │  │ p3   │  │ p4   │       ← ProductGrid     │
│            └──────┘  └──────┘  └──────┘  └──────┘                         │
│            ┌──────┐  ┌──────┐                                              │
│            │ p5   │  │ p6   │                                              │
│            └──────┘  └──────┘                                              │
│                                                                            │
├──────────────────────────────────────────────────────────────────────────┤
│ [site footer]                                                              │
└──────────────────────────────────────────────────────────────────────────┘
```

### 1.1 Hero treatment

Restrained gallery-book aesthetic. The hero is a constrained-width image (max-width ≈ 720px on desktop, full-width minus container padding on mobile) sitting at the top of the content column, with the eyebrow + name + tagline stacked centered BELOW it. No overlay text. No scrim. The artwork carries the page; the type is quiet.

### 1.2 Moodboard (conditional)

If `Designs.gallery` has 2+ entries, render a small moodboard row between the story and the set: a 2- or 3-column grid of those images. If `gallery.length < 2`, skip the section entirely. The moodboard is supplemental context, not a primary surface.

### 1.3 The Set

Products where `product.design.slug === <slug>`. Reuses the existing `<ProductGrid>` component (4-col xl / 3-col lg / 2-col sm / **1-col on mobile** — same as `/products`). If a design has zero products, render a single line «به‌زودی محصولات این طرح اضافه می‌شود.» (no empty grid).

---

## 2. Schema changes — `services/api/src/collections/Designs.ts`

Add three fields to the existing `Designs` collection. Position them after the existing `description` field for logical reading order in the admin UI.

```ts
{
  name: 'tagline',
  type: 'text',
  label: 'شعار طرح',
  admin: {
    description: 'یک جمله‌ی کوتاه و گویا که زیر نام طرح در صفحه‌ی اختصاصی نمایش داده می‌شود.',
  },
},
{
  name: 'heroMedia',
  type: 'upload',
  relationTo: 'media',
  label: 'تصویر اصلی صفحه',
  admin: {
    description: 'تصویر ابتدای صفحه‌ی طرح (متفاوت از گالری). در صورت خالی بودن، اولین تصویر گالری استفاده می‌شود.',
  },
},
{
  name: 'storyBlocks',
  type: 'richText',
  label: 'داستان طرح',
  editor: lexicalEditor({
    features: ({ rootFeatures }) => [
      ...rootFeatures,
      BlocksFeature({ blocks: [pullQuoteBlock, imageGridBlock, videoEmbedBlock, materialRefBlock] }),
    ],
  }),
  admin: {
    description: 'متن بلند با امکان درج تصویر، ویدیو/گیف، نقل قول و ارجاع به متریال.',
  },
},
```

`pullQuoteBlock`, `imageGridBlock`, `videoEmbedBlock`, `materialRefBlock` are already defined in `services/api/src/collections/Articles.ts`. Extract them into `services/api/src/lib/richTextBlocks.ts` so both Articles and Designs import the same set. (This refactor is included in this spec because Designs is the second consumer; the extraction is justified now.)

`lexicalEditor` import is the standard Payload pattern already used by Articles.

### 2.1 Migration

```bash
pnpm --filter @zhic/api migrate:create add-design-editorial-fields
pnpm --filter @zhic/api migrate
```

Three new columns on the `designs` table:
- `tagline` (varchar, nullable)
- `hero_media_id` (FK → media.id, nullable)
- `story_blocks` (jsonb, nullable — Lexical document)

No data loss. All new columns are nullable; existing seed rows continue to work.

### 2.2 Seed update

`services/api/src/seed.ts` already populates designs with `name`, `slug`, `age_group`, etc. Add to the existing گندم row (or the first seeded design):

```ts
{
  name: 'گندم',
  slug: 'gandom',
  age_group: 'infant',
  featured: true,
  tagline: 'گرم، برای خواب کودکانه',
  heroMedia: gandomHeroMediaId,  // existing media seed
  storyBlocks: {
    root: {
      type: 'root',
      version: 1,
      children: [
        { type: 'paragraph', version: 1, children: [{ type: 'text', text: 'متن نمونه کوتاه برای داستان طرح گندم...' }] },
      ],
    },
  },
},
```

Mirror this for the second seeded design (آرامش). Both get a tagline + sample storyBlocks. heroMedia can reuse one of the gallery images already seeded.

---

## 3. Architecture

### 3.1 Files added

| Path | Responsibility |
|---|---|
| `apps/web/src/app/(site)/designs/[slug]/page.tsx` | The route. Async server component, fetches design + products, composes the page from the components below. |
| `apps/web/src/components/design/DesignHero.tsx` | The centered-image-plus-title hero. Takes `{ heroMedia, name, tagline, eyebrow }`. |
| `apps/web/src/components/design/DesignStory.tsx` | RichText renderer for `storyBlocks`. Thin wrapper around the existing `<ArticleRichText>` from `apps/web/src/lib/richtext.tsx` (which already understands the four block types). |
| `apps/web/src/components/design/DesignMoodboard.tsx` | Conditional 2-3 col grid for `Designs.gallery`. Skipped if `length < 2`. |
| `services/api/src/lib/richTextBlocks.ts` | Extract `pullQuoteBlock`, `imageGridBlock`, `videoEmbedBlock`, `materialRefBlock` from `Articles.ts` so Designs can import them too. |

### 3.2 Files modified

| Path | Change |
|---|---|
| `services/api/src/collections/Designs.ts` | Add `tagline`, `heroMedia`, `storyBlocks` fields. Import shared block definitions from `lib/richTextBlocks.ts`. |
| `services/api/src/collections/Articles.ts` | Replace inline block definitions with imports from `lib/richTextBlocks.ts`. No behavior change. |
| `services/api/src/seed.ts` | Populate the new fields on seeded designs. |
| `apps/web/src/lib/payload.ts` | Extend `PayloadDesign` type with `tagline?`, `heroMedia?`, `storyBlocks?`. Add `fetchDesign(slug)` fetcher (mirrors existing `fetchProduct`). |
| `apps/web/src/components/layout/ProductsMegaMenu.tsx` | `DesignsPanel` link href changes from `/products?design=${slug}` to `/designs/${slug}`. |
| `apps/web/src/components/layout/MobileMenu.tsx` | `DesignsSection` link href changes from `/products?design=${slug}` to `/designs/${slug}`. |
| `docs/state.md` | New Post-Phase row, no FU-MM-a closure. New FUs FU-DDP-a..e logged. |

### 3.3 Data flow

```
/designs/<slug> request
  ├── fetchDesign(slug)          ── single design (id, name, slug, tagline, heroMedia, storyBlocks, gallery, age_group, ...)
  └── fetchProducts({ design: slug })  ── the set (existing fetcher; design filter was added during the mega-menu work)
        │
        ▼
  <DesignHero> + <DesignStory> + <DesignMoodboard> + <ProductGrid>
```

Two parallel calls in `Promise.all` like other pages.

---

## 4. Page composition — `apps/web/src/app/(site)/designs/[slug]/page.tsx`

### 4.1 Behavior

- Reads `params.slug`.
- Calls `Promise.all([fetchDesign(slug), fetchProducts({ design: slug, page: 1 })])`.
- If `design` is `null` (not found), calls `notFound()`.
- Renders:
  1. Breadcrumb «خانه / <name>» (the `/designs` index doesn't exist, so the middle breadcrumb is the design name itself, not a link to a designs root).
  2. `<DesignHero heroMedia={design.heroMedia ?? design.gallery?.[0] ?? null} name={design.name} tagline={design.tagline ?? null} eyebrow="طرح" />`
  3. `<DesignStory blocks={design.storyBlocks ?? null} />` — only renders if `storyBlocks` is non-empty (skip the section entirely if null).
  4. `<DesignMoodboard images={design.gallery ?? []} />` — internally checks `length >= 2`.
  5. `<section>` with eyebrow «مجموعه», then `<ProductGrid products={products.docs} />`. Empty-state line if no products.

### 4.2 generateMetadata

```ts
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const design = await fetchDesign(slug);
  if (!design) return { title: 'یافت نشد' };
  return {
    title: design.name,
    description: design.tagline ?? `طرح ${design.name} — مبلمان دست‌ساز ژیک`,
    alternates: { canonical: `/designs/${design.slug}` },
    openGraph: {
      title: design.name,
      description: design.tagline ?? undefined,
      images: design.heroMedia?.url ? [{ url: design.heroMedia.url }] : undefined,
    },
  };
}
```

### 4.3 JSON-LD

Skip in v1. Designs don't fit a standard schema.org type cleanly (they're a brand-internal concept). If SEO research signals a benefit later, log as `FU-DDP-c`.

---

## 5. Components — interface contracts

### 5.1 `<DesignHero>`

```ts
type DesignHeroProps = {
  heroMedia: PayloadMedia | null;
  name: string;
  tagline: string | null;
  eyebrow: string; // always "طرح" for now; pass-through to allow override
};
```

Render: centered image (max-w-[720px]) with aspect 3/4 (or natural aspect if the image happens to fit), then under it a centered text column with eyebrow + h1 + lead-style tagline. Mobile: image is full-width minus container padding. If `heroMedia` is null, render only the text block (no placeholder image — luxury restraint).

### 5.2 `<DesignStory>`

```ts
type DesignStoryProps = {
  blocks: LexicalRoot | null;
};
```

Returns `null` if `blocks` is null or empty. Otherwise renders within a centered 680px column (matches journal article body) using `<ArticleRichText>` from `apps/web/src/lib/richtext.tsx`. That helper already handles the four block types and the standard paragraph/heading/blockquote nodes. No new richtext logic needed.

### 5.3 `<DesignMoodboard>`

```ts
type DesignMoodboardProps = {
  images: PayloadMedia[];
};
```

Returns `null` if `images.length < 2`. Otherwise renders a 2-col mobile / 3-col desktop grid of `<PayloadImage>` tiles, aspect 1/1 each, with rounded-md corners and gap-[var(--space-4)]. No captions in v1.

---

## 6. fetchDesign

```ts
// apps/web/src/lib/payload.ts

export async function fetchDesign(slug: string): Promise<PayloadDesign | null> {
  const params = new URLSearchParams({
    'where[slug][equals]': slug,
    depth: '2',  // inflate heroMedia + gallery + any block-level media
    limit: '1',
  });
  const res = await payloadFetch<PayloadList<PayloadDesign>>(
    `/api/designs?${params.toString()}`,
    'design',
  );
  return res?.docs[0] ?? null;
}
```

Existing `PayloadDesign` type gets three new optional fields:

```ts
export type PayloadDesign = {
  id: string | number;
  name: string;
  slug: string;
  age_group?: 'infant' | 'child' | 'teen' | 'adult' | null;
  description?: LexicalRoot | null;
  gallery?: PayloadMedia[] | null;
  featured?: boolean | null;
  basePriceRials?: number | null;
  tagline?: string | null;          // new
  heroMedia?: PayloadMedia | null;  // new
  storyBlocks?: LexicalRoot | null; // new
};
```

---

## 7. Mega-menu + mobile menu link updates

### 7.1 `apps/web/src/components/layout/ProductsMegaMenu.tsx`

In `DesignsPanel`, find:

```tsx
<Link href={`/products?design=${encodeURIComponent(d.slug)}`}>
```

Replace with:

```tsx
<Link href={`/designs/${encodeURIComponent(d.slug)}`}>
```

### 7.2 `apps/web/src/components/layout/MobileMenu.tsx`

In `DesignsSection`, find:

```tsx
href={`/products?design=${encodeURIComponent(d.slug)}`}
```

Replace with:

```tsx
href={`/designs/${encodeURIComponent(d.slug)}`}
```

### 7.3 The filtered-list URL stays alive

`/products?design=<slug>` continues to work — the `q`/`design` filters on `/products` (added in the mega-menu work) are unchanged. This means:

- A bookmark to `/products?design=gandom` still loads the filtered grid.
- Internal site links should prefer `/designs/<slug>` (the lookbook) for casual browsing.
- External crawlers that find `/products?design=<slug>` see the grid; canonical via `alternates.canonical` on the products page tells them to prefer the canonical query-less `/products` URL. No conflict with `/designs/<slug>`'s canonical.

---

## 8. SEO

- `<title>` is the design name.
- `<meta description>` is the tagline (or fallback if empty).
- `alternates.canonical: /designs/<slug>` — explicit canonical to avoid duplicate-content scoring against `/products?design=<slug>`.
- OG image: `heroMedia.url` if available, otherwise inherits the root OG image.
- No structured data in v1 (see §4.3).
- Sitemap: extend `apps/web/src/app/sitemap.ts` to list all designs at `/designs/<slug>` with `priority: 0.7, changefreq: monthly` (mirrors the journal article entries).

---

## 9. Tests

### 9.1 Unit (Vitest)

- `fetchDesign` shape: mock the underlying `payloadFetch` to return a list with one design; assert the returned object matches `PayloadDesign`. Mock failure case → returns `null`.
- `DesignMoodboard.shouldRender(images)` pure helper: `length < 2` → returns false. Optional extraction; skip if it makes the component noisier.

### 9.2 Manual

- Open `/designs/gandom` on a phone and desktop.
- Verify: hero image centers, eyebrow «طرح» on top, name big, tagline lead-style. No overlay text on image.
- Verify: story renders if seeded. GIFs (if any) animate naturally inside the rich text.
- Verify: moodboard appears only when gallery has ≥ 2 images.
- Verify: products grid below shows only products with `design.slug === gandom`.
- Verify: «خانه / گندم» breadcrumb (no /designs root link).
- Verify: tapping a design item from the mega-menu (desktop) lands on `/designs/<slug>` (not `/products?design=`).
- Verify: tapping a design item from the mobile menu lands on `/designs/<slug>`.
- Verify: `/products?design=gandom` still works (the alternate URL is preserved).
- Verify: design with no products renders the «به‌زودی...» line, not an empty grid.

### 9.3 Smoke

```bash
curl -s -o /dev/null -w "/designs/gandom → %{http_code}\n" http://localhost:3000/designs/gandom
curl -s -o /dev/null -w "/designs/nonexistent → %{http_code}\n" http://localhost:3000/designs/nonexistent
curl -s -o /dev/null -w "/products?design=gandom → %{http_code}\n" "http://localhost:3000/products?design=gandom"
```

Expected: `200`, `404`, `200`.

---

## 10. Acceptance criteria

1. New route `/designs/<slug>` exists and renders 200 for seeded designs.
2. `/designs/<nonexistent>` returns 404 via Next's `notFound()`.
3. Hero shows centered image (or text-only if no heroMedia), eyebrow «طرح», name, tagline.
4. Story richText renders when populated; section omits silently when not.
5. Moodboard renders only when `Designs.gallery.length >= 2`.
6. Products grid below shows products filtered by `design.slug`.
7. Empty-state line «به‌زودی...» when no products.
8. Mega-menu DesignsPanel and MobileMenu DesignsSection both link to `/designs/<slug>`.
9. `/products?design=<slug>` still works (no redirect, no break).
10. Schema migration applied cleanly; no data loss on existing designs.
11. Seed updated; both seeded designs have tagline + storyBlocks populated.
12. Typecheck, lint, build all clean.
13. SEO metadata (title, description, canonical, OG image) populated from design fields.
14. Sitemap includes `/designs/<slug>` for each design.
15. `docs/state.md` updated.

---

## 11. Follow-ups (out of scope)

| Id (proposed) | Item |
|---|---|
| `FU-DDP-a` | Materials section on the design page (derived from product materialIds OR manual `materialCallouts` relation). Add when editor research signals a need. |
| `FU-DDP-b` | "Pair with" related designs cross-links — schema relation + section at bottom of the page. |
| `FU-DDP-c` | Structured data — explore if any schema.org type fits ("CollectionPage", "CreativeWork"?). |
| `FU-DDP-d` | `/designs` index listing all designs as a lookbook grid. Carries forward `FU-MM-a`. |
| `FU-DDP-e` | Hero treatment alternates — option to switch a specific design to full-bleed or split layout via a `heroLayout` enum. Per-design design control. |
| `FU-DDP-f` | Editorial blocks unique to designs that don't fit the article block set — e.g., a "scale chart" or "fabric callout" block. |

---

## 12. References

- Spec parent: `docs/superpowers/specs/2026-05-16-products-dropdown-mega-menu-design.md` (introduced the `design` filter on `/products` and the mega-menu design surface)
- Mobile-menu spec: `docs/superpowers/specs/2026-05-16-mobile-products-menu-design.md` (the source of the DesignsSection link)
- Existing pattern: `docs/superpowers/specs/...` for the journal article page — same `ArticleRichText` + `BlocksFeature` pattern reused here
- Designs schema (today): `services/api/src/collections/Designs.ts`
- Articles BlocksFeature setup (to be extracted): `services/api/src/collections/Articles.ts` lines around the BlocksFeature config
- State board entry: `docs/state.md` — `FU-MM-a` (related but not closed by this spec)
