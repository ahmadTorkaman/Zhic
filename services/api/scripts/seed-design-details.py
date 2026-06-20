#!/usr/bin/env python3
"""
Populate Designs.designDetails from a curation result file (produced by the
design-details visual workflow). Each entry → uploads the feature image from
~/zhic-media/<design>/ (idempotent) and writes {image,label,description,span}.

Skips designs with no details. iron is left untouched (already seeded).

  Input JSON: [{ "design": "shaylin", "details": [ {file,label,description}, ... ] }, ...]
  Dry:    python3 seed-design-details.py /tmp/design_details_results.json
  Apply:  ZHIC_EMAIL=... ZHIC_PASSWORD=... python3 seed-design-details.py /tmp/design_details_results.json --apply
"""
import os, sys, json, time, subprocess, urllib.request, urllib.parse

BOX = os.environ.get('ZHIC_BOX', 'http://80.240.31.146:3001')
MEDIA = os.path.expanduser('~/zhic-media')
APPLY = '--apply' in sys.argv
RESULTS = next((a for a in sys.argv[1:] if not a.startswith('--')), '/tmp/design_details_results.json')
TOKEN = os.environ.get('ZHIC_TOKEN')

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

def upload(design, fn, alt):
    mid = find_media(fn)
    if mid: return mid, 'reused'
    if not APPLY: return '<upload>', 'would-upload'
    path = os.path.join(MEDIA, design, fn)
    cmd = ['curl','-s','-X','POST',f'{BOX}/api/media','-H',f'Authorization: JWT {TOKEN}',
           '-F',f'file=@{path};type=image/webp','-F',f'_payload={json.dumps({"alt":alt},ensure_ascii=False)}']
    return json.loads(subprocess.run(cmd, capture_output=True, text=True).stdout)['doc']['id'], 'uploaded'

def patch_design(did, details):
    req = urllib.request.Request(f'{BOX}/api/designs/{did}', json.dumps({'designDetails': details}).encode(), method='PATCH')
    req.add_header('Content-Type', 'application/json'); req.add_header('Authorization', f'JWT {TOKEN}')
    return json.load(urllib.request.urlopen(req, timeout=40))

DESIGN_FA = {'baloot':'بلوط','bw':'بلک‌اند‌وایت','celine':'سلین','jacqueline':'ژاکلین','loof':'لوف',
             'lotus':'لوتوس','lukaplus':'لوکاپلاس','mocha':'موکا','shaylin':'شایلین','verna':'ورنا'}

if APPLY: login()
results = json.load(open(RESULTS))
designs = {d['slug']: d['id'] for d in (api_get('/api/designs?limit=200&depth=0') or {'docs':[]})['docs']} if APPLY else {}

print(f'=== design-details population ({"APPLY" if APPLY else "DRY"}) ===')
total_tiles = 0
for r in results:
    d = r['design']; dets = r.get('details') or []
    if d == 'iron': print(f'  {d}: skipped (already seeded)'); continue
    if not dets: print(f'  {d}: no details — {r.get("note","")[:70]}'); continue
    payload = []
    for it in dets:
        mid, how = upload(d, it['file'], f'{it["label"]} — {DESIGN_FA.get(d,d)}')
        payload.append({'image': mid, 'label': it['label'], 'description': it.get('description',''), 'span': 100})
        print(f'  {d}: «{it["label"]}» <- {it["file"]} ({how})  — {it.get("description","")[:50]}')
    total_tiles += len(payload)
    if APPLY:
        did = designs.get(d)
        if did:
            patch_design(did, payload)
            print(f'  ✓ {d}.designDetails = {len(payload)} tiles')
print(f'\ntotal tiles: {total_tiles} across {sum(1 for r in results if r.get("details") and r["design"]!="iron")} designs')
