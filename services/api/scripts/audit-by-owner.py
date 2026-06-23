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

# Merge wrapped continuation lines (indented text that isn't a new list item/heading)
# into the preceding line so multi-line "- [ ]" items aren't truncated.
_merged = []
for _ln in SRC.read_text(encoding="utf-8").splitlines():
    if _merged and _ln[:1] in (" ", "\t") and _ln.strip() and not _ln.lstrip()[:1] in ("-", "#", "|"):
        _merged[-1] = _merged[-1].rstrip() + " " + _ln.strip()
    else:
        _merged.append(_ln)

for raw in _merged:
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

OWNER_FILE = {"✍️": "catalog-audit-seo.md", "🎨": "catalog-audit-3d.md", "🧑‍💼": "catalog-audit-operator.md"}
GEN_NOTE = "Auto-generated from `catalog-content-audit.md`. Regenerate: `python3 services/api/scripts/audit-by-owner.py`."


def table(emoji, name, items):
    out = [f"## {emoji} {name} — {len(items)} item(s)", ""]
    if not items:
        return out + ["_None yet._", ""]
    out += ["| Design | Task |", "| --- | --- |"]
    for d, txt in items:
        out.append(f"| {d} | {txt.replace('|', chr(92) + '|').strip()} |")
    return out + [""]


# Combined overview (all owners) — links to the per-specialist files.
combined = ["# Catalog audit — by owner", "", GEN_NOTE, "",
            "Per-specialist files: " + ", ".join(f"[{n}]({OWNER_FILE[e]})" for e, n in OWNERS) + ".", ""]
for emoji, name in OWNERS:
    combined += table(emoji, name, buckets[emoji])
OUT.write_text("\n".join(combined), encoding="utf-8")
print(f"wrote {OUT.relative_to(ROOT)}")

# One standalone file per specialist (shareable).
for emoji, name in OWNERS:
    path = OUT.parent / OWNER_FILE[emoji]
    doc = [f"# Catalog audit — {name}", "", GEN_NOTE, ""] + table(emoji, name, buckets[emoji])
    path.write_text("\n".join(doc), encoding="utf-8")
    print(f"  wrote {path.relative_to(ROOT)}  ({len(buckets[emoji])} items)")
