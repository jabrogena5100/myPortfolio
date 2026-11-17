# Deployment runbook: S3 + CloudFront with Terraform

**You run every command in this file.** The assistant wrote and statically checked the Terraform and scripts, and has run no `plan`, no `apply`, and nothing against your AWS account. Read the "Not verified" section before you start.

Contents: what you get, before you start, one-time state bucket, configure, plan, apply, build and upload, verify, custom domain, updating, rollback, teardown, security review, not verified, GitHub Pages fallback.

## What you get

A private S3 bucket (never public) served only through CloudFront, with:

- HTTPS only (HTTP redirects), HTTP/2 and HTTP/3, gzip and Brotli compression
- Security headers set by CloudFront: a strict Content-Security-Policy (`infra/terraform/csp.txt`), HSTS (one year, no subdomains, no preload), `nosniff`, `X-Frame-Options: DENY`, a referrer policy, a permissions policy and `Cross-Origin-Opener-Policy`
- Directory URLs (`/projects/ryucloud/`) served by a small CloudFront Function; missing pages answered with the site's own 404 page
- Hashed assets cached for a year, HTML revalidated on every request
- Optionally: a custom domain with an ACM certificate and Route 53 records, and an account-wide monthly cost alert

No servers, no persistent compute, no logging, no analytics.

**Cost.** I have not estimated or measured it. The billable parts are S3 storage and requests, CloudFront data transfer and requests, and, only if you use a custom domain, the Route 53 hosted zone and the domain registration. Check the current AWS pricing pages before applying, and set the budget alert (below). Do not take any number from this file as a price.

## 1. Before you start

- An AWS account you control, and a sign-in that works with `aws login` (the same arrangement as your other projects: an IAM user with MFA, no access keys). Credentials last about 15 minutes, so run plan and apply in a fresh login.
- Docker (Terraform runs in the pinned image `hashicorp/terraform:1.17.2` through `scripts/aws-terraform.sh`).
- A decision on the domain: **you can skip it.** Without `domain_name` the site is served at a `*.cloudfront.net` address. Registering a domain and changing DNS are your decisions and are not done by anything here.
- Recommended: a budget alert. Set `budget_amount_usd` and `budget_email` in `terraform.tfvars` (section 3); it covers the whole account.

```
export AWS_PROFILE=<your profile>
aws login --profile "$AWS_PROFILE"
```

## 2. One-time: the Terraform state bucket

State lives in a bucket that Terraform does not manage (so a destroy can never delete its own history). Choose a unique name and region, then:

```
STATE=<your-state-bucket>; REGION=us-west-2
aws s3api create-bucket --bucket "$STATE" --region "$REGION" --create-bucket-configuration LocationConstraint="$REGION"
aws s3api put-bucket-versioning --bucket "$STATE" --versioning-configuration Status=Enabled
aws s3api put-public-access-block --bucket "$STATE" --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

State locking uses S3's native lockfile (`use_lockfile`); no DynamoDB table is needed.

## 3. Configure

```
cp infra/terraform/backend.hcl.example   infra/terraform/backend.hcl
cp infra/terraform/terraform.tfvars.example infra/terraform/terraform.tfvars
```

Edit both (they are git-ignored). In `terraform.tfvars`, set `bucket_name` to a globally unique lowercase name. Leave the domain lines commented out unless you are doing section 8.

## 4. Init and plan (read the plan)

```
scripts/aws-terraform.sh -chdir=infra/terraform init -backend-config=backend.hcl
scripts/aws-terraform.sh -chdir=infra/terraform plan -out=tfplan
```

Read the whole plan. From reading the configuration, a first plan with no domain and no budget should show about **11 to add, 0 to change, 0 to destroy** (7 for the bucket, 4 for CloudFront: access control, function, headers policy, distribution). A domain adds about 5 and a budget adds 1. **That count is my reading of the code, not a result I observed.** If a first plan shows anything to change or destroy, stop and ask.

Things to check in the plan: the bucket has `block_public_*` set to true; the distribution's origin uses the access control; there are no `aws_s3_bucket_acl` or public-policy resources.

## 5. Apply

Use a fresh login, then apply the saved plan (the wrapper refuses `-auto-approve` on purpose):

```
aws login --profile "$AWS_PROFILE"
scripts/aws-terraform.sh -chdir=infra/terraform apply tfplan
```

CloudFront takes several minutes to deploy. **If you see `ExpiredToken` mid-apply**: the distribution may already exist. Do not destroy. Log in again, run `plan -out=tfplan` again and apply that plan; if Terraform reports a lock, read the lock ID from the message and run `scripts/aws-terraform.sh -chdir=infra/terraform force-unlock <ID>` only when you are sure nothing else is running.

Then note the outputs:

```
scripts/aws-terraform.sh -chdir=infra/terraform output
```

## 6. Build with the real URL and upload

The canonical links and the sitemap need the final address, which exists only after apply:

```
SITE_URL="$(scripts/aws-terraform.sh -chdir=infra/terraform output -raw site_url)"
export SITE_URL
scripts/web.sh npm run build
scripts/site-sync.sh              # dry run: lists what it would upload
scripts/site-sync.sh --apply      # uploads (assets first, HTML last), then invalidates CloudFront
```

The script sets an explicit `Content-Type` per file type and `Cache-Control` per folder, and refuses to run if the build contains a file type it does not know.

## 7. Verify the deployed site

Replace `$SITE` with the `site_url` output.

```
SITE=https://<site>
curl -sI "$SITE/"            | grep -iE "^HTTP|content-security|strict-transport|x-content-type|x-frame|referrer|permissions|cross-origin|content-type|cache-control"
curl -sI -H 'accept-encoding: br' "$SITE/_astro/$(ls dist/_astro | grep css | head -1)" | grep -iE "content-encoding|cache-control|content-type"
curl -sI "$SITE/projects/ryucloud"   # expect 301 to /projects/ryucloud/
curl -s -o /dev/null -w "%{http_code}\n" "$SITE/no-such-page/"   # expect 404
curl -sI "http://${SITE#https://}/" | head -1                   # expect 301 to https
curl -s -o /dev/null -w "%{http_code}\n" "https://<bucket>.s3.<region>.amazonaws.com/index.html"   # expect 403: the bucket is not public
```

Then run the same automated checks against the live site, and keep the results (this is the first real Lighthouse figure for the deployed site; the local ones are a best case):

```
E2E_BASE_URL="$SITE" scripts/e2e.sh
LH_BASE_URL="$SITE" LH_OUT=design/lighthouse/summary-deployed.json scripts/lighthouse.sh
```

Record the outcome in `docs/verification.md`, including anything that fails. A first deployment normally finds something that only the real CDN reveals.

## 8. Optional: a custom domain

Nothing here registers a domain or changes DNS for you. If you want one:

1. Register the domain yourself and make sure a **Route 53 public hosted zone** for it exists and the registrar's name servers point at that zone (verify with `dig +norec NS <domain> @<tld server>`, not your local resolver; your RyuCloud work found that mismatch).
2. Set `domain_name = "www.example.com"` and `hosted_zone_id = "Z..."` in `terraform.tfvars`.
3. Plan and read: it adds an ACM certificate in us-east-1, its DNS validation records, the certificate validation, and A and AAAA alias records. Apply in a fresh login (validation can take a few minutes).
4. Rebuild with `SITE_URL=https://www.example.com`, upload, and verify again. A custom domain also lets CloudFront enforce TLS 1.2 or later (the default `*.cloudfront.net` certificate cannot).

