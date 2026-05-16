# Design Detail Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dedicated lookbook page per design (طرح) at `/designs/<slug>` — centered-image hero, story richText with embedded animations, optional moodboard, and the full product set below. Update mega-menu and mobile menu to route DesignsPanel items to the new page.

**Architecture:** Extend the `Designs` Payload collection with three editorial fields (`tagline`, `heroMedia`, `storyBlocks`). Extract the existing richText block definitions out of `Articles.ts` into a shared module so Designs and Articles both consume them. Web side adds one route, one fetcher, and three new components. Mega-menu / mobile-menu link hrefs flip from `/products?design=` to `/designs/`. The `/products?design=` URL stays alive as a filtered-grid alternate (no redirect).

**Tech Stack:** Payload 3, Postgres (workspace docker `zhic-pg`), Next.js 16, React 19, TypeScript, Tailwind v4, Vitest. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-05-16-design-detail-page-design.md`
**Closes:** none directly (sets up but does not close `FU-MM-a` — the `/designs` index page is a follow-up `FU-DDP-d`).

---

## File structure

### Files created

| Path | Responsibility |
|---|---|
| `services/api/src/lib/richTextBlocks.ts` | Shared Lexical block definitions (`PullQuoteBlock`, `ImageGridBlock`, `VideoEmbedBlock`, `ProductEmbedBlock`, `MaterialRefBlock`). Imported by Articles + Designs. |
| `services/api/src/migrations/<timestamp>-add-design-editorial-fields.ts` | Payload-generated migration. Adds `tagline` + `hero_media_id` + `story_blocks` columns to the `designs` table. |
| `apps/web/src/app/(site)/designs/[slug]/page.tsx` | The new route. Async server component. |
| `apps/web/src/components/design/DesignHero.tsx` | Centered-image hero + name + tagline + eyebrow. |
| `apps/web/src/components/design/DesignStory.tsx` | Renders `storyBlocks` via existing `ArticleRichText` helper. Null-safe wrapper. |
| `apps/web/src/components/design/DesignMoodboard.tsx` | 2- or 3-col grid of `Designs.gallery` images. Gated on `images.length >= 2`. |

### Files modified

| Path | Change |
|---|---|
| `services/api/src/collections/Articles.ts` | Replace inline block defs with imports from `lib/richTextBlocks.ts`. No behavior change. |
| `services/api/src/collections/Designs.ts` | Add `tagline`, `heroMedia`, `storyBlocks` fields. Import 4 blocks from shared module. |
| `services/api/src/seed.ts` | Populate the new fields on the two seeded designs (گندم, آرامش). |
| `apps/web/src/lib/payload.ts` | Extend `PayloadDesign` type. Add `fetchDesign(slug)` fetcher. |
| `apps/web/src/components/layout/ProductsMegaMenu.tsx` | DesignsPanel link href: `/products?design=` → `/designs/`. |
| `apps/web/src/components/layout/MobileMenu.tsx` | DesignsSection link href: same flip. |
| `apps/web/src/app/sitemap.ts` | Add a loop emitting `/designs/<slug>` entries. |
| `docs/state.md` | Post-Phase row, FU-DDP-a..f logged, Snapshot updated. |

---

## Notes for the implementer

- **Payload migrations:** Run from `services/api`. The repo has `pnpm migrate:create` and `pnpm migrate` scripts (per `state.md` 7.1). Migration tooling: `tsx scripts/migrate.mts`. Postgres must be reachable (workspace docker `zhic-pg` is running per pm2 zhic-api).
- **API admin restart:** After changing collection schemas, restart `pm2 zhic-api` so Payload picks up the new field set: `pm2 restart zhic-api`.
- **Re-seeding vs admin update:** The seed script populates the new fields for new database state. For testing the page on the EXISTING workspace DB (which already has seeded designs without the new fields), the simplest path is to update the seeded designs via Payload admin UI at `http://localhost:3001/admin` after running the migration. Re-seeding requires a DB reset, which is heavier and not necessary for this PR's testing.
- **`ArticleRichText` reuse:** `apps/web/src/lib/richtext.tsx` exports `ArticleRichText` (added during the Phase 4.1 journal work). It already handles the four block types Designs uses (pull-quote, image-grid, video-embed, material-ref). It also handles the product-embed block, but Designs doesn't enable that block, so it just won't render.
- **`/products?design=<slug>` is preserved.** Do not add a redirect from the filtered-list URL to the new design page. Both URLs are valid.
- **No new dependencies.** Don't reach for `@testing-library/react` (not installed). Manual smoke is the verification path.

