# Mobile Products Menu — Design Spec

**Date:** 2026-05-16
**Branch:** `feat/products-mega-menu` (extends the existing mega-menu work)
**Status:** spec — implementation plan to follow via `superpowers:writing-plans`
**Closes:** `FU-MM-c` (Mobile mega-menu expansion in `MobileMenu.tsx`)

---

## 0. Why this spec

`MobileMenu.tsx` today renders the 5 nav links from `NAV_LINKS` as a centered flat list inside a full-screen ivory dialog. Tapping «محصولات» navigates straight to `/products`. That hides 8 categories, 4 designs, and 3 featured collections behind a single tap and gives mobile users no peek at the catalog structure — they have to discover it through the filter UI on the index page.

The desktop `ProductsMegaMenu` (just shipped on this branch) surfaces the catalog hierarchy directly in the nav. This spec brings the same hierarchy to mobile, scaled for a single-thumb experience.

It deliberately **does not** cover:

- A featured-product card on mobile (desktop-only treat — see §10)
- Pinch/swipe gestures or animated transitions beyond cross-fade
- A nested expansion for «درباره‌ی ما» (the desktop-side `FU-MM-g` companion menu) — that lands separately
- Companion data on the mobile search input (live autocomplete deferred to `FU-MM-e`)

---

## 1. Visual reference

`MobileMenu` becomes a two-state dialog. The same full-screen ivory container; what's inside swaps via cross-fade.

### 1.1 State A — Main view (default on open)

```
┌──────────────────────────────┐
│ [×]                          │  ← close (top-start = top-right in RTL)
│                              │
│              ژیک             │  ← brand
│                              │
│           محصولات            │  ← tap → State B
│           ژورنال             │  ← <Link>
│           نمایشگاه‌ها         │  ← <Link>
│           درباره‌ی ما         │  ← <Link>
│           تماس               │  ← <Link>
└──────────────────────────────┘
```

### 1.2 State B — Products view (after tap «محصولات»)

```
┌──────────────────────────────┐
│ [←]                          │  ← back (same corner, replaces ×)
│                              │
│           محصولات            │  ← section title
│                              │
│   [🔍 جستجوی محصول…       ]  │  ← form GET /products?q=
│                              │
│        دسته‌بندی‌ها            │  ← eyebrow
│        تخت‌ها                │
│        پاتختی‌ها              │
│        کمدها                 │
│        دراورها               │
│        میزهای تحریر          │
│        کتابخانه‌ها             │
│        آینه‌ها                │
│        ویترین‌ها              │
│                              │
│        طرح‌ها                 │  ← eyebrow (rendered only if items > 0)
│        طرح آرامش            │
│        طرح بهار             │
│                              │
│        مجموعه‌ها              │  ← eyebrow (rendered only if items > 0)
│        مجموعه نوآموز        │
│                              │
│        → تمامی محصولات       │  ← bottom CTA
└──────────────────────────────┘
```

**Cross-fade transition.** Tap «محصولات» → main items fade out (opacity 1 → 0), products items fade in (opacity 0 → 1). Corner button morphs ×→← in the same fade. No slide, no horizontal motion. Duration matches existing `--dur-dialog`.

---

## 2. Architecture

### 2.1 Files modified

| Path | Change |
|---|---|
| `apps/web/src/components/layout/MobileMenu.tsx` | Rewrite — accept new `navMeta` prop, manage two-state view, render either State A or State B. |
| `apps/web/src/components/layout/SiteHeader.tsx` | Thread the existing `navMeta` prop down into `<MobileMenu navMeta={...} />`. No re-fetch. |

### 2.2 No new files

The whole feature lives inside `MobileMenu.tsx`. The two sub-views are co-located sub-components in the same file because they share state and are tightly coupled. Splitting would add navigation friction without reducing the file's responsibility (it's still "the mobile menu dialog").

### 2.3 Data flow

