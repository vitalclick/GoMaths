variable "aws_region" {
  description = "AWS region. POPIA-defensible default: af-south-1 (Cape Town)."
  type        = string
  default     = "af-south-1"
}

variable "environment" {
  description = "Environment name (dev, staging, production)."
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.20.0.0/16"
}
