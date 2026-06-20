#!/usr/bin/env python3
"""
Populate the `bedroom-furniture` global's category coverflow + room grid with
the PARLA set's renders (operator request 2026-06-20). Keeps the page design as
is; only fills showcase[] (top-level category card + parla arch image) and
rooms[] (per-age parla bed render).

parla has no `seating`/chair render, so that 8th category card is omitted.
Media ids were resolved from the box (all parla files already uploaded).

  Dry:    python3 seed-bedroom-furniture-carousel.py
  Apply:  ZHIC_EMAIL=... ZHIC_PASSWORD=... python3 seed-bedroom-furniture-carousel.py --apply
"""
import os, sys, json, time, urllib.request

BOX = os.environ.get('ZHIC_BOX', 'http://80.240.31.146:3001')
APPLY = '--apply' in sys.argv
TOKEN = os.environ.get('ZHIC_TOKEN')

# top-level category id -> (label for log, parla arch media id)
SHOWCASE = [
    (11, 'تخت خواب', 823),    # bed        ← parla-double-bed-160-cream
    (12, 'پاتختی', 825),       # nightstand ← parla-nightstand-cream
    (13, 'میز', 831),          # table      ← parla-study-desk-cream
    (14, 'ذخیره‌سازی', 820),   # storage    ← parla-combined-wardrobe-cream
    (16, 'آینه', 830),         # mirror     ← parla-standing-mirror-cream
    (15, 'نمایش', 822),        # display    ← parla-display-cabinet-cream
    (18, 'مکمل تخت', 819),     # complement ← parla-changing-table-cream
]
SHOWCASE_INITIAL = 0  # feature تخت خواب (bed) centered

ROOMS = [
    {'name': 'بزرگسال', 'display': 'بزرگــســــال', 'image': 823, 'href': '/bedroom-set/double'},
    {'name': 'نوجوان',  'display': 'نـــــــوجوان', 'image': 821, 'href': '/bedroom-set/teen'},
    {'name': 'نوزاد',   'display': 'نــــــــــــــوزاد', 'image': 816, 'href': '/bedroom-set/baby'},
    {'name': 'دو طبقه', 'display': 'دو طــــــبقه', 'image': 812, 'href': '/bedroom-set/bunk'},
]

def login():
    global TOKEN
    if TOKEN: return
    email, pw = os.environ.get('ZHIC_EMAIL'), os.environ.get('ZHIC_PASSWORD')
    if not (email and pw): sys.exit('set ZHIC_TOKEN or ZHIC_EMAIL+ZHIC_PASSWORD')
    body = json.dumps({'email': email, 'password': pw}).encode()
    req = urllib.request.Request(f'{BOX}/api/users/login', body, {'Content-Type': 'application/json'})
    TOKEN = json.load(urllib.request.urlopen(req, timeout=30))['token']

def post_global(payload):
    req = urllib.request.Request(f'{BOX}/api/globals/bedroom-furniture',
                                 json.dumps(payload).encode(), method='POST')
    req.add_header('Content-Type', 'application/json')
    req.add_header('Authorization', f'JWT {TOKEN}')
    return json.load(urllib.request.urlopen(req, timeout=40))

payload = {
    'showcase': [{'category': cid, 'archImage': mid} for cid, _, mid in SHOWCASE],
    'rooms': ROOMS,
    'showcaseInitial': SHOWCASE_INITIAL,
}

print('=== bedroom-furniture carousel + rooms (parla renders) ===')
print('\nSHOWCASE (category coverflow):')
for cid, label, mid in SHOWCASE:
    print(f'  category {cid:2d} «{label}»  archImage={mid}')
print('  (omitted: seating/صندلی — parla has no chair render)')
print('\nROOMS:')
for r in ROOMS:
    print(f'  «{r["name"]}»  image={r["image"]}  -> {r["href"]}')

if not APPLY:
    print('\n(dry run — re-run with --apply + creds)')
    sys.exit(0)

login()
res = post_global(payload)
g = res.get('result', res)
print(f'\n✓ updated. showcase={len(g.get("showcase") or [])} cards, rooms={len(g.get("rooms") or [])}')
