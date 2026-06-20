#!/usr/bin/env python3
"""
Dry-run matcher: zhic-media Finder tags -> Payload CMS targets.

Reads macOS Finder tags (com.apple.metadata:_kMDItemUserTags) off every image in
~/zhic-media and the live box catalog (products / designs / variants / categories /
showrooms / articles), then resolves WHERE each file should land in the CMS:

  product gallery image | product-variant cross-fade image |
  design logoMedia / sliderMedia / occupancyMedia / gallery (scene) |
  showroom cover | journal article hero | home room | section/global

NO WRITES. Emits a markdown summary + a per-file CSV under docs/reports/.

Run:  python3 services/api/scripts/match-media-tags.py
"""
import os, sys, subprocess, plistlib, json, csv, collections, urllib.request

MEDIA = os.path.expanduser('~/zhic-media')
BOX = 'http://80.240.31.146:3001/api'
REPORT_DIR = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'docs', 'reports')
STAMP = '2026-06-20'

# ---- tag vocabulary --------------------------------------------------------
ROLE_TAGS = {'product','picture','main','scene','poster','detail','collection',
             'showroom-card','namemark','journal','homepage','room'}
OCC_TAGS = {'teen','double','baby','bunk','all-occupencies'}
COLOR_TAGS = {'cream':'cream','green':'green','blue-gray':'gray'}
SIZE_TAGS = {'90','100','120','140','160','180'}
# category tag -> product-slug suffix (the box product-type vocabulary)
CAT_TYPE = {
    'wardrobe':'wardrobe','vanity':'vanity','single-bed':'bed','bed':'bed',
    'convertible-bed':'convertible-teen','study-desk':'study-desk','nightstand':'nightstand',
    'bookcase':'bookcase','standing-mirror':'standing-mirror','standing-mirror-regal':'standing-mirror',
    'wall-mirror':'wall-mirror','console':'console','file':'file','vanity-chair':'vanity-chair',
    'study-chair':'study-chair','bed-box':'bed-box','changing-top':'changing-top','wall-shelf':'wall-shelf',
    'loveseat':'loveseat','sofa':'convertible-sofa','pegboard':'study-desk',
    'vanity-mirror':'console-vanity-mirror',
}
CATEGORY_VOCAB = set(CAT_TYPE)
# variant-axis tag -> (axis_key builder)
DOOR = {'1door':('doors','1'),'2doors':('doors','2'),'3doors':('doors','3')}
DRAW = {f'{n}drawer'+('s' if n>1 else ''):('drawers',str(n)) for n in range(1,7)}
MATERIAL = {'mdf':('door_material','mdf'),'glass':('door_material','glass')}
FOOT = {'footboard-high':('footboard','high'),'footboard-low':('footboard','low')}

def finder_tags(path):
    out = subprocess.run(['xattr','-px','com.apple.metadata:_kMDItemUserTags',path],
                         capture_output=True, text=True)
    if out.returncode != 0 or not out.stdout.strip():
        return []
    raw = bytes.fromhex(out.stdout.replace(' ','').replace('\n',''))
    return [t.split('\n')[0] for t in plistlib.loads(raw)]

def fetch(ep):
    with urllib.request.urlopen(f'{BOX}/{ep}?limit=2000&depth=0', timeout=40) as r:
        return json.load(r)['docs']

# ---- load box ground truth -------------------------------------------------
print('fetching box catalog...', file=sys.stderr)
designs = fetch('designs'); products = fetch('products'); variants = fetch('product-variants')
cats = fetch('categories'); showrooms = fetch('showrooms'); articles = fetch('articles')
DESIGN_SLUGS = {d['slug'] for d in designs}
PRODUCTS_BY_SLUG = {p['slug']: p for p in products}
PRODUCTS_BY_DESIGN = collections.defaultdict(list)
DID2SLUG = {d['id']: d['slug'] for d in designs}
for p in products:
    PRODUCTS_BY_DESIGN[DID2SLUG.get(p['design'])].append(p)
