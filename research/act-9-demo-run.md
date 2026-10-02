ACT 9 REPORT - orchestrated build of link-labels on hop-demo

Short version: all four parts are done. The orchestrate skill and the implementer agent are on main. link-labels was proposed with 3 groups, and groups 1 and 3 ran in parallel, then group 2 ran. All 3 PRs passed review on opus and were squash-merged. The change is archived, the board is empty and no worktrees are left. Total cost was $8.15 API-equivalent. I merged all three PRs myself, on the human's behalf, because the workshop demo has no human at this step. Each merge came after a review PASS and a green preflight I ran myself on the exact head commit, and I said so in a comment on each ticket. I wrote no product code. Nobody used --no-verify.

== PART 1: tooling (main 963dceb, then lessons in 49568ef, 6e37d6e, 915c648) ==
Files:
- /Users/ben/Projects/software-factory-workshop/demo/hop/.agents/skills/orchestrate/SKILL.md (.claude/skills is a symlink to .agents/skills)
- .claude/agents/implementer.md
- .codex/agents/implementer.toml, .gemini/agents/implementer.md, .cursor/agents/implementer.md. Each is marked "Written from the docs, not run" and points at the body of .claude/agents/implementer.md.
- AGENTS.md got one line: "A whole change is built with the `orchestrate` skill: one orchestrator session dispatches an implementer per ticket, verifies each result, has it reviewed on a different model and merges what passes."
- Templates are in /Users/ben/Projects/software-factory-workshop/templates/act-9/, with the same relative paths, plus .agents/review/rubric.md because of its new lesson. They are committed in the workshop repo as 0621e56 and 104a781, which is the only thing committed there. The workshop repo was not pushed.

--- orchestrate SKILL.md (verbatim, final, as committed in 915c648) ---
---
name: orchestrate
description: Builds a whole OpenSpec change by dispatching one implementer subagent per ticket into its own worktree, verifying every result, sending each PR to a reviewer on a different model, merging what passes and archiving the change. Use when asked to build, run or orchestrate a change end to end, or to work the board until it is empty.
---

# orchestrate

One session is the orchestrator. It reads the board, dispatches one
subagent per ticket, checks every result itself, gets every PR reviewed by
a different model, merges what passes and goes back to the board until the
change is done. The orchestrator judges. It writes no product code.

The human owns the spec (the proposal, design and tasks are agreed before
this starts) and anything the loop blocks. Replace `<change>`, `<id>`,
`<n>`, `<g>` and `<branch>` below. Your actor is `orch`.

## Model routing

| Job | Model | Why |
|---|---|---|
| Orchestrator (you) | the strongest model available | it judges other agents' work |
| Implementer | `sonnet` | writes code to a clear spec |
| Reviewer | a different model from the implementer: `opus` when the implementer is `sonnet`, or the OpenRouter second opinion (`node bin/second-opinion.mjs`) | a different model has different blind spots |
| Mechanical chores | `haiku`, only for deterministic chores with a clear pass/fail (a rebase with no conflicts, re-running a gate and reporting the exit code) | cheap, and the result is checked anyway |

If the implementer was not on `sonnet`, pick a reviewer model that differs
from whatever it was.

## The loop

1. **Read what is new.** `agentboard inbox --as orch`. Act on every entry
   (a block, a comment, a decision) before dispatching anything.

2. **Check health.** `agentboard health`. Release stale claims
   (`agentboard release <id> --as orch` after checking the holder is gone),
   and look at anything stuck in blocked or any unpromoted decision first.

3. **List the work.** `agentboard list --change <change>` and
   `agentboard list --status todo`. For each ticket, `agentboard show <id>`
   gives its group. If the change has no tickets yet:
   `agentboard import-change <change> --as orch`.

