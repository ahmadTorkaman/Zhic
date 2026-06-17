# /bedroom-set/[age]/[design] detail — Figma rebuild spec (@430)

**Comp:** Figma frame `261:90` — "example /bedroom-set/teen/iorn" (Kaveh mobile, 430 × 3374.5).
**Route:** `/bedroom-set/[age]/[design]` (age-nested series hub). Redesign the **shared**
`series-hub.tsx` template in place — every age/design hub gets this layout; **seeded with iron** now.
**Example URL:** `/bedroom-set/teen/iron` → `[age]=teen` (occupancy), `[design]=iron` (آیرون).

Decisions (operator, 2026-06-17):
1. Redesign the shared template in place (props-driven, generic; iron is the seed).
2. **Static-exact seed first** — `lib/series-hub-content.ts`, async getter mirroring Payload shapes.
3. **Reproduce the sale price faithfully** — struck original + larger sale price (Pkg-2 `salePriceRials`).
4. **Frame 3 (261:233) empty bars → sibling-slug links** — shaped collaboratively; featured sage band
   (261:238) is the first such sibling («سرویس خواب دونفره آیرون» → `/bedroom-set/double/iron`).

Global chrome = existing `SiteHeader` + `SiteFooter` (the consultation CTA «زیبایی / از یک انتخاب
ساده آغاز می‌شود / دریافت مشاوره رایگان» is `zh-foot-cta` inside `SiteFooter`, copy matches verbatim).
**Build only the BODY** between breadcrumb and the consultation CTA.

---

## Body structure (top → bottom)

| # | Zone | Node | Notes |
|---|---|---|---|
| 0 | Breadcrumb | `261:105` | «‹ خانه › سرویس خواب › آیرون» (existing `Breadcrumbs`) |
| 1 | Hero | `261:151–154` | Full-bleed room photo (430×232) + cream title card overlapping its bottom edge (shadow), centered «آیرون» + subtitle |
| 2 | Intro card | Group 8 `261:196` | cream card, photo **left** + text **right**: title «سرویس نوجوان و بزرگسال» + short desc. **«بیشتر بخوانید» removed per operator (2026-06-17)** — story card keeps it |
| 3 | Collection | Group 7 `261:203` | heading «قطعات سرویس» + 2-col product cards (gold border): photo + cream label band (name, **struck** orig price, sale price) |
| 4 | Materials | Group 9 `261:175` | cream card, heading «متریال های استفاده شده» + 3 circular swatches (پارچه/MDF/فلز) + label + sub-label, gold vertical dividers |
| 5 | Details | Group 10 `261:155` | heading «جزئیات طراحی» (bronze) + 4 unequal image tiles (continuous strip) + label + tiny description per column |
| 6 | Story | Group 6 `261:189` | cream card, text **left** + photo **right**: heading «داستان طراحی» + paragraph + «بیشتر بخوانید →» |
| 7 | **Siblings** | Frame 3 `261:233` | sibling-slug links → **other نوجوان designs**, each a full-width sage band (operator 2026-06-17): کارولین/لوف/لوکاپلاس/پارلا → `/bedroom-set/teen/<slug>` |
| 8 | Featured sibling | Group 11 `261:238` | sage band: photo **left** + white «سرویس خواب دونفره» / «آیرون» / «مشاهده →» (→ `/bedroom-set/double/iron`). Rendered **last**, after the zone-7 bands |

---

## Media (downloaded + optimized → `apps/web/public/bedroom-set/iron/`)

`next/image` re-encodes to webp/avif; jpeg sources fine. SVG arrows/lines reproduced in code.

