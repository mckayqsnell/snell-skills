#!/usr/bin/env bash
# html-to-pdf.sh: convert a learning-doc HTML into a style-faithful PDF via headless Chrome.
# Same engine as the browser's Print, so the PDF matches the page exactly.
#
# Usage: html-to-pdf.sh [<input.html> | <topic>] [output.pdf]
#   <input.html>  an HTML file path
#   <topic>       picks <topic>*.html in LEARNING_DOC_DIR (must match exactly one file)
#   (nothing)     picks the newest *.html in LEARNING_DOC_DIR
# The output defaults to the input path with .pdf instead of .html.
# LEARNING_DOC_DIR comes from local.env (see config.sh); it is only needed
# when you pass a topic or nothing.
set -euo pipefail

# shellcheck source=SCRIPTDIR/config.sh
. "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)/config.sh"

if [ $# -gt 2 ]; then
  echo "usage: html-to-pdf.sh [<input.html> | <topic>] [output.pdf]" >&2
  exit 1
fi

ARG="${1:-}"
if [ -n "$ARG" ] && [ -f "$ARG" ]; then
  IN="$ARG"
else
  load_learning_doc_config
  if [ -z "$ARG" ]; then
    # Newest .html in the folder, by modification time.
    IN=""
    for f in "$LEARNING_DOC_DIR"/*.html; do
      [ -f "$f" ] || continue
      if [ -z "$IN" ] || [ "$f" -nt "$IN" ]; then IN="$f"; fi
    done
    [ -n "$IN" ] || { echo "❌ No .html files in $LEARNING_DOC_DIR" >&2; exit 1; }
  else
    case "$ARG" in
      */*|*.html) echo "❌ HTML not found: $ARG" >&2; exit 1 ;;
    esac
    shopt -s nullglob
    MATCHES=("$LEARNING_DOC_DIR/$ARG"*.html)
    shopt -u nullglob
    case ${#MATCHES[@]} in
      0) echo "❌ No file matches $ARG*.html in $LEARNING_DOC_DIR" >&2; exit 1 ;;
      1) IN="${MATCHES[0]}" ;;
      *) echo "❌ More than one file matches $ARG*.html; pass the full path:" >&2
         printf '   %s\n' "${MATCHES[@]}" >&2
         exit 1 ;;
    esac
  fi
fi

case "$IN" in
  *.html) ;;
  *) echo "❌ Input must be an .html file: $IN" >&2; exit 1 ;;
esac

# Chrome needs an absolute file:// URL.
ABS="$(cd "$(dirname "$IN")" && pwd -P)/$(basename "$IN")"
OUT="${2:-${ABS%.html}.pdf}"
OUT_DIR="$(dirname "$OUT")"
[ -d "$OUT_DIR" ] || { echo "❌ Output folder does not exist: $OUT_DIR" >&2; exit 1; }

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [ ! -x "$CHROME" ]; then
  CHROME="$(command -v google-chrome-stable || command -v google-chrome || command -v chromium || true)"
fi
if [ -z "${CHROME:-}" ] || [ ! -x "$CHROME" ]; then
  echo "❌ Google Chrome not found. Install it to generate PDFs." >&2
  exit 1
fi

# Remove an old PDF first, so the check below proves this run made the file.
rm -f -- "$OUT"

# --headless=new is fast; --no-pdf-header-footer drops the date/URL margins.
# Background colors come from the HTML's @media print { print-color-adjust:exact }, not a flag.
LOG="$(mktemp)"
trap 'rm -f -- "$LOG"' EXIT
if ! "$CHROME" --headless=new --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$OUT" "file://$ABS" >"$LOG" 2>&1; then
  echo "❌ Chrome failed. Its output:" >&2
  cat "$LOG" >&2
  exit 1
fi

[ -s "$OUT" ] || { echo "❌ PDF was not produced." >&2; cat "$LOG" >&2; exit 1; }
echo "✅ PDF written: $OUT"
