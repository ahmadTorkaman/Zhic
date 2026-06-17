# Bedroom-furniture Index — CMS Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the redesigned `/bedroom-furniture` root page CMS-driven via a new `bedroom-furniture` global — editable hero copy/image, a curated showcase of Categories (with per-card arch art), curated room cards, and the showcase copy — replacing the hardcoded `SEED`.

**Architecture:** A new Payload `bedroom-furniture` global holds scalar hero/showcase copy + `heroMedia` (FK column) + two arrays: `showcase` (`{ category: relationship→categories, archImage: upload→media }`) and `rooms` (`{ name, display, image: upload→media, href }`). A *single* relationship/upload subfield inside an array becomes a **FK column on the array table** (the proven `home_hero_slides.image_id` / `designs_occupancy_media.image_id` pattern) — so **no `_rels` table**. The web `getBedroomFurnitureContent()` fetches the global at `depth=2`, maps `showcase[].category`→`{label, href}` + `archImage`→`img`, maps `rooms[]`, and falls back to the existing `SEED` when unconfigured. `BedroomHero` + `CategoryShowcase`'s heading get parameterized (defaults = the current hardcoded values).

**Tech Stack:** Payload 3 (Postgres adapter), Next.js 16 / React 19, TypeScript 5, Vitest, pnpm + Turborepo.

---

## Design summary (folded in — no separate spec doc)

- The `/bedroom-furniture` **root** is 100% static (`getBedroomFurnitureContent` returns `SEED`; zero Payload). The `/bedroom-furniture/[...slug]` catch-all category browser is **already Payload-wired — out of scope.**
- **Showcase cards** reference real Categories (operator-approved): each card = a `category` relationship + an `archImage` override. Label = `category.name`, link = `categoryPath(category.slug)` (= `/bedroom-furniture/<slug>`), art = the override image. Rename-safe links + bespoke arch crop.
- **Room cards** stay self-contained (they link to `/bedroom-set/<occupancy>` hubs, not a collection). The green color **ramp stays a component treatment by row index** — not a CMS field.
- **Hero** copy+image and the **showcase heading/body** move into the global. `BedroomHero` keeps its current hardcoded values as defaults when the global is unconfigured (same pattern as `JournalIntro`). Generic micro-labels (drag hint «به چپ و راست بکشید», «اتاق» kicker, per-row «مشاهده») stay component constants; the `BrandDivider` wordmark stays a static brand asset.
- **Graceful fallback:** no `showcase` cards in the global → return `SEED` whole; the live page renders exactly as today until populated.
- **The one delicate assumption:** the showcase array's `category` (single relationship) → a `category_id` FK column on `bedroom_furniture_showcase` (mirrors `home_hero_slides.image_id`). Verified at deploy by saving the global with a showcase card and confirming it persists + the page renders.

---

## File structure

| File | Responsibility | Action |
| --- | --- | --- |
| `services/api/src/globals/BedroomFurniture.ts` | the global config | Create |
| `services/api/src/payload.config.ts` | register the global | Modify |
| `services/api/src/migrations/20260618_130000_create_bedroom_furniture_global.ts` | additive DDL | Create |
| `services/api/src/migrations/index.ts` | register migration | Modify |
| `apps/web/src/lib/payload.ts` | `PayloadBedroomFurniture` type + `fetchBedroomFurniture()` | Modify |
| `apps/web/src/lib/bedroom-furniture.ts` | fetch+map (replace SEED return) | Modify |
| `apps/web/src/lib/__tests__/bedroom-furniture.test.ts` | mapping tests | Create |
| `apps/web/src/components/bedroom-furniture/BedroomHero.tsx` | accept optional hero props | Modify |
| `apps/web/src/components/bedroom-furniture/CategoryShowcase.tsx` | accept optional `heading` | Modify |
| `apps/web/src/app/(site)/bedroom-furniture/page.tsx` | pass hero + heading | Modify |
| `docs/spec/data-schemas.md` | document the global | Modify |
| `docs/state.md` | session row | Modify (Task 7) |

---

## Task 1: The `bedroom-furniture` global config

**Files:**
- Create: `services/api/src/globals/BedroomFurniture.ts`
- Modify: `services/api/src/payload.config.ts`

- [ ] **Step 1: Create the global**

