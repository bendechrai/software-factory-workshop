# Cost tracking, as done in the aviation project

Sources: conversation log c7946a6f-1a36-4a60-b2cd-89a8bd692119.jsonl (6263 lines, 2026-10-01 to 2026-10-02 UTC), its subagents/ folder (98 files = 49 transcripts + 49 meta.json), the repo /Users/ben/Projects/aviation, and the project memory folder. All timestamps UTC as stored in the log. Only one top-level .jsonl exists in the project folder.

## 1. What Ben said (exact words)

The tally was asked for in one message, then refined in three more. Nothing else in the log is about cost tracking apart from the memory-worthy comment on Fable spend.

1. 2026-10-02T02:14:39Z (log line 5603), the original ask:
   "Onthe html page, can you keep a tally of the tokens sent, received and the cost since we started this repo? Find a way to optimise this by maybe caching the stats rather than having to grep the whole conversation each time."

2. 2026-10-02T02:38:58Z (line 5996), after the first tally showed Fable at about $169 of $190:
   "Remember that all work should be done by subagents using an LLM model appropriate for the work done. You are using fable and are an orchestrator and communicate with humans. You do not perform grunt work at your hourly rate.  Fable usage seems high, but that might be cos we did lots of specs"
   (Saved to memory as orchestrate-do-not-do-grunt-work.md.)

3. 2026-10-02T02:42:26Z (line 6053), after the OpenRouter review tool was requested:
   "I don't see any openrouter usage yet"

4. 2026-10-02T02:53:50Z (line 6179), subscription conversion:
   "If it's possible, if you have the ability to convert the stats that we have per model for spend and work out what percentage of a max 200 subscription that would represent if it's possible to work out an additional column so that we can show API cost and subscription cost, that'd be fantastic. But I don't know how accurately you can do that. Maybe you can do some research to see how others have done this. In general, I've found reports that API pricing is between something and 36 times the price of subscription pricing. So I just divided the roughly $200 we've spent so far in API list prices by 36 to get a price of $5.55. But I don't know how accurate that is"

5. 2026-10-02T02:56:30Z (line 6239), OpenRouter in the table, and the final column design (this is the decision):
   "I see you're now starting to use open router so I would like to include any token in out tallies and cost in the table for those in that situation we are using API pricing from open router so it doesn't make sense to have a conversion for that in which case what we actually need is a column for API cost, a column for subscription cost, and then maybe a column for actual cost, which for Claude would be the subscription value, for open router would be the API value, and then the tally at the bottom of actual cost would be the actual total cost"

Related context: 2026-10-02T01:31:45Z "Would you like zai/openai/openrouter models for adversatial or committee agentic agents?"; 01:38:04Z "continue. OPENROUTER_API_KEY is in .env"; 01:39:00Z "YOu can still use subagents - I switched claude subscription so you have quota again". Ben also said at 2026-10-02T01:29:24Z to keep a static html status file ("for-ben.html") in the repo, which is where the tally is displayed.

Decisions:
- Show the tally on for-ben.html, cache stats, do not re-scan the whole log.
- Table columns: API cost, Subscription cost, Actual cost. Actual = subscription cost for Claude rows, API cost for OpenRouter rows; bottom row is the real total.
- OpenRouter is paid at API price, so no subscription conversion for it.
- Subscription share is explicitly an estimate; Ben's own 36x figure was offered as a data point.

## 2. What was built (all in /Users/ben/Projects/aviation)

Commits (git log -- tools): b5dcdbc "a tally of tokens sent and received and their list-price cost, cached per transcript"; c4a10b2 "subscription-equivalent cost beside API list price"; 3eb3b4f "OpenRouter spend in the tally, with API, subscription and actual cost"; 8842ddb added the OpenRouter second-opinion tool.

Files:
- tools/usage-tally.mjs (222 lines): the tally. Run `node tools/usage-tally.mjs [--print]`. CLAUDE.md tells agents to run it before updating for-ben.html.
- for-ben.html: has `<!-- usage:start -->` / `<!-- usage:end -->` markers; the script rewrites everything between them with a table.
- for-ben/usage-cache.json (git-ignored via `for-ben/`): `{files: {path: {offset}}, messages: {msg_id: {model,input,cacheWrite,cacheRead,output}}}`. A warm run reads only bytes appended since the stored byte offset per file (1319 message ids cached at inspection). If a file shrinks, its offset resets to 0.
- for-ben/openrouter-usage.jsonl: one line per OpenRouter call (see section 3).
- for-ben/openrouter-backfill.json: `{"note":"OpenRouter total key usage (GET /api/v1/key) on 2026-10-01 before logging began; no per-model or token breakdown available","cost":0.17674856}`.
- tools/second-opinion.mjs and tools/second-opinion.config.json: the OpenRouter caller.

