# Interactive checklist

Steps the guide marks as not run because they need a real terminal. About 15 minutes in total. Do them in an empty folder (`mkdir -p ~/workshop/check && cd ~/workshop/check && git init -b main`). After each one, edit the page and replace "not run" with what you saw.

1. Claude Code, empty sandbox.
   - Command: `claude-workshop`, then type `/skills` and `/mcp`.
   - Look for: both lists are empty.
   - Confirms: Act 1, "The sandbox and the vibe", Claude Code tab (claim already made, this proves it).

2. Codex, empty sandbox.
   - Command: `codex-workshop`, then type `/mcp`.
   - Look for: no servers are listed.
   - Confirms: Act 1, Codex CLI tab ("Written from the docs, not run").

3. Codex, hook trust review.
   - Command: in a repo with `.codex/hooks.json` (copy from `templates/act-3/`), run `codex-workshop`, then type `/hooks`.
   - Look for: the hook shown as untrusted. Trust it, then ask Codex to run `git commit --no-verify` and see it blocked.
   - Confirms: Act 3, "Gates", Codex CLI tab (the "TUI review step was not run" line).

4. Gemini, the auth menu.
   - Command: `GEMINI_CLI_HOME=~/gemini-check gemini` (a fresh folder, so the menu appears).
   - Look for: the "Use Gemini API key" option. Pick it with `GEMINI_API_KEY` exported. Check `~/gemini-check/.gemini/settings.json` for `security.auth.selectedType`, and that the real `~/.gemini` is untouched.
   - Confirms: Before you arrive, Gemini CLI tab; the sandbox-home sentence.

5. Gemini, empty sandbox.
   - Command: `export GEMINI_API_KEY=... GEMINI_CLI_TRUST_WORKSPACE=true; gemini-workshop`, then type `/skills list` and `/mcp list`.
   - Look for: both empty.
   - Confirms: Act 1, Gemini CLI tab.

6. Gemini, hook trust prompt.
   - Command: in a repo with the act 3 `.gemini/settings.json` hook, run `gemini-workshop` with `GEMINI_CLI_TRUST_WORKSPACE` unset.
   - Look for: the trust prompt for the folder and hook. Accept, then try `git commit --no-verify` and see it blocked.
   - Confirms: Act 3, Gemini CLI tab ("The interactive trust prompt was not run").

7. Gemini, MCP list with the board.
   - Command: in the demo repo with the agentboard MCP config, run `gemini-workshop`, then `/mcp list`.
   - Look for: agentboard listed as connected with its tools.
   - Confirms: Act 5, "Tickets", Gemini CLI tab ("Interactive `/mcp list` was not run").

8. Gemini, openspec commands.
   - Command: `npx -y @fission-ai/openspec init --tools gemini`, then `gemini-workshop`, then `/opsx:propose add a footer`.
   - Look for: `.gemini/commands/opsx/*.toml` written, and the command runs a propose. Try `/opsx:apply` and `/opsx:archive` after it.
   - Confirms: Act 4, "Specifications", Gemini CLI tab (propose, apply and archive "not tested interactively").

9. Gemini, agent acknowledgement prompt.
   - Command: in the demo repo with `.gemini/agents/reviewer.md` and `implementer.md`, run `gemini-workshop` and ask: "Use the reviewer agent to review the last commit."
   - Look for: the prompt asking you to acknowledge the project agent, then delegation by name.
   - Confirms: Act 8 "Review" and Act 9 "The orchestrator", Gemini CLI tabs.

10. Cursor, interactive session.
    - Command: `agent-workshop`, ask it to say hello, then `/quit`.
    - Look for: the session starts, uses the sandbox config folder (`~/.cursor-workshop`), and shows no skills or hooks from your normal setup.
    - Confirms: Act 1, Cursor tab ("The interactive session was not run").

11. Cursor, MCP list.
    - Command: in another terminal, `CURSOR_CONFIG_DIR=~/.cursor-workshop agent mcp list`.
    - Look for: no servers, or the names to turn off with `agent mcp disable <name>`.
    - Confirms: Act 1, Cursor tab.

12. Cursor, plan tier.
    - Command: `agent about` and `agent models`.
    - Look for: whether a paid tier shows, and whether named models are listed. This decides whether the Act 8 reviewer can differ from the implementer.
    - Confirms: Act 8 and Act 10 Cursor tabs, and the before you arrive plan note.
