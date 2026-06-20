#!/usr/bin/env python3
"""
Populate the `bedroom-furniture` global's category coverflow + room grid.

Carousel (8 top-level category cards) + the نوزاد/نوجوان room cards use LOOF
`picture`/scene renders (operator request 2026-06-20; images chosen by a visual
selection pass). loof is a baby/teen set, so the بزرگسال/دو طبقه room cards keep
PARLA bed renders (loof has no double/bunk). Keeps the page design as-is.

Idempotent: media reused by filename, uploaded from ~/zhic-media/loof if absent.

  Dry:    python3 seed-bedroom-furniture-carousel.py
  Apply:  ZHIC_EMAIL=... ZHIC_PASSWORD=... python3 seed-bedroom-furniture-carousel.py --apply
"""
import os, sys, json, time, subprocess, urllib.request, urllib.parse

BOX = os.environ.get('ZHIC_BOX', 'http://80.240.31.146:3001')
MEDIA = os.path.expanduser('~/zhic-media')
APPLY = '--apply' in sys.argv
TOKEN = os.environ.get('ZHIC_TOKEN')

# top-level category id -> (relpath under ~/zhic-media, persian alt). loof picture
# shots, chosen by a visual selection pass.
SHOWCASE = [
    (11, 'تخت خواب',        'loof/loof-single-bed-120-picture-cream.webp',            'تخت یک‌نفره لوف'),
    (12, 'پاتختی',          'loof/loof-nightstand-picture-cream.webp',                'پاتختی لوف'),
    (13, 'میز',             'loof/loof-study-desk-picture-cream.webp',                'میز تحریر لوف'),
    (14, 'ذخیره‌سازی',      'loof/loof-wardrobe-2-doors-mdf-open-picture-v2-cream.webp','کمد لوف'),
    (16, 'آینه',            'loof/loof-standing-mirror-picture-cream.webp',           'آینه قدی لوف'),
    (15, 'نمایش',           'loof/loof-display-cabinet-picture-cream-v2.webp',         'ویترین لوف'),
    (17, 'صندلی',           'loof/loof-study-chair-picture-v4.webp',                   'صندلی تحریر لوف'),
    (18, 'مکمل تخت',        'loof/loof-wall-shelf-picture-cream.webp',                 'شلف دیواری لوف'),
]
SHOWCASE_INITIAL = 0  # feature تخت خواب (bed)

# rooms: name, display(kashida), (relpath, alt) source, href. loof has only
# baby/teen scenes; بزرگسال uses a jacqueline double room scene, دو طبقه a parla
# bunk poster (the only styled bunk scene in the library) — both chosen visually.
ROOMS = [
    {'name': 'بزرگسال', 'display': 'بزرگــســــال', 'src': ('jacqueline/jacqueline-scene-all-picture.webp', 'اتاق خواب دونفره ژاکلین'), 'href': '/bedroom-set/double'},
    {'name': 'نوجوان',  'display': 'نـــــــوجوان', 'src': ('loof/loof-cream-teen-loof-scene-half-picture-cream.webp', 'اتاق خواب نوجوان لوف'), 'href': '/bedroom-set/teen'},
    {'name': 'نوزاد',   'display': 'نــــــــــــــوزاد', 'src': ('loof/loof-cream-kid-loof-scene-half-picture-cream.webp', 'اتاق خواب نوزاد لوف'), 'href': '/bedroom-set/baby'},
    {'name': 'دو طبقه', 'display': 'دو طــــــبقه', 'src': ('bedroom-set/bedroom-set-parla-bunk-poster.webp', 'سرویس خواب دوطبقه پارلا'), 'href': '/bedroom-set/bunk'},
]

def login():
    global TOKEN
    if TOKEN: return
    email, pw = os.environ.get('ZHIC_EMAIL'), os.environ.get('ZHIC_PASSWORD')
    if not (email and pw): sys.exit('set ZHIC_TOKEN or ZHIC_EMAIL+ZHIC_PASSWORD')
    body = json.dumps({'email': email, 'password': pw}).encode()
    req = urllib.request.Request(f'{BOX}/api/users/login', body, {'Content-Type': 'application/json'})
    TOKEN = json.load(urllib.request.urlopen(req, timeout=30))['token']

def api_get(path):
    for _ in range(5):
        try:
            req = urllib.request.Request(f'{BOX}{path}')
            if TOKEN: req.add_header('Authorization', f'JWT {TOKEN}')
            with urllib.request.urlopen(req, timeout=40) as r: return json.load(r)
        except Exception: time.sleep(2)
    return None

def find_media(fn):
    r = api_get(f'/api/media?where[filename][equals]={urllib.parse.quote(fn)}&depth=0&limit=1')
    return r['docs'][0]['id'] if r and r['docs'] else None

def upload(relpath, alt):
    path = os.path.join(MEDIA, relpath)
    cmd = ['curl','-s','-X','POST',f'{BOX}/api/media','-H',f'Authorization: JWT {TOKEN}',
           '-F',f'file=@{path};type=image/webp','-F',f'_payload={json.dumps({"alt":alt},ensure_ascii=False)}']
    return json.loads(subprocess.run(cmd, capture_output=True, text=True).stdout)['doc']['id']

def resolve(relpath, alt):
    mid = find_media(os.path.basename(relpath))
    if mid: return mid, 'reused'
    if not APPLY: return '<upload>', 'would-upload'
    return upload(relpath, alt), 'uploaded'

if APPLY: login()

print('=== bedroom-furniture carousel + rooms (loof renders) ===\nSHOWCASE:')
showcase = []
for cid, label, relpath, alt in SHOWCASE:
    mid, how = resolve(relpath, alt)
    print(f'  cat {cid:2d} «{label:10s}»  {os.path.basename(relpath)}  -> {mid} ({how})')
    showcase.append({'category': cid, 'archImage': mid})

print('\nROOMS:')
rooms = []
for r in ROOMS:
    relpath, alt = r['src']
    mid, how = resolve(relpath, alt)
    print(f'  «{r["name"]}»  {relpath}  -> {mid} ({how})')
    rooms.append({'name': r['name'], 'display': r['display'], 'image': mid, 'href': r['href']})

if not APPLY:
    print('\n(dry run — re-run with --apply + creds)'); sys.exit(0)

payload = {'showcase': showcase, 'rooms': rooms, 'showcaseInitial': SHOWCASE_INITIAL}
req = urllib.request.Request(f'{BOX}/api/globals/bedroom-furniture', json.dumps(payload).encode(), method='POST')
req.add_header('Content-Type', 'application/json'); req.add_header('Authorization', f'JWT {TOKEN}')
res = json.load(urllib.request.urlopen(req, timeout=40))
g = res.get('result', res)
print(f'\n✓ updated. showcase={len(g.get("showcase") or [])} cards, rooms={len(g.get("rooms") or [])}')
