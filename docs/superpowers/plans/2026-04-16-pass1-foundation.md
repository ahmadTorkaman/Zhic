# Pass 1: Foundation — Token System & Bug Fixes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the design-system token foundation — new brand palette (forest + caramel), glass/shadow/interaction tokens, bug fixes, and stale lab page rewrites — so that Pass 2 (interaction language) and Pass 3 (component expansion) build on a correct, complete token system.

**Architecture:** All changes flow from `packages/design-system` outward. Token CSS and TS sources are updated first, then Tailwind theme bindings, then consuming components and lab pages. No new components are created (except lab page rewrites). The token rename (saffron→gold, moss→forest) is a global find-and-replace across code files only — docs are updated for consistency but don't affect runtime.

**Tech Stack:** CSS custom properties, Tailwind CSS v4 `@theme inline`, TypeScript const objects, Next.js App Router pages, React Server Components.

**Spec reference:** `docs/superpowers/specs/2026-04-16-ui-elevation-design.md` — Pass 1, sections 1.1–1.6.

---

### Task 1: Palette rename — CSS token source

**Files:**
- Modify: `packages/design-system/css/tokens.css:17-20`

- [ ] **Step 1: Update color tokens in tokens.css**

Replace the saffron and moss lines:

```css
  --color-saffron: #C68A2E;
```
→
```css
  --color-gold: #C49A6C;
```

```css
  --color-moss: #5A6B4F;
```
→
```css
  --color-forest: #5F7760;
```

- [ ] **Step 2: Verify tokens.css is valid**

Run: `cat packages/design-system/css/tokens.css | grep -E 'gold|forest'`
Expected: Two lines showing the new token names and values.

- [ ] **Step 3: Commit**

```bash
git add packages/design-system/css/tokens.css
git commit -m "tokens: rename saffron→gold (#C49A6C), moss→forest (#5F7760)"
```

---

### Task 2: Palette rename — Tailwind theme binding

**Files:**
- Modify: `packages/design-system/css/theme.css:18-21`

- [ ] **Step 1: Update theme.css color aliases**

Replace:
```css
  --color-saffron: var(--color-saffron);
  --color-rust: var(--color-rust);
  --color-moss: var(--color-moss);
```
With:
```css
  --color-gold: var(--color-gold);
  --color-rust: var(--color-rust);
  --color-forest: var(--color-forest);
```

This makes `bg-gold`, `text-gold`, `bg-forest`, `text-forest` available as Tailwind utilities.

- [ ] **Step 2: Commit**

```bash
git add packages/design-system/css/theme.css
git commit -m "theme: rename saffron→gold, moss→forest Tailwind aliases"
```

---

### Task 3: Palette rename — TypeScript token mirror

**Files:**
- Modify: `packages/design-system/src/tokens/color.ts`

- [ ] **Step 1: Update color.ts**

Replace the full file content with:

```ts
/**
 * Color tokens. Source of truth: docs/spec/design-system.md §2.1.
 *
 * The storefront lives in ivory + charcoal. Sand and cream are for
 * separation and hairlines. Gold is a once-per-page maximum.
 * No pure black, no pure white anywhere.
 */
export const color = {
  ivory: '#FAFAF7',
  cream: '#F5F0EB',
  sand: '#E8E0D8',
  stone: '#8C8279',
  charcoal: '#2C2825',
  ink: '#14110F',
  accent: '#B8A898',
  gold: '#C49A6C',
  rust: '#8B4A2B',
  forest: '#5F7760',
  overlay: 'rgba(20, 17, 15, 0.6)',
} as const;

export type ColorToken = keyof typeof color;
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /home/ahmad/Zhic && pnpm tsc --noEmit --project packages/design-system/tsconfig.json 2>&1 | head -20`
Expected: No errors (clean output or only unrelated warnings).

- [ ] **Step 3: Commit**

```bash
git add packages/design-system/src/tokens/color.ts
git commit -m "tokens(ts): rename saffron→gold, moss→forest with new hex values"
```

---

### Task 4: Palette rename — global sweep across all consuming files

**Files:**
- Modify: `packages/ui/src/Badge.tsx:18-19`
- Modify: `apps/web/src/app/lab/tokens/page.tsx:159-160`
- Potentially modify: any other `.tsx`, `.ts`, `.css` files containing `saffron` or `moss` class references

- [ ] **Step 1: Run global search to find all remaining occurrences**

