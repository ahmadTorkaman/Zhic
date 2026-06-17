# /bedroom-furniture — MEASURED mobile spec @ 430px

Ground truth, measured live at a **true 430 CSS-px viewport** (same-origin 430-wide iframe inside
Claude-in-Chrome; the MCP window is stuck at 215px) on `http://80.240.31.146:3000/bedroom-furniture`.
Route = `bedroom-furniture/page.tsx` (catalog ROOT index) → cream/dark-gradient hero + `ChildCategoriesGrid`.
Title «مبلمان اتاق خواب — ژیک». **Total document height 2829px.** Global Consultation-CTA + footer
identical to the other pages (cloneable from journal `39:2`).

Colors (live computed, exact): ink `#14110F` (rgb 20,17,15 — note: DARKER than the `#2C2825` used
on detail pages) · forest `#5F7760` · stone `#8C8279` · sand `#E8E0D8` (tile border @ 55%) · cream
hero base `#F5F0EB` · white text. Font Ayandeh live → build Vazirmatn.

## Layer A — Hero (the one already-immersive section)

- **Header pill** (global) — x12 y8, 406×44.
- **Breadcrumb** «خانه › مبلمان اتاق خواب» — top-padded under the fixed pill (~y76), stone.
- **Hero** `section` — **y132, 430×476**, `margin-top 32`, base fill cream **`#F5F0EB`**, bottom
  border 1px sand. Inner padding ~py-20 (80px). **Overlay** (absolute inset-0, aria-hidden):
  `linear-gradient(180deg, transparent 35%, rgba(20,17,15,.55) 100%)`
  **+** `radial-gradient(ellipse at 30% 30%, #c9b094 0%, #6a4f30 55%, #2a1d10 100%)`
  → warm-brown vignette darkening to near-black at the bottom. All hero text is white.
  - **Eyebrow** «کاتالوگ کامل» — **y217**, white @75%, **12px / 500**, tracking **1.44px**, RTL right.
  - **H1** «مبلمان اتاق خواب» — **y252**, white, **40px / 900**, line-height 50, letter-spacing **−1.2px**.
    Single line at 430.
  - **Lead** (italic) «همه‌ی پیکربندی‌های ژیک — از تخت تا آینه — در هفت گروه با ساختار درختی…» — **y318**,
    white @85%, **16px / 400 italic**, lh 28, max-w-xl, 3 lines.
  - **Stat row** — **y450, h78**, `gap 96`, `padding-top 32`, top hairline **white @20%**. 3 cells (RTL):
    | | ۸ | ۳۶ | ۹ |
    |---|---|---|---|
    | label | گروه | دسته‌بندی | طرح |
    Numbers **24px / 900 white**; labels **10px / 400, tracking 1.8px, white @75% uppercase**.

## Layer B — Category groups  (`<main>` ends y2037)

- **Section header** — **y663**, top border 1px **sand**, mb ~28, baseline-aligned row:
  - **★ گروه‌ها** (eyebrow) — forest `#5F7760`, **10px / 700**, tracking 1.8px (rightmost).
  - **«از کجا شروع می‌کنید؟»** (h2) — ink `#14110F`, **24px / 900**, lh 32.4.
  - **«۸ گروه»** (count) — stone, **13px / 400**, `margin-inline-start:auto` (far left).
- **`ChildCategoriesGrid`** (`aria-label=زیرنوع‌ها`) — **y744**, **2 cols × 189px, gap 20, row-gap 20,
  8 cards**. Card **189×300**:
  - **Tile** (silhouette placeholder) — **189×236, aspect 4:5**, **transparent fill**, **1px sand @55%
    border**, **radius 4px**. *Currently EMPTY* — `quietCard` awaiting per-child silhouette art (code
    FU-CAT-e). This is the page's biggest visual weakness: 8 empty bordered boxes.
  - **Name** — ink `#14110F`, **16px / 700**, RTL right.
  - **Arrow** — «مشاهده ←» (or «N محصول ←» when counts exist; root page passes no counts → all «مشاهده ←»),
    stone, **12px / 400**, left.
  - 8 categories (RTL grid order): **آینه · تجهیزات مکمل تخت · تخت خواب · ذخیره‌سازی و نظم‌دهی · صندلی ·
    میز · نمایش و دکوراسیون · پاتختی** (the 7 canonical parents + the standalone `nightstand` leaf).
  - 4 rows: y744 / 1064 / 1384 / 1704; grid ends ~y2004.

## Layer C — global chrome
- **Consultation-CTA** (`zh-foot-cta`) — **y2037, 430×306** (identical to other pages).
- **Footer** (`zh-foot`) — **y2343, 430×486**, forest-dark.

**Redesign-relevant observations:** (1) the hero is already art-directed (dark brown vignette) — a
strong, different starting point from the iron detail page; (2) the category grid is the weak spot —
8 empty 4:5 outlines with tiny names + a generic «مشاهده ←»; no imagery, no product counts, no
hierarchy; (3) catalog has TWO browse axes (8 furniture **categories** here vs 9 **designs/series** on
/bedroom-set) that the root never cross-links.
