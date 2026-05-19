# Mobile Card Nav — Design Spec

**Date:** 2026-05-19
**Branch (planned):** `feat/mobile-card-nav`
**Status:** spec — implementation plan to follow via `superpowers:writing-plans`
**Supersedes:** `docs/superpowers/specs/2026-05-16-mobile-products-menu-design.md` (`FU-MM-c`)

---

## 0. Why this spec

`MobileMenu.tsx` currently renders two views: a flat main list (سرویس خواب · تخت و وسایل اتاق خواب · ژورنال · نمایشگاه‌ها · درباره‌ی ما · تماس) and a Products sub-view (search + categories + designs + collections + "تمامی محصولات" CTA). The Products sub-view shipped on 2026-05-16.

This spec replaces that two-state menu with a single-state **Card Nav** — six cards, one per destination, no expansion, no search. Users wanting to drill into the catalog navigate to `/products` and use the page's own filter UI.

The change is driven by visual + interaction design — the Card Nav pattern (numbered or unnumbered cards, each its own affordance) reads as more editorial and decisive than a flat text list, and matches the rest of Zhic's "luxury restraint" treatment.

This spec uses the **restraint variant** of the Card Nav pattern:

- No number badges (no «۰۱…۰۶»)
- No giant «ژ» watermark behind the menu
- No English subtitles under Persian titles
- No staggered per-card slide-in
- No footer pills (no search, no «EN»)

Restraint elements that remain:

- Card containers (cream bg, sand border, rounded) — the differentiator from the previous flat list
- Forest active-state color, applied to one card at a time

It deliberately **does not** cover:

- A featured-product card on mobile
- A live autocomplete search affordance
- A nested products / designs picker inside the menu
- Sub-views for «درباره‌ی ما» (desktop `FU-MM-g` companion)

---

## 1. Visual reference

```
┌──────────────────────────────────────────┐
│ [×]                                      │  ← close (start-top in RTL = top-right)
│                                          │
│                  ژیک                     │  ← brand (decorative span, not a link)
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  سرویس خواب                    →   │  │  ← /designs
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │  تخت و وسایل اتاق خواب         →   │  │  ← /products
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │  ژورنال                        →   │  │  ← /journal
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │  نمایشگاه‌ها                    →   │  │  ← /showrooms
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │  درباره‌ی ما                    →   │  │  ← /about
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │  تماس                          →   │  │  ← /contact
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

The arrow points inline-start — visually `←` in RTL (the chevron glyph is `M11 3L5 8L11 13`, same as the back button used elsewhere). It signals "tap to navigate" without implying any direction of motion.

Mockup reference (for the *pattern*, not the spec — labels and decoration in the mockup are stale): `apps/web/public/docs/nav-compare-mockup.html` left phone frame.

---

## 2. Architecture

### 2.1 Files modified

| Path | Change |
|---|---|
| `apps/web/src/components/layout/MobileMenu.tsx` | Rewrite — single-view card list. Drop `View` state, `ProductsView`, `CategoriesSection`, `DesignsSection`, `CollectionsSection`. Drop the `navMeta` prop. |
| `apps/web/src/components/layout/SiteHeader.tsx` | One-line edit — remove `navMeta={navMeta}` from `<MobileMenu …>`. `navMeta` continues to flow into `SetsMegaMenu` + `PiecesMegaMenu` for desktop. |
| `docs/state.md` | Mark `FU-MM-c` as superseded with a pointer to this spec; add a row for the new work. |

### 2.2 Files unchanged

- `apps/web/src/components/layout/navLinks.ts`
- `apps/web/src/components/layout/SetsMegaMenu.tsx`, `PiecesMegaMenu.tsx`, `ProductsMegaMenu.tsx`
- `apps/web/src/lib/payload.ts` (`fetchNavMeta` continues to run for the desktop mega-menus)

### 2.3 No new files

The entire feature is one rewrite of `MobileMenu.tsx`. No new components, no new exported types, no new package dependencies.

### 2.4 Data flow

```
(site)/layout.tsx (server)
       │
       │ fetchNavMeta()  ← still runs, still used by desktop mega-menus
       ▼
