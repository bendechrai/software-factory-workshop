WALKTHROUGH REPORT, DAY 2 (acts 5-10 + reference). Scratch clone: /private/tmp/claude-501/-Users-ben-Projects-software-factory-workshop/6bd3b073-6ab7-41c0-9ad8-75c1b35a8051/scratchpad/walkthrough-day2/hop. A local bare repo, origin.git, beside it stood in for GitHub. No workshop files were edited, no harness started, no OpenRouter call, no PR created. Worktrees were created and removed.

Abbreviations: DOCS = /Users/ben/Projects/software-factory-workshop/docs/src/content/docs; T = /Users/ben/Projects/software-factory-workshop/templates.

========== CROSS-CUTTING / START STATE ==========
S1. BLOCKER. Act 1, DOCS/day-1/act-1-the-sandbox-and-the-vibe.mdx line ~155: "git clone https://github.com/bendechrai/hop-demo.git hop".
  - Without credentials: `GIT_TERMINAL_PROMPT=0 git -c credential.helper= ls-remote https://github.com/bendechrai/hop-demo` gives `fatal: could not read Username for 'https://github.com': terminal prompts disabled`. With prompts on, an attendee gets a username/password prompt, and then "repository not found" or an auth failure. This is the only fallback for "your build did not work", and the day-2 "tag at the end of every act" safety net (agenda.md) depends on it.
  - Fix: make hop-demo public, or publish the demo as a folder or tarball inside the (public) workshop repo.
S2. BLOCKER. https://github.com/bendechrai/agentboard is also private. `git ls-remote` gives the same "could not read Username" error. `npm view @bendechrai/agentboard` gives E404. Act 5 step 1 (clone, npm ci, build, npm link) and before-you-arrive.mdx line 85 (npx fallback) therefore both fail for every attendee. I used the already-installed /opt/homebrew/bin/agentboard 0.0.1. Fix: publish to npm or make the repo public. Until then, give an install route that works.
S3. MAJOR. No page ever tells the attendee to create a GitHub repo and add `origin`. Act 1 does `git init -b main` and nothing adds a remote. Act 6 onward assumes `origin`, `origin/main`, `git push`, `gh pr create`, `gh pr list`, `gh pr merge` and `close-merged` (which needs real PRs). Without an origin, `git fetch origin` fails and `git worktree add ... origin/main` fails. `gh pr list` in a repo with no GitHub remote prints `none of the git remotes configured for this repository point to a known GitHub host` (exit 1). Fix: add a step to act 1 or a start of act 6 such as `gh repo create hop --private --source . --push`. Also confirm the default branch is `main`.
S4. MINOR. The `git tag act-N` steps in acts 4-10 fail with `fatal: tag 'act-5' already exists` (exit 128) if the attendee cloned hop-demo, because the clone carries tags act-1 to act-10. Fix: use `git tag -f act-N`, or say "skip if the tag exists".
S5. MINOR. Commands that print agentboard ids give ids sharing a 10-character prefix, because the tickets are created within the same millisecond. For example 01M3XEFMX4PP..., 01M3XEFMXH5V... and 01M3XEFMXVX1.... `agentboard show 01M3XE` gives `agentboard: ticket id prefix 01M3XE is ambiguous`. The docs say "any unique prefix of at least 6 characters", which is misleading because the unique part starts around character 10 or 11. Fix: say "copy at least 11 characters", or show how to get an id with `agentboard list --json`.
S6. MINOR. The `agentboard list` output has no column headers. This is fine, but ids must be copied from it. Consider mentioning `cut -d' ' -f1`.

========== ACT 5 (DOCS/day-2/act-5-tickets.mdx) ==========
What worked:
 - `agentboard init`, `agents install` and `agents install --mcp-command agentboard` all ran, with output matching the page (1 created, 2 updated).
 - The installed skill is byte-identical to T/act-5/agentboard-SKILL.md.
 - `agentboard serve` prints a read-only URL with a token. `agentboard top --help` is valid.
 - `openspec validate stats-page --strict` passed, and `import-change` printed the expected "created ... imported openspec:stats-page: 3 created" lines.
 - inbox, claim, move, handoff, comment and close all behaved as documented:
   - a second actor's claim fails with exit 4;
   - `close --no-decision` on a ticket with a DECISION comment fails with exit 1 and the quoted message;
   - `close --decision-recorded-in` works;
   - `health` prints the documented zeros;
   - `close-merged` prints `0 closed, 0 unmerged, 0 skipped`;
   - `preflight.sh HEAD` passed.
 - `list` after everything is closed prints nothing.
