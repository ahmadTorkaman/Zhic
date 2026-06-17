# Journal Index — CMS Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the redesigned `/journal` index fully CMS-driven — a new `journal` global hand-picks every article slot (featured / numbered list / 2-up cards / category tabs) and owns the page's editorial copy (intro headline, quote, «فهرست کامل» heading, product-CTA), replacing the hardcoded `SEED`.

**Architecture:** A new Payload `journal` global with scalar copy fields + single relationships (`featuredArticle`, `ctaImage` → FK columns) + hasMany relationships (`listArticles`, `cardArticles` → `articles`; `categoryTabs` → `journal-categories` → a `journal_rels` table). The web `getJournalContent()` fetches that global at `depth=2` and maps each referenced **Article** into the existing card shape (title/excerpt/cover/category/reading-time/date/href come from the Article — DRY), with a **graceful fallback to the current `SEED`** when the global is unconfigured. A small `formatJalaliNumeric` is added to `@zhic/locale` for the card dates.

**Tech Stack:** Payload 3 (Postgres adapter), Next.js 16 / React 19, TypeScript 5, Vitest, pnpm + Turborepo.

---

## Design summary (folded in — no separate spec doc this round)

- **Two kinds of content on `/journal`:** (1) article-shaped sections — already fully expressible from the existing `Articles` + `JournalCategories` collections; (2) page editorial copy — has no CMS home today. Decision (operator-approved): **full curation** — a `journal` global both curates which article fills each slot AND holds the editorial copy.
- **Slots store only the selection.** Each card's display fields are read from the referenced Article via `depth=2` (`category` ← `article.category.name`, `img` ← `article.cover`, `date` ← Jalali(`publishedAt`), `readingMinutes` ← `readingTimeMinutes`, `href` ← `/journal/<slug>`). No per-card content is duplicated in the global.
- **Graceful fallback:** if the global has no `featuredArticle` (fresh DB / not yet filled), `getJournalContent` returns the current `SEED` unchanged — the live page never breaks.
- **Intro headline:** modeled as a single `introTitle` (textarea; `\n` = line break). The `JournalIntro` component keeps its current forest/gold **bicolor JSX as the default** when no `introTitle` is provided, and renders the CMS text **uniform** (forest) when provided. (No separate `introEyebrow` — the rendered intro has no eyebrow.) Per-word bicolor on CMS text is the approved tradeoff.
- **Card kashida `displayTitle`:** not wired — cards use `article.title` (the kashida flourish is dropped; a per-article field could be added later).
- **Out of scope:** `/journal/[slug]`, `category/`, `tag/` routes (already Payload-wired); Crimson-Text numeral font; breadcrumb + page `<meta>` (navigation chrome, stays static); generic UI micro-labels («دقیقه مطالعه», «مطالعه مقاله»).

---

## File structure

| File | Responsibility | Action |
| --- | --- | --- |
| `packages/locale/src/date.ts` | `formatJalaliNumeric` | Modify |
| `packages/locale/src/index.ts` | export it | Modify |
| `packages/locale/src/**/date*.test.ts` | tests | Modify |
| `services/api/src/globals/Journal.ts` | the `journal` global config | Create |
| `services/api/src/payload.config.ts` | register the global | Modify |
| `services/api/src/migrations/20260618_120000_create_journal_global.ts` | additive DDL | Create |
| `services/api/src/migrations/index.ts` | register migration | Modify |
| `apps/web/src/lib/payload.ts` | `PayloadJournalGlobal` type + `fetchJournal()` | Modify |
| `apps/web/src/lib/journal-content.ts` | fetch+map (replace SEED return) | Modify |
| `apps/web/src/lib/__tests__/journal-content.test.ts` | mapping tests | Create |
| `apps/web/src/components/journal/JournalIntro.tsx` | accept optional `title` | Modify |
| `apps/web/src/app/(site)/journal/page.tsx` | pass `intro` + `fullListHeading` | Modify |
| `docs/spec/data-schemas.md` | document the `journal` global | Modify |
| `docs/state.md` | session row | Modify (Task 8) |

---

## Task 1: `formatJalaliNumeric` in `@zhic/locale` (TDD)

