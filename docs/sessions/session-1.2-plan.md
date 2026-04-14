# Session 1.2 — Design System Tokens + Tailwind Preset

**Phase 1, Session 2 of `docs/sessions.md`.** This is the execution plan
for the second session of Phase 1 (Monorepo Foundation). Read this before
opening a fresh Claude Code conversation to run the work.

---

## 1. Goal

Turn `packages/design-system/` from a stub into the single source of
truth for every visual token in the monorepo, wire it through Tailwind
v4, and prove it end-to-end by making `apps/web` consume it with
self-hosted Ayandeh and an RTL Persian document.

Authority: **`docs/spec/design-system.md`** (§2 tokens, §2.2 typography,
§6 motion). Where `docs/package1-month1.md` disagrees (e.g. forest-green
logo palette vs. ivory + charcoal + saffron), the `spec/design-system.md`
values win — flag the discrepancy in the commit message.

---

## 2. Entry state (verified 2026-04-14)

- Monorepo scaffold from Session 1.1 is in place.
- `packages/design-system/src/index.ts` is a one-line stub.
- `packages/config/tailwind-preset.js` is a stub `{ theme: { extend: {} } }`.
- `apps/web` uses Tailwind v4 via `@tailwindcss/postcss`.
- `apps/web/src/app/layout.tsx` currently loads Cormorant + Inter from
  **Google Fonts** and sets `<html lang="en">` — both must change.
- `apps/web/src/app/globals.css` has an ivory/cream/sand/stone/charcoal/
  accent/warm-white palette inlined via `@theme inline` — this moves to
  the design-system package.
- Ayandeh TTFs already live at `apps/web/src/assets/fonts/Ayandeh {Light,
  Regular, Bold, Black}.ttf` and at the repo root `font and logo/`.
- `apps/web/src/app/lab/` already has `type/`, `color/`, `motion/`,
  `three/` subroutes — we will extend the existing lab, not invent a
  new one.

---

## 3. Deliverables

### 3.1 `packages/design-system/` — fully built

```
packages/design-system/
├── package.json                # exports added for ./theme.css etc.
├── src/
│   ├── index.ts                # re-exports token TS objects
│   └── tokens/
│       ├── color.ts
│       ├── typography.ts
│       ├── spacing.ts
│       ├── radii.ts
│       ├── shadows.ts
│       ├── breakpoints.ts
│       ├── motion.ts
│       └── z-index.ts
└── css/
    ├── tokens.css              # :root { --color-…: …; } for every token
    ├── theme.css               # @theme { … } mapping tokens into Tailwind v4
    └── base.css                # reset + Persian/RTL base rules
```

**Token values** (from `docs/spec/design-system.md` §2):

- **Color:** `ivory #FAFAF7`, `cream #F5F0EB`, `sand #E8E0D8`,
  `stone #8C8279`, `charcoal #2C2825`, `ink #14110F`,
  `accent #B8A898`, `saffron #C68A2E`, `rust #8B4A2B`,
  `moss #5A6B4F`, `overlay rgba(20,17,15,.6)`.
- **Typography:** Ayandeh family, 4 weights (300/400/700/900).
  Type scale ratio 1.25, base 16 — tokens `text-display/h1/h2/h3/h4/
  lead/body/small/eyebrow` with per-size line-height tuned for Persian
  (see §2.2 table). Use `clamp()` so mobile caps display at 56px and h1
  at 40px.
- **Spacing:** `--space-1` … `--space-12` (4 → 256px), 8-pt base.
- **Radii:** `none 0`, `sm 2px`, `md 4px`, `lg 8px`, `pill 999px`.
- **Shadows:** hairline-first — only the modal shadow
  `0 24px 64px -24px rgba(20,17,15,.18)`. No card shadows.
- **Breakpoints:** `sm 640 / md 768 / lg 1024 / xl 1440 / 2xl 1920`.
- **Motion:** durations `--dur-instant/fast/base/slow/glacial`
  (100/240/480/720/1200ms) for storefront; `--dur-op-fast/base/slow`
  (120/180/280ms) for operator apps; easings `--ease-out-soft`,
  `--ease-in-soft`, `--ease-in-out-soft`, `--ease-expo-out`.
