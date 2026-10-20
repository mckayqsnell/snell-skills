---
description: Generate a style-faithful PDF from the session's learning-doc HTML (headless Chrome) into your learning-doc folder.
argument-hint: "[html path or topic name] — defaults to the newest .html in LEARNING_DOC_DIR"
allowed-tools: Bash(${CLAUDE_PLUGIN_ROOT}/skills/html/learning-doc/html-to-pdf.sh:*)
---

Convert the learning-doc HTML to a PDF using the bundled converter (headless Chrome — same engine as browser Print, so styling is preserved).

The docs folder is `LEARNING_DOC_DIR` from your `local.env` settings file (see `local.env.example` in the snell-skills repo). The converter finds it by itself.

Steps:
1. Run the converter. Pass `$ARGUMENTS` through as-is: a path to an `.html` file, a topic name (matches `<topic>*.html` in the folder), or nothing (uses the most recently modified `.html` in the folder):
   ```bash
   "${CLAUDE_PLUGIN_ROOT}/skills/html/learning-doc/html-to-pdf.sh" $ARGUMENTS
   ```
2. If it fails, show its error message to the user as-is. It says what is missing (for example, no `local.env`) and how to fix it. Do not guess a folder.
3. Report the resulting `.pdf` path. The PDF lands next to the HTML, so it syncs wherever that folder syncs.

Do not regenerate the HTML or spend tokens rewriting content — this command only does the HTML→PDF conversion.
