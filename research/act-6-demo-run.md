# Act 6 demo run: subagent final reports

## Setup

All four parts are done: both commits are on main and pushed with the pre-push gate passing, and agentboard has two tickets for link-extras. Nothing is claimed or implemented. `playwright.config.ts` line 6 reads `const port = Number(process.env.E2E_PORT ?? 4390);`, so it honours E2E_PORT and I left it unchanged. Each group's branch will merge cleanly except for the one expected `src/app.ts` mount-line conflict.

**Commits (both on main, pushed to origin)**
- Part 1+2: `86ca4ca` "Isolate every ticket in its own worktree so parallel agents never share a folder". It holds the new skill and the AGENTS.md line.
- Part 3: `6880098` "Plan link-extras: CSV export and link preview as two disjoint task groups".
- The pre-commit hook ran and passed on both (gitleaks clean, typecheck and lint clean, 40 of 40 tests passing).

**Pre-push gate, last 3 lines of the push of 86ca4ca (the first push)**
```
pre-push: all gates passed.
To https://github.com/bendechrai/hop-demo.git
   cf50d39..86ca4ca  main -> main
```
The second push printed the same gate line and `86ca4ca..6880098  main -> main`.

**Commands and exit codes**
- 0: `git commit` for 86ca4ca
- 0: `git push` for 86ca4ca. `PIPESTATUS` came back empty, so I take this from the gate line and the ref update rather than a captured code.
- 0: `npx -y @fission-ai/openspec@1.14.0 list --json`
- 0: `openspec new change link-extras`
- 0: `openspec validate link-extras` (run twice, before and after a small design edit; both printed "Change 'link-extras' is valid")
- 0: `git commit` for 6880098
- 0: `git push` for 6880098 (second push output: `6880098` on main, branch up to date with origin)
- 0: `agentboard import-change link-extras --as orch`
- 0: `agentboard list --change link-extras`
- The first attempt to run openspec failed with 127 (my shell quoting). I wrapped it in a function and reran it.

**Tickets**
- `01M3X951MCB8TDV968ZAACA504`: "CSV export" (todo)
- `01M3X951MWNF3N12XRGSX19HYG`: "Link preview page" (todo)
- agentboard output: `imported openspec:link-extras: 2 created, 0 updated, 0 unchanged, 2 events`

**AGENTS.md line** (added after step 4 of the Workflow list)
`Every ticket starts with the `new-feature` skill, in its own git worktree and branch, and never on main.`

**Files**
- Skill template: `/Users/ben/Projects/software-factory-workshop/templates/act-6/.agents/skills/new-feature/SKILL.md`. It is 64 lines.
- Demo copy: `/Users/ben/Projects/software-factory-workshop/demo/hop/.agents/skills/new-feature/SKILL.md`.
- Change: `/Users/ben/Projects/software-factory-workshop/demo/hop/openspec/changes/link-extras/` with `proposal.md`, `design.md`, `tasks.md`, and specs `link-export` and `link-preview`.

Two choices of mine to know about:
- The spec deltas are two new capabilities, one per group.
- `design.md` says the export route reads its links through the existing `listLinks` action rather than calling the service. The reason is the code-structure rule that a route never calls a service. `design.md` also records the `src/app.ts` conflict and its resolution: keep both lines, with the preview mount before the redirect.

