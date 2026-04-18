# Session 2.3 — Cards + Image Gallery

## Goal

Ship the third shelf of `@zhic/ui`: the four **card** molecules the
storefront leans on (`ProductCard`, `DesignCard`, `ArticleCard`,
`ShowroomCard`) plus the `ImageGallery` organism that dresses
showroom pages, the PDP stills tab, and article grids. Along the way,
land the three supporting atoms the cards can't exist without:
`<Aspect>` (the aspect-ratio primitive — cards can't size their media
without it), `<MoneyDisplay>` (the only permitted way to render a
price — closes FU-1.4-a / FU-2.1-g), and `<DateDisplay>` (Jalali
formatter — article cards need it). At the end of this session
`/lab/ui` shows every card × state with real Persian sample copy and
a gallery that opens a lightbox modal; consumer pages are **not**
touched — Session 3.1 owns the home rebuild and Session 3.2 owns the
PDP stage.

Authority: `docs/sessions.md` §2.3, `docs/spec/design-system.md` §5
(Imagery), §6.4 (Hover lift), §7 (Layout primitives — `<Aspect>`,
`<MoneyDisplay>`, `<DateDisplay>`), §8 (Molecules: ProductCard,
ArticleCard, ShowroomCard; Organisms: GalleryBlock),
`docs/spec/data-schemas.md` §5 (media kinds), §12 (products), §28
(showrooms), §60 (articles), `docs/spec/sitemap.md` §HomePage
(FeaturedProducts / JournalTeaser / ShowroomsStrip contexts),
§ShowroomDetail, §Article.

## Entry state

- `@zhic/ui` ships atoms + organisms from 2.1 + 2.2: `Button`,
  `Input`, `Textarea`, `Select`, `Checkbox`, `Radio` / `RadioGroup`,
  `FormField`, `Badge`, `Tag`, `SkipLink`, `Container`, `Section`,
  `Breadcrumbs`, `Modal`, `Drawer`, `SiteHeader`, `SiteFooter` +
  helpers (`cn`, `controlClasses`, `useDialogEffect`, `useIsClient`).
  No media, no money/date formatters, no cards.
- `@zhic/ui` deps today: `@zhic/design-system`, `@zhic/locale`,
  `clsx`, `tailwind-merge`. **Must add `@zhic/money`** this session
  (MoneyDisplay backing).
- `@zhic/money` exports `formatMoney(rials, opts)` with `{ unit:
  'toman' | 'rial', digits: 'fa' | 'ascii' }`. Tested, 27 tests.
- `@zhic/locale` exports `formatDate(value, format)` with `jalali-long`
  / `jalali-short` / `jalali-numeric`. Tested, 53 tests.
- `apps/web/src/components/ui/ProductCard.tsx` is the English mockup
  card — glass-morphism, `font-serif`, physical directions, dollar
  prices. Still consumed by `components/sections/ProductsSection.tsx`
  on the home page. **Out of scope to delete** — Session 3.1 rebuilds
  the home and will retire both (carries FU-2.2-l forward).
- `apps/web/public/` has one real GIF fixture (`55_bal4.gif`) and a
  `videos/` directory. **No stills** — the mockup's `/images/product-*.jpg`
  paths resolve to 404s today (the mockup fakes it with a gradient +
  the product name overlaid). Lab uses neutral `bg-cream` placeholder
  blocks for image slots and the one real GIF for the gallery demo.
- `/lab/ui` is the single verification surface for `@zhic/ui` (2.1 +
  2.2 sections). Extended here, not replaced.
- Payload collections exist (session 1.3) but **no Payload integration
  in this session.** Cards are data-source-agnostic (plain props),
  matching the 2.2 `SiteHeader` pattern where `NavItem` is a plain
  shape not a Payload type.
- React 19 + Next 16. `'use client'` only where needed.

## Key decisions

