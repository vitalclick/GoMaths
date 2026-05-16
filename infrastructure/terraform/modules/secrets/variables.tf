variable "name_prefix" {
  type = string
}

variable "recovery_window_in_days" {
  description = "Days a deleted secret is recoverable. Dev=0 (immediate). Prod=30 (default for safety)."
  type        = number
  default     = 0
}

variable "tags" {
  type    = map(string)
  default = {}
}
