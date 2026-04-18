# Session 3.1 — Home Page

## Goal

Ship the first **real storefront page**: the Persian home at `/`,
composed from `@zhic/ui` primitives + the cards and gallery from 2.3 +
data pulled live from Payload 3 via `services/api`. Along the way,
land the three remaining layout primitives that home needs
(`<Grid>`, `<Stack>`, `<Split>`), introduce a thin server-only fetch
layer (`apps/web/src/lib/payload.ts`) that 3.2 / 3.3 / 4.1 will
share, and a minimal Lexical richText serializer so the CMS's
`brand_statement` renders without a new package. The English mockup
(five sections + its bespoke Button / ProductCard / SectionHeading /
ScrollReveal / `data/products.ts`) is **deleted** at the end of this
session — this is the session where the brand goes Persian-first end
to end on the landing surface.

Authority: `docs/sessions.md` §3.1,
`docs/package1-month1.md` §Home page section,
`docs/spec/sitemap.md` §HomePage (block list, ordering),
`docs/spec/design-system.md` §6 (motion — deferred here),
`docs/spec/data-schemas.md` §12 (products), §28 (showrooms), §60
(articles), §Designs (collection shape),
`services/api/src/globals/Home.ts` (CMS shape for `pages.home`
singleton equivalent).

## Entry state

- `@zhic/ui` ships 2.1 atoms + 2.2 organisms + 2.3 cards + Aspect +
  MoneyDisplay + DateDisplay + ImageGallery + cardClasses. No `Grid`
  / `Stack` / `Split` layout primitives yet (FU-2.2-i still open for
  those three; `Aspect` shipped in 2.3).
- `apps/web/src/app/(site)/layout.tsx` owns the chrome (SkipLink +
  SiteHeader + main + SiteFooter + SmoothScrollProvider, all from 2.2).
- `apps/web/src/app/(site)/page.tsx` currently imports and renders the
  **English mockup** sections (Hero / Video / Products / About /
  Contact). They're kept alive only to stop `/` from 404-ing.
- Mockup components slated for deletion this session:
  - `apps/web/src/components/sections/{Hero,Video,Products,About,Contact}Section.tsx`
  - `apps/web/src/components/ui/{Button,ProductCard,SectionHeading,ScrollReveal}.tsx`
  - `apps/web/src/data/products.ts`
  - `apps/web/src/hooks/useMediaQuery.ts` if no consumer remains
  - `apps/web/src/components/layout/` directory (already empty after 2.2)
- `services/api` runs on **port 3001** (`pnpm --filter @zhic/api dev`).
  Payload 3 + Postgres adapter + S3 (Abr Arvan) storage are wired
  from 1.3. REST endpoints auto-generated at `/api/{collection}` and
  `/api/globals/{slug}`.
- Payload schema deltas from sitemap spec (known, not fixed here):
  - `Showrooms.address` is a `textarea`, not structured `{ street,
    plaque, ... }`.
  - `Showrooms.hours` is free-form `text` ("شنبه تا پنجشنبه ۱۰ تا ۲۰"),
    not a day-by-day array.
  - `Articles.author` is a `text` field, not a relation to `authors`
    (no `authors` collection in Month 1 — §61 is a Package 2+ concern).
  - `Products.basePriceRials` exists; `salePriceRials` / `availability`
    / `leadTimeDays` from §12 spec do not. Home uses `DesignCard`
    (no price) so this doesn't block 3.1.
  - `Home` global (`services/api/src/globals/Home.ts`) fields:
    `hero_media` (upload), `hero_heading`, `hero_subheading`,
    `brand_statement` (richText), `featured_designs` (rel[] →
    designs), `journal_teaser_heading`, `inquiry_cta_heading`.
    Missing: marquee items, editorial-split copy, testimonials,
    newsletter headline, contact-teaser copy. Handled by
    **deferring** those blocks (see §Key decisions).
- Seed (`services/api/src/seed.ts`) today populates 1 category, 2
  tags, 2 designs, 2 products, 1 showroom, 1 article. **Does not**
  populate the `home` global — `pages.home` will be empty until
  either seed updates or an admin fills the fields. Template needs
  to gracefully fall back when a field is empty.
- Storefront env: no `.env` yet. `API_URL` is not configured.
- `packages/api-client` **does not exist** as a workspace package.
  The monorepo layout in `CLAUDE.md` anticipates it; we defer the
  package scaffolding until a second page needs the same helpers
  (promote in 3.2).
- No motion primitives. Storefront spec §6 is rich (hero word reveal,
  block reveal, image reveal, marquee direction under RTL). **Session
  6.2 owns all motion.** 3.1 ships the page static.
- React 19 + Next 16. `'use client'` only where needed.

## Key decisions

