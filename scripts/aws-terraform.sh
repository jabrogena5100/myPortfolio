#!/usr/bin/env bash
# Run Terraform inside the pinned Docker image using short-lived credentials exported from an `aws login`
# session. The credentials go to a mode-600 temp file that is removed on exit and are never printed.
# YOU run this; it is not run by the assistant.
#
#   export AWS_PROFILE=<your profile>
#   aws login --profile "$AWS_PROFILE"
#   scripts/aws-terraform.sh -chdir=infra/terraform init -backend-config=backend.hcl
#   scripts/aws-terraform.sh -chdir=infra/terraform plan -out=tfplan      # read it before applying
#   scripts/aws-terraform.sh -chdir=infra/terraform apply tfplan
#
# Credentials last about 15 minutes, so apply in a fresh login session. `-auto-approve` is refused on purpose.
set -euo pipefail

TF_VERSION="${TF_VERSION:-1.17.2}"
IMAGE="hashicorp/terraform:${TF_VERSION}"
PROFILE="${AWS_PROFILE:-}"

if [[ -z "$PROFILE" ]]; then echo "AWS_PROFILE is not set (export AWS_PROFILE=<profile>)" >&2; exit 1; fi
for a in "$@"; do
  if [[ "$a" == "-auto-approve" || "$a" == "--auto-approve" ]]; then
    echo "Refusing -auto-approve: save a plan with -out=tfplan, read it, then apply that file." >&2; exit 1
  fi
done

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$(mktemp)"; chmod 600 "$ENV_FILE"; trap 'rm -f "$ENV_FILE"' EXIT

if ! aws configure export-credentials --profile "$PROFILE" --format env-no-export > "$ENV_FILE" 2>/dev/null; then
  echo "Could not export credentials for profile '$PROFILE'. Run: aws login --profile $PROFILE" >&2; exit 1
fi
echo "terraform ${TF_VERSION} via Docker, profile ${PROFILE}" >&2

exec docker run --rm --network host --user "$(id -u):$(id -g)" --env-file "$ENV_FILE" \
  -e HOME=/tmp -e AWS_REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-us-west-2}}" -e TF_IN_AUTOMATION=1 \
  -v "$REPO_ROOT":/workspace -w /workspace "$IMAGE" "$@"
