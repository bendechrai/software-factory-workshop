# Four-harness research report (as of 2026-10-01)

All facts were checked against the vendor docs today unless marked UNVERIFIED. Several vendor doc URLs moved: OpenAI's Codex docs now live at `learn.chatgpt.com` (the `developers.openai.com/codex/...` URLs 308-redirect there), and every page there has a Markdown twin at `<url>.md`. Cursor docs also serve `.md` twins (`cursor.com/docs/<page>.md`). Gemini CLI docs are mirrored in the GitHub repo under `docs/`.

Current versions (checked 2026-10-01):

| Harness | Version | Evidence |
|---|---|---|
| Claude Code | **2.1.287** (released 2026-10-01) | https://code.claude.com/docs/en/changelog ; `npm view @anthropic-ai/claude-code version` = 2.1.287; local `claude --version` = `2.1.287 (Claude Code)`; Homebrew `claude-code` stable cask is 2.1.285 (about a week behind by design) |
| Codex CLI | **0.160.0** (GitHub release `rust-v0.160.0`, 2026-10-01) | https://github.com/openai/codex/releases ; npm `@openai/codex` latest = 0.160.0; Homebrew cask `codex` = 0.160.0 |
| Gemini CLI | **0.62.0** (GitHub release `v0.62.0`, 2026-09-29) | https://github.com/google-gemini/gemini-cli/releases ; npm `@google/gemini-cli` latest = 0.62.0; Homebrew formula `gemini-cli` is 0.46.0 (badly behind: use npm) |
| Cursor CLI (`agent`) | Homebrew cask `cursor-cli` = **2026.10.01-14929f9**; the Cursor CLI changelog's latest dated heading is "August 26, 2026 release" | https://cursor.com/docs/cli/changelog ; https://formulae.brew.sh/api/cask/cursor-cli.json . Cursor CLI versions are date-stamped builds, not semver. Exact "current" build number is UNVERIFIED beyond the brew cask. |
| Cursor IDE | Homebrew cask `cursor` = **3.23.12** | https://formulae.brew.sh/api/cask/cursor.json (UNVERIFIED against cursor.com/changelog, which returned empty to curl) |

---

## 1. Claude Code

### 1.1 Fresh, sandboxed config directory
- Env var: **`CLAUDE_CONFIG_DIR`**. Docs: "Override the configuration directory (default: `~/.claude`). All settings, session history, and plugins are stored under this path ... Useful for running multiple accounts side by side: for example, `alias claude-work='CLAUDE_CONFIG_DIR=~/.claude-work claude'`. Set it in your shell, user settings, or managed settings. Ignored in project and local settings" - https://code.claude.com/docs/en/env-vars
- Credentials follow it: "If you've set the `CLAUDE_CONFIG_DIR` environment variable, Claude Code keeps the `.credentials.json` file under that directory instead ... and keys the macOS Keychain entry to that directory too, so a session with a different `CLAUDE_CONFIG_DIR` reads a different entry." - https://code.claude.com/docs/en/authentication . So a fresh dir means a fresh login (`claude auth login`, or set `ANTHROPIC_API_KEY`).
- The `.claude` directory page: "If you set `CLAUDE_CONFIG_DIR`, every `~/.claude` path on this page lives under that directory instead." - https://code.claude.com/docs/en/claude-directory . (That page lists `~/.claude.json`, which holds OAuth session, trust decisions and personal MCP servers, as "Global only"; it is relocated with the config dir per the sentence above.)
- Optional companion: `CLAUDE_CODE_PROJECT_DIR_NAME` (requires v2.1.234+) picks the `projects/<name>` folder for transcripts/auto memory; ignored unless `CLAUDE_CONFIG_DIR` is set. - https://code.claude.com/docs/en/env-vars
- Exact command for the workshop:
  ```bash
  mkdir -p ~/.claude-workshop
  CLAUDE_CONFIG_DIR=~/.claude-workshop claude
  ```
  Note: project-level config in the repo (`./CLAUDE.md`, `./.claude/`, `./.mcp.json`) still loads; only the home-directory config is swapped.
- Disable everything for a session (pick what you need):
  - `--bare`: "skip auto-discovery of hooks, skills, custom commands, subagents, installed plugins, MCP servers, auto memory, and CLAUDE.md ... Sets `CLAUDE_CODE_SIMPLE`". In bare mode OAuth/keychain is not read: "Set `ANTHROPIC_API_KEY` before running it". Recommended for scripts; "will become the default for `-p` in a future release." - https://code.claude.com/docs/en/headless#start-faster-with-bare-mode and https://code.claude.com/docs/en/cli-reference
  - `--safe-mode`: "Start with all customizations disabled ... CLAUDE.md, skills, plugins, hooks, MCP servers, custom commands and agents, output styles, workflows ... do not load. Authentication, model selection, built-in tools, and permissions work normally" (env equivalent `CLAUDE_CODE_SAFE_MODE=1`). - https://code.claude.com/docs/en/cli-reference
  - `--disable-slash-commands`: "Disable all skills and commands for this session". - same page
  - `--strict-mcp-config --mcp-config ./mcp.json`: "Only use MCP servers from `--mcp-config`, ignoring all other MCP configurations". - same page
  - `--disallowedTools "mcp__*"` removes every MCP tool. - same page
  - `--setting-sources user,project,local` chooses which settings files load. - same page
  - Settings keys: `disableAllHooks`, `disabledMcpServers`, `disableClaudeAiConnectors`, `disableBundledSkills`, `skillOverrides`, `autoMemoryEnabled:false`. - https://code.claude.com/docs/en/settings-reference ; env `ENABLE_CLAUDEAI_MCP_SERVERS=false`, `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`. - https://code.claude.com/docs/en/env-vars

