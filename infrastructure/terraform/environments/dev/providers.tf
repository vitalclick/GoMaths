terraform {
  required_version = ">= 1.9.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.70"
    }
  }

  # TODO: configure remote state backend (S3 + DynamoDB lock) once the
  # bootstrap account is provisioned.
  # backend "s3" {
  #   bucket         = "gomaths-tfstate-dev"
  #   key            = "dev/terraform.tfstate"
  #   region         = "af-south-1"
  #   dynamodb_table = "gomaths-tflock-dev"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "gomaths"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
