#!/usr/bin/env python3
"""
Populate the /bedroom-set mosaic + series-hero imagery from the per-design
room/ scene shots in ~/zhic-media/<design>/room/ (operator 2026-06-25).

For each of the 8 designs that now have a room/ folder, the curated -scene-half
frame (caroline: a -collection frame — it has no -scene-half) is optimized
(resized to <=1080px long edge, re-encoded webp q82 — the Media collection has
no imageSizes pipeline, so we shrink BEFORE upload) and wired to:

  - heroMedia                  the generic mosaic-tile cover + series-hub hero
  - occupancyMedia[occ].image  per-occupancy tile cover, where a labelled room
                               scene exists (loof baby/teen, lukaplus double/
                               teen). caroline has no per-occupancy room shot,
                               so its double/teen cards are repointed to the
                               same collection scene as the hero.

This REPLACES what the occupancy hubs (/bedroom-set/baby|teen|double|bunk) and
the series hubs (/bedroom-set/<design>) render today — cutout covers and the
*-card crops — with in-room scenes. The mosaic cover chain is
`occupancyMedia[occ].image ?? heroMedia ?? gallery[0] ?? sliderMedia`
(see apps/web/src/lib/occupancy-hub-content.ts), so heroMedia + occupancyMedia
are the two levers. sliderMedia (the /designs posters) is left untouched.
Per-product room shots (nightstand/wardrobe/...) are deferred to a later pass.

Idempotent: media are reused by clean filename (room-<source>.webp); re-running
re-PATCHes the same ids.

  Dry:    python3 seed-room-scenes.py
  Apply:  ZHIC_EMAIL=... ZHIC_PASSWORD=... python3 seed-room-scenes.py --apply
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

# design -> { hero: <file in <design>/room/>, occ: { occupancy: <file> } }
# Picks curated 2026-06-25 — best daytime -scene-half frame per design.
PLAN = {
    'bw':         {'hero': 'bw-scene-half-3-picture-v3.webp', 'occ': {}},
    'caroline':   {'hero': 'caroline-collection-v3.webp',
                   'occ': {'double': 'caroline-collection-v3.webp',
                           'teen':   'caroline-collection-v3.webp'}},
    'iron':       {'hero': 'iron-scene-half-picture.webp', 'occ': {}},
    'jacqueline': {'hero': 'jacqueline-scene-half-picture.webp', 'occ': {}},
    'loof':       {'hero': 'loof-scene-half-picture-v2-cream-v2.webp',
                   'occ': {'baby': 'loof-cream-kid-loof-scene-half-picture-v2-cream.webp',
                           'teen': 'loof-cream-teen-loof-scene-half-picture-cream.webp'}},
    'lotus':      {'hero': 'lotus-scene-half-6-picture.webp', 'occ': {}},
    'lukaplus':   {'hero': 'lukaplus-scene-half-picture-v3.webp',
                   'occ': {'double': 'lukaplus-couple-lukaplus-scene-half-picture.webp',
                           'teen':   'lukaplus-teen-lukaplus-scene-half-picture-v2.webp'}},
    'mocha':      {'hero': 'mocha-scene-half.webp', 'occ': {}},
    'parla':      {'hero': 'parla-scene-half.webp',
                   'occ': {'baby': 'parla-scene-all-v3.webp',    # set first via seed-baby-cards.py; reused here
                           'teen': 'parla-scene-all-v5.webp',    # only scene-all reading as a teen room
                           'bunk': 'parla-bunk-bed-full-green.webp'}},  # double has no distinct scene → falls back to hero
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
    """Resize to <=MAXEDGE long edge + re-encode webp; returns (path, (w,h), kb)."""
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


ONLY = [a for a in sys.argv[1:] if not a.startswith('-')]  # optional: limit to given slug(s)
SELECTED = {k: v for k, v in PLAN.items() if not ONLY or k in ONLY}

if APPLY:
    login()

cur = {d['slug']: d for d in (api_get(
    '/api/designs?limit=200&depth=1&where[slug][in]=' + ','.join(SELECTED)) or {'docs': []})['docs']}

print(f'=== room scenes → /bedroom-set mosaics ({"APPLY" if APPLY else "DRY"}) ===')
done = 0
for slug, plan in SELECTED.items():
    d = cur.get(slug)
    print(f'\n{slug}  ({d["name"] if d else "?"})')
    if not d:
        print('  !! design not found — skipped')
        continue
    name = d['name']

    cache = {}

    def media_for(srcfile, alt):
        dest = 'room-' + srcfile
        if dest in cache:
            return cache[dest], 'cached'
        mid, how = upload(os.path.join(MEDIA, slug, 'room', srcfile), dest, alt)
        cache[dest] = mid
        return mid, how

    cur_hero = (d.get('heroMedia') or {}).get('filename')
    hero_mid, how = media_for(plan['hero'], f'صحنه اتاق طرح {name}')
    print(f'  heroMedia    {str(cur_hero):36}  ->  room-{plan["hero"]}   [{how}]')
    data = {'heroMedia': hero_mid}

    if plan['occ']:
        cur_occ = {o.get('occupancy'): (o.get('image') or {}).get('filename')
                   for o in (d.get('occupancyMedia') or [])}
        occ_arr = []
        for occ, srcfile in plan['occ'].items():
            mid, how = media_for(srcfile, f'صحنه اتاق {OCC_FA.get(occ, occ)} طرح {name}')
            print(f'  occ[{occ:6}] {str(cur_occ.get(occ)):36}  ->  room-{srcfile}   [{how}]')
            occ_arr.append({'occupancy': occ, 'image': mid})
        data['occupancyMedia'] = occ_arr

    if APPLY:
        patch_design(d['id'], data)
        print('  ✓ patched')
        done += 1

print(f'\n{"patched" if APPLY else "would patch"} {done if APPLY else len(SELECTED)} designs')
if not APPLY:
    print('Re-run with --apply + ZHIC_EMAIL/ZHIC_PASSWORD (or ZHIC_TOKEN) to write.')
