## API KEY OUTCOME (first)

**The API key works with Gemini CLI headless. Free-tier key: PASS, with caveats that contradict the guide.**
- `GEMINI_API_KEY=... npx -y @google/gemini-cli -p "Say ok" -m gemini-2.5-flash` printed `ok`.
- The key is a free-tier key. The 429 said `generate_content_free_tier_requests, limit: 20, model: gemini-2.5-flash`.
- Free keys allow about 20 requests per day per model, not "250 requests a day" (before-you-arrive.mdx:38). Each model has its own bucket. I hit the cap on `gemini-2.5-flash` and then `gemini-3-flash` after about 20 calls each. The 429 text is "TerminalQuotaError: You have exhausted your daily quota on this model. Please retry in 5h46m...".
- Free keys have no access to `gemini-3.1-pro`: limit 0 for both requests and input tokens.
- `gemini-2.5-pro` fails with 404: "This model models/gemini-2.5-pro is no longer available to new users." Both templates in `.gemini/agents/*.md` (implementer and reviewer) name `gemini-2.5-pro`. They cannot run for a new key, free or probably paid.
- The calls that worked on this key: `gemini-2.5-flash`, `gemini-3-flash-preview`, `gemini-3.1-flash-lite-preview`, `gemini-flash-latest`. `gemini-2.5-flash-lite` gave 404.
- 503 "high demand" errors were frequent on 2.5-flash and 3.1-flash-lite. The CLI retries and usually succeeds.
- The guide is wrong that a free key is "250 requests a day".
- A workshop run on free keys will hit the cap fast, because each agent turn is several requests.

Version: **gemini-cli 0.62.0** (`npx -y @google/gemini-cli`).
Models used: gemini-2.5-flash, gemini-3-flash-preview, gemini-3.1-flash-lite-preview (most tests).

Additional auth findings:
- **Folder trust (not in the guide):** headless in an untrusted folder aborts with "Gemini CLI is not running in a trusted directory. To proceed, either use `--skip-trust`, set `GEMINI_CLI_TRUST_WORKSPACE=true`, or trust this directory in interactive mode." I used `GEMINI_CLI_TRUST_WORKSPACE=true`.
- **Stale sign-in setting:** the failed Google sign-in left `security.auth.selectedType` = `oauth-personal` in the sandbox settings.json. With that value, even with `GEMINI_API_KEY` set, headless fails with `IneligibleTierError: This client is no longer supported for Gemini Code Assist for individuals...`. With settings `{}` and the env var set, headless works with no menu. With `{"security":{"auth":{"selectedType":"gemini-api-key"}}}` it also works.
- **Sandbox isolation:** PASS. `~/.gemini` mtime was May 5 15:35:51 before and after, and `find ~/.gemini -newer` showed no changes. The sandbox `~/gemini-workshop/.gemini` got all the writes (acknowledgments, trusted_hooks.json, tmp). The key text is not stored anywhere under the sandbox. I changed `~/gemini-workshop/.gemini/settings.json` to the gemini-api-key form; the original was oauth-personal.

## Results per tab

The act-N repos are git tags of hop-demo, not branches. `git checkout act-N` leaves a detached HEAD. My clones are in `.../scratchpad/gemini-tabs/a2` through `a9`, plus `a6`.

**1. Auth** (before-you-arrive.mdx:31-38, :124-137; harnesses.mdx:21; act-1:48-54)
- Command: `gemini -p "Say ok" -m gemini-2.5-flash` with the key and `GEMINI_CLI_HOME=~/gemini-workshop`. Result: `ok`. PASS for the key and the sandbox.
- FAIL on the trust step (needs `GEMINI_CLI_TRUST_WORKSPACE=true` or interactive trust).
- FAIL on "250 requests a day".
- Suggested text: "A free-tier key allows about 20 requests per day per model (observed 2026-10-02), and not every model. gemini-2.5-pro is closed to new keys and gemini-3.1-pro has no free quota. For two days of workshop use, a paid key is realistic."
- Remove "written from the docs, not run" on the API-key route, and note that a stale `oauth-personal` setting must be removed or changed to `gemini-api-key`.

**2. AGENTS.md via settings** (act-2:57-63; harnesses.mdx:31)
- Checkout act-2. The tag already ships `.gemini/settings.json` with `{"context":{"fileName":["AGENTS.md","GEMINI.md"]}}`.
- Probe: "Without calling any tools, using only the instructions already in context: exact verify command, and what does step 3 say? Else answer NO CONTEXT."
- With the setting, `-o json` showed totalCalls 0 and it quoted `npm run verify` and step 3 ("Verify. Run the checks in Commands below...") correctly.
- Without the file, it answered `NO CONTEXT`.
- PASS. The setting is needed.

