# Managed PostgreSQL via RDS. Dev is single-AZ, db.t4g.small with
# minimal storage. The same module flips to Multi-AZ + larger instance
# for staging/prod via variables.
#
# Master credentials are stored in Secrets Manager — never in
# terraform state in cleartext. Pass `master_password_secret_arn` and
# RDS pulls the value through the `manage_master_user_password` path.

resource "aws_db_subnet_group" "this" {
  name        = "${var.name_prefix}-db"
  description = "Subnet group for the GoMaths backend Postgres."
  subnet_ids  = var.subnet_ids

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-db-subnets"
  })
}

resource "aws_security_group" "this" {
  name        = "${var.name_prefix}-db-sg"
  description = "Postgres ingress from the backend security group only."
  vpc_id      = var.vpc_id

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-db-sg"
  })
}

# Single ingress: 5432 from the backend SG only. No 0.0.0.0/0.
resource "aws_security_group_rule" "ingress_from_backend" {
  for_each = toset(var.client_security_group_ids)

  type                     = "ingress"
  protocol                 = "tcp"
  from_port                = 5432
  to_port                  = 5432
  source_security_group_id = each.value
  security_group_id        = aws_security_group.this.id
  description              = "Postgres from backend ${each.value}"
}

# Engine parameter group — enables pg_stat_statements for observability
# and ssl-only for connections in transit.
resource "aws_db_parameter_group" "this" {
  name        = "${var.name_prefix}-pg16"
  family      = "postgres16"
  description = "GoMaths Postgres 16 baseline."

  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
    # pg_stat_statements requires a static parameter, so a restart is
    # needed to apply. Terraform's apply-method must be pending-reboot.
    apply_method = "pending-reboot"
  }

  tags = var.tags
}

resource "aws_db_instance" "this" {
  identifier     = "${var.name_prefix}-db"
  engine         = "postgres"
  engine_version = var.engine_version
  instance_class = var.instance_class

  allocated_storage     = var.allocated_storage_gb
  max_allocated_storage = var.max_allocated_storage_gb
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name                     = var.database_name
  username                    = var.master_username
  manage_master_user_password = true

  db_subnet_group_name   = aws_db_subnet_group.this.name
  vpc_security_group_ids = [aws_security_group.this.id]
  parameter_group_name   = aws_db_parameter_group.this.name

  multi_az                = var.multi_az
  publicly_accessible     = false
  copy_tags_to_snapshot   = true
  backup_retention_period = var.backup_retention_days
  deletion_protection     = var.deletion_protection
  skip_final_snapshot     = !var.deletion_protection
  final_snapshot_identifier = var.deletion_protection ? "${var.name_prefix}-db-final" : null

  performance_insights_enabled    = true
  performance_insights_retention_period = 7
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-db"
  })
}
