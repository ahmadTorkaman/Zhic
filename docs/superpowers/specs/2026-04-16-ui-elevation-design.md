# Zhic UI Elevation — Design Spec

**Date:** 2026-04-16
**Scope:** Comprehensive UI pass — token foundation, interaction language, component expansion
**Approach:** Three layered passes with review gates (Approach C)

---

## Decisions Locked

| Decision | Choice |
|---|---|
| Palette | Forest `#5F7760` (primary accent) + Caramel `#C49A6C` (warm reward) |
| Previous palette | Saffron `#C68A2E` + Moss `#5A6B4F` — retired |
| Neutral foundation | Ivory `#FAFAF7`, Cream `#F5F0EB`, Sand `#E8E0D8`, Stone `#8C8279`, Charcoal `#2C2825`, Ink `#14110F` — unchanged |
| Color philosophy | Neutrals carry 95% of visual weight. Color appears at designated accent moments only |
| Color accent moments | Eyebrow labels, single accent CTA per page, input focus states, dark-section hover rewards |
| Motion personality | Slow and confident — 600-1200ms durations, ease-out deceleration curves |
| Texture direction | Frosted glass + light — warm translucency, depth through layering and opacity |
| Interaction language | Light shift (luminosity change) + subtle elevation (translateY + shadow deepening) |
| Typography | Ayandeh (4 weights), existing token scale unchanged |
| Resolves | OD-palette open decision |

---

## Pass 1: Foundation — Token System & Bug Fixes

### 1.1 Palette Rename in Design System

**`packages/design-system/css/tokens.css`:**

Replace:
```css
--color-saffron: #C68A2E;
--color-moss: #5A6B4F;
```
With:
```css
--color-gold: #C49A6C;
--color-forest: #5F7760;
```

**`packages/design-system/css/theme.css`:**

Remove `saffron` and `moss` Tailwind aliases. Add:
```css
--color-gold: var(--color-gold);
--color-forest: var(--color-forest);
```

**`packages/design-system/src/tokens/color.ts`:**

Replace `saffron` and `moss` keys with `gold` and `forest` using the new hex values.

**Global find-and-replace across all files:**
- `saffron` → `gold` (in Tailwind class usage: `bg-saffron` → `bg-gold`, `text-saffron` → `text-gold`, etc.)
- `moss` → `forest` (same pattern)
- Verify every occurrence — some may be in comments or docs that also need updating

### 1.2 New Tokens — Glass, Shadow, Interaction

Add to `tokens.css` `:root` block:

```css
/* ── Glass surfaces (§ new) ────────────────────────────────── */
--glass-bg: rgba(250, 250, 247, 0.6);
--glass-border: rgba(232, 224, 216, 0.5);
--glass-blur: 24px;

/* ── Expanded shadow scale (§2.6 extended) ─────────────────── */
--shadow-subtle: 0 2px 8px rgba(20, 17, 15, 0.03);
--shadow-card: 0 8px 32px rgba(20, 17, 15, 0.04);
--shadow-elevated: 0 12px 40px rgba(20, 17, 15, 0.08);
/* --shadow-modal stays: 0 24px 64px -24px rgba(20, 17, 15, 0.18) */

/* ── Interaction motion (§6.3 extended) ────────────────────── */
--dur-hover: 720ms;
--dur-appear: 720ms;
--dur-dialog: 600ms;

/* ── Interaction spatial ───────────────────────────────────── */
--hover-lift: -2px;
--hover-lift-card: -3px;
--focus-ring-width: 2px;
--focus-ring-color: rgba(95, 119, 96, 0.3);
```

Add corresponding TypeScript mirrors in:
- `packages/design-system/src/tokens/shadows.ts` — add `subtle`, `card`, `elevated`
- `packages/design-system/src/tokens/motion.ts` — add `hover`, `appear`, `dialog` durations
- `packages/design-system/src/tokens/glass.ts` — new file for glass tokens

Wire into `theme.css` `@theme inline` block so Tailwind utilities exist:
```css
--shadow-subtle: var(--shadow-subtle);
--shadow-card: var(--shadow-card);
--shadow-elevated: var(--shadow-elevated);
```

