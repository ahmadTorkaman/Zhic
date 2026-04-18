# Session 3.3 — Showrooms + Contact

## Goal

Ship the **physical-presence** surface of the storefront: `/showrooms`
(index of all Iranian Zhic locations), `/showrooms/[slug]` (per-location
detail with tabbed media stage, sticky breadcrumb, structured Persian
address, day-by-day hours table, map embed, featured products,
JSON-LD `LocalBusiness` / `FurnitureStore`), and `/contact` (central
phone callout + showrooms grid + form-slot placeholder for 5.1).
Along the way, bring `Showrooms` to spec §28 (structured address +
hours array + cover/email/holidayHours/parking/transit/featured
products + Neshan/Google profile URLs), close FU-3.1-k, FU-3.1-n,
FU-2.3-c, and unblock the inquiry-CTA hrefs that 3.2 PDP currently
404s on.

Authority: `docs/sessions.md` §3.3,
`docs/package1-month1.md` §Showrooms / §Contact,
`docs/spec/sitemap.md` §3 ShowroomDetail / ShowroomIndex /
ContactPage, §4 IA rules,
`docs/spec/data-schemas.md` §28 showrooms, §`address` shared shape.

Per CLAUDE.md sequencing rule, where the spec calls for fields/UX
that today have no implementation, the right answer is "extend the
schema in this session," not "drop the feature" — applied to the
12-field expansion of Showrooms.

## Entry state

- 3.2 just shipped: `/products` + `/products/[slug]` + `/collections/[slug]`,
  29 vitest cases for `lib/products.ts`, schema deltas to Products /
  Categories + new Materials + Collections collections, JSON-LD
  Product / BreadcrumbList / CollectionPage helpers in `lib/jsonld.ts`.
  PDP CTA href `/contact?product=<slug>&reason=quote` and
  `/showrooms` both currently 404 — this session resolves both.
- `Showrooms` collection (today, in 1.3 shape):
  `name`, `slug`, `city (text)`, `address (text)`, `phone (text)`,
  `manager_name`, `manager_phone`, `hours (text)`, `gallery (upload[])`,
  `coordinates: { lat, lng }`, `is_central`. **Missing** vs spec §28:
  `headline`, `description (richText)`, `coverMediaId`, structured
  `address` group, `email`, `hours` array (day/opens/closes/closed),
  `holidayHours` array, `appointmentOnly`, `parkingNotes`,
  `transitNotes`, `featuredProductIds`, `googleBusinessProfileUrl`,
  `neshanProfileUrl`, `mapEmbedUrl`, `seo` group, `status` enum.
- `@zhic/ui` ships through 2.x + 3.1 + 3.2 layout primitives.
  **`<PhoneLink>` does not exist** — FU-2.3-c open since 2.3.
- `@zhic/locale` exposes `formatPhone` (mobile-only). **No
  `formatLandline`** — FU-3.1-n open since 3.1.
- `Contact` global: `title`, `phone`, `email`, `address (textarea)`,
  `body (richText)`. Single field set; no schema delta needed.
- `lib/payload.ts` has `fetchShowrooms(limit=4)`, `PayloadShowroom`
  flat-text type. **No `fetchShowroom(slug)`, no `fetchContact()`.**
- `HomeShowroomsStrip` reads `showroom.city`, `showroom.address` (text),
  `showroom.hours` (text). After this session's schema migration these
  fields move — `HomeShowroomsStrip` must be updated in-session.
- Seed: 1 showroom (همدان, fictional address + manager + phone).
- No `/showrooms`, `/showrooms/[slug]`, or `/contact` route exists yet.

## Key decisions

