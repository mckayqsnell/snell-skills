---
name: html-explain
description: 'Explain a topic as one HTML page that teaches it the way a good teacher would at a whiteboard: it picks the best way in for that topic and draws how the thing works, often as a 3D or moving drawing the reader can play. Use when the user says /html-explain, "explain X", "help me understand X", "ELI5 X", or asks for a learning doc for this session. Options: for:"who" writes it for someone else; keep saves the HTML and a PDF to the knowledge folder.'
---

# html-explain

Same look and parts as html-plan: both read the house-style kit in `kit/`.

**`kit/` is the folder next to this SKILL.md.** Use its full path when you run commands from the user's project, e.g. `cp <this skill's folder>/kit/explain-template.html explain/…`.

You make a page that makes something click. The reader is the user, unless they say `for:"…"`. They should get the gist from the first line, and understand it after one read.

Read `kit/HOUSE-STYLE.md` and `kit/PARTS.md` first (the "Explain parts" part too). `kit/settings.md` holds the defaults; a project or user `settings.md` wins. Copy `kit/explain-template.html`; don't read it whole (fonts are packed in).

## 1. Is a page worth it?

If the answer fits in a few sentences, answer in chat and offer the page in one line. Make a page when the topic has more than one moving part, needs a drawing, or the user asked for one.

## 2. Who is it for?

- **Default: the user.** Pitch it at a curious engineer who is new to this topic. Skip what they surely know. Read `settings.md` for anything it says about them.
- **`for:"…"`** (e.g. `for:"Dad"`, `for:"a new hire"`, `for:"a customer"`): write for that person. No code unless they write code. If they don't write code, put `<meta name="vocab-reader" content="general">` in the page: then the word check treats everyday software words (app, server, database) as hard words too. If you can't tell what they already know, ask one question, then go. For a customer: put no customer data in it.
- Don't grill. One question at most, only when the answer changes the page.

## 3. Get the facts right

- Read what the topic is about before you explain it: the code or files if there are any, else the official docs (the project's own site, the agency's own page).
- **Facts that change** (tax rules, prices, laws, versions, limits): check a primary source, and say the year or version on the page ("2026 rules"). Put the sources in a folded "Sources" section with the `.sources` list.
- **Tax, legal, money or health topics:** explain how the rule works, with a made-up example. Add one `note warn` line: "A general explanation, not advice for your own case." Name what the page leaves out (other rules that change the answer) in a short "What this leaves out" note. Never tell the reader what to do with their own money or health.

## 4. Write the page

You have a lot of room here. There is no fixed recipe: work out how this topic is best taught, then pick the tools that do it. The kit is your paint box, not a form to fill in.

### Set up

1. **Where it goes.** `explain/YYYY-MM-DD-topic.html` in the folder the user is working in. In a git repo, check with the page's own path, which works before the folder exists: `git check-ignore -q explain/<page>.html` exits 0 if it is ignored (fine). If not, `git ls-files explain/` prints something if pages are already committed there. If `explain/` is neither ignored nor already committed, say so before the page lands there; on a work repo, ask first. With `keep`, it goes to the knowledge folder instead (step 6).
2. **Copy the whole file** with `cp kit/explain-template.html <page>`, then edit it in place. Never rebuild it from pieces: a lost `<main>` silently drops the contents and the folds. Set `<title>` (`{{TOPIC}}`), `<meta name="page-file">` (the page's own path) and the top bar tag (`Explain · for {{me / who}} · {{DATE}}`: "me" when the reader is the user). Every `{{…}}` in the file is a placeholder, including those outside the sections; none may be left.

### Choose how to teach it

Before you write, ask: what does the reader need to see to get this? Then pick the way in that fits. Some good ones:

- **Watch it run.** For "how does X work": a scene with Play that walks one request, order or message through the system, step by step. The reader clicks Play and watches the whole thing at work.
- **Build it up.** Start with the problem, then add one part at a time as the story needs it (`data-show` in a scene). Good for "why does X exist".
- **Picture, then the real thing.** ELI5 layers (picture → real thing → where the picture breaks). Good for one hard idea with a strong everyday picture. All three layers are about the same idea: the real-thing layer says in real terms exactly what the picture showed, and nothing new.
- **Side by side.** Two ways of doing it (`.pair`), or a before and after drawing. Good for "X or Y?".
- **Follow the numbers.** A worked example the reader can check by hand. Good for anything with costs, limits or time.
- **A tour of the map.** One wide drawing of the whole system, with linked words (`data-hl`) so each paragraph lights up its part. Good for a codebase or a big system.

Mix them. Use what this topic needs and skip the rest. **Two explain pages should not look alike:** if your page looks like the template with the blanks filled in, start again from the question above.

### Draw the mechanism

- **At least one drawing.** Start from "reference or intuition?" in HOUSE-STYLE.md. For "how does it work", draw the mechanism, not a box with its name on it: a queue is a belt, layers are slabs, a request is a lit packet moving through the parts.
- **The toolbox** (all in the kit, markup in PARTS.md, live in `house-style.html`): isometric 3D (`svg.iso`), moving data (`data-flow`), scenes with Play (`.scene`), shapes that appear as the story goes (`data-show`), linked words (`data-hl`), and wide drawings (`data-span="wide"`) for a big screen.
- **When the topic has moving parts, at least one drawing moves or answers back:** packets on the busy paths, or a scene with Play. A still flowchart of a live system teaches less than the system running.
- No decoration. Every drawing teaches one thing, and its caption says what to notice.

### What every page keeps

- **Header:** the topic in 2–6 words, and a lede that holds the whole idea in 1–2 sentences. Someone who reads only the lede should get the gist.
- **Sections that each say one idea.** The `h2` is the takeaway as a plain sentence ("A cache trades freshness for speed"), not a label ("Caching"). 3–7 of them is usual.
- **A worked example with numbers** when the topic has numbers. Made-up numbers are fine if the example says so.
- **Facts checked** (step 3), with sources in a folded "Sources" section when you looked anything up.
- **Terms: hover cards only, and few of them.** The reader is a competent software engineer. Never define basic engineering words (app, ticket, deploy, endpoint, cron, migration, webhook). Define only real jargon from another field (backpressure, quorum) and words this project made up, each as a hover term where it first shows up (`<dfn class="term">` or `<abbr class="term">`, see PARTS.md). Every card ends with one `<span class="term-eg">` example from this page's topic. Spell out every acronym the first time, except the ones every engineer knows (API, URL, PR, CI, MCP, AWS, SQL and the like); SDK, OAuth or JWT still get a card. Most pages need 0 to 5 terms. Never a box or a line of its own for a term. The word check counts a term as explained only where it is defined in place.
- **Say where it simplifies.** Every picture, drawing or scene leaves something out. Say what, in one line near it, so it doesn't mislead later.
- **A bigger idea** (`.idea`) when a detail ties to something that holds elsewhere.
- **End with:** a recap (3–5 takeaways), then "Questions you might have". Add a folded glossary only when the page has 5 or more hover terms.

### Questions you might have

Near the end, answer what a sharp reader would ask next. Write 4–8 questions: an edge case ("what if the worker dies halfway?"), a "why not X?", what breaks, what it costs. Each is a fold (`details.q`, see PARTS.md) that opens to a short answer and one evidence line: a `path:line` in the code or a source link. "See the drawing above" can come after one of those, never in place of it. Only questions you can answer from what you read. If the honest answer is "it depends", say on what.

### Length

5–10 minutes to read. Bigger than that: explain the core and list the rest as "Next pages" in the recap. Offer them as a series.

## 5. Check, then hand over

1. **Browser check, headless,** if you have one (`playwright-cli -s=<name>`, headless by default; not a browser that opens a window on the user's screen): desktop light, desktop dark (emulate the dark color scheme, or pick Dark in the page's gear), phone at 390 px (resize the viewport). Serve the folder on localhost if `file://` is blocked. Also a wide screen (1600 px or more). No console errors, no sideways scroll except drawings and code in their own box. Press Play on a scene and watch it to the end. Open one drawing with Expand. Open one question. Point at a hover term (the card shows the word, the meaning and an example), then Tab to one and press Escape. Look at the screenshots yourself.
2. **No browser?** Don't install one without asking. Read it through instead: `<title>` set, one `<h1>`, every color a variable, no `{{` left, no web URLs. Say you checked it by reading.
3. **Placeholders:** `grep -n '{{' <page>` prints nothing.
4. **Words:** `node kit/vocab-check.mjs <page> --level <N>` must pass, where N is `vocab.level` in `settings.md` (default 80). For `for:"…"` a non-technical reader, aim higher. Fix every `WARN` it prints: more than 8 hover terms, a card with no example, or an old `.vocab` box.
5. **Can't fix something?** Say it in one sentence and hand over anyway.
6. **Open it** (`open` on Mac, `xdg-open` on Linux, `start` on Windows). No screen: print the path. Tell the user the path in one line.

