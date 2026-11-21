#!/usr/bin/env bash
# check.sh: the repo's validation suite. On every pull request CI splits the
# steps across parallel jobs (.github/workflows/ci.yml); run them all locally
# with `pnpm run check`.
#
#   bash scripts/check.sh                    run every step, in order
#   bash scripts/check.sh --only scrub,links run only the named steps
#   bash scripts/check.sh --list             print the step names
#
# Steps:
#   - version         plugin.json carries the same version as package.json
#   - validate        `claude plugin validate --strict` passes (plugin + marketplace)
#   - skills-list     `npx skills add . --list` finds every skills/<group>/<name>/SKILL.md,
#                     and plugin.json's "skills" list names every group folder
#   - frontmatter     each SKILL.md's frontmatter is valid YAML, its name matches
#                     its folder, and its description fits Claude Code's 1,536-char cap
#   - links           every references/, platforms/ and scripts/ path a SKILL.md
#                     names, and every relative Markdown link, exists
#   - shellcheck      shellcheck passes on every tracked .sh file
#   - node-syntax     `node --check` passes on every skill script (.mjs, .js) and repo script
#   - markdownlint    no broken tables or code fences (.markdownlint-cli2.jsonc)
#   - scrub           no personal paths, emails or secrets are tracked
#   - tests           the kit sync, word check and page script tests pass
#   - kit-sync        every skill's kit/ matches what kit-src/ builds
#   - plain-language  the html skills and the kit docs read at plain-language level 80 or better
#   - changeset       a branch that changes skills/ adds a changeset (compared with origin/main)
#   - demo-video      the demo-video scripts cut, map and scan a tiny ffmpeg clip
#                     (skipped when skills/media/demo-video/ is not in the repo)
#
# A tool that is missing locally (shellcheck, ffmpeg) skips its step with a
# warning. In CI (CI=true) a missing tool fails the step instead.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
cd "$ROOT"

BIN="$ROOT/node_modules/.bin"
STEPS=(version validate skills-list frontmatter links shellcheck node-syntax markdownlint scrub tests kit-sync plain-language changeset demo-video)

SCRATCH="$(mktemp -d)"
trap 'rm -rf -- "$SCRATCH"' EXIT

need_bin() {
  local tool
  for tool in "$@"; do
    [ -x "$BIN/$tool" ] || { echo "❌ $BIN/$tool is missing. Run: pnpm install" >&2; exit 1; }
  done
}

# need_cmd <command> <install hint>: true if it's there. Locally a missing tool
# skips the step (returns 1); in CI it fails.
need_cmd() {
  command -v "$1" >/dev/null && return 0
  if [ "${CI:-}" = "true" ]; then
    echo "❌ $1 is not installed ($2)" >&2
    exit 1
  fi
  echo "⚠️  $1 is not installed, so this step is skipped here ($2). CI still runs it."
  return 1
}

step_version() {
  node scripts/sync-version.mjs --check
}

step_validate() {
  need_bin claude
  "$BIN/claude" plugin validate --strict .
}

