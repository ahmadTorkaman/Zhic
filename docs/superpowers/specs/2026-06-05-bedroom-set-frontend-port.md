# Bedroom-Set landing — frontend port (SP2)

**Date:** 2026-06-05
**Status:** Spec — awaiting review
**Sub-project:** SP2 of 2 (SP1 = Payload data & content wiring, follows after)
**Source of truth:** `apps/web/public/mockups/bedroom-set-v2/index.html` (the finished mockup)

---

## 1. Goal

Port the finished `/bedroom-set` mockup into the real Next.js storefront route **with 1:1 fidelity** — every component, every functionality, every design decision identical to the mockup — using the mockup's own assets as **placeholder data**. Wiring to Payload (real designs, logos, banners, copy, best-sellers) is **SP1, a separate follow-up**.

## 2. Non-negotiable constraint: 1:1 parity

The rendered result — every pixel, geometry value, color, easing curve, duration, and interaction — **must match the mockup exactly**. The mockup file is the authoritative reference; when this spec and the mockup disagree, the mockup wins, and this spec is corrected.

The **only** permitted differences are invisible plumbing that produces identical output:

| Mockup (static) | Real app (this port) | Why it's still identical |
| --- | --- | --- |
| One `index.html`, vanilla JS, global functions | React: one RSC page + `'use client'` islands | Same DOM, same handlers |
| `:root{--ivory…}` hardcoded hexes | design-system tokens (`var(--color-ivory)` …) | Tokens hold the **exact same values** |
| `@font-face` for Ayandeh in the file | Global Ayandeh via `next/font/local` (already loaded) | Same font, same weights (400/700/900) |
| base64 data-URI images | Real Next image assets | Same images (base64 was only to dodge the static-server quirk) |
| Standalone full-screen page, no site chrome | Nested in `(site)` layout (SiteHeader/Footer) | See §6 — the **one** reconciliation point |
| `<meta robots=noindex>`, dev `badge` | Indexed page, no badge | Dev-only markers, correctly dropped |

Parity is **verified**, not assumed — see §11.

## 3. Where it lives

- Route: **`apps/web/src/app/(site)/bedroom-set/page.tsx`** — already exists, currently renders `<DesignsSlider>`. Its body is **replaced** by the ported experience. The `[slug]` detail/occupancy routes are **untouched**.
- The page stays a **React Server Component**: it imports the placeholder data module and renders the client tree, so all content (design names, writing copy, featured product alts, image URLs) is **server-rendered into the initial HTML** (SEO — §7).
- Today's `DesignsSlider` is no longer used by this route. (Leave the component file in place; removing/garbage-collecting it is out of scope.)

## 4. Architecture & component tree

```
bedroom-set/page.tsx                 (RSC) — imports placeholder data, renders the tree (SSR'd content)
└─ <BedroomSetLanding data>          (client) — owns view state ('designs' | 'featured'), the page-level
   │                                   swipe-up-at-bottom → openFeatured handoff, and global keydown
   ├─ <DesignStage designs>          (client) — the 100svh-below-header carousel "first screen"
   │   ├─ <StageTopBar>              — .top: crumb «خانه / طرح‌ها» + the round .dots indicator
   │   ├─ <DesignCarousel designs>   — .strip/.track/.cards + .focus(.band glass + .flip 3D logo); RAF engine
   │   ├─ <StageCounter>             — .prompt: nudging chevron + «طرح ۱ از ۷»
   │   └─ <CategoryTabs>             — .cats: نوزاد/نوجوان/دونفره (active-pill stub)
   ├─ <WritingSection content>       — .writing: .wpanel (heading + body + fading green border) + .upcue
   └─ <FeaturedOverlay pages>        (client) — .featured fixed overlay: fback, rotating headline, grid, fdots
   + <Toast> (shared imperative-ish feedback element)
```

Each island owns its own gestures (carousel pointer/wheel/keys; featured touch/wheel/keys). `BedroomSetLanding` owns only the cross-cutting bits: the `view` state, the window-level swipe-up-at-bottom trigger, and the global keydown router (which delegates to carousel vs featured based on `view`). State that the mockup keeps in module globals (`progress`, `view`, `page`, `curLogo`) becomes refs/state inside the relevant island — **not** React re-render per frame; the RAF loop writes to the DOM via refs exactly like the mockup (and like the existing `DesignsSlider` already does).

