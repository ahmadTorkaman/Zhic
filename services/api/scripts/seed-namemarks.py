#!/usr/bin/env python3
"""
Populate Designs.logoMedia from the ~/zhic-media/namemarks/ folder (operator
2026-06-21). Each file is uploaded under a clean namemark-<design>.webp name
and wired to the design's logoMedia (the name-mark shown in the /bedroom-set
carousel glass band). Replaces the 7 existing + fills 13. Skips 6 files that
don't map to a catalog design (arako/denis/golf/lexus/robin/number).

  Dry:    python3 seed-namemarks.py
  Apply:  ZHIC_EMAIL=... ZHIC_PASSWORD=... python3 seed-namemarks.py --apply
"""
import os, sys, json, time, shutil, subprocess, urllib.request, urllib.parse

BOX = os.environ.get('ZHIC_BOX', 'http://80.240.31.146:3001')
SRC = os.path.expanduser('~/zhic-media/namemarks')
TMP = '/tmp/zhic-namemarks'
APPLY = '--apply' in sys.argv
TOKEN = os.environ.get('ZHIC_TOKEN')

# source filename (no ext) -> (design slug, persian name)
MAP = {
    'adrian': ('adrian', 'آدرین'), 'balot typ': ('baloot', 'بلوط'), 'celin': ('celine', 'سلین'),
    'clasic': ('classic', 'کلاسیک'), 'elegans': ('elegance', 'الگانس'), 'eliza': ('eliza', 'الیزا'),
    'elizabet': ('elizabeth', 'الیزابت'), 'gandom typ': ('gandom', 'گندم'), 'iron (1)': ('iron', 'آیرون'),
    'karolin typ': ('caroline', 'کارولین'), 'katrin': ('catherine', 'کاترین'), 'loof': ('loof', 'لوف'),
    'lotus': ('lotus', 'لوتوس'), 'luka': ('lukaplus', 'لوکاپلاس'), 'muka': ('mocha', 'موکا'),
    'nikan': ('nikan', 'نیکان'), 'parla': ('parla', 'پارلا'), 'shailin': ('shaylin', 'شایلین'),
    'skate': ('skate', 'اسکیت'), 'zhaklin (1)': ('jacqueline', 'ژاکلین'),
}

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

def upload(srcpath, destname, alt):
    mid = find_media(destname)
    if mid: return mid, 'reused'
    if not APPLY: return '<upload>', 'would-upload'
    os.makedirs(TMP, exist_ok=True)
    clean = os.path.join(TMP, destname)
    shutil.copyfile(srcpath, clean)
    cmd = ['curl','-s','-X','POST',f'{BOX}/api/media','-H',f'Authorization: JWT {TOKEN}',
           '-F',f'file=@{clean};type=image/webp','-F',f'_payload={json.dumps({"alt":alt},ensure_ascii=False)}']
    return json.loads(subprocess.run(cmd, capture_output=True, text=True).stdout)['doc']['id'], 'uploaded'

def patch_design(did, mid):
    req = urllib.request.Request(f'{BOX}/api/designs/{did}', json.dumps({'logoMedia': mid}).encode(), method='PATCH')
    req.add_header('Content-Type', 'application/json'); req.add_header('Authorization', f'JWT {TOKEN}')
    return json.load(urllib.request.urlopen(req, timeout=40))

if APPLY: login()
designs = {d['slug']: d['id'] for d in (api_get('/api/designs?limit=200&depth=0') or {'docs': []})['docs']} if APPLY else {}

print(f'=== namemark → logoMedia ({"APPLY" if APPLY else "DRY"}) ===')
done = 0
for stem, (slug, fa) in sorted(MAP.items(), key=lambda x: x[1][0]):
    src = os.path.join(SRC, stem + '.webp')
    if not os.path.exists(src):
        print(f'  !! missing source: {stem}.webp'); continue
    dest = f'namemark-{slug}.webp'
    mid, how = upload(src, dest, f'نام‌نشان طرح {fa}')
    line = f'  {slug:12s} <- {stem+".webp":18s} as {dest:24s} media={mid} ({how})'
    if APPLY:
        did = designs.get(slug)
        if did:
            patch_design(did, mid); line += '  ✓ logoMedia set'; done += 1
        else:
            line += '  !! design not found'
    print(line)
print(f'\n{"set" if APPLY else "would set"} logoMedia on {done if APPLY else len(MAP)} designs')
