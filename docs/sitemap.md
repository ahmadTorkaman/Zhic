# Sitemap & Information Architecture

Every URL on the public site, with its template, data source, SEO posture,
and the Phase in which it ships. This is the canonical map — if a page is
not here, it does not exist.

## URL conventions

- Lowercase, hyphenated, ASCII-only.
- No trailing slashes.
- Localized paths use the `/{locale}` prefix once Phase 5 lands; the default
  locale (`en`) is served at the root with no prefix.
- Slugs are stable. Renaming a slug auto-creates a 301 in the redirects
  collection.
- Query strings are never canonical; `?utm_*` is stripped from canonical
  tags.

## Public URL map

| Path | Template | Data source | Phase | JSON-LD | Notes |
| --- | --- | --- | --- | --- | --- |
| `/` | `HomePage` | `pages.home` singleton | 1 | `Organization`, `LocalBusiness`, `WebSite` | The current landing experience, refactored to read from CMS. |
| `/products` | `ProductIndex` | `products` collection | 2 | `CollectionPage`, `BreadcrumbList` | Filterable grid: size, material, price band. |
| `/products/[slug]` | `ProductDetail` | `products` doc | 2 | `Product`, `BreadcrumbList`, optional `AggregateRating` | Gallery, specs, materials, related, "Inquire" CTA. |
| `/collections/[slug]` | `Collection` | `collections` doc | 2 | `CollectionPage`, `BreadcrumbList` | Curated groupings (e.g. "The Linen Capsule"). |
| `/journal` | `JournalIndex` | `articles` collection | 2 | `Blog`, `BreadcrumbList` | Editorial archive landing. |
| `/journal/[slug]` | `Article` | `articles` doc | 2 | `Article`, `BreadcrumbList` | Long-form MDX with TOC. |
| `/journal/category/[slug]` | `JournalArchive` | `articles` filtered | 2 | `CollectionPage` | E.g. /journal/category/materials. |
| `/journal/tag/[slug]` | `JournalArchive` | `articles` filtered | 2 | `CollectionPage` | E.g. /journal/tag/linen. |
| `/about` | `AboutPage` | `pages.about` singleton | 1 | `AboutPage`, `Organization` | Brand story, atelier. |
| `/atelier` | `Page` | `pages` doc | 2 | `Place` | Process, craft, photographs. |
| `/showroom` | `ShowroomPage` | `pages.showroom` singleton | 4 | `LocalBusiness`, `Place` | NY showroom, hours, map, booking CTA. |
| `/showroom/book` | `BookingForm` | `appointments` collection | 4 | none (form) | Calendar-driven appointment form. |
| `/events` | `EventIndex` | `events` collection | 4 | `ItemList` | Upcoming + past events. |
| `/events/[slug]` | `EventDetail` | `events` doc | 4 | `Event` | Single event with RSVP. |
| `/contact` | `ContactPage` | `pages.contact` singleton | 1 | `ContactPage` | Form + email + showroom address. |
| `/trade` | `TradeProgram` | `pages.trade` singleton | 4 | `Service` | Designer / trade application. |
| `/trade/apply` | `TradeForm` | `tradeApplications` collection | 4 | none (form) | Application form. |
| `/press` | `PressIndex` | `pressItems` collection | 4 | `CollectionPage` | Logos + clippings. |
| `/faq` | `FaqPage` | `pages.faq` singleton | 2 | `FAQPage` | Generates rich-result eligible FAQ schema. |
| `/care-and-warranty` | `Page` | `pages` doc | 2 | `Article` | Care guides, warranty terms. |
| `/shipping-and-returns` | `Page` | `pages` doc | 2 | `Article` | Logistics. |
| `/privacy` | `LegalPage` | `pages` doc | 1 | none | Legal. |
| `/terms` | `LegalPage` | `pages` doc | 1 | none | Legal. |
| `/accessibility` | `LegalPage` | `pages` doc | 1 | none | Statement. |
| `/search` | `SearchPage` | search index | 5 | none | Optional, Phase 5. |
| `/sitemap.xml` | `app/sitemap.ts` | all collections | 1 | n/a | Auto-generated. |
| `/robots.txt` | `app/robots.ts` | static | 1 | n/a | |
| `/manifest.webmanifest` | `app/manifest.ts` | static | 1 | n/a | PWA basics. |

## Page templates

Each template is a single React component composed entirely of design-system
primitives and content blocks. Templates never hardcode copy.

### `HomePage`

Sections, in order, all CMS-driven:

1. `HeroBlock` — large headline, sub, CTA, scrubbed video or still.
2. `MarqueeBlock` — running word marquee (brand pillars).
3. `FeaturedProductsBlock` — 3–6 cards, hand-picked in CMS.
4. `EditorialSplitBlock` — image + copy, alternating.
5. `JournalTeaserBlock` — latest 3 articles.
6. `TestimonialsBlock` — pull quotes.
7. `NewsletterBlock` — capture.
8. `ContactTeaserBlock` — link to /contact.

### `ProductDetail`

1. Sticky breadcrumb.
2. Gallery (left) + buy column (right) on desktop; stacked on mobile.
3. Specs accordion (dimensions, materials, weight, lead time, care).
4. Long description.
5. "In the atelier" — process imagery.
6. Variants picker (size, finish).
7. "Pairs with" — curated cross-sell.
8. Related products.
9. Reviews (Phase 4+).
10. JSON-LD `Product` block.

### `Article`

1. Hero: title, dek, author, date, reading time, cover image.
2. Auto-generated table of contents (sticky on desktop).
3. MDX body with custom components (pull quote, image grid, product
   embed, video).
4. "Featured products" sidebar/footer.
5. Author card.
6. "Continue reading" — 3 related articles.

### `EventDetail`

1. Hero with date, location, hero image.
2. Description.
3. RSVP form.
4. Map.
5. JSON-LD `Event`.

## Information architecture rules

- **Max two levels of navigation depth** in the primary nav. Anything deeper
  lives in footer or in-page links.
- **Footer is the catch-all** for legal, care, trade, press.
- **Every page must have**: H1, meta title, meta description, OG image,
  canonical, breadcrumb (except `/`), JSON-LD where applicable.
- **No orphan pages.** Every URL is linked from at least one indexed page
  besides the sitemap.
- **404 page** is branded and offers: search, journal teasers, contact link.
- **500 page** is branded and silent (no stack traces).

## Primary navigation (header)

```
Collection      → /products
  ├ All beds         → /products
  ├ By collection    → /collections/[slug] (mega-menu)
  └ New arrivals     → /products?sort=newest
Journal         → /journal
About           → /about
  ├ Our story        → /about
  ├ The atelier      → /atelier
  └ Showroom         → /showroom
Contact         → /contact
```

## Footer

```
Collection         About            Visit            Service
- All beds         - Our story      - Showroom       - Contact
- Collections      - The atelier    - Events         - FAQ
- New arrivals     - Journal        - Book a visit   - Care & warranty
                   - Press          - Trade          - Shipping & returns
                                                     - Accessibility
                                                     - Privacy
                                                     - Terms

[Newsletter signup]
[Instagram] [Pinterest] [Email]
© Zhic, New York
```
