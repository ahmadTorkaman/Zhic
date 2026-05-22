# PDP Variant Picker — Design Spec

**Date:** 2026-05-22
**Branch:** TBD — likely `feat/pdp-variant-picker` (new series)
**Status:** spec — implementation plan to follow via `superpowers:writing-plans`
**Closes:** none directly. Sub-project **C** of the products overhaul effort. Sub-projects A (schema groundwork via Categories — partially shipped via D), B (xlsx import), D (/categories hub pages — shipped), E (/products filter rework) are separate specs.

---

## 0. Why this spec

The PDP today (`apps/web/src/app/(site)/products/[slug]/page.tsx`) treats each product as a single SKU. The xlsx-driven catalog refresh (sub-project B) brings ~220 products with ~880 variant rows in total — most products will have 1–3 variant axes (size, footboard, doors, drawers, glass, width, pieces). Without an in-page picker, the new variant data can't surface to users; operators can't accept inquiries that disambiguate which variant the visitor wants.

This spec adds:

1. A new Payload collection `productVariants` (per spec §13, modified to use flexible JSON axes instead of hardcoded `size`/`finish`/`fabric` fields).
2. A **sticky bottom variant picker bar** on every PDP — always-on, fixed at the bottom of the viewport, glasscard chrome unified with the rest of the site.
3. **Inline-chip interaction model** — every axis renders all its values as chips in the bar; tap a chip to change the selection instantly; no bottom sheet, no extra steps.
4. **Hero image cross-fade** when the selected variant carries its own `image` upload — 600ms cubic-bezier transition.
5. **Sidebar repurposing** — the existing `<ProductSidebar>`'s price + CTA move into the sticky bar, freeing the sidebar to carry secondary specs (طرح callout, زمان تحویل, گارانتی, روکش).
6. **Auto-pick the first variant on page load**; CTA is always enabled. No required-selection blocking.

It deliberately **does not** cover:

