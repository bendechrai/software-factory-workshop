# Act 10 real run: the terminal, as the author saw it (2026-10-02)

Started with the run script (dry run first, then a prompt). Harness: Codex CLI through OpenRouter, sandbox off.

```text
ben@laptop hop % bash run-codex-loop.sh
Trust entry:
27:[projects."/Users/ben/Projects/software-factory-workshop/demo/hop"]

== Dry run (calls no harness)
[factory-loop] dry run: no harness will be called
[factory-loop] harness:  npx -y @openai/codex exec --json -C /Users/ben/Projects/software-factory-workshop/demo/hop <prompt from /Users/ben/Projects/software-factory-workshop/demo/hop/.agents/loop/prompt.md>
[factory-loop] limits:   3 iterations, 150 minutes, 30s cool-down, 2 failures in a row
[factory-loop] open tickets: 3, blocked: 0
[factory-loop] guards pass: a real run would start iteration 1

Start the real loop now? [y/N] y
[factory-loop] iteration 1: 3 open tickets, output in /Users/ben/Projects/software-factory-workshop/demo/hop/.agents/loop/runs/20261002T165943Z-i1.json
[factory-loop] iteration 1 finished: exit 0, 0 open tickets
[factory-loop] board empty, exiting
[factory-loop] cost of this loop (run from the repo; put CLAUDE_CONFIG_DIR=~/.claude-workshop in front if you use the sandbox):
[factory-loop]   cd /Users/ben/Projects/software-factory-workshop/demo/hop
[factory-loop]   node "/Users/ben/Projects/software-factory-workshop/tools/ledger/ledger.mjs" --since 2026-10-02T16:59:41Z --by agent
```

Note: the printed cost hint points at the Claude Code ledger, which cannot see Codex or OpenRouter spend; for this run it reported $0. The real cost came from the OpenRouter key's usage (about $4.73). The tooling fix after this run records OpenRouter usage per iteration in loop.log.
