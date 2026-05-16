# GoMaths Deployment Information

**Owner:** TBD (DevOps Lead)
**Last reviewed:** _set on each material change_

> ## Important — read this first
>
> **This document is committed to git. Treat it as public.**
>
> Do NOT paste real secrets, API keys, passwords, account numbers, or
> personal data into this file. Where a value is sensitive, write
> `(see <secret-manager-location>)` instead and store the real value in
> the actual secret manager — AWS Secrets Manager, EAS env, 1Password,
> or wherever the team has standardised.
>
> If you accidentally commit a secret, rotate it immediately — git
> history is forever, even if you delete the line.

---

## 1. Secret Management

Single source of truth for runtime secrets:

| Where it lives                       | What's in it                                                                                                 |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| **AWS Secrets Manager (af-south-1)** | All production service secrets — DB passwords, JWT signing keys, third-party API keys                        |
| **EAS Secrets**                      | Mobile build-time vars (`EXPO_PUBLIC_API_URL` per channel, push notification keys, App Store credentials)    |
| **GitHub Actions Secrets**           | CI/CD deploy keys, AWS deployment role ARN, container registry creds                                         |
| **1Password (team vault)**           | Human-accessed credentials — AWS console MFA recovery codes, MathPix dashboard login, Sentry org admin, etc. |

Rotation cadence:

- JWT signing keys: every 90 days
- Third-party API keys: every 180 days (or on any team member departure)
- Database passwords: every 180 days
- Mobile signing certs: per Apple/Google expiry schedule

---

## 2. Cloud Infrastructure (AWS)

v2 uses a **new AWS account** kept fully separate from any account v1
runs in, per ADR-007. Don't share IAM roles, VPCs, or tfstate buckets
across the two.

| Field                          | Value                                                       |
| ------------------------------ | ----------------------------------------------------------- |
| Primary region                 | `af-south-1` (Cape Town) — POPIA defensibility, see ADR-002 |
| Secondary region               | `eu-west-1` (DR / backup only)                              |
| AWS account ID (v2 production) | `(see 1Password — AWS v2 Production)`                       |
| AWS account ID (v2 staging)    | `(see 1Password — AWS v2 Staging)`                          |
| AWS Organisations payer        | `(see 1Password)`                                           |
| Root account email             | `(see 1Password)`                                           |
| Compute layer                  | ECS Fargate (per ADR-007). EKS deferred.                    |

**Console access:** SSO via AWS IAM Identity Center. Direct IAM users are forbidden for humans (DevOps may create them for CI machine roles only).

**Service-level resource locations** are managed in `infrastructure/terraform/`. Each environment has its own state in S3 + DynamoDB lock table — see `infrastructure/terraform/environments/<env>/providers.tf`.

---

## 3. Mobile Build & Distribution

### Apple

v2 ships under the **same Apple Developer Team** as v1, with **new
bundle IDs** under the `com.gomaths.mathai*` namespace so v2 lives as
separate listings in the App Store alongside v1. Existing v1 listings
stay published until each school's cutover is complete.

| Field                                | Value                                                                        |
| ------------------------------------ | ---------------------------------------------------------------------------- |
| Apple Developer Team ID              | `(fill in — same team as v1)`                                                |
| Apple Developer Program enrollment   | `(fill in — typically a 12-month renewal)`                                   |
| Bundle identifier — Student app (v2) | `com.gomaths.mathai`                                                         |
| Bundle identifier — Parent app (v2)  | `com.gomaths.mathai.parent`                                                  |
| Bundle identifier — Teacher app (v2) | `com.gomaths.mathai.teacher`                                                 |
| App Store Connect admin contact      | `(fill in)`                                                                  |
| Apple Family / Kids category status  | Required for the Student app — see Apple's "Kids Category" review guidelines |

### Google

