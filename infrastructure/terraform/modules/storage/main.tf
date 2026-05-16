# S3 buckets the backend writes to:
#   - uploads:        solver scan images (private, lifecycle-deleted at 30d)
#   - audit-logs:     POPIA DSAR exports, consent confirmations (locked,
#                     365-day retention via object lock in prod)
#   - sentry-archive: long-term archive of Sentry events (optional)
#
# Every bucket: blocked public access, SSE-S3 by default, versioning on
# audit-logs only (cost — uploads churn enough that versioning would
# blow up the bill).

locals {
  buckets = {
    uploads     = { versioning = false, retention_days = var.uploads_retention_days }
    audit-logs  = { versioning = true, retention_days = 0 }
  }
}

resource "aws_s3_bucket" "this" {
  for_each = local.buckets

  bucket = "${var.name_prefix}-${each.key}"

  tags = merge(var.tags, {
    Name    = "${var.name_prefix}-${each.key}"
    Purpose = each.key
  })
}

resource "aws_s3_bucket_public_access_block" "this" {
  for_each = aws_s3_bucket.this

  bucket                  = each.value.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "this" {
  for_each = aws_s3_bucket.this

  bucket = each.value.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "this" {
  for_each = { for k, v in local.buckets : k => v if v.versioning }

  bucket = aws_s3_bucket.this[each.key].id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "uploads" {
  bucket = aws_s3_bucket.this["uploads"].id

  rule {
    id     = "expire-old-uploads"
    status = "Enabled"

    filter {} # apply to whole bucket

    expiration {
      days = var.uploads_retention_days
    }
  }
}
