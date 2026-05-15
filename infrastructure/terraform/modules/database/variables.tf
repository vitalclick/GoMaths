variable "name_prefix" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  description = "Private subnet IDs the DB subnet group spans (must be in >= 2 AZs)."
  type        = list(string)
}

variable "client_security_group_ids" {
  description = "Security groups whose members may connect on 5432."
  type        = list(string)
  default     = []
}

variable "engine_version" {
  type    = string
  default = "16.3"
}

variable "instance_class" {
  type    = string
  default = "db.t4g.small"
}

variable "allocated_storage_gb" {
  type    = number
  default = 20
}

variable "max_allocated_storage_gb" {
  description = "RDS auto-scales storage up to this ceiling."
  type        = number
  default     = 100
}

variable "database_name" {
  type    = string
  default = "gomaths"
}

variable "master_username" {
  type    = string
  default = "gomaths"
}

variable "multi_az" {
  type    = bool
  default = false
}

variable "backup_retention_days" {
  type    = number
  default = 7
}

variable "deletion_protection" {
  description = "Disable for dev. Production MUST set this true."
  type        = bool
  default     = false
}

variable "tags" {
  type    = map(string)
  default = {}
}
