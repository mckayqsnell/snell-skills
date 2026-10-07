---
name: learning-doc
description: Create and maintain a beautiful, textbook-style HTML learning doc (plus a style-faithful PDF) for a working session, so the user can read and annotate it like a textbook. Use when the user opts into a "learning doc / learning HTML / learning PDF" for the session, or asks to capture what's being explored as a styled doc.
---

# Learning Doc

Build a **living, textbook-style HTML doc** that teaches the valuable concepts surfacing this session, in plain English, beautifully laid out — then convert it to a **PDF** the user annotates on an iPad (GoodNotes). Keep it updated as the session goes.

## Quick start
1. **Copy the template** into the vault folder (quote the path — it has spaces):
   ```bash
   DEST="$MY_SKILLS_KNOWLEDGE_DIR"
   cp ~/.claude/skills/learning-doc/template.html "$DEST/<topic-kebab>.html"
   ```
   Name it for the topic (e.g. `cloudflare-migration.html`, or prefix a ticket: `hea-1062-sync-state.html`).
2. **Fill it in** following the template's components (lede → TOC → numbered concepts with `.vocab` and `.idea` callouts). Edit it throughout the session as new things come up — it's a *living* doc.
3. **Generate the PDF** when the user asks (or at a natural stopping point — ask first, don't spam):
   ```bash
   ~/.claude/skills/learning-doc/html-to-pdf.sh "$DEST/<topic-kebab>.html"
   ```
   This writes `<topic-kebab>.pdf` next to the HTML. The `/learning-pdf` command does the same.

## Non-negotiable rules (so the PDF always renders right)
- **Start from `template.html`.** It already has the design system + the required `@media print` block — don't hand-roll the CSS.
- **Keep `print-color-adjust: exact`** in the print block (browsers drop backgrounds otherwise). It's already there; don't remove it.
- **No background images in `@page {}`** — headless Chrome silently drops them. Embed any image as a `data:` URI in normal elements, never via `@page`.
- **System fonts only, fully self-contained.** No CDN/Google Fonts, no external CSS/JS — they won't render in the PDF or offline. Inline everything.
- **No JavaScript for content.** PDF flattens it. Use CSS layout for an "interactive feel"; keep all meaning in static HTML/CSS.

## Make it genuinely good
This is the user's textbook — invest in it:
- **Plain English.** Explain like a patient teacher; define jargon the first time you use it.
- **Vocab callouts** (`.vocab`) for unintuitive terms; **"Bigger idea" callouts** (`.idea`) to tie a detail to a broader principle.
- **Numbered concepts** (`<h2><span class="num">Concept NN</span>…`) with a TOC up top.
- Use **tables**, the **`.flow`** before/after diagram, and **`.mono`** code blocks where they clarify.
- Keep paragraphs short and scannable; lead each concept with the takeaway. Not verbose — only what's worth keeping.
- Get creative within the design system (the palette/components are proven); the goal is something the user *wants* to read.

## Workflow notes
- Treat the doc as **append-only-ish**: as the session surfaces something worth learning, add a concept or extend one. Mention briefly when you've updated it.
- The vault is a git repo backed to GitHub; the user pulls it onto the iPad via **Working Copy** and opens the PDF in **GoodNotes**. So both the `.html` and `.pdf` belong in the vault folder above.
- Regenerating the PDF is a cheap shell command (no tokens) — re-run it after meaningful updates or when the user says so.
