# Journal `/journal` — MEASURED mobile spec @ 430px (iPhone 14 Pro Max)

Ground truth, measured live via Claude-in-Chrome DevTools device mode (430×932, DPR 3)
on `http://80.240.31.146:3000/journal`, real **Ayandeh** font. All Y are **page-absolute**
(page top = 0) → use directly as frame-relative Y. Horizontal content inset = **16px**
(`px-4`), so content runs x16→x414 (width **398**). RTL: right edge at x414.

> **Tailwind scale is overridden:** numeric utilities map to `--space-N`, NOT 0.25rem.
> So `py-8`=64, `mb-8`=64, `mt-9`=96, `gap-5`=24, `h-7`=48, `h-10`=128 (see pagination bug).

## Frame
- **430 × 6494**, bg **`#FAFAF7`** (ivory). Content inset 16px L/R.

## Design tokens (resolved)
- Space: 1=4 · 2=8 · 3=12 · 4=16 · 5=24 · 6=32 · 7=48 · 8=64 · 9=96 · 10=128
- Colors: ink `#14110F` · charcoal `#2C2825` · stone `#8C8279` · sand `#E8E0D8` · cream `#F5F0EB` · forest `#5F7760` · forest-muted `#657767` · gold `#C49A6C` · ivory/bg `#FAFAF7`
- Radius: lg=10 · md=8 · pill=999
- Type @430: h1 40 · h3 24 · lead 20 · body 16 · small 14 · eyebrow 12

## Sections (top→bottom, absolute Y)

### 1. Header — floating frosted pill  (`fixed top-2 inset-x-3`)
- Pill: x11 y8, **w407 h44**, radius pill(999), bg `#FAFAF7` @ **0.7** (frosted/blur).
- 3 cells `grid-cols-[1fr auto 1fr]`:
  - **Right** (RTL start): hamburger button «منو», ~48×48, 16px icon (3-line).
  - **Center**: ژیک **logo** (img h~30 → placeholder text «ژیک»).
  - **Left**: search button «جستجو», icon only (no cart).

### 2. Breadcrumb  @ y76, h24
- «خانه › ژورنال», all **14px**. «خانه» link stone `#8C8279`; `›` separator stone-α; «ژورنال» (current) charcoal `#2C2825`. RTL: خانه (right) › ژورنال.

### 3. Hero  (`section py-8` = 64 pad T/B; y100, h256)
- **h1** «ژورنال» — **40px / 900 / `#14110F`**, lh48, @ y164.
- **subtitle** «یادداشت‌ها، مصاحبه‌ها، و داستان‌های پشت ساخت هر قطعه — از کارگاه ما در همدان.» — **20px / 300 / `#8C8279`**, lh34, mt-3(12), @ y224 (2 lines, h68).

### 4. Category pills  @ y356, row h40, gap8, mb-7(48)
- Each: radius pill(999), pad 6/16, **16px / 700**. RTL right→left, row overflows (last clips at left edge).
- همه **(active)** bg charcoal `#2C2825`, text cream `#FAFAF7`, w65 — rightmost.
- بلاگ w65 · سبک زندگی w115 · متریال‌شناسی w131 · مراقبت و نگهداری w156 — inactive: bg cream `#F5F0EB`, text charcoal `#2C2825`.

### 5. Featured  (`grid-cols-1 gap-5`, mb-8; y444, h430) — text ABOVE image
- eyebrow «مراقبت و نگهداری» — **12 / 700 / forest `#5F7760`**, ls 0.72 (0.06em), mb6, @y444.
- h3 title «نگهداری از مبلمان چوبی: آنچه باید بدانید» — **24 / 700 / charcoal**, lh33.6, mb6, 2 lines, @y468.
- excerpt «مبلمان چوبی با مراقبت درست، نسل به نسل همراه خانواده می‌ماند. در این مقاله اصول نگهداری را می‌آموزید.» — **14 / 300 / stone**, lh23.8, mt-3, @y547.
- meta «1 دقیقه مطالعه» — **14 / 300 / stone**, mt-2, @y603.
- **cover placeholder**: cream `#F5F0EB`, **398 × 224 (16:9)**, radius **0**, @ y650. (image blocked → «تصویر» placeholder)

### 6. Divider  @ y938, h1, w398, bg sand `#E8E0D8`. (mt-7/mb-7 collapse → 48 gaps)

### 7. Grid  (`grid-cols-1 gap-5`=24; y987) — **11 cards**, pitch 387 (h363 + gap24)
Card anatomy (card0 @y987 as template; each subsequent +387):
- cover placeholder cream `#F5F0EB`, **398 × 265 (3:2)**, radius0, mb-4(16).
- eyebrow — **12 / 700 / forest UPPERCASE**, ls 0.96, mb-2(8).
- title — **16 / 700 / charcoal** (text-body), lh28, mb-1(4).
- meta «1 دقیقه مطالعه» — **14 / 300 / stone**.

