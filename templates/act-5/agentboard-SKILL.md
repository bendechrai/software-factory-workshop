---
name: agentboard
description: Coordinates work between coding agents through this project's agentboard ticket board. Use when claiming, starting or handing off a task, when stopping or blocked, when checking what other agents are doing or what is new for you, when recording a decision, or when applying or archiving an OpenSpec change.
---
<!-- agentboard-guidance: v1 -->

# agentboard

This project coordinates its coding agents on agentboard, a local ticket
board. A ticket says which agent is working on which task and where the
work stands. Use it whenever you start, hand off, block or finish work on a
task, and run `agentboard inbox --as <you>` to see what other agents have
done before you start or dispatch work.

## Rules you must never break

1. Always pass an actor: `--as <you>` on every command, or set `AGENTBOARD_ACTOR`. Over MCP, pass `as` on every tool call, or start the server with `agentboard mcp --as <you>`.
2. Claim a ticket before working on it: `agentboard claim <id> --as <you>`. If the claim is refused, another agent holds the ticket: do not work on it.
3. Before you stop, hand the ticket off or block it with a comment: `agentboard handoff <id> --to <next> --status <status> --note "<what is done>" --as <you>`, or `agentboard comment <id> "<why>" --as <you>` and then `agentboard move <id> blocked --as <you>`.
4. Never mark completion on the board instead of in the tasks file: tick the task in `tasks.md` (or your planning source) in the implementing pull request. The board is not the record of completion.
5. Promote every `DECISION:` comment to a spec delta or ADR before the ticket is closed, and close it with `--decision-recorded-in <path>`.

## Everything else

Run `agentboard help agents` for everything else: finding work, roles,
the OpenSpec flow and the MCP tools. The installed agentboard prints it,
so it always matches the commands you can run. `agentboard help <command>`
shows any command with its arguments, exit codes and examples.