**3. Skills in .agents/skills** (act-2:62; act-4:94-98, :142-146, :174-178; act-1:53; harnesses.mdx:41)
- Act-2 skills: headless "list the skill names" returned `code-structure` plus the built-ins `skill-creator` and `antigravity-support`. `.agents/skills` is read with no setting. PASS.
- Act-4 skills: `openspec-apply-change`, `openspec-archive-change`, `openspec-explore`, `openspec-propose`, `openspec-sync-specs`, `openspec-update-change`. Headless "Activate the openspec-propose skill" called the `activate_skill` tool correctly. PASS.
- **`/opsx:propose`, `/opsx:apply`, `/opsx:archive`: FAIL.**
  - The Gemini CLI repo has no `.gemini/commands/` in the act-4 repo. Only `.claude/commands/opsx/*.md` exist.
  - Gemini custom commands come only from `.gemini/commands/**/*.toml` (`opsx/propose.toml` would give `/opsx:propose`) or `~/.gemini/commands`. Skills are not slash commands in 0.62.0. `/skills` only has list, link, disable, enable and reload.
  - Headless, a literal `-p "/opsx:propose"` was sent to the model as text. It tried `activate_skill` and `invoke_agent` and got "Subagent 'openspec-propose' not found".
  - I could not test interactive slash behaviour (no TUI). I confirmed this from the bundled docs `cli/skills.md` and `cli/custom-commands.md`.
  - Suggested text: "Gemini has skills but this repo ships no Gemini slash commands. Ask in plain words: `Use the openspec-propose skill: "Links can expire..."`. Likewise `Use the openspec-apply-change skill` and `Use the openspec-archive-change skill`." Alternatively, ship `.gemini/commands/opsx/*.toml` in the template.
- harnesses.mdx:41, which gives `/name` as the way to invoke a Gemini skill, is also wrong for the same reason. Skills are activated by the model through `activate_skill`.
- `/skills list` and `/mcp list` in act-1: headless `-p "/skills list"` is not parsed as a slash command, but the model answered with the skill list. I could not run the real interactive command.

**4. Hooks** (act-3:79-86; harnesses.mdx:59)
- Used the exact JSON from the guide: `BeforeTool`, matcher `run_shell_command`, `$GEMINI_PROJECT_DIR/.agents/hooks/block-no-verify.sh`, `timeout: 10000`.
- It loads and runs. `git commit --allow-empty --no-verify -m probe` under `--approval-mode yolo` was blocked with "Tool execution blocked: Blocked: this command would skip the git hooks. Fix the failing gate instead." No commit was made.
- Real hook input, from a logging hook:
```
{"session_id":"...","transcript_path":"...","cwd":"...","hook_event_name":"BeforeTool","timestamp":"...","tool_name":"run_shell_command","tool_input":{"description":"...","command":"git commit --allow-empty --no-verify -m probe ."}}
```
- **block-no-verify.sh needs no adaptation. The shape is the same as Claude's: `tool_input.command`.**
- PASS for loading and blocking. FAIL for the sentence "Gemini's hook input has a different JSON shape, so adapt the python3 line". Suggested text: "Gemini's hook input has the same `tool_name` / `tool_input.command` shape, so `block-no-verify.sh` works unchanged. Tested with Gemini CLI 0.62.0 (headless, yolo): `git commit --no-verify` was blocked."
- The same fix applies to the Cursor tab claim only if you test it, which I did not.
- `GEMINI_PROJECT_DIR` is set in hook env (also GEMINI_CWD, GEMINI_SESSION_ID). The timeout unit (ms) was not separately probed; my 10000 value worked. The sandbox home now has `trusted_hooks.json`, so the project hook was trusted via the trust env var.

**5. MCP** (act-5:123-128; harnesses.mdx)
- Used `{"mcpServers":{"agentboard":{"command":"agentboard","args":["mcp"]}}}` (agentboard 0.0.1 at /opt/homebrew/bin) in act-5, with an initialised board.
- The model saw 16 tools, with these names: `mcp_agentboard_board_new`, `..._board_show`, `..._board_list`, `..._board_claim`, `..._board_handoff`, and the rest.
- A call to board_list returned the ticket titles. I ran the call twice: with the `agentboard mcp` form, and with `npx -y @bendechrai/agentboard mcp`. The npx form returned `probe ticket`.
- PASS for both forms.
- One fix: in Gemini the tools are named `mcp_agentboard_board_list` and so on. The line in act-5:139 ("A tool is named `board_` plus the command") should add: "In Gemini CLI the tool name is prefixed: `mcp_agentboard_board_claim`." The model resolved "board_list" on its own anyway.
- Interactive `/mcp list` was not testable.

