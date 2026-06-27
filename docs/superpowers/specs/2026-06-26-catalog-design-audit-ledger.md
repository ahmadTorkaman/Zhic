# Catalog design-by-design audit — change ledger

**Started:** 2026-06-26
**Status:** Gathering (no live catalog edits until the whole pass is agreed, then one batch).

## Workflow (operator-defined)

Per design, in order:
1. Claude pulls the design's product list — occupancy tags, variants/axes, status, price —
   and flags anything that looks wrong.
2. Operator says what needs to change.
3. Claude records the agreed change-set here (this ledger). **No live edits yet.**
4. When all designs are covered, implement the entire ledger as one batch, then verify.

Bed teen/double **split** mechanics (create `…-bed-teen`/`…-bed-double`, repoint refs,
curate combos, retire+301 the old slug) follow the convention in
[2026-06-26-iron-bed-occupancy-split-design.md](2026-06-26-iron-bed-occupancy-split-design.md).
Per-design split specifics live in their own spec file; this ledger links them and holds
every other correction (publish/unpublish, price, missing/duplicate pieces, mis-tags, etc.).

## Status legend
`gathering` → list shown, awaiting operator · `agreed` → changes locked · `done` → implemented

## ⭐ Open operator decisions (revisit before/at implementation)
- **celine** — minimal double set: no wardrobe / bookcase / study-desk. Intentional small adult set, or incomplete?
- **lorena** — no wardrobe; has صندلی میز آرایش vanity-chair but **no میز آرایش vanity** (orphan chair). Add the vanity, or does کنسول stand in?
- **wall-shelf retro** — caroline (337, baby+teen+double) → baby+teen; lukaplus (482, teen+double) → teen. Confirm.
- **price-0 display** — published price-0 pieces render «۰ تومان»; decide if `base=0` should show «تماس بگیرید».
- **photos** — the newly-published pieces are imageless (placeholder «تصویر» until photographed).

---

## Global conventions (apply to ALL designs at implementation, 2026-06-26)

### Occupancy by piece type
Set each piece's `occupancies` tag **and** its combo membership by piece type. Match
**mirrors by Persian name** (piece_type is the generic `mirror` for all three):

| Piece | identify by | Occupancy |
|---|---|---|
| میز آرایش (vanity) | name «میز آرایش» / slug `-vanity` | **teen + double** |
| صندلی میز آرایش (vanity chair) | «صندلی میز آرایش» / `-vanity-chair` | **teen + double** |
| آینه رومیزی (vanity/table mirror) | «آینه رومیزی» / `-console-vanity-mirror`,`-table-mirror` | **teen + double** |
| میز تحریر (study desk) | «میز تحریر» / `-study-desk` | **teen only** |
| صندلی میز تحریر (study chair) | «صندلی میز تحریر» / `-study-chair` | **teen only** |
| کتابخانه (bookcase) | «کتابخانه» / `-bookcase` | **teen only** |
| آینه قدی (standing mirror) | «آینه قدی» / `-standing-mirror`,`-standing-mirror-regal` | **double only** |
| لاوست (loveseat) | «لاوست» / `-loveseat` | **double only** (operator 2026-06-26) |
| شلف دیواری (wall-shelf) | «شلف دیواری» / `-wall-shelf` | **baby + teen** (operator 2026-06-26) |

Each piece is added to the combos matching its tag, and removed from combos it's no longer
tagged for. **Not governed** (leave current tags): bed (split rule), nightstand, wardrobe,
file, console, آینه دیواری (wall-mirror), bed-guard, etc. — extend the table as we go.
⚠️ **wall-shelf retro:** caroline (337, currently baby+teen+double) and lukaplus (482, teen+double)
predate this rule → should become baby+teen and teen respectively — pending operator confirm.

⚠️ **Open edge case:** single-occupancy designs (bw=teen-only, celine/lorena/shaylin=double-only).
The rules above would orphan a piece whose design doesn't serve that occupancy (e.g. a
standing mirror in a teen-only design). Proposed: clamp each rule to the design's own
occupancies, never orphan. Confirm when we reach the first such design.

