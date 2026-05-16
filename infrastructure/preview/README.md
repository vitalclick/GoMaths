# Preview deployment runbook

A reproducible path from a clean Fly.io + Cloudflare Pages account to a
public URL of GoMaths showing the Student app's full happy path. Not
production — see `../../infrastructure/README.md` for the AWS plan.

**Time:** ~1–2 hours end-to-end on an unfamiliar account, less than 30
minutes if you've done it before.

**Cost (preview-scale):** roughly $5–15/month on Fly free + paid
allowances plus Cloudflare Pages free tier. Anthropic spend is on top
and depends on your demo traffic — budget $5–20 for a week of pitching.

---

## What gets deployed

| Component             | Host                                | URL                                     |
| --------------------- | ----------------------------------- | --------------------------------------- |
| Backend API (NestJS)  | Fly.io · `jnb` region · 1 GB        | `https://gomaths-backend.fly.dev`       |
| Tutor (FastAPI)       | Fly.io · `jnb` · 512 MB             | `https://gomaths-ai-tutor.fly.dev`      |
| Solver (FastAPI)      | Fly.io · `jnb` · 512 MB             | `https://gomaths-ai-solver.fly.dev`     |
| Validation (FastAPI)  | Fly.io · `jnb` · 512 MB · always-on | `https://gomaths-ai-validation.fly.dev` |
| Postgres              | Fly Managed Postgres                | DSN as a secret                         |
| Redis                 | Upstash for Fly                     | DSN as a secret                         |
| Student app (web SPA) | Cloudflare Pages                    | `https://gomaths-preview.pages.dev`     |

---

## 0. Prerequisites

```sh
brew install flyctl                 # or curl -L https://fly.io/install.sh | sh
fly auth signup                     # or fly auth login
```

You also need:

- A Cloudflare account (free).
- An Anthropic API key. Cheapest model: `claude-haiku-4-5`.
- A Resend account + a verified sender domain (consent email). On the
  free tier you can use the `onboarding@resend.dev` sender — fine for
  internal demos.
- A Sentry project (free tier — one DSN per app).

---

## 1. Provision Postgres + Redis

```sh
# Postgres. 256 MB / 1 GB volume is enough for the preview.
fly postgres create --name gomaths-pg --region jnb \
  --vm-size shared-cpu-1x --volume-size 1
# Record the DATABASE_URL it prints — you'll wire it to the backend in §3.

# Redis. Upstash's free 10 MB tier is plenty for preview throttle counters.
fly redis create --name gomaths-redis --region jnb --no-replicas
# Record the REDIS_URL.
```

---

## 2. Deploy the AI services

All three use the same Dockerfile (`services/ai-services/Dockerfile`)
with a `SERVICE` build arg. Run each `fly launch` from the repo root.

```sh
# Validation — pure SymPy, no secrets needed.
fly launch -c fly.validation.toml --copy-config --no-deploy --name gomaths-ai-validation --region jnb
fly deploy -c fly.validation.toml

# Solver — mock OCR until MathPix is contracted.
fly launch -c fly.solver.toml --copy-config --no-deploy --name gomaths-ai-solver --region jnb
fly deploy -c fly.solver.toml

# Tutor — defaults to the mock provider until you set ANTHROPIC_API_KEY.
fly launch -c fly.tutor.toml --copy-config --no-deploy --name gomaths-ai-tutor --region jnb
fly secrets set -a gomaths-ai-tutor \
  TUTOR_PROVIDER="anthropic" \
  ANTHROPIC_API_KEY="sk-ant-..." \
  TUTOR_MODEL="claude-haiku-4-5"
fly deploy -c fly.tutor.toml
```

Smoke test:

```sh
curl -s https://gomaths-ai-validation.fly.dev/health
curl -s https://gomaths-ai-solver.fly.dev/health
curl -s https://gomaths-ai-tutor.fly.dev/health
```

All three should return `{"status":"ok"}`.

---

## 3. Deploy the backend

```sh
fly launch -c fly.backend.toml --copy-config --no-deploy --name gomaths-backend --region jnb

fly secrets set -a gomaths-backend \
  DATABASE_URL="$(fly postgres connect -a gomaths-pg --command 'echo $DATABASE_URL')" \
  REDIS_URL="<the URL from step 1>" \
  JWT_ACCESS_SECRET="$(openssl rand -base64 64)" \
  JWT_REFRESH_SECRET="$(openssl rand -base64 64)" \
  PARENTAL_CONSENT_INVITE_SECRET="$(openssl rand -base64 64)" \
  PARENTAL_CONSENT_RECEIPT_SECRET="$(openssl rand -base64 64)" \
  PUBLIC_APP_URL="https://gomaths-preview.pages.dev" \
  RESEND_API_KEY="re_..." \
  EMAIL_FROM="GoMaths <onboarding@resend.dev>" \
  SENTRY_DSN="https://...@sentry.io/..." \
  TUTOR_SERVICE_URL="https://gomaths-ai-tutor.fly.dev" \
  SOLVER_SERVICE_URL="https://gomaths-ai-solver.fly.dev" \
  VALIDATION_SERVICE_URL="https://gomaths-ai-validation.fly.dev"

fly deploy -c fly.backend.toml
```