**SKILL.md (full text)**
```
---
name: new-feature
description: Isolates a ticket in its own git worktree and branch. Use before starting any ticket, feature or fix, so that no work ever happens on main and parallel agents never share a working folder.
---

# new-feature

Every ticket gets its own branch in its own worktree. Never edit files on main.
Replace `<id>`, `<you>`, `<reviewer>`, `<type>`, `<change>` and `<group>` below.

1. **Claim the ticket.** Find it with `agentboard list --change <change>`, then
   `agentboard claim <id> --as <you>`. If the claim is refused, stop. Do not work on it.

2. **Fetch and check scope.** Run `git fetch origin`, then
   `gh pr list --state open --json number,headRefName,files`.
   If an open PR touches the same files your ticket names, stop. Run
   `agentboard comment <id> "Overlaps PR #<n> on <files>" --as <you>` and then
   `agentboard move <id> blocked --as <you>`.

3. **Create the worktree.** Branch name: `<type>/<change>-g<group>` where type is
   `feat` or `fix`, for example `feat/link-extras-g1`. The worktree goes in a folder
   beside the repository named `<repo>.worktrees`, one subfolder per branch with
   slashes replaced by hyphens. Never inside the repo, never a plain sibling.
   ```
   REPO=$(basename "$(git rev-parse --show-toplevel)")
   git worktree add ../$REPO.worktrees/feat-link-extras-g1 -b feat/link-extras-g1 origin/main
   ```
   For repo `hop` that is `../hop.worktrees/feat-link-extras-g1`.

4. **Enter and prepare it.** `cd ../hop.worktrees/feat-link-extras-g1`, then `npm ci`.
   Do not run `bin/setup-git-hooks.sh`: `core.hooksPath` is shared config. Verify with
   `git config core.hooksPath`. Confirm `git branch --show-current` is not `main`.

5. **Keep ports and databases apart.** Worktrees share files but not ports or databases.
   If you start the app, pick a port from your ticket number range and use
   `HOP_DB=:memory:` or a database file inside the worktree. Playwright reads its port from
   `E2E_PORT`. Each worktree must use a different one: suggest `4390 + <group>`, for example
   `E2E_PORT=4391 npm run e2e` for group 1.

6. **Work the ticket.** Follow the agentboard flow and the `openspec-apply-change` skill for
   your task group only. Tick your tasks in `tasks.md`. Commit inside the worktree. The
   pre-commit hook runs; never use `--no-verify`.

7. **Ship.**
   ```
   git push -u origin <branch>
   gh pr create --fill --base main
   ```
   The pre-push gate runs on the push. Put the checks you ran (and any "Waived: <gate> -
   <reason>") in the PR body. Then:
   ```
   agentboard link <id> --pr <number> --as <you>
   agentboard handoff <id> --to <reviewer> --status review --note "<PR url, what to look at>" --as <you>
   ```

8. **Clean up after the merge.** From the main checkout (not the worktree):
   ```
   git worktree remove ../hop.worktrees/<folder>
   git branch -d <branch>
   git worktree prune
   ```

If two groups both edit one shared line (for example a mount line in `src/app.ts`),
the second PR to merge rebases on main and keeps both lines. See the change's `design.md`.
```

**tasks.md (verbatim, final committed version)**
```
# Tasks

## 1. CSV export

- [ ] 1.1 Add `src/services/csv.ts` that turns a list of links into CSV text with the header `code,url,clicks,created_at,expires_at`, an empty `expires_at` for a link that never expires, and values quoted only when they hold a comma, a double quote or a line break (inner quotes doubled); verify `src/services/csv.test.ts` covers no links, a plain row, a null expiry, a comma, a double quote and a line break
- [ ] 1.2 Add `src/routes/export.ts` serving `GET /api/links.csv` with content type `text/csv` and all links (read through the existing `listLinks` action and formatted by the CSV service), and add its one mount line to `src/app.ts` next to the other `/api` lines; verify `src/app.test.ts` gets 200, `text/csv`, the header row and one row per link including an expired one
- [ ] 1.3 Add an "Export CSV" link to `public/index.html` pointing at `/api/links.csv`; verify by opening the home page and following the link
- [ ] 1.4 Add the scenario in a new file `e2e/export.spec.ts` (not in `e2e/hop.spec.ts`) that creates a link, follows the "Export CSV" link from the home page and checks the response holds the header row and the new link's code and URL; verify `npm run e2e` passes

## 2. Link preview page

- [ ] 2.1 Add `src/actions/preview-link.ts` with `previewLink(code, links, now)` that returns the link with its `expired` flag, reports not-found for an unknown code, and never counts a click; verify `src/actions/preview-link.test.ts` shows a live link, an expired link still returned and flagged, an unknown code, and the click count unchanged after two previews
- [ ] 2.2 Add `src/routes/preview-page.ts` that builds the plain HTML page (destination URL, created date, click count, expiry or "Never", expired marked, all values escaped), and `src/routes/preview.ts` serving `GET /:slug` only when the slug ends in `+` and calling `next()` otherwise; verify `src/app.test.ts` gets 200 and HTML for a live link, 200 with the expired mark for an expired link, 404 for an unknown code, and that the click count is unchanged after fetching the preview
- [ ] 2.3 Mount the preview router in `src/app.ts` before the short-code redirect (one line); verify `src/app.test.ts` shows `/<code>` still redirects and counts a click while `/<code>+` does not
- [ ] 2.4 Add the scenario in a new file `e2e/preview.spec.ts` (not in `e2e/hop.spec.ts`) that creates a link, opens `/<code>+`, checks the destination URL, a click count of 0 and the expiry, reloads it and sees the count is still 0; verify `npm run e2e` passes
```