**Files:**
- Modify: `packages/locale/src/date.ts`
- Modify: `packages/locale/src/index.ts`
- Test: the existing locale date test file (find with `ls packages/locale/src/**/*.test.ts` — likely `packages/locale/src/date.test.ts` or `packages/locale/src/__tests__/date.test.ts`)

- [ ] **Step 1: Write the failing test**

Add to the existing locale date test file:

```ts
import { formatJalaliNumeric } from '../date'; // adjust relative path to match the test file's location

describe('formatJalaliNumeric', () => {
  it('formats Nowruz 1405 (2026-03-21) as 1405/01/01', () => {
    expect(formatJalaliNumeric('2026-03-21', { digits: 'en' })).toBe('1405/01/01');
  });
  it('zero-pads month and day (2026-03-30 → 1405/01/10)', () => {
    expect(formatJalaliNumeric('2026-03-30', { digits: 'en' })).toBe('1405/01/10');
  });
  it('uses Persian digits by default', () => {
    expect(formatJalaliNumeric('2026-03-21')).toBe('۱۴۰۵/۰۱/۰۱');
  });
});
```

(If the existing test file already `import`s from `./date`, merge `formatJalaliNumeric` into that import instead of adding a second line.)

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @zhic/locale test`
Expected: FAIL — `formatJalaliNumeric is not a function` / not exported.

- [ ] **Step 3: Implement**

In `packages/locale/src/date.ts`, add after `formatDate` (it reuses the existing module-private `asDate` + `toJalaliUtc` and the imported `toPersianDigits`):

```ts
/**
 * Format an ISO / Date as numeric Jalali: "۱۴۰۵/۰۵/۱۰" (zero-padded month/day).
 * `digits: 'en'` → "1405/05/10". Used by compact contexts (journal card date).
 */
export function formatJalaliNumeric(
  iso: string | Date,
  opts: { digits?: 'fa' | 'en' } = {},
): string {
  const { digits = 'fa' } = opts;
  const { jy, jm, jd } = toJalaliUtc(asDate(iso));
  const pad = (n: number) => String(n).padStart(2, '0');
  const core = `${jy}/${pad(jm)}/${pad(jd)}`;
  return digits === 'fa' ? toPersianDigits(core) : core;
}
```

In `packages/locale/src/index.ts`, add `formatJalaliNumeric` to the existing `export { ... } from './date';` line (alongside `formatDate`).

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @zhic/locale test`
Expected: PASS (all 3 new cases green; existing locale tests still pass).

- [ ] **Step 5: Commit**

```bash
git add packages/locale/src/date.ts packages/locale/src/index.ts packages/locale/src
git commit -m "feat(locale): add formatJalaliNumeric (resolves FU-2.3-k)"
```

---

## Task 2: The `journal` global config

**Files:**
- Create: `services/api/src/globals/Journal.ts`
- Modify: `services/api/src/payload.config.ts`

- [ ] **Step 1: Create the global**

Create `services/api/src/globals/Journal.ts`:

