#!/usr/bin/env bash
# Tests bin/factory-loop.sh against bin/fake-harness.sh. No real harness is run.
# shellcheck disable=SC2034,SC2016,SC2001  # check() evals single-quoted conditions that read these variables
# Usage: bash bin/factory-loop.test.sh
set -u
SRC=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
pass=0; fail=0
TEMPS=()
trap 'rm -rf "${TEMPS[@]}"' EXIT

# Fresh temp repo with its own board and 3 adhoc tickets (or $1 tickets).
setup() {
  T=$(mktemp -d); TEMPS+=("$T")
  mkdir -p "$T/bin" "$T/.agents/loop"
  cp "$SRC/bin/factory-loop.sh" "$SRC/bin/fake-harness.sh" "$T/bin/"
  cp "$SRC/.agents/loop/prompt.md" "$T/.agents/loop/"
  git -C "$T" init -q
  export AGENTBOARD_DIR="$T/.board" FAKE_LOG="$T/fake.log"
  (cd "$T" && agentboard init >/dev/null 2>&1)
  local i
  for ((i = 1; i <= ${1:-3}; i++)); do
    (cd "$T" && agentboard new "ticket $i" --adhoc "loop test" --as test >/dev/null)
  done
  export HARNESS_CMD="bash $T/bin/fake-harness.sh" SLEEP_SECONDS=0
  export MAX_ITERATIONS=5 MAX_MINUTES=120 MAX_FAILURES=3
  : > "$FAKE_LOG"
}

# run_loop [args]: runs the loop, sets OUT and CODE, and counts harness calls.
run_loop() {
  OUT=$(bash "$T/bin/factory-loop.sh" "$@" 2>&1); CODE=$?
  CALLS=$(awk 'END { print NR }' "$FAKE_LOG")
}

check() { # name, bash condition to eval (true = pass)
  if eval "$2"; then echo "PASS  $1"; pass=$((pass + 1))
  else echo "FAIL  $1"; echo "$OUT" | sed 's/^/      /'; fail=$((fail + 1)); fi
}
has() { grep -q -- "$1" <<< "$OUT"; }

setup 3; FAKE_MODE=drain run_loop
check "drains 3 tickets, then exits 0 with 'board empty' after 3 harness calls" \
  '(( CODE == 0 && CALLS == 3 )) && has "board empty"'
lines=$(awk 'END { print NR }' "$T/.agents/loop/loop.log")
check "logs one loop.log line and one runs/ file per iteration" \
  '(( lines == 3 )) && [ "$(ls "$T/.agents/loop/runs"/*.json | wc -l)" -eq 3 ]'
check "prints the ledger cost hint" 'has "ledger.mjs. --since"'

setup 3; FAKE_MODE=noop MAX_ITERATIONS=2 run_loop
check "stops at MAX_ITERATIONS with noop (2 calls, exit 0)" \
  '(( CODE == 0 && CALLS == 2 )) && has "MAX_ITERATIONS"'

setup 3; FAKE_MODE=stop run_loop
check "stops on the STOP file the harness created (1 call, exit 0)" \
  '(( CODE == 0 && CALLS == 1 )) && has "stop file"'

setup 3; touch "$T/.agents/loop/STOP"; FAKE_MODE=noop run_loop
check "does not start at all when STOP already exists (0 calls)" '(( CODE == 0 && CALLS == 0 ))'

setup 3; FAKE_MODE=block run_loop
check "exits 1 when the same ticket stays blocked two iterations (2 calls)" \
  '(( CODE == 1 && CALLS == 2 )) && has "stayed blocked"'

setup 3; FAKE_MODE=noop MAX_MINUTES=0.02 SLEEP_SECONDS=1 MAX_ITERATIONS=50 run_loop
check "respects MAX_MINUTES (exit 0, stopped well before 50 iterations)" \
  '(( CODE == 0 && CALLS >= 1 && CALLS < 10 )) && has "MAX_MINUTES"'

setup 0; FAKE_MODE=noop run_loop
check "exits immediately when the board starts empty (0 calls)" \
  '(( CODE == 0 && CALLS == 0 )) && has "board empty"'

