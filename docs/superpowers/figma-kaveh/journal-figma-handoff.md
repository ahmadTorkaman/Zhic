# Handoff — Zhic `/journal` page → Figma (code→design)

Paste this whole file into a fresh session to continue. Your memory index (`MEMORY.md`)
already loads two relevant facts: **[[figma-local-devmode-mcp]]** and
**[[zhic-homepage-kaveh-alignment]]** — read those first; this file adds the live state.

## What we're doing
Rebuilding the live `/journal` page as **native, editable Figma layers** so the
operator can think it through and edit. Repo: `~/Projects/Zhic` (pnpm/turbo monorepo,
branch `feat/figma-homepage-alignment`). Persian-first RTL, Next.js, design-system tokens.
**Live/dev server (public, reachable): `http://80.240.31.146:3000`** — `/journal` works.

## The Figma file (UNMETERED — in the operator's Full-seat team)
- File key `8Yqk8UxQ8JNrhcpcrKlcqJ` → https://www.figma.com/design/8Yqk8UxQ8JNrhcpcrKlcqJ
- **NEW accurate mobile frame (2026-06-15): `39:2` "Journal — Mobile (430, measured)"**,
  430×6494, built from the MEASURED spec (see `journal-mobile-spec-430.md`). 65 native
  layers, Vazirmatn. This SUPERSEDES the old inferred `13:2`. Operator to: Ayandeh-ify,
  drop real covers (cream «تصویر» placeholders), then **delete old `13:2`** when happy.
- **ELEVATED concept (2026-06-15): `55:2` "Journal — Mobile (Refined Editorial)"**, 430×4010 —
  a redesign (not a faithful repro): oversized masthead, full-bleed featured hero w/ scrim +
  overlaid title, ghost category pills, varied editorial rhythm (lead cards w/ gold numbers,
  numbered list rows w/ hairlines, 2-up grids), a full-bleed **forest pull-quote**, a full-bleed
  **forest consult CTA** w/ gold button, gold accents throughout, dark footer (cloned). Built
  with Light/Regular/Bold/Black only → same bulk-Ayandeh swap works. Covers are placeholders.

## Sibling page: /bedroom-set ("طرح‌ها") — built 2026-06-15
Faithful key screens in the SAME file `8Yqk8UxQ8JNrhcpcrKlcqJ`, measured @430 (spec:
`bedroom-set-mobile-spec-430.md`). It's an interactive, image-driven gallery — built 3 static
frames: Stage, Featured overlay, **Writing `81:2`** (forest gradient-border panel + up-cue).
Covers = cream placeholders (image upload blocked). Vazirmatn → operator Ayandeh-ifies.
**CANONICAL = operator's edited versions: Stage `80:78`, Featured `80:109`** (operator added a
per-screen description caption line; prefers these over my originals `76:2`/`79:2`, which are
superseded). See [[zhic-bedroom-set-figma-build]].
- Old/inferred (inaccurate, kept for now, safe to delete):
  - **Desktop journal** = `2:2` (1440-wide, inferred — still needs an accurate redo, lower pri).
  - **Old mobile** = `13:2` (402-wide, inferred — superseded by `39:2`).
- Section order (top→bottom): header pill → breadcrumb → hero (h1+subtitle) → category pills →
  featured → divider → 1-col grid (11 cards) → pagination → consultation CTA → footer.

## ⚠️ The reason we're restarting: ACCURACY
The builds so far were **inferred from component code** → wrong sizes/spacing. We switched to
**measuring the real rendered page** via the Claude-in-Chrome MCP (browser "Browser 1" is
connected; tab id `383960455` is on `/journal`). Use `javascript_tool` with
`getComputedStyle`/`getBoundingClientRect` for ground truth.

**BLOCKER — RESOLVED (2026-06-15):** operator opened Chrome DevTools device mode and we
standardized on **iPhone 14 Pro Max = 430px** (operator's call — picked the 430 preset; the
old Kaveh comp was 402). Full mobile layout MEASURED at 430 via `javascript_tool`
(`getComputedStyle`/`getBoundingClientRect`) → ground-truth spec in
**`journal-mobile-spec-430.md`**. New accurate frame `39:2` built from it.

## Real DESKTOP measurements (innerWidth 1512) — already captured, don't re-measure
Real font on the live site = **Ayandeh**. Token → mobile resolution in parens.
- h1 «ژورنال»: `text-h1` clamp → **64px desktop / 40px mobile**, weight **900**, color **#14110F (ink)**.
- subtitle: **20px / weight 300 / #8C8279 (stone)** (`text-lead`, fixed — same on mobile). lh 34px.
- nav link: **14px** (`text-small`), active weight 700.
- featured eyebrow: **12px / 700 / #5F7760 (forest)**.
- featured title (h3): `text-h3` clamp → **32px desktop / 24px mobile**, weight **700**, **#2C2825 (charcoal)**, lh 1.4.
- featured excerpt: **14px / 300 / #8C8279 (stone)**, lh 1.7.
- featured image box: **4:5 on desktop, 16:9 on mobile** (code: `aspect-[16/9] md:aspect-[4/5]`); on mobile, **text stacks ABOVE image**.
- grid: desktop 3-col, **mobile 1-col**. Tile image **3:2**; tile eyebrow 12px forest; tile title `text-body` **16px / 700 / charcoal**.
- footer bg **#2D3A2E**; footer column heading **11.3px / 700 / #C49A6C (gold)**; footer link **8.27px / 300 / #E8E0D8 (sand)**.
- «زیبایی» (consult): clamp → **56px desktop / 35px mobile**, weight 900, **#657767 (muted forest)**.

