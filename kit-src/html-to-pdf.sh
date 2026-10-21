#!/usr/bin/env bash
# html-to-pdf.sh: turn a house-style page into a PDF that matches it, using headless Chrome
# (the same engine as the browser's Print). The page script runs first, so sketch drawings are in.
# Usage: html-to-pdf.sh <page.html> [out.pdf]     out defaults to the page path with .pdf
# Set CHROME=/path/to/chrome to pick the browser yourself.
set -euo pipefail

die() { echo "html-to-pdf: $*" >&2; exit 1; }

if [ $# -lt 1 ] || [ $# -gt 2 ]; then
  die "usage: html-to-pdf.sh <page.html> [out.pdf]"
fi
IN="$1"
[ -f "$IN" ] || die "no such file: $IN"
case "$IN" in *.html|*.htm) ;; *) die "expected an .html file, got: $IN" ;; esac

ABS="$(cd "$(dirname "$IN")" && pwd)/$(basename "$IN")"
OUT="${2:-${ABS%.*}.pdf}"
OUT_DIR="$(dirname "$OUT")"
[ -d "$OUT_DIR" ] || die "output folder does not exist: $OUT_DIR"

find_chrome() {
  if [ -n "${CHROME:-}" ]; then [ -x "$CHROME" ] && { echo "$CHROME"; return; }; die "CHROME is set but not runnable: $CHROME"; fi
  local c
  for c in \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/Applications/Chromium.app/Contents/MacOS/Chromium" \
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" \
    "/c/Program Files/Google/Chrome/Application/chrome.exe" \
    "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"; do
    [ -x "$c" ] && { echo "$c"; return; }
  done
  for c in google-chrome-stable google-chrome chromium chromium-browser microsoft-edge; do
    command -v "$c" >/dev/null 2>&1 && { command -v "$c"; return; }
  done
  die "no Chrome, Chromium or Edge found. Install one, or set CHROME=/path/to/browser."
}
BROWSER="$(find_chrome)"

# On Windows (Git Bash), Chrome needs C:/... not /c/..., so convert the path first.
URL_PATH="$ABS"
if command -v cygpath >/dev/null 2>&1; then URL_PATH="/$(cygpath -m "$ABS")"; fi
# A file URL needs spaces and other odd characters escaped.
URL="file://$(printf '%s' "$URL_PATH" | sed -e 's/%/%25/g' -e 's/ /%20/g' -e 's/#/%23/g' -e 's/?/%3F/g')"

TMP_OUT="$(mktemp "${TMPDIR:-/tmp}/html-to-pdf.XXXXXX")"
trap 'rm -f "$TMP_OUT"' EXIT
PDF_ARG="$TMP_OUT"
if command -v cygpath >/dev/null 2>&1; then PDF_ARG="$(cygpath -w "$TMP_OUT")"; fi

# --virtual-time-budget lets the page script finish (folds, sketch drawings) before printing.
# Backgrounds print because the page CSS sets print-color-adjust: exact.
if ! "$BROWSER" --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=4000 \
     --print-to-pdf="$PDF_ARG" "$URL" >/dev/null 2>&1; then
  die "the browser failed to print $IN"
fi
[ -s "$TMP_OUT" ] || die "the browser wrote an empty PDF for $IN"
chmod 644 "$TMP_OUT"   # mktemp makes it owner-only; a PDF is meant to be shared
mv "$TMP_OUT" "$OUT"
trap - EXIT
echo "PDF written: $OUT"
