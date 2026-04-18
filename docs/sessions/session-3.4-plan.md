# Session 3.4 — Legal + Static Pages

## Goal

Ship the **legal and static surface** of the storefront: `/privacy`,
`/terms`, `/returns`, `/shipping-and-delivery`, and `/thank-you`.
These close the four footer links that currently 404 and provide the
post-inquiry redirect target for Session 5.1.

Authority: `docs/sessions.md` §3.4,
`docs/package1-month1.md` §Pages,
`docs/spec/sitemap.md` §2 (privacy, terms, returns, shipping-and-delivery, thank-you rows).

## Entry state

- 3.3 just shipped: `/showrooms` + `/showrooms/[slug]` + `/contact`.
  All Phase 3 core pages except legal are live.
- Four Payload globals exist from 1.3 (Privacy, Terms, Returns,
  Shipping), each with identical shape: `title (text)` + `body (richText)`.
  No schema changes needed.
- `lib/richtext.tsx` handles the needed Lexical node set.
- `lib/jsonld.ts` ships all needed helpers from 3.2/3.3.
- Footer links to `/privacy`, `/terms`, `/returns`,
  `/shipping-and-delivery` all currently 404.

## Deliverables

### `apps/web/src/lib/payload.ts` — EXTEND

New type `PayloadStaticPage` (`title?`, `body?`).
New fetcher `fetchPage(slug: 'privacy' | 'terms' | 'returns' | 'shipping')`.

### `apps/web/src/lib/jsonld.ts` — EXTEND

New helper `articlePageJsonLd({ headline, url, description, datePublished?, dateModified? })`
for `/returns` and `/shipping-and-delivery` (per sitemap.md: `Article` JSON-LD).

### `apps/web/src/components/legal/LegalPageTemplate.tsx` — NEW

Generic template: breadcrumb + h1 + `<RichText>` body + JSON-LD slot.
Empty-state placeholder when CMS body is null.

### Route files — NEW (5 files)

| Route | Template | JSON-LD | CMS source |
|---|---|---|---|
| `/privacy` | LegalPageTemplate | BreadcrumbList only | `privacy` global |
| `/terms` | LegalPageTemplate | BreadcrumbList only | `terms` global |
| `/returns` | LegalPageTemplate | Article + BreadcrumbList | `returns` global |
| `/shipping-and-delivery` | LegalPageTemplate | Article + BreadcrumbList | `shipping` global |
| `/thank-you` | Static | none | none (hardcoded Persian copy, `noindex`) |

Each legal page: `generateMetadata` from CMS title + body excerpt.
`/thank-you`: static metadata with `robots: { index: false }`,
two CTAs (home + products).

## Exit check

- [x] `pnpm --filter @zhic/web typecheck` passes.
- [x] `pnpm --filter @zhic/web lint` passes (12 expected `<img>` warnings).
- [x] `pnpm --filter @zhic/web test` passes (29 tests).
- [x] `pnpm --filter @zhic/web build` passes; route map shows all 5
      new routes as `○ (Static)`.
- [x] `/privacy`, `/terms`, `/returns`, `/shipping-and-delivery` each
      render LegalPageTemplate with Persian fallback copy when CMS body
      is empty; with CMS body populated via Payload admin they render
      the richtext content.
- [x] `/returns` and `/shipping-and-delivery` contain `Article` +
      `BreadcrumbList` JSON-LD scripts.
- [x] `/privacy` and `/terms` contain `BreadcrumbList` JSON-LD only.
- [x] `/thank-you` renders static Persian copy with home + products
      CTAs; page has `noindex` meta.
- [x] Footer links to `/privacy`, `/terms`, `/returns`,
      `/shipping-and-delivery` all resolve (no more 404).
- [x] `docs/state.md` updated: 3.4 ✅, Phase 3 complete.

## Follow-ups

No new FUs logged — this session is pure wiring.

## Implementation notes (post-execution)

- **No schema changes.** All four globals pre-existed from 1.3 with the
  right shape (`title` + `body`). Zero Payload-side work.
- **Name collision averted:** initial type was named `PayloadPage` which
  collided with the existing pagination generic `PayloadPage<T>`.
  Renamed to `PayloadStaticPage`.
- **Build output:** all 5 routes are `○ (Static)` — prerendered with
  5m revalidate on the 4 legal pages (via `payloadFetch`'s revalidation
  tags), and fully static on `/thank-you` (no data dependency).
- **`LegalPageTemplate` is intentionally generic** — reusable for 4.2's
  `/care`, `/about`, `/atelier` pages which share the same shape
  (global with `title` + `body`). 4.2 may extend with cover images or
  hero blocks but the base template transfers.
