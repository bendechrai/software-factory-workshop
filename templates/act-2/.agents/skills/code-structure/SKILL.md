---
name: code-structure
description: How code is laid out in this repository. Use whenever you write or change application code, so the result reads the same no matter which agent or model wrote it.
---

# Code structure

Code written by many agents has to read as if one careful person wrote it. These rules make that true.

## Three layers

| Layer | Folder | Owns | Never does |
|---|---|---|---|
| **Routes** | `src/routes/` | Parsing a request, calling one action, shaping the response | Business rules, database calls |
| **Actions** | `src/actions/` | The business rules: what is allowed, in what order, what counts as an error the user sees | Talking to a database, a file or the network directly |
| **Services** | `src/services/` | The mechanics: database queries, file access, external calls, code generation | Deciding whether something is allowed |

A request flows down: route, then action, then service. Nothing flows sideways. A route never calls a service. A service never calls an action.

## Rules

- **One job per file.** A file is named for the one thing it does: `create-link.ts`, not `utils.ts` or `helpers.ts`.
- **Explicit inputs.** A service function takes everything it needs as parameters and returns a plain result. It does not read global state.
- **Extract on the second use.** When the same logic appears in two places, move it into a service. Do not extract on the first use.
- **Errors are values at the boundary.** Actions return a result that says what went wrong in words the user can read. Routes turn that into a status code. Services throw only on things that should never happen.
- **No dead code.** If it is not called, delete it. Version control remembers it.
- **Tests sit beside the layer they test.** `src/actions/create-link.test.ts` tests the action with a fake service. `src/services/links.test.ts` tests the service against a real, throwaway database.

## When you touch existing code that does not follow this

Bring the part you touch into line, and nothing else. A task to add a feature is not a task to restructure the repository. If the whole file needs restructuring to add the feature, say so in your summary and do the smallest restructuring that lets the feature in.
