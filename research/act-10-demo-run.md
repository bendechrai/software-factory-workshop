Both parts are done and pushed to main. The loop was NOT run against a real harness. I did not run claude, codex, gemini or agent. Only the fake harness was used, so the default Claude command and the other harness command lines are untested.

**Commits (hop-demo, main, pushed, hooks and pre-push gate passed, no --no-verify)**
- Part 0: `ccbc7e62bc3fe9f60fee26ab629db2f9565d88a7`
- Part 1: `e7efcb17b634ab58c41acf28744cd42c3d7814b5`
- Nothing was committed in the workshop repo.

**Part 0**
- `AGENTS.md` now has "## You are an orchestrator" right after the opening paragraph, with the line verbatim.
- `/Users/ben/Projects/software-factory-workshop/templates/act-9/AGENTS-additions.md` holds the comment `<!-- Add these to AGENTS.md in act 9. -->`, then the section, then the existing orchestrate line copied from AGENTS.md ("A whole change is built with the `orchestrate` skill: ...").
- The commit message says why: the author keeps this line in every AGENTS.md so the main session delegates instead of doing grunt work at the strongest model's price.

**Part 1 files (demo repo)**
- `bin/factory-loop.sh`
- `bin/fake-harness.sh`
- `bin/factory-loop.test.sh`
- `.agents/loop/prompt.md`
- `.agents/loop/README.md`
- `.gitignore` (adds `.agents/loop/runs/`, `.agents/loop/STOP`, `.agents/loop/loop.log`)

All of the loop files except `.gitignore` are copied to `/Users/ben/Projects/software-factory-workshop/templates/act-10/` with the same relative paths.

**Usage / `--help` text** (`bin/factory-loop.sh --help`)
```
Usage: bin/factory-loop.sh [--dry-run] [--help]

Runs the orchestrator headless, one fresh session per iteration, until a guard stops it.

Environment (defaults):
  HARNESS_CMD     harness command, prompt is appended as the last argument
                  (claude -p --permission-mode acceptEdits --output-format json --max-budget-usd $RUN_BUDGET_USD)
  RUN_BUDGET_USD  budget per run for the default Claude command (5)
  MAX_ITERATIONS  most iterations to run (5)
  MAX_MINUTES     wall-clock limit for the whole loop, decimals allowed (120)
  SLEEP_SECONDS   cool-down between iterations (30)
  MAX_FAILURES    stop after this many failed harness runs in a row (3)
  WORKSHOP_DIR    workshop checkout, for the cost hint (../.. from the repo)

Stop it: touch .agents/loop/STOP
Exit codes: 0 normal end, 1 same ticket blocked twice in a row, 2 failures or bad usage.
```

**Design choices**
- I added `MAX_FAILURES` (default 3), which you didn't ask for. A failed harness run is logged and the loop continues, but this many failures in a row end it with exit 2.
- Normal ends exit 0: board empty, stop file, iteration limit, time limit.
- "Board empty" means nothing in todo, tests, implementing or review. Blocked tickets alone count as empty.
- The blocked guard compares the blocked set after each of the last two iterations, so it fires before iteration 3 at the earliest.
- Run files are named `<timestamp>-i<n>.json`, with the iteration number added to avoid collisions at `SLEEP_SECONDS=0`. Stderr goes to `<run>.json.err`.
- `MAX_MINUTES` accepts decimals, which is how the test uses a tiny value.
- The Gemini equivalent is `gemini --approval-mode auto_edit -o json -p` rather than your `gemini -p ... --approval-mode ...` form. The `-p` flag takes the prompt as its value, so it has to come last for the "prompt is the last argument" rule to work.
- `WORKSHOP_DIR` defaults to `../..` from the repo, which resolves to the workshop root for this checkout. The cost hint prints `node <WORKSHOP_DIR>/tools/ledger/ledger.mjs --since <ISO start> --by agent`.
- In the fake harness, `drain` first runs `agentboard link <id> --task loop:test#<id>`. Ad hoc tickets can't enter implementing without a task link. It then walks todo, tests, implementing, review, merged.

**Test output** (`bash bin/factory-loop.test.sh`)
```
PASS  drains 3 tickets, then exits 0 with 'board empty' after 3 harness calls
PASS  logs one loop.log line and one runs/ file per iteration
PASS  prints the ledger cost hint
PASS  stops at MAX_ITERATIONS with noop (2 calls, exit 0)
PASS  stops on the STOP file the harness created (1 call, exit 0)
PASS  does not start at all when STOP already exists (0 calls)
PASS  exits 1 when the same ticket stays blocked two iterations (2 calls)
PASS  respects MAX_MINUTES (exit 0, stopped well before 50 iterations)
PASS  exits immediately when the board starts empty (0 calls)
PASS  --dry-run calls no harness, writes no log, exits 0
PASS  a failing iteration is logged with exit=3 and the loop continues (2 calls)
PASS  MAX_FAILURES failed runs in a row end the loop with exit 2 (3 calls)
PASS  unknown argument exits 2 with usage

13 passed, 0 failed
```

**Shellcheck:** installed, and `shellcheck bin/*.sh` exits 0 with no findings. The test file has one `# shellcheck disable=SC2034,SC2016,SC2001` line with a reason, because `check()` evals single-quoted conditions that read variables set elsewhere.

**README**
The README is at `/Users/ben/Projects/software-factory-workshop/demo/hop/.agents/loop/README.md`, and an identical copy is in `/Users/ben/Projects/software-factory-workshop/templates/act-10/.agents/loop/README.md`. It covers:
- what the loop does and every env var;
- the other-harness table (Claude, Codex, Gemini, Cursor);
- each guard, why it exists and its exit code, with the failure modes (runaway cost, thrashing, context rot, silent wrong work) and the ralphloop.sh and ghuntley.com/ralph links;
- the files it writes and the cost hint;
- how to run it overnight in tmux, and how to stop it;
- the two-tier rule: never make the factory the only way to change the factory, keep the manual path working.

I did not paste the README text into this report. If you need it verbatim, read the file at either path.