Codex CLI tab test report (codex-cli 0.160.0, via `npx -y @openai/codex`, OpenRouter, `workspace-write` sandbox on for every run, stdin from /dev/null, no docs edited, no `claude` started).

Scratch folder: /private/tmp/claude-501/-Users-ben-Projects-software-factory-workshop/6bd3b073-6ab7-41c0-9ad8-75c1b35a8051/scratchpad/codex-tabs/ (own CODEX_HOME in `home/`, hop-demo clone in `demo/`, helpers `cx.sh`, `usage.sh`, `rpc.py`).

**Total OpenRouter cost: about $0.20.** Key usage went from 8.434 to 8.635, against a $3 cap.

Summary: 4 PASS, 3 PASS with doc corrections, 4 FAIL. The FAILs are the hooks trust note, the reviewer model id, the "Desktop app only" worktree claim, and one omission in act 10.

## 1. Sandbox / CODEX_HOME (before-you-arrive.mdx:111-119; reference/harnesses.mdx:20-21): PARTIAL, needs corrections
- **Docs say:** "The directory must exist before Codex starts; it does not create it. Your login lives inside `CODEX_HOME`, so sign in again. ... personal skills in `~/.agents/skills` still load."
- **Missing directory:** `CODEX_HOME=<nonexistent> codex exec hi` fails with `Error finding codex home: CODEX_HOME points to "...", but that path does not exist`. PASS.
- **Empty home, no auth:** Codex creates its sqlite files and runs, but the request fails with `401 Unauthorized: Missing bearer or basic authentication ... api.openai.com/v1/responses`. `codex login status` says "Not logged in". PASS for "sign in again".
- **With OpenRouter:** `OPENROUTER_API_KEY` in the environment plus `model_provider = "openrouter"` works with no `codex login`. `codex login status` still says "Not logged in" even though runs succeed.
- **`~/.agents/skills` still loads:** PASS.
  - I ran with `HOME=<scratch>/fakehome`, which holds `.agents/skills/zzz-home-test`. The skill list then showed `zzz-home-test` and none of my real `~/.agents/skills` entries.
  - With the real HOME, the list showed 17 of my personal skills (`agent-browser`, `zen-review`, `preflight`, and others).
  - Codex also lists its bundled skills (`imagegen`, `openai-docs`, `skill-creator`, `skill-installer`). Those load regardless of `CODEX_HOME`, so the "rename the folder" advice applies to `~/.agents/skills` only.
- **Corrected text to add:** "If you route Codex through OpenRouter, the `OPENROUTER_API_KEY` environment variable replaces `codex login`; set `model_provider = "openrouter"` in `$CODEX_HOME/config.toml`."

## 2. AGENTS.md read natively (act-2-guardrails.mdx:53-55, 75): PASS
- **Ran:** act-2 repo, `codex exec -C demo --json "What does AGENTS.md say about verification? Quote it."` There was no tool call, because AGENTS.md was already in context.
- **Result:** it quoted "**Verify.** Run the checks in "Commands" below after your last edit, and quote the command and its exit code in your summary."

## 3. Skills and invocation names (act-2:54; act-4-specifications.mdx:87-93, 136-141, 168-173): PASS
- **Discovery:** `.agents/skills/code-structure` shows up in Codex's skill list.
- **`$code-structure`:** it reads `.agents/skills/code-structure/SKILL.md` and returns the first heading.
- **act-4 tag (skills present):** `openspec-apply-change`, `openspec-archive-change`, `openspec-explore`, `openspec-propose`, `openspec-sync-specs`, `openspec-update-change`.
- **`$openspec-apply-change` and `$openspec-archive-change`:** both resolve to the correct skill descriptions.
- **`$openspec-propose`:** it follows that skill's step 1, "Understand the request and clarify material ambiguity".
- **Docs wording:** "Codex has skills but no commands, so you call the skill by name" is accurate.

## 4. Hooks (act-3-gates.mdx:68-75; harnesses.mdx:59): FAIL as written, works after trust
- **Docs say:** "Project hooks load when the project is trusted."
- **Documented JSON as written:** a trusted project (`trust_level = "trusted"`) is not enough. `hooks/list` shows the hook is loaded, with `"matcher":"Bash"` and `"trustStatus":"untrusted"`. `git commit --no-verify` was not blocked and actually ran. It failed only because of the sandbox (see the sandbox finding below).
- **Hook trust is separate from project trust.** Codex needs a persisted per-hook trust hash. There is also a `--dangerously-bypass-hook-trust` flag, which I did not use (the permission classifier refused it).
- **How I trusted it:** I got the hash from the app-server `hooks/list` call (`currentHash`) and wrote this into `$CODEX_HOME/config.toml`:
  ```toml
  [hooks.state."<repo>/.codex/hooks.json:pre_tool_use:0:0"]
  trusted_hash = "sha256:<currentHash>"
  ```
  A normal user would do this through the TUI hook review (`/hooks`); I did not test the TUI. After this, `trustStatus` was "trusted".
