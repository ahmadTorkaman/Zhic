# Designs Index Page — Design Spec

**Date:** 2026-05-17
**Branch:** `feat/products-mega-menu` (continues — same series)
**Status:** spec — implementation plan to follow via `superpowers:writing-plans`
**Closes:** `FU-MM-a` («/designs» index), `FU-DDP-d` (lookbook grid follow-up from design detail spec)

---

## 0. Why this spec

The `/designs/<slug>` detail page shipped earlier in this series ([spec](2026-05-16-design-detail-page-design.md)) gives each design a proper editorial home. But there's no surface yet for browsing the catalog of designs — the only entry points are the mega-menu's «طرح‌ها» panel (a flat list) and the mobile menu's equivalent (a 2-column name grid). Users who want to discover designs visually have nowhere to land.

This spec adds the missing `/designs` index page. Per operator direction, the page is **not a grid** — it's a **single-focus carousel** that shows three design tiles at a time, with the center tile in full focus and the side tiles dimmed to 40% opacity. Each tile is a GIF showing the design's complete furniture package (the bed + nightstand + wardrobe + dresser in motion). Manual navigation only (arrows + swipe + keyboard); no auto-play. The slider IS the page — no grid below.

Visual reference: `apps/web/public/docs/designs-index-mockup.html` (interactive mockup, served at `http://80.240.31.146:3000/docs/designs-index-mockup.html`).

It deliberately **does not** cover:

- Filter controls (by age_group, etc.) — operator chose theatrical single-focus over filtered browsing
- A separate `/designs/grid` view — the mega-menu's «طرح‌ها» panel already serves the "list all" use case
- Auto-play / pause-on-hover behaviors — explicitly out per design choice
- A "see all" CTA pointing somewhere from the slider — the slider already IS the full catalog
- GIF-to-video transcoding (still tracked as `FU-2.3-a`) — slider plays whatever media is uploaded

---

## 1. Visual reference

See the live mockup. ASCII summary:

```
┌──────────────────────────────────────────────────────────────────────┐
│ [floating-pill header]                                                 │
│                                                                        │
│ خانه / طرح‌ها  (breadcrumb)                                           │
│                                                                        │
│              طرح‌ها  (h1, centered)                                   │
│       هر طرح یک زبان طراحی است.  (subtitle, centered)                 │
│                                                                        │
│   ←        ┌───┐    ┌─────────────╗   ┌───┐       →                    │
│  prev      │GIF│    │             ║GIF│   │      next                  │
│            │40%│    │   GIF 100%  ║40%│   │                            │
│            │   │    │  (FOCUSED)  ║   │   │                            │
│            └───┘    │   in card   ║   │   │                            │
│           naked     └─────────────╝   └───┘                            │
│           gif        ↑ card chrome   ↑ naked gif                        │
│                      ↑ GIF spills 22% past the right edge ──▶          │
│                                                                        │
│                          گندم                                          │
│                  گرم، برای خواب کودکانه                                 │
│                                                                        │
│                · · · ● · · · · · · · · · · · · ·                       │
│                       ۱ از ۱۸                                          │
└──────────────────────────────────────────────────────────────────────┘
                              [footer]
```

### 1.1 Tile chrome — focused vs dim

**Dim tiles** (the two side tiles): **no card chrome**. No border, no rounded corners, no shadow. Just the raw GIF surface at 40% opacity, sitting naked on the page background. The eyebrow, name, and watermark («ژ») still render on top as identification, but there's no container.

**Focused tile** (the center one): gains card chrome — a 1px sand border, 8px rounded corners, soft drop shadow (`0 10px 30px rgba(20,17,15,0.10)`), and 100% opacity. The GIF surface inside extends **22% past the card's physical right edge**, with the inside (left) corners rounded but the right side flowing past where the card frame would end. The right edge of the card border is visually replaced by the spilling GIF.

**Stacking**: focused tile sits at `z-index: 5` so its spilling GIF visually overlaps the right-neighbor dim tile (intentional — the focused design dominates). Slider arrows sit at `z-index: 10` so they're never covered by the spill.

