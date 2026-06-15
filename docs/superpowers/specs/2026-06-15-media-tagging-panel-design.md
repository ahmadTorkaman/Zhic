# Media Tagging Panel — Design Spec

**Date:** 2026-06-15
**Status:** Approved design → ready for implementation plan
**Owner:** solo operator (repo owner)

---

## 1. One-line summary

A standalone, keyboard-first, Payload-login-gated route in `apps/web` (`/atelier/tag`) that
lets the operator fast-**review and correct** all ~950 catalog media over **existing fields
only** — the **design-occupancy / age-poster builder first** — writing through a dry-runnable,
JSON-snapshot-backed, reverse-apply-undo mutation layer (the `reconcile-*.mts` pattern), and
wiring the currently-latent `products.occupancies` into a `/bedroom-furniture` age filter via a
one-line `FILTER_PARAM_KEYS` change.

## 2. Why (problem statement)

Catalog scan (2026-06-15, live DB `127.0.0.1:5433`):

- **950 media rows**, all `image/webp`. The `Media` collection has only three editable fields:
  `alt` (521/950 filled), `caption` (0), `decorative` (0). **No classification lives on media.**
- All real meaning lives on the **parent**: every product (271) has `piece_type` (14-value enum)
  and a `design` (0 nulls); occupancy/age lives on products and designs. An image inherits its
  meaning from exactly one parent (gallery image, variant image, or design field).
- **The actually-broken thing is occupancy/age.** `/bedroom-set` age tabs read
  `design.occupancies` + per-age poster images (`designs.occupancyMedia`), **not** product
  occupancy. Only **4 of 27 designs** have posters (9 rows). Product occupancies are over-broad
  (224/270 tagged "teen"). `products.occupancies` is **latent** — nothing on the storefront reads it.
- There is **no tagging workflow** today: the Payload Media list has no thumbnail, no search, no
  `useAsTitle`; classification has only ever been done by running Node `reconcile-*.mts` scripts
  by hand.

So "tag every picture one by one" is really: a fast review surface that confirms/corrects the
**few** parent-level fields (mostly per-design occupancy + per-product occupancy) and the **one**
genuinely per-image field (`alt`), plus triage of orphan media.

## 3. Locked decisions

- **Review over existing fields** — no new per-image classification columns. **Zero schema changes.**
- **Standalone route in `apps/web`**, gated by the existing Payload login. Not a Payload custom admin view.
- **Top priority = occupancy/age correctness**, targeting the **27 designs** (the storefront lever).
- **Product occupancy is also first-class** → we **wire a storefront consumer** (`/bedroom-furniture` age filter).
- **Scope = all 950 media including orphans** (orphan triage in scope).
- **Safety**: dry-run + JSON snapshot backup + reverse-apply undo + audit log; reuse `reconcile-*` mechanics.

### Decisions resolved during review (2026-06-15)

- **Orphan archive disposition:** *soft-relocate* — `reconcile-11` moves the file to a cold/archive
  prefix and **keeps the media row**. Reversible. No hard delete.
- **Orphan "in-use" scope:** an image counts as **in-use** only if referenced by a product gallery,
  a product-variant image, or a design field (`hero/slider/logo/occupancyMedia`). **SEO-og-only**
  references (`*.seo_og_image_id`) are **orphan-eligible**. Wider triage set (~441).
- **Access role:** `admin`, `editor`, `marketing` (matches the `publishedContentAccess` write tier).
- **Cache on apply:** apply calls `revalidateTag` on the affected product/design tags so the
  storefront reflects changes immediately; the existing 300s ISR window is the documented fallback.
- **HOLD list:** derived by filename pattern (`kesho-*`, `*scene*`, `skate-vanity-chair*`) **plus**
  an optional explicit hold-list file; operator may supply exact filenames (see Open items).

## 4. Architecture

