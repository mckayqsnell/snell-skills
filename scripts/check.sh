#!/usr/bin/env bash
# check.sh: the repo's validation suite. CI runs it on every pull request;
# run it locally with `pnpm run check` before you push.
#
# Checks:
#   1. plugin.json carries the same version as package.json
#   2. `claude plugin validate --strict` passes (plugin + marketplace)
#   3. `npx skills add . --list` finds every skills/<group>/<name>/SKILL.md,
#      and plugin.json's "skills" list names every group folder
#   4. shellcheck passes on every tracked .sh file
#   5. no personal paths, emails or secrets are tracked
#   6. the kit sync script's tests pass
#   7. every skill's kit/ matches what kit-src/ builds (scripts/sync-kit.mjs --check)
#   8. the html skills and the kit docs read at plain-language level 80 or better
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
cd "$ROOT"

BIN="$ROOT/node_modules/.bin"
for tool in claude skills; do
  [ -x "$BIN/$tool" ] || { echo "❌ $BIN/$tool is missing. Run: pnpm install" >&2; exit 1; }
done
command -v shellcheck >/dev/null || { echo "❌ shellcheck is not installed (macOS: brew install shellcheck)" >&2; exit 1; }
command -v git >/dev/null || { echo "❌ git is not installed" >&2; exit 1; }

step() { printf '\n▶ %s\n' "$*"; }

step "1/8 Version sync"
node scripts/sync-version.mjs --check

step "2/8 claude plugin validate --strict"
"$BIN/claude" plugin validate --strict .

step "3/8 npx skills finds every skill"
# Run in a scratch HOME so the CLI can't read or write your real agent folders.
SCRATCH="$(mktemp -d)"
trap 'rm -rf -- "$SCRATCH"' EXIT
LIST_OUT="$SCRATCH/list.txt"
if ! (cd "$SCRATCH" && HOME="$SCRATCH" DISABLE_TELEMETRY=1 "$BIN/skills" add "$ROOT" --list >"$LIST_OUT" 2>&1); then
  cat "$LIST_OUT" >&2
  echo "❌ skills add --list failed" >&2
  exit 1
fi
# Strip terminal color codes before matching.
sed -e $'s/\x1b\\[[0-9;?]*[a-zA-Z]//g' "$LIST_OUT" > "$SCRATCH/list.clean"
expected=0
missing=0
while IFS= read -r skill_md; do
  expected=$((expected + 1))
  # Read name: only from the frontmatter (between the first two --- lines).
  name="$(awk 'NR == 1 && $0 != "---" { exit } NR > 1 && $0 == "---" { exit }
    NR > 1 && /^name:[[:space:]]*/ { sub(/^name:[[:space:]]*/, ""); print; exit }' "$skill_md")"
  [ -n "$name" ] || { echo "❌ $skill_md has no name: line in its frontmatter" >&2; missing=$((missing + 1)); continue; }
  folder="$(basename "$(dirname "$skill_md")")"
  [ "$name" = "$folder" ] || { echo "❌ $skill_md: name '$name' does not match its folder '$folder'" >&2; missing=$((missing + 1)); }
  # Exact, literal match on a listing line ("│    <name>"), no regex.
  if awk -v want="$name" '{ line = $0; gsub(/^[│[:space:]]+|[[:space:]]+$/, "", line) } line == want { found = 1 } END { exit !found }' "$SCRATCH/list.clean"; then
    echo "  found $name"
  else
    echo "❌ skills CLI did not list $name ($skill_md)" >&2
    missing=$((missing + 1))
  fi
done < <(git ls-files 'skills/*/*/SKILL.md')
[ "$expected" -gt 0 ] || { echo "❌ No skills/<group>/<name>/SKILL.md files are tracked" >&2; exit 1; }
[ "$missing" -eq 0 ] || { cat "$SCRATCH/list.clean" >&2; exit 1; }
echo "✅ all $expected skills listed"

# The Claude Code plugin only scans the group folders plugin.json lists.
plugin_groups="$(node -e '
  const s = require("./.claude-plugin/plugin.json").skills ?? [];
  for (const p of [].concat(s)) console.log(p.replace(/^\.\//, "").replace(/\/$/, ""));
')"
while IFS= read -r group; do
  if ! printf '%s\n' "$plugin_groups" | grep -Fxq -- "$group"; then
    echo "❌ $group/ holds skills but is not in the \"skills\" list in .claude-plugin/plugin.json" >&2
    exit 1
  fi
done < <(git ls-files 'skills/*/*/SKILL.md' | cut -d/ -f1-2 | sort -u)
echo "✅ every group folder is listed in plugin.json"

step "4/8 shellcheck"
sh_files=()
while IFS= read -r f; do sh_files+=("$f"); done < <(git ls-files '*.sh')
if [ "${#sh_files[@]}" -eq 0 ]; then
  echo "  no tracked .sh files, nothing to check"
else
  shellcheck -x "${sh_files[@]}"
  echo "✅ ${#sh_files[@]} scripts clean"
fi

step "5/8 Scrub for personal paths, emails and secrets"
# Personal home-folder paths, the old hard-coded vault, email addresses,
# and common token shapes (GitHub, OpenAI/Anthropic, AWS, private keys).
pattern='/Users/[A-Za-z]|/home/[a-z][a-z0-9_-]*/|obsidian-vault|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----'
# Allowed: git's noreply addresses and the git@github.com SSH host. These
# are cut out of each matching line before it is checked again, so another
# email on the same line is still caught. This script's own pattern line is
# skipped. The lockfile is skipped: it is generated and its package@version
# strings can look like emails.
allow='noreply@anthropic\.com|[A-Za-z0-9._%+-]*@users\.noreply\.github\.com|git@github\.com'
hits="$(git grep -n -I -E "$pattern" -- . ':!pnpm-lock.yaml' ':!scripts/check.sh' \
  | sed -E "s/$allow//g" | grep -E "$pattern" || true)"
if [ -n "$hits" ]; then
  echo "$hits" >&2
  echo "❌ Found personal paths, emails or secrets (above). Move personal values to a gitignored local.env." >&2
  exit 1
fi
echo "✅ clean"

step "6/8 sync-kit tests"
node --test scripts/sync-kit.test.mjs

step "7/8 Every skill's kit/ matches kit-src/"
node scripts/sync-kit.mjs --check

step "8/8 Plain-language floor (level 80) for the html skills and the kit docs"
# The kit's own checker. to-markdown predates the house style, so it is not held to it.
vocab_files=()
while IFS= read -r f; do vocab_files+=("$f"); done < <(git ls-files 'skills/html/*/SKILL.md' 'kit-src/HOUSE-STYLE.md' 'kit-src/PARTS.md')
[ "${#vocab_files[@]}" -gt 0 ] || { echo "❌ no html skills or kit docs found to check" >&2; exit 1; }
vocab_fail=0
for f in "${vocab_files[@]}"; do
  if out="$(node kit-src/vocab-check.mjs "$f" --level 80 2>&1)"; then
    echo "  $f: $(printf '%s\n' "$out" | head -1)"
  else
    printf '%s\n' "$out" >&2
    echo "❌ $f is under the level 80 floor (run: node kit-src/vocab-check.mjs $f --verbose)" >&2
    vocab_fail=1
  fi
done
[ "$vocab_fail" -eq 0 ] || exit 1
echo "✅ ${#vocab_files[@]} files at level 80 or better"

printf '\n✅ All checks passed\n'
