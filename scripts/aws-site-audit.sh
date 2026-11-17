#!/usr/bin/env bash
# READ-ONLY audit: after `terraform destroy`, confirm nothing from the portfolio site remains.
# Uses direct service calls (tag searches lag behind deletions). YOU run this.
#
#   export AWS_PROFILE=<your profile>; BUCKET=<bucket name> [DOMAIN=www.example.com] scripts/aws-site-audit.sh
set -uo pipefail
[[ -n "${AWS_PROFILE:-}" && -n "${BUCKET:-}" ]] || { echo "Set AWS_PROFILE and BUCKET" >&2; exit 2; }
left=0
check() { # label  command-output
  if [[ -z "$2" || "$2" == "None" ]]; then printf 'ok    %-34s none\n' "$1"; else printf 'LEFT  %-34s %s\n' "$1" "$2"; left=1; fi
}

if aws s3api head-bucket --bucket "$BUCKET" >/dev/null 2>&1; then check "S3 bucket" "$BUCKET exists"; else check "S3 bucket" ""; fi
check "CloudFront distributions" "$(aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='myPortfolio static site'].Id" --output text 2>/dev/null)"
check "CloudFront OAC" "$(aws cloudfront list-origin-access-controls --query "OriginAccessControlList.Items[?starts_with(Name, '${BUCKET}-')].Id" --output text 2>/dev/null)"
check "CloudFront functions" "$(aws cloudfront list-functions --query "FunctionList.Items[?starts_with(Name, '${BUCKET}-')].Name" --output text 2>/dev/null)"
check "Response headers policy" "$(aws cloudfront list-response-headers-policies --type custom --query "ResponseHeadersPolicyList.Items[?ResponseHeadersPolicy.ResponseHeadersPolicyConfig.Name=='${BUCKET}-security'].ResponseHeadersPolicy.Id" --output text 2>/dev/null)"
if [[ -n "${DOMAIN:-}" ]]; then
  check "ACM certificate (us-east-1)" "$(aws acm list-certificates --region us-east-1 --query "CertificateSummaryList[?DomainName=='${DOMAIN}'].CertificateArn" --output text 2>/dev/null)"
fi
acct="$(aws sts get-caller-identity --query Account --output text 2>/dev/null)"
check "Budget" "$(aws budgets describe-budgets --account-id "$acct" --query "Budgets[?Name=='${BUCKET}-monthly'].Name" --output text 2>/dev/null)"
echo "Not checked here: Route 53 records for the domain (check the console), and the Terraform state bucket, which is kept by design."
exit $left
