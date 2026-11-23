---
"snell-skills": minor
---

New skill: **e2e-test**, in a new `dev` group. Run `/e2e-test` after you build something. It works out what changed from the git diff, the plan and the chat, then tests it in the real app with a headless browser: happy path, edges, error states (with request mocks), light and dark, phone and wide, console errors, failed requests and keyboard reach. It follows each click to the network request, the server log and a read-only look at the data, then smoke-tests the app's core flows (and offers to save them as `e2e-flows.md`). It fixes bugs in code the session wrote, asks before touching older code, reports pass/fail in chat (plus an html-house-style page with screenshots for a big run) and closes every browser, tab and scratch file it opened. Web apps and APIs have their own guides; iOS points to the iOS Simulator tool for now.

Gemini CLI users: install the new group with `gemini skills install https://github.com/mckayqsnell/snell-skills.git --path skills/dev`.