VARIANTS_BY_PID = collections.defaultdict(list)
for v in variants:
    VARIANTS_BY_PID[v['product']].append(v)
SHOWROOM_SLUGS = {s['slug'] for s in showrooms}
ARTICLE_SLUGS = {a['slug'] for a in articles}

def canon_type(catset):
    if 'vanity-mirror' in catset or ('console' in catset and 'vanity' in catset):
        return 'console-vanity-mirror'
    # priority: most-specific physical pieces before generic
    for t in ['wardrobe','bookcase','nightstand','study-desk','study-chair','vanity-chair',
              'standing-mirror','standing-mirror-regal','wall-mirror','wall-shelf','file',
              'bed-box','changing-top','convertible-bed','loveseat','sofa','console',
              'vanity','single-bed','bed','pegboard']:
        if t in catset:
            return CAT_TYPE[t]
    return None

# Multiword product-type tokens, matched longest-first against the filename
# remainder (after the design prefix). The FILENAME is authoritative for the
# primary product when several category tags co-occur (e.g. a vanity shot also
# tagged wall-mirror because the mirror is visible).
FNAME_MULTI = ['console-vanity-mirror','standing-mirror-regal','standing-mirror','wall-mirror',
               'wall-shelf','study-desk','study-chair','vanity-chair','bed-box','bed-guard','bed-jack',
               'changing-table','changing-top','display-cabinet','baby-bed','bunk-bed','single-bed',
               'double-bed','convertible-teen','convertible-sofa','convertible-bed','sliding-wardrobe',
               'combined-wardrobe']
# filename token -> product-slug suffix normalization
FNAME_NORM = {'single-bed':'bed','double-bed':'bed','desk':'study-desk','convertible-bed':'convertible-teen'}

def type_from_filename(design, stem):
    if not stem.startswith(design+'-'): return None
    rest = stem[len(design)+1:]
    for m in FNAME_MULTI:
        if rest==m or rest.startswith(m+'-'):
            return FNAME_NORM.get(m, m)
    tok = rest.split('-')[0]
    return FNAME_NORM.get(tok, tok)

def match_product(design, catset, stem):
    """Return (product_or_None, status, attempted_slug). Filename-first, tag fallback."""
    # 0) regal mirror is a distinct product per the 2026-06-20 decision
    if 'standing-mirror-regal' in stem:
        slug=f'{design}-standing-mirror-regal'
        return (PRODUCTS_BY_SLUG.get(slug), 'matched' if slug in PRODUCTS_BY_SLUG else 'matched-new-product', slug)
    cands=[]
    ft = type_from_filename(design, stem)        # authoritative
    if ft: cands.append(f'{design}-{ft}')
    ct = canon_type(catset)                      # tag fallback
    if ct: cands.append(f'{design}-{ct}')
    # ambiguous-type fallbacks
    if ft=='console' or ct=='console': cands.append(f'{design}-console-vanity-mirror')
    if 'convertible' in (ft or ''): cands += [f'{design}-convertible-teen',f'{design}-convertible-sofa']
    if ft=='bed' or ct=='bed':
        cands += [f'{design}-bed-box',f'{design}-baby-bed',f'{design}-bunk-bed',f'{design}-convertible-teen']
    seen=set()
    for c in cands:
        if c in seen: continue
        seen.add(c)
        if c in PRODUCTS_BY_SLUG:
            return PRODUCTS_BY_SLUG[c], ('matched' if c==cands[0] else 'matched-fallback'), c
    # last resort: longest real product slug that prefixes the filename stem
    best=None
    for p in PRODUCTS_BY_DESIGN.get(design, []):
        if stem.startswith(p['slug']) and (best is None or len(p['slug'])>len(best['slug'])):
            best=p
    if best: return best, 'matched-byname', best['slug']
    return None, 'UNMATCHED', (cands[0] if cands else f'{design}-?')

def axes_from(tags, stem):
    ax={}
    for t in tags:
        if t in DOOR: ax['doors']=DOOR[t][1]
        if t in DRAW: ax['drawers']=DRAW[t][1]
        if t in MATERIAL: ax['door_material']=MATERIAL[t][1]
        if t in FOOT: ax['footboard']=FOOT[t][1]
        if t in SIZE_TAGS: ax['size']=t
        if t in COLOR_TAGS: ax['finish']=COLOR_TAGS[t]
    return ax