## 9. Updating the site

```
SITE_URL=<site url> scripts/web.sh npm run build
scripts/e2e.sh                       # optional but recommended
scripts/site-sync.sh --apply
```

## 10. Rollback

The simplest rollback is Git: check out the previous good commit, rebuild and run `scripts/site-sync.sh --apply`. The bucket is also versioned (old versions are kept 30 days) if you need a single object back:

```
aws s3api list-object-versions --bucket <bucket> --prefix index.html --query 'Versions[].[VersionId,LastModified,IsLatest]' --output table
aws s3api copy-object --bucket <bucket> --key index.html --copy-source "<bucket>/index.html?versionId=<id>" --cache-control "public,max-age=0,must-revalidate" --content-type "text/html; charset=utf-8" --metadata-directive REPLACE
aws cloudfront create-invalidation --distribution-id <id> --paths '/*'
```

## 11. Teardown

```
aws login --profile "$AWS_PROFILE"
scripts/aws-terraform.sh -chdir=infra/terraform plan -destroy -out=tfplan
# read it: everything in this configuration, and nothing else
scripts/aws-terraform.sh -chdir=infra/terraform apply tfplan
BUCKET=<bucket> [DOMAIN=www.example.com] scripts/aws-site-audit.sh
```

`force_destroy` is on, so the bucket is emptied for you; the site is rebuilt from Git, so nothing is lost. A CloudFront distribution is disabled and then deleted, which can take 10 to 20 minutes. The state bucket, the domain registration and any hosted zone are not touched. The audit makes direct calls and prints `ok` or `LEFT` for each item.

## 12. Security review (what I checked by reading the configuration)

| Control | In the configuration |
| --- | --- |
| Bucket never public | All four public-access blocks on, ownership enforced, policy allows only `cloudfront.amazonaws.com` for `s3:GetObject` and only for this distribution's ARN (`AWS:SourceArn`) |
| Plain HTTP refused at the bucket | Deny statement on `aws:SecureTransport = false` |
| Encryption at rest | SSE-S3 (AES-256) |
| Origin access | CloudFront origin access control with SigV4, not the legacy identity |
| Content-Security-Policy | `default-src 'self'`; no inline scripts or styles; `object-src 'none'`; `frame-ancestors 'none'`; `form-action 'none'`. The site was tested under this exact policy with no violations |
| HSTS | One year, no `includeSubDomains`, no `preload` (those are hard to undo) |
| Least privilege | No `s3:ListBucket` for CloudFront, so a missing page is a 403 that the distribution maps to the 404 page |
| No WAF, no logging | By choice, for cost and privacy. A static site with no inputs has little for a WAF to do |

Known limits: the default `*.cloudfront.net` certificate cannot enforce TLS 1.2 or later; CSP `style-src 'self'` means no inline styles can ever be added without changing the policy; the cost alert is account-wide, not per site.

## 13. Not verified

- **`terraform plan` and `apply` were never run.** `fmt` and `validate` passed (Terraform 1.17.2, AWS provider 6.73.0). A configuration can validate and still fail at plan or apply.
- The CloudFront Function was unit-tested in Node, not in CloudFront's runtime.
- The headers, compression and caching behaviour on a real distribution are untested.
- No security scanner (such as checkov or tfsec) was run.
- Cost is unknown.
- Lighthouse and the browser checks have only been run against the local preview.

## Fallback: GitHub Pages

See `docs/deploy/github-pages.md`. It is free and simpler, with real limits (no custom security headers, root-path hosting only).