| File | px | Source hash | Role |
|---|---|---|---|
| `hero.jpg` | 1400×787 | c126a5e4… | Hero room scene (full-bleed) |
| `intro.jpg` | 640×450 | 4e6b37db… | Intro card photo (shelving/desk) |
| `bed-100-a.jpg` | 600² | 3b6617c0… | Collection card 1 — تخت ۱۰۰ |
| `bed-120-a.jpg` | 600² | a2fc7fc1… | Collection card 2 — تخت ۱۲۰ |
| `bed-100-b.jpg` | 600² | fa9790fe… | Collection card 3 — تخت ۱۰۰ |
| `bed-120-b.jpg` | 600² | f1312acf… | Collection card 4 — تخت ۱۲۰ |
| `mat-fabric.jpg` | 260² | 9fa703e2… | Material — پارچه |
| `mat-mdf.jpg` | 260² | 9d805412… | Material — MDF |
| `mat-metal.jpg` | 260² | f97f3977… | Material — فلز |
| `detail-personalize.jpg` | 420² | 4390d7a9… | Detail — فضای شخصی سازی (leftmost, widest) |
| `detail-pegboard.jpg` | 295×420 | fbf4b8e8… | Detail — پگبورد |
| `detail-metal.jpg` | 295×420 | 8da72f2f… | Detail — استحکامات فلزی |
| `detail-headboard.jpg` | 295×420 | 5ebb1452… | Detail — سر تخت کشویی (rightmost) |
| `story.jpg` | 520×365 | 919e1816… | Story card photo (bed) |
| `featured.jpg` | 700×393 | 2714a186… | Featured sibling scene (classic double) |

Arrows: `da0de44a.svg` (gold, intro/story) & `05207fc4.svg` (white, featured) = the existing
`@zhic/ui` `GoldArrow` glyph (currentColor). Strike/divider/connector SVG lines → CSS.

---

## Exact type & color specs (Ayandeh: Light 300 / Regular 400 / Bold 700 / Black 900)

cqw = comp px ÷ 4.3 (1cqw = 1% of the 430 column).

**Hero (1)**
- Title card `261:152`: bg `#f2eee8`, radius 16.712px, shadow `0 0.903px 3.004px 0.678px rgba(0,0,0,.25)`; 405×117 at y302 — overlaps hero bottom (hero ends y326).
- «آیرون» `261:153`: Ayandeh **Black** `41.555px → 9.66cqw`, `#1f1f1f`(→ink), centered.
- subtitle `261:154`: Ayandeh Regular `12.421px → 2.89cqw`, `#464646`(→ink-soft), centered.

**Intro card (2)** `261:196`
- card bg `#f2eee8`, radius 16.712; photo left (231×165, radius 16.712).
- title `261:199`: Ayandeh Bold `12.421px → 2.89cqw`, `#2e3b2f`(forest-deep), right.
- desc `261:201`: Ayandeh Regular `9.034px → 2.10cqw`, `#414141`(ink-soft), right.
- link «بیشتر بخوانید» `261:200`: Ayandeh Regular `9.034px`, `#657767`(forest-muted) + gold arrow.

**Collection (3)** `261:203`
- heading «قطعات سرویس» `261:224`: Ayandeh Bold `20.326px → 4.73cqw`, ink, centered.
- card: 194×252, border `1.129px #c2986b`(gold), radius 16.712; photo ~upper 62%; cream label band `#f2eee8`.
- name `261:212`: Ayandeh Bold `23.713px → 5.51cqw`, ink, centered.
- orig price `261:216`: Ayandeh Regular `15.809px → 3.68cqw`, ink, **line-through gold**.
- sale price `261:220`: Ayandeh Regular `18.067px → 4.20cqw`, ink.
- 4 cards: (1) bed-100-a تخت۱۰۰ (2) bed-120-a تخت۱۲۰ (3) bed-100-b تخت۱۰۰ (4) bed-120-b تخت۱۲۰. Orig ۱۵.۲۵۰ / sale ۱۲.۱۹۰.

**Materials (4)** `261:175`
- card bg `#f2eee8`, 405×193, radius 16.712.
- heading «متریال های استفاده شده» `261:177`: Ayandeh Bold `19.196px → 4.46cqw`, `#2e3b2f`(forest-deep), centered.
- 3 circles ø `81.98px → 19.07cqw`. Right→left: فلز / MDF / پارچه.
- label: Ayandeh Bold `12.421px → 2.89cqw`, ink. sub-label: Ayandeh Light `9.034px → 2.10cqw`, `#414141`(ink-soft).
  - پارچه → کتان مرغوب · MDF → vispan ایتالیا · فلز → رنگ پودری الکترواستاتیک / پوشش مات.
