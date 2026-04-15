# Session 2.2 — Navigation, Footer, Layout Shell

## Goal

Ship the second shelf of `@zhic/ui`: the **organisms** that dress every
storefront page — `SiteHeader` (transparent → solid on scroll, mobile
hamburger → full-bleed overlay), `SiteFooter` (four-column Persian nav
with a phone-first newsletter island), `Breadcrumbs`, and the
`Modal` / `Drawer` pair that mobile nav and future cart / auth flows
depend on. Along the way, land the two layout primitives the organisms
need (`Container`, `Section`), an `a11y`-first `SkipLink`, and an
`apps/web/src/app/(site)/` route group that actually uses them. At
the end of this session the home page renders in Persian with the new
chrome; the English mockup Header / Footer are gone.

Authority: `docs/sessions.md` §2.2, `docs/spec/design-system.md` §7
(Layout primitives), §8 (Organisms: Header, Footer), §9 (A11y), §10
(RTL checklist), `docs/spec/sitemap.md` §5 (Primary nav), §6 (Footer),
§4 (IA rules).

## Entry state

- `@zhic/ui` ships nine atoms + `cn()` from 2.1 (Button, Input, Textarea,
  Select, Checkbox, Radio + RadioGroup, FormField, Badge, Tag). No
  organisms yet.
- `apps/web/src/app/layout.tsx` sets `<html lang="fa" dir="rtl">`,
  loads Ayandeh via `next/font/local`, wraps children in
  `SmoothScrollProvider`. Good enough.
- `apps/web/src/app/page.tsx` imports the **English mockup**
  `Header` / `Footer` from `@/components/layout/*` and renders the
  mockup sections (Hero / Video / Products / About / Contact).
- Mockup `components/layout/Header.tsx` uses physical-direction
  utilities (`left-0 right-0`) and `font-serif` (deprecated). Must go.
- Mockup `components/layout/Footer.tsx` has English copy, hardcoded
  opacity values, no Persian IA.
- Mockup `components/ui/Button.tsx` is still imported by
  `sections/HeroSection.tsx` and `sections/ContactSection.tsx`.
  **Out of scope to migrate those** — Session 3.1 rebuilds the home.
- `apps/web/src/lib/constants.ts` `NAV_LINKS` are English (`Collection`,
  `About`, `Contact`). Need Persianizing.
- `apps/web/src/app/lab/layout.tsx` has its own chrome; it lives
  **outside** the storefront route group and must keep working untouched.
- No route groups exist yet. `app/page.tsx` is the sole public page.
- React 19 + Next 16. `'use client'` only where needed.

## Key decisions