setup 3; FAKE_MODE=noop run_loop --dry-run
check "--dry-run calls no harness, writes no log, exits 0" \
  '(( CODE == 0 && CALLS == 0 )) && [ ! -e "$T/.agents/loop/loop.log" ] && has "dry run"'

setup 3; FAKE_MODE=fail MAX_ITERATIONS=2 run_loop
check "a failing iteration is logged with exit=3 and the loop continues (2 calls)" \
  '(( CODE == 0 && CALLS == 2 )) && grep -q "exit=3" "$T/.agents/loop/loop.log"'

setup 3; FAKE_MODE=fail MAX_ITERATIONS=10 run_loop
check "MAX_FAILURES failed runs in a row end the loop with exit 2 (3 calls)" \
  '(( CODE == 2 && CALLS == 3 ))'

setup 3; FAKE_MODE=noop run_loop --bogus
check "unknown argument exits 2 with usage" '(( CODE == 2 )) && has "Usage"'

setup 2; FAKE_MODE=noop MAX_ITERATIONS=1 run_loop
check "the harness gets /dev/null on stdin (empty, not a tty)" \
  'grep -q "stdin=empty" "$FAKE_LOG.in"'

setup 2; FAKE_MODE=noop MAX_ITERATIONS=1 HARNESS_CMD="bash $T/bin/fake-harness.sh exec --json -C $T" run_loop
check "a multi-word HARNESS_CMD with -C <path> passes every word, then the prompt last" \
  'grep -q "args=5" "$FAKE_LOG.in" && grep -q "prompt=You are the orchestrator" "$FAKE_LOG"'

# No key: no usage line. No sessions folder: nothing copied, loop still fine.
setup 2; FAKE_MODE=noop MAX_ITERATIONS=1 CODEX_HOME="$T/no-such-codex-home" run_loop
check "no OPENROUTER_API_KEY: no usage line in loop.log" \
  '(( CODE == 0 )) && ! grep -q openrouter "$T/.agents/loop/loop.log"'
check "no sessions folder: copy is a no-op (no -sessions folder, exit 0)" \
  '! ls -d "$T/.agents/loop/runs"/*-sessions >/dev/null 2>&1'

# Sessions touched during the iteration are copied; older ones are not.
setup 2; FAKE_MODE=noop MAX_ITERATIONS=1
mkdir -p "$T/codex/sessions/2026/10/02"; echo old > "$T/codex/sessions/2026/10/02/old.jsonl"
touch -t 202001010000 "$T/codex/sessions/2026/10/02/old.jsonl"
printf '#!/bin/sh\necho new > "%s/codex/sessions/2026/10/02/new.jsonl"\nexec bash "%s/bin/fake-harness.sh" "$@"\n' "$T" "$T" > "$T/wrap.sh"
HARNESS_CMD="sh $T/wrap.sh" CODEX_HOME="$T/codex" run_loop
check "a session file written during the iteration is copied, an older one is not" \
  'find "$T/.agents/loop/runs" -name new.jsonl | grep -q . && ! find "$T/.agents/loop/runs" -name old.jsonl | grep -q .'

# With a key and a stub curl, usage and limit_remaining are logged, nothing else.
setup 2; FAKE_MODE=noop MAX_ITERATIONS=1
mkdir -p "$T/stub"
cat > "$T/stub/curl" <<'STUB'
#!/bin/sh
echo '{"data":{"usage":1.5,"limit":null,"limit_remaining":null,"label":"secret-label"}}'
STUB
chmod +x "$T/stub/curl"
PATH="$T/stub:$PATH" OPENROUTER_API_KEY=sk-test CODEX_HOME="$T/no-such" run_loop
check "with a key: loop.log has openrouter usage before and after, and no key or label" \
  'grep -q "openrouter_before: usage=1.5 limit_remaining=null openrouter_after: usage=1.5" "$T/.agents/loop/loop.log" && ! grep -q "sk-test\|secret-label" "$T/.agents/loop/loop.log"'

echo; echo "$pass passed, $fail failed"
[ "$fail" -eq 0 ]
