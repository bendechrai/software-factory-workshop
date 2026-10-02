DAY 1 WALKTHROUGH REPORT (acts 1-4 plus the Start pages)

Scratch folder: /private/tmp/claude-501/-Users-ben-Projects-software-factory-workshop/6bd3b073-6ab7-41c0-9ad8-75c1b35a8051/scratchpad/walkthrough-day1/. It holds software-factory-workshop/ (cloned from GitHub), hop/ (my app, tags act-1 to act-4) and remote.git.

Method: I ran every shell block as written. I played the harness for the prompts. No coding harness was started. Raw URLs were fetched from main.

Note on the local copy: the working tree has an untracked day-2/act-10-unattended.mdx. I did not read it.

---------------------------------------------------------------
START PAGES (index.mdx, what-a-factory-is.md, agenda.md)
---------------------------------------------------------------
1. [BLOCKER] index.mdx:35 and agenda.md:38 promise "The demo repository has a git tag per act so you can catch up at any point."
   - `curl -s -o /dev/null -w '%{http_code}' https://github.com/bendechrai/hop-demo` returns 404. `gh repo view` shows bendechrai/hop-demo is PRIVATE.
   - The same repo is the only catch-up path in act-1 line 155 (`git clone https://github.com/bendechrai/hop-demo.git hop`). That clone fails for every attendee, with a password prompt or "repository not found".
   - Fix: make hop-demo public with tags act-1 to act-10, or point at a public location (a tag or branch in software-factory-workshop, e.g. demo/hop). Also state in the guide which tag contains what.
2. [MINOR] The 10-act agenda tells a newcomer nothing about prerequisites for the catch-up tags. Say "git checkout act-N" once the repo is public.

Worked fine: what-a-factory-is.md is prose only, with no commands. Every internal link I checked points at a page that exists (GitHub Pages returned 200 for act-1).

---------------------------------------------------------------
BEFORE YOU ARRIVE (before-you-arrive.mdx)
---------------------------------------------------------------
3. [BLOCKER] Step 6 (OpenSpec and agentboard): `npx -y @bendechrai/agentboard@latest version`
   - Output: `npm error code E404 ... GET https://registry.npmjs.org/@bendechrai%2fagentboard - Not found`. `npm view @bendechrai/agentboard` also gives E404.
   - The fallback in the note ("clone https://github.com/bendechrai/agentboard, run npm ci && npm run build && npm link") also fails: that repo is PRIVATE (anonymous GET returns 404).
   - On a clean machine, bin/check-setup.sh therefore prints "MISSING agentboard: see the note on the Before you arrive page" and exits 1, so "If every line says ok" can never be met.
   - Fix: publish the package to npm, or make the repo public. Then re-run the page on a machine with no /opt/homebrew/bin/agentboard.
   - Note: this is a Day 2 dependency, but the page and check script gate everything on it.
4. [MAJOR] My own check-setup.sh printed "ok agentboard 0.0.1" and "All good" only because a global agentboard was already linked at /opt/homebrew/bin/agentboard. The script hides defect 3 for the author. Test it on a clean machine or container.
5. [MAJOR] The page (step 6, "nothing to install", "no global install") says OpenSpec is run with npx only. The skills `openspec init` writes call a bare `openspec` command. `.agents/skills/openspec-propose/SKILL.md` has `allowed-tools: Bash(openspec:*)` and runs `openspec context --json`, `openspec new change`, `openspec status`, and so on.
   - `which openspec` returns "not found". A newcomer's /opsx:propose will hit "command not found", or an npx fallback that the allowed-tools list does not permit.
   - I only got through act 4 by putting an `openspec` wrapper script around npx on PATH.
   - Fix: add `npm install -g @fission-ai/openspec@latest` to before-you-arrive (and to check-setup.sh), and say in act 4 step 1 that the skills need it on PATH. Or add a dev dependency and `npm run`/PATH shim.
6. [MINOR] The tabs for Claude Code, Codex, Gemini and Cursor install commands were not run, except that https://claude.ai/install.sh and https://cursor.com/install both return 200. `claude --version` is 2.1.287, which is at least 2.1.277, so that is fine.
7. [MINOR] The Chromium step. The `npx -y playwright@latest install chromium` command was not re-run (already cached). check-setup.sh detected the cache correctly.
8. [MINOR] The page says "Clone the workshop repository" but never says where. Act 1 later assumes the clone is a sibling of hop (`../software-factory-workshop`). See defect 12.

