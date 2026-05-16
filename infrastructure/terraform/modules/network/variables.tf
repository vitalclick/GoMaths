variable "name_prefix" {
  description = "Prefix applied to every Name tag and many resource names."
  type        = string
}

variable "cidr_block" {
  description = "Top-level VPC CIDR. Subnets are derived as /20s within it."
  type        = string
}

variable "az_count" {
  description = "How many AZs to span. 2 for dev, 3 for prod."
  type        = number
  default     = 2
}

variable "tags" {
  description = "Tags applied to all resources."
  type        = map(string)
  default     = {}
}