**On focus change**: the chrome smoothly transitions in/out via the same `var(--dur-slide) var(--ease-out-soft)` curve as the opacity. Old focused tile loses chrome (border fades, corners flatten, spill retracts); new focused tile gains chrome (border appears, corners round, GIF extends).

**Mobile**: same chrome rules apply unchanged. Tiles are smaller (~95px wide at 375px viewport) but the 22% spill proportion is preserved. Arrows shrink to 44×44px and tuck closer to the viewport edges. No "1-with-peeking" reflow — kept 3-visible per operator choice (mockup-validated).

### 1.2 Slider behavior

| Interaction | Behavior |
|---|---|
| Click ← (right arrow in RTL) | Previous design — focused index decrements |
| Click → (left arrow in RTL) | Next design — focused index increments |
| Click a dim edge tile | That tile slides into center (becomes focused) |
| Click the focused (center) tile | Navigates to `/designs/<slug>` |
| Click a dot | Jumps to that index |
| Keyboard ArrowLeft | Next (RTL: left = forward reading direction) |
| Keyboard ArrowRight | Previous |
| Touch swipe left | Next |
| Touch swipe right | Previous |
| Past last → next | Wraps to first (infinite loop) |
| Past first → previous | Wraps to last (infinite loop) |

### 1.3 Caption + indicator

- Caption sits below the slider: focused design's name (h2-ish, large) + tagline (one-line lead). On focus change, the caption cross-fades (opacity 1 → 0.3 → 1) over ~600ms.
- Dots strip: one dot per design (max 30 wraps onto two rows visually). Focused dot is charcoal + scaled 1.5×. Click a dot to jump.
- Counter: «N از M» with Persian digits.

---

## 2. Schema changes — `services/api/src/collections/Designs.ts`

Add ONE new field to the `Designs` collection. Position it after the existing `heroMedia` field (logical grouping — both are single-media uploads, both render at the top of design surfaces).

```ts
{
  name: 'sliderMedia',
  type: 'upload',
  relationTo: 'media',
  label: 'تصویر اسلایدر صفحه‌ی طرح‌ها',
  admin: {
    description: 'مدیای کارت این طرح در اسلایدر صفحه‌ی /designs (ترجیحاً GIF یا ویدیوی کوتاه که کل ست را نشان می‌دهد). اگر خالی باشد، از heroMedia یا گالری استفاده می‌شود.',
  },
},
```

### 2.1 Migration

A new migration file: `services/api/src/migrations/<timestamp>_add_design_slider_media.ts`. Adds a `slider_media_id` integer FK on the `designs` table. Pattern mirrors the editorial-fields migration (`20260516_224611_add_design_editorial_fields.ts`):

```sql
ALTER TABLE "designs" ADD COLUMN IF NOT EXISTS "slider_media_id" integer;

DO $$ BEGIN
  ALTER TABLE "designs"
    ADD CONSTRAINT "designs_slider_media_id_media_id_fk"
    FOREIGN KEY ("slider_media_id")
    REFERENCES "media"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
```

`down()` drops the constraint and column.

Migration must be hand-written + registered in `migrations/index.ts` + applied via direct pg + inserted into `payload_migrations` table — same workaround used for prior migrations because `pnpm migrate:create` is still broken (FU-7.1-c). The implementation plan will spell this out.

### 2.2 Fallback chain for slider media

In the page renderer: per-design tile media resolves as

```
design.sliderMedia ?? design.heroMedia ?? design.gallery?.[0] ?? null
```

If `null` for a given design, the tile renders the cream→sand gradient + «ژ» watermark placeholder (already used in the mockup). The design still appears in the slider — we never hide a design for missing media. The operator sees the placeholder as a "you should upload media here" cue.

---

## 3. Architecture

### 3.1 Files added

