# SiteFooter — rebuild spec (Figma 402:139)

Global footer (`components/layout/SiteFooter.tsx` + `site-footer.css`), rendered
by `app/(site)/layout.tsx` on every page except `/bedroom-set` (intentional —
that page ends in a full-screen featured takeover). Rebuilt exactly from Figma
node **`402:139` "Group 13"** (read via the local Dev Mode MCP). Data/logic
unchanged: `siteConfig` socials + phone → «ارتباط با ما», `FOOTER_COLUMNS` →
برند/فروشگاه, the consultation modal, `FOOTER_HIDDEN_ROUTES`.

## Structure (top → bottom)

1. **Cream top strip** (`.zh-foot-top`, `--color-ivory`): the ZHIC wordmark
   (`/footer/zhic-wordmark.webp`) centred between two 77.7px gold rules.
2. **Consultation card** (`.zh-foot-cta__card`): the vase photo
   (`/footer/consult-card.webp`) as a rounded (27.55px) background; «زیبایی»
   (sage `--color-sage` Ayandeh Black 37.41px) + «از یک انتخاب ساده آغاز می‌شود»
   (Bold 14.34px) + «مشاوره تخصصی…» (Light 8.85px) + the gold «دریافت مشاوره
   رایگان» button → opens the consultation modal. Body is absolutely positioned
   inside the card at the comp's exact y-offsets.
3. **Forest body** (`.zh-foot`, `--color-forest-deep #2E3B2F`): ژیک mark
   (`/footer/zhic-mark.webp`), the **kashida** tagline «ساخـــــته شــــده
   بـــــرای مـــــــــــاندن» (`FOOTER_TAGLINE_KASHIDA`; plain form in
   `aria-label`), three columns — فروشگاه (right) · برند · ارتباط با ما (left),
   gold headings, white links with tiny gold chevron bullets (~2.6px) and
   vertical dividers — then SINCE 2008 (gold serif) · pitch · ©.

## The straddle (non-obvious)

The card sits over the cream→forest boundary with the **green coming up to the
card's exact midpoint**, and **no seam line beside the card**. Implementation:
the `.zh-foot-cta` section base is forest; a full-width cream band
(`.zh-foot-cta > .zh-foot-inner::before`, `width:100vw; margin-left:-50vw`)
covers the **top half** of the card (`height: 23.34cqw` = half the 46.68cqw
card), and the card has `z-index:1` over it. The band is sized in the **inner's
cqw** (430-relative) so it tracks the card at any width — sizing it on the
section instead resolves cqw against the viewport and leaves a green sliver
above the card (the bug we hit). Section padding is `0`; the cream space above
the card lives in `.zh-foot-top`'s bottom padding. `overflow-x: clip` on the
section kills the 100vw scrollbar.

## Sizing / tokens

All cqw (1cqw = comp px ÷ 4.3 → pixel-exact at the 430 column). Link rows at the
comp's 19.94px pitch (the `<li>` font-size/line-height is collapsed so each row
= the link height). No new tokens except `FOOTER_TAGLINE_KASHIDA`
(`footerLinks.ts`); colours are `--color-forest-deep` / `--color-sage` /
`--color-gold` / `--color-ivory`.

## Dropped vs. the old footer (operator: "precisely as the figma")

The «خبرنامه» newsletter button, the حریم خصوصی / شرایط استفاده legal links, the
old brandline, and the social glyphs (chevron bullets are used uniformly).

## Assets (optimized webp in `public/footer/`)

`consult-card.webp` (vase, 920px, 18KB), `zhic-wordmark.webp` (6KB),
`zhic-mark.webp` (6KB). Lab preview (seed siteConfig, no CMS): `/lab/footer`.
