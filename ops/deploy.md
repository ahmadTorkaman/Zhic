> # ⚠ OUTDATED — see the active bringup plan
>
> This document describes the previous **two-tier** topology (`staging.zhicwood.com` / `zhicwood.com` on one VPS, gated by Caddy basic_auth) and is no longer the operator's guide.
>
> The **active plan** for the new three-tier topology (Pars Pack workspace + Net Afraz tier 2 `zhic.ir` review + Net Afraz tier 3 `zhicwood.com`/`.co` production) is at:
>
> **`docs/superpowers/plans/2026-05-10-tier2-zhicir-bringup.md`**
>
> The design spec is at `docs/superpowers/specs/2026-05-10-infra-tier2-tier3-bringup-design.md`.
>
> The sections below are preserved as historical reference until they are rewritten. Do not follow them.

---

# Zhic deploy playbook

Step-by-step from "I just bought a VPS" to "staging.zhicwood.com is live."
Follow top-to-bottom. Skip nothing on the first run.

Assumes:
- Fresh Ubuntu 22.04 or 24.04 VPS, IP known, root SSH working
- A domain you can edit DNS for (via Abr Arvan or any registrar)
- The Zhic git repo accessible (Gitea or GitHub)

---

## Phase 0 — Before touching the VPS

- [ ] **Buy domain** `zhicwood.com`. Verify admin access to DNS panel.
- [ ] **Note your VPS IP**: e.g. `80.240.31.146`
- [ ] Generate two secrets locally and write them down safely:
  ```bash
  openssl rand -hex 24   # for POSTGRES_PASSWORD
  openssl rand -hex 32   # for PAYLOAD_SECRET
  ```
- [ ] If using `SMS.ir`: register business account, get API key +
      line number + template ID. Keep them for step 3.

---

## Phase 1 — DNS

Point these records at your VPS IP. TTL 5-10 min for quick propagation.

**Staging:**
| Type | Name | Value | Notes |
|---|---|---|---|
| A | `staging.zhicwood.com` | `<VPS IP>` | primary |
| A | `api.staging.zhicwood.com` | `<VPS IP>` | Payload CMS |

**Production (when ready):**
| Type | Name | Value | Notes |
|---|---|---|---|
| A | `zhicwood.com` | `<VPS IP>` | |
| A | `www.zhicwood.com` | `<VPS IP>` | optional redirect |
| A | `api.zhicwood.com` | `<VPS IP>` | |
| A | `git.zhicwood.com` | `<VPS IP>` | prod-only |
| A | `analytics.zhicwood.com` | `<VPS IP>` | prod-only, optional |

- [ ] Verify DNS: `dig +short staging.zhicwood.com` → should return VPS IP.
      Takes 1-10 min after you save the record. Wait if empty.

---

## Phase 2 — Provision the VPS

```bash
# From your laptop:
scp ops/provision.sh root@<VPS_IP>:/tmp/
ssh root@<VPS_IP> "bash /tmp/provision.sh"
```

This takes ~5-10 minutes. Installs Docker, Caddy, Node 24, pnpm, UFW,
fail2ban, creates `zhic` user + `/var/zhic/` tree + systemd service stubs.

- [ ] Script completes without error
- [ ] `ssh zhic@<VPS_IP>` works (same SSH key as root)
- [ ] `ufw status` shows 22, 80, 443 allowed
- [ ] `systemctl status caddy` shows "loaded (disabled)" — OK, we'll start it
      with config in Phase 4

**Note about existing services on the box:** if you're using a box that
already has things running, `provision.sh` is idempotent but doesn't
remove existing installs. Watch for port conflicts on 5432 (Postgres),
80, 443.

---

## Phase 3 — Clone the repo + fill env

```bash
ssh zhic@<VPS_IP>
git clone <REPO_URL> /var/zhic/app
# Or if Gitea isn't up yet: clone from GitHub or rsync from laptop
cp /var/zhic/app/ops/env.example /var/zhic/secrets/.env
chmod 640 /var/zhic/secrets/.env
vim /var/zhic/secrets/.env
```

Fill in (see env.example for all vars):

- [ ] `ZHIC_ENV=staging` (or `production`)
- [ ] `ZHIC_DOMAIN=staging.zhicwood.com`
- [ ] `ZHIC_ACME_EMAIL=newton.ahmadreza@gmail.com`
- [ ] `POSTGRES_PASSWORD=<generated in Phase 0>`
- [ ] `DATABASE_URI` matches the POSTGRES_PASSWORD above
- [ ] `PAYLOAD_SECRET=<generated in Phase 0>`
- [ ] `NEXT_PUBLIC_SERVER_URL=https://staging.zhicwood.com`
- [ ] S3 fields — leave blank on staging (uses local disk)
- [ ] SMS.ir — leave blank on staging (logs only) or fill for real sends

---

## Phase 4 — First deploy

```bash
# Still as zhic user:
cd /var/zhic/app
bash ops/deploy.sh
```

