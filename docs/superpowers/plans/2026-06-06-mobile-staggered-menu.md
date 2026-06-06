# Mobile Staggered Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mobile `MobileMenu` fade-dialog with a GSAP staggered-panel menu (React Bits `StaggeredMenu` mechanics) in Zhic quiet-luxury styling, keeping the existing trigger, API, and a11y behavior.

**Architecture:** `MobileMenu.tsx` is rewritten in place — same `{open, onClose, pathname}` props plus optional `socials`. Open/close is driven by the `open` prop via GSAP timelines (prelayer sweep → panel → staggered items → numerals → socials). `SiteHeader` and `layout.tsx` only gain socials pass-through. Spec: `docs/superpowers/specs/2026-06-06-mobile-staggered-menu-design.md`.

**Tech Stack:** Next.js 16 App Router client component, GSAP 3 (already a dependency), plain CSS file colocated per layout convention, vitest + @testing-library/react (jsdom) with gsap mocked.

**Working dir:** `/home/ahmad/Zhic` on branch `feat/pre-import-refactors` (continue in place — session has live uncommitted work; do NOT create a worktree).

---

### Task 1: Export `SOCIAL_LABELS` from FooterContactStrip

The mobile menu reuses the Persian platform labels; they already exist as a module constant.

**Files:**
- Modify: `apps/web/src/components/layout/FooterContactStrip.tsx:22`

- [ ] **Step 1: Add `export` to the constant**

```tsx
// before
const SOCIAL_LABELS: Record<SocialLink['platform'], string> = {
// after
export const SOCIAL_LABELS: Record<SocialLink['platform'], string> = {
```

- [ ] **Step 2: Typecheck**

Run: `cd /home/ahmad/Zhic/apps/web && npx tsc --noEmit 2>&1 | head -5`
Expected: no NEW errors mentioning FooterContactStrip (pre-existing unrelated errors, if any, are fine).

- [ ] **Step 3: Commit**

```bash
cd /home/ahmad/Zhic && git add apps/web/src/components/layout/FooterContactStrip.tsx && git commit -m "refactor: export SOCIAL_LABELS for reuse in mobile menu"
```

---

### Task 2: Failing tests for the new MobileMenu contract

**Files:**
- Create: `apps/web/src/components/layout/__tests__/MobileMenu.test.tsx`

- [ ] **Step 1: Write the test file**

```tsx
/** @vitest-environment jsdom */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';

// GSAP runs real animations against rAF/layout that jsdom doesn't have.
// Stub the full surface MobileMenu uses.
vi.mock('gsap', () => {
  const timeline = () => {
    const tl: Record<string, unknown> = {};
    tl.fromTo = vi.fn(() => tl);
    tl.to = vi.fn(() => tl);
    tl.eventCallback = vi.fn(() => tl);
    tl.play = vi.fn(() => tl);
    tl.kill = vi.fn();
    return tl;
  };
  return {
    gsap: {
      set: vi.fn(),
      to: vi.fn(() => ({ kill: vi.fn() })),
      timeline: vi.fn(timeline),
    },
  };
});

import { MobileMenu } from '../MobileMenu';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
});

const SOCIALS = [
  { platform: 'instagram' as const, url: 'https://instagram.com/zhic' },
  { platform: 'telegram' as const, url: 'https://t.me/zhic' },
];

describe('MobileMenu (staggered)', () => {
  it('renders all six nav items with hrefs', () => {
    const { container } = render(
      <MobileMenu open onClose={() => {}} pathname="/" />,
    );
    const links = container.querySelectorAll('.zh-mm__link');
    expect(links.length).toBe(6);
    expect(links[0]!.getAttribute('href')).toBe('/bedroom-set');
    expect(links[1]!.getAttribute('href')).toBe('/bedroom-furniture');
  });

  it('marks the list for numbering', () => {
    const { container } = render(
      <MobileMenu open onClose={() => {}} pathname="/" />,
    );
    expect(container.querySelector('.zh-mm__list[data-numbering]')).not.toBeNull();
  });

  it('flags the active item with aria-current', () => {
    const { container } = render(
      <MobileMenu open onClose={() => {}} pathname="/journal" />,
    );
    const active = container.querySelector('[aria-current="page"]');
    expect(active?.getAttribute('href')).toBe('/journal');
  });

  it('renders socials when provided and omits the block when empty', () => {
    const { container, rerender } = render(
      <MobileMenu open onClose={() => {}} pathname="/" socials={SOCIALS} />,
    );
    const links = container.querySelectorAll('.zh-mm__social-link');
    expect(links.length).toBe(2);
    expect(links[0]!.textContent).toBe('اینستاگرام');
    rerender(<MobileMenu open onClose={() => {}} pathname="/" socials={[]} />);
    expect(container.querySelector('.zh-mm__socials')).toBeNull();
  });

  it('Escape calls onClose while open', () => {
    const onClose = vi.fn();
    render(<MobileMenu open onClose={onClose} pathname="/" />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('clicking a nav link calls onClose', () => {
    const onClose = vi.fn();
    const { container } = render(
      <MobileMenu open onClose={onClose} pathname="/" />,
    );
    fireEvent.click(container.querySelector('.zh-mm__link')!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('dialog is aria-hidden when closed', () => {
    const { container } = render(
      <MobileMenu open={false} onClose={() => {}} pathname="/" />,
    );
    expect(
      container.querySelector('[role="dialog"]')?.getAttribute('aria-hidden'),
    ).toBe('true');
  });
});
```

