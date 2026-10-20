#!/usr/bin/env bash
# new-doc.sh: start a new learning doc by copying template.html into LEARNING_DOC_DIR.
# Usage: new-doc.sh <topic-kebab>
# Prints the path of the new file. Refuses to overwrite an existing doc.
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
# shellcheck source=SCRIPTDIR/config.sh
. "$SKILL_DIR/config.sh"

if [ $# -ne 1 ]; then
  echo "usage: new-doc.sh <topic-kebab>   (e.g. new-doc.sh cloudflare-migration)" >&2
  exit 1
fi

TOPIC="$1"
case "$TOPIC" in
  *[!a-z0-9-]*|-*|"")
    echo "❌ Topic must be kebab-case: lowercase letters, digits and dashes (got: $TOPIC)" >&2
    exit 1 ;;
esac

load_learning_doc_config

TEMPLATE="$SKILL_DIR/template.html"
[ -f "$TEMPLATE" ] || { echo "❌ Template missing: $TEMPLATE" >&2; exit 1; }

DEST="$LEARNING_DOC_DIR/$TOPIC.html"
if [ -e "$DEST" ]; then
  echo "❌ A doc already exists at $DEST. Edit it instead, or pick another topic name." >&2
  exit 1
fi

cp -- "$TEMPLATE" "$DEST"
echo "$DEST"
