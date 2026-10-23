---
"snell-skills": patch
---

New `data-width="full"` on `<html>`: running text, callouts and figures share one edge, for pages that are mostly drawings. Without it, text and callouts stop at `--measure` (61ch) while figures fill `main`, so every drawing overhangs the paragraph above it. Prose-led pages are unchanged — 61ch stays the default, because the wider column runs about 90 characters a line.

`.lede` had its measure hard-coded at 60ch, so a page that widened `--measure` got everything except its opening line. It now reads a new `--measure-lede` token, which keeps the same default and moves with the rest.
