# Session 6.3 — QA Checklist

Run locally with `docker compose up postgres`, then `pnpm --filter @zhic/api dev`
+ `pnpm --filter @zhic/web dev`. Populate data via Payload admin or `pnpm --filter @zhic/api seed`.

---

## Cross-browser

- [ ] Chrome desktop — all pages load, scroll animations play
- [ ] Chrome Android — responsive layout, tap targets usable
- [ ] Firefox desktop — animations, fonts, RTL layout
- [ ] Safari desktop — animations, Ayandeh font loading
- [ ] Safari iOS — responsive, smooth scroll, form submission
- [ ] Telegram in-app browser — basic rendering, no broken layout
- [ ] Eitaa in-app browser — basic rendering

## Performance (Lighthouse, per seo.md §2.6)

Run on `/`, `/products/[slug]`, `/journal/[slug]`:

- [ ] LCP ≤ 2.0s (hard fail > 2.5s)
- [ ] INP ≤ 150ms (hard fail > 200ms)
- [ ] CLS ≤ 0.05 (hard fail > 0.1)
- [ ] TTFB ≤ 600ms (hard fail > 800ms)
- [ ] Page weight ≤ 1.5 MB (hard fail > 2 MB)
- [ ] JS bundle ≤ 180 kB (hard fail > 250 kB)
- [ ] SEO score ≥ 90

## Functional

- [ ] Submit inquiry from `/contact` → appears in Payload admin Inquiries
- [ ] Submit inquiry from `/showrooms/[slug]` → appears with correct `routed_to`
- [ ] Submit inquiry from PDP link (`/contact?product=slug&reason=quote`) → product pre-filled
- [ ] SMS received by showroom manager (set `SMS_IR_API_KEY` + `SMS_IR_LINE_NUMBER`)
- [ ] City routing: matching city → correct showroom manager; "سایر شهرها" → central (Hamedan)
- [ ] Add product in Payload admin → visible on `/products` within 10 min
- [ ] Add article in Payload admin → visible on `/journal` within 10 min
- [ ] Edit About global in Payload admin → visible on `/about` within 10 min

## SEO & Metadata

- [ ] View source on any page: `<html lang="fa-IR" dir="rtl">`
- [ ] Title shows "PageTitle — ژیک" pattern on all pages
- [ ] `/robots.txt` loads with correct disallow list
- [ ] `/sitemap.xml` loads with static + dynamic entries
- [ ] `/manifest.webmanifest` loads

## JSON-LD Validation

Validate in Google Rich Results Test (or view source):

- [ ] `/` — Organization + WebSite
- [ ] `/products/[slug]` — Product (with Offer + inquiry URL) + BreadcrumbList
- [ ] `/showrooms/[slug]` — LocalBusiness (FurnitureStore) + BreadcrumbList
- [ ] `/journal/[slug]` — Article (with author, image, inLanguage) + BreadcrumbList
- [ ] `/faq` — FAQPage (with Question/Answer mainEntity) + BreadcrumbList
- [ ] `/about` — AboutPage + Organization + BreadcrumbList
- [ ] `/contact` — ContactPage + BreadcrumbList
- [ ] `/journal` — Blog + BreadcrumbList
- [ ] `/categories/[slug]` — CollectionPage + BreadcrumbList

## OG Images

- [ ] `/` — OG image renders at 1200×630 with Persian text (Ayandeh font)
- [ ] `/products/[slug]` — OG image shows product name
- [ ] `/journal/[slug]` — OG image shows article title

## Motion & Animation

- [ ] Home page: H1 word-reveal on load
- [ ] Home page: sections fade+slide on scroll (brand statement, designs, showrooms, journal, CTA)
- [ ] Secondary pages: block reveals on key sections (article related, showroom gallery, category grid)
- [ ] Header: subtle shadow appears on scroll, removes at top
- [ ] Back-to-top button appears after scrolling ~400px
- [ ] `prefers-reduced-motion: reduce` → all animations become instant opacity fades, no transforms, Lenis smooth scroll disabled
- [ ] `/lab/motion` — all demo patterns work

## RTL & Typography

- [ ] All text right-aligned (except `dir="ltr"` elements like email, phone)
- [ ] Logical CSS properties (no hardcoded left/right margins/paddings)
- [ ] ZWNJ in Persian text (می‌خواهید not میخواهید)
- [ ] Persian digits in UI (۱۲۳ not 123)
- [ ] Jalali dates display correctly
- [ ] Money in toman with thousands separator
- [ ] Ayandeh font loads on all pages (no system fallback visible)

## Mobile UX

- [ ] Tap targets ≥ 44px on interactive elements
- [ ] No font smaller than 14px
- [ ] Mobile nav drawer opens/closes correctly
- [ ] Inquiry form usable on mobile (fields visible, keyboard doesn't obscure)
- [ ] Product filter drawer works on mobile
- [ ] Image gallery lightbox works on mobile

## Error States

- [ ] Visit non-existent URL → Persian 404 page
- [ ] Visit `/products/nonexistent-slug` → Persian 404
- [ ] API down → home page renders graceful fallback (no crash)

---

**Pass criteria:** All functional items checked, Lighthouse SEO ≥ 90,
no critical CWV regressions (hard fails from §2.6), JSON-LD validates
on all listed routes.