Create `services/api/src/globals/BedroomFurniture.ts`:

```ts
import type { GlobalConfig } from 'payload'
import { publishedContentAccess } from '../lib/access'

/** Editorial config for the /bedroom-furniture catalog root. The showcase cards
 *  reference Categories (label + /bedroom-furniture/<slug> link come from the
 *  category; archImage is the coverflow art). Room cards are self-contained
 *  cross-links to the /bedroom-set occupancy hubs. */
export const BedroomFurniture: GlobalConfig = {
  slug: 'bedroom-furniture',
  label: 'صفحه مبلمان اتاق خواب',
  access: publishedContentAccess,
  fields: [
    { name: 'heroTitle', type: 'textarea', label: 'عنوان هیرو', admin: { description: 'برای شکستن به دو خط از Enter استفاده کنید. اگر خالی باشد، عنوان پیش‌فرض طراحی نمایش داده می‌شود.' } },
    { name: 'heroSubtitle', type: 'text', label: 'زیرعنوان هیرو' },
    { name: 'heroTagline', type: 'text', label: 'شعار هیرو' },
    { name: 'heroCtaLabel', type: 'text', label: 'متن دکمه هیرو', admin: { description: 'پیش‌فرض: «مشاهده».' } },
    { name: 'heroCtaHref', type: 'text', label: 'لینک دکمه هیرو', admin: { description: 'اگر خالی باشد، دکمه به بخش دسته‌بندی‌ها در همین صفحه اسکرول می‌کند.' } },
    { name: 'heroMedia', type: 'upload', relationTo: 'media', label: 'تصویر هیرو' },

    { name: 'showcaseHeading', type: 'text', label: 'عنوان بخش دسته‌بندی', admin: { description: 'پیش‌فرض: «دسته بندی محصولات».' } },
    { name: 'showcaseBody', type: 'textarea', label: 'متن زیر اسلایدر دسته‌بندی' },
    { name: 'showcaseInitial', type: 'number', label: 'اسلاید فعال اولیه', admin: { description: 'شماره‌ی اسلایدی که در ابتدا وسط قرار می‌گیرد (از ۰). خالی = وسط.' } },

    {
      name: 'showcase',
      type: 'array',
      label: 'کارت‌های دسته‌بندی (کاورفلو)',
      labels: { singular: 'کارت دسته‌بندی', plural: 'کارت‌های دسته‌بندی' },
      admin: { description: 'هر کارت به یک دسته‌بندی اشاره می‌کند؛ نام و لینک از همان دسته‌بندی می‌آید. ترتیب نمایش حفظ می‌شود.' },
      fields: [
        { name: 'category', type: 'relationship', relationTo: 'categories', required: true, label: 'دسته‌بندی' },
        { name: 'archImage', type: 'upload', relationTo: 'media', required: true, label: 'تصویر قوسی کارت' },
      ],
    },
    {
      name: 'rooms',
      type: 'array',
      label: 'کارت‌های اتاق',
      labels: { singular: 'کارت اتاق', plural: 'کارت‌های اتاق' },
      admin: { description: 'کارت‌های شبکه‌ی اتاق‌ها (لینک به هاب‌های /bedroom-set). ترتیب نمایش حفظ می‌شود؛ رنگ پس‌زمینه از طیف طراحی بر اساس ردیف می‌آید.' },
      fields: [
        { name: 'name', type: 'text', required: true, label: 'نام اتاق (مثلاً بزرگسال)' },
        { name: 'display', type: 'text', label: 'نمایش کشیده (اختیاری)' },
        { name: 'image', type: 'upload', relationTo: 'media', required: true, label: 'تصویر اتاق' },
        { name: 'href', type: 'text', required: true, label: 'لینک (مثلاً /bedroom-set/double)' },
      ],
    },
  ],
}
```

- [ ] **Step 2: Register in `payload.config.ts`**

Add the import next to the other global imports (e.g. after `import { BedroomSet } from './globals/BedroomSet'`):

```ts
import { BedroomFurniture } from './globals/BedroomFurniture'
```

