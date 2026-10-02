---
title: Sources and further reading
description: Where the ideas in this workshop come from, so you can read the originals.
sidebar:
  order: 9
---

This workshop is a synthesis. These are the originals, grouped by act, as they stood on 1 October 2026.

## The software factory idea

- Michael Shimeles (Ras Mic), the skills repository behind the popular version: isolate, build, prove, ship. https://github.com/michaelshimeles/skills
- Joao Queiros, a write-up of the four steps and why "if one agent cannot return a scoped change, reproducible evidence, and a reviewable pull request, adding fourteen more agents multiplies ambiguity rather than output". https://www.ai.joaoqueiros.com/blog/software-factory-isolate-build-prove-ship-ai-agents
- Augment Code, a definition that keeps specifications and merge approvals under human control. https://www.augmentcode.com/guides/what-is-a-software-factory
- Builder.io, a factory that starts from one bug. https://www.builder.io/blog/build-an-agentic-software-factory-starting-with-one-bug

## Guardrails (act 2)

- Anthropic, Claude Code best practices, including "if you could describe the diff in one sentence, skip the plan" and "if you can't verify it, don't ship it". https://code.claude.com/docs/en/best-practices
- The `code-structure` skill: actions own the rules, services own the mechanics, extract on the second use. https://github.com/michaelshimeles/skills

## Gates (act 3)

- Anthropic on hooks: instructions are advisory, hooks are deterministic. https://code.claude.com/docs/en/best-practices
- gitleaks. https://github.com/gitleaks/gitleaks
- osv-scanner. https://google.github.io/osv-scanner/usage/
- Semgrep in pre-commit. https://semgrep.dev/docs/extensions/pre-commit
- Stopping agents from bypassing hooks with `--no-verify`. https://pydevtools.com/handbook/how-to/how-to-stop-ai-agents-from-bypassing-pre-commit-hooks/

## Specifications (act 4)

- OpenSpec. https://github.com/Fission-AI/OpenSpec
- GitHub spec-kit. https://github.com/github/spec-kit
- Kiro specs. https://kiro.dev/docs/specs/
- Birgitta Bockeler, "Understanding spec-driven development", with the spec-first, spec-anchored and spec-as-source distinction. https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html
- Thoughtworks Radar on spec-driven development. https://www.thoughtworks.com/radar/techniques/spec-driven-development
- MakerX, "The agents are here and we're all doing waterfall again". https://blog.makerx.com.au/the-agents-are-here-and-were-all-doing-waterfall-again/
- Mike Mason, "Coherence through orchestration, not autonomy". https://mikemason.ca/writing/ai-coding-agents-jan-2026/

## Tickets (act 5)

- agentboard, an append-only event log as a ticket board for agents. https://github.com/bendechrai/agentboard. Docs: https://bendechrai.github.io/agentboard/. Package: https://www.npmjs.com/package/@bendechrai/agentboard
- beads, by Steve Yegge. https://github.com/gastownhall/beads and the agent rules at https://github.com/gastownhall/beads/blob/main/AGENTS.md
- Claude Code agent teams and their shared task list. https://code.claude.com/docs/en/agent-teams

## Isolation (act 6)

- The `new-feature` skill: fetch, scope check against open pull requests, one worktree per task. https://github.com/michaelshimeles/skills
- Augment Code on running a multi-agent workspace and its four failure modes. https://www.augmentcode.com/guides/how-to-run-a-multi-agent-coding-workspace

## Proof (act 7)

- The `evidence-driven-testing` skill: never present scripted playback, always state the commit tested. https://github.com/michaelshimeles/skills
- Vercel's before-and-after tool. https://github.com/vercel-labs/before-and-after
- Vinzenz Eiberger, 101 "tests pass" claims checked, about a third not true. https://dev.to/vinzenz_eiberger/i-checked-101-tests-pass-claims-from-my-ai-coding-agents-35-werent-true-h6n
- Anthropic, "Effective harnesses for long-running agents", on premature victory declarations. https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents

## Review (act 8)

- Anthropic on adversarial review: a reviewer in a fresh context sees only the diff and the criteria; "report gaps, not style preferences". https://code.claude.com/docs/en/best-practices and https://code.claude.com/docs/en/sub-agents
- Greptile's confidence score. https://www.greptile.com/docs/code-review/first-pr-review
- Four review tools on 146 pull requests, most findings unique to one tool. https://dev.to/_vjk/best-ai-code-reviewer-in-2026-we-ran-4-in-parallel-for-3-weeks-146-prs-679-findings-1c0f
- "Adversarial Review", a reviewer plus a critic. https://arxiv.org/abs/2608.18167

## The orchestrator and unattended runs (acts 9 and 10)

- Geoffrey Huntley, the Ralph loop. https://ghuntley.com/ralph/
- The Ralph playbook: one task per iteration, keep context in the smart zone. https://paddo.dev/blog/ralph-wiggum-playbook/
- Ralph loop failure modes and the guardrail for each. https://ralphloop.sh/blog/ralph-loop-failure-modes
- Anthropic's ralph-wiggum plugin, with `--max-iterations`. https://github.com/anthropics/claude-code/tree/main/plugins/ralph-wiggum
- Anthropic, "Harness design for long-running application development": planner, generator, evaluator. https://www.anthropic.com/engineering/harness-design-long-running-apps
- Anthropic, the multi-agent research system, on briefing subagents. https://www.anthropic.com/engineering/multi-agent-research-system
- Claude Code telemetry reference. https://code.claude.com/docs/en/monitoring-usage
- ccusage, offline cost reports from local logs. https://github.com/ryoppippi/ccusage

## Projects this workshop's gates were lifted from

The definition of done, the two hooks and the preflight script are adapted from three of the author's own repositories, where they have run for months: a calendar tool, a speaker-management app, and an autonomous factory that builds software for other teams. The ideas that survived contact with real use: test the exact commit being pushed, not the working tree; waivers must be loud; and never let the factory be the only way to change the factory.