## Implementer 1: CSV export

Group 1 (CSV export, tasks 1.1 to 1.4) is done, pushed, and in review with ben. PR: https://github.com/bendechrai/hop-demo/pull/2 (number 2). Commit: 0d0bb72, "Add CSV export of all links at /api/links.csv". Branch is feat/link-extras-g1 and the worktree is /Users/ben/Projects/software-factory-workshop/demo/hop.worktrees/feat-link-extras-g1. It is left in place; no cleanup was done.

**Commands (exit codes)**
- `agentboard claim 01M3X951MCB8TDV968ZAACA504 --as impl-1`: 0. Output: `01M3X951MCB8TDV968ZAACA504  todo  impl-1  CSV export`.
- `git fetch origin`: 0.
- `gh pr list --state open --json number,headRefName,files`: 0. It returned `[]`, so there was no overlap.
- `git worktree add ../hop.worktrees/feat-link-extras-g1 -b feat/link-extras-g1 origin/main`: 0.
- `npm ci` in the worktree: 0 (0 vulnerabilities).
- `git config core.hooksPath` printed `.githooks`. `git branch --show-current` printed `feat/link-extras-g1`.
- `agentboard move ... tests --as impl-1`: 0.
- Red run: with the implementation removed, `node --test src/services/csv.test.ts src/app.test.ts` showed 2 failures. The exit shown is from my `grep`, not the test run.
- `agentboard move ... implementing --as impl-1`: 0.
- `npm run verify` after the last edit (including the tasks.md ticks): 0. Typecheck, lint, and 47 of 47 unit tests passed.
- `E2E_PORT=4391 npm run e2e` after the last edit: 0. 7 passed.
- `git commit`: 0. The pre-commit hook ran gitleaks (no leaks) and verify, both ok.
- `git push -u origin feat/link-extras-g1`: 0.
- `gh pr create --base main --title "CSV export (link-extras group 1)" --body-file ...`: 0. The body lists the checks and their exit codes.
- `agentboard link 01M3X951MCB8TDV968ZAACA504 --pr 2 --as impl-1`: 0. Output: `01M3X951MCB8TDV968ZAACA504  implementing  impl-1  CSV export`.
- `agentboard handoff 01M3X951MCB8TDV968ZAACA504 --to ben --status review --note "<PR url; what to look at>" --as impl-1`: 0. Output: `01M3X951MCB8TDV968ZAACA504  review  ben  CSV export`.

**Files changed**
- `src/services/csv.ts` (new): `linksToCsv` builds the header and rows, ends lines with `\r\n`, and quotes values per RFC 4180.
- `src/services/csv.test.ts` (new): covers no links, a plain row, a null expiry, a comma, a double quote, and a line break.
- `src/routes/export.ts` (new): serves `GET /api/links.csv` as `text/csv`, reading links through the `listLinks` action.
- `src/app.ts`: one import and one `app.use(exportRouter(links))` line placed before the `/api/links` line.
- `src/app.test.ts`: new test for 200, `text/csv`, the header, one row per link, an expired link, and an empty `expires_at`.
- `public/index.html`: "Export CSV" link in the nav, pointing at `/api/links.csv`.
- `e2e/export.spec.ts` (new).
- `openspec/changes/link-extras/tasks.md`: only lines 1.1 to 1.4 ticked.

