# Data Schemas

The complete data model for Zhic. These schemas are CMS-agnostic in spirit
but written in a Payload-flavored shape because Payload is the planned
implementation (see roadmap Phase 3). Field types map cleanly to most
headless CMSes.

Conventions:

- `id` is auto. Not listed below.
- `createdAt`, `updatedAt` are auto. Not listed below.
- All publishable collections have `status: draft | scheduled | published`,
  `publishedAt`, and `version` fields.
- All collections that produce a public URL have an `seo` group (see §
  "Shared groups" at the end).
- All slugs validate as lowercase, hyphenated, ASCII; renaming a slug
  triggers an automatic entry in the `redirects` collection.
- All localized fields are marked **(L)**.

---

## 1. `products`

The core commerce-adjacent collection. Each product is one bed model.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` (L) | text | yes | e.g. "Aurora" |
| `slug` | text | yes | unique, auto from name, editable |
| `tagline` (L) | text | no | One-line poetic descriptor |
| `shortDescription` (L) | textarea | yes | ≤ 200 chars, used on cards |
| `longDescription` (L) | richText | yes | MDX-compatible blocks |
| `collection` | relation → `collections` | no | optional grouping |
| `materials` | relation[] → `materials` | yes | many-to-many |
| `categories` | relation[] → `categories` | yes | e.g. "Beds", "Canopy" |
| `tags` | relation[] → `tags` | no | for filtering |
| `basePrice` | number (cents) | yes | stored as integer cents |
| `currency` | enum (USD, EUR, GBP) | yes | default USD |
| `salePrice` | number (cents) | no | optional override |
| `priceHistory` | array | auto | append-only audit |
| `sku` | text | yes | unique |
| `availability` | enum | yes | `in_stock`, `made_to_order`, `backorder`, `sold_out` |
| `leadTimeDays` | number | yes | default 56 |
| `dimensions` | group | yes | width, length, height (cm + in) |
| `weightKg` | number | no | |
| `variants` | array | no | see §1.1 |
| `gallery` | relation[] → `media` | yes | min 3 stills, ordered |
| `coverImage` | relation → `media` | yes | inherits from gallery[0] if unset |
| `gifs` | relation[] → `media` | no | atelier loops, fabric drape, light play; mime `image/gif` or animated webp |
| `videos` | relation[] → `media` | no | mp4/webm only |
| `model3d` | group | no | WebXR / 3D viewer config — see §1.2 |
| `featured` | boolean | no | shows on homepage if true |
| `featuredOrder` | number | no | manual ordering |
| `relatedProducts` | relation[] → `products` | no | manual cross-sell |
| `pairsWith` | relation[] → `products` | no | secondary cross-sell |
| `careInstructions` (L) | richText | no | |
| `warrantyYears` | number | no | default 5 |
| `seo` | group | yes | see shared groups |
| `status` | enum | yes | draft / scheduled / published |
| `publishedAt` | datetime | no | |

### 1.2 `model3d` (group, embedded)

Drives the WebXR / 3D viewer on the product detail page. The viewer is
implemented with `<model-viewer>` so glTF feeds Android Scene Viewer and
USDZ feeds iOS Quick Look.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `gltf` | relation → `media` | yes (if any 3D) | `.glb` preferred, draco-compressed, ≤ 2 MB |
| `usdz` | relation → `media` | no | iOS Quick Look fallback, ≤ 8 MB |
| `poster` | relation → `media` | yes | still shown before user clicks to load 3D |
| `alt` | text | yes | a11y label for the 3D viewer |
| `cameraOrbit` | text | no | initial camera, e.g. `0deg 75deg 105%` |
| `cameraTarget` | text | no | initial target, e.g. `0m 0.5m 0m` |
| `exposure` | number | no | 0–2, default 1 |
| `shadowIntensity` | number | no | 0–1, default 0.5 |
| `arEnabled` | boolean | no | default true |
| `arPlacement` | enum | no | `floor`, `wall`; default `floor` |
| `variantBindings` | array | no | maps product variants to glTF material variants — see §1.3 |

### 1.3 `variantBindings` (array, embedded under model3d)

Optional mapping so that selecting a product variant in the UI swaps the
3D material via the glTF `KHR_materials_variants` extension.

| Field | Type | Notes |
| --- | --- | --- |
| `productVariantSku` | text | matches a sku in §1.4 variants |
| `gltfVariantName` | text | name as authored in the glTF |

### 1.4 `variants` (array, embedded)

| Field | Type | Notes |
| --- | --- | --- |
| `label` (L) | text | e.g. "King — Linen Oat" |
| `sku` | text | unique within product |
| `size` | enum | `twin`, `full`, `queen`, `king`, `cal_king`, `eu_king`, `super_king` |
| `finish` | text | e.g. "Linen Oat", "Walnut" |
| `priceDelta` | number (cents) | added to basePrice |
| `availability` | enum | overrides product availability |
| `image` | relation → `media` | optional variant image |

### 1.5 Indexes

- `slug` unique
- `sku` unique
- `(featured, featuredOrder)` for homepage queries
- `(status, publishedAt)` for sitemap

### 1.6 Hooks

- On `slug` change: insert `{ from, to, type: 301 }` into `redirects`.
- On `basePrice` / `salePrice` change: append entry to `priceHistory` and
  audit log.
- On publish: revalidate `/products`, `/products/[slug]`, `/`, sitemap.

### 1.7 JSON-LD output

`Product` schema with `name`, `image`, `description`, `sku`, `brand:
"Zhic"`, `material`, and optional `aggregateRating` from reviews.

Because Zhic is **lead-gen, not e-commerce**, the `offers` block is
emitted with `priceSpecification` (guidance pricing) and a `url` that
points to the inquiry CTA, NOT a checkout. `availability` is set from
`availability` field but interpreted as production status, not
warehouse stock.

---

## 2. `collections`

Curated product groupings (e.g. "The Linen Capsule").

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` (L) | text | yes | |
| `slug` | text | yes | unique |
| `description` (L) | richText | yes | |
| `coverImage` | relation → `media` | yes | |
| `products` | relation[] → `products` | yes | manual order |
| `featured` | boolean | no | shows in nav mega-menu |
| `seo` | group | yes | |
| `status` | enum | yes | |

