# Sitemap & Information Architecture

Every public URL on `apps/web` (the Persian-first storefront), with its
template, data source, SEO posture, and the phase in which it ships.
This is the canonical map — if a page is not here, it does not exist.

Operator apps (`apps/crm`, `apps/erp`, `apps/mes`, `apps/factor`) live
on their own subdomains and are not part of this document; their IA
lives in `admin-panels.md` and the phase docs.

---

## 1. URL conventions

The storefront is **Persian-first**, but its URL slugs are **ASCII,
lowercase, hyphenated**. Persian content lives in the page body, not
in the path. Reasons:

- Iranian users routinely paste links into apps that mangle non-ASCII
  characters. ASCII slugs survive every messenger and SMS gateway.
- Punycode / percent-encoded Persian slugs hurt CTR in search snippets
  and are unreadable in shared URLs.
- Search Console, Plausible, log analyzers, and CI link checks all
  cope better with ASCII.

Rules:

- **Lowercase, hyphenated, ASCII-only slugs.** No diacritics, no
  Persian characters, no underscores.
- **No trailing slashes.** `app/` is configured to redirect.
- **No `/{locale}` prefix.** The site is Persian. English is not on
  the roadmap. Schemas keep `(L)` markers on translatable fields for
  forward compatibility, but no second locale ships.
- **`<html lang="fa" dir="rtl">`** on every page. The shell is RTL.
  Embedded Latin runs (brand name, SKUs, prices in numeric form) use
  `dir="ltr"` on a wrapping span.
- **Slugs are stable.** Renaming a slug auto-creates a 301 in the
  `redirects` collection (see `data-schemas.md` §`redirects`).
- **Query strings are never canonical.** `?utm_*` and faceted filter
  params are stripped from `<link rel="canonical">`.
- **Persian digits in display, ASCII digits in storage and URLs.**
  Pagination is `?page=2`, never `?page=۲`. Display layer formats.
- **Jalali dates in display, ISO 8601 in storage.** URLs that need a
  date use ISO (`/journal/2026-04-08-...`), not Jalali strings.
- **Phone numbers in URLs are E.164 ASCII** (`+98...`), never local
  Persian-digit form.

---

## 2. Public URL map

Package numbers reference `roadmap.md`. Anything Package 3+ depends on
its respective app shipping; the storefront is Package 1–2 territory.

