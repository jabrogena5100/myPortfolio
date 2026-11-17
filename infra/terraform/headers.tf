locals {
  # One source of truth for the policy: tests/e2e also reads this file and checks the site works under it.
  csp = trimspace(file("${path.module}/csp.txt"))
}

resource "aws_cloudfront_response_headers_policy" "security" {
  name    = "${var.bucket_name}-security"
  comment = "Security headers for the portfolio"

  security_headers_config {
    content_security_policy {
      content_security_policy = local.csp
      override                = true
    }

    content_type_options {
      override = true
    }

    frame_options {
      frame_option = "DENY"
      override     = true
    }

    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }

    # No includeSubDomains and no preload: those commit the whole domain and are hard to undo.
    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = false
      preload                    = false
      override                   = true
    }
  }

  custom_headers_config {
    items {
      header   = "Permissions-Policy"
      value    = "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
      override = true
    }

    items {
      header   = "Cross-Origin-Opener-Policy"
      value    = "same-origin"
      override = true
    }
  }
}
