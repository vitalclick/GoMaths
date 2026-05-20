# VPS Deployment — GoMaths

Run the entire GoMaths backend stack on a single Ubuntu VPS using Docker
Compose. Cheapest path to a public HTTPS API URL for TestFlight beta.

## What gets deployed

| Container    | Purpose                            | Exposed?             |
| ------------ | ---------------------------------- | -------------------- |
| `caddy`      | Reverse proxy + auto-TLS           | 80 + 443 (public)    |
| `backend`    | NestJS API                         | internal (via Caddy) |
| `tutor`      | FastAPI tutor (Anthropic / OpenAI) | internal only        |
| `solver`     | FastAPI OCR solver (MathPix)       | internal only        |
| `validation` | FastAPI SymPy validator            | internal only        |
| `postgres`   | Postgres 16                        | internal only        |
| `redis`      | Redis 7 (throttling + token cache) | internal only        |

All seven containers fit comfortably in **2 GB of RAM** when idle.

## Recommended VPS sizing

| Provider      | Plan          | RAM  | Cost     | Notes                            |
| ------------- | ------------- | ---- | -------- | -------------------------------- |
| Hetzner       | CX22          | 4 GB | €3.79/mo | Best price/perf; EU/US regions   |
| DigitalOcean  | Basic 2 GB    | 2 GB | $12/mo   | Tight under load — fine for beta |
| Vultr         | Cloud Compute | 2 GB | $12/mo   | —                                |
| AWS Lightsail | 2 GB Linux    | 2 GB | $12/mo   | If your team requires AWS        |

You can run the whole thing on 2 GB but 4 GB gives you headroom for
Postgres + Redis growth and JVM-style spikes when the Node backend
compiles its bundle.

---

## Deployment, end to end

### 0. Prerequisites

- A VPS with Ubuntu 24.04 LTS (any provider).
- A domain you control with DNS access (e.g. `gomaths.com`).
- SSH access to the VPS as root (or sudo-capable user).

### 1. Bootstrap the VPS

SSH in as root, then run:

```bash
curl -fsSL https://raw.githubusercontent.com/vitalclick/GoMaths/main/infrastructure/vps/bootstrap.sh | sudo bash
```

This installs Docker + Compose, configures UFW (only 22/80/443 open),
creates a non-root `gomaths` user, enables unattended security updates,
and disables SSH root login / password auth.

### 2. Point DNS at the VPS

In your DNS provider's dashboard, create an A record:

```
api.yourdomain.com  →  <vps public IP>
```

Wait for propagation (~1–5 min). Check with `dig api.yourdomain.com`.

### 3. Clone the repo as the app user

```bash
ssh gomaths@<vps ip>
git clone https://github.com/vitalclick/GoMaths.git
cd GoMaths
```

### 4. Create `.env.production`

```bash
cp infrastructure/vps/.env.production.example .env.production
```

Generate the secrets:

```bash
# Inside .env.production, paste the output of each command into the right line.
openssl rand -base64 32 | tr -d '/+=' | head -c 32  # POSTGRES_PASSWORD
openssl rand -base64 32 | tr -d '/+=' | head -c 32  # REDIS_PASSWORD
openssl rand -base64 64 | tr -d '\n'                # JWT_ACCESS_SECRET
openssl rand -base64 64 | tr -d '\n'                # JWT_REFRESH_SECRET
openssl rand -base64 64 | tr -d '\n'                # PARENTAL_CONSENT_INVITE_SECRET
openssl rand -base64 64 | tr -d '\n'                # PARENTAL_CONSENT_RECEIPT_SECRET
```

Fill in the rest:

- `API_DOMAIN=api.yourdomain.com` — must match the DNS record from step 2.
- `ACME_EMAIL=you@yourdomain.com` — Let's Encrypt expiry notices.
- `RESEND_API_KEY=re_...` — sign up at resend.com.
- `EMAIL_FROM=GoMaths <consent@yourdomain.com>` — domain must be verified in Resend.
- `PUBLIC_APP_URL=https://app.yourdomain.com` — student web SPA URL (placeholder OK for beta).
- (Optional) `SENTRY_DSN`, `ANTHROPIC_API_KEY`, `MATHPIX_*` — leave blank to use mock providers.