---

## 3. `categories`

Flat taxonomy of product type (e.g. "Beds", "Canopy", "Headboards").

| Field | Type | Required |
| --- | --- | --- |
| `name` (L) | text | yes |
| `slug` | text | yes (unique) |
| `description` (L) | textarea | no |
| `parent` | relation → `categories` | no |

---

## 4. `tags`

Flat taxonomy for filtering (e.g. "linen", "low-profile", "storage").

| Field | Type |
| --- | --- |
| `name` (L) | text |
| `slug` | text (unique) |

---

## 5. `materials`

Reusable material descriptors used by products and journal articles.

| Field | Type | Notes |
| --- | --- | --- |
| `name` (L) | text | "Belgian Linen" |
| `slug` | text | unique |
| `description` (L) | richText | sourcing, feel, care |
| `image` | relation → `media` | |
| `origin` | text | "Bruges, Belgium" |
| `careNotes` (L) | richText | |
| `relatedArticles` | relation[] → `articles` | optional |

---

## 6. `articles` (journal)

Long-form editorial content. The site's primary SEO engine.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` (L) | text | yes | |
| `slug` | text | yes | unique |
| `excerpt` (L) | textarea | yes | ≤ 280 chars |
| `body` (L) | richText (MDX) | yes | block-based |
| `coverImage` | relation → `media` | yes | |
| `author` | relation → `authors` | yes | |
| `category` | relation → `journalCategories` | yes | |
| `tags` | relation[] → `tags` | no | |
| `relatedProducts` | relation[] → `products` | no | sidebar |
| `relatedArticles` | relation[] → `articles` | no | footer |
| `readingTimeMinutes` | number | auto | computed from body |
| `featured` | boolean | no | homepage teaser |
| `seo` | group | yes | |
| `status` | enum | yes | extended for editorial sign-off — see §6.1 |
| `reviewState` | group | yes | editorial review metadata — see §6.1 |
| `publishedAt` | datetime | no | scheduled publish supported |

