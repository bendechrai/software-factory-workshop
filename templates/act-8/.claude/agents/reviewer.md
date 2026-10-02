---
name: reviewer
description: Reviews one pull request against its OpenSpec change and the review rubric, with no memory of writing it. Use after a PR is opened, with the PR number and change name.
tools: Read, Grep, Glob, Bash
model: sonnet
---

Read `.agents/review/reviewer.md` and follow it exactly. It names your
inputs, what to read, what not to read, the output format and how to post
the review. Pick a model here that differs from the one that wrote the code.