- **Z-index:** `base/raised/sticky/header/overlay/modal/toast`
  (0/10/100/200/900/1000/1100).

**Double representation** — every token is written **twice**:

1. As a TypeScript constant (e.g. `export const color = { ivory: '#FAFAF7', … }`)
   so components and tests can reference values at build time.
2. As a CSS custom property in `css/tokens.css` so the browser can
   consume them at runtime and Tailwind v4 `@theme` can pick them up.

The TS objects are the authority; the CSS file can be hand-written in
this session but a follow-up task is to generate it from the TS objects.
Add a `// TODO(1.2-followup): generate from tokens/*.ts` comment at the
top of `tokens.css`.

**`css/theme.css`** is a Tailwind v4 `@theme` block that aliases CSS
variables into Tailwind utility names:

```css
@theme {
  --color-ivory: var(--color-ivory);
  --color-charcoal: var(--color-charcoal);
  /* … every color, font, spacing, radius */
  --font-sans: var(--font-ayandeh), ui-sans-serif, system-ui, sans-serif;
}
```

**`css/base.css`** holds the Persian/RTL base rules (NOT utilities —
those come from Tailwind):

- Reset box-sizing / margin / padding.
- `html { background: var(--color-ivory); }`
- `body { color: var(--color-charcoal); font-family: var(--font-sans);
  line-height: 1.75; -webkit-font-smoothing: antialiased; }`
- `:lang(fa) { hyphens: none; }`
- `@media (prefers-reduced-motion: reduce) { /* durations → 0.01ms */ }`
- The RTL logical-direction override for motion tokens
  (`[dir="rtl"] { --reveal-x: -24px; }` per spec §6.1.7).

Move the glass/dot-pattern utilities from the current `globals.css`
into `base.css` as well — they are brand-level, not page-level.

### 3.2 `package.json` exports

```jsonc
{
  "exports": {
    ".": "./src/index.ts",
    "./theme.css": "./css/theme.css",
    "./tokens.css": "./css/tokens.css",
    "./base.css": "./css/base.css"
  }
}
```

### 3.3 Tailwind v4 preset — the right primitive

Tailwind v4 is **CSS-first**; there is no JS `preset` array. The
correct shared primitive is a CSS file with a `@theme` block. Therefore:

- **Delete** `packages/config/tailwind-preset.js` (it is a v3 concept
  and is unused).
- Remove the `./tailwind-preset` entry from `packages/config/package.json`
  `exports` and the `files` array.
- Apps opt-in by importing `@zhic/design-system/theme.css`.

### 3.4 `apps/web` wiring

**`apps/web/src/app/layout.tsx`** — replace the Google Fonts loader
with `next/font/local`:

```ts
import localFont from 'next/font/local';

const ayandeh = localFont({
  src: [
    { path: '../assets/fonts/Ayandeh Light.ttf',   weight: '300', style: 'normal' },
    { path: '../assets/fonts/Ayandeh Regular.ttf', weight: '400', style: 'normal' },
    { path: '../assets/fonts/Ayandeh Bold.ttf',    weight: '700', style: 'normal' },
    { path: '../assets/fonts/Ayandeh Black.ttf',   weight: '900', style: 'normal' },
  ],
  variable: '--font-ayandeh',
  display: 'swap',
});
```

- `<html lang="fa" dir="rtl" className={ayandeh.variable}>`
- `<body className="bg-ivory text-charcoal font-sans">`
- Update `metadata.title` / `metadata.description` to Persian copy
  (temporary placeholder; real copy lands in 3.1).

**`apps/web/src/app/globals.css`** — collapse to:

```css
@import "tailwindcss";
@import "@zhic/design-system/tokens.css";
@import "@zhic/design-system/theme.css";
@import "@zhic/design-system/base.css";
```

All inline `--color-…` vars and glass/dot utilities are removed from
this file; they now live in the design-system package.

### 3.5 Font subsetting — **out of scope this session**