- 2 vertical gold dividers between groups (`37.489px → 8.72cqw` tall).

**Details (5)** `261:155`
- heading «جزئیات طراحی» `261:166`: Ayandeh Bold `19.196px → 4.46cqw`, `#a97e52`(gold-deep), centered, short gold dash each side.
- 4 image tiles (height `71.591px → 16.65cqw`), continuous strip, outer corners rounded 16.712 (start bottom-left, end top-right). Widths R→L: 83 / 117 / 75 / 118 px.
- label `261:171–174`: Ayandeh Regular `10.163px → 2.36cqw`, ink, under each tile (small gold connector line above).
- description: Ayandeh Light `6.775px → 1.58cqw`, `#414141`(ink-soft), centered, leading 7.904, tracking -0.34. (Tiny — faithful to comp.)
  - R→L: سر تخت کشویی / استحکامات فلزی / پگبورد / فضای شخصی سازی (see content seed for full desc strings).

**Story (6)** `261:189`
- card bg `#f2eee8`, 405×177, radius 16.712; photo **right** (190×165, radius 16.712).
- heading «داستان طراحی» `261:192`: Ayandeh Bold `12.421px → 2.89cqw`, `#2e3b2f`(forest-deep), right.
- body `261:194`: Ayandeh Regular `9.034px → 2.10cqw`, `#414141`(ink-soft), right, leading 14.454px.
- link «بیشتر بخوانید» `261:193`: forest-muted + gold arrow.

**Featured sibling (8)** `261:238`
- band bg `#667967`(sage), 408×221, radius `13.55px`(→radius-card). photo **left** (256×221, radius 13.55).
- «سرویس خواب دونفره» `261:244`: Ayandeh Regular `20.326px → 4.73cqw`, white, centered.
- «آیرون» `261:243`: Ayandeh **Black** `23.262px → 5.41cqw`, white, centered.
- «مشاهده» `261:242`: Ayandeh Light `13.55px → 3.15cqw`, white, right + white arrow.

---

## New design tokens (add to `tokens.css` :root AND `theme.css` @theme inline)

| Token | Value | Use |
|---|---|---|
| `--color-cream-panel` | `#F2EEE8` | body card surface (intro / materials / story / collection label) |
| `--color-gold-deep` | `#A97E52` | «جزئیات طراحی» heading |
| `--color-ink-soft` | `#414141` | card body/desc + hero subtitle |
| `--radius-panel` | `17px` | body card radius (Figma 16.712) |

Reused exact: `gold #C49A6C`(≈#c2986b), `forest-deep #2E3B2F`, `sage #667967`, `forest-muted #657767`,
`radius-card 14px`(=13.55 featured). Near-blacks (`#1f1f1f`, comp `text-black`) → `ink #14110F`
(design-system forbids pure black; difference imperceptible at these sizes).

---

## Component inventory (`apps/web/src/components/series-hub/`)

All props-driven, CSS-module + token based, inside the 430 container (`container-type: inline-size`).

- `SeriesDetailHero` — full-bleed photo + overlapping title card.
- `SeriesIntroCard` — photo-left / text-right link card (reused mirror for Story via a `flip` prop).
- `SeriesCollection` — heading + 2-col `ProductPriceCard` grid (struck + sale).
- `SeriesMaterials` — heading + 3 circular swatches.
- `SeriesDesignDetails` — heading + 4-tile strip + labels/desc.
- `SeriesStoryCard` — Story (SeriesIntroCard `flip`).
- `SeriesSiblingLinks` — sibling-slug links (Frame 3 — treatment TBD) + featured sage band `SeriesFeaturedSibling`.

Content seed: `apps/web/src/lib/series-hub-content.ts` — `getSeriesHubContent(slug, ageFilter)`.
Preview: `app/lab/series-hub/page.tsx`. Verified vs comp via Claude Preview MCP.
