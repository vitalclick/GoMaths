output "vpc_id" {
  value = module.network.vpc_id
}

output "private_subnet_ids" {
  value = module.network.private_subnet_ids
}

output "backend_security_group_id" {
  value = aws_security_group.backend.id
}

output "database_endpoint" {
  value = module.database.endpoint
}

output "database_master_secret_arn" {
  value = module.database.master_user_secret_arn
}

output "redis_endpoint" {
  value = module.cache.primary_endpoint
}

output "s3_bucket_names" {
  value = module.storage.bucket_names
}

output "secret_arns" {
  value = module.secrets.secret_arns
}