## 5. Component inventory — exact behavior to reproduce

Each item below must match the mockup's logic and constants verbatim.

### 5.1 Design carousel (`DesignCarousel`)
- **Cards:** one `.card` per design, `<img src=card>` `object-fit:contain` + `drop-shadow(0 26px 46px rgba(20,17,15,.20))`. `--card-h:68vh` (58vh ≤768px), `--card-w:calc(card-h*0.703)`.
- **RAF render loop** (`render()`): for each card, `translateX(-d*slot)` + `scale(max(.5, 1-ad*.26))`, `opacity max(.14, 1-ad*.4)`, `blur(min(16, ad*7))` **only re-rasterized when the px value changes** (dirty-check `c._bl`), `zIndex 100-ad*10`. Cards with `ad>2.2` are pulled out of paint (`visibility:hidden; opacity:0; filter:none`) and restored on return — the perf cull. Reproduce exactly.
- **`slot()`** spacing: `innerHeight*(mob?.58:.68)*.703 + innerWidth*(mob?.10:.07)`.
- **Glass band + 3D flip logo** (`updateGlass()`): the centerpiece.
  - `.focus` (perspective:1400px) holds `.band` (the glass) and `.flip` (the logo) as **siblings** so the band's blur never flattens the logo's 3D.
  - **HALF-FLIP:** `angle = frac<.5 ? frac*180 : frac*180-180` → 0→90° (tilt out), −90→0 (tilt in). Never exceeds ±90°, so a logo is **never** seen upside-down.
  - **7 permanent pre-decoded `<img class="lg">` logo layers**; only `opacity` is toggled (`active = frac<.5 ? lo : hi`), **never** a `src` swap — this is what fixed the last-two-not-switching bug. `img.decode()` on create.
  - `mid = sin(frac*π)`: band `opacity = 1-mid*.82`, band `blur = round(mid*12)` (dirty-checked via `band._bl`), flip `opacity = 1-mid*.9`. Glass blurs+fades **out then back in** across the swipe.
  - Band geometry: `height:33.3%`, `radius:6px`, `backdrop-filter:blur(8px) saturate(1.08)`, `background:rgba(12,9,7,.32)`, the exact border/shadow from the mockup. Flip: `width:62% height:22%`.
- **`snapTo()`**: `dur = clamp(280, abs(dist)*440, 640)`, easing `e = 1-(1-t)^4`. `go(i)=snapTo(i)`.

### 5.2 Top bar (`StageTopBar`)
- Grid `1fr auto 1fr`. `.crumb` «خانه / طرح‌ها» (start), `.dots` (center). Round dots: `7×7`, `radius:999px`, `background:var(--sand)`; `.dot.on{background:var(--charcoal); width:20px}`; transitions `width .35s ease-q, background .24s ease`. On click → `go(i)`. Active dot tracks `near = round(progress)`.
- ≤768px: `.crumb{display:none}`, `.dots{grid-column:1/-1}` (centers them on phone — the verified fix).

### 5.3 Counter (`StageCounter`)
- `.prompt`: nudging chevron (`@keyframes nudge`, 1.7s) + `«طرح {faN+1} از {faN}»` in Persian digits, updated only when `near` changes.

### 5.4 Category tabs (`CategoryTabs`)
- Three `.cat` pills: `نـــــوزاد` / `نـــــوجوان` / `دونـــــفره` (kashida-stretched labels kept **verbatim**). Ivory `#F4F1ED`, `1.5px solid var(--caramel/gold)` border, `border-radius:0` except `.cat:first-child{border-top-right-radius:22px}` and `.cat:last-child{border-bottom-left-radius:22px}` (the asymmetric flourish). `.cat.on{background:#ECE5DA}` (subtle recess, no fill). Hover `#EFE9E1`.
- **Behavior = stub** (verbatim from mockup): clicking toggles the active pill only. Real occupancy filtering/linking is **SP1** (it needs the `occupancies` data). Do not invent behavior here.
- Position: absolute, centered, `bottom:clamp(84px,12vh,106px)`.

