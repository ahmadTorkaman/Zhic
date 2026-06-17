# Bedroom-set detail page — CMS wiring (materials · design-details · intro · story)

**Date:** 2026-06-17
**Branch:** `feat/journal-rebuild`
**Status:** design approved — pending spec review → implementation plan

---

## 1. Context & problem

`/bedroom-set/[age]/[design]` (the series-hub detail page, Figma `261:90`) renders
from `apps/web/src/lib/series-hub-content.ts → getSeriesHubContent(slug, ageFilter)`.

- **`iron` (آیرون)** is a pixel-exact **static seed** (`IRON` const, local media under
  `/public/bedroom-set/iron`). It stays a seed — untouched by this work.
- **Every other design** is mapped live from Payload. But four rich sections are
  hard-coded `null` in the non-iron branch (`series-hub-content.ts:218–222`):
  `intro`, `materials`, `details`, `story`. They have **no CMS home**, so they
  never render for any non-iron design.

The section components (`SeriesMaterials`, `SeriesDesignDetails`, `SeriesLinkCard`)
and the parent (`SeriesHubBody`) already **degrade gracefully**: a section is
mounted only when its content is present (`SeriesHubBody.tsx:22–34`), and the
materials/details children also bail on an empty `items` array.

**Goal:** give these four sections a CMS home on the `Designs` collection and map
them in the non-iron branch, so they light up the moment an editor adds content.

---

## 2. Rendering contract (constrains the schema)

From `SeriesLinkCard.tsx` / `SeriesHubBody.tsx` / the section components:

| Section | Shape consumed | Renders only when |
| --- | --- | --- |
| **intro** (`261:196`) | `SeriesEditorialCard {title, body, href, img}`, mounted with `showMore={false}` → **title + body + photo, no link** (`href` unused) | a photo exists (the `<photo>` div always renders → no img = broken) |
| **story** (`261:189`) | same shape, mounted with `flip` + read-more → **title + body + photo + «بیشتر بخوانید →»** linking to `href` | a photo exists |
| **materials** (`261:175`) | `{heading, items: SeriesMaterial[]}`; `SeriesMaterial {key, name, sub, img}` (img non-null) | `items.length > 0` |
| **details** (`261:155`) | `{heading, items: SeriesDetail[]}`; `SeriesDetail {key, label, desc, img, span}` (img non-null, `span` = relative tile width via `flexGrow`) | `items.length > 0` |

Section **headings** are conventionally hard-coded in the getter (the non-iron
branch already hard-codes `collection.heading = 'قطعات سرویس'`). So
«متریال های استفاده شده», «جزئیات طراحی», and the story title «داستان طراحی»
are constants in the getter — **not** CMS fields. Only the intro **title** is
per-design content.

---

## 3. Scope

**In scope** — wire all four sections for non-iron designs:
- `materials` — self-contained per-design array (operator-approved).
- `designDetails` — self-contained per-design array.
- `intro` — dedicated fields (title + body + photo).
- `story` — dedicated fields (body + photo; title is the constant «داستان طراحی»).

**Out of scope:**
- Uploading the real media/copy for the ~25 non-iron designs — that is an
  artist/operator content task via the admin UI (no assets in-repo). Until
  uploaded, sections stay hidden exactly as today.
- Moving `iron` into the CMS (stays a static seed).
- Applying the migration / regenerating types **automatically** — done as a
  deliberate, confirmed step (see §8).
- Wiring any other page's Payload sections ("separate session" per the board).

---

## 4. Schema — new fields on `Designs` (`services/api/src/collections/Designs.ts`)

All wrapped in a **UI-only `collapsible`** «محتوای صفحه‌ی جزئیات طرح»
(`initCollapsed: true`). `collapsible` is presentational — it does **not**
namespace DB columns, so column names stay flat. Persian labels + admin
descriptions match the existing field style.

