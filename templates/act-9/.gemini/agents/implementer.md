---
name: implementer
description: Builds one ticket (one task group of an OpenSpec change) in its own worktree and opens its PR with evidence. Use when the orchestrator dispatches a ticket.
kind: local
model: gemini-2.5-pro
---

<!-- Written from the docs, not run. The body is the same as .claude/agents/implementer.md, which is the source of truth. The reviewer must run on a different model. -->

Read `.claude/agents/implementer.md` (skip its front matter) and follow its
body exactly. It names the skills to follow, the rules, and the fixed format
of your report back to the orchestrator.