| Decision | Choice |
|---|---|
| Block scope | **Six blocks, not nine.** Per `docs/package1-month1.md` (source of truth, which wins over `sitemap.md` per CLAUDE.md sequencing rule): Hero, BrandStatement, FeaturedDesigns, ShowroomsStrip, JournalTeaser, InquiryCTA. **Deferred** per sitemap §HomePage: MarqueeBlock (motion-heavy — 6.2), TestimonialsBlock (no `testimonials` collection yet — content + schema), body-level NewsletterBlock (already owned by `SiteFooter`'s newsletter island — would be a duplicate call-to-action). Logged as follow-ups. |
| Featured row data | **Designs, not products.** `Home.featured_designs` is the existing CMS relation; the Designs collection is the brand's curation primitive (aesthetic families grouped by age_group). Storefront home leads with designs → individual products live on `/products` (3.2). This aligns with how the Payload schema is shaped today and avoids growing the Home global with a new `featured_products` relation just for this session. Card type: `<DesignCard>` from 2.3. |
| Block file location | **`apps/web/src/components/home/{HomeHero,HomeBrandStatement,HomeFeaturedDesigns,HomeShowroomsStrip,HomeJournalTeaser,HomeInquiryCta}.tsx`.** Blocks are page-specific compositions of `@zhic/ui` primitives + cards + Persian copy. They do not belong in `@zhic/ui` (not reusable across operator apps, not primitive, not a molecule). The `@zhic/ui` boundary stays at reusable + data-agnostic components. |
| Data fetch layer | **`apps/web/src/lib/payload.ts`** — server-only REST fetch helpers (`fetchHome()`, `fetchFeaturedDesigns(ids)`, `fetchLatestArticles(limit)`, `fetchShowrooms(limit)`). `fetch()` with `cache: 'force-cache'` + revalidation tags per resource (`home`, `designs`, `articles`, `showrooms`) so Next can purge selectively when Payload hooks fire (FU — tag purging wires in 7.1 CI/CD). Promote to `packages/api-client` when 3.2 / 3.3 / 4.1 need the same helpers — not today, YAGNI. |
| Env var | **`API_URL`** (server-only, no `NEXT_PUBLIC_` prefix — the storefront never talks to Payload from the browser). Default `http://localhost:3001` via a fallback inside `lib/payload.ts` so `pnpm --filter @zhic/web dev` works locally without a `.env`. Document `API_URL` in an `apps/web/.env.example` committed to the repo. Production value wires in Session 7.1. |
| Layout primitives | **Ship `<Grid>`, `<Stack>`, `<Split>` this session.** Home genuinely needs all three: Grid for 3-up card rows (featured designs, journal teaser), Stack for vertical rhythm of section-internal elements, Split for editorial brand-statement (image + richText side-by-side, flips under RTL). `<Bleed>` is **not** needed — `Section fullBleed` from 2.2 already covers hero. Logged as closing most of FU-2.2-i. |
| Grid API | `columns: 1 \| 2 \| 3 \| 4 \| 6 \| 12` (responsive) + `gap: 'sm' \| 'md' \| 'lg' \| 'xl'` (maps to spacing-4/5/6/7) + `as?: ElementType`. Under RTL the grid columns naturally flow right → left because Tailwind's `grid` respects `dir`. No extra flip needed. Breakpoint strategy: `columns=3` means 1 col mobile, 2 col md, 3 col lg. Explicit prop, no auto-fit magic. |
| Stack API | `direction: 'row' \| 'col'` (default `col`) + `gap: 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` (spacing-2/4/5/6/7) + `align: 'start' \| 'center' \| 'end' \| 'stretch'` + `justify: 'start' \| 'center' \| 'end' \| 'between'` + `as?: ElementType`. Row direction uses logical flex (`flex-row` is logical by default under `dir="rtl"` in flexbox). |
| Split API | `ratio: '50/50' \| '60/40' \| '40/60'` + `gap: 'sm' \| 'md' \| 'lg' \| 'xl'` + `reverse?: boolean` (swaps under RTL-LT L-base convention: `start | end` columns flip). Collapses to vertical stack below `md`. Children are two slots — pass exactly two children. |
| Hero fallback | When `hero_heading` is empty, render Persian placeholder "ساخته‌شده برای ماندن." (voice-appropriate per §1.2 — headline is a statement, not a question). When `hero_media` is unset, render an ivory-on-cream solid block via `<Aspect ratio="16/9">` with a subtle wordmark ("ژیک" in Ayandeh Black) centered — honest "no asset yet" state, not a broken image. |
| richText rendering | **Inline minimal Lexical serializer** in `apps/web/src/lib/richtext.tsx` (~50 lines). Handles: `paragraph`, `heading` (h2/h3), `text` (with bold / italic format bits), `link`, `list` + `listitem`, `linebreak`. Rejects unknown node types gracefully (renders children). When Session 4.1 needs the full Lexical tree (pull quotes, image grids, product embeds in articles), **promote to a shared `packages/richtext` package** — not this session. Logged as FU. |
| generateMetadata | `title: 'ژیک — ساخته‌شده برای ماندن'` (or the CMS `hero_heading` when set, with " · ژیک" suffix), `description` sampled from `brand_statement` plain-text fallback. Persian `og:locale: fa_IR`. **No JSON-LD** — `Organization` + `WebSite` schemas land in Session 6.1. |
| Motion | **Zero motion this session.** No GSAP, no ScrollTrigger, no Lenis coupling beyond what `(site)/layout.tsx` already provides. All reveal choreography, hero word-reveal, marquees, block reveals — Session 6.2. This is a deliberate sequencing call: shipping motion now would couple layout + animation and make 6.2 a rewrite. Log FU-3.1-a for the motion pass. |
| Images | **Raw `<img>`** today, matching the 2.3 pattern. Next/Image remotePatterns for Abr Arvan + Payload media URLs wait for Session 7.1 (infra) + a single integration commit after that (FU-2.3-g). Home page hero + design / showroom / article covers use `<img className="h-full w-full object-cover">`. Lint `@next/next/no-img-element` warnings expected and acknowledged. |
| Empty-state rendering | If `featured_designs` is empty → hide the whole FeaturedDesigns section (don't render empty heading). If `showrooms.find()` returns 0 → hide ShowroomsStrip. If `articles.find()` returns 0 → hide JournalTeaser. Hero + BrandStatement + InquiryCTA always render (with placeholder copy when empty). Home never shows a blank section headline with no content under it. |
| Seed extension | **Extend `services/api/src/seed.ts` to populate the `home` global** with Persian placeholder copy: hero_heading "ساخته‌شده برای ماندن"، hero_subheading "مبلمان دست‌ساز برای خانه‌هایی که آرامش را می‌فهمند"، brand_statement as a small Lexical richText document (~3 paragraphs), journal_teaser_heading "از ژورنال"، inquiry_cta_heading "سفارش و مشاوره". **Skip `hero_media`** — requires a real media upload; template falls back to the ivory block. Also set `featured_designs` = both seeded designs. |
| Deletions | All five mockup sections + four mockup UI components + `data/products.ts` + `hooks/useMediaQuery.ts` (now unused). Directory `apps/web/src/components/sections/` removed if empty. Directory `apps/web/src/components/ui/` removed if empty. Mockup `SmoothScrollProvider` + `/components/providers/` stays (still in use by `(site)/layout.tsx`). **`/components/layout/` already deleted in 2.2.** |
| Home page shape | `async function Home()` → server component. Data fetches are `await`ed in parallel via `Promise.all`. Page composes 6 blocks in CMS order: Hero → BrandStatement → FeaturedDesigns → ShowroomsStrip → JournalTeaser → InquiryCTA. Each block is its own RSC where safe (no `'use client'` unless genuinely interactive — newsletter island in footer is already isolated; no new client components needed on home). |
| Revalidation | `fetch()` calls use `next: { revalidate: 300, tags: ['home' \| 'designs' \| 'showrooms' \| 'articles'] }`. 5-minute revalidation covers the "edit in Payload → live within 10 minutes" package1-month1 exit criterion comfortably. Tag-based `revalidateTag()` from Payload hooks lands with 7.1 infra (FU). |
| Loading + error states | Server component suspense + `error.tsx` at the `(site)/` route group. Minimal — a quiet Persian message and a "بازگشت به خانه" link. Keeps render resilient against Payload being down during dev (common when `services/api` hasn't been started). |
| A11y | All 6 blocks use proper heading hierarchy: `<h1>` on Hero (only one on the page), `<h2>` per block heading. `<main>` wrapping already provided by `(site)/layout.tsx`. InquiryCTA is a `<Button as="a" href="/contact">`, not a submit button. No new a11y affordances — 2.2's SkipLink / nav already cover. |
| Verification | Visual at `/` — renders the 6 blocks in order with Persian copy + real CMS data (or seed-placeholder copy). `/lab/ui` untouched (blocks are page-specific, not primitives). |
| Testing | No unit tests for blocks (they're compositions). `@zhic/ui` `Grid` / `Stack` / `Split` added to `/lab/ui` for visual verification. Storybook + RTL unit tests remain FU-2.1-a. |

## Deliverables

### `packages/ui/` (three layout primitives)

```
src/
├── Grid.tsx      # 12-col responsive grid with gap prop
├── Stack.tsx     # flex stack, direction + gap + align + justify
├── Split.tsx     # two-column editorial split with ratio
└── index.ts      # barrel — add 3 named exports + 3 type exports
```

No new runtime deps. Tokens-only styling, logical properties
throughout (no `ml-*` / `mr-*`). Server-renderable (no `'use client'`).

### Component contracts

- **`<Grid>`**
  ```ts
  type GridColumns = 1 | 2 | 3 | 4 | 6 | 12;
  type GridGap = 'sm' | 'md' | 'lg' | 'xl';
  type GridProps = HTMLAttributes<HTMLElement> & {
    columns: GridColumns;
    gap?: GridGap; // default 'md'
    as?: ElementType; // default 'div'
    children?: ReactNode;
  };
  ```
  Responsive: `columns=3` → `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`;
  `columns=2` → `grid-cols-1 md:grid-cols-2`; `columns=4` →
  `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` (matches 2.3's
  ImageGallery columns-4 mapping). 12 and 6 full per breakpoint.

- **`<Stack>`**
  ```ts
  type StackDirection = 'row' | 'col';
  type StackGap = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  type StackAlign = 'start' | 'center' | 'end' | 'stretch';
  type StackJustify = 'start' | 'center' | 'end' | 'between';
  type StackProps = HTMLAttributes<HTMLElement> & {
    direction?: StackDirection; // default 'col'
    gap?: StackGap; // default 'md'
    align?: StackAlign;
    justify?: StackJustify;
    as?: ElementType; // default 'div'
    children?: ReactNode;
  };
  ```

- **`<Split>`**
  ```ts
  type SplitRatio = '50/50' | '60/40' | '40/60';
  type SplitGap = 'sm' | 'md' | 'lg' | 'xl';
  type SplitProps = HTMLAttributes<HTMLElement> & {
    ratio?: SplitRatio; // default '50/50'
    gap?: SplitGap; // default 'lg'
    reverse?: boolean; // swap start/end columns (still under RTL)
    as?: ElementType; // default 'div'
    children: [ReactNode, ReactNode]; // exactly two
  };
  ```
  Implementation: `grid md:grid-cols-[<ratio>]` with `60/40` mapping
  to `md:grid-cols-[3fr_2fr]`, `40/60` → `md:grid-cols-[2fr_3fr]`,
  `50/50` → `md:grid-cols-2`. Below `md` collapses to single column.
  `reverse` applies `md:[&>*:first-child]:order-2
  md:[&>*:last-child]:order-1` to swap order on desktop only.

### `packages/ui/src/index.ts`

Add 3 named + 3 type exports:

```ts
export { Grid } from './Grid';
export type { GridProps, GridColumns, GridGap } from './Grid';

export { Stack } from './Stack';
export type {
  StackProps,
  StackDirection,
  StackGap,
  StackAlign,
  StackJustify,
} from './Stack';

export { Split } from './Split';
export type { SplitProps, SplitRatio, SplitGap } from './Split';
```

### `apps/web/src/`

```
lib/
├── payload.ts       # server-only fetch helpers
├── richtext.tsx     # minimal Lexical serializer (h2/h3/p/a/list/em/strong)
└── env.ts           # tiny wrapper exposing API_URL with fallback

components/home/
├── HomeHero.tsx              # full-bleed, hero_media or fallback, heading/sub/CTA
├── HomeBrandStatement.tsx    # Split: image + RichText
├── HomeFeaturedDesigns.tsx   # Grid columns=3 of DesignCard
├── HomeShowroomsStrip.tsx    # Grid columns=2 or 3 of ShowroomCard
├── HomeJournalTeaser.tsx     # Grid columns=3 of ArticleCard
└── HomeInquiryCta.tsx        # Section + headline + Button→/contact

app/
└── (site)/
    ├── page.tsx              # async RSC — fetches data, composes blocks
    ├── error.tsx             # Persian error boundary
    └── loading.tsx           # optional; may omit if static enough

.env.example                  # documents API_URL=http://localhost:3001
```

### Block contracts

- **HomeHero** — props: `{ heading?, subheading?, media?, primaryCta?, secondaryCta? }`. Falls back to Persian defaults when fields are empty. Primary CTA: "مشاهده محصولات" → `/products`. Secondary CTA: "یافتن نزدیک‌ترین شوروم" → `/showrooms`. Composition: `<Section fullBleed bg="ivory">` → `<div className="relative min-h-[70vh] flex items-center">` → `<Container>` → heading (h1, text-display), subheading (text-lead), button row. Media renders as `<img object-cover absolute inset-0 -z-10>` with a subtle ivory overlay when present; solid ivory-cream gradient when absent.

- **HomeBrandStatement** — props: `{ body: LexicalJson }`. Composition: `<Section bg="cream" padY="lg">` → `<Split ratio="40/60">` → left: decorative aspect box (3/2) with placeholder Z wordmark + muted sand fill; right: `<Stack gap="md">` containing an eyebrow ("درباره‌ی ژیک") + rendered richText. If `body` is empty, renders a Persian placeholder paragraph.

- **HomeFeaturedDesigns** — props: `{ designs: Design[] }`. Hidden entirely if `designs.length === 0`. Composition: `<Section>` → `<Container>` → heading ("طرح‌های ویژه") + subheading ("مجموعه‌ای از خانواده‌های طراحی ژیک") + `<Grid columns={3} gap="lg">` of `<DesignCard>` mapped from Payload docs. Each design's `gallery[0]` becomes the card image (via `<img>` + media URL from Payload); age_group mapped to Persian label through a small in-file map (`infant` → "نوزاد", `child` → "کودک", `teen` → "نوجوان", `adult` → "بزرگسال"); description's richText first paragraph text-extracted for the card (line-clamp-2 handles overflow).

- **HomeShowroomsStrip** — props: `{ showrooms: Showroom[] }`. Hidden if empty. Composition: `<Section bg="cream">` → `<Container>` → heading ("شوروم‌ها") + `<Grid columns={2} gap="md">` of `<ShowroomCard>` (using only the first 2–4 showrooms; with only 1 seeded the grid renders as a single card at full width on desktop, which is acceptable fallback). Maps Payload `showroom.address` (textarea) to the card's `addressLine`; `hours` text → `hoursSummary`; `phone` → `{ label: formatPhone(phone), e164: normalizePhone(phone) }`.

- **HomeJournalTeaser** — props: `{ articles: Article[], heading? }`. Hidden if `articles.length === 0`. Composition: `<Section>` → `<Container>` → heading (`heading` prop or fallback "از ژورنال") + `<Grid columns={3} gap="lg">` of `<ArticleCard>`. `published_at` (Payload `date` field, stored as ISO) passes straight to `DateDisplay`. `author` text → `author` prop. `excerpt` → `excerpt`. `cover.url` → `<img>` in the `cover` slot. Category relation → `categoryLabel` (category's Persian `name`). No reading-time in current CMS schema → omit for now; log FU to add reading-time auto-compute on articles.

- **HomeInquiryCta** — props: `{ heading? }`. Composition: `<Section bg="ink" padY="lg">` → `<Container>` → `<Stack align="center" gap="lg">` with a heading (white text, default "با ما در تماس باشید") + a sub-line + `<Button as="a" href="/contact" variant="secondary">تماس با ژیک</Button>` (secondary variant on dark bg reads cream-outline). Uses `text-ivory` + inverse tokens.

### `apps/web/src/lib/payload.ts`

```ts
export type PayloadMedia = { id: string; url: string; alt?: string };
export type PayloadDesign = { /* from @zhic/types or inline */ };
// ... etc

async function payloadFetch<T>(path: string, tag: string): Promise<T | null> {
  const base = process.env.API_URL ?? 'http://localhost:3001';
  try {
    const res = await fetch(`${base}${path}`, {
      next: { revalidate: 300, tags: [tag] },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchHome() { /* /api/globals/home?depth=2 */ }
export async function fetchFeaturedDesigns() { /* resolves via home.featured_designs */ }
export async function fetchLatestArticles(limit = 3) { /* /api/articles?limit=3&sort=-published_at&depth=2 */ }
export async function fetchShowrooms(limit = 4) { /* /api/showrooms?limit=4&depth=2 */ }
```

Error policy: fetch failures return `null` (not throw). Blocks treat
`null` / empty as empty-state per the hide-if-empty rule. Dev with
`services/api` not running → home renders placeholders only. No
crashes, no error boundary fallback unless the route itself throws.

### `apps/web/src/lib/richtext.tsx`

Minimal recursive walker over Lexical JSON. Nodes handled:

| node type | renders as |
|---|---|
| `root` | `<div>` wrapping children |
| `paragraph` | `<p className="text-body leading-relaxed mb-4">` |
| `heading` (tag h2/h3/h4) | matching tag with `text-h2` / `text-h3` / `text-h4` token |
| `text` | `<span>` with format bit handling (`1` bold → `font-bold`, `2` italic → (forbidden on Persian per §2.2, dropped silently), `8` underline → `underline underline-offset-4`) |
| `link` | `<a href={node.fields.url}>` with same focus-ring pattern |
| `list` + `listitem` | `<ul>` / `<li>` with `list-disc ps-6 space-y-2` |
| `linebreak` | `<br>` |
| unknown | renders children, drops the wrapper silently |

One function `renderRichText(root: LexicalRoot): ReactNode`. No
imports beyond React. Safe to promote to shared package in 4.1.

### `apps/web/src/lib/env.ts`

```ts
export const API_URL = process.env.API_URL ?? 'http://localhost:3001';
```

Single source for the env var; no `z.object` validation (YAGNI for
one string). Document in `apps/web/.env.example`.

### `apps/web/src/app/(site)/page.tsx`

```ts
export default async function Home() {
  const [home, showrooms, articles] = await Promise.all([
    fetchHome(),
    fetchShowrooms(),
    fetchLatestArticles(),
  ]);
  const designs = home?.featured_designs ?? [];
  // ... compose 6 blocks
}
```

Metadata:

```ts
export async function generateMetadata(): Promise<Metadata> {
  const home = await fetchHome();
  const heading = home?.hero_heading ?? 'ساخته‌شده برای ماندن';
  return {
    title: `ژیک — ${heading}`,
    description: plainTextFromRichText(home?.brand_statement) ?? FALLBACK,
    openGraph: { locale: 'fa_IR', type: 'website' },
  };
}
```

### `apps/web/src/app/(site)/error.tsx`

Client error boundary, Persian copy ("چیزی درست پیش نرفت. لطفاً
دوباره تلاش کنید." + a retry button). Minimal.

### `services/api/src/seed.ts` — extension

Add after the existing seed sections:

```ts
// --- Home global ---
await payload.updateGlobal({
  slug: 'home',
  data: {
    hero_heading: 'ساخته‌شده برای ماندن',
    hero_subheading: 'مبلمان دست‌ساز برای خانه‌هایی که آرامش را می‌فهمند',
    brand_statement: /* small Lexical JSON — 3 paragraphs */,
    featured_designs: designs, // IDs from earlier in seed
    journal_teaser_heading: 'از ژورنال',
    inquiry_cta_heading: 'سفارش و مشاوره',
  },
});
```

`hero_media` skipped — uploading a real media file from a script
requires a `Blob` / filesystem read + Payload's upload API. Template
graceful-falls-back to the ivory block.

### `apps/web/src/components/home/` — deletions after the new blocks land

```
apps/web/src/components/sections/   → delete entire directory
apps/web/src/components/ui/         → delete entire directory
apps/web/src/data/products.ts       → delete
apps/web/src/hooks/useMediaQuery.ts → delete if unused (grep first)
```

### `/lab/ui` — small addition

One new section demonstrating `Grid` + `Stack` + `Split`:

- Grid: show `columns={2}` `{3}` `{4}` with `bg-cream` placeholder
  boxes, labeled.
- Stack: show `direction='col'` vs `'row'`, gap variations, with
  `<Badge>` children so each cell is visible.
- Split: `50/50`, `60/40`, `40/60`, each with `reverse` toggled on
  one example to show the RTL-aware swap.

Keeps verification consistent with 2.1/2.2/2.3 conventions.

## Exit check

- [ ] `pnpm install` clean (no new deps).
- [ ] `pnpm --filter @zhic/ui typecheck` passes.
- [ ] `pnpm --filter @zhic/ui lint` passes.
- [ ] `pnpm --filter @zhic/web typecheck` passes.
- [ ] `pnpm --filter @zhic/web lint` passes (expected `<img>` warnings
      in home blocks — FU-2.3-g).
- [ ] `pnpm --filter @zhic/api typecheck` passes (seed extension is
      typesafe against the generated Home global type).
- [ ] `pnpm --filter @zhic/api seed` runs clean against a dev DB and
      the Payload admin `/admin` now shows Home global populated with
      Persian fields.
- [ ] `pnpm --filter @zhic/web build` passes; route map shows `/` as
      prerendered-static (or dynamic if `fetchHome` is dynamic at
      build — both acceptable).
- [ ] With `services/api` running on port 3001, visiting `/` in dev
      shows all six blocks in order with Persian copy pulled from
      Payload. Open DevTools → Network → there is no direct browser
      call to `:3001` (storefront fetches are server-only).
- [ ] With `services/api` stopped, visiting `/` still renders: Hero
      falls back to placeholder heading, BrandStatement falls back
      to placeholder paragraph, FeaturedDesigns / ShowroomsStrip /
      JournalTeaser are hidden (empty). No error boundary triggers.
- [ ] All mockup sections + mockup ui files + `data/products.ts` are
      gone. Repo searches confirm: `grep -R 'HeroSection\|VideoSection\|ProductsSection\|AboutSection\|ContactSection\|SectionHeading\|ScrollReveal' apps/web/src` → empty; `apps/web/src/components/sections/` and `apps/web/src/components/ui/` directories removed.
- [ ] Keyboard: Tab from a cold page lands on SkipLink (chrome from
      2.2), then flows through Hero CTAs → section-internal links →
      Showroom phone links → InquiryCTA button → footer.
- [ ] No physical-direction Tailwind utilities anywhere in
      `apps/web/src/components/home/**` — `grep -RE '\b(m\|p\|text\|border)-(l\|r)-' apps/web/src/components/home` → empty.
- [ ] No raw hex / rgb in `apps/web/src/components/home/**` —
      `grep -RE '#[0-9a-fA-F]{3,8}\|rgb\(' apps/web/src/components/home` → empty.
- [ ] `apps/web/.env.example` exists and documents `API_URL`.
- [ ] `docs/state.md` updated: 3.1 ✅ with commit hash; 3.2 / 3.3 /
      3.4 / 4.1 entry notes updated to reflect available data layer
      and deletions; `OD-logo-lockup` still flagged (placeholder
      wordmark remains in Hero fallback); `FU-2.2-l` marked resolved
      (Button imports in sections/* are gone with the sections
      themselves); `FU-2.2-i` partially resolved (Grid/Stack/Split
      shipped; Bleed remains FU for when a page needs it beyond
      Section fullBleed).

## Follow-ups to log

- **FU-3.1-a** Motion pass for `/` — hero word-reveal, block reveal
  on scroll, image reveal (clip-path), marquee direction under RTL,
  `prefers-reduced-motion` compliance. Spec §6.4. Session 6.2.
- **FU-3.1-b** `packages/api-client` — promote `lib/payload.ts` to a
  workspace package when 3.2 (products index / PDP) + 3.3 (showroom
  index / detail) need the same helpers. Add Zod / generated types
  from Payload (`pnpm --filter @zhic/api generate:types`). Today's
  helpers are inline-friendly; the package boundary kicks in when
  types + caching + preview-mode hooks accumulate.
- **FU-3.1-c** `packages/richtext` — promote `apps/web/src/lib/richtext.tsx`
  when Session 4.1 Article body needs the full Lexical node set
  (pull quotes, image grids, product embeds, `LtrRun`). Include a
  `plainTextFromRichText` helper for SEO descriptions.
- **FU-3.1-d** JSON-LD `Organization` + `WebSite` on `/` — Session
  6.1 SEO pass.
- **FU-3.1-e** `revalidateTag('home' | 'designs' | 'showrooms' |
  'articles')` wired from Payload `afterChange` hooks → storefront
  `/api/revalidate` webhook endpoint → Next `revalidateTag`. Session
  7.1 infra. Until then the 5-minute `revalidate` window is the only
  freshness guarantee.
- **FU-3.1-f** Home `hero_media` seeding. Requires uploading a real
  image via Payload's upload API from a script. Landing with the
  brand's first real hero asset.
- **FU-3.1-g** Marquee block on home — needs `Home.marquee_items`
  (text[]) schema addition + MarqueeBlock organism in `@zhic/ui`
  (motion-heavy). Content + schema + component. Session 6.2 or
  later.
- **FU-3.1-h** Testimonials block on home — requires `testimonials`
  collection (data-schemas §66 lists it for later package) +
  curated Persian quotes from the client. Content + schema.
- **FU-3.1-i** Home body NewsletterBlock — intentionally omitted
  because `SiteFooter` already carries the newsletter island.
  Revisit only if product asks for a second CTA above the fold.
- **FU-3.1-j** `reading_time_minutes` auto-compute on Articles
  (from `body` word count). Payload `beforeChange` hook on articles.
  Storefront's ArticleCard supports it (shipped in 2.3). Naturally
  lands with Session 4.1 when the journal index needs it at scale.
- **FU-3.1-k** Home global schema gaps flagged in 3.1 Entry — split
  `Showrooms.address` into structured `{ province, city, district,
  street, plaque, unit, postal_code }` per data-schemas §28, split
  `hours` into day-by-day array. Not blocking Month 1 but required
  for Package 2 structured display + per-city SMS routing.
- **FU-3.1-l** Next/Image migration for home block images. Carries
  forward FU-2.3-g with concrete call sites now identified
  (hero_media, design.gallery[0], showroom.gallery[0], article.cover).
  Requires `remotePatterns` in `next.config.ts` pointing at Abr
  Arvan S3 + Payload media URL. Session 7.1 infra wiring.
- **FU-3.1-m** `<Bleed>` layout primitive. Currently unused since
  `Section fullBleed` covers hero. Add when a page needs a nested
  full-bleed escape hatch inside a constrained container (possibly
  PDP gallery in 3.2, more likely editorial articles in 4.1).

## Deferred

- Motion / scroll effects / word reveal / marquee / image reveal —
  Session 6.2 (FU-3.1-a).
- JSON-LD Organization / WebSite — Session 6.1 (FU-3.1-d).
- `packages/api-client` — promote in 3.2 (FU-3.1-b).
- `packages/richtext` — promote in 4.1 (FU-3.1-c).
- Marquee, Testimonials, body Newsletter blocks — FU-3.1-g/h/i.
- Showroom `address` / `hours` schema split — FU-3.1-k.
- Hero media real asset — FU-3.1-f.
- Next/Image integration — FU-3.1-l.
- `<Bleed>` primitive — FU-3.1-m.
- Storybook + RTL unit tests — FU-2.1-a (end-of-phase-2 still open).
- Payload → Next `revalidateTag` webhook — FU-3.1-e (Session 7.1).

## Implementation notes (post-execution)

Caught during build / seed / verify, not in the planning pass.

- **Postgres wasn't available in the sandbox** (no `docker` binary).
  Only the graceful-fallback render path (`services/api` unreachable
  → fetches return `null` → Hero + BrandStatement + InquiryCTA render
  with Persian placeholders, design/showroom/article sections hide)
  was end-to-end verified. The data-populated path compiles and
  typechecks but needs a local `docker compose up postgres` + `pnpm
  --filter @zhic/api dev` + `pnpm --filter @zhic/api seed` to
  confirm. **Logged as FU-3.1-q.**
- **`payload seed` is currently broken by a pre-existing Payload 3 +
  `@next/env` + Node 24 shape issue** — `Cannot destructure property
  'loadEnvConfig' of 'import_env.default' as it is undefined` in
  `payload/dist/bin/loadEnv.js`. This is NOT from the 3.1 seed
  extension — my code compiles + typechecks. Home global population
  fails on line 3 of Payload's internal loader. Documented as
  FU-3.1-o. Home global can still be populated via the Payload admin
  UI in the meantime; the template works against both populated and
  empty states.
- **`services/api` was already returning 500** on every `/api/*`
  call because Postgres was down (`ECONNREFUSED`). My storefront
  fetch layer's `try/catch → null` fallback absorbed this and the
  storefront stayed up — a useful signal the fetch-failure path
  works under real conditions.
- **`@zhic/locale.formatPhone` is mobile-only** (only handles `+98
  09**` prefixes). The seed has a landline showroom phone
  `081-38123456`. `HomeShowroomsStrip` renders via
  `toPersianDigits(raw)` without spacing / formatting — readable,
  just not pretty. **Logged as FU-3.1-n.**
- **`<Button variant="secondary">` on ink-background inverted**
  inside `HomeInquiryCta` via inline `className` override
  (`border-ivory text-ivory hover:bg-ivory hover:text-ink`). Works
  via `cn()` / tailwind-merge but signals a missing dark-bg variant.
  **Logged as FU-3.1-p.**
- **Lint warnings**: six expected `<img>` warnings across the home
  blocks + one pre-existing in ImageGallery. All acknowledged —
  FU-2.3-g / FU-3.1-l own the Next/Image migration.
- **Build output** shows `/` as `○ (Static) prerendered as static
  content, 5m revalidate, 1y expire` — exactly the cache posture
  the plan called for.
- **All pre-existing exit-check greps pass clean** — no
  physical-direction Tailwind utilities, no raw hex / rgb in
  `apps/web/src/components/home/**`.
- **Kept `apps/web/src/hooks/useMediaQuery.ts`** despite plan
  language suggesting it might be deletable — `SmoothScrollProvider`
  still depends on it. Plan had the "delete if unused" caveat; ran
  the grep, consumer found, kept.
- **Kept `apps/web/src/lib/constants.ts`** — still consumed by
  `SmoothScrollProvider` (`BREAKPOINTS`, `SCROLL_CONFIG`) and
  `(site)/layout.tsx` (`NAV_LINKS`). Only `data/products.ts` was
  deleted from `data/`.
- **Seed's richText shape** uses Lexical v3 node fields `version`,
  `direction`, `format`, `indent` on each container node. If
  Payload's Lexical schema validator rejects the shape when seed
  runs (once FU-3.1-o is fixed), fallback is to write the
  `brand_statement` through the admin UI. Storefront `RichText`
  handles either tree shape.
- **`lib/richtext.tsx` handles the narrow Lexical set** actually
  used by `brand_statement` (paragraph / heading / text / link /
  list / listitem / linebreak). Unknown node types render children
  silently — tolerant rather than strict. When 4.1 articles need
  pull-quotes / image-grids / product-embeds, promote to
  `packages/richtext` with the full node set (FU-3.1-c).
- **Status check:** `pnpm build` green, `/` returns 200 with
  Persian fixtures "ساخته‌شده برای ماندن" / "درباره‌ی ژیک" / "با ما
  در تماس" / "ژیک" visible; `/lab/ui` returns 200 with new Grid /
  Stack / Split demo sections ("columns 2/3/4", "ستون اول/دوم", "مورد
  اول", "موجود" all present). 27 money + 53 locale tests still
  green. All pre-existing exit-check greps pass clean.