- [ ] **Step 2: Run, verify the NEW expectations fail**

Run: `cd /home/ahmad/Zhic/apps/web && npx vitest run src/components/layout/__tests__/MobileMenu.test.tsx 2>&1 | tail -15`
Expected: FAIL — `.zh-mm__link` selectors find 0 elements (current markup has no `zh-mm` classes), socials prop unknown. Esc/aria-hidden tests may already pass; that's fine.

- [ ] **Step 3: Commit the failing tests**

```bash
cd /home/ahmad/Zhic && git add apps/web/src/components/layout/__tests__/MobileMenu.test.tsx && git commit -m "test: contract for staggered mobile menu (failing)"
```

---

### Task 3: Menu CSS

**Files:**
- Create: `apps/web/src/components/layout/mobile-menu.css`

- [ ] **Step 1: Write the stylesheet**

```css
/* apps/web/src/components/layout/mobile-menu.css */
/* Staggered mobile menu — React Bits StaggeredMenu mechanics in Zhic skin.
   GSAP owns transforms/opacity at runtime; this file is layout + paint. */

.zh-mm {
  position: fixed;
  inset: 0;
  z-index: var(--z-overlay);
  pointer-events: none;
}
.zh-mm[data-open='true'] { pointer-events: auto; }

/* Sweep layers — sit under the panel, slide in from the inline-start…
   physically the RIGHT edge in RTL (GSAP xPercent 100 → 0). */
.zh-mm__prelayers { position: absolute; inset: 0; pointer-events: none; }
.zh-mm__prelayer { position: absolute; inset: 0; will-change: transform; }
.zh-mm__prelayer--1 { background: var(--color-forest); }
.zh-mm__prelayer--2 { background: var(--color-forest-dark); }

.zh-mm__panel {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  padding: 4.5rem var(--space-5) var(--space-6);
  background: var(--color-ivory);
  overflow-y: auto;
  will-change: transform;
}

.zh-mm__close {
  position: absolute;
  top: 0.75rem;
  inset-inline-start: 1rem;
  z-index: 2;
  display: flex;
  width: 2.5rem;
  height: 2.5rem;
  align-items: center;
  justify-content: center;
  color: var(--color-charcoal);
  transition: color var(--dur-hover) var(--ease-out-soft);
}
.zh-mm__close:hover { color: var(--color-ink); }

.zh-mm__brand {
  margin-bottom: var(--space-6);
  text-align: center;
}
.zh-mm__brand img { display: inline-block; height: 22px; width: auto; }

.zh-mm__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  counter-reset: zhMmItem;
}
/* Each row clips its label for the yPercent-140 entrance. */
.zh-mm__itemWrap { position: relative; overflow: hidden; line-height: 1; }
.zh-mm__link {
  position: relative;
  display: inline-block;
  padding-inline-end: 2.2em; /* room for the numeral (inline-end = visual left in RTL) */
  font-size: var(--text-h3);
  font-weight: 900;
  line-height: 1.25;
  color: var(--color-charcoal);
  text-decoration: none;
  transition: color var(--dur-hover) var(--ease-out-soft);
}
.zh-mm__link:hover, .zh-mm__link.is-active { color: var(--color-forest); }
.zh-mm__label {
  display: inline-block;
  will-change: transform;
  transform-origin: 50% 100%;
}
/* Persian numerals — GSAP fades them via --zh-mm-num-opacity. Six static
   items, so the leading «۰» is hardcoded rather than a counter style. */
.zh-mm__list[data-numbering] .zh-mm__link::after {
  counter-increment: zhMmItem;
  content: '۰' counter(zhMmItem, persian);
  position: absolute;
  top: 0.15em;
  inset-inline-end: 0;
  font-size: 13px;
  font-weight: 400;
  color: var(--color-gold);
  opacity: var(--zh-mm-num-opacity, 0);
  pointer-events: none;
  user-select: none;
}

.zh-mm__socials {
  margin-top: auto;
  padding-top: var(--space-7);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.zh-mm__socials-title {
  margin: 0;
  font-size: var(--text-eyebrow);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: var(--tracking-eyebrow-wide);
  color: var(--color-gold);
}
.zh-mm__socials-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
}
.zh-mm__social-link {
  display: inline-block;
  font-size: var(--text-small);
  font-weight: 700;
  color: var(--color-stone);
  text-decoration: none;
  transition: color var(--dur-hover) var(--ease-out-soft);
}
.zh-mm__social-link:hover { color: var(--color-forest); }
```

