# Web apps

How to explore, sign in to and record a web app. The core steps are in `../SKILL.md`.

## Get the newest Playwright features first

Playwright and `playwright-cli` ship recording features often. Before you write the scene script, pull the current docs in one or two lookups: context7 `query-docs` on "page.screencast and playwright-cli video commands", or the release notes at `https://playwright.dev/docs/release-notes`. Use any newer feature that makes the video better, and note it in `NOTES.md`. As of Playwright 1.64:

- `page.screencast.start({ onFrame, path, size, fps, quality })`: `onFrame` gets each JPEG frame with its timestamp (what `recorder.mjs` uses); `path` writes a WebM itself.
- `page.screencast.showActions({ cursor: 'none' | 'pointer', duration, position, style: { point, highlight, title } })`: draws an animated cursor, a click point, a box on the target and an action title. `hideActions()` stops it.
- `page.screencast.showChapter(title, { description, duration })`: a full-screen card over a blurred page.
- `page.screencast.showOverlay(html, { duration })`: any HTML on top of the page (`pointer-events: none`). Dispose it to remove it.

## Which tool for what

| Job | Tool | Why |
|---|---|---|
| Explore: find features, read the page, try a flow, get locators | Playwright MCP (`browser_snapshot`, `browser_click`, …) or `playwright-cli` (`open`, `snapshot`, `click e12`) | Fast to poke at; snapshots give roles and names for locators. Use whichever is loaded; both are fine. |
| Look at a screen | `browser_take_screenshot` or `playwright-cli screenshot` | To judge the look and pick zoom targets. |
| Record the real takes | `recorder/scenes.mjs` (Node, `recorder.mjs`) | Exact timing, 3200 px frames at 60 fps, and the event log the edit needs. The MCP and CLI can't give you the log. |
| Quick mode take | `playwright-cli run-code --filename take.js` or a Node script | Playwright's own cursor and cards; see `../references/quick.md`. |

Run every browser headless. Keep one browser open at a time.

A dev server on self-signed HTTPS: headless `playwright-cli open` needs `ignoreHTTPSErrors: true` in `.playwright/cli.config.json` (add it to the scratch list). Or explore with a short Node script that calls recorder's `launch()`: it already ignores certificate errors and is as headless as the real take. Some composers ignore `fill` then `press Enter`; type with key presses as a person would.

## Sign in and data

In this order:

1. **The app's own test login:** a test-login route, a seed or reset command, fixture users (search the repo for `test-login`, `seed`, `fixtures`, `reset`, `.env.example`). Put the reset at the top of each scene, so every take starts the same.
2. **A saved sign-in:** sign in once with `playwright-cli`, then `state-save auth.json`, and pass it to `launch({ storageState: 'auth.json' })`. Add `auth.json` to the run's scratch list (`node recorder/cleanup.mjs --add-scratch auth.json`): it holds live cookies.
3. **The user's own Chrome** (the Playwright Extension) only when the app needs their real sign-in and nothing above works. `playwright-cli attach --extension` reads the token from `PLAYWRIGHT_MCP_EXTENSION_TOKEN`; never print it or write it to a file. Use it to explore and to save a sign-in state, then record headless from that state.

## Launch settings

`launch()` in `recorder.mjs` handles these; know them when something looks wrong:

- **Sharp frames need a forced scale.** Chrome sends screencast frames at CSS-pixel size unless the whole browser runs with `--force-device-scale-factor`. A context `deviceScaleFactor` alone gives 1280-wide frames. 1280×720 CSS at 2.5× gives 3200×1800 frames, enough for a 1.67× zoom with no upscaling.
- **Headless keeps about 87 px for a hidden toolbar,** so the window is taller than the page. `launch()` checks the page size and says what to change if it differs.
- **1280×720 CSS is a good demo size:** the UI is big in the frame. For `vertical`, use a phone-shaped page (for example 432×768 at 2.5×).
- **The frame rate follows the page.** The screencast only sends a frame when something paints, so a still page gives few frames; `recorder.mjs` holds each frame until the next one, so the MP4 is a true 60 fps. Many gaps over 40 ms are normal on a UI take (often more than half the frames, on a page that mostly sits still); check `longGapsMs` only around motion you expect to be smooth, like a scroll or an animation.
- **Theme:** `launch({ theme: 'dark' })` sets `prefers-color-scheme`; an app with its own toggle may need its saved setting (localStorage) set before the page loads.

## Driving the page like a person

- Use `rec.click()`, `rec.dblclick()`, `rec.type()`, `rec.press()` and `rec.scroll()`, never bare `page.click()` or `page.mouse` during a take: the bare calls skip the log, so the drawn cursor and the sounds miss them.
- End each take with a hold (`await rec.sleep(2500)` before `rec.stop()`): the recorder keeps the last frame on screen until `stop()`.
- `rec.type(text, { fast: true })` types a long prompt in about a second, so the edit can keep typing at 1× with key sounds in step.
- Log a `rec.box(label, locator)` for every zoom target in the shot list, after the thing is on screen and settled. Log a `rec.mark(label)` for every moment the edit cuts on (sent, done, saved).
- Wait on the app's own signal (a busy attribute, a spinner gone, a toast), not on a fixed sleep. For an animation worth syncing, call `await rec.watchAttr(selector, attr, value, label)` after the page loads: it logs a mark with the element's rect each time that attribute changes. Prove it in the 10 s test take; if it logs nothing, find the frame with `peaks.mjs`.
- Hold 1.5–3 s on every result. The edit can trim footage; it can't invent it.

## Gotchas

- **Saved state leaks between takes** (a mode left on, a draft, a dismissed tip). Reset it at the start of every scene.
- **Auto-scroll** can carry an answer past the part worth showing. Scroll back like a reader would, with `rec.scroll()`.
- **Layouts move after they load** (a canvas re-fits after every node, a list grows). Log a fresh `rec.box()` at each mark, and frame the payoff from the last frame's layout, not where things started.
- **Dev overlays** (framework error badges, prototype switchers, version tags) come back on every page load. Hide them with `page.addStyleTag` after each `goto`, not once.
- **A DOM signal is not the frame.** An attribute can change long before the pixels do. Check the moment on a 60 fps contact sheet before you sync sound to it.

## Clean up

- `scenes.mjs` closes its browser in a `finally`, so a failed take leaves nothing running.
- Explore with named `playwright-cli` sessions (`-s=demo-explore`), log each one (`node recorder/cleanup.mjs --add-session demo-explore`), and close them when you're done. With the MCP, call `browser_close`.
- Each `playwright-cli attach --extension` opens a tab in a "Playwright" tab group in the user's Chrome. Close every tab you opened there (`playwright-cli tab-list`, then `tab-close <n>`) before you finish. Leave the user's own tabs alone.
- Delete `.playwright-cli/` and `.playwright-mcp/` folders you created in the app's repo.
