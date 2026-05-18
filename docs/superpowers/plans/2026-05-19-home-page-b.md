# Home Page Plan B — Reorg + new sections + rooms collection

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the public home page (`/`) and add the new `rooms` collection + `/rooms/[slug]` route, consuming the foundation pieces shipped in Plan A.

**Architecture:** The new home page composes five sections in order: hero (with sliding curated media) → three age-category tiles → brand-statement (now with animated counters on a forest-dark bg) → journal three-row scroll parallax → compact showrooms teaser. The two pre-existing sections — `HomeFeaturedDesigns` and `HomeInquiryCta` — are removed from the home flow. A new `rooms` Payload collection holds the three age-category landing pages; new dynamic route `/rooms/[slug]` renders them.

**Tech Stack:** Next.js 16 App Router, React 19, Payload 3, TypeScript 5, Tailwind v4. Consumes `@zhic/ui` (ParallaxImage, CountUp, BlurInText), `@zhic/locale`.

**Prereq:** Plan A (`docs/superpowers/plans/2026-05-19-foundation-a.md`) must be merged first — this plan imports `ParallaxImage`, `CountUp`, `BlurInText`, and uses `bg-forest-dark`.

**Branch suggestion:** cut `feat/home-page-reorg` off `staging` (or off the merged Plan A branch).

**Spec:** `docs/superpowers/specs/2026-05-19-home-page-reorg-design.md` §2.2-§2.6, §2.8

---

### Task 1: Extend the `home` global with `heroSlides[]`

**Files:**
- Modify: `services/api/src/globals/Home.ts`

- [ ] **Step 1.1: Add the `heroSlides` array field**

In `services/api/src/globals/Home.ts`, insert the new field between `hero_subheading` and `brand_statement`. After the edit the fields block should look like:

```ts
fields: [
  {
    name: 'hero_media',
    type: 'upload',
    relationTo: 'media',
    label: 'رسانه هیرو (deprecated — use heroSlides)',
    admin: { description: 'این فیلد در نسخه‌ی بعدی حذف می‌شود. به‌جای آن heroSlides را پر کنید.' },
  },
  {
    name: 'hero_heading',
    type: 'text',
    label: 'عنوان هیرو',
  },
  {
    name: 'hero_subheading',
    type: 'text',
    label: 'زیرعنوان هیرو',
  },
  {
    name: 'heroSlides',
    type: 'array',
    label: 'اسلایدهای هیرو',
    minRows: 1,
    maxRows: 8,
    fields: [
      {
        name: 'image',
        type: 'upload',
        relationTo: 'media',
        required: true,
        label: 'تصویر',
      },
      {
        name: 'alt',
        type: 'text',
        required: true,
        label: 'متن جایگزین (a11y)',
      },
      {
        name: 'link',
        type: 'text',
        label: 'لینک (اختیاری)',
        admin: { description: 'مسیر داخلی یا URL کامل. اگر خالی باشد اسلاید کلیک‌پذیر نیست.' },
      },
    ],
  },
  {
    name: 'brand_statement',
    type: 'richText',
    label: 'بیانیه برند',
  },
  // ...rest unchanged
],
```

- [ ] **Step 1.2: Typecheck the api package**

Run: `pnpm --filter @zhic/api typecheck` (or `pnpm --filter services/api typecheck` — match the workspace name).
Expected: PASS.

- [ ] **Step 1.3: Restart Payload, verify the field appears in admin**

Run: `pm2 restart zhic-api --update-env && sleep 5`
Visit `http://80.240.31.146:3001/admin/globals/home` and verify «اسلایدهای هیرو» appears as an array with image/alt/link fields. Add one test slide pointing at any existing media item.

- [ ] **Step 1.4: Commit**

```bash
git add services/api/src/globals/Home.ts
git commit -m "feat(api/home): add heroSlides[] array field

Replaces single hero_media with a curated slide array (image + alt +
optional link). hero_media kept and marked deprecated for safe
migration; will be dropped in a follow-up after the storefront cuts
over."
```

---

### Task 2: Build `HomeHeroCarousel` component

**Files:**
- Create: `apps/web/src/components/hero/HomeHeroCarousel.tsx`
- Create: `apps/web/src/components/hero/home-hero-carousel.css`

- [ ] **Step 2.1: Define the slide type**

Create `apps/web/src/components/hero/HomeHeroCarousel.tsx`:

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button, Container } from '@zhic/ui';
import './home-hero-carousel.css';

export type HeroSlide = {
  src: string;
  alt: string;
  link?: string;
};

export type HomeHeroCarouselProps = {
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  slides: HeroSlide[];
  /** Auto-rotate interval in ms. 0 disables. Default 5000. */
  intervalMs?: number;
};

const DEFAULT_EYEBROW = 'کلکسیون بهار ۱۴۰۵';
const DEFAULT_HEADING = 'ساخته‌شده\nبرای ماندن';
const DEFAULT_SUB =
  'مبلمان دست‌ساز از چوب گردوی ایرانی، برای خانه‌هایی که آرامش را می‌فهمند.';

