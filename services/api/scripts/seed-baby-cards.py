#!/usr/bin/env python3
"""
Set the /bedroom-set/baby occupancy-tile covers (operator 2026-06-25).

MERGES the baby card into each design's existing occupancyMedia array so the
other occupancy cards (teen/double/bunk) are preserved — unlike seed-room-
scenes.py which replaces the whole array.

  caroline ← caroline/room/caroline-baby-bed.webp              (styled nursery scene)
  parla    ← parla/room/parla-scene-all-v3.webp               (full nursery scene, landscape)
  baloot   ← baloot/baloot-convertible-bed-teen-picture.webp  (root — baloot has no room/ folder)
  loof     ← already room-loof-cream-kid-loof-scene-half-picture-v2-cream.webp (verified; not touched)

Same optimize+upload pipeline as seed-room-scenes.py (<=1080px webp q82, since
the Media collection has no imageSizes pipeline). Idempotent.

  Dry:    python3 seed-baby-cards.py
  Apply:  ZHIC_EMAIL=... ZHIC_PASSWORD=... python3 seed-baby-cards.py --apply
"""
import os, sys, json, time, subprocess, urllib.request, urllib.parse
from PIL import Image

BOX = os.environ.get('ZHIC_BOX', 'http://80.240.31.146:3001')
MEDIA = os.path.expanduser('~/zhic-media')
TMP = '/tmp/zhic-room-scenes'
APPLY = '--apply' in sys.argv
TOKEN = os.environ.get('ZHIC_TOKEN')
MAXEDGE = 1080
WEBP_Q = 82
OCC_FA = {'baby': 'نوزاد', 'teen': 'نوجوان', 'double': 'دونفره', 'bunk': 'دوطبقه'}

# design -> (occupancy, path relative to ~/zhic-media)
TARGETS = {
    'caroline': ('baby', 'caroline/room/caroline-baby-bed.webp'),
    'parla':    ('baby', 'parla/room/parla-scene-all-v3.webp'),
    'baloot':   ('baby', 'baloot/baloot-convertible-bed-teen-picture.webp'),
}


def login():
    global TOKEN
    if TOKEN:
        return
    email, pw = os.environ.get('ZHIC_EMAIL'), os.environ.get('ZHIC_PASSWORD')
    if not (email and pw):
        sys.exit('set ZHIC_TOKEN or ZHIC_EMAIL+ZHIC_PASSWORD')
    body = json.dumps({'email': email, 'password': pw}).encode()
    req = urllib.request.Request(f'{BOX}/api/users/login', body, {'Content-Type': 'application/json'})
    TOKEN = json.load(urllib.request.urlopen(req, timeout=30))['token']


def api_get(path):
    for _ in range(5):
        try:
            req = urllib.request.Request(f'{BOX}{path}')
            if TOKEN:
                req.add_header('Authorization', f'JWT {TOKEN}')
            with urllib.request.urlopen(req, timeout=40) as r:
                return json.load(r)
        except Exception:
            time.sleep(2)
    return None


def find_media(fn):
    r = api_get(f'/api/media?where[filename][equals]={urllib.parse.quote(fn)}&depth=0&limit=1')
    return r['docs'][0]['id'] if r and r['docs'] else None


def optimize(srcpath, destname):
    os.makedirs(TMP, exist_ok=True)
    out = os.path.join(TMP, destname)
    im = Image.open(srcpath).convert('RGB')
    w, h = im.size
    scale = min(1.0, MAXEDGE / max(w, h))
    if scale < 1.0:
        im = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
    im.save(out, 'WEBP', quality=WEBP_Q, method=6)
    return out, im.size, os.path.getsize(out) // 1024


def upload(srcpath, destname, alt):
    mid = find_media(destname)
    if mid:
        return mid, 'reused'
    opt, size, kb = optimize(srcpath, destname)
    tag = f'{size[0]}x{size[1]} {kb}KB'
    if not APPLY:
        return '<new>', f'would-upload {tag}'
    cmd = ['curl', '-s', '-X', 'POST', f'{BOX}/api/media', '-H', f'Authorization: JWT {TOKEN}',
           '-F', f'file=@{opt};type=image/webp',
           '-F', f'_payload={json.dumps({"alt": alt}, ensure_ascii=False)}']
    out = subprocess.run(cmd, capture_output=True, text=True).stdout
    return json.loads(out)['doc']['id'], f'uploaded {tag}'


def patch_design(did, data):
    req = urllib.request.Request(f'{BOX}/api/designs/{did}',
                                 json.dumps(data, ensure_ascii=False).encode(), method='PATCH')
    req.add_header('Content-Type', 'application/json')
    req.add_header('Authorization', f'JWT {TOKEN}')
    return json.load(urllib.request.urlopen(req, timeout=60))


if APPLY:
    login()

cur = {d['slug']: d for d in (api_get(
    '/api/designs?limit=200&depth=1&where[slug][in]=' + ','.join(TARGETS)) or {'docs': []})['docs']}

print(f'=== /bedroom-set/baby tile covers ({"APPLY" if APPLY else "DRY"}) ===')
done = 0
for slug, (occ, relpath) in TARGETS.items():
    d = cur.get(slug)
    print(f'\n{slug}  ({d["name"] if d else "?"})')
    if not d:
        print('  !! design not found — skipped')
        continue
    if occ not in (d.get('occupancies') or []):
        print(f'  !! «{occ}» not in occupancies {d.get("occupancies")} — tile would not show; skipped')
        continue

    src = os.path.join(MEDIA, relpath)
    if not os.path.exists(src):
        print(f'  !! source missing: {relpath} — skipped')
        continue
    dest = 'room-' + os.path.basename(relpath)
    new_mid, how = upload(src, dest, f'صحنه اتاق {OCC_FA.get(occ, occ)} طرح {d["name"]}')

    # merge: keep every existing occ card, set/override the target one
    existing = d.get('occupancyMedia') or []
    cur_target = next((e for e in existing if e.get('occupancy') == occ), None)
    cur_fn = (cur_target.get('image') or {}).get('filename') if cur_target else None
    merged, replaced = [], False
    for e in existing:
        if e.get('occupancy') == occ:
            merged.append({'occupancy': occ, 'image': new_mid})
            replaced = True
        else:
            img = e.get('image') or {}
            merged.append({'occupancy': e.get('occupancy'), 'image': img.get('id')})
    if not replaced:
        merged.append({'occupancy': occ, 'image': new_mid})

    preserved = [e.get('occupancy') for e in existing if e.get('occupancy') != occ]
    print(f'  occ[{occ}]  {str(cur_fn):34}  ->  {dest}   [{how}]')
    print(f'  preserving cards: {preserved or "(none)"}')

    if APPLY:
        patch_design(d['id'], {'occupancyMedia': merged})
        print('  ✓ patched')
        done += 1

print(f'\n{"patched" if APPLY else "would patch"} {done if APPLY else len(TARGETS)} designs'
      + ('' if APPLY else '  (loof baby already correct — not in this set)'))
