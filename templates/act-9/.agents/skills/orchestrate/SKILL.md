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
   Evidence folder: evidence/<change>/g<g>/ (not evidence/<change>/, which another group may also be writing). If tasks.md names an evidence path, use that path exactly instead.
   Do only the tasks of group <g>. Touch only the files design.md names for group <g>.
   Do not start a reviewer and do not merge: the orchestrator does both.
   When the PR is open: agentboard link <id> --pr <n> --as impl-g<g>, then
   agentboard handoff <id> --to orch --status review --note "<PR url>" --as impl-g<g>.
   If you are blocked, block the ticket with a comment and report back.
   Report back in the format in .claude/agents/implementer.md, nothing else.
   ```

   Codex note: spawn the implementer with a fresh context, not yours. Do
   not use `fork_turns: "all"` (it hands the implementer your whole
   conversation, including "you are the orchestrator", and costs tokens).
   Pass `fork_turns: "none"` and send the brief above as the only message.

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
     enough: read the actual values and look at the screenshots.
     Open each evidence PNG with your image-reading tool (Codex:
     `view_image`) and describe what it shows (what is visible, what is
     clipped or missing, how before differs from after) in a ticket comment
     before you accept the evidence. Pixel sizes and file metadata are not a
     check, and "clearly shows" without looking is a failed verify. An
     `expectText` is a substring match, and a step file with no wait after a
     submit can race and drop a row while every step still passes.
   - Every image link in the PR body works. Take each URL from the body
     (`gh pr view <n> --json body`), run
     `curl -sIL -o /dev/null -w '%{http_code}' <url>` and confirm 200 before
     you accept. Each link must name a sha that exists
     (`git cat-file -t <sha>`) and is in the PR. A 404 is a failed verify.
   - Every waiver is written as `Waived: <gate> - <reason>` and the reason
     holds up.
   - `agentboard show <id>` shows the PR link and the handoff to `orch`.

   If any check fails, it is a send-back (step 8), not a review. Record it:
   `agentboard comment <id> "Verify failed: <what and how it was seen>" --as orch`.

7. **Review on a different model.** Do not rely on the spawn message
   reaching the reviewer: a reviewer on a non-OpenAI model through Codex
   gets an empty message. Write the brief to a file and to the ticket first.
   The file is `.agents/review/briefs/pr-<n>.md` in the main checkout (the
   folder is gitignored) and holds the PR number, the change name, the head
   sha to review, what changed and what to read (the spec deltas, the
   evidence folder, your screenshot notes from step 6):
   ```
   mkdir -p .agents/review/briefs
   cat > .agents/review/briefs/pr-<n>.md <<'EOF'
   PR: #<n>
   Change: <change>
   Head: <headRefOid>
   What changed: <one or two sentences>
   Read: openspec/changes/<change>/ (design.md, tasks.md, specs/), evidence/<change>/g<g>/
   Do not read any implementer notes.
   EOF
   agentboard comment <id> "Reviewer brief for PR #<n>: change <change>, head <headRefOid>, see .agents/review/briefs/pr-<n>.md" --as orch
   ```
   Then dispatch the configured reviewer agent (Claude Code: `reviewer`,
   model `opus`; Codex: the `reviewer` agent in `.codex/agents/`). Name the
   spawned task `review_pr<n>` (Codex: `task_name: "review_pr<n>"`), for
   example `review_pr13`. The task name is plaintext and always reaches the
   reviewer, even when the message does not, so the PR number rides on it.
   Send this prompt:

   ```
   You are actor reviewer. Read .agents/review/briefs/pr-<n>.md first: it
   names the PR and the change. Then read .agents/review/reviewer.md and
   follow it exactly for PR #<n>, change <change>. Post the review with
   gh pr review <n> --comment and comment the verdict on the ticket. Do not
   read any implementer notes. Reply with the review exactly as posted.
   ```

   Then check it was posted: `gh pr view <n> --json reviews` and
   `agentboard show <id>`. Reject a review that has no `MODEL:` line after
   `SCORE:`: send it back to the reviewer to add it, and check the line
   names the configured reviewer model.

   If the configured reviewer fails twice, block the ticket for a human with
   a comment (`agentboard comment <id> "Reviewer failed twice: <error>. Needs
   a human." --as orch`, then `agentboard move <id> blocked --as orch`).
   Never substitute a reviewer of your own choosing: no `default` agent, no
   model you pick yourself.

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
     A squash merge drops the branch and the shas the PR body's image links
     name. Rewrite each image URL to the merge sha
     (`blob/<merge sha>/evidence/...png?raw=true`) with
     `gh pr edit <n> --body-file <file>`, and check each returns 200 with
     `curl -sIL`.
   - Delete the reviewer's brief now that the review is posted, so a stale
     brief cannot be picked up by a later reviewer:
     `rm -f .agents/review/briefs/pr-<n>.md`
   - Clean up from the main checkout:
     ```
     git -C <repo> pull --ff-only
     git worktree remove <repo>.worktrees/feat-<change>-g<g>
     git branch -D feat/<change>-g<g>
     git worktree prune
     git remote prune origin
     ```
     `gh pr merge --delete-branch` may already have removed the worktree;
     if `git worktree remove` says it is not a working tree, say only that,
     not who removed it.

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

    Then tidy up what this run left behind:
    - Delete the temp files this run created: the `/tmp/*` and `$TMPDIR/*`
      files named in the run's commands and the agents' reports (PR body
      files, backups, screenshot copies). Delete only those, by name.
    - `git remote prune origin` (stale tracking refs of merged branches).
    - Tick the board checklist on each closed ticket, or say in the report
      that `tasks.md` is the record and the board checklist was not ticked.

13. **Record the cost.** With Codex (OpenRouter), the orchestrator cannot
    see the spend of its own session: the loop writes the usage line to
    `.agents/loop/loop.log` only after the harness exits. Say so in one
    line ("Cost: not visible from inside the run; see .agents/loop/loop.log,
    where the loop records OpenRouter usage before and after each
    iteration") and do not ask for or invent a figure. The ledger reads
    Claude Code logs only and prints $0 for a Codex run, so do not use it.
    With Claude Code, from the repository folder (for example
    `~/workshop/hop`), not from the workshop clone. The ledger finds the
    project from the current folder:
    ```
    node ../software-factory-workshop/tools/ledger/ledger.mjs --since <ISO time the run started> --by agent
    node ../software-factory-workshop/tools/ledger/ledger.mjs --since <ISO time the run started> --by model
    ```
    With the sandbox, put `CLAUDE_CONFIG_DIR=~/.claude-workshop` in front of
    each command. Add `--no-cache` only when you want a cold recount.
    Add `--openrouter .agents/review/openrouter-usage.jsonl` if a second
    opinion ran. Put both tables in the run's report.

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
- Never substitute a reviewer. If the configured reviewer fails twice,
  block the ticket for a human.
- Never use `--no-verify`.