- [ ] **Step 2: Commit**

```bash
cd /home/ahmad/Zhic && git add apps/web/src/components/layout/mobile-menu.css && git commit -m "feat: staggered mobile menu styles"
```

---

### Task 4: Rewrite MobileMenu

**Files:**
- Modify: `apps/web/src/components/layout/MobileMenu.tsx` (full rewrite)
- Test: `apps/web/src/components/layout/__tests__/MobileMenu.test.tsx` (from Task 2)

- [ ] **Step 1: Replace the component**

```tsx
'use client';

import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { NAV_LINKS, isNavActive } from './navLinks';
import { SOCIAL_LABELS, type SocialLink } from './FooterContactStrip';
import './mobile-menu.css';

export type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
  pathname: string | null;
  socials?: SocialLink[];
};

type Item = { label: string; href: string };

// Sets + Pieces are hardcoded here because SetsMegaMenu / PiecesMegaMenu
// own them on desktop and they don't live in NAV_LINKS. Order matches the
// previous MainView layout so the mobile and desktop nav read the same.
const ITEMS: Item[] = [
  { label: 'سرویس خواب', href: '/bedroom-set' },
  { label: 'مبلمان اتاق خواب', href: '/bedroom-furniture' },
  ...NAV_LINKS,
];

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function MobileMenu({ open, onClose, pathname, socials = [] }: MobileMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const prelayersRef = useRef<HTMLDivElement>(null);
  const openTlRef = useRef<ReturnType<typeof gsap.timeline> | null>(null);
  const closeTweenRef = useRef<ReturnType<typeof gsap.to> | null>(null);
  const firstRunRef = useRef(true);

  // Park panel + sweep layers past the RIGHT edge (RTL entrance side).
  useLayoutEffect(() => {
    const panel = panelRef.current;
    const layers = prelayersRef.current ? Array.from(prelayersRef.current.children) : [];
    if (!panel) return;
    gsap.set([...layers, panel], { xPercent: 100 });
  }, []);

  const resetHiddenStates = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const labels = panel.querySelectorAll('.zh-mm__label');
    const numbered = panel.querySelectorAll('.zh-mm__list[data-numbering] .zh-mm__link');
    const socialTitle = panel.querySelector('.zh-mm__socials-title');
    const socialLinks = panel.querySelectorAll('.zh-mm__social-link');
    if (labels.length) gsap.set(labels, { yPercent: 140, rotate: 10 });
    if (numbered.length) gsap.set(numbered, { '--zh-mm-num-opacity': 0 });
    if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
    if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });
  }, []);

  const playOpen = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const layers = prelayersRef.current ? Array.from(prelayersRef.current.children) : [];

    closeTweenRef.current?.kill();
    closeTweenRef.current = null;
    openTlRef.current?.kill();

    const labels = panel.querySelectorAll('.zh-mm__label');
    const numbered = panel.querySelectorAll('.zh-mm__list[data-numbering] .zh-mm__link');
    const socialTitle = panel.querySelector('.zh-mm__socials-title');
    const socialLinks = panel.querySelectorAll('.zh-mm__social-link');

    if (prefersReduced()) {
      gsap.set([...layers, panel], { xPercent: 0 });
      if (labels.length) gsap.set(labels, { yPercent: 0, rotate: 0 });
      if (numbered.length) gsap.set(numbered, { '--zh-mm-num-opacity': 1 });
      if (socialTitle) gsap.set(socialTitle, { opacity: 1 });
      if (socialLinks.length) gsap.set(socialLinks, { y: 0, opacity: 1 });
      return;
    }

    resetHiddenStates();

    // Timings ported 1:1 from React Bits StaggeredMenu.
    const tl = gsap.timeline();
    layers.forEach((el, i) => {
      tl.fromTo(el, { xPercent: 100 }, { xPercent: 0, duration: 0.5, ease: 'power4.out' }, i * 0.07);
    });
    const lastTime = layers.length ? (layers.length - 1) * 0.07 : 0;
    const panelInsertTime = lastTime + (layers.length ? 0.08 : 0);
    const panelDuration = 0.65;
    tl.fromTo(
      panel,
      { xPercent: 100 },
      { xPercent: 0, duration: panelDuration, ease: 'power4.out' },
      panelInsertTime,
    );
    const itemsStart = panelInsertTime + panelDuration * 0.15;
    if (labels.length) {
      tl.to(labels, { yPercent: 0, rotate: 0, duration: 1, ease: 'power4.out', stagger: { each: 0.1, from: 'start' } }, itemsStart);
    }
    if (numbered.length) {
      tl.to(numbered, { duration: 0.6, ease: 'power2.out', '--zh-mm-num-opacity': 1, stagger: { each: 0.08, from: 'start' } }, itemsStart + 0.1);
    }
    const socialsStart = panelInsertTime + panelDuration * 0.4;
    if (socialTitle) {
      tl.to(socialTitle, { opacity: 1, duration: 0.5, ease: 'power2.out' }, socialsStart);
    }
    if (socialLinks.length) {
      tl.to(socialLinks, { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out', stagger: { each: 0.08, from: 'start' } }, socialsStart + 0.04);
    }
    openTlRef.current = tl;
  }, [resetHiddenStates]);

  const playClose = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const layers = prelayersRef.current ? Array.from(prelayersRef.current.children) : [];

    openTlRef.current?.kill();
    openTlRef.current = null;
    closeTweenRef.current?.kill();

    if (prefersReduced()) {
      gsap.set([...layers, panel], { xPercent: 100 });
      resetHiddenStates();
      return;
    }

    closeTweenRef.current = gsap.to([...layers, panel], {
      xPercent: 100,
      duration: 0.32,
      ease: 'power3.in',
      overwrite: 'auto',
      onComplete: resetHiddenStates,
    });
  }, [resetHiddenStates]);

  // open prop drives the timelines. Skip the very first run so a
  // closed-on-mount menu doesn't play its close sweep.
  useEffect(() => {
    if (firstRunRef.current) {
      firstRunRef.current = false;
      if (!open) return;
    }
    if (open) playOpen();
    else playClose();
  }, [open, playOpen, playClose]);

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
    if (open) rootRef.current?.focus();
  }, [open]);

  const validSocials = socials.filter((s) => s.platform in SOCIAL_LABELS);

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="منو"
      aria-hidden={!open}
      data-open={open || undefined}
      className="zh-mm focus:outline-none"
    >
      <div ref={prelayersRef} className="zh-mm__prelayers" aria-hidden>
        <div className="zh-mm__prelayer zh-mm__prelayer--1" />
        <div className="zh-mm__prelayer zh-mm__prelayer--2" />
      </div>

      <div ref={panelRef} className="zh-mm__panel">
        <button type="button" aria-label="بستن" onClick={onClose} className="zh-mm__close">
          <svg viewBox="0 0 14 14" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M1 1L13 13M13 1L1 13" strokeLinecap="round" />
          </svg>
        </button>

        <div className="zh-mm__brand">
          <img src="/zhic-logo.svg" alt="ژیک" />
        </div>

        <ul aria-label="پیمایش اصلی" className="zh-mm__list" data-numbering>
          {ITEMS.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <li key={item.href} className="zh-mm__itemWrap">
                <Link
                  href={item.href}
                  onClick={onClose}
                  aria-current={active ? 'page' : undefined}
                  className={`zh-mm__link${active ? ' is-active' : ''}`}
                >
                  <span className="zh-mm__label">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {validSocials.length > 0 && (
          <div className="zh-mm__socials" aria-label="شبکه‌های اجتماعی">
            <h3 className="zh-mm__socials-title">شبکه‌های اجتماعی</h3>
            <ul className="zh-mm__socials-list">
              {validSocials.map((s, i) => (
                <li key={s.platform + i}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="zh-mm__social-link">
                    {SOCIAL_LABELS[s.platform]}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run the Task 2 tests**

Run: `cd /home/ahmad/Zhic/apps/web && npx vitest run src/components/layout/__tests__/MobileMenu.test.tsx 2>&1 | tail -8`
Expected: PASS — 7/7.

- [ ] **Step 3: Typecheck**

Run: `cd /home/ahmad/Zhic/apps/web && npx tsc --noEmit 2>&1 | grep -i mobilemenu`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
cd /home/ahmad/Zhic && git add apps/web/src/components/layout/MobileMenu.tsx && git commit -m "feat: staggered mobile menu (React Bits port, Zhic skin)"
```

