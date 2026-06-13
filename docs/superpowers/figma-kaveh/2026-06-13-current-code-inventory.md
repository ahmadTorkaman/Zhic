# Current-Code Inventory — Homepage (live side of the Kaveh Figma diff)

**Date:** 2026-06-13
**Branch:** `feat/figma-homepage-alignment`
**Method:** 8-agent parallel read of the actual components + CSS (no Figma calls). This is the **"as-built" half** of the diff. The **"design truth" half** is the operator-supplied export of the **Kaveh** frame in Figma file `QLrD4LolUKzSsciGxslrBv`.
**Render order (`apps/web/src/app/(site)/page.tsx`):** Header → Hero → Age bands → Stats/About → Journal → Showrooms → Consultation CTA → Footer.

> Persian copy below is byte-exact incl. ZWNJ (U+200C). When the Kaveh export lands, diff each section against this.

---

## 0. Foundation tokens (`packages/design-system`)

- **Three sync'd sources:** `src/tokens/*.ts` (TS), `css/tokens.css` (`:root` vars — superset), `css/theme.css` (Tailwind `@theme`, literal-duplicated). Drift between them is silent.
- **Two parallel type systems:** canonical TS scale (`display/h1..h4/lead/body/small/eyebrow`) **and** a homepage ramp `--home-t1..t7` + `--text-display*/--text-section`. **The homepage uses the `--home-t*` ramp**, not the TS display/h1 scale.
- **Gray-text direction (operator decision 2026-06-13):** homepage text is muted gray — `--color-gray-soft #737373`, `--color-gray-mid #525252`, `--color-gray-strong #262626` — with **forest reserved for accent bars only**. (These grays are CSS-only; absent from TS.)
- **Palette (13):** ivory `#FAFAF7` · cream `#F5F0EB` · sand `#E8E0D8` · stone `#8C8279` · charcoal `#2C2825` · ink `#14110F` · accent `#B8A898` (TS-only orphan) · gold `#C49A6C` · rust `#8B4A2B` · forest `#5F7760` · forest-dark `#2D3A2E` · overlay `rgba(20,17,15,.6)` · divider-ink `rgba(20,17,15,.08)`.
- **Homepage type ramp:** t1 ~40–94 (hero/زیبایی) · t2 ~36–78 (about heading) · t3 ~32–62 (band/section titles) · t4 ~22–46 (CTAs) · t5 ~18–36 (مشاهده/labels/about body) · t6 ~16–31 (eyebrows/subs/lead) · t7 ~14–20 (journal card titles). All `clamp()`-fluid.
- **Spacing (8pt, non-linear):** 1=4 2=8 3=12 4=16 5=24 6=32 7=48 8=64 9=96 10=128 11=192 12=256. **Radius:** md=4 lg=8 pill=999 (none/sm omitted from CSS). **Container storefront 1440px.** `--header-height` 60px desktop / 52px ≤767px.
- **Glass recipes:** `.glass-card` (ivory@60, blur24), `.glass-card-dark`, `.glass-gold` (gold@50, blur4 sat1.45), `.float-card` (boundary, ivory@42, blur4 sat1.45, radius-md, elevated shadow), `.site-header-chrome` (ivory@70, blur64 sat1.4).
- **Notable drift/orphans:** `color.accent` dead; CSS font fallback Tahoma vs TS ui-sans-serif; caramel placeholder gradient uses 3 off-palette browns (`#d8c4a3/#8b6f47/#3e2f1f`); glass highlight/sheen use pure white.

---

## 1. Header / Nav (`SiteHeader.tsx`)

