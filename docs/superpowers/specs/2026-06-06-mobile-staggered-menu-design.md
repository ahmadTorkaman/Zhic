# Mobile Staggered Menu — Design

**Date:** 2026-06-06
**Status:** Approved (Approach A)
**Scope:** Rewrite `apps/web/src/components/layout/MobileMenu.tsx` in place, porting the
animation mechanics of React Bits' `StaggeredMenu` (GSAP) while keeping Zhic's header,
trigger, API, and design tokens. Mobile only — desktop nav and mega menus untouched.

## Decisions (from brainstorm)

1. **Trigger:** the existing `SiteHeader` hamburger stays; the React Bits header/toggle
   ("Menu/Close" morph button, logo) is NOT ported. Close = X button inside the panel,
   Esc, and link click — same as today.
2. **Scope:** mobile only (`md:hidden` hamburger). 1:1 replacement of `MobileMenu`,
   same props API: `{ open, onClose, pathname }` plus a new optional `socials` prop.
3. **Look:** "Zhic quiet luxury" — ivory panel, forest/forest-dark prelayers, Ayandeh
   black-weight charcoal items with forest hover/active, caramel Persian numerals,
   socials block from site config. Tokens only, no raw hex.

## Animation (ported from React Bits, RTL-adapted)

- **Open:** two full-screen prelayers — `--color-forest`, then a darker forest
  (`bg-forest-dark` token) — sweep from the RIGHT (`xPercent: 100 → 0`,
  `power4.out`, 0.5s, staggered `i * 0.07s`), then the ivory panel
  (0.65s, inserted at `lastLayerTime + 0.08`).
- **Items:** start `yPercent: 140, rotate: 10` inside `overflow: hidden` wrappers;
  animate to 0 with `power4.out`, 1s, `stagger 0.1`, starting at
  `panelStart + 0.65 * 0.15`.
- **Numerals:** CSS counter rendered via `::after`, opacity driven by GSAP CSS var
  `--sm-num-opacity` 0 → 1 (0.6s, stagger 0.08, starts items+0.1).
- **Socials:** title fades in; links rise `y: 25, opacity: 0 → 0,1` (0.55s,
  stagger 0.08) at `panelStart + 0.65 * 0.4`.
- **Close:** everything sweeps out `xPercent: 100` in 0.32s `power3.in`; on complete,
  item/numeral/social states reset for the next open.
- **Re-entrancy:** opening kills any close tween and vice versa (refs to live
  timelines, as in the source). A `busy` ref prevents double-open.
- **Reduced motion:** if `prefers-reduced-motion: reduce`, skip GSAP entirely —
  instant show/hide (CSS `[data-open]` fallback), no transforms.

## Markup & style

- Wrapper: full-screen fixed overlay at `z-[var(--z-overlay)]`, `pointer-events`
  gated on `open` (as today). `role="dialog"`, `aria-modal`, focus moved into the
  panel on open, body scroll-lock, Esc closes. All kept from the current component.
- Panel: full-width ivory (`bg-ivory`), padding top clears the header zone; X close
  button at the start edge like today.
- Items: the existing `ITEMS` array (سرویس خواب، مبلمان اتاق خواب + `NAV_LINKS`).
  Type: `font-black`, `var(--text-h3)` (clamp 1.5–2rem), `text-charcoal`,
  hover/active `text-forest`, NO uppercase/letter-spacing (meaningless in Persian).
  Active link detection via `isNavActive` as today.
- Numerals: `counter(smItem, persian)` (native CSS Persian counter style) in
  `::after`, positioned inline-end, `--color-caramel`, small (18px), opacity via
  `--sm-num-opacity`.
- Socials: optional `socials?: SocialLink[]` prop (same type as
  `FooterContactStrip`); rendered as a bottom block — small caramel title
  («شبکه‌های اجتماعی»), row of text links in stone → forest hover. Hidden when
  empty. Data flows `layout.tsx` (`fetchSiteConfig`, already fetched) →
  `SiteHeader` (new optional prop) → `MobileMenu`.
- New CSS file `mobile-menu.css` colocated like the other layout CSS files
  (footer-contact-strip.css pattern), classes prefixed `zh-mm__`.

## Files touched

| File | Change |
| --- | --- |
| `components/layout/MobileMenu.tsx` | rewrite internals; API + a11y behavior kept; add `socials` prop |
| `components/layout/mobile-menu.css` | new — panel/prelayer/item/numeral/social styles |
| `components/layout/SiteHeader.tsx` | accept + pass through optional `socials` prop |
| `app/(site)/layout.tsx` | pass `siteConfig.socials` to `SiteHeader` |

`gsap` is already a dependency; no installs.

## Out of scope

- Desktop nav, mega menus, the React Bits toggle/header/logo, `position="left"`
  variant, `closeOnClickAway` document listener (overlay covers the screen;
  X/Esc/link-click close it, as today).

## Verification

- Unit: existing MobileMenu behavior (if tested) still passes; render test for
  numerals/socials presence.
- Live (headless Chromium @390px on the box): open → prelayers sweep, items
  stagger in; Esc closes; link click navigates + closes; reduced-motion shows
  instantly; no horizontal overflow.
