variable "name_prefix" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "client_security_group_ids" {
  type    = list(string)
  default = []
}

variable "engine_version" {
  type    = string
  default = "7.1"
}

variable "node_type" {
  type    = string
  default = "cache.t4g.micro"
}

variable "num_cache_clusters" {
  description = "1 for dev (single node, no replica). 2+ for prod."
  type        = number
  default     = 1
}

variable "auth_token" {
  description = "Required when transit_encryption is on. Pass in from Secrets Manager."
  type        = string
  sensitive   = true
}

variable "snapshot_retention_days" {
  type    = number
  default = 1
}

variable "tags" {
  type    = map(string)
  default = {}
}