### 1.2 Instruction files
Source: https://code.claude.com/docs/en/memory
- Managed policy: macOS `/Library/Application Support/ClaudeCode/CLAUDE.md`, Linux `/etc/claude-code/CLAUDE.md`, Windows `C:\Program Files\ClaudeCode\CLAUDE.md`.
- User: `~/.claude/CLAUDE.md` (under `CLAUDE_CONFIG_DIR` if set); user rules `~/.claude/rules/*.md`.
- Project: `./CLAUDE.md` or `./.claude/CLAUDE.md`; local (gitignored) `./CLAUDE.local.md`; project rules `.claude/rules/*.md` (recursive, optional `paths:` frontmatter glob list). Files in parent directories load at launch; subdirectory files load on demand.
- Imports: `@path/to/file` syntax (relative to the file, max 4 hops). HTML comments are stripped.
- **AGENTS.md is read natively** (requires v2.1.277+): "Claude Code can read `AGENTS.md` as your project instructions, so a repository already set up for other coding agents works without adding a `CLAUDE.md`". Default setting `claude-md-or-agents-md`: AGENTS.md is read only when there is **no** `CLAUDE.md`, `.claude/CLAUDE.md` or `CLAUDE.local.md` in the cwd or any directory above it (your `~/.claude/CLAUDE.md`, managed CLAUDE.md and `.claude/rules/` do NOT count and keep loading alongside). It reads `AGENTS.md` and `.claude/AGENTS.md` from cwd and ancestors, expands `@` imports inside them, and ignores `AGENTS.local.md`, `AGENTS.override.md` and `.agents/`. To always read both, set in `~/.claude/settings.json` (or `--settings`; ignored in project/local settings):
  ```json
  { "pluginConfigs": { "agents-md@builtin": { "options": { "instructionFiles": "claude-md-and-agents-md" } } } }
  ```
  Other values: `claude-md`, `managed-only`. Fallback for older versions or when you also want a CLAUDE.md: a `CLAUDE.md` containing `@AGENTS.md` (never double-loads), or `ln -s AGENTS.md CLAUDE.md` (docs warn: Edit/Write refuse to write through the symlink, and Windows clones break; prefer the import).

