# Research report: "Build your own software factory" (state of practice, 2025-2026)

Date of research: 2026-10-01. Every claim has a URL. Items marked UNVERIFIED could not be confirmed from a primary source.

Name correction up front: the practitioner the brief calls "Ross Mike / Mickey" is **Michael Shimeles**, YouTube/X handle **Ras Mic** (@Rasmic, display name "Micky"). His public repo is **github.com/michaelshimeles/skills** (about 1.1k stars). Many forks carry the identical README (sillevl/skills, sema-solutions/Software-factory-skills, tomfrazier/software-factory).

---

## 1. "Software factory" as a term in agentic coding

**Most referenced sources**
- Ras Mic's skills repo and AGENTS.md template: https://github.com/michaelshimeles/skills
- João Queirós' write-up of the Greg Isenberg + Ras Mic course: https://www.ai.joaoqueiros.com/blog/software-factory-isolate-build-prove-ship-ai-agents (14 Sep 2026)
- Builder.io, "Build an agentic software factory, starting with one bug" (Alice Moore, 29 Sep 2026): https://www.builder.io/blog/build-an-agentic-software-factory-starting-with-one-bug
- Augment Code's definitional guide (Aug 2026): https://www.augmentcode.com/guides/what-is-a-software-factory
- freeCodeCamp, "How to Build a Software Factory with Claude Code" (Qudrat Ullah, 22 May 2026): https://www.freecodecamp.org/news/how-to-build-software-factory-with-claude-code/

