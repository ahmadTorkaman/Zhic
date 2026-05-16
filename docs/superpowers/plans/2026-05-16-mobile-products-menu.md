# Mobile Products Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert `MobileMenu.tsx` into a two-state dialog (main view + products view) with cross-fade between them, threading the existing `NavMeta` prop one level deeper from `SiteHeader`. Closes `FU-MM-c`.

**Architecture:** Single-file rewrite of `MobileMenu.tsx`. The two views are sub-components in the same file, sharing absolute positioning inside the dialog. Cross-fade is CSS-only via `opacity` transition; `inert` keeps the hidden view out of the tab order. No new files, no new fetchers, no new dependencies.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Tailwind v4.

**Spec:** `docs/superpowers/specs/2026-05-16-mobile-products-menu-design.md`
**Closes:** `FU-MM-c`

---

## File structure

### Files modified

| Path | Change |
|---|---|
| `apps/web/src/components/layout/MobileMenu.tsx` | Full rewrite — adds `navMeta` prop, two-state `view` state, sub-components for main view + products view + each subsection, cross-fade CSS via inline `style.opacity` + `inert`. |
| `apps/web/src/components/layout/SiteHeader.tsx` | One-line change — pass the existing `navMeta` into `<MobileMenu>`. |
| `docs/state.md` | Strike-through `FU-MM-c`, append `FU-MM-c1` through `FU-MM-c6`, add Post-Phase enhancements row. |

### Files explicitly NOT modified

- `apps/web/src/app/(site)/layout.tsx` — already passes `navMeta` to `SiteHeader`; unchanged.
- `apps/web/src/app/lab/site-header/page.tsx` — already passes `EMPTY_NAV_META` to `SiteHeader`; that `EMPTY_NAV_META` value satisfies the existing `NavMeta` type that the rewritten `MobileMenu` consumes — no change needed.
- `apps/web/src/lib/payload.ts` — `NavMeta` type and `fetchNavMeta()` are already in place from the mega-menu work.
- `packages/design-system/*` — tokens and `.site-header-chrome` are unchanged. The mobile menu uses existing tokens (`--dur-dialog`, `--dur-hover`, `--ease-out-soft`, `--tracking-eyebrow-wide`, color palette).

---

## Notes for the implementer

- **React 19's `inert` is a typed boolean prop.** Use `inert={!active}` directly. If TypeScript complains about the prop type, the project uses `@types/react@19+` (per state.md / `node_modules`) which supports it. Do not work around with `as any` or `@ts-expect-error` unless you actually see an error.
- **`navMeta` already arrives at SiteHeader** as a typed prop — the rewrite only needs to add the same prop to `MobileMenu` and forward the data inside.
- **The lab demo page works as-is** because `EMPTY_NAV_META` is a `NavMeta` value with empty arrays — the rewritten MobileMenu handles empty arrays (designs/collections sections silently hidden, categories shows the empty-state line).
- **No `@testing-library/react` in the project** (per `state.md` `FU-2.1-a`). Don't reach for component tests. Manual smoke + typecheck + build are the verification.
- **Esc handling is hierarchical**: in products view → return to main; in main view → call `onClose()`. Implement in the same `useEffect` that exists today.
- **Reset on close**: when `open` transitions `true → false`, set `view = 'main'`. Implement inside the same `useEffect` (an early-return branch when `!open`).
- **The cross-fade is CSS opacity + pointer-events**, NOT visibility/display. Both views must remain in the DOM so React state survives view toggles. Use `inert` (or `tabIndex=-1` as fallback) to keep the inactive view out of the focus tree.

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
- Current branch: `feat/products-mega-menu`
- `git status --short` returns no output (clean tree)
- Top commit is `6507f82 docs(spec): mobile products menu — push-to-screen with cross-fade` (or a later commit if the user added anything)

If not on `feat/products-mega-menu`, run `git checkout feat/products-mega-menu` first.

- [ ] **Step 2: Run baseline tests + typecheck + build**

```bash
pnpm --filter @zhic/web test
pnpm --filter @zhic/web typecheck
```

Expected: 50/50 tests pass. Typecheck clean.

- [ ] **Step 3: No commit — this task verifies state only.**

---

## Task 2: Thread `navMeta` + rewrite `MobileMenu.tsx`

**Files:**
- Modify: `apps/web/src/components/layout/SiteHeader.tsx`
- Modify: `apps/web/src/components/layout/MobileMenu.tsx` (full rewrite)

