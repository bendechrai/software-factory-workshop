# Act 10: verification of the second real unattended loop run

Verifier: independent check after the fact, on 2026-10-02. I changed no product code. I merged nothing and ran no codex, claude or loop. I read records, ran tests and used read-only gh commands. This file is the only thing I wrote outside the scratchpad.

Run under test, from `.agents/loop/loop.log`:
- `iteration=1 start=2026-10-02T17:58:19Z end=2026-10-02T18:06:53Z exit=0 open_before=1 open_after=0` (8m34s)
- `iteration=1 openrouter_before: usage=8.814787346 limit_remaining=null openrouter_after: usage=9.501280946 limit_remaining=null`

It merged PR #13 (change `reserved-routes-guard`, one task group) as `0579845` and archived the change in `f968232`.

Sources:
- `.agents/loop/runs/20261002T175819Z-i1.json`: 66 lines, orchestrator thread only.
- `.agents/loop/runs/20261002T175819Z-i1.json.err`: 3 lines.
- `.agents/loop/runs/20261002T175819Z-i1-sessions/2026/10/02/`: 3 rollouts, which I parsed with python:
  - orchestrator `...6793-74b2-b66b-29500051098d`
  - implementer "Ptolemy" `...d404-7e32-8b05-be3c585b9d8e`
  - reviewer "Locke" `...fa3f-79a2-82ae-da5e4304061c`
- Times below are UTC. Local file times are CDT (UTC-5).

## Verdict

The fixes made after the first run held:
- The reviewer brief was written to a file and to the ticket, and the reviewer read it.
- The configured reviewer (`anthropic/claude-sonnet-5.5`) ran and looked at a screenshot. Nothing was substituted.
- The orchestrator opened both screenshots with `view_image` and described them on the ticket.
- The implementer used `fork_turns: "none"` and wrote the PR body to a file for `--body-file`.
- The image links were rewritten to the merge sha and resolve.
- The session files with models and spawns are now in the repo's run folder, and the OpenRouter spend is in loop.log.

Main is healthy: verify, preflight and e2e (3 of 3) are green, the board is empty and there is one worktree.

Four things did not fully work:
1. **The orchestrator cannot record cost during the run.** The loop writes the usage line only after the harness exits, so the orchestrator's summary says "no cost was reportable".
2. **The spawn message still arrives empty for the non-OpenAI reviewer.** The reviewer found its brief by deducing the PR number from the plaintext task name `review_pr13`. That works with one PR at a time but is fragile with several.
3. **The implementer made up a commit sha in the PR body's image links.** They returned 404 from 18:02:10 until the orchestrator rewrote them after the merge at 18:04:50. Neither verify nor review noticed.
4. **The reviews still do not name their model.** That half of first-run fix 8 was never made.

## First-run findings, one by one

### 1. Reviewer brief reached the reviewer: HELD (with a caveat)

- 18:03:12: the orchestrator wrote `.agents/review/briefs/pr-13.md` with `apply_patch`. The file mtime is 13:03:12 CDT. It holds the PR, the change, head `3b2b92cd...`, what changed, what to read, its screenshot notes and "Do not read any implementer notes".
- 18:03:17: ticket comment "Reviewer brief for PR #13: change reserved-routes-guard, head 3b2b92cd6c254e98a9a7607ea561b71928aecfc3, see .agents/review/briefs/pr-13.md".
- 18:03:22: `spawn_agent {"agent_type":"reviewer","fork_turns":"none","task_name":"review_pr13", "message":"gAAAA..."}`.
- In the reviewer's rollout, the payload is again `{"type":"encrypted_content"}` after an empty `Payload:` line. **The spawn message still does not reach a non-OpenAI model.** The only plaintext is the header `Task name: /root/review_pr13`.
- 18:03:24: the reviewer reads `reviewer.md`. At 18:03:27 it runs `ls .agents/review/briefs/; cat .agents/review/briefs/pr-13.md; gh pr view 13; gh pr diff 13`.
  - It named `pr-13.md` before it had listed the folder, so it took "13" from the task name.
  - The brief then confirmed the PR, change and head.
  - Only one brief file existed, so there was no ambiguity.