---

## Task 1: Branch baseline

**Files:** None modified.

- [ ] **Step 1: Verify branch + clean tree**

```bash
git -C /home/ahmad/Zhic branch --show-current
git -C /home/ahmad/Zhic status --short
git -C /home/ahmad/Zhic log --oneline -3
```

Expected:
- Branch: `feat/products-mega-menu`
- Status: clean
- Top commit is `64fcbd3 docs(spec): design detail page` (or a later commit if user added anything)

If not on `feat/products-mega-menu`, run `git checkout feat/products-mega-menu`.

- [ ] **Step 2: Baseline tests + typecheck**

```bash
pnpm --filter @zhic/web test
pnpm --filter @zhic/web typecheck
pnpm --filter @zhic/api typecheck
```

Expected: web tests 50/50 pass, both typechecks clean.

- [ ] **Step 3: Verify pm2 services running**

```bash
pm2 list | grep -E "zhic-(web|api)"
```

Expected: both `zhic-web` and `zhic-api` show `online`.

No commit — verification only.

---

## Task 2: Extract richText blocks into shared module

**Files:**
- Create: `services/api/src/lib/richTextBlocks.ts`
- Modify: `services/api/src/collections/Articles.ts`

This is a refactor with zero behavior change. It moves the 5 existing Lexical block definitions out of `Articles.ts` and into a shared file so Designs can import them.

- [ ] **Step 1: Create the shared module**

Create `/home/ahmad/Zhic/services/api/src/lib/richTextBlocks.ts`:

```ts
import type { Block } from 'payload'

export const PullQuoteBlock: Block = {
  slug: 'pull-quote',
  labels: { singular: 'نقل قول', plural: 'نقل قول‌ها' },
  fields: [
    { name: 'quote', type: 'textarea', required: true, label: 'متن نقل قول' },
    { name: 'attribution', type: 'text', label: 'منبع' },
  ],
}

export const ImageGridBlock: Block = {
  slug: 'image-grid',
  labels: { singular: 'گالری تصاویر', plural: 'گالری‌ها' },
  fields: [
    {
      name: 'images',
      type: 'array',
      label: 'تصاویر',
      minRows: 2,
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true, label: 'تصویر' },
        { name: 'caption', type: 'text', label: 'توضیح' },
      ],
    },
    {
      name: 'columns',
      type: 'select',
      defaultValue: '2',
      label: 'تعداد ستون',
      options: [
        { label: '۲ ستون', value: '2' },
        { label: '۳ ستون', value: '3' },
      ],
    },
  ],
}

export const VideoEmbedBlock: Block = {
  slug: 'video-embed',
  labels: { singular: 'ویدیو', plural: 'ویدیوها' },
  fields: [
    { name: 'url', type: 'text', required: true, label: 'آدرس ویدیو' },
    { name: 'caption', type: 'text', label: 'توضیح' },
  ],
}

export const ProductEmbedBlock: Block = {
  slug: 'product-embed',
  labels: { singular: 'محصول', plural: 'محصولات' },
  fields: [
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true,
      label: 'محصول',
    },
  ],
}

export const MaterialRefBlock: Block = {
  slug: 'material-ref',
  labels: { singular: 'متریال', plural: 'متریال‌ها' },
  fields: [
    {
      name: 'material',
      type: 'relationship',
      relationTo: 'materials',
      required: true,
      label: 'متریال',
    },
  ],
}
```

- [ ] **Step 2: Update Articles.ts to import the shared blocks**

In `/home/ahmad/Zhic/services/api/src/collections/Articles.ts`:

Find the import section near the top:

```ts
import type { Block, CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { BlocksFeature } from '@payloadcms/richtext-lexical'
import { slugify } from '../lib/slugify'
import { publishedContentAccess, isEditorField } from '../lib/access'
import { seoFields } from '../fields/seoFields'
```

