# Master Alignment Spec — Figma Page-2 (212:3) → Live Homepage

**Date:** 2026-06-13
**Source of truth:** Figma file `QLrD4LolUKzSsciGxslrBv` ("zhic wood .com"), **Page 2** frame `Refrence` (`212:3`, 1920×20492).
**Method:** 9-agent parallel extraction (8 sections + foundation) pulling precise Figma node specs (geometry, hex, type, verbatim copy) via REST, each diffed against its live React component; synthesized into this spec.
**Supersedes the homepage portion of:** `docs/superpowers/audits/2026-06-11-figma-homepage-audit.md` (that audit looked at Page-1; Page-2 is now the operator-confirmed reference).

> Page-1 of the same file is NOT the reference. Page-2's single `Refrence` frame is.

---

## 1. Executive delta

The Figma Page-2 reference is **not a tweak pass — it is a structural rebuild for one section and a content/scale realignment everywhere else.** The design *tokens* (palette, Ayandeh font, spacing, shadows, glass, motion, z-index) already match Figma almost exactly, so this is an **application gap, not a system gap.**

**Verdict by section:**
- **Full rebuild:** Age category blocks (compact tile grid → full-bleed alternating editorial bands).
- **Content + scale realignment (structure OK):** Hero, Stats/About.
- **Additive / near-aligned:** Journal (add eyebrow + CTA), Showrooms (add eyebrow + city data), Consultation CTA (verify only), Footer (render social icons), Header (verify).
- **Already aligned:** Foundation tokens.

---

## 2. Global foundation changes

### Font verdict
**Figma uses Ayandeh — same as live**, all weights (Light 300 / Regular 400 / Bold 700 / Black 900) via `next/font/local` → `--font-ayandeh`. **No font swap, no licensing, no glyph migration.** Verify the subset covers U+0600–06FF, U+FB50–FDFF, U+200C–200D (ZWNJ) for mixed-script labels ("SINCE 2008").

### Palette — all 13 Figma colors already exist as tokens. **No new color tokens required.**
ivory #FAFAF7 · cream #F5F0EB · sand #E8E0D8 · stone #8C8279 · charcoal #2C2825 · ink #14110F · accent #B8A898 · gold #C49A6C · rust #8B4A2B · forest #5F7760 · forest-dark #2D3A2E · overlay rgba(20,17,15,.6) · divider-ink rgba(20,17,15,.08).
Figma's slightly-off hexes (#C2986B, #2E3B2F, #272727, #385656) are color-picker rounding — **live tokens are source of truth; do not add per-node variants.**

### Type ramp — matches `typography.ts` / `theme.css` exactly at the 1920w anchor.
display 96 / h1 64 / h2 48 / h3 32 / h4 24 / lead 20 / body 16 / small 14 / eyebrow 12 (0.08em) / eyebrow-compact 11 (0.12em).
**The catch:** Figma's giant per-node sizes (hero 184px, stat values 112px, main heading 154px, 203px nav bar, 98px icons) are **literal 1920-canvas pixels, NOT responsive token outputs.** Map them by ratio onto the existing `clamp()` tokens — **never hardcode 184px/154px/203px.**

