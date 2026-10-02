---
name: review-loop
description: Gets every pull request reviewed by a model that did not write it, and turns each review into fixes or a rubric lesson. Use after opening a PR, when a review comes back, and when anyone finds a problem the review missed.
---

# review-loop

A PR is reviewed by a reviewer on a different model from the one that wrote
it, with only the diff, the spec and `.agents/review/rubric.md`. See
`.agents/review/README.md` for how to start it in each harness.

## For the implementer

1. After `gh pr create`, ask for a review: start the `reviewer` agent with
   the PR number and change name, on a model other than yours.
2. Read the first line of the review on the PR.
3. **On `VERDICT: CHANGES`:**
   - `agentboard move <id> implementing --as <you>`
   - Fix each BLOCKING finding. NITs are optional; say which you took.
   - Re-run `npm run verify` and `npm run e2e`. If behaviour changed,
     capture the evidence again (the `evidence` skill) and update the PR body.
   - Commit, push (the pre-push gate runs), then
     `agentboard move <id> review --as <you>` and ask for a re-review.
4. **At most 3 rounds.** If round 3 still says CHANGES, stop:
   `agentboard comment <id> "3 review rounds, still CHANGES: <open findings>. Needs a human." --as <you>`
   then `agentboard move <id> blocked --as <you>`.
5. **On `VERDICT: PASS`:** hand to the human for merge:
   `agentboard handoff <id> --to <human> --status review --note "PR #<n> passed review round <k>, ready to merge" --as <you>`

Never argue a finding away in the PR without a change or a reason a human
can check. Never merge your own PR.

## For whoever finds a miss

When a reviewer, a human or production finds something the review should
have caught, add one line to the `## Lessons` section of
`.agents/review/rubric.md` in the same PR that fixes it. One line: what was
missed, and what the reviewer should ask next time.