- The xlsx import pipeline that seeds the variants (sub-project B — separate spec). This spec assumes the operator can populate variant rows from the admin or that B does it.
- Cart / checkout logic (Package 2+) — the picker passes `variantId` + `selectedAxes` to the existing inquiry flow today; when cart ships, the same data flows into the cart line.
- 3D model variant swapping (spec §13's `gltfVariantName` field) — deferred to a future package; the schema field is included but the PDP doesn't act on it.
- Per-variant URLs — the page URL stays `/products/[slug]` regardless of axis selection. **No per-variant URL is ever generated.** Locked in [[project_zhic_products_overhaul|the SEO memo]] and [[feedback_zhic_seo_priority]].
- /products filter rework (sub-project E) — separate spec.
- Stock real-time sync (Package 4 — MES) — `availability` per-variant is operator-edited only.

---

## 1. Visual reference

Production-grade interactive mockup lives in the repo:

- `apps/web/public/docs/pdp-variant-picker-mockup.html`
  served at `http://80.240.31.146:3000/docs/pdp-variant-picker-mockup.html`

The mockup is the visual source-of-truth. Any divergence between this spec and the mockup means the mockup wins — update the spec.

### 1.1 Page anatomy

```
┌──────────────────────────────────────────────────────────────────────┐
│ [pill header — same as /categories]                                   │
│                                                                        │
│ خانه / محصولات / طرح گندم / تخت گندم   (breadcrumb)                  │
│                                                                        │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │           hero — 21:9 desktop, 4:5 mobile                       │  │
│  │           cinematic image, cross-fades on variant change        │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────┬────────────────────────────────┐  │
│  │ MAIN COLUMN                   │ SIDEBAR (info-only)             │  │
│  │                                │                                  │  │
│  │ طرح · گندم · تخت              │ [glasscard]                      │  │
│  │ تخت گندم (h1)                 │  طرح — گندم                       │  │
│  │ گرما برای خواب ... (tagline)  │  گرما برای خواب کودکانه           │  │
│  │                                │                                  │  │
│  │ ۲ پاراگراف کپی                │ [glasscard]                      │  │
│  │                                │  زمان تحویل — ۵۶ روز کاری         │  │
│  │ ────────                       │                                  │  │
│  │ مشخصات                         │ [glasscard]                      │  │
│  │  ابعاد · ...                  │  گارانتی — ۵ سال                  │  │
│  │  روکش · ...                   │                                  │  │
│  │  ...                           │ [glasscard]                      │  │
│  │                                │  روکش‌ها — گردو · راش              │  │
│  └──────────────────────────────┴────────────────────────────────┘  │
│                                                                        │
│  ──── (border) ────                                                   │
│  کنار آن خوب است (h2)                                                 │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                                 │
│  │ pair │ │ pair │ │ pair │ │ pair │  (quiet-card tiles)              │
│  └──────┘ └──────┘ └──────┘ └──────┘                                 │
│                                                                        │
│ [footer]                                                               │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │ STICKY PICKER BAR — fixed at viewport bottom                  │    │
│  │ سایز [۱۲۰][۱۴۰][۱۶۰][۱۸۰]  پاتختی [بلند][کوتاه] │ ۲۸٫۵ │ استعلام │    │
│  └──────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

### 1.2 Locked design decisions

| Decision | Choice | Source |
|---|---|---|
| Picker placement | **Sticky bottom bar** (C) | brainstorm 2026-05-22 |
| Picker density | **Inline chips visible** (β) — all axes' chips in the bar, no sheet | brainstorm 2026-05-22 |
| Hero behavior on variant change | **Cross-fade to `variant.image`** when set; stays on product hero when null | brainstorm 2026-05-22 |
| Default selection | **Auto-pick first variant on page load**; CTA always enabled | brainstorm 2026-05-22 |
| SKU display in bar | **Hidden** — not surfaced to end users | brainstorm 2026-05-22 |
| Cross-fade duration | **600ms** on `cubic-bezier(0.22, 1, 0.36, 1)` | brainstorm 2026-05-22 |
| Bar visual language | **Glasscard** (`--glass-bg` + `--glass-blur` + sand border + subtle shadow) — same recipe as `.glass-card` / `.site-header-chrome` / /designs v14 pedestal | brainstorm 2026-05-22 |
| Active chip | Ink background + ivory text + bold weight | mockup |
| Inactive chip | Sand-45% background + charcoal text + regular weight | mockup |
| Out-of-stock chip | Opacity 0.4, pointer-events none, order preserved, no strikethrough | spec §1.4 |
| CTA «استعلام قیمت» | Ink background + ivory text + **2px gold accent line** at bottom edge (whisper accent — gold is earned) | mockup |

### 1.3 Glass design unification

The site has three established glass surfaces; the picker bar is the fourth. All four use the same `--glass-bg` / `--glass-border` / `--glass-blur` tokens defined in `packages/design-system/css/tokens.css`:

| Surface | Class / location | Notes |
|---|---|---|
| Site header (scrolled state) | `.site-header-chrome` in `packages/design-system/css/base.css` | 24px blur, ivory 85% (slightly more opaque for legibility) |
| Designs v14 pedestal | `.zh-designs-pedestal` in `apps/web/src/components/design/designs-slider.css` | 48px blur — special moment, focused-card backdrop |
| Generic `.glass-card` | `.glass-card` in `base.css` | 24px blur, ivory 60%, sand 50% border |
| **PDP picker bar (new)** | `.picker-bar` in `apps/web/src/components/product/PickerBar.module.css` | 24px blur + `saturate(1.05)`, ivory 78%, sand 50% border, soft shadow + inset top highlight |
| **PDP sidebar info cards (refactor)** | New `<InfoCard>` component using `.glass-card` directly | Picks up the canonical recipe |

The four-surface family forms the **glass language** for Zhic Package 1. The picker bar's ivory is 78% (vs the generic 60%) because it sits over a constantly-changing hero image — needs more legibility margin.

### 1.4 Mobile layout

At `< 768px`:

- **Picker bar** stacks vertically. Grid changes from `1fr auto auto` (axes | price | CTA) to `1fr` (axes stacked above price+CTA row, separated by 1px sand border). Axes still inline-wrap their chips; if a single axis has too many values to fit one row, chips wrap to a second row.
- **Hero** aspect ratio shifts from 21:9 to 4:5 (mobile favors verticality).
- **Sidebar** drops below the main column (existing two-col → single-column behavior, unchanged from current PDP).
- **Pill header** uses the floating-pill geometry already established for /categories.

The picker bar never collapses to a sheet — the operator chose **β inline chips** specifically; if a 3-axis product on a 375px viewport wraps the chips to 3 lines, the bar simply grows taller (max ~120px). Acceptable tradeoff for the always-direct interaction model.

### 1.5 Animation choreography

Page load order (with `prefers-reduced-motion: no-preference`):

1. **0–700ms**: hero image renders eagerly (no fade-in on hero — it's above-the-fold and Persian copy below it appears via BlurInText).
2. **0–700ms** (staggered): `<BlurInText>` reveals on meta line, title, tagline (90 / 220 / 360ms delays from the same scroll-trigger).
3. **0–700ms** (staggered): copy paragraphs + specs `<dl>` come up via `<FadeUp delay>`.
4. **on load complete**: sticky picker bar slides up — `transform: translateY(120%) → 0` over **350ms cubic-bezier(0.16, 1, 0.3, 1)**. First paint shows it offscreen; `requestAnimationFrame` in the picker's `useEffect` adds the `.in` class.
5. **on chip click**: price digits cross-fade (opacity 1 → 0 → 1 over 200ms; new value swapped at the fade midpoint). Hero image cross-fades over 600ms `cubic-bezier(0.22, 1, 0.36, 1)` if `variant.image` differs from current.

All animations short-circuit to instant under `prefers-reduced-motion: reduce`.

---

## 2. Schema changes

### 2.1 New collection — `services/api/src/collections/ProductVariants.ts`

```ts
import type { CollectionConfig } from 'payload'
import { publishedContentAccess } from '../lib/access'

export const ProductVariants: CollectionConfig = {
  slug: 'productVariants',
  labels: { singular: 'واریانت محصول', plural: 'واریانت‌های محصول' },
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'product', 'sku', 'availability'],
    group: 'کاتالوگ',
  },
  access: publishedContentAccess,
  // No label auto-generation. The `label` field is operator-set; if left
  // blank, the FRONTEND derives display text at render time as
  // "<product.name> · <axisKey1>=<valueLabel1> · ..." using the AXIS_LABEL /
  // VALUE_LABEL maps in PickerBar (§3.6). Keeping the auto-derive in the
  // view layer (not a write-time hook) means future label format tweaks
  // don't need a backfill.
  fields: [
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true,
      label: 'محصول',
      admin: { position: 'sidebar' },
    },
    {
      name: 'sku',
      type: 'text',
      required: true,
      unique: true,
      label: 'SKU',
      admin: {
        description: 'مثلاً GAN-BED-120-H. الزامی و یکتا.',
      },
    },
    {
      name: 'label',
      type: 'text',
      required: false,
      label: 'برچسب',
      admin: {
        description: 'متن نمایشی در سبد و فاکتورها. اگر خالی باشد، از نام محصول و محورهای واریانت خودکار ساخته می‌شود.',
      },
    },
    {
      name: 'axes',
      type: 'array',
      label: 'محورهای واریانت',
      admin: {
        description:
          'هر سطر یک محور (مثلاً سایز=۱۲۰). کلیدها باید با allowed_axes دسته‌بندی محصول هم‌خوان باشند.',
      },
      fields: [
        {
          name: 'key',
          type: 'text',
          required: true,
          label: 'محور',
          admin: { description: "مثل size, footboard, doors, drawers, glass, width, pieces" },
        },
        {
          name: 'value',
          type: 'text',
          required: true,
          label: 'مقدار',
          admin: { description: "مثل 120, high, 3, true" },
        },
      ],
    },
    {
      name: 'priceDeltaRials',
      type: 'number',
      required: false,
      defaultValue: 0,
      label: 'تغییر قیمت (ریال)',
      admin: {
        description: 'به قیمت پایه‌ی محصول اضافه می‌شود. می‌تواند صفر، مثبت، یا منفی باشد.',
      },
    },
    {
      name: 'availability',
      type: 'select',
      required: false,
      label: 'وضعیت موجودی (override)',
      options: [
        { label: 'موجود', value: 'in_stock' },
        { label: 'ساخت به‌سفارش', value: 'made_to_order' },
        { label: 'در انتظار', value: 'backorder' },
        { label: 'ناموجود', value: 'discontinued' },
      ],
      admin: {
        description: 'در صورت تنظیم، جایگزین وضعیت محصول می‌شود. خالی = وضعیت محصول.',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: false,
      label: 'تصویر واریانت',
      admin: {
        description: 'اختیاری. در صورت تنظیم، با انتخاب این واریانت روی صفحه‌ی محصول cross-fade می‌شود.',
      },
    },
    {
      name: 'displayOrder',
      type: 'number',
      required: false,
      defaultValue: 0,
      label: 'ترتیب نمایش',
      admin: {
        position: 'sidebar',
        description: 'هرچه کمتر، اول. پیش‌فرض ۰. هنگام تساوی، مرتب‌سازی ثانویه بر اساس createdAt صعودی.',
      },
    },
  ],
}
```

The auto-pick-first logic on the PDP sorts: `sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())`. Stable + deterministic.

### 2.2 Schema additions to `Products.ts`

Add ONE relationship field so the PDP can list variants without a separate fetch round-trip-tweak:

```ts
{
  name: 'variantIds',
  type: 'join',                  // Payload 3 reverse-relation feature
  collection: 'productVariants',
  on: 'product',
  label: 'واریانت‌ها',
  admin: {
    description: 'لیست واریانت‌های این محصول (مدیریت در مجموعه‌ی «واریانت‌های محصول»).',
  },
},
```

If Payload's `type: 'join'` is not available in this version, fall back to a virtual field via a `beforeRead` hook that queries `productVariants` by `productId`. The implementation plan will check what's available.

### 2.3 Migration

A new hand-written migration `services/api/src/migrations/<timestamp>_create_product_variants.ts`. Creates:

- `productVariants` table with columns: `id`, `product_id` (FK), `sku` (unique), `label`, `price_delta_rials`, `availability` (varchar enum), `image_id` (FK → media), `display_order`, `created_at`, `updated_at`.
- `productVariants_axes` child table for the `axes` array field: `id`, `_order`, `_parent_id` (FK → productVariants.id), `key`, `value`.
- Indexes: `(product_id)`, `sku` unique, `(product_id, display_order)` for picker rendering order, `(product_id, key, value)` on the axes child table for fast variant lookup-by-axes.

Migration registered in `services/api/src/migrations/index.ts`. Apply via direct pg + payload_migrations insert per the established workaround (`FU-7.1-c`).

### 2.4 Seed update

`services/api/src/seed.ts` extends the seeded `gandom-bed` product (or whichever is the canonical demo product) with 8 productVariants (4 sizes × 2 footboards). Each carries the matrix from the mockup:

| size | footboard | priceDelta | label | image |
|---|---|---|---|---|
| 120 | high | 0 | تخت گندم · ۱۲۰ · بلند | — |
| 120 | low | -600000 | تخت گندم · ۱۲۰ · کوتاه | — |
| 140 | high | +3700000 | تخت گندم · ۱۴۰ · بلند | — |
| 140 | low | +3100000 | تخت گندم · ۱۴۰ · کوتاه | — |
| 160 | high | +8000000 | تخت گندم · ۱۶۰ · بلند | (optional) |
| 160 | low | +7400000 | تخت گندم · ۱۶۰ · کوتاه | — |
| 180 | high | +11600000 | تخت گندم · ۱۸۰ · بلند | (optional) |
| 180 | low | +11000000 | تخت گندم · ۱۸۰ · کوتاه | — |

(All values in rials; the picker displays toman so divides by 10 during render.)

This seed is the minimum for the demo. Sub-project B (xlsx import) does the full 220-product × ~4-variant seed.

---

## 3. Architecture

### 3.1 Files added

| Path | Responsibility |
|---|---|
| `services/api/src/collections/ProductVariants.ts` | The new Payload collection (above). |
| `services/api/src/migrations/<timestamp>_create_product_variants.ts` | Hand-written migration. |
| `apps/web/src/components/product/PickerBar.tsx` | Client component (`'use client'`). Owns the picker state, the chip handlers, the price/SKU computation, the slide-up animation, and the inquiry-CTA hand-off. Renders the sticky bar. |
| `apps/web/src/components/product/PickerBar.module.css` | Picker bar styles — the glasscard recipe + chip + price + CTA. |
| `apps/web/src/components/product/useVariantSelection.ts` | Custom hook that owns variant state, resolves `selectedAxes → variantId`, computes derived price and image. Exposes `selectAxis(key, value)` and the current state. |
| `apps/web/src/components/product/HeroFrame.tsx` | Small server component wrapping the cinematic hero with cross-fade transition logic — receives `variantImage?` to render. The actual `<img>` swap happens client-side in `<HeroImage>` below. |
| `apps/web/src/components/product/HeroImage.tsx` | Client component (`'use client'`). Reads selected variant from context, cross-fades between product cover and variant image when the latter is set. |
| `apps/web/src/components/product/InfoCard.tsx` | Server component. Glasscard panel for the sidebar (طرح callout, زمان تحویل, گارانتی, روکش). Reusable `<InfoCard label value variant='default' | 'forest' />` API. |
| `apps/web/src/components/product/VariantSelectionContext.tsx` | Tiny client Context that pairs `<PickerBar>` and `<HeroImage>` so the bar's selection drives the hero's cross-fade. Pattern mirrors `category-filter-state.tsx` from sub-project D. |

### 3.2 Files modified

| Path | Change |
|---|---|
| `services/api/src/collections/Products.ts` | Add `variantIds` join field (or a virtual fallback). No other changes. |
| `services/api/src/migrations/index.ts` | Register the new migration. |
| `services/api/src/payload-types.ts` | Auto-regenerate (will need the hand-edit workaround from sub-project D Task 3 until `pnpm generate:types` is fixed). |
| `services/api/src/seed.ts` | Add the 8 demo variants for `gandom-bed` (or whichever flagship product is seeded). |
| `apps/web/src/lib/payload.ts` | Add `PayloadProductVariant` type + extend `PayloadProduct` with `variants?: PayloadProductVariant[]`. Extend `fetchProduct(slug)` to deep-populate `variants` via `depth: 3` (variant → image → media). |
| `apps/web/src/app/(site)/products/[slug]/page.tsx` | Wrap the page in `<VariantSelectionProvider>`. Replace static `<ProductSidebar>` price/CTA with the new info-only `<InfoCard>` stack. Mount `<HeroImage>` inside the hero frame instead of a plain `<PayloadImage>`. Mount `<PickerBar variants={product.variants} />` at the bottom of the page (outside the `Container`, inside the provider). |
| `apps/web/src/components/product/ProductSidebar.tsx` | **Refactor.** Remove the price + inquiry CTA (they moved to the picker bar). Repurpose as a slim wrapper that renders the new `<InfoCard>` stack. Keep `<ProductSidebar product>` as the API — internals change. |
| `apps/web/src/components/product/SpecsAccordion.tsx` | Updated to show the **selected variant's** dimensions (the picker drives "ابعاد" since size varies). Receives `selectedVariant?` prop; falls back to the product's `dimensions` field when no variant is selected (single-SKU products). |
| `docs/state.md` | Post-Phase row + `FU-PDV-*` follow-ups. |

### 3.3 Data flow

```
/products/[slug] request
  └── fetchProduct(slug)        ── depth=3; inflates gallery + variants → image → media
        │
        ▼
  <VariantSelectionProvider initialVariant={firstByDisplayOrder}>
        │
        ├── <HeroFrame> → <HeroImage variantImage={selected?.image}>
        │   └── cross-fades between product.gallery[0] and selectedVariant.image on selection change
        │
        ├── (main column — server-rendered, no variant dependency)
        │
        ├── <ProductSidebar product>
        │   └── <InfoCard> stack (طرح, lead time, warranty, materials)
        │
        ├── <SpecsAccordion specs={derivedFromSelectedVariant}>
        │   └── re-renders the "ابعاد" row when selection changes
        │
        └── <PickerBar variants={product.variants}>
            ├── reads allowed_axes from product.category to know which axes exist + their order
            ├── reads available values per axis from union of all variants
            ├── computes current price = product.basePriceRials + selected.priceDeltaRials
            ├── on chip click: setSelectedAxis(key, value)
            └── on CTA click: emits inquiry with {productId, variantId, axes}