<SiteHeader navMeta={...} />
       │
       │ navMeta → SetsMegaMenu, PiecesMegaMenu (desktop only)
       │ (no navMeta passed to MobileMenu)
       ▼
<MobileMenu open onClose pathname />
       │
       │ Items hardcoded in the component, in the order shown in §1
       ▼
   single-view card list
```

---

## 3. Component shape

### 3.1 Props

```ts
export type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
  pathname: string | null;
};
```

No `navMeta`. No `useId` (no aria-controls relationship — there is only one view).

### 3.2 Item source

```ts
type Item = { label: string; href: string };

const ITEMS: Item[] = [
  { label: 'سرویس خواب', href: '/designs' },
  { label: 'تخت و وسایل اتاق خواب', href: '/products' },
  ...NAV_LINKS,  // ژورنال, نمایشگاه‌ها, درباره‌ی ما, تماس (in that order)
];
```

The first two rows are hardcoded in `MobileMenu.tsx` (mirrors the current `MainView` treatment — Sets/Pieces are not in `NAV_LINKS` because `SetsMegaMenu` and `PiecesMegaMenu` own them on desktop). The remaining four come from `NAV_LINKS` to keep one source of truth.

### 3.3 Internal state

None. The component is fully driven by its `open` / `pathname` props.

The existing `useEffect`s for **body-scroll-lock** (keyed on `open`) and **focus-into-dialog** (also keyed on `open`) are kept. The view-reset effect from the current implementation is removed (no view state).

### 3.4 Esc handling

```ts
useEffect(() => {
  if (!open) return;
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };
  document.addEventListener('keydown', onKey);
  return () => document.removeEventListener('keydown', onKey);
}, [open, onClose]);
```

Flat — Esc always dismisses. No hierarchical back step (there is no back step).

### 3.5 ARIA

```html
<div role="dialog" aria-modal="true" aria-label="منو" aria-hidden={!open}>
  <button type="button" aria-label="بستن" onClick={onClose}>×</button>
  <span>ژیک</span>
  <ul aria-label="پیمایش اصلی">
    <li>
      <a href="/designs" aria-current={isActive ? 'page' : undefined}>
        <span>سرویس خواب</span>
        <svg aria-hidden>…</svg>
      </a>
    </li>
    …
  </ul>
