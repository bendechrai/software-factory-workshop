# The factory loop (act 10, unattended)

`bin/factory-loop.sh` runs the orchestrator with no person at the keyboard.
It starts a headless harness session, waits for it to finish, checks the
board, and starts another, until a guard says stop.

Every iteration is a fresh session: no `--continue`, no `--resume`. The only
memory between runs is the repo, the board and the git history. That is on
purpose (see "context rot" below).

Each run gets `.agents/loop/prompt.md` as its last argument. It tells the
agent to follow the orchestrate skill, do at most one change per run, and
stop when the board is empty or it is blocked.

## Run it

```
bin/factory-loop.sh --dry-run   # show the settings, check the guards, call nothing
bin/factory-loop.sh             # run for real
bash bin/factory-loop.test.sh   # test the guards with a fake harness
```

Run the dry run first, every time.

## Environment variables

| Variable | Default | Meaning |
|---|---|---|
| `HARNESS_CMD` | `claude -p --allowedTools Bash(git:*),Bash(gh:*),Bash(agentboard:*),Bash(npm:*),Bash(npx:*),Bash(node:*),Bash(openspec:*),Read,Edit,Write,Glob,Grep --permission-mode acceptEdits --output-format json --max-budget-usd ${RUN_BUDGET_USD:-5}` | The headless command. The prompt is appended as its last argument. The `--allowedTools` list lets a headless session run the shell commands the orchestrate skill needs. It is untested in a real loop. |
| `RUN_BUDGET_USD` | `5` | Spend cap per run, used by the default Claude command only. |
| `MAX_ITERATIONS` | `5` | Most iterations the loop will start. |
| `MAX_MINUTES` | `120` | Wall-clock limit for the whole loop. Decimals work (`0.5`). |
| `SLEEP_SECONDS` | `30` | Cool-down between iterations. |
| `MAX_FAILURES` | `3` | Stop after this many failed harness runs in a row. |
| `WORKSHOP_DIR` | `../software-factory-workshop` from the repo | Where the workshop checkout is, for the cost hint. |

### Other harnesses

Set `HARNESS_CMD`. The prompt goes last, so the prompt flag, if there is
one, must come last in the command.

| Harness | `HARNESS_CMD` |
|---|---|
| Claude Code | `claude -p --allowedTools Bash(git:*),Bash(gh:*),Bash(agentboard:*),Bash(npm:*),Bash(npx:*),Bash(node:*),Bash(openspec:*),Read,Edit,Write,Glob,Grep --permission-mode acceptEdits --output-format json --max-budget-usd 5` |
| Codex | `codex exec --sandbox workspace-write --json` |
| Gemini CLI | `gemini --approval-mode auto_edit -o json -p` |
| Cursor | `agent -p --force --output-format json` |

Notes from `research/harnesses-2026-10-01.md`: Codex takes the prompt
positionally (its `-p` means profile). Gemini's `-p` takes the prompt as its
value, which is why it goes last. Cursor needs `--force` or it only proposes
changes. Only Claude Code has a per-run budget flag here, so with the others
the guards below are your only cost control; keep `MAX_ITERATIONS` small.

## The guards

All are checked before every iteration.

| Guard | What stops the loop | Exit | Why it exists |
|---|---|---|---|
| Stop file | `.agents/loop/STOP` exists | 0 | A human, or the agent, can stop it at once without finding the process. Stops silent wrong work. |
| `MAX_ITERATIONS` | Count reached | 0 | Caps runaway cost. A loop that is never told to end will not end on its own. |
| `MAX_MINUTES` | Wall clock reached | 0 | Caps runaway cost and an overnight run that hangs. |
| Board empty | Nothing in todo, tests, implementing or review | 0 | Without work, a fresh agent invents work. That is how a loop burns money. |
| Blocked twice | The same ticket is blocked after two iterations in a row | 1 | The agent is thrashing: retrying something it cannot do. A person is called instead of more spend. |
| `MAX_FAILURES` | Harness exits non-zero this many runs in a row | 2 | A broken login, a bad flag or an outage will not fix itself. One failed run is logged and the loop goes on. |
| Cool-down | `SLEEP_SECONDS` between runs | - | Slows a bad loop down enough to notice it, and stays clear of rate limits. |
| Fresh session | No `--continue` | - | Stops context rot: a long session fills with old attempts and gets worse. A fresh one re-reads the board and the repo. |
| Budget per run | `--max-budget-usd` (Claude Code) | - | Caps one run. |