### 1.3 Glass System in `base.css`

Replace the existing `.glass`, `.glass-card`, `.glass-card-hover`, `.glass-input` classes. Current versions use raw hex values bypassing the token system. New versions:

```css
.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
}

.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-subtle);
  transition: all var(--dur-hover) var(--ease-out-soft);
}

.glass-card:hover {
  background: rgba(250, 250, 247, 0.75);
  box-shadow: var(--shadow-card);
  transform: translateY(var(--hover-lift));
}

@media (prefers-reduced-motion: reduce) {
  .glass-card:hover {
    transform: none;
  }
}

.glass-input {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  transition: border-color var(--dur-hover) var(--ease-out-soft);
}

.glass-input:focus {
  border-color: var(--color-forest);
  box-shadow: 0 0 0 var(--focus-ring-width) var(--focus-ring-color);
}
```

### 1.4 Gutter Alignment

**`packages/ui/src/Container.tsx`:**

Change horizontal padding from `px-5 lg:px-7` to `px-4 lg:px-6` to match spec (space-4 mobile = 16px, space-6 desktop = 32px).

**`packages/design-system/src/tokens/spacing.ts`:**

Update the `gutter` export to match: `{ mobile: spacing[4], desktop: spacing[6] }`.

### 1.5 Bug Fixes

**`apps/web/src/components/motion/BackToTop.tsx`:**
- Line 33: Replace `inset-inline-start-6` with `start-6`
- Replace `z-50` with `z-[var(--z-header)]` or the Tailwind alias

**`apps/web/src/components/journal/TableOfContents.tsx`:**
- Line 45: Replace `border-inline-start` with `border-s`
- Line 55: Replace `border-inline-start-2` with `border-s-2`

**`apps/web/src/components/showrooms/ShowroomHolidayHours.tsx`:**
- Line 23: Extract the time range (`opens – closes`) into its own `<span dir="ltr">`, leave the `"تعطیل"` text in the default RTL flow of its parent

**`apps/web/src/components/showrooms/ShowroomHoursTable.tsx`:**
- Line 44: Same fix — `dir="ltr"` only wraps the time string, not the Persian fallback

**`apps/web/src/components/SiteHeader.tsx`:**
- Move the `lastPathname !== pathname` side-effect from render-time to a `useEffect`:
```tsx
useEffect(() => {
  setMenuOpen(false);
}, [pathname]);
```
- Remove the `lastPathname` ref comparison pattern

**`packages/design-system/css/base.css`:**
- Replace raw `rgba()` values in `.glass*` classes with token variables (covered in §1.3)
- Wrap `.glass-card-hover:hover` transform in `@media (prefers-reduced-motion: no-preference)` (covered in §1.3)

**`packages/design-system/css/theme.css`:**
- Add missing `--color-overlay` alias: `--color-overlay: var(--color-overlay);`
- Add container width aliases: `--width-container-storefront: var(--container-storefront);` and `--width-container-operator: var(--container-operator);`

### 1.6 Stale Lab Pages

**`apps/web/src/app/lab/color/page.tsx`:**
Replace entirely. New version imports from `@zhic/design-system` and renders every color token as a chip with its name and hex value. Uses the actual palette: ivory, cream, sand, stone, charcoal, ink, accent, gold, forest, rust, overlay. No hardcoded hex values. Uses Ayandeh font. Persian labels.

**`apps/web/src/app/lab/type/page.tsx`:**
Replace entirely. New version renders the full Ayandeh type scale (display through eyebrow) with Persian sample text at each level. Shows all four weights (Light 300, Regular 400, Bold 700, Black 900) as a weight specimen. Uses the token `clamp()` values. No Latin-only text, no references to Cormorant Garamond or Inter.

---

## Pass 2: Interaction — Motion & State Language

### 2.1 Global Interaction Tokens

Already defined in Pass 1 (§1.2): `--dur-hover: 720ms`, `--dur-appear: 720ms`, `--dur-dialog: 600ms`.

