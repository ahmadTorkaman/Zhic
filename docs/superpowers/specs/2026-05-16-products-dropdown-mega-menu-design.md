# Products dropdown mega-menu — Design Spec

**Date:** 2026-05-16
**Branch:** to be cut from `staging` once work begins (suggested: `feat/products-mega-menu`)
**Status:** spec — implementation plan to follow via `superpowers:writing-plans`
**Closes:** `FU-2.2-a` (mega-menu on محصولات), `FU-3.2-u` (mega-menu wired to categories + collections.featured)

---

## 0. Why this spec

The «محصولات» entry in `SiteHeader` is a flat `<Link href="/products">` today. Two follow-ups from sessions 2.2 and 3.2 have called for a richer mega-menu since the design system landed, on the principle that a luxury catalog with 8 categories, 4 designs, and curated collections deserves more than a single tap-target on the chrome.

A first mockup (`apps/web/public/docs/products-dropdown.html`, 2026-05-13) tried a 3-column "see everything at once" layout — categories list + designs+editor-picks + featured product card. Review concluded the layout was busy and didn't model how customers actually browse the catalog (pick a lens first, then drill down).

This spec covers the revised v2 mockup (`apps/web/public/docs/products-dropdown-v2.html`, 2026-05-16) and its production implementation: a **top-tab + pinned-feature** mega-menu with progressive disclosure, wired to Payload data, accessible by keyboard, and shipped without scope creep into mobile or "see all" surfaces that don't yet exist.

It deliberately **does not** cover:

- Mobile mega-menu expansion (`MobileMenu.tsx` stays a flat link list)
- Companion mega-menu on «درباره‌ی ما» (the other half of `FU-2.2-a`)
- `/designs` and `/collections` index pages (out of scope; cut the "See all" CTAs)
- Live autocomplete in the menu's search input (basic title-substring filter only)
- Denormalized `productCount` field on `Categories` (computed at fetch time)

Those are tracked as follow-ups in §10.

---

## 1. Visual reference

The reviewed v2 mockup lives at:

- **Source:** `.superpowers/products-dropdown-v2-mockup.html`
- **Served:** `http://80.240.31.146:3000/docs/products-dropdown-v2.html`

Structure inside the open dropdown:

```
┌──────────────────────────────────────────────────────────────────────┐
│  [دسته‌بندی‌ها]  [طرح‌ها]  [مجموعه‌ها]          [🔍 جستجوی محصول…]   │
├──────────────────────────────────────────────────────────────────────┤
│                                                  │                    │
│  (Panel for active/hovered tab)                 │  محصول شاخص ماه    │
│                                                  │                    │
│  Categories (default): 2-col grid of 8 items    │  ┌────────────┐    │
│  Designs (on hover):   2-col rich cards         │  │  image      │   │
│  Collections (on hover): 2-col rich cards       │  └────────────┘    │
│                                                  │  Title             │
│  → همه‌ی محصولات  (only on Categories panel)     │  ۸٬۵۰۰٬۰۰۰ تومان │
│                                                  │  مشاهده محصول →    │
└──────────────────────────────────────────────────────────────────────┘
```

RTL: tabs anchor the start side (right), search the end side (left); featured product is on the end side (left) of the body row.

---

## 2. Architecture

### 2.1 Files added

| Path | Role |
|---|---|
| `apps/web/src/components/layout/ProductsMegaMenu.tsx` | Client component. Owns trigger button + dropdown markup + tab/open state. |
| `apps/web/src/lib/payload.ts` (extend) | New fetcher `fetchNavMeta()` returning the bundled menu payload. New types: `NavMeta`, `NavCategory`, `NavDesign`, `NavCollection`, `NavFeaturedProduct`. |
| `apps/web/src/lib/products.ts` (extend) | Existing `parseSearchParams` extended to read `q` (title substring). |
| `apps/web/src/app/(site)/products/page.tsx` (extend) | Apply `q` filter when present. |
| `apps/web/src/styles/mega-menu.css` _or_ component-scoped Tailwind | Mega-menu styles ported from the v2 mockup. |

### 2.2 Files modified

| Path | Change |
|---|---|
| `apps/web/src/components/layout/SiteHeader.tsx` | Accept `navMeta` prop; replace the «محصولات» `<Link>` with `<ProductsMegaMenu>`. |
| `apps/web/src/components/layout/navLinks.ts` | `محصولات` entry stays in `NAV_LINKS` for mobile (flat link) but is filtered out of desktop rendering (or the desktop nav iterates `NAV_LINKS.slice(1)` after rendering the mega-menu component first). |
| `apps/web/src/app/(site)/layout.tsx` | Server component: `await fetchNavMeta()` and pass into `<SiteHeader navMeta={...} />`. |

### 2.3 Data flow