| Path | Responsibility |
|---|---|
| `apps/web/src/app/(site)/designs/page.tsx` | The new route. Server component, fetches all designs, renders the page chrome + the slider client component. |
| `apps/web/src/components/design/DesignsSlider.tsx` | Client component owning the slider state (focused index), navigation handlers (arrow / dot / swipe / keyboard), and the cross-fade caption animation. Accepts `designs: PayloadDesign[]` as a prop. |
| `apps/web/src/components/design/designs-slider.css` | Component-scoped CSS. Includes the 3-visible desktop layout, 1-with-peeking mobile layout, dim-edge styling, arrow buttons, dots strip, caption animation. |
| `services/api/src/migrations/<timestamp>_add_design_slider_media.ts` | Payload-style migration adding the `slider_media_id` column. |

### 3.2 Files modified

| Path | Change |
|---|---|
| `services/api/src/collections/Designs.ts` | Add the `sliderMedia` field. |
| `services/api/src/migrations/index.ts` | Register the new migration. |
| `apps/web/src/lib/payload.ts` | Extend `PayloadDesign` with `sliderMedia?: PayloadMedia | null`. Restore `fetchAllDesigns()` (was removed when sitemap got its own helper — now needed for the index page). |
| `apps/web/src/components/layout/ProductsMegaMenu.tsx` | `DesignsPanel` gets a «همه‌ی طرح‌ها →» CTA at the bottom pointing at `/designs` (parity with the categories panel which already has one). |
| `apps/web/src/components/layout/MobileMenu.tsx` | `DesignsSection` gets a «همه‌ی طرح‌ها →» link below the grid pointing at `/designs`. |
| `apps/web/src/app/sitemap.ts` | Add the static `/designs` entry (now that the route exists — earlier we explicitly cut this because the route didn't exist yet). |
| `docs/state.md` | Strike-through `FU-MM-a` + `FU-DDP-d`, append `FU-DIX-*` follow-ups, add Post-Phase row. |

### 3.3 Data flow

```
/designs request
  └── fetchAllDesigns()  ── single call to GET /api/designs?limit=100&sort=name&depth=2
        │                                                                  ↑ depth=2 so sliderMedia/heroMedia/gallery resolve to media objects
        ▼
  <DesignsSlider designs={designs} />  ── client component
        │
        ▼
   slider state + handlers; renders 3 tiles at a time
```

Single Payload call. Cache via `payloadFetch`'s `next: { revalidate: 300, tags: ['designs'] }` — same as other fetchers.

---

## 4. Page composition — `apps/web/src/app/(site)/designs/page.tsx`

```tsx
import { Container, Breadcrumbs } from '@zhic/ui';
import { DesignsSlider } from '@/components/design/DesignsSlider';
import { fetchAllDesigns } from '@/lib/payload';

export const metadata = {
  title: 'طرح‌ها',
  description: 'گالری طرح‌های ژیک — هر طرح یک زبان طراحی برای فضای زندگی شما.',
  alternates: { canonical: '/designs' },
};

export default async function DesignsIndexPage() {
  const designs = await fetchAllDesigns();
  return (
    <>
      <Container>
        <div className="pt-[calc(var(--header-height)+var(--space-5))]">
          <Breadcrumbs items={[{ label: 'خانه', href: '/' }, { label: 'طرح‌ها' }]} />
        </div>
        <header className="py-9 text-center">
          <h1 className="text-h1 font-black text-ink">طرح‌ها</h1>
          <p className="mx-auto mt-3 max-w-[560px] text-lead font-light text-stone">
            هر طرح یک زبان طراحی است. کارت‌ها را کنار بزنید تا کل مجموعه را ببینید.
          </p>
        </header>
      </Container>

      <DesignsSlider designs={designs} />
    </>
  );
}
```

### 4.1 Empty / sparse state

- **0 designs**: instead of rendering the slider, show a centered message «به‌زودی طرح‌های ژیک به این صفحه اضافه می‌شوند.» under the title block. No slider, no controls.
- **1 design**: render a single centered tile at full opacity, no arrows, no dots, no counter. Caption shows the one design. Single tile is clickable to its detail page.
- **2 designs**: render both tiles side-by-side, both at full opacity, no dim. Arrows + dots still wired (just toggles which of the two is "focused" for caption purposes). Less theatrical but better than awkward 3-slot logic with one empty.
- **≥3 designs**: the full slider as described.

These thresholds are gates inside `DesignsSlider.tsx`. No separate components.

---

## 5. Component — `DesignsSlider.tsx` contract

### 5.1 Props

```ts
type DesignsSliderProps = {
  designs: PayloadDesign[]
}
```

The component is responsible for ALL state and behavior; the parent page provides only the data.

### 5.2 Internal state

```ts
const [focused, setFocused] = useState<number>(0)
const [isAnimating, setIsAnimating] = useState<boolean>(false)
const trackRef = useRef<HTMLDivElement>(null)
const viewportRef = useRef<HTMLDivElement>(null)
```

### 5.3 Wrap behavior (production)

The mockup leaves blank edges at indices 0 and `length-1`. Production uses **clone-tile wrapping**:

- DOM contains `2 + N + 2` tiles total: the LAST two designs cloned to the start, then the N real designs, then the FIRST two cloned to the end.
- On navigation past the last tile (e.g., focused crosses N→0), the track animates to the cloned position, then on transitionend snaps `transform` instantly to the equivalent non-cloned position. To the user: seamless infinite loop.
- Clones are `aria-hidden="true"` so screen readers see only the N real designs.

### 5.4 Navigation handler

```ts
function go(delta: number) {
  if (isAnimating) return  // ignore mashing
  const next = focused + delta
  setIsAnimating(true)
  setFocused((next + designs.length) % designs.length)
  // Caption + transform animations fire via React state → CSS transitions
}
```

Handlers wired to: prev/next buttons, dot clicks, keyboard arrow keys (with cleanup), touchstart/touchend on viewport (minimum swipe distance 40px), and click on dim tiles (sets `focused = tileIndex` directly).

### 5.5 Caption cross-fade

- When `focused` changes, the caption div gets a CSS class `is-changing` for 200ms.
- `.is-changing .caption-name, .is-changing .caption-tagline { opacity: 0.3 }` (mid-fade dim).
- Class removed after 200ms via `setTimeout`. Caption text updates in the same tick (React's `useEffect`/state-driven render).

### 5.6 ARIA

```html
<section role="region" aria-roledescription="carousel" aria-label="گالری طرح‌ها">
  <button aria-label="طرح قبلی">...</button>
  <button aria-label="طرح بعدی">...</button>
  <div ref={viewportRef} aria-live="polite" aria-atomic="false">
    <div ref={trackRef} role="list">
      {tiles.map((tile, i) => (
        <div role="listitem" aria-hidden={tile.isClone || undefined}>
          ...
        </div>
      ))}
    </div>
  </div>
  <div role="status" aria-live="polite">{captionName} {captionTagline}</div>
  <div role="tablist" aria-label="گزینش طرح">
    {designs.map((d, i) => (
      <button role="tab" aria-selected={focused === i} aria-label={`طرح ${d.name}`}>...</button>
    ))}
  </div>
</section>
```

### 5.7 Performance

- All 18 (or however many) GIFs render at page load.
- For ≤30 designs this is acceptable on broadband (~10-30MB total GIF payload assuming 500KB-1.5MB per GIF).
- If catalog exceeds 30: add `loading="lazy"` on the `<img>` tags for tiles outside the 5-tile visible window (focused ± 2). Mark as `FU-DIX-c`.
- `<video>` (for non-GIF media) gets `preload="metadata"` instead of `auto` to avoid prefetching all videos.

### 5.8 Tile structure & chrome CSS

Each tile is a `.slider-tile` with a `.tile-bg` child that holds the actual media. The chrome (border, radius, shadow) lives on `.slider-tile`; the spill geometry lives on `.tile-bg`. Splitting them lets the media surface change shape independently of the tile box.

```html
<div class="slider-tile" data-focused={i === focused || undefined}>
  <div class="tile-bg">
    <TileMedia design={design} />
  </div>
  <span class="tile-eyebrow">طرح</span>
  <span class="tile-name">{design.name}</span>
</div>
```

Key CSS rules (the full ruleset goes in `designs-slider.css`):

```css
/* Default = dim tile: no chrome, just the naked media surface */
.slider-tile {
  position: relative;
  aspect-ratio: 4 / 3;
  opacity: 0.4;
  background: transparent;
  border: 0;
  border-radius: 0;
  overflow: visible;
  cursor: pointer;
  transition: opacity var(--dur-slide) var(--ease-out-soft);
}

.tile-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;            /* clip the GIF to the tile-bg's box */
  z-index: 0;                  /* sit under text labels */
  transition: inset var(--dur-slide) var(--ease-out-soft),
              border-radius var(--dur-slide) var(--ease-out-soft);
}

.slider-tile .tile-bg :is(img, video) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Focused = card chrome + GIF spills 22% past the right edge */
.slider-tile[data-focused] {
  opacity: 1;
  z-index: 5;                  /* sit above dim tiles when spill overlaps */
  border: 1px solid var(--color-sand);
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(20, 17, 15, 0.10);
}

.slider-tile[data-focused] .tile-bg {
  right: -22%;                  /* physical right — extend past the card's right border */
  border-radius: 8px 0 0 8px;   /* round only the inside (left) corners */
}

/* Arrows always above the spill */
.slider-arrow {
  z-index: 10;
}
```

**Why the spill is on the right edge specifically**: in RTL the right is the start side (where reading begins), so spilling there suggests "this design is coming forward to be discovered" rather than "advancing toward the next" (which would be a left-spill, going with reading direction). Operator choice — locked. If a future reversal is wanted, only the two `right` / `border-radius` declarations change.

**Mobile**: the same rules apply unchanged. At a 375px viewport, the focused tile is ~95px wide and the 22% spill is ~21px (still ~22% relative). Arrows shrink via the `@media (max-width: 768px)` block but stay at z-index 10. No layout reflow.

---

## 6. Tile media rendering

`TileMedia` returns just the `<img>` / `<video>` element. The wrapping `.tile-bg` (see §5.8) handles size, clip, and the spill geometry; the styles in `designs-slider.css` target `:is(img, video)` inside `.tile-bg` to fill the surface.

```tsx
function TileMedia({ design }: { design: PayloadDesign }) {
  const media = design.sliderMedia ?? design.heroMedia ?? design.gallery?.[0] ?? null;
  if (!media?.url) return <TilePlaceholder name={design.name} />;
  if (media.mimeType?.startsWith('video/')) {
    return (
      <video
        src={media.url}
        autoPlay loop muted playsInline
        preload="metadata"
      />
    );
  }
  // image/* including image/gif — GIFs animate naturally in <img>
  return <img src={media.url} alt="" />;
}
```

`<TilePlaceholder>` renders the cream→sand linear gradient + a positioned «ژ» watermark — same look as the mockup's dim-tile background. Used when a design has no `sliderMedia` / `heroMedia` / `gallery` at all (rare; operator sees the placeholder as a cue to upload media).

---

## 7. Mega-menu + mobile menu — «See all designs» CTA

Now that `/designs` exists, restore the "See all" CTA we cut from the mega-menu work.

### 7.1 `apps/web/src/components/layout/ProductsMegaMenu.tsx`

In `DesignsPanel`, after the `<ul>` of design links, add:

```tsx
<Link href="/designs" className="zh-mega-cta">
  همه‌ی طرح‌ها <Arrow />
</Link>
```

Mirrors the existing «همه‌ی محصولات» CTA on `CategoriesPanel`.

### 7.2 `apps/web/src/components/layout/MobileMenu.tsx`

In `DesignsSection`, after the `<ul>` grid of names, add:

```tsx
<Link
  href="/designs"
  onClick={onLinkClick}
  className="mt-3 self-start text-body font-bold text-charcoal underline underline-offset-4 transition-colors duration-[var(--dur-hover)] hover:text-forest"
>
  ← همه‌ی طرح‌ها
</Link>
```

(Mobile uses an in-line text link with arrow, consistent with «← تمامی محصولات» in the same view.)

---

## 8. SEO

- `<title>`: «طرح‌ها» (template will append « — ژیک» via root layout)
- Meta description: brand-statement copy («گالری طرح‌های ژیک ...»)
- `alternates.canonical: /designs`
- Sitemap: add a STATIC `/designs` entry alongside per-slug `/designs/<slug>` (the per-slug ones already exist). Priority `0.8`, changefreq `weekly`.
- OG image: the first design's `sliderMedia` or `heroMedia` (whichever is non-null). If both null, inherits the root OG image.

---

## 9. Acceptance criteria

The PR is done when **all** of the following are true:

1. `/designs` renders 200 on a fresh build.
2. With 18 designs in DB, the slider shows 3 tiles on both desktop AND mobile (no layout reflow at the 768px breakpoint — same 3-visible model, smaller tiles).
3. **Dim tiles have NO card chrome** — no border, no rounded corners, no shadow. Just the GIF surface at 40% opacity sitting naked on the page background.
4. **Focused tile has card chrome** — 1px sand border, 8px rounded corners, soft drop shadow, 100% opacity.
5. **Focused tile's GIF spills 22% past its physical right edge**, with the inside (left) corners rounded only.
6. Focused tile sits at `z-index: 5`; arrows at `z-index: 10` (arrows always above the spill).
7. Chrome smoothly transitions in/out when focus changes (same duration/easing as the opacity transition).
8. Arrow buttons + keyboard arrow keys + touch swipe + dot clicks all navigate.
9. Past-last and before-first wrap continuously (no dead edges).
10. Click on dim tile slides it to center; click on center tile navigates to `/designs/<slug>`.
11. Tile media: GIF (uploaded as `sliderMedia` on a design) plays naturally; `<video>` mimeTypes render via `<video>` with autoplay+loop+muted+playsInline.
12. Designs without `sliderMedia` (and no fallback) render the placeholder gradient + «ژ» watermark inside `.tile-bg`.
13. Caption + counter update on each focus change with the cross-fade.
14. Mega-menu `DesignsPanel` has a «همه‌ی طرح‌ها →» CTA that lands on `/designs`.
15. Mobile `DesignsSection` has a «← همه‌ی طرح‌ها» link that lands on `/designs`.
16. Sitemap includes `/designs`.
17. Typecheck, lint, build all clean.
18. Empty / 1-design / 2-design edge cases render without breaking.
19. `docs/state.md` updated; `FU-MM-a` + `FU-DDP-d` struck through.

---

## 10. Follow-ups (out of scope, captured for `state.md`)

| Id (proposed) | Item |
|---|---|
| `FU-DIX-a` | GIF → video transcode pipeline on Payload upload (carries forward `FU-2.3-a`). Reduces media payload significantly; better preview controls. |
| `FU-DIX-b` | Filter pills above the slider — by `age_group` (نوزاد/کودک/نوجوان/بزرگسال). Useful when catalog grows past 25-30 designs. |
| `FU-DIX-c` | Lazy-load tile media beyond focused ± 2. Triggers when catalog exceeds 30 designs. |
| `FU-DIX-d` | Optional auto-play with pause-on-hover (operator was given the choice and picked manual; revisit if engagement metrics suggest passive browsing). |
| `FU-DIX-e` | Mini-grid alternate view — a button toggles slider ↔ grid (the discarded option B from brainstorming). For users who prefer scan-and-jump. |
| `FU-DIX-f` | Slider analytics — track which designs get clicked-to-detail. Surface findings to operator. |

---

## 11. References

- Visual mockup: `apps/web/public/docs/designs-index-mockup.html` (served at `/docs/designs-index-mockup.html`)
- Parent spec: `docs/superpowers/specs/2026-05-16-design-detail-page-design.md` (per-design lookbook page)
- Mega-menu spec: `docs/superpowers/specs/2026-05-16-products-dropdown-mega-menu-design.md` (originally cut the «See all» CTA we now restore)
- State board: `docs/state.md` — `FU-MM-a` + `FU-DDP-d` rows
- Designs schema today: `services/api/src/collections/Designs.ts`
- Existing client-slider patterns to study: `apps/web/src/components/showroom/ShowroomGallery.tsx` (if any), `apps/web/src/components/product/ProductGrid.tsx` (no slider, but RTL grid reference)
