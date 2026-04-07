# Design System

The Zhic design system. Dazzling but minimal. Graphic, calm, editorial.
Motion is rich but always subtle. Nothing is built in code until it lives
here first.

This document defines: brand voice, tokens, typography, color, grid,
spacing, iconography, imagery, motion, and the component inventory with
states.

---

## 1. Brand essence

- **Mood:** quiet luxury, slow mornings, soft northern light, linen against
  oak, the threshold between waking and dreaming.
- **Personality:** confident, restrained, considered, sensual without being
  loud.
- **Voice:** spare and tactile. Short sentences. Concrete nouns. No
  marketing exclamations. Never sells — always invites.
- **What we are not:** glossy, neon, playful, busy, "bold and disruptive,"
  startup-y, ironic.

### Voice rules

- Active verbs.
- Avoid adjectives stacked more than two deep.
- Avoid superlatives ("the best," "the most luxurious").
- Sentences under 18 words wherever possible.
- Pricing is presented quietly: `$4,200`, never `Only $4,200!`.
- Headlines are statements, not questions.

---

## 2. Tokens

All tokens are exposed as CSS custom properties on `:root` and consumed by
Tailwind v4 via `@theme`. Token names are stable; values may change.

### 2.1 Color

```
--color-ivory       #FAFAF7   page background, canvas
--color-cream       #F5F0EB   panels, alt sections
--color-sand        #E8E0D8   dividers, hairlines, hover fills
--color-stone       #8C8279   secondary text, captions
--color-charcoal    #2C2825   primary text, headlines
--color-ink         #14110F   near-black, used sparingly for emphasis
--color-accent      #B8A898   brand neutral accent (warm taupe)
--color-gold        #B8915A   reserved for rare moments (rare!)
--color-rust        #8B4A2B   error / warning, muted
--color-moss        #5A6B4F   success, muted
--color-overlay     rgba(20, 17, 15, 0.6)   image overlays
```

Rules:

- The site lives in **ivory + charcoal**. Sand and cream are for separation.
- **Gold** is a once-per-page maximum. Never on body text.
- No pure black, no pure white anywhere.
- All text passes WCAG AA against its background. Charcoal on ivory:
  contrast ratio 13.4:1. Stone on ivory: 4.6:1 (body-only, never headlines).
- Dark mode is **not** in scope for v1. Reconsidered in Phase 5.

### 2.2 Typography

Two families. **Both must be loaded via `next/font/local`, not
`next/font/google`** — Google Fonts is intermittently blocked from Iran
(we already hit this in `next build`), and self-hosted woff2 files are
also faster for everyone. The current placeholder pairing is:

- **Display — Cormorant Garamond.** Used for H1, H2, hero, pull quotes.
  Weights 300–600. Tracks tight on large sizes (-0.01em), loose on small
  caps (0.08em).
- **Body — Inter.** Used for everything else. Weights 300–500. Never bold.

Both files live in `src/fonts/` once Phase 1 starts. The brand spec
hand-off may replace one or both — the loading strategy stays the same.

Type scale (modular, ratio 1.25, base 16px):

| Token | px | rem | Family | Weight | Line height | Use |
| --- | --- | --- | --- | --- | --- | --- |
| `text-display` | 96 | 6 | Cormorant | 300 | 1.0 | Hero headline (desktop) |
| `text-h1` | 64 | 4 | Cormorant | 300 | 1.05 | Page H1 |
| `text-h2` | 48 | 3 | Cormorant | 400 | 1.1 | Section heading |
| `text-h3` | 32 | 2 | Cormorant | 400 | 1.15 | Subsection |
| `text-h4` | 24 | 1.5 | Cormorant | 500 | 1.2 | Card title |
| `text-lead` | 20 | 1.25 | Inter | 300 | 1.5 | Lead paragraph |
| `text-body` | 16 | 1 | Inter | 400 | 1.6 | Body |
| `text-small` | 14 | 0.875 | Inter | 400 | 1.5 | Captions, meta |
| `text-eyebrow` | 12 | 0.75 | Inter | 500 | 1.4 | Uppercase, +0.12em tracking |

Mobile scale: clamp() everything. Display caps at 56px on mobile, H1 at 40px.

Headings use `text-balance`. Body uses `text-pretty`.

### 2.3 Spacing

8-point base. Tokens are powers of the base for predictability.

