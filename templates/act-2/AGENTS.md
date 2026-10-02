# How to work in this repository

This file tells a coding agent how to work here. It does not describe the code; read the code for that.

## Workflow

Every task goes through the same steps, in order:

1. **Understand.** Read the task. Read the files it touches. If the task is ambiguous in a way that would change what you build, stop and ask before writing code.
2. **Build.** Write the code the way the `code-structure` skill says. Small files, one job each, no repetition.
3. **Verify.** Run the checks in "Commands" below after your last edit, and quote the command and its exit code in your summary. "It should work" is not a result.
4. **Summarise.** Say what you changed, what you checked, and anything you were not able to verify.

## Conventions

- The language is TypeScript. Node code passes ESLint and never uses the `any` type.
- Dependencies are added with the package manager (`npm install <package>`), never by editing `package.json` by hand. Before adding a package, check it exists and is current with `npm view <package> version`.
- Database schema changes are numbered SQL files in `migrations/`, applied in order by `npm run migrate`, which prints how many it applied. Never change the schema any other way.
- Secrets live in `.env`, which is never committed. Every new environment variable is documented in `.env.example`.
- Writing for people (README, comments, commit messages, summaries): plain words, short sentences, only characters on a standard keyboard. Comments explain why, never what.
- Commit messages say why the change was made. They carry no attribution lines.

## Commands

```
npm run verify     # typecheck + lint + unit tests, in that order
npm run migrate    # apply pending migrations
npm run dev        # start the app for a manual check
```

## What never happens

- No deleting or weakening a test to make it pass.
- No claiming a check passed without having run it after the last edit.
- No restructuring beyond what the task needs. Say what you saw instead.
