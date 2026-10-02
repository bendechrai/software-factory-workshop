---
title: Where this workshop differs from the popular version
description: The video that spread the term, what it gets right, and the three places this workshop takes a different position.
sidebar:
  order: 4
---

The term "software factory" spread in 2026 through a conversation between Greg Isenberg and Michael Shimeles (Ras Mic), and through the skills repository that goes with it. If you have not seen it, the short version is: a factory is a workflow of four steps, isolate, build, prove and ship, captured in an `AGENTS.md` file and a handful of skills, and it works with any harness and any model.

This workshop keeps that spine. It differs in three places.

## 1. A specification comes before the build

The popular telling goes from prompt to build. "I want a skills repository" is the whole brief, and the code structure skill does the rest.

That works for one person who holds the whole product in their head. It stops working the moment a second agent or a second person needs to know what the first one meant. So this workshop puts a specification step in front of the build: a proposal, a design, the requirements as scenarios, and a list of tasks. You produce them in conversation with an agent, you read them, and only then does anything get built.

Two consequences follow. The tasks become tickets, so several agents can share the work. And when the work is merged the specification is archived, so the record of what the system does stays current without a pile of stale plans.

Some people call this a return to waterfall. It is, for the thinking. The doing stays agile: short loops, one task at a time, specs that change when the build teaches you something.

## 2. A factory is tools, not just text

"A software factory is literally just a bunch of markdown files" is a good line and it is half right. The instructions you give an agent are markdown, and they are the non-deterministic half of the factory: they shape behaviour, and the agent can still misread them.

The other half is deterministic, and it is tools:

- a ticket board the agents share, so who is doing what is never a matter of memory;
- git hooks that refuse a commit or a push that fails the checks, which an instruction file cannot do;
- a spec tool that validates its own format and archives what is done;
- screenshots, measurements and test output that an agent cannot talk its way around.

Markdown tells the agent what good looks like. Tools make sure it does not ship anything else.

## 3. Review is a model you own

The popular loop ends with a paid code review service. It scores the pull request out of five, the agent fixes what it flagged, and the loop runs until the score is five.

Those services are good. But what they do is run a model with a honed prompt over your diff and keep improving the prompt. You can do the same. A second model, given only the diff and your review rubric, with no memory of writing the code, finds the same classes of problem. And because you own the rubric, every miss becomes a line in it. The reviewer gets better at reviewing your code specifically.

The evidence on this is honest rather than one-sided. A three-week comparison of four review tools found that most findings were unique to one tool, which argues that reviewers are complementary rather than interchangeable. So the position here is not "never pay for review". It is: build the reviewer you own first, because you will learn what good review of your code looks like, and add a service later if it earns its place.

## What the popular version gets right

- The four steps, in that order.
- Worktrees, so agents never work on the same branch.
- A code structure skill, so working code is also readable code.
- Evidence over claims. An agent that says it tested something has to show the test.
- The idea is independent of harness and model. Nothing in it needs a product.

Further reading is collected in [Sources](/software-factory-workshop/reference/sources/).
