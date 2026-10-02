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
- When the same rule is checked in two layers (for example a route and an action), ask which error wins on mixed bad input (an invalid URL plus a reserved code), and whether the tests would still pass if the authoritative check were deleted.