### 6.1 Editorial sign-off workflow

Articles use an extended `status` enum to enforce editor approval before
anything goes live:

```
draft → in_review → approved → scheduled → published
                        ↓
                    changes_requested
```

| Status | Who can move it forward | Notes |
| --- | --- | --- |
| `draft` | marketing, editor, admin | Author is iterating. Not visible publicly. |
| `in_review` | editor, admin | Author has clicked "Submit for review." Surfaces in the editor's review queue on the dashboard. |
| `changes_requested` | marketing, editor, admin | Editor has rejected with comments; goes back to author. |
| `approved` | editor, admin | Editor approves; now publishable. |
| `scheduled` | editor, admin | Approved + has a future `publishedAt`. |
| `published` | editor, admin | Live. |

`reviewState` group:

| Field | Type | Notes |
| --- | --- | --- |
| `submittedBy` | relation → `users` | who submitted for review |
| `submittedAt` | datetime | |
| `reviewedBy` | relation → `users` | who approved or rejected |
| `reviewedAt` | datetime | |
| `reviewNotes` | richText | editor comments visible to the author |
| `history` | array | append-only log of state transitions |

Hooks:

- Transition to `in_review` notifies all `editor` users (email + admin
  dashboard badge).
- Transition to `changes_requested` notifies the original `submittedBy`.
- Transition to `published` requires `approved` as the prior state and is
  blocked for `marketing` role.
- Every transition writes to `auditLog`.

JSON-LD: `Article` with `headline`, `image`, `author`, `datePublished`,
`dateModified`, `publisher`.

---

## 7. `authors`

| Field | Type | Required |
| --- | --- | --- |
| `name` | text | yes |
| `slug` | text | yes (unique) |
| `bio` (L) | richText | no |
| `avatar` | relation → `media` | no |
| `role` | text | no |
| `social` | group { instagram, twitter, website } | no |

---

## 8. `journalCategories`

| Field | Type |
| --- | --- |
| `name` (L) | text |
| `slug` | text (unique) |
| `description` (L) | textarea |

---

## 8b. `showrooms`

Each physical Zhic location. There are several. Each one renders its own
public page at `/showrooms/[slug]` and emits its own `LocalBusiness`
JSON-LD.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | text | yes | e.g. "Zhic — New York" |
| `slug` | text | yes (unique) | |
| `headline` | text | no | poetic one-liner |
| `description` | richText | yes | |
| `coverImage` | relation → `media` | yes | |
| `gallery` | relation[] → `media` | yes | min 3 |
| `address` | group | yes | street, city, region, postalCode, country |
| `geo` | group | yes | lat, lng |
| `phone` | text | no | |
| `email` | email | no | |
| `hours` | array | yes | items: { day, opens, closes, closed } |
| `holidayHours` | array | no | items: { date, opens, closes, note } |
| `appointmentOnly` | boolean | no | default false |
| `parkingNotes` | textarea | no | |
| `transitNotes` | textarea | no | |
| `publicTransport` | textarea | no | |
| `featuredProducts` | relation[] → `products` | no | hand-picked highlights |
| `manager` | relation → `users` | no | who handles inquiries |
| `googleBusinessProfileUrl` | url | no | |
| `mapEmbedUrl` | url | no | optional override; default rendered from geo |
| `seo` | group | yes | |
| `status` | enum | yes | draft / published |

Hooks:

- On publish: revalidate `/showrooms`, `/showrooms/[slug]`, and the
  homepage if it features showroom strip.
- New `appointments` records carry a relation to a showroom doc.

JSON-LD: a `LocalBusiness` (or appropriate subtype like `FurnitureStore`)
emitted on `/showrooms/[slug]` with `name`, `image`, `address`, `geo`,
`telephone`, `openingHoursSpecification`, `url`, plus an aggregate
`ItemList` on `/showrooms` referencing all locations.

---