**Route.** New gated route group `apps/web/src/app/(internal)/` (the public `/atelier` lives under
`(site)` — do **not** colocate). `(internal)` gets its own layout + middleware so it is never
indexed or cached. Persian-first RTL, Persian digits in UI, ASCII slug. URL drives mode:
`/atelier/tag?mode=occupancy|product|images|orphans` (default `occupancy`).

**Auth gate (net-new — `apps/web` has no auth path today; `payloadFetch` is read-only/unauth/ISR-300s).**
Three layers, default-deny:
1. `(internal)/layout.tsx` (RSC) reads the `payload-token` cookie via `next/headers` `cookies()` and
   calls Payload `GET /api/users/me` server-to-server (`http://127.0.0.1:3001`). No user, or role
   not in `[admin, editor, marketing]` → redirect to `/admin` (Payload login).
2. `middleware.ts` matcher on `/atelier/tag` + `/api/tag/*` short-circuits unauth requests cheaply.
3. Every `/api/tag/*` handler re-verifies the forwarded token + role independently (defense in depth).

**Data reads.** On mode entry the client calls `GET /api/tag/state` (server route under
`apps/web/src/app/(internal)/api/tag/`) which proxies authenticated Payload reads and returns the
snapshot the UI needs (paginated for images). **Orphans are computed at runtime** by unioning every
media-referencing table — never hardcoded.

**Writes.** Mutations `POST /api/tag/preview` (dry, no write → before/after diff incl. product-count
deltas) → `POST /api/tag/apply` (snapshot → idempotent `payload.update({overrideAccess:true})` →
audit JSONL). Reuses the exact `reconcile-*.mts` mechanics. No raw SQL; access/validation hooks run.

**Client state.** TanStack Query for fetch/refetch + a small store for pending edits and keyboard
focus. Apply → invalidate → refetch → scoreboard updates.

## 5. Modes (each independently shippable)

### 5.1 `occupancy` — design poster builder · **BUILD FIRST / top priority**
- **Purpose:** per design (27) set `design.occupancies` (which of baby/teen/double/bunk it serves)
  and pick the per-age poster into `design.occupancyMedia[{occupancy, image}]`. This is what the
  `/bedroom-set` age tabs read; only 4/27 designs have posters today.
- **UI (3-zone RTL):** LEFT = list of 27 designs, each with 4 completeness dots (filled = occupancy
  set AND poster chosen; amber = asserted age missing a poster). CENTER = focused design: 4 age
  toggles + a poster slot under each asserted age. RIGHT = poster picker: the design's own candidate
  images (gallery + sliderMedia + heroMedia) as a grid. Header: "X/27 designs complete" + soft flag
  "design occupancies changed since its products were last reviewed — re-check products."
- **Keyboard:** `↑/↓` cycle designs; `1/2/3/4` toggle baby/teen/double/bunk; `Shift+1..4` open poster
  picker for that age; `←/→` move within poster grid; `Enter` assign; `Cmd/Ctrl+S` preview; `Z` undo
  last applied batch; `?` help; `Esc` back to list.
- **Writes:** `designs.occupancies`, `designs.occupancyMedia` (upsert/delete). Existing fields.

### 5.2 `product` — product occupancy accuracy
- **Purpose:** refine per-product `products.occupancies` (224/270 over-broad "teen"). This is the
  field the newly-wired `/bedroom-furniture` age filter consumes.