Sandbox step (Claude Code tab), read-only checks only:
- `CLAUDE_CONFIG_DIR=$HOME/.claude-workshop claude auth status` printed `"loggedIn": false` (expected, I did not log in) and `"configDirectory": "/Users/ben/.claude-workshop"`. This matches the page.
- The alias line `alias claude-workshop='CLAUDE_CONFIG_DIR=~/.claude-workshop claude'` is valid zsh. The `~` expands correctly in both zsh and bash (`configDirectory` was correct in both).
- Not tested: `claude-workshop auth login`.

check-setup.sh: runs, and exits with the number of missing tools. Every line was ok on my machine, apart from the masking noted in defect 4.

---------------------------------------------------------------
ACT 1 (day-1/act-1-the-sandbox-and-the-vibe.mdx)
---------------------------------------------------------------
9. [MAJOR] Step 2 runs `node ../software-factory-workshop/tools/ledger/ledger.mjs` from hop.
   - It only works if the workshop clone is a sibling of hop. Before-you-arrive never says where to clone, and `mkdir hop` in step 1 is relative to wherever you are.
   - If you cloned inside the workshop folder (the natural result of `cd software-factory-workshop` after cloning), `mkdir hop` creates hop inside the repo, and `../software-factory-workshop` does not exist.
   - Fix: give a full recipe on the before-you-arrive page, e.g. `mkdir ~/workshop && cd ~/workshop && git clone ...`, and in act 1 say "hop sits next to software-factory-workshop". The ledger ran fine when laid out that way: it prints zeros on an empty hop, for both the plain and the CLAUDE_CONFIG_DIR forms.
10. [MINOR] Step 6 (screenshot): `npx playwright screenshot ...` has no `-y`. It worked here because Playwright was cached. Add `-y` or `npx -y playwright@latest`, and add "start the app first".
11. [MINOR] Step 1 puts the ledger terminal after the harness start but the page says "Open a second terminal in your hop folder". Say "cd into it" for clarity.
12. [MINOR] The screenshot is created after `git commit` and `git tag act-1` (steps 5 and 6). screenshot.png stays untracked, and act 2's first `git add -A` commits it. Reorder the steps, or add it to .gitignore.
13. [MINOR] The vibe app creates a database file (`hop.db`), but the page never tells people to commit or ignore it. The vibe prompt gives agents no .gitignore guidance, so some attendees will commit their DB and node_modules. Add "check git status before committing", or have act 2's first prompt handle .gitignore.
14. [MINOR] The `/skills` and `/mcp` emptiness check, and the Codex, Gemini and Cursor equivalents, were not runnable (no harness).
15. [MINOR] The act-1 "What you see" table shows image links like `../../../assets/act-1/run-1.png`. The files exist (src/assets/act-1/run-1.png, run-2.png and run-3.png).

Gap act 1 to act 2: act 2 expects a git repo with a committed vibe app. I had one. It also expects a `package.json`, which the vibe app may not have (run 1 in the demo had none beyond a minimal one). Nothing in act 1 requires the app to be a Node project, but act 2's prompt assumes Node and `npm`.

Worked well: the git commands (`git init -b main`, commit, tag) all worked.

---------------------------------------------------------------
ACT 2 (day-1/act-2-guardrails.mdx)
---------------------------------------------------------------
16. [MAJOR] Step 1 begins with `cd hop`, but the reader is already inside hop from act 1.
   - Output: `cd: no such file or directory: hop`. The chain keeps going (the commands are on separate lines), so it is recoverable, but the first line of a literal copy-paste errors.
   - Fix: delete `cd hop` (or write "if you are not already in hop"). Acts 3 and 4 have the same line (see defects 21 and 31).