### 1.3 Skills / slash commands
Source: https://code.claude.com/docs/en/skills
- Locations: personal `~/.claude/skills/<name>/SKILL.md`; project `.claude/skills/<name>/SKILL.md`; nested `<subdir>/.claude/skills/...`; `--add-dir` dirs; plugins `<plugin>/skills/<name>/SKILL.md` (invoked as `/plugin:skill`). Legacy `.claude/commands/<name>.md` still works: "Commands and skills are now the same mechanism" (https://code.claude.com/docs/en/claude-directory).
- Invocation: `/<name>` (defaults to directory name). Frontmatter (all optional): `name`, `description`, `when_to_use`, `argument-hint`, `arguments`, `disable-model-invocation`, `user-invocable`, `allowed-tools`, `disallowed-tools`, `model`, `effort`, `context: fork`, `agent`, `background`, `hooks`, `paths`, `shell`, `metadata`, `license`, `compatibility`. Substitutions: `$ARGUMENTS`, `$ARGUMENTS[N]`/`$N`, `${CLAUDE_SKILL_DIR}`, `${CLAUDE_PROJECT_DIR}`, `${CLAUDE_SESSION_ID}`; dynamic shell via `` !`cmd` ``.
  ```yaml
  ---
  name: my-skill
  description: What this skill does and when to use it
  disable-model-invocation: true
  ---
  ```
- Skills work in `-p` mode: "Include `/skill-name` in the prompt string and Claude Code expands it before running." - https://code.claude.com/docs/en/headless

### 1.4 Subagents, parallelism, worktrees
Sources: https://code.claude.com/docs/en/sub-agents , https://code.claude.com/docs/en/worktrees , https://code.claude.com/docs/en/cli-reference
- Subagent files: `~/.claude/agents/*.md`, `.claude/agents/*.md`, plugin `agents/`, or `--agents '<json>'` (with `-p` the value may be a JSON file path, v2.1.281+). Frontmatter: `name`, `description` (required); `tools`, `disallowedTools`, `model` (`sonnet|opus|haiku|fable|inherit|<full id>`), `permissionMode`, `maxTurns`, `skills`, `memory`, `effort`, **`isolation: worktree`**, `background`, `omitClaudeMd`, `mcpServers`, `hooks`, `initialPrompt`. Built-ins include Explore and Plan (disable with `CLAUDE_CODE_DISABLE_EXPLORE_PLAN_AGENTS=1`).
- Parallel: subagents run in parallel; cap `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` (default 20, v2.1.217+); nesting depth `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` (default 3). `CLAUDE_CODE_SUBAGENT_MODEL` / `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` pin a model.
- Native worktrees: `claude --worktree <name>` / `claude -w <name>` creates `<repo>/.claude/worktrees/<name>/` on branch `worktree-<name>` (name auto-generated if omitted; `"#1234"` or a PR/MR URL branches from that PR). `-p --worktree` skips the trust check but does not clean up on exit. In-session tools `EnterWorktree` / `ExitWorktree` (ask Claude to "work in a worktree"). `isolation: worktree` on a subagent gives it its own temporary worktree, auto-removed if unchanged. Settings `worktree.baseRef`: `"fresh"` (default, from remote default branch) or `"head"`. `.worktreeinclude` copies gitignored files (e.g. `.env`) into new worktrees. `WorktreeCreate`/`WorktreeRemove` hooks replace git logic. Add `.claude/worktrees/` to `.gitignore`. Isolation is enforced: edits/commands/git redirects into the main checkout are blocked.
- Also: `claude --bg "task"` background sessions, `claude agents` agent view, agent teams (`--teammate-mode`), `/batch`.

### 1.5 Hooks
Source: https://code.claude.com/docs/en/hooks
- Where: `~/.claude/settings.json`, `.claude/settings.json`, `.claude/settings.local.json`, managed settings, plugin `hooks/hooks.json`, skill frontmatter `hooks:`, subagent frontmatter `hooks:`.
- Events: `SessionStart`, `SessionEnd`, `Setup`, `UserPromptSubmit`, `UserPromptExpansion`, `Stop`, `StopFailure`, `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PostToolBatch`, `PermissionRequest`, `PermissionDenied`, `TeammateIdle`, `PreCompact`, `PostCompact`, `PreModelSwitch`, `PostModelSwitch`, `Elicitation`, `ElicitationResult`, `SubagentStart`, `SubagentStop`, `TaskCreated`, `TaskCompleted`, `WorktreeCreate`, `WorktreeRemove`, `CwdChanged`, `DirectoryAdded`, `FileChanged`, `InstructionsLoaded`, `ConfigChange`, `Notification`, `MessageDisplay`.
- Types: `command`, `http`, `mcp_tool`, `prompt`, `agent`.
  ```json
  { "hooks": { "PreToolUse": [ { "matcher": "Bash", "hooks": [ { "type": "command", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/block-rm.sh" } ] } ] } }
  ```
  Command hooks get JSON on stdin and answer via exit code/stdout. Note `${CLAUDE_PROJECT_DIR}` stays at the launch root even inside a worktree; read `cwd` from the hook input JSON for the worktree path (https://code.claude.com/docs/en/worktrees).

### 1.6 Headless / non-interactive
Source: https://code.claude.com/docs/en/headless , https://code.claude.com/docs/en/cli-reference
```bash
claude -p "Run the test suite and fix any failures" --model sonnet --allowedTools "Bash,Read,Edit" --output-format json
claude --bare -p "Summarize README.md" --allowedTools "Read"          # needs ANTHROPIC_API_KEY
claude -p "Apply the lint fixes" --permission-mode acceptEdits --max-turns 20 --max-budget-usd 5
claude -p "..." --permission-mode auto --permission-prompts none       # unattended; v2.1.259+
claude -p "..." --dangerously-skip-permissions                          # = --permission-mode bypassPermissions
claude -p "..." --output-format json --json-schema '{...}' | jq .structured_output
claude -p "..." --output-format stream-json --verbose --include-partial-messages
claude -p "..." --append-system-prompt "You are a security engineer."
session_id=$(claude -p "Start" --output-format json | jq -r .session_id); claude -p "Continue" --resume "$session_id"
```
- Model: `--model <alias|full name>` (aliases `sonnet`, `opus`, `haiku`, `fable`; e.g. `--model claude-sonnet-5`), overrides the `model` setting and `ANTHROPIC_MODEL`. `--fallback-model sonnet,haiku`, `--effort low|medium|high|xhigh|max`.
- Exit code 0 on success, non-zero on failure; stdin capped at 10 MB; `--bg` cannot be combined with `-p`.

### 1.7 MCP config
Source: https://code.claude.com/docs/en/mcp
- Project scope: `.mcp.json` at repo root (committed). User and local scope: `~/.claude.json` (relocated under `CLAUDE_CONFIG_DIR`).
  ```json
  { "mcpServers": {
      "notion": { "type": "http", "url": "https://mcp.notion.com/mcp" },
      "db": { "type": "stdio", "command": "npx", "args": ["-y", "airtable-mcp-server"], "env": { "AIRTABLE_API_KEY": "${AIRTABLE_API_KEY}" } } } }
  ```
- CLI: `claude mcp add --transport http <name> <url> [--scope project|user|local] [--header "Authorization: Bearer x"]`; `claude mcp add --transport stdio <name> --env K=V -- <cmd> [args]`; `claude mcp list|get|remove|login|logout`. Per-run: `--mcp-config <file-or-json>` (+ `--strict-mcp-config`). Disable: `disabledMcpServers` setting, `/mcp` panel toggle, `disableClaudeAiConnectors`.

### 1.8 Install
Source: https://code.claude.com/docs/en/setup
- `curl -fsSL https://claude.ai/install.sh | bash` (macOS/Linux/WSL; auto-updates); Windows PowerShell `irm https://claude.ai/install.ps1 | iex`; `brew install --cask claude-code` (stable) or `claude-code@latest`; `winget install Anthropic.ClaudeCode`; `npm install -g @anthropic-ai/claude-code` (Node 22+); apt/dnf/apk repos. Verify: `claude --version` -> `2.1.287 (Claude Code)`. Pin: `curl -fsSL https://claude.ai/install.sh | bash -s 2.1.287`.

---

## 2. OpenAI Codex CLI

### 2.1 Fresh config directory
- Env var: **`CODEX_HOME`** (default `~/.codex`): "Sets the root for Codex state, including config, auth, logs, sessions, skills, and standalone package metadata. **If you set it, the directory must already exist.**" - https://learn.chatgpt.com/docs/config-file/environment-variables
- Auth lives in `CODEX_HOME/auth.json` (https://learn.chatgpt.com/docs/config-file/config-reference, `cli_auth_credentials_store`), so a fresh dir needs `codex login` again, or `CODEX_API_KEY` for `codex exec` (https://learn.chatgpt.com/docs/non-interactive-mode#use-api-key-auth).
- Exact command:
  ```bash
  mkdir -p ~/.codex-workshop
  CODEX_HOME=~/.codex-workshop codex
  ```
  The AGENTS.md doc shows the same pattern: `CODEX_HOME=$(pwd)/.codex codex exec "List active instruction sources"` - https://learn.chatgpt.com/docs/agent-configuration/agents-md
- Caveat (important for "lose none of your skills"): user skills are read from **`$HOME/.agents/skills`**, not from `CODEX_HOME` (https://learn.chatgpt.com/docs/build-skills#where-codex-loads-local-skills), so a fresh `CODEX_HOME` still sees personal skills in `~/.agents/skills`. Whether `CODEX_HOME` changes that path is UNVERIFIED (docs say `$HOME`). Project `.codex/config.toml` layers load only when the project is trusted (https://learn.chatgpt.com/docs/config-file/config-basic#configuration-precedence).
- Per-run switches: `--ignore-user-config` ("Do not load `$CODEX_HOME/config.toml`; auth still uses `CODEX_HOME`"), `--ignore-rules`, `--ephemeral` (no session files on disk), `-c key=value` overrides, `--profile <name>` / `-p <name>` layers `$CODEX_HOME/<name>.config.toml`. - https://learn.chatgpt.com/docs/non-interactive-mode and https://github.com/openai/codex/blob/main/codex-rs/exec/src/cli.rs
- Disable things in `config.toml`: MCP `[mcp_servers.<id>] enabled = false`; skills `[[skills.config]] path = "/path/to/SKILL.md" enabled = false`; hooks `[features] hooks = false`; subagents `[agents] enabled = false`. - https://learn.chatgpt.com/docs/config-file/config-reference , https://learn.chatgpt.com/docs/build-skills , https://learn.chatgpt.com/docs/hooks , https://learn.chatgpt.com/docs/agent-configuration/subagents

### 2.2 Instruction files (AGENTS.md is THE native file)
Source: https://learn.chatgpt.com/docs/agent-configuration/agents-md
- Global: `$CODEX_HOME/AGENTS.override.md` if present, else `$CODEX_HOME/AGENTS.md` (i.e. `~/.codex/AGENTS.md`).
- Project: from the Git root down to cwd, in each directory the first of `AGENTS.override.md`, `AGENTS.md`, then names in `project_doc_fallback_filenames`; at most one file per directory; concatenated root-down; stops at `project_doc_max_bytes` (default 32 KiB). Empty files skipped.
- Codex does NOT read `CLAUDE.md` or `GEMINI.md` unless you add them: `project_doc_fallback_filenames = ["CLAUDE.md"]` in `~/.codex/config.toml`.
- Config precedence (highest first): CLI flags / `-c`; project `.codex/config.toml` (root to cwd, trusted only); profile; `~/.codex/config.toml`; cloud-managed; `/etc/codex/config.toml`; defaults. - https://learn.chatgpt.com/docs/config-file/config-basic

### 2.3 Skills (custom prompts are deprecated in favour of skills)
Source: https://learn.chatgpt.com/docs/build-skills (custom prompts: "Deprecated. Use skills for reusable prompts" per https://learn.chatgpt.com/llms.txt)
- Locations: `$CWD/.agents/skills`, every parent `.agents/skills` up to `$REPO_ROOT/.agents/skills`, `$HOME/.agents/skills`, `/etc/codex/skills`, plus bundled system skills. Symlinked skill folders are followed.
- Format:
  ```md
  ---
  name: skill-name
  description: Explain exactly when this skill should and should not trigger.
  ---
  Skill instructions...
  ```
- Invoke explicitly with `$skill-name` in the prompt (e.g. `$skill-creator`); Codex also auto-selects by description. Disable per skill via `[[skills.config]]` (see 2.1).

### 2.4 Subagents / parallel agents / worktrees
Source: https://learn.chatgpt.com/docs/agent-configuration/subagents , https://learn.chatgpt.com/docs/config-file/config-reference
- Enabled by default (`agents.enabled = true`; `features.multi_agent` exposes `spawn_agent`, `send_input`, `resume_agent`, `wait_agent`, `close_agent`, "stable; on by default"). Built-in agents: `default`, `worker`, `explorer`. Triggered by asking ("spawn one agent per point, wait for all"); `/agent` in the TUI switches threads.
- Custom agents: standalone TOML files in `~/.codex/agents/` (personal) or `.codex/agents/` (project); required keys `name`, `description`, `developer_instructions`; may also set `model`, `model_reasoning_effort`, `sandbox_mode`, `mcp_servers`, `skills.config`.
- `[agents]` keys: `enabled`, `max_concurrent_threads_per_session` (legacy alias `max_threads`), `default_subagent_model`, `default_subagent_reasoning_effort`, `interrupt_message`.
- Worktrees: documented only for Codex in the **ChatGPT desktop app** ("Worktree" option under the composer; `.codex` local-environment setup scripts run when a worktree is created) - https://learn.chatgpt.com/docs/environments/git-worktrees and https://learn.chatgpt.com/docs/environments/local-environment . The main-branch source adds a CLI flag `--worktree` ("Run the session in a new managed Git worktree") in `codex-rs/utils/cli/src/shared_options.rs` (https://github.com/openai/codex/blob/main/codex-rs/utils/cli/src/shared_options.rs), but it is not in the docs and whether it is in 0.160.0 is **UNVERIFIED**; treat CLI worktrees as "use `git worktree add` yourself and `codex -C <dir>`".

### 2.5 Hooks
Source: https://learn.chatgpt.com/docs/hooks
- Enabled by default (`[features] hooks = false` turns off; `codex_hooks` is a deprecated alias). Locations: `~/.codex/hooks.json`, inline `[hooks]` in `~/.codex/config.toml`, `<repo>/.codex/hooks.json`, `<repo>/.codex/config.toml` (project hooks only when the project is trusted; all matching sources merge).
- Events: `SessionStart`, `SessionEnd`, `SubagentStart`, `SubagentStop`, `PreToolUse`, `PermissionRequest`, `PostToolUse`, `PreCompact`, `PostCompact`, `UserPromptSubmit`, `Stop`, `Interrupt`.
- Handlers: `command` and `mcp_tool` ("`prompt` and `agent` handlers are parsed but skipped"). `timeout` is in **seconds** (default 600). Same three-level shape as Claude Code:
  ```json
  { "hooks": { "PreToolUse": [ { "matcher": "Bash", "hooks": [ { "type": "command", "command": "python3 \"$(git rev-parse --show-toplevel)/.codex/hooks/pre_tool_use_policy.py\"", "timeout": 30 } ] } ] } }
  ```
  TOML equivalent uses `[[hooks.PreToolUse]]` / `[[hooks.PreToolUse.hooks]]` tables.

### 2.6 Headless
Source: https://learn.chatgpt.com/docs/non-interactive-mode , flag names from https://github.com/openai/codex/blob/main/codex-rs/exec/src/cli.rs and https://github.com/openai/codex/blob/main/codex-rs/utils/cli/src/shared_options.rs
```bash
codex exec "summarize the repository structure"                       # read-only sandbox by default; final message on stdout, progress on stderr
codex exec -m gpt-5.5-codex --sandbox workspace-write "fix the failing tests"
codex exec --json "..." | jq                                           # JSONL events: thread.started, turn.started, item.*, turn.completed
codex exec -o final.md "..."                                           # --output-last-message FILE
codex exec --output-schema schema.json "..."                           # structured final response
codex exec -C /path/to/repo --ephemeral --skip-git-repo-check "..."
codex exec --ignore-user-config -c 'approval_policy="never"' "..."
codex exec --dangerously-bypass-approvals-and-sandbox "..."            # alias --yolo; only inside an external sandbox
codex exec resume --last "continue"
```
- Model: `-m/--model <name>` ("Override the configured model for this run"); config key `model`. Sandbox: `-s/--sandbox read-only|workspace-write|danger-full-access`. `--full-auto` is deprecated (prints a warning). Docs also use `--ask-for-approval never` / `-a` (https://learn.chatgpt.com/docs/agent-configuration/agents-md); it is not present in the main-branch shared-options struct, so prefer `-c approval_policy="never"` if a future build drops it (UNVERIFIED which build). Note **`-p` means `--profile` in Codex, not prompt**. Auth for automation: `CODEX_API_KEY`. Requires a Git repo unless `--skip-git-repo-check`.

### 2.7 MCP config
Source: https://learn.chatgpt.com/docs/extend/mcp
- File: `~/.codex/config.toml` (or project `.codex/config.toml`), table per server:
  ```toml
  [mcp_servers.context7]
  command = "npx"
  args = ["-y", "@upstash/context7-mcp"]
  env = { MY_ENV_VAR = "MY_ENV_VALUE" }
  enabled = true          # false disables without deleting

  [mcp_servers.remote]
  url = "https://mcp.example.com"
  bearer_token_env_var = "MCP_TOKEN"
  ```
  Other keys: `cwd`, `env_vars`, `http_headers`, `env_http_headers`, `startup_timeout_sec` (10), `tool_timeout_sec` (60), `required`, `enabled_tools`, `disabled_tools`, `default_tools_approval_mode`.
- CLI: `codex mcp add <name> --env K=V -- <cmd> [args]`; `codex mcp add <name> --url https://...`; `codex mcp list|get|remove|login|logout`; `/mcp` in the TUI.

### 2.8 Install
Source: https://learn.chatgpt.com/docs/codex/cli
- `curl -fsSL https://chatgpt.com/codex/install.sh | sh` (same command updates; `CODEX_NON_INTERACTIVE=1` for unattended); Windows `powershell -ExecutionPolicy ByPass -c "irm https://chatgpt.com/codex/install.ps1 | iex"`; `npm install -g @openai/codex`; `brew install --cask codex`. Verify `codex --version` (0.160.0).

---

## 3. Gemini CLI

### 3.1 Fresh config directory
- Env var: **`GEMINI_CLI_HOME`**: "Specifies the root directory for Gemini CLI's user-level configuration and storage. By default, this is the user's system home directory. The CLI will create a `.gemini` folder inside this directory. Useful for shared compute environments or keeping CLI state isolated." - https://github.com/google-gemini/gemini-cli/blob/main/docs/reference/configuration.md (also https://geminicli.com/docs/reference/configuration/)
- Note it is a **parent of `.gemini`**, not the `.gemini` dir itself:
  ```bash
  mkdir -p ~/gemini-workshop
  GEMINI_CLI_HOME=~/gemini-workshop gemini        # uses ~/gemini-workshop/.gemini/settings.json etc.
  ```
  OAuth credentials and `settings.json` live in that `.gemini`, so expect to re-authenticate (or set `GEMINI_API_KEY`). Project `.gemini/settings.json` still loads. Whether the `~/.agents/skills` alias follows `GEMINI_CLI_HOME` is UNVERIFIED (docs say `~/.agents/skills/`).
- System-level overrides: `GEMINI_CLI_SYSTEM_SETTINGS_PATH`, `GEMINI_CLI_SYSTEM_DEFAULTS_PATH` (defaults `/etc/gemini-cli/settings.json`, macOS `/Library/Application Support/GeminiCli/settings.json`). - same page
- Disable for a session: MCP `"mcp": { "allowed": [...], "excluded": [...] }` in settings.json, or `--allowed-mcp-server-names <names>` flag; extensions `-e/--extensions <list>` ("If not provided, all extensions are enabled"), `gemini extensions disable <name>`; skills `"skills": { "enabled": false }` or `gemini skills disable --all`; hooks `"hooksConfig": { "enabled": false }`; subagents `"experimental": { "enableAgents": false }`. - https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/settings.md , https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/cli-reference.md , https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md

### 3.2 Instruction files
Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/gemini-md.md (also https://geminicli.com/docs/cli/gemini-md/)
- Default filename `GEMINI.md`. Global `~/.gemini/GEMINI.md`; workspace: cwd and parent directories; subdirectories just-in-time when tools touch them. `@file.md` imports. `/memory show`, `/memory reload`.
- **AGENTS.md is not read by default**; `context.fileName` default is `undefined` (= `GEMINI.md`). Set in `.gemini/settings.json` (project) or `~/.gemini/settings.json`:
  ```json
  { "context": { "fileName": ["AGENTS.md", "GEMINI.md"] } }
  ```
- Settings precedence: system defaults < `~/.gemini/settings.json` < `.gemini/settings.json` < system overrides.

### 3.3 Custom commands and skills
- Custom commands (TOML): `~/.gemini/commands/*.toml` (global) and `<project>/.gemini/commands/*.toml` (project overrides global). `prompt` required, `description` optional; subfolders namespace with `:` (`git/commit.toml` -> `/git:commit`); `{{args}}`, shell `!{...}`, file `@{path}`. - https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/custom-commands.md
  ```toml
  description = "Commit staged changes"
  prompt = "Write a commit message for: !{git diff --staged}"
  ```
- Skills: user `~/.gemini/skills/` or alias `~/.agents/skills/`; workspace `.gemini/skills/` or `.agents/skills/` (alias wins within a tier). `SKILL.md` frontmatter `name` (matches dir) and `description`. Manage with `/skills list|enable|disable|reload` and `gemini skills list|install <src> --consent|link|enable|disable [--all]`. - https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/skills.md , https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/creating-skills.md

### 3.4 Subagents / worktrees
- Subagents enabled by default; built-ins `codebase_investigator`, `cli_help`, `generalist`, `browser_agent`. Custom: `.gemini/agents/*.md` (project) or `~/.gemini/agents/*.md`; frontmatter `name`, `description` (required), `kind: local|remote`, `tools` (wildcards `*`, `mcp_*`), `mcpServers`, `model` (default inherit), `temperature`, `max_turns` (30), `timeout_mins` (10); body is the system prompt; force with `@agent-name`. Parallel execution of subagents is not documented (UNVERIFIED). - https://github.com/google-gemini/gemini-cli/blob/main/docs/core/subagents.md
- Worktrees (experimental): enable `{"experimental": {"worktrees": true}}`, then `gemini --worktree <name>` / `-w` creates `.gemini/worktrees/<name>` (random name if omitted). Not auto-deleted on exit; resume with `cd .gemini/worktrees/<name> && gemini --resume <session_id>`; cleanup `git worktree remove .gemini/worktrees/<name> --force && git branch -D worktree-<name>`. - https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/git-worktrees.md

### 3.5 Hooks
Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/hooks/index.md , https://github.com/google-gemini/gemini-cli/blob/main/docs/hooks/reference.md
- In `settings.json` (`.gemini/settings.json` > `~/.gemini/settings.json` > `/etc/gemini-cli/settings.json` > extensions) under `hooks`. Events: `SessionStart`, `SessionEnd`, `BeforeAgent`, `AfterAgent`, `BeforeModel`, `AfterModel`, `BeforeToolSelection`, `BeforeTool`, `AfterTool`, `PreCompress`, `Notification`. Only `type: "command"`; `timeout` in **milliseconds** (default 60000); tool matchers are regex.
  ```json
  { "hooks": { "BeforeTool": [ { "matcher": "write_file|replace", "hooks": [ { "name": "security-check", "type": "command", "command": "$GEMINI_PROJECT_DIR/.gemini/hooks/security.sh", "timeout": 5000 } ] } ] } }
  ```
  Env in hooks: `GEMINI_PROJECT_DIR`, `GEMINI_SESSION_ID`, `GEMINI_CWD`, plus `CLAUDE_PROJECT_DIR` alias for compatibility.

### 3.6 Headless
Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/headless.md , https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/cli-reference.md
```bash
gemini -p "summarize this repo" -m gemini-2.5-pro --output-format json
gemini -p "fix the failing tests" --approval-mode yolo --skip-trust     # -y/--yolo deprecated
gemini -p "..." -o stream-json                                          # JSONL: init, message, tool_use, tool_result, error, result
cat log.txt | gemini -p "explain"                                       # -p is appended to stdin
```
- `-p/--prompt` forces non-interactive; `-m/--model` (aliases `auto`, `pro`, `flash`, `flash-lite`, or a concrete name; env `GEMINI_MODEL`); `--approval-mode default|auto_edit|yolo|plan`; `-s/--sandbox`; `--include-directories`; `-r/--resume`; `-i/--prompt-interactive`. Exit codes: 0 success, 1 error, 42 input error, 53 turn limit.

### 3.7 MCP config
Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md
```json
{ "mcpServers": { "github": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-github"], "env": { "GITHUB_TOKEN": "$GITHUB_TOKEN" }, "timeout": 30000, "trust": false } },
  "mcp": { "allowed": ["github"], "excluded": [] } }
```
in `~/.gemini/settings.json` or `.gemini/settings.json`; `$VAR`/`${VAR}` expansion. CLI: `gemini mcp add <name> <cmd> [args] [--env K=V] [--scope user] [--include-tools a,b]`, `gemini mcp add <name> <url> --transport http`, `gemini mcp list|remove`; `/mcp` in session.

### 3.8 Install
Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/get-started/installation.mdx
- `npm install -g @google/gemini-cli` (recommended; 0.62.0), `brew install gemini-cli` (0.46.0, behind), `npx @google/gemini-cli`, MacPorts. Verify `gemini --version`.

---

## 4. Cursor (CLI `agent` and IDE)

### 4.1 Fresh config directory
- CLI: config file `~/.cursor/cli-config.json` (Windows `$env:USERPROFILE\.cursor\cli-config.json`); project-level `<project>/.cursor/cli.json` (permissions only). "Override with environment variables: **`CURSOR_CONFIG_DIR`**: custom directory path; `XDG_CONFIG_HOME` (Linux/BSD): uses `$XDG_CONFIG_HOME/cursor/cli-config.json`." - https://cursor.com/docs/cli/reference/configuration
  ```bash
  mkdir -p ~/.cursor-workshop
  CURSOR_CONFIG_DIR=~/.cursor-workshop agent
  ```
  **UNVERIFIED**: the docs only tie `CURSOR_CONFIG_DIR` to `cli-config.json`; whether it also relocates `~/.cursor/mcp.json`, `~/.cursor/hooks.json`, `~/.cursor/skills/`, `~/.cursor/agents/` and auth is not documented. Safer workshop plan: don't rely on it; disable per-item (`agent mcp disable <id>`, remove `~/.cursor/hooks.json` temporarily) or use a throwaway OS user. Auth for scripts: `--api-key` / `CURSOR_API_KEY`.
- IDE: no documented "fresh profile" switch found (a VS Code-style `--user-data-dir` is UNVERIFIED for Cursor). Use IDE profiles or a separate OS user.
- There is no documented global "no MCP / no plugins" flag for `agent`; `agent mcp disable <identifier>` ("Disabled servers won't load or prompt for approval"), `--approve-mcps` is the opposite. - https://cursor.com/docs/cli/mcp

### 4.2 Instruction files
Source: https://cursor.com/docs/rules , https://cursor.com/docs/cli/using
- Project rules: `.cursor/rules/*.mdc` (subfolders allowed; plain `.md` ignored). Frontmatter: `description`, `globs`, `alwaysApply`. Types: Always Apply (`alwaysApply: true`), Apply to Specific Files (`globs`), Apply Intelligently (`description`), Apply Manually (`@rule-name`).
  ```md
  ---
  description: RPC service conventions
  globs: src/services/**/*.ts
  alwaysApply: false
  ---
  ```
- User rules: global, set in the app ("Global to your Cursor environment"). Team rules: dashboard (Team/Enterprise).
- **AGENTS.md native**: "Place it in your project root as an alternative to `.cursor/rules`"; "Nested `AGENTS.md` support in subdirectories is now available." The CLI additionally "reads `AGENTS.md` and `CLAUDE.md` at the project root (if present) and applies them as rules alongside `.cursor/rules`" (https://cursor.com/docs/cli/using). `.cursorrules` is no longer mentioned in current docs.

### 4.3 Skills / commands
Source: https://cursor.com/docs/skills
- Locations: `.agents/skills/`, `.cursor/skills/` (project, nested subdirs auto-scoped), `~/.agents/skills/`, `~/.cursor/skills/` (user). "For compatibility, Cursor also loads skills from Claude and Codex directories: `.claude/skills/`, `.codex/skills/`, `~/.claude/skills/`, and `~/.codex/skills/`."
- `SKILL.md` frontmatter: `name` (required, matches folder), `description` (required), `paths`, `disable-model-invocation`, `icon`, `color`, `metadata`. Invoke with `/skill-name` (Option+Enter makes it a sticky Custom Mode). Built-ins include `/create-skill`, `/create-rule`, `/create-hook`, `/create-subagent`, `/review`, `/loop`, `/migrate-to-skills` ("Converts eligible dynamic rules and slash commands into Agent Skills"). Legacy `.cursor/commands/*.md` is not in current docs (UNVERIFIED whether still loaded).

### 4.4 Subagents, parallel agents, worktrees
Sources: https://cursor.com/docs/subagents , https://cursor.com/docs/cli/reference/parameters , https://cursor.com/docs/configuration/worktrees , https://cursor.com/docs/agent/agents-window
- Subagent files: project `.cursor/agents/*.md` (also `.claude/agents/`, `.codex/agents/` for compatibility); user `~/.cursor/agents/` (also `~/.claude/agents/`, `~/.codex/agents/`); `.cursor/` wins on name clash. Frontmatter: `name`, `description`, `model` (`inherit` or id), `readonly`, `is_background`. Built-ins: Explore, Bash, Browser. Parallel: "Agent sends multiple Task tool calls in a single message, so subagents run simultaneously"; each subagent can get "an isolated Git worktree with a separate working directory on the same machine, or its own cloud environment".
- CLI worktrees (native): `-w, --worktree [name]` "Run in a new Git worktree under `~/.cursor/worktrees/<reponame>/<name>`. If omitted, a name is generated."; `--worktree-base <branch>` (default current HEAD); `--skip-worktree-setup`. Setup script file `.cursor/worktrees.json` with `setup-worktree`, `setup-worktree-unix`, `setup-worktree-windows` (command arrays or a script path). IDE: Agents Window runs parallel agents; `/worktree` ("do the rest of that chat in a separate checkout"), `/best-of-n`, `/apply-worktree`, `/delete-worktree`; `cursor.worktreeMaxCount` default 25.
  ```bash
  agent -p --force -w feature-auth --worktree-base main "implement the auth refactor"
  ```

### 4.5 Hooks
Source: https://cursor.com/docs/hooks
- Files: `<project>/.cursor/hooks.json`, `~/.cursor/hooks.json`, enterprise `/Library/Application Support/Cursor/hooks.json`, `/etc/cursor/hooks.json`, `C:\ProgramData\Cursor\hooks.json`. `version: 1` is required. Scripts run from `~/.cursor/` for user hooks and from the project root for project hooks (use `.cursor/hooks/...`).
  ```json
  { "version": 1, "hooks": { "afterFileEdit": [ { "command": "./hooks/format.sh" } ] } }
  ```
- Events: `sessionStart`, `sessionEnd`, `preToolUse`, `postToolUse`, `postToolUseFailure`, `subagentStart`, `subagentStop`, `beforeShellExecution`, `afterShellExecution`, `beforeMCPExecution`, `afterMCPExecution`, `beforeReadFile`, `afterFileEdit`, `beforeSubmitPrompt`, `preCompact`, `stop`, `afterAgentResponse`, `afterAgentThought`; Tab hooks `beforeTabFileRead`, `afterTabFileEdit`; app `workspaceOpen`. Types: command-based and prompt-based. Hooks communicate over stdio JSON. Cloud agents run project hooks only.

### 4.6 Headless
Sources: https://cursor.com/docs/cli/headless , https://cursor.com/docs/cli/reference/parameters
```bash
agent -p "find and fix performance issues" --model "gpt-5" --output-format json
agent -p --force "Refactor this code to use modern ES6+ syntax"        # --force/--yolo lets it write files; without it changes are only proposed
agent -p --trust --workspace /path/to/repo --output-format stream-json --stream-partial-output "..."
agent -p --mode plan "..."                                               # modes: plan, ask (agent is default)
agent --continue / agent --resume <chatId> / agent ls
agent models   # or --list-models
```
- Binary name is `agent` (docs); `--api-key <key>` or `CURSOR_API_KEY`; `--sandbox enabled|disabled`; `--approve-mcps`; `--plugin-dir <path>`. Headless/single-turn runs wait for their subagents to finish (CLI changelog, Aug 11 2026).

### 4.7 MCP config
Source: https://cursor.com/docs/mcp (CLI uses the same files: https://cursor.com/docs/cli/mcp)
- `.cursor/mcp.json` (project) and `~/.cursor/mcp.json` (global); precedence project > global > nested discovery from parent dirs.
  ```json
  { "mcpServers": {
      "local": { "command": "npx", "args": ["-y", "mcp-server"], "env": { "API_KEY": "${env:API_KEY}" } },
      "remote": { "url": "https://api.example.com/mcp", "headers": { "Authorization": "Bearer ${env:MY_SERVICE_TOKEN}" } } } }
  ```
  Variables: `${env:NAME}`, `${userHome}`, `${workspaceFolder}`. CLI: `agent mcp list|list-tools <id>|login <id>|enable <id>|disable <id>`.

### 4.8 Install
Source: https://cursor.com/docs/cli/installation
- `curl https://cursor.com/install -fsS | bash` (macOS/Linux/WSL, installs to `~/.local/bin`); Windows `irm 'https://cursor.com/install?win32=true' | iex`; Homebrew cask `cursor-cli`. Verify `agent --version`; update `agent update` (auto-updates by default).

---

## AGENTS.md across all four

| Harness | Reads `AGENTS.md` natively? | Condition | Source |
|---|---|---|---|
| Codex CLI | Yes, it is the primary file | Always; global `~/.codex/AGENTS.md` + repo tree | https://learn.chatgpt.com/docs/agent-configuration/agents-md |
| Cursor (IDE + CLI) | Yes | Root and nested subdirectories; CLI also reads root `CLAUDE.md` | https://cursor.com/docs/rules , https://cursor.com/docs/cli/using |
| Claude Code | Yes (v2.1.277+) | Only when no `CLAUDE.md` / `.claude/CLAUDE.md` / `CLAUDE.local.md` exists in cwd or above; `~/.claude/CLAUDE.md` does not block it. Set `instructionFiles: claude-md-and-agents-md` to read both | https://code.claude.com/docs/en/memory#agents-md |
| Gemini CLI | No by default | Set `{"context":{"fileName":["AGENTS.md","GEMINI.md"]}}` in `.gemini/settings.json` (commit it) | https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/gemini-md.md |

Recommended single-file layout for the workshop repo:
1. `AGENTS.md` at repo root (the one shared file).
2. No `CLAUDE.md` (Claude Code then reads AGENTS.md directly), or, if attendees need Claude-specific notes, a `CLAUDE.md` whose first line is `@AGENTS.md` (docs-recommended; avoid the symlink on Windows).
3. Commit `.gemini/settings.json` with `context.fileName` including `AGENTS.md`.
4. Nothing extra for Cursor or Codex.

## Comparison table

| Capability | Claude Code 2.1.287 | Codex CLI 0.160.0 | Gemini CLI 0.62.0 | Cursor CLI (agent, 2026.10 build) |
|---|---|---|---|---|
| Fresh home dir | `CLAUDE_CONFIG_DIR=<dir> claude` (dir auto-created; creds follow) | `mkdir -p <dir>; CODEX_HOME=<dir> codex` (must pre-exist; creds inside; `~/.agents/skills` still loads) | `GEMINI_CLI_HOME=<parent> gemini` (creates `<parent>/.gemini`) | `CURSOR_CONFIG_DIR=<dir> agent` (scope beyond cli-config.json UNVERIFIED) |
| Session-wide "disable all" | `--bare` (needs API key), `--safe-mode`, `--disable-slash-commands`, `--strict-mcp-config` | `--ignore-user-config`, `--ignore-rules`, `[features] hooks=false`, `[agents] enabled=false` | `-e <list>`, `mcp.excluded`, `skills.enabled`, `hooksConfig.enabled`, `experimental.enableAgents` | `agent mcp disable <id>` only |
| Project instructions | `CLAUDE.md`, `.claude/CLAUDE.md`, `CLAUDE.local.md`, `.claude/rules/*.md`; AGENTS.md native (fallback mode) | `AGENTS.md` / `AGENTS.override.md` per dir, `~/.codex/AGENTS.md` | `GEMINI.md` (+ `context.fileName`) | `.cursor/rules/*.mdc`, `AGENTS.md` (nested), CLI also `CLAUDE.md` |
| User-level instructions | `~/.claude/CLAUDE.md`, `~/.claude/rules/` | `~/.codex/AGENTS.md` | `~/.gemini/GEMINI.md` | User Rules (app setting) |
| Skills / commands | `.claude/skills/<n>/SKILL.md`, `~/.claude/skills/`, legacy `.claude/commands/*.md`; `/name` | `.agents/skills/<n>/SKILL.md` (repo tree), `~/.agents/skills`, `/etc/codex/skills`; `$name` | `.gemini/skills` or `.agents/skills` (+ `~/`); TOML commands `.gemini/commands/*.toml`; `/name`, `/ns:name` | `.cursor/skills`, `.agents/skills` (+ `~/`), plus `.claude/skills`, `.codex/skills`; `/name` |
| Subagents | `.claude/agents/*.md`, `~/.claude/agents/`, `--agents <json>`; parallel (cap 20) | `.codex/agents/*.toml`, `~/.codex/agents/`; spawn on request; `agents.max_concurrent_threads_per_session` | `.gemini/agents/*.md`, `~/.gemini/agents/`; parallelism undocumented | `.cursor/agents/*.md` (+ `.claude/agents`, `.codex/agents`); parallel Task calls |
| Native worktrees | `claude -w <name>` -> `.claude/worktrees/<name>`; `EnterWorktree`; `isolation: worktree`; `worktree.baseRef`; `.worktreeinclude` | Desktop app only (documented); CLI `--worktree` in source, UNVERIFIED | `experimental.worktrees:true` + `gemini -w <name>` -> `.gemini/worktrees/<name>` | `agent -w [name] --worktree-base <ref>` -> `~/.cursor/worktrees/<repo>/<name>`; `.cursor/worktrees.json`; IDE `/worktree`, `/best-of-n` |
| Hooks file | `settings.json` `hooks` (user/project/local), plugin, skill/agent frontmatter | `.codex/hooks.json`, `~/.codex/hooks.json`, `[hooks]` in config.toml | `settings.json` `hooks` | `.cursor/hooks.json`, `~/.cursor/hooks.json` (`version: 1`) |
| Key hook events | Pre/PostToolUse, Stop, SessionStart/End, SubagentStart/Stop, UserPromptSubmit, WorktreeCreate/Remove, +many | SessionStart/End, PreToolUse, PostToolUse, PermissionRequest, UserPromptSubmit, Stop, SubagentStart/Stop, Pre/PostCompact, Interrupt | BeforeTool/AfterTool, BeforeAgent/AfterAgent, BeforeModel/AfterModel, SessionStart/End, PreCompress, Notification | preToolUse/postToolUse, beforeShellExecution, afterFileEdit, beforeSubmitPrompt, stop, sessionStart/End, subagentStart/Stop |
| Hook timeout unit | seconds | seconds (default 600) | milliseconds (default 60000) | n/a in docs |
| Headless | `claude -p "..." --model X --output-format json\|stream-json --allowedTools ... --permission-mode ...` | `codex exec "..." -m X --sandbox workspace-write --json -o out.md` | `gemini -p "..." -m X -o json\|stream-json --approval-mode yolo` | `agent -p "..." --model X --output-format json\|stream-json --force --trust` |
| Model flag | `--model` (`sonnet`, `opus`, `haiku`, `fable`, full id) | `-m/--model` | `-m/--model` (`auto`, `pro`, `flash`, `flash-lite`, full id) | `--model` (`agent models` lists) |
| MCP config | `.mcp.json` (project), `~/.claude.json` (user/local), `--mcp-config` | `[mcp_servers.<n>]` in `~/.codex/config.toml` or `.codex/config.toml` | `mcpServers` in `.gemini/settings.json` / `~/.gemini/settings.json` | `.cursor/mcp.json`, `~/.cursor/mcp.json` |
| Install | `curl -fsSL https://claude.ai/install.sh \| bash`; `brew install --cask claude-code`; `npm i -g @anthropic-ai/claude-code` | `curl -fsSL https://chatgpt.com/codex/install.sh \| sh`; `npm i -g @openai/codex`; `brew install --cask codex` | `npm i -g @google/gemini-cli`; `brew install gemini-cli` | `curl https://cursor.com/install -fsS \| bash`; brew cask `cursor-cli` |
| Version check | `claude --version` | `codex --version` | `gemini --version` | `agent --version` |

## Gotchas worth putting in the guide
- `-p` means **prompt** in Claude Code, Gemini CLI and Cursor, but **profile** in Codex (`codex exec "prompt"` takes the prompt positionally).
- Hook `timeout` is seconds in Claude Code and Codex, milliseconds in Gemini CLI.
- Claude Code `--bare` ignores OAuth; set `ANTHROPIC_API_KEY`. Codex `exec` in CI: `CODEX_API_KEY`. Cursor: `CURSOR_API_KEY`. Gemini: `GEMINI_API_KEY`.
- Codex `CODEX_HOME` must exist before launch; Claude Code creates `CLAUDE_CONFIG_DIR` itself; Gemini creates `.gemini` inside `GEMINI_CLI_HOME`.
- Claude Code reads `AGENTS.md` natively only when there is no `CLAUDE.md` anywhere on the path; adding a `CLAUDE.local.md` silently switches it off (use `claude-md-and-agents-md`).
- Non-interactive worktree runs (`claude -p --worktree`, Gemini `-w`) are not cleaned up automatically; script `git worktree remove` yourself.
- Cursor and Gemini both honour the `.agents/skills/` convention that Codex uses, and Cursor also reads `.claude/skills` and `.claude/agents`, so `.agents/skills/` is the most portable skills location (Claude Code does not read it; keep a `.claude/skills/` copy or symlink for Claude).

Scratch copies of every fetched doc page are in `/private/tmp/claude-501/-Users-ben-Projects-software-factory-workshop/6bd3b073-6ab7-41c0-9ad8-75c1b35a8051/scratchpad/{codex,gemini,cursor}/` and `cc-*.md` if the guide author wants to quote more.