| Decision | Choice |
|---|---|
| Schema scope | Bring `Showrooms` to spec §28 modulo Pkg-3+ fields. Add: `headline`, `description (richText)`, `cover (upload)`, `address (group: province/city/district/street/plaque/unit/postalCode/notes)`, `geo (group)`, `email`, `hours (array: day/opens/closes/closed)`, `holidayHours (array)`, `appointmentOnly`, `parkingNotes`, `transitNotes`, `featuredProductIds`, `googleBusinessProfileUrl`, `neshanProfileUrl`, `mapEmbedUrl`. Drop: standalone `city`, `address (text)`, `hours (text)`. Rename: `coordinates` → `geo`. Keep: `manager_name`, `manager_phone`, `is_central` (SMS routing internal — 5.1 territory). Skip: `managerUserId` (Pkg 3 — `users` collection doesn't exist), `seo` (6.1), `status` (FU-1.3-a). |
| Hours array shape | `{ day: select<sat\|sun\|mon\|tue\|wed\|thu\|fri>, opens: text<HH:MM>, closes: text<HH:MM>, closed: checkbox }`. Validation regex `^([01]?\d\|2[0-3]):[0-5]\d$` on opens/closes. Day enum order = Persian week (sat → fri). Rendered in the order spec'd by `DAY_ORDER` server-side, not by document order. |
| Address group | All 8 fields per spec `address` shape (province, city, district, street, plaque, unit, postalCode, notes). Only `city` is `required`; rest are optional to allow incremental fill-in by editors. JSON-LD `PostalAddress` joins the granular fields into a single `streetAddress` per Google's expectation. |
| Material migration risk | Same posture as 3.2's `materials` array drop — **no production data**, seed is the only consumer. The old `address` text field is dropped outright; seed rewrites Hamedan to the structured shape. |
| HomeShowroomsStrip | Must be updated in-session because it reads the dropped fields. Adapter: derive `city` from `address.city`, `addressLine` from `[district, street].join(' — ')`, `hoursSummary` from first non-closed entry's `${opens} – ${closes}`. |
| Cover vs gallery[0] | Spec separates `coverMediaId` from `galleryMediaIds`. Storefront falls back to `gallery[0]` when `cover` unset (matches 3.2 pattern with products). |
| `<PhoneLink>` primitive | Promote to `@zhic/ui` per FU-2.3-c. API: `<PhoneLink raw={string} inline?={boolean} className?={string}>`. Auto-detects mobile vs landline via `@zhic/locale.classifyPhone`. `inline=true` returns `<span>{display}</span>` for nesting inside linked cards (no nested `<a>`); default returns `<a href="tel:E.164">{display}</a>`. Three consumers ship in this session: ShowroomCard inner phone, ShowroomDetail header, ContactPage central callout. |
| `@zhic/locale` extension | Add `normalizeLandline` + `formatLandline` + `isIranianLandline` + `classifyPhone` (mobile-or-landline router). Closes FU-3.1-n. Iranian landline format `0XX-NNNNNNNN` (3-digit area code with leading 0 + 8-digit local) → E.164 `+98XXXXXXXXXX` (10 digits after country code). Display: `۰۸۱ ۳۸۱۲۳۴۵۶`. **+11 vitest cases** in `packages/locale/test/phone.test.ts` covering all input formats, both directions, and `classifyPhone` boundary cases. |
| `lib/payload.ts` extensions | Update `PayloadShowroom` to new shape (with `PayloadAddress` + `PayloadGeo` + `ShowroomHourEntry` + `ShowroomHolidayEntry` sub-types). Add `fetchAllShowrooms()` (no limit cap for index), `fetchShowroom(slug)` (depth=3 to resolve `featuredProductIds[].gallery[0]`), `fetchContact()` (global getter). Add `showroomPath(slug)` helper. Also add `PayloadContact` type. Net addition ~110 lines. |
| `lib/jsonld.ts` extensions | Add `localBusinessJsonLd(showroom, baseUrl)` → `@type: 'FurnitureStore'` with `PostalAddress`, `GeoCoordinates`, `openingHoursSpecification` (spec-day mapping `sat`→`Saturday` etc.), `telephone`, `email`, `image`, `sameAs` (Google + Neshan profile URLs). Add `itemListJsonLd(items, baseUrl, name?)` for `/showrooms`. Add `contactPageJsonLd({name, url, description})` for `/contact`. |
| Form on `/contact` and `/showrooms/[slug]` | **Slot only this session.** Sessions.md explicitly lists "Inquiry form integrated on PDP, showroom detail, contact page" as a 5.1 deliverable. 3.3 ships `<ContactFormSlot>` placeholder ("فرم تماس به‌زودی — لطفاً تماس بگیرید") on both surfaces. 5.1 swaps the slot with the real form; the inquiry CTAs from 3.2 PDP and 3.3 ShowroomCtas already encode the right `?product=&reason=quote` / `?showroom=&reason=visit` query params for 5.1 to read. |
| Map on `/showrooms` index | **Skip the all-pins map.** Spec calls for "All Iranian showrooms with map (Neshan/OSM embed)" but provides no implementation. Neshan SDK is JS-heavy (FU-3.3-a). Index renders cards only; per-showroom Neshan iframe lives on detail (`<ShowroomMapEmbed>` reads `mapEmbedUrl` or falls back to a Neshan-search link by `geo`). |
| ShowroomDetail layout | Sticky breadcrumb (matches 3.2 PDP pattern) → `ShowroomHero` (full-bleed cover + name + headline overlay, dark-overlay gradient when image is present, ivory/charcoal swap when not) → 60/40 `<Split>`: left = description (richText) + map embed; right = address block + phone (PhoneLink) + email + hours table + holiday hours + parking/transit notes + CTAs (تماس / رزرو بازدید / مسیریابی). Below split: gallery (`<ImageGallery>`), featured products row (reuses 3.2 ProductCard via new `<ShowroomFeaturedProductsRow>`), form slot. |
| Persian day labels | Inline Persian labels in `<ShowroomHoursTable>` (no `@zhic/locale.PERSIAN_WEEKDAYS` re-use because the showroom day enum starts on Saturday, not Sunday like JS Date). Day order = `['sat','sun','mon','tue','wed','thu','fri']` to match Iranian week. |
| Contact page central phone | Find `is_central=true` showroom (همدان). Render its phone via `<PhoneLink>` at `text-h2` size. Fall back to `Contact.phone` global if no central is set. Other showrooms render as a grid below. |
| Featured products on showroom detail | Uses spec §28 `featuredProductIds`. Hidden when empty (no fallback to "all products in this category"). Seed populates each of the 3 showrooms with 2-3 products from the 3.2 catalog. |
| Map embed | `<iframe src={mapEmbedUrl}>` inside `<Aspect ratio="16/9">` when set. Fallback to a small "نقشه‌ی تعاملی به‌زودی" card with a "دیدن در نشان" link if `neshanProfileUrl`/`googleBusinessProfileUrl`/`geo` is available. No empty fallback if nothing is set. |
| Seed expansion | Hamedan rewritten to new schema with structured address, hours array (شنبه–پنجشنبه ۱۰:۰۰–۲۰:۰۰, جمعه closed), headline, description (3-paragraph Lexical), 3 featured products. Add Tehran (سعادت‌آباد, hours 11:00–21:00) + Esfahan (چهارباغ, `appointmentOnly: true`, weekends extended) so the index has density and the central/branch + appointment-only paths render in demo. All 3 use fictional manager names + phones consistent with 1.3 seed posture. |
| Caching | Per-resource tags: `showrooms`, `contact`. 5-minute revalidate window (matches 3.1/3.2 posture). Tag-based purge wires in 7.1 (FU-3.1-e — single webhook handles all). |
| Persian 404 | Already shipped in 3.2; `notFound()` in `/showrooms/[slug]` triggers it. |
| api-client / richtext promotion | **Defer** (FU-3.1-b, FU-3.1-c) — same rationale as 3.2: no consumer outside `apps/web` yet; PDP showroom description uses the same Lexical node set the existing serializer covers. |
| Motion | **Zero motion** (matches 3.1/3.2 posture). Sticky purchase column / sticky breadcrumb is layout, not motion. All reveal/scroll choreography is 6.2. |
| Images | Raw `<img>` (FU-3.1-l / FU-2.3-g acknowledged). Cover and gallery fall back to `<Aspect>` cream placeholders when seed has no media. |
| `generateStaticParams` | Skip on `/showrooms/[slug]` for now (FU-3.2-s same rationale). `/showrooms` index is still SSG via revalidate window. |

## Deliverables

### `services/api/src/collections/Showrooms.ts` — REWRITTEN

Per spec §28 modulo Pkg-3+ fields. Field order: identity (name/slug)
→ editorial (headline/description) → media (cover/gallery) → location
(address group / geo) → contact (phone/email) → schedule (hours /
holidayHours / appointmentOnly) → orientation (parking/transit) →
relations (featuredProductIds) → external profiles (Google / Neshan
/ map embed) → internal-only (manager_name/phone, is_central — kept
for SMS routing in 5.1, sidebar-positioned).

`hours` array entries gain `validate: validateTime` on `opens`/`closes`
(regex `^([01]?\d|2[0-3]):[0-5]\d$`). Day select uses Persian labels
with ASCII enum values matching `ShowroomDay` in `lib/payload.ts`.

### `services/api/src/seed.ts` — MIGRATE + EXTEND

Hamedan rewritten to new schema. Two new showrooms (Tehran, Esfahan)
with full data including featured product references. Helper
`weekdays10to20(open[], closed[], opens?, closes?)` keeps hours array
construction terse.

### `packages/locale/src/phone.ts` — EXTEND

```ts
export function normalizeLandline(input: string): string;
export function formatLandline(e164: string): string;
export function isIranianLandline(input: string): boolean;
export type PhoneClassification =
  | { kind: 'mobile'; e164: string; display: string }
  | { kind: 'landline'; e164: string; display: string };
export function classifyPhone(input: string): PhoneClassification | null;
```

`LANDLINE_LOCAL_RE = /^0[2-8]\d{9}$/` (1 + 1 + 9 = 11 chars: leading 0
+ 2-digit area code starting with 2-8 + 8-digit local). The 9 in
mobile prefixes is reserved, so `0[2-8]` excludes mobile inputs.

### `packages/locale/src/index.ts` — EXTEND

Re-export the four new functions + `PhoneClassification` type.

### `packages/locale/test/phone.test.ts` — EXTEND

+11 cases across `normalizeLandline` (8), `formatLandline` (2),
`isIranianLandline` (2), `classifyPhone` (3) — boundary checks for
each input format, both directions, and the mobile/landline disambiguation.

Total locale test count: 53 → **69**.

### `packages/ui/src/PhoneLink.tsx` — NEW

```tsx
export type PhoneLinkProps = {
  raw: string;
  inline?: boolean;
  className?: string;
};
export function PhoneLink({ raw, inline, className }: PhoneLinkProps);
```

Resolution: `classifyPhone(raw)` → if recognized, render `<a tel:>` or
`<span>` (inline mode). If unrecognized, fall back to `<span dir="ltr">{toPersianDigits(raw)}</span>`
with no anchor — so seed rows that haven't been normalized yet still
render legibly without a broken `tel:` link. Closes FU-2.3-c.

### `packages/ui/src/index.ts` — EXTEND

Add `PhoneLink` named export + `PhoneLinkProps` type export.

### `apps/web/src/lib/payload.ts` — EXTEND

New types: `PayloadAddress`, `PayloadGeo`, `ShowroomDay`,
`ShowroomHourEntry`, `ShowroomHolidayEntry`, `PayloadContact`.
Rewrite `PayloadShowroom` to the new shape (drops `city`/`address(text)`/`hours(text)`,
adds 14 fields).

New fetchers: `fetchAllShowrooms()`, `fetchShowroom(slug)`,
`fetchContact()`.

New helper: `showroomPath(slug)`.

### `apps/web/src/lib/jsonld.ts` — EXTEND

Three new helpers:

- `localBusinessJsonLd(showroom, baseUrl)` — `@type: 'FurnitureStore'`,
  `PostalAddress` joining granular address fields with `، ` separator,
  `GeoCoordinates` from `geo`, `openingHoursSpecification` from
  non-closed `hours` entries (day enum mapped via `SCHEMA_DAY`),
  `telephone` (E.164 stored value), `email`, `image` (gallery + cover
  hoisted), `sameAs` (Google + Neshan profile URLs).
- `itemListJsonLd(items, baseUrl, listName?)` — for `/showrooms`.
- `contactPageJsonLd({name, url, description})` — for `/contact`.

### `apps/web/src/components/showrooms/`

```
ShowroomHero.tsx                # full-bleed cover + name + headline + city
ShowroomAddressBlock.tsx        # structured Persian address (multi-line)
ShowroomHoursTable.tsx          # Persian day names, Persian-digit times, closed → "تعطیل"
ShowroomHolidayHours.tsx        # bordered card listing holidays + hours
ShowroomMapEmbed.tsx            # iframe with fallback link card
ShowroomCtas.tsx                # تماس + رزرو بازدید + مسیریابی buttons
ShowroomFeaturedProductsRow.tsx # 4-up grid of ProductCard, hidden when empty
```

### `apps/web/src/components/contact/`

```
CentralPhoneCallout.tsx   # big phone for is_central showroom
ContactFormSlot.tsx       # placeholder until 5.1
```

### `apps/web/src/app/(site)/showrooms/page.tsx` — NEW

Fetches all showrooms via `fetchAllShowrooms()`. Breadcrumb +
H1/intro + grid of `ShowroomCard` (responsive `columns: 3 if ≥3 else 2`).
Empty-state Persian copy linking to `/contact`. JSON-LD `ItemList` +
`BreadcrumbList`. Static metadata.

### `apps/web/src/app/(site)/showrooms/[slug]/page.tsx` — NEW

Fetches by slug at `depth=3` (resolves `featuredProductIds[].gallery[0]`).
`notFound()` on miss → triggers 3.2's Persian `not-found.tsx`.
Layout: sticky breadcrumb → `ShowroomHero` → 60/40 `<Split>` → gallery
(`<ImageGallery>`) when present → `ShowroomFeaturedProductsRow` →
`<ContactFormSlot>`. JSON-LD `LocalBusiness` + `BreadcrumbList`.
`generateMetadata` reads showroom's headline / description for the
description meta, falls back to "شوروم ژیک در {city}".

### `apps/web/src/app/(site)/contact/page.tsx` — NEW

Fetches `Contact` global + all showrooms in parallel. Finds central
showroom (`is_central=true`); falls back to first showroom; falls back
to `Contact.phone` global if no showroom has phone set. Layout:
breadcrumb → H1 + intro → `<CentralPhoneCallout>` → optional
fallback-phone callout → grid of "other showrooms" (excluding central)
→ `<ContactFormSlot>`. JSON-LD `ContactPage` + `BreadcrumbList`.

### `apps/web/src/components/home/HomeShowroomsStrip.tsx` — UPDATE

Adapt to the new `PayloadShowroom` shape: `showroom.address?.city`,
derived `addressLine`, derived `hoursSummary`, `<PhoneLink raw={...} inline />`
inside the linked card (no nested `<a>`).

## Exit check

- [x] `pnpm --filter @zhic/api typecheck` passes.
- [x] `pnpm --filter @zhic/api lint` passes (clean).
- [x] `pnpm --filter @zhic/locale typecheck` passes.
- [x] `pnpm --filter @zhic/locale test` passes (69 tests, was 53 + 16
      new for landline + classifyPhone).
- [x] `pnpm --filter @zhic/ui typecheck` passes.
- [x] `pnpm --filter @zhic/ui lint` passes (3 pre-existing warnings,
      no new ones from `PhoneLink`).
- [x] `pnpm --filter @zhic/web typecheck` passes.
- [x] `pnpm --filter @zhic/web lint` passes (12 expected `<img>`
      warnings; +3 new from this session — same FU-3.1-l / FU-2.3-g
      lineage).
- [x] `pnpm --filter @zhic/web test` passes (29 tests unchanged from 3.2).
- [x] `pnpm --filter @zhic/web build` passes; route map shows
      `/showrooms` ○ Static (5m revalidate), `/showrooms/[slug]` ƒ
      Dynamic, `/contact` ○ Static (5m revalidate).
- [x] `pnpm --filter @zhic/api seed` runs clean against a dev DB
      (verified locally by user — sandbox limitation per FU-3.1-q).
- [x] No physical-direction Tailwind utilities anywhere in
      `apps/web/src/components/{showrooms,contact}/**` —
      `grep -RE '\b(m\|p\|text\|border)-(l\|r)-' apps/web/src/components/{showrooms,contact}` → empty.
- [x] No raw hex / rgb in those dirs.
- [x] `docs/state.md` updated: 3.3 ✅ with this commit hash; 3.4 / 4.1
      / 4.2 entry notes carry forward; FU-3.1-k closed; FU-3.1-n closed;
      FU-2.3-c closed.

## Follow-ups to log

- **FU-3.3-a** All-pins map on `/showrooms` (Neshan/OSM SDK embed).
  JS-heavy — Session 6.x (motion + map polish) or post-Pkg-2.
- **FU-3.3-b** Form integration on `/contact` + `/showrooms/[slug]`
  → Session 5.1 (form is a 5.1 deliverable; slot placeholders ship
  here with the `?showroom=<slug>&reason=visit` and PDP's
  `?product=<slug>&reason=quote` query-param contract already wired
  for 5.1 to read).
- **FU-3.3-c** `managerUserId` rel → `users` collection. Pkg 3 (CRM
  needs `users` table). Today's `manager_name` / `manager_phone` text
  fields cover the SMS-routing data path until then.
- **FU-3.3-d** Showroom-specific `stockLevels` integration on detail
  page (per-location stock per product). Pkg 3 per `data-schemas.md`
  §21.
- **FU-3.3-e** `holidayHours` actual data + UI handling for Iranian
  holidays (Nowruz 1404, شب یلدا, etc.). Needs the client to provide
  the calendar; UI is ready (`<ShowroomHolidayHours>` shipped here).
- **FU-3.3-f** `appointmentOnly` UX — show a stronger "بازدید فقط با
  هماهنگی قبلی" callout instead of the small footnote, and make the
  primary CTA "هماهنگی بازدید" instead of "تماس". Today the page sets
  a small footnote when true; Esfahan seed exercises the path.
- **FU-3.3-g** `<MapEmbed>` primitive in `@zhic/ui` when a 2nd
  consumer appears (likely 4.2 atelier or events page).
- **FU-3.3-h** `googleBusinessProfileUrl` + Neshan profile — link-out
  treatment (small icon row beside CTAs?). Today they're consumed only
  by JSON-LD `sameAs` and the map fallback link.
- **FU-3.3-i** `seo` group on Showrooms — Session 6.1.
- **FU-3.3-j** `status` / `publishedAt` on Showrooms — carries forward
  FU-1.3-a; ships when a draft / preview workflow is needed.
- **FU-3.3-k** Real showroom imagery + media uploads via Payload seed.
  Carries forward FU-3.1-f / FU-2.3-l. Cover + gallery currently
  render placeholder cream blocks.
- **FU-3.3-l** Promote `weekdays10to20()` helper from seed to a
  shared `services/api/src/lib/showroomHours.ts` if a 2nd seed file
  or admin import script appears.
- **FU-3.3-m** Header mega-menu showroom list under "درباره‌ی ما" per
  `sitemap.md` §5. Carries forward FU-2.2-a.
- **FU-3.3-n** Tehran/Esfahan/Hamedan in seed are fictional address +
  manager + phone data — replace with the brand's real locations
  before any client demo where these get inspected.
- **FU-3.3-o** `<noscript>` fallback for `<iframe>` map embed (Iranian
  ISPs occasionally block third-party iframes). Show a static map
  image or Neshan link.

## Deferred

- All FU-3.3-* listed above.
- FU-3.1-a (motion) → 6.2.
- FU-3.1-b (api-client promotion) → operator app outside `apps/web`.
- FU-3.1-c (richtext promotion) → 4.1 articles.
- FU-3.1-d (Org / WebSite JSON-LD on `/`) → 6.1. **LocalBusiness +
  ItemList + ContactPage shipped here, narrowing the 6.1 backlog.**
- FU-3.1-e (revalidateTag webhook) → 7.1.
- FU-3.1-l (Next/Image migration) → 7.1 + post-7.1 wiring.
- FU-3.1-m (`<Bleed>` primitive) → 4.1 articles likely.
- FU-3.1-q (sandbox no-postgres) — same constraint applies to 3.3
  verification.
- FU-3.2-s (`generateStaticParams`) → 7.1 infra.

## Implementation notes (post-execution)

- **Schema migration was breaking, no data loss.** Same posture as
  3.2's `materials` array drop — no production data; seed is the
  only consumer. `address (text)`, `hours (text)`, standalone `city`
  dropped outright.
- **`HomeShowroomsStrip` was the only existing consumer** of the
  dropped fields. Updated in-session: derive `city` / `addressLine` /
  `hoursSummary` from the new shapes.
- **`LANDLINE_LOCAL_RE` was off-by-one** initially (`/^0[2-8]\d{8}$/`
  expected 10 chars; Iranian local landline is 11 chars: `0` + 2-digit
  area code + 8-digit local). Caught by the test suite. Final regex
  `/^0[2-8]\d{9}$/`.
- **PhoneLink fallback path** renders Persian-digit pass-through
  with no anchor when `classifyPhone` returns null. Avoids broken
  `tel:` links if a seeded number doesn't normalize cleanly.
- **No new Vitest cases for `<ShowroomHoursTable>` / `<ShowroomMapEmbed>`**
  since they're page-specific compositions (same posture as 3.1/3.2
  blocks). The pure helpers in `lib/products.ts` stay under test.
- **Sandbox limitation** per FU-3.1-q: schema, seed, fetchers, pages
  all compile + typecheck + lint clean and the build succeeds against
  a Payload service that returns null (graceful-fallback path).
  Populated render path needs local `docker compose up postgres` +
  `pnpm --filter @zhic/api seed` + `pnpm --filter @zhic/api dev`.
- **Build output** shows `/showrooms` and `/contact` as `○ Static`
  with 5m revalidate (Next prerendered via `revalidate: 300` window
  in the underlying `payloadFetch`) — exactly the cache posture the
  3.1/3.2 helpers established. `/showrooms/[slug]` is `ƒ Dynamic`
  per the FU-3.2-s decision (no `generateStaticParams` until 7.1).
- **`<noscript>` for `<iframe>` map** not added — logged FU-3.3-o.
  Iranian ISP iframe-blocking is a real concern for 7.1 production.