```

State lives in `<VariantSelectionProvider>`'s React Context. `<PickerBar>` is the only writer; `<HeroImage>` and `<SpecsAccordion>` are readers.

### 3.4 Resolving `selectedAxes → variantId`

Given the user's current selection (e.g., `{size: '140', footboard: 'low'}`), find the matching variant:

```ts
function resolveVariant(variants: PayloadProductVariant[], axes: Record<string, string>): PayloadProductVariant | null {
  return variants.find(v => {
    if (v.axes.length !== Object.keys(axes).length) return false;
    return v.axes.every(a => axes[a.key] === a.value);
  }) ?? null;
}
```

If no variant matches the current selection (operator misconfiguration), the picker shows the user's selection but the price/SKU fall back to the product base values. Log a warning via `console.warn` for the operator to see in production.

### 3.5 Determining available axes + values

The picker doesn't hardcode axes. It derives them from the data:

```ts
function buildPicker(variants: PayloadProductVariant[], allowedAxes: string[]) {
  // allowedAxes comes from product.category.allowed_axes (sub-project D field).
  // It defines axis order and which axes are valid.
  return allowedAxes.map(key => ({
    key,
    label: AXIS_LABEL[key],           // 'size' → 'سایز', 'footboard' → 'پاتختی', ...
    values: distinct(variants.flatMap(v => v.axes.filter(a => a.key === key).map(a => a.value))),
  }));
}
```

If `allowedAxes` is empty for the category (which would be unusual — most leaves declare at least one axis), the picker renders nothing and the product behaves as single-SKU (price + CTA still in the bar, no axes).

`AXIS_LABEL` is a small constant in `PickerBar.tsx`:

```ts
const AXIS_LABEL: Record<string, string> = {
  size: 'سایز',
  footboard: 'پاتختی',
  doors: 'درب‌ها',
  drawers: 'کشوها',
  glass: 'شیشه',
  width: 'عرض',
  pieces: 'تعداد قطعه',
}
```

Any axis key not in the map renders its raw key as a fallback label.

### 3.6 Per-axis value labels

Some axes have values that benefit from human-readable labels (e.g., `footboard: 'high'` → `بلند`). Two strategies:

- **Map known string values to labels** (preferred for v1) — small `VALUE_LABEL` constant keyed by `axisKey:value`:
  ```ts
  const VALUE_LABEL: Record<string, string> = {
    'footboard:high': 'بلند',
    'footboard:low': 'کوتاه',
    'glass:true': 'شیشه‌دار',
    'glass:false': 'بدون شیشه',
  }
  ```
- **Numeric axes** (size, doors, drawers, width, pieces) render the raw value with `toPersianDigits` from `@zhic/locale`.

`VALUE_LABEL` is exported from `PickerBar.tsx` so future axis additions can extend it from a single place. Sub-project B's xlsx import is responsible for keeping the operator-entered values aligned with this map.

---

## 4. Page composition

### 4.1 Updated `apps/web/src/app/(site)/products/[slug]/page.tsx` skeleton

```tsx
import { notFound } from 'next/navigation';
import { Container, Breadcrumbs } from '@zhic/ui';
import { StickyBreadcrumb } from '@/components/layout/StickyBreadcrumb';
import { CinematicHero } from '@/components/hero/CinematicHero';
import { HeroImage } from '@/components/product/HeroImage';
import { ProductSidebar } from '@/components/product/ProductSidebar';
import { SpecsAccordion } from '@/components/product/SpecsAccordion';
import { PickerBar } from '@/components/product/PickerBar';
import { VariantSelectionProvider } from '@/components/product/VariantSelectionContext';
import { RichText } from '@/lib/richtext';
import { fetchProduct, productPath } from '@/lib/payload';
import { buildMetadata } from '@/lib/seo';
// related + tile imports unchanged

