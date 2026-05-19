# Mobile Card Nav Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `MobileMenu.tsx`'s two-state (main + products) layout with a single-state, six-card flat menu. Drop the `navMeta` prop from `MobileMenu`. Supersedes `FU-MM-c`.

**Architecture:** Single-file rewrite of `MobileMenu.tsx` plus a one-line edit in `SiteHeader.tsx`. No new files, no new dependencies, no routing changes. The mobile menu becomes one decorative `<span>` brand + one `<ul>` of six `<Link>`-wrapped card rows. `pathname` drives the active-state styling via the existing `isNavActive` helper. Body-scroll lock + focus-in-on-open + Esc-dismiss patterns are kept; the hierarchical Esc and view-reset effects are removed.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Tailwind v4.

**Spec:** `docs/superpowers/specs/2026-05-19-mobile-card-nav-design.md`
**Supersedes:** `docs/superpowers/plans/2026-05-16-mobile-products-menu.md` (`FU-MM-c`)

---

## File structure

### Files modified

| Path | Change |
|---|---|
| `apps/web/src/components/layout/MobileMenu.tsx` | Full rewrite — single view, no `View` state, no `ProductsView`/`CategoriesSection`/`DesignsSection`/`CollectionsSection`, drops the `navMeta` prop. Six `<Link>`-wrapped card rows. |
| `apps/web/src/components/layout/SiteHeader.tsx` | One-line edit — remove `navMeta={navMeta}` from `<MobileMenu …>` (kept everywhere else for desktop mega-menus). |
| `docs/state.md` | (a) Replace the "Mobile products menu" row's status to mark it superseded by the Card Nav work. (b) Add a new "Mobile Card Nav" row for the new work. (c) Strike through `FU-MM-c1..FU-MM-c6` (moot — they depended on the products sub-view that no longer exists). (d) Add `FU-CN-a..FU-CN-d` follow-ups from the new spec. |

### Files explicitly NOT modified

- `apps/web/src/components/layout/navLinks.ts` — `NAV_LINKS` and `isNavActive` are reused verbatim.
- `apps/web/src/components/layout/SetsMegaMenu.tsx`, `PiecesMegaMenu.tsx`, `ProductsMegaMenu.tsx` — desktop-only, untouched.
- `apps/web/src/app/(site)/layout.tsx` — still passes `navMeta` into `SiteHeader`; the desktop mega-menus still consume it.
- `apps/web/src/app/lab/site-header/page.tsx` — still passes a `NavMeta` value to `SiteHeader`; the mobile menu rewrite ignores it, the desktop mega-menus still use it.
- `apps/web/src/lib/payload.ts` — `NavMeta` type and `fetchNavMeta()` unchanged.
- `packages/design-system/*` — all tokens used by the rewrite (`--dur-dialog`, `--dur-hover`, `--ease-out-soft`, `--z-overlay`, colors `ivory/cream/sand/stone/charcoal/forest/ink`, text-classes `text-h3`) already exist.

---

## Notes for the implementer

