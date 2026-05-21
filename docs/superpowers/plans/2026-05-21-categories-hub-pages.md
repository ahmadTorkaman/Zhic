# Categories Hub Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/categories/[slug]` from a thin grid into a full SEO-ranking hub page that handles both parent categories (~7) and leaf categories (~32), with editorial copy, a delicate right-side filter sidebar on desktop, a bottom-sheet drawer on mobile, plus a piggyback rework of `<SiteHeader>` for the whole site.

**Architecture:** One Next 16 App Router page (`apps/web/src/app/(site)/categories/[slug]/page.tsx`) branches on `category.parent === null`. Server components for everything except the mobile filter sheet (paired client components with shared state). Filter state lives in URL params; filtered URLs canonical to the unfiltered base with `robots: noindex,follow`. Animations reuse the existing `<BlurInText>` from `@zhic/ui`; a new `<FadeUp>` wraps non-text DOM blocks. Schema adds five Payload fields (`tagline`, `cover`, `intro`, `allowed_axes`, `rule`) via a hand-written migration following the existing pattern.

**Tech Stack:** Next 16 App Router + React 19 + TypeScript 5 + Tailwind v4 + Payload 3 + PostgreSQL + Vitest + Turborepo/pnpm workspaces. Persian-first RTL with Ayandeh font (already shipped).

**Spec:** `docs/superpowers/specs/2026-05-21-categories-hub-pages-design.md` — read sections 0–14 before starting.

**Visual mockups** (kept in sync with implementation):
- Leaf: `apps/web/public/docs/category-leaf-mockup.html`
- Parent: `apps/web/public/docs/category-parent-mockup.html`

---

## Phase 0: Pre-flight

Before starting Task 1, verify the working environment:

```bash
cd /home/ahmad/Zhic
git status                            # should be clean (no uncommitted work)
git log --oneline -3                  # confirm 05cc1a3 (spec commit) is HEAD
pnpm --filter @zhic/api migrate:status # all migrations applied
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/  # 200 = web dev/prod server up
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/  # 200 = Payload API up
```

If any check fails, stop and report. **Do not proceed with a dirty working tree or with services down.**

Create the working branch:

```bash
git checkout -b feat/categories-hub-pages
```

---

## Phase 1: Schema + migration

Goal: new fields on the Categories collection, one hand-written Postgres migration, applied cleanly.

### Task 1: Add new fields to the Categories collection

**Files:**
- Modify: `services/api/src/collections/Categories.ts`
- Test: `services/api/src/__tests__/categories.test.ts` (new)

- [ ] **Step 1: Read the current file**

```bash
cat services/api/src/collections/Categories.ts
```

Note the existing structure: `slug` ('categories'), `useAsTitle: 'name'`, `publishedContentAccess`, `beforeValidate` array with one `slugify` hook, fields list `[name, slug, description, parent, seoFields]`.

- [ ] **Step 2: Write the failing test for the parent-cover-required hook**

Create `services/api/src/__tests__/categories.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { Categories } from '../collections/Categories';

describe('Categories.beforeValidate parent-cover-required', () => {
  // Find the cover-required hook (second beforeValidate hook).
  const hooks = Categories.hooks?.beforeValidate ?? [];
  // Hook order: [slugify, parentCoverRequired]
  const coverRequired = hooks[1];

  it('throws when parent (parent=null) has no cover', () => {
    if (!coverRequired) throw new Error('parentCoverRequired hook missing');
    expect(() =>
      coverRequired({ data: { name: 'تخت‌ها', parent: null, cover: null }, operation: 'create' } as never)
    ).toThrow();
  });

  it('passes when parent has a cover', () => {
    if (!coverRequired) throw new Error('parentCoverRequired hook missing');
    expect(() =>
      coverRequired({ data: { name: 'تخت‌ها', parent: null, cover: 7 }, operation: 'create' } as never)
    ).not.toThrow();
  });

  it('passes when leaf (parent set) has no cover', () => {
    if (!coverRequired) throw new Error('parentCoverRequired hook missing');
    expect(() =>
      coverRequired({ data: { name: 'تخت دونفره', parent: 3, cover: null }, operation: 'create' } as never)
    ).not.toThrow();
  });

  it('skips hook on delete operations', () => {
    if (!coverRequired) throw new Error('parentCoverRequired hook missing');
    expect(() =>
      coverRequired({ data: { name: 'تخت‌ها', parent: null, cover: null }, operation: 'delete' } as never)
    ).not.toThrow();
  });
});
```

- [ ] **Step 3: Run the test — expect failure**

```bash
pnpm --filter @zhic/api vitest run src/__tests__/categories.test.ts
```

Expected: 4 failures (hook does not exist yet — `hooks[1]` is undefined). The test file imports from `../collections/Categories` and Vitest in the API workspace should be added if not present.

If vitest is not configured in `@zhic/api`, do this BEFORE proceeding:

```bash
pnpm --filter @zhic/api add -D vitest@^2.1.8
```

Add to `services/api/package.json` scripts: `"test": "vitest run"`. Re-run the test.

- [ ] **Step 4: Implement — extend Categories.ts with the five new fields + the hook**

Edit `services/api/src/collections/Categories.ts`. After line 23 (the slugify hook closing brace `},`), inside the same `beforeValidate` array, append the parentCoverRequired hook. Then expand the fields array to include the five new fields BETWEEN `description` (existing) and `parent` (existing).

Final file should look like:

```ts
import type { CollectionConfig } from 'payload'
import { slugify } from '../lib/slugify'
import { publishedContentAccess } from '../lib/access'
import { seoFields } from '../fields/seoFields'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'دسته‌بندی', plural: 'دسته‌بندی‌ها' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'parent', 'slug'],
    group: 'کاتالوگ',
  },
  access: publishedContentAccess,
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data?.name && !data?.slug) {
          data.slug = slugify(data.name as string)
        }
        return data
      },
      ({ data, operation }) => {
        // Conditional required: parent categories MUST have a cover image.
        // Leaves can fall back to the first product's first gallery image.
        if (operation === 'delete') return data
        if (!data) return data
        const isParent = data.parent == null
        if (isParent && !data.cover) {
          throw new Error('برای دسته‌بندی parent، تصویر hero الزامی است.')
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'نام دسته‌بندی',
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      label: 'اسلاگ',
      admin: {
        position: 'sidebar',
        description: 'Auto-generated from name if left empty',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'توضیحات کوتاه',
      admin: {
        description: 'یک خط برای متاتگ / SEO. متن طولانی hub در فیلد «مقدمه» می‌رود.',
      },
    },
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
          'از xlsx برای leaf‌ها: size, footboard, doors, drawers, glass, width, pieces. برای parent‌ها خالی می‌ماند.',
      },
    },
    {
      name: 'rule',
      type: 'textarea',
      label: 'قواعد واریانت',
      admin: {
        description: 'از xlsx: یادداشت داخلی. روی صفحه‌ی عمومی نمایش داده نمی‌شود.',
      },
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      label: 'دسته‌بندی والد',
      admin: {
        position: 'sidebar',
        description: 'برای ساخت ساختار درختی (اختیاری برای parent‌ها، الزامی برای leaf‌ها)',
      },
    },
    seoFields,
  ],
}
```

- [ ] **Step 5: Run the test — expect pass**

```bash
pnpm --filter @zhic/api vitest run src/__tests__/categories.test.ts
```

Expected: 4 passed.

- [ ] **Step 6: Typecheck**

```bash
pnpm --filter @zhic/api typecheck
```

Expected: clean. The new fields use existing Payload types.

- [ ] **Step 7: Commit**

