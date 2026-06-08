# VPS Deployment — GoMaths

Run the entire GoMaths backend stack on a single Ubuntu VPS using Docker
Compose, alongside any other apps you want to host on the same box.
Cheapest path to a public HTTPS API URL for TestFlight beta.

## Architecture

The VPS uses a **shared reverse proxy** pattern so multiple apps can
share ports 80/443 and one Caddy instance handles TLS for all of them.

```
                  ┌────────────────────────────────────────┐
                  │           public internet              │
                  └────────────────────────────────────────┘
                                    │ 80/443
                                    ▼
       ┌────────────────────────────────────────────────────┐
       │   shared Caddy (infrastructure/vps/caddy/)         │
       │   - terminates TLS for every public hostname       │
       │   - reverse-proxies by virtual host                │
       └────────────────────────────────────────────────────┘
                                    │ docker network `web`
        ┌──────────────────────┬────┴─────┬─────────────────────┐
        ▼                      ▼          ▼                     ▼
   gomaths-backend       (next-app)   (next-app)            ...
   (apps join `web`     each on its own private network for
    with an alias)      its own datastores + sidecars
```

## What gets deployed (GoMaths only)

| Container    | Purpose                                       | Reachable from |
| ------------ | --------------------------------------------- | -------------- |
| `backend`    | NestJS API (alias `gomaths-backend` on `web`) | shared Caddy   |
| `tutor`      | FastAPI tutor (Anthropic / OpenAI)            | backend only   |
| `solver`     | FastAPI OCR solver (MathPix)                  | backend only   |
| `validation` | FastAPI SymPy validator                       | backend only   |
| `postgres`   | Postgres 16                                   | backend only   |
| `redis`      | Redis 7 (throttling + token cache)            | backend only   |

The GoMaths stack itself exposes no host ports. The shared Caddy
project (`infrastructure/vps/caddy/`) owns 80/443 and is the only
thing publicly reachable.

All six GoMaths containers fit comfortably in **~2 GB of RAM** when idle,
leaving room for 2–3 more small apps on a 4 GB VPS.

## Recommended VPS sizing

| Provider      | Plan       | RAM  | Cost     | Notes                            |
| ------------- | ---------- | ---- | -------- | -------------------------------- |
| Hetzner       | CX22       | 4 GB | €3.79/mo | Best price/perf; EU/US regions   |
| Hetzner       | CX32       | 8 GB | €6.99/mo | Pick this if hosting 4+ apps     |
| DigitalOcean  | Basic 2 GB | 2 GB | $12/mo   | Tight under load — fine for beta |
| AWS Lightsail | 2 GB Linux | 2 GB | $12/mo   | If your team requires AWS        |

---

## First-time setup (once per VPS)

### 0. Prerequisites

- A VPS with Ubuntu 24.04 LTS.
- A domain you control with DNS access (`gomaths.co.za`).
- SSH access to the VPS as root.

### 1. Bootstrap the VPS

SSH in as root, then:

```bash
curl -fsSL https://raw.githubusercontent.com/vitalclick/GoMaths/main/infrastructure/vps/bootstrap.sh | sudo bash
```

This installs Docker + Compose, creates the shared `web` docker
network, configures UFW (22/80/443 only), creates a non-root `gomaths`
user, enables unattended security updates, and hardens SSH.

### 2. Start the shared Caddy reverse proxy

```bash
ssh gomaths@<vps ip>
git clone https://github.com/vitalclick/GoMaths.git
cd GoMaths/infrastructure/vps/caddy
cp .env.example .env
$EDITOR .env                # set ACME_EMAIL to a real address
docker compose up -d
```

Verify it's listening:

```bash
docker compose ps
ss -ltnp | grep -E ':80|:443'
```

Caddy is now sitting at port 80/443 ready to terminate TLS for any
hostname declared in `infrastructure/vps/caddy/Caddyfile`. Right now
that's just `api.gomaths.co.za`.

### 3. Point DNS at the VPS

Cloudflare → `gomaths.co.za` zone → DNS → Add A record:

```
api  →  <vps public IP>   (proxy: DNS only / gray cloud)
```

Verify: `dig +short api.gomaths.co.za` returns the VPS IP.