11 cards (eyebrow / title):
1. سبک زندگی / طراحی اتاق خواب آرام: اصول و ایده‌ها
2. متریال‌شناسی / راهنمای انتخاب چوب مناسب برای مبلمان
3. سبک زندگی / تخت‌خوابی برای دو نسل
4. متریال‌شناسی / هندسه‌ی منبت در طراحی امروز
5. متریال‌شناسی / چرا چوب گردوی ایرانی؟
6. سبک زندگی / اتاق دوستانه برای دو فرزند
7. سبک زندگی / کمد و حافظه — درس‌هایی از سنت
8. بلاگ / روایت یک سرویس از ابتدا تا نصب
9. سبک زندگی / آرامش در نور صبحگاهی
10. مراقبت و نگهداری / پایداری چوب — انتخاب درست
11. بلاگ / کلکسیون بهار: الهام از باغ ایرانی
(all meta = «1 دقیقه مطالعه»)

### 8. Pagination  (`nav mt-9`=96; y5318) — centered, gap8
> ⚠️ **LIVE BUG:** buttons are `h-10 min-w-10` → resolve to **128px** (space-10), so the live
> page renders 128×128 squares. **Intended = 40px.** Build the intended 40px version in Figma.
- Intended each: **h40**, rounded-md(8), 16px, gap8. RTL order: قبلی(right) · ۱ · ۲ · بعدی(left).
- «قبلی» prev — chevron + text, **disabled** on page 1 → stone `#8C8279`.
- «۱» active — bg charcoal `#2C2825`, text ivory `#FAFAF7`, 40×40.
- «۲» — transparent, text charcoal, 40×40.
- «بعدی» next — chevron + text, charcoal.

### 9. Consultation CTA  (`section.zh-foot-cta` py-7=48; y5702, h306)
- **card** `zh-foot-cta__card`: x17 y5750, **w398 h210**, bg cream `#F5F0EB`, radius **25.75**.
- Content right-aligned (RTL), ~32px padding, left side empty (no illustration):
  - «زیبایی» — **35 / 900 / forest-muted `#657767`**, @y5782.
  - sub «از یک انتخاب ساده آغاز می‌شود» — **13.4 / 700 / `#657767`**, @y5845.
  - eyebrow «مشاوره تخصصی برای خرید سرویس خواب مناسب» — **8.27 / 500 / `#657767`**, @y5870.
  - button «دریافت مشاوره رایگان» — bg gold `#C49A6C`, text ivory, **13.82 / 700**, radius 6.28, pad 4.5/16, h33, @y5894.

### 10. Footer  (`footer.zh-foot`; y6008, h486, bg `#2D3A2E`, pad 32T/24B)
- **brand** (centered) y6040:
  - logo (placeholder «ژیک») h34 centered @y6040.
  - brandline «ژیک — تولیدی سرویس خواب و وسایل اتاق خواب» — **6.91 / 400 / sand `#E8E0D8`**, @y6082.
  - tagline «ساخته شده برای ماندن» — **8.27 / 400 / sand**, @y6102.
- **columns** (`grid-cols-3` centered) y6156, link rows every 36px. RTL right→left:
  - **ارتباط با ما** (right): اینستاگرام · تلگرام · واتس‌اپ · تلفن
  - **برند** (mid): درباره ما · سوالات متداول · مجله
  - **فروشگاه** (left): سرویس خواب · تخت خواب · کمد و دراور · اکسسوری
  - heading **11.3 / 700 / gold `#C49A6C`**; links **8.27 / 300 / sand `#E8E0D8`**.
- **legal** (centered) y6417:
  - «—— SINCE 2008 ——» — **8.27 / gold**, decorative 35px dashes both sides, @y6417.
  - pitch «طراحی‌شده برای آرامش روزهای شما.» — **6.29 / 300 / ivory @45%**, @y6440.
  - copy «© شرکت هنر چوب ژیک، تمامی حقوق محفوظ است · حریم خصوصی · شرایط استفاده» — **6.29 / ivory@45%**, @y6459.

## Build notes
- Font: **Vazirmatn** (Black=900, Bold=700, Medium=500, Regular=400, Light=300); operator
  Ayandeh-ifies in desktop. `textAlignHorizontal:"RIGHT"` for RTL.
- Covers: cream `#F5F0EB` placeholders (image upload sanctions-blocked).
- Tiny footer text (<9px) is the live render; operator decided literal vs floor is still open
  (see [[zhic-homepage-kaveh-alignment]] open items) — build literal here, flag for review.
- Pagination: build **intended 40px**, not the 128px live bug (flagged + code-fix task).