```bash
git add services/api/src/collections/Categories.ts services/api/src/__tests__/categories.test.ts services/api/package.json services/api/pnpm-lock.yaml 2>/dev/null
git commit -m "$(cat <<'EOF'
feat(categories): add hub-page fields + parent-cover-required hook

Extend the Categories collection with tagline, cover, intro (richText),
allowed_axes (text[]), and rule (textarea). Add a second beforeValidate
hook that enforces cover on parent categories (parent === null). Leaves
fall back to the first product's first gallery image at render time.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Hand-write the migration

**Files:**
- Create: `services/api/src/migrations/20260521_180000_add_category_hub_fields.ts`

- [ ] **Step 1: Determine the timestamp**

Use `date -u +"%Y%m%d_%H%M%S"` to get a UTC timestamp. For consistency with this plan, use `20260521_180000`. Adjust if there's a collision with a newer migration.

- [ ] **Step 2: Write the migration file**

Create `services/api/src/migrations/20260521_180000_add_category_hub_fields.ts`:

```ts
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Add five new fields to the categories table for the hub-page rework
 * (sub-project D of the products overhaul).
 *
 *   - tagline       varchar               nullable
 *   - cover_id      integer FK→media.id   nullable (parent-required enforced at hook level)
 *   - intro         jsonb (Lexical)       nullable
 *   - rule          text                  nullable
 *   - allowed_axes  text[]                via Payload's `hasMany: true` → child table
 *
 * Pattern mirrors 20260516_224611_add_design_editorial_fields.ts.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "categories"
      ADD COLUMN IF NOT EXISTS "tagline" varchar,
      ADD COLUMN IF NOT EXISTS "cover_id" integer,
      ADD COLUMN IF NOT EXISTS "intro" jsonb,
      ADD COLUMN IF NOT EXISTS "rule" text;

    DO $$ BEGIN
      ALTER TABLE "categories"
        ADD CONSTRAINT "categories_cover_id_media_id_fk"
        FOREIGN KEY ("cover_id")
        REFERENCES "media"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "categories_allowed_axes" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "value" varchar
    );

    DO $$ BEGIN
      ALTER TABLE "categories_allowed_axes"
        ADD CONSTRAINT "categories_allowed_axes_parent_id_fk"
        FOREIGN KEY ("_parent_id")
        REFERENCES "categories"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "categories_allowed_axes_order_parent_idx"
      ON "categories_allowed_axes" USING btree ("_order", "_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "categories_allowed_axes";

    ALTER TABLE "categories"
      DROP CONSTRAINT IF EXISTS "categories_cover_id_media_id_fk",
      DROP COLUMN IF EXISTS "tagline",
      DROP COLUMN IF EXISTS "cover_id",
      DROP COLUMN IF EXISTS "intro",
      DROP COLUMN IF EXISTS "rule";
  `)
}
```

- [ ] **Step 3: Smoke-check the SQL syntax (no DB write)**

Run the file through tsc only — DDL execution happens in Task 3:

```bash
pnpm --filter @zhic/api typecheck
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add services/api/src/migrations/20260521_180000_add_category_hub_fields.ts
git commit -m "$(cat <<'EOF'
feat(categories): migration adds hub-page fields to categories table

tagline, cover_id (FK→media), intro (jsonb), rule, and the
categories_allowed_axes child table for the text[] hasMany field.
Mirrors the 20260516 design-editorial-fields migration pattern.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Register migration in index + apply to DB

**Files:**
- Modify: `services/api/src/migrations/index.ts`

- [ ] **Step 1: Register the migration**

Edit `services/api/src/migrations/index.ts`. Add the import at the top:

```ts
import * as migration_20260521_180000_add_category_hub_fields from './20260521_180000_add_category_hub_fields';
```

Add the entry at the END of the `migrations` array:

```ts
  {
    up: migration_20260521_180000_add_category_hub_fields.up,
    down: migration_20260521_180000_add_category_hub_fields.down,
    name: '20260521_180000_add_category_hub_fields'
  },
```

- [ ] **Step 2: Apply the migration**

```bash
pnpm --filter @zhic/api migrate
```

Expected output ends with: `Migration completed in <ms>ms` and lists the new migration name.

- [ ] **Step 3: Verify in the database**

```bash
psql -h localhost -p 5432 -U postgres -d zhic -c "\d categories" 2>&1 | head -30
psql -h localhost -p 5432 -U postgres -d zhic -c "\d categories_allowed_axes" 2>&1
```

Adjust connection string to match `services/api/.env` `POSTGRES_URL`. Expected: `tagline`, `cover_id`, `intro`, `rule` listed on `categories`; `categories_allowed_axes` table exists with `_order`, `_parent_id`, `id`, `value` columns.

- [ ] **Step 4: Regenerate Payload types**

```bash
pnpm --filter @zhic/api generate:types
```

Expected: `services/api/src/payload-types.ts` updated with the new fields on the `Category` interface.

- [ ] **Step 5: Typecheck the whole monorepo**

```bash
pnpm typecheck
```

Expected: clean. If `apps/web` fails because `PayloadCategory` doesn't yet have the new fields, that's expected — fixed in Task 8.

- [ ] **Step 6: Commit**

```bash
git add services/api/src/migrations/index.ts services/api/src/payload-types.ts
git commit -m "$(cat <<'EOF'
chore(categories): register hub-fields migration + regenerate types

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Seed updates for the demo parent + leaf

**Files:**
- Modify: `services/api/src/seed.ts`

- [ ] **Step 1: Read existing seed**

```bash
grep -n "name: 'تخت'\|categories:\|name: 'آینه" services/api/src/seed.ts
```

Identify the existing seeded category records and where they're created (the upserts that produce `categories` rows).

- [ ] **Step 2: Add the `mirrors` PARENT seed**

In `seed.ts`, find the categories seeding block (it'll be near the materials and products blocks). Add a new entry for the `mirrors` parent — `parent: null`, with the new fields populated:

```ts
{
  name: 'آینه‌ها',
  slug: 'mirrors',
  description: 'آینه‌های ژیک در هفت زیرنوع — برای هر گوشه‌ی خانه.',
  tagline: 'انعکاسی از سکوت — هفت زبان، یک تأمل',
  cover: mirrorsCoverMediaId, // existing media or upload a placeholder
  intro: {
    root: {
      type: 'root',
      version: 1,
      children: [
        {
          type: 'paragraph',
          version: 1,
          children: [
            {
              type: 'text',
              text: 'آینه در فلسفه‌ی ژیک سطحی برای انعکاس نیست؛ سطحی است که با کنار رفتن، فضا را بازتر می‌کند. ما هفت زیرنوع آینه می‌سازیم — از آینه‌ی دیواری ساده تا آینه‌ی قدی تمام‌قد و آینه‌ی روی دراور — و هر کدام را در پنج طرح از مجموعه‌های گندم، باروت، لوتوس، سنتو و الیزابت ارائه می‌دهیم.',
            },
          ],
        },
        {
          type: 'paragraph',
          version: 1,
          children: [
            {
              type: 'text',
              text: 'قاب‌ها همگی از روکش طبیعی گردو یا راش‌اند، با تراش دستی، و در نسبت‌های طلایی برش می‌خورند.',
            },
          ],
        },
      ],
    },
  },
  parent: null,
  allowed_axes: [],
},
```

If `mirrorsCoverMediaId` is not yet a seeded media row, add a media upsert above this block referencing one of the existing seed image URLs.

- [ ] **Step 3: Add the `wall-mirror` LEAF seed**

Below the parent, add:

```ts
{
  name: 'آینه دیواری',
  slug: 'wall-mirror',
  description: 'آینه‌های دیواری ژیک — قاب چوب گردو، در سه اندازه و پنج طرح.',
  tagline: 'انعکاسی برای دیوار، با ساده‌ترین خط‌ها',
  cover: null, // optional on leaves — falls back at render
  intro: {
    root: {
      type: 'root',
      version: 1,
      children: [
        {
          type: 'paragraph',
          version: 1,
          children: [
            {
              type: 'text',
              text: 'آینه‌های دیواری ژیک از پاسخی به یک نیاز ساده آغاز می‌شوند: فضایی که با نور بازی کند، بی‌آنکه سطح را اشغال کند. هر آینه با تراش دستی قاب چوب گردو، در سه اندازه‌ی استاندارد و در پنج طرح از مجموعه‌های گندم، باروت، لوتوس، سنتو و الیزابت ساخته می‌شود.',
            },
          ],
        },
        {
          type: 'paragraph',
          version: 1,
          children: [
            {
              type: 'text',
              text: 'قاب‌ها از روکش طبیعی گردو و راش انتخاب می‌شوند؛ آینه با ضدبخاری مات و سطح بدون لک تولید می‌شود.',
            },
          ],
        },
      ],
    },
  },
  parent: mirrorsCategoryId, // upsert returns this id
  allowed_axes: ['size'],
  rule: 'use where size variant exists',
},
```

Wire the upsert order so `mirrors` is created BEFORE `wall-mirror` (so `mirrorsCategoryId` is available).

- [ ] **Step 4: Run the seed**

```bash
pnpm --filter @zhic/api seed
```

Expected: seed completes without errors. New categories appear.

- [ ] **Step 5: Verify in the database**

```bash
psql -h localhost -p 5432 -U postgres -d zhic -c \
  "SELECT id, slug, name, parent_id, tagline FROM categories WHERE slug IN ('mirrors','wall-mirror') ORDER BY parent_id NULLS FIRST;"
```

Expected: 2 rows. `mirrors` has `parent_id = NULL`; `wall-mirror` has `parent_id = <mirrors.id>`.

- [ ] **Step 6: Commit**

```bash
git add services/api/src/seed.ts
git commit -m "$(cat <<'EOF'
feat(seed): mirrors parent + wall-mirror leaf with hub fields

Demo data so the new /categories/[slug] template renders meaningfully
out of the box. Full xlsx-import seed lives in sub-project B.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 2: Shared FadeUp component

### Task 5: `<FadeUp>` in `packages/ui`

**Files:**
- Create: `packages/ui/src/FadeUp.tsx`
- Modify: `packages/ui/src/index.ts`
- Test: `packages/ui/src/__tests__/FadeUp.test.tsx` (new)

- [ ] **Step 1: Add the test**

Create `packages/ui/src/__tests__/FadeUp.test.tsx`:

```tsx
/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { FadeUp } from '../FadeUp';

describe('<FadeUp>', () => {
  it('renders children inside the chosen wrapper tag', () => {
    const { container } = render(
      <FadeUp as="section" className="my-cls">hello</FadeUp>
    );
    const el = container.querySelector('section.my-cls');
    expect(el).not.toBeNull();
    expect(el!.textContent).toBe('hello');
  });

  it('defaults to a div wrapper', () => {
    const { container } = render(<FadeUp>x</FadeUp>);
    expect(container.querySelector('div')).not.toBeNull();
  });

  it('applies the transitionDelay style from the delay prop', () => {
    const { container } = render(<FadeUp delay={250}>x</FadeUp>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.transitionDelay).toBe('250ms');
  });
});
```

If `packages/ui` doesn't have `vitest` + `@testing-library/react` + `jsdom` installed yet, add them:

```bash
pnpm --filter @zhic/ui add -D vitest@^2.1.8 @testing-library/react jsdom
```

Add to `packages/ui/package.json` scripts: `"test": "vitest run"`.

- [ ] **Step 2: Run the test — expect failure**

```bash
pnpm --filter @zhic/ui vitest run src/__tests__/FadeUp.test.tsx
```

Expected: 3 failures (FadeUp does not exist).

- [ ] **Step 3: Implement FadeUp**

Create `packages/ui/src/FadeUp.tsx`:

```tsx
'use client';

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type PropsWithChildren,
  createElement,
} from 'react';

export type FadeUpProps = PropsWithChildren<{
  /** Delay in ms before this element starts animating. Useful for stagger. */
  delay?: number;
  /** Forwarded to the wrapper. */
  className?: string;
  /** Wrapping HTML tag. Default 'div'. */
  as?: ElementType;
}>;

/**
 * Whole-block come-up fade-in. Triggered the first time the element
 * crosses 15% of viewport. Once revealed, observation is dropped.
 *
 * Reduced-motion users see the content instantly with no transition.
 * Match BlurInText's 700ms cubic-bezier(0.22, 1, 0.36, 1) curve for
 * site-wide consistency.
 */
export function FadeUp({
  children,
  delay = 0,
  className,
  as = 'div',
}: FadeUpProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            io.unobserve(el);
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const style: CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(16px)',
    transition:
      'opacity 700ms cubic-bezier(0.22, 1, 0.36, 1), transform 700ms cubic-bezier(0.22, 1, 0.36, 1)',
    transitionDelay: `${delay}ms`,
    willChange: visible ? 'auto' : 'opacity, transform',
  };

  return createElement(as, { ref, className, style }, children);
}
```

- [ ] **Step 4: Export from the package index**

Edit `packages/ui/src/index.ts`. Add (alongside `BlurInText` exports):

```ts
export { FadeUp } from './FadeUp';
export type { FadeUpProps } from './FadeUp';
```

- [ ] **Step 5: Run the test — expect pass**

```bash
pnpm --filter @zhic/ui vitest run src/__tests__/FadeUp.test.tsx
```

Expected: 3 passed.

- [ ] **Step 6: Typecheck the whole monorepo**

```bash
pnpm typecheck
```

Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/FadeUp.tsx packages/ui/src/index.ts packages/ui/src/__tests__/FadeUp.test.tsx packages/ui/package.json
git commit -m "$(cat <<'EOF'
feat(ui): FadeUp component for come-up entrance animations

Whole-block opacity + translateY(16px → 0) on scroll-into-view, matching
BlurInText's 700ms cubic-bezier(0.22, 1, 0.36, 1) curve. Reduced-motion
short-circuits to instant. Used by /categories hub pages for callout
blocks and section headers.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 3: SiteHeader rework (piggyback)

### Task 6: 1fr / auto / 1fr grid + SVG icons in SiteHeader

**Files:**
- Modify: `apps/web/src/components/layout/SiteHeader.tsx` (or whatever the live header component is — verify the path first)
- Test: visual + smoke; this is hard to unit-test meaningfully.

- [ ] **Step 1: Locate the live header**

```bash
find apps/web/src/components/layout -name "*Header*" -o -name "*site*header*"
grep -rn "ژیک" apps/web/src/components/layout 2>/dev/null | head
```

Identify the file. The mockup uses `.pill-header` but the real component name may differ. If multiple files match, find the one rendered by `apps/web/src/app/(site)/layout.tsx`.

- [ ] **Step 2: Read the current implementation**

```bash
cat apps/web/src/components/layout/<header-file>.tsx
```

Note: existing grid template, icon source (emoji vs `lucide-react` vs inline SVG), where the «ژیک» brand sits, the underline pattern.

- [ ] **Step 3: Apply the grid change**

Change `grid-template-columns: auto 1fr auto` → `1fr auto 1fr`. Add `justify-self: start | center | end` to brand / nav / icons respectively. RTL-aware (already RTL via root `dir="rtl"`).

Replace any emoji icons (`🔍`, `♡`, etc.) with inline stroke SVG:

```tsx
{/* Search */}
<button className="..." aria-label="جستجو">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
       className="h-[18px] w-[18px]">
    <circle cx="11" cy="11" r="7.5" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
</button>

{/* Wishlist heart */}
<button className="..." aria-label="علاقه‌مندی‌ها">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
       className="h-[18px] w-[18px]">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
</button>
```

Wrap each icon button in a 36×36 circular hover affordance (Tailwind: `h-9 w-9 inline-flex items-center justify-center rounded-full text-stone transition-colors hover:bg-sand/40 hover:text-ink`).

- [ ] **Step 4: Verify in browser — desktop**

Restart Next:

```bash
pm2 restart zhic-web --update-env
```

Wait for ready:

```bash
until curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ | grep -q 200; do sleep 1; done; echo "ready"
```

Open http://80.240.31.146:3000/ in the browser. Verify:
1. «ژیک» logo on the visual RIGHT (RTL start).
2. Nav text mathematically centered in the bar.
3. Search + heart SVG icons on the visual LEFT (RTL end), with circular hover state.

- [ ] **Step 5: Visual regression sweep — other pages**

Open in the browser and visually confirm no breakage:
- `/` (home)
- `/products`
- `/products/<any-existing-product-slug>` (find one with `curl -s http://localhost:3001/api/products?limit=1 | jq -r '.docs[0].slug'`)
- `/designs`
- `/designs/<any-existing-design-slug>` (`curl -s http://localhost:3001/api/designs?limit=1 | jq -r '.docs[0].slug'`)
- `/journal`
- `/showrooms`
- `/about`

For each: brand-right ✓, nav-center ✓, icons-left ✓, no overflow on the pill at mobile widths (resize browser to 375px and check).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/layout/<header-file>.tsx
git commit -m "$(cat <<'EOF'
feat(header): center nav with 1fr/auto/1fr grid; inline SVG icons

Replaces auto/1fr/auto grid (nav drifted off-center because of unequal
brand vs icons widths) with 1fr/auto/1fr + justify-self per column —
nav now sits at mathematical center. Search and wishlist emoji icons
replaced with inline stroke SVGs in 36×36 circular hover buttons.
Visual regression sweep across all public pages passed.

Site-wide change — included here because /categories hub design pulled
it forward (operator preference confirmed 2026-05-21).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 4: Fetchers + types in `apps/web/src/lib/payload.ts`

### Task 7: Extend `PayloadCategory` type + small pure helpers

**Files:**
- Modify: `apps/web/src/lib/payload.ts` (PayloadCategory type, ~line 192)
- Create: `apps/web/src/lib/category-helpers.ts`
- Test: `apps/web/src/lib/__tests__/category-helpers.test.ts` (new)

- [ ] **Step 1: Extend the type**

In `apps/web/src/lib/payload.ts`, find the `PayloadCategory` type around line 192 and extend it:

```ts
export type PayloadCategory = {
  id: string | number;
  name: string;
  slug: string;
  description?: string | null;
  // NEW fields (sub-project D):
  tagline?: string | null;
  cover?: PayloadMedia | null;
  intro?: LexicalRoot | null;
  allowed_axes?: string[] | null;
  rule?: string | null;
  // existing:
  parent?: PayloadCategory | string | number | null;
  seo?: PayloadSeo | null;
  updatedAt?: string;
};
```