```ts
{
  type: 'collapsible',
  label: 'محتوای صفحه‌ی جزئیات طرح',
  admin: { initCollapsed: true },
  fields: [
    { name: 'introTitle', type: 'text',     label: 'عنوان کارت معرفی' },
    { name: 'introBody',  type: 'textarea',  label: 'متن کوتاه کارت معرفی' },
    { name: 'introMedia', type: 'upload', relationTo: 'media', label: 'تصویر کارت معرفی',
      admin: { description: 'بدون این تصویر، کارت معرفی نمایش داده نمی‌شود.' } },

    { name: 'storyBody',  type: 'textarea',  label: 'متن داستان طراحی' },
    { name: 'storyMedia', type: 'upload', relationTo: 'media', label: 'تصویر داستان طراحی',
      admin: { description: 'بدون این تصویر، کارت داستان نمایش داده نمی‌شود.' } },

    {
      name: 'materialCallouts',
      type: 'array',
      label: 'متریال‌های استفاده‌شده',
      labels: { singular: 'متریال', plural: 'متریال‌ها' },
      admin: { description: 'متریال‌های شاخص کارت «متریال‌های استفاده‌شده». ترتیب از راست به چپ. نیاز به تصویر دارد.' },
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true, label: 'تصویر دایره‌ای' },
        { name: 'label', type: 'text', required: true, label: 'نام (مثلاً فلز)' },
        { name: 'sub',   type: 'text', label: 'زیرنویس (مثلاً رنگ پودری الکترواستاتیک پوشش مات)' },
      ],
    },

    {
      name: 'designDetails',
      type: 'array',
      label: 'جزئیات طراحی',
      labels: { singular: 'جزئیات', plural: 'جزئیات طراحی' },
      admin: { description: 'کاشی‌های تصویری نوار «جزئیات طراحی». ترتیب از راست به چپ. نیاز به تصویر دارد.' },
      fields: [
        { name: 'image',       type: 'upload', relationTo: 'media', required: true, label: 'تصویر کاشی' },
        { name: 'label',       type: 'text', required: true, label: 'عنوان' },
        { name: 'description',  type: 'textarea', label: 'توضیح کوتاه' },
        { name: 'span',        type: 'number', defaultValue: 100, label: 'وزن عرض کاشی',
          admin: { description: 'عرض نسبی کاشی در نوار. پیش‌فرض ۱۰۰ = عرض برابر.' } },
      ],
    },
  ],
}
```

Notes:
- The details sub-field is named **`description`** (not `desc`) to avoid the SQL
  reserved word `desc`; the web getter maps `description → desc`.