**Who popularised it.** The agentic sense was pushed into circulation in 2026 mainly by Ras Mic (course with Greg Isenberg, skills repo) and then picked up by vendor content (Augment, Builder.io, Stork). Augment traces the older sense to Bemer (1968) and Japanese factories in the 80s/90s, and notes the DoD DevSecOps usage; the agentic variant is 2024-2026 (https://www.augmentcode.com/guides/what-is-a-software-factory).

**Common definition.** Ras Mic on X: "a 'software factory' is more about your workflows + skills + domain knowledge than it is some harness" (https://x.com/Rasmic/status/2090443959860367844; the tweet page returned HTTP 402 to fetch, text is from the search snippet, so treat exact wording as UNVERIFIED). Queirós phrases it as "a repeatable path from a task to a reviewed change, with enough isolation and evidence that several coding agents can work without turning every result into a forensic exercise." Augment: "an agentic software-delivery operating model in which AI agents write, test, and ship code inside a pipeline whose specifications and merge approvals stay under human control." freeCodeCamp: "a small set of files in your repository that enables one developer and one AI to function as a coordinated team." Harness-agnosticism is explicit in the repo: skills are "For Claude Code, Cursor, and Codex", installed with `npx skills add michaelshimeles/skills`.

**The four-beat loop** (verbatim from AGENTS.md): isolate (`/new-feature`) -> build (`/code-structure`) -> prove (`/evidence-driven-testing`) -> ship (`/before-and-after` then `/greploop`), "with unslop applied to everything written for humans along the way."

**What each skill says** (all from https://github.com/michaelshimeles/skills):
- **new-feature**: `git fetch origin`; scope-check against open PRs with `gh pr list` and `gh pr diff <n> --name-only`, stop if files overlap; task names lowercase-hyphen plus unique suffix (`user-auth-0816a`); `git worktree add <worktrees-dir>/<task-name> -b <branch-prefix>/<task-name> origin/main`; verify `git branch --show-current` is not main; fresh dependency install; "Keep the worktree until the PR is merged or closed"; warns worktrees do not isolate ports or databases. Harness delta: Claude Code and Cursor managed worktrees skip manual creation.
- **code-structure**: "Actions orchestrate domain rules (the 'why/when'), while a service layer centralizes reusable operational mechanics (the 'how')." Actions own business rules, authz, failure classification, user-facing errors; services own provider/SDK calls, command execution, health checks. Service functions "accept all required data as explicit parameters", return structured results, never touch hidden global state. Extraction trigger: "logic repeated across 2+ callers". Migration: write -> find repeated chunks -> extract -> replace one caller -> verify -> migrate the rest.
- **evidence-driven-testing** (v1.2): "Use whenever a change needs verifiable evidence that it works, instead of prose claims." Records `git rev-parse HEAD` and branch; `python3 $EVIDENCE start --output .artifacts/<task> --title ... --commit ... --branch ...`; `test_start` and `assertion` (passed/failed/untested) annotations; `stop` produces `evidence.mp4`, `report.md`, `manifest.json`; upload via the PR comment box. Rule: "Never present scripted playback, stitched clips, or synthetic footage." For fixes: "Show or reference the old failure alongside the new success" and "Always state the exact commit/branch/deployment tested against." Accepted evidence types include Playwright captures, "performance probes with measured numbers", before/after pixel comparisons.
- **before-and-after**: drives `@vercel/before-and-after` (npx), pre-flight install check, 401/403 check on `.vercel.app` URLs, capture, upload and `--markdown` table into the PR via `gh`. Constraint: "DO NOT Switch git branches, stash changes, start dev servers"; current state is the "after". Upstream: https://github.com/vercel-labs/before-and-after (uses `gh --attach`, replaces a `<!-- before-and-after:start/end -->` block in the PR body).
- **greploop**: "Iteratively fix a PR/MR/CL until Greptile gives a perfect review: 5/5 confidence, zero unresolved comments." Loop up to `--max-iterations` (default 10): trigger review -> fetch score and unresolved comments (PR description, comments, reviews; polls ~10 min) -> exit check -> fix -> resolve threads -> commit and push. Parses "N/5" from text. `greploop-apps` variant tags `@greptile-apps` for large PRs.
- **unslop**: strips "puffery, filler, hedging, chatbot phrases" and "AI tells (em dashes, filler, hedging, chatbot phrases)".
- **AGENTS.md rules**: never commit to main; scope check before starting; `--force-with-lease` only on personal branches; "stop and escalate rather than guess"; regenerate lockfiles, never hand-merge; rebase onto `origin/main` before PR; do not merge unless instructed.

**Disagreement.** freeCodeCamp's version is a seven-agent chain with three human approval points (researcher -> story-writer -> spec-writer -> backend/frontend builders -> test-verifier -> validator) and never mentions worktrees or Greptile; Builder.io's is bug-intake driven (factory-collect, factory-babysit-pr, factory-review-prs, factory-lookback, factory-watchdog) with preview deploys. Queirós' line is the useful synthesis: "If one agent cannot return a scoped change, reproducible evidence, and a reviewable pull request, adding fourteen more agents multiplies ambiguity rather than output."

---

## 2. Spec-driven development for agents

**Sources**
- OpenSpec: https://github.com/Fission-AI/OpenSpec (v1.11.x, MIT); archive debate: https://github.com/Fission-AI/OpenSpec/issues/1968
- spec-kit: https://github.com/github/spec-kit
- Kiro specs: https://kiro.dev/docs/specs/
- BMAD: https://github.com/bmad-code-org/BMAD-METHOD (53.7k stars)
- Böckeler, "Understanding Spec-Driven Development" (15 Oct 2025): https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html
- Thoughtworks Radar entry (Nov 2025, Assess): https://www.thoughtworks.com/radar/techniques/spec-driven-development
- Comparison with benchmark: https://medium.com/@reenbit/bmad-vs-spec-kit-vs-openspec-choosing-your-spec-driven-ai-framework-in-2026-a6996b3ebb8d

**How each works.** OpenSpec: `/opsx:explore` (optional) -> `/opsx:propose` (creates `openspec/changes/<name>/` with proposal, delta specs, design, tasks) -> `/opsx:apply` -> `/opsx:archive` (merges delta specs into `openspec/specs/`, moves the change to `archive/` with a date prefix). Delta specs use ADDED/MODIFIED/REMOVED headers with WHEN/THEN scenarios; motto "fluid not rigid, iterative not waterfall, easy not complex." spec-kit: constitution -> specify -> plan -> tasks -> implement -> converge, "Define what and why before deciding how to build it"; artifacts are refined in place rather than regenerated. Kiro: `requirements.md` (EARS), `design.md`, `tasks.md`, with task status tracking; the docs do not describe post-implementation sync. BMAD: persona-driven PRD/architecture/stories, "right-sized process": "Small changes go straight to build. Complex work gets the depth it needs."

**Consensus.** Specs before code for anything multi-file or ambiguous; skip ceremony for one-sentence diffs. Anthropic's own best-practices page says the same: "If you could describe the diff in one sentence, skip the plan", and recommends the "interview me ... then write a complete spec to SPEC.md" pattern followed by a fresh session to execute (https://code.claude.com/docs/en/best-practices). The reenbit benchmark reports OpenSpec with the most accepted tickets (42/50 vs 36/50 no-spec) and a time cost of 30-60 min per medium feature versus 1-3+ hours for spec-kit.

**Archiving.** OpenSpec is the only tool with an explicit archive step; issue #1968 (24 Sep 2026, open, no maintainer reply) proposes task-driven spec updates so "there's no separate archive step at the end", or computing changes "as a view computed from the branch instead of a stored delta." Böckeler's taxonomy frames the choice: spec-first (spec discarded after), spec-anchored (kept alive), spec-as-source (humans only edit specs). Her verdict: "spec-first is definitely valuable in many situations" but she would "rather review code than all these markdown files", and spec-as-source echoes Model-Driven Development's "inflexibility and non-determinism". Thoughtworks Radar (Nov 2025) placed SDD in Assess, warning of "lengthy spec files that are hard to review" and that the field may be "relearning a bitter lesson". Secondary sources say Vol 34 (Apr 2026) dropped the technique in favour of listing the tools (UNVERIFIED, not confirmed on thoughtworks.com).

---

## 3. Ticket/issue tracking for agents

**Sources**
- beads: https://github.com/gastownhall/beads (27.6k stars; docs at beads.gascity.com); agent rules: https://github.com/gastownhall/beads/blob/main/AGENTS.md
- bd-workflow skill with the landing checklist: https://agent-skills.md/skills/lambdamechanic/skills/bd-workflow
- Formulas: https://beads.gascity.com/workflows/formulas ; molecules: https://github.com/gastownhall/beads/blob/main/docs/MOLECULES.md
- Gas Town: https://yegge.ai/gastown ; critical field report: https://embracingenigmas.substack.com/p/exploring-gas-town
- Claude Code agent teams (built-in shared task list): https://code.claude.com/docs/en/agent-teams

**How beads is used.** `bd init`; `bd create "Title" -t task -p 2 --json`; `bd ready --json -n 0` returns unblocked, prioritised work; `bd update <id> --claim` (atomic claim) or `--status in_progress`; `bd close <id> --reason "..."`; `bd prime` loads workflow context at session start; `bd remember` for durable project facts. The AGENTS.md rule is blunt: "This project uses bd (beads) for ALL issue tracking. Do NOT use markdown TODOs, task lists, or other tracking methods."

**Important drift: `bd sync` is gone.** Beads moved to a Dolt backend; `.beads/issues.jsonl` is now "a passive export", sync is `bd dolt push` / `bd dolt pull`, and `bd sync` was deleted from the CLI (issues #2435 and #2442, Mar 2026: https://github.com/gastownhall/beads/issues/2435 , https://github.com/gastownhall/beads/issues/2442). Most third-party guides, including the lambdamechanic skill, still say `bd sync`; a workshop guide should use `bd dolt push`.

**"Landing the plane"** (from beads AGENTS.md and the bd-workflow skill): "When ending a work session (or when the user says 'let's land the plane'), you MUST complete ALL steps": file issues for remaining work; run quality gates (tests, linters, builds) and file P0 issues if broken; close finished issues and update status; `git pull --rebase`, sync beads, `git push`, `git status` must show up to date with origin; `git stash clear`, `git remote prune origin`; verify clean state; pick the next issue and write context for the next session. "Work is NOT complete until `git push` succeeds." Yegge's own Medium post on this returned 403 to fetch, so the ritual is cited from the repo instead.

**Molecules and formulas are still current.** A formula is a TOML "declarative workflow template" (steps, vars, `needs`, gates); `bd cook` turns it into a protomolecule, `bd mol pour` instantiates a persistent molecule, `bd mol wisp` an ephemeral one, `bd mol squash` a digest. Gas Town's slogan: "Cook a formula, sling it to a polecat, the witness watches, refinery merges." Roles: Mayor (coordinator), Polecats (disposable workers), Witness (verifies against spec), Deacon (catches stalled agents), Refinery (merge queue). Koziol's six-week report: Gas Town "can consume half of a Pro Max account (or several) in 6-8 hours running hot" and needs "Stage 7+" experience; Mike Mason quotes Yegge calling it "extremely alpha" (https://mikemason.ca/writing/ai-coding-agents-jan-2026/).

**Alternatives.** Claude Code agent teams ship a file-locked shared task list with dependencies and TaskCreated/TaskCompleted hooks, but are experimental, one team per session, and "teammates sometimes fail to mark tasks as completed" (https://code.claude.com/docs/en/agent-teams). Ralphy accepts GitHub issues as the task source (https://github.com/michaelshimeles/ralphy).

---

## 4. Autonomous loops (Ralph) and Anthropic's long-running guidance

**Sources**
- Huntley's original: https://ghuntley.com/ralph/
- Anthropic plugin: https://github.com/anthropics/claude-code/tree/main/plugins/ralph-wiggum
- Playbook: https://paddo.dev/blog/ralph-wiggum-playbook/
- Failure modes and guardrails: https://ralphloop.sh/blog/ralph-loop-failure-modes
- Stop-file script: https://github.com/SantanderAI/ralph ; multi-CLI PRD loop: https://github.com/michaelshimeles/ralphy
- Anthropic, "Effective harnesses for long-running agents" (26 Nov 2025): https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
- Anthropic, "Harness design for long-running application development" (24 Mar 2026): https://www.anthropic.com/engineering/harness-design-long-running-apps

**The loop.** Huntley: `while :; do cat PROMPT.md | claude-code ; done`, "one item per loop", files `PROMPT.md`, `@fix_plan.md` (priority to-do), `@AGENT.md` (build/run commands), `@specs/`; "specs formed through conversation"; backpressure from tests, static analysers, and "capture the why tests ... are important"; greenfield only. The paddo.dev playbook formalises five files: `loop.sh`, `PROMPT_plan.md` / `PROMPT_build.md`, `AGENTS.md` ("Keep it under 60 lines"), `specs/*.md`, `IMPLEMENTATION_PLAN.md`; "one task per iteration" keeps context in the "smart zone" below about 40% utilisation; "50 iterations on a large codebase can hit $50-100+. Set limits"; "The one place the methodology still breaks is teams" (merge conflicts on the shared plan file).

**Running it safely.** Anthropic's plugin: `/ralph-loop "<prompt>" --max-iterations N --completion-promise "COMPLETE"`, `/cancel-ralph`, Stop hook re-feeds the same prompt; "Always Set --max-iterations" as the primary safety mechanism; cannot express multiple completion states; include an escape hatch like "if stuck after 15 iterations, document what's blocking". ralphloop.sh maps five failure modes to guardrails: context rot -> "Fresh context + state on disk"; runaway cost -> "-n cap + completion promise + budget"; thrashing -> "Atomic tasks, one per iteration, BLOCKED / DECIDE" with `<promise>COMPLETE</promise>` / `<promise>BLOCKED:reason</promise>`; silent wrong work -> "Verification gates + screenshots"; sandbox damage -> "Docker Sandbox microVM". SantanderAI/ralph: fresh session per iteration, `stop.md` file checked before each run (agent can create it to say "I'm done"), `.ralph/.env` reloaded each iteration, `RALPH_MEMORY_MAX` via systemd, `ralph-loop.sh MAX_ITERATIONS PROMPT_FILE`. Ralphy: PRD as markdown checklist/YAML/JSON/GitHub issues, `--max-iterations`, `--max-retries`, `--dry-run`, parallel mode where "Each agent gets isolated worktree + branch", completion verified by configured test/lint commands.

**Anthropic guidance.** Nov 2025: initializer agent plus per-session coding agent; `claude-progress.txt`; a JSON feature list with 200+ items all initially "failing"; git commits as checkpoints; "work on only one feature at a time"; browser-driven end-to-end testing; four failure modes: premature victory declarations, undocumented progress, incomplete verification, operational confusion. Mar 2026: planner / generator / evaluator; the evaluator tests live via Playwright MCP against few-shot calibrated rubrics because self-evaluating agents were "confidently praising" mediocre work; context resets with file handoffs were needed for Sonnet 4.5's "context anxiety" but less so for Opus 4.6; "find the simplest solution possible, and only increase complexity when needed", and each harness component "encodes an assumption about what the model can't do."

---

## 5. Evidence-driven testing and before/after proof

**Sources**
- Ras Mic evidence-driven-testing skill (section 1)
- Vercel before-and-after: https://github.com/vercel-labs/before-and-after
- PR video evidence skill (pre-fix and post-fix Playwright recordings): https://github.com/Godslove-BA/shift-dashboard/pull/1
- PR evidence screenshots via detached worktrees for base and fix: https://mcpmarket.com/tools/skills/pr-evidence-screenshots
- Anthropic best practices, "Give Claude a way to verify its work": https://code.claude.com/docs/en/best-practices
- "35% of tests-pass claims weren't true": https://dev.to/vinzenz_eiberger/i-checked-101-tests-pass-claims-from-my-ai-coding-agents-35-werent-true-h6n

**Consensus.** Anthropic: "Have Claude show evidence rather than asserting success: the test output, the command it ran and what it returned, or a screenshot of the result", and "If you can't verify it, don't ship it." Four escalating gates are named: in-prompt check, `/goal` condition, Stop hook as "a deterministic gate", and "a verification subagent ... has a fresh model try to refute the result, so the agent doing the work isn't the one grading it." The Eiberger audit (101 claims, Claude Code and Codex) found 34 stale claims (tests passed, then code was edited and never re-run) and 1 false; the fix is "Before claiming checks pass, re-run them after your last edit and quote the command and exit code." The "fix must prove the symptom gone" rule is the evidence-driven-testing skill's "Show or reference the old failure alongside the new success", and the video-evidence skill operationalises it: record the bug reproducing on the pre-fix commit, then re-run the same script with the inverted assertion after the fix. The PR-evidence-screenshots skill captures base and fix in detached worktrees so the frames "differ only in code rather than environment artifacts". Performance proof is listed as "performance probes with measured numbers" in the skill but no widely-cited template exists beyond that (UNVERIFIED as a general practice).

---

## 6. Code review by agents

**Sources**
- Anthropic best practices "Add an adversarial review step" and Writer/Reviewer pattern: https://code.claude.com/docs/en/best-practices ; subagent docs: https://code.claude.com/docs/en/sub-agents
- Greptile review anatomy and 0-5 confidence: https://www.greptile.com/docs/code-review/first-pr-review
- CodeRabbit profiles: https://docs.coderabbit.ai/reference/configuration
- Four reviewers on 146 PRs: https://dev.to/_vjk/best-ai-code-reviewer-in-2026-we-ran-4-in-parallel-for-3-weeks-146-prs-679-findings-1c0f
- Cross-model review councils: https://github.com/yeameen/claude-code-review-council , https://github.com/jonazri/committee
- Adversarial Review paper: https://arxiv.org/abs/2608.18167

**Anthropic's guidance.** "A fresh context improves code review since Claude won't be biased toward code it just wrote." Writer/Reviewer as two sessions, or a subagent: "A reviewer running in a fresh subagent context sees only the diff and the criteria you give it, not the reasoning that produced the change." Example prompt: "Use a subagent to review the rate limiter diff against PLAN.md. Check that every requirement is implemented, the listed edge cases have tests, and nothing outside the task's scope changed. Report gaps, not style preferences." Caveat worth quoting in a workshop: "A reviewer prompted to find gaps will usually report some, even when the work is sound ... Tell the reviewer to flag only gaps that affect correctness or the stated requirements." Reviewer subagent template: `tools: Read, Grep, Glob`, `model: sonnet|opus|haiku|inherit`, optionally `permissionMode: plan`; models resolve per-invocation > frontmatter > `CLAUDE_CODE_SUBAGENT_MODEL` > parent.

**Scores.** Greptile: 0-5 confidence (5 merge, 4 minor polish, 3 implementation issues, 2 significant bugs, 0-1 critical), P0/P1/P2 inline badges, `.greptile/config.json` `commentTypes`. CodeRabbit: quiet / chill (default) / assertive profiles in `.coderabbit.yaml`. The 146-PR study: Greptile 120 findings at 0% false positives, CodeRabbit 281 findings at 2.3% FP, 93.4% of findings unique to one reviewer, "no single winner".

**Different-model reviewer.** The argument is that "the same model having same blind spots" motivates Codex/Gemini reviewers inside Claude Code (review-council, committee). The arXiv Adversarial Review protocol (reviewer plus critic that disputes the review) beat a five-agent baseline on LiveCodeBench with three agents. The specific claim that a second-model reviewer plus a self-improving review prompt "is as good as a paid service" has no primary source I could find; the closest is a learnings-loop pattern (persistent `learnings.md` read at session start, https://www.mindstudio.ai/blog/how-to-build-learnings-loop-claude-code-skills) and the review-council repos. Mark the "as good as" claim UNVERIFIED; the 93% non-overlap result argues the opposite, that reviewers are complementary.

---

## 7. Local gates instead of CI

**Sources**
- osv-scanner pre-commit: https://google.github.io/osv-scanner/usage/ ; gitleaks and semgrep pre-commit configs: https://semgrep.dev/docs/extensions/pre-commit , https://www.decryptiondigest.com/blog/secrets-scanning-pre-commit-ci-enforcement
- Stopping agents bypassing hooks: https://pydevtools.com/handbook/how-to/how-to-stop-ai-agents-from-bypassing-pre-commit-hooks/ ; block-no-verify hook: https://github.com/davila7/claude-code-templates/issues/428
- Anthropic on hooks: https://code.claude.com/docs/en/best-practices

**Consensus.** "Unlike CLAUDE.md instructions which are advisory, hooks are deterministic and guarantee the action happens" (Anthropic). Recommended split: Gitleaks at pre-commit (sub-second), Semgrep and TruffleHog with verification in CI. A borrowable `.pre-commit-config.yaml` combines `pre-commit-hooks` (detect-private-key, no-commit-to-branch main, check-added-large-files), `gitleaks/gitleaks`, `google/osv-scanner`, and `semgrep/pre-commit` with `--config p/default --error`. The one thing every source agrees on: agents will run `git commit --no-verify` (Anthropic issue #40117 closed "not planned" per pydevtools), so add a `PreToolUse` hook on Bash running `block-no-verify`, optionally a `$PATH` git shim, with CI as backstop. Deny rules alone fail because of prefix matching.

**Definition of done and loud waivers.** I found no canonical "definition of done" document template or "loud waiver" convention for agent repos; the closest primary material is Anthropic's "If you can't verify it, don't ship it", the beads landing checklist's quality gates, and the Clabon toolkit DoD ("Code + tests merged, CI green ... Docs/ADR updated", https://github.com/ClabonConsultingLtd/Toolkit/issues/129). Treat "waivers that are loud" as the workshop's own contribution, UNVERIFIED as common practice.

---

## 8. "Waterfall for specs, agile for execution"

**Sources**
- MakerX, "The agents are here and we're all doing waterfall again" (JM del Pino, 11 Feb 2026): https://blog.makerx.com.au/the-agents-are-here-and-were-all-doing-waterfall-again/
- Mike Mason, "Coherence Through Orchestration, Not Autonomy" (22 Jan 2026): https://mikemason.ca/writing/ai-coding-agents-jan-2026/
- Frank Goortani, "AI, Agile, and the Return of Detailed Planning": https://medium.com/@FrankGoortani/ai-agile-and-the-return-of-detailed-planning-a-new-balance-for-leaders-469d09831a70
- Marmelab, "Spec-Driven Development: The Waterfall Strikes Back" (12 Nov 2025) and HN thread: https://news.ycombinator.com/item?id=45935763
- Allstacks, "Spec-Driven Development Isn't Waterfall": https://www.allstacks.com/blog/spec-driven-development-isnt-waterfall-why-the-ai-coding-bottleneck-changed-everything

**Phrasings.** Goortani quotes an engineering leader: "agile planning, waterfall execution", teams "spending 3x more time on upfront design so that agents can execute without constant course-correction". MakerX: the spec "actually gets followed" by agents, unlike human waterfall handoffs, and the whole plan-execute-review cycle fits in an afternoon; recommended practice is conversational spec-building then autonomous execution, with CLAUDE.md memory reducing spec burden over time. Mason: "waterfall in 15 minutes", "Professional Software Developers Don't Vibe, They Control". Anthropic's own version is the interview-to-SPEC.md-then-fresh-session pattern. Dissent: Marmelab argues SDD "resurrects waterfall's problems" because agents rarely get it right first time so iteration is unavoidable; Kent Beck (quoted in Böckeler) objects that SDD "encode[s] the (to me bizarre) assumption that you aren't going to learn anything during implementation that would change the specification." The honest synthesis: rigorous spec per task, short execution loops, and specs that are allowed to change when execution teaches something.

---

## 9. Multi-agent orchestration patterns and failure modes

**Sources**
- Augment, multi-agent workspace guide: https://www.augmentcode.com/guides/how-to-run-a-multi-agent-coding-workspace
- Anthropic multi-agent research system: https://www.anthropic.com/engineering/multi-agent-research-system
- Claude Code agent teams: https://code.claude.com/docs/en/agent-teams ; subagents: https://code.claude.com/docs/en/sub-agents
- Gas Town roles (section 3); ralphy parallel worktrees (section 4)

**Pattern.** Coordinator decomposes and holds a "shared ledger" but writes no code; specialists execute bounded tasks and cannot "silently expand scope"; a verifier demands "execution evidence rather than relying on static analysis alone" (Augment). Mason's version: planners, workers, judges. Each worker in its own worktree is the universal answer (Augment, Ras Mic new-feature, ralphy, Claude Code `/batch` which gives each of 5-30 subagents its own worktree). Model routing per role is native in Claude Code (`model:` frontmatter, `CLAUDE_CODE_SUBAGENT_MODEL`), in ralphy (per-engine model override) and SantanderAI/ralph (`RALPH_MODEL_CAPABILITY` low/med/high).

**Failure modes.** Augment names four: merge conflicts on shared files, duplicated implementations, semantic contradictions ("the hardest class to detect"), context exhaustion; and cites frontier models above 70% on single-issue tasks but "below 25%" on multi-file patches. Anthropic's research system saw task duplication, "spawning 50 subagents for simple queries", and vague briefs; multi-agent runs cost about 15x chat tokens; briefs need objective, output format, tool guidance, and explicit boundaries. Claude Code agent teams docs: "Two teammates editing the same file leads to overwrites", task status "can lag", the lead sometimes starts implementing itself or "stop[s] early", 3-5 teammates recommended, and messages between agents are treated as untrusted (one agent cannot approve on another's behalf). Lying about tests: see section 5 (mostly stale, not fabricated); Anthropic's Nov 2025 piece calls it "premature victory declarations."

---

## 10. Observability for agent runs

**Sources**
- Claude Code OpenTelemetry reference: https://code.claude.com/docs/en/monitoring-usage
- Langfuse coding-agent tracing: https://langfuse.com/resources/engineering/coding-agent-tracing ; plugin: https://github.com/langfuse/Claude-Observability-Plugin
- Grafana stacks: https://github.com/ColeMurray/claude-code-otel , https://grafana.com/grafana/dashboards/24993-claude-code-metrics/
- ccusage and alternatives: https://synrouter.ai/blog/track-claude-code-token-usage
- Catalogue: https://github.com/AgentListIO/awesome-agent-observability

**What people use.** Claude Code has OTel built in: `CLAUDE_CODE_ENABLE_TELEMETRY=1`, `OTEL_METRICS_EXPORTER=otlp`, `OTEL_LOGS_EXPORTER=otlp`, `OTEL_EXPORTER_OTLP_ENDPOINT`, beta traces via `CLAUDE_CODE_ENHANCED_TELEMETRY_BETA=1` and `OTEL_TRACES_EXPORTER=otlp`. Metrics: `claude_code.cost.usage`, `token.usage`, `session.count`, `commit.count`, `pull_request.count`, `lines_of_code.count`, `code_edit_tool.decision`, `active_time.total`; cost carries `model`, `agent.name`, `skill.name`, `mcp_tool.name` attributes when `OTEL_LOG_TOOL_DETAILS=1`. Events include `user_prompt`, `api_request`, `tool_result`, `tool_decision`, `skill_activated`, `hook_execution_start`. Langfuse traces Claude Code via a Stop hook, Codex via plugin hooks, Copilot via native OTel, capturing per-turn tokens, cost, tool calls, subagents; limits: context files are not captured and hooks are "per-machine and user-disableable (not enforcement-grade)". Cheapest option: `npx ccusage@latest` parses local JSONL logs offline for daily, monthly, session and 5-hour-block reports. Local Grafana via claude-code-otel or the Grafana dashboard 24993.

---

## Artifacts worth borrowing (summary)

1. Ras Mic `AGENTS.md` plus `new-feature`, `code-structure`, `evidence-driven-testing`, `greploop` SKILL.md files (https://github.com/michaelshimeles/skills). Also `unslop`.
2. Vercel `before-and-after` skill and PR-body block (https://github.com/vercel-labs/before-and-after).
3. Beads `AGENTS.md` landing-the-plane checklist, with `bd dolt push` substituted for `bd sync` (https://github.com/gastownhall/beads/blob/main/AGENTS.md).
4. Ralph five-file layout (`loop.sh`, `PROMPT_plan.md`, `PROMPT_build.md`, `AGENTS.md`, `specs/`, `IMPLEMENTATION_PLAN.md`) from paddo.dev; SantanderAI `stop.md` loop; Anthropic `/ralph-loop --max-iterations --completion-promise`.
5. OpenSpec `openspec/{specs,changes,archive}` layout and ADDED/MODIFIED/REMOVED delta format.
6. Claude Code reviewer subagent frontmatter (`tools: Read, Grep, Glob`, `model:`, `permissionMode: plan`) and the "Report gaps, not style preferences" prompt.
7. `.pre-commit-config.yaml` with gitleaks + osv-scanner + semgrep + no-commit-to-branch, plus the `PreToolUse` block-no-verify hook JSON.
8. Anthropic feature-list JSON plus `claude-progress.txt` pattern and planner/generator/evaluator split.
9. OTel env block for Claude Code and a Langfuse Stop hook; `npx ccusage@latest` for zero-setup cost.

## UNVERIFIED items
- Exact wording of Ras Mic's "software factory" tweet (page returned 402; quoted from search snippet).
- "Second-model reviewer plus self-improving prompt is as good as a paid service": no primary source found; evidence found points to complementarity, not substitution.
- "Waivers that are loud" and a canonical definition-of-done file for agent repos: no public source found.
- Thoughtworks Radar Vol 34 removing SDD: only via secondary summaries.
- Performance-measurement-in-PR as a widespread practice: only the Ras Mic skill mentions it.
- Steve Yegge's "Beads Blows Up" Medium post could not be fetched (403); landing-the-plane details come from the beads repo and a third-party skill instead.
