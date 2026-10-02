# Cursor Free limits and Google Antigravity (researched 2026-10-02)

Marking: [V] = read on a primary page this session. [S] = secondary or community source. [U] = unverified or inferred.
Limits: WebFetch summarises pages with a small model, so quotes are as returned, not byte-checked. Third-party guides are dated by their own claims.

## Q1. Cursor Free (Hobby) limits for the CLI

Bottom line: Cursor does not publish a number for Hobby. The limit is hit on a hidden, small allowance that resets monthly on the billing-cycle date. The CLI shares the account quota with the IDE. The way to see remaining usage and the reset date is `/usage` inside the `agent` TUI, or the Spending tab on the web dashboard.

| Question | Answer | Source |
|---|---|---|
| What Free allows | "Limited Agent requests", Composer access, no card. No number given. | [V] https://cursor.com/pricing (fetched 2026-10-02) |
| Auto on Free | Hobby gets Agent, Chat, Tab on Auto with limited usage. No dollar allowance for Claude/GPT/Gemini. No fixed count published. | [S] https://continuumcode.ai/guides/cursor-free-plan/ (updated Aug 2026, says it cites Cursor's pages) |
| Community-reported numbers | About 50 premium requests and 2,000 Tab completions per month. Old (2025 era) figures, probably stale. [U] | [S] https://eastondev.com/blog/en/posts/dev/20260110-cursor-free-quota-guide/ |
| Docs pricing page | Lists Start (India), Pro $20, Pro Plus $60, Ultra $200, Teams, Enterprise. Does not mention Hobby at all. Two pools (Cursor Models, Other Models), "each resetting with your monthly billing cycle". Auto bills at the routed model's list price. | [V] https://cursor.com/docs/account/pricing (2026-10-02) |
| Reset | Monthly, on the account billing cycle, not the calendar month. Unused does not roll over. For a Free account with no subscription the anchor is [U], most likely the signup date. No source states it for Free. | [V] https://cursor.com/help/models-and-usage/usage-limits ("Usage resets monthly with your billing cycle. Unused usage does not roll over."); [S] https://continuumcode.ai/guides/cursor-hit-usage-limit/ |
| Not daily, not rolling | No source says Free resets daily. One forum user says limits reset "every two days to monthly"; anecdotal. | [S] https://forum.cursor.com/t/youve-hit-your-usage-limit-no-slow-coding-agents-anymore/149845 (Jan 2026 thread) |
| CLI shares IDE quota | Yes. The CLI uses the same subscription and usage pool. No separate CLI allowance. The source predates 2026 (mentions Opus 4.1) and its claim "CLI cannot access Auto" looks outdated. Your own run used `--model auto` and worked until the limit. | [S] https://userjot.com/blog/cursor-cli-pricing-hidden-costs via search summary. Not confirmed on a Cursor page. [U] |
| See usage / reset date | CLI: `/usage` slash command in the interactive `agent` TUI. Changelog 2026-07-13: "`/usage` now shows your account's included-usage meters with Auto and API breakdowns, on-demand spend against your limit, plan name, and billing-cycle reset date." The word "now" means an earlier basic version existed. | [V] https://cursor.com/docs/cli/changelog (2026-10-02). Note: the slash-command reference page https://cursor.com/docs/cli/reference/slash-commands did not list `/usage` when fetched. Test it locally. |
| Dashboard | Spending tab on the Cursor dashboard "shows real-time usage for both pools, remaining allowance, and any on-demand charges". Also editor settings. | [V] https://cursor.com/help/models-and-usage/usage-limits ; https://cursor.com/docs/account/pricing |
| Meter is unreliable on Free | Users report the Plan and Usage meter shows about 50 to 60 percent while the limit has already fired. A Cursor reply said it "underreports usage on the Free plan". I could not re-find that staff post; the quote came via a search summary. [U] | [S] search result for https://forum.cursor.com/t/youve-hit-your-usage-limit-still-after-setting-my-key/150496 |
| Auto no longer unlimited | Users in Dec 2025 report Auto triggers limits after the Aug 2025 pricing change. No staff statement in the thread. | [S] https://forum.cursor.com/t/you-ve-hit-your-usage-limit/145649 |

Interpretation for your 25 runs: Free agent allowance is small and shared. About 25 short headless runs exhausting it is plausible, and each headless run does a full agent turn with tool calls, so it may cost more than "one request". [U] The error text does not say which pool fired. The cheapest diagnostic is `agent` then `/usage`, which shows the reset date.