| Path | Template | Data source | Pkg | JSON-LD | Notes |
| --- | --- | --- | --- | --- | --- |
| `/` | `HomePage` | `pages.home` singleton | 1 | `Organization`, `WebSite` | Persian hero, featured catalog, journal teaser, showrooms strip. No `LocalBusiness` here — that's per showroom. |
| `/products` | `ProductIndex` | `products` collection | 1 | `CollectionPage`, `BreadcrumbList` | Filterable grid: category, material, size, price band (toman). |
| `/products/[slug]` | `ProductDetail` | `products` doc | 1 → 2 | `Product` (with real `Offer` from Package 2), `BreadcrumbList`, optional `3DModel` | Gallery + GIFs + WebXR 3D + specs. CTA is "افزودن به سبد" once Package 2 ships; "استعلام قیمت" before that and for `made_to_order` items. |
| `/collections/[slug]` | `CollectionPage` | `collections` doc | 1 | `CollectionPage`, `BreadcrumbList` | Curated product groupings. |
| `/categories/[slug]` | `CategoryPage` | `categories` doc | 1 | `CollectionPage`, `BreadcrumbList` | Per-product-category editorial landing (e.g. تخت‌خواب، مبلمان). Generous: editorial framing, not just filtered catalog. |
| `/journal` | `JournalIndex` | `articles` collection | 1 | `Blog`, `BreadcrumbList` | Persian editorial archive. |
| `/journal/[slug]` | `Article` | `articles` doc | 1 | `Article`, `BreadcrumbList` | Long-form content with TOC. Also used for pillar content pages (Generous). |
| `/journal/category/[slug]` | `JournalArchive` | `articles` filtered | 1 | `CollectionPage` | |
| `/journal/tag/[slug]` | `JournalArchive` | `articles` filtered | 1 | `CollectionPage` | |
| `/showrooms` | `ShowroomIndex` | `showrooms` collection | 1 | `ItemList` | All Iranian showrooms with map (Neshan / OSM embed). |
| `/showrooms/[slug]` | `ShowroomDetail` | `showrooms` doc | 1 | `LocalBusiness` (`FurnitureStore`), `BreadcrumbList` | Per-location: hours, address, phone, gallery, inquiry CTA. Persian address + Persian-digit hours. |
| `/showrooms/[slug]/book` | `BookingForm` | `appointments` collection | 3 | none (form) | Per-location appointment form (gated on `apps/crm` Package 3 backend). Package 1 has a simpler intake form on the showroom detail page itself. |
| `/events` | `EventsPage` | `events` collection | 1 | none | Generous-only. Static content listing workshops, open-house events, showroom visit windows. No `Event` JSON-LD with bookable slots — static content only in Package 1. |
| `/about` | `AboutPage` | `pages.about` singleton | 1 | `AboutPage`, `Organization` | Brand story, atelier. |
| `/atelier` | `Page` | `pages` doc | 1 | `Place` | Craft, process, photographs. |
| `/contact` | `ContactPage` | `pages.contact` singleton | 1 | `ContactPage` | Form + phone + showrooms list. Showroom-visit intake form also reachable from here. |
| `/faq` | `FaqPage` | `pages.faq` singleton | 1 | `FAQPage` | Persian Q&A with rich-result-eligible schema. |
| `/care` | `Page` | `pages` doc | 1 | `Article` | Care & warranty content. |
| `/shipping-and-delivery` | `Page` | `pages` doc | 1 | `Article` | Logistics, lead times per region of Iran. |
| `/returns` | `Page` | `pages` doc | 1 | `Article` | Return policy, satisfaction window. |
| **Cart & checkout (Package 2)** | | | | | |
| `/cart` | `CartPage` | `carts` for current session | 2 | none | Server-rendered, no flash of empty state. |
| `/checkout` | `CheckoutPage` | `carts` + `customers` | 2 | none | Multi-step: address → delivery → payment. Blocked behind `noindex`. |
| `/checkout/payment` | `CheckoutPaymentPage` | `payments` provider redirect | 2 | none | Brief interstitial before gateway redirect. |
| `/checkout/return` | `CheckoutReturnPage` | `payments` callback | 2 | none | Verifies payment, creates order, redirects to confirmation. |
| `/order/[id]` | `OrderConfirmationPage` | `orders` doc | 2 | none | Post-checkout success page (signed token in URL). `noindex`. |
| `/order/[id]/factor` | `FactorViewPage` | `invoices` doc via `packages/invoices` | 2 | none | Print-ready Persian factor. Package 4 promotes this to `factor.zhicwood.com`. |
| **Customer account (Package 2)** | | | | | |
| `/account` | `AccountHome` | `customers` | 2 | none | Login required. Phone+OTP via `packages/auth`. `noindex`. |
| `/account/orders` | `AccountOrders` | `orders` filtered by customer | 2 | none | |
| `/account/orders/[id]` | `AccountOrderDetail` | `orders` doc | 2 | none | Status, factor link, items, delivery progress. |
| `/account/addresses` | `AccountAddresses` | `addresses` | 2 | none | |
| `/account/profile` | `AccountProfile` | `customers` | 2 | none | Phone (read-only — it's the PK), name, national ID for tax-compliant invoices. |
| **Auth (Package 2)** | | | | | |
| `/login` | `LoginPage` | n/a | 2 | none | Phone-number entry → OTP screen. `noindex`. |
| `/login/verify` | `OtpVerifyPage` | n/a | 2 | none | OTP entry. `noindex`. |
| **Legal** | | | | | |
| `/privacy` | `LegalPage` | `pages` doc | 1 | none | فارسی privacy notice. |
| `/terms` | `LegalPage` | `pages` doc | 1 | none | فارسی terms of use. |
| `/accessibility` | `LegalPage` | `pages` doc | 1 | none | Statement. |
| **Search (deferred)** | | | | | |
| `/search` | `SearchPage` | Typesense / Meilisearch | — | none | Optional, post-Package-2. `noindex, follow`. |
| **System** | | | | | |
| `/sitemap.xml` | `app/sitemap.ts` | all collections | 1 | n/a | Auto-generated. Excludes `noindex` paths. |
| `/robots.txt` | `app/robots.ts` | static | 1 | n/a | Disallows `/account`, `/checkout`, `/order`, `/login`, `/lab`, `/api`, `/preview`. |
| `/manifest.webmanifest` | `app/manifest.ts` | static | 1 | n/a | PWA basics (Persian name, RTL splash). |
| `/opensearch.xml` | `app/opensearch/route.ts` | static | 7 | n/a | When `/search` ships. |

### Routes that are deliberately NOT in the storefront

- **`/admin`** — lives on `admin.zhicwood.com`, not on the storefront. The
  storefront does not link to it from any public page.
- **`/lab`** — see `lab.md`. Layout-level `noindex`, robots-disallowed,
  never linked from public navigation.
- **English mirror.** No `/en`, no `hreflang`, no second locale.
- **Per-city landing pages** like `/tehran-furniture-store`. Local SEO
  is handled via `/showrooms/[slug]` + per-location `LocalBusiness`
  schema, not doorway pages. See `seo.md` §5.

---

## 3. Page templates

Each template is a single React component composed entirely of
design-system primitives and content blocks. Templates never hardcode
copy. All templates render RTL.

### `HomePage`

CMS-driven block list, in default order:

1. `HeroBlock` — Persian headline, sub, CTA, scrubbed video or still.
   Persian-safe hero typography (see `design-system.md` §2.2).
2. `MarqueeBlock` — running word marquee in Persian. RTL-aware
   direction (right → left motion, not left → right).
3. `FeaturedProductsBlock` — 3–6 product cards with toman pricing.
4. `EditorialSplitBlock` — image + Persian copy, alternating sides
   (which "side" reverses under RTL automatically).
5. `JournalTeaserBlock` — latest 3 Persian articles.
6. `ShowroomsStripBlock` — list of Iranian showrooms, each linking to
   its detail page.
7. `TestimonialsBlock` — Persian pull quotes.
8. `NewsletterBlock` — phone-number-first capture (SMS via
   `packages/sms`); email is optional secondary.
9. `ContactTeaserBlock` — link to `/contact`.

### `ProductDetail`

The PDP is the heart of the storefront. From Package 2 onward it is
**a real commerce page**, not lead-gen-only.

Layout (desktop): media stage on the **right** (RTL convention places
the dominant column on the right), purchase column on the **left**.
Mobile: stacked, media first.

1. Sticky breadcrumb at the top, RTL chevrons.
2. Media stage (tabbed):
   - **تصاویر (Stills)** — gallery of high-res photographs.
   - **حرکت (Motion)** — looping GIFs (atelier process, fabric drape,
     light play). GIFs pause when off-screen.
   - **سه‌بعدی (3D / WebXR)** — interactive glTF model via
     `<model-viewer>`. AR via Scene Viewer (Android) or Quick Look
     (iOS / USDZ). **Click-to-load** to protect LCP. See `seo.md`
     §2.5 and `data-schemas.md` §1.2.
3. Purchase column:
   - Product name (Persian), one-line tagline.
   - Price in **toman**, formatted with Persian digits and thousands
     separator (٬). All conversion through `packages/money`. The raw
     rial integer is data-only.
   - Variant picker (size, finish, fabric). Selecting a variant
     updates the price, the inquiry payload, and (where authored)
     the 3D material via `KHR_materials_variants`.
   - **Primary CTA**:
     - Package 1: "استعلام قیمت" / "رزرو بازدید از شوروم".
     - Package 2+: "افزودن به سبد" for in-stock items;
       "پیش‌سفارش / استعلام" for `made_to_order` items.
   - Secondary CTA: "رزرو بازدید از شوروم" (always present).
   - Stock signal per nearest showroom (Package 3, sourced from
     `commerce.stockLevels`).
   - Lead-time text in Jalali ("تحویل از ۱۵ اردیبهشت ۱۴۰۵").
4. Specs accordion: dimensions (cm + m), materials, weight, lead time,
   care, warranty.
5. Long description (Persian, MDX-driven blocks).
6. "در کارگاه" — process imagery + caption.
7. "در کنار آن خوب است" — curated cross-sell (`pairsWith`).
8. Related products (`relatedProducts`).
9. Reviews block (Package 3+).
10. JSON-LD `Product` block (with real `Offer` from Package 2 onward).

### `CartPage` (Package 2)

1. Item rows: image, name, variant, qty stepper, line total in toman.
2. Summary: subtotal, delivery (estimated, depends on address), tax
   if applicable, total in toman.
3. Promo code field.
4. "ادامه به پرداخت" CTA → `/checkout`.
5. Empty state: friendly Persian message + link to `/products`.

### `CheckoutPage` (Package 2)

Multi-step on desktop, single scrolling form on mobile:

1. **Identity** — phone number, OTP, name. Auto-skipped if logged in.
2. **Address** — saved addresses (if any) + new address form. Persian
   address fields (province, city, district, street, plaque, unit,
   postal code). Province dropdown is the canonical Iranian list.
3. **Delivery method** — courier, in-showroom pickup, white-glove
   delivery (per region availability).
4. **Tax-invoice fields (optional)** — national ID + economic code +
   business name, only if customer wants a tax-compliant factor.
5. **Payment** — provider chosen in Package 2 (ZarinPal / IDPay / Zibal).
   Submitting redirects to the gateway.

The whole flow is `noindex`. The cart is never abandoned by the URL
strategy — `/cart` is always reachable for an authenticated session.

### `OrderConfirmationPage` (Package 2)

1. Confirmation headline, order number (formatted with Persian digits).
2. SMS confirmation notice (sent automatically via `packages/sms`).
3. Order summary.
4. "مشاهده فاکتور" → `/order/[id]/factor`.
5. "پیگیری سفارش" → `/account/orders/[id]`.

### `FactorViewPage` (Package 2, matures Package 4)

1. Header: Zhic logo, factor number (per `siteSettings.invoiceNumberFormat`),
   issue date in Jalali.
2. Buyer block: name, phone, address, optional national ID + economic
   code if tax-compliant.
3. Seller block: legal name, address, national ID, economic code, bank
   account if printed on factor.
4. Line items table: row number, name, qty, unit price (toman),
   line total (toman). Persian digits, thousands separators.
5. Totals: subtotal, discounts, VAT (if applicable), grand total in
   toman + رقم به حروف (amount-in-words) for legal copies.
6. Footer: signature line, stamp area, terms.

Print-first: a `@media print` stylesheet hides chrome. Package 4
promotes this template to `apps/factor` on its own subdomain with
signed-token access for external recipients.

### `Article`

1. Hero: title, dek, author, date (Jalali), reading time, cover image.
2. Auto-generated table of contents (sticky on desktop).
3. MDX body with custom blocks: pull quote, image grid, product
   embed, video, materials reference, factor sample.
4. "محصولات معرفی‌شده" sidebar/footer.
5. Author card.
6. "ادامه مطالعه" — 3 related Persian articles.

### `ShowroomDetail`

1. Hero: showroom name, headline, cover image.
2. Address (Persian) + map embed.
3. Hours table (Persian day names, Persian-digit times). Holiday
   hours table if any.
4. Phone (clickable `tel:` with E.164), optional email.
5. Gallery.
6. Featured products at this location.
7. CTAs: "تماس" (phone), "رزرو بازدید" (Package 3), "مسیریابی" (map link).
8. JSON-LD `LocalBusiness` (`FurnitureStore`).

---

## 4. Information architecture rules

- **Max two levels of navigation depth** in the primary nav. Anything
  deeper lives in footer or in-page links.
- **Footer is the catch-all** for legal, care, shipping, returns,
  showrooms list, social.
- **Every page must have**: H1, meta title, meta description, OG
  image, canonical, breadcrumb (except `/`), JSON-LD where applicable,
  `lang="fa"`, `dir="rtl"`.
- **No orphan pages.** Every URL is linked from at least one indexed
  page besides the sitemap.
- **404 page** is branded and Persian; offers: search (post-Package-2),
  journal teasers, contact link, link to `/showrooms`.
- **500 page** is branded, Persian, and silent (no stack traces, no
  request IDs visible to the user — those go to Glitchtip).

---

## 5. Primary navigation (header)

The header is sticky, RTL, and reads right → left as Persian users
expect.

```
خانه           → /
محصولات        → /products
  ├ همه‌ی محصولات         → /products
  ├ بر اساس مجموعه       → /collections/[slug] (mega-menu)
  └ تازه‌ها              → /products?sort=newest
ژورنال         → /journal
درباره‌ی ما    → /about
  ├ داستان ما           → /about
  ├ کارگاه              → /atelier
  └ شوروم‌ها             → /showrooms (mega-menu lists each location)
تماس           → /contact
```

Right side of the header (which on RTL renders on the visual left):

- **Search icon** (post-Package-2).
- **Account icon** → `/account` (Package 2, login state aware).
- **Cart icon** with item-count badge → `/cart` (Package 2).

---

## 6. Footer

```
محصولات              درباره‌ی ما       شوروم‌ها              خدمات
- همه‌ی محصولات      - داستان ما      - فهرست شوروم‌ها     - تماس
- مجموعه‌ها           - کارگاه          - رزرو بازدید         - پرسش‌های متداول
- تازه‌ها             - ژورنال          - رویدادها            - مراقبت و گارانتی
                                                              - ارسال و تحویل
                                                              - بازگشت کالا
                                                              - دسترسی‌پذیری
                                                              - حریم خصوصی
                                                              - شرایط استفاده

[فرم خبرنامه — شماره موبایل]
[اینستاگرام] [تلگرام] [ایمیل]
© شرکت ژیک — تمام حقوق محفوظ است.
```

The newsletter capture is **phone-first** (it dispatches via
`packages/sms`), with email as an optional secondary field. Email-only
collection is fine where SMS is undesired.

---

## 7. Package gating summary

| Package | Storefront surfaces this package unlocks |
| --- | --- |
| 1 | `/`, `/products`, `/products/[slug]` (inquiry mode), `/collections/*`, `/categories/*` (editorial), `/journal/*`, `/showrooms`, `/showrooms/[slug]`, `/events` (static), `/about`, `/atelier`, `/contact`, `/faq`, `/care`, `/shipping-and-delivery`, `/returns`, legal, sitemap, robots, manifest. Generous scope: pillar content pages, per-category editorial, events page, showroom-visit intake form. |
| 2 | `/cart`, `/checkout/*`, `/order/[id]`, `/order/[id]/factor`, `/account/*`, `/login*`. PDP CTA flips from "استعلام" to "افزودن به سبد" for in-stock items. Shape C adds promotions, gift cards, delivery-step SMS. |
| 3 | `/showrooms/[slug]/book` (real booking engine via `apps/crm`), per-showroom stock signals on PDP |
| 4 | `/order/[id]/factor` migrates to `factor.zhicwood.com` for external recipients |

Anything not in this table is either covered elsewhere (operator
apps, admin) or is held open until Discovery and the relevant package
spec lands.