How it scans: every `.claude` and `.claude-*` dir in $HOME (ben has ~/.claude-b, which is the same data), project key `-Users-ben-Projects-aviation`, recursively every *.jsonl (so main log plus subagents/ transcripts).

Price table (USD per million tokens, "Anthropic first-party list prices, cached 2026-09-25", cache write = 1.25x input):

| model | input | cache write | cache read | output |
|---|---|---|---|---|
| claude-fable-5-1 | 10 | 12.5 | 0.25 | 50 |
| claude-opus-5-5 | 4 | 5 | 0.2 | 20 |
| claude-sonnet-5-5 | 2 | 2.5 | 0.2 | 10 |
| claude-haiku-4-5 | 1 | 1.25 | 0.1 | 5 |

(Caveat to check: the script uses cacheWrite = 1.25x input, i.e. the 5-minute rate, for all cache writes. The log shows the 1h cache tier is what Claude Code mostly uses, e.g. ephemeral_1h_input_tokens 24808 and 5m 0 in the sample, and 1h writes are normally priced higher, 2x input. The 5m/1h split is in the log but the script ignores it, so API cost for cache writes is probably understated. Also the 0.25 cache-read price for Fable is 0.025x input, while others are 0.05x; unverified.)

API cost formula per message: (input*P.input + cacheWrite*P.cacheWrite + cacheRead*P.cacheRead + output*P.output) / 1e6, summed per model. "Tokens sent" = input + cache write + cache read; "received" = output.

Subscription-equivalent formula:
- PLAN_PRICE = 200 (Claude Max 20x, $/month); MAX_MONTHLY_API_EQUIVALENT = 2200 (API-list-price dollars a Max subscriber can consume per month, an estimate).
- subscription cost = apiCost / 2200 * 200, i.e. about 9.1% of API list price. Shown as "$X (Y% of one month)".
- Basis for 2200: Ten Invent blog, Sep 2026, ccusage logs on Max 20x, August 2026 = $2,170 at list prices (38 days / 26 active days = $3,203 at 5m cache pricing, $3,657 at 1h pricing). Other data points in the code comment: ksred Feb 2026 (Max 5x; July 2025 $5,623, about $15,000 over 10 months); Reddit titles "$200 subscription vs $7,470 of API usage" and "up to 36x cheaper" (about $7,200/month, secondhand, called a ceiling guess); cloudzero 2026 blog "about $3,650 a month at full Max 20x" (unsourced). Anthropic publishes no token allowance, so this is an estimate. Measured months imply 11x-16x, Ben's 36x implies $7,200/month and about $5.80 for the project. The assistant told Ben the honest range was roughly $6 to $19 so far and the page shows the $19 end. Raising the constant toward 7200 shrinks the share.
- Actual cost = subscription share for Claude rows; OpenRouter rows use what OpenRouter charged.

Results reported to Ben at 2026-10-02T02:57:38Z (line 6260): total actual about $19.28 ($19.10 Claude subscription share + $0.18 OpenRouter); same tokens at API list price $210.29. Fable 5.1 $178.18 API / $16.20 sub; Opus 5.5 $27.43 / $2.49; Sonnet 5.5 $4.50 / $0.41.

Cross-check available: the main log contains a single `cost-state` line written by Claude Code itself with totalCostUSD 185.26 and a per-model modelUsage block (see section 4). Its figures (Fable 172.91, Opus 9.51, Sonnet 2.84, Haiku 0.0012) are the harness's own cost estimate and could be used to validate the price table. It appeared once in the file at the time of inspection and may only cover part of the session, so treat as a sanity check, not a source of truth.

Table columns on the page: Model, Calls, Input, Cache write, Cache read, Output, API cost, Subscription cost, Actual cost; rows sorted by actual cost; OpenRouter rows show "-" for cache and subscription columns.

## 3. How OpenRouter usage was captured