Run: `grep -rn --include='*.tsx' --include='*.ts' --include='*.css' -E '\bsaffron\b|\bmoss\b' packages/ apps/ --exclude-dir=node_modules --exclude-dir=.next`

Known hits from audit:
- `packages/ui/src/Badge.tsx:18` — `bg-moss`
- `packages/ui/src/Badge.tsx:19` — `bg-saffron`
- `apps/web/src/app/lab/tokens/page.tsx:159` — `bg-saffron/20`
- `apps/web/src/app/lab/tokens/page.tsx:160` — `bg-moss/20`
- `apps/web/src/app/lab/color/page.tsx:11` — `moss` (will be replaced in Task 15 full rewrite)

If the grep finds additional hits not listed above, fix them in this step using the same pattern: `saffron` → `gold`, `moss` → `forest`.

- [ ] **Step 2: Update Badge.tsx**

In `packages/ui/src/Badge.tsx`, replace:
```ts
  success: 'bg-moss text-ivory',
  warning: 'bg-saffron text-ink',
```
With:
```ts
  success: 'bg-forest text-ivory',
  warning: 'bg-gold text-ink',
```

- [ ] **Step 3: Update lab/tokens/page.tsx**

In `apps/web/src/app/lab/tokens/page.tsx`, replace:
```tsx
<span className="bg-saffron/20 ps-4">ps-4 (padding-inline-start)</span>
```
With:
```tsx
<span className="bg-gold/20 ps-4">ps-4 (padding-inline-start)</span>
```

And replace:
```tsx
<span className="bg-moss/20 pe-4">pe-4 (padding-inline-end)</span>
```
With:
```tsx
<span className="bg-forest/20 pe-4">pe-4 (padding-inline-end)</span>
```

- [ ] **Step 4: Fix any additional hits found in Step 1**

For each file found in the grep that isn't already handled by Tasks 1-3 or Tasks 15-16 (lab rewrites), apply the rename: every `saffron` Tailwind class → `gold`, every `moss` Tailwind class → `forest`.

- [ ] **Step 5: Verify zero remaining occurrences in runtime code**

Run: `grep -rn --include='*.tsx' --include='*.ts' --include='*.css' -E '\bsaffron\b|\bmoss\b' packages/ apps/ --exclude-dir=node_modules --exclude-dir=.next`
Expected: Zero hits (lab/color is handled by Task 15 rewrite).

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/Badge.tsx apps/web/src/app/lab/tokens/page.tsx
# Add any additional files found in Step 1:
# git add <additional-files>
git commit -m "components: global saffron→gold, moss→forest class rename"
```

---

### Task 5: New tokens — glass, shadow, interaction in CSS

**Files:**
- Modify: `packages/design-system/css/tokens.css` (add new token blocks)

- [ ] **Step 1: Add glass tokens after the shadow section**

In `packages/design-system/css/tokens.css`, after the line `--shadow-modal: 0 24px 64px -24px rgba(20, 17, 15, 0.18);`, add:

```css

  /* ── Glass surfaces ──────────────────────────────────────────── */
  --glass-bg: rgba(250, 250, 247, 0.6);
  --glass-border: rgba(232, 224, 216, 0.5);
  --glass-blur: 24px;
```

- [ ] **Step 2: Add expanded shadow tokens**

In the same shadows section, between `--shadow-none: none;` and `--shadow-modal:`, add:

```css
  --shadow-subtle: 0 2px 8px rgba(20, 17, 15, 0.03);
  --shadow-card: 0 8px 32px rgba(20, 17, 15, 0.04);
  --shadow-elevated: 0 12px 40px rgba(20, 17, 15, 0.08);
```

- [ ] **Step 3: Add interaction tokens after the motion section**

After the line `--reveal-x: 24px;` (but still inside `:root`), add:

```css

  /* ── Interaction (§ new) ─────────────────────────────────────── */
  --dur-hover: 720ms;
  --dur-appear: 720ms;
  --dur-dialog: 600ms;
  --hover-lift: -2px;
  --hover-lift-card: -3px;
  --focus-ring-width: 2px;
  --focus-ring-color: rgba(95, 119, 96, 0.3);