| Decision | Choice |
|---|---|
| Where `SiteHeader` / `SiteFooter` live | **`@zhic/ui`**, per spec §8 (Organisms). They take `navItems` / `socials` / `newsletter` as props so the brand-specific data stays in `apps/web`. This keeps operator-app storefronts (none yet, but some in Package 3) from re-implementing the same chrome. |
| Layout primitives in this session | Ship **`Container`** and **`Section`** only. `Stack`, `Grid`, `Split`, `Bleed`, `Aspect` wait until Session 3.1 needs them — YAGNI. `Container` keyed to the `--container-storefront` (1440) token; `--container-operator` (1600) behind a `size` prop. |
| Route groups | Introduce **`apps/web/src/app/(site)/`**. Move `app/page.tsx` → `app/(site)/page.tsx`. `(site)/layout.tsx` owns `SkipLink` + `SiteHeader` + `<main id="main">` + `SiteFooter` + `SmoothScrollProvider`. `/lab/*` stays outside the group — no chrome, no Lenis. |
| Smooth scroll scope | `SmoothScrollProvider` moves from **root** `app/layout.tsx` to **`(site)/layout.tsx`**. Storefront gets Lenis choreography; lab + future operator routes do not. Root layout stays minimal (html + font + body). |
| Mobile nav pattern | Hamburger icon at the inline-end → full-bleed `Drawer` (`side="full"`) containing the nav links in large Persian type. Matches spec §6.1 "Slowness reads as luxury." Opens with `--dur-base`; reveal choreography (staggered link entry) is 6.2's problem — a follow-up, not now. |
| Modal / Drawer primitive | Native HTML **`<dialog>` + `showModal()`**. The browser gives us focus-trap, backdrop, and Escape-to-close for free. React portal via `createPortal` to `document.body` to escape any sticky-positioned ancestor. Shared internal `useDialogEffect(openRef, open)` hook handles the imperative `showModal()`/`close()` bridge + body-scroll lock + focus restoration to the opener. `Drawer` = `Modal` with edge-anchored panel (`side: 'start' \| 'end' \| 'top' \| 'bottom' \| 'full'`). `'use client'`. |
| Breadcrumbs | Render a provided `items: { label, href? }[]` as an ordered list with an RTL-aware chevron (`rtl:-scale-x-100` mirror trick from the 2.1 lab). Last item has no link and gets `aria-current="page"`. Wrapping `<nav aria-label="مسیر">`. Server-compatible. BreadcrumbList JSON-LD is Session 6.1's problem. |
| Header scroll state | `'use client'`. Passive `scroll` listener flips `scrolled` at `window.scrollY > 60`. Transparent `bg-transparent` → solid `bg-ivory/85 backdrop-blur` with a hairline. `z-[200]` to match `--z-header`. |
| Logo lockup | `OD-logo-lockup` is still open → use a Persian wordmark **"ژیک"** (Ayandeh Black) as placeholder. No SVG logo yet. Flagged in the commit body. Replace once brand sign-off lands. |
| Nav copy | Top-level only in this session: `خانه /`, `محصولات /products`, `ژورنال /journal`, `درباره‌ی ما /about`, `تماس /contact`. Mega-menus on `محصولات` and `درباره‌ی ما` (spec §5) deferred — they need real category / showroom data which lands in Session 3.2 / 3.3. |
| Icons | Still no icon system (FU-2.1-b open). Hamburger, close X, instagram, telegram, mail — inline SVGs, co-located. Directional arrows flip via `rtl:-scale-x-100`. |
| Newsletter submit | UI-only stub — `onSubmit={(e) => e.preventDefault()}` logs to console. Real SMS dispatch is Session 5.1 via `packages/sms`. The footer newsletter block is a `'use client'` island inside an otherwise server-rendered `SiteFooter`. |
| Cart / Search / Account icons | All deferred — they belong to Package 2. Header exposes a right-side `actions` slot (`ReactNode`) so those can drop in later without an API break. For 2.2 the slot renders nothing on desktop, only the hamburger on mobile. |
| A11y contract | `SkipLink` first in tab order → `#main`. `<nav aria-label="ناوبری اصلی">` on header, `<nav aria-label="ناوبری پاورقی">` on footer. Hamburger: `aria-expanded` + `aria-controls`. Close buttons: `aria-label="بستن"`. Native `<dialog>` handles focus trap + Escape. On route change, mobile drawer auto-closes (subscribe to `usePathname()` in a client effect). |
| Focus ring | Same 2.1 token: `focus-visible:ring-2 ring-charcoal ring-offset-2 ring-offset-ivory`. Works on both ivory and dark footer via `ring-offset-<surface>` overrides inside `SiteFooter`. |
| Verification surface | `/` renders the real chrome (integration). `/lab/ui` gets four new sections (Breadcrumbs, Modal, Drawer, SkipLink) for isolated variant × state coverage. No new `/lab/chrome` route. |
| Deletion | `apps/web/src/components/layout/{Header,Footer}.tsx` — **delete** after the swap (dead code, English, physical-direction). Mockup `ui/Button.tsx` + `sections/*` stay — they're owned by Session 3.1. |
| Testing | Visual on `/` + `/lab/ui`. Storybook and RTL unit tests remain a Package-1 closeout task (FU-2.1-a). |

