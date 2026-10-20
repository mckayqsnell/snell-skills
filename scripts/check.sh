#!/usr/bin/env bash
# check.sh: the repo's validation suite. CI runs it on every pull request;
# run it locally with `pnpm run check` before you push.
#
# Checks:
#   1. plugin.json carries the same version as package.json
#   2. `claude plugin validate --strict` passes (plugin + marketplace)
#   3. `npx skills add . --list` finds every skills/<group>/<name>/SKILL.md
#   4. shellcheck passes on every tracked .sh file
#   5. no personal paths, emails or secrets are tracked
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

step "1/5 Version sync"
node scripts/sync-version.mjs --check

step "2/5 claude plugin validate --strict"
"$BIN/claude" plugin validate --strict .

step "3/5 npx skills finds every skill"
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
  name="$(sed -n 's/^name:[[:space:]]*//p' "$skill_md" | head -n 1)"
  [ -n "$name" ] || { echo "❌ $skill_md has no name: line in its frontmatter" >&2; missing=$((missing + 1)); continue; }
  folder="$(basename "$(dirname "$skill_md")")"
  [ "$name" = "$folder" ] || { echo "❌ $skill_md: name '$name' does not match its folder '$folder'" >&2; missing=$((missing + 1)); }
  if grep -Eq "^[│[:space:]]*${name}[[:space:]]*\$" "$SCRATCH/list.clean"; then
    echo "  found $name"
  else
    echo "❌ skills CLI did not list $name ($skill_md)" >&2
    missing=$((missing + 1))
  fi
done < <(git ls-files 'skills/*/*/SKILL.md')
[ "$expected" -gt 0 ] || { echo "❌ No skills/<group>/<name>/SKILL.md files are tracked" >&2; exit 1; }
[ "$missing" -eq 0 ] || { cat "$SCRATCH/list.clean" >&2; exit 1; }
echo "✅ all $expected skills listed"

step "4/5 shellcheck"
sh_files=()
while IFS= read -r f; do sh_files+=("$f"); done < <(git ls-files '*.sh')
if [ "${#sh_files[@]}" -eq 0 ]; then
  echo "  no tracked .sh files, nothing to check"
else
  shellcheck -x "${sh_files[@]}"
  echo "✅ ${#sh_files[@]} scripts clean"
fi

step "5/5 Scrub for personal paths, emails and secrets"
# Personal home-folder paths, the old hard-coded vault, email addresses,
# and common token shapes (GitHub, OpenAI/Anthropic, AWS, private keys).
pattern='/Users/[A-Za-z]|/home/[a-z][a-z0-9_-]*/|obsidian-vault|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----'
# Allowed: git's noreply addresses, the git@github.com SSH host, and this
# script's own pattern line. The lockfile is skipped: it is generated and
# its package@version strings can look like emails.
allow='noreply@anthropic\.com|@users\.noreply\.github\.com|git@github\.com|^scripts/check\.sh:[0-9]+:pattern='
hits="$(git grep -n -I -E "$pattern" -- . ':!pnpm-lock.yaml' | grep -Ev "$allow" || true)"
if [ -n "$hits" ]; then
  echo "$hits" >&2
  echo "❌ Found personal paths, emails or secrets (above). Move personal values to a gitignored local.env." >&2
  exit 1
fi
echo "✅ clean"

printf '\n✅ All checks passed\n'
