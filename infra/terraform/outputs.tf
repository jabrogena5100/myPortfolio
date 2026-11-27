output "bucket_name" {
  description = "Private bucket that holds the built site (used by scripts/site-sync.sh)."
  value       = aws_s3_bucket.site.id
}

output "distribution_id" {
  description = "CloudFront distribution ID (used for cache invalidation)."
  value       = aws_cloudfront_distribution.site.id
}

output "cloudfront_domain" {
  description = "Default CloudFront address."
  value       = aws_cloudfront_distribution.site.domain_name
}

output "site_url" {
  description = "Public URL. Build with SITE_URL set to this value so canonical links and the sitemap are correct."
  value       = local.use_domain ? "https://${var.domain_name}" : "https://${aws_cloudfront_distribution.site.domain_name}"
}

# Only with external_dns = true: the records to create at your DNS provider.
output "dns_records_to_add" {
  description = "Records to add at an external DNS provider (empty unless external_dns = true). Step 1 is the certificate validation CNAME; step 2 points the site name at CloudFront (do this after the full apply)."
  value = var.external_dns && local.use_domain ? {
    certificate_validation = [for o in aws_acm_certificate.site[0].domain_validation_options : {
      type  = o.resource_record_type
      name  = o.resource_record_name
      value = o.resource_record_value
    }]
    site_cname = {
      type  = "CNAME"
      name  = var.domain_name
      value = aws_cloudfront_distribution.site.domain_name
    }
  } : null
}
