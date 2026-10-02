Act 7 is built. The bug reproduced on main before I wrote any fix. PR https://github.com/bendechrai/hop-demo/pull/3 is open, linked on the board and handed to `ben` in review. It is not merged.

## Part 1: evidence tooling (committed on main)

**Files:**
- `/Users/ben/Projects/software-factory-workshop/demo/hop/bin/evidence.mjs`
- `/Users/ben/Projects/software-factory-workshop/demo/hop/.agents/skills/evidence/SKILL.md` (54 lines)
- Both are copied to `/Users/ben/Projects/software-factory-workshop/templates/act-7/` at the same relative paths. A diff confirms the copies match the final versions.

**Other changes:**
- AGENTS.md step 4 gained this line: "A PR is not opened without the Evidence section the `evidence` skill describes."
- `eslint.config.js` now gives `bin/**/*.mjs` the Node globals, so the tool is linted. This change is not in the template folder.

**How the tool runs:** it imports `chromium` from `@playwright/test`, which is already a dependency, so nothing new was installed. A failed expectation still exits 0. A setup error exits 1 and a usage error exits 2. Smoke test against HEAD: 4 ok and 1 deliberate fail.

**Defect found and fixed:** run from inside a ticket worktree, the tool put its checkout in `hop.worktrees/fix-reserved-codes-g1.worktrees/` instead of `hop.worktrees/`. It now finds the main checkout through `git rev-parse --git-common-dir`. I fixed this on main in 4104b00 and rebased the branch onto it.

**Usage text** (`node bin/evidence.mjs --help`):
```
Usage: node bin/evidence.mjs --ref <git ref> --out <dir> --name <label> --script <steps.json>

  --ref     commit, branch or tag to capture, for example origin/main or HEAD
  --out     folder for the screenshots and the <label>.json record
  --name    label for this run, for example before or after
  --script  JSON file holding a list of steps, run in order:
              { "goto": "/path" }
              { "fill": "<selector>", "value": "text" }
              { "click": "<selector>" }
              { "expectText": "text", "selector": "<selector>" }   selector defaults to body
              { "screenshot": "<name>" }                           saved as <label>-<name>.png
              { "request": { "method": "POST", "path": "/api/x", "body": {} }, "expectStatus": 201 }

The app runs with HOP_DB=:memory: on a free port. Exit 0 even when an
expectation fails; each step records ok true or false.
```

