# Phase 0 scaffold — dev environment.
#
# This file is intentionally minimal. The DevOps engineer hired in Phase 0
# week 1 should:
#   1. Provision the bootstrap account (S3 + DynamoDB for tfstate)
#   2. Uncomment the backend block in providers.tf and `terraform init`
#   3. Build out the network module (VPC, subnets, NAT, route tables)
#   4. Add EKS, RDS (PostgreSQL), ElastiCache (Redis), S3 buckets
#   5. Wire CI/CD to apply on merge to main (with manual approval for prod)
#
# Until then this file is a placeholder so `terraform init` succeeds.

locals {
  name_prefix = "gomaths-${var.environment}"
}
