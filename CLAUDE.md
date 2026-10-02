# Software factory workshop

A two-day workshop, published as an Astro Starlight site in `docs/`, that takes a developer from vibe coding to running an autonomous orchestrator around their coding harness. Every hands-on step is proven in `demo/` before it is written down.

## Rules for working in this repository

- The docs are only written from steps that were actually run in `demo/`. If a step was not run, the page says so.
- Attendee-facing text: plain words, short sentences, keyboard characters only (plain hyphen, straight quotes). Comparisons as fractions, percentages or "N times as many".
- Claude Code is the worked path. Codex CLI, Gemini CLI and Cursor get tabs on harness-specific steps, marked as written from their docs.
- Commit messages carry no attribution.
- `cd docs && npm run build` must pass before a commit.

## Layout

| Path | What it holds |
|---|---|
| `docs/` | The Starlight site. Pages in `docs/src/content/docs/`. |
| `demo/vibe/` | Three one-prompt builds of the demo app, kept as Act 1 evidence. |
| `demo/hop/` | The demo app built through the acts, with a git tag per act. |
| `templates/` | The files attendees copy: AGENTS.md, skills, hooks, scripts. |