- The reviewer's reply says "I found no blocking issues in PR #13". It posted on PR 13 and commented "Review of PR #13: VERDICT: PASS, SCORE: 5/5, 0 blocking" on the right ticket. It did not guess blindly.
- Caveat: this worked through the task name plus a single brief file. When two reviews run in parallel, the "newest file" fallback in `reviewer.md` could pick the wrong brief. The plaintext route that reaches the reviewer is the agent's `developer_instructions` in `.codex/agents/reviewer.toml` plus the task name.
  - Fix: have the skill require `task_name: review_pr<n>`, and have `reviewer.md` say to read `briefs/pr-<n>.md` with n taken from the task name.

### 2. The configured reviewer model ran: HELD

- The reviewer rollout's `turn_context` has model `anthropic/claude-sonnet-5.5` and effort `low`. `session_meta` has `agent_role: "reviewer"` and `model_provider: "openrouter"`.
- No model errors. The `.err` file has two tool errors, both from its `view_image` calls, and both recovered:
  - 18:03:33: `unable to locate image at .../hop/evidence/reserved-routes-guard/g1/after-health.png`. The PR was not merged yet, so the file was not in the main checkout.
  - 18:03:46: `unable to locate image at /tmp/pr13img/after.png`. It issued `view_image` in the same batch as the command that extracts the file, so the file did not exist yet.
  - 18:03:50: the same call succeeded and returned the image.

### 3. No reviewer substitution: HELD

There was one reviewer spawn: `agent_type: "reviewer"`, no model override, no `default` agent. The orchestrator made only 2 `spawn_agent` calls in total (implementer and reviewer) and 2 `wait_agent` calls. The PR has exactly one review, posted at 18:04:07 on head `3b2b92c`.

### 4. Screenshots looked at: HELD (lightly exercised)

There were PNGs: `before-health.png` and `after-health.png`, browser shots of the `/health` JSON.
- Orchestrator, 18:02:29: `tools.view_image({path, detail:"original"})` on both files in the worktree, and the images came back.
- 18:02:36: ticket comment "Evidence screenshots inspected: before-health.png and after-health.png both visibly show the browser JSON response {"status":"ok","links":0} at /health, with no clipped response content ...". I looked at them too, and that is what they show.
- Reviewer: it viewed `after.png` (18:03:50). It established that `before.png` is byte-identical with `cmp` ("same") and did not open it. That is equivalent here, but `reviewer.md` says to open every PNG.
- This change is a refactor with no UI change. The clipped-element lesson was not really tested.

### 5. Untested spec scenario / silent design change: HELD

Every scenario in the delta (`specs/custom-codes/spec.md`) has a test on main:

| Scenario | Test |
|---|---|
| The stats page name | `src/actions/create-link.test.ts:58-61`, `src/app.test.ts:251` |
| The health endpoint name | `src/app-health.test.ts:55`, `src/actions/reserved-codes.test.ts:11` |
| A reserved word in another case (`API`) | `create-link.test.ts:61`, `reserved-codes.test.ts:18` |
| The stats page still shows | `src/app.test.ts:251` ("refuses the code stats with 400 and /stats still shows the stats page") |
| An ordinary code (`my-stats`) | `create-link.test.ts:75`, `reserved-codes.test.ts:29` |
| Every mounted top-level route is reserved (new) | `src/reserved-routes.test.ts` |

Design check:
- Decisions 1 to 3 are followed: an explicit exported list, the mounts read from it, and an app-level test that lowercases the first segment and names the prefix.
- Decision 4's gap is the accepted one.
- No design value changed.
- The reviewer's review covers the new scenario but dismisses the rest as "unchanged behaviour" without naming their tests.

One unflagged deviation from the tasks: task 1.3 says to save to `evidence/reserved-routes-guard/mutation-fail.txt`, but the file is at `evidence/reserved-routes-guard/g1/mutation-fail.txt`.
- The implementer's report says "per orchestrator instruction". The skill's brief template says to use `evidence/<change>/g<g>/`, which conflicts with tasks.md.
- Neither the orchestrator nor the reviewer mentioned it. It is harmless, but it is the kind of silent change the new Lesson is about.

### 6. Shell injection: HELD