---

### Task 5: Socials plumbing (layout → SiteHeader → MobileMenu)

**Files:**
- Modify: `apps/web/src/components/layout/SiteHeader.tsx:11-15,159`
- Modify: `apps/web/src/app/(site)/layout.tsx:11`

- [ ] **Step 1: SiteHeader accepts and forwards socials**

In `SiteHeader.tsx` — extend the import, props, and the `<MobileMenu>` render:

```tsx
import type { NavMeta, PayloadSiteConfig } from '@/lib/payload';

export type SiteHeaderProps = {
  navMeta: NavMeta;
  socials?: PayloadSiteConfig['socials'];
};

export function SiteHeader({ navMeta, socials }: SiteHeaderProps) {
```

and at the bottom (MobileMenu filters invalid platforms itself):

```tsx
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} pathname={pathname} socials={socials ?? undefined} />
```

Note: `PayloadSiteConfig['socials']` is `Array<{platform, url}> | null | undefined`; `MobileMenu.socials` expects `SocialLink[] | undefined` — the platform unions are identical, so pass `socials ?? undefined`.

- [ ] **Step 2: layout passes siteConfig socials**

In `app/(site)/layout.tsx` change the header line:

```tsx
      <SiteHeader navMeta={navMeta} socials={siteConfig?.socials ?? undefined} />
```