Replace with (drop the `Block` type since it's no longer needed, add the block imports):

```ts
import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { BlocksFeature } from '@payloadcms/richtext-lexical'
import { slugify } from '../lib/slugify'
import { publishedContentAccess, isEditorField } from '../lib/access'
import { seoFields } from '../fields/seoFields'
import {
  PullQuoteBlock,
  ImageGridBlock,
  VideoEmbedBlock,
  ProductEmbedBlock,
  MaterialRefBlock,
} from '../lib/richTextBlocks'
```

Then delete the entire inline block-definitions section. Find this block:

```ts
// --- Custom Lexical blocks for article body --------------------------------

const PullQuoteBlock: Block = {
  slug: 'pull-quote',
  ...
}

const ImageGridBlock: Block = {
  slug: 'image-grid',
  ...
}

const VideoEmbedBlock: Block = {
  slug: 'video-embed',
  ...
}

const ProductEmbedBlock: Block = {
  slug: 'product-embed',
  ...
}

const MaterialRefBlock: Block = {
  slug: 'material-ref',
  ...
}
```

Delete that entire region (from the `// --- Custom Lexical blocks for article body` comment header through the closing brace of `MaterialRefBlock`).

The `lexicalEditor` config below already references the constants by name (`PullQuoteBlock`, etc.); those references now resolve to the imports. No further changes in this file.

- [ ] **Step 3: Verify api typecheck clean**

```bash
pnpm --filter @zhic/api typecheck
```

Expected: 0 errors. The block constants are now imported instead of inlined.

- [ ] **Step 4: Commit**

```bash
git -C /home/ahmad/Zhic add services/api/src/lib/richTextBlocks.ts services/api/src/collections/Articles.ts
git -C /home/ahmad/Zhic commit -m "refactor(api): extract Lexical blocks from Articles into lib/richTextBlocks for reuse"
```

---

## Task 3: Extend Designs schema + migration + seed

**Files:**
- Modify: `services/api/src/collections/Designs.ts`
- Create: `services/api/src/migrations/<timestamp>-add-design-editorial-fields.ts` (Payload-generated)
- Modify: `services/api/src/seed.ts`

- [ ] **Step 1: Extend the Designs collection**

In `/home/ahmad/Zhic/services/api/src/collections/Designs.ts`:

Find the imports at the top:

```ts
import type { CollectionConfig } from 'payload'
import { slugify } from '../lib/slugify'
import { publishedContentAccess } from '../lib/access'
```

Replace with:

```ts
import type { CollectionConfig } from 'payload'
import { lexicalEditor, BlocksFeature } from '@payloadcms/richtext-lexical'
import { slugify } from '../lib/slugify'
import { publishedContentAccess } from '../lib/access'
import {
  PullQuoteBlock,
  ImageGridBlock,
  VideoEmbedBlock,
  MaterialRefBlock,
} from '../lib/richTextBlocks'
```

(Note: 4 blocks, not 5 — Designs skips `ProductEmbedBlock` since designs already show their product set at the bottom of the page.)

Find the existing `description` field in the `fields` array:

```ts
    {
      name: 'description',
      type: 'richText',
      label: 'توضیحات',
    },
```

Insert THREE new fields immediately after the `description` field (before the existing `gallery` field):

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
          BlocksFeature({
            blocks: [
              PullQuoteBlock,
              ImageGridBlock,
              VideoEmbedBlock,
              MaterialRefBlock,
            ],
          }),
        ],
      }),
      admin: {
        description: 'متن بلند با امکان درج تصویر، ویدیو/گیف، نقل قول و ارجاع به متریال.',
      },
    },
```

- [ ] **Step 2: Verify api typecheck clean**

```bash
pnpm --filter @zhic/api typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Generate the migration**

```bash
pnpm --filter @zhic/api migrate:create add-design-editorial-fields
```

Expected: Payload writes a new migration file at `services/api/src/migrations/<timestamp>-add-design-editorial-fields.ts`. The file contains an `up()` that adds the three new columns and a `down()` that drops them.

If the migration tool errors with "Postgres not reachable" or similar, restart the api process first: `pm2 restart zhic-api`. Then retry.

- [ ] **Step 4: Apply the migration**

```bash
pnpm --filter @zhic/api migrate
```

Expected: Output reports the new migration was applied successfully. Three new columns now exist on the `designs` table: `tagline` (text), `hero_media_id` (integer FK to media), `story_blocks` (jsonb).

If a column already exists (someone applied an earlier draft), the migration will fail. Diagnose with `psql -d zhic -c '\d designs'` inside the docker container if needed.

- [ ] **Step 5: Restart `zhic-api` so Payload sees the new field set**

```bash
pm2 restart zhic-api
until curl -sf -o /dev/null http://localhost:3001/admin; do sleep 0.5; done
```

Expected: admin endpoint responds 200 after restart.

- [ ] **Step 6: Update seed.ts**

In `/home/ahmad/Zhic/services/api/src/seed.ts`, find the design entries. There should be two: گندم (gandom) and آرامش (aramesh). Add the new fields to each.

For گندم:

```ts
{
  name: 'گندم',
  slug: 'gandom',
  age_group: 'infant',
  featured: true,
  tagline: 'گرم، برای خواب کودکانه',
  // heroMedia and storyBlocks set after media seed completes; see hook below
},
```