The failure modes these answer are runaway cost, thrashing, context rot and
silent wrong work. They are described in
https://ralphloop.sh/blog/ralph-loop-failure-modes. The loop itself is the
"Ralph loop" from Geoffrey Huntley, https://ghuntley.com/ralph/: the same
prompt, fresh context each time, state kept in files.

Silent wrong work is the one no guard here catches. The orchestrate skill
does that job: it verifies each result itself and has every PR reviewed on a
different model, and the push hook runs the full preflight. The loop never
merges around those gates and never uses `--no-verify`.

## What it writes

- `.agents/loop/runs/<timestamp>-i<n>.json`: the harness output of each run
  (and `.err` beside it for stderr).
- `.agents/loop/loop.log`: one line per iteration with the iteration number,
  start, end, exit code and open tickets before and after.

All three of `runs/`, `STOP` and `loop.log` are gitignored.

Each iteration also copies the harness's own session files that changed
during it into `runs/<run>-sessions/` (Codex: `$CODEX_HOME/sessions`; nothing
happens if that folder does not exist), because the run JSON does not record
subagents or models. With `OPENROUTER_API_KEY` set, `loop.log` gets a line
with `usage` and `limit_remaining` before and after each iteration, which is
the cost record for a Codex run (the ledger reads Claude Code logs only).

When the loop ends it prints the ledger command for its time window:

```
cd <your repo>
node "<workshop>/tools/ledger/ledger.mjs" --since <loop start> --by agent
```

Put `CLAUDE_CONFIG_DIR=~/.claude-workshop` in front of the `node` command if you use the sandbox. Add `--no-cache` only when you want a cold recount.

## Overnight, in tmux

```
tmux new -s factory
MAX_ITERATIONS=10 MAX_MINUTES=480 SLEEP_SECONDS=60 bin/factory-loop.sh
# detach with Ctrl-b d, and come back with: tmux attach -t factory
```

Keep the machine awake (`caffeinate -i` on macOS). In the morning read
`.agents/loop/loop.log`, `agentboard list`, and the open PRs.

## Stop it

- Politely: `touch .agents/loop/STOP`. The loop ends before the next iteration.
  The current run finishes first.
- Now: Ctrl-c in the tmux window. Then check the board for tickets left
  claimed by a run that was cut off (`agentboard health`).
- Remove `.agents/loop/STOP` before the next run, or it will exit at once.

## Exit codes

`0` normal end (board empty, stop file, iteration or time limit). `1` the same
ticket stayed blocked for two iterations: look at it. `2` repeated harness
failures or bad usage.

## The two-tier rule

From the author's holodeck project: never make the factory the only way to
change the factory. This loop, the orchestrate skill and the board are the
fast path. The manual path must keep working beside them: a person can edit,
run `npm run verify`, commit and push with no agent and no loop. If the loop
breaks the board, the hooks or its own prompt, a person must still be able to
fix it by hand. So the loop changes product code through tickets and PRs, and
changes to the loop itself are made by a person.

## Tests

`bin/factory-loop.test.sh` builds a temporary git repo with its own board
(`AGENTBOARD_DIR`) and three ad hoc tickets, and drives the loop with
`bin/fake-harness.sh`, which calls no model. `FAKE_MODE` picks what the fake
does: `drain`, `noop`, `block`, `stop` or `fail`. The test proves each guard.