## Deliverables

### `packages/ui/`

```
src/
├── SkipLink.tsx       # a11y-first jump link; visible on focus only
├── Container.tsx      # max-w-[1440|1600] + px gutters; size prop
├── Section.tsx        # vertical-rhythm wrapper; bg + padY tokens
├── Breadcrumbs.tsx    # ordered list + RTL-aware chevron; aria-current on last
├── Modal.tsx          # <dialog>-based; header + body + footer slots; ESC + backdrop
├── Drawer.tsx         # Modal variant; side: start|end|top|bottom|full
├── SiteHeader.tsx     # 'use client' wordmark + nav + mobile hamburger + actions slot
├── SiteFooter.tsx     # four-column Persian IA + newsletter island + socials + copyright
├── useDialogEffect.ts # internal — showModal/close bridge + body-scroll lock + focus restore
└── index.ts           # barrel — add new exports
```

No new runtime deps. All styling through `@zhic/design-system` tokens
and logical Tailwind utilities.

### Component contract notes

- **SkipLink** — `href` + `children`. Absolute-positioned off-screen
  (`-translate-y-full` at the top), slides in on `:focus-visible`.
  Renders as `<a>` so keyboard users can hit Enter to jump.

- **Container** — `size?: 'storefront' | 'operator'` (default
  `storefront` → 1440; `operator` → 1600). `as?: ElementType`
  (default `div`). Inline padding comes from `px-5 lg:px-7` → maps
  to tokenized spacing-5/7.

- **Section** — `bg?: 'ivory' | 'cream' | 'sand' | 'charcoal' | 'ink' | 'transparent'`
  (default transparent), `padY?: 'sm' | 'md' | 'lg' | 'xl'`
  (40 / 64 / 96 / 128 via spacing scale). `as?: ElementType`
  (default `section`). Children rendered inside a `Container` unless
  `fullBleed` is set.

- **Breadcrumbs** — `items: { label: ReactNode; href?: string }[]`.
  Last item is rendered as `<span aria-current="page">` even if it has
  an href (canonical behavior for the current page crumb). Separator
  is an inline-SVG chevron with `rtl:-scale-x-100` so it points
  "backwards" under RTL — matching §10 checklist item "directional
  icons flip under RTL." Wrapping element is
  `<nav aria-label="مسیر">`.

- **Modal** — `open: boolean`, `onClose: () => void`,
  `title?: ReactNode` (renders as `<h2>` with an `aria-labelledby`
  wiring), `description?: ReactNode` (for `aria-describedby`),
  `size?: 'sm' | 'md' | 'lg'` (panel max-widths), `children` is the
  body. Close `<button>` in the header corner with
  `aria-label="بستن"`. `onClose` fires on backdrop click, Escape key,
  and the close button. Portaled into `document.body`.
  `useDialogEffect` + `useRef<HTMLDialogElement>` handle the native
  bridge: when `open` flips to true, `showModal()`; to false, `close()`.
  Body-scroll lock via a single `document.body.style.overflow = 'hidden'`
  that refcounts across simultaneous modals. Focus restores to the
  previously-focused element on close.

- **Drawer** — same API as Modal plus `side: 'start' | 'end' | 'top' | 'bottom' | 'full'`.
  `start`/`end` are **logical** — under RTL, `start` slides from the
  right edge, `end` from the left. Panel width is size-dependent
  (`sm` 320 / `md` 420 / `lg` 560) for horizontal sides; height
  40/60/80% for vertical. `full` is 100vw × 100vh with a centered
  column. Motion: transform translate + opacity, `--dur-base`,
  `--ease-out-soft`; under `prefers-reduced-motion` collapses to
  opacity only.