- **Layout:** `grid-cols-[1fr_auto_1fr]`, nav centered. RTL: col1=visual-right, col3=visual-left.
- **Mobile (<768):** floating **rounded-full pill**, top 8px / inset-x 12px, **44px** tall, full 1px border. `[hamburger | centered logo 18px | search]`.
- **Desktop (≥768):** full-width square bar, top 0, **60px** tall, bottom-border only. `[logo 20px | centered nav | search]`.
- **Nav links (verbatim):** `ژورنال` · `شعب ژیک` · `درباره ما` · `تماس با ما`. (محصولات is split into `SetsMegaMenu` + `PiecesMegaMenu`, rendered first.) Nav text `text-small` (14px), color **stone**, gap 48px. Active = bold + charcoal + 1.5px **forest** underline.
- **Icons:** hamburger (16px), single search button (28→32px, stone→ink hover). **No cart/account.** Search is a non-wired placeholder (TODO).
- **Glass:** `--glass-bg-chrome` ivory@70, blur **64px**, sat 1.4, shadow-subtle, border `rgba(232,224,216,0.55)` (hardcoded).
- ⚠️ **No scroll/transparent→glass transition** — header is permanently `fixed` with always-on heavy-blur glass (the scroll toggle was removed; `.site-header-chrome` "scrolled" comments are stale). **If Kaveh shows a transparent hero header that turns glass on scroll, code does NOT implement it.**
- Logo: static `<img src=/zhic-logo.svg>`, hover opacity 0.80.

## 2. Hero (`HomeHeroCarousel.tsx`)

- **Layout: STACKED single column** (media `order:1` top, text `order:2` bottom) at **all** widths — NOT a side-by-side split, NOT text-over-image. **No scrim/overlay** (text sits on ivory below the photo).
- **Heading (verbatim):** `خواب خوب،تمام ماجــــــراست` — split on the Persian comma «،»; comma rendered as `.zh-hhc__comma` in **gold**. Heading color **forest** `#5F7760`, weight **900**, size `--home-t1` (40→94px), line-height **1.45**, letter-spacing **-0.02em**, centered.
- **No subheading / no eyebrow** rendered (props exist but are dead).
- **CTA:** single full-width dark bar button, label `مشاهده‌ی محصولات`, bg `--color-gray-strong #262626` (overrides Button charcoal), text ivory, radius `rounded-md`, padding 1.15rem/2rem; links `/bedroom-set`.
- **Media:** mobile `aspect 3/4` + top-right-radius **96px**; desktop `aspect 16/9` + top-right-radius **140px**. Swipeable carousel (dots only if >1 slide; autoplay 5s; honors reduced-motion). Inactive dot uses hardcoded `rgba(140,130,121,0.5)`.
- TODO comment: "confirm intended desktop hero height."

## 3. Age category blocks (`HomeRoomsTiles.tsx`)

- **Layout: full-bleed editorial bands, alternating sides** (already rebuilt to the Page-2 model). Mobile = column (image above text); ≥768 = `flex-row` 50/50 with `:nth-child(even){row-reverse}`. Bands wrapper max-width 1440px.
- **Static copy (verbatim, repeated every band):** eyebrow `دسته‌ی سنی` (color **ink**, t6, 700), CTA `مشاهده` + left chevron (color **forest**, t5, 700). Section aria-label `دسته‌بندی سنی`.
- **Per-band title/subtitle are CMS-driven** (`fetchRooms` → name/tagline), NOT in the component. Title `--home-t3` (32–62), ink; subtitle t6/300, stone, max 32ch. **→ Diff per-band copy against CMS/seed, not this file.**
- **Accent bar (`.zh-rooms__bar`, Figma "Vector 5"):** forest@88% via color-mix, width `clamp(150px,22vw,280px)`, height 0.62em, tapered clip-path, sits behind the eyebrow.
- **Media:** `aspect 5/3`, top-right-radius 48px (28px !important on mobile), parallax + hover scale 1.02. Whole band is one `<Link>` → `/bedroom-set/{occupancy}` (kid→baby, teen→teen, adult→double).

## 4. Stats + About dark band (`HomeBrandStatement.tsx` + `StatBlock.tsx`)