| Field                            | Value                                                        |
| -------------------------------- | ------------------------------------------------------------ |
| Play Console account             | `(fill in — same account as v1)`                             |
| Package — Student app (v2)       | `com.gomaths.mathai`                                         |
| Package — Parent app (v2)        | `com.gomaths.mathai.parent`                                  |
| Package — Teacher app (v2)       | `com.gomaths.mathai.teacher`                                 |
| Designed for Families enrollment | Required for the Student app                                 |
| Play Console admin contact       | `(fill in)`                                                  |
| Upload key keystore              | `(see AWS Secrets Manager: gomaths-v2/play/upload-keystore)` |

### EAS (Expo Application Services)

| Field                     | Value                                                              |
| ------------------------- | ------------------------------------------------------------------ |
| Expo organisation         | `(fill in)`                                                        |
| EAS project IDs           | one per app — see `apps/<app>/app.json` `expo.extra.eas.projectId` |
| EAS channels              | `production`, `staging`, `preview`                                 |
| Build profiles            | configured per app in `eas.json` (one per app once scaffolded)     |
| iOS provisioning profiles | managed by EAS (recommended) — `eas credentials` to inspect        |
| Android keystore          | managed by EAS (uploaded once, see secret-manager note above)      |

---

## 4. AI / OCR Providers

### LLM — Anthropic (primary, per ADR-005 leaning)

| Field                 | Value                                                              |
| --------------------- | ------------------------------------------------------------------ |
| Anthropic Console org | `(fill in)`                                                        |
| Default model         | `claude-haiku-4-5` (see `services/ai-services/tutor/providers.py`) |
| API key location      | `(AWS Secrets Manager: gomaths/anthropic/api-key)`                 |
| Env var name          | `ANTHROPIC_API_KEY`                                                |
| Prompt caching        | Enabled (see `AnthropicProvider`)                                  |
| Monthly budget alert  | `(fill in once usage is established)`                              |

### LLM — OpenAI (alternative)

| Field            | Value                                           |
| ---------------- | ----------------------------------------------- |
| OpenAI org ID    | `(fill in)`                                     |
| Default model    | `gpt-4o-mini`                                   |
| API key location | `(AWS Secrets Manager: gomaths/openai/api-key)` |
| Env var name     | `OPENAI_API_KEY`                                |

Provider selection at runtime: `TUTOR_PROVIDER=anthropic|openai|mock`.

### OCR — MathPix

| Field                   | Value                                                            |
| ----------------------- | ---------------------------------------------------------------- |
| MathPix contract status | `(fill in — signed / in negotiation / open)`                     |
| MathPix plan            | `(fill in — e.g. 1000 calls / month)`                            |
| MathPix App ID          | `(AWS Secrets Manager: gomaths/mathpix/app-id)`                  |
| MathPix App Key         | `(AWS Secrets Manager: gomaths/mathpix/app-key)`                 |
| Env var names           | `MATHPIX_APP_ID`, `MATHPIX_APP_KEY`                              |
| Account dashboard       | https://accounts.mathpix.com/                                    |
| Selection at runtime    | `SOLVER_OCR_PROVIDER=mathpix\|mock`                              |
| Mock fallback           | `MockOcrProvider` returns canned LaTeX; safe for tests and demos |

---

## 5. Authentication

Phase 0+ ships with self-hosted JWT. Phase 1 may swap to Auth0 — interface is unchanged either way.

### Self-hosted JWT (current)

