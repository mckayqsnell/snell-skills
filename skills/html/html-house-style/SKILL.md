---
name: html-house-style
description: 'The shared look for HTML pages an agent makes for a person to read, such as reviews, reports, guides and one-off pages: colors, fonts, page parts, hand-drawn style drawings, a drawing viewer, a response box and the writing rules, all in one offline file. Use when the user asks for an HTML page, a "nice page" or a "page I can read" that is not a plan (use html-plan) or an explainer (use html-explain), or says to use the house style.'
---

# html-house-style

One look for every page: warm paper colors, packed-in serif and sans fonts, folding sections, notes, tables that turn into cards on a phone, drawings in a hand-drawn sketch style, and a box that turns the reader's picks and notes into one reply to paste back. html-plan and html-explain use the same kit; this skill is for every other page.

Everything lives in `kit/`, the folder next to this SKILL.md. Use its full path when you run commands from the user's project. Start there:

1. Read `kit/HOUSE-STYLE.md` (the rules) and `kit/PARTS.md` (every part, with markup). Open `kit/house-style.html` in a browser to see them live.
2. Copy a starter whole with `cp`: `kit/page.html` for a plain page (most pages), `kit/template.html` for a page with decisions, `kit/explain-template.html` for a page that teaches. Edit the copy in place. Keep its `<style>` and `<script>` blocks. Fill every `{{…}}`, including `<title>` and the top bar tag; `grep -n '{{' <page>` must print nothing.
3. Use only the parts in PARTS.md, and only the colors and sizes in the CSS variables.
4. Check it the way HOUSE-STYLE.md says: light, dark, a 390 px phone, no console errors, and `node kit/vocab-check.mjs <page> --level <N>`, where N is `vocab.level` in `settings.md` (default 80).
5. Need a PDF? `kit/html-to-pdf.sh <page>` (needs Chrome, Chromium or Edge).

Defaults are in `kit/settings.md`. A `settings.md` in the project, then the user's own, wins over it.

Pages that go to customers or outside people: set `data-drawings="clean"` on `<html>`, delete the Rough.js `<script>`, and put no customer data in the page.