Defects:
 1. MAJOR (the S2 problem), step 1: the clone URL is private.
 2. MINOR, step 2: step 1 ends inside the `agentboard` folder, but step 2 begins `cd hop`. Fix: `cd ../hop`, or say "go back to your hop folder".
 3. MINOR, step 3: `agents install --mcp-command agentboard` adds an untracked `.mcp.json` that no later step commits or mentions. Step 2's "git status --short shows ..." list omits it, and the act-6 worktrees (created from origin/main) will not have it unless it is committed. Fix: say "commit .mcp.json too".
 4. MINOR, step 5: the propose prompt asks the model for a `stats-page` change with exactly three groups. The step then says "commit it" but does not say to do this before `import-change`. It is implied only. The agenda says the stats page is a feature of act 5, but act 7's step 2 depends on the stats-page design recording a `stats` code gap that a fresh attendee run may not record. Act 7 needs a fallback repro (see act 7, defect 2).
 5. MINOR, step 13: "Archive the change ... Run the archive command from act 4" is fine, but the page never tells the attendee to commit and push the archive. Act 6 says "stats-page change archived and clean". Fix: add "commit it".
 6. MINOR, "What you see": the board checklist does not follow `tasks.md` ticks. After I ticked tasks.md, `agentboard show` still showed `[ ] 1 1.2`. This is by design, but newcomers may expect the checklist to update. Fix: one sentence saying so.
 7. MINOR (tool, not docs): `move` with a stale status gives `invalid-transition`. For example, in act 6 `handoff --status review` from `tests` is refused and implementing is required. The new-feature skill (act 6) step 6 says "follow the agentboard flow" without listing the moves tests then implementing before handoff. An agent that reads only that skill can hit the refusal. Fix: add "moves: tests, implementing, then handoff" to step 6 of the new-feature skill.

========== ACT 6 (DOCS/day-2/act-6-isolation.mdx) ==========
What worked:
 - The curl of the skill from raw.githubusercontent.com/.../templates/act-6/.agents/skills/new-feature/SKILL.md returned exit 0 (the repo is public).
 - `openspec validate link-extras` passed. `import-change` created 2 tickets.
 - `git worktree add ../hop.worktrees/feat-link-extras-g1 -b feat/link-extras-g1 origin/main` and `npm ci` worked.
 - `git config core.hooksPath` printed `.githooks` in the worktree, without re-running setup.
 - The shared board was found from the worktree: `agentboard list` and `agentboard claim` worked there.
 - `E2E_PORT=4391 npm run e2e` passed (4 tests). Pre-commit and pre-push gates ran in the worktree.
 - `agentboard link --pr`, `handoff` and `close-merged` all ran. `close-merged` with no GitHub remote prints `skipped ... (gh-error)` and exits 0. That is correct but silent about the cause. I never created a real PR.
 - `gh pr create --fill --base main` and `gh pr merge --squash --delete-branch` exist (`--help` checked). I did not run them. On GitHub they would open and squash-merge PRs.
 - Cleanup worked: `git worktree remove`, `git branch -d`, `git worktree prune`, `git remote prune origin`.