If `LexicalRoot` is not exported from the file, import it (it's already used by `PayloadArticle.body` — find the existing import).

- [ ] **Step 2: Write tests for the pure helpers**

Create `apps/web/src/lib/__tests__/category-helpers.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  deriveDescriptionFromIntro,
  buildCrumbs,
  countActiveFilters,
} from '../category-helpers';
import type { PayloadCategory } from '../payload';

describe('deriveDescriptionFromIntro', () => {
  it('returns null when intro is null', () => {
    expect(deriveDescriptionFromIntro(null)).toBeNull();
  });
  it('extracts plain text from the first paragraph', () => {
    const intro = {
      root: {
        type: 'root', version: 1,
        children: [
          { type: 'paragraph', version: 1, children: [{ type: 'text', text: 'سلام دنیا.' }] },
          { type: 'paragraph', version: 1, children: [{ type: 'text', text: 'پاراگراف دوم.' }] },
        ],
      },
    };
    expect(deriveDescriptionFromIntro(intro as never)).toBe('سلام دنیا.');
  });
  it('truncates at 160 chars with ellipsis', () => {
    const longText = 'الف'.repeat(200);
    const intro = {
      root: {
        type: 'root', version: 1,
        children: [{ type: 'paragraph', version: 1, children: [{ type: 'text', text: longText }] }],
      },
    };
    const out = deriveDescriptionFromIntro(intro as never);
    expect(out).not.toBeNull();
    expect(out!.length).toBeLessThanOrEqual(161);
    expect(out!.endsWith('…')).toBe(true);
  });
});

describe('buildCrumbs', () => {
  it('returns 3-item chain for parent categories', () => {
    const cat: Partial<PayloadCategory> = { name: 'آینه‌ها', slug: 'mirrors', parent: null };
    const crumbs = buildCrumbs(cat as PayloadCategory);
    expect(crumbs).toHaveLength(3);
    expect(crumbs[0]).toEqual({ label: 'خانه', href: '/' });
    expect(crumbs[1]).toEqual({ label: 'محصولات', href: '/products' });
    expect(crumbs[2]).toEqual({ label: 'آینه‌ها' });
  });
  it('returns 4-item chain for leaves', () => {
    const cat: Partial<PayloadCategory> = {
      name: 'آینه دیواری',
      slug: 'wall-mirror',
      parent: { id: 1, name: 'آینه‌ها', slug: 'mirrors' } as PayloadCategory,
    };
    const crumbs = buildCrumbs(cat as PayloadCategory);
    expect(crumbs).toHaveLength(4);
    expect(crumbs[2]).toEqual({ label: 'آینه‌ها', href: '/categories/mirrors' });
    expect(crumbs[3]).toEqual({ label: 'آینه دیواری' });
  });
});

describe('countActiveFilters', () => {
  it('returns 0 for no filter params', () => {
    expect(countActiveFilters({})).toBe(0);
    expect(countActiveFilters({ page: '2' })).toBe(0); // page is not a filter
    expect(countActiveFilters({ sort: 'newest' })).toBe(0); // default sort is not a filter
  });
  it('counts non-default sort + design + material + size', () => {
    expect(countActiveFilters({ sort: 'price_asc', design: 'gandom', material: 'walnut' })).toBe(3);
  });
});
```

- [ ] **Step 3: Run the test — expect failure**

```bash
pnpm --filter @zhic/web vitest run src/lib/__tests__/category-helpers.test.ts
```

Expected: module not found (`category-helpers` doesn't exist).

- [ ] **Step 4: Implement**

Create `apps/web/src/lib/category-helpers.ts`:

```ts
import type { PayloadCategory } from './payload';

type Crumb = { label: string; href?: string };
type LexicalNode = { type?: string; text?: string; children?: LexicalNode[] };
type LexicalRoot = { root?: { children?: LexicalNode[] } };

const MAX_META_DESC = 160;

/**
 * Extract a plaintext description from a Lexical intro. Walks the first
 * paragraph node's text children, concatenates them, trims, and (if longer
 * than 160 chars) truncates at the previous word boundary appending "…".
 *
 * Returns null when intro is null, empty, or has no first paragraph.
 */
export function deriveDescriptionFromIntro(intro: LexicalRoot | null | undefined): string | null {
  if (!intro?.root?.children?.length) return null;
  const firstPara = intro.root.children.find((c) => c.type === 'paragraph');
  if (!firstPara?.children?.length) return null;
  const flat = (firstPara.children ?? [])
    .map((c) => (typeof c.text === 'string' ? c.text : ''))
    .join('')
    .trim();
  if (!flat) return null;
  if (flat.length <= MAX_META_DESC) return flat;
  const slice = flat.slice(0, MAX_META_DESC);
  const cut = slice.lastIndexOf(' ');
  return (cut > 0 ? slice.slice(0, cut) : slice) + '…';
}

/**
 * Build the breadcrumb chain for a category page.
 * - Parent: 3 items — Home / Products / <current>
 * - Leaf:   4 items — Home / Products / <parent> / <current>
 *
 * The current item never has an href (it's the page we're on).
 */
export function buildCrumbs(category: PayloadCategory): Crumb[] {
  const base: Crumb[] = [
    { label: 'خانه', href: '/' },
    { label: 'محصولات', href: '/products' },
  ];
  // parent is either null (this IS a parent), a relation object, or just an id/string.
  if (!category.parent || typeof category.parent !== 'object') {
    return [...base, { label: category.name }];
  }
  return [
    ...base,
    { label: category.parent.name, href: `/categories/${category.parent.slug}` },
    { label: category.name },
  ];
}

const FILTER_KEYS = ['design', 'material', 'size'] as const;
const DEFAULT_SORT = 'newest';

/**
 * Count how many *filter* params are active in the searchParams object.
 * `page` and the default sort are NOT counted (paging is navigation;
 * the default sort doesn't change the result set).
 */
export function countActiveFilters(sp: Record<string, string | string[] | undefined>): number {
  let n = 0;
  for (const key of FILTER_KEYS) {
    const v = sp[key];
    if (typeof v === 'string' && v.length > 0) n++;
    if (Array.isArray(v) && v.some((x) => x?.length > 0)) n++;
  }
  const sort = sp.sort;
  if (typeof sort === 'string' && sort.length > 0 && sort !== DEFAULT_SORT) n++;
  return n;
}
```

- [ ] **Step 5: Run the test — expect pass**

```bash
pnpm --filter @zhic/web vitest run src/lib/__tests__/category-helpers.test.ts
```

Expected: 8 passed.

- [ ] **Step 6: Typecheck**

```bash
pnpm --filter @zhic/web typecheck
```

Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/lib/payload.ts apps/web/src/lib/category-helpers.ts apps/web/src/lib/__tests__/category-helpers.test.ts
git commit -m "$(cat <<'EOF'
feat(categories): extend PayloadCategory + add helpers

PayloadCategory gets tagline, cover, intro, allowed_axes, rule fields.
Three pure helpers shared across the hub page implementation:
  - deriveDescriptionFromIntro: Lexical → ~160-char plaintext for SEO
  - buildCrumbs: 3-item (parent) or 4-item (leaf) breadcrumb chain
  - countActiveFilters: counts non-default filter params, used by the
    mobile filter trigger badge and the noindex robots decision.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: New category fetchers

**Files:**
- Modify: `apps/web/src/lib/payload.ts` (add new exported functions)
- Test: `apps/web/src/lib/__tests__/category-fetchers.test.ts` (new — mocks `payloadFetch`)

- [ ] **Step 1: Write tests with mocks**

Create `apps/web/src/lib/__tests__/category-fetchers.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock payloadFetch BEFORE importing the module under test.
const mockPayloadFetch = vi.fn();
vi.mock('../payload-internal', () => ({
  payloadFetch: (...args: unknown[]) => mockPayloadFetch(...args),
}));

import {
  fetchChildCategories,
  fetchSiblingCategories,
  fetchSiblingParents,
  fetchDesignsForCategory,
  fetchAvailableDesigns,
  fetchAvailableMaterials,
} from '../category-fetchers';

beforeEach(() => mockPayloadFetch.mockReset());

describe('fetchChildCategories', () => {
  it('queries by parent id and returns docs', async () => {
    mockPayloadFetch.mockResolvedValueOnce({
      docs: [{ id: 2, slug: 'wall-mirror', name: 'آینه دیواری' }],
      totalDocs: 1, page: 1, totalPages: 1, limit: 50,
    });
    const out = await fetchChildCategories(1);
    expect(out).toHaveLength(1);
    expect(out[0].slug).toBe('wall-mirror');
    const [url] = mockPayloadFetch.mock.calls[0];
    expect(url).toContain('where[parent][equals]=1');
  });
  it('returns [] on null response', async () => {
    mockPayloadFetch.mockResolvedValueOnce(null);
    expect(await fetchChildCategories(1)).toEqual([]);
  });
});

describe('fetchSiblingCategories', () => {
  it('queries other leaves under same parent, excluding current', async () => {
    mockPayloadFetch.mockResolvedValueOnce({
      docs: [{ id: 3, slug: 'round-mirror', name: 'آینه گرد' }],
      totalDocs: 1, page: 1, totalPages: 1, limit: 4,
    });
    const out = await fetchSiblingCategories(1, 2);
    expect(out).toHaveLength(1);
    const [url] = mockPayloadFetch.mock.calls[0];
    expect(url).toContain('where[parent][equals]=1');
    expect(url).toContain('where[id][not_equals]=2');
    expect(url).toContain('limit=4');
  });
});

describe('fetchSiblingParents', () => {
  it('queries top-level categories excluding current', async () => {
    mockPayloadFetch.mockResolvedValueOnce({
      docs: [{ id: 4, slug: 'beds', name: 'تخت‌ها' }],
      totalDocs: 1, page: 1, totalPages: 1, limit: 4,
    });
    await fetchSiblingParents(1);
    const [url] = mockPayloadFetch.mock.calls[0];
    expect(url).toContain('where[parent][exists]=false');
    expect(url).toContain('where[id][not_equals]=1');
  });
});

describe('fetchDesignsForCategory (two-step join)', () => {
  it('first fetches products in category, then designs by those design ids', async () => {
    mockPayloadFetch
      .mockResolvedValueOnce({
        docs: [
          { id: 'p1', design: { id: 'd1' } },
          { id: 'p2', design: { id: 'd2' } },
          { id: 'p3', design: { id: 'd1' } }, // duplicate design
        ],
        totalDocs: 3, page: 1, totalPages: 1, limit: 200,
      })
      .mockResolvedValueOnce({
        docs: [
          { id: 'd1', slug: 'gandom', name: 'گندم' },
          { id: 'd2', slug: 'baloot', name: 'باروت' },
        ],
        totalDocs: 2, page: 1, totalPages: 1, limit: 10,
      });
    const out = await fetchDesignsForCategory('wall-mirror');
    expect(out).toHaveLength(2);
    expect(out.map((d) => d.slug).sort()).toEqual(['baloot', 'gandom']);
    const [step1Url] = mockPayloadFetch.mock.calls[0];
    expect(step1Url).toContain('where[categoryIds.slug][equals]=wall-mirror');
    const [step2Url] = mockPayloadFetch.mock.calls[1];
    expect(step2Url).toContain('where[id][in]=d1,d2');
  });
  it('returns [] when no products', async () => {
    mockPayloadFetch.mockResolvedValueOnce({ docs: [], totalDocs: 0, page: 1, totalPages: 0, limit: 200 });
    expect(await fetchDesignsForCategory('wall-mirror')).toEqual([]);
    expect(mockPayloadFetch).toHaveBeenCalledTimes(1); // skips step 2
  });
});
```

- [ ] **Step 2: Decide on the module split**

The existing `payload.ts` is large. To make the new fetchers testable in isolation **and** keep `payload.ts` clean, extract `payloadFetch` to its own module and import it in both old and new fetchers.

```bash
grep -n "^async function payloadFetch\|^export async function payloadFetch" apps/web/src/lib/payload.ts
```

- [ ] **Step 3: Extract `payloadFetch` to `payload-internal.ts`**

Create `apps/web/src/lib/payload-internal.ts` with the function (copy verbatim from `payload.ts`, change `async function` → `export async function`):

```ts
// Copied from payload.ts during the category-fetchers refactor.
// Keeping it in a sibling module lets the new fetchers be tested in isolation
// via Vitest mocks without dragging in the whole payload.ts surface area.
const API_URL = process.env.API_URL ?? 'http://localhost:3001';

export async function payloadFetch<T>(path: string, tag: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      next: { revalidate: 300, tags: [tag] },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[payloadFetch] ${path} failed:`, err);
    return null;
  }
}
```

Adjust the inside to match the verbatim implementation in the existing `payload.ts` (might have different env-var resolution, multiple tags, etc.).

In `payload.ts`, replace the inline `payloadFetch` definition with:

```ts
export { payloadFetch } from './payload-internal';
```

(or just remove the local definition and import it from `./payload-internal` at the top of the file).

- [ ] **Step 4: Implement the new fetchers in `category-fetchers.ts`**

Create `apps/web/src/lib/category-fetchers.ts`:

```ts
import { payloadFetch } from './payload-internal';
import type { PayloadCategory, PayloadDesign, PayloadMaterial, PayloadList } from './payload';

// type alias for clarity
type Id = string | number;

export async function fetchChildCategories(parentId: Id): Promise<PayloadCategory[]> {
  const params = new URLSearchParams({
    'where[parent][equals]': String(parentId),
    depth: '2',
    limit: '50',
    sort: 'name',
  });
  const res = await payloadFetch<PayloadList<PayloadCategory>>(
    `/api/categories?${params.toString()}`,
    'categories',
  );
  return res?.docs ?? [];
}

export async function fetchSiblingCategories(
  parentId: Id,
  excludeId: Id,
): Promise<PayloadCategory[]> {
  const params = new URLSearchParams({
    'where[parent][equals]': String(parentId),
    'where[id][not_equals]': String(excludeId),
    depth: '1',
    limit: '4',
    sort: 'name',
  });
  const res = await payloadFetch<PayloadList<PayloadCategory>>(
    `/api/categories?${params.toString()}`,
    'categories',
  );
  return res?.docs ?? [];
}

export async function fetchSiblingParents(excludeId: Id): Promise<PayloadCategory[]> {
  const params = new URLSearchParams({
    'where[parent][exists]': 'false',
    'where[id][not_equals]': String(excludeId),
    depth: '1',
    limit: '4',
    sort: 'name',
  });
  const res = await payloadFetch<PayloadList<PayloadCategory>>(
    `/api/categories?${params.toString()}`,
    'categories',
  );
  return res?.docs ?? [];
}

/**
 * Two-round-trip join: products in category → distinct design IDs → designs.
 * Custom REST endpoint is FU-CAT-a; this version is fine at 5-min revalidate.
 */