Default curve for all interactions: `--ease-out-soft: cubic-bezier(0.22, 1, 0.36, 1)`.

### 2.2 Component State Matrix

Every interactive component in `@zhic/ui` gets three states: rest → hover → focus/active. All transitions at `var(--dur-hover) var(--ease-out-soft)`.

**Button (`packages/ui/src/Button.tsx`):**

| Variant | Rest | Hover | Focus |
|---|---|---|---|
| `primary` | `bg-charcoal text-ivory` | `bg-ink`, `translateY(-1px)`, `shadow-subtle` | `outline: 2px solid var(--focus-ring-color)`, `outline-offset: 2px` |
| `secondary` / accent | `bg-forest text-ivory` | `translateY(-1px)`, `shadow-elevated` with forest tint | same focus ring |
| `ghost` | `border-sand text-charcoal` | `border-charcoal` | same focus ring |
| `link` | `border-b-sand text-charcoal` | `border-b-charcoal` | same focus ring |

Add `transition: all var(--dur-hover) var(--ease-out-soft)` to base button class.

Fix the existing link variant bug: when `variant="link"`, bypass SIZE_CLASSES entirely so padding doesn't collide.

**Cards (`packages/ui/src/ProductCard.tsx`, `DesignCard.tsx`, `ArticleCard.tsx`, `ShowroomCard.tsx`):**

Update shared `cardClasses.ts`:
```
CARD_BASE: add transition: all var(--dur-hover) var(--ease-out-soft)
CARD_INTERACTIVE hover:
  - background shifts from cream to ivory (luminosity up)
  - translateY(var(--hover-lift-card)) = -3px
  - box-shadow: var(--shadow-card)
  - border-color: var(--glass-border)
  - nested image: scale(1.02) over 1200ms (continues after card transition settles)
```

The image zoom is the only element with a longer duration (1200ms vs 720ms) — it creates a layered feel where the card lifts quickly and the image slowly breathes in.

All hover effects wrapped in `@media (prefers-reduced-motion: no-preference)` — fallback to shadow-only change.

**Inputs (`packages/ui/src/controlClasses.ts`):**

Update `CONTROL_BASE`:
```
transition: all var(--dur-hover) var(--ease-out-soft)
border: 1px solid var(--color-sand)
```

Hover state: `border-color: var(--color-stone)`

Focus state:
```
border-color: var(--color-forest)
box-shadow: 0 0 0 var(--focus-ring-width) var(--focus-ring-color)
```

Applies to Input, Textarea, Select uniformly via `controlClasses.ts`.

**Checkbox (`packages/ui/src/Checkbox.tsx`):**

Rest: `border-sand`. Hover: `border-stone`. Checked: `bg-charcoal border-charcoal` with ivory checkmark. Focus: forest ring. Transition: `var(--dur-hover)`.

No color in checked state — charcoal maintains the neutral luxury.

**Radio (`packages/ui/src/Radio.tsx`):**

Same pattern as Checkbox. Checked: `border-charcoal` with charcoal inner dot. No color.

**Tag (`packages/ui/src/Tag.tsx`):**

Simplify variants. Rest: `bg-cream text-stone`. Hover (dismissible): `bg-sand`. Dismiss button focus: forest ring. The current `variant: accent | neutral` distinction is removed — tags are always neutral in the new system.

**Breadcrumbs (`packages/ui/src/Breadcrumbs.tsx`):**

Links: `text-stone`, hover: `text-charcoal` (720ms transition). Current page: `text-charcoal font-bold`. No color.

**SiteHeader (`packages/ui/src/SiteHeader.tsx`):**

Nav links: `text-stone font-regular`, hover: `text-charcoal`. Active: `text-charcoal font-bold` with `border-bottom: 1.5px solid var(--color-forest)` — the only place in the header where brand color appears, and only on the active item.

### 2.3 Modal & Drawer Motion

**Modal (`packages/ui/src/Modal.tsx`):**