step_skills-list() {
  need_bin skills
  # Run in a scratch HOME so the CLI can't read or write your real agent folders.
  local home="$SCRATCH/skills-home" list_out="$SCRATCH/list.txt" clean="$SCRATCH/list.clean"
  mkdir -p "$home"
  if ! (cd "$home" && HOME="$home" DISABLE_TELEMETRY=1 "$BIN/skills" add "$ROOT" --list >"$list_out" 2>&1); then
    cat "$list_out" >&2
    echo "❌ skills add --list failed" >&2
    exit 1
  fi
  # Strip terminal color codes before matching.
  sed -e $'s/\x1b\\[[0-9;?]*[a-zA-Z]//g' "$list_out" > "$clean"
  local expected=0 missing=0 skill_md name
  while IFS= read -r skill_md; do
    expected=$((expected + 1))
    # Read name: only from the frontmatter (between the first two --- lines).
    name="$(awk 'NR == 1 && $0 != "---" { exit } NR > 1 && $0 == "---" { exit }
      NR > 1 && /^name:[[:space:]]*/ { sub(/^name:[[:space:]]*/, ""); print; exit }' "$skill_md")"
    [ -n "$name" ] || { echo "❌ $skill_md has no name: line in its frontmatter" >&2; missing=$((missing + 1)); continue; }
    # Exact, literal match on a listing line ("│    <name>"), no regex.
    if awk -v want="$name" '{ line = $0; gsub(/^[│[:space:]]+|[[:space:]]+$/, "", line) } line == want { found = 1 } END { exit !found }' "$clean"; then
      echo "  found $name"
    else
      echo "❌ skills CLI did not list $name ($skill_md)" >&2
      missing=$((missing + 1))
    fi
  done < <(git ls-files 'skills/*/*/SKILL.md')
  [ "$expected" -gt 0 ] || { echo "❌ No skills/<group>/<name>/SKILL.md files are tracked" >&2; exit 1; }
  [ "$missing" -eq 0 ] || { cat "$clean" >&2; exit 1; }
  echo "✅ all $expected skills listed"

  # The Claude Code plugin only scans the group folders plugin.json lists.
  local plugin_groups group
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
}

step_frontmatter() {
  node scripts/check-skills.mjs frontmatter
}

step_links() {
  node scripts/check-skills.mjs links
}

step_shellcheck() {
  need_cmd shellcheck "macOS: brew install shellcheck" || return 0
  local sh_files=() f
  while IFS= read -r f; do sh_files+=("$f"); done < <(git ls-files '*.sh')
  if [ "${#sh_files[@]}" -eq 0 ]; then
    echo "  no tracked .sh files, nothing to check"
    return 0
  fi
  shellcheck -x "${sh_files[@]}"
  echo "✅ ${#sh_files[@]} scripts clean"
}

step_node-syntax() {
  local files=() f bad=0
  while IFS= read -r f; do files+=("$f"); done < <(git ls-files \
    ':(glob)skills/**/scripts/*.mjs' ':(glob)skills/**/scripts/*.js' 'scripts/*.mjs')
  for f in "${files[@]}"; do
    if ! out="$(node --check "$f" 2>&1)"; then
      printf '%s\n' "$out" >&2
      echo "❌ $f has a syntax error (above)" >&2
      bad=1
    fi
  done
  [ "$bad" -eq 0 ] || exit 1
  echo "✅ ${#files[@]} scripts parse"
}

step_markdownlint() {
  need_bin markdownlint-cli2
  # Files and rules come from .markdownlint-cli2.jsonc.
  "$BIN/markdownlint-cli2" '**/*.md'
}

step_scrub() {
  # Personal home-folder paths, the old hard-coded vault, email addresses,
  # and common token shapes (GitHub, OpenAI/Anthropic, AWS, private keys).
  local pattern allow hits
pattern='/Users/[A-Za-z]|/home/[a-z][a-z0-9_-]*/|obsidian-vault|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----'
  # Allowed: git's noreply addresses and the git@github.com SSH host. These
  # are cut out of each matching line before it is checked again, so another
  # email on the same line is still caught. Only this script's own pattern=
  # line is dropped (the rest of check.sh is scanned like any file). The
  # lockfile is skipped: it is generated and its package@version strings can
  # look like emails.
  allow='noreply@anthropic\.com|[A-Za-z0-9._%+-]*@users\.noreply\.github\.com|git@github\.com'
  hits="$(git grep -n -I -E "$pattern" -- . ':!pnpm-lock.yaml' \
    | grep -Ev '^scripts/check\.sh:[0-9]+:pattern=' \
    | sed -E "s/$allow//g" | grep -E "$pattern" || true)"
  if [ -n "$hits" ]; then
    echo "$hits" >&2
    echo "❌ Found personal paths, emails or secrets (above). Move personal values to a gitignored local.env." >&2
    exit 1
  fi
  echo "✅ clean"
}