### Confirmed corrections my mobile build (13:2) got WRONG (fix these):
- subtitle **14 → 20px**
- h1 **34px charcoal → 40px #14110F**
- «زیبایی» **30 → 35px**
- footer link **11 → 8.27px**
- featured title **22 → 24px**
(Mobile spacing/padding is still un-measured — needs the DevTools-device-mode capture, or derive from code: Container px-4 mobile, JournalGrid `gap-5`=24, featured `gap-5`, divider `mt-7 mb-7`.)

## Access / environment facts (so you don't re-derive)
- **Figma READ (unlimited):** local Dev Mode MCP at `http://127.0.0.1:3845/mcp` via `/tmp/figma_mcp.py`
  (python streamable-HTTP client; reads the desktop's currently-open file). The cloud connector
  (`64836333`) is **rate-limited** on the Zhic Kaveh file's Starter team.
- **Figma WRITE:** cloud `use_figma` / `create_new_file` / `upload_assets`. **Unmetered only for files in
  the Full-seat team** (`planKey: team::1286367757674318556`). Build into `8Yqk8UxQ8JNrhcpcrKlcqJ`.
- **Font:** cloud `use_figma` can't see locally-installed fonts → **use Vazirmatn** (load Black/Bold/Regular/Light;
  `textAlignHorizontal:"RIGHT"` for RTL). Operator has **Ayandeh installed locally** and will apply it himself in
  **desktop** Figma (select frame → set font family to Ayandeh; weights map).
- **Images BLOCKED:** Figma sanctions-blocks the upload POST from the operator's Iran IP (`451`); `createImageAsync`
  unsupported. Leave cream `تصویر` placeholders — operator drops real covers in his VPN'd desktop Figma.
  (Covers exist at `http://80.240.31.146:3000/api/media/file/journal-*.webp`.)
- **Browser measurement:** Claude-in-Chrome connected, tab `383960455` on `/journal`. `javascript_tool` works;
  `resize_window` is a no-op; DevTools needs the operator.
- **node/pnpm:** installed at `~/.local/node` (on `~/.zshrc`/`~/.zshenv`). The agent sandbox uses a fixed PATH, so
  prefix shell commands with `export PATH="$HOME/.local/node/bin:$PATH"`. tsc/eslint/vitest green on the branch.

## Real journal content (from the live page)
- Subtitle: «یادداشت‌ها، مصاحبه‌ها، و داستان‌های پشت ساخت هر قطعه — از کارگاه ما در همدان.»
- Categories: همه / بلاگ / سبک زندگی / متریال‌شناسی / مراقبت و نگهداری
- Featured: «مراقبت و نگهداری» / «نگهداری از مبلمان چوبی: آنچه باید بدانید» / «مبلمان چوبی با مراقبت درست، نسل به نسل همراه خانواده می‌ماند. در این مقاله اصول نگهداری را می‌آموزید.»
- 11 grid articles (titles in `2026-06-13-current-code-inventory.md` / live page); footer columns: ارتباط با ما / برند / فروشگاه; legal: SINCE 2008 · «طراحی‌شده برای آرامش روزهای شما.» · «© شرکت هنر چوب ژیک، تمامی حقوق محفوظ است».

## STATUS (2026-06-15) — phone view DONE
Phone view (priority) is built accurately: frame **`39:2`** at 430px from the measured spec.
Verified via Figma screenshots (top band, consult card, footer, full overview) — matches live.

### Open items / next steps
1. **Operator in desktop Figma:** Ayandeh-ify `39:2` (select frame → font family Ayandeh), drop
   real covers into the cream «تصویر» placeholders (12 total: 1 featured + 11 grid), then
   **delete the old `13:2`** (402-wide, superseded).
2. **⚠️ Pagination is a LIVE CODE BUG, not a design choice.** On the live page the pagination
   page-number buttons render **128×128** because the project's Tailwind scale is overridden
   (`h-10`/`min-w-10` → `--space-10` = 8rem = 128px instead of 40px). The Figma frame `39:2`
   shows the **intended 40px** version. Fix the code (Pagination component) so `h-10`/`min-w-10`
   give 40px — a `size-10`/explicit-px fix. (Spawned as a background task.)
3. **Tiny footer text** (<9px: brandline 6.91, pitch/copy 6.29) is the literal live render —
   still an OPEN operator decision (literal vs floor ~11px), shared with the homepage work
   (see [[zhic-homepage-kaveh-alignment]]).
4. **Desktop frame `2:2`** (1440) is still inferred/inaccurate — redo from measurements when
   the phone view is signed off (lower priority).
