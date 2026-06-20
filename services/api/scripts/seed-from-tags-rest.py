#!/usr/bin/env python3
"""
Per-design media re-sync into the box CMS over the Payload REST API.

Source of truth: the Finder-tag wiring plan in
docs/reports/media-tag-wiring-dryrun-<stamp>.csv (produced by match-media-tags.py).
Strategy: FULL re-sync per design (replaces galleries), ProductVariant images wired,
idempotent (media reused by filename). Runs "one design fully, then repeat".

  Dry plan:  python3 seed-from-tags-rest.py iron
  Apply:     ZHIC_EMAIL=... ZHIC_PASSWORD=... python3 seed-from-tags-rest.py iron --apply

Auth: marketing+ user. Provide ZHIC_TOKEN, or ZHIC_EMAIL+ZHIC_PASSWORD to log in.
Backs up every product/variant/design it touches to backups/ before writing.
"""
import os, sys, csv, json, subprocess, collections, urllib.request, urllib.parse, time

BOX = os.environ.get('ZHIC_BOX', 'http://80.240.31.146:3001')
HERE = os.path.dirname(__file__)
MEDIA = os.path.expanduser('~/zhic-media')
CSV = os.path.join(HERE, '..', '..', '..', 'docs', 'reports', 'media-tag-wiring-dryrun-2026-06-20.csv')
BACKUP_DIR = os.path.join(HERE, 'backups')
DESIGN = sys.argv[1] if len(sys.argv) > 1 else 'iron'
APPLY = '--apply' in sys.argv

DESIGN_FA = {'iron':'آیرون','loof':'لوف','parla':'پارلا','lotus':'لوتوس','lukaplus':'لوکاپلاس',
  'caroline':'کارولین','jacqueline':'ژاکلین','bw':'بلک‌اند‌وایت','baloot':'بلوط','celine':'سلین',
  'elegance':'الگانس','elizabeth':'الیزابت','gandom':'گندم','lorena':'لورنا','mocha':'موکا',
  'sento':'سنتو','shaylin':'شایلین','skate':'اسکیت','verna':'ورنا'}
PIECE_FA = {'bed':'تخت','nightstand':'پاتختی','wardrobe':'کمد','vanity':'میز آرایش',
  'standing-mirror':'آینه قدی','standing-mirror-regal':'آینه قدی رگال','wall-mirror':'آینه دیواری',
  'console-vanity-mirror':'کنسول و آینه','console':'کنسول','bookcase':'کتابخانه','study-desk':'میز تحریر',
  'study-chair':'صندلی تحریر','vanity-chair':'صندلی آرایش','file':'فایل کشودار','wall-shelf':'شلف دیواری',
  'bed-box':'باکس تخت','changing-top':'تعویض‌سطح','convertible-teen':'تخت تبدیل‌شونده','loveseat':'مبل'}
ROLE_FA = {'picture':'نمای محیطی','detail':'جزئیات','scene':'صحنه‌ی اتاق','main':'','product':''}

# ── HTTP ────────────────────────────────────────────────────────────────────
TOKEN = os.environ.get('ZHIC_TOKEN')
def login():
    global TOKEN
    if TOKEN: return
    email, pw = os.environ.get('ZHIC_EMAIL'), os.environ.get('ZHIC_PASSWORD')
    if not (email and pw):
        sys.exit('No auth: set ZHIC_TOKEN, or ZHIC_EMAIL + ZHIC_PASSWORD')
    body = json.dumps({'email': email, 'password': pw}).encode()
    req = urllib.request.Request(f'{BOX}/api/users/login', body, {'Content-Type':'application/json'})
    TOKEN = json.load(urllib.request.urlopen(req, timeout=30))['token']
    print('  authenticated as', email)

def api(method, path, payload=None):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(f'{BOX}{path}', data=data, method=method)
    req.add_header('Content-Type', 'application/json')
    if TOKEN: req.add_header('Authorization', f'JWT {TOKEN}')
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)

def api_get(path):
    req = urllib.request.Request(f'{BOX}{path}')
    if TOKEN: req.add_header('Authorization', f'JWT {TOKEN}')
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)

def find_media_by_filename(fn):
    q = urllib.parse.quote(fn)
    r = api_get(f'/api/media?where[filename][equals]={q}&depth=0&limit=1')
    return r['docs'][0]['id'] if r['docs'] else None

