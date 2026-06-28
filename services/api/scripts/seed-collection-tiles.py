#!/usr/bin/env python3
"""
Wire the newly-added transparent piece tiles into Products.collectionTileImage
for the shaylin + celine series, over the Payload REST API (live box).

Each transparent webp maps to exactly one product (matched by name). Media is
uploaded idempotently (reused by filename if already present), then the product
is PATCHed to point its collectionTileImage at that media doc.

  Dry plan:  python3 seed-collection-tiles.py
  Apply:     ZHIC_EMAIL=... ZHIC_PASSWORD=... python3 seed-collection-tiles.py --apply

Auth (apply only): ZHIC_TOKEN, or ZHIC_EMAIL + ZHIC_PASSWORD (marketing+).
"""
import os, sys, json, subprocess, urllib.request, urllib.parse, time

BOX   = os.environ.get('ZHIC_BOX', 'http://80.240.31.146:3001')
MEDIA = os.path.expanduser('~/zhic-media')
APPLY = '--apply' in sys.argv

# product id -> (folder, filename)  — explicit, name-matched
PLAN = {
    # shaylin (series شایلین)
    557: ('shaylin', 'shaylin-console-vanity-mirror-3-pieces.webp'),
    553: ('shaylin', 'shaylin-file-5-drawers.webp'),
    554: ('shaylin', 'shaylin-loveseat.webp'),
    555: ('shaylin', 'shaylin-nightstand.webp'),
    556: ('shaylin', 'shaylin-standing-mirror.webp'),
    559: ('shaylin', 'shaylin-vanity-chair.webp'),
    # celine (series سلین)
    358: ('celine', 'celine-console-vanity-mirror-3-pieces.webp'),
    354: ('celine', 'celine-double-bed-160.webp'),
    355: ('celine', 'celine-file-5-drawers.webp'),
    356: ('celine', 'celine-nightstand.webp'),
    359: ('celine', 'celine-vanity-5-drawers.webp'),
    360: ('celine', 'celine-vanity-chair.webp'),
}

TOKEN = os.environ.get('ZHIC_TOKEN')

def login():
    global TOKEN
    if TOKEN: return
    email, pw = os.environ.get('ZHIC_EMAIL'), os.environ.get('ZHIC_PASSWORD')
    if not (email and pw):
        sys.exit('No auth: set ZHIC_TOKEN, or ZHIC_EMAIL + ZHIC_PASSWORD')
    body = json.dumps({'email': email, 'password': pw}).encode()
    req = urllib.request.Request(f'{BOX}/api/users/login', body, {'Content-Type': 'application/json'})
    TOKEN = json.load(urllib.request.urlopen(req, timeout=30))['token']
    print('  authenticated as', email)

def api_get(path):
    last = None
    for _ in range(5):
        try:
            req = urllib.request.Request(f'{BOX}{path}')
            if TOKEN: req.add_header('Authorization', f'JWT {TOKEN}')
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.load(r)
        except Exception as e:
            last = e; time.sleep(2)
    raise last

def patch(path, payload):
    data = json.dumps(payload, ensure_ascii=False).encode()
    req = urllib.request.Request(f'{BOX}{path}', data=data, method='PATCH')
    req.add_header('Content-Type', 'application/json')
    req.add_header('Authorization', f'JWT {TOKEN}')
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)

def find_media_by_filename(fn):
    q = urllib.parse.quote(fn)
    r = api_get(f'/api/media?where[filename][equals]={q}&depth=0&limit=1')
    return r['docs'][0]['id'] if r['docs'] else None

def upload_media(path, alt):
    fn = os.path.basename(path)
    existing = find_media_by_filename(fn)
    if existing:
        return existing, 'reused'
    cmd = ['curl', '-s', '-X', 'POST', f'{BOX}/api/media',
           '-H', f'Authorization: JWT {TOKEN}',
           '-F', f'file=@{path};type=image/webp',
           '-F', f'_payload={json.dumps({"alt": alt}, ensure_ascii=False)}']
    out = subprocess.run(cmd, capture_output=True, text=True).stdout
    doc = json.loads(out)
    return doc['doc']['id'], 'uploaded'

def main():
    print(f'\n=== collection-tile wiring ({"APPLY" if APPLY else "DRY PLAN"}) — {BOX} ===\n')
    if APPLY:
        login()
    for pid, (folder, fn) in PLAN.items():
        path = os.path.join(MEDIA, folder, fn)
        prod = api_get(f'/api/products/{pid}?depth=0')
        name = prod.get('name', f'#{pid}')
        ok = os.path.isfile(path)
        cur = prod.get('collectionTileImage')
        flag = '' if ok else '  !! FILE MISSING'
        print(f'[{pid}] {name}')
        print(f'      file: {folder}/{fn}{flag}')
        print(f'      current tile: {cur}')
        if not ok:
            print('      -> SKIP (no file)\n'); continue
        if not APPLY:
            print('      -> would upload + set collectionTileImage\n'); continue
        mid, how = upload_media(path, f'{name} — تصویر قطعه')
        patch(f'/api/products/{pid}', {'collectionTileImage': mid})
        print(f'      media {how}: {mid}  -> set collectionTileImage\n')
    print('Done.' + ('' if APPLY else '  (dry run — pass --apply to write)'))

if __name__ == '__main__':
    main()
