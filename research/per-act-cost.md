# Per-act build cost, measured

API-equivalent USD at Anthropic list prices (tools/ledger/prices.json, checked 2026-10-01), from the Claude Code logs of the orchestrating session for this repository. Measured on 2026-10-02 UTC.

## Method

1. Act boundaries are the commit times of the tags act-1 to act-8 in demo/hop, read with `git -C demo/hop log -1 --format=%cI <tag>` (read-only).
2. Act 1 window: from the first timestamp in the session log (2026-10-02T01:45:38Z) to tag act-1. Act N window: from tag act-(N-1) to tag act-N.
3. For each window:

```
node tools/ledger/ledger.mjs --project ~/.claude/projects/-Users-ben-Projects-software-factory-workshop \
  --since <start> --until <end> --no-cache --json
```

4. Recorded the per-model `usd` and the `mainVsSubagents` split from the JSON. Haiku ids with a date suffix are shown as Haiku 4.5.

Tag times (local, -05:00): act-1 21:17:39, act-2 21:25:03, act-3 21:30:25, act-4 21:41:45, act-5 21:58:59, act-6 22:10:28, act-7 22:18:39, act-8 22:46:32, all on 2026-10-01.

## Caveat

These numbers are approximate. Each window holds everything the orchestrating session did in that time, not only the act's build. That includes writing docs, research, the ledger itself, and other acts being worked on at the same time. Read the table as a rough shape, not as the exact price of an act.

## Table

| Act | Window (UTC, 2026-10-02) | Total | Main | Subagents | Subagent share | Fable 5.1 | Opus 5.5 | Sonnet 5.5 | Haiku 4.5 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 01:45 to 02:17 | $15.20 | $7.16 | $8.04 | 53% | $14.83 | $0.22 | $0.15 | $0.00 |
| 2 | 02:17 to 02:25 | $5.16 | $4.15 | $1.02 | 20% | $5.16 | $0.00 | $0.00 | $0.00 |
| 3 | 02:25 to 02:30 | $4.58 | $1.69 | $2.89 | 63% | $4.58 | $0.00 | $0.00 | $0.00 |
| 4 | 02:30 to 02:41 | $5.25 | $1.80 | $3.44 | 66% | $5.25 | $0.00 | $0.00 | $0.00 |
| 5 | 02:41 to 02:58 | $9.24 | $4.11 | $5.12 | 55% | $6.30 | $2.77 | $0.17 | $0.00 |
| 6 | 02:58 to 03:10 | $6.21 | $2.09 | $4.12 | 66% | $0.09 | $3.07 | $3.04 | $0.00 |
| 7 | 03:10 to 03:18 | $2.03 | $0.63 | $1.40 | 69% | $0.00 | $1.72 | $0.31 | $0.00 |
| 8 | 03:18 to 03:46 | $5.97 | $2.99 | $2.98 | 50% | $0.00 | $4.10 | $1.36 | $0.50 |
| Total | 01:45 to 03:46 | $53.63 | $24.62 | $29.01 | 54% | $36.22 | $11.88 | $5.03 | $0.50 |

Rows can differ from the totals by a cent because of rounding. Act windows start at 02:17:39, 02:25:03, 02:30:25, 02:41:45, 02:58:59, 03:10:28 and 03:18:39 UTC and end at the next tag time. Act 8 ends at 03:46:32.

Totals by model, acts 1 to 8: Fable 5.1 $36.22 (68%), Opus 5.5 $11.88 (22%), Sonnet 5.5 $5.03 (9%), Haiku 4.5 $0.50 (1%).

The whole session log at the time of measurement was $55.29, so about $1.66 fell after the act-8 tag.

## What to notice

- Act 2 is the only act where the main session did most of the spend (80%). The orchestrator was still doing work itself.
- Acts 1 to 4 ran almost entirely on Fable. Opus appears in act 5. Act 6 has almost no Fable ($0.09). Acts 7 and 8 have none.
- Fable was 68% of the cost of the first 8 acts, and the cheaper models did most of the later work.