```

- [ ] **Step 4: Commit**

```bash
git add packages/design-system/css/tokens.css
git commit -m "tokens: add glass, shadow scale, and interaction tokens"
```

---

### Task 6: New tokens — Tailwind theme wiring

**Files:**
- Modify: `packages/design-system/css/theme.css`

**Note:** Glass tokens (`--glass-bg`, `--glass-border`, `--glass-blur`), interaction tokens (`--dur-hover`, `--hover-lift`, `--focus-ring-*`), are consumed via `var()` references in CSS classes (`.glass`, `.glass-card`, etc.) and component `style` props — they do not need Tailwind utility aliases. Only shadow tokens get aliases because Tailwind has a `shadow-*` namespace.

- [ ] **Step 1: Add shadow aliases to theme.css**

In the `/* ── Shadows */` section, after `--shadow-modal: var(--shadow-modal);`, add:

```css
  --shadow-subtle: var(--shadow-subtle);
  --shadow-card: var(--shadow-card);
  --shadow-elevated: var(--shadow-elevated);
```

- [ ] **Step 2: Add overlay color alias**

In the `/* ── Color */` section, after `--color-forest: var(--color-forest);`, add:

```css
  --color-overlay: var(--color-overlay);
```

- [ ] **Step 3: Add container width aliases**

After the breakpoints section at the bottom of `@theme inline`, add:

```css

  /* ── Container widths ──────────────────────────────────────────── */
  --width-container-storefront: var(--container-storefront);
  --width-container-operator: var(--container-operator);
```

- [ ] **Step 4: Commit**

```bash
git add packages/design-system/css/theme.css
git commit -m "theme: wire shadow scale, overlay, container widths into Tailwind"
```

---

### Task 7: New tokens — TypeScript mirrors

**Files:**
- Modify: `packages/design-system/src/tokens/shadows.ts`
- Modify: `packages/design-system/src/tokens/motion.ts`
- Create: `packages/design-system/src/tokens/glass.ts`
- Modify: `packages/design-system/src/index.ts`

- [ ] **Step 1: Update shadows.ts**

Replace the full file content with:

```ts
/**
 * Shadow tokens. Source: docs/spec/design-system.md §2.6.
 *
 * Hairlines preferred over shadows. Cards use subtle/card on hover.
 * Elevated for interactive lift moments. Modal for dialogs only.
 */
export const shadow = {
  none: 'none',
  subtle: '0 2px 8px rgba(20, 17, 15, 0.03)',
  card: '0 8px 32px rgba(20, 17, 15, 0.04)',
  elevated: '0 12px 40px rgba(20, 17, 15, 0.08)',
  modal: '0 24px 64px -24px rgba(20, 17, 15, 0.18)',
} as const;

export type ShadowToken = keyof typeof shadow;
```

- [ ] **Step 2: Update motion.ts**

Replace the full file content with:

```ts
/**
 * Motion tokens. Source: docs/spec/design-system.md §6.3.
 *
 * Storefront defaults to slow, choreographed motion. Operator apps
 * default to a reduced, functional vocabulary. Shared easings.
 */

export const duration = {
  // Storefront
  instant: '100ms',
  fast: '240ms',
  base: '480ms',
  slow: '720ms',
  glacial: '1200ms',

  // Operator
  opFast: '120ms',
  opBase: '180ms',
  opSlow: '280ms',

  // Interaction
  hover: '720ms',
  appear: '720ms',
  dialog: '600ms',
} as const;

export const easing = {
  outSoft: 'cubic-bezier(0.22, 1, 0.36, 1)',
  inSoft: 'cubic-bezier(0.64, 0, 0.78, 0)',
  inOutSoft: 'cubic-bezier(0.65, 0, 0.35, 1)',
  expoOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
} as const;

export type DurationToken = keyof typeof duration;
export type EasingToken = keyof typeof easing;
```

- [ ] **Step 3: Create glass.ts**

Create `packages/design-system/src/tokens/glass.ts`:

```ts
/**
 * Glass surface tokens. Warm frosted translucency over ivory.
 * Used for elevated panels, inquiry forms, and overlay cards.
 */
export const glass = {
  bg: 'rgba(250, 250, 247, 0.6)',
  border: 'rgba(232, 224, 216, 0.5)',
  blur: '24px',
} as const;

export type GlassToken = keyof typeof glass;
```

- [ ] **Step 4: Update index.ts barrel export**

In `packages/design-system/src/index.ts`, after the motion exports, add:

```ts

export { glass } from './tokens/glass';
export type { GlassToken } from './tokens/glass';
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd /home/ahmad/Zhic && pnpm tsc --noEmit --project packages/design-system/tsconfig.json 2>&1 | head -20`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add packages/design-system/src/tokens/shadows.ts packages/design-system/src/tokens/motion.ts packages/design-system/src/tokens/glass.ts packages/design-system/src/index.ts
git commit -m "tokens(ts): add glass, shadow scale, interaction duration mirrors"
```