17. [OK] The curl commands for templates/act-2/AGENTS.md and templates/act-2/.agents/skills/code-structure/SKILL.md both return 200. The Claude Code tab command `mkdir -p .claude && ln -s ../.agents/skills .claude/skills` works, and the symlink resolves.
18. [MINOR] The Gemini tab uses `printf` to write settings.json, while templates/act-2/.gemini/settings.json exists. Offering a curl for the template would match the other steps.
19. [MINOR] `npm run migrate` and `npm run verify` and `npm run dev` are named by AGENTS.md. The act 2 prompt tells the agent to create `verify` and `migrate`, but not `dev`, and not an `npm run build` that the act 3 preflight tries (it uses `--if-present`, so that is safe).
20. [MINOR] The first prompt asks for TypeScript with Node type stripping, but nothing says so. It worked here because I knew (Node 24+ strips types; the page mentions it in before-you-arrive only). It is not stated in the AGENTS.md template conventions: "The language is TypeScript." An agent may add a build step. Say "no build step, run .ts directly with node".

Gap act 2 to act 3 (important, see defects 22-26): act 3's browser test (e2e/hop.spec.ts) and Playwright config assume the exact file layout and HTML of the demo app. Act 2 never tells the agent about them.

Worked well: AGENTS.md and SKILL.md are readable and short. Their content matches the prose on the page. After my restructure, `npm run verify` exited 0 and `npm run migrate` printed "applied 1". A second run printed "applied 0", which is what preflight greps for.