step_tests() {
  node --test scripts/sync-kit.test.mjs kit-src/vocab-check.test.mjs kit-src/kit-js.test.mjs
}

step_kit-sync() {
  node scripts/sync-kit.mjs --check
}

step_plain-language() {
  # The kit's own checker. to-markdown predates the house style, so it is not held to it.
  local vocab_files=() f out vocab_fail=0
  while IFS= read -r f; do vocab_files+=("$f"); done < <(git ls-files 'skills/html/*/SKILL.md' 'kit-src/HOUSE-STYLE.md' 'kit-src/PARTS.md')
  [ "${#vocab_files[@]}" -gt 0 ] || { echo "❌ no html skills or kit docs found to check" >&2; exit 1; }
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
}

step_changeset() {
  local base="${CHANGESET_BASE:-origin/main}"
  # The release workflow's Version Packages PR uses up the changesets; it never needs one.
  if [ "${GITHUB_HEAD_REF:-}" = "changeset-release/main" ]; then
    echo "  Version Packages PR, no changeset needed"
    return 0
  fi
  if ! git rev-parse --verify --quiet "$base^{commit}" >/dev/null; then
    if [ "${CI:-}" = "true" ]; then echo "❌ $base is not fetched" >&2; exit 1; fi
    echo "⚠️  $base is not fetched, so this step is skipped here (run: git fetch origin main). CI still runs it."
    return 0
  fi
  local changed
  changed="$(git diff --name-only "$base...HEAD" -- skills/)"
  if [ -z "$changed" ]; then
    echo "  no changes under skills/ since $base, no changeset needed"
    return 0
  fi
  need_bin changeset
  printf '  changed under skills/:\n%s\n' "$(printf '%s\n' "$changed" | sed 's/^/    /' | head -10)"
  if ! "$BIN/changeset" status --since="$base"; then
    echo "❌ This branch changes skills/ but adds no changeset. Run: pnpm changeset (see CONTRIBUTING.md)" >&2
    exit 1
  fi
  echo "✅ changeset found"
}