---

### Task 8: Glass system rewrite in base.css

**Files:**
- Modify: `packages/design-system/css/base.css` (glass section + reduced-motion)

- [ ] **Step 1: Replace the glass section**

In `packages/design-system/css/base.css`, replace the entire glass section (from `/* ── Glass surfaces */` through the end of `.glass-input:focus`) with:

```css
/* ── Glass surfaces ──────────────────────────────────────────────── */

.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
}

.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-subtle);
  transition: all var(--dur-hover) var(--ease-out-soft);
}

@media (prefers-reduced-motion: no-preference) {
  .glass-card:hover {
    background: rgba(250, 250, 247, 0.75);
    box-shadow: var(--shadow-card);
    transform: translateY(var(--hover-lift));
  }
}

@media (prefers-reduced-motion: reduce) {
  .glass-card:hover {
    background: rgba(250, 250, 247, 0.75);
    box-shadow: var(--shadow-card);
  }
}

.glass-input {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  transition: border-color var(--dur-hover) var(--ease-out-soft),
              box-shadow var(--dur-hover) var(--ease-out-soft);
}

.glass-input:focus {
  border-color: var(--color-forest);
  box-shadow: 0 0 0 var(--focus-ring-width) var(--focus-ring-color);
  outline: none;
}
```

- [ ] **Step 2: Verify no raw hex values remain in glass classes**

Run: `grep -A5 '\.glass' packages/design-system/css/base.css | grep -E 'rgba\(255|rgba\(44|rgba\(184'`
Expected: No output (all raw hex values replaced with token variables).

- [ ] **Step 3: Commit**

```bash
git add packages/design-system/css/base.css
git commit -m "base: rewrite glass system to use token variables, fix reduced-motion"
```

---

### Task 9: Gutter alignment

**Files:**
- Modify: `packages/ui/src/Container.tsx:31`

- [ ] **Step 1: Fix Container horizontal padding**

In `packages/ui/src/Container.tsx`, replace:
```tsx
        'mx-auto w-full px-5 lg:px-7',
```
With:
```tsx
        'mx-auto w-full px-4 lg:px-6',
```

This aligns with the spec: space-4 (16px) mobile, space-6 (32px) desktop — matching the `gutter` export in `spacing.ts` which already has the correct values (`mobile: spacing[4]`, `desktop: spacing[6]`). No change needed to `spacing.ts`.

- [ ] **Step 2: Verify spacing.ts gutter values match**

Run: `grep -A2 'gutter' packages/design-system/src/tokens/spacing.ts`
Expected:
```
export const gutter = {
  desktop: spacing[6], // 32px
  mobile: spacing[4],  // 16px
```
These are already correct. If they differ, update to match.

- [ ] **Step 3: Commit**

```bash
git add packages/ui/src/Container.tsx
git commit -m "fix(Container): align gutter to spec (px-4 mobile, px-6 desktop)"
```

---

### Task 10: Bug fix — BackToTop invalid CSS class

**Files:**
- Modify: `apps/web/src/components/motion/BackToTop.tsx:33`

- [ ] **Step 1: Fix the invalid Tailwind class and z-index**

In `apps/web/src/components/motion/BackToTop.tsx`, replace the className array:

```tsx
      className={[
        'fixed bottom-6 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-sand bg-ivory shadow-md transition-all',
        'duration-[var(--dur-fast)] ease-[var(--ease-out-soft)]',
        'hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:ring-offset-2',
        'inset-inline-start-6',
        visible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-4 opacity-0 pointer-events-none',
      ].join(' ')}
```

With:

```tsx
      className={[
        'fixed bottom-6 z-[var(--z-header)] flex h-11 w-11 items-center justify-center rounded-full border border-sand bg-ivory shadow-md transition-all',
        'duration-[var(--dur-fast)] ease-[var(--ease-out-soft)]',
        'hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:ring-offset-2',
        'start-6',
        visible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-4 opacity-0 pointer-events-none',
      ].join(' ')}
```

