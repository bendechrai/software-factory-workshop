#!/usr/bin/env bash
# Point git at .githooks/ so the pre-commit and pre-push gates run.
# Run once per clone. Safe to run again.
set -euo pipefail
cd "$(dirname "$0")/.."
git config core.hooksPath .githooks
chmod +x .githooks/* bin/*.sh
echo "core.hooksPath -> .githooks"
echo "  pre-commit  gitleaks on the staged changes, then npm run verify"
echo "  pre-push    bin/preflight.sh on every commit being pushed"
echo "Try them without committing:  .githooks/pre-commit   and   bin/preflight.sh HEAD"