4. **Decide the order.** Read `openspec/changes/<change>/design.md` for the
   dependency note and the files each group touches, and
   `gh pr list --state open --json number,headRefName,files` for work
   already in flight.
   - A group that depends on another waits until that group's PR has merged.
   - Independent groups that touch different files run in parallel.
   - Two groups that touch the same file run one after the other, unless
     design.md names the shared file and says how the second one rebases
     (for example one mount line each in `src/app.ts`).
   Write the plan as a ticket comment on each ticket:
   `agentboard comment <id> "Plan: runs in wave <w>, after <dep or none>" --as orch`.

5. **Dispatch one implementer per ready ticket.** Use the harness's
   subagent tool (Claude Code: the Agent tool, or the `implementer` agent in
   `.claude/agents/implementer.md`) with model `sonnet`. Start all the
   parallel ones in one message so they run at the same time. Fill in this
   brief and send it as the whole prompt:

   ```
   You are implementer actor impl-g<g> for ticket <id>.
   Repo main checkout: <absolute path to the repo>. Change: <change>. Task group: <g> (<group title>).
   Read .claude/agents/implementer.md and follow it exactly.
   Worktree: <repo>.worktrees/feat-<change>-g<g>, branch feat/<change>-g<g>, from origin/main (new-feature skill).
   Ports: E2E_PORT=<4390 + g> for every e2e run and for every push (E2E_PORT=<4390 + g> git push ...), because the pre-push gate runs the browser test.
   Evidence folder: evidence/<change>/g<g>/ (not evidence/<change>/, which another group may also be writing).
   Do only the tasks of group <g>. Touch only the files design.md names for group <g>.
   Do not start a reviewer and do not merge: the orchestrator does both.
   When the PR is open: agentboard link <id> --pr <n> --as impl-g<g>, then
   agentboard handoff <id> --to orch --status review --note "<PR url>" --as impl-g<g>.
   If you are blocked, block the ticket with a comment and report back.
   Report back in the format in .claude/agents/implementer.md, nothing else.
   ```

   For a send-back (step 8) add: `This is review round <k>. Fix these findings: <findings>. Push to the same branch.`

6. **Verify the report yourself.** A report is a claim. Check each line
   before accepting it. Do all of these:

   ```
   git fetch origin
   gh pr view <n> --json number,state,headRefName,headRefOid,baseRefName,body,files,mergeable
   gh pr diff <n> --name-only        # every file is in the group's scope (tasks.md + design.md)
   gh pr diff <n>                    # read it: does what the tasks ask, nothing more, smallest change
   git -C <worktree> log --oneline origin/main..HEAD   # commits match the report, branch is not main
   git -C <worktree> status --short                     # nothing left uncommitted
   git merge-base --is-ancestor origin/main origin/<branch> && echo up-to-date
   E2E_PORT=4399 bin/preflight.sh <headRefOid>          # every gate, on the exact commit, in a clean export
   ```

   Then check by reading:
   - The group's task lines are ticked in `tasks.md` in this PR, and no
     other group's lines are.
   - The PR body has a `## Evidence` table whose short shas match
     `shortCommit` in `evidence/<change>/g<g>/before.json` and `after.json`,
     and the after record has every step `ok: true`. `ok: true` is not
     enough: read the actual values and look at the screenshots. An
     `expectText` is a substring match, and a step file with no wait after a
     submit can race and drop a row while every step still passes.
   - Every waiver is written as `Waived: <gate> - <reason>` and the reason
     holds up.
   - `agentboard show <id>` shows the PR link and the handoff to `orch`.

   If any check fails, it is a send-back (step 8), not a review. Record it:
   `agentboard comment <id> "Verify failed: <what and how it was seen>" --as orch`.

