#!/usr/bin/env python3
"""
Bulk-upload every room/ scene from ~/zhic-media/<design>/room/ into the Payload
media library (operator 2026-06-25). Each image is optimized (<=1440px long
edge, webp q82 — the Media collection has no imageSizes pipeline) and uploaded
under `room-<stem>.webp`. Idempotent: any `room-<stem>.webp` already in the
library is skipped (so the curated covers from seed-room-scenes/-baby-cards stay
untouched).

  Dry:    python3 seed-room-library.py
  Apply:  ZHIC_EMAIL=... ZHIC_PASSWORD=... python3 seed-room-library.py --apply
"""
import os, sys, json, time, subprocess, urllib.request
from PIL import Image

BOX = os.environ.get('ZHIC_BOX', 'http://80.240.31.146:3001')
MEDIA = os.path.expanduser('~/zhic-media')
TMP = '/tmp/zhic-room-library'
APPLY = '--apply' in sys.argv
TOKEN = os.environ.get('ZHIC_TOKEN')
MAXEDGE = 1440
WEBP_Q = 82
EXTS = ('.webp', '.png', '.jpg', '.jpeg')


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
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.load(r)
        except Exception:
            time.sleep(2)
    return None


def existing_filenames():
    names, page = set(), 1
    while True:
        r = api_get(f'/api/media?depth=0&limit=500&page={page}&sort=filename')
        if not r:
            break
        for d in r.get('docs', []):
            if d.get('filename'):
                names.add(d['filename'])
        if page >= (r.get('totalPages') or 1):
            break
        page += 1
    return names


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


def upload(opt, alt):
    cmd = ['curl', '-s', '-X', 'POST', f'{BOX}/api/media', '-H', f'Authorization: JWT {TOKEN}',
           '-F', f'file=@{opt};type=image/webp',
           '-F', f'_payload={json.dumps({"alt": alt}, ensure_ascii=False)}']
    out = subprocess.run(cmd, capture_output=True, text=True).stdout
    try:
        return json.loads(out)['doc']['id']
    except Exception:
        return None


if APPLY:
    login()

names = {d['slug']: d.get('name', d['slug'])
         for d in (api_get('/api/designs?limit=300&depth=0') or {'docs': []})['docs']}
existing = existing_filenames()

# collect every room/ image → (design, srcpath, destname)
todo = []
for design in sorted(os.listdir(MEDIA)):
    roomdir = os.path.join(MEDIA, design, 'room')
    if not os.path.isdir(roomdir):
        continue
    for fn in sorted(os.listdir(roomdir)):
        if not fn.lower().endswith(EXTS) or fn.startswith('.'):
            continue
        dest = 'room-' + os.path.splitext(fn)[0] + '.webp'
        todo.append((design, os.path.join(roomdir, fn), dest))

new = [t for t in todo if t[2] not in existing]
skip = len(todo) - len(new)
designs = sorted({t[0] for t in todo})
print(f'=== room library → media ({"APPLY" if APPLY else "DRY"}) ===')
print(f'  {len(existing)} media already in library')
print(f'  {len(todo)} room images across {len(designs)} designs ({", ".join(designs)})')
print(f'  → {skip} already uploaded, {len(new)} to add\n')

done = errs = 0
for design, src, dest in new:
    if not APPLY:
        print(f'  would-upload  {dest}')
        continue
    try:
        opt, size, kb = optimize(src, dest)
        mid = upload(opt, f'صحنه اتاق طرح {names.get(design, design)}')
        if mid:
            done += 1
            print(f'  ✓ {dest:54s} {size[0]}x{size[1]} {kb}KB  media={mid}')
        else:
            errs += 1
            print(f'  ✗ {dest}: upload failed')
    except Exception as e:
        errs += 1
        print(f'  ✗ {dest}: {e}')

print(f'\n{"uploaded" if APPLY else "would upload"} {done if APPLY else len(new)} new'
      + (f' ({errs} errors)' if APPLY else '') + f'; {skip} skipped (already in library)')
