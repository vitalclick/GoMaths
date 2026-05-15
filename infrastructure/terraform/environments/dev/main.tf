# GoMaths — dev environment.
#
# What's here:
#   - Network: VPC (10.20.0.0/16), 2 AZs, public + private subnets, NAT
#   - Database: RDS Postgres 16 (db.t4g.small, single-AZ)
#   - Cache: ElastiCache Redis 7.1 (cache.t4g.micro, single node)
#   - Storage: S3 buckets (uploads, audit-logs)
#   - Secrets: Secrets Manager placeholders the backend reads at boot
#
# What's NOT here yet (DevOps engineer week-1+):
#   - EKS cluster, node groups, OIDC provider, IRSA roles
#   - ALB ingress controller, cert-manager
#   - Sentry's own AWS account/IAM
#   - CloudFront + WAF in front of the API
#   - Route53 + ACM certs (waiting on domain decision)
#   - CI/CD wiring for `terraform plan` on PRs
#
# Bootstrap: before this directory can `terraform apply`, the operator
# must provision the tfstate backend (S3 bucket + DynamoDB lock table)
# in a separate, hand-curated account. Then uncomment the `backend "s3"`
# block in providers.tf and run `terraform init -migrate-state`.

locals {
  name_prefix = "gomaths-${var.environment}"
  common_tags = {
    Project     = "gomaths"
    Environment = var.environment
  }
}

# Backend services security group — owned at the env level because RDS
# and ElastiCache need to reference it as a client.
resource "aws_security_group" "backend" {
  name        = "${local.name_prefix}-backend"
  description = "Backend pods/tasks. Egress only; ingress allowed by DB and cache SGs."
  vpc_id      = module.network.vpc_id

  # No ingress rules here — ingress is owned by the ALB in front of the
  # backend (added with EKS later). Egress is unrestricted: the backend
  # talks to RDS, Redis, S3, Secrets Manager, Anthropic/OpenAI, MathPix.
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Egress: all"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-backend"
  })
}

module "network" {
  source      = "../../modules/network"
  name_prefix = local.name_prefix
  cidr_block  = var.vpc_cidr
  az_count    = 2
  tags        = local.common_tags
}

module "secrets" {
  source      = "../../modules/secrets"
  name_prefix = local.name_prefix
  # Dev: immediate deletion. Prod sets this to 30.
  recovery_window_in_days = 0
  tags                    = local.common_tags
}

module "database" {
  source = "../../modules/database"

  name_prefix               = local.name_prefix
  vpc_id                    = module.network.vpc_id
  subnet_ids                = module.network.private_subnet_ids
  client_security_group_ids = [aws_security_group.backend.id]

  instance_class       = "db.t4g.small"
  allocated_storage_gb = 20
  multi_az             = false
  deletion_protection  = false

  tags = local.common_tags
}

# Redis auth-token must be populated in Secrets Manager out-of-band
# (the secrets module creates the empty container). For dev we read a
# placeholder at plan time so terraform doesn't try to fetch a real
# secret that the operator hasn't created yet.
data "aws_secretsmanager_secret_version" "redis_auth_token" {
  # tflint-ignore: deep-checks — secret is created by the secrets module
  secret_id = module.secrets.secret_arns["redis-auth-token"]
}

module "cache" {
  source = "../../modules/cache"

  name_prefix               = local.name_prefix
  vpc_id                    = module.network.vpc_id
  subnet_ids                = module.network.private_subnet_ids
  client_security_group_ids = [aws_security_group.backend.id]

  node_type          = "cache.t4g.micro"
  num_cache_clusters = 1
  # The secret stores { value: "..." }; pull out the field.
  auth_token = jsondecode(data.aws_secretsmanager_secret_version.redis_auth_token.secret_string).value

  tags = local.common_tags
}

module "storage" {
  source                = "../../modules/storage"
  name_prefix           = local.name_prefix
  uploads_retention_days = 30
  tags                  = local.common_tags
}