`fly deploy` runs `prisma migrate deploy` as part of the container's
CMD, so first boot stands the schema up automatically.

Smoke test:

```sh
curl -s https://gomaths-backend.fly.dev/api/health
# {"status":"ok",...}
```

Seed two example topics (optional but recommended for the demo):

```sh
fly ssh console -a gomaths-backend --command "/app/node_modules/.bin/ts-node prisma/seed.ts"
```

---

## 4. Deploy the Student app to Cloudflare Pages

```sh
# Build the web SPA locally first to make sure it builds.
EXPO_PUBLIC_API_URL=https://gomaths-backend.fly.dev \
EXPO_PUBLIC_PREVIEW_BANNER=1 \
EXPO_PUBLIC_SENTRY_DSN_STUDENT=https://...@sentry.io/... \
pnpm --filter @gomaths/student export:web

# Output is in apps/student/dist
```

Then in the Cloudflare Pages dashboard:

1. **Create a project → Connect to git → pick this repo.**
2. **Build settings:**
   - Build command: `corepack enable && corepack prepare pnpm@9.12.0 --activate && pnpm install --frozen-lockfile && pnpm --filter @gomaths/student export:web`
   - Build output directory: `apps/student/dist`
   - Root directory: `/`
3. **Environment variables** (Production):
   - `EXPO_PUBLIC_API_URL` = `https://gomaths-backend.fly.dev`
   - `EXPO_PUBLIC_PREVIEW_BANNER` = `1`
   - `EXPO_PUBLIC_SENTRY_DSN_STUDENT` = your Sentry DSN
4. **Deploy.** The first build takes ~3 minutes; subsequent builds
   ~90 seconds.
5. **Update the backend's `PUBLIC_APP_URL`** to match the Pages URL:

   ```sh
   fly secrets set -a gomaths-backend PUBLIC_APP_URL="https://<your-pages-url>"
   ```

Cloudflare Pages handles SPA 404→index.html out of the box for
`expo export --platform web --output single`, no `_redirects` file
needed.

---

## 5. Verify the happy path

Open the Pages URL and walk through:

1. **Register** with a birth year that makes you a minor (e.g. 2012)
   and a parent email you control.
2. The consent screen says "We've emailed your parent." Check the
   parent inbox — there's a Resend-sent email with a "Confirm consent"
   button. Click it.
3. Back in the app, tap **I've confirmed — check now**. The poll
   succeeds and you advance to **Create account**.
4. Pick **Grade 9** → **Solving Linear Equations**.
5. **Practice**: type `x = 4` for `2x + 5 = 13` — green tick (SymPy).
6. **Maya · AI Tutor**: ask "Why does x = 4?" — reply streams in. If
   you set `ANTHROPIC_API_KEY`, the "Maths verified" badge lights up.
7. **Smoke test prompt caching** (after step 6 has run twice on the
   same topic):

   ```sh
   curl -s https://gomaths-ai-tutor.fly.dev/metrics/cache
   # cache_hit_ratio should be > 0
   ```

   If it stays at 0 after two requests, Anthropic prompt caching isn't
   firing — that's HANDOFF.md risk #1 and blocks any pricing claim.

---

## Disabling the preview

```sh
fly apps destroy gomaths-backend gomaths-ai-tutor gomaths-ai-solver gomaths-ai-validation
fly postgres destroy gomaths-pg
fly redis destroy gomaths-redis
# Delete the Cloudflare Pages project from the dashboard.
```

Fly bills hourly so destroying when not in use keeps costs near zero.

---

## What this preview deliberately does NOT do

- **No MathPix.** Solver scan returns canned LaTeX. Disable that screen
  in demos or call it out.
- **No real device build.** EAS Build for iOS / Android needs Apple
  Developer + Google Play accounts and an EAS plan. Web SPA is enough
  for a stakeholder walkthrough.
- **No POPIA DPIA.** This is a preview, not a learner-facing product.
  Anyone testing should use throwaway emails and birth years; the
  banner says so.
- **Only 2 curriculum topics.** Pre-release banner makes that clear.
- **No analytics.** Sentry catches errors but PostHog/Mixpanel are
  Phase 1 work.
