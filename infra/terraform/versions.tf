terraform {
  required_version = ">= 1.10.0, < 2.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "= 6.73.0"
    }
  }

  # Partial configuration: supply the bucket and key with `-backend-config=backend.hcl`
  # (see backend.hcl.example and docs/deploy/runbook.md). State locking uses S3's native lockfile.
  backend "s3" {}
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = merge({ Project = "myPortfolio", ManagedBy = "terraform" }, var.tags)
  }
}

# CloudFront only accepts ACM certificates issued in us-east-1.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = merge({ Project = "myPortfolio", ManagedBy = "terraform" }, var.tags)
  }
}
