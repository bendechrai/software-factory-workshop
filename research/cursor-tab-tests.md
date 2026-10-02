CURSOR TAB TEST REPORT

CLI: agent 2026.10.01-e373342, CURSOR_CONFIG_DIR=~/.cursor-workshop for all runs. Model: `--model auto` for every run. The account is on the Free plan, so named models fail (see item 8). After about 25 short runs the account hit "You've hit your usage limit", so nothing more could run. Scratch clones are in /private/tmp/claude-501/-Users-ben-Projects-software-factory-workshop/6bd3b073-6ab7-41c0-9ad8-75c1b35a8051/scratchpad/cursor-tabs/ (act2, act2c, act2s, act3, act4, act5, act5b, act6, act10). I did not touch demo/hop, did not edit the docs, did not push, and did not start claude or codex.

SUMMARY OF FAILS (docs need correcting)
1. before-you-arrive.mdx:145 and act-1:60 - the sandbox does NOT isolate MCP, hooks or skills.
2. act-3:93 - the hook script must read `.command`, and Cursor already runs the Claude hook.
3. act-8:57 - `gpt-5` is not a valid id in `agent models`.
4. act-5:135 - `agent mcp enable` is needed, and `--force` is needed for headless MCP calls.
5. act-6:128 - the worktree lands in ~/.cursor/worktrees, not the sandbox.
6. act-1:87 - the ccusage claim cannot be confirmed (see 8).

