#!/usr/bin/env bash
# A harness hook, run before every shell command the agent proposes.
# It refuses any git command that skips the git hooks. Reads the tool
# call as JSON on stdin (Claude Code's PreToolUse shape); exit 2 blocks.
set -euo pipefail
input="$(cat)"
cmd="$(printf '%s' "$input" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("command",""))' 2>/dev/null || true)"
case "$cmd" in
  *--no-verify*|*"-c core.hooksPath"*|*"hooksPath="*)
    echo "Blocked: this command would skip the git hooks. Fix the failing gate instead." >&2
    exit 2 ;;
esac
exit 0
