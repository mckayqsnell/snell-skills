# snell-skills

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