7. **Review on a different model.** Dispatch a reviewer subagent with model
   `opus` (or a model that differs from the implementer's) and this prompt:

   ```
   You are actor reviewer. Read .agents/review/reviewer.md and follow it exactly
   for PR #<n>, change <change>. Post the review with gh pr review <n> --comment
   and comment the verdict on the ticket. Do not read any implementer notes.
   Reply with the review exactly as posted.
   ```

   Then check it was posted: `gh pr view <n> --json reviews` and
   `agentboard show <id>`.

8. **On `VERDICT: CHANGES` (or a failed verify).**
   - `agentboard comment <id> "Send-back round <k>: <findings>" --as orch`
   - `agentboard handoff <id> --to impl-g<g> --status implementing --note "Send-back round <k>" --as orch`
     (hand it back rather than asking the implementer to claim it: a claim
     on a ticket assigned to `orch` is refused, and the implementer rightly
     stops)
   - Dispatch an implementer (the same one with SendMessage if it is still
     alive, or a fresh one with the brief plus the findings) to fix the
     findings on the same branch.
   - Verify again (step 6) and review again (step 7).
   - At most 3 rounds. If round 3 still says CHANGES, stop:
     `agentboard comment <id> "3 review rounds, still CHANGES: <open findings>. Needs a human." --as orch`
     then `agentboard move <id> blocked --as orch`. Do not merge it.

9. **On `VERDICT: PASS` with every gate green.**
   - If the branch is not up to date with `origin/main`, it is rebased
     first (step 10) and verified again, so the commit that lands is the
     commit that was checked.
   - Merge. The merge is the human's decision; the orchestrator merges only
     when the human has delegated it, and says so on the ticket:
     ```
     gh pr merge <n> --squash --delete-branch
     agentboard comment <id> "Merged PR #<n> as <sha> on the human's behalf after review PASS and green preflight" --as orch
     agentboard move <id> merged --as orch
     agentboard close-merged --as orch
     ```
   - Clean up from the main checkout:
     ```
     git -C <repo> pull --ff-only
     git worktree remove <repo>.worktrees/feat-<change>-g<g>
     git branch -D feat/<change>-g<g>
     git worktree prune
     ```

10. **Keep the other open PRs current.** After every merge, for each open
    PR of the change: `git fetch origin` and check it is still based on
    `origin/main`. If it is not:
    - No conflict expected: dispatch a `haiku` chore agent to run
      `git -C <worktree> rebase origin/main`, then push with its E2E_PORT,
      and report the exit codes. If the rebase stops on a conflict, it runs
      `git rebase --abort` and reports that.
    - A conflict: dispatch a `sonnet` implementer to rebase and resolve it
      as design.md says.
    - Then verify that PR again (step 6) before it can merge. A rebase that
      changed code is reviewed again (step 7). Check with
      `git range-diff <old base>..<old head> origin/main..origin/<branch>`:
      `=` on every line means the code is unchanged.
    - A rebase rewrites every commit sha, so the evidence records and the PR
      body now name an after commit that is no longer in the PR. Send it back
      to the implementer to capture the evidence again on the new commits and
      update the PR body, even when the code is unchanged.

11. **Go back to the board.** Return to step 1 and dispatch whatever the
    merge unblocked, until `agentboard list --change <change>` is empty.

12. **Archive the change.** When every ticket of the change is closed:
    `agentboard close-merged --as orch`, `agentboard list --change <change>`
    (must print nothing), `agentboard health` (no unpromoted decisions),
    then follow the `openspec-archive-change` skill:
    `npx -y @fission-ai/openspec@1.14.0 archive <change> --yes`, check the
    synced specs under `openspec/specs/`, commit on main with a message
    that says why, and push (the pre-push gate runs).

13. **Record the cost.** From the workshop repository:
    ```
    node tools/ledger/ledger.mjs --project ~/.claude/projects/<project dir> --since <ISO time the run started> --by agent --no-cache
    node tools/ledger/ledger.mjs --project ~/.claude/projects/<project dir> --since <ISO time the run started> --by model --no-cache
    ```
    Add `--openrouter <repo>/.agents/review/openrouter-usage.jsonl` if a
    second opinion ran. Put both tables in the run's report.

## Never

- Never edit product code, tests or specs on a ticket's branch. Dispatch an
  agent for it. The orchestrator only reads, runs checks, merges, archives
  and writes to the board.
- Never merge without a review `VERDICT: PASS` and a green preflight on the
  exact commit being merged.
- Never trust a report you have not checked. Every claim in it (files,
  commits, exit codes, evidence, ticks) is checked as in step 6.
- Never run two tickets that touch the same files in parallel, unless
  design.md names the shared file and how the second one rebases.
- Never let the implementer review its own work, or a reviewer run on the
  implementer's model.
- Never go past 3 review rounds. Block the ticket for a human instead.
- Never push to main yourself while a PR of the change is open. Each push
  puts every open PR behind main and costs it a rebase, new evidence and a
  fresh verify. Hold tooling and skill fixes until the last merge.
- Never use `--no-verify`.
--- end SKILL.md ---

--- .claude/agents/implementer.md (verbatim) ---
---
name: implementer
description: Builds one ticket (one task group of an OpenSpec change) in its own worktree and opens its PR with evidence. Use when the orchestrator dispatches a ticket, with the ticket id, change, group, worktree, branch and E2E_PORT.
model: sonnet
---

You implement one ticket. The orchestrator gave you the ticket id, your
actor name, the change, the task group, the worktree folder and branch,
the E2E_PORT and the evidence folder.

Follow these, in this order, and read each before you start:

1. `AGENTS.md` and `DEFINITION_OF_DONE.md`.
2. `.agents/skills/new-feature/SKILL.md`: claim the ticket, create your
   worktree and branch from `origin/main`, `npm ci`.
3. `.agents/skills/code-structure/SKILL.md`: routes, actions, services.
4. `.agents/skills/agentboard/SKILL.md`: pass `--as <your actor>` on every
   board command; block with a comment if you are stuck.
5. `.agents/skills/openspec-apply-change/SKILL.md`, for your task group
   only. Tick your group's lines in `tasks.md` and no others.
6. `.agents/skills/evidence/SKILL.md`, in the evidence folder you were
   given.
7. `.agents/skills/review-loop/SKILL.md` for what to do with findings.
   In an orchestrated run the orchestrator starts the reviewer and merges.
   You do neither.

Rules:

- Work only in your worktree. Never edit, commit or check out anything in
  the main checkout. Never work on `main`.
- Touch only the files your task group and `design.md` name. If the task
  needs another file, stop and say why in your report.
- Use your E2E_PORT for every e2e run and every push
  (`E2E_PORT=<port> git push ...`), because the pre-push gate runs the
  browser test.
- Never use `--no-verify`. If a hook fails, fix the cause.
- Run every check after your last edit and quote the real exit code.

Report back in exactly this format and nothing else:

```
TICKET: <id>
BRANCH: <branch>
WORKTREE: <absolute path>
PR: <url>
COMMITS:
- <short sha> <subject>
CHECKS (after the last edit):
- npm run verify: exit <n>
- E2E_PORT=<port> npm run e2e: exit <n>
- pre-push preflight on <short sha>: exit <n>
EVIDENCE:
- evidence/<change>/g<group>/before.json: <short sha>, <k>/<m> steps ok
- evidence/<change>/g<group>/after.json: <short sha>, <k>/<m> steps ok
TASKS TICKED: <task numbers>
WAIVED: <"none", or each as "Waived: <gate> - <reason>">
NOTES: <anything you could not do, or saw and left alone>
```
--- end implementer.md ---

== PART 2: change link-labels (a24cb46) ==
- The proposal, three spec deltas, design.md and tasks.md were written with the openspec-propose flow. The deltas are link-labels (new), health-check (new) and custom-codes (MODIFIED: `health` becomes a reserved word, because the new route shadows that code).
- `openspec validate link-labels --strict` passed.
- `agentboard import-change link-labels --as orch` created these tickets:
  - group 1: 01M3XBYDND9SFZY1RB10VA65GV
  - group 2: 01M3XBYDNSME16CJ2C8YAHPM92
  - group 3: 01M3XBYDPBXM2FN0BSBD9YCQXJ
- design.md has a dependency table:
  - Group 2 depends on group 1 being merged.
  - Groups 1 and 3 can run in parallel.
  - It lists the files each group may touch.
  - It names src/app.ts as a shared file, with only group 3 expected to edit it.
- design.md also gives each group its own evidence folder, evidence/link-labels/g<n>/. Otherwise two branches would both write evidence/link-labels/steps.json.
- Group 3's HTTP test went in a new file, src/app-health.test.ts, so group 3 never edits src/app.test.ts, which group 1 edits.

--- tasks.md (archived at openspec/changes/archive/2026-10-01-link-labels/tasks.md; all 12 ticked by the implementing PRs) ---
# Tasks

## 1. Labels in the data

- [x] 1.1 Add `migrations/003-add-label.sql` adding a nullable `label TEXT` column to `links`; verify `npm run migrate` on an empty database applies it, a second run prints `applied 0`, and `src/services/migrations.test.ts` still passes
- [x] 1.2 Add `label: string | null` to `Link`, `label` to `LINK_COLUMNS` and to `toLink` in `src/services/link-row.ts`, and a fourth parameter `label: string | null = null` to `insert` in `src/services/links.ts` (and the same in `src/actions/fake-links.ts`); add `label: null` to hand-built `Link` values in tests where the typecheck asks; verify `src/services/links.test.ts` stores a label and reads it back through `get` and `list`, and reads `null` for a link inserted without one
- [x] 1.3 Add `src/actions/validate-label.ts` with the rule from design.md (trimmed, 1 to 40 letters, digits, spaces and hyphens; missing, null or blank means none; anything else is an error stating the rule); verify `src/actions/validate-label.test.ts` covers a valid label, trimming, blank, null, missing, 40 and 41 characters, a disallowed character and a non-text value
- [x] 1.4 Make `createLink` in `src/actions/create-link.ts` take `label`, check it after the expiry and store it; verify `src/actions/create-link.test.ts` shows a stored label, a blank label stored as null, and an invalid label refused with no link created
- [x] 1.5 Pass `label` from the request body in `src/routes/links.ts`; verify `src/app.test.ts` shows POST returning 201 with the label, POST with a 41-character label returning 400 and creating nothing, and `GET /api/links` and `GET /api/links/:code` returning `label` (a string, or `null` for a link without one)

## 2. Labels on the home page

Depends on group 1 being merged.

- [x] 2.1 Add an optional "Label (optional)" field to the form in `public/index.html` (maxlength 40, a pattern for letters, digits, spaces and hyphens), and send its value as `label` from `public/app.js`, clearing it after a link is created; verify by creating a labelled link from the page and seeing the label in `/api/links`
- [x] 2.2 Show each link's label as a small tag in its row (built with `textContent`, no tag for a link without a label), styled in `public/style.css`; verify by opening the home page with one labelled and one unlabelled link
- [x] 2.3 Add a "Filter by label" box above the table that shows only links whose label contains the typed text, ignoring case, hides unlabelled links while it holds text, says when no link matches, shows every link when cleared, and keeps applying after the five-second refresh; verify by typing in it on the home page
- [x] 2.4 Add `e2e/labels.spec.ts` (a new file, not `e2e/hop.spec.ts`) that creates links labelled `docs`, `Docs team` and `sales` and one with no label from the page, checks each row's tag, types `doc` in the filter and sees only the two docs rows, types a label nobody has and sees the no-match message, clears it and sees all four, and deletes its links at the end; verify `E2E_PORT=4392 npm run e2e` passes

## 3. Health endpoint

Independent of groups 1 and 2.

- [x] 3.1 Add `src/actions/get-health.ts` returning `{ status: "ok", links: <count> }` from the stats service's `totals()`; verify `src/actions/get-health.test.ts` with `fakeStats` shows the count passed through, 0 included
- [x] 3.2 Add `src/routes/health.ts` serving `GET /health` as JSON through the action, and mount it in `src/app.ts` above the short-code redirect (one import, one line); verify a new `src/app-health.test.ts` gets 200, `application/json` and `{"status":"ok","links":0}` on an empty database, then `links: 3` with three links one of them expired, and that no click count changed
- [x] 3.3 Add `health` to `RESERVED_CODES` in `src/actions/reserved-codes.ts`; verify `src/actions/reserved-codes.test.ts` refuses `health` and `Health`, and `src/app-health.test.ts` shows POST `/api/links` with the code `health` returns 400 and `/health` still answers

== PART 3: orchestration timeline (actor orch; PART 3 started 2026-10-02T03:53:56Z) ==
Every subagent was general-purpose with the model set per dispatch. The new implementer agent type is not loaded until the session restarts, so each brief told the agent to read .claude/agents/implementer.md.

Start:
- inbox and health were clean.
- I wrote a plan comment on each ticket: groups 1 and 3 in wave 1, group 2 after group 1 merges.

Wave 1 (both dispatched in one message):
1. Dispatched impl-g1 (sonnet) for group 1 and impl-g3 (sonnet) for group 3. Ports 4391 and 4393, worktrees in hop.worktrees/.
2. impl-g3 reported PR #6 (22d366a code, ccdbd68 evidence; verify, e2e and preflight exit 0; evidence before a24cb46 2/5, after 22d366a 5/5).
   - What I checked:
     - `gh pr view` and `gh pr diff --name-only`: every file in group 3 scope.
     - I read the full diff (minimal).
     - `git -C worktree log` matched the report; `status` was clean.
     - The branch was an ancestor-check up to date with origin/main.
     - before.json and after.json shortCommit matched the PR table.
     - The ticket showed the PR link and the handoff.
     - `E2E_PORT=4399 bin/preflight.sh ccdbd68` exit 0.
   - Accepted.
3. Reviewer (opus) on PR #6: PASS 4/5, 2 NITs (no test with an existing `health` row; red state not shown in commits). I confirmed it was posted on the PR and on the ticket.
4. Merged PR #6 (squash, --match-head-commit) as 89e32f3. Ticket moved to merged and closed by close-merged. Worktree, local branch and remote branch removed. NITs not taken.
5. impl-g1 reported PR #7 (1696eca code, 9f64e60 evidence; all checks exit 0; evidence before a24cb46 5/9, after 1696eca 9/9).
   - Verified the same way: 20 files, all on design.md's group 1 list; diff read; preflight on 9f64e60 exit 0.
   - Board process note recorded on both tickets: implementers moved the ticket todo->tests->implementing only at the end.
6. Reviewer (opus) on PR #7: PASS 4/5, 3 NITs (no error-order test, inaccurate trim comment, red state not in commits).
7. PR #7 was now behind main because of the #6 merge. Dispatched a haiku chore agent to rebase onto origin/main and push with E2E_PORT=4391. It reported rebase, verify and push all exit 0, new head ada95de.
8. My verify after the rebase failed. range-diff showed both commits unchanged ("="). But after.json and the PR body named 1696eca, which is no longer in the PR (rubric 4). Recorded on the ticket.
   - SEND-BACK round 1: re-capture the evidence.
9. My send-back told impl-g1 to claim the ticket. The claim was refused (already assigned to orch), and impl-g1 correctly stopped and reported BLOCKED. I handed the ticket to impl-g1 with handoff and re-sent. This was my mistake; the skill is now fixed.
10. Meanwhile I pushed a skill fix to main (49568ef). That moved main, so impl-g1 had to rebase again.
11. impl-g1 round 1 result:
    - Rebased onto 49568ef.
    - Took NITs 1 and 2 in one commit, a9ecf4a.
    - Re-captured: before 49568ef 5/9, after a9ecf4a 9/9. Head 9cb4a6e. Checks exit 0.
    - I verified that a9ecf4a is in the PR and that the new code is only the NIT test and comment. Preflight on 9cb4a6e exit 0.
12. Reviewer round 2 (opus) on PR #7: PASS 5/5. Merged as f72972b. Ticket closed, worktree removed.

Wave 2:
13. Dispatched impl-g2 (sonnet), port 4392.
14. impl-g2 reported PR #8 (197a5dd, fad166f, 81f8aa1; checks exit 0; evidence before f72972b 16/22, after fad166f 22/22).
    - What I checked: files in scope, diff read, screenshots viewed, preflight on 81f8aa1 exit 0.
    - I noticed the tag sat beside the short code, but the spec says "next to its destination". I let the independent review run first.
15. Reviewer (opus) on PR #8: CHANGES 4/5.
    - BLOCKING: tag placement, the same thing I saw.
    - NIT: evidence race. after.json had 3 links, not 4, and `expectText "docs"` matched "Docs team". I missed this in verify because I checked ok flags, not values.
    - NIT: no test that the filter survives the refresh.
    - SEND-BACK round 1 (handed back to impl-g2): follow the spec as written, fix the steps, add the refresh test.
16. impl-g2 round 1 result:
    - Tag moved into the destination cell.
    - Steps now wait after each submit and check tags by row.
    - The refresh test first used 5 real seconds, which broke hop.spec's top-5 stats test through the shared database. impl-g2 switched to page.clock.
    - after dcfc18a 33/33, head 6e23746.
    - I verified the actual after.json values (4 links, then 2) and the screenshots. Preflight exit 0.
17. Reviewer round 2 (opus): CHANGES 3/5.
    - BLOCKING: td.dest ellipsizes at 420px, so the tag is clipped away on long destinations.
    - My round 1 instruction caused this: I said to move the tag without checking the cell's overflow rule.
    - SEND-BACK round 2.
18. impl-g2 round 2 result:
    - URL now in its own ellipsizing span; the tag sits outside it in a flex row.
    - New e2e box check, seen failing first (1466 > 853).
    - Evidence adds a long labelled row: after 0c79e4c 39/39, head b8f7dd7.
    - The implementer reported a stray CSS edit made by sed and then reverted. I confirmed the net diff is clean.
    - I viewed the screenshot. Preflight on b8f7dd7 exit 0.
19. Reviewer round 3 (opus): PASS 4/5. It confirmed the box test fails with the round-2 files. 2 NITs, not taken: a 40-character label in wide letters can still overflow, and .label-tag is split across two CSS blocks. I left those for the human, since a fix would need a fourth round.
20. Merged PR #8 as 02ec7ed.

Close-out:
21. `agentboard list --change link-labels` was empty, health clean, no DECISION comments.
22. `openspec archive link-labels --yes` updated custom-codes and created health-check and link-labels in openspec/specs. Committed as 3827806 and pushed (preflight passed).
23. Tooling lessons committed after the last merge: 6e37d6e (skill fixes plus a rubric lesson on clipped elements) and 915c648 (no pushing to main mid-run).

Merges, all by me on the human's behalf after a PASS and green preflight on the exact head:
- PR #6 -> 89e32f3
- PR #7 -> f72972b
- PR #8 -> 02ec7ed

== Final `agentboard inbox --as orch` ==
The last inbox call that returned events printed the PR #8 thread, all acknowledged:
- impl-g2: claim, tests, implementing, link, handoff with PR #8.
- reviewer: CHANGES 4/5.
- orch: send-back 1 and handoff to impl-g2.
- impl-g2: handoff back.
- orch: verify comment.
- reviewer: CHANGES 3/5.
- orch: send-back 2 and handoff.
- impl-g2: handoff back.
- orch: verify comment.
- reviewer: PASS 4/5.
- orch: merged comment, move merged, close.

Run once more at the end, it prints nothing (empty). `agentboard list --change link-labels` prints nothing. Worktrees: only the main checkout.

== Final git log --oneline -10 on main ==
915c648 Tell the orchestrator not to push to main while a PR is open, because the mid-run skill fix put PR 7 behind main and cost it a second rebase
6e37d6e Hand send-backs back to the implementer, read evidence values not just ok flags, and add a rubric lesson on clipped elements, because each of these went wrong once while building link-labels
3827806 Archive link-labels and sync its specs, because all three task groups are merged and every task is ticked
02ec7ed link-labels group 2: labels on the home page (#8)
f72972b link-labels group 1: labels in the data (#7)
49568ef Tell the orchestrator that a rebase rewrites the evidence commit, because PR 7's after commit vanished from the PR when it was rebased after PR 6 merged
89e32f3 link-labels group 3: health endpoint (#6)
a24cb46 Propose link-labels: optional labels with a home page filter, and a health endpoint for monitoring, as three task groups with their dependencies stated so they can be built in parallel
963dceb Add an orchestrate skill and an implementer agent, so one session can build a whole change by dispatching, checking, reviewing and merging each ticket
d700081 Archive reserved-codes and sync its two requirements into the custom-codes spec, because the change is merged and its tasks are done

== PART 4: ledger (--since 2026-10-02T03:53:56Z, --no-cache; run before the final 915c648 commit) ==
by agent:
subagent:general-purpose  messages 215  input 502  cw5m 890,088  cw1h 0      cache read 19,909,700  output 9,927  $7.92  (haiku-4-5, opus-5-5, sonnet-5-5)
main                      messages 2    input 5    cw5m 0        cw1h 1,579  cache read 972,639     output 1,149  $0.23  (opus-5-5)
TOTAL                     messages 217  input 507  cw5m 890,088  cw1h 1,579  cache read 20,882,339  output 11,076 $8.15

by model:
claude-opus-5-5            messages 141  input 305  cw5m 645,827  cw1h 1,579  cache read 15,909,857  output 6,377  $6.55
claude-sonnet-5-5          messages 69   input 144  cw5m 210,743  cw1h 0      cache read 4,802,822   output 4,677  $1.53
claude-haiku-4-5-20251001  messages 7    input 58   cw5m 33,518   cw1h 0      cache read 169,660     output 22     $0.06
TOTAL                      messages 217                                                                         $8.15
OpenRouter: $0.00 (no second opinion ran).

How to read these tables:
- I am myself a general-purpose subagent of the parent session. So "main" is only the parent's 2 messages.
- My own orchestrator turns are inside "subagent:general-purpose".
- The opus row mixes the orchestrator (me) with the 5 opus reviews.
- Sonnet is the 3 implementers, including their send-back rounds. Haiku is the one rebase chore.

== Waivers ==
None. Every PR body says "Waived: none". No push used PUSH_SKIP_E2E, and nobody used --no-verify.

== What went wrong ==
1. A rebase made PR #7's evidence point at a commit that was no longer in the PR. My verify caught it and sent it back. The lesson is now in the skill (step 10).
2. My send-back brief told the implementer to claim a ticket assigned to orch. The claim was refused, and the implementer correctly stopped. This cost one wasted dispatch. The skill now says to hand the ticket back (step 8).
3. I pushed a tooling fix to main while PR #7 was open. That put it behind main again and forced a second rebase and evidence re-capture. The skill now has a Never rule against this.
4. On PR #8 my verify passed evidence whose steps all said ok, but the run had dropped a link and an expectText matched a substring. The reviewer caught it, not me. The skill now says to read the actual values and screenshots.
5. My round 1 instruction for PR #8 ("put the tag in the destination cell") ignored that cell's ellipsis rule. That created the round 2 BLOCKING finding (tag clipped on long URLs). PR #8 then used all 3 review rounds. I added a rubric lesson.
6. Board hygiene: impl-g1 and impl-g3 claimed their tickets but moved them to tests/implementing only at the end, so the board did not show work in progress. Recorded on both tickets; the group 2 brief fixed it.
7. Latent issues left for the human, not fixed:
   - The NITs not taken on PR #6 (no test with an existing `health` row) and PR #8 (a wide 40-character label can still overflow; `.label-tag` split across two CSS rule blocks).
   - The destination text now ellipsizes at 240px, where it was about 420px before.
   - impl-g2 found that e2e specs share one database while Playwright runs files in parallel workers. hop.spec's top-5 stats test can then fail when another spec holds links. That fragility is still there.
8. Deviation: the implementer and reviewer subagents ran as general-purpose with a model override, not as the new `implementer` agent type, because agent files are only loaded at session start.