---

## Deploy GoMaths

### 4. Create `.env.production`

```bash
cd ~/GoMaths
cp infrastructure/vps/.env.production.example .env.production
```

Generate secrets:

```bash
openssl rand -base64 32 | tr -d '/+=' | head -c 32  # POSTGRES_PASSWORD
openssl rand -base64 32 | tr -d '/+=' | head -c 32  # REDIS_PASSWORD
openssl rand -base64 64 | tr -d '\n'                # JWT_ACCESS_SECRET
openssl rand -base64 64 | tr -d '\n'                # JWT_REFRESH_SECRET
openssl rand -base64 64 | tr -d '\n'                # PARENTAL_CONSENT_INVITE_SECRET
openssl rand -base64 64 | tr -d '\n'                # PARENTAL_CONSENT_RECEIPT_SECRET
```

Fill in the rest of `.env.production`:

- `RESEND_API_KEY=re_...`
- `EMAIL_FROM="GoMaths <consent@gomaths.co.za>"` — domain must be verified in Resend
- `PUBLIC_APP_URL=https://gomaths.co.za`
- (Optional) `SENTRY_DSN`, `ANTHROPIC_API_KEY`, `MATHPIX_*`

`API_DOMAIN` and `ACME_EMAIL` are no longer here — they live in
`infrastructure/vps/caddy/.env` because Caddy owns the public-facing
config.

### 5. Start the stack

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

First build takes ~5–8 min. Watch logs:

```bash
docker compose -f docker-compose.prod.yml logs -f
```

You should see, in order:

```
postgres-1   | database system is ready to accept connections
redis-1      | Ready to accept connections tcp
validation-1 | Uvicorn running on http://0.0.0.0:8080
tutor-1      | Uvicorn running on http://0.0.0.0:8080
solver-1     | Uvicorn running on http://0.0.0.0:8080
backend-1    | prisma:engine ... Applying migration `xxx`
backend-1    | [Nest] Nest application successfully started
```

Caddy logs (separate compose project) will show the Let's Encrypt
challenge succeeding the first time api.gomaths.co.za resolves:

```bash
docker compose -f infrastructure/vps/caddy/docker-compose.yml logs caddy | grep -i cert
```

### 6. Verify

```bash
curl https://api.gomaths.co.za/api/health
# {"status":"ok","timestamp":"..."}
```

If `/api/health` returns 200, **the backend is live**.

### 7. Wire the mobile apps

In each Codemagic workflow's `environment.vars`, or in
`apps/{student,parent,teacher}/app.json` under `extra`:

```json
"extra": {
  "EXPO_PUBLIC_API_URL": "https://api.gomaths.co.za"
}
```

Tag a build — the iOS app will hit your VPS.

---

## Adding another app to this VPS

Once the shared Caddy is up, each new app is a "drop-in" — clone the
app's repo, make sure its compose file follows the contract below, and
add one block to the central Caddyfile.

### Contract each new app's compose must follow

1. Give the public-facing container a known **alias on the `web`
   network**, e.g. `myapp-backend`:

   ```yaml
   services:
     backend:
       networks:
         myapp-internal: # private network for the app's datastores
         web:
           aliases:
             - myapp-backend # what Caddy will reverse-proxy to
   ```

2. Declare both networks at the bottom — `web` must be **external**:

   ```yaml
   networks:
     myapp-internal:
       driver: bridge
     web:
       external: true
   ```

3. Do **not** publish ports 80/443 in the app's compose. The shared
   Caddy owns them.

### Three steps to onboard a new app

```bash
# 1. Clone the app's repo on the VPS.
ssh gomaths@<vps ip>
git clone https://github.com/your-org/otherapp.git
cd otherapp
# ... fill in its .env.production ...

# 2. Add a hostname block to the central Caddyfile.
$EDITOR ~/GoMaths/infrastructure/vps/caddy/Caddyfile
# Add:
#   otherapp.example.com {
#     reverse_proxy otherapp-backend:3000
#   }

# 3. Reload Caddy + start the new app.
docker compose -f ~/GoMaths/infrastructure/vps/caddy/docker-compose.yml \
  exec caddy caddy reload --config /etc/caddy/Caddyfile
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Don't forget to point DNS for the new hostname at the VPS first.

### Resource ceiling

A 4 GB CX22 comfortably hosts GoMaths + 2–3 small apps. Past that,
upgrade to CX32 (8 GB, €6.99/mo). To prevent one runaway app from OOM-
killing Postgres, cap memory per service in each app's compose:

```yaml
services:
  someapp:
    deploy:
      resources:
        limits:
          memory: 512M