```
--space-1   4px
--space-2   8px
--space-3   12px
--space-4   16px
--space-5   24px
--space-6   32px
--space-7   48px
--space-8   64px
--space-9   96px
--space-10  128px
--space-11  192px
--space-12  256px
```

Section vertical rhythm: `--space-11` desktop, `--space-9` mobile.
Container max width: 1440px. Gutter: `--space-6` desktop, `--space-4` mobile.

### 2.4 Grid

12-column on desktop, 6 on tablet, 4 on mobile. Gutter scales with
spacing tokens. Editorial layouts may break the grid intentionally — only
hero, gallery, and split blocks are allowed to do so.

### 2.5 Radii

```
--radius-none  0
--radius-sm    2px   inputs, chips
--radius-md    4px   cards, buttons
--radius-lg    8px   modals
--radius-pill  999px round buttons, tags
```

Most surfaces are square. Roundness is rare and meaningful.

### 2.6 Borders & hairlines

- 1px solid `--color-sand` is the standard hairline.
- Hairlines are preferred over shadows.
- No drop shadows on cards. Only on modals (`0 24px 64px -24px rgba(20,17,15,.18)`).

### 2.7 Z-index

```
--z-base       0
--z-raised     10
--z-sticky     100
--z-header     200
--z-overlay    900
--z-modal      1000
--z-toast      1100
```

### 2.8 Breakpoints

```
sm   640
md   768
lg   1024
xl   1440
2xl  1920
```

Mobile-first. Designs are produced at 390 (mobile), 1024 (tablet), 1440
(desktop), and 1920 (showroom screen).

---

## 3. Iconography

- Stroke icons, 1.25px stroke at 24px size.
- Family: custom-drawn or Phosphor "thin" weight.
- Never filled.
- Never colored — always inherit `currentColor`.
- 24px is the default size; 16px for inline; 32px for empty states.

---

## 4. Imagery

- **Photography style:** natural light, neutral palette, close crops on
  fabric and grain, occasional wide editorial shots, never staged with
  models smiling at the camera.
- **Aspect ratios:** product cards 4:5, hero 16:9 or 21:9, journal cover
  3:2, gallery free.
- **All images are AVIF + WebP** via Next/Image. Originals stored in S3.
- **Alt text is required.** Admin will not allow image upload without it.
- **No stock imagery.** Ever.

Video:

- Hero scrub video must be ≤ 8 MB, ≤ 12 seconds, and have a poster frame.
- Always paired with a `prefers-reduced-motion: reduce` fallback (still
  image).

---

## 5. Motion language

Motion is the brand's secret weapon. Subtle, slow, choreographed.

### 5.1 Principles

1. **Slowness reads as luxury.** Default duration is 600ms, not 200.
2. **Easing is custom**, never linear, never the framework default.
3. **Stagger reveals hierarchy.** Children animate at 60–80ms offsets.
4. **Motion respects `prefers-reduced-motion`.** All transforms become
   opacity-only fades when set.
5. **Nothing animates on hover that wasn't designed to.** No accidental
   transitions.
6. **No parallax for parallax's sake.** Only when it serves the narrative.

### 5.2 Tokens

```
--ease-out-soft     cubic-bezier(0.22, 1, 0.36, 1)    default reveal
--ease-in-soft      cubic-bezier(0.64, 0, 0.78, 0)    exits
--ease-in-out-soft  cubic-bezier(0.65, 0, 0.35, 1)    state changes
--ease-expo-out     cubic-bezier(0.16, 1, 0.3, 1)     hero entrances

--dur-instant   100ms   focus rings, micro state
--dur-fast      240ms   small UI
--dur-base      480ms   most things
--dur-slow      720ms   reveals, hero
--dur-glacial   1200ms  hero text mask reveals
```

### 5.3 Patterns

- **Word reveal:** characters split, mask up, 32ms stagger,
  `--dur-glacial`, `--ease-expo-out`. Used on H1 only.
- **Block reveal:** 24px y-offset + opacity, `--dur-slow`, `--ease-out-soft`,
  triggered when 20% in viewport.
- **Image reveal:** clip-path inset from 100% to 0%, `--dur-slow`,
  `--ease-expo-out`, paired with 1.08 → 1.0 scale on inner img.
- **Hover lift (cards):** translateY(-2px), 240ms, `--ease-out-soft`,
  hairline color shifts from sand to charcoal.