### 5.5 Writing section (`WritingSection`)
- `.writing` (max-width 680, centered, the exact clamp paddings). `.wpanel` `border-radius:0 18px 18px 0` (square left, round right).
- **Fading green border** (`.wpanel::before`): `padding:1.5px; background:linear-gradient(to bottom, var(--forest), var(--forest) 22%, transparent 92%)` with `mask … mask-composite:exclude`. Forest at top → transparent toward the bottom, square left corners. Reproduce exactly.
- `.weyebrow` (Ayandeh 900) «درباره‌ی این سرویس‌ها» + `.wbody` placeholder copy (the exact Persian paragraph from the mockup — placeholder until SP1).
- `.upcue` below: bobbing up-chevron (`@keyframes bob`) + «پرفروش‌ترین محصولات»; click → `openFeatured()`.

### 5.6 Featured overlay (`FeaturedOverlay`)
- `.featured` `position:fixed; inset:0; z-index:300; background:ivory; touch-action:none`; show/hide via `.show` with the exact opacity/transform/visibility transition (`.42s ease`).
- **Two pages** (`PAGES`, verbatim):
  1. `«پرفروش‌ترین محصولات»` — hero `lotusBanner`, row `[rect55, rect56]`
  2. `«جدیدترین محصولات»` — hero `lukaBanner`, row `[rect51, rect53]`
- **Grid:** `max-width:800px`, `--g:2px`, `--inset:clamp(18px,5.5vw,42px)`, `grid-template-columns:repeat(2,1fr)`. Hero tile `grid-column:1/-1` with `::before{padding-bottom:43.5%}` (the cross-browser 2.3:1 padding-ratio — **not** `aspect-ratio`; this fixed the Safari grid-stretch bug) and `img object-fit:cover`. Row tiles: raw borderless `<img height:auto>` (whole webp, no crop). All three share identical edges via the inset.
- **Rise-in stagger:** tiles start `translateY(44px); opacity:0`, add `.in` on a double-rAF, `transition-delay = idx*90ms`.
- **Rotating headline** (`buildHeadline`/`setHeadline`): word-by-word reveal, **whole word = one `.rt-el` unit** so Persian joins stay intact. Enter: `translateY(115%)→0`, `transition .6s var(--rt-spring)`, per-word delay `idx*70ms`, on double-rAF. Replace (`setHeadline`): existing words exit upward (`.out`, `translateY(-120%)`, delay `idx*55ms`), then after `430ms` build the next — the AnimatePresence-"wait" effect. `.rt-word` masks the slide with generous top padding so glyph tops/diacritics aren't clipped.
- **Paging:** `nextPage`/`prevPage`; `prevPage` on page 0 → `closeFeatured()`. `.fdots` page dots (same round-dot style as the carousel). `.fback` chevron → `prevPage`.
- Tile click → `openProduct()` (toast stub — real navigation is SP1).

### 5.7 Gestures (exact)
- **Carousel pointer** (on `.stage`): `pointerdown` arms drag, captures pointer **only for mouse** (`if pointerType==='mouse'`) so touch vertical-pan scrolls the page natively. `pointermove` axis-locks once travel >6px (`abs(dx)>abs(dy)?'h':'v'`); `'h'` drives `progress = sp + dx/slot()`; `'v'` is left to native scroll. `endDrag`: `'h'`→`snapTo(round)`; tap on the centered card→`openDesign`, tap on a side card→`snapTo(i)`.
- **Carousel wheel:** only when `abs(deltaX)>abs(deltaY)` (horizontal) → drives carousel + idle-snap after 130ms; vertical wheel scrolls the page.
- **Page swipe-up-at-bottom** (window `touchend`): when `view==='designs'`, `dy<-48` **and** scrolled to bottom (`ceil(scrollY+innerHeight) >= scrollHeight-4`) → `openFeatured()`.
- **Featured touch/wheel:** swipe `dy<-50`→next, `dy>50`→prev; wheel (debounced 480ms, threshold 12) next/prev.
- **Keyboard:** in `featured` — Esc→close, ArrowDown/PageDown/Space→next, ArrowUp/PageUp→prev. In `designs` — ArrowRight→next, ArrowLeft→prev, Enter→openDesign, Home/End→first/last.
- **Toast:** shared bottom pill, shows for 1300ms.