Two changes: `inset-inline-start-6` → `start-6` (valid Tailwind v4 logical utility), `z-50` → `z-[var(--z-header)]` (use token).

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/motion/BackToTop.tsx
git commit -m "fix(BackToTop): use valid start-6 class and z-index token"
```

---

### Task 11: Bug fix — TableOfContents invalid CSS classes

**Files:**
- Modify: `apps/web/src/components/journal/TableOfContents.tsx:49,55`

- [ ] **Step 1: Fix border utility names**

In `apps/web/src/components/journal/TableOfContents.tsx`, replace:

```tsx
          <ul className="flex flex-col gap-1 border-inline-start border-sand">
```
With:
```tsx
          <ul className="flex flex-col gap-1 border-s border-sand">
```

And replace:
```tsx
                  'block border-inline-start-2 py-1 text-small transition-colors',
```
With:
```tsx
                  'block border-s-2 py-1 text-small transition-colors',
```

`border-s` maps to `border-inline-start` in Tailwind v4. `border-inline-start` is not a valid utility name.

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/journal/TableOfContents.tsx
git commit -m "fix(TableOfContents): use valid border-s/border-s-2 Tailwind utilities"
```

---

### Task 12: Bug fix — ShowroomHolidayHours bidi

**Files:**
- Modify: `apps/web/src/components/showrooms/ShowroomHolidayHours.tsx:21-30`

- [ ] **Step 1: Fix the dir="ltr" wrapping**

In `apps/web/src/components/showrooms/ShowroomHolidayHours.tsx`, replace:

```tsx
            <span dir="ltr">
              {h.closed ? (
                'تعطیل'
              ) : h.opens && h.closes ? (
                `${toPersianDigits(h.opens)} – ${toPersianDigits(h.closes)}`
              ) : (
                ''
              )}
            </span>
```

With:

```tsx
            <span>
              {h.closed ? (
                'تعطیل'
              ) : h.opens && h.closes ? (
                <span dir="ltr">{toPersianDigits(h.opens)} – {toPersianDigits(h.closes)}</span>
              ) : (
                ''
              )}
            </span>
```

The `dir="ltr"` now only wraps the time range (ASCII-origin content), not the Persian "تعطیل" text.

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/showrooms/ShowroomHolidayHours.tsx
git commit -m "fix(ShowroomHolidayHours): don't wrap Persian text in dir=ltr"
```

---

### Task 13: Bug fix — ShowroomHoursTable bidi

**Files:**
- Modify: `apps/web/src/components/showrooms/ShowroomHoursTable.tsx:48-52`

- [ ] **Step 1: Fix the dir="ltr" on the td**

In `apps/web/src/components/showrooms/ShowroomHoursTable.tsx`, replace:

```tsx
              <td className="py-2 ps-4 pe-0 text-end text-stone" dir="ltr">
                {isClosed ? (
                  <span className="text-stone">تعطیل</span>
                ) : (
                  formatRange(entry?.opens, entry?.closes)
                )}
              </td>
```

With:

```tsx
              <td className="py-2 ps-4 pe-0 text-end text-stone">
                {isClosed ? (
                  <span className="text-stone">تعطیل</span>
                ) : (
                  <span dir="ltr">{formatRange(entry?.opens, entry?.closes)}</span>
                )}
              </td>
```

The `dir="ltr"` moves from the `<td>` (which also contained Persian text) to a `<span>` wrapping only the time range.

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/showrooms/ShowroomHoursTable.tsx
git commit -m "fix(ShowroomHoursTable): isolate dir=ltr to time range only"
```

---

### Task 14: Bug fix — SiteHeader render-time side effect

**Files:**
- Modify: `packages/ui/src/SiteHeader.tsx:33-39`

- [ ] **Step 1: Replace render-time side effect with useEffect**

In `packages/ui/src/SiteHeader.tsx`, remove lines 34-39 (the `lastPathname` state and render-time comparison):

```tsx
  const [lastPathname, setLastPathname] = useState(pathname);

  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    if (menuOpen) setMenuOpen(false);
  }
```

And replace with a `useEffect` after the existing state declarations (after line 33 `const [menuOpen, setMenuOpen] = useState(false);`):

```tsx

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);
```

Also remove `useState` for `lastPathname` — it's no longer needed. The `useState` import on line 5 can stay since it's still used by `scrolled` and `menuOpen`.

- [ ] **Step 2: Verify the import includes useEffect**

The existing line 5 is:
```tsx
import { useEffect, useState, type ReactNode } from 'react';
```
`useEffect` is already imported. No change needed.

- [ ] **Step 3: Commit**

```bash
git add packages/ui/src/SiteHeader.tsx
git commit -m "fix(SiteHeader): move pathname-based menu close to useEffect"
```

---

