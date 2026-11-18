# snell-skills

## 1.1.0

### Minor Changes

- 4df0e3e: html-explain now has far more room to teach. Instead of a fixed recipe, its "Write the page" step hands the agent a toolbox and a way to choose: watch it run (a scene with Play), build it up, picture then the real thing (ELI5 layers, now one option among several), side by side, follow the numbers, or a tour of the map. It pushes the agent to draw the mechanism, with at least one moving or playable drawing when the topic has moving parts, and says two explain pages should not look alike.
  
  - **"Questions you might have"** replaces the "What's still unclear?" box: 4–8 questions a sharp reader would ask, each a fold that opens to a short answer and one evidence line (a `path:line` or a source link). No input boxes, no copy-back. Questions print open.
  - The `.unclear` part, its script, its CSS and `data-no-unclear` are gone.
  - `house-style.html` shows the new questions part and a scene that builds its picture step by step with `data-show`.
- 98376b2: Pages now define words the way a good textbook does, and stop defining words every engineer knows.
  
  - **Hover terms** (`<dfn class="term">` and `<abbr class="term">` with a `.term-def` card): a light dotted line under the word. Hover, Tab or a tap on a phone shows a small card with the meaning; moving off, tapping again or Escape closes it. The page adds the ids, `role="tooltip"` and `aria-describedby`. In print and the PDF the meaning shows in small type in brackets after the word. The `.vocab` line stays as a fallback for the one term a section is about.
  - **The reader is a software engineer by default** (`vocab.reader: engineer` in `settings.md`). `vocab-check.mjs` counts the new `vocab-engineer.txt` list (about 410 everyday software words: app, ticket, deploy, endpoint, customer, client, dashboard, email…) as common words. A page for a non-technical reader sets `<meta name="vocab-reader" content="general">`, or run the checker with `--reader general`.
  - The guidance in HOUSE-STYLE.md, PARTS.md and the html-plan and html-explain skills: define only real jargon, always spell out an acronym the first time, never define basic engineering words. `--verbose` lists acronyms nothing spells out.
  - **Fix:** inline `<code>` after "is" or "are" ("the default is `30`") no longer counts as passive voice.
  - A hover term's card is scored as its own sentence and glosses nothing, so a long definition can't lift the score.
- b8508c2: Drawings are now hand-written SVG only, with far more room to explain. Rough.js and the sketch look are gone (old pages keep working, since each one carries its own copy). New in the kit, all offline:
  
  - **Isometric 3D** (`svg.iso`): blocks, cylinders, stacked layers and routes written in floor units; the page draws the faces.
  - **Moving data** (`data-flow`): lit packets run along an edge while the drawing is on screen.
  - **Scenes** (`.scene`): Play, Back and Next through a system at work; a numbered list without the script and in print.
  - **Linked words** (`data-hl`): a word and a shape light up together.
  - **Expand** on every drawing (full window, zoom and pan), **wide** drawings (`data-span="wide"`) that use a big screen, and tap-to-expand on a phone.
  - **Five diagram hues** (teal, violet, ochre, rose, slate) plus a glow color, tuned for light and dark.
  - **Removed settings:** `drawings.own_pages`, `customer_pages` and `methods` are gone with the sketch look, along with the gear's drawing-style switch. A copy of `settings.md` that still sets them is ignored for those keys; nothing else changes.
  - HOUSE-STYLE.md now starts drawings with "reference or intuition?" and a toolbox; `house-style.html` shows every new kind live.

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
