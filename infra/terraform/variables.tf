variable "aws_region" {
  description = "Region for the S3 bucket."
  type        = string
  default     = "us-west-2"
}

variable "bucket_name" {
  description = "Globally unique name for the private S3 bucket that holds the built site."
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$", var.bucket_name))
    error_message = "bucket_name must be 3 to 63 characters: lower-case letters, digits, dots and hyphens."
  }
}

variable "domain_name" {
  description = "Optional custom domain, for example example.dev. Leave null to use the default *.cloudfront.net address."
  type        = string
  default     = null
}

variable "external_dns" {
  description = "true when DNS is NOT in Route 53 (for example a domain registered at Cloudflare Registrar, which must use Cloudflare nameservers). Terraform then creates only the ACM certificate and the CloudFront alias, and prints the DNS records you must add at your DNS provider. Leave false to have Terraform create the records in a Route 53 hosted zone."
  type        = bool
  default     = false

  validation {
    condition     = !var.external_dns || var.domain_name != null
    error_message = "external_dns = true only makes sense together with domain_name."
  }
}

variable "hosted_zone_id" {
  description = "Route 53 hosted zone ID that contains domain_name (starts with Z). Required with domain_name unless external_dns is true; must be null when it is (ACM validation and the alias records are created in that zone)."
  type        = string
  default     = null

  validation {
    condition     = var.external_dns ? var.hosted_zone_id == null : (var.domain_name == null) == (var.hosted_zone_id == null)
    error_message = "Without external_dns, set domain_name and hosted_zone_id together (or leave both null). With external_dns = true, leave hosted_zone_id null."
  }
}

variable "price_class" {
  description = "CloudFront price class. PriceClass_100 serves from North America and Europe only and is the cheapest."
  type        = string
  default     = "PriceClass_100"

  validation {
    condition     = contains(["PriceClass_100", "PriceClass_200", "PriceClass_All"], var.price_class)
    error_message = "price_class must be PriceClass_100, PriceClass_200 or PriceClass_All."
  }
}

variable "force_destroy" {
  description = "Allow terraform destroy to delete the bucket even when it holds objects. Safe here because the site is rebuilt from Git."
  type        = bool
  default     = true
}

variable "budget_amount_usd" {
  description = "Optional monthly cost alert threshold in USD for the whole account. It only notifies; it does not stop spending. Set together with budget_email."
  type        = number
  default     = null

  validation {
    condition     = var.budget_amount_usd == null || var.budget_amount_usd > 0
    error_message = "budget_amount_usd must be greater than 0."
  }

  validation {
    condition     = (var.budget_amount_usd == null) == (var.budget_email == null)
    error_message = "Set budget_amount_usd and budget_email together, or leave both null."
  }
}

variable "budget_email" {
  description = "Email address for the optional budget alert."
  type        = string
  default     = null

  validation {
    condition     = var.budget_email == null || can(regex("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$", var.budget_email))
    error_message = "budget_email must look like an email address (a leftover placeholder fails here, at plan time)."
  }
}

variable "tags" {
  description = "Extra tags for every resource."
  type        = map(string)
  default     = {}
}