export default async function ProductPage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const product = await fetchProduct(slug);  // depth=3 inflates variants
  if (!product) notFound();

  const variants = product.variants ?? [];
  const allowedAxes = product.category?.allowed_axes ?? [];
  const firstVariant = variants.length
    ? [...variants].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))[0]
    : null;

  return (
    <VariantSelectionProvider variants={variants} initialVariant={firstVariant}>
      <StickyBreadcrumb items={crumbs} />

      <CinematicHero
        image={<HeroImage product={product} />}
      />

      <Container>
        <div className="grid grid-cols-1 gap-[var(--space-8)] pb-9 lg:grid-cols-[1fr_320px]">
          <div>
            {/* gallery thumbs / title / tagline / copy unchanged */}
            <SpecsAccordion product={product} />
          </div>
          <aside>
            <ProductSidebar product={product} />
          </aside>
        </div>

        {/* related products row unchanged */}
      </Container>

      <PickerBar
        product={product}
        variants={variants}
        allowedAxes={allowedAxes}
      />
    </VariantSelectionProvider>
  );
}
```

### 4.2 generateMetadata — unchanged from current

`canonical: /products/<slug>`. No variant in URL — same canonical regardless of any picker state at SSR time.

OG image uses `product.gallery?.[0]?.url` even if variants have their own images; SEO crawlers see the product hero, not a specific variant.

### 4.3 JSON-LD

Existing `Product` schema unchanged. Once `productVariants` exists, the JSON-LD's `offers` should optionally become an `AggregateOffer` with a `priceCurrency` + `lowPrice` + `highPrice` computed across variants. Package 1 ships single `Offer` with the product's `basePriceRials`; `AggregateOffer` migration is `FU-PDV-c`.

---

## 5. Component contracts

### 5.1 `<PickerBar>`

```ts
type PickerBarProps = {
  product: PayloadProduct;
  variants: PayloadProductVariant[];
  allowedAxes: string[];
};
```

Client component (`'use client'`). Reads selection state from `<VariantSelectionProvider>` via `useVariantSelection()`. Owns:

- The sticky-bar wrapper (`position: fixed; inset-block-end: 16px; inset-inline: 16px`).
- The `.in` class toggle for the slide-up reveal animation. Triggered via `requestAnimationFrame` in a `useEffect(() => {}, [])`.
- The chip-strip rendering — one strip per entry in `allowedAxes`.
- The price computation — `product.basePriceRials + (selectedVariant?.priceDeltaRials ?? 0)`. Formatted via `formatToman` from `@zhic/money`.
- The price cross-fade — adds `.flip` to the price `<span>` on selection change, swaps text content at the 180ms mark, removes `.flip`.
- The inquiry CTA `<button>` — calls a handler that submits `{productId, variantId, axes}` to the existing inquiry flow.

The bar is **always rendered**, regardless of whether variants or axes exist. For single-SKU products (no variants, or category has no `allowed_axes`): the axes section is omitted entirely; the bar shows only price + CTA. The inquiry CTA is always reachable because the bar is always pinned at the bottom.

Out-of-stock chip (when a value-combination has no variant or its variant has `availability === 'discontinued'`): adds `.disabled` class + sets `aria-disabled="true"` + `pointer-events: none`.

ARIA:
- Wrapper: `role="region"` + `aria-label="انتخاب واریانت"`.
- Each axis label: `<div role="radiogroup" aria-labelledby="axis-{key}-label">`.
- Each chip: `<button role="radio" aria-checked={isActive} aria-label="{axisLabel}: {valueLabel}">`.
- Active chip is the single `aria-checked="true"` per radiogroup.
- Disabled chip: `aria-disabled="true"`.

### 5.2 `<HeroImage>`

```ts
type HeroImageProps = {
  product: PayloadProduct;
};
```

Client component. Reads `selectedVariant?.image` from context. Renders two stacked `<PayloadImage>`s:

- Layer 1 (bottom): `product.gallery?.[0]` — the canonical product hero.
- Layer 2 (top): `selectedVariant?.image` if present. Hidden via `opacity: 0` when no variant image; visible via `opacity: 1` when set.

On variant change: the top layer's opacity transitions over 600ms `cubic-bezier(0.22, 1, 0.36, 1)`. Both layers stay mounted; the top layer's `src` swaps when the variant image changes (preloaded via `<link rel="preload" as="image">` injected on chip hover for desktop, immediately on tap for mobile).

If `selectedVariant.image === null`, top layer fades to opacity 0 over 600ms — exposing the product hero underneath.

ARIA: layer 1 carries the `alt`; layer 2 is `aria-hidden="true"` and presentational (the alt is on the underlying product image).

### 5.3 `<VariantSelectionProvider>` + `useVariantSelection()`

```ts
// VariantSelectionContext.tsx
'use client';

import { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import type { PayloadProductVariant } from '@/lib/payload';

type SelectedAxes = Record<string, string>;

type Ctx = {
  variants: PayloadProductVariant[];
  selectedAxes: SelectedAxes;
  selectedVariant: PayloadProductVariant | null;
  selectAxis: (key: string, value: string) => void;
};

const Context = createContext<Ctx | null>(null);

export function VariantSelectionProvider({
  variants,
  initialVariant,
  children,
}: {
  variants: PayloadProductVariant[];
  initialVariant: PayloadProductVariant | null;
  children: ReactNode;
}) {
  const [selectedAxes, setSelectedAxes] = useState<SelectedAxes>(() => {
    if (!initialVariant) return {};
    return Object.fromEntries(initialVariant.axes.map(a => [a.key, a.value]));
  });

  const selectedVariant = useMemo(
    () => resolveVariant(variants, selectedAxes),
    [variants, selectedAxes]
  );

  const selectAxis = (key: string, value: string) =>
    setSelectedAxes(prev => ({ ...prev, [key]: value }));

  return (
    <Context.Provider value={{ variants, selectedAxes, selectedVariant, selectAxis }}>
      {children}
    </Context.Provider>
  );
}

export function useVariantSelection() {
  const v = useContext(Context);
  if (!v) throw new Error('useVariantSelection must be used inside VariantSelectionProvider');
  return v;
}
```

State is REACT-only (no URL params). Provider serializes initial axes from the auto-selected first variant.

### 5.4 `<InfoCard>`

```ts
type InfoCardProps = {
  label: string;
  children: React.ReactNode;          // value content (text or richer)
  variant?: 'default' | 'forest';
};
```

Server component. Renders the canonical `.glass-card` recipe with an uppercase tracked label + value. Forest variant tints the border + label color toward forest.

Used 4× in the sidebar:
1. Forest variant → طرح callout (links to `/designs/<slug>` if `product.design` exists).
2. Default → زمان تحویل («۵۶ روز کاری»).
3. Default → گارانتی (`product.warrantyYears` from spec §12; default 5).
4. Default → روکش‌ها (joined `product.materialIds[].name`).

### 5.5 `<SpecsAccordion>` (refactor)

Existing component receives `product`; new behavior: also reads `selectedVariant` from context (it's inside the provider). The "ابعاد" row's content becomes a function of the selected variant's `size` axis value (or whatever maps to dimensions). When no variant or no size axis: falls back to `product.dimensions` (the existing field).

Concretely: when `size = '120'`, the dimensions line says `<span dir="ltr">120 × 200 × 90 cm</span> (اندازه‌ی انتخاب‌شده)`. When `size = '180'`, it says `<span dir="ltr">180 × 200 × 90 cm</span> (اندازه‌ی انتخاب‌شده)`. The non-size dimensions (200, 90) come from `product.dimensions`; only the width swaps.

For other axes (footboard, doors, etc.): no spec row changes — those don't affect dimensions.

---

## 6. SEO

### 6.1 URL canonicalization

- `/products/[slug]` is canonical. No variant query params are ever generated by internal links.
- The picker's state changes are CLIENT-ONLY — no `router.push`, no URL change, no history push. The page address stays identical regardless of variant.
- If a future feature wants shareable variant URLs (e.g., `?v=GAN-BED-180-H`), that's a follow-up (`FU-PDV-e`) that would set `canonical` back to the base URL for SEO.

### 6.2 OG image

`og:image = product.gallery[0].url` — the product hero, NOT the selected variant's image. Crawlers see a consistent hero across all variants.

### 6.3 Robots / sitemap

Unchanged from current PDP. Variant rows don't get their own sitemap entries.

### 6.4 Structured data

Existing `Product` JSON-LD unchanged in v1. `AggregateOffer` migration when variants ship at scale (`FU-PDV-c`).

---

## 7. Animation choreography (detailed)

### 7.1 Page-load timing

```
0ms     → Hero image loads (eager, fetchPriority="high")
0ms     → BlurInText begins on meta line   (delay 0, stagger 90/word)
90ms    → BlurInText begins on h1 title    (delay 90, stagger 90/word)
220ms   → BlurInText begins on tagline     (delay 220, stagger 90/word)
360ms   → FadeUp on copy paragraphs        (delay 360, in single block)
480ms   → FadeUp on specs section          (delay 480, in single block)
on `window.load` event:
  → PickerBar adds `.in` class via requestAnimationFrame
  → Slide-up: transform translateY(120% → 0) over 350ms cubic-bezier(0.16, 1, 0.3, 1)
```

### 7.2 Interaction timing

```
chip click event
├── 0ms     → setSelectedAxis(key, value)
├── 0ms     → chip's CSS class swap to .active (instant)
├── 0ms     → price-num gets .flip class (opacity 1 → 0 over 200ms)
├── 180ms   → price-num text content updated; .flip class removed (opacity 0 → 1 over 200ms)
├── 0ms     → selected variant's image preload (<link rel="preload" as="image">)
├── 0ms     → hero-img.opacity = 0 (cross-fade start)
├── 280ms   → hero-img src swap to variant's image
└── 880ms   → hero-img.opacity = 1 (cross-fade complete, 600ms over)
```

If chip = same as current: no-op.

### 7.3 Reduced-motion override

`@media (prefers-reduced-motion: reduce)`:

- All `.fadeup` elements: instant visible.
- All `<BlurInText>` instances: instant visible.
- Picker bar: visible from first paint (no slide-up).
- Price cross-fade: instant swap.
- Hero cross-fade: instant swap.

---

## 8. Mobile layout (< 768px)

### 8.1 Picker bar at 375px viewport

```
┌─────────────────────────────────────┐
│ سایز                                  │
│ [۱۲۰][۱۴۰][۱۶۰][۱۸۰]                  │
│                                       │
│ پاتختی                                │
│ [بلند][کوتاه]                          │
│ ─────────                              │
│  ۲۸٫۵۰۰٫۰۰۰ تومان    [استعلام قیمت]  │
└─────────────────────────────────────┘
```

Stacks vertically (axes block above price+CTA row). 1px sand-50% separator between the axes block and the price/CTA block. Wraps to 2 lines per axis if the chip set is wide (3+ values). The bar still hugs the bottom 12px of the viewport.

### 8.2 Hero on mobile

Aspect ratio `4/5` (the bottom edge is well above the picker bar, so the bar doesn't overlap visible content even when the user is at the top of the page).

### 8.3 Sidebar

The 320px sidebar drops below the main column on `< 1024px` (existing behavior, unchanged). The four `<InfoCard>` panels stack vertically. Each still uses the glasscard recipe.

---

## 9. Empty states + edge cases

| Case | Behavior |
|---|---|
| Product has 0 variants | Picker bar renders WITHOUT axes — just `product.basePriceRials` + CTA. Bar is always present so inquiry CTA is always reachable. |
| Selected axis combination has no matching variant | Price falls back to `product.basePriceRials`; SKU is `product.sku` (the canonical product SKU). `console.warn` logged. UI doesn't break. |
| `variant.image` is null on the selected variant | Hero image cross-fades to the product cover (`product.gallery[0]`). |
| All variants are `discontinued` | Every chip is `.disabled`. CTA stays enabled; inquiry says "all variants discontinued" via the existing inquiry-form copy. (Operator decides per inquiry whether to respond.) |
| `product.category.allowed_axes` is empty | Picker renders without axis labels — just price + CTA. (Effectively single-SKU mode.) |
| `product.category` is null (un-categorized product — shouldn't happen) | Same as empty `allowed_axes`. Picker renders price + CTA only. |
| Variant has axes that include a key NOT in `allowed_axes` | The unexpected key is hidden from the picker (renders only `allowed_axes` keys). The variant is still reachable via the keys that ARE in `allowed_axes`. |
| All variants share the same value on an axis | The axis still renders, but its single chip is active and the other "chips" don't exist (1-chip strip — visual edge case, fine). |
| Two variants have identical `axes` (data error) | `resolveVariant` returns the first match (`Array.find`). Operator-fixable; log warning. |
| Product `basePriceRials` is 0 | Price shows «استعلام» instead of a number. CTA still works. (Display logic in `@zhic/money`.) |

---

## 10. Tests

### 10.1 Unit (Vitest)

`apps/web/src/lib/__tests__/variant-resolution.test.ts` (new):

- `resolveVariant({size:'120',footboard:'high'})` → matching variant.
- `resolveVariant({size:'999'})` → null.
- `resolveVariant` with empty axes → null.
- Determinism: returns first variant when multiple match (data-error case).

`apps/web/src/components/product/__tests__/PickerBar.test.tsx` (new):

- Renders one strip per `allowedAxes` entry.
- Renders 0 strips when `allowedAxes` is empty (price + CTA only).
- Active chip has `aria-checked="true"`.
- Out-of-stock chip has `aria-disabled="true"` + pointer-events none in computed style.
- Clicking a chip calls `selectAxis(key, value)`.

`apps/web/src/components/product/__tests__/useVariantSelection.test.ts` (new):

- Initial state: provider seeds from `initialVariant.axes`.
- `selectAxis('size', '160')` updates state.
- `selectedVariant` re-computes via `resolveVariant`.

### 10.2 Integration

`apps/web/src/app/(site)/products/[slug]/__tests__/page.test.tsx`:

- Page renders 200 with seeded `gandom-bed` product.
- 8 variants are reachable via the picker (2 size chips × 2 footboard chips = 4 combinations seeded in the demo; 8 total per spec §2.4).
- Selecting the second size chip changes the price in the bar.
- Inquiry form submission carries `variantId` in the POST body.

### 10.3 Manual

- Open `/products/gandom-bed` on desktop. Verify hero, content, sidebar (4 info cards), picker bar at bottom.
- Tap each chip; verify price changes, hero cross-fades, no URL change.
- Resize to 375px width; verify bar stacks; chips still tappable.
- Enable reduced-motion in DevTools; verify all transitions are instant.
- Submit inquiry; verify operator receives `variantId` + axes in the message.

### 10.4 Smoke (curl)

```bash
curl -s -o /dev/null -w "/products/gandom-bed → %{http_code}\n" http://localhost:3000/products/gandom-bed
curl -s -o /dev/null -w "/products/nonexistent → %{http_code}\n" http://localhost:3000/products/nonexistent
curl -s http://localhost:3000/products/gandom-bed | grep -c '<button[^>]*role="radio"'   # expect ≥6 (4 size + 2 footboard chips)
```

---

## 11. Acceptance criteria

The PR is done when **all** of these are true:

1. New collection `productVariants` exists in Payload, editable in the admin panel, with all fields from §2.1.
2. Migration applies cleanly; `products`, `productVariants`, and `productVariants_axes` tables exist with correct shape.
3. Seed populates `gandom-bed` (or canonical demo product) with 8 demo variants per §2.4.
4. `/products/gandom-bed` returns 200; picker bar visible at the bottom of the page.
5. Picker bar uses the canonical glasscard recipe (visually unified with header chrome, /designs v14 pedestal, /categories info cards).
6. Auto-picks the first variant by `displayOrder` on page load. Active chip is the lowest-displayOrder variant's axes.
7. Clicking any chip:
   - Updates `aria-checked` on chips within the same axis (radio behavior).
   - Cross-fades the price digit display over 200ms.
   - Cross-fades the hero image over 600ms when the new variant's `image` differs from the current.
   - Updates the spec accordion's "ابعاد" row when the size axis changes.
   - Does NOT change the URL.
8. The CTA «استعلام قیمت» is always enabled; submitting attaches `{productId, variantId, axes}` to the inquiry payload.
9. Out-of-stock variants (availability = 'discontinued') render as `.disabled` chips with no pointer events and `aria-disabled="true"`.
10. On mobile (< 768px): picker stacks vertically; hero is 4:5; sidebar drops below main; all interactions still work.
11. `prefers-reduced-motion: reduce`: all transitions short-circuit to instant.
12. Single-SKU products (no variants) render the picker bar with NO axes — just price + CTA.
13. Sidebar info cards visually match the canonical `.glass-card` recipe. Price + CTA are NOT in the sidebar.
14. JSON-LD `Product` schema continues to emit per the existing PDP. Canonical URL unchanged.
15. Typecheck, lint, build all clean.
16. `docs/state.md` updated; `FU-PDV-*` follow-ups logged.

---

## 12. Open decisions to confirm before implementation

1. **`variantIds` via Payload 3 `type: 'join'` vs `beforeRead` hook** — depends on installed Payload version. Implementation plan resolves.
2. **`@zhic/money` formatting on the cross-fade** — does `formatToman(value)` return a string we can swap atomically, or does it return a React node? Implementation plan checks the existing helper signature.
3. **Inquiry payload schema change** — adding `variantId` + `axes` to the inquiry-form's POST body. The existing `<Inquiries>` Payload collection (sub-project from Package 1 sessions earlier) may need 2 new optional fields: `variantId: relationship` and `selectedAxes: json/text`. Verify the collection's current shape.
4. **`HeroImage` preload strategy** — on hover (desktop) vs immediately on tap (mobile). Pick the simpler one for v1; FU otherwise.
5. **Whether to seed `image` for any of the 8 demo variants** — for the mockup demo. Operator picks 1 size (likely 160) to get a unique photo. Trivial for the seed.

---

## 13. Follow-ups (out of scope, captured for `state.md`)

| Id | Item |
|---|---|
| `FU-PDV-a` | Aggregate variants into a single `<Product>`-level `lowPrice` + `highPrice` in JSON-LD as `AggregateOffer`. |
| `FU-PDV-b` | Add a `<details>` section in the sidebar listing all variants for the operator (admin-only / `?debug=1` flag). |
| `FU-PDV-c` | Variant inventory sync — `availability` real-time from MES when Package 4 ships. |
| `FU-PDV-d` | Per-variant 3D model variant via `gltfVariantName` + the existing 3D viewer (`model3d` group on Products). |
| `FU-PDV-e` | Shareable variant URLs (`?v=<sku>`) for direct deep-links from emails/SMS, with proper canonical redirect to base. |
| `FU-PDV-f` | Variant matrix admin UI — auto-generate the Cartesian product of axes × values in the Payload admin to seed all variant rows. Useful for operators creating new products from scratch. |
| `FU-PDV-g` | Visual variant chip "color swatch" rendering — for finish-type axes (گردو/راش), show a small color square instead of just the value label. |
| `FU-PDV-h` | Animated number counter for the price change (instead of cross-fade). Skipped in v1 per "luxury restraint" memo. |
| `FU-PDV-i` | Per-axis disabled-combination logic — if user picks `size=180`, gray out incompatible `footboard` values (when no `180-low` variant exists). Currently we just resolve and fall back to base; this would be progressive disclosure. |
| `FU-PDV-j` | Mobile sticky-bar collapse — if axes wrap to 3+ lines, auto-collapse to a compact handle that taps to expand the full bar. Currently bar just grows taller. |

---

## 14. References

- **Visual mockup (source of truth):** `apps/web/public/docs/pdp-variant-picker-mockup.html` served at `/docs/pdp-variant-picker-mockup.html`.
- **Current PDP:** `apps/web/src/app/(site)/products/[slug]/page.tsx`.
- **Categories spec (where allowed_axes was added):** `docs/superpowers/specs/2026-05-21-categories-hub-pages-design.md`.
- **Categories plan (precedent for the brainstorm + implementation workflow):** `docs/superpowers/plans/2026-05-21-categories-hub-pages.md`.
- **Canonical glass-card recipe:** `packages/design-system/css/base.css` `.glass-card`, `.site-header-chrome`.
- **Canonical glass tokens:** `packages/design-system/css/tokens.css` `--glass-bg`, `--glass-blur`, `--glass-border`, `--shadow-subtle`, `--shadow-card`.
- **Variant schema reference (original):** `docs/spec/data-schemas.md` §13 — note: modified here to use flexible `axes` JSON instead of hardcoded `size`/`finish`/`fabric` fields.
- **Existing inquiry collection:** `services/api/src/collections/Inquiries.ts` — may need 2 new fields per §12.3.
- **Existing pattern for paired client components + Context:** `apps/web/src/components/category/category-filter-state.tsx` (the /categories mobile filter sheet uses this exact pattern).
- **Animation curves used:** `cubic-bezier(0.22, 1, 0.36, 1)` (out-soft, primary), `cubic-bezier(0.16, 1, 0.3, 1)` (out-quint, slide-ups).
- **Operator memory:** `feedback_zhic_luxury_restraint` — accent is earned; `feedback_zhic_seo_priority` — never per-variant URLs; `project_zhic_products_overhaul` — locked decisions on variants axes JSON + Categories-as-piece-types.