### Task 15: Rewrite stale lab/color page

**Files:**
- Modify: `apps/web/src/app/lab/color/page.tsx` (full rewrite)

- [ ] **Step 1: Replace the entire file**

Replace `apps/web/src/app/lab/color/page.tsx` with:

```tsx
import { color } from '@zhic/design-system';

const swatches: Array<{
  token: keyof typeof color;
  label: string;
  use: string;
  textClass: string;
}> = [
  { token: 'ivory', label: 'عاج', use: 'پس‌زمینه‌ی صفحه، بوم', textClass: 'text-charcoal' },
  { token: 'cream', label: 'کرِم', use: 'پنل‌ها، بخش‌های جایگزین', textClass: 'text-charcoal' },
  { token: 'sand', label: 'شنی', use: 'جداکننده‌ها، خطوط ظریف، هاور', textClass: 'text-charcoal' },
  { token: 'stone', label: 'سنگی', use: 'متن ثانویه، توضیحات', textClass: 'text-ivory' },
  { token: 'charcoal', label: 'زغالی', use: 'متن اصلی، تیترها', textClass: 'text-ivory' },
  { token: 'ink', label: 'مرکّب', use: 'نزدیک به سیاه، استفاده‌ی کم', textClass: 'text-ivory' },
  { token: 'accent', label: 'تأکید', use: 'تأکید خنثی (خاکی گرم)', textClass: 'text-charcoal' },
  { token: 'gold', label: 'طلایی', use: 'رنگ برند — حداکثر یک‌بار در صفحه', textClass: 'text-charcoal' },
  { token: 'rust', label: 'زنگاری', use: 'خطا / هشدار', textClass: 'text-ivory' },
  { token: 'forest', label: 'جنگلی', use: 'رنگ برند — تأکید اصلی', textClass: 'text-ivory' },
  { token: 'overlay', label: 'پوشش', use: 'پس‌زمینه‌ی مودال و دراور', textClass: 'text-ivory' },
];

export default function ColorLab() {
  return (
    <article className="space-y-16">
      <header>
        <p className="mb-3 text-eyebrow font-bold tracking-wide text-stone">
          آزمایشگاه · رنگ
        </p>
        <h1 className="text-h1 font-black text-ink">پالت رنگ ژیک</h1>
        <p className="mt-4 max-w-xl text-lead font-light text-stone">
          رنگ‌های برند بر پایه‌ی خنثی‌های گرم. طلایی و جنگلی فقط در لحظات
          خاص ظاهر می‌شوند — عاج و زغال بار بصری اصلی را حمل می‌کنند.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-px border border-sand bg-sand md:grid-cols-5">
        {swatches.map((s) => (
          <div key={s.token} className="bg-ivory">
            <div
              className="flex aspect-square w-full items-end p-4 border-b border-sand/40"
              style={{ backgroundColor: color[s.token] as string }}
            >
              <span className={`text-eyebrow font-bold tracking-wide ${s.textClass}`}>
                {color[s.token]}
              </span>
            </div>
            <div className="p-4 space-y-1">
              <div className="text-body font-bold text-charcoal">{s.label}</div>
              <div className="text-eyebrow font-bold tracking-wide text-stone" dir="ltr">
                --color-{s.token}
              </div>
              <p className="text-small text-stone">{s.use}</p>
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-h3 font-bold text-charcoal mb-6">جفت‌های کنتراست</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md bg-ivory p-6 border border-sand">
            <p className="text-body text-charcoal">زغالی روی عاج — متن اصلی بدنه</p>
            <p className="text-small text-stone mt-2">سنگی روی عاج — متن ثانویه</p>
          </div>
          <div className="rounded-md bg-ink p-6">
            <p className="text-body text-ivory">عاجی روی مرکّب — بخش‌های تاریک</p>
            <p className="text-small text-sand mt-2">شنی روی مرکّب — ثانویه‌ی تاریک</p>
          </div>
          <div className="rounded-md bg-cream p-6 border border-sand">
            <p className="text-body text-charcoal">زغالی روی کرِم — پنل‌ها</p>
            <p className="text-small text-forest mt-2">جنگلی روی کرِم — تأکید</p>
          </div>
          <div className="rounded-md bg-charcoal p-6">
            <p className="text-body text-ivory">عاجی روی زغال</p>
            <p className="text-small text-gold mt-2">طلایی روی زغال — لحظه‌ی پاداش</p>
          </div>
        </div>
      </section>
    </article>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/lab/color/page.tsx
git commit -m "lab: rewrite color page with token-driven Persian palette"
```

