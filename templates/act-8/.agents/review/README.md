# Review

Review here is a model you own, not a service you rent. A reviewer on a
different model from the one that wrote the code reads only the diff, the
spec and a rubric. It has no memory of writing the code. Every miss becomes
a line in the rubric, so the reviewer gets better at reviewing this code.

## The pieces

| File | Job |
|---|---|
| `rubric.md` | The numbered checks, plus Lessons learned from misses |
| `reviewer.md` | The reviewer's instructions. Any harness can load it |
| `challenger.md` | The challenger's instructions: argue against merging and against an earlier review |
| `../skills/review-loop/SKILL.md` | What the implementer does with a review, and the 3-round limit |
| `.claude/agents/reviewer.md` | Claude Code subagent that loads `reviewer.md` |
| `.codex/agents/reviewer.toml`, `.gemini/agents/reviewer.md`, `.cursor/agents/reviewer.md` | The same for Codex, Gemini CLI and Cursor. Gemini tested with Gemini CLI 0.62.0 (loads after acknowledgement); the others see the guide |
| `bin/second-opinion.mjs` | Optional cross-vendor review through OpenRouter |
| `openrouter-usage.jsonl` | One line per OpenRouter call: tokens and cost. Committed, it is the cost record |

## Pick a different model

The reviewer must run on a different model from the implementer. Set it in
the agent file:

- Claude Code: `model:` in `.claude/agents/reviewer.md` (`sonnet`, `opus`,
  `haiku`, `fable` or a full id). It ships as `opus`, because implementers
  are `sonnet` from act 9; if your implementer runs on Opus, change it.
- Codex: `model = "..."` in `.codex/agents/reviewer.toml`, with the prompt
  in `developer_instructions`.
- Gemini CLI: `model:` in `.gemini/agents/reviewer.md`.
- Cursor: `model:` in `.cursor/agents/reviewer.md` (`agent models` lists ids).

## Run the reviewer

Ask your harness: "Use the reviewer agent to review PR 3, change
reserved-codes." Or headless:

```
claude -p "Use the reviewer subagent to review PR 3, change reserved-codes"
codex exec "Spawn the reviewer agent to review PR 3, change reserved-codes"
gemini -p "@reviewer review PR 3, change reserved-codes"
agent -p "Use the reviewer subagent to review PR 3, change reserved-codes"
```

The reviewer posts with `gh pr review <n> --comment` and comments the
verdict on the ticket as `reviewer`.

## Two roles

`bin/second-opinion.mjs --role review|challenge` runs one of two roles, and
they run on different models on purpose. Different vendors train on
different data with different weights, so they bring different lenses: what
one model finds ordinary, another finds odd. The reviewer (default
`openai/gpt-5.6-sol`) judges the PR against the rubric. The challenger
(default `z-ai/glm-5.3`, `challenger.md`) exists to disagree: it looks for
what a reviewer would miss or wrongly pass, makes the strongest case
against merging, and says plainly where an earlier review is wrong. Give it
that review with `--against <file>`. Both print the same `VERDICT` and
`SCORE` lines, so the two results compare.

```
node bin/second-opinion.mjs --pr <n> --role review --out review.md
node bin/second-opinion.mjs --pr <n> --role challenge --against review.md --out challenge.md
```

## Second opinion through OpenRouter (optional)

```
export OPENROUTER_API_KEY=...        # never commit it, never put it in a file here
node bin/second-opinion.mjs --pr <n> [--role review|challenge] [--against review.md] [--model openai/gpt-5.6-sol] [--change reserved-codes] [--out review.md]
```

It sends `reviewer.md`, the rubric, `AGENTS.md`, `DEFINITION_OF_DONE.md`,
the PR body, the change's OpenSpec files and `gh pr diff` to one model,
prints the review and appends tokens, cost and role to `openrouter-usage.jsonl`.
It posts nothing; paste it into the PR yourself if it earns it. Add the
cost to the workshop ledger with
`node ../software-factory-workshop/tools/ledger/ledger.mjs --openrouter .agents/review/openrouter-usage.jsonl`, run from the repo folder.

## One subscription is enough

Most people have one subscription. The baseline is the in-harness reviewer
on a different model of the same vendor (Sonnet reviewing Opus work, for
example). OpenRouter is optional: it adds a reviewer from another vendor,
for a few cents a review.