This task bundles the two changes because they're tightly coupled — the `SiteHeader` change adds a prop that the rewritten `MobileMenu` consumes. Splitting them would leave the typecheck failing in between.

- [ ] **Step 1: Pass `navMeta` from `SiteHeader` to `MobileMenu`**

In `/home/ahmad/Zhic/apps/web/src/components/layout/SiteHeader.tsx`, find the existing line near the bottom of the component:

```tsx
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} pathname={pathname} />
```

Replace with:

```tsx
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} pathname={pathname} navMeta={navMeta} />
```

- [ ] **Step 2: Verify typecheck fails as expected**

```bash
pnpm --filter @zhic/web typecheck
```

Expected: 1 new error in `SiteHeader.tsx` — `Property 'navMeta' does not exist on type 'MobileMenuProps'` (or equivalent). This is the bridge between the two file changes — Step 3 resolves it.

- [ ] **Step 3: Full rewrite of `MobileMenu.tsx`**

Replace the entire contents of `/home/ahmad/Zhic/apps/web/src/components/layout/MobileMenu.tsx` with:

```tsx
'use client';

import { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { NAV_LINKS, isNavActive } from './navLinks';
import type { NavMeta } from '@/lib/payload';

export type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
  pathname: string | null;
  navMeta: NavMeta;
};

type View = 'main' | 'products';

export function MobileMenu({ open, onClose, pathname, navMeta }: MobileMenuProps) {
  const [view, setView] = useState<View>('main');
  const productsViewId = useId();

  // Esc handling (hierarchical) + body scroll lock + reset view on close.
  useEffect(() => {
    if (!open) {
      // Always reopen on the main view.
      setView('main');
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (view === 'products') setView('main');
      else onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, view, onClose]);

  const cornerLabel = view === 'main' ? 'بستن' : 'بازگشت';
  const cornerHandler = view === 'main' ? onClose : () => setView('main');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="منو"
      aria-hidden={!open}
      className={`fixed inset-0 z-[var(--z-overlay)] overflow-y-auto bg-ivory transition-opacity duration-[var(--dur-dialog)] ease-[var(--ease-out-soft)] ${
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <button
        type="button"
        aria-label={cornerLabel}
        onClick={cornerHandler}
        className="absolute start-4 top-3 z-10 flex h-10 w-10 items-center justify-center text-charcoal transition-colors duration-[var(--dur-hover)] hover:text-ink"
      >
        {view === 'main' ? (
          <svg viewBox="0 0 14 14" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M1 1L13 13M13 1L1 13" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 16 16" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M11 3L5 8L11 13" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div className="relative min-h-screen pt-16">
        <MainView
          active={view === 'main'}
          pathname={pathname}
          productsViewId={productsViewId}
          onProductsClick={() => setView('products')}
          onLinkClick={onClose}
        />
        <ProductsView
          active={view === 'products'}
          id={productsViewId}
          navMeta={navMeta}
          onLinkClick={onClose}
        />
      </div>
    </div>
  );
}

// ─────────────────────────── Main view (flat 5-link list) ────────────────────────────

function MainView({
  active,
  pathname,
  productsViewId,
  onProductsClick,
  onLinkClick,
}: {
  active: boolean;
  pathname: string | null;
  productsViewId: string;
  onProductsClick: () => void;
  onLinkClick: () => void;
}) {
  return (
    <div
      aria-label="منوی اصلی"
      inert={!active}
      style={{ opacity: active ? 1 : 0, pointerEvents: active ? 'auto' : 'none' }}
      className="absolute inset-0 flex flex-col items-center gap-7 px-4 py-10 transition-opacity duration-[var(--dur-dialog)] ease-[var(--ease-out-soft)] motion-reduce:transition-none"
    >
      <span className="text-h3 font-black text-charcoal">ژیک</span>

      <ul className="flex flex-col items-center gap-5">
        <li>
          <button
            type="button"
            onClick={onProductsClick}
            aria-controls={productsViewId}
            className="text-h4 font-bold text-charcoal transition-colors duration-[var(--dur-hover)] hover:text-ink"
          >
            محصولات
          </button>
        </li>
        {NAV_LINKS.filter((item) => item.href !== '/products').map((item) => {
          const isActive = isNavActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onLinkClick}
                aria-current={isActive ? 'page' : undefined}
                className={
                  isActive
                    ? 'text-h4 font-bold text-charcoal'
                    : 'text-h4 font-bold text-stone transition-colors duration-[var(--dur-hover)] hover:text-charcoal'
                }
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─────────────────────────── Products view (catalog hierarchy) ────────────────────────────

function ProductsView({
  active,
  id,
  navMeta,
  onLinkClick,
}: {
  active: boolean;
  id: string;
  navMeta: NavMeta;
  onLinkClick: () => void;
}) {
  return (
    <div
      id={id}
      aria-label="منوی محصولات"
      inert={!active}
      style={{ opacity: active ? 1 : 0, pointerEvents: active ? 'auto' : 'none' }}
      className="absolute inset-0 flex flex-col gap-6 px-4 py-10 transition-opacity duration-[var(--dur-dialog)] ease-[var(--ease-out-soft)] motion-reduce:transition-none"
    >
      <h2 className="text-center text-h3 font-black text-charcoal">محصولات</h2>

      <form
        action="/products"
        method="get"
        role="search"
        onSubmit={onLinkClick}
        className="mx-auto flex w-full max-w-[320px] items-center gap-2 rounded-full border border-sand bg-cream px-4 py-2.5 focus-within:border-forest focus-within:bg-ivory"
      >
        <span aria-hidden className="inline-flex text-stone">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="7" cy="7" r="5" />
            <path d="M11 11l3 3" strokeLinecap="round" />
          </svg>
        </span>
        <input
          type="search"
          name="q"
          placeholder="جستجوی محصول…"
          aria-label="جستجو در محصولات"
          className="min-w-0 flex-1 bg-transparent text-body text-charcoal placeholder:text-stone focus:outline-none"
        />
      </form>

      <CategoriesSection items={navMeta.categories} onLinkClick={onLinkClick} />
      {navMeta.designs.length > 0 && <DesignsSection items={navMeta.designs} onLinkClick={onLinkClick} />}
      {navMeta.collections.length > 0 && <CollectionsSection items={navMeta.collections} onLinkClick={onLinkClick} />}

      <Link
        href="/products"
        onClick={onLinkClick}
        className="mt-2 self-center text-h4 font-bold text-charcoal underline underline-offset-4 transition-colors duration-[var(--dur-hover)] hover:text-forest"
      >
        ← تمامی محصولات
      </Link>
    </div>
  );
}

function CategoriesSection({
  items,
  onLinkClick,
}: {
  items: NavMeta['categories'];
  onLinkClick: () => void;
}) {
  return (
    <section aria-labelledby="mob-cats-h" className="flex flex-col gap-3">
      <h3 id="mob-cats-h" className="text-eyebrow font-bold uppercase tracking-[var(--tracking-eyebrow-wide)] text-forest">
        دسته‌بندی‌ها
      </h3>
      {items.length === 0 ? (
        <p className="text-body text-stone">هیچ دسته‌بندی پیدا نشد.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((c) => (
            <li key={c.id}>
              <Link
                href={`/products?cat=${encodeURIComponent(c.slug)}`}
                onClick={onLinkClick}
                className="block text-h4 font-bold text-charcoal transition-colors duration-[var(--dur-hover)] hover:text-forest"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DesignsSection({
  items,
  onLinkClick,
}: {
  items: NavMeta['designs'];
  onLinkClick: () => void;
}) {
  return (
    <section aria-labelledby="mob-designs-h" className="flex flex-col gap-3">
      <h3 id="mob-designs-h" className="text-eyebrow font-bold uppercase tracking-[var(--tracking-eyebrow-wide)] text-forest">
        طرح‌ها
      </h3>
      <ul className="flex flex-col gap-2">
        {items.map((d) => (
          <li key={d.id}>
            <Link
              href={`/products?design=${encodeURIComponent(d.slug)}`}
              onClick={onLinkClick}
              className="block text-h4 font-bold text-charcoal transition-colors duration-[var(--dur-hover)] hover:text-forest"
            >
              {d.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CollectionsSection({
  items,
  onLinkClick,
}: {
  items: NavMeta['collections'];
  onLinkClick: () => void;
}) {
  return (
    <section aria-labelledby="mob-cols-h" className="flex flex-col gap-3">
      <h3 id="mob-cols-h" className="text-eyebrow font-bold uppercase tracking-[var(--tracking-eyebrow-wide)] text-forest">
        مجموعه‌ها
      </h3>
      <ul className="flex flex-col gap-2">
        {items.map((c) => (
          <li key={c.id}>
            <Link
              href={`/collections/${encodeURIComponent(c.slug)}`}
              onClick={onLinkClick}
              className="block text-h4 font-bold text-charcoal transition-colors duration-[var(--dur-hover)] hover:text-forest"
            >
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 4: Verify typecheck clean**

```bash
pnpm --filter @zhic/web typecheck
```

Expected: 0 errors. (The Step 2 typecheck error is now resolved; the new `MobileMenu` accepts `navMeta`.)

- [ ] **Step 5: Verify build clean**

```bash
pnpm --filter @zhic/web build
```

Expected: build succeeds.

If TypeScript complains specifically about the `inert` attribute on the `<div>`, the project's `@types/react` may be older than expected. Fallback: replace `inert={!active}` with `{...(active ? undefined : { inert: '' as unknown as boolean })}` on both view divs. Do not work around with `as any`.

- [ ] **Step 6: Commit both files together**

```bash
git -C /home/ahmad/Zhic add apps/web/src/components/layout/SiteHeader.tsx apps/web/src/components/layout/MobileMenu.tsx
git -C /home/ahmad/Zhic commit -m "feat(web/nav): mobile menu — two-state (main + products) with cross-fade

MobileMenu now accepts navMeta and renders two views inside the same
dialog: a flat main view (5 nav links) and a products view (search +
categories + designs + collections + 'see all' CTA). Tap «محصولات» from
main → cross-fade to products. Tap ← back (corner button morphs from ×
to ←) → returns to main. Esc is hierarchical (products→main→close).

Closes FU-MM-c."
```

---

## Task 3: Build, restart, smoke + manual verify

**Files:** None modified.

- [ ] **Step 1: Rebuild and restart pm2 (workspace runs in next start mode)**

```bash
pnpm --filter @zhic/web build
pm2 restart zhic-web
until curl -sf -o /dev/null http://localhost:3000/; do sleep 0.5; done
```

Expected: pm2 reports `zhic-web` online, curl succeeds.

- [ ] **Step 2: Smoke-test URLs that exercise mobile menu links**

```bash
curl -s -o /dev/null -w "/ → %{http_code}\n" http://localhost:3000/
curl -s -o /dev/null -w "/products?cat=tahbal → %{http_code}\n" "http://localhost:3000/products?cat=tahbal"
curl -s -o /dev/null -w "/products?design=aramesh → %{http_code}\n" "http://localhost:3000/products?design=aramesh"
curl -s -o /dev/null -w "/products?q=تخت → %{http_code}\n" "http://localhost:3000/products?q=%D8%AA%D8%AE%D8%AA"
```

Expected: all four return `200`. (The actual slugs `tahbal` and `aramesh` may not exist in seed; HTTP 200 with empty product list is the correct response. We're verifying the routes accept the params, not data presence.)

- [ ] **Step 3: HTML-probe that the mobile menu still SSRs**

```bash
curl -s http://localhost:3000/ | grep -oE 'aria-label="(منو|بستن|منوی اصلی|منوی محصولات|جستجو در محصولات)"' | sort -u
```

Expected: all five aria-labels present:
- `aria-label="منو"` — outer dialog
- `aria-label="بستن"` — corner button (default state is main, so close label)
- `aria-label="منوی اصلی"` — main view region
- `aria-label="منوی محصولات"` — products view region (rendered but inert)
- `aria-label="جستجو در محصولات"` — search input inside products view

If any is missing, the rewrite didn't take effect or there's a typo — go back and fix before proceeding.

- [ ] **Step 4: Manual verify on a real mobile viewport**

Open `http://80.240.31.146:3000/` on a phone (or browser DevTools at 375×812). Confirm in this order:

1. Hamburger (≡) at top-start of the floating pill is tappable.
2. Tap hamburger → menu opens with cross-fade. Brand ژیک visible, 5 rows (محصولات, ژورنال, نمایشگاه‌ها, درباره‌ی ما, تماس) centered.
3. Tap محصولات → cross-fade to products view. Corner button morphs × → ←. Title «محصولات» visible, search input below, then دسته‌بندی‌ها section with categories, then طرح‌ها / مجموعه‌ها if seeded, then «← تمامی محصولات» link at bottom.
4. Tap ← back → cross-fade back to main view. Corner button morphs ← → ×.
5. Tap محصولات again → enter products view. Tap a category → navigates to `/products?cat=<slug>` and the menu dismisses.
6. Reopen menu → starts on main view (not on products).
7. From products view, press Esc (on keyboard if testing on desktop browser at narrow viewport) → returns to main view.
8. From main view, press Esc → dismisses dialog.
9. Type in the search input, press Enter → navigates to `/products?q=<value>` and the menu dismisses.
10. Verify desktop (≥ 768px) viewport: mobile menu is hidden (overlay is `pointer-events-none opacity-0` when `open=false`). Desktop nav with mega-menu trigger works normally.

If any step fails, capture the failure (screenshot if visual; console error if JS) and fix before moving to Task 4.

- [ ] **Step 5: No commit — verification only.**

---

## Task 4: Update `docs/state.md`

**Files:** Modify: `docs/state.md`.

- [ ] **Step 1: Mark `FU-MM-c` resolved**

Find the row in `docs/state.md` matching `| FU-MM-c | MM | Mobile mega-menu expansion in \`MobileMenu.tsx\``.

Replace with:

```markdown
| ~~FU-MM-c~~ | MM | ~~Mobile mega-menu expansion in `MobileMenu.tsx` — currently «محصولات» is a flat link to `/products` on mobile. Trigger by user research signal.~~ — **resolved 2026-05-16** via two-state MobileMenu (main view + products view, cross-fade transition, corner button morphs ×→←). Hierarchical Esc, reset-on-close, inert-driven a11y. Spec: `docs/superpowers/specs/2026-05-16-mobile-products-menu-design.md`. |
```

- [ ] **Step 2: Append `FU-MM-c1` through `FU-MM-c6` at the end of the Follow-ups table**

Find the last row of the Follow-ups table (it should be `FU-MM-i` from the earlier mega-menu work) and add these 6 rows after it:

```markdown
| FU-MM-c1 | MM | Featured product card on mobile menu. Currently desktop-only. Add when there's a clear customer signal that mobile users want it. |
| FU-MM-c2 | MM | Sub-item counts and subtitles on mobile menu. Reintroduce per category/design/collection if user research shows them missed. |
| FU-MM-c3 | MM | Live autocomplete in mobile search input (carries forward `FU-MM-e`). |
| FU-MM-c4 | MM | Swipe-back gesture (right-edge swipe on RTL) for the products → main transition. Native-app feel, optional polish. |
| FU-MM-c5 | MM | Companion expansion for «درباره‌ی ما» mirroring `FU-MM-g`. |
| FU-MM-c6 | MM | Push-style horizontal slide animation as alternative to cross-fade. User study would gate it. |
```

- [ ] **Step 3: Update the Post-Phase enhancements table**

Find the `### Post-Phase enhancements` heading in the Session status section. Add this row beneath the existing `ProductsMegaMenu` row (and the `floating-island mobile chrome` row if it has been logged):

```markdown
| Mobile products menu | ✅ | (PR HEAD) | Two-state MobileMenu — main view + products view with cross-fade between. Closes FU-MM-c. Search input + categories + designs + collections + "تمامی محصولات" CTA inside products view. Hierarchical Esc, reset-on-close. Spec: `docs/superpowers/specs/2026-05-16-mobile-products-menu-design.md`. Plan: `docs/superpowers/plans/2026-05-16-mobile-products-menu.md`. |
```

If a row for the floating-island chrome work (commit `3fe2125`) does NOT yet exist in this table, add one too:

```markdown
| Mobile header floating pill | ✅ | `3fe2125` | Mobile site header becomes a 12px-inset, rounded-full floating pill ≈42px tall with full-border chrome when scrolled. Desktop unchanged. --header-height bumped to 3.5rem on mobile to track the pill's bottom edge so breadcrumbs and StickyBreadcrumb clear it. HomeHero gets pt-[var(--header-height)] md:pt-0 so the cream image-half starts below the pill instead of being overlapped. |
```

- [ ] **Step 4: Update the Snapshot table**

Find the top Snapshot table. Update the `Current session` row to:

```markdown
| Current session | Mobile products menu shipped on `feat/products-mega-menu`. Closes FU-MM-c. Branch now has: products mega-menu (FU-2.2-a/FU-3.2-u closed), mobile floating-island chrome, two-state mobile menu with search + catalog hierarchy. |
```

Leave `Last updated` at `2026-05-16` (still today).

- [ ] **Step 5: Verify the doc changes look correct**

```bash
grep -n "FU-MM-c\|Mobile products menu\|Mobile header floating pill\|Last updated" /home/ahmad/Zhic/docs/state.md | head -15
```

Expected output should include:
- `| ~~FU-MM-c~~` (strikethrough)
- `FU-MM-c1` through `FU-MM-c6` rows
- `Mobile products menu` row in Post-Phase enhancements
- `Last updated | 2026-05-16`

- [ ] **Step 6: Commit**

```bash
git -C /home/ahmad/Zhic add docs/state.md
git -C /home/ahmad/Zhic commit -m "docs(state): mobile products menu shipped — close FU-MM-c + log 6 follow-ups"
```

---

## Task 5: Push to origin

**Files:** None modified.

- [ ] **Step 1: Verify clean tree**

```bash
git -C /home/ahmad/Zhic status --short
```

Expected: no output (clean).

- [ ] **Step 2: Push to origin**

```bash
git -C /home/ahmad/Zhic push
```

Expected: 2 new commits pushed to `origin/feat/products-mega-menu` (the rewrite and the state.md update). The branch is already tracking origin from the earlier push.

- [ ] **Step 3: Report the new commit hashes for the user**

```bash
git -C /home/ahmad/Zhic log --oneline staging..HEAD | head -5
```

Expected: top 2 commits are the mobile menu rewrite + state.md update. The branch is now ahead of staging by 13 commits total (was 11 from earlier mega-menu work + floating-island; this adds 2).

- [ ] **Step 4: STOP — do not create the PR or do anything further.**

Per the repo pattern (operator opens PRs themselves), Task 5 ends with the branch pushed and ready for human review. Tell the user the GitHub PR URL the push response printed and stop there.

---

## Spec coverage matrix

| Spec § | Requirement | Task |
|---|---|---|
| §0 | Scope cuts documented (no featured, no gestures, no درباره) | Task 2 (component matches scope) |
| §1.1, §1.2 | Two-state visual layout | Task 2 Step 3 (MainView + ProductsView sub-components) |
| §1 | Cross-fade transition | Task 2 Step 3 (CSS `transition-opacity` + `motion-reduce:transition-none`) |
| §2.1 | Files modified list | Task 2 (both files in one commit) |
| §2.3 | Data flow (NavMeta one level deeper) | Task 2 Step 1 (SiteHeader pass-through) + Step 3 (MobileMenu prop) |
| §3.1 | `MobileMenuProps` type with `navMeta` | Task 2 Step 3 (line `navMeta: NavMeta`) |
| §3.2 | `view` state + reset-on-close | Task 2 Step 3 (useState + useEffect early-return) |
| §3.3 | Behavior matrix (Tap محصولات, search submit, Esc) | Task 2 Step 3 (useEffect Esc handler, `onProductsClick`, `onLinkClick` wired everywhere) |
| §3.4 | ARIA (role, aria-label, aria-controls) | Task 2 Step 3 (dialog/region labels, productsViewId via useId) |
| §3.5 | Item link targets (`?cat`, `?design`, `/collections/<slug>`) | Task 2 Step 3 (CategoriesSection/DesignsSection/CollectionsSection) |
| §4.1 | `justify-start` + pt-16 + overflow-y-auto | Task 2 Step 3 (`overflow-y-auto`, `pt-16` on inner container) |
| §4.2 | Cross-fade CSS with both views mounted | Task 2 Step 3 (absolute positioning + opacity + inert) |
| §4.3 | Corner button morphs ×↔← | Task 2 Step 3 (conditional SVG inside the same `<button>`) |
| §4.4 | `prefers-reduced-motion` honored | Task 2 Step 3 (`motion-reduce:transition-none` on both views) |
| §5 | Search input wires to `/products?q=` | Task 2 Step 3 (`<form action="/products" method="get">`) |
| §6 | Empty-state rules | Task 2 Step 3 (Categories shows empty line; Designs/Collections gated on length>0) |
| §7 | Routes (all exist) | No task — verified in Task 3 Step 2 |
| §8 | Manual smoke + typecheck + build | Task 1 Step 2, Task 2 Steps 4-5, Task 3 Steps 1-4 |
| §9 | 12 acceptance criteria | Task 3 Step 4 (manual verify list) |
| §10 | Follow-ups captured | Task 4 Step 2 (FU-MM-c1..c6) |

---

## Out of scope (captured as FU-MM-c* in `state.md`)

- Featured product on mobile → `FU-MM-c1`
- Sub-item counts and subtitles on mobile → `FU-MM-c2`
- Live autocomplete in mobile search → `FU-MM-c3`
- Swipe-back gesture → `FU-MM-c4`
- درباره‌ی ما companion menu → `FU-MM-c5`
- Push-style horizontal slide alt → `FU-MM-c6`
