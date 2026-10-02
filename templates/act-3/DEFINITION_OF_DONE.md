# Definition of done

A task is done when the change is proven safe to merge under the gates below. "It compiles" and "I saved the file" are not done.

Read this file at the start of every task. If a gate does not apply (a documentation-only change does not need the browser test), say so in your summary with the word "Waived" and the reason. Never skip a gate silently.

## Gates

### 1. The code is clean
- `npm run typecheck` reports no errors.
- `npm run lint` reports no errors and no warnings. A warning that was already there gets fixed in the change that trips over it.
- No new `any`, `@ts-ignore` or `eslint-disable` without a one-line comment saying why.

### 2. The tests pass
- `npm run test` reports no failures.
- A failure that was already there is not a waiver. Fix it, or open a ticket for it and name the ticket in your summary.
- New behaviour has at least one test that would fail without the change.

### 3. The app still works in a browser
For any change to a page, a route or a stylesheet:
- `npm run e2e` passes. It starts the app, drives it with a real browser, and stops it.

### 4. No secrets, no known vulnerabilities
- `gitleaks` finds nothing in the staged changes.
- `npm audit --audit-level=high` is clean.
- Every new environment variable is in `.env.example`.

### 5. Schema changes are migrations
- A schema change is a new file in `migrations/`, applied in order, and never edits an old one.
- The migrations apply cleanly to an empty database, and applying them twice changes nothing.

### 6. The record is updated
- `README.md` or `AGENTS.md` changes if the change alters how someone runs or works on the app.
- The commit message says why. It carries no attribution.

## Who enforces what

| Gate | Enforced by |
|---|---|
| 1, 2, 4 (secrets) | `.githooks/pre-commit`, on every commit, in seconds |
| 1 to 5, on the exact commit being pushed | `.githooks/pre-push`, which runs `bin/preflight.sh` |
| 6 | You, and the reviewer |

Install the hooks once per clone with `bin/setup-git-hooks.sh`.

## Waivers

A waived gate is written in the summary and in the pull request as:

    Waived: <gate> - <reason>

The pre-push hook can waive the browser test for one push with `PUSH_SKIP_E2E=1`. It prints a loud warning when it does. A quiet waiver is the one thing this file forbids.
