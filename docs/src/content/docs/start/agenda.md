---
title: The two days at a glance
description: Ten acts, each adding one idea to the same small app.
---

The workshop is ten acts over two days. Each act has the same shape: a short talk on one idea, a hands-on step where you add that idea to your app, and a look at what changed.

You build one app the whole way through: **hop**, a short link service. You paste a long URL, it gives you a short link, visiting the short link redirects, and it counts the clicks. It is small enough to vibe-code in ten minutes and big enough to grow features for two days.

## Day 1: from prompt to pipeline

| Act | Idea | What you add | What you see | Time |
|---|---|---|---|---|
| 1 | The sandbox and the vibe | A fresh, sandboxed harness and one loose prompt | Everyone gets a different app | 60 min |
| 2 | Guardrails | An `AGENTS.md` that says how to work, and a code structure skill | The next feature lands the way you want it built | 75 min |
| 3 | Gates | A definition of done, a pre-commit hook and a pre-push hook | The agent cannot commit work that fails the checks | 75 min |
| 4 | Specifications | OpenSpec: a proposal, a design, specs and tasks before any code | A feature built from a plan you approved | 90 min |

By the end of day one: one agent, one feature at a time, built your way, behind checks it cannot skip.

## Day 2: from pipeline to factory

| Act | Idea | What you add | What you see | Time |
|---|---|---|---|---|
| 5 | Tickets | A ticket board the agents share, fed from the spec's tasks | Agents claim, hand off and block work on a board you can watch | 55 min |
| 6 | Isolation | A worktree and a branch per ticket, merged through pull requests | Two agents working at once without treading on each other | 55 min |
| 7 | Proof | Before and after evidence in every pull request | A fix that shows the bug, then shows it gone | 55 min |
| 8 | Review | An adversarial reviewer on a second model, and a loop until it passes | Work sent back and improved before you see it | 55 min |
| 9 | The orchestrator | One session that dispatches, verifies, reviews and merges | The board drains by itself while you watch | 90 min |
| 10 | Unattended | A loop that restarts the orchestrator, with a stop file and a budget | The factory runs without you at the keyboard | 60 min |

By the end of day two: an orchestrator around your harness that builds, proves, reviews and ships tickets from a specification, with you as the human in the loop.

## Timing

The times in the tables are the planned length of each act, from its page. Day 1 adds up to 5 hours (60, 75, 75 and 90 minutes). Day 2 adds up to 6 hours 10 minutes (four acts of about 55 minutes, then act 9 at 90 and act 10 at 60). Act 4 and act 9 are the longest acts.

Day 1 leaves about an hour for lunch and breaks inside a six hour day. Day 2 has no slack, so keep its breaks short.

If you fall behind, the demo repository has a git tag for the end of every act. Check out the tag and keep going from there.
