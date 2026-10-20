# config.sh: shared settings loader for the learning-doc scripts.
# Source it, then call load_learning_doc_config. It sets LEARNING_DOC_DIR
# (the folder where learning docs and their PDFs live) or exits with a
# message that says exactly what to create.
#
# It reads the first settings file it finds, in this order:
#   1. $SNELL_SKILLS_ENV, if set (it must point at a real file)
#   2. local.env at the root of a snell-skills checkout (when this skill
#      runs from a clone of the repo)
#   3. ${XDG_CONFIG_HOME:-$HOME/.config}/snell-skills/local.env
#
# The file holds KEY=VALUE lines. It is parsed, never executed.
# shellcheck shell=bash

LEARNING_DOC_SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"

_ld_die() {
  echo "❌ $*" >&2
  exit 1
}

# Print the settings file to use, or nothing if none exists.
_ld_find_env_file() {
  if [ -n "${SNELL_SKILLS_ENV:-}" ]; then
    [ -f "$SNELL_SKILLS_ENV" ] || _ld_die "SNELL_SKILLS_ENV points at a missing file: $SNELL_SKILLS_ENV"
    printf '%s\n' "$SNELL_SKILLS_ENV"
    return 0
  fi

  # skills/html/learning-doc -> repo root is three levels up. Only trust it
  # when it really is a snell-skills checkout, so a copied skill never reads
  # some unrelated local.env (for example one in your home folder).
  local repo_root
  repo_root="$(cd "$LEARNING_DOC_SKILL_DIR/../../.." && pwd -P)"
  if [ -f "$repo_root/.claude-plugin/plugin.json" ] \
    && [ -f "$repo_root/local.env.example" ] \
    && [ -f "$repo_root/local.env" ]; then
    printf '%s\n' "$repo_root/local.env"
    return 0
  fi

  local user_env="${XDG_CONFIG_HOME:-$HOME/.config}/snell-skills/local.env"
  if [ -f "$user_env" ]; then
    printf '%s\n' "$user_env"
  fi
}

# Read one KEY from a KEY=VALUE file. Strips matching outer quotes and
# expands a leading ~/ to $HOME. Prints nothing if the key is absent.
_ld_read_key() {
  local file="$1" key="$2" line value
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      "$key="*) value="${line#"$key="}" ;;
      *) continue ;;
    esac
    case "$value" in
      \"*\") value="${value#\"}"; value="${value%\"}" ;;
      \'*\') value="${value#\'}"; value="${value%\'}" ;;
    esac
    # A literal "~/" prefix is the point here, so SC2088 does not apply.
    # shellcheck disable=SC2088
    case "$value" in
      "~/"*) value="$HOME/${value#"~/"}" ;;
    esac
    printf '%s\n' "$value"
    return 0
  done < "$file"
}

load_learning_doc_config() {
  local env_file
  env_file="$(_ld_find_env_file)" || exit 1
  if [ -z "$env_file" ]; then
    cat >&2 <<EOF
❌ No settings file found for the learning-doc skill.

Create one of these (the first one found wins):
  - local.env at the root of your snell-skills clone (copy local.env.example)
  - ${XDG_CONFIG_HOME:-$HOME/.config}/snell-skills/local.env
  - any file, with SNELL_SKILLS_ENV=/path/to/that/file set

It needs one line, naming the folder for your learning docs:
  LEARNING_DOC_DIR="\$HOME/path/to/your/notes folder"
EOF
    exit 1
  fi

  LEARNING_DOC_DIR="$(_ld_read_key "$env_file" LEARNING_DOC_DIR)"
  [ -n "$LEARNING_DOC_DIR" ] || _ld_die "LEARNING_DOC_DIR is missing or empty in $env_file"
  case "$LEARNING_DOC_DIR" in
    "\$HOME/"*) LEARNING_DOC_DIR="$HOME/${LEARNING_DOC_DIR#"\$HOME/"}" ;;
  esac
  case "$LEARNING_DOC_DIR" in
    /*) ;;
    *) _ld_die "LEARNING_DOC_DIR must be an absolute path (got: $LEARNING_DOC_DIR) in $env_file" ;;
  esac
  [ -d "$LEARNING_DOC_DIR" ] || _ld_die "LEARNING_DOC_DIR is not a folder: $LEARNING_DOC_DIR (set in $env_file)"
  export LEARNING_DOC_DIR
}
