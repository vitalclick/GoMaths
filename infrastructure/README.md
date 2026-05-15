# infrastructure

Terraform, Kubernetes manifests, and CI/CD configuration.

## Targets

- Cloud: **AWS, region `af-south-1` (Cape Town)** — POPIA defensibility
- Orchestration: EKS
- CDN: CloudFront
- Storage: S3
- Monitoring: Prometheus + Grafana
- Logs: CloudWatch (MVP) → ELK (Phase 2 if needed)
- Errors: Sentry
- CI/CD: GitHub Actions

## Environments

- `local` — docker-compose for dev
- `dev` — shared, ephemeral
- `staging` — production-like, for QA + pilot dry-runs
- `production` — pilot + beyond

## Layout

```
infrastructure/
└── terraform/
    ├── modules/
    │   ├── network/    VPC + subnets + IGW + NAT + route tables
    │   ├── database/   RDS Postgres + parameter group + subnet group + SG
    │   ├── cache/      ElastiCache Redis (encrypted in transit + at rest)
    │   ├── storage/    S3 buckets (uploads, audit-logs) with lifecycle
    │   └── secrets/    Secrets Manager placeholders (JWT, LLM, etc.)
    └── environments/
        └── dev/        Wires the modules together for af-south-1 dev
```

`staging/` and `production/` directories will copy the `dev` shape with
larger instance classes, multi-AZ flips, and deletion protection on.
**Production must NOT share state files** with dev.

## What this terraform does NOT yet provision

- **EKS cluster**, node groups, OIDC, IRSA — the orchestration layer.
  Decision pending on EKS vs. ECS Fargate vs. App Runner; EKS is the
  default in `docs/Architecture_Decisions.md` but worth a second look
  for a 4-school pilot's actual load profile.
- **ALB / ingress controller** — gated on the orchestration decision.
- **CloudFront + WAF** — front the API once a domain is registered.
- **Route53 + ACM** — domain decision pending.
- **CI/CD wiring** — `terraform plan` on PRs, `apply` on protected
  workflow with manual approval. Add once tfstate backend exists.

## Bootstrap (one-time, by hand)

```sh
# 1. Provision tfstate backend in a separate "bootstrap" account/role.
aws s3api create-bucket \
  --bucket gomaths-tfstate-dev \
  --region af-south-1 \
  --create-bucket-configuration LocationConstraint=af-south-1
aws s3api put-bucket-versioning \
  --bucket gomaths-tfstate-dev \
  --versioning-configuration Status=Enabled

aws dynamodb create-table \
  --table-name gomaths-tflock-dev \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region af-south-1

# 2. Uncomment the backend "s3" block in
#    terraform/environments/dev/providers.tf
# 3. terraform -chdir=terraform/environments/dev init -migrate-state
# 4. terraform -chdir=terraform/environments/dev plan -out=tfplan
# 5. Fill the Secrets Manager placeholders (auto-created by the module):
#    aws secretsmanager put-secret-value --secret-id gomaths-dev/redis-auth-token \
#      --secret-string '{"value":"<rand 32 bytes base64>"}'
# 6. terraform apply tfplan
```

## Status

`dev` is plan-ready (modules wired, no real apply yet). Next steps:
operator bootstraps state, fills secrets, applies. Then the EKS layer.
