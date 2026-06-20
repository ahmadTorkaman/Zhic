#!/usr/bin/env python3
"""
One-off: normalize ProductVariant.displayOrder so size-bearing products sort
by size ASCENDING (90<100<120<140<160<180), preserving secondary-axis order.

The import-catalog pass left scrambled displayOrder (e.g. iron-bed:
100,140,120,160,90,180), which surfaced as out-of-order size chips on the PDP.
The frontend (deriveAxisOptions) now also sorts numeric axes, but this fixes the
underlying data so admin/list order is sane too.

Only PATCHes variants whose displayOrder actually changes. Idempotent.

  Dry:    python3 normalize-variant-displayorder.py
  Apply:  ZHIC_EMAIL=... ZHIC_PASSWORD=... python3 normalize-variant-displayorder.py --apply
"""
import os, sys, json, time, collections, urllib.request

BOX = os.environ.get('ZHIC_BOX', 'http://80.240.31.146:3001')
APPLY = '--apply' in sys.argv
TOKEN = os.environ.get('ZHIC_TOKEN')

def login():
    global TOKEN
    if TOKEN: return
    email, pw = os.environ.get('ZHIC_EMAIL'), os.environ.get('ZHIC_PASSWORD')
    if not (email and pw): sys.exit('set ZHIC_TOKEN or ZHIC_EMAIL+ZHIC_PASSWORD')
    body = json.dumps({'email': email, 'password': pw}).encode()
    req = urllib.request.Request(f'{BOX}/api/users/login', body, {'Content-Type':'application/json'})
    TOKEN = json.load(urllib.request.urlopen(req, timeout=30))['token']

def get(path):
    for _ in range(4):
        try:
            with urllib.request.urlopen(BOX+path, timeout=40) as r: return json.load(r)
        except Exception: time.sleep(1.5)
    return None

def patch(vid, body):
    req = urllib.request.Request(f'{BOX}/api/product-variants/{vid}', json.dumps(body).encode(), method='PATCH')
    req.add_header('Content-Type','application/json'); req.add_header('Authorization', f'JWT {TOKEN}')
    return json.load(urllib.request.urlopen(req, timeout=40))

def size_of(v):
    for a in (v.get('axes') or []):
        if a['key'] == 'size':
            try: return float(a['value'])
            except ValueError: return None
    return None

def main():
    if APPLY: login()
    prods = {p['id']: p['slug'] for p in get('/api/products?limit=2000&depth=0')['docs']}
    variants = get('/api/product-variants?limit=2000&depth=0')['docs']
    by_prod = collections.defaultdict(list)
    for v in variants: by_prod[v['product']].append(v)

    changes = []
    for pid, vs in by_prod.items():
        if not any(size_of(v) is not None for v in vs):
            continue  # no size axis — leave untouched
        # sort: size asc (None last), then current displayOrder, then sku
        ordered = sorted(vs, key=lambda v: (size_of(v) is None, size_of(v) or 0,
                                            v.get('displayOrder') or 0, v['sku']))
        for i, v in enumerate(ordered):
            want = i * 10
            if (v.get('displayOrder') or 0) != want:
                changes.append((v['id'], prods.get(pid,'?'), v['sku'], v.get('displayOrder'), want))

    print(f"products with size axis touched, {len(changes)} variant displayOrder changes")
    for vid, slug, sku, old, new in changes[:30]:
        print(f"  {slug:24s} {sku:28s} {old} -> {new}")
    if len(changes) > 30: print(f"  … +{len(changes)-30} more")

    if not APPLY:
        print("\n(dry run — re-run with --apply + creds)"); return
    for vid, slug, sku, old, new in changes:
        patch(vid, {'displayOrder': new})
    print(f"\n✓ patched {len(changes)} variants")

if __name__ == '__main__':
    main()