- **Marquee:** infinite linear scroll at 40s/loop, pauses on hover.
- **Cursor:** custom 8px circle that grows to 32px with mix-blend-difference
  on interactive elements. Disabled on touch.
- **Page transition:** ivory veil sweeps up, 600ms, `--ease-in-out-soft`.
- **Scroll-scrubbed video:** already in place via GSAP + Lenis. Tuned per
  device in `src/lib/constants.ts`.

### 5.4 Forbidden motion

- Bouncy springs on anything except micro-interactions (toast, toggle).
- Continuous looping animations on body content (distracting).
- Auto-rotating carousels.
- Pop-in scale-from-zero entrances.
- Any motion exceeding 1.2s outside of the hero.

---

## 6. Layout primitives

These are the only layout components allowed in pages. If a layout cannot be
expressed with them, the design system is wrong, not the page.

| Primitive | Purpose |
| --- | --- |
| `<Container>` | Max-width 1440px, gutters, centered. |
| `<Section>` | Vertical rhythm wrapper, optional background token. |
| `<Grid>` | 12/6/4 responsive grid with gap props. |
| `<Stack>` | Vertical or horizontal flex with spacing token. |
| `<Split>` | Two-column 50/50 or 60/40 editorial split. |
| `<Bleed>` | Full-bleed escape hatch (hero, gallery). |
| `<Aspect>` | Aspect-ratio box for media. |

---

## 7. Component inventory

Every component must define: variants, sizes, states (default, hover,
focus-visible, active, disabled, loading), motion, and accessibility notes.
Below is the list; the exhaustive spec lives in Figma and is mirrored as
Storybook stories once Phase 1 ships.

### Atoms

- Button (primary, secondary, ghost, link; sm/md/lg)
- IconButton
- Link (inline, standalone)
- Input (text, email, search, textarea)
- Select / Combobox
- Checkbox, Radio, Toggle
- Tag / Chip
- Tooltip
- Badge
- Divider (hairline, thick)
- Eyebrow label
- Price label
- Spinner / progress
- Skeleton

### Molecules

- FormField (label + input + help + error)
- NewsletterForm
- SearchBar
- Pagination
- Breadcrumbs
- Accordion
- Tabs
- ImageWithCaption
- VideoPlayer (poster, controls, reduced-motion fallback)
- ProductCard (already exists, will be tokenized)
- ArticleCard
- EventCard
- TestimonialCard
- PressLogoStrip

### Organisms

- Header (transparent → solid on scroll)
- Footer
- HeroBlock
- MarqueeBlock
- FeaturedProductsBlock
- EditorialSplitBlock
- JournalTeaserBlock
- TestimonialsBlock
- ContactBlock
- NewsletterBlock
- GalleryBlock
- SpecsAccordion
- VariantPicker
- RelatedProducts
- TableOfContents
- BookingForm

### Templates

See `sitemap.md` for the full list.

### States checklist

For every interactive component, design and implement:

- Default
- Hover (desktop only)
- Focus-visible (keyboard) — always a 2px offset ring in `--color-charcoal`
- Active / pressed
- Disabled
- Loading
- Error
- Empty (for lists)

---

## 8. Accessibility

- WCAG 2.2 AA minimum.
- All interactive elements reachable by keyboard.
- Focus order matches visual order.
- Skip-to-content link in the header.
- All motion respects `prefers-reduced-motion`.
- All form fields have visible labels (no placeholder-as-label).
- All images have alt text or `alt=""` for decorative.
- Color is never the sole carrier of meaning.
- Semantic HTML always: `<nav>`, `<main>`, `<article>`, `<section>` with
  headings.

---

## 9. Tooling

- **Figma** is the source of visual truth until Storybook is set up in
  Phase 1.
- **Storybook** holds every component with all states, used by both design
  and engineering.
- **Tokens** are exported from Figma via Tokens Studio → JSON → consumed by
  Tailwind v4 `@theme`.
- **Visual regression:** Chromatic on every PR after Phase 1.

---

## 10. Open design questions

These need answers before Phase 1 design closes:

1. Logo: wordmark only, or wordmark + monogram? Lockup rules?
2. Photography: do we have an in-house photographer or commission per
   collection?
3. Custom typeface vs Cormorant — is there budget for a bespoke display
   face?
4. Cursor: keep the custom cursor or drop it as an accessibility risk?
5. Page transitions: full-page veil, or in-place content swap?
6. Sound: any subtle audio on hero (e.g. linen rustle)? Default off?
