---
name: zhic-figma-page-rebuild
description: >-
  Rebuild a Zhic storefront page from a Figma mobile comp (design→code), pixel-faithful and with
  ALL media fetched. Use this WHENEVER the user has a Figma frame selected (or names one by node id
  / figma.com URL) and wants it built as a real Next.js page in the Zhic repo — e.g. "rebuild /X
  from the design", "implement this Figma screen", "make /X exactly like the design", "I have the
  design selected for /X", any "@430 / Kaveh" mobile comp, or "do the same as /bedroom-furniture or
  /journal". Covers reading the local Figma Dev Mode MCP, fetching + optimizing media, building a
  430-standard column with props-driven seed content, verifying in a /lab preview, and wiring the
  real route. Trigger it even if the user doesn't say the word "Figma" but clearly wants a selected
  design turned into a page.
---

# Zhic Figma → code page rebuild

Reproduce the workflow used to build `/bedroom-furniture` (frame `191:207`) and `/journal`
(`227:478`): read a selected @430 mobile comp from Figma's **local Dev Mode MCP**, extract every
node's exact spec, fetch + optimize all media, and assemble a **pixel-faithful, props-driven**
Next.js page in a **430-standard centered column**, reusing the global chrome, verified against the
comp in a `/lab` preview, then wired into the real route and committed on a feature branch.

The operator wants this done **slowly, step-by-step, in the loop, and EXACT to the comp**. Favor
correctness and faithfulness over speed. This is a sequential workflow against ONE flaky local MCP —
do NOT fan it out into a parallel Workflow.

## Prerequisites (confirm before starting)
- Figma **desktop app** is open with the target file as the **active tab**, and the frame selected.
- The Zhic monorepo at the repo root (this skill assumes `apps/web`, `packages/ui`,
  `packages/design-system`). Read `CLAUDE.md` for conventions (Persian/RTL, ZWNJ, Jalali, tokens).
- Copy the bundled client to a working path once: `cp scripts/figma_mcp.py /tmp/figma_mcp.py`
  (it talks to `http://127.0.0.1:3845/mcp`; macOS host has `python3`, `curl`, `sips`).
- Read `references/extraction.md`, `references/building.md`, `references/shipping.md` as you reach
  each phase — they hold the exact commands, conversions, and gotchas. Don't try to hold it all at
  once; pull the phase doc when you get there.

## The workflow

### 1 — Connect & read the selection
- `python3 /tmp/figma_mcp.py call get_metadata '{}'` → confirms the selected frame (name + node id)
  and dumps the node tree. Save it: `... '{}' /tmp/<page>_meta.txt`.
- `python3 /tmp/figma_mcp.py call get_screenshot '{"nodeId":"<frame>"}' /tmp/<page>_frame.png` → Read
  it so you SEE the design.
- Parse the tree into a sorted layout map (id · type · x/y/w/h · name=text). **Watch for nested
  frames** — a child's x/y is relative to its parent group, not the frame. See `references/extraction.md`.

### 2 — Identify global chrome vs net-new body
- In these comps the **header** (top), the **consultation CTA**, and the **footer** (bottom) are the
  existing global `SiteHeader` / `SiteFooter` (rendered by `apps/web/src/app/(site)/layout.tsx`).
  Confirm by matching footer copy to `components/layout/footerLinks.ts` / `SiteFooter.tsx` — it
  matches verbatim. **Reuse them; rebuild only the BODY** between breadcrumb and footer.
- Check for an existing route + components + data fns (`grep` the route under `app/(site)/`,
  components, and `lib/payload.ts`) so you know what you're replacing and what data shape exists.

### 3 — Confirm the forks (ask the user, with recommendations)
Ask 3–4 questions before extracting/building (these changed the work each time):
1. **Chrome scope** — reuse global header/CTA/footer, build body only (recommended).
2. **Data** — static-exact **seed** first (props-driven content module → wire Payload later), vs.
   wire real CMS now. Recommend seed-first for fidelity.
3. **Component placement** — reusable primitives → `packages/ui`; page composition →
   `components/<page>/`; tokens → `design-system`.
4. **Route** — if a route already exists (e.g. `/journal`), confirm whether to redesign it in place
   (keep route + sub-routes) or create a new path.

### 4 — Extract specs + fetch ALL media
- One `get_design_context` **sweep** over the body nodes (a script that loops, retries, strips the
  trailing note, collects asset URLs). **`get_design_context` is METERED** — batch it, don't
  re-query. Full mechanics + the sweep script in `references/extraction.md`.
- Download every `http://localhost:3845/assets/<hash>.{png,svg}` with `curl`, then optimize photos
  with `sips` (no `sharp`/`cwebp`/Pillow here) into `apps/web/public/<page>/`. SVG icons → inline as
  React components. See `references/extraction.md`.