```
(site)/layout.tsx (server)
       │
       │ fetchNavMeta()
       ▼
<SiteHeader navMeta={...} /> (client)
       │
       │ navMeta passed through
       ▼
<MobileMenu navMeta={...} open={...} onClose={...} pathname={...} />
       │
       │ State A reads NAV_LINKS / pathname only
       │ State B reads navMeta.categories / .designs / .collections
       ▼
   conditional render based on internal `view` state
```

`fetchNavMeta()` already runs once per `(site)/` page render and is now also consumed by the mobile menu. No new data path.

---

## 3. Component shape

### 3.1 Props

```ts
export type MobileMenuProps = {
  open: boolean
  onClose: () => void
  pathname: string | null
  navMeta: NavMeta  // new — same shape SiteHeader already accepts
}
```

### 3.2 Internal state

```ts
type View = 'main' | 'products'
const [view, setView] = useState<View>('main')
```

**State reset rule:** when `open` transitions from `true` → `false`, reset `view` to `'main'`. Implemented in a `useEffect` keyed on `open`. The next time the menu opens, it always starts on main.

### 3.3 Behavior matrix

| Trigger | From `view='main'` | From `view='products'` |
|---|---|---|
| Tap «محصولات» row | `setView('products')` | — (محصولات row not rendered in products view) |
| Tap any other nav link (ژورنال etc.) | navigates via `<Link>` + calls `onClose()` | — (not rendered) |
| Tap corner button | calls `onClose()` (the × button) | `setView('main')` (the ← button) |
| Tap «تمامی محصولات →» | — (not rendered) | navigates to `/products` + calls `onClose()` |
| Tap category/design/collection item | — (not rendered) | navigates to its filtered route + calls `onClose()` |
| Submit search form | — (not rendered) | navigates to `/products?q=<value>` + calls `onClose()` |
| Press Esc | `onClose()` | `setView('main')` (hierarchical back) |

### 3.4 ARIA

```html
<div role="dialog" aria-modal="true" aria-label="منو" aria-hidden={!open}>

  <!-- Corner button: meaning changes with view state -->
  <button
    type="button"
    aria-label={view === 'main' ? 'بستن' : 'بازگشت'}
    onClick={view === 'main' ? onClose : () => setView('main')}
  >
    {view === 'main' ? '×' : '←'}
  </button>

  <!-- Main view -->
  {view === 'main' && (
    <div aria-label="منوی اصلی">
      <span>ژیک</span>
      <ul>
        <li><button aria-controls="mob-products-view">محصولات</button></li>
        <li><Link>ژورنال</Link></li>
        ...
      </ul>
    </div>
  )}

  <!-- Products view -->
  {view === 'products' && (
    <div aria-label="منوی محصولات">
      <h2>محصولات</h2>
      <form role="search" action="/products" method="get">...</form>
      <section aria-labelledby="mob-cats-h">
        <h3 id="mob-cats-h">دسته‌بندی‌ها</h3>
        <ul>...</ul>
      </section>
      ...
    </div>
  )}
</div>
```

Both views live inside the same `<div role="dialog">`. View toggling does not change the dialog role — screen readers stay in the menu landmark; the title shifts via the `<h2>` content.

### 3.5 Item link targets

Mirror the desktop menu's per-item link contract:

| Item type | Link target |
|---|---|
| Category | `/products?cat=<encoded slug>` |
| Design | `/products?design=<encoded slug>` |
| Collection | `/collections/<encoded slug>` |
| «تمامی محصولات» CTA | `/products` |
| Search submit | `/products?q=<encoded value>` (form GET) |

No item counts on any of them. No subtitles on any of them. Just labels.

---

## 4. Layout & motion

### 4.1 Layout shift from current

`MobileMenu` currently uses `justify-center` to vertically center the 5-link flat list. Products view has 12+ items plus eyebrows plus search — won't fit centered.

