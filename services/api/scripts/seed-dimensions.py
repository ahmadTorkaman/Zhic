#!/usr/bin/env python3
"""
Seed mock dimensions (width / height / depth in cm) onto every product
that currently has NULL dimensions, so the ابعاد row appears in the PDP
specs accordion. Dimensions are inferred from the product slug — bed
types pick a sensible single/double size, wardrobes vary by door count,
etc. Idempotent on the slug column — won't overwrite existing values.

Usage: python3 services/api/scripts/seed-dimensions.py
"""

import re
import psycopg2

DATABASE_URI = 'postgresql://zhic:zhic_staging_pw_2026@127.0.0.1:5433/zhic'


def dims_for(slug: str) -> tuple[int, int, int] | None:
    """Return (width, height, depth) in cm for a given slug, or None to skip."""
    s = slug.lower()
    m_size = re.search(r'-(\d{2,3})(?:-|$)', s)
    bed_size = int(m_size.group(1)) if m_size else None

    # ── Beds ──────────────────────────────────────────────────────────
    if 'bunk-bed' in s or 'two-bunk' in s:
        return (100, 170, 210)
    if 'convertible-bed' in s or 'convertible-bed-teen' in s:
        return (90, 105, 195)
    if 'double-bed' in s:
        return (bed_size or 160, 110, 215)
    if 'single-bed' in s:
        return (bed_size or 100, 110, 210)
    if s.endswith('-bed') or '-bed-' in s:
        return (bed_size or 120, 110, 210)

    # ── Bed accessories ───────────────────────────────────────────────
    if 'bed-guard' in s or 'bed-rail' in s:
        return (200, 35, 5)
    if 'bed-box' in s:
        return (200, 35, 100)
    if 'bed-jack' in s:
        return (200, 20, 100)
    if 'changing-table' in s:
        return (80, 95, 50)
    if 'changing-top' in s:
        return (80, 8, 55)
    if 'wall-shelf' in s:
        return (80, 25, 25)

    # ── Storage ───────────────────────────────────────────────────────
    if 'wardrobe' in s:
        # door count heuristic
        if 'single-door' in s or '-1-door' in s or '1-doors' in s:
            return (60, 220, 55)
        if 'double-door' in s or '-2-door' in s or '2-doors' in s:
            return (120, 220, 60)
        if 'triple-door' in s or '-3-door' in s or '3-doors' in s:
            return (180, 220, 60)
        if 'sliding' in s or 'rail' in s:
            return (220, 220, 65)
        return (120, 220, 60)
    if 'bookcase' in s or 'bookshelf' in s:
        return (80, 200, 35)
    if 'file-cabinet' in s or s.endswith('-file'):
        return (45, 120, 50)
    if 'dresser' in s or 'draaver' in s:
        return (100, 85, 50)

    # ── Display ───────────────────────────────────────────────────────
    if 'display-cabinet' in s or 'vitrine' in s or 'showcase' in s:
        return (100, 180, 40)
    if 'console' in s:
        return (110, 80, 35)

    # ── Tables ────────────────────────────────────────────────────────
    if 'study-desk' in s or 'tahrir' in s:
        return (120, 75, 60)
    if 'vanity' in s:
        return (100, 78, 45)

    # ── Chairs ────────────────────────────────────────────────────────
    if 'vanity-chair' in s:
        return (45, 80, 45)
    if 'study-chair' in s:
        return (50, 85, 50)
    if 'loveseat' in s or 'laavest' in s:
        return (140, 80, 70)

    # ── Mirrors ───────────────────────────────────────────────────────
    if 'standing-mirror' in s or 'mirror-standing' in s:
        return (60, 180, 5)
    if 'wall-mirror' in s:
        return (80, 100, 5)
    if 'table-mirror' in s:
        return (60, 70, 5)
    if s.endswith('-mirror') or '-mirror-' in s:
        return (70, 100, 5)

    # ── Nightstand ────────────────────────────────────────────────────
    if 'nightstand' in s or 'paatakhti' in s:
        return (50, 55, 40)

    return None


def main():
    conn = psycopg2.connect(DATABASE_URI)
    cur = conn.cursor()

    cur.execute(
        """
        SELECT id, slug, dimensions_width, dimensions_height, dimensions_depth
        FROM products
        ORDER BY id
        """
    )
    rows = cur.fetchall()
    print(f'{len(rows)} products in DB.\n')

    updated = skipped_filled = skipped_unmatched = 0
    for pid, slug, w, h, dp in rows:
        # Skip if any dimension is already set — non-destructive.
        if any(v is not None for v in (w, h, dp)):
            skipped_filled += 1
            continue
        dims = dims_for(slug)
        if dims is None:
            skipped_unmatched += 1
            print(f'  ? no rule for: {slug}')
            continue
        nw, nh, nd = dims
        cur.execute(
            """
            UPDATE products
            SET dimensions_width = %s,
                dimensions_height = %s,
                dimensions_depth = %s,
                updated_at = NOW()
            WHERE id = %s
            """,
            (nw, nh, nd, pid),
        )
        updated += 1

    conn.commit()
    cur.close()
    conn.close()
    print(f'\nDone. Updated {updated}, skipped (already filled) {skipped_filled}, skipped (no rule) {skipped_unmatched}.')


if __name__ == '__main__':
    main()
