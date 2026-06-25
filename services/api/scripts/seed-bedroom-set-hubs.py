#!/usr/bin/env python3
"""
Seed the 4 bedroom-set-hubs documents (baby/teen/double/bunk) with the copy that
was previously hardcoded in occupancy-hub-content.ts, so /bedroom-set/{occupancy}
renders identically until the operator edits. Run AFTER the box has the migration
+ rebuild (the collection must exist). Idempotent: skips an occupancy whose doc
already exists. Leaves heroImage / intro / content / SEO / tile-control empty for
the operator + SEO specialist to fill.

  Dry:    python3 seed-bedroom-set-hubs.py
  Apply:  ZHIC_EMAIL=... ZHIC_PASSWORD=... python3 seed-bedroom-set-hubs.py --apply
"""
import os, sys, json, time, urllib.request

BOX = os.environ.get('ZHIC_BOX', 'http://80.240.31.146:3001')
APPLY = '--apply' in sys.argv
TOKEN = os.environ.get('ZHIC_TOKEN')

# occupancy -> (heroTitle WITH the comp's 2-line break, heroTagline)
HUBS = {
    'baby':   ('سرویس خواب\nنوزاد',  'طرح‌هایی برای نخستین اتاق — جایی برای رشد، نه برای بزرگ‌نمایی.'),
    'teen':   ('سرویس خواب\nنوجوان', 'طرح‌هایی برای ۹ تا ۱۸ سال — تختی که با اتاق بزرگ می‌شود.'),
    'double': ('سرویس خواب\nدونفره', 'برای اتاق مشترک — دو‌نفره‌ی استاندارد در ابعاد ۱۴۰، ۱۶۰، و ۱۸۰ سانتی‌متر.'),
    'bunk':   ('سرویس خواب\nدوطبقه', 'دو کودک، یک اتاق — تخت‌های دوطبقه با حفاظ و نردبان ثابت.'),
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


def exists(occ):
    r = api_get(f'/api/bedroom-set-hubs?where[occupancy][equals]={occ}&depth=0&limit=1')
    return bool(r and r.get('docs'))


def create(occ, title, tagline):
    payload = {
        'occupancy': occ,
        'heroTitle': title,
        'heroTagline': tagline,
        'designsHeading': 'طرح‌ها',
        'crossLinksHeading': 'گروه‌های دیگر',
    }
    req = urllib.request.Request(f'{BOX}/api/bedroom-set-hubs', json.dumps(payload, ensure_ascii=False).encode(),
                                 method='POST')
    req.add_header('Content-Type', 'application/json')
    req.add_header('Authorization', f'JWT {TOKEN}')
    return json.load(urllib.request.urlopen(req, timeout=40))['doc']['id']


if APPLY:
    login()
    # fail fast with a clear message if the collection isn't deployed yet
    if api_get('/api/bedroom-set-hubs?limit=0') is None:
        sys.exit('!! /api/bedroom-set-hubs not reachable — run the migration + rebuild on the box first.')

print(f'=== seed bedroom-set-hubs ({"APPLY" if APPLY else "DRY"}) ===')
done = 0
for occ, (title, tagline) in HUBS.items():
    if APPLY and exists(occ):
        print(f'  {occ:7s} — skipped (already exists)')
        continue
    if not APPLY:
        print(f'  {occ:7s} — would create  («{title.replace(chr(10), " ")}»)')
        continue
    mid = create(occ, title, tagline)
    done += 1
    print(f'  {occ:7s} — created (id={mid})')

print(f'\n{"created" if APPLY else "would create"} {done if APPLY else len(HUBS)} hub doc(s)')
