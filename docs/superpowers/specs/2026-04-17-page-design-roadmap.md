# Page Design Roadmap — Package 1

**Goal:** Design every Package 1 page with the Asymmetric Luxury visual language, get approval via mockups, document decisions in the design system spec, then wire everything into the live Next.js site.

**Process per page:**
1. Build 2-3 HTML mockup options (served at `80.240.31.146:9090`)
2. User picks a direction
3. Refine the chosen option (mobile, interactions, token usage)
4. Document layout decisions in `docs/spec/design-system.md`
5. Mark as approved → ready for implementation

**After all pages are designed:**
6. Write implementation plan for wiring mockups into React components
7. Execute implementation
8. Visual QA on dev server

---

## Phase A — High-Impact Pages (2-3 options each)

These pages have unique layouts that define the brand experience. Each gets multiple mockup options to choose from.

| # | Page | Route | Why unique | Key design questions |
|---|------|-------|-----------|---------------------|
| A1 | Product Index | `/products` | Filter UX + grid composition | Sidebar filters vs top bar? Grid density? How does the asymmetric style work with a functional catalog? |
| A2 | Product Detail (PDP) | `/products/[slug]` | The money page — drives inquiry | Media stage layout? Sticky purchase panel? How does luxury feel with functional spec tables? |
| A3 | Journal Index | `/journal` | Editorial flagship | Magazine grid vs list? Featured article prominence? Category nav style? |
| A4 | Article Page | `/journal/[slug]` | Long-form reading | TOC placement? Pull quotes? Image treatment? Reading width? |
| A5 | Showroom Detail | `/showrooms/[slug]` | Physical brand experience bridge | Map + address layout? Hours table? How to make a location page feel luxurious? |
| A6 | Contact | `/contact` | Conversion endpoint | Form prominence? Showroom grid integration? How glass system works with the form? |

**Estimated effort:** ~2-3 mockup files per page × 6 pages = 12-18 mockups → 6 approved designs.

---

## Phase B — Template Pages (1 version each, follows homepage direction)

These pages reuse patterns established in Phase A. One mockup each, reviewed and approved.

| # | Page | Route | Inherits from | Unique element |
|---|------|-------|--------------|----------------|
| B1 | Showroom Index | `/showrooms` | Homepage showroom section | Full-page version of glass cards |
| B2 | Collection Landing | `/collections/[slug]` | Product Index (A1) | Editorial intro + filtered grid |
| B3 | Category Landing | `/categories/[slug]` | Product Index (A1) | Category description + filtered grid |
| B4 | About | `/about` | Article Page (A4) | Brand story — editorial single-column |
| B5 | Atelier | `/atelier` | Article Page (A4) | Workshop story — image-heavy |
| B6 | FAQ | `/faq` | Standalone | Accordion component showcase |
| B7 | Events | `/events` | Standalone | Event card list — date-driven |
| B8 | Care | `/care` | Article Page (A4) | Product care guide |

**Estimated effort:** ~1 mockup per page × 8 pages = 8 mockups.

---

## Phase C — Utility Pages (no mockup needed)

These use a shared `LegalPageTemplate` or are simple one-offs. Design decisions are minimal.

| Page | Route | Treatment |
|------|-------|-----------|
| Privacy | `/privacy` | Legal template — charcoal text on ivory, max-width prose |
| Terms | `/terms` | Same |
| Returns | `/returns` | Same |
| Shipping | `/shipping-and-delivery` | Same |
| Thank You | `/thank-you` | Centered confirmation with subtle animation |
| Not Found | `404` | Existing — already built |
| Error | `500` | Existing — already built |

**Estimated effort:** 1 shared template mockup.

---

## Phase D — Implementation

After all designs are approved and documented:

| Step | What | Effort |
|------|------|--------|
| D1 | Homepage implementation | Wire `homepage-c-full.html` into HomeHero, HomeBrandStatement, etc. |
| D2 | Product pages implementation | Wire A1 + A2 approved designs into existing components |
| D3 | Journal pages implementation | Wire A3 + A4 |
| D4 | Showroom + Contact implementation | Wire A5 + A6 |
| D5 | Template pages implementation | Wire B1-B8 |
| D6 | Legal template refinement | Wire Phase C template |
| D7 | Cross-page visual QA | Full walkthrough on dev server, mobile + desktop |
| D8 | Design system doc finalization | All page layouts documented in spec |

---

## Execution Order

```
Session N:   A1 (Product Index) — 3 options → pick → refine → document
Session N+1: A2 (PDP) — 3 options → pick → refine → document
Session N+2: A3 (Journal Index) + A4 (Article) — they're related, design together
Session N+3: A5 (Showroom Detail) + A6 (Contact) — both conversion pages
Session N+4: B1-B8 (Template pages) — batch, 1 option each
Session N+5: Phase C (Legal template) + Phase D1-D3 (start implementation)
Session N+6: Phase D4-D8 (finish implementation + QA)
```

Each "session" is one focused conversation. Some may combine if the designs are quick to settle.

---

## Design System Documentation Checklist

For each approved page design, add to `docs/spec/design-system.md` §8 Templates:

- [ ] Section order and backgrounds
- [ ] Grid/layout structure (desktop + mobile)
- [ ] Which components from `@zhic/ui` are used
- [ ] Where color accents appear (forest/gold moments)
- [ ] Interaction behavior specific to that page
- [ ] Mobile breakpoint behavior
- [ ] Any new patterns or components needed

---

## Current Status

| Phase | Status |
|-------|--------|
| Homepage (Option C) | ✅ Approved — `.superpowers/homepage-c-full.html` |
| A1 Product Index | ✅ Option C — asymmetric hero + 4-col grid — `.superpowers/a1-product-index.html` |
| A2 PDP | ✅ Option C — cinematic 21:9 hero + cream sidebar — `.superpowers/a2-pdp.html` |
| A3 Journal Index | ✅ Option B — magazine editorial with featured article — `.superpowers/a3-journal-index.html` |
| A4 Article Page | ✅ Option B — full-bleed hero, centered prose, no TOC — `.superpowers/a4-article.html` |
| A5 Showroom Detail | ✅ Option B — glass card overlay on hero, 3 info cards — `.superpowers/a5-showroom.html` |
| A6 Contact | ✅ Option B — dark hero + frosted glass form — `.superpowers/a6-contact.html` |
| Phase B (8 template pages) | ✅ All 8 approved — `.superpowers/b-template-pages.html` |
| Phase C (legal template) | ✅ Approved — `.superpowers/c-legal-template.html` |
| Phase D (implementation) | ⬜ Ready to start |