For آرامش:

```ts
{
  name: 'آرامش',
  slug: 'aramesh',
  age_group: 'adult',
  featured: true,
  tagline: 'سکونی برای بازگشت به خانه',
  // heroMedia and storyBlocks set after media seed completes
},
```

Add the `tagline` field to both inline. Leave `heroMedia` and `storyBlocks` for now — they require media IDs and a Lexical document, both of which are set in a second pass against the seeded designs. If the existing seed script does a two-pass approach (create then update with relations), follow the same pattern. If it's single-pass, just leave `heroMedia` and `storyBlocks` unset in the seed — the page-side handles their absence gracefully and the operator can populate via admin.

The exact pattern depends on the seed's existing structure. Read `services/api/src/seed.ts` to find the design-creation section and adapt.

- [ ] **Step 7: Verify api typecheck still clean**

```bash
pnpm --filter @zhic/api typecheck
```

Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
git -C /home/ahmad/Zhic add services/api/src/collections/Designs.ts services/api/src/migrations/ services/api/src/seed.ts
git -C /home/ahmad/Zhic commit -m "feat(api/designs): add tagline + heroMedia + storyBlocks fields + migration + seed taglines"
```

The committed migration file is what other environments (review tier, prod) will apply. The seed update keeps the script in sync with the schema even though the workspace's existing DB rows still lack the editorial content (operator populates via admin for now).

---

## Task 4: Extend `PayloadDesign` type + add `fetchDesign`

**Files:**
- Modify: `apps/web/src/lib/payload.ts`

- [ ] **Step 1: Extend the `PayloadDesign` type**

In `/home/ahmad/Zhic/apps/web/src/lib/payload.ts`, find the existing `PayloadDesign` type:

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
};
```

