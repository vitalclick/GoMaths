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

## Layout (to be created)
```
infrastructure/
├── terraform/
│   ├── modules/
│   └── environments/
│       ├── dev/
│       ├── staging/
│       └── production/
├── k8s/
└── docker/
```

## Status
Not yet scaffolded. First deliverable: dev environment in af-south-1 by end of Week 2.
