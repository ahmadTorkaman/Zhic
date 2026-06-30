# Media wiring — handoff

**Goal:** get the uploaded media files placed into Payload's static dir under the
*exact filenames the database expects*, so the storefront and admin render images.
The upload is complete; what remains is matching → placing → resolving leftovers →
verifying.

This file is a self-contained prompt. A fresh Claude Code session (or a person) can
start from here with no prior context.

---

## 0. TL;DR of current state (measured, not guessed)

- DB: PostgreSQL 16 in Docker, database `zhic`, **1352 media records**.
- Only **712** of those records are actually referenced by content
  (products/variants/designs/etc.). The other 640 are abandoned dupes/legacy
  Finglish-named uploads and **do not need files**. See `ops/target-referenced-names.txt`.
- Uploaded source files live in `ops/media-incoming/` (~793 files, ~629 MB).
- Last dry-run result (content matching, no copy yet):
  - **507 / 712** referenced records matched by content → ready to place.
  - **205** referenced records still missing a file, split into:
    - **67** that have a same-named file in the upload but with *different bytes*
      (re-exported since the Payload upload) → recoverable by a **name-based pass**.
    - **138** that are *truly absent* (no file by name or content) →
      `ops/referenced-truly-absent.txt`. These need to be sourced, or accepted as gaps.
  - **233** orphan files (match no DB record) and **3** ambiguous collisions.

Target after name-based pass: ~574/712 (~81%) wired without sourcing new files.

---

## 1. Environment / how to bring the stack up

Everything is user-space under `/home/ahmad`. No root needed for the app; Docker is
installed and the `ahmad` user is in the `docker` group, so **docker works without
sudo in a fresh SSH session** (if you get a permission error, your shell predates the
group change — just re-login, or prefix with `sudo`).

```bash
# Toolchain (Node 22 + pnpm 10.33 live in ~/.local, already on PATH via ~/.bashrc)
node -v          # v22.14.0
pnpm -v          # 10.33.0
cd /home/ahmad/Zhic

# 1. Database (Postgres 16, db `zhic`, port 5432)
docker compose up -d postgres
docker exec zhic-postgres-1 pg_isready -U postgres -d zhic   # -> accepting connections

# 2. API (Payload + admin) on :3001, and storefront on :3000
#    They run as background `next start`. Build first if not built:
pnpm build                                   # turbo builds packages + api + web
nohup pnpm --filter @zhic/api start >/tmp/api.log 2>&1 &
nohup pnpm --filter @zhic/web start >/tmp/web.log 2>&1 &

# 3. Smoke test
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3001/admin   # 200
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/        # 200
```

Key env: `services/api/.env` (DATABASE_URI → local postgres, S3 keys empty →
**local-disk media**), `apps/web/.env.local` (API_URL → :3001).

> To stop the API before DB surgery: it renames its process to `next-server`.
> Find it with `ss -ltnp | grep ':3001'` and `kill -9 <pid>` (a plain
> `pkill -f "next start"` will NOT match).

### Where media files must physically go

Payload resolves uploads as `path.resolve(staticDir||slug, filename)` with cwd =
`services/api`. So the static dir is:

```
/home/ahmad/Zhic/services/api/media/<exact db filename>
```

Served at `/api/media/file/<filename>`. There are **no resized variants**
(no `sizes_*` columns), so it's exactly one file per record.

---

## 2. The matcher

Script: `services/api/scripts/wire-media.mjs` (run from `services/api` so it can
`require('sharp')`). It matches source files to DB records by **content fingerprint**
(`filesize` + `width` + `height` + `mime`), independent of name, because the upload
uses clean English slugs while many DB names are dedup-renamed (`-1`, `-2`) or legacy.

Passes:
1. exact: basename == db.filename AND filesize == db.filesize
2. fingerprint: unique `(filesize, width, height)` match

Inputs/outputs:
```bash
# Refresh DB fingerprint CSV (id,filename,filesize,width,height,mime_type)
docker exec zhic-postgres-1 psql -U postgres -d zhic --csv -c \
  "select id, filename, filesize, width, height, mime_type from media order by id;" \
  > ops/media-db.csv

# DRY RUN (reports only, copies nothing)
node services/api/scripts/wire-media.mjs \
  /home/ahmad/Zhic/ops/media-incoming \
  /home/ahmad/Zhic/services/api/media \
  /home/ahmad/Zhic/ops/media-db.csv

# APPLY (copies matched files into services/api/media/)
node services/api/scripts/wire-media.mjs \
  /home/ahmad/Zhic/ops/media-incoming \
  /home/ahmad/Zhic/services/api/media \
  /home/ahmad/Zhic/ops/media-db.csv --apply
```

Writes `ops/wire-media-result.json` with `matched`, `missing`, `orphans`, `ambiguous`.

---

## 3. Step-by-step to finish

### Step A — apply the content matches (safe, high confidence)
Run the matcher with `--apply`. This places the 507 referenced (+ any matched
unreferenced) files. Re-run any time; it copies, never moves.

### Step B — recover the 67 re-exports by name (needs a judgement call)
67 referenced records have a same-named source file whose bytes differ (re-exported
after the Payload upload). The filename is the authoritative slug, so copying the
orphan onto the DB name is almost certainly correct — but it means the on-disk file
won't match the DB's stored `filesize`/`width`/`height` metadata (cosmetic only;
Payload still serves it). Recommended: do it, then optionally refresh metadata.