export async function fetchDesignsForCategory(categorySlug: string): Promise<PayloadDesign[]> {
  // Step 1: products in this category (paginated to 200 — enough for any leaf)
  const step1 = new URLSearchParams({
    'where[categoryIds.slug][equals]': categorySlug,
    'where[status][equals]': 'published',
    depth: '1',
    limit: '200',
  });
  const products = await payloadFetch<PayloadList<{ design?: { id: Id } | Id | null }>>(
    `/api/products?${step1.toString()}`,
    'products',
  );
  if (!products?.docs?.length) return [];

  // Extract distinct design ids
  const designIds = Array.from(
    new Set(
      products.docs
        .map((p) => (typeof p.design === 'object' && p.design ? String(p.design.id) : p.design ? String(p.design) : null))
        .filter((id): id is string => id != null),
    ),
  );
  if (!designIds.length) return [];

  // Step 2: fetch those designs
  const step2 = new URLSearchParams({
    'where[id][in]': designIds.join(','),
    depth: '2',
    limit: String(designIds.length),
    sort: 'name',
  });
  const designs = await payloadFetch<PayloadList<PayloadDesign>>(
    `/api/designs?${step2.toString()}`,
    'designs',
  );
  return designs?.docs ?? [];
}

/**
 * Like fetchDesignsForCategory but joins through ALL child categories of a parent.
 * Used on parent hub pages (section ⑧).
 */
export async function fetchDesignsForParentCategory(parentSlug: string): Promise<PayloadDesign[]> {
  // Step 0: parent → its children's slugs
  const parentLookup = await payloadFetch<PayloadList<PayloadCategory>>(
    `/api/categories?where[slug][equals]=${parentSlug}&depth=0&limit=1`,
    'categories',
  );
  const parent = parentLookup?.docs?.[0];
  if (!parent) return [];

  const childCats = await fetchChildCategories(parent.id);
  if (!childCats.length) return [];

  const childSlugs = childCats.map((c) => c.slug);

  // Step 1: products in any child category
  const step1 = new URLSearchParams({
    'where[categoryIds.slug][in]': childSlugs.join(','),
    'where[status][equals]': 'published',
    depth: '1',
    limit: '500',
  });
  const products = await payloadFetch<PayloadList<{ design?: { id: Id } | Id | null }>>(
    `/api/products?${step1.toString()}`,
    'products',
  );
  if (!products?.docs?.length) return [];

  const designIds = Array.from(
    new Set(
      products.docs
        .map((p) => (typeof p.design === 'object' && p.design ? String(p.design.id) : p.design ? String(p.design) : null))
        .filter((id): id is string => id != null),
    ),
  );
  if (!designIds.length) return [];

  const step2 = new URLSearchParams({
    'where[id][in]': designIds.join(','),
    depth: '2',
    limit: String(designIds.length),
    sort: 'name',
  });
  const designs = await payloadFetch<PayloadList<PayloadDesign>>(
    `/api/designs?${step2.toString()}`,
    'designs',
  );
  return designs?.docs ?? [];
}

/**
 * Distinct designs that have ≥1 product in this category, with PRODUCT COUNTS
 * per design. Used by the filter sidebar to render "گندم (۳)".
 *
 * Reuses the step-1 data from fetchDesignsForCategory; if the caller already
 * has that result, prefer passing it in to avoid the duplicate query. The v1
 * default does the fetch from scratch — optimize as `FU-CAT-a`.
 */
export async function fetchAvailableDesigns(
  categorySlug: string,
): Promise<{ slug: string; name: string; count: number }[]> {
  const step1 = new URLSearchParams({
    'where[categoryIds.slug][equals]': categorySlug,
    'where[status][equals]': 'published',
    depth: '1',
    limit: '500',
  });
  const products = await payloadFetch<PayloadList<{ design?: PayloadDesign | Id | null }>>(
    `/api/products?${step1.toString()}`,
    'products',
  );
  if (!products?.docs?.length) return [];

  const counts = new Map<string, { slug: string; name: string; count: number }>();
  for (const p of products.docs) {
    if (!p.design || typeof p.design !== 'object') continue;
    const slug = (p.design as PayloadDesign).slug;
    const name = (p.design as PayloadDesign).name;
    const prev = counts.get(slug);
    if (prev) prev.count += 1;
    else counts.set(slug, { slug, name, count: 1 });
  }
  return Array.from(counts.values()).sort((a, b) => b.count - a.count);
}

/**
 * Same shape as fetchAvailableDesigns but for materials. A product can have
 * multiple materials, so a single product contributes 1 to EACH of its
 * material counts.
 */
export async function fetchAvailableMaterials(
  categorySlug: string,
): Promise<{ slug: string; name: string; count: number }[]> {
  const step1 = new URLSearchParams({
    'where[categoryIds.slug][equals]': categorySlug,
    'where[status][equals]': 'published',
    depth: '1',
    limit: '500',
  });
  const products = await payloadFetch<PayloadList<{ materialIds?: PayloadMaterial[] | null }>>(
    `/api/products?${step1.toString()}`,
    'products',
  );
  if (!products?.docs?.length) return [];

  const counts = new Map<string, { slug: string; name: string; count: number }>();
  for (const p of products.docs) {
    if (!p.materialIds?.length) continue;
    for (const m of p.materialIds) {
      const slug = m.slug;
      const name = m.name;
      const prev = counts.get(slug);
      if (prev) prev.count += 1;
      else counts.set(slug, { slug, name, count: 1 });
    }
  }
  return Array.from(counts.values()).sort((a, b) => b.count - a.count);
}
```

- [ ] **Step 5: Run the test — expect pass**

```bash
pnpm --filter @zhic/web vitest run src/lib/__tests__/category-fetchers.test.ts
```

Expected: 8 passed.

- [ ] **Step 6: Typecheck**

```bash
pnpm --filter @zhic/web typecheck
```

Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/lib/category-fetchers.ts apps/web/src/lib/payload-internal.ts apps/web/src/lib/payload.ts apps/web/src/lib/__tests__/category-fetchers.test.ts
git commit -m "$(cat <<'EOF'
feat(categories): new fetchers for child / sibling / designs / filters

Six fetchers added in apps/web/src/lib/category-fetchers.ts:
  - fetchChildCategories: leaves whose parent === this
  - fetchSiblingCategories / fetchSiblingParents
  - fetchDesignsForCategory / fetchDesignsForParentCategory: two-step
    products→distinct-designs join (custom endpoint deferred FU-CAT-a)
  - fetchAvailableDesigns / fetchAvailableMaterials: per-axis counts
    for the filter sidebar

Extracted payloadFetch to payload-internal.ts so the new fetchers can
be mocked in unit tests without dragging in payload.ts's surface area.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 5: Sub-components (server)

### Task 9: `<CategoryHero>`

**Files:**
- Create: `apps/web/src/components/category/CategoryHero.tsx`
- Modify: `apps/web/src/app/globals.css` (or a category-scoped CSS file) — port hero styles from the mockup

- [ ] **Step 1: Port the hero CSS to a CSS module**

Create `apps/web/src/components/category/CategoryHero.module.css`. Copy from the mockup (`category-leaf-mockup.html` lines for `.hero`, `.hero-img`, `.hero-text`, `.hero-eyebrow`, `.hero-title`, `.hero-tagline`):

```css
.hero {
  margin-top: calc(var(--header-h, 64px) + 12px);
  position: relative;
  width: 100%;
  aspect-ratio: 21 / 9;
  overflow: hidden;
  background: var(--color-cream);
}
@media (max-width: 767px) {
  .hero { margin-top: 70px; aspect-ratio: 4 / 5; }
}
.heroImg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
}
.heroImg::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.45 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
  background-size: 240px 240px;
  opacity: 0.06;
  mix-blend-mode: overlay;
}
.scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(20,17,15,0.55) 100%);
}
.text {
  position: absolute;
  inset-inline-start: clamp(16px, 4vw, 64px);
  inset-block-end: clamp(24px, 6vw, 56px);
  color: #FAFAF7;
  max-width: min(540px, 80vw);
}
.eyebrow {
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.75);
  font-weight: 400;
  margin-bottom: 14px;
  display: inline-block;
  padding-inline-end: 14px;
  border-inline-end: 1px solid rgba(255,255,255,0.35);
}
.eyebrow + .eyebrow {
  border: 0;
  padding-inline-start: 14px;
  padding-inline-end: 0;
  color: rgba(255,255,255,0.55);
}
.title {
  font-size: clamp(40px, 6vw, 76px);
  font-weight: 900;
  line-height: 1.05;
  letter-spacing: -0.02em;
  color: #fff;
  margin-bottom: 12px;
}
.titleParent { font-size: clamp(44px, 7vw, 88px); }
.tagline {
  font-size: clamp(16px, 1.6vw, 20px);
  font-weight: 300;
  color: rgba(255,255,255,0.88);
  font-style: italic;
  line-height: 1.5;
}
```

- [ ] **Step 2: Implement CategoryHero**

Create `apps/web/src/components/category/CategoryHero.tsx`:

```tsx
import { BlurInText } from '@zhic/ui';
import type { PayloadCategory } from '@/lib/payload';
import styles from './CategoryHero.module.css';

export type CategoryHeroProps = {
  category: PayloadCategory;
  /** Optional fallback cover URL (e.g., first product's first gallery image on leaves). */
  fallbackCoverUrl?: string | null;
};

export function CategoryHero({ category, fallbackCoverUrl }: CategoryHeroProps) {
  const isLeaf = category.parent != null && typeof category.parent === 'object';
  const parentName = isLeaf ? (category.parent as PayloadCategory).name : null;

  const coverUrl = category.cover?.url ?? fallbackCoverUrl ?? null;
  // Placeholder when no cover and no fallback: cream-to-sand gradient with «ژ» watermark.
  const placeholderBg =
    'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(20,17,15,0.55) 100%), ' +
    'radial-gradient(ellipse at 70% 20%, #d8c4a3 0%, #8b6f47 55%, #3e2f1f 100%)';
  const heroBg = coverUrl
    ? `linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(20,17,15,0.55) 100%), url("${coverUrl}")`
    : placeholderBg;

  return (
    <section className={styles.hero}>
      <div className={styles.heroImg} style={{ backgroundImage: heroBg }} aria-hidden />
      <div className={styles.text}>
        <BlurInText as="span" className={styles.eyebrow}>دسته‌بندی</BlurInText>
        {isLeaf && parentName ? (
          <BlurInText as="span" className={styles.eyebrow} stagger={90}>{parentName}</BlurInText>
        ) : null}
        <BlurInText
          as="h1"
          className={`${styles.title} ${!isLeaf ? styles.titleParent : ''}`}
          stagger={120}
        >
          {category.name}
        </BlurInText>
        {category.tagline ? (
          <BlurInText as="p" className={styles.tagline} stagger={120}>
            {category.tagline}
          </BlurInText>
        ) : null}
      </div>
    </section>
  );
}
```

(Note: `BlurInText` requires `children: string`. The eyebrow + title + tagline are all single strings — OK. Adjust `stagger` so each block's effective delay matches the mockup spacing.)

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter @zhic/web typecheck
```

Expected: clean.

- [ ] **Step 4: Smoke-render — not testable in unit; verified via the live page after Task 18**

Skipped — this component renders inside the page wired up later.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/category/CategoryHero.tsx apps/web/src/components/category/CategoryHero.module.css
git commit -m "$(cat <<'EOF'
feat(category): CategoryHero — full-bleed image + animated title block

Cover image as background with bottom-scrim + film grain. Eyebrow chain
(دسته‌بندی · <parent>) on leaves; just دسته‌بندی on parents. Title +
tagline via BlurInText for the come-up word-by-word reveal. Cover falls
back to a placeholder gradient when neither operator cover nor product
image is available.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: `<CategoryIntro>`

**Files:**
- Create: `apps/web/src/components/category/CategoryIntro.tsx`
- Create: `apps/web/src/components/category/CategoryIntro.module.css`

- [ ] **Step 1: CSS**

```css
.wrap {
  max-width: 640px;
  padding-block: 8px 28px;
}
.wrap.parent {
  max-width: 720px;
  padding-block: 8px 32px;
}
.wrap p {
  font-size: 16px;
  line-height: 1.85;
  color: var(--color-charcoal);
  margin-bottom: 14px;
  font-weight: 400;
}
.wrap.parent p {
  font-size: 17px;
  line-height: 1.9;
  margin-bottom: 16px;
}
.wrap p:last-child { margin-bottom: 0; }
.wrap strong { font-weight: 700; color: var(--color-ink); }

/* Drop cap on the first letter of the first paragraph — parent variant only */
.wrap.parent p:first-child::first-letter {
  font-size: 1.8em;
  font-weight: 900;
  color: var(--color-ink);
  float: right;          /* RTL: floats to the start (right) side */
  line-height: 1;
  margin-inline-start: 6px;
  margin-block-start: 4px;
}
```

- [ ] **Step 2: Component**

```tsx
import { BlurInText } from '@zhic/ui';
import { RichText } from '@/lib/richtext';
import type { LexicalRoot } from '@/lib/payload';
import styles from './CategoryIntro.module.css';

export type CategoryIntroProps = {
  intro: LexicalRoot | null | undefined;
  variant: 'leaf' | 'parent';
};

export function CategoryIntro({ intro, variant }: CategoryIntroProps) {
  if (!intro?.root?.children?.length) return null;
  const cls = variant === 'parent' ? `${styles.wrap} ${styles.parent}` : styles.wrap;
  return (
    <section className={cls}>
      <RichText value={intro} />
    </section>
  );
}
```

