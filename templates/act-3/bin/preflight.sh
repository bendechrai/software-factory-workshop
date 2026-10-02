#!/usr/bin/env bash
# preflight: run every gate against one commit, in a clean export of it.
#
#   bin/preflight.sh [<commit>] [--skip-e2e] [--only <gate>]
#
# Gates, in order: install, verify, build, audit, migrations, e2e.
# The commit is exported with `git archive`, so a file you forgot to
# commit, or a stale build artefact, cannot make a gate pass.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

COMMITISH="HEAD"; SKIP_E2E=0; ONLY=""
while [ $# -gt 0 ]; do
  case "$1" in
    --skip-e2e) SKIP_E2E=1 ;;
    --only) shift; ONLY="$1" ;;
    -*) echo "preflight: unknown option $1" >&2; exit 2 ;;
    *) COMMITISH="$1" ;;
  esac
  shift
done

SHA="$(git rev-parse --verify "${COMMITISH}^{commit}")"
SHORT="$(git rev-parse --short "$SHA")"
WORK="${TMPDIR:-/tmp}/preflight-${SHA}"

BOLD='\033[1m'; CYAN='\033[1;36m'; RED='\033[1;31m'; GRN='\033[1;32m'; YEL='\033[1;33m'; RST='\033[0m'
banner() { printf '\n%b==> %s%b\n' "$CYAN" "$1" "$RST"; }

names=(); statuses=(); seconds=()
summary() {
  printf '\n%bTiming%b\n' "$BOLD" "$RST"
  local i; for i in "${!names[@]}"; do printf '  %-12s %-7s %ss\n' "${names[$i]}" "${statuses[$i]}" "${seconds[$i]}"; done
}
wants() { [ -z "$ONLY" ] || [ "$ONLY" = "$1" ] || { [ "$1" = install ] && [ "$ONLY" != e2e ]; }; }
run_gate() {
  local name="$1" fn="$2" t0="$SECONDS"
  wants "$name" || return 0
  banner "gate: $name"
  if "$fn"; then names+=("$name"); statuses+=(ok); seconds+=($((SECONDS - t0)))
  else
    names+=("$name"); statuses+=(FAIL); seconds+=($((SECONDS - t0)))
    printf '\n%bPREFLIGHT FAILED at gate %s. Commit %s is not safe to push.%b\n' "$RED" "$name" "$SHORT" "$RST"
    summary; exit 1
  fi
}

cleanup() { rm -rf "$WORK"; }
trap cleanup EXIT

gate_install()    { (cd "$WORK" && npm ci --no-audit --no-fund); }
gate_verify()     { (cd "$WORK" && npm run verify); }
gate_build()      { (cd "$WORK" && npm run build --if-present); }
gate_audit()      { (cd "$WORK" && npm audit --audit-level=high); }
gate_migrations() {
  (cd "$WORK" && HOP_DB=":memory:" npm run migrate >/dev/null) || return 1
  # A second run on the same file must apply nothing.
  (cd "$WORK" && rm -f preflight.sqlite && HOP_DB=preflight.sqlite npm run migrate >/dev/null \
    && HOP_DB=preflight.sqlite npm run migrate | tee /dev/stderr | grep -q "applied 0") || return 1
}
gate_e2e()        { (cd "$WORK" && npm run e2e); }

printf '%bpreflight%b  commit %s\n' "$BOLD" "$RST" "$SHORT"
banner "gate: archive"
rm -rf "$WORK"; mkdir -p "$WORK"
git archive "$SHA" | tar -x -C "$WORK"
[ ! -e "$WORK/node_modules" ] || { echo "node_modules is committed; preflight assumes it is not" >&2; exit 2; }
printf '  exported to %s\n' "$WORK"

run_gate install    gate_install
run_gate verify     gate_verify
run_gate build      gate_build
run_gate audit      gate_audit
run_gate migrations gate_migrations
if wants e2e; then
  if [ "$SKIP_E2E" = 1 ]; then
    printf '%bWAIVED: e2e - skipped by --skip-e2e%b\n' "$YEL" "$RST"
    names+=(e2e); statuses+=(WAIVED); seconds+=(0)
  else
    run_gate e2e gate_e2e
  fi
fi

printf '\n%bPREFLIGHT PASSED - %s is safe to push%b\n' "$GRN" "$SHORT" "$RST"
summary