### Bed split
Per design, split the merged teen+double bed at the price-delta jump (۱۴۰ so far) into
`…-bed-teen` (smaller sizes) + `…-bed-double` (۱۴۰+); retire+301 the old slug; repoint refs;
swap combos. Convention: [iron-bed split spec](2026-06-26-iron-bed-occupancy-split-design.md).
Implement via one generic config-driven script — per design just `{bedSlug, teenSizes,
doubleSizes}`; it copies all fields/rels/variants from the source bed and partitions them.

### Publish policy (scoped — set 2026-06-26)
In this catalog **imageless ≡ draft** — all 85 drafts have no gallery image; no published
product is imageless. Operator scope = **publish draft pieces in already-LIVE designs only**.
The 7 held items stay draft per the 2026-06-22 launch hold (all have 0 published products):
designs `classic`, `eliza`, `roco`, `romantic`, `catherine`, plus `general` (bed-jack) and
`adrian` (bunk bed).

**Publish set — 30 draft pieces across 15 live designs:**
baloot (wall-shelf, changing-top, loveseat) · bw (vanity-chair) · celine (standing-mirror) ·
elegance (console-vanity-mirror, study-chair, console) · elizabeth (study-chair) ·
gandom (display-cabinet) · jacqueline (convertible-teen) · loof (bed-guard, vanity-chair) ·
lotus (wall-mirror, bed-guard, wall-shelf) · lukaplus (bed-guard, study-chair) · mocha (console) ·
parla (console-vanity-mirror, bed-guard, vanity-chair, study-chair, sliding-wardrobe) ·
sento (nightstand) · skate (standing-mirror, convertible-sofa, wall-shelf, study-chair) ·
verna (console-vanity-mirror).

On publish, governed piece types also receive their convention occupancy tags + combo
membership, **clamped to the design's occupancies (never orphan)**. First orphan case:
`skate-standing-mirror` — convention = double-only but skate is baby+teen (no double) →
needs the clamp decision.

⚠️ Batch follow-ups: (a) all 30 are imageless → they render the «تصویر» placeholder until
photographed. (b) price-0 published pieces currently format as «۰ تومان» — decide whether
`base=0` should display «تماس بگیرید» (treat 0 like null in `priceString`) before go-live.

### Baby sub-pattern (3-way baby+teen+double designs, set 2026-06-26)
For designs with a baby set (caroline, baloot, sento, elizabeth; catherine when unheld):
- **Main bed** splits teen/double as usual and **drops `baby`** — the baby set's bed is the
  convertible crib, not the main bed.
- **Convertible cribs** (تخت نوزاد دومنظوره …) → **baby only**: baby combo only; drop teen+double
  tags and remove from teen/double combos ("shouldn't appear" there — operator 2026-06-26).
- **Bed-box** (باکس تخت) → **baby only**: belongs to the crib, baby combo only. (Verify per design.)
- **changing-top / changing-table** (صفحه تعویض / میز تعویض) → baby only.
- **Vanity set / study furniture / standing mirror** → the standard occupancy convention above
  (vanity+chair+آینه رومیزی = teen+double; study-desk+chair+bookcase = teen; آینه قدی = double) — none baby.
- **Shared carcass** (wardrobe, file, nightstand, wall-shelf) → stay baby+teen+double.

Exception already on record: **jacqueline**'s convertible stays baby+teen (out of combos) — jacqueline
has no baby combo, so baby-only would orphan it.

---

## iron — agreed
Bed split fully specified: [iron-bed split spec](2026-06-26-iron-bed-occupancy-split-design.md).
- Split `iron-bed` → `iron-bed-teen` (۹۰/۱۰۰/۱۲۰) + `iron-bed-double` (۱۴۰/۱۶۰/۱۸۰); retire+301.
- Repoint 12 refs; swap combos teen#13 / double#12.