**Pre-push gate, last lines**
```
Timing
  install      ok      1s
  verify       ok      2s
  build        ok      0s
  audit        ok      1s
  migrations   ok      1s
  e2e          ok      3s
pre-push: all gates passed.
```

**Port clash:** no. The pre-push gate passed on the first attempt, so I did not wait or retry.

**Waived:** nothing.

**Things to know**
- I wrote the tests and the implementation in the same pass and then proved the red state after the fact, rather than running the tests before writing any code.
- `e2e/export.spec.ts` sorts before `e2e/hop.spec.ts`. The first scenario in `hop.spec.ts` needs an empty database, so the export spec deletes its own link via `DELETE /api/links/:code` at the end. I did not edit `hop.spec.ts`.
- The spec fetches `/api/links.csv` with the page's request context after reading the link's `href`, rather than clicking the link, to avoid a browser download. Whoever merges second should keep both mount lines in `src/app.ts`, with the preview mount before the redirect.

## Implementer 2: preview page

Ticket 01M3X951MWNF3N12XRGSX19HYG (group 2, tasks 2.1 to 2.4) is built, pushed and handed to ben for review as PR #1: https://github.com/bendechrai/hop-demo/pull/1

**Commands and exit codes**
- `agentboard list --change link-extras`: ok.
- `agentboard claim 01M3X951MWNF3N12XRGSX19HYG --as impl-2`: exit 0. Output: `01M3X951MWNF3N12XRGSX19HYG  todo  impl-2  Link preview page`.
- `git fetch origin` and `gh pr list --state open --json number,headRefName,files`: exit 0. It returned `[]`, so there was no overlap with impl-1.
- `git worktree add ../hop.worktrees/feat-link-extras-g2 -b feat/link-extras-g2 origin/main`: exit 0, run from the main checkout.
- `npm ci` in the worktree: exit 0, 0 vulnerabilities.
- `core.hooksPath` is `.githooks`. The branch is `feat/link-extras-g2`.
- `agentboard move ... tests --as impl-2`: exit 0. I wrote the tests first and saw the route tests fail (404 instead of 200).
- `agentboard move ... implementing --as impl-2`: exit 0.
- `npm run verify`: exit 0, 49 tests passed. I ran it after the last edit.
- `E2E_PORT=4392 npm run e2e`: exit 0, 7 passed, including the new preview scenario. I ran it after the last edit.
- `git commit`: exit 0, pre-commit hook printed "ok".
- `git push -u origin feat/link-extras-g2`: exit 0 on the first try.
- `gh pr create --base main --title "Link preview page (link-extras group 2)" --body-file ...`: exit 0.
- `agentboard link ... --pr 1 --as impl-2`: exit 0. Output: `01M3X951MWNF3N12XRGSX19HYG  implementing  impl-2  Link preview page`.
- `agentboard handoff ... --to ben --status review --note "<PR url and what to look at>" --as impl-2`: exit 0. Output: `01M3X951MWNF3N12XRGSX19HYG  review  ben  Link preview page`.

**Files changed** (all in `/Users/ben/Projects/software-factory-workshop/demo/hop.worktrees/feat-link-extras-g2`)
- New: `src/actions/preview-link.ts` and `src/actions/preview-link.test.ts`.
- New: `src/routes/preview-page.ts` and `src/routes/preview.ts`.
- New: `e2e/preview.spec.ts`.
- Edited: `src/app.ts`, adding the `previewRouter` import and mount before the redirect, plus a 2-line comment.
- Edited: `src/app.test.ts`, with preview tests for a live link (checked twice, zero clicks), an expired link, escaping, an unknown code, and `/code` versus `/code+`.
- Edited: `openspec/changes/link-extras/tasks.md`, ticking only 2.1 to 2.4.

**Commit:** 7537af8 ("Add a link preview page at /<code>+ so people can check a link without adding a click").

**Pre-push gate, last lines:**
```
install      ok      1s
verify       ok      2s
build        ok      0s
audit        ok      0s
migrations   ok      1s
e2e          ok      2s
pre-push: all gates passed.
```

