# Act 10: verification of the first real unattended loop run

Verifier: independent check after the fact, on 2026-10-02. I changed no product code. I merged nothing and ran no codex, claude or loop. I read records, ran tests and used read-only gh commands.

Run under test: `.agents/loop/loop.log` says `iteration=1 start=2026-10-02T16:59:43Z end=2026-10-02T17:17:56Z exit=0 open_before=3 open_after=0`. That is 18m13s. It merged PRs #9, #10 and #11 of OpenSpec change `polish` and archived it in `014d6fd`.

Sources used:
- `.agents/loop/runs/20261002T165943Z-i1.json`: 127 lines of Codex exec JSON events. It covers the orchestrator thread only. It holds 36 commands, 18 messages, one file change and 16 `collab_tool_call` events, all of them `wait`. **It records no spawn calls and no model names.**
- `.agents/loop/runs/20261002T165943Z-i1.json.err` (the `.err` file has that name).
- The Codex session rollouts in `~/.codex-loop/sessions/2026/10/02/`. There are 8 of them: the orchestrator plus 7 subagent threads. These are the only record of which agents and models ran. They are outside the repo.

## Verdict in one paragraph

The end result is sound. All three task groups are done as the tasks ask, and main is healthy: `npm run verify` and the full preflight are green, e2e passed 5 of 5 times on 1 worker, the board is empty, there is one worktree and remote has only `main`. The orchestrator did dispatch subagents and did not write product code. It verified each PR on the exact head with preflight, sent one PR back, merged only after a posted PASS, commented "on the human's behalf" with the merge sha, rebased, re-verified and archived. **But the review step did not work the way the setup intends, and that should be said plainly before this run is presented as proof.**
- The configured cross-vendor reviewer (`z-ai/glm-5.3`) got an empty brief. Codex sends the spawn message as OpenAI encrypted content, and GLM cannot read it.
- The same reviewer crashed on PR #10 with "No endpoints found that support image input".
- The orchestrator then reviewed PRs #10 and #11 with OpenAI models that it picked itself (`gpt-6-sol`, `gpt-6-luna`), through the generic `default` agent rather than the `reviewer` agent.
- It told those reviewers not to look at screenshots, and it never looked at a screenshot itself.

Only 1 of the 3 merged PRs was reviewed by the configured reviewer, and that reviewer worked without its brief.

## 1. Process the orchestrator followed

### Who ran, on which model (from the rollouts' `turn_context` and `session_meta`)

| Thread | Agent type / task name | Model | Spawn |
|---|---|---|---|
| orchestrator | codex exec | `openai/gpt-5.6-sol` | - |
| impl g1 | `implementer` / implement_polish_g1 | `openai/gpt-5.3-codex` (effort low) | `fork_turns: "all"` |
| impl g2 | `implementer` / implement_polish_g2 | `openai/gpt-5.3-codex` (low) | `fork_turns: "all"` |
| impl g3 | `implementer` / implement_polish_g3 | `openai/gpt-5.3-codex` (low) | `fork_turns: "all"` |
| reviewer PR #9 | `reviewer` / review_polish_g3 ("Bacon") | `z-ai/glm-5.3` (low) | `fork_turns: "none"` |
| reviewer PR #10 | `reviewer` / review_polish_g2 ("Herschel") | `z-ai/glm-5.3` | failed twice, posted nothing |
| reviewer PR #10 fallback | **`default`** / review_polish_g2_fallback | **`gpt-6-sol`** (high), model override set by the orchestrator | `fork_turns: "none"` |
| reviewer PR #11 | **`default`** / review_polish_g1 ("Halley") | **`gpt-6-luna`** (high), model override set by the orchestrator | `fork_turns: "none"` |

The orchestrator made 7 `spawn_agent` calls, 4 `followup_task`, 3 `send_message`, 16 `wait_agent` and 4 `list_agents`. It did not do the implementation itself. Its one file change was deleting `.ledger-cache.json`. Its only commit was the archive. Every implementer edit, commit and PR came from the gpt-5.3-codex threads.

