---
name: evidence
description: Captures before and after proof that a ticket does what it says. Use for every ticket before opening its PR.
---

# evidence

Work is not done until it shows evidence an agent cannot talk its way around.
"Tests pass" and "it should work" are claims. A before and after pair, captured
the same way against named commits, is evidence.

1. **Decide the evidence type.**
   - Fix: reproduce the bug on `origin/main`, then show it gone on your branch,
     with the same steps file.
   - Visible change: before and after screenshots of the affected page.
   - Non-visible change: a measurement or test output pair, before and after.

2. **Write the steps file** at `evidence/<change>/steps.json`. Run
   `node bin/evidence.mjs --help` for the step kinds. Put an `expectText` or
   `expectStatus` on the thing that should change, and a `screenshot` of it.

3. **Commit your code first**, then capture both sides from the repo root:
   ```
   node bin/evidence.mjs --ref origin/main --out evidence/<change> --name before --script evidence/<change>/steps.json
   node bin/evidence.mjs --ref HEAD --out evidence/<change> --name after --script evidence/<change>/steps.json
   ```
   Each run checks the ref out into its own worktree, so uncommitted edits are
   never in the picture. A failed expectation on `before` is the bug, on record.

4. **Look at the result.** Open the after screenshots and read `after.json`.
   If the after does not show the intended result, go back to building: the
   work is not done. For a fix, the before must show the bug. If it does not,
   you have not reproduced it; say so and stop.

5. **Commit the evidence folder** on the branch: steps file, both records,
   every screenshot.

6. **The PR body has an `## Evidence` section** with a table:

   | Checked | Before | After |
   |---|---|---|
   | <what was checked> | <short sha>: <result> | <short sha>: <result> |

   Link each image by the commit sha of your evidence commit, never by
   branch name (the branch is deleted on merge and the image 404s):
   `https://github.com/<owner>/<repo>/blob/<commit sha>/evidence/<change>/<file>.png?raw=true`,
   where the sha is `git rev-parse HEAD` after you committed the evidence
   (use the full sha). The orchestrator rewrites it to the merge sha after
   the merge, because a squash merge drops your commits' shas.
   The short shas in the table come from `shortCommit` in the records, not
   from memory.

   Write the PR body to a file and create the PR with `--body-file`. Never
   put markdown with backticks or apostrophes inside a shell string: the
   shell runs backticked text as commands.

   Never type a sha. A sha typed by hand gets made up (a run once kept the
   right 7 characters and invented the rest, and every image link 404ed).
   The shell computes it and substitutes it. Push the branch first, then
   use a quoted heredoc with the placeholder `@SHA@` and let `sed` fill it
   in (a quoted heredoc is safe for backticks; an unquoted heredoc or
   `printf "%s"` with `$sha` also works if the body has no backticks):
   ```
   git push ...                  # the repo must be pushed before any link is checked
   sha=$(git rev-parse HEAD)     # the evidence commit, after you committed it
   body="${TMPDIR:-/tmp}/pr-body.md"
   cat > "$body" <<'EOF'
   ...the body below, with @SHA@ in every image link...
   EOF
   sed -i.bak "s/@SHA@/$sha/g" "$body" && rm -f "$body.bak"
   ```
   Before you open the PR, check every image link returns 200 against the
   pushed branch, with the real sha:
   ```
   grep -o 'https://github.com[^) ]*' "$body" | while read -r u; do
     echo "$(curl -sIL -o /dev/null -w '%{http_code}' "$u") $u"
   done                          # every line must start with 200
   ```
   If any is not 200, fix the body and check again. Only then:
   ```
   gh pr create --base main --title "<title>" --body-file "$body"
   rm -f "$body"
   ```

   Skeleton for the whole PR body:

   ```
   ## What
   <one or two sentences: what changed and why>

   ## Evidence
   | Checked | Before | After |
   |---|---|---|
   | <what was checked> | <short sha>: <result> | <short sha>: <result> |

   ![before](<image URL>)
   ![after](<image URL>)

   ## Checks
   - npm run verify: exit 0
   - E2E_PORT=4391 npm run e2e: exit 0
   - Waived: <gate> - <reason> (only if one was waived)
   ```

## Never

- Present a screenshot of the wrong commit, or one captured some other way.
- Present scripted playback, a mock-up or an edited image as the app.
- Rewrite a record by hand. If it is wrong, fix the steps and capture again.
