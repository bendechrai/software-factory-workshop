# Build your own software factory

A two-day, hands-on workshop guide. It takes you from vibe coding to an autonomous orchestrator around your coding harness.

Read it here: https://bendechrai.github.io/software-factory-workshop/

## Who it is for

Developers who already use a coding agent and want to go further. You should be comfortable with git, Node.js and a terminal. Claude Code is the worked path. Codex CLI, Gemini CLI and Cursor have tabs on the steps that differ.

## The ten acts

| Act | Idea | Link |
|---|---|---|
| 1. The sandbox and the vibe | One sentence to an agent gives you an app that differs every run. | [Act 1](https://bendechrai.github.io/software-factory-workshop/day-1/act-1-the-sandbox-and-the-vibe/) |
| 2. Guardrails | An instructions file and a skill say how work is done here. | [Act 2](https://bendechrai.github.io/software-factory-workshop/day-1/act-2-guardrails/) |
| 3. Gates | Git hooks that the agent cannot argue with. | [Act 3](https://bendechrai.github.io/software-factory-workshop/day-1/act-3-gates/) |
| 4. Specifications | Write down what to build before the agent builds it. | [Act 4](https://bendechrai.github.io/software-factory-workshop/day-1/act-4-specifications/) |
| 5. Tickets | A board on disk that survives a context reset. | [Act 5](https://bendechrai.github.io/software-factory-workshop/day-2/act-5-tickets/) |
| 6. Isolation | One worktree, branch and pull request per ticket. | [Act 6](https://bendechrai.github.io/software-factory-workshop/day-2/act-6-isolation/) |
| 7. Proof | Work is done when it shows evidence, not a claim. | [Act 7](https://bendechrai.github.io/software-factory-workshop/day-2/act-7-proof/) |
| 8. Review | The writer never grades its own work. | [Act 8](https://bendechrai.github.io/software-factory-workshop/day-2/act-8-review/) |
| 9. The orchestrator | One session dispatches the tickets and checks every report. | [Act 9](https://bendechrai.github.io/software-factory-workshop/day-2/act-9-the-orchestrator/) |
| 10. Unattended | A guarded loop runs the factory while you are away. | [Act 10](https://bendechrai.github.io/software-factory-workshop/day-2/act-10-unattended/) |

## Layout

| Path | What it holds |
|---|---|
| `docs/` | The Starlight site. Pages are in `docs/src/content/docs/`. |
| `templates/act-N/` | The files attendees copy for each act. |
| `tools/ledger/` | A script that adds up what each act cost. |
| `bin/check-setup.sh` | Checks your machine before you arrive. |
| `research/` | Notes, demo run logs and walkthrough reports behind the pages. |
| `demo/vibe/` | Three one-prompt builds of the demo app, kept as Act 1 evidence. |

The demo app lives in its own public repository, [hop-demo](https://github.com/bendechrai/hop-demo), with a tag per act. It is not part of this repository.

## Run the site locally

```bash
cd docs && npm install && npm run dev
```

## Status

- Every hands-on step was run on the demo app with Claude Code. Then it was walked through literally from clean folders. There were two walkthroughs, and the defects they found are fixed.
- The Codex CLI tabs were tested with Codex CLI 0.160.0 through OpenRouter. The Cursor tabs were tested with Cursor CLI 2026.10.01 on a Free plan (named models, full propose and apply, and force writes were not testable). The Gemini tabs were tested headless with Gemini CLI 0.62.0 on a free AI Studio key; interactive-only steps (menus, `/mcp list`, `/skills list`, the agent acknowledgement prompt, TOML slash commands) were not run. A full loop with Gemini or Cursor has not been run. Gemini CLI sign-in with a personal Google account failed on 2026-10-02 (client no longer supported); use `GEMINI_API_KEY`.
- The act 10 loop is tested against a fake harness only.
- agentboard is on npm as `@bendechrai/agentboard` (version 0.1.0 at the time of writing), with docs at https://bendechrai.github.io/agentboard/.
