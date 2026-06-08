#!/usr/bin/env bash
# Bootstrap a fresh Ubuntu 24.04 LTS VPS for GoMaths.
#
# What this does:
#   1. Updates apt and installs base utilities
#   2. Installs Docker Engine + Compose v2
#   3. Creates the shared `web` docker network
#   4. Configures UFW firewall (allows 22/80/443 only)
#   5. Creates a non-root `gomaths` user with docker group access
#   6. Enables unattended security updates
#   7. Hardens SSH (root login + password auth disabled)
#
# What it does NOT do:
#   - Clone the repo (do that manually as the gomaths user, see README)
#   - Set up DNS (configure your domain's A record to point here)
#   - Create .env.production (you must fill it in by hand)
#
# Run as root once on first boot:
#   curl -fsSL https://raw.githubusercontent.com/vitalclick/GoMaths/main/infrastructure/vps/bootstrap.sh | sudo bash
#
# Or after cloning the repo:
#   sudo bash infrastructure/vps/bootstrap.sh

set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Error: this script must be run as root (or with sudo)." >&2
  exit 1
fi

APP_USER="${APP_USER:-gomaths}"

echo "==> 1/7  apt update + base utilities"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
  ca-certificates \
  curl \
  git \
  ufw \
  fail2ban \
  unattended-upgrades \
  htop \
  jq

echo "==> 2/7  Installing Docker Engine + Compose plugin"
install -m 0755 -d /etc/apt/keyrings
if [ ! -f /etc/apt/keyrings/docker.asc ]; then
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
fi

UBUNTU_CODENAME="$(. /etc/os-release && echo "$VERSION_CODENAME")"
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
https://download.docker.com/linux/ubuntu $UBUNTU_CODENAME stable" \
  > /etc/apt/sources.list.d/docker.list

apt-get update -qq
apt-get install -y -qq \
  docker-ce \
  docker-ce-cli \
  containerd.io \
  docker-buildx-plugin \
  docker-compose-plugin

systemctl enable --now docker

echo "==> 3/7  Creating shared 'web' docker network"
# Used by the central Caddy reverse proxy and every app container that
# needs to be publicly reachable. Idempotent.
docker network inspect web >/dev/null 2>&1 || docker network create web

echo "==> 4/7  Configuring UFW firewall"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp comment 'HTTP (Caddy ACME challenge + redirect)'
ufw allow 443/tcp comment 'HTTPS'
ufw allow 443/udp comment 'HTTP/3 (QUIC)'
ufw --force enable

echo "==> 5/7  Creating $APP_USER user"
if ! id "$APP_USER" >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" "$APP_USER"
fi
usermod -aG docker "$APP_USER"
# Propagate the operator's authorized_keys so they can SSH as the app user too.
if [ -d /root/.ssh ] && [ -f /root/.ssh/authorized_keys ]; then
  mkdir -p "/home/$APP_USER/.ssh"
  cp /root/.ssh/authorized_keys "/home/$APP_USER/.ssh/authorized_keys"
  chmod 700 "/home/$APP_USER/.ssh"
  chmod 600 "/home/$APP_USER/.ssh/authorized_keys"
  chown -R "$APP_USER:$APP_USER" "/home/$APP_USER/.ssh"
fi

echo "==> 6/7  Enabling unattended security updates"
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF

echo "==> 7/7  Hardening SSH (disabling root login + password auth)"
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl reload ssh || systemctl reload sshd || true

cat <<EOF

============================================================================
Bootstrap complete.

Next steps:
  1. SSH in as the app user:
       ssh $APP_USER@$(hostname -I | awk '{print $1}')

  2. Clone the repo:
       git clone https://github.com/vitalclick/GoMaths.git
       cd GoMaths

  3. Start the shared Caddy reverse proxy (once per VPS):
       cd infrastructure/vps/caddy
       cp .env.example .env
       \$EDITOR .env                 # set ACME_EMAIL
       docker compose up -d
       cd ../../..

  4. Create the GoMaths env file:
       cp infrastructure/vps/.env.production.example .env.production
       \$EDITOR .env.production       # fill in every value

  5. Point api.gomaths.co.za (or your domain) at $(hostname -I | awk '{print $1}'),
     wait for DNS to propagate (~5 min), then start the GoMaths stack:
       docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

  6. Watch logs:
       docker compose -f docker-compose.prod.yml logs -f

Verify HTTPS works:
  curl https://api.gomaths.co.za/api/health

To add another app to this VPS, see infrastructure/vps/README.md →
"Adding another app".
============================================================================
EOF