`design-system.md` §2.2 calls for subsetting Ayandeh to Arabic +
ZWNJ + ASCII at build time. That is a build-pipeline task. For Session
1.2, load full TTFs and record a follow-up TODO in `docs/sessions.md`
(new Phase 6 item: "Ayandeh subsetting"). Do not block on it.

### 3.6 Verification surface — `/lab/tokens`

Add a new route `apps/web/src/app/lab/tokens/page.tsx` (co-located with
existing `/lab/type`, `/lab/color`, `/lab/motion`) that renders:

- Every color token as a swatch with name + hex.
- Every font-size token with Persian + Latin sample copy
  ("می‌خواهید ساخته‌شده برای ماندن. 1234" and "Zhic — 1234").
- Spacing scale as labeled bars.
- Radius scale as labeled boxes.
- A paragraph confirming `dir="rtl"` (check with the browser dev
  tools — text aligns to the right, logical `ps-4` pads on the right).

This page is the exit-check artifact. Keep it ugly and utilitarian —
it is a lab page, not a design.

---

## 4. Exit check

Run each of the following and confirm before closing the session:

1. `pnpm --filter @zhic/design-system typecheck` passes.
2. `pnpm --filter @zhic/web build` passes with no Tailwind warnings
   about unknown utility classes (`bg-ivory`, `text-charcoal` etc.).
3. `pnpm --filter @zhic/web dev` — visit `http://localhost:3000/lab/tokens`:
   - Font is Ayandeh in Persian and Latin runs.
   - `<html>` element has `lang="fa"` and `dir="rtl"` in dev tools.
   - Color swatches match `design-system.md` §2.1 hex values.
   - Spacing bars are proportional (4 → 256).
4. `pnpm --filter @zhic/web lint` passes.
5. Git: the branch `claude/phase-1-session-2` (or whatever the runtime
   harness picks) has a single commit titled
   `feat(design-system): tokens, Tailwind v4 theme, Ayandeh via next/font/local`
   with the spec-vs-package1 discrepancy noted in the body.

---

## 5. Out of scope (do NOT creep into these)

- Button, form fields, or any `packages/ui` component (that is Session 2.1).
- Payload CMS wiring (Session 1.3).
- Locale / money utilities (Session 1.4).
- Motion implementations (GSAP scroll-scrub, page veil) — tokens only.
- Dark mode (explicitly deferred per spec §2.1).
- Font subsetting (see §3.5 above).
- Logo PDF → final brand palette extraction. If the logo is genuinely
  forest-green and the spec's ivory/charcoal palette is wrong, that is
  a brand-team decision, not a code decision. Leave the spec values
  in, and note in the commit body that Section 4 of
  `docs/package1-month1.md` mentions forest green — escalate to the
  operator before making a different call.
- Storybook. Not until Phase 2.

---

## 6. Files touched (checklist)

Created:
- `packages/design-system/src/tokens/{color,typography,spacing,radii,shadows,breakpoints,motion,z-index}.ts`
- `packages/design-system/css/{tokens,theme,base}.css`
- `apps/web/src/app/lab/tokens/page.tsx`

Modified:
- `packages/design-system/src/index.ts` (re-exports)
- `packages/design-system/package.json` (exports map)
- `apps/web/src/app/layout.tsx` (local font, lang=fa, dir=rtl)
- `apps/web/src/app/globals.css` (collapsed to 4 imports)

Deleted:
- `packages/config/tailwind-preset.js`
- Corresponding exports entry in `packages/config/package.json`

No changes in:
- `services/api/`, `packages/{ui,locale,types,db}/` (next sessions).

---

## 7. Hand-off to Session 1.3 / 1.4

Sessions 1.3 (Payload CMS) and 1.4 (locale utils) can start in parallel
the moment this PR lands. Neither depends on the tokens shipping, but
both will inherit Ayandeh when they eventually render admin UI or
utility-test pages.

Session 2.1 (Button + form fields) is the first downstream consumer
that **blocks** on this session. It must not add any hardcoded color
or font value — everything references a token exported here.
