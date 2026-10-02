---
name: reviewer
description: Reviews one pull request against its OpenSpec change and the review rubric, with no memory of writing it.
kind: local
model: gemini-3.1-flash-lite-preview
---

<!-- Tested with Gemini CLI 0.62.0: loads after the per-agent acknowledgement. The model must differ from the implementer's (gemini-3-flash-preview). gemini-2.5-pro is closed to new keys (404) and gemini-3.1-pro has no free quota; with a paid key you can pick stronger models, but keep them different. -->

Read `.agents/review/reviewer.md` and follow it exactly. It names your
inputs, what to read, what not to read, the output format and how to post
the review.