---

### Task 16: Rewrite stale lab/type page

**Files:**
- Modify: `apps/web/src/app/lab/type/page.tsx` (full rewrite)

- [ ] **Step 1: Replace the entire file**

Replace `apps/web/src/app/lab/type/page.tsx` with:

```tsx
const scale: Array<{
  token: string;
  css: string;
  weight: number;
  weightLabel: string;
  sample: string;
}> = [
  { token: 'display', css: 'text-display', weight: 900, weightLabel: 'فوق‌سیاه ۹۰۰', sample: 'ژیک' },
  { token: 'h1', css: 'text-h1', weight: 900, weightLabel: 'فوق‌سیاه ۹۰۰', sample: 'صنایع چوب ژیک' },
  { token: 'h2', css: 'text-h2', weight: 700, weightLabel: 'سیاه ۷۰۰', sample: 'مبلمان دست‌ساز ایرانی' },
  { token: 'h3', css: 'text-h3', weight: 700, weightLabel: 'سیاه ۷۰۰', sample: 'میز ناهارخوری آرتا' },
  { token: 'h4', css: 'text-h4', weight: 700, weightLabel: 'سیاه ۷۰۰', sample: 'مشخصات فنی محصول' },
  { token: 'lead', css: 'text-lead', weight: 300, weightLabel: 'سبک ۳۰۰', sample: 'ما در کارگاه ژیک با عشق و دقت، هر قطعه را می‌سازیم.' },
  { token: 'body', css: 'text-body', weight: 400, weightLabel: 'معمولی ۴۰۰', sample: 'چوب گردو از جنگل‌های شمال ایران تهیه و با روش‌های سنتی خشک می‌شود.' },
  { token: 'small', css: 'text-small', weight: 400, weightLabel: 'معمولی ۴۰۰', sample: 'ارسال رایگان به سراسر ایران · گارانتی ۵ ساله' },
  { token: 'eyebrow', css: 'text-eyebrow', weight: 700, weightLabel: 'سیاه ۷۰۰', sample: 'کلکسیون بهار ۱۴۰۵' },
];

const weights = [
  { value: 300, label: 'سبک — ۳۰۰', sample: 'آینده — وزن سبک' },
  { value: 400, label: 'معمولی — ۴۰۰', sample: 'آینده — وزن معمولی' },
  { value: 700, label: 'سیاه — ۷۰۰', sample: 'آینده — وزن سیاه' },
  { value: 900, label: 'فوق‌سیاه — ۹۰۰', sample: 'آینده — وزن فوق‌سیاه' },
];

export default function TypeLab() {
  return (
    <article className="space-y-16">
      <header>
        <p className="mb-3 text-eyebrow font-bold tracking-wide text-stone">
          آزمایشگاه · تایپوگرافی
        </p>
        <h1 className="text-h1 font-black text-ink">مقیاس تایپوگرافی</h1>
        <p className="mt-4 max-w-xl text-lead font-light text-stone">
          فونت آینده در ۴ وزن. مقیاس سیّال با clamp() برای پاسخ‌گویی
          به اندازه‌های مختلف صفحه‌نمایش.
        </p>
      </header>

      <section>
        <h2 className="text-h3 font-bold text-charcoal mb-8">مقیاس</h2>
        <div className="space-y-0">
          {scale.map((s) => (
            <div key={s.token} className="border-b border-sand/60 py-4">
              <div className="mb-2 flex items-baseline gap-4">
                <span className="text-eyebrow font-bold tracking-wide text-stone" dir="ltr">
                  {s.token}
                </span>
                <span className="text-eyebrow text-stone" dir="ltr">
                  {s.weightLabel} {s.weight}
                </span>
              </div>
              <p
                className={`${s.css} text-charcoal`}
                style={{ fontWeight: s.weight }}
              >
                {s.sample}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-h3 font-bold text-charcoal mb-8">وزن‌های فونت</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {weights.map((w) => (
            <div key={w.value} className="rounded-md border border-sand p-6">
              <p className="text-eyebrow font-bold tracking-wide text-stone mb-3" dir="ltr">
                {w.label} — {w.value}
              </p>
              <p className="text-h2 text-charcoal" style={{ fontWeight: w.value }}>
                {w.sample}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-h3 font-bold text-charcoal mb-8">نمونه‌ی پاراگراف</h2>
        <div className="max-w-2xl space-y-4">
          <p className="text-eyebrow font-bold tracking-wide text-forest">
            کلکسیون بهار ۱۴۰۵
          </p>
          <h3 className="text-h2 font-black text-ink">
            صنایع چوب و دکوراسیون داخلی
          </h3>
          <p className="text-lead font-light text-stone">
            فضاهایی آرام و باشکوه با روح ایرانی
          </p>
          <p className="text-body text-charcoal leading-relaxed">
            ژیک با بهره‌گیری از چوب طبیعی و طراحی مینیمال، فضاهایی آرام و
            باشکوه خلق می‌کند که روح ایرانی دارند. هر قطعه‌ی مبلمان در
            کارگاه ما با دقت و عشق ساخته می‌شود. از انتخاب چوب تا پرداخت
            نهایی، هیچ مرحله‌ای عجولانه انجام نمی‌شود.
          </p>
          <p className="text-small text-stone">
            ارسال رایگان به سراسر ایران · گارانتی ۵ ساله · پشتیبانی تلفنی
          </p>
        </div>
      </section>
    </article>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/lab/type/page.tsx
git commit -m "lab: rewrite type page with Ayandeh Persian type specimen"
```

