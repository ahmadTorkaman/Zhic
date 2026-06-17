# Building — 430 column, cqw, seed content, components

## The 430-standard column + cqw units
These comps are 430px-wide mobile designs. Build the body in a centered column capped at 430 so
comp px map 1:1, and size type/spacing in **container-query units** so it's pixel-exact at 430 and
scales proportionally on narrower phones (NOT viewport-relative — vw would blow up on desktop where
the column stays 430).

Page wrapper (real route AND `/lab` page):
```tsx
<div className="mx-auto w-full max-w-[430px]" style={{ containerType: 'inline-size' }}>
  {/* breadcrumb, then sections; cards use px-[12px]-ish side gutters, hero is full column width */}
</div>
```
In component CSS modules, size in `cqw`: **comp px ÷ 4.3 ≈ cqw** (1cqw = 1% of the 430 column).
- 41.555px → `9.66cqw` · 16.94px → `3.94cqw` · 13.55px → `3.15cqw` · 23.26px → `5.4cqw` · 9.03px → `2.1cqw`.
- Use cqw for font-size, paddings, gaps, and even arch/card dimensions (`width: 34cqw; aspect-ratio: 145/240`).
- Radii/borders can stay px (sub-px imperceptible). Tokens: `--radius-card` etc. live in design-system.
- `next/image` with `fill` + a sized relative parent (`aspect-ratio` + `overflow:hidden`); set
  `object-fit: cover` and `object-position` to match the comp's crop/pan.

## Content seed module (seed now → Payload later)
`apps/web/src/lib/<page>-content.ts`:
```ts
export type XItem = { key: string; title: string; img: string; href: string; /* mirror PayloadArticle/Category */ };
export type XContent = { hero: ...; items: XItem[]; ... };
const SEED: XContent = { /* exact comp content + /public/<page>/ media paths */ };
// async so the Payload swap is seamless — later: return mapPayloadToContent(await fetchArticles())
export async function getXContent(): Promise<XContent> { return SEED; }
```
- Components take this as **props** — no hardcoded content inside components. The page (server
  component) calls `await getXContent()` and passes slices down.
- Keep presentation-only specifics (kashida `displayTitle`, positional bg ramps) either in the seed
  or applied by index in the component; the eventual CMS only needs to supply title/img/href/etc.
- Mirror the existing `PayloadArticle` / `PayloadJournalCategory` / `PayloadCategory` field names
  (`lib/payload.ts`) so wiring is a 1:1 map.

## Components — house style
- CSS-module + token based (`var(--color-*)`, `var(--radius-*)`), matching existing components.
- Reuse: `BrandDivider` (zhic wordmark between hairlines — `components/bedroom-furniture/BrandDivider.tsx`,
  asset `/bedroom-furniture/zhic-wordmark.png`), `GoldArrow` and `DotsIndicator` (`packages/ui`,
  `DotsIndicator` takes `onSelect` to be clickable). New reusable primitives → `packages/ui` (export
  from `src/index.ts`); page-specific composition → `components/<page>/`.
- **RTL**: page is `dir="rtl"`. Use logical props (`inset-inline-start/end`, `margin-inline-*`) — but
  remember start=right, end=left. For decorative absolute positioning, physical `left/right` is clearer.
- **Interactivity** (carousels/tabs): a coverflow becomes a `'use client'` component with `useState`
  active index + pointer drag + clickable dots; position slides absolutely by role
  (center/left/right/hidden) with transitions. Tabs that navigate are just `<a>` links (active is
  route-driven, no client state).

## New design tokens
Add to BOTH `packages/design-system/css/tokens.css` (the `:root` source of truth) AND
`packages/design-system/css/theme.css` (the `@theme inline` Tailwind map) — they must stay in sync
(theme.css uses literal values, not `var()`). Reuse near-matches (e.g. `#C2986B` ≈ `--color-gold`,
`#5F7760` = `--color-forest`); only add genuinely new surfaces.

## Gotchas that bite during build
- **Tailwind spacing inflation** — the numeric scale is remapped to DS step tokens: bare `pb-10`/`mt-10`
  /`size-10` (N5–12) inflate (`-10` = 8rem = **128px**, `-12` = 16rem = 256px). For a FIXED gap/size use
  arbitrary px (`pb-[40px]`, `size-[32px]`). `gap-/p-/m-/py-` used as the DS rhythm are intended — don't
  "fix" those. See the `zhic-tailwind-spacing-override` memory.
- **Kashida / tatweel (ـ) display titles** — comps stretch words with U+0640 (e.g. «بزرگــســــال»,
  «در خـــــانه»). Store the exact stretched glyphs as a `display`/`displayTitle` field, render that,
  and keep the **plain** word in `aria-label` (kashida hurts screen readers). When a kashida word is
  one unbreakable token wider than its box it wraps to 3 lines — match the comp's break with `\n` in
  the content + `white-space: pre-line` on the element (and shave font/padding if still tight).
- **Fonts** — Ayandeh is self-hosted, weights map: Light 300 / Regular 400 / Bold 700 / Black 900.
  Crimson Text (serif numerals) and other Google Fonts are **blocked in Iran** → build with a fallback
  (`'Crimson Text', Georgia, serif`) and flag self-hosting (`next/font/local`) as a follow-up.
- **z-index for overlapping decorations** — a card with `position: relative` paints over earlier
  siblings; give overlaid plants/quote-marks a higher `z-index` than the card so they sit on top.
- **Global chrome differences** — if the comp's CTA/footer differ from the live global ones (e.g. an
  added background image), that's an app-wide change — confirm scope with the operator before touching
  shared components; default is reuse-as-is.
