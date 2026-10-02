# Interactive checklist

The guide makes claims about how a few interactive screens behave: menus, trust prompts and slash commands. Nobody has run them, because they need a person at a real terminal. Each check below either confirms the claim or shows the page is wrong.

To report back, send one line per item, like "3 pass" or "5 fail: shows my servers". Or send the item number and what you saw. About 30 minutes in total.

## Sign-ins you need

| Items | You need |
|---|---|
| 1, 2 (Codex) | Codex with the OpenRouter key exported. |
| 3 to 8 (Gemini) | `GEMINI_API_KEY` exported. Start Gemini with a Flash model (`-m gemini-3-flash-preview`), because the free key has no quota on the default model. |
| 9 (Cursor) | Skip until the monthly usage reset. |

Claude Code needs nothing. Its steps were already run.

## One-time setup

Run this once. It makes a folder per check, so each item starts clean.

```bash
WS=~/Projects/software-factory-workshop
mkdir -p ~/workshop/check && cd ~/workshop/check
for d in codex-hook gemini-hook gemini-board gemini-agents gemini-spec; do mkdir -p $d && git -C $d init -q -b main; done
for d in codex-hook gemini-hook; do mkdir -p $d/.agents/hooks && cp $WS/templates/act-3/.agents/hooks/block-no-verify.sh $d/.agents/hooks/ && chmod +x $d/.agents/hooks/block-no-verify.sh; done
mkdir -p codex-hook/.codex gemini-hook/.gemini gemini-board/.gemini
echo '{ "hooks": { "PreToolUse": [ { "matcher": "Bash", "hooks": [ { "type": "command", "command": "\"$(git rev-parse --show-toplevel)/.agents/hooks/block-no-verify.sh\"", "timeout": 10 } ] } ] } }' > codex-hook/.codex/hooks.json
echo '{ "hooks": { "BeforeTool": [ { "matcher": "run_shell_command", "hooks": [ { "name": "block-no-verify", "type": "command", "command": "$GEMINI_PROJECT_DIR/.agents/hooks/block-no-verify.sh", "timeout": 10000 } ] } ] } }' > gemini-hook/.gemini/settings.json
echo '{ "mcpServers": { "agentboard": { "command": "agentboard", "args": ["mcp"] } } }' > gemini-board/.gemini/settings.json
cp -r $WS/templates/act-8/.gemini $WS/templates/act-9/.gemini gemini-agents/ 2>/dev/null; cp $WS/templates/act-9/.gemini/agents/implementer.md gemini-agents/.gemini/agents/
git -C gemini-agents commit --allow-empty -qm "first commit"
npm install -g @bendechrai/agentboard
```

## Codex

### 1. Codex starts with no servers

- Run: `cd ~/workshop/check/codex-hook`
- Run: `codex-workshop`
- Run (inside Codex): `/mcp`
- You should see: no MCP servers listed (an empty list or a "none configured" message).
- It fails if: any server is listed, or `/mcp` is not a command.
- Page: Act 1, Codex CLI tab. Remove "Written from the docs, not run" and say what you saw.

### 2. Codex asks you to trust the hook

- Run: `cd ~/workshop/check/codex-hook`
- Run: `codex-workshop`
- Run (inside Codex): `/hooks`
- You should see: the `block-no-verify` hook marked untrusted, with a way to trust it. Trust it. Then type: `run git commit --allow-empty --no-verify -m test`
- You should then see: the commit is blocked by the hook. Before you trust it, the same request should go through.
- It fails if: the hook is already trusted, there is no review screen, or the commit is not blocked after trusting.
- Page: Act 3, Gates, Codex CLI tab (the "TUI review step itself was not run" line).

## Gemini

Start every Gemini session with `-m gemini-3-flash-preview`. Export `GEMINI_API_KEY` first. A free key allows about 20 requests a day per model, so do not repeat runs.

### 3. The auth menu offers the API key

