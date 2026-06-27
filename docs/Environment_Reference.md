# Environment Reference — turning on the real stack

GoMaths boots with **graceful fallbacks** so the whole stack runs on a
laptop with zero configuration: no database → in-memory stores, no LLM key
→ a mock tutor, no OCR key → a mock solver, no mail key → emails printed to
the log. That is by design for development. **For launch, every fallback
must be replaced by a real service via the environment variables below.**

This is the single checklist for that flip. Nothing here is set
automatically — these are secrets and endpoints you own.

How it's enforced:

- The backend validates config at boot (`assertConfig`, see
  `services/backend-api/src/config/config.validation.ts`). In
  `NODE_ENV=production` it **refuses to start** on a fatal problem.
- `node scripts/preflight-env.mjs [path/to/.env]` runs the same rules
  before deploy (CI gate). `pnpm preflight` is the shortcut.
- `GET /api/health/ready` reports live connectivity to Postgres, Redis and
  the three AI services.
- `pnpm verify:cache` (`scripts/verify-tutor-cache.mjs`) checks the
  Anthropic prompt-cache assumption against a running tutor service.

Legend: **Fatal** = backend won't start in production without it.
**Warn** = boots, but a feature is degraded/mocked.

---

## Backend API (`services/backend-api`)

| Variable                          | Prod severity | Fallback if unset                            | Where to get it                     |
| --------------------------------- | ------------- | -------------------------------------------- | ----------------------------------- |
| `JWT_ACCESS_SECRET`               | **Fatal**     | dev `change-me` secret (insecure)            | `openssl rand -base64 64`           |
| `JWT_REFRESH_SECRET`              | **Fatal**     | dev `change-me` secret (insecure)            | `openssl rand -base64 64`           |
| `PARENTAL_CONSENT_INVITE_SECRET`  | Warn          | inherits `JWT_ACCESS_SECRET`                 | `openssl rand -base64 64`           |
| `PARENTAL_CONSENT_RECEIPT_SECRET` | Warn          | inherits `JWT_ACCESS_SECRET`                 | `openssl rand -base64 64`           |
| `DATABASE_URL`                    | **Fatal**     | in-memory stores (data lost on restart)      | Postgres provider connection string |
| `REDIS_URL`                       | **Fatal**     | per-pod throttling; scheduler on every pod   | Redis/ElastiCache URL               |
| `RESEND_API_KEY`                  | Warn          | log-only mail (no delivery → minors blocked) | Resend dashboard                    |
| `EMAIL_FROM`                      | Warn          | empty sender                                 | A Resend-verified address           |
| `PUBLIC_APP_URL`                  | Warn          | consent links may 404                        | Your public app URL                 |
| `TUTOR_SERVICE_URL`               | Warn          | `http://localhost:8001`                      | Deployed tutor service URL          |
| `SOLVER_SERVICE_URL`              | Warn          | `http://localhost:8002`                      | Deployed solver service URL         |
| `VALIDATION_SERVICE_URL`          | Warn          | `http://localhost:8003`                      | Deployed validation service URL     |
| `SENTRY_DSN` (+ `SENTRY_*`)       | Optional      | Sentry disabled (no-op)                      | Sentry project settings             |
| `PORT`                            | Optional      | `4000`                                       | —                                   |
| `CURRICULUM_ROOT`                 | Optional      | bundled `curriculum-data/`                   | —                                   |

## Tutor service (`services/ai-services/tutor`)

| Variable            | Effect                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| `TUTOR_PROVIDER`    | `auto` (default) \| `anthropic` \| `openai` \| `mock`. `auto` picks by which key is present, else mock. |
| `ANTHROPIC_API_KEY` | Enables the real Anthropic tutor (+ prompt caching). Verify with `pnpm verify:cache`.                   |
| `OPENAI_API_KEY`    | Enables the OpenAI tutor. If both keys set, OpenAI wins under `auto`.                                   |

> **Without a key the tutor returns canned replies.** The cache-hit-ratio
> assumption (HANDOFF risk #1) only matters once a real Anthropic key is in.

## Solver service (`services/ai-services/solver`)

| Variable                               | Effect                                                           |
| -------------------------------------- | ---------------------------------------------------------------- |
| `SOLVER_OCR_PROVIDER`                  | `auto` (default) \| `mathpix` \| `openai` \| `claude` \| `mock`. |
| `MATHPIX_APP_ID` / `MATHPIX_APP_KEY`   | Best-quality maths OCR. First choice under `auto`.               |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | Vision-model OCR fallback (reused from the tutor keys).          |
| `SOLVER_OCR_MODEL`                     | Optional model override for the chosen LLM vision provider.      |

> **Without any key the solver returns canned OCR** — do not show the scan
> solver to a school until MathPix (or a vision key) is configured.

## Validation service (`services/ai-services/validation`)

No external credentials — pure SymPy. This is the moat and runs offline.

## Mobile apps (`apps/{student,parent,teacher}`)

| Variable                     | Effect                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_API_URL`        | Points the app at the real backend. **Unset → app uses bundled curriculum fixtures.** |
| `EXPO_PUBLIC_SENTRY_DSN`     | Mobile Sentry (optional).                                                             |
| `EXPO_PUBLIC_PREVIEW_BANNER` | `1` shows the pre-release banner.                                                     |

---

## Minimum set for a real production backend

```sh
NODE_ENV=production
JWT_ACCESS_SECRET=...            # openssl rand -base64 64
JWT_REFRESH_SECRET=...           # openssl rand -base64 64
PARENTAL_CONSENT_INVITE_SECRET=...
PARENTAL_CONSENT_RECEIPT_SECRET=...
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
RESEND_API_KEY=re_...
EMAIL_FROM="GoMaths <consent@gomaths.co.za>"
PUBLIC_APP_URL=https://gomaths.co.za
TUTOR_SERVICE_URL=https://...
SOLVER_SERVICE_URL=https://...
VALIDATION_SERVICE_URL=https://...
```

Then, before sending traffic:

```sh
pnpm preflight                   # static check of the above
curl -fsS https://api.../api/health/ready   # live dependency check
pnpm verify:cache                # confirm Anthropic prompt caching works
```
