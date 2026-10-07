---
description: Generate a style-faithful PDF from the session's learning-doc HTML (headless Chrome) into the Obsidian vault.
argument-hint: "[html path or topic name] — defaults to the newest .html in the vault folder"
allowed-tools: Bash(~/.claude/skills/learning-doc/html-to-pdf.sh:*), Bash(ls:*)
---

Convert the learning-doc HTML to a PDF using the bundled converter (headless Chrome — same engine as browser Print, so styling is preserved).

Vault folder: `$MY_SKILLS_KNOWLEDGE_DIR`

Steps:
1. Pick the target HTML:
   - If `$ARGUMENTS` is given, treat it as the HTML path (or a topic name → match `<topic>*.html` in the vault folder).
   - Otherwise use the **most recently modified** `*.html` in the vault folder.
2. Run the converter:
   ```bash
   ~/.claude/skills/learning-doc/html-to-pdf.sh "<the chosen .html path>"
   ```
3. Report the resulting `.pdf` path. The PDF lands next to the HTML in the vault, so it syncs to GitHub and is ready to pull onto the iPad (Working Copy → GoodNotes).

Do not regenerate the HTML or spend tokens rewriting content — this command only does the HTML→PDF conversion.