| Decision | Choice |
|---|---|
| Where the cards live | **`@zhic/ui` molecules.** Data-source-agnostic props (no Payload types). The `apps/web` integration — mapping a Payload `Product` doc to `<ProductCard>` props — is Session 3.1/3.2's problem, not this session. Same pattern as `SiteHeader` taking `NavItem[]`. |
| Card anchor pattern | **Whole card wrapped in `<a href>`.** Matches editorial feel ("slowness reads as luxury"), cleaner a11y than hover-only "View details" affordances (the mockup's current sin), and avoids nested-interactive pitfalls. The Persian title is the accessible name; it is not a separate link. Hover lift + hairline shift land on the `<a>`. When `href` is omitted the root degrades to `<article>` (gallery / discovery surfaces that don't navigate). |
| Card variants | **One look per card type.** No `compact` / `hero` variants speculatively. Button shipped four variants in 2.1 because four surfaces were already known; cards don't have that yet. When Session 3.2 PDP needs a smaller related-product card we add the variant then with a real use case. YAGNI. |
| Card image prop | **`image: ReactNode`.** Consumer passes `<img className="h-full w-full object-cover" src alt>` today; swaps to `<Image fill className="object-cover">` when Next/Image remote-patterns are wired (Session 3.1+). Card owns the `<Aspect>` wrapper and the hover scale; consumer owns the media element. Matches 2.2's `SiteHeader.brand: ReactNode`. |
| Gallery item prop | **Typed `items: GalleryItem[]`** (`{ src, alt, kind, caption, ... }`). Gallery renders its own `<img>` inside `<Aspect>` and controls the lightbox render — consumer should not be able to break the choreography. Future Next/Image upgrade lives inside `ImageGallery`, not at the call site. |
| GIF in-view pause | **Deferred.** Native `<img src=".gif">` auto-plays and browsers expose no pause API. Honoring spec §5 "loop only while in viewport" requires converting GIFs to `<video>` + IntersectionObserver `.pause()`, or swapping GIF ↔ still-poster, both of which need a media-pipeline change. For 2.3 GIFs auto-loop in-grid and in-lightbox. **Logged as FU-2.3-a (video migration) + FU-2.3-b (in-view pause).** Spec §5 stays imperfect for now — flagged in the commit body so reviewers notice. |
| GIF tagging | A tiny **"GIF" Badge** in the inline-end top corner of any gallery cell whose `kind === 'gif'`. Lets reviewers + QA spot motion loops without staring at the cell. No equivalent on video (no video in 2.3's gallery). |
| Gallery layouts | **Two.** `grid` (default — 2/3/4 responsive columns with fixed cell aspect) for editorial/showroom/article use; `strip` (horizontal `overflow-x-auto snap-x snap-mandatory`) for mobile-first and narrow contexts. The third layout — PDP's tabbed stage (stills/motion/3D) — is **not** this gallery; Session 3.2 composes it on top. |
| Lightbox backing | **Reuse `Modal` from 2.2** at `size="lg"`. Prev/Next buttons absolutely positioned at inline-start / inline-end middle with `rtl:-scale-x-100` chevrons. Keyboard: `ArrowLeft` / `ArrowRight` bound via `addEventListener('keydown')` while open — mapping is **logical**, so under RTL ArrowLeft = next (matches reading direction). Escape + backdrop close via `Modal`'s inherited `onClose`. Focus restore to the clicked thumbnail comes free from `useDialogEffect`. |
| Hover lift | **Per spec §6.4.** `translateY(-2px)` over `--dur-fast` (240ms) + `--ease-out-soft`, plus a hairline color shift from `sand` → `charcoal`. Implemented via Tailwind arbitrary values: `hover:-translate-y-0.5 transition-all [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out-soft)] hover:border-charcoal`. Cards gain `motion-reduce:hover:translate-y-0 motion-reduce:transition-none` so `prefers-reduced-motion` collapses to a hairline-only shift (spec §6.1 point 4). |
| Card surface tokens | Border `border border-sand`, radius `rounded-md` (radius-md = 4px per §2.5), **no shadow** (spec §2.6 — hairlines over shadows). Inner padding `p-4 md:p-5` using logical Tailwind utilities. Background `bg-ivory` by default; consumer can override for dark-section placements via `className`. |
| Image aspect per card | Product **4/5** (§5 — product cards are 4:5). Design **3/2** (editorial family look). Article **3/2** (§5 — journal cover). Showroom **16/9** (panoramic location photography). Fixed per card type; no `aspectRatio` prop. |
| `<Aspect>` scope | Ship it here, not at §FU-2.2-i's lazy timeline. Cards cannot size their media without it; waiting would force every card to reinvent `aspect-[4/5]` inline. The rest of the primitives (`Stack`, `Grid`, `Split`, `Bleed`) still wait for 3.1. |
| `<Aspect>` API | `ratio: '1/1' \| '4/5' \| '3/2' \| '16/9' \| '21/9'` + `as?: ElementType` (default `div`) + `className` + `children`. Maps each ratio to a fixed Tailwind class (`aspect-square`, `aspect-[4/5]`, `aspect-[3/2]`, `aspect-video`, `aspect-[21/9]`). No arbitrary ratios in the type — forces consumers to pick from the design-system set. |
| `<MoneyDisplay>` API | `rials: number \| bigint`, `unit?: 'toman' \| 'rial'` (default `toman`), `digits?: 'fa' \| 'ascii'` (default `fa`), `className?`. Renders a single `<span>` with the formatted string. Backed by `formatMoney` from `@zhic/money`; this component never does math. Closes FU-1.4-a and FU-2.1-g. |
| `<DateDisplay>` API | `value: string \| Date`, `format?: 'jalali-long' \| 'jalali-short' \| 'jalali-numeric'` (default `jalali-long`), `className?`. Renders `<time dateTime={ISO}>` wrapping the Jalali string — a11y + semantic-HTML win. Backed by `formatDate` from `@zhic/locale`. |
| Price rendering rules | If `priceRials` is present → `<MoneyDisplay>`. If absent but `priceFallback` is present → render fallback (e.g. "استعلام قیمت"). If neither → no price row. Consumer decides between price and inquiry CTA based on `inquiry_enabled` / `availability` — card does not branch on those fields (they are consumer-side concerns). |
| Availability → Badge | Optional `availability` prop maps to a `Badge`: `in_stock` → `success` "موجود", `made_to_order` → `neutral` "ساخت به‌سفارش", `backorder` → `warning` "در انتظار", `discontinued` → `neutral` "ناموجود". When `made_to_order` + `leadTimeDays` both present, the badge label becomes "ساخت به‌سفارش · N روز" with Persian digits. |
| ShowroomCard phone | `phone?: { label, e164 }`. `label` is the consumer-formatted Persian phone (they call `formatPhone()` from `@zhic/locale`); `e164` is the ASCII storage form. Renders as `<a href={\`tel:${e164}\`}>{label}</a>` — phone-call CTA on mobile, inert text on desktop. Card is wrapped in `<a href>` (the showroom detail link), so the phone `<a>` is nested — **avoid nested interactives** by rendering the phone as a `<span>` when the whole card is a link and only as `<a>` when the card is `href`-less. |
| Materials rendering | ProductCard optional `materials?: ReactNode[]` — consumer maps relation data to labels ("چوب گردو", "کتان بلژیکی"). Renders as `Tag variant="neutral" size="sm"` row below price. **No cap** — consumer passes what they want to show; the card wraps tags with `flex-wrap gap-2`. Sale price + strikethrough ship with Session 3.2 PDP; 2.3 does not encode sale. |
| ageGroup rendering | DesignCard `ageGroupLabel?: ReactNode` — consumer-localized string ("بزرگسال" / "کودک" / "نوجوان" / "نوزاد"). Rendered as `Badge variant="neutral" shape="rounded"` at the top of the card's info block. The card never knows the enum; it just renders the label — exact-names OD (package1-month1.md #3) stays the consumer's problem. |
| Card title element | `<h3>` with `text-h4` (24px Ayandeh Bold) for Product / Article / Design / Showroom. Line-clamp-1. `text-balance` for multi-line titles. Consumer is responsible for heading hierarchy within its page — card's `h3` assumes it sits under a page `h2` or `h1`. |
| Lab sample data | Hand-written Persian fixtures colocated in `/lab/ui/page.tsx` — not hooked to Payload. Concrete values listed in §Deliverables below so the executor doesn't invent content. |
| Verification surface | Extend existing `/lab/ui` with five new sections (ProductCard, DesignCard, ArticleCard, ShowroomCard, ImageGallery). No new `/lab/cards` or `/lab/gallery`. Same convention as 2.2. |
| Consumer pages | **Untouched.** `apps/web/src/app/(site)/page.tsx` still renders the mockup sections. Real card integration lives in 3.1+. The new components must not be imported from `apps/web` outside `/lab/ui` this session. |
| Testing | Visual on `/lab/ui`. Storybook + RTL unit tests remain FU-2.1-a (end-of-phase-2 closeout). |

## Deliverables

### `packages/ui/`

```
src/
├── Aspect.tsx          # primitive — fixed ratio set, logical sizing
├── MoneyDisplay.tsx    # rials → toman, Persian digits; closes FU-1.4-a
├── DateDisplay.tsx     # ISO → Jalali; <time dateTime=>
├── ProductCard.tsx     # name + image + price + availability + materials
├── DesignCard.tsx      # name + image + age group + short description
├── ArticleCard.tsx     # title + cover + excerpt + author + DateDisplay
├── ShowroomCard.tsx    # name + cover + city + address + hours + tel
├── ImageGallery.tsx    # grid/strip + lightbox via Modal; 'use client'
└── index.ts            # barrel — add new exports (8 new)
```

**Deps change:** add `@zhic/money: workspace:*` to `packages/ui/package.json`
dependencies. No other deps. No new runtime libs.

### Component contracts

- **`<Aspect>`**
  ```ts
  type AspectRatio = '1/1' | '4/5' | '3/2' | '16/9' | '21/9';
  type AspectProps = {
    ratio: AspectRatio;
    as?: ElementType; // default 'div'
    className?: string;
    children?: ReactNode;
  };
  ```
  Maps each ratio to a single Tailwind class. Children fill the box
  via `children`-are-positioned convention (consumer adds
  `h-full w-full object-cover` on the inner `<img>`). Not `'use client'`.

- **`<MoneyDisplay>`** — thin wrapper over `formatMoney`. Renders
  `<span>` with formatted string. The run is already RTL-native (the
  Persian digit order reads right-to-left inside the RTL page);
  no `<LtrRun>` needed at this level. `<span>` only — server-renderable.

- **`<DateDisplay>`** — `<time dateTime={ISO}>{formatDate(value, fmt)}</time>`.
  Accepts `Date` or ISO string. Server-renderable.

- **`<ProductCard>`**
  ```ts
  type ProductCardProps = {
    href?: string;
    name: ReactNode;
    image: ReactNode;
    tagline?: ReactNode;
    priceRials?: number | bigint;
    priceFallback?: ReactNode; // e.g. "استعلام قیمت"
    availability?: 'in_stock' | 'made_to_order' | 'backorder' | 'discontinued';
    leadTimeDays?: number; // decorates made_to_order badge
    materials?: ReactNode[]; // rendered as <Tag> row
    className?: string;
  };
  ```
  Image aspect 4/5. Layout: media top, info block below with name
  (h3) + optional tagline + price row (price OR fallback) + optional
  availability badge + optional materials tag row. Root `<a>` when
  `href`, else `<article>`.

- **`<DesignCard>`**
  ```ts
  type DesignCardProps = {
    href?: string;
    name: ReactNode;
    image: ReactNode;
    ageGroupLabel?: ReactNode;
    description?: ReactNode;
    className?: string;
  };
  ```
  Image aspect 3/2. Info block: age-group Badge (if present) → name
  (h3) → description (body, line-clamp-2). No price.

- **`<ArticleCard>`**
  ```ts
  type ArticleCardProps = {
    href?: string;
    title: ReactNode;
    cover: ReactNode;
    excerpt?: ReactNode;
    author?: ReactNode;
    publishedAt?: string | Date;
    readingTimeMinutes?: number;
    categoryLabel?: ReactNode;
    className?: string;
  };
  ```
  Image aspect 3/2. Info block: category eyebrow (Latin-style but
  Persian text) → title (h3) → excerpt (body, line-clamp-3) → meta
  row (author `·` `<DateDisplay>` `·` `N دقیقه مطالعه`) with
  `text-small text-stone` and Persian-digit reading time.

- **`<ShowroomCard>`**
  ```ts
  type ShowroomCardProps = {
    href?: string;
    name: ReactNode;
    cover: ReactNode;
    city?: ReactNode;
    addressLine?: ReactNode;
    hoursSummary?: ReactNode;
    phone?: { label: ReactNode; e164: string };
    className?: string;
  };
  ```
  Image aspect 16/9. Info block: name (h3) → city + addressLine
  stacked (body / small text-stone) → hours summary (small) → phone
  CTA (see key-decisions note on nested interactives — phone is
  `<span>` when card has `href`, `<a>` otherwise).

- **`<ImageGallery>`**
  ```ts
  type GalleryItem = {
    src: string;
    alt: string;
    kind?: 'image' | 'gif'; // default 'image'
    width?: number;
    height?: number;
    caption?: ReactNode;
  };

  type ImageGalleryProps = {
    items: GalleryItem[];
    layout?: 'grid' | 'strip'; // default 'grid'
    columns?: 2 | 3 | 4; // grid only; default 3
    cellRatio?: '1/1' | '4/5' | '3/2' | '16/9'; // default '4/5'
    lightbox?: boolean; // default true
    className?: string;
  };
  ```
  `'use client'`. Grid layout uses
  `grid grid-cols-2 md:grid-cols-{columns} gap-4`. Strip layout uses
  `flex gap-4 overflow-x-auto snap-x snap-mandatory [&>*]:snap-start`
  with cells at `min-w-[240px] md:min-w-[320px]`. Each cell is a
  `<button type="button">` wrapping `<Aspect ratio={cellRatio}>` +
  `<img>`. GIF cells get a `Badge variant="neutral" size="sm"`
  positioned `absolute end-2 top-2` reading "GIF". Click → opens
  `Modal size="lg"` with active-item `<img>` + caption (if present)
  + prev/next buttons at inline-start/inline-end + counter
  "`۳ از ۷`" in the top inline-end. Keyboard: ArrowLeft → next
  (logical / RTL-correct), ArrowRight → prev; Escape + backdrop
  handled by `Modal`. Focus restore via `useDialogEffect`.

### `packages/ui/src/index.ts`

Add eight named exports + six type exports:

```ts
export { Aspect } from './Aspect';
export type { AspectProps, AspectRatio } from './Aspect';

export { MoneyDisplay } from './MoneyDisplay';
export type { MoneyDisplayProps } from './MoneyDisplay';

export { DateDisplay } from './DateDisplay';
export type { DateDisplayProps } from './DateDisplay';

export { ProductCard } from './ProductCard';
export type { ProductCardProps } from './ProductCard';

export { DesignCard } from './DesignCard';
export type { DesignCardProps } from './DesignCard';

export { ArticleCard } from './ArticleCard';
export type { ArticleCardProps } from './ArticleCard';

export { ShowroomCard } from './ShowroomCard';
export type { ShowroomCardProps } from './ShowroomCard';

export { ImageGallery } from './ImageGallery';
export type { ImageGalleryProps, GalleryItem } from './ImageGallery';
```

### `packages/ui/package.json`

```diff
   "dependencies": {
     "@zhic/design-system": "workspace:*",
     "@zhic/locale": "workspace:*",
+    "@zhic/money": "workspace:*",
     "clsx": "^2.1.1",
     "tailwind-merge": "^2.5.5"
   },
```

### `apps/web/src/app/lab/ui/page.tsx` — extended

Add five new `<Section>` blocks after the existing 2.2 sections, in
this order:

1. **`<Aspect>`** — compact row showing each ratio (`1/1`, `4/5`,
   `3/2`, `16/9`, `21/9`) as a `bg-cream` block with the ratio label
   centered inside. One-time sanity that the primitive maps right.
2. **`<MoneyDisplay>` + `<DateDisplay>`** — a handful of sample
   values each (rials 45_000_000 / 28_000_000 / 8_400_000;
   today / "1405-01-08" / Date constructor) × units and formats.
3. **ProductCard** — three cards in a 3-col responsive grid:
   - "تخت دو نفره آرامش" · tagline "چوب گردوی ایرانی، کتان بلژیکی"
     · priceRials 45_000_000 · availability `made_to_order`
     · leadTimeDays 56 · materials ["چوب گردو", "کتان بلژیکی"]
     · href `/products/takht-aramesh`.
   - "کمد بهار" · priceFallback "استعلام قیمت" · availability
     `in_stock` · materials ["چوب راش"] · href `/products/komod-bahar`.
   - "میز کنار تخت" · priceRials 8_400_000 · no availability
     (null-coalesce check) · no materials · no href (degrades to
     `<article>`, no hover lift).
4. **DesignCard** — two cards in a 2-col grid:
   - "طرح آرامش" · ageGroupLabel "بزرگسال" · description "مجموعه‌ای
     برای اتاق خواب بزرگسالان با خطوط آرام و متریال گرم." · href
     `/designs/aramesh`.
   - "طرح بهار" · ageGroupLabel "کودک" · description "مجموعه‌ای
     شاد و امن برای اتاق کودک، با گوشه‌های گرد و رنگ‌های طبیعی." ·
     href `/designs/bahar`.
5. **ArticleCard** — one card, full-width row:
   - title "راهنمای انتخاب چوب مناسب برای مبلمان"
     · excerpt "در این راهنما با چوب‌های مناسب برای ساخت مبلمان
     آشنا می‌شوید و یاد می‌گیرید چطور بر اساس کاربری، بودجه، و
     ظاهر مطلوب تصمیم بگیرید."
     · author "تیم ژیک" · publishedAt "2026-03-21T12:00:00.000Z"
     · readingTimeMinutes 8 · categoryLabel "مصالح" · href
     `/journal/guide-wood-selection`.
6. **ShowroomCard** — one card:
   - name "شوروم همدان" · city "همدان" · addressLine "بلوار ارم،
     خیابان گلستان" · hoursSummary "شنبه تا پنجشنبه، ۱۰ تا ۲۰"
     · phone `{ label: '۰۸۱ ۳۸۱۲ ۳۴۵۶', e164: '+988138123456' }`
     · href `/showrooms/hamedan`.
7. **ImageGallery — grid** — six items, `columns={3}`,
   `cellRatio='4/5'`, lightbox on. Items alternate `kind: 'image'`
   (neutral `bg-cream` + `bg-sand` placeholder divs via `src=""` +
   an `<img>` fallback that sets `data-placeholder` — see below) and
   `kind: 'gif'` using `/55_bal4.gif` (the one real fixture in
   `apps/web/public/`).
8. **ImageGallery — strip** — four items, `layout='strip'`,
   `cellRatio='16/9'`, lightbox on. Mix of image + GIF.

**Sample image strategy.** `apps/web/public/images/` doesn't exist;
the mockup resolves its product image paths to 404. For the lab
gallery we render a `<img>` with a `data:image/svg+xml` URI
generating a flat ivory block + centered ratio label (e.g.
"`۴:۵` — نمونه") — inlined, no HTTP round-trip, no 404 noise.
GIF cells load `/55_bal4.gif` from `public/`. A small helper at
the top of `/lab/ui/page.tsx` `placeholderSvg(ratio: string, label:
string): string` keeps the inline SVGs out of the JSX.

No other lab changes. `/lab/ui` remains the single verification
surface for `@zhic/ui`.

### Consumer pages

**None touched.** `apps/web/src/app/(site)/page.tsx` continues to
render the mockup sections. The new components live in `/lab/ui`
only until 3.1 / 3.2 adopts them.

### Deletions

None this session. Mockup `components/ui/ProductCard.tsx` +
`components/ui/SectionHeading.tsx` + `components/sections/ProductsSection.tsx`
+ `data/products.ts` all stay — they are owned by Session 3.1 per
the 2.2 rule ("sections stay, 3.1 rebuilds"). The `components/ui/`
directory may be empty-ish after 3.1 deletes them; that's a 3.1
concern.

## Exit check

- [ ] `pnpm install` runs clean (single workspace link expected for
      the new `@zhic/money` dep).
- [ ] `pnpm --filter @zhic/ui typecheck` passes.
- [ ] `pnpm --filter @zhic/ui lint` passes.
- [ ] `pnpm --filter @zhic/web typecheck` passes.
- [ ] `pnpm --filter @zhic/web build` passes; route map unchanged
      (no new routes this session — `/lab/ui` already exists).
- [ ] `pnpm --filter @zhic/money test` still passes (27 tests).
- [ ] `pnpm --filter @zhic/locale test` still passes (53 tests).
- [ ] `/lab/ui` renders all eight new sections with the exact Persian
      sample data above. No 404s in the network panel, no console
      errors, no hydration warnings.
- [ ] Card hover: cursor over a card produces the 2px lift + hairline
      shift from `sand` to `charcoal`. `prefers-reduced-motion: reduce`
      (DevTools → Rendering → Emulate) collapses to hairline shift
      only, no translate.
- [ ] Card focus: Tab into a card → 2px `charcoal` ring, 2px
      `ivory` offset. Tab order on the lab grid moves right → left
      within a row, top → bottom between rows (spec §9 + §10
      checklist).
- [ ] ProductCard availability badge text is Persian ("موجود",
      "ساخت به‌سفارش · ۵۶ روز" with Persian digits via MoneyDisplay's
      sibling logic — i.e. the leadTimeDays goes through
      `@zhic/locale` `toPersianDigits` in the card).
- [ ] DateDisplay in ArticleCard renders "۳۰ اسفند ۱۴۰۴" (or whatever
      `formatDate('2026-03-21...', 'jalali-long')` produces) and its
      wrapping `<time dateTime="2026-03-21T12:00:00.000Z">` appears
      in the DOM.
- [ ] MoneyDisplay in ProductCard renders "۴٬۵۰۰٬۰۰۰ تومان" (or the
      value `formatMoney(45_000_000)` outputs — Persian digits,
      `٬` thousands separator, "تومان" suffix).
- [ ] ImageGallery grid: clicking any cell opens the `Modal`
      lightbox with the same item, prev/next chevrons on opposite
      sides (inline-start / inline-end), counter "`N از T`" in top
      inline-end with Persian digits. ArrowLeft → next item (under
      RTL, reading direction). ArrowRight → previous. Escape +
      backdrop click close. Focus restores to the clicked thumbnail.
- [ ] ImageGallery strip: scrolls horizontally, snaps to each cell,
      cells have `min-w-[240px] md:min-w-[320px]`. Lightbox still
      opens from any cell.
- [ ] GIF cells display a "GIF" Badge at `end-2 top-2` and the GIF
      auto-loops (no pause — imperfect, per key decision).
- [ ] ShowroomCard phone CTA: on a `href`-present card, the phone
      renders as `<span>` (not nested `<a>`). Temporarily remove the
      card `href` in the lab and verify phone switches to
      `<a href="tel:+988138123456">`.
- [ ] No physical-direction Tailwind utilities in
      `packages/ui/src/**` — run
      `grep -RE '\b(m|p|text|border)-(l|r)-' packages/ui/src/` →
      empty.
- [ ] No raw hex / rgb in `packages/ui/src/**` — run
      `grep -RE '#[0-9a-fA-F]{3,8}|rgb\(' packages/ui/src/` → empty.
- [ ] `apps/web/src/components/ui/ProductCard.tsx` still exists and
      is still consumed by `ProductsSection.tsx` (explicit non-change
      — confirms we didn't drift out of scope).
- [ ] `docs/state.md` updated: 2.3 ✅ with commit hash; 3.1 / 3.2 /
      4.1 entry notes updated to reflect the new components
      available; open decision `OD-logo-lockup` unchanged; new
      follow-ups listed (see below).

## Follow-ups to log

- **FU-2.3-a** Convert GIF assets to `<video autoplay muted loop>`
  (mp4/webm). Spec §5 prefers video over GIF for loops > 1 s.
  Blocker: need a media pipeline step that transcodes on CMS upload.
  Lands naturally when Session 3.2 builds the PDP stills/motion
  tabs — 3.2 likely codec-gates GIF uploads.
- **FU-2.3-b** IntersectionObserver pause for looping media
  (spec §5 — "loop only while in viewport"). Requires `<video>`
  migration from FU-2.3-a. Until then ImageGallery GIFs auto-loop
  even when scrolled off-screen. **Imperfection acknowledged; track
  until resolved.**
- **FU-2.3-c** `<PhoneLink>` atom that wraps the nested-interactive
  logic from ShowroomCard (render `<span>` inside a linked card,
  `<a href="tel:...">` otherwise). Moves out of `ShowroomCard.tsx`
  when the second consumer appears (probably `/contact` + `/showrooms/[slug]`
  → Session 3.3).
- **FU-2.3-d** Sale-price rendering in `ProductCard`
  (`salePriceRials` + strikethrough on `basePriceRials`). Skipped
  because no sale mechanic exists in Package 1. Naturally lands with
  Package 2 commerce.
- **FU-2.3-e** `columns: 2 | 3 | 4` in `ImageGallery` is limited to
  those three values because Tailwind's arbitrary `grid-cols-*`
  under JIT + the `@theme` plugin is fine but `{columns}` as a raw
  number would skip the safelist. Expand if / when a page asks.
- **FU-2.3-f** `<ProductCard variant="compact">` for PDP
  related-products and `<ProductCard variant="hero">` for homepage
  featured — add when 3.1 / 3.2 need them with concrete measurements
  (YAGNI today).
- **FU-2.3-g** Next/Image integration. Cards accept
  `image: ReactNode` so consumers swap `<img>` → `<Image>` at each
  call site without a card API change. Requires `remotePatterns`
  configuration in `apps/web/next.config` pointing at the Abr Arvan
  S3 bucket (Session 7.1 infra + Session 3.1 wiring).
- **FU-2.3-h** `<MoneyDisplay>` sale variant + `<MoneyDisplay.Range>`
  for "از ۸٬۴۰۰٬۰۰۰ تومان" when product has variants with differing
  prices — Session 3.2 PDP.
- **FU-2.3-i** Tailwind arbitrary-class audit: several cards rely on
  `[transition-duration:var(--dur-fast)]` style inline. Promote to
  a shared `transition-card` utility in the design-system preset if
  a fourth consumer appears.
- **FU-2.3-j** ImageGallery lightbox: pinch-zoom on mobile, swipe
  gestures for prev/next. Not in spec §6 motion language but natural
  UX — Session 6.2 (motion + scroll effects).

## Deferred

- PDP tabbed media stage (stills / motion / 3D) — Session 3.2
  composes it on top of `ImageGallery` + a future `<ModelViewer>`.
- Card variant system (`compact`, `hero`, `featured`) — see
  FU-2.3-f.
- Sale-price + strikethrough in ProductCard — FU-2.3-d.
- GIF → video migration + in-view pause — FU-2.3-a + FU-2.3-b.
- Next/Image wiring — FU-2.3-g.
- Storybook + RTL unit tests — FU-2.1-a (end-of-phase-2).
- Integration into `/`, `/products`, `/journal`, `/showrooms` pages
  — Sessions 3.1 / 3.2 / 3.3 / 4.1.
- Real Payload-driven card data — Session 3.1 onward.
- Skeleton loading states — add when an async card consumer appears.
- Gallery touch gestures (swipe, pinch-zoom) — FU-2.3-j.
- `<PhoneLink>` promotion out of ShowroomCard — FU-2.3-c.
- Mockup deletions (`components/ui/ProductCard`, `sections/ProductsSection`,
  `data/products.ts`) — Session 3.1.

## Implementation notes (post-execution)

Caught during build, not in the planning pass. Logged here so the next
session sees the same ground truth.

- **`formatDate` does not accept the `format` modes the plan assumed.**
  The plan's `DateDisplay` API said `format?: 'jalali-long' |
  'jalali-short' | 'jalali-numeric'`. The live `@zhic/locale`
  `formatDate` only supports long form with an optional `withWeekday`
  flag and a `digits` setting. `DateDisplay` was aligned to that —
  props are `value`, `withWeekday?`, `digits?`. Short / numeric forms
  land when a consumer needs them → **logged as FU-2.3-k**.
- **`formatMoney` uses `digits: 'fa' | 'en'`, not `'fa' | 'ascii'`.**
  The plan used `'ascii'`. `MoneyDisplay` was aligned to pass through
  `'fa' | 'en'`. Consumers should use `'en'` when they want ASCII
  digits. No follow-up — just a naming convention difference.
- **Shared card chrome extracted to `cardClasses.ts`.** The plan
  described inline root styling per card. Four cards × identical
  hairline / radius / hover-lift / focus-ring rules made extraction
  obvious — `CARD_BASE` + `CARD_INTERACTIVE`, used by all four cards.
  Mirrors the `controlClasses.ts` pattern from 2.1.
- **Lab placeholder images are inline `data:image/svg+xml` URIs.**
  `apps/web/public/images/` doesn't exist; the mockup's
  `/images/product-*.jpg` paths 404 today. For the lab, a small
  `placeholderSvg(label)` helper emits inline SVGs tagged with the
  cell label (Persian). Zero network requests, zero 404s. Real media
  lands with Payload + Abr Arvan (Session 3.1 / 7.1) → **logged as
  FU-2.3-l**.
- **ImageGallery keyboard `dir` detection** reads
  `document.documentElement.getAttribute('dir')` at keydown time. For
  today's site-wide `<html dir="rtl">` invariant this is correct and
  forward-safe for a future LTR toggle. If dynamic dir management
  ever lands, verify → **logged as FU-2.3-m**.
- **Gallery lightbox width** overrides Modal's `max-w-lg` by passing
  `className="w-full max-w-[min(95vw,1200px)]"`. `tailwind-merge`
  inside the shared `cn()` already resolves the conflict; no change
  to `Modal` was needed.
- **`@zhic/ui` `<img>` lint warnings** (2 in ImageGallery) are
  expected and acknowledged — FU-2.3-g owns the `<Image>` migration.
  Pre-existing warning in `apps/web/VideoSection.tsx` is unrelated.
- **ArticleCard meta separator** uses the middle dot `·` (U+00B7)
  between author / DateDisplay / reading-time. Not in spec — common
  editorial idiom, matches the "calm, grounded" voice rules.
- **Exit-check greps pass clean** — no physical-direction Tailwind
  utilities, no raw hex / rgb in `packages/ui/src/**`.
- **Status check:** `/lab/ui` returns 200 on dev server, all Persian
  fixtures render (تخت دو نفره آرامش, طرح آرامش, طرح بهار, شوروم
  همدان, راهنمای انتخاب چوب مناسب, GIF badge).