- The implementer wrote the body with a quoted heredoc (`cat > "${TMPDIR:-/tmp}/pr-body-reserved-routes-guard-g1.md" <<'EOF'`) and ran `gh pr create --base main --title "..." --body-file "${TMPDIR:-/tmp}/pr-body-reserved-routes-guard-g1.md"` (18:02:09).
- The orchestrator wrote the rewritten body with `apply_patch` to `.agents/review/briefs/pr-13-body.md` and ran `gh pr edit 13 --body-file` (18:04:49). It deleted the file at 18:05:01.
- The reviewer wrote `/tmp/review-pr-13.md` with `<<'E'` and ran `gh pr review 13 --comment --body-file`.
- I scanned every command in all 3 rollouts. No command has a backtick outside a heredoc or patch, and no output has "command not found", "permission denied" or "bad substitution" from a mangled string.

### 7. Evidence links by commit sha, still resolving: HELD after merge (new defect before merge)

- Now, `curl -sIL` on both links in PR #13's body (`blob/0579845ee0f74cf72bf2aa2623bf9a86dc95f67d/evidence/reserved-routes-guard/g1/{before,after}-health.png?raw=true`) returns `200` from `raw.githubusercontent.com` with `image/png`.
- The orchestrator rewrote them to the merge sha and checked both with curl (`200`, `200`) at 18:04:49-53.
- But the implementer's original body (edit history: created 18:02:10) linked to `blob/3b2b92cde7952b63ee65fb9eca826364399ec841/...`.
  - **That sha does not exist.** `git cat-file -t` fails and curl returns 404. The real head is `3b2b92cd6c254e98a9a7607ea561b71928aecfc3`. The implementer kept the right 7-character prefix and made up the rest.
  - Its command computed `EVID_SHA=$(git rev-parse HEAD)` but then used a quoted heredoc, so the variable could not be expanded. The model typed a sha by hand.
  - The links were broken from 18:02:10 until 18:04:50, including during verify and review. Neither noticed, because the skill only asks for a curl check after merge.

### 8. Run record includes models and spawns: HELD (one part never done)

- `bin/factory-loop.sh` `copy_sessions` copied the 3 rollouts that changed during the iteration. They carry every thread's model (`turn_context`), role and nickname (`session_meta.source.subagent.thread_spawn`), and the `spawn_agent` arguments.
- The orchestrator's final `token_count` matches the run JSON's `turn.completed` exactly (1,332,506 input, 6,957 output).
- Not done: the first-run fix also asked that each review carry a `Model:` line. `reviewer.md` has no such instruction, and the PR #13 review does not name its model. Reviews are posted from the `bendechrai` account, so only the session files show which model reviewed.
- Note: `.agents/loop/runs/` is gitignored, so the record is on this machine only, not in the git history.

### 9. Cost recorded: HELD in loop.log, FAILED in the run's own report

- loop.log has the before and after usage line. Spend: 9.501280946 - 8.814787346 = **$0.6865**.
- The orchestrator could not see that line. The loop appends it after the harness exits (lines 202-206 of `bin/factory-loop.sh`), and at 18:06:41 loop.log held only the first run's lines.
  - Its `rg "OpenRouter|openrouter|usage" .agents/loop/loop.log` found nothing.
  - Its summary says "No OpenRouter usage lines were recorded, so no cost was reportable."
  - Skill step 13 tells the orchestrator to report a figure it cannot have.
  - Fix: the loop reports it (it does), and step 13 should say so. Or the loop writes the before value to a file the orchestrator can read.
- The loop's printed line ("OpenRouter spend of this loop: ... difference $...", `cost_hint`) goes to the terminal only. It is not in any file I can read, so I cannot confirm it printed. From the log lines it would say $0.6865.
- The orchestrator did not run the Claude-only ledger (correct for Codex). `.ledger-cache.json` is now gitignored.

### 10. Implementers started with fresh context: HELD

- 17:58:50: `spawn_agent {"agent_type":"implementer","fork_turns":"none","task_name":"reserved_routes_g1", ...}`.
- The reviewer was also spawned with `"fork_turns":"none"`.
- The implementer's rollout starts with its own developer instructions and the brief, and its first action is reading `.claude/agents/implementer.md`. It did not take on the orchestrator role.

## Normal checks

