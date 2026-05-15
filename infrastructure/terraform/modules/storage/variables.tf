variable "name_prefix" {
  type = string
}

variable "uploads_retention_days" {
  description = "Days to keep solver scan images. POPIA requires we delete data when no longer needed."
  type        = number
  default     = 30
}

variable "tags" {
  type    = map(string)
  default = {}
}