Open sequence:
1. Backdrop: `opacity: 0 → 1` using `var(--color-overlay)`, duration `var(--dur-dialog)` (600ms), `--ease-out-soft`
2. Content panel: `translateY(24px) → translateY(0)` + `opacity: 0 → 1`, same duration and easing, 60ms delay after backdrop starts

Close sequence:
1. Content panel: `translateY(0) → translateY(12px)` + `opacity: 1 → 0`, 480ms, `--ease-in-soft`
2. Backdrop: `opacity: 1 → 0`, 400ms, starts when panel reaches ~50% opacity

Implementation: CSS `@keyframes` on the `<dialog>` and `::backdrop`, triggered via a `data-state="open|closing"` attribute. On close, set `data-state="closing"`, wait for animation end, then call `dialog.close()`.

`prefers-reduced-motion` fallback: opacity-only fade, no translateY.

**Drawer (`packages/ui/src/Drawer.tsx`):**

Open sequence:
1. Backdrop: same as Modal
2. Panel: slides from edge depending on `side` prop:
   - `side="start"` → `translateX(100%)` under RTL (slides from right edge)
   - `side="end"` → `translateX(-100%)` under RTL (slides from left edge)
   - `side="top"` → `translateY(-100%)`
   - `side="bottom"` → `translateY(100%)`
   - `side="full"` → `opacity: 0 → 1` (no slide, just fade)
   Duration: `var(--dur-dialog)` (600ms), `--ease-out-soft`

Close sequence: reverse, 480ms, `--ease-in-soft`

`prefers-reduced-motion` fallback: opacity-only.

### 2.4 Focus Ring System

Unified approach for all focusable elements in `@zhic/ui`. Add to `base.css` or a new `focus.css` layer:

```css
:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: 2px;
  transition: outline-color var(--dur-hover) var(--ease-out-soft);
}

:focus:not(:focus-visible) {
  outline: none;
}
```

This replaces the current per-component `ring-*` utilities with one system-wide rule. Components that need to override (e.g., inputs that use `box-shadow` instead of `outline`) can do so locally.

Remove all existing `focus:ring-*` and `ring-offset-*` utilities from component classes — the global rule handles it.

### 2.5 Card Image Zoom

Add to card image containers (the `<div>` wrapping `<img>` or placeholder):

```css
.card-image img,
.card-image .placeholder {
  transition: transform 1200ms var(--ease-out-soft);
}

.card:hover .card-image img,
.card:hover .card-image .placeholder {
  transform: scale(1.02);
}
```

This is a separate, slower transition from the card lift (720ms). The image keeps zooming slightly after the card has finished lifting — creating a two-layer choreography.

### 2.6 Scroll Entrance Refinements

**`apps/web/src/components/motion/BlockReveal.tsx`:**
- Increase default duration from 720ms to 900ms
- Add optional `stagger` prop (number, milliseconds). When used in a list context, each child delays by `index * stagger`. Default: `undefined` (no stagger).
- Add optional `delay` prop for manual delay control

**`apps/web/src/components/motion/WordReveal.tsx`:**
- Increase character stagger from 60ms to 80ms

**New: `apps/web/src/components/motion/PageReveal.tsx`:**

A wrapper component that assigns staggered `animation-delay` to its direct children:

```tsx
interface PageRevealProps {
  children: React.ReactNode;
  stagger?: number; // ms between each child, default 150
}
```

