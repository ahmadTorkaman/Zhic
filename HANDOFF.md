# Handoff — next session starting point

Update this whenever the actionable next steps change. Pair with `STATE.md`
(status) and `IDEAS.md` (backlog).

_Last updated: 2026-06-30._

---

## Where things are right now

The app runs on a **dev/review box** at public IP `45.140.42.57`:
- **Storefront** → http://45.140.42.57:3000
- **Payload admin/API** → http://45.140.42.57:3001/admin
- DB = PostgreSQL 16 in Docker (`zhic-postgres-1`), restored from the **Neon**
  dump (Neon is the source of truth). 282 products / 1352 media / 1 admin user.
- Media stored on **local disk** at `services/api/media/` (S3 disabled — `S3_ACCESS_KEY` empty).

This box is dev/local-run, not production. Production stack (Pars Pack VPS, Caddy,
Abr Arvan S3) is still per `.claude/CLAUDE.md`'s locked decisions.

---

## Bring the stack up

Toolchain is user-space under `~/.local` (Node 22 + pnpm 10.33, already on PATH).
Docker runs sudo-less for `ahmad` (re-login if you hit a permission error).

```bash
cd /home/ahmad/Zhic
docker compose up -d postgres                       # DB on :5432, db `zhic`
docker exec zhic-postgres-1 pg_isready -U postgres -d zhic
pnpm build                                          # turbo builds api + web + packages
nohup pnpm --filter @zhic/api start >/tmp/api.log 2>&1 &   # :3001
nohup pnpm --filter @zhic/web start >/tmp/web.log 2>&1 &   # :3000
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3001/admin   # 200
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/        # 200
```

Env: `services/api/.env` (DATABASE_URI, PAYLOAD_SECRET, S3 empty,
`NEXT_PUBLIC_SERVER_URL=http://45.140.42.57:3001`); `apps/web/.env.local`
(public URLs → 45.140.42.57). DB password lives in `services/api/.env` and a
root `.env` (consumed by docker-compose).

---

## Immediate next actions

1. **Source the missing art** — `ops/MEDIA-NEEDS-ART.md` is the single list of
   every image the catalog references but doesn't have. It's the one thing
   blocking the remaining bedroom-furniture / design-page polish. Hand it to the
   3D artist. As assets arrive, drop them in `ops/media-incoming/` and re-run the
   matcher (below).
2. **Re-run media wiring** when new files land:
   ```bash
   docker exec zhic-postgres-1 psql -U postgres -d zhic --csv -c \
     "select id, filename, filesize, width, height, mime_type from media order by id;" > ops/media-db.csv
   node services/api/scripts/wire-media.mjs ops/media-incoming services/api/media ops/media-db.csv --apply
   ```
   Idempotent — safe to re-run.
3. **Open decisions still parked** — see `IDEAS.md` (SSH hardening, DB backups,
   hero-image optimization, study-chair=vanity-chair reuse).

---

## How media wiring works (so you can extend it)

- DB media records reference files by `filename`; Payload serves them at
  `/api/media/file/<filename>` from `services/api/media/` (flat dir — **never**
  subfolder it).
- The matcher (`services/api/scripts/wire-media.mjs`) matches upload files to DB
  records by **content fingerprint** (filesize+dims+mime), because Payload
  dedup-renames and the upload uses different naming.
- "Use transparent" requests = repoint a product's `gallery[0]` to the bare
  cutout `<slug>.webp` (alpha) instead of the opaque `<slug>-picture*.webp`.
- `room-*` design-page heroes/cards are shrunk crops; when missing, regenerate
  from the de-prefixed full scene in the upload (resize ≤1920, webp q82).
- Source files we've processed are filed under `ops/media-incoming/_organized/`.

---

## Gotchas (these have bitten us)

- **API process renames itself to `next-server`** — to stop :3001, find it with
  `ss -ltnp | grep ':3001'` and `kill -9 <pid>`; `pkill -f "next start"` misses it.
- **`next/image` host allowlist** — components using `next/image` only load hosts
  in `apps/web/next.config.ts` → `images.remotePatterns`. The current box
  (`45.140.42.57`, :3000 and :3001) is allowlisted; a new box/domain needs adding
  + a web rebuild, or those images render blank (others using plain `<img>` work).
- **Stale fetch cache** — web runs `next start` (prod, no HMR) with
  `revalidate: 300`. After DB edits, purge `apps/web/.next/cache/fetch-cache` and
  restart web to see changes immediately.
- **Public image URLs** — Payload prefixes media URLs with `NEXT_PUBLIC_SERVER_URL`.
  If images point at `localhost`, that env is wrong → rebuild after fixing.
- **CSS module / next.config changes need a rebuild** (`pnpm --filter @zhic/web build`),
  not just a restart.
- **Don't run a second Claude session against this box's DB** — a parallel
  `claude` session once re-provisioned Postgres and wiped the DB (recovered from
  Neon). Coordinate or point other sessions elsewhere. (See STATE.md incident note.)
- **psql + sudo**: piping a heredoc to `docker exec` while feeding the sudo
  password on stdin collides — use `psql -f <file>` or copy the SQL into the
  container first.
