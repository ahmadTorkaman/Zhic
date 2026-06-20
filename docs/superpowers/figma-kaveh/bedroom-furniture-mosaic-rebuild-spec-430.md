# `/bedroom-furniture` — category-mosaic rebuild (Figma Kaveh frame `334:105`, @430)

A second design direction for the **مبلمان اتاق خواب** catalog landing. Where the shipped
`/bedroom-furniture` (frame `191:207`) is an immersive photo-hero + interactive coverflow +
age/occupancy room-grid, this comp is a calmer **text hero on cream + a product-category tile
mosaic**. Built **lab-only first** at `/lab/bedroom-furniture-mosaic`; the real route stays the
coverflow build until the operator approves a swap.

- **Frame:** `334:105` "bedroom furniture", 430 × 2506.
- **Global chrome (NOT rebuilt):** header (top), the consultation CTA + footer (bottom) are the
  existing global `SiteHeader` / `SiteFooter` (the CTA strings «از یک انتخاب ساده…» / «دریافت مشاوره
  رایگان» / «ساخته شده برای ماندن» live in `components/layout/SiteFooter.tsx` + `footerLinks.ts`).
- **Net-new BODY (rebuilt):** breadcrumb → text hero → «دسته بندی محصولات» heading → 7-tile category
  mosaic → `BrandDivider`.
- **Data:** static seed (`lib/bedroom-furniture-mosaic.ts`), props-driven; swap to Payload later by
  editing only the getter.

---

## Media (Figma local assets → `apps/web/public/bedroom-furniture-mosaic/`)

All photo fills pulled from the Dev Mode MCP asset cache, optimized with `sips` (jpeg q84). Wides/
featured ~900w, pair tiles ~480w. `next/image` re-encodes to webp/avif at serve.

| File | Node | Figma fill hash | Tile | Out dims |
| --- | --- | --- | --- | --- |
| `bed.jpg` | `334:107` | `2a3565e6…` | featured «تخت خواب» | 633×900 |
| `nightstand.jpg` | `334:110` | `886ab92e…` | pair «پا تختی» | 337×480 |
| `bookcase.jpg` | `334:112` | `5b5e1aa3…` | pair «کتابخانه» | 337×480 |
| `desk.jpg` | `334:108` | `1b609533…` | wide «میز تحریر» | 633×900 |
| `wardrobe.jpg` | `334:111` | `55f88ac0…` | pair «کُمـــد» | 337×480 |
| `dresser.jpg` | `334:113` | `e8880b19…` | pair «دِراور» | 337×480 |
| `accessory.jpg` | `334:109` | `bb3d7dd1…` | wide «اکسسوری» | 900×506 |

`BrandDivider` reuses the existing `/bedroom-furniture/zhic-wordmark.png` (= comp node `334:158`
"zhic en 2"). No new media for it.

---

## Layout map (frame-absolute y, 430 wide → cqw = px ÷ 4.3)

| Zone | Node(s) | y | Spec |
| --- | --- | --- | --- |
| Breadcrumb | `334:135` | 84 | «‹ خانه › مبلمان اتاق خواب» — reuse global `Breadcrumbs` |
| Hero title | `334:136` | 169 | «مُبلمان / اتاق خواب» (2 lines) — Ayandeh **Black** 41.555px (`9.66cqw`), `#2e3b2f` = `--color-forest-deep`, center, tracking `-0.8311px` (~-0.02em), line-height 1.4 |
| Hero subtitle | `334:143` | 291 | «از تخت خواب تا آینه و میز آرایش» — Ayandeh **Bold** 16.938px (`3.94cqw`), `--color-gold` (`#c2986b`), center, lh 1.49 |
| Hero tagline | `334:151` | 316 | «همه چیز با طراحی منظم و کیفیت ساخت بالا» — Ayandeh **Regular** 13.55px (`3.15cqw`), `--color-gold`, center, lh 1.49 |
| Section heading | `334:144` (+ marks `334:152–155`) | 342 | «دسته بندی محصولات» — Ayandeh **Light** 13.55px (`3.15cqw`), `#2e3b2f`, center, with small gold marks flanking each side |
| Featured tile | `334:107/114/208/201` | 403 | photo 377×399 (`aspect 377/399`), `rounded-[13.55px]` (`3.15cqw`); bottom scrim; label «تخت خواب» Bold **31.843px** (`7.41cqw`) white; gold arrow beneath (no «مشاهده» word) |
| Pair 1 | `334:110/112 …` | 818 | two tiles 178×282 (`aspect 178/283`); labels «پا تختی» / «کتابخانه» Bold **21.681px** (`5.04cqw`) white + «مشاهده» + arrow |
| Wide «میز تحریر» | `334:108/115/137/145/202` | 1117 | photo 377×293 (`aspect 377/294`); label Bold **26.423px** (`6.15cqw`) white + «مشاهده» + arrow |
| Pair 2 | `334:111/113 …` | 1428 | two tiles 178×237 (`aspect 178/238`); labels «کُمـــد» / «دِراور» Bold **21.681px** white + «مشاهده» + arrow |
| Wide «اکسسوری» | `334:109/116/138/146/203` | 1725 | photo 377×230 (`aspect 377/231`); label Bold **26.423px** white + «مشاهده» + arrow |
| Brand divider | `334:156/157/158` | 1986 | reuse `BrandDivider` (zhic wordmark between hairlines) |