(The existing `RichText` from `@/lib/richtext` handles paragraph rendering. The CSS handles drop cap + sizing per variant. We do **not** wrap each paragraph in BlurInText here — RichText's output is unstructured; instead, wrap the whole section in `<FadeUp>` in the page consumer.)

- [ ] **Step 3: Typecheck + commit**

```bash
pnpm --filter @zhic/web typecheck
git add apps/web/src/components/category/CategoryIntro.tsx apps/web/src/components/category/CategoryIntro.module.css
git commit -m "$(cat <<'EOF'
feat(category): CategoryIntro — variant-aware richText body

Leaf variant: 640px max-width, 16px text. Parent variant: 720px,
17px text, drop cap on the first letter of the first paragraph
(::first-letter pseudo, floats start in RTL).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: `<CategoryCallouts>`

**Files:**
- Create: `apps/web/src/components/category/CategoryCallouts.tsx`
- Create: `apps/web/src/components/category/CategoryCallouts.module.css`

- [ ] **Step 1: CSS** (from mockup):

```css
.callouts {
  display: flex;
  gap: 28px;
  padding-block: 18px;
  border-top: 1px solid var(--color-sand);
  border-bottom: 1px solid var(--color-sand);
  flex-wrap: wrap;
  margin-block: 8px 32px;
}
.callouts.parent { gap: 36px; padding-block: 22px; margin-block: 8px 56px; }
.callout { display: flex; flex-direction: column; gap: 4px; }
.num {
  font-size: 28px;
  font-weight: 900;
  color: var(--color-ink);
  line-height: 1;
  letter-spacing: -0.02em;
  font-feature-settings: 'tnum';
}
.parent .num { font-size: 32px; }
.lbl {
  font-size: 11px;
  letter-spacing: 0.18em;
  color: var(--color-stone);
  text-transform: uppercase;
}
@media (max-width: 767px) {
  .callouts { gap: 24px; padding-block: 14px; }
  .num { font-size: 22px; }
  .parent .num { font-size: 24px; }
}
```

- [ ] **Step 2: Component**

```tsx
import { FadeUp } from '@zhic/ui';
import styles from './CategoryCallouts.module.css';

export type Callout = { num: string; lbl: string };

export type CategoryCalloutsProps = {
  callouts: Callout[];     // computed by the page (per leaf/parent rules — see spec §5.3)
  variant: 'leaf' | 'parent';
};

export function CategoryCallouts({ callouts, variant }: CategoryCalloutsProps) {
  if (!callouts.length) return null;
  return (
    <section
      className={variant === 'parent' ? `${styles.callouts} ${styles.parent}` : styles.callouts}
      aria-label="نمای کلی"
    >
      {callouts.map((c, i) => (
        <FadeUp key={c.lbl} delay={i * 90} className={styles.callout}>
          <div className={styles.num}>{c.num}</div>
          <div className={styles.lbl}>{c.lbl}</div>
        </FadeUp>
      ))}
    </section>
  );
}
```

The page computes the callout list (it has the sideloads); this component just renders. Persian-digit conversion (`۸` etc.) happens in the page using the existing `@zhic/locale` helper (`toPersianDigits`).

- [ ] **Step 3: Typecheck + commit**

```bash
pnpm --filter @zhic/web typecheck
git add apps/web/src/components/category/CategoryCallouts.tsx apps/web/src/components/category/CategoryCallouts.module.css
git commit -m "$(cat <<'EOF'
feat(category): CategoryCallouts — 4-block big-number + label strip

Top/bottom 1px sand borders. Each block wrapped in FadeUp with a 90ms
stagger between blocks. Number rendered with tnum + -0.02em tracking.
Variant prop controls the larger parent typography.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: `<ChildCategoriesGrid>` + `<SiblingCategoriesStrip>` + `<DesignsWithType>`

Three related layout components — group them in one task to keep the plan tractable.

**Files:**
- Create: `apps/web/src/components/category/ChildCategoriesGrid.tsx`
- Create: `apps/web/src/components/category/SiblingCategoriesStrip.tsx`
- Create: `apps/web/src/components/category/DesignsWithType.tsx`
- Create: `apps/web/src/components/category/CategoryTiles.module.css` (shared quiet-card CSS)
- Create: `apps/web/src/components/category/SectionHeader.tsx` + `.module.css` (shared section eyebrow/title/sub layout)

- [ ] **Step 1: Shared CSS — `CategoryTiles.module.css`**

```css
/* Quiet card — see mockup. Used by product tiles, child-category tiles,
   sibling tiles. Tile-internal silhouettes are added by callers via
   ::before with their own per-tile inset/border-radius. */
.quietCard {
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  background: linear-gradient(180deg, #FCFBF7 0%, #F6F2EB 100%);
  border: 1px solid rgba(232, 224, 216, 0.55);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.6), 0 0 0 rgba(20,17,15,0);
  transition:
    transform .35s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow  .35s cubic-bezier(0.22, 1, 0.36, 1),
    border-color .35s cubic-bezier(0.22, 1, 0.36, 1);
}
.quietCardLink:hover .quietCard {
  transform: translateY(-4px);
  border-color: rgba(232, 224, 216, 0.85);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.65), 0 14px 28px rgba(20,17,15,0.07);
}

/* aspect helpers */
.aspect45 { aspect-ratio: 4 / 5; }
.aspect169 { aspect-ratio: 16 / 9; }
.aspect1610 { aspect-ratio: 16 / 10; }
```

- [ ] **Step 2: `<SectionHeader>` component + CSS**

`SectionHeader.module.css`:

```css
.head {
  display: flex;
  align-items: baseline;
  gap: 16px;
  margin-bottom: 24px;
  padding-top: 56px;
  border-top: 1px solid var(--color-sand);
}
.head.first { padding-top: 0; border-top: 0; }
.eyebrow {
  font-size: 11px;
  letter-spacing: 0.18em;
  color: var(--color-forest);
  text-transform: uppercase;
  font-weight: 700;
}
.title {
  font-size: clamp(22px, 2.4vw, 32px);
  font-weight: 900;
  color: var(--color-ink);
  letter-spacing: -0.02em;
  line-height: 1.2;
  margin-top: 4px;
}
.sub {
  color: var(--color-stone);
  font-size: 13px;
  margin-inline-start: auto;
}
.subLink:hover { color: var(--color-forest); }
```

`SectionHeader.tsx`:

```tsx
import { FadeUp } from '@zhic/ui';
import Link from 'next/link';
import styles from './SectionHeader.module.css';

export type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  sub?: string;
  subHref?: string;
  first?: boolean;
};

export function SectionHeader({ eyebrow, title, sub, subHref, first }: SectionHeaderProps) {
  return (
    <FadeUp as="header" className={first ? `${styles.head} ${styles.first}` : styles.head}>
      <div>
        <div className={styles.eyebrow}>{eyebrow}</div>
        <h2 className={styles.title}>{title}</h2>
      </div>
      {sub ? (
        subHref ? (
          <Link href={subHref} className={`${styles.sub} ${styles.subLink}`}>{sub}</Link>
        ) : (
          <span className={styles.sub}>{sub}</span>
        )
      ) : null}
    </FadeUp>
  );
}
```

- [ ] **Step 3: `<ChildCategoriesGrid>`**

`ChildCategoriesGrid.module.css`:

```css
.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}
@media (min-width: 768px) { .grid { grid-template-columns: repeat(3, 1fr); gap: 28px 24px; } }
@media (min-width: 1200px) { .grid { grid-template-columns: repeat(4, 1fr); gap: 32px 24px; } }
.cardLink { display: block; color: inherit; }
.meta {
  padding-top: 16px;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.name { font-size: 16px; font-weight: 700; color: var(--color-ink); line-height: 1.4; }
.arrow {
  margin-top: 4px;
  font-size: 12px;
  color: var(--color-stone);
  transition: all .25s cubic-bezier(0.22, 1, 0.36, 1);
}
.cardLink:hover .arrow { color: var(--color-forest); margin-inline-start: 4px; }
.count { font-size: 11px; color: var(--color-stone); }
```

`ChildCategoriesGrid.tsx`:

```tsx
import Link from 'next/link';
import { toPersianDigits } from '@zhic/locale';
import type { PayloadCategory } from '@/lib/payload';
import tiles from './CategoryTiles.module.css';
import styles from './ChildCategoriesGrid.module.css';

export type ChildCategoriesGridProps = {
  children: (PayloadCategory & { _productCount?: number })[];
};

export function ChildCategoriesGrid({ children }: ChildCategoriesGridProps) {
  if (!children.length) {
    return (
      <p style={{ color: 'var(--color-stone)', textAlign: 'center', padding: '32px 0' }}>
        به‌زودی زیرنوع‌ها افزوده می‌شوند.
      </p>
    );
  }
  return (
    <div className={styles.grid} aria-label="زیرنوع‌ها">
      {children.map((child) => (
        <Link
          key={child.slug}
          href={`/categories/${child.slug}`}
          className={`${styles.cardLink} ${tiles.quietCardLink}`}
        >
          <div className={`${tiles.quietCard} ${tiles.aspect45}`}>
            {/* Future: per-child silhouette via child.silhouette enum — FU-CAT-e */}
          </div>
          <div className={styles.meta}>
            <div className={styles.name}>{child.name}</div>
            {typeof child._productCount === 'number' ? (
              <div className={styles.arrow}>
                {toPersianDigits(child._productCount)} محصول ←
              </div>
            ) : (
              <div className={styles.arrow}>مشاهده ←</div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: `<DesignsWithType>`**

`DesignsWithType.module.css`:

```css
.row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
@media (min-width: 640px) { .row { grid-template-columns: repeat(4, 1fr); gap: 20px; } }
.card {
  position: relative;
  overflow: hidden;
  border-radius: 4px;
  aspect-ratio: 4 / 5;
  display: block;
  transition: transform .6s cubic-bezier(0.22, 1, 0.36, 1);
}
.card:hover { transform: translateY(-3px); }
.bg { position: absolute; inset: 0; transition: transform 1.2s cubic-bezier(0.22, 1, 0.36, 1); }
.card:hover .bg { transform: scale(1.04); }
.scrim { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(20,17,15,0.6) 100%); }
.meta { position: absolute; bottom: 16px; inset-inline-start: 16px; color: #fff; }
.eye { font-size: 9px; letter-spacing: 0.18em; color: rgba(255,255,255,0.7); text-transform: uppercase; }
.nm { font-size: 20px; font-weight: 900; line-height: 1.1; margin-top: 4px; }
.arrow { position: absolute; bottom: 16px; inset-inline-end: 16px; color: rgba(255,255,255,0.7); transition: all .3s cubic-bezier(0.22, 1, 0.36, 1); }
.card:hover .arrow { color: #fff; inset-inline-end: 12px; }
```

`DesignsWithType.tsx`:

```tsx
import Link from 'next/link';
import type { PayloadDesign } from '@/lib/payload';
import { SectionHeader } from './SectionHeader';
import styles from './DesignsWithType.module.css';

export type DesignsWithTypeProps = {
  designs: PayloadDesign[];
  /** "آینه دیواری" (leaf) or "آینه" (parent) — interpolated into the h2. */
  contextLabel: string;
  /** "این نوع در" (leaf) or "این دسته در" (parent). */
  eyebrow?: string;
};

export function DesignsWithType({
  designs,
  contextLabel,
  eyebrow = '★ این نوع در',
}: DesignsWithTypeProps) {
  if (!designs.length) return null;
  return (
    <>
      <SectionHeader
        eyebrow={eyebrow}
        title={`طرح‌هایی که ${contextLabel} دارند`}
        sub={`${designs.length} طرح موجود`}
      />
      <div className={styles.row} aria-label="طرح‌های مرتبط">
        {designs.map((d) => (
          <Link key={d.slug} href={`/designs/${d.slug}`} className={styles.card}>
            <div
              className={styles.bg}
              style={{
                background: d.heroMedia?.url
                  ? `url("${d.heroMedia.url}") center/cover`
                  : `linear-gradient(160deg, #c8a878, #6f4e2e)`,
              }}
            />
            <div className={styles.scrim} />
            <div className={styles.meta}>
              <div className={styles.eye}>طرح</div>
              <div className={styles.nm}>{d.name}</div>
            </div>
            <div className={styles.arrow}>←</div>
          </Link>
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 5: `<SiblingCategoriesStrip>`**

`SiblingCategoriesStrip.module.css`:

```css
.row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding-bottom: 96px;
}
@media (min-width: 640px) { .row { grid-template-columns: repeat(4, 1fr); } }
.cardLink { display: block; color: inherit; }
.bg { position: relative; }
.nm { padding-top: 12px; font-size: 13px; color: var(--color-ink); font-weight: 700; }
.ct { font-size: 11px; color: var(--color-stone); padding-top: 2px; }
```

`SiblingCategoriesStrip.tsx`:

```tsx
import Link from 'next/link';
import type { PayloadCategory } from '@/lib/payload';
import { SectionHeader } from './SectionHeader';
import tiles from './CategoryTiles.module.css';
import styles from './SiblingCategoriesStrip.module.css';

export type SiblingCategoriesStripProps = {
  siblings: PayloadCategory[];
  variant: 'leaf' | 'parent';
  /** Display name of the parent category. Used in the leaf eyebrow ("دیگر <parent.name>"). */
  parentName?: string;
  /** Optional "see all" link target on the leaf. */
  seeAllHref?: string;
};

export function SiblingCategoriesStrip({
  siblings, variant, parentName, seeAllHref,
}: SiblingCategoriesStripProps) {
  if (!siblings.length) return null;
  const eyebrow = variant === 'leaf'
    ? `دیگر ${parentName ?? 'دسته‌بندی‌ها'}`
    : 'دیگر دسته‌بندی‌ها';
  const title = variant === 'leaf' ? 'از مجموعه‌ی هم‌رده' : 'از همان قفسه';
  return (
    <>
      <SectionHeader
        eyebrow={eyebrow}
        title={title}
        sub={variant === 'leaf' && seeAllHref ? `همه‌ی ${parentName ?? ''} ←` : variant === 'parent' ? 'همه‌ی دسته‌بندی‌ها ←' : undefined}
        subHref={variant === 'leaf' ? seeAllHref : '/products'}
      />
      <div className={styles.row}>
        {siblings.map((s) => (
          <Link key={s.slug} href={`/categories/${s.slug}`} className={`${styles.cardLink} ${tiles.quietCardLink}`}>
            <div className={`${styles.bg} ${tiles.quietCard} ${tiles.aspect1610}`} />
            <div className={styles.nm}>{s.name}</div>
            {/* Count line could be added if we precompute productCount on each sibling — defer. */}
          </Link>
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 6: Typecheck + commit**

```bash
pnpm --filter @zhic/web typecheck
git add apps/web/src/components/category/{ChildCategoriesGrid,SiblingCategoriesStrip,DesignsWithType,CategoryTiles,SectionHeader}* 
git commit -m "$(cat <<'EOF'
feat(category): grid + strip + designs sections + shared section header

Three layout components built on the shared quiet-card CSS (cream wash
+ sand border + top-edge highlight, no backdrop-filter). Reusable
SectionHeader handles the eyebrow/title/sub pattern repeated across
three sections of the page.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 6: Filter UI

### Task 13: `<CategoryFilterSidebar>` (server component)

**Files:**
- Create: `apps/web/src/components/category/CategoryFilterSidebar.tsx`
- Create: `apps/web/src/components/category/CategoryFilterSidebar.module.css`
- Create: `apps/web/src/lib/category-filter-url.ts` (pure URL helper)
- Test: `apps/web/src/lib/__tests__/category-filter-url.test.ts` (new)

- [ ] **Step 1: Test the URL helper**

```ts
import { describe, expect, it } from 'vitest';
import { buildFilterHref } from '../category-filter-url';

describe('buildFilterHref', () => {
  const base = '/categories/wall-mirror';
  it('clears all when override is null on every key', () => {
    expect(buildFilterHref(base, { design: 'gandom', sort: 'price_asc' }, { design: null, material: null, size: null, sort: null }))
      .toBe('/categories/wall-mirror');
  });
  it('sets one key, preserves others', () => {
    expect(buildFilterHref(base, { sort: 'price_asc' }, { design: 'gandom' }))
      .toBe('/categories/wall-mirror?sort=price_asc&design=gandom');
  });
  it('removes the page param on any filter change', () => {
    expect(buildFilterHref(base, { page: '3', design: 'gandom' }, { design: 'baloot' }))
      .toBe('/categories/wall-mirror?design=baloot');
  });
  it('preserves the page param when only the override is page', () => {
    expect(buildFilterHref(base, { design: 'gandom' }, { page: 2 }))
      .toBe('/categories/wall-mirror?design=gandom&page=2');
  });
  it('drops the default sort=newest', () => {
    expect(buildFilterHref(base, {}, { sort: 'newest' }))
      .toBe('/categories/wall-mirror');
  });
});
```

- [ ] **Step 2: Implement**

```ts
// apps/web/src/lib/category-filter-url.ts

type SearchParams = Record<string, string | string[] | undefined>;
type Override = {
  design?: string | null;
  material?: string | null;
  size?: string | null;
  sort?: string | null;
  page?: number | string | null;
};

const DEFAULT_SORT = 'newest';
const FILTER_KEYS = ['design', 'material', 'size', 'sort'] as const;

function pick(sp: SearchParams, key: string): string | undefined {
  const v = sp[key];
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

/**
 * Compute the new URL for the category page given the current searchParams
 * and an override (one or more filter keys to set/clear).
 *
 * Rules:
 *  - Any filter change resets `page` to 1 (omitted from the URL).
 *  - The `page` key can be changed independently — pass it in `override.page`
 *    and other params are preserved.
 *  - `sort=newest` is the default and is never emitted in the URL.
 *  - Setting a value to `null` in `override` REMOVES that key.
 *  - Setting a value to a string SETS that key.
 *  - Keys not in `override` are PRESERVED from the current searchParams.
 */
export function buildFilterHref(base: string, current: SearchParams, override: Override): string {
  const isPageOnly =
    override.page !== undefined &&
    override.design === undefined &&
    override.material === undefined &&
    override.size === undefined &&
    override.sort === undefined;

  const params = new URLSearchParams();

  for (const key of FILTER_KEYS) {
    let next: string | undefined;
    const overKey = override[key as keyof Override];
    if (overKey === null) {
      next = undefined;       // explicit clear
    } else if (overKey !== undefined) {
      next = String(overKey);  // explicit set
    } else {
      next = pick(current, key); // preserved
    }
    if (next && !(key === 'sort' && next === DEFAULT_SORT)) {
      params.set(key, next);
    }
  }

  // page: only preserve / set if isPageOnly OR override.page is given.
  let nextPage: number | null = null;
  if (override.page !== undefined && override.page !== null) {
    nextPage = Number(override.page);
  } else if (isPageOnly) {
    const cur = pick(current, 'page');
    nextPage = cur ? Number(cur) : null;
  }
  if (nextPage && nextPage > 1) {
    params.set('page', String(nextPage));
  }

  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}
```

- [ ] **Step 3: Run test — expect pass**

```bash
pnpm --filter @zhic/web vitest run src/lib/__tests__/category-filter-url.test.ts
```

Expected: 5 passed.

- [ ] **Step 4: Sidebar CSS**

```css
.sidebar { display: none; }
@media (min-width: 1024px) {
  .sidebar {
    display: block;
    position: sticky;
    top: calc(var(--header-h, 64px) + 24px);
    align-self: start;
    max-height: calc(100vh - var(--header-h, 64px) - 48px);
    overflow-y: auto;
    padding-bottom: 16px;
    padding-inline-end: 4px;
  }
  .sidebar::-webkit-scrollbar { width: 4px; }
  .sidebar::-webkit-scrollbar-thumb { background: var(--color-sand-2, #DDD3C7); border-radius: 2px; }
}
.head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.title { font-size: 13px; letter-spacing: 0.18em; color: var(--color-stone); text-transform: uppercase; font-weight: 700; }
.clear { font-size: 11px; color: var(--color-forest); text-decoration: underline; text-underline-offset: 3px; }
.group { padding-block: 18px; border-bottom: 1px solid var(--color-sand); }
.group:last-child { border-bottom: 0; }
.label { font-size: 11px; letter-spacing: 0.18em; color: var(--color-stone); text-transform: uppercase; margin-bottom: 12px; font-weight: 700; }
.list { display: flex; flex-direction: column; gap: 2px; }
.opt {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 7px 0;
  font-size: 14px;
  color: var(--color-charcoal);
  font-weight: 400;
  transition: color .2s cubic-bezier(0.22, 1, 0.36, 1);
  text-decoration: none;
}
.opt:hover { color: var(--color-ink); }
.opt.active { color: var(--color-ink); font-weight: 700; }
.opt .check {
  width: 16px; height: 16px;
  border-radius: 2px;
  border: 1px solid var(--color-sand-2, #DDD3C7);
  flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  color: #fff;
  font-size: 11px;
  line-height: 1;
  transition: all .2s cubic-bezier(0.22, 1, 0.36, 1);
}
.opt.radio .check { border-radius: 50%; }
.opt.active .check { background: var(--color-forest); border-color: var(--color-forest); }
.opt.active .check::before { content: '✓'; }
.opt.radio.active .check::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: #fff; }
.opt .count { margin-inline-start: auto; font-size: 11px; color: var(--color-stone); font-feature-settings: 'tnum'; }
```

- [ ] **Step 5: Component**

```tsx
// apps/web/src/components/category/CategoryFilterSidebar.tsx — SERVER component.
import Link from 'next/link';
import { toPersianDigits } from '@zhic/locale';
import { buildFilterHref } from '@/lib/category-filter-url';
import styles from './CategoryFilterSidebar.module.css';

type SortKey = 'newest' | 'price_asc' | 'price_desc' | 'name';
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'جدیدترین' },
  { key: 'price_asc', label: 'قیمت: ارزان‌ترین' },
  { key: 'price_desc', label: 'قیمت: گران‌ترین' },
  { key: 'name', label: 'الفبا' },
];

export type CategoryFilterSidebarProps = {
  basePath: string;
  searchParams: Record<string, string | string[] | undefined>;
  availableDesigns: { slug: string; name: string; count: number }[];
  availableMaterials: { slug: string; name: string; count: number }[];
  availableSizes?: { value: string; label: string; count: number }[];
};

function pickStr(sp: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const v = sp[key];
  return typeof v === 'string' ? v : Array.isArray(v) ? v[0] : undefined;
}

export function CategoryFilterSidebar({
  basePath, searchParams,
  availableDesigns, availableMaterials, availableSizes,
}: CategoryFilterSidebarProps) {
  const activeSort = (pickStr(searchParams, 'sort') ?? 'newest') as SortKey;
  const activeDesign = pickStr(searchParams, 'design');
  const activeMaterial = pickStr(searchParams, 'material');
  const activeSize = pickStr(searchParams, 'size');

  return (
    <aside className={styles.sidebar} aria-label="فیلتر">
      <div className={styles.head}>
        <span className={styles.title}>فیلتر</span>
        <Link href={basePath} className={styles.clear}>پاک کردن همه</Link>
      </div>

      <div className={styles.group}>
        <div className={styles.label}>مرتب‌سازی</div>
        <div className={styles.list}>
          {SORT_OPTIONS.map((s) => {
            const isActive = activeSort === s.key;
            const href = buildFilterHref(basePath, searchParams, { sort: s.key === 'newest' ? null : s.key });
            return (
              <Link key={s.key} href={href} className={`${styles.opt} ${styles.radio} ${isActive ? styles.active : ''}`}>
                <span className={styles.check} />
                {s.label}
              </Link>
            );
          })}
        </div>
      </div>

      {availableDesigns.length > 0 && (
        <div className={styles.group}>
          <div className={styles.label}>طرح</div>
          <div className={styles.list}>
            {availableDesigns.map((d) => {
              const isActive = activeDesign === d.slug;
              const href = buildFilterHref(basePath, searchParams, { design: isActive ? null : d.slug });
              return (
                <Link key={d.slug} href={href} className={`${styles.opt} ${isActive ? styles.active : ''}`}>
                  <span className={styles.check} />
                  {d.name}
                  <span className={styles.count}>{toPersianDigits(d.count)}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {availableMaterials.length > 0 && (
        <div className={styles.group}>
          <div className={styles.label}>روکش چوب</div>
          <div className={styles.list}>
            {availableMaterials.map((m) => {
              const isActive = activeMaterial === m.slug;
              const href = buildFilterHref(basePath, searchParams, { material: isActive ? null : m.slug });
              return (
                <Link key={m.slug} href={href} className={`${styles.opt} ${isActive ? styles.active : ''}`}>
                  <span className={styles.check} />
                  {m.name}
                  <span className={styles.count}>{toPersianDigits(m.count)}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {availableSizes && availableSizes.length > 0 && (
        <div className={styles.group}>
          <div className={styles.label}>اندازه</div>
          <div className={styles.list}>
            {availableSizes.map((s) => {
              const isActive = activeSize === s.value;
              const href = buildFilterHref(basePath, searchParams, { size: isActive ? null : s.value });
              return (
                <Link key={s.value} href={href} className={`${styles.opt} ${isActive ? styles.active : ''}`}>
                  <span className={styles.check} />
                  {s.label}
                  <span className={styles.count}>{toPersianDigits(s.count)}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
```

- [ ] **Step 6: Typecheck + commit**

```bash
pnpm --filter @zhic/web typecheck
git add apps/web/src/components/category/CategoryFilterSidebar.tsx apps/web/src/components/category/CategoryFilterSidebar.module.css apps/web/src/lib/category-filter-url.ts apps/web/src/lib/__tests__/category-filter-url.test.ts
git commit -m "$(cat <<'EOF'
feat(category): CategoryFilterSidebar + URL helpers (server component)

Filter sidebar is a server component — filters live in URL params; each
option is a Next <Link> with a precomputed href via buildFilterHref(). No
useState. Reset button clears all params with a single navigation.
Default sort (newest) is never emitted in the URL.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 14: Mobile filter trigger + sheet (client components)

**Files:**
- Create: `apps/web/src/components/category/CategoryFilterTrigger.tsx` (client)
- Create: `apps/web/src/components/category/CategoryFilterSheet.tsx` (client)
- Create: `apps/web/src/components/category/category-filter-state.ts` (client store)
- Create: `apps/web/src/components/category/CategoryFilterMobile.module.css`

- [ ] **Step 1: Shared client store (tiny Context — no Zustand needed)**

```tsx
// apps/web/src/components/category/category-filter-state.ts
'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

type FilterUIState = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const Ctx = createContext<FilterUIState | null>(null);

export function CategoryFilterProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <Ctx.Provider value={{ open, setOpen }}>{children}</Ctx.Provider>;
}

export function useCategoryFilter() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCategoryFilter must be used inside CategoryFilterProvider');
  return v;
}
```

- [ ] **Step 2: CSS**

```css
.bar {
  position: fixed;
  bottom: 16px;
  inset-inline: 0;
  display: flex;
  justify-content: center;
  z-index: 90;
  pointer-events: none;
}
@media (min-width: 1024px) { .bar { display: none; } }
.btn {
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 22px;
  background: var(--color-ink);
  color: #fff;
  border-radius: 9999px;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 12px 28px rgba(0,0,0,0.22);
  transition: transform .2s cubic-bezier(0.22, 1, 0.36, 1);
}
.btn:active { transform: scale(0.97); }
.badge {
  background: var(--color-forest);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  border-radius: 9999px;
  padding: 1px 8px;
  min-width: 22px;
  text-align: center;
  font-feature-settings: 'tnum';
}
.btn svg { width: 16px; height: 16px; }

.backdrop { position: fixed; inset: 0; background: rgba(20,17,15,0.5); backdrop-filter: blur(2px); z-index: 200; opacity: 0; pointer-events: none; transition: opacity .25s cubic-bezier(0.22, 1, 0.36, 1); }
.backdrop.open { opacity: 1; pointer-events: auto; }
.sheet {
  position: fixed;
  inset-inline: 0;
  bottom: 0;
  z-index: 201;
  background: var(--color-ivory);
  border-radius: 18px 18px 0 0;
  transform: translateY(100%);
  transition: transform .35s cubic-bezier(0.16, 1, 0.3, 1);
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -12px 40px rgba(0,0,0,0.18);
}
.sheet.open { transform: translateY(0); }
.grip { width: 44px; height: 4px; border-radius: 2px; background: var(--color-sand-2, #DDD3C7); margin: 10px auto 4px; }
.head { display: flex; align-items: center; justify-content: space-between; padding: 8px 20px 14px; border-bottom: 1px solid var(--color-sand); }
.headTitle { font-size: 16px; font-weight: 900; color: var(--color-ink); }
.close { font-size: 22px; color: var(--color-stone); line-height: 1; padding: 4px 8px; }
.body { overflow-y: auto; padding: 8px 20px 24px; }
.foot { padding: 14px 20px 22px; border-top: 1px solid var(--color-sand); display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.reset { padding: 14px; border-radius: 4px; border: 1px solid var(--color-sand-2, #DDD3C7); font-size: 13px; color: var(--color-charcoal); background: transparent; }
.apply { padding: 14px; border-radius: 4px; background: var(--color-ink); color: #fff; font-size: 13px; font-weight: 700; }
```

- [ ] **Step 3: Trigger component**

```tsx
// apps/web/src/components/category/CategoryFilterTrigger.tsx
'use client';

import { toPersianDigits } from '@zhic/locale';
import { useCategoryFilter } from './category-filter-state';
import styles from './CategoryFilterMobile.module.css';

export type CategoryFilterTriggerProps = { activeCount: number };

export function CategoryFilterTrigger({ activeCount }: CategoryFilterTriggerProps) {
  const { setOpen } = useCategoryFilter();
  return (
    <div className={styles.bar}>
      <button className={styles.btn} onClick={() => setOpen(true)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="4" y1="6"  x2="20" y2="6" />
          <line x1="4" y1="12" x2="14" y2="12" />
          <line x1="4" y1="18" x2="8"  y2="18" />
        </svg>
        فیلتر و مرتب‌سازی
        {activeCount > 0 && <span className={styles.badge}>{toPersianDigits(activeCount)}</span>}
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Sheet component**

```tsx
// apps/web/src/components/category/CategoryFilterSheet.tsx
'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useCategoryFilter } from './category-filter-state';
import { CategoryFilterSidebar, type CategoryFilterSidebarProps } from './CategoryFilterSidebar';
import styles from './CategoryFilterMobile.module.css';
import sidebarStyles from './CategoryFilterSidebar.module.css';

export type CategoryFilterSheetProps = CategoryFilterSidebarProps;

export function CategoryFilterSheet(props: CategoryFilterSheetProps) {
  const { open, setOpen } = useCategoryFilter();

  // Body scroll lock + ESC to close
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    if (open) window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); };
  }, [open, setOpen]);

  return (
    <>
      <div className={`${styles.backdrop} ${open ? styles.open : ''}`} onClick={() => setOpen(false)} />
      <div className={`${styles.sheet} ${open ? styles.open : ''}`} role="dialog" aria-label="فیلتر و مرتب‌سازی" aria-modal="true" aria-hidden={!open}>
        <div className={styles.grip} aria-hidden />
        <div className={styles.head}>
          <span className={styles.headTitle}>فیلتر و مرتب‌سازی</span>
          <button className={styles.close} onClick={() => setOpen(false)} aria-label="بستن">×</button>
        </div>
        <div className={styles.body}>
          {/* Reuse the sidebar's filter-list markup by extracting the
              inner content (sans wrapper aside) — or just render the
              sidebar with an override class. For v1 simplicity, render
              the sidebar but force it visible on mobile via inline style. */}
          <div className={sidebarStyles.sidebar} style={{ display: 'block', position: 'static', maxHeight: 'none', overflow: 'visible' }}>
            <CategoryFilterSidebar {...props} />
          </div>
        </div>
        <div className={styles.foot}>
          <Link href={props.basePath} className={styles.reset} onClick={() => setOpen(false)}>پاک کردن</Link>
          <button className={styles.apply} onClick={() => setOpen(false)}>نمایش نتایج</button>
        </div>
      </div>
    </>
  );
}
```

Note on the sheet body: reusing `<CategoryFilterSidebar>` inside the sheet means each filter option's `<Link>` triggers Next navigation which closes the sheet via the page reload. The Apply button is a manual close in case the user just toggled some options and wants to dismiss without navigating. The slight visual hack (overriding `position: static` etc.) keeps DRY at the cost of a bit of style coupling — acceptable for v1.

- [ ] **Step 5: Typecheck + commit**

```bash
pnpm --filter @zhic/web typecheck
git add apps/web/src/components/category/CategoryFilterTrigger.tsx apps/web/src/components/category/CategoryFilterSheet.tsx apps/web/src/components/category/category-filter-state.ts apps/web/src/components/category/CategoryFilterMobile.module.css
git commit -m "$(cat <<'EOF'
feat(category): mobile filter trigger + bottom-sheet drawer

Paired client components share a React Context for the open/closed
state. Trigger is a fixed pill at viewport bottom with active-count
badge; sheet slides in from below over 350ms, dismisses on backdrop
tap, × button, ESC, or Apply. Body scroll-lock while open.

Reuses CategoryFilterSidebar inside the sheet body (DRY) — same hrefs,
same active-state derivation. Filtered options navigate immediately.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 7: Page + SEO

### Task 15: Rewrite `/categories/[slug]/page.tsx`

**Files:**
- Modify (total rewrite): `apps/web/src/app/(site)/categories/[slug]/page.tsx`

- [ ] **Step 1: Read the current implementation for parts to preserve**

```bash
cat apps/web/src/app/(site)/categories/[slug]/page.tsx
```

Note the imports used: `Container`, `Breadcrumbs`, `Pagination` from `@zhic/ui`. The existing `fetchProducts({ category, page })` call. The `buildMetadata` helper.

- [ ] **Step 2: Write the new page**

```tsx
// apps/web/src/app/(site)/categories/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { Container, Breadcrumbs, Pagination } from '@zhic/ui';
import { toPersianDigits } from '@zhic/locale';
import { fetchCategory, fetchProducts } from '@/lib/payload';
import {
  fetchChildCategories,
  fetchSiblingCategories,
  fetchSiblingParents,
  fetchDesignsForCategory,
  fetchDesignsForParentCategory,
  fetchAvailableDesigns,
  fetchAvailableMaterials,
} from '@/lib/category-fetchers';
import { buildCrumbs, deriveDescriptionFromIntro, countActiveFilters } from '@/lib/category-helpers';
import { buildMetadata } from '@/lib/seo';
import { ProductGrid } from '@/components/product/ProductGrid';
import { CategoryHero } from '@/components/category/CategoryHero';
import { CategoryIntro } from '@/components/category/CategoryIntro';
import { CategoryCallouts, type Callout } from '@/components/category/CategoryCallouts';
import { ChildCategoriesGrid } from '@/components/category/ChildCategoriesGrid';
import { DesignsWithType } from '@/components/category/DesignsWithType';
import { SiblingCategoriesStrip } from '@/components/category/SiblingCategoriesStrip';
import { CategoryFilterSidebar } from '@/components/category/CategoryFilterSidebar';
import { CategoryFilterProvider } from '@/components/category/category-filter-state';
import { CategoryFilterTrigger } from '@/components/category/CategoryFilterTrigger';
import { CategoryFilterSheet } from '@/components/category/CategoryFilterSheet';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// Filtered URLs are noindex; canonical always points to base.
const FILTER_PARAMS = ['design', 'material', 'size', 'sort', 'page'] as const;

export async function generateMetadata({ params, searchParams }: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const sp = await searchParams;
  const category = await fetchCategory(slug);
  if (!category) return { title: 'یافت نشد' };

  const hasFilters = FILTER_PARAMS.some((k) => sp[k] !== undefined && sp[k] !== '');

  return buildMetadata({
    seo: category.seo,
    title: category.name,
    description: category.tagline ?? deriveDescriptionFromIntro(category.intro) ?? `${category.name} — مبلمان دست‌ساز ژیک`,
    path: `/categories/${slug}`,
    canonical: `/categories/${slug}`,
    robots: hasFilters ? { index: false, follow: true } : undefined,
    openGraph: {
      title: category.name,
      description: category.tagline ?? undefined,
      images: category.cover?.url ? [{ url: category.cover.url }] : undefined,
    },
  });
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const sp = await searchParams;

  const category = await fetchCategory(slug);
  if (!category) notFound();

  const isLeaf = category.parent != null && typeof category.parent === 'object';
  const basePath = `/categories/${slug}`;

  // Search-param parsing
  const page = Number(sp.page) > 0 ? Number(sp.page) : 1;
  const design = typeof sp.design === 'string' ? sp.design : undefined;
  const materialParam = typeof sp.material === 'string' ? sp.material : undefined;
  const sortParam = typeof sp.sort === 'string' ? sp.sort : 'newest';
  const sort = (['newest', 'name', 'price_asc', 'price_desc'].includes(sortParam) ? sortParam : 'newest') as
    'newest' | 'name' | 'price_asc' | 'price_desc';

  // === LEAF branch ===
  if (isLeaf) {
    const parent = category.parent as typeof category;
    const [productsPage, designsWithType, siblings, availableDesigns, availableMaterials] =
      await Promise.all([
        fetchProducts({
          category: slug,
          page,
          design,
          materials: materialParam ? [materialParam] : undefined,
          sort: sort === 'price_asc' ? 'priceAsc' : sort === 'price_desc' ? 'priceDesc' : sort,
        }),
        fetchDesignsForCategory(slug),
        fetchSiblingCategories(typeof parent === 'object' ? parent.id : parent, category.id),
        fetchAvailableDesigns(slug),
        fetchAvailableMaterials(slug),
      ]);

    const callouts: Callout[] = [
      { num: toPersianDigits(productsPage.totalDocs), lbl: 'محصول' },
      { num: toPersianDigits(designsWithType.length), lbl: 'طرح' },
      // size callout omitted until variants ship (sub-project C)
      { num: toPersianDigits(availableMaterials.length), lbl: 'روکش چوب' },
    ];

    const activeCount = countActiveFilters(sp);

    return (
      <CategoryFilterProvider>
        <CategoryHero category={category} fallbackCoverUrl={productsPage.docs[0]?.gallery?.[0]?.url ?? null} />

        <Container>
          <Breadcrumbs items={buildCrumbs(category)} />

          <div className="grid grid-cols-1 gap-0 lg:grid-cols-[1fr_280px] lg:gap-16 mt-8">
            <main className="min-w-0">
              <CategoryIntro intro={category.intro} variant="leaf" />
              <CategoryCallouts callouts={callouts} variant="leaf" />

              <div className="mb-5 flex items-center justify-between gap-3">
                <span className="text-[13px] text-stone">نمایش {toPersianDigits(productsPage.docs.length)} از {toPersianDigits(productsPage.totalDocs)} محصول</span>
              </div>

              {productsPage.docs.length === 0 ? (
                <p className="py-10 text-center text-stone">
                  هیچ محصولی با این فیلترها یافت نشد.{' '}
                  <a href={basePath} className="text-forest underline underline-offset-4">پاک کردن فیلترها</a>
                </p>
              ) : (
                <ProductGrid products={productsPage.docs} />
              )}

              {productsPage.totalPages > 1 && (
                <Pagination
                  currentPage={productsPage.page}
                  totalPages={productsPage.totalPages}
                  hrefFor={(n) => (n <= 1 ? basePath : `${basePath}?page=${n}`)}
                />
              )}

              <DesignsWithType
                designs={designsWithType}
                contextLabel={category.name}
                eyebrow="★ این نوع در"
              />

              <SiblingCategoriesStrip
                siblings={siblings}
                variant="leaf"
                parentName={typeof parent === 'object' ? parent.name : undefined}
                seeAllHref={typeof parent === 'object' ? `/categories/${parent.slug}` : undefined}
              />
            </main>

            <CategoryFilterSidebar
              basePath={basePath}
              searchParams={sp}
              availableDesigns={availableDesigns}
              availableMaterials={availableMaterials}
            />
          </div>
        </Container>

        <CategoryFilterTrigger activeCount={activeCount} />
        <CategoryFilterSheet
          basePath={basePath}
          searchParams={sp}
          availableDesigns={availableDesigns}
          availableMaterials={availableMaterials}
        />

        <div className="pb-12" />
      </CategoryFilterProvider>
    );
  }

  // === PARENT branch ===
  const [childCats, designsWithType, siblings] = await Promise.all([
    fetchChildCategories(category.id),
    fetchDesignsForParentCategory(slug),
    fetchSiblingParents(category.id),
  ]);

  // Sum product counts across children for the "محصول" callout.
  // For v1, count via a parallel light query — or precompute on children via fetchChildCategories enrichment.
  const totalProducts = childCats.reduce((acc, c) => acc + (c as { _productCount?: number })._productCount ?? 0, 0);

  const callouts: Callout[] = [
    { num: toPersianDigits(childCats.length), lbl: 'زیرنوع' },
    { num: toPersianDigits(totalProducts), lbl: 'محصول' },
    { num: toPersianDigits(designsWithType.length), lbl: 'طرح' },
  ];

  return (
    <>
      <CategoryHero category={category} />

      <Container>
        <Breadcrumbs items={buildCrumbs(category)} />

        <main className="mt-8">
          <CategoryIntro intro={category.intro} variant="parent" />
          <CategoryCallouts callouts={callouts} variant="parent" />

          <ChildCategoriesGrid children={childCats} />

          <DesignsWithType
            designs={designsWithType}
            contextLabel={category.name}
            eyebrow="★ این دسته در"
          />

          <SiblingCategoriesStrip siblings={siblings} variant="parent" />
        </main>
      </Container>

      <div className="pb-12" />
    </>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter @zhic/web typecheck
```

Expected: clean. If `fetchProducts`'s `sort` enum doesn't include `priceAsc` / `priceDesc` (existing pattern from line 783 was `priceAsc`/`priceDesc` casing), confirm and adjust the mapping.

- [ ] **Step 4: Smoke test — bring the dev server up**

```bash
pm2 restart zhic-web --update-env
until curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ | grep -q 200; do sleep 1; done; echo "ready"

curl -s -o /dev/null -w "/categories/mirrors      → %{http_code}\n" http://localhost:3000/categories/mirrors
curl -s -o /dev/null -w "/categories/wall-mirror  → %{http_code}\n" http://localhost:3000/categories/wall-mirror
curl -s -o /dev/null -w "/categories/wall-mirror?design=gandom → %{http_code}\n" "http://localhost:3000/categories/wall-mirror?design=gandom"
curl -s -o /dev/null -w "/categories/nonexistent  → %{http_code}\n" http://localhost:3000/categories/nonexistent
```

Expected: `200`, `200`, `200`, `404`.

If anything 500s, check `pm2 logs zhic-web --lines 50` for the error and fix.

- [ ] **Step 5: Visual verification**

Open in browser:
- http://80.240.31.146:3000/categories/mirrors
- http://80.240.31.146:3000/categories/wall-mirror

Match against the mockups (`/docs/category-leaf-mockup.html`, `/docs/category-parent-mockup.html`). Sections present, animations firing, sidebar visible at ≥1024px, bottom trigger visible at <1024px. Click a filter option in the sidebar — URL should update and grid should re-fetch.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/(site)/categories/[slug]/page.tsx
git commit -m "$(cat <<'EOF'
feat(categories): rewrite /categories/[slug] for parent + leaf hubs

One route handles both. Branches on category.parent === null. Leaf:
hero → intro → callouts → filters → grid → designs-with-type → siblings.
Parent: hero → intro → callouts → child grid → designs → parent siblings.
Filtered URLs canonical to base + noindex,follow via generateMetadata.
Mobile gets the filter pill trigger + bottom sheet.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 16: JSON-LD CollectionPage + BreadcrumbList

**Files:**
- Modify: `apps/web/src/app/(site)/categories/[slug]/page.tsx` (add inline JSON-LD scripts)

- [ ] **Step 1: Define the helper**

Create `apps/web/src/lib/category-jsonld.ts`:

```ts
import type { PayloadCategory } from './payload';
import { deriveDescriptionFromIntro } from './category-helpers';

type Crumb = { label: string; href?: string };
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zhicwood.com';

export function categoryCollectionPageLd(category: PayloadCategory) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.name,
    description: category.tagline ?? deriveDescriptionFromIntro(category.intro) ?? undefined,
    url: `${SITE_URL}/categories/${category.slug}`,
    image: category.cover?.url ?? undefined,
    isPartOf: { '@type': 'WebSite', name: 'ژیک', url: SITE_URL },
  };
}

export function breadcrumbListLd(crumbs: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: `${SITE_URL}${c.href}` } : {}),
    })),
  };
}
```

- [ ] **Step 2: Render them in the page**

In `page.tsx`, at the very end of the JSX return (after the outer fragment closes), add:

```tsx
// inside the page, just before the closing </CategoryFilterProvider> or </> wrap:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(categoryCollectionPageLd(category)) }}
/>
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbListLd(buildCrumbs(category))) }}
/>
```

Add imports at the top:

```ts
import { categoryCollectionPageLd, breadcrumbListLd } from '@/lib/category-jsonld';
```

- [ ] **Step 3: Verify markup**

```bash
curl -s http://localhost:3000/categories/wall-mirror | grep -A 2 'application/ld+json'
```

Expected: 2 `<script type="application/ld+json">` tags. Pretty-print the JSON manually and pass it through Google's Rich Results Test (https://search.google.com/test/rich-results) for sanity.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/category-jsonld.ts apps/web/src/app/(site)/categories/[slug]/page.tsx
git commit -m "$(cat <<'EOF'
feat(categories): JSON-LD CollectionPage + BreadcrumbList

Two structured-data blocks emitted per /categories/[slug] page. URL is
the canonical base (no filter params). BreadcrumbList chain matches the
visible breadcrumb.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 17: Sitemap entries

**Files:**
- Modify: `apps/web/src/app/sitemap.ts`
- Modify: `apps/web/src/lib/payload.ts` (new `fetchAllCategories()` if not present)

- [ ] **Step 1: Add `fetchAllCategories`**

Check if it exists:

```bash
grep -n "fetchAllCategories\|fetchCategories(" apps/web/src/lib/payload.ts
```

If only `fetchCategories()` exists (returns paginated 50 default), add:

```ts
export async function fetchAllCategories(): Promise<PayloadCategory[]> {
  const res = await payloadFetch<PayloadList<PayloadCategory>>(
    '/api/categories?limit=500&depth=1&sort=name',
    'categories',
  );
  return res?.docs ?? [];
}
```

- [ ] **Step 2: Add entries to sitemap**

Read the existing sitemap:

```bash
cat apps/web/src/app/sitemap.ts
```

Add category entries. Insert into the routes array:

```ts
import { fetchAllCategories } from '@/lib/payload';

// inside the default export async function sitemap():
const categories = await fetchAllCategories();
const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => ({
  url: `${BASE_URL}/categories/${c.slug}`,
  priority: c.parent ? 0.7 : 0.75,
  changeFrequency: 'monthly' as const,
  lastModified: c.updatedAt ? new Date(c.updatedAt) : undefined,
}));

// merge into the return:
return [
  ...staticRoutes,
  ...categoryEntries,
  // ... other dynamic entries
];
```

- [ ] **Step 3: Verify**

```bash
curl -s http://localhost:3000/sitemap.xml | grep -E '<loc>.*categories' | head -10
```

Expected: at least 2 `<loc>` entries with `/categories/` paths (mirrors + wall-mirror seeded in Task 4).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/payload.ts apps/web/src/app/sitemap.ts
git commit -m "$(cat <<'EOF'
feat(categories): sitemap entries for parents (0.75) + leaves (0.7)

fetchAllCategories returns up to 500; sitemap maps each into a route
entry with monthly changeFreq and lastModified from updatedAt.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 8: Verification + ship

### Task 18: Empty-state + filter combinations

**Manual verification.** No code change unless a defect surfaces.

- [ ] **Step 1: Empty category test**

In Payload admin, create a new category `name="آزمایش"`, `slug="test-empty"`, `parent=<some parent>`, `cover=null`, `intro=null`, NO products in it.

Visit http://80.240.31.146:3000/categories/test-empty — expect: hero with placeholder gradient, breadcrumb, NO intro section, callouts showing zeros (or omitted gracefully), "هیچ محصولی" empty-state line, designs section + siblings strip still attempt to render.

Delete the test category after verifying.

- [ ] **Step 2: Filter combinations**

On http://80.240.31.146:3000/categories/wall-mirror — exercise:
1. Click a design → URL gains `?design=<slug>` → grid filters down
2. Click again on the same design → URL clears it
3. Click a different design → URL replaces (not appends)
4. Combine design + material → both active, both pills visible in result bar
5. "پاک کردن همه" → URL drops to `/categories/wall-mirror`
6. Sort radio change → `?sort=price_asc` (or whichever) → grid resorts
7. `?page=2` overshoots when totalPages < 2 → check the page doesn't error (Next will render page 1's content; pagination component should show only what's valid)

- [ ] **Step 3: Mobile sheet**

Open DevTools, set mobile viewport (375×667). Verify:
- Sidebar is hidden
- Bottom-pill trigger visible with active count badge (if any)
- Tap pill → sheet slides up over ~350ms
- Sheet shows all four filter groups with bigger touch targets
- Tap a filter option → URL updates AND sheet stays open (the page revalidates underneath)
- × button / backdrop / ESC all close
- Body scroll-locked while open

- [ ] **Step 4: Reduced motion**

In DevTools: Rendering panel → "Emulate CSS media feature prefers-reduced-motion: reduce". Reload the page. Verify all animations are instant; no fade-up, no blur.

- [ ] **Step 5: Cross-page nav regression**

Quick visual sweep:
- `/` → header looks right
- `/products` → ditto
- `/products/<slug>` → ditto
- `/designs` → ditto
- `/designs/<slug>` → ditto
- `/journal` → ditto

If any page regresses (e.g., overlapping nav items, missing icons), fix in `SiteHeader.tsx`.

- [ ] **Step 6: Persist findings in `docs/state.md`**

Edit `docs/state.md`. Add a new Post-Phase row recording the categories rewrite, e.g.:

```
| 4.2 Categories hub pages | ✅ | _this commit_ | New /categories/[slug] template covers both parents and leaves via one route. Schema: tagline, cover, intro (richText), allowed_axes (text[]), rule on Categories. Five new fetchers in category-fetchers.ts. Filter sidebar on desktop (server component), bottom-sheet drawer on mobile (paired client components). SiteHeader rework piggybacked (1fr/auto/1fr nav grid + SVG icons). JSON-LD CollectionPage + BreadcrumbList. Sitemap entries (parents 0.75, leaves 0.7). Spec: docs/superpowers/specs/2026-05-21-categories-hub-pages-design.md. Open FUs: CAT-a/b/c/d/e/f/g/h/i. |
```

Append the FU rows at the bottom of the follow-ups table per the existing pattern (FU-CAT-a..i).

- [ ] **Step 7: Final commit**

```bash
git add docs/state.md
git commit -m "$(cat <<'EOF'
docs(state): /categories hub pages shipped; FU-CAT-* logged

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 19: Lint + typecheck + build — final gate

- [ ] **Step 1: Run the full pipeline**

```bash
pnpm typecheck
pnpm --filter @zhic/web lint
pnpm --filter @zhic/web build
pnpm --filter @zhic/web test
pnpm --filter @zhic/api test
pnpm --filter @zhic/ui test
```

Expected: ALL clean. Fix any failures before opening the PR.

- [ ] **Step 2: Push the branch + open PR**

(Only if explicitly authorized by the operator.)

```bash
git push -u origin feat/categories-hub-pages
gh pr create --title "feat: /categories hub pages — parent + leaf views" --body "$(cat <<'EOF'
## Summary
- Sub-project D of the products overhaul (spec: \`docs/superpowers/specs/2026-05-21-categories-hub-pages-design.md\`)
- New /categories/[slug] template handles both parents (~7) and leaves (~32) from one route
- Categories collection gains 5 hub-page fields + a parent-cover-required hook
- Filter sidebar (server component, desktop) + bottom-sheet drawer (paired client components, mobile)
- SiteHeader rework piggybacked: 1fr/auto/1fr grid + inline SVG icons
- JSON-LD CollectionPage + BreadcrumbList; sitemap entries; canonical/noindex hygiene

## Test plan
- [ ] /categories/mirrors (parent) and /categories/wall-mirror (leaf) render 200
- [ ] /categories/nonexistent returns 404
- [ ] Filtered URLs emit noindex,follow
- [ ] alternates.canonical always points to base
- [ ] Sidebar visible at ≥1024px, bottom trigger visible at <1024px
- [ ] Sheet slide-in + body scroll lock + ESC dismiss
- [ ] No visual regression on /, /products, /products/[slug], /designs, /designs/[slug], /journal, /showrooms, /about
- [ ] Migration applies cleanly; types regenerated
- [ ] BlurInText/FadeUp animations honour prefers-reduced-motion

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Otherwise, leave the branch local and notify the operator.

---

## Self-Review Checklist

Run by the agent after the final commit:

1. **Spec coverage** — every section of `docs/superpowers/specs/2026-05-21-categories-hub-pages-design.md` has a task implementing it. Specifically:
   - §2 Schema → Tasks 1–4
   - §3 Architecture → Tasks 7–17 collectively
   - §4 Page composition + generateMetadata → Tasks 15–16
   - §5 Component contracts → Tasks 9–14
   - §6 SiteHeader rework → Task 6
   - §7 SEO (canonical, robots, OG, JSON-LD, sitemap) → Tasks 15–17
   - §8 Mobile layout → Task 14
   - §9 Empty states → Task 18
   - §10 Tests → distributed (Task 1, 5, 7, 8, 13)
   - §11 Acceptance criteria → all touched by Tasks 18–19

2. **Placeholder scan** — `grep -n "TBD\|TODO\|FIXME" docs/superpowers/plans/2026-05-21-categories-hub-pages.md` should return zero meaningful hits.

3. **Type consistency** — `PayloadCategory` extended in Task 7 has fields used in Tasks 9–17. `Callout` type defined in Task 11 and consumed in Task 15. `SortKey` in Task 13 and Task 15 match.

4. **Migration vs hook redundancy** — the parent-cover-required hook (Task 1) prevents publishing parents without a cover. The migration (Task 2) allows `cover_id` NULL at the DB level. Intentional: hook is editorial-time enforcement; DB-level NOT NULL would break the leaf case.

---

## Notes for the executing agent

- Each task is independent enough to be its own commit. Do NOT batch — frequent commits help review.
- If a step fails, STOP and report. Do not improvise.
- When restarting Next (`pm2 restart zhic-web`), always wait for the `200` from `curl http://localhost:3000/` before continuing.
- The mockup files (`apps/web/public/docs/category-{leaf,parent}-mockup.html`) are the visual source-of-truth. If a component's rendered output diverges from the mockup AND you're confident the mockup represents the operator's intent, update the implementation to match the mockup, not the other way around. If you're unsure which is correct, STOP and ask.
- All Persian text used in this plan is from the mockups + spec — do not re-translate. Persian copy entry is the operator's responsibility.
- Schema/import sub-projects (A + B) are separate plans. This plan assumes seeded data exists for `mirrors` (parent) + `wall-mirror` (leaf) at minimum (Task 4 establishes this).
