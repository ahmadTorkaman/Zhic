# ops/ — Zhic deployment

Scripts + configs that take a fresh Ubuntu 22.04/24.04 VPS and turn it into
a running Zhic host. Works for **staging** (`staging.zhicwood.com`) and
**production** (`zhicwood.com`) — the difference is in `.env` values, not
the scripts.

---

## What's here

| File | Purpose | When you run it |
|---|---|---|
| `provision.sh` | One-shot bootstrap: installs Docker, Caddy, Node, UFW, pnpm. Creates directories. | Once, on a fresh VPS |
| `docker-compose.yml` | Long-running services: Postgres, Caddy, Plausible (optional), Gitea (optional) | Started by `deploy.sh`; keeps running |
| `Caddyfile` | Reverse-proxy config for all subdomains. Uses env vars. | Loaded by the Caddy container |
| `deploy.sh` | Idempotent: pulls latest code, builds, restarts app processes | Every time you want to deploy |
| `env.example` | Template for `.env` in this folder. Copy, fill in secrets. | Once, after `provision.sh` |
| `deploy.md` | Step-by-step playbook — the thing you follow from "I just bought a VPS" to "my site is live" | Reference |

---

## Architecture on the box

```
 [internet]
    │ :443 / :80
    ▼
 ┌─────────────────────────┐
 │  Caddy (host network)   │ ◄── auto-TLS via Let's Encrypt
 │   zhicwood.com          │
 │   staging.zhicwood.com  │ ◄── basic auth
 │   git.zhicwood.com      │ ◄── prod only
 │   api.zhicwood.com      │
 └─────────────────────────┘
    │                │
    │ :3000          │ :3001
    ▼                ▼
 ┌───────────┐  ┌────────────┐
 │ apps/web  │  │ services/  │   (both run as systemd services
 │  Next.js  │  │   api      │    managed by deploy.sh — not
 │  prod     │  │  Payload   │    Docker. See "Why not Docker
 └───────────┘  └────────────┘    everywhere" below.)
        │            │
        └──────┬─────┘
               │
          ┌────▼─────┐
          │ Postgres │  (Docker — docker-compose.yml)
          │   :5432  │
          └──────────┘
```

### Why not Docker everywhere?

`apps/web` and `services/api` run as **systemd services**, not Docker
containers. Reasons:

1. `pnpm --filter @zhic/web build` with Turbopack needs native Node, not
   a slim Alpine image. Multi-stage Docker build is possible but
   slower on Iran-side CI/CD and flakier with pnpm workspaces.
2. Caddy + systemd + Node on the host = fewer moving parts, easier
   `journalctl` debugging than `docker logs -f` chasing.
3. Postgres, Plausible, Gitea **are** in Docker because they're
   monolithic services with their own state volumes — containerizing
   makes backup + upgrade easier.

---

## staging vs production

| Concern | staging | production |
|---|---|---|
| Domain | `staging.zhicwood.com` | `zhicwood.com` |
| Basic auth | **yes** (`ZHIC_STAGING_AUTH`) | no |
| Postgres | Docker, same box | Docker, same box (or managed later) |
| Plausible | optional (low retention) | **yes** |
| Gitea | **no** (one source of truth) | **yes** at `git.zhicwood.com` |
| Payload media | local disk (`/var/zhic/media`) | Abr Arvan S3 |
| SMS.ir | test credits | real credits |
| `NEXT_PUBLIC_SERVER_URL` | `https://staging.zhicwood.com` | `https://zhicwood.com` |
| Resource envelope | 2 vCPU / 4 GB OK | 4 vCPU / 8 GB recommended |

All flags are driven by `.env` in this directory. No code changes needed
to move between envs.

---

## Dependency order

```
provision.sh             (once, root)
   │
   ▼
fill in ops/.env
   │
   ▼
docker compose up -d     (long-running services — postgres first)
   │
   ▼
deploy.sh                (first time — clones repo, seeds DB, starts app)
   │
   ▼
[DNS ready?] ──► [certs issued by Caddy] ──► [live]
```

---

## Quick links

- Full step-by-step: **[deploy.md](./deploy.md)**
- If something breaks: **`journalctl -u zhic-web -n 100 -f`** (app logs)
  or **`docker compose logs -f postgres`** (db logs)

---

## FAQ

**Q: Can I run both staging and production on the same box?**
No — Caddy config resolves different domains to different upstreams and
they'd share Postgres. Keep them on separate VPSes.

**Q: Do I need to own a domain before running `provision.sh`?**
No for `provision.sh` itself. Yes before `deploy.sh` succeeds (Caddy
can't issue certs without DNS pointed at the VPS).

**Q: Can I skip Plausible / Gitea?**
Yes. Both are gated behind Docker Compose profiles (`--profile analytics`
and `--profile git`). Skip the profile flag when `docker compose up`.
