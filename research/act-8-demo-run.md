# Review tooling build

The act 8 review tooling is built, committed on hop main as `a29f521` and pushed. The pre-push preflight passed every gate, so main moved from 4104b00 to a29f521. The smoke run of the OpenRouter second opinion on PR #3 gave **VERDICT: PASS, SCORE: 5/5** on `openai/gpt-5.6-sol`, cost $0.032976. I did not review, post to or merge PR #3.

## Files
In /Users/ben/Projects/software-factory-workshop/demo/hop:
- .agents/review/rubric.md
- .agents/review/reviewer.md
- .agents/review/README.md
- .agents/review/openrouter-usage.jsonl (committed; one line, no secrets)
- .agents/skills/review-loop/SKILL.md (38 lines)
- .claude/agents/reviewer.md
- .codex/agents/reviewer.toml, .gemini/agents/reviewer.md, .cursor/agents/reviewer.md
  - Each is marked "Written from the docs, not run".
  - Models come from the research doc's examples: gpt-5.5-codex, gemini-2.5-pro, gpt-5. Each has a note to pick one that differs from the implementer's.
- bin/second-opinion.mjs
- AGENTS.md: one line added under step 4: "Every PR goes through the `review-loop` skill before a human merges it."

Claude Code needs no extra wiring for the skill, because `.claude/skills` is already a symlink to `.agents/skills`.

The same 9 files (everything except the usage log and AGENTS.md) are copied to /Users/ben/Projects/software-factory-workshop/templates/act-8/ with the same relative paths. They are **not committed** in the workshop repo; nobody asked for that commit.

## rubric.md (verbatim)
```
# Review rubric

Apply every check to the pull request. A check that does not apply is
marked "n/a" with the reason. Report a gap only if it affects correctness,
the spec, the tests or a check below. Style preferences are not findings.

1. **Tasks.** Every task in the PR's task group is done and ticked in
   `tasks.md`, in this PR. No task outside the group is ticked.
2. **Spec.** The behaviour matches every requirement and scenario in the
   change's spec deltas. Name the scenario for each mismatch.
3. **Tests.** There are tests at the layers the `code-structure` skill
   names (actions with a fake service, services against a real throwaway
   database, e2e for pages and routes), and at least one test would fail
   without the change.
4. **Evidence for a fix.** The PR body's `## Evidence` section shows the bug
   on the before commit and its absence on the after commit, both commits
   named by short sha, and the after commit is in this PR.
5. **Scope of files.** No file is changed outside the task group, except
   files the change's `design.md` names.
6. **Layering.** Routes never call services. Services never decide what is
   allowed. Business rules live in actions.
7. **Clean code.** No dead code. No new `any`, `@ts-ignore` or
   `eslint-disable` without a one-line comment saying why.
8. **Migrations.** A schema change is a new numbered file in `migrations/`.
   No existing migration is edited.
9. **Secrets and config.** No secret in the diff. Every new environment
   variable is in `.env.example`.
10. **Scope creep.** Nothing is built that the proposal, design and tasks do
    not ask for. Unrequested restructuring counts.

## Lessons

When a reviewer, a human or production finds something this rubric missed,
add one line here in the same PR that fixes it.

- An implementer once wrote tests and code in one pass and only proved the
  red state afterwards. Ask how the failing state was observed, and check
  the PR body or commits show it.
