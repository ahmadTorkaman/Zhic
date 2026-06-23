#!/usr/bin/env python3
"""Roll the per-design deferred worklists in catalog-content-audit.md up into a
single per-owner checklist (catalog-audit-by-owner.md), so the SEO specialist
and 3D artist each get one list. Re-run after each design pass.

Usage: python3 services/api/scripts/audit-by-owner.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SRC = ROOT / "docs/reports/catalog-content-audit.md"
OUT = ROOT / "docs/reports/catalog-audit-by-owner.md"

OWNERS = [("✍️", "SEO specialist"), ("🎨", "3D artist"), ("🧑‍💼", "Operator")]

design = None
# owner emoji -> list of (design, item text)
buckets = {emoji: [] for emoji, _ in OWNERS}
in_deferred = False

for raw in SRC.read_text(encoding="utf-8").splitlines():
    line = raw.rstrip()
    # Design heading: "## <name> — reviewed ..." (not "###", not the intro/conventions)
    m = re.match(r"^##\s+(.*?)\s+—\s+reviewed", line)
    if m:
        design = m.group(1).strip()
        in_deferred = False
        continue
    if line.startswith("### "):
        in_deferred = "Deferred" in line
        continue
    if in_deferred and design and re.match(r"^\s*-\s*\[[ x]\]", line):
        item = re.sub(r"^\s*-\s*\[[ x]\]\s*", "", line)
        for emoji, _ in OWNERS:
            if emoji in item:
                # strip leading owner emojis for readability
                txt = item
                for e, _ in OWNERS:
                    txt = txt.replace(e, "")
                txt = re.sub(r"\s+", " ", txt).strip(" ·/")
                buckets[emoji].append((design, txt))

lines = [
    "# Catalog audit — by owner",
    "",
    "Auto-generated from `catalog-content-audit.md` (per-design deferred worklists),",
    "grouped by owner. Regenerate: `python3 services/api/scripts/audit-by-owner.py`.",
    "",
]
for emoji, name in OWNERS:
    items = buckets[emoji]
    lines.append(f"## {emoji} {name} — {len(items)} item(s)")
    lines.append("")
    if not items:
        lines.append("_None yet._")
        lines.append("")
        continue
    cur = None
    for d, txt in items:
        if d != cur:
            lines.append(f"**{d}**")
            cur = d
        lines.append(f"- [ ] {txt}")
    lines.append("")

OUT.write_text("\n".join(lines), encoding="utf-8")
print(f"wrote {OUT.relative_to(ROOT)}")
for emoji, name in OWNERS:
    print(f"  {emoji} {name}: {len(buckets[emoji])}")