```
fetchNavMeta() ──── server, in (site)/layout.tsx
       │
       │ NavMeta
       ▼
<SiteHeader navMeta={...} /> ──── client component
       │
       │ navMeta
       ▼
<ProductsMegaMenu data={navMeta} /> ──── client component (the mega-menu)
```

`fetchNavMeta()` runs once per server render of any `(site)` page, gets Next's `unstable_cache` / `revalidate: 300` treatment like other home-block fetchers in `lib/payload.ts`. No fetch-on-hover, no client flash, no waterfall.

---

## 3. Data — `fetchNavMeta()`

### 3.1 Signature

```ts
export type NavCategory = {
  id: string | number
  name: string
  slug: string
  productCount: number
}

export type NavDesign = {
  id: string | number
  name: string
  slug: string
  /** Persian label derived from age_group (نوزاد/کودک/نوجوان/بزرگسال). null when age_group is unset. */
  subtitle: string | null
  productCount: number
}

export type NavCollection = {
  id: string | number
  name: string
  slug: string
  /** First plain-text line of description (richText), truncated to ~60 chars. null when description empty. */
  subtitle: string | null
  productCount: number
}

export type NavFeaturedProduct = {
  id: string | number
  slug: string
  name: string
  tagline: string | null
  basePriceRials: number
  coverImageUrl: string | null
} | null

export type NavMeta = {
  categories: NavCategory[]
  designs: NavDesign[]
  collections: NavCollection[]
  featuredProduct: NavFeaturedProduct
}

export async function fetchNavMeta(): Promise<NavMeta>
```

### 3.2 Implementation outline

```
Single function. Makes 4 Payload REST calls in parallel via Promise.all:

  1. GET /api/categories?limit=50&sort=name
  2. GET /api/designs?limit=20&where[featured][equals]=true&sort=name
       If the response yields zero rows, retry once without the featured filter
       (designs are sparse in Pkg 1; an empty menu panel is worse than showing all).
  3. GET /api/collections?limit=20&where[featured][equals]=true&sort=name&depth=0
       Each row carries a `products: number[]` field (the reverse relation),
       so the productCount per collection is just `row.products.length`.
       No fallback — collections panel shows empty state if zero featured exist.
  4. GET /api/products?limit=100&select=categoryIds,design
       Used to compute productCount per category and per design. Products has
       `categoryIds` (hasMany → categories) and `design` (single → designs);
       no field links products to collections, so collections rely on call #3
       for their counts.
  5. GET /api/products?limit=1&where[featured][equals]=true&sort=featuredOrder&depth=1

The 4th call is the cost driver. Capped at 100 products which fits the
Package-1 catalog comfortably. Switch to denormalized productCount fields
on Category/Design when the catalog crosses 100 (FU-MM-f).

After the 5 calls resolve:
  - Bucket the products list (#4): increment productCount on the matching
    NavCategory for every id in `categoryIds[]`; increment productCount on
    the matching NavDesign for the single `design` id.
  - Collection productCounts come from `collection.products.length` directly.
  - Coalesce the featured product (#5) into NavFeaturedProduct (depth=1 so
    `gallery[0].url` is available without a second round-trip).
  - Return NavMeta.

Failure mode: each of the 5 calls is independently `try`-wrapped. A failing
call yields an empty array (or null for #5) for its slice; other slices
remain populated. Header never crashes. `console.error` is logged with the
failure tag (`nav-categories`, `nav-designs`, etc) so it surfaces in pm2
logs without bringing the page down.
```

### 3.3 Caching

Wrap in `unstable_cache` with tags `['nav', 'categories', 'designs', 'collections', 'products-featured']` and `revalidate: 300`. Hook into Payload's `afterChange` revalidation via existing webhook plumbing (FU-3.1-e) once that ships — for now, 5-minute window is fine.

---

## 4. Component — `ProductsMegaMenu.tsx`

### 4.1 Props

```ts
type Props = {
  data: NavMeta
  /** Pathname for active-link styling on the trigger. */
  pathname: string | null
}
```

### 4.2 Internal state

```ts
const [open, setOpen]       = useState(false)
const [activeTab, setTab]   = useState<'categories' | 'designs' | 'collections'>('categories')
const [hoverLock, setLock]  = useState(false)  // true after a click; resists hover-driven panel swap
const triggerRef            = useRef<HTMLButtonElement>(null)
const menuRef               = useRef<HTMLDivElement>(null)
```

### 4.3 Behavior

| Trigger | Action |
|---|---|
| Hover trigger | Open menu (CSS + state). |
| Hover inside menu | Keep open. |
| Hover tab | Swap panel (CSS `:has()` for the swap; component reflects `aria-selected` on tabs). |
| Click tab | Lock the tab as active (state). Hover-swap is suppressed until mouse leaves the menu entirely. |
| Click trigger | Toggle `open` (keyboard users without hover can still open). |
| Esc | Close, return focus to trigger. |
| Click outside | Close. |
| Tab / Shift+Tab | Cycles focusable elements inside menu (browser default). |