| Field             | Value                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------- |
| Access token TTL  | 15 minutes                                                                                  |
| Refresh token TTL | 30 days (rotated on use)                                                                    |
| Access secret     | `(AWS Secrets Manager: gomaths/jwt/access-secret)` — generate via `openssl rand -base64 64` |
| Refresh secret    | `(AWS Secrets Manager: gomaths/jwt/refresh-secret)`                                         |
| Env var names     | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`                                                   |

### Auth0 (planned)

| Field                  | Value                                                    |
| ---------------------- | -------------------------------------------------------- |
| Auth0 tenant           | `(fill in when adopted)`                                 |
| Domain                 | `(fill in)`                                              |
| Mobile client ID       | `(fill in)`                                              |
| Web client ID          | `(fill in)`                                              |
| Management API client  | `(AWS Secrets Manager: gomaths/auth0/mgmt-api)`          |
| School SSO connections | SAML/OIDC — configured per school as B2B contracts close |

---

## 6. Database & Cache

| Field                  | Value                                                                |
| ---------------------- | -------------------------------------------------------------------- |
| Primary DB             | PostgreSQL 16 on AWS RDS, multi-AZ                                   |
| DB endpoint            | `(provisioned by Terraform; see `terraform output` per environment)` |
| DB credentials         | `(AWS Secrets Manager: gomaths/postgres/<env>)`                      |
| Env var name           | `DATABASE_URL`                                                       |
| Migration tool         | Prisma — see `services/backend-api/prisma/`                          |
| Cache                  | Redis on AWS ElastiCache (Phase 1)                                   |
| Cache credentials      | `(AWS Secrets Manager: gomaths/redis/<env>)`                         |
| Env var name           | `REDIS_URL`                                                          |
| Backup strategy        | RDS automated daily backups, 7-day retention dev / 30-day prod       |
| Point-in-time recovery | Enabled on prod                                                      |

---

## 7. Observability

| Service                      | Used for                      | Location of creds                                |
| ---------------------------- | ----------------------------- | ------------------------------------------------ |
| **Sentry**                   | App + service error reporting | `(AWS Secrets Manager: gomaths/sentry/dsn)`      |
| **CloudWatch**               | Logs, metrics, alarms         | Native to AWS                                    |
| **Grafana Cloud** (optional) | Dashboards                    | `(AWS Secrets Manager: gomaths/grafana/api-key)` |

DSN env var names: `SENTRY_DSN`, `EXPO_PUBLIC_SENTRY_DSN` (mobile).

---

## 8. Push Notifications

| Channel            | Service            | Creds                                  |
| ------------------ | ------------------ | -------------------------------------- |
| iOS                | APNs via Expo Push | `(EAS credentials handle the .p8 key)` |
| Android            | FCM via Expo Push  | `(EAS credentials)`                    |
| Web push (Phase 2) | TBD                | —                                      |

---

## 9. Compliance & Legal

### POPIA

| Field                         | Value                                                                     |
| ----------------------------- | ------------------------------------------------------------------------- |
| Information Officer           | `(fill in — Founder/CEO typically)`                                       |
| DPIA status                   | `(fill in — completed / in review / not started)`                         |
| DPIA document                 | `(see secure shared drive — not in git)`                                  |
| Legal counsel                 | `(fill in firm + contact)`                                                |
| Data subject request handling | Internal Admin app (Phase 1) routes through `/admin/dsr/...`              |
| Retention policy              | See `docs/Tutor_Marketplace_Plan.md §4.2` and `Architecture_Decisions.md` |

### GDPR / COPPA / FERPA

Required when expanding outside SA — not in Phase 1.

### Children's Act (SA) — for the Tutor Marketplace (Phase 1.5)

| Field                                              | Value                       |
| -------------------------------------------------- | --------------------------- |
| PCC (Police Clearance Certificate) vetting partner | `(fill in)`                 |
| Form 30 (Child Protection Register) lookup         | `(fill in)`                 |
| Session recording retention                        | 90 days, then auto-deletion |

### Insurance

| Type                     | Provider    | Contact     |
| ------------------------ | ----------- | ----------- |
| Platform liability / E&O | `(fill in)` | `(fill in)` |
| Cyber insurance          | `(fill in)` | `(fill in)` |

---

## 10. Payments (Phase 1.5+)

| Field                  | Value                                                    |
| ---------------------- | -------------------------------------------------------- |
| Selected facilitator   | `(Stitch / PayFast / Paystack-SA — TBD)`                 |
| Merchant account       | `(fill in)`                                              |
| Webhook signing secret | `(AWS Secrets Manager: gomaths/payments/webhook-secret)` |
| Tax practitioner       | `(fill in — for IRP6 / VAT)`                             |

---

## 11. Curriculum Operations

| Role                                               | Person      | Contact     |
| -------------------------------------------------- | ----------- | ----------- |
| Head of Curriculum                                 | `(fill in)` | `(fill in)` |
| Curriculum Specialist 1 (SACE-registered, Grade 9) | `(fill in)` | `(fill in)` |
| Curriculum Specialist 2 (SACE-registered, Grade 9) | `(fill in)` | `(fill in)` |
| Editor (part-time)                                 | `(fill in)` | `(fill in)` |

Content workflow lives in `docs/Curriculum_Content_Plan.md`.

---

## 12. v2 Cutover Schedule

Existing GoMaths schools cut over to v2 one at a time. Track the
schedule below; each row should also have a cutover-plan doc (comms,
parallel-running window, v1 sunset date — write the first one, then
reuse the template).

| School      | Province    | Current v1 cohort | Target cutover date | Cutover plan doc | Status      |
| ----------- | ----------- | ----------------- | ------------------- | ---------------- | ----------- |
| `(fill in)` | `(fill in)` | `(fill in)`       | `(fill in)`         | `(link)`         | `(fill in)` |
| `(fill in)` | `(fill in)` | `(fill in)`       | `(fill in)`         | `(link)`         | `(fill in)` |
| `(fill in)` | `(fill in)` | `(fill in)`       | `(fill in)`         | `(link)`         | `(fill in)` |

The first cutover is the one that matters most — it sets the
operational pattern for everything that follows. Don't onboard school
#2 until school #1 has run on v2 for at least one term and the
outcomes comparison vs the v1 cohort is in.

---

## 13. CI / CD

| Field                     | Value                                                              |
| ------------------------- | ------------------------------------------------------------------ |
| CI provider               | GitHub Actions                                                     |
| Workflow definitions      | `.github/workflows/`                                               |
| Required reviewers (main) | 1+ from CODEOWNERS                                                 |
| Deployment role (AWS)     | `arn:aws:iam::<account>:role/gomaths-github-actions` (one per env) |
| Container registry        | ECR — `<account>.dkr.ecr.af-south-1.amazonaws.com/gomaths-*`       |
| Image scan                | ECR scan-on-push enabled                                           |

Deploy gates:

- All tests green
- TypeScript typecheck green
- Python validator green
- Curriculum validation green (`validate_curriculum.py`)
- Manual approval for production (configured via Environments)

---

## 14. Runbooks

Live in `runbooks/` at the repo root. See [`runbooks/README.md`](../runbooks/README.md) for the index.

- [`runbooks/incident-response.md`](../runbooks/incident-response.md) — severity rubric, on-call procedure, escalation, comms templates, postmortem template
- [`runbooks/tutor-outage.md`](../runbooks/tutor-outage.md) — failover when an LLM provider degrades; provider-swap commands; wrong-maths mitigation
- [`runbooks/popia-dsr.md`](../runbooks/popia-dsr.md) — handling a data subject request end-to-end, with the actual SQL
- [`runbooks/curriculum-rollback.md`](../runbooks/curriculum-rollback.md) — reverting a bad lesson, fast path (PR) and hot path (DB) both documented
- [`runbooks/payment-dispute.md`](../runbooks/payment-dispute.md) — Phase 1.5 marketplace dispute handling (chargeback / in-app / safety-critical paths)

Pending — to land before the first v2 cutover or as each feature ships:

- `runbooks/v2-cutover.md` — per-school cutover steps (comms, parallel-running window, v1 sunset, rollback procedure)
- `runbooks/migration-rollback.md` — Prisma migrate-down for a bad schema change

---

## 15. Phase Gating

The first v2 cutover is gated on the criteria in
`docs/Phase1_Launch_Plan.md §12` (Definition of Done). The Tutor
Marketplace (Phase 1.5) is gated on `docs/Tutor_Marketplace_Plan.md §1`
and only starts after v2's learning-outcome metric is proven against v1.

---

## How to update this file

1. Make the change in this document.
2. **Sanity-check there are no secrets in the diff** before committing.
3. Set "Last reviewed" at the top.
4. Update the owning Confluence page (if any) or remove the reference.
