# Verify in /lab, wire the real route, commit

## /lab preview + Claude Preview MCP loop
Build incrementally and verify each section against the comp before moving on.

1. Standalone preview page `apps/web/src/app/lab/<page>/page.tsx` — renders the body in the 430
   column (`containerType: inline-size`), fed by the seed getter. NO global chrome, NO CMS — `/lab/*`
   inherits only the root layout (fonts + design-system CSS), so it renders without Payload running.
2. Dev server via the **Claude Preview MCP** (not Bash): create `.claude/launch.json` if missing
   (the MCP roots at the cwd; if the repo is a subdir, use `runtimeExecutable: "bash"`,
   `runtimeArgs: ["-c","cd Zhic && pnpm --filter @zhic/web dev"]`, `port: 3000`), then `preview_start`.
3. Loop per section: `preview_resize` to ~460×1000 (column renders at full 430), `preview_eval` to
   `window.location.href='/lab/<page>'` then **measure** (getBoundingClientRect, computed styles,
   text-rects via `Range`), `preview_screenshot`, compare to the Figma screenshot, tune the CSS.
   - `preview_inspect` gives exact computed styles (better than eyeballing a screenshot).
   - `preview_eval` reloads error with "Inspected target navigated or closed" right after a nav/reload —
     just run the measuring eval again in a separate call.
   - When selecting by CSS-module class, `[class*="name"]` also matches `[class*="nameWrap"]` — target
     the specific child (e.g. `nameWrap.children[1]`) or it'll measure the wrong element.

## The Turbopack `.tsx` HMR wedge (important — cost many cycles)
Next 16 + Turbopack here **hot-reloads CSS-module edits reliably but silently serves STALE JSX after
component/page `.tsx` edits**. Symptom: your measurement/DOM doesn't match the file on disk (confirm
with `curl -s "http://localhost:3000/<route>?fresh=$RANDOM" | grep ...` — the SSR HTML shows the old
markup). Fix — after any structural `.tsx`/seed change, restart:
```bash
pkill -f "next dev" 2>/dev/null; pkill -f "pnpm --filter @zhic/web dev" 2>/dev/null; sleep 2
lsof -nP -iTCP:3000 -sTCP:LISTEN -t 2>/dev/null | xargs kill -9 2>/dev/null
rm -rf apps/web/.next/cache 2>/dev/null; sleep 1
# then preview_start again (new serverId)
```
CSS-only tweaks don't need a restart. The preview server may also just exit between turns — if a port
check shows nothing on :3000, `preview_start` relaunches it.

## Wire the real route
Replace the body of `apps/web/src/app/(site)/<page>/page.tsx` with the components in the 430 column,
fed by `await getXContent()`. Keep `export const metadata`. The `(site)` layout supplies the global
`SiteHeader`/`SiteFooter` + consultation CTA — so the page renders header → your body → CTA → footer.
- Breadcrumb top padding on the real route: `pt-[calc(var(--header-height)+var(--space-5))]` (clears
  the fixed header); `/lab` can use plain `pt-6`.
- Verify on the real route. Expect `[fetchNavMeta] … payloadFetch returned null` console errors +
  one `next/font` `<html>` hydration warning — those are the **global layout with no Payload running**
  + a pre-existing app-wide warning, **not your code**. Scan the console to confirm none originate in
  your components (no React key warnings / hydration errors from your files).

## Commit on a feature branch
- Typecheck first: `pnpm --filter @zhic/web exec tsc --noEmit` (filter for your files).
- Branch the operator confirms, usually `feat/<page>-rebuild`. **If your page reuses a component that
  only exists on another unmerged feature branch** (e.g. `BrandDivider` from `feat/bedroom-furniture-rebuild`),
  branch OFF that branch (otherwise the import breaks) and flag the merge-order dependency — or offer
  to promote the shared primitive into `packages/ui` to decouple.
- Stage ONLY this page's files: `app/(site)/<page>/page.tsx`, `app/lab/<page>/`, `components/<page>/`,
  `lib/<page>-content.ts`, `public/<page>/`, the spec doc, and the `tokens.css`/`theme.css` token
  additions. **Exclude** pre-existing noise: `docs/state.md`, `.claude/`, unrelated `*-spec` docs.
  Review with `git diff --cached --name-status` before committing.
- Commit message: `feat(<page>): rebuild /<page> from Figma (frame <id>)` + a bullet summary, ending
  with the `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>` trailer. Push with
  `git push -u origin feat/<page>-rebuild` and surface the PR-create URL.
- Don't commit/push until the operator asks; confirm the branch choice (they've picked "new branch +
  push" both times).