export function HomeHeroCarousel({
  eyebrow = DEFAULT_EYEBROW,
  heading = DEFAULT_HEADING,
  subheading = DEFAULT_SUB,
  slides,
  intervalMs = 5000,
}: HomeHeroCarouselProps) {
  const [idx, setIdx] = useState(0);
  const total = slides.length;
  const pausedRef = useRef(false);

  useEffect(() => {
    if (!intervalMs || total <= 1) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const id = setInterval(() => {
      if (!pausedRef.current) setIdx((i) => (i + 1) % total);
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, total]);

  return (
    <section className="zh-hhc">
      {/* Text half — order-2 on mobile, order-1 on desktop (RTL-start) */}
      <div className="zh-hhc__text">
        <div className="zh-hhc__eyebrow">{eyebrow}</div>
        <h1 className="zh-hhc__heading">{heading}</h1>
        <p className="zh-hhc__sub">{subheading}</p>
        <div className="zh-hhc__cta-row">
          <Button as="a" href="/products" variant="primary" size="lg">
            مشاهده‌ی محصولات
          </Button>
        </div>
      </div>

      {/* Media half — single-image carousel, dots only */}
      <div
        className="zh-hhc__media"
        onMouseEnter={() => (pausedRef.current = true)}
        onMouseLeave={() => (pausedRef.current = false)}
      >
        <div className="zh-hhc__viewport">
          <div
            className="zh-hhc__track"
            style={{ transform: `translateX(${idx * 100}%)` }}
          >
            {slides.map((s, i) => {
              const inner = (
                <img
                  src={s.src}
                  alt={s.alt}
                  className="zh-hhc__slide-img"
                  loading={i === 0 ? 'eager' : 'lazy'}
                  fetchPriority={i === 0 ? 'high' : 'auto'}
                  draggable={false}
                />
              );
              return (
                <div className="zh-hhc__slide" key={i} aria-hidden={i !== idx}>
                  {s.link ? (
                    <Link href={s.link} className="zh-hhc__slide-link">
                      {inner}
                    </Link>
                  ) : (
                    inner
                  )}
                </div>
              );
            })}
          </div>

          {total > 1 && (
            <div className="zh-hhc__dots" role="tablist" aria-label="انتخاب اسلاید">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === idx}
                  aria-label={`اسلاید ${i + 1}`}
                  className={`zh-hhc__dot${i === idx ? ' is-active' : ''}`}
                  onClick={() => setIdx(i)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2.2: Create the CSS**

Create `apps/web/src/components/hero/home-hero-carousel.css`:

```css
.zh-hhc {
  display: grid;
  grid-template-columns: 1fr;
  background: var(--color-ivory);
}

/* Mobile: media on top (order-1), text below (order-2). */
.zh-hhc__text { order: 2; padding: var(--space-6) var(--space-5); display: flex; flex-direction: column; justify-content: center; }
.zh-hhc__media { order: 1; position: relative; aspect-ratio: 16 / 9; overflow: hidden; border-top-right-radius: 96px; }

/* Desktop: split 50/50, total hero 16:9, text on the start (RTL: right). */
@media (min-width: 768px) {
  .zh-hhc { grid-template-columns: 1fr 1fr; aspect-ratio: 16 / 9; padding-top: var(--header-height); }
  .zh-hhc__text { order: 1; padding-block: var(--space-7); padding-inline-start: var(--space-7); padding-inline-end: var(--space-6); }
  .zh-hhc__media { order: 2; aspect-ratio: auto; height: 100%; border-top-right-radius: 140px; }
}

.zh-hhc__eyebrow {
  margin-bottom: var(--space-5);
  font-size: var(--text-eyebrow);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: var(--tracking-eyebrow-wide);
  color: var(--color-forest);
}
.zh-hhc__heading {
  margin-bottom: var(--space-5);
  font-size: var(--text-h1);
  font-weight: 900;
  line-height: 1.1;
  color: var(--color-ink);
  white-space: pre-line;
  text-wrap: balance;
}
.zh-hhc__sub {
  margin-bottom: var(--space-7);
  max-width: 420px;
  font-size: var(--text-lead);
  font-weight: 300;
  line-height: var(--leading-lead);
  color: var(--color-stone);
}
.zh-hhc__cta-row { display: flex; flex-direction: column; gap: var(--space-4); }
@media (min-width: 768px) {
  .zh-hhc__cta-row { flex-direction: row; flex-wrap: wrap; }
}

.zh-hhc__viewport {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.zh-hhc__track {
  display: flex;
  width: 100%;
  height: 100%;
  transition: transform 850ms cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform;
}
.zh-hhc__slide {
  flex: 0 0 100%;
  position: relative;
  width: 100%;
  height: 100%;
}
.zh-hhc__slide-link { display: block; width: 100%; height: 100%; }
.zh-hhc__slide-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
}
.zh-hhc__dots {
  position: absolute;
  left: 50%;
  bottom: 16px;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 10;
}
.zh-hhc__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(140, 130, 121, 0.5);
  border: 0;
  padding: 0;
  cursor: pointer;
  transition: width var(--dur-hover) var(--ease-out-soft), background-color var(--dur-hover) var(--ease-out-soft);
}
.zh-hhc__dot.is-active { background: var(--color-charcoal); width: 18px; border-radius: 3px; }

@media (prefers-reduced-motion: reduce) {
  .zh-hhc__track { transition: none; }
}
```

- [ ] **Step 2.3: Typecheck**

Run: `pnpm --filter web typecheck`
Expected: PASS.

- [ ] **Step 2.4: Commit**

```bash
git add apps/web/src/components/hero/HomeHeroCarousel.tsx apps/web/src/components/hero/home-hero-carousel.css
git commit -m "feat(web/hero): add HomeHeroCarousel — split layout + sliding media

Replaces HomeHero's static image-prop pattern with an internal
single-image carousel: text half on the RTL-start, sliding media on
the end, ivory bg, top-right curve, dots-only navigation, auto-rotate
with hover-pause, prefers-reduced-motion respected. Secondary CTA
removed per spec — only «مشاهده‌ی محصولات» remains."
```

---

### Task 3: Wire `HomeHeroCarousel` into the home page

**Files:**
- Modify: `apps/web/src/lib/payload.ts` (extend `fetchHome` typing to include `heroSlides`)
- Modify: `apps/web/src/app/(site)/page.tsx`

- [ ] **Step 3.1: Extend the `fetchHome` typing**

Open `apps/web/src/lib/payload.ts`. Find the type/return shape for `fetchHome`. Add a `heroSlides` field to the home shape:

```ts
export type PayloadHomeSlide = {
  id?: string;
  image?: { url?: string; filename?: string };
  alt?: string;
  link?: string;
};

// inside the Home type/interface:
//   heroSlides?: PayloadHomeSlide[];
```

(If the `fetchHome` shape is inferred from a generated Payload type, regenerate types first via the project's normal `pnpm --filter @zhic/api generate-types` or equivalent — check `services/api/package.json` for the command. Otherwise, hand-augment the type the storefront uses.)

- [ ] **Step 3.2: Update the home page to render `HomeHeroCarousel`**

Open `apps/web/src/app/(site)/page.tsx`. Replace the `HomeHero` block with `HomeHeroCarousel` and pass `home.heroSlides`:

```tsx
import { HomeHeroCarousel, type HeroSlide } from '@/components/hero/HomeHeroCarousel';
// ...

const slides: HeroSlide[] = (home?.heroSlides ?? [])
  .map((s) => ({
    src: s.image?.url ?? '',
    alt: s.alt ?? '',
    link: s.link,
  }))
  .filter((s) => s.src);

// Fallback: if the operator hasn't seeded slides yet, use the legacy hero_media
const finalSlides: HeroSlide[] =
  slides.length > 0
    ? slides
    : home?.hero_media?.url
      ? [{ src: home.hero_media.url, alt: home?.hero_heading ?? '' }]
      : [{ src: '/hero/IMG_0889.jpeg', alt: '' }];

return (
  <>
    <HomeHeroCarousel
      eyebrow={undefined /* keeps the default */}
      heading={home?.hero_heading ?? undefined}
      subheading={home?.hero_subheading ?? undefined}
      slides={finalSlides}
    />
    {/* ...other sections stay for now; later tasks update them */}
  </>
);
```

- [ ] **Step 3.3: Build + visually verify**

Run: `pnpm --filter web build && pm2 restart zhic-web --update-env`
Open `http://80.240.31.146:3000/`. Expected: hero shows the new layout (text right on RTL, sliding media left), dots appear if ≥2 slides. The fallback path still works if no `heroSlides` are seeded.

- [ ] **Step 3.4: Commit**

```bash
git add apps/web/src/app/\(site\)/page.tsx apps/web/src/lib/payload.ts
git commit -m "feat(web/home): wire HomeHeroCarousel into the home page

Reads home.heroSlides[] when populated; falls back to hero_media or
the legacy IMG_0889 placeholder so the page never breaks during the
operator's migration window."
```

---

### Task 4: Create the `rooms` Payload collection

**Files:**
- Create: `services/api/src/collections/Rooms.ts`
- Modify: `services/api/src/payload.config.ts` (register the collection)

- [ ] **Step 4.1: Create the Rooms collection**

Create `services/api/src/collections/Rooms.ts`:

```ts
import type { CollectionConfig } from 'payload';
import { slugify } from '../lib/slugify';
import { publishedContentAccess } from '../lib/access';
import { seoFields } from '../fields/seoFields';

export const Rooms: CollectionConfig = {
  slug: 'rooms',
  labels: { singular: 'اتاق', plural: 'اتاق‌ها (دسته‌ی سنی)' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug'],
    group: 'کاتالوگ',
  },
  access: publishedContentAccess,
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data?.name && !data?.slug) {
          data.slug = slugify(data.name as string);
        }
        return data;
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true, label: 'نام اتاق' },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'اسلاگ',
      admin: { position: 'sidebar', description: 'ASCII فقط: kid, teen, adult' },
    },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'تصویر کاور',
    },
    {
      name: 'tagline',
      type: 'text',
      maxLength: 200,
      label: 'تک‌خطی توضیحی',
      admin: { description: 'یک جمله که در کارت روی صفحه‌ی اصلی دیده می‌شود.' },
    },
    {
      name: 'longDescription',
      type: 'richText',
      label: 'توضیحات بلند',
    },
    seoFields,
  ],
};
```

- [ ] **Step 4.2: Register the collection**

Open `services/api/src/payload.config.ts`. Add the import and include `Rooms` in the `collections` array:

```ts
import { Rooms } from './collections/Rooms';
// ...
export default buildConfig({
  // ...
  collections: [
    // ...existing collections,
    Rooms,
  ],
  // ...
});
```

- [ ] **Step 4.3: Typecheck**

Run: `pnpm --filter services/api typecheck` (or the matching workspace filter).
Expected: PASS.

- [ ] **Step 4.4: Restart Payload, verify in admin**

Run: `pm2 restart zhic-api --update-env && sleep 5`
Visit `http://80.240.31.146:3001/admin/collections/rooms` and verify the collection appears empty with the right field set.

- [ ] **Step 4.5: Commit**

```bash
git add services/api/src/collections/Rooms.ts services/api/src/payload.config.ts
git commit -m "feat(api): add Rooms collection for age-category landing pages

Three seeded entries (kid/teen/adult) populate the homepage age tiles
and back the new /rooms/[slug] route."
```

---

### Task 5: Seed three default rooms

**Files:**
- Modify: `services/api/src/seed.ts` (or wherever the existing seed lives — check)

- [ ] **Step 5.1: Locate the seed script**

Run: `find services/api/src -name "seed*"` and `grep -l "createCollection\|payload.create" services/api/src/**/*.ts 2>/dev/null | head`. Use the existing seed entry-point pattern. If none exists, create `services/api/src/scripts/seed-rooms.ts` as a standalone Node script importable via `pnpm tsx`.

- [ ] **Step 5.2: Add the three room seeds**

Add to the seed script:

```ts
const ROOM_SEEDS = [
  {
    slug: 'kid',
    name: 'اتاق کودک',
    tagline: 'سرویس‌ها و قطعات ایمن، با رنگ‌های آرام و قابل‌رشد همراه با کودک.',
  },
  {
    slug: 'teen',
    name: 'اتاق نوجوان',
    tagline: 'طراحی‌های منعطف برای سال‌های پر‌تغییر؛ از میز تحریر تا کتابخانه.',
  },
  {
    slug: 'adult',
    name: 'اتاق بزرگسال',
    tagline: 'سرویس‌های هماهنگ از گردوی ایرانی، برای آرامش بلندمدت.',
  },
];

for (const seed of ROOM_SEEDS) {
  const existing = await payload.find({
    collection: 'rooms',
    where: { slug: { equals: seed.slug } },
    limit: 1,
  });
  if (existing.docs.length > 0) continue;
  await payload.create({ collection: 'rooms', data: seed });
}
```

(`cover` is required but Payload will fail unless a media doc is supplied. Either upload three placeholder covers via the admin before running the seed, or skip the `cover` requirement at seed-time by leaving the seed records as drafts and letting the operator finish them in the admin.)

- [ ] **Step 5.3: Run the seed**

Run the seed command per existing convention. Example: `pnpm --filter services/api seed:rooms` (add to `package.json` scripts if missing).

- [ ] **Step 5.4: Verify in admin**

Visit `http://80.240.31.146:3001/admin/collections/rooms`. Expected: three rows (kid, teen, adult) each with the seeded name + tagline; the operator manually attaches `cover` images and writes `longDescription` afterward.

- [ ] **Step 5.5: Commit**

```bash
git add services/api/src/scripts/seed-rooms.ts services/api/package.json
git commit -m "chore(api/seed): seed kid/teen/adult rooms

Idempotent — skips entries whose slug already exists. cover + longDescription
left for the operator to fill via the admin UI."
```

---

### Task 6: Build the `/rooms/[slug]` page

**Files:**
- Create: `apps/web/src/app/(site)/rooms/[slug]/page.tsx`
- Modify: `apps/web/src/lib/payload.ts` (add `fetchRoom(slug)`)

- [ ] **Step 6.1: Add the `fetchRoom` query**

In `apps/web/src/lib/payload.ts`, add (mirroring existing collection-fetch patterns):

```ts
export type PayloadRoom = {
  id: string;
  name: string;
  slug: string;
  cover?: { url?: string; alt?: string };
  tagline?: string;
  longDescription?: LexicalRoot | null;
};

export async function fetchRoom(slug: string): Promise<PayloadRoom | null> {
  const res = await fetch(`${PAYLOAD_API}/api/rooms?where[slug][equals]=${encodeURIComponent(slug)}&limit=1`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.docs?.[0] ?? null;
}
```

(Adapt to whatever existing fetch wrapper / typed-client pattern is in use — `fetchHome`, `fetchShowrooms`, etc. — and follow the same shape.)

- [ ] **Step 6.2: Create the route**

Create `apps/web/src/app/(site)/rooms/[slug]/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EditorialPage } from '@/components/editorial/EditorialPage';
import { fetchRoom } from '@/lib/payload';

const VALID_SLUGS = new Set(['kid', 'teen', 'adult']);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const room = await fetchRoom(slug);
  if (!room) return { title: 'یافت نشد' };
  return {
    title: room.name,
    description: room.tagline,
  };
}

export default async function RoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!VALID_SLUGS.has(slug)) notFound();
  const room = await fetchRoom(slug);
  if (!room) notFound();

  return (
    <EditorialPage
      eyebrow="دسته‌ی سنی"
      heading={room.name}
      lead={room.tagline}
      body={room.longDescription ?? null}
      heroHeight="lg"
    />
  );
}
```

- [ ] **Step 6.3: Build + verify**

Run: `pnpm --filter web build && pm2 restart zhic-web --update-env`
Visit `http://80.240.31.146:3000/rooms/kid`, `/rooms/teen`, `/rooms/adult`. Expected: each renders the editorial page chrome with the seeded name + tagline. `/rooms/foo` 404s.

- [ ] **Step 6.4: Commit**

```bash
git add apps/web/src/lib/payload.ts apps/web/src/app/\(site\)/rooms
git commit -m "feat(web): add /rooms/[slug] landing pages

Renders kid/teen/adult via the EditorialPage chrome. Unknown slugs
404 — slug allowlist enforced before the Payload fetch."
```

---

### Task 7: Build `HomeRoomsTiles` component

**Files:**
- Create: `apps/web/src/components/home/HomeRoomsTiles.tsx`
- Create: `apps/web/src/components/home/home-rooms-tiles.css`

- [ ] **Step 7.1: Create the component**

Create `apps/web/src/components/home/HomeRoomsTiles.tsx`:

```tsx
import Link from 'next/link';
import { Container, ParallaxImage } from '@zhic/ui';
import './home-rooms-tiles.css';

export type HomeRoomTile = {
  slug: 'kid' | 'teen' | 'adult';
  name: string;
  tagline?: string;
  coverUrl: string;
};

export type HomeRoomsTilesProps = {
  rooms: HomeRoomTile[];
};

export function HomeRoomsTiles({ rooms }: HomeRoomsTilesProps) {
  if (rooms.length === 0) return null;
  return (
    <section className="zh-rooms" aria-label="دسته‌بندی سنی">
      <Container>
        <div className="zh-rooms__grid">
          {rooms.map((r) => (
            <Link key={r.slug} href={`/rooms/${r.slug}`} className="zh-rooms__tile">
              <ParallaxImage
                src={r.coverUrl}
                alt={r.name}
                verticalAmount={80}
                topRightRadius={48}
                className="zh-rooms__media"
              />
              <div className="zh-rooms__label">دسته‌ی سنی</div>
              <div className="zh-rooms__title">{r.name}</div>
              {r.tagline && <p className="zh-rooms__sub">{r.tagline}</p>}
              <span className="zh-rooms__cta">
                مشاهده
                <span aria-hidden className="zh-rooms__arrow" />
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 7.2: Create the CSS**

Create `apps/web/src/components/home/home-rooms-tiles.css`:

```css
.zh-rooms { background: var(--color-ivory); padding-block: var(--space-7); }
@media (min-width: 768px) {
  .zh-rooms { padding-block: var(--space-9); padding-inline: var(--space-7); }
}
.zh-rooms__grid { display: grid; grid-template-columns: 1fr; gap: var(--space-4); max-width: var(--width-container-storefront); margin-inline: auto; }
@media (min-width: 768px) {
  .zh-rooms__grid { grid-template-columns: 1fr 1fr 1fr; gap: var(--space-5); }
}
.zh-rooms__tile { display: flex; flex-direction: column; text-decoration: none; color: inherit; transition: transform var(--dur-hover) var(--ease-out-soft); }
.zh-rooms__tile:hover { transform: translateY(-2px); }
.zh-rooms__media { aspect-ratio: 4 / 5; margin-bottom: var(--space-4); }
@media (max-width: 767px) {
  .zh-rooms__media { aspect-ratio: 5 / 3; }
  /* Phone: tighter corner */
  .zh-rooms__tile :where(.zh-rooms__media) > div { border-top-right-radius: 28px !important; }
}
.zh-rooms__label { font-size: var(--text-eyebrow); font-weight: 700; text-transform: uppercase; letter-spacing: var(--tracking-eyebrow-wide); color: var(--color-forest); margin-bottom: 6px; }
.zh-rooms__title { font-size: 1.5rem; font-weight: 700; color: var(--color-ink); margin-bottom: var(--space-2); }
.zh-rooms__sub { font-size: var(--text-small); color: var(--color-stone); line-height: 1.7; max-width: 36ch; margin-bottom: var(--space-4); }
.zh-rooms__cta { display: inline-flex; align-items: center; gap: 0.5rem; align-self: flex-start; font-weight: 700; color: var(--color-charcoal); border-bottom: 1px solid var(--color-charcoal); padding-bottom: 2px; transition: color var(--dur-hover) var(--ease-out-soft), border-color var(--dur-hover) var(--ease-out-soft); }
.zh-rooms__tile:hover .zh-rooms__cta { color: var(--color-forest); border-bottom-color: var(--color-forest); }
.zh-rooms__arrow { display: inline-block; width: 1rem; height: 1px; background: currentColor; position: relative; }
.zh-rooms__arrow::before { content: ''; position: absolute; inset-inline-start: -2px; top: -3px; width: 7px; height: 7px; border-inline-start: 1.5px solid currentColor; border-block-end: 1.5px solid currentColor; transform: rotate(45deg); }
```

- [ ] **Step 7.3: Typecheck + commit**

Run: `pnpm --filter web typecheck`

```bash
git add apps/web/src/components/home/HomeRoomsTiles.tsx apps/web/src/components/home/home-rooms-tiles.css
git commit -m "feat(web/home): add HomeRoomsTiles — three age-category tiles

Reuses @zhic/ui ParallaxImage at 80% strength. Top-right corner curve
48px desktop / 28px phone. Links to /rooms/[slug]."
```

---

### Task 8: Wire `HomeRoomsTiles` into the home page

**Files:**
- Modify: `apps/web/src/lib/payload.ts` (add `fetchRooms()`)
- Modify: `apps/web/src/app/(site)/page.tsx`

- [ ] **Step 8.1: Add the fetch helper**

In `apps/web/src/lib/payload.ts`:

```ts
export async function fetchRooms(): Promise<PayloadRoom[]> {
  const res = await fetch(`${PAYLOAD_API}/api/rooms?limit=10&sort=slug`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.docs ?? [];
}
```

- [ ] **Step 8.2: Render between hero and brand-statement**

In `apps/web/src/app/(site)/page.tsx`:

```tsx
import { HomeRoomsTiles, type HomeRoomTile } from '@/components/home/HomeRoomsTiles';
// add to Promise.all:
const [home, showrooms, articles, rooms] = await Promise.all([
  fetchHome(),
  fetchShowrooms(3),
  fetchLatestArticles(3),
  fetchRooms(),
]);

const roomTiles: HomeRoomTile[] = rooms
  .filter((r) => r.cover?.url)
  .filter((r): r is typeof r & { slug: 'kid' | 'teen' | 'adult' } => ['kid', 'teen', 'adult'].includes(r.slug))
  .map((r) => ({
    slug: r.slug,
    name: r.name,
    tagline: r.tagline,
    coverUrl: r.cover!.url!,
  }));

// in JSX, between HomeHeroCarousel and HomeBrandStatement:
<HomeRoomsTiles rooms={roomTiles} />
```

- [ ] **Step 8.3: Build + verify**

Build, restart, visit `/`. Expected: three tiles between hero and brand-statement; scrolling produces visible parallax inside each cover.

- [ ] **Step 8.4: Commit**

```bash
git add apps/web/src/app/\(site\)/page.tsx apps/web/src/lib/payload.ts
git commit -m "feat(web/home): wire HomeRoomsTiles between hero and brand-statement"
```

---

### Task 9: Update `HomeBrandStatement` — bg + numeric stats + count-up

**Files:**
- Modify: `apps/web/src/components/home/HomeBrandStatement.tsx`
- Modify: `apps/web/src/components/home/StatBlock.tsx`

- [ ] **Step 9.1: Shift `BrandStat` to numeric**

In `HomeBrandStatement.tsx`:

```ts
export type BrandStat = {
  value: number;
  suffix?: string;
  label: string;
};

const DEFAULT_STATS: BrandStat[] = [
  { value: 25, suffix: '+', label: 'سال تجربه در صنایع چوب' },
  { value: 1200, suffix: '+', label: 'قطعه مبلمان تولیدشده' },
  { value: 3, label: 'شوروم در سراسر ایران' },
];
```

- [ ] **Step 9.2: Update background class + StatBlock props**

In `HomeBrandStatement.tsx`, change the outer section className from `bg-ink` to `bg-forest-dark`:

```tsx
<section className="relative overflow-hidden bg-forest-dark py-9 text-ivory md:py-11">
```

In `apps/web/src/components/home/StatBlock.tsx`:

```tsx
import { CountUp } from '@zhic/ui';

export type StatBlockProps = {
  value: number;
  suffix?: string;
  label: string;
};

export function StatBlock({ value, suffix, label }: StatBlockProps) {
  return (
    <div className="border-s-2 border-gold ps-5">
      <div className="text-h3 font-black leading-[var(--leading-h2)] text-ivory md:text-h2">
        <CountUp value={value} suffix={suffix} />
      </div>
      <div className="mt-1 text-small font-light text-sand">{label}</div>
    </div>
  );
}
```

In `HomeBrandStatement.tsx`, update the map call:

```tsx
{stats.map((s, i) => (
  <div key={i} className="min-w-[140px] shrink-0 md:min-w-0 md:shrink">
    <StatBlock value={s.value} suffix={s.suffix} label={s.label} />
  </div>
))}
```

- [ ] **Step 9.3: Typecheck (consumers of the old string-valued shape will flag)**

Run: `pnpm --filter web typecheck`
Expected: any caller passing the old `{ value: '۲۵+' }` shape now errors. Fix those sites by switching to `{ value: 25, suffix: '+' }`. The /lab page that demos `HomeBrandStatement` may need an update.

- [ ] **Step 9.4: Build + verify**

Build, restart, visit `/`. Expected: brand-statement section sits on dark forest green; on first scroll-into-view the three numbers animate from ۰ to their targets; reload to see again; scrolling back up does NOT replay.

- [ ] **Step 9.5: Commit**

```bash
git add apps/web/src/components/home/HomeBrandStatement.tsx apps/web/src/components/home/StatBlock.tsx
git commit -m "feat(web/home): brand-statement uses forest-dark bg + animated counters

Section background switches from bg-ink to bg-forest-dark to align
with the new footer chrome. BrandStat shape moves from string ('۲۵+')
to { value: number; suffix?: string } so CountUp can animate from 0."
```

---

### Task 10: Build `HomeJournalRows` — three-row scroll parallax

**Files:**
- Create: `apps/web/src/components/home/HomeJournalRows.tsx`
- Create: `apps/web/src/components/home/home-journal-rows.css`
- Create: `apps/web/src/components/home/journal-rows-math.ts`
- Create: `apps/web/src/components/home/__tests__/journal-rows-math.test.ts` (or `packages/ui/test/` if migrated)

- [ ] **Step 10.1: Write the failing math test**

Choose where the test goes:
- If `apps/web` has a vitest config — colocate.
- If not, the pure math can live in `packages/ui` (alongside `parallax-math.ts`) and reuse Plan A's vitest setup. **Recommended:** put it in `packages/ui/src/journal-rows-math.ts` + `packages/ui/test/journal-rows-math.test.ts`.

Test file:

```ts
import { describe, it, expect } from 'vitest';
import { computeRowOffset } from '../src/journal-rows-math';

describe('computeRowOffset', () => {
  const vh = 800;
  const sectionHeight = 1200;

  it('returns 0 when section is exactly centered', () => {
    // rectTop = (vh - sectionHeight) / 2 = -200
    // progress = (vh - rectTop) / (vh + sectionHeight) = 1000/2000 = 0.5
    // t = (0.5 - 0.5) * 2 = 0
    expect(computeRowOffset({ rectTop: -200, sectionHeight, viewportHeight: vh }, 0.35, 300)).toBeCloseTo(0, 5);
  });

  it('returns max positive offset when t = +1 (section fully past viewport top)', () => {
    expect(computeRowOffset({ rectTop: -sectionHeight, sectionHeight, viewportHeight: vh }, 0.35, 300)).toBeCloseTo(105, 1);
  });

  it('returns max negative offset when t = -1 (section just entering)', () => {
    expect(computeRowOffset({ rectTop: vh, sectionHeight, viewportHeight: vh }, 0.35, 300)).toBeCloseTo(-105, 1);
  });

  it('negative speed reverses direction', () => {
    expect(computeRowOffset({ rectTop: -sectionHeight, sectionHeight, viewportHeight: vh }, -0.55, 300)).toBeCloseTo(-165, 1);
  });

  it('respects the max displacement cap', () => {
    expect(computeRowOffset({ rectTop: -sectionHeight, sectionHeight, viewportHeight: vh }, 0.5, 140)).toBeCloseTo(70, 1);
  });
});
```

Run: `pnpm --filter @zhic/ui test`
Expected: FAIL.

- [ ] **Step 10.2: Implement the math**

Create `packages/ui/src/journal-rows-math.ts`:

```ts
export type JournalRowInput = {
  /** getBoundingClientRect().top of the parallax section. */
  rectTop: number;
  /** offsetHeight of the parallax section. */
  sectionHeight: number;
  /** window.innerHeight. */
  viewportHeight: number;
};

/**
 * Pure row-offset math for the home journal three-row scroll parallax.
 * `speed` is signed (negative = drift in the opposite direction). `max` is the
 * absolute peak displacement in px when t = ±1.
 */
export function computeRowOffset(input: JournalRowInput, speed: number, max: number): number {
  const { rectTop, sectionHeight, viewportHeight } = input;
  if (sectionHeight === 0) return 0;
  const total = viewportHeight + sectionHeight;
  const progress = Math.max(0, Math.min(1, (viewportHeight - rectTop) / total));
  const t = (progress - 0.5) * 2; // -1 .. +1
  return t * speed * max;
}
```

Run: `pnpm --filter @zhic/ui test`
Expected: PASS.

- [ ] **Step 10.3: Export from `@zhic/ui` index**

Append to `packages/ui/src/index.ts`:

```ts
export { computeRowOffset } from './journal-rows-math';
export type { JournalRowInput } from './journal-rows-math';
```

- [ ] **Step 10.4: Build the React component**

Create `apps/web/src/components/home/HomeJournalRows.tsx`:

```tsx
'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Container, computeRowOffset } from '@zhic/ui';
import { toPersianDigits } from '@zhic/locale';
import './home-journal-rows.css';

export type HomeJournalArticle = {
  slug: string;
  title: string;
  category: string;
  coverUrl: string;
};

export type HomeJournalRowsProps = {
  articles: HomeJournalArticle[];
  /** Heading text. */
  eyebrow?: string;
  heading?: string;
  lead?: string;
};

// Speed × direction per row (matches framer.university intent).
const SPEEDS = { 0: 0.35, 1: -0.55, 2: 0.75 } as const;
const MAX_DESKTOP = 300;
const MAX_PHONE = 140;

export function HomeJournalRows({
  articles,
  eyebrow = 'ژورنال ژیک',
  heading = 'از کارگاه، از همدان',
  lead = 'یادداشت‌هایی از پشت‌صحنه‌ی ساخت، انتخاب چوب، و طرح‌هایی که از سنت بلند ایران الهام گرفته‌اند.',
}: HomeJournalRowsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const max = window.innerWidth < 768 ? MAX_PHONE : MAX_DESKTOP;
    let rafId: number | null = null;
    let ticking = false;

    const update = () => {
      const rect = section.getBoundingClientRect();
      rowRefs.current.forEach((row, i) => {
        if (!row) return;
        const speed = SPEEDS[i as 0 | 1 | 2] ?? 0;
        const x = computeRowOffset(
          { rectTop: rect.top, sectionHeight: section.offsetHeight, viewportHeight: window.innerHeight },
          speed,
          max,
        );
        row.style.transform = `translateX(${x.toFixed(2)}px)`;
      });
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      rafId = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  // Distribute articles round-robin into 3 rows.
  const rows: HomeJournalArticle[][] = [[], [], []];
  articles.forEach((a, i) => rows[i % 3].push(a));

  return (
    <section ref={sectionRef} className="zh-jrows" aria-label="ژورنال">
      <Container>
        <div className="zh-jrows__head">
          <div className="zh-jrows__eyebrow">{eyebrow}</div>
          <h2 className="zh-jrows__heading">{heading}</h2>
          <p className="zh-jrows__lead">{lead}</p>
        </div>
      </Container>

      <div className="zh-jrows__rows">
        {rows.map((row, i) => (
          <div
            key={i}
            ref={(el) => (rowRefs.current[i] = el)}
            className="zh-jrows__row"
            data-row={i}
          >
            {row.map((a) => (
              <Link key={a.slug} href={`/journal/${a.slug}`} className="zh-jrows__card">
                <div
                  className="zh-jrows__cover"
                  style={{ backgroundImage: `url(${a.coverUrl})` }}
                  aria-hidden
                />
                <div className="zh-jrows__cat">{a.category}</div>
                <div className="zh-jrows__title">{a.title}</div>
              </Link>
            ))}
          </div>
        ))}
      </div>

      <Container>
        <div className="zh-jrows__cta-row">
          <Link href="/journal" className="zh-jrows__cta">
            همه‌ی مقالات
            <span aria-hidden className="zh-jrows__arrow" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 10.5: Create the CSS**

Create `apps/web/src/components/home/home-journal-rows.css`:

```css
.zh-jrows { background: var(--color-ivory); padding-block: var(--space-9); overflow: hidden; }
.zh-jrows__head { max-width: 560px; margin-bottom: var(--space-7); }
.zh-jrows__eyebrow { font-size: var(--text-eyebrow); font-weight: 700; text-transform: uppercase; letter-spacing: var(--tracking-eyebrow-wide); color: var(--color-forest); margin-bottom: var(--space-3); }
.zh-jrows__heading { font-size: var(--text-h2); font-weight: 900; line-height: var(--leading-h2); color: var(--color-ink); margin-bottom: var(--space-4); }
.zh-jrows__lead { font-size: var(--text-body); color: var(--color-stone); font-weight: 300; line-height: 1.85; }

.zh-jrows__rows { display: flex; flex-direction: column; gap: var(--space-5); margin-bottom: var(--space-7); }
.zh-jrows__row { display: flex; flex-direction: row; gap: var(--space-5); will-change: transform; transform: translateX(0); padding-inline: max(0px, calc((100vw - var(--width-container-storefront)) / -2)); }

.zh-jrows__card { flex: 0 0 auto; width: 340px; display: flex; flex-direction: column; text-decoration: none; color: inherit; }
@media (max-width: 767px) { .zh-jrows__card { width: 200px; } }
.zh-jrows__cover { aspect-ratio: 16 / 9; background: linear-gradient(135deg, var(--color-cream), var(--color-sand)); background-size: cover; background-position: center; margin-bottom: 0.7rem; overflow: hidden; border-top-right-radius: 20px; position: relative; }
.zh-jrows__cover::after { content: ''; position: absolute; inset: 0; background: linear-gradient(to top, rgba(20,17,15,0.18), transparent 60%); pointer-events: none; }
.zh-jrows__cat { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: var(--tracking-eyebrow-wide); color: var(--color-forest); margin-bottom: 0.3rem; }
.zh-jrows__title { font-size: 0.9rem; font-weight: 700; line-height: 1.4; color: var(--color-ink); display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
@media (max-width: 767px) { .zh-jrows__title { font-size: 0.78rem; } }

.zh-jrows__cta-row { display: flex; justify-content: flex-end; }
.zh-jrows__cta { display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 700; color: var(--color-charcoal); border-bottom: 1px solid var(--color-charcoal); padding-bottom: 2px; text-decoration: none; transition: color var(--dur-hover) var(--ease-out-soft), border-color var(--dur-hover) var(--ease-out-soft); }
.zh-jrows__cta:hover { color: var(--color-forest); border-bottom-color: var(--color-forest); }
.zh-jrows__arrow { display: inline-block; width: 1rem; height: 1px; background: currentColor; position: relative; }
.zh-jrows__arrow::before { content: ''; position: absolute; inset-inline-start: -2px; top: -3px; width: 7px; height: 7px; border-inline-start: 1.5px solid currentColor; border-block-end: 1.5px solid currentColor; transform: rotate(45deg); }

@media (prefers-reduced-motion: reduce) {
  .zh-jrows__row { transform: none !important; }
}
```

- [ ] **Step 10.6: Commit**

```bash
git add packages/ui/src/journal-rows-math.ts packages/ui/test/journal-rows-math.test.ts packages/ui/src/index.ts apps/web/src/components/home/HomeJournalRows.tsx apps/web/src/components/home/home-journal-rows.css
git commit -m "feat(web/home): add HomeJournalRows — three-row scroll parallax

Ports framer.university's Row 1/Row 2/Row 3 Illustration. Three rows of
compact article cards drift horizontally at different rates as the user
scrolls. Speed mix: +0.35, -0.55, +0.75. Pure offset math extracted to
@zhic/ui/journal-rows-math (unit-tested). Honors prefers-reduced-motion."
```

---

### Task 11: Replace `HomeJournalTeaser` and shift the article query

**Files:**
- Modify: `apps/web/src/lib/payload.ts` (extend `fetchLatestArticles` to optionally take a limit)
- Modify: `apps/web/src/app/(site)/page.tsx`

- [ ] **Step 11.1: Bump the article fetch limit to 15**

In `apps/web/src/lib/payload.ts`, ensure `fetchLatestArticles(limit: number = 3)` accepts an arg (it likely already does). If not, refactor.

- [ ] **Step 11.2: Swap the component in the home page**

In `apps/web/src/app/(site)/page.tsx`:

```tsx
import { HomeJournalRows, type HomeJournalArticle } from '@/components/home/HomeJournalRows';
// remove the HomeJournalTeaser import

const articles = await fetchLatestArticles(15);

const journalArticles: HomeJournalArticle[] = articles.map((a) => ({
  slug: a.slug,
  title: a.title,
  category: a.category?.name ?? '',
  coverUrl: a.cover?.url ?? '/hero/IMG_0889.jpeg',
}));

// in JSX, replace <HomeJournalTeaser /> with:
<HomeJournalRows articles={journalArticles} />
```

- [ ] **Step 11.3: Build + verify**

Build, restart, scroll the home page through the journal section. Expected: three rows of cards drift horizontally at different speeds and directions.

- [ ] **Step 11.4: Commit**

```bash
git add apps/web/src/lib/payload.ts apps/web/src/app/\(site\)/page.tsx
git commit -m "feat(web/home): replace HomeJournalTeaser with HomeJournalRows

Query shifts from latest-3-featured to latest-15-published, distributed
round-robin into 3 rows of 5 cards."
```

---

### Task 12: Build `HomeShowroomsTeaser`

**Files:**
- Create: `apps/web/src/components/home/HomeShowroomsTeaser.tsx`
- Create: `apps/web/src/components/home/home-showrooms-teaser.css`

- [ ] **Step 12.1: Create the component**

```tsx
import Link from 'next/link';
import { Container } from '@zhic/ui';
import './home-showrooms-teaser.css';

export type HomeShowroomCard = {
  slug: string;
  city: string;
  addressLine: string;
  phone?: string;
  coverUrl: string;
  isCentral?: boolean;
};

export type HomeShowroomsTeaserProps = {
  showrooms: HomeShowroomCard[];
};

export function HomeShowroomsTeaser({ showrooms }: HomeShowroomsTeaserProps) {
  if (showrooms.length === 0) return null;
  return (
    <section className="zh-st" aria-label="شوروم‌ها">
      <Container>
        <div className="zh-st__head">
          <div className="zh-st__head-left">
            <div className="zh-st__eyebrow">شوروم‌ها</div>
            <div className="zh-st__title">ما را در شهر خودتان ببینید</div>
          </div>
          <Link href="/showrooms" className="zh-st__cta">
            فهرست کامل
            <span aria-hidden className="zh-st__arrow" />
          </Link>
        </div>

        <div className="zh-st__grid">
          {showrooms.map((s) => (
            <Link key={s.slug} href={`/showrooms/${s.slug}`} className="zh-st__card">
              <div className="zh-st__cover" style={{ backgroundImage: `url(${s.coverUrl})` }} aria-hidden />
              <div className="zh-st__city">
                {s.city}
                {s.isCentral ? ' · شوروم مرکزی' : ''}
              </div>
              <div className="zh-st__addr">{s.addressLine}</div>
              {s.phone && <div className="zh-st__phone" dir="ltr">{s.phone}</div>}
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 12.2: Create the CSS**

```css
.zh-st { background: var(--color-ivory); border-top: 1px solid var(--color-sand); padding-block: var(--space-7); }
.zh-st__head { display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-6); }
@media (min-width: 768px) {
  .zh-st__head { flex-direction: row; align-items: baseline; justify-content: space-between; }
}
.zh-st__head-left { display: flex; flex-direction: column; gap: 0.4rem; }
.zh-st__eyebrow { font-size: var(--text-eyebrow); font-weight: 700; text-transform: uppercase; letter-spacing: var(--tracking-eyebrow-wide); color: var(--color-forest); }
.zh-st__title { font-size: 1.5rem; font-weight: 900; color: var(--color-ink); line-height: 1.3; }
.zh-st__cta { display: inline-flex; align-self: flex-start; align-items: center; gap: 0.5rem; font-weight: 700; color: var(--color-charcoal); border-bottom: 1px solid var(--color-charcoal); padding-bottom: 2px; text-decoration: none; transition: color var(--dur-hover) var(--ease-out-soft), border-color var(--dur-hover) var(--ease-out-soft); }
.zh-st__cta:hover { color: var(--color-forest); border-bottom-color: var(--color-forest); }
.zh-st__arrow { display: inline-block; width: 1rem; height: 1px; background: currentColor; position: relative; }
.zh-st__arrow::before { content: ''; position: absolute; inset-inline-start: -2px; top: -3px; width: 7px; height: 7px; border-inline-start: 1.5px solid currentColor; border-block-end: 1.5px solid currentColor; transform: rotate(45deg); }

.zh-st__grid { display: grid; grid-template-columns: 1fr; gap: var(--space-5); }
@media (min-width: 768px) {
  .zh-st__grid { grid-template-columns: 1fr 1fr 1fr; }
}
.zh-st__card { display: flex; flex-direction: column; text-decoration: none; color: inherit; transition: transform var(--dur-hover) var(--ease-out-soft); }
.zh-st__card:hover { transform: translateY(-2px); }
.zh-st__cover { aspect-ratio: 3 / 2; background-size: cover; background-position: center; margin-bottom: 0.85rem; overflow: hidden; border-top-right-radius: 20px; position: relative; }
.zh-st__cover::after { content: ''; position: absolute; inset: 0; background: linear-gradient(to top, rgba(20,17,15,0.18), transparent 60%); pointer-events: none; }
.zh-st__city { font-size: 1.05rem; font-weight: 700; color: var(--color-ink); margin-bottom: 0.25rem; }
.zh-st__addr { font-size: 0.85rem; color: var(--color-stone); font-weight: 300; line-height: 1.7; }
.zh-st__phone { font-size: var(--text-eyebrow); color: var(--color-stone); margin-top: 0.3rem; font-variant-numeric: tabular-nums; }
```

- [ ] **Step 12.3: Commit**

```bash
git add apps/web/src/components/home/HomeShowroomsTeaser.tsx apps/web/src/components/home/home-showrooms-teaser.css
git commit -m "feat(web/home): add HomeShowroomsTeaser — compact 3-up card grid"
```

---

### Task 13: Wire `HomeShowroomsTeaser` + remove `HomeFeaturedDesigns` + `HomeInquiryCta`

**Files:**
- Modify: `apps/web/src/app/(site)/page.tsx`
- Delete (or keep with no caller): `apps/web/src/components/home/HomeShowroomsStrip.tsx` (replaced) — keep file in tree for now if it's used in `/lab/page.tsx`

- [ ] **Step 13.1: Build the showroom-card mapping in the page**

```tsx
import { HomeShowroomsTeaser, type HomeShowroomCard } from '@/components/home/HomeShowroomsTeaser';

const showroomCards: HomeShowroomCard[] = showrooms.slice(0, 3).map((s) => ({
  slug: s.slug,
  city: s.address?.city ?? s.name,
  addressLine: [s.address?.district, s.address?.street, s.address?.plaque].filter(Boolean).join('، '),
  phone: s.phone,
  coverUrl: s.cover?.url ?? '/hero/IMG_0889.jpeg',
  isCentral: s.is_central,
}));
```

(Adjust to whatever field names `fetchShowrooms` returns — refer to `services/api/src/collections/Showrooms.ts`.)

- [ ] **Step 13.2: Update the JSX order**

The home page JSX should now be:

```tsx
return (
  <>
    <HomeHeroCarousel slides={finalSlides} heading={...} subheading={...} />
    <HomeRoomsTiles rooms={roomTiles} />
    <HomeBrandStatement statement={home?.brand_statement ?? null} />
    <HomeJournalRows articles={journalArticles} />
    <HomeShowroomsTeaser showrooms={showroomCards} />
  </>
);
```

Remove the imports + JSX for `HomeFeaturedDesigns`, `HomeShowroomsStrip`, `HomeJournalTeaser`, and `HomeInquiryCta`.

- [ ] **Step 13.3: Build + verify**

Build, restart, visit `/`. Expected: section order = hero → rooms → brand-statement → journal rows → showrooms teaser → site footer (still the old footer; Plan C updates that). No HomeFeaturedDesigns or HomeInquiryCta visible.

- [ ] **Step 13.4: Commit**

```bash
git add apps/web/src/app/\(site\)/page.tsx
git commit -m "feat(web/home): finalize section order — remove FeaturedDesigns + InquiryCta

Home page is now exactly the five sections specified: hero → age tiles
→ brand-statement → journal rows → showrooms teaser. The legacy
HomeFeaturedDesigns and HomeInquiryCta files remain in the tree for
now (used by /lab/page.tsx) and will be deleted in a follow-up if
nothing else picks them up."
```

---

### Task 14: Apply `BlurInText` to the home page

**Files:**
- Modify: `apps/web/src/components/hero/HomeHeroCarousel.tsx`
- Modify: `apps/web/src/components/home/HomeBrandStatement.tsx`
- Modify: `apps/web/src/components/home/HomeRoomsTiles.tsx`
- Modify: `apps/web/src/components/home/HomeJournalRows.tsx`
- Modify: `apps/web/src/components/home/HomeShowroomsTeaser.tsx`

- [ ] **Step 14.1: Wrap user-facing text in `<BlurInText>`**

For each component, replace the relevant headings/eyebrows/paragraphs:

```tsx
import { BlurInText } from '@zhic/ui';

// HomeHeroCarousel:
<BlurInText as="div" className="zh-hhc__eyebrow">{eyebrow}</BlurInText>
<BlurInText as="h1" className="zh-hhc__heading">{heading}</BlurInText>
<BlurInText as="p" className="zh-hhc__sub">{subheading}</BlurInText>

// HomeBrandStatement: eyebrow, h2, paragraph (the StatBlock numeric values keep CountUp, NOT BlurInText)
// HomeRoomsTiles: label, title, sub
// HomeJournalRows: eyebrow, heading, lead, CTA (NOT the article cards — those animate on row scroll, not blur)
// HomeShowroomsTeaser: eyebrow, title, CTA
```

**Do NOT wrap:**
- `<CountUp>` stat values (RAF rewrites textContent each frame; conflicts with the per-word splitter).
- Inline content with nested elements (e.g., a CTA with an arrow icon span — wrap the text-only siblings instead).
- Long bodies of richText (BlurInText takes string only).

- [ ] **Step 14.2: Build + verify**

Build, restart, reload `/`. Each text element should appear with a per-word blur-in as it enters the viewport. Persian glyph shaping intact within each word.

- [ ] **Step 14.3: Commit**

```bash
git add apps/web/src/components/hero/HomeHeroCarousel.tsx apps/web/src/components/home
git commit -m "feat(web/home): wrap user-facing text with BlurInText

Word-by-word blur reveal on first scroll-into-view, per spec §2.8.
Stats (CountUp) and journal article cards are intentionally not
wrapped — they have their own animations."
```

---

### Task 15: Final verification

- [ ] **Step 15.1: Full repo typecheck**

Run: `pnpm -r typecheck`
Expected: every package PASS.

- [ ] **Step 15.2: Full @zhic/ui test suite**

Run: `pnpm --filter @zhic/ui test`
Expected: ≥21 tests pass (Plan A's tests + the new `journal-rows-math.test.ts`).

- [ ] **Step 15.3: Production build smoke**

Run: `pnpm --filter web build && pm2 restart zhic-web --update-env`
Expected: build succeeds; `/`, `/rooms/kid`, `/rooms/teen`, `/rooms/adult` all in the route table.

- [ ] **Step 15.4: Visual acceptance against the mockup**

Open `http://80.240.31.146:3000/` and compare to `http://80.240.31.146:3000/docs/hero-carousel-mockup.html`. Confirm section order: hero → age tiles → brand-statement → journal rows → showrooms teaser. Trigger every animation: hero slide auto-rotate, age-tile parallax on scroll, count-up on first scroll-into-view, journal rows drifting horizontally, blur-in text. Verify each room route (`/rooms/{kid,teen,adult}`) renders.

- [ ] **Step 15.5: Update `docs/state.md`**

Add a row for "Home Page Reorg Plan B" with status ✅ and the final commit hash. Note that the old `HomeFeaturedDesigns`, `HomeShowroomsStrip`, `HomeJournalTeaser`, and `HomeInquiryCta` components are unused on the home page but kept for `/lab/page.tsx`; flag for cleanup in a later follow-up.

- [ ] **Step 15.6: Final commit**

```bash
git add docs/state.md
git commit -m "docs(state): home page reorg plan B shipped"
```

---

## What this plan delivers

- New `home.heroSlides[]` Payload field (curated slides) + legacy `hero_media` deprecated.
- New `rooms` collection with kid/teen/adult seeded; new dynamic route `/rooms/[slug]`.
- New home page section components: `HomeHeroCarousel`, `HomeRoomsTiles`, `HomeJournalRows`, `HomeShowroomsTeaser`.
- Updated `HomeBrandStatement` (forest-dark bg, numeric stats with `CountUp`).
- Home page reordered to exactly the five spec'd sections; `HomeFeaturedDesigns` and `HomeInquiryCta` removed from the home flow.
- `BlurInText` applied to all user-facing text on the home page.
- One new shared helper in `@zhic/ui`: `computeRowOffset` + tests.

## What this plan explicitly does NOT do

- Touch the navbar or footer. Those belong to Plan C.
- Add an `age` field to `products`. Deferred (spec §7).
- Delete the legacy `HomeFeaturedDesigns`, `HomeShowroomsStrip`, `HomeJournalTeaser`, `HomeInquiryCta` component files — they're still referenced by `/lab/page.tsx`. Cleanup in a later PR.
- Implement the newsletter signup, contact form, or mail provider integration. Those belong to Plan C.