Mosaic geometry: side inset ≈ 23.5px (`5.47cqw`); pair column gap ≈ 20.6px (`4.79cqw`); inter-row
gap ≈ 16–17px (`~3.8cqw`). Tile radius 13.55px.

«مشاهده» CTA: Ayandeh **Light** 13.55px (`3.15cqw`) white + `GoldArrow` (`@zhic/ui`, gold). Each
non-featured tile shows «مشاهده» + arrow bottom-centered on a dark scrim; the featured tile shows the
arrow only.

### Tile caption — frosted-glass band (comp 334:114–120)
The comp bands are **glassmorphic**: a Figma *background-blur* effect (NOT exported by
`get_design_context`, which only returned the `rgba(0,0,0,0.1)` tint) over the photo. Confirmed by
node screenshots of `334:114`/`117`/`120`/`115`/`116` — the photo is clearly blurred behind each band.
Reproduced as a glass strip straddling the bottom of each tile: blurred photo + `rgba(0,0,0,0.16)`
neutral tint + diagonal sheen (`--glass-sheen`) + top rim highlight (`inset 0 1px 0 --glass-highlight`)
+ label `text-shadow` for legibility on light photos.

- **`backdrop-filter` is set INLINE** (`blur(9px) saturate(1.2)`), because the CSS-module pipeline
  (Lightning CSS) **strips `backdrop-filter` from `.module.css`** — same workaround as
  `PiecesMegaMenu.tsx`. All other glass props stay in the CSS module.
- **Caption layout = horizontal split** (not centered): category label on the inline-**start** (RIGHT
  in RTL), «مشاهده» + `GoldArrow` on the inline-**end** (LEFT). The featured tile shows the arrow
  only (no «مشاهده» word).
- **Band shape by tile size:** full-bleed tiles (featured + 2 wides) → **full-width bottom band**,
  rounded bottom corners (clipped to the tile). Pair tiles → **centered floating glass pill**
  (all-corner `999px` radius, hairline white border, inset ~1.6cqw, `bottom: 3cqw`). Labels are
  `white-space: nowrap` (single-line, matches comp; stops «پا تختی» wrapping at its space).

### Object-position (from `get_design_context` crop hints)
`bed` 50%/63% · `bookcase` ~center · `desk` 50%/53% · `accessory` 50%/54% · `nightstand` / `wardrobe`
/ `dresser` center (object-cover, no comp offset). Stored per-tile in the seed; tuned in `/lab`.

---

## Category tile links (live `/bedroom-furniture/<…>` leaves, verified via `PiecesMegaMenu` 2026-05-23)

| Tile | Plain (aria) | href |
| --- | --- | --- |
| تخت خواب | تخت خواب | `/bedroom-furniture/bed` |
| پا تختی | پاتختی | `/bedroom-furniture/nightstand` |
| کتابخانه | کتابخانه | `/bedroom-furniture/storage/bookcase` |
| میز تحریر | میز تحریر | `/bedroom-furniture/table/study-desk` |
| کُمـــد | کمد | `/bedroom-furniture/storage/wardrobe` |
| دِراور | دراور | `/bedroom-furniture/storage/dresser` ⚠️ |
| اکسسوری | اکسسوری | `/bedroom-furniture/complement` |

⚠️ **دراور has no dedicated live category** — the megamenu treats «دراور و فایل» as a pure grouping
label (only فایل → `/bedroom-furniture/storage/file-cabinet` exists). Seeded best-guess
`/bedroom-furniture/storage/dresser`; **confirm the real target before wiring the live route** (the
catch-all 308-redirects a valid leaf slug to canonical, else 404s).

---

## Tokens

**No new tokens.** Reuses `--color-forest-deep` (#2E3B2F, exact = hero title), `--color-gold`
(#C49A6C ≈ comp #C2986B, subtitle/tagline/arrows), white labels. Radius 13.55px is per-tile (the
existing `--radius-card` is a different value; mosaic keeps the comp's literal radius in cqw).

## Component inventory (`apps/web/src/components/bedroom-furniture-mosaic/`)

| Component | Role |
| --- | --- |
| `MosaicHero` (+ css) | text hero: title + gold subtitle + gold tagline (no photo — on cream) |
| `CategoryMosaic` (+ css) | «دسته بندی محصولات» heading w/ marks + the 5-row tile grid (featured / pair / wide / pair / wide), props-driven |
| `BrandDivider` | **reused** from `components/bedroom-furniture/` (zhic wordmark) |
| `GoldArrow` | **reused** from `@zhic/ui` |

Seed: `apps/web/src/lib/bedroom-furniture-mosaic.ts` (`getBedroomFurnitureMosaicContent()` → hero copy
+ ordered tile rows). Preview: `apps/web/src/app/lab/bedroom-furniture-mosaic/page.tsx`.

Kashida/diacritics preserved in display glyphs («مُبلمان», «کُمـــد», «دِراور»), plain words in
`aria-label`.
</content>
</invoke>
