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
| `gallery` | relation[] → `media` | yes | min 3, ordered |
| `coverImage` | relation → `media` | yes | inherits from gallery[0] if unset |
| `videos` | relation[] → `media` | no | mp4/webm only |
| `featured` | boolean | no | shows on homepage if true |
| `featuredOrder` | number | no | manual ordering |
| `relatedProducts` | relation[] → `products` | no | manual cross-sell |
| `pairsWith` | relation[] → `products` | no | secondary cross-sell |
| `careInstructions` (L) | richText | no | |
| `warrantyYears` | number | no | default 5 |
| `seo` | group | yes | see shared groups |
| `status` | enum | yes | draft / scheduled / published |
| `publishedAt` | datetime | no | |

### 1.1 `variants` (array, embedded)

| Field | Type | Notes |
| --- | --- | --- |
| `label` (L) | text | e.g. "King — Linen Oat" |
| `sku` | text | unique within product |
| `size` | enum | `twin`, `full`, `queen`, `king`, `cal_king`, `eu_king`, `super_king` |
| `finish` | text | e.g. "Linen Oat", "Walnut" |
| `priceDelta` | number (cents) | added to basePrice |
| `availability` | enum | overrides product availability |
| `image` | relation → `media` | optional variant image |

### 1.2 Indexes

- `slug` unique
- `sku` unique
- `(featured, featuredOrder)` for homepage queries
- `(status, publishedAt)` for sitemap

### 1.3 Hooks

- On `slug` change: insert `{ from, to, type: 301 }` into `redirects`.
- On `basePrice` / `salePrice` change: append entry to `priceHistory` and
  audit log.
- On publish: revalidate `/products`, `/products/[slug]`, `/`, sitemap.

### 1.4 JSON-LD output

`Product` schema with `name`, `image`, `description`, `sku`, `brand:
"Zhic"`, `offers: { price, priceCurrency, availability, url }`,
`material`, optional `aggregateRating` from reviews.

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
| `status` | enum | yes | |
| `publishedAt` | datetime | no | scheduled publish supported |

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

Central asset library.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `file` | upload | yes | image, video, pdf |
| `alt` (L) | text | yes for images | enforced |
| `caption` (L) | text | no | |
| `credit` | text | no | photographer / source |
| `focalPoint` | group { x, y } | no | for art-directed crops |
| `tags` | text[] | no | |
| `width` / `height` | number | auto | |
| `mime` | text | auto | |
| `bytes` | number | auto | enforced max per type |
| `dominantColor` | text | auto | for blur placeholders |

Constraints (enforced at upload):

- Image: ≤ 4 MB, ≥ 1200px on long edge for hero/cover.
- Video: ≤ 8 MB, ≤ 12 s for hero scrub video.
- PDF: ≤ 10 MB.
- Alt text required for images (except `decorative: true`).

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
| `name` | text | yes |
| `email` | email | yes |
| `phone` | text | no |
| `partySize` | number | yes |
| `requestedAt` | datetime | yes |
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
          ├─ media (gallery, cover, videos)
          ├─ products (related, pairsWith)
          └─ reviews

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
