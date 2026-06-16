# /journal index — Figma rebuild spec (frame `227:478` "/journals", @430)

Source: desktop Figma **local Dev Mode MCP**, frame `227:478`, 430×1785. Font **Ayandeh**
(Black/Bold/Regular/Light) + **Crimson Text** (serif) for the list numerals.

**Decisions (2026-06-16):** redesign the existing **`/journal`** index (keep route + sub-routes);
**static-exact seed first** (content layer `lib/journal-content.ts` + props), wire to the real
article CMS (`fetchArticles`/`fetchJournalCategories`) later; reuse global SiteHeader/Footer +
consultation CTA; primitives → `packages/ui`, composition → `components/journal`, tokens → DS.
Build in a **430-standard column** with `container-type: inline-size` (cqw units), like bedroom-furniture.

## Media (optimized → `apps/web/public/journal/`)
| file | dims | from | role |
|---|---|---|---|
| `featured.jpg` | 900×633 | 227:479 | featured article photo |
| `list-1.jpg` / `list-2.jpg` / `list-3.jpg` | ~380w | 227:571–574 | numbered-list thumbs (list-2 reused for rows 03 & 05) |
| `card-1.jpg` / `card-2.jpg` | ~560w | 227:605 / 606 | article-card photos |
| `product-cta.jpg` | 860×188 | 227:602 | product-CTA banner |
| `quote-plant.png` | 159×260 (alpha) | 227:603 | quote-block plant |
| GoldArrow (reuse) / calendar / heading-notch | — | 227:558·591·618 / 480 / 622 | inline SVG, gold `#C2986B` |

## Body zones (top→bottom; header + CTA + footer = global chrome)
1. **Breadcrumb** (227:496) «< خانه > ژورنال» — right.
2. **Intro** (227:497) center, 2 lines: forest `#5F7760` nouns @16.94px + gold `#C2986B` connectors @13.55px (Ayandeh Bold).
3. **BrandDivider** (227:562) — reuse.
4. **Category tabs** (Frame 227:498, gap 8.36): 5 pills, h24.6, w70.5, Ayandeh Light 11.29px. «همه» active = bg `#3B4A38`, white, shadow, rounded-tr 11.74; others outlined `border 0.226 #000`, text `#222`, rounded 2.48 (leftmost rounded-bl 11.74).
5. **Featured card** (227:479, x12 y285 w405 h228, radius 13.55): photo `object-bottom` + overlay `linear-gradient(-90deg, transparent 34.5%, rgba(46,59,47,.8) 53.6%, rgba(33,33,33,.97) 100%)`. White text left: tag «سبک زندگی» (Reg 9px) · title «چگونه یک اتاق خواب آرامش‌بخش طراحی کنیم؟» (Bold 15.36px) · excerpt (Reg 9px, 2 lines) · «۵ دقیقه مطالعه» + date «۱۴۰۵/۰۵/۱۰» (7.9px, calendar icon) · «مطالعه مقاله» (Light 7.9px) + gold arrow.
6. **Numbered list** (227:570, bg `#fbf9f6`, radius-bottom 13.55, shadow): 4 rows (02–05). Each: number (**Crimson Text** Regular 30px, gold `#C2986B`) · title (Ayandeh Reg 11.29px black, 2 lines) · category (Light 9px `#676767`) · read-time (Reg 9px `#737373`) · thumb (radius 4.52) on the right · forest `#5F7760` 0.45px divider between rows + gold arrow.
7. **«فهرست کامل»** heading (227:623, Ayandeh Bold 20.33px black right) + notched forest line (227:622, `#5F7760` @88%).
8. **Quote block** (227:599 bg `#F3EAE0` radius 11.29 + shadow): big gold `"` (227:600, Ayandeh Reg 66.4px) · quote «زیبایی زمانی ماندگار می‌شود / که آرامش ایجاد کند.» (227:601 Ayandeh Black 16.49px black center) · plant `quote-plant.png` at left.
9. **Article cards** (×2, y1009, radius 13.55): photo + forest tint `rgba(46,59,47,.8)` panel (rounded-tr/br). White: title (Ayandeh Black 15.13px, kashida e.g. «در خـــــانه» / «پا تـــــختی») · subtitle (Reg 9px) · category (9px) · read-time + arrow. card1 «فضای کاری در خانه» / card2 «بهترین پا تختی».
10. **Product CTA** (227:602 banner `product-cta.jpg` + shadow): «ساخته شده برای ماندن» (Ayandeh Bold 17.39px white right) + «مشاهده محصولات» button (227:620/621 — style inferred: light/gold pill).
11. **BrandDivider** (227:516) → reuse (before global CTA).

## New tokens (→ tokens.css + theme.css)
- `--color-cream-warm: #F3EAE0` (quote card). List card `#FBF9F6` ≈ reuse `--color-ivory`. Tab active `#3B4A38` (arbitrary inline). Gold `#C2986B` ≈ `--color-gold`; line/forest `#5F7760` = `--color-forest`.
- **Crimson Text** (serif) for list numerals — Google Font, blocked in Iran → must self-host (`next/font/local`) for exactness; serif fallback `'Crimson Text', Georgia, serif` until then.

## Components
**packages/ui:** reuse `GoldArrow`, `BrandDivider`-equivalent; maybe `CalendarIcon`.
**components/journal (new, alongside existing JournalGrid etc.):** `JournalIntro`, `JournalTabs`, `JournalFeaturedCard`, `JournalNumberedList`, `JournalQuote`, `JournalArticleCards`, `JournalProductCTA`. Content from `lib/journal-content.ts` (seed → Payload later), props-driven; types mirror `PayloadArticle`.