def upload_media(path, alt):
    """Idempotent: reuse by filename, else multipart upload via curl."""
    fn = os.path.basename(path)
    existing = find_media_by_filename(fn)
    if existing:
        return existing, 'reused'
    cmd = ['curl','-s','-X','POST',f'{BOX}/api/media',
           '-H',f'Authorization: JWT {TOKEN}',
           '-F',f'file=@{path};type=image/webp',
           '-F',f'_payload={json.dumps({"alt":alt},ensure_ascii=False)}']
    out = subprocess.run(cmd, capture_output=True, text=True).stdout
    doc = json.loads(out)
    return doc['doc']['id'], 'uploaded'

# ── wiring plan for this design ─────────────────────────────────────────────
def load_plan():
    rows = [r for r in csv.DictReader(open(CSV))
            if r['folder'] == DESIGN or (r['folder'] == 'bedroom-set' and DESIGN in r['file'])]
    return rows

def file_path(folder, fn):
    return os.path.join(MEDIA, folder, fn)

def alt_for(row):
    d = DESIGN_FA.get(DESIGN, DESIGN)
    # derive piece from target product slug suffix, else role
    slug = row['target_slug']
    suffix = slug[len(DESIGN)+1:] if slug.startswith(DESIGN+'-') else ''
    piece = PIECE_FA.get(suffix) or PIECE_FA.get(row['categories'].split(',')[0], '')
    q = ROLE_FA.get(row['role'], '')
    parts = [f'سرویس خواب {d}'] if not piece else [f'{piece} {d}']
    if q: parts.append(q)
    return ' — '.join(parts)

# ── main ────────────────────────────────────────────────────────────────────
def role_rank(role):  # gallery order: main, product, picture, detail
    return {'main':0,'product':1,'picture':2,'detail':3}.get(role, 4)