```ts
import type { GlobalConfig } from 'payload'
import { publishedContentAccess } from '../lib/access'

/** Editorial config for the /journal index. Article cards (featured / numbered
 *  list / 2-up cards) are CURATED here by relationship; each card's
 *  title/excerpt/cover/category/date/reading-time come from the referenced
 *  Article. Only page-level copy (intro / quote / heading / product-CTA) lives
 *  here directly. */
export const Journal: GlobalConfig = {
  slug: 'journal',
  label: 'صفحه ژورنال',
  access: publishedContentAccess,
  fields: [
    {
      name: 'introTitle',
      type: 'textarea',
      label: 'عنوان معرفی (هدلاین)',
      admin: { description: 'سرتیتر بالای صفحه ژورنال. برای شکستن به دو خط از Enter استفاده کنید. اگر خالی باشد، هدلاین پیش‌فرض طراحی نمایش داده می‌شود.' },
    },
    {
      name: 'featuredArticle',
      type: 'relationship',
      relationTo: 'articles',
      label: 'مقاله ویژه (کارت بزرگ)',
      admin: { description: 'کارت بزرگ بالای فهرست. اگر خالی باشد، کل صفحه به محتوای پیش‌فرض برمی‌گردد.' },
    },
    {
      name: 'listArticles',
      type: 'relationship',
      relationTo: 'articles',
      hasMany: true,
      label: 'مقاله‌های فهرست شماره‌دار',
      admin: { description: 'به‌ترتیب نمایش (۰۲، ۰۳، …). معمولاً ۴ مقاله.' },
    },
    {
      name: 'fullListHeading',
      type: 'text',
      label: 'عنوان بخش «فهرست کامل»',
      admin: { description: 'پیش‌فرض: «فهرست کامل».' },
    },
    {
      name: 'quoteText',
      type: 'textarea',
      label: 'متن نقل‌قول',
      admin: { description: 'بلوک نقل‌قول. از نیم‌فاصله (ZWNJ) استفاده کنید.' },
    },
    {
      name: 'cardArticles',
      type: 'relationship',
      relationTo: 'articles',
      hasMany: true,
      label: 'کارت‌های مقاله (دوتایی)',
      admin: { description: 'به‌ترتیب نمایش. معمولاً ۲ مقاله.' },
    },
    {
      name: 'categoryTabs',
      type: 'relationship',
      relationTo: 'journal-categories',
      hasMany: true,
      label: 'تب‌های دسته‌بندی',
      admin: { description: 'دسته‌هایی که به‌عنوان تب نمایش داده می‌شوند (به‌علاوه‌ی «همه»). اگر خالی باشد، همه‌ی دسته‌ها نمایش داده می‌شوند.' },
    },
    {
      name: 'ctaTitle',
      type: 'text',
      label: 'عنوان بنر محصولات',
      admin: { description: 'پیش‌فرض: «ساخته شده برای ماندن».' },
    },
    {
      name: 'ctaLabel',
      type: 'text',
      label: 'متن دکمه بنر',
      admin: { description: 'پیش‌فرض: «مشاهده محصولات».' },
    },
    {
      name: 'ctaHref',
      type: 'text',
      label: 'لینک دکمه بنر',
      admin: { description: 'پیش‌فرض: /bedroom-furniture.' },
    },
    {
      name: 'ctaImage',
      type: 'upload',
      relationTo: 'media',
      label: 'تصویر بنر محصولات',
    },
  ],
}
```

- [ ] **Step 2: Register it in `payload.config.ts`**

In `services/api/src/payload.config.ts`, add this import next to the existing `import { BedroomSet } from './globals/BedroomSet'` (line ~40):

```ts
import { Journal } from './globals/Journal'
```

And add `Journal,` to the `globals: [ ... ]` array (right after the `BedroomSet,` entry, line ~106):

```ts
    BedroomSet,
    Journal,
```

- [ ] **Step 3: Typecheck the api package**

Run: `pnpm --filter @zhic/api typecheck`
Expected: only the known pre-existing `sharp` TS error in `src/payload.config.ts` — no new errors.

- [ ] **Step 4: Commit**

```bash
git add services/api/src/globals/Journal.ts services/api/src/payload.config.ts
git commit -m "feat(journal): add the journal global (curated index config + editorial copy)"
```

---

## Task 3: Migration — create `journal` + `journal_rels` (hand-written, additive)

**Files:**
- Create: `services/api/src/migrations/20260618_120000_create_journal_global.ts`
- Modify: `services/api/src/migrations/index.ts`

Mirrors the `home` / `home_rels` shape from `20260505_233650_initial.ts` (single relationship → FK column on the global table; hasMany → `_rels` table with `order`/`parent_id`/`path` + one `<collection>_id` per related collection). Additive/idempotent style (`CREATE TABLE IF NOT EXISTS`, `duplicate_object`-guarded FKs) per the repo convention (`migrate:create` is broken by the `designs_occupancies` drift).

- [ ] **Step 1: Create the migration file**