| Check | Result |
|---|---|
| PR #13 diff vs task group | 9 files: `src/app.ts` (+17/-7, the list plus 4 mounts), the new `src/reserved-routes.test.ts`, `tasks.md` (3 ticks), and 6 files in `evidence/reserved-routes-guard/g1/`. Only group 1, no scope creep. The mount order is unchanged. |
| Tasks ticked | 1.1, 1.2 and 1.3 are `[x]` in the archived `tasks.md`. The agentboard checklist on the closed ticket still shows all three `[ ]` (never ticked on the board; cosmetic). |
| Mutation evidence | `evidence/reserved-routes-guard/g1/mutation-fail.txt`: `fail 1`, `Expected reserved codes to include first segment "health" from prefix "/health"`. It was captured at 17:59:41 with exit 1, and `git checkout` then restored the file. |
| New test passes | `node --test src/reserved-routes.test.ts`: 1 pass, exit 0. |
| ROUTE_PREFIXES drives mounts | `app.use(ROUTE_PREFIXES.health / .linksApi / .statsApi / .statsPage, ...)`. Only the `/` mounts (export, preview, redirect) are literal, as design decision 2 says. |
| Evidence records | before at `ef7a2d7` and after at `ab2c635`, both 6/6 ok. The after record shows POST code `health` -> 400. `ab2c635` is in the PR. The head `3b2b92c` only re-captured evidence, so the code is the same as at `ab2c635`. |
| Orchestrator verify (step 6) | 18:02:23: fetch, `gh pr view`, `pr diff --name-only`, `pr diff`, worktree log and status, `merge-base --is-ancestor` (up-to-date), view_image, then `E2E_PORT=4399 bin/preflight.sh 3b2b92cd...` with exit 0. Merge at 18:04:30, after confirming the PASS review on head `3b2b92c`. |
| `npm run verify` on main | exit 0, 85 tests pass |
| `E2E_PORT=4399 bin/preflight.sh HEAD` | exit 0, "PREFLIGHT PASSED - f968232 is safe to push". install, verify, build, audit, migrations and e2e all ok. |
| `npm run e2e` x3 (E2E_PORT=4398) | 12 passed, 12 passed, 12 passed (all exit 0) |
| `agentboard list --change reserved-routes-guard` | empty, exit 0 |
| `agentboard health` | stale 0, blocked 0, unpromoted decisions 0, close-merged ready / held / missing 0 |
| Worktrees | only `.../demo/hop f968232 [main]`. `hop.worktrees/` is empty. |
| Branches | local: only `main`. Remote (`git ls-remote --heads`): only `main`. Open PRs: none. A stale local tracking ref `refs/remotes/origin/feat/reserved-routes-guard-g1` (at 3b2b92c) remains; `git fetch --prune` clears it. |
| Archive | `f968232` moves the change to `openspec/changes/archive/2026-10-02-reserved-routes-guard/` and adds the scenario to `openspec/specs/custom-codes/spec.md`. `openspec validate --specs` passed in the run, and the pre-push gate passed. |

### Writes outside the repo

- Workshop repo (`git -C /Users/ben/Projects/software-factory-workshop status --short`): it now shows ` M templates/act-3/.agents/hooks/block-no-verify.sh`, ` M templates/act-8/.cursor/agents/reviewer.md`, ` M templates/act-9/.cursor/agents/implementer.md` and `?? research/cursor-tab-tests.md`. The same three files are also modified in hop (`.agents/hooks/block-no-verify.sh`, `.cursor/agents/*.md`).
  - **These are not from the run.** Their mtimes are 13:12:02-13:12:22 CDT (18:12Z), 5 minutes after the run ended, while I was verifying. At the start of my check (about 18:09Z) hop's `git status` was clean.
  - Something else (another session) is editing both trees. Nothing in the 3 rollouts touches them, and none of their commands write to the workshop path.
- `/tmp`, from the run:
  - implementer: `/tmp/open_prs.json` and `/tmp/reserved-codes.ts.bak`
  - reviewer: `/tmp/pr13img/{before,after}.png` and `/tmp/review-pr-13.md`
  - All still present.