Defects:
 1. MAJOR, step 1: "Open AGENTS.md and add the line above after the last step of the Workflow list". The Workflow list is 4 numbered items followed by `## Conventions`. It is easy to append at end of file instead (I did at first). Fix: give an exact anchor ("after '4. Summarise...'") or ship a one-line sed/append that places it correctly.
 2. MAJOR (S3): no origin, so steps 4 and 6 fail for attendees without a GitHub repo.
 3. MINOR, step 1: "Commit both and push" is on main, which contradicts the new-feature skill ("never on main"). The docs acknowledge this for tooling in act 7 but not here.
 4. MINOR, step 2: the groups in the example share `src/app.ts` by name, but the attendee's repo may differ. A real rebase of my two branches did conflict in src/app.ts: adjacent import lines and adjacent app.use lines, because both added a line at the same spot. The page says "Git stops on a conflict. Resolve it", but the 'What you see' section says src/app.ts merged on its own in the demo. A newcomer should expect an app.ts conflict if both mounts sit next to each other. Fix: tell them where to put the mount line, or show the expected conflict hunk.
 5. MINOR, step 6: after resolving the conflict the docs list `npm run verify`, `E2E_PORT=4391 npm run e2e`, `git rebase --continue` but omit `git add <file>`. `git rebase --continue` says "needs merge / mark them as resolved using git add". Fix: add `git add src/app.ts`.
 6. MINOR, step 6: the rebase example runs in `feat-link-extras-g1` ("second PR") with port 4391, but the preceding `gh pr merge 1` merged impl-2's PR (g2). The text is consistent with the demo's numbering but confusing against the earlier "PR #2 is g1". Fix: say "the worktree of the PR you did not merge yet".
 7. MINOR, step 4 and the skill step 4: the skill says `npm ci` in each worktree, and the page repeats it. I forgot it in g2, and the pre-commit hook then failed with `tsc: command not found`. The failure text ("verify failed, read the output above") does not hint at it. Fix: add `npm ci` to the hook failure message or the skill's checklist.
 8. MINOR, step 8: `git branch -d` behaviour depends on whether the remote branch is deleted. After a squash merge it refuses (as the page says). With the remote branch still present it succeeds with a warning. Fine either way.
 9. MINOR: the `new-feature` worktree gets `branch ... set up to track 'origin/main'` as its upstream from `git worktree add ... origin/main`. A bare `git push` there would try to push to main. `git push -u origin <branch>` in the skill fixes it. Consider `--no-track` in the skill's `git worktree add`.