step_demo-video() {
  local dir="$ROOT/skills/media/demo-video/scripts"
  if [ ! -d "$dir" ]; then
    echo "  skills/media/demo-video/ is not in this checkout, nothing to test"
    return 0
  fi
  need_cmd ffmpeg "macOS: brew install ffmpeg; Ubuntu: apt-get install ffmpeg" || return 0
  need_cmd ffprobe "comes with ffmpeg" || return 0
  # sheet.mjs is not run: it draws its labels in a headless browser (Playwright).
  local ws="$SCRATCH/demo-video"
  mkdir -p "$ws/raw"
  # A 3 s black clip with a white flash at 1.5-1.7 s, and a matching event log.
  ffmpeg -loglevel error -y -f lavfi -i 'color=c=black:s=320x180:r=30:d=3' \
    -vf "drawbox=x=0:y=0:w=iw:h=ih:color=white:t=fill:enable='between(t,1.5,1.7)'" \
    -c:v libx264 -pix_fmt yuv420p "$ws/raw/story.mp4"
  cat > "$ws/raw/story.events.json" <<'JSON'
{
  "viewport": { "width": 320, "height": 180 },
  "frameWidth": 320,
  "events": [
    { "type": "cursor", "x": 10, "y": 10, "t": 0 },
    { "type": "move", "from": { "x": 10, "y": 10 }, "to": { "x": 200, "y": 120 }, "ms": 600, "bend": 20, "t": 0.2 },
    { "type": "down", "x": 200, "y": 120, "t": 0.9 },
    { "type": "up", "x": 200, "y": 120, "t": 1.0 },
    { "type": "mark", "label": "flash", "t": 1.5 },
    { "type": "mark", "label": "end", "t": 2.8 }
  ]
}
JSON
  local out
  # 0-1 s at 1x, 1-2.5 s at 3x, then a 0.3 s freeze at 2.6 s: 1 + 0.5 + 0.3 = 1.8 s.
  out="$(cd "$ws" && node "$dir/cut.mjs" story story-cut '0-1@1,1-2.5@3,2.6~0.3' 320)"
  echo "  cut.mjs: $out"
  local f
  for f in assets/clips/story-cut.mp4 assets/data/story-cut.js assets/data/story-cut.json; do
    [ -s "$ws/$f" ] || { echo "❌ cut.mjs did not write $f" >&2; exit 1; }
  done
  node -e '
    const [out, json, mp4] = process.argv.slice(1);
    const r = JSON.parse(out); const seg = require(json);
    const fail = (m) => { console.error("❌ cut.mjs: " + m); process.exit(1); };
    if (Math.abs(r.duration - 1.8) > 0.01) fail(`duration is ${r.duration}, expected 1.8`);
    if (!r.marks.includes("flash@1.167")) fail(`marks ${r.marks} should include flash@1.167 (1.5 s at 3x after 1 s)`);
    if (seg.segments.length !== 3) fail("segments JSON should hold 3 segments");
    const probe = require("node:child_process").execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp4], { encoding: "utf8" });
    if (Math.abs(Number(probe) - 1.8) > 0.1) fail(`the clip is ${Number(probe)} s long, expected about 1.8`);
  ' "$out" "$ws/assets/data/story-cut.json" "$ws/assets/clips/story-cut.mp4"

  out="$(cd "$ws" && node "$dir/srctime.mjs" story-cut 0.5,2,2.6 10)"
  echo "  srctime.mjs: $out"
  [ "$out" = '[{"src":0.5,"at":10.5},{"src":2,"at":11.333},{"src":2.6,"at":11.5}]' ] \
    || { echo "❌ srctime.mjs mapped the times wrong (expected 10.5, 11.333, 11.5)" >&2; exit 1; }

  out="$(node "$dir/peaks.mjs" "$ws/raw/story.mp4" 0 3 320:180:0:0)"
  echo "  peaks.mjs: $out"
  printf '%s\n' "$out" | grep -Eq '^peak 1\.[5-7][0-9]* onset 1\.(4|5)' \
    || { echo "❌ peaks.mjs did not find the flash at 1.5 s" >&2; exit 1; }
  echo "✅ cut.mjs, srctime.mjs and peaks.mjs work on a test clip"
}

run_step() {
  printf '\n▶ %s\n' "$1"
  "step_$1"
}

only=""
case "${1:-}" in
  "") ;;
  --list) printf '%s\n' "${STEPS[@]}"; exit 0 ;;
  --only) only="${2:?--only needs a step name (see --list)}" ;;
  --only=*) only="${1#--only=}" ;;
  -h|--help) awk 'NR > 1 && /^#/ { sub(/^# ?/, ""); print; next } NR > 1 { exit }' "$0"; exit 0 ;;
  *) echo "❌ unknown argument: $1 (try --help)" >&2; exit 2 ;;
esac

command -v git >/dev/null || { echo "❌ git is not installed" >&2; exit 1; }

if [ -z "$only" ]; then
  for s in "${STEPS[@]}"; do run_step "$s"; done
  printf '\n✅ All %s checks passed\n' "${#STEPS[@]}"
else
  IFS=',' read -r -a picked <<<"$only"
  for s in "${picked[@]}"; do
    printf '%s\n' "${STEPS[@]}" | grep -Fxq -- "$s" || { echo "❌ unknown step: $s (known: ${STEPS[*]})" >&2; exit 2; }
  done
  for s in "${picked[@]}"; do run_step "$s"; done
  printf '\n✅ Passed: %s\n' "$only"
fi
