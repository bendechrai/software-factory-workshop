#!/usr/bin/env bash
# Runs the orchestrator headless in a loop, with no person at the keyboard.
# Every iteration is a FRESH session (no --continue), given .agents/loop/prompt.md.
# Read .agents/loop/README.md for why each guard exists.
#
# The harness command is HARNESS_CMD; the prompt is appended as its last argument.
# Equivalents for other harnesses (see research/harnesses-2026-10-01.md):
#   Claude Code: claude -p --allowedTools Bash(git:*),Bash(gh:*),Bash(agentboard:*),Bash(npm:*),Bash(npx:*),Bash(node:*),Bash(openspec:*),Read,Edit,Write,Glob,Grep --permission-mode acceptEdits --output-format json --max-budget-usd 5
#                (--allowedTools is variadic, so it comes before the flags that take one value;
#                 the prompt is appended last. The list has no spaces because this command is split on spaces.
#                 This permission set is untested in a real loop.)
#   Codex:       codex exec --sandbox workspace-write --json
#   Gemini:      gemini --approval-mode auto_edit -o json -p      (prompt follows -p)
#   Cursor:      agent -p --force --output-format json
#
# Exit codes: 0 normal end (board empty, stop file, iteration or time limit),
#             1 the same ticket stayed blocked for two iterations (call a human),
#             2 too many failed harness runs in a row, or bad usage.
set -u

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
LOOP_DIR="$ROOT/.agents/loop"
STOP_FILE="$LOOP_DIR/STOP"
PROMPT_FILE="$LOOP_DIR/prompt.md"
RUNS_DIR="$LOOP_DIR/runs"
LOG_FILE="$LOOP_DIR/loop.log"

MAX_ITERATIONS=${MAX_ITERATIONS:-5}
MAX_MINUTES=${MAX_MINUTES:-120}
SLEEP_SECONDS=${SLEEP_SECONDS:-30}
MAX_FAILURES=${MAX_FAILURES:-3}
HARNESS_CMD=${HARNESS_CMD:-"claude -p --allowedTools Bash(git:*),Bash(gh:*),Bash(agentboard:*),Bash(npm:*),Bash(npx:*),Bash(node:*),Bash(openspec:*),Read,Edit,Write,Glob,Grep --permission-mode acceptEdits --output-format json --max-budget-usd ${RUN_BUDGET_USD:-5}"}
WORKSHOP_DIR=${WORKSHOP_DIR:-"$ROOT/../software-factory-workshop"}

usage() {
  cat <<USAGE
Usage: bin/factory-loop.sh [--dry-run] [--help]

Runs the orchestrator headless, one fresh session per iteration, until a guard stops it.

Environment (defaults):
  HARNESS_CMD     harness command, prompt is appended as the last argument
                  (claude -p --allowedTools <git, gh, agentboard, npm, npx, node, openspec, file tools>
                  --permission-mode acceptEdits --output-format json --max-budget-usd \$RUN_BUDGET_USD;
                  see .agents/loop/README.md for the full list, which is untested in a real loop)
  RUN_BUDGET_USD  budget per run for the default Claude command (5)
  MAX_ITERATIONS  most iterations to run (5)
  MAX_MINUTES     wall-clock limit for the whole loop, decimals allowed (120)
  SLEEP_SECONDS   cool-down between iterations (30)
  MAX_FAILURES    stop after this many failed harness runs in a row (3)
  WORKSHOP_DIR    workshop checkout, for the cost hint (../software-factory-workshop from the repo)

Stop it: touch .agents/loop/STOP
Exit codes: 0 normal end, 1 same ticket blocked twice in a row, 2 failures or bad usage.
USAGE
}

DRY_RUN=0
case "${1:-}" in
  "") ;;
  --dry-run) DRY_RUN=1 ;;
  -h|--help) usage; exit 0 ;;
  *) usage >&2; exit 2 ;;
esac

cd "$ROOT" || exit 2
mkdir -p "$RUNS_DIR"

now() { date +%s; }
stamp() { date -u +%Y-%m-%dT%H:%M:%SZ; }
say() { echo "[factory-loop] $*"; }

# Ticket ids (one per line) in the given board statuses.
ids_in() {
  local status
  for status in "$@"; do
    agentboard list --status "$status" 2>/dev/null | awk 'NF { print $1 }'
  done
}
open_ids() { ids_in todo tests implementing review; }
blocked_ids() { ids_in blocked | sort; }
count_lines() { awk 'NF' | wc -l | tr -d ' '; }