Replace with:

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
  /** Short lead sentence shown under the design name on /designs/<slug>. */
  tagline?: string | null;
  /** Hero image for /designs/<slug>. Falls back to gallery[0] if null. */
  heroMedia?: PayloadMedia | null;
  /** Long-form editorial story with embedded media blocks. */
  storyBlocks?: LexicalRoot | null;
};
```

- [ ] **Step 2: Add `fetchDesign` function**

In the same file, find `fetchProduct` (around line 580). Below it, add a new `fetchDesign` function:

```ts
export async function fetchDesign(
  slug: string,
): Promise<PayloadDesign | null> {
  const params = new URLSearchParams({
    'where[slug][equals]': slug,
    depth: '2',
    limit: '1',
  });
  const res = await payloadFetch<PayloadList<PayloadDesign>>(
    `/api/designs?${params.toString()}`,
    'design',
  );
  return res?.docs[0] ?? null;
}
```

- [ ] **Step 3: Verify typecheck clean**

```bash
pnpm --filter @zhic/web typecheck
```

Expected: 0 errors.

- [ ] **Step 4: Smoke-test the endpoint**

```bash
curl -s "http://localhost:3001/api/designs?where%5Bslug%5D%5Bequals%5D=gandom&depth=2&limit=1" | head -c 400; echo
```

Expected: a JSON response starting with `{"docs":[{"id":...,"name":"گندم","slug":"gandom",...}` if گندم is seeded, or `{"docs":[]` if no design with that slug exists.

- [ ] **Step 5: Commit**

```bash
git -C /home/ahmad/Zhic add apps/web/src/lib/payload.ts
git -C /home/ahmad/Zhic commit -m "feat(web/payload): PayloadDesign extension + fetchDesign for /designs/<slug>"
```

---

## Task 5: Build 3 new components (DesignHero, DesignStory, DesignMoodboard)

**Files:**
- Create: `apps/web/src/components/design/DesignHero.tsx`
- Create: `apps/web/src/components/design/DesignStory.tsx`
- Create: `apps/web/src/components/design/DesignMoodboard.tsx`

- [ ] **Step 1: Create `DesignHero.tsx`**

Create `/home/ahmad/Zhic/apps/web/src/components/design/DesignHero.tsx`:

```tsx
import { PayloadImage } from '@/components/PayloadImage';
import type { PayloadMedia } from '@/lib/payload';

export type DesignHeroProps = {
  heroMedia: PayloadMedia | null;
  name: string;
  tagline: string | null;
  eyebrow: string;
};

export function DesignHero({ heroMedia, name, tagline, eyebrow }: DesignHeroProps) {
  return (
    <section className="flex flex-col items-center gap-8 pb-12 pt-[calc(var(--header-height)+var(--space-5))]">
      {heroMedia ? (
        <div className="w-full max-w-[720px]">
          <PayloadImage
            media={heroMedia}
            alt={name}
            fallbackText="تصویر به‌زودی"
          />
        </div>
      ) : null}

      <div className="flex max-w-[680px] flex-col items-center gap-3 px-4 text-center">
        <p className="text-eyebrow font-bold uppercase tracking-[var(--tracking-eyebrow-wide)] text-forest">
          {eyebrow}
        </p>
        <h1 className="text-h1 font-black text-ink">{name}</h1>
        {tagline ? (
          <p className="text-lead font-light leading-[var(--leading-lead)] text-stone">
            {tagline}
          </p>
        ) : null}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create `DesignStory.tsx`**

Create `/home/ahmad/Zhic/apps/web/src/components/design/DesignStory.tsx`:

```tsx
import { ArticleRichText } from '@/lib/richtext';
import type { LexicalRoot } from '@/lib/payload';

export type DesignStoryProps = {
  blocks: LexicalRoot | null;
};

export function DesignStory({ blocks }: DesignStoryProps) {
  // Skip the section wrapper entirely when there's no content.
  // ArticleRichText also returns null internally, but the wrapper would still
  // render an empty <section> with padding, which we don't want.
  if (!blocks?.root?.children?.length) return null;

  return (
    <section className="mx-auto w-full max-w-[680px] px-4 pb-12">
      <ArticleRichText value={blocks} />
    </section>
  );
}
```

`ArticleRichText` (signature confirmed in `apps/web/src/lib/richtext.tsx:319`) accepts `{ value: LexicalRoot | null | undefined; embeds?: EmbedContext }`. It already null-checks internally and returns null when empty — the outer wrapper's null-guard exists to also skip the surrounding `<section>` padding when there's no content to show.

- [ ] **Step 3: Create `DesignMoodboard.tsx`**

Create `/home/ahmad/Zhic/apps/web/src/components/design/DesignMoodboard.tsx`:

```tsx
import { PayloadImage } from '@/components/PayloadImage';
import type { PayloadMedia } from '@/lib/payload';

export type DesignMoodboardProps = {
  images: PayloadMedia[];
};

export function DesignMoodboard({ images }: DesignMoodboardProps) {
  // Single-image gallery looks like a forgotten upload; require ≥ 2 for the section to feel intentional.
  if (images.length < 2) return null;

  return (
    <section
      aria-label="moodboard"
      className="mx-auto w-full max-w-[var(--container-storefront)] px-4 pb-12 lg:px-6"
    >
      <ul className="grid grid-cols-2 gap-[var(--space-4)] lg:grid-cols-3">
        {images.map((img) => (
          <li key={img.id} className="overflow-hidden rounded-md">
            <PayloadImage
              media={img}
              alt={img.alt ?? ''}
              fallbackText="تصویر"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 4: Verify typecheck clean**

```bash
pnpm --filter @zhic/web typecheck
```

Expected: 0 errors. If `ArticleRichText` doesn't export from `@/lib/richtext`, check the export name and adjust. If the prop name differs (`content` vs alternative), fix the call site.

- [ ] **Step 5: Commit**

```bash
git -C /home/ahmad/Zhic add apps/web/src/components/design/
git -C /home/ahmad/Zhic commit -m "feat(web/design): DesignHero + DesignStory + DesignMoodboard components"
```

---

## Task 6: Build `/designs/[slug]/page.tsx` + sitemap entry

**Files:**
- Create: `apps/web/src/app/(site)/designs/[slug]/page.tsx`
- Modify: `apps/web/src/app/sitemap.ts`

- [ ] **Step 1: Create the route**

Create `/home/ahmad/Zhic/apps/web/src/app/(site)/designs/[slug]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { Container, Breadcrumbs } from '@zhic/ui';
import { DesignHero } from '@/components/design/DesignHero';
import { DesignStory } from '@/components/design/DesignStory';
import { DesignMoodboard } from '@/components/design/DesignMoodboard';
import { ProductGrid } from '@/components/product/ProductGrid';
import { fetchDesign, fetchProducts } from '@/lib/payload';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
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

export default async function DesignDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [design, productsPage] = await Promise.all([
    fetchDesign(slug),
    fetchProducts({ design: slug, page: 1 }),
  ]);

  if (!design) {
    notFound();
  }

  const heroMedia = design.heroMedia ?? design.gallery?.[0] ?? null;
  const moodboardImages = design.gallery ?? [];

  return (
    <>
      <Container>
        <div className="pt-[calc(var(--header-height)+var(--space-5))]">
          <Breadcrumbs items={[{ label: 'خانه', href: '/' }, { label: design.name }]} />
        </div>
      </Container>

      <DesignHero
        heroMedia={heroMedia}
        name={design.name}
        tagline={design.tagline ?? null}
        eyebrow="طرح"
      />

      <DesignStory blocks={design.storyBlocks ?? null} />

      <DesignMoodboard images={moodboardImages} />

      <Container>
        <section aria-label="مجموعه" className="pb-16">
          <p className="mb-5 text-eyebrow font-bold uppercase tracking-[var(--tracking-eyebrow-wide)] text-forest">
            مجموعه
          </p>
          {productsPage.docs.length === 0 ? (
            <p className="py-9 text-center text-stone">به‌زودی محصولات این طرح اضافه می‌شود.</p>
          ) : (
            <ProductGrid products={productsPage.docs} />
          )}
        </section>
      </Container>
    </>
  );
}
```

- [ ] **Step 2: Add sitemap entries**

In `/home/ahmad/Zhic/apps/web/src/app/sitemap.ts`, find the existing dynamic-route loop (it should already loop over `fetchAllShowrooms`, `fetchArticles`, `fetchProducts`, etc.).

Add a designs fetch and a corresponding URL map alongside the existing dynamic entries. The exact integration depends on the existing structure — read the file and find the pattern. Add a new helper or extend the existing list.

The added entry should look like:

```ts
const designs = (await fetchAllDesigns()).map((d) => ({
  url: `${BASE_URL}/designs/${d.slug}`,
  lastModified: new Date(),
  changeFrequency: 'monthly' as const,
  priority: 0.7,
}));
```

This requires a new `fetchAllDesigns` helper. Add it to `apps/web/src/lib/payload.ts`:

```ts
export async function fetchAllDesigns(): Promise<PayloadDesign[]> {
  const res = await payloadFetch<PayloadList<PayloadDesign>>(
    '/api/designs?limit=100&sort=name&depth=0',
    'designs',
  );
  return res?.docs ?? [];
}
```

(`depth=0` is fine — sitemap only needs slugs.)

Insert this near `fetchDesign` (added in Task 4).

In `sitemap.ts`, add the import:

```ts
import { fetchAllDesigns } from '@/lib/payload';
```

And include the `designs` array in the final returned list (alongside `products`, `articles`, etc.).

- [ ] **Step 3: Verify typecheck + build clean**

```bash
pnpm --filter @zhic/web typecheck
pnpm --filter @zhic/web build
```

Expected: 0 errors. Build succeeds.

- [ ] **Step 4: Commit**

```bash
git -C /home/ahmad/Zhic add "apps/web/src/app/(site)/designs/" apps/web/src/app/sitemap.ts apps/web/src/lib/payload.ts
git -C /home/ahmad/Zhic commit -m "feat(web/designs): /designs/[slug] route + sitemap entry + fetchAllDesigns"
```

---

## Task 7: Update mega-menu + mobile menu links

**Files:**
- Modify: `apps/web/src/components/layout/ProductsMegaMenu.tsx`
- Modify: `apps/web/src/components/layout/MobileMenu.tsx`

Two link-href flips. Both files currently route DesignsPanel items to `/products?design=<slug>`. Flip to `/designs/<slug>`.

- [ ] **Step 1: Update ProductsMegaMenu**

In `/home/ahmad/Zhic/apps/web/src/components/layout/ProductsMegaMenu.tsx`, find:

```tsx
<Link href={`/products?design=${encodeURIComponent(d.slug)}`}>
```

Replace with:

```tsx
<Link href={`/designs/${encodeURIComponent(d.slug)}`}>
```

- [ ] **Step 2: Update MobileMenu**

In `/home/ahmad/Zhic/apps/web/src/components/layout/MobileMenu.tsx`, find:

```tsx
href={`/products?design=${encodeURIComponent(d.slug)}`}
```

Replace with:

```tsx
href={`/designs/${encodeURIComponent(d.slug)}`}
```

- [ ] **Step 3: Verify typecheck clean**

```bash
pnpm --filter @zhic/web typecheck
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git -C /home/ahmad/Zhic add apps/web/src/components/layout/ProductsMegaMenu.tsx apps/web/src/components/layout/MobileMenu.tsx
git -C /home/ahmad/Zhic commit -m "feat(web/nav): mega-menu + mobile menu designs items route to /designs/<slug>"
```

---

## Task 8: Build + restart + smoke + manual verify

**Files:** None modified.

- [ ] **Step 1: Build + restart pm2**

```bash
pnpm --filter @zhic/web build
pm2 restart zhic-web
until curl -sf -o /dev/null http://localhost:3000/; do sleep 0.5; done
```

Expected: build succeeds, pm2 reports online, root URL returns 200.

- [ ] **Step 2: Smoke 3 URLs**

```bash
curl -s -o /dev/null -w "/designs/gandom → %{http_code}\n" http://localhost:3000/designs/gandom
curl -s -o /dev/null -w "/designs/nonexistent → %{http_code}\n" http://localhost:3000/designs/nonexistent
curl -s -o /dev/null -w "/products?design=gandom → %{http_code}\n" "http://localhost:3000/products?design=gandom"
```

Expected: `200`, `404`, `200`.

- [ ] **Step 3: HTML probes**

```bash
curl -s http://localhost:3000/designs/gandom | grep -oE 'aria-label="moodboard"|طرح|مجموعه|گندم' | sort -u | head -10
```

Expected: at least `طرح` (eyebrow), `گندم` (name), `مجموعه` (set eyebrow) appear in the SSR'd HTML. `aria-label="moodboard"` only appears if the seeded design has ≥ 2 gallery images.

- [ ] **Step 4: Verify the mega-menu link**

```bash
curl -s http://localhost:3000/ | grep -oE 'href="/designs/[^"]+"' | sort -u | head -5
```

Expected: at least one `href="/designs/<slug>"` appears (from the rendered ProductsMegaMenu).

- [ ] **Step 5: Manual verify on a browser**

Open `http://80.240.31.146:3000/designs/gandom` on a phone and desktop:

1. Hero: centered image (or text only if no heroMedia is set on this design in the workspace DB), eyebrow «طرح» on top, name «گندم» big, tagline below (if populated).
2. Story section: renders if storyBlocks is populated; quietly absent otherwise.
3. Moodboard: renders if gallery has ≥ 2 images.
4. The Set: products grid below. If گندم has products (`design.slug === gandom`), they appear. Otherwise the «به‌زودی...» line shows.
5. Breadcrumb: «خانه» (linked) → «گندم» (not linked).
6. From mega-menu: tap «طرح‌ها» → tap «گندم» → lands on `/designs/gandom`.
7. From mobile menu: tap hamburger → محصولات → tap a design → lands on `/designs/<slug>` (not `/products?design=`).
8. `/products?design=gandom` directly typed in browser → still works (filtered grid).

Per the task scope, the workspace DB may not have تagline/heroMedia/storyBlocks populated. The page should render gracefully with just name + breadcrumb + products grid in that case.

To get a richer test, populate at least one design via Payload admin at `http://80.240.31.146:3001/admin`:
- Open `Designs > گندم`
- Fill `tagline` with «گرم، برای خواب کودکانه» 
- Pick a `heroMedia` from existing media
- Add a paragraph to `storyBlocks`
- Save
- Refresh `/designs/gandom`

No commit — verification only.

---

## Task 9: Update `docs/state.md`

**Files:** Modify: `docs/state.md`.

- [ ] **Step 1: Add a Post-Phase enhancements row**

Find the `### Post-Phase enhancements` section. Add this row beneath the existing rows (after `Mobile products menu`):

```markdown
| Design detail page | ✅ | (PR HEAD) | New `/designs/[slug]` lookbook route. Designs collection extended with `tagline` + `heroMedia` + `storyBlocks` (richText with 4 embedded block types — pull-quote, image-grid, video-embed, material-ref — extracted from Articles into shared `services/api/src/lib/richTextBlocks.ts`). Mega-menu + mobile menu now route DesignsPanel/Section items to `/designs/<slug>` instead of `/products?design=`. The filtered-list URL stays alive as an alternate. Sets up but doesn't close FU-MM-a (the `/designs` index page is logged as FU-DDP-d). Spec: `docs/superpowers/specs/2026-05-16-design-detail-page-design.md`. Plan: `docs/superpowers/plans/2026-05-16-design-detail-page.md`. |
```

- [ ] **Step 2: Append FU-DDP-a through FU-DDP-f at the end of the Follow-ups table**

Find the last row of the Follow-ups table (should be `FU-MM-c6` from the mobile menu work). Add these 6 rows after:

```markdown
| FU-DDP-a | DDP | Materials section on the design page (derived from product materialIds OR manual `materialCallouts` relation). Add when editor research signals a need. |
| FU-DDP-b | DDP | "Pair with" related designs cross-links — schema relation + section at bottom of the page. |
| FU-DDP-c | DDP | Structured data — explore if any schema.org type fits ("CollectionPage", "CreativeWork"?). |
| FU-DDP-d | DDP | `/designs` index listing all designs as a lookbook grid. Carries forward FU-MM-a. |
| FU-DDP-e | DDP | Hero treatment alternates — option to switch a specific design to full-bleed or split layout via a `heroLayout` enum. Per-design design control. |
| FU-DDP-f | DDP | Editorial blocks unique to designs that don't fit the article block set — e.g., a "scale chart" or "fabric callout" block. |
```

- [ ] **Step 3: Update the Snapshot table's Current session**

Find the `Current session` row. Replace with:

```markdown
| Current session | Design detail page (`/designs/<slug>`) shipped on `feat/products-mega-menu`. Designs collection now carries editorial fields. Mega-menu + mobile menu route to the new lookbook URL. Branch now has: products mega-menu (FU-2.2-a/FU-3.2-u closed), mobile floating-island chrome, mobile two-state menu (FU-MM-c closed), design detail pages. |
```

Keep `Last updated | 2026-05-16` unchanged.

- [ ] **Step 4: Verify**

```bash
grep -n "Design detail page\|FU-DDP-a\|FU-DDP-f\|Current session" /home/ahmad/Zhic/docs/state.md | head -10
```

Expected: Post-Phase row visible, 6 new FU-DDP rows visible, updated Current session row visible.

- [ ] **Step 5: Commit**

```bash
git -C /home/ahmad/Zhic add docs/state.md
git -C /home/ahmad/Zhic commit -m "docs(state): design detail page shipped — log 6 follow-ups + Post-Phase row"
```

---

## Task 10: Push to origin

**Files:** None modified.

- [ ] **Step 1: Verify clean tree**

```bash
git -C /home/ahmad/Zhic status --short
```

Expected: no output.

- [ ] **Step 2: Push**

```bash
git -C /home/ahmad/Zhic push
```

Expected: ~7 new commits pushed to `origin/feat/products-mega-menu`.

- [ ] **Step 3: Show branch state**

```bash
git -C /home/ahmad/Zhic log --oneline staging..HEAD | head -10
```

Expected: the new commits from Tasks 2–9 visible at the top, on top of the prior mobile-menu + mega-menu work.

- [ ] **Step 4: STOP — do not create a PR.**

Per the repo pattern, operator opens PRs themselves. Branch is pushed and ready for review.

---

## Spec coverage matrix

| Spec § | Requirement | Task |
|---|---|---|
| §0 | Scope cuts documented | Plan §"Notes for the implementer" |
| §1 | Visual layout (centered hero, story, moodboard, set) | Tasks 5 + 6 |
| §2 | Designs schema extensions | Task 3 |
| §2.1 | Migration applied | Task 3 |
| §2.2 | Seed update | Task 3 |
| §3.1 | New files created | Tasks 2 + 5 + 6 |
| §3.2 | Files modified | Tasks 2, 3, 4, 6, 7, 9 |
| §3.3 | Data flow (fetchDesign + fetchProducts in parallel) | Task 6 |
| §4.1 | Page composition (hero, story, moodboard, set, breadcrumb) | Task 6 |
| §4.2 | generateMetadata | Task 6 |
| §4.3 | JSON-LD skipped in v1 | Plan §"Notes" + Task 9 (FU-DDP-c) |
| §5.1 | DesignHero | Task 5 |
| §5.2 | DesignStory | Task 5 |
| §5.3 | DesignMoodboard with length ≥ 2 gate | Task 5 |
| §6 | fetchDesign + PayloadDesign extension | Task 4 |
| §7.1 | Mega-menu link update | Task 7 |
| §7.2 | Mobile menu link update | Task 7 |
| §7.3 | `/products?design=` stays alive | Tasks 7 + 8 (smoke confirms 200) |
| §8 | SEO (canonical, OG, sitemap entry) | Tasks 6 |
| §9 | Tests (unit + manual + smoke) | Task 8 |
| §10 | 15 acceptance criteria | Tasks 6 + 8 |
| §11 | Follow-ups FU-DDP-a..f | Task 9 |

---

## Out of scope (captured as FU-DDP-* in `state.md`)

- Materials section on the design page → `FU-DDP-a`
- "Pair with" related designs → `FU-DDP-b`
- Structured data / JSON-LD → `FU-DDP-c`
- `/designs` index page → `FU-DDP-d` (carries forward FU-MM-a)
- Per-design hero layout alternates → `FU-DDP-e`
- Design-specific editorial blocks → `FU-DDP-f`
