# Act 10 run command (Codex through OpenRouter)

Paste this into your own terminal. The sandbox is off for this run, so Codex acts with your full permissions while it runs unattended.

```bash
cd /Users/ben/Projects/software-factory-workshop/demo/hop

# One-time setup: a separate Codex home with the loop's config and the real trust path
mkdir -p ~/.codex-loop
cp .agents/loop/codex-config.example.toml ~/.codex-loop/config.toml
sed -i '' 's|<absolute repo path>|/Users/ben/Projects/software-factory-workshop/demo/hop|' ~/.codex-loop/config.toml
grep -n 'projects\.' ~/.codex-loop/config.toml

# Allow the loop to start
rm -f .agents/loop/STOP

# Dry run with the real settings (calls no harness)
OPENROUTER_API_KEY="$(sed -n 's/^OPENROUTER_API_KEY=//p' /Users/ben/Projects/aviation/.env | head -n 1 | tr -d "\"'")" \
CODEX_HOME=~/.codex-loop \
HARNESS_CMD="npx -y @openai/codex exec --json -C /Users/ben/Projects/software-factory-workshop/demo/hop" \
MAX_ITERATIONS=3 MAX_MINUTES=150 SLEEP_SECONDS=30 MAX_FAILURES=2 \
bin/factory-loop.sh --dry-run

# The real loop (key is set for this command only)
OPENROUTER_API_KEY="$(sed -n 's/^OPENROUTER_API_KEY=//p' /Users/ben/Projects/aviation/.env | head -n 1 | tr -d "\"'")" \
CODEX_HOME=~/.codex-loop \
HARNESS_CMD="npx -y @openai/codex exec --json -C /Users/ben/Projects/software-factory-workshop/demo/hop" \
MAX_ITERATIONS=3 MAX_MINUTES=150 SLEEP_SECONDS=30 MAX_FAILURES=2 \
bin/factory-loop.sh
```

Stop it (from the repo, in another terminal): the loop ends after the current iteration.

```bash
touch .agents/loop/STOP
```

Watch it:

```bash
tail -f .agents/loop/loop.log
agentboard serve
```
