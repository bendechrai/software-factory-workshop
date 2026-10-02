---
title: The two days at a glance
description: Ten acts, each adding one idea to the same small app.
---

The workshop is ten acts over two days. Each act has the same shape: a short talk on one idea, a hands-on step where you add that idea to your app, and a look at what changed.

You build one app the whole way through: **hop**, a short link service. You paste a long URL, it gives you a short link, visiting the short link redirects, and it counts the clicks. It is small enough to vibe-code in ten minutes and big enough to grow features for two days.

## Day 1: from prompt to pipeline

| Act | Idea | What you add | What you see |
|---|---|---|---|
| 1 | The sandbox and the vibe | A fresh, sandboxed harness and one loose prompt | Everyone gets a different app |
| 2 | Guardrails | An `AGENTS.md` that says how to work, and a code structure skill | The next feature lands the way you want it built |
| 3 | Gates | A definition of done, a pre-commit hook and a pre-push hook | The agent cannot commit work that fails the checks |
| 4 | Specifications | OpenSpec: a proposal, a design, specs and tasks before any code | A feature built from a plan you approved |

By the end of day one: one agent, one feature at a time, built your way, behind checks it cannot skip.

## Day 2: from pipeline to factory

| Act | Idea | What you add | What you see |
|---|---|---|---|
| 5 | Tickets | A ticket board the agents share, fed from the spec's tasks | Agents claim, hand off and block work on a board you can watch |
| 6 | Isolation | A worktree and a branch per ticket, merged through pull requests | Two agents working at once without treading on each other |
| 7 | Proof | Before and after evidence in every pull request | A fix that shows the bug, then shows it gone |
| 8 | Review | An adversarial reviewer on a second model, and a loop until it passes | Work sent back and improved before you see it |
| 9 | The orchestrator | One session that dispatches, verifies, reviews and merges | The board drains by itself while you watch |
| 10 | Unattended | A loop that restarts the orchestrator, with a stop file and a budget | The factory runs without you at the keyboard |

By the end of day two: an orchestrator around your harness that builds, proves, reviews and ships tickets from a specification, with you as the human in the loop.

## Timing

Each day is about six hours. Acts 1 to 4 are roughly 75 minutes each. Acts 5 to 10 are roughly 55 minutes each, with a longer block for act 9.

If you fall behind, the demo repository has a git tag for the end of every act. Check out the tag and keep going from there.