---------------------------------------------------------------
ACT 3 (day-1/act-3-gates.mdx)
---------------------------------------------------------------
21. [MAJOR] Step 1 again starts with `cd hop` ("no such file or directory: hop").
22. [BLOCKER] Step 1: files downloaded with curl are not executable, and the script that is meant to make them executable cannot run.
   - Output: `bin/setup-git-hooks.sh` gives `permission denied: bin/setup-git-hooks.sh`. ls shows `-rw-r--r--` on all of bin/*.sh, .githooks/* and .agents/hooks/block-no-verify.sh.
   - Result: core.hooksPath is not set and the hooks are not installed. A newcomer sees an error and must guess.
   - Workaround that worked: `bash bin/setup-git-hooks.sh`.
   - Fix: change the page to `bash bin/setup-git-hooks.sh`, or add `chmod +x bin/*.sh .githooks/* .agents/hooks/*.sh` before it.
23. [BLOCKER-class, silent] Even after `bash bin/setup-git-hooks.sh`, `.agents/hooks/block-no-verify.sh` stays non-executable. setup-git-hooks.sh only chmods `.githooks/*` and `bin/*.sh`.
   - Piping a sample PreToolUse JSON into it gave `permission denied` and exit 126. After `chmod +x` it printed "Blocked: this command would skip the git hooks" and exited 2.
   - Claude Code treats exit 126 as a non-blocking error, so `git commit --no-verify` would go through. Step 5 ("It should report that the command was blocked") would fail without any clear explanation.
   - Fix: add `.agents/hooks/*.sh` to the chmod line in setup-git-hooks.sh (template) and in the manual instructions. Alternatively make the settings.json command `bash "$CLAUDE_PROJECT_DIR"/.agents/hooks/block-no-verify.sh`.
24. [BLOCKER] Step 3 and the Aside "What you should see": after the commit, `bin/preflight.sh HEAD` passes. It does not, unless the attendee's app happens to match the demo's. The template e2e/hop.spec.ts and playwright.config.ts are coupled to the demo app:
   - the label text "Long URL" and "Custom code (optional)", a "Shorten" button, `#message` with the exact text "Short link created.", `#rows tr`, `td.dest`, `td.num`;
   - a Delete button named `Delete <code>`, and `DELETE /api/links/<code>` returning 404. The second test therefore covers the delete feature, which step 6 only adds later;
   - an entry point `node src/server.ts` that reads `HOP_DB` and `PORT`, and applies migrations itself on a `:memory:` database. The config sets `HOP_DB=":memory:"` and never runs `npm run migrate`.
   - My app was built from the act 2 prompts, and the e2e run failed: `Error: getByLabel("Long URL") ...` timed out, and the second test gave `ERR_CONNECTION_REFUSED at http://127.0.0.1:4390/` (the server crashed on the first request because the in-memory DB had no tables).
   - Output: `PREFLIGHT FAILED at gate e2e. Commit 6542884 is not safe to push.`, `e2e FAIL 33s`.
   - A newcomer's first push (act 3) or `git push` later will be refused by pre-push with no clear way to fix it other than rewriting their app to the test.
   - To get green I had to change my HTML (labels, ids, classes, aria-label), add DELETE, and make server.ts run the migration on startup. After that, `bin/preflight.sh HEAD` passed (timing: install 1s, verify 2s, build 0s, audit 0s, migrations 1s, e2e 2s).
   - Fix, one of: (a) put the selectors and the server contract in the act 2 prompts (labels, ids, `src/server.ts`, `HOP_DB`, `PORT`, migrations on startup); (b) have the step 3 prompt say "rewrite e2e/hop.spec.ts to match the app" and drop the delete test from the template until step 6; (c) ship the act 2 demo app as a starting point.
   - At minimum, remove the delete test from the template at step 3, and say the e2e test "may need adapting".
25. [MAJOR] Step 3 Aside says preflight fails first with `Missing script: "e2e"`. Confirmed: output `npm error Missing script: "e2e"`, then `PREFLIGHT FAILED at gate e2e. Commit c15ec53 is not safe to push.`, with install, verify, build, audit and migrations all ok.
   - The step 3 prompt then says "Then commit". My commit went through (pre-commit ran gitleaks and verify, both ok). OK as written.
26. [MINOR] Step 3: the prompt asks for `playwright.config.ts` and `e2e/` to be left alone, but ESLint and tsc may complain about them (they sit outside `src`). It passed in my app because I excluded them in eslint.config.js and tsconfig include. Mention this, or ship an eslint ignore.
27. [MINOR] In step 2, the Claude Code tab uses `$base` set in step 1. It is lost if the reader opens a new terminal (the page says "Restart your harness"). Re-declare `base=...` in the tab.
28. [MINOR] The `AGENTS-additions.md` append (`sed '1d'`) works and leaves a heading `## What never happens (additions)` after `## What never happens`. Fine, a bit awkward.
29. Step 4 (secret test): [OK] Exact output: `WRN leaks found: 1` then `pre-commit: FAIL - gitleaks found something that looks like a secret in the staged changes`, and the commit exit code was 1. It matches the page. The cleanup `git rm --cached notes.txt && rm notes.txt` works. The AWS example key `AKIAIOSFODNN7EXAMPLE` was not flagged (exit 0), as the page's Aside says.
30. Step 5 (harness hook): [OK once chmod'd] Behaviour matches the page after `chmod +x` (see defect 23). I could not run Claude Code, so I simulated the hook with its JSON input.
    Step 6: [OK] `bin/preflight.sh HEAD` after the delete commit prints `PREFLIGHT PASSED` and the timing table. `git tag act-3` works. I also created a bare remote and ran `git push origin main`: the pre-push hook ran preflight, printed "pre-push: all gates passed.", and the push succeeded.
    The page never says a remote is needed for pre-push, which is fine (no push is required in day 1).

Worked well: pre-commit hook output and behaviour, preflight gates, timing table format, gitleaks behaviour, and the failure message wording.

---------------------------------------------------------------
ACT 4 (day-1/act-4-specifications.mdx)
---------------------------------------------------------------
31. [MAJOR] Step 1 starts with `cd hop` (same failure as defects 16 and 21).
32. [OK] `npx -y @fission-ai/openspec@latest init --tools claude --no-animation` runs (OpenSpec 1.14.0): "6 skills and 6 commands in .claude/". It created `openspec/config.yaml`, `openspec/specs/.gitkeep` and `openspec/changes/archive/.gitkeep`, as the page says. The existing `.claude/skills` symlink was preserved, and the skills landed in `.agents/skills/` (openspec-apply-change, openspec-archive-change, openspec-explore, openspec-propose, openspec-sync-specs, openspec-update-change). `.claude/commands/opsx/` has apply, archive, explore, propose, sync, update. This matches the page's Symlinks note.
33. [MAJOR] The Codex tab says to call `$openspec-propose`, `$openspec-apply` and `$openspec-archive`. The skill folders are named `openspec-propose`, `openspec-apply-change` and `openspec-archive-change`. Only propose matches. Verify the Codex invocation names, and fix apply and archive (`$openspec-apply-change`, `$openspec-archive-change`) unless Codex resolves by prefix. I could not test Codex.
34. [MAJOR] Step 2 says "Open openspec/config.yaml and fill in context:", but the config generated by init has only commented examples. The page shows the demo config via `?raw`, with no download command. Every other act gives a curl. Attendees must retype it by hand, or paste from the page.
   - templates/act-4/openspec/config.yaml exists. Add `curl -fsSL .../templates/act-4/openspec/config.yaml -o openspec/config.yaml` (after init), or say "copy the block above".
   - Related: that config bakes in demo-specific context (three layers, migrations, DEFINITION_OF_DONE.md). That is fine for a hop built through acts 2 and 3, but say "adapt it".
35. [MAJOR] The skills require a bare `openspec` command (see defect 5). `which openspec` fails after following the page. In the propose, apply and archive flows, the harness cannot run `openspec new change` and so on.
36. [OK] Playing the harness: I created a change with `openspec new change link-expiry`, and filled in proposal.md, specs/link-expiry/spec.md, design.md and tasks.md from the templates. `openspec status --change link-expiry` printed `[x] proposal [x] specs [x] design [x] tasks / All planning artifacts complete!`. `openspec validate link-expiry` printed `Change 'link-expiry' is valid`, as the page says (command and output correct).
37. [OK] `openspec archive link-expiry -y` folded the delta into `openspec/specs/link-expiry/spec.md`. The title became `# link-expiry Specification` and the section became `## Requirements`. The change moved to `openspec/changes/archive/2026-10-01-link-expiry/`. This matches step 8.
   - The archive folder name uses the current date (2026-10-01 today), but the page presents it as a fixed name. Say "dated".
38. [MINOR] Step 9: `bin/preflight.sh HEAD` runs on HEAD, so it only checks the apply and archive work if those were committed first. The page says nothing about committing the archive. Add `git add -A && git commit` before the preflight line. (I committed, and preflight passed: `PREFLIGHT PASSED - 03d8ad5`, e2e ok 2s.)
39. [MINOR] The e2e and unit counts in "What you see" (31 unit tests, 4 browser scenarios) are demo-specific. Fine, but flag "your numbers will differ".
40. [MINOR] The page imports `example-proposal.md` into nothing; only config, spec-delta and tasks are shown. proposal.md and design.md live only in the templates folder (linked). Fine.
41. Step 3 (proposal), step 6 (apply) and step 7 (deviation watch): not runnable without the harness. I simulated them by copying the templates, so I did not test whether a real model follows the instructions.

Gap act 4 to act 5: act 5 line 97 expects `openspec/config.yaml` to exist (it does) and line 104 expects `git status --short` to show `.gitignore`, `AGENTS.md`, `openspec/config.yaml` and the skill folder. That requires a clean tree after act 4, so the "commit the archive" step in defect 38 matters. Act 5 also assumes the global `agentboard` command (defect 3).

---------------------------------------------------------------
SUMMARY OF BLOCKERS, in the order a newcomer would hit them
---------------------------------------------------------------
1. agentboard cannot be installed: it is not on npm and the repo is private (before-you-arrive; check-setup.sh fails).
2. hop-demo is private, so the catch-up clone and tags fail (act 1 line 155; index.mdx; agenda.md).
3. Act 3 step 1: `bin/setup-git-hooks.sh` gives permission denied (curl'd files are not executable).
4. Act 3: `block-no-verify.sh` is never made executable, so the harness hook silently does nothing.
5. Act 3: the e2e template is tied to the demo app's HTML, server entry point and delete feature, so `bin/preflight.sh HEAD` and `git push` fail on a newcomer's own app. The Aside promises a pass.

Highest-value MAJORs: bare `openspec` is not on PATH (defects 5 and 35); `cd hop` fails in acts 2, 3 and 4 (defects 16, 21 and 31); the ledger path needs a sibling clone (defect 9); the act 4 config.yaml has no download command (defect 34); the Codex skill names are wrong (defect 33).

Things that worked well enough to leave alone: all raw template URLs for acts 2, 3 and 4 return 200, as do bin/check-setup.sh and tools/ledger/ledger.mjs; the ledger runs; the git sequence (init, commit, tag); the pre-commit gitleaks block message; the preflight timing table; the AWS example-key Aside; `openspec init`, `validate` and `archive` output matching the page; the symlink approach for `.claude/skills`; the sandbox `auth status` check.