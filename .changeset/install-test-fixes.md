---
"snell-skills": patch
---

Fixes from a first real install of the plugin:

- **Snell Mono** is now the Regular weight. The packed copy was the ExtraLight cut labeled as Regular, so code and labels looked faint.
- **New `kit/page.html`**, a plain starter for any page that isn't a plan or an explainer. html-house-style now points to it.
- **Every placeholder is named.** html-plan and html-explain list the `<title>` and top-bar tag placeholders, and both check with `grep '{{'` before handing over.
- **Fairer word check.** `vocab-check.mjs` counts a term as explained only where the page defines it in place (`<dfn>`, `<abbr>` or `.term`), plurals included. Glossary entries alone no longer raise the score. Technical pages pass by defining their few core terms in place.
- **Removed pointers to things that don't exist yet:** `/anatomy` and the `/setup-snell-skills` wizard.
- **Clearer git step:** the git check before writing `plans/` or `explain/` uses the page's own path, so it works before the folder exists.