========== ACT 7 (DOCS/day-2/act-7-proof.mdx) ==========
What worked:
 - Curls of evidence.mjs and the evidence SKILL.md succeeded.
 - `node bin/evidence.mjs --help` exits 0 and matches the page.
 - `before` on origin/main (5 ok, 2 failed) and `after` on HEAD (7 ok, 0 failed), both exit 0 with the same steps. The records name different short commits (3c8143d and a79d74a), and screenshots were written.
 - The tool works from inside a ticket worktree and puts its checkout in the right folder (the demo's bug fix holds).
Defects:
 1. MAJOR, step 1: "give bin/**/*.mjs the Node globals in eslint.config.js ... make it yourself if your lint run complains". The lint run always complains: 11 errors (`'process' is not defined`, `'fetch'`, `'setTimeout'`, `'console'`). The pre-commit hook then FAILS the commit in step 1. The page gives no edit. Fix: tell them to add `"bin/**/*.mjs"` to the `files` array in the globals.node block of eslint.config.js (that fixed it for me), or ship the eslint change in the templates.
 2. MAJOR, step 2: the repro depends on the act-5 stats page and a reserved `stats` code, which the attendee's own run may not have. The page also does not say how to start the app. `HOP_DB=:memory: npm start` works, but PORT defaults to 4390, the same port as the e2e and preflight default. Fix: give the start command, and give a generic fallback bug (for example reserve `api`) for attendees whose stats page differs.
 3. MINOR, steps 3-5: the steps file in step 6 hardcodes `code: stats` and the `#url`, `#code`, `button[type=submit]` and `#message` selectors. These match my copy of the app but depend on the act-1 to act-3 app. Add "adjust selectors to your app".
 4. MINOR, step 10: the PR body (the Evidence table) is described but no template is given, and `gh pr create` has no worked example. The reviewer rubric (check 4) requires the `## Evidence` section with short shas. A skeleton in the skill would help. (I could not test it, since there is no GitHub PR.)
 5. MINOR: the evidence tool runs `npm ci` in each captured checkout (177 packages, about 1s), but the page never says so. First run prints "added 177 packages".

========== ACT 8 (DOCS/day-2/act-8-review.mdx) ==========
What worked:
 - `npx eslint bin/second-opinion.mjs` exits 0.
 - `node bin/second-opinion.mjs --help` prints the usage.
 - `env -u OPENROUTER_API_KEY node bin/second-opinion.mjs --pr 3` prints `second-opinion: OPENROUTER_API_KEY is not set. Export it for this command; it is never read from a file.` and exits 2 (clean, as required).
 - Applying reviewer.md by hand to the local diff (`git diff origin/main...origin/fix/reserved-codes-g1`) worked. I found a real gap: no test was added for the fix (rubric check 3), so the verdict was CHANGES 3/5 with 1 blocking finding. Posting the verdict to the ticket worked: `agentboard comment <id> "Review of PR #3: VERDICT: CHANGES, SCORE: 3/5, 1 blocking" --as reviewer`. The reviewer does `gh pr view`, `gh pr diff` and `gh pr review`, which need a GitHub PR, so I did not run them. `gh pr review <n> --comment --body-file` is the correct form.
 - The review-loop skill, reviewer agent file and rubric are coherent.
Defects:
 1. MAJOR, step 1: "Take everything under templates/act-8/ from the workshop repo, keeping the paths" gives no command, unlike acts 6, 7 and 10-ish. `cp -R templates/act-8/. .` works from the cloned workshop repo, but that also drops `.codex/`, `.cursor/`, `.gemini/agents/` and `.agents/review/README.md` into the app, even for a one-harness attendee. Fix: give the cp command and name the harness-specific folders to delete or keep.
 2. MAJOR, step 7: the rubric template (T/act-8/.agents/review/rubric.md) already contains the lesson the page tells you to add ("When the same rule is checked in two layers..."). So the "record the lesson" teaching moment is spoiled, and the attendee would add a duplicate line. Fix: strip that Lessons line from the template, or reword step 7 to "this line is already there".
 3. MAJOR, step 2: the calibration-defect code uses names from the demo (`RESERVED_CODES`, `field("code")`, `src/routes/links.ts`) that will not exist in an attendee's own app, so the snippet cannot be applied literally. Fix: describe the defects in prose with a generic example, or say "adapt".
 4. MINOR, the reviewer agent template (T/act-8/.claude/agents/reviewer.md) has `model: sonnet`. Act 9 makes the implementer `sonnet` too, and the act-9 orchestrate skill says "Never ... a reviewer run on the implementer's model". Dispatching the installed `reviewer` agent in act 9 would break that rule. Fix: act 9 should say to change it to `model: opus`, or the orchestrate skill should always override the model.
 5. MINOR: the `gh pr close 5 --comment` and `gh pr review` steps need real PRs and the PR numbers hardcoded in the demo (#3, #5, #2 etc) rarely match an attendee's numbers. Use "<n>" consistently.
 6. MINOR: step 3 says "start the reviewer agent ... on Sonnet". The agent file was added in this same step, and, as act 9's page says, new agent files only load on session restart. Act 8 does not say to restart.

========== ACT 9 (DOCS/day-2/act-9-the-orchestrator.mdx) ==========
What worked (commands in the orchestrate skill's verify step, checked with --help or dry run):
 - `gh pr view --json number,state,headRefName,headRefOid,baseRefName,body,files,mergeable` is valid (all those fields exist), and so are `reviews` and `gh pr list --state open --json number,headRefName,files`.
 - `gh pr diff <n> --name-only` is valid.
 - `git merge-base --is-ancestor origin/main origin/<branch>` prints "up-to-date" on a pushed branch.
 - `git range-diff` runs.
 - `E2E_PORT=4399 bin/preflight.sh <sha>` accepts a full commit sha and passes (install, verify, build, audit, migrations, e2e all ok).
 - `agentboard list --status todo`, `release`, `handoff`, `close-merged` and `health` are valid.
 - `ledger.mjs --project <dir> --since <iso> --by agent|model --no-cache --openrouter <file>` are all valid flags (`--help` checked), and an unknown project dir cleanly prints a $0 table.
Defects:
 1. MAJOR, step 2: "Take .agents/skills/orchestrate/SKILL.md and .claude/agents/implementer.md from templates/act-9/" gives no command, and omits two other files in T/act-9: `.agents/review/rubric.md` (it adds a new Lessons line about clipped elements that the demo added) and AGENTS-additions.md. An attendee who copies only two files misses the rubric update. Also the rubric file differs from the act-8 one only by that one line, so the attendee will get a merge question if they customised the rubric. Fix: provide `cp` lines and say what to do about the rubric.
 2. MAJOR: the skill's step 7 dispatches "a reviewer subagent with model opus", but see act 8 defect 4: the `reviewer` agent file is sonnet. Same model as implementers.
 3. MINOR, step 3: the page asks for a `health` reserved code in group 3, so it assumes act 7's reserved-codes list exists with that shape. Attendees who did not name the list as in the demo must adapt.
 4. MINOR, step 6 and skill step 13: "run the ledger from the workshop repository" with `--project ~/.claude/projects/<project dir>` but never says how to compute `<project dir>` (it is the repo path with / and . replaced by -). Compare reference/counting-the-cost.mdx, which says to run from the hop folder with `node ../software-factory-workshop/tools/ledger/ledger.mjs` and let the ledger find the project. Two different recipes in the guide. Also `--no-cache` is needed but not explained.
 5. MINOR: step 5 says "In a fresh session on the strongest model you have". For attendees with a sandboxed `claude-workshop` home, the transcripts are under `~/.claude-workshop/projects`, not `~/.claude/projects`. The page's ledger commands hardcode `~/.claude/projects/`. counting-the-cost.mdx covers `CLAUDE_CONFIG_DIR`, act 9 does not.
 6. MINOR: the "What you see" section names PR numbers, commit shas and costs from the demo as fact. Fine, but the Fable cost comparisons reference a model attendees may not have.

========== ACT 10 (DOCS/day-2/act-10-unattended.mdx) ==========
What worked:
 - `cp -R T/act-10/. .` places the five files. `bin/factory-loop.sh` and `bin/fake-harness.sh` are executable.
 - `bin/factory-loop.sh --dry-run` printed the settings and `guards pass: a real run would start iteration 1`, exit 0.
 - `bash bin/factory-loop.test.sh` printed 13 PASS lines and `13 passed, 0 failed`, exit 0.
 - `shellcheck bin/*.sh` is clean.
 - The gitignore lines work (`.agents/loop/runs/` is ignored). The commit and pre-commit hook passed.
Defects:
 1. MAJOR, step 8 and T/act-10/bin/factory-loop.sh lines 30, 46, 109: the cost hint the loop prints is `node $WORKSHOP_DIR/tools/ledger/ledger.mjs --since <iso> --by agent`, and WORKSHOP_DIR defaults to `$ROOT/../..`. For the layout before-you-arrive.mdx sets up (`~/workshop/hop` and `~/workshop/software-factory-workshop`) that resolves to `~/`, not the workshop clone, so the printed path is wrong. The hint also omits `--project` (the ledger then defaults to the project dir of the current directory, which is the workshop folder, giving $0 for hop's transcripts), and omits `--no-cache`. Step 8 of the page uses a different command, with `--project ... --no-cache`. Fix: default `WORKSHOP_DIR` to `$ROOT/../software-factory-workshop` and print the same command as step 8 (or `--project "$HOME/.claude/projects/<encoded $ROOT>"`).
 2. MINOR, step 4: the page says the test "should see 13 lines that start with PASS". True. `bin/factory-loop.test.sh` is not executable (-rw-r--r--) but the page runs it with `bash`, so that is fine.
 3. MINOR, step 1: the .gitignore lines are given but the step says "Add these three lines ... then commit" and does not say the loop writes `.agents/loop/runs/` during the test, so the gitignore is needed before step 4. It is in the right order, so only a nit.
 4. MINOR, step 5: the board must have at least one non-blocked ticket for `--dry-run` to say a real run would start. Mine had 2 open tickets by coincidence. The page orders the dry run (step 3) before importing tickets (step 5), so a newcomer with an empty board will see "board empty" and may be confused. Fix: say "with no open tickets the dry run reports an empty board; that is expected".
 5. NOTE, step 6 (not run): the loop runs the harness in the main checkout with `claude -p ... --permission-mode acceptEdits`. acceptEdits does not auto-approve Bash commands such as `git`, `gh`, `agentboard` or `npm`, so a headless session would likely stall or fail on the first shell command. The page says the real run is untested. Fix: document the permission allowlist or `--allowedTools` that the orchestrate skill needs (Bash(git:*), Bash(gh:*), Bash(agentboard:*), Bash(npm:*), Bash(node:*)), or note that the presenter must configure it.

========== REFERENCE PAGES ==========
- reference/beads.mdx: `bd` is not installed here; `brew info beads` reports beads stable 1.3.0 and `npm view @beads/bd version` reports 1.3.1, so both install commands in the page point at real packages. I did not run `bd` commands (the page says they were verified outside the demo repo). No defect found; the page's `bd init` warnings (hooksPath, metrics, AGENTS.md ritual) are consistent with its own claims, but I could not re-verify them.
- reference/harnesses.mdx: headless table matches what act 10 uses (`claude -p ... --output-format json`, `codex exec ... --json`, `gemini -p ... -o json`, `agent -p ... --output-format json --force`). Claude Code, Gemini, Codex and Cursor columns are all marked unverified except Claude Code. No defect found. MINOR: it says Claude Code reads AGENTS.md only if there is no CLAUDE.md; the demo repo has none, which is consistent.
- reference/counting-the-cost.mdx: the commands `node ../software-factory-workshop/tools/ledger/ledger.mjs [--plan-usd .. --plan-allowance-usd ..] [--openrouter file]` use flags that the ledger's `--help` lists. This works with the ~/workshop layout (it did not in my scratch layout, so I ran it by absolute path and got $0, as expected for a clean directory). MINOR: inconsistent with the act 9 and act 10 recipe (see act 9 defect 4 and act 10 defect 1).

========== GAPS BETWEEN ACTS (something N+1 assumes N never said) ==========
 G1. Act 1 to act 6: no remote, no `gh repo create`, no `gh auth` step in the act pages (only before-you-arrive checks `gh auth status`). Default branch name is `main` but never verified.
 G2. Act 5 to act 6: act 6 says "stats-page archived and clean", but act 5 never says to commit and push the archive (and .mcp.json, if made).
 G3. Act 6 to act 7: act 7 says "clean, on main" but act 6 step 8 leaves you on main; fine. However act 7 step 2 needs the act-5 stats page and its `stats` gap.
 G4. Act 7 to act 8: act 8 needs an open fix PR (#3) with a real Evidence section on GitHub. Acts 7 and 8 both assume the PR number is 3 and the demo's PR numbering (#5, #2) throughout; attendees' numbers will differ. Also act 8 step 3's reviewer agent needs a session restart (agent file added in the same step).
 G5. Act 8 to act 9: the reviewer agent is sonnet; act 9 wants opus or a different model from the implementer. Act 9 also never says the act-8 PR must be merged or closed first (act 8 step 8 merges it, so fine) and that branch protection/merge delegation is the human's call.
 G6. Act 9 to act 10: act 10 assumes `agentboard` has at least one ticket and that headless `claude -p` is allowed to run Bash tools without prompts (see act 10 defect 5), and that the workshop clone sits two levels up (see act 10 defect 1).
 G7. Throughout: the pre-commit hook runs the full verify (about 2 seconds, and an e2e on pre-push). A fresh worktree without `npm ci` fails with an unhelpful message (act 6 defect 7).

Top priorities to fix before the workshop: S1 and S2 (private repos: hop-demo, agentboard), S3 (no origin or GitHub repo creation step), act 7 defect 1 (eslint config fails the commit), act 8 defects 1 to 3 (copy command, duplicate lesson, demo-specific snippet), act 8/9 reviewer-model mismatch, act 10 defect 1 (wrong ledger hint path and flags), act 10 defect 5 (headless Bash permissions).