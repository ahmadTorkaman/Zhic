# Session 2.1 — Button, Form Fields, Badges

## Goal

Turn `packages/ui` from an empty stub into the first shelf of Persian-first,
RTL-native primitives the storefront needs: Button, the core form-field
family (Input, Textarea, Select, Checkbox, Radio) with a shared FormField
wrapper, and Badge / Tag. Every component consumes `@zhic/design-system`
tokens — no hardcoded colors, no ad-hoc spacing. Verify the whole surface
on a single `/lab/ui` page, and close **FU-1.2-c** (lab layout's deprecated
`font-serif` utility) now that `@zhic/ui` is the right home for shared
layout primitives.

Authority: `docs/sessions.md` §2.1, `docs/spec/design-system.md` §2, §8
(Atoms + States checklist), §9 (A11y), §10 (RTL checklist).

## Entry state

- `packages/ui/src/index.ts` is `export {};` — no components shipped.
- `@zhic/ui` is already declared as a workspace package (1.1) but no
  consumer imports from it yet.
- Design tokens live in `@zhic/design-system` and are aliased into
  Tailwind v4 via `theme.css` (`bg-ivory`, `text-charcoal`, `rounded-md`,
  `text-body`, `p-5`, …). All component styling goes through these.
- `apps/web/src/app/lab/layout.tsx` still references `font-serif`
  (Cormorant was removed in 1.2) — FU-1.2-c open.
- Ayandeh is the only web font; `font-sans` resolves to it.
- React 19 + Next 16 App Router. `'use client'` only where needed.
- Vitest runs per-package (1.4). Component unit testing is **not** in
  scope for 2.1 — verification is visual, on `/lab/ui`.

## Key decisions

| Decision | Choice |
|---|---|
| Styling strategy | Tailwind v4 utilities only, composed with a tiny `cn()` helper. No runtime CSS-in-JS, no `cva` dep. |
| Variant resolution | Plain object lookup (`VARIANT_CLASSES[variant][size]`) inside each component. Avoids a third-party variants lib until we outgrow it. |
| Helper deps | `clsx` + `tailwind-merge` as runtime deps of `@zhic/ui`. Both tiny, both standard. |
| Server vs client | Button/Badge/Tag/FormField: server-compatible. Input/Textarea/Select/Checkbox/Radio: `'use client'` (they forward event handlers and need to run in a client tree). |
| Ref forwarding | Pass native `ref` through using React 19's direct-ref prop (no `forwardRef` wrapper). Native `...props` spread for extensibility. |
| Controlled/uncontrolled | Pass-through only. No internal state machines in 2.1. `Select` is the native `<select>` — styled, not re-implemented. Combobox / searchable Select deferred. |
| RTL | Logical Tailwind utilities (`ms-*`/`me-*`, `ps-*`/`pe-*`, `text-start`/`text-end`, `start-*`/`end-*`). Nothing physical (`ml-*`/`pr-*`) in any component. |
| Focus ring | `focus-visible:ring-2 ring-offset-2 ring-charcoal ring-offset-ivory` — matches §8 States checklist. |
| Error surface | `ring-rust` / `text-rust` on invalid; FormField owns the `aria-invalid`/`aria-describedby` wiring. |
| Icons | No icon system yet. Button exposes `startSlot` / `endSlot` props (ReactNode) so icons can drop in later without an API break. IconButton deferred. |
| Scope trims | PhoneInput, OtpInput, Combobox, Toggle, Tooltip, Link atom all **deferred** — not in `docs/sessions.md` §2.1 deliverables. |
| Testing | Visual on `/lab/ui`. Storybook and RTL unit tests are a Package-1 closeout task, logged as follow-ups. |
| Barrel | Single shallow `src/index.ts`. Components live flat under `src/` to match the `@zhic/locale` / `@zhic/money` convention. |

## Deliverables

### `packages/ui/`

```
src/
├── Button.tsx         # primary · secondary · ghost · link; sm · md · lg; loading, disabled, startSlot, endSlot
├── Input.tsx          # text/email/search/tel/url/number/password; sm · md · lg; error state; full native-input passthrough
├── Textarea.tsx       # 3/5/8 row presets; error state; resize-y
├── Select.tsx         # styled native <select>; same sizes + error state; RTL chevron flips
├── Checkbox.tsx       # native <input type=checkbox> + custom indicator; label slot optional (usually via FormField)
├── Radio.tsx          # radio + RadioGroup wrapper; horizontal / vertical
├── FormField.tsx      # label (above) + control slot + help + error; generates `id`, wires `htmlFor` + `aria-describedby` + `aria-invalid`
├── Badge.tsx          # neutral · accent · success · warning · error; sm · md; square/rounded
├── Tag.tsx            # pill-shaped chip; optional dismiss button (RTL-aware X on the inline-end)
├── cn.ts              # tiny clsx + tailwind-merge re-export
└── index.ts           # barrel
```

New deps in `packages/ui/package.json`:

- `clsx@^2` (dep)
- `tailwind-merge@^2` (dep)
- `@zhic/locale: workspace:*` (dep — for ZWNJ helpers in default labels / future Persian-digit badges)

No new peerDeps beyond the existing React 19 pair.

### Component contract notes

- **Button**: `variant: 'primary' | 'secondary' | 'ghost' | 'link'`,
  `size: 'sm' | 'md' | 'lg'`, `loading?: boolean`,
  `startSlot?/endSlot?: ReactNode`, `as?: 'button' | 'a'` (polymorphic
  only between these two, no generic polymorphism). Loading disables the
  button and renders a small spinner in the start slot; visible label
  stays put so widths don't jump. Focus ring outside the element.
