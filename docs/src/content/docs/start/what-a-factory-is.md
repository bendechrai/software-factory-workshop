---
title: What a software factory is
description: The definition this workshop uses, where it agrees with the popular version, and where it does not.
---

A software factory is the set of tools, rules and loops that let coding agents ship software you can trust, without you reading every line. The name comes from the assembly line: each piece of work goes through the same stations in the same order, and nothing leaves the building until quality control has passed it.

## The four stations

The version of the idea that spread in 2026 has four steps, and they are a good spine. This workshop keeps them.

| Station | What happens | What it stops |
|---|---|---|
| **Isolate** | Every piece of work starts in its own git worktree on its own branch, never on `main`. | Two agents overwriting each other's files. |
| **Build** | The agent writes code to a structure you have written down: a service layer, small files, no repetition. | Working code that nobody, human or agent, can read later. |
| **Prove** | Work is not done until it shows evidence: tests, a measurement, or a before and after picture. | An agent saying it tested something it did not. |
| **Ship** | A review sends the work back to Build until it passes. Only then is it merged, by a person or by the orchestrator when a person has said so. | Shipping the first thing that compiled. |

The idea is harness and model agnostic. It does not matter whether you drive Claude Code, Codex, Gemini CLI or Cursor, and it does not matter which model is underneath. A factory is about how you work.

## Where this workshop goes further

The popular telling says a software factory is "just a bunch of markdown files". That is a useful simplification, and it is true that the instructions you give an agent are markdown. But it undersells three things, and this workshop treats them as the real factory.

**Specifications come before code.** The popular telling goes from prompt to build. We put a specification step in front of it. You and the agent work out what to build in a conversation, write it down as a proposal, a design and a list of tasks, and only then does anything get built. When the work is merged the specification is archived, so the record of what the system does stays current without growing forever. Think of it as waterfall for the thinking and agile for the doing: rigorous specs produced conversationally, then fast loops to build them.

**Tools, not just text.** Markdown files are the non-deterministic guardrails: they shape how an agent behaves. A factory also needs deterministic ones. A ticket board so several agents can share work without a hosted service. Git hooks that refuse a commit or a push that fails the checks. A spec tool that validates its own format. Screenshots and measurements that an agent cannot talk its way around.

**Review is a model you own, not a service you rent.** The popular telling ends the loop with a paid code review service and its confidence score. There is nothing wrong with those services, but what they do is run a model with a honed prompt over your diff. You can do the same with a second model as an adversarial reviewer, and because you own the prompt you can make it better every time it misses something. This workshop builds that reviewer and the loop that feeds its lessons back.

## The loop at the end of day two

By the last act you will have one session acting as an orchestrator. It reads the ticket board, dispatches a subagent per ticket into its own worktree, checks that each result does what was asked and touched nothing else, sends the work through a reviewer on a different model, merges what passes if you have delegated that to it, and goes back to the board. You are the human in the loop: you write the specs with it, you look at the evidence it collects, and you decide who merges.

Act 10 then puts a small loop around that session. It starts a fresh session each time, and guards stop it on a cap, a time limit, a budget or a stop file. Every act also reports what it cost, so you can see where the money goes and why the strongest model should judge while cheaper ones do the work.

Nothing in that sentence names a product. That is the point.
