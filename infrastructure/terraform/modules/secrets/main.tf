# Secrets Manager secrets the backend reads at boot.
#
# Each secret is created with an *empty* placeholder value. The DevOps
# engineer fills the real value via `aws secretsmanager put-secret-value`
# (or via the AWS console / a sealed-secret tool). Terraform does NOT
# store the production values — that's the point.
#
# To pull a secret in code:
#   const v = await secrets.getSecretValue({ SecretId: "<arn>" })

locals {
  managed_secrets = toset([
    "jwt-access-secret",
    "jwt-refresh-secret",
    "parental-consent-invite-secret",
    "parental-consent-receipt-secret",
    "redis-auth-token",
    "anthropic-api-key",
    "openai-api-key",
    "mathpix-app-id",
    "mathpix-app-key",
    "sentry-dsn-backend",
    "sentry-dsn-expo",
    "expo-access-token",
  ])
}

resource "aws_secretsmanager_secret" "this" {
  for_each = local.managed_secrets

  name        = "${var.name_prefix}/${each.value}"
  description = "Managed by terraform. Fill the value out-of-band."

  recovery_window_in_days = var.recovery_window_in_days

  tags = merge(var.tags, {
    Name    = "${var.name_prefix}-${each.value}"
    Managed = "terraform"
  })
}

# Placeholder ciphertext so the secret has *something* before the
# DevOps engineer fills the real value. The lifecycle ignore_changes
# keeps terraform from overwriting whatever value gets rotated in.
resource "aws_secretsmanager_secret_version" "placeholder" {
  for_each = aws_secretsmanager_secret.this

  secret_id     = each.value.id
  secret_string = jsonencode({ value = "REPLACE_ME" })

  lifecycle {
    ignore_changes = [secret_string]
  }
}