---

### Task 17: Update docs for palette decision

**Files:**
- Modify: `docs/spec/design-system.md:103,105,113-114`
- Modify: `docs/state.md:237`

- [ ] **Step 1: Update design-system.md color table**

In `docs/spec/design-system.md`, find the color table and update the saffron/moss entries:

Replace:
```
--color-saffron     #C68A2E   reserved for rare moments (rare!)
```
With:
```
--color-gold        #C49A6C   brand warm accent — once per page max
```

Replace:
```
--color-moss        #5A6B4F   success, muted
```
With:
```
--color-forest      #5F7760   brand primary accent, success
```

Update the prose about saffron (lines 113-114):

Replace:
```
- **Saffron** is a once-per-page maximum on the storefront. Never on
  body text. Borrowed from saffron silk and Iranian miniatures, used
```
With:
```
- **Gold** is a once-per-page maximum on the storefront. Never on
  body text. A warm caramel tone, used as a reward accent in dark
```

- [ ] **Step 2: Update state.md — mark OD-palette as resolved**

In `docs/state.md`, find the OD-palette row and update its status to reflect the decision:

Replace the OD-palette row text to mark it resolved with a note:
```
| OD-palette | ✅ Resolved 2026-04-16: forest #5F7760 + gold #C49A6C. Spec palette wins with updated values. |
```

- [ ] **Step 3: Commit**

```bash
git add docs/spec/design-system.md docs/state.md
git commit -m "docs: update palette references (saffron→gold, moss→forest), resolve OD-palette"
```

---

### Task 18: Build verification

- [ ] **Step 1: TypeScript check across entire monorepo**

Run: `cd /home/ahmad/Zhic && pnpm tsc --noEmit 2>&1 | tail -20`
Expected: No errors from packages/design-system or packages/ui. Any pre-existing errors in other packages are acceptable.

- [ ] **Step 2: Verify Tailwind generates the new utilities**

Run: `cd /home/ahmad/Zhic && grep -rn 'bg-gold\|text-gold\|bg-forest\|text-forest' apps/web/src/ packages/ui/src/ | head -10`
Expected: At least the Badge.tsx and lab/tokens references appear.

- [ ] **Step 3: Verify no remaining saffron/moss in runtime code**

Run: `grep -rn --include='*.tsx' --include='*.ts' --include='*.css' -E '\bsaffron\b|\bmoss\b' packages/ apps/ --exclude-dir=node_modules --exclude-dir=.next`
Expected: No output from code files. (Docs files may still reference the old names in historical context — that's fine.)

- [ ] **Step 4: Start dev server and verify lab pages**

Run: `cd /home/ahmad/Zhic/apps/web && pnpm dev`

Verify in browser:
- `http://80.240.31.146:3000/lab/color` — shows Persian palette with forest and gold colors, no Latin text, no `font-serif`
- `http://80.240.31.146:3000/lab/type` — shows Ayandeh type scale in Persian, all four weights, no references to Cormorant/Inter
- `http://80.240.31.146:3000/lab/tokens` — renders without errors, uses `bg-gold/20` and `bg-forest/20`

- [ ] **Step 5: Final commit (if any corrections were needed)**

```bash
git add -A
git commit -m "pass1: foundation complete — verify build and lab pages"
```