- **With trust, the documented JSON works unchanged:**
  - `git commit --no-verify -m "test nv"` was blocked, with `Command blocked by PreToolUse hook: Blocked: this command would skip the git hooks. Fix the failing gate instead.`
  - The command did not run.
  - Matcher `"Bash"` is correct for Codex's shell tool.
  - `$(git rev-parse --show-toplevel)` in the command works.
- **Hook stdin shape (captured with a logging hook):**
  ```json
  {"session_id":"...","turn_id":"...","transcript_path":"...","cwd":"...","hook_event_name":"PreToolUse","model":"openai/gpt-5.6-luna","permission_mode":"bypassPermissions","tool_name":"Bash","tool_input":{"command":"echo hello"},"tool_use_id":"exec-..."}
  ```
  This is the same `tool_input.command` shape the script reads, so no python3 edit is needed for Codex.
- **Corrected text:** "Project hooks only run once the hook itself is trusted, in addition to the project. The first time Codex sees a new or changed `.codex/hooks.json` it marks the hook untrusted and does not run it. Open the hook review in the TUI (`/hooks`) and trust it. Until you do, the guard does not run. Codex's hook input has the same `tool_name` / `tool_input.command` shape as Claude Code, so the script works unchanged."

## 5. MCP (act-5-tickets.mdx:114-121): PASS, with caveats
- **Documented TOML:** `[mcp_servers.agentboard]` with `command = "agentboard"` and `args = ["mcp"]` in `.codex/config.toml` works.
  - `codex mcp list`, run from inside the repo, shows `agentboard  agentboard  mcp  enabled`.
  - A prompt to call `board_list` returned `[]`.
  - Tools visible: `board_checklist_tick`, `board_checklist_untick`, `board_claim`, `board_close`, `board_close_merged`, `board_comment`, `board_handoff`, `board_health`, `board_import_change`, `board_inbox`, `board_link`, `board_list`, `board_move`, `board_new`, `board_release`, `board_show`.
- **npx variant:** `command = "npx"` with `args = ["-y", "@bendechrai/agentboard", "mcp"]` also works (npm 0.1.0). `board_health` returned a clean result.
- **Caveats to add:**
  - The `command = "agentboard"` form needs the global install from step 1. `agentboard` was already on this machine's PATH (/opt/homebrew/bin). I did not test the form without a global install, so for those readers the npx form is the safe one.
  - Project `.codex/config.toml` only loads for a trusted project. With `trust_level = "untrusted"`, `codex mcp list` showed no servers.
  - `codex mcp list` run from outside the repo shows none, because the config is project-scoped.
  - The doc says "Written from the Codex docs, not run." This can now be changed to tested.

## 6. Agents (act-9-the-orchestrator.mdx:60-62; act-8-review.mdx:50-52): implementer PASS, reviewer FAIL
- **Implementer (`.codex/agents/implementer.toml`, act-9 template):** Codex loads it. Prompting "spawn the custom agent named implementer" produced `spawn_agent` with `agent_type: "implementer"`. The child session ran on `openai/gpt-5.3-codex`, the model from the TOML, and carried `agent_role":"implementer"` plus the `developer_instructions` text.
- **Keys:** `name`, `description`, `developer_instructions` and `model` are all accepted.
- **Reviewer (`templates/act-8/.codex/agents/reviewer.toml`):** spawning it fails with `{"error":{"message":"gpt-5.5-codex is not a valid model ID","code":400}}`.
  - **OpenRouter ids:** it has `openai/gpt-5.3-codex`, `openai/gpt-5.2-codex`, `openai/gpt-5.1-codex(-max/-mini)`, `openai/gpt-5.5` and `openai/gpt-5.5-pro`, but no `gpt-5.5-codex`.
  - **Stale value in the demo repo:** the hop-demo `act-9` tag still has `model = "gpt-5.5-codex"` in implementer.toml, so it is stale against the template (`openai/gpt-5.3-codex`).
  - **Corrected text for act-8-review.mdx:51:** "`.codex/agents/reviewer.toml` with a `model` that differs from the implementer's. On OpenRouter use the provider-prefixed id, for example `openai/gpt-5.5` (the implementer uses `openai/gpt-5.3-codex`). `gpt-5.5-codex` is not a valid OpenRouter id." Fix the reviewer.toml template too, and the hop-demo act-9 tag's implementer.toml.
  - I only tested the failure path; I did not run a reviewer with a valid model.