- **UI:** product list grouped by design (defaults to surfacing products whose occupancies are
  broader than / differ from their design's), 4 age toggles inline. Below: **storefront-impact delta
  per age** computed from the same `fetchProducts({occupancies})` the storefront uses (e.g.
  "teen: 224 → 41 products") — **counts, not an iframe** (`/bedroom-set` takes age as a path segment
  and does not filter products by age, so an `?age=` preview would show nothing).
- **Keyboard:** `↑/↓` cycle products, `1/2/3/4` toggle ages, `Cmd/Ctrl+S` preview, `Z` undo, `?` help.
- **Writes:** `products.occupancies`. Existing field.

### 5.3 `images` — alt / caption / decorative queue-blast
- **Purpose:** fill/correct the 429 empty-`alt` media (+ caption, decorative), 1–2 keystrokes each.
  These are the only per-image fields and they are writable.
- **UI:** paginated queue (~50/page, lazy thumbnails), in-use-first / orphans-last, colored borders
  (green = alt set or decorative; amber = empty alt; gray = orphan). Large preview + RTL `alt`
  textarea (auto-focused), `decorative` checkbox, 1-line `caption`. A **[Regenerate]** button
  re-derives Persian alt from `piece_type` + filename qualifiers reusing `reconcile-10-alt-text.mts`
  templating, so the operator tweaks instead of typing from blank.
- **Keyboard:** `→/]` next, `←/[` prev, `Cmd/Ctrl+S` preview, `R` regenerate alt, `D` toggle
  decorative, `Esc` focus queue, `/` search filename, `?` help.
- **Writes:** `media.alt`, `media.caption`, `media.decorative`. Existing fields.

### 5.4 `orphans` — triage
- **Purpose:** keep vs archive for the ~441 runtime-computed orphans (in-use = gallery/variant/design
  refs only; SEO-og-only counts as orphan). No hard delete from the panel.
- **UI:** orphan-only grid + wide preview with metadata (filename, dims, mime, upload date).
  `[Keep] / [Archive] / [HOLD]`. Known-keep renders are pre-tagged `[HOLD]` from the audit hold-list
  / patterns (≈9 `kesho-*` renders, 4 `skate-vanity-chair` shots, ≈41 owed per-age scene renders) so
  they can't be archived by reflex. **Archive is gated:** the API re-checks linkage live and refuses
  if the media is referenced anywhere, and refuses anything on the HOLD list.
- **Keyboard:** `→/←` navigate, `K` keep, `A` archive (blocked if linked/HOLD), `H` mark HOLD,
  `Cmd/Ctrl+S` persist decisions, `?` help.
- **Writes:** none to schema, no immediate delete. Decisions append to a JSON manifest
  (`~/zhic-catalog-backups/orphan-decisions-TIMESTAMP.json`) + audit JSONL. A separate operator-run
  `services/api/scripts/reconcile-11-orphan-archive.mts` reads the manifest and **soft-relocates**
  archived files (moves to a cold/archive prefix, keeps the row) — dry-runnable, gated on live-linkage
  re-check + HOLD list.

## 6. Storefront wiring (product occupancy → `/bedroom-furniture` age filter)

Minimal, because `fetchProducts()` already supports it (`apps/web/src/lib/payload.ts`:
`ProductsQuery.occupancies` single value ~line 544 → `where[occupancies][in]` ~line 873–875):

1. In `apps/web/src/app/(site)/bedroom-furniture/[...slug]/page.tsx` add `age` to
   `FILTER_PARAM_KEYS` (currently `['design','material','size','sort','page']`, line 41) so it
   survives the filter pipeline and feeds the `hasFilterParams`/noindex logic.
2. Read `sp.age` and pass `occupancies: sp.age` into the existing `fetchProducts({...})` call (~line 239).
   No change to `payload.ts`.
3. Add a sticky «گروه سنی» tab / RadioGroup (نوزاد / نوجوان / دونفره / دوطبقه + «همه») above the grid
   and into the mobile filter sheet, reusing `@zhic/ui` + existing tokens (no new tokens).
4. **Single-value age only** (matches the singular `ProductsQuery.occupancies`; do not widen to
   multi-select — that's an unscoped query change).
5. Keep the filter on `/bedroom-furniture` root + top-level piece-type pages; do **not** add it to
   promoted facet pages (per SEO playbook). A product with no occupancies shows only under «همه».
6. **On apply**, `revalidateTag` the affected product/design tags so results refresh immediately;
   the 300s ISR window is the fallback.

## 7. Write / safety layer

Reuses the exact on-box `reconcile` convention. Does **not** use `pg_dump`/`psql` (not installed);
existing backups in `~/zhic-catalog-backups` are per-collection JSON `{docs:[...]}` dumps.

1. **Dry-run preview (mandatory).** `POST /api/tag/preview` takes `operations:[{type,target_id,value}]`,
   applies in memory, returns a before→after diff per changed field/row + storefront product-count
   deltas per age, and a short-lived confirmation token. No DB write.
2. **JSON snapshot backup (automatic, before every apply).** `apply` first writes per-collection JSON
   snapshots of exactly the rows about to change to `~/zhic-catalog-backups/tag-YYYYMMDD-HHMMSS/{media,designs,products,designs_occupancy_media}.json`. **Snapshot failure hard-aborts apply.**
3. **Apply (idempotent, batched).** Requires the confirmation token (double-submit/CSRF guard). Runs
   `payload.update({overrideAccess:true})` batched ~50/op with a progress bar. Re-applying identical
   `(target, field, value)` is a no-op.
4. **Undo (reverse-apply, not DB restore).** `POST /api/tag/undo` reads the snapshot and re-applies the
   OLD values per row via `payload.update` — surgical, safe on a live prod DB, never clobbers
   concurrent/unrelated rows.
5. **Audit.** Every applied op appends one line to `~/zhic-tag-audit.jsonl`
   `{ts, user_id, mode, op_type, target_id, before, after, backup_dir}`.
6. **Destructive ops are out-of-band.** No media delete from the web process; archive (soft-relocate)
   only via `reconcile-11`, gated on live-linkage re-check + HOLD list.

## 8. Schema changes

**NONE.** Verified existing fields cover every write: `media.alt/caption/decorative`
(`Media.ts:14/22/27`); `designs.occupancies` + `designs.occupancyMedia[{occupancy,image}]`
(`Designs.ts:63/126/135/147`); `products.occupancies` (`Products.ts:94`). Done-ness is **derived**
(no `media.reviewed`); orphan decisions persist as a JSON manifest (no `media.archived`). Result:
ships with **rebuild + pm2 restart only, no migration** — which sidesteps the known
`migrate:create` drift blocker (`designs_occupancies`).

> Note: `data-schemas.md §5` lists a media-level `tags text[]` field that does **not** exist in code
> or DB. Pre-existing doc/impl mismatch; out of scope here but flagged for a docs cleanup.

## 9. API surface

- `GET /api/tag/state?mode=&page=` — authenticated snapshot for the active mode (paginated for
  images); computes the orphan set live; returns done-ness aggregates.
- `POST /api/tag/preview` — `{operations:[{type, target_id, value}]}` where type ∈
  `set-alt | set-caption | set-decorative | set-design-occupancies | set-design-poster |
  set-product-occupancies`; returns dry before→after diff + per-age product-count deltas + confirm token.
- `POST /api/tag/apply` — `{operations, confirmToken}`; snapshot (hard-fail if it can't) → idempotent
  `payload.update` batches → audit JSONL → `revalidateTag`; returns `{applied, backupDir}`.
- `POST /api/tag/undo` — `{backupDir}`; reverse-applies the snapshot's OLD values.
- `POST /api/tag/orphan-decisions` — persists keep/archive/HOLD to the manifest; refuses `archive`
  if media is linked live or on the HOLD list.
- `GET /api/users/me` (existing Payload) — used by the `(internal)` layout + middleware + each
  `/api/tag/*` handler to gate on login + role.
- Storefront (existing, unchanged server fn): `fetchProducts({occupancies})` → `where[occupancies][in]`;
  only `/bedroom-furniture`'s `FILTER_PARAM_KEYS` + filter UI change.

## 10. Progress / done-ness scoreboard

Persistent header strip across all modes, computed from existing fields (no `media.reviewed`),
clickable to jump to a mode:
1. **Occupancy:** "X/27 designs complete" = ≥1 occupancy AND every asserted age has a poster.
2. **Images:** "N/950 alt set" (live count) + decorative count.
3. **Orphans:** "K kept / A archived / H hold / R undecided of ~441" (orphan set computed live).
4. **Product occupancy:** distribution before→after (e.g. "teen: 224 → N of 270").

Per-row cues: design completeness dots; image queue green/amber/gray borders; orphan HOLD badges.
No deadlines/quotas (solo, self-paced).

## 11. Build sequence (each milestone independently shippable)

- **M1 — Occupancy / design-poster builder (top priority, end-to-end).** Stand up `(internal)` route
  group + layout auth gate + middleware; build occupancy mode UI (27 designs, age toggles, poster
  picker from each design's own media); ship `/api/tag/state+preview+apply+undo` reusing the
  `reconcile-10` mechanics with JSON-snapshot backup + reverse-apply undo + audit JSONL + confirm
  token. **Outcome:** all 27 designs' occupancies + posters correctable with dry-run/undo;
  `/bedroom-set` age tabs become correct. Ship via rebuild + pm2 restart.
- **M2 — Product-occupancy mode + storefront consumer.** Add the product mode (grouped list, age
  toggles, in-panel count deltas) AND wire `/bedroom-furniture` (`FILTER_PARAM_KEYS` + `sp.age` →
  `fetchProducts` + «گروه سنی» UI + mobile sheet). **Outcome:** `products.occupancies` stops being
  latent; narrowing "teen" is immediately visible.
- **M3 — Images (alt/caption/decorative) queue-blast.** Paginated queue UI + RTL alt textarea +
  decorative toggle + caption + `[Regenerate]` reusing `reconcile-10` templating; extend
  preview/apply for media fields with batched apply + progress bar. **Outcome:** 429 empty-alt filled fast.
- **M4 — Orphan triage + `reconcile-11`.** Orphan mode with live-computed set, `[HOLD]` pre-tagging,
  keep/archive decisions → JSON manifest with live-linkage + HOLD archive guard; write
  `reconcile-11-orphan-archive.mts` (dry-runnable, **soft-relocate**) to enact archiving. **Outcome:**
  ~441 orphans triaged; destructive step explicit and operator-run.
- **M5 — Scoreboard header + data-quality flags + docs.** Derive counters from existing fields; add
  the "design occupancies changed — re-check products" soft flag; write
  `docs/how-to/atelier-tag-panel.md` (shortcuts, undo, running `reconcile-11`); keyboard help overlay;
  RTL/Persian-digit polish.

## 12. Risks & mitigations

- **Net-new auth gate.** Gate at 3 layers; land the gate in M1 before any write UI; default-deny.
- **Backups are JSON, not SQL.** Snapshot-before-apply (`{docs:[...]}`); snapshot failure hard-aborts;
  undo is reverse-apply via Payload SDK (concurrency-safe), never a whole-DB restore.
- **Migration blocker is real** (`designs_occupancies` drift). Zero schema changes by design; ship
  with rebuild + pm2 restart only.
- **`/bedroom-set` age is a path segment**, not a product filter — so occupancy impact is shown as
  in-panel product-count deltas from `fetchProducts`, not an iframe.
- **`ProductsQuery.occupancies` is singular** — single-value age filter only; do not widen the query.
- **ISR (300s) lag** — `revalidateTag` affected tags on apply; document the fallback window.
- **Large apply (400+ ops) timeout** — batch ~50/op with progress bar; idempotent retry.
- **Archiving a referenced image breaks galleries** — archive gated on live-linkage re-check + HOLD
  list; no delete from the web process; only `reconcile-11` (dry-runnable, soft-relocate) enacts it.
- **Orphan count is not constant** — compute the orphan set at runtime from the full
  media-referencing union (per §3 in-use scope); never hardcode.

## 13. Open items for plan/implementation

- **HOLD list exact filenames** — patterns (`kesho-*`, `*scene*`, `skate-vanity-chair*`) are the
  default; operator to supply an explicit filename list if available (drops into a hold-list file).
- **`reconcile-11` archive prefix** — confirm the cold/archive object-storage prefix name on Abr Arvan S3.