- [ ] **Step 3: Typecheck**

Run: `cd /home/ahmad/Zhic/apps/web && npx tsc --noEmit 2>&1 | grep -iE "siteheader|layout|mobilemenu"`
Expected: no output. If the union mismatch errors, coerce in SiteHeader: `socials={(socials ?? []) as SocialLink[]}` with `import type { SocialLink } from './FooterContactStrip'`.

- [ ] **Step 4: Commit**

```bash
cd /home/ahmad/Zhic && git add apps/web/src/components/layout/SiteHeader.tsx "apps/web/src/app/(site)/layout.tsx" && git commit -m "feat: pass site-config socials into mobile menu"
```

---

### Task 6: Build, deploy to pm2, verify live

**Files:** none (verification)

- [ ] **Step 1: Full test sweep**

Run: `cd /home/ahmad/Zhic/apps/web && npx vitest run 2>&1 | tail -5`
Expected: all test files pass (no regressions).

- [ ] **Step 2: Build + restart**

Run: `cd /home/ahmad/Zhic && pnpm turbo build --filter=@zhic/web 2>&1 | tail -3 && pm2 restart zhic-web`
Expected: `Tasks: 1 successful`, pm2 ✓.

- [ ] **Step 3: Headless verification at 390px**

Use the box's headless Chromium recipe (see `reference_zhic_headless_browser` memory; libs in `/tmp/xlibs`, shell at `~/.cache/ms-playwright/chromium_headless_shell-1223/...`). Script outline — navigate to `http://127.0.0.1:3000/` at 390×844, then:
1. `page.click('button[aria-label="منو"]')` → wait 1.5s → screenshot; assert `[role="dialog"]` has `data-open` and `.zh-mm__panel` transform is `xPercent: 0` (matrix e ≈ 0), 6 `.zh-mm__link` visible.
2. Assert no horizontal overflow: `document.documentElement.scrollWidth === 390`.
3. Press Escape → wait 0.6s → assert `aria-hidden="true"` and panel translated offscreen (matrix e ≥ 390).
4. Re-open, click first link → assert navigation to `/bedroom-set` started and menu closed.
Expected: all assertions hold; screenshot shows ivory panel, staggered items with caramel Persian numerals, socials block (if site-config has socials).

- [ ] **Step 4: Commit any verification fixes, report**

If fixes were needed, re-run Steps 1–3, then commit with a message describing the fix.

---

## Self-review notes

- Spec coverage: animation (Task 4), markup/style (Tasks 3–4), socials plumbing (Task 5), a11y/scroll-lock/Esc/focus kept (Task 4 code), reduced-motion (Task 4 `prefersReduced` branches), verification (Task 6). Numerals leading-zero handled via hardcoded «۰» prefix (6 items, spec's ۰۱…۰۶).
- The React Bits `busyRef` is intentionally dropped: open/close is prop-driven and each play kills the opposing tween, which covers re-entrancy.
- Types: `SocialLink` union and `PayloadSiteConfig['socials']` element type are structurally identical (checked both files).