- **The current `MobileMenu.tsx` is 341 lines** (two views + three subsections + `View` state machine + `useId` for aria-controls + hierarchical Esc handler). The rewrite is ~80 lines. Don't try to patch — replace the whole file in one edit.
- **`MobileMenuProps` shrinks**: `{ open, onClose, pathname, navMeta }` → `{ open, onClose, pathname }`. `SiteHeader.tsx` must drop the `navMeta` prop from the `<MobileMenu>` call site in the same task, or typecheck breaks. Bundle the two changes.
- **`navMeta` continues to be needed by `SiteHeader`** for `SetsMegaMenu` and `PiecesMegaMenu`. Do NOT remove `navMeta` from `SiteHeader`'s props or from `<SetsMegaMenu data={navMeta} … />` / `<PiecesMegaMenu data={navMeta} … />`. The only removal is from the `<MobileMenu …>` call.
- **No `@testing-library/react` in `apps/web`** (per `state.md` `FU-2.1-a`). The previous mobile-products plan handled this the same way: manual smoke + typecheck + build. Don't reach for component tests.
- **The `useId` import is removed** — there's no aria-controls relationship now (only one view, no sub-view to point at).
- **The `useRef` import stays** — the focus-into-dialog ref is kept.
- **Active state**: `isNavActive(pathname, item.href)` matches `pathname === item.href` OR `pathname.startsWith(item.href + '/')`. So `/products?cat=foo` matches `/products` (Next's `usePathname` strips the query string). `/designs/whatever-slug` matches `/designs`. This is the desired behavior — no extra logic needed.
- **Item order is significant**: سرویس خواب (`/designs`) first, then تخت و وسایل اتاق خواب (`/products`), then `...NAV_LINKS`. Matches current `MainView` order. Do not alphabetize, do not move سرویس خواب below.
- **The «ژیک» brand is a decorative `<span>`**, not a `<Link>`. Matches current implementation; intentional.
- **No per-card animation.** No staggered fade. No `--i` CSS variable. The dialog backdrop fade is the only motion; cards are static.
- **`<button>` vs. `<Link>` for the close affordance**: keep `<button>` for the × (existing pattern).

---

## Task 1: Branch baseline

**Files:** None modified.

- [ ] **Step 1: Confirm branch + clean tree**

```bash
git -C /home/ahmad/Zhic branch --show-current
git -C /home/ahmad/Zhic status --short
git -C /home/ahmad/Zhic log --oneline -3
```

Expected:
- Current branch: `staging` (or `feat/mobile-card-nav` if the operator created it). Either is acceptable for this plan — the work is one commit and can ride on either.
- `git status --short` may show untracked mockup files in `apps/web/public/docs/`. These belong to other work; do not stage them.
- Top commit on the branch should be `c808069 docs(spec): mobile Card Nav — replace two-state menu with flat 6-card view` (or a later commit if the operator added anything).

If on a different branch, stop and confirm with the operator before proceeding.

- [ ] **Step 2: Run baseline typecheck**

```bash
pnpm --filter @zhic/web typecheck
```

Expected: clean. If it's not clean before the rewrite, fix or surface the pre-existing failure before continuing — don't conflate it with the work in this plan.

- [ ] **Step 3: No commit — this task verifies state only.**

---

## Task 2: Rewrite `MobileMenu.tsx` + drop `navMeta` from `SiteHeader`

**Files:**
- Modify: `apps/web/src/components/layout/SiteHeader.tsx` (one-line edit, line 92)
- Modify: `apps/web/src/components/layout/MobileMenu.tsx` (full rewrite, ~341 lines → ~80 lines)

This task bundles the two file changes because they're tightly coupled — dropping the prop from one without the other leaves typecheck broken in between. The previous `MobileMenu` task did the same bundling for the same reason.

- [ ] **Step 1: Remove `navMeta` from `<MobileMenu>` in `SiteHeader.tsx`**

In `/home/ahmad/Zhic/apps/web/src/components/layout/SiteHeader.tsx`, find the last line of the component (currently line 92):

```tsx
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} pathname={pathname} navMeta={navMeta} />
```

Replace with:

```tsx
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} pathname={pathname} />
```

Do not change any other line in `SiteHeader.tsx`. `navMeta` is still used by `<SetsMegaMenu data={navMeta} … />` and `<PiecesMegaMenu data={navMeta} … />` above.

- [ ] **Step 2: Verify typecheck fails as expected**

```bash
pnpm --filter @zhic/web typecheck
```

Expected: 1 error in `MobileMenu.tsx` — the file still declares `navMeta` as required in `MobileMenuProps` but `SiteHeader` no longer passes it. This is the bridge between the two changes; Step 3 resolves it.

- [ ] **Step 3: Replace `MobileMenu.tsx` with the Card Nav rewrite**

Replace the entire contents of `/home/ahmad/Zhic/apps/web/src/components/layout/MobileMenu.tsx` with:

```tsx
'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { NAV_LINKS, isNavActive } from './navLinks';

export type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
  pathname: string | null;
};

type Item = { label: string; href: string };

// Sets + Pieces are hardcoded here because SetsMegaMenu / PiecesMegaMenu
// own them on desktop and they don't live in NAV_LINKS. Order matches the
// previous MainView layout so the mobile and desktop nav read the same.
const ITEMS: Item[] = [
  { label: 'سرویس خواب', href: '/designs' },
  { label: 'تخت و وسایل اتاق خواب', href: '/products' },
  ...NAV_LINKS,
];

export function MobileMenu({ open, onClose, pathname }: MobileMenuProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Body scroll lock — keyed on `open`.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Esc dismisses. Flat — no sub-views to step back through.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  // Move focus into the dialog when it opens so keyboard / AT users
  // don't stay focused on the hamburger button behind the overlay.
  useEffect(() => {
    if (open) {
      dialogRef.current?.focus();
    }
  }, [open]);

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="منو"
      aria-hidden={!open}
      className={`fixed inset-0 z-[var(--z-overlay)] overflow-y-auto bg-ivory transition-opacity duration-[var(--dur-dialog)] ease-[var(--ease-out-soft)] motion-reduce:transition-none focus:outline-none ${
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <button
        type="button"
        aria-label="بستن"
        onClick={onClose}
        className="absolute start-4 top-3 z-10 flex h-10 w-10 items-center justify-center text-charcoal transition-colors duration-[var(--dur-hover)] hover:text-ink"
      >
        <svg viewBox="0 0 14 14" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M1 1L13 13M13 1L1 13" strokeLinecap="round" />
        </svg>
      </button>

      <div className="relative flex min-h-screen flex-col items-center gap-7 px-4 py-10 pt-16">
        <span className="text-h3 font-black text-charcoal">ژیک</span>

        <ul aria-label="پیمایش اصلی" className="flex w-full max-w-[420px] flex-col gap-2.5">
          {ITEMS.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  aria-current={active ? 'page' : undefined}
                  className="group flex items-center gap-3 rounded-[14px] border border-sand bg-cream px-5 py-4 transition-colors duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] hover:bg-ivory"
                >
                  <span
                    className={`flex-1 text-[22px] font-black leading-[1.15] tracking-[-0.01em] ${
                      active ? 'text-forest' : 'text-charcoal'
                    }`}
                  >
                    {item.label}
                  </span>
                  <svg
                    viewBox="0 0 16 16"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden
                    className={active ? 'text-forest' : 'text-stone'}
                  >
                    <path d="M11 3L5 8L11 13" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify typecheck is clean**

```bash
pnpm --filter @zhic/web typecheck
```

Expected: clean, zero errors.

- [ ] **Step 5: Verify build is clean**

```bash
pnpm --filter @zhic/web build
```

Expected: build succeeds. If it fails, check the error against the rewrite — common gotchas: missing class in Tailwind safelist (unlikely here, all classes are static), typo in CSS var name.

- [ ] **Step 6: Commit**

```bash
git -C /home/ahmad/Zhic add apps/web/src/components/layout/MobileMenu.tsx apps/web/src/components/layout/SiteHeader.tsx
git -C /home/ahmad/Zhic commit -m "$(cat <<'EOF'
feat(mobile-menu): rewrite as flat 6-card view, drop products sub-view

Replaces the two-state MobileMenu (main + products) with a single flat
view of six cards: سرویس خواب, تخت و وسایل اتاق خواب, ژورنال, نمایشگاه‌ها,
درباره‌ی ما, تماس. Each card navigates directly to its destination; the
catalog hierarchy (categories / designs / collections / search) is no
longer surfaced in the menu — users find it via /products itself.

Drops the navMeta prop from MobileMenu; SiteHeader keeps navMeta for
the desktop mega-menus. Restraint variant of Card Nav: no number badges,
no watermark, no English subtitles, no per-card stagger, no footer pills.

Supersedes the FU-MM-c work shipped 2026-05-16.

Spec: docs/superpowers/specs/2026-05-19-mobile-card-nav-design.md
Plan: docs/superpowers/plans/2026-05-19-mobile-card-nav.md
EOF
)"
```

---

## Task 3: Manual smoke check

**Files:** None modified.

This task is a checklist run against a local dev server. If anything fails, fix it and amend Task 2's commit or add a follow-up commit before moving to Task 4.

- [ ] **Step 1: Start the dev server**

```bash
pnpm --filter @zhic/web dev
```

Expected: server up on `http://localhost:3000` (or the port the project uses — check the output).

- [ ] **Step 2: Open the site in a browser at mobile width**

In Chrome / Firefox DevTools, switch to a mobile viewport (e.g. iPhone 13 — 390 × 844, or any width ≤ 767px). Navigate to `http://localhost:3000/`.

- [ ] **Step 3: Open the mobile menu**

Tap the hamburger button (start-edge of the floating pill header). Expected:
- Hamburger morphs to X (existing SiteHeader behavior, unchanged).
- Dialog fades in.
- × button visible at start-top corner.
- «ژیک» brand visible, centered, near the top.
- Six cards visible in this order:
  1. سرویس خواب
  2. تخت و وسایل اتاق خواب
  3. ژورنال
  4. نمایشگاه‌ها
  5. درباره‌ی ما
  6. تماس
- Each card has cream background, sand border, rounded corners.
- Each card has a chevron pointing inline-start (visually ← in RTL) at the end.
- No search input, no «دسته‌بندی‌ها» section, no «طرح‌ها» section, no «مجموعه‌ها» section, no «تمامی محصولات» CTA, no number badges, no English subtitles, no «ژ» watermark, no footer pills.

- [ ] **Step 4: Verify each card navigates correctly**

Tap each card in turn. After each tap, expected: URL changes to the destination listed below, dialog dismisses. Tap the hamburger again between checks to re-open.

| Card | Expected URL |
|---|---|
| سرویس خواب | `/designs` |
| تخت و وسایل اتاق خواب | `/products` |
| ژورنال | `/journal` |
| نمایشگاه‌ها | `/showrooms` |
| درباره‌ی ما | `/about` |
| تماس | `/contact` |

- [ ] **Step 5: Verify active-state styling**

Navigate to `/journal` (or whatever page; example uses ژورنال). Open the menu. Expected:
- The ژورنال card's title renders in forest (`#5F7760`).
- The ژورنال card's chevron renders in forest.
- All other cards' titles render in charcoal, chevrons in stone.
- The ژورنال card has `aria-current="page"` (inspect element to verify).
- Card background and border are unchanged (still cream + sand).

Repeat for `/products` (expect تخت و وسایل اتاق خواب active) and `/designs/<any-slug>` (expect سرویس خواب active — `isNavActive` matches the `/designs` prefix). If `/designs` has no detail page yet, navigate to `/designs` alone and verify سرویس خواب is active.

- [ ] **Step 6: Verify Esc + × dismiss the dialog**

Open the menu. Press Esc. Expected: dialog dismisses.

Open the menu again. Tap the × button. Expected: dialog dismisses.

- [ ] **Step 7: Verify body scroll lock**

Navigate to a long page (e.g. `/journal` or `/about`). Open the menu. Try to scroll the page underneath the open dialog by swiping / scrolling outside the card list. Expected: page does not scroll. Close the menu. Expected: page scroll restored — try scrolling, it should work normally.

- [ ] **Step 8: Verify `prefers-reduced-motion`**

In Chrome DevTools → Rendering panel → enable "Emulate CSS media feature `prefers-reduced-motion: reduce`". Open the menu. Expected: dialog appears instantly with no fade transition. Close it — instant again.

Disable the emulation when done.

- [ ] **Step 9: Verify desktop (≥ 768px) is unchanged**

Switch the viewport to desktop width (≥ 768px). Navigate to `/`. Expected:
- Pill chrome with the brand «ژیک» centered.
- Desktop nav visible with `SetsMegaMenu`, `PiecesMegaMenu`, plus ژورنال · نمایشگاه‌ها · درباره‌ی ما · تماس.
- Hovering `SetsMegaMenu` / `PiecesMegaMenu` opens the mega-menus with their category / design / collection content (this proves `navMeta` is still wired up upstream).
- No mobile hamburger visible.

- [ ] **Step 10: No commit — manual smoke verifies state only.**

If any step fails, fix the rewrite and amend (or follow-up commit) Task 2 before proceeding to Task 4.

---

## Task 4: Update `docs/state.md`

**Files:**
- Modify: `docs/state.md` (multiple sections — current/shipped table, follow-ups table)

The shipped row from 2026-05-16 needs to be marked superseded. The old follow-ups `FU-MM-c1..FU-MM-c6` are moot — they all depended on the products sub-view that this work removes. New follow-ups from the spec land as `FU-CN-a..FU-CN-d`.

- [ ] **Step 1: Read the current state.md to anchor the edits**

```bash
grep -n "Mobile products menu\|FU-MM-c" /home/ahmad/Zhic/docs/state.md
```

Expected: a row near line 116 ("Mobile products menu") in the shipped/current table; the struck-through `~~FU-MM-c~~` row near line 282; the `FU-MM-c1..FU-MM-c6` rows near lines 289-294.

- [ ] **Step 2: Mark the shipped row as superseded**

Find the row (near line 116):

```
| Mobile products menu | ✅ | (PR HEAD) | Two-state MobileMenu — main view + products view with cross-fade between. Closes FU-MM-c. Search input + categories + designs + collections + "تمامی محصولات" CTA inside products view. Hierarchical Esc, reset-on-close. Spec: `docs/superpowers/specs/2026-05-16-mobile-products-menu-design.md`. Plan: `docs/superpowers/plans/2026-05-16-mobile-products-menu.md`. |
```

Replace its description (the fourth column) so it becomes:

```
| Mobile products menu | ⚠️ superseded | (PR HEAD) | Two-state MobileMenu (main view + products view, cross-fade). **Superseded 2026-05-19** by the Mobile Card Nav flat 6-card view — see row below. Original spec: `docs/superpowers/specs/2026-05-16-mobile-products-menu-design.md`. Original plan: `docs/superpowers/plans/2026-05-16-mobile-products-menu.md`. |
```

The status changes from `✅` to `⚠️ superseded`. The first three columns stay the same (or as close as the table-formatting allows — match what's in the rest of the table).

- [ ] **Step 3: Add a new row for the Mobile Card Nav work**

Insert this row immediately *after* the row from Step 2 (so superseded → new sit adjacent):

```
| Mobile Card Nav | ✅ | (PR HEAD) | Single-view flat menu — 6 cards (سرویس خواب · تخت و وسایل اتاق خواب · ژورنال · نمایشگاه‌ها · درباره‌ی ما · تماس). Replaces the two-state mobile menu; drops the products sub-view (search + categories + designs + collections + "تمامی محصولات"). Restraint variant: no number badges, no watermark, no English subtitles, no per-card stagger, no footer pills. Active card = forest title + forest arrow + `aria-current="page"`. Spec: `docs/superpowers/specs/2026-05-19-mobile-card-nav-design.md`. Plan: `docs/superpowers/plans/2026-05-19-mobile-card-nav.md`. |
```

- [ ] **Step 4: Strike through `FU-MM-c1..FU-MM-c6` follow-ups (all moot)**

For each of the six rows near lines 289-294, wrap the description in `~~...~~` strike-through and append the supersession note. Resulting rows:

```
| ~~FU-MM-c1~~ | MM | ~~Featured product card on mobile menu. Currently desktop-only. Add when there's a clear customer signal that mobile users want it.~~ — **moot 2026-05-19** (mobile menu no longer has a sub-view to hang a featured card on; see Mobile Card Nav). |
| ~~FU-MM-c2~~ | MM | ~~Sub-item counts and subtitles on mobile menu. Reintroduce per category/design/collection if user research shows them missed.~~ — **moot 2026-05-19** (no categories/designs/collections list in the mobile menu anymore). |
| ~~FU-MM-c3~~ | MM | ~~Live autocomplete in mobile search input (carries forward `FU-MM-e`).~~ — **moot 2026-05-19** (no search input in the mobile menu; carries forward as `FU-CN-c`). |
| ~~FU-MM-c4~~ | MM | ~~Swipe-back gesture (right-edge swipe on RTL) for the products → main transition. Native-app feel, optional polish.~~ — **moot 2026-05-19** (no products → main transition; the menu is flat). |
| ~~FU-MM-c5~~ | MM | ~~Companion expansion for «درباره‌ی ما» mirroring `FU-MM-g`.~~ — **moot 2026-05-19** (flat menu has no expansion mechanism; could reland as `FU-CN-d` if `/products` page filtering proves insufficient). |
| ~~FU-MM-c6~~ | MM | ~~Push-style horizontal slide animation as alternative to cross-fade. User study would gate it.~~ — **moot 2026-05-19** (no view transition to animate). |
```

- [ ] **Step 5: Add new `FU-CN-a..FU-CN-d` follow-up rows**

Append these four rows to the same follow-ups table, immediately after the (now-struck-through) `FU-MM-c6` row:

```
| FU-CN-a | MM | Optional: extract `mobileCardItems()` helper from `MobileMenu.tsx` and add a unit test once `@testing-library/react` (or a comparable rendering harness) is wired into `apps/web` (per `FU-2.1-a`). |
| FU-CN-b | MM | Optional: per-card staggered fade-in if user testing shows the all-at-once reveal feels abrupt. Strictly opacity (no transform) to keep the restraint posture. |
| FU-CN-c | MM | Optional: re-introduce a search affordance on the mobile menu if mobile traffic shows product-hunting from the menu surface. Likely as a single search pill on the brand row, not a sub-view. Carries forward from `FU-MM-c3`. |
| FU-CN-d | MM | Optional: re-introduce a designs/products hierarchy as a sub-view if `/products` page filtering proves insufficient for mobile users. Carries forward from `FU-MM-c5`. |
```

- [ ] **Step 6: Verify the file still parses as Markdown**

Open `docs/state.md` in a Markdown previewer (VSCode preview pane, GitHub's blob view, or any other) and skim the affected sections. Expected:
- The shipped/current table still renders without broken columns.
- The follow-ups table still renders without broken columns.
- Strike-through formatting (`~~...~~`) renders as struck-through.

No automated check — eyeball it.

- [ ] **Step 7: Commit**

```bash
git -C /home/ahmad/Zhic add docs/state.md
git -C /home/ahmad/Zhic commit -m "$(cat <<'EOF'
docs(state): mark Mobile Card Nav shipped, supersede FU-MM-c follow-ups

Mobile products menu row marked superseded; new Mobile Card Nav row
added. FU-MM-c1..FU-MM-c6 all struck through as moot (they depended
on the products sub-view that this work removes). FU-CN-a..FU-CN-d
added from the Card Nav spec.

Spec: docs/superpowers/specs/2026-05-19-mobile-card-nav-design.md
Plan: docs/superpowers/plans/2026-05-19-mobile-card-nav.md
EOF
)"
```

---

## Task 5: Final verification

**Files:** None modified.

- [ ] **Step 1: Final typecheck + build**

```bash
pnpm --filter @zhic/web typecheck
pnpm --filter @zhic/web build
```

Expected: both clean.

- [ ] **Step 2: Verify the commit log**

```bash
git -C /home/ahmad/Zhic log --oneline -5
```

Expected (top to bottom):
1. `docs(state): mark Mobile Card Nav shipped, supersede FU-MM-c follow-ups`
2. `feat(mobile-menu): rewrite as flat 6-card view, drop products sub-view`
3. `docs(spec): mobile Card Nav — replace two-state menu with flat 6-card view` (the spec commit, already in place from before this plan ran — `c808069`)
4. … (prior commits)

- [ ] **Step 3: Verify clean tree**

```bash
git -C /home/ahmad/Zhic status --short
```

Expected: no modified files. Untracked mockup files from earlier work may still be present — they belong to other branches/PRs and are not in scope here.

- [ ] **Step 4: No commit — final verification only.**

---

## Acceptance criteria (lifted from the spec)

Cross-referenced for the implementer; do not skip any:

1. Mobile menu opens to a single view of exactly 6 cards in the order: سرویس خواب, تخت و وسایل اتاق خواب, ژورنال, نمایشگاه‌ها, درباره‌ی ما, تماس. **Task 3 step 3.**
2. Tapping a card navigates to its destination and dismisses the dialog. **Task 3 step 4.**
3. Active card (matching pathname via `isNavActive`) has forest title, forest arrow, and `aria-current="page"`. Only one card active at a time. **Task 3 step 5.**
4. × dismisses; Esc dismisses; no tap-outside-dismiss (no backdrop area). **Task 3 step 6.**
5. No search, no categories/designs/collections list, no "تمامی محصولات" CTA, no number badges, no English subtitles, no watermark, no footer pills. **Task 3 step 3.**
6. `MobileMenu` no longer accepts a `navMeta` prop; `SiteHeader` no longer passes it. **Task 2 steps 1 + 3.**
7. Desktop (≥ 768px) is unchanged — pill chrome, mega-menus, nav links, hover behavior. **Task 3 step 9.**
8. Body scroll locked on open, restored on close. **Task 3 step 7.**
9. `prefers-reduced-motion: reduce` makes the dialog appear without fade. **Task 3 step 8.**
10. `pnpm --filter @zhic/web typecheck` clean. **Task 2 step 4, Task 5 step 1.**
11. `pnpm --filter @zhic/web build` clean. **Task 2 step 5, Task 5 step 1.**
12. `docs/state.md` updated: shipped row superseded, new row added, `FU-MM-c1..c6` struck through, `FU-CN-a..d` added. **Task 4.**

---

## References

- Spec: `docs/superpowers/specs/2026-05-19-mobile-card-nav-design.md`
- Superseded spec: `docs/superpowers/specs/2026-05-16-mobile-products-menu-design.md`
- Superseded plan: `docs/superpowers/plans/2026-05-16-mobile-products-menu.md`
- Mockup pattern source: `apps/web/public/docs/nav-compare-mockup.html` (left phone)
- Current implementation reference: `apps/web/src/components/layout/MobileMenu.tsx` (pre-rewrite)
- State board: `docs/state.md`