tools/second-opinion.mjs calls OpenRouter chat completions (commands: `review --diff <range>`, `challenge <finding.md>`, `ask "<q>" [files]`) using OPENROUTER_API_KEY from .env (git-ignored). Models in tools/second-opinion.config.json: review = openai/gpt-5.6-sol, challenge = z-ai/glm-5.3 (chosen 2026-10-01 from https://openrouter.ai/api/v1/models, no Anthropic models). After every call, logUsage() appends to for-ben/openrouter-usage.jsonl:

    {"ts":"2026-10-02T02:57:20.424Z","id":"gen-...","model":"openai/gpt-5.6-sol","promptTokens":55,"completionTokens":5,"cost":0.00016,"command":"ask"}

fields come from the response: `data.usage.prompt_tokens`, `completion_tokens`, `cost` (OpenRouter returns the dollars charged in usage.cost), `data.id`, `data.model`. Logging is wrapped in try/catch so it never fails a call. usage-tally.mjs reads that file and makes one table row per OpenRouter model (apiCost = sum of cost, actual = apiCost, no subscription). Calls made before logging existed are a single row "OpenRouter (before logging)" using the key-level total from GET /api/v1/key ($0.1767 on 2026-10-01), with no tokens or per-model split. The jsonl had only one line when inspected (the "ask" smoke test), so real review/challenge calls after that will accumulate.

## 4. Claude Code log schema for usage

Location and layout:
- Main session transcript: ~/.claude/projects/<project-path-with-slashes-as-dashes>/<sessionId>.jsonl (here ~/.claude/projects/-Users-ben-Projects-aviation/c7946a6f-....jsonl). ~/.claude-b appeared to mirror the same data (identical sizes/timestamps); the tally script scans all ~/.claude* dirs, which could double count if they are separate copies rather than links (the cache keys by message id, so duplicates collapse anyway).
- Subagent transcripts: <sessionId>/subagents/agent-<agentId>.jsonl plus agent-<agentId>.meta.json, e.g. {"agentType":"general-purpose","description":"Emulator task 21 viewer","toolUseId":"toolu_...","spawnDepth":1,"requestShape":"background","requestNonInteractive":true,"model":"opus"}. Note the meta `model` is a short alias (opus/sonnet/haiku/fable), whereas message.model inside the transcript is the full id (claude-opus-5-5, claude-sonnet-5-5). 773 subagent message ids here: 1056 opus + 320 sonnet usage lines.
- Sidechain marking: every line in subagent files has `"isSidechain": true` plus `"agentId"` and `"attributionAgent"` (agent type); main-session lines have `isSidechain: false`. Subagent message ids never overlapped main-session ids in this data (0 overlaps), so summing main + subagents does not double count.
- Large tool outputs go to <sessionId>/tool-results/*.txt.
- Line types seen in main log: assistant, user, attachment, system, queue-operation, last-prompt, ai-title, mode, permission-mode, pr-link, frame-link, file-history-snapshot, cost-state, etc. Only `assistant` lines carry `message.usage`. Some are `"model":"<synthetic>"` (harness-generated, zero or placeholder usage; the tally skips unknown models).

Where each datum lives (on an `assistant` line):
- model: `message.model` (full id, e.g. "claude-fable-5-1"). Also top-level `advisorModel`, `effort`.
- input tokens: `message.usage.input_tokens` (uncached input only; often just 2-ish because everything else is cached)
- output tokens: `message.usage.output_tokens` (includes thinking; `output_tokens_details.thinking_tokens` gives the thinking part)
- cache write: `message.usage.cache_creation_input_tokens`, split in `message.usage.cache_creation.ephemeral_5m_input_tokens` and `.ephemeral_1h_input_tokens` (the two sum to the total)
- cache read: `message.usage.cache_read_input_tokens`
- also: `service_tier`, `speed`, `server_tool_use.{web_search_requests,web_fetch_requests}`, `iterations[]` (per-iteration copy of the same counters), `inference_geo`, `fallback_credit`.
- ids and time: `message.id` (msg_...), top-level `requestId` (req_...), `uuid`, `parentUuid`, `timestamp` (ISO UTC), `sessionId`, `version`, `cwd`, `gitBranch`.

Redacted example (one real line, content blanked):

    {"parentUuid":"244bc9c4-...","isSidechain":false,
     "message":{"model":"claude-fable-5-1","id":"msg_011CfaqVThU7hvsXBCT1wbD3","type":"message","role":"assistant",
       "content":[{"type":"thinking","thinking":"","signature":"<redacted>"}],
       "stop_reason":"tool_use",
       "usage":{"input_tokens":2,"cache_creation_input_tokens":24808,"cache_read_input_tokens":25653,"output_tokens":715,
         "output_tokens_details":{"thinking_tokens":629},
         "server_tool_use":{"web_search_requests":0,"web_fetch_requests":0},
         "service_tier":"standard",
         "cache_creation":{"ephemeral_1h_input_tokens":24808,"ephemeral_5m_input_tokens":0},
         "inference_geo":"not_available",
         "iterations":[{"input_tokens":2,"output_tokens":715,"cache_read_input_tokens":25653,"cache_creation_input_tokens":24808,"type":"message"}],
         "speed":"standard","fallback_credit":null}},
     "requestId":"req_011CfaqVTFw9S4uKwXvXPFZE","apiBlockIndex":0,"type":"assistant","uuid":"dab42e86-...",
     "timestamp":"2026-10-01T03:51:02.843Z","advisorModel":"claude-fable-5-1","effort":"high",
     "sessionId":"c7946a6f-...","userType":"external","entrypoint":"cli","cwd":"<cwd>","version":"2.1.286","gitBranch":"HEAD"}

cost-state line (harness's own running total, appears in the main log):

    {"type":"cost-state","sessionId":"...","totalCostUSD":185.256,"totalAPIDuration":14949143,"totalDuration":78535901,"startTime":1790826512140,
     "modelUsage":{"claude-fable-5-1":{"inputTokens":6537,"outputTokens":1337467,"thinkingTokens":473315,"cacheReadInputTokens":214345956,"cacheCreationInputTokens":2619056,"webSearchRequests":0,"costUSD":172.906}, ...},
     "hasUnknownModelCost":false}

De-duplication rule:
- Yes, the same message.id repeats across lines: one line per content block (thinking, text, each tool_use) of the same API response. Main log: 1250 usage lines for 566 distinct ids (1 line for 130 ids, up to 9 lines for one id). Subagents: 1383 lines for 773 ids.
- In the main log all duplicate lines had identical usage. In subagent logs 45 ids had differing usage between lines, and in the samples the only field that differed was output_tokens (streaming snapshots: e.g. 8 then 165, or 33,33,...,475) while input/cache fields were identical. So the correct rule is: group by message.id and take the per-field MAX (equivalently the last line for that id); never sum lines. The aviation script does exactly this (Math.max per field keyed by message.id).
- Do not key on requestId alone without checking; message.id worked cleanly. Ids were also unique across main and subagent files here. Skip `<synthetic>` model entries.
- Per-call cost, if wanted to honour the cache tier split: input*P.in + ephemeral_5m*P.in*1.25 + ephemeral_1h*P.in*2 + cache_read*P.cacheRead + output*P.out (the 1h multiplier is my assumption of Anthropic's published rate; verify before relying on it).

## 5. Open questions and not done

- The cache-write price: the aviation script prices all cache writes at 1.25x input and ignores the 5m/1h split, although the log shows mostly 1h writes. Fix needed for accuracy; also verify each model's price row (the table was "cached 2026-09-25" and includes fictional-looking future models, so it should be refreshed from Anthropic's pricing page).
- MAX_MONTHLY_API_EQUIVALENT = 2200 is a weak estimate (a single heavy user's month). Reported range was $6 (36x, ~$7,200) to $19 (~$2,200). No decision from Ben on which to use; the page currently uses 2200. Ben floated 36x himself ("I don't know how accurate that is").
- The subscription share is a share of one month at one plan size (Max 20x, $200). It ignores weekly limits, switching accounts (Ben said at 01:39Z "I switched claude subscription so you have quota again"; the ~/.claude vs ~/.claude-b dirs likely reflect two accounts or a symlink; unresolved, and costs from two subscriptions would mean more than one plan fee).
- The tally is per project (hard-coded PROJECT_KEY) and counts all time since the repo started, not per day/month; no time slicing, no per-agent-role breakdown (the log has attributionAgent/agentType and meta description, so per-task cost is feasible), no per-day proration of the monthly fee.
- OpenRouter: pre-logging spend is only a key-level total with no tokens; reasoning tokens (completion_tokens_details) and cached-token counts are not captured from OpenRouter responses (only prompt/completion tokens and cost). Only one logged call existed at inspection.
- The original statement of what Ben wanted for "which models were used and what it adds up to" is satisfied by the per-model table; nothing was written about long-term retention or a cross-project ledger. The cost-state line was not used by the script and could serve as a reconciliation check against the computed $ totals (script total for Claude was 210.29 - 0.18 = about 210.11 API vs harness 185.26 at its snapshot time, so a gap exists that has not been explained, perhaps the snapshot is earlier, price differences, or cache-write pricing).
- ccusage (the tool) was only cited as a data source for others' figures; it was not installed or run.
