# Data Schemas

> **Draft status.** This document is a **working draft, to be replaced
> by the Package 1 schema sketch grounded in real legacy data** (R6
> deliverable #2). It should not be treated as authoritative until the
> accountant schema-walk has happened and the Commerce Pricing
> Checkpoint has passed. Sections marked **⏳ pending Discovery lock**
> are especially likely to change — they contain reasonable defaults
> that Discovery and the accountant schema-walk will validate or
> replace.

The complete data model for the Zhic platform. These schemas describe
**every collection in every Postgres schema** that the platform writes
to, across `services/api` (Payload) and, from Package 4, `services/factory-api`
(Drizzle).

This document is **CMS-agnostic in spirit** but written in a Payload-
flavored shape because Payload is the planned implementation for
Packages 1–2 (see `roadmap.md`). Field types map cleanly to most
headless CMSes.

If a field is not in this document, it does not exist anywhere else in
the codebase. Schemas are the source of truth; types, API client,
forms, and reports all derive from them. See `architecture.md` §6.

---

## 0. Conventions

- `id`, `createdAt`, `updatedAt` are auto on every collection. Not
  listed below.
- `deletedAt` is auto on every collection that supports soft delete
  (almost all of them — see §0.4).
- All collections that produce a public URL have an `seo` group (see
  "Shared groups" at the end).
- All slugs validate as **lowercase, hyphenated, ASCII** even on
  Persian-content collections. The Persian title lives in `title`
  / `name`. Renaming a slug triggers an automatic entry in the
  `redirects` collection.
- All localized fields are marked **(L)** for forward compatibility.
  No second locale ships in v1; Persian is the only stored value.
- All publishable collections (`products`, `articles`, `pages`,
  `showrooms`, `events`, `journalCategories`, `collections`) have
  `status: draft | scheduled | published`, `publishedAt`, and
  `version` fields.

### 0.1 Postgres schema layout

The platform runs **one Postgres instance, multiple schemas**. See
`architecture.md` §6 for the rationale and writer rules.

| Schema | Owner service | Collections (see sections below) |
| --- | --- | --- |
| `public` | `services/api` | `users`, `auditLog`, `siteSettings`, `redirects`, `media` |
| `commerce` | `services/api` | `customers`, `addresses`, `products`, `productVariants`, `collections`, `categories`, `tags`, `materials`, `carts`, `orders`, `orderLineItems`, `payments`, `invoices`, `stockLocations`, `stockLevels`, `stockTransfers`, `stockTransferLines`, `deliveries`, `returns`, `priceHistory`, `reviews`, `promotions`, `showrooms` |
| `crm` | `services/api` (Package 3) | `leads`, `appointments`, `followUps`, `notes`, `pipelineStages` |
| `erp` | `services/api` (Package 3+, possibly carved out) | `suppliers`, `purchaseOrders`, `purchaseOrderLines`, `goodsReceiptNotes`, `chartOfAccounts`, `journalEntries`, `journalEntryLines`, `staff`, `payrollExports` |
| `mes` | `services/factory-api` (Package 4) | `workOrders`, `boms`, `bomLines`, `routings`, `productionSchedule`, `qcGates`, `productionEvents` |
| `content` | `services/api` | `pages`, `articles`, `journalCategories`, `authors`, `events`, `pressItems`, `testimonials`, `forms`, `formSubmissions`, `tradeApplications` |

Cross-schema foreign keys are allowed and used heavily. Example:
`crm.leads.customerId` references `commerce.customers.id`.

### 0.2 Money ⏳ pending Discovery lock

> Validated at the accountant schema-walk (R6 deliverable #3). Do not
> freeze in the commerce codebase until the schema-walk confirms.

- **All money is stored as integer rials.** Field type is `bigint`,
  unit is the rial minor unit (which for Iran is just the rial — there
  is no sub-rial unit in modern usage).
- **All money is displayed as toman** (rial ÷ 10) via
  `packages/money`.
- Money fields are named with the suffix `Rials`:
  `subtotalRials`, `totalRials`, `unitPriceRials`, `discountRials`.
  This makes the unit explicit at the type level and prevents the
  classic "I forgot whether this was rial or toman" bug.
- No money field is ever a `decimal`, `numeric`, or `float`. Integer
  rials only.

### 0.3 Identity

- **Customers are keyed by phone number** (E.164, normalized). Phone
  is the natural unique ID in Iran. National ID is captured but
  optional unless a tax-compliant invoice is requested.
- **Staff are keyed by email** (admin bootstrap) and may also have a
  phone number for OTP login.
- See §`users` (public schema) and §`customers` (commerce schema)
  for the split.

### 0.4 Soft delete

- `deletedAt nullable` on every collection except append-only ones
  (`auditLog`, `priceHistory`, `productionEvents`).
- A nightly purge job hard-deletes rows where
  `deletedAt < now() - retention_window`. Retention defaults to 90
  days; shorter for `formSubmissions` and `cart`, longer for
  `orders` (immutable for legal reasons — see §`orders`).

### 0.5 Audit & immutability

- `auditLog` records every write to a write-controlled collection.
- `priceHistory` is append-only. No updates, no deletes.
- `invoices` are immutable once issued. Corrections create adjustment
  invoices, never edits.
- `stockTransfers` cannot be edited after `confirmed`; they are
  reversed by issuing a counter-transfer.

---

# Schema: `public`

Cross-cutting collections.

## §1 `users`

The single user table for the entire platform. **One row per
human**, regardless of whether they are staff or customer. Roles are
enum-valued.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `email` | text | no (unique if set) | Required for staff bootstrap; customers may not have one |
| `phone` | text (E.164) | yes (unique) | Primary identifier |
| `name` | text | yes | Display name |
| `role` | enum | yes | See enum below |
| `isStaff` | boolean | yes | Computed: `role != 'customer'` |
| `passwordHash` | text | no | Bootstrap admin only; OTP is the primary flow |
| `twoFactorEnabled` | boolean | no | Required for `admin`, `editor` |
| `lastLoginAt` | datetime | auto | |
| `nationalId` | text | no | کد ملی, validated by checksum |
| `avatarMediaId` | relation → `media` | no | |

`role` enum:

```
admin              founder, lead engineer
editor             content editor (article publish authority)
marketing          drafts, no publish authority
sales              HQ sales staff
showroom_manager   per-showroom manager
showroom_staff     showroom floor staff
accountant         finance
factory_supervisor MES — Package 4
factory_worker     MES — Package 4
customer           public storefront customer
```

The `customer` role is the default for anyone signing up via
`/login` on the storefront. Staff users are created from the admin.
A user may carry exactly one role at a time; cross-role users go
through `admin`.

Indexes: `phone` unique, `email` unique (where not null),
`(role, isStaff)`.

## §2 `auditLog`

Append-only log of every meaningful write.

| Field | Type | Notes |
| --- | --- | --- |
| `actorUserId` | relation → `users` | Nullable for system actions |
| `action` | enum | See list below |
| `schemaName` | text | e.g. `commerce` |
| `collectionName` | text | e.g. `orders` |
| `documentId` | text | The affected row's id |
| `before` | jsonb | Snapshot before write |
| `after` | jsonb | Snapshot after write |
| `at` | datetime | |
| `ip` | text | |
| `userAgent` | text | |

`action` enum: `create`, `update`, `delete`, `restore`, `publish`,
`unpublish`, `price_change`, `slug_change`, `login`, `logout`,
`role_change`, `payment_capture`, `payment_refund`,
`invoice_issue`, `invoice_void`, `stock_adjust`, `transfer_confirm`,
`order_status_change`.

No update, no delete. Indexes on
`(schemaName, collectionName, documentId, at)` and `(actorUserId, at)`.

## §3 `siteSettings` (singleton)

Global config editable by admins.

| Field | Type | Notes |
| --- | --- | --- |
| `siteName` (L) | text | "ژیک" |
| `tagline` (L) | text | |
| `defaultOgImageMediaId` | relation → `media` | |
| `defaultMetaTitle` (L) | text | template, e.g. "%s — ژیک" |
| `defaultMetaDescription` (L) | textarea | |
| `social` | group | { instagram, telegram, eitaa, email } |
| `contact` | group | { phone, email, address } |
| `analytics` | group | { plausibleDomain, gscVerification, bingVerification } |
| `consentBanner` | group | { enabled, copy, links } |
| `headerAnnouncement` | group | { enabled, copy, link, startsAt, endsAt } |
| `primaryEditorId` | relation → `users` | default reviewer for editorial sign-off |
| `invoiceNumberFormat` | text | **Provided by client.** e.g. `HAM-{year}-{seq:0000}`. See `packages/invoices`. Empty until business confirms. |
| `factorLegalName` | text | Legal entity name printed on factors |
| `factorNationalId` | text | Seller national ID |
| `factorEconomicCode` | text | کد اقتصادی printed on factors |
| `factorBankAccount` | text | Optional bank info on printed factors |
| `factorVatRate` | number | Default VAT rate (percent), e.g. `9` |
| `defaultCurrency` | enum | Always `IRR` in v1; reserved for future |
| `defaultLocale` | enum | Always `fa-IR` in v1 |
| `paymentProvider` | enum | `zarinpal` / `idpay` / `zibal` — chosen Package 2 |
| `smsProvider` | enum | `smsir` / `kavenegar` / `mellipayamak` / `ghasedak` — first is `smsir` |
| `objectStorageBucket` | text | Abr Arvan S3-compatible bucket name |
| `featureFlags` | jsonb | Reserved for staged rollouts |

## §4 `redirects`

Auto-populated when slugs change. Manual entries allowed for
marketing short links.

| Field | Type | Required |
| --- | --- | --- |
| `from` | text | yes (unique) |
| `to` | text | yes |
| `type` | enum (`301`, `302`) | yes |
| `source` | enum (`auto`, `manual`) | yes |
| `note` | text | no |

Hooks: any slug change anywhere in the platform writes a `301` here
with `source: 'auto'`.

## §5 `media`

Central asset library. Stills, GIFs, video, 3D, and PDFs all live
here, discriminated by `kind`. Stored in S3-compatible object
storage (Abr Arvan Object Storage, S3-compatible — see `README.md`
stack decisions).

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `file` | upload | yes | image, gif, video, glb/gltf, usdz, pdf |
| `kind` | enum | auto | `image`, `gif`, `video`, `model_gltf`, `model_usdz`, `pdf` |
| `alt` (L) | text | yes for image/gif/model | Persian by default |
| `caption` (L) | text | no | |
| `credit` | text | no | photographer / source |
| `focalPoint` | group { x, y } | no | art-directed crops, images only |
| `tags` | text[] | no | |
| `width` / `height` | number | auto | image / video / gif |
| `durationMs` | number | auto | gif / video |
| `mime` | text | auto | |
| `bytes` | number | auto | enforced max per kind |
| `dominantColor` | text | auto | for blur placeholders |
| `polycount` | number | auto | 3D models only — read from glTF |
| `materialVariants` | text[] | auto | 3D models — `KHR_materials_variants` list |
| `hasDraco` | boolean | auto | 3D models |
| `hasKtx2` | boolean | auto | 3D models |
| `validationWarnings` | text[] | auto | 3D models — non-blocking issues |
| `decorative` | boolean | no | when true, alt is not required |

Constraints (enforced at upload):

- **Image:** ≤ 4 MB, ≥ 1200px on long edge for hero/cover.
- **GIF / animated webp:** ≤ 3 MB, ≤ 8 s loop, ≤ 1200px long edge.
  Editors are warned that mp4/webm is preferred for anything > 1 s.
- **Video:** ≤ 8 MB, ≤ 12 s for hero scrub video.
- **glTF / GLB:** ≤ 2 MB warn / ≤ 4 MB hard limit. Auto-rejected
  if missing a `scene`, over 100k triangles, over 4 MB, or missing
  alt text. Warnings (no draco, no KTX2, > 80k triangles, > 2 MB)
  appear inline so the artist can fix and re-upload.
- **USDZ:** ≤ 8 MB.
- **PDF:** ≤ 10 MB.

---

# Schema: `commerce`

The heart of the platform. Catalog, customers, orders, payments,
factors, stock.

## §10 `customers`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `userId` | relation → `public.users` | yes (unique) | Every customer has a user row |
| `phone` | text (E.164) | yes (unique) | Mirrored from user for query speed |
| `name` | text | yes | |
| `nationalId` | text | no | Required at checkout if customer requests tax-compliant factor |
| `email` | email | no | Optional secondary contact |
| `birthDate` | date | no | |
| `originShowroomId` | relation → `showrooms` | no | Where they first walked in (or `null` if storefront) |
| `source` | enum | no | `storefront`, `showroom`, `instagram`, `telegram`, `referral`, `import`, `other` |
| `tags` | text[] | no | Free-form labels (vip, designer, recurring) |
| `marketingConsent` | boolean | no | Default false. SMS marketing requires explicit opt-in |
| `notesInternal` | richText | no | Staff notes; never shown to customer |
| `lifetimeValueRials` | bigint | auto | Computed from `orders` |
| `firstOrderAt` | datetime | auto | |
| `lastOrderAt` | datetime | auto | |

Indexes: `phone` unique, `nationalId` (where not null),
`(originShowroomId, lastOrderAt)`.

Hooks:

- On create: log to `auditLog` with `source` for attribution.
- On phone change: blocked. Phones are PKs; merging two customer
  records is an `admin`-only manual operation that consolidates
  orders, addresses, and audit history.

## §11 `addresses`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `customerId` | relation → `customers` | yes | |
| `label` | text | no | "خانه", "دفتر" |
| `recipientName` | text | yes | May differ from customer |
| `recipientPhone` | text (E.164) | yes | |
| `province` | text | yes | Iranian 31-province slug |
| `city` | text | yes | |
| `district` | text | no | محله |
| `street` | text | yes | Free-form Persian |
| `plaque` | text | yes | پلاک |
| `unit` | text | no | واحد |
| `postalCode` | text | yes | 10-digit, validated |
| `notes` | textarea | no | Delivery notes (intercom, landmark) |
| `isDefault` | boolean | no | One default per customer |

Indexes: `(customerId, isDefault)`.

## §12 `products`

The product catalog. One product is one model. Variants live in §13.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` (L) | text | yes | Persian name |
| `slug` | text | yes (unique) | ASCII |
| `tagline` (L) | text | no | One-line poetic descriptor (Persian) |
| `shortDescription` (L) | textarea | yes | ≤ 200 chars, used on cards |
| `longDescription` (L) | richText | yes | MDX-compatible blocks |
| `collectionId` | relation → `collections` | no | optional grouping |
| `materialIds` | relation[] → `materials` | yes | many-to-many |
| `categoryIds` | relation[] → `categories` | yes | |
| `tagIds` | relation[] → `tags` | no | |
| `basePriceRials` | bigint | yes | Integer rials |
| `salePriceRials` | bigint | no | Optional override |
| `sku` | text | yes (unique) | ASCII |
| `availability` | enum | yes | `in_stock`, `made_to_order`, `backorder`, `discontinued` |
| `leadTimeDays` | number | yes | default 56 |
| `dimensions` | group | yes | width, length, height (cm + auto-converted m) |
| `weightKg` | number | no | |
| `galleryMediaIds` | relation[] → `media` | yes | min 3 stills, ordered |
| `coverMediaId` | relation → `media` | yes | inherits from gallery[0] if unset |
| `collectionTileImage` | upload → `media` | no | Dedicated tile image for the «قطعات سرویس» seriesCollection module on `/bedroom-set/{occupancy}/{slug}`. Separate from `gallery` — NOT shown on the product page. Falls back to `gallery[0]` if empty. (migration `20260626_140000`) |
| `gifMediaIds` | relation[] → `media` | no | atelier loops, fabric drape |
| `videoMediaIds` | relation[] → `media` | no | mp4/webm only |
| `model3d` | group | no | WebXR / 3D viewer config — see §12.1 |
| `featured` | boolean | no | shows on homepage if true |
| `featuredOrder` | number | no | manual ordering |
| `relatedProductIds` | relation[] → `products` | no | manual cross-sell |
| `pairsWithProductIds` | relation[] → `products` | no | secondary cross-sell |
| `careInstructions` (L) | richText | no | |
| `warrantyYears` | number | no | default 5 |
| `seo` | group | yes | shared group |
| `status` | enum | yes | draft / scheduled / published |
| `publishedAt` | datetime | no | |

### §12.1 `model3d` (group, embedded)

Drives the WebXR / 3D viewer on the product detail page.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `gltfMediaId` | relation → `media` | yes (if 3D) | `.glb` preferred, draco-compressed, ≤ 2 MB |
| `usdzMediaId` | relation → `media` | no | iOS Quick Look fallback |
| `posterMediaId` | relation → `media` | yes | still shown before user clicks to load 3D |
| `alt` (L) | text | yes | a11y label (Persian) |
| `cameraOrbit` | text | no | initial camera, e.g. `0deg 75deg 105%` |
| `cameraTarget` | text | no | initial target |
| `exposure` | number | no | 0–2, default 1 |
| `shadowIntensity` | number | no | 0–1, default 0.5 |
| `arEnabled` | boolean | no | default true |
| `arPlacement` | enum | no | `floor` / `wall`; default `floor` |

### §12.2 Indexes

- `slug` unique, `sku` unique
- `(featured, featuredOrder)` for homepage queries
- `(status, publishedAt)` for sitemap
- `(availability)` for filtered grids

### §12.3 Hooks

- On `slug` change: insert into `redirects`.
- On `basePriceRials` / `salePriceRials` change: append to
  `priceHistory` and `auditLog`.
- On publish: revalidate `/products`, `/products/[slug]`, `/`,
  sitemap.

### §12.4 JSON-LD output

`Product` schema with `name`, `image`, `description`, `sku`, `brand:
"Zhic"`, `material`, and `offers` group.

**From Package 2 onward**, the `offers` group is a real `Offer` with
`priceCurrency: "IRR"`, `price: <basePriceRials>`, and an
`availability` field mapped from the `availability` enum:
`in_stock` → `https://schema.org/InStock`,
`made_to_order` → `https://schema.org/PreOrder`,
`backorder` → `https://schema.org/BackOrder`,
`discontinued` → `https://schema.org/Discontinued`.

In Package 1 (before checkout exists) the `offers` group emits
guidance pricing only and the `url` points to the inquiry CTA.

## §13 `productVariants`

Per-product SKU variants. Stored in their own table (not embedded)
because operator apps query them directly for stock and pricing.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `productId` | relation → `products` | yes | |
| `label` (L) | text | yes | "کینگ — کتان جو" |
| `sku` | text | yes (unique) | |
| `size` | enum | yes | `single`, `twin`, `double`, `queen`, `king`, `super_king` |
| `finish` | text | no | "گردو", "بلوط" |
| `fabric` | text | no | "کتان جو", "مخمل کتانی" |
| `priceDeltaRials` | bigint | no | Added to product `basePriceRials` |
| `availability` | enum | no | Overrides product availability if set |
| `imageMediaId` | relation → `media` | no | Optional variant photo |
| `gltfVariantName` | text | no | Maps to `KHR_materials_variants` in the parent's glTF |

Indexes: `(productId)`, `sku` unique.

## §14 `collections`, `categories`, `tags`, `materials`

Curation and taxonomy. Persian display names, ASCII slugs.

### `collections`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` (L) | text | yes | |
| `slug` | text | yes (unique) | |
| `description` (L) | richText | yes | |
| `coverMediaId` | relation → `media` | yes | |
| `productIds` | relation[] → `products` | yes | manual order |
| `featured` | boolean | no | shows in nav mega-menu |
| `seo` | group | yes | |
| `status` | enum | yes | |

### `categories`

Tree taxonomy of product type ("تخت", "مبلمان", "کاناپه").

| Field | Type | Required |
| --- | --- | --- |
| `name` (L) | text | yes |
| `slug` | text | yes (unique) |
| `description` (L) | textarea | no |
| `parentId` | relation → `categories` | no |
| `mosaicTileImage` | upload → media | no |
| `mosaicTilePosition` | select (`top`/`center`/`bottom`) | no |

`mosaicTileImage` is the dedicated image for this category's tile in the parent
hub `CategoryMosaic` (`/bedroom-furniture/<parent>`). Independent of `cover`;
when blank the tile falls back to `cover`, then the first product photo in the
subtree (`hubContentFromPayload` / `fetchChildTilePhotos`). `mosaicTilePosition`
sets the tile crop anchor (blank == center, `50% 50%`). Both added 2026-06-27
(migration `20260627_120000_add_mosaic_tile_to_categories`); mirror the
`collectionTileImage` pattern on `products`.

### `tags`

Flat taxonomy for filtering ("کتان", "گردو", "ذخیره‌سازی").

| Field | Type |
| --- | --- |
| `name` (L) | text |
| `slug` | text (unique) |

### `materials`

Reusable material descriptors.

| Field | Type | Notes |
| --- | --- | --- |
| `name` (L) | text | "کتان بلژیکی" |
| `slug` | text (unique) | |
| `description` (L) | richText | sourcing, feel, care |
| `imageMediaId` | relation → `media` | |
| `origin` | text | "بلژیک" |
| `careNotes` (L) | richText | |
| `relatedArticleIds` | relation[] → `content.articles` | |

### `designs` (§14)

Bedroom-set series. Drives the `/bedroom-set` carousel and the `/bedroom-set/<occupancy>` hubs, and supplies the **base content inherited** by the per-occupancy detail pages (now backed by the `series-occupancies` collection below — blank override fields fall back here).

| Field | Type | Notes |
| --- | --- | --- |
| `name` (L) | text (req) | نام طرح |
| `slug` | text (unique) | auto-slugified from name |
| `age_group` | select | infant / child / teen / adult (pending OD-3) |
| `occupancies` | select[] | baby / teen / double / bunk — which hub pages list the design |
| `description` (L) | richText | — |
| `tagline` | text | lead sentence under the design name |
| `hubIntro` | textarea | caption under the hub carousel room-type tabs |
| `heroMedia` | upload → media | detail-page hero (falls back to gallery[0]) |
| `sliderMedia` | upload → media | `/designs` slider card (GIF/video) |
| `logoMedia` | upload → media | bilingual name-mark for the hub glass band |
| `occupancyMedia` | array `{ occupancy(select), image(upload) }` | per-room-type card variants |
| `storyBlocks` | richText (+ blocks) | long-form story with embedded media blocks |
| `gallery` | upload[] → media | — |
| `featured` | checkbox | show on home |
| **`introTitle`** | text | detail-page intro card title |
| **`introBody`** | textarea | detail-page intro card body |
| **`introMedia`** | upload → media | detail-page intro card photo (card hidden if empty) |
| **`storyBody`** | textarea | detail-page story card paragraph (title is the constant «داستان طراحی») |
| **`storyMedia`** | upload → media | detail-page story card photo (card hidden if empty) |
| **`materialCallouts`** | array `{ image(upload,req), label(text,req), sub(text) }` | 3 circular material swatches |
| **`designDetails`** | array `{ image(upload,req), label(text,req), description(textarea), span(number,def 100) }` | 4 design-detail tiles (span = relative width) |

The **bold** fields back the detail page's intro / story / materials / design-details sections (added 2026-06-17). `(L)` = localized.

### `series-occupancies` (§14b)

One document per **(design × occupancy)** pair — the page at `/bedroom-set/<occupancy>/<design>` (e.g. `/bedroom-set/teen/iron`). The document **is** the page: blank override fields inherit from the parent `designs` row, so `teen/iron` and `double/iron` can differ in products + copy while sharing whatever isn't overridden. Added 2026-06-25.

| Field | Type | Notes |
| --- | --- | --- |
| `title` | text (computed, read-only) | «{design} — {occupancy}» admin list title |
| `design` | relation → designs (req) | which series; unique together with `occupancy` |
| `occupancy` | select (req) | baby / teen / double / bunk |
| `products` | relation[] → products (ordered) | the «قطعات سرویس» row — **fully manual curation** (no auto-by-tag) |
| `heroMedia` | upload → media | override; blank ⇒ design hero chain |
| `subtitle` | text | override; blank ⇒ design tagline |
| `introTitle` / `introBody` / `introMedia` | text / textarea / upload | intro card override; blank ⇒ design's |
| `storyBody` / `storyMedia` | textarea / upload | story card override; blank ⇒ design's |
| `materialCallouts` | array `{ image(req), label(req), sub }` | override; **blank ⇒ design's materials** |
| `designDetails` | array `{ image(req), label(req), description, span(def 100) }` | override; blank ⇒ design's |
| `siblings` | array `{ image(upload), kicker, name, link }` | editable sibling cards; blank ⇒ auto-generated from the design's other occupancies |
| `status` | select draft/published (editor-only publish) | only published docs are read by the storefront |
| `publishedAt` | date | — |
| `seo` | group | shared SEO fields |

**Inheritance:** blank string / empty array ⇒ inherit from `designs`; a non-empty value overrides. **SEO — auto-promote when differentiated:** a combo is self-canonical, indexable, and in the sitemap once it is published **and** has ≥1 curated product or any content override; otherwise `noindex`. Un-authored combos render the inherited design base (graceful fallback — nothing 404s) and upgrade automatically on publish. The bare `/bedroom-set/<design>` page is **removed** (301 → the design's first occupancy). Resolver: `getSeriesOccupancyContent` in `apps/web/src/lib/series-hub-content.ts`; migration `20260625_130000_create_series_occupancies`.

### `bedroom-set` (global) — «هاب سرویس خواب» page config

Editorial copy for the `/bedroom-set` landing + the per-occupancy hub pages (`/bedroom-set/<occupancy>`). Designs, logos, and the featured overlay come from Designs/Products; only this prose + the occupancy hub copy lives here.

| Field | Type | Notes |
| --- | --- | --- |
| `writingHeading` / `writingBody` | text / textarea | the «درباره‌ی این سرویس‌ها» writing section under the `/bedroom-set` carousel |
| `featuredBestsellersIntro` / `featuredNewestIntro` | textarea | intro under the featured-overlay grids (bestsellers / newest) |
| `heroTeenMedia` / `heroDoubleMedia` / `heroBabyMedia` / `heroBunkMedia` | upload → media | full-bleed hero per `/bedroom-set/<occupancy>` hub; empty → the featured design's cover (collapsible group → FK columns on `bedroom_set`). Added 2026-06-21. |

The four hero images feed `getOccupancyHubContent` (`apps/web/src/lib/occupancy-hub-content.ts`); empty → the featured design's cover. DB: scalar fields + the four `hero_*_media_id` FK cols on `bedroom_set` (migration `20260621_120000_add_bedroom_set_occupancy_heroes`). **Per-occupancy hub copy / SEO / tile control live in the `bedroom-set-hubs` collection (below), not here.**
### `bedroom-furniture` (global) — catalog-root page config

Curates the `/bedroom-furniture` root index. Showcase cards reference Categories (label + link come from the category); room cards are self-contained cross-links to `/bedroom-set` hubs. Added 2026-06-18.

| Field | Type | Notes |
| --- | --- | --- |
| `heroTitle` | textarea | hero headline (newline = line break); empty → default |
| `heroSubtitle` / `heroTagline` | text | hero sub + tagline |
| `heroCtaLabel` / `heroCtaHref` | text | hero CTA («مشاهده»); empty href → scrolls to the showcase |
| `heroMedia` | upload → media | hero photo |
| `showcaseHeading` | text | «دسته بندی محصولات» |
| `showcaseBody` | textarea | paragraph under the coverflow |
| `showcaseInitial` | number | which card centers first (0-based); empty → middle; out-of-range is clamped |
| `showcase` | array `{ category(rel→categories,req), archImage(upload,req) }` | coverflow cards; label + `/bedroom-furniture/<slug>` link from the category |
| `rooms` | array `{ name(req), display, image(upload,req), href(req) }` | room cards (link to `/bedroom-set/<occupancy>`); bg color is a component ramp |

Empty `showcase` → the page falls back to its static default. DB: a `bedroom_furniture` table (scalar + `hero_media_id` FK) plus `bedroom_furniture_showcase` (`category_id`+`arch_image_id` FK cols) and `bedroom_furniture_rooms` (`image_id` FK col) array tables — single relation/upload subfields become FK columns on the array table (mirrors `home_hero_slides`).

### `bedroom-set-hubs` (collection) — per-occupancy hub page editor

One document per age group (`occupancy` unique enum: baby/teen/double/bunk) backing the `/bedroom-set/{occupancy}` pages. Each maps 1:1 to the page's existing sections (`BedroomHero` / intro band / `CategoryMosaic` / SEO content / `MosaicStrip`); **every field is optional and falls back to the built-in copy in `occupancy-hub-content.ts`**, so a missing/empty doc never breaks the page. Added 2026-06-25. Tile imagery still comes from each design's `occupancyMedia`; this doc adds tile *control*.

| Field | Type | Notes |
| --- | --- | --- |
| `occupancy` | select (req, **unique**) | baby/teen/double/bunk — the doc's identity + route |
| `heroImage` | upload → media | hero photo; empty → legacy `bedroom-set` global hero → first photo tile |
| `heroTitle` / `heroTagline` | text / textarea | hero copy (`\n` = line break); empty → default |
| `heroCtaLabel` / `heroCtaHref` | text | hero CTA («مشاهده» / `#hub-designs`) |
| `introHeading` / `introBody` | text / textarea | **new** intro band under the hero (both empty → hidden) |
| `designsHeading` | text | tiles section heading («طرح‌ها») |
| `featuredDesign` | rel → designs | pulled to the front of the tile order |
| `tileOrder` | rel → designs (hasMany) | explicit order; unlisted designs follow in default order |
| `hiddenDesigns` | rel → designs (hasMany) | excluded from this hub |
| `contentBody` | richText | **new** long-form SEO block below the tiles (empty → hidden) |
| `crossLinksHeading` | text | «گروه‌های دیگر» heading; links auto-derive from the other ages |
| `seoTitle` / `seoDescription` | text / textarea | **new** page `<title>` / meta description |
| `seoImage` | upload → media | **new** OG image |

DB: `bedroom_set_hubs` table (scalars + `hero_image_id`/`featured_design_id`/`seo_image_id` FK cols + `content_body` jsonb + unique `occupancy` enum) plus `bedroom_set_hubs_rels` for the hasMany `tileOrder`/`hiddenDesigns` (distinguished by `path`, mirrors `journal_rels`). Seeded with the 4 docs via `scripts/seed-bedroom-set-hubs.py`.

## §15 `carts`

Live shopping carts. One cart per session; merges with the customer
cart on login.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `sessionToken` | text | yes (unique) | Anonymous cart identifier |
| `customerId` | relation → `customers` | no | Set on login |
| `lineItems` | array (embedded) | no | See §15.1 |
| `subtotalRials` | bigint | auto | Sum of line items |
| `discountRials` | bigint | auto | Promotion-derived |
| `totalRials` | bigint | auto | Subtotal − discount |
| `appliedPromotionId` | relation → `promotions` | no | |
| `expiresAt` | datetime | auto | 14 days from last update |

### §15.1 Cart line items (embedded)

| Field | Type | Notes |
| --- | --- | --- |
| `productId` | relation → `products` | |
| `productVariantId` | relation → `productVariants` | |
| `qty` | number | |
| `unitPriceRials` | bigint | Snapshot at add time |
| `lineTotalRials` | bigint | Computed |
| `addedAt` | datetime | |

Carts are purged 30 days after `expiresAt`.

## §16 `orders`

The legal record of a sale. **Immutable in spirit** — status moves
forward, money fields cannot retroactively change. A correction
issues an adjustment invoice (§19), never an order edit.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `orderNumber` | text | yes (unique) | Display number, format `ZH-{year}-{seq:00000}` |
| `customerId` | relation → `customers` | yes | |
| `placedByUserId` | relation → `users` | yes | Customer (storefront) or staff (manual entry) |
| `placedAt` | datetime | yes | |
| `channel` | enum | yes | `storefront`, `showroom`, `phone`, `import` |
| `originShowroomId` | relation → `showrooms` | no | If placed at a showroom |
| `assignedStaffId` | relation → `users` | no | Salesperson |
| `status` | enum | yes | See lifecycle below |
| `paymentStatus` | enum | yes | `unpaid`, `partial`, `paid`, `refunded` |
| `fulfillmentStatus` | enum | yes | `pending`, `in_production`, `ready`, `out_for_delivery`, `delivered`, `cancelled` |
| `billingAddress` | group | yes | Snapshot of address fields |
| `shippingAddress` | group | yes | Snapshot |
| `taxInvoiceRequested` | boolean | no | If true, customer's `nationalId` is required |
| `subtotalRials` | bigint | yes | |
| `discountRials` | bigint | yes | |
| `deliveryFeeRials` | bigint | yes | |
| `vatRials` | bigint | yes | |
| `totalRials` | bigint | yes | Final amount |
| `currency` | enum | yes | Always `IRR` in v1 |
| `appliedPromotionId` | relation → `promotions` | no | |
| `internalNotes` | richText | no | Staff-only |
| `customerNotes` | textarea | no | Customer-supplied delivery notes |

### §16.1 Order lifecycle ⏳ pending Discovery lock

> These states are **invented defaults** (decision #9). Discovery must
> overwrite them. Whatever the existing showroom managers app calls
> these states is what we should match, because that's the staff
> vocabulary. Do not implement in the commerce codebase until the
> Discovery workflow map confirms the actual lifecycle.

```
draft → placed → confirmed → in_production → ready → out_for_delivery → delivered
                    ↓
                cancelled
```

- `draft` — staff-built order awaiting confirmation. Storefront
  orders skip this state.
- `placed` — created by storefront checkout. Awaits payment
  confirmation.
- `confirmed` — payment captured, stock reserved.
- `in_production` — set by `apps/mes` (Package 4) for made-to-order.
  In Packages 2–3 it's set manually by sales when relevant.
- `ready` — finished goods available at the dispatching location.
- `out_for_delivery` — handed to courier / driver.
- `delivered` — confirmed received by customer.
- `cancelled` — terminal; reachable from any state before
  `out_for_delivery`. Triggers refund flow if payment was captured.

Indexes: `orderNumber` unique, `(customerId, placedAt)`,
`(status, placedAt)`, `(originShowroomId, placedAt)`.

### §16.2 Hooks

- On `placed`: send SMS to customer with order number.
- On `confirmed`: reserve stock in `stockLevels`, update customer
  lifetime value.
- On `cancelled` after `confirmed`: release stock reservation,
  trigger refund via `packages/payments`.
- On any status change: write to `auditLog` with the transition.

## §17 `orderLineItems`

Per-line snapshot of what was sold. Independent table (not
embedded) so reports can aggregate by SKU efficiently.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `orderId` | relation → `orders` | yes | |
| `productId` | relation → `products` | yes | |
| `productVariantId` | relation → `productVariants` | yes | |
| `productNameSnapshot` | text | yes | Persian name at time of sale |
| `variantLabelSnapshot` | text | yes | |
| `skuSnapshot` | text | yes | |
| `qty` | number | yes | |
| `unitPriceRials` | bigint | yes | Locked at order time |
| `discountRials` | bigint | no | |
| `lineTotalRials` | bigint | yes | (unit × qty) − discount |
| `dispatchLocationId` | relation → `stockLocations` | no | Set when reserved |

Indexes: `orderId`, `(productId, orderId)` for SKU reports.

## §18 `payments`

Records of payment attempts and captures via `packages/payments`.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `orderId` | relation → `orders` | yes | |
| `provider` | enum | yes | `zarinpal` / `idpay` / `zibal` / `manual` |
| `providerReference` | text | yes | Gateway transaction id |
| `amountRials` | bigint | yes | |
| `status` | enum | yes | `initiated`, `pending`, `succeeded`, `failed`, `refunded` |
| `method` | enum | no | `online`, `cash`, `card_pos`, `bank_transfer` |
| `initiatedAt` | datetime | yes | |
| `capturedAt` | datetime | no | |
| `refundedAt` | datetime | no | |
| `refundReason` | text | no | |
| `rawResponse` | jsonb | no | Provider payload, redacted |

Indexes: `orderId`, `providerReference` unique.

## §19 `invoices` (factors) ⏳ pending Discovery lock

> Factor numbering format, legal template, tax fields, and the
> immutability + adjustment-factor pattern (decision #10) are all
> **pending the accountant schema-walk** (R6 deliverable #3). Do not
> freeze in the commerce codebase until validated. Also pending
> Package 2 signing per R11.

Legal Persian invoice document. **Immutable once issued.** A
correction issues a new invoice with `parentInvoiceId` set; the
original stays on file.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `factorNumber` | text | yes (unique) | Format from `siteSettings.invoiceNumberFormat` |
| `orderId` | relation → `orders` | yes | |
| `customerId` | relation → `customers` | yes | |
| `parentInvoiceId` | relation → `invoices` | no | For adjustments / corrections |
| `kind` | enum | yes | `original`, `adjustment`, `void` |
| `issuedAt` | datetime | yes | |
| `issuedByUserId` | relation → `users` | yes | |
| `issuingShowroomId` | relation → `showrooms` | no | Per-showroom numbering if format requires it |
| `buyerSnapshot` | jsonb | yes | Name, phone, address, national ID, economic code |
| `sellerSnapshot` | jsonb | yes | From `siteSettings` at issue time |
| `lineItems` | jsonb | yes | Frozen copy of order lines |
| `subtotalRials` | bigint | yes | |
| `discountRials` | bigint | yes | |
| `vatRials` | bigint | yes | |
| `totalRials` | bigint | yes | |
| `totalInWordsFa` | text | yes | Persian "amount in words" for legal copies |
| `pdfMediaId` | relation → `media` | no | Cached rendered PDF |
| `signedShareToken` | text | no | For `apps/factor` external access |

Indexes: `factorNumber` unique, `(orderId)`, `(issuingShowroomId, issuedAt)`.

Hooks:

- Numbering is generated server-side via `packages/invoices` using
  the format in `siteSettings.invoiceNumberFormat`. Per-showroom
  sequences are tracked atomically.
- Once issued, every field becomes read-only. Any "edit" creates an
  `adjustment` invoice with `parentInvoiceId` set.
- A `void` invoice records cancellation (e.g., order refunded
  before delivery) — the original remains on file.

## §20 `stockLocations`

Physical places that hold stock. Each showroom has at least one.
The Hamedan factory warehouse is its own location even though it's
co-located with the Hamedan showroom.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` (L) | text | yes | "انبار کارخانه همدان" |
| `slug` | text | yes (unique) | |
| `kind` | enum | yes | `factory_warehouse`, `showroom_floor`, `showroom_storage`, `external_warehouse` |
| `showroomId` | relation → `showrooms` | no | Set for showroom-attached locations |
| `address` | group | no | Postal address; nullable for ad-hoc locations |
| `active` | boolean | yes | |

## §21 `stockLevels`

Per-(location, variant) on-hand and reserved counts.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `stockLocationId` | relation → `stockLocations` | yes | |
| `productVariantId` | relation → `productVariants` | yes | |
| `onHand` | number | yes | Physically present |
| `reserved` | number | yes | Allocated to confirmed orders |
| `available` | number | auto | `onHand − reserved` |
| `reorderPoint` | number | no | |
| `lastCountedAt` | datetime | no | |
| `lastCountedByUserId` | relation → `users` | no | |

Unique on `(stockLocationId, productVariantId)`.

## §22 `stockTransfers` & `stockTransferLines` ⏳ pending Discovery lock

> The two-phase confirm (dispatched → received) is a reasonable
> default (decision #12), but the existing app might use single-step
> transfers. Discovery decides. Do not freeze in the commerce
> codebase until the legacy app's actual behavior is mapped.

Movement of stock between locations. Transfers go through a
two-phase confirm: dispatched at source, received at destination.

`stockTransfers`:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `transferNumber` | text | yes (unique) | |
| `sourceLocationId` | relation → `stockLocations` | yes | |
| `destinationLocationId` | relation → `stockLocations` | yes | |
| `status` | enum | yes | `draft`, `dispatched`, `received`, `cancelled` |
| `dispatchedAt` | datetime | no | |
| `dispatchedByUserId` | relation → `users` | no | |
| `receivedAt` | datetime | no | |
| `receivedByUserId` | relation → `users` | no | |
| `notes` | textarea | no | |

`stockTransferLines`:

| Field | Type | Required |
| --- | --- | --- |
| `transferId` | relation → `stockTransfers` | yes |
| `productVariantId` | relation → `productVariants` | yes |
| `qtyDispatched` | number | yes |
| `qtyReceived` | number | no |
| `discrepancyReason` | text | no |

Hooks:

- `dispatched` decrements source `onHand`.
- `received` increments destination `onHand`. Discrepancies write
  to `auditLog` and require `accountant` review.
- `cancelled` from `dispatched` requires a counter-transfer; the
  original cannot be deleted.

## §23 `deliveries`

Per-order delivery record.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `orderId` | relation → `orders` | yes | |
| `carrier` | enum | yes | `in_house`, `tipax`, `post`, `external_courier` |
| `dispatchedAt` | datetime | no | |
| `expectedDeliveryAt` | date | no | Stored UTC, displayed Jalali |
| `deliveredAt` | datetime | no | |
| `deliveredByUserId` | relation → `users` | no | Driver / staff |
| `proofMediaId` | relation → `media` | no | Photo / signature |
| `damageReport` | richText | no | |
| `notes` | textarea | no | |

## §24 `returns`

Customer-initiated returns and exchanges.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `orderId` | relation → `orders` | yes | |
| `requestedAt` | datetime | yes | |
| `reason` | enum | yes | `damaged`, `wrong_item`, `not_as_described`, `customer_change_of_mind`, `other` |
| `description` | textarea | yes | |
| `lineItems` | array (embedded) | yes | Which line items, what qty |
| `status` | enum | yes | `requested`, `approved`, `received`, `refunded`, `rejected` |
| `refundPaymentId` | relation → `payments` | no | If refunded |
| `restockLocationId` | relation → `stockLocations` | no | Where the returned item went |

Hooks:

- `received` increments stock at `restockLocationId` if the items
  are sellable.
- `refunded` triggers an `adjustment` invoice referencing the
  original.

## §25 `priceHistory`

Append-only ledger of price changes for `products` and
`productVariants`.

| Field | Type | Required |
| --- | --- | --- |
| `subjectKind` | enum (`product`, `productVariant`) | yes |
| `subjectId` | text | yes |
| `field` | enum (`basePriceRials`, `salePriceRials`, `priceDeltaRials`) | yes |
| `oldRials` | bigint | yes |
| `newRials` | bigint | yes |
| `changedByUserId` | relation → `users` | yes |
| `changedAt` | datetime | yes |
| `reason` | text | no |

No update, no delete. Indexes on `(subjectKind, subjectId, changedAt)`.

## §26 `reviews`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `productId` | relation → `products` | yes | |
| `customerId` | relation → `customers` | no | Verified purchase if set |
| `authorName` | text | yes | |
| `rating` | number 1–5 | yes | |
| `title` | text | no | |
| `body` | textarea | yes | Persian |
| `verifiedPurchase` | boolean | no | Computed from `orders` join |
| `status` | enum | yes | `pending`, `approved`, `rejected`, `spam` |
| `publishedAt` | datetime | no | |

Approved reviews feed `AggregateRating` JSON-LD on the parent
product (Package 3+).

## §27 `promotions` (Package 2 — Shape C rules-based engine)

> ⏳ pending Package 2 signing. Shape C scope per R13. Scope fence:
> no dynamic pricing, no user-behavior-triggered discounts, no
> A/B-tested promotions, no per-segment targeting (Package 3).

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | text | yes | internal |
| `code` | text | no (unique if set) | discount code if any |
| `bannerHeadline` (L) | text | no | sitewide banner |
| `bannerCta` | group { label, href } | no | |
| `startsAt` | datetime | yes | |
| `endsAt` | datetime | yes | |
| `appliesTo` | enum | yes | `all`, `collection`, `category`, `product`, `customer` |
| `targetIds` | text[] | no | Depending on appliesTo |
| `discountType` | enum | yes | `percent`, `fixed_rials`, `buy_x_get_y` |
| `discountValue` | number | yes | percent integer or rial integer |
| `buyQty` | number | no | For `buy_x_get_y`: purchase quantity |
| `getQty` | number | no | For `buy_x_get_y`: free/discounted quantity |
| `minimumOrderRials` | bigint | no | |
| `maxUses` | number | no | |
| `usesCount` | number | auto | |
| `active` | boolean | auto | `now ∈ [starts, ends] && usesCount < maxUses` |
| `customerScoped` | boolean | no | If true, `targetIds` references customer IDs |
| `timeWindowed` | boolean | no | Display countdown if true |

## §27b `giftCards` (Package 2 — Shape C)

> ⏳ pending Package 2 signing and accountant schema-walk confirmation
> of gift-card tax treatment under Iranian VAT (R13). Gift card
> issuance *workflows* (who issues, under what approval) are Package 3
> scope — Package 2 provides the tool only.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `code` | text | yes (unique) | Redeemable code |
| `initialBalanceRials` | bigint | yes | |
| `currentBalanceRials` | bigint | yes | Decremented on redemption |
| `issuedByUserId` | relation → `users` | yes | |
| `issuedAt` | datetime | yes | |
| `issuedToCustomerId` | relation → `customers` | no | Named recipient if any |
| `expiresAt` | datetime | no | |
| `status` | enum | yes | `active`, `exhausted`, `expired`, `voided` |

Indexes: `code` unique, `(issuedToCustomerId)`.

Hooks:

- On redemption at checkout: decrement `currentBalanceRials`, write to
  `auditLog`. If balance reaches zero, status → `exhausted`.
- On expiry: nightly job sets status → `expired` where
  `expiresAt < now()` and `status = 'active'`.
- Gift card redemptions appear as a line in the factor (invoice).
  Tax treatment is per the accountant's schema-walk decision.

## §27c `giftCardTransactions` (Package 2 — Shape C)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `giftCardId` | relation → `giftCards` | yes | |
| `orderId` | relation → `orders` | no | Null for issuance, set for redemption |
| `type` | enum | yes | `issuance`, `redemption`, `void` |
| `amountRials` | bigint | yes | Positive for issuance, negative for redemption |
| `balanceAfterRials` | bigint | yes | Running balance snapshot |
| `at` | datetime | yes | |

Append-only. No update, no delete.

## §27d `stockReservations` (Package 2 — Shape C)

> ⏳ pending Discovery lock. The legacy app may already have a
> reservation concept; if so, the window should match staff
> expectations. Default 15 minutes, configurable in site settings.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `productVariantId` | relation → `productVariants` | yes | |
| `stockLocationId` | relation → `stockLocations` | yes | |
| `sessionToken` | text | no | For anonymous carts |
| `customerId` | relation → `customers` | no | For logged-in carts |
| `qty` | number | yes | |
| `reservedAt` | datetime | yes | |
| `expiresAt` | datetime | yes | Default: `reservedAt + 15 minutes` |
| `status` | enum | yes | `active`, `converted`, `expired` |
| `orderId` | relation → `orders` | no | Set when reservation converts to a confirmed order |

Indexes: `(productVariantId, stockLocationId, status)`,
`(expiresAt, status)` for the expiry sweep.

Hooks:

- On reservation: decrement `available` in `stockLevels` (available =
  onHand − reserved − active reservations).
- On expiry (sweep job every 60 seconds): set status → `expired`,
  release the reserved qty back to available pool.
- On order confirmation: set status → `converted`, link `orderId`.
  The reserved qty moves from reservation to order-level stock hold.

## §28 `showrooms`

Each physical Zhic location.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` (L) | text | yes | "ژیک — تهران" |
| `slug` | text | yes (unique) | |
| `headline` (L) | text | no | Poetic one-liner |
| `description` (L) | richText | yes | |
| `coverMediaId` | relation → `media` | yes | |
| `galleryMediaIds` | relation[] → `media` | yes | min 3 |
| `address` | group | yes | province, city, district, street, plaque, unit, postalCode |
| `geo` | group { lat, lng } | yes | |
| `phone` | text (E.164) | yes | |
| `email` | email | no | |
| `hours` | array | yes | { day, opens, closes, closed } |
| `holidayHours` | array | no | Iranian holidays (Nowruz, etc.) |
| `appointmentOnly` | boolean | no | default false |
| `parkingNotes` (L) | textarea | no | |
| `transitNotes` (L) | textarea | no | |
| `featuredProductIds` | relation[] → `products` | no | |
| `managerUserId` | relation → `users` | no | `showroom_manager` role |
| `googleBusinessProfileUrl` | url | no | |
| `neshanProfileUrl` | url | no | Iranian map service equivalent |
| `mapEmbedUrl` | url | no | |
| `seo` | group | yes | |
| `status` | enum | yes | draft / published |

JSON-LD: `LocalBusiness` (`FurnitureStore`) with Iranian address
and `openingHoursSpecification`. See `seo.md` §5.

---

# Schema: `crm` (Package 3)

Stub-level schemas. Final shape comes from Discovery (`discovery.md`).
Listed here so the cross-schema FK contracts are visible.

## §40 `leads`

Storefront inquiries, walk-ins, phone calls.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `customerId` | relation → `commerce.customers` | no | Set on conversion |
| `name` | text | yes | |
| `phone` | text (E.164) | yes | |
| `source` | enum | yes | `storefront`, `walk_in`, `phone`, `instagram`, `telegram`, `referral` |
| `originShowroomId` | relation → `commerce.showrooms` | no | |
| `assignedStaffId` | relation → `public.users` | no | |
| `interestedProductIds` | relation[] → `commerce.products` | no | |
| `pipelineStageId` | relation → `pipelineStages` | yes | |
| `notes` | richText | no | |
| `nextFollowUpAt` | datetime | no | |
| `convertedOrderId` | relation → `commerce.orders` | no | |
| `closedAt` | datetime | no | |
| `closedReason` | text | no | |

## §41 `pipelineStages`, `appointments`, `followUps`, `notes`

Stubbed pending Discovery. Final fields, ordering, and per-showroom
configurability are decided once interviews are done.

---

# Schema: `erp` (Package 3+)

Stub. Final shape determined with the business's accountant before
any code. Includes:

- `suppliers`
- `purchaseOrders` + `purchaseOrderLines`
- `goodsReceiptNotes`
- `chartOfAccounts` (mapped to whichever Iranian accounting
  software the business already uses for export)
- `journalEntries` + `journalEntryLines`
- `staff`
- `payrollExports`

---

# Schema: `mes` (Package 4)

Stub. Owned by `services/factory-api` via Drizzle (not Payload).
Includes:

- `workOrders`
- `boms` + `bomLines`
- `routings`
- `productionSchedule`
- `qcGates`
- `productionEvents` (append-only event log)

The boundary with `commerce` is event-based: completed work orders
emit events that `services/api` consumes to update
`commerce.stockLevels`. See `architecture.md` §5.

---

# Schema: `content`

Editorial content. Persian-first.

## §60 `articles` (journal)

Long-form editorial content. The site's primary SEO engine in
Persian.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` (L) | text | yes | Persian |
| `slug` | text | yes (unique) | ASCII |
| `excerpt` (L) | textarea | yes | ≤ 280 chars |
| `body` (L) | richText (MDX) | yes | block-based |
| `coverMediaId` | relation → `media` | yes | |
| `authorId` | relation → `authors` | yes | |
| `categoryId` | relation → `journalCategories` | yes | |
| `tagIds` | relation[] → `commerce.tags` | no | |
| `relatedProductIds` | relation[] → `commerce.products` | no | |
| `relatedArticleIds` | relation[] → `articles` | no | |
| `readingTimeMinutes` | number | auto | |
| `featured` | boolean | no | |
| `seo` | group | yes | |
| `status` | enum | yes | extended for editorial sign-off — see §60.1 |
| `reviewState` | group | yes | see §60.1 |
| `publishedAt` | datetime | no | scheduled publish supported |

### §60.1 Editorial sign-off workflow

```
draft → in_review → approved → scheduled → published
                       ↓
                  changes_requested
```

| Status | Who can move it forward | Notes |
| --- | --- | --- |
| `draft` | marketing, editor, admin | Author iterating |
| `in_review` | editor, admin | Surfaces in editor's review queue |
| `changes_requested` | marketing, editor, admin | Editor rejected with comments |
| `approved` | editor, admin | Now publishable |
| `scheduled` | editor, admin | Approved + future `publishedAt` |
| `published` | editor, admin | Live |

`reviewState` group: `submittedByUserId`, `submittedAt`,
`reviewedByUserId`, `reviewedAt`, `reviewNotes`, `history` (array
of state transitions).

Hooks:

- Transition to `in_review` notifies all `editor` users.
- Transition to `changes_requested` notifies the original submitter.
- Transition to `published` requires `approved` as the prior state
  and is blocked for the `marketing` role.
- Every transition writes to `auditLog`.

JSON-LD: `Article` with `headline`, `image`, `author`,
`datePublished`, `dateModified`, `publisher`, `inLanguage: "fa-IR"`.

## §61 `authors`

| Field | Type | Required |
| --- | --- | --- |
| `name` | text | yes |
| `slug` | text | yes (unique) |
| `bio` (L) | richText | no |
| `avatarMediaId` | relation → `media` | no |
| `role` | text | no |
| `social` | group { instagram, telegram, website } | no |

## §62 `journalCategories`

| Field | Type |
| --- | --- |
| `name` (L) | text |
| `slug` | text (unique) |
| `description` (L) | textarea |

## §62b `journal` (global) — journal-index page config

Curates the `/journal` index. Article cards reference Articles (content lives on the Article); only page copy lives here. Added 2026-06-18.

| Field | Type | Notes |
| --- | --- | --- |
| `introTitle` | textarea | hero headline (newline = line break); empty → default brand headline |
| `featuredArticle` | relationship → `articles` | the big featured card; empty → whole page falls back to the static default |
| `listArticles` | relationship[] → `articles` | numbered list (rendered 02, 03 …), order preserved |
| `fullListHeading` | text | «فهرست کامل» section heading |
| `quoteText` | textarea | quote block |
| `cardArticles` | relationship[] → `articles` | the 2-up editorial cards, order preserved |
| `categoryTabs` | relationship[] → `journal-categories` | tab strip (after «همه»); empty → all categories |
| `ctaTitle` / `ctaLabel` / `ctaHref` | text | product-CTA banner copy + link |
| `ctaImage` | upload → media | product-CTA banner image |

Each referenced Article supplies the card's title / excerpt / cover / `category.name` / `readingTimeMinutes` / Jalali(`publishedAt`) / `/journal/<slug>`. DB: a `journal` table (scalar copy + `featured_article_id` + `cta_image_id` FK columns) and a `journal_rels` table for the hasMany relations (mirrors `home`/`home_rels`).

## §63 `pages`

CMS-driven page collection used for low-frequency pages (legal,
care, shipping, atelier). Singletons for `home`, `about`, `contact`,
`faq` are stored as documents with reserved slugs.

> **Note (2026-06-05):** the implemented `home` **global** (services/api/src/globals/Home.ts)
> additionally carries `about_media` (upload → media, optional) — the photo for the
> homepage «از همدان، برای ایران» section. When empty the section renders text-only.
>
> **Note (2026-06-25):** the `home` global also carries `about_background` (upload → media,
> optional) — the faint full-bleed texture laid over the forest «درباره‌ی ژیک» layer at
> ~20% opacity (see `opacity-20` in HomeBrandStatement.tsx). When empty the storefront falls
> back to the bundled celine carved-walnut default (`/hero-details/celine.webp`).
> Migration `20260625_120000_add_home_about_background`.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` (L) | text | yes | |
| `slug` | text | yes (unique) | reserved slugs locked |
| `template` | enum | yes | `default`, `legal`, `editorial`, `landing` |
| `blocks` | array (polymorphic) | yes | see §63.1 |
| `seo` | group | yes | |
| `status` | enum | yes | |

### §63.1 Block types

- `HeroBlock` { eyebrow, headline, sub, ctas[], media, layout }
- `MarqueeBlock` { items[], speed }
- `EditorialSplitBlock` { eyebrow, headline, body, image, layout }
- `FeaturedProductsBlock` { headline, productIds[] }
- `JournalTeaserBlock` { headline, articleIds[] | auto }
- `TestimonialsBlock` { items[] }
- `NewsletterBlock` { headline, sub, channel: 'sms' | 'email' }
- `ContactBlock` { headline, formId }
- `GalleryBlock` { mediaIds[], layout }
- `RichTextBlock` { body }
- `FaqBlock` { items[] } — outputs `FAQPage` JSON-LD
- `ShowroomsStripBlock` { headline, showroomIds[] | auto }
- `CtaBannerBlock` { headline, cta }
- `VideoBlock` { videoMediaId, posterMediaId, caption }
- `SpacerBlock` { size }

Block validation enforces token-bound options (no freeform colors).

## §64 `events`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` (L) | text | yes | |
| `slug` | text | yes (unique) | |
| `description` (L) | richText | yes | |
| `coverMediaId` | relation → `media` | yes | |
| `startsAt` | datetime | yes | |
| `endsAt` | datetime | yes | |
| `location` | group | yes | { name, address, city, country, lat, lng } |
| `showroomId` | relation → `commerce.showrooms` | no | If hosted at a showroom |
| `rsvpRequired` | boolean | no | default true |
| `capacity` | number | no | |
| `relatedProductIds` | relation[] → `commerce.products` | no | |
| `seo` | group | yes | |
| `status` | enum | yes | |

JSON-LD: `Event` with `name`, `startDate`, `endDate`, `location`,
`eventStatus`, `eventAttendanceMode`, `inLanguage: "fa-IR"`.

## §65 `pressItems`

| Field | Type | Required |
| --- | --- | --- |
| `outlet` | text | yes |
| `headline` | text | yes |
| `url` | url | yes |
| `publishedAt` | date | yes |
| `excerpt` | textarea | no |
| `logoMediaId` | relation → `media` | no |

## §66 `testimonials`

| Field | Type | Required |
| --- | --- | --- |
| `quote` (L) | textarea | yes |
| `author` | text | yes |
| `role` | text | no |
| `source` | text | no |
| `sourceUrl` | url | no |
| `imageMediaId` | relation → `media` | no |

## §67 `forms` & `formSubmissions`

Generic form definitions and their submissions. Powers contact,
trade application, RSVP. Newsletter is its own dedicated flow
because it ties into `packages/sms`.

`forms`:

| Field | Type | Notes |
| --- | --- | --- |
| `name` | text | internal |
| `slug` | text (unique) | |
| `fields` | array | { name, label, type, required, options[] } |
| `submitLabel` (L) | text | |
| `successMessage` (L) | text | |
| `notify` | text[] | email recipients |

`formSubmissions`:

| Field | Type | Notes |
| --- | --- | --- |
| `formId` | relation → `forms` | |
| `data` | jsonb | answers |
| `status` | enum | `new`, `read`, `responded`, `archived`, `spam` |
| `assignedToUserId` | relation → `users` | |
| `notes` | richText | internal |
| `meta` | group | ip, ua, referrer, utm |

## §68 `tradeApplications`

| Field | Type | Required |
| --- | --- | --- |
| `firmName` | text | yes |
| `contactName` | text | yes |
| `phone` | text (E.164) | yes |
| `email` | email | no |
| `website` | url | no |
| `instagram` | text | no |
| `address` | group | no |
| `nationalId` | text | no |
| `economicCode` | text | no |
| `portfolioMediaIds` | relation[] → `media` | no |
| `notes` | textarea | no |
| `status` | enum | `new`, `approved`, `declined` |

---

# Shared groups

## `seo`

Used on every public-facing collection.

| Field | Type | Notes |
| --- | --- | --- |
| `metaTitle` (L) | text | falls back to `title`/`name` |
| `metaDescription` (L) | textarea | ≤ 160 chars, falls back to excerpt |
| `canonical` | url | optional override |
| `ogImageMediaId` | relation → `media` | falls back to coverImage |
| `noindex` | boolean | default false |
| `nofollow` | boolean | default false |
| `keywords` | text[] | reference only, not rendered |
| `structuredDataOverride` | jsonb | escape hatch for custom JSON-LD |

## `dimensions`

| Field | Type | Notes |
| --- | --- | --- |
| `widthCm` | number | |
| `lengthCm` | number | |
| `heightCm` | number | |
| `widthM` | number | auto from cm |
| `lengthM` | number | auto from cm |
| `heightM` | number | auto from cm |

Iranian retail is metric. The old `widthIn`/`heightIn` Imperial
fields are gone.

## `address`

The canonical Iranian address shape. Used by `customers`,
`addresses`, `showrooms`, `orders` (snapshot), and `invoices`
(snapshot).

| Field | Type | Notes |
| --- | --- | --- |
| `province` | text | 31-province slug |
| `city` | text | |
| `district` | text | محله |
| `street` | text | |
| `plaque` | text | پلاک |
| `unit` | text | واحد |
| `postalCode` | text | 10-digit |
| `notes` | text | Delivery notes (intercom, landmark) |

---

# Relationships diagram (text)

```
public:
  users ─┬─ commerce.customers (1:1 via userId)
         ├─ commerce.orders (placedBy, assignedStaff)
         ├─ commerce.showrooms (manager)
         ├─ commerce.invoices (issuedBy)
         ├─ commerce.stockTransfers (dispatchedBy, receivedBy)
         └─ auditLog (actor)

  media — referenced by everything

commerce:
  customers ─┬─ addresses
             ├─ orders
             ├─ leads (crm)
             ├─ reviews
             └─ invoices

  products ─┬─ productVariants ─┬─ stockLevels
            │                    └─ orderLineItems
            ├─ collections, categories, tags, materials
            ├─ media (gallery, gifs, videos, model3d)
            ├─ priceHistory
            └─ reviews

  orders ─┬─ orderLineItems ─── productVariants
          ├─ payments
          ├─ invoices
          ├─ deliveries
          └─ returns

  stockLocations ─┬─ stockLevels
                  ├─ stockTransfers (source, destination)
                  └─ showrooms

  showrooms ─┬─ stockLocations
             ├─ orders (originShowroom)
             ├─ leads (originShowroom — crm)
             └─ events (content)

content:
  articles ─┬─ authors
            ├─ journalCategories
            ├─ commerce.tags
            ├─ commerce.products (related)
            └─ media

  pages ─── blocks[] (polymorphic, may reference products / articles / media / showrooms)

  events ─── commerce.products, commerce.showrooms, media

crm (Package 3):
  leads ─┬─ commerce.customers
         ├─ commerce.products
         ├─ commerce.showrooms
         └─ public.users (assigned)

mes (Package 4, factory-api / Drizzle):
  workOrders, boms, routings, productionEvents
  ↑ event contract ↓
  commerce.stockLevels (via services/api consumer)
```