```

## reviewer.md (verbatim)
````
# Reviewer

You review one pull request. You did not write it and you have no memory
of writing it. Judge only what is in the repository and the PR.

## Inputs

- The PR number, `<n>`.
- The change name, `<change>`. If you were not given it, take it from the
  `Change:` line in the PR body.

## Read

1. `gh pr view <n>` and `gh pr diff <n>`.
2. `openspec/changes/<change>/`: `proposal.md`, `design.md`, `tasks.md` and
   every file under `specs/`. If the change was archived, it is in
   `openspec/changes/archive/*-<change>/`.
3. `.agents/review/rubric.md`, including its Lessons.
4. `AGENTS.md` and `DEFINITION_OF_DONE.md`.

You may read any file in the repository and run read-only commands (tests,
`git show`, `git log`) to check a claim. Do not edit, commit or push.

## Do not read

The implementer's conversation, notes or transcript. If you are handed
any, ignore them. The point is a review with no memory of the writing.

## Judge

Apply each rubric check. A reviewer asked to find gaps will usually find
some even when the work is sound, so hold back: a finding is BLOCKING only
if it affects correctness, the spec, the tests or a rubric check. Report
gaps, not style preferences. Give at most 3 NITs. If nothing blocks, say
PASS.

## Output

Exactly this shape, nothing before the first line:

```
VERDICT: PASS | VERDICT: CHANGES
SCORE: n/5

[BLOCKING|NIT] file:line - what is wrong - which rubric check or spec requirement - how to show it is fixed
```

Score: 5 merge as is, 4 minor polish, 3 implementation issues, 2 significant
bugs, 0-1 critical. CHANGES if there is any BLOCKING finding, otherwise PASS.
On PASS, add a short list of the rubric checks you verified and how (the
command you ran, the file and line you read).

## Post

1. Write the review to a file outside the repository, for example
   `${TMPDIR:-/tmp}/review-pr-<n>.md`.
2. `gh pr review <n> --comment --body-file <file>`
3. Find the ticket with `agentboard list --change <change>` and comment the
   verdict on it:
   `agentboard comment <id> "Review of PR #<n>: VERDICT: <verdict>, SCORE: <n>/5, <k> blocking" --as reviewer`
````

## second-opinion usage text
```
Usage: node bin/second-opinion.mjs --pr <n> [--model <openrouter model id>] [--change <name>] [--out <file>]

Reviews pull request <n> with a non-Claude model through OpenRouter, using
.agents/review/reviewer.md, the rubric, the change's OpenSpec artifacts and
gh pr diff <n>. Prints the review, writes it to --out if given, and appends
one line of token use and cost to .agents/review/openrouter-usage.jsonl.

  --pr <n>        pull request number (required)
  --model <id>    OpenRouter model id (default openai/gpt-5.6-sol)
  --change <name> OpenSpec change (default: the "Change:" line of the PR body)
  --out <file>    also write the review to this file

Needs OPENROUTER_API_KEY in the environment (exit 2 if unset) and gh.
Nothing is posted to GitHub.
```
- **Default model:** `openai/gpt-5.6-sol`, the "review" model in /Users/ben/Projects/aviation/tools/second-opinion.config.json.
- **Extra context sent:** besides what you specified, the prompt also includes AGENTS.md, DEFINITION_OF_DONE.md and the PR body.
- **Extra field in the usage line:** each line has a `ts` field equal to `timestamp`. The ledger's `--openrouter` reader uses `ts` for `--since` and `--by day`; without it, those rows would show as day "unknown".

## OpenRouter smoke run
- **Key found:** yes. It was exported for that one command only and never written to a file.
- **Verdict line:** `VERDICT: PASS` (followed by `SCORE: 5/5`)
- **Model and tokens:** openai/gpt-5.6-sol, 10323 prompt and 717 completion tokens.
- **Recorded cost:** $0.032976.
- **Output:** the review is in /tmp/so-pr3.md and was not posted to GitHub.

## Commands and exit codes
- `npx eslint bin/second-opinion.mjs`: exit 0
- `node bin/second-opinion.mjs --help`: exit 0
- second-opinion with OPENROUTER_API_KEY unset: exit 2, with a clear message
- smoke run `node bin/second-opinion.mjs --pr 3 --out /tmp/so-pr3.md`: exit 0
- `npm run verify`: exit 0 (56 tests, 0 failed)
- `git commit` on main: pre-commit hook passed (verify green)
- `git push origin main`: exit 0, PREFLIGHT PASSED for a29f521 (install, verify, build, audit, migrations, e2e). No `--no-verify` was used anywhere.

## Commit hashes
- `a29f521` on hop main, pushed to origin.


# Planting defects in calibration PR #5

The variant PR is open as #5 with both defects planted, and `npm run verify`, `E2E_PORT=4393 npm run e2e` and the push gate all passed. Nothing is merged. The worktree is at /Users/ben/Projects/software-factory-workshop/demo/hop.worktrees/calibration-planted-2.

PR: #5, https://github.com/bendechrai/hop-demo/pull/5 (branch `fix/reserved-codes-g1-cal`). Title and body are as you specified.
Commit: 3d2d7b9, message "Make the reserved code refusal explicit at the API edge". The pre-commit hook passed.

**Defect 1, layering violation (rubric check 6), `src/routes/links.ts`:**
- Added import after the list-links import: `import { RESERVED_CODES } from "../actions/reserved-codes.ts";`
- Added in the POST handler, just before `const result = createLink(`:
```
    const requestedCode = field("code");
    if (typeof requestedCode === "string" && RESERVED_CODES.includes(requestedCode.toLowerCase())) {
      res.status(400).json({ error: `The code "${requestedCode}" is reserved for a page of hop. Choose another code.` });
      return;
    }
```
Behaviour is unchanged: the status (400) and message match what the action already returns.

**Defect 2, dead code (rubric check 7), `src/actions/reserved-codes.ts`:** appended an exported helper that nothing calls.
```
export function isReservedCode(code: string): boolean {
  return RESERVED_CODES.includes(code.toLowerCase());
}
```

**Results:**
- `npm run verify`: exit 0
- `E2E_PORT=4393 npm run e2e`: exit 0
- Pre-push gate: all gates passed (install, verify, build, audit, migrations, e2e all ok)

`.agents/review/rubric.md` doesn't exist in the worktree. I read it from the main checkout, as you said.

# In-harness Claude reviewer (Sonnet) on PRs #3 and #5

Both reviews are posted. PR #3 is PASS 5/5 and PR #5 is CHANGES 3/5 with 3 blocking findings. Each was reviewed on its own against main, the `reserved-codes` OpenSpec artifacts, the rubric, AGENTS.md and DEFINITION_OF_DONE.md. Both temporary worktrees are removed and I edited, committed and pushed nothing.

Review files: /private/tmp/claude-501/-Users-ben-Projects-software-factory-workshop/6bd3b073-6ab7-41c0-9ad8-75c1b35a8051/scratchpad/review-pr-3.md and review-pr-5.md.

## PR #3 review (verbatim)
```
VERDICT: PASS
SCORE: 5/5

No blocking findings.

Rubric checks verified, and how:
1. Tasks: tasks.md in the diff ticks 1.1 to 1.4 only, all in group 1, in this PR.
2. Spec: ran `npm run verify` (exit 0, 64 tests, 0 fail). Read src/actions/reserved-codes.ts and create-link.ts:32-33. Scenarios covered: `stats` (create-link.test.ts, app.test.ts), `API` (create-link.test.ts), `/stats` still serves the page (app.test.ts), `my-stats` accepted, `abc+` refused with a message naming the preview.
3. Tests: actions test with a fake service (create-link.test.ts, reserved-codes.test.ts), route test in app.test.ts, e2e/reserved.spec.ts. Restored main's create-link.ts in a temporary worktree and ran `npm run test`: 2 tests failed (62 pass), so the tests fail without the change. `E2E_PORT=4393 npm run e2e`: exit 0, 9 passed.
4. Evidence: PR body has an Evidence section with before 4104b00 and after 1d8c491. 4104b00 is the base of the branch, `git merge-base --is-ancestor 1d8c491 HEAD` is true, and before.json (3 failed steps) and after.json (0 failed) match the table. The red state was observed on main by the evidence run.
5. Scope of files: only the task group's files plus evidence/reserved-codes/; all named in the tasks and proposal Impact.
6. Layering: the check is in src/actions and called from createLink; routes/links.ts is untouched; the service is untouched.
7. Clean code: no dead code; grep for `eslint-disable`, `ts-ignore` and `: any` in src and e2e found nothing.
8. Migrations: n/a, no schema change.
9. Secrets and config: n/a, no secret and no new environment variable in the diff.
10. Scope creep: nothing beyond proposal, design and tasks. The reserved list matches `ls public` (app, index, stats, style) plus `api`, and app.ts mounts no other top-level route.

[NIT] src/actions/reserved-codes.ts:5 - RESERVED_CODES must be updated by hand for a new router mount; only public/ is checked by a test - design.md Risks already accepts this - no action needed in this PR.
```

## PR #5 review (verbatim)
```
VERDICT: CHANGES
SCORE: 3/5

[BLOCKING] src/routes/links.ts:20-24 - the route decides which codes are allowed (it checks RESERVED_CODES and builds its own 400 body) before calling createLink - rubric 6 (layering: business rules live in actions, routes never decide what is allowed) and design.md decision "The list lives in src/actions/reserved-codes.ts ... a business rule, so it sits in the actions layer" - remove the check from the route and leave the refusal in createLink, which the links route already maps from `invalid` to 400.
[BLOCKING] src/routes/links.ts:22 and src/actions/reserved-codes.ts:18-20 - the route check duplicates the action's check and its message string, and `isReservedCode` is exported but never used (`grep -rn isReservedCode src e2e` finds only its definition) - rubric 7 (no dead code) and rubric 10 (scope creep: commit 3d2d7b9 is not in the proposal, design or tasks, and the rule now lives in two places) - delete the route check and `isReservedCode`.
[BLOCKING] PR body Evidence section - the evidence and the checks name 1d8c491 and 6569c36, but the branch head is 3d2d7b9, which changes API behaviour and was not run through the evidence steps, `npm run verify`, e2e or preflight as recorded; the image links also point at the branch fix/reserved-codes-g1, not this PR's branch - rubric 4 (after commit in this PR with evidence of the final behaviour) - drop the extra commit and the evidence then matches the head, and point the image links at this branch.
[NIT] src/routes/links.ts:22 - the route compares the untrimmed code while createLink trims it, so the two checks can disagree on input such as " stats" - rubric 2 - disappears when the route check is removed.

Rubric checks verified, and how:
1. Tasks: tasks.md ticks 1.1 to 1.4 only, in this PR. OK.
2. Spec: `npm run verify` exit 0 (64 tests, 0 fail), `E2E_PORT=4395 npm run e2e` exit 0 (9 passed). Behaviour matches every scenario (`stats`, `API`, `/stats` still shows, `my-stats`, `abc+`), but see the findings above.
3. Tests: layers are present (create-link.test.ts, reserved-codes.test.ts, app.test.ts, e2e/reserved.spec.ts). Note that the route check in src/routes/links.ts has no test of its own: with it reverted to the previous commit's links.ts, `npm run test` still gives 64 pass, 0 fail, so that code is untested and unnecessary.
4. Evidence: before 4104b00 and after 1d8c491 are named, and 1d8c491 is an ancestor of HEAD, but see the third BLOCKING finding.
5. Scope of files: src/routes/links.ts is outside the task group and design.md does not name it. See the first finding.
6. Layering: fails, see the first finding.
7. Clean code: unused export, see the second finding. No new `any`, `ts-ignore` or `eslint-disable`.
8. Migrations: n/a, no schema change.
9. Secrets and config: n/a, no secret and no new environment variable.
10. Scope creep: fails, see the second finding.
```

## Rubric checks and how I verified them
- **Tasks (1):** read the `tasks.md` diff on each PR.
- **Spec (2):** read the spec deltas, `reserved-codes.ts` and `create-link.ts`, and ran the tests and e2e on each branch.
- **Tests (3):**
  - On PR #3 I restored main's `create-link.ts` in the temp worktree. Two tests failed, 62 passed, then I restored the file.
  - On PR #5 I reverted the route change. Tests still gave 64 pass, so the route addition is untested and redundant.
- **Evidence (4):**
  - On both PRs, `git cat-file -t 4104b00` shows the before commit exists, and `git merge-base --is-ancestor 1d8c491 HEAD` is true.
  - I compared `before.json` and `after.json` with the PR table.
  - On PR #5 the extra commit 3d2d7b9 sits after the evidence commits. The image links also point at the `fix/reserved-codes-g1` branch, which is PR #3's branch.
- **Scope, layering, clean code, scope creep (5, 6, 7, 10):** read each PR diff, grepped for `isReservedCode` and for `eslint-disable`, `ts-ignore` and `: any`, and read `app.ts` mounts and `ls public`.
- **Migrations and secrets (8, 9):** n/a on both, because the diffs have no schema change, secret or environment variable.

## Commands and exit codes
| Command | Exit |
|---|---|
| `git fetch -q origin` | 0 |
| `gh pr view 3` and `gh pr diff 3` | 0 |
| `gh pr view 5` and `gh pr diff 5` | 0 |
| `git worktree add ../hop.worktrees/review-pr3 origin/fix/reserved-codes-g1` | 0 |
| `git worktree add ../hop.worktrees/review-pr5 origin/fix/reserved-codes-g1-cal` | 0 |
| `git merge-base --is-ancestor 1d8c491 HEAD` (both worktrees) | 0 |
| PR #3: `npm run verify` | 0 (64 tests, 0 fail) |
| PR #3: `E2E_PORT=4393 npm run e2e` | 0 (9 passed) |
| PR #3: mutation run (main's `create-link.ts` restored, `npm run test`) | I did not capture the exit code (only the `ℹ pass`/`ℹ fail` counts were piped through grep); the run showed 62 pass, 2 fail. File restored afterwards. |
| PR #5: `npm run verify` | 0 (64 tests, 0 fail) |
| PR #5: `E2E_PORT=4395 npm run e2e` | 0 (9 passed) |
| PR #5: route reverted, `npm run test` | I did not capture the exit code (only the counts were piped through grep); the run showed 64 pass, 0 fail. File restored afterwards. |
| `gh pr review 3 --comment --body-file ...` | 0 |
| `agentboard comment 01M3X9V1BMGCHCR823QDHMM5PK "PR #3 - Review of PR #3: VERDICT: PASS, SCORE: 5/5, 0 blocking" --as reviewer` | 0 |
| `gh pr review 5 --comment --body-file ...` | 0 |
| `agentboard comment 01M3X9V1BMGCHCR823QDHMM5PK "PR #5 - Review of PR #5: VERDICT: CHANGES, SCORE: 3/5, 3 blocking" --as reviewer` | 0 |
| `git worktree remove --force` (both) and `git worktree prune` | 0 |

The ticket found with `agentboard list --change reserved-codes` is 01M3X9V1BMGCHCR823QDHMM5PK ("Reserve route names").

Main has moved to ed7788f since the PRs were opened. This does not affect the findings, because I judged each PR's own diff against its base 4104b00.

# Challenger role and OpenRouter runs (GPT-5.6 Sol, GLM 5.3)

Both parts are done. Four runs completed and cost $0.2610 in total. Nothing was posted to GitHub or merged, and I never used --no-verify.

**Part 1: the challenger role**
- Commit `ed7788f` on main, pushed to bendechrai/hop-demo (a29f521..ed7788f).
- Gate: the pre-commit hook passed (verify). The pre-push preflight passed: install, verify, build, audit, migrations and e2e (8 e2e tests) all ok.
- `npx eslint bin/second-opinion.mjs` was clean and `npm run verify` passed (56 tests).
- Files in the commit: `bin/second-opinion.mjs`, `.agents/review/challenger.md` (new) and `.agents/review/README.md`. The README has the new "Two roles" section, and its usage example and file table are updated. Copies are at `/Users/ben/Projects/software-factory-workshop/templates/act-8/` at the same relative paths.
- Models: the aviation config names `openai/gpt-5.6-sol` for review and `z-ai/glm-5.3` for challenge. I used those as the defaults.
- Usage log: each line now has a `role` field, and the printed footer shows the role too.
- Argument checks: `--role` must be review or challenge, and `--against` is only accepted with `--role challenge`.
- Not copied from aviation: its max_tokens of 4000, temperature 0.2 and low reasoning effort. The demo script sends none of these, so I left that behaviour unchanged.
- Uncommitted: the four new lines in `.agents/review/openrouter-usage.jsonl` from Part 2. You didn't ask me to commit them, so I left them for you.

**challenger.md**
```
# Challenger

You are the second, adversarial reader of one pull request. A reviewer has
judged it, or may do so. You did not write the code and you are not the
reviewer. Your job is to argue, not to agree. You exist to disagree where
disagreeing is justified.

## Inputs

The same as the reviewer: the rubric, AGENTS.md, DEFINITION_OF_DONE.md, the
PR body, the change's OpenSpec files and the PR diff. Optionally, an earlier
review of this same PR. Treat that review as a claim to test, not as
evidence. Everything you may use is in the message; you have no tools.

## Do

1. Find what a reviewer would miss or wrongly pass: behaviour the spec
   requires that no test pins, paths the diff never touches but should,
   edge cases, claims in the PR body that the diff does not support, tests
   that would pass even if the code were wrong.
2. Make the strongest case against merging. State it as an argument: what
   breaks, for whom, and how a reader could show it.
3. If an earlier review is given, say plainly where its findings are wrong:
   a BLOCKING finding that is not real, a NIT that is really blocking, a
   check it claims to have verified that the diff does not support. Say
   where it is right too, in one line, so the disagreement is honest.
4. Do not invent defects. Quote the file and line from the diff for every
   finding. If after trying hard you cannot make a case against merging,
   say so and PASS.

## Do not

Pad, praise, or restate the diff. Do not give style preferences. At most 3
NITs.

## Output

Exactly this shape, nothing before the first line:

```
VERDICT: PASS | VERDICT: CHANGES
SCORE: n/5

[BLOCKING|NIT] file:line - what is wrong - which rubric check or spec requirement - how to show it is fixed

AGAINST THE EARLIER REVIEW
- [WRONG|MISSED|RIGHT] its claim - why
```

Score: 5 merge as is, 4 minor polish, 3 implementation issues, 2 significant
bugs, 0-1 critical. CHANGES if there is any BLOCKING finding, otherwise PASS.
Omit the last section if no earlier review was given.
```

**--help text**
```
Usage: node bin/second-opinion.mjs --pr <n> [--role review|challenge] [--against <file>] [--model <openrouter model id>] [--change <name>] [--out <file>]

Reads pull request <n> with a non-Claude model through OpenRouter, using a
role prompt, the rubric, the change's OpenSpec artifacts and gh pr diff <n>.
Prints the result, writes it to --out if given, and appends one line of
token use, cost and role to .agents/review/openrouter-usage.jsonl.

Two roles, two different models:
  review     (default) .agents/review/reviewer.md, default model openai/gpt-5.6-sol
  challenge  .agents/review/challenger.md, default model z-ai/glm-5.3
             Argues against merging and against any earlier review.
             Same VERDICT and SCORE header, so results compare.

  --pr <n>          pull request number (required)
  --role <role>     review or challenge (default review)
  --against <file>  challenge only: an earlier review to test and rebut
  --model <id>      OpenRouter model id (default depends on --role)
  --change <name>   OpenSpec change (default: the "Change:" line of the PR body)
  --out <file>      also write the result to this file

Needs OPENROUTER_API_KEY in the environment (exit 2 if unset) and gh.
Nothing is posted to GitHub.
```

**Part 2: the four runs**
The key was exported per command only and never written to a file or printed. The results are in `/Users/ben/Projects/software-factory-workshop/research/act-8-reviews/`.

| Run | File | Model | VERDICT | SCORE | Cost |
|---|---|---|---|---|---|
| PR #3 review | `pr3-review-gpt-5.6-sol.md` | openai/gpt-5.6-sol | PASS | 5/5 | $0.0330385 |
| PR #3 challenge | `pr3-challenge-glm-5.3.md` | z-ai/glm-5.3 | PASS | 5/5 | $0.0996986 |
| PR #5 review | `pr5-review-gpt-5.6-sol.md` | openai/gpt-5.6-sol | CHANGES | 3/5 | $0.037531 |
| PR #5 challenge | `pr5-challenge-glm-5.3.md` | z-ai/glm-5.3 | CHANGES | 3/5 | $0.0907358 |

BLOCKING findings:
- **PR #3 review:** none.
- **PR #3 challenge:** none. It raised two NITs: the reserved list's route-mount half (`api`, `stats`) has no guard beyond a comment, and the PR body's list of `public/` files omits `stats`. It marked the earlier review as MISSED on both. It listed the strongest cases it tried and found none that held.
- **PR #5 review (2 BLOCKING):**
  - `src/routes/links.ts:21` has a route-level reserved-code guard that duplicates the action's rule and message, against the layering and file-scope rules.
  - `src/actions/reserved-codes.ts:17` exports `isReservedCode`, which nothing uses (dead code, rubric 7).
- **PR #5 challenge (1 BLOCKING):**
  - `src/routes/links.ts:21-24` has the same duplicate guard. It adds a side effect: it fires before `createLink`, so an invalid URL plus a reserved code returns the reserved message instead of the URL error. It also lets the route-level tests pass even if the action's check were deleted.
  - It downgraded the `isReservedCode` finding to a NIT, calling the reviewer's BLOCKING severity WRONG.

The challenger used about 18x the completion tokens of the reviewer (17k to 19k, against 0.7k to 1.1k).

**Total OpenRouter cost of the four runs: $0.2610039** ($0.0330385 + $0.0996986 + $0.037531 + $0.0907358).


## Merge of PR #3

All five steps are done. Nothing was waived and no --no-verify was used. The harness did not always show exit codes; I show "ok" where the gates printed passing results or a later command depended on the step succeeding.

**1. Cost record and Lessons line (main, commit a66cabf)**
- The 4 uncommitted lines in `.agents/review/openrouter-usage.jsonl` hold only timestamps, pr, role, model, tokens and cost. A grep for sk-/key/bearer/token found nothing, and the gitleaks pre-commit hook found no leaks.
- The file actually has 5 lines (the 5th is the PR #5 challenger run, pr 5). Four are new, matching the 4 uncommitted lines you described.
- Lessons line, verbatim: `- When the same rule is checked in two layers (for example a route and an action), ask which error wins on mixed bad input (an invalid URL plus a reserved code), and whether the tests would still pass if the authoritative check were deleted.`
- I copied the updated rubric to `/Users/ben/Projects/software-factory-workshop/templates/act-8/.agents/review/rubric.md` (cp exit 0).
- Commit hooks passed (verify, 56 tests). `git push origin main` pushed `ed7788f..a66cabf`. Gate tail: verify ok 6s, build ok, audit ok, migrations ok, e2e ok 6s, "pre-push: all gates passed."

**2. PR #3 body**
- `gh pr edit 3 --body-file` exited 0. The list now reads (`app`, `index`, `stats`, `style`), which matches `RESERVED_CODES` in `src/actions/reserved-codes.ts`. `public/` holds app.js, index.html, stats.html, stats.js and style.css.
- Nothing else in the body changed.

**3. Rebase, evidence, push**
- `git fetch origin && git rebase origin/main` exited 0. `package-lock.json` did not change, so I skipped `npm ci`.
- On the rebased branch, `npm run verify` exited 0 and `E2E_PORT=4391 npm run e2e` exited 0 (9 passed).
- The first `git push --force-with-lease` went `6569c36...d4291ff` and the gate passed.
- Old shas: branch head 6569c36, and the evidence's "after" sha 1d8c491. New shas: code commit db64993 and evidence commit d4291ff.
- I re-captured the after side on HEAD (d4291ff). Its output was "after at d4291ff: 10 ok, 0 failed", and `after.json` has `shortCommit` d4291ff, passed 10, failed 0. Only `after.json` changed; the PNGs were identical.
- The refresh was committed as b363955 and pushed (`d4291ff..b363955`, gate passed).
- In the PR body I replaced 1d8c491 with d4291ff (6 places). The before row (4104b00) is untouched.
- The body's Checks section still says the pre-push preflight ran on 6569c36. I left it alone because you asked for the Evidence table only.

**4. Merge and cleanup**
- `gh pr merge 3 --squash --delete-branch` merged PR #3 as 0547bdd. The remote branch is gone: `git ls-remote --heads` shows nothing.
- On main, `git checkout main && git pull --ff-only` fast-forwarded, `npm run verify` exited 0 and `npm run e2e` exited 0 (9 passed).
- The ticket was still in `review`. The first `agentboard close-merged --as ben` printed "close-merged: 0 closed, 0 unmerged, 0 skipped".
- I ran `agentboard move 01M3X9V1BMGCHCR823QDHMM5PK merged --as ben`, then `agentboard close-merged --as ben`. Its output:
  `closed 01M3X9V1BMGCHCR823QDHMM5PK  merged  ben  [closed] Reserve route names (no decision)`
  `close-merged: 1 closed, 0 unmerged, 0 skipped`
- The worktree and local branch were already gone when I got to the removal commands. `git worktree remove` said "not a working tree" and `git branch -D` said the branch was not found, so `gh --delete-branch` had probably already removed them. `git worktree prune` ran, and `git worktree list` shows only `/Users/ben/Projects/software-factory-workshop/demo/hop  0547bdd [main]`.
- An empty `hop.worktrees` folder is left beside the repo.

**5. Archive (commit d700081)**
- Prechecks passed: 4 of 4 tasks complete and all artifacts done.
- `npx -y @fission-ai/openspec@1.14.0 archive reserved-codes -y` created the new `custom-codes` main spec with 2 requirements added, and archived the change as `2026-10-01-reserved-codes`.
- I committed the result and pushed main (`0547bdd..d700081`). The gate passed: verify, build, audit, migrations and e2e all ok.

**Final `git log --oneline -6` on main**
```
d700081 Archive reserved-codes and sync its two requirements into the custom-codes spec, because the change is merged and its tasks are done
0547bdd Refuse custom codes that a page of the app would shadow (#3)
a66cabf Record OpenRouter review costs and add the layered-check lesson, because only the challenger noticed a duplicate route guard changes which error wins and masks the action's own check
ed7788f Add a challenger role to the second opinion: a different vendor whose job is to disagree
a29f521 Add a reviewer we own: a rubric that learns from misses, a prompt any harness can load, and an optional cross-vendor second opinion
4104b00 Put evidence worktrees beside the main checkout even when run from a ticket worktree
```