Uses CSS `@keyframes reveal-up`:
```css
@keyframes reveal-up {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

Each child gets `animation: reveal-up var(--dur-appear) var(--ease-out-soft) both` with `animation-delay: calc(var(--reveal-index) * 150ms)`. The `--reveal-index` CSS variable is set via `style` prop on each child.

Respects `prefers-reduced-motion`: fallback to `opacity` only, no `translateY`.

---

## Pass 3: Expansion — Missing Components & Pattern Extraction

### 3.1 Extract Duplicated Patterns

**`PayloadImage` component → `packages/ui/src/PayloadImage.tsx`:**

```tsx
interface PayloadImageProps {
  src?: string | null;
  alt: string;
  aspect?: '1/1' | '4/5' | '3/2' | '16/9';
  sizes?: string;
  className?: string;
  priority?: boolean;
}
```

Handles: `mediaUrl()` resolution, cream placeholder when `src` is null/undefined, `aspect-ratio` via the `Aspect` component, `loading="lazy"` by default (`priority` overrides to `"eager"`). Uses `<img>` tag for now (will become `next/image` after infra session 7.1 when `remotePatterns` are configured).

Refactor all 7 duplicated cover patterns to use `<PayloadImage>`.

**`CloseButton` → `packages/ui/src/internal/CloseButton.tsx`:**

Extract the identical close button from Modal and Drawer. Internal export (not in the public barrel). Props: `onClose`, `label` (default: `"بستن"`), `className`.

Uses `IconButton` once that component exists (Pass 3.2). Until then, keeps its current inline implementation but in one place.

**Accordion extraction — see §3.2.**

**Tabs extraction — see §3.2.**

**Pagination promotion — see §3.4.**

### 3.2 New Atoms

**`IconButton` → `packages/ui/src/IconButton.tsx`:**

```tsx
interface IconButtonProps {
  variant?: 'default' | 'subtle';
  size?: 'sm' | 'md' | 'lg';
  label: string; // required aria-label
  children: React.ReactNode; // icon
  as?: 'button' | 'a';
  disabled?: boolean;
}
```

| Variant | Rest | Hover |
|---|---|---|
| `default` | `border-sand bg-transparent` | `border-charcoal` |
| `subtle` | `bg-transparent` no border | `bg-cream` |

Sizes: `sm` = 32×32px, `md` = 40×40px, `lg` = 48×48px. Icon centered. Border-radius: `radius-md` (4px). Focus: forest ring. Transition: 720ms.

Replaces: SiteHeader hamburger button, Modal/Drawer close buttons, ImageGallery nav buttons.

**`Link` → `packages/ui/src/Link.tsx`:**

```tsx
interface LinkProps {
  variant?: 'inline' | 'standalone';
  href: string;
  external?: boolean; // adds rel="noopener noreferrer" and target="_blank"
  children: React.ReactNode;
}
```

| Variant | Rest | Hover |
|---|---|---|
| `inline` | `text-charcoal`, underline with `border-b border-sand` | `border-b-charcoal` |
| `standalone` | `text-charcoal font-regular`, no underline | `font-bold` |

Transition: 720ms. Focus: forest ring. External links get an optional trailing arrow icon.

**`Divider` → `packages/ui/src/Divider.tsx`:**

```tsx
interface DividerProps {
  variant?: 'subtle' | 'strong';
  spacing?: 'sm' | 'md' | 'lg';
}
```

| Variant | Color |
|---|---|
| `subtle` | `border-sand` (1px) |
| `strong` | `border-stone` (1px) |

| Spacing | Value |
|---|---|
| `sm` | `my-4` (space-4 = 16px) |
| `md` | `my-6` (space-6 = 32px) |
| `lg` | `my-8` (space-8 = 64px) |

Renders as `<hr>` with `role="separator"`.

**`Spinner` → `packages/ui/src/Spinner.tsx`:**

```tsx
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string; // aria-label, defaults to "در حال بارگذاری"
}
```

Sizes: `sm` = 16px, `md` = 24px, `lg` = 32px. SVG circle with `stroke="currentColor"` — inherits text color from parent. Animation: `rotate 1200ms linear infinite` (uses `--dur-glacial`). Thick stroke (2.5px), 270° arc.

Extract from Button's inline spinner. Button then imports `<Spinner size="sm">` internally.

**`Skeleton` → `packages/ui/src/Skeleton.tsx`:**

```tsx
interface SkeletonProps {
  variant?: 'text' | 'block' | 'circle';
  width?: string;
  height?: string;
  lines?: number; // for variant="text", renders multiple lines
}
```

| Variant | Shape |
|---|---|
| `text` | Rounded rectangle, height ~1em, width 100% (last line 60% if `lines > 1`) |
| `block` | Rectangle, uses `width` and `height` props |
| `circle` | Circle, uses `width` as diameter |

Shimmer animation: `background: linear-gradient(90deg, var(--color-cream) 25%, var(--color-sand) 50%, var(--color-cream) 75%)` with `background-size: 200%`, animated at `--dur-glacial` (1200ms). Slow shimmer matching the brand personality.

`prefers-reduced-motion`: static `bg-cream`, no animation.

**`Toggle` → `packages/ui/src/Toggle.tsx`:**

```tsx
interface ToggleProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  size?: 'sm' | 'md';
}
```

Built on `<button role="switch">` for accessibility. Track: `bg-sand` off → `bg-charcoal` on. Thumb: `bg-stone` off → `bg-ivory` on. No brand color — purely neutral. Thumb slides with `720ms var(--ease-out-soft)`. Focus: forest ring on the track element.

Size `sm`: track 36×20px, thumb 16px. Size `md`: track 44×24px, thumb 20px.

**`Tooltip` → `packages/ui/src/Tooltip.tsx`:**

```tsx
interface TooltipProps {
  content: React.ReactNode;
  side?: 'top' | 'bottom' | 'start' | 'end'; // logical sides
  align?: 'start' | 'center' | 'end';
  delay?: number; // ms, default 400
  children: React.ReactElement; // trigger element
}
```

Appearance: `bg-ink text-ivory` at `text-small` size. Border-radius: `radius-md`. Padding: `space-2 space-3`. Max-width: 240px.

Shows on hover/focus of trigger with `400ms` delay (deliberate, not instant). Fade in: `opacity 0→1` at `var(--dur-base)` (480ms). Arrow: optional, rendered via CSS `::before` pseudo-element on the tooltip.

Positioned with logical properties (`inset-inline-start`, etc.) for RTL correctness. Uses `React.cloneElement` to attach event handlers to the trigger child. Portal to `document.body` to avoid overflow clipping.

Accessible: `role="tooltip"`, trigger gets `aria-describedby` pointing to tooltip `id`.

### 3.3 New Molecules

**`Accordion` → `packages/ui/src/Accordion.tsx`:**

```tsx
interface AccordionProps {
  type?: 'single' | 'multiple'; // single: only one item open at a time
  defaultOpen?: string[]; // item ids
  children: React.ReactNode; // AccordionItem children
}