</div>
```

The brand «ژیک» is a decorative `<span>`, not a link, matching the current implementation.

---

## 4. Visual treatment

### 4.1 Card chrome

| Property | Value |
|---|---|
| background | `var(--color-cream)` (#F5F0EB) |
| border | 1px solid `var(--color-sand)` (#E8E0D8) |
| border-radius | 14px |
| padding | 16px 20px (inline 20, block 16) |
| min-height | 56px |
| display | `flex items-center` |
| gap (title ↔ arrow) | 12px |

### 4.2 Typography

| Element | Treatment |
|---|---|
| Title | 22px / weight 900 / Ayandeh / `var(--color-charcoal)` (#2C2825) / `line-height: 1.15` / `letter-spacing: -0.01em` / `flex: 1` |
| Arrow | inline-start chevron / 18px / `var(--color-stone)` (#8C8279) / `flex: 0 0 auto` |
| Brand | existing `text-h3 font-black text-charcoal` (no change) |

The arrow SVG is the same `M11 3L5 8L11 13` glyph used by the current back button — re-used for visual consistency.

### 4.3 Layout

- Dialog: `fixed inset-0`, ivory background, fades on `open`.
- Inner stack: `flex-col items-center gap-7 px-4 py-10 pt-16` (the `pt-16` clears the corner × button, matching current `MainView`).
- Brand: centered `<span>` at the top of the stack.
- Card list: `<ul>` taking the remaining vertical space, `max-w-[420px] w-full mx-auto`, `gap: 10px` between cards, horizontal padding `px-4` already on the parent.

At common phone heights (iPhone 13 / Pixel 7 / SE etc.) the 6 cards + brand fit without scroll. If the viewport is shorter, the parent has `overflow-y-auto`.

### 4.4 Active state

For the card whose `href` matches `isNavActive(pathname, href)`:

| Property | Value |
|---|---|
| title color | `var(--color-forest)` (#5F7760) |
| arrow color | `var(--color-forest)` |
| card background | unchanged (cream) |
| card border | unchanged (sand) |
| `aria-current` | `"page"` |

Forest text is the only color change. The cream/sand chrome stays the same — restraint memory note: color is rare and earned. Exactly one card can be active at a time (multiple matching prefixes are not possible given the routes, but if they were, the longest-matching one would win — out of scope for this spec to enforce).

### 4.5 Hover (md+ unused, but defined for safety)

Cards have `hover:bg-ivory` (a single-step lighten of the cream fill) for any browser that exposes hover affordance below the `md` breakpoint. Active cards keep their forest text on hover — the title color does not change.

### 4.6 Reduced affordances

Removed vs. the source mockup:

- No number badge («۰۱…۰۶»)
- No giant «ژ» watermark in the overlay
- No English subtitle below the Persian title
- No staggered per-card slide-in
- No footer pills (search, EN)

Removed vs. the current `MobileMenu.tsx`:

- No Products view (search input, categories, designs, collections, "تمامی محصولات" CTA)
- No `navMeta` prop
- No view-state machine

---

## 5. Motion

### 5.1 Dialog backdrop

Existing pattern, no change:

```
opacity: 0 → 1   |   duration: var(--dur-dialog)   |   ease: var(--ease-out-soft)
```

Tailwind: `transition-opacity duration-[var(--dur-dialog)] ease-[var(--ease-out-soft)] motion-reduce:transition-none`.

### 5.2 Cards

**No per-card animation.** Cards mount together with the dialog and fade in with the dialog backdrop. No translate, no stagger, no opacity-per-card. This is the restraint variant.

### 5.3 Hamburger icon

Owned by `SiteHeader.tsx`. Currently it animates morph-to-X on `menuOpen=true`. Unchanged.

### 5.4 `prefers-reduced-motion`

The `motion-reduce:transition-none` on the dialog already handles it. Since there is no per-card motion, no additional honoring is needed.

---

## 6. Behavior matrix

| Trigger | Effect |
|---|---|
| Tap any card | `<Link>` navigation to that href + `onClose()` |
| Tap × button (start-top corner) | `onClose()` |
| Press Esc while open | `onClose()` |
| `open` transitions `true → false` | Body-scroll lock released (existing cleanup) |
| `open` transitions `false → true` | Body-scroll locked, focus moved to dialog (existing) |
| Active route changes while menu is open | Active card's `aria-current` and color update on next render (driven by `pathname` prop) |

No tap-outside-to-dismiss — the dialog fills the viewport, no backdrop region exists.

---

## 7. Routes

All link targets already exist; no routing changes.

| Card | href | Status |
|---|---|---|
| سرویس خواب | `/designs` | ✓ exists |
| تخت و وسایل اتاق خواب | `/products` | ✓ exists |
| ژورنال | `/journal` | ✓ exists |
| نمایشگاه‌ها | `/showrooms` | ✓ exists |
| درباره‌ی ما | `/about` | ✓ exists |
| تماس | `/contact` | ✓ exists |

---

## 8. Tests

### 8.1 Vitest (component unit)

`apps/web` still has no `@testing-library/react` wired (`state.md` → `FU-2.1-a`). MobileMenu has no existing component tests and this PR does not introduce them.

Optional pure helper: if a `mobileCardItems()` function (returning `Item[]`) is extracted, it could be tested without rendering. Skip unless it simplifies the component.

### 8.2 Manual smoke

- Open mobile menu (viewport ≤ 768px) → 6 cards visible in the order from §1, brand «ژیک» at the top, × in the start-top corner.
- Tap each card in turn → navigates to the listed href, dialog dismisses.
- Tap × → dialog dismisses.
- Press Esc → dialog dismisses.
- Navigate to `/journal`, open menu → ژورنال card has forest title + forest arrow + `aria-current="page"`. Other cards unchanged.
- Same check at `/products` (تخت و وسایل اتاق خواب) and `/designs/<any-slug>` (سرویس خواب — `isNavActive` matches `/designs/foo` against `/designs`).
- Open menu, scroll the page underneath (should be locked) → background does not scroll.
- Close menu → body scroll restored.
- Reopen the menu → starts fresh (no sticky state to test, but verify no console warnings).
- `prefers-reduced-motion: reduce` (Chrome DevTools → Rendering) → dialog appears instantly, no fade.

### 8.3 Build / typecheck

- `pnpm --filter @zhic/web typecheck` — clean
- `pnpm --filter @zhic/web build` — clean
- `curl http://localhost:3000/` returns 200; inspect HTML for `aria-label="منو"` dialog and `aria-label="بستن"` button