- **Mock subagent reply:** the implementer's one-line reply was garbled ("Codex — Very important: ...") on the luna model; spawn and role loading worked, and I did not look further into the reply.

## 7. Headless (act-10-unattended.mdx:110-137; harnesses.mdx:67-76): PASS, with a sandbox caveat
- **Ran:** `codex exec "<prompt>" -C <dir> --json -m openai/gpt-5.6-luna --sandbox workspace-write -o last.txt`. All flags are accepted.
  - `--json` gives JSONL events (`thread.started`, `turn.started`, `item.completed`, `turn.completed` with usage).
  - `-o` wrote the last message to the file.
  - Flags work after the prompt too.
- **`-p` means profile:** `exec --help` says "Layer $CODEX_HOME/<name>.config.toml on top of the base user config". That is a separate file per profile, not a `[profiles.x]` table. The act-10 statement is right.
- **Stdin:** `Reading additional input from stdin...` still prints even with `</dev/null`. It is harmless.
- **act-10 smoke-test sentence (line 134): FAIL for my setup.** In the `workspace-write` sandbox, `.git` is read-only here.
  - `git commit` fails with `fatal: Unable to create '.../.git/index.lock': Operation not permitted`.
  - `git worktree add` fails the same way (cannot lock `refs/heads/...lock`).
  - This is the same in `codex exec` with `--sandbox workspace-write`. It contradicts "git fetch, git worktree add, commits ... worked inside workspace-write".
  - Fix that worked: `sandbox_workspace_write.writable_roots = ["<npm-cache>", "<repo>/.git"]`. A `git commit --allow-empty` then succeeded.
  - If the guide's claim came from a different setup, say which. Otherwise add `.git` to `writable_roots` in the act-10 example config.
  - I did not re-test other sandbox paths (push, Chromium).

## 8. Worktrees (act-6-isolation.mdx:121-123; harnesses.mdx:53): FAIL on the "Desktop app only" claim
- **Finding:** 0.160.0 has `--worktree` on both `codex` and `codex exec`: "Run the session in a new managed Git worktree". `features list` also shows `worktrees  stable  true`.
- **Ran:** `codex exec -C demo --worktree ...`. The working directory became `$CODEX_HOME/worktrees/b224/demo` and `git worktree list` showed it as a detached HEAD at the same commit. I removed that worktree afterwards.
- **Limits:** it takes no name, branch or base. It cannot do `-b feat/link-extras-g1 --no-track origin/main`, and the location is under `$CODEX_HOME`. For act 6's named branches from `origin/main`, manual `git worktree add` plus `codex -C <dir>` is still the right instruction.
- **Corrected harnesses.mdx:53 cell:** "`codex --worktree` (a managed detached worktree under `$CODEX_HOME/worktrees`, no name or base; for a named branch use `git worktree add` and `codex -C <dir>`)".
- **Corrected act-6 line 122:** keep the manual command, and add "Codex also has `--worktree`, but it makes an unnamed detached worktree, so use `git worktree add` for the named branches this act needs."
- **Not tested:** the exact `git worktree add ../hop.worktrees/... --no-track origin/main` command. It is plain git and not Codex-specific.

## Tabs not tested
- **before-you-arrive.mdx:24-30 (install):** `npm install -g @openai/codex` would add a global binary, which you ruled out. `--version` shows 0.160.0 via npx.
- **act-1:41-47 (`codex-workshop`, then `/mcp` in the TUI):** the TUI needs a terminal. I used `codex mcp list` instead, which showed no servers with an empty home and a non-project directory.
- **act-1:79-81 (`npx ccusage@latest codex`):** not run, to avoid a new package download.
- **TUI `/hooks` hook-trust review and interactive `codex login`:** not run, no TTY.
- **act-10 full loop, Chromium in the sandbox and `git push`:** not run. The loop is already marked pending in the guide, and these would need `danger-full-access`, which is off-limits.
- **act-6 `git worktree add` on `origin/main`:** not run (see above).

## Other notes
- The act-3, act-4, act-5 and act-9 tags of the hop-demo repo already contain parts of these files (`.agents/hooks/block-no-verify.sh`, openspec skills, agentboard skill, `.codex/agents/*.toml`). The act-9 tag has no `.codex/hooks.json` and no `.codex/config.toml`, and an old `gpt-5.5-codex` implementer model.
- Several "Written from the docs, not run." notes can now be updated: act-2, act-3 (with the trust fix), act-4, act-5, act-8 (once the model is fixed), act-9, act-6.