- `$TMPDIR`, from the implementer: `pr-body-reserved-routes-guard-g1.md`.
- The reviewer made a temporary worktree at `/tmp/pr13wt` with a `node_modules` symlink into the main checkout, and a local branch `pr13tmp` fetched from `pull/13/head` in the main checkout. Both were removed (`git worktree remove --force`, `git branch -D`), and `git worktree prune --dry-run` shows nothing left. This is outside the `hop.worktrees` convention, but it was cleaned up.
- In the repo, gitignored: `.agents/review/briefs/pr-13.md` remains. A future reviewer whose message is empty falls back to "newest file" and could read a stale brief.

## Cost

OpenRouter spend for the run, from loop.log: **9.501280946 - 8.814787346 = $0.6865**. The first run cost about $4.73 for 3 PRs.

Tokens from each thread's final `token_count`:

| Thread | Model (effort) | Input | Cached | Uncached | Cache write | Output (reasoning) |
|---|---|---|---|---|---|---|
| orchestrator | openai/gpt-5.6-sol (default) | 1,332,506 | 1,268,393 | 64,113 | 63,251 | 6,957 (1,383) |
| implementer "Ptolemy" | openai/gpt-5.3-codex (low) | 761,596 | 709,376 | 52,220 | 0 | 7,609 (2,667) |
| reviewer "Locke" | anthropic/claude-sonnet-5.5 (low) | 290,824 | **0** | 290,824 | 0 | 2,819 (395) |
| **Total** | | **2,384,926** | **1,977,769** | **407,157** | 63,251 | **17,385 (4,445)** |

- 83% of input tokens were cache reads (95% in the first run).
- The reviewer shows zero cache reads. All 290,824 of its input tokens count as uncached, which is 71% of the run's uncached input. Prompt caching does not seem to be active for the Anthropic model through Codex and OpenRouter (Anthropic needs explicit cache_control). The reviewer is probably the most expensive thread per token. The key endpoint does not split spend by model, so I cannot give a per-model dollar figure.

## What else went wrong (new in this run)

1. **Made-up sha in the PR body.** The image links named `3b2b92cde7952b63ee65fb9eca826364399ec841`, which does not exist, and they returned 404 during verify and review. The rewrite after merge hid it.
   - Fix: the evidence skill should build the body with an unquoted heredoc around a computed sha, or write the sha with `git rev-parse HEAD` into the file. The orchestrator's step 6 should `curl -sIL` every body link before review.
2. **Spawn message still empty for the cross-vendor reviewer.** This time the brief file plus the task name made up for it (see item 1). It is fragile with parallel reviews.
3. **Cost cannot be reported by the orchestrator.** The usage line is written after the harness exits. Skill step 13 asks for something impossible, and the orchestrator reported no cost.
4. **Reviewer input not cached:** 290,824 uncached tokens on Sonnet (see Cost).
5. **Reviews do not name their model.** The first-run fix 8 asked for a `Model:` line, and it was not added to `reviewer.md`.
6. **Task path deviation unflagged.** The mutation output went to `g1/mutation-fail.txt`, not the path in task 1.3. The skill's brief template and the task disagree, and nobody noted it.
7. **The reviewer opened only one of the two PNGs.** It used `cmp` for the other. That is equivalent here, but not what `reviewer.md` says. It also ran `npm run verify` but not e2e (it said so), and it worked at effort `low`.
8. **The reviewer's view_image errors** came from viewing a file that was not in the main checkout, and from issuing view_image in parallel with the command that creates the file. Both recovered.
9. **The board checklist was never ticked**, although `tasks.md` was.
10. **The orchestrator misattributed the worktree removal.** At 18:05:07 `git worktree remove` said "is not a working tree", and the orchestrator wrote that it "was already removed by the implementer's cleanup". The implementer ran no removal. `hop.worktrees/` changed at 13:04 CDT, the minute of `gh pr merge 13 --squash --delete-branch`, so it was most likely gh's cleanup. Harmless, but it is an unverified claim in the log.
11. **Housekeeping:**
    - 5 leftover temp files in `/tmp` and `$TMPDIR`
    - the stale `origin/feat/reserved-routes-guard-g1` tracking ref
    - the leftover `briefs/pr-13.md`

Nothing found needs a code fix on main. The fixes that matter before the next run are items 1, 2, 3 and 5, plus deciding whether the reviewer's lack of caching is acceptable.