Arrow-key navigation between tabs and roving tabindex are **deferred** to a follow-up. The brand wants minimal viable a11y for first ship; basic Tab/Shift+Tab + Esc are sufficient.

### 4.4 ARIA

```html
<button
  aria-haspopup="true"
  aria-expanded={open}
  aria-controls="products-mega"
  ref={triggerRef}
>محصولات</button>

<div id="products-mega" role="menu" aria-label="منوی محصولات" ref={menuRef}>
  <div role="tablist" aria-label="فیلتر منوی محصولات">
    <button role="tab" aria-selected={activeTab === 'categories'} aria-controls="panel-categories">
      دسته‌بندی‌ها
    </button>
    {/* ... */}
  </div>
  <div role="tabpanel" id="panel-categories" aria-labelledby="tab-categories">
    {/* ... */}
  </div>
  {/* ... */}
</div>
```

### 4.5 Mockup → component translation

Mockup uses pure CSS with `:has()` for the hover-driven panel swap. The component keeps that CSS for the **hover** path (zero JS, smooth and cheap), and layers React state on top for the **click-lock** path. The two coexist: when `hoverLock` is `false` and no tab is being hovered, the CSS-active tab is whatever `activeTab` state says; on hover, `:has()` overrides; on tab click, `hoverLock` becomes true and React's `data-active-tab="…"` attribute on `.mega` overrides `:has()` via specificity.

```css
/* hover-driven swap (existing in mockup) */
.mega:has(.mega-tab[data-tab="designs"]:hover) .mega-panel[data-panel="categories"] { display: none; }
.mega:has(.mega-tab[data-tab="designs"]:hover) .mega-panel[data-panel="designs"] { display: block; }

/* click-lock override (new for React) */
.mega[data-locked="true"][data-active-tab="designs"] .mega-panel[data-panel="categories"] { display: none !important; }
.mega[data-locked="true"][data-active-tab="designs"] .mega-panel[data-panel="designs"] { display: block !important; }
```

---

## 5. Search wiring — `q` filter on `/products`

The mega-menu's search input is a `<form action="/products" method="get">` with `<input type="search" name="q">`. Submitting navigates to `/products?q=<value>`.

### 5.1 Changes to `apps/web/src/lib/products.ts`

`parseSearchParams` extends to read `q` from the URL. Type:

```ts
export type ProductFilters = {
  categorySlug: string | null
  materialSlug: string | null
  sizeBand: 'small' | 'medium' | 'large' | null
  priceBand: 'under-5m' | '5m-10m' | '10m-20m' | 'over-20m' | null
  q: string | null  // new
  sort: ProductSort
  page: number
}
```

### 5.2 Changes to `apps/web/src/app/(site)/products/page.tsx`

When `filters.q` is non-empty, pass it through to the Payload products query as:

```ts
where: {
  ...existingClauses,
  or: [
    { name: { contains: filters.q } },
    { tagline: { contains: filters.q } },
    { shortDescription: { contains: filters.q } },
  ],
}
```

Payload's Postgres adapter compiles `contains` to `ILIKE %…%`. Case-insensitive, accent-insensitive on PG depending on collation; sufficient for first ship.

### 5.3 Visual treatment of the active search

Deferred to `FU-MM-h` (search chip near the breadcrumb that displays the active `q` and offers a `✕` clear). For this spec, the filter is honest (the products list filters correctly), but no header chip ships in this PR.

---

## 6. Routes & CTAs — what's cut

The v2 mockup had three "See all" CTAs at the bottom of each panel. Two of them point to routes that don't exist:

| Mockup CTA | Route | Decision |
|---|---|---|
| همه‌ی محصولات | `/products` | **Keep** — route exists. |
| همه‌ی طرح‌ها | `/designs` | **Cut** — no route, deferred to follow-up. |
| همه‌ی مجموعه‌ها | `/collections` | **Cut** — only `/collections/[slug]` exists. Deferred. |

The mega-menu component renders the "See all" CTA only for the Categories panel. Designs and Collections panels show their items and stop.

Per-item links inside each panel point to:

- Categories item → `/products?category=<slug>` (existing 4-axis filter)
- Designs item → `/products?design=<slug>` — **requires** adding `design` to `parseSearchParams` along with `q`. Products has a single `design` relation, so the Payload where-clause is `where: { 'design.slug': { equals: <slug> } }` (no `contains`).
- Collections item → `/collections/<slug>` (existing per-slug route)
- Featured product → `/products/<slug>` (existing)