---

## 9. Acceptance criteria

The PR is done when **all** of the following are true:

1. Mobile menu opens to a single view containing exactly 6 cards in the order: سرویس خواب, تخت و وسایل اتاق خواب, ژورنال, نمایشگاه‌ها, درباره‌ی ما, تماس.
2. Tapping any card navigates to the destination listed in §1 and dismisses the dialog.
3. The card whose href matches the current pathname (via `isNavActive`) renders with forest title, forest arrow, and `aria-current="page"`. No other card has those attributes.
4. × button (start-top corner) dismisses the dialog. Esc dismisses the dialog.
5. No search input, categories list, designs list, collections list, "تمامی محصولات" CTA, number badges, English subtitles, watermark, or footer pills are present anywhere in the mobile menu.
6. `MobileMenu` no longer accepts a `navMeta` prop; `SiteHeader` no longer passes it. `navMeta` continues to flow into `SetsMegaMenu` + `PiecesMegaMenu` for desktop.
7. Desktop (≥ 768px) is unchanged. The desktop pill chrome, mega-menus, and nav links are all untouched.
8. Body scroll is locked while the menu is open and restored on close.
9. `prefers-reduced-motion: reduce` makes the dialog appear without the fade transition.
10. `pnpm --filter @zhic/web typecheck` is clean.
11. `pnpm --filter @zhic/web build` is clean.
12. `docs/state.md` is updated: `FU-MM-c` row marked **superseded** with a link to this spec; a new row tracks the Card Nav work.

---

## 10. Follow-ups (out of scope, captured for `state.md`)

| Id (proposed) | Item |
|---|---|
| `FU-CN-a` | Optional: extract `mobileCardItems()` helper and add a unit test once `@testing-library/react` (or a comparable rendering harness) is wired into `apps/web`. |
| `FU-CN-b` | Optional: per-card staggered fade if user testing shows the all-at-once reveal feels abrupt. Strictly opacity (no transform) to keep the restraint posture. |
| `FU-CN-c` | Optional: re-introduce a search affordance on the mobile menu if mobile traffic patterns show product-hunting from the menu surface — likely as a single search pill on the brand row, not as a sub-view. |
| `FU-CN-d` | Optional: re-introduce a designs/products hierarchy as a sub-view if `/products` page filtering proves insufficient for mobile users. |

---

## 11. References

- Mockup pattern source: `apps/web/public/docs/nav-compare-mockup.html` (left phone — "Card Nav" frame). Labels, numbers, watermark, English subtitles, and footer pills in the mockup are out of scope; only the **card-as-affordance** pattern transfers to this spec.
- Superseded spec: `docs/superpowers/specs/2026-05-16-mobile-products-menu-design.md`
- Current implementation: `apps/web/src/components/layout/MobileMenu.tsx`
- Plan: implementation plan to follow via `superpowers:writing-plans` at `docs/superpowers/plans/2026-05-19-mobile-card-nav.md`
- State board entry: `docs/state.md` → `FU-MM-c` (to be marked superseded) + new row for this work