This runs:
1. `pnpm install` (first time → ~5-10 min)
2. Patches Payload's loadEnv.js
3. `pnpm --filter @zhic/web build` (~2-3 min)
4. `pnpm --filter @zhic/api build`
5. `docker compose up -d` → Postgres starts
6. Starts `zhic-web` + `zhic-api` systemd services
7. Copies Caddyfile into place + reloads Caddy
8. Caddy requests TLS cert from Let's Encrypt automatically

- [ ] Script completes, all checks green
- [ ] `journalctl -u zhic-web -n 50` shows "Ready" from Next.js
- [ ] `journalctl -u zhic-api -n 50` shows "Ready"
- [ ] `docker compose ps` shows Postgres healthy

---

## Phase 5 — Seed Payload (first time only)

```bash
cd /var/zhic/app/services/api
# Seed should work now — we're on a fresh Postgres with known creds
pnpm seed
```

If the seed hits the loadEnv error again, `ops/deploy.sh` should have
patched it. Re-run `deploy.sh` if not.

- [ ] Seed completes — "Seed successful" message
- [ ] Visit `https://staging.zhicwood.com/` — homepage renders with
      real data (no more "تصویر به‌زودی" placeholders if any media was
      uploaded in seed)

---

## Phase 6 — Create admin user

```bash
# Browser: visit the Payload admin UI
open https://api.staging.zhicwood.com/admin
# Or:
https://staging.zhicwood.com/admin   # depending on ZHIC_DOMAIN
```

- [ ] First-time-admin form appears
- [ ] Create admin with email: `newton.ahmadreza@gmail.com`
      and password you choose (store in password manager)
- [ ] Login works

---

## Phase 7 — Smoke tests

Go through the Month 1 exit criteria. All should pass.

- [ ] `https://staging.zhicwood.com/` — homepage loads, hero visible
- [ ] `https://staging.zhicwood.com/products` — products index renders
- [ ] `https://staging.zhicwood.com/journal` — journal index renders
- [ ] `https://staging.zhicwood.com/showrooms` — showrooms index renders
- [ ] `https://staging.zhicwood.com/contact` — form renders
- [ ] Submit the contact form with your real phone
- [ ] [if SMS_IR_API_KEY set] SMS arrives on the correct showroom manager
- [ ] Admin creates a test product in Payload → appears on storefront
      within 5 minutes (Next revalidation window)
- [ ] Mobile viewport (DevTools 390px) — header, hero, brand stats
      ticker all look right
- [ ] Basic auth prompt works on staging URL from incognito
- [ ] `curl -I https://staging.zhicwood.com/` returns 200 + correct
      Cache-Control headers
- [ ] TLS cert valid, no browser warnings

---

## Phase 8 — Backups

Nightly `pg_dump` to `/var/zhic/backups/`:

```bash
# Edit zhic's crontab:
crontab -e
# Add:
0 3 * * * docker exec -t zhic-postgres-1 pg_dumpall -U zhic \
  | gzip > /var/zhic/backups/pg-$(date +\%Y\%m\%d).sql.gz
0 4 * * * find /var/zhic/backups -name 'pg-*.sql.gz' -mtime +14 -delete
```

- [ ] Run the dump manually once to verify: `<paste the docker exec line>`
- [ ] Optional: rsync the backup dir to Abr Arvan S3 weekly

---

## What to do if something goes wrong

### Caddy can't issue cert
- Check DNS: `dig +short staging.zhicwood.com` must return your VPS IP
- Port 80 blocked? `sudo ufw status` + check VPS provider firewall
- Rate limited? Use staging ACME CA (uncomment in Caddyfile) while debugging
- `journalctl -u caddy -n 50 -f`

### zhic-web fails to start
- `journalctl -u zhic-web -n 100`
- Usually: missing env var, port 3000 taken, or build didn't complete
- Rebuild: `cd /var/zhic/app && pnpm --filter @zhic/web build`

### Postgres won't start
- `docker compose logs postgres`
- If port 5432 taken by another process: `sudo lsof -i :5432` then kill it
- If data volume corrupt: backup first, then `docker volume rm zhic_pgdata`

### Inquiry form submits but no SMS
- Check SMS.ir creds in `/var/zhic/secrets/.env`
- `journalctl -u zhic-web -n 200 | grep -i sms`
- SMS.ir dashboard: verify account active + credits available

---

## Subsequent deploys

Once first deploy is green, every code change is just:

```bash
ssh zhic@<VPS_IP>
cd /var/zhic/app
bash ops/deploy.sh
```

Or wire this into Gitea Actions once Gitea is up on production.

---

## Cutover from staging → production

When you're ready to flip the switch:

1. Buy a second Pars Pack VPS with more headroom (4 vCPU / 8 GB).
2. Run `provision.sh` on it.
3. Clone repo, copy `.env` and change:
   - `ZHIC_ENV=production`
   - `ZHIC_DOMAIN=zhicwood.com`
   - Fill in S3_* for real media
   - Fill in SMS_IR_* for real SMS
4. `deploy.sh`
5. Point `zhicwood.com` DNS at production IP
6. Wait for TLS, verify, celebrate.
7. Staging stays up as the dev target.
