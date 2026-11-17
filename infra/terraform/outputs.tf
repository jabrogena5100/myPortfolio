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
