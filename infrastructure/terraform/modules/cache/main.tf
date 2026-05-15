# ElastiCache Redis for: refresh-token rotation, rate-limit counters,
# scheduler leader election, throttler storage. Dev runs a single
# cache.t4g.micro node; prod flips to multi-AZ replication group.

resource "aws_elasticache_subnet_group" "this" {
  name       = "${var.name_prefix}-cache"
  subnet_ids = var.subnet_ids

  tags = var.tags
}

resource "aws_security_group" "this" {
  name        = "${var.name_prefix}-cache-sg"
  description = "Redis ingress from the backend security group only."
  vpc_id      = var.vpc_id

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-cache-sg"
  })
}

resource "aws_security_group_rule" "ingress_from_backend" {
  for_each = toset(var.client_security_group_ids)

  type                     = "ingress"
  protocol                 = "tcp"
  from_port                = 6379
  to_port                  = 6379
  source_security_group_id = each.value
  security_group_id        = aws_security_group.this.id
  description              = "Redis from backend ${each.value}"
}

resource "aws_elasticache_parameter_group" "this" {
  name   = "${var.name_prefix}-redis7"
  family = "redis7"

  # `maxmemory-policy = volatile-lru` is the right default for our mix
  # of TTL-bearing rate-limit keys (must respect TTL) and untimed leader
  # locks (set with PX, so they're TTL-bearing too).
  parameter {
    name  = "maxmemory-policy"
    value = "volatile-lru"
  }

  tags = var.tags
}

resource "aws_elasticache_replication_group" "this" {
  replication_group_id       = "${var.name_prefix}-redis"
  description                = "GoMaths Redis (${var.name_prefix})"
  engine                     = "redis"
  engine_version             = var.engine_version
  node_type                  = var.node_type
  num_cache_clusters         = var.num_cache_clusters
  automatic_failover_enabled = var.num_cache_clusters > 1

  parameter_group_name = aws_elasticache_parameter_group.this.name
  subnet_group_name    = aws_elasticache_subnet_group.this.name
  security_group_ids   = [aws_security_group.this.id]
  port                 = 6379

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = var.auth_token

  apply_immediately = true
  snapshot_retention_limit = var.snapshot_retention_days

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-redis"
  })
}
