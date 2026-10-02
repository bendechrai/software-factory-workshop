# ledger

A small, dependency-free cost ledger for Claude Code transcripts. Node 24+, no npm packages.

It answers: what would the tokens in these sessions cost at Anthropic API list prices, split by model, day, session or agent, with subagents counted and cache writes priced at the right TTL.

## What it reads

- Claude Code project directories: `${CLAUDE_CONFIG_DIR:-~/.claude}/projects/<absolute-path-with-non-alphanumerics-as-dashes>/`
- Every `*.jsonl` in the project directory (main sessions) and every `<sessionId>/subagents/*.jsonl` (subagent transcripts, with `agent-<id>.meta.json` supplying the agent type)
- Only `assistant` lines that carry `message.usage`. `<synthetic>` messages are skipped.
- Optionally an OpenRouter usage file (`--openrouter`).

Rules:

- De-duplication: Claude Code writes one line per content block of the same API response, with the same `message.id`. The ledger keeps one record per message id and takes the maximum of each usage field (streaming snapshots only grow). It never sums duplicate lines.
- Cache writes: `usage.cache_creation.ephemeral_5m_input_tokens` and `ephemeral_1h_input_tokens` are priced at their own rates. If a message has no split, all its cache writes are priced at the 5-minute rate and the output says how many messages that happened for.
- Main vs subagent: a message is a subagent message if it came from a `subagents/` file, has `isSidechain: true`, or has an `agentId`. The agent type comes from the meta file (falling back to `attributionAgent`).
- Unknown models are never silently zero: they show as `<model> (UNPRICED)`, their tokens are counted, their cost is $0, and a WARNING line is printed.
- Prices: `prices.json` (USD per million tokens: input, 5m cache write, 1h cache write, cache read, output) with `source` and `checked`. The longest model-id prefix wins, and only an exact id or a `-YYYYMMDD` / `@YYYYMMDD` dated id matches (so `claude-opus-4-9` is unpriced, not priced as `claude-opus-4`). Standard rates only: batch, fast mode and `inference_geo: us` (1.1x) are not modelled.

## Run it

```
node tools/ledger/ledger.mjs                       # current repo's project, grouped by model
node tools/ledger/ledger.mjs --by agent            # main vs each subagent type
node tools/ledger/ledger.mjs --by day --since 2026-10-01
node tools/ledger/ledger.mjs --all-projects --markdown
node tools/ledger/ledger.mjs --project ~/.claude/projects/-Users-ben-Projects-aviation \
  --openrouter ../aviation/for-ben/openrouter-usage.jsonl --json
node --test tools/ledger/                          # tests
```

## Flags

| Flag | Meaning |
| --- | --- |
| `--project <dir>` | A Claude Code project directory. Repeatable. Default: the project dir for the current working directory. |
| `--all-projects` | Every project directory under the config dir. |
| `--since <ISO date>` | Only messages at or after this time. |
| `--until <ISO date>` | Only messages before this time (added so a total can be compared with a snapshot taken at a known time). |
| `--session <id>` | Only this session id. OpenRouter rows have no session and are excluded. |
| `--openrouter <file>` | JSONL, one call per line: `model`, `promptTokens`, `completionTokens`, `cost` (USD OpenRouter charged), optional `ts`. Added at the charged cost, shown as `openrouter:<model>`. |
| `--prices <file>` | Use another price file. |
| `--by model\|day\|session\|agent` | Grouping. Default `model`. Non-model groupings add a `models` column. |
| `--json` | JSON output (rows, main-vs-subagent split, total, prices, cache stats). |
| `--markdown` | Markdown tables. |
| `--plan-usd <n>` and `--plan-allowance-usd <n>` | Both required together. Adds a "share of plan" column: API USD / allowance * plan price (Claude rows only). |
| `--cache <file>` | Cache file. Default `./.ledger-cache.json` (git-ignored in this repo). |
| `--no-cache` | Read everything, write no cache. |
| `--help` | Usage. |

## Cache

The cache stores, per transcript file, the byte offset already read, plus one merged record per message id. A later run reads only the bytes appended after the stored offset and only up to the last complete line. A message id seen before is merged (max of each field), never added again, so totals match a cold run. A file that shrinks is re-read from the start. Prices are applied at report time, so editing `prices.json` does not need a cache rebuild. The output footer shows how many bytes were read.

## Subscription estimate caveat

`share of plan` is an estimate. Anthropic publishes no token or dollar allowance for Pro or Max plans, so the figure depends entirely on the `--plan-allowance-usd` you pick. Measured heavy-user months and the 36x folklore figure differ by several times, and the share moves in proportion. Treat it as "what fraction of one month's plan this would be if the allowance were X", not as a bill. It also ignores weekly limits and the fact that one person may pay for more than one plan.

## Cross-checking with ccusage

I ran `npx ccusage@latest` (v20.0.26) on 2026-10-01. It works, takes a few seconds, and fetches pricing online by default. Do not use `--offline` for the new models: its embedded table has no price for `claude-sonnet-5-5` and reports $0 for it. Per-project numbers need `ccusage claude daily -i --json --breakdown` and then picking the project key (the `--project` filter did not match with a short name).

Same project, same moment, per model (USD):

| Project / model | ledger | ccusage |
| --- | --- | --- |
| aviation, claude-fable-5-1 | 201.83 | 201.83 |
| aviation, claude-opus-5-5 | 29.51 | 29.56 |
| aviation, claude-sonnet-5-5 | 4.54 | 4.54 |
| software-factory-workshop, claude-fable-5-1 | 36.22 | 36.22 |

Token columns also match to the digit for Fable (aviation: 3,152,782 cache writes, 264,635,265 cache reads, 1,451,468 output). Small differences on Opus and Sonnet in the workshop project are because that session was still writing between the two runs (the log grew); the aviation Opus gap is a few thousand tokens for the same reason. ccusage prices cache writes with the same 5m/1h split, so agreement is expected. Because both tools read the same files, agreement shows the arithmetic and de-duplication are consistent, not that the prices are right: prices are checked against the pricing page (see `prices.json`).

Claude Code's own `cost-state` line (aviation log, `totalCostUSD` 185.26) is a different kind of check, see the report that came with this tool: its Fable figure matches the ledger once the 1-hour cache price is used.