interface AccordionItemProps {
  id: string;
  title: React.ReactNode;
  children: React.ReactNode; // panel content
  disabled?: boolean;
}
```

Built on `<details>/<summary>` for native accessibility.

Summary row: `text-body font-bold`, padding `space-4 0`, `border-b border-sand`. Chevron on the inline-end side, rotates 180° on open at 720ms.

Content panel: animated height via `grid-template-rows: 0fr → 1fr` CSS trick with `720ms var(--ease-out-soft)`. Content wrapper has `overflow: hidden`.

For `type="single"`: JavaScript coordination via context — opening one item closes others (dispatches `toggle` events).

Refactor `ProductSpecsAccordion` and `FaqAccordion` to use `<Accordion>`.

**`Tabs` → `packages/ui/src/Tabs.tsx`:**

```tsx
interface TabsProps {
  defaultValue?: string;
  children: React.ReactNode; // TabList + TabPanels
}

interface TabListProps {
  children: React.ReactNode; // Tab children
  label: string; // aria-label for the tablist
}

interface TabProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
}

interface TabPanelProps {
  value: string;
  children: React.ReactNode;
}
```

Tab appearance: `text-stone font-regular`, hover: `text-charcoal`. Active: `text-charcoal font-bold`.

Active indicator: a `1.5px` bottom border in `var(--color-forest)`. Implemented as a pseudo-element on the active tab with `transition: transform 720ms var(--ease-out-soft)` that slides between tab positions (using `translateX` computed from tab widths).

Keyboard: Arrow keys move focus between tabs (wraps). Home/End jump to first/last. Enter/Space activate. Follows WAI-ARIA Tabs pattern.

Refactor `ProductMediaStage` TabButton to use `<Tabs>`.

**`FilterNav` → `packages/ui/src/FilterNav.tsx`:**

```tsx
interface FilterNavProps {
  items: Array<{ value: string; label: string; href: string }>;
  activeValue?: string;
  label: string; // aria-label for the nav
}
```

Horizontal scrollable row of pill-shaped links. Inactive: `bg-cream text-stone`. Active: `bg-charcoal text-ivory`. Transition between states: 720ms. Overflow: `overflow-x-auto` with `scrollbar-width: none` for clean horizontal scroll. Snap: `snap-x snap-mandatory`, each pill is `snap-start`.

Refactor `JournalCategoryNav` to use `<FilterNav>`.

### 3.4 Promote from App-Layer

**Pagination → `packages/ui/src/Pagination.tsx`:**

Move from `apps/web/src/components/products/Pagination.tsx` to `packages/ui/src/`.

Updates during promotion:
- Page number buttons become instances of a shared internal button style (not full `<Button>`, just a consistent clickable with the interaction language)
- Current page: `bg-charcoal text-ivory`
- Other pages: `text-stone`, hover: `text-charcoal bg-cream` (light shift)
- Prev/next arrows: use `<IconButton variant="subtle">` once available
- All transitions: 720ms
- Focus: forest ring
- Keep existing `rel="prev"` / `rel="next"` for SEO
- Keep existing `aria-label` on page links

### 3.5 ProductFilters Alignment

Replace raw `<input type="radio">` and `<input type="checkbox">` in `apps/web/src/components/products/ProductFilters.tsx` with `@zhic/ui` `<Radio>` and `<Checkbox>` components.

If the current `<Radio>` and `<Checkbox>` component APIs don't support the composition needed in `ProductFilters` (where they're inside `<fieldset>/<legend>`), extend the API:
- Add an optional `labelPosition?: 'end' | 'none'` prop
- When `labelPosition="none"`, render only the control without the wrapping `<label>` — the caller manages labeling via `<fieldset>/<legend>` or explicit `aria-label`

### 3.6 Minor Component Fixes

**`Button.tsx` — link variant padding collision:**
When `variant="link"`, set padding to `0` and skip `SIZE_CLASSES` entirely. Add a guard:
```tsx
const sizeClass = variant === 'link' ? '' : SIZE_CLASSES[size];
```

**`Modal.tsx` and `Drawer.tsx` — missing `aria-modal`:**
Add `aria-modal="true"` to the `<dialog>` element in both components.

**`FormField.tsx` — RadioGroup compatibility:**
When the child is a `RadioGroup` (detect via `displayName` or a `role` check), use `aria-labelledby` pointing to the FormField's label `id` instead of `htmlFor`. The label becomes a visible `<span>` with an `id`, and the RadioGroup gets `aria-labelledby={labelId}`.

**`ProductPurchasePanel.tsx` — token misuse:**
Change `className="text-display"` on the product name to `text-h2`. `text-display` is reserved for hero headlines only.

**`ShowroomCard` — ASCII digits in hours:**
Pipe `hoursSummary` through `toPersianDigits()` before rendering.

**`PhoneLink` — fallback bidi:**
Remove `dir="ltr"` from the fallback `<span>` that renders Persian digits. Persian-digit content should be in the default RTL flow.

**`SiteFooter` — hardcoded columns:**
Replace `md:grid-cols-4` with a dynamic class based on `columns.length`:
```tsx
const colClass = { 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4' }[columns.length] ?? 'md:grid-cols-4';
```

---

## Barrel Export Updates

After all three passes, update `packages/ui/src/index.ts` to export:

New exports:
- `IconButton`
- `Link`
- `Divider`
- `Spinner`
- `Skeleton`
- `Toggle`
- `Tooltip`
- `Accordion`, `AccordionItem`
- `Tabs`, `TabList`, `Tab`, `TabPanel`
- `FilterNav`
- `Pagination`
- `PayloadImage`
- `PageReveal`

Existing exports remain unchanged.

---

## Files Modified (Summary)

### Pass 1
- `packages/design-system/css/tokens.css` — palette rename, new glass/shadow/interaction tokens
- `packages/design-system/css/theme.css` — new Tailwind aliases, overlay, container widths
- `packages/design-system/css/base.css` — glass system rewrite, reduced-motion fix
- `packages/design-system/src/tokens/color.ts` — palette rename
- `packages/design-system/src/tokens/shadows.ts` — add subtle, card, elevated
- `packages/design-system/src/tokens/motion.ts` — add hover, appear, dialog
- `packages/design-system/src/tokens/glass.ts` — new file
- `packages/design-system/src/index.ts` — export glass tokens
- `packages/ui/src/Container.tsx` — gutter fix
- `apps/web/src/components/motion/BackToTop.tsx` — class fix
- `apps/web/src/components/journal/TableOfContents.tsx` — class fix
- `apps/web/src/components/showrooms/ShowroomHolidayHours.tsx` — bidi fix
- `apps/web/src/components/showrooms/ShowroomHoursTable.tsx` — bidi fix
- `packages/ui/src/SiteHeader.tsx` — useEffect fix
- `apps/web/src/app/lab/color/page.tsx` — full rewrite
- `apps/web/src/app/lab/type/page.tsx` — full rewrite
- All files containing `saffron` or `moss` class references — rename to `gold` / `forest`

### Pass 2
- `packages/ui/src/Button.tsx` — interaction states, link variant fix
- `packages/ui/src/cardClasses.ts` — hover choreography
- `packages/ui/src/controlClasses.ts` — hover/focus states
- `packages/ui/src/Checkbox.tsx` — interaction states
- `packages/ui/src/Radio.tsx` — interaction states
- `packages/ui/src/Tag.tsx` — simplify to neutral-only
- `packages/ui/src/Breadcrumbs.tsx` — hover transitions
- `packages/ui/src/SiteHeader.tsx` — nav link transitions
- `packages/ui/src/Modal.tsx` — open/close animation, aria-modal
- `packages/ui/src/Drawer.tsx` — slide animation, aria-modal
- `packages/design-system/css/base.css` — global focus ring rules
- `apps/web/src/components/motion/BlockReveal.tsx` — duration + stagger prop
- `apps/web/src/components/motion/WordReveal.tsx` — stagger timing
- `apps/web/src/components/motion/PageReveal.tsx` — new file

### Pass 3
- `packages/ui/src/PayloadImage.tsx` — new
- `packages/ui/src/internal/CloseButton.tsx` — new (extracted)
- `packages/ui/src/IconButton.tsx` — new
- `packages/ui/src/Link.tsx` — new
- `packages/ui/src/Divider.tsx` — new
- `packages/ui/src/Spinner.tsx` — new (extracted + standalone)
- `packages/ui/src/Skeleton.tsx` — new
- `packages/ui/src/Toggle.tsx` — new
- `packages/ui/src/Tooltip.tsx` — new
- `packages/ui/src/Accordion.tsx` — new
- `packages/ui/src/Tabs.tsx` — new
- `packages/ui/src/FilterNav.tsx` — new
- `packages/ui/src/Pagination.tsx` — promoted from app-layer
- `packages/ui/src/index.ts` — barrel export update
- `apps/web/src/components/products/ProductFilters.tsx` — use @zhic/ui controls
- `apps/web/src/components/products/ProductPurchasePanel.tsx` — token fix
- `apps/web/src/components/showrooms/ShowroomCard.tsx` — Persian digits fix
- `packages/ui/src/PhoneLink.tsx` — bidi fix
- `packages/ui/src/SiteFooter.tsx` — dynamic columns
- `packages/ui/src/FormField.tsx` — RadioGroup compatibility
- All 7 cover image duplications — refactored to use PayloadImage
- `apps/web/src/components/products/ProductSpecsAccordion.tsx` — refactored to use Accordion
- `apps/web/src/components/faq/FaqAccordion.tsx` — refactored to use Accordion
- `apps/web/src/components/products/ProductMediaStage.tsx` — refactored to use Tabs
- `apps/web/src/components/journal/JournalCategoryNav.tsx` — refactored to use FilterNav
