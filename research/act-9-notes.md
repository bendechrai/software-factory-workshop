# Notes for the act 9 page and templates

## The orchestrator line, verbatim (from Ben, 2026-10-01)

Ben uses this prompt often and keeps it in AGENTS.md. Include it in the workshop verbatim, as the line attendees add to AGENTS.md when they set up their orchestrator:

> Remember that all work should be done by subagents using an LLM model appropriate for the work done. You are an orchestrator and communicate with humans. You do not perform grunt work at your hourly rate.

Evidence from building this guide (research/per-act-cost.md): before Ben sent this line mid-build, the orchestrating session did work itself and Fable 5.1 was 68% of all cost, nearly all of it in acts 1 to 5. After it, acts 6 to 8 used almost no Fable; the work moved to Sonnet and Opus subagents.

Where it goes:
- templates/act-9/AGENTS-additions.md (verbatim block)
- demo/hop/AGENTS.md, after the act 9 orchestrator run finishes (do not edit while it runs)
- the act 9 page: in the talk, and as a hands-on step, with the cost evidence