- **SiteHeader** — props:
  ```ts
  type SiteHeaderProps = {
    navItems: { label: string; href: string }[];
    brand?: { label?: ReactNode; href?: string }; // default "ژیک" → "/"
    actions?: ReactNode; // right-side icons (Package 2+)
  };
  ```
  Behavior: sticky top, z-[200]. Scroll threshold 60px flips the
  backdrop. At `md+` renders nav inline; below `md` collapses to a
  hamburger that opens `<Drawer side="full">`. Route change closes
  the drawer (via `usePathname` effect). `'use client'`.

- **SiteFooter** — props:
  ```ts
  type SiteFooterProps = {
    columns: {
      title: string;
      links: { label: string; href: string }[];
    }[];                   // storefront passes the four-column IA
    newsletter?: { placeholder?: string; submitLabel?: string };
    socials?: { label: string; href: string; icon: ReactNode }[];
    copyright: ReactNode;   // consumer owns the Persian copy
  };
  ```
  Server component shell. Newsletter block is a separate
  `'use client'` island (`FooterNewsletter`) so the static footer can
  stream and only the form hydrates. Submit is the UI-only stub — a
  `console.info` + `"دریافت شد"` toast placeholder (plain div, not a
  real toast; toasts ship in Package 2).

### `apps/web/src/app/`

```
(site)/
├── layout.tsx          # new — SkipLink + SiteHeader + main#main + SiteFooter + SmoothScrollProvider
└── page.tsx            # moved from app/page.tsx

layout.tsx              # root — slimmed: html/body/font only
```

- `(site)/layout.tsx` imports the storefront-specific nav data
  (`NAV_LINKS` from `@/lib/constants`) and passes to `SiteHeader`.
  Footer columns + copyright Persian copy defined in the same file
  (too small to warrant a new module; promote later if it grows).
- `(site)/page.tsx` is the existing home content (the five mockup
  sections), but `import Header` / `import Footer` are removed —
  `(site)/layout.tsx` now owns them.
- Root `app/layout.tsx` keeps: `<html lang="fa" dir="rtl">`, font
  loader, metadata, `<body className="bg-ivory text-charcoal font-sans">`.
  `SmoothScrollProvider` is **removed** from here.

### `apps/web/src/lib/constants.ts`

```ts
export const NAV_LINKS = [
  { label: 'خانه',        href: '/' },
  { label: 'محصولات',     href: '/products' },
  { label: 'ژورنال',      href: '/journal' },
  { label: 'درباره‌ی ما', href: '/about' },
  { label: 'تماس',        href: '/contact' },
] as const;
```

(`SCROLL_CONFIG`, `BREAKPOINTS`, `COLORS` untouched — they're still
consumed by `SmoothScrollProvider` and the mockup sections.)

### Deletions

- `apps/web/src/components/layout/Header.tsx` — superseded.
- `apps/web/src/components/layout/Footer.tsx` — superseded.

(The `components/layout/` directory can be removed if empty after
the deletions.)

### `apps/web/src/app/lab/ui/page.tsx` — extended

Add four new sections to the existing verification page:

- **SkipLink** — tab into the page, first focus lands on the skip link.
- **Breadcrumbs** — a sample Persian crumb trail
  (`خانه / محصولات / تخت‌خواب / آرام`), showing the chevron flip.
- **Modal** — three size presets, each behind a `Button` trigger.
  Demonstrates backdrop click, Escape, close button, focus restore.
- **Drawer** — five side presets (start, end, top, bottom, full),
  each behind a button. Full preset hosts a mock mobile nav.

No other lab changes. `/lab/ui` remains the single verification surface
for `@zhic/ui`.

## Exit check

- [ ] `pnpm install` clean (no new deps — no-op expected).
- [ ] `pnpm --filter @zhic/ui typecheck` passes.
- [ ] `pnpm --filter @zhic/ui lint` passes.
- [ ] `pnpm --filter @zhic/web typecheck` passes.
- [ ] `pnpm --filter @zhic/web build` passes; route map shows
      `/` (still present via route group) and `/lab/*` routes.