Change to `justify-start` with top padding (`pt-16` ≈ 64px to clear the corner button) and `overflow-y-auto` on the dialog so the products view scrolls naturally if content exceeds viewport. Apply this in both views — the main view becomes "anchored top, ژیک brand near top" rather than dead-center, which is a small but real visual change.

### 4.2 Cross-fade animation

CSS-only. Each view is a `<div>` with absolute positioning inside the dialog, opacity-driven by data attribute:

```css
.mob-view {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity var(--dur-dialog) var(--ease-out-soft);
  pointer-events: none;
}
.mob-view[data-active="true"] {
  opacity: 1;
  pointer-events: auto;
}
```

React sets `data-active` on the matching view based on the `view` state. Both views are mounted (so React state is preserved across toggles); only one is visible+interactive at a time. The inactive view also gets the `inert` attribute (or `tabIndex={-1}` on focusable descendants if `inert` browser support is too narrow) so keyboard users don't Tab into hidden items.

### 4.3 Corner button morphing

The button is a single React element. Its `aria-label`, `onClick`, and SVG icon content all derive from the `view` state. The icon swaps within the same `<svg>` via inline path data, so the morph is a fade-and-redraw, not two separate buttons stacked. Acceptable; no need for a fancy `path` interpolation animation.

### 4.4 `prefers-reduced-motion`

Honor the existing pattern (other components disable transforms/transitions when the user prefers reduced motion). For this component:

```css
@media (prefers-reduced-motion: reduce) {
  .mob-view { transition: none; }
}
```

Instant view swap. No fade.

---

## 5. Search input

Lives only in products view. Form element exactly mirrors the desktop mega-menu search:

```tsx
<form action="/products" method="get" role="search">
  <span aria-hidden>{/* magnifying-glass SVG */}</span>
  <input
    type="search"
    name="q"
    placeholder="جستجوی محصول…"
    aria-label="جستجو در محصولات"
  />
</form>
```

Submitting navigates to `/products?q=<value>`. The page already supports `q` via `parseSearchParams` (Task 2 of the mega-menu plan). After submit, the dialog dismisses (browser navigation closes it as the user lands on the new page).

No live autocomplete on mobile. Plain submit. (Autocomplete is the desktop-also follow-up `FU-MM-e`.)

---

## 6. Empty-state behavior

| Slice | Empty state |
|---|---|
| `navMeta.categories.length === 0` | Render the «دسته‌بندی‌ها» eyebrow + a single line «هیچ دسته‌بندی پیدا نشد.» |
| `navMeta.designs.length === 0` | Don't render the «طرح‌ها» eyebrow or any section. Skip silently. |
| `navMeta.collections.length === 0` | Don't render the «مجموعه‌ها» eyebrow or any section. Skip silently. |
| All three empty | Products view still renders the search input + «تمامی محصولات →» CTA. The user can navigate to `/products` to browse. |

Rationale: categories are the core hierarchy and must be visible — even empty, the absence is informative. Designs and collections are secondary; rendering "هیچ ..." labels just adds visual noise.

---

## 7. Routes

All link targets exist today. Nothing to add or change in routing.

| Target | Status |
|---|---|
| `/products` | ✓ exists |
| `/products?cat=<slug>` | ✓ exists |
| `/products?design=<slug>` | ✓ exists (added in mega-menu Task 2 + Task 6) |
| `/products?q=<value>` | ✓ exists (added in mega-menu Task 6) |
| `/collections/<slug>` | ✓ exists |

---

## 8. Tests

### 8.1 Vitest (component unit)

Project doesn't have `@testing-library/react` wired (per `state.md` `FU-2.1-a`). MobileMenu has no existing unit tests for the same reason. Don't introduce RTL just for this PR.

What we **can** unit-test as pure functions:
- A new helper extracted from MobileMenu — e.g., `mobileMenuLinkForItem(item, type)` returns the right href string — fully testable without rendering.

That's optional. If it doesn't make the component cleaner, skip it.

