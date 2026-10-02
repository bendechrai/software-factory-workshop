#!/usr/bin/env bash
# Stands in for a real harness in bin/factory-loop.test.sh. Never call a model.
# Reads its last argument (the prompt), logs it, then acts on FAKE_MODE:
#   drain  move one open ticket to merged     noop  do nothing
#   block  block one open ticket (if none is blocked yet)
#   stop   create the STOP file               fail  exit 3
# Needs AGENTBOARD_DIR and FAKE_LOG; runs in the repo root like a real harness.
set -u
prompt="${*: -1}"
echo "$(date -u +%H:%M:%S) mode=${FAKE_MODE:-noop} prompt=${prompt:0:40}" >> "${FAKE_LOG:?FAKE_LOG not set}"
echo '{"fake":true}'

first_open() {
  local s
  for s in todo tests implementing review; do
    agentboard list --status "$s" | awk 'NF { print $1; exit }'
  done | head -n 1
}

case "${FAKE_MODE:-noop}" in
  drain)
    id=$(first_open)
    [ -n "$id" ] || exit 0
    # An ad hoc ticket needs a task link before it may enter implementing.
    agentboard link "$id" --task "loop:test#$id" --as fake >/dev/null 2>&1
    # Walk the legal path: todo, tests, implementing, review, merged.
    for s in tests implementing review merged; do agentboard move "$id" "$s" --as fake >/dev/null || exit 1; done ;;
  block)
    if [ -z "$(agentboard list --status blocked | awk 'NF')" ]; then
      id=$(first_open)
      [ -n "$id" ] && agentboard move "$id" blocked --as fake >/dev/null
    fi ;;
  stop) mkdir -p .agents/loop && touch .agents/loop/STOP ;;
  fail) exit 3 ;;
  noop) ;;
  *) echo "unknown FAKE_MODE" >&2; exit 64 ;;
esac