def match_variant(product, ax):
    if not ax: return None, 'no-axes'
    cand=[]
    for v in VARIANTS_BY_PID.get(product['id'], []):
        vax={a['key']:a['value'] for a in (v.get('axes') or [])}
        # all of the file's axes must be satisfied by the variant
        if all(vax.get(k)==val for k,val in ax.items()):
            cand.append(v)
    if len(cand)==1: return cand[0],'matched'
    if len(cand)>1:  return cand[0],'multiple'
    return None,'UNMATCHED'

def role_of(tags):
    for r in ['namemark','poster','scene','collection','showroom-card','journal','homepage','room',
              'main','detail','picture','product']:
        if r in tags: return r
    return '?'

rows=[]
for dirpath,_,fnames in os.walk(MEDIA):
    folder = os.path.relpath(dirpath, MEDIA).split(os.sep)[0]
    if folder.startswith('zhic-duplicates'): continue
    for fn in fnames:
        if not fn.lower().endswith(('.webp','.jpg','.jpeg','.png','.gif','.mp4')): continue
        path=os.path.join(dirpath,fn); stem=fn.rsplit('.',1)[0]
        tags=finder_tags(path)
        tset=set(tags)
        role=role_of(tags)
        occ=[t for t in tags if t in OCC_TAGS]
        color=[COLOR_TAGS[t] for t in tags if t in COLOR_TAGS]
        catset=tset & CATEGORY_VOCAB
        target_kind=target_slug=target_field=variant_sku=status=notes=''

        if not tags:
            target_kind='UNTAGGED'; status='UNTAGGED'; notes='no finder tags'
        elif folder=='bedroom-set':
            # design from name tag
            dz=[t for t in tags if t in DESIGN_SLUGS]
            design=dz[0] if dz else stem.split('-')[2] if stem.startswith('bedroom-set-') else '?'
            target_kind='design'; target_slug=design
            if role=='namemark': target_field='logoMedia'
            elif role=='poster':
                if occ and occ[0]!='all-occupencies': target_field=f'occupancyMedia[{occ[0]}].image'
                else: target_field='sliderMedia'
            else: target_field='sliderMedia(base-card)'
            status='matched' if design in DESIGN_SLUGS else 'UNMATCHED'
        elif folder=='showrooms':
            city=stem.replace('showroom-','')
            target_kind='showroom'; target_field='cover'
            if city in SHOWROOM_SLUGS:
                target_slug=city; status='matched'
            else:
                pref=[s for s in SHOWROOM_SLUGS if s.startswith(city+'-')]
                if len(pref)==1:
                    target_slug=pref[0]; status='matched-fallback'; notes=f'{city} -> {pref[0]}'
                elif len(pref)>1:
                    target_slug=','.join(pref); status='review-city'; notes=f'{city} -> {len(pref)} showrooms (pick)'
                else:
                    target_slug=city; status='review-city'; notes='city slug not in showrooms'
        elif folder=='journal':
            target_kind='article'; target_slug=stem; target_field='heroImage'
            status='review-slug'; notes='match by article slug/topic (manual)'
        elif folder=='homepage' or 'room' in tset or 'homepage' in tset:
            target_kind='home-global'; target_field='rooms[].image'; status='review'
            notes='home room poster'
        elif folder=='unnamed':
            target_kind='LOOSE'; status='LOOSE'; notes='homeless render (pa-takhty/panel/etc.)'
        elif folder in DESIGN_SLUGS:
            design=folder
            if role in ('scene',):
                target_kind='design'; target_slug=design
                target_field='gallery(scene)'
                status='design-scene'
                notes=f"scene{('/'+occ[0]) if occ else ''} -> design gallery (one may be promoted to occupancyMedia/sliderMedia)"
            elif role=='detail' and not catset:
                # design-level detail shot (no piece tag) -> design gallery
                target_kind='design'; target_slug=design; target_field='gallery(detail)'
                status='design-detail'; notes='detail w/o piece tag -> design gallery'
            elif 'changing-mirror' in stem:
                # changing-table mirror has no standalone product -> changing-table gallery
                slug=f'{design}-changing-table'
                if slug in PRODUCTS_BY_SLUG:
                    target_kind='product'; target_slug=slug; target_field=f'gallery({role})'
                    status='matched-fallback'; notes='changing-mirror -> changing-table'
                else:
                    target_kind='product'; target_slug=slug; status='UNMATCHED'; notes='no changing-table'
            elif role in ('product','main','picture','detail'):
                p,pstatus,attempt=match_product(design,catset,stem)
                ax=axes_from(tags,stem)
                if p:
                    target_kind='product'; target_slug=p['slug']; status=pstatus
                    # variant?
                    nonfinish_ax={k:v for k,v in ax.items()}
                    v,vstatus=match_variant(p,ax) if ax else (None,'no-axes')
                    if v and vstatus in ('matched','multiple'):
                        target_field='variant.image'; variant_sku=v['sku']
                        if vstatus=='multiple': notes='multiple variants match axes'
                    else:
                        target_field=('gallery[0](main)' if role=='main' else f'gallery({role})')
                        if ax and vstatus=='UNMATCHED': notes=f'axes {ax} -> no variant'
                    if color and not variant_sku: notes=(notes+'; ' if notes else '')+f'colorway {color} (finish axis)'
                elif pstatus=='matched-new-product':
                    # product to be CREATED (e.g. iron-standing-mirror-regal) per 2026-06-20 decision
                    target_kind='product'; target_slug=attempt; status='new-product'
                    target_field=('gallery[0](main)' if role=='main' else f'gallery({role})')
                    notes='create product first, then wire'
                else:
                    target_kind='product'; target_slug=attempt; status='UNMATCHED'
                    notes=f'no product for cats {sorted(catset)}'
            else:
                target_kind='design'; target_slug=design; status='review'; notes=f'role={role}'
        else:
            target_kind='?'; status='UNKNOWN-FOLDER'; notes=folder

        rows.append(dict(folder=folder,file=fn,role=role,
                         occupancy=','.join(occ),color=','.join(color),
                         categories=','.join(sorted(catset)),
                         axes=json.dumps(axes_from(tags,stem)) if tags else '',
                         target_kind=target_kind,target_slug=target_slug,
                         target_field=target_field,variant_sku=variant_sku,
                         status=status,notes=notes,tags=','.join(tags)))

