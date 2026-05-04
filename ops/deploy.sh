#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────────
# deploy.sh — idempotent deploy for Zhic.
#
# Runs on the VPS (as zhic user). Pulls latest code, installs deps,
# builds apps/web + services/api, runs DB migrations, restarts systemd
# services.
#
# Safe to run repeatedly. Does NOT destroy data. DB is only migrated
# forward, never reset.
#
# Usage:
#   bash /var/zhic/app/ops/deploy.sh
#   bash /var/zhic/app/ops/deploy.sh --branch main   # specify branch
#   bash /var/zhic/app/ops/deploy.sh --skip-build    # restart only
# ────────────────────────────────────────────────────────────────
set -euo pipefail

BRANCH="main"
SKIP_BUILD=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --branch) BRANCH="$2"; shift 2 ;;
    --skip-build) SKIP_BUILD=1; shift ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

APP_DIR=/var/zhic/app
SECRETS_ENV=/var/zhic/secrets/.env

if [[ ! -f "$SECRETS_ENV" ]]; then
  echo "Error: $SECRETS_ENV missing. Copy ops/env.example and fill it in." >&2
  exit 1
fi

# Load nvm (systemd doesn't have nvm on PATH by default)
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use default

log() { printf "\033[1;36m→\033[0m %s\n" "$*"; }
ok()  { printf "\033[1;32m✓\033[0m %s\n" "$*"; }

cd "$APP_DIR"

log "Git fetch + checkout $BRANCH"
git fetch origin
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"
ok "At commit $(git rev-parse --short HEAD)"

if [[ $SKIP_BUILD -eq 0 ]]; then
  log "pnpm install"
  pnpm install --frozen-lockfile

  # Keep the Payload loadEnv.js CJS/ESM patch applied (FU-3.1-o).
  # pnpm install wipes node_modules, so re-apply every deploy until
  # pnpm patch is formalized.
  PATCH_FILE=$(find node_modules/.pnpm -path '*payload*/dist/bin/loadEnv.js' 2>/dev/null | head -1)
  if [[ -n "$PATCH_FILE" ]]; then
    if grep -q "nextEnvImport" "$PATCH_FILE" 2>/dev/null; then
      log "Re-applying Payload loadEnv.js patch"
      # shellcheck disable=SC2016
      sed -i 's|^import nextEnvImport from .@next/env.;$|import * as nextEnvAll from "@next/env";|' "$PATCH_FILE"
      sed -i 's|^const { loadEnvConfig } = nextEnvImport;$|const loadEnvConfig = nextEnvAll.loadEnvConfig ?? nextEnvAll.default?.loadEnvConfig;|' "$PATCH_FILE"
      ok "Patched"
    fi
  fi

  log "Build apps/web"
  pnpm --filter @zhic/web build

  log "Build services/api"
  pnpm --filter @zhic/api build

  log "Generate Payload types (optional, non-fatal)"
  pnpm --filter @zhic/api generate:types || echo "  (skipped — not fatal)"
else
  log "Skipping build (--skip-build)"
fi

log "Ensure docker services are up"
cd /var/zhic/compose
# Pick profiles based on ZHIC_ENV
set -a; . "$SECRETS_ENV"; set +a
PROFILES=""
if [[ "${ZHIC_ENV:-staging}" == "production" ]]; then
  PROFILES="--profile analytics --profile git"
fi
# shellcheck disable=SC2086
docker compose $PROFILES up -d postgres
docker compose $PROFILES up -d
ok "Docker services running"

log "Restart zhic-web + zhic-api"
sudo systemctl restart zhic-web zhic-api
sleep 3
if systemctl is-active --quiet zhic-web; then ok "zhic-web up"; else echo "✗ zhic-web failed — check journalctl -u zhic-web" >&2; exit 1; fi
if systemctl is-active --quiet zhic-api; then ok "zhic-api up"; else echo "✗ zhic-api failed — check journalctl -u zhic-api" >&2; exit 1; fi

log "Reload Caddy"
# Copy current Caddyfile into place + validate + reload
sudo cp "$APP_DIR/ops/Caddyfile" /etc/caddy/Caddyfile
if sudo caddy validate --config /etc/caddy/Caddyfile; then
  sudo systemctl reload caddy
  ok "Caddy reloaded"
else
  echo "✗ Caddyfile invalid — not reloading" >&2
  exit 1
fi

echo
echo "──────────────────────────────────────────────────────────────"
echo "  Deploy complete. Commit: $(git rev-parse --short HEAD)"
echo "──────────────────────────────────────────────────────────────"
echo
echo "Quick checks:"
echo "  curl -I https://\${ZHIC_DOMAIN}/"
echo "  journalctl -u zhic-web -n 50 -f"
echo "  docker compose logs --tail 50 postgres"