```ts
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * /journal index — CMS wiring (2026-06-18):
 *   journal table       → editorial copy (intro/quote/full-list heading/product-CTA)
 *                         + single relationships as FK columns (featured_article_id
 *                         → articles, cta_image_id → media).
 *   journal_rels table  → hasMany relationships: list_articles + card_articles
 *                         (→ articles) and category_tabs (→ journal_categories),
 *                         distinguished by `path`.
 *
 * Hand-written (migrate:create hangs on the untracked designs_occupancies drift).
 * Additive only. Mirrors the home/home_rels global-with-relationships shape from
 * 20260505_233650_initial.ts. Never touches designs_occupancies.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "journal" (
      "id" serial PRIMARY KEY NOT NULL,
      "intro_title" varchar,
      "full_list_heading" varchar,
      "quote_text" varchar,
      "cta_title" varchar,
      "cta_label" varchar,
      "cta_href" varchar,
      "cta_image_id" integer,
      "featured_article_id" integer,
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );

    DO $$ BEGIN
      ALTER TABLE "journal" ADD CONSTRAINT "journal_cta_image_id_media_id_fk"
        FOREIGN KEY ("cta_image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "journal" ADD CONSTRAINT "journal_featured_article_id_articles_id_fk"
        FOREIGN KEY ("featured_article_id") REFERENCES "articles"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE TABLE IF NOT EXISTS "journal_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "articles_id" integer,
      "journal_categories_id" integer
    );

    DO $$ BEGIN
      ALTER TABLE "journal_rels" ADD CONSTRAINT "journal_rels_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "journal"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "journal_rels" ADD CONSTRAINT "journal_rels_articles_fk"
        FOREIGN KEY ("articles_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "journal_rels" ADD CONSTRAINT "journal_rels_journal_categories_fk"
        FOREIGN KEY ("journal_categories_id") REFERENCES "journal_categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "journal_rels_order_idx" ON "journal_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "journal_rels_parent_idx" ON "journal_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "journal_rels_path_idx" ON "journal_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "journal_rels_articles_id_idx" ON "journal_rels" USING btree ("articles_id");
    CREATE INDEX IF NOT EXISTS "journal_rels_journal_categories_id_idx" ON "journal_rels" USING btree ("journal_categories_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "journal_rels";
    DROP TABLE IF EXISTS "journal";
  `)
}
```

- [ ] **Step 2: Register in `index.ts`**

In `services/api/src/migrations/index.ts`, add the import after the `20260617_120000_add_design_detail_fields` import (currently the last):

```ts
import * as migration_20260618_120000_create_journal_global from './20260618_120000_create_journal_global';
```

And append as the LAST entry of the `migrations` array (after the `20260617_120000_add_design_detail_fields` block, before `];`):

```ts
  {
    up: migration_20260618_120000_create_journal_global.up,
    down: migration_20260618_120000_create_journal_global.down,
    name: '20260618_120000_create_journal_global'
  },
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @zhic/api typecheck`
Expected: only the pre-existing `sharp` error. (Do NOT run `migrate` — applied on the box in Task 8.)

- [ ] **Step 4: Commit**

```bash
git add services/api/src/migrations/20260618_120000_create_journal_global.ts services/api/src/migrations/index.ts
git commit -m "feat(journal): additive migration for the journal global + rels"
```

---

## Task 4: `PayloadJournalGlobal` type + `fetchJournal()` (web)

**Files:**
- Modify: `apps/web/src/lib/payload.ts`

- [ ] **Step 1: Add the type + fetcher**

In `apps/web/src/lib/payload.ts`, near the other global types/fetchers (e.g. after `PayloadHome`/`fetchHome`), add — reusing the existing `PayloadArticle`, `PayloadJournalCategory`, `PayloadMedia` types and the `payloadFetch` helper already in this file:

```ts
export type PayloadJournalGlobal = {
  introTitle?: string | null;
  fullListHeading?: string | null;
  quoteText?: string | null;
  ctaTitle?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  ctaImage?: PayloadMedia | null;
  featuredArticle?: PayloadArticle | null;
  listArticles?: PayloadArticle[] | null;
  cardArticles?: PayloadArticle[] | null;
  categoryTabs?: PayloadJournalCategory[] | null;
};

/** /journal index config global. depth=2 populates each slot's Article + its
 *  cover/category, the categoryTabs, and the CTA image. */
