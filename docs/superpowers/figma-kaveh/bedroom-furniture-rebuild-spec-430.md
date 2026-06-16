# /bedroom-furniture — Figma rebuild spec (frame `191:207`, @430)

Source: desktop Figma **local Dev Mode MCP**, frame `191:207` "/bedroom-furniture", 430×2680.
Font: **Ayandeh** (Black / Bold / Regular / Light). All values are the exact Figma node values.

**Scope = page BODY only.** The header (y0–55) and the consultation-CTA + footer
(y2160–2680) in the frame are the existing **global** `SiteHeader` / `SiteFooter`
(`(site)/layout.tsx`) and are reused unchanged. Decisions (2026-06-15): reuse global
chrome; 4 room cards exact-static (wire to CMS later); new primitives → `packages/ui`,
page composition → `apps/web/src/components/bedroom-furniture/`, tokens → `tokens.css`/`theme.css`.

## Media (raw fetched from local MCP → optimized → `apps/web/public/bedroom-furniture/`)
| file | dims | from node | role |
|---|---|---|---|
| `hero.jpg` | 1600×753 | 191:208 | hero photo |
| `arch-bed.jpg` | 450×640 | 191:305 | center arch (تخت خواب) |
| `arch-nightstand.jpg` | 450×640 | 191:297 | left arch (پا تختی) |
| `arch-desk.jpg` | 450×640 | 191:301 | right arch (میز تحریر) |
| `room-adult.jpg` | 1000×562 | 191:213 | بزرگسال |
| `room-teen.jpg` | 1000×562 | 191:214 | نوجوان |
| `room-infant.jpg` | 1000×716 | 191:215 | نوزاد |
| `room-bunk.jpg` | 1000×562 | 191:216 | دو طبقه |
| `zhic-wordmark.png` | 240×69 | 191:295 | showcase wordmark |
| dots / arrow | — | 191:308 / 191:289 | inline SVG, gold `#C2986B` |

## Zones (exact specs)

### Breadcrumb — y85
`< خانه > مبلمان اتاق خواب` (191:232). Use existing `Breadcrumbs`.

### Hero — y123–457 (full-bleed photo, white overlay text, right-aligned)
- Photo `hero.jpg`, object-cover, zoomed (≈165% width, panned left ~-48%).
- Overlay (191:208): `rgba(0,0,0,0.73)` flat scrim **+** `linear-gradient(transparent 68% → rgba(194,152,107,0.72) 98%)` caramel bottom-fade.
- h1 (191:233): Ayandeh **Black** 41.55px, white, right, tracking −0.83px, 2 lines «مُبلمان» / «اتاق خواب», lh 1.4.
- subtitle (191:235): Ayandeh **Bold** 16.94px white right — «از تخت خواب تا آینه و میز آرایش».
- tagline (191:239): Ayandeh **Regular** 13.55px white right — «همه چیز با طراحی منظم و کیفیت ساخت بالا».
- CTA «مشاهده» (191:237): Ayandeh **Light** 16.94px white right, gold chevrons either side (191:240–243).

### Showcase «دسته بندی محصولات» — y421–1147 (coverflow carousel)
- Card (191:217): bg `#fbf3e8`, radius **13.55px**.
- Header: `zhic-wordmark.png` centered (191:295) between two hairlines (191:293/294).
- Heading (191:234): Ayandeh **Bold** 21.9px, color `#2e3b2f`, center.
- 3 arched thumbnails, top radius **40.65px**:
  - center تخت خواب (191:305, `arch-bed`) — full opacity, featured (~145×240).
  - left پا تختی (191:297, `arch-nightstand`) — opacity **0.70** (~97×160).
  - right میز تحریر (191:301, `arch-desk`) — opacity **0.60** (~101×160).
- Label pills (radius 13.55, shadow `0 2.71px 1.63px .45px rgba(0,0,0,.35)`):
  - center 191:306 `#2e3b2f` solid → «تخت خواب» (191:307) Bold 23.26px white.
  - left 191:298 `rgba(46,59,47,.7)` → «پا تختی» (191:299) Bold 18.5px white.
  - right 191:302 `rgba(46,59,47,.6)` → «میز تحریر» (191:303) Bold 18.5px white.
- Dots (191:308–310): 3 × gold `#C2986B` @ 50% (active state solid).
- Drag hint (191:238): Ayandeh **Light** 11.07px `#101010` center — «به چپ و راست بکشید».
- Lorem card (191:311): border `#c2986b` 1.13px, radius 13.55, shadow `0 .9px .9px rgba(0,0,0,.25)` → lorem (191:236) Ayandeh Regular 16.94px black center.

### Category grid — y1180–2130 (4 rows, 243px vertical pitch)
Row = card 408×221 radius 13.55 (solid color) · photo 256×221 radius 13.55 on the **left** (object-cover, panned) · right: two-line label (small «اتاق» + large room word, white center) + «مشاهده ←» (Light 13.55 white + gold arrow). Progressive darkening green ramp:
| row | bg | photo | «اتاق …» |
|---|---|---|---|
| 1 (191:209) | `#667967` | room-adult | بزرگسال (191:316, Black 23.26) |
| 2 (191:210) | `#4a5a4b` | room-teen | نوجوان (191:317) |
| 3 (191:211) | `#2e3b2f` | room-infant | نوزاد (191:318) |
| 4 (191:212) | `#1f2a20` | room-bunk | دو طبقه (191:319) |
«اتاق» labels (191:320–323): Ayandeh Regular 20.3px white center.

## New design tokens (→ tokens.css + theme.css)
- `--color-sage: #667967`, `--color-sage-deep: #4a5a4b` (forest-dark `#2e3b2f` ≈ existing `--color-forest-dark #2D3A2E`; darkest `--color-forest-night: #1f2a20`).
- `--radius-card: 13.55px` (≈14), arch top radius 40.65px.
- Gold: design uses `#C2986B` (borders/dots/arrows) vs token `--color-gold #C49A6C` — near-identical; reuse token.

## Components
**packages/ui (reusable):** `GoldArrow` (inline SVG glyph), `DotsIndicator`.
**apps/web/src/components/bedroom-furniture/:** `BedroomHero`, `CategoryShowcase` (coverflow + lorem), `RoomCategoryGrid` + `RoomCategoryRow`. CSS modules + tokens, per house style.

> Kashida note: labels render stretched in Figma (e.g. «بزرگــســــال») via tatweel — rebuild uses the plain word with letter-spacing (kashida is a presentation hack, not content).