And add `BedroomFurniture,` to the `globals: [ ... ]` array (next to `BedroomSet,` / `Journal,`).

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @zhic/api typecheck`
Expected: no new errors (only the known pre-existing `sharp` error, if it appears).

- [ ] **Step 4: Commit**

```bash
git add services/api/src/globals/BedroomFurniture.ts services/api/src/payload.config.ts
git commit -m "feat(bedroom-furniture): add the bedroom-furniture global (hero + curated showcase/rooms)"
```

---

## Task 2: Migration — `bedroom_furniture` + array tables (hand-written, additive)

**Files:**
- Create: `services/api/src/migrations/20260618_130000_create_bedroom_furniture_global.ts`
- Modify: `services/api/src/migrations/index.ts`

Mirrors the `bedroom_set` global table (scalar + `serial` PK + timestamps) and the `home_hero_slides` / `designs_occupancy_media` array-table shape (`_order`/`_parent_id`→parent CASCADE/`id varchar` PK + single relation/upload subfields as FK columns). Additive/idempotent.

- [ ] **Step 1: Create the migration**

```ts
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * /bedroom-furniture index — CMS wiring (2026-06-18):
 *   bedroom_furniture table            → hero copy + showcase copy + hero_media FK.
 *   bedroom_furniture_showcase array   → { category(rel→categories), archImage(upload→media) }
 *                                        as category_id + arch_image_id FK columns.
 *   bedroom_furniture_rooms array      → { name, display, image(upload→media), href }.
 *
 * Hand-written (migrate:create hangs on the untracked designs_occupancies drift).
 * Additive only. Array tables mirror home_hero_slides / designs_occupancy_media
 * (a single relation/upload subfield → FK column on the array table). Never
 * touches designs_occupancies.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "bedroom_furniture" (
      "id" serial PRIMARY KEY NOT NULL,
      "hero_title" varchar,
      "hero_subtitle" varchar,
      "hero_tagline" varchar,
      "hero_cta_label" varchar,
      "hero_cta_href" varchar,
      "hero_media_id" integer,
      "showcase_heading" varchar,
      "showcase_body" varchar,
      "showcase_initial" numeric,
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );

    DO $$ BEGIN
      ALTER TABLE "bedroom_furniture" ADD CONSTRAINT "bedroom_furniture_hero_media_id_media_id_fk"
        FOREIGN KEY ("hero_media_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "bedroom_furniture_hero_media_idx" ON "bedroom_furniture" USING btree ("hero_media_id");

    -- showcase array: { category(rel→categories), archImage(upload→media) }
    CREATE TABLE IF NOT EXISTS "bedroom_furniture_showcase" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "category_id" integer,
      "arch_image_id" integer
    );

    DO $$ BEGIN
      ALTER TABLE "bedroom_furniture_showcase" ADD CONSTRAINT "bedroom_furniture_showcase_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "bedroom_furniture"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "bedroom_furniture_showcase" ADD CONSTRAINT "bedroom_furniture_showcase_category_id_categories_id_fk"
        FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "bedroom_furniture_showcase" ADD CONSTRAINT "bedroom_furniture_showcase_arch_image_id_media_id_fk"
        FOREIGN KEY ("arch_image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "bedroom_furniture_showcase_order_idx" ON "bedroom_furniture_showcase" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "bedroom_furniture_showcase_parent_id_idx" ON "bedroom_furniture_showcase" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "bedroom_furniture_showcase_category_idx" ON "bedroom_furniture_showcase" USING btree ("category_id");
    CREATE INDEX IF NOT EXISTS "bedroom_furniture_showcase_arch_image_idx" ON "bedroom_furniture_showcase" USING btree ("arch_image_id");

    -- rooms array: { name, display, image(upload→media), href }
    CREATE TABLE IF NOT EXISTS "bedroom_furniture_rooms" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "name" varchar,
      "display" varchar,
      "image_id" integer,
      "href" varchar
    );

    DO $$ BEGIN
      ALTER TABLE "bedroom_furniture_rooms" ADD CONSTRAINT "bedroom_furniture_rooms_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "bedroom_furniture"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "bedroom_furniture_rooms" ADD CONSTRAINT "bedroom_furniture_rooms_image_id_media_id_fk"
        FOREIGN KEY ("image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "bedroom_furniture_rooms_order_idx" ON "bedroom_furniture_rooms" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "bedroom_furniture_rooms_parent_id_idx" ON "bedroom_furniture_rooms" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "bedroom_furniture_rooms_image_idx" ON "bedroom_furniture_rooms" USING btree ("image_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "bedroom_furniture_showcase";
    DROP TABLE IF EXISTS "bedroom_furniture_rooms";
    DROP TABLE IF EXISTS "bedroom_furniture";
  `)
}
```

- [ ] **Step 2: Register in `index.ts`**

Add the import after the existing `migration_20260618_120000_create_journal_global` import (currently the last):

```ts
import * as migration_20260618_130000_create_bedroom_furniture_global from './20260618_130000_create_bedroom_furniture_global';
```

And append as the LAST entry of the `migrations` array:

```ts
  {
    up: migration_20260618_130000_create_bedroom_furniture_global.up,
    down: migration_20260618_130000_create_bedroom_furniture_global.down,
    name: '20260618_130000_create_bedroom_furniture_global'
  },
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @zhic/api typecheck`
Expected: only the pre-existing `sharp` error (if any). **Do NOT run `migrate`** — applied on the box in Task 7.

- [ ] **Step 4: Commit**

```bash
git add services/api/src/migrations/20260618_130000_create_bedroom_furniture_global.ts services/api/src/migrations/index.ts
git commit -m "feat(bedroom-furniture): additive migration for the bedroom-furniture global + arrays"
```

---

## Task 3: `PayloadBedroomFurniture` type + `fetchBedroomFurniture()` (web)

**Files:**
- Modify: `apps/web/src/lib/payload.ts`

- [ ] **Step 1: Add the type + fetcher**

In `apps/web/src/lib/payload.ts`, near the other global types/fetchers (e.g. after `fetchJournal`), add — reusing the existing `PayloadCategory`, `PayloadMedia` types and `payloadFetch`:

```ts
export type PayloadBedroomFurniture = {
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  heroTagline?: string | null;
  heroCtaLabel?: string | null;
  heroCtaHref?: string | null;
  heroMedia?: PayloadMedia | null;
  showcaseHeading?: string | null;
  showcaseBody?: string | null;
  showcaseInitial?: number | null;
  showcase?: { category?: PayloadCategory | null; archImage?: PayloadMedia | null }[] | null;
  rooms?: { name?: string | null; display?: string | null; image?: PayloadMedia | null; href?: string | null }[] | null;
};

/** /bedroom-furniture root config global. depth=2 populates each showcase
 *  card's category + archImage, each room's image, and the hero image. */
export async function fetchBedroomFurniture(): Promise<PayloadBedroomFurniture | null> {
  return payloadFetch<PayloadBedroomFurniture>('/api/globals/bedroom-furniture?depth=2', 'bedroom-furniture');
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @zhic/web typecheck`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/payload.ts
git commit -m "feat(web): PayloadBedroomFurniture type + fetchBedroomFurniture()"
```

---

## Task 4: Wire `getBedroomFurnitureContent` to the global (TDD)

**Files:**
- Modify: `apps/web/src/lib/bedroom-furniture.ts`
- Create: `apps/web/src/lib/__tests__/bedroom-furniture.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/lib/__tests__/bedroom-furniture.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
vi.mock('@/lib/payload', () => ({
  fetchBedroomFurniture: (...a: unknown[]) => mockFetch(...a),
  mediaUrl: (m: { url?: string | null; filename?: string | null } | null | undefined) =>
    m ? (m.url ?? `/media/${m.filename ?? 'x'}`) : null,
  categoryPath: (slug: string) => `/bedroom-furniture/${slug}`,
}));

import { getBedroomFurnitureContent } from '../bedroom-furniture';

beforeEach(() => mockFetch.mockReset());

describe('getBedroomFurnitureContent', () => {
  it('falls back to SEED when the global is null', async () => {
    mockFetch.mockResolvedValueOnce(null);
    const c = await getBedroomFurnitureContent();
    expect(c.showcase[0]!.label).toBe('پا تختی'); // SEED first showcase card
    expect(c.hero).toBeUndefined();
  });

  it('falls back to SEED when the global has no showcase cards', async () => {
    mockFetch.mockResolvedValueOnce({ heroTitle: 'x', showcase: [] });
    const c = await getBedroomFurnitureContent();
    expect(c.showcase[0]!.label).toBe('پا تختی');
  });

  it('maps showcase (label/href from category, img from archImage), rooms, hero, and copy', async () => {
    mockFetch.mockResolvedValueOnce({
      heroTitle: 'مبلمان\nاتاق خواب',
      heroSubtitle: 'زیرعنوان',
      heroTagline: 'شعار',
      heroCtaLabel: 'برو',
      heroMedia: { filename: 'hero.jpg' },
      showcaseHeading: 'دسته‌ها',
      showcaseBody: 'متن',
      showcaseInitial: 2,
      showcase: [
        { category: { name: 'تخت خواب', slug: 'bed' }, archImage: { filename: 'arch-bed.jpg' } },
        { category: { name: 'پاتختی', slug: 'nightstand' }, archImage: { filename: 'arch-ns.jpg' } },
      ],
      rooms: [
        { name: 'بزرگسال', display: 'بزرگــسال', image: { filename: 'adult.jpg' }, href: '/bedroom-set/double' },
      ],
    });
    const c = await getBedroomFurnitureContent();
    expect(c.showcase).toHaveLength(2);
    expect(c.showcase[0]).toMatchObject({ label: 'تخت خواب', href: '/bedroom-furniture/bed', img: '/media/arch-bed.jpg' });
    expect(c.showcaseInitial).toBe(2);
    expect(c.lorem).toBe('متن');
    expect(c.rooms[0]).toMatchObject({ name: 'بزرگسال', display: 'بزرگــسال', img: '/media/adult.jpg', href: '/bedroom-set/double' });
    expect(c.hero).toMatchObject({ title: 'مبلمان\nاتاق خواب', subtitle: 'زیرعنوان', tagline: 'شعار', ctaLabel: 'برو', img: '/media/hero.jpg' });
    expect(c.showcaseHeading).toBe('دسته‌ها');
  });

  it('defaults showcaseInitial to the middle card when unset', async () => {
    mockFetch.mockResolvedValueOnce({
      showcase: [
        { category: { name: 'a', slug: 'a' }, archImage: { filename: 'a.jpg' } },
        { category: { name: 'b', slug: 'b' }, archImage: { filename: 'b.jpg' } },
        { category: { name: 'c', slug: 'c' }, archImage: { filename: 'c.jpg' } },
      ],
    });
    const c = await getBedroomFurnitureContent();
    expect(c.showcaseInitial).toBe(1); // floor(3/2)
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @zhic/web test -- bedroom-furniture`
Expected: FAIL — `getBedroomFurnitureContent` still returns `SEED` and there's no `hero`/`showcaseHeading` on the type.

- [ ] **Step 3: Implement**

In `apps/web/src/lib/bedroom-furniture.ts`:

(a) Add imports at the top:

```ts
import { fetchBedroomFurniture, mediaUrl, categoryPath } from '@/lib/payload';
```

(b) Add a `HeroContent` type and extend `BedroomFurnitureContent`. After the `RoomCard` type, add:

```ts
export type HeroContent = {
  title?: string;
  subtitle?: string;
  tagline?: string;
  ctaLabel?: string;
  ctaHref?: string;
  img?: string;
  imgAlt?: string;
};
```

And add two optional fields to `BedroomFurnitureContent` (after `lorem: string;`):

```ts
  /** Hero copy/image override; when unset, BedroomHero renders its defaults. */
  hero?: HeroContent;
  /** Showcase section heading; when unset, CategoryShowcase uses its default. */
  showcaseHeading?: string;
```

(c) Replace the `getBedroomFurnitureContent` body (`return SEED;`) with:

```ts
export async function getBedroomFurnitureContent(): Promise<BedroomFurnitureContent> {
  const g = await fetchBedroomFurniture();
  if (!g || !g.showcase || g.showcase.length === 0) return SEED;

  const showcase: ShowcaseSlide[] = g.showcase
    .map((s, i): ShowcaseSlide | null => {
      const slug = s.category?.slug;
      const img = mediaUrl(s.archImage);
      if (!slug || !img) return null;
      return { key: slug, label: s.category?.name ?? '', img, href: categoryPath(slug) };
    })
    .filter((x): x is ShowcaseSlide => x !== null);
  if (showcase.length === 0) return SEED;

  const rooms: RoomCard[] = (g.rooms ?? [])
    .map((r, i): RoomCard | null => {
      const img = mediaUrl(r.image);
      if (!img) return null;
      return { key: `r${i}`, name: r.name ?? '', display: r.display ?? undefined, img, href: r.href ?? '#' };
    })
    .filter((x): x is RoomCard => x !== null);

  const hero: HeroContent | undefined =
    g.heroTitle || g.heroSubtitle || g.heroTagline || g.heroCtaLabel || g.heroMedia
      ? {
          title: g.heroTitle ?? undefined,
          subtitle: g.heroSubtitle ?? undefined,
          tagline: g.heroTagline ?? undefined,
          ctaLabel: g.heroCtaLabel ?? undefined,
          ctaHref: g.heroCtaHref ?? undefined,
          img: mediaUrl(g.heroMedia) ?? undefined,
          imgAlt: g.heroMedia?.alt ?? undefined,
        }
      : undefined;

  return {
    showcase,
    showcaseInitial: g.showcaseInitial ?? Math.floor(showcase.length / 2),
    rooms: rooms.length ? rooms : SEED.rooms,
    lorem: g.showcaseBody ?? SEED.lorem,
    hero,
    showcaseHeading: g.showcaseHeading ?? undefined,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @zhic/web test -- bedroom-furniture`
Expected: PASS — all 4 cases green.

- [ ] **Step 5: Typecheck**

Run: `pnpm --filter @zhic/web typecheck`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/bedroom-furniture.ts apps/web/src/lib/__tests__/bedroom-furniture.test.ts
git commit -m "feat(web): wire getBedroomFurnitureContent to the bedroom-furniture global with SEED fallback"
```

---

## Task 5: Parameterize `BedroomHero` + `CategoryShowcase` heading + wire the page

**Files:**
- Modify: `apps/web/src/components/bedroom-furniture/BedroomHero.tsx`
- Modify: `apps/web/src/components/bedroom-furniture/CategoryShowcase.tsx`
- Modify: `apps/web/src/app/(site)/bedroom-furniture/page.tsx`

- [ ] **Step 1: Parameterize `BedroomHero`**

Replace the `BedroomHero` function in `apps/web/src/components/bedroom-furniture/BedroomHero.tsx` with (keep the `Chevron` helper + imports above it unchanged; add a `HeroContent` import):

```tsx
import type { HeroContent } from '@/lib/bedroom-furniture';

/**
 * Bedroom-furniture page hero (Figma frame 191:207).
 * Full-bleed photo with a 73% scrim + caramel bottom-fade, white right-aligned
 * headline/sub/tagline, and a centered «مشاهده» CTA. All copy/image default to
 * the comp values; pass `hero` (from the CMS) to override.
 */
export function BedroomHero({ hero }: { hero?: HeroContent }) {
  const titleLines = (hero?.title ?? 'مُبلمان\nاتاق خواب').split('\n').filter(Boolean);
  return (
    <section className={styles.hero} aria-labelledby="bf-hero-title">
      <Image
        src={hero?.img ?? '/bedroom-furniture/hero.jpg'}
        alt={hero?.imgAlt ?? 'اتاق خواب چوبی ژیک با نورپردازی گرم'}
        fill
        priority
        sizes="(max-width: 480px) 100vw, 480px"
        className={styles.photo}
      />
      <div className={styles.overlay} aria-hidden="true" />

      <div className={styles.content}>
        <h1 id="bf-hero-title" className={styles.title}>
          {titleLines.map((line, i) => (
            <span key={i}>
              {line}
              {i < titleLines.length - 1 ? <br /> : null}
            </span>
          ))}
        </h1>
        <p className={styles.subtitle}>{hero?.subtitle ?? 'از تخت خواب تا آینه و میز آرایش'}</p>
        <p className={styles.tagline}>{hero?.tagline ?? 'همه چیز با طراحی منظم و کیفیت ساخت بالا'}</p>

        <a href={hero?.ctaHref ?? '#bf-categories'} className={styles.cta}>
          <Chevron className={styles.chev} />
          <span className={styles.ctaLabel}>{hero?.ctaLabel ?? 'مشاهده'}</span>
          <Chevron className={styles.chev} />
        </a>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Parameterize the `CategoryShowcase` heading**

In `apps/web/src/components/bedroom-furniture/CategoryShowcase.tsx`:
- Add `heading?: string;` to `CategoryShowcaseProps`:

```ts
export type CategoryShowcaseProps = {
  slides: ShowcaseSlide[];
  lorem: string;
  /** Slide centered on first render. */
  initialActive?: number;
  /** Section heading; defaults to the comp value. */
  heading?: string;
};
```

- Accept it in the signature: `export function CategoryShowcase({ slides, lorem, initialActive = 0, heading }: CategoryShowcaseProps) {`
- Change the heading line `<h2 className={styles.heading}>دسته بندی محصولات</h2>` to:

```tsx
      <h2 className={styles.heading}>{heading ?? 'دسته بندی محصولات'}</h2>
```

- [ ] **Step 3: Wire the page**

In `apps/web/src/app/(site)/bedroom-furniture/page.tsx`:
- Destructure the new fields: change line 25 to:

```tsx
  const { showcase, showcaseInitial, rooms, lorem, hero, showcaseHeading } = await getBedroomFurnitureContent();
```

- Pass `hero` to `BedroomHero` and `heading` to `CategoryShowcase` (lines 37-38):

```tsx
          hero={<BedroomHero hero={hero} />}
          showcase={<CategoryShowcase slides={showcase} lorem={lorem} initialActive={showcaseInitial} heading={showcaseHeading} />}
```

- [ ] **Step 4: Typecheck + build**

Run: `pnpm --filter @zhic/web typecheck && pnpm --filter @zhic/web build`
Expected: both exit 0; `/bedroom-furniture` present in the route manifest.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/bedroom-furniture/BedroomHero.tsx apps/web/src/components/bedroom-furniture/CategoryShowcase.tsx "apps/web/src/app/(site)/bedroom-furniture/page.tsx"
git commit -m "feat(web): bedroom-furniture root renders CMS hero + showcase heading"
```

---

## Task 6: Document the `bedroom-furniture` global in `data-schemas.md`

**Files:**
- Modify: `docs/spec/data-schemas.md`

- [ ] **Step 1: Add a section**

Open `docs/spec/data-schemas.md`. Find the §14 catalog area (the `categories` collection, ~line 448). Matching the file's heading convention (numbered `## §NN` / `### \`slug\``, with a `§NNb`-style suffix to avoid renumbering — as the `journal` global was added at `§62b`), add a section right after the `categories` block:

````markdown
### `bedroom-furniture` (global) — catalog-root page config

Curates the `/bedroom-furniture` root index. Showcase cards reference Categories (label + link come from the category); room cards are self-contained cross-links to `/bedroom-set` hubs. Added 2026-06-18.

| Field | Type | Notes |
| --- | --- | --- |
| `heroTitle` | textarea | hero headline (newline = line break); empty → default |
| `heroSubtitle` / `heroTagline` | text | hero sub + tagline |
| `heroCtaLabel` / `heroCtaHref` | text | hero CTA («مشاهده»); empty href → scrolls to the showcase |
| `heroMedia` | upload → media | hero photo |
| `showcaseHeading` | text | «دسته بندی محصولات» |
| `showcaseBody` | textarea | paragraph under the coverflow |
| `showcaseInitial` | number | which card centers first (0-based); empty → middle |
| `showcase` | array `{ category(rel→categories,req), archImage(upload,req) }` | coverflow cards; label + `/bedroom-furniture/<slug>` link from the category |
| `rooms` | array `{ name(req), display, image(upload,req), href(req) }` | room cards (link to `/bedroom-set/<occupancy>`); bg color is a component ramp |

Empty `showcase` → the page falls back to its static default. DB: a `bedroom_furniture` table (scalar + `hero_media_id` FK) plus `bedroom_furniture_showcase` (`category_id`+`arch_image_id` FK cols) and `bedroom_furniture_rooms` (`image_id` FK col) array tables — single relation/upload subfields become FK columns on the array table (mirrors `home_hero_slides`).
````

- [ ] **Step 2: Commit**

```bash
git add docs/spec/data-schemas.md
git commit -m "docs(schemas): document the bedroom-furniture global"
```

---

## Task 7: Final verification + state board + deploy

**Files:**
- Modify: `docs/state.md`

- [ ] **Step 1: Full static verification**

```bash
pnpm --filter @zhic/api typecheck                 # only the pre-existing sharp error (if any)
pnpm --filter @zhic/web typecheck
pnpm --filter @zhic/web test -- bedroom-furniture # 4 new cases pass
pnpm --filter @zhic/web build
pnpm --filter @zhic/web exec eslint src/lib/bedroom-furniture.ts src/lib/__tests__/bedroom-furniture.test.ts src/components/bedroom-furniture/BedroomHero.tsx src/components/bedroom-furniture/CategoryShowcase.tsx "src/app/(site)/bedroom-furniture/page.tsx" src/lib/payload.ts
pnpm --filter @zhic/api exec eslint src/globals/BedroomFurniture.ts src/migrations/20260618_130000_create_bedroom_furniture_global.ts src/migrations/index.ts
```
Expected: all green (known unrelated pre-existing failure: `StatBlock.test.tsx`).

- [ ] **Step 2: Update the state board**

Add a dated `2026-06-18 (cont.)` row to the top snapshot of `docs/state.md` summarizing: new `bedroom-furniture` global (hero + curated showcase→Categories + self-contained rooms), the `bedroom_furniture` + 2 array-table migration, `getBedroomFurnitureContent` now Payload-fed with SEED fallback, `BedroomHero`/`CategoryShowcase` parameterized, deploy result (Step 4). Refresh the `feat/journal-rebuild` line in the "Active branch" row.

- [ ] **Step 3: Commit**

```bash
git add docs/state.md
git commit -m "docs(state): log bedroom-furniture index CMS wiring"
```

- [ ] **Step 4: Deploy to the box (operator-confirmed)**

This machine is the box. In order:
1. `pnpm -C services/api migrate` — applies `20260618_130000_create_bedroom_furniture_global` (additive, reversible).
2. `pnpm --filter @zhic/api generate:types` — **expected to fail** (Node-24 boot bug); skip if so (not needed at runtime).
3. `pnpm --filter @zhic/api build && pnpm --filter @zhic/web build`.
4. `pm2 restart zhic-api zhic-web`; confirm both online.
5. Health-check: `curl /api/globals/bedroom-furniture?depth=2` → 200; `/bedroom-furniture` → 200 (renders the SEED default until populated); `/` + `/journal` → 200.
6. **Verify the delicate assumption:** in the admin, save the `bedroom-furniture` global with one showcase card (a category + arch image); confirm it persists and the page renders the curated card (this confirms the `category_id` FK-column shape on `bedroom_furniture_showcase` matches Payload's runtime expectation). If saving errors on the showcase relationship, the array's relationship subfield uses a `_rels` table instead — adjust the migration accordingly.

---

## Self-review

**Design coverage:**
- Global (hero + showcase + rooms + copy) → Task 1. ✅
- Migration (`bedroom_furniture` + 2 array tables, single-rel subfields as FK columns) → Task 2. ✅
- `PayloadBedroomFurniture` + fetcher → Task 3. ✅
- Getter mapping (showcase→category, rooms, hero, copy, SEED fallback) → Task 4. ✅
- `BedroomHero` + `CategoryShowcase` heading parameterized + page wiring → Task 5. ✅
- Docs → Task 6. ✅
- Verify + deploy + the relationship-subfield verification → Task 7. ✅
- Out of scope (catch-all browser, color ramp, micro-labels, wordmark) — untouched. ✅

**Placeholder scan:** none — every step has full code + exact commands.

**Type consistency:** `PayloadBedroomFurniture` field names (Task 3) match the global config (Task 1) and the getter reads (Task 4: `s.category?.slug`/`name`, `s.archImage`, `r.name`/`display`/`image`/`href`, `g.hero*`/`showcase*`). `HeroContent` (Task 4) is consumed by `BedroomHero` (Task 5) and the page (Task 5). `BedroomFurnitureContent` gains `hero?`/`showcaseHeading?` (Task 4), consumed in Task 5. DB columns (`category_id`, `arch_image_id`, `hero_media_id`, `image_id`) mirror the `home_hero_slides`/`designs_occupancy_media` FK-column precedent and the `categories`/`media` table names. `categoryPath(slug)` → `/bedroom-furniture/<slug>` matches the existing helper + the SEED hrefs.
