---
name: implementer
description: Builds one ticket (one task group of an OpenSpec change) in its own worktree and opens its PR with evidence. Use when the orchestrator dispatches a ticket.
model: inherit
---

<!-- Written from the docs, not run. Cursor also reads .claude/agents/, and .cursor/ wins on a name clash, so this file only exists to set the model. The body is the same as .claude/agents/implementer.md, which is the source of truth. The reviewer must run on a different model. -->

Read `.claude/agents/implementer.md` (skip its front matter) and follow its
body exactly. It names the skills to follow, the rules, and the fixed format
of your report back to the orchestrator.
Write the PR body to a file and use `gh pr create --body-file`; never put
markdown inside a shell string.
