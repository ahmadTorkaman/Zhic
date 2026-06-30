# Ideas & backlog

Things worth doing that aren't scheduled yet. Append whenever something surfaces
mid-session that you don't act on. Move items to `STATE.md` when they become
active work, or delete when done/rejected.

_Last updated: 2026-06-30._

---

## Infra / ops

- **DB backups.** The local `zhic` DB is only safe because Neon still holds the
  source dump. Set up a periodic `pg_dump` (cron) before treating local as
  authoritative. A parallel session already wiped it once.
- **SSH hardening.** Root SSH login is enabled and recent logins came from several
  IPs. Consider disabling direct root SSH (use `ahmad` + sudo), key-only auth.
- **Lock down public ports.** `:3000`/`:3001` are reachable on the public IP over
  plain HTTP — fine for a review box, not for anything real. Put behind Caddy + TLS
  + a real domain before go-live (per locked stack: Pars Pack + Caddy + Abr Arvan).
- **Move media to Abr Arvan S3** for production (S3 is wired in `payload.config.ts`,
  just needs creds) so media isn't tied to one box's disk.

## Media / catalog

- **Hero image optimization.** Regenerated design-page heroes are capped at 1920px
  webp q82. Revisit if heroes feel heavy on mobile; the original `room-*` crops
  were ≤1080. Could generate responsive sizes (Payload has no imageSizes pipeline).
- **study-chair = vanity-chair reuse.** Many designs use the same chair for study &
  vanity. We chose to wait for dedicated study-chair art, but reusing the
  vanity-chair cutout for elegance/elizabeth/lukaplus would unblock 3 of 5 imageless
  study chairs cheaply. Revisit if the artist won't supply distinct renders.
- **Empty complement tiles.** `/complement` still shows empty tiles for
  changing-table, changing-top, and bed-jack (products unpublished, but the hub
  lists all child categories). Left per operator decision; revisit if they should
  be hidden (detach category from `complement`).
- **`bed-jack` category has no products.** Either populate it or remove it.
- **Transparent-cutout vanity images.** shaylin & baloot vanity tables want a
  transparent cutout but only opaque `-picture` exists — needs art.

## Cleanup

- **`ops/media-incoming/` organization.** ~700 source files still unsorted under
  `zhic-media-copy/`; processed batches are filed under `_organized/`. Finish
  sorting as categories get wired.
- **Stale handoff docs.** `docs/superpowers/handoff-2026-05-2x.md` predate this
  workflow; fold anything still relevant into `HANDOFF.md` and archive the rest.