export async function fetchJournal(): Promise<PayloadJournalGlobal | null> {
  return payloadFetch<PayloadJournalGlobal>('/api/globals/journal?depth=2', 'journal');
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @zhic/web typecheck`
Expected: exit 0 (additive; no consumer yet).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/payload.ts
git commit -m "feat(web): PayloadJournalGlobal type + fetchJournal()"
```

---

## Task 5: Wire `getJournalContent` to the global (TDD)

**Files:**
- Modify: `apps/web/src/lib/journal-content.ts`
- Create: `apps/web/src/lib/__tests__/journal-content.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/lib/__tests__/journal-content.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockFetchJournal = vi.fn();
const mockFetchCats = vi.fn();
vi.mock('@/lib/payload', () => ({
  fetchJournal: (...a: unknown[]) => mockFetchJournal(...a),
  fetchJournalCategories: (...a: unknown[]) => mockFetchCats(...a),
  mediaUrl: (m: { url?: string | null; filename?: string | null } | null | undefined) =>
    m ? (m.url ?? `/media/${m.filename ?? 'x'}`) : null,
}));

import { getJournalContent } from '../journal-content';

const article = (over: Record<string, unknown> = {}) => ({
  id: 1,
  title: 'مقاله نمونه',
  slug: 'sample',
  excerpt: 'خلاصه',
  cover: { filename: 'c.jpg' },
  category: { name: 'سبک زندگی', slug: 'lifestyle' },
  readingTimeMinutes: 5,
  publishedAt: '2026-03-21',
  ...over,
});

beforeEach(() => {
  mockFetchJournal.mockReset();
  mockFetchCats.mockReset();
  mockFetchCats.mockResolvedValue([]);
});

describe('getJournalContent', () => {
  it('falls back to SEED when the global is null', async () => {
    mockFetchJournal.mockResolvedValueOnce(null);
    const c = await getJournalContent();
    expect(c.featured.title).toBe('چگونه یک اتاق خواب آرامش‌بخش طراحی کنیم؟'); // SEED featured
  });

  it('falls back to SEED when no featuredArticle is set', async () => {
    mockFetchJournal.mockResolvedValueOnce({ introTitle: 'x' }); // populated copy but no featured
    const c = await getJournalContent();
    expect(c.featured.title).toBe('چگونه یک اتاق خواب آرامش‌بخش طراحی کنیم؟');
  });

  it('maps the featured article (date via formatJalaliNumeric) and copy from the global', async () => {
    mockFetchJournal.mockResolvedValueOnce({
      introTitle: 'هدلاین سفارشی',
      quoteText: 'نقل قول سفارشی',
      fullListHeading: 'عنوان فهرست',
      ctaTitle: 'تیتر بنر',
      ctaLabel: 'برچسب',
      ctaHref: '/x',
      ctaImage: { filename: 'cta.jpg' },
      featuredArticle: article({ title: 'مقاله ویژه', slug: 'feat' }),
      listArticles: [article({ id: 2, slug: 'a2' }), article({ id: 3, slug: 'a3' })],
      cardArticles: [article({ id: 4, slug: 'a4' })],
      categoryTabs: [{ name: 'سبک زندگی', slug: 'lifestyle' }],
    });
    const c = await getJournalContent();
    expect(c.intro).toBe('هدلاین سفارشی');
    expect(c.quote).toBe('نقل قول سفارشی');
    expect(c.fullListHeading).toBe('عنوان فهرست');
    expect(c.featured).toMatchObject({ title: 'مقاله ویژه', category: 'سبک زندگی', img: '/media/c.jpg', readingMinutes: 5, date: '۱۴۰۵/۰۱/۰۱', href: '/journal/feat' });
    expect(c.topList).toHaveLength(2);
    expect(c.cards).toHaveLength(1);
    expect(c.productCta).toMatchObject({ title: 'تیتر بنر', cta: 'برچسب', href: '/x', img: '/media/cta.jpg' });
    // tabs = «همه» + the curated category
    expect(c.tabs[0]).toMatchObject({ key: 'all', label: 'همه', href: '/journal' });
    expect(c.tabs[1]).toMatchObject({ label: 'سبک زندگی', href: '/journal/category/lifestyle' });
  });

  it('falls back to all journal categories for tabs when categoryTabs is empty', async () => {
    mockFetchCats.mockResolvedValueOnce([{ name: 'ترند', slug: 'trends' }]);
    mockFetchJournal.mockResolvedValueOnce({ featuredArticle: article(), listArticles: [], cardArticles: [] });
    const c = await getJournalContent();
    expect(mockFetchCats).toHaveBeenCalled();
    expect(c.tabs.map((t) => t.label)).toEqual(['همه', 'ترند']);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @zhic/web test -- journal-content`
Expected: FAIL — `getJournalContent` still returns `SEED` unconditionally; the mapping/fallback cases fail.

- [ ] **Step 3: Implement**

In `apps/web/src/lib/journal-content.ts`:

(a) Add to the top imports:

```ts
import { fetchJournal, fetchJournalCategories, mediaUrl, type PayloadArticle } from '@/lib/payload';
import { formatJalaliNumeric } from '@zhic/locale';
```

(b) Add two optional fields to the `JournalContent` type (after `quote`):

```ts
  /** Page headline override; when unset, JournalIntro renders its default bicolor. */
  intro?: string;
  /** «فهرست کامل» section heading. */
  fullListHeading?: string;
```

(c) Add `fullListHeading` to the `SEED` constant (leave `intro` unset so the default bicolor renders in fallback). Inside `SEED`, after `quote: '...',` add:

```ts
  fullListHeading: 'فهرست کامل',
```

(d) Replace the `getJournalContent` body (the `return SEED;`) with:

```ts
export async function getJournalContent(): Promise<JournalContent> {
  const g = await fetchJournal();
  if (!g || !g.featuredArticle) return SEED;

  const cats =
    g.categoryTabs && g.categoryTabs.length ? g.categoryTabs : await fetchJournalCategories();
  const tabs: JournalCategoryTab[] = [
    { key: 'all', label: 'همه', href: '/journal' },
    ...cats.map((cat) => ({ key: cat.slug, label: cat.name, href: `/journal/category/${cat.slug}` })),
  ];

  return {
    tabs,
    activeTab: 'all',
    intro: g.introTitle ?? undefined,
    featured: mapArticle(g.featuredArticle, 'featured'),
    topList: (g.listArticles ?? []).map((a, i) => mapArticle(a, `t${i}`)),
    quote: g.quoteText ?? SEED.quote,
    fullListHeading: g.fullListHeading ?? SEED.fullListHeading,
    cards: (g.cardArticles ?? []).map((a, i) => mapArticle(a, `c${i}`)),
    productCta: {
      title: g.ctaTitle ?? SEED.productCta.title,
      cta: g.ctaLabel ?? SEED.productCta.cta,
      href: g.ctaHref ?? SEED.productCta.href,
      img: mediaUrl(g.ctaImage) ?? SEED.productCta.img,
    },
  };
}

function mapArticle(a: PayloadArticle, key: string): JournalArticle {
  return {
    key,
    title: a.title,
    excerpt: a.excerpt ?? undefined,
    category: a.category?.name ?? '',
    img: mediaUrl(a.cover) ?? '',
    readingMinutes: a.readingTimeMinutes ?? 0,
    date: a.publishedAt ? formatJalaliNumeric(a.publishedAt) : undefined,
    href: `/journal/${a.slug}`,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @zhic/web test -- journal-content`
Expected: PASS — all 4 cases green.

- [ ] **Step 5: Typecheck**

Run: `pnpm --filter @zhic/web typecheck`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/journal-content.ts apps/web/src/lib/__tests__/journal-content.test.ts
git commit -m "feat(web): wire getJournalContent to the journal global with SEED fallback"
```

---

## Task 6: Parameterize `JournalIntro` + pass copy in `page.tsx`

**Files:**
- Modify: `apps/web/src/components/journal/JournalIntro.tsx`
- Modify: `apps/web/src/app/(site)/journal/page.tsx`

- [ ] **Step 1: Make `JournalIntro` accept an optional `title`**

Replace the body of `apps/web/src/components/journal/JournalIntro.tsx` with:

```tsx
import styles from './JournalIntro.module.css';

/**
 * Journal intro headline (Figma 227:497). Default: forest-green concept words
 * with gold connectors (brand copy). When a CMS `title` is provided, it renders
 * that text uniformly (forest), splitting on newlines into lines.
 */
export function JournalIntro({ title }: { title?: string }) {
  if (title) {
    const lines = title.split('\n');
    return (
      <p className={styles.intro}>
        {lines.map((line, i) => (
          <span key={i} className={styles.big}>
            {line}
            {i < lines.length - 1 ? <br /> : null}
          </span>
        ))}
      </p>
    );
  }
  return (
    <p className={styles.intro}>
      <span className={styles.big}>ایده‌ها</span>
      <span className={styles.small}> ، </span>
      <span className={styles.big}>راهنماها</span>
      <span className={styles.small}> و </span>
      <span className={styles.big}>ترندهای</span>
      <span className={styles.small}> دکوراسیون </span>
      <br />
      <span className={styles.small}>برای خانه‌ای که </span>
      <span className={styles.big}>دوستش</span>
      <span className={styles.small}> دارید</span>
    </p>
  );
}
```

- [ ] **Step 2: Pass `intro` + `fullListHeading` from the getter in `page.tsx`**

In `apps/web/src/app/(site)/journal/page.tsx`:
- change `<JournalIntro />` (line ~37) to:

```tsx
        <JournalIntro title={c.intro} />
```

- change `<JournalSectionHeading title="فهرست کامل" />` (line ~52) to:

```tsx
        <JournalSectionHeading title={c.fullListHeading ?? 'فهرست کامل'} />
```

- [ ] **Step 3: Typecheck + build**

Run: `pnpm --filter @zhic/web typecheck && pnpm --filter @zhic/web build`
Expected: both exit 0; `/journal` present in the route manifest.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/journal/JournalIntro.tsx "apps/web/src/app/(site)/journal/page.tsx"
git commit -m "feat(web): journal index renders CMS intro + full-list heading"
```

---

## Task 7: Document the `journal` global in `data-schemas.md`

**Files:**
- Modify: `docs/spec/data-schemas.md`

- [ ] **Step 1: Add a `journal` global section**

Open `docs/spec/data-schemas.md`. Find the journal collections area (§60 `articles` / §61 `authors` / §62 `journalCategories`, ~lines 1047–1120). Immediately after the `journalCategories` (§62) block, matching its heading style, add:

````markdown
### `journal` (global) — journal-index page config

Curates the `/journal` index. Article cards reference Articles (content lives on the Article); only page copy lives here. Added 2026-06-18.

| Field | Type | Notes |
| --- | --- | --- |
| `introTitle` | textarea | hero headline (newline = line break); empty → default brand headline |
| `featuredArticle` | relationship → `articles` | the big featured card; empty → whole page falls back to the static default |
| `listArticles` | relationship[] → `articles` | numbered list (rendered 02, 03 …), order preserved |
| `fullListHeading` | text | «فهرست کامل» section heading |
| `quoteText` | textarea | quote block |
| `cardArticles` | relationship[] → `articles` | the 2-up editorial cards, order preserved |
| `categoryTabs` | relationship[] → `journal-categories` | tab strip (after «همه»); empty → all categories |
| `ctaTitle` / `ctaLabel` / `ctaHref` | text | product-CTA banner copy + link |
| `ctaImage` | upload → media | product-CTA banner image |

Each referenced Article supplies the card's title / excerpt / cover / `category.name` / `readingTimeMinutes` / Jalali(`publishedAt`) / `/journal/<slug>`. DB: a `journal` table (scalar copy + `featured_article_id` + `cta_image_id` FK columns) and a `journal_rels` table for the hasMany relations (mirrors `home`/`home_rels`).
````

- [ ] **Step 2: Commit**

```bash
git add docs/spec/data-schemas.md
git commit -m "docs(schemas): document the journal global"
```

---

## Task 8: Final verification + state board + deploy

**Files:**
- Modify: `docs/state.md`

- [ ] **Step 1: Full static verification**

Run and confirm:
```bash
pnpm --filter @zhic/locale test
pnpm --filter @zhic/api typecheck    # only the pre-existing sharp error
pnpm --filter @zhic/web typecheck
pnpm --filter @zhic/web test -- journal-content   # 4 new cases pass
pnpm --filter @zhic/web build
```
Lint the changed files only (the repo has pre-existing lint noise in untouched files):
```bash
pnpm --filter @zhic/web exec eslint src/lib/journal-content.ts src/lib/__tests__/journal-content.test.ts src/components/journal/JournalIntro.tsx "src/app/(site)/journal/page.tsx"
pnpm --filter @zhic/api exec eslint src/globals/Journal.ts src/migrations/20260618_120000_create_journal_global.ts src/migrations/index.ts
```
Expected: all green (known pre-existing failures: `StatBlock.test.tsx`, the `sharp` api typecheck error — both unrelated).

- [ ] **Step 2: Update the state board**

Add a dated `2026-06-18` row near the top snapshot rows of `docs/state.md` summarizing: new `journal` global (curated slots + editorial copy), `journal`+`journal_rels` migration, `getJournalContent` now Payload-fed with SEED fallback, `formatJalaliNumeric` added to `@zhic/locale` (resolves FU-2.3-k), and the deploy result from Step 4. Note iron-equivalent: the page falls back to the static default until the operator fills the global. Refresh the `feat/journal-rebuild` line in the "Active branch" row.

- [ ] **Step 3: Commit**

```bash
git add docs/state.md
git commit -m "docs(state): log journal-index CMS wiring"
```

- [ ] **Step 4: Deploy to the box (operator-confirmed)**

This machine is the box (pm2 `zhic-api`/`zhic-web`). In order:
1. `pnpm -C services/api migrate` — applies `20260618_120000_create_journal_global` (additive, reversible).
2. `pnpm --filter @zhic/api generate:types` — **expected to fail** on the Node-24 `.js→.ts` boot bug; if so, skip (a stale `payload-types.ts` doesn't break runtime; the global config is the source of truth).
3. `pnpm --filter @zhic/api build && pnpm --filter @zhic/web build`.
4. `pm2 restart zhic-api zhic-web`; confirm both `online`.
5. Health-check: `curl /api/globals/journal?depth=2` → 200 with the new fields; `/journal` → 200 (renders the SEED default until the global is populated).
6. Operator then populates the `journal` global in the admin (pick featured + list + card articles, tabs, copy, CTA image) — the page switches from the default to the curated content.

---

## Self-review

**Spec/design coverage:**
- `journal` global (copy + curated slots) → Task 2. ✅
- Migration (journal + journal_rels, single-rel FK columns + hasMany rels) → Task 3. ✅
- `PayloadJournalGlobal` + `fetchJournal` → Task 4. ✅
- Getter mapping (article→card, copy, tabs, SEED fallback) → Task 5. ✅
- Numeric Jalali date for cards → Task 1 (`formatJalaliNumeric`). ✅
- Intro parameterized (default bicolor / CMS uniform) + heading wired → Task 6. ✅
- Docs → Task 7. ✅
- Verify + deploy → Task 8. ✅
- Out-of-scope items (detail/category/tag routes, font, chrome, micro-labels) — untouched. ✅

**Placeholder scan:** none — every step has full code + exact commands.

**Type consistency:** `PayloadJournalGlobal` field names (Task 4) match the global config field names (Task 2) and the getter's reads (Task 5). The getter maps `article.category.name`/`cover`/`readingTimeMinutes`/`publishedAt`/`slug` — all real `PayloadArticle` fields. `formatJalaliNumeric(iso, {digits})` signature (Task 1) matches its call in Task 5 and the test's expected `۱۴۰۵/۰۱/۰۱`. `JournalContent` gains `intro?`/`fullListHeading?` (Task 5) consumed in Task 6. DB column names (`featured_article_id`, `cta_image_id`, `journal_rels.articles_id`/`journal_categories_id`) mirror the `home`/`home_rels` precedent and the `articles`/`journal_categories` table names confirmed in the initial migration.
