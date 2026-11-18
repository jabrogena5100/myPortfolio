#!/usr/bin/env bash
# Upload dist/ to the site bucket with explicit content types and cache headers, then invalidate CloudFront.
# DRY RUN by default: it only prints what it would do. Add --apply to upload. YOU run this.
#
#   export AWS_PROFILE=<your profile>; aws login --profile "$AWS_PROFILE"
#   SITE_URL=https://<your-site> scripts/web.sh npm run build
#   scripts/site-sync.sh              # dry run
#   scripts/site-sync.sh --apply      # upload, then invalidate
#
# Bucket and distribution come from `terraform output`, or set BUCKET and DISTRIBUTION_ID yourself.
set -euo pipefail
cd "$(dirname "$0")/.."

APPLY=0; [[ "${1:-}" == "--apply" ]] && APPLY=1
[[ -n "${AWS_PROFILE:-}" ]] || { echo "AWS_PROFILE is not set" >&2; exit 1; }
# Refuse the shared `default` profile (usually used by other projects) unless explicitly allowed.
if [[ "${AWS_PROFILE:-}" == "default" && "${ALLOW_DEFAULT_PROFILE:-}" != "1" ]]; then
  echo "Refusing the shared 'default' profile. Use a dedicated profile (docs/deploy/runbook.md section 1), or set ALLOW_DEFAULT_PROFILE=1." >&2; exit 1
fi

# Pre-flight on the build output.
[[ -f dist/index.html && -f dist/404.html ]] || { echo "dist/ is missing index.html or 404.html. Build first." >&2; exit 1; }
grep -q 'rel="canonical"' dist/index.html || echo "WARNING: built without SITE_URL, so there are no canonical links or sitemap." >&2

declare -A CT=(
  [html]="text/html; charset=utf-8" [css]="text/css; charset=utf-8" [js]="text/javascript; charset=utf-8"
  [svg]="image/svg+xml" [webp]="image/webp" [png]="image/png" [woff2]="font/woff2"
  [txt]="text/plain; charset=utf-8" [md]="text/plain; charset=utf-8" [xml]="application/xml" [json]="application/json"
)
unknown="$(find dist -type f | sed 's/.*\.//' | sort -u | while read -r e; do [[ -n "${CT[$e]:-}" ]] || echo "$e"; done)"
[[ -z "$unknown" ]] || { echo "dist/ has file types with no content type mapping: $unknown" >&2; exit 1; }

BUCKET="${BUCKET:-$(scripts/aws-terraform.sh -chdir=infra/terraform output -raw bucket_name)}"
DIST="${DISTRIBUTION_ID:-$(scripts/aws-terraform.sh -chdir=infra/terraform output -raw distribution_id)}"
echo "bucket: $BUCKET   distribution: $DIST   mode: $([[ $APPLY == 1 ]] && echo APPLY || echo dry-run)" >&2

DRY=(); [[ $APPLY == 1 ]] || DRY=(--dryrun)

# One sync per file type so every object gets an explicit Content-Type.
sync_group() { # dir prefix cache-control [extra filters...]
  local dir="$1" prefix="$2" cache="$3"; shift 3
  for ext in "${!CT[@]}"; do
    aws s3 sync "$dir" "s3://${BUCKET}/${prefix}" --exclude "*" --include "*.${ext}" "$@" \
      --content-type "${CT[$ext]}" --cache-control "$cache" --delete "${DRY[@]}"
  done
}

# Order matters: hashed assets first, HTML last, so no page ever points at a file that is not there yet.
# Hashed filenames mean a file with the same name always has the same content, so compare size only (the build rewrites
# every CSS file with a new timestamp, which would otherwise re-upload identical files each time).
sync_group dist/_astro "_astro" "public,max-age=31536000,immutable" --size-only
sync_group dist/fonts  "fonts"  "public,max-age=2592000"
sync_group dist        ""       "public,max-age=0,must-revalidate" --exclude "_astro/*" --exclude "fonts/*"

if [[ $APPLY == 1 ]]; then
  aws cloudfront create-invalidation --distribution-id "$DIST" --paths '/*' --query 'Invalidation.{Id:Id,Status:Status}' --output table
  echo "Done. Check the site, then see docs/deploy/runbook.md section 7." >&2
else
  echo "Dry run only. Re-run with --apply to upload." >&2
fi
