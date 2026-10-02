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

   Then link each image as
   `https://github.com/<owner>/<repo>/blob/<branch>/evidence/<change>/<file>.png?raw=true`,
   for example
   `![after](https://github.com/bendechrai/hop-demo/blob/fix/reserved-codes-g1/evidence/reserved-codes/after-home.png?raw=true)`.
   The short shas come from `shortCommit` in the records, not from memory.

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
