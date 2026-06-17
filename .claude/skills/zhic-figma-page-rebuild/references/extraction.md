# Extraction — read the comp, get exact specs, fetch all media

The local Dev Mode MCP (`scripts/figma_mcp.py` → `/tmp/figma_mcp.py`) is the source of truth. It
reads the **active Figma tab**. Three tools matter:

- `get_metadata '{}'` — current selection + the full node tree (cheap, local). Pass `'{"nodeId":"X"}'`
  for a subtree. **Returns the tree as text — save to a file** and parse.
- `get_screenshot '{"nodeId":"X"}' out.png` — renders the node (incl. image fills) to PNG. Cheap/local.
- `get_design_context '{"nodeId":"X","clientLanguages":"css","clientFrameworks":"react"}' out.txt` —
  React+Tailwind code for the node, with exact fonts/sizes/colors/radii/gradients/opacities and
  `localhost:3845/assets/...` image URLs. **METERED** (cloud-proxied) — budget it.

## Step A — selection + screenshot
```bash
cp scripts/figma_mcp.py /tmp/figma_mcp.py   # once
python3 /tmp/figma_mcp.py call get_metadata '{}' /tmp/PAGE_meta.txt   # confirms frame + dumps tree
python3 /tmp/figma_mcp.py call get_screenshot '{"nodeId":"<frame>"}' /tmp/PAGE_frame.png
```
Read `/tmp/PAGE_frame.png` so you SEE the design. Grep the meta for the copy:
```bash
grep -oE '<text id="[^"]+" name="[^"]+"' /tmp/PAGE_meta.txt | sed -E 's/<text id="//; s/" name="/  =>  /'
```

## Step B — parse to a layout map
```bash
python3 - <<'PY'
import re
t=open('/tmp/PAGE_meta.txt').read()
rows=[]
for m in re.finditer(r'<([a-z-]+) id="([^"]+)" name="([^"]*)"((?:\s+\w+="[^"]*")*)\s*/?>', t):
    tag,nid,name,attrs=m.groups()
    if tag=='frame': continue
    d=dict(re.findall(r'(\w+)="([^"]*)"', attrs))
    f=lambda k:(round(float(d.get(k,0))) if d.get(k) else 0)
    rows.append((f('y'),f('x'),f('width'),f('height'),tag,nid,name[:32]))
rows.sort()
for y,x,w,h,tag,nid,name in rows:
    print(f"{y:>5}{x:>5}{w:>5}{h:>4} {tag:<16}{nid:<9}{name}")
PY
```
**Nested-frame caveat:** if a child's y looks wrong (e.g. a tab row at y0 overlapping a header at
y10), it lives inside a nested `<frame>` and its x/y are **relative to that parent**. Read the raw
metadata around it (`Read /tmp/PAGE_meta.txt`) to see the nesting and add the parent offset. Most of
these comps are otherwise flat (direct children of the frame, absolute coords).

## Step C — flaky-MCP recovery
- If everything returns ~110–234-byte stubs or "No node could be found": the **wrong tab is focused**
  or the **selection changed**. Run `get_metadata '{}'` — if it doesn't show your frame, ask the
  operator to re-open + select it. Don't burn calls retrying.
- If `get_design_context` returns "Rate limit exceeded, please try again tomorrow": you've spent the
  metered budget. You already have the screenshot + metadata; finish from those + infer the last
  node(s), or resume next day. This is why you batch the sweep (below) instead of re-querying.

## Step D — the design-context sweep (one pass over body nodes)
List the body node ids (exclude header + CTA + footer = global chrome). Run ONE sweep that retries,
strips the trailing boilerplate, and collects asset URLs. Write it to a file and run it:
```bash
#!/bin/bash
mkdir -p /tmp/ctx
NODES=( 191:208 191:233 191:235 ... )   # the body nodes for THIS page
for n in "${NODES[@]}"; do
  f="/tmp/ctx/${n/:/-}.txt"
  json=$(printf '{"nodeId":"%s","clientLanguages":"css","clientFrameworks":"react"}' "$n")
  for try in 1 2 3; do
    python3 /tmp/figma_mcp.py call get_design_context "$json" "$f" >/dev/null 2>&1
    [ "$(wc -c <"$f")" -gt 180 ] && break; sleep 0.4
  done
  sed -i '' '/^SUPER CRITICAL:/,$d' "$f" 2>/dev/null   # drop the boilerplate note (BSD sed)
  printf '>>> %-9s %4sb  %s\n' "$n" "$(wc -c <"$f")" \
    "$(grep -oE 'http://localhost:3845/assets/[a-f0-9]+\.(png|svg)' "$f" | sort -u | tr '\n' ' ')"
done
cat /tmp/ctx/*.txt | grep -oE 'http://localhost:3845/assets/[a-f0-9]+\.(png|svg)' | sort -u
```
Notes:
- Build the bash list as a real array in a `*.sh` file you Write, then `bash file.sh`. Inline loops
  with nested JSON quoting tend to misfire.
- **Ignore `10c13ac1...png`** — it's the literal example URL inside the boilerplate note, not a real asset.
- `get_design_context` on a flat frame returns only a stub ("call get_screenshot") — that's why you go
  per-node, not whole-frame. A container node returns its whole subtree only if the children are truly nested;
  in these flat comps, query each leaf.
- Read the per-node ctx files to capture exact values: `font-['Ayandeh:Black']`, `text-[41.555px]`,
  `text-[#2e3b2f]`, `rounded-[13.55px]`, gradients in inline `style`, `opacity-70`, etc.

## Step E — download + optimize media
```bash
DEST=apps/web/public/PAGE; mkdir -p "$DEST"
# one curl per unique asset hash → meaningful name
curl -sS -m30 -o "$DEST/hero.png" "http://localhost:3845/assets/<hash>.png"
# photos: resize + jpeg with sips (NO sharp/cwebp/Pillow on this host)
sips -s format jpeg -s formatOptions 82 -Z 1600 "$DEST/hero.png" --out "$DEST/hero.jpg"   # then rm the png
# transparent assets (logos/illustrations): keep PNG, just resize:  sips -Z 240 in.png --out out.png
sips -g pixelWidth -g pixelHeight "$DEST/hero.jpg"     # verify dims
```
Sizing guide (the column is 430): full-bleed photos ~1600w; cards ~560–900w; small thumbs ~380w;
banners ~860w; logos/plants 200–260w. `next/image` re-encodes to webp/avif at serve time, so jpeg
sources are fine. **SVG icons/arrows/lines** (gold `#C2986B` strokes, notched dividers): don't ship
files — inline them as small React components (so they inherit color). The featured/row arrows are
the same glyph as `GoldArrow` in `packages/ui` — reuse it.

`get_variable_defs '{}'` is usually `{}` for these comps (raw hex, not bound variables) — that's why
you read styles from per-node design context, not variables.