### 5.8 Grain overlay
- `.stage::after` fractal-noise SVG data-URI grain (`opacity:.06; mix-blend-mode:overlay`). Keep the inline SVG data-URI in the component CSS (it's a design decision, not a raster asset).

## 6. The one reconciliation point: the site shell

The mockup is a standalone full-viewport page; the real route renders **inside `(site)/layout.tsx`** (sticky `SiteHeader` + `SiteFooter`), which every page needs for nav, consistency, and SEO. Reconciliation (**confirmed 2026-06-05**):

- **Keep SiteHeader/SiteFooter.** The `.stage` "first screen" fills the viewport **below the sticky header** using the existing `--header-height` integration that `DesignsSlider` already uses (so `height: calc(100svh - var(--header-height))` rather than a literal `100svh`).
- **Keep the mockup's `.top` bar** (crumb + dots) as-is, directly under the SiteHeader. The «خانه / طرح‌ها» crumb is a breadcrumb (SEO-positive) and the dots are the carousel indicator — both are page content, both stay.
- **Featured overlay** stays `inset:0` full-viewport (covering the header too); ensure its `z-index:300` sits above `SiteHeader`'s stacking context, and that its own `.fback` is the documented way out. Confirm there's no header/​overlay z-index conflict.

This is the only place "exactly like the mockup" meets the site frame; everything inside the content area is literal 1:1.

## 7. SEO / SSR

- Page is an RSC; islands are `'use client'`, but **all content is passed as props from the server** and rendered in the initial HTML: design names, the writing heading + body, featured page titles, and every image `src`/`alt` — **including the featured overlay's tiles**, which sit in the DOM behind the swipe (visually hidden, but crawlable). This is exactly why "keep the swipe-up featured, but SSR its content" was chosen.
- The page is **indexed** (drop the mockup's `noindex`). Metadata via the route's `generateMetadata` following the existing `/bedroom-set` pattern.

## 8. Placeholder data model

A single placeholder module — **shaped like the future Payload types** so SP1 wiring is a swap, not a rewrite — exports the mockup's content verbatim:

```ts
// apps/web/src/app/(site)/bedroom-set/_data/placeholder.ts  (SP2 only; SP1 replaces with Payload fetch)
export type DesignCard = {
  slug: string;        // 'lotus'              → future: PayloadDesign.slug
  name: string;        // 'لوتوس'              → future: PayloadDesign.name
  cardSrc: string;     // imported webp asset  → future: design.sliderMedia ?? heroMedia (.url)
  logoSrc: string;     // imported png asset   → future: design.logoMedia (.url)  ⟵ new field in SP1
};
export type FeaturedTile = { src: string; alt: string };          // future: product/collection media
export type FeaturedPage = { title: string; hero: FeaturedTile; row: FeaturedTile[] };
export type WritingContent = { heading: string; body: string };   // future: richText

export const DESIGNS: DesignCard[];   // the 7: lotus/parla/caroline/iron/jacqueline/lukaplus/loof
export const PAGES: FeaturedPage[];    // the 2 featured pages above
export const WRITING: WritingContent;  // the heading + the exact placeholder paragraph
```

- **Assets:** copy the mockup's images (`{slug}.webp`, `{slug}-logo.png`, the featured banners `lotusBanner`/`lukaBanner` and `rect51/53/55/56`) into the app as real assets (e.g. `apps/web/src/assets/bedroom-set/…`) and `import` them so the bundler fingerprints them. **No base64.**
- **Image rendering:** carousel posters and featured tiles render to match the mockup's `object-fit` (`contain`+drop-shadow for cards; `cover` for the hero; `height:auto` for rows). Prefer `next/image` per codebase convention; if optimization perturbs the rendering, fall back to plain `<img>` for the affected tile. Parity is checked in §11.

## 9. Styling

- One co-located stylesheet (e.g. `bedroom-set.css`, imported by the page like `designs-slider.css`), porting the mockup's CSS **verbatim** except:
  - **Delete** the mockup's `:root` block and `@font-face` — use design-system tokens and the global font instead.
  - **Token mapping** (identical values, names per `packages/design-system/css/tokens.css`):
    `--ivory→--color-ivory`, `--sand→--color-sand`, `--stone→--color-stone`, `--charcoal→--color-charcoal`, `--ink→--color-ink`, `--forest→--color-forest`, `--caramel→--color-gold` (both `#C49A6C`).
  - **Easings:** `--ease (.22,1,.36,1)` and `--ease-q (.16,1,.3,1)` already exist as `--ease-out-soft` / `--ease-out-quint` in the design system — use those. `--rt-spring (.34,1.45,.5,1)` is a bespoke overshoot spring **not** in the system: **add it to the design-system motion tokens** (confirmed 2026-06-05 — repo rule "tokens are never bypassed"). Add both the CSS var (`packages/design-system/css/tokens.css`) and the TS token (`packages/design-system/src/tokens/motion.ts`).
  - Component-geometry vars (`--card-h`, `--card-w`, grid `--g`/`--inset`) stay local to the component.
  - Logical properties already match (the mockup uses `padding-inline`, etc.); keep RTL-logical throughout.
- The non-content chrome (`badge`) is dropped.

## 10. Accessibility & reduced-motion

- Carry over verbatim: `aria-label`s on dots/tabs/featured controls, `role=tablist/tab`, `aria-hidden` toggling on the featured overlay, the `@media (prefers-reduced-motion:reduce)` block (kills the nudge/bob animations and the tile/headline transitions). Keyboard paths (§5.7) are the a11y fallback for every gesture.

## 11. Verification (parity is proven, not assumed)

Using the headless-Chromium recipe in `[[reference-zhic-headless-browser]]`:
1. Screenshot the **live mockup** (`…/mockups/bedroom-set-v2/index.html`) and the **ported page** at 390×844 (and a desktop width) in the same states: carousel rest, mid-swipe (drive `progress` to a half-step to catch the flip at edge-on + glass blur-out), writing section scrolled in, featured page 0, featured page 1.
2. Diff side-by-side; reconcile any drift back to the mockup. Use `getBoundingClientRect()` to prove the featured grid edges align (the known Safari-vs-Chromium check) and the dots center on phone.
3. Confirm gestures behave identically (horizontal swipe switches design without scrolling; vertical scroll reveals writing; swipe-up-at-bottom opens featured; featured paging + close).

## 12. File manifest

**Modify**
- `apps/web/src/app/(site)/bedroom-set/page.tsx` — RSC: import placeholder data, render `<BedroomSetLanding>`; add `generateMetadata` (indexed).
- `packages/design-system/css/tokens.css` (+ `…/src/tokens/motion.ts`) — add `--rt-spring` motion token (if we go the token route).

**Create** (under `apps/web/src/app/(site)/bedroom-set/`, or `src/components/bedroom-set/`)
- `_data/placeholder.ts` — the placeholder data + types.
- `BedroomSetLanding.tsx`, `DesignStage.tsx`, `DesignCarousel.tsx`, `StageTopBar.tsx`, `StageCounter.tsx`, `CategoryTabs.tsx`, `WritingSection.tsx`, `FeaturedOverlay.tsx`, `RotatingHeadline.tsx`, `Toast.tsx` (final split decided in the plan).
- `bedroom-set.css` — ported styles.
- `apps/web/src/assets/bedroom-set/…` — the copied image assets.

(Final component granularity is a writing-plans concern; the inventory in §4–§5 is what must exist, however it's split.)

## 13. Out of scope (SP1 / later)

- Wiring to Payload: real designs, the new `Designs.logoMedia` field + seeding ~26 logos, banner media, the writing copy field, the «پرفروش‌ترین» best-sellers `Collection`, "newest" via `-createdAt`.
- Real **navigation** on card/tile tap (currently the toast stub) and the **category-tab filtering/linking** behavior (currently the active-pill stub) — both depend on SP1 data.
- Removing/retiring the old `DesignsSlider` component.

## 14. Resolved decisions

1. **Shell reconciliation (§6)** — **keep the SiteHeader/Footer + the mockup's `.top` bar**; the stage fits below the sticky header via `--header-height`. (Confirmed 2026-06-05.)
2. **`--rt-spring`** — **add it to the design-system motion tokens** (CSS var + TS token) per the repo rule. (Confirmed 2026-06-05.)
