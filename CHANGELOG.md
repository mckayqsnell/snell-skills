# snell-skills

## 1.0.3

### Patch Changes

- 768a07c: New `data-width="full"` on `<html>`: running text, callouts and figures share one edge, for pages that are mostly drawings. Without it, text and callouts stop at `--measure` (61ch) while figures fill `main`, so every drawing overhangs the paragraph above it. Prose-led pages are unchanged — 61ch stays the default, because the wider column runs about 90 characters a line.
  
  `.lede` had its measure hard-coded at 60ch, so a page that widened `--measure` got everything except its opening line. It now reads a new `--measure-lede` token, which keeps the same default and moves with the rest.
- 25886c7: Rounded boxes in sketch drawings no longer get loops and doubled lines on their corners. They now draw with one stroke, with the corners pinned, so pill-shaped labels and rounded cards look clean. Square boxes, lines and arrows keep the hand-drawn double stroke.

## 1.0.2

### Patch Changes

- 8cc5c0b: Fixes from a first real install of the plugin:
  
  - **Snell Mono** is now the Regular weight. The packed copy was the ExtraLight cut labeled as Regular, so code and labels looked faint.
  - **New `kit/page.html`**, a plain starter for any page that isn't a plan or an explainer. html-house-style now points to it.
  - **Every placeholder is named.** html-plan and html-explain list the `<title>` and top-bar tag placeholders, and both check with `grep '{{'` before handing over.
  - **Fairer word check.** `vocab-check.mjs` counts a term as explained only where the page defines it in place (`<dfn>`, `<abbr>` or `.term`), plurals included. Glossary entries alone no longer raise the score. Technical pages pass by defining their few core terms in place.
  - **Removed pointers to things that don't exist yet:** `/anatomy` and the `/setup-snell-skills` wizard.
  - **Clearer git step:** the git check before writing `plans/` or `explain/` uses the page's own path, so it works before the folder exists.

## 1.0.1

### Patch Changes

- a516381: The kit's packed fonts are now named Snell Serif, Snell Sans and Snell Mono. They are the same Adobe Source Serif 4, Source Sans 3 and Source Code Pro letters, renamed because the fonts' license reserves the name "Source" for unmodified copies. Pages look the same. If you wrote your own CSS that names `"Source Serif 4"`, `"Source Sans 3"` or `"Source Code Pro"`, switch it to the new names.

## 1.0.0

### Major Changes

- 3efcab2: First release as snell-skills. Install with `npx skills add mckayqsnell/snell-skills`, or as a Claude Code plugin from the snell-skills marketplace.
  
  It ships four skills:
  
  - **html-plan**: plans a coding job as one page. It sizes the job (below S to L), asks a few questions, then you pick the decisions and paste one answer back.
  - **html-explain**: explains a topic as one page that teaches it, for you or for someone else (`for:"…"`), and can save a PDF (`keep`).
  - **html-house-style**: the shared look for any other page: colors, fonts, page parts, sketch drawings, a drawing viewer and a reply box.
  - **to-markdown**: converts PDFs, Office files, images, audio and more into Markdown.
  
  The learning-doc skill and its /learning-pdf command are removed. html-explain covers what they did.
