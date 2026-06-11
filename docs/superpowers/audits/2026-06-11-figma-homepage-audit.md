# Figma reference vs live homepage — audit (2026-06-11)

Figma file: `QLrD4LolUKzSsciGxslrBv` ("zhic wood .com"), last modified 2026-06-11.
Reference frame: `1:3` (desktop homepage, 1920×20492). Compared against live homepage
(localhost:3000 prod build, full-page 1920×5545).

The Figma file is the designer's source of truth ("dont change desing" annotations on canvas).
It follows the SAME content order as the live page (hero → headline → age categories → stats →
brand story → journal → dealers → consultation CTA → footer) but with a much more immersive,
full-bleed treatment: the reference page is ~3.7× taller than the live one.

## Section-by-section differences

### 1. Header
- **Figma:** floating ivory pill/capsule header — search icon (left), centered «ژیک» logo, hamburger (right). No nav links, no wishlist heart.
- **Live:** full-width bar — logo right, 6 nav items (سرویس خواب، مبلمان اتاق خواب، ژورنال، شعب ژیک، درباره ما، تماس با ما), heart + search left.
- **Decision needed:** the Figma header drops the entire mega-menu nav. Likely a designer simplification (mobile-style); confirm before destroying established nav/megamenu work.

### 2. Hero
- **Figma:** full-bleed bedroom photo directly under the floating header, with a large rounded top corner; image runs ~2550px tall and flows into the parquet-floor shot.
- **Live:** Option C split hero — image collage left (~40%), ivory text column right with H1 + button inside it.
- This is the single biggest structural divergence.

### 3. Headline + products CTA
- **Figma:** giant 3-line display headline «خواب خوب، تمام ماجــــراست» in forest green with kashida stretch (≈390px text block), caramel comma accent, followed by a FULL-WIDTH dark bar button «مشاهده‌ی محصولات» (~268px tall).
- **Live:** same copy but small (~60px) single-line H1 inside the hero column + small dark button.

### 4. Age-category sections
- **Figma:** 3 stacked full-width editorial sections (~1970px each): full-bleed photo → dark chip eyebrow «دسته سنی» → huge title → one-line description → underlined «مشاهده» link.
- **Live:** one compact row of 3 cards (بزرگسال / کودک / نوجوان) with eyebrow «دسته‌ی سنی», small titles, no per-category «مشاهده» link.
- Copy matches between both (same descriptions).
- **Design bug to report back:** Figma's FIRST section is titled «اتاق کودک» but carries the بزرگسال copy («سرویس‌های هماهنگ از گردوی ایرانی…») and an adult-bedroom photo. Live correctly says «اتاق بزرگسال».

### 5. Stats band
- **Figma:** dark band at top of the dark story section, white text, separated by vertical rules: «+25 سال تجربه» / «+1200 قطعه مبلمان تولید شده» / «3 شوروم در سراسر ایران».
- **Live:** light glass pill band overlapping the dark section, dark text, Persian digits: «+۲۵» / «+۵۷۰٬۴۳۰» / «۲۲».
- **Content conflict (CEO question):** 1200 vs 570,430 pieces; 3 vs 22 showrooms. Also digit style (latin in design, Persian live) and band treatment differ.

### 6. Brand story («از همدان، برای ایران»)
- **Figma:** dark green section with factory blueprint illustration background, caramel eyebrow «درباره‌ی ژیک», big white title, fully readable white paragraph, caramel button «بیشتر درباره‌ی ما».
- **Live:** same content/eyebrow/title/button but flat dark background (no blueprint illustration) and the paragraph renders in low-contrast grey-green.
- A red designer scribble sits next to this title in Figma — flagged area.

### 7. Journal
- **Figma:** eyebrow «ژورنال ژیک» + title **«از کارخانه، از همدان»** + subtitle («یادداشت‌هایی از پشت صحنه‌ی ساخت…») + uniform 3×3 grid of light cards (image top, eyebrow + title below) + «همه‌ی مقالات» link with caramel underline/arrow asset.
- **Live:** title says **«از کارگاه، از همدان»** (کارگاه vs کارخانه — wording diff), no subtitle visible, denser 4-column grid (~16 cards) straddling the dark/light boundary with dark-tinted cards in the first row, and **no «همه‌ی مقالات» link** (confirmed absent in DOM).

### 8. Dealers («ما را در شهر خودتان ببینید»)
- **Figma:** title + 3 illustrated city cards — همدان، اراک، **ساری** — plus a city-name marquee row and «فهرست کامل» bar. ~20 extra city cards/names (مشهد، گرگان، بابلسر، تبریز، اصفهان، یزد…) are prepared loose on the canvas → intent is a scrolling/carousel set, 3 visible.
- **Live:** 3 static cards — همدان، اراک، **بوکان** — + «فهرست کامل» bar. No marquee.
- Red designer scribble under «فهرست کامل» in Figma.

### 9. Consultation CTA («زیبایی…»)
- **Figma:** beige panel, vase photo LEFT, text block RIGHT-aligned (RTL-correct): caramel «زیبایی» + dark «از یک انتخاب ساده آغاز می‌شود» + sub + caramel button.
- **Live:** **mirrored/broken** — the text block and button sit on the LEFT, overlapping the vase photo; right half of the panel is empty.

### 10. Footer
- **Figma:** large «ژیک» logo + letter-spaced «ساخــته شــده بــرای مــاندن», columns RTL order: فروشگاه (right) / برند / ارتباط با ما (left); ارتباط با ما = اینستاگرام، تلگرام، تلفن only.
- **Live:** same structure but **column order mirrored** (ارتباط با ما on the right, فروشگاه left), smaller logo/tagline, extra items واتس‌اپ + خبرنامه, and an extra bottom row (حریم خصوصی / شرایط استفاده). Extra items are probably legitimate functionality — confirm with designer.

## Other canvas content (not audited in depth)
- Frame `5:296` "iPhone 17 - 1" (1904×12300): mobile screens for a **series/bedroom-set page** (PARLA, swipe carousel «به چپ و راست بکشید») — a different page, not the homepage.
- `175:2` is a screenshot of the live site (80.240.31.146:3000, 2026-06-08) with ~40 red vector marks — the designer's own markup of the live site. Worth reviewing in Figma for their explicit complaints.
- Group `5:326` "navigator" (1294×372) — nav component design.

## Artifacts
- Crops/screenshots from this audit: `/tmp/zhic-audit/` (figsec-*.png = Figma sections, livesec-*/l-*.png = live).
- Figma REST recipe + token: see memory `reference_zhic_figma_rest_api`.