- **Band bg:** `--color-forest-dark #2D3A2E`, text ivory. No overflow-hidden, no bottom padding (so float cards straddle both edges).
- **Floating glass stats card** straddles the **top** seam (`.float-card .stat-row`, 3-up grid, boundary glass). Bottom **gold-glass CTA** `بیش‌تر درباره‌ی ما` → `/about` straddles the bottom seam.
- **Stats (verbatim, hardcoded `DEFAULT_STATS`):**
  - `25` `+` — `سال تجربه در صنایع چوب`
  - `570430` `+` — `قطعه مبلمان تولیدشده`
  - `22` (no suffix) — `شعبه در سراسر ایران`
  - Values via `<CountUp>`. **Stat numerals are small (text-lead 20 → md:text-h4 24px)** despite the tokens.css comment implying t3.
- ⚠️ **Dividers are INK** (`--color-divider-ink` rgba(20,17,15,.08)), **not gold.**
- **About:** eyebrow `درباره‌ی ژیک` (gold, t6, 700); heading `از همدان، برای ایران` (ivory, t2, 900). **Default renders 3 paragraphs** (Figma 212:85) unless a CMS `statement` is passed (then 1 RichText block at 16px — a parity gap). Body color sand, line-height 1.85.
  - P1: `ژیک از همدان آغاز شده است؛ از کارگاهی که در آن چوب گردو، کتان بلژیکی و دستانِ صبورِ استادکاران، یک قطعه مبلمان را می‌سازند که می‌ماند.`
  - P2: `ما باور داریم اتاق خواب، آرام‌ترین و شخصی‌ترین جای خانه است. هر قطعه‌ای که می‌سازیم، برای همان لحظه‌ی صبح‌ زود است که نور آرام از میان پرده عبور می‌کند.`
  - P3: `از طراحی تا تحویل، به جزئیات وفاداریم. نه بیش‌تر از آنچه لازم است می‌سازیم، نه کم‌تر از آنچه شایسته است.`

## 5. Journal (`HomeJournalRows.tsx`)

- **Layout: unbounded horizontal parallax rows** — exactly **3 rows** (round-robin `i%3`), cards-per-row unbounded; NOT a static 3×3 grid. Row speeds `{0.35, -0.55, 0.75}`, clamp 300px desktop / 240px phone, reduced-motion safe.
- **Copy (verbatim defaults):** eyebrow `ژورنال ژیک` (forest, t6, 700); heading `از کارگاه، از همدان` (ink, t3, 900); lead `یادداشت‌هایی از پشت‌صحنه‌ی ساخت، انتخاب چوب، و طرح‌هایی که از سنت بلند ایران الهام گرفته‌اند.` (stone, t6/400, lh 1.57). Bottom CTA `همه‌ی مقالات` + left arrow → `/journal` (gold text + gold@45% underline).
- **Cards:** `300px` desktop / `170px` mobile (hardcoded); cover `aspect 16/9` (⚠️ mockup said 3:2), top-right-radius 20px, bottom scrim. Category (forest, **hardcoded 10px**, uppercase no-op for Persian) + title (t7, ink, 2-line clamp) sit **below** the cover, not overlaid. Card text is dynamic (article data).

## 6. Showrooms (`HomeShowroomsTeaser.tsx`)

- **Copy (verbatim):** eyebrow `نمایندگی‌ها` (forest, t6, 700); heading `ما را در شهر خودتان ببینید` (ink, t3, 900); expand toggle `فهرست کامل` ↔ `نمایش کمتر` (ink/forest, t4, 700, plain text — no bar/border). Section aria-label `شعب`. Card alt `شعبه‌ی {city}`.
- **Layout: strict 3-up at every width** (CEO directive). First row = `slice(0,3)`; rest hidden in a `grid-rows 0fr→1fr` curtain (0.8s), kept in DOM (`inert`+`aria-hidden`).
- **Cards:** `aspect 3/4`, base radius 4px + asymmetric **36px** corner motif (`:nth-child(3n+1)` top-right, `:nth-child(3n)`/`:last` bottom-left). City label overlaid bottom (ivory, 900, hardcoded clamp). Scrim `rgba(20,17,15,0.38)`. Hover lift -3px.
- **Dividers:** top **dotted forest** line (full-bleed, 4px, radial-dot bg); bottom **forest SVG ribbon** (Vector 6, viewBox 0 0 383 17, fill-opacity 0.88) at the seam into the consultation section.
- **Cities are CMS-driven** (`fetchAllShowrooms`, central first). `arak` card has a `scale(1.12)` content hack.