def main():
    print(f'\n=== media re-sync: design «{DESIGN}» ({"APPLY" if APPLY else "DRY PLAN"}) ===')
    rows = load_plan()
    if not rows: sys.exit(f'no plan rows for {DESIGN}')

    if APPLY:
        login()
        os.makedirs(BACKUP_DIR, exist_ok=True)

    # live design + products + variants
    design = api_get(f'/api/designs?where[slug][equals]={DESIGN}&depth=0&limit=1')['docs'][0] if APPLY else {'id':'?'}
    prods = {p['slug']: p for p in api_get(f'/api/products?depth=0&limit=2000')['docs']} if APPLY else {}
    variants = {v['sku']: v for v in api_get(f'/api/product-variants?depth=0&limit=2000')['docs']} if APPLY else {}

    # group plan
    prod_gallery = collections.defaultdict(list)   # slug -> [(rank, fn, alt)]
    variant_img = {}                               # sku -> (fn, alt)  (prefer main/product)
    design_logo = design_slider = design_hero = None
    design_gallery = []
    new_products = {}

    for r in rows:
        folder, fn = r['folder'], r['file']
        path = file_path(folder, fn)
        alt = alt_for(r)
        f, slug = r['target_field'], r['target_slug']
        if r['status'] == 'new-product':
            new_products.setdefault(slug, []).append((role_rank(r['role']), fn, alt))
        elif f.startswith('variant.image'):
            sku = r['variant_sku']
            # prefer non-picture (main/product) as the cross-fade image
            cur = variant_img.get(sku)
            if not cur or role_rank(r['role']) < role_rank(cur[2]):
                variant_img[sku] = (fn, alt, r['role'])
            prod_gallery[slug].append((role_rank(r['role']), fn, alt))  # also feed gallery
        elif f.startswith('gallery') and r['target_kind'] == 'product':
            prod_gallery[slug].append((role_rank(r['role']), fn, alt))
        elif f == 'logoMedia':
            design_logo = (fn, alt)
        elif f == 'sliderMedia':
            design_slider = (fn, alt)
        elif f == 'sliderMedia(base-card)':
            design_hero = (fn, alt)          # base card -> heroMedia (slider gets the poster)
        elif f.startswith('gallery(scene)'):
            design_gallery.append((fn, alt))

    # ---- report / apply ----
    def up(path_fn, alt):
        if not APPLY:
            return f'<{path_fn}>'
        mid, how = upload_media(file_path(*path_fn) if isinstance(path_fn,tuple) else path_fn, alt)
        print(f'    media {how}: {os.path.basename(path_fn if isinstance(path_fn,str) else path_fn[1])} -> {mid}')
        return mid

    print(f'\n-- NEW PRODUCTS ({len(new_products)}) --')
    for slug, files in new_products.items():
        print(f'  create {slug}  (+{len(files)} gallery imgs)')

    print(f'\n-- PRODUCT GALLERIES ({len(prod_gallery)}) --')
    for slug, items in sorted(prod_gallery.items()):
        items = sorted(items)
        print(f'  {slug}.gallery = {len(items)} imgs  [{", ".join(i[1] for i in items[:4])}{" …" if len(items)>4 else ""}]')

    print(f'\n-- VARIANT IMAGES ({len(variant_img)}) --')
    for sku,(fn,alt,role) in sorted(variant_img.items()):
        print(f'  {sku}.image = {fn}')

    print(f'\n-- DESIGN «{DESIGN}» --')
    print(f'  logoMedia   = {design_logo[0] if design_logo else "—"}')
    print(f'  sliderMedia = {design_slider[0] if design_slider else "—"}')
    print(f'  heroMedia   = {design_hero[0] if design_hero else "—"}')
    print(f'  gallery(scenes) = {len(design_gallery)} imgs')

    if not APPLY:
        print('\n(dry plan — re-run with --apply and creds to write)')
        return

    # ---- backup ----
    backup = {'design': design, 'products': {s: prods.get(s) for s in prod_gallery},
              'variants': {sku: variants.get(sku) for sku in variant_img}}
    bpath = os.path.join(BACKUP_DIR, f'{DESIGN}-pre-resync.json')
    json.dump(backup, open(bpath,'w'), ensure_ascii=False, indent=1)
    print(f'\n  backup -> {bpath}')

    # ---- create new products ----
    for slug, files in new_products.items():
        base = prods.get(f'{DESIGN}-standing-mirror') or {}
        gimgs = [up(file_path(DESIGN,fn), alt) for _,fn,alt in sorted(files)]
        body = {'name': f'{PIECE_FA.get("standing-mirror-regal")} {DESIGN_FA.get(DESIGN,DESIGN)}',
                'slug': slug, 'sku': slug, 'design': design['id'],
                'piece_type': base.get('piece_type','mirror'),
                'occupancies': base.get('occupancies',[]),
                'categoryIds': base.get('categoryIds',[]),
                'basePriceRials': base.get('basePriceRials',0),
                'availability': base.get('availability','in_stock'),
                'status': 'published', 'gallery': gimgs}
        doc = api('POST','/api/products', body)['doc']
        prods[slug] = doc
        print(f'  created product {slug} -> {doc["id"]}')

    # ---- upload + set product galleries ----
    for slug, items in prod_gallery.items():
        p = prods.get(slug)
        if not p:
            print(f'  !! product {slug} missing, skipped'); continue
        ids = [up(file_path(DESIGN,fn), alt) for _,fn,alt in sorted(items)]
        api('PATCH', f'/api/products/{p["id"]}', {'gallery': ids})
        print(f'  set {slug}.gallery = {len(ids)}')

    # ---- variant images ----
    for sku,(fn,alt,role) in variant_img.items():
        v = variants.get(sku)
        if not v:
            print(f'  !! variant {sku} missing, skipped'); continue
        mid = find_media_by_filename(fn) or up(file_path(DESIGN,fn), alt)
        api('PATCH', f'/api/product-variants/{v["id"]}', {'image': mid})
        print(f'  set variant {sku}.image')

    # ---- design fields ----
    dpatch = {}
    if design_logo:   dpatch['logoMedia']  = find_media_by_filename(design_logo[0]) or up(file_path('bedroom-set',design_logo[0]), design_logo[1])
    if design_slider: dpatch['sliderMedia']= find_media_by_filename(design_slider[0]) or up(file_path('bedroom-set',design_slider[0]), design_slider[1])
    if design_hero:   dpatch['heroMedia']  = find_media_by_filename(design_hero[0]) or up(file_path('bedroom-set',design_hero[0]), design_hero[1])
    if design_gallery:
        dpatch['gallery'] = [find_media_by_filename(fn) or up(file_path(DESIGN,fn), alt) for fn,alt in design_gallery]
    if dpatch:
        api('PATCH', f'/api/designs/{design["id"]}', dpatch)
        print(f'  set design fields: {list(dpatch)}')

    print('\n✓ done. Review on the live site, then run the next design.')

if __name__ == '__main__':
    main()
