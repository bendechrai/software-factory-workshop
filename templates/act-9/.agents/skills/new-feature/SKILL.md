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
   git worktree add ../$REPO.worktrees/feat-link-extras-g1 -b feat/link-extras-g1 --no-track origin/main
   ```
   For repo `hop` that is `../hop.worktrees/feat-link-extras-g1`. `--no-track` keeps the
   branch from tracking `origin/main`, so a bare `git push` can never push to main.

4. **Enter and prepare it.** `cd ../hop.worktrees/feat-link-extras-g1`, then `npm ci`.
   Do not run `bin/setup-git-hooks.sh`: `core.hooksPath` is shared config. Verify with
   `git config core.hooksPath`. Confirm `git branch --show-current` is not `main`.
   If you skip `npm ci`, the first commit fails in the hook with "tsc: command not found".

5. **Keep ports and databases apart.** Worktrees share files but not ports or databases.
   If you start the app, pick a port from your ticket number range and use
   `HOP_DB=:memory:` or a database file inside the worktree. Playwright reads its port from
   `E2E_PORT`. Each worktree must use a different one: suggest `4390 + <group>`, for example
   `E2E_PORT=4391 npm run e2e` for group 1.

6. **Work the ticket.** Follow the `openspec-apply-change` skill for your task group only,
   and move the ticket as you go. The moves are in this order, and any other order is
   refused with `invalid-transition`:
   `agentboard move <id> tests --as <you>` before you write the failing tests,
   `agentboard move <id> implementing --as <you>` before you make them pass, then the
   handoff to review in step 7 (a handoff to `review` straight from `tests` is refused).
   Tick your tasks in `tasks.md`. Commit inside the worktree. The pre-commit hook runs;
   never use `--no-verify`.

7. **Ship.**
   ```
   git push -u origin <branch>
   gh pr create --base main --title "<title>" --body-file <file>   # body written to a file first, see the evidence skill
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