## 7. Consultation CTA + Footer (`SiteFooter.tsx`)

**Consultation CTA (`.zh-foot-cta`):**
- **Straddle band:** `linear-gradient(to bottom, ivory 50%, forest-dark 50%)` hard split; equal `--space-7` padding centers the card on the ivory→footer seam.
- **Card:** asymmetric radius `4px 28px 4px 28px`, bg cream + `consult-card.webp` vase photo (CSS background, position left center → vase visual-left, text right), min-height 260px, `::before` cream scrim (heavier on mobile).
- **Copy (verbatim):** heading `زیبایی` (**forest** `#5F7760`, t1, 900); sub `از یک انتخاب ساده آغاز می‌شود` (**forest**, t5→body mobile, 700); eyebrow `مشاوره تخصصی برای خرید سرویس خواب مناسب` (charcoal, small, 500); button `دریافت مشاوره رایگان` (gold bg / ivory text, hover hardcoded `#b08c5e`) → opens consult Modal.
- ⚠️ **Intra-code inconsistency:** «زیبایی» uses **forest** here (comment "reverted to forest 2026-06-13"), but the global tokens.css comment says «زیبایی» should be `--color-gray-soft`. Resolve against Kaveh.

**Footer (`.zh-foot`, bg forest-dark):**
- Brand: `zhic-logo-footer.svg` (34px) + tagline `ساخته شده برای ماندن` (sand, letter-spacing 0.35em) flanked by gold dashes.
- **3 columns (never collapse on mobile):**
  - Col1 `ارتباط با ما` — socials (`اینستاگرام/تلگرام/واتس‌اپ/آپارات/یوتیوب/لینکدین/پینترست`) via `SocialIcon` + optional `تلفن` + `خبرنامه`. ⚠️ Socials only render if `siteConfig.socials` is set; default shows only `خبرنامه`. SocialIcon glyphs only cover instagram/telegram/whatsapp/aparat (others = plain circle).
  - Col2 `برند`: `درباره ما` · `سوالات متداول` · `مجله`.
  - Col3 `فروشگاه`: `سرویس خواب` · `تخت خواب` · `کمد و دراور` · `اکسسوری`.
  - Headings gold/14/700; links sand/14/300.
- **Legal:** `SINCE 2008` (gold bar) · pitch `طراحی‌شده برای آرامش روزهای شما.` · `© شرکت هنر چوب ژیک، تمامی حقوق محفوظ است` + `حریم خصوصی` · `شرایط استفاده` (sep `·`).
- Footer is hidden on `/bedroom-set`.

---

## Content-decision flags (where "match exactly" needs operator confirmation, not pixels)

These were the "NEEDS OPERATOR" items in the 2026-06-13 spec; current code shows where it landed:

| Item | Current code | Notes |
|---|---|---|
| Stat #2 value | `570430+` | Old Figma showed `+1200`. Real production number is product truth — don't blindly match Figma. |
| Stat #3 | `22` `شعبه در سراسر ایران` | Old Figma `3 شوروم`. شعبه/شوروم wording + count couple together. |
| Hero headline | `خواب خوب،تمام ماجــــــراست` | Matches Figma direction (gold comma). |
| About | 3-paragraph (rendered default) | Matches Figma 3-para. |
| Journal heading | `از کارگاه، از همدان` | Old Figma `از کارخانه…`; "کارگاه" kept as brand voice. |
| «زیبایی» color | forest | Conflicts with the gray-text token comment; confirm against Kaveh. |
| Showroom cities | CMS (real) | Old Figma illustrative همدان/اراک/ساری. |

**Next step:** diff each of sections 1–7 against the Kaveh export, section by section, producing a prioritized fix list (token-respecting, no hardcoded 1920px). Content-conflict rows above get surfaced for your decision rather than auto-overwritten.