### 8.2 Manual

- Open menu on mobile viewport (≤ 768px) → main view shows, ژیک brand visible, 5 nav rows, × in corner.
- Tap «محصولات» → cross-fade. Products view replaces main, ← replaces ×, محصولات title shown, search input visible, categories list visible.
- Tap «← back» → cross-fade back to main view.
- Tap a category → navigates to `/products?cat=<slug>`, menu dismisses.
- Tap «تمامی محصولات →» → navigates to `/products`, menu dismisses.
- Type in search, submit → navigates to `/products?q=<value>`.
- Esc from products view → returns to main view (not dismiss).
- Esc from main view → dismisses dialog.
- Close menu and reopen → view is `'main'` again (no sticky state).
- `prefers-reduced-motion: reduce` → view swap is instant, no fade.

### 8.3 Smoke

- `pnpm --filter @zhic/web build` clean.
- `pnpm --filter @zhic/web typecheck` clean.
- `curl /` returns 200 (header + mobile menu compile).
- Inspect rendered HTML: `aria-label="منو"` dialog present, `aria-label="بستن"` button present (main view default).

---

## 9. Acceptance criteria

The PR is done when **all** of the following are true:

1. Opening the mobile menu shows the main view (5 flat items, no products expansion).
2. Tapping «محصولات» transitions to products view via cross-fade (or instant swap under `prefers-reduced-motion`).
3. Products view shows: title «محصولات», search input, categories list (always — even if empty, with the eyebrow + empty-state line), designs list (only if non-empty), collections list (only if non-empty), «تمامی محصولات →» CTA at the bottom.
4. Category/design item taps navigate to the correct `/products?cat=…` / `/products?design=…` route and dismiss the dialog.
5. Collection item taps navigate to `/collections/<slug>` and dismiss the dialog.
6. Search submit lands on `/products?q=<value>` and dismisses the dialog.
7. Corner button is × on main view (closes dialog), ← on products view (returns to main).
8. Esc from products → main. Esc from main → dismiss.
9. Reopening the menu always starts on main view.
10. No item counts or subtitles render anywhere in the mobile menu.
11. Desktop (≥ 768px) is unchanged. The mobile menu is hidden from the layout, the floating-island chrome and desktop nav both unaffected.
12. Typecheck + build clean. Manual smoke checklist (§8.2) passes.

---

## 10. Follow-ups (out of scope, captured for `state.md`)

| Id (proposed) | Item |
|---|---|
| `FU-MM-c1` | Featured product card on mobile. Currently desktop-only. Add when there's a clear customer signal that mobile users want it. |
| `FU-MM-c2` | Sub-item counts and subtitles on mobile. Reintroduce per category/design/collection if user research shows them missed. |
| `FU-MM-c3` | Live autocomplete in mobile search input (carries forward `FU-MM-e`). |
| `FU-MM-c4` | Swipe-back gesture (right-edge swipe on RTL) for the products → main transition. Native-app feel, optional polish. |
| `FU-MM-c5` | Companion expansion for «درباره‌ی ما» mirroring `FU-MM-g`. |
| `FU-MM-c6` | Push-style horizontal slide animation as an alternative to cross-fade. User study would gate it. |

---

## 11. References

- Plan: implementation plan to be written via `superpowers:writing-plans` after spec approval, stored at `docs/superpowers/plans/2026-05-16-mobile-products-menu.md`
- Desktop mega-menu spec: `docs/superpowers/specs/2026-05-16-products-dropdown-mega-menu-design.md` (visual + data model parent)
- Mega-menu plan: `docs/superpowers/plans/2026-05-16-products-dropdown-mega-menu.md`
- Visual baseline (desktop): `apps/web/public/docs/products-dropdown-v2.html`
- State board entry: `docs/state.md` → `FU-MM-c` row
- Implementation file (current): `apps/web/src/components/layout/MobileMenu.tsx`