- [ ] `/` renders the new `SiteHeader` + `SiteFooter` with Persian
      nav and four-column Persian footer IA. No English copy in the
      chrome.
- [ ] `/lab/ui` renders the four new sections; Modal + Drawer
      open / close via button, backdrop, Escape; focus restores to
      the opener.
- [ ] Keyboard: `Tab` from a cold page lands on `SkipLink` first.
      `Enter` on `SkipLink` jumps to `#main`. Nav order on the header
      flows right → left (Persian reading direction) under `dir="rtl"`.
- [ ] Mobile (narrow viewport ≤ md): hamburger toggles the full-bleed
      drawer; drawer closes on route change and on Escape.
- [ ] No physical-direction Tailwind utilities in `packages/ui/src/**`
      (`grep -RE '\b(m\|p\|text\|border)-(l\|r)-' packages/ui/src` → empty).
- [ ] No raw hex / rgb in `packages/ui/src/**`
      (`grep -RE '#[0-9a-fA-F]{3,8}\|rgb\(' packages/ui/src` → empty).
- [ ] `apps/web/src/components/layout/` is gone (or empty directory
      removed).
- [ ] `apps/web/src/lib/constants.ts` `NAV_LINKS` are in Persian.
- [ ] `docs/state.md` updated: 2.2 ✅ with commit hash; 2.3 and 3.x
      blocker notes updated; open decision `OD-logo-lockup` still
      flagged as carrying a placeholder wordmark.

## Follow-ups to log

- **FU-2.2-a** Mega-menu on `محصولات` and `درباره‌ی ما` — needs
  categories data (Session 3.2) and showroom list (Session 3.3).
- **FU-2.2-b** Search icon + search widget — Package 2+
  (`/search` is explicitly post-Package-2 per sitemap §2).
- **FU-2.2-c** Account icon + dropdown → `/account` — Package 2.
- **FU-2.2-d** Cart icon with item-count badge + cart drawer — Package 2.
- **FU-2.2-e** Real logo lockup once `OD-logo-lockup` is closed.
  `SiteHeader.brand` accepts `ReactNode`, so the swap is an
  `apps/web` change only.
- **FU-2.2-f** Newsletter submit wired to `packages/sms` — Session 5.1.
- **FU-2.2-g** Scroll progress bar, back-to-top, sticky-header
  shadow refinements — Session 6.2.
- **FU-2.2-h** Mobile full-bleed overlay choreography (stagger, mask
  reveal, inline-start slide) — Session 6.2.
- **FU-2.2-i** Remaining layout primitives `<Stack>` / `<Grid>` /
  `<Split>` / `<Bleed>` / `<Aspect>` — add when Session 3.1 needs them.
- **FU-2.2-j** Promote `NavLink` to `@zhic/ui` once active-state
  styling is needed in more than one place (header + mobile drawer
  today both want it, but duplicated inline is fine for now).
- **FU-2.2-k** Toast primitive for the newsletter "دریافت شد"
  acknowledgement — Package 2 (toasts land with cart state).
- **FU-2.2-l** Migrate `sections/HeroSection.tsx` + `ContactSection.tsx`
  to import `Button` from `@zhic/ui` (carries forward from 2.1) —
  naturally lands with Session 3.1 when the home page is rebuilt.

## Deferred

- Mega-menus (محصولات + درباره‌ی ما), search widget, account
  dropdown, cart drawer.
- Back-to-top button, scroll progress indicator.
- Real newsletter submission (UI-only stub this session).
- Full-bleed overlay typography animation (mask reveals, staggered
  entry).
- Storybook + component unit tests (FU-2.1-a).
- `<Tooltip>`, `<Toggle>`, `<Link>` atoms (FU-2.1-b still open).
- Additional layout primitives `<Stack>` / `<Grid>` / `<Split>` /
  `<Bleed>` / `<Aspect>` — added when a page needs them.
- Locale toggle — there is no second locale in v1 (sitemap §1).
- Dark mode — explicitly deferred per spec §2.1.