**Convention deltas (occupancy re-tag + combo membership):**
- کتابخانه bookcase (413) → **teen only**; drop from double combo #12.
- میز تحریر study-desk (420) → **teen only**; drop from double combo #12.
- صندلی میز تحریر study-chair (419) → **teen only**; drop from double combo #12.
- آینه قدی standing-mirror (418) → **double only**; drop from teen combo #13.
- آینه قدی رگال standing-mirror-regal (581) → **double only**; drop from teen combo #13.
  *(This also gives 581 a clear role — the duplicate-mirror oddity resolves as a double-only standing mirror.)*
- میز آرایش vanity (421) & صندلی میز آرایش vanity-chair (422): already teen+double ✓.
  (iron has no آینه رومیزی; آینه دیواری wall-mirror 423 untouched.)

## lotus — agreed
Bed split only, same convention as iron: [lotus-bed split spec](2026-06-26-lotus-bed-occupancy-split-design.md).
- Split `lotus-bed` → `lotus-bed-teen` (۹۰/۱۰۰/۱۲۰) + `lotus-bed-double` (۱۴۰/۱۶۰); retire+301.
- Repoint 12 refs; swap combos teen#19 / double#18.

**Convention deltas (occupancy re-tag + combo membership):**
- کتابخانه bookcase (460) → **teen only**; drop from double combo #18.
- میز تحریر study-desk (466) → **teen only**; drop from double combo #18.
- آینه قدی standing-mirror (465) → **double only**; drop from teen combo #19.
- میز آرایش vanity (467): already teen+double ✓. (lotus has no vanity-chair / آینه رومیزی; آینه دیواری 468 untouched.)

**Drafts now publish per the publish policy** (superseding the earlier "leave as-is"): `lotus-wall-mirror`
(468), `lotus-wall-shelf` (469), `lotus-bed-guard` (459) → publish. None are convention-governed
(wall-mirror/wall-shelf/bed-guard) → published as standalone, stay out of the series combos.
`lotus-bed-guard` price 0 unchanged.
**Still left as-is:** no study-chair / vanity-chair; single-option axes (wardrobe `doors:2`,
file `drawers:6`, vanity `drawers:3`).

## lukaplus — agreed
**Bed split** (boundary ۱۴۰, Δ +13,667,000ت):
- `lukaplus-bed` (473) → `lukaplus-bed-teen` (۹۰/۱۰۰/۱۲۰, base 41,136,000ت) +
  `lukaplus-bed-double` (۱۴۰/۱۶۰, base 54,803,000ت); retire+301; repoint refs; swap combos teen#21 / double#20.

**Convention deltas** — lukaplus already differentiates correctly except the vanity set was double-only:
- آینه رومیزی console-vanity-mirror (479) → **add teen** (→ teen+double); add to teen combo #21.
- میز آرایش vanity (480) → **add teen**; add to teen combo #21.
- صندلی میز آرایش vanity-chair (481) → **add teen**; add to teen combo #21.
- Already convention-correct: bookcase (472)=teen, study-desk (478)=teen, study-chair (477,draft)=teen, standing-mirror (476)=double ✓.