- **Input / Textarea / Select**: identical size scale and error
  treatment. `invalid?: boolean` flips ring + border to `rust`.
  Placeholder uses `text-stone`. Internal padding uses `ps-*`/`pe-*`.
  Always `dir="auto"` on the element so phone numbers render LTR
  inside an RTL page.
- **Checkbox / Radio**: visually hide the native input but keep it in
  the layout for keyboard + screen-reader behavior. Custom indicator
  is a sibling `<span>` with `peer-checked:` and
  `peer-focus-visible:` states. RadioGroup wires `name` + `value`
  down to children via context (`'use client'`).
- **FormField**: props = `label`, `htmlFor?`, `help?`, `error?`,
  `required?`, `children`. Generates a stable id via `React.useId()`
  when `htmlFor` is omitted and injects it into the single child via
  `React.cloneElement`. Error replaces help when present.
- **Badge**: non-interactive status pill. Sizes `sm` (eyebrow scale)
  and `md`. Variants map to token colors — never raw hex.
- **Tag**: interactive chip with optional `onDismiss`. Dismiss button
  gets an `aria-label` (Persian default: "حذف"). The X sits on the
  inline-end (`ms-1`) so it flips under RTL automatically.

### `apps/web/src/app/lab/ui/page.tsx`

One verification page, organized as sections (Buttons → Inputs →
Selects → Checkbox/Radio → Badges/Tags → FormField compositions). Each
section renders the full variant × size × state grid (default, hover
preview, focus-visible on keyboard, disabled, loading where applicable,
error where applicable). Also a short composed-form demo (name / phone /
city select / message) so the FormField + RTL layout story is visible
at a glance.

### Lab nav integration + FU-1.2-c

In `apps/web/src/app/lab/layout.tsx`:

- Add `{ slug: 'ui', label: 'UI' }` to `experiments`.
- Replace `font-serif text-lg tracking-[0.2em] uppercase` with
  `font-sans text-lg tracking-wide` (Ayandeh-only stack). Closes
  **FU-1.2-c**.

In `apps/web/src/app/lab/page.tsx`, add a `ui` tile alongside the
existing grid.

### `apps/web` wiring

- Add `@zhic/ui: workspace:*` to `apps/web/package.json`.
- Root `tsconfig.json` already references `packages/ui` (1.1). Verify;
  no-op if present.
- `/lab/ui` imports only from `@zhic/ui` — the demo proves the barrel
  surface is the only thing consumers need.

## Exit check

- [ ] `pnpm install` clean (new deps in `@zhic/ui`).
- [ ] `pnpm --filter @zhic/ui typecheck` passes.
- [ ] `pnpm --filter @zhic/ui lint` passes.
- [ ] `pnpm --filter @zhic/web typecheck` passes.
- [ ] `pnpm --filter @zhic/web build` passes.
- [ ] `/lab/ui` renders every component × variant × size × state.
- [ ] Keyboard tab order on `/lab/ui` follows visual order under
      `dir="rtl"` (right → left), with a visible focus ring on every
      interactive element.
- [ ] No physical-direction Tailwind utilities anywhere in
      `packages/ui/src/**` (`grep -RE '\b(m|p|text|border)-(l|r)-' packages/ui/src` returns nothing).
- [ ] No raw hex / rgb in `packages/ui/src/**` (`grep -RE '#[0-9a-fA-F]{3,8}|rgb\(' packages/ui/src` returns nothing).
- [ ] FU-1.2-c resolved: `font-serif` no longer appears in
      `apps/web/src/app/lab/layout.tsx`.
- [ ] `docs/state.md` updated: 2.1 marked ✅ with commit hash; 2.2 and
      2.3 blockers updated ("unblocked"); FU-1.2-c struck through.

## Follow-ups to log

- **FU-2.1-a** Storybook + `@testing-library/react` + axe-core once
  `@zhic/ui` has ≥ 8 components (end of Phase 2).
- **FU-2.1-b** `IconButton`, `Link` atom, `Tooltip`, `Toggle` — next time
  a consuming page asks for them (likely 2.2 Header).
- **FU-2.1-c** `PhoneInput` (E.164 + IR mobile via `@zhic/locale`) —
  prerequisite for 5.1 inquiry form.
- **FU-2.1-d** `OtpInput` — prerequisite for Package 2 `/login/verify`.
- **FU-2.1-e** Searchable `Combobox` built on the native `Select` API
  shape, when Package 2 checkout city/province picker needs it.
- **FU-2.1-f** Promote `cn.ts` to `packages/design-system` if a second
  workspace needs it (e.g. operator apps in Package 3).
- **FU-2.1-g** `<MoneyDisplay>` / `<DateDisplay>` atoms — naturally
  land with Session 2.3 (cards) where prices first appear. Carries
  forward FU-1.4-a.

## Deferred

- PhoneInput, OtpInput, Combobox, Toggle, Tooltip, Link atom, IconButton.
- Storybook + visual-regression + unit tests for components.
- Form-library integration (React Hook Form / Zod) — happens when 5.1
  needs it.
- `<MoneyDisplay>` / `<DateDisplay>` atoms — 2.3.
- Any operator-app density variant ("beside-the-input" FormField) —
  Package 3.
