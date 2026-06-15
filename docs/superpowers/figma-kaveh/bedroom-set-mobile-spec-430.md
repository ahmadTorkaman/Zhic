# /bedroom-set — MEASURED mobile spec @ 430px (iPhone 14 Pro Max)

Ground truth, measured live at 430×932 (dpr3) via Claude-in-Chrome on
`http://80.240.31.146:3000/bedroom-set`, cross-checked against
`apps/web/src/components/bedroom-set/bedroom-set.css` (the design source of truth).
Page = **"طرح‌ها"**, an interactive design gallery (`BedroomSetLanding`): a swipeable
**DesignCarousel** stage, a **FeaturedOverlay**, and a **WritingSection**. Heavily
image-driven; all media are .webp that load live but CANNOT be uploaded to Figma (sanctions) →
**cream «تصویر» placeholders** in Figma. Build 3 static frames (operator chose "faithful key screens").

Tokens reused from [[journal-mobile-spec-430.md]]: ivory `#FAFAF7`, charcoal `#2C2825`,
stone `#8C8279`, sand `#E8E0D8`, forest `#5F7760`, gold `#C49A6C`. New literals:
tab bg `#F4F1ED`, tab active `#ECE5DA`, glass band `rgba(12,9,7,.32)`.
Font Vazirmatn (build) → operator Ayandeh-ifies. Only Light/Regular/Bold/Black weights.

The 10 designs: لوتوس · پارلا · کارولین · آیرون · ژاکلین · لوکاپلاس · لوف · بلک‌اند‌وایت · ورنا · مونته
(carousel renders 9 at a time). Room-type tabs per design's occupancies, canonical order
baby→teen→double→bunk, **kashida-stretched** labels: نـــــوزاد · نـــــوجوان · دونـــــفره · دوطـــــبقه.

## Screen 1 — STAGE (carousel)  430×932, bg ivory
- **Header pill** (global frosted) — reuse, y8 h44.
- **Dots**: y80, centered (container x145 w140), **9 dots**, gap8; active **20×7 charcoal**, rest **7×7 sand** (radius pill). Active = focused design.
- **Focused card**: x45 y267, **341×485** (card-h 52vh, card-w = h×0.703), image `object-fit:contain`, drop-shadow `0 26px 46px rgba(20,17,15,.2)`. → cream «تصویر طرح» placeholder.
- **Glass band**: x45 y429, **341×161** (33.3% of card, vertically centered), bg `rgba(12,9,7,.32)` + blur, 1px `rgba(255,255,255,.08)` border, soft shadow.
- **Name-mark** (inside band): x55 y432, 320×155 — the design's logo image → placeholder = the **design name** as styled text (e.g. «لوتوس»).
- **Carousel fan** (left peeks): neighbor at op .66 scaled (~w252) centered cx−71 (mostly off left edge); next at op .32 (~w170) cx−357 (off). Right side cards op 0 (stacked, hidden). → add 1 faded/scaled peek card clipped at the left edge.
- **Room-type tabs** (`zh-bs-cats`): y836, centered (container x114 w201), 2 tabs gap6. Each: bg `#F4F1ED` (active `#ECE5DA`), **1.5px gold `#C49A6C` border**, charcoal text **14.6px/700**, pad 9/18, `border-radius:0` EXCEPT first child **top-right 22px**, last child **bottom-left 22px**. Depicted design لوتوس → tabs نـــــوجوان (active, right/first) · دونـــــفره (left/last).
- Crumb «خانه / طرح‌ها» — hidden on mobile (skip). Subtle noise overlay (skip).

## Screen 2 — FEATURED OVERLAY  430×932, bg ivory  (fixed inset:0, slides up over stage)
- **Back button** (`zh-bs-fback`): top y24, centered x195, **40×40 circle**, 1px sand border, bg `rgba(250,250,247,.82)`, stone **down-chevron** (M6 9 L12 15 L18 9), svg 18. aria «بازگشت به طرح‌ها».
- **Headline** (`zh-bs-fhead`, rotating): «پرفروش‌ترین محصولات» — **24px/900/charcoal**, lh36, centered, y301. (page 2 title «جدیدترین محصولات».)
- **Grid** (`zh-bs-grid`): y419, 2-col gap **2px**, inset ~24:
  - **hero tile** (full width): x24 y463, **383×166** (aspect padding-bottom 43.5%), `object-fit:cover`. placeholder.
  - **2 tiles** below: x216 (right) + x24 (left), each **190×101**, y631. placeholders.
- **Page dots** (`zh-bs-fdots`): y905, centered x198, **2 dots** (2 featured pages), active 20×7 charcoal / 7×7 sand.

## Screen 3 — WRITING SECTION  430× ~600, bg ivory
- **Panel** (`zh-bs-wpanel`): x26 y84, **378×387**, border-radius **0 / 18 / 18 / 0** (right corners rounded, left square), **forest `#5F7760` gradient left border 1.5px** (solid top → fades to transparent ~92%), pad 42/21.5. Centered text:
  - **Heading** (`zh-bs-weyebrow`): «درباره‌ی این سرویس‌ها» — **24px/900/charcoal**, lh32.5, centered.
  - **Body** (`zh-bs-wbody`): «هر سرویس خواب ژیک از چوب گردوی ایرانی و با وسواس در جزئیات ساخته می‌شود؛ خطوطی آرام، رنگ‌هایی که با گذر سال‌ها همراه‌تان می‌مانند، و قطعاتی که از میز تحریر تا کتاب‌خانه کنار هم هماهنگ‌اند. این مجموعه برای آرامشی بلندمدت طراحی شده — جایی که کیفیت خواب، از کیفیت فضا آغاز می‌شود.» — **16.8px/400/stone**, lh34.4, centered.
- **Up-cue** (`zh-bs-upcue`, below panel, centered): an **up-chevron** (M6 15 L12 9 L18 15, bobbing) + label «پرفروش‌ترین محصولات» — **10px/stone**, uppercase, letter-spacing 1.4px. (opens the featured overlay.)
