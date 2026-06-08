# GoMaths — End-to-End Deployment Task List

Follow these phases top to bottom to take the app from zero to a working
TestFlight build. Each task is a single checkbox you can tick off as you go.

For detail beyond what's here, see:

- `infrastructure/vps/README.md` — the VPS deployment in depth
- `docs/codemagic-setup.md` — the Codemagic UI configuration in depth

---

## Phase 0 — Accounts you'll need (one-time)

Create these before anything else. Each has a verification step (email,
phone, credit card) that takes 5–30 min. Doing them in parallel saves
half a day.

- [ ] **Cloudflare** account (free) — DNS host for `gomaths.co.za`
- [ ] **VPS provider** account with payment method (Hetzner / DigitalOcean / Vultr — see provider table in `infrastructure/vps/README.md`)
- [ ] **Resend** account → verify domain `gomaths.co.za` (DKIM + SPF DNS records, ~10 min to propagate)
- [ ] **Apple Developer Program** enrolment — **$99/year, takes 24–48h to approve** (start this NOW if you haven't)
- [ ] **Google Play Console** account — $25 one-time, instant
- [ ] **Codemagic** account — sign up with GitHub
- [ ] **Sentry** account (optional but recommended) — create two projects: `gomaths-backend` (Node) and `gomaths-mobile` (React Native)
- [ ] **OpenAI** or **Anthropic** API key (optional — tutor uses whichever is provided; if both, OpenAI wins; if neither, a mock provider returns canned replies)
- [ ] **MathPix** account (optional — without it the OCR solver uses a mock)

---

## Phase 1 — Domain + DNS

- [ ] Confirm `gomaths.co.za` is registered and you have access to its nameservers
- [ ] (If not already) move the domain to Cloudflare: registrar → set nameservers to the two Cloudflare assigns you. Wait for activation (1–24h)
- [ ] Verify activation: `dig +short NS gomaths.co.za` returns `*.ns.cloudflare.com`

> The actual `api.gomaths.co.za` A record gets created in Phase 2 once you have a VPS IP.

---

## Phase 2 — Backend deployment (VPS)

Goal: `curl https://api.gomaths.co.za/api/health` returns `200 OK`.

### 2.1 Provision the VPS

- [ ] Spin up an Ubuntu 24.04 LTS VPS (Hetzner CX22 recommended, 4 GB RAM)
- [ ] Add your SSH public key to the VPS during creation
- [ ] Note the public IPv4 address

### 2.2 Point DNS at the VPS

- [ ] Cloudflare → `gomaths.co.za` zone → DNS → **Add record**:
  - Type: `A`
  - Name: `api`
  - IPv4: `<your VPS IP>`
  - Proxy: **DNS only** (gray cloud — important for Let's Encrypt)
- [ ] Verify: `dig +short api.gomaths.co.za` returns your VPS IP

### 2.3 Bootstrap the VPS

- [ ] SSH in as root: `ssh root@<vps ip>`
- [ ] Run the bootstrap script:
  ```bash
  curl -fsSL https://raw.githubusercontent.com/vitalclick/GoMaths/main/infrastructure/vps/bootstrap.sh | sudo bash
  ```
- [ ] Confirm `gomaths` user exists, Docker is installed, UFW shows 22/80/443 open, `docker network ls` shows the `web` network

### 2.4 Clone the repo + start the shared Caddy reverse proxy

- [ ] SSH in as the app user: `ssh gomaths@<vps ip>`
- [ ] Clone: `git clone https://github.com/vitalclick/GoMaths.git && cd GoMaths`
- [ ] Configure Caddy (one-time per VPS — owns TLS for every app):
  ```bash
  cd infrastructure/vps/caddy
  cp .env.example .env
  $EDITOR .env                    # set ACME_EMAIL
  docker compose up -d
  cd ../../..
  ```
- [ ] Verify Caddy is listening: `ss -ltnp | grep -E ':80|:443'`

### 2.5 Fill in `.env.production`

- [ ] `cp infrastructure/vps/.env.production.example .env.production`
- [ ] Generate 4 JWT/consent secrets:
  ```bash
  for k in JWT_ACCESS JWT_REFRESH PARENTAL_CONSENT_INVITE PARENTAL_CONSENT_RECEIPT; do
    echo "${k}_SECRET=$(openssl rand -base64 64 | tr -d '\n')"
  done
  ```
- [ ] Generate 2 datastore passwords:
  ```bash
  echo "POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)"
  echo "REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)"
  ```
- [ ] Paste those values into `.env.production`
- [ ] Set `RESEND_API_KEY=re_...` (from Resend dashboard)
- [ ] Set `EMAIL_FROM="GoMaths <consent@gomaths.co.za>"` (domain must be verified in Resend already)
- [ ] Set `PUBLIC_APP_URL=https://gomaths.co.za` (placeholder fine for beta)
- [ ] (Optional) `SENTRY_DSN`, `ANTHROPIC_API_KEY`, `MATHPIX_*`

> `API_DOMAIN` and `ACME_EMAIL` are NOT in this env file — they live in `infrastructure/vps/caddy/.env` because the shared Caddy owns TLS.

### 2.6 Start the GoMaths stack

- [ ] `docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build`
- [ ] Watch logs: `docker compose -f docker-compose.prod.yml logs -f`
- [ ] Wait for `backend-1 | [Nest] Nest application successfully started`
- [ ] Caddy obtains its TLS cert on the first request to `api.gomaths.co.za` — check:
  ```bash
  docker compose -f infrastructure/vps/caddy/docker-compose.yml logs caddy | grep -i cert
  ```

### 2.7 Verify

- [ ] From your laptop: `curl https://api.gomaths.co.za/api/health` returns 200
- [ ] TLS cert is valid: `curl -vI https://api.gomaths.co.za 2>&1 | grep -i "subject:\|issuer:"`
- [ ] Backend can reach Postgres: `docker compose exec backend sh -c 'wget -qO- http://localhost:8080/api/health'` returns 200

### 2.8 Wire backups

- [ ] As `gomaths` user: `crontab -e` and add:
  ```
  30 3 * * * /home/gomaths/GoMaths/infrastructure/vps/backup.sh >> /var/log/gomaths-backup.log 2>&1
  ```
- [ ] Verify cron runs after midnight UTC tomorrow, or test now: `bash infrastructure/vps/backup.sh`
- [ ] **Before any real users**: pipe `/var/backups/gomaths/` to off-VPS storage (Backblaze B2 / S3 / rclone)

---

## Phase 3 — Mobile apps wired to the backend

- [ ] Decide where `EXPO_PUBLIC_API_URL` is set:
  - **Option A (recommended):** add it to each Codemagic workflow's `environment.vars` block in `codemagic.yaml`
  - **Option B:** add `"extra": { "EXPO_PUBLIC_API_URL": "https://api.gomaths.co.za" }` to each `apps/{student,parent,teacher}/app.json`
- [ ] Set `EXPO_PUBLIC_SENTRY_DSN` (mobile Sentry project) — leave blank if skipping Sentry for now
- [ ] Commit + push the change
- [ ] (Locally, optional sanity check) Run the student app against the deployed backend: `cd apps/student && EXPO_PUBLIC_API_URL=https://api.gomaths.co.za pnpm dev`
  - Sign up a test account
  - Verify the consent email arrives in your inbox

---

## Phase 4 — Apple Developer + App Store Connect

Cannot be done until your Apple Developer Program enrolment is approved (Phase 0).

- [ ] Confirm enrolment is approved (you'll get an email)
- [ ] App Store Connect → **My Apps** → **+ New App** — create one app per bundle ID:
  - [ ] `com.gomaths.mathai` — "GoMaths" (Primary Language: English, SKU: gomaths-student)
  - [ ] `com.gomaths.mathai.parent` — "GoMaths · Parent" (SKU: gomaths-parent)
  - [ ] `com.gomaths.mathai.teacher` — "GoMaths · Teacher" (SKU: gomaths-teacher)
- [ ] For each of the 3 apps: **TestFlight** → **Internal Testing** → **+** → group name **`GoMaths Internal`** (must match `beta_groups` in `codemagic.yaml`)
- [ ] Add yourself + initial testers to the **GoMaths Internal** group (max 100 internal testers, must be users in your team)
- [ ] App Store Connect → **Users and Access** → **Integrations** → **App Store Connect API** → **+** → role **App Manager** → download the `.p8` key file. **Note the Issuer ID + Key ID** — they're shown only once

---

## Phase 5 — Codemagic configuration

Detailed click-by-click in `docs/codemagic-setup.md`. The high-level checklist:

### 5.1 Connect the repo

- [ ] Codemagic → **Add application** → GitHub → `vitalclick/GoMaths`
- [ ] Choose build configuration: **codemagic.yaml**

### 5.2 iOS — App Store Connect API key

- [ ] Codemagic → **Teams** → **Integrations** → **Developer Portal** → **App Store Connect** → **Add key**
  - Name in Codemagic: **`gomaths_appstore`** (exact match — referenced in `codemagic.yaml`)
  - Issuer ID, Key ID, .p8 file from Phase 4

### 5.3 Android — generate + upload keystores

- [ ] Generate 3 keystores (run locally — keep backups!):
  ```bash
  for app in student parent teacher; do
    keytool -genkeypair -v -storetype PKCS12 \
      -keystore "gomaths-${app}.keystore" \
      -alias "gomaths-${app}" \
      -keyalg RSA -keysize 2048 -validity 36500
  done
  ```
- [ ] **Back up all 3 .keystore files + passwords to a password manager** (losing these means you can never update the app on Play Store)
- [ ] Codemagic → **Teams** → **Code signing identities** → **Android keystores** → upload each:
  - `gomaths_student_keystore` (alias: `gomaths-student`)
  - `gomaths_parent_keystore` (alias: `gomaths-parent`)
  - `gomaths_teacher_keystore` (alias: `gomaths-teacher`)

### 5.4 Android — Google Play service account

- [ ] Google Play Console → **Setup** → **API access** → link Google Cloud project → create service account
- [ ] Grant role **Service Account User** in Google Cloud, then **Release manager** in Play Console
- [ ] Download the JSON key
- [ ] Codemagic → **Teams** → **Environment variables** → group **`google_play_credentials`**:
  - Variable: `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS`
  - Value: paste the full JSON
  - Secure: ✔

### 5.5 Google Play Console — create the 3 apps

- [ ] Create app: `com.gomaths.mathai` ("GoMaths")
- [ ] Create app: `com.gomaths.mathai.parent`
- [ ] Create app: `com.gomaths.mathai.teacher`
- [ ] For each: complete the content rating + privacy policy + target audience forms (required before Play accepts any upload)
- [ ] For each: manually upload a **first** AAB so the internal track exists (Codemagic can update, can't bootstrap)

> Tip: you can generate the first AAB by tagging a build and downloading the artifact from Codemagic; then upload it manually to Play, after which subsequent builds auto-publish.

### 5.6 Set mobile env vars in Codemagic workflows

If you chose Option A in Phase 3, edit `codemagic.yaml` and add to each workflow's `environment.vars`:

```yaml
EXPO_PUBLIC_API_URL: "https://api.gomaths.co.za"
EXPO_PUBLIC_SENTRY_DSN: "https://...@sentry.io/..." # or omit
EXPO_PUBLIC_SENTRY_ENVIRONMENT: "production"
```

- [ ] Commit + push

---

## Phase 6 — First TestFlight build (student app)

Start with one app to debug the pipeline before doing all three.

- [ ] Pull latest `main` locally
- [ ] Tag and push:
  ```bash
  git tag student-v2.0.1
  git push origin student-v2.0.1
  ```
- [ ] Codemagic dashboard → watch `Student · iOS · TestFlight` workflow
- [ ] Expect ~25 min cold build, ~15 min warm
- [ ] On failure: read the failing step's log, fix the issue, re-tag with `student-v2.0.2` (tag names must be unique to re-trigger)

### Most likely first-run failures

- [ ] **CocoaPods install fails** → bump Xcode/CocoaPods version in `codemagic.yaml`
- [ ] **Scheme not found** → check `scripts/codemagic/prebuild-ios.sh` discovery; hardcode the scheme name if needed
- [ ] **Code signing fails** → verify `gomaths_appstore` integration is set up and the App Store Connect app exists with the right bundle ID
- [ ] **TestFlight upload fails with "Invalid binary"** → bundle ID mismatch, or build number conflict (versions <= existing TestFlight builds)

### Verification

- [ ] Build succeeds, .ipa uploaded to TestFlight
- [ ] App Store Connect → TestFlight → see the build appear under **iOS Builds** with status "Processing" (~10–15 min, then "Ready to Submit" or "Ready to Test")
- [ ] You receive a TestFlight email invitation; install **TestFlight** on your iPhone, accept invite, install the app
- [ ] Open the app on device — verify it can sign up (consent email arrives) and reach the backend

---

## Phase 7 — Roll out remaining apps

Once `student-ios` works end-to-end:

- [ ] Tag + push `student-v2.0.2` (triggers Android too — verify Play internal track receives the AAB)
- [ ] Tag + push `parent-v2.0.1` (triggers parent iOS + Android)
- [ ] Tag + push `teacher-v2.0.1` (triggers teacher iOS + Android)
- [ ] Add real beta testers:
  - **iOS:** App Store Connect → TestFlight → External Testing → create group → invite via email (max 10,000)
  - **Android:** Play Console → Testing → Internal testing → add tester emails (or move to closed testing for larger groups)

---

## Phase 8 — Pre-launch hardening (before inviting >50 users)

- [ ] Off-VPS Postgres backups working (test a restore on a throwaway VM)
- [ ] Sentry DSN set on backend + mobile, and you see test errors arriving
- [ ] Resend domain reputation OK (no spam-folder issues in test emails)
- [ ] Apple's required compliance: App Store Connect → each app → App Privacy → fill in the data collection questionnaire (mandatory for TestFlight external testing)
- [ ] Decide on `PUBLIC_APP_URL` — if there's no student web SPA yet, point it at a "coming soon" page so consent email links don't 404
- [ ] Monitor: `fly logs` equivalent on the VPS:
  ```bash
  docker compose -f docker-compose.prod.yml logs -f --tail=200
  ```
- [ ] (Optional) Add a GitHub Action that auto-deploys to the VPS on `main` push (saves the SSH-and-`git pull` dance)

---

## Quick reference — what each piece costs

| Item                            | Cost                  |
| ------------------------------- | --------------------- |
| Hetzner CX22 VPS                | €3.79/mo              |
| Cloudflare DNS                  | free                  |
| Resend (first 3k emails/month)  | free                  |
| Apple Developer Program         | $99/year              |
| Google Play Console             | $25 one-time          |
| Codemagic (first 500 min/month) | free (≈10 iOS builds) |
| Sentry (5k events/month)        | free                  |
| Anthropic API                   | usage-based           |
| **Beta total (no LLM yet)**     | **~€4/mo + $99/year** |

---

## When you're stuck

- VPS won't start a service → `docker compose logs <service>`
- Caddy can't get a cert → check DNS, port 80 reachable, Cloudflare proxy is off
- Codemagic step fails → click into the failing step, read the last 50 log lines
- TestFlight upload fails → check the exact error in Codemagic logs; the App Store Connect "Invalid binary" emails are usually more specific
- Backend boots but `/api/health` 500s → `docker compose logs backend` will show the missing env var on line 1 of the stack