---
1. SANDBOX (before-you-arrive.mdx:139-147, act-1:56-61) - FAIL for MCP, hooks and skills; PASS for config and sign-in
- `agent status` with CURSOR_CONFIG_DIR: "Logged in as ben@dechrai.com". Without it: also logged in. That is expected, because ~/.cursor/cli-config.json also holds the sign-in. The sandbox has its own copy (`authInfo` in ~/.cursor-workshop/cli-config.json), which `agent login` wrote.
- I could not check whether the token itself is in the keychain. The auto-mode classifier denied my keychain lookup, so I left it.
- Files that appeared in ~/.cursor-workshop: cli-config.json, chats/, statsig-cache.json. No mcp.json, hooks.json or skills.
- `agent mcp list` under the sandbox shows `meko: ready`. Without the env var it shows the same. So the user's normal MCP servers are still loaded from ~/.cursor/mcp.json.
- The user's global ~/.cursor/hooks.json also fired under the sandbox (the meko hooks wrote to ~/.cursor/meko-session-cache).
- The skills list shows ~/.cursor/skills, ~/.cursor/skills-cursor and ~/.claude/skills (about 17 of the user's Claude skills) under the sandbox.
- ~/.cursor changed during my runs, even with CURSOR_CONFIG_DIR set:
  - cli-config.json was rewritten.
  - New files: agent-cli-state.json, skills-cursor/ (built-in skills unpacked), projects/<workspace>/agent-transcripts (8 dirs, one per scratch workspace), and meko-session-cache entries.
  - Unchanged: hooks.json, mcp.json, argv.json, skills/.
  - Before and after file lists are in .../scratchpad/cursor-before.txt and cursor-after.txt.
- Corrected text for before-you-arrive.mdx:145: "Cursor documents CURSOR_CONFIG_DIR as the location of the CLI configuration file. In practice it moves only cli-config.json, the sign-in record and the chat history. It does NOT move MCP servers, hooks, skills or transcripts: ~/.cursor/mcp.json, ~/.cursor/hooks.json, ~/.cursor/skills and ~/.claude/skills still load. First run `agent-workshop login`. Then run `agent-workshop mcp list`: you will probably still see your servers, so disable each for the two days with `agent mcp disable <name>` (tested: the status becomes `disabled`). Your global hooks still run too."
- Corrected text for act-1:60: "Run `agent-workshop mcp list` in another terminal. Any server that appears must be turned off with `agent mcp disable <name>`; the sandbox variable does not hide your normal servers."
- Also: `--model <id>` is saved as the default in cli-config.json. A failed run with a bad model id left `gemini-3.7-flash` as the default until I passed `--model auto` again. Worth a one-line warning.

2. AGENTS.md and CLAUDE.md (act-2:65-67, harnesses.mdx) - PASS
- `agent -p "What does AGENTS.md say about verification? Quote it." --model auto --output-format text --trust` quoted step 3 "Verify. Run the checks in 'Commands' below..." and `npm run verify`.
- A clone with only CLAUDE.md (secret codeword inside) answered "PINEAPPLE-42", so CLAUDE.md is read natively when there is no AGENTS.md.
- The act-2 tag has no CLAUDE.md at all (the latest commit dropped it), so any text claiming Cursor reads the repo's CLAUDE.md is untestable there.

3. SKILLS AND OPENSPEC COMMANDS (act-2:66, act-4:100-105, 148-153, 180-185) - PASS
- .claude/skills is a symlink to ../.agents/skills in the demo. Cursor listed `code-structure` from `.../act2/.claude/skills/code-structure/SKILL.md`.
- With .claude deleted, "Is skill code-structure available?" answered Yes, from `.agents/skills/code-structure/SKILL.md`. So .agents/skills is read natively. `/code-structure ...` invoked it.
- `npx -y @fission-ai/openspec@1.14.0 init --tools cursor --no-animation` on act-4 wrote .cursor/commands/opsx-{apply,archive,explore,propose,sync,update}.md and .cursor/skills/openspec-*. It printed "Start your first change: /opsx-propose".
- `agent -p "/opsx-propose"` replied "What change do you want to work on?" in three setups:
  - with the .cursor commands;
  - without them (only .claude/commands/opsx/* and the openspec-* skills);
  - after deleting .cursor entirely (so the plain act-4 tag).
  `/openspec-propose` also worked. So the `/opsx-propose` form works, and the act-4 tag works for Cursor with no `openspec init --tools cursor`.
- I did not run a full propose, apply or archive.
- Optional doc note: "`openspec init --tools cursor` is not needed in the demo repo, because Cursor also reads .claude/commands and .claude/skills."

4. HOOKS (act-3:88-93) - the claim is partly right (the shape differs) but the guide is incomplete
- `.cursor/hooks.json` loads and `beforeShellExecution` fires in `-p --force` mode.
- Real input JSON (logged), pretty-printed:
  `{"conversation_id":..,"generation_id":..,"model":"default","command":"echo hello-hook","cwd":"","sandbox":false,"session_id":..,"hook_event_name":"beforeShellExecution","cursor_version":"2026.10.01-e373342","workspace_roots":["<repo>"],"user_email":..,"transcript_path":..}`
- The command is TOP-LEVEL `command`. There is no `tool_input`.
- The hook runs with cwd = the repo root, so the relative path `.agents/hooks/block-no-verify.sh` resolves.
- Env set by Cursor: CURSOR_PROJECT_DIR, CURSOR_VERSION, CURSOR_TRANSCRIPT_PATH and others. CLAUDE_PROJECT_DIR was only present because it is inherited from the outer shell.
- The unmodified script (reads `.tool_input.command`) does NOT block via `.cursor/hooks.json`. Its Python prints an empty string, so the hook exits 0 and `echo marker --no-verify` ran. FAIL as the guide has it.
- Adapted line (python line 7): `d=json.load(sys.stdin); print(d.get("command") or d.get("tool_input",{}).get("command",""))`.
  - With that line, both `echo marker --no-verify` and a real `git commit -a --no-verify` were blocked.
  - The commit did not happen. The model reported "Command execution was blocked by a hook: ... Blocked: this command would skip the git hooks."
- Exit codes:
  - exit 2 blocks, and stderr is shown to the model.
  - exit 1 FAILS OPEN: the command ran.
  - JSON on stdout with exit 0 also blocks: `{"permission":"deny","user_message":"...","agent_message":"..."}`. Allow is `{"permission":"allow"}`.
- Important discovery: Cursor CLI also loads Claude Code hooks from `.claude/settings.json`. With only .claude/settings.json (PreToolUse, matcher Bash) and no .cursor/hooks.json, the UNMODIFIED script blocked `echo marker --no-verify`. So in the demo repo the Claude hook already protects Cursor, and a .cursor/hooks.json would run both. Cursor also feeds the Claude-shaped input to that path.
- Corrected text for act-3:93: "Cursor's CLI also honours the Claude hook in .claude/settings.json, so in this repo the gate already works with no extra file. If you want a Cursor-native hook, use the file above, but the script must read `command` at the top level: change the python3 line to `d=json.load(sys.stdin); print(d.get('command') or d.get('tool_input',{}).get('command',''))`. Exit 2 blocks; exit 1 does NOT block. Tested with Cursor CLI 2026.10.01 in `-p --force` mode."
- Caveat: a test prompt of `git commit --no-verify` was first refused by the model itself because the act-3 AGENTS.md forbids it. That is not the hook. The results above come from runs with AGENTS.md removed.

5. MCP (act-5:130-135) - PARTLY FAIL (needs approval steps)
- `.cursor/mcp.json` with `{"command":"agentboard","args":["mcp"]}` works. The config is picked up, but `agent mcp list` first shows `agentboard: not loaded (needs approval)`, and `list-tools` fails with "has not been approved".
- `agent mcp enable agentboard` fixes that: it prints "Enabled and approved MCP server: agentboard" and the list shows `agentboard: ready`.
- `agent mcp list-tools agentboard` returned 16 tools: board_checklist_tick, board_claim, board_close, board_comment, board_handoff, board_health, board_import_change, board_inbox, board_link, and others. Each takes an `as` argument.
- The npx form (`npx -y @bendechrai/agentboard mcp`) is a different config, so it needs its own `agent mcp enable`. I did not get it past "not loaded (needs approval)", so I did not test it end to end.
- Headless prompt calling board_list:
  - no flags: rejected.
  - `--approve-mcps` alone: rejected at the approval step.
  - `--force`: PASS, the tool returned `[]` (empty board).
- Corrected text for act-5:135: "Then run `agent mcp enable agentboard` (Cursor asks you to approve each MCP server once; `agent mcp list` shows `needs approval` until you do). Check with `agent mcp list-tools agentboard`. In headless `-p` runs the tool calls also need `--force`; `--approve-mcps` alone was not enough. The `npx` form works the same way but is approved separately."

6. SUBAGENTS (act-8:56-58, act-9:66-67) - PASS, with a model-id FAIL
- `.cursor/agents/probe.md` (model: inherit): "delegate to your subagent named probe" returned PROBE-CURSOR-OK.
- `.claude/agents/probeclaude.md` is also loaded and delegable: PROBE-CLAUDE-OK.
- When `.cursor/agents/clash.md` and `.claude/agents/clash.md` both exist, .cursor wins: CLASH-FROM-CURSOR. This confirms the act-9 template comment.
- The act-8 template says `model: gpt-5`, but `gpt-5` is not in `agent models` (there is gpt-5-mini, gpt-5.1, gpt-5.2, gpt-5.4-*, gpt-5.5-*, and so on). With `model: gpt-5` the delegation errored with the Free-plan message, which hides whether the id is valid.
- A top-level `--model nonexistent` prints "Cannot use this model: ... Available models: ...", so ids are validated.
- Corrected text for act-8:57: "`.cursor/agents/reviewer.md`, with `model:` set to an id from `agent models` that differs from the implementer's (for example `gpt-5.5-medium` if the implementer is a Claude model). The template's `gpt-5` is not a valid id in the CLI list; update templates/act-8/.cursor/agents/reviewer.md to match. Named models need a paid Cursor plan; on the Free plan only `auto` works. Subagents in .cursor/agents and .claude/agents are both loaded, and .cursor wins a name clash."
- Not tested: the real reviewer.md and implementer.md bodies, and a paid-plan model.

7. WORKTREES (act-6:127-129) - PASS for creation and location; the rest untested
- `agent -p --force --trust --model auto -w wt-probe --worktree-base main "..."` printed "Using worktree: /Users/ben/.cursor/worktrees/act6/wt-probe". The path is `~/.cursor/worktrees/<repo-folder>/<name>`, NOT under the sandbox dir.
- Branch `wt-probe` was created at main's commit (ef7a2d7), not at the checked-out act-6 tag, so `--worktree-base main` works.
- The prompt itself then failed with the usage limit, so I did not see the agent run inside it.
- I cleaned up: `git worktree remove`, `git worktree prune`, `git branch -D wt-probe`, and removed the empty ~/.cursor/worktrees dirs.
- Doc suggestion: "Worktrees are created in ~/.cursor/worktrees/<repo>/<name>, even with CURSOR_CONFIG_DIR set; `--worktree-base main` bases it on main. Setup scripts come from .cursor/worktrees.json." Also note that the CLI help says `--worktree-base` defaults to the current HEAD.

8. HEADLESS FLAGS (act-10:144-149, harnesses.mdx, templates/act-10/bin/factory-loop.sh) - PASS
- `agent -p --force --trust --model auto --output-format json "<prompt>"` works. The prompt goes last as a positional argument, which matches what factory-loop.sh does. It printed `{"type":"result","subtype":"success","is_error":false,"duration_ms":..,"result":"..","session_id":..,"request_id":..,"usage":{"inputTokens":..,"outputTokens":..,"cacheReadTokens":..,"cacheWriteTokens":..}}`.
- It does NOT wait on stdin. With stdin attached to a 40-second `sleep` pipe, it answered "OK" and exited 0 at once. A `</dev/null` is not required, though harmless.
- `--model` accepts a CLI id and is validated. On this Free plan any named model (checked: gemini-3.7-flash-high) fails with "Named models unavailable Free plans can only use Auto". A model other than `auto` therefore needs a paid plan.
- I did not run the claim in act-10:148, "Without --force, Cursor only proposes changes and does not write them", because of the usage limit. Hooks and MCP approvals did behave the same way: tool calls were rejected without --force.
- Related: the act-1:87 claim that ccusage help does not list Cursor holds (`npx ccusage@latest --help | grep -ic cursor` gives 0).

NOT TESTED
- before-you-arrive.mdx:40-47 install: `curl https://cursor.com/install | bash` was not run (already installed). `agent --version` gives 2026.10.01-e373342, so PASS for that line.
- Interactive `agent-workshop` (act-1:58), because there is no TTY here. Headless use of the same sandbox works.
- The act-9 implementer.md and act-8 reviewer.md real bodies, a full OpenSpec propose, apply or archive run, `--force` writing files, and anything needing a named model, all because of the Free plan and the usage limit.
- `agentboard` hand-off or claim flows in act-5 (only `board_list` was called).