### 5 — Write the spec doc
`docs/superpowers/figma-kaveh/<page>-rebuild-spec-430.md` — media table + per-zone exact specs
(fonts/sizes/colors/radii/gradients/opacities) + new tokens + component inventory. This makes the
build reproducible and reviewable. Mirror the structure of the two existing spec docs.

### 6 — Build the body (see `references/building.md`)
- **430-standard centered column**: wrap the body in `mx-auto w-full max-w-[430px]` with inline
  `style={{ containerType: 'inline-size' }}`; size type & key spacing in **cqw** (1cqw = 1% of the
  430 column → pixel-exact at 430, fluid below). Comp px ÷ 4.3 ≈ cqw.
- **Content seed module** `lib/<page>-content.ts`: typed, `async getX()` returning static seed now;
  mirror `PayloadArticle`/`PayloadCategory` shapes so wiring Payload later edits ONLY that getter.
- Components are **props-driven**, CSS-module + token based (house style). Reuse `BrandDivider`
  (zhic wordmark divider) and `packages/ui` `GoldArrow` / `DotsIndicator`.
- Honor the gotchas in `references/building.md`: Tailwind spacing inflation, kashida titles, fonts,
  RTL logical props.

### 7 — Verify in a /lab preview (see `references/shipping.md`)
- Build incrementally; render a standalone `app/lab/<page>/page.tsx` (no CMS) and verify each section
  against the comp via the **Claude Preview MCP** (`preview_start` → `preview_eval` to navigate +
  measure → `preview_screenshot` → compare to the Figma screenshot → tune). Use `preview_inspect`
  for exact computed styles.
- **After ANY component/page `.tsx` edit, restart the dev server** — Turbopack silently serves stale
  JSX (CSS-module edits hot-reload, `.tsx` edits don't). See `references/shipping.md`.

### 8 — Wire the real route + commit
- Replace the real `app/(site)/<page>/page.tsx` body with the components, fed by the seed getter, in
  the 430 column. Keep the global chrome. Verify on the real route (CMS-null fetch errors from the
  layout are expected with no Payload running — not your code).
- Commit on a **feature branch** the operator confirms (`feat/<page>-rebuild`), staging only this
  page's files (exclude pre-existing `docs/state.md`, `.claude/`, unrelated specs). Typecheck first
  (`pnpm --filter @zhic/web exec tsc --noEmit`). Push. Note any cross-branch dependency (e.g.
  reusing `BrandDivider` from another feature branch → branch off it).

## Critical gotchas (read the full detail in the references)
- **Local MCP reads the ACTIVE tab only.** If the operator switches Figma files mid-session, every
  `nodeId` call returns "No node could be found" — ask them to re-focus, confirm with `get_metadata '{}'`.
- **`get_design_context` is metered** (cloud-proxied codegen) — "Rate limit exceeded, try tomorrow"
  after a big sweep. `get_metadata`/`get_screenshot` are local + free.
- **MCP client returns multi-part text** (code/tree + a trailing note as separate items). The bundled
  `figma_mcp.py` concatenates them; a naive client overwrites and leaves only the note (110–234-byte stubs).
- **Tailwind spacing scale is remapped** — bare `pb-10`/`mt-10` (N5–12) inflate (`pb-10` = 8rem = **128px**).
  Use arbitrary px (`pb-[40px]`) for fixed gaps. `gap-/p-/m-` as the DS rhythm are fine.
- **Turbopack `.tsx` HMR wedge** — restart `next dev` + `rm -rf apps/web/.next/cache` after structural edits.
- **Fonts**: Ayandeh weights 300/400/700/900; Crimson Text (serif numerals) + Google Fonts are blocked
  in Iran → build with a serif/closest fallback, operator self-hosts later.
- **Kashida (tatweel ـ) display titles**: use the comp's stretched glyphs for display, keep the plain
  word in `aria-label`; force the comp's line break (`\n` + `white-space: pre-line`) so long kashida
  words don't wrap badly.

## Reference implementations (study these — they are the ground truth)
- `/bedroom-furniture`: `components/bedroom-furniture/*`, `lib/bedroom-furniture.ts`,
  `app/lab/bedroom-furniture/page.tsx`, spec `docs/superpowers/figma-kaveh/bedroom-furniture-rebuild-spec-430.md`.
- `/journal`: `components/journal/*`, `lib/journal-content.ts`, `app/lab/journal/page.tsx`,
  spec `docs/superpowers/figma-kaveh/journal-rebuild-spec-430.md`.
Open the nearest analog to the section you're building and match its structure.
