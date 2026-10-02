#!/usr/bin/env bash
# Checks that everything the workshop needs is installed. Prints one line
# per tool. Exit code is the number of missing tools.
set -u

missing=0
ok()   { printf '  ok       %-14s %s\n' "$1" "$2"; }
miss() { printf '  MISSING  %-14s %s\n' "$1" "$2"; missing=$((missing + 1)); }

echo "Workshop setup check"

if command -v node >/dev/null 2>&1; then
  v="$(node --version)"; major="${v#v}"; major="${major%%.*}"
  if [ "$major" -ge 24 ]; then ok node "$v"; else miss node "$v is too old; need 24 or later"; fi
else miss node "install from https://nodejs.org"; fi

for t in git gh gitleaks; do
  if command -v "$t" >/dev/null 2>&1; then ok "$t" "$("$t" --version 2>/dev/null | head -1)"; else miss "$t" "not on PATH"; fi
done

if command -v gh >/dev/null 2>&1; then
  if gh auth status >/dev/null 2>&1; then ok "gh auth" "signed in"; else miss "gh auth" "run: gh auth login"; fi
fi

harness=0
for h in claude codex gemini agent; do
  if command -v "$h" >/dev/null 2>&1; then ok "harness" "$h $("$h" --version 2>/dev/null | head -1)"; harness=1; fi
done
[ "$harness" = 1 ] || miss "harness" "none of claude, codex, gemini, agent found"

if ls "${HOME}/Library/Caches/ms-playwright" "${HOME}/.cache/ms-playwright" 2>/dev/null | grep -q chromium; then
  ok playwright "chromium is installed"
else miss playwright "run: npx -y playwright@latest install chromium"; fi

if command -v openspec >/dev/null 2>&1; then ok openspec "$(openspec --version 2>/dev/null | head -1)"; else miss openspec "run: npm install -g @fission-ai/openspec@latest"; fi

if command -v agentboard >/dev/null 2>&1; then ok agentboard "$(agentboard version 2>/dev/null | head -1)"
elif npx -y @bendechrai/agentboard@latest version >/dev/null 2>&1; then ok agentboard "npx @bendechrai/agentboard"
else miss agentboard "run: npm install -g @bendechrai/agentboard"; fi

echo
if [ "$missing" = 0 ]; then echo "All good."; else echo "$missing thing(s) to fix."; fi
exit "$missing"