Guide implications:
- Say Free is a trial-sized allowance with no published number, resets monthly on the billing-cycle date, shared between IDE and CLI.
- Tell attendees to run `/usage` before a loop run, and budget Free for roughly one or two short exercises, not a day of work. [U on the exact count]
- Cursor tab should say a Pro plan (or on-demand spend) is needed for the unattended loop act.
- Not verified here: whether `/usage` works for a Free account in agent 2026.10.01, and the Free reset anchor date. Both are one-minute local tests.

## Q2. Google Antigravity and Antigravity CLI

### Facts (as of 2026-10-02)

| Topic | Finding | Source |
|---|---|---|
| What it is | Three surfaces on one engine: Antigravity 2.0 desktop app (agent manager), an IDE, and the Go-built terminal agent `agy` (Antigravity CLI). Closed source. | [S] https://innfactory.ai/en/ai-harness/antigravity/ (updated 2026-09-20); https://dev.to/arindam_1729/antigravity-cli-a-hands-on-guide-to-googles-terminal-coding-agent-5bc7 |
| Replaces Gemini CLI | Gemini CLI deprecated for individuals 2026-06-18. | Your sources: https://docs.cloud.google.com/gemini/docs/codeassist/release-notes ; https://github.com/google-gemini/gemini-cli/discussions/27274 (not re-fetched). Also [S] https://www.danilchenko.dev/posts/antigravity-cli-vs-claude-code/ |
| Install | macOS/Linux: `curl -fsSL https://antigravity.google/cli/install.sh \| bash`. Windows: PowerShell script. Binary is `agy`. Sign-in is browser OAuth. On SSH/headless it prints a URL plus one-time code. | [S] innfactory (above); dev.to (above) |
| Platforms | macOS, Linux, Windows. Sandbox uses Linux namespaces on macOS/Linux; on Windows only approval rules. | [S] innfactory |
| Pricing | Individual plan $0/month, "basic weekly rate limits". Google AI Pro and Ultra add limits plus an AI credit pool. Enterprise from $30/seat/month via Google Cloud. | [V] https://antigravity.google/pricing (2026-10-02) |
| Free tier reality | Reports of 5 requests then a one-week refresh (issue dated 2026-05-21, open, no Google reply). Reports of 429s and lockouts up to 7 days. Free tier described as evaluation-only. A July credit top-up model was added, meter "can't be trusted". | [V] https://github.com/google-antigravity/antigravity-cli/issues/79 ; [S] https://usagebar.com/blog/antigravity-pricing-and-rate-limits (2026-08-28) ; [S] danilchenko (above). The "20 agent requests per day" figure is [U] (search summary only). |
| Token overhead | 23k to 25k tokens per request on system prompt and tool setup; Pro quota gone in about 2 hours. Google said "actively being worked on" on 2026-07-05. | [V] https://github.com/google-gemini/gemini-cli/discussions/27307 |
| Models | Pricing page lists Gemini 3.8 Flash, Gemini 3.1 Pro, Claude Sonnet and others. Free tier shows "Gemini and Claude variants". Third-party notes Claude/GPT-OSS depend on plan; enterprise is Gemini only. No provider-agnostic endpoint. | [V] pricing page; [S] innfactory |
| AGENTS.md | Yes. Reads `AGENTS.md` (or `GEMINI.md`) at workspace root. | [V] https://antigravity.google/docs/cli/best-practices/ |
| Skills | Yes. Markdown skills become slash commands (`.agents/skills/`). Plugins bundle skills, agents, rules, MCP servers, hooks. Exact skill file format not checked against the SKILL.md standard. [U] | [V] https://antigravity.google/docs/cli/features/ ; [S] realpython/dev.to search summaries |
| Hooks | Yes. Events: PreToolUse, PostToolUse, PreInvocation, PostInvocation, Stop. JSON on stdin/stdout. PreToolUse `decision: "deny"` hard-blocks. Config: `.agents/hooks.json` (workspace), `~/.gemini/config/hooks.json` (global), plugins. Matcher e.g. `run_command`. | [V] https://antigravity.google/docs/hooks/ |
| Hook bug | Open bug 2026-09-19: in headless mode a PreToolUse `allow` is ignored; only `deny` works. Blocking a command (the workshop need) still works. | [V] https://github.com/google-antigravity/antigravity-cli/issues/1053 |
| Git hooks | Plain git hooks are independent of the harness; not Antigravity specific. | n/a |
| MCP | Yes, `/mcp`, config at `~/.gemini/config/mcp_config.json`. | [V] features page; [S] computingforgeeks search result |
| Subagents / parallel | Yes. Async subagents, `/agents` panel, custom subagents (https://antigravity.google/docs/subagents/). Subagents can use an isolated git worktree. Parallel subagents drain quota faster. | [V] features page; [S] search summary of subagents docs and https://www.codeagentswarm.com/en/guides/antigravity-agent-swarm |
| Headless | `agy -p "prompt"` (aliases `--print`, `--prompt`). `--output-format text\|json\|stream-json`. JSON envelope has `conversation_id`, `status`, `response`, `duration_seconds`, `num_turns`, `usage`. `--json-schema`, `--continue`, `--conversation ID`, `--model`, `--effort`, `--agent`, `--print-timeout` (default 5m), `--input-format stream-json`. Exit 0 on success. Tools needing approval are soft-denied unless allowed in `~/.gemini/antigravity-cli/settings.json` (`permissions.allow`, e.g. `command(git)`) or `--dangerously-skip-permissions`. | [V] https://antigravity.google/docs/cli/headless/ |
| Config-dir isolation | CLI state lives in fixed `~/.gemini/antigravity-cli/` plus shared `~/.gemini/config/`. I found no documented env var to relocate it. Workaround: run with a different `HOME`. [U, untested] Note it shares `~/.gemini` with the old Gemini CLI. | [S] computingforgeeks search results; [V] hooks doc for paths |
| Maturity | Changelog at 1.2.15; frequent releases (1.2.0 remote control, 1.2.14 queued messages). Android/Termux builds. Fast-moving. Many third-party wrapper plugins already exist. | [V] https://github.com/google-antigravity/antigravity-cli/blob/main/CHANGELOG.md |
| Reviewer verdict | "Antigravity CLI only if you're already invested in Google's ecosystem". | [S] https://www.danilchenko.dev/posts/antigravity-cli-vs-claude-code/ |

Not found: HN threads (search returned none usable). No Reddit read. Not run locally: nothing here was installed or executed, so none of this is "proven in demo/".

### Fit against the workshop's needs

- Headless loop: met. `-p`, JSON output, schema output, resume, exit codes, permission allow-list. This is on par with the other tabs.
- Harness-agnostic acts (AGENTS.md, skills, hooks, MCP, worktrees, subagents): all present, with Antigravity-specific file locations (`.agents/`, `~/.gemini/...`).
- Adversarial review on another model: it offers Gemini and Claude, which is useful. Claude via Antigravity on Free is [U].
- Cost for attendees: weak. Free tier is the problem that pushed people off Gemini CLI. Reports of 5 requests and week-long lockouts would break a two-day workshop for anyone on Free. Cursor Free has a similar problem, so neither is a safe free path. Claude Code needs a paid plan anyway.
- Stability: open bug on headless hook allow; token overhead being fixed; changelog moving weekly. Instructions written today may rot within weeks.
- Isolation: no documented config-dir override, awkward for a workshop where attendees may have personal Gemini/Antigravity state.

### Recommendation

Replace the Gemini CLI tab with an Antigravity CLI tab. Do not replace Claude Code, and do not add a fifth tab. Reasons:
1. Gemini CLI no longer serves individuals, so that tab is dead weight for most attendees. The successor is the direct replacement and keeps `~/.gemini`, AGENTS.md and `-p`.
2. Claude Code stays the worked path because it is the one proven in `demo/`. Antigravity has nothing proven here yet.
3. A fifth tab adds maintenance for a tool with weekly changes. A swap keeps the count at four.
4. Mark the tab as written from docs, untested, until someone runs it. Better: run a short pass in `demo/` first (install, `agy -p --output-format json`, a PreToolUse deny hook, a worktree subagent) and only then write the tab.
5. Put a cost warning on the tab: Free is evaluation-sized and can lock out for days; budget for Pro or credits, or have attendees use Claude/Codex for the loop act.

Wait-and-see alternative if no one can test before the workshop: keep the Gemini CLI tab text but add a banner pointing to Antigravity CLI (`agy`), and list the three known problems above.

## Sources by date

- https://cursor.com/pricing, https://cursor.com/docs/account/pricing, https://cursor.com/help/models-and-usage/usage-limits, https://cursor.com/docs/cli/changelog : fetched 2026-10-02
- https://antigravity.google/pricing, /docs/cli/headless/, /docs/cli/features/, /docs/cli/best-practices/, /docs/hooks/ : fetched 2026-10-02
- https://github.com/google-antigravity/antigravity-cli (CHANGELOG, issues 79 and 1053) and https://github.com/google-gemini/gemini-cli/discussions/27307 : fetched 2026-10-02
- Third-party guides as cited per row, dates as stated in the table.