**Drafts now publish per the publish policy:** bed-guard (471, not governed → publish, stays out of
combos) and study-chair (477, convention=teen → publish + add to teen combo #21). Zero prices unchanged.

## verna — agreed
**Bed split** (boundary ۱۴۰, Δ +10,896,000ت): `verna-bed` (572) → `verna-bed-teen`
(۹۰/۱۰۰/۱۲۰, base 41,969,000ت) + `verna-bed-double` (۱۴۰/۱۶۰, base 52,865,000ت); retire+301;
repoint refs; swap combos teen#34 / double#33.
**Convention deltas (tag fixes; combos already correct):**
- کتابخانه bookcase (571) → **teen only** (remove `double` tag; already teen-only in combos).
- میز تحریر study-desk (575) → **teen only** (remove `double` tag).
- میز آرایش vanity (577) already teen+double ✓. (verna has no standing-mirror / chairs.)
**Publish (per policy):** آینه رومیزی `verna-console-vanity-mirror` (576) → publish + add to
BOTH combos (teen#34, double#33) per the vanity-mirror convention.
**Noted:** wardrobe single door option (`درب:۲`) confirmed correct by operator; vanity (577)
price 0 stays (already published).

## jacqueline — agreed
**Bed split** (boundary ۱۴۰, Δ +14,196,000ت): `jacqueline-bed` (427) → `jacqueline-bed-teen`
(۹۰/۱۰۰/۱۲۰, base 44,374,000ت) + `jacqueline-bed-double` (۱۴۰/۱۶۰/۱۸۰, base 58,570,000ت);
retire+301; repoint refs; swap combos teen#15 / double#14.
**Convention deltas:**
- کتابخانه bookcase (425) → **teen only**: remove `double` tag + drop from double combo #14.
- میز تحریر study-desk (431) → **teen only**: remove `double` tag + drop from double combo #14.
- آینه رومیزی vanity-mirror (432) & میز آرایش vanity (433) already teen+double ✓. No standing-mirror / chairs.
**Publish + retag:** `jacqueline-convertible-teen` (426) → publish; retag occupancies to
**baby, teen** (drop `double`, add `baby`) — it's a crib→teen convertible, not a دو نفره piece
(operator confirmed). Left out of the teen/double combos (convertibles not yet governed).
**Note:** میز آرایش vanity (433) price 0 — already published, unchanged.

## caroline — agreed (first 3-way baby design)
**Bed split** (boundary ۱۴۰, Δ +14,265,000ت): `caroline-bed` (327) → `caroline-bed-teen`
(۹۰/۱۰۰/۱۲۰, base 45,871,000ت, **teen only**) + `caroline-bed-double` (۱۴۰/۱۶۰/۱۸۰, base
60,136,000ت, **double only**); **drop `baby`**; retire+301; repoint refs; into teen#25 / double#24,
removed from baby#23.
**Baby sub-pattern:**
- Convertibles `caroline-convertible-teen` (579) & `caroline-convertible-sofa` (326) → **baby only**;
  drop teen+double tags; remove from teen#25 & double#24 (keep baby#23).
- Bed-box `caroline-bed-box` (323) → **baby only**; drop teen+double; remove from teen#25 & double#24 (keep baby#23).
- صفحه تعویض changing-top (325) = baby ✓.
**Convention deltas (vanity set was double-only → add teen):**
- میز آرایش vanity (335), آینه رومیزی vanity-mirror (334), صندلی میز آرایش vanity-chair (336) →
  **add `teen`**; add to teen combo #25.
- study-desk (333), bookcase (324), study-chair (332) = teen ✓; آینه قدی standing-mirror (331) = double ✓.
**Shared carcass** (wardrobe 338, file 328, nightstand 329, wall-shelf 337) = baby+teen+double, unchanged.
*(wall-shelf 337 pending the baby+teen retro — see convention note.)*
**Publish:** none — all caroline pieces already published.

## baloot — agreed (premium line — prices confirmed correct, ~2–3× others)
**Bed split** with footboard axis: sizes ۱۰۰/۱۲۰/۱۶۰/۱۸۰ × `تاج` high/low (no ۹۰/۱۴۰), boundary ۱۶۰
(Δ +43,932,000ت). `baloot-bed` (299) → `baloot-bed-teen` (۱۰۰/۱۲۰ × footboard = 4 variants, base
121,272,000ت, **teen**) + `baloot-bed-double` (۱۶۰/۱۸۰ × footboard = 4 variants, base 165,204,000ت,
**double**); **drop `baby`**; retire+301; repoint refs; into teen#28 / double#27, removed from baby#26.
**Baby sub-pattern:**
- Convertible `baloot-convertible-teen` (298) → **baby only**; drop teen+double; remove from double#27 (keep baby#26). *(No bed-box in baloot.)*
- صفحه تعویض changing-top (296, draft) → publish + **baby only**; add to baby#26.
**Convention deltas (baloot is over-tagged baby+teen+double → trim):**
- **teen only** (drop baby+double; remove from baby#26 & double#27): bookcase (295), study-desk (305), study-chair (304).
- **double only** (drop baby+teen): آینه قدی standing-mirror (303).
- **teen+double** (drop baby; remove from baby#26): vanity (307), آینه رومیزی vanity-mirror (306), صندلی میز آرایش vanity-chair (308).
**New piece rules (operator):**
- لاوست loveseat (300, draft) → **double only**; publish; drop baby+teen; add to double#27.
- شلف دیواری wall-shelf (309, draft) → **baby + teen**; publish; drop double; add to baby#26 & teen#28.
**Shared carcass** (wardrobe 310, console 297, nightstand 301) = baby+teen+double, unchanged.

## sento — agreed (mis-tagged "3-way" → actually teen+double; baby dropped)
Sento has `baby` on every piece but **no baby combo and no baby pieces** → **drop `baby` everywhere**;
treat as plain teen+double (clamp-never-orphan in action). Operator confirmed.
**Bed split** (boundary ۱۴۰, Δ +11,589,000ت): `sento-bed` (542) → `sento-bed-teen` (۹۰/۱۰۰/۱۲۰,
base 45,850,000ت) + `sento-bed-double` (۱۴۰/۱۶۰/۱۸۰, base 57,439,000ت); drop baby; retire+301;
repoint refs; swap combos teen#2 / double#1.
**Convention deltas (all drop `baby`):**
- **teen only**: bookcase (541), study-desk (547) → remove from double#1.
- **double only**: آینه قدی standing-mirror (546) → remove from teen#2.
- **teen+double**: vanity (549), آینه رومیزی vanity-mirror (548) → just drop the `baby` tag.
- شلف دیواری wall-shelf (550) → clamp to **teen only** (no baby set) → remove from double#1.
- **Shared carcass** → teen+double: wardrobe (551), file (543), nightstand (544).
**Publish:** پاتختی nightstand (544, draft) → publish (teen+double).

## elizabeth — agreed (hybrid: convertible crib but no baby combo → teen+double)
No baby combo, so treat as teen+double; **drop `baby`** everywhere. Every piece carries a
`روکش` finish (cream/gray) axis that rides along.
**Bed split** (boundary ۱۲۰|۱۶۰, Δ +26,905,000ت): `elizabeth-bed` (395) → `elizabeth-bed-teen`
(۱۰۰/۱۲۰ × finish, base 89,625,000ت) + `elizabeth-bed-double` (۱۶۰/۱۸۰ × finish, base
116,530,000ت); drop baby; retire+301; repoint refs; swap combos teen#6 / double#5.
**Data fix:** the bed's ۱۸۰ is missing its finish variants → replace the bare `size=180` variant
with **۱۸۰ cream + ۱۸۰ gray** (+26,905,000ت each), matching the other sizes.
**Convertible** `elizabeth-convertible-teen` (394) → retag **baby+teen** (drop `double`); **remove from
both combos** (teen#6 & double#5) — no baby set, same handling as jacqueline (operator confirmed).
**Convention deltas (drop `baby`):**
- **teen only**: bookcase (392), study-desk (402), study-chair (401, draft→publish) → remove from double#5.
- **double only**: آینه قدی standing-mirror (400), لاوست loveseat (397) → remove from teen#6.
- **teen+double**: vanity (404), آینه رومیزی vanity-mirror (403), صندلی میز آرایش vanity-chair (405) → drop `baby`.
- شلف دیواری wall-shelf (406) → clamp **teen only** (no baby set) → remove from double#5.
- **Shared carcass** → teen+double: wardrobe (407), file (396), nightstand (398), console (393).
**Publish:** صندلی میز تحریر study-chair (401, draft) → publish (teen).

## Single-occupancy designs — agreed (batch, 2026-06-26)
bw, elegance, mocha (teen) · celine, lorena, shaylin (double) · gandom (baby) · nikan (bunk).
**Clamp = no-op for all 8** — mis-tag scan found 0 pieces tagged with an occupancy their design
doesn't serve; everything already = the design's single occupancy. So **no occupancy / combo /
bed-split changes** (beds are single-occupancy: bw/elegance/mocha ۱۰۰/۱۲۰; celine/lorena/shaylin
۱۶۰/۱۸۰; gandom baby; nikan bunk-config). Only action = **publish drafts** (publish policy):
- bw → صندلی میز آرایش vanity-chair.
- celine → آینه قدی standing-mirror.
- elegance → کنسول console, صندلی میز تحریر study-chair, آینه رومیزی vanity-mirror.
- gandom → ویترین display-cabinet.
- mocha → کنسول console.
- lorena, nikan, shaylin → no drafts, nothing to change.

**Anomalies flagged (operator to confirm — not blocking):**
- celine: minimal double set — no wardrobe / bookcase / study-desk.
- lorena: minimal — no wardrobe; has صندلی میز آرایش vanity-chair but no میز آرایش vanity (orphan chair).

## loof — agreed (baby+teen, no double; finish cream/green)
Tags mostly already correct; clamp keeps standing-mirror + vanity set as **teen** (no double).
**Bed (442)** → **teen only** (drop baby); remove from baby combo #16. **No split** — loof needs no
double (operator confirmed); ۱۴۰ stays as the top teen size (Δ +10,927,000ت).
**Baby sub-pattern:**
- Convertible `loof-convertible-teen` (440) → **baby only** (drop teen); remove from teen#17 (keep baby#16).
- Bed-box `loof-bed-box` (435) → **baby only** (drop teen); remove from teen#17 (keep baby#16).
- changing pieces (438 changing-table, 439 changing-top) + ویترین display-cabinet (441) = baby ✓.
**Convention (already correct, clamp no-op):** study-desk (447), bookcase (437), study-chair (446),
vanity (449), آینه رومیزی vanity-mirror (448), آینه قدی standing-mirror (445) = teen ✓; شلف دیواری
wall-shelf (451) = baby+teen ✓; shared carcass wardrobe (452) + nightstand (443) = baby+teen ✓.
**Publish:** صندلی میز آرایش vanity-chair (450, teen), حفاظ تخت bed-guard (436, baby).

## skate — agreed (baby+teen tagged but no baby combo → teen-only; operator confirmed)
Treat as **teen-only**; **drop `baby`** everywhere. Bed (563) ۹۰/۱۰۰/۱۲۰, teen, **no split** (no double).
- Convertible `skate-convertible-sofa` (561, draft) → publish; keep **baby+teen** tag; **out of combos**
  (no baby set — same handling as elizabeth/jacqueline).
- **Publish** drafts → teen: آینه قدی standing-mirror (564, clamp to teen), شلف دیواری wall-shelf (569),
  صندلی میز تحریر study-chair (565); plus the convertible (561, out of combos).
- Convention (clamp to teen, no double): میز آرایش vanity (567), آینه قدی standing-mirror (564) → teen.
- All remaining → teen (drop baby): wardrobe (570), study-desk (566), bookcase (560), nightstand (562), آینه دیواری wall-mirror (568).
- Minor flag: bookcase (560) has an odd `کشو ۱ / پیش‌فرض` drawer axis — left as-is, noted.

## parla — agreed (4-way baby+teen+double+bunk; bed repair)
**Bed repair** (boundary ۱۴۰, Δ +15,493,000ت; finish cream/green rides along):
- `parla-bed` (506, currently holds full ۹۰–۱۸۰) → keep **teen**, sizes **۹۰/۱۰۰/۱۲۰** only (base 42,655,000ت); drop the ۱۴۰/۱۶۰/۱۸۰ variants.
- **582 «تخت دو نفره پارلا»** (broken: no slug, no variants, price 0) → **fix into `parla-bed-double`**: base 58,148,000ت, variants **۱۴۰/۱۶۰/۱۸۰**, double, in double#31.
- **Finish data fix:** sizes ۹۰/۱۴۰/۱۸۰ lack finish variants → add cream/green pairs so every size has both.
- bunk bed (501) ✓ and crib (504) ✓ unchanged.
**Convention deltas:**
- **double only**: آینه قدی standing-mirror (510) → drop baby+teen; remove from teen#32.
- **teen only**: bookcase (500) ✓, study-desk (512) ✓, study-chair (511, publish).
- **teen+double** (drop baby): میز آرایش vanity (514), آینه رومیزی vanity-mirror (513, publish), صندلی میز آرایش vanity-chair (515, publish).
- **baby only**: ویترین display-cabinet (505) → drop double+teen; باکس تخت bed-box (498) → drop double+teen; changing-table (502) ✓; crib (504) ✓; bed-guard (499, publish); **کمد تلفیقی combined-wardrobe (503) → baby only** (operator: it's a baby product) → drop double+teen.
- شلف دیواری wall-shelf (516) → **baby+teen** (drop double); add to teen#32.
- **Shared**: wardrobe (517) baby+teen+double; nightstand (507) baby+teen+double; sliding-wardrobe (509, publish).
**Name fix:** «تخت نوزاد دومنظوره پارلا » (504) — strip the trailing space.
**Publishes:** sliding-wardrobe (509), study-chair (511), vanity-chair (515), vanity-mirror (513), bed-guard (499).

---

## ✅ GATHERING COMPLETE (2026-06-26)
All active designs gathered. Held designs (classic, eliza, roco, romantic, catherine, general, adrian)
stay draft per the 2026-06-22 launch hold.

## Implementation status (2026-06-26)
Backup: `/tmp/zhic-pre-occupancy-migration-2026-06-26.dump`. Scripts in `services/api/scripts/`,
direct-pg, dry-run default + `--apply`, idempotent.
- ✅ **Stage 1** `reconcile-15-publish-and-names.mts` — APPLIED. Published 30 live-design drafts; trimmed parla name.
- ✅ **Stage 2** `reconcile-16-occupancy-convention.mts` — APPLIED. 79 occupancy retags + 30 combo adds / 44 removes (convention + clamp).
- ✅ **Stage 3** `reconcile-17-bed-splits.mts` — APPLIED & verified. 9 beds split into teen/double
  products (variants partitioned at ۱۴۰, footboard/finish ride along), 93 incoming refs repointed,
  combos swapped, 9 old beds deleted (0 dangling refs); parla 506→teen / 582→parla-bed-double repair;
  loof/skate retagged teen; finish fixes elizabeth-۱۸۰ + parla-۹۰/۱۴۰/۱۸۰ applied.
- ✅ **Stage 4** — APPLIED & verified. 9 redirects in `apps/web/next.config.ts`
  (`/products/{design}-bed` → `-bed-double`); built + `pm2 restart zhic-web`. Verified: iron-bed→308,
  teen PDP shows ۹۰/۱۰۰/۱۲۰, double PDP ۱۴۰/۱۶۰/۱۸۰, and teen/double series pages now differ
  (teen = study furniture, double = standing mirrors).

## ✅✅ IMPLEMENTATION COMPLETE (2026-06-26)
The whole ledger is live. Open operator decisions (celine/lorena minimal sets, price-0 «۰ تومان»
display, photos for the newly-published imageless pieces) remain as follow-ups. Held designs untouched.

---

## Queue (not yet processed)

**Clean teen+double candidates: all done** — iron, lotus, lukaplus, verna, jacqueline.

Remaining:
- **3-way baby+teen+double bed designs — ALL DONE**: caroline ✅, baloot ✅, sento ✅ (mis-tagged →
  teen+double), elizabeth ✅ (hybrid → teen+double). catherine is 3-way too but held.
- **Pure single-occupancy designs — DONE** (batch): bw, elegance, mocha, celine, lorena,
  shaylin, gandom, nikan. Clamp = no-op; only 7 drafts published. Clamp rule now settled.
- **2-occupancy baby+teen designs — DONE**: loof ✅ (baby+teen kept), skate ✅ (→ teen-only).
- **parla** — ✅ done (see section below).
- **Held (2026-06-22 launch hold):** classic, eliza, roco, romantic, catherine, general, adrian.
