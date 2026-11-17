---
"snell-skills": minor
---

Pages now define words the way a good textbook does, and stop defining words every engineer knows.

- **Hover terms** (`<dfn class="term">` and `<abbr class="term">` with a `.term-def` card): a light dotted line under the word. Hover, Tab or a tap on a phone shows a small card with the meaning; moving off, tapping again or Escape closes it. The page adds the ids, `role="tooltip"` and `aria-describedby`. In print and the PDF the meaning shows in small type in brackets after the word. The `.vocab` line stays as a fallback for the one term a section is about.
- **The reader is a software engineer by default** (`vocab.reader: engineer` in `settings.md`). `vocab-check.mjs` counts the new `vocab-engineer.txt` list (about 460 everyday software words: app, ticket, deploy, endpoint, customer, client, dashboard, email…) as common words. A page for a non-technical reader sets `<meta name="vocab-reader" content="general">`, or run the checker with `--reader general`.
- The guidance in HOUSE-STYLE.md, PARTS.md and the html-plan and html-explain skills: define only real jargon, always spell out an acronym the first time, never define basic engineering words. `--verbose` lists acronyms nothing spells out.
- **Fix:** inline `<code>` after "is" or "are" ("the default is `30`") no longer counts as passive voice.
- A hover term's card is scored as its own sentence and glosses nothing, so a long definition can't lift the score.
