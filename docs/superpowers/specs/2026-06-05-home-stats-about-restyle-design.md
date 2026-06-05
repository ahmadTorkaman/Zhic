# Home stats band + about section restyle — design

**Date:** 2026-06-05
**Status:** Approved
**Source:** Figma «zhic wood .com» file (`QLrD4LolUKzSsciGxslrBv`, frame `home page` 1:3), sections 4–5 of the Figma↔live diff.

## Goal

Adopt the Figma treatment for the homepage stats band and about («از همدان، برای ایران») section — floating ivory stats card overlapping the dark section edge, divided stat cells, solid ivory CTA, photo in the about block — **without removing any existing content** (the brand-story paragraphs stay). All new visual components land in the design-system CSS as reusable, token-driven recipes.

## Decisions made

| Decision | Choice |
| --- | --- |
| About image vs. paragraphs | Image **and** paragraphs (image is additive; copy is kept for brand story + SEO) |
| Radius language | Keep `--radius-md: 4px` everywhere; the Figma's pills/arches are **not** adopted |
| Reuse mechanism | Recipe classes in `packages/design-system/css/` (the `.glass-card` pattern), not new shared React components |
| Figma elements rejected | Pill geometry, sage/sand palette promotion, dropping the about paragraphs |

## 1. Token additions — `packages/design-system/css/tokens.css`

```css
--color-divider-ink: rgba(20, 17, 15, 0.08);   /* hairline dividers on light surfaces */
--section-overlap: clamp(2.5rem, 6vw, 4.5rem); /* distance a floating card crosses a section edge */
```

No other new tokens. Ivory, sand, stone, ink, shadows, radius, spacing, typography, and motion tokens already exist.

## 2. New recipe classes — `packages/design-system/css/base.css`

All classes are generic (not homepage-specific) and composable, following the existing `.glass-card` / `.glass-card-dark` / `.site-header-chrome` precedent.

### `.float-card`

Floating light card for straddling section boundaries.

```css
.float-card {
  background: var(--color-ivory);
  border: 1px solid var(--color-sand);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-elevated);
}
```

### `.section-overlap-top`

Pulls an element up across the top edge of its parent section. Used as the first child inside a section whose predecessor provides the contrasting background.

```css
.section-overlap-top {
  position: relative;
  z-index: var(--z-raised);
  margin-block-start: calc(-1 * var(--section-overlap));
}
```

The dark section keeps normal flow; the page section *above* it shows through behind the card's upper half. The dark section's own top padding must account for the card intrusion (handled in the consumer with existing spacing utilities).

### `.stat-row` / `.stat-cell`

Divided horizontal stats. Logical borders only, so RTL works without overrides.

```css
.stat-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.stat-cell {
  padding-inline: var(--space-4);
  padding-block: var(--space-5);
  text-align: center;
}
.stat-cell + .stat-cell {
  border-inline-start: 1px solid var(--color-divider-ink);
}
```

Numerals: `--text-h2`, weight black, `--color-ink`. Labels: `--text-small`, `--color-stone`. (Type/color applied by the consumer via existing utilities, consistent with how `.glass-card` consumers set their own text styles.)

## 3. `Button` variant `on-dark-solid` — shared `Button` component

Solid ivory CTA for dark grounds, sitting beside the existing outlined `on-dark` variant:

- Background `--color-ivory`, text `--color-ink`, radius `--radius-md`.
- Hover: background `--color-cream`, `translateY(var(--hover-lift))`, `--dur-hover` / `--ease-out-soft`.
- Focus ring: existing `--focus-ring-*` tokens.

Both variants remain available; no existing call sites change.

## 4. `StatBlock` variant — `apps/web/src/components/home/StatBlock.tsx`

Add a `variant` prop:

- `'gold-border'` (default) — current look (gold inline-start border, ivory numeral, sand label). **All existing consumers unchanged.**
- `'divided'` — for use inside `.stat-row`: no border (the row provides dividers), ink numeral, stone label, centered.

`CountUp` animation is shared by both variants.

## 5. `HomeBrandStatement` restructure — `apps/web/src/components/home/HomeBrandStatement.tsx`

### Stats

- Stats move out of `.glass-card-dark` into `<div class="float-card stat-row section-overlap-top">` as the first element inside the dark (`bg-forest-dark`) section.
- Three `StatBlock variant="divided"` cells. Hardcoded `DEFAULT_STATS` values unchanged.
- `.glass-card-dark` recipe itself is untouched (other consumers keep it).

### About

- Eyebrow «درباره‌ی ژیک», heading «از همدان، برای ایران», and the full RichText/fallback paragraphs render **unchanged** — no copy is removed or altered.
- CTA «بیش‌تر درباره‌ی ما» switches from outlined `on-dark` to `on-dark-solid`.
- New media slot: photo at `--radius-md`.
  - **Desktop (`md+`)**: two-column grid, `md:grid-cols-[3fr_2fr]` — text (3fr) | image (2fr).
  - **Mobile**: image above the text block, full content width.
- Decorative caramel radial glow and `BlurInText` entrances stay as-is.

### Desktop adaptation note

The Figma frame is mobile-only. On desktop the floating card runs full content width (horizontal 3-stat row) overlapping the dark section's top edge; the about grid sits below it. This **replaces** the current desktop layout (stats stacked vertically beside the text).

## 6. CMS — `about_media` field on the `home` global (Payload)

- New optional upload field `about_media` (relation to media) on the `home` global; surfaced through `fetchHome()` / `PayloadHome` type as `about_media?: PayloadMedia | null`.
- **Fallback:** no image uploaded → the about section renders text-only, exactly as today. No deploy coupling; the photo can be uploaded whenever it's ready.

## Out of scope

- Stats values stay hardcoded component defaults (no CMS fields for them).
- Hero, category cards, journal, showrooms, contact, newsletter sections.
- Any palette, type, or radius changes beyond the two new tokens above.
- The Figma's journal collage, hero render, and «مشاهده» underline-rule treatments (separate decisions).

## Verification

1. Dev server, mobile viewport (430px): screenshot stats+about, compare against `/tmp/zhic-figma/sbs-4-stats-about.png` (Figma left column) — overlap, dividers, solid CTA, image placement.
2. Desktop viewport (1440px): confirm horizontal floating card + text|image grid.
3. Regression: other `StatBlock` and `GlassCard`/`.glass-card-dark` consumers visually unchanged.
4. With `about_media` unset in CMS: section renders text-only (today's layout) without errors.