START_EPOCH=$(now)
START_ISO=$(stamp)
LIMIT_SECONDS=$(awk -v m="$MAX_MINUTES" 'BEGIN { printf "%d", m * 60 }')
BLOCKED_PREV=""     # blocked tickets after the previous iteration
BLOCKED_PREV_2=""   # and after the one before that
failures=0
iteration=0

# Prints a reason and returns 0 when the loop must end; sets EXIT_CODE.
check_guards() {
  if [ -e "$STOP_FILE" ]; then
    say "stop file present ($STOP_FILE), exiting"; EXIT_CODE=0; return 0
  fi
  if [ "$iteration" -ge "$MAX_ITERATIONS" ]; then
    say "reached MAX_ITERATIONS ($MAX_ITERATIONS), exiting"; EXIT_CODE=0; return 0
  fi
  if [ $(( $(now) - START_EPOCH )) -ge "$LIMIT_SECONDS" ]; then
    say "reached MAX_MINUTES ($MAX_MINUTES), exiting"; EXIT_CODE=0; return 0
  fi
  if [ "$failures" -ge "$MAX_FAILURES" ]; then
    say "$failures failed harness runs in a row, exiting"; EXIT_CODE=2; return 0
  fi
  if [ -z "$(open_ids)" ]; then
    say "board empty, exiting"; EXIT_CODE=0; return 0
  fi
  return 1
}

cost_hint() {
  say "cost of this loop (run from the repo; put CLAUDE_CONFIG_DIR=~/.claude-workshop in front if you use the sandbox):"
  say "  cd $ROOT"
  say "  node \"$WORKSHOP_DIR/tools/ledger/ledger.mjs\" --since $START_ISO --by agent"
}

if [ "$DRY_RUN" = 1 ]; then
  say "dry run: no harness will be called"
  say "harness:  $HARNESS_CMD <prompt from $PROMPT_FILE>"
  say "limits:   $MAX_ITERATIONS iterations, $MAX_MINUTES minutes, ${SLEEP_SECONDS}s cool-down, $MAX_FAILURES failures in a row"
  say "open tickets: $(open_ids | count_lines), blocked: $(blocked_ids | count_lines)"
  if check_guards; then say "a real run would stop now"; else say "guards pass: a real run would start iteration 1"; fi
  exit 0
fi

[ -r "$PROMPT_FILE" ] || { say "missing $PROMPT_FILE"; exit 2; }
read -r -a HARNESS <<< "$HARNESS_CMD"
PROMPT=$(cat "$PROMPT_FILE")

EXIT_CODE=0
while true; do
  # The blocked check uses the state after the previous iteration, so one
  # iteration must have run before it can fire.
  if [ -n "$BLOCKED_PREV" ] && [ "$iteration" -ge 2 ]; then
    stuck=$(comm -12 <(echo "$BLOCKED_PREV") <(echo "$BLOCKED_PREV_2") | head -n 1)
    if [ -n "$stuck" ]; then
      say "ticket $stuck stayed blocked for two iterations in a row, a human is needed"
      EXIT_CODE=1; break
    fi
  fi
  check_guards && break

  iteration=$((iteration + 1))
  before=$(open_ids | count_lines)
  started=$(stamp)
  run_file="$RUNS_DIR/$(date -u +%Y%m%dT%H%M%SZ)-i$iteration.json"
  say "iteration $iteration: $before open tickets, output in $run_file"

  "${HARNESS[@]}" "$PROMPT" > "$run_file" 2> "$run_file.err"
  code=$?

  after=$(open_ids | count_lines)
  echo "iteration=$iteration start=$started end=$(stamp) exit=$code open_before=$before open_after=$after" >> "$LOG_FILE"
  say "iteration $iteration finished: exit $code, $after open tickets"

  # A failed run is logged and the loop carries on; MAX_FAILURES ends a streak.
  if [ "$code" -ne 0 ]; then failures=$((failures + 1)); else failures=0; fi

  BLOCKED_PREV_2=$BLOCKED_PREV
  BLOCKED_PREV=$(blocked_ids)

  # Cool down only if another iteration could follow.
  if [ "$SLEEP_SECONDS" -gt 0 ] && [ ! -e "$STOP_FILE" ] && [ "$iteration" -lt "$MAX_ITERATIONS" ]; then
    sleep "$SLEEP_SECONDS"
  fi
done

cost_hint
exit "$EXIT_CODE"