- `span` carries a form default of `100`; the DB column is plain nullable
  `numeric` and the getter applies `span ?? 100` (equal-width tiles for non-iron;
  iron's comp widths 83/117/75/118 live only in the static seed).

---

## 5. DB migration — hand-written, additive

`migrate:create` is still broken by the `designs_occupancies` snapshot drift
(prompts to "rename", hangs no-TTY → exit 13). So this is **hand-written and
additive only** (`ADD COLUMN IF NOT EXISTS` / `CREATE TABLE IF NOT EXISTS`,
`duplicate_object`-guarded constraints), mirroring `designs_occupancy_media`
from `20260606_120000_add_bedroom_set_fields.ts`. It never touches
`designs_occupancies`.

File: `services/api/src/migrations/20260617_120000_add_design_detail_fields.ts`
(register in `migrations/index.ts`, after `20260615_120000_add_bedroom_set_intros`).

Column/table mapping (Payload camelCase → snake_case):

| Field | DB object |
| --- | --- |
| `introTitle` | `designs.intro_title` varchar |
| `introBody` | `designs.intro_body` varchar |
| `introMedia` | `designs.intro_media_id` integer → FK `media(id)` ON DELETE SET NULL |
| `storyBody` | `designs.story_body` varchar |
| `storyMedia` | `designs.story_media_id` integer → FK `media(id)` ON DELETE SET NULL |
| `materialCallouts[]` | table `designs_material_callouts` (`_order` int, `_parent_id` int → designs CASCADE, `id` varchar PK, `image_id` int → media SET NULL, `label` varchar, `sub` varchar) + `_order`/`_parent_id`/`image` btree indexes |
| `designDetails[]` | table `designs_design_details` (`_order` int, `_parent_id` int → designs CASCADE, `id` varchar PK, `image_id` int → media SET NULL, `label` varchar, `description` varchar, `span` numeric) + `_order`/`_parent_id`/`image` btree indexes |

`down()` drops both tables and the two scalar FKs + five columns (mirroring the
template's `down`).

---

## 6. Web data mapping

### 6.1 `PayloadDesign` type (`apps/web/src/lib/payload.ts`)

Extend with (mirroring how `occupancyMedia` is typed — `image` is the media type):

```ts
introTitle?: string;
introBody?: string;
introMedia?: PayloadMedia | null;
storyBody?: string;
storyMedia?: PayloadMedia | null;
materialCallouts?: { image?: PayloadMedia | null; label?: string; sub?: string }[];
designDetails?: { image?: PayloadMedia | null; label?: string; description?: string; span?: number }[];
```
(use the actual media type name already used by `occupancyMedia` in this file.)

### 6.2 Getter (`series-hub-content.ts`, non-iron branch — replace the four `null`s)

```
intro    = introMedia ? { title: introTitle ?? ageTitle ?? design.name,
                          body: introBody ?? '', href: '#', img: mediaUrl(introMedia) }
                      : null
story    = (storyMedia && storyBody) ? { title: 'داستان طراحی', body: storyBody,
                          href: '#', img: mediaUrl(storyMedia) } : null
materials = rows of materialCallouts with a resolvable image →
            { heading: 'متریال های استفاده شده',
              items: [{ key, name: label, sub: sub ?? '', img }] }   // null if no valid rows
details   = rows of designDetails with a resolvable image →
            { heading: 'جزئیات طراحی',
              items: [{ key, label, desc: description ?? '', img, span: span ?? 100 }] }  // null if none
```

- `key` = the array row `id` (fallback index).
- Order is preserved as authored (operator authors right→left to match the comp,
  same convention as `occupancyMedia` / the iron seed).
- `mediaUrl` is the existing helper; `ageTitle = OCCUPANCY_TITLE[ageFilter]`.

No change to `SeriesHubContent` types or any component — the existing nullable
wrappers and empty-array guards already handle presence/absence.

---

## 7. Docs — `data-schemas.md`

There is currently **no `designs` collection documented** in `docs/spec/data-schemas.md`
(confirmed). Project rule: "no CMS collection field added without updating
`data-schemas.md`." Add a `designs` collection section documenting the full
current field set **plus** the seven new fields, so the doc reflects reality.

---

## 8. Build / apply / verify

1. **Static checks (local):** `pnpm --filter @zhic/api typecheck` + lint;
   `pnpm --filter @zhic/web typecheck` + lint; `pnpm --filter @zhic/web build`.
2. **Regenerate Payload types** (`pnpm --filter @zhic/api generate:types`) — may
   hit the known Node-24 boot issue; if it fails, hand-edit `payload-types.ts`
   to add the new fields (the migration + collection are the source of truth).
3. **Apply migration deliberately:** `pnpm -C services/api migrate` on the box —
   **confirm with operator first**; additive + reversible. (The board's standing
   step; not auto-run.)
4. **Verify** in `/lab/series-hub` (iron unchanged) and on a non-iron design once
   sample content is entered via admin.

---

## 9. Post-wiring content audit (`FU-SHD-a`)

After this wiring lands, run a **one-pass "unhide empty sections" audit**:
temporarily render intro/story/materials/designDetails even when empty (with a
visible «needs content» placeholder) across every non-iron design, to inventory
exactly which design is missing which media/copy. **Diagnostic only — must NOT
ship to production**; gate behind a dev/query flag or revert before deploy.
Logged in `docs/state.md` Follow-ups as `FU-SHD-a`.

---

## 10. Touchpoints

1. `services/api/src/collections/Designs.ts` — collapsible + 7 fields
2. `services/api/src/migrations/20260617_120000_add_design_detail_fields.ts` (new) + `migrations/index.ts`
3. `services/api/src/payload-types.ts` — regenerate (or hand-edit)
4. `apps/web/src/lib/payload.ts` — `PayloadDesign` type
5. `apps/web/src/lib/series-hub-content.ts` — non-iron mapping (the four `null`s)
6. `docs/spec/data-schemas.md` — add `designs` collection section
7. `docs/state.md` — `FU-SHD-a` (done) + session row at session end

---

## 11. Risks

- **Migration/schema drift:** hand-written DDL must match Payload's expected
  shape exactly (mirroring `designs_occupancy_media`) or `push`/future
  `migrate:create` sees drift. Mitigation: copy the template DDL verbatim;
  additive + `IF NOT EXISTS`; reversible `down()`.
- **`generate:types` boot bug** (Node 24): fall back to hand-editing
  `payload-types.ts`.
- **No Postgres in some dev contexts:** static checks (tsc/eslint/build) verify
  the code; the data-populated path is verified on the box after `migrate` +
  sample content.
