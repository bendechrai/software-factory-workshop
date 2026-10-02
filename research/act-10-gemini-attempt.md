# Act 10 loop with Gemini CLI: failed attempt, 2026-10-02

Run at 20:45Z (log: `demo/hop/.agents/loop/runs/20261002T204526Z-i1.json.err`).

## What ran

`npx -y @google/gemini-cli --approval-mode yolo -o json -p <prompt>` with a free AI Studio key, Gemini CLI 0.62.0, MAX_ITERATIONS=1. No `-m` flag.

## What happened

- With no `-m`, Gemini CLI chose `gemini-3.1-pro`.
- That model has a free-tier quota of 0. The API answered 429: "Quota exceeded ... free_tier_requests, limit: 0, model: gemini-3.1-pro".
- The harness exited 173 before doing any work.
- The loop logged the failure, hit MAX_ITERATIONS=1 and exited.
- The ticket stayed todo. Nothing in the repo changed.

Earlier the same day the key's daily quota for `gemini-2.5-flash` and `gemini-3-flash-preview` had been used up by tab tests (about 20 requests a day per model), so a Flash model would probably have failed too.

## Fixes

- `HARNESS_CMD` for Gemini now passes `-m <model>` (default in the run script: `gemini-3-flash-preview`).
- Docs say a free key cannot use the default model, and that ~20 requests a day per model will not carry an orchestrator plus subagents through one ticket. A paid key is needed for the loop.

## Status

The loop has not completed a run with Gemini CLI. The guards (log, iteration cap, ticket untouched) were shown to work on this failure.