### 5. Start the stack

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

First build takes ~5–8 min (cold pnpm install + 4 Docker images). Watch logs:

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
caddy-1      | certificate obtained successfully
```

### 6. Verify

```bash
# From your laptop:
curl https://api.yourdomain.com/api/health
# {"status":"ok","timestamp":"..."}
```

If `/api/health` returns 200, **the backend is live**.

### 7. Wire the mobile apps

In `apps/{student,parent,teacher}/app.json`, add:

```json
"extra": {
  "EXPO_PUBLIC_API_URL": "https://api.yourdomain.com"
}
```

Or set them as Codemagic workflow `vars:`. Then tag a build and the
iOS app will hit your VPS.

---

## Day-2 operations

### Deploy a new version

```bash
ssh gomaths@<vps ip>
cd GoMaths
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
docker image prune -f
```

Backend boots run `prisma migrate deploy` automatically — no manual
migration step.

### Tail logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Just the backend
docker compose -f docker-compose.prod.yml logs -f backend
```

### Postgres backups

Install the cron entry from `backup.sh` (header has the exact crontab
line). For off-VPS backups, pipe the gzipped dump to S3 / Backblaze B2
/ similar — a single-VPS deployment has no inherent redundancy and
"the box died" recovery starts from the latest off-VPS backup.

### Rotate a secret

```bash
# Update .env.production, then:
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
# Compose recreates only containers whose env changed.
```

JWT secrets cannot be rotated without invalidating existing sessions —
users will need to log in again.

### Shell into a container

```bash
docker compose -f docker-compose.prod.yml exec backend sh
docker compose -f docker-compose.prod.yml exec postgres psql -U gomaths gomaths
docker compose -f docker-compose.prod.yml exec redis redis-cli -a "$REDIS_PASSWORD"
```

### Stop everything

```bash
docker compose -f docker-compose.prod.yml down            # stops, keeps data
docker compose -f docker-compose.prod.yml down --volumes  # also wipes Postgres + Redis (destructive)
```

---

## Troubleshooting

| Symptom                                          | Likely cause                                        | Fix                                                                                                                                  |
| ------------------------------------------------ | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `caddy` logs show `failed to obtain certificate` | DNS not pointing at VPS yet, or port 80 blocked     | Verify A record; check `sudo ufw status`                                                                                             |
| `backend` exits with `P1001 can't reach DB`      | Postgres still booting on first start               | Wait; the `depends_on: condition: service_healthy` should handle it. If persistent, check `POSTGRES_PASSWORD` matches `DATABASE_URL` |
| `backend` exits with `Missing required env: ...` | A required env var in `.env.production` is blank    | Fill it in and `up -d` again                                                                                                         |
| Resend rejects emails with `domain not verified` | `EMAIL_FROM` domain not yet verified in Resend      | Add DKIM + SPF DNS records from Resend dashboard; wait 5–10 min                                                                      |
| Out-of-memory kills                              | 2 GB VPS under sustained load                       | Upgrade to 4 GB plan, or set `--maxmemory` lower on redis                                                                            |
| Disk fills up                                    | Old Docker images / postgres WAL / backup retention | `docker image prune -af`, `docker volume ls`, check `/var/backups/gomaths`                                                           |

---

## What this setup does NOT give you

Be honest with yourself about the trade-offs:

- **No HA.** If the VPS dies, the app is down until you restore from
  backup onto a new box (~30–60 min recovery if you've practised).
- **No horizontal scaling.** All seven containers share one machine's
  CPU + RAM.
- **No managed Postgres backups.** You own this — wire `backup.sh` to
  off-VPS storage before going live.
- **No CDN.** Direct hits to the VPS. Fine for an API; you'll want
  CloudFront / Cloudflare in front when traffic grows.

For a TestFlight beta this is exactly the right tradeoff. When you
outgrow it, the same Docker images move to ECS / Fly / Kubernetes with
no code changes.