# ---- write outputs ---------------------------------------------------------
os.makedirs(REPORT_DIR, exist_ok=True)
csv_path=os.path.join(REPORT_DIR,f'media-tag-wiring-dryrun-{STAMP}.csv')
with open(csv_path,'w',newline='') as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)

by_status=collections.Counter(r['status'] for r in rows)
by_kind=collections.Counter(r['target_kind'] for r in rows)
by_field=collections.Counter(r['target_field'] for r in rows if r['target_field'])
unmatched=[r for r in rows if 'UNMATCHED' in r['status'] or r['status'] in ('LOOSE','UNTAGGED','UNKNOWN-FOLDER')]
review=[r for r in rows if r['status'].startswith('review') or r['status'] in ('design-scene','multiple')]

print(f'\nTOTAL non-duplicate media files: {len(rows)}')
print('\n=== by status ==='); [print(f'  {c:4d}  {s}') for s,c in by_status.most_common()]
print('\n=== by target kind ==='); [print(f'  {c:4d}  {k}') for k,c in by_kind.most_common()]
print('\n=== by target field ==='); [print(f'  {c:4d}  {k}') for k,c in by_field.most_common()]
print(f'\nUNMATCHED/loose/untagged: {len(unmatched)}')
for r in unmatched[:40]:
    print(f"  [{r['status']}] {r['folder']}/{r['file']}  -> {r['target_slug']}  ({r['notes']})")
print(f'\nCSV: {csv_path}')
