#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────────
# provision.sh — one-shot bootstrap for a fresh Ubuntu 22.04/24.04 VPS.
#
# Installs Docker, Caddy, Node (via nvm), pnpm, UFW firewall.
# Creates /var/zhic directory tree.
#
# Usage:
#   Run as root the first time after SSH:
#     curl -fsSL https://git.zhicwood.com/zhic/ops/raw/branch/main/provision.sh | sudo bash
#   Or from local:
#     scp provision.sh root@VPS_IP:/tmp/  &&  ssh root@VPS_IP "bash /tmp/provision.sh"
# ────────────────────────────────────────────────────────────────
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Error: run as root (or via sudo)" >&2
  exit 1
fi

log() { printf "\033[1;36m→\033[0m %s\n" "$*"; }
ok()  { printf "\033[1;32m✓\033[0m %s\n" "$*"; }

log "OS check"
if [[ ! -f /etc/os-release ]]; then echo "Not Ubuntu." >&2; exit 1; fi
. /etc/os-release
if [[ "$ID" != "ubuntu" ]]; then
  echo "Warning: tested on Ubuntu only, found $ID. Continuing anyway." >&2
fi
ok "$PRETTY_NAME"

log "Updating apt index"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y
apt-get install -y curl ca-certificates gnupg lsb-release ufw git jq \
  build-essential unzip rsync cron logrotate fail2ban htop

log "Creating zhic user"
if ! id -u zhic >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" zhic
  usermod -aG sudo zhic
  mkdir -p /home/zhic/.ssh
  # Copy authorized_keys from root so the same SSH key works
  if [[ -f /root/.ssh/authorized_keys ]]; then
    cp /root/.ssh/authorized_keys /home/zhic/.ssh/
    chown -R zhic:zhic /home/zhic/.ssh
    chmod 700 /home/zhic/.ssh
    chmod 600 /home/zhic/.ssh/authorized_keys
  fi
  ok "Created zhic user (can sudo, SSH key inherited from root)"
else
  ok "zhic user already exists"
fi

log "Setting up UFW firewall"
ufw --force reset >/dev/null
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP (Caddy)'
ufw allow 443/tcp comment 'HTTPS (Caddy)'
ufw --force enable
ok "UFW active: 22, 80, 443"

log "Installing Docker Engine"
if ! command -v docker >/dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $VERSION_CODENAME stable" \
    | tee /etc/apt/sources.list.d/docker.list > /dev/null
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io \
    docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
  ok "Docker installed"
else
  ok "Docker already installed"
fi

usermod -aG docker zhic || true
ok "zhic added to docker group"

log "Installing Caddy"
if ! command -v caddy >/dev/null; then
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    | tee /etc/apt/sources.list.d/caddy-stable.list > /dev/null
  apt-get update -y
  apt-get install -y caddy
  systemctl enable caddy
  ok "Caddy installed"
else
  ok "Caddy already installed"
fi

log "Installing Node via nvm (as zhic user)"
if ! sudo -u zhic bash -c 'command -v node' >/dev/null 2>&1; then
  sudo -u zhic bash <<'EOF'
set -e
export NVM_DIR="$HOME/.nvm"
if [[ ! -d "$NVM_DIR" ]]; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
fi
. "$NVM_DIR/nvm.sh"
nvm install 24
nvm use 24
nvm alias default 24
corepack enable
corepack prepare pnpm@latest --activate
EOF
  ok "Node 24 + pnpm installed for zhic"
else
  ok "Node already installed for zhic"
fi

log "Creating Zhic directory tree"
install -d -m 0755 -o zhic -g zhic /var/zhic
install -d -m 0755 -o zhic -g zhic /var/zhic/app           # code checkout
install -d -m 0755 -o zhic -g zhic /var/zhic/media         # Payload local media fallback
install -d -m 0755 -o zhic -g zhic /var/zhic/backups       # nightly pg_dump
install -d -m 0750 -o zhic -g zhic /var/zhic/secrets       # .env files
install -d -m 0755 -o zhic -g zhic /var/zhic/compose       # docker-compose + Caddy runtime
ok "/var/zhic tree created"

log "Installing fail2ban SSH jail (light)"
cat > /etc/fail2ban/jail.d/zhic-sshd.conf <<'EOF'
[sshd]
enabled = true
port = ssh
maxretry = 4
findtime = 10m
bantime = 1h
EOF
systemctl restart fail2ban
ok "fail2ban active on SSH"

log "Setting up log rotation for Zhic app logs"
cat > /etc/logrotate.d/zhic <<'EOF'
/var/log/zhic/*.log {
  daily
  rotate 14
  compress
  missingok
  notifempty
  copytruncate
}
EOF
install -d -m 0755 -o zhic -g zhic /var/log/zhic
ok "Logrotate config installed"

log "Writing systemd unit stubs"
cat > /etc/systemd/system/zhic-web.service <<'EOF'
[Unit]
Description=Zhic storefront (apps/web)
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=zhic
Group=zhic
WorkingDirectory=/var/zhic/app/apps/web
EnvironmentFile=/var/zhic/secrets/.env
ExecStart=/home/zhic/.nvm/versions/node/v24.14.1/bin/node node_modules/.bin/next start -p 3000 -H 127.0.0.1
Restart=on-failure
RestartSec=5
StandardOutput=append:/var/log/zhic/web.log
StandardError=append:/var/log/zhic/web-error.log

[Install]
WantedBy=multi-user.target
EOF

cat > /etc/systemd/system/zhic-api.service <<'EOF'
[Unit]
Description=Zhic Payload CMS (services/api)
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=zhic
Group=zhic
WorkingDirectory=/var/zhic/app/services/api
EnvironmentFile=/var/zhic/secrets/.env
ExecStart=/home/zhic/.nvm/versions/node/v24.14.1/bin/node node_modules/.bin/next start -p 3001 -H 127.0.0.1
Restart=on-failure
RestartSec=5
StandardOutput=append:/var/log/zhic/api.log
StandardError=append:/var/log/zhic/api-error.log

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
ok "systemd units installed (zhic-web, zhic-api — not yet started)"

echo
echo "──────────────────────────────────────────────────────────────"
echo "  Provisioning complete."
echo "──────────────────────────────────────────────────────────────"
echo
echo "Next steps (see ops/deploy.md for the full playbook):"
echo "  1. Point domain DNS at this server's IP"
echo "  2. SSH as zhic:     ssh zhic@$(curl -s ifconfig.me || echo YOUR-VPS-IP)"
echo "  3. Clone the repo:  git clone https://git.../zhic.git /var/zhic/app"
echo "  4. Fill in .env:    cp /var/zhic/app/ops/env.example /var/zhic/secrets/.env"
echo "                      vim /var/zhic/secrets/.env"
echo "  5. Run deploy:      bash /var/zhic/app/ops/deploy.sh"
echo