Each reviewer differed from the implementer's model (gpt-5.3-codex), so the letter of the rule held. But:
- **The configured reviewer was used for PR #9 only.** PRs #10 and #11 were reviewed by OpenAI models from the orchestrator's own family. `.codex/agents/reviewer.toml` picks GLM on purpose, for "a different vendor ... so it has different blind spots". The orchestrator overrode that for two of the three PRs.
- Both fallbacks were spawned as `agent_type: "default"`, so the reviewer agent's `developer_instructions` were not loaded. Both did read `.agents/review/reviewer.md`, apparently because the brief told them to.
- The model ids `gpt-6-sol` and `gpt-6-luna` have no vendor prefix, unlike every other OpenRouter id in the config. The threads ran and used tokens, so OpenRouter answered. Which model was actually billed is not recorded anywhere I can reach with the key endpoint.

### The reviewer brief never reached the GLM reviewer

In every subagent rollout, the brief arrives as `{"type": "encrypted_content", "encrypted_content": "gAAAA..."}`. The OpenAI models (implementers, gpt-6 reviewers) can read it. GLM cannot:
- Herschel (PR #10, GLM) at 17:07:05: "The instructions require a PR number and change name, but the task payload is empty. I'll check the open PRs..."
- Bacon (PR #9, GLM) at 17:03:40: "The reviewer requires a PR number and change name. I'm checking the open PRs now." It then picked PR 9 from the open list and task name.

So the PR #9 review was done without the orchestrator's brief. That brief should have carried the PR number, the change, "do not read any implementer notes" and the head to review. The review itself is reasonable. It ran `npm run verify` and `E2E_PORT=4393 npm run e2e` in the g3 worktree (workdir checked), and it read the diff, the spec and the mutation file.

### Verification of each report (skill step 6)

For each PR, the orchestrator ran: `git fetch origin`, `gh pr view` (head, files, body, mergeable), `gh pr diff --name-only`, `gh pr diff`, the worktree `log origin/main..HEAD` and `status --short`, `merge-base --is-ancestor`, `agentboard show`, and `E2E_PORT=4399 bin/preflight.sh <headRefOid>`. Exact heads and preflight results:

| PR | Preflight on head | Exit | Reviewed head | Merged head |
|---|---|---|---|---|
| #9 | 33d40c9 | 0 | 33d40c9 | 33d40c9 -> 3f4d005 |
| #10 | 67ee2d2 (after send-back and rebase) | 0 | 67ee2d2 | 67ee2d2 -> 289a51c |
| #11 | 7750e59, then 145a866 after the rebase | 0, 0 | 145a866 | 145a866 -> d6444ec |

- **Send-back:** PR #10's first head did not match design decision 3. It had `flex-shrink: 1` instead of `flex: 0 1 auto` plus `min-width: 0`. The orchestrator recorded "Verify failed", then "Send-back round 1", handed the ticket back to `impl-g2` and used `followup_task`. This is the skill working.
- **Rebase:** after PR #10 merged, PR #11 was rebased and its evidence refreshed. The orchestrator ran `git range-diff 3f4d005..7750e59 origin/main..origin/feat/polish-g1` and preflight on the new head before review.
- **Evidence values:** the orchestrator read them only through `gh pr diff`, where the JSON and txt records appear as text. **It never looked at a screenshot.** There is no `view_image` call in its thread. For PR #10 it ran `sips` for pixel sizes only. Yet its message at event 35 says "PR #10's evidence clearly shows the intended visual improvement". Step 6 says "look at the screenshots", and the rubric lesson on clipped elements exists for exactly this case.
- **Reviewers told not to look either:** after GLM crashed on image input, both gpt-6 reviewers opened with "I'll check screenshot files with shell metadata only". The PR #10 review says "Screenshot contents were not inspected." To its credit, it did its own bounding-box check: on main's CSS the tag ended 59px outside the cell and the URL was 0px wide; on the PR's CSS the tag fit and a `campaign` URL was 346.75px.

### Merge only after PASS, and comments on tickets

Each merge came after `gh pr view <n> --json reviews,headRefOid` showed a posted PASS on the same head that passed preflight, and after an up-to-date check. The ticket comments in `agentboard show` read:
- `Merged PR #9 as 3f4d0050defbb05098bb345952cd876371522559 on the human's behalf after review PASS and green preflight`
- `Merged PR #10 as 289a51cae7cd0f1452e5f880e379fb00f6a19931 on the human's behalf ...`
- `Merged PR #11 as d6444ecbcddefb17c9d4ec5b44bdead10052e373 on the human's behalf ...`

Each ticket also has its "Plan: runs in wave 1, after none" comment and the reviewer's verdict comment. Cleanup after each merge: `git pull --ff-only`, `git worktree remove`, `git branch -D`, `git worktree prune`.

### Sequence of key actions (UTC; from the rollouts, which carry timestamps)

| Time | Action |
|---|---|
| 16:59:43 | loop starts |
| 16:59:47-17:00:05 | reads orchestrate and agentboard skills, DEFINITION_OF_DONE, inbox, health, todo list, tickets, design.md and tasks.md; posts "Plan: runs in wave 1" on all 3 tickets |
| 17:00:10 / :14 / :19 | spawns implementers g1, g2, g3 (gpt-5.3-codex, fork_turns all) |
| 17:03:07 | g3 reports PR #9; 17:03:12-:32 orchestrator verifies, preflight 33d40c9 exit 0 |
| 17:03:13 | g2 reports PR #10 |
| 17:03:36 | spawns GLM reviewer for PR #9 |
| 17:03:39-:57 | verifies PR #10, finds the design mismatch, records verify failed and send-back round 1, `followup_task` to impl g2 |
| 17:04:34 | GLM posts PR #9 review: PASS 5/5 |
| 17:04:43-:51 | confirms review on head 33d40c9, merges #9 (3f4d005), comments, closes, removes worktree |
| 17:05:01 / :03 | tells g2 and g1 to rebase on the new main (no ticket comment for this) |
| 17:06:22 | g2 reports the fixed, rebased PR #10 (67ee2d2); 17:06:26-:56 re-verify, preflight exit 0, `sips` sizes |
| 17:07:00 | spawns GLM reviewer for PR #10; 17:07:46 error `404 No endpoints found that support image input`; 17:07:51 retry, same error at 17:07:58 |
| 17:08:03 | spawns fallback reviewer: `default` agent, `gpt-6-sol`, effort high |
| 17:09:08 | g1 reports PR #11 (7750e59); 17:09:15-:33 verify, preflight exit 0 |
| 17:10:34 | PR #10 review posted: PASS 4/5, two NITs |
| 17:10:47 | spawns PR #11 reviewer: `default` agent, `gpt-6-luna`, effort high |
| 17:11:00 | merges #10 (289a51c); comments, closes, cleans up |
| 17:11:12-:23 | comments and hands ticket g1 back for a rebase, `followup_task` to impl g1, tells the reviewer to wait |
| 17:12:35 | g1 reports the rebased PR #11 (145a866); 17:12:44-17:13:16 verify with range-diff, preflight exit 0, handoff to reviewer-g1 |
| 17:13:20 | re-tasks the reviewer; 17:16:01 PR #11 review posted: PASS 5/5 |
| 17:16:17-:27 | confirms review on head, merges #11 (d6444ec), comments, closes; board empty, health clean |
| 17:16:36-17:17:10 | openspec list, status and instructions; checks the spec deltas; `openspec archive polish --yes`; strict validation |
| 17:17:17 | commits and pushes the archive `014d6fd` (pre-push gates ran) |
| 17:17:29-:51 | runs the ledger (it reports $0, see section 7), deletes `.ledger-cache.json`, final status |
| 17:17:56 | exit 0 |

### Writes outside the repo and the hop.worktrees folder

- `git -C /Users/ben/Projects/software-factory-workshop status --short`: empty. The workshop repo is untouched. The orchestrator only read `tools/ledger`.
- `/tmp`, from implementers and reviewers:
  - `polish-g1-before-{1..20}.log`, `polish-g1-after-{1..5}.log`, `polish-g1-preflight-{1..5}.log`, `polish-g1-preflight-rebase-{1..5}.log`, `polish-g1-single.log`
  - `pr-body-g1.md`, `pr-polish-g2.md`, `style-g2-new.css`, `evidence-help-g2.txt`
  - `review-pr-10-g2.md`, `review-pr-11.md`
  - That is 43 files, still present.
- `$TMPDIR`: `review-pr-9.md` and `tmp.NtQlMx0ybx/{before,after}.png` (from the GLM reviewer). The preflight exports were cleaned up.
- `~/.codex-loop`: Codex state, sessions and sqlite. This is expected.
- Inside the repo, but worth knowing: the PR #11 reviewer ran `git fetch origin pull/11/head:refs/remotes/origin/pr-11` in the main checkout, which left a stray ref.
- The `.err` file holds 3 transient `exec_command failed: CreateProcess ... No such file or directory` errors, each retried successfully, and 2 failed `apply_patch` context matches by impl g2, each retried. Harmless.

## 2. The three PRs

All three reviews were posted by `bendechrai` (the one gh account) with state `COMMENTED`. **No review body names its model.** Model provenance exists only in `~/.codex-loop`. All three PR bodies link their screenshots to `blob/feat/polish-gN/...`. Those branches are deleted, so the images now return 404. I checked the g2 after link: 404 on the branch, 200 on main.

### PR #9, group 3: health test (3f4d005)
- **Files:** `src/app-health.test.ts` (+14), `openspec/changes/polish/tasks.md` (3.1 and 3.2 ticked only), and `evidence/polish/g3/*`. In scope.
- **Evidence:** table shows before a305a56, after 3161a1f. These match `before.json` / `after.json` `shortCommit`, and 3161a1f is a PR commit. The mutation row names 33d40c9.
- **Review:** GLM, PASS 5/5. It does not name its model.
- **Rubric:** tests are at the HTTP layer, which is right for a mount-order rule. There is a red state via mutation. Layering n/a. No dead code. The test also inserts an extra `legacy-one` link, which was not asked for but is harmless.
- **Before/after screenshots:** byte-identical (`cmp`). That is expected, because the behavior already held, and design.md says so.

### PR #10, group 2: destination column (289a51c)
- **Files:** `bin/evidence.mjs`, `e2e/labels.spec.ts`, `public/app.js`, `public/style.css`, `tasks.md` (2.1-2.4 only), and `evidence/polish/g2/*`. In scope.
- **Evidence:** table shows before a305a56, after 4aea761. These match the records, and 4aea761 is a PR commit. All 8 steps are ok in both records.
- **Review:** gpt-6-sol fallback, PASS 4/5, two NITs. It does not name its model.
- **What holds:**
  - one `.label-tag` block, with `flex: 0 1 auto`, `min-width: 0`, `max-width: 55%`, nowrap and ellipsis
  - `.dest-url` has `flex: 1 1 auto` and the 240px cap is gone
  - `tag.title` is set with `textContent`, not `innerHTML`
  - the viewport step is validated and listed in the usage text
  - the new e2e test checks the tag box is inside the cell and the URL width is above 0, for both a long and a short destination
- **Gaps that were merged as NITs:**
  - The spec scenario "A long destination with a short label -> the URL shows well beyond 240px" has no test. Its regression could return unnoticed. The reviewer saw this and called it a NIT. Under rubric 2/3 it is a spec scenario without a test. The behavior does hold, as the reviewer measured.
  - design.md decision 3 says the implementer "says which [cap] in the PR". The PR body does not mention that 55% was chosen instead of 60%.

### PR #11, group 1: e2e workers (d6444ec)
- **Files:** `playwright.config.ts` (+3), `e2e/hop.spec.ts` (comment only, +2 -1), `tasks.md` (1.1-1.4 only), and `evidence/polish/g1/*`. In scope.
- **Evidence:** table shows before 3f4d005, after d6293e2. These match the records, and d6293e2 is a PR commit. The real evidence is `before.txt` and `after.txt`. The `evidence.mjs` record only checks `/stats`, and its before and after screenshots are byte-identical. It proves nothing about the flake and is there as ritual.
- **Review:** gpt-6-luna, PASS 5/5. It does not name its model.
- **Rubric:** it is a config and comment change, so there is no layering. The test layer is right.

## 3. Group 1 checks

`playwright.config.ts` on main:
```
  fullyParallel: false,
  // Every spec file shares one web server and one throwaway SQLite file, so
  // workers stay at 1 to keep files from racing each other.
  workers: 1,
```
That is the why-comment the task asked for.

- **`before.txt`:** 20 runs on a305a56, all `Running 11 tests using 5 workers`. Run 13 failed with `hop.spec.ts:8:1 > the stats page shows zeros...`, `Locator: locator('#total-links') Expected: "0"`. The other 19 passed. This is the failure design.md describes, so it makes sense. The "Received" value was filtered out of the saved lines.
- **`after.txt`:** 5 runs, `using 1 worker`, all exit 0.
- **`preflight.txt`:** 5 runs, exit 0. These ran on 8cf41a4, before the second rebase, not on the final head 145a866. The final head did get the pre-push preflight and the orchestrator's preflight. So task 1.4's "on the pushed commit" is only partly met.

My 5 runs of `npm run e2e` on main (014d6fd, `E2E_PORT=4399`):

| Run | Workers | Result |
|---|---|---|
| 1 | Running 11 tests using 1 worker | exit 0, 11 passed (4.8s) |
| 2 | using 1 worker | exit 0, 11 passed (3.6s) |
| 3 | using 1 worker | exit 0, 11 passed (3.7s) |
| 4 | using 1 worker | exit 0, 11 passed (3.8s) |
| 5 | using 1 worker | exit 0, 11 passed (5.1s) |

A caveat on what 5 passes prove. With a base failure rate of about 1 in 20, an unfixed suite would still pass 5 runs in a row about 77% of the time (0.95^5). The fix is credible because of how it works, not because of the run count. With one worker, files run in name order (export, then hop, then labels), and export deletes its link before hop's empty-database test runs.

## 4. Group 2 checks

- **`before-labels-wide.png`** (1280x829): the destination cell shows only the W tag. It runs to the cell's right edge and is clipped there, and no URL text is visible. So the tag overflows and the URL is gone. Correct.
- **`after-labels-wide.png`** (1280x829): the cell shows `https://example.com/some/really/lon...` with an ellipsis, then a short `WWWWWWW...` tag that ends well inside the cell. So the tag is inside and the URL is visible. Correct.
- **`bin/evidence.mjs`:** `viewport` was added to `STEP_KINDS`, `parseSteps` checks for positive integer width and height, `runStep` calls `page.setViewportSize` and returns `{ ok: true, viewport }`, and the usage text lists it. The steps file starts with the viewport step.
- **New labels e2e test:** `npx playwright test e2e/labels.spec.ts -g "url stays visible"` gave `1 passed (1.6s)`. It also passes in the full suite.
- **`grep -c "\.label-tag" public/style.css`:** 1, one block at line 210.

## 5. Group 3 checks

- **The test exists:** `src/app-health.test.ts`, "GET /health wins over a stored legacy health code and counts it".
- **It passes:** `node --test --test-name-pattern="legacy health" src/app-health.test.ts` gave pass 1, fail 0. It also passes inside `npm run verify` (84 tests).
- **`mutation-fail.txt`:** shows `pass 3 fail 1`, with `test at src/app-health.test.ts:65:1 ... 302 !== 200`. That is the new test failing when `/health` is mounted below the redirect. The rollout shows the mutation was undone with `git checkout src/app.ts` in the same command, and the next `git status` did not list `src/app.ts`.

## 6. Main health

| Check | Result |
|---|---|
| `npm run verify` | exit 0, 84 tests pass |
| `E2E_PORT=4399 bin/preflight.sh HEAD` | exit 0, "PREFLIGHT PASSED - 014d6fd is safe to push". Gates install, verify, build, audit, migrations and e2e all ok. |
| `agentboard list --change polish` | empty, exit 0 |
| `agentboard health` | stale 0, blocked 0, unpromoted decisions 0, close-merged ready / held / missing 0 |
| `git worktree list` | only `.../demo/hop 014d6fd [main]`; `hop.worktrees/` is empty |
| local branches | only `main` |
| remote (`git ls-remote --heads origin`) | only `refs/heads/main` |
| open PRs | none |
| stale local remote-tracking refs | `origin/feat/polish-g1`, `-g2`, `-g3`, `origin/pr-11` (from the reviewer's fetch), `origin/fix/reserved-codes-g1` (older). Cosmetic; `git fetch --prune` and `git update-ref -d refs/remotes/origin/pr-11` clear them. |

## 7. Cost

Token usage from each thread's final `token_count`, which the rollouts count from zero per thread. The orchestrator row matches the `turn.completed` event in the run JSON exactly.

| Thread | Model | Input | of which cached | Uncached input | Output (reasoning) |
|---|---|---|---|---|---|
| orchestrator | openai/gpt-5.6-sol | 5,811,293 | 5,690,055 | 121,238 | 13,058 (2,622) |
| impl g1 | openai/gpt-5.3-codex | 2,359,879 | 2,219,904 | 139,975 | 13,421 (4,709) |
| impl g2 | openai/gpt-5.3-codex | 2,460,280 | 2,326,400 | 133,880 | 12,895 (3,442) |
| impl g3 | openai/gpt-5.3-codex | 1,017,702 | 964,864 | 52,838 | 8,255 (2,469) |
| review #9 | z-ai/glm-5.3 | 288,017 | 240,000 | 48,017 | 5,369 (3,206) |
| review #10 (failed) | z-ai/glm-5.3 | 278,668 | 248,896 | 29,772 | 5,625 (1,888) |
| review #10 fallback | gpt-6-sol | 838,189 | 776,029 | 62,160 | 11,253 (7,001) |
| review #11 | gpt-6-luna | 1,009,336 | 937,342 | 71,994 | 19,641 (15,799) |
| **Total** | | **14,063,364** | **13,403,490** | **659,874** | **89,517 (41,136)** |

By model:
- gpt-5.6-sol: 5.81M input
- gpt-5.3-codex: 5.84M input
- glm-5.3: 0.57M input
- gpt-6-sol: 0.84M input
- gpt-6-luna: 1.01M input

95% of input tokens were cache reads.

OpenRouter key now: `usage 8.434`, `limit None`, `limit_remaining None`. Against about $3.70 before the run, **the run cost an estimated $4.73**, give or take a few cents. Any other use of the key in that window would also be in this figure; `usage_daily` equals `usage`, so all of it was today.

The orchestrator did not record cost as skill step 13 asks:
- The ledger reads Claude transcripts only, so it printed `TOTAL 0 ... $0.00` twice.
- The orchestrator then deleted the `.ledger-cache.json` the ledger had made (it is untracked and not gitignored).
- Its final summary leaves cost out.

## 8. What is wrong, risky, skipped or off-skill, and fixes still needed

Ordered by how much each one matters for presenting this as proof.

1. **The cross-vendor reviewer gets no brief.** Codex passes `spawn_agent` / `followup_task` messages as OpenAI `encrypted_content`, and `z-ai/glm-5.3` sees an empty payload (quoted above). The PR #9 review was done blind and had to infer the PR.
   - Fix: do not depend on the message body for non-OpenAI agents. Either have the orchestrator write the brief to a file such as `.agents/loop/briefs/<task_name>.md` or a ticket comment, with the reviewer's `developer_instructions` telling it to read that by its task name. Or pick a reviewer that can read the brief, and test the setup before the next run.
2. **GLM cannot take images, so it crashed reviewing PR #10.**
   - Fix: choose a non-OpenAI reviewer on OpenRouter that supports image input. Or tell `reviewer.md` to read screenshots only through bounding-box or measurement scripts, and make that the rule for any model without vision.
3. **The orchestrator swapped reviewers on its own authority:** `default` agent, `gpt-6-sol` / `gpt-6-luna`, high effort, ids with no vendor prefix. This bypassed `.codex/agents/reviewer.toml`, and 2 of 3 PRs were reviewed by the implementer's vendor.
   - Fix: in the skill or prompt, say the reviewer must be the configured `reviewer` agent. If it fails, block the ticket for a human instead of picking another model. Or name an approved fallback model in config.
4. **Nobody in the loop looked at the screenshots.** The orchestrator used `sips` only and still wrote "clearly shows". It told the fallback reviewers to use "shell metadata only". This breaks step 6 ("look at the screenshots") and weakens the clipped-element lesson. I looked, and they are correct, but the loop did not establish that.
   - Fix: the orchestrator (gpt-5.6-sol, which accepts images) must `view_image` each screenshot before review. Its ticket comment should say what it saw.
5. **A spec scenario was merged untested:** "URL shows well beyond 240px with a short label". The PR also does not state its 55% cap, which design decision 3 requires.
   - Fix: a small follow-up that adds a `campaign` row assertion (URL width above 240) in `e2e/labels.spec.ts`. Consider telling the reviewer that a spec scenario with no test is CHANGES, not a NIT.
6. **Shell-injection hazard with the sandbox off.** Impl g3 put markdown with backticks inside zsh quotes twice. An apostrophe in "file's" ended the single quote, so zsh ran `git checkout src/app.ts`, `npm run verify`, `node --test ...` and `git status` as command substitutions. In `gh pr create --body "..."` it tried to run `src/app-health.test.ts`, `/health` and others ("permission denied", "command not found"). Nothing broke this time, but with `danger-full-access` and `approval_policy = "never"` this is a real risk.
   - Fix: tell implementers to pass PR bodies with `--body-file` from a quoted heredoc (`<<'EOF'`) and never inline markdown in a shell string.
7. **PR body screenshot links point to deleted branches** and are 404 on all three PRs.
   - Fix: the evidence skill should link by commit sha (`blob/<sha>/...`), or the orchestrator should rewrite the links before merge.
8. **Audit trail.** The repo's run JSON records no spawns and no models; only `~/.codex-loop` does. The reviews do not name their model.
   - Fix: copy the run's rollout files into `.agents/loop/runs/<run>/`, and have `reviewer.md` ask for a `Model:` line in each review.
9. **No cost record.** The ledger is Claude-only and printed $0, and the orchestrator left cost out of its summary.
   - Fix: the loop script records the OpenRouter `/key` usage before and after each iteration (or ledger support for Codex rollouts), and gitignores `.ledger-cache.json`.
10. **Implementers forked with `fork_turns: "all"`.** They inherit the orchestrator's whole context, including "You are the orchestrator". They worked anyway, but that invites role confusion and costs tokens.
    - Fix: tell the orchestrator to use `fork_turns: "none"` with the full brief, as it did for reviewers.
11. **Smaller deviations:**
    - The first round of rebase instructions after PR #9 merged went by `send_message` with no ticket comment.
    - Task 1.4's 5 preflight runs were not on the final pushed commit.
    - The g1 `evidence.mjs` record (`/stats`, identical screenshots) is irrelevant to the fix.
    - The g1 before record is at 3f4d005 while its `before.txt` runs were at a305a56.
    - The skill's haiku chore agent for rebases has no Codex equivalent, and the implementers did the rebases. That is acceptable, since the skill sends rebased PRs back for new evidence anyway.
12. **Housekeeping:** 43 leftover files in `/tmp` plus `$TMPDIR` review files, and the stray `refs/remotes/origin/pr-11` and stale tracking refs. All are cosmetic.

**Nothing found needs a code fix on main today, beyond the optional test in item 5.** The fixes that matter before the next run are in the loop setup: items 1 to 4, 6 and 9.