## 6. keep: save the HTML and a PDF

When the user says `keep` (or "save it", "I want the PDF"):

1. Find the knowledge folder: the `MY_SKILLS_KNOWLEDGE_DIR` environment variable, else `explain.keep_dir` in the user's or project's `settings.md`. None set? Ask once where to save, and suggest setting `MY_SKILLS_KNOWLEDGE_DIR` in their shell profile. Never guess a path.
2. Save the page there as `<topic-kebab>.html`, where the topic is the page's `h1` in lowercase with dashes. If that name exists and is a different page, add the date.
3. Point the kept copy's `<meta name="page-file">` at its new path. The first copy in `explain/` stays where it is.
4. Run `kit/html-to-pdf.sh <page>`. It writes `<topic-kebab>.pdf` next to the page, in the light theme, with folds and questions open.
5. Look at the first page of the PDF and one page with a drawing. It must match the page: same fonts, colors and drawings.
6. Tell the user both paths. Regenerating the PDF is cheap; do it again after real changes.

## 7. Session mode (a learning doc for this session)

When the user asks for a learning doc for the session ("keep a learning doc", "explain as we go"):

1. Start one page for the session's topic, and save it as in `keep`.
2. As the session turns up something worth learning, add a concept section or extend one. Say so in one line ("Added 'why the lock fails' to the learning doc"). Don't stop the main work to do it.
3. Keep it a textbook, not a log: group by idea, not by time. Rewrite the recap as it grows.
4. Make the PDF when the user asks, or offer once at a natural stop.
