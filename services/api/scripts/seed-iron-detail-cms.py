#!/usr/bin/env python3
"""
Wire iron's detail-page rich content into Payload, so /bedroom-set/[age]/iron can
stop being a static seed and read from the CMS like every other design.

Ports the IRON static seed (apps/web/src/lib/series-hub-content.ts) into the iron
design's Payload fields + uploads its /public/bedroom-set/iron images. Array order
matches the seed (right→left RTL) so the rendered layout is identical.

  Dry:    python3 seed-iron-detail-cms.py
  Apply:  ZHIC_EMAIL=... ZHIC_PASSWORD=... python3 seed-iron-detail-cms.py --apply
"""
import os, sys, json, time, subprocess, urllib.request, urllib.parse

BOX = os.environ.get('ZHIC_BOX', 'http://80.240.31.146:3001')
PUB = os.path.expanduser('~/Projects/Zhic/apps/web/public/bedroom-set/iron')
APPLY = '--apply' in sys.argv
TOKEN = os.environ.get('ZHIC_TOKEN')

TAGLINE = 'برای اتاق هایی که کاربرد را انتخاب می‌کنند'
INTRO_TITLE = 'سرویس نوجوان و بزرگسال'
INTRO_BODY = 'توضیحات کوتاه سرویس خواب نوجوان آیرون'
STORY_BODY = ('این سرویس خواب با نگاهی به سبک صنعتی مدرن و نیازهای نسل امروز طراحی شده است؛ '
              'جایی که گرمای بافت چوب در کنار ظرافت خطوط فلزی، شخصیتی متفاوت و ماندگار خلق می‌کند. '
              'جزئیات کاربردی و فرم‌های ساده اما حساب‌شده، فضایی منظم و آرام را شکل می‌دهند')
MATERIALS = [  # seed order (right→left)
    ('mat-metal.jpg', 'فلز', 'رنگ پودری الکترواستاتیک پوشش مات'),
    ('mat-mdf.jpg', 'MDF', 'vispan ایتالیا'),
    ('mat-fabric.jpg', 'پارچه', 'کتان مرغوب'),
]
DETAILS = [  # seed order; span = comp tile widths
    ('detail-headboard.jpg', 'سر تخت کشویی', 'مکانیزم عملکرد کشویی سر تخت در هر دو سمت همراه با طبقه‌بندی', 83),
    ('detail-metal.jpg', 'استحکامات فلزی', 'تمامی پایه‌ها و ستون‌ها قوطی فلز با اتصال جوش CO2', 117),
    ('detail-pegboard.jpg', 'پگبورد', 'پگبورد از جنس پلاستیک فشرده همراه با تمام اکسسوری‌ها', 75),
    ('detail-personalize.jpg', 'فضای شخصی سازی', '۳ پلتفرم ریلی با قابلیت شخصی‌سازی و تحمل وزن بالا', 118),
]
HERO = ('hero.jpg', 'اتاق خواب نوجوان با سرویس آیرون')
INTRO_IMG = ('intro.jpg', 'سرویس خواب نوجوان آیرون')
STORY_IMG = ('story.jpg', 'داستان طراحی سرویس آیرون')

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

def upload(fn, alt):
    mid = find_media(fn)
    if mid: return mid, 'reused'
    if not APPLY: return '<upload>', 'would-upload'
    path = os.path.join(PUB, fn)
    cmd = ['curl','-s','-X','POST',f'{BOX}/api/media','-H',f'Authorization: JWT {TOKEN}',
           '-F',f'file=@{path};type=image/jpeg','-F',f'_payload={json.dumps({"alt":alt},ensure_ascii=False)}']
    return json.loads(subprocess.run(cmd, capture_output=True, text=True).stdout)['doc']['id'], 'uploaded'

if APPLY: login()

print('=== iron detail-page CMS port ===')
hero = upload(*HERO);       print(f'  heroMedia   <- {HERO[0]} = {hero[0]} ({hero[1]})')
intro = upload(*INTRO_IMG); print(f'  introMedia  <- {INTRO_IMG[0]} = {intro[0]} ({intro[1]})')
story = upload(*STORY_IMG); print(f'  storyMedia  <- {STORY_IMG[0]} = {story[0]} ({story[1]})')
mats = []
for fn, label, sub in MATERIALS:
    mid, how = upload(fn, f'{label} — آیرون'); print(f'  material «{label}» <- {fn} = {mid} ({how})')
    mats.append({'image': mid, 'label': label, 'sub': sub})
dets = []
for fn, label, desc, span in DETAILS:
    mid, how = upload(fn, f'{label} — آیرون'); print(f'  detail «{label}» <- {fn} = {mid} ({how})')
    dets.append({'image': mid, 'label': label, 'description': desc, 'span': span})

if not APPLY:
    print('\n(dry run — re-run with --apply + creds)'); sys.exit(0)

d = api_get('/api/designs?where[slug][equals]=iron&depth=0&limit=1')['docs'][0]
payload = {
    'tagline': TAGLINE,
    'introTitle': INTRO_TITLE, 'introBody': INTRO_BODY, 'introMedia': intro[0],
    'storyBody': STORY_BODY, 'storyMedia': story[0],
    'materialCallouts': mats, 'designDetails': dets,
    'heroMedia': hero[0],
}
req = urllib.request.Request(f'{BOX}/api/designs/{d["id"]}', json.dumps(payload).encode(), method='PATCH')
req.add_header('Content-Type', 'application/json'); req.add_header('Authorization', f'JWT {TOKEN}')
res = json.load(urllib.request.urlopen(req, timeout=40))
g = res.get('doc', res)
print(f'\n✓ iron design updated: tagline, intro, story, {len(g.get("materialCallouts") or [])} materials, {len(g.get("designDetails") or [])} details, heroMedia={g.get("heroMedia")}')
