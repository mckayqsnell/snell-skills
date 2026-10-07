#!/usr/bin/env bash
# html-to-pdf.sh — convert a learning-doc HTML into a style-faithful PDF via headless Chrome.
# Same engine as the browser's Print, so the PDF matches the page exactly.
# Usage: html-to-pdf.sh <input.html> [output.pdf]   (output defaults to input with .pdf)
set -euo pipefail

IN="${1:?usage: html-to-pdf.sh <input.html> [output.pdf]}"
[ -f "$IN" ] || { echo "❌ HTML not found: $IN" >&2; exit 1; }

# Chrome needs an absolute file:// URL.
ABS="$(cd "$(dirname "$IN")" && pwd)/$(basename "$IN")"
OUT="${2:-${ABS%.html}.pdf}"

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [ ! -x "$CHROME" ]; then
  CHROME="$(command -v google-chrome-stable || command -v google-chrome || command -v chromium || true)"
fi
[ -n "${CHROME:-}" ] && [ -x "$CHROME" ] || { echo "❌ Google Chrome not found — install it to generate PDFs." >&2; exit 1; }

# --headless=new is fast; --no-pdf-header-footer drops the date/URL margins.
# Background colors come from the HTML's @media print { print-color-adjust:exact } — not a flag.
"$CHROME" --headless=new --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$OUT" "file://$ABS" >/dev/null 2>&1

[ -f "$OUT" ] || { echo "❌ PDF was not produced." >&2; exit 1; }
echo "✅ PDF written: $OUT"
