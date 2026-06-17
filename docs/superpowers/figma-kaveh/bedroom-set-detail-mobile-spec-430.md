# /bedroom-set/[occupancy]/[design] — MEASURED mobile spec @ 430px

Ground truth, measured live at a **true 430 CSS-px viewport** (via a same-origin 430-wide
iframe inside Claude-in-Chrome — the MCP window itself was stuck at 215px) on
`http://80.240.31.146:3000/bedroom-set/teen/iron` (age=`teen`, series=`iron`). Route =
`[slug]/[series]/page.tsx` → `SeriesHub` (`DesignHero` + `DesignStory` + `DesignMoodboard`
+ `ProductGrid`). Page title «آیرون — ژیک». Total document height **3266px**.

Built as one faithful 430-wide frame in the **Zhic — Journal** Figma file
(`8Yqk8UxQ8JNrhcpcrKlcqJ`, Page 1), same standard as the existing frames: Vazirmatn (operator
Ayandeh-ifies), cream «تصویر» placeholders (media sanctions-blocked). Header pill, breadcrumb,
Consultation-CTA card and Footer are **identical global chrome** → cloned from the journal frame
`39:2` (nodes `40:2`/`41:2`/`50:2`/`51:2`).

Colors (live computed, exact): forest `#5F7760` · ink/charcoal `#2C2825` · stone `#8C8279` ·
forest-dark `#2D3A2E` · ivory `#FAFAF7` (page bg) · sand `#E8E0D8` · CTA muted-forest `#657767`.
Live font is real **Ayandeh**; build in Vazirmatn (Light/Regular/Bold/Black only).

## Layer A — STAGE (top → product grid)

- **Header pill** (global, cloned) — x11 y8, **407×44**, bg `rgba(250,250,247,.7)`, 1px border
  `rgba(232,224,216,.55)`, pill radius. Search icon (start/left x≈33), logo «ژیک» (center), menu
  «منو» (end/right x≈357). 48×48 hit areas.
- **Breadcrumb** (cloned, retitled): `<ol>` x16 **y76** w398 h24, stone `#8C8279` **14/23.8**.
  Items: «خانه» › «سرویس خواب» › «آیرون» (current). Separator «›» 4px, stone @ ~60%.
- **Hero** section y100→1004 (h904), centered, gap 64, pt 76, **pb 256** (large whitespace —
  faithful to live `pb-12` under the repo's inflated spacing scale).
  - **Cover** (heroMedia) x0 **y176**, **430×430** square (live `bedroom-set-iron.webp`, 2700²,
    object-cover, max-w 720). → cream «تصویر طرح» placeholder, full-bleed.
  - **Eyebrow** «طرح» **y670**, forest `#5F7760`, **12px / 700**, tracking **1.44px**, centered.
  - **H1** «آیرون» **y700**, ink `#2C2825`, **40px / 900** (`text-h1`), centered, h48. *No tagline.*

## Layer B — COLLECTION «مجموعه»  y1004→2474 (h1470), pb 64

- **Eyebrow** «مجموعه» **y1004**, forest `#5F7760` **12/700**, tracking 1.44px, mb 24.
- **Age-group row** **y1046** h38, gap 8, mb 32 (RTL, right→left):
  - Label «گروه سنی:» (x≈359) stone `#8C8279` **12/700**.
  - Badge **«نوجوان»** *(emphasized — visitor's age)*: forest-dark `#2D3A2E` bg, ivory `#FAFAF7`
    text, **14/700**, pill radius, pad 6/16, ~78×36.
  - Badge **«دونفره»** *(other occupancy)*: transparent bg, 1px sand `#E8E0D8` border, charcoal
    `#2C2825` **14/500**, pill radius, pad 6/16, ~74×38.
- **Product grid** x16 **y1116** w398 — **2 cols × 187px, col-gap 24, row-gap 24, 8 cards**.
  - **Card** 187×306. **Cover** 187×234 (**aspect 4:5**), **top-right corner radius 28px**, cream
    «تصویر» placeholder. **Name** 16/700 charcoal `#2C2825` (start-aligned, ~15px under cover).
    **Price** 14px stone, Persian digits + «٬» separators + « تومان» (~10px under name).
  - Rows (top Y) & products (RTL: Right col, then Left col):
    | Row | y | Right card | Left card |
    |---|---|---|---|
    | 1 | 1116 | کمد آیرون — ۵۶٬۷۲۹٬۰۰۰ تومان | آینه دیواری آیرون — ۱۰٬۹۳۲٬۰۰۰ تومان |
    | 2 | 1445 | میز تحریر آیرون — ۵۵٬۳۴۱٬۰۰۰ تومان | آینه قدی آیرون — ۳۰٬۵۸۲٬۰۰۰ تومان |
    | 3 | 1775 | پاتختی آیرون — ۱۸٬۳۷۲٬۰۰۰ تومان | فایل آیرون — ۵۷٬۳۹۹٬۰۰۰ تومان |
    | 4 | 2104 | تخت آیرون — ۶۰٬۰۹۸٬۰۰۰ تومان | کتابخانه آیرون — ۲۲٬۳۳۲٬۰۰۰ تومان |

## Layer C — global footer chrome (cloned from journal `39:2`)

- **Consultation-CTA band** y2474→2780; **card** x16 **y2522** **398×210** (glassy forest). «زیبایی»
  (muted-forest `#657767` ~35px) · «از یک انتخاب ساده آغاز می‌شود» · eyebrow «مشاوره تخصصی برای
  خرید سرویس خواب مناسب» · button «دریافت مشاوره رایگان» (ivory text). Identical to journal `50:2`.
- **Footer** x0 **y2780** **430×486**, forest-dark `#2D3A2E`. 3 cols (فروشگاه / برند / ارتباط با ما)
  + logo + brandline + tagline + since + dashes + pitch + copy. Identical to journal `51:2`.

**DesignStory & DesignMoodboard render nothing** for `iron` (no `storyBlocks`, gallery < 2) —
`<main>` has exactly 3 children: breadcrumb wrap, hero, collection. Footer is NOT hidden on
detail routes (unlike the `/bedroom-set` index).