```

---

## Day-2 operations

### Deploy a new GoMaths version

```bash
ssh gomaths@<vps ip>
cd GoMaths
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
docker image prune -f
```

Backend boots run `prisma migrate deploy` automatically.

### Tail logs

```bash
# GoMaths stack
docker compose -f docker-compose.prod.yml logs -f
# Just the backend
docker compose -f docker-compose.prod.yml logs -f backend
# Shared Caddy (TLS + routing)
docker compose -f infrastructure/vps/caddy/docker-compose.yml logs -f
```

### Reload Caddy after editing Caddyfile

```bash
docker compose -f infrastructure/vps/caddy/docker-compose.yml \
  exec caddy caddy reload --config /etc/caddy/Caddyfile
```

Reload is zero-downtime; restart only if reload fails to apply.

### Postgres backups

Install the cron entry from `backup.sh` (header has the exact crontab
line). For off-VPS backups, pipe the gzipped dump to S3 / Backblaze B2.

### Rotate a secret

```bash
# Update .env.production, then:
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
# Compose recreates only containers whose env changed.
```

JWT secrets cannot be rotated without invalidating existing sessions.

### Shell into a container

```bash
docker compose -f docker-compose.prod.yml exec backend sh
docker compose -f docker-compose.prod.yml exec postgres psql -U gomaths gomaths
docker compose -f docker-compose.prod.yml exec redis redis-cli -a "$REDIS_PASSWORD"
```

### Stop the GoMaths stack

```bash
docker compose -f docker-compose.prod.yml down            # stops, keeps data
docker compose -f docker-compose.prod.yml down --volumes  # also wipes data (destructive)
```

The shared Caddy keeps running — other apps on the VPS are unaffected.

---

## Troubleshooting

| Symptom                                          | Likely cause                                                         | Fix                                                                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `network web not found` when starting an app     | Caddy compose project wasn't started, or `web` network was deleted   | `docker network create web && docker compose -f infrastructure/vps/caddy/docker-compose.yml up -d`                  |
| `caddy` logs show `failed to obtain certificate` | DNS not pointing at VPS yet, port 80 blocked, or Cloudflare proxy on | Verify A record, check `sudo ufw status`, switch Cloudflare proxy to "DNS only" (gray cloud)                        |
| Caddy returns 502 Bad Gateway                    | App container's network alias on `web` doesn't match the Caddyfile   | `docker inspect <container>` and confirm `Networks.web.Aliases` includes the alias the Caddyfile reverse-proxies to |
| `backend` exits with `P1001 can't reach DB`      | Postgres still booting on first start                                | Wait; the `depends_on: condition: service_healthy` should handle it                                                 |
| Resend rejects emails with `domain not verified` | `EMAIL_FROM` domain not yet verified in Resend                       | Add DKIM + SPF DNS records from Resend dashboard; wait 5–10 min                                                     |
| Out-of-memory kills                              | VPS RAM exhausted                                                    | Upgrade plan, or cap per-service memory with `deploy.resources.limits` in each app's compose                        |
| Disk fills up                                    | Old Docker images / postgres WAL / backup retention                  | `docker image prune -af`, check `/var/backups/gomaths`                                                              |

---

## What this setup does NOT give you

- **No HA.** If the VPS dies, every app on it is down until you restore. Wire `backup.sh` to off-VPS storage before going live.
- **No horizontal scaling.** All apps + datastores share one machine.
- **No CDN.** Direct hits to the VPS. Add Cloudflare in front later when traffic grows.
- **Shared blast radius.** A misbehaving app can starve the others if you don't set memory limits.

For a TestFlight beta with one or two small additional apps this is the
right trade-off. The migration path off (managed Postgres, separate
VMs, ECS/Fly) is straightforward — same Docker images, different host.