- Run: `GEMINI_CLI_HOME=~/gemini-check gemini -m gemini-3-flash-preview`
- Run: `cat ~/gemini-check/.gemini/settings.json`
- You should see: a menu with the option "Use Gemini API key". Pick it. The settings file then has `security.auth.selectedType` set to `gemini-api-key`. Your real `~/.gemini` has no new files from this run.
- It fails if: the option has a different name, the key is written into the settings file, or the real `~/.gemini` changes.
- Page: Before you arrive, Gemini CLI tab (the "menu choice itself is interactive and was not run" line).

### 4. Gemini starts with nothing loaded

- Run: `mkdir -p ~/workshop/check/gemini-empty && cd ~/workshop/check/gemini-empty && git init -q -b main`
- Run: `GEMINI_CLI_TRUST_WORKSPACE=true gemini-workshop -m gemini-3-flash-preview`
- Run (inside Gemini): `/skills list` then `/mcp list`
- You should see: both lists empty.
- It fails if: any skill or server shows up from your normal setup.
- Page: Act 1, Gemini CLI tab (the "were not run (written from the docs)" line).

### 5. Gemini asks you to trust the folder and hook

- Run: `cd ~/workshop/check/gemini-hook`
- Run: `env -u GEMINI_CLI_TRUST_WORKSPACE gemini-workshop -m gemini-3-flash-preview`
- You should see: a prompt to trust the folder. Accept. Then type: `run git commit --allow-empty --no-verify -m test`
- You should then see: the commit is blocked by the `block-no-verify` hook.
- It fails if: there is no trust prompt, or the commit goes through.
- Page: Act 3, Gates, Gemini CLI tab ("The interactive trust prompt was not run").

### 6. The board shows in `/mcp list`

- Run: `cd ~/workshop/check/gemini-board`
- Run: `GEMINI_CLI_TRUST_WORKSPACE=true gemini-workshop -m gemini-3-flash-preview`
- Run (inside Gemini): `/mcp list`
- You should see: `agentboard` listed as connected, with its tools (for example `board_list`).
- It fails if: it is missing, shows disconnected, or lists no tools.
- Page: Act 5, Tickets, Gemini CLI tab ("Interactive `/mcp list` was not run").

### 7. The openspec commands exist

- Run: `cd ~/workshop/check/gemini-spec`
- Run: `npx -y @fission-ai/openspec init --tools gemini`
- Run: `GEMINI_CLI_TRUST_WORKSPACE=true gemini-workshop -m gemini-3-flash-preview`
- Run (inside Gemini): `/opsx:propose add a footer`
- You should see: files in `.gemini/commands/opsx/` ending in `.toml` (check with `ls .gemini/commands/opsx`), and the command starts a proposal. `/opsx:apply` and `/opsx:archive` should also be recognised (tab completion lists them).
- It fails if: no `.toml` files, or `/opsx:propose` is an unknown command.
- Page: Act 4, Specifications, Gemini CLI tab (propose, apply and archive "not tested interactively").

### 8. Gemini asks you to acknowledge project agents

- Run: `cd ~/workshop/check/gemini-agents`
- Run: `GEMINI_CLI_TRUST_WORKSPACE=true gemini-workshop -m gemini-3-flash-preview`
- You should see: after you type `Use the reviewer agent to review the last commit.`, a prompt asking you to acknowledge the project agent. Accept. Gemini then hands the work to the agent by name.
- It fails if: there is no acknowledgement prompt, or Gemini does the review itself without naming the agent.
- Page: Act 8, Review, and Act 9, The orchestrator, Gemini CLI tabs.

## Cursor

Skip until the monthly usage reset.

### 9. Cursor uses the sandbox folder

- Run: `agent-workshop`
- Run (inside Cursor): `say hello`, then `/quit`
- You should see: the session starts and answers. `~/.cursor-workshop` gets new files. None of your normal skills or hooks show up.
- It fails if: it will not start, writes to `~/.cursor`, or shows your normal skills or hooks.
- Page: Act 1, Cursor tab ("The interactive session was not run").