### Concrete token edits
- **None** required for colors / type / spacing / shadow / motion / z-index — all matched.
- `packages/design-system/src/tokens/glass.ts` — **(high)** formalize/export the 4 glass recipes (`glass-card`, `glass-card-dark`, `glass-boundary` @4px blur +1.45 saturate, `glass-gold`) currently scattered across `tokens.css` + `base.css`.
- **Verify** Stats dividers use `--color-gold` (#C49A6C), not `--color-divider-ink`.
- `color.ts` — **(med)** JSDoc the "gold once-per-page max, forest = primary accent" philosophy.

---

## 3. Per-section alignment plan

### 3.1 Header / Nav — near-aligned
Live `SiteHeader.tsx` structurally correct (mobile pill, h-44/60, centered SVG logo, charcoal icons). Figma's 203px bar + 98px icons are canvas artifacts.
- Logo opacity Figma 0.75 vs live 1.0 → **keep 1.0** (decision #12).
- Keep refined search/hamburger icons, not the blocky 70×8 mockup.
- Keep desktop nav text links + mega-menus (Figma header frame is incomplete).

### 3.2 Hero — content + scale realignment
- **(high)** `HomeHeroCarousel.tsx` — headline → **«خواب خوب،تمام ماجــــــراست»**; split on Persian comma «،», wrap in `<span class="zh-hhc__comma">` for gold accent.
- **(high)** `home-hero-carousel.css` — verify `.zh-hhc__heading` resolves to hero display scale (Figma 184px@1920; add `--text-display-lg` if `--text-h2` too small), line-height ≈1.4, letter-spacing ≈ -0.02em; add `.zh-hhc__comma { color: var(--color-gold); }`.
- **(med)** CTA button: bg ink/charcoal, `border-radius: 30px`, «مشاهده‌ی محصولات» Bold; padding-driven, no hardcoded px.
- **(med)** DECISION — carousel vs single still (§7).
- Watermark node 212:79 sits 1500px below hero → off-page artifact, **no action**.

### 3.3 Age category blocks — FULL REBUILD
Live `HomeRoomsTiles` = compact `1fr 1fr 1fr` grid; Figma = full-bleed stacked alternating editorial bands.
- **(high)** `HomeRoomsTiles.tsx` — restructure to single-column stacked bands; each = 50/50 image+text flex row; `:nth-child(even){flex-direction:row-reverse}`; add visible **«مشاهده»** CTA after each subtitle.
- **(high)** `home-rooms-tiles.css` — single-column grid; `.zh-rooms__media` 50% width / min-height ~600px; text block 50%, flex-column justify-center; **title → `--text-h2`**; inter-band gap → `--space-8/9`.
- **(med)** accent bar: Figma 384×9 likely a loose sketch → widen to ~60–100px @6px, confirm with designer.
- **(low)** occupancy labels (§4 #7), eyebrow ZWNJ (§4 #8).

### 3.4 Stats + About (dark band) — content realignment, structure OK
Band, glass stat card, positioning all match.
- **(high)** stat #2: live **570430+** vs Figma **+1200** (decision #2).
- **(high)** stat #3 label+count: live **«22 شعبه»** vs Figma **«3 شوروم»** (decision #3).
- **(high)** replace 1-paragraph about with Figma's **3-paragraph** story «ژیک از همدان آغاز شده است؛ از کارگاهی…» (کتان بلژیکی, استادکاران) (decision #4).
- **(med)** verify stat labels white/ivory on glass card; dividers gold not divider-ink.

### 3.5 Journal — additive, near-aligned
Card overlay/eyebrow/title matched; missing section eyebrow + bottom CTA.
- **(high)** add **«ژورنال ژیک»** eyebrow (forest) before heading.
- **(high)** heading: live **«از کارگاه، از همدان»** vs Figma **«از کارخانه…»** (decision #5).
- **(high)** add **«همه ی مقالات»** CTA → `/journal`, caramel underline + RTL arrow.
- **(open)** Figma is static 3×3 (9 cards); live = unbounded parallax rows (§7).

### 3.6 Showrooms — additive, near-aligned
Card geometry/scrim/corner-radius/expand button all match; missing eyebrow; cities CMS-driven.
- **(high)** add **«نمایندگی‌ها»** eyebrow (forest) above h2.
- **(med)** cities: Figma همدان/اراک/ساری vs live CMS (decision #6).

### 3.7 Consultation CTA — verify only, aligned
`SiteFooter` `.zh-foot-cta` straddle gradient, cream card, vase image, scrim, all four copy strings **match**.
- Heading «زیبایی» color: Figma caramel vs live **forest** (CEO pass) → **keep forest** (decision #11).
- **(med)** promote hardcoded `#b08c5e` hover to `--color-gold-hover`.

### 3.8 Footer — additive, near-aligned
Background, logo, tagline+dashes, 3-col RTL grid, headings/links, SINCE 2008, copyright all match.
- **(high)** render `SocialIcon` (defined-but-unused in `socials.tsx`) next to each contact label in column 3.
- **(low)** footer col-3 extras (واتس‌اپ/خبرنامه/legal) not in Figma → **keep** (real functionality) (decision #13).

---

## 4. Content-conflict decisions (NEEDS OPERATOR)

| # | Location | Figma | Live | Recommendation |
|---|---|---|---|---|
| 1 | Hero headline | «خواب خوب،تمام ماجراست» | «ساخته‌شده برای ماندن» | **Adopt Figma** + gold comma |
| 2 | Stat #2 value | **+1200** | **570430+** (pieces) | **Operator: true number** — public credibility |
| 3 | Stat #3 label+count | «3 شوروم» | «22 شعبه» | **Operator: resolve word + number together** |
| 4 | About paragraph | 3-paragraph «…از کارگاهی…» | 1-paragraph | **Adopt Figma 3-para** |
| 5 | Journal heading | «از **کارخانه**…» | «از **کارگاه**…» | **Keep کارگاه** (brand voice) — confirm |
| 6 | Showroom cities | همدان/اراک/ساری | CMS-driven | **Keep CMS real data** (Figma illustrative) — confirm |
| 7 | Age band titles | کودک/کودک/نوجوان (Figma bug) | kid/teen/adult | **Canonical نوزاد/کودک/نوجوان** — confirm 3rd |
| 8 | Age eyebrow | «دسته سنی» | «دسته‌ی سنی» | **Keep live** (correct ezafe) |
| 9 | Stat label | «تولید شده» | «تولیدشده» | **Keep live** (joined) |
| 10 | Footer pitch | no period | period | minor, keep live |
| 11 | Consult heading color | caramel | forest (CEO) | **Keep forest** |
| 12 | Header logo opacity | 0.75 | 1.0 | **Keep 1.0** |
| 13 | Footer col-3 extras | 3 items | +extras | **Keep extras** |
| 14 | Footer tagline kashida | kashida | decorative dashes | **Keep live** |

---

## 5. Responsive strategy (NEEDS OPERATOR)

Figma is **desktop-1920 only**. Options: **A** proportional scale (fragile), **B** re-flow per breakpoint using existing token ramp + the components' media queries (**recommended** — Figma 1920 numbers become desktop anchors), **C** mobile from a Page-1 iPhone frame (only if designer supplies a mobile mockup).
**Recommend B**, escalating to a designer-supplied mobile mockup specifically for the rebuilt Age bands (the one place mobile is genuinely undefined).

---

## 6. Recommended implementation sequence

- **PR 1 — Foundation hardening (S).** Glass recipe export; divider gold-vs-ink verify; JSDoc. No visual change.
- **PR 2 — Near-aligned additive wins (M).** Journal eyebrow + «همه ی مقالات» CTA; Showrooms «نمایندگی‌ها» eyebrow; Footer social icons. No decisions needed — ships visible alignment fast.
- **PR 3 — Stats/About content (S–M).** 3-para about; stat #2 value; stat #3 word+number; dividers. **Blocked on §4 #2/#3/#4.**
- **PR 4 — Hero (M).** Headline + gold comma; scale/letter-spacing; CTA. **Blocked on carousel-vs-still (§7).**
- **PR 5 — Age blocks full rebuild (L).** Editorial bands rewrite. Do last; depends on §4 #7 + possibly a mobile mockup. Split 5a desktop / 5b mobile.
- **PR 6 — Consultation + Footer polish (S).** Verify items + `--color-gold-hover` + pitch punctuation.

---

## 7. Risks & watchouts

- **Hero carousel vs single still — BLOCKING for PR 4.** Different aspect (3:4 still vs 16:9 carousel) and content model (per-slide vs single headline).
- **Image assets from 3D artist.** Age bands need full-bleed adult/kid/teen photos; cities need همدان/اراک/ساری art *if* matching Figma; hero needs final still(s). Editorial bands look broken with placeholder crops.
- **Stat #2 (+1200 vs 570430+) is product truth, not design — don't guess.**
- **شوروم vs شعبه couples copy + count** — changing one without the other ships a contradiction.
- **Age-block Figma labeling bug (کودک twice)** — building literally ships a duplicate; resolve canonical occupancies before PR 5.
- **Accent bar 384px** is a loose sketch — default ~60–100px, confirm.
- **Mobile undefined for rebuilt Age bands** — needs a mockup or Option-B engineering judgment.
- **Never hardcode 1920-canvas px** (184/154/112/98/203) — map by ratio to `clamp()` tokens.
- **`prefers-reduced-motion`** must keep gating parallax/blur-in through all rebuilds.