To generate and apply the name-based copies:
```bash
node -e '
const fs=require("fs"),path=require("path");
const res=JSON.parse(fs.readFileSync("ops/wire-media-result.json","utf8"));
const missing=fs.readFileSync("ops/referenced-missing.txt","utf8").trim().split("\n");
const orphanByBase=new Map();
for(const o of res.orphans){const b=path.basename(o.path);(orphanByBase.get(b)||orphanByBase.set(b,[]).get(b)).push(o);}
const TARGET="services/api/media";let n=0;
for(const m of missing){const o=orphanByBase.get(m);
  if(o&&o.length===1){fs.copyFileSync(o[0].path,path.join(TARGET,m));n++;}
  else if(o&&o.length>1){console.log("REVIEW (multiple same-name orphans):",m);}}
console.log("name-recovered:",n);
'
```
> If a name maps to multiple orphans it prints REVIEW — inspect those by hand
> (different folders/resolutions of the same slug; pick the intended one).

If you want the DB metadata to match the new bytes afterward, re-upload those
through the admin instead, or write a small script that updates
`media.filesize/width/height` from the on-disk file via `sharp`.

### Step C — the 138 truly-absent referenced records
List: `ops/referenced-truly-absent.txt`. These have no file by content or name.
Categories seen: `*-mosaic-tile.jpg`, `detail-*.jpg`, several `bedroom-set-*-poster*`,
`namemark-*`, scene renders, and uuid-named files. Options:
- Source them from the original asset library / 3D artist and drop into
  `ops/media-incoming/`, then re-run Steps A–B.
- Or accept as gaps for now — find which pages they break via the usage data
  (`ops/media-usage.csv`, column `sources`) and prioritise the customer-facing ones
  (products/categories/home) over admin-only or variant detail shots.

### Step D — the 3 ambiguous collisions
Same `(filesize,width,height)` as another record but different names. Listed in the
matcher's `ambiguous` output and `ops/wire-media-result.json`. Resolve by eye
(open both, decide which slug each belongs to) and copy manually.

### Step E — orphans
233 source files match no DB record. Most are unused extras (`Untitled design.png`,
`Zhicwood URL list.xlsx`), higher-res re-exports, or the byte-diff partners handled
in Step B. After Steps A–B, regenerate the report and review whatever orphans remain —
anything genuinely new that *should* be in the catalog has to be uploaded via the
admin so a DB record gets created for it (the matcher only places files for records
that already exist).

---

## 4. Verify

```bash
# How many referenced records now have a file on disk:
node -e '
const fs=require("fs");
const target=fs.readFileSync("ops/target-referenced-names.txt","utf8").trim().split("\n");
let have=0,miss=[];
for(const n of target){ if(fs.existsSync("services/api/media/"+n)) have++; else miss.push(n); }
console.log("referenced on disk:",have,"/",target.length); 
fs.writeFileSync("ops/still-missing.txt",miss.join("\n")+"\n");
'

# HTTP check a few (expect 200 + image/*). Restart API if you copied files while it ran
# (not required — Payload reads from disk per request — but harmless):
for f in iron-double-bed-160.webp caroline-nightstand.webp showroom-tabriz.webp; do
  curl -s -o /dev/null -w "$f %{http_code} %{content_type}\n" \
    "http://localhost:3001/api/media/file/$f"
done

# Eyeball a product page that uses real media:
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/products/iron-bed-teen
```

Spot-check the storefront in a browser (http://localhost:3000) and the admin media
library (http://localhost:3001/admin). The admin login user came across in the Neon
dump — use existing prod credentials.

---

## 5. File reference

| File | What it is |
| --- | --- |
| `ops/media-incoming/` | Uploaded source files (English-slug names) |
| `services/api/media/` | **Target** — where Payload reads media |
| `services/api/scripts/wire-media.mjs` | The matcher (content fingerprint) |
| `ops/media-db.csv` | DB fingerprint export (regenerate as shown above) |
| `ops/media-usage.csv` | Per-record: id, filename, ref_count, sources |
| `ops/target-referenced-names.txt` | The 712 records that actually need a file |
| `ops/referenced-missing.txt` | Referenced records with no content match (205) |
| `ops/referenced-truly-absent.txt` | Referenced records with no file at all (138) |
| `ops/finglish-names.txt` | 296 legacy names — all unreferenced, ignore |
| `ops/wire-media-result.json` | Last matcher run: matched/missing/orphans/ambiguous |

---

## 6. Gotchas

- **Run the matcher from `services/api`** (or anywhere its `node_modules` resolves
  `sharp`) — it lives in `scripts/` for exactly this reason.
- **Stopping the API:** the process is named `next-server`, not `next start`.
- **Docker + sudo:** should work sudo-less in a fresh login; older shells may need sudo.
- **Filenames contain spaces** (`deraver 3 kesho.webp`) — always quote paths.
- **Don't trust the DB's filesize after Step B** — name-recovered files have different
  bytes than the stored metadata. Cosmetic; refresh only if you care about srcset.
- **The matcher only places files for records that already exist.** Genuinely new
  images must be uploaded through the admin to create their DB record first.
- **Unreferenced ≠ broken.** 640 records (incl. all 296 legacy) are unused; skipping
  them is correct, not a gap.