**Port clash:** none. The push passed first time, so I did not wait and retry.

**Waived:** nothing. Step 8 (cleanup) was not done, as instructed, so the worktree stays in place.

## Reviewer: merge and cleanup

All seven steps are done. Both PRs are merged, both tickets are closed, link-extras is archived and pushed, and main is clean at 5ab7f63. One thing was not verified: the preview-before-redirect order was reviewed from the diff, not checked at runtime beyond the passing tests.

## 1. Reviews
Posted with `gh pr review <n> --comment --body-file`, exit 0 for both. Neither PR had a blocking finding, so neither ticket was moved back.

**PR #1 review (verbatim):**
```
Review (ben): no blocking findings.

- Tasks 2.1 to 2.4 are all done and ticked in tasks.md; the other group's tasks are untouched.
- Layering holds: routes/preview.ts calls the previewLink action, never a service. previewLink reuses getLink, so an expired link is returned flagged and no click is counted.
- Tests are at the right layers: action unit tests (live, expired, unknown, no click after two previews), app tests (200 HTML, expired mark, 404, no click, hostile destination escaped, plain /<code> still redirects and counts), and e2e/preview.spec.ts as a new file.
- Files stay in scope: only group 2 files, the one preview mount line in src/app.ts (before the redirect, with a why-comment), and tasks.md ticks. No dead code.
- Nit, not blocking: the unknown-code 404 comes from the redirect router and 404 handler after next(), so it works but is indirect. Fine as is.
```

**PR #2 review (verbatim):**
```
Review (ben): no blocking findings.

- Tasks 1.1 to 1.4 are all done and ticked in tasks.md; group 2 tasks are untouched.
- Layering holds: routes/export.ts reads links through the listLinks action and formats with the pure csv service, as design.md decision 1 says. csv.ts does no database access.
- RFC 4180 quoting matches the spec (quote only on comma, quote or line break; inner quotes doubled; CRLF line endings). Unit tests cover no links, plain row, null expiry, comma, quote and line break.
- app.test.ts checks 200, text/csv, header, one row per link including an expired one and an empty expires_at. e2e/export.spec.ts is a new file and cleans up its link so hop.spec.ts still sees an empty table.
- Files stay in scope: group 1 files, the Export CSV nav link, one mount line in src/app.ts, tasks.md ticks. No dead code.
- Expected: this PR will conflict with group 2 on src/app.ts and tasks.md once PR #1 merges; it will be rebased keeping both lines.
```

## 2. Merge PR #1
`gh pr merge 1 --squash --delete-branch` exited 0. The remote branch g2 was gone afterwards and the g2 worktree was already removed.

## 3. Rebase PR #2
`git fetch origin && git rebase origin/main` stopped on one conflict, in `src/app.test.ts`. `src/app.ts` and `tasks.md` auto-merged with no conflict, and I confirmed the result:
- **src/app.ts:** has both imports and both mounts, with the preview mount before the redirect.
- **tasks.md:** all 8 tasks are `[x]`.

The conflict hunk, abridged. Both PRs appended tests at the end of the file. HEAD held the five `GET /:code+` preview tests, and my commit held the CSV test.
```
<<<<<<< HEAD
test("GET /:code+ shows a preview page ... (5 preview tests, ending)
test("GET /:code still redirects and counts while /:code+ does not", async () => {
  ... assert.equal(links.get("prev-both")?.clicks, 1);
=======
test("GET /api/links.csv returns the header and one row per link, expired included", async () => {
  ... assert.ok(old?.endsWith(",2020-01-01T00:00:00.000Z"));
>>>>>>> 0d0bb72 (Add CSV export ...)
});
```
Resolution: I kept both sets of tests. The preview tests come first, then the CSV test, and the single trailing `});` that git had left shared was split so each test closes properly. The markers were removed and `grep` confirmed none remain.