**6. Subagents** (act-8:53-54; act-9:63-64; harnesses.mdx:50)
- **Project agents are not loaded until acknowledged.** `.gemini/agents/*.md` in the project need a per-agent, per-content-hash acknowledgement. In the interactive TUI this is a prompt. Headless there is no way to answer. Without it, the model said "Subagent 'probe' not found", and only `codebase_investigator`, `cli_help`, `generalist` were known.
- I wrote the acknowledgement file (`~/gemini-workshop/.gemini/acknowledgments/agents.json`, keyed by project root and agent name, value sha256 of the file text). After that, `implementer`, `reviewer` and `probe` all loaded. Delegation by name via `invoke_agent` worked. A probe agent with `model: gemini-3.1-flash-lite-preview` was invoked and returned.
- The probe agent's reply was off-script because it inherits the project AGENTS.md instructions. It ran `npm run verify` and reported 83/83 tests passed instead of "PROBE-OK". This is a side effect of the inheritance and not a loading failure. The acknowledgement itself and `model` frontmatter are accepted.
- The templates in act-8/act-9 both set `model: gemini-2.5-pro`. Problems: (a) that model returns 404 for new keys; (b) implementer and reviewer share the same model, but the guide says the reviewer must differ from the implementer.
- Suggested text: "On first use, Gemini asks you to acknowledge each project agent (interactive prompt). Change `model:` to a model your key can use, for example `gemini-3-flash-preview`, and make the reviewer's model differ from the implementer's (for example `gemini-3.1-flash-lite-preview` for one of them)." Replace "Written from the docs, not run" with "Tested with Gemini CLI 0.62.0: agents load after acknowledgement and delegate by name".
- I did not test the shipped `gemini-2.5-pro` agents end to end because the model is closed. The `@agentname` syntax is documented but not tested.
- Verdict: PARTIAL. It loads and delegates, with the acknowledgement and model fixes needed.

**7. Worktrees** (act-6:124-125; harnesses.mdx:53)
- `gemini -w feat-link-extras-g1` without the setting: "The --worktree flag is only available when experimental.worktrees is enabled in your settings." and exit with usage.
- With `{"experimental":{"worktrees":true}}` in the project settings, it works.
- **It creates `<repo>/.gemini/worktrees/feat-link-extras-g1`, inside the repo. The branch is `worktree-feat-link-extras-g1`, not the bare name.** The worktree is created from the current HEAD (detached in my case). `.gemini/worktrees/` shows as untracked.
- That is not the `../hop.worktrees/<branch>` layout this act uses, and it does not choose the branch or base.
- PASS for flag and setting. FAIL for fit with the act's layout. Suggested text: "Gemini's `-w <name>` needs `experimental.worktrees: true`. It makes `.gemini/worktrees/<name>` inside the repo on a branch called `worktree-<name>`, from the current HEAD. Add `.gemini/worktrees/` to `.gitignore`, or use `git worktree add ../hop.worktrees/feat-link-extras-g1 -b feat/link-extras-g1 --no-track origin/main` and start `gemini` in that folder."

**8. Headless flags** (act-10:138-142; harnesses.mdx:72)
- `-p "<prompt>"`: PASS. `-m <model>`: PASS. `-o json`: PASS. It gives `{"session_id", "response", "stats": {models, tools, files}}`.
- `--approval-mode` values accepted: `default`, `auto_edit`, `yolo`, `plan`.
- **`--approval-mode auto_edit` FAIL for act 10.** Headless it removes the shell tool: `Error executing tool run_shell_command: Tool "run_shell_command" not found`. A file write (`write_file`) succeeded, but the loop cannot run `git`, `npm run verify`, `gh` or `agentboard` with `auto_edit`. The model said "The run_shell_command tool was not available in this environment".
- `--approval-mode yolo`: shell commands ran (`echo shell-ran > sh.txt` worked, totalFail 0).
- Suggested change for `HARNESS_CMD`: `gemini --approval-mode yolo -o json -p` (flag order with `-p` last is fine). Add a warning like the Codex one: yolo runs everything with your user permissions, so use it only in a throwaway or sandboxed environment. Keep `GEMINI_CLI_TRUST_WORKSPACE=true` in the run script, and use a paid key. Replace "Written from the docs, not run" with the tested outcome.

## Tabs not testable (or not fully)
- Interactive-only claims: `/mcp list` and `/skills list` in act-1 (no TUI), the "Use Gemini API key" menu choice, the agent acknowledgement prompt, and `/opsx:*` slash commands. Findings above come from the bundled docs and headless behaviour. The act-1 cost-ledger tab (`npx ccusage@latest gemini`) is not a Gemini CLI test and I did not run it. I did not run the act-10 loop itself (`bin/factory-loop.sh`), the act-6 two-session workflow, or `npm install -g @google/gemini-cli` / `gemini --version` (I used `npx`; `--version` printed 0.62.0).
- I did not test the "Homebrew formula was several releases behind" statement.

## Housekeeping
- I did not edit any docs, push, or open PRs. I did not touch `demo/hop`, and I did not start `claude` or `codex`.
- Test files left in the scratchpad: `a2`..`a9`, `a6` (including a worktree under `a6/.gemini/worktrees`), a test board in `a5/.board`, `hookinput.json`, `hookenv.txt`, and the helper `g.sh`.
- Sandbox settings: `~/gemini-workshop/.gemini/settings.json` now has `selectedType: gemini-api-key`, and the agent acknowledgement file is under `acknowledgments/`.
- The scratchpad path is `/private/tmp/claude-501/-Users-ben-Projects-software-factory-workshop/6bd3b073-6ab7-41c0-9ad8-75c1b35a8051/scratchpad/gemini-tabs/`.