So one small extension to `parseSearchParams` (add `q` and `design` together) and one small extension to the `/products` page query.

---

## 7. Mobile

`MobileMenu.tsx` stays a flat list. The «محصولات» entry in `NAV_LINKS` continues to point at `/products` and renders as a single tap-target on mobile. Mobile users get the full filter UI on the products index, which already supports category/material/size/price-band.

No mega expansion, no nested accordion, no duplication of the desktop mega-menu's UX on mobile. This is a deliberate scope decision to ship the desktop value without doubling the testing surface. Mobile expansion is a follow-up if customer research shows it's needed.

---

## 8. Tests

### 8.1 Unit (Vitest, in `apps/web`)

- `fetchNavMeta` shape: mock 5 Payload responses, assert returned `NavMeta` shape, productCount aggregation correct.
- `fetchNavMeta` failure: when one underlying call rejects, returns empty bundle (not throw).
- `parseSearchParams` reads `q` and `design` correctly; URL-encoded Persian works.
- `ProductsMegaMenu` (RTL): renders trigger; pressing Esc when open closes; click on a tab updates `aria-selected`.

### 8.2 Manual

- Hover trigger → menu opens. Move to a tab → panel swaps. Move out of menu → menu closes after the existing transition delay.
- Tab through trigger and into menu → focus visible; Esc closes and returns focus to trigger.
- Click trigger when closed → opens. Click trigger when open → closes.
- Click outside menu → closes.
- Submit search with Persian query → lands on `/products?q=…` and results filter correctly.
- Mobile viewport (≤ 768px): mega-menu component is not rendered; «محصولات» is a flat link.

### 8.3 Smoke

- `curl /` returns 200 (header renders with menu component).
- `curl /products?q=تخت` returns 200 and the products list filters.
- `pnpm --filter @zhic/web typecheck` → 0 new errors.
- `pnpm --filter @zhic/web build` → clean.

---

## 9. Acceptance criteria

The PR is done when **all** of the following are true:

1. `/` and every `(site)/` page renders with the mega-menu trigger in place of the flat «محصولات» link.
2. Hovering or clicking the trigger opens the menu; the default panel is Categories.
3. Hovering or clicking a tab swaps to the correct panel.
4. Categories panel shows ≥ 1 category from Payload with a product count beside it.
5. Designs panel shows ≥ 1 design from Payload (if any exist as `featured: true`, else any design).
6. Collections panel shows ≥ 1 collection from Payload where `featured: true` (or empty state if none).
7. Featured product card shows the lowest-`featuredOrder` `featured: true` product (or hidden if none).
8. Search input submits to `/products?q=<value>`; the products page filters by title substring.
9. Esc closes the menu and returns focus to the trigger.
10. Mobile (≤ 768px): no mega-menu; «محصولات» is a flat link to `/products`.
11. Typecheck, lint, build all clean.
12. `docs/state.md` updated: `FU-2.2-a` and `FU-3.2-u` struck through with this commit's hash.

---

## 10. Follow-ups (out of scope, captured for `state.md`)

| Id (proposed) | Item |
|---|---|
| `FU-MM-a` | `/designs` index page — wire "See all" CTA for designs panel. |
| `FU-MM-b` | `/collections` index page — wire "See all" CTA for collections panel. |
| `FU-MM-c` | Mobile mega-menu expansion in `MobileMenu.tsx`. Trigger user-research signal first. |
| `FU-MM-d` | Arrow-key navigation between tabs + roving tabindex. |
| `FU-MM-e` | Live autocomplete in the mega-menu search input (server-side suggest endpoint). |
| `FU-MM-f` | Denormalized `productCount` field on `Categories` / `Designs` / `Collections` with `afterChange` Payload hook. Promote when catalog crosses 100 products. |
| `FU-MM-g` | Companion mega-menu on «درباره‌ی ما» — the other half of `FU-2.2-a`. |
| `FU-MM-h` | Search chip on `/products` header that displays the active `q` and offers a `✕` clear button. |

---

## 11. References

- v1 mockup: `apps/web/public/docs/products-dropdown.html` (2026-05-13)
- v2 mockup: `apps/web/public/docs/products-dropdown-v2.html` (2026-05-16) — **the agreed visual**
- State board: `docs/state.md` — `FU-2.2-a` (line ~137) and `FU-3.2-u` (line ~202)
- Sitemap: `docs/spec/sitemap.md` — nav structure
- Categories schema: `services/api/src/collections/Categories.ts`
- Collections schema: `services/api/src/collections/Collections.ts` (note `featured` field literally labeled «نمایش در منوی ناوبری»)
- Designs schema: `services/api/src/collections/Designs.ts`
- Products schema: `services/api/src/collections/Products.ts` (`featured` + `featuredOrder` fields from session 3.2)
