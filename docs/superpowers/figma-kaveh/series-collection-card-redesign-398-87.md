# SeriesCollection «قطعات سرویس» card — redesign spec (Figma 398:87)

Redesign of the product card in the `/bedroom-set/[slug]/[series]` detail-page
collection grid (`SeriesCollection`). Source: Figma node **`398:87` "Group 12"**
(Zhic file, read via the local Dev Mode MCP), replacing the previous
frosted-glass floating-label card (`261:203`).

## What changed

The old card filled the photo edge-to-edge with a dark scrim and a translucent
**glass** label floating over it (ivory text). The new card is a clean catalog
tile: a **borderless (transparent) product photo floats over a cream pedestal
that rises from the bottom with rounded top corners**, and the name + prices sit
centered at the pedestal's foot in black ink.

Two operator notes folded in after the first build:
1. the cream layer must have **curved (top) corners** and **come up under the
   media** (it was a flat band sitting below the photo);
2. the product webps are **borderless/transparent** — the photo band must have
   **no opaque background** so they float over the cream.

## Construction (layered, exact to comp)

Card footprint **194.22 × 252.26** (2-col grid in the 430 column). All sizing in
`cqw` (1cqw = 1% of the 430 container = 4.3px → pixel-exact at 430).

| layer | node | spec |
| --- | --- | --- |
| card | 261:208 | `position: relative`, gold border **1px `--color-gold`** (comp `#c2986b` 1.13px), radius **`--radius-panel` 17px** (comp 16.712px), `overflow: hidden`, base `--color-ivory` |
| cream panel | 261:204 | `position: absolute; bottom: 0`, height **62.3%** (top edge at **37.7%**), bg **`--color-cream-panel` #F2EEE8**, `border-radius: 17px 17px 0 0` (rounded **top** corners; bottom clipped by the card), `z-index: 0`. Flex column, text pinned to foot (`justify-content: flex-end`). |
| photo | 261:208 img | `position: absolute; top: 0`, height **60.7%**, **background transparent** (borderless webp floats), `object-fit: contain`, `padding: 2.4cqw`, `z-index: 1` |

## Type (Ayandeh, black `--color-ink`, centered)

| element | weight | size | note |
| --- | --- | --- | --- |
| name | Bold | 23.713px (5.51cqw) | bigger than the old glass card's 18.9px — freed from the cramped band |
| original price | Regular | 15.809px (3.68cqw) | gold `line-through` (sale only). Comp draws a hand-drawn double-wavy strike; CSS line-through is used so it scales to any price width. |
| sale price | Regular | 18.067px (4.20cqw) | — |

## Data + tokens

- Data shape unchanged: `SeriesProductCard` (`key, name, img, price, originalPrice, href`).
- Price strings kept as the live format («۱۲٬۱۹۰ تومان»); the comp's «قیمت :»
  prefix and dropped «تومان» were **not** adopted (operator decision).
- **No new tokens** — `--color-cream-panel`, `--color-gold`, `--color-ivory`,
  `--color-ink`, `--radius-panel` all already existed.

## Files

- `apps/web/src/components/series-hub/SeriesCollection.tsx`
- `apps/web/src/components/series-hub/SeriesCollection.module.css`
- Lab preview (seed, no CMS, transparent cutouts): `apps/web/src/app/lab/series-card/page.tsx`
- No route wiring — already rendered by `SeriesHubBody` on `/bedroom-set/[slug]/[series]`.