## 9. `events`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` (L) | text | yes | |
| `slug` | text | yes (unique) | |
| `description` (L) | richText | yes | |
| `coverImage` | relation → `media` | yes | |
| `startsAt` | datetime | yes | |
| `endsAt` | datetime | yes | |
| `location` | group | yes | name, address, city, country, lat, lng |
| `rsvpRequired` | boolean | no | default true |
| `capacity` | number | no | |
| `cta` | group { label, href } | no | |
| `relatedProducts` | relation[] → `products` | no | |
| `seo` | group | yes | |
| `status` | enum | yes | |

JSON-LD: `Event` with `name`, `startDate`, `endDate`, `location`,
`offers`, `eventStatus`, `eventAttendanceMode`.

---

## 10. `pages`

Generic CMS-driven page collection used for low-frequency pages (legal,
care, shipping, atelier). Singletons for `home`, `about`, `contact`,
`showroom`, `trade`, `faq` are stored as documents with reserved slugs.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` (L) | text | yes | |
| `slug` | text | yes (unique) | reserved slugs locked |
| `template` | enum | yes | `default`, `legal`, `editorial`, `landing` |
| `blocks` | array (polymorphic) | yes | see §10.1 |
| `seo` | group | yes | |
| `status` | enum | yes | |

### 10.1 Block types (polymorphic array)

Each block is one of:

- `HeroBlock` { eyebrow, headline, sub, cta[], media, layout }
- `MarqueeBlock` { items[], speed }
- `EditorialSplitBlock` { eyebrow, headline, body, image, layout }
- `FeaturedProductsBlock` { headline, products[] }
- `JournalTeaserBlock` { headline, articles[] | auto }
- `TestimonialsBlock` { items[] }
- `NewsletterBlock` { headline, sub, listId }
- `ContactBlock` { headline, formId }
- `GalleryBlock` { images[], layout }
- `RichTextBlock` { body }
- `FaqBlock` { items[] } — outputs `FAQPage` JSON-LD
- `PressLogosBlock` { logos[] }
- `CtaBannerBlock` { headline, cta }
- `VideoBlock` { video, poster, caption }
- `SpacerBlock` { size }

Block validation enforces token-bound options (no freeform colors).

---

## 11. `media`

Central asset library. Stills, GIFs, video, 3D, and PDFs all live here,
discriminated by `kind`.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `file` | upload | yes | image, gif, video, glb/gltf, usdz, pdf |
| `kind` | enum | auto | `image`, `gif`, `video`, `model_gltf`, `model_usdz`, `pdf` |
| `alt` (L) | text | yes for image/gif/model | enforced |
| `caption` (L) | text | no | |
| `credit` | text | no | photographer / source |
| `focalPoint` | group { x, y } | no | for art-directed crops (images only) |
| `tags` | text[] | no | |
| `width` / `height` | number | auto | image / video / gif |
| `durationMs` | number | auto | gif / video |
| `mime` | text | auto | |
| `bytes` | number | auto | enforced max per kind |
| `dominantColor` | text | auto | for blur placeholders |
| `polycount` | number | auto | 3D models only — read from glTF |
| `materialVariants` | text[] | auto | 3D models — list from `KHR_materials_variants` |
| `hasDraco` | boolean | auto | 3D models — true if KHR_draco_mesh_compression is present |
| `hasKtx2` | boolean | auto | 3D models — true if all textures use KHR_texture_basisu |
| `validationWarnings` | text[] | auto | 3D models — non-blocking issues from the validator |
| `decorative` | boolean | no | when true, alt is not required |

Constraints (enforced at upload):

- **Image:** ≤ 4 MB, ≥ 1200px on long edge for hero/cover.
- **GIF / animated webp:** ≤ 3 MB, ≤ 8 s loop, ≤ 1200px long edge.
  Editors are warned that mp4/webm is preferred for anything > 1 s; GIF
  is allowed because the brand is providing them.
- **Video:** ≤ 8 MB, ≤ 12 s for hero scrub video.
- **glTF / GLB:** ≤ 2 MB warn / ≤ 4 MB hard limit. The 3D artist is
  expected to deliver an already-optimized export from Blender (draco +
  KTX2; see admin §5.2b "Blender export preset"). The admin runs a
  read-only validator on upload — it does not transform the file. Auto-
  rejected if missing a `scene`, over 100k triangles, over 4 MB, or
  missing alt text. Warnings (no draco, no KTX2, > 80k triangles, > 2 MB)
  appear inline so the artist can fix and re-upload.
- **USDZ:** ≤ 8 MB. Optional iOS Quick Look pair for any GLB.
- **PDF:** ≤ 10 MB.
- Alt text required for images, GIFs, and 3D models (unless
  `decorative: true`).

---

## 12. `redirects`

| Field | Type | Required |
| --- | --- | --- |
| `from` | text | yes (unique) |
| `to` | text | yes |
| `type` | enum (`301`, `302`) | yes |
| `source` | enum (`auto`, `manual`) | yes |
| `note` | text | no |

Auto-populated when slugs change. Manual entries allowed for marketing
short links.

---

## 13. `forms` & `submissions`

Generic form definitions and their submissions. Powers contact, trade
application, newsletter, RSVP.

`forms`:

| Field | Type | Notes |
| --- | --- | --- |
| `name` | text | internal |
| `slug` | text (unique) | |
| `fields` | array | { name, label, type, required, options[] } |
| `submitLabel` | text | |
| `successMessage` (L) | text | |
| `notify` | text[] | email recipients |
| `forwardTo` | enum | `none`, `klaviyo`, `mailchimp` |

`submissions`:

| Field | Type | Notes |
| --- | --- | --- |
| `form` | relation → `forms` | |
| `data` | json | answers |
| `status` | enum | `new`, `read`, `responded`, `archived`, `spam` |
| `assignedTo` | relation → `users` | |
| `notes` | richText | internal |
| `meta` | group | ip, ua, referrer, utm |

---

## 14. `appointments` (showroom bookings)

| Field | Type | Required |
| --- | --- | --- |
| `showroom` | relation → `showrooms` | yes |
| `name` | text | yes |
| `email` | email | yes |
| `phone` | text | no |
| `partySize` | number | yes |
| `requestedAt` | datetime | yes |
| `interests` | relation[] → `products` | no |
| `notes` | textarea | no |
| `status` | enum (`pending`, `confirmed`, `declined`, `completed`, `no_show`) | yes |
| `confirmedAt` | datetime | no |
| `assignedTo` | relation → `users` | no |

---

## 15. `tradeApplications`

| Field | Type | Required |
| --- | --- | --- |
| `firmName` | text | yes |
| `contactName` | text | yes |
| `email` | email | yes |
| `website` | url | no |
| `instagram` | text | no |
| `address` | group | no |
| `taxId` | text | no |
| `portfolioFiles` | relation[] → `media` | no |
| `notes` | textarea | no |
| `status` | enum (`new`, `approved`, `declined`) | yes |

---

## 16. `reviews`

| Field | Type | Required |
| --- | --- | --- |
| `product` | relation → `products` | yes |
| `authorName` | text | yes |
| `authorEmail` | email | yes (private) |
| `rating` | number 1–5 | yes |
| `title` | text | no |
| `body` | textarea | yes |
| `verifiedPurchase` | boolean | no |
| `status` | enum (`pending`, `approved`, `rejected`, `spam`) | yes |
| `publishedAt` | datetime | no |

Approved reviews feed `AggregateRating` JSON-LD on the parent product.

---

## 17. `testimonials`

Curated press / customer pull quotes for homepage and elsewhere.

| Field | Type | Required |
| --- | --- | --- |
| `quote` (L) | textarea | yes |
| `author` | text | yes |
| `role` | text | no |
| `source` | text | no |
| `sourceUrl` | url | no |
| `image` | relation → `media` | no |

---

## 18. `pressItems`

| Field | Type | Required |
| --- | --- | --- |
| `outlet` | text | yes |
| `headline` | text | yes |
| `url` | url | yes |
| `publishedAt` | date | yes |
| `excerpt` | textarea | no |
| `logo` | relation → `media` | no |

---

## 19. `promotions`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | text | yes | internal |
| `code` | text | no | discount code if any |
| `bannerHeadline` (L) | text | no | sitewide banner |
| `bannerCta` | group { label, href } | no | |
| `startsAt` | datetime | yes | |
| `endsAt` | datetime | yes | |
| `appliesTo` | enum | `all`, `collection`, `product` |
| `targets` | relation[] | no | depending on appliesTo |
| `discountType` | enum | `percent`, `fixed` |
| `discountValue` | number | no | |
| `active` | boolean | yes | computed: now ∈ [starts, ends] && enabled |

---

## 20. `users`

Admin users only. Public newsletter subscribers live in Klaviyo, not here.

| Field | Type | Required |
| --- | --- | --- |
| `email` | email | yes (unique) |
| `name` | text | yes |
| `role` | enum (`admin`, `editor`, `marketing`, `viewer`) | yes |
| `avatar` | relation → `media` | no |
| `lastLoginAt` | datetime | auto |
| `twoFactorEnabled` | boolean | no |

See `admin-panels.md` for role permissions.

---

## 21. `auditLog`

Append-only. Written by hooks across all collections.

| Field | Type |
| --- | --- |
| `actor` | relation → `users` |
| `action` | enum (`create`, `update`, `delete`, `publish`, `unpublish`, `price_change`, `slug_change`, `login`) |
| `collection` | text |
| `documentId` | text |
| `before` | json |
| `after` | json |
| `at` | datetime |
| `ip` | text |

---

## 22. `siteSettings` (singleton)

Global config editable by admins.

| Field | Type | Notes |
| --- | --- | --- |
| `siteName` | text | "Zhic" |
| `tagline` (L) | text | |
| `defaultOgImage` | relation → `media` | |
| `defaultMetaTitle` (L) | text | template, e.g. "%s — Zhic" |
| `defaultMetaDescription` (L) | textarea | |
| `social` | group | instagram, pinterest, email |
| `contact` | group | email, phone, address |
| `showroomHours` | array | day, opens, closes |
| `analytics` | group | ga4Id, plausibleDomain, gscVerification, bingVerification |
| `consentBanner` | group | enabled, copy, links |
| `headerAnnouncement` | group | enabled, copy, link |
| `primaryEditor` | relation → `users` | the editorial sign-off "default reviewer" — see admin §2 |

---

## Shared groups

### `seo`

Used on every public-facing collection.

| Field | Type | Notes |
| --- | --- | --- |
| `metaTitle` (L) | text | falls back to `title`/`name` |
| `metaDescription` (L) | textarea | ≤ 160 chars, falls back to excerpt |
| `canonical` | url | optional override |
| `ogImage` | relation → `media` | falls back to coverImage |
| `noindex` | boolean | default false |
| `nofollow` | boolean | default false |
| `keywords` | text[] | reference only, not rendered |
| `structuredDataOverride` | json | escape hatch for custom JSON-LD |

### `dimensions`

| Field | Type | Notes |
| --- | --- | --- |
| `widthCm` | number | |
| `lengthCm` | number | |
| `heightCm` | number | |
| `widthIn` | number | auto from cm |
| `lengthIn` | number | auto from cm |
| `heightIn` | number | auto from cm |

---

## Relationships diagram (text)

```
products ─┬─ collections
          ├─ categories
          ├─ tags
          ├─ materials
          ├─ media (gallery, cover, gifs, videos, model3d.gltf/usdz/poster)
          ├─ products (related, pairsWith)
          └─ reviews

showrooms ┬─ media (cover, gallery)
          ├─ products (featured)
          └─ users (manager)

appointments ─┬─ showrooms
              ├─ products (interests)
              └─ users (assignedTo)

articles ─┬─ authors
          ├─ journalCategories
          ├─ tags
          ├─ media
          ├─ products (related)
          └─ articles (related)

events   ─┬─ media
          └─ products

pages    ──── blocks[] (polymorphic, may reference products/articles/media)

forms    ──── submissions
appointments
tradeApplications
testimonials
pressItems
promotions  ─── products | collections

redirects   (auto + manual)
auditLog    (append-only)
users
siteSettings (singleton)
media       (referenced by everything)
```