**Full SKILL.md:**
```
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
   `![after](https://github.com/bendechrai/hop-demo/blob/fix/reserved-codes-g1/evidence/reserved-codes/after-home-api.png?raw=true)`.
   The short shas come from `shortCommit` in the records, not from memory.

## Never

- Present a screenshot of the wrong commit, or one captured some other way.
- Present scripted playback, a mock-up or an edited image as the app.
- Rewrite a record by hand. If it is wrong, fix the steps and capture again.
```

## Part 2: reserved-codes

**Bug confirmed on main (5ab7f63), app on `HOP_DB=:memory:`:**
- POST `/api/links` with `{"url":"https://example.com/reserved","code":"stats"}` returned 201.
- GET `/stats` then returned 200 `text/html` with `<title>Stats - hop</title>` and no redirect.

**Proposal:** written at `openspec/changes/reserved-codes/`, with a new capability `custom-codes`. It has one group, "1. Reserve route names", with tasks 1.1 to 1.4; 1.4 is the evidence task.

**Fix:**
- The one list is in `src/actions/reserved-codes.ts`: `api`, `app`, `index`, `stats`, `style`.
- Matching ignores case, because Express routes ignore case, so `/STATS` also shows the stats page.
- A trailing `+` gets its own message, checked before the format check.
- `createLink` returns `invalid`, which the route turns into 400.
- A test fails if a file in `public/` has no entry in the list.
- New tests: `src/actions/reserved-codes.test.ts`, plus additions to `create-link.test.ts` and `app.test.ts`, and a new `e2e/reserved.spec.ts`. I watched the unit tests fail before writing the code.

**steps.json:**
```
[
  { "request": { "method": "POST", "path": "/api/links", "body": { "url": "https://example.com/reserved", "code": "stats" } }, "expectStatus": 400 },
  { "request": { "method": "GET", "path": "/api/links/stats" }, "expectStatus": 404 },
  { "goto": "/stats" },
  { "screenshot": "stats" },
  { "goto": "/" },
  { "fill": "#url", "value": "https://example.com/reserved-api" },
  { "fill": "#code", "value": "api" },
  { "click": "button[type=submit]" },
  { "expectText": "reserved", "selector": "#message" },
  { "screenshot": "home-api" }
]
```

**before.json** (verbatim):
```
{
  "label": "before",
  "ref": "origin/main",
  "commit": "4104b0013dc5c7b04d1aea9f3ff964f621548230",
  "shortCommit": "4104b00",
  "capturedAt": "2026-10-02T03:19:20.344Z",
  "passed": 7,
  "failed": 3,
  "steps": [
    {
      "step": {
        "request": {
          "method": "POST",
          "path": "/api/links",
          "body": {
            "url": "https://example.com/reserved",
            "code": "stats"
          }
        },
        "expectStatus": 400
      },
      "ok": false,
      "status": 201,
      "body": {
        "code": "stats",
        "url": "https://example.com/reserved",
        "clicks": 0,
        "createdAt": "2026-10-02T03:19:14.923Z",
        "expiresAt": null,
        "expired": false,
        "shortUrl": "http://127.0.0.1:53135/stats"
      }
    },
    {
      "step": {
        "request": {
          "method": "GET",
          "path": "/api/links/stats"
        },
        "expectStatus": 404
      },
      "ok": false,
      "status": 200,
      "body": {
        "code": "stats",
        "url": "https://example.com/reserved",
        "clicks": 0,
        "createdAt": "2026-10-02T03:19:14.923Z",
        "expiresAt": null,
        "expired": false,
        "shortUrl": "http://127.0.0.1:53135/stats"
      }
    },
    {
      "step": {
        "goto": "/stats"
      },
      "ok": true,
      "status": 200,
      "url": "/stats"
    },
    {
      "step": {
        "screenshot": "stats"
      },
      "ok": true,
      "file": "before-stats.png"
    },
    {
      "step": {
        "goto": "/"
      },
      "ok": true,
      "status": 200,
      "url": "/"
    },
    {
      "step": {
        "fill": "#url",
        "value": "https://example.com/reserved-api"
      },
      "ok": true
    },
    {
      "step": {
        "fill": "#code",
        "value": "api"
      },
      "ok": true
    },
    {
      "step": {
        "click": "button[type=submit]"
      },
      "ok": true
    },
    {
      "step": {
        "expectText": "reserved",
        "selector": "#message"
      },
      "ok": false,
      "actual": "Short link created."
    },
    {
      "step": {
        "screenshot": "home-api"
      },
      "ok": true,
      "file": "before-home-api.png"
    }
  ]
}
```

**after.json** (verbatim):
```
{
  "label": "after",
  "ref": "HEAD",
  "commit": "1d8c491b5351e68afa6015edfa333c21d8b382e6",
  "shortCommit": "1d8c491",
  "capturedAt": "2026-10-02T03:19:23.661Z",
  "passed": 10,
  "failed": 0,
  "steps": [
    {
      "step": {
        "request": {
          "method": "POST",
          "path": "/api/links",
          "body": {
            "url": "https://example.com/reserved",
            "code": "stats"
          }
        },
        "expectStatus": 400
      },
      "ok": true,
      "status": 400,
      "body": {
        "error": "The code \"stats\" is reserved for a page of hop. Choose another code."
      }
    },
    {
      "step": {
        "request": {
          "method": "GET",
          "path": "/api/links/stats"
        },
        "expectStatus": 404
      },
      "ok": true,
      "status": 404,
      "body": {
        "error": "Not found."
      }
    },
    {
      "step": {
        "goto": "/stats"
      },
      "ok": true,
      "status": 200,
      "url": "/stats"
    },
    {
      "step": {
        "screenshot": "stats"
      },
      "ok": true,
      "file": "after-stats.png"
    },
    {
      "step": {
        "goto": "/"
      },
      "ok": true,
      "status": 200,
      "url": "/"
    },
    {
      "step": {
        "fill": "#url",
        "value": "https://example.com/reserved-api"
      },
      "ok": true
    },
    {
      "step": {
        "fill": "#code",
        "value": "api"
      },
      "ok": true
    },
    {
      "step": {
        "click": "button[type=submit]"
      },
      "ok": true
    },
    {
      "step": {
        "expectText": "reserved",
        "selector": "#message"
      },
      "ok": true,
      "actual": "The code \"api\" is reserved for a page of hop. Choose another code."
    },
    {
      "step": {
        "screenshot": "home-api"
      },
      "ok": true,
      "file": "after-home-api.png"
    }
  ]
}
```

**What each screenshot shows (I opened all four PNGs):**
- `before-stats.png`: the "hop stats" page with LINKS 1 and CLICKS 0. The Top five table holds one row: code `stats`, destination https://example.com/reserved, 0 clicks. So the link exists, but /stats shows the page instead of redirecting. The bug is reproduced.
- `after-stats.png`: the same stats page with LINKS 0, CLICKS 0 and "No links yet." The `stats` link was refused.
- `before-home-api.png`: the home page with the green message "Short link created.", the short link `http://127.0.0.1:53135/api`, and 2 links listed (`/api` and `/stats`).
- `after-home-api.png`: the home page with `api` still in the code field and the red message `The code "api" is reserved for a page of hop. Choose another code.`, plus "0 links" and "No links yet. Shorten one above."

**Evidence PNGs in the repo** (on branch `fix/reserved-codes-g1`; `gh api` confirmed all four exist there):
- `evidence/reserved-codes/before-stats.png`
- `evidence/reserved-codes/after-stats.png`
- `evidence/reserved-codes/before-home-api.png`
- `evidence/reserved-codes/after-home-api.png`

Records and steps are beside them: `before.json`, `after.json`, `steps.json`.

**PR:** https://github.com/bendechrai/hop-demo/pull/3, titled "Refuse custom codes that a page of the app would shadow". It is open, head 6569c36. Body verbatim:
```
## What

A custom code that matches a path the app serves could be created, but its short URL was shadowed by that page and never redirected. The stats-page design recorded this gap. `createLink` now refuses, with 400 and a clear message:

- a reserved word: `api`, `stats`, and the name of every file in `public/` (`app`, `index`, `style`), ignoring case, because Express routes ignore case;
- any code ending in `+`, which is the preview address.

The list lives in one place, `src/actions/reserved-codes.ts`. A test fails if a file is added to `public/` without its name in the list. Links already stored with a reserved code are left alone (see design.md).

Change: `openspec/changes/reserved-codes` (group 1, tasks 1.1 to 1.4 ticked).

## Evidence

Same steps file (`evidence/reserved-codes/steps.json`) run by `bin/evidence.mjs` against each commit, app on `HOP_DB=:memory:`, real Chromium.

| Checked | Before | After |
|---|---|---|
| POST /api/links with code `stats` | `4104b00`: 201, link created | `1d8c491`: 400, "The code "stats" is reserved for a page of hop. Choose another code." |
| GET /api/links/stats | `4104b00`: 200, the link exists | `1d8c491`: 404, no link stored |
| GET /stats | `4104b00`: 200, stats page (the `stats` link is shadowed, no redirect) | `1d8c491`: 200, stats page, 0 links |
| Home form with code `api` | `4104b00`: "Short link created." | `1d8c491`: "The code "api" is reserved for a page of hop. Choose another code." |

Records: `evidence/reserved-codes/before.json` (7 ok, 3 failed: the failures are the bug) and `evidence/reserved-codes/after.json` (10 ok, 0 failed).

Before, /stats (`4104b00`): the stats page lists the code `stats`, which can never be reached by its short URL.

![before-stats](https://github.com/bendechrai/hop-demo/blob/fix/reserved-codes-g1/evidence/reserved-codes/before-stats.png?raw=true)

After, /stats (`1d8c491`): the stats page, and no `stats` link was stored.

![after-stats](https://github.com/bendechrai/hop-demo/blob/fix/reserved-codes-g1/evidence/reserved-codes/after-stats.png?raw=true)

Before, home form with `api` (`4104b00`): accepted, so `/api` and `/stats` links now both exist.

![before-home-api](https://github.com/bendechrai/hop-demo/blob/fix/reserved-codes-g1/evidence/reserved-codes/before-home-api.png?raw=true)

After, home form with `api` (`1d8c491`): refused with the reserved message, no link created.

![after-home-api](https://github.com/bendechrai/hop-demo/blob/fix/reserved-codes-g1/evidence/reserved-codes/after-home-api.png?raw=true)

## Checks

- `npm run verify`: exit 0 (64 tests, 0 failed)
- `E2E_PORT=4391 npm run e2e`: exit 0 (9 passed, including the new `e2e/reserved.spec.ts`)
- pre-push `bin/preflight.sh` on `6569c36`: PREFLIGHT PASSED (install, verify, build, audit, migrations, e2e)

No waivers.
```

## Commits
- **main:**
  - 0b371c0: evidence tool and skill, AGENTS.md line, eslint globals
  - 039ae2f: reserved-codes proposal
  - 4104b00: evidence worktree location fix
  - All three pushed through the gate.
- **fix/reserved-codes-g1** (on top of 4104b00):
  - 1d8c491: fix, tests, ticks 1.1 to 1.3. This is the commit the "after" record was captured against.
  - 6569c36: evidence folder, tick 1.4

## Commands and exit codes
- **Repro on main:** POST returned 201, GET /stats returned 200 with the stats page.
- **Part 1:**
  - `npx eslint bin/evidence.mjs`: 0
  - `node bin/evidence.mjs --help`: 0
  - Smoke run against HEAD: ran to completion and wrote its record. Its exit code was not captured.
  - Commit 0b371c0 (pre-commit verify ok): 0
  - `git push origin main` (preflight passed, e2e 8 passed): 0
- **Proposal:**
  - `openspec new change reserved-codes`: 0
  - `openspec validate reserved-codes --strict`: 0
  - Commit 039ae2f: 0
  - Push (preflight passed): 0
- **Board and worktree:**
  - `agentboard import-change reserved-codes --as orch`: 0 (ticket 01M3X9V1BMGCHCR823QDHMM5PK)
  - `agentboard claim`: 0
  - `git fetch`: 0
  - `gh pr list` returned no open PRs: 0
  - `git worktree add ../hop.worktrees/fix-reserved-codes-g1 -b fix/reserved-codes-g1 origin/main`: 0
  - `npm ci`: 0
  - `core.hooksPath` is `.githooks`
- **Tests first:** the first `npm run test` exited 1, failing as expected.
- **Implementation:**
  - `npm run verify`: 0 (64/64)
  - `E2E_PORT=4391 npm run e2e`: 0 (9 passed)
  - Commit: 0
- **Tool fix:** eslint 0, commit 4104b00 0, push (preflight passed) 0, `git rebase origin/main` 0.
- **Evidence:** `before` run exit 0 (7 ok, 3 failed), `after` run exit 0 (10 ok, 0 failed). Both temp worktrees were removed afterwards.
- **After the rebase:** `npm run verify` 0 (64/64), `E2E_PORT=4391 npm run e2e` 0 (9 passed), openspec apply state `all_done` with 4/4.
- **Ship:**
  - Commit 6569c36: 0
  - `git push -u origin fix/reserved-codes-g1` (preflight passed, e2e 9 passed): 0
  - `gh pr create`: 0
  - `agentboard link --pr 3`: 0
  - `agentboard handoff --to ben --status review`: 0

## Not verified or worth knowing
- No gate was waived. There is no unit test for the steps parser; the tool was checked by running it for real.
- **Two "before" commits:** "before" was captured on origin/main at 4104b00 rather than at the act-6 tag. Its app code is the same as act-6; only tooling and the proposal changed since. My manual repro ran on 5ab7f63.
- **Task 1.4 ticked early:** I ticked it before the PR existed. The PR that links the images was created straight afterwards.
- **What is not reserved:** links already stored with a reserved code are untouched (a non-goal in design.md). A future top-level router mount is not caught by a test; only `public/` drift is.
- **Board checklist:** the board's checklist still shows 1.1 to 1.4 unticked. That is by design: tasks.md is the record of completion.
- **Worktree left in place:** `../hop.worktrees/fix-reserved-codes-g1` stays until the merge.
- **Image links not checked as rendered:** the private repo stopped me checking the image URLs anonymously. The files are confirmed on the branch through `gh api`.