Commands in `../hop.worktrees/feat-link-extras-g1`:
- `npm run verify`: exit 0, 56 tests pass.
- `E2E_PORT=4391 npm run e2e`: exit 0, 8 passed.
- `git rebase --continue`: exit 0.
- `git push --force-with-lease`: exit 0, with the pre-push gate output below.
```
PREFLIGHT PASSED - 65bdddf is safe to push
 install ok 1s | verify ok 2s | build ok 0s | audit ok 0s | migrations ok 1s | e2e ok 2s
pre-push: all gates passed.
 + 0d0bb72...65bdddf feat/link-extras-g1 -> feat/link-extras-g1 (forced update)
```
- `gh pr merge 2 --squash`: exit 0, state MERGED.
- The remote branch stayed behind, so I ran `git push origin --delete feat/link-extras-g1`: exit 0 (the gate passed on it).

## 4. Main checkout
- `git checkout main && git pull --ff-only`: exit 0, fast-forwarded to 074f9bd.
- `npm run verify` on main: exit 0.
- `npm run e2e` on main: exit 0.

## 5. Board
- `agentboard move <id> merged --as ben`: exit 0 for both tickets.
- `agentboard close-merged --as ben` printed the output below, exit 0:
```
closed 01M3X951MCB8TDV968ZAACA504  merged  ben  [closed] CSV export (no decision)
closed 01M3X951MWNF3N12XRGSX19HYG  merged  ben  [closed] Link preview page (no decision)
close-merged: 2 closed, 0 unmerged, 0 skipped
```
- `agentboard list --change link-extras`: empty, exit 0.
- `agentboard health`: exit 0, all zeros. That covers stale claims, blocked, unpromoted decisions and close-merged ready, held and missing-pr. "cache check: not run".

## 6. Cleanup
- `git worktree remove` on g1 worked. g2 was already gone.
- `git branch -d feat/link-extras-g1` refused with "not fully merged". That is normal after a squash merge, and PR #2 is confirmed MERGED. I used `git branch -D` on it, and the g2 branch was already deleted.
- `git worktree prune` and `git remote prune origin` ran. The latter pruned the stale `origin/feat/link-extras-g2`.
- `git worktree list`:
```
/Users/ben/Projects/software-factory-workshop/demo/hop  5ab7f63 [main]
```

## 7. Archive
- **Prerequisites:** close-merged had been run and no ticket was open.
- **Checks:** `openspec instructions archive` showed 8/8 tasks done and all artifacts complete.
- **Sync:** both deltas were ADDED-only for new capabilities, so I took the recommended path of sync plus archive.
- **Command:** I ran `npx -y @fission-ai/openspec@1.14.0 archive link-extras -y` (exit 0) rather than a manual sync and move. It performs the same sync and move and printed "7 added".
- **Result:** new main specs `openspec/specs/link-export/spec.md` and `openspec/specs/link-preview/spec.md`. The change moved to `openspec/changes/archive/2026-10-01-link-extras`.
- **Commit:** exit 0, pre-commit ok. The message was "Archive link-extras: both groups merged, so its specs become the main specs for link-export and link-preview", with no attribution.
- **Push to main:** exit 0, gate output below.
```
install ok | verify ok | build ok | audit ok | migrations ok | e2e ok
pre-push: all gates passed.
   074f9bd..5ab7f63  main -> main
```

## Final `git log --oneline -6` on main
```
5ab7f63 Archive link-extras: both groups merged, so its specs become the main specs for link-export and link-preview
074f9bd Add CSV export of all links at /api/links.csv (#2)
c459268 Add a link preview page at /<code>+ so people can check a link without adding a click (#1)
6880098 Plan link-extras: CSV export and link preview as two disjoint task groups
dc95f8e Use the current gitleaks pre-commit syntax; protect is deprecated
86ca4ca Isolate every ticket in its own worktree so parallel agents never share a folder
```

## Waived or not verified
- **Waived:** nothing. No `--no-verify` and no `PUSH_SKIP_E2E` was used.
- **Not verified:** I did not run the app manually in a browser beyond the e2e suite.
- **Command quirk:** my first exit-code capture used `PIPESTATUS`, which is empty in zsh. I re-ran verify and e2e in the g1 worktree and quote those later exit codes.
